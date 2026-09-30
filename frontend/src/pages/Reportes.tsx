import React, { useEffect, useState } from 'react';
import { 
  FileText, 
  Download, 
  TrendingUp, 
  DollarSign, 
  Store, 
  RefreshCw, 
  Target, 
  Package, 
  BarChart3 
} from 'lucide-react';
import { ReportService } from '../services/Api'; // Asegúrate de ajustar la ruta relativa a tu Api.ts

interface SalesByBranch {
  branch: string;
  total: number;
}

interface SalesByProduct {
  product: string;
  total: number;
}

interface TargetItem {
  branch: string;
  period: string;
  target_amount: number;
  achieved_amount: number;
  percentage: number;
}

interface InventoryItem {
  product: string;
  stock: number;
}

interface ReportSummaryData {
  sales_by_branch: SalesByBranch[];
  sales_by_product: SalesByProduct[];
  targets: TargetItem[];
  inventory: InventoryItem[];
  total_operations: number;
}

export const Reportes: React.FC = () => {
  const [data, setData] = useState<ReportSummaryData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReports = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Llamada usando Axios a través de ReportService
      const result = await ReportService.getFullSummary();
      
      if (result && (result.success || result.status === 'success')) {
        setData(result.data);
      } else {
        throw new Error('Formato de respuesta no válido.');
      }
    } catch (err: any) {
      console.error("Error cargando reportes:", err);
      setError(err.response?.data?.detail || err.message || 'No se pudieron cargar los datos de los reportes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const totalVentasGeneral = data?.sales_by_branch?.reduce((acc, item) => acc + item.total, 0) || 0;

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-textMain">Reportes Empresariales</h1>
          <p className="text-textMuted text-sm mt-1">
            Informes consolidados derivados de los modelos algebraicos de ventas, metas e inventarios.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={fetchReports} 
            disabled={loading}
            className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors border border-slate-200"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            Actualizar
          </button>
          <button className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-sm">
            <Download size={18} />
            Exportar PDF Consolidado
          </button>
        </div>
      </div>

      {/* Indicadores Dinámicos / Métricas Resumen */}
      {loading ? (
        <div className="flex items-center justify-center p-12 bg-white rounded-xl border border-slate-200 text-textMuted">
          <RefreshCw className="animate-spin mr-2" size={20} />
          Cargando métricas en tiempo real...
        </div>
      ) : error ? (
        <div className="p-4 bg-red-50 text-red-600 rounded-xl border border-red-100 text-sm">
          {error}
        </div>
      ) : (
        <>
          {/* Sección 1: Resumen de Indicadores Clave */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-textMuted uppercase">Ventas Totales</p>
                <h3 className="text-xl font-bold text-textMain mt-1">
                  S/ {totalVentasGeneral.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                </h3>
              </div>
              <div className="p-3 bg-blue-50 text-primary rounded-xl">
                <DollarSign size={22} />
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-textMuted uppercase">Sucursales Activas</p>
                <h3 className="text-xl font-bold text-textMain mt-1">{data?.sales_by_branch?.length || 0}</h3>
              </div>
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                <Store size={22} />
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-textMuted uppercase">Metas Evaluadas</p>
                <h3 className="text-xl font-bold text-textMain mt-1">{data?.targets?.length || 0}</h3>
              </div>
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                <Target size={22} />
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-textMuted uppercase">Operaciones Álgebra</p>
                <h3 className="text-xl font-bold text-textMain mt-1">{data?.total_operations || 0}</h3>
              </div>
              <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
                <BarChart3 size={22} />
              </div>
            </div>
          </div>

          {/* Sección 2: Desglose por Sucursales y Metas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Ventas por Sucursal */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <Store className="text-primary" size={20} />
                <h3 className="font-bold text-textMain">Ventas por Sucursal</h3>
              </div>
              <div className="space-y-3">
                {data?.sales_by_branch && data.sales_by_branch.length > 0 ? (
                  data.sales_by_branch.map((item, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                      <span className="text-sm font-medium text-textMain">{item.branch}</span>
                      <span className="text-sm font-bold text-primary">
                        S/ {item.total.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-textMuted">No hay ventas por sucursal registradas.</p>
                )}
              </div>
            </div>

            {/* Cumplimiento de Metas */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <Target className="text-emerald-600" size={20} />
                <h3 className="font-bold text-textMain">Cumplimiento de Metas por Sede</h3>
              </div>
              <div className="space-y-4">
                {data?.targets && data.targets.length > 0 ? (
                  data.targets.map((item, index) => (
                    <div key={index} className="space-y-1">
                      <div className="flex justify-between text-xs font-medium text-textMain">
                        <span>{item.branch} ({item.period})</span>
                        <span className="font-bold">{item.percentage}%</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2">
                        <div 
                          className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(item.percentage, 100)}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[11px] text-textMuted">
                        <span>Logrado: S/ {item.achieved_amount}</span>
                        <span>Meta: S/ {item.target_amount}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-textMuted">No hay metas registradas para evaluar.</p>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Sección 3: Tarjetas de Modelos Algebraicos Matriciales */}
      <h2 className="text-lg font-bold text-textMain pt-2">Modelos Algebraicos y Operaciones</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Tarjeta Reporte 1 */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-50 text-primary rounded-xl">
              <TrendingUp size={22} />
            </div>
            <div>
              <h3 className="font-bold text-textMain">Reporte de Cumplimiento de Metas</h3>
              <p className="text-xs text-textMuted">Resta Matricial: A (real) - B (meta)</p>
            </div>
          </div>
          <p className="text-sm text-textMuted">
            Evalúa las diferencias entre las ventas reales y las proyectadas por cada producto y sucursal.
          </p>
          <div className="pt-2 flex justify-between items-center border-t border-slate-100">
            <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
              Matriz Resultante Disponible
            </span>
            <button className="text-sm font-semibold text-primary hover:underline flex items-center gap-1">
              Ver Detalle <FileText size={14} />
            </button>
          </div>
        </div>

        {/* Tarjeta Reporte 2 */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-cyan-50 text-accent rounded-xl">
              <DollarSign size={22} />
            </div>
            <div>
              <h3 className="font-bold text-textMain">Proyección con Incremento de IGV (18%)</h3>
              <p className="text-xs text-textMuted">Multiplicación por Escalar: 1.18 · A</p>
            </div>
          </div>
          <p className="text-sm text-textMuted">
            Cálculo automatizado del valor total bruto considerando tributos sobre el catálogo completo.
          </p>
          <div className="pt-2 flex justify-between items-center border-t border-slate-100">
            <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
              Matriz Resultante Disponible
            </span>
            <button className="text-sm font-semibold text-primary hover:underline flex items-center gap-1">
              Ver Detalle <FileText size={14} />
            </button>
          </div>
        </div>

        {/* Tarjeta Reporte 3 */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4 md:col-span-2">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
              <Store size={22} />
            </div>
            <div>
              <h3 className="font-bold text-textMain">Matriz de Ingresos Totales por Sucursal</h3>
              <p className="text-xs text-textMuted">Producto Matricial: P × Q</p>
            </div>
          </div>
          <p className="text-sm text-textMuted">
            Multiplicación del vector de precios unitarios por la matriz de cantidades vendidas para obtener la facturación agregada por sede.
          </p>
          <div className="pt-2 flex justify-between items-center border-t border-slate-100">
            <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
              Matriz Resultante Disponible
            </span>
            <button className="text-sm font-semibold text-primary hover:underline flex items-center gap-1">
              Ver Detalle <FileText size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};