// ticketdetail.js
document.addEventListener('DOMContentLoaded', async () => {
  const form = document.getElementById('ticketForm');
  const messageDiv = document.getElementById('message');
  const cancelBtn = document.querySelector('.btn-secondary');
  const saveBtn = document.getElementById('saveBtn');
  const logoutBtn = document.getElementById('logoutBtn');
  const assignedToSelect = document.getElementById('assignedTo');
  
  // Get ticket ID from URL
  const urlParams = new URLSearchParams(window.location.search);
  const ticketId = urlParams.get('id');
  const userId = urlParams.get('uid');

  let currentUserRole = null;
  let allUsers = [];
  let currentTicketData = null;

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

  // Load comments for the ticket
  await loadComments(ticketId);

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

  // Handle comment submission
  const submitCommentBtn = document.getElementById('submitCommentBtn');
  if (submitCommentBtn) {
    submitCommentBtn.addEventListener('click', async () => {
      await submitComment(ticketId, userId);
    });
  }

  // Allow Enter key to submit comment (Shift+Enter for newline)

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
        
        // Load all users for assignee dropdown (only for Admin/Support)
        if (currentUserRole === 1 || currentUserRole === 2) {
          await loadAllUsers();
        }
        
        // Disable form for regular users
        if (currentUserRole === 3) {
          disableFormForUser();
        }
      }
    } catch (error) {
      console.error('Error loading current user:', error);
    }
  }

  async function loadAllUsers() {
    try {
      const res = await window.api.getUsers();
      if (res && res.success && res.data) {
        allUsers = res.data;
        populateAssigneeDropdown();
      }
    } catch (error) {
      console.error('Error loading users:', error);
    }
  }

  function populateAssigneeDropdown() {
    // Only show Admin and Support users
    const supportUsers = allUsers.filter(u => u.rolle_id === 1 || u.rolle_id === 2);
    
    // Clear existing options except the first one
    while (assignedToSelect.options.length > 1) {
      assignedToSelect.remove(1);
    }
    
    supportUsers.forEach(user => {
      const option = document.createElement('option');
      option.value = user.benutzer_id;
      option.textContent = `${user.vorname} ${user.nachname}`;
      assignedToSelect.appendChild(option);
    });
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

  function disableAssigneeForUsers() {
    // Only show assignee for Admin and Support
    if (currentUserRole !== 1 && currentUserRole !== 2) {
      assignedToSelect.disabled = true;
    }
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
      
      currentTicketData = ticket;
      
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

      // Set assigned to
      if (ticket.zugewiesen_an) {
        assignedToSelect.value = ticket.zugewiesen_an;
      }

      disableAssigneeForUsers();

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
        status: formData.get('status'),
        zugewiesen_an: formData.get('assignedTo') || null
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
      
      // Automatically hide the message after 3 seconds
      setTimeout(() => {
        messageDiv.classList.add('hidden');
      }, 3000);
    }
  }

  async function loadComments(ticketId) {
    try {
      const res = await window.api.getCommentsByTicket(ticketId);
      
      if (!res || !res.success) {
        console.error('Failed to load comments:', res);
        return;
      }

      const comments = res.data || [];
      const commentsList = document.getElementById('commentsList');
      
      if (!commentsList) return;

      // Clear existing comments
      commentsList.innerHTML = '';

      if (comments.length === 0) {
        commentsList.innerHTML = '<div class="comments-list-empty">Noch keine Kommentare. Seien Sie der Erste!</div>';
        return;
      }

      // Render each comment
      comments.forEach(comment => {
        const commentEl = createCommentElement(comment);
        commentsList.appendChild(commentEl);
      });
    } catch (error) {
      console.error('Error loading comments:', error);
    }
  }

  function createCommentElement(comment) {
    const commentDiv = document.createElement('div');
    commentDiv.className = 'comment-item';

    // Format the date
    const date = new Date(comment.erstellt_am);
    const formattedDate = date.toLocaleDateString('de-DE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });

    commentDiv.innerHTML = `
      <div class="comment-header">
        <div>
          <span class="comment-author">${comment.vorname} ${comment.nachname}</span>
          <div class="comment-meta">
            <span class="comment-role">${comment.rolle_name}</span>
            <span class="comment-datetime">${formattedDate}</span>
          </div>
        </div>
      </div>
      <div class="comment-content">${escapeHtml(comment.inhalt)}</div>
    `;

    return commentDiv;
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  async function submitComment(ticketId, userId) {
    const commentInput = document.getElementById('commentInput');
    const commentText = commentInput?.value?.trim();

    if (!commentText) {
      showMessage('❌ Bitte schreiben Sie einen Kommentar.', 'error');
      return;
    }

    try {
      showMessage('💾 Speichere Kommentar...', 'loading');

      const res = await window.api.createComment({
        ticket_id: ticketId,
        benutzer_id: userId,
        inhalt: commentText
      });

      if (res.success) {
        // Clear input
        commentInput.value = '';
        showMessage('✅ Kommentar erfolgreich hinzugefügt.', 'success');
        
        // Reload comments
        await loadComments(ticketId);
        
        // Hide message after 2 seconds
        setTimeout(() => {
          const messageDiv = document.getElementById('message');
          if (messageDiv) {
            messageDiv.classList.add('hidden');
          }
        }, 2000);
      } else {
        showMessage(`❌ Fehler: ${res.error}`, 'error');
      }
    } catch (error) {
      console.error('Error submitting comment:', error);
      showMessage('❌ Fehler beim Hinzufügen des Kommentars.', 'error');
    }
  }

  async function deleteTicket(ticketId) {
    // Check if user has permission (only Admin and Support can delete)
    if (currentUserRole === ROLE_USER) {
      showMessage('❌ Sie haben keine Berechtigung, Tickets zu löschen.', 'error');
      return;
    }

    // Show confirmation dialog
    const confirmed = confirm('⚠️ Sind Sie sicher, dass Sie dieses Ticket löschen möchten? Diese Aktion kann nicht rückgängig gemacht werden.');
    
    if (!confirmed) {
      showMessage('ℹ️ Löschen abgebrochen.', 'info');
      return;
    }

    // Show second confirmation
    const doubleConfirmed = confirm('⚠️ Dieses Ticket wird endgültig gelöscht. Klicken Sie erneut auf "OK" zum Bestätigen.');
    
    if (!doubleConfirmed) {
      showMessage('ℹ️ Löschen abgebrochen.', 'info');
      return;
    }

    try {
      showMessage('🗑️ Lösche Ticket...', 'loading');

      const res = await window.api.deleteTicket(ticketId);

      if (res.success) {
        showMessage('✅ Ticket erfolgreich gelöscht.', 'success');
        // Redirect to index.html immediately after successful deletion
        window.location.href = userId ? `index.html?id=${userId}` : 'index.html';
      } else {
        showMessage(`❌ Fehler: ${res.error}`, 'error');
      }
    } catch (error) {
      console.error('Error deleting ticket:', error);
      showMessage('❌ Fehler beim Löschen des Tickets.', 'error');
    }
  }

  // Show delete button only for Admin and Support, handle delete click
  const deleteBtn = document.getElementById('deleteBtn');
  if (deleteBtn) {
    // Update visibility based on user role after load
    if (currentUserRole === ROLE_ADMIN || currentUserRole === ROLE_SUPPORT) {
      deleteBtn.style.display = 'inline-block';
    }
    
    deleteBtn.addEventListener('click', async (event) => {
      event.preventDefault();
      await deleteTicket(ticketId);
    });
  }
});
