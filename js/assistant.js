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
    // Empêcher d'aller à l'étape 3 si la BDD n'est pas prête
    b.addEventListener('click', (e) => {
      const target = Number(b.dataset.step);
      if (target === 3 && !dbReady) {
        e.preventDefault();
        alert("Veuillez d'abord configurer et vérifier la base de données.");
        return;
      }
      showStep(target);
    });
  });

  // quick navigation buttons
  document.getElementById('to-step-2').addEventListener('click', ()=> showStep(2));
  document.getElementById('to-step-3').addEventListener('click', (e) => {
    const btn = e.currentTarget;
    // Double garde: désactivé OU BDD non prête
    if (btn.disabled || !dbReady) {
      e.preventDefault();
      alert("Veuillez d'abord configurer et vérifier la base de données.");
      return;
    }
    showStep(3);
  });
  document.getElementById('to-step-4').addEventListener('click', ()=> showStep(4));
  document.getElementById('back-step-1').addEventListener('click', ()=> showStep(1));
  document.getElementById('back-step-2').addEventListener('click', ()=> showStep(2));

  // DB actions - éléments de la page
  const formCreate = document.getElementById('form-create-db');
  const btnCreateDb = document.getElementById('btn-create-db');
  const createStatusEl = document.getElementById('create-db-status');
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

  async function showCreateStatus(text, ok=true) {
    createStatusEl.textContent = text;
    createStatusEl.style.color = ok ? 'green' : 'crimson';
  }

  // Bouton créer la base de données
  if (btnCreateDb) {
    btnCreateDb.addEventListener('click', async () => {
      const config = readCreateForm();
      
      // Validation
      if (!config.host || !config.user || !config.database) {
        showCreateStatus('❌ Veuillez remplir tous les champs requis', false);
        return;
      }

      btnCreateDb.disabled = true;
      showCreateStatus('⏳ Test de connexion en cours...', true);

      try {
        // Tester la connexion
        const testResult = await window.api.testDbConnection(config);
        
        if (testResult.success && testResult.connected) {
          // Connexion réussie, sauvegarder la config
          const saveResult = await window.api.saveDbConfig(config);
          
          if (saveResult.success) {
            showCreateStatus('✅ Configuration sauvegardée avec succès !', true);
            setNextEnabled(true);
          } else {
            showCreateStatus('❌ Erreur lors de la sauvegarde : ' + (saveResult.error || 'Inconnu'), false);
            setNextEnabled(false);
          }
        } else {
          showCreateStatus('❌ Impossible de se connecter : ' + (testResult.error || 'Vérifiez vos informations'), false);
          setNextEnabled(false);
        }
      } catch (err) {
        console.error('Erreur:', err);
        showCreateStatus('❌ Erreur : ' + err.message, false);
        setNextEnabled(false);
      } finally {
        btnCreateDb.disabled = false;
      }
    });
  }
  
  // final actions buttons
  document.getElementById('btn-open-caisse').addEventListener('click', async () => {
    if (window.api && window.api.openCaisse) {
      await window.api.openCaisse();
    }
  });
  
  document.getElementById('btn-open-articles').addEventListener('click', async () => {
    if (window.api && window.api.openArticles) {
      await window.api.openArticles();
    }
  });

  // init
  setNextEnabled(false);
  showStep(1);
})();