
var ts_2D_cube_slice_drawer;
var ts_2D_cube_slice_slider;
var ts_3D_cube_slice_drawer;
var ts_3D_cube_slice_sliders;
var ts_2D_cube_proj_drawer;
var ts_2d_cube_proj_seg;

var ts_2D_cube_proj_drawer2;
var ts_2D_cube_proj_slider2;

(function () {

    var corner_color = "rgba(231, 76, 60,1.0)";
    var edge_color = "rgba(230, 126, 34,1.0)";
    var side_color = "rgba(241, 196, 15,0.5)";

    var base_axis_color = "rgba(0,0,0,0.4)";
    var cube_edge_color = "#666";
    var cube_side_color = "rgba(140, 224, 123,0.9)";

    function mat3_mul_vec4d(a, b) {
        var res = [];
        res[0] = a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3];
        res[1] = a[4] * b[0] + a[5] * b[1] + a[6] * b[2] + a[7] * b[3];
        res[2] = a[8] * b[0] + a[9] * b[1] + a[10] * b[2] + a[11] * b[3];
        res[3] = a[12] * b[0] + a[13] * b[1] + a[14] * b[2] + a[15] * b[3];

        return res;
    }

    function rot_xw_matrix4d(a) {
        var c = Math.cos(a);
        var s = Math.sin(a);

        return [c, 0, 0, -s,
            0, 1, 0, 0,
            0, 0, 1, 0,
            s, 0, 0, c];
    }

    function rot_yw_matrix4d(a) {
        var c = Math.cos(a);
        var s = Math.sin(a);

        return [1, 0, 0, 0,
            0, c, 0, s,
            0, 0, 1, 0,
            0, -s, 0, c];
    }

    function rot_zw_matrix4d(a) {
        var c = Math.cos(a);
        var s = Math.sin(a);

        return [1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, c, -s,
            0, 0, s, c];
    }


    function mat3_mul4d(a, b) {
        /*  0  1  2  3
            4  5  6  7
            8  9 10 11
           12 13 14 15*/

        var res = [];

        for (var y = 0; y < 4; y++) {
            for (var x = 0; x < 4; x++) {
                res[x + y * 4] = 0;
                for (var k = 0; k < 4; k++)
                    res[x + y * 4] += a[y * 4 + k] * b[k * 4 + x];
            }
        }

        return res;
    }

    var ident_matrix4d = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];

    var scale = Math.min(2, window.devicePixelRatio || 1);


    function Drawer(scale, container, mode) {

        var wrapper = document.createElement("div");
        wrapper.classList.add("canvas_container");
        wrapper.classList.add("non_selectable");        

        var canvas = document.createElement("canvas");
        canvas.classList.add("non_selectable");        
        canvas.style.position = "absolute";
        canvas.style.top = "0";
        canvas.style.left = "0";

        wrapper.appendChild(canvas);
        container.appendChild(wrapper);

        var drag_div;
        if (mode === "2D_slice" || mode === "2D_proj") {
            drag_div = document.createElement("div");
            drag_div.classList.add("ts_drag_div");
            wrapper.appendChild(drag_div);
        }

        var x = 0, y = 0, z = 0, w = 0;
        var progress = 0;
        var selection = 0;
        this.set_progress = function (x) {
            progress = x;
            this.repaint();
        }

        this.set_x = function (x_) {
            x = x_;
            this.repaint();
        }

        this.set_y = function (y_) {
            y = y_;
            this.repaint();
        }

        this.set_z = function (z_) {
            z = z_;
            this.repaint();
        }

        this.set_w = function (w_) {
            w = w_;
            this.repaint();
        }

        this.set_selection = function (s) {
            selection = s;
            this.repaint();
        }


        var mvp = mat3_mul(rot_x_mat3(Math.PI / 6), rot_y_mat3(Math.PI / 5));

        if (mode === "2D_proj" || mode === "2D_slice" || mode === "2D_proj2")
            mvp = [1, 0, 0, 0, 1, 0, 0, 0, 1];
        else if (mode === "3D_rot_planes")
            mvp = mat3_mul(rot_x_mat3(Math.PI / 6), mat3_mul(rot_y_mat3(-Math.PI / 4), rot_x_mat3(-Math.PI / 2)));
        else if (mode === "4D_space" || mode === "4D_cube" || mode === "3D4D_cube" || mode === "4D_rot_planes")
            mvp = [0.8150788470606705, 0.3725261823075188, 0.4437011568270268,
                -0.5255344525575377, 0.7977629229253195, 0.2956143737721516,
                -0.2438442376791082, -0.474129267501, 0.8460150267280498];

        this.set_mvp = function (x) {
            mvp = x;
            arcball.set_matrix(mvp);
            this.repaint();
        }

        var arcball_modes = [""];

        var arcball = undefined;
        

        if (mode != "1D_cube" && mode!=="2D_proj2" && mode !== "2D_cube" && mode !== "3D_cube" && mode !== "3D_ambig")
            arcball = new ArcBall(mvp, function () {
                mvp = arcball.matrix.slice();
                self.repaint();
            });

        var width, height;

        var cube_center = [0, 0];
        var cube_size = 1;

        function canvas_space(e) {
            var r = canvas.getBoundingClientRect();
            return [width - (e.clientX - r.left), (e.clientY - r.top)];
        }


        if (arcball) {
            new TouchHandler(drag_div ? drag_div : canvas,
                function (e) {
                    var p = canvas_space(e);
                    arcball.start(p[0], p[1]);
                    return true;
                }
                ,
                function (e) {
                    var p = canvas_space(e);
                    arcball.update(p[0], p[1], e.timeStamp);
                    mvp = arcball.matrix.slice();
                    self.repaint();
                    return true;
                },
                function (e) {
                    arcball.end(e.timeStamp);
                });
        }


        function convex_hull(poly) {
            if (poly.length < 4)
                return poly;

            var r = [];


            var left = 0;
            for (var i = 1; i < poly.length; i++) {
                if (poly[i][0] < poly[left][0])
                    left = i;
            }

            var end = left;

            var iter = 0;
            while (1) {
                r.push(poly[end]);

                var c = (end + 1) % poly.length;

                for (var i = 0; i < poly.length; i++) {
                    var cur = vec_sub(poly[i], poly[end]);
                    var bes = vec_sub(poly[c], poly[end]);
                    var d = vec_cross([cur[0], cur[1], 0],
                        [bes[0], bes[1], 0]);

                    if (d[2] > 0)
                        c = i;
                }

                end = c;

                if (end == left)
                    break;

                iter++;

                if (iter > poly.length) {
                    break;

                }
            }

            return r;
        }

        function project(p) {
            var s = -0.001;
            var z = (1.0 + p[2] * s);
            return [p[0] / z, p[1] / z, -z];
        }

        function draw_polys(ctx, polys, vp) {
            polys = polys.slice();
            for (var i = 0; i < polys.length; i++) {
                polys[i] = polys[i].slice();

            }
            var i = polys.length;
            while (i--) {
                if (polys[i].length < 2) {
                    polys.splice(i, 1);
                }
            }

            for (var i = 0; i < polys.length; i++) {
                for (var j = 0; j < polys[i].length; j++) {
                    polys[i][j] = mat3_mul_vec(vp, polys[i][j]);
                }
            }

            polys.sort(function (a, b) {
                var norm = vec_cross(vec_sub(a[2], a[0]), vec_sub(a[1], a[0]));
                var d = vec_dot(norm, a[0]);
                if (norm[2] == 0)
                    return 0;

                var dist = 0;
                for (var i = 0; i < b.length; i++) {
                    dist += vec_dot(norm, b[i]) - d;
                }
                if (norm[2] < 0)
                    return dist < 0 ? -1 : 1;

                return dist > 0 ? -1 : 1;
            });

            ctx.lineJoin = "round";
            for (var i = 0; i < polys.length; i++) {
                if (polys[i].length == 0)
                    continue;


                ctx.beginPath();
                var p = project(polys[i][0]);
                ctx.moveTo(p[0], p[1]);
                for (var j = 1; j < polys[i].length; j++) {
                    var p = project(polys[i][j]);
                    ctx.lineTo(p[0], p[1])
                }

                ctx.closePath();
                ctx.fill();
                ctx.stroke();
            }
        }

        function clip_poly(poly, sign) {
            var clip_z = 0.0;

            var clipped_poly = [];

            function is_in(p) {
                return sign ? (p[2] >= clip_z) : (p[2] < clip_z);
            }


            var prev = poly[poly.length - 1];
                    for (var j = 0; j < poly.length; j++) {
                        var curr = poly[j];

                        if (!vec_eq(curr, prev)) {
                        if (is_in(curr)) {
                            if (!is_in(prev)) {
                                var dz = curr[2] - prev[2];
                                var t = (clip_z - prev[2]) / dz;
                                var p = vec_lerp(prev, curr, t);
                                p[2] = 0;
                                clipped_poly.push(p);
                            }

                            clipped_poly.push(curr);
                        } else if (is_in(prev)) {
                            var dz = curr[2] - prev[2];
                            var t = (clip_z - prev[2]) / dz;
                            var p = vec_lerp(prev, curr, t);
                            p[2] = 0;
                            clipped_poly.push(p);
                        }
                    }

                        prev = curr;
                    }

            return clipped_poly;
        }



        function draw_polys2(ctx, polys, fillStyle, edgeStyle, cornerStyle, edgeStyleMap, cornerStyleMap, radius, line, intersections) {

            if (!fillStyle)
                fillStyle = "rgba(255, 255, 255, 0.4)";
            if (!edgeStyle)
                edgeStyle = "#555";
            if (!cornerStyle)
                cornerStyle = "#333";

            if (typeof radius === 'undefined')
                radius = 1.5;

            ctx.save();
            ctx.lineWidth = line ? line : 1.5;
            ctx.lineCap = "butt"

            polys = polys.slice();



            function cc_normalize_points(p) {

                if (p.length < 3)
                    return p;

                  var a = vec_cross(p[p.length - 1], p[0])[2];

                  for (var i = 1; i < p.length; i++) {
                        a += vec_cross(p[i-1], p[i])[2];
                 }

            if (a < 0)
                p = p.reverse();

            return p;
            }

            function clip(a, b) {

                var points = a.slice();
                var prev_b = b[b.length - 1];

                function is_in(point, edge0, edge1) {
                    if (point[0] == edge0[0] && point[1] == edge0[1])
                        return false;

                    if (point[0] == edge1[0] && point[1] == edge1[1])
                        return false;

                    var clip_edge = vec_sub(edge1, edge0);
                    var rel = vec_sub(point, edge0);

                    return vec_cross(rel, clip_edge)[2] > 0;
                }

                function intersect(p, pp, q, pq) {

                    if (pp[0] == pq[0] && pp[1] == pq[1])
                        return pp;

                    if (p[0] == q[0] && p[1] == q[1])
                        return p;

                    if (pp[0] == q[0] && pp[1] == q[1])
                        return pp;

                    if (p[0] == pq[0] && p[1] == pq[1])
                        return p;

                    var r = vec_sub(p, pp);
                    var s = vec_sub(q, pq);

                    var t = vec_cross(vec_sub(pq, pp), s)[2] / vec_cross(r, s)[2];
                    
                    return [pp[0] + t * r[0], pp[1] + t * r[1], 1/(1/pp[2] + t * (1/p[2] - 1/pp[2]))];
                }


                for (var i = 0; i < b.length; i++) {
                    var new_points = []
                    var curr_b = b[i];

                    if (curr_b[0] != prev_b[0] || curr_b[1] != prev_b[1]) {
                    var prev = points[points.length - 1];
                    for (var j = 0; j < points.length; j++) {
                        var curr = points[j];

                        if (curr[0] != prev[0] || curr[1] != prev[1]) {
                        if (is_in(curr, curr_b, prev_b)) {
                            if (!is_in(prev, curr_b, prev_b)) {
                                new_points.push(intersect(curr, prev, curr_b, prev_b));
                            }

                            new_points.push(curr);
                        } else if (is_in(prev, curr_b, prev_b)) {
                            new_points.push(intersect(curr, prev, curr_b, prev_b));
                        }
                    }

                        prev = curr;
                    }

         
                        points = new_points;
                    }

                    prev_b = curr_b;
                    // points = new_points;
                }

                for (var j = 1; j < points.length; j++) {
                    if (points[j-1][0] == points[j][0] &&
                        points[j-1][1] == points[j][1] &&
                        points[j-1][2] == points[j][2]) {
                            points.splice(j,1);
                            j--;
                    }
                }

                if (points.length > 1 &&
                    points[points.length - 1][0] == points[0][0] &&
                    points[points.length - 1][1] == points[0][1] &&
                    points[points.length - 1][2] == points[0][2]) {
                        points.pop();
                    }


                return points;
            }

            function area2d(p) {

                if (p.length < 3)
                    return 0;
                var a = (vec_cross(p[p.length - 1], p[0]))[2];
                ;

                for (var i = 1; i < p.length; i++) {
                    a += (vec_cross(p[i-1], p[i]))[2];
                }

                return Math.abs(a);
            }



            function compare(a, b) {
                var a_points = cc_normalize_points(a.points.slice());
                var b_points = cc_normalize_points(b.points.slice());

                var int_a = clip(a_points, b_points);
                if (int_a.length < 3)
                    return 0;

                var int_b = clip(b_points, a_points);
                if (int_b.length < 3)
                    return 0;

                if (area2d(int_a) < 1)
                    return 0;

                var avg_a = 0;
                var avg_b = 0;

                for (var i = 0; i < int_a.length; i++)
                avg_a += int_a[i][2];

            for (var i = 0; i < int_b.length; i++)
                avg_b += int_b[i][2];

            return avg_a / int_a.length - avg_b / int_b.length;
            };

            function topo_sort(polys) {

                var graph = [];
                var in_deg = [];
                for (var i = 0; i < polys.length; i++) {
                    in_deg.push(0);
                    graph.push([]);
                }

                for (var i = 0; i < polys.length; i++) {
                    for (var j = i + 1; j < polys.length; j++) {
                        val = compare(polys[i], polys[j]);

                        if (val < 0) {
                            graph[i].push(j);
                            in_deg[j]++;
                        } else if (val > 0) {
                            graph[j].push(i);
                            in_deg[i]++;
                        };
                    }
                }

                var no_incoming = [];

                for (var i = 0; i < polys.length; i++) {
                    if (in_deg[i] == 0)
                        no_incoming.push(i);
                }

                var sorted = [];

                var visited = [];

                while (no_incoming.length > 0) {
                    var node = no_incoming.pop();
                    sorted.push(polys[node]);

                    visited.push(node);
                    for (var i = 0; i < graph[node].length; i++) {
                        in_deg[graph[node][i]]--;

                        if (in_deg[graph[node][i]] == 0)
                            no_incoming.push(graph[node][i]);
                    }
                }

                return sorted;
            }

            if (!intersections)
                polys = topo_sort(polys);

            var edge_map = {};
            var point_map = {};

            for (var i = 0; i < polys.length; i++) {
                for (var j = 0; j < polys[i].points.length; j++) {
                    edge_map[polys[i].edgeKey(j)] = i;
                    point_map[polys[i].pointKey(j)] = i;
                }
            }

            ctx.lineJoin = "round";
            for (var i = 0; i < polys.length; i++) {
                if (polys[i].points.length == 0)
                    continue;

                ctx.beginPath();
                var p = (polys[i].points[0]);
                ctx.moveTo(p[0], p[1]);
                for (var j = 1; j < polys[i].points.length; j++) {
                    var p = (polys[i].points[j]);
                    ctx.lineTo(p[0], p[1])
                }

                ctx.closePath();

                ctx.fillStyle = polys[i].fillColor ? polys[i].fillColor : fillStyle;
                ctx.fill();

                for (var j = 0; j < polys[i].points.length; j++) {

                    var edge_key = polys[i].edgeKey(j);
                    if (edge_map[edge_key] != i)
                        continue;

                    var p0 = polys[i].points[j];
                    var p1 = polys[i].points[(j + 1) % polys[i].points.length];

                    ctx.strokeStyle = edgeStyleMap && edgeStyleMap[edge_key] ? edgeStyleMap[edge_key] : edgeStyle;
                    ctx.beginPath();
                    ctx.moveTo(p0[0], p0[1])
                    ctx.lineTo(p1[0], p1[1])
                    ctx.stroke();
                }

                for (var j = 0; j < polys[i].points.length; j++) {
                    var point_key = polys[i].pointKey(j);
                    if (point_map[point_key] != i)
                        continue;

                    var p0 = polys[i].points[j];

                    ctx.fillStyle = cornerStyleMap && cornerStyleMap[point_key] ? cornerStyleMap[point_key] : cornerStyle;

                    ctx.beginPath();
                    ctx.ellipse(p0[0], p0[1], radius, radius, 0, 0, Math.PI * 2);
                    ctx.closePath();
                    ctx.fill();

                }
            }

            ctx.restore();
        }

        var cube_edge_pairs = [
            [0, 1], [0, 4], [4, 5], [5, 1],
            [2, 6], [6, 7], [7, 3], [3, 2],
            [0, 2], [4, 6], [5, 7], [1, 3],
        ];

        var cube_walls = [
            [0, 2, 3, 1],
            [4, 6, 7, 5],
            [2, 6, 7, 3],
            [0, 4, 5, 1],
            [0, 4, 6, 2],
        
            [1, 3, 7, 5],
        ];

        function cube_points(model, tr) {
            var points = [];
            /*


                    1   3
                0   2
  
            5   7   
        4   6
         */
            for (var x = 0; x <= 1; x++) {
                for (var y = 0; y <= 1; y++) {
                    for (var z = 0; z <= 1; z++) {
                        var p = [x - 0.5, y - 0.5, z - 0.5];
                        p = mat3_mul_vec(model, p);
                        p[0] += tr[0];
                        p[1] += tr[1];
                        p[2] += tr[2];
                        points.push(p);
                    }
                }
            }

            return points;
        }


        function cube_polys(model, tr) {
            var points = cube_points(model, tr);

            var polys = [];
            for (var i = 0; i < 6; i++) {
                polys.push([points[cube_walls[i][0]],
                    points[cube_walls[i][1]],
                    points[cube_walls[i][2]],
                    points[cube_walls[i][3]]
                ]);
            }
            return polys;
        }

        function clip_w_poly(poly) {
            var clip_w = 0.0;

            var clipped_poly = [];
            for (var i = 0; i < poly.length; i++) {

                var p = poly[i];
                var pp = i > 0 ? poly[i - 1] : undefined;

                if (p[3] >= clip_w) {
                    if (pp && pp[3] < clip_w) {
                        var dw = p[3] - pp[3];
                        var t = (p[3] - clip_w) / dw;
                        clipped_poly.push([lerp(p[0], pp[0], t),
                        lerp(p[1], pp[1], t),
                        lerp(p[2], pp[2], t)]);
                    }
                }
                else if (pp && pp[3] >= clip_w) {
                    var dw = pp[3] - p[3];
                    var t = (pp[3] - clip_w) / dw;
                    clipped_poly.push([lerp(pp[0], p[0], t),
                    lerp(pp[1], p[1], t),
                    lerp(pp[2], p[2], t)]);
                }
            }

            var p = poly[0];
            var pp = poly[poly.length - 1];

            if (pp[3] < clip_w && p[3] >= clip_w) {
                var dw = p[3] - pp[3];
                var t = (p[3] - clip_w) / dw;
                clipped_poly.push([lerp(p[0], pp[0], t),
                lerp(p[1], pp[1], t),
                lerp(p[2], pp[2], t)]);
            } else if (pp[3] >= clip_w && p[3] < clip_w) {
                var dw = pp[3] - p[3];
                var t = (pp[3] - clip_w) / dw;
                clipped_poly.push([lerp(pp[0], p[0], t),
                lerp(pp[1], p[1], t),
                lerp(pp[2], p[2], t)]);
            }

            return clipped_poly;
        }

        var tess_edge_pairs = [
            [0, 1], [0, 4], [4, 5], [5, 1],
            [2, 6], [6, 7], [7, 3], [3, 2],
            [0, 2], [4, 6], [5, 7], [1, 3],

            [0 + 8, 1 + 8], [0 + 8, 4 + 8], [4 + 8, 5 + 8], [5 + 8, 1 + 8],
            [2 + 8, 6 + 8], [6 + 8, 7 + 8], [7 + 8, 3 + 8], [3 + 8, 2 + 8],
            [0 + 8, 2 + 8], [4 + 8, 6 + 8], [5 + 8, 7 + 8], [1 + 8, 3 + 8],

            [0, 8], [4, 12], [5, 13], [1, 9],
            [2, 10], [6, 14], [7, 15], [3, 11],
        ];

        var tess_walls_point_inds = [
            [0, 4, 5, 1], [2, 3, 7, 6], [0, 4, 6, 2], [4, 5, 7, 6], [0, 1, 3, 2], [5, 7, 3, 1],
            [8, 12, 13, 9], [10, 11, 15, 14], [8, 12, 14, 10], [12, 13, 15, 14], [8, 9, 11, 10], [13, 15, 11, 9],
            [0, 4, 12, 8], [4, 5, 13, 12], [5, 1, 9, 13], [1, 0, 8, 9],
            [4, 6, 14, 12], [7, 15, 13, 5], [3, 1, 9, 11], [2, 10, 8, 0],
            [2, 6, 14, 10], [6, 7, 15, 14], [7, 3, 11, 15], [3, 2, 10, 11],
        ];

        var tess_cubes_wall_inds = [
            [0, 1, 2, 3, 4, 5],
            [0, 6, 12, 13, 14, 15],
            [1, 7, 20, 21, 22, 23],
            [3, 9, 21, 17, 16, 13],
            [4, 10, 23, 15, 18, 19],
            [5, 11, 18, 22, 17, 14],

            [2, 8, 19, 20, 12, 16],
            
            [6, 7, 8, 9, 10, 11],
        ]

        function tess_points(model, tr) {
            var points = [];
            for (var w = 0; w <= 1; w++) {
                for (var x = 0; x <= 1; x++) {
                    for (var y = 0; y <= 1; y++) {
                        for (var z = 0; z <= 1; z++) {
                            var p = [x - 0.5, y - 0.5, z - 0.5, w - 0.5];
                            p = mat3_mul_vec4d(model, p);
                            p = vec_add(p, tr);
                            points.push(p);
                        }
                    }
                }
            }

            return points;
        }

        function tess_polys(model, tr) {
            var points = tess_points(model, tr);

            var polys = [];
            polys.push([points[1], points[0], points[2], points[3]]);
            polys.push([points[5], points[4], points[6], points[7]]);
            polys.push([points[1], points[5], points[7], points[3]]);
            polys.push([points[0], points[4], points[6], points[2]]);
            polys.push([points[0], points[4], points[5], points[1]]);
            polys.push([points[2], points[6], points[7], points[3]]);

            polys.push([points[1 + 8], points[0 + 8], points[2 + 8], points[3 + 8]]);
            polys.push([points[5 + 8], points[4 + 8], points[6 + 8], points[7 + 8]]);
            polys.push([points[1 + 8], points[5 + 8], points[7 + 8], points[3 + 8]]);
            polys.push([points[0 + 8], points[4 + 8], points[6 + 8], points[2 + 8]]);
            polys.push([points[0 + 8], points[4 + 8], points[5 + 8], points[1 + 8]]);
            polys.push([points[2 + 8], points[6 + 8], points[7 + 8], points[3 + 8]]);

            polys.push([points[1], points[0], points[8], points[9]]);
            polys.push([points[2], points[0], points[8], points[10]]);
            polys.push([points[2], points[3], points[11], points[10]]);
            polys.push([points[1], points[3], points[11], points[9]]);

            polys.push([points[4], points[6], points[14], points[12]]);
            polys.push([points[4], points[5], points[13], points[12]]);
            polys.push([points[5], points[7], points[15], points[13]]);
            polys.push([points[6], points[7], points[15], points[14]]);

            polys.push([points[2], points[6], points[14], points[10]]);
            polys.push([points[3], points[7], points[15], points[11]]);
            polys.push([points[0], points[4], points[12], points[8]]);
            polys.push([points[1], points[5], points[13], points[9]]);

            return polys;
        }


        function draw_axes(ctx, mvp, dim, flat) {
            var points = [[0, 0, 0], [2.2, 0, 0], [0, 2.2, 0], [0, 0, 2.2]];

            if (flat)
                points = [[0, 0, 0], [2.0, 0, 0], [0, 2.0, 0], [-1.0, -1.0, 0]];

   

            for (var i = 0; i < points.length; i++) {
                points[i] = project(mat3_mul_vec(mvp, points[i]));
            }

            ctx.strokeStyle = base_axis_color;
            ctx.fillStyle = base_axis_color;

            for (var i = 0; i < dim; i++) {
                ctx.beginPath();
                ctx.moveTo(points[0][0], points[0][1]);
                ctx.lineTo(points[i + 1][0], points[i + 1][1]);
                ctx.stroke();

                var offset = 14;
                var dir = vec_norm([points[i + 1][0] - points[0][0], points[i + 1][1] - points[0][1]]);
                dir = vec_scale(dir, offset);

                draw_axis_label(ctx,[points[i + 1][0] + dir[0], points[i + 1][1] + dir[1]],i);

            }
        }

        function draw_point(ctx) {

            ctx.fillStyle = "#333";

            ctx.beginPath();
            ctx.ellipse(0, 0, 3, 3, 0, 0, Math.PI * 2);
            ctx.closePath();
            ctx.fill();
        }

        function draw_axis_label(ctx, p, i,colorless) {
            ctx.save();

            ctx.fillStyle = [
                "rgba(252, 92, 101,0.8)",
                "rgba(247, 205, 49,0.8)",
                "rgba(69, 170, 242,0.8)",
                "rgba(144, 168, 196,0.8)",
            ][i];

            if (colorless)
                ctx.fillStyle = "rgba(200,200,200,0.8)";

            var str = ["X", "Y", "Z", "W"][i];
            ctx.font = "19px IBM Plex Sans";
            ctx.textAlign = "center";
        
            var w = Math.ceil((ctx.measureText(str).width + 6)/2)*2;
            var h = 24;
            ctx.roundRect(Math.ceil(p[0]*scale)/scale - w/2, Math.ceil(p[1]*scale)/scale - h/2, w, h, 5);
            ctx.fill();

            ctx.fillStyle = "#333";

            ctx.fillText(str, Math.ceil(p[0]*scale)/scale, Math.ceil((p[1] + 7)*scale)/scale);

            ctx.restore();
        }


        function pointKey(p) {
            return "p" + p[0] + "_" + p[1] + "_" + p[2];
        }

        function edgeKey(p0, p1) {
            if (p0[0] < p1[0]) {
                var tmp = p0; p0 = p1; p1 = tmp;
            } else if (p0[0] == p1[0]) {
                if (p0[1] < p1[1]) {
                    var tmp = p0; p0 = p1; p1 = tmp;
                } else if (p0[1] == p1[1]) {
                    if (p0[2] < p1[2]) {
                        var tmp = p0; p0 = p1; p1 = tmp;
                    }
                }
            }

            return "e" + p0[0] + "_" + p0[1] + "_" + p0[2] + "|" + p1[0] + "_" + p1[1] + "_" + p1[2] + "|";
        }

        /* Just for convex polys. */
        function Poly(points, fillColor) {
            this.points = points;
            this.fillColor = fillColor;

            this.pointKey = function (i) {
                return pointKey(points[i]);
            }

            this.edgeKey = function (i) {
                var p0 = this.points[i];
                var p1 = this.points[(i + 1) % this.points.length];

                return edgeKey(p0, p1);
            }
        }

        var y_flip = [1, 0, 0, 0, -1, 0, 0, 0, 1];



        this.repaint = function () {


            var ctx = canvas.getContext("2d");

            ctx.resetTransform();
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.scale(scale, scale);

            if (mode === "2D_slice")
                d2d_slice();
            else if (mode === "3D_slice")
                d3d_slice();
            else if (mode === "0D_cube_loc")
                d0d_cube_loc();
            else if (mode === "0D_cube")
                d0d_cube();
            else if (mode === "1D_cube")
                d1d_cube();
            else if (mode === "2D_cube")
                d2d_cube();
            else if (mode === "3D_cube")
                d3d_cube();
            else if (mode === "3D_cube_rot")
                d3d_cube_rot();
            else if (mode === "3D_cube_edge")
                d3d_cube_edge();
            else if (mode === "3D4D_cube")
                d3d4d_cube();
            else if (mode === "3D_rot_plane")
                d3d_rot_plane();
            else if (mode === "3D_rot_axis")
                d3d_rot_axis();
            else if (mode === "3D_rot_planes")
                d3d_rot_planes();
            else if (mode === "4D_rot_planes")
                d4d_rot_planes();
            else if (mode === "4D_cube")
                d4d_cube();
            else if (mode === "2D_proj" || mode === "2D_proj2")
                d2d_proj();
            else if (mode === "3D_proj")
                d3d_proj();
            else if (mode === "3D_proj_rot")
                d3d_proj_rot();
            else if (mode === "3D_ambig")
                d3d_ambig();
            else if (mode === "4D_space")
                d4d_space();
            else if (mode === "4D_space_3D")
                d4d_space_3d();
            else if (mode === "tess_corner")
                dtess_corner();
            else if (mode === "tess_edge")
                dtess_edge();

            function d2d_slice() {
                var size = width * 0.13;
                var scale = 0.3;
                if (width < 600)
                    size = width * 0.11;

                if (width < 500)
                    scale = 0.28;

                var split = 0.5;

                ctx.lineWidth = 1.5;

                ctx.save();
                ctx.translate(width * split * 0.5, height * 0.64);


                var proj_rot = mat3_mul(rot_y_mat3(-Math.PI / 5), ident_matrix);
                proj_rot = mat3_mul(rot_x_mat3(-0.5), proj_rot);
                proj_rot = mat3_mul(proj_rot, y_flip);

                var proj = mat3_mul(scale_mat3(size), proj_rot);
                draw_axes(ctx, proj, 3);


                var cube_m = proj_rot;
                cube_m = mat3_mul(y_flip, cube_m);
                cube_m = mat3_mul(mvp, cube_m);
                cube_m = mat3_mul(y_flip, cube_m);
                cube_m = mat3_mul(mat3_invert(proj_rot), cube_m);
                // cube_m = mat3_mul(scale_mat3(0.5), cube_m);

                var z = progress * 2 - 1;
                var center = [1, 1, z];

                var polys = cube_polys(cube_m, center);
                var back_polys = [];
                var front_polys = []
                
                var int_points = [];
                for (var i = 0; i < polys.length; i++) {
                    var points = clip_poly(polys[i], false);
                    for (var j = 0; j < points.length; j++) {
                        if (points[j][2] == 0) {
                            int_points.push(points[j]);
                        }
                        points[j] = project(mat3_mul_vec(proj, points[j]));
                    }
                    back_polys[i] = new Poly(points, cube_side_color);

                    var points = clip_poly(polys[i], true);
                    for (var j = 0; j < points.length; j++) {
                        points[j] = project(mat3_mul_vec(proj, points[j]));
                    }
                    front_polys[i] = new Poly(points, cube_side_color);
                }


                ctx.fillStyle = cube_side_color;

                ctx.strokeStyle = "rgba(0, 0, 0, 0.3)";

                draw_polys2(ctx, back_polys,0,0,"rgba(0,0,0,0)");

                ctx.fillStyle = "rgba(210, 210, 210, 0.7)";
                ctx.strokeStyle = "rgba(0, 0, 0, 0.0)";

                var plane = [[[0, 0, 0], [0, 2, 0], [2, 2, 0], [2, 0, 0]]];
                draw_polys(ctx, plane, proj);

                draw_polys2(ctx, front_polys,0,0,"rgba(0,0,0,0)");

                ctx.restore();


                ctx.save();

                ctx.translate(width * split, height / 2);
                // ctx.fillRect(0,-height/2, width/2, height);

                ctx.translate(width * (1 - split) * 0.5 - size - 10, width * (1 - split) * 0.3);


                var proj2d = mat3_mul(scale_mat3(width * (1 - split) * scale), y_flip);
                draw_axes(ctx, proj2d, 2);

                for (var j = 0; j < int_points.length; j++) {
                    int_points[j] = project(mat3_mul_vec(proj2d, int_points[j]));
                    // ugh
                    int_points[j][0] = Math.round(int_points[j][0] * 64) / 64;
                    int_points[j][1] = Math.round(int_points[j][1] * 64) / 64;
                }

                int_points = convex_hull(int_points);


                var poly = new Poly(int_points, cube_side_color);
                ctx.fillStyle = cube_side_color;
                draw_polys2(ctx, [poly],0,0,"rgba(0,0,0,0)");
                draw_polys2(ctx, [poly],0,0,"rgba(0,0,0,0)");


                ctx.restore();

                ctx.strokeStyle = "#ddd";
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(width * split * 1.14, 0);
                ctx.lineTo(width * split * 1.14, height);
                ctx.stroke();

                // ctx.fillStyle = "rgba(0, 0, 255, 0.3)";

                var new_cube_center = project(mat3_mul_vec(proj, center));
                var new_cube_size = size * 2.1;

                new_cube_center[0] += width * split * 0.5;
                new_cube_center[1] += height * 0.64;

                if (cube_size != new_cube_size || !vec_eq(new_cube_center, cube_center)) {
                    cube_center = new_cube_center;
                    cube_size = new_cube_size;

                    drag_div.style.width = cube_size + "px";
                    drag_div.style.height = cube_size + "px";
                    drag_div.style.left =  (cube_center[0] - cube_size/2) + "px";
                    drag_div.style.top = (cube_center[1] - cube_size/2) + "px";
                }
     

                if (arcball)
                arcball.set_viewport(width - (cube_center[0] + cube_size * 0.5), cube_center[1] - cube_size * 0.5, cube_size, cube_size);
                // ctx.fillRect(cube_center[0]-cube_size*0.5, cube_center[1]-cube_size*0.5, cube_size, cube_size);
            }

            function d3d_slice() {
                var size = width * 0.44;

                ctx.save();
                ctx.translate(width * 0.5, height * 0.5);


                var proj_rot = ident_matrix;
                proj_rot = mat3_mul(proj_rot, y_flip);
                proj_rot = mat3_mul(proj_rot, mvp);
                proj_rot = mat3_mul(proj_rot, y_flip);

                var proj = mat3_mul(scale_mat3(size), proj_rot);
                // draw_axes(ctx, proj);


                var cube_m = ident_matrix4d;

                var a = x * Math.PI * 2;

                var w = progress * 2 - 1;
                var center = [0, 0, 0, w];

                cube_m = rot_xw_matrix4d((x - 0.5)*Math.PI);
                cube_m = mat3_mul4d(cube_m, rot_yw_matrix4d((y - 0.5)*Math.PI));
                cube_m = mat3_mul4d(cube_m, rot_zw_matrix4d((z - 0.5)*Math.PI));

                var tpoints = tess_points(cube_m, center);


                var polys = [];
                for (var i = 0; i < 8; i++) {
                    var wall_inds = tess_cubes_wall_inds[i];

                    var poly_edges = [];
                    for (var j = 0; j < 6; j++) {
                        var point_inds = tess_walls_point_inds[wall_inds[j]];
                        
                        var wall_points = []
                        for (var k = 0; k < 4; k++)
                            wall_points.push(tpoints[point_inds[k]]);

                        var clipped_points = clip_w_poly(wall_points);

                        if (clipped_points.length > 1) {
                            poly_edges.push (clipped_points);
                        }
                    }

                    var count = poly_edges.length;
                    if (count < 3)
                        continue;
                    
                    var points = [];
                    var edge = poly_edges.pop();
                    points.push(edge[0])
                    points.push(edge[1]);
              
                    var removed = true;
                    while (poly_edges.length > 0 && removed) {
                        removed = false;

                    for (var j = 0; j < poly_edges.length; j++) {
                        if (vec_eq(points[points.length - 1], poly_edges[j][0])) {
                            points.push(poly_edges[j][1]);
                            poly_edges.splice(j,1);
                            removed = true;
                        } else if (vec_eq(points[points.length - 1], poly_edges[j][1])) {
                            points.push(poly_edges[j][0]);
                            poly_edges.splice(j,1);
                            removed = true;
                        }
                    }
                    }

                    for (var j = 0; j < points.length; j++) {
                        points[j] = project(mat3_mul_vec(proj, points[j]));
                    }

                    polys.push (new Poly(points));
                }

                draw_polys2(ctx,polys,cube_side_color,0,"rgba(0,0,0,0)");

      
                ctx.restore();

            }

            function d2d_proj() {
                var size = width * 0.13;
                var scale = 0.3;
                if (width < 600)
                    size = width * 0.11;

                if (width < 500)
                    scale = 0.28;

                var split = 0.5;

                ctx.lineWidth = 1.5;

                ctx.save();
                ctx.translate(width * split * 0.7, height * 0.64);

                var proj_rot = mat3_mul(rot_y_mat3(-Math.PI / 3), ident_matrix);
                proj_rot = mat3_mul(rot_x_mat3(-0.5), proj_rot);

                proj_rot = mat3_mul(proj_rot, y_flip);

                var proj = mat3_mul(scale_mat3(size), proj_rot);
                draw_axes(ctx, proj, 3);

                var cube_m = proj_rot;
                cube_m = mat3_mul(y_flip, cube_m);
                cube_m = mat3_mul(mvp, cube_m);
                cube_m = mat3_mul(y_flip, cube_m);
                cube_m = mat3_mul(scale_mat3(0.65), cube_m);
                cube_m = mat3_mul(mat3_invert(proj_rot), cube_m);
                cube_m = mat3_mul(rot_y_mat3(progress*Math.PI*2), cube_m);

                // cube_m = mat3_mul(scale_mat3(0.5), cube_m);

                var center = [1.0, 1.0, 1.2];

                var points = cube_points(cube_m, center);

                var pr_z = 2.98;

                for (var i = 0; i < points.length; i++) {
                    var p = points[i]
                    points[i][0] = -pr_z * (center[0] - p[0]) / (pr_z - p[2]) + center[0];
                    points[i][1] = - pr_z * (center[1] - p[1]) / (pr_z - p[2]) + center[1];
                    // points[i][2] = 0;
                }

                ctx.fillStyle = "rgba(200, 200, 200, 0.6)";
                ctx.strokeStyle = "rgba(0, 0, 0, 0.0)";

                var plane = [[[0, 0, 0], [0, 2, 0], [2, 2, 0], [2, 0, 0]]];
                draw_polys(ctx, plane, proj);

                ctx.strokeStyle = "#666";
                ctx.lineWidth = 1.5;
   
                var cube_p = cube_polys(cube_m, center);


                var proj_polys = []
                var polys = [];

                for (var i = 0; i < cube_p.length; i++) {
                    var pts = [];
                    var proj_pts = [];
                    for (var j = 0; j < cube_p[i].length; j++) {
                        pts.push(project(mat3_mul_vec(proj, cube_p[i][j])));

                        var proj_pt = points[cube_walls[i][j]];
                      
                        var pt = project(mat3_mul_vec(proj, [proj_pt[0], proj_pt[1], 0]));
                        proj_pts.push([pt[0], pt[1], project(mat3_mul_vec(proj, proj_pt))[2]]);
                    }
                    polys.push(new Poly(pts, i == (selection - 1) ? side_color : 0));
                    proj_polys.push(new Poly(proj_pts, i == (selection - 1) ? side_color : "rgba(255,255,255,0.1)"));
                }
                draw_polys2(ctx, proj_polys, 0, 0, "#666", "#666", 0, 0.7, 2.0);


                draw_polys2(ctx, polys, 0, 0, "#333", 0, 0, 0, 1.5);


                var p = project(mat3_mul_vec(proj, [center[0], center[1], pr_z]));

                ctx.lineWidth = 1;
                ctx.fillStyle = "#FFAA00";
                ctx.strokeStyle = "#C38700";
                ctx.beginPath();
                ctx.ellipse(p[0], p[1], 2, 2, 0, 0, Math.PI * 2);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();

                ctx.restore();


                ctx.save();

                ctx.translate(width * split, height / 2);

                ctx.translate(width * (1 - split) * 0.5 - size - 10, width * (1 - split) * 0.3);


                var proj2d = mat3_mul(scale_mat3(width * (1 - split) * scale), y_flip);
                draw_axes(ctx, proj2d, 2);

                ctx.strokeStyle = "#666";
                ctx.lineWidth = 2.0;
                ctx.lineCap = "round";

                var proj_polys = []

                for (var i = 0; i < cube_p.length; i++) {
                    var proj_pts = [];
                    for (var j = 0; j < cube_p[i].length; j++) {
                        var proj_pt = points[cube_walls[i][j]];
                      
                        var pt = project(mat3_mul_vec(proj2d, [proj_pt[0], proj_pt[1], 0]));
                        proj_pts.push([pt[0], pt[1], project(mat3_mul_vec(proj2d, proj_pt))[2]]);
                    }
                    proj_polys.push(new Poly(proj_pts, i == (selection - 1) ? side_color : "rgba(255,255,255,0.2)"));
                }
                draw_polys2(ctx, proj_polys, 0, "#666", "#666", 0, 0, 1.0, 2.5);


                ctx.restore();

                ctx.strokeStyle = "#ddd";
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(width * split * 1.14, 0);
                ctx.lineTo(width * split * 1.14, height);
                ctx.stroke();

                if (mode !== "2D_proj2") {

                var new_cube_center = project(mat3_mul_vec(proj, center));
                var new_cube_size = size * 2.5;

                new_cube_center[0] += width * split * 0.7;
                new_cube_center[1] += height * 0.64;

                if (cube_size != new_cube_size || !vec_eq(new_cube_center, cube_center)) {
                    cube_center = new_cube_center;
                    cube_size = new_cube_size;

                    drag_div.style.width = cube_size + "px";
                    drag_div.style.height = cube_size + "px";
                    drag_div.style.left =  (cube_center[0] - cube_size/2) + "px";
                    drag_div.style.top = (cube_center[1] - cube_size/2) + "px";
                }
     
                if (arcball)
                arcball.set_viewport(width - (cube_center[0] + cube_size * 0.7), cube_center[1] - cube_size * 0.5, cube_size, cube_size);
            }
                // ct
            }

            function d3d_proj() {
                var size = width * 0.83;

                ctx.save();
                ctx.translate(width * 0.5, height * 0.5);

                var proj_rot = ident_matrix;
                proj_rot = mat3_mul(proj_rot, y_flip);
                proj_rot = mat3_mul(proj_rot, mvp);
                proj_rot = mat3_mul(proj_rot, y_flip);

                var proj = mat3_mul(scale_mat3(size), proj_rot);

                var cube_m = ident_matrix4d;

                var center = [0, 0, 0, -1];
                var points4d = tess_points(cube_m, center);
                var pr_w = 1.0;

                for (var i = 0; i < points4d.length; i++) {
                    var p = points4d[i]
                    points4d[i][0] = pr_w * p[0] / (pr_w - p[3]);
                    points4d[i][1] = pr_w * p[1] / (pr_w - p[3]);
                    points4d[i][2] = pr_w * p[2] / (pr_w - p[3]);
                }

                var polys = [];

                for (var i = 0; i < tess_walls_point_inds.length; i++) {
                    var wall_points = tess_walls_point_inds[i];
                    var points = [];

                    for (var j = 0; j < wall_points.length; j++) {
                        var p = mat3_mul_vec(proj, points4d[wall_points[j]]);
                        p = project(p);
                        points.push(p);
                    }

                    var fill = "rgba(255, 255, 255, 0.4)";

                    if (selection > 0) {
                        for (var w = 0; w < 6; w++) {
                            if (tess_cubes_wall_inds[selection - 1][w] == i) {
                                fill = "rgba(241, 196, 15,0.5)";
                                break;
                            }
                        }
                    }

                    polys.push(new Poly(points, fill));
                }

                draw_polys2(ctx, polys, "rgba(0,0,0,0)")


                ctx.restore();
            }


            function d3d_proj_rot() {
                var size = width * 0.83;

                ctx.save();
                ctx.translate(width * 0.5, height * 0.5);

                var proj_rot = ident_matrix;
                proj_rot = mat3_mul(proj_rot, y_flip);
                proj_rot = mat3_mul(proj_rot, mvp);
                proj_rot = mat3_mul(proj_rot, y_flip);

                var proj = mat3_mul(scale_mat3(size), proj_rot);

                var cube_m = ident_matrix4d;
                cube_m = rot_xw_matrix4d(x * Math.PI * 2);
                // cube_m = mat3_mul4d(cube_m, rot_yw_matrix4d(x*0.3 * Math.PI * 2));
                // cube_m = mat3_mul4d(cube_m, rot_zw_matrix4d(x*2.3 * Math.PI * 2));

                var center = [0, 0, 0, -1];
                var points4d = tess_points(cube_m, center);
                var pr_w = 1.0;

                for (var i = 0; i < points4d.length; i++) {
                    var p = points4d[i]
                    points4d[i][0] = pr_w * p[0] / (pr_w - p[3]);
                    points4d[i][1] = pr_w * p[1] / (pr_w - p[3]);
                    points4d[i][2] = pr_w * p[2] / (pr_w - p[3]);
                }

                var polys = [];

                for (var i = 0; i < tess_walls_point_inds.length; i++) {
                    var wall_points = tess_walls_point_inds[i];
                    var points = [];

                    for (var j = 0; j < wall_points.length; j++) {
                        points.push(points4d[wall_points[j]].slice(0, 3));
                    }

                    var fill = "rgba(255, 255, 255, 0.4)";

                    for (var w = 0; w < 6; w++) {
                        if (tess_cubes_wall_inds[7][w] == i) {
                            fill = "rgba(241, 196, 15,0.5)";
                            break;
                        }
                    }


                    polys.push(new Poly(points, fill));
                }

                var best_a = 0;
                var best_i = 0;

                for (var i = 0; i < polys.length; i++) {
                    var a = 0;
                    a += vec_len(vec_cross(vec_sub(polys[i].points[1], polys[i].points[0]),
                        vec_sub(polys[i].points[2], polys[i].points[0])));

                    a += vec_len(vec_cross(vec_sub(polys[i].points[3], polys[i].points[0]),
                        vec_sub(polys[i].points[2], polys[i].points[0])));

                    if (a > best_a) {
                        best_a = a;
                        best_i = i;
                    }
                }

                var best_poly = polys[best_i];

                var clip_n = vec_cross(vec_sub(best_poly.points[1], best_poly.points[0]),
                    vec_sub(best_poly.points[2], best_poly.points[0]));
                var clip_t = vec_dot(best_poly.points[0], clip_n);

                polys.splice(best_i, 1);

                var edge_map = {};
                var corner_map = {};

                var intersection_points = [];
                var all_intersection_points = [];

                for (var i = 0; i < polys.length; i++) {
                    var poly = polys[i];

                    var tr = 0.000;
                    var has_neg = false;
                    var has_pos = false;
                    for (var j = 0; j < 4; j++) {
                        var d = vec_dot(poly.points[j], clip_n) - clip_t;
                        has_neg = has_neg || d < -tr;
                        has_pos = has_pos || d > tr;
                    }


                    if (has_neg && has_pos) {

                        polys.splice(i, 1);

                        var points_a = [];
                        var points_b = [];

                        var prev = poly.points[3];

                        if (vec_dot(prev, clip_n) > clip_t)
                            points_a.push(prev);
                        else
                            points_b.push(prev);

                        for (var k = 0; k < 4; k++) {

                            var curr = poly.points[k];

                            if (vec_dot(curr, clip_n) > clip_t) {
                                if (!(vec_dot(prev, clip_n) > clip_t)) {
                                    var t = Math.abs((vec_dot(prev, clip_n) - clip_t) / (vec_dot(curr, clip_n) - vec_dot(prev, clip_n)));
                                    var int = vec_lerp(prev, curr, t);

                                    if (t > 0.0001 && t < 0.9999)
                                        intersection_points.push(int);
                                    points_a.push(int);
                                    points_b.push(int);
                                    all_intersection_points.push(int);
                                    // new_points.push(intersect(curr, prev, curr_b, prev_b));
                                }

                                points_a.push(curr);
                            } else if (vec_dot(prev, clip_n) > clip_t) {

                                var t = Math.abs((vec_dot(prev, clip_n) - clip_t) / (vec_dot(curr, clip_n) - vec_dot(prev, clip_n)));
                                var int = vec_lerp(prev, curr, t);
                                if (t > 0.0001 && t < 0.9999)
                                    intersection_points.push(int);
                                points_a.push(int);
                                points_b.push(int);
                                points_b.push(curr);
                                all_intersection_points.push(int);
                            } else {
                                points_b.push(curr);
                            }
                            prev = curr;
                        }

                        polys.splice(0, 0, new Poly(points_a, poly.fillColor));
                        polys.splice(0, 0, new Poly(points_b, poly.fillColor));
                        i++;
                    }
                }

                // polys = polys.slice(6,15);
                // // polys.splice(0,10);
                // polys.splice(1,3);
                // polys.splice(2,3);
                // polys.splice(1,1);
                // polys.splice(,1);

                // polys.splice(0,1);
                polys.push(best_poly);

                for (var i = 0; i < polys.length; i++) {
                    for (var j = 0; j < polys[i].points.length; j++) {
                        polys[i].points[j] = project(mat3_mul_vec(proj, polys[i].points[j]));
                    }
                }

                for (var i = 0; i < intersection_points.length; i++) {
                    var p = project(mat3_mul_vec(proj, intersection_points[i]));
                    corner_map[pointKey(p)] = "rgba(0,0,0,0)";
                }

                for (var i = 0; i < all_intersection_points.length; i++) {
                    var p0 = project(mat3_mul_vec(proj, all_intersection_points[i]));

                    for (var j = i + 1; j < all_intersection_points.length; j++) {
                        var p1 = project(mat3_mul_vec(proj, all_intersection_points[j]));
                        edge_map[edgeKey(p0, p1)] = "rgba(0,0,0,0)";
                    }
                }

                for (var i = 0; i < 4; i++) {
                    delete edge_map[best_poly.edgeKey(i)];
                }



                draw_polys2(ctx, polys, "rgba(255,0,0,0.0)", 0, 0, edge_map, corner_map, 2.5, 0);


                ctx.restore();
            }

            function d3d_cube_rot() {
                var size = width * 0.55;

                ctx.save();
                ctx.translate(width * 0.5, height * 0.5);

                var proj_rot = ident_matrix;
                proj_rot = mat3_mul(proj_rot, y_flip);
                proj_rot = mat3_mul(proj_rot, mvp);
                proj_rot = mat3_mul(proj_rot, y_flip);

                var proj = mat3_mul(scale_mat3(size), proj_rot);

                var cube_p = cube_polys(proj, [0, 0, 0]);

                var polys = [];

                for (var i = 0; i < cube_p.length; i++) {
                    var pts = [];
                    for (var j = 0; j < cube_p[i].length; j++) {
                        pts.push(project(cube_p[i][j]));
                    }
                    polys.push(new Poly(pts));
                }

                // draw_polys2(ctx, polys, side_color, edge_color, corner_color, 0, 0, 4, 3);
                draw_polys2(ctx, polys, cube_side_color, cube_edge_color, "#333", 0, 0, 3, 2);

                ctx.restore();
            }

            function d3d_cube_edge() {
                var size = width * 0.55;

                ctx.save();
                ctx.translate(width * 0.5, height * 0.5);

                var proj_rot = ident_matrix;
                proj_rot = mat3_mul(proj_rot, y_flip);
                proj_rot = mat3_mul(proj_rot, mvp);
                proj_rot = mat3_mul(proj_rot, y_flip);

                var proj = mat3_mul(scale_mat3(size), proj_rot);

                var cube_p = cube_polys(proj, [0, 0, 0]);

                var polys = [];

                for (var i = 0; i < cube_p.length; i++) {
                    var pts = [];
                    for (var j = 0; j < cube_p[i].length; j++) {
                        pts.push(project(cube_p[i][j]));
                    }

                    var fill = 0;
                    if (i == 0 || i == 5 || i == 3)
                     fill = side_color;
                    polys.push(new Poly(pts, fill));
                }



        var edge_map = {};
        edge_map[polys[0].edgeKey(2)] = edge_color;
        edge_map[polys[0].edgeKey(3)] = edge_color;
        edge_map[polys[3].edgeKey(2)] = edge_color;


        var corner_map = {};
        corner_map[polys[0].pointKey(3)] = corner_color;


                draw_polys2(ctx, polys, undefined, undefined, undefined, edge_map, corner_map, 3, 2);
                // draw_polys2(ctx, polys, cube_side_color, cube_edge_color, "#333", 0, 0, 3, 2);

                ctx.restore();
            }

            function d0d_cube_loc() {
                ctx.translate(width * 0.5, height * 0.5);

                ctx.fillStyle = "rgba(0, 0, 0, 0.8)";

                ctx.beginPath();
                ctx.ellipse(0, 0, 1, 1, 0, 0, Math.PI * 2);
                ctx.closePath();
                ctx.fill();
            }

            function d0d_cube() {
                ctx.translate(width * 0.5, height * 0.5);

                draw_point(ctx);
            }



            function d1d_cube() {

                ctx.translate(width * 0.1, height * 0.5);

                ctx.strokeStyle = base_axis_color;
                ctx.fillStyle = base_axis_color;
                ctx.lineWidth = 1.5;
                ctx.lineCap = "butt";

                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(width * 0.8 + 4, 0);
                ctx.stroke();


                ctx.font = "19px IBM Plex Sans";
                ctx.textAlign = "center";

                draw_axis_label(ctx,[width * 0.8 + 18, 0], 0);

                ctx.strokeStyle = cube_edge_color;
                ctx.lineWidth = 2;
                ctx.lineCap = "round";

                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(width * 0.7 * progress, 0);
                ctx.stroke();

                draw_point(ctx);

                ctx.translate(width * 0.7 * progress, 0);

                draw_point(ctx);
            }

            function d2d_cube() {

                var s = 0.7 * width;
                ctx.translate(width * 0.1, height * 0.9);

                ctx.strokeStyle = base_axis_color;
                ctx.fillStyle = base_axis_color;
                ctx.lineWidth = 1.5;
                ctx.lineCap = "butt";

                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(width * 0.8 + 4, 0);
                ctx.stroke();

                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(0, -height * 0.8 - 4);
                ctx.stroke();


                draw_axis_label(ctx,[width * 0.8 + 18, 0], 0);
                draw_axis_label(ctx,[0, -height * 0.8-19], 1);

                ctx.fillStyle = cube_side_color;
                ctx.fillRect(0, 0, s, -s * progress);

                ctx.strokeStyle = cube_edge_color;
                ctx.lineWidth = 2;
                ctx.lineCap = "round";

                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(s, 0);
                ctx.stroke();

                ctx.beginPath();
                ctx.moveTo(0, -progress * s);
                ctx.lineTo(s, -progress * s);
                ctx.stroke();

                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(s * progress, 0);
                ctx.stroke();

                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(0, -progress * s);
                ctx.stroke();

                ctx.beginPath();
                ctx.moveTo(s, 0);
                ctx.lineTo(s, -progress * s);
                ctx.stroke();

                draw_point(ctx);

                ctx.translate(s, 0);
                draw_point(ctx);

                ctx.translate(0, -s * progress);
                draw_point(ctx);

                ctx.translate(-s, 0);
                draw_point(ctx);
            }

            function d3d_cube() {

                var s = 0.39 * width;

                ctx.translate(width * 0.5, height * 0.58 + 2);

                ctx.strokeStyle = base_axis_color;
                ctx.fillStyle = base_axis_color;
                ctx.lineWidth = 1.5;
                ctx.lineCap = "round";

                ctx.save();

                ctx.font = "19px IBM Plex Sans";
                ctx.textAlign = "center";


                for (var i = 0; i < 3; i++) {
                    ctx.beginPath();
                    ctx.moveTo(0, 0);
                    ctx.lineTo(0, -height * 0.53 + 18);
                    ctx.stroke();

                    ctx.rotate(Math.PI * 2 / 3);


                    ctx.save();
                    ctx.translate(0, -height * 0.53 + 2);
                    ctx.rotate(-(i + 1) * Math.PI * 2 / 3);

                    draw_axis_label(ctx,[0,0], i == 0 ? 0 : 3 - i);

                    ctx.restore();
                }

                ctx.strokeStyle = cube_edge_color;
                ctx.lineWidth = 2;
                ctx.lineCap = "round";
                ctx.lineJoin = "round";


                ctx.save();
                ctx.beginPath();
                ctx.rotate(Math.PI * 1 / 6);
                ctx.moveTo(s, 0);
                ctx.lineTo(0, 0);
                ctx.rotate(-Math.PI * 4 / 6);
                ctx.lineTo(s, 0);

                ctx.stroke();
                ctx.restore();

                ctx.save();
                ctx.rotate(Math.PI * 5 / 6);
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(s * progress, 0);
                ctx.stroke();
                draw_point(ctx);

                ctx.fillStyle = cube_side_color;

                ctx.beginPath();
                ctx.translate(s * progress, 0)
                ctx.moveTo(0, 0);
                ctx.rotate(-Math.PI * 4 / 6);
                ctx.translate(s, 0)
                ctx.lineTo(0, 0);
                ctx.rotate(-Math.PI * 2 / 6);
                ctx.translate(s * progress, 0)
                ctx.lineTo(0, 0);
                ctx.rotate(-Math.PI * 2 / 6);
                ctx.translate(s, 0)
                ctx.lineTo(0, 0);
                ctx.rotate(-Math.PI * 2 / 6);
                ctx.translate(s, 0)
                ctx.lineTo(0, 0);
                ctx.rotate(-Math.PI * 2 / 6);
                ctx.translate(s * progress, 0)
                ctx.lineTo(0, 0);
                ctx.closePath();
                ctx.fill();


                ctx.restore();


                ctx.save();
                ctx.rotate(Math.PI * 5 / 6);
                ctx.translate(s * progress, 0);
                ctx.rotate(-Math.PI * 5 / 6);

                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.rotate(Math.PI * 1 / 6);
                ctx.lineTo(s, 0);
                ctx.rotate(-Math.PI * 2 / 6);
                ctx.lineTo(s, 0);
                ctx.rotate(-Math.PI * 2 / 6);
                ctx.lineTo(s, 0);
                ctx.closePath();
                ctx.stroke();
                ctx.restore();


                ctx.save();
                ctx.translate(0, -s);
                ctx.rotate(Math.PI * 5 / 6);
                ctx.beginPath();
                ctx.moveTo(s * progress, 0);
                ctx.lineTo(0, 0);
                ctx.rotate(-Math.PI * 4 / 6);
                ctx.translate(s, 0);
                ctx.lineTo(0, 0);
                ctx.rotate(+Math.PI * 2 / 6);
                ctx.translate(s, 0);
                ctx.lineTo(0, 0);
                ctx.rotate(+Math.PI * 2 / 6);
                ctx.lineTo(s * progress, 0);
                ctx.stroke();
                ctx.restore();

                ctx.translate(0, -s);
                draw_point(ctx);
                ctx.rotate(+Math.PI * 1 / 6);
                ctx.translate(s, 0);


                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.rotate(+Math.PI * 4 / 6);
                ctx.lineTo(s * progress, 0);
                ctx.stroke();

                draw_point(ctx);
                
                ctx.translate(s * progress,0);
                draw_point(ctx);

                ctx.rotate(+Math.PI * 2 / 6);
                ctx.translate(s, 0);
                draw_point(ctx);

                ctx.rotate(+Math.PI * 8 / 6);
                ctx.translate(s, 0);
                draw_point(ctx);

                ctx.rotate(-Math.PI * 2 / 6);
                ctx.translate(s, 0);
                draw_point(ctx);

                ctx.rotate(-Math.PI * 2 / 6);
                ctx.translate(s * progress, 0);
                draw_point(ctx);
            }

            function d3d4d_cube() {

                ctx.translate(width * 0.5, height * 0.5);

                ctx.strokeStyle = base_axis_color;
                ctx.fillStyle = base_axis_color;
                ctx.lineWidth = 1.5;
                ctx.lineCap = "round";

                ctx.save();

                ctx.font = "19px IBM Plex Sans";
                ctx.textAlign = "center";

                ctx.font = "19px IBM Plex Sans";
                ctx.textAlign = "center";

                var text_offset = 7;

                ctx.strokeStyle = "rgba(0, 0, 0, 0.4)";
                ctx.fillStyle = "rgba(0, 0, 0, 0.8)";

                var dx = vec_norm([1, 1, 1]);
                var dy = vec_norm([-1, -1, 1]);
                var dz = vec_norm([-1, 1, -1]);
                var dw = vec_norm([1, -1, -1]);
                var vecs = [dx, dy, dz, dw];

                var cube_p = cube_polys(ident_matrix, [0.5, 0.5, 0.5]);

                var polys = [];

                var skew = [dx[0], dy[0], dz[0],
                dx[1], dy[1], dz[1],
                dx[2], dy[2], dz[2]];

                var pmat = skew;

                var view_mat = mat3_mul(y_flip, scale_mat3(width * 0.33));
                view_mat = mat3_mul(mvp, view_mat);
                view_mat = mat3_mul(y_flip, view_mat);

                for (var i = 0; i < cube_p.length; i++) {
                    var pts = [];
                    for (var j = 0; j < cube_p[i].length; j++) {
                        pts.push(project(mat3_mul_vec(mat3_mul(view_mat, pmat), cube_p[i][j])));
                    }
                    polys.push(new Poly(pts));
                }


                for (var i = 0; i < 4; i++) {
                    var pts = [];

                    pts.push(project(mat3_mul_vec(view_mat, i == 3 ? [0, 0, 0] : vecs[i])));
                    pts.push(project(mat3_mul_vec(view_mat, vec_scale(vecs[i], 1.2))));
                    pts.push(project(mat3_mul_vec(view_mat, vec_add(vec_scale(vecs[i], 1.2), vecs[(i + 1) % 3]))));

                    polys.push(new Poly(pts, "rgba(0,0,0,0)"));
                }

                var pre = [];
                var post = [];

                for (var i = 0; i < 4; i++) {
                    if (mat3_mul_vec(view_mat, vecs[i])[2] < 0)
                        pre.push(i);
                    else
                        post.push(i);
                }

                for (var i = 0; i < pre.length; i++) {
                    var p = project(mat3_mul_vec(view_mat, vec_scale(vecs[pre[i]], 1.35)));
                    draw_axis_label(ctx,p,pre[i]);
                }

                var color = "#333";
                var edge_map = {};

                var corner_map = {};

                for (var i = 6; i < 10; i++) {
                    edge_map[polys[i].edgeKey(0)] = color;
                    edge_map[polys[i].edgeKey(1)] = "rgba(0,0,0,0)";
                    edge_map[polys[i].edgeKey(2)] = "rgba(0,0,0,0)";

                    corner_map[polys[i].pointKey(0)] = color;
                    corner_map[polys[i].pointKey(1)] = "rgba(0,0,0,0)";
                    corner_map[polys[i].pointKey(2)] = "rgba(0,0,0,0)";
                }

                draw_polys2(ctx, polys, undefined, undefined, undefined, edge_map, corner_map, 0);

                for (var i = 0; i < post.length; i++) {
                    var p = project(mat3_mul_vec(view_mat, vec_scale(vecs[post[i]], 1.35)));
                    draw_axis_label(ctx,p,post[i]);
                }
            }

            function d3d_rot_plane() {

                ctx.translate(width * 0.5, height * 0.5);

                ctx.strokeStyle = base_axis_color;
                ctx.fillStyle = base_axis_color;
                ctx.lineWidth = 1.5;
                ctx.lineCap = "round";

                ctx.save();

                ctx.strokeStyle = "rgba(0, 0, 0, 0.4)";
                ctx.fillStyle = "rgba(0, 0, 0, 0.8)";

                var dx = vec_norm([1, 0, 0]);
                var dy = vec_norm([0, 0, 1]);
                var dz = vec_norm([0, 1, 0]);

                var vecs = [dx, dy, dz];


                var view_mat = mat3_mul(y_flip, scale_mat3(width * 0.28));
                view_mat = mat3_mul(mvp, view_mat);
                view_mat = mat3_mul(y_flip, view_mat);

       

                var radii = [0.4, 0.9, 0.0, 0.4, 0.7, 0.5, 0.8];
                var n = 7;
                for (var d = 0; d < n; d++) {

                    var i = view_mat[8] > 0 ? d : (n - d - 1);
                    var z = (2*i/(n - 1) - 1.0);
                    var pts = [];

                    pts.push(project(mat3_mul_vec(view_mat, [-1, -1, z])));
                    pts.push(project(mat3_mul_vec(view_mat, [ 1, -1, z])));
                    pts.push(project(mat3_mul_vec(view_mat, [ 1,  1, z])));
                    pts.push(project(mat3_mul_vec(view_mat, [-1,  1, z])));

                    draw_polys2(ctx, [new Poly(pts)], "rgba(120,130,140,0.15)", "rgba(0,0,0,0)", "rgba(0,0,0,0)");

                    
                    ctx.beginPath();
                    
                    for (j = 0; j < 64; j++) {
                        var a = j*2*Math.PI/64;
                        var p = [Math.cos(a)* radii[i], Math.sin(a)* radii[i], z];
                        p = project(mat3_mul_vec(view_mat, p));

                        if (j != 0) {
                            ctx.lineTo (p[0], p[1]);
                        } else {
                            ctx.moveTo (p[0], p[1]);
                        }
                    }
                    ctx.closePath();
                    ctx.stroke();

                    var p = [0, 0, z];
                    p = project(mat3_mul_vec(view_mat, p));
           
                    ctx.beginPath();
                    ctx.ellipse(p[0], p[1], 1, 1, 0, 0, Math.PI * 2);
                    ctx.closePath();
                    ctx.fill();

                    var a = progress * 4*Math.PI;
                    var p = [Math.cos(a)* radii[i], Math.sin(a) * radii[i], z];
                    p = project(mat3_mul_vec(view_mat, p));
           
                    ctx.beginPath();
                    ctx.ellipse(p[0], p[1], 3.5, 3.5, 0, 0, Math.PI * 2);
                    ctx.closePath();
                    ctx.fill();
                }

        
                

            }

            function d3d_rot_axis() {

                ctx.translate(width * 0.5, height * 0.5);

                ctx.strokeStyle = base_axis_color;
                ctx.fillStyle = base_axis_color;
                ctx.lineWidth = 1.5;
                ctx.lineCap = "round";

                ctx.save();

                ctx.strokeStyle = "rgba(0, 0, 0, 0.4)";
                ctx.fillStyle = "rgba(0, 0, 0, 0.8)";

                var dx = vec_norm([1, 0, 0]);
                var dy = vec_norm([0, 0, 1]);
                var dz = vec_norm([0, 1, 0]);

                var vecs = [dx, dy, dz];


                var view_mat = mat3_mul(y_flip, scale_mat3(width * 0.28));
                view_mat = mat3_mul(mvp, view_mat);
                view_mat = mat3_mul(y_flip, view_mat);

                ctx.save();
                ctx.strokeStyle = "#333"

                var p0 = project(mat3_mul_vec(view_mat, [0,0,-1.2]));
                var p1 = project(mat3_mul_vec(view_mat, [0,0, 1.2]));
                ctx.beginPath();
                ctx.moveTo(p0[0],p0[1]);
                ctx.lineTo(p1[0],p1[1]);
                ctx.stroke();
                ctx.restore();
                
                var radii = [0.4, 0.9, 0.0, 0.4, 0.7, 0.5, 0.8];
                var n = 7;
                ctx.strokeStyle = "rgba(0,0,0,0.1)";
                ctx.lineWidth = 1.0;
                for (var d = 0; d < n; d++) {

                    var i = view_mat[8] > 0 ? d : (n - d - 1);
                    var z = (2*i/(n - 1) - 1.0);
                    var pts = [];
                    
                    ctx.beginPath();
                    ctx.stroke
                    
                    for (j = 0; j < 64; j++) {
                        var a = j*2*Math.PI/64;
                        var p = [Math.cos(a)* radii[i], Math.sin(a)* radii[i], z];
                        p = project(mat3_mul_vec(view_mat, p));

                        if (j != 0) {
                            ctx.lineTo (p[0], p[1]);
                        } else {
                            ctx.moveTo (p[0], p[1]);
                        }
                    }
                    ctx.closePath();
                    ctx.stroke();

        
                    var a = progress * 4*Math.PI;
                    var p = [Math.cos(a)* radii[i], Math.sin(a) * radii[i], z];
                    p = project(mat3_mul_vec(view_mat, p));
           
                    ctx.beginPath();
                    ctx.ellipse(p[0], p[1], 3.5, 3.5, 0, 0, Math.PI * 2);
                    ctx.closePath();
                    ctx.fill();
                }
            }

            function d3d_rot_planes() {

                ctx.translate(width * 0.5, height * 0.5);

                ctx.strokeStyle = base_axis_color;
                ctx.fillStyle = base_axis_color;
                ctx.lineWidth = 1.5;
                ctx.lineCap = "round";

                ctx.save();

                ctx.strokeStyle = "rgba(0, 0, 0, 0.4)";
                ctx.fillStyle = "rgba(0, 0, 0, 0.8)";

                var dx = vec_norm([1, 0, 0]);
                var dy = vec_norm([0, 0, 1]);
                var dz = vec_norm([0, 1, 0]);

                var vecs = [dx, dy, dz];


                var view_mat = mat3_mul(y_flip, scale_mat3(width * 0.33));
                view_mat = mat3_mul(mvp, view_mat);
                view_mat = mat3_mul(y_flip, view_mat);

                var colors = [
                    "rgba(241, 196, 15,0.7)",
                    "rgba(231, 76, 60,0.7)",
                    "rgba(46, 204, 113,0.7)",
                ]


                var polys = [];
                var k = 0;
                for (var i = 0; i < 3; i++) {
                    for (var j = i + 1; j < 3; j++) {
                        var pts = [];

                        pts.push(project(mat3_mul_vec(view_mat, [0, 0, 0])));
                        pts.push(project(mat3_mul_vec(view_mat, vecs[i])));
                        pts.push(project(mat3_mul_vec(view_mat, vec_add(vecs[i], vecs[j]))));
                        pts.push(project(mat3_mul_vec(view_mat, vecs[j])));

                        polys.push(new Poly(pts, colors[k++]));

                    }
                }

                for (var i = 0; i < 3; i++) {
                    var pts = [];

                    pts.push(project(mat3_mul_vec(view_mat, vecs[i])));
                    pts.push(project(mat3_mul_vec(view_mat, vec_scale(vecs[i], 1.2))));
                    pts.push(project(mat3_mul_vec(view_mat, vec_add(vec_scale(vecs[i], 1.2), vecs[(i + 1) % 3]))));

                    polys.push(new Poly(pts, "rgba(0,0,0,0)"));
                }

                var pre = [];
                var post = [];

                for (var i = 0; i < 3; i++) {
                    if (mat3_mul_vec(view_mat, vecs[i])[2] < 0)
                        pre.push(i);
                    else
                        post.push(i);
                }

                for (var i = 0; i < pre.length; i++) {
                    var p = project(mat3_mul_vec(view_mat, vec_scale(vecs[pre[i]], 1.35)));
                    draw_axis_label(ctx,p,pre[i], true);
                }

                var color = "#333";
                var edge_map = {};
                for (var i = 0; i < 3; i++) {
                    edge_map[polys[i].edgeKey(0)] = color;
                    edge_map[polys[i].edgeKey(3)] = color;
                }

                for (var i = 3; i < 6; i++) {
                    edge_map[polys[i].edgeKey(0)] = color;
                }

                draw_polys2(ctx, polys, undefined, "rgba(0,0,0,0)", "rgba(0,0,0,0)", edge_map, undefined, 0);

                for (var i = 0; i < post.length; i++) {
                    var p = project(mat3_mul_vec(view_mat, vec_scale(vecs[post[i]], 1.35)));
                    draw_axis_label(ctx,p,post[i], true);
                }

            }

            function d4d_rot_planes() {

                ctx.translate(width * 0.5, height * 0.5);

                ctx.strokeStyle = base_axis_color;
                ctx.fillStyle = base_axis_color;
                ctx.lineWidth = 1.5;
                ctx.lineCap = "round";

                ctx.save();

                ctx.strokeStyle = "rgba(0, 0, 0, 0.4)";
                ctx.fillStyle = "rgba(0, 0, 0, 0.8)";

                var dx = vec_norm([1, 1, 1]);
                var dy = vec_norm([-1, -1, 1]);
                var dz = vec_norm([-1, 1, -1]);
                var dw = vec_norm([1, -1, -1]);

                var vecs = [dx, dy, dz, dw];


                var view_mat = mat3_mul(y_flip, scale_mat3(width * 0.33));
                view_mat = mat3_mul(mvp, view_mat);
                view_mat = mat3_mul(y_flip, view_mat);

                var colors = [
                    "rgba(241, 196, 15,0.6)",
                    "rgba(231, 76, 60,0.6)",
                    "rgba(230, 126, 34,0.6)",
                    "rgba(46, 204, 113,0.6)",
                    "rgba(52, 152, 219,0.6)",
                    "rgba(155, 89, 182,0.6)",
                ]

                var polys = [];
                var k = 0;
                for (var i = 0; i < 4; i++) {
                    for (var j = i + 1; j < 4; j++) {
                        var pts = [];

                        pts.push(project(mat3_mul_vec(view_mat, [0, 0, 0])));
                        pts.push(project(mat3_mul_vec(view_mat, vecs[i])));
                        pts.push(project(mat3_mul_vec(view_mat, vec_add(vecs[i], vecs[j]))));
                        pts.push(project(mat3_mul_vec(view_mat, vecs[j])));

                        polys.push(new Poly(pts, colors[k++]));

                    }
                }

                for (var i = 0; i < 4; i++) {
                    var pts = [];

                    pts.push(project(mat3_mul_vec(view_mat, vecs[i])));
                    pts.push(project(mat3_mul_vec(view_mat, vec_scale(vecs[i], 1.2))));
                    pts.push(project(mat3_mul_vec(view_mat, vec_add(vec_scale(vecs[i], 1.2), vecs[(i + 1) % 4]))));

                    polys.push(new Poly(pts, "rgba(0,0,0,0)"));
                }

                var pre = [];
                var post = [];

                for (var i = 0; i < 4; i++) {
                    if (mat3_mul_vec(view_mat, vecs[i])[2] < 0)
                        pre.push(i);
                    else
                        post.push(i);
                }

                for (var i = 0; i < pre.length; i++) {
                    var p = project(mat3_mul_vec(view_mat, vec_scale(vecs[pre[i]], 1.35)));
                    draw_axis_label(ctx,p,pre[i],true);
                }

                var color = "#333";
                var edge_map = {};
                for (var i = 0; i < 6; i++) {
                    edge_map[polys[i].edgeKey(0)] = color;
                    edge_map[polys[i].edgeKey(3)] = color;
                }

                for (var i = 6; i < 10; i++) {
                    edge_map[polys[i].edgeKey(0)] = color;
                }

                draw_polys2(ctx, polys, undefined, "rgba(0,0,0,0)", "rgba(0,0,0,0)", edge_map, undefined, 0);

                for (var i = 0; i < post.length; i++) {
                    var p = project(mat3_mul_vec(view_mat, vec_scale(vecs[post[i]], 1.35)));
                    draw_axis_label(ctx,p,post[i],true);
                }

            }

            function d4d_cube() {

                ctx.translate(width * 0.5, height * 0.5);

                ctx.strokeStyle = base_axis_color;
                ctx.fillStyle = base_axis_color;
                ctx.lineWidth = 1.5;
                ctx.lineCap = "round";

                ctx.save();

                var points = [[0, 0, 0], [1, 1, 1], [-1, -1, 1], [-1, 1, -1], [1, -1, -1]];


                var mat = scale_mat3(width * 0.24);

                mat = mat3_mul(y_flip, mat);
                mat = mat3_mul(mvp, mat);
                mat = mat3_mul(y_flip, mat);

                for (var i = 0; i < points.length; i++) {
                    points[i] = project(mat3_mul_vec(mat, points[i]));
                }


                ctx.strokeStyle = "rgba(0, 0, 0, 0.4)";
                ctx.fillStyle = "rgba(0, 0, 0, 0.8)";

                var dx = vec_norm([1, 1, 1]);
                var dy = vec_norm([-1, -1, 1]);
                var dz = vec_norm([-1, 1, -1]);
                var dw = vec_norm([1, -1, -1]);

                var cube_p = cube_polys(ident_matrix, [0.5, 0.5, 0.5]);

                var polys = [];

                var skew = [dx[0], dy[0], dz[0],
                dx[1], dy[1], dz[1],
                dx[2], dy[2], dz[2]];

                var pmat = skew;

                var view_mat = mat3_mul(y_flip, scale_mat3(width * 0.25));
                view_mat = mat3_mul(mvp, view_mat);
                view_mat = mat3_mul(y_flip, view_mat);

                for (var i = 0; i < cube_p.length; i++) {
                    var pts = [];
                    for (var j = 0; j < cube_p[i].length; j++) {
                        pts.push(project(mat3_mul_vec(mat3_mul(view_mat, pmat), cube_p[i][j])));
                    }
                    polys.push(new Poly(pts));
                }

                if (progress != 0) {

                    for (var i = 0; i < cube_p.length; i++) {
                        var pts = [];
                        for (var j = 0; j < cube_p[i].length; j++) {
                            var p = mat3_mul_vec(pmat, cube_p[i][j]);
                            p = vec_add(p, vec_scale(dw, progress));
                            p = mat3_mul_vec(view_mat, p);
                            pts.push(project(p));
                        }
                        polys.push(new Poly(pts));
                    }

                    polys.push(new Poly([polys[0].points[0],
                    polys[0].points[1],
                    polys[6].points[1],
                    polys[6].points[0]]));

                    polys.push(new Poly([polys[0].points[2],
                    polys[0].points[3],
                    polys[6].points[3],
                    polys[6].points[2]]));


                    polys.push(new Poly([polys[1].points[0],
                    polys[1].points[1],
                    polys[7].points[1],
                    polys[7].points[0]]));

                    polys.push(new Poly([polys[1].points[2],
                    polys[1].points[3],
                    polys[7].points[3],
                    polys[7].points[2]]));
                }

                var pre = [];
                var post = [];

                for (var i = 0; i < 4; i++) {
                    if (points[i + 1][2] < -1)
                        pre.push(i);
                    else
                        post.push(i);
                }

                for (var i = 0; i < pre.length; i++) {
                    draw_axis_label(ctx,vec_scale (points[pre[i] + 1], 1.1),pre[i]);
                }




                draw_polys2(ctx, polys, "rgba(0,0,0,0)", undefined, undefined, undefined, undefined, undefined, 2, true)

                ctx.strokeStyle = base_axis_color;
                ctx.fillStyle = base_axis_color;

                for (var i = 0; i < 4; i++) {
                    ctx.beginPath();
                    ctx.moveTo(0, 0);
                    ctx.lineTo(points[i + 1][0], points[i + 1][1]);
                    ctx.stroke();
                }


                for (var i = 0; i < post.length; i++) {
                    draw_axis_label(ctx,vec_scale (points[post[i] + 1], 1.1),post[i]);
                }

            }


            function d3d_ambig() {

                ctx.translate(width * 0.5, height * 0.62 + 6);

                ctx.strokeStyle = base_axis_color;
                ctx.fillStyle = base_axis_color;
                ctx.lineWidth = 1.5;
                ctx.lineCap = "round";

                ctx.save();

                ctx.font = "19px IBM Plex Sans";
                ctx.textAlign = "center";


                for (var i = 0; i < 3; i++) {
                    ctx.beginPath();
                    ctx.moveTo(0, 0);
                    ctx.lineTo(0, -height * 0.62 + 30);
                    ctx.stroke();

                    ctx.rotate(Math.PI * 2 / 3);


                    ctx.save();
                    ctx.translate(0, -height * 0.62 +8);
                    ctx.rotate(-(i + 1) * Math.PI * 2 / 3);

                    draw_axis_label(ctx,[0,0],  i == 0 ? 0 : 3 - i);
                    ctx.restore();
                }

                ctx.restore();

                ctx.lineWidth = 1.0;


                var s = width * 0.05 + width * 0.23 * progress;
                ctx.save();
                ctx.strokeStyle = "rgba(0,0,0,0.2)";

                // ctx.setLineDash([5, 2.5]);

                ctx.rotate(Math.PI / 6);
                ctx.translate(s, 0);
                ctx.rotate(Math.PI * 2 / 3);

                ctx.beginPath()
                ctx.moveTo(0, 0);
                ctx.lineTo(-width * 0.05 + s, 0);
                ctx.stroke();
                ctx.translate(-width * 0.05 + s, 0);

                ctx.rotate(Math.PI * 1 / 3);

                ctx.beginPath()
                ctx.moveTo(s, 0);
                ctx.lineTo(0, 0);
                ctx.stroke();

                ctx.rotate(Math.PI * 1 / 3);

                ctx.beginPath()
                ctx.moveTo(0, 0);
                ctx.lineTo(s + 0.15 * width - 2, 0);

                ctx.stroke();

                ctx.translate(s + 0.15 * width, 0);

                ctx.save();
                ctx.rotate(-Math.PI * 2 / 3);
                ctx.translate(width * 0.05 - s, 0);

                ctx.beginPath()
                ctx.moveTo(0, 0);
                ctx.lineTo(-width * 0.05 + s, 0);
                ctx.stroke();

                ctx.save();
                ctx.rotate(-Math.PI * 2 / 3);
                ctx.translate(-s, 0);

                ctx.beginPath()
                ctx.moveTo(0, 0);
                ctx.lineTo(s, 0);
                ctx.stroke();
                ctx.restore();

                ctx.rotate(-Math.PI * 4 / 3);
                ctx.translate(-s - 0.15 * width, 0);

                ctx.beginPath()
                ctx.moveTo(0, 0);
                ctx.lineTo(s + 0.15 * width, 0);
                ctx.stroke();

                ctx.restore();

                ctx.save();

                ctx.rotate(Math.PI * 2 / 3);
                ctx.translate(-s, 0);

                ctx.beginPath()
                ctx.moveTo(0, 0);
                ctx.lineTo(s, 0);
                ctx.stroke();

                ctx.save();

                ctx.rotate(-Math.PI * 4 / 3);
                ctx.translate(width * 0.05 - s, 0);

                ctx.beginPath()
                ctx.moveTo(0, 0);
                ctx.lineTo(-width * 0.05 + s, 0);
                ctx.stroke();
                ctx.restore();

                ctx.rotate(Math.PI * 4 / 3);
                ctx.translate(-s - 0.15 * width, 0);

                ctx.beginPath()
                ctx.moveTo(0, 0);
                ctx.lineTo(s + 0.15 * width, 0);
                ctx.stroke();

                ctx.restore();

                ctx.fillStyle = "#333";

                ctx.beginPath();
                ctx.ellipse(0, 0, 3.5, 3.5, 0, 0, Math.PI * 2);
                ctx.closePath();
                ctx.fill();

                ctx.restore();
            }

            function d4d_space_3d() {

                ctx.translate(width * 0.5, height * 0.5);

                ctx.strokeStyle = base_axis_color;
                ctx.fillStyle = base_axis_color;
                ctx.lineWidth = 1.5;
                ctx.lineCap = "round";

                ctx.save();

                ctx.font = "19px IBM Plex Sans";
                ctx.textAlign = "center";

                var points = [[0, 0, 0], [0, 0, 1], [0, -1, 0], [-1, 0, 0]];

                var labels = [[0, 1, 2],
                [3,1,0],
                [2,1,3],
                [0,2,3],
            ];

                var mat = scale_mat3(width * 0.31);

                mat = mat3_mul(y_flip, mat);
                mat = mat3_mul(mvp, mat);
                mat = mat3_mul(y_flip, mat);

                for (var i = 0; i < points.length; i++) {
                    points[i] = project(mat3_mul_vec(mat, points[i]));
                }

                ctx.font = "19px IBM Plex Sans";
                ctx.textAlign = "center";

                var dy = 7;

                ctx.strokeStyle = "rgba(0, 0, 0, 0.8)";
                ctx.fillStyle = "rgba(0, 0, 0, 0.8)";

                var pre = [];
                var post = [];

                for (var i = 0; i < 3; i++) {
                    if (points[i + 1][2] < -1)
                        pre.push(i);
                    else
                        post.push(i);
                }

                for (var i = 0; i < pre.length; i++) {
                    draw_axis_label(ctx,vec_scale (points[pre[i] + 1], 1.35),labels[selection][pre[i]]);
                }


                for (var i = 0; i < 3; i++) {
                    ctx.beginPath();
                    ctx.moveTo(0, 0);
                    ctx.lineTo(points[i + 1][0], points[i + 1][1]);
                    ctx.stroke();
                }

                for (var i = 0; i < post.length; i++) {
                    draw_axis_label(ctx,vec_scale (points[post[i] + 1], 1.35),labels[selection][post[i]]);
                }

            }


            function d4d_space() {

                ctx.translate(width * 0.5, height * 0.5);

                ctx.strokeStyle = base_axis_color;
                ctx.fillStyle = base_axis_color;
                ctx.lineWidth = 1.5;
                ctx.lineCap = "round";

                ctx.save();

                ctx.font = "19px IBM Plex Sans";
                ctx.textAlign = "center";

                var d = 0.4;
                var d2 = 0.8;
                var points = [[0, 0, 0], [1, 1, 1], [-1, -1, 1], [-1, 1, -1], [1, -1, -1]];
                var ps = [[d, d, d], [-d, -d, d], [-d, d, -d], [d, -d, -d]];
                var ps2 = [[d2, d2, d2], [-d2, -d2, d2], [-d2, d2, -d2], [d2, -d2, -d2]];

                var mat = scale_mat3(width * 0.24);

                mat = mat3_mul(y_flip, mat);
                mat = mat3_mul(mvp, mat);
                mat = mat3_mul(y_flip, mat);

                for (var i = 0; i < points.length; i++) {
                    points[i] = project(mat3_mul_vec(mat, points[i]));
                }

                ctx.font = "19px IBM Plex Sans";
                ctx.textAlign = "center";

                var dy = 7;

                ctx.fillStyle = "rgba(0, 0, 0, 0.8)";

                
                var pre = [];
                var post = [];

                for (var i = 0; i < 4; i++) {
                    if (points[i + 1][2] < -1)
                        pre.push(i);
                    else
                        post.push(i);
                }

                for (var i = 0; i < pre.length; i++) {
                    draw_axis_label(ctx,vec_scale (points[pre[i] + 1], 1.1),pre[i]);
                }
                ctx.strokeStyle = "rgba(0,0,0,0.15)";

                if (selection == 0) {

                    for (var i = 0; i < 3; i++) {
                    var p0 = project(mat3_mul_vec(mat, ps[i]));
                    var p1 = project(mat3_mul_vec(mat, vec_add(ps[i], ps[(i + 1) % 3])));

                    ctx.beginPath();
                    ctx.moveTo(p0[0], p0[1]);
                    ctx.lineTo(p1[0], p1[1]);
                    ctx.stroke();

                    var p1 = project(mat3_mul_vec(mat, vec_add(ps[i], ps[(i + 2) % 3])));

                    ctx.beginPath();
                    ctx.moveTo(p0[0], p0[1]);
                    ctx.lineTo(p1[0], p1[1]);
                    ctx.stroke();

                    var p0 = project(mat3_mul_vec(mat, vec_add(ps[0], vec_add(ps[1], ps[2]))));

                    ctx.beginPath();
                    ctx.moveTo(p0[0], p0[1]);
                    ctx.lineTo(p1[0], p1[1]);
                    ctx.stroke();
                    }
                } else if (selection == 1) {

                    var p0 = project(mat3_mul_vec(mat, vec_add(ps[0], vec_add(ps[1], ps[2]))));
                    var p1 = points[0];
                    ctx.beginPath();
                    ctx.moveTo(p0[0], p0[1]);
                    ctx.lineTo(p1[0], p1[1]);
                    ctx.stroke();
                } else {
                    for (var i = 0; i < 3; i++) {
                        var p0 = project(mat3_mul_vec(mat, ps2[i]));
                        var p1 = project(mat3_mul_vec(mat, vec_add(ps2[i], ps2[(i + 1) % 3])));
    
                        ctx.beginPath();
                        ctx.moveTo(p0[0], p0[1]);
                        ctx.lineTo(p1[0], p1[1]);
                        ctx.stroke();
    
                        var p1 = project(mat3_mul_vec(mat, vec_add(ps2[i], ps2[(i + 2) % 3])));
    
                        ctx.beginPath();
                        ctx.moveTo(p0[0], p0[1]);
                        ctx.lineTo(p1[0], p1[1]);
                        ctx.stroke();
    
                        var p0 = project(mat3_mul_vec(mat, vec_add(ps2[0], vec_add(ps2[1], ps2[2]))));
    
                        ctx.beginPath();
                        ctx.moveTo(p0[0], p0[1]);
                        ctx.lineTo(p1[0], p1[1]);
                        ctx.stroke();
                        }

                        var p0 = project(mat3_mul_vec(mat, vec_add(ps2[0], vec_add(ps2[1], ps2[2]))));
                        var p1 = project(mat3_mul_vec(mat, [-d, d, d]));
                        ctx.beginPath();
                        ctx.moveTo(p0[0], p0[1]);
                        ctx.lineTo(p1[0], p1[1]);
                        ctx.stroke();
                }

            
                var p = project(mat3_mul_vec(mat, [-d, +d, +d]));

                ctx.beginPath();
                ctx.ellipse(p[0], p[1], 3, 3, 0, 0, Math.PI * 2);
                ctx.closePath();
                ctx.fill();

                ctx.strokeStyle = "rgba(0, 0, 0, 0.4)";

                for (var i = 0; i < 4; i++) {
                    ctx.beginPath();
                    ctx.moveTo(0, 0);
                    ctx.lineTo(points[i + 1][0], points[i + 1][1]);
                    ctx.stroke();
                }

                for (var i = 0; i < post.length; i++) {
                    draw_axis_label(ctx,vec_scale (points[post[i] + 1], 1.1),post[i]);
                }

            }

            function dtess_corner() {
                var size = width * 0.83;

                ctx.save();
                ctx.translate(width * 0.5, height * 0.5);

                var proj_rot = ident_matrix;
                proj_rot = mat3_mul(proj_rot, y_flip);
                proj_rot = mat3_mul(proj_rot, mvp);
                proj_rot = mat3_mul(proj_rot, y_flip);

                var proj = mat3_mul(scale_mat3(size), proj_rot);

                var cube_m = ident_matrix4d;


                var center = [0, 0, 0, -1];
                var points4d = tess_points(cube_m, center);
                var pr_w = 1.0;

                for (var i = 0; i < points4d.length; i++) {
                    var p = points4d[i]
                    points4d[i][0] = pr_w * p[0] / (pr_w - p[3]);
                    points4d[i][1] = pr_w * p[1] / (pr_w - p[3]);
                    points4d[i][2] = pr_w * p[2] / (pr_w - p[3]);
                }

                var polys = [];

                for (var i = 0; i < tess_walls_point_inds.length; i++) {
                    var wall_points = tess_walls_point_inds[i];
                    var points = [];

                    for (var j = 0; j < wall_points.length; j++) {
                        var p = mat3_mul_vec(proj, points4d[wall_points[j]]);
                        p = project(p);
                        points.push(p);
                    }
                    var fill = undefined;

                    if (i == 0 || i == 3 || i == 5 || i == 17 || i == 14 || i == 13)
                        fill = side_color;


                    polys.push(new Poly(points, fill));
                }

                var edge_map = {};
                edge_map[polys[0].edgeKey(2)] = edge_color;
                edge_map[polys[0].edgeKey(1)] = edge_color;
                edge_map[polys[17].edgeKey(3)] = edge_color;
                edge_map[polys[17].edgeKey(2)] = edge_color;

                var corner_map = {};
                corner_map[polys[0].pointKey(2)] = corner_color;


                draw_polys2(ctx, polys,
                    "rgba(0,0,0,0)",
                    undefined,
                    undefined,
                    edge_map,
                    corner_map,
                    3)

                ctx.restore();
            }

            function dtess_edge() {
                var size = width * 0.83;

                ctx.save();
                ctx.translate(width * 0.5, height * 0.5);

                var proj_rot = ident_matrix;
                proj_rot = mat3_mul(proj_rot, y_flip);
                proj_rot = mat3_mul(proj_rot, mvp);
                proj_rot = mat3_mul(proj_rot, y_flip);

                var proj = mat3_mul(scale_mat3(size), proj_rot);

                var cube_m = ident_matrix4d;
                cube_m = rot_xw_matrix4d(x * Math.PI * 2);
                cube_m = mat3_mul4d(cube_m, rot_yw_matrix4d(y * Math.PI * 2));
                cube_m = mat3_mul4d(cube_m, rot_zw_matrix4d(z * Math.PI * 2));

                var center = [0, 0, 0, -1];
                var points4d = tess_points(cube_m, center);
                var pr_w = 1.0;

                for (var i = 0; i < points4d.length; i++) {
                    var p = points4d[i]
                    points4d[i][0] = pr_w * p[0] / (pr_w - p[3]);
                    points4d[i][1] = pr_w * p[1] / (pr_w - p[3]);
                    points4d[i][2] = pr_w * p[2] / (pr_w - p[3]);
                }

                var polys = [];

                for (var i = 0; i < tess_walls_point_inds.length; i++) {
                    var wall_points = tess_walls_point_inds[i];
                    var points = [];

                    for (var j = 0; j < wall_points.length; j++) {
                        var p = mat3_mul_vec(proj, points4d[wall_points[j]]);
                        p = project(p);
                        points.push(p);
                    }
                    var fill = undefined;
                    if (i == 0 || i == 5 || i == 14)
                        fill = side_color;

                    polys.push(new Poly(points, fill));
                }

                var edge_map = {};
                edge_map[polys[0].edgeKey(2)] = edge_color;

                draw_polys2(ctx, polys,
                    "rgba(0,0,0,0)",
                    "#555",
                    "#555",
                    edge_map,
                    undefined,
                    1,
                    2.2)

                ctx.restore();
            }

        }

        var self = this;
        this.on_resize = function () {
            width = wrapper.clientWidth;
            height = wrapper.clientHeight;

            canvas.style.width = width + "px";
            canvas.style.height = height + "px";
            canvas.width = width * scale;
            canvas.height = height * scale;

            if (arcball)
            arcball.set_viewport(0, 0, width, height);

            self.repaint();
        }

        document.fonts.load("10px IBM Plex Sans").then(function () { self.repaint() });

        this.on_resize();

        window.addEventListener("resize", this.on_resize, true);
        window.addEventListener("load", this.on_resize, true);

    }


    document.addEventListener("DOMContentLoaded", function (event) {


        var ts_0D_cube_drawer = new Drawer(scale, document.getElementById("ts_0D_cube_container"), "0D_cube_loc");
        var ts_0Da_cube_drawer = new Drawer(scale, document.getElementById("ts_0Da_cube_container"), "0D_cube");


        var ts_1D_cube_drawer = new Drawer(scale, document.getElementById("ts_1D_cube_container"), "1D_cube");
        new Slider(document.getElementById("ts_1D_cube_slider_container"), function (x) {
            ts_1D_cube_drawer.set_progress(x);
        }, undefined, 0.0);



        var ts_2D_cube_drawer = new Drawer(scale, document.getElementById("ts_2D_cube_container"), "2D_cube");

        new Slider(document.getElementById("ts_2D_cube_slider_container"), function (x) {
            ts_2D_cube_drawer.set_progress(x);
        }, undefined, 0.0);



        var ts_3D_cube_drawer = new Drawer(scale, document.getElementById("ts_3D_cube_container"), "3D_cube");

        new Slider(document.getElementById("ts_3D_cube_slider_container"), function (x) {
            ts_3D_cube_drawer.set_progress(x);
        }, undefined, 0.0);


        new Drawer(scale, document.getElementById("ts_3D_cube_rot_container"), "3D_cube_rot");
        new Drawer(scale, document.getElementById("ts_cube_edge_container"), "3D_cube_edge");


        new Drawer(scale, document.getElementById("ts_3D_cube_4D_container"), "3D4D_cube");

        new Drawer(scale, document.getElementById("ts_3D_rot_planes_container"), "3D_rot_planes");
        new Drawer(scale, document.getElementById("ts_4D_rot_planes_container"), "4D_rot_planes");


        var ts_4D_cube_drawer = new Drawer(scale, document.getElementById("ts_4D_cube_container"), "4D_cube");

        new Slider(document.getElementById("ts_4D_cube_slider_container"), function (x) {
            ts_4D_cube_drawer.set_progress(x);
        }, undefined, 0.0);

   
        ts_2D_cube_slice_drawer = new Drawer(scale, document.getElementById("ts_2D_slice_container"), "2D_slice");

        ts_2D_cube_slice_slider =  new Slider(document.getElementById("ts_2D_slice_slider_container"), function (x) {
            ts_2D_cube_slice_drawer.set_progress(x);
        }, undefined, 0.0);

        ts_3D_cube_slice_drawer = new Drawer(scale, document.getElementById("ts_3D_slice_container"), "3D_slice");


        ts_3D_cube_slice_sliders = [
        new Slider(document.getElementById("ts_3D_slice_slider_container"), function (x) {
            ts_3D_cube_slice_drawer.set_progress(x);
        }, "ts_w_"),
        new Slider(document.getElementById("ts_3D_slice_xw_rot_slider_container"), function (x) {
            ts_3D_cube_slice_drawer.set_x(x);
        }, "ts_xw_"),
        new Slider(document.getElementById("ts_3D_slice_yw_rot_slider_container"), function (x) {
            ts_3D_cube_slice_drawer.set_y(x);
        }, "ts_yw_"),
        new Slider(document.getElementById("ts_3D_slice_zw_rot_slider_container"), function (x) {
            ts_3D_cube_slice_drawer.set_z(x);
        }, "ts_zw_")];



        var ts_3D_cube_demo_slice_drawer = new Drawer(scale, document.getElementById("ts_3D_demo_slice_container"), "3D_slice");

        ts_3D_cube_demo_slice_drawer.set_x(0.3);
        ts_3D_cube_demo_slice_drawer.set_y(0.2);
        ts_3D_cube_demo_slice_drawer.set_z(0.7);

        new Slider(document.getElementById("ts_3D_demo_slice_slider_container"), function (x) {
            ts_3D_cube_demo_slice_drawer.set_progress(x);
        });


        var ts_3D_ambig_drawer = new Drawer(scale, document.getElementById("ts_3D_ambig_container"), "3D_ambig");

        new Slider(document.getElementById("ts_3D_ambig_slider_container"), function (x) {
            ts_3D_ambig_drawer.set_progress(x);
        }, undefined);

        (new Drawer(scale, document.getElementById("ts_3D_space_0_container"), "4D_space_3D")).set_selection(0);
        (new Drawer(scale, document.getElementById("ts_3D_space_1_container"), "4D_space_3D")).set_selection(1);
        (new Drawer(scale, document.getElementById("ts_3D_space_2_container"), "4D_space_3D")).set_selection(2);
        (new Drawer(scale, document.getElementById("ts_3D_space_3_container"), "4D_space_3D")).set_selection(3);


        var ts_4d_drawer = new Drawer(scale, document.getElementById("ts_4D_space_container"), "4D_space");
        new SegmentedControl(document.getElementById("ts_4D_space_segmented_container"), function (x) {
            ts_4d_drawer.set_selection(x);
        },
            ["A", "B", "C"]
        );

        ts_2D_cube_proj_drawer = new Drawer(scale, document.getElementById("ts_2D_proj_container"), "2D_proj");

        ts_2d_cube_proj_seg = new SegmentedControl(document.getElementById("ts_2D_proj_segmented_container"), function (x) {
            ts_2D_cube_proj_drawer.set_selection(x);
        },
            [" ", "1", "2", "3", "4", "5", "6"]
        );

        var ts_3D_cube_proj_drawer = new Drawer(scale, document.getElementById("ts_3D_proj_container"), "3D_proj");


        new SegmentedControl(document.getElementById("ts_3D_proj_segmented_container"), function (x) {
            ts_3D_cube_proj_drawer.set_selection(x);
        },
            [" ", "1", "2", "3", "4", "5", "6", "7", "8"]
        );

        var ts_4D_cube_rot_drawer = new Drawer(scale, document.getElementById("ts_3D_proj_rot_container"), "3D_proj_rot");


        new Slider(document.getElementById("ts_3D_projxw_slider_container"), function (x) {
            // x = 0.3026315789473684;
            ts_4D_cube_rot_drawer.set_x(x);
        }, undefined);

        new Drawer(scale, document.getElementById("ts_tess_corner_container"), "tess_corner");
        new Drawer(scale, document.getElementById("ts_tess_edge_container"), "tess_edge");
        var rot_pl = new Drawer(scale, document.getElementById("ts_3D_rot_plane_container"), "3D_rot_plane");

        new Slider(document.getElementById("ts_3D_rot_plane_slider_container"), function (x) {
            rot_pl.set_progress(x);
        }, undefined);

        var rot_ax = new Drawer(scale, document.getElementById("ts_3D_rot_axis_container"), "3D_rot_axis");

        new Slider(document.getElementById("ts_3D_rot_axis_slider_container"), function (x) {
            rot_ax.set_progress(x);
        }, undefined);



        ts_2D_cube_proj_drawer2 = new Drawer(scale, document.getElementById("ts_2D_proj_container2"), "2D_proj2");

        ts_2D_cube_proj_drawer2.set_selection(6);

        ts_2D_cube_proj_slider2 = new Slider(document.getElementById("ts_2D_proj_slider_container"), function (x) {
            ts_2D_cube_proj_drawer2.set_progress(x);
        }, undefined, 0.5);
    });

})();


