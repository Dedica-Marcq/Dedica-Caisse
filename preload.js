const btnEspeces = Array.from(document.querySelectorAll('.actions button'))
  .find(b => b.textContent.trim().toLowerCase() === 'espèces');
if (btnEspeces) btnEspeces.addEventListener('click', () => finaliserVente('espèces'));

const btnCheque = Array.from(document.querySelectorAll('.actions button'))
  .find(b => b.textContent.trim().toLowerCase() === 'chèque');
if (btnCheque) btnCheque.addEventListener('click', () => finaliserVente('chèque'));

const btnCB = Array.from(document.querySelectorAll('.actions button'))
  .find(b => b.textContent.trim().toLowerCase() === 'carte bleue');
if (btnCB) btnCB.addEventListener('click', () => finaliserVente('cb'));