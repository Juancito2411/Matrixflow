from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from typing import Optional
from app.core.config import supabase

router = APIRouter()

# ------------------------------------------------------------------
# ESQUEMAS PYDANTIC
# ------------------------------------------------------------------
class BranchCreate(BaseModel):
    company_id: int
    name: str
    location: Optional[str] = None

class BranchUpdate(BaseModel):
    company_id: Optional[int] = None
    name: Optional[str] = None
    location: Optional[str] = None


# ------------------------------------------------------------------
# ENDPOINTS DE SUCURSALES (RF-03)
# ------------------------------------------------------------------

@router.get("/branches", status_code=status.HTTP_200_OK)
def get_branches(company_id: Optional[int] = None):
    """
    Obtener todas las sucursales, con la opción de filtrar por 'company_id'
    e incluyendo los datos de la empresa correspondiente.
    """
    try:
        query = supabase.table("branches").select("*, companies(name, tax_id)")
        
        if company_id:
            query = query.eq("company_id", company_id)
            
        response = query.order("created_at", desc=True).execute()
        return {"success": True, "data": response.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al obtener sucursales: {str(e)}")


@router.get("/branches/{branch_id}", status_code=status.HTTP_200_OK)
def get_branch(branch_id: int):
    """ Obtener una sucursal por ID """
    try:
        response = supabase.table("branches").select("*, companies(name)").eq("id", branch_id).execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="Sucursal no encontrada")
        return {"success": True, "data": response.data[0]}
    except HTTPException as http_err:
        raise http_err
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al consultar la sucursal: {str(e)}")


@router.post("/branches", status_code=status.HTTP_201_CREATED)
def create_branch(branch: BranchCreate):
    """ Crear una nueva sucursal """
    try:
        response = supabase.table("branches").insert(branch.dict()).execute()
        if not response.data:
            raise HTTPException(status_code=400, detail="No se pudo registrar la sucursal")
        return {"success": True, "data": response.data[0]}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error al guardar la sucursal: {str(e)}")


@router.put("/branches/{branch_id}", status_code=status.HTTP_200_OK)
def update_branch(branch_id: int, branch: BranchUpdate):
    """ Actualizar datos de una sucursal """
    try:
        update_data = {k: v for k, v in branch.dict().items() if v is not None}
        if not update_data:
            raise HTTPException(status_code=400, detail="No se enviaron datos para actualizar")

        response = supabase.table("branches").update(update_data).eq("id", branch_id).execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="Sucursal no encontrada para actualizar")

        return {"success": True, "data": response.data[0]}
    except HTTPException as http_err:
        raise http_err
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al actualizar la sucursal: {str(e)}")


@router.delete("/branches/{branch_id}", status_code=status.HTTP_200_OK)
def delete_branch(branch_id: int):
    """ Eliminar una sucursal por ID """
    try:
        response = supabase.table("branches").delete().eq("id", branch_id).execute()
        return {"success": True, "message": f"Sucursal {branch_id} eliminada correctamente"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al eliminar la sucursal: {str(e)}")