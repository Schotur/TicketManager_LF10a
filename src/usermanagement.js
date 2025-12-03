// usermanagement.js
let currentUserId = null;
let currentUserRole = null;
let usersCache = [];
let rolesCache = [];
let selectedUsers = new Set();

document.addEventListener('DOMContentLoaded', async () => {
  // Get user ID from URL
  const urlParams = new URLSearchParams(window.location.search);
  currentUserId = urlParams.get('id');

  if (!currentUserId) {
    showMessage('❌ Fehler: Benutzer-ID nicht gefunden.', 'error');
    return;
  }

  // Load current user info
  await loadCurrentUser();
  
  // Load roles first
  await loadRoles();
  
  // Load users
  await loadUsers();

  // Event listeners
  document.getElementById('addUserBtn').addEventListener('click', showUserForm);
  document.getElementById('deleteSelectedBtn').addEventListener('click', deleteSelectedUsers);
  document.getElementById('userDetailForm').addEventListener('submit', saveUser);
  document.getElementById('cancelEditBtn').addEventListener('click', backToList);
  document.getElementById('backToListBtn').addEventListener('click', backToList);
  document.getElementById('logoutBtn').addEventListener('click', logout);
  document.getElementById('selectAllCheckbox').addEventListener('change', selectAllUsers);

  // Side menu navigation
  const sidemenuItems = document.querySelectorAll('.sidemenu-item');
  sidemenuItems.forEach((item) => {
    item.addEventListener('click', function () {
      const action = this.getAttribute('data-action');
      
      if (action === 'user-management') {
        // Already on user management
        return;
      } else if (action === 'show-all') {
        window.location.href = `index.html?id=${currentUserId}`;
      } else if (action === 'create-ticket') {
        window.location.href = `index.html?id=${currentUserId}`;
      }
    });
  });
});

async function loadCurrentUser() {
  try {
    const res = await window.api.getUser(currentUserId);
    if (res && res.success && res.user) {
      currentUserRole = res.user.rolle_id;
      const userName = `${res.user.vorname} ${res.user.nachname}`;
      document.getElementById('userDisplay').textContent = userName;
    }
  } catch (error) {
    console.error('Error loading current user:', error);
  }
}

async function loadRoles() {
  try {
    const res = await window.api.getRoles();
    if (res && res.success) {
      rolesCache = res.data;
      populateRoleSelect();
    }
  } catch (error) {
    console.error('Error loading roles:', error);
  }
}

function populateRoleSelect() {
  const select = document.getElementById('userRole');
  select.innerHTML = '';
  rolesCache.forEach(role => {
    const option = document.createElement('option');
    option.value = role.rolle_id;
    option.textContent = role.name;
    select.appendChild(option);
  });
}

async function loadUsers() {
  try {
    showMessage('⏳ Lade Benutzer...', 'loading', 'usersListMessage');
    
    const res = await window.api.getUsers();
    if (!res || !res.success) {
      showMessage(`❌ Fehler beim Laden der Benutzer: ${res?.error}`, 'error', 'usersListMessage');
      return;
    }

    usersCache = res.data || [];
    renderUsersList();
    updateUserCount();
    showMessage('', '', 'usersListMessage');
  } catch (error) {
    console.error('Error loading users:', error);
    showMessage('❌ Fehler beim Laden der Benutzer.', 'error', 'usersListMessage');
  }
}

function renderUsersList() {
  const tbody = document.getElementById('users-tbody');
  tbody.innerHTML = '';

  if (usersCache.length === 0) {
    const row = document.createElement('tr');
    row.innerHTML = '<td colspan="6" style="text-align: center; padding: 20px;">Keine Benutzer vorhanden</td>';
    tbody.appendChild(row);
    return;
  }

  usersCache.forEach(user => {
    const row = document.createElement('tr');
    row.className = selectedUsers.has(user.benutzer_id) ? 'selected' : '';
    
    const statusText = user.aktiv ? '✓ Aktiv' : '✗ Inaktiv';
    
    row.innerHTML = `
      <td>
        <input type="checkbox" class="user-checkbox" value="${user.benutzer_id}" 
               ${selectedUsers.has(user.benutzer_id) ? 'checked' : ''}>
      </td>
      <td>${escapeHtml(user.vorname)} ${escapeHtml(user.nachname)}</td>
      <td>${escapeHtml(user.email)}</td>
      <td>${escapeHtml(user.rolle_name)}</td>
      <td>${statusText}</td>
      <td>
        <button class="btn-small btn-edit" data-id="${user.benutzer_id}">Bearbeiten</button>
      </td>
    `;

    const checkbox = row.querySelector('.user-checkbox');
    checkbox.addEventListener('change', toggleUserSelection);

    const editBtn = row.querySelector('.btn-edit');
    editBtn.addEventListener('click', () => editUser(user.benutzer_id));

    tbody.appendChild(row);
  });
}

function toggleUserSelection(e) {
  const userId = parseInt(e.target.value);
  
  if (e.target.checked) {
    selectedUsers.add(userId);
  } else {
    selectedUsers.delete(userId);
  }

  updateDeleteButton();
}

