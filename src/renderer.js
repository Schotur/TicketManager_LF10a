// renderer.js
document.addEventListener('DOMContentLoaded', () => {
  const loginbtn = document.getElementById('loginBtn');
  const ticketsUl = document.getElementById('tickets');
  const refreshBtn = document.getElementById('refreshBtn');
  const prevBtn = document.getElementById('prevPage');
  const nextBtn = document.getElementById('nextPage');
  const pageInfo = document.getElementById('pageInfo');
  const createBtn = document.getElementById('createTicketBtn');
  const titleInput = document.getElementById('title');
  const descInput = document.getElementById('description');
  const cateInput = document.getElementById('category');
  const createResult = document.getElementById('createResult');

  const TICKETS_PER_PAGE = 10;
  let ticketsCache = [];
  let currentPage = 1;
  const userCache = new Map();

  async function loadTickets() {
    ticketsUl.innerHTML = '<li>Lade...</li>';
    const res = await window.api.getTickets();
    if (!res.success) {
      ticketsUl.innerHTML = `<li class="error">Fehler: ${res.error}</li>`;
      return;
    }
    ticketsCache = res.data || [];
    if (ticketsCache.length === 0) {
      ticketsUl.innerHTML = '<li>Keine Tickets gefunden.</li>';
      updatePagination();
      return;
    }
    currentPage = 1;
    renderPage(currentPage);
  }

  async function renderPage(page) {
    ticketsUl.innerHTML = '<li>Lade...</li>';
    const total = ticketsCache.length;
    const totalPages = Math.max(1, Math.ceil(total / TICKETS_PER_PAGE));
    if (page < 1) page = 1;
    if (page > totalPages) page = totalPages;
    currentPage = page;

    const start = (page - 1) * TICKETS_PER_PAGE;
    const end = Math.min(start + TICKETS_PER_PAGE, total);
    const pageRows = ticketsCache.slice(start, end);

    ticketsUl.innerHTML = '';
    function formatDate(dtStr) {
      if (!dtStr) return '';
      const d = new Date(dtStr);
      if (isNaN(d)) return dtStr;
      const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      const day = String(d.getDate()).padStart(2, '0');
      const hh = String(d.getHours()).padStart(2, '0');
      const mm = String(d.getMinutes()).padStart(2, '0');
      return `${months[d.getMonth()]} ${day} ${d.getFullYear()} ${hh}:${mm}`;
    }

    for (const t of pageRows) {
      const li = document.createElement('li');
      const dateText = formatDate(t.erstellt_am);

      // Fetch author from cache or via IPC, store in cache to minimize calls
      let authorName = '';
      try {
        const uid = t.erstellt_von;
        if (uid != null) {
          if (userCache.has(uid)) {
            const u = userCache.get(uid);
            authorName = u ? `${u.vorname} ${u.nachname}` : '';
          } else {
            const res = await window.api.getUser(uid);
            const u = (res && res.user) ? res.user : null;
            userCache.set(uid, u);
            authorName = u ? `${u.vorname} ${u.nachname}` : '';
          }
        }
      } catch (err) {
        console.debug('Failed to get author for ticket', t.ticket_id, err);
      }

      const metaParts = [];
      if (authorName) metaParts.push(`<span class="ticket-author">von ${escapeHtml(authorName)}</span>`);
      metaParts.push(`<span class="ticket-date">${escapeHtml(dateText)}</span>`);

      li.innerHTML = `<a href="ticketdetail.html?id=${t.ticket_id}"><strong>[${escapeHtml(t.status)}] ${escapeHtml(t.titel)}</strong></a><div class="ticket-meta">${metaParts.join('')}</div>`;
      ticketsUl.appendChild(li);
    }

    updatePagination();
  }

  function updatePagination() {
    const total = ticketsCache.length;
    const totalPages = Math.max(1, Math.ceil(total / TICKETS_PER_PAGE));
    pageInfo.textContent = `Seite ${currentPage} / ${totalPages}`;
    prevBtn.disabled = currentPage <= 1;
    nextBtn.disabled = currentPage >= totalPages;
  }

  function escapeHtml(s) {
    if (!s) return '';
    return s.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
  }

  refreshBtn.addEventListener('click', loadTickets);
  prevBtn.addEventListener('click', () => renderPage(currentPage - 1));
  nextBtn.addEventListener('click', () => renderPage(currentPage + 1));

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
      await loadTickets();
    } else {
      createResult.textContent = `Fehler: ${res.error}`;
      createResult.style.color = 'red';
    }
  });

  if (loginbtn) {
    loginbtn.addEventListener('click', async (event) => {
      event.preventDefault();
      const email = document.getElementById('eMail_login').value;
      const password = document.getElementById('password_login').value;
      const res = await window.api.getUserByEmail(email);
      if (res && res.success && res.user) {
        const user = res.user;
        const stored = user.passwort ?? user.passwort_hash;
        if (stored === password) {
          window.location.href = `index.html?id=${user.benutzer_id}`;
        } else {
          alert('Falsches Passwort. Bitte versuche es erneut.');
        }
      } else {
        alert('Benutzer nicht gefunden. Bitte überprüfe deine Eingaben.');
      }
    });
  }

  // initial load
  loadTickets();
});