import React from 'react';
import ReactDom from 'react-dom';
import $ from 'jquery';
import {randomStr} from "./util";

const PopDialog = {
    dialogMap: {},
    popList: [],
    blockCount:0,
    maxZindex:9999,
    open: function (component, id, isBlock = true, posObj, canDrag=true){
        if (!id){
            var total = 0;
            for (var i=0,l=this.popList.length; i<l; i++){
                var wID = this.popList[i];
                var wObj = this.dialogMap[wID];
                if (wObj && !wObj.baseID) total++;
                if (total >= 5) return;
            }
        }else{
            var dialogObj = this.dialogMap[id];
            if (dialogObj)return dialogObj;
        }

        this.maxZindex++;
        var dialogObj = new CustomDialog(this, component, id, isBlock, posObj, canDrag, this.maxZindex);
        var winID = dialogObj.winID;
        if (winID){
            this.dialogMap[winID] = dialogObj;
            this.popList.push(winID);
            return dialogObj;
        }
    },
    close:function (id){
        if (!id){
            id = this.popList.pop();
            if (!id) return;

        }else{
            if (id.indexOf("pn_")==0){
                id = id.substr(3);
            }
            var index = this.popList.indexOf(id);
            if (index!=-1){
                this.popList.splice(index, 1);
            }else{
                return;
            }
        }

        var dialog = this.dialogMap[id];
        if (dialog) dialog.close();
        delete this.dialogMap[id];
    },
    closeByDomID: function (id) {
        this.close(id);
    },
    closeAll: function(){
        while (this.popList.length){
            this.close();
        }
    },
    showMask(){
        this.blockCount++;
        $('.mask').css({"z-index":this.maxZindex}).show();
    },
    hideMask(){
        this.blockCount--;

        if (this.blockCount == 0) $('.mask').hide();
        else{
            for (var i=this.popList.length-1; i>=0; i--){
                var winID = this.popList[i];
                var dialog = this.dialogMap[winID];
                if (dialog.isBlock){
                    $('.mask').css({"z-index":dialog.zIndex});
                    break;
                }
            }

        }
    }
};

function CustomDialog(mgr, component, id, isBlock = true, posObj, canDrag=true, zIndex) {
    var winID = id ? id : randomStr(10);
    var boxId = 'pn_'+winID;
    if ($('#'+boxId).length > 0){
        return;
    }

    this.mgr = mgr;
    this.baseID = id;
    this.winID = winID;
    this.boxID = boxId;
    this.isBlock = isBlock;
    this.canDrag = canDrag;
    this.zIndex = zIndex;

    var div = $("<div />").appendTo($(".popDiv"));
    div.attr('id', boxId);

    // this.popList.splice(0, 0, boxId);
    // this.maxZindex++;

    var props = {
        close: this.mgr.close.bind(this.mgr, this.winID),
        win: this
    }

    var newComponent = React.cloneElement(component, props);
    this.component = newComponent;

    ReactDom.render(
        newComponent,
        document.getElementById(boxId)
    );

    if (isBlock){
        this.mgr.showMask();
    }

    if(posObj===false){
        // $('#'+boxId).css("position", 'absolute');
        $('#'+boxId).css("z-index", this.zIndex);
    } else{
        var oDiv=$('#'+boxId).children()[0];
        $(oDiv).css({position : 'absolute',top:0});

        var width = $(oDiv).width();
        var height = $(oDiv).height();

        var top = ($(window).height() - height)/2;
        var left = ($(window).width() - width)/2;
        var scrollTop = $(document).scrollTop();
        var scrollLeft = $(document).scrollLeft();
        var minTop = top + scrollTop, minLeft = left + scrollLeft;

        var realTop = minTop>0?minTop:0;
        var realLeft = minLeft>0?minLeft:0;
        if (posObj){
            var t = typeof(posObj);
            if (t=='object'){
                if (posObj.hasOwnProperty("top")) realTop = posObj.top;
                if (posObj.hasOwnProperty("left")) realLeft = posObj.left;
            }else if(t=='function'){
                var pObj = posObj({top:realTop, left:realLeft});
                if (pObj){
                    realTop = pObj.top;
                    realLeft = pObj.left;
                }
            }
        }

        //同样宽高的偏移，以免完全覆盖
        var popList = this.mgr.popList;
        var popLen = popList.length;
        if (popLen){
            var prevWinID = popList[popLen-1];
            var prevDialog = this.mgr.dialogMap[prevWinID];
            if (prevDialog){
                var baseInfo = prevDialog.baseInfo;
                if (baseInfo && baseInfo.w==width && baseInfo.h==height){
                    realTop = baseInfo.top + 10;
                    realLeft = baseInfo.left + 10;
                }
            }
        }

        this.baseInfo = {
            top: realTop,
            left: realLeft,
            w: width,
            h:height
        }

        $('#'+boxId).css( { position : 'absolute', 'top':realTop, left:realLeft, visibility:'', "z-index":this.zIndex } ).show();
    }

    if (canDrag){
        var oDiv=$('#'+boxId).children()[0];
        var w = $(oDiv).width() - 60;
        var div = $("<div class='handle' style='width:"+w+"px;height:25px;'/>").appendTo($("#"+boxId));
        div.attr('id', "ddrag"+boxId);

        div.on('mousedown', (evt)=>{
            evt.preventDefault();
            evt.stopPropagation();

            var currentX = evt.clientX;
            var currentY = evt.clientY;

            var left = $('#'+boxId).position().left;
            var top = $('#'+boxId).position().top;

            const onDialogMove = (evt)=>{
                evt.preventDefault();
                evt.stopPropagation();

                var x = evt.clientX;
                var y = evt.clientY;

                $('#'+boxId).css({
                    top: top+(y - currentY),
                    left: left+(x - currentX)
                });
            };

            const onDialogStop = (evt)=>{
                evt.preventDefault();
                evt.stopPropagation();

                $(document).off("mousemove", onDialogMove);
                $(document).off("mouseup", onDialogStop);
                $(document).off("touchmove", onDialogMove);
                $(document).off("touchend", onDialogStop);
            };

            $(document).on("mousemove", onDialogMove);
            $(document).on("mouseup", onDialogStop);
            $(document).on("touchmove", onDialogMove);
            $(document).on("touchend", onDialogStop);
        });
    }

    $(document).on('keyup', (event)=>{
        if(event.keyCode == "27")
        {
            if (typeof(newComponent.props.onConfirm)=='function'){
                newComponent.props.onConfirm(false);
            }
            this.mgr.close(this.winID);
        }
    });
}

CustomDialog.prototype.close = function () {
    if (!this.winID) return;

    if (this.component && this.component.props.onClose){
        this.component.props.onClose();
    }

    if (this.canDrag) $("#ddrag"+this.boxID).off("mousedown");

    ReactDom.unmountComponentAtNode(document.getElementById(this.boxID));

    if (this.isBlock){
        this.mgr.hideMask();
    }

    $('#'+this.boxID).remove();
    $(document).off('keyup');
}

export default PopDialog;
