@echo off
echo Stopping existing containers...
docker compose down

echo Rebuilding and starting containers in detached mode...
docker compose up --build -d

echo ✅ App deployed successfully!
echo Server is running at: http://localhost (or http://localhost:3000)
pause
