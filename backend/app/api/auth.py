import random
import time
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import get_current_user
from app.core.database import get_db
from app.core.security import create_access_token, hash_password, verify_password
from app.models.user import User
from app.schemas.user import Token, UserCreate, UserLogin, UserRead, LoginResponse, ChangePasswordRequest, Verify2FARequest, CambiarContrasenaRequest

router = APIRouter(prefix="/api/auth", tags=["Auth"])

# In-memory store for 2FA codes (user_id -> {"code": "123456", "expires_at": timestamp})
_2fa_codes = {}

# In-memory store for failed login attempts (email_key -> {"intentos": int, "bloqueado_hasta": timestamp})
_failed_login = {}
_ESPERA_SEGUNDOS = {1: 10, 2: 15}  # >= 3 -> 60


def _espera_segun_intentos(intentos):
    if intentos >= 3:
        return 60
    return _ESPERA_SEGUNDOS.get(intentos, 10)


def _verificar_bloqueo(email_key: str):
    rec = _failed_login.get(email_key)
    if not rec or not rec["bloqueado_hasta"]:
        return None
    ahora = time.time()
    if ahora < rec["bloqueado_hasta"]:
        restante = int(rec["bloqueado_hasta"] - ahora) + 1
        return restante
    return None



@router.post("/register", response_model=UserRead, status_code=201)
async def register(data: UserCreate, db: AsyncSession = Depends(get_db)):
    existing = await db.execute(
        select(User).where((User.email == data.email) | (User.username == data.username))
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email o username ya registrado",
        )

    user = User(
        email=data.email,
        username=data.username,
        password_hash=hash_password(data.password),
        rol=data.rol if data.rol in ("admin", "preceptor") else "preceptor",
        id_persona=data.id_persona,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


@router.post("/login", response_model=LoginResponse)
async def login(data: UserLogin, db: AsyncSession = Depends(get_db)):
    email_key = data.email.strip().lower()

    restante = _verificar_bloqueo(email_key)
    if restante:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Demasiados intentos fallidos. Espera {restante} segundo(s) para volver a intentar.",
        )

    result = await db.execute(select(User).where(User.email == data.email))
    user = result.scalar_one_or_none()

    if not user or not verify_password(data.password, user.password_hash):
        rec = _failed_login.get(email_key, {})
        intentos = rec.get("intentos", 0) + 1
        espera = _espera_segun_intentos(intentos)
        _failed_login[email_key] = {"intentos": intentos, "bloqueado_hasta": time.time() + espera}
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Email o contrasena incorrectos. Intento fallido {intentos}. Espera {espera} segundo(s) para volver a intentar.",
        )

    _failed_login.pop(email_key, None)

    if not user.activo:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario inactivo",
        )

    temp_token = create_access_token({"sub": str(user.id), "rol": user.rol, "temp": True})

    if getattr(user, 'must_change_password', False):
        return LoginResponse(must_change_password=True, temp_token=temp_token)

    if user.rol == "alumno":
        # Generate 2FA code
        code = str(random.randint(100000, 999999))
        _2fa_codes[user.id] = {"code": code, "expires_at": time.time() + 300} # 5 minutes
        print(f"==================================================")
        print(f"2FA Code for {user.email}: {code}")
        print(f"==================================================")
        return LoginResponse(requires_2fa=True, temp_token=temp_token)

    token = create_access_token({"sub": str(user.id), "rol": user.rol})
    return LoginResponse(access_token=token)

@router.post("/change-password")
async def change_password(data: ChangePasswordRequest, db: AsyncSession = Depends(get_db)):
    from app.core.security import decode_access_token
    payload = decode_access_token(data.temp_token)
    if not payload or not payload.get("temp"):
        raise HTTPException(status_code=401, detail="Token invalido")
    
    user_id = int(payload.get("sub"))
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
        
    user.password_hash = hash_password(data.new_password)
    user.must_change_password = False
    await db.commit()
    
    if user.rol == "alumno":
        # After changing password, require 2FA
        code = str(random.randint(100000, 999999))
        _2fa_codes[user.id] = {"code": code, "expires_at": time.time() + 300}
        print(f"==================================================")
        print(f"2FA Code for {user.email}: {code}")
        print(f"==================================================")
        return LoginResponse(requires_2fa=True, temp_token=data.temp_token)
        
    token = create_access_token({"sub": str(user.id), "rol": user.rol})
    return LoginResponse(access_token=token)

@router.post("/verify-2fa")
async def verify_2fa(data: Verify2FARequest, db: AsyncSession = Depends(get_db)):
    from app.core.security import decode_access_token
    payload = decode_access_token(data.temp_token)
    if not payload or not payload.get("temp"):
        raise HTTPException(status_code=401, detail="Token invalido")
        
    user_id = int(payload.get("sub"))
    record = _2fa_codes.get(user_id)
    
    if not record or time.time() > record["expires_at"] or record["code"] != data.code:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Codigo 2FA invalido o expirado")
        
    # Clear the code
    del _2fa_codes[user_id]
    
    token = create_access_token({"sub": str(user_id), "rol": payload.get("rol")})
    return LoginResponse(access_token=token)



@router.get("/me", response_model=UserRead)
async def me(current_user: User = Depends(get_current_user)):
    return current_user


@router.post("/cambiar-contrasena")
async def cambiar_contrasena(
    data: CambiarContrasenaRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not verify_password(data.current_password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="La contrasena actual es incorrecta")

    if len(data.new_password) < 4:
        raise HTTPException(status_code=400, detail="La nueva contrasena es demasiado corta")

    current_user.password_hash = hash_password(data.new_password)
    current_user.must_change_password = False
    await db.commit()

    return {"message": "Contrasena actualizada correctamente"}
