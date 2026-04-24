$scriptPath = $PSScriptRoot

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "   KHOI DONG HE THONG NCKHSV DA CONG" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Cyan

Write-Host "1. Khoi dong SUPERADMIN Backend (Port 5000)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "title SUPERADMIN BACKEND; cd '$scriptPath\SUPERADMIN\backend'; npm run dev"

Write-Host "2. Khoi dong SUPERADMIN Frontend (Port 5174)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "title SUPERADMIN FRONTEND; cd '$scriptPath\SUPERADMIN\frontend'; `$env:PORT=5174; npm start"

Write-Host "3. Khoi dong ADMIN Backend (Port 5001)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "title ADMIN BACKEND; cd '$scriptPath\ADMIN\backend'; npm run dev"

Write-Host "4. Khoi dong ADMIN Frontend (Port 5175)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "title ADMIN FRONTEND; cd '$scriptPath\ADMIN\frontend'; `$env:PORT=5175; npm start"

Write-Host "5. Khoi dong USER Frontend (Port 5173)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "title USER FRONTEND; cd '$scriptPath\USER'; npm run dev"

Write-Host "He thong dang khoi chay..." -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Cyan
