const {app, ipcMain} = require("electron");
const fs = require("fs-extra");
const path = require("path");
const url = require('url');

const { autoUpdater } = require("electron-updater");
// const log = require('electron-log');

const pkg = require("../package.json");

// const SplashWindow = require('./windows/js/splash');
const VersionWindow = require('./windows/js/version');
const LoginWindow = require('./windows/js/login');
const TradeWindow = require('./windows/js/trade');
const Locale = require('./locale');

class ElectronApp{
    constructor(){
        this.currWin = null;
        this.splashWin = null;
        this.versionWin = null;
        this.loginWin = null;
        this.tradeWin = null;
        // this.winName = '';
        this.supportsLang = ['zh-cn', 'en-us'];

        this.isInitialized = true;
    }

    init(){
        if (this.checkInstance()){
            this.initMain();
        }else{
            app.quit();
        }
    }

    checkInstance(){
        return !app.makeSingleInstance((commandLine, workingDirectory)=>{
            // Someone tried to run a second instance, we should focus our window.
            if (this.currWin && this.currWin.getWin()) {
                if (this.currWin.getWin().isMinimized()) this.currWin.getWin().restore();
                this.currWin.getWin().focus();
            }
        });
    }

    initMain(){
        this.initApp();
        this.initIPC();
    }

    loadEnvironment(){
        this.isDevelopment = process.env['NODE_ENV'] === 'development';

        this.appDirectory = path.join(__dirname);
        this.appVersion = pkg.version;

        this.appDataDirectory = path.join(app.getPath("appData"), "tdex");

        if (!fs.existsSync(this.appDataDirectory)) {
            fs.mkdirSync(this.appDataDirectory);
        }
    }

    loadSettings() {
        try {
            var settingsFile = path.join(this.appDataDirectory, "settings.json");

            var settings = {};
            if (fs.existsSync(settingsFile)) {
                settings = JSON.parse(fs.readFileSync(settingsFile, "utf8"));
            }

            if (!settings.hasOwnProperty("language")) {
                settings.language = "zh-cn";
            }
            if (!settings.hasOwnProperty("version")) {
                settings.version = this.appVersion;
            }
            // if (!settings.hasOwnProperty("login") || typeof(settings.login) != "object" || !settings.login.width || !settings.login.height) {
                settings.login = {width: 412, height: 688};
            // }
            if (!settings.hasOwnProperty("trade") || typeof(settings.trade) != "object" || !settings.trade.width || !settings.trade.height) {
                settings.trade = {width: 1250, height: 800};
            }
            if (!settings.hasOwnProperty("checkForUpdates")) {
                settings.checkForUpdates = 1;
            }
            if (!settings.hasOwnProperty("lastUpdateCheck")) {
                settings.lastUpdateCheck = 0;
            }
            if (!settings.hasOwnProperty("isFirstRun")) {
                settings.isFirstRun = 1;
            }
        } catch (err) {
            console.log("Error reading settings:");
            console.log(err);
            settings = {login: {width: 412, height: 688}, trade:{width:1250, height:800}, checkForUpdates: 1, lastUpdateCheck: 0, isFirstRun: 1};
        }

        this.settings = settings;
        global.settings = settings;
    }

    saveSettings() {
        if (!this.appDataDirectory) {
            return;
        }

        try {
            if (this.currWin && this.currWin.getWin() && !this.currWin.getWin().isFullScreen()) {
                // if (this.winName=='login') this.settings.login = this.currWin.getWin().getBounds();
                if (this.currWin instanceof LoginWindow)this.settings.login = this.currWin.getWin().getBounds();
                else this.settings.trade = this.currWin.getWin().getBounds();
            }

            this.settings.isFirstRun = 0;

            var settingsFile = path.join(this.appDataDirectory, "settings.json");
            fs.writeFileSync(settingsFile, JSON.stringify(this.settings));
        } catch (err) {
            console.log("Error writing settings:");
            console.log(err);
        }
    }

