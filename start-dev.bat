@echo off
echo ========================================
echo   PAPERPAL Development Setup
echo ========================================
echo.

echo [1/4] Starting Docker containers...
docker-compose up -d
if %errorlevel% neq 0 (
    echo ERROR: Failed to start Docker containers
    echo Make sure Docker Desktop is running!
    pause
    exit /b 1
)

echo.
echo [2/4] Waiting for database to be ready...
timeout /t 5 /nobreak > nul

echo.
echo [3/4] Running database migrations...
cd packages\backend
call npm run migrate
if %errorlevel% neq 0 (
    echo WARNING: Migrations failed. Database might not be ready yet.
    echo Try running: npm run migrate --workspace=backend
)
cd ..\..

echo.
echo [4/4] Starting development servers...
echo.
echo ========================================
echo   PAPERPAL is starting!
echo ========================================
echo.
echo Backend API: http://localhost:3000
echo Frontend:    http://localhost:5173
echo.
echo Press Ctrl+C to stop the servers
echo ========================================
echo.

npm run dev

pause
