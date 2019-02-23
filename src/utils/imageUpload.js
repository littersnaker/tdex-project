import Loader from '../utils/loader.js'
import Auth from '../model/auth'
import {UPLOAD_URL} from '../config'
import {toast, isIeLowVersion, getErrMsg, getDomain, getURL} from '../utils/common'

const $ = window.$;
var ImageUpload = {
    checkFile(files){
        if((window.FileReader && window.File && window.FileList && window.Blob)) {
            if (files.length != 0) {
                //获取文件并用FileReader进行读取
                var html = '';
                var i = 0;
                var funcs = function () {
                    if (files[i]) {
                        var reader = new FileReader();
                        var type = files[i].type;
                        if (!/image\/\w+/.test(type) || !/png|jpg|jpeg/.test(type)) {
                            return false;
                        }
                        //reader.onload = function (e) {
                        //console.log(e.target.result);
                        //html += '<div class="item" style="top:' + x + 'px; left:' + y + 'px;"><img src="' + e.target.result + '" alt="img"></div>';
                        //i++;
                        //};
                        //reader.readAsDataURL(files[i]);
                        return true;
                    }
                }
                return funcs();
            }
            return false;
        }else{

        }
    },
    submit(name, fileInputId, data, dataType = 'json', listener){
        Loader.js("lib/jq/jquery.ajaxfileupload.js", function(){
            document.domain = getDomain();

            var fullUrl = UPLOAD_URL + name;
            var tradeValue;
            if (isIeLowVersion()) tradeValue = Auth.getTradeIdValue();
            if ( tradeValue ){
                fullUrl += (fullUrl.indexOf("?") > 0 ? "&" : "?") + "MyTradeId="+tradeValue;
            }

            var callbackName = "uploadPhoto"+ new Date().getTime();
            window[callbackName] = function(data){
                if (data.Status == 0){
                    if (listener)listener(data);
                }else{
                    if (data.Data){
                        toast(getErrMsg(data.Error, data.Data), true);
                    }else{
                        toast(data.Error, true);
                    }
                }
                delete window[callbackName];
            };

            data.Callback = callbackName;

            var token = Auth.getToken();
            if (token){
                data.Token = token;
            }

            $.ajaxFileUpload({
                url : fullUrl, // '', //用于文件上传的服务器端请求地址
                data: data,
                secureuri : false, //是否需要安全协议，一般设置为false
                fileElementId : fileInputId, //'fileToUpload', //文件上传域的ID
                dataType : dataType, //返回值类型 一般设置为json
                success : function(data, status)//服务器成功响应处理函数
                {
                    if (listener)listener(data);
                    //console.log(data);
                    //console.log(status);
                    //if (data.error == 0) {
                    //    //$("#" + img_id).attr("src", data.url);
                    //} else {
                    //    //alert(data.message);
                    //}
                },
                error : function(data, status, e)//服务器响应失败处理函数
                {
                    //if (listener)listener(data);
                    //console.log(data);
                    //console.log(status);
                    //alert(e);
                }
            });
        });
    }
};
export default ImageUpload;