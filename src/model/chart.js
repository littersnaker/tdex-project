import moment from 'moment';
import WsMgr from '../net/WsMgr';
import { isEmptyObject, requestFullScreen, exitFull, checkScreenFull, setStorage, getStorage, removeStorage } from '../utils/util';
import TradeMgr from './trade-mgr';
import Intl from '../intl';
import SysTime from './system';
import Datafeeds from '../charting_library/datafeed/udf/datafeed';
import { widget as TvWidget } from "../charting_library/charting_library.min";
import AuthModel from '../model/auth';
import { IS_DEMO_PATH } from '../config'
import { isMobile } from '../utils/util'
import Net from '../net/net';
import {CONST} from "../public/const";

const $ = window.$;

export default {
    dataCache: {},
    isInitDraw: false, //
    isFullScreen: false,
    isMobile: isMobile(),
    studyMap: {},
    freeStudy: { "Volume": 1, "MA Cross": 1 },
    isFut: true,        // 期货交易
    //['5MIN', '3MIN', '5MIN', '15MIN', '30MIN', '1HOUR', '2HOUR', '3HOUR', '4HOUR', '6HOUR', '12HOUR', '1DAY', '3DAY', '1WEEK', '2WEEK']
    periodToTV: {
        '1MIN': "1", '3MIN': "3", '5MIN': "5", '15MIN': "15", '30MIN': "30", '1HOUR': "60", '2HOUR': "120",
        '3HOUR': "180", '4HOUR': "240", '6HOUR': "360", '12HOUR': "720", '1DAY': "D", "3DAY": "3D", "1WEEK": "W", "2WEEK": "2W"
    },
    chartType: 1,
    linesASK: null,
    linesBID: null,
    askShape: null,
    bidShape: null,
    priceCache:[0,0],

    symbolPrefixMap:{
        [CONST.TRADE_TYPE.CFG]: 'cfd/',
        [CONST.TRADE_TYPE.FUT]: 'futures/',
        [CONST.TRADE_TYPE.SPOT]:'spot/',
    },
    _revertSbPreMap:{},

    periodMsecMap: {},
    tvToTypeMap: {},
    realLastBarTime: {}, //k线最后一条数据的时间
    tickerBars: {}, //ticker数据生成的bar
    // getBarTimer: 0,
    chartReadyTimer: null,
    positionTimer: null,
    arrowList: {},  // 执行状态列表
    supported_resolutions: [],
    posLines: {},
    buttonArr: [],
    modeArr: ['BID', 'ASK', 'LAST'],
    floatTradeData: '',
    subscribeBarsData: null,
    // getBarsFirst: true,
    reqBarsCount: 500,
    limitReqBarsCount:5000,
    lastReqParam: {},
    lastGetBarsParam: {},
    // getBarsTimer: 0,
    subscribeCnt: 10,
    tvDataKey: 'tx_tvData',
    reconnectStatus: 0,
    isFirstGetbar: false, //已经获取了第一次的bar
    isLoadingBar: false, //正在加载数据
    prevGetBarsInfo: {timer:0, callback:null}, //保存上次的
    init(code, mode, period, chartType, cssTheme, switchCallback, component) {
        var symbol = code;
        var period = period = period || '5MIN';

        this.isFut = symbol.indexOf(this.symbolPrefixMap[CONST.TRADE_TYPE.FUT])!=-1;
        this.component = component;
        if (this.widget && this.symbol && this.period) {
            // this.widget.remove();
            if (this.symbol !== symbol || this.period !== period) {
                this.onChangeOptions(symbol, period);
            }
            if (this.cssTheme !== cssTheme) {
                this.options = this.getOverrides(this.options, cssTheme);
                this.widget._options.custom_css_url = this.options.custom_css_url;
                this.widget._options.overrides = this.options.overrides;
                this.widget._options.toolbar_bg = this.options.toolbar_bg;
                this.widget._options.studies_overrides = this.options.studies_overrides;
                this.widget._options.skin_theme = cssTheme + "-theme";

                this.cssTheme = cssTheme;
            }
            this.addListenerAndSub();

            this.widget._create();
            this.initChartReady(true);
            if (this.floatTradeData) {
                this.floatTradeData = ''
            }
            return;
        }
        //设置主域，正式环境跨域需用到
        if (document.domain.indexOf(".") != -1) {
            var ddList = document.domain.split(".");
            var len = ddList.length;
            if (len > 2) document.domain = ddList[len - 2] + '.' + ddList[len - 1];
            else document.domain = ddList.join(".");
        }

        this.symbol = symbol;
        this.period = period;
        this.chartType = chartType;
        this.mode = mode;
        this.isInitDraw = false;
        this.switchCallback = switchCallback;

        for (var tradeType in this.symbolPrefixMap){
            var prefix = this.symbolPrefixMap[tradeType];
            this._revertSbPreMap[prefix] = Number(tradeType);
        }

        var time_frames = [];
        for (var key in this.periodToTV) {
            // time_frames.push({text: key=='DAY'?'1DAY':key, resolution: this.periodToTV[key]});
            time_frames.push({ text: key.replace('MIN', 'm'), resolution: this.periodToTV[key] });
            this.tvToTypeMap[this.periodToTV[key]] = key;
            this.supported_resolutions.push(this.periodToTV[key]);

            // this.periodMsecMap[key] = this.periodToMSec(key);
        }
        //this.widget.chart().removeAllStudies();
        this.dataFeed = new Datafeeds.UDFCompatibleDatafeed(this);
        //https://www.tradingview.com/standard-theme/?themeName=Dark
        var options = {
            autosize: true,
            symbol: this.symbol,
            interval: this.periodToTV[this.period],
            container_id: "tv_chart_container",
            datafeed: this.dataFeed,
            library_path: process.env.PUBLIC_URL + "/charting_library/",
            drawings_access: { type: 'black', tools: [{ name: "Regression Trend" }] },
            disabled_features: ["header_symbol_search", "symbol_info", "link_to_tradingview", "header_compare", "header_screenshot", "use_localstorage_for_settings", "save_chart_properties_to_local_storage", "header_chart_type", "display_market_status", "symbol_search_hot_key", "compare_symbol", "border_around_the_chart", "remove_library_container_border", "symbol_info", "header_interval_dialog_button", "show_interval_dialog_on_key_press", 'timeframes_toolbar', "header_fullscreen_button", "volume_force_overlay"],
            enabled_features: ["dont_show_boolean_study_arguments", "hide_last_na_study_output"],
            numeric_formatting: { decimal_sign: "." },
            timezone: "Asia/Shanghai",
            locale: Intl.getChartLang(), //en
            //toolbar_bg: "#262d33",
            custom_css_url: "bundles/skin-theme.css",
            auto_save_delay: 1,
            // create_volume_indicator_by_default: true,
            //preset: "mobile",
            time_frames: time_frames,
            overrides: {
                "volumePaneSize": "medium",     // 支持的值: large, medium, small, tiny
                //"paneProperties.rightMargin": 10,
                "timeScale.rightOffset": 10,
                "paneProperties.background": "#262626",
                "paneProperties.vertGridProperties.color": "#3C3C3C",
                "paneProperties.horzGridProperties.color": "#3C3C3C",
                "paneProperties.crossHairProperties.color": "#626c73",
                "scalesProperties.backgroundColor": "#262626",
                "scalesProperties.lineColor": "#555",
                "scalesProperties.textColor": "#999",
                "symbolWatermarkProperties.color": "rgba(0, 0, 0, 0)",
                "mainSeriesProperties.style": 1,
                "mainSeriesProperties.candleStyle.upColor": "#6A833A",
                "mainSeriesProperties.candleStyle.downColor": "#8A3A3B",
                "mainSeriesProperties.candleStyle.drawWick": true,
                "mainSeriesProperties.candleStyle.drawBorder": true,
                "mainSeriesProperties.candleStyle.borderColor": "#C400CB",
                "mainSeriesProperties.candleStyle.borderUpColor": "#6A833A",
                "mainSeriesProperties.candleStyle.borderDownColor": "#8A3A3B",
                "mainSeriesProperties.candleStyle.wickUpColor": "#6A833A",
                "mainSeriesProperties.candleStyle.wickDownColor": "#8A3A3B",
                "study_Overlay@tv-basicstudies.barStyle.upColor": "blue",
                "study_Overlay@tv-basicstudies.barStyle.downColor": "blue",
                "study_Overlay@tv-basicstudies.lineStyle.color": "blue",
                "study_Overlay@tv-basicstudies.areaStyle.color1": "blue",
                "study_Overlay@tv-basicstudies.areaStyle.color2": "blue",
                "study_Overlay@tv-basicstudies.areaStyle.linecolor": "blue",
                "MA Cross@tv-basicstudies-1.lineStyle.linewidth": 4
            },
            studies_overrides: {
                "volume.volume.color.0": "#8A3A3B", "volume.volume.color.1": "#6A833A", "volume.volume.transparency": 100,
                'MA Cross.short:plot.color': '#f103f2',
                'MA Cross.long:plot.color': '#fcc101',
                'MA Cross.crosses:plot.color': '#f00',
                'MA Cross.crosses:plot.linewidth': 0,
                'MA Cross.short:plot.linewidth': 1.5,
                'MA Cross.long:plot.linewidth': 1.5
            },

            debug: "production" !== process.env.NODE_ENV,
            skin_theme: cssTheme + "-theme"
        };
        options = this.getOverrides(options, cssTheme);
        if (this.isMobile) {
            options = this.mobileOption(options, cssTheme);
        }

        var widget = new TvWidget(options);
        this.widget = widget;
        this.cssTheme = cssTheme;
        this.options = options;

        this.initChartReady(true);
        if (this.floatTradeData) {
            this.floatTradeData = ''
        }

        this.onUpdateWsData = this.onUpdateWsData.bind(this);
        this.onUpdateNewWsData = this.onUpdateNewWsData.bind(this);
        this.onUpdateTick = this.onUpdateTick.bind(this);
        this.onUpdateNewTicks = this.onUpdateNewTicks.bind(this);
        this.subscribe = this.subscribe.bind(this);

        if (isEmptyObject(this.dataCache)) {
            this.addListenerAndSub();
            // var self = this;
            // //断线重连时用到
            // WsMgr.on('open',  ()=>{
            //     this.switchMode(symbol, mode);
            //     WsMgr.subscribeKline(self.symbol, self.period);
            // })
        }

        this.studyMap = getStorage('TVStudy', true) || this.freeStudy;
    },
    addListenerAndSub(){
        WsMgr.on('kline', this.onUpdateWsData);
        WsMgr.on('kline_cfd', this.onUpdateNewWsData);
        WsMgr.on('tick_fut', this.onUpdateTick);
        WsMgr.on('tick_cfd', this.onUpdateNewTicks);
        // WsMgr.on('kline', this.subscribeBars.bind(this));
        // WsMgr.on('tick', this.onUpdateTicker.bind(this));
        // WsMgr.on('tick_fut', this.onUpdateTicker.bind(this));
        // this.reqKlineHistory(this.symbol, this.getSubscribePeriod(this.period), this.mode, this.reqBarsCount);
        WsMgr.on('open', this.subscribe);
        this.subscribe();
    },
    removeListenerAndUnsub(){
        WsMgr.unsubKline(this.parseFullSymbol(this.symbol), this.getSubscribePeriod(this.period));

        WsMgr.off('kline', this.onUpdateWsData);
        WsMgr.off('kline_cfd', this.onUpdateNewWsData);
        WsMgr.off('tick_fut', this.onUpdateTick);
        WsMgr.off('tick_cfd', this.onUpdateNewTicks);
        WsMgr.off('open', this.subscribe);
    },
    getFullSymbol(tradeType, symbol){
        return this.symbolPrefixMap[tradeType]+symbol;
    },
    getSimpleSymbol(fullSymbol){
        var sb = fullSymbol.split("/");
        return sb[1];
    },
    parseFullSymbol(fullSymbol){
        var sb = fullSymbol.split("/");
        var prefix = (sb[0]+"/").toLowerCase();
        var entry = this._revertSbPreMap[prefix];
        return {prefix, entry, symbol:sb[1]};
    },

    mobileOption(options, cssTheme) {
        options.preset = "mobile";
        options.overrides["paneProperties.legendProperties.showLegend"] = false;
        options.studies_overrides["MA Cross.short:plot.linewidth"] = 3;
        options.studies_overrides["MA Cross.long:plot.linewidth"] = 3;
        options.studies_overrides["MACD.MACD.linewidth"] = 3;
        options.studies_overrides["MACD.Signal.linewidth"] = 3;

        options.disabled_features.push("context_menus");
        return options;
    },
    // 创建上下文菜单
    createContextMenu(menuArr) {
        if (!this.widget) return
        return new Promise((resolve, reject) => {
            resolve(this.widget)
        })
    },
    createStudy() {
        // setTimeout(()=>{
            try{
                // 创建技术指标
                if(this.cssTheme=="cfd") return;

                if (!this.checkIsReady()) return false;

                this.widget.chart().createStudy('MA Cross', false, false, [30, 120]);
            }catch (e) {
                console.log(e);
            }
        // }, 500);
    },
    //重新create需要reset

    initChartReady(isReset) {
        if (this.isMobile) {
            this.widget.onChartReady(() => {
                if (!this.isBtnsInited()) {
                    // 创建技术指标
                    this.createStudy();
                }
            });
            return false;
        }

        var self = this;
        if (isReset){
            this.buttonArr = [
                { value: '1', text: '1M', key: '1MIN', chartType:1, save: true },
                { value: '3', text: '3M', key: '3MIN', chartType:1, save: false },
                { value: '5', text: '5M', key: '5MIN', chartType:1, save: true },
                { value: '15', text: '15M', key: '15MIN', chartType:1, save: true },
                { value: '30', text: '30M', key: '30MIN', chartType:1, save: false },
                { value: '60', text: '1H', key: '1HOUR', chartType:1, save: true },
                { value: '120', text: '2H', key: '2HOUR', chartType:1, save: false },
                { value: '180', text: '3H', key: '3HOUR', chartType:1, save: false },
                { value: '240', text: '4H', key: '4HOUR', chartType:1, save: false },
                { value: '360', text: '6H', key: '6HOUR', chartType:1, save: true },
                { value: '720', text: '12H', key: '12HOUR', chartType:1, save: false },
                { value: 'D', text: '1D', key: '1DAY', chartType:1, save: true },
                { value: '3D', text: '3D', key: '3DAY', chartType:1, save: false },
                { value: 'W', text: '1W', key: '1WEEK', chartType:1, save: true },
                { value: '2W', text: '2W', key: '2WEEK', chartType:1, save: false }
            ];

            if(this.cssTheme=='cfd'){
                this.buttonArr.unshift({value:'1', text:Intl.lang("KlineDiv.101"), key:'1MIN', chartType:2, save:true});
            }
        }
        //if (Intl.getChartLang() === 'en') {
        //    this.buttonArr.map(v => v.text = v.text.replace('分钟', 'M').replace('小时', 'H').replace('日', 'D').replace('周', 'W'))
        //}
        this.widget.onChartReady(() => {
            this._initChartReady();
        });
    },
    _initChartReady(){
        try{
            if (this.chartReadyTimer){
                clearTimeout(this.chartReadyTimer);
                this.chartReadyTimer = 0;
            }

            if (!this.isBtnsInited()) {
                if (this.checkIsReady()){
                    this.createStudy();

                    removeStorage('TV_sData', true);
                    var tvData = getStorage(this.tvDataKey, true)||{};
                    if (tvData){
                        var sData = tvData[this.cssTheme];
                        if (sData){
                            var sInfo = sData.charts[0].panes[0].sources[0].state;
                            sInfo.symbol = this.symbol;
                            sInfo.shortName = this.symbol;
                            sInfo.interval = this.periodToTV[this.period];

                            this.widget.load(sData);
                        }
                    }

                    // 订阅时间周期
                    this.widget.chart().onIntervalChanged().subscribe(null, interval => {
                        this.buttonArr.forEach(elm => {
                            // const item = frames[0].frameElement.contentDocument.getElementById(elm.key)
                            // console.log(' >> interval:', interval)
                            if (String(elm.value) === String(interval) && elm.chartType==this.chartType && elm.target) {
                                elm.target.addClass('active')
                            } else if (elm.target) {
                                elm.target.removeClass('active')
                            }
                        });

                        this.setResolution(interval);
                    });

                    // 生成自定义按钮
                    this.buttonArr.forEach((v, i) => {
                        var btn = this.widget.createButton().on('click', e => {
                            this.handleClick(e, v.value, v.chartType);

                            this.buttonArr.forEach((nv)=>{
                                if (nv.target!=v.target) nv.target.removeClass('active');
                            });
                            v.target.addClass('active');
                        });

                        var cls = v.save ? "time-group-save" : "time-group-normal";
                        btn.html(v.text);
                        btn.attr("title", v.text).parent().addClass(cls);

                        if (v.key == this.period && v.chartType==this.chartType) {
                            btn.addClass('active');
                        }

                        v.target = btn
                    });

                    // 自定义mode下拉 ['BID', 'ASK', 'LAST']
                    if (this.isFut){
                        var selHtml = "";
                        this.modeArr.forEach((v, i) => {
                            if (this.mode == v) {
                                selHtml += '<option selected="selected" value="' + v + '">' + v + '</option>';
                            } else {
                                selHtml += '<option value="' + v + '">' + v + '</option>';
                            }
                        });
                        selHtml = '<select class="tv-price-type sel-cus" value="' + this.mode + '">' + selHtml + '</select>';
                        var selectElem = $(selHtml);
                        selectElem.on('change', (e)=>{
                            this.onChangeMode(e);
                        });
                        this.widget.createButton().append(selectElem).removeClass('button').parent().addClass('i-float_right');
                    }

                    if(this.cssTheme=="cfd"){
                        this.createPriceLine();
                    }

                    // 自定义全屏按钮
                    var titleTxt = Intl.lang("TV.full_screen");
                    var fullIcon = '<span class="icon-full"></span>';
                    this.widget.createButton().on('click', (e) => {
                        this.allowFullScreen(e);
                    }).append($(fullIcon)).attr('title', titleTxt).parents('.space-single').addClass('header-group-fullscreen');

                    //监听指标
                    this.widget.subscribe("onAutoSaveNeeded", () => {
                        this.widget.save((state)=>{
                            tvData[this.cssTheme] = state;
                            setStorage(this.tvDataKey, tvData, true);
                        });
                        // this.subscribeStudy();
                    });
                }else{
                    this.chartReadyTimer = setTimeout(()=>{
                        this._initChartReady();
                    }, 20);
                }
            }
        }catch (e) {
            console.error(e);
        }
    },
    checkIsReady(){
        try{
            if (!this.widget || !this.widget.chart || !this.widget._innerAPI || !this.widget._innerWindow() || !this.widget._innerAPI()) return false;
            return true;
        }catch (e){
            // console.error(e);
            return false;
        }
    },
    getSubscribePeriod(period) {
        var resolution = this.periodToTV[period];
        resolution = this.getSrcResolution(resolution);
        return this.tvToTypeMap[resolution];
    },
    getSrcResolution(resolution) {
        if (resolution == "D" || resolution.indexOf('D') != -1 || resolution.indexOf('W') != -1) {
            resolution = 'D';
        } else if (resolution < 1440 && resolution >= 60) {
            resolution = '60';
        } else if (resolution < 60 && resolution >= 5) {
            resolution = '5';
        } else if (resolution < 5 && resolution >= 1) {
            resolution = '1';
        }
        return resolution;
    },
    isBtnsInited() {
        return this.buttonArr[0] && this.buttonArr[0].target && this.buttonArr[0].target.length;
    },
    handleClick(e, value, chartType) {
        //$(e.target).addClass('active').closest('div.space-single').siblings('div.space-single').find('div.button').removeClass('active');

        if(this.cssTheme=="cfd"){
            this.changeCFDChart(chartType);
        }
        this.setResolution(value);
    },
    changeCFDChart(chartType){
        if(this.chartType != chartType){
            this.chartType = chartType;
            this.widget.chart().setChartType(chartType);
        }else{
            return false;
        }
        this.options = this.getOverrides(this.options, 'cfd');
        var overrides = this.options.overrides;

        if(chartType==1){
            this.removeShapes();

            var StudyID = this.getStudyId();
            if (StudyID['MA Cross']) {
                let macrossStyle = this.options.MA_Cross_style;
                this.widget.chart().getStudyById(StudyID['MA Cross']).applyOverrides(macrossStyle);
            }
            var studies_overrides = this.options.studies_overrides;
            this.widget.applyStudiesOverrides(studies_overrides);
        }else{
            this.removeShapes();

            this.createPriceLine();
        }
        this.widget.applyOverrides(overrides);

        var tvData = getStorage(this.tvDataKey, true)||{};
        this.widget.save((state)=>{
            tvData[this.cssTheme] = state;
            setStorage(this.tvDataKey, tvData, true);
        });

        if (this.switchCallback) this.switchCallback(null, null, null, this.chartType);
    },
    loadPriceLineData(){
        const {symbol} = this.parseFullSymbol(this.symbol);
        var product = TradeMgr.getProduct(symbol, CONST.TRADE_TYPE.CFG);
        if (product && product.price){
            if (Number(product.price.ASK))this.priceCache[0] = product.price.ASK;
            if (Number(product.price.BID))this.priceCache[1] = product.price.BID;
        }
    },
    removeShapes(){
        if (this.widget.chart()){
            this.widget.chart().removeAllShapes();
            if(this.linesASK){this.widget.chart().removeEntity(this.linesASK);this.linesASK=null;this.askShape=null;}
            if(this.linesBID){this.widget.chart().removeEntity(this.linesBID);this.linesBID=null;this.bidShape=null;}
        }
    },
    createPriceLine(){
        if(this.chartType!=2 || this.priceLineTimer) return false;
        // CFD 价格划线
        this.priceLineTimer = setTimeout(()=>{
            this.priceLineTimer = null;

            if(!this.linesASK && this.chartType==2){
                this.loadPriceLineData();

                let options = {
                    shape:'horizontal_line',
                    lock:true,
                    showInObjectsTree: false,
                    disableSelection:true,
                    disableSave:true,
                    overrides:{"linestyle":1, "linewidth":1}
                };
                // console.log(this.priceCache);

                options.overrides['linecolor']="rgba(103,159,30,1)";
                this.linesASK = this.widget.chart().createShape({price:this.priceCache[0]}, options, (entityId)=>{
                    console.log(entityId);
                });

                options.overrides['linecolor']="rgba(255,30,108,1)";
                this.linesBID = this.widget.chart().createShape({price:this.priceCache[1]}, options, (entityId)=>{
                    console.log(entityId);
                });

                if (this.linesASK && this.linesBID){
                    this.askShape = this.widget.chart().getShapeById(this.linesASK);
                    this.bidShape = this.widget.chart().getShapeById(this.linesBID);
                }else{
                    this.createPriceLine();
                }
                //setTimeout(()=>{
                //    var lineObj = this.widget.chart().getShapeById(this.linesASK);
                //    lineObj.setPoints([{price:3370, time:1495459800}])
                //}, 1000)
            }
        }, 100);
    },

    allowFullScreen(e) {
        if (this.isFullScreen) {
            $('#root').removeClass('tv-fullScreen');
            $('.KlineDiv').removeClass('kline-full');
            exitFull();
            this.handleEsc();
            if (this.isFut) this.tradePanel.style.display = 'none';
        } else {
            $('#root').addClass('tv-fullScreen');
            $('.KlineDiv').addClass('kline-full');
            requestFullScreen();
            this.handleEsc(true);
            if (this.isFut && !this.tradePanel) {
                this.tradePanel = frames[0].frameElement.contentDocument.getElementById('zhuwenbo-toolbar');
            }
            if (this.isFut) this.tradePanel.style.display = 'block';
        }
        this.isFullScreen = !this.isFullScreen;
        // test        this.saveData();
    },
    resetClass() {
        $('#root').removeClass('tv-fullScreen');
        $('.KlineDiv').removeClass('kline-full');
        if (this.isFut) this.tradePanel.style.display = 'none';
        this.isFullScreen = false;
        window.onresize = "";
    },
    //对应的时间转换秒
    convertPeriod2Secs(period){
        var interval;
        if (period.indexOf("MIN")!=-1){
            interval = 60;
        }else if(period.indexOf("HOUR")!=-1){
            interval = 60*60;
        }else if(period.indexOf("DAY")!=-1){
            interval = 60*60*24;
        }else if(period.indexOf("WEEK")!=-1){
            interval = 60*60*24*7;
        }
        return interval ? interval*parseInt(period) : 0;
    },
    handleEsc(lister) {
        var self = this;
        window.onresize = ""; //function() {return false};
        if (lister) {
            window.onresize = function () {
                if (!checkScreenFull()) {
                    self.resetClass();
                }
            };
        }
    },
    onChangeMode(e) {
        e.preventDefault();
        e.stopPropagation();

        var mode = e.target.value;
        // console.log(this.mode, '=>>select =>>>>', mode);
        if (this.mode != mode) {
            this.switchMode(this.symbol, mode);
        }
    },
    // subscribeStudy() {
    //     var studies = this.widget.chart().getAllStudies();   //console.log(studies);
    //     var studyData = this.difStudy(studies);
    //
    //     if (studyData[0]) {
    //         this.studyMap = Object.assign(this.freeStudy, studyData[1]);
    //         setStorage("TVStudy", this.studyMap, true);     // or key: 'TVStudy'+(Uid||"")
    //     }
    // },
    // difStudy(curData) {
    //     let historyData = Object.keys(this.studyMap), studyList = {}, isChange = false;
    //
    //     curData.forEach((item, i) => {
    //         if (!this.studyMap[item.name]) {        // new add
    //             isChange = true;
    //         }
    //         studyList[item.name] = 1;
    //     });
    //     if (historyData.length) {
    //         historyData.forEach((data, k) => {
    //             if (!studyList[data]) {           // lose
    //                 isChange = true;
    //             }
    //         });
    //     }
    //     return [isChange, studyList];
    // },
    // saveData() {
    //     this.widget.save(function (data) {
    //         var d = data;
    //         console.log(d);
    //     });
    // },
    getOverrides(options, cssTheme) {
        options.overrides["mainSeriesProperties.style"] = 1;
        options.volume_style = {};
        options.MA_Cross_style = {};

        var dIndex = options.disabled_features.indexOf("create_volume_indicator_by_default");
        if (dIndex!=-1){
            options.disabled_features.splice(dIndex, 1);
        }
        var eIndex = options.enabled_features.indexOf("create_volume_indicator_by_default");
        if (eIndex!=-1){
            options.enabled_features.splice(eIndex, 1);
        }

        if (cssTheme == 'gray') {
            //options.toolbar_bg = "#363636";
            options.custom_css_url = 'bundles/skin-theme.css';
            options.overrides["paneProperties.background"] = "#363636";
            options.overrides["scalesProperties.backgroundColor"] = "#363636";
            options.overrides["scalesProperties.textColor"] = "#cdcdcd";
            options.overrides["scalesProperties.lineColor"] = "#4a4a4a";

            options.overrides["paneProperties.vertGridProperties.color"] = "#383838";
            options.overrides["paneProperties.horzGridProperties.color"] = "#383838";

            options.overrides["mainSeriesProperties.candleStyle.upColor"] = "#f00";
            options.overrides["mainSeriesProperties.candleStyle.borderUpColor"] = "#f00";
            options.overrides["mainSeriesProperties.candleStyle.wickUpColor"] = "#f00";

            options.overrides["mainSeriesProperties.candleStyle.downColor"] = "#7092be";
            options.overrides["mainSeriesProperties.candleStyle.borderDownColor"] = "#7092be";
            options.overrides["mainSeriesProperties.candleStyle.wickDownColor"] = "#7092be";

            options.studies_overrides["volume.volume.color.0"] = "#7092be";
            options.studies_overrides["volume.volume.color.1"] = "#7092be";
            options.studies_overrides["MA Cross.short:plot.color"] = "#f103f2";
            options.studies_overrides["MA Cross.long:plot.color"] = "#fff900";

            options.volume_style["volume.color.0"] = "#7092be";
            options.volume_style["volume.color.1"] = "#7092be";
            options.MA_Cross_style["short:plot.color"] = "#f103f2";
            options.MA_Cross_style["long:plot.color"] = "#fff900";

            options.enabled_features.push("create_volume_indicator_by_default");  // 开启成交量
        }
        else if (cssTheme == 'primary') {
            //options.toolbar_bg = "#262d33";
            options.custom_css_url = 'bundles/skin-theme.css';
            options.overrides["paneProperties.background"] = "#262d33";
            options.overrides["scalesProperties.backgroundColor"] = "#262d33";
            options.overrides["scalesProperties.textColor"] = "#cdcdcd";
            options.overrides["scalesProperties.lineColor"] = "#4c5052";

            options.overrides["paneProperties.vertGridProperties.color"] = "#293138";
            options.overrides["paneProperties.horzGridProperties.color"] = "#293138";
            options.overrides["mainSeriesProperties.showPriceLine"] = true;

            options.overrides["mainSeriesProperties.candleStyle.upColor"] = "#70a800";
            options.overrides["mainSeriesProperties.candleStyle.borderUpColor"] = "#70a800";
            options.overrides["mainSeriesProperties.candleStyle.wickUpColor"] = "#70a800";

            options.overrides["mainSeriesProperties.candleStyle.downColor"] = "#ea0070";
            options.overrides["mainSeriesProperties.candleStyle.borderDownColor"] = "#ea0070";
            options.overrides["mainSeriesProperties.candleStyle.wickDownColor"] = "#ea0070";

            //	Hollow Candles styles
            options.overrides["mainSeriesProperties.style"] = 1;

            //options.overrides["mainSeriesProperties.hollowCandleStyle.upColor"] = "#73c921";
            //options.overrides["mainSeriesProperties.hollowCandleStyle.borderUpColor"] = "#73c921";
            //options.overrides["mainSeriesProperties.hollowCandleStyle.wickUpColor"] = "#73c921";

            //options.overrides["mainSeriesProperties.hollowCandleStyle.downColor"] = "#ca2c78";
            //options.overrides["mainSeriesProperties.hollowCandleStyle.borderDownColor"] = "#ca2c78";
            //options.overrides["mainSeriesProperties.hollowCandleStyle.wickDownColor"] = "#ca2c78";

            options.studies_overrides["volume.volume.color.0"] = "rgba(234,0,112,0.6)";
            options.studies_overrides["volume.volume.color.1"] = "rgba(112,168,0,0.6)";
            options.studies_overrides["MA Cross.short:plot.color"] = "#7092be";
            options.studies_overrides["MA Cross.long:plot.color"] = "#fbc834";

            options.studies_overrides["MA Cross.precision"] = 0;

            options.volume_style["volume.color.0"] = "rgba(234,0,112,0.6)";
            options.volume_style["volume.color.1"] = "rgba(112,168,0,0.6)";
            options.MA_Cross_style["short:plot.color"] = "#7092be";
            options.MA_Cross_style["long:plot.color"] = "#fbc834";

            options.enabled_features.push("create_volume_indicator_by_default");  // 开启成交量
        } else if (cssTheme == "white") {
            //options.toolbar_bg = "#fff";
            options.custom_css_url = 'bundles/skin-theme.css';
            options.overrides["paneProperties.background"] = "#fefefe";
            options.overrides["scalesProperties.backgroundColor"] = "#fefefe";
            options.overrides["scalesProperties.textColor"] = "#888";
            options.overrides["scalesProperties.lineColor"] = "#c9cbcd";

            options.overrides["paneProperties.vertGridProperties.color"] = "#f8f8f8";
            options.overrides["paneProperties.horzGridProperties.color"] = "#f8f8f8";


            //	Hollow Candles styles
            options.overrides["mainSeriesProperties.candleStyle.upColor"] = "#00ac7d";
            options.overrides["mainSeriesProperties.candleStyle.borderUpColor"] = "#00ac7d";
            options.overrides["mainSeriesProperties.candleStyle.wickUpColor"] = "#00ac7d";

            options.overrides["mainSeriesProperties.candleStyle.downColor"] = "#ff5b72";
            options.overrides["mainSeriesProperties.candleStyle.borderDownColor"] = "#ff5b72";
            options.overrides["mainSeriesProperties.candleStyle.wickDownColor"] = "#ff5b72";

            options.overrides["mainSeriesProperties.candleStyle.drawWick"] = true;
            options.overrides["mainSeriesProperties.candleStyle.drawBorder"] = true;
            options.overrides["mainSeriesProperties.candleStyle.borderColor"] = "#10b92a";
            options.overrides["mainSeriesProperties.candleStyle.wickColor"] = "#10b92a";

            options.studies_overrides["volume.volume.color.0"] = "rgba(255,91,114,0.5)";
            options.studies_overrides["volume.volume.color.1"] = "rgba(0,172,125,0.5)";
            options.studies_overrides['MA Cross.short:plot.color'] = '#5c9ff5';
            options.studies_overrides['MA Cross.long:plot.color'] = '#f103f2';

            options.volume_style["volume.color.0"] = "rgba(255,91,114,0.5)";
            options.volume_style["volume.color.1"] = "rgba(0,172,125,0.5)";
            options.MA_Cross_style["long:plot.color"] = "#5c9ff5";
            options.MA_Cross_style["short:plot.color"] = "#f103f2";

            options.enabled_features.push("create_volume_indicator_by_default");  // 开启成交量
        }
        else if (cssTheme == 'dark') {
            options.toolbar_bg = "#262d33";
            options.custom_css_url = 'bundles/primary-theme.css';
            options.overrides["paneProperties.background"] = "#262d33";
            options.overrides["scalesProperties.backgroundColor"] = "#262d33";
            options.overrides["scalesProperties.textColor"] = "#cdcdcd";
            options.overrides["scalesProperties.lineColor"] = "#4c5052";

            options.overrides["paneProperties.vertGridProperties.color"] = "#293138";
            options.overrides["paneProperties.horzGridProperties.color"] = "#293138";

            options.overrides["mainSeriesProperties.candleStyle.upColor"] = "#70a800";
            options.overrides["mainSeriesProperties.candleStyle.borderUpColor"] = "#70a800";
            options.overrides["mainSeriesProperties.candleStyle.wickUpColor"] = "#70a800";

            options.overrides["mainSeriesProperties.candleStyle.downColor"] = "#ea0070";
            options.overrides["mainSeriesProperties.candleStyle.borderDownColor"] = "#ea0070";
            options.overrides["mainSeriesProperties.candleStyle.wickDownColor"] = "#ea0070";

            //	Hollow Candles styles
            options.overrides["mainSeriesProperties.style"] = 1;

            //options.overrides["mainSeriesProperties.hollowCandleStyle.upColor"] = "#73c921";
            //options.overrides["mainSeriesProperties.hollowCandleStyle.borderUpColor"] = "#73c921";
            //options.overrides["mainSeriesProperties.hollowCandleStyle.wickUpColor"] = "#73c921";
            //
            //options.overrides["mainSeriesProperties.hollowCandleStyle.downColor"] = "#ca2c78";
            //options.overrides["mainSeriesProperties.hollowCandleStyle.borderDownColor"] = "#ca2c78";
            //options.overrides["mainSeriesProperties.hollowCandleStyle.wickDownColor"] = "#ca2c78";

            options.studies_overrides["volume.volume.color.0"] = "rgba(234,0,112,0.6)";
            options.studies_overrides["volume.volume.color.1"] = "rgba(112,168,0,0.6)";
            options.studies_overrides["MA Cross.short:plot.color"] = "#7092be";
            options.studies_overrides["MA Cross.long:plot.color"] = "#fff900";

            options.enabled_features.push("create_volume_indicator_by_default");  // 开启成交量
        }else if (cssTheme == 'cfd') {
            options.toolbar_bg = "#262d33";
            options.custom_css_url = 'bundles/primary-theme.css';
            options.overrides["paneProperties.background"] = "#262d33";
            options.overrides["scalesProperties.backgroundColor"] = "#262d33";
            options.overrides["scalesProperties.textColor"] = "#fff";
            options.overrides["scalesProperties.lineColor"] = "#4c5052";
            options.overrides["paneProperties.vertGridProperties.color"] = "#262d33";
            options.overrides["paneProperties.horzGridProperties.color"] = "#262d33";

            if(this.chartType==2){
                options.overrides["mainSeriesProperties.showPriceLine"] = false;
                options.overrides["mainSeriesProperties.showCountdown"] = false;
                options.overrides["scalesProperties.showSeriesLastValue"] = false;
                //	Line styles
                options.overrides["mainSeriesProperties.style"] = 2;
                options.overrides["mainSeriesProperties.lineStyle.color"]= "#3cc195";
                options.overrides["mainSeriesProperties.lineStyle.linestyle"]= 0;
                options.overrides["mainSeriesProperties.lineStyle.linewidth"]= 2;
                options.overrides["mainSeriesProperties.lineStyle.priceSource"]=  "close";
            }else{
                options.overrides["mainSeriesProperties.showPriceLine"] = true;
                //options.overrides["mainSeriesProperties.showCountdown"] = true;
                options.overrides["scalesProperties.showSeriesLastValue"] = true;

                options.overrides["mainSeriesProperties.style"] = 1;
                options.overrides["mainSeriesProperties.candleStyle.upColor"] = "#70a800";
                options.overrides["mainSeriesProperties.candleStyle.borderUpColor"] = "#70a800";
                options.overrides["mainSeriesProperties.candleStyle.wickUpColor"] = "#70a800";
                options.overrides["mainSeriesProperties.candleStyle.downColor"] = "#ea0070";
                options.overrides["mainSeriesProperties.candleStyle.borderDownColor"] = "#ea0070";
                options.overrides["mainSeriesProperties.candleStyle.wickDownColor"] = "#ea0070";
            }

            options.disabled_features.push("create_volume_indicator_by_default");  // 关闭成交量
        }

        /** 指标覆盖**/
        // MACD
        options.studies_overrides["MACD.histogram:plot.color"] = "#fd0066";
        options.studies_overrides["MACD.macd:plot.color"] = "#208bfb";
        options.studies_overrides["MACD.signal:plot.color"] = "#fc601e";
        // 布林
        options.studies_overrides["bollinger bands.median.color"] = "#33FF88";
        options.studies_overrides["bollinger bands.lower.color"] = "#009900";
        options.studies_overrides["bollinger bands.upper.color"] = "#fd0066";
        // 'Parabolic SAR'
        options.studies_overrides["Parabolic SAR.plot.color"] = "#208bfb";

        return options;
    },
    subscribe() {
        if (WsMgr.isOpen()) {
            this.reconnectStatus = 1;
            //断线重连后，需获取断线时间内的bars
            this.reqOfflineBars();

            if (this.mode && this.isFut) WsMgr.switchKlineStype(this.parseFullSymbol(this.symbol), this.mode);
            WsMgr.subscribeKline(this.parseFullSymbol(this.symbol), this.getSubscribePeriod(this.period), this.subscribeCnt);
        }
    },
    //请求断线时间段的历史数据
    reqOfflineBars(){
        var result = this._reqRecentHistory(this.symbol, this.period, this.mode, (isSame)=>{
            this.reconnectStatus = 0;
            if (isSame) this.dataFeed.update();
        });
        if (!result) this.reconnectStatus = 0;
    },
    _reqRecentHistory(symbol, period, mode, callback){
        var dataPeriod = this.getSubscribePeriod(period);
        var data = this.dataCache[symbol] && this.dataCache[symbol][dataPeriod] ? this.dataCache[symbol][dataPeriod][mode] : null;
        if (data) {
            var lastBars = data[data.length - 1];
            if (lastBars && lastBars.time) {
                var lastTime = Math.floor(lastBars.time / 1000);
                var secs = this.convertPeriod2Secs(dataPeriod);
                var now = this.getServerTime();
                if (now - lastTime > secs * this.subscribeCnt) {
                    // console.log("reqOfflineBars ", this.symbol, dataPeriod, this.mode, 0, lastTime, now);
                    this.reqKlineHistory(this.symbol, dataPeriod, this.mode, 0, lastTime, now, (isSame) => {
                        if (callback)callback(isSame);
                    });
                    return true;
                }
            }
        }
        return false;
    },
    filterBars(bars, fromMs, toMs){
        var newBars = [];
        for (var i=0,l=bars.length; i<l; i++){
            var info = bars[i];
            var barTime = info.time;
            if (barTime >= fromMs && barTime <= toMs){
                newBars.push(info);
            }else if (barTime > toMs) break;
        }
        return newBars;
    },
    _getBarsResponse(data, fromMs, toMs, callback){
        this.prevGetBarsInfo.callback = null;

        var newBars = data;
        if (newBars && fromMs && toMs){
            newBars = this.filterBars(newBars, fromMs, toMs);
        }

        if (newBars && newBars.length){
            // console.log(newBars);
            newBars.sort((l, r)=>l.time > r.time ? 1 : -1);
            if (callback) callback({ s: 'ok', bars:newBars });
        }else{
            if (callback) callback({s: 'no_data'});
        }
    },
    getBars(fullSymbol, resolution, from, to, callback, firstDataRequest, isSubscribe) {
        // console.warn("getBars", symbol, resolution, `${from}(${moment(from*1000).format("YYYY-MM-DD HH:mm:ss")})`, `${to}(${moment(to*1000).format("YYYY-MM-DD HH:mm:ss")})`, firstDataRequest, isSubscribe, this.isLoadingBar);
        const {entry, prefix, symbol} = this.parseFullSymbol(fullSymbol);
        const newFullSymbol = prefix+symbol;


        this.prevGetBarsInfo.callback = callback;
        // if (this.getBarsTimer){
        //     clearTimeout(this.getBarsTimer);
        //     this.getBarsTimer = 0;
        // }
        var newResolution = this.getSrcResolution(resolution);

        var period = this.tvToTypeMap[newResolution];

        var data = this.dataCache[newFullSymbol] && this.dataCache[newFullSymbol][period] ? this.dataCache[newFullSymbol][period][this.mode] : null;
        var fromMs = from * 1000;
        var toMs = to * 1000;
        var mode = this.mode;

        var now = this.getServerTime();

        // if (!isSubscribe) this.onGetBarsCallback = callback;
        // console.log("getBars", resolution, from, to, firstDataRequest, isSubscribe);
        if (firstDataRequest){
            this.isFirstGetbar = true;
            if (data){
                var firstBar = data[0];
                var len = data.length;
                var lastBar = data[data.length-1];
                var lastTime = Math.floor(lastBar.time/1000);
                var secs = this.convertPeriod2Secs(period);
                //有超过5+1条数据时（不单是有ws推送过来的）
                if (len > this.subscribeCnt+1){
                    if (this.isLoadingBar){
                        // console.warn("getBars 000");
                        var timer = setTimeout(()=>{
                            this.prevGetBarsInfo.timer = 0;
                            this.getBars(newFullSymbol, resolution, from, to, callback, firstDataRequest, isSubscribe);
                        }, 20);

                        this.prevGetBarsInfo.timer = timer;
                    }
                    //时间范围内的直接返回
                    else if (firstBar && firstBar.time<=fromMs && Math.abs(Math.min(now, to) - lastTime)<secs){
                        // console.warn("getBars 111");
                        this._getBarsResponse(data, 0, 0, callback);
                    }else{ //否则请求剩余-3的bar(不用最后一条，防止ws刚推了一条过来)到to的
                        // console.warn("getBars 222");
                        var barTime = data[data.length-3].time;
                        this.reqKlineHistory(newFullSymbol, period, mode, 0, Math.floor(barTime/1000), to, (isSame)=>{
                            // if (isSame){
                                var data = this.dataCache[newFullSymbol] && this.dataCache[newFullSymbol][period] ? this.dataCache[newFullSymbol][period][mode] : null;
                                this._getBarsResponse(data, 0, 0, callback);
                            // }
                        });
                    }
                    return;
                }
            }
            // console.warn("getBars 5000");
            //第一次请求最后5000条
            this.reqKlineHistory(newFullSymbol, period, mode, 5000, 0, 0, (isSame)=>{
                // if (isSame){
                    var data = this.dataCache[newFullSymbol] && this.dataCache[newFullSymbol][period] ? this.dataCache[newFullSymbol][period][mode] : null;
                    this._getBarsResponse(data, 0, 0, callback);
                // }
            });
        }else{
            //实时推送的
            if (isSubscribe){
                var data = this.dataCache[newFullSymbol] && this.dataCache[newFullSymbol][period] ? this.dataCache[newFullSymbol][period][mode] : null;
                this._getBarsResponse(data, fromMs, toMs, callback);
            }else{
                if (data){
                    if (this.isLoadingBar){
                        // console.warn("getBars 000");
                        var timer = setTimeout(()=>{
                            this.prevGetBarsInfo.timer = 0;
                            this.getBars(newFullSymbol, resolution, from, to, callback, firstDataRequest, isSubscribe);
                        }, 20);

                        this.prevGetBarsInfo.timer = timer;
                        return;
                    }

                    var firstBar = data[0];
                    var lastBar = data[data.length-1];
                    if (firstBar){
                        if (firstBar.time<=fromMs){
                            this._getBarsResponse(data, fromMs, toMs, callback);
                            return;
                        }

                        //如果开始时间在请求时间中间；或者在请求时间结束之后
                        if (firstBar.time<toMs && fromMs<firstBar.time || firstBar.time>toMs){
                            to = Math.floor(firstBar.time/1000);
                        }

                        if (from>=to){
                            var data = this.dataCache[newFullSymbol] && this.dataCache[newFullSymbol][period] ? this.dataCache[newFullSymbol][period][mode] : null;
                            this._getBarsResponse(data, fromMs, toMs, callback);
                            return;
                        }
                    }
                }

                this.reqKlineHistory(newFullSymbol, period, mode, 0, from, to, (isSame)=>{
                    // if (isSame){
                        var data = this.dataCache[newFullSymbol] && this.dataCache[newFullSymbol][period] ? this.dataCache[newFullSymbol][period][mode] : null;
                        this._getBarsResponse(data, fromMs, toMs, callback);
                    // }
                });
            }
        }
    },
    //取消上次的getbars
    cancelPrevGetBars(){
        // if (this.prevGetBarsInfo.callback){
        //     this.prevGetBarsInfo.callback({s: 'no_data'});
        //     this.prevGetBarsInfo.callback = null;
        // }
        this.cancelPrevGetBarsTimer();
    },
    cancelPrevGetBarsTimer(){
        if (this.prevGetBarsInfo.timer){
            clearTimeout(this.prevGetBarsInfo.timer);
            this.prevGetBarsInfo.timer = 0;
        }
    },
    setLanguage(lang) {
        try{
            if (this.setLangTimer){
                clearTimeout(this.setLangTimer);
                this.setLangTimer = 0;
            }
            if (this.widget) {
                this.widget.setLanguage(lang);
                this.setLangTimer = setTimeout(()=>{
                    this.setLangTimer = 0;
                    this.initChartReady(true);
                    if (this.floatTradeData) {
                        this.floatTradeData = ''
                    }
                }, 50);
            }
        }catch (e) {
            console.log(e);
        }
    },
    setTheme(cssTheme) {
        if (this.widget) {
            this.changeSkin(cssTheme);
        }
    },
    changeSkin(cssTheme) {
        let skinTheme = cssTheme + "-theme";
        this.options = this.getOverrides(this.options, cssTheme);

        var overrides = this.options.overrides;
        var studies_overrides = this.options.studies_overrides;

        var StudyID = this.getStudyId();
        if (StudyID.Volume) {
            let volumeStyle = this.options.volume_style;
            this.widget.chart().getStudyById(StudyID.Volume).applyOverrides(volumeStyle);
        }
        if (StudyID['MA Cross']) {
            let macrossStyle = this.options.MA_Cross_style;
            this.widget.chart().getStudyById(StudyID['MA Cross']).applyOverrides(macrossStyle);
        }

        this.widget.setTheme(skinTheme);
        this.widget.applyStudiesOverrides(studies_overrides);
        this.widget.applyOverrides(overrides);

        var tvHtml = frames[0].frameElement.contentDocument.getElementsByTagName('html');  //console.log(this.cssTheme);
        if(frames[1]) tvHtml = frames[1].frameElement.contentDocument.getElementsByTagName('html');
        $(tvHtml).removeClass(this.cssTheme + '-theme');
        $(tvHtml).addClass(skinTheme);

        this.cssTheme = cssTheme;
    },
    getStudyId() {
        var studies = this.widget.chart().getAllStudies(), studyID = {};
        studies.forEach((item, i) => {
            studyID[item.name] = item.id;
        });
        return studyID;
    },
    setResolution(value) {
        if (this.widget) {
            var period = this.tvToTypeMap[value];
            if (period!=this.period) {
                var oldRealPeriod = this.getSubscribePeriod(this.period);
                var newRealPeriod = this.getSubscribePeriod(period);

                //要重新加载k线数据的先重置标识，防止未加载价格变动调用实时更新
                if (oldRealPeriod!=newRealPeriod){
                    this.cancelPrevGetBars();
                    this.isFirstGetbar = false;
                }else{
                    this.cancelPrevGetBarsTimer();
                }
                //加载最近没有的历史数据 因为订阅ws后会返回最近5条数据，所以先用rest api加载没有的数据，否则无法判断从那条数据开始加载
                var result = this._reqRecentHistory(this.symbol, period, this.mode, (isSame)=>{
                    if (isSame) this.isLoadingBar = false;
                });
                if (result){
                    this.isLoadingBar = true;
                }

                this.widget.chart().setResolution(value);
                // this.getBarsFirst = true;

                this.period = period;

                this.lastGetBarsParam = {};
                // this.reqKlineHistory(this.symbol, newRealPeriod, this.mode, this.reqBarsCount);
                if (this.mode && this.isFut) WsMgr.switchKlineStype(this.parseFullSymbol(this.symbol), this.mode);
                if (oldRealPeriod != newRealPeriod) WsMgr.subscribeKline(this.parseFullSymbol(this.symbol), newRealPeriod, this.subscribeCnt);

                this.onChangeOptions(this.symbol, period);
                if (this.switchCallback) this.switchCallback(this.symbol, period, null, this.chartType);
            }
        }
    },
    // parseTime(endTime) {
    //     var date = new Date();
    //     date.setFullYear(endTime.substring(0, 4));
    //     date.setMonth(endTime.substring(5, 7) - 1);
    //     date.setDate(endTime.substring(8, 10));
    //     date.setHours(endTime.substring(11, 13));
    //     date.setMinutes(endTime.substring(14, 16));
    //     date.setSeconds(endTime.substring(17, 19));
    //     return Date.parse(date);
    // },
    getTVConfig() {
        return { "supported_resolutions": this.supported_resolutions };
    },
    resolveTVSymbol(fullSymbol) {
        const {entry, prefix, symbol} = this.parseFullSymbol(fullSymbol);
        var data = {
            "name": fullSymbol,
            "exchange-traded": "",
            "exchange-listed": "",
            "timezone": "Asia/Shanghai",
            "minmov": 1,
            "minmov2": 0,
            "pointvalue": 1,
            "fractional": false,
            "session": "24x7",
            "has_intraday": true,
            "has_no_volume": false,
            "description": symbol,
            "pricescale": 1,
            "ticker": fullSymbol,
            "supported_resolutions": this.supported_resolutions,
            "intraday_multipliers": ['1', '5', '60']
        };


        var info = TradeMgr.getProduct(symbol, entry);
        if (info) {
            data.currency_code = info.toCode;
            data.description = info.DisplayName;
            if (info.PriceFixed) data.pricescale = Math.pow(10, info.PriceFixed);
        }

        return data;
    },
    destroy() {
        try {
            this.removeListenerAndUnsub();
            this.cancelPrevGetBars();
            // WsMgr.off('open', this.subscribe);
            // if (this.getBarsTimer){
            //     clearTimeout(this.getBarsTimer);
            //     this.getBarsTimer = 0;
            // }
            // if (this.chartReadyTimer) {
            //     clearTimeout(this.chartReadyTimer);
            //     this.chartReadyTimer = null;
            // }
            if (this.setLangTimer){
                clearTimeout(this.setLangTimer);
                this.setLangTimer = 0;
            }

            if (this.priceLineTimer){
                clearTimeout(this.priceLineTimer);
                this.priceLineTimer = null;
            }
            if (this.positionTimer) {
                clearTimeout(this.positionTimer);
                this.positionTimer = null;
            }
            if (this.widget) {
                this.widget.remove();
                this.widget._ready = false;
            }
        } catch (e) {

        }
    },
    onChangeOptions(symbol, period) {
        this.symbol = symbol;
        this.period = period;

        this.widget._options.symbol = symbol;
        this.widget._options.interval = this.periodToTV[period];
    },
    switch(symbol, period = '5MIN') {
        if (this.period != period || this.symbol != symbol) {
            this.isFut = symbol.indexOf(this.symbolPrefixMap[CONST.TRADE_TYPE.FUT])!=-1;

            var reqPeriod = this.getSubscribePeriod(period);
            // this.reqKlineHistory(symbol, reqPeriod, this.mode, this.reqBarsCount);
            WsMgr.subscribeKline(this.parseFullSymbol(symbol), reqPeriod, this.subscribeCnt);

            this.widget.onChartReady(() => {this.widget.setSymbol(symbol, this.periodToTV[period]);})

            this.onChangeOptions(symbol, period);
            this.initChartReady();
            if (this.cssTheme=='cfd'){
                this.removeShapes();
                this.createPriceLine();
            }
            if (this.floatTradeData) {
                this.floatTradeData = ''
            }
            if (this.switchCallback) this.switchCallback(symbol, period, null, this.chartType);
        }
    },
    switchMode(symbol, mode = 'LAST') {
        if (this.mode != mode || this.symbol != symbol) {
            // this.getBarsFirst = true;
            this.cancelPrevGetBars();
            this.dataFeed.resetLastBarTime(symbol, this.getSrcResolution(this.periodToTV[this.getSubscribePeriod(this.period)]));

            var result = this._reqRecentHistory(symbol, this.period, mode, (isSame)=>{
                if (isSame) this.isLoadingBar = false;
            });
            if (result){
                this.isLoadingBar = true;
            }

            var reqPeriod = this.getSubscribePeriod(this.period);
            // this.reqKlineHistory(symbol, reqPeriod, mode, this.reqBarsCount);
            if (this.isFut) WsMgr.switchKlineStype(this.parseFullSymbol(symbol), mode);
            WsMgr.subscribeKline(this.parseFullSymbol(symbol), reqPeriod, this.subscribeCnt);
            this.isFirstGetbar = false;
            this.mode = mode;

            if (this.dataCache[symbol] && this.dataCache[symbol][this.period]) {
                this.dataCache[symbol][this.period] = null;
                this.realLastBarTime[symbol][this.period] = 0;
            }
            if (this.widget) {
                // this.widget.remove();
                this.widget._create();
                this.initChartReady(true);
                if (this.floatTradeData) {
                    this.floatTradeData = ''
                }
            }

            if (this.switchCallback) this.switchCallback(symbol, null, mode);
        }
    },
    appendData(data, noParse) {
        var newData = data.data;

        if (!newData || !newData.length) return;

        if (!this.dataCache[data.symbol]) {
            this.dataCache[data.symbol] = {};
            this.realLastBarTime[data.symbol] = {};
            this.tickerBars[data.symbol] = {};
        }
        if (!this.dataCache[data.symbol][data.period]) {
            this.dataCache[data.symbol][data.period] = {};
            this.realLastBarTime[data.symbol][data.period] = {};
            this.tickerBars[data.symbol][data.period] = {};
        }
        if (!this.dataCache[data.symbol][data.period][data.stype]) {
            this.dataCache[data.symbol][data.period][data.stype] = [];
            this.realLastBarTime[data.symbol][data.period][data.stype] = 0;
            this.tickerBars[data.symbol][data.period][data.stype] = {};
        }

        var cacheData = this.dataCache[data.symbol][data.period][data.stype];

        //服务器给过来的时间是倒序的
        // var mSecs = this.convertPeriod2Secs(data.period)*1000;
        //注意：不能用time比较，cacheData中bar的time有可能被tv修改
        var lastDate = "";
        var newCacheList = [];
        for (var l = newData.length, i = l-1, cl = cacheData.length, ci=0; i >=0 ; i--) {
            var item = newData[i];
            if (!noParse) item = this.parseKlineDataItem(item);
            if (!item) continue;

            var date = item.date;
            if (date < lastDate) {
                continue;
            }

            while (ci < cl){
                var cItem = cacheData[ci];
                var cDate = cItem.date;
                if (cDate > date){
                    break;
                }else if(cDate < date){
                    lastDate = cDate;
                    newCacheList.push(cItem);
                    ci++;
                }else{
                    ci++;
                    break;
                }
            }
            if (date > lastDate){
                lastDate = date;
                newCacheList.push(item);
            }else{
                newCacheList[newCacheList.length-1] = item;
            }

            //新数据循环完成，旧数据有比新数据时间更大的
            if (i==0){
                while (ci < cl){
                    var cItem = cacheData[ci];
                    var cDate = cItem.date;
                    if (cDate > lastDate){
                        lastDate = cDate;
                        newCacheList.push(cItem);
                        ci++;
                    }
                }
            }
        }

        this.dataCache[data.symbol][data.period][data.stype] = newCacheList;

        if (!noParse && lastDate) this.realLastBarTime[data.symbol][data.period][data.stype] = lastDate;

        return newCacheList;
    },
    parseKlineDataItem(info) {
        if (!info) return;
        //日期,时间,开盘价,最高价,最低价,收盘价,成交量
        var list = info.split(',');
        if (list.length < 7) return;

        //日期,时间,开盘价,最高价,最低价,收盘价,成交量
        var dt = list[0] + ' ' + list[1];
        var time = moment(dt, "YYYY-MM-DD HH:mm:ss").format('X') * 1000;

        return {
            date: dt,
            time: time,
            open: Number(list[2]),
            close: Number(list[5]),
            low: Number(list[4]),
            high: Number(list[3]),
            volume: Number(list[6])
        };
    },
    //生成最后一条假的k线
    // onUpdateTicker(data){
    //     // console.log(data);
    //     // {ASK BID CLOSE HIGH LAST LOW LastModify VOL}
    //     for (var symbol in data){
    //         if (!this.realLastBarTime[symbol]) continue;
    //
    //         var ticker = data[symbol];
    //         var stype = WsMgr.getKlineStype(symbol);
    //         var lastTime = ticker.LastModify;
    //
    //         for (var period in this.periodToTV){
    //             if (!this.realLastBarTime[symbol][period]) continue;
    //
    //             var msec = this.periodMsecMap[period];
    //             var tickBarTime = this.getTickBarTime(lastTime, this.realLastBarTime[symbol][period], msec);
    //             if (tickBarTime){
    //                 ["BID", "ASK", "LAST"].forEach((v, i)=>{
    //                     this.updateTickerBar(symbol, period, v, tickBarTime, ticker);
    //                 });
    //
    //                 var tickerBar = this.tickerBars[symbol][period][stype];
    //                 this.appendData([tickerBar], true);
    //             }
    //         }
    //     }
    // },
    // //同一个ticker生成不同stype的k线数据
    // updateTickerBar(symbol, period, stype, tickBarTime, ticker){
    //     var newPrice = Number(ticker[stype]);
    //     if (newPrice){
    //         var tickerBar = this.tickerBars[symbol][period][stype];
    //         if (tickerBar && tickerBar.time==tickBarTime){
    //             tickerBar.close = newPrice;
    //             tickerBar.low = Math.min(newPrice, tickerBar.low);
    //             tickerBar.high = Math.max(newPrice, tickerBar.high);
    //             tickerBar.volume = tickerBar.volume + ticker.VOL;
    //         }else{
    //             this.tickerBars[symbol][period][stype] = {
    //                 date:moment(tickBarTime).format("YYYY-MM-DD HH:mm:ss"),
    //                 time: tickBarTime,
    //                 open: newPrice,
    //                 close: newPrice,
    //                 low: newPrice,
    //                 high: newPrice,
    //                 volume: ticker.VOL
    //             };
    //         }
    //     }
    // },
    // //获取ticker对应period的barTime
    // getTickBarTime(tickTime, lastBarTime, msec){
    //     var tickBarTime = lastBarTime;
    //     //ticker的时间>=最后一条的时间
    //     while (tickTime>=lastBarTime+msec){
    //         if (tickBarTime <= tickTime && tickBarTime + msec>=tickTime){
    //             return tickBarTime;
    //         }
    //         tickBarTime = tickBarTime + msec;
    //     }
    // },
    // periodToMSec(period){
    //     // {'5MIN':"1", '3MIN':"3", '5MIN':"5", '15MIN':"15", '30MIN':"30", '1HOUR':"60", '2HOUR':"120",
    //         // '3HOUR':"180", '4HOUR':"240", '6HOUR':"360", '12HOUR':"720", '1DAY':"1D", "3DAY":"3D", "1WEEK":"1W", "2WEEK":"2W" }
    //     var interval = this.periodToTV[period];
    //     var p = interval.slice(-1);
    //     var m, n;
    //     if (p=="D"){
    //         m = Number(interval.slice(0, -1));
    //         n = 24*60*60*1000;
    //     }else if(p=="W"){
    //         m = Number(interval.slice(0, -1));
    //         n = 7*24*60*60*1000;
    //     }else{
    //         m = Number(interval);
    //         n = 60*1000;
    //     }
    //     return m*n;
    // },
    onUpdateWsData(srcData) {
        const {symbol} = this.parseFullSymbol(this.symbol);
        // console.log(' >> :', srcData)
        if (srcData.symbol != symbol || srcData.period != this.getSubscribePeriod(this.period)) return;

        var len = srcData.data.length;
        if (len <= 0) return;

        srcData.symbol = this.symbol;
        this.appendData(srcData)
        //已经调用获取第一次的bar，才调用订阅实时数据更新
        if (this.reconnectStatus == 0 && this.isFirstGetbar) this.dataFeed.update()
    },
    onUpdateNewWsData(srcData){
        if (srcData && srcData.symbol==this.symbol && srcData.period==this.getSubscribePeriod(this.period)){
            var len = srcData.data.length;
            if (len <= 0) return;

            this.appendData(srcData);

            // console.log("kline", srcData.data[0]);
            //已经调用获取第一次的bar，才调用订阅实时数据更新
            if (this.reconnectStatus == 0 && this.isFirstGetbar) this.dataFeed.update()
        }
    },
    //因为k线500ms内更新一次，如果tick跳得很快，就和k线有差别，因此通过tick数据，前端补充变动
    onUpdateTick(data){
        if (this.symbol){
            const {symbol} = this.parseFullSymbol(this.symbol);
            const tick = data[symbol];
            if (tick){
                this._onUpdateTick(tick);
            }
        }
    },
    onUpdateNewTicks(data){
        const {entry, symbol} = this.parseFullSymbol(this.symbol);
        var newData = data.filter(v=>v.Code==symbol && v.TradeType==entry);
        if (newData.length){
            newData.forEach(tick=>this._onUpdateTick(tick));
        }
    },
    _onUpdateTick(tick){
        var period = this.getSubscribePeriod(this.period);
        if (tick && this.dataCache[this.symbol] && this.dataCache[this.symbol][period]){
            var bars = this.dataCache[this.symbol][period][this.mode];
            if(this.chartType==2){
                let AskPrice = tick["ASK"], BidPrice = tick["BID"];
                this.cfdUpdateTick([AskPrice,BidPrice]);
            }
            if (bars && bars.length){
                var lastBar = bars[bars.length - 1];
                if (lastBar){
                    if (!tick.LastModify) tick.LastModify = this.getServerTime(true);
                    var interval = Number(tick.LastModify) - lastBar.time;

                    var price = tick[this.mode];
                    if (!price) return;

                    price = Number(price);
                    if (interval < this.convertPeriod2Secs(period)*1000 && lastBar.close!=price){
                        lastBar.close = price;
                        lastBar.high = Math.max(price, lastBar.high);
                        lastBar.low = Math.min(price, lastBar.low);

                        // console.log("tick", lastBar);

                        //已经调用获取第一次的bar，才调用订阅实时数据更新
                        if (this.reconnectStatus == 0 && this.isFirstGetbar) this.dataFeed.update()
                    }
                }
            }
        }
    },
    cfdUpdateTick(data){
        this.priceCache = data;
        this.resetLinePoint();
    },
    resetLinePoint(){
        var data = this.priceCache;
        if(this.askShape && data[0]) this.askShape.setPoints([{price:data[0]}]);
        if(this.bidShape && data[1]) this.bidShape.setPoints([{price:data[1]}]);
    },
    // 订阅K线数据
    // subscribeBars(srcData) {
    //     this.dataFeed.update()
    //     if (srcData.data[0]) {
    //         const bars = {};
    //         const newBars = srcData.data[0].replace(',', ' ').split(',');
    //         newBars.forEach((item, index) => {
    //             switch (index) {
    //                 case 0:
    //                     bars.time = new Date(item).getTime()
    //                     break;
    //                 case 1:
    //                     bars.open = Number(item)
    //                     break;
    //                 case 2:
    //                     bars.high = Number(item)
    //                     break;
    //                 case 3:
    //                     bars.low = Number(item)
    //                     break;
    //                 case 4:
    //                     bars.close = Number(item)
    //                     break;
    //                 case 5:
    //                     bars.volume = Number(item)
    //                     break;
    //             }
    //         })
    //         const lastBar = this.dataCache[this.symbol][this.period];
    //         const lastTime = lastBar && lastBar.length ? lastBar[lastBar.length - 1].time : Date.now();
    //         if (bars.time > lastTime) {
    //             this.subscribeBarsData = bars
    //         }

    //     }
    // },
    getServerTime(isMilsec=false) {
        return SysTime.getServerTimeStamp(isMilsec);
    },
    reqKlineHistory(fullSymbol, period, mode, count, from, to, callback){
        const {entry, prefix, symbol} = this.parseFullSymbol(fullSymbol);
        var apiName;
        switch (entry){
            case CONST.TRADE_TYPE.CFG:
                apiName = "cfd/kline";
                break;
            case CONST.TRADE_TYPE.FUT:
                apiName = "futures/kline";
                break;
            case CONST.TRADE_TYPE.SPOT:
                apiName = "spot/kline";
                break;
        }

        var params = {Symbol:`${symbol}`, Key:period, Type:mode};
        if (count){
            var tv = parseInt(this.periodToTV[period]);
            var oldTv = parseInt(this.periodToTV[this.period]);
            var scale = oldTv>tv ? parseInt(oldTv/tv) : 1;
            params.Count = Math.min(this.limitReqBarsCount, count*scale);
        }
        if (from){
            var secs = this.convertPeriod2Secs(period);
            var bars = Math.floor((to - from)/secs);
            bars = bars+10;
            bars = bars>this.limitReqBarsCount ? this.limitReqBarsCount : bars;
            var newFrom = to - secs*bars;

            params.From = newFrom;
            params.To = to;
        }

        Net.httpRequest(apiName, params, (data)=>{
            // setTimeout(()=>{
                if (data.Status==0){
                    this.appendData({data:data.Data?data.Data.List:[], period:period, symbol:fullSymbol, stype:mode});
                }
                //防止网络断了，还没请求到数据
                if (data.Status!=-1){
                    //防止返回延迟太多，出错
                    var isSame = fullSymbol==this.symbol && period==this.getSubscribePeriod(this.period) && mode==this.mode;
                    // console.log(fullSymbol, this.symbol, period==this.getSubscribePeriod(this.period), mode==this.mode);
                    if (callback) callback(isSame);
                }
        }, this.component);
    },
    setArrow(options) {
        return false  // 暂时关闭生成箭头
        let time = 0
        if (options.CreatedAt) {
            time = parseInt(new Date(options.CreatedAt).getTime() / 1000)
        } else {
            // 新建仓位一开始是没有时间的
            time = parseInt(Date.now() / 1000)
        }
        const isType = options.SideTxt !== "LONG"
        this.widget.onChartReady(() => {
            if (!this.checkIsReady()) return;

            var arrow = this.widget.chart().createExecutionShape()
                // .setText("@"+options.Volume+","+options.Price+" Limit "+options.SideTxt+" "+options.Volume+"")
                .setTooltip("@" + options.Volume + "," + options.Price + " Limit " + options.SideTxt + " " + options.Volume + "")
                .setTextColor(isType ? "rgba(242,22,11,0.5)" : "rgba(0,255,0,0.5)")
                .setArrowColor(isType ? "#f2160b" : "#0F0")
                .setDirection(isType ? "sell" : "buy")
                .setTime(time)
                .setPrice(options.Price);
            this.arrowList[options.ID] = arrow;
        })

    },
    showAllPosition(positions, callback) {
        // 没有K线数据
        if (JSON.stringify(this.dataCache) === '{}') return

        for (var pid in this.posLines) {
            if (!positions[pid]) {
                var line = this.posLines[pid];
                line.remove();
                delete this.posLines[pid];
                this.arrowList[pid].remove();
                delete this.arrowList[pid];
            }
        }

        for (var pid in positions) {
            if (!this.posLines[pid]) {
                var v = positions[pid];
                this.setArrow(v);
                this.showPosition(v, callback);
            } else {
                const oldVal = this.posLines[pid].getText()
                const newVal = positions[pid].ProfitLossDesc
                oldVal !== newVal && this.posLines[pid].setText(newVal)
            }
        }
    },
    showPosition(data, callback) {
        return false  // 暂时关闭显示仓位
        var self = this;
        if (this.positionTimer) {
            clearTimeout(this.positionTimer)
        }
        this.widget.onChartReady(() => {
            if (!this.checkIsReady()) return;

            var line = this.widget.chart().createPositionLine()
                .setText(data.ProfitLossDesc)
                .setQuantity(data.Volume)
                .setPrice(data.Price)
                .setExtendLeft(true)
                .setLineStyle(0)
                .setLineLength(25)
                .onClose(function () {
                    this.positionTimer = setTimeout(function () {
                        callback(data, null, (result) => {
                            if (result) {
                                delete self.posLines[data.ID];
                                self.arrowList[data.ID].remove();
                                delete self.arrowList[data.ID];
                                line.remove();
                            }
                        });
                    }, 300)
                });
            self.posLines[data.ID] = line;
        })
    },
    // 设置浮动面板交易数据
    setFloatTradeData(data) {
        const price = data ? data : { ASK: 0, BID: 0 };
        const eventList = [
            // { name: 'init', price: undefined },
            { name: 'setBuy', price: price.ASK },
            { name: 'setSell', price: price.BID },
            { name: 'setSpread', price: price.ASK - price.BID }
        ];

        if (IS_DEMO_PATH) { return false }

        // eventList.unshift({ name: 'init', price: undefined });
        // console.log("setFloatTradeData");
        if (this.widget && this.floatTradeData !== JSON.stringify(eventList)) {
            this.widget.onChartReady(() => {
                if (!this.floatTradeData) { // 只执行一次初始化
                    frames[0].window.postMessage({ eventType: 'init', value: undefined }, '*');
                    frames[0].window.postMessage({ eventType: 'setNumber', value: AuthModel.loadPreference('vol', 1) }, '*');
                }
                frames[0].window.postMessage({ eventType: 'init', value: undefined }, '*');
                frames[0].window.postMessage({ eventType: 'setNumber', value: AuthModel.loadPreference('vol', 1) }, '*');
                eventList.forEach(elm => {
                    frames[0].window.postMessage({ eventType: elm.name, value: elm.price ? elm.price : 0 }, '*');
                });
                this.floatTradeData = JSON.stringify(eventList)
            });
        }
    }
};
