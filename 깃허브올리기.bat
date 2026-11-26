@echo off
chcp 65001 >nul
cd /d "%~dp0"
where git >nul 2>nul
if errorlevel 1 (
  echo [!] Git 프로그램이 없어요. https://git-scm.com/download/win 에서 설치한 뒤 이 파일을 다시 실행해 주세요.
  pause
  exit /b
)
if not exist .git git init -b main
git config user.name >nul 2>nul
if errorlevel 1 (
  set /p GN=GitHub 아이디를 입력하세요: 
  call git config user.name "%%GN%%"
)
git config user.email >nul 2>nul
if errorlevel 1 (
  set /p GE=GitHub에 가입한 이메일을 입력하세요: 
  call git config user.email "%%GE%%"
)
git add -A
git commit -m "update"
git remote get-url origin >nul 2>nul
if errorlevel 1 git remote add origin https://github.com/sosohanlab/christmas.git
git branch -M main
git push -u origin main
echo.
echo 끝났어요. 위에 오류가 없으면 깃허브에 올라간 거예요.
pause
