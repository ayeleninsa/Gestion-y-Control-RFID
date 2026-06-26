from fastapi import APIRouter, Depends

from app.api.dependencies import get_current_user
from app.services.simulador import simulador

router = APIRouter(prefix="/api/simulacion", tags=["Simulacion"])


@router.get("/stats")
async def get_stats(current_user=Depends(get_current_user)):
    return simulador.get_stats()


@router.get("/actividad")
async def get_actividad(limite: int = 10, current_user=Depends(get_current_user)):
    return simulador.get_actividad(limite)


@router.get("/alertas")
async def get_alertas(limite: int = 20, current_user=Depends(get_current_user)):
    return simulador.get_alertas(limite)


@router.get("/eventos-qr")
async def get_eventos_qr(limite: int = 20, current_user=Depends(get_current_user)):
    return simulador.get_eventos_qr(limite)


@router.get("/lecturas-antenna")
async def get_lecturas_antenna(limite: int = 20, current_user=Depends(get_current_user)):
    return simulador.get_lecturas_antenna(limite)


@router.get("/qr-fisico")
async def get_qr_fisico(current_user=Depends(get_current_user)):
    return simulador.get_qr_fisico()


@router.get("/qr-dinamico")
async def get_qr_dinamico(current_user=Depends(get_current_user)):
    return simulador.get_qr_dinamico()


@router.get("/prestamos")
async def get_prestamos(limite: int = 20, current_user=Depends(get_current_user)):
    return simulador.get_prestamos(limite)


@router.get("/camaras")
async def get_camaras(current_user=Depends(get_current_user)):
    return simulador.get_camaras()


@router.get("/grafico-prestamos")
async def get_grafico_prestamos(current_user=Depends(get_current_user)):
    return simulador.get_grafico_prestamos()
