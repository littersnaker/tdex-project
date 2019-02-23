import React from 'react';
// import Event from './event'
// import {is,Map} from 'immutable';
// import equal from 'deep-equal';
import Event from '../core/event'

export class PureComponent extends React.Component {
    constructor(props) {
        super(props);
        // this.storeEventMap = {};
    }
    // initState(data){
    //     this.state = {data: Map(data)};
    // }
    //
    // updateState(data){
    //
    // }
    // componentDidCatch(error, info) {
    //     console.error(error);
    //     console.error(info);
    //     // Display fallback UI
    //     // this.setState({ hasError: true });
    //     // // You can also log the error to an error reporting service
    //     // logErrorToMyService(error, info);
    // }
    // shouldComponentUpdate(nextProps, nextState) {
    //     // return !this.equal(this.props, nextProps) || !this.equal(this.state, nextState);
    //     // return !is(this.props, nextProps) || !is(this.state, nextState);
    //     // !this.equal(this.props, nextProps) || !this.equal(this.state, nextState);
    //     // console.log(this.displayName);
    //     // var test = this;
    //     return true;
    // }

    // componentDidUpdate() {
    //    console.log(this._reactInternalInstance.getName());
    // }

    // equal(o1, o2){
    //     if (o1 == o2){
    //         return true;
    //     }
    //     else{
    //         if (o1==null || o2==null || typeof(o1)!="object" || typeof(o2)!="object"){
    //             return false;
    //         }
    //     }
    //
    //     if (Object.keys(o1).length!=Object.keys(o2).length){
    //         return false;
    //     }
    //
    //     return this.deepEqual(o1, o2);
    // }

    // deepEqual(o1, o2, depth=2){
    //     var curDepth = 0;
    //     function equal(o1, o2) {
    //         for (var key in o1){
    //             if (typeof(o1[key])!='object'){
    //                 if (o1[key]!=o2[key]) return false;
    //             }else{
    //                 curDepth++;
    //                 if (curDepth > depth){
    //                     return false;
    //                 }
    //                 var result = equal(o1[key], o2[key]);
    //                 if (!result) return false;
    //             }
    //         }
    //         return true;
    //     }
    //
    //     var result = equal(o1, o2);
    //     if (o1.hasOwnProperty('inMenu')) console.log(result, JSON.stringify(o1), "\n", JSON.stringify(o2));
    //     return result;
    // }

    // updateState(newData){
    //     this.setState(({data}) => ({
    //         data: data.update('times', v => v + 1)
    //     }));
    // }
    //
    componentWillUnmount() {
        Event.removeListeners(this);
        Event.clearAllTimer(this);
        // console.warn("pure comp componentWillUnmount"+this.displayName);
    }
}

export default PureComponent;