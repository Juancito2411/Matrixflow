from fastapi import APIRouter, Depends, HTTPException
from app.core.security import check_roles
from app.core.config import supabase

router = APIRouter()

@router.get("/audit/logs")
def get_audit_logs(current_user: dict = Depends(check_roles(["Administrador", "admin"]))):
    try:
        # Asegúrate de usar los nombres reales en SQL (sin la traducción del navegador)
        res = supabase.table("audit_logs") \
            .select("*, users(full_name, email)") \
            .order("created_at", desc=True) \
            .execute()
            
        return {"success": True, "data": res.data}
        
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Error al obtener los registros de auditoría: {str(e)}"
        )