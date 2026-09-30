from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from typing import Optional, List
from app.core.config import supabase

router = APIRouter()

# ------------------------------------------------------------------
# ESQUEMAS PYDANTIC (Validación de entrada y salida)
# ------------------------------------------------------------------
class ProductCreate(BaseModel):
    category_id: Optional[int] = None
    code: str
    name: str
    unit_price: float

class ProductUpdate(BaseModel):
    category_id: Optional[int] = None
    code: Optional[str] = None
    name: Optional[str] = None
    unit_price: Optional[float] = None

class CategoryCreate(BaseModel):
    name: str
    description: Optional[str] = None


# ------------------------------------------------------------------
# ENDPOINTS DE CATEGORÍAS
# ------------------------------------------------------------------

@router.get("/categories", status_code=status.HTTP_200_OK)
def get_categories():
    """ Obtener todas las categorías """
    try:
        response = supabase.table("categories").select("*").execute()
        return {"success": True, "data": response.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al obtener categorías: {str(e)}")


@router.post("/categories", status_code=status.HTTP_201_CREATED)
def create_category(category: CategoryCreate):
    """ Crear una nueva categoría """
    try:
        response = supabase.table("categories").insert(category.dict()).execute()
        return {"success": True, "data": response.data[0]}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error al crear categoría: {str(e)}")


# ------------------------------------------------------------------
# ENDPOINTS DE PRODUCTOS (CRUD)
# ------------------------------------------------------------------

@router.get("/products", status_code=status.HTTP_200_OK)
def get_products():
    """ 
    Obtener todos los productos relacionando su categoría 
    (READ)
    """
    try:
        # Hacemos un JOIN implícito con la tabla categories usando la foreign key
        response = supabase.table("products").select("*, categories(name)").execute()
        return {"success": True, "data": response.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al consultar productos: {str(e)}")


@router.get("/products/{product_id}", status_code=status.HTTP_200_OK)
def get_product(product_id: int):
    """ Obtener un producto por ID """
    try:
        response = supabase.table("products").select("*, categories(name)").eq("id", product_id).execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="Producto no encontrado")
        return {"success": True, "data": response.data[0]}
    except HTTPException as http_err:
        raise http_err
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al obtener el producto: {str(e)}")


@router.post("/products", status_code=status.HTTP_201_CREATED)
def create_product(product: ProductCreate):
    """ 
    Crear un nuevo producto 
    (CREATE)
    """
    try:
        response = supabase.table("products").insert(product.dict()).execute()
        if not response.data:
            raise HTTPException(status_code=400, detail="No se pudo registrar el producto")
        return {"success": True, "data": response.data[0]}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error al guardar producto: {str(e)}")


@router.put("/products/{product_id}", status_code=status.HTTP_200_OK)
def update_product(product_id: int, product: ProductUpdate):
    """ 
    Actualizar un producto por ID 
    (UPDATE)
    """
    try:
        # Filtramos solo los campos enviados para no sobrescribir con Nones
        update_data = {k: v for k, v in product.dict().items() if v is not None}
        
        if not update_data:
            raise HTTPException(status_code=400, detail="No se proporcionaron campos para actualizar")

        response = supabase.table("products").update(update_data).eq("id", product_id).execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail="Producto no encontrado para actualizar")
            
        return {"success": True, "data": response.data[0]}
    except HTTPException as http_err:
        raise http_err
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al actualizar producto: {str(e)}")


@router.delete("/products/{product_id}", status_code=status.HTTP_200_OK)
def delete_product(product_id: int):
    """ 
    Eliminar un producto por ID 
    (DELETE)
    """
    try:
        response = supabase.table("products").delete().eq("id", product_id).execute()
        return {"success": True, "message": f"Producto {product_id} eliminado exitosamente"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al eliminar producto: {str(e)}")