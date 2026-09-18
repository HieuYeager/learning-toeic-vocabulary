// ============================================================
// QUẢN LÝ TIẾN TRÌNH HỌC (Bước 6 sẽ hoàn thiện)
// ============================================================

const PROGRESS_STATUS = { NEW: "new", LEARNING: "learning", MASTERED: "mastered" };

const QUIZ_MIN_WORDS = 10;

async function getMyProgress() {
  const user = await getCurrentUser();
  if (!user) return {};
  const { data, error } = await supabaseClient
    .from("user_progress")
    .select("word_id, status, correct_count");
  if (error) {
    console.error("[progress] Lỗi lấy tiến trình:", error.message);
    return {};
  }
  const map = {};
  (data || []).forEach((p) => {
    map[p.word_id] = { status: p.status, correctCount: p.correct_count };
  });
  return map;
}

// Đếm từ theo trạng thái trong một list (mastered + learning)
function countWordsByStatus(progressMap, wordToList, listId) {
  let mastered = 0;
  let learning = 0;
  Object.entries(progressMap).forEach(([wordId, p]) => {
    if (Number(wordToList[Number(wordId)]) !== Number(listId)) return;
    if (p.status === PROGRESS_STATUS.MASTERED) mastered++;
    else if (p.status === PROGRESS_STATUS.LEARNING) learning++;
  });
  return { mastered, learning };
}

async function upsertProgress(userId, wordId, { status, correctCount, lastReviewed }) {
  const now = lastReviewed || new Date().toISOString();
  const payload = {
    user_id: userId,
    word_id: wordId,
    status: status || PROGRESS_STATUS.LEARNING,
    correct_count: correctCount || 0,
    last_reviewed: now,
  };
  const { error } = await supabaseClient
    .from("user_progress")
    .upsert(payload, { onConflict: "user_id,word_id" });
  if (error) console.error("[progress] Lỗi lưu tiến trình:", error.message);
  return { error };
}