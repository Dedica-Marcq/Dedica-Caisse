function updateClock() {
  const now = new Date();
  const heures = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  document.querySelector('.clock').textContent = `${heures}:${minutes}`;
}

// Met à jour immédiatement et toutes les 30 secondes
updateClock();
setInterval(updateClock, 30000);