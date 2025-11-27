const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  getTickets: async () => ipcRenderer.invoke('tickets:getAll'),
  getTicketById: async (ticket_id) => ipcRenderer.invoke('ticket:getById', ticket_id),
  createTicket: async (ticket) => ipcRenderer.invoke('tickets:create', ticket),
  updateTicket: async (ticket_id, updatedData) => ipcRenderer.invoke('ticket:update', ticket_id, updatedData),
  createComment: async (comment) => ipcRenderer.invoke('comments:create', comment),
  getUser: async (erstellt_von) => ipcRenderer.invoke('user:get', erstellt_von),
  getUserByEmail: async (email) => ipcRenderer.invoke('user:getByEmail', email)
});