function ts_rotated_3D_cube_slice() {
    ts_2D_cube_slice_drawer.set_mvp([0.8825791027204245, 0.2954995490584739, 0.3656967923669126, 0.18327696880341998, 0.5000452600474088, -0.8463830637544381, -0.4329707613077824, 0.814023804572297, 0.38717123529802905]);
    ts_2D_cube_slice_drawer.set_progress(0.4);
    ts_2D_cube_slice_slider.set_value(0.4);
}

function ts_straight_3D_cube_slice() {
    ts_2D_cube_slice_drawer.set_mvp(ident_matrix);
}

function ts_rotated_3D_simple_slice() {
    var y_flip = [1, 0, 0, 0, -1, 0, 0, 0, 1];

    var proj_rot = mat3_mul(rot_y_mat3(-Math.PI / 5), ident_matrix);
    proj_rot = mat3_mul(rot_x_mat3(-0.5), proj_rot);
    proj_rot = mat3_mul(proj_rot, y_flip);
    proj_rot = mat3_mul(y_flip, proj_rot);
    var m = proj_rot;
    proj_rot = mat3_invert(proj_rot);
    proj_rot = mat3_mul(rot_y_mat3(Math.PI/5), proj_rot);
    proj_rot = mat3_mul(m, proj_rot);

    ts_2D_cube_slice_drawer.set_mvp(proj_rot);
}

