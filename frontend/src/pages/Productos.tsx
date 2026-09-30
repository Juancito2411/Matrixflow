import React, { useState, useEffect } from 'react';
import { Package, Plus, Search, Trash2, Loader2, AlertCircle } from 'lucide-react';
import { ProductService } from '../services/Api';

interface Producto {
  id: number;
  code: string;
  name: string;
  category_id?: number | null;
  unit_price: number;
}

export const Productos: React.FC = () => {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Estados del modal
  const [modalAbierto, setModalAbierto] = useState(false);
  const [code, setCode] = useState('');
  const [nombre, setNombre] = useState('');
  const [precio, setPrecio] = useState('');

  // 1. Cargar Productos desde la Base de Datos
  const cargarProductos = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await ProductService.getProducts();
      const data = res.data || res;
      if (Array.isArray(data)) {
        setProductos(data);
      }
    } catch (err: any) {
      console.error('Error al cargar productos:', err);
      setError('No se pudieron obtener los productos de la base de datos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarProductos();
  }, []);

  // 2. Crear Producto en Supabase
  const handleCrear = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre || !code || !precio) return;

    try {
      setSaving(true);
      setError(null);

      // Payload exacto a las columnas de Supabase (code, name, unit_price, category_id)
      const payload = {
        code: code,
        name: nombre,
        unit_price: parseFloat(precio),
        category_id: null, // Se envía null si no usas categorías por ahora
      };

      const res = await ProductService.createProduct(payload);

      if (res.success || res.id || res.data) {
        setCode('');
        setNombre('');
        setPrecio('');
        setModalAbierto(false);
        await cargarProductos();
      }
    } catch (err: any) {
      console.error('Error al crear producto:', err);
      setError(err.response?.data?.detail || 'Error al guardar el producto.');
    } finally {
      setSaving(false);
    }
  };

  // 3. Eliminar Producto
  const eliminarProducto = async (id: number) => {
    if (!window.confirm('¿Estás seguro de eliminar este producto?')) return;

    try {
      setError(null);
      await ProductService.deleteProduct(id);
      setProductos((prev) => prev.filter((p) => p.id !== id));
    } catch (err: any) {
      console.error('Error al eliminar producto:', err);
      setError('No se pudo eliminar el producto.');
    }
  };

  const filtrados = productos.filter(
    (p) =>
      p.name.toLowerCase().includes(busqueda.toLowerCase()) ||
      p.code.toLowerCase().includes(busqueda.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 text-slate-500 gap-3">
        <Loader2 className="animate-spin" size={24} />
        <span>Cargando productos desde la base de datos...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-textMain">Catálogo de Productos</h1>
          <p className="text-textMuted text-sm mt-1">
            Gestión de artículos registrados en la base de datos.
          </p>
        </div>
        <button
          onClick={() => setModalAbierto(true)}
          className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-sm"
        >
          <Plus size={18} />
          Nuevo Producto
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-xl flex items-center gap-3 text-sm">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Buscador */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
        <Search size={18} className="text-slate-400" />
        <input
          type="text"
          placeholder="Buscar producto por Código o Nombre..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="w-full text-sm outline-none bg-transparent"
        />
      </div>

      {/* Tabla de Productos */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {filtrados.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-textMuted uppercase">
                  <th className="p-4">Código</th>
                  <th className="p-4">Producto</th>
                  <th className="p-4 text-right">Precio Unitario (S/)</th>
                  <th className="p-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-sm">
                {filtrados.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 font-mono font-bold text-slate-500">{p.code}</td>
                    <td className="p-4 font-semibold text-textMain flex items-center gap-2">
                      <Package size={16} className="text-primary" />
                      {p.name}
                    </td>
                    <td className="p-4 text-right font-mono font-bold text-primary">
                      S/ {Number(p.unit_price).toFixed(2)}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => eliminarProducto(p.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                          title="Eliminar producto"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-textMuted space-y-2">
            <Package size={36} className="mx-auto text-slate-300" />
            <p className="font-semibold">No se encontraron productos</p>
            <p className="text-xs">Registra un nuevo producto con el botón de arriba.</p>
          </div>
        )}
      </div>

      {/* Modal de Registro */}
      {modalAbierto && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md p-6 space-y-4">
            <h3 className="text-lg font-bold text-textMain">Registrar Nuevo Producto</h3>
            <form onSubmit={handleCrear} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-textMuted uppercase mb-1">
                  Código (Code / SKU) *
                </label>
                <input
                  type="text"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Ej: PROD-001"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-textMuted uppercase mb-1">
                  Nombre del Producto *
                </label>
                <input
                  type="text"
                  required
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej: Laptop Pro 15"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-textMuted uppercase mb-1">
                  Precio Unitario (S/) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={precio}
                  onChange={(e) => setPrecio(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/50"
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
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-hover disabled:opacity-50"
                >
                  {saving && <Loader2 className="animate-spin" size={16} />}
                  {saving ? 'Guardando...' : 'Guardar Producto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};