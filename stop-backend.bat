@echo off
echo Stopping AI Recruitment Platform Backend...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8000 ^| findstr LISTENING') do (
    echo Terminating backend process with PID: %%a
    taskkill /F /PID %%a >nul 2>&1
)
taskkill /F /IM uvicorn.exe >nul 2>&1
echo Backend stopped successfully.
pause

