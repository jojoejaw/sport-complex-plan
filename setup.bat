@echo off
chcp 65001 > nul
echo ===================================================
echo   Sport Complex Booking System - Automatic Setup
echo ===================================================
echo.
echo [1/2] Installing Backend Dependencies...
cd backend
call npm install
if %errorlevel% neq 0 (
    echo [ERROR] Failed to install Backend dependencies.
    pause
    exit /b %errorlevel%
)
cd ..

echo.
echo [2/2] Installing Frontend Dependencies...
cd frontend
call npm install
if %errorlevel% neq 0 (
    echo [ERROR] Failed to install Frontend dependencies.
    pause
    exit /b %errorlevel%
)
cd ..

echo.
echo ===================================================
echo   [SUCCESS] Setup Completed Successfully!
echo ===================================================
echo.
echo Quick Start Steps:
echo   1. Import database: 'sport_complex_db_complete.sql' into MySQL
echo   2. Run Backend:  cd backend ^&^& npm run dev  (http://localhost:5000)
echo   3. Run Frontend: cd frontend ^&^& npm run dev (http://localhost:5173)
echo.
pause
