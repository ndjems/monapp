const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

let db;
let mainWindow;
let currentGestionnaireId;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1024,
    height: 768,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  mainWindow.loadFile(path.join(__dirname, '../html.pageprincipale.html'));

  mainWindow.on('closed', () => {
    mainWindow = null;
    closeDatabase();
  });
}

function openDatabase() {
  const dbPath = path.join(app.getPath('userData'), 'k2n_services.db');
  db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error('Erreur lors de l\'ouverture de la base de données', err.message);
    } else {
      console.log('Connecté à la base de données SQLite.');
      createTables();
    }
  });
}

function closeDatabase() {
  if (db) {
    db.close((err) => {
      if (err) {
        console.error('Erreur lors de la fermeture de la base de données', err.message);
      } else {
        console.log('Base de données fermée.');
      }
    });
    db = null;
  }
}

function createTables() {
  db.run(
    `
        CREATE TABLE IF NOT EXISTS Enregistrement (
            idEnregistrement INTEGER PRIMARY KEY AUTOINCREMENT,
            dateEnregistrement DATE NOT NULL,
            statut VARCHAR(10) NOT NULL
        )
    `,
    (err) => {
      if (err) {
        console.error('Erreur lors de la création de la table Enregistrement', err.message);
      }
    }
  );

  db.run(
    `
        CREATE TABLE IF NOT EXISTS Rapport (
            idRapport INTEGER PRIMARY KEY AUTOINCREMENT,
            periode VARCHAR(50) NOT NULL,
            dateRapport DATE,
            totalVentes REAL,
            totalQuantiteVendue INT,
            nombreDeVentes INT,
            beneficeMoyenParVente REAL
        )
    `,
    (err) => {
      if (err) {
        console.error('Erreur lors de la création de la table Rapport', err.message);
      }
    }
  );

  db.run(
    `
        CREATE TABLE IF NOT EXISTS Ventes (
            idVente INTEGER PRIMARY KEY AUTOINCREMENT,
            responsableVente VARCHAR(30),
            quantite INT NOT NULL,
            montantPercu REAL NOT NULL,
            montantNet REAL NOT NULL,
            modePaiement VARCHAR(20),
            livreur VARCHAR(20),
            dateVente DATE NOT NULL,
            idEnregistrement INTEGER,
            FOREIGN KEY (idEnregistrement) REFERENCES Enregistrement(idEnregistrement)
        )
    `,
    (err) => {
      if (err) {
        console.error('Erreur lors de la création de la table Ventes', err.message);
      }
    }
  );

  db.run(
    `
        CREATE TABLE IF NOT EXISTS Fonds (
            idFonds INTEGER PRIMARY KEY AUTOINCREMENT,
            sommePercue REAL NOT NULL,
            dateFonds DATE NOT NULL,
            crediteur VARCHAR(50) NOT NULL,
            idEnregistrement INTEGER,
            FOREIGN KEY (idEnregistrement) REFERENCES Enregistrement(idEnregistrement)
        )
    `,
    (err) => {
      if (err) {
        console.error('Erreur lors de la création de la table Fonds', err.message);
      }
    }
  );

  db.run(
    `
        CREATE TABLE IF NOT EXISTS Acquisitions (
            idAcquisition INTEGER PRIMARY KEY AUTOINCREMENT,
            nature VARCHAR(50) NOT NULL,
            quantite INT NOT NULL,
            fraisAcquisition REAL,
            fraisAnnexes REAL,
            idEnregistrement INTEGER,
            FOREIGN KEY (idEnregistrement) REFERENCES Enregistrement(idEnregistrement)
        )
    `,
    (err) => {
      if (err) {
        console.error('Erreur lors de la création de la table Acquisitions', err.message);
      }
    }
  );

  db.run(
    `
        CREATE TABLE IF NOT EXISTS Tiers (
            idTiers INTEGER PRIMARY KEY AUTOINCREMENT,
            idEnregistrement INTEGER,
            nom VARCHAR(30) NOT NULL,
            prenoms VARCHAR(50),
            numeroTelephone VARCHAR(20),
            typePiece VARCHAR(20),
            numeroPiece VARCHAR(20),
            localisation VARCHAR(100),
            cheminPhotoPiece VARCHAR(255),
            statut VARCHAR(20),
            FOREIGN KEY (idEnregistrement) REFERENCES Enregistrement(idEnregistrement)
        )
    `,
    (err) => {
      if (err) {
        console.error('Erreur lors de la création de la table Tiers', err.message);
      }
    }
  );

  db.run(
    `
        CREATE TABLE IF NOT EXISTS Stock (
            idStock INTEGER PRIMARY KEY AUTOINCREMENT,
            idEnregistrement INTEGER,
            nature VARCHAR(50) NOT NULL,
            quantiteInitiale INT NOT NULL,
            quantiteRestante INT NOT NULL,
            idAcquisition INTEGER,
            FOREIGN KEY (idEnregistrement) REFERENCES Enregistrement(idEnregistrement),
            FOREIGN KEY (idAcquisition) REFERENCES Acquisitions(idAcquisition)
        )
    `,
    (err) => {
      if (err) {
        console.error('Erreur lors de la création de la table Stock', err.message);
      }
    }
  );
}

