import React, { useState, useEffect } from 'react';
import { ShoppingCart, Plus, Calendar, DollarSign, ArrowUpRight, Loader2, AlertCircle } from 'lucide-react';
import { SalesService, BranchService, ProductService } from '../services/Api';

interface Venta {
  id: number;
  created_at?: string;
  branch_id: number;
  branch_name?: string;
  total_amount: number;
  sale_details?: Array<{ quantity: number }>;
}

interface Branch {
  id: number;
  name: string;
}

interface Product {
  id: number;
  name: string;
  unit_price: number;
}

export const Ventas: React.FC = () => {
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [sucursales, setSucursales] = useState<Branch[]>([]);
  const [productos, setProductos] = useState<Product[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Estados del Modal
  const [modalAbierto, setModalAbierto] = useState(false);
  const [branchId, setBranchId] = useState<number | ''>('');
  const [productId, setProductId] = useState<number | ''>('');
  const [cantidad, setCantidad] = useState('1');

  // Cargar Ventas, Sucursales y Productos desde la BD
  const cargarDatos = async () => {
    try {
      setLoading(true);
      setError(null);

      const [resVentas, resSucursales, resProductos] = await Promise.all([
        SalesService.getSales(),
        BranchService.getBranches(),
        ProductService.getProducts(),
      ]);

      const dataVentas = resVentas.data || resVentas;
      const dataSucursales = resSucursales.data || resSucursales;
      const dataProductos = resProductos.data || resProductos;

      if (Array.isArray(dataVentas)) setVentas(dataVentas);
      if (Array.isArray(dataSucursales)) {
        setSucursales(dataSucursales);
        if (dataSucursales.length > 0) setBranchId(dataSucursales[0].id);
      }
      if (Array.isArray(dataProductos)) {
        setProductos(dataProductos);
        if (dataProductos.length > 0) setProductId(dataProductos[0].id);
      }
    } catch (err: any) {
      console.error('Error al cargar datos de ventas:', err);
      setError('No se pudieron obtener las ventas o sucursales de la base de datos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  // Registrar nueva venta en Supabase
  const handleNuevaVenta = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!branchId || !productId || !cantidad) return;

    const productoSeleccionado = productos.find((p) => p.id === Number(productId));
    if (!productoSeleccionado) return;

    const qty = parseInt(cantidad, 10);
    const totalCalculado = productoSeleccionado.unit_price * qty;

    try {
      setSaving(true);
      setError(null);

      const payload = {
        branch_id: Number(branchId),
        total_amount: totalCalculado,
        items: [
          {
            product_id: productoSeleccionado.id,
            quantity: qty,
            unit_price: productoSeleccionado.unit_price,
          },
        ],
      };

      await SalesService.createSale(payload);

      setModalAbierto(false);
      setCantidad('1');
      await cargarDatos();
    } catch (err: any) {
      console.error('Error al registrar venta:', err);
      setError(err.response?.data?.detail || 'Error al guardar la venta.');
    } finally {
      setSaving(false);
    }
  };

  // Cálculos para las tarjetas superiores
  const totalRecaudado = ventas.reduce((acc, v) => acc + Number(v.total_amount || 0), 0);
  const ticketPromedio = ventas.length > 0 ? totalRecaudado / ventas.length : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 text-slate-500 gap-3">
        <Loader2 className="animate-spin" size={24} />
        <span>Cargando ventas e información de la base de datos...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-textMain">Registro de Ventas</h1>
          <p className="text-textMuted text-sm mt-1">
            Historial transaccional sincronizado en tiempo real con Supabase.
          </p>
        </div>
        <button
          onClick={() => setModalAbierto(true)}
          className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-sm"
        >
          <Plus size={18} />
          Registrar Venta
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-xl flex items-center gap-3 text-sm">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Tarjetas de Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-textMuted uppercase">Monto Total Recaudado</p>
            <h3 className="text-2xl font-bold text-textMain mt-1">S/ {totalRecaudado.toFixed(2)}</h3>
          </div>
          <div className="p-3 bg-blue-50 text-primary rounded-xl">
            <DollarSign size={22} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-textMuted uppercase">Transacciones Totales</p>
            <h3 className="text-2xl font-bold text-textMain mt-1">{ventas.length} Transacciones</h3>
          </div>
          <div className="p-3 bg-cyan-50 text-accent rounded-xl">
            <ShoppingCart size={22} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-textMuted uppercase">Ticket Promedio</p>
            <h3 className="text-2xl font-bold text-textMain mt-1">S/ {ticketPromedio.toFixed(2)}</h3>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <ArrowUpRight size={22} />
          </div>
        </div>
      </div>

      {/* Tabla de Ventas */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {ventas.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-textMuted uppercase">
                  <th className="p-4">Código / ID</th>
                  <th className="p-4">Fecha</th>
                  <th className="p-4">ID Sucursal</th>
                  <th className="p-4 text-right">Total Transacción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-sm">
                {ventas.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 font-mono font-bold text-primary">VNT-{v.id}</td>
                    <td className="p-4 text-textMuted flex items-center gap-2">
                      <Calendar size={14} />
                      {v.created_at ? new Date(v.created_at).toLocaleDateString() : 'Hoy'}
                    </td>
                    <td className="p-4 font-medium text-textMain">
                      {v.branch_name || `Sucursal #${v.branch_id}`}
                    </td>
                    <td className="p-4 text-right font-mono font-bold text-emerald-600">
                      S/ {Number(v.total_amount).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-textMuted space-y-2">
            <ShoppingCart size={36} className="mx-auto text-slate-300" />
            <p className="font-semibold">No se encontraron ventas registradas</p>
            <p className="text-xs">Registra una nueva venta con el botón superior.</p>
          </div>
        )}
      </div>

      {/* Modal para Registrar Venta */}
      {modalAbierto && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md p-6 space-y-4">
            <h3 className="text-lg font-bold text-textMain">Registrar Nueva Venta</h3>
            <form onSubmit={handleNuevaVenta} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-textMuted uppercase mb-1">
                  Sucursal Origen *
                </label>
                <select
                  value={branchId}
                  onChange={(e) => setBranchId(Number(e.target.value))}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  {sucursales.length > 0 ? (
                    sucursales.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} (ID: {b.id})
                      </option>
                    ))
                  ) : (
                    <option value="">No hay sucursales encontradas</option>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-textMuted uppercase mb-1">
                  Producto *
                </label>
                <select
                  value={productId}
                  onChange={(e) => setProductId(Number(e.target.value))}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  {productos.length > 0 ? (
                    productos.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} - S/ {Number(p.unit_price).toFixed(2)}
                      </option>
                    ))
                  ) : (
                    <option value="">No hay productos disponibles</option>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-textMuted uppercase mb-1">
                  Cantidad *
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={cantidad}
                  onChange={(e) => setCantidad(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalAbierto(false)}
                  className="px-4 py-2 border border-slate-300 text-textMain rounded-lg text-sm font-medium hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving || sucursales.length === 0 || productos.length === 0}
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-hover disabled:opacity-50"
                >
                  {saving && <Loader2 className="animate-spin" size={16} />}
                  {saving ? 'Guardando...' : 'Guardar Venta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};