function ts_rotated_3D_hex_slice() {
    var y_flip = [1, 0, 0, 0, -1, 0, 0, 0, 1];

    var proj_rot = mat3_mul(rot_y_mat3(-Math.PI / 5), ident_matrix);
    proj_rot = mat3_mul(rot_x_mat3(-0.5), proj_rot);
    proj_rot = mat3_mul(proj_rot, y_flip);
    proj_rot = mat3_mul(y_flip, proj_rot);
    var m = proj_rot;
    proj_rot = mat3_invert(proj_rot);
    proj_rot = mat3_mul(rot_y_mat3(Math.PI/4), proj_rot);
    //atan(1/sqrt(2))
    proj_rot = mat3_mul(rot_x_mat3(0.6154797087), proj_rot);
    proj_rot = mat3_mul(m, proj_rot);

    ts_2D_cube_slice_drawer.set_mvp(proj_rot);
    ts_2D_cube_slice_drawer.set_progress(0.5);
    ts_2D_cube_slice_slider.set_value(0.5);
}



function ts_2d_proj_straight(){
    ts_2D_cube_proj_drawer.set_mvp(ident_matrix);
    ts_2d_cube_proj_seg.set_selection(6);
}


function ts_2d_proj_inters(){
    ts_2D_cube_proj_drawer.set_mvp(mat3_mul(rot_y_mat3(0.9), rot_x_mat3(0.8)));
    ts_2d_cube_proj_seg.set_selection(0);
}

