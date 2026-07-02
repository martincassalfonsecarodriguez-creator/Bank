let dashboardState = { user: null, transactions: [], loans: [], notifications: [] };

function money(value) {
  return Number(value || 0).toLocaleString("es-UY");
}

function itemEmpty(text) {
  return `<p class="muted">${text}</p>`;
}

function getCreditCategory(score) {
  if (score < 500) return "Malo";
  if (score < 600) return "Regular";
  if (score < 700) return "Bueno";
  return "Excelente";
}

function renderDashboard() {
  const { user, transactions, loans, notifications } = dashboardState;
  document.querySelector("#user-name").textContent = user.name;
  document.querySelector("#balance").textContent = money(user.balance_corriente);
  document.querySelector("#balance-ahorro").textContent = money(user.balance_ahorro);
  document.querySelector("#account-number").textContent = user.account_number || "-";
  document.querySelector("#credit-score").textContent = user.credit_score || 500;
  document.querySelector("#credit-category").textContent = getCreditCategory(user.credit_score || 500);
  document.querySelector("#admin-link").classList.toggle("hidden", user.role !== "admin");

  document.querySelector("#notifications").innerHTML = notifications.length
    ? notifications.map((n) => `
      <article class="item">
        <header><strong>${n.title}</strong><span class="badge">${n.type}</span></header>
        <p>${n.message}</p>
        <small class="muted">${n.created_at}</small>
      </article>`).join("")
    : itemEmpty("Todavia no hay notificaciones.");

  document.querySelector("#transactions").innerHTML = transactions.length
    ? transactions.map((t) => `
      <article class="item">
        <header><strong>${t.type}</strong><span class="badge">${money(t.amount)}</span></header>
        <p>${t.description || "Operacion bancaria"}</p>
        <small class="muted">${t.created_at}</small>
      </article>`).join("")
    : itemEmpty("Todavia no hay movimientos.");

  document.querySelector("#loans").innerHTML = loans.length
    ? loans.map((loan) => `
      <article class="item">
        <header><strong>${money(loan.amount)}</strong><span class="badge">${loan.status}</span></header>
        <p>Interes: ${loan.interest_rate ?? "-"}%</p>
        ${loan.status === "pending_user" ? `
          <div class="item-actions">
            <button class="button small primary" data-loan="${loan.id}" data-accept="true">Aceptar</button>
            <button class="button small danger" data-loan="${loan.id}" data-accept="false">Rechazar</button>
          </div>` : ""}
      </article>`).join("")
    : itemEmpty("Todavia no solicitaste prestamos.");
}

async function loadDashboard() {
  dashboardState = await api("/api/user/dashboard");
  renderDashboard();
}

document.addEventListener("click", async (event) => {
  const loanButton = event.target.closest("[data-loan]");
  if (!loanButton) return;
  try {
    await api(`/api/loans/${loanButton.dataset.loan}/respond`, {
      method: "POST",
      body: JSON.stringify({ accept: loanButton.dataset.accept === "true" })
    });
    setMessage("Respuesta enviada.");
    await loadDashboard();
  } catch (error) {
    setMessage(error.message, "error");
  }
});

document.querySelector("#transfer-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    await api("/api/transactions/transfer", { method: "POST", body: JSON.stringify(formData(event.target)) });
    event.target.reset();
    setMessage("Transferencia realizada.");
    await loadDashboard();
  } catch (error) {
    setMessage(error.message, "error");
  }
});

document.querySelector("#internal-transfer-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    await api("/api/transactions/internal", { method: "POST", body: JSON.stringify(formData(event.target)) });
    event.target.reset();
    setMessage("Dinero movido con éxito.");
    await loadDashboard();
  } catch (error) {
    setMessage(error.message, "error");
  }
});

document.querySelector("#loan-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    await api("/api/loans", { method: "POST", body: JSON.stringify(formData(event.target)) });
    event.target.reset();
    setMessage("Solicitud enviada al banco.");
    await loadDashboard();
  } catch (error) {
    setMessage(error.message, "error");
  }
});

document.querySelector("#logout").addEventListener("click", logout);

document.querySelectorAll(".close-modal").forEach(btn => {
  btn.addEventListener("click", () => {
    document.getElementById(btn.dataset.modal).close();
  });
});

document.querySelector("#ranking-btn").addEventListener("click", async () => {
  try {
    const { ranking } = await api("/api/user/ranking");
    document.querySelector("#ranking-body").innerHTML = ranking.map((u, i) => `
      <tr>
        <td>${i + 1}</td>
        <td>${u.name}</td>
        <td>${u.account_number}</td>
        <td>${money(u.patrimonio)}</td>
      </tr>
    `).join("");
    document.getElementById("rankingModal").showModal();
  } catch (error) {
    setMessage(error.message, "error");
  }
});

document.querySelector("#view-credit-history").addEventListener("click", async () => {
  try {
    const { history } = await api("/api/user/credit-score/history");
    document.querySelector("#credit-history-list").innerHTML = history.length ? history.map(h => `
      <article class="item">
        <header><strong>${h.old_score} &rarr; ${h.new_score}</strong></header>
        <p>${h.reason}</p>
        <small class="muted">${h.created_at}</small>
      </article>
    `).join("") : itemEmpty("No hay historial.");
    document.getElementById("creditHistoryModal").showModal();
  } catch (error) {
    setMessage(error.message, "error");
  }
});

(async function init() {
  const user = await requireSession();
  if (!user) return;
  connectSocket(async () => {
    await loadDashboard();
    setMessage("Tienes una nueva notificacion.");
  });
  await loadDashboard();
})();
