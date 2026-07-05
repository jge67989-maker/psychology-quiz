// ==========================================
// Psychology Quiz App - Main Application
// ==========================================

// Global State
let currentUser = null;
let currentMode = 'sequential';
let currentQuestionIndex = 0;
let selectedOption = null; // For single/judge: string, For multi: array
let isAnswered = false;
let examQuestions = [];
let examTimer = null;
let examStartTime = null;
let filteredQuestions = [...QUESTIONS];
let rangeStart = 1;
let rangeEnd = QUESTIONS.length > 0 ? QUESTIONS[QUESTIONS.length - 1].id : 700;

// ==========================================
// Authentication Functions
// ==========================================

function getUsers() {
    try {
        const data = localStorage.getItem('psych_users');
        return data ? JSON.parse(data) : {};
    } catch (e) {
        console.error('Error reading users:', e);
        return {};
    }
}

function saveUsers(users) {
    try {
        localStorage.setItem('psych_users', JSON.stringify(users));
        console.log('Users saved successfully, count:', Object.keys(users).length);
    } catch (e) {
        console.error('Error saving users:', e);
        showToast('数据保存失败，请检查浏览器设置', 'error');
    }
}

function getCurrentUser() {
    const userId = localStorage.getItem('psych_current_user');
    if (!userId) return null;
    const users = getUsers();
    return users[userId] || null;
}

function saveCurrentUser(user) {
    try {
        const users = getUsers();
        users[user.id] = user;
        saveUsers(users);
        localStorage.setItem('psych_current_user', user.id);
        console.log('Current user saved:', user.id);
    } catch (e) {
        console.error('Error saving current user:', e);
    }
}

// Check if localStorage is available
function isLocalStorageAvailable() {
    try {
        const test = '__test__';
        localStorage.setItem(test, test);
        localStorage.removeItem(test);
        return true;
    } catch (e) {
        return false;
    }
}

function showRegister() {
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('registerForm').style.display = 'block';
    document.getElementById('authMessage').innerHTML = '';
}

function showLogin() {
    document.getElementById('loginForm').style.display = 'block';
    document.getElementById('registerForm').style.display = 'none';
    document.getElementById('authMessage').innerHTML = '';
}

function showMessage(msg, type = 'error') {
    const colors = {
        error: 'text-red-500',
        success: 'text-green-500',
        info: 'text-blue-500'
    };
    document.getElementById('authMessage').innerHTML = `<p class="${colors[type] || colors.error}"><i class="fas fa-${type === 'error' ? 'exclamation-circle' : type === 'success' ? 'check-circle' : 'info-circle'} mr-1"></i>${msg}</p>`;
}

function login() {
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value;

    if (!username || !password) {
        showMessage('请输入用户名和密码');
        return;
    }

    const users = getUsers();
    const userId = username.toLowerCase();

    if (!users[userId]) {
        showMessage('用户不存在，请先注册');
        return;
    }

    if (users[userId].password !== password) {
        showMessage('密码错误');
        return;
    }

    currentUser = users[userId];
    localStorage.setItem('psych_current_user', userId);
    showMessage('登录成功！', 'success');
    setTimeout(() => initApp(), 500);
}

function register() {
    const username = document.getElementById('regUsername').value.trim();
    const password = document.getElementById('regPassword').value;
    const nickname = document.getElementById('regNickname').value.trim() || username;

    if (!username || !password) {
        showMessage('请输入用户名和密码');
        return;
    }

    if (username.length < 2) {
        showMessage('用户名至少2个字符');
        return;
    }

    if (password.length < 4) {
        showMessage('密码至少4个字符');
        return;
    }

    const users = getUsers();
    const userId = username.toLowerCase();

    if (users[userId]) {
        showMessage('用户名已存在');
        return;
    }

    currentUser = {
        id: userId,
        username: username,
        nickname: nickname,
        password: password,
        createdAt: new Date().toISOString(),
        stats: {
            totalAnswered: 0,
            totalCorrect: 0,
            totalWrong: 0,
            wrongQuestions: [],
            favorites: [],
            answeredQuestions: {},
            dailyStats: {},
            streak: 0,
            lastStudyDate: null,
            points: 0,
            examHistory: []
        }
    };

    saveCurrentUser(currentUser);
    showMessage('注册成功！', 'success');
    setTimeout(() => initApp(), 500);
}

function logout() {
    localStorage.removeItem('psych_current_user');
    currentUser = null;
    document.getElementById('mainApp').style.display = 'none';
    document.getElementById('authPage').style.display = 'flex';
    document.getElementById('loginUsername').value = '';
    document.getElementById('loginPassword').value = '';
}

function checkAuth() {
    // Check if localStorage is available
    if (!isLocalStorageAvailable()) {
        showMessage('您的浏览器不支持数据保存功能，请尝试使用其他浏览器', 'error');
        return;
    }

    const user = getCurrentUser();
    if (user) {
        currentUser = user;
        initApp();
    }
}

