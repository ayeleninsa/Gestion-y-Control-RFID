import { useState, useEffect, useRef, useCallback } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { useNavigate } from 'react-router-dom'
import { validateDualQR, reclamarQrDinamico } from '../services/qr'
import { ScanLine, ArrowLeft, RotateCcw, CheckCircle2, AlertTriangle, Camera, QrCode, Laptop } from 'lucide-react'

const READER_ID = 'qr-reader-alumno'

const extraerTagRfid = (texto) => {
  const tag = texto.match(/TAG\s*RFID:\s*(\S+)/i)
  if (tag) return tag[1]
  const dni = texto.match(/Dni:\s*(\S+)/i)
  if (dni) return dni[1]
  return texto.trim()
}

export default function EscanerQR() {
  const navigate = useNavigate()

  const [camError, setCamError] = useState('')
  const [validando, setValidando] = useState(false)
  const [resultado, setResultado] = useState(null)
  const [resultError, setResultError] = useState('')
  const [paso, setPaso] = useState(1) // 1 = QR dinamico (preceptor), 2 = QR fisico (computadora)
  const [qrDinamico, setQrDinamico] = useState('')
  const [qrFisico, setQrFisico] = useState('')

  const scannerRef = useRef(null)
  const scanningRef = useRef(false)
  const procesandoRef = useRef(false)
  const [cameraOn, setCameraOn] = useState(false)

  const stopScanner = useCallback(async () => {
    scanningRef.current = false
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop()
      } catch { /* ignore */ }
      try {
        scannerRef.current.clear()
      } catch { /* ignore */ }
      scannerRef.current = null
    }
  }, [])

  const startScanner = useCallback(async (onDecode) => {
    setCamError('')
    try {
      await stopScanner()
      scanningRef.current = true
      const scanner = new Html5Qrcode(READER_ID)
      scannerRef.current = scanner
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          if (!scanningRef.current || procesandoRef.current) return
          procesandoRef.current = true
          onDecode(decodedText)
        },
        () => { /* error frame - ignore */ }
      )
    } catch (err) {
      setCamError('No se pudo acceder a la camara. Verifica los permisos del navegador e intenta nuevamente.')
    }
  }, [stopScanner])

  const doValidate = useCallback(async (fisico, dinamico) => {
    setValidando(true)
    setResultError('')
    setResultado(null)
    try {
      const res = await validateDualQR(fisico, dinamico)
      procesandoRef.current = false
      setResultado(res)
    } catch (err) {
      const detail = err.response?.data?.detail || 'Error al validar los QR. Intenta nuevamente.'
      const esErrorDinamico = /din[ám]ico|token|expir/i.test(detail)
      procesandoRef.current = false
      setResultError(detail)
      setQrFisico('')
      setPaso(esErrorDinamico ? 1 : 2)
      setCameraOn(false)
    } finally {
      setValidando(false)
    }
  }, [])

  const onDecode = useCallback((text) => {
    const valor = text.trim()
    if (paso === 1) {
      stopScanner()
      setValidando(true)
      setResultError('')
      setResultado(null)
      reclamarQrDinamico(valor)
        .then(() => {
          procesandoRef.current = false
          setQrDinamico(valor)
          setPaso(2)
          setCameraOn(false)
        })
        .catch((err) => {
          procesandoRef.current = false
          setResultError(err.response?.data?.detail || 'El QR dinámico no es válido. Pedí al preceptor que genere uno nuevo.')
          setCameraOn(false)
        })
        .finally(() => setValidando(false))
    } else {
      const tag = extraerTagRfid(valor)
      stopScanner()
      setQrFisico(tag)
      setCameraOn(false)
      doValidate(tag, qrDinamico)
    }
  }, [paso, qrDinamico, stopScanner, doValidate])

  useEffect(() => {
    if (!cameraOn) return
    startScanner(onDecode)
    return () => { stopScanner() }
  }, [cameraOn, startScanner, onDecode, stopScanner])

  const reescanear = () => {
    procesandoRef.current = false
    setResultado(null)
    setResultError('')
    setCamError('')
    setPaso(1)
    setQrDinamico('')
    setQrFisico('')
    setCameraOn(false)
  }

  const reintentarPasoActual = () => {
    procesandoRef.current = false
    setResultError('')
    setQrFisico('')
    if (paso === 1) {
      setQrDinamico('')
      setCameraOn(false)
    } else {
      setCameraOn(true)
    }
  }

  const mostrarPantallaBienvenida = !cameraOn && !validando && !resultado && !resultError && !camError
  const mostrarCamara = cameraOn && !validando && !resultado && !resultError && !camError

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Escanear QR del dia</h1>
          <p className="text-slate-500 text-sm mt-1">
            Escanea el QR dinamico que genera el preceptor y el QR de tu computadora para registrar la operacion.
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/alumno')}
          className="flex items-center space-x-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 hover:text-[#006143] transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Volver al inicio</span>
        </button>
      </div>

      {/* Steps indicator */}
      {!resultado && !resultError && (
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className={`rounded-xl border p-4 ${qrDinamico ? 'border-emerald-200 bg-emerald-50' : paso === 1 ? 'border-[#006143] bg-[#006143]/5' : 'border-slate-200 bg-white'}`}>
            <div className="flex items-center space-x-2 mb-1">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${qrDinamico ? 'bg-emerald-500 text-white' : paso === 1 ? 'bg-[#006143] text-white' : 'bg-slate-200 text-slate-500'}`}>
                {qrDinamico ? '✓' : '1'}
              </div>
              <span className="font-semibold text-slate-700 text-sm flex items-center space-x-1">
                <QrCode className="w-4 h-4 text-[#006143]" />
                QR del preceptor
              </span>
            </div>
            <p className="text-xs text-slate-500 ml-8">{qrDinamico ? 'Leido correctamente' : 'Escanear el QR dinamico del preceptor'}</p>
          </div>

          <div className={`rounded-xl border p-4 ${qrFisico ? 'border-emerald-200 bg-emerald-50' : paso === 2 ? 'border-[#24c48a] bg-[#24c48a]/5' : 'border-slate-200 bg-white'}`}>
            <div className="flex items-center space-x-2 mb-1">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${qrFisico ? 'bg-emerald-500 text-white' : paso === 2 ? 'bg-[#24c48a] text-white' : 'bg-slate-200 text-slate-500'}`}>
                {qrFisico ? '✓' : '2'}
              </div>
              <span className="font-semibold text-slate-700 text-sm flex items-center space-x-1">
                <Laptop className="w-4 h-4 text-[#24c48a]" />
                QR de tu computadora
              </span>
            </div>
            <p className="text-xs text-slate-500 ml-8">{qrFisico ? 'Leido correctamente' : paso === 2 ? 'Escanear el QR pegado en tu computadora' : 'Pendiente'}</p>
          </div>
        </div>
      )}

      {/* Camera */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-5">
          <div className="mb-4 flex items-center space-x-2 text-slate-600">
            <Camera className="w-5 h-5 text-[#006143]" />
            <span className="font-semibold">Camara</span>
          </div>

          {mostrarPantallaBienvenida && (
            <div className="bg-slate-50 rounded-lg border border-dashed border-slate-300 flex flex-col items-center justify-center py-12 px-4 text-center">
              <ScanLine className="w-12 h-12 text-slate-300 mb-3" />
              <p className="text-sm text-slate-600 mb-4">
                {paso === 1
                  ? 'Aprieta el boton para abrir la camara y escanear el QR dinamico del preceptor.'
                  : 'QR del preceptor leido. Ahora escanea el QR pegado en tu computadora.'}
              </p>
              <button
                type="button"
                onClick={() => setCameraOn(true)}
                className="inline-flex items-center space-x-2 px-6 py-3 bg-[#006143] text-white font-semibold rounded-xl hover:bg-[#004d35] transition-colors"
              >
                {paso === 1 ? <QrCode className="w-5 h-5" /> : <Laptop className="w-5 h-5" />}
                <span>Abrir camara</span>
              </button>
            </div>
          )}

          {mostrarCamara && (
            <div className="bg-slate-900 rounded-lg overflow-hidden flex items-center justify-center">
              <div id={READER_ID} className="w-full" />
            </div>
          )}

          {camError && (
            <div className="mt-4 flex items-start space-x-2 p-3 bg-amber-50 text-amber-800 rounded-lg text-sm">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <div>
                <p>{camError}</p>
                <button
                  type="button"
                  onClick={() => startScanner(onDecode)}
                  className="mt-2 text-[#006143] font-medium hover:underline"
                >
                  Reintentar camara
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Validating / Result */}
      {validando && (
        <div className="mt-6 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden p-10 text-center">
          <p className="text-slate-500">Validando QR...</p>
        </div>
      )}

      {!validando && resultado && (
        <div className="mt-6 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-8">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-[#24c48a]/15 flex items-center justify-center mb-4">
                <CheckCircle2 className="w-9 h-9 text-[#006143]" />
              </div>
              <h2 className="text-2xl font-bold text-slate-800">Registro exitoso</h2>
              <p className="text-slate-500 mt-1">{resultado.message}</p>
              <div className="mt-6 w-full max-w-sm bg-slate-50 rounded-xl p-4 text-left space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Alumno</span>
                  <span className="font-medium text-slate-800">{resultado.alumno_nombre}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Computadora</span>
                  <span className="font-medium text-slate-800">{resultado.computadora_tag} {resultado.computadora_modelo ? '-' : ''} {resultado.computadora_modelo}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Evento</span>
                  <span className="font-medium text-[#006143]">{resultado.evento_tipo.replace('_', ' ')}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">QR escaneados</span>
                  <span className="flex space-x-1.5">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#24c48a]/10 text-[#006143]">Fisico ✓</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#24c48a]/10 text-[#006143]">Dinamico ✓</span>
                  </span>
                </div>
              </div>
              <div className="flex space-x-3 mt-8">
                <button
                  type="button"
                  onClick={reescanear}
                  className="flex items-center space-x-2 px-5 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Volver a escanear</span>
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/alumno')}
                  className="px-5 py-2 bg-[#006143] text-white rounded-lg hover:bg-[#004d35]"
                >
                  Ir al inicio
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {!validando && resultError && (
        <div className="mt-6 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-8">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-4">
                <AlertTriangle className="w-9 h-9 text-red-500" />
              </div>
              <h2 className="text-2xl font-bold text-slate-800">No se pudo registrar</h2>
              <p className="text-red-600 mt-1">{resultError}</p>
              <div className="flex space-x-3 mt-8">
                <button
                  type="button"
                  onClick={reintentarPasoActual}
                  className="flex items-center space-x-2 px-5 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>{paso === 1 ? 'Reintentar' : 'Reescanear computadora'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/alumno')}
                  className="px-5 py-2 bg-[#006143] text-white rounded-lg hover:bg-[#004d35]"
                >
                  Ir al inicio
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mt-6 flex items-center space-x-2 text-xs text-slate-400">
        <ScanLine className="w-4 h-4" />
        <span>Apunta la camara hacia el QR dinamico del preceptor y luego hacia el QR de tu computadora. Se registrara la operacion al escanear ambos.</span>
      </div>
    </div>
  )
}