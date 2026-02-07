@echo off
setlocal
title MKV Wrapper Pro

echo ==========================================
echo      STARTING MKV WRAPPER PRO
echo ==========================================
echo.

if not exist "dist" (
    echo [WARNING] 'dist' folder not found!
    echo Please run 'npm run build' first to generate the UI.
    echo.
)

echo Launching browser...
start "" "http://localhost:5005"

echo Starting server process...
call npm start

pause
endlocal