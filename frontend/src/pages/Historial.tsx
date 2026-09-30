import React, { useState, useEffect } from 'react';
import { History, Calculator, Clock, CheckCircle2, Loader2, AlertCircle, Eye, X, FileText, RefreshCw } from 'lucide-react';
import { MatrixService } from '../services/Api';

interface RegistroHistorial {
  id?: number | string;
  operation_id?: number | string;
  operation_type?: string;
  op_type?: string;
  user_id?: number | null;
  executed_at?: string;
  created_at?: string;
  status?: string;
  inputs?: any;
  results?: any;
  operation_inputs?: any;
  operation_results?: any;
  result?: any;
  data?: any;
  [key: string]: any;
}

export const Historial: React.FC = () => {
  const [registros, setRegistros] = useState<RegistroHistorial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<RegistroHistorial | null>(null);

  const fetchHistorial = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await MatrixService.getHistory();

      let listado: any[] = [];

      if (Array.isArray(res)) {
        listado = res;
      } else if (res && Array.isArray(res.data)) {
        listado = res.data;
      } else if (res && res.data && Array.isArray(res.data.data)) {
        listado = res.data.data;
      } else if (res && res.history && Array.isArray(res.history)) {
        listado = res.history;
      }

      setRegistros(listado);
    } catch (err: any) {
      console.error('Error al cargar historial:', err);
      setError('No se pudo obtener el historial de operaciones desde el servidor.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistorial();
  }, []);

  const obtenerId = (r: RegistroHistorial, index: number) => {
    return r.id ?? r.operation_id ?? index + 1;
  };

  const obtenerTipoOperacion = (r: RegistroHistorial) => {
    const op = r.operation_type || r.op_type || 'Operación';
    return String(op).replace(/_/g, ' ');
  };

  const formatearFecha = (r: RegistroHistorial) => {
    const fechaStr = r.executed_at || r.created_at;
    if (!fechaStr) return 'N/A';
    try {
      const fecha = new Date(fechaStr);
      if (isNaN(fecha.getTime())) return String(fechaStr);
      return fecha.toLocaleString('es-PE', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    } catch {
      return String(fechaStr);
    }
  };

  // Helper unificado capaz de desempaquetar arreglos de Supabase ([{ input_data: {...} }])
  const obtenerEntradas = (r: RegistroHistorial) => {
    const raw = r.inputs ?? r.operation_inputs;
    if (!raw) return null;

    if (Array.isArray(raw) && raw.length > 0) {
      const primerElemento = raw[0];
      return primerElemento?.input_data || primerElemento;
    }

    return raw.input_data || raw;
  };

  // Helper unificado capaz de desempaquetar arreglos de Supabase ([{ result_data: {...} }])
  const obtenerResultados = (r: RegistroHistorial) => {
    const raw = r.results ?? r.operation_results ?? r.result;
    if (!raw) return null;

    if (Array.isArray(raw) && raw.length > 0) {
      const primerElemento = raw[0];
      return primerElemento?.result_data || primerElemento;
    }

    return raw.result_data || raw;
  };

  // Renderizador inteligente capaz de procesar arreglos 2D, 1D, Objetos relacionales y JSONs anidados
  const renderDataView = (data: any): React.ReactNode => {
    if (data === null || data === undefined) {
      return <span className="text-slate-400 italic">Sin datos</span>;
    }

    // Caso 1: String serializado como JSON
    if (typeof data === 'string') {
      try {
        const parsed = JSON.parse(data);
        return renderDataView(parsed);
      } catch {
        return <span className="font-mono text-xs font-bold text-slate-800">{data}</span>;
      }
    }

    // Caso 2: Matriz bidimensional 2D [[1, 2], [3, 4]]
    if (Array.isArray(data) && data.length > 0 && Array.isArray(data[0])) {
      return (
        <div className="inline-block bg-slate-900 text-emerald-400 font-mono p-3 rounded-lg text-xs border border-slate-700 shadow-inner my-1">
          {data.map((row: any[], i: number) => (
            <div key={i} className="flex gap-3 justify-center">
              [ {row.map((val: any, j: number) => (
                <span key={j} className="w-12 text-right font-bold">
                  {typeof val === 'number' && !Number.isInteger(val) ? val.toFixed(2) : String(val)}
                </span>
              ))} ]
            </div>
          ))}
        </div>
      );
    }

    // Caso 3: Arreglo de elementos o filas de tabla relacional
    if (Array.isArray(data)) {
      if (data.length === 0) return <span className="text-slate-400 italic">Lista vacía</span>;

      // Si los elementos son objetos
      if (typeof data[0] === 'object' && data[0] !== null) {
        return (
          <div className="space-y-3">
            {data.map((item: any, idx: number) => (
              <div key={idx} className="p-2 bg-white rounded border border-slate-200">
                {renderDataView(item)}
              </div>
            ))}
          </div>
        );
      }

      // Si es un Vector 1D [1, 2, 3]
      return (
        <div className="inline-block bg-slate-900 text-emerald-400 font-mono p-2 rounded-lg text-xs border border-slate-700 my-1">
          [ {data.map((v) => (typeof v === 'number' && !Number.isInteger(v) ? v.toFixed(2) : String(v))).join(', ')} ]
        </div>
      );
    }

    // Caso 4: Objeto clave-valor (ej: { matrix_a: [[...]], scalar: 2.5 })
    if (typeof data === 'object') {
      if ('input_data' in data) return renderDataView(data.input_data);
      if ('result_data' in data) return renderDataView(data.result_data);
      if ('data' in data) return renderDataView(data.data);
      if ('value' in data) return renderDataView(data.value);
      if ('result' in data) return renderDataView(data.result);

      return (
        <div className="space-y-3">
          {Object.entries(data).map(([key, val]) => (
            <div key={key} className="border-b border-slate-200 pb-2 last:border-b-0">
              <span className="font-semibold text-slate-600 text-xs uppercase block mb-1">
                {key.replace(/_/g, ' ')}:
              </span>
              <div className="pl-2">{renderDataView(val)}</div>
            </div>
          ))}
        </div>
      );
    }

    return <span className="font-mono text-xs font-bold text-slate-800">{String(data)}</span>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 text-slate-500 gap-3">
        <Loader2 className="animate-spin" size={24} />
        <span>Cargando historial de cálculos...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-textMain">Historial de Cálculos</h1>
          <p className="text-textMuted text-sm mt-1">
            Auditoría detallada de las transformaciones y operaciones algebraicas ejecutadas.
          </p>
        </div>
        <button
          onClick={fetchHistorial}
          className="flex items-center gap-2 self-start sm:self-auto px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
        >
          <RefreshCw size={14} /> Actualizar
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-xl flex items-center gap-3 text-sm">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {registros.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-textMuted uppercase">
                  <th className="p-4">ID</th>
                  <th className="p-4">Fecha y Hora</th>
                  <th className="p-4">Operación</th>
                  <th className="p-4 text-center">Estado</th>
                  <th className="p-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-sm">
                {registros.map((r, index) => (
                  <tr key={obtenerId(r, index)} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 text-slate-500 font-mono text-xs">#{obtenerId(r, index)}</td>
                    <td className="p-4 text-textMuted font-mono text-xs">
                      <div className="flex items-center gap-2">
                        <Clock size={14} />
                        {formatearFecha(r)}
                      </div>
                    </td>
                    <td className="p-4 font-semibold text-textMain">
                      <div className="flex items-center gap-2">
                        <Calculator size={16} className="text-primary" />
                        <span className="uppercase">{obtenerTipoOperacion(r)}</span>
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700">
                        <CheckCircle2 size={13} />
                        {r.status || 'SUCCESS'}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() => setSelectedRecord(r)}
                        className="p-1.5 text-slate-600 hover:text-primary hover:bg-slate-100 rounded-lg transition-colors"
                        title="Ver detalle del cálculo"
                      >
                        <Eye size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-textMuted space-y-2">
            <History size={36} className="mx-auto text-slate-300" />
            <p className="font-semibold">El historial está vacío</p>
            <p className="text-xs">Ejecuta operaciones en la calculadora para ver el registro acumulado.</p>
          </div>
        )}
      </div>

      {/* MODAL DE DETALLE DE LA OPERACIÓN */}
      {selectedRecord && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-3">
              <div className="flex items-center gap-2">
                <FileText className="text-primary" size={20} />
                <h3 className="text-lg font-bold text-slate-800">
                  Detalle de Operación #{obtenerId(selectedRecord, 0)}
                </h3>
              </div>
              <button
                onClick={() => setSelectedRecord(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-3 rounded-lg border border-slate-200">
              <div>
                <span className="font-semibold text-slate-500">Operación:</span>{' '}
                <span className="font-bold text-slate-800 uppercase">{obtenerTipoOperacion(selectedRecord)}</span>
              </div>
              <div>
                <span className="font-semibold text-slate-500">Fecha:</span>{' '}
                <span className="font-mono text-slate-700">{formatearFecha(selectedRecord)}</span>
              </div>
            </div>

            {/* ENTRADAS */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider">Entradas (Inputs)</h4>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 overflow-x-auto">
                {obtenerEntradas(selectedRecord) ? (
                  renderDataView(obtenerEntradas(selectedRecord))
                ) : (
                  <p className="text-xs text-slate-400 italic">No hay entradas guardadas para esta operación.</p>
                )}
              </div>
            </div>

            {/* RESULTADOS */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider">Resultado (Result)</h4>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 overflow-x-auto">
                {obtenerResultados(selectedRecord) ? (
                  renderDataView(obtenerResultados(selectedRecord))
                ) : (
                  <p className="text-xs text-slate-400 italic">No hay resultados registrados.</p>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedRecord(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};