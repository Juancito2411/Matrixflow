from fastapi import APIRouter, HTTPException, Depends, Request, status
from pydantic import BaseModel, Field
from typing import List, Optional
from app.algorithms.numpy_engine import NumPyEngine
from app.core.config import supabase
from app.core.security import check_roles, get_current_user
from app.services.audit_service import AuditService

router = APIRouter()

# --- MODELOS DE DATOS ---

class MatrixOpRequest(BaseModel):
    matrix_a: Optional[List[List[float]]] = Field(None, description="Matriz A de dimensiones m x n")
    matriz_a: Optional[List[List[float]]] = None
    
    matrix_b: Optional[List[List[float]]] = Field(None, description="Matriz B opcional")
    matriz_b: Optional[List[List[float]]] = None
    
    scalar: Optional[float] = Field(None, description="Escalar k opcional")
    escalar: Optional[float] = None
    
    matrices: Optional[List[List[List[float]]]] = Field(None, description="Lista de matrices para combinación lineal")
    scalars: Optional[List[float]] = Field(None, description="Lista de escalares")
    escalares: Optional[List[float]] = None
    
    operation: Optional[str] = Field(None, description="Operación: add, subtract, multiply, scalar_mult, transpose, linear_combination")
    op_type: Optional[str] = None


class MatrixSaveRequest(BaseModel):
    name: str
    matrix_data: Optional[List[List[float]]] = None
    values: Optional[List[List[float]]] = None
    rows: Optional[int] = None
    columns: Optional[int] = None


# --- 1. ENDPOINT PARA GUARDAR MATRIZ EN SUPABASE ---

@router.post("/matrices")
def save_matrix(
    req: MatrixSaveRequest,
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    """Guarda una matriz y sus valores en las tablas 'matrices' y 'matrix_values'."""
    raw_data = req.matrix_data or req.values

    if not raw_data or not isinstance(raw_data, list) or len(raw_data) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La matriz debe contener una estructura de filas y columnas válida."
        )

    try:
        data = [[float(val) for val in row] for row in raw_data]
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Todos los valores de la matriz deben ser numéricos: {str(e)}"
        )

    num_rows = req.rows if req.rows is not None else len(data)
    num_cols = req.columns if req.columns is not None else len(data[0])

    try:
        # A. Crear la cabecera en 'matrices'
        matrix_payload = {
            "name": req.name,
            "rows": num_rows,
            "columns": num_cols,
            "created_by": current_user.get("id")
        }
        
        matrix_res = supabase.table("matrices").insert(matrix_payload).execute()

        if not matrix_res.data or len(matrix_res.data) == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, 
                detail="Error al insertar la cabecera de la matriz en Supabase."
            )

        matrix_id = matrix_res.data[0]["id"]

        # B. Insertar los valores individuales en 'matrix_values'
        values_to_insert = []
        for r_idx, row in enumerate(data):
            for c_idx, val in enumerate(row):
                values_to_insert.append({
                    "matrix_id": matrix_id,
                    "row_index": r_idx,
                    "col_index": c_idx,
                    "value": val
                })

        if values_to_insert:
            supabase.table("matrix_values").insert(values_to_insert).execute()

        # C. Registrar Auditoría
        AuditService.log_action(
            user_id=current_user["id"],
            action="MATRIX_SAVE",
            module="MATRICES",
            details=f"Matriz '{req.name}' ({num_rows}x{num_cols}) guardada exitosamente",
            request=request,
            status="SUCCESS"
        )

        return {
            "success": True,
            "message": "Matriz guardada exitosamente en la base de datos.",
            "matrix_id": matrix_id
        }

    except HTTPException:
        raise
    except Exception as e:
        AuditService.log_action(
            user_id=current_user["id"],
            action="MATRIX_SAVE_FAILED",
            module="MATRICES",
            details=str(e),
            request=request,
            status="FAILED"
        )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error al guardar la matriz en BD: {str(e)}"
        )


# --- 2. ENDPOINT PARA CALCULAR OPERACIONES MATRICIALES ---

