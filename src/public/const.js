export const CONST = {
    "AUTH": {"TYPE": {"CAPTCHA": 64, "EMAIL": 4, "GOOGLE": 2, "MOBILE": 1}},
    "CURRENCY": {
        "BTC": 1,
        "ETH": 2,
        "USDT": 3,
        "CNY": 30,
        "USD":144,
        "TD": 11,
        "TD-Freeze":12
    },
    "WALLET":{
        "TYPE":{
            "FUT": 1,
            "SPOT": 2,
            "CFD": 4
        }
    },
    "EXCHANGE": {
        "STATUS": {
            "AUTOFAILED": 6,
            "AUTOSEND": 5,
            "CANCEL": 7,
            "CHECK": 13,
            "FINISH": 1,
            "HANDLING": 3,
            "HANDLING2": 14,
            "NEW": 0,
            "NOCANCEL": 4,
            "RECHARGE": 8,
            "REJECT": 10,
            "WAITHANDLE": 11,
            "WILLAUTO": 2,
            "WITHDRAWAL": 9
        },
        "TYPE": {
            "BCC2BCC": 21,
            "BCC4BCC": 22,
            "BTC2BTC": 11,
            "BTC4BTC": 12,
            "ETH2ETH": 15,
            "ETH4ETH": 16,
            "NEO2NEO": 25,
            "NEO4NEO": 26,
            "OMG2OMG": 23,
            "OMG4OMG": 24,
            "RMB2RMB": 13,
            "RMB4RMB": 14
        }
    },
    "TRADE_TYPE": {"FUT": 1, "SPOT":2, "CFG": 3}, //交易类型 1：期货 2：现货 3：差价合约
    "TRADE": {"DIRECTION": {"ASK": 1, "BID": 0}},
    "FUT": {
        Side: {
            BUY: 0,// 买
            SELL: 1,// 卖
        },
        Strategy: {
            // Immediate 直接下单
            Immediate: 0,
            // Line >=x || x<=
            Line: 1,
            // Trail 追踪
            Trail: 2
        },
        Variable: {
            // 最新价
            LastPrice: 0,
            // 标记价
            MarkPrice: 1,
            // 买一价
            BidPrice: 2,
            // 卖一价
            AskPrice: 3,
        },
        // 市价|限价
        Kind: {
            // 市价
            MKT: 0,
            // 限价
            LMT: 1,
        },
        // 指令
        Action:{
            // 止盈
            TP: 0,
            // 止损
            SL: 1,
            // 平仓
            CLOSE: 2,
            // 开仓
            OPEN: 3,
            // 清算(爆仓处理)
            CLEAR: 4,
            ADL: 5, // 自动减仓
            // 订单历史加入指令:
            Splited: 6, // 拆分
            Merged: 7, // 合并
        },
        // 时效性
        Timely: {
            // 一直有效
            GTC: 0,
            // 触发之后N分钟
            LIFE: 1,
            // 截止时间
            DEADLINE: 2,
        },
        Target:{
            ORDER: 0,
            POSITION: 1
        },
        // 订单状态
        State: {
            // 已创建
            CREATED: 0,
            // 等待触发
            WAITING: 1,
            // 已触发
            TRIGGERRED: 2,
            // 执行中
            EXECUTING: 3,
            // 已撤销
            CANCELED: 4,
            // 已完成
            FILLED: 5,
            //队列中
            QUEUE: 6
        }
    },
};
