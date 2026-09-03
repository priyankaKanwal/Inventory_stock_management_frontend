from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.categories import router as category_router
from app.api.v1.suppliers import router as supplier_router
from app.api.v1.products import router as product_router


app = FastAPI(
    title="Inventory & Stock Management API",
    description="Backend API for Inventory and Stock Management",
    version="1.0.0"
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:4200",
        "http://127.0.0.1:4200",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(
    category_router,
    prefix="/api/v1"
)

app.include_router(
    supplier_router,
    prefix="/api/v1"
)

app.include_router(
    product_router,
    prefix="/api/v1"
)


@app.get("/")
def root():
    return {
        "message": "Inventory & Stock Management API is running"
    }