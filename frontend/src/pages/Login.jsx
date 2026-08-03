import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getMe, login, verify2fa, changePassword } from '../services/auth'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  
  // Flow states: 'login', 'change_password', '2fa'
  const [step, setStep] = useState('login')
  const [tempToken, setTempToken] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [code2fa, setCode2fa] = useState('')
  
  const { setUser } = useAuth()
  const navigate = useNavigate()

  const handleFinishLogin = async (token) => {
    localStorage.setItem('token', token)
    const me = await getMe()
    setUser(me)
    setTimeout(() => navigate('/'), 0)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      const data = await login(email, password)
      if (data.must_change_password) {
        setTempToken(data.temp_token)
        setStep('change_password')
      } else if (data.requires_2fa) {
        setTempToken(data.temp_token)
        setStep('2fa')
      } else {
        await handleFinishLogin(data.access_token)
      }
    } catch {
      setError('Email o contrasena incorrectos')
    }
  }

  const handleChangePassword = async (e) => {
    e.preventDefault()
    setError('')
    try {
      const data = await changePassword(tempToken, newPassword)
      if (data.requires_2fa) {
        setStep('2fa')
      } else {
        await handleFinishLogin(data.access_token)
      }
    } catch {
      setError('Error al cambiar la contrasena')
    }
  }

  const handleVerify2fa = async (e) => {
    e.preventDefault()
    setError('')
    try {
      const data = await verify2fa(tempToken, code2fa)
      await handleFinishLogin(data.access_token)
    } catch {
      setError('Codigo invalido o expirado')
    }
  }

  return (
    <div className="font-sans antialiased bg-gray-50 min-h-screen flex">
      <section className="hidden lg:flex w-1/2 text-white flex-col justify-between p-16 relative"
        style={{
          background: 'linear-gradient(135deg, rgba(10,25,30,0.95) 0%, rgba(10,25,30,0.85) 100%), url(https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=1536)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="z-10">
          <div className="flex flex-col items-center w-fit">
            <div className="border-2 border-white p-4 mb-4">
              <span className="text-4xl font-light tracking-tighter">
                I<span className="text-[#24c48a]">P</span>F
              </span>
              <div className="text-[6px] tracking-[0.2em] text-center mt-1">*********</div>
            </div>
            <div className="text-center">
              <h2 className="text-xs tracking-[0.3em] font-semibold">INSTITUTO</h2>
              <h2 className="text-xs tracking-[0.3em] font-semibold text-[#24c48a]">POLITECNICO</h2>
              <h2 className="text-xs tracking-[0.3em] font-semibold">FORMOSA</h2>
            </div>
          </div>
        </div>

        <div className="z-10 max-w-md">
          <h1 className="text-4xl font-bold mb-4">
            <span className="text-[#24c48a]">IPF</span> SmartTrack
          </h1>
          <p className="text-lg text-gray-300 leading-relaxed mb-12">
            Sistema inteligente de gestion, trazabilidad y control de notebooks.
          </p>
          <ul className="space-y-6">
            {[
              { icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z', label: 'Seguridad' },
              { icon: 'M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071a10.5 10.5 0 0114.142 0M1.414 8.929a16.5 16.5 0 0121.172 0', label: 'Tecnologia RFID' },
              { icon: 'M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9zM15 13a3 3 0 11-6 0 3 3 0 016 0z', label: 'Vision por IA' },
              { icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z', label: 'Control en tiempo real' },
            ].map((item) => (
              <li key={item.label} className="flex items-center space-x-4">
                <div className="w-8 h-8 rounded-full border border-gray-500 flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-[#24c48a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d={item.icon} strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                  </svg>
                </div>
                <span className="text-gray-200">{item.label}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-auto opacity-30 text-xs tracking-widest">
          IPF - SMARTTRACK v2.0
        </div>
      </section>

      <main className="w-full lg:w-1/2 flex flex-col items-center justify-center p-6 bg-[#f3f6f9]">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-[450px] p-10 md:p-12">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-slate-800 mb-2">Bienvenido</h2>
            <p className="text-slate-500 text-sm">Inicia sesion para continuar en IPF SmartTrack</p>
            {error && (
              <p className="mt-4 text-red-600 text-sm bg-red-50 py-2 px-4 rounded-lg">{error}</p>
            )}
            <div className="mt-6 flex justify-center">
              <div className="text-[#006143]">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                </svg>
              </div>
            </div>
          </div>

          {step === 'login' && (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2" htmlFor="email">
                  Correo electronico
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400 pointer-events-none">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                    </svg>
                  </span>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ejemplo@ipf.edu.ar"
                    className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#006143]/20 focus:border-[#006143] transition-all placeholder:text-slate-400"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2" htmlFor="password">
                  Contrasena
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400 pointer-events-none">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                    </svg>
                  </span>
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="*********"
                    className="w-full pl-11 pr-11 py-3 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#006143]/20 focus:border-[#006143] transition-all"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {showPassword ? (
                        <path d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                      ) : (
                        <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                      )}
                    </svg>
                  </button>
                </div>
              </div>

              <div className="text-right">
                <a href="#" className="text-sm text-slate-500 hover:text-[#006143] transition-colors">
                  Olvidaste tu contrasena?
                </a>
              </div>

              <button
                type="submit"
                className="w-full bg-[#006143] text-white font-semibold py-4 rounded-lg flex items-center justify-center space-x-2 hover:bg-[#004d35] transition-colors shadow-lg shadow-[#006143]/20 mt-8"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                </svg>
                <span>Iniciar sesion</span>
              </button>
            </form>
          )}

          {step === 'change_password' && (
            <form onSubmit={handleChangePassword} className="space-y-6">
              <div className="text-sm text-slate-600 mb-4 bg-yellow-50 p-3 rounded border border-yellow-200">
                Por seguridad, debes cambiar tu contrasena en el primer inicio de sesion.
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2" htmlFor="new_password">
                  Nueva Contrasena
                </label>
                <input
                  id="new_password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="*********"
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#006143]/20 focus:border-[#006143] transition-all"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full bg-[#006143] text-white font-semibold py-4 rounded-lg hover:bg-[#004d35] transition-colors shadow-lg shadow-[#006143]/20"
              >
                Cambiar Contrasena
              </button>
            </form>
          )}

          {step === '2fa' && (
            <form onSubmit={handleVerify2fa} className="space-y-6">
              <div className="text-sm text-slate-600 mb-4 bg-blue-50 p-3 rounded border border-blue-200">
                Hemos enviado un codigo a tu correo. Por favor ingresalo abajo para continuar. (Nota: Revisa la consola del backend)
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2" htmlFor="code2fa">
                  Codigo de Seguridad
                </label>
                <input
                  id="code2fa"
                  type="text"
                  value={code2fa}
                  onChange={(e) => setCode2fa(e.target.value)}
                  placeholder="123456"
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-lg text-center text-xl tracking-widest focus:outline-none focus:ring-2 focus:ring-[#006143]/20 focus:border-[#006143] transition-all"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full bg-[#006143] text-white font-semibold py-4 rounded-lg hover:bg-[#004d35] transition-colors shadow-lg shadow-[#006143]/20"
              >
                Verificar Codigo
              </button>
            </form>
          )}

          {import.meta.env.VITE_APP_ENV === 'development' && (
            <div className="mt-8 pt-6 border-t border-slate-200">
              <p className="text-xs text-slate-400 mb-3 text-center">Acceso rapido (desarrollo)</p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => { setEmail('admin@test.com'); setPassword('admin123'); setStep('login') }}
                  className="flex-1 bg-[#006143]/10 text-[#006143] text-xs font-medium py-2.5 rounded-lg hover:bg-[#006143]/20 transition-colors"
                >
                  Admin
                </button>
                <button
                  type="button"
                  onClick={() => { setEmail('preceptor@test.com'); setPassword('preceptor123'); setStep('login') }}
                  className="flex-1 bg-[#24c48a]/10 text-[#006143] text-xs font-medium py-2.5 rounded-lg hover:bg-[#24c48a]/20 transition-colors"
                >
                  Preceptor
                </button>
                <button
                  type="button"
                  onClick={() => { setEmail('alumno@test.com'); setPassword('alumno123'); setStep('login') }}
                  className="flex-1 bg-[#006143]/10 text-[#006143] text-xs font-medium py-2.5 rounded-lg hover:bg-[#006143]/20 transition-colors border border-[#006143]"
                >
                  Alumno
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="mt-12 text-center text-slate-400 text-xs">
          <p>&copy; 2025 Instituto Politecnico Formosa</p>
          <p className="mt-1">Todos los derechos reservados.</p>
        </div>
      </main>
    </div>
  )
}
