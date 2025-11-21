// message.js - Système de messagerie entre utilisateurs

document.addEventListener('DOMContentLoaded', () => {
  const btnMessage = document.getElementById('btn-message');
  const messagePopup = document.getElementById('message-popup');
  const messageInput = document.getElementById('message-input');
  const messageSendBtn = document.getElementById('message-send-btn');
  const messageCancelBtn = document.getElementById('message-cancel-btn');

  // Ouvrir la popup
  if (btnMessage) {
    btnMessage.addEventListener('click', () => {
      messagePopup.style.display = 'flex';
      messageInput.value = '';
      messageInput.focus();
    });
  }

  // Fermer la popup
  if (messageCancelBtn) {
    messageCancelBtn.addEventListener('click', () => {
      messagePopup.style.display = 'none';
    });
  }

  // Envoyer le message
  if (messageSendBtn) {
    messageSendBtn.addEventListener('click', async () => {
      const message = messageInput.value.trim();
      
      if (!message) {
        alert('Veuillez saisir un message.');
        return;
      }

      try {
        const result = await window.api.sendMessage(message);
        
        if (result.success) {
          messagePopup.style.display = 'none';
          messageInput.value = '';
          showNotification('Message envoyé', `Votre message a été diffusé à tous les utilisateurs.`);
        } else {
          alert('Erreur lors de l\'envoi du message.');
        }
      } catch (error) {
        console.error('Erreur lors de l\'envoi du message:', error);
        alert('Erreur lors de l\'envoi du message.');
      }
    });
  }

  // Écouter les messages entrants
  if (window.api && window.api.receive) {
    window.api.receive('new-message', (data) => {
      showNotification('Nouveau message', data.message);
    });
  }
});

// Fonction pour afficher une notification
function showNotification(title, message) {
  // Créer la notification
  const notification = document.createElement('div');
  notification.className = 'message-notification';
  notification.innerHTML = `
    <div class="notification-header">
      <i class="bi bi-bell-fill"></i>
      <strong>${title}</strong>
      <button class="notification-close">&times;</button>
    </div>
    <div class="notification-body">${message}</div>
  `;

  // Ajouter au DOM
  document.body.appendChild(notification);

  // Animer l'apparition
  setTimeout(() => notification.classList.add('show'), 10);

  // Bouton de fermeture
  const closeBtn = notification.querySelector('.notification-close');
  closeBtn.addEventListener('click', () => {
    notification.classList.remove('show');
    setTimeout(() => notification.remove(), 300);
  });

  // Fermeture automatique après 10 secondes
  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => notification.remove(), 300);
  }, 10000);
}
