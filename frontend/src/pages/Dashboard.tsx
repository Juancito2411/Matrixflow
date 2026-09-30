import React, { useEffect, useState } from 'react';
import { DollarSign, Store, Package, Calculator, TrendingUp } from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend 
} from 'recharts';

interface DashboardMetrics {
  total_ventas_monto: number;
  total_ventas_cantidad: number;
  operaciones_ejecutadas: number;
  total_productos: number;
}

interface BranchSale {
  branch: string;
  total: number;
}

interface TargetData {
  branch: string;
  target_amount: number;
  achieved_amount: number;
}

interface SummaryData {
  sales_by_branch: BranchSale[];
  targets: TargetData[];
}

export const Dashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [summary, setSummary] = useState<SummaryData>({ sales_by_branch: [], targets: [] });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [resMetrics, resBranchSales, resTargets] = await Promise.all([
          fetch('http://localhost:8000/api/v1/reports'),
          fetch('http://localhost:8000/api/v1/reports/sales-by-branch'),
          fetch('http://localhost:8000/api/v1/targets').catch(() => null)
        ]);

        if (!resMetrics.ok || !resBranchSales.ok) {
          throw new Error('Error al conectar con los datos del servidor.');
        }

        const dataMetrics = await resMetrics.json();
        const dataBranchSales = await resBranchSales.json();

        // 1. Mapeo dinámico de Métricas Generales
        const metricsObj = dataMetrics.data || dataMetrics;
        setMetrics({
          total_ventas_monto: Number(metricsObj.total_ventas_monto || metricsObj.total_sales_amount || 0),
          total_ventas_cantidad: Number(metricsObj.total_ventas_cantidad || metricsObj.total_sales_count || 0),
          operaciones_ejecutadas: Number(metricsObj.operaciones_ejecutadas || metricsObj.operations_count || 0),
          total_productos: Number(metricsObj.total_productos || metricsObj.products_count || 0)
        });

        // 2. Mapeo dinámico de Ventas por Sucursal
        const rawBranchData = Array.isArray(dataBranchSales) 
          ? dataBranchSales 
          : (dataBranchSales.data || dataBranchSales.sales_by_branch || []);

        const formattedBranchSales: BranchSale[] = rawBranchData.map((item: any) => ({
          branch: item.branch || item.branch_name || item.sucursal || item.name || `Sucursal ${item.branch_id || ''}`.trim(),
          total: Number(item.total || item.total_ventas || item.monto || item.amount || 0)
        }));

