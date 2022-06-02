
window.BezierSlider = function (container, knob, min, max, callback) {

	var KnobWidth = 36;

	var GutWidth = 400;
	var GutHeight = 10;

	var knobPosition = new Point(KnobWidth / 2, 0);

	var dragsKnob;
	var selectionOffset;
	//

	container.style.height = GutHeight + "px";
	container.style.width = GutWidth + "px";
	container.style.background = craftGutGradient();
	container.style.position = "relative";
	container.style.userSelect = "none";
	container.style.webkitUserSelect = "none";

	craftTicks();


	container.removeChild(knob);
	container.appendChild(knob);

	knob.style.width = KnobWidth + "px";
	knob.style.height = KnobWidth + "px";
	knob.style.background = "linear-gradient(#eee 0%, #fff 100%)";
	knob.style.border = "1px #aaa solid";
	knob.style.borderRadius = KnobWidth / 2 + "px";
	knob.style.position = "relative";
	knob.style.boxShadow = "0 2px 3px rgba(0,0,0,0.2)";
	knob.style.cursor = "ew-resize";
	knob.style.top = (GutHeight - KnobWidth) / 2 + "px";

	// handlers

	knob.onmousedown = mouse_down;
    knob.addEventListener("touchstart", genericTouchHandler(mouse_down), false);

	var move_handler = genericTouchHandler(mouse_move);

	update(GutWidth / 2);

	function update(position) {

		var stepSize = GutWidth / (max - min);

		var clampedPosition = Math.min(Math.max(0, position), GutWidth);
		var value = min + Math.round(clampedPosition / stepSize);

		callback(value);

		knobPosition.x = Math.round((value - min) * stepSize - 0.5);

		knob.style.left = (knobPosition.x - KnobWidth / 2) + "px";
	}

	function mousePositionForEvent(e) {
		var rect = container.getBoundingClientRect();

		return new Point(e.clientX - rect.left, e.clientY - rect.top);
	}


	function mouse_down(e) {
		var position = mousePositionForEvent(e);
		var diff = position.sub(knobPosition);

		dragsKnob = true;
		selectionOffset = diff.x;

		window.addEventListener("mousemove", mouse_move, false);
        window.addEventListener("mouseup", mouse_up, false);

        window.addEventListener("touchmove", move_handler, false);
        window.addEventListener("touchend", mouse_up, false);
        window.addEventListener("touchcancel", mouse_up, false);


		if (e.preventDefault)
			e.preventDefault();

		return true;
	}

	function mouse_move(e) {
		var position = mousePositionForEvent(e);
		var diff = position.sub(knobPosition);

		if (dragsKnob) {
			update(position.x - selectionOffset);
			return true;
		}
	}

	function mouse_up(e) {

        window.removeEventListener("mousemove", mouse_move, false);
        window.removeEventListener("mouseup", mouse_up, false);

        window.removeEventListener("touchmove", move_handler, false);
        window.removeEventListener("touchend", mouse_up, false);
        window.removeEventListener("touchcancel", mouse_up, false);

		dragsKnob = false;
	}

	function craftGutGradient() {
		var elements = [];

		var center = GutHeight / 2;
		var width = 1;

		elements.push("transparent " + (center - width) + "px");
		elements.push("#bbb " + (center - width) + "px");
		elements.push("#bbb " + (center + width) + "px");
		elements.push("transparent " + (center + width) + "px");

		return "linear-gradient( " + elements.join(", ") + ")";
	}

	function craftTicks() {
		var ticks = max - min;

		var elements = [];

		var width = 0.5;

		for (var i = 0; i <= ticks; i++) {
			var center = 0.5 + Math.round((GutWidth - 1) * i / ticks);

			var tick = document.createElement("div");
			tick.style.background = "#bbb";
			tick.style.position = "absolute";
			tick.style.width = "1px";
			tick.style.display = "inline-block";
			tick.style.height = "6px";
			tick.style.left = center + "px";
			tick.style.top = "2px";
			tick.style.cursor = "default";
			container.appendChild(tick);
		}

	}



}

