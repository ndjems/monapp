const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

let db;
let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        },
    });

    mainWindow.loadFile(path.join(__dirname, '../html/index.html'));

    mainWindow.on('closed', () => {
        mainWindow = null;
        if (db) {
            db.close((err) => {
                if (err) {
                    console.error('Erreur lors de la fermeture de la base de données', err.message);
                }
                console.log('Base de données fermée.');
            });
        }
    });
}

app.whenReady().then(() => {
    // Ouvrir ou créer la base de données
    db = new sqlite3.Database(path.join(app.getPath('userData'), 'mydatabase.db'), (err) => {
        if (err) {
            console.error('Erreur lors de l\'ouverture de la base de données', err.message);
        }
        console.log('Connecté à la base de données SQLite.');

        // Créer la table des utilisateurs si elle n'existe pas
        db.run(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL
        )`, (err) => {
            if (err) {
                console.error('Erreur lors de la création de la table users', err.message);
            }
        });
    });

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

// Gestion de la requête de connexion
ipcMain.on('login-request', (event, credentials) => {
    const { username, password } = credentials;
    // Ici, tu dois interroger ta base de données pour vérifier l'utilisateur et le mot de passe
    db.get(`SELECT id, username FROM users WHERE username = ? AND password = ?`, [username, password], (err, row) => {
        if (err) {
            console.error(err.message);
            event.sender.send('login-response', { success: false, message: 'Erreur lors de la vérification.' });
            return;
        }
        if (row) {
            console.log('Connexion réussie pour l\'utilisateur:', row.username);
            event.sender.send('login-response', { success: true });
        } else {
            console.log('Échec de la connexion pour l\'utilisateur:', username);
            event.sender.send('login-response', { success: false, message: 'Nom d\'utilisateur ou mot de passe incorrect.' });
        }
    });
});

// Fonction pour créer la fenêtre du menu (à implémenter)
function createMenuWindow() {
    const menuWin = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        },
    });
    menuWin.loadFile(path.join(__dirname, '../html/menu.html')); // Crée le fichier menu.html dans src/html
    menuWin.on('closed', () => {
        // Gérer la fermeture de la fenêtre de menu si nécessaire
    });
}

// Écouter l'événement pour charger la page de menu après la connexion
ipcMain.on('load-menu', () => {
    if (mainWindow) {
        mainWindow.loadFile(path.join(__dirname, '../html/menu.html'));
    }
});