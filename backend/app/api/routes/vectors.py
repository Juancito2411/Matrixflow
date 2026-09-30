from fastapi import APIRouter, HTTPException, Depends, Request
from pydantic import BaseModel
from typing import List
from app.core.config import supabase
from app.core.security import check_roles
from app.services.audit_service import AuditService

router = APIRouter()

class CreateVectorRequest(BaseModel):
    name: str
    values: List[float]

@router.post("/vectors")
def create_and_store_vector(
    req: CreateVectorRequest,
    request: Request,
    current_user: dict = Depends(check_roles(["Administrador", "Analista", "admin", "analyst"]))
):
    try:
        dimension = len(req.values)
        
        # 1. Insertar en 'vectors'
        v_res = supabase.table("vectors").insert({
            "name": req.name,
            "dimension": dimension
        }).execute()
        
        vector_id = v_res.data[0]["id"]
        
        # 2. Insertar celdas en 'vector_values'
        values_to_insert = [
            {"vector_id": vector_id, "position": idx + 1, "value": val}
            for idx, val in enumerate(req.values)
        ]
        supabase.table("vector_values").insert(values_to_insert).execute()
        
        # Registrar auditoría
        AuditService.log_action(
            user_id=current_user["id"],
            action="CREATE_VECTOR",
            module="VECTORES",
            details=f"Vector '{req.name}' creado",
            request=request,
            status="SUCCESS"
        )
        
        return {
            "success": True,
            "message": f"Vector '{req.name}' guardado exitosamente",
            "vector_id": vector_id,
            "dimension": dimension
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/vectors")
def list_vectors(
    current_user: dict = Depends(check_roles(["Administrador", "Analista", "Consulta", "admin", "analyst", "consultant"]))
):
    response = supabase.table("vectors").select("*, vector_values(*)").execute()
    return {"success": True, "data": response.data}