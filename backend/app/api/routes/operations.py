from fastapi import APIRouter, HTTPException, Depends, Request
from pydantic import BaseModel, Field
from typing import List, Optional
from app.algorithms.numpy_engine import NumPyEngine
from app.core.config import supabase
from app.core.security import check_roles, get_current_user
from app.services.audit_service import AuditService

router = APIRouter()

class OperationRequest(BaseModel):
    op_type: Optional[str] = Field(None, description="Ej: 'suma', 'resta', 'add', 'subtract'")
    operation: Optional[str] = Field(None, description="Alias de op_type en inglés")
    
    matriz_a: Optional[List[List[float]]] = None
    matrix_a: Optional[List[List[float]]] = None
    
    matriz_b: Optional[List[List[float]]] = None
    matrix_b: Optional[List[List[float]]] = None
    
    escalar: Optional[float] = None
    scalar: Optional[float] = None
    
    matrices: Optional[List[List[List[float]]]] = None
    escalares: Optional[List[float]] = None
    scalars: Optional[List[float]] = None


# ==============================================================================
# ENDPOINT 1: EJECUTAR OPERACIÓN -> Genera: POST /api/v1/operations
# ==============================================================================
@router.post("", summary="Execute Operation")
def execute_operation(
    req: OperationRequest, 
    request: Request,
    current_user: dict = Depends(check_roles(["Administrador", "Analista", "admin", "analyst"]))
):
    op = (req.op_type or req.operation or "").lower()
    m_a = req.matriz_a or req.matrix_a
    m_b = req.matriz_b or req.matrix_b
    k = req.escalar if req.escalar is not None else req.scalar
    m_list = req.matrices
    s_list = req.escalares or req.scalars

    try:
        result = None
        input_type = "matrix"
        input_payload = {}

        if op in ["suma", "add"]:
            if not m_a or not m_b:
                raise ValueError("Se requieren dos matrices (matriz_a y matriz_b) para la suma.")
            result = NumPyEngine.add_matrix(m_a, m_b)
            input_payload = {"matrix_a": m_a, "matrix_b": m_b}

        elif op in ["resta", "subtract"]:
            if not m_a or not m_b:
                raise ValueError("Se requieren dos matrices (matriz_a y matriz_b) para la resta.")
            result = NumPyEngine.subtract_matrix(m_a, m_b)
            input_payload = {"matrix_a": m_a, "matrix_b": m_b}

        elif op in ["multiplicacion", "multiply"]:
            if not m_a or not m_b:
                raise ValueError("Se requieren dos matrices (matriz_a y matriz_b) para la multiplicación.")
            result = NumPyEngine.multiply_matrix(m_a, m_b)
            input_payload = {"matrix_a": m_a, "matrix_b": m_b}

        elif op in ["escalar", "scalar_mult"]:
            if not m_a or k is None:
                raise ValueError("Se requiere una matriz (matriz_a) y un escalar (escalar) para esta operación.")
            result = NumPyEngine.scalar_multiply_matrix(m_a, k)
            input_payload = {"matrix_a": m_a, "scalar": k}

        elif op in ["transpuesta", "transpose"]:
            if not m_a:
                raise ValueError("Se requiere matriz_a para calcular la transpuesta.")
            result = NumPyEngine.transpose_matrix(m_a)
            input_payload = {"matrix_a": m_a}

        elif op in ["combinacion_lineal", "linear_combination"]:
            if not m_list or not s_list:
                raise ValueError("Se requiere la lista de matrices y escalares para la combinación lineal.")
            result = NumPyEngine.linear_combination(m_list, s_list)
            input_payload = {"matrices": m_list, "scalars": s_list}

        else:
            raise ValueError(f"Tipo de operación no soportado: '{op}'")

        # --- A. Guardar en 'operations' ---
        try:
            op_res = supabase.table("operations").insert({
                "operation_type": op,
                "user_id": current_user["id"],
                "status": "SUCCESS"
            }).execute()
            
            operation_id = op_res.data[0]["id"]
        except Exception as e:
            print(f"[ERROR Supabase operations]: {e}")
            raise HTTPException(status_code=500, detail=f"Error insertando en operations: {str(e)}")

        # --- B. Guardar en 'operation_inputs' ---
        try:
            input_record = {
                "operation_id": int(operation_id),
                "input_type": str(input_type),
                "input_data": input_payload
            }
            supabase.table("operation_inputs").insert(input_record).execute()
        except Exception as e:
            print(f"[ERROR Supabase operation_inputs]: {e}")
            raise HTTPException(status_code=500, detail=f"Error insertando en operation_inputs: {str(e)}")

        # --- C. Guardar en 'operation_results' ---
        try:
            supabase.table("operation_results").insert({
                "operation_id": int(operation_id),
                "result_data": {"result": result}
            }).execute()
        except Exception as e:
            print(f"[ERROR Supabase operation_results]: {e}")
            raise HTTPException(status_code=500, detail=f"Error insertando en operation_results: {str(e)}")

        # Auditoría
        AuditService.log_action(
            user_id=current_user["id"],
            action=f"EXECUTE_{op.upper()}",
            module="MATRICES",
            details=f"Operación {op} ejecutada con éxito",
            request=request,
            status="SUCCESS"
        )

        return {
            "success": True,
            "data": {
                "id": operation_id,
                "op_type": op,
                "inputs": input_payload,
                "result": result,
                "status": "exitoso"
            },
            "result": result
        }

    except ValueError as e:
        AuditService.log_action(
            user_id=current_user["id"],
            action=f"EXECUTE_{op.upper()}_FAILED",
            module="MATRICES",
            details=str(e),
            request=request,
            status="FAILED"
        )
        raise HTTPException(status_code=400, detail=str(e))
        
    except HTTPException:
        raise

    except Exception as e:
        AuditService.log_action(
            user_id=current_user["id"],
            action=f"EXECUTE_{op.upper()}_ERROR",
            module="MATRICES",
            details=str(e),
            request=request,
            status="FAILED"
        )
        raise HTTPException(status_code=500, detail=f"Error al procesar la operación: {str(e)}")


# ==============================================================================
# ENDPOINT 2: OBTENER HISTORIAL -> Genera: GET /api/v1/operations
# ==============================================================================
@router.get("", summary="Get Operations History")
async def get_operations_history(
    current_user: dict = Depends(get_current_user)
):
    try:
        response = supabase.table("operations") \
            .select("*, operation_inputs(*), operation_results(*)") \
            .order("id", desc=True) \
            .execute()
        
        raw_data = response.data or []
        formatted_history = []

        for item in raw_data:
            inputs_list = item.get("operation_inputs", [])
            inputs_obj = inputs_list[0].get("input_data") if inputs_list and len(inputs_list) > 0 else None

            results_list = item.get("operation_results", [])
            results_obj = results_list[0].get("result_data") if results_list and len(results_list) > 0 else None

            formatted_history.append({
                "id": item.get("id"),
                "operation_type": item.get("operation_type"),
                "user_id": item.get("user_id"),
                "executed_at": item.get("executed_at"),
                "status": item.get("status", "SUCCESS"),
                "inputs": inputs_obj,
                "results": results_obj
            })

        return {"status": "success", "data": formatted_history}

    except Exception as e:
        print(f"Error al obtener historial: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))