from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, EmailStr
from typing import Optional
from app.core.config import supabase
from app.core.security import check_roles, get_password_hash

router = APIRouter()

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    role_id: int

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    role_id: Optional[int] = None
    is_active: Optional[bool] = None

# Permite tanto 'Administrador' como 'admin' para evitar rechazos de token RBAC
ADMIN_ROLES = ["Administrador", "admin"]

# Obtener todos los usuarios (Solo Administrador / Admin)
@router.get("/users")
def get_users(current_user: dict = Depends(check_roles(ADMIN_ROLES))):
    try:
        res = supabase.table("users") \
            .select("id, email, full_name, role_id, is_active, created_at, roles(name)") \
            .execute()
            
        return {"success": True, "data": res.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al obtener usuarios: {str(e)}")

# Crear un usuario (Solo Administrador / Admin)
@router.post("/users")
def create_user(user: UserCreate, current_user: dict = Depends(check_roles(ADMIN_ROLES))):
    try:
        # Genera el hash con bcrypt limpio
        hashed_pwd = get_password_hash(user.password)
        
        res = supabase.table("users").insert({
            "email": user.email,
            "hashed_password": hashed_pwd,
            "full_name": user.full_name,
            "role_id": user.role_id,
            "is_active": True
        }).execute()

        if not res.data:
            raise HTTPException(status_code=400, detail="No se pudo registrar el usuario en Supabase.")

        return {"success": True, "data": res.data[0]}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error al crear usuario: {str(e)}")

# Actualizar usuario (Solo Administrador / Admin)
@router.put("/users/{user_id}")
def update_user(user_id: int, user: UserUpdate, current_user: dict = Depends(check_roles(ADMIN_ROLES))):
    try:
        # Compatibilidad moderna con Pydantic v2
        update_data = user.model_dump(exclude_none=True)
        
        if not update_data:
            raise HTTPException(status_code=400, detail="No se enviaron campos para actualizar.")

        res = supabase.table("users").update(update_data).eq("id", user_id).execute()
        
        return {"success": True, "data": res.data}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error al actualizar usuario: {str(e)}")

# ------------------------------------------------------------------
# ENDPOINTS ADICIONALES PARA COMPLETAR EL CRUD
# ------------------------------------------------------------------

# Obtener todos los roles (Necesario para el <select> en el frontend)
@router.get("/roles")
def get_roles(current_user: dict = Depends(check_roles(ADMIN_ROLES))):
    try:
        res = supabase.table("roles").select("*").execute()
        return {"success": True, "data": res.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al obtener roles: {str(e)}")


# "Eliminar" un usuario (Soft Delete / Desactivación)
@router.delete("/users/{user_id}")
def delete_user(user_id: int, current_user: dict = Depends(check_roles(ADMIN_ROLES))):
    try:
        # En sistemas con auditoría, es mejor hacer un soft delete (is_active = False)
        # en lugar de un delete() real que rompa llaves foráneas en ventas o historial.
        res = supabase.table("users").update({"is_active": False}).eq("id", user_id).execute()
        
        if not res.data:
            raise HTTPException(status_code=404, detail="Usuario no encontrado.")
            
        return {"success": True, "message": f"Usuario {user_id} desactivado correctamente"}
    except HTTPException as http_err:
        raise http_err
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error al desactivar usuario: {str(e)}")