// ==========================================
// App Initialization
// ==========================================

function initApp() {
    document.getElementById('authPage').style.display = 'none';
    document.getElementById('mainApp').style.display = 'block';

    // Update UI with user info
    document.getElementById('userDisplayName').textContent = currentUser.nickname;
    document.getElementById('menuUsername').textContent = currentUser.nickname;
    document.getElementById('menuUserStats').textContent = `已答 ${currentUser.stats.totalAnswered} 题`;

    // Initialize stats
    updateStats();
    updateStreak();
    updateBadges();

    // Load first question
    loadQuestion();
    renderQuestionGrid();
}

// ==========================================
// Stats & UI Updates
// ==========================================

function updateStats() {
    const stats = currentUser.stats;
    const accuracy = stats.totalAnswered > 0 ? Math.round((stats.totalCorrect / stats.totalAnswered) * 100) : 0;

    document.getElementById('statCompleted').textContent = stats.totalAnswered;
    document.getElementById('statAccuracy').textContent = accuracy + '%';
    document.getElementById('statWrong').textContent = stats.wrongQuestions.length;
    document.getElementById('statFavorite').textContent = stats.favorites.length;
    document.getElementById('totalPoints').textContent = stats.points;

    // Progress bar
    const progress = Math.round((Object.keys(stats.answeredQuestions).length / QUESTIONS.length) * 100);
    document.getElementById('progressBar').style.width = progress + '%';
    document.getElementById('progressText').textContent = `${Object.keys(stats.answeredQuestions).length}/${QUESTIONS.length}`;
}

function updateStreak() {
    const today = new Date().toDateString();
    const lastDate = currentUser.stats.lastStudyDate;

    if (lastDate === today) {
        // Already studied today
    } else if (lastDate) {
        const last = new Date(lastDate);
        const diff = Math.floor((new Date(today) - last) / (1000 * 60 * 60 * 24));
        if (diff > 1) {
            currentUser.stats.streak = 0;
        }
    }

    document.getElementById('streakCount').textContent = currentUser.stats.streak;
}

function updateBadges() {
    const wrongCount = currentUser.stats.wrongQuestions.length;
    const favCount = currentUser.stats.favorites.length;

    const wrongBadge = document.getElementById('wrongCountBadge');
    const favBadge = document.getElementById('favCountBadge');

    if (wrongCount > 0) {
        wrongBadge.textContent = wrongCount;
        wrongBadge.classList.remove('hidden');
    } else {
        wrongBadge.classList.add('hidden');
    }

    if (favCount > 0) {
        favBadge.textContent = favCount;
        favBadge.classList.remove('hidden');
    } else {
        favBadge.classList.add('hidden');
    }
}

function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const icon = document.getElementById('toastIcon');
    const msg = document.getElementById('toastMessage');

    msg.textContent = message;
    icon.className = type === 'success' ? 'fas fa-check-circle text-green-400' :
                     type === 'error' ? 'fas fa-exclamation-circle text-red-400' :
                     'fas fa-info-circle text-blue-400';

    toast.style.transform = 'translateY(0)';
    toast.style.opacity = '1';

    setTimeout(() => {
        toast.style.transform = 'translateY(20px)';
        toast.style.opacity = '0';
    }, 2000);
}

// ==========================================
// Question Loading & Display
// ==========================================

function getQuestionPool() {
    switch (currentMode) {
        case 'sequential':
        case 'random':
            return filteredQuestions;
        case 'wrong':
            return QUESTIONS.filter(q => currentUser.stats.wrongQuestions.includes(q.id));
        case 'favorite':
            return QUESTIONS.filter(q => currentUser.stats.favorites.includes(q.id));
        case 'exam':
            return examQuestions;
        case 'chapter':
            return filteredQuestions;
        default:
            return filteredQuestions;
    }
}

