// Datos simulados de ventas por sucursal (Matriz de Ventas x Mes)
export const mockVentasSucursales = [
    { mes: 'Ene', Lima: 120000, Arequipa: 85000, Trujillo: 65000, Cusco: 45000, Piura: 38000 },
    { mes: 'Feb', Lima: 135000, Arequipa: 92000, Trujillo: 70000, Cusco: 50000, Piura: 42000 },
    { mes: 'Mar', Lima: 150000, Arequipa: 98000, Trujillo: 78000, Cusco: 55000, Piura: 45000 },
    { mes: 'Abr', Lima: 142000, Arequipa: 90000, Trujillo: 72000, Cusco: 52000, Piura: 41000 },
    { mes: 'May', Lima: 90000, Arequipa: 105000, Trujillo: 85000, Cusco: 60000, Piura: 48000 },
    { mes: 'Jun', Lima: 175000, Arequipa: 112000, Trujillo: 89000, Cusco: 64000, Piura: 52000 },
  ];
  
  // Comparativo de Ventas Reales vs Metas (Resta Matricial)
  export const mockMetasvsReales = [
    { sucursal: 'Lima', VentasReales: 175000, Meta: 160000, Diferencia: 15000 },
    { sucursal: 'Arequipa', VentasReales: 112000, Meta: 120000, Diferencia: -8000 },
    { sucursal: 'Trujillo', VentasReales: 89000, Meta: 85000, Diferencia: 4000 },
    { sucursal: 'Cusco', VentasReales: 64000, Meta: 60000, Diferencia: 4000 },
    { sucursal: 'Piura', VentasReales: 52000, Meta: 55000, Diferencia: -3000 },
  ];