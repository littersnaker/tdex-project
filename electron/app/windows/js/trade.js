const path = require('path');
const { app, shell, BrowserWindow } = require('electron');
const url = require('url');

const BaseWindow = require('./base');

class TradeWindow extends BaseWindow{
    constructor(setting, isDebug, parent, isShow){
        super('trade', setting, isDebug, isShow);

        this.parent = parent;
        this.createWindow();
        this.initWindowWebContent();
    }

    createWindow(){
        const win = new BrowserWindow({
            parent: this.parent.getWin(),
            width: this.setting[this.name].width,
            height:this.setting[this.name].height,
            title: this.getTitle(),
            resizable: true,
            center: true,
            show: false,
            frame: true,
            autoHideMenuBar: true,
            icon: path.join(__dirname, '../img/icon.png'),
            // titleBarStyle: 'hidden-inset',
            webPreferences: {
                javascript: true,
                plugins: true,
                nodeIntegration: false,
                webSecurity: false,
                preload: path.join(__dirname, '../../preload.js'),
            },
        });
        this.win = win;
        this.bindEvent();

        // var urlPath = "http://localhost:3000/#/trade";
        // if (!this.isDebug){
            var urlPath = url.format({
                pathname: path.join(__dirname, '../', '../', '../', 'ui', 'index.html'),
                hash: "#/trade",
                protocol: 'file:',
                slashes: true
            });
        // }
        win.loadURL(urlPath, {userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/70.0.3538.110 Safari/537.36 TDEx"});

        win.maximize();
    }

    initWindowWebContent() {
        if (this.isDebug) {
            this.win.webContents.openDevTools();
        }

        // this.win.webContents.on('dom-ready', () => {
        //     this.win.webContents.insertCSS(CSSInjector.commonCSS);
        //     if (process.platform === 'darwin') {
        //         this.win.webContents.insertCSS(CSSInjector.osxCSS);
        //     }
        // });

        this.win.webContents.on('new-window', (event, url) => {
            console.log("new-window:" + url);
            event.preventDefault();
            shell.openExternal(url);
        });

        this.win.webContents.on('will-navigate', (event, url) => {
            console.log("will-navigate:" + url);
            // if (url.endsWith('/fake')) event.preventDefault();
        });
    }
}

module.exports = TradeWindow;
