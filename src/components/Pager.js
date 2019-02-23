import Intl from '../intl';
import React from 'react';
import PropTypes from 'prop-types';
import NumberInput from './NumberInput';

class Pager extends React.Component{
    static propTypes = {
        data: PropTypes.object.isRequired,
        onChange: PropTypes.func.isRequired
    };
    constructor(props){
        super(props);

        this.onKeyPress = this.onKeyPress.bind(this);
        this.changeHandler = this.props.onChange;

        this.state = {
            // Pager: this.getPagerObject(this.props.data)
            turnPage: 1
        }
    }

    componentDidMount() {
        window.addEventListener("keydown", this.onKeyPress);
    }
    componentWillUnmount() {
        window.removeEventListener("keydown", this.onKeyPress);
    }
    onKeyPress(event){
        var e = event || window.event || arguments.callee.caller.arguments[0];

        if(e && e.keyCode==13) { //enter
            e.stopPropagation();
            e.preventDefault();

            if (this.changeHandler && this.state.turnPage){
                this.changeHandler(Number(this.state.turnPage));
            }
        }
    }
    // getPagerObject(data){
    //     return {Total:data.Total, PageCount:data.PageCount, Page:data.Page, PageSize:data.PageSize};
    // }
    // componentWillReceiveProps(nextProps){
    //     this.setState({Pager: this.getPagerObject(nextProps.data)});
    // }
    changePage(page, pageCount){
        if (!pageCount || (page!==undefined && page < 1) || (pageCount && page > pageCount)) return false;
        //if (pageCount && page > pageCount) return;

        if (this.changeHandler){
            this.changeHandler(page);
        }
    }
    returnToPage(val){
        if (val!=="" ){
            if(!val || Number(val)<1){
                val = 1;
            }else if (Number(val)>this.props.data.PageCount){
                val = this.props.data.PageCount;
            }
            val = Number(val);
        }

        this.setState({turnPage:val});
    }


    render(){
        const {Total, PageCount, Page, PageSize} = this.props.data, {turnPage} = this.state;
        const cls = this.props.className;
        return <div className="tabpage" style={this.props.style}>
                <div className={"pageBox " + cls}>
                    <span>{Intl.lang("Pager.total", Total)}</span>
                    <a href="javascript:" onClick={()=>this.changePage(1, PageCount)} className={Page<=1 ? "disabled" : ""}>{Intl.lang("Pager.1_1")}</a>
                    <a href="javascript:" onClick={()=>this.changePage(Page - 1, PageCount)} className={Page<=1 ? "disabled" : ""}>{Intl.lang("Pager.1_2")}</a>
                    <a className="current">{Page}</a>
                    <a href="javascript:" onClick={()=>this.changePage(Page + 1, PageCount)}  className={Page==PageCount || Page<1 ? "disabled" : ""}>{Intl.lang("Pager.1_3")}</a>
                    <a href="javascript:" onClick={()=>this.changePage(PageCount, PageCount)}  className={Page==PageCount || Page<1 ? "disabled" : ""}>{Intl.lang("Pager.1_4")}</a>
                    <a href="javascript:" onClick={()=>this.changePage(turnPage, PageCount)}  className={"travel-to"+(PageCount<=1 ? " disabled" : "")}>{Intl.lang("Pager.go")}</a>
                    <span className="pageInput">
                        <NumberInput step={1} value={turnPage} onChange={this.returnToPage.bind(this)} min={1} max={PageCount} />
                    </span>
                </div>
            </div>


    }
}
export default Pager;
