@echo off
setlocal
title mamonu local preview
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo.
  echo ERROR: Node.js is not installed or is not available in PATH.
  echo Install the current LTS version from https://nodejs.org/ and try again.
  echo.
  if /i not "%~1"=="--check" pause
  exit /b 1
)

if not exist "package.json" (
  echo ERROR: package.json was not found next to preview-site.bat.
  if /i not "%~1"=="--check" pause
  exit /b 1
)

if /i "%~1"=="--check" (
  if exist "node_modules\.bin\vite.cmd" (
    echo PREVIEW CHECK OK: Node.js and the local site dependencies are ready.
    exit /b 0
  )
  where pnpm >nul 2>nul
  if not errorlevel 1 (
    echo PREVIEW CHECK OK: Node.js and pnpm are ready. Dependencies will install on first launch.
    exit /b 0
  )
  where corepack >nul 2>nul
  if not errorlevel 1 (
    echo PREVIEW CHECK OK: Node.js and Corepack are ready. Dependencies will install on first launch.
    exit /b 0
  )
  echo ERROR: pnpm is required for the first installation. Run: npm install -g pnpm
  exit /b 1
)

if not exist "node_modules\.bin\vite.cmd" (
  echo Installing the locked site dependencies for first use...
  where pnpm >nul 2>nul
  if not errorlevel 1 (
    call pnpm install --frozen-lockfile
  ) else (
    where corepack >nul 2>nul
    if errorlevel 1 (
      echo.
      echo ERROR: pnpm is required. Run: npm install -g pnpm
      echo.
      pause
      exit /b 1
    )
    call corepack pnpm install --frozen-lockfile
  )
  if errorlevel 1 (
    echo.
    echo ERROR: Dependency installation failed. Review the messages above.
    echo.
    pause
    exit /b 1
  )
)

echo.
echo Starting the mamonu preview at http://127.0.0.1:5173/
echo Keep this window open while previewing. Press Ctrl+C to stop.
echo.
start "" /b powershell.exe -NoProfile -WindowStyle Hidden -Command "Start-Sleep -Seconds 2; Start-Process 'http://127.0.0.1:5173/'"
call "node_modules\.bin\vite.cmd" --host 127.0.0.1 --port 5173 --strictPort

if errorlevel 1 (
  echo.
  echo The preview server stopped with an error.
  pause
)

endlocal
