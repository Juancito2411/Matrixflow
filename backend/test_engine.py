from app.algorithms.numpy_engine import NumPyEngine

def test_fase_4():
    print("--- INICIANDO VERIFICACIÓN DE FASE 4 ---")
    
    # 1. Vectores
    v1 = [10.0, 20.0]
    v2 = [5.0, 5.0]
    assert NumPyEngine.sum_vector(v1, v2) == [15.0, 25.0]
    assert NumPyEngine.subtract_vector(v1, v2) == [5.0, 15.0]
    assert NumPyEngine.scalar_multiply(v1, 2.0) == [20.0, 40.0]
    assert NumPyEngine.dot_product(v1, v2) == 150.0
    print("✅ 11.1 Vectores: OK")

    # 2. Matrices
    m1 = [[10, 20], [30, 40]]
    m2 = [[1, 2], [3, 4]]
    assert NumPyEngine.add_matrix(m1, m2) == [[11, 22], [33, 44]]
    assert NumPyEngine.subtract_matrix(m1, m2) == [[9, 18], [27, 36]]
    assert NumPyEngine.scalar_multiply_matrix(m1, 0.5) == [[5.0, 10.0], [15.0, 20.0]]
    assert NumPyEngine.transpose_matrix(m1) == [[10, 30], [20, 40]]
    assert NumPyEngine.multiply_matrix(m1, m2) == [[70, 100], [150, 220]]
    print("✅ 11.2 Matrices: OK")

    # 3. Álgebra Lineal & Validaciones
    res_comb = NumPyEngine.linear_combination([m1, m2], [0.5, 0.5])
    assert res_comb == [[5.5, 11.0], [16.5, 22.0]]
    
    # Prueba de captura de error en dimensiones
    try:
        NumPyEngine.add_matrix([[1, 2]], [[1], [2]])
        print("❌ Falló validación de dimensiones")
    except ValueError:
        print("✅ 11.3 Validaciones y Álgebra Lineal: OK")

    print("\n🎉 ¡FASE 4 COMPLETA Y VERIFICADA AL 100%!")

if __name__ == "__main__":
    test_fase_4()