from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.acceso import router as acceso_router
from app.api.auth import router as auth_router
from app.api.inventario import router as inventario_router
from app.api.rfid import router as rfid_router
from app.api.simulacion import router as simulacion_router
from app.api.users import router as users_router
from app.api.alumnos import router as alumnos_router
from app.api.qr_events import router as qr_events_router
from app.api.carreras import router as carreras_router
from app.core.config import settings
from app.services.seeder import seed_users, seed_personas, seed_camaras
from app.services.simulador import simulador


@asynccontextmanager
async def lifespan(app: FastAPI):
    await seed_users()
    persona_ids = await seed_personas()
    await seed_camaras(persona_ids)
    simulador.iniciar()
    yield
    simulador.detener()


app = FastAPI(
    title="Backend RFID",
    description="Inventario de computadoras y control de acceso",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins.split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(acceso_router)
app.include_router(auth_router)
app.include_router(users_router)
app.include_router(inventario_router)
app.include_router(rfid_router)
app.include_router(simulacion_router)
app.include_router(alumnos_router)
app.include_router(qr_events_router)
app.include_router(carreras_router)


@app.get("/api/health")
async def health():
    return {"status": "ok"}
