jQuery.divselect = function(divselectid,inputselectid) {
		var inputselect = $(inputselectid);
		$(divselectid+" cite").click(function(){
			var ul = $(divselectid+" ul");
			if(ul.css("display")=="none"){
				ul.slideDown("fast");
			}else{
				ul.slideUp("fast");
			}
		});
		$(divselectid+" ul li a").click(function(){
			var txt = $(this).html();
			$(divselectid+" cite").html($(txt).get(0));
			var value = $(this).attr("selectid");
			inputselect.val(value);
			$(divselectid+" ul").hide();
			
		});
	};