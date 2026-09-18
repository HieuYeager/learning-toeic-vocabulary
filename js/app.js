// ============================================================
// LOGIC CHÍNH: AUTH STATE + CHUYỂN VIEW
// ============================================================

const $ = (sel) => document.querySelector(sel);

const appState = {
  user: null,
  currentMode: null,
  showMastered: false,
  allWords: [],
  masteredWords: [],
  unmasteredWords: [],
  progressMap: {},
};

function showView(name) {
  ["viewHome", "viewFlashcard", "viewQuiz"].forEach((id) => {
    document.getElementById(id).hidden = id !== `view${name}`;
  });
}

function renderAuthUI(user) {
  appState.user = user;
  const loggedIn = !!user;
  $("#userInfo").hidden = !loggedIn;
  $("#authForms").hidden = loggedIn;
  if (loggedIn) $("#userEmail").textContent = user.email;

  if (!user) {
    showView("Home");
    const msg = $("#authMessage");
    if (msg.textContent) {
      msg.hidden = false;
    }
  }
}

function showAuthMessage(text, isError = true) {
  const msg = $("#authMessage");
  msg.textContent = text;
  msg.classList.toggle("auth-message--error", isError);
  msg.classList.toggle("auth-message--success", !isError);
  msg.hidden = false;
}

async function handleLogout() {
  const { error } = await signOut();
  if (error) {
    showAuthMessage(`Đăng xuất thất bại: ${error.message}`);
    return;
  }
  showAuthMessage("Đã đăng xuất.", false);
  showView("Home");
  loadLists();
}

// ---- Trang chủ: danh sách lists + tiến trình (Bước 3) ----
async function loadLists() {
  const grid = $("#listGrid");
  grid.innerHTML = '<p class="loading">Đang tải danh sách...</p>';

  const { data: lists, error } = await fetchLists();
  if (error) {
    grid.innerHTML = `<p class="error">Lỗi tải danh sách: ${error.message}</p>`;
    return;
  }

  const { counts, wordToList } = await fetchWordCountByLists();
  const progressMap = await getMyProgress();

  const totalWords = Object.values(counts).reduce((a, b) => a + b, 0);
  const totalLearned = Object.values(progressMap).filter(
    (p) => p.status === "mastered"
  ).length;
  $("#progressTotal").textContent = `Đã học ${totalLearned}/${totalWords} từ`;

  grid.innerHTML = "";
  (lists || []).forEach((list) => {
    const total = counts[list.id] || 0;
    const { mastered, learning } = countWordsByStatus(progressMap, wordToList, list.id);
    const masteredPct = total ? Math.round((mastered / total) * 100) : 0;
    const learningPct = total ? Math.round((learning / total) * 100) : 0;
    const canQuiz = mastered + learning >= QUIZ_MIN_WORDS;

    const card = document.createElement("div");
    card.className = "list-card";
    card._listId = list.id;
    card.innerHTML = `
      <div class="list-card-name">${list.name}</div>
      <div class="list-card-count">${mastered}/${total} từ · Đang học: ${learning}</div>
      <div class="progress-bar"><div class="progress-fill" style="width:${masteredPct}%"></div></div>
      <div class="progress-bar progress-bar--learning"><div class="progress-fill progress-fill--learning" style="width:${learningPct}%"></div></div>
      <div class="list-card-actions">
        <button class="btn btn-primary btn-sm" data-start="flashcard">📝 Flashcard</button>
        <button class="btn btn-outline btn-sm" data-start="quiz"${canQuiz ? "" : ' disabled title="Cần học ít nhất 10 từ để làm quiz"'}>❓ Quiz</button>
      </div>`;
    grid.appendChild(card);
  });

  grid.querySelectorAll("[data-start]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const listId = btn.closest(".list-card")._listId;
      const mode = btn.dataset.start;
      startMode(listId, mode);
    });
  });
}

async function startMode(listId, mode) {
  const { data: words, error } = await fetchWordsByList(listId);
  if (error || !words.length) return;

  const ids = words.map((w) => w.id);
  const { map: examples } = await fetchExamplesByWords(ids);
  words.forEach((w) => (w.examples = examples[w.id] || []));

  const progressMap = await getMyProgress();
  appState.currentMode = mode;
  appState.showMastered = false;
  appState.progressMap = progressMap;
  appState.allWords = words;
  appState.unmasteredWords = words.filter(
    (w) => !progressMap[w.id] || progressMap[w.id].status !== "mastered"
  );
  appState.masteredWords = words.filter(
    (w) => progressMap[w.id] && progressMap[w.id].status === "mastered"
  );

  if (!appState.user) {
    showAuthMessage("Vui lòng đăng nhập để lưu tiến trình.");
    document.getElementById("authMessage").scrollIntoView({ behavior: "smooth" });
  }

  updateFilterUI();
  startCurrentMode();
}

function startCurrentMode() {
  if (appState.currentMode === "flashcard") {
    const words = appState.showMastered
      ? appState.masteredWords
      : appState.unmasteredWords;
    FlashcardMode.start(words, appState.showMastered);
    return;
  }

  // Quiz: chỉ quiz các từ đã học (mastered/learning), không dùng nút toggle
  const quizWords = appState.allWords.filter(
    (w) => appState.progressMap[w.id] &&
      appState.progressMap[w.id].status !== PROGRESS_STATUS.NEW
  );
  QuizMode.start(quizWords);
}

function toggleListFilter() {
  appState.showMastered = !appState.showMastered;
  updateFilterUI();
  startCurrentMode();
}

function updateFilterUI() {
  const btns = document.querySelectorAll(".btn-filter");
  const unmasteredCount = appState.unmasteredWords.length;
  const masteredCount = appState.masteredWords.length;

  btns.forEach((btn) => {
    btn.hidden = false;
    if (appState.showMastered) {
      btn.textContent = `📖 Học từ chưa nhớ (${unmasteredCount})`;
    } else {
      btn.textContent = `📖 Xem lại từ đã nhớ (${masteredCount})`;
    }
  });
}

// ---- Khởi tạo ----
function init() {
  $("#btnLogout").addEventListener("click", handleLogout);
  document.querySelectorAll(".btn-filter").forEach((btn) => {
    btn.addEventListener("click", toggleListFilter);
  });
  document.querySelectorAll("[data-back]").forEach((btn) => {
    btn.addEventListener("click", () => {
      showView("Home");
      loadLists();
    });
  });

  onAuthStateChange((user) => renderAuthUI(user));

  getCurrentUser().then((user) => {
    renderAuthUI(user);
    loadLists();
  });
}

document.addEventListener("DOMContentLoaded", init);