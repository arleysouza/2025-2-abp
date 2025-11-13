/* eslint-env browser */

const flashEl = document.getElementById("flash");
const tbody = document.getElementById("pub-body");
const reloadBtn = document.getElementById("btn-reload");
const createForm = document.getElementById("form-create");
const editForm = document.getElementById("form-edit");
const editHint = document.getElementById("edit-hint");
const logoutBtn = document.getElementById("btn-logout");
const editFields = [
  document.getElementById("edit-texto"),
  document.getElementById("edit-ano"),
  document.getElementById("edit-doi"),
  document.getElementById("edit-link"),
  document.getElementById("edit-imagem"),
  document.getElementById("btn-edit-submit"),
];
const modalEl = document.getElementById("confirm-modal");
const modalText = document.getElementById("confirm-text");
const modalCancel = document.getElementById("confirm-cancel");
const modalAccept = document.getElementById("confirm-accept");

let publicacoesState = [];
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
      "Selecione uma publicação na tabela para carregar os dados.";
  } else {
    editHint.textContent = `Editando publicação #${selectedId}`;
  }
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

function resumoTexto(texto) {
  if (!texto) return "—";
  return texto.length > 80 ? `${texto.slice(0, 77)}…` : texto;
}

function renderPublicacoes(lista) {
  tbody.innerHTML = "";
  if (!lista || lista.length === 0) {
    const row = document.createElement("tr");
    row.innerHTML =
      '<td class="empty" colspan="3">Nenhuma publicação cadastrada.</td>';
    tbody.appendChild(row);
    return;
  }

  lista.forEach((pub) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${pub.ano ?? "—"}</td>
      <td>${resumoTexto(pub.texto)}</td>
      <td>
        <div class="actions">
          <button class="edit" type="button" data-action="edit" data-id="${pub.idpublicacao}">Editar</button>
          <button class="delete" type="button" data-action="delete" data-id="${pub.idpublicacao}">Excluir</button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

async function carregarPublicacoes() {
  try {
    const data = await apiFetch("/api/publicacoes/admin/all");
    publicacoesState = Array.isArray(data) ? data : [];
    renderPublicacoes(publicacoesState);
  } catch (err) {
    setFlash(err.message, "error");
  }
}

function preencherEditar(id) {
  const pub = publicacoesState.find((p) => p.idpublicacao === id);
  if (!pub) {
    setFlash("Publicação não encontrada.", "error");
    return;
  }
  selectedId = id;
  document.getElementById("edit-id").value = id;
  document.getElementById("edit-texto").value = pub.texto || "";
  document.getElementById("edit-ano").value = pub.ano ?? "";
  document.getElementById("edit-doi").value = pub.doi || "";
  document.getElementById("edit-link").value = pub.link || "";
  document.getElementById("edit-imagem").value = "";
  toggleEditForm(true);
}

function openDeleteConfirm(id) {
  const pub = publicacoesState.find((p) => p.idpublicacao === id);
  if (!pub) {
    setFlash("Publicação não encontrada.", "error");
    return;
  }
  pendingDelete = pub;
  const anoLabel = pub.ano ?? "-";
  modalText.textContent = `Deseja excluir a publicação do ano ${anoLabel}? Esta ação é irreversível.`;
  modalEl.classList.add("open");
}

function closeModal() {
  pendingDelete = null;
  modalEl.classList.remove("open");
}

async function excluirPublicacao(id) {
  await apiFetch(`/api/publicacoes/${id}`, { method: "DELETE" });
  if (selectedId === id) {
    selectedId = null;
    toggleEditForm(false);
  }
  await carregarPublicacoes();
  setFlash("Publicação excluída com sucesso.", "success");
}

async function handleCreateSubmit(event) {
  event.preventDefault();
  const texto = document.getElementById("create-texto").value.trim();
  const ano = document.getElementById("create-ano").value;
  const doi = document.getElementById("create-doi").value.trim();
  const link = document.getElementById("create-link").value.trim();
  const imagem = document.getElementById("create-imagem").files[0] || null;

  if (!texto || !ano) {
    setFlash("Informe texto e ano para cadastrar.", "error");
    return;
  }

  const formData = new FormData();
  formData.append("texto", texto);
  formData.append("ano", ano);
  if (link) formData.append("link", link);
  else formData.append("link", "");
  if (doi) formData.append("doi", doi);
  else formData.append("doi", "");
  if (imagem) formData.append("imagem", imagem);

  try {
    await apiFetch("/api/publicacoes", {
      method: "POST",
      body: formData,
    });
    createForm.reset();
    setFlash("Publicação criada com sucesso.", "success");
    await carregarPublicacoes();
  } catch (err) {
    setFlash(err.message, "error");
  }
}

async function handleEditSubmit(event) {
  event.preventDefault();
  if (!selectedId) {
    setFlash("Selecione uma publicação para editar.", "error");
    return;
  }

  const texto = document.getElementById("edit-texto").value.trim();
  const ano = document.getElementById("edit-ano").value;
  const doi = document.getElementById("edit-doi").value.trim();
  const link = document.getElementById("edit-link").value.trim();
  const imagem = document.getElementById("edit-imagem").files[0] || null;

  if (!texto || !ano) {
    setFlash("Informe texto e ano para salvar.", "error");
    return;
  }

  const formData = new FormData();
  formData.append("texto", texto);
  formData.append("ano", ano);
  formData.append("link", link || "");
  formData.append("doi", doi || "");
  if (imagem) formData.append("imagem", imagem);

  try {
    await apiFetch(`/api/publicacoes/${selectedId}`, {
      method: "PUT",
      body: formData,
    });
    document.getElementById("edit-imagem").value = "";
    setFlash("Publicação atualizada com sucesso.", "success");
    await carregarPublicacoes();
  } catch (err) {
    setFlash(err.message, "error");
  }
}

function init() {
  toggleEditForm(false);
  carregarPublicacoes();

  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      logout();
    });
  }

  reloadBtn.addEventListener("click", () => {
    setFlash("", "");
    carregarPublicacoes();
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
    const id = pendingDelete.idpublicacao;
    closeModal();
    try {
      await excluirPublicacao(id);
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
