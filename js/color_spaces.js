var cie_xs = [0.001368, 0.002236, 0.004243, 0.007650, 0.014310, 0.023190, 0.043510, 0.077630, 0.134380, 0.214770, 0.283900, 0.328500, 0.348280, 0.348060, 0.336200, 0.318700, 0.290800, 0.251100, 0.195360, 0.142100, 0.095640, 0.057950, 0.032010, 0.014700, 0.004900, 0.002400, 0.009300, 0.029100, 0.063270, 0.109600, 0.165500, 0.225750, 0.290400, 0.359700, 0.433450, 0.512050, 0.594500, 0.678400, 0.762100, 0.842500, 0.916300, 0.978600, 1.026300, 1.056700, 1.062200, 1.045600, 1.002600, 0.938400, 0.854450, 0.751400, 0.642400, 0.541900, 0.447900, 0.360800, 0.283500, 0.218700, 0.164900, 0.121200, 0.087400, 0.063600, 0.046770, 0.032900, 0.022700, 0.015840, 0.011359, 0.008111, 0.005790, 0.004109, 0.002899, 0.002049, 0.001440, 0.001000, 0.000690, 0.000476, 0.000332];
var cie_ys = [0.000039, 0.000064, 0.000120, 0.000217, 0.000396, 0.000640, 0.001210, 0.002180, 0.004000, 0.007300, 0.011600, 0.016840, 0.023000, 0.029800, 0.038000, 0.048000, 0.060000, 0.073900, 0.090980, 0.112600, 0.139020, 0.169300, 0.208020, 0.258600, 0.323000, 0.407300, 0.503000, 0.608200, 0.710000, 0.793200, 0.862000, 0.914850, 0.954000, 0.980300, 0.994950, 1.000000, 0.995000, 0.978600, 0.952000, 0.915400, 0.870000, 0.816300, 0.757000, 0.694900, 0.631000, 0.566800, 0.503000, 0.441200, 0.381000, 0.321000, 0.265000, 0.217000, 0.175000, 0.138200, 0.107000, 0.081600, 0.061000, 0.044580, 0.032000, 0.023200, 0.017000, 0.011920, 0.008210, 0.005723, 0.004102, 0.002929, 0.002091, 0.001484, 0.001047, 0.000740, 0.000520, 0.000361, 0.000249, 0.000172, 0.000120];
var cie_zs = [0.006450, 0.010550, 0.020050, 0.036210, 0.067850, 0.110200, 0.207400, 0.371300, 0.645600, 1.039050, 1.385600, 1.622960, 1.747060, 1.782600, 1.772110, 1.744100, 1.669200, 1.528100, 1.287640, 1.041900, 0.812950, 0.616200, 0.465180, 0.353300, 0.272000, 0.212300, 0.158200, 0.111700, 0.078250, 0.057250, 0.042160, 0.029840, 0.020300, 0.013400, 0.008750, 0.005750, 0.003900, 0.002750, 0.002100, 0.001800, 0.001650, 0.001400, 0.001100, 0.001000, 0.000800, 0.000600, 0.000340, 0.000240, 0.000190, 0.000100, 0.000050, 0.000030, 0.000020, 0.000010, 0.000000, 0.000000, 0.000000, 0.000000, 0.000000, 0.000000, 0.000000, 0.000000, 0.000000, 0.000000, 0.000000, 0.000000, 0.000000, 0.000000, 0.000000, 0.000000, 0.000000, 0.000000, 0.000000, 0.000000, 0.000000];

var srgb_to_xyz_d65 = [
    0.4124564, 0.3575761, 0.1804375,
    0.2126729, 0.7151522, 0.0721750,
    0.0193339, 0.1191920, 0.9503041
];

var pcs_to_srgb = [
    3.1338561, -1.6168667, -0.4906146,
    -0.9787684, 1.9161415, 0.0334540,
    0.0719453, -0.2289914, 1.4052427,
]
var srgb_to_pcs = mat3_inverse(pcs_to_srgb);

var cie_rgb_to_cie_xyz = [2.768892, 1.751748, 1.130160,
    1.0, 4.590700, 0.060100,
    0, 0.056508, 5.594292];

var xyz_to_cie_rgb = mat3_inverse(cie_rgb_to_cie_xyz);

function bradford_adaptation(XYZs, XYZd) {
    var Ma = [0.8951000, 0.2664000, -0.1614000,
        -0.7502000, 1.7135000, 0.0367000,
        0.0389000, -0.0685000, 1.0296000];

    var LMSs = mat3_mul_vec(Ma, XYZs);
    var LMSd = mat3_mul_vec(Ma, XYZd);

    var LMS = [LMSd[0] / LMSs[0], 0, 0,
        0, LMSd[1] / LMSs[1], 0,
        0, 0, LMSd[2] / LMSs[2]];

    return mat3_mul(mat3_inverse(Ma), mat3_mul(LMS, Ma));
}

function custom_rgb_to_pcs(xr, yr, xg, yg, xb, yb, xw, yw, skip_adapt) {
    var Xr = xr / yr;
    var Yr = 1.0;
    var Zr = (1 - xr - yr) / yr;

    var Xg = xg / yg;
    var Yg = 1.0;
    var Zg = (1 - xg - yg) / yg;

    var Xb = xb / yb;
    var Yb = 1.0;
    var Zb = (1 - xb - yb) / yb;

    var Xw = xw / yw;
    var Yw = 1.0;
    var Zw = (1 - xw - yw) / yw;

    var mat = mat3_inverse([Xr, Xg, Xb, Yr, Yg, Yb, Zr, Zg, Zb]);
    var Sr = mat[0] * Xw + mat[1] * Yw + mat[2] * Zw;
    var Sg = mat[3] * Xw + mat[4] * Yw + mat[5] * Zw;
    var Sb = mat[6] * Xw + mat[7] * Yw + mat[8] * Zw;

    var reduced_rgb_to_XYZ = [Sr * Xr, Sg * Xg, Sb * Xb,
    Sr * Yr, Sg * Yg, Sb * Yb,
    Sr * Zr, Sg * Zg, Sb * Zb];

    if (skip_adapt)
        return reduced_rgb_to_XYZ;

    var res = mat3_mul(bradford_adaptation([Xw, Yw, Zw], [0.96430, 1.0, 0.82491]), reduced_rgb_to_XYZ);

    return res;
}

function rgb_color_string(rgb, a) {
    rgb = rgb.slice();
    rgb[0] = Math.max(0.0, Math.min(1.0, rgb[0]));
    rgb[1] = Math.max(0.0, Math.min(1.0, rgb[1]));
    rgb[2] = Math.max(0.0, Math.min(1.0, rgb[2]));
    if (a)
        return "rgba(" + Math.round(rgb[0] * 255) + "," + Math.round(rgb[1] * 255) + "," + Math.round(rgb[2] * 255) + "," + a + ")";
    return "rgb(" + Math.round(rgb[0] * 255) + "," + Math.round(rgb[1] * 255) + "," + Math.round(rgb[2] * 255) + ")";
}