    loadUILangPacket(){
        var langPacket = {};
        this.supportsLang.forEach((lang)=>{
            var filePath = path.join(__dirname, '../ui/intl', `${lang}.json`);
            // console.log(filePath);
            if (fs.existsSync(filePath)) {
                langPacket[lang] = JSON.parse(fs.readFileSync(filePath, "utf8"));
            }
        });
        this.langPacket = langPacket;
        global.langPacket = langPacket;
    }
    loadAppLangPacket(){
        Locale.init(this.settings, this.supportsLang);
    }

    initApp(){
        this.loadEnvironment();
        this.loadSettings();
        this.loadUILangPacket();
        this.loadAppLangPacket();

        // app.commandLine.appendSwitch('proxy-server', '192.168.2.150:8282');

        app.on("ready", ()=>{
            // this.createSplashWindow();
            if (!this.isDevelopment) this.createVersionWindow();
            else this.createLoginWindow();
        });

        app.on('activate', ()=>{
            if (this.currWin){
                this.currWin.show();
            }
        });

        app.on('will-quit', ()=>{
            // console.log("will-quit");

            this.saveSettings();
            // if (this.tradeWin && this.tradeWin.getWin()){
            //     if (this.tradeWin.getWin().webContents && this.tradeWin.getWin().webContents.isDevToolsOpened()) {
            //         this.tradeWin.getWin().webContents.closeDevTools();
            //     }
            //     this.tradeWin.getWin().destroy();
            //     this.tradeWin = null
            // }
            // if (this.loginWin && this.loginWin.getWin()){
            //     if (this.loginWin.getWin().webContents && this.loginWin.getWin().webContents.isDevToolsOpened()) {
            //         this.loginWin.getWin().webContents.closeDevTools();
            //     }
            //     this.loginWin.getWin().destroy();
            //     this.loginWin = null;
            // }
        });
    }

    initIPC(){
        ipcMain.on("checkForUpdate",()=>{
            //执行自动更新检查
            autoUpdater.checkForUpdates();
        });

        ipcMain.on("enterLogin", (event, pid)=>{
            this.createLoginWindow();
        })

        ipcMain.on("enterTrade", (event, pid)=>{
            this.createTradeWindow();
        });

        ipcMain.on("logout", ()=>{
            this.logout();
        });

        ipcMain.on("changeLanguage", (e, lang)=>{
            this.settings.language = lang;
            global.settings = this.settings;
            this.saveSettings();
        });
    }

    createSplashWindow(){

    }

    createVersionWindow(){
        if (!this.versionWin) this.versionWin = new VersionWindow(this.settings, this.isDevelopment, null, true);

        this.currWin = this.versionWin;
    }

    createLoginWindow(){
        if (this.currWin){
            if (this.currWin instanceof VersionWindow){
                this.currWin.destroy();
                this.currWin = null;
            }else{
                this.currWin.hide();
            }
        }

        if (!this.loginWin){
            this.loginWin = new LoginWindow(this.settings, this.isDevelopment, null, true);
        }else{
            this.loginWin.getWin().reload();
            this.loginWin.show();
        }

        this.currWin = this.loginWin;
        // this.winName = 'login';
    }

    createTradeWindow(){
        // var setting = this.settings.trade;
        // var win = this.currWin.getWin();
        //
        // win.setSize(setting.width, setting.height);
        // win.setResizable(true);
        // win.setMinimizable(true);
        // win.setMaximizable(true);
        //
        // win.center();
        // win.maximize();
        //
        // this.winName = 'trade';
        if (this.currWin) this.currWin.hide();

        if (!this.tradeWin){
            this.tradeWin = new TradeWindow(this.settings, this.isDevelopment, this.currWin, true);
        }else{
            this.tradeWin.getWin().reload();
            this.tradeWin.show();
        }

        this.currWin = this.tradeWin;
    }

    logout(){
        // var setting = this.settings.login;
        // var win = this.currWin.getWin();
        //
        // win.setSize(setting.width, setting.height+20);
        // win.setResizable(false);
        // win.setMinimizable(true);
        // win.setMaximizable(true);
        //
        // win.center();
        //
        // this.winName = 'login';
        if (this.tradeWin)this.tradeWin.hide();
        if (this.loginWin){
            if (this.loginWin.getWin())this.loginWin.getWin().reload();
            this.loginWin.show();
        }
        this.currWin = this.loginWin;
    }
}

new ElectronApp().init();
