const path = require('path');
const { app, shell, BrowserWindow } = require('electron');
const url = require('url');

const BaseWindow = require('./base');

class LoginWindow extends BaseWindow{
    constructor(setting, isDebug, parent, isShow){
        super('login', setting, isDebug, isShow);

        this.createWindow();
        this.initWindowWebContent();
    }

    createWindow(){
        var win = new BrowserWindow({
            width: this.setting[this.name].width,
            height:this.setting[this.name].height,
            title: this.getTitle(),
            resizable: false,
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

        // var urlPath = "http://localhost:3000";
        // if (!this.isDebug){
        //
        // }
        var urlPath = url.format({
            pathname: path.join(__dirname, '../', '../', '../', 'ui', 'index.html'),
            protocol: 'file:',
            slashes: true,
            hash: "#/login"
        });

        win.loadURL(urlPath, {userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/70.0.3538.110 Safari/537.36 TDEx"});
    }

    initWindowWebContent() {
        if (this.isDebug) {
            this.win.webContents.openDevTools();
        }
        // this.win.webContents.openDevTools();

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

module.exports = LoginWindow;
