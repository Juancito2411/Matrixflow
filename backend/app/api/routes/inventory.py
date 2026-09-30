from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from typing import Optional
from app.core.config import supabase

router = APIRouter()

# ------------------------------------------------------------------
# ESQUEMAS PYDANTIC
# ------------------------------------------------------------------
class InventoryUpdate(BaseModel):
    branch_id: int
    product_id: int
    stock: int

class MovementCreate(BaseModel):
    inventory_id: int
    movement_type: str  # 'IN', 'OUT', 'ADJUSTMENT'
    quantity: int


# ------------------------------------------------------------------
# ENDPOINTS DE INVENTARIO (RF-06)
# ------------------------------------------------------------------

@router.get("/inventory", status_code=status.HTTP_200_OK)
def get_inventory():
    """
    Obtener el listado general de inventario por sucursal y producto.
    """
    try:
        # Hacemos JOIN con sucursales y productos para traer nombres y precios
        response = supabase.table("inventory")\
            .select("*, branches(name), products(code, name, unit_price, category_id)")\
            .execute()
        return {"success": True, "data": response.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al consultar el inventario: {str(e)}")


@router.post("/inventory", status_code=status.HTTP_200_OK)
def set_or_update_stock(item: InventoryUpdate):
    """
    Asignar o actualizar el stock de un producto en una sucursal específica.
    Si la fila no existe la crea (UPSERT).
    """
    try:
        # 1. Verificar si ya existe el registro de inventario para esa sucursal y producto
        existing = supabase.table("inventory")\
            .select("*")\
            .eq("branch_id", item.branch_id)\
            .eq("product_id", item.product_id)\
            .execute()

        if existing.data:
            inventory_id = existing.data[0]["id"]
            # Actualizar stock
            res = supabase.table("inventory")\
                .update({"stock": item.stock})\
                .eq("id", inventory_id)\
                .execute()
            updated_item = res.data[0]
        else:
            # Crear registro desde cero
            res = supabase.table("inventory")\
                .insert({"branch_id": item.branch_id, "product_id": item.product_id, "stock": item.stock})\
                .execute()
            updated_item = res.data[0]
            inventory_id = updated_item["id"]

        # 2. Registrar movimiento de auditoría/inventario tipo ADJUSTMENT
        supabase.table("inventory_movements").insert({
            "inventory_id": inventory_id,
            "movement_type": "ADJUSTMENT",
            "quantity": item.stock
        }).execute()

        return {"success": True, "data": updated_item, "message": "Stock actualizado correctamente"}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al actualizar el inventario: {str(e)}")


@router.get("/inventory/movements", status_code=status.HTTP_200_OK)
def get_inventory_movements():
    """
    Consultar el historial de movimientos de inventario (Entradas, Salidas y Ajustes).
    """
    try:
        response = supabase.table("inventory_movements")\
            .select("*, inventory(branch_id, products(name, code))")\
            .order("created_at", desc=True)\
            .execute()
        return {"success": True, "data": response.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al obtener movimientos: {str(e)}")


@router.post("/inventory/movements", status_code=status.HTTP_201_CREATED)
def register_movement(movement: MovementCreate):
    """
    Registrar una entrada (IN) o ajuste manual y actualizar el stock correspondientemente.
    """
    try:
        # 1. Obtener registro de inventario actual
        inv_res = supabase.table("inventory").select("*").eq("id", movement.inventory_id).execute()
        if not inv_res.data:
            raise HTTPException(status_code=404, detail="El inventario especificado no existe")

        current_inv = inv_res.data[0]
        current_stock = current_inv["stock"]

        # 2. Calcular nuevo stock
        if movement.movement_type == "IN":
            new_stock = current_stock + movement.quantity
        elif movement.movement_type == "OUT":
            new_stock = max(0, current_stock - movement.quantity)
        elif movement.movement_type == "ADJUSTMENT":
            new_stock = movement.quantity
        else:
            raise HTTPException(status_code=400, detail="Tipo de movimiento no válido. Usar 'IN', 'OUT' o 'ADJUSTMENT'")

        # 3. Guardar nuevo stock
        supabase.table("inventory").update({"stock": new_stock}).eq("id", movement.inventory_id).execute()

        # 4. Insertar el historial del movimiento
        mov_res = supabase.table("inventory_movements").insert({
            "inventory_id": movement.inventory_id,
            "movement_type": movement.movement_type,
            "quantity": movement.quantity
        }).execute()

        return {"success": True, "data": mov_res.data[0], "new_stock": new_stock}

    except HTTPException as http_err:
        raise http_err
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al registrar movimiento: {str(e)}")