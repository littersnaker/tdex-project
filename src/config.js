const location = window.location;
if (!location.origin) location.origin = location.protocol+"//"+location.host;

function replaceVar(str){
    return str.replace(/\{([\w]+)\}/g, function (word, s1) {
        return location[s1];
    });
}

export const DEFAULT_LOCALE = 'zh';
export const HTTP_API_DOMAIN_URL = replaceVar(process.env.REACT_APP_HTTP_API_DOMAIN_URL);
export const HTTP_API_URL = replaceVar(process.env.REACT_APP_HTTP_API_URL);
export const SOCKIO_URL = replaceVar(process.env.REACT_APP_SOCKIO_URL);
export const WS_URL = replaceVar(process.env.REACT_APP_WS_URL);
export const WS_NEW_URL = replaceVar(process.env.REACT_APP_WS_NEW_URL);
export const CDN_HOST = replaceVar(process.env.REACT_APP_CDN_URL);
export const UPLOAD_URL = replaceVar(process.env.REACT_APP_UPLOAD_URL);
// export const PRODUCT_URL = replaceVar(process.env.REACT_APP_SERVER_URL + 'symbolinit');
// export const APP_DOWNLOAD_URL = replaceVar(process.env.REACT_APP_SERVER_URL + 'apkversion');
// export const PRODUCT_LIST_URL = replaceVar(process.env.REACT_APP_SERVER_URL + 'futuresinit');
export const CHAT_WS_URL = replaceVar(process.env.REACT_APP_CHAT_WS_URL);
export const IS_MD5_PWD = true;

export const MAIN_DOMAIN = '';

export const IS_DEMO_PATH = checkHostName();

export const IS_SIMULATE_TRADING = process.env.REACT_APP_IS_SIMULATE_TRADING=="1";  //是否模拟盘环境 需屏蔽转账功能
export const IS_ENGINE_TRADING = process.env.REACT_APP_IS_ENGINE_TRADING=="1"; //是否工程盘

export const IS_CLOSE_EXCHANGE = process.env.REACT_APP_IS_CLOSE_EXCHANGE=="1"; //是否隐藏币币交易

export const IS_MINING_OPEN = false; //挖矿相关的是否开启
export const IS_TRANFER_OPEN = true; //划转功能是否开启

export const IS_TRADE_V2 = true;// IS_ENGINE_TRADING ? false : true; //交易功能v2精简版是否打开

function checkHostName(){
    // var limitHost = {"tdex.com":1,"www.tdex.com":1,"demo.tdex.com":0,"demo1.tdex.com":0,"localhost":0};
    // var name = window.location.hostname;
    // return limitHost[name]||false;
    return false;
}

export const APP_URL = checkUrl();
function checkUrl(){
    let appUrl = "tdex.com", hostname = window.location.hostname;
    if(hostname.indexOf("demo.")!=-1){
        appUrl = "demo.tdex.com";
    }
    return "https://"+ appUrl;
}
//桌面版的版本
const DESKTOP_VERSION = "0.2.8";

export const DOWNLOAD_LINK = {
    MAC : `https://app-1257080242.cos.ap-guangzhou.myqcloud.com/pc/TDEx_setup_${DESKTOP_VERSION}.dmg`,
    WINDOW : `https://app-1257080242.cos.ap-guangzhou.myqcloud.com/pc/TDEx_setup_${DESKTOP_VERSION}.exe`
};
// //上线产品类型列表
// export const MARKET_LIST = ["BTC", "ETH", "USDT"];
// // export const PRODUCT_LIST = ['BTCCNY', 'ETHCNY'];  //上线的产品列表
// export const PRODUCT_LIST = ['ETHBTC', 'OMGBTC', 'NEOBTC', 'BCCBTC', 'WKCBTC',
//     'OMGETH', 'NEOETH','BCCETH',
//     'BTCUSDT', 'ETHUSDT', 'OMGUSDT', 'NEOUSDT', 'BCCUSDT'];  //上线的产品列表

//export const FUT_TRADE_OPEN = true; //期货交易是否打开
//挂单量进度条
// 所有最大值 5w
// 进度表示当前档的挂单量占最大值的百分比
// 增加一级菜单
// 永续合约，下面二级菜单 XBTUSD