function ts_2d_proj2_inside(){
    ts_2D_cube_proj_drawer2.set_progress(0.5);
    ts_2D_cube_proj_slider2.set_value(0.5);
}

function ts_2d_proj2_trap(){
    ts_2D_cube_proj_drawer2.set_progress(0.7);
    ts_2D_cube_proj_slider2.set_value(0.7);
}

function ts_2d_proj2_line(){
    ts_2D_cube_proj_drawer2.set_progress(0.779);
    ts_2D_cube_proj_slider2.set_value(0.779);
}

function ts_2d_proj2_outside(){
    ts_2D_cube_proj_drawer2.set_progress(1.0);
    ts_2D_cube_proj_slider2.set_value(1.0);
}

function ts_2d_proj2_trap2(){
    ts_2D_cube_proj_drawer2.set_progress(0.85);
    ts_2D_cube_proj_slider2.set_value(0.85);
}


function ts_rotated_4D_cube_slice() {
    ts_3D_cube_slice_drawer.set_x(0.4);
    ts_3D_cube_slice_drawer.set_y(0.3);
    ts_3D_cube_slice_drawer.set_z(0.7);
    ts_3D_cube_slice_sliders[1].set_value(0.4);
    ts_3D_cube_slice_sliders[2].set_value(0.3);
    ts_3D_cube_slice_sliders[3].set_value(0.7);
}

function ts_simple_rotated_4D_cube_slice() {
    ts_3D_cube_slice_drawer.set_x(0.3);
    ts_3D_cube_slice_drawer.set_y(0.5);
    ts_3D_cube_slice_drawer.set_z(0.5);
    ts_3D_cube_slice_sliders[1].set_value(0.3);
    ts_3D_cube_slice_sliders[2].set_value(0.5);
    ts_3D_cube_slice_sliders[3].set_value(0.5);
}

function ts_straight_4D_cube_slice() {
    ts_3D_cube_slice_drawer.set_x(0.5);
    ts_3D_cube_slice_drawer.set_y(0.5);
    ts_3D_cube_slice_drawer.set_z(0.5);
    ts_3D_cube_slice_sliders[1].set_value(0.5);
    ts_3D_cube_slice_sliders[2].set_value(0.5);
    ts_3D_cube_slice_sliders[3].set_value(0.5);
}
