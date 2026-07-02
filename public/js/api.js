async function api(path, options = {}) {
  const response = await fetch(path, {
    credentials: "same-origin",
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "No se pudo completar la accion.");
  return data;
}

function formData(form) {
  return Object.fromEntries(new FormData(form).entries());
}

function setMessage(text, type = "ok") {
  const element = document.querySelector("#message");
  if (!element) return;
  element.textContent = text;
  element.className = `message ${type}`;
}

async function requireSession(role) {
  const { user } = await api("/api/auth/session");
  if (!user) {
    location.href = "/login.html";
    return null;
  }
  if (role && user.role !== role) {
    location.href = "/dashboard.html";
    return null;
  }
  return user;
}

async function logout() {
  await api("/api/auth/logout", { method: "POST" });
  location.href = "/login.html";
}
