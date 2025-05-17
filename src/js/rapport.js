document.addEventListener('DOMContentLoaded', () => {
    const typeRapportSelect = document.getElementById('type-rapport');
    const genererRapportBtn = document.getElementById('generer-rapport-btn');
    const rapportContainer = document.getElementById('rapport-container');
    const dateSpecifiqueContainer = document.getElementById('date-specifique-container');
    const periodeSpecifiqueContainer = document.getElementById('periode-specifique-container');
    const dateUniqueInput = document.getElementById('date-unique');
    const dateDebutInput = document.getElementById('date-debut');
    const dateFinInput = document.getElementById('date-fin');
    const chartContainer = document.getElementById('ventesChart'); // Récupérer le conteneur du graphique

    // Fonction pour récupérer les données de vente depuis le localStorage
    function getVentes() {
        const ventesString = localStorage.getItem('ventes');
        return ventesString ? JSON.parse(ventesString) : [];
    }

    // Fonction pour formater une date
    function formatDate(dateString) {
        const date = new Date(dateString);
        const jour = date.getDate().toString().padStart(2, '0');
        const mois = (date.getMonth() + 1).toString().padStart(2, '0');
        const annee = date.getFullYear();
        return `${annee}-${mois}-${jour}`;
    }

    // Fonction pour filtrer les ventes par date ou période
    function filtrerVentes(ventes, typeRapport, dateUnique, dateDebut, dateFin) {
        return ventes.filter(vente => {
            const venteDate = new Date(vente.dateVente);
            const dateUniqueObj = dateUnique ? new Date(dateUnique) : null;
            const dateDebutObj = dateDebut ? new Date(dateDebut) : null;
            const dateFinObj = dateFin ? new Date(dateFin) : null;

            switch (typeRapport) {
                case 'jour':
                    return dateUniqueObj &&
                           venteDate.getFullYear() === dateUniqueObj.getFullYear() &&
                           venteDate.getMonth() === dateUniqueObj.getMonth() &&
                           venteDate.getDate() === dateUniqueObj.getDate();
                case 'periode':
                    return dateDebutObj && dateFinObj &&
                           venteDate >= dateDebutObj && venteDate <= dateFinObj;
                default: // 'mois' ou 'annee' - le filtrage se fera dans grouperVentes
                    return true;
            }
        });
    }

    // Fonction pour grouper les ventes par période
    function grouperVentes(ventesFiltrees, typeRapport) {
        const groupes = {};
        if (typeRapport === 'jour' || typeRapport === 'periode') {
            ventesFiltrees.forEach(vente => {
                const dateFormatee = formatDate(vente.dateVente);
                if (!groupes[dateFormatee]) {
                    groupes[dateFormatee] = [];
                }
                groupes[dateFormatee].push(vente);
            });
        } else if (typeRapport === 'mois' || typeRapport === 'annee') {
            ventesFiltrees.forEach(vente => {
                const date = new Date(vente.dateVente);
                const annee = date.getFullYear();
                const mois = (date.getMonth() + 1).toString().padStart(2, '0');
                const semaine = getWeekNumber(date);
                const cle = typeRapport === 'mois' ? `${annee}-${mois}` : `${annee}`;
                if (!groupes[cle]) {
                    groupes[cle] = [];
                }
                groupes[cle].push(vente);
            });
        }
        return groupes;
    }

    // Fonction pour obtenir le numéro de semaine
    function getWeekNumber(d) {
        d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
        d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
        return weekNo;
    }

    // Fonction pour trouver le mode de paiement dominant
    function getModeDominant(modes) {
        if (modes.length === 0) return null;
        const modeCount = {};
        modes.forEach(mode => {
            modeCount[mode] = (modeCount[mode] || 0) + 1;
        });
        let dominantMode;
        let maxCount = 0;
        for (const mode in modeCount) {
            if (modeCount[mode] > maxCount) {
                dominantMode = mode;
                maxCount = modeCount[mode];
            }
        }
        return dominantMode;
    }

    // Fonction pour générer les statistiques et le graphique
    function genererStatistiques(ventesGroupees, typeRapport) {
        let rapportHTML = '';
        const labels = [];
        const totalNetAmounts = [];

        for (const periode in ventesGroupees) {
            const ventes = ventesGroupees[periode];
            const nombreTotalVentes = ventes.length;
            const quantiteTotaleVendue = ventes.reduce((sum, vente) => sum + vente.quantite, 0);
            const montantNetTotal = ventes.reduce((sum, vente) => sum + vente.montantNet, 0);
            const montantRecuTotal = ventes.reduce((sum, vente) => sum + vente.montantRecu, 0);
            const modesPaiement = ventes.map(vente => vente.modePaiement);
            const modePaiementDominant = getModeDominant(modesPaiement);

            rapportHTML += `<h3>Période: ${periode}</h3>`;
            rapportHTML += `<p>Nombre Total de Ventes: ${nombreTotalVentes}</p>`;
            rapportHTML += `<p>Quantité Totale Vendue: ${quantiteTotaleVendue}</p>`;
            rapportHTML += `<p>Montant Net Total Vendu: ${montantNetTotal.toFixed(2)}</p>`;
            rapportHTML += `<p>Montant Total Reçu: ${montantRecuTotal.toFixed(2)}</p>`;
            rapportHTML += `<p>Mode de Paiement Dominant: ${modePaiementDominant || 'N/A'}</p>`;
            rapportHTML += '<hr>';

            labels.push(periode);
            totalNetAmounts.push(montantNetTotal);
        }

        // Afficher le rapport textuel
        rapportContainer.innerHTML = rapportHTML || '<p>Aucune vente enregistrée pour la période sélectionnée.</p>';

        // Créer ou mettre à jour le graphique s'il y a des données et un conteneur
        if (chartContainer && labels.length > 0) {
            if (window.ventesChartInstance) {
                window.ventesChartInstance.destroy(); // Détruire l'ancienne instance si elle existe
            }
            window.ventesChartInstance = new Chart(chartContainer, {
                type: 'bar', // Type de graphique par défaut
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Montant Net Total des Ventes',
                        data: totalNetAmounts,
                        backgroundColor: 'rgba(54, 162, 235, 0.8)',
                        borderColor: 'rgba(54, 162, 235, 1)',
                        borderWidth: 1
                    }]
                },
                options: {
                    scales: {
                        y: {
                            beginAtZero: true,
                            title: {
                                display: true,
                                text: 'Montant Net'
                            }
                        },
                        x: {
                            title: {
                                display: true,
                                text: 'Période'
                            }
                        }
                    },
                    plugins: {
                        title: {
                            display: true,
                            text: `Montant Total des Ventes par ${typeRapport === 'jour' ? 'Jour' : (typeRapport === 'periode' ? 'Période' : (typeRapport === 'mois' ? 'Mois' : 'Année'))}`,
                            font: {
                                size: 16
                            }
                        },
                        legend: {
                            display: false
                        }
                    }
                }
            });
        } else if (chartContainer) {
            chartContainer.innerHTML = '<p>Aucune donnée à afficher pour le graphique.</p>';
        }
    }

    // Écouteur d'événement pour afficher/cacher les conteneurs de date
    typeRapportSelect.addEventListener('change', () => {
        dateSpecifiqueContainer.style.display = typeRapportSelect.value === 'jour' ? 'block' : 'none';
        periodeSpecifiqueContainer.style.display = typeRapportSelect.value === 'periode' ? 'block' : 'none';
    });

    genererRapportBtn.addEventListener('click', () => {
        const typeRapportChoisi = typeRapportSelect.value;
        const dateUniqueChoisie = dateUniqueInput.value;
        const dateDebutChoisie = dateDebutInput.value;
        const dateFinChoisie = dateFinInput.value;

        const toutesLesVentes = getVentes();
        const ventesFiltrees = filtrerVentes(toutesLesVentes, typeRapportChoisi, dateUniqueChoisie, dateDebutChoisie, dateFinChoisie);
        const ventesGroupées = grouperVentes(ventesFiltrees, typeRapportChoisi);
        genererStatistiques(ventesGroupées, typeRapportChoisi);
    });

    // Au chargement de la page, afficher un rapport mensuel par défaut (avec graphique)
    const typeRapportInitial = typeRapportSelect.value;
    const ventesInitiales = getVentes();
    const ventesInitialesFiltrees = filtrerVentes(ventesInitiales, typeRapportInitial, '', '', '');
    const ventesInitialesGroupées = grouperVentes(ventesInitialesFiltrees, typeRapportInitial);
    genererStatistiques(ventesInitialesGroupées, typeRapportInitial);
});