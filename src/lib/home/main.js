import "./owl.carousel.min"

const $ = window.$;
export default {
    homeInit: function() {
        //homepage blade sliders
        $('.overly-page .sliding-door .blade-slider-left').each(function (index, element) {

            var owl = $(element).find('.owl-carousel');
            $(owl).owlCarousel({
                loop: false,
                margin: 5,
                dots: false,
                nav: true,
                items: 1,
                mouseDrag: false,
                navText: ['<i class="iconfont icon-arrow-r"></i>', '<i class="iconfont icon-arrow-l"></i>'],
            });

        });

        //homepage mobile-only sliders
        $('.mobile-well .owl-carousel').each(function (index, element) {

            $(element).owlCarousel({
                loop: false,
                margin: 5,
                dots: false,
                nav: true,
                items: 1,
                navText: ['<i class="iconfont icon-arrow-r"></i>', '<i class="iconfont icon-arrow-l"></i>'],
            });

        });

        var pivot = 0;
        function updateCenter() {
            pivot = $(window).height() / 1.5;
        }
        updateCenter();

        $(window).scroll(function () {
            $.each($('.path_rote_colored'), function (i, item) {
                var $item = $(item);
                var itemTop = $item.offset().top;
                var scrollDuration = item.getBoundingClientRect().height;
                var pathLength = item.getBoundingClientRect().width + scrollDuration;

                var widowsTop = $(window).scrollTop();
                var untilTop = widowsTop + pivot;
                var currentInterval = Math.max(untilTop - itemTop, 0);
                var interpolateValue = currentInterval / scrollDuration;
                var currentValue = interpolateValue * pathLength;
                if ($item.is('.path-split')) {
                    pathLength = 1655;
                    currentValue = (1 - interpolateValue) * pathLength;
                    $item.css('stroke-dashoffset', -currentValue);
                } else
                    $item.css('stroke-dasharray', currentValue + ' ' + 5000);

            });

            var stop = document.documentElement.scrollTop || document.body.scrollTop;
            if(stop<200){
                document.getElementById("header").className = "affix-top";
            }else if(stop<300){
                document.getElementById("header").className = "affix";
            }
        });

    },

    closeAllMenu: function(event){
        var evt = event || window.event;
        // evt.preventDefault();
        evt.stopPropagation();

        if($('#header').hasClass('menu-open')){
            if($('#header').hasClass('menu-top')){
                $("#section-menu-top").slideUp();
                $('#section-menu-top').removeClass('open-div');
                $('#header').removeClass('menu-open').removeClass('menu-top ');
                $('#menu-buttom span.icon').removeClass('icon-close').addClass('icon-dropdown_sign');

            }else{
                $("#section-login-top").slideUp();

                $('#section-login-top').removeClass('open-div');
                $('#header').removeClass('menu-open').removeClass('login-top ');
                $('#language-buttom span.icon').removeClass('icon-close');
            }
        }
        return false;
    },

    showMenu: function(event){
        var evt = event || window.event;
        //evt.preventDefault();
        evt.stopPropagation();

        if ($('#header').hasClass('login-top') && $('#header').hasClass('menu-open')) {
            $("#section-login-top").slideUp();
            $('#section-login-top').removeClass('open-div');
            $('#header').removeClass('login-top');
            $("#section-menu-top").slideDown();
            $('#section-menu-top').addClass('open-div');
            $('#header').addClass('menu-top');
            $('#language-buttom span.icon').removeClass('icon-close');
            $('#menu-buttom span.icon').addClass('icon-close').removeClass('icon-dropdown_sign');
        } else {
            if ($('#header').hasClass('menu-open') && $('#header').hasClass('menu-top')) {
                $("#section-menu-top").slideUp();
                $('#section-menu-top').removeClass('open-div');
                $('#header').removeClass('menu-open').removeClass('menu-top ');
                $('#menu-buttom span.icon').removeClass('icon-close').addClass('icon-dropdown_sign');
            } else {
                $("#section-menu-top").slideDown();
                $('#section-menu-top').addClass('open-div');
                $('#header').addClass('menu-open menu-top');
                $('#menu-buttom span.icon').addClass('icon-close').removeClass('icon-dropdown_sign');
            }
        }
    },

    mobileWellEff: function(that){
        var section = $(that).closest(".route_left_section_child");
        var well = $(".mobile-well", section);
        //well.removeAttr("style");

        if (well.hasClass("in")) //well is open
        {
            well.css({"height": well.height()});
            well.addClass('collapsing');
            well.removeClass("collapse");
            setTimeout(function() {well.css({"height": 20})},30);
            setTimeout(function() {
                well.removeClass("collapsing");
                well.addClass("collapse");
                well.removeClass('in');
            },450)
        }else {
            well.addClass('collapsing');
            well.removeClass("collapse");
            well.css({'height':well[0].scrollHeight});
            setTimeout(function(){
                well.removeClass("collapsing");
                well.addClass("collapse");
                well.addClass('in');
                well.removeAttr("style");
            },450)
        }
    },
    showSubDetailByMobile: function(event){
        var target = event.currentTarget;
        this.mobileWellEff(target);
        window.setTimeout(function(){
            var section = $(target).closest(".route_left_section_child");
            var well = $(".mobile-well", section);

            if (well.hasClass("in")) //well is open
            {
                var newHeight = section.height() + well.height();
                section.css("height", newHeight);
            }
            else //well is closed
            {
                section.css("height", section.css("min-height"));
                //  var newHeight = section.height() - well.height();
            }

        }, 500);
    },
    openPop: function(event, domId){
        var $target = domId? $("#"+domId) : $(event.currentTarget);
        var offset = $(window).height() * 0.08;
        var buttonPosition = $target.offset().top;
        var scrollTop = $(window).scrollTop();
        var scrollCenter = $(window).height() / 2;
        var dy = buttonPosition - (scrollTop + scrollCenter);
        var scrollTarget = scrollTop + dy;

        $('#homeBody').animate({
            scrollTop: scrollTarget + offset
        }, 300);

        $('.route-block-text').hide();
        var open = $target.attr('data');
        $('#' + open).addClass('open-curtain');
        $('body').addClass('open-curtain-body');
    },
    closePop: function(){
        $('.route-block-text').show();
        $('.overly-page').removeClass('open-curtain');
        $('body').removeClass('open-curtain-body');
    },

    showLang: function (event) {
        var evt = event || window.event;
        //evt.preventDefault();
        evt.stopPropagation();

        if ($('#header').hasClass('menu-top') && $('#header').hasClass('menu-open')) {
            $("#section-menu-top").slideUp();
            $('#section-menu-top').removeClass('open-div');
            $('#header').removeClass('menu-top');
            $("#section-login-top").slideDown();
            $('#section-login-top').addClass('open-div');
            $('#header').addClass('login-top');
            $('#menu-buttom span.icon').removeClass('icon-close').addClass('icon-dropdown_sign');
            $('#language-buttom span.icon').addClass('icon-close');
        } else {
            if ($('#header').hasClass('menu-open') && $('#header').hasClass('login-top')) {
                $("#section-login-top").slideUp();
                $('#section-login-top').removeClass('open-div');
                $('#header').removeClass('menu-open').removeClass('login-top ');
                $('#language-buttom span.icon').removeClass('icon-close');
            } else {
                $("#section-login-top").slideDown();
                $('#section-login-top').addClass('open-div');
                $('#header').addClass('menu-open login-top');
                $('#language-buttom span.icon').addClass('icon-close');
            }
        }
    },


/*----- mobile menu btn------*/

    openMobileMenu: function() {
        document.body.classList.add('has-active-menu');
        document.querySelector("#page").classList.add('has-push-left');
        document.querySelector("#mobile-push-menu").classList.add('is-active');
        document.querySelector("#blue-overlay").classList.add('is-active');
    //        this.disableMenuOpeners();
    },

    closeMobileMenu: function() {
        document.body.classList.remove('has-active-menu');
        document.querySelector("#page").classList.remove('has-push-left');
        document.querySelector("#mobile-push-menu").classList.remove('is-active');
        document.querySelector("#blue-overlay").classList.remove('is-active');
    //        this.enableMenuOpeners();
    }
};