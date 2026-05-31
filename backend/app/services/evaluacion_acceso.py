CONFIANZA_MINIMA = 0.75


def evaluar_acceso(confianza_ia: float | None, tipo_evento: str) -> str:
    if confianza_ia is None:
        return "denegado"
    if tipo_evento in ("egreso", "salida"):
        return "autorizado"
    if confianza_ia >= CONFIANZA_MINIMA:
        return "autorizado"
    return "denegado"
