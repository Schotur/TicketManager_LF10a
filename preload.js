const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  getTickets: async () => ipcRenderer.invoke('tickets:getAll'),
  createTicket: async (ticket) => ipcRenderer.invoke('tickets:create', ticket),
  createComment: async (comment) => ipcRenderer.invoke('comments:create', comment),
  getUser: async (erstellt_von) => ipcRenderer.invoke('user:get', erstellt_von)
});
