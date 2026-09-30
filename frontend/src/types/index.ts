// src/types/index.ts

export interface Sucursal {
  id: string;
  nombre: string;
  ciudad: string;
  estado: boolean;
}

export interface Producto {
  id: string;
  nombre: string;
  categoria: string;
  precio: number;
}

// ⚠️ Esta interfaz es la que te está marcando error:
export interface VectorEmpresarial {
  id: string;
  nombre: string;
  etiquetas: string[];
  valores: number[];
}

export interface MatrizEmpresarial {
  id: string;
  nombre: string;
  filas: number;
  columnas: number;
  etiquetasFilas: string[];
  etiquetasColumnas: string[];
  valores: number[][];
}