function loadQuestion() {
    const pool = getQuestionPool();

    if (pool.length === 0) {
        document.getElementById('questionText').textContent = currentMode === 'wrong' ? '太棒了！没有错题！' :
                                                             currentMode === 'favorite' ? '还没有收藏题目' :
                                                             '没有题目';
        document.getElementById('optionsContainer').innerHTML = '';
        document.getElementById('questionNumber').textContent = currentMode === 'wrong' ? '错题本' : '收藏夹';
        return;
    }

    if (currentQuestionIndex >= pool.length) {
        currentQuestionIndex = 0;
    }

    const question = pool[currentQuestionIndex];
    if (!question) return;

    // Update question display - show sequential number
    const seqNum = pool.findIndex(q => q.id === question.id) + 1;
    document.getElementById('questionNumber').textContent = `第 ${seqNum} 题`;

    // Update question type display
    const typeLabels = { single: '单选题', multi: '多选题', judge: '判断题' };
    const typeColors = { single: 'bg-gray-100 text-gray-600', multi: 'bg-orange-100 text-orange-600', judge: 'bg-teal-100 text-teal-600' };
    const typeEl = document.getElementById('questionType');
    typeEl.textContent = typeLabels[question.type] || '单选题';
    typeEl.className = `px-3 py-1 rounded-full text-sm ${typeColors[question.type] || typeColors.single}`;

    document.getElementById('questionText').textContent = question.question;

    // Update favorite button
    const isFav = currentUser.stats.favorites.includes(question.id);
    const favBtn = document.getElementById('favBtn');
    favBtn.innerHTML = isFav ?
        '<i class="fas fa-heart text-pink-500 text-lg"></i>' :
        '<i class="far fa-heart text-gray-400 text-lg"></i>';

    // Get options to display based on type
    let optionKeys = ['A', 'B', 'C', 'D'];
    if (question.type === 'multi') {
        optionKeys = Object.keys(question.options).sort();
    } else if (question.type === 'judge') {
        optionKeys = ['A', 'B'];
    }

    // Check if already answered (but not in wrong/favorite mode which allows re-do)
    const answered = currentUser.stats.answeredQuestions[question.id];
    const isRetryMode = currentMode === 'wrong' || currentMode === 'favorite';

    // Render options
    const optionsHtml = optionKeys.filter(opt => question.options[opt]).map(opt => {
        let classes = 'option-btn rounded-xl p-4 cursor-pointer flex items-center space-x-3';

        // Only show correct/wrong if already answered AND not in retry mode
        if (answered && !isRetryMode) {
            if (question.type === 'multi') {
                if (question.answer.includes(opt)) {
                    classes += ' correct';
                }
                if (answered.selected.includes(opt) && !question.answer.includes(opt)) {
                    classes += ' wrong';
                }
            } else {
                if (opt === question.answer) {
                    classes += ' correct';
                } else if (opt === answered.selected && answered.selected !== question.answer) {
                    classes += ' wrong';
                }
            }
        }

        return `
            <div class="${classes}" onclick="selectOption('${opt}')" data-option="${opt}">
                <div class="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center font-bold text-gray-600">
                    ${opt}
                </div>
                <span class="flex-1 text-gray-700">${question.options[opt] || ''}</span>
                ${answered && !isRetryMode && opt === question.answer ? '<i class="fas fa-check-circle text-green-500"></i>' : ''}
                ${answered && !isRetryMode && opt === answered.selected && answered.selected !== question.answer ? '<i class="fas fa-times-circle text-red-500"></i>' : ''}
            </div>
        `;
    }).join('');

    document.getElementById('optionsContainer').innerHTML = optionsHtml;

    // Show/hide multi-choice hint
    const multiHint = document.getElementById('multiHint');
    if (question.type === 'multi') {
        multiHint.classList.remove('hidden');
    } else {
        multiHint.classList.add('hidden');
    }

    // Reset state
    selectedOption = question.type === 'multi' ? [] : null;
    isAnswered = false;
    document.getElementById('answerFeedback').classList.add('hidden');
    document.getElementById('analysisSection').classList.add('hidden');
    document.getElementById('submitBtn').classList.remove('hidden');
    document.getElementById('nextBtn').classList.add('hidden');

    // If already answered AND not in retry mode, show feedback and hide submit button
    if (answered && !isRetryMode) {
        isAnswered = true;
        document.getElementById('submitBtn').classList.add('hidden');
        document.getElementById('nextBtn').classList.remove('hidden');
        showAnswerFeedback(question, answered.selected);
    }

    // Update navigation buttons
    document.getElementById('prevBtn').disabled = currentQuestionIndex === 0;
    document.getElementById('prevBtn').classList.toggle('opacity-50', currentQuestionIndex === 0);

    // Highlight in grid
    highlightGridQuestion(question.id);
}

function selectOption(option) {
    if (isAnswered) return;

    const pool = getQuestionPool();
    const question = pool[currentQuestionIndex];
    if (!question) return;

    if (question.type === 'multi') {
        // Multi-choice: toggle selection
        if (!selectedOption) selectedOption = [];
        if (!Array.isArray(selectedOption)) selectedOption = [];

        const idx = selectedOption.indexOf(option);
        if (idx > -1) {
            selectedOption.splice(idx, 1);
        } else {
            selectedOption.push(option);
        }

        // Update visual selection
        document.querySelectorAll('.option-btn').forEach(btn => {
            btn.classList.remove('selected');
            if (selectedOption.includes(btn.dataset.option)) {
                btn.classList.add('selected');
            }
        });
    } else {
        // Single-choice or judge: single selection
        selectedOption = option;

        // Update visual selection
        document.querySelectorAll('.option-btn').forEach(btn => {
            btn.classList.remove('selected');
            if (btn.dataset.option === option) {
                btn.classList.add('selected');
            }
        });

        // Auto-submit for single choice and judge questions
        submitAnswer();
    }
}

