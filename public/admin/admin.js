const API_BASE_URL = (() => {
  if (window.location.protocol === "file:") {
    return "http://localhost:3000";
  }

  if (window.location.port === "3000") {
    return window.location.origin;
  }

  return `${window.location.protocol}//${window.location.hostname}:3000`;
})();

const clientsBody = document.getElementById("clients-body");
const searchInput = document.getElementById("search-input");
const rowsSelect = document.getElementById("rows-select");
const rangeText = document.getElementById("range-text");
const pageInput = document.getElementById("page-input");
const pageTotal = document.getElementById("page-total");
const pageButtons = document.querySelectorAll("[data-page-action]");
const openUserModal = document.getElementById("open-user-modal");
const userModal = document.getElementById("user-modal");
const closeUserModal = document.getElementById("close-user-modal");
const cancelUser = document.getElementById("cancel-user");
const userForm = document.getElementById("user-form");
const adminHomeLink = document.getElementById("admin-home-link");

let allUsers = [];
let filteredUsers = [];
let currentPage = 1;
let rowsPerPage = Number(rowsSelect.value || 10);

const buildViewModel = (user) => {
  const displayName = `${user.nombre || ""} ${user.apellido || ""}`.trim() || "Sin nombre";
  const salesIds = Array.isArray(user.ventas_ids) ? user.ventas_ids : [];

  return {
    id: user.id,
    name: displayName,
    email: user.email || "",
    salesIds,
    salesText: salesIds.length ? salesIds.join(", ") : "-"
  };
};

const renderTable = () => {
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const currentRows = filteredUsers.slice(startIndex, endIndex);

  if (currentRows.length === 0) {
    clientsBody.innerHTML = `
      <tr>
        <td colspan="4" class="empty-row">No hay usuarios para mostrar.</td>
      </tr>
    `;
  } else {
    clientsBody.innerHTML = currentRows
      .map(
        (row) => `
        <tr>
          <td>${row.name}</td>
          <td>${row.email}</td>
          <td>${row.salesText}</td>
          <td class="action-col">
            <div class="action-group">
              <button class="action-button edit-button" type="button" data-action="edit" data-user-id="${row.id}">
                Editar
              </button>
              <button class="action-button delete-button" type="button" data-action="delete" data-user-id="${row.id}">
                Eliminar
              </button>
            </div>
          </td>
        </tr>
      `
      )
      .join("");
  }

  const total = filteredUsers.length;
  const safeEnd = Math.min(endIndex, total);
  rangeText.textContent = `Mostrando ${total === 0 ? 0 : startIndex + 1} - ${safeEnd} de ${total}`;
  pageTotal.textContent = `de ${Math.max(1, Math.ceil(total / rowsPerPage))}`;
  pageInput.value = String(currentPage);
};

const applyFilter = () => {
  const term = searchInput.value.trim().toLowerCase();
  if (!term) {
    filteredUsers = [...allUsers];
  } else {
    filteredUsers = allUsers.filter((user) => {
      const name = user.name.toLowerCase();
      const email = user.email.toLowerCase();
      return name.includes(term) || email.includes(term);
    });
  }

  currentPage = 1;
  renderTable();
};

const changePage = (nextPage) => {
  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / rowsPerPage));
  const clamped = Math.min(Math.max(nextPage, 1), totalPages);
  currentPage = clamped;
  renderTable();
};

const handlePageAction = (action) => {
  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / rowsPerPage));
  switch (action) {
    case "first":
      changePage(1);
      break;
    case "prev":
      changePage(currentPage - 1);
      break;
    case "next":
      changePage(currentPage + 1);
      break;
    case "last":
      changePage(totalPages);
      break;
    default:
      break;
  }
};

const loadUsers = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/usuarios`);
    if (!response.ok) {
      throw new Error("No se pudo obtener los usuarios.");
    }

    const data = await response.json();
    allUsers = data.map(buildViewModel);
    filteredUsers = [...allUsers];
    renderTable();
  } catch (error) {
    clientsBody.innerHTML = `
      <tr>
        <td colspan="4" class="empty-row">No se pudo cargar la lista.</td>
      </tr>
    `;
    rangeText.textContent = "Mostrando 0 - 0 de 0";
  }
};

const updateUserName = async (userId, newName) => {
  const response = await fetch(`${API_BASE_URL}/usuarios/${userId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      nombre: newName
    })
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.message || "No se pudo actualizar el usuario.");
  }
};

