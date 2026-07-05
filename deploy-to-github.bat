@echo off
echo ========================================
echo 心理学刷题宝典 - GitHub Pages 部署
echo ========================================
echo.
echo 请按照以下步骤操作：
echo.
echo 1. 访问 https://github.com/new 创建新仓库
echo    - 仓库名: psychology-quiz
echo    - 选择 Public
echo    - 不要初始化 README
echo.
echo 2. 创建仓库后，在此窗口按任意键继续...
echo.
pause
echo.
echo 3. 正在推送代码到 GitHub...
echo.
git init
git add -A
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/psychology-quiz.git
git push -u origin main
echo.
echo 4. 代码已推送！
echo.
echo 5. 请在 GitHub 仓库设置中启用 GitHub Pages:
echo    - 访问仓库的 Settings > Pages
echo    - Source 选择 main 分支
echo    - 点击 Save
echo.
echo 6. 您的网站将在以下地址可用:
echo    https://YOUR_USERNAME.github.io/psychology-quiz
echo.
echo ========================================
pause
