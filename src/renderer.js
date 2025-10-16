// renderer.js
document.addEventListener('DOMContentLoaded', () => {
  const ticketsUl = document.getElementById('tickets');
  const refreshBtn = document.getElementById('refreshBtn');
  const createBtn = document.getElementById('createTicketBtn');
  const titleInput = document.getElementById('title');
  const descInput = document.getElementById('description');
  const createResult = document.getElementById('createResult');

  async function loadTickets() {
    ticketsUl.innerHTML = '<li>Lade...</li>';
    const res = await window.api.getTickets();
    if (!res.success) {
      ticketsUl.innerHTML = `<li class="error">Fehler: ${res.error}</li>`;
      return;
    }
    const rows = res.data;
    if (rows.length === 0) {
      ticketsUl.innerHTML = '<li>Keine Tickets gefunden.</li>';
      return;
    }
    ticketsUl.innerHTML = '';
    for (const t of rows) {
      const li = document.createElement('li');
      li.innerHTML = `<strong>[${t.status}] ${escapeHtml(t.title)}</strong><div>${escapeHtml(t.description || '')}</div><small>von ${escapeHtml(t.customer || 'Unbekannt')} — ${t.created_at}</small>`;
      ticketsUl.appendChild(li);
    }
  }

  function escapeHtml(s) {
    if (!s) return '';
    return s.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
  }

  refreshBtn.addEventListener('click', loadTickets);

  createBtn.addEventListener('click', async () => {
    const title = titleInput.value.trim();
    const description = descInput.value.trim();
    if (!title) {
      createResult.textContent = 'Bitte Betreff eingeben.';
      createResult.style.color = 'red';
      return;
    }
    createResult.textContent = 'Erstelle...';
    createResult.style.color = 'black';
    const res = await window.api.createTicket({ title, description, customer_id: 1 });
    if (res.success) {
      createResult.textContent = `Ticket erstellt (ID ${res.id}).`;
      createResult.style.color = 'green';
      titleInput.value = '';
      descInput.value = '';
      loadTickets();
    } else {
      createResult.textContent = `Fehler: ${res.error}`;
      createResult.style.color = 'red';
    }
  });

  // initial load
  loadTickets();
});
