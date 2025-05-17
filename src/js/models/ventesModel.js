const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { app } = require('electron').remote; 

let db;

function initializeDatabase(dbName) {
  return new Promise((resolve, reject) => {
    // Utilisez le chemin d'accès userData d'Electron pour stocker la base de données
    const dbPath = path.join(app.getPath('userData'), dbName);
    db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error("Erreur lors de l'ouverture de la base de données :", err.message);
        reject(err);
        return;
      }
      console.log('Base de données initialisée avec succès.');
      db.run(`CREATE TABLE IF NOT EXISTS ventes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        responsable TEXT NOT NULL,
        livreur TEXT,
        quantite INTEGER NOT NULL,
        montant_net REAL NOT NULL,
        montant_recu REAL NOT NULL,
        mode_paiement TEXT NOT NULL,
        date_vente TEXT NOT NULL,
        frais REAL
      )`, (err) => {
        if (err) {
          console.error("Erreur lors de la création de la table 'ventes' :", err.message);
          reject(err);
          return;
        }
        db.run(`CREATE TABLE IF NOT EXISTS users (
          iduser INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT NOT NULL UNIQUE,
          password TEXT NOT NULL
        )`, (userErr) => {
          if (userErr) {
            console.error("Erreur lors de la création de la table 'users' :", userErr.message);
            reject(userErr);
            return;
          }
          resolve();
        });
      });
    });
  });
}

function getDB() {
  return db;
}

function closeDatabase() {
  return new Promise((resolve, reject) => {
    if (db) {
      db.close((err) => {
        if (err) {
          console.error("Erreur lors de la fermeture de la base de données :", err.message);
          reject(err);
        } else {
          console.log('Base de données fermée avec succès.');
          resolve();
        }
      });
    } else {
      resolve();
    }
  });
}

function enregistrerVente(vente) {
  return new Promise((resolve, reject) => {
    const { responsable, livreur, quantite, montant_net, montant_recu, mode_paiement, date_vente, frais } = vente;
    const sql = `INSERT INTO ventes (responsable, livreur, quantite, montant_net, montant_recu, mode_paiement, date_vente, frais)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
    db.run(sql, [responsable, livreur, quantite, montant_net, montant_recu, mode_paiement, date_vente, frais], function (err) {
      if (err) {
        console.error("Erreur lors de l'insertion d'une vente :", err.message);
        reject(err);
        return;
      }
      resolve(this.lastID); // Retourne l'ID de la dernière vente insérée
    });
  });
}


function getAllVentes() {
  return new Promise((resolve, reject) => {
    const sql = `SELECT id, responsable, livreur, quantite, montant_net, montant_recu, mode_paiement, date_vente, frais FROM ventes`;
    db.all(sql, [], (err, rows) => {
      if (err) {
        console.error("Erreur lors de la récupération des ventes :", err.message);
        reject(err);
        return;
      }
      resolve(rows);
    });
  });
}

module.exports = {
  initializeDatabase,
  closeDatabase,
  getDB,
  enregistrerVente,
  getAllVentes
};
