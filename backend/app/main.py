from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

# Importación modular de rutas
from app.api.routes import (
    auth,
    audit,
    companies,
    branches,
    products,
    sales,
    inventory,
    vectors,
    matrices,
    operations,
    reports,
    users
)
from app.core.config import SUPABASE_URL

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("🚀 Iniciando MatrixFlow Enterprise API...")
    print(f"🔗 Conectado a Supabase en: {SUPABASE_URL}")
    yield
    print("🛑 Apagando MatrixFlow Enterprise API...")

app = FastAPI(
    title="MatrixFlow Enterprise API",
    description="Backend en FastAPI y NumPy para la gestión analítica y matemática empresarial con persistencia en Supabase.",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)

origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "success": False,
            "error": "Error interno del servidor",
            "detail": str(exc)
        }
    )

API_PREFIX = "/api/v1"

# Registro Unificado de Routers
app.include_router(auth.router, prefix=API_PREFIX, tags=["Auth"])
app.include_router(audit.router, prefix=API_PREFIX, tags=["Audit"])
app.include_router(companies.router, prefix=API_PREFIX, tags=["Companies"])
app.include_router(branches.router, prefix=API_PREFIX, tags=["Branches"])
app.include_router(products.router, prefix=API_PREFIX, tags=["Products"])
app.include_router(sales.router, prefix=API_PREFIX, tags=["Sales"])
app.include_router(inventory.router, prefix=API_PREFIX, tags=["Inventory"])
app.include_router(vectors.router, prefix=API_PREFIX, tags=["Vectors"])
app.include_router(matrices.router, prefix=API_PREFIX, tags=["Matrices"])

# NOTA: Agregamos /operations al prefijo del router de operaciones
app.include_router(operations.router, prefix=f"{API_PREFIX}/operations", tags=["Operations"])

app.include_router(reports.router, prefix=API_PREFIX, tags=["Reports"])
app.include_router(users.router, prefix=API_PREFIX, tags=["Users"])

@app.get("/", tags=["System"])
def read_root():
    return {
        "sistema": "MatrixFlow Enterprise API",
        "estado": "Operativo",
        "version": "1.0.0",
        "documentacion": "/docs"
    }

@app.get(f"{API_PREFIX}/health", tags=["System"])
def health_check():
    return {
        "status": "healthy",
        "database": "connected",
        "engine": "NumPy active"
    }