function reduced_gamut_parameters(t) {
    var xr = 0.64;
    var yr = 0.33;
    var xg = 0.3;
    var yg = 0.6;
    var xb = 0.15;
    var yb = 0.06;
    var xw = 0.3127;
    var yw = 0.3290;

    xr = (xr - xw) * t + xw;
    yr = (yr - yw) * t + yw;

    xg = (xg - xw) * t + xw;
    yg = (yg - yw) * t + yw;

    xb = (xb - xw) * t + xw;
    yb = (yb - yw) * t + yw;

    return [xr, yr, xg, yg, xb, yb, xw, yw];
}

function gamut_reduction_matrix(t) {
    var p = reduced_gamut_parameters(t);
    return mat3_mul(mat3_inverse(custom_rgb_to_pcs(p[0], p[1], p[2], p[3], p[4], p[5], p[6], p[7])), srgb_to_pcs);
}

function degamma(x) {
    return x < 0.04045 ? x * (1.0 / 12.92) : Math.pow((x + 0.055) / 1.055, 2.4);
}

function engamma(x) {
    return x < 0.0031308 ? x * 12.92 : (1.055 * Math.pow(x, 1.0 / 2.4) - 0.055);
}

function mat3_inverse(m) {
    /* 0 1 2
       3 4 5
       6 7 8 */
    var det = m[0] * m[4] * m[8] +
        m[1] * m[5] * m[6] +
        m[2] * m[3] * m[7] -
        m[2] * m[4] * m[6] -
        m[1] * m[3] * m[8] -
        m[0] * m[5] * m[7];

    var d = 1 / det;
    var res = [];
    res[0] = d * (m[4] * m[8] - m[5] * m[7]);
    res[1] = d * (m[2] * m[7] - m[1] * m[8]);
    res[2] = d * (m[1] * m[5] - m[2] * m[4]);

    res[3] = d * (m[5] * m[6] - m[3] * m[8]);
    res[4] = d * (m[0] * m[8] - m[2] * m[6]);
    res[5] = d * (m[2] * m[3] - m[0] * m[5]);

    res[6] = d * (m[3] * m[7] - m[4] * m[6]);
    res[7] = d * (m[1] * m[6] - m[0] * m[7]);
    res[8] = d * (m[0] * m[4] - m[1] * m[3]);

    return res;
}

function mat3_mul(a, b) {
    /* 0 1 2
       3 4 5
       6 7 8 */

    var res = [];
    res[0] = a[0] * b[0] + a[1] * b[3] + a[2] * b[6];
    res[1] = a[0] * b[1] + a[1] * b[4] + a[2] * b[7];
    res[2] = a[0] * b[2] + a[1] * b[5] + a[2] * b[8];

    res[3] = a[3] * b[0] + a[4] * b[3] + a[5] * b[6];
    res[4] = a[3] * b[1] + a[4] * b[4] + a[5] * b[7];
    res[5] = a[3] * b[2] + a[4] * b[5] + a[5] * b[8];

    res[6] = a[6] * b[0] + a[7] * b[3] + a[8] * b[6];
    res[7] = a[6] * b[1] + a[7] * b[4] + a[8] * b[7];
    res[8] = a[6] * b[2] + a[7] * b[5] + a[8] * b[8];

    return res;
}

function mat3_mul_vec(a, b) {
    var res = [];
    res[0] = a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
    res[1] = a[3] * b[0] + a[4] * b[1] + a[5] * b[2];
    res[2] = a[6] * b[0] + a[7] * b[1] + a[8] * b[2];

    return res;
}




function ColorMatcher(container, callback0, callback1, mode, unnormalized, fixed, flip, xr) {

    var sliders = [];

    var div0 = document.createElement("div");
    var div1 = document.createElement("div");
    var label_container0 = document.createElement("div");
    var label_container1 = document.createElement("div");

    if (mode == "single") {
        div0.classList.add("color_match0_single");
        div1.classList.add("color_match1_single");
    } else if (mode === "halfs") {
        div0.classList.add("color_match0_halfs");
        div1.classList.add("color_match1_halfs");
    }

    label_container0.classList.add("color_match_label_container");
    label_container1.classList.add("color_match_label_container");

    if (mode !== "just_sliders") {
        container.appendChild(div0);
        container.appendChild(div1);
        div0.appendChild(label_container0);
        div1.appendChild(label_container1);
    }


    var sliders_container = document.createElement("div");
    sliders_container.classList.add("color_slider_container");
    var classes = ["color_red_slider", "color_green_slider", "color_blue_slider"];
    var label_prefix = ["R", "G", "B"];

    for (var i = 0; i < 3; i++) {
        var slider = document.createElement("div");
        slider.classList.add("color_slider");

        var left_gutter = document.createElement("div");
        left_gutter.classList.add(classes[i]);
        left_gutter.classList.add("color_slider_gutter");

        var right_gutter = document.createElement("div");
        right_gutter.classList.add(classes[i]);
        right_gutter.classList.add("color_slider_gutter");
        right_gutter.style.opacity = "0.2";

        var knob = document.createElement("div");
        knob.classList.add(classes[i]);
        knob.classList.add("color_slider_knob");

        knob.onmousedown = mouse_down;
        knob.addEventListener("touchstart", genericTouchHandler(mouse_down), false);

        var label0 = document.createElement("div");
        label0.classList.add("color_match_source_label");
        label_container0.appendChild(label0);

        var label1 = document.createElement("div");
        label1.classList.add("color_match_source_label");
        label_container1.appendChild(label1);

        slider.appendChild(left_gutter);
        slider.appendChild(right_gutter);
        slider.appendChild(knob);
        sliders_container.appendChild(slider);

        sliders.push({
            index: i,
            slider: slider,
            left_gutter: left_gutter,
            right_gutter: right_gutter,
            knob: knob,
            label0: label0,
            label1: label1,
            label_prefix: label_prefix[i],
            percentage: 0.5,
        })
    }

    container.appendChild(sliders_container);


    window.addEventListener("resize", on_resize, true);
    window.addEventListener("load", on_resize, true);

    on_resize();
    update_color();

    function percentage(p) {
        if (xr)
            return p * 3 - 1;
        return p;
    }

    function upercentage(p) {
        if (xr)
            return (p + 1) / 3.0;
        return p;
    }

    function update_color() {
        var c0 = callback0([percentage(sliders[0].percentage), percentage(sliders[1].percentage), percentage(sliders[2].percentage)]);
        var c1 = callback1([percentage(sliders[0].percentage), percentage(sliders[1].percentage), percentage(sliders[2].percentage)]);

        div0.style.background = rgb_color_string(c0);
        div1.style.background = rgb_color_string(c1);

        var lc0 = c0[0] * 0.2126729 + c0[1] * 0.7151522 + c0[2] * 0.0721750 > 0.5 ? "#333" : "#ddd";
        var lc1 = c1[0] * 0.2126729 + c1[1] * 0.7151522 + c1[2] * 0.0721750 > 0.5 ? "#333" : "#ddd";
        for (var i = 0; i < 3; i++) {
            sliders[i].label0.style.color = lc0;
            sliders[i].label1.style.color = lc1;
        }
    }

    function on_resize() {

        for (var i = 0; i < sliders.length; i++) {
            var slider = sliders[i];
            update_slider(slider);
        }

    }

    function update_slider(slider) {
        var width = slider.slider.getBoundingClientRect().width;

        slider.left_gutter.style.width = width * slider.percentage + "px";
        slider.left_gutter.style.left = "-2px";

        slider.right_gutter.style.width = (width * (1.0 - slider.percentage) + 2) + "px";
        slider.right_gutter.style.left = width * slider.percentage + "px";

        var knob_width = slider.knob.getBoundingClientRect().width;

        slider.knob.style.left = (width * slider.percentage - knob_width / 2) + "px"

        var percent = percentage(slider.percentage);

        var value = unnormalized ? Math.round(percent * 255) : percent.toFixed(3);
        var str0 = "<span class=\"color_label_prefix\">" + slider.label_prefix + "</span>" + ": " + value;
        var str1 = "<span class=\"color_label_prefix\">" + slider.label_prefix + "</span>" + ": " + (fixed ? fixed[slider.index].toFixed(3) : value);
        if (flip) {
            slider.label0.innerHTML = str1;
            slider.label1.innerHTML = str0;
        }
        else {
            slider.label0.innerHTML = str0;
            slider.label1.innerHTML = str1;
        }
    }

    var dragged_slider = undefined;
    var selection_offset;

    var move_handler = genericTouchHandler(mouse_move);

    function mouse_down(e) {
        for (var i = 0; i < sliders.length; i++) {
            if (e.target === sliders[i].knob) {
                dragged_slider = sliders[i];
                break;
            }
        }
        if (!dragged_slider)
            return;

        var knob_rect = dragged_slider.knob.getBoundingClientRect();
        selection_offset = e.clientX - knob_rect.left - knob_rect.width / 2;

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
        var slider_rect = dragged_slider.slider.getBoundingClientRect();
        var x = e.clientX - selection_offset - slider_rect.left;

        var percentage = Math.max(0, Math.min(1.0, x / slider_rect.width));

        if (percentage != dragged_slider.percentage) {
            dragged_slider.percentage = percentage;
            update_slider(dragged_slider);
            update_color();
        }

        // e.preventDefault();
        return true;
    }

    function mouse_up(e) {
        window.removeEventListener("mousemove", mouse_move, false);
        window.removeEventListener("mouseup", mouse_up, false);

        window.removeEventListener("touchmove", move_handler, false);
        window.removeEventListener("touchend", mouse_up, false);
        window.removeEventListener("touchcancel", mouse_up, false);

        dragged_slider = undefined;
    }
    this.set_percentages = function (percentages) {
        for (var i = 0; i < percentages.length; i++) {
            sliders[i].percentage = upercentage(percentages[i]);
            update_slider(sliders[i]);
        }
        update_color();
    }
}

