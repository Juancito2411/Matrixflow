import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, ArrowRight, ShieldCheck, TrendingUp, Grid, Sparkles, Building2 } from 'lucide-react';
import { AuthService } from '../services/Api';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('admin@matrixflow.com');
  const [password, setPassword] = useState('123456');
  const [selectedRole, setSelectedRole] = useState<'admin' | 'analyst'>('admin');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Limpiar tokens e información previa del localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userEmail');

    try {
      // 1. Llamada a la API de autenticación
      const response = await AuthService.login({ email, password });
      
      const token = response.access_token || response.token;

      // 2. Validación Estricta: Solo navegar si hay un Token JWT devuelto por el servidor
      if (token) {
        localStorage.setItem('token', token);
        localStorage.setItem('userRole', response.user?.role || response.role || selectedRole);
        localStorage.setItem('userEmail', response.user?.email || email);
        
        // Redirección ÚNICAMENTE si la autenticación fue exitosa en el backend
        navigate('/dashboard');
      } else {
        setError('Respuesta no válida del servidor de autenticación.');
      }
    } catch (err: any) {
      console.error('Error al iniciar sesión:', err);
      // Captura el mensaje de error de FastAPI o muestra un mensaje por defecto
      const msg = err.response?.data?.detail || 'Credenciales incorrectas o servidor no disponible.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-slate-950 font-sans antialiased selection:bg-primary selection:text-white">
      {/* PANEL IZQUIERDO */}
      <div className="hidden lg:flex lg:w-7/12 relative flex-col justify-between p-12 overflow-hidden border-r border-slate-800/60 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <div 
          className="absolute inset-0 opacity-[0.07] pointer-events-none" 
          style={{
            backgroundImage: `radial-gradient(#2563EB 1px, transparent 1px), radial-gradient(#06B6D4 1px, transparent 1px)`,
            backgroundSize: '32px 32px',
            backgroundPosition: '0 0, 16px 16px'
          }}
        />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/15 rounded-full blur-[140px] pointer-events-none" />

        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-tr from-primary to-accent rounded-xl flex items-center justify-center shadow-lg shadow-primary/25">
            <Grid className="text-white" size={22} />
          </div>
          <div>
            <span className="text-xl font-bold tracking-wider text-white">MATRIX<span className="text-accent">FLOW</span></span>
            <span className="ml-2 text-[10px] font-semibold tracking-widest text-accent bg-accent/10 border border-accent/20 px-2 py-0.5 rounded-full uppercase">Enterprise v2.0</span>
          </div>
        </div>

        <div className="relative z-10 max-w-2xl mx-auto my-auto text-center space-y-6 flex flex-col items-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-800/80 border border-slate-700/60 text-accent text-xs font-medium">
            <Sparkles size={14} />
            <span>Transformación Digital & Álgebra Lineal Empresarial</span>
          </div>

          <h1 className="text-4xl xl:text-5xl font-extrabold text-white leading-[1.2] tracking-tight">
            Gestiona tu empresa de forma <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-400 to-teal-300">
              inteligente y matemática
            </span>.
          </h1>

          <p className="text-slate-400 text-base leading-relaxed max-w-lg">
            Optimiza decisiones complejas mediante modelos matriciales de ventas, control multidimensional de inventarios y análisis proyectivo en tiempo real.
          </p>

          <div className="grid grid-cols-2 gap-4 pt-4 w-full max-w-lg text-left">
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 backdrop-blur-md">
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold mb-1">
                <TrendingUp size={16} />
                <span>Precisión del 99.8%</span>
              </div>
              <p className="text-sm font-medium text-slate-200">Modelado Matricial Proyectivo</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 backdrop-blur-md">
              <div className="flex items-center gap-2 text-cyan-400 text-xs font-semibold mb-1">
                <ShieldCheck size={16} />
                <span>Auditoría Nivel B2B</span>
              </div>
              <p className="text-sm font-medium text-slate-200">Trazabilidad de Operaciones</p>
            </div>
          </div>
        </div>

        <div className="relative z-10 flex items-center justify-between border-t border-slate-800/80 pt-6 text-xs text-slate-500">
          <p>© 2026 MatrixFlow Inc. Todos los derechos reservados.</p>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Privacidad</span>
            <span>Términos</span>
            <span>Soporte TI</span>
          </div>
        </div>
      </div>

      {/* PANEL DERECHO */}
      <div className="w-full lg:w-5/12 bg-white flex items-center justify-center p-8 sm:p-12 relative">
        <div className="w-full max-w-md space-y-8">
          <div>
            <div className="flex lg:hidden items-center gap-2 mb-6">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white">
                <Grid size={18} />
              </div>
              <span className="text-lg font-bold tracking-wider text-slate-900">MATRIX<span className="text-primary">FLOW</span></span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Bienvenido de nuevo
            </h2>
            <p className="text-sm text-slate-500 mt-2">
              Ingresa tus credenciales corporativas para acceder a la consola empresarial.
            </p>
          </div>

          {/* Selector de Rol */}
          <div className="p-1.5 bg-slate-100 rounded-xl flex items-center gap-1 border border-slate-200">
            <button
              type="button"
              onClick={() => { setSelectedRole('admin'); setEmail('admin@matrixflow.com'); setPassword('123456'); }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                selectedRole === 'admin' 
                  ? 'bg-white text-slate-900 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Administrador
            </button>
            <button
              type="button"
              onClick={() => { setSelectedRole('analyst'); setEmail('analista@matrixflow.com'); setPassword('123456'); }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                selectedRole === 'analyst' 
                  ? 'bg-white text-slate-900 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Analista Financiero
            </button>
          </div>

          {/* Alerta de Error */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 font-medium animate-fadeIn">
              {error}
            </div>
          )}

          {/* Formulario */}
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Correo Corporativo
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 text-slate-400" size={18} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium text-slate-800"
                  placeholder="usuario@empresa.com"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Contraseña
                </label>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 text-slate-400" size={18} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium text-slate-800"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary-hover text-white font-semibold py-3 px-4 rounded-xl text-sm transition-all shadow-lg shadow-primary/25 hover:shadow-primary/40 flex items-center justify-center gap-2 group cursor-pointer disabled:opacity-50"
            >
              <span>{loading ? 'Autenticando...' : 'Acceder a la Plataforma'}</span>
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </form>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-slate-800">
              <Building2 size={14} className="text-primary" />
              <span>Entorno Enterprise</span>
            </div>
            <p className="text-slate-500">
              Ingresa con las credenciales creadas en la base de datos o utiliza los botones de demostración arriba.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;