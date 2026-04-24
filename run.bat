@echo off
color 0A
echo Dang khoi dong toan bo he thong NCKHSV...
echo Quay lai VS Code de xem log neu can.
powershell.exe -ExecutionPolicy Bypass -File "%~dp0start-all.ps1"
if %errorlevel% neq 0 (
    echo [LOI] Co loi xay ra khi chay script PowerShell.
    pause
)
exit
