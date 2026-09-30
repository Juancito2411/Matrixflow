import React, { useState, useEffect } from 'react';
import { Package, Search, Plus, AlertCircle, Loader2, X } from 'lucide-react';
import { InventoryService, BranchService, ProductService } from '../services/Api';

interface ItemInventario {
  id: number;
  product_id: number;
  branch_id: number;
  stock: number;
  product_name?: string;
  sku?: string;
  branch_name?: string;
}

export const Inventario: React.FC = () => {
  const [inventario, setInventario] = useState<ItemInventario[]>([]);
  const [sucursales, setSucursales] = useState<any[]>([]);
  const [productos, setProductos] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [filtroSucursal, setFiltroSucursal] = useState('Todas');
  const [busqueda, setBusqueda] = useState('');

  // Estado del Modal de Ajuste de Stock
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    branch_id: '',
    product_id: '',
    stock: ''
  });

  // Cargar datos desde la API y enriquecer inventario con datos de productos/sucursales
  const cargarInventario = async () => {
    try {
      setLoading(true);
      setError(null);

      const [resInventario, resSucursales, resProductos] = await Promise.all([
        InventoryService.getInventory().catch(() => []),
        BranchService.getBranches().catch(() => []),
        ProductService.getProducts().catch(() => []),
      ]);

      const rawInv = resInventario?.data || resInventario;
      const rawSuc = resSucursales?.data || resSucursales;
      const rawProd = resProductos?.data || resProductos;

      const listInv = Array.isArray(rawInv) ? rawInv : [];
      const listSuc = Array.isArray(rawSuc) ? rawSuc : [];
      const listProd = Array.isArray(rawProd) ? rawProd : [];

      // Enriquecer inventario relacionando product_id y branch_id
      const inventarioEnriquecido = listInv.map((inv: any) => {
        const prod = listProd.find((p: any) => Number(p.id) === Number(inv.product_id));
        const suc = listSuc.find((s: any) => Number(s.id) === Number(inv.branch_id));

        return {
          ...inv,
          product_name: inv.product_name || prod?.name || prod?.nombre || `Producto #${inv.product_id}`,
          sku: inv.sku || prod?.code || prod?.sku || `PROD-${inv.product_id}`,
          branch_name: inv.branch_name || suc?.name || suc?.nombre || `Sucursal #${inv.branch_id}`,
        };
      });

      setInventario(inventarioEnriquecido);
      setSucursales(listSuc);
      setProductos(listProd);
    } catch (err: any) {
      console.error('Error al cargar datos:', err);
      setError('No se pudo establecer conexión con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarInventario();
  }, []);

  // Guardar ajuste de stock
  const handleSaveStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.branch_id || !formData.product_id || formData.stock === '') return;

    try {
      setSaving(true);
      await InventoryService.updateStock({
        branch_id: Number(formData.branch_id),
        product_id: Number(formData.product_id),
        stock: Number(formData.stock)
      });
      
      setIsModalOpen(false);
      setFormData({ branch_id: '', product_id: '', stock: '' });
      cargarInventario();
    } catch (err) {
      console.error('Error al actualizar el stock:', err);
      alert('Error al guardar el ajuste de stock.');
    } finally {
      setSaving(false);
    }
  };

  // Filtrado de la tabla de inventario
  const filtrados = inventario.filter((item) => {
    const nombreSucursal = item.branch_name || `Sucursal #${item.branch_id}`;
    const coincideSucursal = filtroSucursal === 'Todas' || nombreSucursal === filtroSucursal;
    
    const nombreProd = item.product_name || '';
    const codigoProd = item.sku || '';

    const coincideTexto =
      nombreProd.toLowerCase().includes(busqueda.toLowerCase()) ||
      codigoProd.toLowerCase().includes(busqueda.toLowerCase());

    return coincideSucursal && coincideTexto;
  });

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Control de Inventarios</h1>
          <p className="text-slate-500 text-sm mt-1">
            Matriz de existencias en tiempo real distribuidas por producto y sucursal.
          </p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-sm cursor-pointer"
        >
          <Plus size={18} />
          Ajustar Stock
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-xl flex items-center gap-3 text-sm">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Controles y Filtros */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
          <Search size={18} className="text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por SKU o Producto..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full text-sm outline-none bg-transparent"
          />
        </div>

        <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
          <select
            value={filtroSucursal}
            onChange={(e) => setFiltroSucursal(e.target.value)}
            className="w-full h-full text-sm font-medium bg-transparent outline-none px-2 text-slate-800"
          >
            <option value="Todas">Todas las Sucursales</option>
            {sucursales.map((s: any) => {
              const nombreSuc = s.name || s.nombre || `Sucursal #${s.id || s.branch_id}`;
              return (
                <option key={s.id || s.branch_id} value={nombreSuc}>
                  {nombreSuc}
                </option>
              );
            })}
          </select>
        </div>
      </div>

      {/* Tabla de Inventario limpia */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase">
                <th className="p-4">SKU / Código</th>
                <th className="p-4">Producto</th>
                <th className="p-4">Sucursal</th>
                <th className="p-4 text-right">Stock</th>
                <th className="p-4 text-center">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-slate-500">
                    <div className="flex items-center justify-center gap-3">
                      <Loader2 className="animate-spin text-indigo-600" size={22} />
                      <span>Cargando existencias de inventario...</span>
                    </div>
                  </td>
                </tr>
              ) : filtrados.length > 0 ? (
                filtrados.map((item) => {
                  const sku = item.sku || `PROD-${item.product_id}`;
                  const nombre = item.product_name || 'Producto';
                  const sucursal = item.branch_name || `Sucursal #${item.branch_id}`;

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4 font-mono font-bold text-slate-500">{sku}</td>
                      <td className="p-4 font-semibold text-slate-800 flex items-center gap-2">
                        <Package size={16} className="text-indigo-500" />
                        {nombre}
                      </td>
                      <td className="p-4 font-medium text-slate-700">{sucursal}</td>
                      <td className="p-4 text-right font-bold text-indigo-600">{item.stock} u.</td>
                      <td className="p-4 text-center">
                        {item.stock <= 10 ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700">
                            <AlertCircle size={13} /> Stock Bajo
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700">
                            Óptimo
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-slate-500 font-medium">
                    No se encontraron registros de inventario.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal para Ajustar Stock */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 relative">
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X size={20} />
            </button>
            <h2 className="text-lg font-bold text-slate-800 mb-4">Ajustar Stock de Inventario</h2>
            
            <form onSubmit={handleSaveStock} className="space-y-4">
              {/* Select Sucursal */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Sucursal</label>
                <select
                  required
                  value={formData.branch_id}
                  onChange={(e) => setFormData({ ...formData, branch_id: e.target.value })}
                  className="w-full p-2.5 text-sm border border-slate-200 rounded-lg outline-none focus:border-indigo-500 bg-white text-slate-800"
                >
                  <option value="">Selecciona una sucursal</option>
                  {sucursales.map((s: any) => {
                    const idSuc = s.id || s.branch_id;
                    const nombreSuc = s.name || s.nombre || `Sucursal #${idSuc}`;
                    return (
                      <option key={idSuc} value={idSuc}>
                        {nombreSuc}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Select Producto */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Producto</label>
                <select
                  required
                  value={formData.product_id}
                  onChange={(e) => setFormData({ ...formData, product_id: e.target.value })}
                  className="w-full p-2.5 text-sm border border-slate-200 rounded-lg outline-none focus:border-indigo-500 bg-white text-slate-800"
                >
                  <option value="">Selecciona un producto</option>
                  {productos.map((p: any) => {
                    const idProd = p.id || p.product_id;
                    const nombreProd = p.name || p.nombre || p.title || `Producto #${idProd}`;
                    return (
                      <option key={idProd} value={idProd}>
                        {nombreProd}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Input Stock */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Nuevo Stock</label>
                <input
                  type="number"
                  min="0"
                  required
                  placeholder="Ej: 50"
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                  className="w-full p-2.5 text-sm border border-slate-200 rounded-lg outline-none focus:border-indigo-500 bg-white text-slate-800"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  {saving && <Loader2 size={16} className="animate-spin" />}
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};