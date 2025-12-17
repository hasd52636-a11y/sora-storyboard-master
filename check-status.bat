@echo off
chcp 65001 > nul
echo ========================================
echo   项目状态检查
echo ========================================
echo.

echo [1] 检查Node.js版本...
node --version
if %errorlevel% neq 0 (
    echo [错误] Node.js未安装或未添加到PATH
    goto :end
)
echo.

echo [2] 检查npm版本...
npm --version
if %errorlevel% neq 0 (
    echo [错误] npm未安装或未添加到PATH
    goto :end
)
echo.

echo [3] 检查项目依赖...
if exist "node_modules" (
    echo [✓] node_modules文件夹存在
) else (
    echo [✗] node_modules文件夹不存在
    echo     请运行: npm install
)
echo.

echo [4] 检查环境变量文件...
if exist ".env.local" (
    echo [✓] .env.local文件存在
    echo     SILICONFLOW_API_KEY已配置
) else (
    echo [✗] .env.local文件不存在
    echo     请创建.env.local文件并配置API密钥
)
echo.

echo [5] 检查端口占用情况...
netstat -ano | findstr :3000 > nul
if %errorlevel% == 0 (
    echo [!] 端口3000已被占用
    echo     Vite将自动切换到其他端口（如3001）
) else (
    echo [✓] 端口3000可用
)
echo.

netstat -ano | findstr :3001 > nul
if %errorlevel% == 0 (
    echo [!] 端口3001已被占用
) else (
    echo [✓] 端口3001可用
)
echo.

echo [6] 检查开发服务器状态...
curl -s http://localhost:3001 > nul 2>&1
if %errorlevel% == 0 (
    echo [✓] 开发服务器运行中: http://localhost:3001
) else (
    curl -s http://localhost:3000 > nul 2>&1
    if %errorlevel% == 0 (
        echo [✓] 开发服务器运行中: http://localhost:3000
    ) else (
        echo [✗] 开发服务器未运行
        echo     请运行: npm run dev
    )
)
echo.

echo ========================================
echo   检查完成
echo ========================================
echo.
echo 快速操作:
echo   1. 启动开发服务器: npm run dev
echo   2. 构建生产版本: npm run build
echo   3. 预览生产版本: npm run preview
echo   4. 打开测试页面: start test-api-endpoints.html
echo.

:end
pause
