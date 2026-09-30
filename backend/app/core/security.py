from datetime import datetime, timedelta, timezone
from typing import Optional
import bcrypt
from jose import jwt, JWTError
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer

# Clave secreta para firmar tokens JWT
SECRET_KEY = "MATRIXFLOW_SECRET_KEY_SUPER_SECURE"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 480  # 8 horas

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verifica si la contraseña ingresada coincide con el hash almacenado usando bcrypt directo.
    Soporta hashes $2a$, $2b$ y descarta fallos por compatibilidad de passlib.
    """
    if not plain_password or not hashed_password:
        return False
    try:
        # Convertir a bytes para la verificación directa con bcrypt
        password_bytes = plain_password.encode('utf-8')
        hash_bytes = hashed_password.encode('utf-8')
        return bcrypt.checkpw(password_bytes, hash_bytes)
    except Exception as e:
        print(f"⚠️ Error al verificar contraseña con bcrypt: {e}")
        return False

def get_password_hash(password: str) -> str:
    """
    Genera un hash bcrypt a partir de la contraseña en texto plano.
    """
    pwd_bytes = password.encode('utf-8')
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(pwd_bytes, salt).decode('utf-8')

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
    """
    def role_verifier(current_user: dict = Depends(get_current_user)):
        user_role = str(current_user.get("role", "")).strip().lower()

        role_alias_map = {
            "admin": "administrador",
            "administrador": "administrador",
            "analyst": "analista",
            "analista": "analista",
            "consultant": "consulta",
            "consulta": "consulta"
        }

        normalized_user_role = role_alias_map.get(user_role, user_role)
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