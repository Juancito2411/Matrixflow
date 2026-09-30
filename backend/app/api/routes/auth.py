from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, HTTPException, Request, status
from pydantic import BaseModel, EmailStr
from app.core.config import supabase
from app.core.security import (
    SECRET_KEY, 
    ALGORITHM, 
    ACCESS_TOKEN_EXPIRE_MINUTES, 
    create_access_token, 
    verify_password
)

router = APIRouter()

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

@router.post("/auth/login")
def login(req: LoginRequest, request: Request):
    client_ip = request.client.host if request.client else "127.0.0.1"

    # 1. Buscar usuario en Supabase
    try:
        res = supabase.table("users").select("*, roles(name)").eq("email", req.email).execute()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al conectar con la base de datos: {str(e)}"
        )

    # 2. Validar existencia del usuario
    if not res.data or len(res.data) == 0:
        _log_audit(
            user_id=None,
            action="LOGIN_FAILED",
            details=f"Usuario {req.email} no encontrado",
            ip_address=client_ip,
            status="FAILED"
        )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Credenciales incorrectas"
        )

    user = res.data[0]
    hashed_pwd = user.get("hashed_password", "")

    # 3. Validar si el usuario está activo
    if not user.get("is_active", True):
        _log_audit(
            user_id=user.get("id"),
            action="LOGIN_FAILED",
            details="Intento de acceso con cuenta desactivada",
            ip_address=client_ip,
            status="FAILED"
        )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="La cuenta se encuentra desactivada"
        )

    # 4. Verificar Contraseña de forma segura
    is_valid = verify_password(req.password, hashed_pwd)

    if not is_valid:
        _log_audit(
            user_id=user.get("id"),
            action="LOGIN_FAILED",
            details="Contraseña incorrecta",
            ip_address=client_ip,
            status="FAILED"
        )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Credenciales incorrectas"
        )

    # 5. Extraer nombre del rol
    role_name = "admin"
    if user.get("roles") and isinstance(user["roles"], dict):
        role_name = user["roles"].get("name", "admin")

    # 6. Generar JWT Token en formato compatible con security.py
    access_token = create_access_token(
        data={
            "sub": user["email"],     # "sub" contiene el email
            "id": user["id"],         # "id" contiene la clave id del usuario
            "email": user["email"],
            "role": role_name
        }
    )

    # 7. Registrar Auditoría Exitosa
    _log_audit(
        user_id=user.get("id"),
        action="LOGIN_SUCCESS",
        details="Inicio de sesión exitoso",
        ip_address=client_ip,
        status="SUCCESS"
    )

    # 8. Retornar respuesta al Frontend
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": role_name,
        "user": {
            "id": user["id"],
            "email": user["email"],
            "full_name": user.get("full_name"),
            "role": role_name
        }
    }


def _log_audit(user_id: int | None, action: str, details: str, ip_address: str, status: str):
    """Función auxiliar para registrar eventos de auditoría."""
    try:
        data = {
            "action": action,
            "module": "AUTH",
            "details": details,
            "ip_address": ip_address,
            "status": status
        }
        if user_id:
            data["user_id"] = user_id

        supabase.table("audit_logs").insert(data).execute()
    except Exception as e:
        print(f"⚠️ Error registrando auditoría: {e}")