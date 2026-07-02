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

  try {
    const terms = await api("/api/auth/terms");
    if (terms && (user.accepted_terms_version || 0) < terms.version) {
      showTermsModal(terms);
      return null;
    }
  } catch (e) {
    console.error("Error checking terms", e);
  }

  if (role && user.role !== role) {
    location.href = "/dashboard.html";
    return null;
  }
  return user;
}

function showTermsModal(terms) {
  const dialog = document.createElement("dialog");
  dialog.className = "modal";
  dialog.innerHTML = `
    <div class="modal-content">
      <h2>Nuevos Términos y Condiciones</h2>
      <p class="muted">Debes aceptar los nuevos términos para continuar usando Banco Familiar.</p>
      <div class="terms-text" style="white-space: pre-wrap; font-size: 0.9em; max-height: 50vh; overflow-y: auto; text-align: left; padding: 10px; border: 1px solid #ccc; margin-bottom: 15px;">${terms.content}</div>
      <div style="display: flex; gap: 10px; justify-content: flex-end;">
        <button id="rejectTermsBtn" class="button secondary">Rechazar y Salir</button>
        <button id="acceptTermsBtn" class="button primary">Aceptar Términos</button>
      </div>
    </div>
  `;
  document.body.appendChild(dialog);
  dialog.showModal();

  dialog.querySelector("#rejectTermsBtn").onclick = logout;
  dialog.querySelector("#acceptTermsBtn").onclick = async () => {
    try {
      await api("/api/auth/terms/accept", { method: "POST", body: JSON.stringify({ version: terms.version }) });
      dialog.close();
      location.reload();
    } catch (error) {
      alert("Error al aceptar términos.");
    }
  };
}

async function logout() {
  await api("/api/auth/logout", { method: "POST" });
  location.href = "/login.html";
}
