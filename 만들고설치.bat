@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo [1/4] 켜져 있는 마을 끄는 중...
taskkill /IM AdventVillage.exe /F >nul 2>&1
taskkill /IM advent-village.exe /F >nul 2>&1
echo [2/4] 설치 파일 만드는 중... (몇 분 걸려요)
call npm.cmd run build
if errorlevel 1 (
  echo.
  echo 만들다가 오류가 났어요. 이 창을 캡처해서 보내 주세요.
  pause
  exit /b 1
)
for %%f in ("src-tauri\target\release\bundle\nsis\*-setup.exe") do set SETUP=%%f
echo [3/4] 설치 중... %SETUP%
"%SETUP%" /S
timeout /t 3 /nobreak >nul
echo [4/4] 마을 켜는 중...
if exist "%LOCALAPPDATA%\AdventVillage\AdventVillage.exe" (start "" "%LOCALAPPDATA%\AdventVillage\AdventVillage.exe") else (start "" "%LOCALAPPDATA%\AdventVillage\advent-village.exe")
echo 끝났어요!
timeout /t 5 >nul
