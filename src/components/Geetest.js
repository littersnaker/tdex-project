import React from 'react';
import PropTypes from 'prop-types';
import Loader from '../utils/loader';
import Net from '../net/net';
import Intl from '../intl';
import System from '../model/system';
import ErrorBoundary from './ErrorBoundary';

export default class Geetest extends React.Component {
    static propTypes = {
        onSuccess: PropTypes.func.isRequired,
        onValidForm: PropTypes.func.isRequired,

        lib:PropTypes.string,
        api: PropTypes.string,

        product: PropTypes.string,
        lang: PropTypes.string,
        sandbox: PropTypes.bool,
        width: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        disableClassName: PropTypes.string,
        disable: PropTypes.bool,
        type: PropTypes.string
    };

    static defaultProps = {
        lib: "lib/geetest/gt.js",
        api: "geetest/register",
        protocol: window.location.protocol=='https:'?'https://':'http://',
        //zh-cn（简体中文）
    //     zh-tw（繁体中文），
    // en（英文）
    // ja（日文）
    // id(印尼)
        product: 'bind',
        lang: Intl.getLang()=='en-us'? "en" : Intl.getLang(), //en
        sandbox: false,
        width: "300px",
        disableClassName: 'btnDis',
        disable: true,
        type: 'common'
    };

    constructor(props) {
        super(props);

        this.isEnable = true;
        this.captchaObj = null;

        this.state = {
            isOpen: true, //是否开放
            loading: true, //正在加载
            waitingSubmit: false,
            loadLibError: false,
            netWorkError: false
        };
    }
    componentDidMount() {
        this.loadSetting();
    }
    loadSetting(){
        System.getSetting((data)=>{
            var accSetting = data["Account"];
            if (this.props.type=='login' && !accSetting.Login || this.props.type=='register' && !accSetting.Register){
                this.setState({isOpen: false})
            }
            var setting = data["Captcha"];
            if (setting.Type=="geetest"){
                if (setting.Flag==2 || (setting.Flag==1 && (this.props.type=='register' || this.props.type=='forgotPassword'))){
                    this._loadLib();
                    return;
                }
            }

            this.isEnable = false;
            this.setState({loading: false, loadLibError: false});
        })
    }
    _loadLib(){
        Loader.js(this.props.lib, ()=>{
            this.setState({loading: false, loadLibError: false});
        }, ()=>{
            this.setState({loadLibError: true});
        });
    }
    // _loadApi(){
    //
    // }
    // _ready() {
    //     if (!window.initGeetest) {
    //         return;
    //     }
    //     // if (!this.apiData){
    //     //     return;
    //     // }
    //     // if (this.isInited) return;
    //     //
    //     // var data = this.apiData;
    //     // // // 调用 initGeetest 进行初始化
    //     // // // 参数1：配置参数
    //     // // // 参数2：回调，回调的第一个参数验证码对象，之后可以使用它调用相应的接口
    //     // window.initGeetest({
    //     //     // 以下 4 个配置参数为必须，不能缺少
    //     //     gt: data.GT,
    //     //     challenge: data.Challenge,
    //     //     offline: !data.Success, // 表示用户后台检测极验服务器是否宕机
    //     //     new_captcha: data.NewCaptcha, // 用于宕机时表示是新验证码的宕机
    //     //
    //     //     product: "bind", // 产品形式，包括：float，popup
    //     //     width: this.props.width,
    //     //     onError:()=>{
    //     //         this.setState({netWorkError: true});
    //     //     }
    //     //     // 更多配置参数说明请参见：http://docs.geetest.com/install/client/web-front/
    //     // }, this.loadedCaptcha.bind(this));
    //     //
    //     // this.isInited = true;
    // }
    loadedCaptcha(captchaObj){
        this.setState({loading:false});

        captchaObj.onReady( ()=>{
            try{
                // 调用之前先通过前端表单校验
                var result = this.props.onValidForm();
                if (result && captchaObj){
                    captchaObj.verify();
                }
            }catch(e){
                this.setState({netWorkError: true});
            }
        }).onSuccess( ()=>{
            var result = captchaObj.getValidate();
            if (!result) {
                return;
            }

            this.submitForm(result, (result)=>{
                if (!result) captchaObj.reset();
            });
        }).onClose(()=>{
            console.log("close captchaObj");
        }).onError(()=>{
            console.log("error captchaObj");
        });
    }
    submitForm(result, callback){
        this.setState({waitingSubmit: true});
        this.props.onSuccess(result, (result)=>{
            if (!result){
                this.setState({waitingSubmit: false});
            }
            if (callback) callback(result);
        });
    }
    onClick(e){
        e.preventDefault();
        e.stopPropagation();

        if (this.state.loading || this.state.loadLibError || this.props.disable || !this.state.isOpen) return;

        if (this.isEnable){
            this.setState({loading:true});

            Net.httpRequest(this.props.api, "", (data)=>{
                if (data.Status == 0){
                    var info = data.Data;
                    window.initGeetest({
                        // 以下 4 个配置参数为必须，不能缺少
                        gt: info.GT,
                        challenge: info.Challenge,
                        offline: !info.Success, // 表示用户后台检测极验服务器是否宕机
                        new_captcha: info.NewCaptcha, // 用于宕机时表示是新验证码的宕机

                        lang: Intl.getLang()=='en-us'? "en" : Intl.getLang(),
                        protocol: this.props.protocol,
                        product: "bind", // 产品形式，包括：float，popup
                        width: this.props.width,
                        onError:()=>{
                            this.setState({loading:false, netWorkError: true});
                        }
                        // 更多配置参数说明请参见：http://docs.geetest.com/install/client/web-front/
                    }, this.loadedCaptcha.bind(this));
                }else if(data.Status==-1){
                    this.setState({loading:false, netWorkError: true});
                }
            }, this);
        }else{
            this.submitForm({}, (result)=>{

            });
        }
    }
    render() {
        const {loading, waitingSubmit, loadLibError, netWorkError, isOpen} = this.state;
        const {children, disableClassName, disable} = this.props;
        var child = React.Children.only(children);
        const ccn = child.props.className;
        const className = !isOpen || loading || disable || waitingSubmit ? (ccn ? ccn + ' '+ disableClassName : disableClassName) : child.props.className;

        const newChild = React.cloneElement(child, {
            onClick: loadLibError ? this._loadLib().bind(this) : this.onClick.bind(this),
            className,
            children: netWorkError ? Intl.lang("error.greetest.network") : (loading ? Intl.lang("error.greetest.loading") : child.props.children),
            key: 'gbtn'
        });

        var childArr = [newChild];
        if (!isOpen){
            childArr.push(<div className="red3" key="gerr">{Intl.lang("common.not_open")}</div>);
        }
        return <ErrorBoundary>{childArr}</ErrorBoundary>
    }
}
