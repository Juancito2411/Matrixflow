from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel, Field
from typing import Optional, List
from app.core.config import supabase
from app.core.security import get_current_user

# --- ESTA LÍNEA ES IMPRESCINDIBLE ---
router = APIRouter()


# ------------------------------------------------------------------
# ESQUEMAS PYDANTIC (Para la gestión de Metas / RF-07)
# ------------------------------------------------------------------
class TargetCreate(BaseModel):
    branch_id: int = Field(..., description="ID de la sucursal asignada")
    period: str = Field(..., description="Ej: '2026-Q1' o '2026-09'")
    target_amount: float = Field(..., gt=0, description="Monto objetivo de ventas")


# ------------------------------------------------------------------
# ENDPOINTS DE METAS / TARGETS (RF-07)
# ------------------------------------------------------------------

@router.get("/targets", status_code=status.HTTP_200_OK)
def get_targets():
    """ Obtener todas las metas por sucursal """
    try:
        response = supabase.table("targets").select("*, branches(name)").execute()
        return {"success": True, "data": response.data or []}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al obtener metas: {str(e)}")


@router.post("/targets", status_code=status.HTTP_201_CREATED)
def create_target(
    target: TargetCreate,
    current_user: dict = Depends(get_current_user)
):
    """ Registrar una nueva meta de ventas """
    try:
        response = supabase.table("targets").insert(target.dict()).execute()
        return {"success": True, "data": response.data[0]}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error al registrar meta: {str(e)}")


# ------------------------------------------------------------------
# ENDPOINTS DE REPORTES Y DASHBOARD
# ------------------------------------------------------------------

@router.get("/reports", status_code=status.HTTP_200_OK)
def get_reports():
    try:
        sales_res = supabase.table("sales").select("total_amount").execute()
        sales_data = sales_res.data or []
        total_sales_amount = sum(float(item.get("total_amount", 0)) for item in sales_data)
        total_sales_count = len(sales_data)

        ops_res = supabase.table("operations").select("id", count="exact").execute()
        operations_count = ops_res.count if ops_res.count is not None else len(ops_res.data or [])

        prod_res = supabase.table("products").select("id", count="exact").execute()
        products_count = prod_res.count if prod_res.count is not None else len(prod_res.data or [])

        return {
            "success": True,
            "data": {
                "total_ventas_monto": total_sales_amount,
                "total_ventas_cantidad": total_sales_count,
                "operaciones_ejecutadas": operations_count,
                "total_productos": products_count
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al generar reportes generales: {str(e)}")


@router.get("/reports/summary", status_code=status.HTTP_200_OK)
def get_full_reports_summary():
    try:
        # 1. Ventas por Sucursal
        sales_res = supabase.table("sales").select("total_amount, branch_id, branches(name)").execute()
        sales_data = sales_res.data or []
        branch_totals = {}
        for sale in sales_data:
            branch_info = sale.get("branches")
            branch_name = branch_info.get("name") if isinstance(branch_info, dict) else "General"
            amount = float(sale.get("total_amount") or 0)
            branch_totals[branch_name] = branch_totals.get(branch_name, 0.0) + amount

        # 2. Ventas por Producto
        items_res = supabase.table("sale_details").select("quantity, unit_price, products(name)").execute()
        items_data = items_res.data or []
        product_totals = {}
        for item in items_data:
            prod_info = item.get("products")
            product_name = prod_info.get("name") if isinstance(prod_info, dict) else "Producto"
            subtotal = float(item.get("quantity") or 0) * float(item.get("unit_price") or 0)
            product_totals[product_name] = product_totals.get(product_name, 0.0) + subtotal

        # 3. Cumplimiento de Metas
        targets_res = supabase.table("targets").select("*, branches(name)").execute()
        targets_data = targets_res.data or []
        targets_summary = []
        for t in targets_data:
            b_info = t.get("branches")
            b_name = b_info.get("name") if isinstance(b_info, dict) else "Sucursal"
            t_amount = float(t.get("target_amount") or 1)
            achieved = branch_totals.get(b_name, 0.0)
            pct = round((achieved / t_amount) * 100, 2) if t_amount > 0 else 0.0

            targets_summary.append({
                "branch": b_name,
                "period": t.get("period", "N/A"),
                "target_amount": t_amount,
                "achieved_amount": achieved,
                "percentage": pct
            })

        # 4. Inventario
        inv_res = supabase.table("inventory").select("stock, products(name)").execute()
        inv_data = inv_res.data or []
        inventory_summary = []
        for inv in inv_data:
            p_info = inv.get("products")
            inventory_summary.append({
                "product": p_info.get("name") if isinstance(p_info, dict) else "N/A",
                "stock": inv.get("stock", 0)
            })

        # 5. Operaciones
        ops_res = supabase.table("operations").select("id", count="exact").execute()
        total_ops = ops_res.count if ops_res.count is not None else len(ops_res.data or [])

        return {
            "success": True,
            "data": {
                "sales_by_branch": [{"branch": k, "total": v} for k, v in branch_totals.items()],
                "sales_by_product": [{"product": k, "total": v} for k, v in product_totals.items()],
                "targets": targets_summary,
                "inventory": inventory_summary,
                "total_operations": total_ops
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al generar reporte unificado: {str(e)}")


@router.get("/reports/sales-by-branch", status_code=status.HTTP_200_OK)
def get_sales_by_branch():
    try:
        res = supabase.table("sales").select("total_amount, branch_id, branches(name)").execute()
        sales_data = res.data or []
        
        branch_totals = {}
        for sale in sales_data:
            branch_info = sale.get("branches")
            branch_name = branch_info.get("name") if isinstance(branch_info, dict) else "Desconocida"
            amount = float(sale.get("total_amount") or 0)
            branch_totals[branch_name] = branch_totals.get(branch_name, 0.0) + amount

        formatted_data = [{"branch": k, "total": v} for k, v in branch_totals.items()]
        return {"success": True, "data": formatted_data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al calcular ventas por sucursal: {str(e)}")