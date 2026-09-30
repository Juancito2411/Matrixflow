from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from typing import List, Optional
from app.core.config import supabase

router = APIRouter()

# ------------------------------------------------------------------
# ESQUEMAS PYDANTIC
# ------------------------------------------------------------------
class SaleDetailItem(BaseModel):
    product_id: int
    quantity: int
    unit_price: float

class SaleCreate(BaseModel):
    branch_id: int
    user_id: Optional[int] = None
    total_amount: float
    items: List[SaleDetailItem]


# ------------------------------------------------------------------
# ENDPOINTS DE VENTAS (RF-05)
# ------------------------------------------------------------------

@router.get("/sales", status_code=status.HTTP_200_OK)
def get_sales():
    """
    Obtener el historial general de ventas relacionando 
    la sucursal y el usuario que vendió.
    """
    try:
        # Consulta relacional con la sucursal y usuario
        response = supabase.table("sales").select("*, branches(name), users(full_name, email)").order("created_at", desc=True).execute()
        return {"success": True, "data": response.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al consultar ventas: {str(e)}")


@router.get("/sales/{sale_id}", status_code=status.HTTP_200_OK)
def get_sale_detail(sale_id: int):
    """
    Obtener la cabecera y el desglose de productos de una venta en específico.
    """
    try:
        # 1. Cabecera de la venta
        sale_res = supabase.table("sales").select("*, branches(name), users(full_name)").eq("id", sale_id).execute()
        if not sale_res.data:
            raise HTTPException(status_code=404, detail="Venta no encontrada")

        # 2. Detalles (ítems/productos)
        details_res = supabase.table("sale_details").select("*, products(code, name)").eq("sale_id", sale_id).execute()

        result = sale_res.data[0]
        result["items"] = details_res.data

        return {"success": True, "data": result}
    except HTTPException as http_err:
        raise http_err
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al obtener detalle de la venta: {str(e)}")


@router.post("/sales", status_code=status.HTTP_201_CREATED)
def create_sale(sale: SaleCreate):
    """
    Registrar una venta completa:
    1. Guarda la cabecera en 'sales'.
    2. Guarda los renglones en 'sale_details'.
    3. Resta el stock en la tabla 'inventory' e inserta el movimiento 'OUT' en 'inventory_movements'.
    """
    try:
        # 1. Insertar la cabecera de la venta
        sale_data = {
            "branch_id": sale.branch_id,
            "user_id": sale.user_id,
            "total_amount": sale.total_amount
        }
        sale_res = supabase.table("sales").insert(sale_data).execute()
        
        if not sale_res.data:
            raise HTTPException(status_code=400, detail="No se pudo registrar la venta")

        created_sale = sale_res.data[0]
        sale_id = created_sale["id"]

        # 2. Registrar los detalles y actualizar inventario
        for item in sale.items:
            subtotal = item.quantity * item.unit_price
            detail_data = {
                "sale_id": sale_id,
                "product_id": item.product_id,
                "quantity": item.quantity,
                "unit_price": item.unit_price,
                "subtotal": subtotal
            }
            supabase.table("sale_details").insert(detail_data).execute()

            # 3. Buscar y descontar el inventario de la sucursal
            inv_res = supabase.table("inventory")\
                .select("*")\
                .eq("branch_id", sale.branch_id)\
                .eq("product_id", item.product_id)\
                .execute()

            if inv_res.data:
                current_inventory = inv_res.data[0]
                new_stock = max(0, current_inventory["stock"] - item.quantity)

                # Actualizar stock
                supabase.table("inventory").update({"stock": new_stock}).eq("id", current_inventory["id"]).execute()

                # Registrar movimiento de salida
                supabase.table("inventory_movements").insert({
                    "inventory_id": current_inventory["id"],
                    "movement_type": "OUT",
                    "quantity": item.quantity
                }).execute()

        return {"success": True, "message": "Venta registrada exitosamente", "data": created_sale}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error procesando la venta: {str(e)}")