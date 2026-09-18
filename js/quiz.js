// ============================================================
// CHẾ ĐỘ QUIZ (Bước 5)
// ============================================================

const QuizMode = {
  questions: [],
  currentIndex: 0,
  score: 0,
  wrongWords: [],
  userId: null,
  answered: false,
  listenersBound: false,

  async start(words) {
    this.userId = (await getCurrentUser())?.id || null;
    this.currentIndex = 0;
    this.score = 0;
    this.wrongWords = [];

    document.getElementById("viewQuiz").hidden = false;
    document.getElementById("viewHome").hidden = true;

    if (!words || !words.length) {
      this.showDone(
        "📖 Chưa có từ nào được học trong list này. Hãy học flashcard ('Đã nhớ' / 'Chưa nhớ') trước nhé!"
      );
      return;
    }

    if (words.length < QUIZ_MIN_WORDS) {
      this.showDone(
        `📖 Cần ít nhất ${QUIZ_MIN_WORDS} từ đã học (đã nhớ/chưa nhớ) để làm quiz. ` +
          `Hiện có ${words.length} từ. Hãy học thêm flashcard nhé!`,
        `0/${QUIZ_MIN_WORDS}`
      );
      return;
    }

    if (!this.listenersBound) {
      this.bindListeners();
      this.listenersBound = true;
    }

    this.buildQuestions(words);
    document.querySelector("#viewQuiz .quiz-container").hidden = false;
    document.getElementById("quizDone").hidden = true;
    this.render();
  },

  showDone(text, scoreText = "0/0") {
    document.querySelector("#viewQuiz .quiz-container").hidden = true;
    document.getElementById("quizDone").hidden = false;
    document.getElementById("quizDone").textContent = text;
    document.getElementById("quizScore").textContent = scoreText;
  },

  shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  },

  buildQuestions(words) {
    const pool =
      appState.allWords && appState.allWords.length ? appState.allWords : words;
    const selected = this.shuffle(words).slice(0, QUIZ_MIN_WORDS);

    this.questions = selected.map((word) => {
      const isENtoVI = Math.random() < 0.5;
      const key = isENtoVI ? "vietnamese_meaning" : "word";
      const correct = (word[key] || "").trim();
      const seen = new Set([correct]);
      const distractors = [];

      for (const w of this.shuffle(pool)) {
        if (distractors.length >= 3) break;
        if (w.id === word.id) continue;
        const text = (w[key] || "").trim();
        if (!text || seen.has(text)) continue;
        seen.add(text);
        distractors.push({ text, word: w });
      }

      return {
        word,
        isENtoVI,
        correct,
        options: this.shuffle([{ text: correct, word }, ...distractors]),
      };
    });
  },

  bindListeners() {
    document.getElementById("quizNext").addEventListener("click", () => {
      if (this.answered) this.goNext();
    });
  },

  render() {
    const q = this.questions[this.currentIndex];
    if (!q) return;
    this.answered = false;

    document.getElementById("quizQuestion").textContent = q.isENtoVI
      ? `Nghĩa của từ "${q.word.word}" là gì?`
      : `Từ tiếng Anh nào có nghĩa "${q.word.vietnamese_meaning}"?`;

    document.getElementById("quizScore").textContent =
      `Score: ${this.score}/${this.questions.length}`;

    const listEl = document.getElementById("quizOptions");
    listEl.innerHTML = "";
    q.options.forEach((option, i) => {
      const btn = document.createElement("button");
      btn.className = "quiz-option";
      btn.textContent = `${String.fromCharCode(65 + i)}. ${option.text}`;
      btn.addEventListener("click", () => this.selectAnswer(btn, option));
      listEl.appendChild(btn);
    });

    const fb = document.getElementById("quizFeedback");
    fb.textContent = "";
    fb.className = "quiz-feedback";
    document.getElementById("quizNext").hidden = true;
  },

  async selectAnswer(btn, option) {
    if (this.answered) return;
    this.answered = true;

    const q = this.questions[this.currentIndex];
    const isCorrect = option.text === q.correct;

    document.querySelectorAll("#quizOptions .quiz-option").forEach((b, i) => {
      b.disabled = true;
      if (q.options[i].text === q.correct) b.classList.add("correct");
    });
    if (!isCorrect) btn.classList.add("wrong");

    const fb = document.getElementById("quizFeedback");
    if (isCorrect) {
      this.score++;
      fb.classList.add("quiz-feedback-correct");
      fb.textContent = "✅ Đúng!";
    } else {
      this.wrongWords.push(q.word);
      fb.classList.add("quiz-feedback-wrong");
      fb.textContent = `❌ Sai. Đáp án đúng là: "${q.correct}".`;
    }

    this.showAnswerKey(fb, q);
    document.getElementById("quizNext").hidden = false;
    await this.recordAnswer(q.word, isCorrect);
  },

  showAnswerKey(fb, q) {
    const box = document.createElement("div");
    box.className = "quiz-answer-key";

    const title = document.createElement("div");
    title.className = "quiz-answer-key-title";
    title.textContent = "Đáp án:";
    box.appendChild(title);

    q.options.forEach((opt, i) => {
      const missing = q.isENtoVI ? opt.word.word : opt.word.vietnamese_meaning;
      const row = document.createElement("div");
      row.className = "quiz-answer-key-row";
      if (opt.text === q.correct) row.classList.add("correct");
      row.textContent = `${String.fromCharCode(65 + i)}. ${opt.text} — ${missing}`;
      box.appendChild(row);
    });

    fb.appendChild(box);
  },

  goNext() {
    this.currentIndex++;
    if (this.currentIndex >= this.questions.length) {
      this.finish();
      return;
    }
    this.render();
  },

  finish() {
    const total = this.questions.length;
    let text = `🎉 Hoàn thành! Score: ${this.score}/${total}.`;
    if (this.wrongWords.length) {
      text += ` Từ cần ôn lại (${this.wrongWords.length}): ${this.wrongWords
        .map((w) => w.word)
        .join(", ")}.`;
    }
    this.showDone(text, `Score: ${this.score}/${total}`);
  },

  async recordAnswer(word, correct) {
    if (!this.userId) return;

    const prev = (appState.progressMap && appState.progressMap[word.id]) || {
      status: null,
      correctCount: 0,
    };
    let status = prev.status || PROGRESS_STATUS.LEARNING;
    let correctCount = prev.correctCount || 0;

    if (correct) {
      correctCount += 1;
      status = PROGRESS_STATUS.MASTERED;
    } else if (status === PROGRESS_STATUS.MASTERED) {
      status = PROGRESS_STATUS.LEARNING;
    }

    await upsertProgress(this.userId, word.id, { status, correctCount });

    appState.unmasteredWords = appState.unmasteredWords.filter((w) => w.id !== word.id);
    appState.masteredWords = appState.masteredWords.filter((w) => w.id !== word.id);
    if (status === PROGRESS_STATUS.MASTERED) {
      appState.masteredWords.push(word);
    } else {
      appState.unmasteredWords.push(word);
    }

    updateFilterUI();
  },
};