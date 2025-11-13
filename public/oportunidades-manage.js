/* eslint-env browser */

const flashEl = document.getElementById("flash");
const tbody = document.getElementById("opp-body");
const reloadBtn = document.getElementById("btn-reload");
const createForm = document.getElementById("form-create");
const editForm = document.getElementById("form-edit");
const editHint = document.getElementById("edit-hint");
const logoutBtn = document.getElementById("btn-logout");
const editFields = [
  document.getElementById("edit-titulo"),
  document.getElementById("edit-descricao"),
  document.getElementById("edit-validade"),
  document.getElementById("edit-exibir"),
  document.getElementById("btn-edit-submit"),
];
const modalEl = document.getElementById("confirm-modal");
const modalText = document.getElementById("confirm-text");
const modalCancel = document.getElementById("confirm-cancel");
const modalAccept = document.getElementById("confirm-accept");

let oportunidadesState = [];
let selectedId = null;
let pendingDelete = null;

function setFlash(message, type = "") {
  flashEl.className = "msg";
  if (message) {
    flashEl.textContent = message;
    flashEl.classList.add(type || "success");
  } else {
    flashEl.textContent = "";
  }
}

function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("usuario");
  document.cookie = "token=; path=/; max-age=0";
  window.location.href = "/login.html";
}

function toggleEditForm(enabled) {
  editFields.forEach((el) => {
    el.disabled = !enabled;
  });
  if (!enabled) {
    editForm.reset();
    document.getElementById("edit-id").value = "";
    editHint.textContent =
      "Selecione uma oportunidade na tabela para carregar os dados.";
  } else {
    editHint.textContent = `Editando oportunidade #${selectedId}`;
  }
}

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("pt-BR");
}

function toInputDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

function getToken() {
  return localStorage.getItem("token");
}

async function apiFetch(path, options = {}) {
  const headers = new Headers(options.headers || {});
  const token = getToken();
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  const opts = {
    credentials: "include",
    ...options,
    headers,
  };
  const res = await fetch(path, opts);
  const text = await res.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }
  if (!res.ok) {
    if (res.status === 401) {
      window.location.href = "/login.html";
    }
    const msg =
      (data && (data.error || data.message)) ||
      `Erro ao comunicar com o servidor (HTTP ${res.status})`;
    throw new Error(msg);
  }
  return data;
}