app.whenReady().then(() => {
  openDatabase();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

function creerEnregistrement(callback) {
  db.run(
    `INSERT INTO Enregistrement (dateEnregistrement, statut) VALUES (?, ?)`,
    [new Date().toISOString().slice(0, 10), 'validé'],
    function (err) {
      if (err) {
        console.error(err.message);
        return callback(err);
      }
      callback(null, this.lastID);
    }
  );
}

// --- IPC Handlers pour Rapports ---
ipcMain.on('generer-rapport', (event, periode) => {
  if (!currentGestionnaireId) {
    return event.sender.send('generer-rapport-reponse', {
      success: false,
      message: 'Utilisateur non authentifié.',
    });
  }

  const startDate = periode.startDate;
  const endDate = periode.endDate;

  // Calculer le total des ventes
  db.get(
    `SELECT SUM(montantNet) as totalVentes FROM Ventes WHERE dateVente BETWEEN ? AND ?`,
    [startDate, endDate],
    (err, row) => {
      if (err) {
        console.error(err.message);
        return event.sender.send('generer-rapport-reponse', {
          success: false,
          message: err.message,
        });
      }

      const totalVentes = row.totalVentes || 0; // Gérer le cas où il n'y a pas de ventes

      // Calculer le total de la quantité vendue
      db.get(
        `SELECT SUM(quantite) as totalQuantiteVendue FROM Ventes WHERE dateVente BETWEEN ? AND ?`,
        [startDate, endDate],
        (err, row) => {
          if (err) {
            console.error(err.message);
            return event.sender.send('generer-rapport-reponse', {
              success: false,
              message: err.message,
            });
          }
          const totalQuantiteVendue = row.totalQuantiteVendue || 0;

          // Calculer le nombre de ventes
          db.get(
            `SELECT COUNT(*) as nombreDeVentes FROM Ventes WHERE dateVente BETWEEN ? AND ?`,
            [startDate, endDate],
            (err, row) => {
              if (err) {
                console.error(err.message);
                return event.sender.send('generer-rapport-reponse', {
                  success: false,
                  message: err.message,
                });
              }
              const nombreDeVentes = row.nombreDeVentes || 0;

              // Calculer le bénéfice moyen par vente
              const beneficeMoyenParVente =
                nombreDeVentes > 0 ? totalVentes / nombreDeVentes : 0;

              // Enregistrer le rapport dans la base de données
              db.run(
                `
                    INSERT INTO Rapport (periode, dateRapport, totalVentes, totalQuantiteVendue, nombreDeVentes, beneficeMoyenParVente)
                    VALUES (?, ?, ?, ?, ?, ?)
                `,
                [
                  `${startDate} - ${endDate}`,
                  new Date().toISOString().slice(0, 10),
                  totalVentes,
                  totalQuantiteVendue,
                  nombreDeVentes,
                  beneficeMoyenParVente,
                ],
                (err) => {
                  if (err) {
                    console.error(err.message);
                    return event.sender.send('generer-rapport-reponse', {
                      success: false,
                      message: err.message,
                    });
                  }

                  // Envoyer la réponse au processus de rendu
                  event.sender.send('generer-rapport-reponse', {
                    success: true,
                    message: 'Rapport généré avec succès.',
                    data: {
                      totalVentes,
                      totalQuantiteVendue,
                      nombreDeVentes,
                      beneficeMoyenParVente,
                    },
                  });
                }
              );
            }
          );
        }
      );
    }
  );
});

ipcMain.on('obtenir-rapports', (event) => {
  db.all(`SELECT * FROM Rapport`, [], (err, rows) => {
    if (err) {
      console.error(err.message);
      return event.sender.send('obtenir-rapports-reponse', {
        success: false,
        message: err.message,
        data: [],
      });
    }
    event.sender.send('obtenir-rapports-reponse', { success: true, data: rows });
  });
});

ipcMain.on('enregistrer-vente', (event, vente) => {
  if (!currentGestionnaireId) {
    return event.sender.send('enregistrer-vente-reponse', {
      success: false,
      message: 'Utilisateur non authentifié.',
    });
  }

  creerEnregistrement((err, idEnregistrement) => {
    if (err) {
      return event.sender.send('enregistrer-vente-reponse', {
        success: false,
        message: err.message,
      });
    }
    db.run(
      `INSERT INTO Ventes (idEnregistrement, responsableVente, quantite, montantPercu, montantNet, modePaiement, livreur, dateVente) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        idEnregistrement,
        vente.responsableVente,
        vente.quantite,
        vente.montantPercu,
        vente.montantNet,
        vente.modePaiement,
        vente.livreur,
        vente.dateVente,
      ],
      (err) => {
        if (err) {
          console.error(err.message);
          return event.sender.send('enregistrer-vente-reponse', {
            success: false,
            message: err.message,
          });
        }
        event.sender.send('enregistrer-vente-reponse', {
          success: true,
          message: 'Vente enregistrée avec succès.',
        });
      }
    );
  });
});

ipcMain.on('obtenir-ventes', (event) => {
  db.all(`SELECT * FROM Ventes`, [], (err, rows) => {
    if (err) {
      console.error(err.message);
      return event.sender.send('obtenir-ventes-reponse', {
        success: false,
        message: err.message,
        data: [],
      });
    }
    event.sender.send('obtenir-ventes-reponse', { success: true, data: rows });
  });
});

ipcMain.on('enregistrer-fonds', (event, fonds) => {
  if (!currentGestionnaireId) {
    return event.sender.send('enregistrer-fonds-reponse', {
      success: false,
      message: 'Utilisateur non authentifié.',
    });
  }

  creerEnregistrement((err, idEnregistrement) => {
    if (err) {
      return event.sender.send('enregistrer-fonds-reponse', {
        success: false,
        message: err.message,
      });
    }
    db.run(
      `INSERT INTO Fonds (idEnregistrement, sommePercue, dateFonds, crediteur) VALUES (?, ?, ?, ?)`,
      [
        idEnregistrement,
        fonds.sommePercue,
        fonds.dateFonds,
        fonds.crediteur,
      ],
      (err) => {
        if (err) {
          console.error(err.message);
          return event.sender.send('enregistrer-fonds-reponse', {
            success: false,
            message: err.message,
          });
        }
        event.sender.send('enregistrer-fonds-reponse', {
          success: true,
          message: 'Fonds enregistré avec succès.',
        });
      }
    );
  });
});

ipcMain.on('obtenir-fonds', (event) => {
  db.all(`SELECT * FROM Fonds`, [], (err, rows) => {
    if (err) {
      console.error(err.message);
      return event.sender.send('obtenir-fonds-reponse', {
        success: false,
        message: err.message,
        data: [],
      });
    }
    event.sender.send('obtenir-fonds-reponse', { success: true, data: rows });
  });
});

ipcMain.on('enregistrer-acquisition', (event, acquisition) => {
  if (!currentGestionnaireId) {
    return event.sender.send('enregistrer-acquisition-reponse', {
      success: false,
      message: 'Utilisateur non authentifié.',
    });
  }

  creerEnregistrement((err, idEnregistrement) => {
    if (err) {
      return event.sender.send('enregistrer-acquisition-reponse', {
        success: false,
        message: err.message,
      });
    }
    db.run(
      `INSERT INTO Acquisitions (idEnregistrement, nature, quantite, fraisAcquisition, fraisAnnexes) VALUES (?, ?, ?, ?, ?)`,
      [
        idEnregistrement,
        acquisition.nature,
        acquisition.quantite,
        acquisition.fraisAcquisition,
        acquisition.fraisAnnexes,
      ],
      (err) => {
        if (err) {
          console.error(err.message);
          return event.sender.send('enregistrer-acquisition-reponse', {
            success: false,
            message: err.message,
          });
        }
        event.sender.send('enregistrer-acquisition-reponse', {
          success: true,
          message: 'Acquisition enregistrée avec succès.',
        });
      }
    );
  });
});

ipcMain.on('obtenir-acquisitions', (event) => {
  db.all(`SELECT * FROM Acquisitions`, [], (err, rows) => {
    if (err) {
      console.error(err.message);
      return event.sender.send('obtenir-acquisitions-reponse', {
        success: false,
        message: err.message,
        data: [],
      });
    }
    event.sender.send('obtenir-acquisitions-reponse', { success: true, data: rows });
  });
});

ipcMain.on('enregistrer-tiers', (event, tiers) => {
  if (!currentGestionnaireId) {
    return event.sender.send('enregistrer-tiers-reponse', {
      success: false,
      message: 'Utilisateur non authentifié.',
    });
  }
})

  creerEnregistrement((err, idEnregistrement) => {
    if (err) {
      return event.sender.send('enregistrer-tiers-reponse', {
        success: false,
        message: err.message,
      });
    }
    db.run(
      `INSERT INTO Tiers (idEnregistrement, nom, prenoms, numeroTelephone, typePiece, numeroPiece, localisation, cheminPhotoPiece, statut) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        idEnregistrement,
        tiers.nom,
        tiers.prenoms,
        tiers.numeroTelephone,
        tiers.typePiece,
        tiers.numeroPiece,
        tiers.localisation,
        tiers.cheminPhotoPiece,
        tiers.statut,
      ],
      (err) => {
        if (err) {
          console.error(err.message);
          return event.sender.send('enregistrer-tiers-reponse', {
            success: false,
            message: err.message,
          });
        }
        event.sender.send('enregistrer-tiers-reponse', {
          success: true,
          message: 'Tiers enregistré avec succès.',
        });
      }
    );
    });

    // Cacher toutes les sidebars au chargement
    sidebars.forEach(sidebar => {
        sidebar.classList.remove('open');
    });

    mainNavItems.forEach(navItem => {
        navItem.addEventListener('click', function() {
            const submenuId = this.dataset.submenu;
            const sidebarToOpen = document.getElementById(submenuId);

            // Fermer toutes les autres sidebars ouvertes
            sidebars.forEach(sidebar => {
                if (sidebar.id !== submenuId) {
                    sidebar.classList.remove('open');
                }
            });

            // Ouvrir/fermer la sidebar correspondante
            if (sidebarToOpen) {
                sidebarToOpen.classList.toggle('open');
            }
        });
    });

    addSubmenuButtons.forEach(button => {
        button.addEventListener('click', function() {
            const parentSubmenuId = this.dataset.parent;
            const parentSubmenuUl = document.querySelector(`#${parentSubmenuId} ul`);
            const newSubmenuItemText = prompt('Entrez le nom du nouveau sous-menu :');
            if (newSubmenuItemText) {
                const newLi = document.createElement('li');
                const newA = document.createElement('a');
                newA.href = '#'; // Vous pouvez définir un lien spécifique ici
                newA.textContent = newSubmenuItemText;
                newLi.appendChild(newA);
                parentSubmenuUl.insertBefore(newLi, this); // Ajouter avant le bouton "+"
            }
        });
    });
    