// 3. Mapeo dinámico de Metas y cruce inteligente por ID o Nombre
let formattedTargets: TargetData[] = [];
if (resTargets && resTargets.ok) {
  const dataTargets = await resTargets.json();
  const rawTargets = Array.isArray(dataTargets) ? dataTargets : (dataTargets.data || []);
  
  formattedTargets = rawTargets.map((item: any, index: number) => {
    // Buscar la sucursal correspondiente en las ventas por su índice, ID o nombre
    const matchedSale = formattedBranchSales.find((s, idx) => 
      s.branch.toLowerCase().includes((item.branch || '').toLowerCase()) ||
      (item.branch_id && idx + 1 === item.branch_id)
    ) || formattedBranchSales[index] || formattedBranchSales[0];

    const branchDisplayName = matchedSale ? matchedSale.branch : (item.branch || `Sucursal ${item.branch_id || ''}`.trim());
    const directAchieved = Number(item.achieved_amount || item.logrado || item.total_ventas || 0);

    return {
      branch: branchDisplayName,
      target_amount: Number(item.target_amount || item.meta || 0),
      achieved_amount: directAchieved > 0 ? directAchieved : (matchedSale ? matchedSale.total : 0)
    };
  });
        } else {
          // Fallback con los datos de ventas para mostrar comparativa si no hay endpoint de metas
          formattedTargets = formattedBranchSales.map(item => ({
            branch: item.branch,
            target_amount: item.total > 0 ? item.total * 1.2 : 10000,
            achieved_amount: item.total
          }));
        }

        setSummary({
          sales_by_branch: formattedBranchSales,
          targets: formattedTargets
        });

      } catch (err: any) {
        setError(err.message || 'Error desconocido');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64 text-textMuted">
        Cargando métricas del dashboard...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-600 rounded-xl border border-red-200">
        Ocurrió un error al cargar el Dashboard: {error}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Encabezado */}
      <div>
        <h1 className="text-2xl font-bold text-textMain">Panel Principal</h1>
        <p className="text-textMuted text-sm mt-1">
          Resumen analítico e indicadores consolidados en tiempo real.
        </p>
      </div>

      {/* Tarjetas KPI */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* KPI 1: Ventas Totales */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-textMuted uppercase tracking-wider">Ventas Totales</p>
            <h3 className="text-2xl font-bold text-textMain mt-1">
              S/ {(metrics?.total_ventas_monto || 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h3>
            <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full mt-2 inline-block">
              {metrics?.total_ventas_cantidad || 0} Transacciones
            </span>
          </div>
          <div className="p-3 bg-blue-50 text-primary rounded-xl">
            <DollarSign size={24} />
          </div>
        </div>

        {/* KPI 2: Sucursales con Ventas */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-textMuted uppercase tracking-wider">Sucursales con Ventas</p>
            <h3 className="text-2xl font-bold text-textMain mt-1">
              {summary.sales_by_branch.length} Sedes
            </h3>
            <span className="text-xs font-medium text-textMuted mt-2 inline-block">
              Ventas acumuladas
            </span>
          </div>
          <div className="p-3 bg-cyan-50 text-accent rounded-xl">
            <Store size={24} />
          </div>
        </div>

        {/* KPI 3: Productos Registrados */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-textMuted uppercase tracking-wider">Productos en Catálogo</p>
            <h3 className="text-2xl font-bold text-textMain mt-1">
              {metrics?.total_productos || 0} SKU
            </h3>
            <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full mt-2 inline-block">
              Catálogo Activo
            </span>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <Package size={24} />
          </div>
        </div>

        {/* KPI 4: Operaciones Algebraicas */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-textMuted uppercase tracking-wider">Operaciones Ejecutadas</p>
            <h3 className="text-2xl font-bold text-textMain mt-1">
              {metrics?.operaciones_ejecutadas || 0} Procesadas
            </h3>
            <span className="text-xs font-medium text-primary bg-blue-50 px-2 py-0.5 rounded-full mt-2 inline-block">
              Álgebra Lineal
            </span>
          </div>
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
            <Calculator size={24} />
          </div>
        </div>
      </div>

      {/* Sección de Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Gráfico 1: Ventas por Sucursal */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-textMain">Ventas Consolidadas por Sucursal</h3>
              <p className="text-xs text-textMuted">Monto total vendido por sede (S/)</p>
            </div>
            <TrendingUp size={20} className="text-primary" />
          </div>

          <div className="h-72 w-full">
            {summary.sales_by_branch.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={summary.sales_by_branch} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="branch" stroke="#64748b" fontSize={12} />
                  <YAxis stroke="#64748b" fontSize={12} />
                  <Tooltip formatter={(value: any) => [`S/ ${Number(value || 0).toFixed(2)}`, 'Ventas Totales']} />
                  <Bar dataKey="total" name="Ventas Totales" fill="#2563EB" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-textMuted">
                No hay datos de ventas por sucursal para mostrar.
              </div>
            )}
          </div>
        </div>

        {/* Gráfico 2: Ventas vs Metas */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-textMain">Cumplimiento de Metas</h3>
              <p className="text-xs text-textMuted">Comparativo: Logrado vs Meta Asignada</p>
            </div>
            <Calculator size={20} className="text-accent" />
          </div>

          <div className="h-72 w-full">
            {summary.targets.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={summary.targets} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="branch" stroke="#64748b" fontSize={12} />
                  <YAxis stroke="#64748b" fontSize={12} />
                  <Tooltip 
                    formatter={(value: any, name: any) => [
                      `S/ ${Number(value || 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                      name === 'achieved_amount' || name === 'Ventas Reales' ? 'Ventas Reales' : 'Meta Asignada'
                    ]} 
                  />
                  <Legend />
                  <Bar dataKey="achieved_amount" name="Ventas Reales" fill="#2563EB" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="target_amount" name="Meta Asignada" fill="#94A3B8" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-textMuted">
                No hay metas registradas para mostrar.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};