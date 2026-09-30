import React, { useState, useEffect } from 'react';
import { Store, Plus, Search, Trash2, Loader2, AlertCircle, Building2 } from 'lucide-react';
import { BranchService, CompanyService } from '../services/Api';

interface Sucursal {
  id: number;
  company_id: number;
  name: string;
  location?: string; // Corregido: 'location' según Supabase
  created_at?: string;
}

export const Sucursales: React.FC = () => {
  const [sucursales, setSucursales] = useState<Sucursal[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Datos para modal y creación
  const [modalAbierto, setModalAbierto] = useState(false);
  const [companyId, setCompanyId] = useState<number | null>(null);
  const [nombre, setNombre] = useState('');
  const [ubicacion, setUbicacion] = useState('');

  // 1. Cargar Empresa y Sucursales desde el Backend
  const cargarDatos = async () => {
    try {
      setLoading(true);
      setError(null);

      const resCompanies = await CompanyService.getCompanies();
      const companiesData = resCompanies.data || resCompanies;

      if (Array.isArray(companiesData) && companiesData.length > 0) {
        const activeCompanyId = companiesData[0].id;
        setCompanyId(activeCompanyId);

        const resBranches = await BranchService.getBranches();
        const branchesData = resBranches.data || resBranches;

        if (Array.isArray(branchesData)) {
          setSucursales(branchesData);
        }
      } else {
        setError('Primero debes registrar una Empresa en la sección "Empresa".');
      }
    } catch (err: any) {
      console.error('Error al cargar sucursales:', err);
      setError('No se pudieron obtener las sucursales del servidor.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  // 2. Crear nueva Sucursal (POST enviando 'location')
  const handleCrear = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre || !companyId) return;

    try {
      setSaving(true);
      setError(null);

      // Payload ajustado exactamente a la columna 'location' de Supabase
      const payload = {
        company_id: companyId,
        name: nombre,
        location: ubicacion,
      };

      const res = await BranchService.createBranch(payload);

      if (res.success || res.id || res.data) {
        setNombre('');
        setUbicacion('');
        setModalAbierto(false);
        await cargarDatos(); // Recargar lista desde Supabase
      }
    } catch (err: any) {
      console.error('Error al crear sucursal:', err);
      setError(err.response?.data?.detail || 'Error al guardar la sucursal.');
    } finally {
      setSaving(false);
    }
  };

  // 3. Eliminar Sucursal
  const eliminarSucursal = async (id: number) => {
    if (!window.confirm('¿Estás seguro de eliminar esta sucursal?')) return;

    try {
      setError(null);
      await BranchService.deleteBranch(id);
      setSucursales(prev => prev.filter(s => s.id !== id));
    } catch (err: any) {
      console.error('Error al eliminar sucursal:', err);
      setError('No se pudo eliminar la sucursal.');
    }
  };

  const filtradas = sucursales.filter(s =>
    s.name.toLowerCase().includes(busqueda.toLowerCase()) ||
    (s.location && s.location.toLowerCase().includes(busqueda.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 text-slate-500 gap-3">
        <Loader2 className="animate-spin" size={24} />
        <span>Cargando sucursales desde la base de datos...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-textMain">Gestión de Sucursales</h1>
          <p className="text-textMuted text-sm mt-1">
            Administra las sedes físicas y puntos de venta activos en la organización.
          </p>
        </div>
        <button
          onClick={() => setModalAbierto(true)}
          disabled={!companyId}
          className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-sm disabled:opacity-50"
        >
          <Plus size={18} />
          Nueva Sucursal
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-xl flex items-center gap-3 text-sm">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Barra de Búsqueda */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
        <Search size={18} className="text-slate-400" />
        <input
          type="text"
          placeholder="Buscar por nombre o dirección..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="w-full text-sm outline-none bg-transparent"
        />
      </div>

      {/* Tabla de Sucursales */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {filtradas.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-textMuted uppercase">
                  <th className="p-4">ID</th>
                  <th className="p-4">Sucursal</th>
                  <th className="p-4">Dirección / Ubicación</th>
                  <th className="p-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-sm">
                {filtradas.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 text-slate-400 font-mono text-xs">#{s.id}</td>
                    <td className="p-4 font-semibold text-textMain flex items-center gap-3">
                      <div className="p-2 bg-blue-50 text-primary rounded-lg">
                        <Store size={18} />
                      </div>
                      {s.name}
                    </td>
                    <td className="p-4 text-textMuted">{s.location || 'Sin dirección registrada'}</td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => eliminarSucursal(s.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                          title="Eliminar sucursal"
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
            <Building2 size={36} className="mx-auto text-slate-300" />
            <p className="font-semibold">No se encontraron sucursales</p>
            <p className="text-xs">Crea una nueva sede utilizando el botón de arriba.</p>
          </div>
        )}
      </div>

      {/* Modal de Registro */}
      {modalAbierto && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md p-6 space-y-4">
            <h3 className="text-lg font-bold text-textMain">Registrar Nueva Sucursal</h3>
            <form onSubmit={handleCrear} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-textMuted uppercase mb-1">
                  Nombre de la Sede *
                </label>
                <input
                  type="text"
                  required
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej. Sucursal Arequipa Norte"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-textMuted uppercase mb-1">
                  Dirección / Ubicación
                </label>
                <input
                  type="text"
                  value={ubicacion}
                  onChange={(e) => setUbicacion(e.target.value)}
                  placeholder="Ej. Av. Ejercito 123, Arequipa"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
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
                  {saving ? 'Guardando...' : 'Guardar Sucursal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};