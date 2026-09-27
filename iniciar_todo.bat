@echo off
chcp 65001 >nul
title IPF SmartTrack - Sistema de Control RFID
color 0A

echo ================================================================
echo             IPF SmartTrack - Control y Gestion RFID
echo               Iniciando todos los servicios...
echo ================================================================
echo.

echo [1/3] Iniciando Backend (FastAPI en puerto 8000)...
start "IPF - Backend (FastAPI)" cmd /k "cd /d "%~dp0backend" && .venv\Scripts\python.exe -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"

echo [2/3] Iniciando Frontend (Vite en puerto 5173)...
start "IPF - Frontend (React Vite)" cmd /k "cd /d "%~dp0frontend" && npm run dev"

echo.
echo Esperando 3 segundos a que los servidores inicien...
timeout /t 3 /nobreak >nul

echo [3/3] Iniciando Tunel HTTPS para Celular (Cloudflare)...
start "IPF - Tunel HTTPS Celular" cmd /k "cloudflared tunnel --protocol http2 --url http://localhost:5173"

echo.
echo ================================================================
echo  ¡Servicios iniciados correctamente!
echo.
echo  - Backend Local:   http://localhost:8000/docs
echo  - Frontend Local:  http://localhost:5173
echo  - Tunel Celular:   Revisa la ventana 'IPF - Tunel HTTPS Celular'
echo                     para ver el enlace 'https://....trycloudflare.com'
echo ================================================================
echo.
echo Para detener todos los servicios ejecuta 'detener_todo.bat'.
echo Puedes cerrar esta ventana.
echo.
pause
