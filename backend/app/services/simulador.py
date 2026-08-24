import asyncio
import hashlib
import random
import threading
import time
from datetime import datetime, timedelta


carreras = [
    "TST (Tecnicatura Superior en Telecomunicaciones)",
]

modelos_notebook = [
    "HP ProBook 450 G8",
    "Dell Latitude 3420",
    "Lenovo ThinkPad E14",
    "HP Notebook 240 G8",
    "Dell Inspiron 3515",
]

nombres_alumnos = [
    ("Juan", "Perez"), ("Sofia", "Gomez"), ("Lucas", "Correa"),
    ("Agustina", "Vera"), ("Tomas", "Medina"), ("Camila", "Rojas"),
    ("Facundo", "Diaz"), ("Valentina", "Torres"), ("Matias", "Acosta"),
    ("Florencia", "Martinez"), ("Bruno", "Lopez"), ("Lucia", "Fernandez"),
    ("Ignacio", "Gimenez"), ("Malena", "Caceres"), ("Santiago", "Ruiz"),
]

preceptores = ["Maria Lopez", "Carlos Ruiz"]

camaras_sim = [
    {"nombre": "Entrada Principal", "ubicacion": "Acceso al salon de notebooks"},
    {"nombre": "Area de Prestamos", "ubicacion": "Zona de entrega y devolucion"},
    {"nombre": "Pasillo Interno", "ubicacion": "Pasillo entre racks de notebooks"},
    {"nombre": "Puerta de Emergencia", "ubicacion": "Salida trasera del salon"},
]

antenas = [
    "Antena RFID - Puerta del Aula",
]

TAGS_RFID = [f"RFID-A{str(i).zfill(3)}" for i in range(1, 25)]


