// ============================================================
// CẤU HÌNH SUPABASE
// ĐIỀN 2 GIÁ TRỊ BÊN DƯỚI (từ Supabase Dashboard → Connect):
//   1. SUPABASE_URL  = Project URL   (vd: https://abc123.supabase.co)
//   2. SUPABASE_ANON_KEY = Anon Key  (vd: eyJhbGciOiJ...)
// KHÔNG dùng Service Role Key.
// ============================================================
const SUPABASE_URL = "https://nofwglfkcwdjnzbinsxz.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vZndnbGZrY3dkam56Ymluc3h6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk1NDIwNjUsImV4cCI6MjEwNTExODA2NX0.d9-wk2AfO5yrAxlGDQlEbi6anyxCS0hZr6nLE1jsB_8";

if (SUPABASE_URL.includes("YOUR-PROJECT") || SUPABASE_ANON_KEY.includes("YOUR-ANON-KEY")) {
  console.warn("[supabase.js] Chưa điền Project URL / Anon Key.");
}

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ---------- AUTH ----------

async function signUp(email, password) {
  const { data, error } = await supabaseClient.auth.signUp({ email, password });
  return { data, error };
}

async function signIn(email, password) {
  const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
  return { data, error };
}

async function signOut() {
  const { error } = await supabaseClient.auth.signOut();
  return { error };
}

async function getCurrentUser() {
  const { data } = await supabaseClient.auth.getUser();
  return data.user;
}

function onAuthStateChange(callback) {
  return supabaseClient.auth.onAuthStateChange((_event, session) => {
    callback(session ? session.user : null);
  });
}

// ---------- API WORD DATA ----------

async function fetchLists() {
  const { data, error } = await supabaseClient
    .from("lists")
    .select("id, name, url_list")
    .order("id");
  return { data, error };
}

async function fetchWordCountByLists() {
  const counts = {};
  const wordToList = {};
  const pageSize = 1000;
  let from = 0;

  while (true) {
    const { data, error } = await supabaseClient
      .from("words")
      .select("list_id, id")
      .range(from, from + pageSize - 1);
    if (error) return { counts, wordToList, error };
    (data || []).forEach((w) => {
      counts[w.list_id] = (counts[w.list_id] || 0) + 1;
      wordToList[w.id] = w.list_id;
    });
    if (!data || data.length < pageSize) break;
    from += pageSize;
  }

  return { counts, wordToList, error: null };
}

async function fetchWordsByList(listId) {
  const { data, error } = await supabaseClient
    .from("words")
    .select("id, word, phonetic, part_of_speech, vietnamese_meaning, list_id")
    .eq("list_id", listId)
    .order("id");
  return { data, error };
}

async function fetchExamplesByWords(wordIds) {
  const { data, error } = await supabaseClient
    .from("examples")
    .select("word_id, sentence_en, sentence_vi, highlighted_word")
    .in("word_id", wordIds)
    .order("sort_order");
  const map = {};
  (data || []).forEach((e) => {
    if (!map[e.word_id]) map[e.word_id] = [];
    map[e.word_id].push(e);
  });
  return { map, error };
}