function ColorPlates(container, colors, callback0, callback1) {
    for (var i = 0; i < colors.length; i++) {
        var rgb = colors[i];

        var group = document.createElement("div");
        group.classList.add("color_plate_group");

        var top = document.createElement("div");
        top.classList.add("color_plate_group_top");
        top.style.background = rgb_color_string(callback0(rgb));

        var bottom = document.createElement("div");
        bottom.classList.add("color_plate_group_bottom");
        bottom.style.background = rgb_color_string(callback1(rgb));

        var slider_container = document.createElement("div");
        slider_container.classList.add("color_plate_group_sliders");

        var classes = ["color_red_slider", "color_green_slider", "color_blue_slider"];

        for (var j = 0; j < 3; j++) {
            var slider = document.createElement("div");
            slider.classList.add("color_plate_group_slider");

            var bg = document.createElement("div");
            bg.classList.add(classes[j]);
            bg.classList.add("color_plate_group_slider_bg");
            bg.style.opacity = "0.2";
            bg.style.width = "100%";

            var p = document.createElement("div");
            p.classList.add(classes[j]);
            p.classList.add("color_plate_group_slider_p");
            p.style.width = (100 * rgb[j]) + "%";

            slider.appendChild(bg);
            slider.appendChild(p);
            slider_container.appendChild(slider);
        }

        container.appendChild(group);
        group.appendChild(top);
        group.appendChild(bottom);
        group.appendChild(slider_container);
    }
}


function Color3DPlot(container, segments, zoom, labels) {

    var canvas = document.createElement("canvas");
    canvas.classList.add("color_3d_plot_canvas");
    container.appendChild(canvas);

    var width;
    var height;
    var scale;
    var dot_xyz;
    var dot_style;
    var mvp = [0.8090169943749475, 0, -0.5877852522924731, 0.22493567784086388, -0.9238795325112867, 0.30959740024909344, -0.5430427641049989, -0.3826834323650898, -0.7474342425568128];

    var arcball = new ArcBall(mvp, function () {
        mvp = arcball.matrix.slice();
        draw();
    });

    canvas.onmousedown = mouse_down;
    canvas.addEventListener("touchstart", genericTouchHandler(mouse_down), false);

    var move_handler = genericTouchHandler(mouse_move);

    on_resize();

    function canvas_space(e) {
        var r = canvas.getBoundingClientRect();
        return [e.clientX - r.left, e.clientY - r.top];
    }

    function mouse_down(e) {
        window.addEventListener("mousemove", mouse_move, false);
        window.addEventListener("mouseup", mouse_up, false);

        window.addEventListener("touchmove", move_handler, false);
        window.addEventListener("touchend", mouse_up, false);
        window.addEventListener("touchcancel", mouse_up, false);

        var p = canvas_space(e);
        arcball.start(p[0], p[1]);

        return true;
    }

    function mouse_move(e) {
        var p = canvas_space(e);
        arcball.update(p[0], p[1], e.timeStamp);
        mvp = arcball.matrix.slice();

        draw();
    }

    this.set_rgb = function (rgb) {
        this.rgb = rgb;

        draw();
    }

    this.set_dot = function (xyz, style) {
        dot_xyz = xyz;
        dot_style = style;
        draw();
    }

    function mouse_up(e) {
        arcball.end(e.timeStamp);
        window.removeEventListener("mousemove", mouse_move, false);
        window.removeEventListener("mouseup", mouse_up, false);

        window.removeEventListener("touchmove", move_handler, false);
        window.removeEventListener("touchend", mouse_up, false);
        window.removeEventListener("touchcancel", mouse_up, false);
    }

    window.addEventListener("resize", on_resize, true);
    window.addEventListener("load", on_resize, true);

    document.fonts.load("10px IBM Plex Sans").then(draw);

    function on_resize() {

        width = canvas.parentNode.clientWidth;
        height = canvas.parentNode.clientHeight;

        arcball.set_viewport_size(width, height);

        canvas.style.width = width + "px";
        canvas.style.height = height + "px";

        scale = window.devicePixelRatio || 1;
        canvas.width = width * scale;
        canvas.height = height * scale;


        draw();
    }


    function draw() {
        var ctx = canvas.getContext("2d");
        ctx.resetTransform();

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        var s = 2;
        var x = zoom * s * Math.min(width, height);
        ctx.lineWidth = 3.0 / s;

        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.scale(scale, scale);

        var lines = segments.slice();

        for (var i = 0; i < lines.length; i++) {
            var line = {
                xyz0: lines[i].xyz0.slice(),
                xyz1: lines[i].xyz1.slice(),
                color: lines[i].color
            };

            for (var j = 0; j < 3; j++) {
                line.xyz0[j] -= 0.5;
                line.xyz1[j] -= 0.5;
            }

            line.xyz0 = mat3_mul_vec(mvp, line.xyz0);
            line.xyz1 = mat3_mul_vec(mvp, line.xyz1);

            line.xyz0[0] /= 1.0 + 0.2 * line.xyz0[2];
            line.xyz0[1] /= 1.0 + 0.2 * line.xyz0[2];

            line.xyz1[0] /= 1.0 + 0.2 * line.xyz1[2];
            line.xyz1[1] /= 1.0 + 0.2 * line.xyz1[2];

            lines[i] = line;
        }

        lines.sort(function (a, b) { return -Math.max(a.xyz0[2], a.xyz1[2]) + Math.max(b.xyz0[2], b.xyz1[2]) });

        for (var i = 0; i < lines.length; i++) {
            var line = lines[i];
            ctx.strokeStyle = line.color;

            ctx.beginPath();
            ctx.moveTo(x * line.xyz0[0], x * line.xyz0[1]);
            ctx.lineTo(x * line.xyz1[0], x * line.xyz1[1]);
            ctx.stroke();
        }

        if (dot_xyz) {
            var pos = [dot_xyz[0] - 0.5, dot_xyz[1] - 0.5, dot_xyz[2] - 0.5];
            pos = mat3_mul_vec(mvp, pos);

            pos[0] /= 1.0 + 0.2 * pos[2];
            pos[1] /= 1.0 + 0.2 * pos[2];

            ctx.fillStyle = dot_style;

            ctx.beginPath();
            ctx.arc(x * pos[0], x * pos[1], 7.0 / s, 0, Math.PI * 2, false);
            ctx.fill();
        }

        var font_size = 40;
        ctx.textAlign = "center";

        if (labels) {
            for (var i = 0; i < labels.length; i++) {
                var pos = [labels[i].xyz[0] - 0.5, labels[i].xyz[1] - 0.5, labels[i].xyz[2] - 0.5];
                pos = mat3_mul_vec(mvp, pos);


                pos[0] /= 1.0 + 0.2 * pos[2];
                pos[1] /= 1.0 + 0.2 * pos[2];

                ctx.font = (font_size / s) + "px IBM Plex Sans";

                ctx.fillStyle = labels[i].color;
                ctx.fillText(labels[i].text, x * pos[0], x * pos[1]);

                if (labels[i].decoration === "underline")
                    ctx.fillRect(x * pos[0] - font_size / (s * 4), x * pos[1] + 4.0 / s, font_size / (2 * s), 3 / s);
                else if (labels[i].decoration === "overline")
                    ctx.fillRect(x * pos[0] - font_size / (s * 4), x * pos[1] - font_size * 0.9 / s, font_size / (2 * s), 3 / s);
                else if (labels[i].decoration === "cie") {
                    ctx.font = (font_size / (1.8 * s)) + "px IBM Plex Sans";
                    ctx.fillText("CIE", x * pos[0], x * pos[1] + 20 / s);
                }
            }
        }
    }

}

