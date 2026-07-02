let adminState = { users: [], transactions: [], loans: [] };

function money(value) {
  return Number(value || 0).toLocaleString("es-UY");
}

function renderAdmin() {
  if (adminState.stats) {
    document.querySelector("#stat-corriente").textContent = money(adminState.stats.totalCorriente);
    document.querySelector("#stat-ahorro").textContent = money(adminState.stats.totalAhorro);
    document.querySelector("#stat-prestamos").textContent = money(adminState.stats.totalPrestamosAprobados);
  }

  document.querySelector("#users").innerHTML = adminState.users.map((user) => `
    <article class="item">
      <header><strong>${user.name}</strong><span class="badge">${user.role}</span></header>
      <p>CI ${user.ci} · Cte ${money(user.balance_corriente)} · Aho ${money(user.balance_ahorro)} · Puntaje ${user.credit_score || 500}</p>
      <form class="form compact" data-edit-user="${user.id}">
        <input name="name" value="${user.name}" required>
        <input name="ci" value="${user.ci}" required>
        <select name="role">
          <option value="user" ${user.role === "user" ? "selected" : ""}>Usuario</option>
          <option value="admin" ${user.role === "admin" ? "selected" : ""}>Administrador</option>
        </select>
        <button class="button small secondary">Guardar</button>
      </form>
      <form class="form inline" data-balance-user="${user.id}">
        <label>Monto<input name="amount" type="number" min="1" step="1" required></label>
        <select name="operation">
          <option value="add">Agregar Cte</option>
          <option value="remove">Quitar Cte</option>
        </select>
        <button class="button small primary">Aplicar</button>
      </form>
      <form class="form inline" data-score-user="${user.id}">
        <label>Puntaje (200-800)<input name="score" type="number" min="200" max="800" value="${user.credit_score || 500}" required></label>
        <label>Razón<input name="reason" type="text" placeholder="Ej: Pago a tiempo" required></label>
        <button class="button small secondary">Act. Puntaje</button>
      </form>
      <form class="form inline" data-message-user="${user.id}">
        <label>Mensaje<input name="message" required></label>
        <button class="button small secondary">Enviar</button>
      </form>
      <div class="item-actions">
        <button class="button small danger" data-delete-user="${user.id}">Eliminar</button>
      </div>
    </article>`).join("");

  document.querySelector("#loans").innerHTML = adminState.loans.length
    ? adminState.loans.map((loan) => `
      <article class="item">
        <header><strong>${loan.user_name}</strong><span class="badge">${loan.status}</span></header>
        <p>Monto ${money(loan.amount)} · Interes ${loan.interest_rate ?? "-"}%</p>
        ${loan.status === "pending_admin" ? `
          <form class="form inline" data-loan-decision="${loan.id}">
            <label>Interes %<input name="interestRate" type="number" min="0" step="0.01" value="0"></label>
            <button class="button small primary" name="approve" value="true">Aprobar</button>
            <button class="button small danger" name="approve" value="false">Rechazar</button>
          </form>` : ""}
      </article>`).join("")
    : `<p class="muted">No hay prestamos.</p>`;

  document.querySelector("#transactions").innerHTML = `
    <table>
      <thead><tr><th>Fecha</th><th>Tipo</th><th>Monto</th><th>Origen</th><th>Destino</th><th>Detalle</th></tr></thead>
      <tbody>
        ${adminState.transactions.map((t) => `
          <tr>
            <td>${t.created_at}</td>
            <td>${t.type}</td>
            <td>${money(t.amount)}</td>
            <td>${t.from_user_name || "-"}</td>
            <td>${t.to_user_name || "-"}</td>
            <td>${t.description || ""}</td>
          </tr>`).join("")}
      </tbody>
    </table>`;
}

async function loadAdmin() {
  adminState = await api("/api/admin/overview");
  renderAdmin();
}

document.addEventListener("submit", async (event) => {
  const editForm = event.target.closest("[data-edit-user]");
  const balanceForm = event.target.closest("[data-balance-user]");
  const scoreForm = event.target.closest("[data-score-user]");
  const messageForm = event.target.closest("[data-message-user]");
  const loanForm = event.target.closest("[data-loan-decision]");
  if (!editForm && !balanceForm && !scoreForm && !messageForm && !loanForm) return;

  event.preventDefault();
  try {
    if (editForm) {
      await api(`/api/admin/users/${editForm.dataset.editUser}`, { method: "PUT", body: JSON.stringify(formData(editForm)) });
      setMessage("Usuario actualizado.");
    }
    if (balanceForm) {
      await api(`/api/admin/users/${balanceForm.dataset.balanceUser}/balance`, { method: "POST", body: JSON.stringify(formData(balanceForm)) });
      setMessage("Saldo actualizado.");
    }
    if (scoreForm) {
      await api(`/api/admin/users/${scoreForm.dataset.scoreUser}/credit-score`, { method: "POST", body: JSON.stringify(formData(scoreForm)) });
      setMessage("Puntaje actualizado.");
    }
    if (messageForm) {
      await api(`/api/admin/users/${messageForm.dataset.messageUser}/notification`, { method: "POST", body: JSON.stringify(formData(messageForm)) });
      messageForm.reset();
      setMessage("Notificacion enviada.");
    }
    if (loanForm) {
      const submitter = event.submitter;
      await api(`/api/admin/loans/${loanForm.dataset.loanDecision}/decision`, {
        method: "POST",
        body: JSON.stringify({ ...formData(loanForm), approve: submitter.value === "true" })
      });
      setMessage("Prestamo revisado.");
    }
    await loadAdmin();
  } catch (error) {
    setMessage(error.message, "error");
  }
});

document.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-delete-user]");
  if (!button) return;
  if (!confirm("Eliminar este usuario?")) return;
  try {
    await api(`/api/admin/users/${button.dataset.deleteUser}`, { method: "DELETE" });
    setMessage("Usuario eliminado.");
    await loadAdmin();
  } catch (error) {
    setMessage(error.message, "error");
  }
});

document.querySelector("#announcement-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    await api("/api/admin/announcements", { method: "POST", body: JSON.stringify(formData(event.target)) });
    event.target.reset();
    setMessage("Anuncio global enviado.");
  } catch (error) {
    setMessage(error.message, "error");
  }
});

document.querySelector("#run-taxes-btn").addEventListener("click", async () => {
  if (!confirm("¿Seguro que deseas cobrar el 2% de impuestos a todos los usuarios? Esta acción no se puede deshacer.")) return;
  try {
    await api("/api/admin/taxes/run", { method: "POST" });
    setMessage("Impuestos cobrados exitosamente.");
    await loadAdmin();
  } catch (error) {
    setMessage(error.message, "error");
  }
});

document.querySelector("#logout").addEventListener("click", logout);

(async function init() {
  const user = await requireSession("admin");
  if (!user) return;
  connectSocket(async () => {
    await loadAdmin();
    setMessage("Actividad nueva en el banco.");
  });
  await loadAdmin();
})();
