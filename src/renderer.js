// renderer.js
document.addEventListener('DOMContentLoaded', () => {
  const ticketsUl = document.getElementById('tickets');
  const refreshBtn = document.getElementById('refreshBtn');
  const createBtn = document.getElementById('createTicketBtn');
  const titleInput = document.getElementById('title');
  const descInput = document.getElementById('description');
  const cateInput = document.getElementById('category');
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
    console.log(rows);
    for (const t of rows) {
      const { user } = await window.api.getUser(t.erstellt_von);
      const li = document.createElement('li');
      li.innerHTML = `<a href="ticketdetail.html?id=${t.ticket_id}"><strong>[${t.status}] ${escapeHtml(t.titel)}</strong></a><div>${escapeHtml(t.beschreibung || '')}</div><small>von ${user.vorname} ${user.nachname} — ${t.erstellt_am}</small>`;
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
    const category = cateInput.value;
    if (!title) {
      createResult.textContent = 'Bitte Betreff eingeben.';
      createResult.style.color = 'red';
      return;
    }
    createResult.textContent = 'Erstelle...';
    createResult.style.color = 'black';
    const res = await window.api.createTicket({ title, description, customer_id: 1, category, status: "Offen" });
    if (res.success) {
      createResult.textContent = `Ticket erstellt (ID ${res.id}).`;
      createResult.style.color = 'green';
      titleInput.value = '';
      descInput.value = '';
      cateInput.value = 1;
      loadTickets();
    } else {
      createResult.textContent = `Fehler: ${res.error}`;
      createResult.style.color = 'red';
    }
  });

  // initial load
  loadTickets();
});
