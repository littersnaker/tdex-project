import React from 'react';
import PureComponent from "../core/PureComponent";
import PopDialog from "../utils/popDialog";
import PropTypes from 'prop-types';

export default class ContextMenu extends PureComponent{
    static defaultProps = {
        x: 0,
        y: 0,
        className: "",
        eventType: ''
    }
    static propTypes = {
        x: PropTypes.number,
        y: PropTypes.number,
        bottom: PropTypes.number,
        className: PropTypes.string,
        eventType: PropTypes.string
    }

    constructor(props){
        super(props);

        this.state = {
        }
    }

    componentDidMount() {
        var {x, y, eventType} = this.props;

        var pn = this.menu.parentNode;
        pn.style.top = `${x}px`;
        pn.style.left = `${y}px`;
        pn.style.position = 'absolute';
        pn.style.visibility = 'hidden';

        if (eventType=='click'){
            y = this.props.bottom;
        }
        var { top, left } = this.getMenuPosition(x, y);
        left = left < 25 ? 25 : (left);
        pn.style.top = `${top}px`;
        pn.style.left = `${left}px`;
        pn.style.visibility = 'visible';
    }

    getMenuPosition = (x = 0, y = 0) => {
        let menuStyles = {
            top: y,
            left: x
        };

        if (!this.menu) return menuStyles;

        const { innerWidth, innerHeight } = window;
        const rect = this.menu.getBoundingClientRect();

        if (y + rect.height > innerHeight) {
            menuStyles.top -= rect.height;
        }

        if (x + rect.width > innerWidth) {
            menuStyles.left -= rect.width;
        }

        if (menuStyles.top < 0) {
            menuStyles.top = rect.height < innerHeight ? (innerHeight - rect.height) / 2 : 0;
        }

        if (menuStyles.left < 0) {
            menuStyles.left = rect.width < innerWidth ? (innerWidth - rect.width) / 2 : 0;
        }

        return menuStyles;
    }

    menuRef = (c) => {
        this.menu = c;
    }
    close(){
        PopDialog.closeByDomID('context-menu')
    }
    //防止冒泡被捕获无法触发弹出新页面
    // preventEvent(e){
    //     e.stopPropagation();
    //     e.preventDefault();
    // }
    render(){
        const {className, eventType, children, contrainer} = this.props;

        if (contrainer){
            return contrainer({
                ref:this.menuRef,
                children: children
            });
        }else{
            return (
                <div className={className} ref={this.menuRef}>
                    <ul className={"menu-list"+(eventType=='click'? " menu-type2":"")} onClick={this.close.bind(this)}>
                        {children}
                    </ul>
                </div>
            )
        }

    }
}