function submitAnswer() {
    if (!selectedOption || (Array.isArray(selectedOption) && selectedOption.length === 0)) {
        showToast('请先选择答案', 'error');
        return;
    }

    const pool = getQuestionPool();
    const question = pool[currentQuestionIndex];
    if (!question) return;

    isAnswered = true;

    let isCorrect = false;
    let selectedStr = '';

    if (question.type === 'multi') {
        // Multi-choice: sort and compare
        const sortedSelected = [...selectedOption].sort().join('');
        const sortedAnswer = question.answer.split('').sort().join('');
        isCorrect = sortedSelected === sortedAnswer;
        selectedStr = sortedSelected;
    } else {
        // Single-choice or judge
        isCorrect = selectedOption === question.answer;
        selectedStr = selectedOption;
    }

    // Check if this is a retry (in wrong/favorite mode)
    const isRetryMode = currentMode === 'wrong' || currentMode === 'favorite';
    const wasPreviouslyAnswered = currentUser.stats.answeredQuestions[question.id];

    // Update stats
    if (!isRetryMode || !wasPreviouslyAnswered) {
        // Only increment totalAnswered if not a retry
        currentUser.stats.totalAnswered++;
    }

    if (isCorrect) {
        if (!isRetryMode || !wasPreviouslyAnswered) {
            currentUser.stats.totalCorrect++;
        }
        currentUser.stats.points += 10;

        // Remove from wrong if was there
        const wrongIdx = currentUser.stats.wrongQuestions.indexOf(question.id);
        if (wrongIdx > -1) {
            currentUser.stats.wrongQuestions.splice(wrongIdx, 1);
        }
    } else {
        if (!isRetryMode || !wasPreviouslyAnswered) {
            currentUser.stats.totalWrong++;
        }
        if (!currentUser.stats.wrongQuestions.includes(question.id)) {
            currentUser.stats.wrongQuestions.push(question.id);
        }
    }

    // Record answer
    currentUser.stats.answeredQuestions[question.id] = {
        selected: selectedStr,
        correct: isCorrect,
        timestamp: new Date().toISOString()
    };

    // Update daily stats
    const today = new Date().toISOString().split('T')[0];
    if (!currentUser.stats.dailyStats[today]) {
        currentUser.stats.dailyStats[today] = { answered: 0, correct: 0 };
    }
    currentUser.stats.dailyStats[today].answered++;
    if (isCorrect) currentUser.stats.dailyStats[today].correct++;

    // Update streak
    const todayStr = new Date().toDateString();
    if (currentUser.stats.lastStudyDate !== todayStr) {
        currentUser.stats.streak++;
        currentUser.stats.lastStudyDate = todayStr;
    }

    saveCurrentUser(currentUser);
    updateStats();
    updateBadges();

    // Show feedback
    showAnswerFeedback(question, selectedStr);

    // Update options visual
    document.querySelectorAll('.option-btn').forEach(btn => {
        const opt = btn.dataset.option;
        // Highlight correct answer
        if (question.answer.includes(opt)) {
            btn.classList.add('correct');
        }
        // Highlight wrong selection
        if (question.type === 'multi') {
            if (selectedOption.includes(opt) && !question.answer.includes(opt)) {
                btn.classList.add('wrong');
            }
        } else {
            if (opt === selectedStr && !isCorrect) {
                btn.classList.add('wrong');
            }
        }
        btn.style.cursor = 'default';
    });

    // Toggle buttons
    document.getElementById('submitBtn').classList.add('hidden');
    document.getElementById('nextBtn').classList.remove('hidden');

    // Show special message in wrong mode when answered correctly
    if (currentMode === 'wrong' && isCorrect) {
        showToast('回答正确！已从错题中移除', 'success');
    }

    // Highlight grid
    renderQuestionGrid();

    // Auto-advance to next question after a short delay
    setTimeout(() => {
        nextQuestion();
    }, 1500);
}

function showAnswerFeedback(question, selected) {
    const feedback = document.getElementById('answerFeedback');
    const icon = document.getElementById('feedbackIcon');
    const text = document.getElementById('feedbackText');
    const correct = document.getElementById('correctAnswer');

    const isCorrect = selected === question.answer;
    const isRetryMode = currentMode === 'wrong' || currentMode === 'favorite';

    feedback.classList.remove('hidden');
    feedback.className = `mt-6 p-4 rounded-xl ${isCorrect ? 'bg-green-50' : 'bg-red-50'}`;

    icon.className = isCorrect ? 'fas fa-check-circle text-green-500 text-xl' : 'fas fa-times-circle text-red-500 text-xl';
    text.className = isCorrect ? 'font-bold text-green-700' : 'font-bold text-red-700';

    // Show different messages based on mode
    if (isRetryMode) {
        text.textContent = isCorrect ? '回答正确！已从错题中移除' : '回答错误，继续努力！';
    } else {
        text.textContent = isCorrect ? '回答正确！' : '回答错误';
    }

    // Build correct answer text
    let correctText = '';
    if (question.type === 'multi') {
        const answerLetters = question.answer.split('').sort();
        correctText = `正确答案：${answerLetters.join('')}. ${answerLetters.map(l => question.options[l]).join('、')}`;
    } else {
        correctText = `正确答案：${question.answer}. ${question.options[question.answer]}`;
    }
    correct.textContent = correctText;
}

