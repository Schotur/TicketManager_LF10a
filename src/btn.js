document.addEventListener('DOMContentLoaded', function () {
  const button = document.getElementById('createTicketBtn');
  button.addEventListener('click', function () {
    window.location.href = 'index.html';
  });
  
const urlParams = new URLSearchParams(window.location.search);
const ticketId = urlParams.get('id');

console.log("Ticket ID:", ticketId);
});