window.GLEditor = function (canvas, vertex_source, fragment_source) {
    
    function compile_shader(gl, source, type) {
        var shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);

        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            throw "could not compile shader:" + gl.getShaderInfoLog(shader);
        }

        return shader;
    }
    
    function create_program(gl, vertex, fragment) {
        var program = gl.createProgram();
        gl.attachShader(program, vertex);
        gl.attachShader(program, fragment);
        gl.linkProgram(program);

        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            throw ("program filed to link:" + gl.getProgramInfoLog(program));
        }

        return program;
    };
    
    var gl = canvas.getContext("webgl");
    if (!gl)
        return;

    var vertex_shader = compile_shader(gl, vertex_source, gl.VERTEX_SHADER);
    var fragment_shader = compile_shader(gl, fragment_source, gl.FRAGMENT_SHADER);
    var program = create_program(gl, vertex_shader, fragment_shader);

    var position_location = gl.getAttribLocation(program, "a_position");
    var mat3_location = gl.getUniformLocation(program, "u_mvp");
    var texture_location = gl.getUniformLocation(program, "u_texture");
    var factors_location = gl.getUniformLocation(program, "u_factors");
    var factors_location2 = gl.getUniformLocation(program, "u_factors2");

    var position_buffer = gl.createBuffer();
    var texture;
    var factors;
    var factors2;

    var image_width;
    var image_height;
    var canvas_width;
    var canvas_height;


    gl.bindBuffer(gl.ARRAY_BUFFER, position_buffer);

    var positions = [0, 0, 0, 1, 1, 0, 1, 0, 0, 1, 1, 1,];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

    this.draw = function () {

        if (!texture)
            return;

        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);

        gl.useProgram(program);

        gl.bindBuffer(gl.ARRAY_BUFFER, position_buffer);
        gl.enableVertexAttribArray(position_location);
        gl.vertexAttribPointer(position_location, 2, gl.FLOAT, false, 0, 0);

        gl.uniform1i(texture_location, 0);

        var scale_x = image_width / canvas_width;
        var scale_y = image_height / canvas_height;
        var scale = Math.max(scale_x, scale_y);



        var sx = 2.0 * (image_width / scale) / canvas_width;
        var sy = 2.0 * (image_height / scale) / canvas_height;
        // sx = 1;
        // sy = 1;
        var matrix = [sx, 0, 0, 0,
            0, -sy, 0, 0,
            0, 0, 1, 0,
            -sx / 2, +sy / 2, 0, 1];
        gl.uniformMatrix4fv(mat3_location, false, matrix);

        if (factors)
            gl.uniformMatrix3fv(factors_location, false, factors);

        if (factors2)
            gl.uniformMatrix3fv(factors_location2, false, factors2);

        gl.drawArrays(gl.TRIANGLES, 0, 6);
    }

    this.set_image = function (img) {

        image_width = img.width;
        image_height = img.height;

        if (texture)
            gl.deleteTexture(texture);

        texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);

        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
    }

    this.set_uniforms = function (arr) {
        factors = arr;
    }

    this.set_uniforms2 = function (arr) {
        factors2 = arr;
    }

    var self = this;


    this.on_resize = function () {

        width = canvas.parentNode.clientWidth;
        height = canvas.parentNode.clientHeight;

        canvas.style.width = width + "px";
        canvas.style.height = height + "px";

        var devicePixelRatio = window.devicePixelRatio || 1;
        canvas.width = width * devicePixelRatio;
        canvas.height = height * devicePixelRatio;

        canvas_width = canvas.width;
        canvas_height = canvas.height;

        this.draw();
    }

    this.on_resize();
    this.draw();
    
    window.addEventListener("resize", function () { self.on_resize() }, true);
    window.addEventListener("load", function () { self.on_resize() }, true);

}