class SimuladorService:
    def __init__(self):
        self.alumnos = []
        self.computadoras = []
        self.qr_fisico = []
        self.qr_dinamico = []
        self.actividad = []
        self.alertas = []
        self.lecturas_antenna = []
        self.prestamos = []
        self.eventos_qr = []
        self.stats = {}
        self._lock = threading.Lock()
        self._running = False
        self._thread = None

    def _generar_hash(self, texto: str) -> str:
        return hashlib.sha256(texto.encode()).hexdigest()[:16]

    def _inicializar_alumnos(self):
        self.alumnos = []
        for i, (nombre, apellido) in enumerate(nombres_alumnos):
            dni = str(random.randint(10000000, 99999999))
            carrera = random.choice(carreras)
            anio = random.choice([1, 2, 3, 4])
            cohorte = 2026 - anio
            email = f"{nombre.lower()}.{apellido.lower()}@alumno.ipf.edu.ar"
            self.alumnos.append({
                "nombre": f"{nombre} {apellido}",
                "email": email,
                "dni": dni,
                "carrera": carrera,
                "anio": anio,
                "cohorte": cohorte,
            })

    def _inicializar_computadoras(self):
        self.computadoras = []
        for i in range(12):
            alumno = random.choice(self.alumnos)
            modelo = random.choice(modelos_notebook)
            tag = TAGS_RFID[i]
            uid = f"IPF-NB-{str(i + 1).zfill(3)}"
            self.computadoras.append({
                "id_unico": uid,
                "modelo": modelo,
                "tag_rfid": tag,
                "alumno": alumno["nombre"],
                "carrera": alumno["carrera"],
                "anio": alumno["anio"],
                "cohorte": alumno["cohorte"],
                "activa": True,
            })

    def _inicializar_qr_fisico(self):
        self.qr_fisico = []
        for pc in self.computadoras:
            alumno_data = next(
                (a for a in self.alumnos if a["nombre"] == pc["alumno"]), None
            )
            self.qr_fisico.append({
                "id_unico": pc["id_unico"],
                "alumno": pc["alumno"],
                "cohorte": pc["cohorte"],
                "modelo": pc["modelo"],
                "carrera": pc["carrera"],
                "tag_rfid": pc["tag_rfid"],
                "qr_data": self._generar_hash(
                    f"fisico-{pc['id_unico']}-{pc['tag_rfid']}"
                ),
            })

    def _inicializar_qr_dinamico(self):
        hoy = datetime.now().strftime("%Y-%m-%d")
        self.qr_dinamico = []
        for alumno in self.alumnos:
            raw = f"{alumno['email']}-{hoy}-{alumno['carrera']}-{alumno['anio']}"
            self.qr_dinamico.append({
                "hash": self._generar_hash(raw),
                "correo": alumno["email"],
                "dni": alumno["dni"],
                "carrera": alumno["carrera"],
                "anio": alumno["anio"],
                "fecha": hoy,
            })

    def _generar_actividad_inicial(self):
        ahora = datetime.now()
        eventos = []
        horas = []
        for h in range(6, 0, -1):
            horas.append(ahora - timedelta(hours=h))

        tipos = ["prestamo", "devolucion", "lectura_antenna", "qr_scanned"]
        for i, ts in enumerate(horas):
            alumno = random.choice(self.alumnos)
            pc = random.choice(self.computadoras)
            tipo = random.choice(tipos)

            if tipo == "prestamo":
                detalle = f"Alumno: {alumno['nombre']} • Notebook: {pc['id_unico']} • Preceptor: {random.choice(preceptores)}"
                self.prestamos.append({
                    "initials": "".join(p[0] for p in alumno["nombre"].split()),
                    "name": alumno["nombre"],
                    "notebook": pc["id_unico"],
                    "date": ts.strftime("%d/%m/%Y"),
                    "preceptor": random.choice(preceptores),
                    "estado": "Activo",
                })
                eventos.append({
                    "hora": ts.strftime("%H:%M:%S"),
                    "tipo": "prestamo",
                    "camara": random.choice(camaras_sim)["nombre"],
                    "alumno": alumno["nombre"],
                    "computadora": pc["id_unico"],
                    "detalle": detalle,
                })
            elif tipo == "devolucion":
                detalle = f"Alumno: {alumno['nombre']} • Notebook: {pc['id_unico']} • Preceptor: {random.choice(preceptores)}"
                eventos.append({
                    "hora": ts.strftime("%H:%M:%S"),
                    "tipo": "devolucion",
                    "camara": random.choice(camaras_sim)["nombre"],
                    "alumno": alumno["nombre"],
                    "computadora": pc["id_unico"],
                    "detalle": detalle,
                })
            elif tipo == "lectura_antenna":
                lector = antenas[0]
                direccion = random.choice(["entrada", "salida"])
                detalle = f"{'Entrada' if direccion == 'entrada' else 'Salida'} • {pc['id_unico']} • {pc['modelo']}"
                self.lecturas_antenna.append({
                    "tag_rfid": pc["tag_rfid"],
                    "computadora": pc["id_unico"],
                    "modelo": pc["modelo"],
                    "lector": lector,
                    "direccion": direccion,
                    "alumno": alumno["nombre"],
                    "timestamp": ts.isoformat(),
                    "ubicacion": "Puerta del Aula Inteligente",
                })
                eventos.append({
                    "hora": ts.strftime("%H:%M:%S"),
                    "tipo": "lectura_antenna",
                    "camara": lector,
                    "alumno": alumno["nombre"],
                    "computadora": pc["id_unico"],
                    "detalle": detalle,
                })
            elif tipo == "qr_scanned":
                modo = random.choice(["fisico", "dinamico"])
                if modo == "fisico":
                    detalle = f"QR Fisico • {pc['id_unico']} • Alumno: {alumno['nombre']}"
                else:
                    detalle = f"QR Dinamico • {alumno['nombre']} • Carrera: {alumno['carrera']}"
                self.eventos_qr.append({
                    "hora": ts.strftime("%H:%M:%S"),
                    "tipo": modo,
                    "alumno": alumno["nombre"],
                    "codigo": pc["id_unico"] if modo == "fisico" else self._generar_hash(f"{alumno['email']}-{ts}"),
                    "carrera": alumno["carrera"],
                    "detalle": detalle,
                    "estado": "Registrado",
                })
                eventos.append({
                    "hora": ts.strftime("%H:%M:%S"),
                    "tipo": "qr_scanned",
                    "camara": random.choice(camaras_sim)["nombre"],
                    "alumno": alumno["nombre"],
                    "computadora": pc["id_unico"],
                    "detalle": detalle,
                })

        eventos.sort(key=lambda e: e["hora"], reverse=True)
        self.actividad = eventos

    def _generar_alertas_iniciales(self):
        alumno_duplicado = random.choice(self.alumnos)
        pc1 = random.choice(self.computadoras)
        pc2 = random.choice([c for c in self.computadoras if c["id_unico"] != pc1["id_unico"]])

        self.alertas = [
            {
                "tipo": "advertencia",
                "mensaje": f"Alumno {alumno_duplicado['nombre']} retiro mas de una computadora ({pc1['id_unico']}, {pc2['id_unico']})",
                "timestamp": (datetime.now() - timedelta(minutes=random.randint(5, 60))).isoformat(),
                "leida": False,
            },
            {
                "tipo": "info",
                "mensaje": f"Antena UHF 1 detecto salida de notebook {pc1['id_unico']} sin registro de prestamo",
                "timestamp": (datetime.now() - timedelta(minutes=random.randint(10, 120))).isoformat(),
                "leida": False,
            },
            {
                "tipo": "advertencia",
                "mensaje": f"Tag RFID {pc2['tag_rfid']} no coincide con QR fisico de {pc2['id_unico']}",
                "timestamp": (datetime.now() - timedelta(minutes=random.randint(20, 180))).isoformat(),
                "leida": True,
            },
            {
                "tipo": "info",
                "mensaje": "Camara Entrada Principal: movimiento detectado fuera del horario permitido",
                "timestamp": (datetime.now() - timedelta(minutes=random.randint(30, 240))).isoformat(),
                "leida": True,
            },
        ]

    def _calcular_stats(self):
        prestamos_hoy = len(self.prestamos)
        eventos_hoy = len(self.actividad)
        alertas_no_leidas = sum(1 for a in self.alertas if not a["leida"])
        self.stats = {
            "computadoras_disponibles": max(0, min(22, len([c for c in self.computadoras if c["activa"]]) - len(self.prestamos))),
            "prestamos_activos": len(self.prestamos),
            "alumnos_registrados": len(self.alumnos),
            "preceptores_autorizados": len(preceptores),
            "eventos_hoy": eventos_hoy,
            "alertas_pendientes": alertas_no_leidas,
        }

    def inicializar(self):
        with self._lock:
            self._inicializar_alumnos()
            self._inicializar_computadoras()
            self._inicializar_qr_fisico()
            self._inicializar_qr_dinamico()
            self._generar_actividad_inicial()
            self._generar_alertas_iniciales()
            self._calcular_stats()

    def _background_loop(self):
        while self._running:
            time.sleep(random.randint(25, 45))
            self._generar_nuevo_evento()

    def _generar_nuevo_evento(self):
        with self._lock:
            alumno = random.choice(self.alumnos)
            pc = random.choice(self.computadoras)
            ahora = datetime.now()

            tipo = random.choices(
                ["prestamo", "devolucion", "lectura_antenna", "qr_scanned", "movimiento"],
                weights=[20, 15, 30, 20, 15],
                k=1,
            )[0]

            if tipo == "prestamo":
                detalle = f"Alumno: {alumno['nombre']} • Notebook: {pc['id_unico']} • Preceptor: {random.choice(preceptores)}"
                self.actividad.insert(0, {
                    "hora": ahora.strftime("%H:%M:%S"),
                    "tipo": "prestamo",
                    "camara": random.choice(camaras_sim)["nombre"],
                    "alumno": alumno["nombre"],
                    "computadora": pc["id_unico"],
                    "detalle": detalle,
                })
                self.prestamos.append({
                    "initials": "".join(p[0] for p in alumno["nombre"].split()),
                    "name": alumno["nombre"],
                    "notebook": pc["id_unico"],
                    "date": ahora.strftime("%d/%m/%Y"),
                    "preceptor": random.choice(preceptores),
                    "estado": "Activo",
                })
            elif tipo == "devolucion":
                detalle = f"Alumno: {alumno['nombre']} • Notebook: {pc['id_unico']} • Preceptor: {random.choice(preceptores)}"
                self.actividad.insert(0, {
                    "hora": ahora.strftime("%H:%M:%S"),
                    "tipo": "devolucion",
                    "camara": random.choice(camaras_sim)["nombre"],
                    "alumno": alumno["nombre"],
                    "computadora": pc["id_unico"],
                    "detalle": detalle,
                })
            elif tipo == "lectura_antenna":
                lector = antenas[0]
                direccion = random.choice(["entrada", "salida"])
                detalle = f"{'Entrada' if direccion == 'entrada' else 'Salida'} • {pc['id_unico']} • {pc['modelo']}"
                self.lecturas_antenna.insert(0, {
                    "tag_rfid": pc["tag_rfid"],
                    "computadora": pc["id_unico"],
                    "modelo": pc["modelo"],
                    "lector": lector,
                    "direccion": direccion,
                    "timestamp": ahora.isoformat(),
                    "ubicacion": "Puerta del Aula Inteligente",
                })
                self.actividad.insert(0, {
                    "hora": ahora.strftime("%H:%M:%S"),
                    "tipo": "lectura_antenna",
                    "camara": lector,
                    "alumno": alumno["nombre"],
                    "computadora": pc["id_unico"],
                    "detalle": detalle,
                })
                if direccion == "salida":
                    self._persistir_salida_lectura_rfid()
            elif tipo == "qr_scanned":
                modo = random.choice(["fisico", "dinamico"])
                if modo == "fisico":
                    detalle = f"QR Fisico • {pc['id_unico']} • Alumno: {alumno['nombre']}"
                else:
                    detalle = f"QR Dinamico • {alumno['nombre']} • Carrera: {alumno['carrera']}"
                self.eventos_qr.insert(0, {
                    "hora": ahora.strftime("%H:%M:%S"),
                    "tipo": modo,
                    "alumno": alumno["nombre"],
                    "codigo": pc["id_unico"] if modo == "fisico" else self._generar_hash(f"{alumno['email']}-{ahora}"),
                    "carrera": alumno["carrera"],
                    "detalle": detalle,
                    "estado": "Registrado",
                })
                self.actividad.insert(0, {
                    "hora": ahora.strftime("%H:%M:%S"),
                    "tipo": "qr_scanned",
                    "camara": random.choice(camaras_sim)["nombre"],
                    "alumno": alumno["nombre"],
                    "computadora": pc["id_unico"],
                    "detalle": detalle,
                })
            elif tipo == "movimiento":
                camara = random.choice(camaras_sim)
                detalle = f"{camara['nombre']} • Movimiento detectado"
                self.actividad.insert(0, {
                    "hora": ahora.strftime("%H:%M:%S"),
                    "tipo": "movimiento",
                    "camara": camara["nombre"],
                    "alumno": "",
                    "computadora": "",
                    "detalle": detalle,
                })

            if len(self.actividad) > 100:
                self.actividad = self.actividad[:100]
            if len(self.lecturas_antenna) > 100:
                self.lecturas_antenna = self.lecturas_antenna[:100]
            if len(self.eventos_qr) > 100:
                self.eventos_qr = self.eventos_qr[:100]

            duplicados = {}
            for prestamo in self.prestamos:
                name = prestamo["name"]
                if name in duplicados:
                    duplicados[name].append(prestamo["notebook"])
                else:
                    duplicados[name] = [prestamo["notebook"]]

            for name, notebooks in duplicados.items():
                if len(notebooks) > 1 and not any(
                    a["mensaje"].startswith(f"Alumno {name}") for a in self.alertas[:5]
                ):
                    self.alertas.insert(0, {
                        "tipo": "advertencia",
                        "mensaje": f"Alumno {name} retiro mas de una computadora ({', '.join(notebooks)})",
                        "timestamp": ahora.isoformat(),
                        "leida": False,
                    })
                    break

            self._calcular_stats()

    def iniciar(self):
        self.inicializar()
        self._running = True
        self._thread = threading.Thread(target=self._background_loop, daemon=True)
        self._thread.start()

    def detener(self):
        self._running = False
        if self._thread:
            self._thread.join(timeout=2)

    def get_actividad(self, limite=10):
        with self._lock:
            return self.actividad[:limite]

    def get_alertas(self, limite=20):
        with self._lock:
            return self.alertas[:limite]

    def get_eventos_qr(self, limite=20):
        with self._lock:
            return self.eventos_qr[:limite]

    def _persistir_salida_lectura_rfid(self):
        """Persiste la salida de una computadora en la tabla real lectura_rfid,
        eligiendo una computadora real de la DB (para que el estado-escaneo
        por antena funcione con datos coherentes)."""
        try:
            async def _insert():
                from sqlalchemy import func, select

                from app.core.database import async_session
                from app.models.computadoras import Computadoras
                from app.models.lectura_rfid import LecturaRFID

                async with async_session() as session:
                    res = await session.execute(
                        select(Computadoras)
                        .where(Computadoras.activa.is_(True))
                        .order_by(func.random())
                        .limit(1)
                    )
                    pc = res.scalars().first()
                    if pc:
                        session.add(
                            LecturaRFID(
                                tag_rfid=pc.tag_rfid,
                                id_computadoras=pc.id_computadoras,
                                lector_origen=antenas[0],
                            )
                        )
                        await session.commit()

            asyncio.run(_insert())
        except Exception as e:
            print(f"[SIMULADOR] no se pudo persistir salida de antena: {e}")

    def get_lecturas_antenna(self, limite=20):
        with self._lock:
            return self.lecturas_antenna[:limite]

    def get_qr_fisico(self):
        with self._lock:
            return list(self.qr_fisico)

    def get_qr_dinamico(self):
        with self._lock:
            return list(self.qr_dinamico)

    def get_prestamos(self, limite=20):
        with self._lock:
            return self.prestamos[:limite]

    def get_camaras(self):
        with self._lock:
            return camaras_sim

    def get_stats(self):
        with self._lock:
            return dict(self.stats)

    def get_grafico_prestamos(self):
        with self._lock:
            data = [random.randint(10, 40) for _ in range(7)]
            dias = [
                (datetime.now() - timedelta(days=i)).strftime("%d/%m")
                for i in range(6, -1, -1)
            ]
            return {"labels": dias, "data": data}


simulador = SimuladorService()
