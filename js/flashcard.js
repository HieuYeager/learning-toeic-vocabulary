// ============================================================
// CHẾ ĐỘ FLASHCARD (Bước 4)
// ============================================================

const FlashcardMode = {
  currentIndex: 0,
  words: [],
  userId: null,
  isReviewMode: false,
  listenersBound: false,

  async start(words, isReviewMode) {
    this.words = [...(words || [])];
    this.currentIndex = 0;
    this.userId = null;
    this.isReviewMode = !!isReviewMode;

    document.getElementById("viewFlashcard").hidden = false;
    document.getElementById("viewHome").hidden = true;

    this.userId = (await getCurrentUser())?.id || null;

    if (!this.listenersBound) {
      this.bindListeners();
      this.listenersBound = true;
    }

    if (!this.words.length) {
      this.showDone();
      return;
    }

    document.getElementById("flashcard").hidden = false;
    document.getElementById("flashcardActions").hidden = false;
    document.getElementById("flashcardDone").hidden = true;
    this.render();
  },

  showDone() {
    document.getElementById("flashcard").hidden = true;
    document.getElementById("flashcardActions").hidden = true;
    document.getElementById("flashcardDone").hidden = false;
    document.getElementById("flashcardDone").textContent = this.isReviewMode
      ? "🎉 Không có từ đã học."
      : "🎉 Hoàn thành list này! Không còn từ chưa học.";
    document.getElementById("flashcardCounter").textContent = "0/0";
  },

  bindListeners() {
    document.getElementById("flashcard").addEventListener("click", () => {
      this.toggleFlip();
    });

    document.querySelectorAll("[data-prev]").forEach((btn) => {
      btn.addEventListener("click", () => this.prev());
    });
    document.querySelectorAll("[data-next]").forEach((btn) => {
      btn.addEventListener("click", () => this.next(false));
    });
    document.querySelectorAll("[data-know]").forEach((btn) => {
      btn.addEventListener("click", () => {
        this.markLearned(PROGRESS_STATUS.MASTERED);
        this.removeCurrentAndAdvance();
      });
    });
    document.querySelectorAll("[data-forgot]").forEach((btn) => {
      btn.addEventListener("click", () => {
        this.markLearned(PROGRESS_STATUS.LEARNING);
        this.removeCurrentAndAdvance();
      });
    });
    document.querySelectorAll("[data-relearn]").forEach((btn) => {
      btn.addEventListener("click", () => {
        this.relearn();
      });
    });
  },

  toggleFlip() {
    const card = document.getElementById("flashcard");
    card.classList.toggle("flipped");
  },

  unflip() {
    document.getElementById("flashcard").classList.remove("flipped");
  },

  render() {
    if (!this.words.length) return;
    this.unflip();

    const word = this.words[this.currentIndex];
    document.getElementById("cardWord").textContent = word.word;
    document.getElementById("cardPhonetic").textContent = word.phonetic || "";
    document.getElementById("cardPos").textContent = word.part_of_speech || "";
    document.getElementById("cardMeaning").textContent = word.vietnamese_meaning || "";

    const example = Array.isArray(word.examples) ? word.examples[0] : null;
    document.getElementById("cardExample").innerHTML = example
      ? highlightWord(example.sentence_en)
      : "";
    document.getElementById("cardExampleVi").textContent = example
      ? example.sentence_vi || ""
      : "";

    document.getElementById("flashcardCounter").textContent =
      `${this.currentIndex + 1}/${this.words.length}`;

    // Badge trạng thái từ (mới / đang học)
    const status =
      (appState.progressMap &&
        appState.progressMap[word.id] &&
        appState.progressMap[word.id].status) || PROGRESS_STATUS.NEW;
    const badge = document.getElementById("cardBadge");
    if (status === PROGRESS_STATUS.NEW) {
      badge.textContent = "🆕 Từ mới";
      badge.className = "card-badge card-badge--new";
      badge.hidden = false;
    } else if (status === PROGRESS_STATUS.LEARNING) {
      badge.textContent = "🔁 Đang học";
      badge.className = "card-badge card-badge--learning";
      badge.hidden = false;
    } else {
      badge.hidden = true;
    }

    // Toggle button visibility based on mode
    document.querySelectorAll("[data-know]").forEach((b) => (b.hidden = this.isReviewMode));
    document.querySelectorAll("[data-forgot]").forEach((b) => (b.hidden = this.isReviewMode));
    document.querySelectorAll("[data-relearn]").forEach((b) => (b.hidden = !this.isReviewMode));
  },

  prev() {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      this.render();
    }
  },

  next(auto) {
    if (this.currentIndex >= this.words.length - 1) {
      document.getElementById("flashcardDone").hidden = false;
      return;
    }
    if (auto) this.unflip();
    this.currentIndex++;
    this.render();
  },

  removeCurrentAndAdvance() {
    this.words.splice(this.currentIndex, 1);
    if (!this.words.length) {
      this.showDone();
      return;
    }
    if (this.currentIndex >= this.words.length) {
      this.currentIndex = this.words.length - 1;
    }
    this.render();
  },

  async markLearned(status) {
    if (!this.userId) return;
    const word = this.words[this.currentIndex];
    await upsertProgress(this.userId, word.id, { status });

    // Move word between arrays in appState to keep counts in sync
    if (status === PROGRESS_STATUS.MASTERED) {
      appState.unmasteredWords = appState.unmasteredWords.filter((w) => w.id !== word.id);
      appState.masteredWords.push(word);
    } else {
      appState.masteredWords = appState.masteredWords.filter((w) => w.id !== word.id);
      appState.unmasteredWords.push(word);
    }

    updateFilterUI();
  },

  async relearn() {
    if (!this.userId) return;
    const word = this.words[this.currentIndex];
    await upsertProgress(this.userId, word.id, { status: PROGRESS_STATUS.LEARNING });

    // Move word from masteredWords → unmasteredWords in appState
    appState.masteredWords = appState.masteredWords.filter((w) => w.id !== word.id);
    appState.unmasteredWords.push(word);

    updateFilterUI();
    this.removeCurrentAndAdvance();
  },
};

function highlightWord(sentence) {
  const escaped = escapeHtml(sentence || "");
  return escaped.replace(/\[([^\]]+)\]/g, "<strong>$1</strong>");
}

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}