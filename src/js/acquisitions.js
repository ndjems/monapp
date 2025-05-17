document.addEventListener('DOMContentLoaded', () => {
    // Sélection des éléments pour les acquisitions
    const acquisitionForm = document.getElementById('acquisition-form');
    const acquisitionsTableBody = document.querySelector('#acquisitions-table tbody');
    const typeAcquisitionSelect = document.getElementById('type-acquisition');
    const datesAcquisitionContainer = document.getElementById('dates-acquisition-container');
    const ajouterDateAcquisitionBtn = document.getElementById('ajouter-date-acquisition');
    const fraisAcquisitionInput = document.getElementById('frais-acquisition');
    const fraisAnnexesInput = document.getElementById('frais-annexes');
    const totalFraisInput = document.getElementById('total-frais');
    const dateAcquisitionInput = document.getElementById('date-acquisition');
    let acquisitions = [];

    // Met à jour le total des frais
    function updateTotalFrais() {
        const fraisAcquisition = parseFloat(fraisAcquisitionInput.value) || 0;
        const fraisAnnexes = parseFloat(fraisAnnexesInput.value) || 0;
        totalFraisInput.value = (fraisAcquisition + fraisAnnexes).toFixed(2);
    }

    // Écoute les changements dans les frais pour mettre à jour le total
    fraisAcquisitionInput.addEventListener('input', updateTotalFrais);
    fraisAnnexesInput.addEventListener('input', updateTotalFrais);

    // Affiche ou masque le conteneur des dates d'acquisition en tranches
    typeAcquisitionSelect.addEventListener('change', () => {
        datesAcquisitionContainer.style.display = typeAcquisitionSelect.value === 'tranches' ? 'block' : 'none';
        // Si on passe à 'totale', on réaffiche le champ de date unique et on le rend obligatoire
        dateAcquisitionInput.style.display = typeAcquisitionSelect.value === 'totale' ? 'block' : 'none';
        dateAcquisitionInput.required = typeAcquisitionSelect.value === 'totale';
    });

    // Ajoute un nouveau champ de date d'acquisition en tranches
    ajouterDateAcquisitionBtn.addEventListener('click', () => {
        const input = document.createElement('input');
        input.type = 'date';
        input.name = 'date-acquisition-tranche[]';
        input.classList.add('date-acquisition-tranche');
        datesAcquisitionContainer.insertBefore(input, ajouterDateAcquisitionBtn);
    });

    // Fonction pour afficher les acquisitions dans le tableau
    function afficherAcquisitions() {
        // Trie les acquisitions par date décroissante (à implémenter si nécessaire)
        // acquisitions.sort((a, b) => new Date(b.dateAcquisition) - new Date(a.dateAcquisition));

        // Vide le tableau
        acquisitionsTableBody.innerHTML = '';

        // Ajoute chaque acquisition au tableau
        acquisitions.forEach(acquisition => {
            const row = acquisitionsTableBody.insertRow();
            row.insertCell().textContent = acquisition.datesAcquisition.length > 0 ? acquisition.datesAcquisition[0] : acquisition.dateAcquisition; // Affiche la première date ou la date unique
            row.insertCell().textContent = acquisition.natureAcquisition;
            row.insertCell().textContent = acquisition.quantiteAcquise;
            row.insertCell().textContent = acquisition.fraisAcquisition;
            row.insertCell().textContent = acquisition.fraisAnnexes;
            row.insertCell().textContent = acquisition.totalFrais;
            row.insertCell().textContent = acquisition.typeAcquisition;
            row.insertCell().textContent = acquisition.typeAcquisition === 'tranches' ? acquisition.datesAcquisition.join(', ') : '';
        });
    }

    // Gestionnaire d'événement pour la soumission du formulaire des acquisitions
    acquisitionForm.addEventListener('submit', (event) => {
        event.preventDefault();

        // Récupère les données du formulaire des acquisitions
        const natureAcquisition = document.getElementById('nature-acquisition').value;
        const quantiteAcquise = parseInt(document.getElementById('quantite-acquise').value);
        const fraisAcquisition = parseFloat(fraisAcquisitionInput.value);
        const fraisAnnexes = parseFloat(fraisAnnexesInput.value);
        const totalFrais = parseFloat(totalFraisInput.value);
        const typeAcquisition = typeAcquisitionSelect.value;
        let dateAcquisition = document.getElementById('date-acquisition').value;
        let datesAcquisition = [];

        if (typeAcquisition === 'tranches') {
            const dateInputs = document.querySelectorAll('input[name="date-acquisition-tranche[]"]');
            dateInputs.forEach(input => {
                if (input.value) {
                    datesAcquisition.push(input.value);
                }
            });
            // Si acquisition en tranches, on s'assure qu'il y a au moins une date
            if (datesAcquisition.length === 0) {
                alert("Veuillez entrer au moins une date d'acquisition pour une acquisition en tranches.");
                return;
            }
        } else {
            datesAcquisition = [dateAcquisition]; // Pour le type 'totale', on met la date unique dans le tableau
        }

        let errorMessage = "";

        if (quantiteAcquise <= 0) {
            errorMessage += "La quantité acquise doit être supérieure à zéro.\n";
        }
        if (fraisAcquisition < 0) {
            errorMessage += "Les frais d'acquisition ne peuvent pas être négatifs.\n";
        }
        if (fraisAnnexes < 0) {
            errorMessage += "Les frais annexes ne peuvent pas être négatifs.\n";
        }

        if (errorMessage) {
            alert(errorMessage);
            return;
        }

        // Crée un objet acquisition
        const nouvelleAcquisition = {
            natureAcquisition,
            quantiteAcquise,
            fraisAcquisition,
            fraisAnnexes,
            totalFrais,
            dateAcquisition, // Conserve la première date pour l'affichage principal
            typeAcquisition,
            datesAcquisition: datesAcquisition
        };

        // Ajoute la nouvelle acquisition au tableau
        acquisitions.push(nouvelleAcquisition);

        // Affiche les acquisitions dans le tableau
        afficherAcquisitions();

        // Réinitialise le formulaire
        acquisitionForm.reset();
        datesAcquisitionContainer.style.display = 'none'; // Cache le conteneur des dates
        dateAcquisitionInput.style.display = 'block'; // Réaffiche le champ de date unique
        dateAcquisitionInput.required = true;
        updateTotalFrais(); // Réinitialise le total des frais affiché
    });

    // Affiche les acquisitions initiales (si tu as des données à charger au départ)
    afficherAcquisitions();
    updateTotalFrais(); // Initialise le total des frais au chargement
});