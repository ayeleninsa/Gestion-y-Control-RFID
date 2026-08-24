from app.models.camara import Camara
from app.models.computadoras import Computadoras
from app.models.detalle_mant import DetalleMant
from app.models.evento_acceso import EventoAcceso
from app.models.lectura_rfid import LecturaRFID
from app.models.persona import Persona
from app.models.rfid_evento import RfidEvento
from app.models.rfid_lector import RfidLector
from app.models.rfid_tag import RfidTag
from app.models.user import User
from app.models.alumno import Alumno
from app.models.carrera import Carrera
from app.models.prestamo import Prestamo
from app.models.qr_token import QrToken

__all__ = [
    "User",
    "Persona",
    "Computadoras",
    "DetalleMant",
    "LecturaRFID",
    "Camara",
    "EventoAcceso",
    "RfidLector",
    "RfidTag",
    "RfidEvento",
    "Alumno",
    "Carrera",
    "Prestamo",
    "QrToken",
]
