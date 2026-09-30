from datetime import datetime, timedelta, timezone
from typing import Optional
from passlib.context import CryptContext
from passlib.exc import UnknownHashError
from jose import jwt, JWTError
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer

# Clave secreta para firmar tokens JWT
SECRET_KEY = "MATRIXFLOW_SECRET_KEY_SUPER_SECURE"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 480  # 8 horas

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verifica si la contraseña ingresada coincide con el hash almacenado.
    Evita caídas del servidor si el hash está corrupto o mal formateado.
    """
    try:
        return pwd_context.verify(plain_password, hashed_password)
    except (UnknownHashError, ValueError, TypeError):
        return False

def get_password_hash(password: str) -> str:
    """
    Genera un hash bcrypt a partir de la contraseña en texto plano.
    """
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    Crea el token JWT con tiempo de expiración UTC.
    """
    to_encode = data.copy()
    now = datetime.now(timezone.utc)
    expire = now + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def get_current_user(token: str = Depends(oauth2_scheme)):
    """
    Decodifica el token JWT y recupera los datos de sesión del usuario.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="No se pudieron validar las credenciales de acceso",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        role: str = payload.get("role")
        user_id: int = payload.get("id")
        
        if email is None or user_id is None:
            raise credentials_exception
            
        return {"id": user_id, "email": email, "role": role}
    except JWTError:
        raise credentials_exception

def check_roles(allowed_roles: list):
    """
    Control de Acceso basado en Roles (RBAC).
    Normaliza y mapea automáticamente equivalencias de nombres de roles 
    (ej. 'admin' -> 'administrador', 'analyst' -> 'analista') de forma 
    insensible a mayúsculas/minúsculas.
    """
    def role_verifier(current_user: dict = Depends(get_current_user)):
        user_role = str(current_user.get("role", "")).strip().lower()

        # Diccionario de equivalencias (Mapea inglés y alias a su forma canónica)
        role_alias_map = {
            "admin": "administrador",
            "administrador": "administrador",
            "analyst": "analista",
            "analista": "analista",
            "consultant": "consulta",
            "consulta": "consulta"
        }

        # Normalizar el rol proveniente del token
        normalized_user_role = role_alias_map.get(user_role, user_role)

        # Normalizar la lista de roles permitidos requeridos por la ruta
        normalized_allowed_roles = [
            role_alias_map.get(str(r).strip().lower(), str(r).strip().lower()) 
            for r in allowed_roles
        ]

        if normalized_user_role not in normalized_allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Permisos insuficientes. Rol usuario: '{current_user.get('role')}'. Requerido: {allowed_roles}"
            )

        return current_user

    return role_verifier