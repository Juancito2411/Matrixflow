import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://matrixflow-zdrs.onrender.com/api/v1';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor de Peticiones: Adjunta el token Bearer en el encabezado Authorization
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor de Respuestas: Maneja casos de sesión expirada (401)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      console.warn('Sesión no autorizada o token expirado (401). Redirigiendo a Login...');
    }
    return Promise.reject(error);
  }
);

// ------------------------------------------------------------------
// AUTENTICACIÓN
// ------------------------------------------------------------------
export const AuthService = {
  login: async (credentials: { email: string; password: string }) => {
    const response = await api.post('/auth/login', credentials);
    if (response.data?.access_token || response.data?.token) {
      const token = response.data.access_token || response.data.token;
      localStorage.setItem('token', token);
    }
    return response.data;
  },
  logout: () => {
    localStorage.removeItem('token');
  }
};

// ------------------------------------------------------------------
// VECTORES
// ------------------------------------------------------------------
export const VectorService = {
  getVectors: async () => (await api.get('/vectors')).data,
  getVectorById: async (id: number) => (await api.get(`/vectors/${id}`)).data,
  createVector: async (data: { name: string; dimension: number; values: number[] }) =>
    (await api.post('/vectors', data)).data,
  updateVector: async (id: number, data: { name?: string; dimension?: number; values?: number[] }) =>
    (await api.put(`/vectors/${id}`, data)).data,
  deleteVector: async (id: number) => (await api.delete(`/vectors/${id}`)).data,
};

// ------------------------------------------------------------------
// MATRICES Y OPERACIONES MATRICIALES
// ------------------------------------------------------------------
export const MatrixService = {
  // Ejecuta operaciones matemáticas (Suma, Resta, Multiplicación, Transpuesta)
  executeOperation: async (payload: {
    matrix_a?: number[][];
    matrix_b?: number[][];
    scalar?: number;
    op_type?: string;
    operation?: string;
  }) => {
    const response = await api.post('/operations', payload);
    return response.data;
  },

  // Guarda una matriz individual en Supabase
  saveMatrix: async (name: string, matrix_data: number[][]) => {
    const response = await api.post('/matrices', {
      name,
      matrix_data,
      rows: matrix_data.length,
      columns: matrix_data[0]?.length || 0
    });
    return response.data;
  },

  // Obtiene el catálogo de matrices guardadas
  getMatrices: async () => {
    const response = await api.get('/matrices');
    return response.data;
  },

  // Obtiene el historial relacional consultando GET /operations
  getHistory: async () => {
    const response = await api.get('/operations');
    return response.data;
  },

  // Guardado auxiliar de vectores
  saveVector: async (name: string, values: number[]) => {
    const response = await api.post('/vectors', { name, values });
    return response.data;
  },

  getVectors: async () => {
    const response = await api.get('/vectors');
    return response.data;
  },
};

// ------------------------------------------------------------------
// PRODUCTOS Y CATEGORÍAS
// ------------------------------------------------------------------
export const ProductService = {
  getProducts: async () => (await api.get('/products')).data,
  getProductById: async (id: number) => (await api.get(`/products/${id}`)).data,
  createProduct: async (data: { code: string; name: string; unit_price: number; category_id?: number | null }) =>
    (await api.post('/products', data)).data,
  updateProduct: async (id: number, data: any) => (await api.put(`/products/${id}`, data)).data,
  deleteProduct: async (id: number) => (await api.delete(`/products/${id}`)).data,
  getCategories: async () => (await api.get('/categories')).data,
  createCategory: async (data: { name: string; description?: string }) => (await api.post('/categories', data)).data,
};

// ------------------------------------------------------------------
// VENTAS
// ------------------------------------------------------------------
export const SalesService = {
  getSales: async () => (await api.get('/sales')).data,
  getSaleDetail: async (id: number) => (await api.get(`/sales/${id}`)).data,
  createSale: async (data: {
    branch_id: number;
    user_id?: number;
    total_amount: number;
    items: Array<{ product_id: number; quantity: number; unit_price: number }>;
  }) => (await api.post('/sales', data)).data,
};

// ------------------------------------------------------------------
// INVENTARIO Y STOCK
// ------------------------------------------------------------------
export const InventoryService = {
  getInventory: async () => (await api.get('/inventory')).data,
  updateStock: async (data: { branch_id: number; product_id: number; stock: number }) =>
    (await api.post('/inventory', data)).data,
  getMovements: async () => (await api.get('/inventory/movements')).data,
  registerMovement: async (data: { inventory_id: number; movement_type: 'IN' | 'OUT' | 'ADJUSTMENT'; quantity: number }) =>
    (await api.post('/inventory/movements', data)).data,
};

// ------------------------------------------------------------------
// USUARIOS Y ROLES
// ------------------------------------------------------------------
export const UserService = {
  getUsers: async () => (await api.get('/users')).data,
  getRoles: async () => (await api.get('/roles')).data,
  createUser: async (data: { email: string; password: string; full_name: string; role_id: number }) =>
    (await api.post('/users', data)).data,
  updateUser: async (id: number, data: { full_name?: string; role_id?: number; is_active?: boolean }) =>
    (await api.put(`/users/${id}`, data)).data,
  deleteUser: async (id: number) => (await api.delete(`/users/${id}`)).data,
};

// ------------------------------------------------------------------
// EMPRESAS Y SUCURSALES
// ------------------------------------------------------------------
export const CompanyService = {
  getCompanies: async () => (await api.get('/companies')).data,
  getCompanyById: async (id: number) => (await api.get(`/companies/${id}`)).data,
  createCompany: async (data: { name: string; tax_id: string; address?: string }) => (await api.post('/companies', data)).data,
  updateCompany: async (id: number, data: any) => (await api.put(`/companies/${id}`, data)).data,
  deleteCompany: async (id: number) => (await api.delete(`/companies/${id}`)).data,
};

export const BranchService = {
  getBranches: async (companyId?: number) => (await api.get('/branches', { params: { company_id: companyId } })).data,
  getBranchById: async (id: number) => (await api.get(`/branches/${id}`)).data,
  createBranch: async (data: { company_id: number; name: string; location?: string }) => (await api.post('/branches', data)).data,
  updateBranch: async (id: number, data: any) => (await api.put(`/branches/${id}`, data)).data,
  deleteBranch: async (id: number) => (await api.delete(`/branches/${id}`)).data,
};

// ------------------------------------------------------------------
// REPORTES, METAS Y AUDITORÍA
// ------------------------------------------------------------------
export const ReportService = {
  getSummaryReports: async () => (await api.get('/reports')).data,
  getFullSummary: async () => (await api.get('/reports/summary')).data,
  getSalesByBranch: async () => (await api.get('/reports/sales-by-branch')).data,
  getTargets: async () => (await api.get('/targets')).data,
  createTarget: async (data: { branch_id: number; period: string; target_amount: number }) => (await api.post('/targets', data)).data,
};

export const AuditService = {
  getAuditLogs: async () => (await api.get('/audit')).data,
};