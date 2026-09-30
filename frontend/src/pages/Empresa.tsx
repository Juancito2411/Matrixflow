import React, { useState, useEffect } from 'react';
import { Building2, Save, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { CompanyService } from '../services/Api';

export const Empresa: React.FC = () => {
  const [guardado, setGuardado] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [companyId, setCompanyId] = useState<number | null>(null);

  const [form, setForm] = useState({
    razonSocial: '',
    ruc: '',
    direccion: '',
  });

  // Cargar la empresa existente desde la base de datos
  useEffect(() => {
    const fetchCompany = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await CompanyService.getCompanies();

        // Si la API devuelve un array con al menos una empresa
        const companiesData = response.data || response;
        if (Array.isArray(companiesData) && companiesData.length > 0) {
          const company = companiesData[0];
          setCompanyId(company.id);
          setForm({
            razonSocial: company.name || '',
            ruc: company.tax_id || '',
            direccion: company.address || '',
          });
        }
      } catch (err: any) {
        console.error('Error al obtener la empresa:', err);
        setError('No se pudo cargar la información de la empresa desde el servidor.');
      } finally {
        setLoading(false);
      }
    };

    fetchCompany();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    // Payload que coincide 100% con la tabla 'companies' de PostgreSQL
    const payload = {
      name: form.razonSocial,
      tax_id: form.ruc,
      address: form.direccion,
    };

    try {
      let response;
      if (companyId) {
        // Actualizar empresa existente
        response = await CompanyService.updateCompany(companyId, payload);
      } else {
        // Crear nueva empresa si no existe ninguna
        response = await CompanyService.createCompany(payload);
        const newCompany = response.data || response;
        if (newCompany?.id) {
          setCompanyId(newCompany.id);
        }
      }

      setGuardado(true);
      setTimeout(() => setGuardado(false), 3000);
    } catch (err: any) {
      console.error('Error al guardar empresa:', err);
      setError(err.response?.data?.detail || 'Error al guardar los datos en el servidor.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 text-slate-500 gap-3">
        <Loader2 className="animate-spin" size={24} />
        <span>Cargando información de la empresa...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-textMain">Gestión de la Empresa</h1>
        <p className="text-textMuted text-sm mt-1">
          Configuración de la información general de la organización para los reportes.
        </p>
      </div>

      {guardado && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center gap-3 text-sm">
          <CheckCircle2 size={18} />
          <span>Información empresarial guardada correctamente.</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-xl flex items-center gap-3 text-sm">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-200">
          <div className="p-2 bg-blue-50 text-primary rounded-lg">
            <Building2 size={20} />
          </div>
          <div>
            <h3 className="text-base font-bold text-textMain">Perfil Organizacional</h3>
            <p className="text-xs text-textMuted">Datos fiscales registrados en la base de datos</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-semibold text-textMuted uppercase mb-1">
              Razón Social *
            </label>
            <input
              type="text"
              required
              placeholder="Ej. Corporación MatrixFlow S.A.C."
              value={form.razonSocial}
              onChange={(e) => setForm({ ...form, razonSocial: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-textMuted uppercase mb-1">
              RUC / Identificación Fiscal *
            </label>
            <input
              type="text"
              required
              placeholder="Ej. 20123456789"
              value={form.ruc}
              onChange={(e) => setForm({ ...form, ruc: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-textMuted uppercase mb-1">
              Dirección Fiscal
            </label>
            <input
              type="text"
              placeholder="Ej. Av. Principal 123, Oficina 401, Lima"
              value={form.direccion}
              onChange={(e) => setForm({ ...form, direccion: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors shadow-sm disabled:opacity-50"
          >
            {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
            {saving ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>
      </form>
    </div>
  );
};