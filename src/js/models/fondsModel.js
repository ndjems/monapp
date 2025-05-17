const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Chemin vers le fichier de la base de données (à adapter si nécessaire)
const dbPath = path.resolve(__dirname, 'k2n_services.db'); // Le nom de la base de données est k2n_services.db

let db;

// Fonction pour initialiser la base de données
function initializeDatabase() {
  return new Promise((resolve, reject) => {
    db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('Erreur lors de l\'ouverture de la base de données :', err.message);
        reject(err);
        return;
      }
      console.log('Base de données initialisée avec succès.');
      // Création de la table "fonds" si elle n'existe pas
      db.run(
        `CREATE TABLE IF NOT EXISTS fonds (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          nom_crediteur TEXT NOT NULL,
          somme_percue REAL NOT NULL,
          date_fonds TEXT NOT NULL
        )`,
        (err) => {
          if (err) {
            console.error('Erreur lors de la création de la table "fonds" :', err.message);
            reject(err);
            return;
          }
          resolve();
        }
      );
    });
  });
}

// Fonction pour enregistrer un nouveau fonds
function enregistrerFonds(fonds) {
  return new Promise((resolve, reject) => {
    const { nom_crediteur, somme_percue, date_fonds } = fonds;
    const query = `INSERT INTO fonds (nom_crediteur, somme_percue, date_fonds) VALUES (?, ?, ?)`;
    db.run(query, [nom_crediteur, somme_percue, date_fonds], function (err) {
      if (err) {
        console.error('Erreur lors de l\'enregistrement du fonds :', err.message);
        reject(err);
        return;
      }
      resolve(this.lastID); // Retourne l'ID du dernier fonds inséré
    });
  });
}

// Fonction pour récupérer tous les fonds
function getAllFonds() {
  return new Promise((resolve, reject) => {
    const query = `SELECT nom_crediteur, somme_percue, date_fonds FROM fonds`; // Sélectionne les colonnes nécessaires
    db.all(query, [], (err, rows) => {
      if (err) {
        console.error('Erreur lors de la récupération des fonds :', err.message);
        reject(err);
        return;
      }
      resolve(rows);
    });
  });
}

module.exports = {
  initializeDatabase,
  enregistrerFonds,
  getAllFonds,
};
