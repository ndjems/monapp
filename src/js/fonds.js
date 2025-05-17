document.addEventListener('DOMContentLoaded', () => {
         function getFormElements() {
        const sommePercueInput = document.getElementById('somme-percue');
        const dateInput = document.getElementById('date');
        const nomCrediteurInput = document.getElementById('nom-crediteur');
        const enregistrerBtn = document.getElementById('enregistrer-btn');
        const fondsTableBody = document.querySelector('#fonds-table tbody');
        const retourBtn = document.getElementById('retour-btn'); // Récupération du bouton Retour
        return { sommePercueInput, dateInput, nomCrediteurInput, enregistrerBtn, fondsTableBody, retourBtn }; // Ajout du bouton Retour à l'objet retourné
    }

    // Fonction pour valider le formulaire
    function validerFormulaire(sommePercue) {
        let isValid = true;
        const errors = {};

        if (isNaN(sommePercue) || sommePercue <= 0) {
            errors.sommePercue = "La somme perçue doit être un nombre positif.";
            isValid = false;
        }

        return { isValid, errors };
    }

    // Fonction pour ajouter une nouvelle ligne au tableau
    function ajouterFondsAuTableau(date, sommePercue, nomCrediteur) {
        const { fondsTableBody } = getFormElements();
        const newRow = fondsTableBody.insertRow();
        newRow.insertCell().textContent = date;
        newRow.insertCell().textContent = sommePercue;
        newRow.insertCell().textContent = nomCrediteur;
    }

    // Fonction pour gérer l'enregistrement des fonds
    function gererEnregistrement() {
        const { sommePercueInput, dateInput, nomCrediteurInput } = getFormElements();
        const sommePercue = parseFloat(sommePercueInput.value);
        const date = dateInput.value;
        const nomCrediteur = nomCrediteurInput.value;

        const { isValid, errors } = validerFormulaire(sommePercue);

        if (isValid) {
            ajouterFondsAuTableau(date, sommePercue, nomCrediteur);
            // Réinitialiser le formulaire après l'enregistrement
            fondsForm.reset();
        } else {
            // Afficher les erreurs à l'utilisateur (vous pouvez adapter cette partie)
            if (errors.sommePercue) {
                document.getElementById('somme-percue-error').textContent = errors.sommePercue;
            }
            console.error("Erreurs de validation :", errors);
        }
    }

    // Fonction pour gérer le clic sur le bouton Retour
    function gererRetour() {
        window.location.href = 'pageprincipale.html'; // Redirige vers la page principale
    }

    // Attacher les gestionnaires d'événements
    const { enregistrerBtn, retourBtn } = getFormElements(); // Récupérer aussi le bouton Retour
    enregistrerBtn.addEventListener('click', (event) => {
        event.preventDefault(); // Empêche le rechargement de la page
        gererEnregistrement();
    });

    retourBtn.addEventListener('click', gererRetour); // Gestionnaire pour le bouton Retour
});
