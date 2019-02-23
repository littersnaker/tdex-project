import React from 'react';
import Stores from '../stores';
// import PureComponent from "./PureComponent";
// var Immutable = require('immutable');
// var assign = require('object-assign');
// var merge = Object.assign || assign;
var noop = function () { };

/**
 * connectToStore
 *
 * 通过高阶函数的封装使React的view和Immutable的数据层关联起来，并且可以感知到immutable的数据变化
 * @param store immutable的数据中心
 * @param reset 是否需要每次初始化的时候重置数据
 */
function connectToStore(store, reset=true) {
    Stores.registerStore(store);

    return function StoreContainer(Component) {
        //proxy componentDidMount
        var proxyComponentDidMount = Component.prototype.componentDidMount || noop;
        //reset
        Component.prototype.componentDidMount = noop;

        return class StoreProvider extends React.Component{
            constructor(props) {
                super(props);

                this._onIfluxStoreChange = this._onIfluxStoreChange.bind(this);
                //如果设置了重置数据，则在每次init的时候重置store
                if (reset) {
                    store.reset();
                }

                store.onStoreChange(this._onIfluxStoreChange);

                this.state = {
                    data: store.data()
                };
            }

            componentWillMount () {
                // this._mounted = false;
            }

            componentDidMount () {
                // this._mounted = true;

                if (proxyComponentDidMount) {
                    proxyComponentDidMount.call(this.App);
                }
            }

            componentWillUpdate () {
                // this._mounted = false;
            }

            componentDidUpdate () {
                // this._mounted = true;
            }

            componentWillUnmount () {
                // this._mounted = false;
                store.removeStoreChange(this._onIfluxStoreChange);

                Stores.unRegisterStore(store);
            }

            render () {
                var self = this;
                var props = this.state.data ? this.state.data.merge(this.props||{}).toJS() : this.props;
                // console.log(JSON.stringify(props.code));
                props.ref = (App) => {
                    return self.App = App;
                };
                return React.createElement(Component, props);
            }

            /**
             * 监听Store
             */
            _onIfluxStoreChange (nextState, path) {
                // console.log("change0 "+ JSON.stringify(nextState));
                // if (this._mounted) {
                //     console.log("change1 "+ JSON.stringify(nextState));
                    this.setState(function () {
                        return { data: nextState }
                    });
                // }
            }
        }
    }
}

export default connectToStore;