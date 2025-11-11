// rapport.js — Script de génération du tableau de bord des rapports

document.addEventListener("DOMContentLoaded", async () => {
  try {
    const data = await window.api.getStats();
    if (!data) throw new Error("Aucune donnée reçue.");

    // Calcul du chiffre d'affaires
    const chiffreAffaire = data.ventes.reduce((sum, v) => sum + Number(v.total), 0);
    
    // Calcul du panier moyen
    const panierMoyen = data.ventes.length > 0 ? chiffreAffaire / data.ventes.length : 0;

    // Calcul des pourcentages de paiement
    const totalVentes = data.ventes.length;
    const paiements = {
      cb: 0,
      cheque: 0,
      especes: 0
    };

    data.ventes.forEach(v => {
      switch (v.mode_paiement) {
        case 'Carte Bleue':
          paiements.cb++;
          break;
        case 'Chèque':
          paiements.cheque++;
          break;
        case 'Espèces':
          paiements.especes++;
          break;
      }
    });

    // Conversion en pourcentages
    if (totalVentes > 0) {
      paiements.cb = (paiements.cb / totalVentes) * 100;
      paiements.cheque = (paiements.cheque / totalVentes) * 100;
      paiements.especes = (paiements.especes / totalVentes) * 100;
    }

    // Format des articles pour l'affichage
    const topArticles = data.topArticles.map(a => ({
      nom: a.nom,
      quantite: Number(a.quantite)
    }));

    // Affichage des statistiques
    afficherChiffreAffaire({ chiffreAffaire });
    afficherPanierMoyen({ panierMoyen });
    afficherPaiements({ paiements });
    afficherTopArticles({ topArticles });

  } catch (error) {
    console.error("Erreur lors du chargement des statistiques :", error);
  }
});

function afficherChiffreAffaire(stats) {
  const montant = !stats.chiffreAffaire && stats.chiffreAffaire !== 0 
    ? 0 
    : Number(stats.chiffreAffaire);

  document.getElementById("chiffre-affaire").textContent = montant.toLocaleString('fr-FR', {
    style: 'currency',
    currency: 'EUR'
  });
}

function afficherPanierMoyen(stats) {
  const montant = !stats.panierMoyen && stats.panierMoyen !== 0 
    ? 0 
    : Number(stats.panierMoyen);

  document.getElementById("panier-moyen").textContent = montant.toLocaleString('fr-FR', {
    style: 'currency',
    currency: 'EUR'
  });
}

function afficherPaiements(stats) {
  const ctx = document.getElementById("chart-paiements");
  
  if (window.chartPaiements) {
    window.chartPaiements.destroy();
  }

  // Arrondir les pourcentages à 1 décimale
  const cb = stats.paiements.cb ? Number(stats.paiements.cb).toFixed(1) : 0;
  const cheque = stats.paiements.cheque ? Number(stats.paiements.cheque).toFixed(1) : 0;
  const especes = stats.paiements.especes ? Number(stats.paiements.especes).toFixed(1) : 0;

  window.chartPaiements = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: [`Carte Bleue (${cb}%)`, `Chèque (${cheque}%)`, `Espèces (${especes}%)`],
      datasets: [{
        data: [cb, cheque, especes],
        backgroundColor: [
          'rgba(54, 162, 235, 0.8)',   // Bleu pour CB
          'rgba(255, 206, 86, 0.8)',   // Jaune pour Chèque
          'rgba(75, 192, 192, 0.8)'    // Turquoise pour Espèces
        ],
        borderColor: [
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)'
        ],
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      layout: {
        padding: 20
      },
      plugins: {
        legend: {
          position: "right", // Déplace la légende à droite pour plus de lisibilité
          labels: {
            padding: 20,
            boxWidth: 12,
            font: {
              size: 12
            },
            generateLabels: function(chart) {
              const data = chart.data;
              return data.labels.map((label, i) => ({
                text: label,
                fillStyle: data.datasets[0].backgroundColor[i],
                strokeStyle: data.datasets[0].backgroundColor[i],
                lineWidth: 1,
                hidden: isNaN(data.datasets[0].data[i]) || data.datasets[0].data[i] === 0
              }));
            }
          }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              return ` ${context.label}: ${context.raw}%`;
            }
          }
        }
      }
    }
  });
}

function afficherTopArticles(stats) {
  const ctx = document.getElementById("chart-top-articles");
  
  // Destruction du graphique précédent s'il existe
  if (window.chartTopArticles) {
    window.chartTopArticles.destroy();
  }

  window.chartTopArticles = new Chart(ctx, {
    type: "bar",
    data: {
      labels: stats.topArticles.map(a => a.nom),
      datasets: [{
        label: "Quantité vendue",
        data: stats.topArticles.map(a => Number(a.quantite) || 0),
        backgroundColor: [
          'rgba(54, 162, 235, 0.7)',
          'rgba(75, 192, 192, 0.7)',
          'rgba(255, 206, 86, 0.7)',
          'rgba(153, 102, 255, 0.7)',
          'rgba(255, 159, 64, 0.7)'
        ],
        borderColor: [
          'rgba(54, 162, 235, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(153, 102, 255, 1)',
          'rgba(255, 159, 64, 1)'
        ],
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      layout: {
        padding: {
          top: 20,
          bottom: 20
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            stepSize: 1,
            font: {
              size: 12
            }
          }
        },
        x: {
          ticks: {
            maxRotation: 45,
            minRotation: 45,
            font: {
              size: 11
            }
          }
        }
      },
      plugins: {
        legend: {
          display: false
        },
        title: {
          display: true,
          text: "Top 5 des articles les plus vendus",
          font: {
            size: 14,
            weight: 'bold'
          },
          color: '#2c3e50'  // Couleur du titre
        }
      }
    }
  });
}