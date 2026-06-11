const { app, BrowserWindow, shell } = require('electron');
const path = require('path');

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    title: "Viva Business Banking",
    icon: path.join(__dirname, 'public', 'favicon.ico'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // In production, point to your Railway URL
  // In development, point to your local Vite server
  const startUrl = process.env.NODE_ENV === 'production'
    ? 'https://your-railway-app-url.up.railway.app'
    : 'http://localhost:5173';

  mainWindow.loadURL(startUrl);

  // Security: Open external links (like Paystack) in the system browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
