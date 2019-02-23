const pkg = require("../../../package.json");
const { app, dialog} = require('electron');
const Locale = require('../../locale');

class BaseWindow {
    constructor(name, setting, isDebug, isShow){
        this.name = name;
        this.isShow = isShow;
        this.isShown = false;

        this.isClosed = false;
        this.setting = setting;
        this.isDebug = isDebug;
        this.win = null;
    }

    getTitle(){
        return `${pkg.name} - ${pkg.version}`;
    }

    updateTitle(){
        this.win.setTitle(this.getTitle());
    }

    bindEvent(){
        if (!this.win) return;

        this.win.webContents.on("did-finish-load", ()=>{
            this.updateTitle();
            if (this.isShow) this.show();
        });

        this.win.on("close", (e)=>{
            if (this.win.isVisible()){
                e.preventDefault();

                dialog.showMessageBox(this.win, {type: 'none', buttons: [Locale.get("win.close.ok"), Locale.get("win.close.cancel")], defaultId: 1, cancelId: 1, title:Locale.get("win.close.title"), message: Locale.get("win.close.confirm")}, (response)=>{
                    if (response==0){
                        if (this.win && this.win.webContents) {
                            this.win.webContents.send("shutdown");

                            if (this.win.webContents.isDevToolsOpened()) {
                                this.win.webContents.closeDevTools();
                            }
                        }

                        this.win.destroy();
                        this.isClosed = true;
                        app.quit();
                    }
                });
            }else{
                if (this.win && this.win.webContents) {
                    this.win.webContents.send("shutdown");

                    if (this.win.webContents.isDevToolsOpened()) {
                        this.win.webContents.closeDevTools();
                    }
                }
                this.isClosed = true;
                // app.quit();
            }
        });

        this.win.on("closed", ()=>{
            this.win = null;
        });
    }

    getWin(){
        return this.win;
    }

    show() {
        if (this.win){
            this.win.show();
            this.win.focus();
            this.win.webContents.send(`show-${this.name}-window`);
        }
        this.isShown = true;
    }

    hide() {
        if (this.win){
            this.win.hide();
            this.win.webContents.send(`hide-${this.name}-window`);
        }
        this.isShown = false;
    }

    destroy(){
        if (this.win && this.win.webContents) {
            this.win.webContents.send("shutdown");

            if (this.win.webContents.isDevToolsOpened()) {
                this.win.webContents.closeDevTools();
            }
        }
        this.isClosed = true;
        if (this.win){
            this.win.destroy();
            this.win = null;
        }
    }
}

module.exports = BaseWindow;