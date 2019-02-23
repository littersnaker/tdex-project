import React from 'react';
import PopDialog from './popDialog';
import CountdownAlert from '../components/CountdownAlert';

export default function cdAlert(remainSec) {
    PopDialog.open(<CountdownAlert sec={remainSec} contentLang="common.accessLimit" />, 'cd_alert_panel');
}