function selectAllUsers(e) {
  const checkboxes = document.querySelectorAll('.user-checkbox');
  
  if (e.target.checked) {
    selectedUsers.clear();
    checkboxes.forEach(cb => {
      cb.checked = true;
      selectedUsers.add(parseInt(cb.value));
    });
  } else {
    selectedUsers.clear();
    checkboxes.forEach(cb => {
      cb.checked = false;
    });
  }

  updateDeleteButton();
}

function updateDeleteButton() {
  const btn = document.getElementById('deleteSelectedBtn');
  btn.disabled = selectedUsers.size === 0;
}

function updateUserCount() {
  const countEl = document.getElementById('userCount');
  if (countEl) {
    countEl.textContent = `${usersCache.length} Benutzer`;
  }
}

function showUserForm() {
  // Clear form for new user
  document.getElementById('userDetailForm').reset();
  document.getElementById('userDetailTitle').textContent = 'Neuer Benutzer';
  document.getElementById('userEmail').value = '';
  document.getElementById('userPassword').value = '';
  document.getElementById('userActive').checked = true;
  
  // Switch to detail view
  switchView('user-detail');
}

async function editUser(userId) {
  try {
    const res = await window.api.getUser(userId);
    if (res && res.success && res.user) {
      const user = res.user;
      document.getElementById('userDetailTitle').textContent = `Benutzer bearbeiten: ${user.vorname} ${user.nachname}`;
      document.getElementById('userFirstname').value = user.vorname;
      document.getElementById('userLastname').value = user.nachname;
      document.getElementById('userEmail').value = user.email;
      document.getElementById('userPassword').value = user.passwort_hash;
      document.getElementById('userRole').value = user.rolle_id;
      document.getElementById('userActive').checked = user.aktiv;
      
      document.getElementById('userDetailForm').dataset.userId = userId;
      switchView('user-detail');
    }
  } catch (error) {
    console.error('Error loading user:', error);
    showMessage('❌ Fehler beim Laden des Benutzers.', 'error', 'userDetailMessage');
  }
}

async function saveUser(e) {
  e.preventDefault();

  try {
    showMessage('💾 Speichere Benutzer...', 'loading', 'userDetailMessage');

    const formData = new FormData(document.getElementById('userDetailForm'));
    const userData = {
      vorname: formData.get('vorname'),
      nachname: formData.get('nachname'),
      email: formData.get('email'),
      passwort_hash: formData.get('password'),
      rolle_id: parseInt(formData.get('rolle_id')),
      aktiv: document.getElementById('userActive').checked
    };

    const userId = document.getElementById('userDetailForm').dataset.userId;

    let res;
    if (userId) {
      // Update existing user
      res = await window.api.updateUser(userId, userData);
    } else {
      // Create new user
      res = await window.api.createUser(userData);
    }

    if (res.success) {
      showMessage('✅ Benutzer erfolgreich gespeichert!', 'success', 'userDetailMessage');
      setTimeout(() => {
        backToList();
      }, 1000);
    } else {
      showMessage(`❌ Fehler: ${res.error}`, 'error', 'userDetailMessage');
    }
  } catch (error) {
    console.error('Error saving user:', error);
    showMessage('❌ Fehler beim Speichern des Benutzers.', 'error', 'userDetailMessage');
  }
}

async function deleteSelectedUsers() {
  if (selectedUsers.size === 0) return;

  if (!confirm(`Möchten Sie ${selectedUsers.size} Benutzer wirklich löschen?`)) {
    return;
  }

  try {
    let successCount = 0;
    for (const userId of selectedUsers) {
      const res = await window.api.deleteUser(userId);
      if (res.success) {
        successCount++;
      }
    }

    selectedUsers.clear();
    document.getElementById('selectAllCheckbox').checked = false;
    
    showMessage(`✅ ${successCount} Benutzer gelöscht!`, 'success', 'usersListMessage');
    await loadUsers();
  } catch (error) {
    console.error('Error deleting users:', error);
    showMessage('❌ Fehler beim Löschen der Benutzer.', 'error', 'usersListMessage');
  }
}

function backToList() {
  document.getElementById('userDetailForm').dataset.userId = '';
  selectedUsers.clear();
  document.getElementById('selectAllCheckbox').checked = false;
  switchView('users-list');
  loadUsers();
}

function switchView(viewId) {
  const views = document.querySelectorAll('.view');
  views.forEach(view => {
    if (view.id === viewId) {
      view.classList.remove('hidden');
    } else {
      view.classList.add('hidden');
    }
  });
}

function escapeHtml(s) {
  const div = document.createElement('div');
  div.textContent = s;
  return div.innerHTML;
}

function showMessage(message, type, elementId = 'message') {
  const messageDiv = document.getElementById(elementId);
  if (messageDiv) {
    messageDiv.textContent = message;
    messageDiv.className = `message ${type}`;
  }
}

function logout() {
  window.location.href = 'login.html';
}
