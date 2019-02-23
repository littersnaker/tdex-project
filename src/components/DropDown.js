import React from 'react';
import PropTypes from 'prop-types';
import ReactDOM from "react-dom";
import PureComponent from '../core/PureComponent';

import classnames from 'classnames';

const $ = window.$;

export class DropDown extends PureComponent{
    constructor(props) {
        // console.log('constructor', props);
        super(props);

        this.onUnActiveMouseEvent = this.onUnActiveMouseEvent.bind(this);
        this.onActiveMouseEvent = this.onActiveMouseEvent.bind(this);

        this.mouseEvents = {
            click: {onClick: this.onActiveMouseEvent},
            // hover: {onMouseEnter: this.onActiveMouseEvent.bind(this)},
            contextMenu: {onContextMenu: this.onActiveMouseEvent}
        }

        this.state = {
            active: false
        };
    }
    onActiveMouseEvent(e){
        // e.stopPropagation();

        // console.log("onActiveMouseEvent");

        if (this.props.disabled) return;

        if (!this.state.active){
            this.setState({active:true});
            if (this.props.onClick) this.props.onClick(e);

            if (this.props.menuRef){
                this.props.menuRef()._show();
                if (!this.menuNode){
                    this.menuNode = ReactDOM.findDOMNode(this.props.menuRef());
                }
            }
            if (this.timer) {
                clearTimeout(this.timer);
                this.timer = 0;
            }

            this.timer = setTimeout(()=>{
                window.addEventListener("click", this.onUnActiveMouseEvent);
            }, 100);
        }else{
            this._onUnActiveMouseEvent();
        }
    }

    onUnActiveMouseEvent(e){
        if (this.props.disabled) return;

        // console.log("onUnActiveMouseEvent");

        if (this.state.active){
            if (this.menuNode) {
                var node = e.target;
                var childs = $(this.menuNode).find($(node));
                var isInDiv = childs.length>0;
                if (!isInDiv) {
                    this._onUnActiveMouseEvent();
                    e.stopPropagation();
                }
            }
        }
    }
    visibleCallback(visible){
        if (!visible){
            this._onUnActiveMouseEvent();
        }
    }

   _onUnActiveMouseEvent(){
       // console.log("_onUnActiveMouseEvent");

       this.setState({active: false});
       if (this.props.menuRef) this.props.menuRef()._hide();

       if (this.timer) {
           clearTimeout(this.timer);
           this.timer = 0;
       }
       window.removeEventListener("click", this.onUnActiveMouseEvent);
   }

    componentWillUnmount(){
        this._onUnActiveMouseEvent();

        if (this.menuNode) this.menuNode = null;
    }
    render(){
        const {trigger, children, disabled} = this.props;
        var newProps = this.mouseEvents[trigger];

        if (!children.hasOwnProperty("length")){
            var child = React.Children.only(children);
            newProps.className = classnames(disabled ? 'disable curs-not' : '', child.props.className);

            return React.cloneElement(child, newProps);
        }else{
            newProps.className = classnames(disabled ? 'disable curs-not' : '');
            return React.createElement('div', newProps, children);
        }
    }
}

//与menu不同，只负责抱住要显示隐藏的div
export class Contrainer extends PureComponent{
    static defaultProps = {
        visible: false,
        className: "",
        pnRef: ()=>{}
    }
    static propTypes = {
        visible: PropTypes.bool,
        className: PropTypes.string,
        pnRef: PropTypes.func
    }
    constructor(props) {
        // console.log('constructor', props);
        super(props);

        // this.onMouseDown = this.onMouseDown.bind(this);

        this.state = {
            visible: this.props.visible?true:false
        };
    }

    // componentDidMount() {
    //     var node = ReactDOM.findDOMNode(this);
    //     if (node){
    //         node.addEventListener("click", this.onMouseDown);
    //         this.node = node;
    //     }
    // }
    // componentWillUnmount(){
    //     if (this.node){
    //         this.node.removeEventListener("click", this.onMouseDown);
    //         this.node = null;
    //     }
    // }
    show(){
        // this._show();
        this.props.pnRef().visibleCallback(true);
    }
    hide(){
        // this._hide();
        this.props.pnRef().visibleCallback(false);
    }

    _show(){
        if (!this.state.visible){
            this.setState({visible:true});
        }
    }
    _hide(){
        if (this.state.visible){
            this.setState({visible:false});
        }
    }
    // onMouseDown(e){
    //     e.stopPropagation();
    //     console.log("Contrainer onMouseDown");
    // }
    render(){
        const {visible} = this.state;
        const {children} = this.props;

        var child = React.Children.only(children);

        return React.cloneElement(child, {
            className: classnames(visible ? '': 'hide', this.props.className, child.props.className),
            visible: visible ? "1" : "0"
        });
    }
}

//菜单根节点
export class Menu extends PureComponent{
    static defaultProps = {
        visible: false,
        className: "",
        pnRef: ()=>{},
        side: 'bottom'
    }
    static propTypes = {
        visible: PropTypes.bool,
        className: PropTypes.string,
        pnRef: PropTypes.func,
        side: PropTypes.string
    }
    constructor(props) {
        // console.log('constructor', props);
        super(props);

        this.onMouseDown = this.onMouseDown.bind(this);

        this.state = {
            visible: this.props.visible?true:false
        };
    }

