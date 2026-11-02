@echo off
echo =====================================================================
echo Starting AI Recruitment Backend (FastAPI on http://127.0.0.1:8000)...
echo =====================================================================
cd /d "%~dp0backend"
if exist venv\Scripts\activate.bat (
    call venv\Scripts\activate.bat
    python -m uvicorn main:app --reload --port 8000
) else if exist ..\backend\venv\Scripts\activate.bat (
    cd /d "%~dp0..\backend"
    call venv\Scripts\activate.bat
    python -m uvicorn main:app --reload --port 8000
) else (
    python -m uvicorn main:app --reload --port 8000
)
if errorlevel 1 (
    echo.
    echo Backend encountered an issue. Press any key to close.
    pause
)
