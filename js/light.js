

let power;
let power_slider;

let radian;
let radian_slider;

let steradian_sphere;
let steradian_sphere_slider;

let shadow_hemi;
let shadow_hemi_slider;

let rough_inv;
let rough_inv_slider;

let mirror;

let bounce;
let color_rgb;
let rgb0;
let rgb1;
let rgb2;

let casey_mode;

(function () {
    let scale = Math.min(2, window.devicePixelRatio || 1);

    let fi = 0.5 * (1 + Math.sqrt(5));
    let a = (2.0 - fi) * 2.0 * Math.PI;

    let prev_car_pos = 0.0;

    let rand_vertices = [];
    let rand_vertices_small = [];
    let disc_vertices = [];
    let plane_vertices = [];

    (function () {

        let n_rand_vertices = 512;
        let n_rand_vertices_small = 128;

        function shuffle(a) {
            var j, x, i;
            for (i = a.length - 1; i > 0; i--) {
                j = Math.floor(Math.random() * (i + 1));
                x = a[i];
                a[i] = a[j];
                a[j] = x;
            }
            return a;
        }

        /* https://bduvenhage.me/geometry/2019/07/31/generating-equidistant-vectors.html */
        for (let i = 1; i < n_rand_vertices; i++) {
            /* Jiggle a little so that it avoids grid-like bands of rays. */
            let lat = Math.asin(-1 + 2 * i / n_rand_vertices) + Math.random() * 0.05;
            let lon = a * i + Math.random() * 0.08;

            let x = Math.cos(lon) * Math.cos(lat);
            let y = Math.sin(lon) * Math.cos(lat);
            let z = Math.sin(lat);

            rand_vertices.push([x, y, z]);
        }

        for (let i = 1; i < n_rand_vertices_small; i++) {
            /* Jiggle a little so that it avoids grid-like bands of rays. */
            let lat = Math.asin(-1 + 2 * i / n_rand_vertices_small) + Math.random() * 0.05;
            let lon = a * i + Math.random() * 0.08;

            let x = Math.cos(lon) * Math.cos(lat);
            let y = Math.sin(lon) * Math.cos(lat);
            let z = Math.sin(lat);

            rand_vertices_small.push([x, y, z]);
        }

        rand_vertices = shuffle(rand_vertices);

        for (let i = 1; i < 512; i++) {
            /* Jiggle a little so that it avoids grid-like bands of rays. */
            let lat = Math.asin(-1 + 2 * i / (512 * 950)) + (Math.random() - 0.5) * 0.0008;
            let lon = a * i + Math.random() * 0.1;

            let x = Math.cos(lon) * Math.cos(lat);
            let y = Math.sin(lon) * Math.cos(lat);
            let z = Math.sin(lat);

            plane_vertices.push([x, y, z]);
        }

    })();

    function engamma(x) {
        return x < 0.0031308 ? x * 12.92 : (1.055 * Math.pow(x, 1.0 / 2.4) - 0.055);

    }

    function draw_car_top(ctx, casey) {
        ctx.save();
        ctx.strokeStyle = "rgba(0,0,0,0)";
        ctx.scale(0.25641025641025644, 0.25641025641025644);
        ctx.translate(-156, -338);

        ctx.save();
        ctx.fillStyle = "rgba(0,0,0,0)";
        ctx.save();
        ctx.fillStyle = "rgba(0,0,0,0)";
        ctx.translate(1, 0);
        ctx.save();
        ctx.fillStyle = casey ? "#ddd" : "#1243A5";
        ctx.beginPath();
        ctx.moveTo(155.413239, 0);
        ctx.bezierCurveTo(181.584006, 0.0696340713, 206.676788, 3.09196444, 228.918138, 11);
        ctx.bezierCurveTo(251.418138, 19, 270.918138, 35.5, 273.918138, 40);
        ctx.bezierCurveTo(276.918138, 44.5, 283.418138, 65.5, 283.418138, 73);
        ctx.bezierCurveTo(284.467703, 77.693689, 284.967703, 82.8603557, 284.918138, 88.5);
        ctx.bezierCurveTo(284.661657, 117.683186, 283.855611, 147.33935, 282.5, 177.468492);
        ctx.lineTo(282.5, 177.468492);
        ctx.lineTo(283.5, 219.968492);
        ctx.bezierCurveTo(284.445426, 298.696963, 284.918138, 357.540799, 284.918138, 396.5);
        ctx.bezierCurveTo(284.918138, 454.938802, 284.474513, 443.997951, 284.5, 491.468492);
        ctx.bezierCurveTo(284.5, 507.468492, 286.163723, 530.438435, 285, 548.968492);
        ctx.bezierCurveTo(284.224184, 561.321864, 282.03023, 578.499033, 278.418138, 600.5);
        ctx.bezierCurveTo(273.751472, 624.5, 270.584805, 638.166667, 268.918138, 641.5);
        ctx.bezierCurveTo(266.418138, 646.5, 245.752123, 663.555339, 223.418138, 669);
        ctx.bezierCurveTo(208.528815, 672.629774, 185.556103, 674.952605, 154.5, 675.968492);
        ctx.lineTo(155.413, 675.938);
        ctx.lineTo(155.413239, 675.968492);
        ctx.lineTo(154.956, 675.953);
        ctx.lineTo(154.5, 675.968492);
        ctx.lineTo(154.5, 675.938);
        ctx.lineTo(154.357639, 675.933353);
        ctx.bezierCurveTo(123.836073, 674.899645, 101.215227, 672.588527, 86.4951005, 669);
        ctx.bezierCurveTo(64.1611161, 663.555339, 43.4951005, 646.5, 40.9951005, 641.5);
        ctx.bezierCurveTo(39.3284338, 638.166667, 36.1617671, 624.5, 31.4951005, 600.5);
        ctx.bezierCurveTo(27.8830083, 578.499033, 25.6890544, 561.321864, 24.9132388, 548.968492);
        ctx.bezierCurveTo(23.7495154, 530.438435, 25.4132388, 507.468492, 25.4132388, 491.468492);
        ctx.bezierCurveTo(25.4382164, 444.947362, 25.0126579, 454.524533, 24.9956255, 399.924095);
        ctx.lineTo(24.9956677, 394.138586);
        ctx.bezierCurveTo(25.0141981, 355.179091, 25.4867217, 297.122393, 26.4132388, 219.968492);
        ctx.lineTo(27.4132388, 177.468492);
        ctx.bezierCurveTo(26.0576277, 147.33935, 25.2515816, 117.683186, 24.9951005, 88.5);
        ctx.bezierCurveTo(24.9455355, 82.8603557, 25.4455355, 77.693689, 26.4951005, 73);
        ctx.bezierCurveTo(26.4951005, 65.5, 32.9951005, 44.5, 35.9951005, 40);
        ctx.bezierCurveTo(38.9951005, 35.5, 58.4951005, 19, 80.9951005, 11);
        ctx.bezierCurveTo(103.236649, 3.09189386, 128.329681, 0.0695801232, 154.500475, 0.00119053655);
        ctx.bezierCurveTo(154.652149, 0, 154.804263, 0.0000988938539, 154.95634, 0.000297060093);
        ctx.lineTo(155.413239, 0);
        ctx.lineTo(155.413239, 0);
        ctx.closePath();
        ctx.fill("evenodd");
        ctx.stroke();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = "#030303";
        ctx.fillStyle = "rgba(3, 3, 3, 0.801)";
        ctx.beginPath();
        ctx.moveTo(64.1791468, 297.531508);
        ctx.lineTo(42.5818617, 214.531508);
        ctx.bezierCurveTo(53.6316355, 194.531508, 91.7149321, 179.031508, 155, 179.031508);
        ctx.lineTo(156.89099, 179.036147);
        ctx.bezierCurveTo(219.04403, 179.341958, 256.478862, 194.731508, 267.418138, 214.531508);
        ctx.lineTo(267.418138, 214.531508);
        ctx.lineTo(245.820853, 297.531508);
        ctx.bezierCurveTo(216.413889, 290.198175, 186.140271, 286.531508, 155, 286.531508);
        ctx.lineTo(155, 286.531508);
        ctx.bezierCurveTo(123.859729, 286.531508, 93.5861108, 290.198175, 64.1791468, 297.531508);
        ctx.closePath();
        ctx.moveTo(49.0818617, 545.531508);
        ctx.bezierCurveTo(65.5818617, 466.531508, 60.0818617, 385.531508, 58.5818617, 315.031508);
        ctx.bezierCurveTo(55.915195, 297.698175, 48.915195, 266.031508, 37.5818617, 220.031508);
        ctx.lineTo(37.5818617, 409.531508);
        ctx.lineTo(39.0818617, 528.531508);
        ctx.bezierCurveTo(42.8615984, 563.871943, 46.1949318, 569.53861, 49.0818617, 545.531508);
        ctx.closePath();
        ctx.moveTo(260.588435, 545.5);
        ctx.bezierCurveTo(244.088435, 466.5, 249.588435, 385.5, 251.088435, 315);
        ctx.bezierCurveTo(253.755101, 297.666667, 260.755101, 266, 272.088435, 220);
        ctx.lineTo(272.088435, 409.5);
        ctx.lineTo(270.588435, 528.5);
        ctx.bezierCurveTo(266.808698, 563.840435, 263.475365, 569.507102, 260.588435, 545.5);
        ctx.closePath();
        ctx.moveTo(153.54325, 615.996436);
        ctx.bezierCurveTo(120.553046, 615.834865, 89.565916, 610.179889, 60.5818617, 599.031508);
        ctx.lineTo(60.5818617, 599.031508);
        ctx.lineTo(69.2196995, 512.531508);
        ctx.bezierCurveTo(93.2101701, 521.510503, 121.803604, 526, 155, 526);
        ctx.lineTo(155, 526);
        ctx.bezierCurveTo(188.196396, 525.312328, 216.78983, 520.822831, 240.7803, 512.531508);
        ctx.lineTo(249.418138, 599.031508);
        ctx.bezierCurveTo(220.007848, 610.343836, 188.535135, 616, 155, 616);
        ctx.closePath();
        ctx.fill("evenodd");
        ctx.stroke();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = "#000";
        ctx.beginPath();
        ctx.moveTo(38, 239);
        ctx.lineTo(30, 242);
        ctx.lineTo(30.5, 251.5);
        ctx.lineTo(38, 254.5);
        ctx.lineTo(38, 239);
        ctx.closePath();
        ctx.fill("evenodd");
        ctx.stroke();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = "#000";
        ctx.transform(-1, 0, 0, 1, 550, 0);
        ctx.beginPath();
        ctx.moveTo(279, 239);
        ctx.lineTo(271, 242);
        ctx.lineTo(271.5, 251.5);
        ctx.lineTo(279, 254.5);
        ctx.lineTo(279, 239);
        ctx.closePath();
        ctx.fill("evenodd");
        ctx.stroke();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = casey ? "#ddd" : "#1243A5";
        ctx.strokeStyle = "#000";
        ctx.strokeStyle = "rgba(0, 0, 0, 0.237)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(33.5, 241.5);
        ctx.bezierCurveTo(34.5, 242.5, 34, 246.333333, 34, 249);
        ctx.bezierCurveTo(34, 250.777778, 33.5, 253.111111, 32.5, 256);
        ctx.lineTo(0.5, 265.5);
        ctx.bezierCurveTo(0.5, 261.833333, 0.833333333, 259.166667, 1.5, 257.5);
        ctx.bezierCurveTo(2.62191577, 254.695211, 4.55968578, 251.866492, 7.5, 250);
        ctx.bezierCurveTo(11.7551385, 247.298866, 19.4113334, 244.179723, 30.4685849, 240.642572);
        ctx.bezierCurveTo(31.1334275, 240.429892, 32.5, 240.5, 33.5, 241.5);
        ctx.closePath();
        ctx.moveTo(276.5, 241.5);
        ctx.bezierCurveTo(277.5, 240.5, 278.866573, 240.429892, 279.531415, 240.642572);
        ctx.bezierCurveTo(290.588667, 244.179723, 298.244862, 247.298866, 302.5, 250);
        ctx.bezierCurveTo(305.440314, 251.866492, 307.378084, 254.695211, 308.5, 257.5);
        ctx.bezierCurveTo(309.166667, 259.166667, 309.5, 261.833333, 309.5, 265.5);
        ctx.lineTo(309.5, 265.5);
        ctx.lineTo(277.5, 256);
        ctx.bezierCurveTo(276.5, 253.111111, 276, 250.777778, 276, 249);
        ctx.bezierCurveTo(276, 246.333333, 275.5, 242.5, 276.5, 241.5);
        ctx.closePath();
        ctx.fill("evenodd");
        ctx.stroke();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = "#AE0000";
        ctx.strokeStyle = "#000";
        ctx.strokeStyle = "rgba(0, 0, 0, 0.42)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(39.5, 612.5);
        ctx.bezierCurveTo(40.1666667, 612.5, 40.8333333, 615, 41.5, 620);
        ctx.bezierCurveTo(42.5, 628.666667, 44, 634.833333, 46, 638.5);
        ctx.bezierCurveTo(48, 642.166667, 52.1666667, 646.833333, 58.5, 652.5);
        ctx.bezierCurveTo(50.5, 648.833333, 45.5, 645.833333, 43.5, 643.5);
        ctx.bezierCurveTo(41.5, 641.166667, 39.5, 636, 37.5, 628);
        ctx.lineTo(37.5, 618);
        ctx.bezierCurveTo(38.1666667, 614.333333, 38.8333333, 612.5, 39.5, 612.5);
        ctx.closePath();
        ctx.moveTo(269.5, 612.5);
        ctx.bezierCurveTo(270.166667, 612.5, 270.833333, 614.333333, 271.5, 618);
        ctx.lineTo(271.5, 618);
        ctx.lineTo(271.5, 628);
        ctx.bezierCurveTo(269.5, 636, 267.5, 641.166667, 265.5, 643.5);
        ctx.bezierCurveTo(263.5, 645.833333, 258.5, 648.833333, 250.5, 652.5);
        ctx.bezierCurveTo(256.833333, 646.833333, 261, 642.166667, 263, 638.5);
        ctx.bezierCurveTo(265, 634.833333, 266.5, 628.666667, 267.5, 620);
        ctx.bezierCurveTo(268.166667, 615, 268.833333, 612.5, 269.5, 612.5);
        ctx.closePath();
        ctx.fill("evenodd");
        ctx.stroke();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = "#181818";
        ctx.strokeStyle = "#000";
        ctx.strokeStyle = "rgba(0, 0, 0, 0.26)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(97.5, 8.81854455);
        ctx.bezierCurveTo(108.978412, 4.99240719, 152, 1.31854455, 154.5, 3.81854455);
        ctx.bezierCurveTo(156.166667, 5.48521121, 153.5, 6.98521121, 146.5, 8.31854455);
        ctx.lineTo(146.5, 8.31854455);
        ctx.lineTo(93, 13.8185445);
        ctx.bezierCurveTo(93, 11.4852112, 94.5, 9.81854455, 97.5, 8.81854455);
        ctx.closePath();
        ctx.moveTo(213.480769, 8.81854455);
        ctx.bezierCurveTo(216.480769, 9.81854455, 217.980769, 11.4852112, 217.980769, 13.8185445);
        ctx.lineTo(164.480769, 8.31854455);
        ctx.bezierCurveTo(157.480769, 6.98521121, 154.814103, 5.48521121, 156.480769, 3.81854455);
        ctx.bezierCurveTo(158.980769, 1.31854455, 202.002357, 4.99240719, 213.480769, 8.81854455);
        ctx.closePath();
        ctx.fill("evenodd");
        ctx.stroke();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = "#AFAFAF";
        ctx.fillStyle = "rgba(175, 175, 175, 0.534)";
        ctx.strokeStyle = "#000";
        ctx.strokeStyle = "rgba(0, 0, 0, 0.2)";
        ctx.beginPath();
        ctx.moveTo(80, 18);
        ctx.bezierCurveTo(57, 32.5, 45, 43, 43, 45.5);
        ctx.bezierCurveTo(41.6666667, 47.1666667, 37.6666667, 55.5, 31, 70.5);
        ctx.bezierCurveTo(31.6666667, 63.8333333, 32.6666667, 58.8333333, 34, 55.5);
        ctx.bezierCurveTo(36, 50.5, 43, 41, 48.5, 37);
        ctx.bezierCurveTo(54, 33, 67.5, 24, 80, 18);
        ctx.closePath();
        ctx.moveTo(230, 18);
        ctx.bezierCurveTo(242.5, 24, 256, 33, 261.5, 37);
        ctx.bezierCurveTo(267, 41, 274, 50.5, 276, 55.5);
        ctx.bezierCurveTo(277.333333, 58.8333333, 278.333333, 63.8333333, 279, 70.5);
        ctx.bezierCurveTo(272.333333, 55.5, 268.333333, 47.1666667, 267, 45.5);
        ctx.bezierCurveTo(265, 43, 253, 32.5, 230, 18);
        ctx.closePath();
        ctx.fill("evenodd");
        ctx.stroke();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = "rgba(0,0,0,0)";
        ctx.strokeStyle = "#2657BA";
        ctx.lineWidth = 3;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(26.5, 384);
        ctx.bezierCurveTo(25.5, 390.833333, 25, 396.666667, 25, 401.5);
        ctx.bezierCurveTo(25, 406.333333, 25.5, 410.166667, 26.5, 413);
        ctx.moveTo(29.5, 525);
        ctx.bezierCurveTo(28.5, 532.333333, 28, 538.5, 28, 543.5);
        ctx.bezierCurveTo(28, 548.5, 28.8333333, 552.333333, 30.5, 555);
        ctx.fill("evenodd");
        ctx.stroke();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = "rgba(0,0,0,0)";
        ctx.strokeStyle = "#2657BA";
        ctx.lineWidth = 3;
        ctx.lineCap = "round";
        ctx.transform(-1, 0, 0, 1, 569.5, 0);
        ctx.beginPath();
        ctx.moveTo(285.5, 384);
        ctx.bezierCurveTo(284.5, 390.833333, 284, 396.666667, 284, 401.5);
        ctx.bezierCurveTo(284, 406.333333, 284.5, 410.166667, 285.5, 413);
        ctx.fill("evenodd");
        ctx.stroke();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = "rgba(0,0,0,0)";
        ctx.strokeStyle = "#2657BA";
        ctx.lineWidth = 3;
        ctx.lineCap = "round";
        ctx.transform(-1, 0, 0, 1, 560.5, 0);
        ctx.beginPath();
        ctx.moveTo(280.5, 525);
        ctx.bezierCurveTo(279.5, 532.333333, 279, 538.5, 279, 543.5);
        ctx.bezierCurveTo(279, 548.5, 279.833333, 552.333333, 281.5, 555);
        ctx.fill("evenodd");
        ctx.stroke();
        ctx.restore();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = "rgba(0,0,0,0)";
        ctx.strokeStyle = "#000";
        ctx.strokeStyle = "rgba(0, 0, 0, 0.08)";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.translate(0, -45);
        ctx.moveTo(46.5, 263.5);
        ctx.bezierCurveTo(46.5, 263.5, 49, 200.5, 53.5, 170);
        ctx.bezierCurveTo(58, 139.5, 66.5, 99.5, 94, 71);
        ctx.stroke();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = "rgba(0,0,0,0)";
        ctx.strokeStyle = "#000";
        ctx.strokeStyle = "rgba(0, 0, 0, 0.08)";
        ctx.lineWidth = 4;
        ctx.transform(-1, 0, 0, 1, 482.5, 0);
        ctx.beginPath();
        ctx.translate(0, -45);
        ctx.moveTo(217.5, 263.5);
        ctx.bezierCurveTo(217.5, 263.5, 220, 200.5, 224.5, 170);
        ctx.bezierCurveTo(229, 139.5, 237.5, 99.5, 265, 71);
        ctx.stroke();
        ctx.restore();
        ctx.restore();
        ctx.restore();
    }

    function draw_car_back(ctx, flash, casey) {
        ctx.save();
        ctx.strokeStyle = "rgba(0,0,0,0)";
        ctx.scale(0.29850746268656714, 0.29850746268656714);
        ctx.translate(-136.5, -101);
        ctx.save();
        ctx.fillStyle = "rgba(0,0,0,0)";
        ctx.save();
        ctx.fillStyle = "rgba(0,0,0,0)";
        ctx.translate(5, 0);
        ctx.save();
        ctx.fillStyle = "#212121";
        ctx.beginPath();
        ctx.moveTo(39, 141.5);
        ctx.lineTo(40, 165.5);
        ctx.bezierCurveTo(40.3333333, 183.5, 40, 194, 39, 197);
        ctx.bezierCurveTo(37.5, 201.5, 34, 201.5, 31.5, 201.5);
        ctx.lineTo(31.5, 201.5);
        ctx.lineTo(11, 201.5);
        ctx.bezierCurveTo(7.5, 201.5, 6.73002942, 200.755839, 4.5, 197);
        ctx.bezierCurveTo(3.01331372, 194.496107, 2.01331372, 190.662774, 1.5, 185.5);
        ctx.lineTo(1.5, 185.5);
        ctx.lineTo(0, 143);
        ctx.lineTo(39, 141.5);
        ctx.closePath();
        ctx.moveTo(224, 141.5);
        ctx.lineTo(263, 143);
        ctx.lineTo(261.5, 185.5);
        ctx.bezierCurveTo(260.986686, 190.662774, 259.986686, 194.496107, 258.5, 197);
        ctx.bezierCurveTo(256.269971, 200.755839, 255.5, 201.5, 252, 201.5);
        ctx.lineTo(231.5, 201.5);
        ctx.lineTo(231.5, 201.5);
        ctx.bezierCurveTo(229, 201.5, 225.5, 201.5, 224, 197);
        ctx.bezierCurveTo(223, 194, 222.666667, 183.5, 223, 165.5);
        ctx.lineTo(224, 141.5);
        ctx.closePath();
        ctx.fill("evenodd");
        ctx.stroke();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = "#000";
        ctx.fillStyle = casey ? "#ddd" : "#1243A5";
        ctx.lineWidth = 3;

        ctx.beginPath();
        ctx.moveTo(15.5, 48);
        ctx.bezierCurveTo(15.5, 44.8272143, 17.6666667, 43.3272143, 22, 43.5);
        ctx.lineTo(22, 43.5);
        ctx.lineTo(37, 43.5);
        ctx.lineTo(29.5, 60.5);
        ctx.bezierCurveTo(24.5, 59.5, 20.8333333, 58.3333333, 18.5, 57);
        ctx.bezierCurveTo(17, 55.5, 15.5, 52.7591785, 15.5, 48);
        ctx.closePath();
        ctx.moveTo(247.5, 48);
        ctx.bezierCurveTo(247.5, 52.7591785, 246, 55.5, 244.5, 57);
        ctx.bezierCurveTo(242.166667, 58.3333333, 238.5, 59.5, 233.5, 60.5);
        ctx.lineTo(226, 43.5);
        ctx.lineTo(241, 43.5);
        ctx.bezierCurveTo(245.333333, 43.3272143, 247.5, 44.8272143, 247.5, 48);
        ctx.closePath();
        ctx.fill("evenodd");
        ctx.stroke();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = casey ? "#ddd" : "#1243A5";

        ctx.beginPath();
        ctx.moveTo(26.1, 179.041667);
        ctx.bezierCurveTo(14.1, 179.041667, 7.43333333, 178.041667, 6.1, 176.041667);
        ctx.bezierCurveTo(4.76666667, 174.041667, 2.76666667, 161.708333, 0.1, 139.041667);
        ctx.bezierCurveTo(-0.233333333, 116.708333, 0.266666667, 103.541667, 1.6, 99.5416667);
        ctx.bezierCurveTo(3.6, 93.5416667, 7.6, 89.5416667, 9.6, 85.5416667);
        ctx.bezierCurveTo(11.6, 81.5416667, 10.9547379, 77.4190503, 14.1, 72.0416667);
        ctx.bezierCurveTo(17.2452621, 66.6642831, 23.1, 62.0416667, 26.1, 59.0416667);
        ctx.bezierCurveTo(37.1, 32.0416667, 48.1, 10.5416667, 59.1, 5.04166667);
        ctx.bezierCurveTo(66.4333333, 1.375, 90.7666667, -0.291666667, 132.1, 0.0416666667);
        ctx.lineTo(131.5, 0.037);
        ctx.lineTo(132.1349, 0.0322666667);
        ctx.bezierCurveTo(172.7183, -0.258133333, 196.64, 1.41166667, 203.9, 5.04166667);
        ctx.bezierCurveTo(214.9, 10.5416667, 225.9, 32.0416667, 236.9, 59.0416667);
        ctx.bezierCurveTo(239.9, 62.0416667, 245.754738, 66.6642831, 248.9, 72.0416667);
        ctx.bezierCurveTo(252.045262, 77.4190503, 251.4, 81.5416667, 253.4, 85.5416667);
        ctx.bezierCurveTo(255.4, 89.5416667, 259.4, 93.5416667, 261.4, 99.5416667);
        ctx.bezierCurveTo(262.733333, 103.541667, 263.233333, 116.708333, 262.9, 139.041667);
        ctx.bezierCurveTo(260.233333, 161.708333, 258.233333, 174.041667, 256.9, 176.041667);
        ctx.bezierCurveTo(255.566667, 178.041667, 248.9, 179.041667, 236.9, 179.041667);
        ctx.closePath();
        ctx.fill("evenodd");
        ctx.stroke();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = "#151515";

        ctx.beginPath();
        ctx.moveTo(132.1, 179.041667);
        ctx.lineTo(25.6489273, 179.041884);
        ctx.bezierCurveTo(14.0408258, 179.053082, 11.7429973, 179.485995, 11, 178);
        ctx.bezierCurveTo(10, 176, 11, 162, 13, 160);
        ctx.bezierCurveTo(15, 158, 21, 156.5, 31.5, 156.5);
        ctx.bezierCurveTo(42, 156.5, 67, 155.5, 74, 156.5);
        ctx.bezierCurveTo(81, 157.5, 74, 160.5, 83, 163.5);
        ctx.bezierCurveTo(91.8821483, 166.460716, 108.556154, 165.525503, 131.099562, 165.500503);
        ctx.lineTo(131.1, 165.444444);
        ctx.bezierCurveTo(154.1, 165.444444, 171.1, 166.444444, 180.1, 163.444444);
        ctx.bezierCurveTo(189.1, 160.444444, 182.1, 157.444444, 189.1, 156.444444);
        ctx.bezierCurveTo(196.1, 155.444444, 221.1, 156.444444, 231.6, 156.444444);
        ctx.bezierCurveTo(242.1, 156.444444, 248.1, 157.944444, 250.1, 159.944444);
        ctx.bezierCurveTo(252.1, 161.944444, 253.1, 175.944444, 252.1, 177.944444);
        ctx.bezierCurveTo(251.366528, 179.411388, 249.117837, 179.008312, 237.892964, 178.986963);
        ctx.lineTo(132.099695, 178.986);
        ctx.lineTo(132.1, 179.041667);
        ctx.closePath();
        ctx.fill("evenodd");
        ctx.stroke();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = "#000";
        ctx.fillStyle = "rgba(0, 0, 0, 0.8)";

        ctx.beginPath();
        ctx.moveTo(131.035262, 49.0002965);
        ctx.bezierCurveTo(99.04455, 49.01975, 51.975, 49.985, 49.5, 48.5);
        ctx.bezierCurveTo(47, 47, 48.1050718, 43.1847847, 49.5, 39);
        ctx.bezierCurveTo(52, 31.5, 59, 17, 61.5, 15);
        ctx.bezierCurveTo(64, 13, 69.0402108, 12.924106, 81, 12.5);
        ctx.bezierCurveTo(92.6848515, 12.0856436, 106.355573, 11.5263977, 130.29313, 11.5009042);
        ctx.lineTo(132.70687, 11.5009042);
        ctx.bezierCurveTo(156.644427, 11.5263977, 170.315148, 12.0856436, 182, 12.5);
        ctx.bezierCurveTo(193.959789, 12.924106, 199, 13, 201.5, 15);
        ctx.bezierCurveTo(204, 17, 211, 31.5, 213.5, 39);
        ctx.bezierCurveTo(214.894928, 43.1847847, 216, 47, 213.5, 48.5);
        ctx.bezierCurveTo(211.025, 49.985, 163.95545, 49.01975, 131.964739, 49.0002965);
        ctx.closePath();
        ctx.fill("evenodd");
        ctx.stroke();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = "#0E0E0E";
        ctx.strokeStyle = "#333";
        ctx.lineWidth = 2;

        ctx.beginPath();
        ctx.moveTo(55.5, 166.5);
        ctx.bezierCurveTo(57.5, 166.5, 59.5, 168.166667, 61.5, 171.5);
        ctx.bezierCurveTo(62.5, 174.5, 62.5, 176.666667, 61.5, 178);
        ctx.bezierCurveTo(60.5, 179.333333, 58.5, 179.833333, 55.5, 179.5);
        ctx.lineTo(55.5, 179.5);
        ctx.lineTo(33.5, 179.5);
        ctx.bezierCurveTo(29.1665928, 178.666667, 26.9998891, 177.166667, 26.9998891, 175);
        ctx.bezierCurveTo(26.9998891, 171.75, 28.5, 169.5, 33.5, 168);
        ctx.bezierCurveTo(38.0689655, 166.62931, 50.1530916, 166.511147, 54.4917073, 166.500961);
        ctx.closePath();
        ctx.moveTo(229.5, 168);
        ctx.bezierCurveTo(234.5, 169.5, 236.000111, 171.75, 236.000111, 175);
        ctx.bezierCurveTo(236.000111, 177.166667, 233.833407, 178.666667, 229.5, 179.5);
        ctx.lineTo(207.5, 179.5);
        ctx.bezierCurveTo(204.5, 179.833333, 202.5, 179.333333, 201.5, 178);
        ctx.bezierCurveTo(200.5, 176.666667, 200.5, 174.5, 201.5, 171.5);
        ctx.bezierCurveTo(203.5, 168.166667, 205.5, 166.5, 207.5, 166.5);
        ctx.lineTo(208.508293, 166.500961);
        ctx.bezierCurveTo(212.846908, 166.511147, 224.931034, 166.62931, 229.5, 168);
        ctx.closePath();
        ctx.fill("evenodd");
        ctx.stroke();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = flash ? "#ccc" : "#666";
        ctx.strokeStyle = "#000";
        ctx.strokeStyle = "rgba(0, 0, 0, 0.12)";
        ctx.lineWidth = 2;

        ctx.beginPath();
        ctx.moveTo(18, 78);
        ctx.bezierCurveTo(29.6666667, 79.6666667, 49.5, 81, 77.5, 82);
        ctx.lineTo(77.5, 82);
        ctx.lineTo(76, 90.5);
        ctx.lineTo(73, 94);
        ctx.lineTo(15.5, 92.5);
        ctx.bezierCurveTo(12.8333333, 84.5, 13.6666667, 79.6666667, 18, 78);
        ctx.closePath();
        ctx.moveTo(245, 78);
        ctx.bezierCurveTo(249.333333, 79.6666667, 250.166667, 84.5, 247.5, 92.5);
        ctx.lineTo(190, 94);
        ctx.lineTo(187, 90.5);
        ctx.lineTo(185.5, 82);
        ctx.bezierCurveTo(213.5, 81, 233.333333, 79.6666667, 245, 78);
        ctx.closePath();
        ctx.fill("evenodd");
        ctx.stroke();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = "#AE0000";
        ctx.strokeStyle = "#000";
        ctx.strokeStyle = "rgba(0, 0, 0, 0.212)";
        ctx.lineWidth = 2;

        ctx.beginPath();
        ctx.moveTo(17, 74);
        ctx.bezierCurveTo(20, 74, 19.0789359, 86.9802443, 20, 88.5);
        ctx.bezierCurveTo(20.6140427, 89.5131705, 22.9473761, 90.1798372, 27, 90.5);
        ctx.lineTo(76, 90.5);
        ctx.bezierCurveTo(76, 94.8333333, 74.5, 97, 71.5, 97);
        ctx.bezierCurveTo(60.5, 98.3333333, 43.3333333, 98.3333333, 20, 97);
        ctx.bezierCurveTo(15.3333333, 97, 12.5, 95.8333333, 11.5, 93.5);
        ctx.bezierCurveTo(10, 90, 10.7530492, 83.6236126, 11.5, 80.5);
        ctx.bezierCurveTo(12.2469508, 77.3763874, 14, 74, 17, 74);
        ctx.closePath();
        ctx.moveTo(246, 74);
        ctx.bezierCurveTo(249, 74, 250.753049, 77.3763874, 251.5, 80.5);
        ctx.bezierCurveTo(252.246951, 83.6236126, 253, 90, 251.5, 93.5);
        ctx.bezierCurveTo(250.5, 95.8333333, 247.666667, 97, 243, 97);
        ctx.bezierCurveTo(219.666667, 98.3333333, 202.5, 98.3333333, 191.5, 97);
        ctx.bezierCurveTo(188.5, 97, 187, 94.8333333, 187, 90.5);
        ctx.lineTo(187, 90.5);
        ctx.lineTo(236, 90.5);
        ctx.bezierCurveTo(240.052624, 90.1798372, 242.385957, 89.5131705, 243, 88.5);
        ctx.bezierCurveTo(243.921064, 86.9802443, 243, 74, 246, 74);
        ctx.closePath();
        ctx.fill("evenodd");
        ctx.stroke();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = "#000";
        ctx.fillStyle = "rgba(0, 0, 0, 0.2)";

        ctx.beginPath();
        ctx.moveTo(130.543738, 66.0010109);
        ctx.bezierCurveTo(89.5318415, 66.0582071, 69.505814, 68.5348837, 27.5, 71.5);
        ctx.lineTo(27.5, 71.5);
        ctx.lineTo(27.5, 68.5);
        ctx.bezierCurveTo(68.8900195, 64.5392326, 93.1790795, 62.4682032, 130.49998, 61.5366597);
        ctx.lineTo(130.5, 61.5);
        ctx.lineTo(131.25, 61.518);
        ctx.lineTo(132, 61.5);
        ctx.lineTo(132.001023, 61.5366847);
        ctx.bezierCurveTo(169.321356, 62.4682403, 193.610351, 64.5392681, 235, 68.5);
        ctx.lineTo(235, 71.5);
        ctx.bezierCurveTo(192.994186, 68.5348837, 172.968158, 66.0582071, 131.956262, 66.0010109);
        ctx.closePath();
        ctx.fill("evenodd");
        ctx.stroke();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = "#0F0F0F";

        ctx.beginPath();
        ctx.moveTo(15.5, 146);
        ctx.bezierCurveTo(12, 154, 11, 152, 9.5, 163);
        ctx.bezierCurveTo(9.10480968, 165.898062, 8.92597702, 168, 8, 168);
        ctx.bezierCurveTo(7.38268199, 168, 6.71601532, 166.333333, 6, 163);
        ctx.lineTo(7, 153);
        ctx.bezierCurveTo(7.66666667, 148.333333, 8.5, 145.833333, 9.5, 145.5);
        ctx.bezierCurveTo(11, 145, 14.5, 144, 15.5, 146);
        ctx.closePath();
        ctx.moveTo(248, 146);
        ctx.bezierCurveTo(249, 144, 252.5, 145, 254, 145.5);
        ctx.bezierCurveTo(255, 145.833333, 255.833333, 148.333333, 256.5, 153);
        ctx.lineTo(256.5, 153);
        ctx.lineTo(257.5, 163);
        ctx.bezierCurveTo(256.783985, 166.333333, 256.117318, 168, 255.5, 168);
        ctx.bezierCurveTo(254.574023, 168, 254.39519, 165.898062, 254, 163);
        ctx.bezierCurveTo(252.5, 152, 251.5, 154, 248, 146);
        ctx.closePath();
        ctx.fill("evenodd");
        ctx.stroke();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = "#252525";
        ctx.strokeStyle = "#181818";

        ctx.beginPath();
        ctx.moveTo(112, 87);
        ctx.lineTo(154, 87);
        ctx.bezierCurveTo(155.10456949966158, 87, 156, 87.8954305003384, 156, 89);
        ctx.lineTo(156, 108);
        ctx.bezierCurveTo(156, 109.1045694996616, 155.10456949966158, 110, 154, 110);
        ctx.lineTo(112, 110);
        ctx.bezierCurveTo(110.8954305003384, 110, 110, 109.1045694996616, 110, 108);
        ctx.lineTo(110, 89);
        ctx.bezierCurveTo(110, 87.8954305003384, 110.8954305003384, 87, 112, 87);
        ctx.closePath();
        ctx.fill("evenodd");
        ctx.stroke();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = "rgba(0,0,0,0)";

        ctx.translate(14.455, 117);
        ctx.save();
        ctx.fillStyle = "#000";
        ctx.fillStyle = "rgba(0, 0, 0, 0.143)";

        ctx.beginPath();
        ctx.moveTo(202.5, 2.5);
        ctx.bezierCurveTo(202.5, 5.5, 201.268048, 5.77892921, 182.5, 8);
        ctx.bezierCurveTo(170.089503, 9.46869791, 148.180429, 10.136507, 116.77278, 10.0034271);
        ctx.bezierCurveTo(85.3646557, 10.136507, 63.4555823, 9.46869791, 51.045085, 8);
        ctx.bezierCurveTo(32.2770368, 5.77892921, 31.045085, 5.5, 31.045085, 2.5);
        ctx.bezierCurveTo(31.045085, -0.5, 53.045085, 4.5, 117.545085, 3);
        ctx.lineTo(115.999085, 3.03494818);
        ctx.lineTo(116, 3);
        ctx.lineTo(116.772085, 3.01694818);
        ctx.lineTo(117.545085, 3);
        ctx.lineTo(117.545085, 3.03494818);
        ctx.lineTo(117.92227, 3.0430645);
        ctx.bezierCurveTo(180.9378, 4.4008, 202.5, -0.47, 202.5, 2.5);
        ctx.closePath();
        ctx.fill("evenodd");
        ctx.stroke();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = "#5D0101";
        ctx.strokeStyle = "#000";
        ctx.strokeStyle = "rgba(0, 0, 0, 0.202)";

        ctx.beginPath();
        ctx.moveTo(12.045085, 1);
        ctx.bezierCurveTo(17.8736443, 1.37006726, 24.5403109, 1.37006726, 32.045085, 1);
        ctx.lineTo(33.545085, 5);
        ctx.lineTo(4.54508497, 5);
        ctx.bezierCurveTo(2.54508497, 4.33333333, 1.21175164, 3.66666667, 0.545084972, 3);
        ctx.bezierCurveTo(-0.454915028, 2, 0.0450849719, 0, 1.04508497, 0);
        ctx.bezierCurveTo(2.04508497, 0, 3.30224602, 0.444899114, 12.045085, 1);
        ctx.closePath();
        ctx.moveTo(232.5, 0);
        ctx.bezierCurveTo(233.5, 0, 234, 2, 233, 3);
        ctx.bezierCurveTo(232.333333, 3.66666667, 231, 4.33333333, 229, 5);
        ctx.lineTo(229, 5);
        ctx.lineTo(200, 5);
        ctx.lineTo(201.5, 1);
        ctx.bezierCurveTo(209.004774, 1.37006726, 215.671441, 1.37006726, 221.5, 1);
        ctx.bezierCurveTo(230.242839, 0.444899114, 231.5, 0, 232.5, 0);
        ctx.closePath();
        ctx.fill("evenodd");
        ctx.stroke();
        ctx.restore();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = "#E8D23C";

        ctx.beginPath();
        ctx.moveTo(121.375, 105);
        ctx.bezierCurveTo(121.445, 105, 121.515, 104.94, 121.515, 104.86);
        ctx.lineTo(121.515, 102.24);
        ctx.lineTo(123.015, 102.24);
        ctx.lineTo(123.015, 104.86);
        ctx.bezierCurveTo(123.015, 104.94, 123.085, 105, 123.155, 105);
        ctx.lineTo(124.345, 105);
        ctx.bezierCurveTo(124.425, 105, 124.485, 104.94, 124.485, 104.86);
        ctx.lineTo(124.485, 98.15);
        ctx.bezierCurveTo(124.485, 98.07, 124.425, 98.01, 124.345, 98.01);
        ctx.lineTo(123.155, 98.01);
        ctx.bezierCurveTo(123.085, 98.01, 123.015, 98.07, 123.015, 98.15);
        ctx.lineTo(123.015, 100.77);
        ctx.lineTo(121.515, 100.77);
        ctx.lineTo(121.515, 98.15);
        ctx.bezierCurveTo(121.515, 98.07, 121.445, 98.01, 121.375, 98.01);
        ctx.lineTo(120.185, 98.01);
        ctx.bezierCurveTo(120.105, 98.01, 120.045, 98.07, 120.045, 98.15);
        ctx.lineTo(120.045, 104.86);
        ctx.bezierCurveTo(120.045, 104.94, 120.105, 105, 120.185, 105);
        ctx.lineTo(121.375, 105);
        ctx.closePath();
        ctx.moveTo(129.415, 105);
        ctx.bezierCurveTo(129.485, 105, 129.555, 104.94, 129.555, 104.86);
        ctx.lineTo(129.555, 103.67);
        ctx.bezierCurveTo(129.555, 103.59, 129.485, 103.53, 129.415, 103.53);
        ctx.lineTo(127.105, 103.53);
        ctx.lineTo(127.105, 102.24);
        ctx.lineTo(128.875, 102.24);
        ctx.bezierCurveTo(128.955, 102.24, 129.015, 102.18, 129.015, 102.1);
        ctx.lineTo(129.015, 100.91);
        ctx.bezierCurveTo(129.015, 100.83, 128.955, 100.77, 128.875, 100.77);
        ctx.lineTo(127.105, 100.77);
        ctx.lineTo(127.105, 99.48);
        ctx.lineTo(129.415, 99.48);
        ctx.bezierCurveTo(129.485, 99.48, 129.555, 99.42, 129.555, 99.34);
        ctx.lineTo(129.555, 98.15);
        ctx.bezierCurveTo(129.555, 98.07, 129.485, 98.01, 129.415, 98.01);
        ctx.lineTo(125.775, 98.01);
        ctx.bezierCurveTo(125.695, 98.01, 125.635, 98.07, 125.635, 98.15);
        ctx.lineTo(125.635, 104.86);
        ctx.bezierCurveTo(125.635, 104.94, 125.695, 105, 125.775, 105);
        ctx.lineTo(129.415, 105);
        ctx.closePath();
        ctx.moveTo(134.875, 105);
        ctx.bezierCurveTo(134.955, 105, 135.025, 104.94, 135.025, 104.86);
        ctx.lineTo(135.025, 103.67);
        ctx.bezierCurveTo(135.025, 103.6, 134.955, 103.53, 134.875, 103.53);
        ctx.lineTo(132.195, 103.53);
        ctx.lineTo(132.195, 98.15);
        ctx.bezierCurveTo(132.185, 98.09, 132.125, 98.04, 132.055, 98.04);
        ctx.lineTo(130.875, 98.04);
        ctx.bezierCurveTo(130.805, 98.04, 130.745, 98.09, 130.735, 98.15);
        ctx.lineTo(130.725, 98.15);
        ctx.lineTo(130.725, 104.86);
        ctx.bezierCurveTo(130.725, 104.94, 130.795, 105, 130.875, 105);
        ctx.lineTo(134.875, 105);
        ctx.closePath();
        ctx.moveTo(140.335, 105);
        ctx.bezierCurveTo(140.415, 105, 140.485, 104.94, 140.485, 104.86);
        ctx.lineTo(140.485, 103.67);
        ctx.bezierCurveTo(140.485, 103.6, 140.415, 103.53, 140.335, 103.53);
        ctx.lineTo(137.655, 103.53);
        ctx.lineTo(137.655, 98.15);
        ctx.bezierCurveTo(137.645, 98.09, 137.585, 98.04, 137.515, 98.04);
        ctx.lineTo(136.335, 98.04);
        ctx.bezierCurveTo(136.265, 98.04, 136.205, 98.09, 136.195, 98.15);
        ctx.lineTo(136.185, 98.15);
        ctx.lineTo(136.185, 104.86);
        ctx.bezierCurveTo(136.185, 104.94, 136.255, 105, 136.335, 105);
        ctx.lineTo(140.335, 105);
        ctx.closePath();
        ctx.moveTo(145.335, 104.89);
        ctx.lineTo(145.905, 104.33);
        ctx.bezierCurveTo(146.007857, 104.227143, 146.007857, 104.109592, 146.005758, 104.078105);
        ctx.lineTo(146.005, 98.94);
        ctx.bezierCurveTo(146.005, 98.94, 146.025, 98.8, 145.905, 98.68);
        ctx.lineTo(145.335, 98.12);
        ctx.bezierCurveTo(145.249286, 98.0271429, 145.153367, 98.0108163, 145.105554, 98.0090671);
        ctx.lineTo(142.464446, 98.0090671);
        ctx.bezierCurveTo(142.416633, 98.0108163, 142.320714, 98.0271429, 142.235, 98.12);
        ctx.lineTo(141.675, 98.68);
        ctx.bezierCurveTo(141.555, 98.8, 141.565, 98.94, 141.565, 98.94);
        ctx.lineTo(141.565, 104.07);
        ctx.bezierCurveTo(141.565, 104.07, 141.555, 104.21, 141.675, 104.33);
        ctx.lineTo(142.235, 104.89);
        ctx.bezierCurveTo(142.355, 105.01, 142.495, 105, 142.495, 105);
        ctx.lineTo(145.085, 105);
        ctx.bezierCurveTo(145.085, 105, 145.215, 105.01, 145.335, 104.89);
        ctx.closePath();
        ctx.moveTo(144.365, 103.53);
        ctx.lineTo(143.205, 103.53);
        ctx.lineTo(143.065, 103.39);
        ctx.bezierCurveTo(143.045, 103.36, 143.035, 103.34, 143.035, 103.32);
        ctx.lineTo(143.035, 99.75);
        ctx.bezierCurveTo(143.035, 99.75, 143.035, 99.71, 143.065, 99.67);
        ctx.lineTo(143.235, 99.51);
        ctx.bezierCurveTo(143.255, 99.48, 143.285, 99.48, 143.295, 99.48);
        ctx.lineTo(144.275, 99.48);
        ctx.bezierCurveTo(144.285, 99.48, 144.315, 99.48, 144.345, 99.51);
        ctx.lineTo(144.505, 99.67);
        ctx.bezierCurveTo(144.525, 99.69, 144.5325, 99.71, 144.535, 99.725);
        ctx.lineTo(144.535, 103.32);
        ctx.bezierCurveTo(144.535, 103.34, 144.535, 103.36, 144.505, 103.39);
        ctx.lineTo(144.365, 103.53);
        ctx.closePath();
        ctx.moveTo(124.81, 93.952);
        ctx.lineTo(125.034, 93.728);
        ctx.bezierCurveTo(125.074, 93.688, 125.074, 93.676, 125.078, 93.656);
        ctx.lineTo(125.078, 93.204);
        ctx.bezierCurveTo(125.078, 93.176, 125.05, 93.148, 125.022, 93.148);
        ctx.lineTo(124.546, 93.148);
        ctx.bezierCurveTo(124.514, 93.148, 124.49, 93.176, 124.49, 93.204);
        ctx.lineTo(124.49, 93.324);
        ctx.bezierCurveTo(124.49, 93.332, 124.486, 93.344, 124.478, 93.352);
        ctx.lineTo(124.422, 93.408);
        ctx.lineTo(123.958, 93.408);
        ctx.lineTo(123.902, 93.352);
        ctx.bezierCurveTo(123.89, 93.344, 123.89, 93.332, 123.886, 93.324);
        ctx.lineTo(123.886, 91.896);
        ctx.bezierCurveTo(123.886, 91.896, 123.886, 91.88, 123.902, 91.868);
        ctx.lineTo(123.966, 91.8);
        ctx.bezierCurveTo(123.978, 91.792, 123.986, 91.788, 123.994, 91.788);
        ctx.lineTo(124.382, 91.788);
        ctx.bezierCurveTo(124.39, 91.788, 124.402, 91.792, 124.41, 91.8);
        ctx.lineTo(124.478, 91.868);
        ctx.bezierCurveTo(124.486, 91.876, 124.488667, 91.8857778, 124.489556, 91.8914074);
        ctx.lineTo(124.49, 92);
        ctx.bezierCurveTo(124.49, 92.028, 124.514, 92.056, 124.546, 92.056);
        ctx.lineTo(125.022, 92.056);
        ctx.bezierCurveTo(125.05, 92.056, 125.078, 92.028, 125.078, 92);
        ctx.lineTo(125.078, 91.58);
        ctx.bezierCurveTo(125.078, 91.576, 125.074, 91.572, 125.074, 91.572);
        ctx.lineTo(125.078, 91.572);
        ctx.bezierCurveTo(125.078, 91.572, 125.082, 91.516, 125.034, 91.468);
        ctx.lineTo(124.81, 91.244);
        ctx.bezierCurveTo(124.766, 91.2, 124.706, 91.2, 124.706, 91.2);
        ctx.lineTo(123.67, 91.2);
        ctx.bezierCurveTo(123.67, 91.2, 123.614, 91.2, 123.566, 91.244);
        ctx.lineTo(123.342, 91.468);
        ctx.bezierCurveTo(123.298, 91.512, 123.302, 91.572, 123.302, 91.572);
        ctx.lineTo(123.302, 93.624);
        ctx.bezierCurveTo(123.302, 93.624, 123.302, 93.688, 123.342, 93.728);
        ctx.lineTo(123.566, 93.952);
        ctx.bezierCurveTo(123.599, 93.985, 123.641, 93.99325, 123.659938, 93.9953125);
        ctx.lineTo(124.706, 93.996);
        ctx.bezierCurveTo(124.706, 93.996, 124.766, 93.996, 124.81, 93.952);
        ctx.closePath();
        ctx.moveTo(125.942, 94);
        ctx.bezierCurveTo(125.974, 94, 126.002, 93.972, 126.014, 93.944);
        ctx.lineTo(126.11, 93.62);
        ctx.lineTo(126.914, 93.62);
        ctx.lineTo(127.01, 93.944);
        ctx.bezierCurveTo(127.022, 93.972, 127.05, 94, 127.082, 94);
        ctx.lineTo(127.538, 94);
        ctx.bezierCurveTo(127.57, 94, 127.606, 93.972, 127.598, 93.944);
        ctx.lineTo(126.806, 91.264);
        ctx.lineTo(126.806, 91.264);
        ctx.lineTo(126.806, 91.26);
        ctx.bezierCurveTo(126.794, 91.224, 126.778, 91.204, 126.75, 91.204);
        ctx.lineTo(126.274, 91.204);
        ctx.bezierCurveTo(126.246, 91.204, 126.234, 91.224, 126.218, 91.26);
        ctx.lineTo(126.218, 91.264);
        ctx.lineTo(125.426, 93.944);
        ctx.bezierCurveTo(125.418, 93.972, 125.454, 94, 125.486, 94);
        ctx.lineTo(125.942, 94);
        ctx.closePath();
        ctx.moveTo(126.754, 93.08);
        ctx.lineTo(126.27, 93.08);
        ctx.lineTo(126.514, 92.26);
        ctx.lineTo(126.754, 93.08);
        ctx.closePath();
        ctx.moveTo(129.618, 94);
        ctx.bezierCurveTo(129.65, 94, 129.678, 93.976, 129.678, 93.944);
        ctx.lineTo(129.678, 93.468);
        ctx.bezierCurveTo(129.678, 93.44, 129.65, 93.412, 129.618, 93.412);
        ctx.lineTo(128.546, 93.412);
        ctx.lineTo(128.546, 91.26);
        ctx.bezierCurveTo(128.542, 91.236, 128.518, 91.216, 128.49, 91.216);
        ctx.lineTo(128.018, 91.216);
        ctx.bezierCurveTo(127.99, 91.216, 127.966, 91.236, 127.962, 91.26);
        ctx.lineTo(127.958, 91.26);
        ctx.lineTo(127.958, 93.944);
        ctx.bezierCurveTo(127.958, 93.976, 127.986, 94, 128.018, 94);
        ctx.lineTo(129.618, 94);
        ctx.closePath();
        ctx.moveTo(130.638, 94);
        ctx.bezierCurveTo(130.67, 94, 130.694, 93.976, 130.694, 93.944);
        ctx.lineTo(130.694, 91.272);
        ctx.bezierCurveTo(130.694, 91.24, 130.67, 91.216, 130.638, 91.216);
        ctx.lineTo(130.162, 91.216);
        ctx.bezierCurveTo(130.13, 91.216, 130.106, 91.24, 130.106, 91.272);
        ctx.lineTo(130.106, 93.944);
        ctx.bezierCurveTo(130.106, 93.976, 130.13, 94, 130.162, 94);
        ctx.lineTo(130.638, 94);
        ctx.closePath();
        ctx.moveTo(131.658, 94);
        ctx.bezierCurveTo(131.69, 94, 131.714, 93.976, 131.714, 93.944);
        ctx.lineTo(131.714, 92.896);
        ctx.lineTo(132.45, 92.896);
        ctx.lineTo(132.45, 92.888);
        ctx.bezierCurveTo(132.466, 92.88, 132.478, 92.86, 132.478, 92.84);
        ctx.lineTo(132.478, 92.364);
        ctx.bezierCurveTo(132.478, 92.332, 132.454, 92.308, 132.422, 92.308);
        ctx.lineTo(131.714, 92.308);
        ctx.lineTo(131.714, 91.792);
        ctx.lineTo(132.662, 91.792);
        ctx.lineTo(132.662, 91.784);
        ctx.bezierCurveTo(132.682, 91.776, 132.694, 91.756, 132.694, 91.736);
        ctx.lineTo(132.694, 91.26);
        ctx.bezierCurveTo(132.694, 91.228, 132.666, 91.204, 132.638, 91.204);
        ctx.lineTo(131.182, 91.204);
        ctx.lineTo(131.182, 91.204);
        ctx.bezierCurveTo(131.15, 91.204, 131.126, 91.228, 131.126, 91.26);
        ctx.lineTo(131.126, 93.944);
        ctx.bezierCurveTo(131.126, 93.976, 131.15, 94, 131.182, 94);
        ctx.lineTo(131.658, 94);
        ctx.closePath();
        ctx.moveTo(134.59, 93.956);
        ctx.lineTo(134.818, 93.732);
        ctx.bezierCurveTo(134.866, 93.684, 134.858, 93.628, 134.858, 93.628);
        ctx.lineTo(134.858, 91.576);
        ctx.bezierCurveTo(134.858, 91.576, 134.866, 91.52, 134.818, 91.472);
        ctx.lineTo(134.59, 91.248);
        ctx.bezierCurveTo(134.554, 91.209, 134.5135, 91.20375, 134.4955, 91.2035571);
        ctx.lineTo(133.454, 91.204);
        ctx.bezierCurveTo(133.454, 91.204, 133.398, 91.196, 133.35, 91.248);
        ctx.lineTo(133.126, 91.472);
        ctx.bezierCurveTo(133.078, 91.52, 133.082, 91.576, 133.082, 91.576);
        ctx.lineTo(133.082, 93.628);
        ctx.bezierCurveTo(133.082, 93.628, 133.078, 93.684, 133.126, 93.732);
        ctx.lineTo(133.35, 93.956);
        ctx.bezierCurveTo(133.386, 93.992, 133.4265, 93.99875, 133.4445, 93.999875);
        ctx.lineTo(134.49, 94);
        ctx.bezierCurveTo(134.49, 94, 134.542, 94.004, 134.59, 93.956);
        ctx.closePath();
        ctx.moveTo(134.202, 93.412);
        ctx.lineTo(133.738, 93.412);
        ctx.lineTo(133.682, 93.356);
        ctx.bezierCurveTo(133.674, 93.344, 133.67, 93.336, 133.67, 93.328);
        ctx.lineTo(133.67, 91.9);
        ctx.lineTo(133.673556, 91.8834074);
        ctx.bezierCurveTo(133.675333, 91.8786667, 133.678, 91.8733333, 133.682, 91.868);
        ctx.lineTo(133.75, 91.804);
        ctx.bezierCurveTo(133.758, 91.792, 133.77, 91.792, 133.774, 91.792);
        ctx.lineTo(134.166, 91.792);
        ctx.bezierCurveTo(134.17, 91.792, 134.182, 91.792, 134.194, 91.804);
        ctx.lineTo(134.258, 91.868);
        ctx.bezierCurveTo(134.274, 91.884, 134.27, 91.9, 134.27, 91.9);
        ctx.lineTo(134.27, 93.328);
        ctx.bezierCurveTo(134.27, 93.336, 134.27, 93.344, 134.258, 93.356);
        ctx.lineTo(134.202, 93.412);
        ctx.closePath();
        ctx.moveTo(135.826, 94);
        ctx.bezierCurveTo(135.858, 94, 135.882, 93.972, 135.882, 93.944);
        ctx.lineTo(135.882, 92.972);
        ctx.lineTo(136.066, 92.972);
        ctx.lineTo(136.458, 93.944);
        ctx.bezierCurveTo(136.47, 93.972, 136.498, 94, 136.53, 94);
        ctx.lineTo(137.066, 94);
        ctx.bezierCurveTo(137.094, 94, 137.13, 93.972, 137.122, 93.944);
        ctx.lineTo(136.714, 92.94);
        ctx.lineTo(136.726, 92.932);
        ctx.lineTo(136.954, 92.704);
        ctx.bezierCurveTo(137.002, 92.656, 136.994, 92.6, 136.994, 92.6);
        ctx.lineTo(136.994, 91.584);
        ctx.bezierCurveTo(136.994, 91.584, 137.002, 91.52, 136.954, 91.472);
        ctx.lineTo(136.726, 91.244);
        ctx.bezierCurveTo(136.69, 91.208, 136.6495, 91.2035, 136.6315, 91.2035);
        ctx.lineTo(135.35, 91.204);
        ctx.bezierCurveTo(135.322, 91.204, 135.294, 91.228, 135.294, 91.26);
        ctx.lineTo(135.294, 93.944);
        ctx.bezierCurveTo(135.294, 93.972, 135.322, 94, 135.35, 94);
        ctx.lineTo(135.826, 94);
        ctx.closePath();
        ctx.moveTo(136.302, 92.384);
        ctx.lineTo(135.882, 92.384);
        ctx.lineTo(135.882, 91.792);
        ctx.lineTo(136.298, 91.792);
        ctx.bezierCurveTo(136.298, 91.792, 136.314, 91.788, 136.33, 91.804);
        ctx.lineTo(136.394, 91.868);
        ctx.bezierCurveTo(136.41, 91.884, 136.406, 91.9, 136.406, 91.9);
        ctx.lineTo(136.406, 92.276);
        ctx.bezierCurveTo(136.406, 92.276, 136.41, 92.292, 136.394, 92.308);
        ctx.lineTo(136.33, 92.372);
        ctx.bezierCurveTo(136.318, 92.384, 136.306, 92.384, 136.302, 92.384);
        ctx.closePath();
        ctx.moveTo(137.99, 93.996);
        ctx.bezierCurveTo(138.018, 93.996, 138.046, 93.968, 138.046, 93.94);
        ctx.lineTo(138.046, 92.604);
        ctx.lineTo(138.534, 93.94);
        ctx.bezierCurveTo(138.546, 93.968, 138.574, 93.996, 138.606, 93.996);
        ctx.lineTo(139.238, 93.996);
        ctx.bezierCurveTo(139.27, 93.996, 139.294, 93.968, 139.294, 93.94);
        ctx.lineTo(139.294, 91.256);
        ctx.bezierCurveTo(139.294, 91.224, 139.27, 91.2, 139.238, 91.2);
        ctx.lineTo(138.762, 91.2);
        ctx.bezierCurveTo(138.734, 91.2, 138.706, 91.224, 138.706, 91.256);
        ctx.lineTo(138.706, 92.844);
        ctx.lineTo(138.698, 92.8);
        ctx.lineTo(138.17, 91.256);
        ctx.lineTo(138.166, 91.256);
        ctx.bezierCurveTo(138.158, 91.22, 138.138, 91.2, 138.11, 91.2);
        ctx.lineTo(137.514, 91.2);
        ctx.bezierCurveTo(137.482, 91.2, 137.458, 91.224, 137.458, 91.256);
        ctx.lineTo(137.458, 93.94);
        ctx.bezierCurveTo(137.458, 93.968, 137.482, 93.996, 137.514, 93.996);
        ctx.lineTo(137.99, 93.996);
        ctx.closePath();
        ctx.moveTo(140.238, 94);
        ctx.bezierCurveTo(140.27, 94, 140.294, 93.976, 140.294, 93.944);
        ctx.lineTo(140.294, 91.272);
        ctx.bezierCurveTo(140.294, 91.24, 140.27, 91.216, 140.238, 91.216);
        ctx.lineTo(139.762, 91.216);
        ctx.bezierCurveTo(139.73, 91.216, 139.706, 91.24, 139.706, 91.272);
        ctx.lineTo(139.706, 93.944);
        ctx.bezierCurveTo(139.706, 93.976, 139.73, 94, 139.762, 94);
        ctx.lineTo(140.238, 94);
        ctx.closePath();
        ctx.moveTo(141.134, 94);
        ctx.bezierCurveTo(141.166, 94, 141.194, 93.972, 141.206, 93.944);
        ctx.lineTo(141.302, 93.62);
        ctx.lineTo(142.106, 93.62);
        ctx.lineTo(142.202, 93.944);
        ctx.bezierCurveTo(142.214, 93.972, 142.242, 94, 142.274, 94);
        ctx.lineTo(142.73, 94);
        ctx.bezierCurveTo(142.762, 94, 142.798, 93.972, 142.79, 93.944);
        ctx.lineTo(141.998, 91.264);
        ctx.lineTo(141.998, 91.264);
        ctx.lineTo(141.998, 91.26);
        ctx.bezierCurveTo(141.986, 91.224, 141.97, 91.204, 141.942, 91.204);
        ctx.lineTo(141.466, 91.204);
        ctx.bezierCurveTo(141.438, 91.204, 141.426, 91.224, 141.41, 91.26);
        ctx.lineTo(141.41, 91.264);
        ctx.lineTo(140.618, 93.944);
        ctx.bezierCurveTo(140.61, 93.972, 140.646, 94, 140.678, 94);
        ctx.lineTo(141.134, 94);
        ctx.closePath();
        ctx.moveTo(141.946, 93.08);
        ctx.lineTo(141.462, 93.08);
        ctx.lineTo(141.706, 92.26);
        ctx.lineTo(141.946, 93.08);
        ctx.closePath();
        ctx.fill("nonzero");
        ctx.stroke();
        ctx.restore();
        ctx.restore();
        ctx.restore();
        ctx.restore();
    }

    function draw_cone_top(ctx) {
        ctx.save();
        ctx.scale(0.25641025641025644, 0.25641025641025644);

        ctx.fillStyle = "#222";
        ctx.roundRect(-25, -25, 50, 50, 11);
        ctx.fill();
        ctx.fillStyle = "#DA5D00";
        ctx.fillEllipse(0, 0, 16);
        ctx.fillStyle = "#EEE";
        ctx.fillEllipse(0, 0, 11);
        ctx.fillStyle = "#DA5D00";
        ctx.fillEllipse(0, 0, 6);
        ctx.fillStyle = "#222";
        ctx.fillEllipse(0, 0, 3);
        ctx.restore();
    }


    function draw_cone_back(ctx) {
        ctx.save();
        ctx.scale(0.29850746268656714, -0.29850746268656714);
        ctx.translate(0, -101);

        ctx.fillStyle = "#222";
        ctx.roundRect(-25, -2, 50, 8, 2);
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(-16, 4);
        ctx.lineTo(16, 4);
        ctx.lineTo(3, 70);
        ctx.lineTo(-3, 70);
        ctx.fillStyle = "#DA5D00";
        ctx.fill();

        ctx.beginPath();
        ctx.ellipse(0, 4, 16, 3, 0, 0, Math.PI * 2);
        ctx.fill();


        ctx.beginPath();
        ctx.moveTo(-11.5, 25);
        ctx.lineTo(11.5, 25);
        ctx.lineTo(7.5, 46);
        ctx.lineTo(-7.5, 46);
        ctx.fillStyle = "#EEE";
        ctx.fill();

        ctx.beginPath();
        ctx.ellipse(0, 25, 11, 2, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#DA5D00";

        ctx.beginPath();
        ctx.ellipse(0, 46, 7, 0.5, 0, 0, Math.PI * 2);
        ctx.fill();


        ctx.restore();
    }




    function GLDrawer(scale, ready_callback) {

        let canvas = document.createElement("canvas");
        let gl = canvas.getContext('experimental-webgl');

        var asset_names = ["bounce", "noise"];

        var assets = [];
        var textures = [];
        var loaded_assets_count = 0;

        if (ready_callback) {

        for (var j = 0; j < asset_names.length; j++) {
            textures[j] = gl.createTexture();

            gl.bindTexture(gl.TEXTURE_2D, textures[j]);

            if (j == 0) {
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            } else {
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
            }

            var pixel = new Uint8Array([0, 0, 0, 0]);

            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA,
                1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
                pixel);
        }

        function asset_loaded() {
            loaded_assets_count++;

            if (loaded_assets_count == asset_names.length) {
                for (var j = 0; j < asset_names.length; j++) {
                    gl.bindTexture(gl.TEXTURE_2D, textures[j]);
                    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, assets[j]);

                }

                ready_callback();
            }
        }

        for (var j = 0; j < asset_names.length; j++) {

            var name = asset_names[j];

            var image = new Image();
            assets[j] = image;
            image.onload = asset_loaded;
            image.src = "/images/light_shadow/" + name + ".png";
        }
    }

        let vertices = [
            -1.0, -1.0,
            3.0, -1.0,
            -1.0, 3.0,
        ];

        let vertex_buffer = gl.createBuffer();

        gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);


        let base_vert_src =
            `
        attribute vec2 coordinates;
        varying highp vec2 unit;
        uniform float aspect;
        void main(void) {
            unit = coordinates;
            unit.x *= aspect;
            gl_Position = vec4(coordinates, 0.0, 1.0);
        }
        `;


        let preamble =
            `
            precision highp float;

            varying highp vec2 unit;
            uniform sampler2D noise_tex;
            
            uniform mat3 rot;

            float pi = 3.141592653589793;
            float BACKGROUND = 0.0;
            float BASE = 1.0;
            float LIGHT = 2.0;
            float WALL = 3.0;

            void ray(out vec3 ray_pos, out vec3 ray_dir, vec2 uv)
            {
                float camera_dist = 10.0;
                
                // float fov = 0.7853981634;
                // float fov_start = 1.0/tan(fov/2.0);
                float fov_start = 2.4142135624;
                
                vec3 pos = vec3(0.0,0.0,fov_start);

                vec3 dir = normalize(vec3(uv, 0.0) - pos);

                ray_dir = dir * rot;
                ray_pos = (vec3(0,0,camera_dist)) * rot;
            }

            float degammaf(float x) {
                return x < 0.04045 ? x * (1.0/12.92) : pow((x + 0.055)/1.055, 2.4);
            }

            float engammaf(float x) {
                return x < 0.0031308 ? x * 12.92 : (1.055 * pow(x, 1.0 / 2.4) - 0.055);
            }

            vec3 engamma(vec3 x) {
                x.r = engammaf(x.r);
                x.g = engammaf(x.g);
                x.b = engammaf(x.b);
                return x;
            }

            vec3 noise() {
                return vec3((texture2D(noise_tex, gl_FragCoord.xy*(1.0/32.0)).r - 0.495)*(1.0/255.0));
            }

            float sphere(vec3 origin, vec3 dir, vec3 pos, float r) {
                vec3 to_sphere = pos - origin;
                float a = dot(dir, dir);
                float b = -dot(to_sphere, dir);
                vec3 k = to_sphere + b/a*dir;
                float d = r*r - dot(k,k);

                return d;
            }

            float edge(vec3 v1, vec3 v2)
            {
                float x = dot(v1, v2);
                float y = abs(x);
                
                float theta_sintheta = y * (y * 0.308609 - 0.879406) + 1.5708;

                if (x < 0.0)
                    theta_sintheta = pi/sqrt(1.0 - x*x) - theta_sintheta;
                float u = cross(v1,v2).z;
                float res = theta_sintheta * u;

                return res;
            }
        `

        // https://www.microsoft.com/en-us/research/publication/area-light-sources-for-real-time-graphics/

        let base_frag_src =
            `
            uniform vec3 light_pos;
            uniform float light_size;
            uniform float base_size;
            uniform float radiance;

            void main(void) {    
                float base_width = base_size;
                float base_height = base_size;
    
                vec3 ray_org, ray_dir;
                ray(ray_org, ray_dir, unit);
                
                float base_t = -ray_org.z / ray_dir.z;
                vec3 base_hit = ray_dir * base_t + ray_org;
 
                vec3 col = vec3(0.0);

                vec3 to_light = light_pos - base_hit;
                           
                if (abs(base_hit.x) < base_width*0.5 && abs(base_hit.y) < base_height*0.5)
                {
                    col = vec3(0.5, 0.5, 0.5);

                    float inv_to_light_len = 1.0/(length(to_light));

                    float cos_omega =  to_light.z * inv_to_light_len;
                    float sin_sig = light_size*inv_to_light_len;
                    col *= radiance*cos_omega * sin_sig * sin_sig;
                }

                gl_FragColor = vec4(engamma(col) + noise(), 1.0);
            }
            `;


        let rgb_frag_src =
            `
            uniform vec3 light_rad;

            void main(void) {    
  
                float light_size = 0.3;
                float radiance = 200.0;
    
                vec3 ray_org, ray_dir;
                ray(ray_org, ray_dir, unit);
                
                float base_t = -ray_org.z / ray_dir.z;
                vec3 base_hit = ray_dir * base_t + ray_org;
 
                vec3 col = vec3(0.0);

     
                if (base_hit.x * base_hit.x + base_hit.y * base_hit.y < 9.0)
                {
                    col = vec3(0.0);
                    {
                        vec3 to_light = vec3(2.5, 0.0, 2.0) - base_hit;

                        float inv_to_light_len = 1.0/(length(to_light));

                        float cos_omega =  to_light.z * inv_to_light_len;
                        float sin_sig = light_size*inv_to_light_len;
                        col.r += radiance*cos_omega * sin_sig * sin_sig;
                    }
                    {
                        vec3 to_light = vec3(-2.5*0.5, 2.5*0.8660254038, 2.0) - base_hit;

                        float inv_to_light_len = 1.0/(length(to_light));

                        float cos_omega =  to_light.z * inv_to_light_len;
                        float sin_sig = light_size*inv_to_light_len;
                        col.g += radiance*cos_omega * sin_sig * sin_sig;
                    }
                    {
                        vec3 to_light = vec3(-2.5*0.5, -2.5*0.8660254038, 2.0) - base_hit;

                        float inv_to_light_len = 1.0/(length(to_light));

                        float cos_omega =  to_light.z * inv_to_light_len;
                        float sin_sig = light_size*inv_to_light_len;
                        col.b += radiance*cos_omega * sin_sig * sin_sig;
                    }
                }

                col *= light_rad;

                gl_FragColor = vec4(engamma(col) + noise(), 1.0);
            }
            `;


        let cosine_sphere_frag_src =
            `
            void main(void) {    
      
    
                vec3 ray_org, ray_dir;
                ray(ray_org, ray_dir, unit);

                float r = 2.0;

                vec3 f = ray_org;
                float b2 = dot(f,ray_dir);
                float r2 = r * r;
                vec3 fd = f - b2 * ray_dir;
                float d = r2 - dot(fd, fd);

                float a = 0.0;
                float col = 0.0;

                if (d >= 0.0) {
                    a = 1.0;

                    float c = dot(f, f) - r2;
                    float sq = sqrt(d);
                    float q = (b2 >= 0.0 ? -sq : sq) - b2;
    
                    float t0 = c/q;

                    float z = (ray_org.z + t0*ray_dir.z);
                    col = max(0.0, z * 0.45);
                }
                
                gl_FragColor = vec4(vec3(engammaf(col) + noise().x)*a, a);
            }
            `;


        let solid_angle_frag_src =
            `
            uniform mat3 quad_rot;
            uniform vec2 quad_size;
            uniform vec4 sphere_param;
            uniform vec3 quad_pos;
            uniform float top;

            void main(void) {    
  
                vec3 ray_org, ray_dir;
                ray(ray_org, ray_dir, unit);
      
                float r = sphere_param.w;

                vec3 f = ray_org - sphere_param.xyz;
                float b2 = dot(f,ray_dir);
                float r2 = r * r;
                vec3 fd = f - b2 * ray_dir;
                float d = r2 - dot(fd, fd);
                vec4 col = vec4(0.0);

                if (d >= 0.0) {
                    float c = dot(f, f) - r2;
                    float sq = sqrt(d);
                    float q = (b2 >= 0.0 ? -sq : sq) - b2;
    
                    float t0 = c/q;
                    float t1 = q;

                    vec3 dir0 = ray_org + t0*ray_dir;
                    vec3 dir1 = ray_org + t1*ray_dir;

            

                    if (top == 0.0 || dir0.z >= 0.0 || dir1.z >= 0.0) {
                        col = vec4(0.15);

                        float up0 = dir0.z;
                        float up1 = dir1.z;

                    dir0 *= quad_rot;
                    dir1 *= quad_rot;

                    vec3 o = (sphere_param.xyz - quad_pos)*quad_rot;

                    vec2 hit0 = o.xy + -dir0.xy*o.z/(dir0.z);
                    vec2 hit1 = o.xy + -dir1.xy*o.z/(dir1.z);
                  
                    if (up0 > 0.0 && abs(hit0.x) < quad_size.x && abs(hit0.y) < quad_size.y)
                        col = vec4(0.913*0.5, 0.663*0.5, 0.099*0.5, 0.5);
                    else if (up1 > 0.0 && abs(hit1.x) < quad_size.x && abs(hit1.y) < quad_size.y)
                        col = vec4(0.94, 0.76, 0.40, 1.0) * 0.5;
                    }

                }
            
                gl_FragColor = col;
            }
            `;

        let solid_angle_sphere_frag_src =
            `
            uniform vec3 params;

            void main(void) {    
  
                vec3 ray_org, ray_dir;
                ray(ray_org, ray_dir, unit);
          
                float r = params.x;

                vec3 f = ray_org;
                float b2 = dot(f,ray_dir);
                float r2 = r * r;
                vec3 fd = f - b2 * ray_dir;
                float d = r2 - dot(fd, fd);
                vec4 col = vec4(0.0);
                float alpha = 0.0;
                if (d >= 0.0) {

                    col = vec4(0.4);
                    alpha = 0.6;

                    float c = dot(f, f) - r2;
                    float sq = sqrt(d);
                    float q = (b2 >= 0.0 ? -sq : sq) - b2;
    
                    float t0 = c/q;
                    float t1 = q;

                    vec3 dir0 = (ray_org + t0*ray_dir);
                    vec3 dir1 = (ray_org + t1*ray_dir);

                    if (dir0.z > params.y)
                        col = vec4(0.913, 0.663, 0.099, 1.0);
                    else if (dir1.z > params.y)
                        col = vec4(0.95, 0.80, 0.48, 1.0);
                    
                    if (dir0.z <= params.z)
                        alpha = 0.0;
                }
            
                gl_FragColor = col*alpha;
            }
            `;


        let bounce_frag_src =
            `
            uniform vec3 light_pos;
            uniform sampler2D tex;
            uniform vec2 radiance;
            uniform vec2 offsets;

            void main(void) {    
                float base_width = 4.0;
                float base_height = 4.0;
                float wall_width = 4.0;
                float wall_height = 4.0;
                float lw = 1.0;
                float lh = 0.5;


                vec3 wall_color = vec3(1.0, 0.0, 0.0);
    
                vec3 ray_org, ray_dir;
                ray(ray_org, ray_dir, unit);
                
                float base_t = -(ray_org.z + wall_height*0.5) / ray_dir.z;
                vec3 base_hit = ray_dir * base_t + ray_org;

                float wall_t = -(ray_org.y + base_height*0.5) / ray_dir.y;
                vec3 wall_hit = ray_dir * wall_t + ray_org;

                vec3 col = vec3(0.0);

                float obj = BACKGROUND;
                float t = 1000.0;

                if (abs(base_hit.x) < base_width*0.5 && abs(base_hit.y) < base_height*0.5)
                {
                    obj = BASE;
                    t = base_t;
                }
                
                if (abs(wall_hit.x) < wall_width*0.5 && abs(wall_hit.z) < wall_height*0.5 && wall_t < t)
                {
                    obj = WALL;
                    t = wall_t;
                }


                if (obj == BASE)
                {

                    vec3 l0 = normalize(vec3(+1.0, 0.0, 0.0) - base_hit);
                    vec3 l1 = normalize(vec3(+1.0, 0.0, 2.0) - base_hit);
                    vec3 l2 = normalize(vec3(-1.0, 0.0, 2.0) - base_hit);
                    vec3 l3 = normalize(vec3(-1.0, 0.0, 0.0) - base_hit);

                    float sum;
                    sum  = edge(l0, l1);
                    sum += edge(l1, l2);
                    sum += edge(l2, l3);
                    sum += edge(l3, l0);
                    sum = max(0.0, sum);
                    col = vec3(sum *radiance.x);


                    vec2 uv = (base_hit.xy * (1.0/base_width) + 0.5) * 0.98 + 0.01;
                    uv = uv.yx;
                    uv *= vec2(0.2, 0.5);

                    uv.y += 0.5;
                    uv.x += offsets.x;
                    mediump float color = texture2D(tex, uv).r;
                    color = degammaf(color) * (radiance.y);
                    col += vec3(color) * wall_color;

                } else if (obj == WALL)
                {        
                    col = vec3(0.0);

                    vec2 uv = (wall_hit.xz * (1.0/wall_width) + 0.5) * 0.98 + 0.01;
                    uv = uv.yx;
                    uv *= vec2(0.2, 0.5);

                    uv.x += offsets.y;
                    mediump float color = texture2D(tex, uv).r;
                    color = degammaf(color) * (radiance.y);
                    col += vec3(color)  * wall_color;
                }
                
                gl_FragColor = vec4(engamma(col) + noise(), 1.0);
            }
            `;




        let area_frag_src =
            `
            uniform mat3 light_rot;
            uniform mat3 inv_light_rot;
            uniform vec3 light_pos;
            float light_size = 0.25;


            void main(void) {    
                float base_width = 5.0;
                float base_height = 5.0;
                float light_width = 1.8;
                float light_height = 1.4;
    
                vec3 ray_org, ray_dir;
                ray(ray_org, ray_dir, unit);
                
                float base_t = -ray_org.z / ray_dir.z;
                vec3 base_hit = ray_dir * base_t + ray_org;
                float col = 0.0;
                float alpha = 0.0;

                if (abs(base_hit.x) < base_width*0.5 && abs(base_hit.y) < base_height*0.5)
                {
                    col = 0.4;
                    alpha = 1.0;

                    vec3 l0 = normalize(vec3(-light_width*0.5,-light_height*0.5,0.0)*light_rot - base_hit + light_pos);
                    vec3 l1 = normalize(vec3(-light_width*0.5, light_height*0.5,0.0)*light_rot - base_hit + light_pos);
                    vec3 l2 = normalize(vec3( light_width*0.5, light_height*0.5,0.0)*light_rot - base_hit + light_pos);
                    vec3 l3 = normalize(vec3( light_width*0.5,-light_height*0.5,0.0)*light_rot - base_hit + light_pos);

                    float sum;
                    sum  = edge(l0, l1);
                    sum += edge(l1, l2);
                    sum += edge(l2, l3);
                    sum += edge(l3, l0);

                    col *= sum;
                }

                
                gl_FragColor = vec4(vec3((engammaf(col) + noise().x)*alpha), alpha);
            }
            `;


        let ambient_frag_src =
            `
            uniform vec3 light;
            uniform float hemi;

            void main(void) {    
                float base_width = 5.0;
                float base_height = 5.0;
       
                vec3 ray_org, ray_dir;
                ray(ray_org, ray_dir, unit);
                
                float base_t = -ray_org.z / ray_dir.z;
                vec3 base_hit = ray_dir * base_t + ray_org;
 
                float col = 0.0;
                float alpha = 0.0;
                           
                if (abs(base_hit.x) < base_width*0.5 && abs(base_hit.y) < base_height*0.5)
                {
                    alpha = 1.0;

                    vec3 l0 = normalize(vec3(-light.x, -light.y, light.z) - base_hit);
                    vec3 l1 = normalize(vec3(-light.x,  light.y, light.z) - base_hit);
                    vec3 l2 = normalize(vec3( light.x,  light.y, light.z) - base_hit);
                    vec3 l3 = normalize(vec3( light.x, -light.y, light.z) - base_hit);

                    float sum;
                    sum  = edge(l0, l1);
                    sum += edge(l1, l2);
                    sum += edge(l2, l3);
                    sum += edge(l3, l0);

                    col = 0.5 + sum*(0.25/pi);
                }

                if (hemi != 0.0) {
                    vec3 f = ray_org;
                    float b2 = dot(f,ray_dir);
                    float r2 = 1.0;
                    vec3 fd = f - b2 * ray_dir;
                    float d = r2 - dot(fd, fd);
    
                    if (d >= 0.0) {
                   
                        float c = dot(f, f) - r2;
                        float sq = sqrt(d);
                        float q = (b2 >= 0.0 ? -sq : sq) - b2;
        
                        float t0 = c/q;
    
                        vec3 dir0 = ray_org + t0*ray_dir;

                        if (dir0.z >= 0.0) {
                            col = col == 0.0 ? 0.5 : col*0.9;
                            alpha = min (1.0, 0.3 + alpha);
                        }
    
                    }
                }
         
                
                gl_FragColor = vec4(vec3((engammaf(col) + noise ())*alpha), alpha);
            }
            `;

        let shadow_frag_src =
            `
            uniform mat3 light_rot;
            uniform mat3 inv_light_rot;
            uniform vec3 light_pos;
            uniform vec3 light_size;

            void main(void) {    
                float base_width = 5.0;
                float base_height = 5.0;
                float wall_width = 2.0;
                float wall_height = 1.5;

                float light_width = light_size.x;
                float light_height = light_size.y;
    
                vec3 ray_org, ray_dir;
                ray(ray_org, ray_dir, unit);
                
                float base_t = -ray_org.z / ray_dir.z;
                vec3 base_hit = ray_dir * base_t + ray_org;

                float wall_t = -ray_org.y / ray_dir.y;
                vec3 wall_hit = ray_dir * wall_t + ray_org;

 
                vec3 col = vec3(0.0);

                float obj = BACKGROUND;
                float t = 1000.0;

                if (abs(base_hit.x) < base_width*0.5 && abs(base_hit.y) < base_height*0.5)
                {
                    obj = BASE;
                    t = base_t;
                }


            
                if (obj == BASE)
                {
                    col = vec3(0.4);

                    vec3 l0 = normalize(vec3(-light_width*0.5,-light_height*0.5,0.0)*light_rot - base_hit + light_pos);
                    vec3 l1 = normalize(vec3(-light_width*0.5, light_height*0.5,0.0)*light_rot - base_hit + light_pos);
                    vec3 l2 = normalize(vec3( light_width*0.5, light_height*0.5,0.0)*light_rot - base_hit + light_pos);
                    vec3 l3 = normalize(vec3( light_width*0.5,-light_height*0.5,0.0)*light_rot - base_hit + light_pos);

                    float sum;
                    sum  = edge(l0, l1);
                    sum += edge(l1, l2);
                    sum += edge(l2, l3);
                    sum += edge(l3, l0);

                    vec2 s[5];
                    s[0] = base_hit.xz + l0.xz * base_hit.y / -l0.y;
                    s[1] = base_hit.xz + l1.xz * base_hit.y / -l1.y;
                    s[2] = base_hit.xz + l2.xz * base_hit.y / -l2.y;
                    s[3] = base_hit.xz + l3.xz * base_hit.y / -l3.y;
                    s[4] = s[0];
 
                    float ssum = 0.0;
                    
                    for (int i = 0; i < 4; i++) {
                        vec2 p = s[i];
                        vec2 n = s[i + 1];

                        vec2 d = n - p;
                        vec3 e0, e1;
                        float t = 0.0;

                        if (p.x >= wall_width*0.5) {
                            t = d.x >= 0.0 ? 1.0 : min((wall_width*0.5 - p.x)/d.x, 1.0);
                            e0 = normalize(vec3(wall_width*0.5, 0.0, p.y) - base_hit);
                            e1 = normalize(vec3(wall_width*0.5, 0.0, p.y + t*d.y) - base_hit);
                            ssum += edge(e0, e1);
                            p += t*d;
                            d = n - p;
                        } else if (n.x >= wall_width*0.5) {
                            t = (wall_width*0.5 - p.x)/d.x;
                            e0 = normalize(vec3(wall_width*0.5, 0.0, p.y + t*d.y) - base_hit);
                            e1 = normalize(vec3(wall_width*0.5, 0.0, n.y) - base_hit);
                            ssum += edge(e0, e1);
                            n = p + t*d;
                            d = n - p;
                        }
            
                
                        if (p.x <= -wall_width*0.5) {
                            t = d.x <= 0.0 ? 1.0 :  min((-wall_width*0.5 - p.x)/d.x, 1.0);
                            e0 = normalize(vec3(-wall_width*0.5, 0.0, p.y) - base_hit);
                            e1 = normalize(vec3(-wall_width*0.5, 0.0, p.y + t*d.y) - base_hit);
                            ssum += edge(e0, e1);
                            p += t*d;
                            d = n - p;
                        } else if (n.x <= -wall_width*0.5) {
                            t = (-wall_width*0.5 - p.x)/d.x;
                            e0 = normalize(vec3(-wall_width*0.5, 0.0, p.y + t*d.y) - base_hit);
                            e1 = normalize(vec3(-wall_width*0.5, 0.0, n.y) - base_hit);
                            ssum += edge(e0, e1);
                            n = p + t*d;
                            d = n - p;
                        }

                         
                        if (p.y >= wall_height) {
                            t = d.y >= 0.0 ? 1.0 : min((wall_height - p.y)/d.y, 1.0);
                            e0 = normalize(vec3(p.x, 0.0, wall_height) - base_hit);
                            e1 = normalize(vec3(p.x + t*d.x, 0.0, wall_height) - base_hit);
                            ssum += edge(e0, e1);
                            p += t*d;
                            d = n - p;
                        } else if (n.y >= wall_height) {
                            t = (wall_height - p.y)/d.y;
                            e0 = normalize(vec3(p.x + t*d.x, 0.0, wall_height) - base_hit);
                            e1 = normalize(vec3(n.x, 0.0, wall_height) - base_hit);
                            ssum += edge(e0, e1);
                            n = p + t*d;
                            d = n - p;
                        }
                 
                        e0 = normalize(vec3(p.x, 0.0, p.y) - base_hit);
                        e1 = normalize(vec3(n.x, 0.0, n.y) - base_hit);
                
                        ssum += edge(e0, e1);
                    }

                    if (s[0].y <= 0.0 || s[1].y <= 0.0 || s[2].y <= 0.0 || s[3].y <= 0.0 || base_hit.y > 0.0)
                        ssum = 0.0;

                    sum -= ssum;

                    col *= sum * light_size.z;

                }


                
                gl_FragColor = vec4(engamma(col) + noise(), 1.0);
            }
            `;

        let base_shader = new Shader(gl,
            base_vert_src,
            preamble + base_frag_src,
            ["coordinates"],
            ["aspect", "rot",  "noise_tex", "light_pos", "light_size", "base_size", "radiance"]);

        let rgb_shader = new Shader(gl,
            base_vert_src,
            preamble + rgb_frag_src,
            ["coordinates"],
            ["aspect", "rot",  "noise_tex", "light_rad"]);


        let cosine_sphere_shader = new Shader(gl,
            base_vert_src,
            preamble + cosine_sphere_frag_src,
            ["coordinates"],
            ["aspect", "rot",  "noise_tex", "light_power"]);



        let solid_angle_shader = new Shader(gl,
            base_vert_src,
            preamble + solid_angle_frag_src,
            ["coordinates"],
            ["aspect", "rot",  "noise_tex", "quad_rot", "quad_size", "sphere_param", "quad_pos", "top"]);

        let solid_angle_sphere_shader = new Shader(gl,
            base_vert_src,
            preamble + solid_angle_sphere_frag_src,
            ["coordinates"],
            ["aspect", "rot",  "noise_tex", "params",]);



        let area_shader = new Shader(gl,
            base_vert_src,
            preamble + area_frag_src,
            ["coordinates"],
            ["aspect", "rot",  "noise_tex", "light_rot", "inv_light_rot", "light_pos"]);

        let ambient_shader = new Shader(gl,
            base_vert_src,
            preamble + ambient_frag_src,
            ["coordinates"],
            ["aspect", "rot",  "noise_tex", "light", "hemi"]);


        let bounce_shader = new Shader(gl,
            base_vert_src,
            preamble + bounce_frag_src,
            ["coordinates"],
            ["aspect", "rot",  "noise_tex", "light_pos", "radiance", "offsets", "tex"]);



        let shadow_shader = new Shader(gl,
            base_vert_src,
            preamble + shadow_frag_src,
            ["coordinates"],
            ["aspect", "rot",  "noise_tex", "light_rot", "inv_light_rot", "light_size", "light_pos"]);


        this.begin = function (width, height) {
            canvas.width = width * scale;
            canvas.height = height * scale;

            ndc_sx = 2 / width;
            ndc_sy = 2 / height;
            gl.disable(gl.BLEND);
            gl.clearColor(0.0, 0.0, 0.0, 0.0);
            gl.clear(gl.COLOR_BUFFER_BIT);
            gl.viewport(0, 0, canvas.width, canvas.height);

          
        }
        this.enable_blend = function () {
            gl.enable(gl.BLEND);
            gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
        }

        function setup_shader(shader) {
            gl.useProgram(shader.shader);

            gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer);

            gl.enableVertexAttribArray(shader.attributes["coordinates"]);
            gl.vertexAttribPointer(shader.attributes["coordinates"], 2, gl.FLOAT, false, 0, 0);

            gl.uniform1f(shader.uniforms["aspect"], canvas.width / canvas.height);

            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, textures[1]);
            gl.uniform1i(shader.uniforms["noise_tex"], 0);
        }

        this.draw_simple = function (rot, light_pos, light_size, base_size, radiance) {
            setup_shader(base_shader);
            gl.uniformMatrix3fv(base_shader.uniforms["rot"], false, mat3_transpose(rot));
            gl.uniform3fv(base_shader.uniforms["light_pos"], light_pos);
            gl.uniform1f(base_shader.uniforms["light_size"], light_size);
            gl.uniform1f(base_shader.uniforms["base_size"], base_size);
            gl.uniform1f(base_shader.uniforms["radiance"], radiance);

            gl.drawArrays(gl.TRIANGLES, 0, 3);
        }

        this.draw_rgb = function (rot, light_rad) {
            setup_shader(rgb_shader);
            gl.uniformMatrix3fv(rgb_shader.uniforms["rot"], false, mat3_transpose(rot));
            gl.uniform3fv(rgb_shader.uniforms["light_rad"], light_rad);

            gl.drawArrays(gl.TRIANGLES, 0, 3);
        }



        this.draw_cosine_sphere = function (rot, power) {
            setup_shader(cosine_sphere_shader);
            gl.uniformMatrix3fv(cosine_sphere_shader.uniforms["rot"], false, mat3_transpose(rot));

            gl.drawArrays(gl.TRIANGLES, 0, 3);
        }

        this.draw_bounce = function (rot, light_pos, radiance, offsets) {
            setup_shader(bounce_shader);
            gl.uniformMatrix3fv(bounce_shader.uniforms["rot"], false, mat3_transpose(rot));
            gl.uniform3fv(bounce_shader.uniforms["light_pos"], light_pos);
            gl.uniform2fv(bounce_shader.uniforms["radiance"], [
                radiance[0] * 0.5 / Math.PI,
                radiance[1] * 0.002222222222,
            ]);
            gl.uniform2fv(bounce_shader.uniforms["offsets"], offsets);

            gl.activeTexture(gl.TEXTURE1);
            gl.bindTexture(gl.TEXTURE_2D, textures[0]);
            gl.uniform1i(bounce_shader.uniforms["tex"], 1);


            gl.drawArrays(gl.TRIANGLES, 0, 3);
        }

        this.draw_area = function (rot, light_rot, light_pos) {
            setup_shader(area_shader);
            gl.uniformMatrix3fv(area_shader.uniforms["rot"], false, mat3_transpose(rot));
            gl.uniformMatrix3fv(area_shader.uniforms["light_rot"], false, light_rot);
            gl.uniformMatrix3fv(area_shader.uniforms["inv_light_rot"], false, mat3_invert(light_rot));
            gl.uniform3fv(area_shader.uniforms["light_pos"], light_pos);

            gl.drawArrays(gl.TRIANGLES, 0, 3);
        }

        this.draw_ambient = function (rot, light, hemi) {
            setup_shader(ambient_shader);
            gl.uniformMatrix3fv(ambient_shader.uniforms["rot"], false, mat3_transpose(rot));
            gl.uniform3fv(ambient_shader.uniforms["light"], light);
            gl.uniform1f(ambient_shader.uniforms["hemi"], hemi);

            gl.drawArrays(gl.TRIANGLES, 0, 3);
        }

        this.draw_solid_angle = function (rot, quad_rot, quad_size, quad_pos, top, sphere_param) {
            if (top === undefined)
                top = 0.0;
            if (sphere_param === undefined)
                sphere_param = [0, 0, 0, 1.4];
            setup_shader(solid_angle_shader);
            gl.uniformMatrix3fv(solid_angle_shader.uniforms["rot"], false, mat3_transpose(rot));
            gl.uniformMatrix3fv(solid_angle_shader.uniforms["quad_rot"], false, quad_rot);
            gl.uniform4fv(solid_angle_shader.uniforms["sphere_param"], sphere_param);
            gl.uniform2f(solid_angle_shader.uniforms["quad_size"], quad_size[0] * 0.5, quad_size[1] * 0.5);
            gl.uniform3fv(solid_angle_shader.uniforms["quad_pos"], quad_pos);
            gl.uniform1f(solid_angle_shader.uniforms["top"], top);

            gl.drawArrays(gl.TRIANGLES, 0, 3);
        }

        this.draw_solid_sphere_angle = function (rot, params) {
            setup_shader(solid_angle_sphere_shader);
            gl.uniformMatrix3fv(solid_angle_sphere_shader.uniforms["rot"], false, mat3_transpose(rot));
            gl.uniform3fv(solid_angle_sphere_shader.uniforms["params"], params);

            gl.drawArrays(gl.TRIANGLES, 0, 3);
        }

        this.draw_shadow = function (rot, light_rot, light_pos, light_size) {
            setup_shader(shadow_shader);
            gl.uniformMatrix3fv(shadow_shader.uniforms["rot"], false, mat3_transpose(rot));
            gl.uniformMatrix3fv(shadow_shader.uniforms["light_rot"], false, light_rot);
            gl.uniformMatrix3fv(shadow_shader.uniforms["inv_light_rot"], false, mat3_invert(light_rot));
            gl.uniform3fv(shadow_shader.uniforms["light_pos"], light_pos);
            gl.uniform3fv(shadow_shader.uniforms["light_size"], light_size);

            gl.drawArrays(gl.TRIANGLES, 0, 3);
        }

        this.finish = function () {
            gl.flush();
            return gl.canvas;
        }
    }


    let gl = new GLDrawer(scale, function () {
        if (bounce)
            bounce.repaint();
    });



    function Drawer(scale, container, mode) {

        let self = this;

        let wrapper = document.createElement("div");
        wrapper.classList.add("canvas_container");
        wrapper.classList.add("non_selectable");

        let canvas = document.createElement("canvas");
        canvas.classList.add("non_selectable");
        canvas.style.position = "absolute";
        canvas.style.top = "0";
        canvas.style.left = "0";

        let width, height;

        wrapper.appendChild(canvas);
        container.appendChild(wrapper);



        this.requested_repaint = false;

        function request_repaint() {
            if (!self.requested_repaint) {
                self.requested_repaint = true;
                window.requestAnimationFrame(function () {
                    self.repaint();
                });
            }
        }


        let mvp = ident_matrix.slice();
        mvp = mat3_mul(rot_x_mat3(-1.0), rot_z_mat3(-0.6));
        if (mode === "radiance")
            mvp = mat3_mul(rot_x_mat3(-3.5), rot_z_mat3(-0.6));
        else if (mode === "steradian_sphere")
            mvp = mat3_mul(rot_x_mat3(-0.3), rot_y_mat3(0.3));
        else if (mode === "bounce" || mode === "bounce_steps")
            mvp = mat3_mul(rot_x_mat3(-1.0), rot_z_mat3(-2.6));
        else if (mode === "color_rgb")
            mvp = mat3_mul(rot_x_mat3(-1.0), rot_z_mat3(Math.PI * (-0.5 + 1 / 3)));

        let arcball = new ArcBall(mvp, function () {
                mvp = arcball.matrix.slice();
                request_repaint();
            });

        function canvas_space(e) {
            let r = canvas.getBoundingClientRect();
            return [width - (e.clientX - r.left), (e.clientY - r.top)];
        }

        let no_drag = mode === "power" ||
                      mode === "power_plain" ||
                      mode === "cosine" ||
                      mode === "cosine_side" ||
                      mode === "distance" ||
                      mode === "car" ||
                      mode === "radian" ||
                      mode === "angle_small" ||
                      mode === "radiance_area" ||
                      mode === "lambert_side" ||
                      mode === "color_simple" ||
                      mode === "bounce_paths";

        let load_text = mode === "power" ||
                        mode === "power_surf" ||
                        mode === "car" ||
                        mode === "cosine_side" ||
                        mode === "bounce_paths" ||
                        mode === "radian" ||
                        mode === "steradian_sphere";


        if (!no_drag) {
        new TouchHandler(canvas,

            function (e) {

                let p = canvas_space(e);
                arcball.start(p[0], p[1]);

                return true;
            }
            ,
            function (e) {
                let p = canvas_space(e);
                arcball.update(p[0], p[1], e.timeStamp);
                mvp = arcball.matrix.slice();

                request_repaint();

                return true;
            },
            function (e) {
                arcball.end(e.timeStamp);
            });
        }


        let arg0 = 0, arg1 = 0, arg2 = 0;

        this.get_arg0 = function () { return arg0; }
        this.set_arg0 = function (x) { arg0 = x; request_repaint(); }
        this.set_arg1 = function (x) { arg1 = x; request_repaint(); }
        this.set_arg2 = function (x) { arg2 = x; request_repaint(); }

        this.set_mvp = function (x) {
            mvp = x;
            arcball.set_matrix(x);
            request_repaint();
        }

        this.on_resize = function () {
            let new_width = wrapper.clientWidth;
            let new_height = wrapper.clientHeight;

            if (new_width != width || new_height != height) {

                width = new_width;
                height = new_height;

                canvas.style.width = width + "px";
                canvas.style.height = height + "px";
                canvas.width = width * scale;
                canvas.height = height * scale;

                let pad = 5;
                let size = Math.min(width, height) - pad * 2;
                arcball.set_viewport(width / 2 - size / 2 + pad, height / 2 - size / 2 + pad, size, size);

                request_repaint();
            }
        }

        function project(p) {
            let s = -0.001;
            let z = (1.0 + p[2] * s);
            return [p[0] / z, p[1] / z, -z];
        }

        function ray_project_norm(p) {

            let fov_start = 2.4142135624;
            let camera_dist = 10.0;
            p = p.slice();
            p[2] -= camera_dist;

            let z = p[2] / fov_start;
            return [p[0] / z, p[1] / z, -z];
        }

        function ray_project(p) {

            let fov_start = 2.4142135624;
            let camera_dist = 10.0;
            p = p.slice();
            p[2] -= camera_dist;

            let z = p[2] / fov_start;
            p = vec_scale(p, height * 0.5);
            return [p[0] / z, p[1] / z, -z];
        }

        let x_flip = [-1, 0, 0, 0, 1, 0, 0, 0, 1];
        let y_flip = [1, 0, 0, 0, -1, 0, 0, 0, 1];


        this.repaint = function () {

            self.requested_repaint = false;

            let ctx = canvas.getContext("2d");

            ctx.resetTransform();
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.scale(scale, scale);
            ctx.lineCap = "round";
            ctx.lineJoin = "round";

            font_size = 19;

            if (window.innerWidth < 500)
                font_size = 18;

            if (window.innerWidth < 400)
                font_size = 16;

            ctx.font = font_size + "px IBM Plex Sans";
            ctx.textAlign = "center";

            function convex_hull(points) {
                if (points.length < 4)
                    return points;

                points = points.sort(function (a, b) { return a[0] - b[0]; });

                let l = [];

                for (let i = 0; i < points.length; i++) {
                    while (l.length >= 2 && (vec_cross(vec_sub(l[l.length - 1], l[l.length - 2]), vec_sub(points[i], l[l.length - 2]))[2] <= 0.0)) {
                        l.pop();
                    }
                    l.push(points[i]);
                }
                l.pop();

                points = points.reverse();

                let u = [];

                for (let i = 0; i < points.length; i++) {
                    while (u.length >= 2 && (vec_cross(vec_sub(u[u.length - 1], u[u.length - 2]), vec_sub(points[i], u[u.length - 2]))[2] <= 0.0)) {
                        u.pop();
                    }
                    u.push(points[i]);
                }
                u.pop();

                let r = l;
                r = r.concat(u);
                r.push(points[points.length - 1]);

                return r;
            }

            function draw_arrow_tip(tip, rot, proj, scale) {



                let c = ray_project(mat3_mul_vec(proj, tip));

                let points = [];
                points.push(c.slice(0, 2));

                var n = 12;
                for (let i = 0; i <= n; i++) {
                    let ra = 2 * Math.PI * i / n;
                    let p = [Math.cos(ra), Math.sin(ra), -3.5];
                    p = mat3_mul_vec(rot, p)
                    p = vec_scale(p, scale);
                    p = vec_add(tip, p);
                    p = mat3_mul_vec(proj, p);
                    p = ray_project(p);

                    points.push(p.slice(0, 2));
                }

                points = convex_hull(points);

                ctx.beginPath();

                for (let i = 0; i < points.length; i++)
                    ctx.lineTo(points[i][0], points[i][1]);

                ctx.fill();
            }



            function draw_spherical_light(mvp, light_pos, r, n) {

                let proj_rot = mat3_mul(x_flip, mvp);

                let c = mat3_mul_vec(proj_rot, light_pos);

                let c_proj_norm = ray_project_norm(c);

                let phase = Math.atan2(c[1], c[0]);

                let a = Math.atan2(vec_len([c_proj_norm[0], c_proj_norm[1]]), 2.4142135624);

                let rotz = rot_z_mat3(phase);

                n = n ? n : 20;
                ctx.beginPath();
                for (let i = 0; i < n; i++) {
                    let ra = 2 * Math.PI * i / n;
                    let p = [(r / Math.cos(a)) * Math.cos(ra), r * Math.sin(ra), 0.0];
                    p = mat3_mul_vec(rotz, p);
                    p = vec_add(c, p);
                    p = ray_project(p);
                    ctx.lineTo(p[0], p[1]);
                }
                ctx.closePath();
                ctx.fill();
            }

            function draw_plane(proj_rot, b, fill, stroke, force_fill) {

                ctx.fillStyle = fill || "#000";
                ctx.strokeStyle = stroke || "#282828";


                b *= 0.5;
                ctx.beginPath();

                let p = [-b, -b, 0];
                p = ray_project(mat3_mul_vec(proj_rot, p));
                ctx.moveTo(p[0], p[1]);

                p = [b, -b, 0];
                p = ray_project(mat3_mul_vec(proj_rot, p));
                ctx.lineTo(p[0], p[1]);

                p = [b, b, 0];
                p = ray_project(mat3_mul_vec(proj_rot, p));
                ctx.lineTo(p[0], p[1]);

                p = [-b, b, 0];
                p = ray_project(mat3_mul_vec(proj_rot, p));
                ctx.lineTo(p[0], p[1]);
                ctx.closePath();




                if (mvp[8] < 0.0 || force_fill)
                    ctx.fill();

                ctx.stroke();
            }


            if (mode === "power") {
                let s = arg0 * 1.99 + 0.01;

                let fs = 255 * (1.055 * Math.pow(s, 1.0 / 2.4) - 0.055);

                let r = height * 0.25;
                ctx.translate(width * 0.5, height * 0.45);

                ctx.fillStyle = "rgb(" + fs + "," + fs + "," + fs + ")";
                ctx.fillEllipse(0, 0, r);

                ctx.fillStyle = "white";
                ctx.fillText(Math.round(s * 100) + " W", 0, height / 2 - 10);
            } else if (mode === "power_plain") {
                let s = arg0;

                let fs = 255 * (1.055 * Math.pow(s, 1.0 / 2.4) - 0.055);

                let r = height * 0.25;
                ctx.translate(width * 0.5, height * 0.5);

                ctx.fillStyle = "rgb(" + fs + "," + fs + "," + fs + ")";
                ctx.fillEllipse(0, 0, r);
            } else if (mode === "power_rays") {

                let s = arg0;

                let fs = 255 * (1.055 * Math.pow(s, 1.0 / 2.4) - 0.055);


                ctx.translate(width * 0.5, height * 0.5);
                let sc = height * 0.4 - 5;


                let proj_rot = ident_matrix;
                proj_rot = mat3_mul(proj_rot, x_flip);
                proj_rot = mat3_mul(proj_rot, mvp);

                ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
                ctx.fillStyle = "rgba(255, 255, 255, 0.2)";

                var n = arg0 * rand_vertices.length;

                for (let i = 0; i < n; i++) {
                    let v = mat3_mul_vec(proj_rot, rand_vertices[i]);

                    let p0 = project([0, 0, 0]);
                    let p1 = project(vec_scale(v, 1.2));

                    ctx.beginPath(1);
                    ctx.moveTo(sc * p0[0], sc * p0[1]);
                    ctx.lineTo(sc * p1[0], sc * p1[1]);
                    ctx.stroke();

                    ctx.fillEllipse(sc * p1[0], sc * p1[1], 1.5);
                }


                ctx.fillStyle = "rgb(" + fs + "," + fs + "," + fs + ")";

                ctx.fillEllipse(0, 0, height * 0.02);
            } else if (mode === "color_simple") {
                let colors = ["#fff", "#ffea00", "#ff0000", "#00ff00", "#0000ff"];
                let r = height * 0.25;
                ctx.translate(width * 0.5, height * 0.5);

                ctx.fillStyle = colors[arg0];
                ctx.fillEllipse(0, 0, r);
            }
            else if (mode === "power_surf") {
                let s = arg0 * 99.0 + 1.0;
                let fs = 255 * (1.055 * Math.pow(s, 1.0 / 2.4) - 0.055);
                let light_pos = [0, 0, 3];
                let r = 0.5;
                let rad = s;

                let b = 5.0;
                if (mvp[8] >= 0.0) {

                    gl.begin(width, height);

                    gl.draw_simple(mvp, light_pos, r, b, rad);
                    ctx.drawImage(gl.finish(), 0, 0, width, height);
                }
                let proj_rot = mvp;
                proj_rot = mat3_mul(x_flip, proj_rot);

                ctx.translate(width * 0.5, height * 0.5);

                if (mvp[8] < 0.0) {
                    ctx.fillStyle = "rgb(" + fs + "," + fs + "," + fs + ")";
                    draw_spherical_light(mvp, light_pos, r, 50);
                }

                draw_plane(proj_rot, b);


                if (mvp[8] >= 0.0) {
                    ctx.fillStyle = "rgb(" + fs + "," + fs + "," + fs + ")";
                    draw_spherical_light(mvp, light_pos, r, 50);
                }

                ctx.fillStyle = "white";
                ctx.fillText(Math.round(s * 100) + " W", 0, height / 2 - 10);

            } else if (mode === "color") {
                let s = 50.0;
                let fs = 255 * (1.055 * Math.pow(s, 1.0 / 2.4) - 0.055);
                let light_pos = [0, 0, 3];
                let r = 0.5;
                let rad = s;

                let b = 5.0;
                if (mvp[8] >= 0.0) {

                    gl.begin(width, height);

                    gl.draw_simple(mvp, light_pos, r, b, rad);
                    ctx.drawImage(gl.finish(), 0, 0, width, height);
                }
                let proj_rot = mvp;
                proj_rot = mat3_mul(x_flip, proj_rot);

                let lights = [[1, 1, 1], [1, 0, 0], [0, 1, 0], [0, 0, 1], [0, 1, 1]];

                ctx.translate(width * 0.5, height * 0.5);

                if (mvp[8] < 0.0) {
                    ctx.fillStyle = "rgb(" + Math.round(255 * lights[arg0][0]) + ","
                        + Math.round(255 * lights[arg0][1]) + ","
                        + Math.round(255 * lights[arg0][2]) + ")";
                    draw_spherical_light(mvp, light_pos, r, 50);
                }



                let l = 2.5 / 3.0;
                let ll = 0.92 * l;
                let w = 0.08 * l;

                let h = 1.055 * Math.pow(0.4, 1.0 / 2.4) - 0.055;
                let q = 1.055 * Math.pow(0.05, 1.0 / 2.4) - 0.055;
                let colors = [
                    [[1, 0, 0], [0, 1, 0], [0, 0, 1]],
                    [[1, 1, 0], [0, 1, 1], [1, 0, 1]],
                    [[q, q, q], [h, h, h], [1, 1, 1]]];

                for (let j = 0; j < 3; j++) {
                    for (let i = 0; i < 3; i++) {
                        colors[j][i][0] *= lights[arg0][0];
                        colors[j][i][1] *= lights[arg0][1];
                        colors[j][i][2] *= lights[arg0][2];
                    }
                }

                if (mvp[8] >= 0.0) {

                    for (let i = 0; i < 4; i++) {
                        ctx.fillStyle = "#000"

                        ctx.beginPath();

                        let p = [-l * 3 + 2 * l * i - w, -l * 3, 0];
                        p = ray_project(mat3_mul_vec(proj_rot, p));
                        ctx.moveTo(p[0], p[1]);

                        p = [-l * 3 + 2 * l * i + w, -l * 3, 0];
                        p = ray_project(mat3_mul_vec(proj_rot, p));
                        ctx.lineTo(p[0], p[1]);

                        p = [-l * 3 + 2 * l * i + w, l * 3, 0];
                        p = ray_project(mat3_mul_vec(proj_rot, p));
                        ctx.lineTo(p[0], p[1]);

                        p = [-l * 3 + 2 * l * i - w, l * 3, 0];
                        p = ray_project(mat3_mul_vec(proj_rot, p));
                        ctx.lineTo(p[0], p[1]);
                        ctx.closePath();
                        ctx.fill();

                        ctx.beginPath();

                        p = [-l * 3, -l * 3 + 2 * l * i - w, 0];
                        p = ray_project(mat3_mul_vec(proj_rot, p));
                        ctx.moveTo(p[0], p[1]);

                        p = [-l * 3, -l * 3 + 2 * l * i + w, 0];
                        p = ray_project(mat3_mul_vec(proj_rot, p));
                        ctx.lineTo(p[0], p[1]);

                        p = [l * 3, -l * 3 + 2 * l * i + w, 0];
                        p = ray_project(mat3_mul_vec(proj_rot, p));
                        ctx.lineTo(p[0], p[1]);

                        p = [l * 3, -l * 3 + 2 * l * i - w, 0];
                        p = ray_project(mat3_mul_vec(proj_rot, p));
                        ctx.lineTo(p[0], p[1]);
                        ctx.closePath();
                        ctx.fill();


                    }
                }

                ctx.strokeStyle = "#222";

                for (let j = -1; j < 2; j++) {
                    for (let i = -1; i < 2; i++) {
                        let c = colors[j + 1][i + 1];
                        ctx.fillStyle = "rgb(" + Math.round(255 * c[0]) + ","
                            + Math.round(255 * c[1]) + ","
                            + Math.round(255 * c[2]) + ")";

                        ctx.beginPath();

                        let p = [-ll + 2 * l * i, -ll + 2 * l * j, 0];
                        p = ray_project(mat3_mul_vec(proj_rot, p));
                        ctx.moveTo(p[0], p[1]);

                        p = [ll + 2 * l * i, -ll + 2 * l * j, 0];
                        p = ray_project(mat3_mul_vec(proj_rot, p));
                        ctx.lineTo(p[0], p[1]);

                        p = [ll + + 2 * l * i, ll + + 2 * l * j, 0];
                        p = ray_project(mat3_mul_vec(proj_rot, p));
                        ctx.lineTo(p[0], p[1]);

                        p = [-ll + 2 * l * i, ll + 2 * l * j, 0];
                        p = ray_project(mat3_mul_vec(proj_rot, p));
                        ctx.lineTo(p[0], p[1]);
                        ctx.closePath();

                        if (mvp[8] >= 0.0) {

                            ctx.globalCompositeOperation = "multiply";

                            ctx.fill();
                            ctx.globalCompositeOperation = "source-over";
                        } else {
                            ctx.fillStyle = "#000";
                            ctx.fill();
                        }

                        ctx.stroke();


                    }
                }




                if (mvp[8] >= 0.0) {
                    ctx.fillStyle = "rgb(" + Math.round(255 * lights[arg0][0]) + ","
                        + Math.round(255 * lights[arg0][1]) + ","
                        + Math.round(255 * lights[arg0][2]) + ")";
                    draw_spherical_light(mvp, light_pos, r, 50);
                }

            } else if (mode === "color_rgb") {
                let s = 50.0;
                let rad_max = 200.0;
                let r = 0.3;
                let rad = [arg0 * arg0, arg1 * arg1, arg2 * arg2];

                if (mvp[8] >= 0.0) {

                    gl.begin(width, height);

                    gl.draw_rgb(mvp, rad);
                    ctx.drawImage(gl.finish(), 0, 0, width, height);
                }
                let proj_rot = mvp;
                proj_rot = mat3_mul(x_flip, proj_rot);


                ctx.translate(width * 0.5, height * 0.5);

                function draw_lights() {


                    let fs = Math.min(1.0, engamma(rad[0] * rad_max));
                    ctx.fillStyle = "rgb(" + Math.round(255 * fs) + ", 0, 0)";
                    draw_spherical_light(mvp, [2.5, 0, 2], r, 50);

                    fs = Math.min(1.0, engamma(rad[1] * rad_max));
                    ctx.fillStyle = "rgb(0, " + Math.round(255 * fs) + ", 0)";
                    draw_spherical_light(mvp, [-2.5 * 0.5, 2.5 * 0.8660254038, 2.0], r, 50);

                    fs = Math.min(1.0, engamma(rad[2] * rad_max));
                    ctx.fillStyle = "rgb(0, 0, " + Math.round(255 * fs) + ")";
                    draw_spherical_light(mvp, [-2.5 * 0.5, -2.5 * 0.8660254038, 2.0], r, 50);
                }

                if (mvp[8] < 0.0) {

                    draw_lights();
                }

                let edge_n = 120;
                let rr = 3.0;
                ctx.strokeStyle = "#333";

                ctx.beginPath();

                for (let i = 0; i <= edge_n; i++) {
                    let t = Math.PI * 2 * i / edge_n;
                    let p = [rr * Math.cos(t), rr * Math.sin(t), 0];

                    p = ray_project(mat3_mul_vec(proj_rot, p));

                    ctx.lineTo(p[0], p[1]);
                }

                if (mvp[8] < 0.0) {

                    ctx.fillStyle = "#000";
                    ctx.fill();
                }
                ctx.stroke();

                if (mvp[8] >= 0.0) {

                    draw_lights();
                }
            }
            else if (mode === "cosine_flat") {

                let a = Math.PI * 0.9 * (arg0 - 0.5);
                let d = 1.75 + arg1 * 1.5;
                let b = 3.5;
                let r = 0.15;
                let light_pos = [d * Math.sin(a), 0, d * Math.cos(a)];


                if (mvp[8] >= 0.0) {

                    gl.begin(width, height);
                    gl.draw_simple(mvp, light_pos, r, b, 40);
                    ctx.drawImage(gl.finish(), 0, 0, width, height);
                }

                ctx.translate(width * 0.5, height * 0.5);

                let proj_rot = mvp;
                proj_rot = mat3_mul(x_flip, proj_rot);

                function draw_light() {
                    let p;
                    ctx.lineWidth = 2.0;
                    ctx.strokeStyle = "#3260E5";
                    ctx.globalAlpha = 0.5;
                    ctx.beginPath();
                    p = ray_project(mat3_mul_vec(proj_rot, [1.75 * Math.sin(a), 0, 1.75 * Math.cos(a)]));
                    ctx.moveTo(p[0], p[1]);

                    p = ray_project(mat3_mul_vec(proj_rot, [3.25 * Math.sin(a), 0, 3.25 * Math.cos(a)]));
                    ctx.lineTo(p[0], p[1]);
                    ctx.stroke();

                    ctx.globalAlpha = 0.3;

                    ctx.strokeStyle = "#E9A923";
                    ctx.beginPath();
                    let n = 40;
                    for (let i = 0; i <= n; i++) {
                        let a = Math.PI * 0.9 * (i / n - 0.5);
                        p = ray_project(mat3_mul_vec(proj_rot, [d * Math.sin(a), 0, d * Math.cos(a)]));
                        ctx.lineTo(p[0], p[1]);
                    }


                    ctx.stroke();
                    ctx.globalAlpha = 1.0;

                    ctx.fillStyle = "white";
                    draw_spherical_light(mvp, light_pos, r, 30);
                }



                if (mvp[8] < 0.0)
                    draw_light();

                ctx.lineWidth = 1.0;

                draw_plane(proj_rot, b);

                if (mvp[8] >= 0.0)
                    draw_light();
            } else if (mode === "ray_flat") {

                let a = Math.PI * 0.9 * (arg0 - 0.5);
                let d = 1.75 + arg1 * 1.5;
                let b = 3.5;
                let r = 0.15;
                let light_pos = [d * Math.sin(a), 0, d * Math.cos(a)];


                if (mvp[8] >= 0.0) {

                    gl.begin(width, height);
                    gl.draw_simple(mvp, light_pos, r, b, 40);
                    ctx.drawImage(gl.finish(), 0, 0, width, height);
                }

                ctx.translate(width * 0.5, height * 0.5);

                let proj_rot = mvp;
                proj_rot = mat3_mul(x_flip, proj_rot);

                function draw_light() {
                    let p;
                    ctx.lineWidth = 2.0;
                    ctx.strokeStyle = "#235AB9";
                    ctx.globalAlpha = 0.5;
                    ctx.beginPath();
                    p = ray_project(mat3_mul_vec(proj_rot, [1.75 * Math.sin(a), 0, 1.75 * Math.cos(a)]));
                    ctx.moveTo(p[0], p[1]);

                    p = ray_project(mat3_mul_vec(proj_rot, [3.25 * Math.sin(a), 0, 3.25 * Math.cos(a)]));
                    ctx.lineTo(p[0], p[1]);
                    ctx.stroke();

                    ctx.globalAlpha = 0.3;

                    ctx.strokeStyle = "#E9A923";
                    ctx.beginPath();
                    let n = 40;
                    for (let i = 0; i <= n; i++) {
                        let a = Math.PI * 0.9 * (i / n - 0.5);
                        p = ray_project(mat3_mul_vec(proj_rot, [d * Math.sin(a), 0, d * Math.cos(a)]));
                        ctx.lineTo(p[0], p[1]);
                    }


                    ctx.stroke();
                    ctx.globalAlpha = 1.0;

                    let size = b * 0.5;

                    let c = ray_project(mat3_mul_vec(proj_rot, light_pos));

                    ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
                    ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
                    ctx.lineWidth = 1.0;

                    for (let i = 0; i < rand_vertices.length; i++) {

                        let v = vec_scale(rand_vertices[i], 0.6);
                        let ray = v;

                        v = vec_add(v, light_pos);

                        let hit = false;

                        if (ray[2] < 0.0) {
                            let intersection = vec_scale(ray, -light_pos[2] / ray[2]);
                            intersection = vec_add(intersection, light_pos);
                            if (Math.abs(intersection[0]) < size && Math.abs(intersection[1]) < size) {
                                v = intersection;
                                hit = true;
                            }
                        }

                        let p = ray_project(mat3_mul_vec(proj_rot, v));

                        ctx.strokeStyle = "rgba(255, 255, 255, " + (hit ? 0.25 : 0.05) + ")";

                        ctx.beginPath();
                        ctx.moveTo(c[0], c[1]);
                        ctx.lineTo(p[0], p[1]);
                        ctx.stroke();

                        if (hit) {
                            ctx.fillStyle = "rgba(255, 227, 120, 0.8)"
                            ctx.fillEllipse(p[0], p[1], 1.25);
                        }
                    }

                    ctx.fillStyle = "white";
                    draw_spherical_light(mvp, light_pos, r, 30);
                }

                if (mvp[8] < 0.0)
                    draw_light();

                draw_plane(proj_rot, b);

                if (mvp[8] >= 0.0)
                    draw_light();
            }

            else if (mode === "cosine_sphere") {

                ctx.translate(width * 0.5, height * 0.5);

                let proj_rot = mvp;
                proj_rot = mat3_mul(x_flip, proj_rot);


                function draw_arrow() {
                    let p0 = [0, 0, 3.6]
                    let p1 = [0, 0, 2.5];
                    let pa = [0, 0, 3.8];

                    ctx.lineWidth = 3;
                    ctx.strokeStyle = "#E9A923";
                    ctx.fillStyle = "#E9A923"

                    let p;
                    ctx.beginPath();
                    p = ray_project(mat3_mul_vec(proj_rot, p0));
                    ctx.moveTo(p[0], p[1]);

                    p = ray_project(mat3_mul_vec(proj_rot, p1));
                    ctx.lineTo(p[0], p[1]);

                    ctx.stroke();

                    draw_arrow_tip(pa, rot_y_mat3(0), proj_rot, 0.08);

                }


                if (proj_rot[8] <= 0.0)
                    draw_arrow();

                gl.begin(width, height);
                gl.draw_cosine_sphere(mvp);
                ctx.drawImage(gl.finish(), -width / 2, -height / 2, width, height);

                ctx.save();
                ctx.globalCompositeOperation = "destination-out";
                ctx.strokeStyle = "black";
                ctx.lineWidth = 1.0;
                ctx.strokeEllipse(0, 0, 0.2468 * height);

                ctx.restore();

                if (proj_rot[8] > 0.0)
                    draw_arrow();

            }
            else if (mode === "area") {

                let lw = 0.9;
                let lh = 0.7;

                let a = -Math.PI * (arg1 * 0.37 + 0.5) + Math.PI;
                let d = 5;
                let dist = 2.75;
                let light_pos = [0, dist * Math.cos(a), dist * Math.sin(a)];

                let light_mat = rot_x_mat3(Math.PI * 0.5);
                light_mat = mat3_mul(rot_z_mat3(Math.PI * (arg0 - 0.5)), light_mat);
                light_mat = mat3_mul(rot_x_mat3(a), light_mat);

                if (mvp[8] >= 0.0) {

                    gl.begin(width, height);
                    gl.draw_area(mvp, light_mat, light_pos);
                    ctx.drawImage(gl.finish(), 0, 0, width, height);
                }

                ctx.translate(width * 0.5, height * 0.5);

                let proj_rot = ident_matrix;
                proj_rot = mat3_mul(proj_rot, x_flip);
                proj_rot = mat3_mul(proj_rot, mvp);


                if (mvp[8] < 0.0)
                    draw_area_light();

                draw_plane(proj_rot, d);

                if (mvp[8] >= 0.0)
                    draw_area_light();

                function draw_area_light() {

                    let points = [];

                    let p;
                    p = [-lw, -lh, 0];
                    p = mat3_mul_vec(light_mat, p);
                    p = vec_add(p, light_pos);
                    p = ray_project(mat3_mul_vec(proj_rot, p));
                    points.push(p.slice(0, 2));

                    p = [lw, -lh, 0];
                    p = mat3_mul_vec(light_mat, p);
                    p = vec_add(p, light_pos);
                    p = ray_project(mat3_mul_vec(proj_rot, p));
                    points.push(p.slice(0, 2));

                    p = [lw, lh, 0];
                    p = mat3_mul_vec(light_mat, p);
                    p = vec_add(p, light_pos);
                    p = ray_project(mat3_mul_vec(proj_rot, p));
                    points.push(p.slice(0, 2));

                    p = [-lw, lh, 0];
                    p = mat3_mul_vec(light_mat, p);
                    p = vec_add(p, light_pos);
                    p = ray_project(mat3_mul_vec(proj_rot, p));
                    points.push(p.slice(0, 2));


                    let sum = 0.0;
                    for (let i = 0; i < 4; i++)
                        sum += vec_cross(points[i], points[(i + 1) & 3])[2];

                    ctx.beginPath();
                    for (let i = 0; i < 4; i++)
                        ctx.lineTo(points[i][0], points[i][1]);

                    ctx.closePath();


                    ctx.fillStyle = sum < 0.0 ? "#fff" : "#000";
                    ctx.fill();

                    ctx.strokeStyle = "#333";
                    ctx.stroke();
                }



            } else if (mode === "ambient_occ") {

                let lw = 1.0;
                let lh = 1.0;
                let z = arg0 * 2 + 0.1;

                let proj_rot = mat3_mul(x_flip, mvp);

                if (mvp[8] >= 0.0) {


                    gl.begin(width, height);
                    gl.draw_ambient(mvp, [lw, lh, z], 0.0);
                    ctx.drawImage(gl.finish(), 0, 0, width, height);

                }

                let points = [];

                let fs = 255 * (1.055 * Math.pow(0.5, 1.0 / 2.4) - 0.055);
                let style = "rgb(" + fs + "," + fs + "," + fs + ")";

                ctx.translate(Math.round(width * 0.5), Math.round(height * 0.5));
                if (mvp[8] >= 0.0)
                    draw_plane(proj_rot, 5, style, style);

                let p;
                p = [-lw, -lh, z];
                p = ray_project(mat3_mul_vec(proj_rot, p));
                points.push(p.slice(0, 2));

                p = [lw, -lh, z];
                p = ray_project(mat3_mul_vec(proj_rot, p));
                points.push(p.slice(0, 2));

                p = [lw, lh, z];
                p = ray_project(mat3_mul_vec(proj_rot, p));
                points.push(p.slice(0, 2));

                p = [-lw, lh, z];
                p = ray_project(mat3_mul_vec(proj_rot, p));
                points.push(p.slice(0, 2));

                ctx.beginPath();
                for (let i = 0; i < 4; i++)
                    ctx.lineTo(points[i][0], points[i][1]);

                ctx.closePath();

                ctx.fillStyle = "#000";
                ctx.strokeStyle = "#000";
                ctx.fill();
                ctx.stroke();

                if (mvp[8] < 0.0)
                    draw_plane(proj_rot, 5, style, style);

            } else if (mode === "ambient_proj") {

                let lw = 1.0;
                let lh = 1.0;
                let z = arg0 * 2 + 1.25;
                let r = 1;

                let proj_rot = mat3_mul(x_flip, mvp);


                {
                    gl.begin(width, height);
                    gl.draw_ambient(mvp, [lw, lh, z], 1.0);
                    ctx.drawImage(gl.finish(), 0, 0, width, height);
                }




                let points = [];
                let lpoints = [];
                let fs = 255 * (1.055 * Math.pow(0.5, 1.0 / 2.4) - 0.055);
                let style = "rgb(" + fs + "," + fs + "," + fs + ")";

                ctx.translate(Math.round(width * 0.5), Math.round(height * 0.5));

                let p;
                p = [-lw, -lh, z];
                lpoints.push(p);
                p = mat3_mul_vec(proj_rot, p);
                p = ray_project(p);
                points.push(p.slice(0, 2));

                p = [lw, -lh, z];
                lpoints.push(p);
                p = mat3_mul_vec(proj_rot, p);
                p = ray_project(p);
                points.push(p.slice(0, 2));

                p = [lw, lh, z];
                lpoints.push(p);
                p = mat3_mul_vec(proj_rot, p);
                p = ray_project(p);
                points.push(p.slice(0, 2));

                p = [-lw, lh, z];
                lpoints.push(p);
                p = mat3_mul_vec(proj_rot, p);
                p = ray_project(p);
                points.push(p.slice(0, 2));

                draw_plane(proj_rot, 5, style, style);


                {
                    ctx.beginPath();

                    let edge_n = 20;
                    for (let edge = 0; edge < 4; edge++) {
                        let p0 = lpoints[edge];
                        let p1 = lpoints[(edge + 1) % 4];
                        let d = vec_sub(p1, p0);

                        for (let i = 0; i < edge_n; i++) {
                            let p = vec_add(p0, vec_scale(d, i / (edge_n - 1)));

                            p = vec_norm(p);
                            p = vec_scale(p, r);
                            p[2] = 0;
                            p = ray_project(mat3_mul_vec(proj_rot, p));

                            ctx.lineTo(p[0], p[1]);
                        }

                    }
                    ctx.closePath();

                    {
                        let edge_n = 120;

                        ctx.strokeStyle = "#EDB235";

                        for (let i = 0; i <= edge_n; i++) {
                            let t = Math.PI * 2 * i / edge_n;
                            let p = [r * Math.cos(t), r * Math.sin(t), 0];

                            p = ray_project(mat3_mul_vec(proj_rot, p));

                            if (i == 0)
                                ctx.moveTo(p[0], p[1]);
                            else
                                ctx.lineTo(p[0], p[1]);
                        }

                    }

                    ctx.fillStyle = "rgba(233, 169, 35, 0.5)";
                    ctx.strokeStyle = "#E9A923";
                    ctx.fill("evenodd");
                    ctx.stroke();
                }


                {
                    ctx.lineWidth = 1;
                    ctx.strokeStyle = "rgba(0,0,0,0.1)"
                    for (let i = 0; i < 4; i++) {
                        ctx.beginPath();

                        ctx.lineTo(0, 0);

                        let p = lpoints[i];
                        p = ray_project(mat3_mul_vec(proj_rot, p));

                        ctx.lineTo(p[0], p[1]);

                        ctx.stroke();

                    }

                    for (let i = 0; i < 4; i++) {
                        ctx.beginPath();

                        let p = lpoints[i];
                        p = vec_norm(p);
                        let pp = p;
                        p = ray_project(mat3_mul_vec(proj_rot, p));

                        ctx.lineTo(p[0], p[1]);

                        
                        pp[2] = 0;
                        p = ray_project(mat3_mul_vec(proj_rot, pp));

                        ctx.lineTo(p[0], p[1]);

                        ctx.stroke();
                    }
                }


                {
                    ctx.beginPath();

                    let edge_n = 20;
                    for (let edge = 0; edge < 4; edge++) {
                        let p0 = lpoints[edge];
                        let p1 = lpoints[(edge + 1) % 4];
                        let d = vec_sub(p1, p0);

                        for (let i = 0; i < edge_n; i++) {
                            let p = vec_add(p0, vec_scale(d, i / (edge_n - 1)));

                            p = vec_norm(p);
                            p = vec_scale(p, r);
                            p = ray_project(mat3_mul_vec(proj_rot, p));

                            ctx.lineTo(p[0], p[1]);
                        }

                    }
                    ctx.fillStyle = "rgba(233, 169, 35, 0.5)";
                    ctx.strokeStyle = "#E9A923";
                    ctx.stroke();
                }


                ctx.beginPath();
                for (let i = 0; i < 4; i++)
                    ctx.lineTo(points[i][0], points[i][1]);

                ctx.closePath();

                ctx.fillStyle = "#000";
                ctx.strokeStyle = "#000";
                ctx.fill();
                ctx.stroke();

                if (mvp[8] < 0.0)
                    draw_plane(proj_rot, 5, style, style);

            }

            else if (mode === "bounce" || mode === "bounce_steps") {

                let proj_rot = mat3_mul(x_flip, mvp);

                let a = Math.PI * 0.25;
                let light_pos = [0, 1.5 * Math.cos(a), 1.5 * Math.sin(a)];

                let lw = 4;
                let lh = 4;

                let last_mode = 9.0;

                let points0 = [];

                let p;

                p = [lw * 0.5, -lh * 0.5, -lh * 0.5];
                p = ray_project(mat3_mul_vec(proj_rot, p));
                points0.push(p.slice(0, 2));

                p = [lw * 0.5, lh * 0.5, -lh * 0.5];
                p = ray_project(mat3_mul_vec(proj_rot, p));
                points0.push(p.slice(0, 2));

                p = [-lw * 0.5, lh * 0.5, -lh * 0.5];
                p = ray_project(mat3_mul_vec(proj_rot, p));
                points0.push(p.slice(0, 2));

                p = [-lw * 0.5, -lh * 0.5, -lh * 0.5];
                p = ray_project(mat3_mul_vec(proj_rot, p));
                points0.push(p.slice(0, 2));


                let sum0 = 0.0;
                for (let i = 0; i < 4; i++)
                    sum0 += vec_cross(points0[i], points0[(i + 1) & 3])[2];

                let points1 = [];

                p = [lw * 0.5, -lh * 0.5, -lh * 0.5];
                p = ray_project(mat3_mul_vec(proj_rot, p));
                points1.push(p.slice(0, 2));

                p = [lw * 0.5, -lh * 0.5, lh * 0.5];
                p = ray_project(mat3_mul_vec(proj_rot, p));
                points1.push(p.slice(0, 2));


                p = [-lw * 0.5, -lh * 0.5, lh * 0.5];
                p = ray_project(mat3_mul_vec(proj_rot, p));
                points1.push(p.slice(0, 2));

                p = [-lw * 0.5, -lh * 0.5, -lh * 0.5];
                p = ray_project(mat3_mul_vec(proj_rot, p));
                points1.push(p.slice(0, 2));




                let sum1 = 0.0;
                for (let i = 0; i < 4; i++)
                    sum1 += vec_cross(points1[i], points1[(i + 1) & 3])[2];


                let lpoints = [];

                p = [1.0, 0.0, 0.0];
                p = ray_project(mat3_mul_vec(proj_rot, p));
                lpoints.push(p.slice(0, 2));

                p = [1.0, 0.0, 2.0];
                p = ray_project(mat3_mul_vec(proj_rot, p));
                lpoints.push(p.slice(0, 2));

                p = [-1.0, 0.0, 2.0];
                p = ray_project(mat3_mul_vec(proj_rot, p));
                lpoints.push(p.slice(0, 2));

                p = [-1.0, 0.0, 0.0];
                p = ray_project(mat3_mul_vec(proj_rot, p));
                lpoints.push(p.slice(0, 2));


                let lsum = 0.0;
                for (let i = 0; i < 4; i++)
                    lsum += vec_cross(lpoints[i], lpoints[(i + 1) & 3])[2];


                let pow = arg0 * arg0 * 499.8 + 0.2;

                let radiance = [pow, pow];
                let offsets = [0, 0];

                if (mode === "bounce_steps") {
                    pow = 300.0;
                    if (arg0 == 0.0)
                        radiance = [0, 0];
                    else if (arg0 == 1.0)
                        radiance = [pow, 0];
                    else
                        radiance = [0, pow];

                    offsets = [arg0 % 2 == 1.0 ? 0.2 * (arg0 - 1) / 2 : 10.0,
                    arg0 % 2 == 0.0 ? 0.2 * (arg0) / 2 : 10.0,]

                    if (arg0 === last_mode) {
                        radiance = [pow, pow];
                        offsets = [0, 0];
                    }
                }

                gl.begin(width, height);
                gl.draw_bounce(mvp, light_pos, radiance, offsets);
                ctx.drawImage(gl.finish(), 0, 0, width, height);

                ctx.translate(Math.round(width * 0.5), Math.round(height * 0.5));


                if (sum0 <= 0.0) {
                    ctx.save();

                    ctx.beginPath();
                    for (let i = 0; i < 4; i++)
                        ctx.lineTo(points0[i][0], points0[i][1]);

                    ctx.strokeStyle = "#000";
                    if (mode === "bounce_steps" && arg0 != last_mode) {
                        ctx.strokeStyle = "#111";
                        ctx.closePath();
                    }
                    ctx.stroke();
                    ctx.restore();
                }

                if (sum1 > 0.0) {
                    ctx.save();

                    ctx.beginPath();
                    for (let i = 0; i < 4; i++)
                        ctx.lineTo(points1[i][0], points1[i][1]);

                    ctx.strokeStyle = "#000";
                    if (mode === "bounce_steps" && arg0 != last_mode) {
                        ctx.strokeStyle = "#111";
                        ctx.closePath();
                    }

                    ctx.stroke();
                    ctx.restore();
                }

                ctx.beginPath();
                for (let i = 0; i < 4; i++)
                    ctx.lineTo(lpoints[i][0], lpoints[i][1]);

                ctx.closePath();

                let fs = 255 * Math.min(1.0, (1.055 * Math.pow(pow, 1.0 / 2.4) - 0.055));

                if (mode === "bounce" || arg0 === 0 || arg0 === last_mode) {
                    ctx.fillStyle = lsum > 0.0 ? "rgb(" + fs + "," + fs + "," + fs + ")" : "#000";


                    ctx.fill();

                    if (lsum <= 0.0) {
                        ctx.strokeStyle = "#333";
                        ctx.stroke();
                    }
                } else {
                    ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
                    ctx.stroke();
                }




                if (sum0 > 0.0) {
                    ctx.beginPath();
                    for (let i = 0; i < 4; i++)
                        ctx.lineTo(points0[i][0], points0[i][1]);

                    ctx.closePath();

                    ctx.fillStyle = "#000";
                    ctx.strokeStyle = "#333";
                    ctx.fill();
                    ctx.stroke();
                }

                if (sum1 < 0.0) {
                    ctx.beginPath();
                    for (let i = 0; i < 4; i++)
                        ctx.lineTo(points1[i][0], points1[i][1]);

                    ctx.closePath();

                    ctx.fillStyle = "#000";
                    ctx.strokeStyle = "#333";
                    ctx.fill();
                    ctx.stroke();
                }
            }
            else if (mode === "shadow" || mode === "shadow2") {

                let proj_rot = mvp;
                proj_rot = mat3_mul(x_flip, proj_rot);

                let lw = 3.0 * (arg1 * 0.98 + 0.02);
                let lh = 2.0 * (arg1 * 0.98 + 0.02);
                let a = Math.PI * 0.5 * (arg0 * 0.5 + 0.25);
                let light_pos = [0, 3 * Math.cos(a), 3 * Math.sin(a)];
                let light_size = [lw, lh, 2 / (lw * lh)];

                let light_mat = rot_x_mat3(a + Math.PI * 0.5);

                let sw = 1.0;
                let sh = 1.5;

                if (mode === "shadow2") {
                    lw = 2.0 * (arg1 * 0.97 + 0.03);
                    lh = 2.0 * ((1 - arg1) * 0.97 + 0.03);
                    a = -Math.PI * 0.68 * (arg0 - 0.5) + Math.PI * 0.5;
                    light_pos = [2 * Math.cos(a), 2 * Math.sin(a), 2];
                    light_size = [lw, lh, 2 / (lw * lh)];

                    light_mat = rot_x_mat3(Math.PI * 0.75);
                    light_mat = mat3_mul(rot_z_mat3(a - Math.PI * 0.5), light_mat);
                }


                if (mvp[8] >= 0.0) {

                    gl.begin(width, height);
                    gl.draw_shadow(mvp, light_mat, light_pos, light_size);
                    ctx.drawImage(gl.finish(), 0, 0, width, height);
                }

                lw *= 0.5;
                lh *= 0.5;

                ctx.translate(Math.round(width * 0.5), Math.round(height * 0.5));

                function draw_wall() {

                    let p;
                    ctx.beginPath();
                    p = [-sw, 0, -0.01];
                    p = ray_project(mat3_mul_vec(proj_rot, p));
                    ctx.moveTo(p[0], p[1]);

                    p = [-sw, 0, sh];

                    p = ray_project(mat3_mul_vec(proj_rot, p));
                    ctx.lineTo(p[0], p[1]);

                    p = [sw, 0, sh];
                    p = ray_project(mat3_mul_vec(proj_rot, p));
                    ctx.lineTo(p[0], p[1]);

                    p = [sw, 0, -0.01];
                    p = ray_project(mat3_mul_vec(proj_rot, p));
                    ctx.lineTo(p[0], p[1]);

                    ctx.lineCap = "butt";
                    ctx.strokeStyle = "#333";
                    ctx.fillStyle = "#000";
                    ctx.fill();
                    ctx.stroke();

                }

                function draw_light() {
                    let points = [];

                    let p;
                    p = [-lw, -lh, 0];
                    p = mat3_mul_vec(light_mat, p);
                    p = vec_add(p, light_pos);
                    p = ray_project(mat3_mul_vec(proj_rot, p));
                    points.push(p.slice(0, 2));

                    p = [lw, -lh, 0];
                    p = mat3_mul_vec(light_mat, p);
                    p = vec_add(p, light_pos);
                    p = ray_project(mat3_mul_vec(proj_rot, p));
                    points.push(p.slice(0, 2));

                    p = [lw, lh, 0];
                    p = mat3_mul_vec(light_mat, p);
                    p = vec_add(p, light_pos);
                    p = ray_project(mat3_mul_vec(proj_rot, p));
                    points.push(p.slice(0, 2));

                    p = [-lw, lh, 0];
                    p = mat3_mul_vec(light_mat, p);
                    p = vec_add(p, light_pos);
                    p = ray_project(mat3_mul_vec(proj_rot, p));
                    points.push(p.slice(0, 2));


                    let sum = 0.0;
                    for (let i = 0; i < 4; i++)
                        sum += vec_cross(points[i], points[(i + 1) & 3])[2];

                    ctx.beginPath();
                    for (let i = 0; i < 4; i++)
                        ctx.lineTo(points[i][0], points[i][1]);

                    ctx.closePath();

                    ctx.fillStyle = (sum < 0.0) ? "#fff" : "#000";
                    ctx.strokeStyle = "#333";
                    ctx.fill();
                    ctx.stroke();
                }

                function draw_top() {
                    if (proj_rot[7] > 0) {
                        draw_wall();
                        draw_light();
                    } else {
                        draw_light();
                        draw_wall();

                    }
                }

                if (mvp[8] < 0)
                    draw_top();

                draw_plane(proj_rot, 5);

                if (mvp[8] >= 0)
                    draw_top();

            } else if (mode === "shadow_hemi") {

                ctx.lineCap = "butt";
                let proj_rot = mvp;
                proj_rot = mat3_mul(x_flip, proj_rot);

                let hemi_pos = [0.5 + arg0 * 2, -1.25, 0];
                let r = 1.25;


                let lw = 3.0 * (arg1 * 0.98 + 0.02);
                let lh = 2.0 * (arg1 * 0.98 + 0.02);
                let a = Math.PI * 0.5 * 0.5;
                let light_pos = [0, 3 * Math.cos(a), 3 * Math.sin(a)];
                let light_size = [lw, lh, 2 / (lw * lh)];

                let light_mat = rot_x_mat3(a + Math.PI * 0.5);

                let sw = 1.0;
                let sh = 1.5;

                if (mvp[8] >= 0.0) {

                    gl.begin(width, height);
                    gl.draw_shadow(mvp, light_mat, light_pos, light_size);
                    ctx.drawImage(gl.finish(), 0, 0, width, height);
                }


                lw *= 0.5;
                lh *= 0.5;

                ctx.translate(Math.round(width * 0.5), Math.round(height * 0.5));

                function draw_wall() {

                    let p;
                    ctx.beginPath();
                    p = [-sw, 0, -0.01];
                    p = ray_project(mat3_mul_vec(proj_rot, p));
                    ctx.moveTo(p[0], p[1]);

                    p = [-sw, 0, sh];
                    p = ray_project(mat3_mul_vec(proj_rot, p));
                    ctx.lineTo(p[0], p[1]);

                    p = [sw, 0, sh];
                    p = ray_project(mat3_mul_vec(proj_rot, p));
                    ctx.lineTo(p[0], p[1]);

                    p = [sw, 0, -0.01];
                    p = ray_project(mat3_mul_vec(proj_rot, p));
                    ctx.lineTo(p[0], p[1]);

                    ctx.strokeStyle = "#333";
                    ctx.fillStyle = "#000";
                    ctx.fill();
                    ctx.stroke();

                }

                function draw_light() {
                    let points = [];

                    let p;
                    p = [-lw, -lh, 0];
                    p = mat3_mul_vec(light_mat, p);
                    p = vec_add(p, light_pos);
                    p = ray_project(mat3_mul_vec(proj_rot, p));
                    points.push(p.slice(0, 2));

                    p = [lw, -lh, 0];
                    p = mat3_mul_vec(light_mat, p);
                    p = vec_add(p, light_pos);
                    p = ray_project(mat3_mul_vec(proj_rot, p));
                    points.push(p.slice(0, 2));

                    p = [lw, lh, 0];
                    p = mat3_mul_vec(light_mat, p);
                    p = vec_add(p, light_pos);
                    p = ray_project(mat3_mul_vec(proj_rot, p));
                    points.push(p.slice(0, 2));

                    p = [-lw, lh, 0];
                    p = mat3_mul_vec(light_mat, p);
                    p = vec_add(p, light_pos);
                    p = ray_project(mat3_mul_vec(proj_rot, p));
                    points.push(p.slice(0, 2));


                    let sum = 0.0;
                    for (let i = 0; i < 4; i++)
                        sum += vec_cross(points[i], points[(i + 1) & 3])[2];

                    ctx.beginPath();
                    for (let i = 0; i < 4; i++)
                        ctx.lineTo(points[i][0], points[i][1]);

                    ctx.closePath();

                    ctx.fillStyle = (sum < 0.0) ? "#fff" : "#000";
                    ctx.strokeStyle = "#333";
                    ctx.fill();
                    ctx.stroke();
                }


                function clip_poly(poly, sign) {
                    var clip_x = sw;

                    var clipped_poly = [];

                    function is_in(p) {
                        return (p[0] >= clip_x);
                    }


                    var prev = poly[poly.length - 1];
                    for (var j = 0; j < poly.length; j++) {
                        var curr = poly[j];

                        if (!vec_eq(curr, prev)) {
                            if (is_in(curr)) {
                                if (!is_in(prev)) {
                                    var dx = curr[0] - prev[0];
                                    var t = (clip_x - prev[0]) / dx;
                                    var p = vec_lerp(prev, curr, t);
                                    p[0] = clip_x;
                                    clipped_poly.push(p);
                                }

                                clipped_poly.push(curr);
                            } else if (is_in(prev)) {
                                var dx = curr[0] - prev[0];
                                var t = (clip_x - prev[0]) / dx;
                                var p = vec_lerp(prev, curr, t);
                                p[0] = clip_x;
                                clipped_poly.push(p);
                            }
                        }

                        prev = curr;
                    }

                    return clipped_poly;
                }

                let light_p = [];
                let p;
                p = [-lw, -lh, 0];
                p = mat3_mul_vec(light_mat, p);
                p = vec_add(p, light_pos);
                light_p.push(p);

                p = [lw, -lh, 0];
                p = mat3_mul_vec(light_mat, p);
                p = vec_add(p, light_pos);
                light_p.push(p);

                p = [lw, lh, 0];
                p = mat3_mul_vec(light_mat, p);
                p = vec_add(p, light_pos);
                light_p.push(p);

                p = [-lw, lh, 0];
                p = mat3_mul_vec(light_mat, p);
                p = vec_add(p, light_pos);
                light_p.push(p);

                let proj_p = [];
                for (let i = 0; i < 4; i++) {
                    let dir = vec_sub(light_p[i], hemi_pos);
                    proj_p.push(vec_add(hemi_pos, vec_scale(dir, -hemi_pos[1] / dir[1])));
                }

                proj_p = clip_poly(proj_p);


                let light_mat_inv = mat3_invert(light_mat);
                light_p = [];

                for (let i = 0; i < proj_p.length; i++) {
                    let dir = vec_sub(proj_p[i], hemi_pos);
                    let p = vec_sub(proj_p[i], light_pos);
                    p = mat3_mul_vec(light_mat_inv, p);
                    dir = mat3_mul_vec(light_mat_inv, dir);

                    p = vec_add(p, vec_scale(dir, -p[2] / dir[2]));

                    p = mat3_mul_vec(light_mat, p);
                    p = vec_add(p, light_pos);

                    light_p.push(p);
                }

                function draw_ligh_part() {
                    ctx.beginPath();

                    for (let i = 0; i < light_p.length; i++) {
                        let p = ray_project(mat3_mul_vec(proj_rot, light_p[i]));
                        ctx.lineTo(p[0], p[1]);
                    }
                    ctx.closePath();
                    ctx.fillStyle = "rgba(233, 169, 35, 0.5)";
                    ctx.strokeStyle = "#E9A923";
                    ctx.fill();
                    ctx.stroke();
                }


                function draw_hemi() {


                    function draw_lines_front() {
                        ctx.strokeStyle = "rgba(255, 255, 255, 0.2)"

                        for (let edge = 0; edge < proj_p.length; edge++) {

                            ctx.beginPath();

                            let p = mat3_mul_vec(proj_rot, proj_p[edge]);
                            p = ray_project(p);
                            ctx.lineTo(p[0], p[1]);

                            p = ray_project(mat3_mul_vec(proj_rot, light_p[edge]));
                            ctx.lineTo(p[0], p[1]);
                            ctx.stroke();

                        }
                    }


                    if (proj_rot[7] <= 0) {
                        draw_lines_front();
                        draw_wall();
                    }


                    ctx.strokeStyle = "#777"
                    ctx.fillStyle = "#777"
                    ctx.lineWidth = 2.0;

                    ctx.beginPath();
                    p = ray_project(mat3_mul_vec(proj_rot, [0.5, -1.25, 0]));
                    ctx.lineTo(p[0], p[1]);
                    p = ray_project(mat3_mul_vec(proj_rot, [2.5, -1.25, 0]));
                    ctx.lineTo(p[0], p[1]);
                    ctx.stroke();

                    p = ray_project(mat3_mul_vec(proj_rot, hemi_pos));
                    ctx.fillEllipse(p[0], p[1], 2.5);

                    ctx.strokeStyle = "rgba(255, 255, 255, 0.25)"
                    ctx.lineWidth = 1.0;


                    let base_n = 50;
                    ctx.beginPath();
                    for (let i = 0; i < base_n; i++) {
                        let a = Math.PI * 2 * i / (base_n - 1);
                        let p = [r * Math.cos(a), r * Math.sin(a), 0];
                        p = vec_add(p, hemi_pos);
                        p = ray_project(mat3_mul_vec(proj_rot, p));

                        ctx.lineTo(p[0], p[1]);
                    }
                    ctx.closePath();
                    ctx.stroke();

                    {
                        let ps = [];
                        
                        // gl2.draw_solid_angle(mvp, mat3_invert(light_mat), [0, 0],
                        // light_pos, 1.0, [hemi_pos[0], hemi_pos[1], hemi_pos[2], r]);

                        
                        for (let i = 0; i < rand_vertices.length; i++) {
                            let p = rand_vertices[i];
                            p = vec_scale(p, r);
                            p = vec_add(p, hemi_pos);
                            if (p[2] < 0)
                                p[2] = -p[2];
                            
                            p = ray_project(mat3_mul_vec(proj_rot, p));
                            ps.push(p);
                        }

                        let base_n = 50;
                        for (let i = 0; i < base_n; i++) {
                            let a = Math.PI * 2 * i / (base_n - 1);
                            let p = [r * Math.cos(a), r * Math.sin(a), 0];
                            p = vec_add(p, hemi_pos);
                            p = ray_project(mat3_mul_vec(proj_rot, p));
                            ps.push(p);
                        }


                        ps = convex_hull(ps);
                        ctx.beginPath();
                        for (let i = 0; i < ps.length; i++) {
                            ctx.lineTo(ps[i][0], ps[i][1]);
                        }
                        ctx.fillStyle = "rgba(255,255,255,0.15)"
                        ctx.fill();
                    }

                    let edge_n = 10;

                    ctx.beginPath();

                    for (let edge = 0; edge < proj_p.length; edge++) {
                        let p0 = light_p[edge];
                        let p1 = light_p[(edge + 1) % proj_p.length];
                        let d = vec_sub(p1, p0);

                        for (let i = 0; i < edge_n; i++) {
                            let p = vec_add(p0, vec_scale(d, i / (edge_n - 1)));

                            p = vec_norm(vec_sub(p, hemi_pos));
                            p = vec_scale(p, r);
                            p = vec_add(p, hemi_pos);
                            p[2] = 0;
                            p = ray_project(mat3_mul_vec(proj_rot, p));

                            ctx.lineTo(p[0], p[1]);
                        }

                    }
                    ctx.fillStyle = "rgba(233, 169, 35, 0.5)";
                    ctx.strokeStyle = "#E9A923";
                    ctx.fill();
                    ctx.stroke();

                    ctx.beginPath();

                    for (let edge = 0; edge < proj_p.length; edge++) {
                        let p0 = proj_p[edge];
                        let p1 = proj_p[(edge + 1) % proj_p.length];
                        let d = vec_sub(p1, p0);

                        for (let i = 0; i < edge_n; i++) {
                            let p = vec_add(p0, vec_scale(d, i / (edge_n - 1)));

                            p = vec_norm(vec_sub(p, hemi_pos));
                            p = vec_scale(p, r);
                            p = vec_add(p, hemi_pos);
                            p = ray_project(mat3_mul_vec(proj_rot, p));

                            ctx.lineTo(p[0], p[1]);
                        }
                    }

                    ctx.fillStyle = "rgba(233, 169, 35, 0.5)";
                    ctx.strokeStyle = "#E9A923";

                    if (mode === "hemisphere")
                        ctx.fill();

                    ctx.stroke();


                    ctx.strokeStyle = "rgba(255, 255, 255, 0.2)"

                    for (let edge = 0; edge < proj_p.length; edge++) {

                        ctx.beginPath();

                        let p = proj_p[edge];
                        let sphere_p = vec_add(vec_scale(vec_norm(vec_sub(p, hemi_pos)), r), hemi_pos);

                        p = mat3_mul_vec(proj_rot, p);

                        p = ray_project(p);
                        ctx.lineTo(p[0], p[1]);

                        p = hemi_pos;
                        p = ray_project(mat3_mul_vec(proj_rot, p));
                        ctx.lineTo(p[0], p[1]);
                        ctx.stroke();

                        ctx.beginPath();

                        p = ray_project(mat3_mul_vec(proj_rot, sphere_p));
                        ctx.lineTo(p[0], p[1]);

                        sphere_p[2] = 0;

                        p = ray_project(mat3_mul_vec(proj_rot, sphere_p));
                        ctx.lineTo(p[0], p[1]);

                        ctx.stroke();
                    }

                    if (proj_rot[7] > 0) {
                        draw_wall();

                        draw_lines_front();
                    }


                }

                function draw_top() {
                    if (proj_rot[7] > 0) {
                        draw_hemi();
                        draw_light();
                        draw_ligh_part()
                    } else {
                        draw_light();
                        draw_ligh_part()
                        draw_hemi();
                    }
                }

                if (mvp[8] < 0)
                    draw_top();

                draw_plane(proj_rot, 5);

                if (mvp[8] >= 0)
                    draw_top();


            } else if (mode === "inv_square") {

                ctx.translate(width * 0.5, height * 0.5);
                let s = height * 0.4 - 5;

                let d = (arg0 * 0.85 + 0.15);

                let proj_rot = ident_matrix;
                proj_rot = mat3_mul(proj_rot, x_flip);
                proj_rot = mat3_mul(proj_rot, mvp);



                let disc_color = "rgba(255, 227, 120, 0.8)"

                // back tips
                ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
                ctx.fillStyle = disc_color;
                ctx.lineWidth = 1.0;

                for (let i = 0; i < rand_vertices.length; i++) {
                    let v = mat3_mul_vec(proj_rot, rand_vertices[i]);
                    if (v[2] <= 0)
                        continue;

                    let p0 = project(vec_scale(v, 1.2));
                    let p1 = project(vec_scale(v, d));

                    ctx.beginPath(1);
                    ctx.moveTo(s * p0[0], s * p0[1]);
                    ctx.lineTo(s * p1[0], s * p1[1]);
                    ctx.stroke();

                    ctx.fillEllipse(s * p1[0], s * p1[1], 1.5);
                }

                // centers

                for (let i = 0; i < rand_vertices.length; i++) {


                    let p1 = project(vec_scale(mat3_mul_vec(proj_rot, rand_vertices[i]), d));

                    ctx.beginPath(1);
                    ctx.moveTo(0, 0);
                    ctx.lineTo(s * p1[0], s * p1[1]);
                    ctx.stroke();
                }



                // front tips

                ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
                ctx.fillStyle = "rgba(25, 25, 25, 0.8)";

                ctx.fillEllipse(0, 0, s * d);

                ctx.fillStyle = "white";
                ctx.fillEllipse(0, 0, 5);


                ctx.fillStyle = disc_color;

                for (let i = 0; i < rand_vertices.length; i++) {

                    let v = mat3_mul_vec(proj_rot, rand_vertices[i]);

                    if (v[2] > 0)
                        continue;

                    let p0 = project(vec_scale(v, 1.2));
                    let p1 = project(vec_scale(v, d));

                    ctx.fillEllipse(s * p1[0], s * p1[1], 1.5);

                    ctx.beginPath(1);
                    ctx.moveTo(s * p0[0], s * p0[1]);
                    ctx.lineTo(s * p1[0], s * p1[1]);
                    ctx.stroke();

                }
            } else if (mode === "cosine") {

                mvp = mat3_mul(rot_x_mat3(-1.0), rot_z_mat3(-0.6));

                let a = Math.PI * 0.9 * (arg0 - 0.5);

                ctx.translate(Math.round(width * 0.5), Math.round(height * 0.5));

                let proj_rot = mvp;
                proj_rot = mat3_mul(x_flip, proj_rot);


                let s0 = 11.0;
                let s1 = 0.7;

                let b = 0.2;
                let r = 0.1;
                let d = 2.0;
                let light_pos = [0, 0, d];
                let org_light_pos = light_pos;
                let rot = rot_y_mat3(a);


                light_pos = mat3_mul_vec(rot, light_pos);
                function draw_light(s, k, small_dot) {

                    let size = b * 0.5;

                    let c = ray_project(mat3_mul_vec(proj_rot, light_pos));

                    ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
                    ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
                    ctx.lineWidth = 1.0 / s;

                    for (let i = 0; i < plane_vertices.length; i += k) {

                        let v = plane_vertices[i];
                        let org_ray = v;
                        v = mat3_mul_vec(rot, v);

                        let ray = v;

                        let hit = false;
                        v = vec_add(v, light_pos);

                        let intersection = vec_scale(org_ray, -org_light_pos[2] / org_ray[2]);
                        intersection = vec_add(intersection, org_light_pos);
                        if (Math.abs(intersection[0]) < size * 0.97 && Math.abs(intersection[1]) < size * 0.97) {

                            let int = vec_scale(ray, -light_pos[2] / ray[2]);
                            int = vec_add(int, light_pos);
                            v = int;
                            if (Math.abs(int[0]) < size && Math.abs(int[1]) < size) {

                                hit = true;
                            }
                        } else {
                            continue;
                        }

                        let p = ray_project(mat3_mul_vec(proj_rot, v));

                        ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";

                        ctx.beginPath();
                        ctx.moveTo(c[0], c[1]);
                        ctx.lineTo(p[0], p[1]);
                        ctx.stroke();

                        if (hit)
                            ctx.fillStyle = "rgba(255, 227, 120, 0.8)"
                        else
                            ctx.fillStyle = "rgba(255, 0, 0, 0.8)"

                        ctx.fillEllipse(p[0], p[1], (small_dot ? 0.5 : 1.5) / s);
                    }

                    ctx.fillStyle = "white";
                    draw_spherical_light(mvp, light_pos, r, 30);
                }

                let zoom_r = Math.round(height * 0.3);

                ctx.translate(Math.round(width * 0.15), Math.round(height * 0.15));

                ctx.fillStyle = "#000";
                ctx.fillRect(-zoom_r, -zoom_r, 2 * zoom_r, 2 * zoom_r);
                ctx.globalCompositeOperation = "destination-out";
                ctx.fillEllipse(0, 0, zoom_r);


                {
                    ctx.save();
                    ctx.globalCompositeOperation = "destination-over";

                    ctx.beginPath();
                    ctx.rect(-zoom_r, -zoom_r, 2 * zoom_r, 2 * zoom_r);
                    ctx.clip();

                    ctx.scale(s0, s0);

                    draw_light(s0, 1);
                    ctx.lineWidth = 3.0 / s0;

                    draw_plane(proj_rot, b, "#080808", "#444", true);
                    draw_plane(proj_rot, b * 20, "#080808", "#222", true);


                    ctx.restore();

                }

                ctx.globalCompositeOperation = "source-over";
                ctx.strokeStyle = "#555";

                ctx.lineWidth = 1.5;
                ctx.strokeEllipse(0, 0, zoom_r);

                ctx.translate(Math.round(-width * 0.35), Math.round(-height * 0.35));

                {
                    ctx.save();

                    ctx.scale(s1, s1);
                    ctx.lineWidth = 1.0 / s1;

                    draw_plane(proj_rot, b * 20, "#080808", "#222", true);
                    draw_plane(proj_rot, b, "#000", "#333", true);


                    ctx.globalAlpha = 0.3;
                    ctx.lineWidth = 1.5 / s1;

                    ctx.strokeStyle = "#E9A923";
                    ctx.beginPath();
                    let n = 40;
                    for (let i = 0; i <= n; i++) {
                        let a = Math.PI * 0.9 * (i / n - 0.5);
                        let p = ray_project(mat3_mul_vec(proj_rot, [d * Math.sin(a), 0, d * Math.cos(a)]));
                        ctx.lineTo(p[0], p[1]);
                    }

                    ctx.stroke();
                    ctx.globalAlpha = 1.0;

                    draw_light(s1, 6, true);

                    ctx.restore();
                }
                {

                    ctx.save();
                    ctx.lineWidth = 1.0;
                    ctx.setLineDash([2, 2]);

                    ctx.strokeEllipse(0, 0, zoom_r * s1 / s0);

                    ctx.rotate(-Math.PI * 0.25);

                    {
                        let r0 = zoom_r * s1 / s0;
                        let r1 = zoom_r;

                        let d = width * Math.sqrt(2) * 0.35;
                        var cos = (r1 - r0) / d;
                        var sin = Math.sqrt(1 - cos * cos);

                        ctx.beginPath();

                        ctx.moveTo(- sin * r1, d - r1 * cos);
                        ctx.lineTo(- sin * r0, - r0 * cos);
                        ctx.stroke();

                        ctx.beginPath();
                        ctx.moveTo(sin * r1, d - r1 * cos);
                        ctx.lineTo(sin * r0, - r0 * cos);
                        ctx.stroke();
                    }


                    ctx.restore();
                }
            } else if (mode === "distance") {

                mvp = mat3_mul(rot_x_mat3(-1.0), rot_z_mat3(-0.6));

                ctx.translate(Math.round(width * 0.5), Math.round(height * 0.5));

                let proj_rot = mvp;
                proj_rot = mat3_mul(x_flip, proj_rot);


                let s0 = 11.0;
                let s1 = 0.7;

                let b = 0.2;
                let r = 0.1;
                let d = 2.0 + arg0 * 1.25;
                let light_pos = [0, 0, d];
                let org_light_pos = [0, 0, 2.0];

                function draw_light(s, k, small_dot) {

                    let size = b * 0.5;

                    let c = ray_project(mat3_mul_vec(proj_rot, light_pos));

                    ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
                    ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
                    ctx.lineWidth = 1.0 / s;

                    for (let i = 0; i < plane_vertices.length; i += k) {

                        let v = plane_vertices[i];
                        let org_ray = v;

                        let ray = v;

                        let hit = false;
                        v = vec_add(v, light_pos);

                        let intersection = vec_scale(org_ray, -org_light_pos[2] / org_ray[2]);
                        intersection = vec_add(intersection, org_light_pos);
                        if (Math.abs(intersection[0]) < size && Math.abs(intersection[1]) < size) {

                            let int = vec_scale(ray, -light_pos[2] / ray[2]);
                            int = vec_add(int, light_pos);
                            v = int;
                            if (Math.abs(int[0]) < size * 1.01 && Math.abs(int[1]) < size * 1.01) {

                                hit = true;
                            }
                        } else {
                            continue;
                        }

                        let p = ray_project(mat3_mul_vec(proj_rot, v));

                        ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";

                        ctx.beginPath();
                        ctx.moveTo(c[0], c[1]);
                        ctx.lineTo(p[0], p[1]);
                        ctx.stroke();

                        if (hit)
                            ctx.fillStyle = "rgba(255, 227, 120, 0.8)"
                        else
                            ctx.fillStyle = "rgba(255, 0, 0, 0.8)"

                        ctx.fillEllipse(p[0], p[1], (small_dot ? 0.5 : 1.5) / s);
                    }

                    ctx.fillStyle = "white";
                    draw_spherical_light(mvp, light_pos, r, 30);
                }

                let zoom_r = Math.round(height * 0.3);

                ctx.translate(Math.round(width * 0.15), Math.round(height * 0.15));

                ctx.fillStyle = "#000";
                ctx.fillRect(-zoom_r, -zoom_r, 2 * zoom_r, 2 * zoom_r);
                ctx.globalCompositeOperation = "destination-out";
                ctx.fillEllipse(0, 0, zoom_r);


                {
                    ctx.save();
                    ctx.globalCompositeOperation = "destination-over";

                    ctx.beginPath();
                    ctx.rect(-zoom_r, -zoom_r, 2 * zoom_r, 2 * zoom_r);
                    ctx.clip();

                    ctx.scale(s0, s0);

                    draw_light(s0, 1);
                    ctx.lineWidth = 3.0 / s0;

                    draw_plane(proj_rot, b, "#080808", "#444", true);
                    draw_plane(proj_rot, b * 20, "#080808", "#222", true);

                    ctx.restore();

                }

                ctx.globalCompositeOperation = "source-over";
                ctx.strokeStyle = "#555";

                ctx.lineWidth = 1.5;
                ctx.strokeEllipse(0, 0, zoom_r);

                ctx.translate(Math.round(-width * 0.35), Math.round(-height * 0.35));

                {
                    ctx.save();

                    ctx.scale(s1, s1);
                    ctx.lineWidth = 1.0 / s1;

                    draw_plane(proj_rot, b * 20, "#080808", "#222", true);
                    draw_plane(proj_rot, b, "#080808", "#444", true);

                    ctx.lineWidth = 2.0;
                    ctx.strokeStyle = "#235AB9";
                    ctx.beginPath();
                    p = ray_project(mat3_mul_vec(proj_rot, [0, 0, 2]));
                    ctx.moveTo(p[0], p[1]);

                    p = ray_project(mat3_mul_vec(proj_rot, [0, 0, 3.25]));
                    ctx.lineTo(p[0], p[1]);
                    ctx.stroke();

                    draw_light(s1, 6, true);

                    ctx.restore();
                }
                {

                    ctx.save();
                    ctx.lineWidth = 1.0;
                    ctx.setLineDash([2, 2]);

                    ctx.strokeEllipse(0, 0, zoom_r * s1 / s0);

                    ctx.rotate(-Math.PI * 0.25);

                    {
                        let r0 = zoom_r * s1 / s0;
                        let r1 = zoom_r;

                        let d = width * Math.sqrt(2) * 0.35;
                        var cos = (r1 - r0) / d;
                        var sin = Math.sqrt(1 - cos * cos);

                        ctx.beginPath();

                        ctx.moveTo(- sin * r1, d - r1 * cos);
                        ctx.lineTo(- sin * r0, - r0 * cos);
                        ctx.stroke();

                        ctx.beginPath();
                        ctx.moveTo(sin * r1, d - r1 * cos);
                        ctx.lineTo(sin * r0, - r0 * cos);
                        ctx.stroke();
                    }


                    ctx.restore();
                }

            } else if (mode === "angle_small") {

                ctx.translate(Math.round(width * 0.5), Math.round(height * 0.2));

                let dmax = width * 0.4;
                let d = arg0 * dmax;



                let h = width * 0.04;
                let a = Math.atan2(h / 2, d + dmax);
                let ca = Math.cos(a);
                let sa = Math.sin(a);

                function draw_contents(s) {
                    ctx.lineWidth = s == 1 ? 1.0 : 2.0 / s;

                    ctx.strokeStyle = "#777";

                    if (s == 1)
                        ctx.strokeEllipse(-width * 0.4, 0, width * 0.05);
                    else {
                        ctx.beginPath();
                        ctx.arc(-width * 0.4, 0, width * 0.05, -1, 1);
                        ctx.stroke();
                    }

                    ctx.strokeStyle = "#444";

                    ctx.strokeStyle = "rgba(233, 169, 35, 0.5)";

                    ctx.lineWidth = s == 1 ? 1 : 1.5 / s;
                    ctx.beginPath();
                    ctx.lineTo(-width * 0.4, 0);
                    ctx.lineTo(d, h / 2);
                    ctx.stroke();

                    ctx.beginPath();
                    ctx.lineTo(-width * 0.4, 0);
                    ctx.lineTo(d, -h / 2);
                    ctx.stroke();

                    if (s > 1.0) {

                        ctx.save();
                        ctx.lineWidth = 1.0 / s;
                        ctx.strokeStyle = "#444";


                        ctx.setLineDash([1 / s, 3 / s]);

                        ctx.beginPath();
                        ctx.lineTo(-width * 0.4, 0);
                        ctx.lineTo(0, h / 2);
                        ctx.stroke();

                        ctx.beginPath();
                        ctx.lineTo(-width * 0.4, 0);
                        ctx.lineTo(0, -h / 2);
                        ctx.stroke();

                        ctx.beginPath();
                        ctx.lineTo(-width * 0.4, 0);
                        ctx.lineTo(dmax, h / 2);
                        ctx.stroke();

                        ctx.beginPath();
                        ctx.lineTo(-width * 0.4, 0);
                        ctx.lineTo(dmax, -h / 2);
                        ctx.stroke();
                        ctx.restore();
                    }

                    ctx.strokeStyle = "#E9A923";



                    ctx.fillStyle = "#B42626";
                    ctx.fillEllipse(-width * 0.4, 0, 3);

                    ctx.globalCompositeOperation = "source-over";

                    ctx.lineCap = "butt";
                    ctx.lineWidth = s == 1.0 ? 2.0 : 4.0 / s;

                    ctx.beginPath();
                    ctx.arc(-width * 0.4, 0, width * 0.05, -a, a);
                    ctx.stroke();
                }

                draw_contents(1.0);


                ctx.strokeStyle = "#235AB9";
                ctx.lineWidth = 4.0;

                ctx.lineCap = "round";
                ctx.beginPath();
                ctx.lineTo(d, -h / 2 + 2);
                ctx.lineTo(d, h / 2 - 2);
                ctx.stroke();


                let zoom_r = Math.round(height * 0.33);

                let s0 = 45.0;

                ctx.translate(0, Math.round(height * 0.43));
                {
                    ctx.save();


                    ctx.fillStyle = "#000";
                    ctx.fillRect(-zoom_r, -zoom_r, 2 * zoom_r, 2 * zoom_r);
                    ctx.globalCompositeOperation = "destination-out";
                    ctx.fillEllipse(0, 0, zoom_r);

                    ctx.globalCompositeOperation = "destination-over";


                    ctx.beginPath();
                    ctx.rect(-zoom_r, -zoom_r, 2 * zoom_r, 2 * zoom_r);
                    ctx.clip();

                    ctx.scale(s0, s0);
                    ctx.translate(width * 0.35, 0);

                    draw_contents(s0);

                    ctx.restore();

                    ctx.strokeStyle = "#666";

                    ctx.lineWidth = 1.5;
                    ctx.strokeEllipse(0, 0, zoom_r);

                }


                let dy = Math.round(height * 0.43);
                let dx = Math.round(width * 0.35 * scale) / scale;

                ctx.translate(-dx, -dy);

                {

                    ctx.strokeStyle = "#666";
                    ctx.save();
                    ctx.lineWidth = 1.0;


                    ctx.setLineDash([2, 1]);


                    ctx.strokeEllipse(0, 0, zoom_r * 2 / s0);

                    ctx.setLineDash([2, 2]);


                    ctx.rotate(-Math.PI * 0.5 + Math.atan2(dy, dx));

                    {
                        let r0 = zoom_r * 2 / s0;
                        let r1 = zoom_r;

                        let d = Math.sqrt(dx * dx + dy * dy);
                        var cos = (r1 - r0) / d;
                        var sin = Math.sqrt(1 - cos * cos);

                        ctx.beginPath();

                        ctx.moveTo(- sin * r1, d - r1 * cos);
                        ctx.lineTo(- sin * r0, - r0 * cos);
                        ctx.stroke();

                        ctx.beginPath();
                        ctx.moveTo(sin * r1, d - r1 * cos);
                        ctx.lineTo(sin * r0, - r0 * cos);
                        ctx.stroke();
                    }


                    ctx.restore();
                }


            }
            else if (mode === "car") {

                ctx.translate(Math.round(width * 0.5), Math.round(height * 0.25));

                let s = width / 650;
                let d = arg0 * 340 - 5;

                ctx.strokeStyle = "#444";

                ctx.save();
                ctx.scale(s, s);
                ctx.strokeEllipse(-260, 0, 50);

                let a = Math.atan2(31 + arg0 * 1.5, 75 + d);
                let ca = Math.cos(a);
                let sa = Math.sin(a);

                let dd = d + 130;

                ctx.lineWidth = 1.0/s;

                ctx.save();
                ctx.setLineDash([2, 2]);

                ctx.beginPath();
                ctx.moveTo(-260, 0);
                ctx.lineTo(-260 + dd * ca, dd * sa);
                ctx.stroke();

                ctx.beginPath();
                ctx.moveTo(-260, 0);
                ctx.lineTo(-260 + dd * ca, -dd * sa);
                ctx.stroke();
                ctx.restore();

                ctx.lineWidth = 2.5/s;
                ctx.strokeStyle = "#E9A923";
                ctx.beginPath();
                ctx.arc(-260, 0, 50, -a, a);
                ctx.stroke();

                ctx.font = font_size * 0.9/s + "px IBM Plex Sans";

                ctx.fillStyle = "#E9A923";
                ctx.fillText(Math.round(2 * a * 180 / Math.PI) + "°", -210, 60);

                ctx.fillStyle = "#B42626";
                ctx.fillEllipse(-260, 0, 6);


                {
                    ctx.save();
                    ctx.translate(-110 + d, 0);
                    ctx.rotate(Math.PI * 0.5);
                    draw_car_top(ctx, casey_mode)
                    ctx.restore();

                    ctx.translate(-240, 70);

                    for (let i = 0; i < 5; i++) {
                        ctx.translate(100, -140);
                        draw_cone_top(ctx);
                        ctx.translate(0, +140);
                        draw_cone_top(ctx);
                    }
                }

                ctx.restore();

                ctx.translate(0, Math.round(height * 0.25));

                ctx.strokeStyle = "#222";
                ctx.beginPath();
                ctx.moveTo(-width, 0);
                ctx.lineTo(width, 0);
                ctx.stroke();


                ctx.translate(0, Math.round(height * 0.25));

                {
                    ctx.save();
                    ctx.scale(s, s);

                    let frac = 7;

                    for (let i = 0; i < 5; i++) {
                        let x = 230 + 174 * i;
                        let y = 70;
                        let cone_a = Math.atan2(y, x);
                        let cone_s = cone_a * frac;

                        ctx.save();
                        ctx.scale(cone_s, cone_s);

                        ctx.translate(-y, 0);
                        draw_cone_back(ctx);
                        ctx.translate(2 * y, 0);
                        draw_cone_back(ctx);
                        ctx.restore();
                    }

                    s = a * frac;
                    ctx.scale(s, s);
                    draw_car_back(ctx, arg0 < prev_car_pos && arg0 > 0, casey_mode);
                    ctx.restore();
                }

                prev_car_pos = arg0;
            } else if (mode === "cosine_side") {

                let a = Math.PI * (arg0 - 0.5);
                let w = Math.round(width * 0.25);
                let h = width * 0.8;

                ctx.translate(Math.round(width * 0.5), Math.round(height * 0.5));

                ctx.save();


                var grd = ctx.createLinearGradient(0, -h / 2, 0, h);
                grd.addColorStop(0.0, "#000");
                grd.addColorStop(0.01, "#0f0f0f");
                grd.addColorStop(0.02, "#222");
                grd.addColorStop(0.03, "#3f3f3f");
                grd.addColorStop(0.04, "#5f5f5f");
                grd.addColorStop(0.05, "#888");
                grd.addColorStop(0.06, "#aeaeae");
                grd.addColorStop(0.07, "#c8c8c8");
                grd.addColorStop(0.08, "#e1e1e1");
                grd.addColorStop(0.09, "#f2f2f2");
                grd.addColorStop(0.1, "#f8f8f8");



                ctx.fillStyle = grd;
                ctx.save();
                ctx.rotate(a);
                ctx.fillRect(-w / 2, -h / 2, w, h);

                ctx.fillStyle = "rgba(0,0,0,0.45)";
                ctx.fillRect(w / 2 * Math.cos(a), -h, w, h * 2);

                ctx.fillRect(-w / 2 * Math.cos(a) - w, -h, w, h * 2);

                ctx.restore();

                ctx.beginPath();

                ctx.rect(-width, 0, 2 * width, width);
                ctx.clip();
                ctx.save();
                ctx.rotate(a);
                ctx.fillStyle = "black";
                ctx.fillRect(-w / 2 * Math.cos(a), -h, w * Math.cos(a), h * 2);
                ctx.restore();

                ctx.restore();
                ctx.lineWidth = 2.0;

                let s = Math.cos(a) * 0.6;

                let fs = 255 * engamma(s);

                ctx.strokeStyle = "rgb(" + fs + "," + fs + "," + fs + ")";

                ctx.beginPath();
                ctx.lineTo(-w / 2 + 1, 0);
                ctx.lineTo(w / 2 - 1, 0);
                ctx.stroke();

                ctx.lineWidth = 2.0;
                ctx.strokeStyle = "#777";
                ctx.beginPath();
                ctx.arc(0, 0, width * 0.23, -Math.PI * 0.5, a - Math.PI * 0.5, a < 0.0);
                ctx.stroke();

                ctx.lineWidth = 4.0;

                ctx.fillStyle = ctx.strokeStyle = "#3260E5";
                ctx.beginPath();
                ctx.lineTo(0, 0);
                ctx.lineTo(0, -width * 0.25);
                ctx.stroke();

                ctx.beginPath();
                ctx.lineTo(0, -width * 0.25 - 15);
                ctx.lineTo(-6, -width * 0.25);
                ctx.lineTo(6, -width * 0.25);
                ctx.fill();
                {
                    ctx.save();
                    ctx.rotate(a);
                    ctx.fillStyle = ctx.strokeStyle = "#E9A923";
                    ctx.lineWidth = 4.0;
                    ctx.beginPath();
                    ctx.lineTo(0, 0);
                    ctx.lineTo(0, -width * 0.25);
                    ctx.stroke();

                    ctx.beginPath();
                    ctx.lineTo(0, -width * 0.25 - 15);
                    ctx.lineTo(-6, -width * 0.25);
                    ctx.lineTo(6, -width * 0.25);
                    ctx.fill();


                    ctx.restore();
                }

                ctx.rotate(a / 2);
                ctx.translate(0, -width * 0.28);
                ctx.rotate(-a / 2);

                ctx.translate(0, width * 0.05 * (-0.5 + Math.abs(arg0 - 0.5)));
                ctx.fillStyle = "rgba(0,0,0,0.4)";
                ctx.roundRect(-26, -20, 52, 26, 4);
                ctx.fill();

                ctx.fillStyle = "#f8f8f8";
                ctx.fillText((Math.abs(arg0 - 0.5) * 180).toFixed(1) + "°", 0, 0);



            } else if (mode === "bounce_paths") {

                mvp = mat3_mul(rot_z_mat3(-Math.PI * 0.5), rot_y_mat3(-Math.PI * 0.5));
                let proj_rot = mat3_mul(x_flip, mvp);

                let arg_sc = arg0 * 5;
                let step = Math.floor(arg_sc);
                let step_t = arg_sc - step;


                let pow = 300;
                let light_pos = [0, 1.5 * Math.cos(a), 1.5 * Math.sin(a)];

                let radiance = [pow, pow];
                let offsets = [0, 0];


                if (step == 0)
                    radiance = [0, 0];
                else if (step == 1.0)
                    radiance = [pow, 0];
                else
                    radiance = [0, pow];

                offsets = [step % 2 == 1.0 ? 0.2 * (step - 1) / 2 : 10.0,
                step % 2 == 0.0 ? 0.2 * (step) / 2 : 10.0,]



                gl.begin(width * 1.2, height * 1.2);
                gl.draw_bounce(mvp, [0, 0], radiance, offsets);

                ctx.globalAlpha = step_t * (1 - step_t) * 5;

                ctx.drawImage(gl.finish(), -width * 0.1, -height * 0.1, width * 1.2, height * 1.2);


                ctx.translate(Math.round(width * 0.5), Math.round(height * 0.5));


                ctx.fillStyle = "#fff";
                if (step == 0)
                    ctx.fillText("Light Source", 0, height * 0.45);
                else if (step == 1)
                    ctx.fillText("First Bounce", 0, height * 0.45);
                else if (step == 2)
                    ctx.fillText("Second Bounce", 0, height * 0.45);
                else if (step == 3)
                    ctx.fillText("Third Bounce", 0, height * 0.45);
                else if (step == 4)
                    ctx.fillText("Fourth Bounce", 0, height * 0.45);

                ctx.globalAlpha = 1.0;

                let points0 = [];

                let p;
                let lw = 4;
                let lh = 4;

                ctx.scale(1.2, 1.2);

                p = [lw * 0.5, -lh * 0.5, -lh * 0.5];
                p = ray_project(mat3_mul_vec(proj_rot, p));
                points0.push(p.slice(0, 2));

                p = [lw * 0.5, lh * 0.5, -lh * 0.5];
                p = ray_project(mat3_mul_vec(proj_rot, p));
                points0.push(p.slice(0, 2));

                p = [-lw * 0.5, lh * 0.5, -lh * 0.5];
                p = ray_project(mat3_mul_vec(proj_rot, p));
                points0.push(p.slice(0, 2));

                p = [-lw * 0.5, -lh * 0.5, -lh * 0.5];
                p = ray_project(mat3_mul_vec(proj_rot, p));
                points0.push(p.slice(0, 2));

                ctx.strokeStyle = "#666";


                ctx.lineWidth = 1.0;

                ctx.save();
                ctx.beginPath();
                for (let i = 0; i < 4; i++)
                    ctx.lineTo(points0[i][0], points0[i][1]);

                ctx.closePath();
                ctx.stroke();

                ctx.rotate(Math.PI * 0.5);

                ctx.beginPath();
                for (let i = 0; i < 4; i++)
                    ctx.lineTo(points0[i][0], points0[i][1]);

                ctx.closePath();
                ctx.stroke();
                ctx.restore();

                let lpoints = [];

                p = [1.0, 0.0, 0.0];
                p = ray_project(mat3_mul_vec(proj_rot, p));
                lpoints.push(p.slice(0, 2));

                p = [1.0, 0.0, 2.0];
                p = ray_project(mat3_mul_vec(proj_rot, p));
                lpoints.push(p.slice(0, 2));

                p = [-1.0, 0.0, 2.0];
                p = ray_project(mat3_mul_vec(proj_rot, p));
                lpoints.push(p.slice(0, 2));

                p = [-1.0, 0.0, 0.0];
                p = ray_project(mat3_mul_vec(proj_rot, p));
                lpoints.push(p.slice(0, 2));

                ctx.lineWidth = 1.5;

                ctx.beginPath();
                for (let i = 0; i < 4; i++)
                    ctx.lineTo(lpoints[i][0], lpoints[i][1]);

                ctx.closePath();
                ctx.stroke();

                let s = width * 0.24;
                ctx.scale(s, s);



                let w = 2.0 / s;

                ctx.globalAlpha = step_t * (1 - step_t) * 10;


                ctx.strokeStyle = "#fff";
                ctx.lineWidth = 1.0 / (s);
                let n = 90;

                ctx.lineDashOffset = (-arg0);
                ctx.save();
                ctx.setLineDash([3 / s, 4 / s]);


                if (step == 0) {

                    ctx.fillStyle = "#fff";
                    ctx.fillRect(-w, -0.25, w, 0.1);

                    for (let i = 0; i < n; i++) {
                        let a = Math.PI * (i + 0.5) / n;
                        a -= Math.PI * 0.5;
                        let dir = [Math.cos(a), Math.sin(a)];
                        dir = vec_scale(dir, 0.4);
                        let org = [0, -0.2];
                        let p = vec_add(org, dir);

                        ctx.strokeStyle = "#fff";

                        let hit = vec_add(org, vec_scale(dir, -(org[1] - 1) / dir[1]));
                        if (hit[0] < 1 && dir[1] > 0) {
                            p = hit;
                        }

                        hit = vec_add(org, dir);

                        ctx.beginPath();
                        ctx.lineTo(org[0], org[1]);
                        ctx.lineTo(p[0], p[1]);
                        ctx.stroke();
                    }
                } else if (step == 1 || step == 3) {

                    ctx.fillStyle = step == 3 ? "#660000" : "#ccc";
                    ctx.fillRect((step == 1 ? 0.4 : -0.1) - 0.05, 1, 0.1, w);

                    for (let i = 0; i < n; i++) {
                        let a = Math.PI * (i + 0.5) / n;
                        a -= Math.PI;
                        let dir = [Math.cos(a), Math.sin(a)];
                        dir = vec_scale(dir, 0.4);
                        let org = [step == 1 ? 0.4 : -0.1, 1];
                        let p = vec_add(org, dir);

                        ctx.strokeStyle = step == 3 ? "#660000" : "#e0e0e0";

                        let hit = vec_add(org, vec_scale(dir, -(org[0] + 1) / dir[0]));
                        if (hit[1] < 1 && hit[1] > -1) {
                            p = hit;
                        }

                        hit = vec_add(org, dir);

                        ctx.beginPath();
                        ctx.lineTo(org[0], org[1]);
                        ctx.lineTo(p[0], p[1]);
                        ctx.stroke();


                    }
                } else if (step == 2 || step == 4) {

                    ctx.fillStyle = step == 2 ? "#cc0000" : "#330000";

                    ctx.fillRect(-w - 1, (step == 2 ? 0.4 : 0.3) - 0.05, w, 0.1);

                    for (let i = 0; i < n; i++) {
                        let a = Math.PI * (i + 0.5) / n;
                        a -= Math.PI * 0.5;
                        let dir = [Math.cos(a), Math.sin(a)];
                        dir = vec_scale(dir, 0.4);
                        let org = [-1, step == 2 ? 0.4 : 0.3];
                        let p = vec_add(org, dir);

                        ctx.strokeStyle = step == 2 ? "#cc0000" : "#330000";

                        let hit = vec_add(org, vec_scale(dir, -(org[1] - 1) / dir[1]));
                        if (hit[0] < 1 && dir[1] > 0) {
                            p = hit;
                        }

                        hit = vec_add(org, dir);

                        ctx.beginPath();
                        ctx.lineTo(org[0], org[1]);
                        ctx.lineTo(p[0], p[1]);
                        ctx.stroke();
                    }
                }

                ctx.restore();

            }

            else if (mode === "lambert_side") {

                let a = Math.PI * (arg0 - 0.5) * 0.85;
                let w = Math.round(width * 0.175);
                let h = width * 2.0;
                let sc = Math.cos(a);
                let src = height * 20;

                ctx.fillStyle = "#000";
                ctx.fillRect(0, 0, width, height);
                ctx.translate(Math.round(width * 0.5), Math.round(height * 0.9));

                ctx.save();

                var grd = ctx.createRadialGradient(0, 0, 0, 0, 0, height * 0.85);
                grd.addColorStop(0.9, "rgba(0,0,0,1.0");
                grd.addColorStop(0.92, "rgba(0,0,0,0.7");
                grd.addColorStop(0.94, "rgba(0,0,0,0.5");
                grd.addColorStop(0.96, "rgba(0,0,0,0.2");
                grd.addColorStop(1.0, "rgba(0,0,0,0.0");

                ctx.globalCompositeOperation = "destination-out";
                ctx.fillStyle = grd;
                ctx.fillEllipse(0, 0, height * 0.85);

                ctx.globalCompositeOperation = "destination-over";

                ctx.strokeStyle = "#E9A923";
                ctx.fillStyle = "rgba(233, 169, 35, 0.1)";
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.lineTo(-w / (2 * sc), 0);
                ctx.lineTo(w / (2 * sc), 0);
                ctx.lineTo(src * Math.sin(a), -src * sc);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();

                let step = 4.0;
                let lw = 0.8 * width;
                let n = Math.floor(0.5 * lw / step);

                let l = height * 0.3 * sc;

                for (let i = -n; i <= n; i++) {
                    let x = i * step;

                    if (Math.abs(x) <= w / (2 * sc) + 5)
                        ctx.globalCompositeOperation = "destination-over";
                    else
                        ctx.globalCompositeOperation = "source-over";

                    let style = Math.abs(x) <= w / (2 * sc) ? "rgba(255, 227, 120, 0.8)" : "#333";
                    ctx.strokeStyle = style;
                    ctx.fillStyle = style;
                    ctx.save();
                    ctx.translate(x, 0);
                    ctx.rotate(a);
                    ctx.beginPath();
                    ctx.lineTo(0, 0);
                    ctx.lineTo(0, -l);
                    ctx.stroke();

                    ctx.beginPath();
                    ctx.moveTo(1.5 * sc + 0.5, -l);
                    ctx.lineTo(0, -l - 4 * sc - 2);
                    ctx.lineTo(-1.5 * sc - 0.5, -l);
                    ctx.closePath();
                    ctx.fill();

                    ctx.restore();
                }

                ctx.globalCompositeOperation = "source-over";


                ctx.fillStyle = "#fff";
                ctx.fillRect(-lw * 0.5, 0, lw, 3);

                ctx.translate(Math.round(width * 0.425), -Math.round(height * 0.65));

                ctx.save();
                ctx.rotate(-Math.PI * 0.5);

                let pl = height * 0.2;
                let pn = 40;
                let k = Math.round((arg0 * 0.85 + 0.15 * 0.5) * pn);


                ctx.lineCap = "butt";

                for (let i = 0; i < pn; i++) {

                    let style = "rgba(255, 227, 120," + (i == k ? "0.8)" : "0.2)");

                    ctx.strokeStyle = style;
                    ctx.fillStyle = style;

                    let t = Math.PI * i / pn;

                    let sc = Math.sin(t);
                    ctx.beginPath();
                    ctx.moveTo(0, 0);
                    ctx.lineTo(0, -pl * sc);
                    ctx.stroke();

                    ctx.beginPath();
                    ctx.moveTo(1.5 * sc + 0.5, -pl * sc);
                    ctx.lineTo(0, -pl * sc - 4 * sc - 2);
                    ctx.lineTo(-1.5 * sc - 0.5, -pl * sc);
                    ctx.closePath();
                    ctx.fill();


                    ctx.rotate(Math.PI / pn);
                }

                ctx.restore();

                ctx.fillStyle = "#fff";
                ctx.fillRect(-3, 0, 6, 2);

            }
            else if (mode === "radiance") {

                let proj_rot = mvp;
                proj_rot = mat3_mul(x_flip, proj_rot);

                ctx.translate(Math.round(width * 0.5), Math.round(height * 0.5));

                let b = 5.0 - arg0 * 4;
                draw_plane(proj_rot, b, "#fff");
            } else if (mode === "ambient_dots") {

                let proj_rot = mvp;
                proj_rot = mat3_mul(x_flip, proj_rot);

                let r = 1;

                gl.begin(width, height);
                gl.draw_solid_sphere_angle(mvp, [r, 2.0, 0.0]);

                ctx.drawImage(gl.finish(), 0, 0, width, height);
                ctx.translate(Math.round(width * 0.5), Math.round(height * 0.5));

                ctx.strokeStyle = "rgba(233, 169, 35, 0.6)";

                for (let i = 0; i < rand_vertices.length; i++) {
                    let v = rand_vertices[i].slice();
                    if (rand_vertices[i][2] <= 0)
                        continue;

                    let v1 = mat3_mul_vec(proj_rot, v);
                    let p1 = ray_project(v1);
                    ctx.strokeEllipse(p1[0], p1[1], 0.5);

                    let tmp = v[1];
                    v[1] = v[0];
                    v[0] = tmp;

                    v1 = mat3_mul_vec(proj_rot, v);
                    p1 = ray_project(v1);
                    ctx.strokeEllipse(p1[0], p1[1], 0.5);
                }

                function draw_bottom_dots() {
                    ctx.fillStyle = "#fff";

                    for (let i = 0; i < rand_vertices.length; i++) {
                        let v = rand_vertices[i].slice();
                        if (rand_vertices[i][2] > 0)
                            continue;

                        let v1 = mat3_mul_vec(proj_rot, v);
                        let p1 = ray_project(vec_scale(v1, 3.5));
                        ctx.fillEllipse(p1[0], p1[1], 1.5);

                        let tmp = v[1];
                        v[1] = v[0];
                        v[0] = tmp;

                        v1 = mat3_mul_vec(proj_rot, v);
                        p1 = ray_project(vec_scale(v1, 3.5));
                        ctx.fillEllipse(p1[0], p1[1], 1.5);
                    }
                }

                function draw_plane() {
                    let b = 2.45;

                    ctx.beginPath();

                    let p = [-b, -b, 0];
                    p = ray_project(mat3_mul_vec(proj_rot, p));
                    ctx.moveTo(p[0], p[1]);

                    p = [b, -b, 0];
                    p = ray_project(mat3_mul_vec(proj_rot, p));
                    ctx.lineTo(p[0], p[1]);

                    p = [b, b, 0];
                    p = ray_project(mat3_mul_vec(proj_rot, p));
                    ctx.lineTo(p[0], p[1]);

                    p = [-b, b, 0];
                    p = ray_project(mat3_mul_vec(proj_rot, p));
                    ctx.lineTo(p[0], p[1]);
                    ctx.closePath();

                    ctx.fillStyle = "#404040";
                    ctx.strokeStyle = "#404040";
                    ctx.fill();
                    ctx.stroke();
                }


                function draw_top_dots() {

                    ctx.fillStyle = "#fff";

                    for (let i = 0; i < rand_vertices.length; i++) {
                        let v = rand_vertices[i].slice();
                        if (rand_vertices[i][2] <= 0)
                            continue;

                        let v1 = mat3_mul_vec(proj_rot, v);
                        let p1 = ray_project(vec_scale(v1, 3.5));
                        ctx.fillEllipse(p1[0], p1[1], 1.5);

                        let tmp = v[1];
                        v[1] = v[0];
                        v[0] = tmp;

                        v1 = mat3_mul_vec(proj_rot, v);
                        p1 = ray_project(vec_scale(v1, 3.5));
                        ctx.fillEllipse(p1[0], p1[1], 1.5);
                    }
                }

                if (mvp[8] > 0) {
                    ctx.globalCompositeOperation = "destination-over"

                    draw_plane();
                    draw_bottom_dots();
                    ctx.globalCompositeOperation = "source-over"
                    draw_top_dots();
                } else {
                    draw_plane();
                    draw_bottom_dots();
                    ctx.globalCompositeOperation = "destination-over"
                    draw_top_dots();
                    ctx.globalCompositeOperation = "source-over"


                }
            } else if (mode === "ambient_hemi") {

                let r = 1.0;
                let proj_rot = mvp;
                proj_rot = mat3_mul(x_flip, proj_rot);

                gl.begin(width, height);
                gl.draw_solid_sphere_angle(mvp, [r, 0.0, 0.0]);

                ctx.drawImage(gl.finish(), 0, 0, width, height);
                ctx.translate(Math.round(width * 0.5), Math.round(height * 0.5));


                let edge_n = 120;

                ctx.strokeStyle = "#EDB235";

                ctx.beginPath();

                for (let i = 0; i <= edge_n; i++) {
                    let t = Math.PI * 2 * i / edge_n;
                    let p = [r * Math.cos(t), r * Math.sin(t), 0];

                    p = ray_project(mat3_mul_vec(proj_rot, p));

                    ctx.lineTo(p[0], p[1]);
                }


                ctx.closePath();
                ctx.stroke();

                if (mvp[8] > 0.0)
                    ctx.globalCompositeOperation = "destination-over"


                let b = 2.45;

                ctx.beginPath();

                let p = [-b, -b, 0];
                p = ray_project(mat3_mul_vec(proj_rot, p));
                ctx.moveTo(p[0], p[1]);

                p = [b, -b, 0];
                p = ray_project(mat3_mul_vec(proj_rot, p));
                ctx.lineTo(p[0], p[1]);

                p = [b, b, 0];
                p = ray_project(mat3_mul_vec(proj_rot, p));
                ctx.lineTo(p[0], p[1]);

                p = [-b, b, 0];
                p = ray_project(mat3_mul_vec(proj_rot, p));
                ctx.lineTo(p[0], p[1]);
                ctx.closePath();

                let style = "#bcbcbc";
                ctx.fillStyle = style;
                ctx.strokeStyle = style;
                ctx.fill();
                ctx.stroke();

                ctx.globalCompositeOperation = "source-over"
            }
            else if (mode === "radiance_area") {

                let proj_rot = mat3_mul(rot_x_mat3(0.28), rot_y_mat3(-Math.PI * 0.25));
                let s = width * 0.1;
                proj_rot = mat3_mul(x_flip, proj_rot);

                ctx.translate(Math.round(width * 0.5), Math.round(height * 0.45));

                let z_max = 6.0;
                let d0 = 0.06;
                let d1 = 0.7;
                let h = 1.2;
                let p;
                let points0 = [[-d0, -d0, -z_max],
                [d0, -d0, -z_max],
                [d0, d0, -z_max],
                [-d0, d0, -z_max]];

                let z = z_max * arg0;
                let points1 = [[-d1, -d1, z],
                [d1, -d1, z],
                [d1, d1, z],
                [-d1, d1, z]];


                ctx.strokeStyle = "#444";
                ctx.fillStyle = "#444";

                ctx.save();

                ctx.setLineDash([2, 2]);

                ctx.beginPath();
                p = vec_scale(mat3_mul_vec(proj_rot, [0, d0, -z_max]), s);
                ctx.lineTo(p[0], p[1]);
                p = vec_scale(mat3_mul_vec(proj_rot, [0, h, -z_max]), s);
                ctx.lineTo(p[0], p[1]);
                ctx.stroke();

                ctx.beginPath();
                p = vec_scale(mat3_mul_vec(proj_rot, [0, d1, z]), s);
                ctx.lineTo(p[0], p[1]);
                p = vec_scale(mat3_mul_vec(proj_rot, [0, h, z]), s);
                ctx.lineTo(p[0], p[1]);
                ctx.stroke();

                ctx.restore();

                // ctx.lineWidth = 2.0;

                ctx.beginPath();
                p = vec_scale(mat3_mul_vec(proj_rot, [0, h, -z_max]), s);
                ctx.lineTo(p[0], p[1]);
                p = vec_scale(mat3_mul_vec(proj_rot, [0, h, 0]), s);
                ctx.lineTo(p[0], p[1]);
                ctx.stroke();


                ctx.beginPath();
                p = vec_scale(mat3_mul_vec(proj_rot, [0, h, 0]), s);
                ctx.lineTo(p[0], p[1]);
                p = vec_scale(mat3_mul_vec(proj_rot, [0, h, z_max]), s);
                ctx.lineTo(p[0], p[1]);
                ctx.stroke();

                p = vec_scale(mat3_mul_vec(proj_rot, [0, h, z_max]), s);
                ctx.fillEllipse(p[0], p[1], 2);

                p = vec_scale(mat3_mul_vec(proj_rot, [0, h, 0]), s);
                ctx.fillEllipse(p[0], p[1], 2);

                p = vec_scale(mat3_mul_vec(proj_rot, [0, h, -z_max]), s);
                ctx.fillEllipse(p[0], p[1], 2);

                p = vec_scale(mat3_mul_vec(proj_rot, [0, h, z]), s);
                ctx.fillEllipse(p[0], p[1], 2);

                ctx.fillStyle = "#fff";
                ctx.beginPath();
                for (var i = 0; i < 4; i++) {
                    let p = vec_scale(mat3_mul_vec(proj_rot, points1[i]), s);
                    ctx.lineTo(p[0], p[1]);
                }
                ctx.fill();

                ctx.lineWidth = 1.0;


                let edge_n = 20;
                let rr = 0.08 * (1 + arg0);

                ctx.strokeStyle = "rgba(233, 169, 35, 1.0)";

                let p0 = vec_scale(mat3_mul_vec(proj_rot, [0, 0, -z_max]), s);

                ctx.beginPath();
                let points = [p0];


                for (let i = 0; i <= edge_n; i++) {
                    let t = Math.PI * 2 * i / edge_n;
                    let p = [rr * Math.cos(t), rr * Math.sin(t), z];

                    p = vec_scale(mat3_mul_vec(proj_rot, p), s);
                    points.push(p);
                    ctx.lineTo(p[0], p[1]);
                }


                ctx.closePath();
                ctx.stroke();

                ctx.fillStyle = "rgba(233, 169, 35, 0.2)";

                points = convex_hull(points);
                ctx.beginPath();
                for (let i = 0; i < points.length; i++) {
                    ctx.lineTo(points[i][0], points[i][1]);
                }
                ctx.fill();

                ctx.beginPath();
                let t = 1.85;
                p = [rr * Math.cos(t), rr * Math.sin(t), z];
                p = vec_scale(mat3_mul_vec(proj_rot, p), s);
                ctx.lineTo(p[0], p[1]);
                ctx.lineTo(p0[0], p0[1]);
                ctx.stroke();



                ctx.beginPath();
                t = 4.9;
                p = [rr * Math.cos(t), rr * Math.sin(t), z];
                p = vec_scale(mat3_mul_vec(proj_rot, p), s);
                ctx.lineTo(p[0], p[1]);
                ctx.lineTo(p0[0], p0[1]);
                ctx.stroke();

                ctx.fillStyle = "rgba(35, 90, 185, 0.5)";
                ctx.strokeStyle = "#235AB9";
                ctx.lineWidth = 1.5;

                ctx.beginPath();
                for (var i = 0; i < 4; i++) {
                    let p = mat3_mul_vec(proj_rot, points0[i]);
                    p = vec_scale(p, s);
                    ctx.lineTo(p[0], p[1]);
                }
                ctx.closePath();
                ctx.fill();
                ctx.stroke();

                ctx.lineWidth = 1.0;

                ctx.save();
                let r_max = height * 0.07;
                ctx.translate(Math.round(width * 0.5 - 2 * r_max), Math.round(height * 0.55 - 2 * r_max));

                ctx.scale(width * 0.07, width * 0.07);

                ctx.fillStyle = "#fff";

                ctx.fillRect(-d1, -d1, 2 * d1, 2 * d1);
                ctx.strokeStyle = "#235AB9";

                ctx.fillStyle = "rgba(233, 169, 35, 0.2)";
                ctx.strokeStyle = "rgba(233, 169, 35, 1.0)";

                ctx.lineWidth = 1.0 / (width * 0.08);
                ctx.fillEllipse(0, 0, rr);
                ctx.strokeEllipse(0, 0, rr);

                ctx.restore();

            } else if (mode === "hemisphere" || mode === "hemisphere_proj") {

                let proj_rot = mvp;
                proj_rot = mat3_mul(x_flip, proj_rot);

                let p;

                let lw = 0.9;
                let lh = 0.7;
                let r = 1.5;


                let a = -Math.PI * (arg1 * 0.37 + 0.5) + Math.PI;
                let d = 5 * 0.5;
                let dist = 2.75;
                let light_pos = [0, dist * Math.cos(a), dist * Math.sin(a)];

                let light_mat = rot_x_mat3(Math.PI * 0.5);
                light_mat = mat3_mul(rot_z_mat3(Math.PI * (arg0 - 0.5)), light_mat);
                light_mat = mat3_mul(rot_x_mat3(a), light_mat);
             
                
                gl.begin(width, height);
                if (mvp[8] >= 0.0)
                    gl.draw_area(mvp, light_mat, light_pos);

                gl.enable_blend();
                gl.draw_solid_angle(mvp, mat3_invert(light_mat),
                  (mode === "hemisphere") ? [2 * lw, 2 * lh] : [0, 0], light_pos, 1.0, [0, 0, 0, r]);

                ctx.drawImage(gl.finish(), 0, 0, width, height);

                ctx.globalCompositeOperation = "destination-over";
                ctx.translate(Math.round(width * 0.5), Math.round(height * 0.5));
                ctx.strokeStyle = "#333";
                ctx.beginPath();

                p = [-d, -d, 0];
                p = ray_project(mat3_mul_vec(proj_rot, p));
                ctx.moveTo(p[0], p[1]);

                p = [d, -d, 0];
                p = ray_project(mat3_mul_vec(proj_rot, p));
                ctx.lineTo(p[0], p[1]);

                p = [d, d, 0];
                p = ray_project(mat3_mul_vec(proj_rot, p));
                ctx.lineTo(p[0], p[1]);

                p = [-d, d, 0];
                p = ray_project(mat3_mul_vec(proj_rot, p));
                ctx.lineTo(p[0], p[1]);
                ctx.closePath();
                ctx.stroke();

                ctx.globalCompositeOperation = "source-over";


                ctx.strokeStyle = "rgba(255, 255, 255, 0.25)"

                ctx.fillStyle = "rgba(255, 255, 255, 0.3)"

                ctx.beginPath();


                let light_p = [];
                p = [-lw, -lh, 0];
                p = mat3_mul_vec(light_mat, p);
                p = vec_add(p, light_pos);
                light_p.push(p);
                p = ray_project(mat3_mul_vec(proj_rot, p));
                ctx.moveTo(p[0], p[1]);

                p = [lw, -lh, 0];
                p = mat3_mul_vec(light_mat, p);
                p = vec_add(p, light_pos);
                light_p.push(p);
                p = ray_project(mat3_mul_vec(proj_rot, p));
                ctx.lineTo(p[0], p[1]);

                p = [lw, lh, 0];
                p = mat3_mul_vec(light_mat, p);
                p = vec_add(p, light_pos);
                light_p.push(p);
                p = ray_project(mat3_mul_vec(proj_rot, p));
                ctx.lineTo(p[0], p[1]);

                p = [-lw, lh, 0];
                p = mat3_mul_vec(light_mat, p);
                p = vec_add(p, light_pos);
                light_p.push(p);

                p = ray_project(mat3_mul_vec(proj_rot, p));
                ctx.lineTo(p[0], p[1]);
                ctx.closePath();

                ctx.fillStyle = "rgba(233, 169, 35, 0.5)";
                ctx.strokeStyle = "#E9A923";
                ctx.stroke();
                ctx.fill();

                ctx.strokeStyle = "rgba(255, 255, 255, 0.25)"


                let hemi_pos = [0, -0, 0];
                let base_n = 60;
                ctx.beginPath();
                for (let i = 0; i < base_n; i++) {
                    let a = Math.PI * 2 * i / (base_n - 1);
                    let p = [r * Math.cos(a), r * Math.sin(a), 0];
                    p = vec_add(p, hemi_pos);
                    p = ray_project(mat3_mul_vec(proj_rot, p));

                    ctx.lineTo(p[0], p[1]);
                }

                ctx.closePath();
                ctx.stroke();

                let edge_n = 10;


                //

                if (mode === "hemisphere_proj") {

                    ctx.beginPath();

                    for (let edge = 0; edge < 4; edge++) {
                        let p0 = light_p[edge];
                        let p1 = light_p[(edge + 1) % 4];
                        let d = vec_sub(p1, p0);

                        for (let i = 0; i < edge_n; i++) {
                            let p = vec_add(p0, vec_scale(d, i / (edge_n - 1)));

                            p = vec_norm(vec_sub(p, hemi_pos));
                            p = vec_scale(p, r);
                            p = vec_add(p, hemi_pos);
                            p[2] = 0;
                            p = ray_project(mat3_mul_vec(proj_rot, p));

                            ctx.lineTo(p[0], p[1]);
                        }

                    }
                    ctx.fillStyle = "rgba(233, 169, 35, 0.5)";
                    ctx.strokeStyle = "#E9A923";
                    ctx.fill();
                    ctx.stroke();
                }


                ctx.beginPath();

                for (let edge = 0; edge < 4; edge++) {
                    let p0 = light_p[edge];
                    let p1 = light_p[(edge + 1) % 4];
                    let d = vec_sub(p1, p0);

                    for (let i = 0; i < edge_n; i++) {
                        let p = vec_add(p0, vec_scale(d, i / (edge_n - 1)));

                        p = vec_norm(vec_sub(p, hemi_pos));
                        p = vec_scale(p, r);
                        p = vec_add(p, hemi_pos);
                        p = ray_project(mat3_mul_vec(proj_rot, p));

                        ctx.lineTo(p[0], p[1]);
                    }

                }

                ctx.fillStyle = "rgba(233, 169, 35, 0.5)";
                ctx.strokeStyle = "#E9A923";


                ctx.stroke();


                ctx.strokeStyle = "rgba(255, 255, 255, 0.1)"

                for (let edge = 0; edge < 4; edge++) {

                    ctx.beginPath();

                    let p = light_p[edge];
                    let sphere_p = vec_scale(vec_norm(p), r);

                    p = mat3_mul_vec(proj_rot, p);

                    p = ray_project(p);
                    ctx.lineTo(p[0], p[1]);

                    p = hemi_pos;
                    p = ray_project(mat3_mul_vec(proj_rot, p));
                    ctx.lineTo(p[0], p[1]);
                    ctx.stroke();

                    if (mode === "hemisphere_proj") {
                        ctx.beginPath();

                        p = ray_project(mat3_mul_vec(proj_rot, sphere_p));
                        ctx.lineTo(p[0], p[1]);

                        sphere_p[2] = 0;

                        p = ray_project(mat3_mul_vec(proj_rot, sphere_p));
                        ctx.lineTo(p[0], p[1]);

                        ctx.stroke();
                    }
                }

            } else if (mode === "mirror_simple") {


                let proj_rot = mvp;
                proj_rot = mat3_mul(x_flip, proj_rot);

                ctx.translate(width * 0.5, height * 0.5);

                ctx.strokeStyle = "rgba(255, 255, 255, 0.25)";

                let a = arg0 * Math.PI * 0.42;
                let light_pos = mat3_mul_vec(rot_y_mat3(a), [0, 0, 2]);
                let mirr_light_pos = [light_pos[0], light_pos[1], -light_pos[2]];
                let r = 0.2;
                let size = 2.7;

                function draw_top() {

                    ctx.globalAlpha = 0.4;
                    ctx.lineWidth = 2.0;

                    ctx.strokeStyle = "#E9A923";
                    ctx.beginPath();
                    let n = 20;
                    for (let i = 0; i <= n; i++) {
                        let a = Math.PI * 0.42 * (i / n);
                        let p = ray_project(mat3_mul_vec(proj_rot, [2 * Math.sin(a), 0, 2 * Math.cos(a)]));
                        ctx.lineTo(p[0], p[1]);
                    }


                    ctx.stroke();
                    ctx.globalAlpha = 1.0;

                    ctx.fillStyle = "#fff";
                    draw_spherical_light(mvp, light_pos, r, 40);

                }

                if (mvp[8] < 0.0)
                    draw_top();

                ctx.lineWidth = 1;

                let p;
                ctx.save();
                ctx.beginPath();
                p = [-size, -size, 0];
                p = ray_project(mat3_mul_vec(proj_rot, p));
                ctx.moveTo(p[0], p[1]);

                p = [size, -size, 0];
                p = ray_project(mat3_mul_vec(proj_rot, p));
                ctx.lineTo(p[0], p[1]);

                p = [size, size, 0];
                p = ray_project(mat3_mul_vec(proj_rot, p));
                ctx.lineTo(p[0], p[1]);

                p = [-size, size, 0];

                p = ray_project(mat3_mul_vec(proj_rot, p));
                ctx.lineTo(p[0], p[1]);
                ctx.closePath();

                if (mvp[8] < 0.0) {
                    ctx.fillStyle = "#111";
                    ctx.fill();
                }
                ctx.strokeStyle = "#333";
                ctx.stroke();

                ctx.clip();

                ctx.fillStyle = "#eee";
                if (mvp[8] >= 0.0)
                    draw_spherical_light(mvp, mirr_light_pos, r, 40)


                ctx.restore();

                if (mvp[8] >= 0.0)
                    draw_top();

            }
            else if (mode === "mirror") {

                let proj_rot = mvp;
                proj_rot = mat3_mul(x_flip, proj_rot);

                ctx.translate(width * 0.5, height * 0.5);

                ctx.strokeStyle = "rgba(255, 255, 255, 0.25)";

                let a = arg0 * Math.PI * 0.42;
                let light_pos = mat3_mul_vec(rot_y_mat3(a), [0, 0, 2]);
                let mirr_light_pos = [light_pos[0], light_pos[1], -light_pos[2]];
                let dir_light_pos = [-light_pos[0], light_pos[1], light_pos[2]];
                let r = 0.2;
                let size = 2.7;

                function draw_top() {

                    function draw_in() {
                        ctx.lineWidth = 2;
                        ctx.strokeStyle = "#3260E5";
                        ctx.fillStyle = "#3260E5"

                        let p;
                        ctx.beginPath();
                        p = ray_project(mat3_mul_vec(proj_rot, vec_scale(light_pos, (2 - r) / 2)));
                        ctx.moveTo(p[0], p[1]);

                        p = ray_project(mat3_mul_vec(proj_rot, vec_scale(light_pos, 0.1)));
                        ctx.lineTo(p[0], p[1]);

                        ctx.stroke();

                        let rot = rot_y_mat3(-Math.PI + a);

                        let tip = [0, 0, 0];

                        draw_arrow_tip(tip, rot, proj_rot, 0.06);
                    }

                    function draw_out() {
                        ctx.lineWidth = 2;
                        ctx.strokeStyle = "rgba(230,57,48,1.0)";
                        ctx.fillStyle = "rgba(230,57,48,1.0)";

                        let p;
                        ctx.beginPath();
                        p = ray_project(mat3_mul_vec(proj_rot, vec_scale(dir_light_pos, 0.84)));
                        ctx.moveTo(p[0], p[1]);

                        p = ray_project(mat3_mul_vec(proj_rot, [0, 0, 0]));
                        ctx.lineTo(p[0], p[1]);

                        ctx.stroke();

                        let rot = rot_y_mat3(- a);

                        let tip = vec_scale(dir_light_pos, (2 - r) / 2);

                        draw_arrow_tip(tip, rot, proj_rot, 0.06);
                    }

                    if (proj_rot[6] < 0) {
                        draw_in();
                        draw_out();
                    } else {
                        draw_out();
                        draw_in();
                    }

                    ctx.globalAlpha = 0.4;
                    ctx.lineWidth = 2.0;

                    ctx.strokeStyle = "#E9A923";
                    ctx.beginPath();
                    let n = 20;
                    for (let i = 0; i <= n; i++) {
                        var ang = Math.PI * 0.42 * (i / n);
                        let p = ray_project(mat3_mul_vec(proj_rot, [2 * Math.sin(ang), 0, 2 * Math.cos(ang)]));
                        ctx.lineTo(p[0], p[1]);
                    }

                    ctx.stroke();
                    ctx.globalAlpha = 1.0;




                    ctx.fillStyle = "#fff";
                    draw_spherical_light(mvp, light_pos, r, 40);

                }

                if (mvp[8] < 0.0)
                    draw_top();

                ctx.lineWidth = 1;

                let p;
                ctx.save();
                ctx.beginPath();
                p = [-size, -size, 0];
                p = ray_project(mat3_mul_vec(proj_rot, p));
                ctx.moveTo(p[0], p[1]);

                p = [size, -size, 0];
                p = ray_project(mat3_mul_vec(proj_rot, p));
                ctx.lineTo(p[0], p[1]);

                p = [size, size, 0];
                p = ray_project(mat3_mul_vec(proj_rot, p));
                ctx.lineTo(p[0], p[1]);

                p = [-size, size, 0];

                p = ray_project(mat3_mul_vec(proj_rot, p));
                ctx.lineTo(p[0], p[1]);
                ctx.closePath();

                if (mvp[8] < 0.0) {
                    ctx.fillStyle = "#111";
                    ctx.fill();
                }
                ctx.strokeStyle = "#333";
                ctx.stroke();

                ctx.clip();

                ctx.fillStyle = "#eee";
                if (mvp[8] >= 0.0)
                    draw_spherical_light(mvp, mirr_light_pos, r, 40)


                ctx.restore();

                if (mvp[8] >= 0.0)
                    draw_top();

            } else if (mode === "rough") {

                let proj_rot = mvp;
                proj_rot = mat3_mul(x_flip, proj_rot);

                ctx.translate(width * 0.5, height * 0.5);

                ctx.strokeStyle = "rgba(255, 255, 255, 0.25)";

                let a = arg0 * Math.PI * 0.38;
                let light_pos = mat3_mul_vec(rot_y_mat3(a), [0, 0, 2]);
                let mirr_light_pos = [light_pos[0], light_pos[1], -light_pos[2]];
                let dir_light_pos = [-light_pos[0], light_pos[1], light_pos[2]];
                let r = 0.2;
                let size = 2.7;

                function draw_top() {

                    function draw_in() {
                        ctx.lineWidth = 2;
                        ctx.strokeStyle = "#3260E5";
                        ctx.fillStyle = "#3260E5"

                        let p;
                        ctx.beginPath();
                        p = ray_project(mat3_mul_vec(proj_rot, vec_scale(light_pos, (2 - r) / 2)));
                        ctx.moveTo(p[0], p[1]);

                        p = ray_project(mat3_mul_vec(proj_rot, vec_scale(light_pos, 0.1)));
                        ctx.lineTo(p[0], p[1]);

                        ctx.stroke();

                        let rot = rot_y_mat3(-Math.PI + a);

                        let tip = [0, 0, 0];

                        draw_arrow_tip(tip, rot, proj_rot, 0.06);
                    }

                    function draw_out() {
                        ctx.lineWidth = 1.0;
                        ctx.strokeStyle = "rgba(230,57,48,0.8)";
                        ctx.fillStyle = "rgba(230,57,48,0.8)";
                        let mat = rot_y_mat3(-a);

                        let size = 0.04;

                        for (let i = 0; i < rand_vertices_small.length; i += 1) {
                            let v = rand_vertices_small[i].slice();
                            if (v[2] < 0.3)
                                continue;

                            v = vec_norm(vec_add(v, [0, 0, 2.0]));
                            let s = 1.2 * Math.pow(v[2], 25);
                            v = vec_scale(v, s);
                            if (v[2] < 0.1)
                                continue;
                            v = mat3_mul_vec(mat, v);
                            let p;

                            ctx.beginPath();

                            p = ray_project(mat3_mul_vec(proj_rot, [0, 0, 0]));
                            ctx.lineTo(p[0], p[1]);


                            let vec_z = vec_norm(v);
                            let vec_y = [-vec_z[1], vec_z[2], vec_z[0]];
                            vec_y = vec_norm(vec_sub(vec_y, vec_scale(vec_z, vec_dot(vec_y, vec_z))));
                            let vec_x = vec_cross(vec_y, vec_z);
                            let rot = vec_x.concat(vec_y).concat(vec_z);
                            rot = mat3_transpose(rot);


                            p = ray_project(mat3_mul_vec(proj_rot, v));
                            ctx.lineTo(p[0], p[1]);

                            ctx.stroke();


                            draw_arrow_tip(vec_scale(v, 1.12), rot, proj_rot, size * s * 0.8);
                        }
                    }

                    if (proj_rot[6] < 0) {
                        draw_in();
                        draw_out();
                    } else {
                        draw_out();
                        draw_in();
                    }

                    ctx.globalAlpha = 0.4;
                    ctx.lineWidth = 2.0;

                    ctx.strokeStyle = "#E9A923";
                    ctx.beginPath();
                    let n = 20;
                    for (let i = 0; i <= n; i++) {
                        var ang = Math.PI * 0.38 * (i / n);
                        let p = ray_project(mat3_mul_vec(proj_rot, [2 * Math.sin(ang), 0, 2 * Math.cos(ang)]));
                        ctx.lineTo(p[0], p[1]);
                    }

                    ctx.stroke();
                    ctx.globalAlpha = 1.0;




                    ctx.fillStyle = "#fff";
                    draw_spherical_light(mvp, light_pos, r, 40);

                }

                if (mvp[8] < 0.0)
                    draw_top();

                ctx.lineWidth = 1;

                let p;
                ctx.save();
                ctx.beginPath();
                p = [-size, -size, 0];
                p = ray_project(mat3_mul_vec(proj_rot, p));
                ctx.moveTo(p[0], p[1]);

                p = [size, -size, 0];
                p = ray_project(mat3_mul_vec(proj_rot, p));
                ctx.lineTo(p[0], p[1]);

                p = [size, size, 0];
                p = ray_project(mat3_mul_vec(proj_rot, p));
                ctx.lineTo(p[0], p[1]);

                p = [-size, size, 0];

                p = ray_project(mat3_mul_vec(proj_rot, p));
                ctx.lineTo(p[0], p[1]);
                ctx.closePath();

                if (mvp[8] < 0.0) {
                    ctx.fillStyle = "#111";
                    ctx.fill();
                }
                ctx.strokeStyle = "#333";
                ctx.stroke();

                ctx.clip();

                ctx.fillStyle = "#000";
                ctx.globalCompositeOperation = "lighter";
                if (mvp[8] >= 0.0) {
                    let d = 0;
                    ctx.shadowColor = "#fff";
                    ctx.shadowBlur = width * 0.08;
                    ctx.shadowOffsetX = -d * 2;
                    ctx.shadowOffsetY = -d * 2;

                    ctx.translate(d, d);
                    draw_spherical_light(mvp, mirr_light_pos, r, 40);
                    ctx.shadowBlur = width * 0.04;
                    ctx.shadowColor = "#666";
                    draw_spherical_light(mvp, mirr_light_pos, r, 40);
                }


                ctx.restore();

                if (mvp[8] >= 0.0)
                    draw_top();

            } else if (mode === "rough_inv") {

                let proj_rot = mvp;
                proj_rot = mat3_mul(x_flip, proj_rot);

                ctx.translate(width * 0.5, height * 0.5);

                ctx.strokeStyle = "rgba(255, 255, 255, 0.25)";

                let a = arg0 * Math.PI * 0.38;
                let light_pos = mat3_mul_vec(rot_y_mat3(a), [0, 0, 2]);
                let mirr_light_pos = [light_pos[0], light_pos[1], -light_pos[2]];
                let dir_light_pos = [-light_pos[0], light_pos[1], light_pos[2]];
                let r = 0.2;
                let size = 2.7;

                function draw_top() {

                    function draw_in() {
                        ctx.lineWidth = 1.0;
                        ctx.strokeStyle = "rgba(56, 108, 255, 0.7)";
                        ctx.fillStyle = "rgba(56, 108, 255, 0.7)"


                        let mat = rot_y_mat3(2.25 * Math.PI);

                        let size = 0.04;

                        for (let i = 0; i < rand_vertices_small.length; i += 1) {
                            let v = rand_vertices_small[i].slice();
                            if (v[2] < 0.3)
                                continue;
                            v = vec_norm(vec_add(v, [0, 0, 2.0]));
                            let s = 1.6 * Math.pow(v[2], 25);

                            v = vec_scale(v, s);
                            if (v[2] < 0.1)
                                continue;
                            v = mat3_mul_vec(mat, v);
                            let p;

                            ctx.beginPath();

                            p = ray_project(mat3_mul_vec(proj_rot, [0, 0, 0]));
                            ctx.lineTo(p[0], p[1]);


                            let vec_z = vec_norm(vec_scale(v, -1));
                            let vec_y = [-vec_z[1], vec_z[2], vec_z[0]];
                            vec_y = vec_norm(vec_sub(vec_y, vec_scale(vec_z, vec_dot(vec_y, vec_z))));
                            let vec_x = vec_cross(vec_y, vec_z);
                            let rot = vec_x.concat(vec_y).concat(vec_z);
                            rot = mat3_transpose(rot);


                            p = ray_project(mat3_mul_vec(proj_rot, v));
                            ctx.lineTo(p[0], p[1]);

                            ctx.stroke();

                            draw_arrow_tip(vec_scale(v, 0.8), rot, proj_rot, size * s * 0.8);
                        }
                    }

                    function draw_out() {
                        ctx.lineWidth = 2.0;
                        ctx.strokeStyle = "rgba(230,57,48,1.0)";
                        ctx.fillStyle = "rgba(230,57,48,1.0)";

                        let rot = rot_y_mat3(Math.PI * 1.75);

                        let dir_light_pos = mat3_mul_vec(rot, [0, 0, 2]);

                        let p;
                        ctx.beginPath();
                        p = ray_project(mat3_mul_vec(proj_rot, vec_scale(dir_light_pos, 0.8)));
                        ctx.moveTo(p[0], p[1]);

                        p = ray_project(mat3_mul_vec(proj_rot, [0, 0, 0]));
                        ctx.lineTo(p[0], p[1]);

                        ctx.stroke();


                        let tip = vec_scale(dir_light_pos, 0.9);

                        draw_arrow_tip(tip, rot, proj_rot, 0.06);
                    }

                    if (proj_rot[6] < 0) {
                        draw_in();
                        draw_out();
                    } else {
                        draw_out();
                        draw_in();
                    }

                    ctx.globalAlpha = 0.4;
                    ctx.lineWidth = 2.0;

                    ctx.strokeStyle = "#E9A923";
                    ctx.beginPath();
                    let n = 20;
                    for (let i = 0; i <= n; i++) {
                        var ang = Math.PI * 0.38 * (i / n);
                        let p = ray_project(mat3_mul_vec(proj_rot, [2 * Math.sin(ang), 0, 2 * Math.cos(ang)]));
                        ctx.lineTo(p[0], p[1]);
                    }

                    ctx.stroke();
                    ctx.globalAlpha = 1.0;




                    ctx.fillStyle = "#fff";
                    draw_spherical_light(mvp, light_pos, r, 40);

                }

                if (mvp[8] < 0.0)
                    draw_top();

                ctx.lineWidth = 1;

                let p;
                ctx.save();
                ctx.beginPath();
                p = [-size, -size, 0];
                p = ray_project(mat3_mul_vec(proj_rot, p));
                ctx.moveTo(p[0], p[1]);

                p = [size, -size, 0];
                p = ray_project(mat3_mul_vec(proj_rot, p));
                ctx.lineTo(p[0], p[1]);

                p = [size, size, 0];
                p = ray_project(mat3_mul_vec(proj_rot, p));
                ctx.lineTo(p[0], p[1]);

                p = [-size, size, 0];

                p = ray_project(mat3_mul_vec(proj_rot, p));
                ctx.lineTo(p[0], p[1]);
                ctx.closePath();

                if (mvp[8] < 0.0) {
                    ctx.fillStyle = "#111";
                    ctx.fill();
                }
                ctx.strokeStyle = "#333";
                ctx.stroke();

                ctx.clip();

    
                ctx.fillStyle = "#000";
                ctx.globalCompositeOperation = "lighter";
                if (mvp[8] >= 0.0) {
                    let d = 0;
                    ctx.shadowColor = "#fff";
                    ctx.shadowBlur = width * 0.08;
                    ctx.shadowOffsetX = -d * 2;
                    ctx.shadowOffsetY = -d * 2;

                    ctx.translate(d, d);
                    draw_spherical_light(mvp, mirr_light_pos, r, 40);
                    ctx.shadowBlur = width * 0.04;
                    ctx.shadowColor = "#666";
                    draw_spherical_light(mvp, mirr_light_pos, r, 40);
                }


                ctx.restore();

                if (mvp[8] >= 0.0)
                    draw_top();

            } else if (mode === "lambert_inv") {

                let a = arg0 * Math.PI * 0.47;
                let light_pos = mat3_mul_vec(rot_y_mat3(a), [0, 0, 3]);

                let r = 0.1;
                let size = 2.7;

                if (mvp[8] >= 0.0) {

                    gl.begin(width, height);
                    gl.draw_simple(mvp, light_pos, r, size * 2, 80);
                    ctx.drawImage(gl.finish(), 0, 0, width, height);
                }

                let proj_rot = mvp;
                proj_rot = mat3_mul(x_flip, proj_rot);

                ctx.translate(width * 0.5, height * 0.5);

                ctx.strokeStyle = "rgba(255, 255, 255, 0.25)";


                function draw_top() {

                    function draw_in() {
                        ctx.lineWidth = 1.0;
                        ctx.strokeStyle = "rgba(56, 108, 255, 0.7)";
                        ctx.fillStyle = "rgba(56, 108, 255, 0.7)"


                        let size = 0.04;

                        for (let i = 0; i < rand_vertices_small.length; i += 1) {
                            let v = rand_vertices_small[i].slice();
                            if (v[2] < 0.0)
                                v[2] = -v[2];

                            let s = 1.5 * v[2];

                            v = vec_scale(v, s);

                            let p;

                            ctx.beginPath();

                            p = ray_project(mat3_mul_vec(proj_rot, [0, 0, 0]));
                            ctx.lineTo(p[0], p[1]);


                            let vec_z = vec_norm(vec_scale(v, -1));
                            let vec_y = [-vec_z[1], vec_z[2], vec_z[0]];
                            vec_y = vec_norm(vec_sub(vec_y, vec_scale(vec_z, vec_dot(vec_y, vec_z))));
                            let vec_x = vec_cross(vec_y, vec_z);
                            let rot = vec_x.concat(vec_y).concat(vec_z);
                            rot = mat3_transpose(rot);


                            p = ray_project(mat3_mul_vec(proj_rot, v));
                            ctx.lineTo(p[0], p[1]);

                            ctx.stroke();


                            draw_arrow_tip(vec_scale(v, 0.8), rot, proj_rot, size * s * 0.8);
                        }
                    }

                    function draw_out() {
                        let rot = rot_y_mat3(Math.PI * 1.75);

                        let dir_light_pos = mat3_mul_vec(rot, [0, 0, 2]);
                        ctx.lineWidth = 2.0;
                        ctx.strokeStyle = "rgba(230,57,48,1.0)";
                        ctx.fillStyle = "rgba(230,57,48,1.0)";

                        let p;
                        ctx.beginPath();
                        p = ray_project(mat3_mul_vec(proj_rot, vec_scale(dir_light_pos, 0.8)));
                        ctx.moveTo(p[0], p[1]);

                        p = ray_project(mat3_mul_vec(proj_rot, [0, 0, 0]));
                        ctx.lineTo(p[0], p[1]);

                        ctx.stroke();


                        let tip = vec_scale(dir_light_pos, 0.9);

                        draw_arrow_tip(tip, rot, proj_rot, 0.06);
                    }

                    draw_in();

                    draw_out();



                    ctx.globalAlpha = 0.4;
                    ctx.lineWidth = 2.0;

                    ctx.strokeStyle = "#E9A923";
                    ctx.beginPath();
                    let n = 20;
                    for (let i = 0; i <= n; i++) {
                        var ang = Math.PI * 0.47 * (i / n);
                        let p = ray_project(mat3_mul_vec(proj_rot, [3 * Math.sin(ang), 0, 3 * Math.cos(ang)]));
                        ctx.lineTo(p[0], p[1]);
                    }

                    ctx.stroke();
                    ctx.globalAlpha = 1.0;

                    ctx.fillStyle = "#fff";
                    draw_spherical_light(mvp, light_pos, r);

                }

                if (mvp[8] < 0.0)
                    draw_top();

                ctx.lineWidth = 1;

                let p;
                ctx.save();
                ctx.beginPath();
                p = [-size, -size, 0];
                p = ray_project(mat3_mul_vec(proj_rot, p));
                ctx.moveTo(p[0], p[1]);

                p = [size, -size, 0];
                p = ray_project(mat3_mul_vec(proj_rot, p));
                ctx.lineTo(p[0], p[1]);

                p = [size, size, 0];
                p = ray_project(mat3_mul_vec(proj_rot, p));
                ctx.lineTo(p[0], p[1]);

                p = [-size, size, 0];

                p = ray_project(mat3_mul_vec(proj_rot, p));
                ctx.lineTo(p[0], p[1]);
                ctx.closePath();

                if (mvp[8] < 0.0) {
                    ctx.fillStyle = "#000";
                    ctx.fill();
                }
                ctx.strokeStyle = "#333";
                ctx.stroke();

                ctx.restore();

                if (mvp[8] >= 0.0)
                    draw_top();
            }

            else if (mode === "lambert") {

                let a = arg0 * Math.PI * 0.47;
                let light_pos = mat3_mul_vec(rot_y_mat3(a), [0, 0, 3]);

                let r = 0.1;
                let size = 2.7;

                if (mvp[8] >= 0.0) {

                    gl.begin(width, height);
                    gl.draw_simple(mvp, light_pos, r, size * 2, 80);
                    ctx.drawImage(gl.finish(), 0, 0, width, height);
                }

                let proj_rot = mvp;
                proj_rot = mat3_mul(x_flip, proj_rot);

                ctx.translate(width * 0.5, height * 0.5);

                ctx.strokeStyle = "rgba(255, 255, 255, 0.25)";


                function draw_top() {

                    function draw_in() {
                        ctx.lineWidth = 2;
                        ctx.strokeStyle = "#3260E5";
                        ctx.fillStyle = "#3260E5"

                        let p;
                        ctx.beginPath();
                        p = ray_project(mat3_mul_vec(proj_rot, vec_scale(light_pos, (3 - r) / 3)));
                        ctx.moveTo(p[0], p[1]);

                        p = ray_project([0, 0, 0]);
                        ctx.lineTo(p[0], p[1]);

                        ctx.stroke();

                        let rot = rot_y_mat3(-Math.PI + a);

                        let tip = vec_scale(light_pos, 0.7);

                        draw_arrow_tip(tip, rot, proj_rot, 0.06);
                    }

                    function draw_out() {
                        ctx.lineWidth = 1.5;
                        ctx.strokeStyle = "rgba(230,57,48,0.8)";
                        ctx.fillStyle = "rgba(230,57,48,0.8)";

                        let size = 0.035 * light_pos[2] * 0.5 + 0.005

                        for (let i = 0; i < rand_vertices_small.length; i += 1) {
                            let v = rand_vertices_small[i].slice();
                            let p;

                            ctx.beginPath();

                            p = ray_project(mat3_mul_vec(proj_rot, [0, 0, 0]));
                            ctx.lineTo(p[0], p[1]);

                            v[2] = Math.abs(v[2]);

                            let vec_z = vec_norm(v);
                            let vec_y = [-vec_z[1], vec_z[2], vec_z[0]];
                            vec_y = vec_norm(vec_sub(vec_y, vec_scale(vec_z, vec_dot(vec_y, vec_z))));
                            let vec_x = vec_cross(vec_y, vec_z);
                            let rot = vec_x.concat(vec_y).concat(vec_z);
                            rot = mat3_transpose(rot);

                            v = vec_scale(v, light_pos[2] * 0.45);

                            p = ray_project(mat3_mul_vec(proj_rot, v));
                            ctx.lineTo(p[0], p[1]);

                            ctx.stroke();


                            draw_arrow_tip(vec_scale(v, 1.08), rot, proj_rot, size);
                        }




                    }

                    draw_in();

                    draw_out();



                    ctx.globalAlpha = 0.4;
                    ctx.lineWidth = 2.0;

                    ctx.strokeStyle = "#E9A923";
                    ctx.beginPath();
                    let n = 20;
                    for (let i = 0; i <= n; i++) {
                        var ang = Math.PI * 0.47 * (i / n);
                        let p = ray_project(mat3_mul_vec(proj_rot, [3 * Math.sin(ang), 0, 3 * Math.cos(ang)]));
                        ctx.lineTo(p[0], p[1]);
                    }

                    ctx.stroke();
                    ctx.globalAlpha = 1.0;

                    ctx.fillStyle = "#fff";
                    draw_spherical_light(mvp, light_pos, r);

                }

                if (mvp[8] < 0.0)
                    draw_top();

                ctx.lineWidth = 1;

                let p;
                ctx.save();
                ctx.beginPath();
                p = [-size, -size, 0];
                p = ray_project(mat3_mul_vec(proj_rot, p));
                ctx.moveTo(p[0], p[1]);

                p = [size, -size, 0];
                p = ray_project(mat3_mul_vec(proj_rot, p));
                ctx.lineTo(p[0], p[1]);

                p = [size, size, 0];
                p = ray_project(mat3_mul_vec(proj_rot, p));
                ctx.lineTo(p[0], p[1]);

                p = [-size, size, 0];

                p = ray_project(mat3_mul_vec(proj_rot, p));
                ctx.lineTo(p[0], p[1]);
                ctx.closePath();

                if (mvp[8] < 0.0) {
                    ctx.fillStyle = "#000";
                    ctx.fill();
                }
                ctx.strokeStyle = "#333";
                ctx.stroke();

                ctx.restore();

                if (mvp[8] >= 0.0)
                    draw_top();

            } else if (mode === "lambert_emitter") {

                let proj_rot = mvp;
                proj_rot = mat3_mul(x_flip, proj_rot);

                ctx.translate(width * 0.5, height * 0.5);

                ctx.strokeStyle = "rgba(255, 255, 255, 0.25)";

                let a = arg0 * Math.PI * 0.47;

                let l = 6;

                let size = 0.8;

                function draw_top() {

                    ctx.lineWidth = 1;
                    ctx.strokeStyle = "rgba(231, 181, 75, 1.0)";
                    ctx.fillStyle = "rgba(231, 181, 75, 1.0)";

                    let size = 0.06;

                    for (let i = 0; i < rand_vertices_small.length; i += 1) {
                        let v = rand_vertices_small[i].slice();
                        let p;

                        ctx.beginPath();

                        p = ray_project(mat3_mul_vec(proj_rot, [0, 0, -l * 0.5]));
                        ctx.lineTo(p[0], p[1]);

                        v[2] += 1;

                        let vec_z = vec_norm(v);
                        let vec_y = [-vec_z[1], vec_z[2], vec_z[0]];
                        vec_y = vec_norm(vec_sub(vec_y, vec_scale(vec_z, vec_dot(vec_y, vec_z))));
                        let vec_x = vec_cross(vec_y, vec_z);
                        let rot = vec_x.concat(vec_y).concat(vec_z);
                        rot = mat3_transpose(rot);

                        v = vec_scale(v, l * 0.5);
                        v[2] -= l * 0.5;

                        p = ray_project(mat3_mul_vec(proj_rot, v));
                        ctx.lineTo(p[0], p[1]);

                        ctx.stroke();


                        draw_arrow_tip(vec_scale(v, 1.0), rot, proj_rot, size);
                    }

                }


                ctx.lineWidth = 1;

                let b = size * 0.5;
                ctx.beginPath();

                let ps = [];

                let p = [-b, -b, -l / 2];
                p = ray_project(mat3_mul_vec(proj_rot, p));
                ps.push(p.slice(0, 2));

                p = [b, -b, -l / 2];
                p = ray_project(mat3_mul_vec(proj_rot, p));
                ps.push(p.slice(0, 2));

                p = [b, b, -l / 2];
                p = ray_project(mat3_mul_vec(proj_rot, p));
                ps.push(p.slice(0, 2));

                p = [-b, b, -l / 2];
                p = ray_project(mat3_mul_vec(proj_rot, p));
                ps.push(p.slice(0, 2));




                let sum = 0.0;
                for (let i = 0; i < 4; i++)
                    sum += vec_cross(ps[i], ps[(i + 1) & 3])[2];

                if (sum >= 0.0)
                    draw_top();


                ctx.beginPath();
                for (let i = 0; i < 4; i++)
                    ctx.lineTo(ps[i][0], ps[i][1]);

                ctx.closePath();


                ctx.fillStyle = (sum < 0.0) ? "#fff" : "#000";
                ctx.strokeStyle = "#333";
                ctx.fill();
                ctx.stroke();


                ctx.restore();

                if (sum < 0.0)
                    draw_top();

            }


            else if (mode === "radian") {

                ctx.translate(width * 0.5, height * 0.45);
                let s = height * 0.4 - 5;

                let offset = 0;
                let w = width - 20;
                let r = w / (2 * Math.PI);

                ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
                ctx.lineWidth = 1.0;

                ctx.save();
                ctx.setLineDash([2, 3]);
                ctx.strokeEllipse(offset, 0, r);
                ctx.restore();

                ctx.save();
                ctx.scale(1, -1);
                ctx.beginPath();
                ctx.ellipse(offset, 0, r * 0.2, r * 0.2, 0, 0, Math.PI * 2 * arg0);
                ctx.stroke();
                ctx.restore();

                ctx.lineWidth = 3.0;

                ctx.strokeStyle = "#235AB9";

                ctx.beginPath();
                ctx.moveTo(10 - width * 0.5, height * 0.5);
                ctx.lineTo(10 - width * 0.5 + r, height * 0.5);
                ctx.stroke();

                ctx.beginPath();
                ctx.moveTo(offset, 0);
                ctx.lineTo(offset + r * Math.cos(Math.PI * 2 * arg0), -r * Math.sin(Math.PI * 2 * arg0));
                ctx.stroke();

                ctx.beginPath();
                ctx.moveTo(offset, 0);
                ctx.lineTo(offset + r, 0);
                ctx.stroke();

                ctx.strokeStyle = "#E9A923";

                ctx.save();
                ctx.scale(1, -1);
                ctx.beginPath();
                ctx.ellipse(offset, 0, r, r, 0, 0, Math.max(0.0001, Math.PI * 2 * arg0));
                ctx.stroke();
                ctx.restore();

                ctx.beginPath();
                ctx.moveTo(10 - width * 0.5, height * 0.5 - 10);
                ctx.lineTo(10 - width * 0.5 + Math.max(0.001, w * arg0), height * 0.5 - 10);
                ctx.stroke();

                ctx.textAlign = "left";
                ctx.fillStyle = "#ddd";
                ctx.fillText((arg0 * 360).toFixed(1) + "°", r * 1.5, -font_size * 0.4);
                ctx.fillText((arg0 * 2 * Math.PI).toFixed(2) + " rad", r * 1.5, font_size * 1.3);


            } else if (mode === "steradian" || mode === "steradian2") {
                let qw = 2.0;
                let qh = 1.5;

                if (mode === "steradian2") {
                    qw = 0.5;
                    qh = 0.3;
                }
                let d = arg0 * 2.0 + 1.5;

                let light_p = [[-qw * 0.5, -qh * 0.5, d],
                [-qw * 0.5, qh * 0.5, d],
                [qw * 0.5, qh * 0.5, d],
                [qw * 0.5, -qh * 0.5, d],
                ];

                gl.begin(width, height);
                gl.draw_solid_angle(mvp, ident_matrix, [qw, qh], [0, 0, d], 0.0);

                ctx.drawImage(gl.finish(), 0, 0, width, height);

                ctx.translate(width * 0.5, height * 0.5);


                let proj_rot = mvp;
                proj_rot = mat3_mul(x_flip, proj_rot);

                let r = height * 0.171;

                ctx.fillStyle = "rgba(255, 255, 255, 0.3)"
                ctx.strokeStyle = "#666";

                ctx.lineWidth = 1.0;
                ctx.strokeEllipse(0, 0, r);

                r = 1.4;

                function draw_light() {

                    ctx.fillStyle = "rgba(233, 169, 35, 0.5)";
                    ctx.strokeStyle = "#E9A923";

                    let p;

                    ctx.beginPath();

                    p = ray_project(mat3_mul_vec(proj_rot, light_p[0]));
                    ctx.moveTo(p[0], p[1]);

                    p = ray_project(mat3_mul_vec(proj_rot, light_p[1]));
                    ctx.lineTo(p[0], p[1]);

                    p = ray_project(mat3_mul_vec(proj_rot, light_p[2]));
                    ctx.lineTo(p[0], p[1]);

                    p = ray_project(mat3_mul_vec(proj_rot, light_p[3]));
                    ctx.lineTo(p[0], p[1]);
                    ctx.closePath();


                    ctx.fill();
                    ctx.stroke();
                }


                let edge_n = 30;

                ctx.strokeStyle = "#E9A923";
                ctx.beginPath();

                for (let edge = 0; edge < 4; edge++) {
                    let p0 = light_p[edge];
                    let p1 = light_p[(edge + 1) % 4];
                    let d = vec_sub(p1, p0);

                    for (let i = 0; i < edge_n; i++) {
                        let p = vec_add(p0, vec_scale(d, i / (edge_n - 1)));

                        p = vec_norm(p);
                        p = vec_scale(p, r);
                        p = ray_project(mat3_mul_vec(proj_rot, p));

                        ctx.lineTo(p[0], p[1]);
                    }
                }

                ctx.stroke();

                ctx.save();


                ctx.strokeStyle = "rgba(255, 255, 255, 0.1)"

                for (let edge = 0; edge < 4; edge++) {

                    ctx.globalCompositeOperation = "source-over";

                    ctx.beginPath();

                    let p;

                    p = [0, 0, 0];
                    p = ray_project(mat3_mul_vec(proj_rot, p));
                    ctx.lineTo(p[0], p[1]);

                    p = light_p[edge];
                    p = vec_norm(p);
                    p = vec_scale(p, r);
                    p = ray_project(mat3_mul_vec(proj_rot, p));
                    ctx.lineTo(p[0], p[1]);

                    ctx.stroke();

                    ctx.beginPath();
                    ctx.lineTo(p[0], p[1]);

                    p = mat3_mul_vec(proj_rot, light_p[edge]);

                    if (p[2] < 0.0)
                        ctx.globalCompositeOperation = "destination-over";

                    p = ray_project(p);
                    ctx.lineTo(p[0], p[1]);

                    ctx.stroke();
                }


                if (mvp[8] < 0.0)
                    ctx.globalCompositeOperation = "destination-over";
                else
                    ctx.globalCompositeOperation = "source-over";

                draw_light();

                ctx.restore();
            }
            else if (mode === "steradian_sphere") {

                let r = 3.0;
                let z = (arg0 * -2 + 1);


                gl.begin(width, height);
                gl.draw_solid_sphere_angle(mvp, [r, z * r, - 20]);

                ctx.drawImage(gl.finish(), 0, - Math.round(width * 0.1), width, height);

                ctx.translate(width * 0.5, height * 0.5 - width * 0.1);

                let proj_rot = mvp;
                proj_rot = mat3_mul(x_flip, proj_rot);

                {
                    let r = height * 0.380;

                    // ctx.strokeStyle = "rgba(255, 255, 255, 0.3)"
                    ctx.strokeStyle = "#666";

                    ctx.lineWidth = 1.0;
                    ctx.strokeEllipse(0, 0, r);
                }



                let edge_n = 120;

                ctx.strokeStyle = "rgba(233, 169, 35, 0.6)";

                ctx.beginPath();

                let points = [[0, 0]];
                let rr = r * Math.sqrt(1 - z * z);

                for (let i = 0; i <= edge_n; i++) {
                    let t = Math.PI * 2 * i / edge_n;
                    let p = [rr * Math.cos(t), rr * Math.sin(t), z * r];

                    p = ray_project(mat3_mul_vec(proj_rot, p));

                    ctx.lineTo(p[0], p[1]);

                    points.push(p);
                }


                ctx.closePath();
                ctx.stroke();

                ctx.save();


                ctx.globalCompositeOperation = "destination-over";

                ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
                ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";

                points = convex_hull(points);
                ctx.beginPath();
                for (let i = 0; i < points.length; i++)
                    ctx.lineTo(points[i][0], points[i][1]);

                ctx.fill();
                ctx.stroke();


                ctx.fillStyle = "#aaa";
                ctx.fillEllipse(0, 0, 3);

                ctx.restore();

                let a = Math.abs(z) * 2 * Math.PI;
                if (z < 0)
                    a += 2 * Math.PI;
                else
                    a = 2 * Math.PI - a;

                ctx.fillStyle = "#ddd";
                ctx.fillText((a).toFixed(2) + " steradian" + ((a).toFixed(2) != "1.00" ? "s" : ""), 0, height * 0.52);
            }
        }

        if (load_text)
            document.fonts.load("10px IBM Plex Sans").then(function () { self.repaint() });

        this.on_resize();

        window.addEventListener("resize", this.on_resize, true);
        window.addEventListener("load", this.on_resize, true);

    }

    document.addEventListener("DOMContentLoaded", function (event) {


        power = new Drawer(scale, document.getElementById("lns_power"), "power");

        power_slider = new Slider(document.getElementById("lns_power_slider_container"), function (x) {
            power.set_arg0(x);
        }, undefined, 0);

        let power_plain = new Drawer(scale, document.getElementById("lns_power_plain"), "power_plain");

        let power_plain_slider = new Slider(document.getElementById("lns_power_plain_slider_container"), function (x) {
            power_plain.set_arg0(x);
        });

        let power_rays = new Drawer(scale, document.getElementById("lns_power_rays"), "power_rays");

        let power_rays_slider = new Slider(document.getElementById("lns_power_rays_slider_container"), function (x) {
            power_rays.set_arg0(x);
        });

        let power_surf = new Drawer(scale, document.getElementById("lns_power_surf"), "power_surf");
        power_surf_slider = new Slider(document.getElementById("lns_power_surf_slider_container"), function (x) {
            power_surf.set_arg0(x);
        }, undefined, 0);

        let cosine_flat = new Drawer(scale, document.getElementById("lns_cosine_flat"), "cosine_flat");

        new Slider(document.getElementById("lns_cosine_flat_alt_slider_container"), function (x) {
            cosine_flat.set_arg0(x);
        });

        new Slider(document.getElementById("lns_cosine_flat_dist_slider_container"), function (x) {
            cosine_flat.set_arg1(x);
        });

        let ray_flat = new Drawer(scale, document.getElementById("lns_ray_flat"), "ray_flat");

        new Slider(document.getElementById("lns_ray_flat_alt_slider_container"), function (x) {
            ray_flat.set_arg0(x);
        });

        new Slider(document.getElementById("lns_ray_flat_dist_slider_container"), function (x) {
            ray_flat.set_arg1(x);
        });




        let inv_square = new Drawer(scale, document.getElementById("lns_inv_square"), "inv_square");

        new Slider(document.getElementById("lns_inv_square_slider_container"), function (x) {
            inv_square.set_arg0(x);
        });


        let cosine = new Drawer(scale, document.getElementById("lns_cosine"), "cosine");
        new Slider(document.getElementById("lns_cosine_slider_container"), function (x) {
            cosine.set_arg0(x);
        });

        let cosine_side = new Drawer(scale, document.getElementById("lns_cosine_side"), "cosine_side");
        new Slider(document.getElementById("lns_cosine_side_slider_container"), function (x) {
            cosine_side.set_arg0(x);
        }, undefined, 0.3);

        let distance = new Drawer(scale, document.getElementById("lns_distance"), "distance");
        new Slider(document.getElementById("lns_distance_slider_container"), function (x) {
            distance.set_arg0(x);
        }, undefined, 0);

        let car = new Drawer(scale, document.getElementById("lns_car"), "car");
        new Slider(document.getElementById("lns_car_slider_container"), function (x) {
            car.set_arg0(x);
        }, undefined, 0);

        let car_clicks = 0;
        document.getElementById("lns_car").addEventListener("click", function() {
            car_clicks++;
            if (car_clicks == 5) {
                casey_mode = true;
                car.repaint();
            }
        }, true);

        let radiance = new Drawer(scale, document.getElementById("lns_radiance"), "radiance");
        new Slider(document.getElementById("lns_radiance_slider_container"), function (x) {
            radiance.set_arg0(x);
        }, undefined, 0);

        let radiance_area = new Drawer(scale, document.getElementById("lns_radiance_area"), "radiance_area");

        new Slider(document.getElementById("lns_radiance_area_slider_container"), function (x) {
            radiance_area.set_arg0(x);
        }, undefined, 0.0);

        let area = new Drawer(scale, document.getElementById("lns_area"), "area");

        new Slider(document.getElementById("lns_area_rot_x_slider_container"), function (x) {
            area.set_arg0(x);
        });
        new Slider(document.getElementById("lns_area_rot_y_slider_container"), function (x) {
            area.set_arg1(x);
        });


        let area2 = new Drawer(scale, document.getElementById("lns_area2"), "area");

        new Slider(document.getElementById("lns_area2_rot_x_slider_container"), function (x) {
            area2.set_arg0(x);
        });
        new Slider(document.getElementById("lns_area2_rot_y_slider_container"), function (x) {
            area2.set_arg1(x);
        });

        let mirror_simple = new Drawer(scale, document.getElementById("lns_mirror_simple"), "mirror_simple");
        new Slider(document.getElementById("lns_mirror_simple_slider_container"), function (x) {
            mirror_simple.set_arg0(x);
        });

        mirror = new Drawer(scale, document.getElementById("lns_mirror"), "mirror");
        new Slider(document.getElementById("lns_mirror_slider_container"), function (x) {
            mirror.set_arg0(x);
        });

        let rough = new Drawer(scale, document.getElementById("lns_rough"), "rough");
        new Slider(document.getElementById("lns_rough_slider_container"), function (x) {
            rough.set_arg0(x);
        });

        rough_inv = new Drawer(scale, document.getElementById("lns_rough_inv"), "rough_inv");
        rough_inv_slider = new Slider(document.getElementById("lns_rough_inv_slider_container"), function (x) {
            rough_inv.set_arg0(x);
        });


        let lambert = new Drawer(scale, document.getElementById("lns_lambert"), "lambert");
        new Slider(document.getElementById("lns_lambert_slider_container"), function (x) {
            lambert.set_arg0(x);
        });

        let lambert_inv = new Drawer(scale, document.getElementById("lns_lambert_inv"), "lambert_inv");
        new Slider(document.getElementById("lns_lambert_inv_slider_container"), function (x) {
            lambert_inv.set_arg0(x);
        });


        let lambert_emitter = new Drawer(scale, document.getElementById("lns_lambert_emitter"), "lambert_emitter");

        let lambert_side = new Drawer(scale, document.getElementById("lns_lambert_emitter_side"), "lambert_side");

        new Slider(document.getElementById("lns_lambert_emitter_side_slider_container"), function (x) {
            lambert_side.set_arg0(x);
        });



        let hemisphere = new Drawer(scale, document.getElementById("lns_hemisphere"), "hemisphere");

        new Slider(document.getElementById("lns_hemisphere_0_slider_container"), function (x) {
            hemisphere.set_arg0(x);
        });

        new Slider(document.getElementById("lns_hemisphere_1_slider_container"), function (x) {
            hemisphere.set_arg1(x);
        });


        let hemisphere_proj = new Drawer(scale, document.getElementById("lns_hemisphere_proj"), "hemisphere_proj");

        new Slider(document.getElementById("lns_hemisphere_proj_0_slider_container"), function (x) {
            hemisphere_proj.set_arg0(x);
        });

        new Slider(document.getElementById("lns_hemisphere_proj_1_slider_container"), function (x) {
            hemisphere_proj.set_arg1(x);
        });



        radian = new Drawer(scale, document.getElementById("lns_radian"), "radian");

        radian_slider = new Slider(document.getElementById("lns_radian_slider_container"), function (x) {
            radian.set_arg0(x);
        }, undefined, 0.25);


        let angle_small = new Drawer(scale, document.getElementById("lns_angle_small"), "angle_small");

        new Slider(document.getElementById("lns_angle_small_slider_container"), function (x) {
            angle_small.set_arg0(x);
        }, undefined, 0.0);


        let steradian = new Drawer(scale, document.getElementById("lns_steradian"), "steradian");

        new Slider(document.getElementById("lns_steradian_slider_container"), function (x) {
            steradian.set_arg0(x);
        });


        let steradian2 = new Drawer(scale, document.getElementById("lns_steradian2"), "steradian2");

        new Slider(document.getElementById("lns_steradian2_slider_container"), function (x) {
            steradian2.set_arg0(x);
        }, undefined, 0);



        steradian_sphere = new Drawer(scale, document.getElementById("lns_steradian_sphere"), "steradian_sphere");

        steradian_sphere_slider = new Slider(document.getElementById("lns_steradian_sphere_slider_container"), function (x) {
            steradian_sphere.set_arg0(x);
        }, undefined, 0.07957747155);

        let cosine_sphere = new Drawer(scale, document.getElementById("lns_cosine_sphere"), "cosine_sphere");


        let bounce_paths = new Drawer(scale, document.getElementById("lns_bounce_paths"), "bounce_paths");
        new Slider(document.getElementById("lns_bounce_paths_slider_container"), function (x) {
            bounce_paths.set_arg0(x);
        }, undefined, 0);



        bounce = new Drawer(scale, document.getElementById("lns_bounce"), "bounce");
        new Slider(document.getElementById("lns_bounce_slider_container"), function (x) {
            bounce.set_arg0(x);
        }, undefined, 0);


        let bounce_steps = new Drawer(scale, document.getElementById("lns_bounce_steps"), "bounce_steps");

        new SegmentedControl(document.getElementById("lns_bounce_steps_segment_container"), function (x) {
            bounce_steps.set_arg0(x);
        },
            ["0", "1", "2", "3", "4", "5", "6", "7", "8", "All"]
        );

        let color_simple = new Drawer(scale, document.getElementById("lns_color_simple"), "color_simple");

        new SegmentedControl(document.getElementById("lns_color_simple_segment_container"), function (x) {
            color_simple.set_arg0(x);
        },
            ["White", "Yellow", "Red", "Green", "Blue"]
        );

        let color = new Drawer(scale, document.getElementById("lns_color"), "color");

        new SegmentedControl(document.getElementById("lns_color_segment_container"), function (x) {
            color.set_arg0(x);
        },
            ["White", "Red", "Green", "Blue", "Cyan"]
        );

        color_rgb = new Drawer(scale, document.getElementById("lns_color_rgb"), "color_rgb");
        rgb0 = new Slider(document.getElementById("lns_rgb0_slider_container"), function (x) {
            color_rgb.set_arg0(x);
        });
        rgb1 = new Slider(document.getElementById("lns_rgb1_slider_container"), function (x) {
            color_rgb.set_arg1(x);
        }, undefined, 0);
        rgb2 = new Slider(document.getElementById("lns_rgb2_slider_container"), function (x) {
            color_rgb.set_arg2(x);
        });


        let ambient_proj = new Drawer(scale, document.getElementById("lns_ambient_proj"), "ambient_proj");

        new Slider(document.getElementById("lns_ambient_proj_slider_container"), function (x) {
            ambient_proj.set_arg0(x);
        });






        let shadow = new Drawer(scale, document.getElementById("lns_shadow"), "shadow");

        new Slider(document.getElementById("lns_shadow_rot_x_slider_container"), function (x) {
            shadow.set_arg0(x);
        });
        new Slider(document.getElementById("lns_shadow_rot_y_slider_container"), function (x) {
            shadow.set_arg1(x);
        });

        new Drawer(scale, document.getElementById("lns_ambient_dots"), "ambient_dots");


        let hemi_progress = 0;
        let ambient_hemi_container = document.getElementById("lns_ambient_hemi");
        let ambient_hemi = new Drawer(scale, ambient_hemi_container, "ambient_hemi");


        let wrapper = document.getElementById("lns_ambient_hemi_container");

        let sphere = document.createElement("div");
        sphere.classList.add("non_selectable");
        sphere.style.position = "absolute";
        sphere.style.pointerEvents = "none";
        sphere.style.top = "0";
        sphere.style.left = "0";
        sphere.style.width = "0";
        sphere.style.height = "0";
        sphere.style.background = "#f8f8f8";
        sphere.style.transform = "translateZ(0)";

        ambient_hemi_container.appendChild(sphere);

        let prev_w = undefined;

        let ambient_resize = function () {

            let cw = ambient_hemi_container.clientWidth;
            let w0 = cw * 0.92;
            let w1 = Math.max(window.innerHeight, window.innerWidth) * 1.42;

            let scale_min = 0.5;
            let scale_max = 0.5 * w1 / w0;

            let hemi_a = 1.0 - Math.max(0, 5 * hemi_progress - 4);

            sphere.style.background = "#f8f8f";
            sphere.style.width = w0 / scale_min + "px";
            sphere.style.height = w0 / scale_min + "px";
            sphere.style.borderRadius = (0.5 * w0 / scale_min) + "px";
            sphere.style.left = ((cw - w0 * 2) * scale_min) + "px";
            sphere.style.top = ((cw - w0 * 2) * scale_min) + "px";
            sphere.style.opacity = hemi_a;

            let scale = scale_min + (scale_max - scale_min) * hemi_progress * 1.25
            sphere.style.transform = "translateZ(0) scale(" + scale + "," + scale + ")";


            let c = 248 * (hemi_progress > 0.8 ? 1.0 : 0.0);

            sphere.style.display = hemi_progress == 1.0 ? "none" : "block";


            wrapper.style.background = "rgb(" + c + "," + c + "," + c + ")";
        };

        ambient_resize();
        window.addEventListener("resize", ambient_resize, true);
        window.addEventListener("load", ambient_resize, true);

        new Slider(document.getElementById("lns_ambient_hemi_slider_container"), function (x) {
            hemi_progress = x;
            ambient_resize();
        }, undefined, 0);


        shadow_hemi = new Drawer(scale, document.getElementById("lns_shadow_hemi"), "shadow_hemi");

        new Slider(document.getElementById("lns_shadow_hemi0_slider_container"), function (x) {
            shadow_hemi.set_arg0(x);
        });
        shadow_hemi_slider = new Slider(document.getElementById("lns_shadow_hemi1_slider_container"), function (x) {
            shadow_hemi.set_arg1(x);
        });


        let shadow2 = new Drawer(scale, document.getElementById("lns_shadow2"), "shadow2");

        new Slider(document.getElementById("lns_shadow2_rot_x_slider_container"), function (x) {
            shadow2.set_arg0(x);
        });
        new Slider(document.getElementById("lns_shadow2_rot_y_slider_container"), function (x) {
            shadow2.set_arg1(x);
        });


        let ambient_occ = new Drawer(scale, document.getElementById("lns_ambient_occ"), "ambient_occ");

        new Slider(document.getElementById("lns_ambient_occ_slider_container"), function (x) {
            ambient_occ.set_arg0(x);
        });


    });


})();

