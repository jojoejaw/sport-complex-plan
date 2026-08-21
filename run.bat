@echo off
chcp 65001 > nul
echo ===================================================
echo   Sport Complex Booking System - Starting Server
echo ===================================================
echo.
echo [1/2] Starting Backend Server (Port 5000)...
start "Backend Server (Express)" cmd /k "cd backend && npm run dev"

echo [2/2] Starting Frontend Server (Vite Dev)...
start "Frontend Server (React)" cmd /k "cd frontend && npm run dev"

echo.
echo ===================================================
echo   [SUCCESS] Servers are starting in new windows!
echo   - Backend:  http://localhost:5000
echo   - Swagger:  http://localhost:5000/api-docs
echo   - Frontend: http://localhost:5173
echo ===================================================
echo.
