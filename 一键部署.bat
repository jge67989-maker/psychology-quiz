@echo off
echo ========================================
echo 心理学刷题宝典 - 一键部署助手
echo ========================================
echo.
echo 请选择部署方式：
echo.
echo 1. GitHub Pages（推荐，需要GitHub账号）
echo 2. Netlify（最简单，需要Netlify账号）
echo 3. 打开部署指南
echo 4. 退出
echo.
set /p choice="请输入选项 (1-4): "

if "%choice%"=="1" goto github
if "%choice%"=="2" goto netlify
if "%choice%"=="3" goto guide
if "%choice%"=="4" goto exit

:github
echo.
echo 正在打开 GitHub 创建仓库...
start https://github.com/new
echo.
echo 请按照以下步骤操作：
echo 1. 创建仓库名: psychology-quiz
echo 2. 选择 Public
echo 3. 不要初始化 README
echo 4. 创建后回来按任意键继续...
pause
echo.
echo 正在推送代码...
git init
git add -A
git commit -m "Initial commit"
git branch -M main
echo.
echo 请输入你的 GitHub 用户名:
set /p username=
git remote add origin https://github.com/%username%/psychology-quiz.git
git push -u origin main
echo.
echo 代码已推送！
echo 正在打开 GitHub Pages 设置...
start https://github.com/%username%/psychology-quiz/settings/pages
echo.
echo 请在页面中：
echo 1. Source 选择 main 分支
echo 2. 点击 Save
echo.
echo 完成后访问: https://%username%.github.io/psychology-quiz
pause
goto exit

:netlify
echo.
echo 正在打开 Netlify 拖拽部署页面...
start https://app.netlify.com/drop
echo.
echo 请按照以下步骤操作：
echo 1. 登录 Netlify 账号
echo 2. 将以下文件夹拖拽到页面上:
echo    C:\Users\22457\Desktop\psychology-quiz
echo 3. 等待部署完成
echo 4. 获得免费域名
echo.
pause
goto exit

:guide
start notepad "C:\Users\22457\Desktop\psychology-quiz\部署指南.txt"
goto exit

:exit
echo.
echo 感谢使用！
pause