function showAnalysis() {
    const pool = getQuestionPool();
    const question = pool[currentQuestionIndex];
    if (!question) return;

    const section = document.getElementById('analysisSection');
    section.classList.toggle('hidden');

    if (!section.classList.contains('hidden')) {
        // Generate simple analysis based on the question
        const analysis = generateAnalysis(question);
        document.getElementById('analysisText').textContent = analysis;
    }
}

function generateAnalysis(question) {
    // Simple analysis generator
    const analyses = [
        `本题考查的是对"${question.question.substring(0, 20)}..."的理解。正确答案是${question.answer}，即"${question.options[question.answer]}"。`,
        `这道题的关键在于理解题目中的核心概念。${question.answer}选项"${question.options[question.answer]}"是最准确的描述。`,
        `根据心理学相关理论，${question.answer}选项"${question.options[question.answer]}"是正确答案。建议结合教材相关内容复习。`
    ];
    return analyses[Math.floor(Math.random() * analyses.length)];
}

// ==========================================
// Navigation Functions
// ==========================================

function nextQuestion() {
    const pool = getQuestionPool();
    if (currentQuestionIndex < pool.length - 1) {
        currentQuestionIndex++;
        // Update grid page if needed
        gridPage = Math.floor(currentQuestionIndex / GRID_PAGE_SIZE);
        loadQuestion();
        renderQuestionGrid();
    } else {
        if (currentMode === 'exam') {
            finishExam();
        } else {
            showToast('已经是最后一题了', 'info');
        }
    }
}

function prevQuestion() {
    if (currentQuestionIndex > 0) {
        currentQuestionIndex--;
        // Update grid page if needed
        gridPage = Math.floor(currentQuestionIndex / GRID_PAGE_SIZE);
        loadQuestion();
        renderQuestionGrid();
    }
}

function jumpToQuestion() {
    const input = document.getElementById('jumpToQuestion');
    const qId = parseInt(input.value);

    if (!qId) {
        showToast('请输入题号', 'error');
        return;
    }

    const pool = getQuestionPool();
    const idx = pool.findIndex(q => q.id === qId);

    if (idx === -1) {
        showToast('未找到该题号', 'error');
        return;
    }

    currentQuestionIndex = idx;
    gridPage = Math.floor(idx / GRID_PAGE_SIZE); // Update grid page
    loadQuestion();
    renderQuestionGrid();
    showToast(`已跳转到第 ${qId} 题`, 'success');
    input.value = '';
}

// ==========================================
// Mode Switching
// ==========================================

function switchMode(mode) {
    currentMode = mode;
    currentQuestionIndex = 0;
    gridPage = 0; // Reset grid page

    // Update sidebar active state
    document.querySelectorAll('.sidebar-item').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.mode === mode) {
            item.classList.add('active');
        }
    });

    // Close sidebar on mobile
    if (window.innerWidth < 1024) {
        document.getElementById('sidebar').classList.add('-translate-x-full');
    }

    switch (mode) {
        case 'sequential':
            filteredQuestions = getFilteredQuestions();
            showToast('顺序刷题模式', 'info');
            break;
        case 'random':
            filteredQuestions = shuffleArray(getFilteredQuestions());
            showToast('随机刷题模式', 'info');
            break;
        case 'wrong':
            if (currentUser.stats.wrongQuestions.length === 0) {
                showToast('没有错题，继续加油！', 'success');
                return;
            }
            showToast(`错题重做模式 (${currentUser.stats.wrongQuestions.length}题)`, 'info');
            break;
        case 'favorite':
            if (currentUser.stats.favorites.length === 0) {
                showToast('还没有收藏题目', 'info');
                return;
            }
            showToast(`收藏夹 (${currentUser.stats.favorites.length}题)`, 'info');
            break;
        case 'exam':
            startExam();
            return;
        case 'chapter':
            showToast('章节练习模式', 'info');
            break;
    }

    loadQuestion();
    renderQuestionGrid();
}

function getFilteredQuestions() {
    return QUESTIONS.filter(q => q.id >= rangeStart && q.id <= rangeEnd);
}

function applyRange() {
    const start = parseInt(document.getElementById('rangeStart').value) || 1;
    const end = parseInt(document.getElementById('rangeEnd').value) || (QUESTIONS.length > 0 ? QUESTIONS[QUESTIONS.length - 1].id : 700);

    rangeStart = Math.max(1, start);
    rangeEnd = Math.min(QUESTIONS.length > 0 ? QUESTIONS[QUESTIONS.length - 1].id : 700, end);

    filteredQuestions = QUESTIONS.filter(q => q.id >= rangeStart && q.id <= rangeEnd);
    currentQuestionIndex = 0;
    gridPage = 0; // Reset grid page

    showToast(`已设置范围: ${rangeStart} - ${rangeEnd} (${filteredQuestions.length}题)`, 'success');
    loadQuestion();
    renderQuestionGrid();
}

