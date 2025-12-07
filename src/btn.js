document.addEventListener('DOMContentLoaded', function () {
  const button = document.getElementById('createTicketBtn');
  button.addEventListener('click', function () {
    // Get current user ID from URL and keep it when navigating
    const urlParams = new URLSearchParams(window.location.search);
    const userId = urlParams.get('id');
    if (userId) {
      window.location.href = `index.html?id=${userId}`;
    } else {
      window.location.href = 'index.html';
    }
  });
  
const urlParams = new URLSearchParams(window.location.search);
const ticketId = urlParams.get('id');

console.log("Ticket ID:", ticketId);
});