const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  getTickets: async () => ipcRenderer.invoke('tickets:getAll'),
  createTicket: async (ticket) => ipcRenderer.invoke('tickets:create', ticket),
  createComment: async (comment) => ipcRenderer.invoke('comments:create', comment)
});
