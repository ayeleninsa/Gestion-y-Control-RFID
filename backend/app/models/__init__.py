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
]
