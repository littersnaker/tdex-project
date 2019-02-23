import React from 'react';

import FutTradeModel from "../model/fut-trade";
import {FutPreviewSimple} from "./FuturesPreviewSimple";
import {FutPreviewExpert, FutWarningExpert} from "./FuturesPreviewExpert"

//提示
export function FutOrderPreview(props) {
    var isExpert = FutTradeModel.loadSetting("isExpert");
    return isExpert ? <FutPreviewExpert {...props} /> : <FutPreviewSimple {...props} />
}

//订单警告
export function FutOrderWarning(props) {
    // var isExpert = FutTradeModel.loadSetting("isExpert");
    // return isExpert ? <FutPreviewExpert {...props} /> : <FutPreviewSimple {...props} />
    return <FutWarningExpert {...props} />;
}
