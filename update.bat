@echo off
echo ==========================================
echo   ATUALIZADOR AUTOMATICO - KINECTVJ
echo ==========================================
echo.

echo 1. Salvando e enviando para o GitHub (Atualiza Vercel/Site automaticamente)...
git add .
set /p msg="Digite a mensagem de alteracao (ou aperte Enter para 'Update automatico'): "
if "%msg%"=="" set msg=Update automatico
git commit -m "%msg%"
git push origin main
echo.
echo [OK] Site atualizado!
echo.

echo 2. Deseja gerar um novo instalador .EXE? (S/N)
set /p build_exe="Escolha S ou N: "
if /I "%build_exe%"=="S" (
    echo.
    echo Gerando instalador (isso pode levar alguns minutos)...
    call npm run electron:build
    echo.
    echo [OK] Novo instalador .EXE gerado na pasta "release"!
) else (
    echo.
    echo Build do instalador ignorado.
)

echo.
echo Atualizacao concluida!
pause
