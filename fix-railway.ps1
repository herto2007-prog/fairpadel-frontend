# Script de reparación de Railway - Ejecutar con clic derecho "Ejecutar con PowerShell"
Write-Host "=== Reparando migración fallida en Railway ===" -ForegroundColor Green

# Navegar al backend
cd d:\fairpadel\backend

# Marcar migración fallida como resuelta
Write-Host "Paso 1: Marcando migración fallida como resuelta..." -ForegroundColor Yellow
railway run npx prisma migrate resolve --rolled-back 20260305000006_fix_banner_zona_enum

# Aplicar migraciones pendientes
Write-Host "Paso 2: Aplicando migraciones pendientes..." -ForegroundColor Yellow
railway run npx prisma migrate deploy

Write-Host "=== Reparación completada ===" -ForegroundColor Green
Write-Host "Ahora hacé redeploy del backend en Railway dashboard" -ForegroundColor Cyan
pause
