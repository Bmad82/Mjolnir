let _models = [];
let _refreshTimer = null;

// ─── API ───────────────────────────────────────────────────
async function apiFetch(path, options = {}) {
  const res = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.detail || `HTTP ${res.status}`);
  return data;
}

// ─── Health ────────────────────────────────────────────────
async function checkHealth() {
  const dot = document.getElementById("status-dot");
  try {
    await apiFetch("/api/health");
    dot.className = "status-dot online";
    dot.title = "Backend erreichbar";
  } catch {
    dot.className = "status-dot offline";
    dot.title = "Backend nicht erreichbar";
  }
}

// ─── Models dropdown ──────────────────────────────────────
async function loadModels() {
  try {
    _models = await apiFetch("/api/models");
    const sel = document.getElementById("model-select");
    sel.innerHTML = _models
      .map((m, i) => `<option value="${i}">${escHtml(m.label)}</option>`)
      .join("");
  } catch (err) {
    showError("Modelle konnten nicht geladen werden: " + err.message);
  }
}

// ─── Projects dropdown ────────────────────────────────────
async function loadProjects() {
  try {
    const projects = await apiFetch("/api/projects");
    const sel = document.getElementById("project-select");
    const existing = sel.innerHTML;
    sel.innerHTML =
      existing +
      projects
        .map(
          (p) =>
            `<option value="${escAttr(p.path)}">${escHtml(p.name)}</option>`
        )
        .join("");
  } catch {
    // non-fatal — user can proceed without project list
  }
}

// ─── Session name suggestion ──────────────────────────────
function suggestSessionName() {
  const project = document.getElementById("project-select").value;
  const input = document.getElementById("session-name-input");
  if (input.dataset.userEdited) return;
  if (project) {
    const base = project.split(/[\\/]/).pop().toLowerCase().replace(/[^a-z0-9]/g, "-");
    input.value = base + "-" + Date.now().toString(36).slice(-4);
  } else {
    input.value = "session-" + Date.now().toString(36).slice(-4);
  }
}

// ─── Bypass toggle warning ────────────────────────────────
function onBypassToggle() {
  const checked = document.getElementById("bypass-toggle").checked;
  document.getElementById("bypass-warning").classList.toggle("active", checked);
}

// ─── Launch ───────────────────────────────────────────────
async function launchSession() {
  const name = document.getElementById("session-name-input").value.trim();
  const projectPath = document.getElementById("project-select").value;
  const modelIdx = parseInt(document.getElementById("model-select").value, 10);
  const bypass = document.getElementById("bypass-toggle").checked;

  const errEl = document.getElementById("launch-error");
  errEl.classList.remove("active");

  if (!name) {
    errEl.textContent = "Bitte einen Session-Namen eingeben.";
    errEl.classList.add("active");
    document.getElementById("session-name-input").focus();
    return;
  }

  const model = _models[modelIdx] || _models[0];
  const btn = document.getElementById("launch-btn");
  btn.disabled = true;
  btn.textContent = "Starte…";

  try {
    await apiFetch("/api/sessions", {
      method: "POST",
      body: JSON.stringify({
        name,
        project_path: projectPath,
        model_id: model.id,
        model_label: model.label,
        bypass_permissions: bypass,
      }),
    });
    // Reset form
    document.getElementById("session-name-input").value = "";
    document.getElementById("session-name-input").dataset.userEdited = "";
    document.getElementById("bypass-toggle").checked = false;
    document.getElementById("bypass-warning").classList.remove("active");
    showInfo(`Session "${name}" gestartet.`);
    await loadSessions();
  } catch (err) {
    errEl.textContent = err.message;
    errEl.classList.add("active");
  } finally {
    btn.disabled = false;
    btn.textContent = "⚡ Session starten";
  }
}

// ─── Sessions list ────────────────────────────────────────
async function loadSessions() {
  try {
    const sessions = await apiFetch("/api/sessions");
    renderSessions(sessions);
  } catch (err) {
    showError("Sessions konnten nicht geladen werden: " + err.message);
  }
}

function renderSessions(sessions) {
  const container = document.getElementById("sessions-container");
  if (sessions.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <span class="big">⚒</span>
        Keine aktiven Sessions.<br>Starte eine neue Session oben.
      </div>`;
    return;
  }

  container.innerHTML = sessions
    .map((s) => {
      const badge = s.attached
        ? `<span class="session-badge badge-attached">angehängt</span>`
        : `<span class="session-badge badge-idle">idle</span>`;
      const project = s.project_path
        ? `<span>📁 ${escHtml(s.project_path.split(/[\\/]/).pop())}</span>`
        : "";
      const model = s.model
        ? `<span>🤖 ${escHtml(s.model)}</span>`
        : "";
      const created = `<span>🕐 ${escHtml(s.created)}</span>`;

      return `
      <div class="session-card ${s.attached ? "attached" : ""}">
        <div class="session-top">
          <div class="session-name">${escHtml(s.name)}</div>
          ${badge}
        </div>
        <div class="session-meta">${project}${model}${created}</div>
        <div class="session-actions">
          <button class="btn-rc" onclick="activateRC('${escAttr(s.name)}')">🔗 Remote Control</button>
          <button class="btn-danger" onclick="confirmKill('${escAttr(s.name)}')">🗑 Beenden</button>
        </div>
      </div>`;
    })
    .join("");
}

// ─── Remote Control ───────────────────────────────────────
async function activateRC(name) {
  try {
    await apiFetch(`/api/sessions/${encodeURIComponent(name)}/rc`, { method: "POST" });
    showInfo(`/rc in "${name}" aktiviert. Claude.ai/code öffnet sich…`);
    setTimeout(() => window.open("https://claude.ai/code", "_blank"), 600);
  } catch (err) {
    showError(err.message);
  }
}

// ─── Kill session ─────────────────────────────────────────
async function confirmKill(name) {
  if (!confirm(`Session "${name}" wirklich beenden?`)) return;
  try {
    await apiFetch(`/api/sessions/${encodeURIComponent(name)}`, { method: "DELETE" });
    await loadSessions();
  } catch (err) {
    showError(err.message);
  }
}

// ─── Banners ──────────────────────────────────────────────
function showError(msg) {
  const el = document.getElementById("global-error");
  el.textContent = msg;
  el.classList.add("active");
  setTimeout(() => el.classList.remove("active"), 6000);
}

function showInfo(msg) {
  const el = document.getElementById("global-info");
  el.textContent = msg;
  el.classList.add("active");
  setTimeout(() => el.classList.remove("active"), 4000);
}

// ─── Helpers ──────────────────────────────────────────────
function escHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
function escAttr(s) {
  return String(s).replace(/'/g, "\\'");
}

// ─── Init ─────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", async () => {
  document.getElementById("bypass-toggle").addEventListener("change", onBypassToggle);
  document.getElementById("project-select").addEventListener("change", suggestSessionName);

  // Mark field as user-edited if they type manually
  document.getElementById("session-name-input").addEventListener("input", (e) => {
    e.target.dataset.userEdited = e.target.value ? "1" : "";
  });

  // Launch on Enter in name field
  document.getElementById("session-name-input").addEventListener("keydown", (e) => {
    if (e.key === "Enter") launchSession();
  });

  await Promise.all([loadModels(), loadProjects(), checkHealth()]);
  suggestSessionName();
  await loadSessions();

  _refreshTimer = setInterval(() => {
    checkHealth();
    loadSessions();
  }, 5000);
});