function renderOportunidades(lista) {
  tbody.innerHTML = "";
  if (!lista || lista.length === 0) {
    const row = document.createElement("tr");
    row.innerHTML =
      '<td class="empty" colspan="4">Nenhuma oportunidade cadastrada.</td>';
    tbody.appendChild(row);
    return;
  }

  lista.forEach((oportunidade) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${oportunidade.titulo ?? ""}</td>
      <td>${formatDate(oportunidade.validade)}</td>
      <td>${oportunidade.exibir ? "Sim" : "Não"}</td>
      <td>
        <div class="actions">
          <button class="edit" type="button" data-action="edit" data-id="${oportunidade.idoportunidade}">Editar</button>
          <button class="delete" type="button" data-action="delete" data-id="${oportunidade.idoportunidade}">Excluir</button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

async function carregarOportunidades() {
  try {
    const data = await apiFetch("/api/oportunidades/admin/all");
    oportunidadesState = Array.isArray(data) ? data : [];
    renderOportunidades(oportunidadesState);
  } catch (err) {
    setFlash(err.message, "error");
  }
}

function preencherEditar(id) {
  const oportunidade = oportunidadesState.find((o) => o.idoportunidade === id);
  if (!oportunidade) {
    setFlash("Oportunidade não encontrada.", "error");
    return;
  }
  selectedId = id;
  document.getElementById("edit-id").value = id;
  document.getElementById("edit-titulo").value = oportunidade.titulo || "";
  document.getElementById("edit-descricao").value =
    oportunidade.descricao || "";
  document.getElementById("edit-validade").value = toInputDate(
    oportunidade.validade,
  );
  document.getElementById("edit-exibir").value = String(
    oportunidade.exibir !== false,
  );
  toggleEditForm(true);
}

function openDeleteConfirm(id) {
  const oportunidade = oportunidadesState.find((o) => o.idoportunidade === id);
  if (!oportunidade) {
    setFlash("Oportunidade não encontrada.", "error");
    return;
  }
  pendingDelete = oportunidade;
  modalText.textContent = `Deseja excluir "${oportunidade.titulo}"? Esta ação é irreversível.`;
  modalEl.classList.add("open");
}

function closeModal() {
  pendingDelete = null;
  modalEl.classList.remove("open");
}

async function excluirOportunidade(id) {
  await apiFetch(`/api/oportunidades/${id}`, { method: "DELETE" });
  if (selectedId === id) {
    selectedId = null;
    toggleEditForm(false);
  }
  await carregarOportunidades();
  setFlash("Oportunidade excluída com sucesso.", "success");
}

async function handleCreateSubmit(event) {
  event.preventDefault();
  const titulo = document.getElementById("create-titulo").value.trim();
  const descricao = document.getElementById("create-descricao").value.trim();
  const validade = document.getElementById("create-validade").value;
  const exibir = document.getElementById("create-exibir").value;

  if (!titulo || !descricao || !validade) {
    setFlash("Preencha todos os campos para cadastrar.", "error");
    return;
  }

  const payload = {
    titulo,
    descricao,
    validade,
    exibir: exibir === "true",
  };

  try {
    await apiFetch("/api/oportunidades", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    createForm.reset();
    setFlash("Oportunidade criada com sucesso.", "success");
    await carregarOportunidades();
  } catch (err) {
    setFlash(err.message, "error");
  }
}

async function handleEditSubmit(event) {
  event.preventDefault();
  if (!selectedId) {
    setFlash("Selecione uma oportunidade para editar.", "error");
    return;
  }

  const titulo = document.getElementById("edit-titulo").value.trim();
  const descricao = document.getElementById("edit-descricao").value.trim();
  const validade = document.getElementById("edit-validade").value;
  const exibir = document.getElementById("edit-exibir").value;

  if (!titulo || !descricao || !validade) {
    setFlash("Preencha todos os campos para salvar.", "error");
    return;
  }

  const payload = {
    titulo,
    descricao,
    validade,
    exibir: exibir === "true",
  };

  try {
    await apiFetch(`/api/oportunidades/${selectedId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setFlash("Oportunidade atualizada com sucesso.", "success");
    await carregarOportunidades();
  } catch (err) {
    setFlash(err.message, "error");
  }
}

function init() {
  toggleEditForm(false);
  carregarOportunidades();

  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      logout();
    });
  }

  reloadBtn.addEventListener("click", () => {
    setFlash("", "");
    carregarOportunidades();
  });

  tbody.addEventListener("click", (event) => {
    const btn = event.target.closest("button[data-action]");
    if (!btn) return;
    const id = Number(btn.dataset.id);
    if (!Number.isInteger(id)) return;
    if (btn.dataset.action === "edit") {
      preencherEditar(id);
    } else if (btn.dataset.action === "delete") {
      openDeleteConfirm(id);
    }
  });

  modalCancel.addEventListener("click", closeModal);
  modalEl.addEventListener("click", (event) => {
    if (event.target === modalEl) {
      closeModal();
    }
  });
  modalAccept.addEventListener("click", async () => {
    if (!pendingDelete) return;
    const id = pendingDelete.idoportunidade;
    closeModal();
    try {
      await excluirOportunidade(id);
    } catch (err) {
      setFlash(err.message, "error");
    }
  });

  createForm.addEventListener("submit", handleCreateSubmit);
  editForm.addEventListener("submit", handleEditSubmit);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
