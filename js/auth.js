// ============================================================
// AUTH PAGES: LOGIN + SIGNUP
// Dùng chung cho login.html và signup.html
// Form nào tồn tại trên trang thì mới gắn listener.
// ============================================================

const $ = (sel) => document.querySelector(sel);

function showAuthPageMessage(text, isError = true) {
  const msg = $("#authMessage");
  msg.textContent = text;
  msg.classList.toggle("auth-message--error", isError);
  msg.classList.toggle("auth-message--success", !isError);
  msg.hidden = false;
}

async function handleLogin(e) {
  e.preventDefault();
  const email = $("#loginEmail").value.trim();
  const password = $("#loginPassword").value;
  const { error } = await signIn(email, password);
  if (error) {
    if (error.message && /not confirm/i.test(error.message)) {
      showAuthPageMessage("Hãy kiểm tra và xác nhận email (được Supabase gửi đến).");
      return;
    }
    showAuthPageMessage(`Đăng nhập thất bại: ${error.message}`);
    return;
  }
  window.location.href = "index.html";
}

async function handleSignup(e) {
  e.preventDefault();
  const email = $("#signupEmail").value.trim();
  const password = $("#signupPassword").value;
  const { data, error } = await signUp(email, password);
  if (error) {
    if (/already registered/i.test(error.message || "")) {
      showAuthPageMessage("Email này đã được đăng ký. Hãy đăng nhập.");
      return;
    }
    showAuthPageMessage(`Đăng ký thất bại: ${error.message}`);
    return;
  }

  // Supabase trả user "rỗng" (identities: []) khi email đã tồn tại (chống dò email)
  if (data?.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
    showAuthPageMessage("Email này đã được đăng ký. Hãy đăng nhập.");
    return;
  }

  showAuthPageMessage("Hãy kiểm tra và xác nhận email (được Supabase gửi đến).", false);
}

function initAuthPage() {
  const loginForm = $("#loginForm");
  if (loginForm) loginForm.addEventListener("submit", handleLogin);

  const signupForm = $("#signupForm");
  if (signupForm) signupForm.addEventListener("submit", handleSignup);
}

document.addEventListener("DOMContentLoaded", initAuthPage);