// ==========================================
// Exam Mode
// ==========================================

function startExam() {
    const questionCount = Math.min(50, QUESTIONS.length); // Exam has 50 questions or less
    const allQuestions = [...QUESTIONS];
    examQuestions = shuffleArray(allQuestions).slice(0, questionCount);

    currentQuestionIndex = 0;
    gridPage = 0; // Reset grid page
    examStartTime = Date.now();

    // Show timer
    document.getElementById('examTimer').classList.remove('hidden');
    startExamTimer();

    showToast(`模拟考试开始！共 ${questionCount} 题`, 'info');
    loadQuestion();
    renderQuestionGrid();
}

function startExamTimer() {
    if (examTimer) clearInterval(examTimer);

    examTimer = setInterval(() => {
        const elapsed = Math.floor((Date.now() - examStartTime) / 1000);
        const minutes = Math.floor(elapsed / 60).toString().padStart(2, '0');
        const seconds = (elapsed % 60).toString().padStart(2, '0');
        document.getElementById('timerDisplay').textContent = `${minutes}:${seconds}`;
    }, 1000);
}

function finishExam() {
    if (examTimer) {
        clearInterval(examTimer);
        examTimer = null;
    }

    document.getElementById('examTimer').classList.add('hidden');

    const totalQuestions = examQuestions.length;
    let correctCount = 0;

    examQuestions.forEach(q => {
        const answer = currentUser.stats.answeredQuestions[q.id];
        if (answer && answer.correct) {
            correctCount++;
        }
    });

    const accuracy = Math.round((correctCount / totalQuestions) * 100);
    const score = correctCount * 2; // Each question is 2 points

    // Save exam history
    currentUser.stats.examHistory.push({
        date: new Date().toISOString(),
        score: score,
        accuracy: accuracy,
        totalQuestions: totalQuestions,
        correctCount: correctCount,
        timeSpent: Math.floor((Date.now() - examStartTime) / 1000)
    });

    saveCurrentUser(currentUser);

    // Show result modal
    document.getElementById('examScore').textContent = score;
    document.getElementById('examAccuracy').textContent = accuracy + '%';
    document.getElementById('examResultModal').classList.remove('hidden');

    // Add points
    currentUser.stats.points += score;
    saveCurrentUser(currentUser);
    updateStats();
}

function reviewExamWrong() {
    closeExamResult();
    switchMode('wrong');
}

function closeExamResult() {
    document.getElementById('examResultModal').classList.add('hidden');
}

// ==========================================
// Favorite Functions
// ==========================================

function toggleFavorite() {
    const pool = getQuestionPool();
    const question = pool[currentQuestionIndex];
    if (!question) return;

    const idx = currentUser.stats.favorites.indexOf(question.id);
    if (idx > -1) {
        currentUser.stats.favorites.splice(idx, 1);
        showToast('已取消收藏', 'info');
    } else {
        currentUser.stats.favorites.push(question.id);
        showToast('已收藏', 'success');
    }

    saveCurrentUser(currentUser);
    updateStats();
    updateBadges();

    // Update button
    const isFav = currentUser.stats.favorites.includes(question.id);
    document.getElementById('favBtn').innerHTML = isFav ?
        '<i class="fas fa-heart text-pink-500 text-lg"></i>' :
        '<i class="far fa-heart text-gray-400 text-lg"></i>';
}

// ==========================================
// Question Grid
// ==========================================

let gridPage = 0;
let gridMode = 'all'; // 'all', 'single', 'multi', 'judge'
const GRID_PAGE_SIZE = 50;

function getFilteredPool() {
    const pool = getQuestionPool();
    if (gridMode === 'all') return pool;
    return pool.filter(q => q.type === gridMode);
}

