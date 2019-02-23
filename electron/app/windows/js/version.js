const path = require('path');
const { app, shell, BrowserWindow } = require('electron');
const url = require('url');
const { autoUpdater } = require("electron-updater");
const log = require('electron-log');
const Locale = require("../../locale");

const BaseWindow = require('./base');

class VersionWindow extends BaseWindow{
    constructor(setting, isDebug, parent, isShow){
        super('version', setting, isDebug, isShow);

        this.isShow = isShow;

        this.createWindow();
        this.initWindowWebContent();
        this.checkVersionUpdate();
    }

    createWindow(){
        var win = new BrowserWindow({
            width: 320,
            height: 84,
            resizable: false,
            center: true,
            show: false,
            frame: false,
            autoHideMenuBar: true,
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
            slashes: true
        });

        win.loadURL(urlPath, {userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/70.0.3538.110 Safari/537.36 TDEx"});
    }

    bindEvent(){
        this.win.webContents.on("did-finish-load", ()=>{
            // this.updateTitle();
            if (this.isShow) this.show();
        });

        this.win.on("close", (e)=>{
            if (this.win && this.win.webContents) {
                this.win.webContents.send("shutdown");

                if (this.win.webContents.isDevToolsOpened()) {
                    this.win.webContents.closeDevTools();
                }
            }
            this.isClosed = true;
            app.quit();
        });

        this.win.on("closed", ()=>{
            this.win = null;
        });
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

    checkVersionUpdate(){
        autoUpdater.logger = log;
        autoUpdater.logger.transports.file.level = "info"

        const sendStatusToWindow = (msg)=>{
            log.info(msg);
            this.win.webContents.send('version-message', msg);
        }

        let message = {
            error: Locale.get("version.error"),
            checking: Locale.get("version.checking"),
            updateAva: Locale.get("version.updateAva"),
            updateNotAva: Locale.get("version.updateNotAva"),
        };

        // autoUpdater.setFeedURL(pkg.build.publish.url);
        autoUpdater.on('error',  (error)=>{
            sendStatusToWindow({action:'error', data: message.error})
        });
        autoUpdater.on('checking-for-update', ()=>{
            sendStatusToWindow({action:'checking-for-update', data:message.checking})
        });
        autoUpdater.on('update-available',  (info)=>{
            sendStatusToWindow({action:'update-available', data:message.updateAva})
        });
        autoUpdater.on('update-not-available',  (info)=>{
            sendStatusToWindow({action:'update-not-available', data:message.updateNotAva})
        });

        // 更新下载进度事件
        autoUpdater.on('download-progress', (progressObj)=>{
            sendStatusToWindow({action:'download-progress', data:progressObj})
        });

        autoUpdater.on('update-downloaded',  (event, releaseNotes, releaseName, releaseDate, updateUrl, quitAndUpdate)=>{
            sendStatusToWindow({action:'update-downloaded'});
            // log.info("update-downloaded");
            this.win.destroy();
            autoUpdater.quitAndInstall();
            // ipcMain.on('isUpdateNow', (e, arg) =>{
            //     console.log(arguments);
            //     console.log("开始更新");
            //     //some code here to handle event
            //
            // });

            // this.currWin.getWin().webContents.send('isUpdateNow')
        });
    }
}

module.exports = VersionWindow;