    show(){
        this._show();
        this.pnRef.visibleCallback(true);
    }
    hide(){
        this._hide();
        this.pnRef.visibleCallback(false);
    }

    _show(){
        if (!this.state.visible){
            this.setState({visible:true});
        }
    }
    _hide(){
        if (this.state.visible){
            this.setState({visible:false});
        }
    }

    renderMenuItem(child, i, subIndex){
        if (!child) {
            return null;
        }

        var props = Object.assign({}, child.props);
        if (typeof(child.type)=='function' && child.type==MenuItem) {
            props.visible = this.state.visible;
        }
        return React.cloneElement(child, props);
    }
    onMouseDown(e){
        // e.preventDefault();
        e.stopPropagation();

        // console.log("Menu onMouseDown");
    }

    render(){
        const {side} = this.props;
        const {visible} = this.state;

        var props = Object.assign({
            onClick: this.onMouseDown
        }, this.props, {className: classnames(visible ? '': 'hide', this.props.className), style: side=='top'? {bottom: "22px"}:{}});
        delete props.visible;
        delete props.pnRef;
        delete props.side;

        return React.createElement('ul', props, React.Children.map(props.children, this.renderMenuItem.bind(this)));
    }
}

export class MenuItem extends PureComponent{
    static defaultProps = {
        visible: false,
        tags: "li"
    }
    static propTypes = {
        visible: PropTypes.bool,
        tags: PropTypes.string
    }
    constructor(props) {
        super(props);

        this.onMouseLeave = this.onMouseLeave.bind(this);
        this.onMouseEnter = this.onMouseEnter.bind(this)

        this.state = {
            active: false
        };
    }
    onMouseEnter(e){
        // e.preventDefault();
        e.stopPropagation();

        if (!this.state.active){
            this.setState({active: true});
        }
    }
    componentWillReceiveProps(nextProps) {
        if (this.props.visible!=nextProps.visible && !nextProps.visible){
            this.setState({active: false});
        }
    }
    //该判断不准确
//判断鼠标坐标是否在div里
    mouseInDiv(mouseX, mouseY, divNode) {
        var div = $(divNode);//获取你想要的DIV
        var y1 = div.offset().top;  //div上面两个的点的y值
        var y2 = y1 + div.height();//div下面两个点的y值
        var x1 = div.offset().left;  //div左边两个的点的x值
        var x2 = x1 + div.width();  //div右边两个点的x的值

        if (mouseX < x1 || mouseX > x2 || mouseY < y1 || mouseY > y2) {
            return false;
        }
        return true;
    }
    onMouseLeave(e){
        // e.preventDefault();
        e.stopPropagation();

        if (this.state.active){
            // var tagName = e.target.tagName;
            // if (tagName.indexOf(["SELECT", "OPTION"]!=-1)) return;
            //莫名奇妙会触发leave，必须判断鼠标范围是否在子菜单内
            if (this.subMenuNode && ["SELECT", "OPTION", "INPUT"].indexOf(e.target.tagName)==-1){
                var x = e.pageX;
                var y = e.pageY;

                var isInDiv = this.mouseInDiv(x, y, this.subMenuNode);
                if( !isInDiv ) {
                    // console.log("MenuItem: "+e.target.tagName);
                    // console.log("MenuItem hide");
                    this.setState({active: false});
                }
            }
        }
    }
    subMenuRef(ref){
        this.subMenuNode = ref ? ReactDOM.findDOMNode(ref) : null;
    }
    // onClick(e){
    //     // e.preventDefault();
    //     e.stopPropagation();
    // }
    render(){
        const {active} = this.state, {tags} = this.props;

        var props = Object.assign({}, this.props);
        delete props.visible;
        // console.log(props);

        var subMenuChild;

        var self = this;
        var children = React.Children.map(props.children, (child, i, subIndex)=>{
            if (child){
                var isSubMenu = false;
                if (typeof(child.type)=='function' && child.type==SubMenu){
                    subMenuChild = child;
                    isSubMenu = true;
                }
                var addProps = {};
                if (isSubMenu){
                    addProps.visible = active;
                    addProps.ref = self.subMenuRef.bind(self);
                }
                var childProps = Object.assign({}, child.props, addProps);
                return React.cloneElement(child, childProps);
            }
        });

        if (subMenuChild){
            Object.assign(props, {
                onMouseLeave: this.onMouseLeave,
                onMouseEnter: this.onMouseEnter
            });
        }
        delete props.tags;

        return React.createElement(tags, props, children);
    }
}

export class SubMenu extends PureComponent{
    static defaultProps = {
        visible: false,
        tags: "ul",
        className: ""
    }
    static propTypes = {
        visible: PropTypes.bool,
        tags: PropTypes.string,
        className: PropTypes.string
    }
    renderMenuItem(child, i, subIndex){
        if (!child) {
            return null;
        }

        var props = Object.assign({}, child.props);

        if (typeof(child.type)=='function' && child.type==MenuItem){
            props.visible = this.props.visible;
        }

        return React.cloneElement(child, props);
    }

    render(){
        const {visible, tags} = this.props;
        var props = Object.assign({}, this.props, {
            className: classnames('sub-menu', visible?'':'hide', this.props.className)
        });
        delete props.visible;
        delete props.tags;

        return React.createElement(tags, props, React.Children.map(props.children, this.renderMenuItem.bind(this)));
    }
}

