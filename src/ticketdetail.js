// ticketdetail.js
document.addEventListener('DOMContentLoaded', async () => {
  const form = document.getElementById('ticketForm');
  const messageDiv = document.getElementById('message');
  const cancelBtn = document.querySelector('.btn-secondary');
  const saveBtn = document.getElementById('saveBtn');
  const logoutBtn = document.getElementById('logoutBtn');
  
  // Get ticket ID from URL
  const urlParams = new URLSearchParams(window.location.search);
  const ticketId = urlParams.get('id');
  const userId = urlParams.get('uid');

  let currentUserRole = null;

  if (!ticketId) {
    showMessage('❌ Fehler: Ticket-ID nicht gefunden.', 'error');
    return;
  }

  // Rollen: Admin=1, Support=2, Benutzer=3
  const ROLE_ADMIN = 1;
  const ROLE_SUPPORT = 2;
  const ROLE_USER = 3;

  // Load current user info
  if (userId) {
    await loadCurrentUser(userId);
  }

  // Load ticket data
  await loadTicket(ticketId);

  // Handle form submission
  if (currentUserRole !== ROLE_USER) {
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      await updateTicket(ticketId, userId);
    });
  }

  // Handle cancel button - navigate back to index.html
  if (cancelBtn) {
    cancelBtn.addEventListener('click', () => {
      window.location.href = userId ? `index.html?id=${userId}` : 'index.html';
    });
  }

  // Handle logout
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      window.location.href = 'login.html';
    });
  }

  async function loadCurrentUser(userId) {
    try {
      const res = await window.api.getUser(userId);
      if (res && res.success && res.user) {
        currentUserRole = res.user.rolle_id;
        const userName = `${res.user.vorname} ${res.user.nachname}`;
        const userDisplay = document.getElementById('userDisplay');
        if (userDisplay) {
          userDisplay.textContent = userName;
        }
        
        // Disable form for regular users
        if (currentUserRole === ROLE_USER) {
          disableFormForUser();
        }
      }
    } catch (error) {
      console.error('Error loading current user:', error);
    }
  }

  function disableFormForUser() {
    const formInputs = document.querySelectorAll('#ticketForm input, #ticketForm textarea, #ticketForm select');
    formInputs.forEach(input => {
      if (input.name !== 'createdBy' && input.name !== 'createdDate') {
        input.disabled = true;
      }
    });
    
    // Hide save button for users
    if (saveBtn) {
      saveBtn.style.display = 'none';
    }
    
    showMessage('ℹ️ Sie können dieses Ticket nur ansehen.', 'info');
  }

  async function loadTicket(ticketId) {
    try {
      showMessage('⏳ Lade Ticket...', 'loading');
      
      const res = await window.api.getTicketById(ticketId);
      
      if (!res || !res.success) {
        showMessage(`❌ Fehler: ${res?.error || 'Unbekannter Fehler beim Laden des Tickets'}`, 'error');
        console.error('Failed to load ticket:', res);
        return;
      }

      const ticket = res.data;
      if (!ticket) {
        showMessage('❌ Ticket-Daten nicht gefunden', 'error');
        return;
      }
      
      // Populate form fields
      document.getElementById('title').value = ticket.titel || '';
      document.getElementById('description').value = ticket.beschreibung || '';
      document.getElementById('category').value = ticket.kategorie_id || '';
      document.getElementById('status').value = ticket.status || '';
      
      // Set read-only fields
      if (ticket.erstellt_von) {
        const userRes = await window.api.getUser(ticket.erstellt_von);
        if (userRes && userRes.success && userRes.user) {
          const user = userRes.user;
          document.getElementById('createdBy').value = `${user.vorname} ${user.nachname}`;
        }
      }

      if (ticket.erstellt_am) {
        const date = new Date(ticket.erstellt_am);
        const formattedDate = date.toLocaleDateString('de-DE', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        });
        document.getElementById('createdDate').value = formattedDate;
      }

      // Update page title and status badge
      document.getElementById('ticketTitle').textContent = `[${ticket.status}] ${ticket.titel}`;
      updateStatusBadge(ticket.status);

      // Hide the message on successful load
      if (currentUserRole === ROLE_USER && messageDiv) {
        // Keep the info message for users
      } else if (messageDiv) {
        messageDiv.classList.add('hidden');
      }
    } catch (error) {
      console.error('Error loading ticket:', error);
      showMessage('❌ Fehler beim Laden des Tickets.', 'error');
    }
  }

  async function updateTicket(ticketId, userId) {
    try {
      showMessage('💾 Speichere Änderungen...', 'loading');

      const formData = new FormData(document.getElementById('ticketForm'));
      const updatedTicket = {
        titel: formData.get('title'),
        beschreibung: formData.get('description'),
        kategorie: formData.get('category'),
        status: formData.get('status')
      };

      const res = await window.api.updateTicket(ticketId, updatedTicket);

      if (res.success) {
        showMessage('✅ Ticket erfolgreich aktualisiert.', 'success');
        // Redirect to index.html after successful update
        setTimeout(() => {
          window.location.href = userId ? `index.html?id=${userId}` : 'index.html';
        }, 1000);
      } else {
        showMessage(`❌ Fehler: ${res.error}`, 'error');
      }
    } catch (error) {
      console.error('Error updating ticket:', error);
      showMessage('❌ Fehler beim Aktualisieren des Tickets.', 'error');
    }
  }

  function updateStatusBadge(status) {
    const badge = document.getElementById('ticketStatus');
    badge.textContent = status;
    badge.className = 'ticket-status-badge';
    
    if (status === 'Offen') {
      badge.classList.add('offen');
    } else if (status === 'In Bearbeitung') {
      badge.classList.add('in-bearbeitung');
    } else if (status === 'Geschlossen') {
      badge.classList.add('geschlossen');
    }
  }

  function showMessage(message, type) {
    const messageDiv = document.getElementById('message');
    if (messageDiv) {
      messageDiv.textContent = message;
      messageDiv.className = `message ${type}`;
      messageDiv.classList.remove('hidden');
    }
  }
});
