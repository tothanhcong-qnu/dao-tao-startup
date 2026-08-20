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
    
    server.listen(0, (err) => {
      if (err) throw err;
      const port = server.address().port;
      console.log(`> Ready on http://localhost:${port}`);
      
      mainWindow = new BrowserWindow({
        width: 1280,
        height: 800,
        title: "Đào Tạo Startup",
        webPreferences: {
          nodeIntegration: true,
        },
        autoHideMenuBar: true
      });
      
      mainWindow.loadURL(`http://localhost:${port}`);
    });
  }).catch(err => {
    require('fs').writeFileSync(path.join(app.getPath('userData'), 'crash.log'), 'prepare error: ' + err.toString() + err.stack);
    app.quit();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

process.on('uncaughtException', (err) => {
  require('fs').writeFileSync(path.join(app.getPath('userData'), 'crash-uncaught.log'), 'uncaught: ' + err.toString() + err.stack);
});
