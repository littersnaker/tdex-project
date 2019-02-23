import $ from 'jquery';
import {CDN_HOST} from '../config'

const Loader = {
    jsFiles:{},
    cssFiles:{},

    js: function(path, callback, failCallback){
        //require('../'+path);
        //if (callback) callback();
        if (CDN_HOST){
            path = CDN_HOST + '/'+ path;
        }

        if (this.jsFiles[path]){
            if (callback) callback();
        }else{
            var self = this;
            $.getScript(path).done(function () {
                self.jsFiles[path] = true;
                if (callback) callback();
            }).fail(function(jqXHR, textStatus, errorThrown) {
                if ("production" !== process.env.NODE_ENV) {
                    console.log(textStatus);
                    console.log(errorThrown);
                }
                if (failCallback) failCallback();
            });
        }
    },
    css: function(path){
        if (CDN_HOST){
            path = CDN_HOST + '/'+ path;
        }

        if (!this.cssFiles[path]){
            const $  = import('jquery');
            $("<link>").attr({
                rel: "stylesheet",
                type: "text/css",
                href: path
            }).appendTo("head");
            this.cssFiles[path] = true;
        }
    }
};

 export default Loader;