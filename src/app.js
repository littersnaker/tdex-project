import GlobalStore from './stores';
import SysTime from './model/system';
import TradeMgr from './model/trade-mgr';
import Intl from './intl';
import Product from './model/product';
import WsMgr from './net/WsMgr';
import {checkBrowserSupport} from "./utils/common";

export default {
    location:null,
    init(render){
        GlobalStore.init();
        SysTime.init();

        // var loaded = 0;
        // const _loadComplete = ()=>{
        //     if (loaded==2) if (render) render(checkBrowserSupport());
        // }

        Intl.init(()=>{
            if (render) render(checkBrowserSupport())
        });
        Product.init(()=>{
            TradeMgr.init(this, ()=>{
                //初始化完成，打开socket连接
                WsMgr.connect();
            });
        });
    },
    setCurrentLocation(location){
        this.location = location;
    },
    getCurrentLocation(){
        return this.location;
    }
};
