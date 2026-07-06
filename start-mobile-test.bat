@echo off
:: ============================================================
:: start-mobile-test.bat — Lance Colisender pour test mobile
:: Double-clic pour lancer, ou exécute dans PowerShell
:: ============================================================

echo.
echo  ==========================================
echo   Colisender — Test Mobile avec ngrok
echo  ==========================================
echo.

:: 1. Vérifier que le backend tourne sur 8080
echo [1/3] Vérification du backend (port 8080)...
curl -s http://localhost:8080/api/auth/ping >nul 2>&1
if %errorlevel% neq 0 (
    echo  ATTENTION : Le backend Spring Boot ne semble pas démarré !
    echo  Lance d'abord : mvnw spring-boot:run  dans le dossier backend
    echo  Attente 10s avant de continuer...
    timeout /t 10 >nul
) else (
    echo  Backend OK sur http://localhost:8080
)

:: 2. Lancer le frontend Vite en arrière-plan
echo.
echo [2/3] Démarrage du frontend Vite (port 5173)...
echo  Proxy actif : /api et /uploads → localhost:8080
start "Frontend Vite" cmd /k "cd /d %~dp0 && npm run dev"
timeout /t 5 >nul

:: 3. Lancer ngrok sur le port 5173 (UN SEUL TUNNEL suffit)
echo.
echo [3/3] Lancement de ngrok sur le port 5173...
echo.
echo  ► Copie l'URL ngrok affichée ci-dessous
echo  ► Ouvre cette URL sur ton telephone
echo  ► Le frontend et l'API fonctionnent tous les deux via ce tunnel
echo.
echo  IMPORTANT : Appuye sur Ctrl+C pour arrêter ngrok
echo.

:: Chercher ngrok dans les emplacements courants
where ngrok >nul 2>&1
if %errorlevel% equ 0 (
    ngrok http 5173 --host-header="localhost:5173"
) else if exist "%USERPROFILE%\ngrok.exe" (
    %USERPROFILE%\ngrok.exe http 5173 --host-header="localhost:5173"
) else if exist "C:\ngrok\ngrok.exe" (
    C:\ngrok\ngrok.exe http 5173 --host-header="localhost:5173"
) else (
    echo  ERREUR : ngrok introuvable !
    echo  Télécharge-le sur https://ngrok.com/download
    echo  et place ngrok.exe dans C:\ngrok\ ou dans le PATH
    pause
)