function renderQuestionGrid() {
    const pool = getFilteredPool();
    const grid = document.getElementById('questionGrid');

    const totalPages = Math.ceil(pool.length / GRID_PAGE_SIZE);
    const startIdx = gridPage * GRID_PAGE_SIZE;
    const endIdx = Math.min(startIdx + GRID_PAGE_SIZE, pool.length);

    // Add filter tabs
    let html = `
        <div class="col-span-full flex flex-wrap items-center gap-2 mb-4">
            <button onclick="setGridMode('all')" class="px-3 py-1 rounded-lg text-sm ${gridMode === 'all' ? 'bg-purple-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}">全部</button>
            <button onclick="setGridMode('single')" class="px-3 py-1 rounded-lg text-sm ${gridMode === 'single' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}">单选题</button>
            <button onclick="setGridMode('multi')" class="px-3 py-1 rounded-lg text-sm ${gridMode === 'multi' ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}">多选题</button>
            <button onclick="setGridMode('judge')" class="px-3 py-1 rounded-lg text-sm ${gridMode === 'judge' ? 'bg-teal-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}">判断题</button>
        </div>
        <div class="col-span-full flex items-center gap-3 mb-2 text-xs text-gray-500">
            <span class="flex items-center gap-1"><span class="w-3 h-3 bg-green-500 rounded"></span>答对</span>
            <span class="flex items-center gap-1"><span class="w-3 h-3 bg-red-500 rounded"></span>答错</span>
            <span class="flex items-center gap-1"><span class="w-3 h-3 bg-purple-500 rounded"></span>当前</span>
            <span class="flex items-center gap-1"><span class="w-3 h-3 bg-gray-300 rounded"></span>未答</span>
        </div>
    `;

    // Display questions with new sequential numbers
    for (let i = startIdx; i < endIdx; i++) {
        const q = pool[i];
        const answered = currentUser.stats.answeredQuestions[q.id];
        let bgColor = 'bg-gray-300 hover:bg-gray-400';

        if (answered) {
            bgColor = answered.correct ? 'bg-green-500' : 'bg-red-500';
        }

        if (i === currentQuestionIndex) {
            bgColor = 'bg-purple-500';
        }

        // Use sequential number (i+1) instead of original question id
        const displayNum = i + 1;
        html += `<button onclick="goToGridQuestion(${i})" class="${bgColor} text-white text-xs rounded-lg p-2 transition font-bold" title="第${displayNum}题 (原题${q.id})">${displayNum}</button>`;
    }

    // Add pagination controls
    if (totalPages > 1) {
        html += `<div class="col-span-full flex items-center justify-center space-x-2 mt-3">`;
        if (gridPage > 0) {
            html += `<button onclick="changeGridPage(-1)" class="bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-1 rounded text-sm">上一页</button>`;
        }
        html += `<span class="text-sm text-gray-500">第 ${gridPage + 1} 页 / 共 ${totalPages} 页 (${pool.length}题)</span>`;
        if (gridPage < totalPages - 1) {
            html += `<button onclick="changeGridPage(1)" class="bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-1 rounded text-sm">下一页</button>`;
        }
        html += `</div>`;
    }

    grid.innerHTML = html;
}

function setGridMode(mode) {
    gridMode = mode;
    gridPage = 0;
    renderQuestionGrid();
}

function changeGridPage(delta) {
    const pool = getFilteredPool();
    const totalPages = Math.ceil(pool.length / GRID_PAGE_SIZE);
    gridPage = Math.max(0, Math.min(totalPages - 1, gridPage + delta));
    renderQuestionGrid();
}

function goToGridQuestion(index) {
    currentQuestionIndex = index;
    // Update grid page if needed
    gridPage = Math.floor(index / GRID_PAGE_SIZE);
    loadQuestion();
    renderQuestionGrid();
}

function highlightGridQuestion(questionId) {
    // Already handled in renderQuestionGrid
}

// ==========================================
// Profile & Statistics
// ==========================================

function showProfile() {
    document.getElementById('profileModal').classList.remove('hidden');
    renderProfileStats();
    closeUserMenu();
}

function closeProfile() {
    document.getElementById('profileModal').classList.add('hidden');
}

function renderProfileStats() {
    const stats = currentUser.stats;
    const accuracy = stats.totalAnswered > 0 ? Math.round((stats.totalCorrect / stats.totalAnswered) * 100) : 0;

    document.getElementById('profileTotal').textContent = stats.totalAnswered;
    document.getElementById('profileAccuracy').textContent = accuracy + '%';
    document.getElementById('profileWrong').textContent = stats.wrongQuestions.length;
    document.getElementById('profileStreak').textContent = stats.streak;

    // Render daily chart
    renderDailyChart();

    // Render weak points
    renderWeakPoints();
}

function renderDailyChart() {
    const chart = document.getElementById('dailyChart');
    const dailyStats = currentUser.stats.dailyStats;

    // Get last 7 days
    const dates = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        dates.push(d.toISOString().split('T')[0]);
    }

    const maxAnswered = Math.max(...dates.map(d => (dailyStats[d]?.answered || 0)), 1);

    let html = '';
    dates.forEach(date => {
        const count = dailyStats[date]?.answered || 0;
        const height = Math.max(10, (count / maxAnswered) * 100);
        const dayName = new Date(date).toLocaleDateString('zh-CN', { weekday: 'short' });

        html += `
            <div class="flex flex-col items-center flex-1">
                <div class="text-xs text-gray-500 mb-1">${count}</div>
                <div class="w-full bg-gradient-to-t from-purple-500 to-indigo-500 rounded-t-lg chart-bar" style="height: ${height}%"></div>
                <div class="text-xs text-gray-500 mt-1">${dayName}</div>
            </div>
        `;
    });

    chart.innerHTML = html;
}