document.addEventListener("DOMContentLoaded", function (event) {


    var vertex_source = `
        attribute vec4 a_position;

        uniform mat4 u_mvp;

        varying vec2 v_texcoord;

        void main() {
            gl_Position = u_mvp * a_position;
            v_texcoord = a_position.xy;
        }`;

    var fragment_source_color_gamut = `
        precision highp float;

        varying vec2 v_texcoord;

        uniform sampler2D u_texture;
        uniform mat3 u_factors;
        uniform mat3 u_factors2;

        float degamma (float x) {
            return x < 0.04045 ? x * (1.0/12.92) : pow((x + 0.055)/1.055, 2.4);
        }
        float engamma (float x) {
            return x < 0.0031308 ? x * 12.92 : (1.055 * pow(x, 1.0/2.4) - 0.055);
        }

        void main() {
            vec4 rgb = texture2D(u_texture, v_texcoord);
            rgb.r = degamma(rgb.r);
            rgb.g = degamma(rgb.g);
            rgb.b = degamma(rgb.b);

            rgb.rgb = u_factors * rgb.rgb;
            rgb.rgb = max(vec3(0.0), min (vec3(1.0), rgb.rgb));
            rgb.rgb = u_factors2 * rgb.rgb;

            rgb.r = engamma(rgb.r);
            rgb.g = engamma(rgb.g);
            rgb.b = engamma(rgb.b);

            gl_FragColor = rgb;
        }`;


    var canvas = document.getElementById("color_gamut_canvas");
    editor = new GLEditor(canvas, vertex_source, fragment_source_color_gamut);
    var index = 0;
    canvas.onclick = function (e) {
        index = (index + 1) % 5;
        img.src = "/images/color_show_" + index + ".jpg"
    }
    var img = new Image();
    img.addEventListener('load', function () {
        editor.set_image(img);
        editor.draw();
    });

    img.src = "/images/color_show_0.jpg";

    var gamut_canvas = document.getElementById("color_gamut_plot_canvas");


    let val = 0.5;

    function on_resize() {
    
    var w = gamut_canvas.clientWidth;
    var h = gamut_canvas.clientHeight;
    
    var devicePixelRatio = window.devicePixelRatio || 1;
    gamut_canvas.width = w * devicePixelRatio;
    gamut_canvas.height = h * devicePixelRatio;
    
    gamut_slider_callback(val);
    }

    
    function gamut_slider_callback(p) {
        
        val = p;
        p = 0.25 + 0.75 * p;

        var gamut = reduced_gamut_parameters(p);
        var a = gamut_reduction_matrix(p);
        var b = mat3_inverse(a);
        editor.set_uniforms([a[0], a[3], a[6], a[1], a[4], a[7], a[2], a[5], a[8]]);
        editor.set_uniforms2([b[0], b[3], b[6], b[1], b[4], b[7], b[2], b[5], b[8]]);
        editor.draw();

        var w = gamut_canvas.clientWidth;
        var h = gamut_canvas.clientHeight;
        
        var ctx = gamut_canvas.getContext("2d");
        ctx.resetTransform();
        ctx.clearRect(0, 0, gamut_canvas.width, gamut_canvas.height);
        
        ctx.scale(devicePixelRatio, -devicePixelRatio);
        ctx.translate(2, -gamut_canvas.clientHeight + 2);

        ctx.strokeStyle = "rgba(255, 255, 255, 0.35)";
        ctx.beginPath();

        for (var i = 0; i < cie_xs.length; i++) {
            var p = [cie_xs[i], cie_ys[i], cie_zs[i]];
            var s = p[0] + p[1] + p[2];

            var x = w * p[0] / s;
            var y = h * p[1] / s;

            if (i == 0)
                ctx.moveTo(x, y);
            else
                ctx.lineTo(x, y);
        }

        ctx.closePath();
        ctx.stroke();

        ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";


        ctx.beginPath();
        ctx.moveTo(w * gamut[0], h * gamut[1]);
        ctx.lineTo(w * gamut[2], h * gamut[3]);
        ctx.lineTo(w * gamut[4], h * gamut[5]);
        ctx.closePath();
        ctx.stroke();
    }
    new Slider(document.getElementById("color_gamut_canvas_slider_container"), gamut_slider_callback, "color_gamut_");
    
    window.addEventListener("resize", on_resize, true);
    window.addEventListener("load", on_resize, true);
});

var pcs_to_srgb_absolute = mat3_inverse(custom_rgb_to_pcs(0.64, 0.33, 0.3, 0.6, 0.15, 0.06, 0.3127, 0.3290, true));
var crazy_to_srgb_matrix = mat3_mul(pcs_to_srgb_absolute, custom_rgb_to_pcs(0.57, 0.36, 0.3, 0.52, 0.19, 0.16, 0.33242, 0.34743, true)); //d55

var funky_to_srgb_matrix = mat3_mul(pcs_to_srgb, custom_rgb_to_pcs(0.55, 0.37, 0.35, 0.56, 0.19, 0.16, 0.3127, 0.3290));
var srgb_to_funky_matrix = mat3_inverse(funky_to_srgb_matrix);

var white_to_srgb_matrix = mat3_mul(pcs_to_srgb_absolute, custom_rgb_to_pcs(0.64, 0.33, 0.3, 0.6, 0.15, 0.06, 0.34567, 0.35850, true)); //d50


var plain_srgb_matcher;
var plain_nrgb_matcher;

var low_gamut_matcher;
var high_gamut_matcher;
var red_matcher;
var green_matcher;
var yellow_matcher;

var color = [1.0, 0.9, 0.1];

function wide_to_srgb(rgb) {
    rgb = rgb.slice();

    rgb[0] = engamma(rgb[0]);
    rgb[1] = engamma(rgb[1]);
    rgb[2] = engamma(rgb[2]);

    return rgb;
}



function low_gamut_to_srgb(rgb) {

    rgb = mat3_mul_vec(low_gamut_to_srgb_matrix, rgb);

    rgb[0] = engamma(rgb[0]);
    rgb[1] = engamma(rgb[1]);
    rgb[2] = engamma(rgb[2]);

    return rgb;
}

function crazy_to_srgb(rgb) {

    rgb = mat3_mul_vec(crazy_to_srgb_matrix, rgb);

    rgb[0] = engamma(rgb[0]);
    rgb[1] = engamma(rgb[1]);
    rgb[2] = engamma(rgb[2]);

    return rgb;
}

function funky_to_srgb(rgb) {

    rgb = mat3_mul_vec(funky_to_srgb_matrix, rgb);

    rgb[0] = engamma(rgb[0]);
    rgb[1] = engamma(rgb[1]);
    rgb[2] = engamma(rgb[2]);

    return rgb;
}

function white_to_srgb(rgb) {

    rgb = mat3_mul_vec(white_to_srgb_matrix, rgb);

    rgb[0] = engamma(rgb[0]);
    rgb[1] = engamma(rgb[1]);
    rgb[2] = engamma(rgb[2]);

    return rgb;
}




var fixed_color = [0.9, 0.5, 0.2];
var funky_yellow_matcher;
var funky_red_matcher;
var funky_green_matcher;
var funky_blue_matcher;
var inverse_funky_red_matcher;
var inverse_funky_red_xr_matcher;
var white_point_matcher;
var cube_matcher;

