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

  // In production, point to configured web app URL or local deployment
  // In development, point to local Vite server
  const startUrl = process.env.NODE_ENV === 'production'
    ? (process.env.WEB_APP_URL || process.env.VITE_API_URL || 'http://localhost:3000')
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