function renderWeakPoints() {
    const weakPoints = document.getElementById('weakPoints');
    const wrongQuestions = currentUser.stats.wrongQuestions;

    if (wrongQuestions.length === 0) {
        weakPoints.innerHTML = '<p class="text-gray-500 text-center">暂无错题数据</p>';
        return;
    }

    // Group by question number ranges
    const ranges = [
        { name: '心理学基础', start: 1, end: 50 },
        { name: '情绪与压力', start: 51, end: 100 },
        { name: '人际关系', start: 101, end: 150 },
        { name: '心理健康', start: 151, end: 200 },
        { name: '学习心理', start: 201, end: 250 },
        { name: '网络心理', start: 251, end: 300 },
        { name: '恋爱心理', start: 301, end: 350 },
        { name: '其他', start: 351, end: 1000 }
    ];

    let html = '';
    ranges.forEach(range => {
        const count = wrongQuestions.filter(id => id >= range.start && id <= range.end).length;
        if (count > 0) {
            const percentage = Math.round((count / wrongQuestions.length) * 100);
            html += `
                <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                        <p class="font-bold text-gray-700">${range.name}</p>
                        <p class="text-sm text-gray-500">${count} 道错题</p>
                    </div>
                    <div class="w-24 bg-gray-200 rounded-full h-2">
                        <div class="bg-red-500 h-2 rounded-full" style="width: ${percentage}%"></div>
                    </div>
                </div>
            `;
        }
    });

    weakPoints.innerHTML = html || '<p class="text-gray-500 text-center">暂无数据</p>';
}

// ==========================================
// Utility Functions
// ==========================================

function shuffleArray(array) {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
}

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.toggle('-translate-x-full');
}

function toggleUserMenu() {
    const menu = document.getElementById('userMenu');
    menu.classList.toggle('hidden');
}

function closeUserMenu() {
    document.getElementById('userMenu').classList.add('hidden');
}

function exportData() {
    const data = {
        user: currentUser.nickname,
        exportDate: new Date().toISOString(),
        stats: currentUser.stats,
        wrongQuestions: currentUser.stats.wrongQuestions.map(id => {
            const q = QUESTIONS.find(q => q.id === id);
            return q ? { id: q.id, question: q.question, answer: q.answer } : null;
        }).filter(Boolean)
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `心理学题库_${currentUser.nickname}_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);

    showToast('数据导出成功', 'success');
    closeUserMenu();
}

function resetProgress() {
    if (!confirm('确定要重置所有学习进度吗？此操作不可恢复！')) return;

    currentUser.stats = {
        totalAnswered: 0,
        totalCorrect: 0,
        totalWrong: 0,
        wrongQuestions: [],
        favorites: [],
        answeredQuestions: {},
        dailyStats: {},
        streak: 0,
        lastStudyDate: null,
        points: 0,
        examHistory: []
    };

    saveCurrentUser(currentUser);
    updateStats();
    updateBadges();
    loadQuestion();
    renderQuestionGrid();
    showToast('学习进度已重置', 'info');
}

// ==========================================
// Keyboard Shortcuts
// ==========================================

document.addEventListener('keydown', (e) => {
    if (document.getElementById('mainApp').style.display === 'none') return;

    switch(e.key) {
        case '1':
        case 'a':
        case 'A':
            if (!isAnswered) selectOption('A');
            break;
        case '2':
        case 'b':
        case 'B':
            if (!isAnswered) selectOption('B');
            break;
        case '3':
        case 'c':
        case 'C':
            if (!isAnswered) selectOption('C');
            break;
        case '4':
        case 'd':
        case 'D':
            if (!isAnswered) selectOption('D');
            break;
        case '5':
        case 'e':
        case 'E':
            if (!isAnswered) selectOption('E');
            break;
        case '6':
        case 'f':
        case 'F':
            if (!isAnswered) selectOption('F');
            break;
        case 'Enter':
            if (!isAnswered && selectedOption) {
                submitAnswer();
            } else if (isAnswered) {
                nextQuestion();
            }
            break;
        case 'ArrowLeft':
            prevQuestion();
            break;
        case 'ArrowRight':
            nextQuestion();
            break;
        case 'f':
        case 'F':
            toggleFavorite();
            break;
    }
});

// Close menus when clicking outside
document.addEventListener('click', (e) => {
    if (!e.target.closest('#userMenu') && !e.target.closest('[onclick="toggleUserMenu()"]')) {
        closeUserMenu();
    }
});

// ==========================================
// Data Export/Import Functions
// ==========================================

function exportAllData() {
    const users = getUsers();
    const data = {
        exportDate: new Date().toISOString(),
        version: '1.0',
        users: users
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `心理学题库_备份_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showMessage('数据导出成功！', 'success');
}

function importAllData(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            if (data.users) {
                saveUsers(data.users);
                showMessage('数据导入成功！请刷新页面后登录', 'success');
                setTimeout(() => location.reload(), 1500);
            } else {
                showMessage('无效的备份文件', 'error');
            }
        } catch (err) {
            showMessage('导入失败：文件格式错误', 'error');
        }
    };
    reader.readAsText(file);
}

// ==========================================
// Initialize App
// ==========================================

// Check for existing user on page load
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
});
