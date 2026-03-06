# Script para actualizar DATABASE_URL en Railway
# Ejecutar: railway vars set DATABASE_URL="postgresql://postgres:zLMkYsxUZoXmQbwigqzuJfZJyPGlCqUx@switchyard.proxy.rlwy.net:13142/railway"

Write-Host "Actualizando DATABASE_URL en Railway..." -ForegroundColor Green

railway vars set DATABASE_URL="postgresql://postgres:zLMkYsxUZoXmQbwigqzuJfZJyPGlCqUx@switchyard.proxy.rlwy.net:13142/railway"

Write-Host "Variable actualizada. El deploy debería iniciarse automáticamente." -ForegroundColor Green
pause