function lns_power_10() {
    power.set_arg0(4 / 199);
    power_slider.set_value(4 / 199);
}

function lns_power_20() {
    power.set_arg0(9 / 199);
    power_slider.set_value(9 / 199);
}

function lns_power_80() {
    power.set_arg0(84 / 199);
    power_slider.set_value(84 / 199);
}

function lns_power_90() {
    power.set_arg0(89 / 199);
    power_slider.set_value(89 / 199);
}

function lns_sat_power() {
    power.set_arg0(99 / 199);
    power_slider.set_value(99 / 199);
}

function lns_1_rad() {
    radian.set_arg0(1 / (2 * Math.PI));
    radian_slider.set_value(1 / (2 * Math.PI));
}

function lns_pi_rad() {
    radian.set_arg0(0.5);
    radian_slider.set_value(0.5);
}

function lns_4pi_sterad() {
    steradian_sphere.set_arg0(1.0);
    steradian_sphere_slider.set_value(1.0);
}

function lns_shadow_small() {
    shadow_hemi.set_arg1(0.1);
    shadow_hemi_slider.set_value(0.1);
}

function lns_shadow_big() {
    shadow_hemi.set_arg1(0.9);
    shadow_hemi_slider.set_value(0.9);
}

function lns_rough_side() {
    rough_inv.set_arg0(0.55);
    rough_inv_slider.set_value(0.55);
}


function lns_mirror_view() {
    let a = mirror.get_arg0() * Math.PI * 0.42;
    mirror.set_mvp(mat3_mul(rot_x_mat3(-a), rot_z_mat3(Math.PI * 0.5)));

}
function lns_rough_view() {
    rough_inv.set_mvp(mat3_mul(rot_x_mat3(-Math.PI * 0.25), rot_z_mat3(Math.PI * 0.5)));

}


function lns_rgb() {
    color_rgb.set_arg0(0.5);
    color_rgb.set_arg1(0.5);
    color_rgb.set_arg2(0.5);
    rgb0.set_value(0.5);
    rgb1.set_value(0.5);
    rgb2.set_value(0.5);
}


