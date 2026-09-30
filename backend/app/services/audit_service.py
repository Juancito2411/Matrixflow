from fastapi import Request
from app.core.config import supabase

class AuditService:
    @staticmethod
    def log_action(
        user_id: int, 
        action: str, 
        module: str, 
        details: str = "", 
        request: Request = None,
        status: str = "SUCCESS"
    ):
        try:
            # 1. Capturar la IP real considerando proxies (Nginx, Cloudflare, etc.)
            client_ip = "127.0.0.1"
            if request:
                forwarded_for = request.headers.get("x-forwarded-for")
                if forwarded_for:
                    client_ip = forwarded_for.split(",")[0].strip()
                elif request.client:
                    client_ip = request.client.host

            # 2. Insertar en Supabase
            response = supabase.table("audit_logs").insert({
                "user_id": user_id,
                "action": action,
                "module": module,
                "details": details,
                "ip_address": client_ip,
                "status": status
            }).execute()

            print(f"✅ [AUDIT SUCCESS] Accion '{action}' registrada para usuario {user_id}")
            return response.data

        except Exception as e:
            # Imprime el error exacto en la consola de FastAPI para depurar
            print(f"❌ [AUDIT ERROR] No se pudo guardar el log de auditoría: {repr(e)}")
            return None