@router.post("/matrices/calculate")
def process_matrix_operation(
    req: MatrixOpRequest,
    request: Request,
    current_user: dict = Depends(check_roles(["Administrador", "Analista", "admin", "analyst"]))
):
    """Ejecuta operaciones matemáticas entre matrices e inserta en operations, operation_inputs y operation_results."""
    op = (req.operation or req.op_type or "").lower()
    m_a = req.matrix_a or req.matriz_a
    m_b = req.matrix_b or req.matriz_b
    k = req.scalar if req.scalar is not None else req.escalar
    m_list = req.matrices
    s_list = req.scalars or req.escalares

    try:
        result = None
        input_payload = {}
        input_type = "matrix"

        if op in ["add", "suma"]:
            if not m_a or not m_b:
                raise ValueError("Se requieren dos matrices (matrix_a y matrix_b) para la suma.")
            result = NumPyEngine.add_matrix(m_a, m_b)
            input_payload = {"matrix_a": m_a, "matrix_b": m_b}

        elif op in ["subtract", "resta"]:
            if not m_a or not m_b:
                raise ValueError("Se requieren dos matrices (matrix_a y matrix_b) para la resta.")
            result = NumPyEngine.subtract_matrix(m_a, m_b)
            input_payload = {"matrix_a": m_a, "matrix_b": m_b}

        elif op in ["multiply", "multiplicacion"]:
            if not m_a or not m_b:
                raise ValueError("Se requieren dos matrices (matrix_a y matrix_b) para la multiplicación.")
            result = NumPyEngine.multiply_matrix(m_a, m_b)
            input_payload = {"matrix_a": m_a, "matrix_b": m_b}

        elif op in ["scalar_mult", "escalar"]:
            if not m_a or k is None:
                raise ValueError("Se requiere una matriz (matrix_a) y un escalar (scalar).")
            result = NumPyEngine.scalar_multiply_matrix(m_a, k)
            input_payload = {"matrix_a": m_a, "scalar": k}

        elif op in ["transpose", "transpuesta"]:
            if not m_a:
                raise ValueError("Se requiere 'matrix_a' para calcular la transpuesta.")
            result = NumPyEngine.transpose_matrix(m_a)
            input_payload = {"matrix_a": m_a}

        elif op in ["linear_combination", "combinacion_lineal"]:
            if not m_list or not s_list:
                raise ValueError("Se requieren 'matrices' y 'scalars' para la combinación lineal.")
            result = NumPyEngine.linear_combination(m_list, s_list)
            input_payload = {"matrices": m_list, "scalars": s_list}

        else:
            raise ValueError(f"Operación matricial no válida: '{op}'")

        # A. Guardar cabecera en 'operations'
        op_res = supabase.table("operations").insert({
            "operation_type": f"matrix_{op}",
            "user_id": current_user["id"],
            "status": "SUCCESS"
        }).execute()

        operation_id = op_res.data[0]["id"]

        # B. Guardar entradas en 'operation_inputs'
        try:
            input_record = {
                "operation_id": int(operation_id),
                "input_type": str(input_type),
                "input_data": input_payload
            }
            supabase.table("operation_inputs").insert(input_record).execute()
        except Exception as e:
            print(f"[ERROR Supabase operation_inputs]: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error insertando en operation_inputs: {str(e)}"
            )

        # C. Guardar resultado en 'operation_results'
        supabase.table("operation_results").insert({
            "operation_id": int(operation_id),
            "result_data": {"result": result}
        }).execute()

        # Registro de Auditoría
        AuditService.log_action(
            user_id=current_user["id"],
            action=f"MATRIX_{op.upper()}",
            module="MATRICES",
            details=f"Operación matricial {op} procesada correctamente",
            request=request,
            status="SUCCESS"
        )

        return {
            "success": True,
            "operation": op,
            "result": result,
            "data": {
                "id": operation_id,
                "op_type": op,
                "result": result
            }
        }

    except ValueError as e:
        AuditService.log_action(
            user_id=current_user["id"],
            action=f"MATRIX_{op.upper()}_FAILED",
            module="MATRICES",
            details=str(e),
            request=request,
            status="FAILED"
        )
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    except HTTPException:
        raise

    except Exception as e:
        AuditService.log_action(
            user_id=current_user["id"],
            action=f"MATRIX_{op.upper()}_ERROR",
            module="MATRICES",
            details=str(e),
            request=request,
            status="FAILED"
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al procesar la matriz: {str(e)}"
        )


# --- 3. ENDPOINT PARA CONSULTAR HISTORIAL ---

@router.get("/matrices")
def get_matrices_history(
    current_user: dict = Depends(check_roles(["Administrador", "Analista", "Consulta", "admin", "analyst", "consultant"]))
):
    """Consulta la lista de matrices con sus valores."""
    try:
        response = supabase.table("matrices").select("*, matrix_values(*)").execute()
        return {"success": True, "data": response.data}
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))