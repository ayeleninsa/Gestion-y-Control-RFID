@echo off
chcp 65001 >nul
title IPF SmartTrack - Deteniendo servicios
color 0C

echo ================================================================
echo             IPF SmartTrack - Deteniendo servicios...
echo ================================================================
echo.

echo Cerrando Backend, Frontend y Tunel...
taskkill /f /im cloudflared.exe >nul 2>&1
taskkill /f /im uvicorn.exe >nul 2>&1
taskkill /f /im python.exe /t >nul 2>&1
taskkill /f /im node.exe /t >nul 2>&1

echo.
echo ================================================================
echo  ¡Todos los servicios detenidos!
echo ================================================================
echo.
pause
