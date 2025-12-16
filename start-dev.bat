@echo off
echo ========================================
echo   Storyboard Master - 开发服务器启动
echo ========================================
echo.
echo 正在启动开发服务器...
echo.

REM 检查端口3000是否被占用
netstat -ano | findstr :3000 > nul
if %errorlevel% == 0 (
    echo [警告] 端口3000已被占用，Vite将自动切换到其他端口
    echo.
)

REM 启动开发服务器
npm run dev

pause
