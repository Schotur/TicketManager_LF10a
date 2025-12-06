// renderer.js
document.addEventListener('DOMContentLoaded', async () => {
  let currentUserId = null;
  let currentUserRole = null;

  // Get user ID from URL
  const urlParams = new URLSearchParams(window.location.search);
  currentUserId = urlParams.get('id');

  if (!currentUserId) {
    window.location.href = 'login.html';
    return;
  }

  const ticketsUl = document.getElementById('tickets');
  const refreshBtn = document.getElementById('refreshBtn');
  const prevBtn = document.getElementById('prevPage');
  const nextBtn = document.getElementById('nextPage');
  const pageInfo = document.getElementById('pageInfo');
  const createBtn = document.getElementById('createTicketBtn');
  const titleInput = document.getElementById('title');
  const descInput = document.getElementById('description');
  const cateInput = document.getElementById('category');
  const assigneeInput = document.getElementById('assignee');
  const assigneeRow = document.getElementById('assigneeRow');
  const createResult = document.getElementById('createResult');
  const logoutBtn = document.getElementById('logoutBtn');

  const TICKETS_PER_PAGE = 5;
  let ticketsCache = [];
  let filteredTickets = [];
  let currentPage = 1;
  let currentStatusFilter = 'all';
  const userCache = new Map();
  let allUsers = [];
  let isLoadingTickets = false; // Lock für Mehrfach-Loads
  let currentView = 'home'; // Track whether we're in 'home' or 'all' view

  // Rollen: Admin=1, Support=2, Benutzer=3
  const ROLE_ADMIN = 1;
  const ROLE_SUPPORT = 2;
  const ROLE_USER = 3;

  // Load current user info and set up role-based visibility
  await loadCurrentUser();

  async function loadCurrentUser() {
    try {
      const res = await window.api.getUser(currentUserId);
      if (res && res.success && res.user) {
        currentUserRole = res.user.rolle_id;
        const userName = `${res.user.vorname} ${res.user.nachname}`;
        document.getElementById('userDisplay').textContent = userName;
        
        // Load users for assignee dropdown
        await loadAllUsers();
        
        // Setup role-based menu - must be AFTER DOM is ready
        setTimeout(() => setupRoleBasedMenu(), 0);
      }
    } catch (error) {
      console.error('Error loading current user:', error);
    }
  }

  function setupRoleBasedMenu() {
    const sidemenuItems = document.querySelectorAll('.sidemenu-item');
    
    sidemenuItems.forEach(item => {
      const action = item.dataset.action;
      
      // "Alle Tickets" - nur für Admin und Support
      if (action === 'show-all') {
        if (currentUserRole === ROLE_USER) {
          item.style.display = 'none';
        } else {
          item.style.display = '';
        }
      }
      
      // "Benutzerverwaltung" - nur für Admin
      if (action === 'user-management') {
        if (currentUserRole === ROLE_ADMIN) {
          item.style.display = '';
        } else {
          item.style.display = 'none';
        }
      }
      
      // "Startseite" - für alle sichtbar
      if (action === 'home') {
        item.style.display = '';
      }
    });
  }

  async function loadAllUsers() {
    try {
      const res = await window.api.getUsers();
      if (res && res.success && res.data) {
        allUsers = res.data;
        
        // Show/hide assignee dropdown based on role
        if (currentUserRole === ROLE_ADMIN || currentUserRole === ROLE_SUPPORT) {
          assigneeRow.style.display = '';
          populateAssigneeDropdown();
        } else {
          // Hide for normal users
          assigneeRow.style.display = 'none';
        }
      }
    } catch (error) {
      console.error('Error loading users:', error);
    }
  }

  function populateAssigneeDropdown() {
    // Only show Admin and Support users
    const supportUsers = allUsers.filter(u => u.rolle_id === ROLE_ADMIN || u.rolle_id === ROLE_SUPPORT);
    
    // Clear existing options except the first one
    while (assigneeInput.options.length > 1) {
      assigneeInput.remove(1);
    }
    
    supportUsers.forEach(user => {
      const option = document.createElement('option');
      option.value = user.benutzer_id;
      option.textContent = `${user.vorname} ${user.nachname}`;
      assigneeInput.appendChild(option);
    });
  }

  async function loadTickets() {
    if (isLoadingTickets) {
      return;
    }
    
    isLoadingTickets = true;
    
    try {
      ticketsUl.innerHTML = '<li>Lade...</li>';
      let res;
      
      // Load tickets for home page using the new function
      res = await window.api.getHomeTickets(currentUserId, currentUserRole);
      
      if (!res.success) {
        ticketsUl.innerHTML = `<li class="error">Fehler: ${res.error}</li>`;
        return;
      }
      ticketsCache = res.data || [];
      
      if (ticketsCache.length === 0) {
        ticketsUl.innerHTML = '<li>Keine Tickets gefunden.</li>';
        updatePagination();
        updateStatistics();
        return;
      }
      
      // Apply current filter and render
      if (currentStatusFilter === 'all') {
        filteredTickets = ticketsCache;
      } else {
        filteredTickets = ticketsCache.filter(t => t.status === currentStatusFilter);
      }
      
      updateStatistics();
      currentPage = 1;
      renderPage(currentPage);
    } finally {
      isLoadingTickets = false;
    }
  }

  async function loadAllTickets() {
    if (isLoadingTickets) {
      return;
    }
    
    isLoadingTickets = true;
    
    try {
      ticketsUl.innerHTML = '<li>Lade...</li>';
      let res;
      
      // Load ALL tickets
      res = await window.api.getTickets();
      
      if (!res.success) {
        ticketsUl.innerHTML = `<li class="error">Fehler: ${res.error}</li>`;
        return;
      }
      ticketsCache = res.data || [];
      
      if (ticketsCache.length === 0) {
        ticketsUl.innerHTML = '<li>Keine Tickets gefunden.</li>';
        updatePagination();
        updateStatistics();
        return;
      }
      
      // Apply current filter and render
      if (currentStatusFilter === 'all') {
        filteredTickets = ticketsCache;
      } else {
        filteredTickets = ticketsCache.filter(t => t.status === currentStatusFilter);
      }
      
      updateStatistics();
      currentPage = 1;
      renderPage(currentPage);
    } finally {
      isLoadingTickets = false;
    }
  }

  function updateHomeSubtitle() {
    const subtitle = document.getElementById('homeSubtitle');
    if (currentView === 'all') {
      subtitle.textContent = 'Alle Tickets im System';
    } else if (currentUserRole === ROLE_ADMIN || currentUserRole === ROLE_SUPPORT) {
      subtitle.textContent = 'Ihnen zugewiesene Tickets';
    } else if (currentUserRole === ROLE_USER) {
      subtitle.textContent = 'Von Ihnen erstellte Tickets';
    } else {
      subtitle.textContent = 'Ihre Tickets';
    }
  }

  function applyFilter(filterStatus) {
    currentStatusFilter = filterStatus;
    if (filterStatus === 'all') {
      filteredTickets = ticketsCache;
    } else {
      filteredTickets = ticketsCache.filter(t => t.status === filterStatus);
    }
    updateTicketCount();
    currentPage = 1;
    renderPage(1);
    
    // Update active stat card
    const statCards = document.querySelectorAll('.stat-card');
    statCards.forEach(card => {
      const filter = card.getAttribute('data-filter');
      if (filter === filterStatus) {
        card.classList.add('active');
      } else {
        card.classList.remove('active');
      }
    });
  }

  function updateTicketCount() {
    // This is just stats, not a subtitle anymore
    updateStatistics();
  }

  function updateStatistics() {
    // Calculate statistics from ticketsCache (not filtered)
    const total = ticketsCache.length;
    const offen = ticketsCache.filter(t => t.status === 'Offen').length;
    const bearbeitung = ticketsCache.filter(t => t.status === 'In Bearbeitung').length;
    const geschlossen = ticketsCache.filter(t => t.status === 'Geschlossen').length;

    // Update statistics display
    const statTotal = document.getElementById('statTotal');
    const statOffen = document.getElementById('statOffen');
    const statBearbeitung = document.getElementById('statBearbeitung');
    const statGeschlossen = document.getElementById('statGeschlossen');

    if (statTotal) statTotal.textContent = total;
    if (statOffen) statOffen.textContent = offen;
    if (statBearbeitung) statBearbeitung.textContent = bearbeitung;
    if (statGeschlossen) statGeschlossen.textContent = geschlossen;
  }

  async function renderPage(page) {
    ticketsUl.innerHTML = '<li>⏳ Lade...</li>';
    const total = filteredTickets.length;
    const totalPages = Math.max(1, Math.ceil(total / TICKETS_PER_PAGE));
    if (page < 1) page = 1;
    if (page > totalPages) page = totalPages;
    currentPage = page;

    const start = (page - 1) * TICKETS_PER_PAGE;
    const end = Math.min(start + TICKETS_PER_PAGE, total);
    const pageRows = filteredTickets.slice(start, end);

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

      li.innerHTML = `<a href="ticketdetail.html?id=${t.ticket_id}&uid=${currentUserId}"><strong>[${escapeHtml(t.status)}] ${escapeHtml(t.titel)}</strong></a><div class="ticket-meta">${metaParts.join('')}</div>`;
      ticketsUl.appendChild(li);
    }

    updatePagination();
  }

  function updatePagination() {
    const total = filteredTickets.length;
    const totalPages = Math.max(1, Math.ceil(total / TICKETS_PER_PAGE));
    pageInfo.textContent = `Seite ${currentPage} / ${totalPages}`;
    prevBtn.disabled = currentPage <= 1;
    nextBtn.disabled = currentPage >= totalPages;
  }

  function escapeHtml(s) {
    if (!s) return '';
    return s.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
  }

  // Search functionality
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase();
      if (!query) {
        if (currentStatusFilter === 'all') {
          filteredTickets = ticketsCache;
        } else {
          filteredTickets = ticketsCache.filter(t => t.status === currentStatusFilter);
        }
      } else {
        const baseTickets = currentStatusFilter === 'all' 
          ? ticketsCache 
          : ticketsCache.filter(t => t.status === currentStatusFilter);
        filteredTickets = baseTickets.filter(t => 
          t.titel.toLowerCase().includes(query) ||
          t.beschreibung.toLowerCase().includes(query) ||
          t.status.toLowerCase().includes(query)
        );
      }
      updateTicketCount();
      currentPage = 1;
      renderPage(1);
    });
  }

  // Stat card filtering
  const statCards = document.querySelectorAll('.stat-card');
  statCards.forEach(card => {
    card.addEventListener('click', () => {
      const filter = card.getAttribute('data-filter');
      applyFilter(filter);
    });
  });

  refreshBtn.addEventListener('click', loadTickets);
  prevBtn.addEventListener('click', () => renderPage(currentPage - 1));
  nextBtn.addEventListener('click', () => renderPage(currentPage + 1));

  createBtn.addEventListener('click', async () => {
    const title = titleInput.value.trim();
    const description = descInput.value.trim();
    const category = cateInput.value;
    // Only allow assignee for Admin and Support
    const assigneeId = (currentUserRole === ROLE_ADMIN || currentUserRole === ROLE_SUPPORT) 
      ? (assigneeInput.value || null) 
      : null;
    
    if (!title) {
      createResult.textContent = 'Bitte Betreff eingeben.';
      createResult.style.color = '#dc2626';
      return;
    }
    if (!description) {
      createResult.textContent = 'Bitte Beschreibung eingeben.';
      createResult.style.color = '#dc2626';
      return;
    }
    if (!category) {
      createResult.textContent = 'Bitte Kategorie wählen.';
      createResult.style.color = '#dc2626';
      return;
    }
    
    createResult.textContent = 'Erstelle...';
    createResult.style.color = '#1e40af';
    const res = await window.api.createTicket({ 
      title, 
      description, 
      customer_id: currentUserId, 
      category, 
      status: "Offen",
      assigned_to: assigneeId
    });
    if (res.success) {
      createResult.textContent = `Ticket erstellt (ID ${res.id}).`;
      createResult.style.color = '#166534';
      titleInput.value = '';
      descInput.value = '';
      cateInput.value = '';
      assigneeInput.value = '';
      setTimeout(() => {
        loadTickets();
        // Go back to home view
        const homeBtn = document.querySelector('[data-action="home"]');
        if (homeBtn) homeBtn.click();
      }, 1000);
    } else {
      createResult.textContent = `Fehler: ${res.error}`;
      createResult.style.color = '#991b1b';
    }
  });

  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      window.location.href = 'login.html';
    });
  }

  // Side menu navigation
  const sidemenuItems = document.querySelectorAll('.sidemenu-item');
  const viewSections = document.querySelectorAll('.view');

  sidemenuItems.forEach((item) => {
    item.addEventListener('click', (e) => {
      if (item.disabled) return;
      if (item.style.display === 'none') return; // Skip hidden items
      
      const action = item.dataset.action;
      
      // Handle navigation
      if (action === 'user-management') {
        window.location.href = `usermanagement.html?id=${currentUserId}`;
        return;
      }
      
      // Update active state
      sidemenuItems.forEach((i) => i.classList.remove('active'));
      item.classList.add('active');
      
      // Hide all views
      viewSections.forEach((view) => view.classList.add('hidden'));
      
      // Show appropriate view
      if (action === 'home') {
        currentView = 'home';
        document.getElementById('home').classList.remove('hidden');
        updateHomeSubtitle();
        loadTickets();
      } else if (action === 'show-all') {
        currentView = 'all';
        document.getElementById('home').classList.remove('hidden');
        updateHomeSubtitle();
        loadAllTickets();
      } else if (action === 'create-ticket') {
        document.getElementById('new-ticket').classList.remove('hidden');
      }
    });
  });

  // initial load
  setTimeout(() => {
    currentView = 'home';
    updateHomeSubtitle();
    loadTickets();
    // Activate home button
    const homeBtn = document.querySelector('[data-action="home"]');
    if (homeBtn) homeBtn.classList.add('active');
  }, 100);
});