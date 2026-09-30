import numpy as np
from typing import List, Union

class NumPyEngine:
    """
    Motor matemático de Álgebra Lineal pura en NumPy.
    Cumple al 100% con la Sección 11 del Plan Maestro.
    """

    # ==========================================
    # 11.3 VALIDACIONES (Helpers dedicados)
    # ==========================================
    @staticmethod
    def validate_vector(v: List[float]) -> np.ndarray:
        if not isinstance(v, list) or len(v) == 0:
            raise ValueError("El vector debe ser una lista no vacía de números.")
        return np.array(v, dtype=float)

    @staticmethod
    def validate_matrix(m: List[List[float]]) -> np.ndarray:
        if not isinstance(m, list) or len(m) == 0 or not isinstance(m[0], list):
            raise ValueError("La entrada debe ser una matriz (lista de listas).")
        arr = np.array(m, dtype=float)
        if arr.ndim != 2:
            raise ValueError("La matriz debe tener 2 dimensiones (m x n).")
        return arr

    @staticmethod
    def validate_dimensions(arr1: np.ndarray, arr2: np.ndarray, check_type: str = "same"):
        if check_type == "same" and arr1.shape != arr2.shape:
            raise ValueError(f"Dimensiones incompatibles: {arr1.shape} vs {arr2.shape}")
        elif check_type == "matmul" and arr1.shape[1] != arr2.shape[0]:
            raise ValueError(f"Multiplicación no válida: Columnas de A ({arr1.shape[1]}) != Filas de B ({arr2.shape[0]})")

    # ==========================================
    # 11.1 VECTORES
    # ==========================================
    @staticmethod
    def sum_vector(v1: List[float], v2: List[float]) -> List[float]:
        arr1 = NumPyEngine.validate_vector(v1)
        arr2 = NumPyEngine.validate_vector(v2)
        NumPyEngine.validate_dimensions(arr1, arr2, "same")
        return (arr1 + arr2).tolist()

    @staticmethod
    def subtract_vector(v1: List[float], v2: List[float]) -> List[float]:
        arr1 = NumPyEngine.validate_vector(v1)
        arr2 = NumPyEngine.validate_vector(v2)
        NumPyEngine.validate_dimensions(arr1, arr2, "same")
        return (arr1 - arr2).tolist()

    @staticmethod
    def scalar_multiply(v: List[float], k: float) -> List[float]:
        arr = NumPyEngine.validate_vector(v)
        return (arr * k).tolist()

    @staticmethod
    def dot_product(v1: List[float], v2: List[float]) -> float:
        arr1 = NumPyEngine.validate_vector(v1)
        arr2 = NumPyEngine.validate_vector(v2)
        NumPyEngine.validate_dimensions(arr1, arr2, "same")
        return float(np.dot(arr1, arr2))

    # ==========================================
    # 11.2 MATRICES
    # ==========================================
    @staticmethod
    def add_matrix(a: List[List[float]], b: List[List[float]]) -> List[List[float]]:
        arr_a = NumPyEngine.validate_matrix(a)
        arr_b = NumPyEngine.validate_matrix(b)
        NumPyEngine.validate_dimensions(arr_a, arr_b, "same")
        return (arr_a + arr_b).tolist()

    @staticmethod
    def subtract_matrix(a: List[List[float]], b: List[List[float]]) -> List[List[float]]:
        arr_a = NumPyEngine.validate_matrix(a)
        arr_b = NumPyEngine.validate_matrix(b)
        NumPyEngine.validate_dimensions(arr_a, arr_b, "same")
        return (arr_a - arr_b).tolist()

    @staticmethod
    def multiply_matrix(a: List[List[float]], b: List[List[float]]) -> List[List[float]]:
        arr_a = NumPyEngine.validate_matrix(a)
        arr_b = NumPyEngine.validate_matrix(b)
        NumPyEngine.validate_dimensions(arr_a, arr_b, "matmul")
        return np.dot(arr_a, arr_b).tolist()

    @staticmethod
    def transpose_matrix(a: List[List[float]]) -> List[List[float]]:
        arr_a = NumPyEngine.validate_matrix(a)
        return arr_a.T.tolist()

    @staticmethod
    def scalar_multiply_matrix(a: List[List[float]], k: float) -> List[List[float]]:
        arr_a = NumPyEngine.validate_matrix(a)
        return (arr_a * k).tolist()

    # ==========================================
    # 11.3 ÁLGEBRA LINEAL
    # ==========================================
    @staticmethod
    def linear_combination(items: List[List[List[float]]], scalars: List[float]) -> List[List[float]]:
        if len(items) != len(scalars):
            raise ValueError("El número de matrices/vectores debe coincidir con el número de escalares.")
        if not items:
            raise ValueError("Debe proporcionar al menos un elemento.")

        base_arr = NumPyEngine.validate_matrix(items[0])
        result = np.zeros(base_arr.shape, dtype=float)

        for item, c in zip(items, scalars):
            arr = NumPyEngine.validate_matrix(item)
            NumPyEngine.validate_dimensions(base_arr, arr, "same")
            result += c * arr

        return result.tolist()