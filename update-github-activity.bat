@echo off
setlocal
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo ERROR: Node.js is required. Install Node.js 22.12 or newer.
  pause
  exit /b 1
)
where gh >nul 2>nul
if errorlevel 1 (
  echo ERROR: GitHub CLI is required. Install it and run gh auth login first.
  pause
  exit /b 1
)
node scripts\update-github-activity.mjs %*
set "activity_exit=%errorlevel%"
echo.
if not "%activity_exit%"=="0" echo Update failed. Your previous archive has been preserved.
pause
exit /b %activity_exit%