document.addEventListener("DOMContentLoaded", function (event) {


    var weak_container = document.getElementById("color_weak_color_slider_container");

    var red_container = document.getElementById("color_red_slider_container");
    var green_container = document.getElementById("color_green_slider_container");
    var yellow_container = document.getElementById("color_yellow_matcher_slider_container");

    var plot_narrow_container = document.getElementById("color_plot_narrow_container");
    var plot_wide_container = document.getElementById("color_plot_wide_container");

    var red_wide_container = document.getElementById("color_red_wide_slider_container");


    function srgb_callback(rgb) {
        return wide_to_srgb(rgb);
    }

    function crazy_callback(rgb) {
        return (crazy_to_srgb(rgb));
    }

    function funky_callback(rgb) {
        return (funky_to_srgb(rgb));
    }

    function quadratic_callback(rgb) {
        return srgb_callback([rgb[0] * rgb[0], rgb[1] * rgb[1], rgb[2] * rgb[2]]);
    }


    function fixed_callback(rgb) {
        return (funky_to_srgb(fixed_color));
    }

    plain_srgb_matcher = new ColorMatcher(document.getElementById("color_plain_srgb_slider_container"), function (x) { return x; }, function (x) { return x; }, "single", true);
    plain_crazy_matcher = new ColorMatcher(document.getElementById("color_plain_crazy_slider_container"), crazy_callback, crazy_callback, "single", true);

    new ColorMatcher(document.getElementById("color_plain_linear_quadratic_slider_container"), quadratic_callback, srgb_callback, "halfs");
    new ColorMatcher(document.getElementById("color_linear_srgb_funky_slider_container"), srgb_callback, funky_callback, "halfs");
    funky_yellow_matcher = new ColorMatcher(document.getElementById("color_linear_srgb_funky_yellow_slider_container"), srgb_callback, fixed_callback, "halfs", false, fixed_color);
    funky_red_matcher = new ColorMatcher(document.getElementById("color_linear_srgb_funky_red_slider_container"), srgb_callback, function fixed_callback(rgb) {
        return (funky_to_srgb([1, 0, 0]));
    }, "halfs", false, [1, 0, 0]);

    funky_green_matcher = new ColorMatcher(document.getElementById("color_linear_srgb_funky_green_slider_container"), srgb_callback, function (rgb) {
        return (funky_to_srgb([0, 1, 0]));
    }, "halfs", false, [0, 1, 0]);

    funky_blue_matcher = new ColorMatcher(document.getElementById("color_linear_srgb_funky_blue_slider_container"), srgb_callback, function (rgb) {
        return (funky_to_srgb([0, 0, 1]));
    }, "halfs", false, [0, 0, 1]);

    inverse_funky_red_matcher = new ColorMatcher(document.getElementById("color_linear_srgb_funky_red_inverse_slider_container"), function (rgb) {
        return ([1, 0, 0]);
    }, funky_callback, "halfs", false, [1, 0, 0], true);

    inverse_funky_red_xr_matcher = new ColorMatcher(document.getElementById("color_linear_srgb_funky_red_xr_inverse_slider_container"), function (rgb) {
        return ([1, 0, 0]);
    }, funky_callback, "halfs", false, [1, 0, 0], true, true);


    function white_callback(rgb) {
        return (white_to_srgb(rgb));
    }

    white_point_matcher = new ColorMatcher(document.getElementById("color_plain_white_slider_container"), srgb_callback, white_callback, "halfs");

    var plates_values = [[0, 0, 0], [0.5, 0.5, 0.5], [1, 1, 1], [1, 0, 0], [0, 1, 0], [0, 0, 1], [0.75, 0.5, 0.25]];

    new ColorPlates(document.getElementById("color_plates_crazy_container"), plates_values, function (x) { return x; }, crazy_callback);
    new ColorPlates(document.getElementById("color_plates_plain_linear_quadratic_container"), plates_values, quadratic_callback, srgb_callback);
    new ColorPlates(document.getElementById("color_plates_linear_funky_container"), plates_values, srgb_callback, funky_callback);

    var rg_plates_values = [[1, 0, 0], [5.0 / 6.0, 1.0 / 6.0, 0], [4.0 / 6.0, 2.0 / 6.0, 0], [0.5, 0.5, 0], [2.0 / 6.0, 4.0 / 6.0, 0], [1.0 / 6.0, 5.0 / 6.0, 0], [0, 1, 0]];

    new ColorPlates(document.getElementById("color_plates_red_green_container"), rg_plates_values, function (x) { return x; }, srgb_callback);


    var base_points = [];

    for (var x = 0; x < 2; x++) {
        for (var y = 0; y < 2; y++) {
            for (var z = 0; z < 2; z++) {
                var p = [x, y, z];
                base_points.push(p);
            }
        }
    }

    /*       3    7
       2    6
             1    5
       0    4
    */

    var pairs = [[0, 1], [0, 4], [4, 5], [1, 5],
    [2, 6], [6, 7], [7, 3], [3, 2],
    [0, 2], [1, 3], [5, 7], [4, 6]];


    var narrow_lines = [];
    var wide_lines = [];

    var rgb_lines = [];
    var xyz_lines = [];
    var xyz1_lines = [];
    var xyy_lines = [];
    var xyy1_lines = [];
    var white_lines = [];

    var large_color = "rgba(0, 0, 0, 0.07)";
    var thick_color = "rgba(0, 0, 0, 0.14)";

    var red = "rgb(231,76,60)"
    var red_a = "rgba(231,76,60, 0.3)"

    var green = "rgb(53,194,91)"
    var green_a = "rgba(53,194,91, 0.3)"

    var blue = "rgb(93,118,232)"
    var blue_a = "rgba(93,118,232, 0.3)"

    for (var i = 0; i < pairs.length; i++) {

        var small_color = "rgba(0, 0, 0, 0.24)";
        var simple_color = large_color;
        var rgb_color = large_color;
        if (i == 1) {
            small_color = red;
            rgb_color = red_a;
            simple_color = thick_color;
        }
        if (i == 0) {
            small_color = blue;
            rgb_color = blue_a;
            simple_color = thick_color;
        }
        if (i == 8) {
            small_color = green;
            rgb_color = green_a;
            simple_color = thick_color;
        }

        var base = {
            xyz0: base_points[pairs[i][0]].slice(),
            xyz1: base_points[pairs[i][1]].slice(),
            color: large_color,
        };

        var rgb_base = {
            xyz0: base_points[pairs[i][0]].slice(),
            xyz1: base_points[pairs[i][1]].slice(),
            color: rgb_color,
        };

        narrow_lines.push(rgb_base);

        narrow_lines.push({
            xyz0: mat3_mul_vec(funky_to_srgb_matrix, base_points[pairs[i][0]]),
            xyz1: mat3_mul_vec(funky_to_srgb_matrix, base_points[pairs[i][1]]),
            color: small_color,
        })

        white_lines.push(rgb_base);

        white_lines.push({
            xyz0: mat3_mul_vec(white_to_srgb_matrix, base_points[pairs[i][0]]),
            xyz1: mat3_mul_vec(white_to_srgb_matrix, base_points[pairs[i][1]]),
            color: small_color,
        })

        wide_lines.push(rgb_base);

        wide_lines.push({
            xyz0: mat3_mul_vec(srgb_to_funky_matrix, base_points[pairs[i][0]]),
            xyz1: mat3_mul_vec(srgb_to_funky_matrix, base_points[pairs[i][1]]),
            color: small_color,
        })

        xyz_lines.push({
            xyz0: base_points[pairs[i][0]],
            xyz1: base_points[pairs[i][1]],
            color: rgb_color,
        })
        xyz1_lines.push({
            xyz0: base_points[pairs[i][0]],
            xyz1: base_points[pairs[i][1]],
            color: "rgba(0, 0, 0, 0.2)",
        })
        xyy_lines.push(base);
        xyy1_lines.push(base);

        rgb_lines.push({
            xyz0: base_points[pairs[i][0]],
            xyz1: base_points[pairs[i][1]],
            color: small_color,
        })

        xyz_lines.push({
            xyz0: mat3_mul_vec(xyz_to_cie_rgb, base_points[pairs[i][0]]),
            xyz1: mat3_mul_vec(xyz_to_cie_rgb, base_points[pairs[i][1]]),
            color: "rgba(0, 0, 0, 0.2)",
        })
    }



    for (var i = 1; i < cie_xs.length; i++) {

        var rgb0 = mat3_mul_vec(xyz_to_cie_rgb, [cie_xs[i - 1], cie_ys[i - 1], cie_zs[i - 1]]);
        var rgb1 = mat3_mul_vec(xyz_to_cie_rgb, [cie_xs[i], cie_ys[i], cie_zs[i]]);

        rgb_lines.push({
            xyz0: [rgb0[0], rgb0[1], rgb0[2]],
            xyz1: [rgb1[0], rgb1[1], rgb1[2]],
            color: rgb_color_string(srgb_callback(mat3_mul_vec(pcs_to_srgb, [cie_xs[i], cie_ys[i], cie_zs[i]])))
        });


        xyz_lines.push({
            xyz0: [rgb0[0], rgb0[1], rgb0[2]],
            xyz1: [rgb1[0], rgb1[1], rgb1[2]],
            color: rgb_color_string(srgb_callback(mat3_mul_vec(pcs_to_srgb, [cie_xs[i], cie_ys[i], cie_zs[i]])))
        });

        xyz1_lines.push({
            xyz0: [cie_xs[i - 1], cie_ys[i - 1], cie_zs[i - 1]],
            xyz1: [cie_xs[i], cie_ys[i], cie_zs[i]],
            color: rgb_color_string(srgb_callback(mat3_mul_vec(pcs_to_srgb, [cie_xs[i], cie_ys[i], cie_zs[i]])))
        });

        xyy_lines.push({
            xyz0: [cie_xs[i - 1], cie_ys[i - 1], cie_zs[i - 1]],
            xyz1: [cie_xs[i], cie_ys[i], cie_zs[i]],
            color: rgb_color_string(srgb_callback(mat3_mul_vec(pcs_to_srgb, [cie_xs[i], cie_ys[i], cie_zs[i]])), 0.3)
        });

        var scale0 = 1 / (cie_xs[i] + cie_ys[i] + cie_zs[i]);
        var scale1 = 1 / (cie_xs[i - 1] + cie_ys[i - 1] + cie_zs[i - 1]);

        xyy_lines.push({
            xyz0: [cie_xs[i] * scale0, cie_ys[i] * scale0, cie_zs[i] * scale0],
            xyz1: [cie_xs[i - 1] * scale1, cie_ys[i - 1] * scale1, cie_zs[i - 1] * scale1],
            color: rgb_color_string(srgb_callback(mat3_mul_vec(pcs_to_srgb, [cie_xs[i], cie_ys[i], cie_zs[i]])), 0.75)
        });

        xyy1_lines.push({
            xyz0: [cie_xs[i] * scale0, cie_ys[i] * scale0, cie_zs[i] * scale0],
            xyz1: [cie_xs[i - 1] * scale1, cie_ys[i - 1] * scale1, cie_zs[i - 1] * scale1],
            color: rgb_color_string(srgb_callback(mat3_mul_vec(pcs_to_srgb, [cie_xs[i], cie_ys[i], cie_zs[i]])), 0.25)
        });


        xyy1_lines.push({
            xyz0: [cie_xs[i] * scale0, cie_ys[i] * scale0, 0],
            xyz1: [cie_xs[i - 1] * scale1, cie_ys[i - 1] * scale1, 0],
            color: rgb_color_string(srgb_callback(mat3_mul_vec(pcs_to_srgb, [cie_xs[i], cie_ys[i], cie_zs[i]])), 1.0)
        });
    }

    for (var i = 0; i < cie_xs.length; i++) {

        var scale = 1 / (cie_xs[i] + cie_ys[i] + cie_zs[i]);
        xyy_lines.push({
            xyz0: [cie_xs[i] * scale, cie_ys[i] * scale, cie_zs[i] * scale],
            xyz1: [cie_xs[i], cie_ys[i], cie_zs[i]],
            color: rgb_color_string(srgb_callback(mat3_mul_vec(pcs_to_srgb, [cie_xs[i], cie_ys[i], cie_zs[i]])), 0.15)
        });

        xyy1_lines.push({
            xyz0: [cie_xs[i] * scale, cie_ys[i] * scale, cie_zs[i] * scale],
            xyz1: [cie_xs[i] * scale, cie_ys[i] * scale, 0],
            color: rgb_color_string(srgb_callback(mat3_mul_vec(pcs_to_srgb, [cie_xs[i], cie_ys[i], cie_zs[i]])), 0.15)
        });
    }

    xyy_lines.push({
        xyz0: base_points[1].slice(),
        xyz1: base_points[2].slice(),
        color: "rgba(0, 0, 0, 0.3)",
    });

    xyy_lines.push({
        xyz0: base_points[1].slice(),
        xyz1: base_points[4].slice(),
        color: "rgba(0, 0, 0, 0.3)",
    });

    xyy_lines.push({
        xyz0: base_points[2].slice(),
        xyz1: base_points[4].slice(),
        color: "rgba(0, 0, 0, 0.3)",
    });

    xyy1_lines.push({
        xyz0: base_points[1].slice(),
        xyz1: base_points[2].slice(),
        color: "rgba(0, 0, 0, 0.3)",
    });

    xyy1_lines.push({
        xyz0: base_points[1].slice(),
        xyz1: base_points[4].slice(),
        color: "rgba(0, 0, 0, 0.3)",
    });

    xyy1_lines.push({
        xyz0: base_points[2].slice(),
        xyz1: base_points[4].slice(),
        color: "rgba(0, 0, 0, 0.3)",
    });

    var narrow_labels = [
        {
            text: "R",
            decoration: "underline",
            color: red,
            xyz: mat3_mul_vec(funky_to_srgb_matrix, [1.1, 0, 0]),
        },
        {
            text: "G",
            decoration: "underline",
            color: green,
            xyz: mat3_mul_vec(funky_to_srgb_matrix, [0, 1.1, 0]),
        },
        {
            text: "B",
            decoration: "underline",
            color: blue,
            xyz: mat3_mul_vec(funky_to_srgb_matrix, [0, 0, 1.1]),
        },
        {
            text: "R",
            decoration: "overline",
            color: red_a,
            xyz: [1.1, 0, 0],
        },
        {
            text: "G",
            decoration: "overline",
            color: green_a,
            xyz: [0, 1.1, 0],
        },
        {
            text: "B",
            decoration: "overline",
            color: blue_a,
            xyz: [0, 0, 1.1],
        },
    ]

    var wide_labels = [
        {
            text: "R",
            decoration: "overline",
            color: "#E74C3C",
            xyz: mat3_mul_vec(srgb_to_funky_matrix, [1.1, 0, 0]),
        },
        {
            text: "G",
            decoration: "overline",
            color: "#35C25B",
            xyz: mat3_mul_vec(srgb_to_funky_matrix, [0, 1.1, 0]),
        },
        {
            text: "B",
            decoration: "overline",
            color: "#5D76E8",
            xyz: mat3_mul_vec(srgb_to_funky_matrix, [0, 0, 1.1]),
        },
        {
            text: "R",
            decoration: "underline",
            color: red_a,
            xyz: [1.1, 0, 0],
        },
        {
            text: "G",
            decoration: "underline",
            color: green_a,
            xyz: [0, 1.1, 0],
        },
        {
            text: "B",
            decoration: "underline",
            color: blue_a,
            xyz: [0, 0, 1.1],
        },
    ]

    var cie_rgb_labels = [
        {
            text: "R",
            decoration: "cie",
            color: red,
            xyz: [1.1, 0, 0],
        },
        {
            text: "G",
            decoration: "cie",
            color: green,
            xyz: [0, 1.1, 0],
        },
        {
            text: "B",
            decoration: "cie",
            color: blue,
            xyz: [0, 0, 1.1],
        }
    ]

    var rgb_xyz_labels = [
        {
            text: "R",
            decoration: "cie",
            color: red_a,
            xyz: [1.1, 0, 0],
        },
        {
            text: "G",
            decoration: "cie",
            color: green_a,
            xyz: [0, 1.1, 0],
        },
        {
            text: "B",
            decoration: "cie",
            color: blue_a,
            xyz: [0, 0, 1.1],
        },
        {
            text: "X",
            color: "rgba(0, 0, 0, 0.3)",
            xyz: mat3_mul_vec(xyz_to_cie_rgb, [1.2, 0, 0]),
        },
        {
            text: "Y",
            color: "rgba(0, 0, 0, 0.3)",
            xyz: mat3_mul_vec(xyz_to_cie_rgb, [0, 1.3, 0]),
        },
        {
            text: "Z",
            color: "rgba(0, 0, 0, 0.3)",
            xyz: mat3_mul_vec(xyz_to_cie_rgb, [0, 0, 1.5]),
        }
    ]

    var xyz_labels = [
        {
            text: "X",
            color: "rgba(0, 0, 0, 0.3)",
            xyz: [1.1, 0, 0],
        },
        {
            text: "Y",
            color: "rgba(0, 0, 0, 0.3)",
            xyz: [0, 1.1, 0],
        },
        {
            text: "Z",
            color: "rgba(0, 0, 0, 0.3)",
            xyz: [0, 0, 1.1],
        }
    ]

    var white_labels = [
        {
            text: "R",
            decoration: "underline",
            color: "#E74C3C",
            xyz: mat3_mul_vec(white_to_srgb_matrix, [1.1, 0, 0]),
        },
        {
            text: "G",
            decoration: "underline",
            color: "#35C25B",
            xyz: mat3_mul_vec(white_to_srgb_matrix, [0, 1.1, 0]),
        },
        {
            text: "B",
            decoration: "underline",
            color: "#5D76E8",
            xyz: mat3_mul_vec(white_to_srgb_matrix, [0, 0, 1.1]),
        },
        {
            text: "R",
            decoration: "overline",
            color: red_a,
            xyz: [1.1, 0, 0],
        },
        {
            text: "G",
            decoration: "overline",
            color: green_a,
            xyz: [0, 1.25, 0],
        },
        {
            text: "B",
            decoration: "overline",
            color: blue_a,
            xyz: [0, 0, 1.1],
        },
    ]


    plot_narrow = new Color3DPlot(plot_narrow_container, narrow_lines, 0.25, narrow_labels);
    plot_wide = new Color3DPlot(plot_wide_container, wide_lines, 0.15, wide_labels);
    var plot_cie_rgb_gamut = new Color3DPlot(document.getElementById("color_plot_cie_rgb_gamut_container"), rgb_lines, 0.2, cie_rgb_labels);
    var plot_cie_xyz_gamut = new Color3DPlot(document.getElementById("color_plot_cie_xyz_gamut_container"), xyz_lines, 0.2, rgb_xyz_labels);
    var plot_cie_xyz1_gamut = new Color3DPlot(document.getElementById("color_plot_cie_xyz1_gamut_container"), xyz1_lines, 0.2, xyz_labels);
    var plot_cie_xyy_gamut = new Color3DPlot(document.getElementById("color_plot_cie_xyy_gamut_container"), xyy_lines, 0.2, xyz_labels);
    var plot_cie_xyy1_gamut = new Color3DPlot(document.getElementById("color_plot_cie_xyy1_gamut_container"), xyy1_lines, 0.2, xyz_labels);


    new Color3DPlot(document.getElementById("color_plot_white_container"), white_lines, 0.2, white_labels);


    function set_narrow_dot(rgb) {
        plot_narrow.set_dot(mat3_mul_vec(funky_to_srgb_matrix, rgb), rgb_color_string(funky_callback(rgb)));
        return [0, 0, 0];
    }

    cube_matcher = new ColorMatcher(document.getElementById("color_rgb_cube_slider_container"), quadratic_callback, set_narrow_dot, "just_sliders");
});

