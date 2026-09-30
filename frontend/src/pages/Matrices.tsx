import React, { useState, useEffect } from 'react';
import { Save, RefreshCw, Calculator, Plus } from 'lucide-react';
import { MatrixService } from '../services/Api';

interface MatrixSaved {
  id: number;
  name: string;
  rows: number;
  columns: number;
}

export function Matrices() {
  const [operation, setOperation] = useState<string>('add');
  
  // Dimensiones
  const [rowsA, setRowsA] = useState<number>(2);
  const [colsA, setColsA] = useState<number>(2);
  const [rowsB, setRowsB] = useState<number>(2);
  const [colsB, setColsB] = useState<number>(2);

  // Valores de las matrices
  const [nameA, setNameA] = useState<string>('Matriz A');
  const [matrixA, setMatrixA] = useState<number[][]>([[1, 0], [0, 1]]);
  const [matrixB, setMatrixB] = useState<number[][]>([[1, 1], [1, 1]]);
  const [scalar, setScalar] = useState<number>(2);

  // Estado de lista de matrices guardadas en BD
  const [matricesGuardadas, setMatricesGuardadas] = useState<MatrixSaved[]>([]);

  // Estados de consulta/API
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [savingA, setSavingA] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Cargar lista de matrices guardadas desde Supabase
  const cargarMatricesBD = async () => {
    try {
      const res = await MatrixService.getMatrices().catch(() => []);
      const list = Array.isArray(res?.data || res) ? (res?.data || res) : [];
      setMatricesGuardadas(list);
    } catch (err) {
      console.error("Error al cargar matrices de la BD:", err);
    }
  };

  useEffect(() => {
    cargarMatricesBD();
  }, []);

  // Redimensionar Matriz A
  const handleResizeA = (r: number, c: number) => {
    setRowsA(r);
    setColsA(c);
    const newMat = Array.from({ length: r }, (_, i) =>
      Array.from({ length: c }, (_, j) => matrixA[i]?.[j] || 0)
    );
    setMatrixA(newMat);
  };

  // Redimensionar Matriz B
  const handleResizeB = (r: number, c: number) => {
    setRowsB(r);
    setColsB(c);
    const newMat = Array.from({ length: r }, (_, i) =>
      Array.from({ length: c }, (_, j) => matrixB[i]?.[j] || 0)
    );
    setMatrixB(newMat);
  };

  // Cambiar celda Matriz A
  const handleCellChangeA = (r: number, c: number, val: string) => {
    const updated = matrixA.map((row, ri) =>
      row.map((cell, ci) => (ri === r && ci === c ? parseFloat(val) || 0 : cell))
    );
    setMatrixA(updated);
  };

  // Cambiar celda Matriz B
  const handleCellChangeB = (r: number, c: number, val: string) => {
    const updated = matrixB.map((row, ri) =>
      row.map((cell, ci) => (ri === r && ci === c ? parseFloat(val) || 0 : cell))
    );
    setMatrixB(updated);
  };

  // Guardar Matriz A en la Base de Datos (Tablas: matrices y matrix_values)
  const handleSaveMatrixA = async () => {
    if (!nameA.trim()) {
      alert("Por favor ingresa un nombre para la matriz.");
      return;
    }

    try {
      setSavingA(true);
      // Llama directamente a saveMatrix(name, matrix_data) de api.ts
      await MatrixService.saveMatrix(nameA, matrixA);
      await cargarMatricesBD();
      alert(`Matriz "${nameA}" guardada correctamente en la base de datos.`);
    } catch (err: any) {
      console.error("Error al guardar la matriz:", err);
      alert("Ocurrió un error al guardar la matriz en Supabase.");
    } finally {
      setSavingA(false);
    }
  };

  // Calcular Operación
  const handleCalculate = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const payload: any = {
        operation,
        matrix_a: matrixA,
      };

      if (['add', 'subtract', 'multiply'].includes(operation)) {
        payload.matrix_b = matrixB;
      }

      if (operation === 'scalar_mult') {
        payload.scalar = scalar;
      }

      const data = await MatrixService.executeOperation(payload);
      setResult(data.result || data.data?.result || data);
    } catch (err: any) {
      console.error("Error en operación matricial:", err);
      const detailMsg = err.response?.data?.detail || err.message || 'Error al conectar con la API';
      setError(typeof detailMsg === 'object' ? JSON.stringify(detailMsg) : detailMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Calculator className="text-indigo-600" />
          Módulo de Operaciones Matriciales
        </h1>
      </div>

      {/* Control de Operación */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">
          Seleccionar Operación
        </label>
        <select
          value={operation}
          onChange={(e) => setOperation(e.target.value)}
          className="w-full md:w-1/2 p-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/50 bg-white"
        >
          <option value="add">Suma de Matrices (A + B)</option>
          <option value="subtract">Resta de Matrices (A - B)</option>
          <option value="multiply">Multiplicación Matricial (A × B)</option>
          <option value="scalar_mult">Multiplicación por Escalar (k × A)</option>
          <option value="transpose">Transpuesta de Matriz (Aᵀ)</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Matriz A */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-base font-bold text-slate-800">Matriz A</h3>
            <button
              onClick={handleSaveMatrixA}
              disabled={savingA}
              className="flex items-center gap-1 text-xs bg-indigo-50 text-indigo-600 border border-indigo-200 hover:bg-indigo-100 px-3 py-1.5 rounded-lg font-medium transition cursor-pointer"
            >
              <Save size={14} />
              {savingA ? 'Guardando...' : 'Guardar en BD'}
            </button>
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">Nombre para registrar:</label>
            <input 
              type="text" 
              value={nameA} 
              onChange={(e) => setNameA(e.target.value)} 
              className="w-full px-3 py-1.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
          </div>

          <div className="flex gap-4">
            <div>
              <label className="text-xs text-slate-500">Filas:</label>
              <input
                type="number"
                min="1"
                max="5"
                value={rowsA}
                onChange={(e) => handleResizeA(parseInt(e.target.value) || 1, colsA)}
                className="w-16 p-1 border rounded ml-2 text-center text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500">Columnas:</label>
              <input
                type="number"
                min="1"
                max="5"
                value={colsA}
                onChange={(e) => handleResizeA(rowsA, parseInt(e.target.value) || 1)}
                className="w-16 p-1 border rounded ml-2 text-center text-sm"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2 pt-2">
            {matrixA.map((row, r) => (
              <div key={r} className="flex gap-2">
                {row.map((cell, c) => (
                  <input
                    key={c}
                    type="number"
                    value={cell}
                    onChange={(e) => handleCellChangeA(r, c, e.target.value)}
                    className="w-16 p-2 text-center border border-slate-300 rounded focus:ring-2 focus:ring-indigo-500/50 font-medium"
                  />
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Matriz B / Escalar */}
        {['add', 'subtract', 'multiply'].includes(operation) && (
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 space-y-4">
            <h3 className="text-base font-bold text-slate-800">Matriz B</h3>

            <div className="flex gap-4">
              <div>
                <label className="text-xs text-slate-500">Filas:</label>
                <input
                  type="number"
                  min="1"
                  max="5"
                  value={rowsB}
                  onChange={(e) => handleResizeB(parseInt(e.target.value) || 1, colsB)}
                  className="w-16 p-1 border rounded ml-2 text-center text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-slate-500">Columnas:</label>
                <input
                  type="number"
                  min="1"
                  max="5"
                  value={colsB}
                  onChange={(e) => handleResizeB(rowsB, parseInt(e.target.value) || 1)}
                  className="w-16 p-1 border rounded ml-2 text-center text-sm"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              {matrixB.map((row, r) => (
                <div key={r} className="flex gap-2">
                  {row.map((cell, c) => (
                    <input
                      key={c}
                      type="number"
                      value={cell}
                      onChange={(e) => handleCellChangeB(r, c, e.target.value)}
                      className="w-16 p-2 text-center border border-slate-300 rounded focus:ring-2 focus:ring-indigo-500/50 font-medium"
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}

        {operation === 'scalar_mult' && (
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 space-y-4">
            <h3 className="text-base font-bold text-slate-800">Escalar (k)</h3>
            <input
              type="number"
              value={scalar}
              onChange={(e) => setScalar(parseFloat(e.target.value) || 0)}
              className="w-32 p-2 border border-slate-300 rounded text-center text-lg font-bold text-indigo-600"
            />
          </div>
        )}
      </div>

      {/* Botón de Cálculo */}
      <button
        onClick={handleCalculate}
        disabled={loading}
        className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-sm transition disabled:opacity-50 cursor-pointer"
      >
        {loading ? 'Procesando en FastAPI...' : 'Calcular Operación'}
      </button>

      {/* Error */}
      {error && (
        <div className="p-4 bg-rose-50 border-l-4 border-rose-500 text-rose-700 rounded-lg">
          <p className="font-bold">Error:</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Resultado */}
      {result && (
        <div className="bg-emerald-50 border border-emerald-200 p-6 rounded-xl shadow-sm space-y-4">
          <h3 className="text-lg font-bold text-emerald-900">Resultado Matriz Resultante:</h3>
          {Array.isArray(result) ? (
            <div className="flex flex-col gap-2">
              {result.map((row: any, r: number) => (
                <div key={r} className="flex gap-2">
                  {Array.isArray(row)
                    ? row.map((val: any, c: number) => (
                        <span key={c} className="w-16 py-2 text-center bg-white border border-emerald-300 rounded-md font-bold text-slate-800 shadow-xs">
                          {val}
                        </span>
                      ))
                    : (
                      <span className="py-2 px-4 bg-white border border-emerald-300 rounded-md font-bold text-slate-800 shadow-xs">
                        {row}
                      </span>
                    )}
                </div>
              ))}
            </div>
          ) : (
            <pre className="bg-white p-4 border rounded font-mono text-sm">{JSON.stringify(result, null, 2)}</pre>
          )}
        </div>
      )}
    </div>
  );
}

export default Matrices;