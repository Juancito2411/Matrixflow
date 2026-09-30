import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from './components/layout/MainLayout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Empresa } from './pages/Empresa';
import { Sucursales } from './pages/Sucursales';
import { Productos } from './pages/Productos';
import { Inventario } from './pages/Inventario';
import { Ventas } from './pages/Ventas';
import { Vectores } from './pages/Vectores';
import { Matrices } from './pages/Matrices';
import { Operaciones } from './pages/Operaciones';
import { Historial } from './pages/Historial';
import { Reportes } from './pages/Reportes';

// Componente para proteger rutas autenticadas utilizando React.ReactNode
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        
        {/* Ruta pública */}
        <Route path="/login" element={<Login />} />

        {/* Rutas protegidas */}
        <Route
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/empresa" element={<Empresa />} />
          <Route path="/sucursales" element={<Sucursales />} />
          <Route path="/productos" element={<Productos />} />
          <Route path="/inventario" element={<Inventario />} />
          <Route path="/ventas" element={<Ventas />} />
          
          {/* Álgebra Lineal */}
          <Route path="/vectores" element={<Vectores />} />
          <Route path="/matrices" element={<Matrices />} />
          <Route path="/operaciones" element={<Operaciones />} />
          
          {/* Historial y Reportes */}
          <Route path="/historial" element={<Historial />} />
          <Route path="/reportes" element={<Reportes />} />
          <Route path="/configuracion" element={<Empresa />} />
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;