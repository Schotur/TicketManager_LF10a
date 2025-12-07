const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  getTickets: async () => ipcRenderer.invoke('tickets:getAll'),
  getAssignedTickets: async (user_id) => ipcRenderer.invoke('tickets:getAssigned', user_id),
  getTicketsByCreator: async (user_id) => ipcRenderer.invoke('tickets:getByCreator', user_id),
  getHomeTickets: async (user_id, role_id) => ipcRenderer.invoke('tickets:getHome', user_id, role_id),
  getTicketById: async (ticket_id) => ipcRenderer.invoke('ticket:getById', ticket_id),
  createTicket: async (ticket) => ipcRenderer.invoke('tickets:create', ticket),
  updateTicket: async (ticket_id, updatedData) => ipcRenderer.invoke('ticket:update', ticket_id, updatedData),
  deleteTicket: async (ticket_id) => ipcRenderer.invoke('ticket:delete', ticket_id),
  createComment: async (comment) => ipcRenderer.invoke('comments:create', comment),
  getCommentsByTicket: async (ticket_id) => ipcRenderer.invoke('comments:getByTicket', ticket_id),
  getUser: async (erstellt_von) => ipcRenderer.invoke('user:get', erstellt_von),
  getUserByEmail: async (email) => ipcRenderer.invoke('user:getByEmail', email),
  getUsers: async () => ipcRenderer.invoke('users:getAll'),
  createUser: async (userData) => ipcRenderer.invoke('user:create', userData),
  updateUser: async (user_id, userData) => ipcRenderer.invoke('user:update', user_id, userData),
  deleteUser: async (user_id) => ipcRenderer.invoke('user:delete', user_id),
  getRoles: async () => ipcRenderer.invoke('roles:getAll')
});

