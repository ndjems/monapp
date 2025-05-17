document.addEventListener('DOMContentLoaded', function() {
    const periodeDebutInput = document.getElementById('periode-debut');
    const periodeFinInput = document.getElementById('periode-fin');
    const calculerEtatBtn = document.getElementById('calculer-etat-btn');

    const sommeTotalePercueSpan = document.getElementById('sommeTotalePercue');
    const totalFraisAcquisitionSpan = document.getElementById('totalFraisAcquisition');
    const beneficePerteSpan = document.getElementById('beneficePerte');
    const fondsTotalActuelSpan = document.getElementById('fondsTotalActuel');

    calculerEtatBtn.addEventListener('click', function() {
        const dateDebut = periodeDebutInput.value;
        const dateFin = periodeFinInput.value;

        if (!dateDebut || !dateFin) {
            alert("Veuillez sélectionner une période de début et de fin.");
            return;
        }

        const { fondsActuel, ventes, acquisitions } = getEtatFondsEtStocks(dateDebut, dateFin);

        // **VOUS DEVEZ ADAPTER CETTE LOGIQUE :**
        // Calculez les valeurs en fonction de vos données et de la période sélectionnée.

        // Filtrer les ventes et les acquisitions par la période sélectionnée
        const ventesPeriode = ventes.filter(vente => isDateWithinRange(vente.dateVente, dateDebut, dateFin));
        const acquisitionsPeriode = acquisitions.filter(achat => isDateWithinRange(achat.dateAcquisition, dateDebut, dateFin));

        const sommeTotalePercue = ventesPeriode.reduce((sum, vente) => sum + vente.montantNet, 0);
        const totalFraisAcquisition = acquisitionsPeriode.reduce((sum, achat) => sum + achat.totalFrais, 0);
        const beneficePerte = sommeTotalePercue - totalFraisAcquisition;

        // Afficher les résultats
        sommeTotalePercueSpan.textContent = sommeTotalePercue.toFixed(2);
        totalFraisAcquisitionSpan.textContent = totalFraisAcquisition.toFixed(2);
        beneficePerteSpan.textContent = beneficePerte.toFixed(2);
        fondsTotalActuelSpan.textContent = fondsActuel.toFixed(2);

        // **ICI : Logique pour générer le diagramme dans la section "statistiques-fonds"**
        // Vous pouvez utiliser une librairie comme Chart.js pour créer un graphique
        // basé sur les 'ventesPeriode' et 'acquisitionsPeriode'.
        // Par exemple, un graphique à barres comparant le total des revenus et le total des dépenses.
        const diagrammeContainer = document.getElementById('diagramme-container');
        diagrammeContainer.innerHTML = '<p>Diagramme des revenus et dépenses pour la période sélectionnée (intégration du graphique ici).</p>';
        // Si vous utilisez Chart.js, vous ajouteriez un élément <canvas> à 'diagramme-container'
        // et initialiseriez un graphique ici avec les données calculées.
    });

    // **VOUS DEVEZ IMPLEMENTER CETTE FONCTION SELON VOTRE APPLICATION :**
    function getEtatFondsEtStocks(dateDebut, dateFin) {
        // Récupérer le fonds actuel (qui peut être statique ou calculé)
        const fondsActuel = getFondsActuelFromSomewhere() || 0;

        // Récupérer les données de ventes et d'acquisitions pour la période spécifiée
        const ventes = getVentesSurPeriode(dateDebut, dateFin);
        const acquisitions = getAcquisitionsSurPeriode(dateDebut, dateFin);

        return { fondsActuel, ventes, acquisitions };
    }

    // **VOUS DEVEZ IMPLEMENTER CES FONCTIONS SELON VOTRE APPLICATION :**
    function getFondsActuelFromSomewhere() {
        // Récupérer le fonds actuel (exemple localStorage)
        return parseFloat(localStorage.getItem('fondsActuel')) || 0;
    }

    function getVentesSurPeriode(debut, fin) {
        // Récupérer les données de ventes pour la période (exemple localStorage)
        const ventesString = localStorage.getItem('ventes');
        const ventes = ventesString ? JSON.parse(ventesString) : [];
        // Assurez-vous que vos objets 'vente' ont une propriété 'dateVente'
        return ventes;
    }

    function getAcquisitionsSurPeriode(debut, fin) {
        // Récupérer les données d'acquisitions pour la période (exemple localStorage)
        const acquisitionsString = localStorage.getItem('acquisitions');
        const acquisitions = acquisitionsString ? JSON.parse(acquisitionsString) : [];
        // Assurez-vous que vos objets 'acquisition' ont une propriété 'dateAcquisition'
        return acquisitions;
    }

    function isDateWithinRange(dateStr, debut, fin) {
        const date = new Date(dateStr);
        const startDate = new Date(debut);
        const endDate = new Date(fin);
        return date >= startDate && date <= endDate;
    }
});