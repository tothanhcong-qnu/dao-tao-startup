const { app, BrowserWindow } = require('electron');
const path = require('path');
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

const dev = !app.isPackaged;
const dir = app.getAppPath();
const nextApp = next({ dev, dir });
const handle = nextApp.getRequestHandler();

let mainWindow;

app.whenReady().then(() => {
  nextApp.prepare().then(() => {
    const server = createServer((req, res) => {
      const parsedUrl = parse(req.url, true);
      handle(req, res, parsedUrl);
    });
    
    server.listen(3000, (err) => {
      if (err) throw err;
      console.log('> Ready on http://localhost:3000');
      
      mainWindow = new BrowserWindow({
        width: 1280,
        height: 800,
        title: "Đào Tạo Startup",
        webPreferences: {
          nodeIntegration: true,
        },
        autoHideMenuBar: true
      });
      
      mainWindow.loadURL('http://localhost:3000');
    });
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
