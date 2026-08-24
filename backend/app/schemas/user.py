from datetime import datetime

from pydantic import BaseModel, EmailStr


class UserCreate(BaseModel):
    email: EmailStr
    username: str
    password: str
    rol: str = "preceptor"
    id_persona: int | None = None


class UserUpdate(BaseModel):
    email: EmailStr | None = None
    username: str | None = None
    password: str | None = None
    rol: str | None = None
    activo: bool | None = None
    id_persona: int | None = None


class UserRead(BaseModel):
    id: int
    email: str
    username: str
    rol: str
    activo: bool
    id_persona: int | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class UserLogin(BaseModel):
    email: str
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class LoginResponse(BaseModel):
    access_token: str | None = None
    token_type: str = "bearer"
    must_change_password: bool = False
    requires_2fa: bool = False
    temp_token: str | None = None

class ChangePasswordRequest(BaseModel):
    temp_token: str
    new_password: str

class CambiarContrasenaRequest(BaseModel):
    current_password: str
    new_password: str

class Verify2FARequest(BaseModel):
    temp_token: str
    code: str
