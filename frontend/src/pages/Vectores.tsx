import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Save, ArrowRightLeft, Layers, Loader2, RefreshCw, Package } from 'lucide-react';
import { VectorService, ProductService } from '../services/Api';

interface VectorItem {
  id?: number;
  name: string;
  dimension: number;
  values?: number[];
}

interface ProductItem {
  id: number;
  name: string;
  code?: string;
  unit_price?: number;
}

export const Vectores: React.FC = () => {
  const [listaVectores, setListaVectores] = useState<VectorItem[]>([]);
  const [productos, setProductos] = useState<ProductItem[]>([]);
  const [selectedVectorId, setSelectedVectorId] = useState<number | null>(null);

  // Estado del vector en edición
  const [nombre, setNombre] = useState('Vector Precios Base');
  const [valores, setValores] = useState<number[]>([1200, 25, 45, 300]);
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Cargar lista de vectores y productos desde la API
  const cargarDatos = async () => {
    try {
      setLoading(true);
      const [resVectores, resProductos] = await Promise.all([
        VectorService.getVectors().catch(() => []),
        ProductService.getProducts().catch(() => []),
      ]);

      const listVec = Array.isArray(resVectores?.data || resVectores) ? (resVectores?.data || resVectores) : [];
      const listProd = Array.isArray(resProductos?.data || resProductos) ? (resProductos?.data || resProductos) : [];

      setListaVectores(listVec);
      setProductos(listProd);
    } catch (err) {
      console.error('Error al cargar datos:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const agregarComponente = () => {
    setValores([...valores, 0]);
  };

  const eliminarComponente = (index: number) => {
    if (valores.length <= 1) return;
    setValores(valores.filter((_, i) => i !== index));
  };

  const handleValorChange = (index: number, val: number) => {
    const nuevosValores = [...valores];
    nuevosValores[index] = val;
    setValores(nuevosValores);
  };

  const seleccionarVector = async (vec: VectorItem) => {
    if (!vec.id) return;
    setSelectedVectorId(vec.id);
    setNombre(vec.name);
    
    try {
      setLoading(true);
      const res = await VectorService.getVectorById(vec.id).catch(() => null);
      const data = res?.data || res;
      if (data && Array.isArray(data.values)) {
        setValores(data.values);
      } else if (Array.isArray(vec.values)) {
        setValores(vec.values);
      }
    } catch (err) {
      console.error('Error al obtener valores del vector:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGuardarVector = async () => {
    if (!nombre.trim()) {
      alert('Ingresa un nombre para el vector.');
      return;
    }

    try {
      setSaving(true);
      const payload = {
        name: nombre,
        dimension: valores.length,
        values: valores
      };

      if (selectedVectorId) {
        await VectorService.updateVector(selectedVectorId, payload);
      } else {
        await VectorService.createVector(payload);
      }

      await cargarDatos();
      alert('Vector guardado correctamente');
    } catch (err) {
      console.error('Error al guardar vector:', err);
      alert('Ocurrió un error al guardar el vector.');
    } finally {
      setSaving(false);
    }
  };

  const nuevoVectorForm = () => {
    setSelectedVectorId(null);
    setNombre('Nuevo Vector');
    
    // Si hay productos creados, podemos inicializar los valores con los precios del catálogo
    if (productos.length > 0) {
      setValores(productos.slice(0, 4).map(p => p.unit_price || 0));
    } else {
      setValores([0, 0, 0, 0]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Editor de Vectores</h1>
          <p className="text-slate-500 text-sm mt-1">
            Gestiona vectores unidimensionales ($1 \times n$) asociados ordenadamente a tus productos.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={nuevoVectorForm}
            className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer"
          >
            <Plus size={18} />
            Nuevo
          </button>
          <button 
            onClick={handleGuardarVector}
            disabled={saving}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-sm cursor-pointer disabled:opacity-50"
          >
            {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            {selectedVectorId ? 'Actualizar Vector' : 'Guardar Vector'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Propiedades y Lista */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <Layers size={18} className="text-indigo-600" />
              Propiedades del Vector
            </h3>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Nombre del Vector</label>
              <input 
                type="text" 
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>

            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
              <p className="text-xs font-semibold text-slate-500">Dimensión Actual:</p>
              <p className="text-lg font-bold text-indigo-600 mt-1">1 × {valores.length}</p>
            </div>

            <button 
              onClick={agregarComponente}
              className="w-full flex items-center justify-center gap-2 border border-slate-300 hover:bg-slate-50 text-slate-700 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer"
            >
              <Plus size={16} />
              Añadir Elemento
            </button>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800">Vectores Registrados</h3>
              <button onClick={cargarDatos} className="text-slate-400 hover:text-indigo-600 cursor-pointer">
                <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              </button>
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto">
              {listaVectores.length > 0 ? (
                listaVectores.map((vec) => (
                  <div
                    key={vec.id}
                    onClick={() => seleccionarVector(vec)}
                    className={`p-3 rounded-lg border text-sm flex items-center justify-between cursor-pointer transition-colors ${
                      selectedVectorId === vec.id 
                        ? 'border-indigo-500 bg-indigo-50/50 font-bold text-indigo-900' 
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <span className="truncate">{vec.name}</span>
                    <span className="text-xs px-2 py-0.5 bg-slate-100 rounded text-slate-500 font-mono">
                      1 × {vec.dimension}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400">No hay vectores guardados aún.</p>
              )}
            </div>
          </div>
        </div>

        {/* Componentes mapeados con Productos */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
          <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <ArrowRightLeft size={18} className="text-indigo-600" />
            Componentes del Vector (Mapeo por Producto)
          </h3>

          <div className="space-y-3">
            {valores.map((val, idx) => {
              // Obtener el producto correspondiente según el índice si existe en la BD
              const prodCorrespondiente = productos[idx];

              return (
                <div key={idx} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-xs font-bold text-slate-400 w-16">Pos [{idx + 1}]</span>
                  
                  {/* Nombre/Identificador del producto correspondiente */}
                  <div className="flex-1 flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-md text-sm text-slate-700 truncate">
                    <Package size={16} className="text-indigo-500 shrink-0" />
                    <span className="font-medium truncate">
                      {prodCorrespondiente ? prodCorrespondiente.name : `Ítem #${idx + 1}`}
                    </span>
                  </div>

                  {/* Valor numérico del vector */}
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-semibold text-slate-400">S/</span>
                    <input 
                      type="number"
                      value={val}
                      onChange={(e) => handleValorChange(idx, Number(e.target.value))}
                      placeholder="0.00"
                      className="w-28 px-3 py-1.5 border border-slate-300 rounded-md text-sm font-bold text-right text-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 bg-white"
                    />
                  </div>

                  {/* Eliminar celda */}
                  <button 
                    onClick={() => eliminarComponente(idx)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                    title="Eliminar posición"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              );
            })}
          </div>

          {/* Representación Matemática */}
          <div className="pt-4 border-t border-slate-200">
            <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Representación Matemática</p>
            <div className="p-4 bg-slate-900 text-cyan-400 font-mono rounded-lg text-sm overflow-x-auto">
              V = [ {valores.join(', ')} ]
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};