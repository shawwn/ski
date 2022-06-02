document.addEventListener("DOMContentLoaded", function(event) {
	var span = document.getElementById("widths_worth");
	var img = document.getElementById("float_map");
	
	/* Preload BW image. */
	(new Image()).src = "/images/float_special_values_bw.svg";

	window.addEventListener("resize", on_resize, true);
	
	on_resize();
	
	function on_resize() {
		var width = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
	
		var scale = img.clientWidth/560;
		var pitch = 20;
		var distance = pitch * scale * (1<<23 - 1) / width;
		
		span.innerHTML = Math.round(distance).toString();
	}	
  });

function show_bw_map() {
	document.getElementById("float_map").src = "/images/float_special_values_bw.svg";
	document.getElementById("float_show_color").classList.remove("hidden");
	document.getElementById("float_show_bw").classList.add("hidden");
}

function show_color_map() {
	document.getElementById("float_map").src = "/images/float_special_values.svg";
	document.getElementById("float_show_bw").classList.remove("hidden");
	document.getElementById("float_show_color").classList.add("hidden");
}


