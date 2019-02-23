const { ipcRenderer, shell, remote } = require('electron');
const fs = require("fs-extra");
const path = require("path");

const ElectronExt = {
    _models: {},
    openExternal(url){
        console.log(url);
        shell.openExternal(url);
    },
    setWindowSize(width, height){

    },
    showLoginWindow(){
        ipcRenderer.send("enterLogin");
    },
    showTradeWindow(){
        ipcRenderer.send("enterTrade");
    },
    logout(){
        ipcRenderer.send("logout");
    },
    registerModel(name, model){
        this._models[name] = model;
    },
    callModel(model, method, ...arg){
        var m = this._models[model];
        if (m) m[method](arg);
    },
    lang(){
        var setttings = remote.getGlobal("settings");
        if (setttings) return setttings.language;
    },
    changeLanguage(lang){
        ipcRenderer.send("changeLanguage", lang);
    },
    langPacket(lang){
        var langPacket = remote.getGlobal("langPacket");
        if (langPacket) return langPacket[lang];
    },
    checkVersionUpdate(){
        ipcRenderer.send("checkForUpdate");
    }
};
global.ElectronExt = ElectronExt;

ipcRenderer.on('shutdown', ()=>{
    ElectronExt.callModel('auth', 'shutDown');
});

ipcRenderer.on('version-message', (event, data)=>{
    ElectronExt.callModel('version', 'message', data);
});