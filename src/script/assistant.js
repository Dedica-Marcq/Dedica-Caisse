// assistant.js
(() => {
  const navBtns = document.querySelectorAll('.nav-btn');
  const views = document.querySelectorAll('.view');
  const stepIndicator = document.getElementById('step-indicator');

  function showStep(n){
    views.forEach(v => v.hidden = v.dataset.view !== String(n));
    navBtns.forEach(b => b.classList.toggle('active', Number(b.dataset.step) === n));
    stepIndicator.textContent = `Étape ${n} / 4`;
  }

  navBtns.forEach((b, i) => {
    b.dataset.step = i+1;
    // Désactivation des écouteurs de clic pour empêcher la navigation directe
    // b.addEventListener('click', () => showStep(i+1));
  });

  // quick navigation buttons
  document.getElementById('to-step-2').addEventListener('click', ()=> showStep(2));
  document.getElementById('to-step-3').addEventListener('click', (e) => {
    const btn = e.currentTarget;
    if (btn.disabled) return;
    showStep(3);
  });
  document.getElementById('to-step-4').addEventListener('click', ()=> showStep(4));
  document.getElementById('back-step-1').addEventListener('click', ()=> showStep(1));
  document.getElementById('back-step-2').addEventListener('click', ()=> showStep(2));

  // DB actions - éléments de la page
  const modeRadios = document.querySelectorAll('input[name="db-mode"]');
  const formCreate = document.getElementById('form-create-db');
  const formUse = document.getElementById('form-use-db');

  const btnCreateDb = document.getElementById('btn-create-db');
  const btnCheckDb = document.getElementById('btn-check-db');
  const createStatusEl = document.getElementById('create-db-status');
  const checkStatusEl = document.getElementById('check-db-status');
  const nextBtn = document.getElementById('to-step-3');

  let dbReady = false;

  function setNextEnabled(enabled) {
    dbReady = !!enabled;
    if (enabled) {
      nextBtn.disabled = false;
      nextBtn.removeAttribute('aria-disabled');
      nextBtn.classList.remove('disabled');
    } else {
      nextBtn.disabled = true;
      nextBtn.setAttribute('aria-disabled', 'true');
      nextBtn.classList.add('disabled');
    }
  }

  function showMode(mode) {
    // masque/affiche proprement et gère aria-hidden
    formCreate.hidden = mode !== 'create';
    formCreate.setAttribute('aria-hidden', String(mode !== 'create'));
    formUse.hidden = mode !== 'use';
    formUse.setAttribute('aria-hidden', String(mode !== 'use'));

    // style actif pour les labels radios
    document.querySelectorAll('.db-mode-select label').forEach(l => {
      const inp = l.querySelector('input[name="db-mode"]');
      l.classList.toggle('selected', inp && inp.value === mode);
    });

    // reset status when switching mode
    createStatusEl.textContent = '';
    checkStatusEl.textContent = '';
    setNextEnabled(false);

    // focus sur le premier champ du formulaire visible
    if (mode === 'create') {
      const f = formCreate.querySelector('input');
      if (f) f.focus();
    } else {
      const f = formUse.querySelector('input');
      if (f) f.focus();
    }
  }

  // initial mode from radios (default checked in HTML)
  const initial = Array.from(modeRadios).find(r => r.checked);
  showMode(initial ? initial.value : 'create');

  modeRadios.forEach(r => {
    r.addEventListener('change', (e) => {
      showMode(e.target.value);
    });
  });

  // read values helpers
  function readCreateForm() {
    return {
      host: document.getElementById('create-host').value.trim(),
      port: document.getElementById('create-port').value.trim() || '3306',
      user: document.getElementById('create-user').value.trim(),
      password: document.getElementById('create-pass').value,
      database: document.getElementById('create-dbname').value.trim()
    };
  }

  function readUseForm() {
    return {
      host: document.getElementById('use-host').value.trim(),
      port: document.getElementById('use-port').value.trim() || '3306',
      user: document.getElementById('use-user').value.trim(),
      password: document.getElementById('use-pass').value,
      database: document.getElementById('use-dbname').value.trim()
    };
  }

  async function showCreateStatus(text, ok=true) {
    createStatusEl.textContent = text;
    createStatusEl.style.color = ok ? 'green' : 'crimson';
  }

  async function showCheckStatus(text, ok=true) {
    checkStatusEl.textContent = text;
    checkStatusEl.style.color = ok ? 'green' : 'crimson';
  }

  // create database
  btnCreateDb.addEventListener('click', async () => {
    const cfg = readCreateForm();
    showCreateStatus('Création en cours...', true);
    setNextEnabled(false);
    try {
      if (window.api && window.api.createDatabase) {
        const res = await window.api.createDatabase(cfg);
        if (res && res.success) {
          await showCreateStatus('✅ Base créée et structure appliquée.', true);
          setNextEnabled(true);
        } else {
          await showCreateStatus(res && res.message ? res.message : 'Erreur lors de la création', false);
        }
      } else {
        await showCreateStatus('API non disponible — impossible de créer la base depuis le navigateur.', false);
      }
    } catch (err) {
      await showCreateStatus(String(err), false);
    }
  });

// check existing structure
btnCheckDb.addEventListener('click', async () => {
  const cfg = readUseForm();  // Cette ligne peut être conservée si tu veux garder la lecture du formulaire
  checkStatusEl.textContent = '';  // Réinitialise l'affichage de l'état
  setNextEnabled(false);  // Désactive le bouton suivant

  // Simule un comportement "pas de vérification"
  try {
    // Ici, tu n'appelles rien, tu peux simplement afficher un message statique
    checkStatusEl.textContent = '✅ Pas de vérification effectuée.';
    checkStatusEl.style.color = 'green';
    setNextEnabled(true);  // Active le bouton suivant puisque tout est "validé" par défaut
  } catch (err) {
    checkStatusEl.textContent = 'Erreur inconnue.';
    checkStatusEl.style.color = 'crimson';
    setNextEnabled(false);  // Désactive le bouton suivant en cas d'erreur
  }
});

  // final actions buttons
  document.getElementById('btn-open-caisse').addEventListener('click', () => {
    if (window.api && window.api.openCaisse) window.api.openCaisse();
  });
  document.getElementById('btn-open-articles').addEventListener('click', () => {
    if (window.api && window.api.openArticles) window.api.openArticles();
  });

  // init
  setNextEnabled(false);
  showStep(1);
})();