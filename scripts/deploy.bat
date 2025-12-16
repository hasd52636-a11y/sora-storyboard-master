@echo off
chcp 65001 > nul
echo ========================================
echo   🚀 Storyboard Master 一键部署
echo ========================================
echo.

REM 检查Node.js
echo [1/6] 检查环境...
node --version > nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ 错误: 未安装Node.js
    pause
    exit /b 1
)
echo ✅ Node.js已安装

REM 安装依赖
echo.
echo [2/6] 安装依赖...
call npm install
if %errorlevel% neq 0 (
    echo ❌ 依赖安装失败
    pause
    exit /b 1
)
echo ✅ 依赖安装完成

REM 运行测试
echo.
echo [3/6] 运行测试...
call npm run test 2>nul
if %errorlevel% neq 0 (
    echo ⚠️  测试失败，但继续部署...
) else (
    echo ✅ 测试通过
)

REM 构建项目
echo.
echo [4/6] 构建项目...
call npm run build
if %errorlevel% neq 0 (
    echo ❌ 构建失败
    pause
    exit /b 1
)
echo ✅ 构建完成

REM 构建API
echo.
echo [5/6] 构建API...
call npm run build-api
if %errorlevel% neq 0 (
    echo ❌ API构建失败
    pause
    exit /b 1
)
echo ✅ API构建完成

REM 部署到Vercel
echo.
echo [6/6] 部署到Vercel...
echo.
echo 请选择部署方式:
echo   1. 生产环境部署
echo   2. 预览环境部署
echo   3. 取消部署
echo.
set /p choice="请输入选项 (1-3): "

if "%choice%"=="1" (
    echo.
    echo 正在部署到生产环境...
    call vercel --prod
    if %errorlevel% neq 0 (
        echo ❌ 部署失败
        pause
        exit /b 1
    )
    echo ✅ 生产环境部署成功！
) else if "%choice%"=="2" (
    echo.
    echo 正在部署到预览环境...
    call vercel
    if %errorlevel% neq 0 (
        echo ❌ 部署失败
        pause
        exit /b 1
    )
    echo ✅ 预览环境部署成功！
) else (
    echo.
    echo 已取消部署
    pause
    exit /b 0
)

echo.
echo ========================================
echo   🎉 部署完成！
echo ========================================
echo.
pause
