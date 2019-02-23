import { useRouterHistory } from 'react-router'
// import {useBasename } from 'history';
import createBrowserHistory from 'history/lib/createBrowserHistory';
import createHashHistory from 'history/lib/createHashHistory';

var history;
if ("desktop" !== process.env.VER_ENV) {
    history = useRouterHistory(createBrowserHistory)({basename: '/'});
}else{
    history = useRouterHistory(createHashHistory)({basename: '/'});
}

export default history;