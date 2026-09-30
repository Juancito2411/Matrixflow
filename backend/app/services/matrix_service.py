import numpy as np
from typing import List, Tuple, Dict, Any

class MatrixService:
    
    @staticmethod
    def sumar_matrices(a: List[List[float]], b: List[List[float]]) -> Tuple[List[List[float]], str]:
        arr_a, arr_b = np.array(a), np.array(b)
        if arr_a.shape != arr_b.shape:
            raise ValueError(f"Las dimensiones no coinciden: {arr_a.shape} vs {arr_b.shape}")
        res = arr_a + arr_b
        return res.tolist(), f"{res.shape[0]}x{res.shape[1]}"

    @staticmethod
    def restar_matrices(a: List[List[float]], b: List[List[float]]) -> Tuple[List[List[float]], str]:
        arr_a, arr_b = np.array(a), np.array(b)
        if arr_a.shape != arr_b.shape:
            raise ValueError(f"Las dimensiones no coinciden: {arr_a.shape} vs {arr_b.shape}")
        res = arr_a - arr_b
        return res.tolist(), f"{res.shape[0]}x{res.shape[1]}"

    @staticmethod
    def multiplicar_escalar(a: List[List[float]], k: float) -> Tuple[List[List[float]], str]:
        arr_a = np.array(a)
        res = arr_a * k
        return res.tolist(), f"{res.shape[0]}x{res.shape[1]}"

    @staticmethod
    def producto_matricial(a: List[List[float]], b: List[List[float]]) -> Tuple[List[List[float]], str]:
        arr_a, arr_b = np.array(a), np.array(b)
        if arr_a.shape[1] != arr_b.shape[0]:
            raise ValueError(f"Columnas de A ({arr_a.shape[1]}) no coinciden con Filas de B ({arr_b.shape[0]})")
        res = np.dot(arr_a, arr_b)
        return res.tolist(), f"{res.shape[0]}x{res.shape[1]}"

    @staticmethod
    def transponer(a: List[List[float]]) -> Tuple[List[List[float]], str]:
        arr_a = np.array(a)
        res = arr_a.T
        return res.tolist(), f"{res.shape[0]}x{res.shape[1]}"

    @staticmethod
    def producto_punto_vectores(v1: List[float], v2: List[float]) -> float:
        arr1, arr2 = np.array(v1), np.array(v2)
        if arr1.shape != arr2.shape:
            raise ValueError("Los vectores deben tener la misma dimensión")
        return float(np.dot(arr1, arr2))