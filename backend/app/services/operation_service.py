from typing import List, Dict, Any
from app.algorithms.numpy_engine import NumPyEngine


class OperationService:

    def __init__(self):
        self.engine = NumPyEngine()
        # Simulación de persistencia temporal previa a PostgreSQL
        self.history = []

    def execute_operation(
        self, op_type: str, data: Dict[str, Any]
    ) -> Dict[str, Any]:
        result = None
        if op_type == "suma":
            result = self.engine.sum_matrices(
                data["matriz_a"], data["matriz_b"]
            )
        elif op_type == "resta":
            result = self.engine.subtract_matrices(
                data["matriz_a"], data["matriz_b"]
            )
        elif op_type == "multiplicacion":
            result = self.engine.multiply_matrices(
                data["matriz_a"], data["matriz_b"]
            )
        elif op_type == "escalar":
            result = self.engine.scalar_multiply(
                data["matriz_a"], data["escalar"]
            )
        elif op_type == "transpuesta":
            result = self.engine.transpose_matrix(data["matriz_a"])
        elif op_type == "combinacion_lineal":
            result = self.engine.linear_combination(
                data["matrices"], data["escalares"]
            )
        else:
            raise ValueError("Tipo de operación no soportado")

        # Registro completo guardando inputs, result e id
        record = {
            "id": len(self.history) + 1,
            "op_type": op_type,
            "inputs": data,
            "result": result,
            "status": "exitoso",
        }
        self.history.append(record)
        return record

    def get_history(self):
        return self.history


operation_service = OperationService()