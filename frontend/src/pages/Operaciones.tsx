import React, { useState, useEffect } from 'react';
import { Calculator, Play, ArrowRight, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { MatrixService } from '../services/Api'; // Ajusta la ruta a tu Api.ts si difiere

interface MatrixItem {
  id: number;
  name: string;
  rows: number;
  columns: number;
  matrix_values?: Array<{ row_index: number; col_index: number; value: number }>;
}

export const Operaciones: React.FC = () => {
  const [tipoOperacion, setTipoOperacion] = useState<'add' | 'subtract' | 'scalar_mult' | 'multiply' | 'transpose'>('add');
  const [matrices, setMatrices] = useState<MatrixItem[]>([]);
  const [matrizAId, setMatrizAId] = useState<number | string>('');
  const [matrizBId, setMatrizBId] = useState<number | string>('');
  const [escalar, setEscalar] = useState<number>(1.18);

  const [resultado, setResultado] = useState<number[][] | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [fetchingMatrices, setFetchingMatrices] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // 1. Cargar el catálogo de matrices desde Supabase al iniciar
  useEffect(() => {
    cargarMatrices();
  }, []);

  const cargarMatrices = async () => {
    try {
      setFetchingMatrices(true);
      const response = await MatrixService.getMatrices();
      const lista: MatrixItem[] = response.data || response;
      setMatrices(lista);

      if (lista.length > 0) {
        setMatrizAId(lista[0].id);
        if (lista.length > 1) {
          setMatrizBId(lista[1].id);
        } else {
          setMatrizBId(lista[0].id);
        }
      }
    } catch (err: any) {
      console.error('Error al cargar matrices:', err);
      setError('No se pudieron cargar las matrices registradas en la base de datos.');
    } finally {
      setFetchingMatrices(false);
    }
  };

  // Convierte el formato de tabla plana `matrix_values` a un arreglo bidimensional 2D
  const obtenerArreglo2D = (matrizObj?: MatrixItem): number[][] => {
    if (!matrizObj || !matrizObj.matrix_values) return [];
    
    const grid: number[][] = Array.from({ length: matrizObj.rows }, () =>
      Array(matrizObj.columns).fill(0)
    );

    matrizObj.matrix_values.forEach((v) => {
      if (grid[v.row_index] !== undefined && grid[v.row_index][v.col_index] !== undefined) {
        grid[v.row_index][v.col_index] = v.value;
      }
    });

    return grid;
  };

  // 2. Ejecutar la operación conectando al Backend FastAPI
  const ejecutarOperacion = async () => {
    setError(null);
    setResultado(null);

    const objA = matrices.find((m) => m.id === Number(matrizAId));
    const objB = matrices.find((m) => m.id === Number(matrizBId));

    const matrixAData = obtenerArreglo2D(objA);
    const matrixBData = obtenerArreglo2D(objB);

    if (!matrixAData.length) {
      setError('Por favor selecciona una Matriz A válida.');
      return;
    }

    if ((tipoOperacion === 'add' || tipoOperacion === 'subtract' || tipoOperacion === 'multiply') && !matrixBData.length) {
      setError('Por favor selecciona una Matriz B válida para esta operación.');
      return;
    }

    try {
      setLoading(true);

      const payload = {
        operation: tipoOperacion,
        matrix_a: matrixAData,
        matrix_b: tipoOperacion !== 'transpose' && tipoOperacion !== 'scalar_mult' ? matrixBData : undefined,
        scalar: tipoOperacion === 'scalar_mult' ? escalar : undefined,
      };

      const res = await MatrixService.executeOperation(payload);

      if (res.success && res.result) {
        setResultado(res.result);
      } else {
        setError(res.detail || 'Error al procesar la operación.');
      }
    } catch (err: any) {
      console.error('Error al ejecutar operación:', err);
      const msg = err.response?.data?.detail || 'Ocurrió un error al conectar con la API.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-textMain">Panel de Calculadora Matricial</h1>
        <p className="text-textMuted text-sm mt-1">
          Selecciona las estructuras de datos de la BD y ejecuta operaciones dinámicas.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Formulario de Configuración de Operación */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
          <h3 className="text-base font-bold text-textMain flex items-center gap-2">
            <Calculator size={18} className="text-primary" />
            Configuración de Operación
          </h3>

          {/* Selector de tipo de operación */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-textMuted uppercase">Operación Algebraica</label>
            <select
              value={tipoOperacion}
              onChange={(e) => {
                setTipoOperacion(e.target.value as any);
                setResultado(null);
                setError(null);
              }}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="add">Suma de Matrices (A + B)</option>
              <option value="subtract">Resta / Desviación (A - B)</option>
              <option value="scalar_mult">Multiplicación por Escalar (k · A)</option>
              <option value="multiply">Producto Matricial (A × B)</option>
              <option value="transpose">Matriz Transpuesta (Aᵀ)</option>
            </select>
          </div>

          {/* Selector de Matriz A */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-textMuted uppercase">Matriz u Operando A</label>
            {fetchingMatrices ? (
              <div className="flex items-center gap-2 text-xs text-textMuted py-2">
                <Loader2 size={14} className="animate-spin" /> Cargando matrices...
              </div>
            ) : (
              <select
                value={matrizAId}
                onChange={(e) => setMatrizAId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                {matrices.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.rows}×{m.columns})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Selector de Matriz B (Solo si aplica) */}
          {tipoOperacion !== 'transpose' && tipoOperacion !== 'scalar_mult' && (
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-textMuted uppercase">Matriz Operando B</label>
              {fetchingMatrices ? (
                <div className="flex items-center gap-2 text-xs text-textMuted py-2">
                  <Loader2 size={14} className="animate-spin" /> Cargando matrices...
                </div>
              ) : (
                <select
                  value={matrizBId}
                  onChange={(e) => setMatrizBId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  {matrices.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.rows}×{m.columns})
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          {/* Campo de Escalar (Solo si aplica) */}
          {tipoOperacion === 'scalar_mult' && (
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-textMuted uppercase">Valor Escalar (k)</label>
              <input
                type="number"
                step="0.01"
                value={escalar}
                onChange={(e) => setEscalar(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-bold text-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
          )}

          {/* Botón de ejecución */}
          <button
            onClick={ejecutarOperacion}
            disabled={loading || fetchingMatrices}
            className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-white py-3 rounded-lg font-semibold transition-colors shadow-sm disabled:opacity-50"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : <Play size={18} />}
            {loading ? 'Calculando...' : 'Calcular Resultado'}
          </button>
        </div>

        {/* Panel de Visualización y Resultados */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
          <h3 className="text-base font-bold text-textMain flex items-center gap-2">
            <CheckCircle2 size={18} className="text-emerald-600" />
            Matriz Resultante
          </h3>

          {error && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-3 text-rose-700 text-sm">
              <AlertCircle size={20} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {resultado ? (
            <div className="space-y-6">
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-3 text-emerald-800 text-sm">
                <CheckCircle2 size={20} className="shrink-0" />
                <span>Operación ejecutada con éxito y registrada en el historial.</span>
              </div>

              <div className="overflow-x-auto">
                <table className="border-collapse border border-slate-200">
                  <tbody>
                    {resultado.map((row, i) => (
                      <tr key={i}>
                        {row.map((val, j) => (
                          <td
                            key={j}
                            className="border border-slate-200 p-3 text-center font-mono font-bold text-primary bg-slate-50 min-w-[80px]"
                          >
                            {Number.isInteger(val) ? val : val.toFixed(2)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            !error && (
              <div className="h-64 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-xl text-textMuted">
                <ArrowRight size={32} className="mb-2 text-slate-300" />
                <p className="text-sm">Configura los parámetros y presiona <strong>Calcular Resultado</strong>.</p>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
};