window.BezierSlider = function (container, knob, min, max, callback) {

	var KnobWidth = 36;

	var GutWidth = 400;
	var GutHeight = 10;

	var knobPosition = new Point(KnobWidth / 2, 0);

	var dragsKnob;
	var selectionOffset;
	//

	container.style.height = GutHeight + "px";
	container.style.width = GutWidth + "px";
	container.style.background = craftGutGradient();
	container.style.position = "relative";
	container.style.userSelect = "none";
	container.style.webkitUserSelect = "none";

	craftTicks();


	container.removeChild(knob);
	container.appendChild(knob);

	knob.style.width = KnobWidth + "px";
	knob.style.height = KnobWidth + "px";
	knob.style.background = "linear-gradient(#eee 0%, #fff 100%)";
	knob.style.border = "1px #aaa solid";
	knob.style.borderRadius = KnobWidth / 2 + "px";
	knob.style.position = "relative";
	knob.style.boxShadow = "0 2px 3px rgba(0,0,0,0.2)";
	knob.style.cursor = "ew-resize";
	knob.style.top = (GutHeight - KnobWidth) / 2 + "px";

	// handlers

	knob.onmousedown = mouse_down;
    knob.addEventListener("touchstart", genericTouchHandler(mouse_down), false);

	var move_handler = genericTouchHandler(mouse_move);

	update(GutWidth / 2);

	function update(position) {

		var stepSize = GutWidth / (max - min);

		var clampedPosition = Math.min(Math.max(0, position), GutWidth);
		var value = min + Math.round(clampedPosition / stepSize);

		callback(value);

		knobPosition.x = Math.round((value - min) * stepSize - 0.5);

		knob.style.left = (knobPosition.x - KnobWidth / 2) + "px";
	}

	function mousePositionForEvent(e) {
		var rect = container.getBoundingClientRect();

		return new Point(e.clientX - rect.left, e.clientY - rect.top);
	}


	function mouse_down(e) {
		var position = mousePositionForEvent(e);
		var diff = position.sub(knobPosition);

		dragsKnob = true;
		selectionOffset = diff.x;

		window.addEventListener("mousemove", mouse_move, false);
        window.addEventListener("mouseup", mouse_up, false);

        window.addEventListener("touchmove", move_handler, false);
        window.addEventListener("touchend", mouse_up, false);
        window.addEventListener("touchcancel", mouse_up, false);


		if (e.preventDefault)
			e.preventDefault();

		return true;
	}

	function mouse_move(e) {
		var position = mousePositionForEvent(e);
		var diff = position.sub(knobPosition);

		if (dragsKnob) {
			update(position.x - selectionOffset);
			return true;
		}
	}

	function mouse_up(e) {

        window.removeEventListener("mousemove", mouse_move, false);
        window.removeEventListener("mouseup", mouse_up, false);

        window.removeEventListener("touchmove", move_handler, false);
        window.removeEventListener("touchend", mouse_up, false);
        window.removeEventListener("touchcancel", mouse_up, false);

		dragsKnob = false;
	}

	function craftGutGradient() {
		var elements = [];

		var center = GutHeight / 2;
		var width = 1;

		elements.push("transparent " + (center - width) + "px");
		elements.push("#bbb " + (center - width) + "px");
		elements.push("#bbb " + (center + width) + "px");
		elements.push("transparent " + (center + width) + "px");

		return "linear-gradient( " + elements.join(", ") + ")";
	}

	function craftTicks() {
		var ticks = max - min;

		var elements = [];

		var width = 0.5;

		for (var i = 0; i <= ticks; i++) {
			var center = 0.5 + Math.round((GutWidth - 1) * i / ticks);

			var tick = document.createElement("div");
			tick.style.background = "#bbb";
			tick.style.position = "absolute";
			tick.style.width = "1px";
			tick.style.display = "inline-block";
			tick.style.height = "6px";
			tick.style.left = center + "px";
			tick.style.top = "2px";
			tick.style.cursor = "default";
			container.appendChild(tick);
		}

	}
}


document.addEventListener("DOMContentLoaded", function(event)
{

	new BezierDrawer(document.getElementById("bezierCurvesDemo"), true, BezierMode.Perfect);
	var lineBezier = new BezierDrawer(document.getElementById("bezierCurvesLine"), false, BezierMode.Line);
	var rectBezier = new BezierDrawer(document.getElementById("bezierCurvesRect"), false, BezierMode.Rects);
	var perfectBezier = new BezierDrawer(document.getElementById("bezierCurvesPerfect"), false, BezierMode.Perfect);
	new BezierDrawer(document.getElementById("bezierCurvesAutoTess"), true, BezierMode.Line);
	
	var min = 2;
	var max = 20;
	
	var ids = ["subdivisionKnob", "bezierCurvesRectKnob", "bezierCurvesPerfectKnob"];
	var targets = [lineBezier, rectBezier, perfectBezier];
	
	ids.forEach(function fn(id, i) {
		var el = document.getElementById(id);
		new BezierSlider(el.parentNode, el, min, max, function (val) {
			targets[i].setTesselationCount(val);
		});
	})

});