function match_base_white() {
    plain_srgb_matcher.set_percentages([1, 1, 1]);
}

function match_base_yellow() {
    plain_srgb_matcher.set_percentages([0.95, 0.95, 0.05]);
}

function match_fixed_color() {
    funky_yellow_matcher.set_percentages(mat3_mul_vec(funky_to_srgb_matrix, fixed_color));
}

function match_weak_color() {
    weak_matcher.set_percentages(color);
}

function match_high_color() {
    high_gamut_matcher.set_percentages(color);
}

function match_red() {
    funky_red_matcher.set_percentages(mat3_mul_vec(funky_to_srgb_matrix, [1, 0, 0]));
}

function match_green() {
    funky_green_matcher.set_percentages(mat3_mul_vec(funky_to_srgb_matrix, [0, 1, 0]));
}

function match_blue() {
    funky_blue_matcher.set_percentages(mat3_mul_vec(funky_to_srgb_matrix, [0, 0, 1]));
}

function match_cube() {
    cube_matcher.set_percentages([0, 0]);
}



function match_red_xr() {
    inverse_funky_red_xr_matcher.set_percentages(mat3_mul_vec(srgb_to_funky_matrix, [1, 0, 0]));
}

function match_white_point_white() {
    white_point_matcher.set_percentages([1, 1, 1]);
}

function color_show_black() {
    var imgs = document.getElementsByClassName("img_border");
    for (i = 0; i < imgs.length; i++) {
        imgs[i].classList.add("color_dark");
    }

    document.body.classList.add("color_dark");

    document.getElementById("color_normal_background").classList.remove("hidden");
    document.getElementById("color_black_background").classList.add("hidden");
}


function color_show_white() {
    var imgs = document.getElementsByClassName("img_border");
    for (i = 0; i < imgs.length; i++) {
        imgs[i].classList.remove("color_dark");
    }

    document.body.classList.remove("color_dark");

    document.getElementById("color_normal_background").classList.add("hidden");
    document.getElementById("color_black_background").classList.remove("hidden");
}