const deleteUser = async (userId) => {
  const response = await fetch(`${API_BASE_URL}/usuarios/${userId}`, {
    method: "DELETE"
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.message || "No se pudo eliminar el usuario.");
  }
};

const createUser = async (payload) => {
  const response = await fetch(`${API_BASE_URL}/usuarios`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || "No se pudo crear el usuario.");
  }

  return data.usuario;
};

clientsBody.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-action]");
  if (!button) {
    return;
  }

  const action = button.dataset.action;
  const userId = Number(button.dataset.userId);
  const user = allUsers.find((item) => item.id === userId);

  if (!user) {
    return;
  }

  if (action === "edit") {
    const currentName = user.name || "";
    const newName = window.prompt("Nuevo nombre del usuario:", currentName);
    if (!newName || newName.trim() === currentName) {
      return;
    }

    try {
      await updateUserName(userId, newName.trim());
      user.name = newName.trim();
      applyFilter();
    } catch (error) {
      alert(error.message || "No se pudo actualizar el usuario.");
    }
  }

  if (action === "delete") {
    const confirmed = window.confirm(`Eliminar al usuario ${user.name}?`);
    if (!confirmed) {
      return;
    }

    try {
      await deleteUser(userId);
      allUsers = allUsers.filter((item) => item.id !== userId);
      applyFilter();
    } catch (error) {
      alert(error.message || "No se pudo eliminar el usuario.");
    }
  }
});

searchInput.addEventListener("input", applyFilter);
rowsSelect.addEventListener("change", (event) => {
  rowsPerPage = Number(event.target.value || 10);
  currentPage = 1;
  renderTable();
});
pageInput.addEventListener("change", (event) => {
  const targetPage = Number(event.target.value || 1);
  changePage(targetPage);
});
pageButtons.forEach((button) => {
  button.addEventListener("click", () => handlePageAction(button.dataset.pageAction));
});

const showModal = () => {
  userModal.hidden = false;
  const firstInput = userForm.querySelector("input");
  if (firstInput) {
    firstInput.focus();
  }
};

const hideModal = () => {
  userModal.hidden = true;
  userForm.reset();
};

openUserModal.addEventListener("click", showModal);
closeUserModal.addEventListener("click", hideModal);
cancelUser.addEventListener("click", hideModal);
userModal.addEventListener("click", (event) => {
  if (event.target === userModal) {
    hideModal();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !userModal.hidden) {
    hideModal();
  }
});

userForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const submitButton = document.querySelector("button[form='user-form']");
  const formData = new FormData(userForm);
  const payload = {
    nombre: String(formData.get("nombre") || "").trim(),
    apellido: String(formData.get("apellido") || "").trim(),
    email: String(formData.get("email") || "").trim(),
    contraseña: String(formData.get("contrasena") || "").trim(),
    fecha_nacimiento: formData.get("fecha_nacimiento") || null
  };

  if (!payload.nombre || !payload.apellido || !payload.email || !payload.contraseña) {
    alert("Completa todos los campos obligatorios.");
    return;
  }

  try {
    if (submitButton) {
      submitButton.disabled = true;
    }
    const created = await createUser(payload);
    allUsers.unshift(buildViewModel(created));
    applyFilter();
    hideModal();
  } catch (error) {
    alert(error.message || "No se pudo crear el usuario.");
  } finally {
    if (submitButton) {
      submitButton.disabled = false;
    }
  }
});

loadUsers();

const getLoggedUser = () => {
  const rawUser = sessionStorage.getItem("usuario");
  if (!rawUser) {
    return null;
  }

  try {
    return JSON.parse(rawUser);
  } catch (error) {
    return null;
  }
};

const showAdminLinks = () => {
  const user = getLoggedUser();
  if (user && user.email === "admin@admin.com") {
    adminHomeLink.hidden = false;
  } else {
    adminHomeLink.hidden = true;
    window.location.href = "../pages/home.html";
  }
};

showAdminLinks();
