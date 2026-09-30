from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from typing import Optional
from app.core.config import supabase

router = APIRouter()

# ------------------------------------------------------------------
# ESQUEMAS PYDANTIC
# ------------------------------------------------------------------
class CompanyCreate(BaseModel):
    name: str
    tax_id: str  # RUC / NIT
    address: Optional[str] = None

class CompanyUpdate(BaseModel):
    name: Optional[str] = None
    tax_id: Optional[str] = None
    address: Optional[str] = None


# ------------------------------------------------------------------
# ENDPOINTS DE EMPRESAS (RF-03)
# ------------------------------------------------------------------

@router.get("/companies", status_code=status.HTTP_200_OK)
def get_companies():
    """ Obtener el listado de todas las empresas """
    try:
        response = supabase.table("companies").select("*").order("created_at", desc=True).execute()
        return {"success": True, "data": response.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al obtener empresas: {str(e)}")


@router.get("/companies/{company_id}", status_code=status.HTTP_200_OK)
def get_company(company_id: int):
    """ Obtener una empresa por ID """
    try:
        response = supabase.table("companies").select("*").eq("id", company_id).execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="Empresa no encontrada")
        return {"success": True, "data": response.data[0]}
    except HTTPException as http_err:
        raise http_err
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al consultar la empresa: {str(e)}")


@router.post("/companies", status_code=status.HTTP_201_CREATED)
def create_company(company: CompanyCreate):
    """ Crear una nueva empresa """
    try:
        response = supabase.table("companies").insert(company.dict()).execute()
        if not response.data:
            raise HTTPException(status_code=400, detail="No se pudo registrar la empresa")
        return {"success": True, "data": response.data[0]}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error al guardar la empresa: {str(e)}")


@router.put("/companies/{company_id}", status_code=status.HTTP_200_OK)
def update_company(company_id: int, company: CompanyUpdate):
    """ Actualizar datos de una empresa """
    try:
        update_data = {k: v for k, v in company.dict().items() if v is not None}
        if not update_data:
            raise HTTPException(status_code=400, detail="No se enviaron datos para actualizar")

        response = supabase.table("companies").update(update_data).eq("id", company_id).execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="Empresa no encontrada para actualizar")

        return {"success": True, "data": response.data[0]}
    except HTTPException as http_err:
        raise http_err
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al actualizar la empresa: {str(e)}")


@router.delete("/companies/{company_id}", status_code=status.HTTP_200_OK)
def delete_company(company_id: int):
    """ Eliminar una empresa por ID """
    try:
        response = supabase.table("companies").delete().eq("id", company_id).execute()
        return {"success": True, "message": f"Empresa {company_id} eliminada correctamente"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al eliminar la empresa: {str(e)}")