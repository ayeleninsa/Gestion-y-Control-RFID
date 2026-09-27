from datetime import datetime, timedelta, timezone

from sqlalchemy import select

from app.core.database import async_session
from app.core.security import hash_password
from app.models.camara import Camara
from app.models.evento_acceso import EventoAcceso
from app.models.persona import Persona
from app.models.user import User

SEED_USERS = [
    {
        "email": "admin@test.com",
        "username": "admin",
        "password": "admin123",
        "rol": "admin",
    },
    {
        "email": "preceptor@test.com",
        "username": "preceptor",
        "password": "preceptor123",
        "rol": "preceptor",
    },
]

SEED_PERSONAS = [
    {"nombre": "Carlos", "apellido": "Gimenez", "dni": "30123456", "correo": "cgimenez@ipf.edu.ar"},
    {"nombre": "Maria", "apellido": "Lopez", "dni": "27123123", "correo": "mlopez@ipf.edu.ar"},
    {"nombre": "Jose", "apellido": "Fernandez", "dni": "33456789", "correo": "jfernandez@ipf.edu.ar"},
    {"nombre": "Ana", "apellido": "Martinez", "dni": "28987456", "correo": "amartinez@ipf.edu.ar"},
]

SEED_CAMARAS = [
    {"nombre": "Camara Inventario", "ubicacion": "Puerta de ingreso al inventario", "ip": "192.168.1.100", "stream_url": "http://192.168.1.100:8080/video"},
    {"nombre": "Camara Hilook Aula TST", "ubicacion": "Aula principal TST (Hilook)", "ip": "192.168.1.104", "stream_url": "rtsp://admin:12345@192.168.1.104:554/Streaming/Channels/101"},
]

SEED_EVENTOS = [
    {"persona_idx": 0, "tipo": "ingreso", "confianza": 0.92, "resultado": "autorizado"},
    {"persona_idx": 1, "tipo": "ingreso", "confianza": 0.88, "resultado": "autorizado"},
    {"persona_idx": 0, "tipo": "ingreso", "confianza": 0.95, "resultado": "autorizado"},
    {"persona_idx": 2, "tipo": "ingreso", "confianza": 0.61, "resultado": "denegado"},
    {"persona_idx": None, "tipo": "ingreso", "confianza": 0.43, "resultado": "denegado"},
    {"persona_idx": 1, "tipo": "ingreso", "confianza": 0.97, "resultado": "autorizado"},
    {"persona_idx": 0, "tipo": "egreso", "confianza": 0.91, "resultado": "autorizado"},
    {"persona_idx": 3, "tipo": "ingreso", "confianza": 0.89, "resultado": "autorizado"},
    {"persona_idx": 2, "tipo": "ingreso", "confianza": 0.55, "resultado": "denegado"},
    {"persona_idx": 0, "tipo": "ingreso", "confianza": 0.93, "resultado": "autorizado"},
]


async def seed_users():
    async with async_session() as db:
        for data in SEED_USERS:
            result = await db.execute(
                select(User).where(User.email == data["email"])
            )
            user = result.scalar_one_or_none()
            if user:
                user.password_hash = hash_password(data["password"])
                user.rol = data["rol"]
                user.username = data["username"]
            else:
                user = User(
                    email=data["email"],
                    username=data["username"],
                    password_hash=hash_password(data["password"]),
                    rol=data["rol"],
                )
                db.add(user)

        await db.commit()


async def seed_personas():
    async with async_session() as db:
        ids = []
        for data in SEED_PERSONAS:
            result = await db.execute(
                select(Persona).where(Persona.dni == data["dni"])
            )
            existing = result.scalar_one_or_none()
            if existing:
                ids.append(existing.id_persona)
            else:
                p = Persona(**data)
                db.add(p)
                await db.flush()
                ids.append(p.id_persona)

        await db.commit()
        return ids


async def seed_camaras(persona_ids: list[int]):
    async with async_session() as db:
        for data in SEED_CAMARAS:
            result = await db.execute(
                select(Camara).where(Camara.ip == data["ip"])
            )
            if not result.scalar_one_or_none():
                db.add(Camara(**data))

        await db.flush()

        existing = await db.execute(select(EventoAcceso).limit(1))
        if existing.scalar_one_or_none():
            return

        camaras = (await db.execute(select(Camara))).scalars().all()
        ahora = datetime.now(timezone.utc)

        camara = camaras[0]

        for i, ev in enumerate(SEED_EVENTOS):
            persona_id = persona_ids[ev["persona_idx"]] if ev["persona_idx"] is not None else None
            timestamp = ahora - timedelta(hours=(len(SEED_EVENTOS) - i) * 2)

            evento = EventoAcceso(
                camara_id=camara.id_camara,
                persona_id=persona_id,
                tipo_evento=ev["tipo"],
                confianza_ia=ev["confianza"],
                resultado=ev["resultado"],
                timestamp=timestamp,
            )
            db.add(evento)

        await db.commit()
