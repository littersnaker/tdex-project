window._bd_share_main.F.module("trans/trans_weixin", function (n, i) {
  var e, o, t, d = "bdshare_weixin_qrcode_dialog",
    a = "",
    r = 0,
    c = {},
    p = n("base/tangram").T,
    u = (n("conf/const").URLS, function (n) {
      var i = Math.round(200 / n.length);
      i = 2 > i ? 2 : i, r = i * n.length;
      var e = '<table style="direction:ltr;border: 0; width:' + r + 'px; border-collapse: collapse;background-color:#fff;margin:0 auto;" align="center">',
        o = [e],
        t = "";
      return p.each(n, function (n, e) {
        o.push("<tr>"), p.each(e, function (n, e) {
          t = '<td style="width:' + i + "px;height:" + i + "px;padding:0;margin:0;border:none;background:#" + (e ? "000" : "FFF") + '"></td>', o.push(t)
        })
      }), o.push("</table>"), o.join("")
    }),
    s = function (n, i) {
      window._bd_share_main.F.use("component/qrcode", function (i) {
        var o = i.QRCode,
          d = i.QRErrorCorrectLevel,
          a = new o(-1, d.L);
        a.addData(n), a.make();
        var c = u(a.modules);
        p(c).appendTo(t.empty());
        _(r), w(), e.attr("data-url", n)
      })
    },
    f = function () {
      e.attr("data-url") != a && (t.html("Loading"), s(a.length > 200 ? a : a))
    },
    _ = function (n) {
      var i = (n > 220 ? n : 220) + 20,
        o = p(".bd_weixin_popup_foot").height() + p(".bd_weixin_popup_head").height() + n + 30;
      e.css({
        width: i,
        height: o
      })
    },
    isWeChat = function () {
      return /MicroMessenger/i.test(navigator.userAgent);
    },
    getLang = function () {
      var lang = location.hash.substr(1).match(new RegExp("(^|&)lang=([^&]*)(&|$)"))
      return lang ? lang[2] : null
    },
    lang = getLang(),
    h = function () {
      if (e = p("#" + d), o = p("#" + d + "_bg"), e.length < 1) {
        var i = ''
        if (!isWeChat() && lang === 'en-us') {
          i = ['<div id="' + d + '" class="bd_weixin_popup">',
              '<div class="bd_weixin_popup_head">',
              '<span id="tdex_share_title"></span>',
              '<a href="#" onclick="return false;" class="bd_weixin_popup_close">&times;</a>',
              "</div>",
              '<div id="' + d + '_qr" class="bd_weixin_popup_main"></div>',
              '<div class="bd_weixin_popup_foot" id="tdex_share_content">Open Wechat, click "discover" at the bottom，<br>and "scan" to share the webpage on moments</div>',
              "</div>"].join("")
        } else if (!isWeChat() && lang !== 'en-us') {
          i = ['<div id="' + d + '" class="bd_weixin_popup">',
              '<div class="bd_weixin_popup_head">',
              '<span id="tdex_share_title"></span>',
              '<a href="#" onclick="return false;" class="bd_weixin_popup_close">&times;</a>',
              "</div>", '<div id="' + d + '_qr" class="bd_weixin_popup_main"></div>',
              '<div class="bd_weixin_popup_foot" id="tdex_share_content" style="text-align: center;font-size: 16px;">邀请好友微信扫一扫</div>',
              "</div>"].join("")
        } else if (isWeChat() && lang === 'en-us') {
          i = ['<div id="' + d + '" class="bd_weixin_popup tdex_share_mask">', '<a href="#" onclick="return false;" class="bd_weixin_popup_close tdex_share_mask"></a>', '<i class="iconfont icon-share tdex_share_icon"></i>', '<div class="tdex_share_text">Click the button on the upper right <br>corner to invite a friend to register</div>', "</div>"].join("")
        } else if (isWeChat() && lang !== 'en-us') {
          i = ['<div id="' + d + '" class="bd_weixin_popup tdex_share_mask">', '<a href="#" onclick="return false;" class="bd_weixin_popup_close tdex_share_mask"></a>', '<i class="iconfont icon-share tdex_share_icon"></i>', '<div class="tdex_share_text">点击右上角按钮<br>邀请好友注册</div>', "</div>"].join("")
        }
        // var n = '<iframe id="' + d + '_bg" class="bd_weixin_popup_bg"></iframe>';o = p(n).appendTo("body"), 
        e = p(i).appendTo("body"), l()
      }
      t = e.find("#" + d + "_qr"), b()
    },
    l = function () {
      e.find(".bd_weixin_popup_close").click(g), p("body").on("keydown", function (n) {
        27 == n.keyCode && g()
      }), p(window).resize(function () {
        w()
      })
    },
    w = function () {
      var n = p(window).scrollTop(),
        i = e.outerWidth(),
        t = e.outerHeight(),
        d = p(window).width(),
        a = p(window).height(),
        r = (a - t) / 2 + n,
        c = (d - i) / 2;
      r = 0 > r ? 0 : r, c = 0 > c ? 0 : c, o.width(i).height(t).css({
        left: c,
        top: r
      }), e.css({
        left: c,
        top: r
      })
    },
    b = function () {
      e.show(), o.show(), w()
    },
    g = function () {
      $('body').css('overflow', 'auto');
      e.hide(), o.hide()
    },
    v = function (n) {
      var i = "10006-weixin-1-52626-6b3bffd01fdde4900130bc5a2751b6d1";
      if ("off" === c.sign) return n;
      if ("normal" === c.sign) {
        var e = n.indexOf("#"),
          o = n.indexOf("?");
        return -1 == e ? n + (-1 == o ? "?" : "&") + i : n.replace("#", (-1 == o ? "?" : "&") + i + "#")
      }
      return n.replace(/#.*$/g, "") + "#" + i
    },
    x = function (n) {
      n = v(n);
      var i = [];
      return p.each(n, function (n, e) {
        /[^\x00-\xff]/.test(e) ? i[n] = encodeURI(e) : i[n] = e
      }), n = i.join("")
    },
    m = function () {
      window._bd_share_main.F.use("component/pop_dialog", function (n) {
        n.Dialog.hide()
      })
    },
    y = function (n) {
      if (isWeChat()) {
        $('body').css('overflow', 'hidden')
        window.location.hash = 'return_to=' + encodeURIComponent(n.url)
      }
      c = n, a = x(n.url), window._bd_share_main.F.use("weixin_popup.css", function () {
        m(), h(), f()
      })
    };
  i.run = y;
  window.addEventListener('hashchange', function (event) {
    if (!isWeChat() && lang !== getLang()) {
      if (lang === 'zh-cn' && $('#tdex_share_title') && $('#tdex_share_content')) {
        // $('#tdex_share_title').html('Share on Wechat moments')
        $('#tdex_share_content').html('邀请好友微信扫一扫')
      } else {
        // $('#tdex_share_title').html('分享到微信朋友圈')
        $('#tdex_share_content').html('邀请好友微信扫一扫')
      }
      lang = getLang()
    }
  }, false);

});