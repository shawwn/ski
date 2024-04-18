/// <reference path="./base.js" />
"use strict";

let chaikin_cubic;
let control_points;
let linear_segment;
let linear_segment_weight_plot;
let linear_patch;
let linear_patch_symmetry;
let linear_patch_quad_curve;
let quad_curve_plot;
let quad_curve_plot2;
let cubic_spline;
let cubic_curve_curvature;
let two_cubic_patches_mirror;
let two_cubic_patches_side;
let two_cubic_patches_lambert;
let chaikin;
let bspline_creation;
let septic_fit;
let two_cubic_patches_normals;
let cubic_patch_curvature_circle_principal;

(function () {

    let red_style = "#E92525";
    let base_style = "#E92525"

    let blue_color = rgba255_sq_color(101, 168, 223, 1);
    let red_color = rgba255_sq_color(241, 54, 35, 1);
    let green_color = rgba255_sq_color(95, 203, 39, 1);
    let yellow_color = rgba255_sq_color(255, 200, 40, 1);
    let purple_color = rgba255_sq_color(152, 95, 222, 1);

    let black_color = rgba255_sq_color(0, 0, 0, 1);
    let gray_color = rgba255_sq_color(220, 220, 220, 1);
    let dark_gray_color = rgba255_sq_color(60, 60, 60, 1);

    let line_color = [0, 0, 0, 0.1];
    let base_line_width = 7.0;
    let base_target_size = 6.0;

    let touch_size = matchMedia("(pointer:coarse)").matches;


    let control_points_size = touch_size ? 6 : 4;
    let control_point_clamp = control_points_size + 6;
    let hit_threshold = touch_size ? 20 : 7;

    let scale = window.devicePixelRatio || 1;
    scale = scale > 1.75 ? 2 : 1;

    let all_drawers = [];
    let all_containers = [];

    let plot_scale = 0.535 / 2;

    function VerticalSlider(container_div, callback) {
        var container = document.createElement("div");
        container.style.height = "100%";
        container.style.width = "0";
        container.style.position = "relative";
        container.classList.add("slider_container");

        var left_gutter = document.createElement("div");
        left_gutter.classList.add("slider_left_gutter");

        var right_gutter = document.createElement("div");
        right_gutter.classList.add("slider_right_gutter");

        var knob_container = document.createElement("div");
        knob_container.style.width = "0";
        knob_container.style.height = "0";
        knob_container.style.top = "0"
        knob_container.style.left = "0"
        knob_container.style.position = "absolute";

        var knob = document.createElement("div");
        knob.classList.add("slider_knob");

        knob.onmousedown = mouse_down;
        knob.addEventListener("touchstart", genericTouchHandler(mouse_down), false);

        container_div.appendChild(container);
        container.appendChild(left_gutter);
        container.appendChild(right_gutter);
        container.appendChild(knob_container);
        knob_container.appendChild(knob);

        window.addEventListener("resize", layout, true);

        var percentage = 0.5;

        layout();
        callback(percentage);

        this.set_value = function (p) {
            percentage = p;
            layout();
        }

        this.knob_div = function () {
            return knob;
        }

        function layout() {
            var height = container.getBoundingClientRect().height;

            left_gutter.style.height = height * percentage + "px";
            left_gutter.style.top = height * (1 - percentage) + "px";

            right_gutter.style.height = (height * (1.0 - percentage)) + "px";
            right_gutter.style.top = "0";

            knob_container.style.top = (height * (1 - percentage)) + "px"
        }

        var selection_offset;

        var move_handler = genericTouchHandler(mouse_move);

        function mouse_down(e) {

            if (window.bc_touch_down_state)
                return false;

            e == e || window.event;
            var knob_rect = knob_container.getBoundingClientRect();
            selection_offset = e.clientY - knob_rect.top - knob_rect.height / 2;

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
            var container_rect = container.getBoundingClientRect();
            var y = e.clientY - selection_offset - container_rect.top;

            var p = Math.max(0, Math.min(1.0, 1 - y / container_rect.height));

            if (percentage != p) {
                percentage = p;
                layout();
                callback(p);
            }

            return true;
        }

        function mouse_up(e) {
            window.removeEventListener("mousemove", mouse_move, false);
            window.removeEventListener("mouseup", mouse_up, false);

            window.removeEventListener("touchmove", move_handler, false);
            window.removeEventListener("touchend", mouse_up, false);
            window.removeEventListener("touchcancel", mouse_up, false);
        }
    }




    function GLDrawer(scale) {


        let canvas = document.createElement("canvas");
        this.canvas = canvas;
        let gl = canvas.getContext('experimental-webgl', { antialias: true });

        gl.getExtension('OES_element_index_uint');
        gl.getExtension('OES_standard_derivatives');

        let ext = gl.getExtension('ANGLE_instanced_arrays');

        var viewport_x = 0;
        var viewport_y = 0;
        var viewport_w = 0;
        var viewport_h = 0;


        const max_patch_instances = 48;
        const max_curve_instances = 16;
        const max_line_instances = 4096;
        const max_point_instances = max_patch_instances * 16;
        const max_quads = 73728;
        const max_glyphs = 16;


        const float_size = 4;

        let patch_vertex_buffers = [];
        let patch_color_buffer = gl.createBuffer();

        gl.bindBuffer(gl.ARRAY_BUFFER, patch_color_buffer);
        gl.bufferData(gl.ARRAY_BUFFER, 4 * float_size * max_patch_instances, gl.DYNAMIC_DRAW);

        for (let i = 0; i < 3; i++) {
            let buffer = gl.createBuffer();

            gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
            gl.bufferData(gl.ARRAY_BUFFER, 16 * float_size * max_patch_instances, gl.DYNAMIC_DRAW);

            patch_vertex_buffers.push(buffer);
        }

        gl.bindBuffer(gl.ARRAY_BUFFER, null);


        let curve_vertex_buffers = [];
        let curve_color_buffer = gl.createBuffer();

        gl.bindBuffer(gl.ARRAY_BUFFER, curve_color_buffer);
        gl.bufferData(gl.ARRAY_BUFFER, 4 * float_size * max_curve_instances, gl.DYNAMIC_DRAW);

        for (let i = 0; i < 3; i++) {
            let buffer = gl.createBuffer();

            gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
            gl.bufferData(gl.ARRAY_BUFFER, 4 * float_size * max_curve_instances, gl.DYNAMIC_DRAW);

            curve_vertex_buffers.push(buffer);
        }

        let lines_vertex_buffer = gl.createBuffer();

        gl.bindBuffer(gl.ARRAY_BUFFER, lines_vertex_buffer);
        gl.bufferData(gl.ARRAY_BUFFER, 3 * 2 * float_size * max_line_instances, gl.DYNAMIC_DRAW);

        let quads_vertex_buffer = gl.createBuffer();

        gl.bindBuffer(gl.ARRAY_BUFFER, quads_vertex_buffer);
        gl.bufferData(gl.ARRAY_BUFFER, 3 * 2 * float_size * max_quads, gl.DYNAMIC_DRAW);


        let control_points_vertex_buffer = gl.createBuffer();

        gl.bindBuffer(gl.ARRAY_BUFFER, control_points_vertex_buffer);
        gl.bufferData(gl.ARRAY_BUFFER, 3 * float_size * max_point_instances, gl.DYNAMIC_DRAW);

        let points_vertex_buffer = gl.createBuffer();
        let points_color_buffer = gl.createBuffer();

        gl.bindBuffer(gl.ARRAY_BUFFER, points_vertex_buffer);
        gl.bufferData(gl.ARRAY_BUFFER, 3 * float_size * max_point_instances, gl.DYNAMIC_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, points_color_buffer);
        gl.bufferData(gl.ARRAY_BUFFER, 4 * float_size * max_point_instances, gl.DYNAMIC_DRAW);

        let glyph_vertex_buffer = gl.createBuffer();

        gl.bindBuffer(gl.ARRAY_BUFFER, glyph_vertex_buffer);
        gl.bufferData(gl.ARRAY_BUFFER, 6 * 5 * float_size * max_glyphs, gl.DYNAMIC_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, null);


        let texture = gl.createTexture();

        gl.bindTexture(gl.TEXTURE_2D, texture);

        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);


        var pixel = new Uint8Array([0, 0, 0, 0]);

        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA,
            1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
            pixel);

        let glyphs = ["A", "B", "C", "D", "P", "P0", "P1"];
        for (let i = 1; i <= 4; i++) {
            for (let j = 1; j <= 4; j++) {
                glyphs.push("P" + i.toString() + j.toString())
            }
        }

        let glyph_tex_size = 32 * scale;

        document.fonts.load("500 10px IBM Plex Sans").then(function () {

            let canvas = document.createElement("canvas");
            canvas.height = glyph_tex_size;
            canvas.width = glyph_tex_size * glyphs.length;

            let ctx = canvas.getContext("2d");

            // ctx.fillStyle = "red";
            // ctx.fillRect(0, 0, glyph_tex_size * glyphs.length, glyph_tex_size);

            ctx.textAlign = "center";
            ctx.font = "500 " + Math.floor(glyph_tex_size * 0.8) + "px IBM Plex Sans";
            ctx.fillStyle = "#333";

            glyphs.forEach((str, i) => {
                ctx.fillText(str.substring(0, 1), (i + 0.6 - 0.1 * str.length) * glyph_tex_size, glyph_tex_size * 0.8);
            });

            ctx.font = "500 " + Math.floor(glyph_tex_size * 0.45) + "px IBM Plex Sans";
            ctx.textAlign = "left";

            glyphs.forEach((str, i) => {
                ctx.fillText(str.substring(1), (i + 0.7 - 0.1 * str.length) * glyph_tex_size, glyph_tex_size * 0.95);
            });


            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas);

        });



        let basic_vertex_buffer = gl.createBuffer();
        let basic_index_buffer = gl.createBuffer();

        let plane_index_offset = 0;
        let plane_index_count = 0;

        let curve_index_offset = 0;
        let curve_index_count = 0;

        let line_index_offset = 0;
        let line_index_count = 0;

        let point_index_offset = 0;
        let point_index_count = 0;

        let arrow_index_offset = 0;
        let arrow_index_count = 0;

        let triangle_vertex_offset = 0;

        let quad_index_offset = 0;
        let quad_index_count = 0;


        function gen_basic_geometry() {

            let vertices = [];
            let indices = [];


            plane_index_offset = indices.length;

            {
                // 2d

                let n = 64;

                let off = vertices.length / 2;

                for (let j = 0; j <= n; j++) {

                    let s = j / n;

                    for (let i = 0; i <= n; i++) {

                        let t = i / n;

                        vertices.push(s);
                        vertices.push(t);
                    }
                }

                for (let i = 0; i < n; i++) {
                    for (let j = 0; j < n; j++) {

                        indices.push(off + j * (n + 1) + i);
                        indices.push(off + j * (n + 1) + i + n + 2);
                        indices.push(off + j * (n + 1) + i + 1);


                        indices.push(off + j * (n + 1) + i);
                        indices.push(off + j * (n + 1) + i + n + 1);
                        indices.push(off + j * (n + 1) + i + n + 2);
                    }
                }
            }

            plane_index_count = indices.length - plane_index_offset;


            curve_index_offset = indices.length;

            {
                // 2d

                let n = 16;
                let m = 64 + 2;

                let off = vertices.length / 2;

                for (let j = 0; j <= n; j++) {

                    let s = j / n;

                    for (let i = 0; i <= m; i++) {

                        let t = (i - 1) / (m - 2);

                        vertices.push(s);
                        vertices.push(t);
                    }
                }

                for (let i = 0; i < m; i++) {
                    for (let j = 0; j < n; j++) {

                        indices.push(off + j * (m + 1) + i);
                        indices.push(off + j * (m + 1) + i + m + 2);
                        indices.push(off + j * (m + 1) + i + 1);


                        indices.push(off + j * (m + 1) + i);
                        indices.push(off + j * (m + 1) + i + m + 1);
                        indices.push(off + j * (m + 1) + i + m + 2);
                    }
                }
            }

            curve_index_count = indices.length - curve_index_offset;



            line_index_offset = indices.length;

            {
                let off = vertices.length / 2;

                vertices.push(0);
                vertices.push(-1);

                vertices.push(0);
                vertices.push(1);

                vertices.push(1);
                vertices.push(-1);

                vertices.push(1);
                vertices.push(1);

                indices.push(off + 0);
                indices.push(off + 1);
                indices.push(off + 2);
                indices.push(off + 1);
                indices.push(off + 2);
                indices.push(off + 3);
            }

            line_index_count = indices.length - line_index_offset;


            point_index_offset = indices.length;

            {
                // 2d

                let n = 16;
                let m = 16;

                let off = vertices.length / 2;

                for (let j = 0; j <= n; j++) {

                    let s = j / n;

                    for (let i = 0; i <= m; i++) {

                        let t = i / m;

                        vertices.push(s);
                        vertices.push(t);
                    }
                }

                for (let i = 0; i < m; i++) {
                    for (let j = 0; j < n; j++) {

                        indices.push(off + j * (m + 1) + i);
                        indices.push(off + j * (m + 1) + i + m + 2);
                        indices.push(off + j * (m + 1) + i + 1);


                        indices.push(off + j * (m + 1) + i);
                        indices.push(off + j * (m + 1) + i + m + 1);
                        indices.push(off + j * (m + 1) + i + m + 2);
                    }
                }
            }

            point_index_count = indices.length - point_index_offset;

            triangle_vertex_offset = vertices.length / 2;
            vertices.push(-1);
            vertices.push(-1);
            vertices.push(3);
            vertices.push(-1);
            vertices.push(-1);
            vertices.push(3);


            arrow_index_offset = indices.length;

            {
                // arrow
                let n = 40;
                let m = 8;

                while (vertices.length % 6 != 0)
                    vertices.push(NaN);

                let off = vertices.length / 6;
                let ll = 15;
                let h = 5;

                for (let j = 0; j <= n; j++) {

                    let t = j / n;

                    let x = Math.cos(t * Math.PI * 2);
                    let y = Math.sin(t * Math.PI * 2);

                    for (let i = 0; i <= m; i++) {

                        let r = 0.8;
                        let nz = 0;
                        let nx = x;
                        let ny = y;
                        let z = 0;

                        if (i == 0) {
                            r = 0;
                            nz = -1;
                            nx = ny = 0;
                        } else if (i == 1) {
                            nz = -1;
                            nx = ny = 0;
                        } else if (i == 3) {
                            z = ll;
                        } else if (i == 4) {
                            z = ll;
                            nz = -1;
                            nx = ny = 0;
                        } else if (i == 5) {
                            r = 2;
                            z = ll;
                            nz = -1;
                            nx = ny = 0;
                        } else if (i == 6) {
                            r = 2;
                            z = ll;
                            nz = 0.5;
                        } else if (i == 7) {
                            r = 0.01;
                            z = ll + h;
                            nz = 0.5;
                        } else if (i == 8) {
                            r = 0;
                            z = ll + h;
                            nz = 0.5;
                        }


                        vertices.push(x * r);
                        vertices.push(y * r);
                        vertices.push(z);

                        let v = [nx, ny, nz];
                        v = vec_norm(v);

                        vertices.push(v[0]);
                        vertices.push(v[1]);
                        vertices.push(v[2]);
                    }
                }

                for (let i = 0; i < m; i++) {
                    for (let j = 0; j < n; j++) {

                        indices.push(off + j * (m + 1) + i);
                        indices.push(off + j * (m + 1) + i + m + 2);
                        indices.push(off + j * (m + 1) + i + 1);


                        indices.push(off + j * (m + 1) + i);
                        indices.push(off + j * (m + 1) + i + m + 1);
                        indices.push(off + j * (m + 1) + i + m + 2);
                    }
                }
            }

            arrow_index_count = indices.length - arrow_index_offset;



            quad_index_offset = indices.length;


            {


                for (let i = 0; i < max_quads; i++) {

                    indices.push(i * 4 + 0);
                    indices.push(i * 4 + 1);
                    indices.push(i * 4 + 2);
                    indices.push(i * 4 + 0);
                    indices.push(i * 4 + 2);
                    indices.push(i * 4 + 3);
                }
            }



            gl.bindBuffer(gl.ARRAY_BUFFER, basic_vertex_buffer);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
            gl.bindBuffer(gl.ARRAY_BUFFER, null);


            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, basic_index_buffer);
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(indices), gl.STATIC_DRAW);
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
        }

        gen_basic_geometry();



        let bezier_patch_vert_src =
            `
        attribute vec2 v_st;
        attribute mat4 m_x;
        attribute mat4 m_y;
        attribute mat4 m_z;
        attribute vec4 v_color;

        uniform mat4 m_mvp;
        uniform mat3 m_rot;

        

        
        varying vec3 n_dir;
        varying vec3 base_n_dir;
        varying vec3 base_pos;
        varying vec2 st;
        varying vec4 color;

        float b(vec4 v, float t, float nt) {
            float s = 0.0;
            s += v.x*nt*nt*nt;
            s += v.y*3.0*t*nt*nt;
            s += v.z*3.0*t*t*nt;
            s += v.w*t*t*t;
            return s;
        }

        float f(mat4 m, float s, float ns, float t, float nt) {
            vec4 v = vec4(b(m[0],s,ns), b(m[1],s,ns), b(m[2],s,ns), b(m[3],s,ns));
            return b(v, t, nt);
        }

        float dfdt(mat4 m, float s, float ns, float t, float nt) {
            vec4 v = vec4(b(m[0],s,ns), b(m[1],s,ns), b(m[2],s,ns), b(m[3],s,ns));
            
            return -3.0 * nt * nt * v.x + 
                   (3.0 * nt * nt - 6.0 * t * nt) * v.y + 
                   (6.0 * t * nt - 3.0 * t * t) * v.z + 
                   (3.0 * t * t) * v.w;
        }

        float dfds(mat4 m, float s, float ns, float t, float nt) {
            vec4 v = vec4(b(vec4(m[0][0], m[1][0], m[2][0], m[3][0]),t,nt), 
                          b(vec4(m[0][1], m[1][1], m[2][1], m[3][1]),t,nt),
                          b(vec4(m[0][2], m[1][2], m[2][2], m[3][2]),t,nt),
                          b(vec4(m[0][3], m[1][3], m[2][3], m[3][3]),t,nt));
            
            return -3.0 * ns * ns * v.x + 
                   (3.0 * ns * ns - 6.0 * s * ns) * v.y + 
                   (6.0 * s * ns - 3.0 * s * s) * v.z + 
                   (3.0 * s * s) * v.w;
        }

        void main(void) {
            float s = v_st.x;
            float ns = 1.0 - s;
            float t = v_st.y;
            float nt = 1.0 - t;

            st = vec2(s,t);

            vec3 pos = vec3(f(m_x, s, ns, t, nt), f(m_y, s, ns, t, nt), f(m_z, s, ns, t, nt));

            vec3 ds = vec3(dfds(m_x, s, ns, t, nt),
                           dfds(m_y, s, ns, t, nt),
                           dfds(m_z, s, ns, t, nt));


            vec3 dt = vec3(dfdt(m_x, s, ns, t, nt), 
                           dfdt(m_y, s, ns, t, nt),
                           dfdt(m_z, s, ns, t, nt));

            color = v_color;
            base_n_dir = normalize(cross(ds,dt));
            base_pos = pos;
            n_dir = m_rot*(base_n_dir);
            gl_Position = m_mvp * vec4(pos, 1.0);
        }
        `;


        let bezier_curve_vert_src =
            `
        attribute vec2 v_st;
        attribute vec4 v_x;
        attribute vec4 v_y;
        attribute vec4 v_z;
        attribute vec4 v_color;

        uniform mat4 m_mvp;
        uniform mat3 m_rot;

        
        uniform float radius;

        varying vec3 n_dir;
        varying vec2 st;
        varying vec4 color;
        
        float b(vec4 v, float t, float nt) {
            float s = 0.0;
            s += v.x*nt*nt*nt;
            s += v.y*3.0*t*nt*nt;
            s += v.z*3.0*t*t*nt;
            s += v.w*t*t*t;
            return s;
        }

        float dbdt(vec4 v, float t, float nt) {
            return 3.0*(v.y - v.x)*nt*nt +
                   6.0*(v.z - v.y)*nt*t + 
                   3.0*(v.w - v.z)*t*t; 
        }

  
        void main(void) {

            float t = v_st.y;
            float t_clamp = max(0.0, min (1.0, t));
            float rr = t != t_clamp ? 0.0 : radius;
            t = t_clamp;
            float nt = 1.0 - t;

            vec3 pos = vec3(b(v_x, t, nt), b(v_y, t, nt), b(v_z, t, nt));
            vec3 tan = vec3(dbdt(v_x, t, nt), dbdt(v_y, t, nt), dbdt(v_z, t, nt));
            
            tan = normalize(tan);
            
            vec3 l12 = vec3(v_x.z - v_x.y, v_y.z - v_y.y, v_z.z - v_z.y);

            vec3 nor0 = cross(vec3(v_x.z - v_x.x + 0.04, v_y.z - v_y.x + 0.02, v_z.z - v_z.x + 0.03),
                              vec3(v_x.y - v_x.x + 0.02, v_y.y - v_y.x + 0.03, v_z.y - v_z.x + 0.01));

            vec3 nor1 = cross(vec3(v_x.w - v_x.y + 0.02, v_y.w - v_y.y + 0.03, v_z.w - v_z.y + 0.04),
                              vec3(v_x.z - v_x.y + 0.03, v_y.z - v_y.y - 0.02, v_z.z - v_z.y + 0.02));

            vec3 nor2 = cross(vec3(v_x.z - v_x.x + 0.01, v_y.z - v_y.x + 0.02, v_z.z - v_z.x + 0.05),
                              vec3(v_x.w - v_x.z + 0.025, v_y.w - v_y.z + 0.03, v_z.w - v_z.z + 0.01));

            vec3 nor = mix(nor0, nor1, t);
            if (dot(l12, l12) < 0.3)
                nor = nor2;

            

            vec3 bnor = normalize(cross(tan, nor));
            nor = normalize(cross(tan, bnor));

            float c = cos(v_st.x * 2.0 * 3.1415926535897);
            float s = sin(v_st.x * 2.0 * 3.1415926535897);

            vec3 n =  c*nor + s*bnor;
            pos += n*rr;
            n_dir = m_rot*n;
            st = v_st;
            color = v_color;

            gl_Position = m_mvp * vec4(pos, 1.0);
        }
        `;


        let line_vert_src =
            `
        attribute vec2 v_st;
        attribute vec3 v_p0;
        attribute vec3 v_p1;

        uniform mat4 m_mvp;
        uniform mat3 m_rot;

        uniform vec2 params;
        
        varying float t;

        void main(void) {
        
            float l = length(v_p1 - v_p0);
            vec4 p0 = m_mvp * vec4(v_p0, 1.0);
            vec4 p1 = m_mvp * vec4(v_p1, 1.0);

            p0 /= p0.w;
            p1 /= p1.w;

            vec2 dir = p1.xy - p0.xy;
            vec2 perp = normalize(vec2(dir.y, -dir.x));
            vec4 pos = mix(p0, p1, v_st.x);

            pos.xy += perp * params.x * v_st.y;
            pos.x *= params.y;
            pos.z -= 0.001;
            t = l * v_st.x;
        
            gl_Position = pos;
        }
        `;

        let point_vert_src =
            `
        attribute vec2 v_st;
        attribute vec3 v_p;
        attribute vec4 v_color;


        uniform mat4 m_mvp;
        uniform mat3 m_rot;

        uniform vec2 params;

        varying vec3 n_dir;
        varying float dist;
        varying vec4 color;

        const float pi = 3.1415926535;

        void main(void) {
        
            float r = params.x;
            float a = v_st.x * 2.0 * pi;
            float b = (v_st.y - 0.5) * pi;
            
            vec4 p = m_mvp * vec4(v_p, 1.0);
            vec2 ss_p0 = p.xy/p.w;

            vec3 n = vec3(cos(a) * cos(b), sin(a) * cos(b), sin(b));
        
            p = m_mvp * vec4(v_p + r*n, 1.0);
            
            vec2 ss_p1 = p.xy/p.w;

            n_dir = m_rot * n;

            dist = length(ss_p1 - ss_p0) * 0.5 * p.w / r;
            color = v_color;

            gl_Position = p;
        }
        `;


        let quad_vert_src =
            `
        attribute vec3 v_p;
        attribute vec3 v_n;

        uniform mat4 m_mvp;
        uniform mat3 m_rot;
        uniform vec4 base_color;

        varying vec3 n_dir;
        varying vec4 color;



        void main(void) {
        
            n_dir = m_rot*v_n;

            color = base_color;
      
            gl_Position = m_mvp * vec4(v_p, 1.0);
        }
        `;

        let glyph_vert_src =
            `
        attribute vec3 v_p;
        attribute vec2 v_st;

        varying vec2 tex_st;

        void main(void) {
        
            tex_st = v_st;
      
            gl_Position = vec4(v_p, 1.0);
        }
        `;

        let glyph_frag_src =
            `
            precision highp float;

            uniform float alpha;
            uniform sampler2D tex;


            varying vec2 tex_st;

            void main(void) {
                vec4 c = texture2D(tex, tex_st) * alpha;

                gl_FragColor = c;
            }
        `;


        let control_point_frag_src =
            `
        precision mediump float;

        uniform float alpha;
        
        varying float dist;
        
        void main(void) {
            gl_FragColor = alpha*mix(vec4(0.4, 0.4, 0.4, 0.4), vec4(0.1, 0.1, 0.1, 0.4), smoothstep(0.9, 1.1, dist));
        }
        `;


        let flat_frag_src =
            `
        precision mediump float;

        uniform vec4 color;

        void main(void) {
            
            gl_FragColor = color;
        }
        `;



        let dash_frag_src =
            `
        precision mediump float;
        
        varying float t;

        uniform vec4 color;
        uniform float dash;

        void main(void) {
            
            float s = mix(1.0, max(0.0, min(1.0, 10.0* sin(t*200.0))), dash);
            gl_FragColor = color * s;
        }
        `;

        let color_frag_src =
            `
        precision mediump float;

        varying vec3 n_dir;
        varying vec4 color;

        uniform float normal_f;

        void main(void) {
            
            vec3 n = normalize(n_dir);
            float f = mix(1.0, max(0.0, abs(n.z)), normal_f);
            vec4 c = color;
            c.rgb *= f;

            float ff =  0.1*pow(abs(n.z), 10.0);
            c.rgb = mix(c.rgb, vec3(1,1,1)*c.a, ff);
        
            c.rgb *= (1.0/c.a);
            c.rgb = sqrt(c.rgb);
            c.rgb *= c.a;
            
            gl_FragColor = c;
        }
        `;

        let clip_color_frag_src =
            `
        precision mediump float;

        varying vec3 n_dir;
        varying vec4 color;
        varying vec3 base_pos;

        uniform float normal_f;
        uniform vec4 plane;

        void main(void) {

            if (dot(base_pos, plane.xyz) > plane.w) {
                discard;
                return;
            }
            
            vec3 n = normalize(n_dir);
            float f = mix(1.0, max(0.0, abs(n.z)), normal_f);
            vec4 c = color;
            c.rgb *= f;

            float ff =  0.1*pow(abs(n.z), 10.0);
            c.rgb = mix(c.rgb, vec3(1,1,1), ff);
        
            c.rgb = sqrt(c.rgb);
            
            gl_FragColor = c;
        }
        `;

        let mirror_frag_src =
            `
        precision highp float;

        varying vec3 n_dir;
        varying vec3 base_n_dir;
        varying vec3 base_pos;
        varying vec4 color;

        uniform vec3 start;
        uniform vec3 tr;

        float quick_sphere(vec3 ray_org, vec3 ray_dir, vec3 pos, float r2) {
            vec3 oc = ray_org - pos;
            float b = dot(oc, ray_dir);
            float c = dot(oc, oc) - r2;
            float h = b*b - c;
            
            if (h<0.0) return -1.0;

            return -b - sqrt(h);
        }

        void main(void) {


            vec3 view_dir = normalize(base_pos - start);
            vec3 ray_dir = reflect(view_dir, normalize(base_n_dir));
            
            vec3 s_pos = tr;
            float s_r = 0.2; 

            vec4 c = vec4(0.9, 0.9, 0.9, 1.0);

            float t = quick_sphere(base_pos, ray_dir, s_pos, s_r*s_r);

            if (t > 0.0) {
                c = vec4(0.95, 0.15, 0.10, 1.0);

                vec3 n = normalize(base_pos + t*ray_dir - s_pos);
                float f = mix(1.0, max(0.0, -dot(n, view_dir)), 0.5);
                // c.g = -n.z;
                c.rgb *= sqrt(f);

                float p = dot(ray_dir, n);
                c *= smoothstep(-0.0, -0.2, p);
            }

            if (gl_FrontFacing) {
                float f = mix(1.0, max(0.0, abs(normalize(n_dir).z)), 0.5);
                c = color;
                c.rgb *= sqrt(f);
            }
            
        
            gl_FragColor = c;
        }
        `;

        let base_vert_src =
            `
        attribute vec3 v_p;
        attribute vec3 v_n;

        uniform mat4 m_mvp;
        uniform mat3 m_rot;
        uniform vec4 base_color;

        varying vec3 n_dir;
        varying vec4 color;

        void main(void) {
            vec3 pos = v_p;
            n_dir = m_rot * v_n;
            color = base_color;
            gl_Position = m_mvp * vec4(pos, 1.0);
        }
        `;

        let sphere_vert_src =
            `
        attribute vec2 v_p;

        varying highp vec2 unit;
        uniform float aspect;

        void main(void) {
            unit = v_p;
            unit.x *= aspect;
            gl_Position = vec4(v_p, 0.0, 1.0);
        }
        `;

        let sphere_frag_src =
            `
        precision highp float;

        varying highp vec2 unit;

        uniform vec3 start;
        uniform vec3 tr;
        uniform mat3 rot;
        
        float quick_sphere(vec3 ray_org, vec3 ray_dir, vec3 pos, float r2) {
            vec3 oc = ray_org - pos;
            float b = dot(oc, ray_dir);
            float c = dot(oc, oc) - r2;
            float h = b*b - c;
            
            if (h<0.0) return -1.0;

            return -b - sqrt(h);
        }
        
        void ray(out vec3 ray_pos, out vec3 ray_dir, vec2 uv)
        {
            float fov_start = 3.0776835372;
            
            vec3 pos = vec3(0.0,0.0,fov_start);

            vec3 dir = normalize(vec3(uv, 0.0) - pos);

            ray_dir = dir * rot;
            ray_pos = start;
        }
 
        void main(void) {

            vec4 c = vec4(0.0);
            float s_r = 0.2; 
            
            
            vec3 ray_org, ray_dir;
            ray(ray_org, ray_dir, unit);

            float t = quick_sphere(ray_org, ray_dir, tr, s_r*s_r);

            if (t > 0.0) {
                c = vec4(0.95, 0.15, 0.10, 1.0);
                vec3 n = normalize(ray_org + t*ray_dir - tr);
                float f = mix(1.0, max(0.0, -dot(n, ray_dir)), 0.5);
                // c.g = -n.z;
                c.rgb *= sqrt(f);
                float p = dot(ray_dir, n);
                c *= smoothstep(-0.0, -0.2, p);
            }
            
            gl_FragColor = c;
        }
        `;


        let grid_frag_src =
            `
            #extension GL_OES_standard_derivatives : enable
            precision mediump float;

            varying vec3 n_dir;
            varying vec2 st;
            varying vec4 color;

            uniform float normal_f;

            const float pi = 3.1415926535;
            void main(void) {
                

                vec3 n = normalize(n_dir);
                float f = mix(1.0, max(0.0, abs(n.z)), normal_f);
                vec4 c = color;

                vec2 s = cos(st * pi * 20.0);
            
                float fs = (1.0 - smoothstep(1.0 - 30.0*fwidth(st.x), 1.0 - 5.0*fwidth(st.x), s.x))*
                           (1.0 - smoothstep(1.0 - 30.0*fwidth(st.y), 1.0 - 5.0*fwidth(st.y), s.y));
                f *= fs * 0.7 + 0.3;

                c.rgb *= f;
    
                float ff =  0.1*pow(abs(n.z), 10.0);
                c.rgb = mix(c.rgb, vec3(1,1,1)*c.a, ff);
            
                c.rgb = sqrt(c.rgb);
       

                gl_FragColor = c;
            }
    `;

        let weight_frag_src =
            `
        precision mediump float;

        varying vec3 n_dir;
        varying vec2 st;
        varying vec4 color;
        varying vec3 base_pos;

        uniform float normal_f;

        void main(void) {
            
            vec3 n = normalize(n_dir);
            float f = mix(1.0, max(0.0, abs(n.z)), normal_f);
            vec4 c = mix(color, vec4(0.89,0.024,0.024,1), base_pos.z*(1.0/1.2) + 0.5);
            c.rgb *= f;

            float ff = 0.1*pow(abs(n.z), 10.0);
            c.rgb = mix(c.rgb, vec3(1,1,1), ff);
        
            c.rgb = sqrt(c.rgb);
            c *= 0.8;
            
        gl_FragColor = c;
        }
    `;


        let trim_color_frag_src =
            `
        precision mediump float;

        varying vec3 n_dir;
        varying vec2 st;
        varying vec4 color;

        uniform vec4 trim;
        uniform float normal_f;

        void main(void) {
            
        
            vec2 c_pos = st - vec2(0.8, 0.6);

            if (st.x > trim.x || st.y > trim.y || dot(c_pos, c_pos) < trim.z)
                discard;
          
                vec3 n = normalize(n_dir);
                float f = mix(1.0, max(0.0, abs(n.z)), normal_f);
                vec4 c = color;
                c.rgb *= f;
    
                float ff =  0.1*pow(abs(n.z), 10.0);
                c.rgb = mix(c.rgb, vec3(1,1,1), ff);
            
                c.rgb = sqrt(c.rgb);
                
            gl_FragColor = c;
        }
    `;

        let bezier_patch_shader = new Shader(gl,
            bezier_patch_vert_src,
            color_frag_src,
            ["v_st", "m_x", "m_y", "m_z", "v_color"],
            ["m_mvp", "m_rot", "normal_f"]);

        let bezier_patch_lines_shader = new Shader(gl,
            bezier_patch_vert_src,
            grid_frag_src,
            ["v_st", "m_x", "m_y", "m_z", "v_color"],
            ["m_mvp", "m_rot", "normal_f"]);

        let bezier_patch_weight_shader = new Shader(gl,
            bezier_patch_vert_src,
            weight_frag_src,
            ["v_st", "m_x", "m_y", "m_z", "v_color"],
            ["m_mvp", "m_rot", "normal_f"]);


        let bezier_patch_mirror_shader = new Shader(gl,
            bezier_patch_vert_src,
            mirror_frag_src,
            ["v_st", "m_x", "m_y", "m_z", "v_color"],
            ["m_mvp", "m_rot", "start", "tr"]);


        let trim_bezier_patch_shader = new Shader(gl,
            bezier_patch_vert_src,
            trim_color_frag_src,
            ["v_st", "m_x", "m_y", "m_z", "v_color"],
            ["m_mvp", "m_rot", "normal_f", "trim"]);

        let clip_bezier_patch_shader = new Shader(gl,
            bezier_patch_vert_src,
            clip_color_frag_src,
            ["v_st", "m_x", "m_y", "m_z", "v_color"],
            ["m_mvp", "m_rot", "normal_f", "plane"]);


        let bezier_curve_shader = new Shader(gl,
            bezier_curve_vert_src,
            color_frag_src,
            ["v_st", "v_x", "v_y", "v_z", "v_color"],
            ["m_mvp", "m_rot", "radius", "normal_f"]);

        let line_shader = new Shader(gl,
            line_vert_src,
            dash_frag_src,
            ["v_st", "v_p0", "v_p1"],
            ["m_mvp", "m_rot", "color", "dash", "params"]);


        let simple_shader = new Shader(gl,
            base_vert_src,
            color_frag_src,
            ["v_p", "v_n"],
            ["m_mvp", "m_rot", "base_color", "normal_f"]);

        let sphere_shader = new Shader(gl,
            sphere_vert_src,
            sphere_frag_src,
            ["v_p"],
            ["aspect", "rot", "tr", "start"]);

        let quad_shader = new Shader(gl,
            quad_vert_src,
            color_frag_src,
            ["v_p", "v_n"],
            ["m_mvp", "m_rot", "base_color", "normal_f"]);


        let control_point_shader = new Shader(gl,
            point_vert_src,
            control_point_frag_src,
            ["v_st", "v_p", "v_color"],
            ["m_mvp", "m_rot", "alpha", "params"]);


        let glyph_shader = new Shader(gl,
            glyph_vert_src,
            glyph_frag_src,
            ["v_st", "v_p"],
            ["alpha", "tex"]);


        let point_shader = new Shader(gl,
            point_vert_src,
            color_frag_src,
            ["v_st", "v_p", "v_color"],
            ["m_mvp", "m_rot", "params", "normal_f"]);





        let prev_width, prev_height;

        this.begin = function (width, height) {

            width *= scale;
            height *= scale;
            if (width != prev_width || height != prev_height) {
                canvas.width = width;
                canvas.height = height;
                prev_width = width;
                prev_height = height;
            }

            gl.viewport(0, 0, width, height);

            gl.disable(gl.BLEND);
            gl.depthMask(true);
            gl.depthFunc(gl.LEQUAL);
            gl.clearColor(0.0, 0.0, 0.0, 0.0);
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

            // gl.enable(gl.CULL_FACE);
            // gl.cullFace(gl.BACK);
            gl.enable(gl.DEPTH_TEST);
            gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

            viewport_x = 0;
            viewport_y = 0;
            viewport_w = Math.round(width);
            viewport_h = Math.round(height);
        }

        this.viewport = function (x, y, w, h) {
            gl.viewport(x * scale, y * scale, w * scale, h * scale);

            viewport_x = Math.round(x * scale);
            viewport_y = Math.round(y * scale);
            viewport_w = Math.round(w * scale);
            viewport_h = Math.round(h * scale);
        }



        this.draw_arrow = function (mvp, rot, color) {

            let shader = simple_shader;
            gl.enable(gl.CULL_FACE);

            gl.useProgram(shader.shader);

            gl.bindBuffer(gl.ARRAY_BUFFER, basic_vertex_buffer);
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, basic_index_buffer);

            gl.enableVertexAttribArray(shader.attributes["v_p"]);
            gl.vertexAttribPointer(shader.attributes["v_p"], 3, gl.FLOAT, false, 24, 0);
            gl.enableVertexAttribArray(shader.attributes["v_n"]);
            gl.vertexAttribPointer(shader.attributes["v_n"], 3, gl.FLOAT, false, 24, 12);

            ext.vertexAttribDivisorANGLE(shader.attributes["v_p"], 0);
            ext.vertexAttribDivisorANGLE(shader.attributes["v_n"], 0);

            gl.uniformMatrix4fv(shader.uniforms["m_mvp"], false, mat4_transpose(mvp));
            gl.uniformMatrix3fv(shader.uniforms["m_rot"], false, mat3_invert(rot));

            gl.uniform4fv(shader.uniforms["base_color"], color);
            gl.uniform1f(shader.uniforms["normal_f"], 0.7);

            gl.drawElements(gl.TRIANGLES, arrow_index_count, gl.UNSIGNED_INT, arrow_index_offset * 4);
            gl.disable(gl.CULL_FACE);

        }


        this.draw_lines = function (mvp, rot, color, points, thickness) {
            if (thickness === undefined)
                thickness = scale;


            if (color[3] < 1) {
                gl.enable(gl.BLEND);
                gl.depthMask(false);

            } else {
                gl.disable(gl.BLEND);
                gl.depthMask(true);

            }

            let shader = line_shader;

            gl.useProgram(shader.shader);

            gl.bindBuffer(gl.ARRAY_BUFFER, lines_vertex_buffer);
            gl.bufferSubData(gl.ARRAY_BUFFER, 0, new Float32Array(flatten(points)));

            let names = ["v_p0", "v_p1"];
            for (let i = 0; i < 2; i++) {

                const location = shader.attributes[names[i]];
                gl.enableVertexAttribArray(location);
                gl.vertexAttribPointer(location, 3, gl.FLOAT, false, 3 * 2 * float_size, 3 * float_size * i);
                ext.vertexAttribDivisorANGLE(location, 1);
            }

            gl.bindBuffer(gl.ARRAY_BUFFER, basic_vertex_buffer);

            gl.enableVertexAttribArray(shader.attributes["v_st"]);
            gl.vertexAttribPointer(shader.attributes["v_st"], 2, gl.FLOAT, false, 2 * float_size, 0);
            ext.vertexAttribDivisorANGLE(shader.attributes["v_st"], 0);

            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, basic_index_buffer);

            gl.uniformMatrix4fv(shader.uniforms["m_mvp"], false, mat4_transpose(mvp));
            gl.uniformMatrix3fv(shader.uniforms["m_rot"], false, mat3_invert(rot));

            gl.uniform4fv(shader.uniforms["color"], color);
            gl.uniform2fv(shader.uniforms["params"], [thickness * 2.0 / viewport_w, viewport_w / viewport_h]);
            gl.uniform1f(shader.uniforms["dash"], 0.0);

            ext.drawElementsInstancedANGLE(gl.TRIANGLES, line_index_count, gl.UNSIGNED_INT, line_index_offset * 4, points.length / 2);
            gl.depthFunc(gl.GEQUAL);

            gl.uniform4fv(shader.uniforms["color"], vec_scale(color, 0.5));
            gl.uniform1f(shader.uniforms["dash"], 1.0);

            ext.drawElementsInstancedANGLE(gl.TRIANGLES, line_index_count, gl.UNSIGNED_INT, line_index_offset * 4, points.length / 2);

            gl.depthFunc(gl.LESS);

            gl.disable(gl.BLEND);
            gl.depthMask(true);
        }

        this.draw_quads = function (mvp, rot, color, points) {

            let shader = quad_shader;

            if (color[3] < 1) {
                gl.enable(gl.BLEND);
                gl.depthMask(false);

            } else {
                gl.disable(gl.BLEND);
                gl.depthMask(true);

            }

            gl.useProgram(shader.shader);

            gl.bindBuffer(gl.ARRAY_BUFFER, quads_vertex_buffer);
            gl.bufferSubData(gl.ARRAY_BUFFER, 0, points);

            gl.enableVertexAttribArray(shader.attributes["v_p"]);
            gl.vertexAttribPointer(shader.attributes["v_p"], 3, gl.FLOAT, false, 6 * float_size, 0);
            ext.vertexAttribDivisorANGLE(shader.attributes["v_p"], 0);

            gl.enableVertexAttribArray(shader.attributes["v_n"]);
            gl.vertexAttribPointer(shader.attributes["v_n"], 3, gl.FLOAT, false, 6 * float_size, 3 * float_size);
            ext.vertexAttribDivisorANGLE(shader.attributes["v_n"], 0);

            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, basic_index_buffer);

            gl.uniformMatrix4fv(shader.uniforms["m_mvp"], false, mat4_transpose(mvp));
            gl.uniformMatrix3fv(shader.uniforms["m_rot"], false, mat3_invert(rot));

            gl.uniform4fv(shader.uniforms["base_color"], color);

            gl.uniform1f(shader.uniforms["normal_f"], 0.5);

            gl.drawElements(gl.TRIANGLES, points.length / 4, gl.UNSIGNED_INT, quad_index_offset * 4);
            // ext.drawElementsInstanced(gl.TRIANGLES, points.length * 6 / 4, gl.UNSIGNED_INT, quad_index_offset * 4, points.length / 4);

        }


        this.draw_glyphs = function (mvp, pos, glyphs_ind) {


            gl.enable(gl.BLEND);
            gl.depthMask(false);


            let world_points = pos.map(p => mat4_mul_vec3(mvp, p));

            let coords = [];

            let ww = 3 * glyph_tex_size / viewport_w;
            let hh = 3 * glyph_tex_size / viewport_h;
            let off = 0.3;
            let zoff = -0.1;
            world_points.forEach((p, i) => {
                coords.push((p[0] - ww) / p[3]);
                coords.push((p[1] - hh + off) / p[3]);
                coords.push((p[2] + zoff) / p[3]);
                coords.push(glyphs_ind[i] / glyphs.length);
                coords.push(1);

                coords.push((p[0] + ww) / p[3]);
                coords.push((p[1] - hh + off) / p[3]);
                coords.push((p[2] + zoff) / p[3]);
                coords.push((glyphs_ind[i] + 1) / glyphs.length);
                coords.push(1);

                coords.push((p[0] + ww) / p[3]);
                coords.push((p[1] + hh + off) / p[3]);
                coords.push((p[2] + zoff) / p[3]);
                coords.push((glyphs_ind[i] + 1) / glyphs.length);
                coords.push(0);

                coords.push((p[0] - ww) / p[3]);
                coords.push((p[1] + hh + off) / p[3]);
                coords.push((p[2] + zoff) / p[3]);
                coords.push(glyphs_ind[i] / glyphs.length);
                coords.push(0);
            })

            let shader = glyph_shader;

            gl.useProgram(shader.shader);

            gl.bindBuffer(gl.ARRAY_BUFFER, glyph_vertex_buffer);
            gl.bufferSubData(gl.ARRAY_BUFFER, 0, new Float32Array(coords));

            gl.enableVertexAttribArray(shader.attributes["v_p"]);
            gl.vertexAttribPointer(shader.attributes["v_p"], 3, gl.FLOAT, false, 5 * float_size, 0);
            ext.vertexAttribDivisorANGLE(shader.attributes["v_p"], 0);


            gl.enableVertexAttribArray(shader.attributes["v_st"]);
            gl.vertexAttribPointer(shader.attributes["v_st"], 2, gl.FLOAT, false, 5 * float_size, 3 * float_size);
            ext.vertexAttribDivisorANGLE(shader.attributes["v_st"], 0);

            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, basic_index_buffer);

            gl.uniform1f(shader.uniforms["alpha"], 1);

            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.uniform1i(shader.uniforms["tex"], 0);

            gl.drawElements(gl.TRIANGLES, pos.length * 6, gl.UNSIGNED_INT, quad_index_offset * 4);

            gl.depthFunc(gl.GEQUAL);

            gl.uniform1f(shader.uniforms["alpha"], 0.2);

            gl.drawElements(gl.TRIANGLES, pos.length * 6, gl.UNSIGNED_INT, quad_index_offset * 4);
            gl.depthFunc(gl.LESS);
        }

        this.draw_control_points = function (mvp, rot, points, radius) {
            if (radius === undefined)
                radius = control_points_size * 0.006;


            gl.enable(gl.BLEND);
            gl.depthMask(false);

            let shader = control_point_shader;

            gl.useProgram(shader.shader);

            {
                gl.bindBuffer(gl.ARRAY_BUFFER, control_points_vertex_buffer);
                gl.bufferSubData(gl.ARRAY_BUFFER, 0, new Float32Array(flatten(points)));


                const location = shader.attributes["v_p"];
                gl.enableVertexAttribArray(location);
                gl.vertexAttribPointer(location, 3, gl.FLOAT, false, 3 * float_size, 0);
                ext.vertexAttribDivisorANGLE(location, 1);
            }

            gl.bindBuffer(gl.ARRAY_BUFFER, basic_vertex_buffer);

            gl.enableVertexAttribArray(shader.attributes["v_st"]);
            gl.vertexAttribPointer(shader.attributes["v_st"], 2, gl.FLOAT, false, 2 * float_size, 0);
            ext.vertexAttribDivisorANGLE(shader.attributes["v_st"], 0);

            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, basic_index_buffer);

            gl.uniformMatrix4fv(shader.uniforms["m_mvp"], false, mat4_transpose(mvp));
            gl.uniformMatrix3fv(shader.uniforms["m_rot"], false, mat3_invert(rot));

            gl.uniform2fv(shader.uniforms["params"], [radius, viewport_w / viewport_h]);
            gl.uniform1f(shader.uniforms["alpha"], 1.0);

            ext.drawElementsInstancedANGLE(gl.TRIANGLES, point_index_count, gl.UNSIGNED_INT, point_index_offset * 4, points.length);
            gl.depthFunc(gl.GEQUAL);

            gl.uniform1f(shader.uniforms["alpha"], 0.2);

            ext.drawElementsInstancedANGLE(gl.TRIANGLES, point_index_count, gl.UNSIGNED_INT, point_index_offset * 4, points.length);

            gl.depthFunc(gl.LESS);
        }

        this.draw_points = function (mvp, rot, colors, points, radius) {
            if (radius === undefined)
                radius = 0.02;




            let shader = point_shader;

            gl.useProgram(shader.shader);

            {
                gl.bindBuffer(gl.ARRAY_BUFFER, points_vertex_buffer);
                gl.bufferSubData(gl.ARRAY_BUFFER, 0, new Float32Array(points));


                const location = shader.attributes["v_p"];
                gl.enableVertexAttribArray(location);
                gl.vertexAttribPointer(location, 3, gl.FLOAT, false, 3 * float_size, 0);
                ext.vertexAttribDivisorANGLE(location, 1);
            }

            {
                gl.bindBuffer(gl.ARRAY_BUFFER, points_color_buffer);
                gl.bufferSubData(gl.ARRAY_BUFFER, 0, new Float32Array(flatten(colors)));

                const location = shader.attributes["v_color"];
                gl.enableVertexAttribArray(location);
                gl.vertexAttribPointer(location, 4, gl.FLOAT, false, 4 * float_size, 0);

                ext.vertexAttribDivisorANGLE(location, 1);
            }

            gl.bindBuffer(gl.ARRAY_BUFFER, basic_vertex_buffer);

            gl.enableVertexAttribArray(shader.attributes["v_st"]);
            gl.vertexAttribPointer(shader.attributes["v_st"], 2, gl.FLOAT, false, 2 * float_size, 0);
            ext.vertexAttribDivisorANGLE(shader.attributes["v_st"], 0);

            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, basic_index_buffer);

            gl.uniformMatrix4fv(shader.uniforms["m_mvp"], false, mat4_transpose(mvp));
            gl.uniformMatrix3fv(shader.uniforms["m_rot"], false, mat3_invert(rot));

            gl.uniform2fv(shader.uniforms["params"], [radius, viewport_w / viewport_h]);
            gl.uniform1f(shader.uniforms["normal_f"], 0.5);

            ext.drawElementsInstancedANGLE(gl.TRIANGLES, point_index_count, gl.UNSIGNED_INT, point_index_offset * 4, points.length / 3);
        }


        this.draw_bezier_curves = function (mvp, rot, colors, points, radius, normal_f) {

            if (!radius)
                radius = 0.015;

            if (!normal_f)
                normal_f = 0.5;

            let shader = bezier_curve_shader;

            gl.useProgram(shader.shader);

            let names = ["v_x", "v_y", "v_z"];
            for (let i = 0; i < 3; i++) {
                let buffer = curve_vertex_buffers[i];
                let coords = new Float32Array(points.map(a => a[i]));

                gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
                gl.bufferSubData(gl.ARRAY_BUFFER, 0, coords);

                const location = shader.attributes[names[i]];
                gl.enableVertexAttribArray(location);
                gl.vertexAttribPointer(location, 4, gl.FLOAT, false, 4 * float_size, 0);

                ext.vertexAttribDivisorANGLE(location, 1);
            }

            {
                gl.bindBuffer(gl.ARRAY_BUFFER, curve_color_buffer);
                gl.bufferSubData(gl.ARRAY_BUFFER, 0, new Float32Array(flatten(colors)));

                const location = shader.attributes["v_color"];
                gl.enableVertexAttribArray(location);
                gl.vertexAttribPointer(location, 4, gl.FLOAT, false, 4 * float_size, 0);

                ext.vertexAttribDivisorANGLE(location, 1);
            }


            gl.bindBuffer(gl.ARRAY_BUFFER, basic_vertex_buffer);

            gl.enableVertexAttribArray(shader.attributes["v_st"]);
            gl.vertexAttribPointer(shader.attributes["v_st"], 2, gl.FLOAT, false, 2 * float_size, 0);
            ext.vertexAttribDivisorANGLE(shader.attributes["v_st"], 0);

            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, basic_index_buffer);

            gl.uniformMatrix4fv(shader.uniforms["m_mvp"], false, mat4_transpose(mvp));
            gl.uniformMatrix3fv(shader.uniforms["m_rot"], false, mat3_invert(rot));
            gl.uniform1f(bezier_curve_shader.uniforms["radius"], radius);

            gl.uniform1f(shader.uniforms["normal_f"], normal_f);

            ext.drawElementsInstancedANGLE(gl.TRIANGLES, curve_index_count, gl.UNSIGNED_INT, curve_index_offset * 4, points.length / 4);
        }



        this.draw_bezier_patches = function (mvp, rot, colors, points, normal_f, lines, weights) {

            let shader = weights ? bezier_patch_weight_shader
                : lines ? bezier_patch_lines_shader
                    : bezier_patch_shader;

            if (!normal_f)
                normal_f = 0.5;

            if (colors.length == 1 && colors[0][3] < 1 || weights) {
                gl.enable(gl.BLEND);
                gl.depthMask(false);

            } else {
                gl.disable(gl.BLEND);
                gl.depthMask(true);

            }

            gl.useProgram(shader.shader);

            let names = ["m_x", "m_y", "m_z"];
            for (let i = 0; i < 3; i++) {
                let buffer = patch_vertex_buffers[i];
                let coords = new Float32Array(points.map(a => a[i]));

                gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
                gl.bufferSubData(gl.ARRAY_BUFFER, 0, coords);

                for (let k = 0; k < 4; k++) {
                    const location = shader.attributes[names[i]] + k;
                    gl.enableVertexAttribArray(location);
                    gl.vertexAttribPointer(location, 4, gl.FLOAT, false, 16 * float_size, k * 4 * float_size);

                    ext.vertexAttribDivisorANGLE(location, 1);
                }
            }

            {
                gl.bindBuffer(gl.ARRAY_BUFFER, patch_color_buffer);
                gl.bufferSubData(gl.ARRAY_BUFFER, 0, new Float32Array(flatten(colors)));

                const location = shader.attributes["v_color"];
                gl.enableVertexAttribArray(location);
                gl.vertexAttribPointer(location, 4, gl.FLOAT, false, 4 * float_size, 0);

                ext.vertexAttribDivisorANGLE(location, 1);
            }


            gl.bindBuffer(gl.ARRAY_BUFFER, basic_vertex_buffer);

            gl.enableVertexAttribArray(shader.attributes["v_st"]);
            gl.vertexAttribPointer(shader.attributes["v_st"], 2, gl.FLOAT, false, 2 * float_size, 0);
            ext.vertexAttribDivisorANGLE(shader.attributes["v_st"], 0);

            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, basic_index_buffer);

            gl.uniformMatrix4fv(shader.uniforms["m_mvp"], false, mat4_transpose(mvp));
            gl.uniformMatrix3fv(shader.uniforms["m_rot"], false, mat3_invert(rot));

            gl.uniform1f(shader.uniforms["normal_f"], normal_f);

            ext.drawElementsInstancedANGLE(gl.TRIANGLES, plane_index_count, gl.UNSIGNED_INT, plane_index_offset * 4, points.length / 16);
            gl.disable(gl.BLEND);
            gl.depthMask(true);
        }

        this.draw_sphere = function (start, translation, rot, rect) {


            gl.enable(gl.BLEND);
            gl.depthMask(false);


            let shader = sphere_shader;
            gl.useProgram(shader.shader);

            gl.bindBuffer(gl.ARRAY_BUFFER, basic_vertex_buffer);

            gl.enableVertexAttribArray(shader.attributes["v_p"]);
            gl.vertexAttribPointer(shader.attributes["v_p"], 2, gl.FLOAT, false, 2 * float_size, 0);
            ext.vertexAttribDivisorANGLE(shader.attributes["v_p"], 0);

            gl.uniform1f(shader.uniforms["aspect"], canvas.width / canvas.height);
            gl.uniform3fv(shader.uniforms["start"], start);
            gl.uniformMatrix3fv(shader.uniforms["rot"], false, mat3_transpose(rot));
            gl.uniform3fv(shader.uniforms["tr"], translation);

            gl.enable(gl.SCISSOR_TEST);

            gl.scissor(rect[0], rect[1], rect[2], rect[3]);

            gl.drawArrays(gl.TRIANGLES, 0, 3);

            gl.drawArrays(gl.TRIANGLES, triangle_vertex_offset, 3);

            gl.disable(gl.SCISSOR_TEST);

            gl.disable(gl.BLEND);
            gl.depthMask(true);
        }

        this.draw_mirror_bezier_patches = function (mvp, rot, points, colors, start, translation) {

            let shader = bezier_patch_mirror_shader;

            gl.useProgram(shader.shader);

            let names = ["m_x", "m_y", "m_z"];
            for (let i = 0; i < 3; i++) {
                let buffer = patch_vertex_buffers[i];
                let coords = new Float32Array(points.map(a => a[i]));

                gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
                gl.bufferSubData(gl.ARRAY_BUFFER, 0, coords);

                for (let k = 0; k < 4; k++) {
                    const location = shader.attributes[names[i]] + k;
                    gl.enableVertexAttribArray(location);
                    gl.vertexAttribPointer(location, 4, gl.FLOAT, false, 16 * float_size, k * 4 * float_size);

                    ext.vertexAttribDivisorANGLE(location, 1);
                }
            }


            {
                gl.bindBuffer(gl.ARRAY_BUFFER, patch_color_buffer);
                gl.bufferSubData(gl.ARRAY_BUFFER, 0, new Float32Array(flatten(colors)));

                const location = shader.attributes["v_color"];
                gl.enableVertexAttribArray(location);
                gl.vertexAttribPointer(location, 4, gl.FLOAT, false, 4 * float_size, 0);

                ext.vertexAttribDivisorANGLE(location, 1);
            }


            gl.bindBuffer(gl.ARRAY_BUFFER, basic_vertex_buffer);

            gl.enableVertexAttribArray(shader.attributes["v_st"]);
            gl.vertexAttribPointer(shader.attributes["v_st"], 2, gl.FLOAT, false, 2 * float_size, 0);
            ext.vertexAttribDivisorANGLE(shader.attributes["v_st"], 0);

            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, basic_index_buffer);

            gl.uniformMatrix4fv(shader.uniforms["m_mvp"], false, mat4_transpose(mvp));
            gl.uniformMatrix3fv(shader.uniforms["m_rot"], false, mat3_invert(rot));

            gl.uniform3fv(shader.uniforms["start"], start);
            gl.uniform3fv(shader.uniforms["tr"], translation);


            ext.drawElementsInstancedANGLE(gl.TRIANGLES, plane_index_count, gl.UNSIGNED_INT, plane_index_offset * 4, points.length / 16);

        }



        this.draw_trim_bezier_patch = function (mvp, rot, colors, points, trim, clip, normal_f) {


            if (!normal_f)
                normal_f = 0.5;

            let shader = clip ? clip_bezier_patch_shader : trim_bezier_patch_shader;

            gl.useProgram(shader.shader);

            let names = ["m_x", "m_y", "m_z"];
            for (let i = 0; i < 3; i++) {
                let buffer = patch_vertex_buffers[i];
                let coords = new Float32Array(points.map(a => a[i]));

                gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
                gl.bufferSubData(gl.ARRAY_BUFFER, 0, coords);

                for (let k = 0; k < 4; k++) {
                    const location = shader.attributes[names[i]] + k;
                    gl.enableVertexAttribArray(location);
                    gl.vertexAttribPointer(location, 4, gl.FLOAT, false, 16 * float_size, k * 4 * float_size);

                    ext.vertexAttribDivisorANGLE(location, 1);
                }
            }

            {
                gl.bindBuffer(gl.ARRAY_BUFFER, patch_color_buffer);
                gl.bufferSubData(gl.ARRAY_BUFFER, 0, new Float32Array(flatten(colors)));

                const location = shader.attributes["v_color"];
                gl.enableVertexAttribArray(location);
                gl.vertexAttribPointer(location, 4, gl.FLOAT, false, 4 * float_size, 0);

                ext.vertexAttribDivisorANGLE(location, 1);
            }


            gl.bindBuffer(gl.ARRAY_BUFFER, basic_vertex_buffer);

            gl.enableVertexAttribArray(shader.attributes["v_st"]);
            gl.vertexAttribPointer(shader.attributes["v_st"], 2, gl.FLOAT, false, 2 * float_size, 0);
            ext.vertexAttribDivisorANGLE(shader.attributes["v_st"], 0);

            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, basic_index_buffer);

            gl.uniformMatrix4fv(shader.uniforms["m_mvp"], false, mat4_transpose(mvp));
            gl.uniformMatrix3fv(shader.uniforms["m_rot"], false, mat3_invert(rot));

            if (clip)
                gl.uniform4fv(shader.uniforms["plane"], trim);
            else
                gl.uniform4fv(shader.uniforms["trim"], trim);

            gl.uniform1f(shader.uniforms["normal_f"], normal_f);

            gl.depthFunc(gl.LEQUAL);


            ext.drawElementsInstancedANGLE(gl.TRIANGLES, plane_index_count, gl.UNSIGNED_INT, plane_index_offset * 4, points.length / 16);

            gl.depthFunc(gl.LESS);

        }

        this.finish = function () {
            gl.flush();
            return gl.canvas;
        }
    }


    let gl = new GLDrawer(scale);

    function Drawer(container, mode) {
        let self = this;

        all_drawers.push(self);
        all_containers.push(container);
        container.drawer = this;

        let no_arcball = mode === "high_deg_bezier" ||
            mode === "train_force0" ||
            mode === "quad_curve_interpolation" ||
            mode === "cubic_curve_interpolation" ||
            mode === "septic_fit" ||
            mode === "septic_zoom" ||
            mode === "cubic_fit" ||
            mode === "tangent" ||
            mode === "linear_segment" ||
            mode === "linear_segment_coords" ||
            mode === "point_coords" ||
            mode === "linear_weight_color" ||
            mode === "linear_segment_weight_plot" ||
            mode === "quad_curve" ||
            mode === "quad_curve_plot" ||
            mode === "quad_curve_plot2" ||
            mode === "cubic_curve_plot" ||
            mode === "septic_curve_plot" ||
            mode === "septic_curve_plot2" ||
            mode === "spline_triangle_plot" ||
            mode === "spline_funky_plot" ||
            mode === "spline_funky_plot2" ||
            mode === "spline_cubic_plot" ||
            mode === "spline_cubic_knots_plot" ||
            mode === "spline_cubic_knots_plot2" ||
            mode === "spline_cubic_weight_plot" ||
            mode === "control_points" ||
            mode === "control_points2" ||
            mode === "curve_hero" ||
            mode === "spline_cubic_loop_plot" ||
            mode === "spline_quadratic_plot" ||
            mode === "paper" ||
            mode === "chaikin" ||
            mode === "chaikin_cubic" ||
            mode === "chaikin_quadratic_bspline" ||
            mode === "chaikin_cubic_bspline" ||
            mode === "curve_subdiv_topo" ||
            mode === "cubic_spline" ||
            mode === "cubic_spline1" ||
            mode === "cubic_spline2" ||
            mode === "cubic_patch_mirror_normals" ||
            mode === "cubic_curve_circle" ||
            mode === "cubic_curve_curvature" ||
            mode === "cubic_curve_comb" ||
            mode === "two_cubic_patches_side" ||
            mode === "continuities" ||
            mode === "spiral";

        let track_clicks = mode === "linear_weight_color" ||
            mode === "linear_segment_weight_plot" ||
            mode === "quad_curve_plot" ||
            mode === "cubic_curve_plot" ||
            mode === "septic_curve_plot" ||
            mode === "septic_curve_plot2" ||
            mode === "spline_triangle_plot" ||
            mode === "spline_funky_plot" ||
            mode === "spline_funky_plot2" ||
            mode === "spline_cubic_plot" ||
            mode === "spline_cubic_knots_plot" ||
            mode === "spline_cubic_knots_plot2" ||
            mode === "spline_cubic_weight_plot" ||
            mode === "control_points2" ||
            mode === "spline_cubic_loop_plot" ||
            mode === "spline_quadratic_plot";

        let track_drags = mode !== "surface" &&
            mode !== "two_cubic_patches_mirror" &&
            mode !== "two_cubic_patches_lambert" &&
            mode !== "subdiv2" &&
            //   mode !== "continuities" &&
            mode !== "cubic_patch_mirror";

        let has_undo = true;

        let wrapper = document.createElement("div");
        wrapper.classList.add("canvas_container");
        wrapper.classList.add("non_selectable");

        let canvas = document.createElement("canvas");
        canvas.classList.add("non_selectable");
        canvas.style.position = "absolute";
        canvas.style.top = "0";
        canvas.style.left = "0";

        let plot_pad = 10;


        let points_history = [];
        let points = [];
        let ss_points = [];
        let faces = [];

        let selected_point = undefined;
        let is_dragging = false;

        var undo = undefined;

        wrapper.appendChild(canvas);
        container.appendChild(wrapper);


        if (has_undo) {
            undo = document.createElement("div");
            undo.classList.add("undo_button");

            undo.style.visibility = "hidden";

            if (mode === "cubic_patch_curvature_cut" || mode === "cubic_patch_curvature_circle" ||
                mode === "cubic_patch_curvature_circle_principal" ||
                mode === "surface_normal" ||
                mode === "surface_tangent_plane" ||
                mode === "cubic_patch2" || mode === "nurbs_hole" ||
                mode === "linear_patch_point2" || mode === "linear_patch_point3" || mode === "linear_patch_quad_curve") {
                undo.classList.add("undo_button_offset");
            }

            if (mode === "linear_segment_weight_plot") {
                undo.classList.add("undo_button_offset2");
            }

            wrapper.appendChild(undo);

            undo.onclick = function () {
                if (points_history.length > 0) {
                    points = points_history.pop();
                    recalc_ss_points();
                    if (points_history.length == 0)
                        undo.style.visibility = "hidden";
                    request_repaint();
                }
            }
        }


        this.requested_repaint = false;

        let load_text = mode === "linear_segment" ||
            mode === "linear_weight_color" ||
            mode === "linear_segment_weight_plot" ||
            mode === "point_coords" ||
            mode === "linear_segment_coords" ||
            mode === "square" ||
            mode === "linear_patch_hats" ||
            mode === "quad_curve" ||
            mode === "quad_curve_plot" ||
            mode === "quad_curve_interpolation" ||
            mode === "cubic_curve_interpolation" ||
            mode === "cubic_curve_plot" ||
            mode === "linear_patch_hats2" ||
            mode === "cubic_curve_curvature_sl0" ||
            mode === "bspline_creation" ||
            mode === "bspline_creation2" ||
            mode === "spline_cubic_weight_plot" ||
            mode === "chaikin" ||
            mode === "chaikin_quadratic_bspline" ||
            mode === "chaikin_cubic" ||
            mode === "chaikin_cubic_bspline" ||
            mode === "curve_subdiv_topo" ||
            mode === "subdiv_base_patch" ||
            mode === "subdiv_base_patch2" ||
            mode === "subdiv0" ||
            mode === "subdiv1" ||
            mode === "subdiv_hero2";

        let width, height;

        let rot = mat3_mul(rot_x_mat3(-0.4), rot_z_mat3(-0.8));

        if (no_arcball)
            rot = ident_mat3;

        if (mode === "subdiv_hero" || mode === "subdiv_hero2")
            rot = [0.9514378920360758, -0.271362715116709, -0.145355476135019, -0.1503236287157877, 0.0025048441888733453, -0.9886336694677701, 0.2686424096222863, 0.9624738971006312, -0.038409024359571574];
        else if (mode === "surface")
            rot = [-0.6384586341160697, 0.7688786997761395, -0.03458493245904158, -0.2654899987587386, -0.1778339219476058, 0.9475706605651237, 0.7224165232618445, 0.6141666233484853, 0.31766920795535897];
        else if (mode === "linear_patch_hats" || mode === "linear_patch_hats2")
            rot = [0.5725915411523231, 0.814910481162902, 0.08977658208939039, -0.3974336424741792, 0.18012794416970923, 0.8997779857047529, 0.7170672401041004, -0.5508854975582865, 0.4270125779756905];
        else if (mode === "linear_patch_point2" || mode === "linear_patch_point3")
            rot = [0.23741977718131207, 0.9674258214695874, -0.08785857588801207, 0.3886477064121905, -0.1774897748632806, -0.9041296036075394, -0.8902723233391677, 0.18051221502401257, -0.4181274094380857];
        else if (mode === "linear_patch_symmetry")
            rot = [0.8301464925265045, 0.3342022636113907, 0.44627978661705076, -0.10272125067290455, 0.8784123351523686, -0.46673345081787, -0.5480010452600702, 0.34161471930990667, 0.7635405935146322];
        else if (mode === "linear_patch_quad_curve")
            rot = [0.9767463716649345, 0.2117766199721429, -0.033424372433312345, -0.1739927858252973, 0.8740685991095247, 0.45357534603576555, 0.12527184807505057, -0.4372124738429669, 0.8905909368480981];
        else if (mode === "linear_patch_quad_curve_flat")
            rot = [0.6126746571118376, 0.5455232463694129, -0.5718689991628032, 0.2734663762948137, 0.5325551396370745, 0.8010001025482575, 0.7415159509876195, -0.6471394060916936, 0.17710077220106563];
        else if (mode === "cubic_bezier_3d")
            rot = [0.8951155547937825, 0.2548679471380373, -0.36580113871864417, -0.1896943022671266, 0.9602353635201042, 0.20485145430970553, 0.4034652590417241, -0.11397533139699874, 0.9078686075525134];
        else if (mode === "cubic_linear_patch")
            rot = [0.5891991755064858, 0.801005364960255, -0.10599404175411725, -0.2690559227509994, 0.31820080497131686, 0.9090418902054053, 0.7618748204364633, -0.5070884074996137, 0.4029988895324826];
        else if (mode === "two_cubic_patches_normals")
            rot = mat3_mul(rot_x_mat3(2.2), rot_z_mat3(0.8));
        else if (mode === "cubic_patch_mirror")
            rot = mat3_mul(rot_x_mat3(1.9), rot_z_mat3(1.2));
        else if (mode === "two_cubic_patches_mirror" || mode === "two_cubic_patches_lambert")
            rot = [0.905753503409964, -0.4104416256825366, 0.10558533500280129,
                0.2787574176333325, 0.7646324659727656, 0.5810606630075738,
                -0.31922545821875464, -0.49686503588749475, 0.8069821825403243];
        else if (mode === "subdiv2")
            rot = mat3_mul(rot_z_mat3(-0.5), rot_x_mat3(0.8));
        else if (mode === "cubic_patch_curvature_cut" || mode === "cubic_patch_curvature_circle" ||
            mode === "cubic_patch_curvature_circle_principal")
            rot = mat3_mul(rot_x_mat3(-0.8), rot_z_mat3(-0.5));
        else if (mode === "subdiv0")
            rot = mat3_mul(rot_x_mat3(0.5), rot_y_mat3(-0.5));
        else if (mode === "subdiv1")
            rot = mat3_mul(rot_x_mat3(0.0), rot_x_mat3(-0.7));
        else if (mode === "linear_segment_3d")
            rot = mat3_mul(rot_x_mat3(0.0), rot_x_mat3(-0.7));
        else if (mode === "linear_patch" || mode === "linear_patch_point")
            rot = mat3_mul(rot_x_mat3(-1.2), mat3_mul(rot_z_mat3(0.6), rot_x_mat3(-2.9)));
        else if (mode === "linear_patch_point4")
            rot = mat3_mul(rot_x_mat3(-0.2), rot_z_mat3(0.5));

        let arcball = new ArcBall(rot, function () {
            rot = arcball.matrix.slice();
            recalc_ss_points();
            request_repaint();
        });

        function canvas_space(e) {
            let r = canvas.getBoundingClientRect();
            return [(e.clientX - r.left), (e.clientY - r.top)];
        }


        function recalc_ss_points() {
            let vp = mat4_mul(proj, mat3_to_mat4(rot));

            ss_points = points.map(a => {
                let p = mat4_mul_vec3(vp, a);
                p = vec_scale(p, 1 / p[3]);
                p[0] = (p[0] + 1) * 0.5 * width;
                p[1] = (-p[1] + 1) * 0.5 * height;
                return p;
            });
        }

        let dragged_point_index = -1;
        let dragged_point_z = 0;
        let dragged_point_delta = 0;

        let clamp = no_arcball;
        let clamp_boundaries = [control_point_clamp, control_point_clamp,
            control_point_clamp, control_point_clamp];
        let drag_filter = undefined;

        if (mode === "linear_segment" || mode === "linear_weight_color" ||
            mode === "linear_segment_weight_plot" || mode === "quad_curve" ||
            mode === "quad_curve_plot" || mode === "quad_curve_interpolation" ||
            mode === "cubic_curve_interpolation" || mode === "cubic_curve_plot") {
            clamp_boundaries[2] = 30;
        }

        if (mode === "point_coords" || mode === "linear_segment_coords") {
            clamp_boundaries[3] = 35;
            clamp_boundaries[2] = 35;
            clamp_boundaries[0] = clamp_boundaries[1] = 45;
        }

        if (mode === "linear_segment" || mode === "chaikin" || mode === "chaikin_quadratic_bspline" ||
            mode === "chaikin_cubic" || mode === "chaikin_cubic_bspline" || mode === "curve_subdiv_topo") {
            clamp_boundaries[3] = control_point_clamp + 30;
        }

        if (mode === "tangent" || mode === "cubic_spline2") {
            clamp_boundaries[0] = clamp_boundaries[1] = clamp_boundaries[2] = clamp_boundaries[3] = 2 * control_point_clamp
        }


        let saved_points = false;
        {

            let start = [0, 0];
            let maybe_click;
            let oob_arcball = false;

            if (track_drags) {
                canvas.addEventListener("mousemove", e => {

                    let p = canvas_space(e);

                    canvas.style.cursor = "default";

                    for (let i = 0; i < ss_points.length; i++) {
                        let pp = ss_points[i];

                        if (vec_len_sq(vec_sub(p, pp)) < hit_threshold * hit_threshold) {
                            canvas.style.cursor = track_clicks ? "pointer" : "move";
                            break;
                        }
                    }
                    return true;
                }, false);
            }

            new TouchHandler(canvas,

                function (e) {

                    let p = canvas_space(e);
                    start = p;
                    maybe_click = true;

                    if (track_drags) {


                        dragged_point_index = -1;
                        saved_points = false;
                        is_dragging = false;

                        for (let i = 0; i < ss_points.length; i++) {
                            let pp = ss_points[i];

                            if (vec_len_sq(vec_sub(p, pp)) < hit_threshold * hit_threshold &&
                                (dragged_point_index == -1 || pp[2] < dragged_point_z)) {
                                dragged_point_index = i;
                                dragged_point_z = pp[2];
                                dragged_point_delta = vec_sub(p, pp);
                            }
                        }
                    }


                    if (dragged_point_index == -1) {
                        if (!no_arcball) {
                            let r = width * 0.5 + 10;
                            if (!touch_size || vec_len_sq(vec_sub(p, [width * 0.5, width * 0.5])) < r * r) {
                                oob_arcball = false;
                                arcball.start(width - p[0], p[1]);
                            }
                            else {
                                oob_arcball = true;
                                return false;
                            }
                        } else {
                            return false;
                        }
                    }

                    return true;
                }
                ,
                function (e) {
                    let p = canvas_space(e);
                    is_dragging = true;

                    if (vec_len_sq(vec_sub(start, p)) > 4)
                        maybe_click = false;

                    if (dragged_point_index != -1) {
                        let pp = vec_sub(p, dragged_point_delta);

                        if (clamp) {
                            pp[0] = Math.max(pp[0], clamp_boundaries[0]);
                            pp[0] = Math.min(pp[0], width - clamp_boundaries[1]);
                            pp[1] = Math.max(pp[1], clamp_boundaries[2]);
                            pp[1] = Math.min(pp[1], height - clamp_boundaries[3]);
                        }
                        pp[0] = pp[0] * 2.0 / width - 1;
                        pp[1] = -pp[1] * 2.0 / height + 1;
                        pp[2] = dragged_point_z;
                        pp[3] = 1;

                        let vp = mat4_mul(proj, mat3_to_mat4(rot));
                        let ivp = mat4_invert(vp);

                        pp = mat4_mul_vec4(ivp, pp);
                        pp = vec_scale(pp, 1 / pp[3]);

                        if (!saved_points) {
                            points_history.push(points.slice());

                            if (undo)
                                undo.style.visibility = "visible";
                            saved_points = true;
                        }

                        let point = [pp[0], pp[1], pp[2]];


                        let org_points = points.slice();
                        points[dragged_point_index] = point;

                        if (drag_filter)
                            drag_filter(points, org_points, dragged_point_index);

                    } else if (!no_arcball && !oob_arcball) {
                        arcball.update(width - p[0], p[1], e.timeStamp);
                        rot = arcball.matrix.slice();
                    }
                    recalc_ss_points();

                    request_repaint();


                    return true;
                }, function (e) {

                    if (arcball)
                        arcball.end(e.timeStamp);

                    if (is_dragging || !track_clicks)
                        return true;

                    let p = canvas_space(e);


                    if (vec_len_sq(vec_sub(start, p)) > 4)
                        maybe_click = false;

                    if (!maybe_click)
                        return true;

                    p = start;

                    let best_i = undefined;

                    for (let i = 0; i < ss_points.length; i++) {
                        let pp = ss_points[i];

                        if (vec_len_sq(vec_sub(p, pp)) < hit_threshold * hit_threshold) {
                            best_i = i;
                        }
                    }

                    if (best_i != selected_point) {
                        selected_point = best_i;
                        request_repaint();
                    }

                    return true;

                });
        }

        function request_repaint() {
            if (!self.requested_repaint) {
                self.requested_repaint = true;
                window.requestAnimationFrame(function () {
                    self.repaint();
                });
            }
        }

        this.set_visible = function(x) {
            this.visible = x;
            if (x && !this.was_drawn)
                request_repaint();
        }


        if (mode === "linear_segment" || mode === "linear_weight_color" ||
            mode === "linear_segment_coords") {
            points.push([-1.52, 0.83, 0.0]);
            points.push([1.26, -0.61, 0.0]);
            if (mode === "linear_weight_color") {
                selected_point = 0;
            }
        } else if (mode === "linear_segment_weight_plot") {

            points.push([-1.52, -0.17, 0.0]);
            points.push([1.26, 0.8, 0.0]);
            selected_point = 0;

        } else if (mode === "point_coords") {
            points = [[1.24, 0.67, 0]];
        } else if (mode === "linear_segment_3d") {
            points.push([-0.7, -0.8, 0.0]);
            points.push([0.7, 0.8, 0.0]);
        } else if (mode === "cubic_bezier_3d") {
            points = [[-0.709825815474885, -0.2024969877851184, -0.30299473075786465],
            [0.5433553164677634, -0.6684189532801103, 0.5446146083578157],
            [0.429391961306971, -0.010686879632011948, -1.0022488503483893],
            [0.2052504892988955, 0.7302988284776327, 0.6189782854285535]];
        } else if (mode === "linear_patch" || mode === "linear_patch_point" ||
            mode === "linear_patch_point2" || mode === "linear_patch_point3" ||
            mode === "linear_patch_point4") {
            for (let j = 0; j <= 1; j++) {
                for (let i = 0; i <= 1; i++) {
                    points.push([j - 0.5, i - 0.5, 0.0]);
                }
            }

            points[0][0] = -0.3;
            points[0][2] = 0.4;
            points[2][2] = -0.4;

            points = points.map(p => vec_scale(p, 1.5));

        } else if (mode === "continuities") {

            points = [[-0.6, -0.5, 0], [-1, -0.2, 0], [-0.6, 0.3, 0], [-0.2, 0.4, 0],
            [0.2, 0.4, 0], [0.4, 0.2, 0], [0.7, -0.4, 0], [1, -0.4, 0]];

            points = points.map(p => vec_scale(p, 1.4));

            drag_filter = function (p, org_p, i) {



                if (arg0 >= 1) {
                    p[4] = p[3];
                }
                if (arg0 >= 2) {
                    if (i == 2 || i == undefined) {
                        let dir = vec_norm(vec_sub(p[3], p[2]));
                        p[5] = vec_add(p[4], vec_scale(dir, vec_dot(vec_sub(p[5], p[4]), dir)));
                    } else if (i == 5) {
                        let dir = vec_norm(vec_sub(p[4], p[5]));
                        p[2] = vec_add(p[3], vec_scale(dir, vec_dot(vec_sub(p[2], p[3]), dir)));
                    } else {
                        p[2] = vec_add(p[3], vec_sub(org_p[2], org_p[3]));
                        p[5] = vec_add(p[4], vec_sub(org_p[5], org_p[4]));
                    }
                }

                if (arg0 >= 3) {
                    let dir = vec_sub(p[3], p[2]);

                    if (i == 2 || i == undefined) {
                        p[5] = vec_add(p[4], dir);

                    } else if (i == 5) {
                        let dir2 = vec_sub(p[4], p[5]);
                        p[2] = vec_add(p[3], dir2);
                    }
                    dir = vec_norm(dir);

                    p[6] = vec_add(p[1], vec_scale(dir, vec_dot(vec_sub(p[6], p[1]), dir)));

                }



                return p;
            }

        } else if (mode === "bspline_surface2") {
            for (let j = 0; j <= 5; j++) {
                for (let i = 0; i <= 4; i++) {
                    points.push([
                        (j / 5 - 0.5) * 1.6,
                        (i / 4 - 0.5) * 1.6,
                        0.2 * Math.sin(i * 23423424.2 + j * 34.143)]);
                }
            }

        } else if (mode === "subdiv_hero" || mode === "subdiv_hero2") {
            points = [
                [1.416665, 0.307456, 3.091595],
                [0.914740, 0.563896, 1.330573],
                [1.092969, 1.348306, 0.726266],
                [2.772436, -0.327531, 2.770750],
                [2.409205, -0.230213, 1.337310],
                [2.029785, -0.081115, -0.721172],
                [2.393893, -0.694184, 6.249262],
                [1.668593, 0.221171, 4.498604],
                [1.100886, 0.193551, 6.509480],
                [4.135477, -0.129525, -0.635980],
                [4.268748, -0.692823, 2.380565],
                [1.007110, 0.484055, -2.275209],
                [1.680420, -0.072627, -2.314881],
                [0.763885, 0.044288, -4.114311],
                [2.507025, -0.023149, -3.961501],
                [1.140135, 0.111873, -6.771726],
                [2.653972, -0.461301, -6.892745],
                [4.726821, 0.105187, -3.829832],
                [4.705139, -1.061688, -6.628591],
                [6.309046, -1.663196, -3.223352],
                [5.999053, -1.530196, -4.909943],
                [5.022739, -0.459903, -1.812190],
                [6.095024, -1.796416, -1.368252],
                [6.069338, -1.957330, -0.173401],
                [4.308588, -0.210674, 0.957682],
                [6.228411, -1.915902, 1.273053],
                [3.811714, -2.324187, 5.028759],
                [5.889795, -2.501403, 2.370166],
                [4.908947, -2.918689, 4.080984],
                [-1.416665, 0.307456, 3.091595],
                [-0.914740, 0.563896, 1.330573],
                [0.000000, 0.503520, 3.329885],
                [0.000000, 0.503520, 1.655434],
                [-1.092969, 1.348306, 0.726266],
                [-2.772436, -0.327531, 2.770750],
                [-2.409205, -0.230213, 1.337310],
                [-2.029785, -0.081115, -0.721172],
                [-2.393893, -0.694184, 6.249262],
                [-1.668593, 0.221171, 4.498604],
                [-1.100886, 0.193551, 6.509480],
                [0.000000, 0.503520, 4.556904],
                [0.000000, 0.503520, 6.605146],
                [-4.135477, -0.129525, -0.635980],
                [0.000000, 0.503520, -4.145679],
                [-4.268748, -0.692823, 2.380565],
                [0.000000, 1.806436, -2.188690],
                [-1.007110, 0.484055, -2.275209],
                [-1.680420, -0.072627, -2.314881],
                [-0.763885, 0.044288, -4.114311],
                [-2.507025, -0.023149, -3.961501],
                [-1.140135, 0.111873, -6.771726],
                [-2.653972, -0.461301, -6.892745],
                [-4.726821, 0.105187, -3.829832],
                [-4.705139, -1.061688, -6.628591],
                [-6.309046, -1.663196, -3.223352],
                [-5.999053, -1.530196, -4.909943],
                [-5.022739, -0.459903, -1.812190],
                [-6.095024, -1.796416, -1.368252],
                [-6.069338, -1.957330, -0.173401],
                [-4.308588, -0.210674, 0.957682],
                [-6.228411, -1.915902, 1.273053],
                [0.000000, 0.160784, -6.797724],
                [-3.811714, -2.324187, 5.028759],
                [0.000000, 2.769843, 1.641670],
                [-5.889795, -2.501403, 2.370166],
                [-4.908947, -2.918689, 4.080984],
            ];

            faces = [
                [32, 1, 2, 33],
                [2, 1, 4, 5],
                [7, 4, 8, 9],
                [9, 8, 41, 42],
                [12, 13, 15, 14],
                [14, 15, 17, 16],
                [17, 15, 18, 19],
                [19, 18, 20, 21],
                [18, 22, 23, 20],
                [23, 22, 10, 24],
                [24, 10, 25, 26],
                [62, 44, 14, 16],
                [46, 12, 14, 44],
                [3, 12, 46, 64],
                [26, 25, 11, 28],
                [13, 12, 3, 6],
                [25, 10, 6, 5],
                [2, 5, 6, 3],
                [3, 64, 33, 2],
                [5, 4, 11, 25],
                [4, 7, 27, 11],
                [28, 11, 27, 29],
                [32, 33, 31, 30],
                [31, 36, 35, 30],
                [38, 40, 39, 35],
                [40, 42, 41, 39],
                [47, 49, 50, 48],
                [49, 51, 52, 50],
                [52, 54, 53, 50],
                [54, 56, 55, 53],
                [53, 55, 58, 57],
                [58, 59, 43, 57],
                [59, 61, 60, 43],
                [62, 51, 49, 44],
                [46, 44, 49, 47],
                [34, 64, 46, 47],
                [61, 65, 45, 60],
                [48, 37, 34, 47],
                [60, 36, 37, 43],
                [31, 34, 37, 36],
                [34, 31, 33, 64],
                [36, 60, 45, 35],
                [35, 45, 63, 38],
                [65, 66, 63, 45],

            ];

            faces = faces.map(f => f.map(i => i - 1));

            points = points.map(a => vec_scale(vec_sub(a, [0, 0, 0]), 0.15));

        } else if (mode === "subdiv2") {

            points = [
                [10.000000, 5.000000, 5.000000],
                [10.000000, 0.000000, 5.000000],
                [10.000000, 0.000000, -5.000000],
                [10.000000, 5.000000, -5.000000],
                [-10.000000, 0.000000, -5.000000],
                [-10.000000, 5.000000, -5.000000],
                [-10.000000, 0.000000, 5.000000],
                [-10.000000, 5.000000, 5.000000],
                [-7.500000, 5.000000, -2.500000],
                [-2.500000, 5.000000, -2.500000],
                [2.500000, 5.000000, -2.500000],
                [2.500000, 5.000000, 2.500000],
                [-7.500000, 5.000000, 2.500000],
                [-2.500000, 5.000000, 2.500000],
                [7.500000, 5.000000, 2.500000],
                [7.500000, 5.000000, -2.500000],
                [-2.500000, 0.000000, 2.500000],
                [2.500000, 0.000000, 2.500000],
                [2.500000, 0.000000, -2.500000],
                [-2.500000, 0.000000, -2.500000],
                [7.500000, 0.000000, 2.500000],
                [-7.500000, 0.000000, 2.500000],
                [7.500000, 0.000000, -2.500000],
                [-7.500000, 0.000000, -2.500000],
                [0.000000, 0.000000, -5.000000],
                [0.000000, 5.000000, -5.000000],
                [0.000000, 5.000000, 5.000000],
                [0.000000, 0.000000, 5.000000],
            ];

            faces = [
                [7, 8, 6, 5],
                [17, 14, 10, 20],
                [6, 9, 10, 26],
                [15, 1, 4, 16],
                [27, 14, 13, 8],
                [28, 27, 8, 7],
                [3, 23, 19, 25],
                [7, 22, 17, 28],
                [5, 25, 20, 24],
                [3, 2, 21, 23],
                [24, 22, 7, 5],
                [28, 25, 19, 18],
                [25, 28, 17, 20],
                [18, 21, 2, 28],
                [24, 9, 13, 22],
                [3, 4, 1, 2],
                [19, 11, 12, 18],
                [22, 13, 14, 17],
                [23, 16, 11, 19],
                [18, 12, 15, 21],
                [20, 10, 9, 24],
                [25, 26, 4, 3],
                [21, 15, 16, 23],
                [5, 6, 26, 25],
                [2, 1, 27, 28],
                [13, 9, 6, 8],
                [27, 26, 10, 14],
                [27, 12, 11, 26],
                [1, 15, 12, 27],
                [4, 26, 11, 16],
            ];

            faces = faces.map(f => f.map(i => i - 1));

            points = points.map(a => vec_scale(vec_sub(a, [0, 2.5, 0]), 0.12));

        } else if (mode === "subdiv0") {
            points = [[0, 0, 0],
            [1, 0, 0],
            [2, 0, 0],
            [3, 0, 0],

            [0, 1, 0],
            [1, 1, 0],
            [2, 1, 0],
            [3, 1, 0],

            [1, 2, 0],
            [2, 2, 0],

            [0, 0, 1],
            [1, 0, 1],
            [2, 0, 1],
            [3, 0, 1],
            [0, 1, 1],
            [1, 1, 1],
            [2, 1, 1],
            [3, 1, 1],
            [1, 2, 1],
            [2, 2, 1],

            ];

            points = points.map(a => vec_scale(vec_sub(a, [1.5, 1, 0.5]), 0.62));

            faces = [
                [0, 4, 5, 1],
                [1, 5, 6, 2],
                [2, 6, 7, 3],
                [5, 8, 9, 6],

                [10, 14, 15, 11],
                [11, 15, 16, 12],
                [12, 16, 17, 13],
                [15, 18, 19, 16],

                [0, 10, 11, 1],
                [1, 11, 12, 2],
                [2, 12, 13, 3],

                [0, 10, 14, 4],
                [4, 14, 15, 5],

                [6, 16, 17, 7],
                [3, 13, 17, 7],

                [5, 15, 18, 8],
                [8, 18, 19, 9],
                [9, 19, 16, 6],
            ];

        } else if (mode === "subdiv1") {
            points = [
                mat3_mul_vec(rot_z_mat3(Math.PI * 2 / 5 * 0), [1, 0, -0.5]),
                mat3_mul_vec(rot_z_mat3(Math.PI * 2 / 5 * 1), [1, 0, -0.5]),
                mat3_mul_vec(rot_z_mat3(Math.PI * 2 / 5 * 2), [1, 0, -0.5]),
                mat3_mul_vec(rot_z_mat3(Math.PI * 2 / 5 * 3), [1, 0, -0.5]),
                mat3_mul_vec(rot_z_mat3(Math.PI * 2 / 5 * 4), [1, 0, -0.5]),
                [0, 0, 1.3]
            ];

            points = points.map(a => vec_scale(a, 0.85));

            faces = [
                [0, 1, 2, 3, 4],
                [0, 1, 5],
                [1, 2, 5],
                [2, 3, 5],
                [3, 4, 5],
                [4, 0, 5],
            ];

        } else if (mode === "subdiv_base" || mode === "subdiv_base_patch" || mode === "subdiv_base_patch2") {
            points = [
                [-0.75, -0.75, 0],
                [-0.7667141949361495, -0.21092209756537056, -0.04154478783335037],
                [-0.77595598500126, 0.23470308875827944, 0.0961709695569938],
                [-0.7863912967654376, 0.75789324033195, 0.41243789798950686],
                [-0.21406560561834617, -0.7375387102977007, -0.21561214275776022],
                [-0.25, -0.25, 0],
                [-0.27390316386628377, 0.25034139125661026, 0.2250806609939597],
                [-0.2746015109832518, 0.7710537456900126, 0.42753288729767475],
                [0.2706912087746689, -0.7666368446433486, -0.3199331135043337],
                [0.29280511203462234, -0.27513970998577914, 0.03141698896147181],
                [0.24999999999999994, 0.24999999999999994, 0],
                [0.21713946929678923, 0.7571274202716032, 0.3724222386854807],
                [0.7995643202889049, -0.7158476418548596, -0.2781685683181415],
                [0.7783481018641035, -0.24513828227195694, -0.2171057090732327],
                [0.7803215368487042, 0.2456082373870817, -0.16856639617775981],
                [0.75, 0.75, 0],
            ];


            faces = [[0, 4, 5, 1],
            [1, 5, 6, 2],
            [2, 6, 7, 3],

            [4, 8, 9, 5],
            [5, 9, 10, 6],
            [6, 10, 11, 7],

            [8, 12, 13, 9],
            [9, 13, 14, 10],
            [10, 14, 15, 11]];

        } else if (mode === "surface") {
            for (let j = 0; j <= 1; j++) {
                for (let i = 0; i <= 3; i++) {
                    points.push([j / 1 - 0.5, i / 3 - 0.5, 0.0]);
                }
            }

            let s = Math.SQRT2 / 4;

            points[3][2] = s;
            points[7][2] = -s;
            points[3][0] = -s;
            points[7][0] = s;

            points[1][2] = -s;
            points[5][2] = s;

            points[1][0] = -s;
            points[5][0] = s;

            points = points.map(p => vec_scale(p, 1.7));

        } else if (mode === "linear_patch_symmetry") {
            points = [
                [-0.49267200821428003, -0.9486648498884359, -0.07222560865636403],
                [-0.838382018133068, 0.5315064540387805, -0.6169441941771431],
                [-0.28540309205679915, 0.14596675453693747, 1.0978826786834648],
                [1.132971688709113, 0.39375461231235426, -0.08492383054987038]];

        } else if (mode === "linear_patch_quad_curve") {
            for (let j = 0; j <= 1; j++) {
                for (let i = 0; i <= 1; i++) {
                    points.push([j - 0.5, i - 0.5, -0.5]);
                }
            }

            points[0][2] = 0.5;
            points[3][2] = 0.5;

            points = points.map(p => vec_scale(p, 1.3));
        } else if (mode === "linear_patch_quad_curve_flat") {

            points[0] = [-0.5, -0.5, 0.5];
            points[1] = [0, 0, -0.8];
            points[2] = [0.5, 0.5, 0.5];

            points = points.map(p => vec_scale(p, 1.2));
        } else if (mode === "cubic_patch" || mode === "cubic_patch2" ||
            mode === "bspline_surface" || mode === "nurbs_hole") {
            points = [
                [-0.748761164940777, -0.8402381743235232, 0.04274015516621033],
                [-0.7475656357126989, -0.1928718772029352, 0.5877630432929579],
                [-0.6626355872286919, 0.30943251997248417, 0.6331506603790417],
                [-0.7411355781707372, 0.9551223478313272, -0.007481980838387352],
                [-0.24416820286398033, -0.9076925101714132, 0.18494348687624498],
                [-0.20824205864537018, -0.3123537599499005, 0.3459096923096413],
                [-0.16666666666666669, 0.16666666666666663, 0],
                [-0.18269596582519296, 0.589082814175693, -0.002329326416544558],
                [0.07613058012289238, -0.9425949013945255, 0.133045261074619],
                [-0.0001372148156425645, -0.3582199476866469, -0.3796737235283502],
                [0.16666666666666663, 0.16666666666666663, 0],
                [0.3156236789214345, 0.5747990465976968, -0.0064624054702717435],
                [0.6342803293873607, -1.0083999119546152, -0.07115695843497323],
                [0.5438825466797169, -0.5482203218034467, 0.38547521423602565],
                [0.8985042837479602, 0.16070086128165906, -0.010871541242017392],
                [0.8569404440380297, 0.8009859366247764, -0.019276928430119158],
            ]

        } else if (mode === "two_cubic_patches" || mode === "two_cubic_patches_normals") {
            points = [
                [-1, -0.5, 0],
                [-1.0197145915961288, -0.16360934856616238, -0.2090866163631062],
                [-1, 0.16666666666666663, 0],
                [-1.0125930881324057, 0.49757557710713163, -0.23698873353430336],
                [-0.711414146638741, -0.5975981218970736, -0.24497905291825017],
                [-0.6666666666666667, -0.16666666666666669, 0],
                [-0.6773825202106881, 0.14294047011703992, 0.11474579793957386],
                [-0.6666666666666667, 0.5, 0],
                [-0.32585514441628155, -0.5685744201268287, 0.2316949050825986],
                [-0.35940379030528624, -0.20113110571435733, 0.16563820148936115],
                [-0.32918015505182596, 0.14400876837460722, -0.046203214786704895],
                [-0.33333333333333337, 0.5, 0],
                [-0.08924775099110015, -0.48458412891706426, -0.030304161521430572],
                [-0.17135202370900268, -0.0837126602301162, 0.11367567890625607],
                [-0.10370831239779577, 0.23157956551955053, 0.002838382289904745],
                [-0.11045469173469077, 0.5707817688306193, 0.12214397877072114],
                [-0.08924775099110015, -0.48458412891706426, -0.030304161521430572],
                [-0.17135202370900268, -0.0837126602301162, 0.11367567890625607],
                [-0.10370831239779577, 0.23157956551955053, 0.002838382289904745],
                [-0.11045469173469077, 0.5707817688306193, 0.12214397877072114],
                [0.15298341984038094, -0.4110680973441053, 0.19904502570253996],
                [0.3060735209712062, -0.22366864584003648, -0.042750102924947464],
                [0.23285571406605993, 0.20493264700081212, 0.042864215265420266],
                [0.13599005340613976, 0.5009994055956225, -0.07449585476979913],
                [0.5964204846247261, -0.5587464200098501, 0.19433126405409323],
                [0.6666666666666665, -0.16666666666666669, 0],
                [0.6666666666666665, 0.16666666666666663, 0],
                [0.6666666666666665, 0.5, 0],
                [0.9786953641896006, -0.4551003316240064, 0.13694820778047098],
                [1.080737673006876, -0.11374022709539795, 0.108688970834975],
                [0.9436370090834361, 0.2847838504371285, 0.23977575049790442],
                [0.980106509679486, 0.5657831413878268, 0.12573617589021457],
            ];

            if (mode === "two_cubic_patches_normals") {
                drag_filter = function (p, org_p, i) {
                    p[16] = p[12];
                    p[17] = p[13];
                    p[18] = p[14];
                    p[19] = p[15];
                }

                drag_filter(points);
            } else {
                points[16] = vec_add(points[12], [0.1, 0.1, 0.1]);
                points[17] = vec_add(points[13], [0.04, 0.1, 0.03]);
                points[18] = vec_add(points[14], [0.14, -0.02, -0.05]);
            }
        } else if (mode === "two_cubic_patches_mirror" || mode === "two_cubic_patches_side" ||
            mode === "two_cubic_patches_lambert") {
            for (let j = 0; j <= 3; j++) {
                for (let i = 0; i <= 3; i++) {
                    points.push([j / 3 - 0.5, i / 3 - 0.5, 0.0]);
                }
            }
            for (let j = 0; j <= 3; j++) {
                for (let i = 0; i <= 3; i++) {
                    points.push([j / 3 - 0.5 + 1, i / 3 - 0.5, 0.0]);
                }
            }
            points.forEach(a => { a[0] -= 0.5 });
            for (let i = 0; i < 4; i++) {
                points[i][2] -= 2 / 3;
                points[i][0] += 1 / 3;

                points[i + 4][2] -= 2 / 3 - 0.55228 * 2 / 3;
                points[i + 8][0] += 1 / 3 - 0.55228 * 2 / 3;

                let f = 3 * 0.55228 * 2 / 3;

                points[i + 16][0] *= f;
                points[i + 20][0] *= f;
                points[i + 24][0] *= f;
                points[i + 28][0] *= f;
                // points[i + 16][0] *= 0.55228;
            }

        } else if (mode === "cubic_four_curves_surface") {
            points = [
                [-0.604656770298936, -0.8764677336729807, -0.4598382635219932],
                [-0.9072089626638443, -0.6533379130460722, -0.15573995485403752],
                [-0.8243516860390644, 0.2395503204509903, 0.04776767182512069],
                [-0.6924620350812711, 0.3614190977993706, -0.4503210315039088],
                [-0.13652407716594195, -1.1121562229800794, -0.06823593979027485],
                [-0.07840536849305187, -0.582239470273795, 0.7611328010213871],
                [-0.1957538531181604, 0.5145367510437304, 0.662002971198561],
                [-0.7824247764401524, 0.851385437604134, -0.33736324169843324],
                [0.2716307652713264, -1.0661990817888003, -0.16506378125937157],
                [0.16095928033264584, -0.35976756422046313, 0.35762294766281383],
                [0.3748011407636947, 0.5372884013838146, 0.5085019455648394],
                [0.5139392117138993, 0.9872104652785795, -0.3356401749896873],
                [0.7983676717049066, -0.6149568012047193, -0.2753839041886136],
                [1.0923046208538405, -0.12751770653688105, -0.2733831655428869],
                [0.9353756335423817, 0.7009607081346869, -0.4197184853993206],
                [0.5465200266666745, 0.9501217818766085, -0.5350272958839596],
            ];
        } else if (mode === "cubic_four_curves_surface2") {

            points = [
                [-0.08558146545010611, -0.928665525487575, -0.4281166522545263],
                [-0.5345871028378374, -0.7585411352366818, -0.58305945660097],
                [-0.3702247909551244, 0.2650436222564303, -0.8619360191843697],
                [-0.9651043462502792, 0.5789617348325872, -0.44618878534310275],
                [-0.0792229296067323, -0.627695965888251, -0.1426916356660217],
                [-0.22284097434355307, -0.27247962746327525, -0.454153501755473],
                [-0.2589112302484073, -0.08455186170109484, 0.13754841789789557],
                [-0.6931123413739456, 0.5745105311766747, 0.3627543853514199],
                [0.31803307280396914, -0.6168838098424594, 0.10374710226151249],
                [0.3964533098482378, -0.2811890728113019, -0.654360864712561],
                [0.5717400651056469, 0.41938885671460796, -0.4994659958314891],
                [-0.03490056144282077, 0.5613328247439665, 0.025974497752955565],
                [0.7983676717049066, -0.6149568012047193, -0.2753839041886136],
                [0.8422081675462015, -0.4749854390727316, -0.6402726296885338],
                [0.4459091801906471, 0.2785533445035533, -0.43408688119129596],
                [0.47696589721102484, 1.0404176858035916, 0.05184452953483412],
            ];

        } else if (mode === "surface_tangent_plane" || mode === "cubic_patch_curvature_cut" ||
            mode === "surface_normal" || mode === "cubic_patch_curvature_circle" ||
            mode === "cubic_patch_curvature_circle_principal") {
            points = [
                [-0.6559873840006639, -0.6393105347703961, 0.5253053234162821],
                [-0.6489435864678699, -0.11373120602215858, 0.3374065159017335],
                [-0.6481286591597674, 0.24081004995124886, 0.2994431129212435],
                [-0.6201202244838507, 0.7003160929678798, 0.0016717428195447924],
                [-0.30421035635638244, -0.7134618692965968, 0.17481853362536917],
                [-0.2390905976393993, -0.2265370261867914, -0.022885470500657805],
                [-0.3777214464501363, 0.2572201332529336, 0.4596421577146016],
                [-0.31485191050243483, 0.6173974214883995, 0.5723142293517779],
                [0.21529890150603162, -0.658194836775149, 0.18091654319620443],
                [0.22614060044142756, -0.2462376959095843, 0.006181121692987795],
                [0.0980697806269629, 0.28952340537833593, 0.31003268011532514],
                [0.11715188363174987, 0.6654279083045741, 0.41477803203036173],
                [0.43077011468137305, -0.6052929159405063, 0.5126736758525785],
                [0.48502251902138677, -0.18765025907255847, 0.5274680186493627],
                [0.6744585618059635, 0.303846633445286, 0.08822659612931108],
                [0.7454180527710934, 0.7135769385240782, 0.0017336535888339561],
            ]

            points = points.map(p => vec_add(p, [0, 0, -0.3]));
        } else if (mode === "cubic_linear_patch") {
            points = [[-0.2409627620396846, -1.0156422986685432, -0.27217469408519934],
            [-0.5937521734428326, -0.7759368911162989, 0.40542244299904723],
            [-0.5976514371022363, 0.0022745096302379635, 0.2840407659568313],
            [-0.5409188339430644, 0.6990698704471612, -0.19520710912282346],
            [0.7238357195524341, -0.35367456295365657, -0.6639123960592508],
            [0.9974346560953786, -0.5110399819916199, -0.05359591545566989],
            [0.6972067557453433, 0.1873693327979954, -0.3012566518982797],
            [0.2957592880653509, 0.4119267105231364, 0.8669110617355289]];
        } else if (mode === "quad_curve_interpolation" || mode === "quad_curve" ||
            mode === "quad_curve_plot" || mode === "quad_curve_plot2") {

            points = [
                [-1.8, -0.35, 0],
                [0.2, 0.8, 0],
                [1.3, -0.2, 0],
            ]

            if (mode === "quad_curve_plot") {
                selected_point = 0;
            }

        } else if (mode === "cubic_curve_interpolation") {

            points = [
                [-1.8, -0.4, 0],
                [-1.3, 0.6, 0],
                [0.5, 0.7, 0],
                [1.5, -1.1, 0],
            ]
        } else if (mode === "cubic_curve_plot") {

            points = [
                [-1.3, 0, 0],
                [-0.6, 0.6, 0],
                [0.1, 0.7, 0],
                [1.2, -0.3, 0],
            ]

            selected_point = 0;


        } else if (mode === "high_deg_bezier") {
            points = [[-0.5938503797088669, -1.085527166959937, 0],
            [-1.9332179379748942, -0.8627560921778854, 0],
            [-2.0535191762377156, 0.47846384347756393, 0],
            [-0.7304518573942316, 1.1842922487003218, 0],
            [0.9169176985523511, 1.2095331600016033, 0],
            [1.616300239422543, 0.5464558527553424, 0],
            [1.8830573304407079, -0.46707830608653844, 0],
            [0.9058284052227576, -1.0692269275373936, 0]];
        } else if (mode === "spline_cubic_loop_plot") {

            points = [
                [-1.8861446260897445, 0.1846134637686968, 0],
                [-1.6230673188434843, 0.8135341588418809, 0],
                [-0.3550753095657053, 1.1224498597136765, 0],
                [0.030155613332800178, 0.4015311623210479, 0],
                [1.4781426284091896, 0.709533160001603, 0],
                [1.5424548539150638, -0.45045685159562016, 0],
                [-0.10338353971047053, 0.05169176985523555, 0],
                [-1.1913805431896374, -0.4415411507238247, 0]
            ]



            // drag_filter(points, 0);
            selected_point = 0;
            points = points.map(p => vec_scale(p, 0.9));


        } else if (mode === "curve_hero") {
            points = [
                [-2.4760433066209355, 0.1267839048231825, 0],
                [-2.546829435903067, 0.5190673915891677, 0],
                [-3.371048484239696, 0.4997045015484719, 0],
                [-3.3331538048301117, -0.6048747748723952, 0],
                [-2.2407106226481743, -0.6239359837647146, 0],
                [-1.9029336824521594, 0.9680137375741226, 0],
                [-2.037261841083757, -0.6079853804950986, 0],
                [-1.2111142184731745, -0.5946932111037526, 0],
                [-1.1868406878974853, 0.9579966635267528, 0],
                [-1.1259657444917324, -0.5973516449820215, 0],
                [-0.7583979658825986, -0.5946932111037526, 0],
                [-0.4333651293257704, 0.9950502481012505, 0],
                [-0.3505101594204377, -1.1613917989195344, 0],
                [-0.3349244859529824, 0.4646926893865359, 0],
                [0.14961438329999843, 0.4460836522386529, 0],
                [0.3350794412476919, 0.4447544352995192, 0],
                [0.5125691975605735, -0.6172898990690413, 0],
                [0.6275857577341319, -0.6159606821299064, 0],
                [0.8281929694702944, 0.7874320218672567, 0],
                [0.9379885558950322, -0.003739738941002495, 0],
                [1.8956600597663869, -0.174921042066206, 0],
                [2.011074195096041, 0.45762173124059874, 0],
                [1.2153167682333912, 0.5022397431248518, 0],
                [1.2287234778611804, -0.5900888988206408, 0],
                [2.1651002124122107, -0.6013392957994259, 0],
                [2.476032430096545, 0.7661645508411021, 0],
                [2.6096580274179866, 0.05795230601134273, 0],
                [3.1374170959025327, -0.2407925258513999, 0],
                [2.6787600041220894, -0.6683209102141437, 0],
                [2.462637056729857, -0.40604029975435857, 0],
            ];
            points = points.map(p => vec_add(p, [0.2, 0, 0]));
        } else if (mode === "control_points" || mode === "control_points2") {
            points = [
                [-2.1815261681196594, 0.6719930081180556, 0],
                [-1.8298343982644243, -0.9070633234823727, 0],
                [-0.709533160001603, 0.7738453855074787, 0],
                [0.5396887733344021, -0.8606074707270307, 0],
                [-1.047369555946583, -0.649221933336005, 0],
                [0.4421586098536317, 0.7458383936255351, 0],
                [1.880291249860044, 0.5713755489882487, 0],
                [1.9372189368151718, -0.7550753095657052, 0]
            ];

            if (mode === "control_points2")
                selected_point = 4;
        } else if (mode === "septic_zoom") {
            points = [[-1.3544578504358982, -0.47261046724786354, 0],
            [-1.6452209344957285, 0.8566064718867533, 0],
            [-0.25907630840598317, 0.9879970034791671, 0],
            [0.9089157008717957, 0.8230673188434839, 0],
            [1.8252159402943389, 0.8941466237702999, 0],
            [1.8526054730464758, -0.27322792637767146, 0],
            [1.351370554786861, -0.9498393924658133, 0],
            [0.5144478620331209, -0.9163002394225435, 0]];
            selected_point = 5;

        } else if (mode === "septic_fit" || mode === "septic_curve_plot" ||
            mode === "septic_curve_plot2" || mode === "spline_triangle_plot" ||
            mode === "spline_funky_plot" || mode === "spline_funky_plot2" ||
            mode === "spline_cubic_plot" ||
            mode === "spline_quadratic_plot" || mode === "spline_cubic_knots_plot" ||
            mode === "spline_cubic_knots_plot2" ||
            mode === "spline_cubic_weight_plot" ||
            mode === "chaikin" || mode === "chaikin_quadratic_bspline" ||
            mode === "chaikin_cubic" || mode === "chaikin_cubic_bspline") {

            points = [
                [-1.6867620852195522, -0.3027660805806626, 0],
                [-2.117831401743591, 0.07508030376709406, 0],
                [-1.7138304029033133, 0.9141516179716882, 0],
                [-0.2726104672478636, 0.9264508585539538, 0],
                [0.0012349182596151356, -0.23568777449412406, 0],
                [0.8335391530432684, -0.34707331188514995, 0],
                [0.790145624930022, 0.5418373947852574, 0],
                [2.183353574502141, 0.8264508585539541, 0]
            ]

            if (mode === "spline_funky_plot" || mode === "spline_funky_plot2")
                points = points.map(p => vec_scale(p, 0.7));


            if (mode !== "septic_fit" &&
                mode !== "chaikin" && mode !== "chaikin_cubic" &&
                mode !== "chaikin_quadratic_bspline" && mode !== "chaikin_cubic_bspline") {
                selected_point = 0;
            }

            if (mode === "spline_cubic_weight_plot")
                selected_point = 3;
        } else if (mode === "curve_subdiv_topo") {
            points = [
                [-2.1962952452211555, 0.818152616811966, 0],
                [-1.1578413901463684, 0.4295381542029915, 0],
                [-0.3993825408701929, 0.9806124649284189, 0],
                [0.46584338782692364, 0.4089157008717955, 0],
                [1.330451857394232, -0.14183739478525717, 0],
                [1.7935291646404916, 0.9009137031912401, 0],
                [0.17722892521794872, -0.5999999999999999, 0],
                [-0.19446783883867486, -0.8329216939134623, 0],
                [-1.5175351576821585, -0.8221536156522438, 0],
                [-1.4584588492761756, 0.024919696232906352, 0],
                [-0.530155613332799, 0.11753515768215854, 0],
            ]
            faces = [
                [0, 1],
                [1, 2],
                [2, 3],
                [3, 4],
                [4, 5],
                [3, 6],
                [6, 7],
                [7, 8],
                [8, 9],
                [9, 10],
                [10, 7],
            ]
        } else if (mode === "tangent") {
            points = [
                [-1.8, -0.9, 0],
                [-0.6, 0.4, 0],
                [0.8, 0.8, 0],
                [1.6, -0.7, 0],
            ];
        } else if (mode === "cubic_fit") {
            points = [
                [-1, 0, 0],
                [-0.6, 0.4, 0],
                [-0.2, 0.7, 0],
                [0.2, -0.3, 0],
            ]
        } else if (mode === "cubic_curve_circle") {

            points = [
                [-1.0516917698552355, -0.3249196962329063, 0],
                [0.24645585275534254, 0.9464558527553432, 0],
                [0.4732279263776705, -0.45198801391666815, 0],
                [1.0033835397104696, -0.23353915304326908, 0]
            ];

        } else if (mode === "cubic_curve_comb" || mode === "cubic_curve_curvature") {
            points = [
                [-1.7827610863792744, -0.1993825408701924, 0],
                [0.8519880139166678, 0.9612249298568384, 0],
                [-0.8412199356554498, -0.8876757884107925, 0],
                [1.3726104672478632, -0.5953815420299147, 0]
            ];
        } if (mode === "cubic_spline2") {
            points = [
                [-2.0042972429017105, 0.17722892521794886, 0],
                [-1.4418373947852583, -0.7298343982644243, 0],
                [-1.1226966798335654, 0.9798354935618269, 0],
                [-0.13230423478365413, 0.5566064718867529, 0],
                [-0.13230423478365413, 0.5566064718867529, 0],
                [0.7726526621858426, 0.16988702135297076, 0],
                [2.0570585021344727, 0.9060447665853733, 0],
                [2.1285994800048096, 0.12830323594337645, 0],
                [2.1285994800048096, 0.12830323594337645, 0],
                [2.222604880436752, -0.8936551744247714, 0],
                [0.2418373947852573, 0.031069316524039006, 0],
                [-0.10276608058066267, -0.8953815420299147, 0],
            ]
            drag_filter = function (p, org_p, i) {

                p[4] = p[3];
                p[8] = p[7];

                if (i == 0) {
                    p[1] = vec_add(p[0], vec_sub(org_p[1], org_p[0]));
                } else if (i == 11) {
                    p[10] = vec_add(p[11], vec_sub(org_p[10], org_p[11]));
                }

                for (let k = 0; k < 2; k++) {

                    let off = k * 4;

                    if (i == 2 + off || i === undefined) {
                        let dir = vec_norm(vec_sub(p[3 + off], p[2 + off]));
                        p[5 + off] = vec_add(p[4 + off], vec_scale(dir, vec_len(vec_sub(p[5 + off], p[4 + off]))));
                    } else if (i == 3 + off) {
                        p[2 + off] = vec_add(p[3 + off], vec_sub(org_p[2 + off], org_p[3 + off]));
                        p[5 + off] = vec_add(p[4 + off], vec_sub(org_p[5 + off], org_p[4 + off]));
                    } else if (i == 5 + off) {
                        let dir = vec_norm(vec_sub(p[4 + off], p[5 + off]));
                        p[2 + off] = vec_add(p[3 + off], vec_scale(dir, vec_len(vec_sub(p[2 + off], p[3 + off]))));
                    }

                }


                return p;
            }

            drag_filter(points, points);

        } else if (mode === "cubic_spline" || mode === "cubic_spline1") {

            // points = [
            //     [-1, 0, 0],
            //     [-0.6, 0.4, 0],
            //     [-0.2, 0.7, 0],
            //     [0.2, -0.3, 0],

            //     [0.3, 0.1, 0],
            //     [0.6, 0.4, 0],
            //     [1.2, 0.2, 0],
            //     [0.6, -0.3, 0],

            //     [0, 0.4, 0],
            //     [-0.6, -0.4, 0],
            //     [-0.6, -0.7, 0],
            //     [0.2, -0.6, 0],
            // ];

            points = [
                [-1.8196837791330138, -0.3027660805806626, 0],
                [-1.9439860162361124, 0.5772289252179489, 0],
                [-0.835070315364317, 0.921536156522436, 0],
                [-0.3390713142045943, 0.5935291646404923, 0],
                [-0.06584338782692313, 0.4975301634807699, 0],
                [0.2529266881148502, 0.08984938086858979, 0],
                [0.7273895327521365, 0.8867620852195518, 0],
                [1.2129166997120728, 0.3867620852195519, 0],
                [1.2350703153643166, 0.15045685159562025, 0],
                [1.2313655605854723, -0.8873795443493596, 0],
                [0.07199300811805608, -0.7590763084059837, 0],
                [-0.19876508174038482, -0.3858483820283119, 0],
            ]

            if (mode === "cubic_spline1") {
                drag_filter = function (p, org_p, i) {

                    p[4] = p[3];
                    p[8] = p[7];

                    return p;
                }
            } else if (mode === "cubic_spline2") {

            }

            if (drag_filter)
                drag_filter(points, points);
        }




        let arg0 = 0, arg1 = 0, arg2 = 0;

        this.set_arg0 = function (x) { arg0 = x; request_repaint(); }
        this.set_arg1 = function (x) { arg1 = x; request_repaint(); }
        this.set_arg2 = function (x) { arg2 = x; request_repaint(); }

        this.points = function () { return points.slice(); }
        this.set_points = function (p) {

            if (!saved_points) {
                points_history.push(points.slice());

                if (undo)
                    undo.style.visibility = "visible";
                saved_points = true;
            }


            points = p;
            recalc_ss_points();
            request_repaint();
        }

        this.set_rot = function (x) {
            rot = x;
            arcball.set_matrix(x);
            request_repaint();
        }



        this.reapply_restrictions = function () {
            if (drag_filter) {

                drag_filter(points, points);
                recalc_ss_points();
                request_repaint();
            }
        }

        let aspect = width / height;

        let proj_w;
        let proj_h;

        let proj;

        document.fonts.load("500 10px IBM Plex Sans").then(function () { request_repaint() });


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

                aspect = width / height;

                proj_w = 1;
                proj_h = proj_w / aspect;


                let fov = Math.PI * 0.2;
                let near = 1.0;
                let far = 11.0;

                var f = 1.0 / Math.tan(fov / 2);
                var rangeInv = 1 / (near - far);

                proj = [
                    f / aspect, 0, 0, 0,
                    0, f, 0, 0,
                    0, 0, (near + far) * rangeInv, -1,
                    0, 0, near * far * rangeInv * 2, 0
                ];

                proj = mat4_transpose(proj);

                proj = mat4_mul(proj, translation_mat4([0, 0, -4]));

                let pad = 5;
                let size = Math.max(width, height) - pad * 2;
                arcball.set_viewport(width / 2 - size / 2 + pad, height / 2 - size / 2 + pad, size, size);

                if (mode === "linear_segment_weight_plot") {
                    clamp_boundaries[3] = control_point_clamp + Math.ceil(height * 0.2) + 30 + plot_pad;
                } else if (mode === "quad_curve_plot" || mode === "quad_curve_plot2" ||
                    mode === "cubic_curve_plot" || mode === "septic_curve_plot" ||
                    mode === "septic_curve_plot2" || mode === "spline_triangle_plot" ||
                    mode === "spline_quadratic_plot" || mode === "spline_cubic_plot" ||
                    mode === "spline_cubic_loop_plot" || mode === "spline_cubic_knots_plot" ||
                    mode === "spline_cubic_knots_plot2" || mode === "spline_cubic_weight_plot") {
                    clamp_boundaries[3] = control_point_clamp + Math.ceil(height * 0.2) + 10 + plot_pad;
                } else if (mode === "spline_funky_plot") {
                    clamp_boundaries[0] = clamp_boundaries[1] = Math.ceil(width * 0.165) + base_line_width;
                    clamp_boundaries[2] = Math.ceil(height * 0.16) + base_line_width;
                    clamp_boundaries[3] = control_point_clamp + Math.ceil(height * 0.25) + 15 + plot_pad;
                } else if (mode === "spline_funky_plot2") {
                    clamp_boundaries[0] = clamp_boundaries[1] = Math.ceil(width * 0.165) + base_line_width;
                    clamp_boundaries[2] = Math.ceil(height * 0.16) + base_line_width;
                    clamp_boundaries[3] = control_point_clamp + Math.ceil(height * 0.3) + 15 + plot_pad;
                }


                recalc_ss_points();

                request_repaint();
            }
        }

        function quad_bezier(t, points) {
            let s = 1 - t;
            return vec_add(vec_add(vec_scale(points[0], s * s),
                vec_scale(points[1], 2 * t * s)),
                vec_scale(points[2], t * t));
        }

        function cubic_bezier(t, points) {
            let s = 1 - t;
            return vec_add(vec_add(vec_scale(points[0], s * s * s),
                vec_scale(points[1], 3 * t * s * s)),
                vec_add(vec_scale(points[2], 3 * t * t * s),
                    vec_scale(points[3], t * t * t)));
        }

        function cubic_bezier_tangent(t, points) {
            let s = 1 - t;
            return vec_add(vec_add(vec_scale(points[0], -3 * s * s),
                vec_scale(points[1], 3 * (s * s - 2 * t * s))),
                vec_add(vec_scale(points[2], -3 * (t * t - 2 * s * t)),
                    vec_scale(points[3], 3 * t * t)));
        }

        function cubic_bezier_2nd_derivative(t, points) {
            let s = 1 - t;
            return vec_add(vec_add(vec_scale(points[0], 6 * s),
                vec_scale(points[1], 3 * (-2 * s - 2 * s + 2 * t))),
                vec_add(vec_scale(points[2], -3 * (2 * t - 2 * s + 2 * t)),
                    vec_scale(points[3], 6 * t)));
        }


        function cubic_bezier_patch(st, points) {
            let p0 = cubic_bezier(st[0], points.slice(0, 4));
            let p1 = cubic_bezier(st[0], points.slice(4, 8));
            let p2 = cubic_bezier(st[0], points.slice(8, 12));
            let p3 = cubic_bezier(st[0], points.slice(12, 16));

            return cubic_bezier(st[1], [p0, p1, p2, p3]);
        }


        function septic_bezier(t, points) {
            let s = 1 - t;
            let factors = [
                s * s * s * s * s * s * s * 1.0,
                s * s * s * s * s * s * t * 7.0,
                s * s * s * s * s * t * t * 21.0,
                s * s * s * s * t * t * t * 35.0,
                s * s * s * t * t * t * t * 35.0,
                s * s * t * t * t * t * t * 21.0,
                s * t * t * t * t * t * t * 7.0,
                t * t * t * t * t * t * t * 1.0,
            ];

            let p = [0, 0];
            for (let k = 0; k < factors.length; k++) {
                p[0] += factors[k] * points[k][0];
                p[1] += factors[k] * points[k][1];
            }
            return p;
        }

        function faces_edges(faces, points_count) {
            let half_edges = new Array(points_count);
            for (let i = 0; i < points_count; i++)
                half_edges[i] = [];

            let edges = [];

            faces.forEach((face, i) => {

                function add_edge(i0, i1) {
                    if (i0 > i1) {
                        let tmp = i0;
                        i0 = i1;
                        i1 = tmp;
                    }

                    let half_edge = half_edges[i0];
                    for (let i = 0; i < half_edge.length; i++) {
                        if (half_edge[i] == i1) {
                            edges.push(i0, i1);
                            half_edge[i] = -1;
                            return;
                        }
                    }

                    half_edge.push(i1);
                }

                let n = face.length;

                for (let k = 0; k < n; k++) {
                    add_edge(face[k], face[(k + 1) % n]);
                }
            });

            half_edges.forEach((half_edge, i0) => {
                for (let k = 0; k < half_edge.length; k++) {
                    if (half_edge[k] != -1) {
                        edges.push(i0, half_edge[k]);
                    }
                }
            })

            return edges;
        }

        function subdiv_quad(faces, vert) {

            let half_edges = new Array(vert.length);
            for (let i = 0; i < vert.length; i++)
                half_edges[i] = [];

            let edges = [];

            faces.forEach((face, i) => {

                function add_edge(i0, i1, fi) {
                    if (i0 > i1) {
                        let tmp = i0;
                        i0 = i1;
                        i1 = tmp;
                    }

                    let half_edge = half_edges[i0];
                    for (let i = 0; i < half_edge.length; i += 2) {
                        if (half_edge[i] == i1) {
                            edges.push([i0, i1, half_edge[i + 1], fi]);
                            half_edge[i] = -1;
                            return;
                        }
                    }

                    half_edge.push(i1, fi);
                }

                add_edge(face[0], face[1], i);
                add_edge(face[1], face[2], i);
                add_edge(face[2], face[3], i);
                add_edge(face[3], face[0], i);
            })

            // this doesn't handle edges with just one face

            let valences = new Array(vert.length).fill(0);

            let new_face_points = new Array(faces.length);
            faces.forEach((face, i) => {
                for (let k = 0; k < 4; k++) {
                    valences[face[k]]++;
                }

                let p = [
                    (vert[face[0]][0] + vert[face[1]][0] + vert[face[2]][0] + vert[face[3]][0]) * 0.25,
                    (vert[face[0]][1] + vert[face[1]][1] + vert[face[2]][1] + vert[face[3]][1]) * 0.25,
                    (vert[face[0]][2] + vert[face[1]][2] + vert[face[2]][2] + vert[face[3]][2]) * 0.25,
                ];

                new_face_points[i] = p;
            });

            let inv_valences = valences.map(a => 1 / a);

            let new_edge_p = new Array(edges.length);

            for (let i = 0; i < edges.length; i++) {
                let vi0 = edges[i][0];
                let vi1 = edges[i][1];
                let fi0 = edges[i][2];
                let fi1 = edges[i][3];

                if (fi1 == -1) {
                    let p = [
                        (vert[vi0][0] + vert[vi1][0] + new_face_points[fi0][0]) * (1.0 / 3.0),
                        (vert[vi0][1] + vert[vi1][1] + new_face_points[fi0][1]) * (1.0 / 3.0),
                        (vert[vi0][2] + vert[vi1][2] + new_face_points[fi0][2]) * (1.0 / 3.0),
                    ];

                    new_edge_p[i] = p;

                    faces[fi0].push(i);
                } else {


                    let p = [
                        (vert[vi0][0] + vert[vi1][0] + new_face_points[fi0][0] + new_face_points[fi1][0]) * 0.25,
                        (vert[vi0][1] + vert[vi1][1] + new_face_points[fi0][1] + new_face_points[fi1][1]) * 0.25,
                        (vert[vi0][2] + vert[vi1][2] + new_face_points[fi0][2] + new_face_points[fi1][2]) * 0.25,
                    ];

                    new_edge_p[i] = p;

                    faces[fi0].push(i);
                    faces[fi1].push(i);
                }

            }

            let new_vert = vert.map((a, i) => {
                let k = valences[i] - 3;
                return [a[0] * k, a[1] * k, a[2] * k];
            });

            faces.forEach((face, i) => {
                let fp = new_face_points[i];
                for (let k = 0; k < 4; k++) {
                    let vi = face[k];
                    new_vert[vi][0] += fp[0] * inv_valences[vi];
                    new_vert[vi][1] += fp[1] * inv_valences[vi];
                    new_vert[vi][2] += fp[2] * inv_valences[vi];
                }

                for (let k = 0; k < 4; k++) {
                    let vi0 = face[k];
                    let vi1 = face[(k + 1) & 3];
                    let mid = [
                        (vert[vi0][0] + vert[vi1][0]) * 0.5,
                        (vert[vi0][1] + vert[vi1][1]) * 0.5,
                        (vert[vi0][2] + vert[vi1][2]) * 0.5,
                    ];
                    new_vert[vi0][0] += mid[0] * inv_valences[vi0];
                    new_vert[vi0][1] += mid[1] * inv_valences[vi0];
                    new_vert[vi0][2] += mid[2] * inv_valences[vi0];

                    new_vert[vi1][0] += mid[0] * inv_valences[vi1];
                    new_vert[vi1][1] += mid[1] * inv_valences[vi1];
                    new_vert[vi1][2] += mid[2] * inv_valences[vi1];
                }
            });


            new_vert.forEach((a, i) => {
                a[0] *= inv_valences[i];
                a[1] *= inv_valences[i];
                a[2] *= inv_valences[i];
            });

            let n0 = new_vert.length;

            new_vert = new_vert.concat(new_face_points);

            let n1 = new_vert.length;

            new_vert = new_vert.concat(new_edge_p);



            let new_faces = new Array(faces.length * 4);
            faces.forEach((f, i) => {

                let ee = new Array(4);
                for (let k = 0; k < 4; k++) {
                    let v0 = f[k];
                    let v1 = f[(k + 1) & 3];

                    if (v0 > v1) {
                        let tmp = v0;
                        v0 = v1;
                        v1 = tmp;
                    }

                    for (let j = 4; j < 8; j++) {
                        if (edges[f[j]][0] == v0 && edges[f[j]][1] == v1) {
                            ee[k] = f[j];
                            break;
                        }
                    }
                }

                new_faces[i * 4 + 0] = [f[0], n1 + ee[0], n0 + i, + n1 + ee[3]];
                new_faces[i * 4 + 1] = [f[1], n1 + ee[1], n0 + i, + n1 + ee[0]];
                new_faces[i * 4 + 2] = [f[2], n1 + ee[2], n0 + i, + n1 + ee[1]];
                new_faces[i * 4 + 3] = [f[3], n1 + ee[3], n0 + i, + n1 + ee[2]];
            })

            return [new_faces, new_vert];
        }



        function subdiv_generic(faces, vert, edge_extend) {

            let half_edges = new Array(vert.length);
            for (let i = 0; i < vert.length; i++)
                half_edges[i] = [];

            let edges = [];

            faces.forEach((face, i) => {

                function add_edge(i0, i1, fi) {
                    if (i0 > i1) {
                        let tmp = i0;
                        i0 = i1;
                        i1 = tmp;
                    }

                    let half_edge = half_edges[i0];
                    for (let i = 0; i < half_edge.length; i += 2) {
                        if (half_edge[i] == i1) {
                            edges.push([i0, i1, half_edge[i + 1], fi]);
                            half_edge[i] = -1;
                            return;
                        }
                    }

                    half_edge.push(i1, fi);
                }

                let n = face.length;

                for (let k = 0; k < n; k++) {
                    add_edge(face[k], face[(k + 1) % n], i);
                }
            })

            half_edges.forEach((half_edge, i0) => {
                for (let k = 0; k < half_edge.length; k += 2) {
                    if (half_edge[k] != -1) {
                        edges.push([i0, half_edge[k], half_edge[k + 1], -1]);
                    }
                }
            })

            if (edge_extend) {
                half_edges.forEach((half_edge, i0) => {
                    for (let k = 0; k < half_edge.length; k += 2) {
                        if (half_edge[k] != -1 && half_edge[k] > i0) {

                            half_edges[half_edge[k]].push(i0, -1);
                        }
                    }
                })
            }


            let valences = new Array(vert.length).fill(0);

            let new_face_points = new Array(faces.length);
            faces.forEach((face, i) => {
                let n = face.length;

                let p = [0, 0, 0];
                for (let k = 0; k < n; k++) {
                    valences[face[k]]++;
                    p[0] += vert[face[k]][0];
                    p[1] += vert[face[k]][1];
                    p[2] += vert[face[k]][2];
                }
                let inv_n = 1 / n;

                new_face_points[i] = [p[0] * inv_n, p[1] * inv_n, p[2] * inv_n];
            });

            let inv_valences = valences.map(a => 1 / a);

            let new_edge_p = new Array(edges.length);

            for (let i = 0; i < edges.length; i++) {
                let vi0 = edges[i][0];
                let vi1 = edges[i][1];
                let fi0 = edges[i][2];
                let fi1 = edges[i][3];

                if (fi1 == -1) {
                    let p;

                    if (edge_extend) {
                        p = [
                            (vert[vi0][0] + vert[vi1][0]) * 0.5,
                            (vert[vi0][1] + vert[vi1][1]) * 0.5,
                            (vert[vi0][2] + vert[vi1][2]) * 0.5,
                        ];
                    } else {
                        p = [
                            (vert[vi0][0] + vert[vi1][0] + new_face_points[fi0][0]) * (1.0 / 3.0),
                            (vert[vi0][1] + vert[vi1][1] + new_face_points[fi0][1]) * (1.0 / 3.0),
                            (vert[vi0][2] + vert[vi1][2] + new_face_points[fi0][2]) * (1.0 / 3.0),
                        ];
                    }



                    new_edge_p[i] = p;

                    faces[fi0].push(i);
                } else {


                    let p = [
                        (vert[vi0][0] + vert[vi1][0] + new_face_points[fi0][0] + new_face_points[fi1][0]) * 0.25,
                        (vert[vi0][1] + vert[vi1][1] + new_face_points[fi0][1] + new_face_points[fi1][1]) * 0.25,
                        (vert[vi0][2] + vert[vi1][2] + new_face_points[fi0][2] + new_face_points[fi1][2]) * 0.25,
                    ];

                    new_edge_p[i] = p;

                    faces[fi0].push(i);
                    faces[fi1].push(i);
                }

            }

            let new_vert = vert.map((a, i) => {
                let k = valences[i] - 3;
                return [a[0] * k, a[1] * k, a[2] * k];
            });

            faces.forEach((face, i) => {
                let fp = new_face_points[i];
                let n = face.length / 2;

                for (let k = 0; k < n; k++) {
                    let vi = face[k];
                    new_vert[vi][0] += fp[0] * inv_valences[vi];
                    new_vert[vi][1] += fp[1] * inv_valences[vi];
                    new_vert[vi][2] += fp[2] * inv_valences[vi];
                }

                for (let k = 0; k < n; k++) {
                    let vi0 = face[k];
                    let vi1 = face[(k + 1) % n];
                    let mid = [
                        (vert[vi0][0] + vert[vi1][0]) * 0.5,
                        (vert[vi0][1] + vert[vi1][1]) * 0.5,
                        (vert[vi0][2] + vert[vi1][2]) * 0.5,
                    ];
                    new_vert[vi0][0] += mid[0] * inv_valences[vi0];
                    new_vert[vi0][1] += mid[1] * inv_valences[vi0];
                    new_vert[vi0][2] += mid[2] * inv_valences[vi0];

                    new_vert[vi1][0] += mid[0] * inv_valences[vi1];
                    new_vert[vi1][1] += mid[1] * inv_valences[vi1];
                    new_vert[vi1][2] += mid[2] * inv_valences[vi1];
                }
            });


            new_vert.forEach((a, i) => {
                a[0] *= inv_valences[i];
                a[1] *= inv_valences[i];
                a[2] *= inv_valences[i];
            });


            let n0 = new_vert.length;

            if (edge_extend) {
                for (let i = 0; i < n0; i++) {
                    if (valences[i] > 3)
                        continue;

                    let p = vert[i].slice();
                    p[0] *= 0.75;
                    p[1] *= 0.75;
                    p[2] *= 0.75;

                    let half_edge = half_edges[i];
                    for (let k = 0; k < half_edge.length; k += 2) {
                        if (half_edge[k] != -1) {
                            let pp = vert[half_edge[k]];
                            p[0] += pp[0] * 0.125;
                            p[1] += pp[1] * 0.125;
                            p[2] += pp[2] * 0.125;
                        }
                    }
                    new_vert[i] = p;
                }

            }
            new_vert = new_vert.concat(new_face_points);

            let n1 = new_vert.length;

            new_vert = new_vert.concat(new_edge_p);



            let new_faces = [];
            faces.forEach((f, i) => {

                let n = f.length / 2;
                let ee = new Array(n);
                for (let k = 0; k < n; k++) {
                    let v0 = f[k];
                    let v1 = f[(k + 1) % n];

                    if (v0 > v1) {
                        let tmp = v0;
                        v0 = v1;
                        v1 = tmp;
                    }

                    for (let j = n; j < f.length; j++) {
                        if (edges[f[j]][0] == v0 && edges[f[j]][1] == v1) {
                            if (edge_extend)
                                ee[k] = f[j];
                            else
                                ee[k] = edges[f[j]][3] == -1 ? -1 : f[j];
                            break;
                        }
                    }
                }

                for (let k = 0; k < n; k++) {
                    if (ee[k] == -1 || ee[(k + n - 1) % n] == -1)
                        continue;
                    new_faces.push([f[k], n1 + ee[k], n0 + i, + n1 + ee[(k + n - 1) % n]]);
                }
            })

            if (!edge_extend) {
                let not_used = new Array(new_vert.length).fill(1);

                new_faces.forEach(f => f.forEach(i => not_used[i] = 0));
                new_vert = new_vert.filter((a, i) => not_used[i] == 0);

                for (let i = 1; i < not_used.length; i++) {
                    not_used[i] += not_used[i - 1];
                }

                new_faces.forEach(f => {
                    for (let i = 0; i < f.length; i++)
                        f[i] -= not_used[f[i]];
                })
            }

            return [new_faces, new_vert];
        }

        function make_face_points(f, p) {
            let face_points = new Float32Array(f.length * 4 * 2 * 3);

            for (let i = 0; i < f.length; i++) {

                let face = f[i];
                let p0 = p[face[0]];
                let p1 = p[face[1]];
                let p2 = p[face[2]];
                let p3 = p[face[3]];
                // if (tri)
                //     p3 = p2;

                let d0 = [p2[0] - p0[0], p2[1] - p0[1], p2[2] - p0[2]];
                let d1 = [p3[0] - p1[0], p3[1] - p1[1], p3[2] - p1[2]];

                let n = [d0[1] * d1[2] - d0[2] * d1[1],
                -d0[0] * d1[2] + d0[2] * d1[0],
                d0[0] * d1[1] - d0[1] * d1[0]]

                face_points[i * 8 * 3 + 3 * 0 + 0] = p0[0];
                face_points[i * 8 * 3 + 3 * 0 + 1] = p0[1];
                face_points[i * 8 * 3 + 3 * 0 + 2] = p0[2];
                face_points[i * 8 * 3 + 3 * 1 + 0] = n[0];
                face_points[i * 8 * 3 + 3 * 1 + 1] = n[1];
                face_points[i * 8 * 3 + 3 * 1 + 2] = n[2];
                face_points[i * 8 * 3 + 3 * 2 + 0] = p1[0];
                face_points[i * 8 * 3 + 3 * 2 + 1] = p1[1];
                face_points[i * 8 * 3 + 3 * 2 + 2] = p1[2];
                face_points[i * 8 * 3 + 3 * 3 + 0] = n[0];
                face_points[i * 8 * 3 + 3 * 3 + 1] = n[1];
                face_points[i * 8 * 3 + 3 * 3 + 2] = n[2];
                face_points[i * 8 * 3 + 3 * 4 + 0] = p2[0];
                face_points[i * 8 * 3 + 3 * 4 + 1] = p2[1];
                face_points[i * 8 * 3 + 3 * 4 + 2] = p2[2];
                face_points[i * 8 * 3 + 3 * 5 + 0] = n[0];
                face_points[i * 8 * 3 + 3 * 5 + 1] = n[1];
                face_points[i * 8 * 3 + 3 * 5 + 2] = n[2];
                face_points[i * 8 * 3 + 3 * 6 + 0] = p3[0];
                face_points[i * 8 * 3 + 3 * 6 + 1] = p3[1];
                face_points[i * 8 * 3 + 3 * 6 + 2] = p3[2];
                face_points[i * 8 * 3 + 3 * 7 + 0] = n[0];
                face_points[i * 8 * 3 + 3 * 7 + 1] = n[1];
                face_points[i * 8 * 3 + 3 * 7 + 2] = n[2];
            }
            return face_points;
        }


        function bisect(a, b, f) {
            let fa = f(a);
            // let fb = f(b);

            for (let i = 0; i < 30; i++) {
                let mid = (a + b) / 2;
                let fmid = f(mid);

                if (Math.abs(fmid) < 0.000001)
                    return mid;

                if ((fmid > 0 && fa > 0) || (fmid < 0 && fa < 0)) {
                    a = mid;
                    fa = f(a);
                } else {
                    b = mid;
                    // fb = f(b);
                }
            }

            return a;
        }


        this.repaint = function () {

            self.requested_repaint = false;

            if (!self.visible)
                return;

            if (width == 0 || height == 0)
                return;

            self.was_drawn = true;

            let ctx = canvas.getContext("2d");

            ctx.resetTransform();
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.scale(scale, scale);
            ctx.globalCompositeOperation = "source-over";

            ctx.lineCap = "round";
            ctx.lineJoin = "round";

            let font_size = 21;

            if (window.innerWidth < 500)
                font_size = 18;

            if (window.innerWidth < 400)
                font_size = 16;

            ctx.font = font_size + "px IBM Plex Sans";
            ctx.textAlign = "center";
            ctx.globalAlpha = 1.0;

            let vp = mat4_mul(proj, mat3_to_mat4(rot));


            function draw_control_lines(points, stride) {
                if (!stride)
                    stride = points.length;

                ctx.strokeStyle = "rgba(0,0,0,0.2)";
                ctx.lineWidth = 1;

                for (let k = 0; k < points.length; k += stride) {
                    for (let i = 0; i < stride - 1; i++) {
                        let p0 = points[k + i];
                        let p1 = points[k + i + 1];
                        let d = vec_sub(p1, p0).slice(0, 2);
                        let l = vec_len(d);
                        if (l <= 2 * control_points_size)
                            continue;

                        p0 = vec_add(p0, vec_scale(d, control_points_size / l));
                        p1 = vec_sub(p1, vec_scale(d, control_points_size / l));
                        ctx.beginPath();
                        ctx.lineTo(p0[0], p0[1]);
                        ctx.lineTo(p1[0], p1[1]);
                        ctx.stroke();
                    }

                }
            }

            function draw_control_points(points, labels) {


                ctx.fillStyle = "rgba(255,255,255,0.4)";
                ctx.strokeStyle = "#333";
                ctx.lineWidth = 2;


                points.forEach((a, i) => {
                    ctx.fillEllipse(a[0], a[1], control_points_size);
                    ctx.strokeEllipse(a[0], a[1], control_points_size);
                    if (labels)
                        ctx.fillText(labels[i], a[0], a[1] - control_points_size - 7);
                });

                if (labels) {
                    ctx.fillStyle = "#333";
                    points.forEach((a, i) => {
                        ctx.fillText(labels[i], a[0], a[1] - control_points_size - 7);
                    });
                }

                if (selected_point !== undefined) {
                    ctx.lineWidth = 4;
                    ctx.strokeEllipse(points[selected_point][0], points[selected_point][1], control_points_size + 2);

                }
            }

            function draw_st(s, t, lines, circle_r) {
                ctx.save();

                let pad = 9;
                let off = 6;
                let t_style = "#6ea7d6";
                let s_style = "#EBBC3F";

                let w = Math.ceil(width * 0.2);
                ctx.translate(pad, height - w - pad);

                ctx.fillStyle = "rgba(0,0,0,0.05)";
                ctx.fillRect(0, 0, w, w);
                ctx.strokeStyle = "rgba(0,0,0,0.1)";
                ctx.strokeRect(0, 0, w, w);

                if (circle_r !== undefined) {
                    ctx.save();
                    ctx.beginPath();
                    ctx.rect(0, 0, w, w);
                    ctx.clip();

                    ctx.globalAlpha = 0.6;
                    ctx.fillStyle = red_style;
                    ctx.fillEllipse(w * 0.6, w * 0.2, circle_r * w);
                    ctx.restore();
                }

                if (lines) {
                    ctx.strokeStyle = "rgba(0,0,0,0.2)"
                    let n = 10;
                    for (let i = 0; i <= n; i++) {
                        let tt = i / n;
                        ctx.beginPath();
                        ctx.lineTo(0, w * tt);
                        ctx.lineTo(w, w * tt);
                        ctx.stroke();

                        ctx.beginPath();
                        ctx.lineTo(w * tt, 0);
                        ctx.lineTo(w * tt, w);
                        ctx.stroke();
                    }
                }

                ctx.lineWidth = 2;
                ctx.lineCap = "round";

                ctx.strokeStyle = ctx.fillStyle = t_style;
                ctx.globalAlpha = 0.5;
                ctx.beginPath();
                ctx.lineTo(0, w + off);
                ctx.lineTo(w, w + off);
                ctx.stroke();
                ctx.globalAlpha = 1;
                ctx.beginPath();
                ctx.lineTo(0, w + off);
                ctx.lineTo(w * t, w + off);
                ctx.stroke();
                ctx.fillEllipse(w * t, w + off, 3);

                ctx.strokeStyle = ctx.fillStyle = s_style;
                ctx.globalAlpha = 0.5;
                ctx.beginPath();
                ctx.lineTo(-off, w);
                ctx.lineTo(-off, 0);
                ctx.stroke();
                ctx.globalAlpha = 1;
                ctx.beginPath();
                ctx.lineTo(-off, w);
                ctx.lineTo(-off, w - w * s);
                ctx.stroke();
                ctx.fillEllipse(-off, w - w * s, 3);


                ctx.fillStyle = "#333"
                ctx.fillEllipse(w * t, w - w * s, 3);

                ctx.restore();
            }


            function draw_zoom(r0, r1, p0, p1) {
                let diff = vec_sub(p1, p0);
                let a = Math.atan2(-diff[0], diff[1]);

                ctx.save();
                ctx.translate(p0[0], p0[1]);
                ctx.rotate(a);

                ctx.lineWidth = 2;
                ctx.strokeStyle = "#666";

                ctx.beginPath();
                ctx.ellipse(0, 0, r0, r0, 0, 0, 2 * Math.PI);
                ctx.stroke();

                ctx.lineWidth = 1;
                ctx.strokeStyle = "rgba(50,50,50,0.4)";

                ctx.setLineDash([2, 2]);

                var d = vec_len(diff);

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

                ctx.strokeStyle = "rgba(50,50,50,0.5)";

                ctx.setLineDash([]);
                ctx.lineWidth = 1.0;

                ctx.beginPath();
                ctx.ellipse(0, d, r1, r1, 0, 0, 2 * Math.PI);
                ctx.stroke();

                ctx.restore();
            }


            function draw_plot(w, h, fs, t, selected, domain, n, points, circle_points, draw_sum) {

                if (!domain)
                    domain = [0, 1];

                if (!n)
                    n = Math.ceil(w * 0.5);

                function draw_plot_func(ctx, w, h, f) {
                    ctx.beginPath();
                    let prev = NaN;
                    for (let i = 0; i <= n; i++) {
                        let t = domain[0] + (domain[1] - domain[0]) * i / n;
                        let pt = domain[0] + (domain[1] - domain[0]) * (i - 1) / n;

                        let val = f(t);


                        if (prev != val || i == n || i == 0) {
                            if (prev == 0) {
                                ctx.lineTo(w * pt, h - f(pt) * h);
                            }

                            if (pt < 0 && t > 0) {
                                ctx.lineTo(w * (-0.0001), h - f(-0.0001) * h);
                                ctx.lineTo(w * (0.0001), h - f(0.0001) * h);
                            }

                            if (pt < 1 && t > 1) {
                                ctx.lineTo(w * (1 - 0.0001), h - f(1 - 0.0001) * h);
                                ctx.lineTo(w * (1 + 0.0001), h - f(1 + 0.0001) * h);
                            }


                            ctx.lineTo(w * t, h - val * h);
                            prev = val;
                        }
                    }

                    ctx.stroke();
                }

                ctx.save();


                if (selected !== undefined) {
                    let lw = 5;
                    ctx.lineWidth = lw;
                    draw_plot_func(ctx, w, h, fs[selected]);

                    ctx.save();
                    ctx.globalCompositeOperation = "source-atop";

                    let grd = ctx.createLinearGradient(0, 0, 0, h);
                    for (let i = 0; i <= 20; i++) {
                        grd.addColorStop(1 - i / 20, weight_style(i / 20));
                    }

                    ctx.fillStyle = grd;

                    ctx.fillRect(-w, -lw, w * 3, h + 2 * lw);
                    ctx.restore();
                }



                ctx.globalCompositeOperation = "destination-over";


                ctx.strokeStyle = "#ddd";
                ctx.lineWidth = 2;
                fs.forEach(f => { draw_plot_func(ctx, w, h, f); });


                if (draw_sum) {
                    ctx.globalCompositeOperation = "source-over";

                    ctx.strokeStyle = "#EBBC3F";
                    ctx.lineWidth = 4;
                    draw_plot_func(ctx, w, h, function (t) {
                        let r = 0;
                        fs.forEach(f => r += f(t));
                        return r;
                    });
                }

                ctx.fillStyle = "rgba(0,0,0,0.6)";
                ctx.globalCompositeOperation = "destination-out";

                ctx.fillRect(-w, -5, w - 0.5, h + 10);
                ctx.fillRect(w + 0.5, -5, w, h + 10);

                ctx.globalCompositeOperation = "destination-over";


                ctx.fillStyle = "red";


                ctx.lineWidth = 1;

                ctx.strokeStyle = "#aaa";


                ctx.setLineDash([2, 4]);

                ctx.beginPath();
                ctx.lineTo(0, 0);
                ctx.lineTo(w, 0);
                ctx.stroke();

                ctx.strokeStyle = "#ccc";


                ctx.setLineDash([]);

                ctx.beginPath();
                ctx.lineTo(0, h);
                ctx.lineTo(w, h);
                ctx.stroke();

                ctx.beginPath();
                ctx.lineTo(0, 0);
                ctx.lineTo(0, h);
                ctx.stroke();

                ctx.beginPath();
                ctx.lineTo(w, 0);
                ctx.lineTo(w, h);
                ctx.stroke();

                ctx.globalCompositeOperation = "source-over";
                ctx.strokeStyle = "rgba(0,0,0,0.4)";


                ctx.beginPath();
                ctx.lineTo(w * t, 0);
                ctx.lineTo(w * t, h);
                ctx.stroke();

                ctx.globalCompositeOperation = "source-over";

                if (points) {
                    if (circle_points)
                        ctx.fillStyle = "black";
                    else
                        ctx.fillStyle = "#0979AC";

                    points.forEach(x => {
                        if (circle_points) {
                            ctx.fillEllipse(x * w, h, 2);
                            return;
                        }
                        ctx.beginPath();
                        ctx.lineTo(x * w, h);
                        ctx.lineTo(x * w - 3, h + 7);
                        ctx.lineTo(x * w + 3, h + 7);
                        ctx.fill();
                    })
                }


                ctx.restore();
            }




            function draw_cubic_bezier(points) {
                ctx.beginPath();
                {
                    let p = cubic_bezier(0, points);
                    ctx.lineTo(p[0], p[1]);
                    p = cubic_bezier(0.0001, points);
                    ctx.lineTo(p[0], p[1]);
                }

                let n = 128;
                for (let i = 0; i <= n; i++) {
                    let t = i / n;
                    let p = cubic_bezier(t, points);


                    ctx.lineTo(p[0], p[1]);
                }
                ctx.stroke();
            }

            function draw_comb(points, np, scale) {

                ctx.strokeStyle = "#777";

                for (let i = 0; i <= np; i++) {
                    let t = i / np;


                    let p = cubic_bezier(t, points);

                    let tan = cubic_bezier_tangent(t, points);
                    let len = vec_len(tan);
                    let snd = cubic_bezier_2nd_derivative(t, points);
                    let n = vec_scale([-tan[1], tan[0]], 1 / len);
                    let k = (tan[0] * snd[1] - snd[0] * tan[1]) / (len * len * len);
                    let c = vec_add(p, vec_scale(n, -k * scale));

                    ctx.beginPath();
                    ctx.lineTo(p[0], p[1]);
                    ctx.lineTo(c[0], c[1]);
                    ctx.stroke();

                }
            }

            function weight_style(w) {

                let v0 = [220, 220, 220];
                let v1 = [243, 0, 0];
                let v = vec_lerp(v0, v1, Math.min(1.0, w));
                return "rgb(" + Math.ceil(v[0]) + "," + Math.ceil(v[1]) + "," + Math.ceil(v[2]) + ")";
            }

            function curvature_style(w) {
                w *= 30.0;
                let aw = Math.min(1, Math.abs(w));
                let v0 = [220, 220, 220];
                let v1 = [255, 142, 0];
                let v2 = [0, 83, 255];
                let v = w < 0 ? vec_lerp(v0, v2, aw) : vec_lerp(v0, v1, aw);
                return "rgb(" + Math.ceil(v[0]) + "," + Math.ceil(v[1]) + "," + Math.ceil(v[2]) + ")";
            }

            if (mode === "linear_patch" || mode === "linear_patch_quad_curve" ||
                mode === "linear_patch_quad_curve_flat" ||
                mode === "linear_patch_symmetry" || mode === "linear_patch_point" ||
                mode === "linear_patch_point2" || mode === "linear_patch_point3" ||
                mode === "linear_patch_point4") {
                gl.begin(width, height)

                let qp = points;

                if (mode === "linear_patch_quad_curve_flat") {
                    qp = qp.slice();
                    qp[3] = qp[2];
                    qp[2] = qp[1];
                }

                let p10 = vec_lerp(qp[0], qp[2], 1 / 3);
                let p13 = vec_lerp(qp[1], qp[3], 1 / 3);
                let p20 = vec_lerp(qp[0], qp[2], 2 / 3);
                let p23 = vec_lerp(qp[1], qp[3], 2 / 3);

                let pp = [qp[0],
                vec_lerp(qp[0], qp[1], 1 / 3),
                vec_lerp(qp[0], qp[1], 2 / 3),
                qp[1],

                    p10,
                vec_lerp(p10, p13, 1 / 3),
                vec_lerp(p10, p13, 2 / 3),
                    p13,

                    p20,
                vec_lerp(p20, p23, 1 / 3),
                vec_lerp(p20, p23, 2 / 3),
                    p23,

                qp[2],
                vec_lerp(qp[2], qp[3], 1 / 3),
                vec_lerp(qp[2], qp[3], 2 / 3),
                qp[3]];

                let lp0 = vec_lerp(qp[0], qp[2], arg0);
                let lp1 = vec_lerp(qp[1], qp[3], arg0);
                let lpp = vec_lerp(lp0, lp1, arg1);

                let line_ps = [];

                let tar_p;

                if (mode === "linear_patch") {
                    let curves_p = [
                        pp[0], pp[4], pp[8], pp[12],
                        pp[3], pp[7], pp[11], pp[15],
                        lp0, vec_lerp(lp0, lp1, 1 / 3), vec_lerp(lp0, lp1, 2 / 3), lp1
                    ]

                    let curves_colors = [
                        blue_color,
                        blue_color,
                        yellow_color,

                    ]

                    gl.draw_bezier_curves(vp, rot, curves_colors, curves_p);
                    gl.draw_points(vp, rot, curves_colors, flatten([lp0, lp1]), 0.03);

                    gl.draw_trim_bezier_patch(vp, rot, yellow_color, pp, [2, arg0, 0, 0]);
                } else if (mode === "linear_patch_point" || mode === "linear_patch_point4") {
                    let curves_p = [
                        pp[0], pp[4], pp[8], pp[12],
                        pp[3], pp[7], pp[11], pp[15],
                        lp0, vec_lerp(lp0, lp1, 1 / 3), vec_lerp(lp0, lp1, 2 / 3), lp1
                    ]

                    let curves_colors = flatten([
                        blue_color,
                        blue_color,
                        yellow_color
                    ]);

                    gl.draw_bezier_curves(vp, rot, curves_colors, curves_p);
                    gl.draw_points(vp, rot, curves_colors, flatten([lp0, lp1, lpp]), 0.03);

                    gl.draw_bezier_patches(vp, rot, gray_color, pp);
                } else {


                    line_ps = [qp[0], qp[1],
                    qp[0], qp[2],
                    qp[3], qp[1],
                    qp[3], qp[2]];

                    if (mode === "linear_patch_quad_curve" || mode === "linear_patch_quad_curve_flat") {
                        let quad = [qp[0], vec_lerp(qp[1], qp[2], 0.5), qp[3]];
                        let cubic = [quad[0],
                        vec_add(quad[0], vec_scale(vec_sub(quad[1], quad[0]), 2 / 3)),
                        vec_sub(quad[2], vec_scale(vec_sub(quad[2], quad[1]), 2 / 3)),
                        quad[2]];

                        tar_p = cubic_bezier(arg0, cubic);

                        gl.draw_bezier_patches(vp, rot, gray_color, pp, 0.6);
                        gl.draw_bezier_curves(vp, rot, red_color, cubic);
                        gl.draw_points(vp, rot, black_color, tar_p, 0.024);
                    }
                    else if (mode === "linear_patch_symmetry") {

                        let p00 = vec_lerp(points[0], points[2], arg0);
                        let p01 = vec_lerp(points[1], points[3], arg0);
                        let p10 = vec_lerp(points[0], points[1], arg1);
                        let p11 = vec_lerp(points[2], points[3], arg1);

                        let curves_p = [
                            p00,
                            vec_lerp(p00, p01, 1 / 3),
                            vec_lerp(p00, p01, 2 / 3),
                            p01,

                            p10,
                            vec_lerp(p10, p11, 1 / 3),
                            vec_lerp(p10, p11, 2 / 3),
                            p11
                        ];


                        let curves_colors = flatten([
                            yellow_color,
                            blue_color,
                        ]);

                        gl.draw_trim_bezier_patch(vp, rot, yellow_color, pp, [2, arg0, 0, 0]);
                        gl.draw_trim_bezier_patch(vp, rot, blue_color, pp, [arg1, 2, 0, 0]);
                        gl.draw_trim_bezier_patch(vp, rot, gray_color, pp, [arg1, arg0, 0, 0]);

                        gl.draw_bezier_curves(vp, rot, curves_colors, curves_p);
                    } else if (mode === "linear_patch_point2") {

                        gl.draw_points(vp, rot, black_color, lpp, 0.024);

                        gl.draw_bezier_patches(vp, rot, gray_color, pp, 0.6);

                    } else if (mode === "linear_patch_point3") {
                        gl.draw_points(vp, rot, black_color, lpp, 0.024);

                        gl.draw_bezier_patches(vp, rot, gray_color, pp, 0.6, true);
                    }
                }

                gl.draw_lines(vp, rot, line_color, line_ps);
                gl.draw_control_points(vp, rot, qp);

                if (mode === "linear_patch_point4") {

                    let ps = points.slice();
                    ps.push(lp0, lp1, lpp);

                    gl.draw_glyphs(vp, ps, [0, 1, 2, 3, 5, 6, 4]);
                } else if (mode === "linear_patch_quad_curve") {
                    let ps = points.slice();
                    ps.push(lpp);

                    gl.draw_glyphs(vp, ps, [0, 1, 2, 3, 4]);
                } else if (mode === "linear_patch_quad_curve_flat") {
                    let ps = points.slice();
                    ps.splice(3, 1);
                    ps.push(tar_p);

                    gl.draw_glyphs(vp, ps, [0, 1, 3, 4]);
                }

                ctx.drawImage(gl.finish(), 0, 0, width, height);

                ctx.feather(canvas.width, canvas.height, canvas.height * 0.05, canvas.height * 0.05, canvas.height * 0.05, canvas.height * 0.05);

                let axm = rot_z_mat3(Math.PI);

                if (mode === "linear_patch_point2" || mode === "linear_patch_point3" || mode === "linear_patch_quad_curve") {


                    axm = rot_y_mat3(Math.PI);
                    if (mode === "linear_patch_quad_curve")
                        arg1 = arg0;

                    draw_st(arg0, arg1, mode === "linear_patch_point3");
                }


                ctx.translate(width - 10, height - 10);


                draw_camera_axes(ctx, 10, mat3_mul(rot, axm));
            } else if (mode === "continuities") {


                let p = ss_points.slice();


                let p0 = p.slice(0, 4);
                let p1 = p.slice(4);


                draw_control_lines(p0);
                draw_control_points(p0);

                draw_control_lines(p1);
                draw_control_points(p1);

                ctx.lineWidth = base_line_width;

                ctx.strokeStyle = red_style;
                draw_cubic_bezier(p0);

                ctx.strokeStyle = "#EBBC3F";
                draw_cubic_bezier(p1);

                ctx.lineWidth = 1;
                draw_comb(p0, 96, 2000 * width / 700);

                draw_comb(p1, 96, 2000 * width / 700);

                ctx.feather(canvas.width, canvas.height, canvas.height * 0.05, canvas.height * 0.05, canvas.height * 0.05, canvas.height * 0.05);

            } else if (mode === "linear_segment_3d") {

                gl.begin(width, height)

                let end = vec_lerp(points[0], points[1], arg0);
                let curves_p = [
                    points[0],
                    vec_lerp(points[0], points[1], arg0 / 3),
                    vec_lerp(points[0], points[1], arg0 * 2 / 3),
                    end,
                ]

                let curves_colors = [
                    red_color

                ]

                gl.draw_bezier_curves(vp, rot, curves_colors, curves_p, 0.02);
                gl.draw_points(vp, rot, curves_colors, end, 0.03);

                gl.draw_control_points(vp, rot, points);

                gl.draw_glyphs(vp, points, [0, 1]);

                ctx.drawImage(gl.finish(), 0, 0, width, height);

                ctx.feather(canvas.width, canvas.height, canvas.height * 0.05, canvas.height * 0.05, canvas.height * 0.05, canvas.height * 0.05);

                ctx.translate(width - 10, height - 10);
                draw_camera_axes(ctx, 10, mat3_mul(rot, rot_z_mat3(Math.PI)));

            } else if (mode === "cubic_bezier_3d") {

                gl.begin(width, height)

                gl.draw_bezier_curves(vp, rot, [red_color], points, 0.02);
                gl.draw_glyphs(vp, points, [0, 1, 2, 3, 4]);

                gl.draw_control_points(vp, rot, points);
                gl.draw_lines(vp, rot, line_color, [points[0], points[1], points[1], points[2], points[2], points[3]]);

                ctx.drawImage(gl.finish(), 0, 0, width, height);

                ctx.feather(canvas.width, canvas.height, canvas.height * 0.05, canvas.height * 0.05, canvas.height * 0.05, canvas.height * 0.05);

                ctx.translate(width - 10, height - 10);
                draw_camera_axes(ctx, 10, mat3_mul(rot, rot_z_mat3(Math.PI)));

            } else if (mode === "cubic_patch" || mode === "cubic_patch2" ||
                mode === "cubic_linear_patch" || mode === "surface" || mode === "nurbs_hole") {

                let bezier_patch_points = points;
                let lines_points = [];
                let bezier_curves = [];
                let bezier_colors = [];

                if (mode === "cubic_patch" || mode === "cubic_patch2" || mode === "nurbs_hole") {
                    for (let i = 0; i < 3; i++) {
                        for (let k = 0; k < 4; k++) {
                            lines_points.push(points[k * 4 + i]);
                            lines_points.push(points[k * 4 + i + 1]);
                            lines_points.push(points[k + i * 4]);
                            lines_points.push(points[k + i * 4 + 4]);
                        }
                    }

                }
                if (mode === "cubic_linear_patch" || mode === "surface") {
                    bezier_patch_points = [];

                    for (let i = 0; i < 4; i++) {
                        bezier_patch_points.push(points[i]);
                        bezier_patch_points.push(vec_lerp(points[i], points[i + 4], 1 / 3));
                        bezier_patch_points.push(vec_lerp(points[i], points[i + 4], 2 / 3));
                        bezier_patch_points.push(points[i + 4]);
                    }

                    if (mode === "cubic_linear_patch") {

                        for (let i = 0; i < 3; i++) {

                            lines_points.push(points[i]);
                            lines_points.push(points[i + 1]);
                            lines_points.push(points[i + 4]);
                            lines_points.push(points[i + 4 + 1]);
                        }
                    }

                    if (mode === "cubic_linear_patch") {
                        bezier_curves = points.slice();

                        bezier_colors = [
                            purple_color,
                            purple_color,
                            yellow_color
                        ]
                    } else {
                        bezier_colors = [red_color];
                    }

                    let t = arg0;

                    let p0 = cubic_bezier(t, points);
                    let p1 = cubic_bezier(t, points.slice(4));

                    bezier_curves.push(p0);
                    bezier_curves.push(vec_lerp(p0, p1, 1 / 3));
                    bezier_curves.push(vec_lerp(p0, p1, 2 / 3));
                    bezier_curves.push(p1);


                }


                let trim_color = red_color;

                if (mode === "cubic_linear_patch") {
                    trim_color = yellow_color;
                }

                gl.begin(width, height)

                let rr = arg2 * 0.7;

                if (mode === "cubic_patch2") {
                    gl.draw_bezier_patches(vp, rot, gray_color, bezier_patch_points, 0.5, true);
                    let p = cubic_bezier_patch([arg0, arg1], bezier_patch_points);
                    gl.draw_points(vp, rot, black_color, p, 0.024);
                } else if (mode === "nurbs_hole") {

                    gl.draw_trim_bezier_patch(vp, rot, gray_color, bezier_patch_points, [2, 2, rr * rr, 0]);
                    let p = cubic_bezier_patch([arg0, arg1], bezier_patch_points);
                    gl.draw_points(vp, rot, black_color, p, 0.024);
                }
                else if (mode !== "surface" && mode !== "cubic_linear_patch")
                    gl.draw_bezier_patches(vp, rot, mode === "cubic_patch" ? yellow_color : red_color, bezier_patch_points);
                else
                    gl.draw_trim_bezier_patch(vp, rot, trim_color, bezier_patch_points, [2, arg0, 0, 0]);

                if (bezier_curves.length)
                    gl.draw_bezier_curves(vp, rot, bezier_colors, bezier_curves);

                if (lines_points.length)
                    gl.draw_lines(vp, rot, line_color, lines_points);

                if (mode === "cubic_patch") {
                    let ind = [];
                    for (let i = 0; i < 16; i++)
                        ind.push(i + 7);
                    gl.draw_glyphs(vp, points, ind);
                }

                if (mode !== "surface")
                    gl.draw_control_points(vp, rot, points);

                ctx.drawImage(gl.finish(), 0, 0, width, height);
                ctx.feather(canvas.width, canvas.height, canvas.height * 0.05, canvas.height * 0.05, canvas.height * 0.05, canvas.height * 0.05);

                if (mode === "cubic_patch2" || mode === "nurbs_hole") {
                    draw_st(arg0, arg1, mode === "cubic_patch2", mode === "nurbs_hole" ? rr : undefined);

                }


                ctx.translate(width - 10, height - 10);
                draw_camera_axes(ctx, 10, mat3_mul(rot, rot_z_mat3(0)));
            } else if (mode === "two_cubic_patches" || mode === "two_cubic_patches_normals") {

                let lines_points = [];


                for (let p = 0; p < 2; p++) {
                    for (let i = 0; i < 3; i++) {
                        for (let k = 0; k < 4; k++) {
                            lines_points.push(points[p * 16 + k * 4 + i]);
                            lines_points.push(points[p * 16 + k * 4 + i + 1]);
                            lines_points.push(points[p * 16 + k + i * 4]);
                            lines_points.push(points[p * 16 + k + i * 4 + 4]);
                        }
                    }
                }

                let colors = [
                    purple_color,
                    yellow_color
                ]

                if (mode === "two_cubic_patches_normals") {
                    colors[0] = vec_lerp([1, 1, 1, 1], colors[0], 0.8);
                    colors[1] = vec_lerp([1, 1, 1, 1], colors[1], 0.8);
                }

                gl.begin(width, height)
                gl.draw_bezier_patches(vp, rot, colors, points);

                if (mode === "two_cubic_patches_normals") {
                    for (let k = 0; k < 2; k++) {

                        let pp = points.slice(k * 16);

                        let color = k == 0 ? purple_color : yellow_color;

                        for (let i = 0; i < 8; i++) {
                            let st = [(i + 0.25 + 0.5 * k) / 8, 1 - k];


                            let p0 = cubic_bezier(st[0], pp.slice(0, 4));
                            let p1 = cubic_bezier(st[0], pp.slice(4, 8));
                            let p2 = cubic_bezier(st[0], pp.slice(8, 12));
                            let p3 = cubic_bezier(st[0], pp.slice(12, 16));

                            let t0 = vec_norm(cubic_bezier_tangent(st[1], [p0, p1, p2, p3]));


                            p0 = cubic_bezier(st[1], [pp[0], pp[4], pp[8], pp[12]]);
                            p1 = cubic_bezier(st[1], [pp[1], pp[5], pp[9], pp[13]]);
                            p2 = cubic_bezier(st[1], [pp[2], pp[6], pp[10], pp[14]]);
                            p3 = cubic_bezier(st[1], [pp[3], pp[7], pp[11], pp[15]]);

                            let t1 = vec_norm(cubic_bezier_tangent(st[0], [p0, p1, p2, p3]));

                            let n = vec_norm(vec_cross(t1, t0));

                            let p = cubic_bezier_patch(st, pp);
                            let arrow_mat = mat4_mul(vp, translation_mat4(p));
                            arrow_mat = mat4_mul(arrow_mat, scale_mat4(0.01));

                            let arrow_rot = mat3_transpose(flatten([t0, vec_norm(vec_cross(n, t0)), n]));

                            arrow_mat = mat4_mul(arrow_mat, mat3_to_mat4(arrow_rot));
                            arrow_mat = mat4_mul(arrow_mat, translation_mat4([0, 0, 0.2]));

                            gl.draw_arrow(arrow_mat, mat3_mul(rot, arrow_rot), color);
                        }
                    }
                }



                gl.draw_lines(vp, rot, line_color, lines_points);

                gl.draw_control_points(vp, rot, points);

                ctx.drawImage(gl.finish(), 0, 0, width, height);


                ctx.feather(canvas.width, canvas.height, canvas.height * 0.05, canvas.height * 0.05, canvas.height * 0.05, canvas.height * 0.05);

                ctx.translate(width - 10, height - 10);
                draw_camera_axes(ctx, 10, mat3_mul(rot, rot_z_mat3(Math.PI)));
            } else if (mode === "surface_tangent_plane") {

                let lines_points = [];


                for (let i = 0; i < 3; i++) {
                    for (let k = 0; k < 4; k++) {
                        lines_points.push(points[k * 4 + i]);
                        lines_points.push(points[k * 4 + i + 1]);
                        lines_points.push(points[k + i * 4]);
                        lines_points.push(points[k + i * 4 + 4]);
                    }
                }

                let colors = [
                    gray_color
                ];

                let d = (1 - arg2) * 0.3 + 0.001;
                let ll = 0.3;

                let beads = [
                    [0, 0],
                    [0, 0 + d * 2 / 3],
                    [0 - d * 0.5, 0 - d / 3],
                    [0 + d * 0.5, 0 - d / 3]
                ];

                let c = Math.cos(0.4);
                let s = Math.cos(0.4);

                let ppoints = beads.map(p => {
                    p = [p[0] * c - p[1] * s, p[0] * s + p[1] * c];
                    p = [saturate(p[0] + arg0), saturate(p[1] + arg1)];
                    return cubic_bezier_patch(p, points);
                })

                let pcolors = [
                    black_color,
                    red_color,
                    red_color,
                    red_color,
                ]

                let stick_color = [0.1, 0.1, 0.1, 1.0];
                let stick_colors = [stick_color, stick_color, stick_color];

                let mids = [
                    vec_lerp(ppoints[1], ppoints[2], 0.5),
                    vec_lerp(ppoints[2], ppoints[3], 0.5),
                    vec_lerp(ppoints[3], ppoints[1], 0.5),
                ];

                let dirs = [
                    vec_norm(vec_sub(ppoints[1], ppoints[2])),
                    vec_norm(vec_sub(ppoints[2], ppoints[3])),
                    vec_norm(vec_sub(ppoints[3], ppoints[1])),
                ];

                let stick_p = [];

                for (let i = 0; i < 3; i++) {
                    stick_p.push(vec_add(mids[i], vec_scale(dirs[i], 1 * ll)));
                    stick_p.push(vec_add(mids[i], vec_scale(dirs[i], 1 / 3 * ll)));
                    stick_p.push(vec_add(mids[i], vec_scale(dirs[i], -1 / 3 * ll)));
                    stick_p.push(vec_add(mids[i], vec_scale(dirs[i], -1 * ll)));
                }

                let c0 = vec_add(vec_scale(mids[0], 2 / 3), vec_scale(ppoints[3], 1 / 3));

                let nn = vec_cross(dirs[0], dirs[1]);
                let n0 = dirs[0];
                let n1 = vec_norm(vec_cross(nn, dirs[0]));
                n0 = vec_scale(n0, 0.3);
                n1 = vec_scale(n1, 0.3);

                let qp = [
                    vec_add(vec_add(c0, n0), n1), nn,
                    vec_sub(vec_add(c0, n0), n1), nn,
                    vec_sub(vec_sub(c0, n0), n1), nn,
                    vec_add(vec_sub(c0, n0), n1), nn,
                ]

                gl.begin(width, height)
                gl.draw_bezier_patches(vp, rot, colors, points);
                gl.draw_points(vp, rot, pcolors, flatten(ppoints));
                gl.draw_bezier_curves(vp, rot, stick_colors, stick_p, 0.006);
                gl.draw_quads(vp, rot, vec_scale(red_color, 0.5), new Float32Array(flatten(qp)));
                gl.draw_lines(vp, rot, line_color, lines_points);
                gl.draw_control_points(vp, rot, points);

                ctx.drawImage(gl.finish(), 0, 0, width, height);

                ctx.feather(canvas.width, canvas.height, canvas.height * 0.05, canvas.height * 0.05, canvas.height * 0.05, canvas.height * 0.05);

                draw_st(arg0, arg1);

                ctx.translate(width - 10, height - 10);
                draw_camera_axes(ctx, 10, mat3_mul(rot, rot_z_mat3(Math.PI)));
            } else if (mode === "surface_normal") {

                let lines_points = [];


                for (let i = 0; i < 3; i++) {
                    for (let k = 0; k < 4; k++) {
                        lines_points.push(points[k * 4 + i]);
                        lines_points.push(points[k * 4 + i + 1]);
                        lines_points.push(points[k + i * 4]);
                        lines_points.push(points[k + i * 4 + 4]);
                    }
                }

                let colors = [
                    gray_color
                ]
                let st = [arg0, arg1];

                let p0 = cubic_bezier(st[0], points.slice(0, 4));
                let p1 = cubic_bezier(st[0], points.slice(4, 8));
                let p2 = cubic_bezier(st[0], points.slice(8, 12));
                let p3 = cubic_bezier(st[0], points.slice(12, 16));

                let t0 = vec_norm(cubic_bezier_tangent(st[1], [p0, p1, p2, p3]));


                p0 = cubic_bezier(st[1], [points[0], points[4], points[8], points[12]]);
                p1 = cubic_bezier(st[1], [points[1], points[5], points[9], points[13]]);
                p2 = cubic_bezier(st[1], [points[2], points[6], points[10], points[14]]);
                p3 = cubic_bezier(st[1], [points[3], points[7], points[11], points[15]]);

                let t1 = vec_norm(cubic_bezier_tangent(st[0], [p0, p1, p2, p3]));

                let n = vec_norm(vec_cross(t0, t1));

                let p = cubic_bezier_patch([arg0, arg1], points);
                let arrow_mat = mat4_mul(vp, translation_mat4(p));
                arrow_mat = mat4_mul(arrow_mat, scale_mat4(0.015));

                let arrow_rot = mat3_transpose(flatten([t0, vec_norm(vec_cross(n, t0)), n]));

                arrow_mat = mat4_mul(arrow_mat, mat3_to_mat4(arrow_rot));

                t0 = vec_scale(t0, 0.2);
                t1 = vec_scale(t1, 0.2);

                let qp = [
                    vec_add(vec_add(p, t0), t1), n,
                    vec_sub(vec_add(p, t0), t1), n,
                    vec_sub(vec_sub(p, t0), t1), n,
                    vec_add(vec_sub(p, t0), t1), n,
                ]


                gl.begin(width, height)
                gl.draw_bezier_patches(vp, rot, colors, points);
                gl.draw_arrow(arrow_mat, mat3_mul(rot, arrow_rot), red_color);
                gl.draw_points(vp, rot, black_color, flatten(p));
                gl.draw_quads(vp, rot, vec_scale(red_color, 0.5), new Float32Array(flatten(qp)));
                gl.draw_lines(vp, rot, line_color, lines_points);
                gl.draw_control_points(vp, rot, points);

                ctx.drawImage(gl.finish(), 0, 0, width, height);

                ctx.feather(canvas.width, canvas.height, canvas.height * 0.05, canvas.height * 0.05, canvas.height * 0.05, canvas.height * 0.05);

                draw_st(arg0, arg1)

                ctx.translate(width - 10, height - 10);
                draw_camera_axes(ctx, 10, mat3_mul(rot, rot_z_mat3(Math.PI)));
            } else if (mode === "cubic_patch_curvature_cut" || mode === "cubic_patch_curvature_circle" ||
                mode === "cubic_patch_curvature_circle_principal") {

                let lines_points = [];


                for (let i = 0; i < 3; i++) {
                    for (let k = 0; k < 4; k++) {
                        lines_points.push(points[k * 4 + i]);
                        lines_points.push(points[k * 4 + i + 1]);
                        lines_points.push(points[k + i * 4]);
                        lines_points.push(points[k + i * 4 + 4]);
                    }
                }


                let st = [arg0, arg1];

                let p0 = cubic_bezier(st[0], points.slice(0, 4));
                let p1 = cubic_bezier(st[0], points.slice(4, 8));
                let p2 = cubic_bezier(st[0], points.slice(8, 12));
                let p3 = cubic_bezier(st[0], points.slice(12, 16));

                let tan0 = cubic_bezier_tangent(st[1], [p0, p1, p2, p3]);
                let d20 = cubic_bezier_2nd_derivative(st[1], [p0, p1, p2, p3]);
                let t0 = vec_norm(tan0);


                p0 = cubic_bezier(st[1], [points[0], points[4], points[8], points[12]]);
                p1 = cubic_bezier(st[1], [points[1], points[5], points[9], points[13]]);
                p2 = cubic_bezier(st[1], [points[2], points[6], points[10], points[14]]);
                p3 = cubic_bezier(st[1], [points[3], points[7], points[11], points[15]]);

                let tan1 = cubic_bezier_tangent(st[0], [p0, p1, p2, p3]);
                let d21 = cubic_bezier_2nd_derivative(st[0], [p0, p1, p2, p3]);
                let t1 = vec_norm(tan1);

                let n = vec_norm(vec_cross(t0, t1));
                t1 = vec_norm(vec_cross(n, t0));

                let p = cubic_bezier_patch(st, points);
                let arrow_mat = mat4_mul(vp, translation_mat4(p));
                arrow_mat = mat4_mul(arrow_mat, scale_mat4(0.01));

                let arrow_rot = mat3_transpose(flatten([t0, t1, n]));

                arrow_mat = mat4_mul(arrow_mat, mat3_to_mat4(arrow_rot));


                let a = arg2 * Math.PI * 2;
                let c = Math.cos(a);
                let s = Math.sin(a);
                let tt0 = vec_add(vec_scale(t0, c), vec_scale(t1, s));
                let tt1 = vec_add(vec_scale(t0, -s), vec_scale(t1, c));

                let plane = tt1.slice();
                plane.push(vec_dot(tt1, p));


                let qp = [
                    vec_add(vec_add(p, tt0), vec_scale(n, 0.4)), vec_scale(tt1, 0.4),
                    vec_sub(vec_add(p, tt0), vec_scale(n, 0.4)), vec_scale(tt1, 0.4),
                    vec_sub(vec_sub(p, tt0), vec_scale(n, 0.4)), vec_scale(tt1, 0.4),
                    vec_add(vec_sub(p, tt0), vec_scale(n, 0.4)), vec_scale(tt1, 0.4),
                ]


                let test_p0 = mat4_mul_vec3(vp, qp[0]);
                let test_p1 = mat4_mul_vec3(vp, qp[2]);
                let test_p2 = mat4_mul_vec3(vp, qp[4]);
                test_p0 = vec_scale(test_p0, 1 / test_p0[3]);
                test_p1 = vec_scale(test_p1, 1 / test_p1[3]);
                test_p2 = vec_scale(test_p2, 1 / test_p2[3]);

                let test = vec_cross(vec_sub(test_p2, test_p0), vec_sub(test_p1, test_p0));

                let colors = [
                    gray_color
                ]



                gl.begin(width, height)

                if (mode !== "cubic_patch_curvature_circle_principal")
                    gl.draw_trim_bezier_patch(vp, rot, colors, points, plane, true);

                gl.draw_arrow(arrow_mat, mat3_mul(rot, arrow_rot), red_color);

                gl.draw_points(vp, rot, [0, 0, 0, 1], flatten(p));

                if (mode === "cubic_patch_curvature_circle" || mode === "cubic_patch_curvature_circle_principal") {


                    let xduv = [0, 0, 0];

                    let df = [
                        function (t) { return -3 * (1 - t) * (1 - t); },
                        function (t) { return 3 * ((1 - t) * (1 - t) - 2 * t * (1 - t)); },
                        function (t) { return -3 * (t * t - 2 * t * (1 - t)); },
                        function (t) { return 3 * t * t; },
                    ]

                    let aa = a;


                    for (let i = 0; i <= 3; i++) {
                        for (let j = 0; j <= 3; j++) {

                            let p = points[j + i * 4];
                            let s = df[j](st[0]) * df[i](st[1]);
                            xduv = vec_add(xduv, vec_scale(p, s));
                        }
                    }

                    let E = vec_dot(tan0, tan0);
                    let F = vec_dot(tan0, tan1);
                    let G = vec_dot(tan1, tan1);

                    let L = vec_dot(n, d20);
                    let M = vec_dot(n, xduv);
                    let N = vec_dot(n, d21);

                    if (mode === "cubic_patch_curvature_circle") {


                        let gamm = Math.tan(aa);
                        let curv = (L + 2 * M * gamm + N * gamm * gamm) / (E + 2 * F * gamm + G * gamm * gamm);

                        let r = 1 / curv;

                        if (!isFinite(r))
                            r = r > 0 ? 1e20 : -1e20;
                        let rr = Math.abs(r);

                        let lmax = 4.0;
                        let l = Math.min(lmax, Math.PI * 2 * rr);
                        let fi = 0.25 * l / rr;
                        let k = 4 / 3 * Math.tan(fi / 4);

                        let cpoints = [];
                        for (let i = 0; i < 4; i++) {
                            let rot = rot_z_mat3(i * fi - 2 * fi);

                            cpoints.push(mat3_mul_vec(rot, [1.0, 0, 0]));
                            cpoints.push(mat3_mul_vec(rot, [1.0, k, 0]));
                            cpoints.push(mat3_mul_vec(rot, [Math.cos(fi) + k * Math.sin(fi), Math.sin(fi) - k * Math.cos(fi), 0]));
                            cpoints.push(mat3_mul_vec(rot, [Math.cos(fi), Math.sin(fi), 0]));
                        }

                        cpoints = cpoints.map(p => {
                            p[0] -= 1;
                            p = vec_scale(p, r);
                            p = mat3_mul_vec(rot_x_mat3(Math.PI * 0.5), p);
                            p = mat3_mul_vec(rot_y_mat3(Math.PI * 0.5), p);
                            p = mat3_mul_vec(rot_z_mat3(a), p);
                            p = mat3_mul_vec(arrow_rot, p);

                            return p;
                        });

                        let mat = mat4_mul(vp, translation_mat4(p));
                        gl.draw_bezier_curves(mat, rot, Array(4).fill(dark_gray_color), cpoints, 0.01);
                    } else {
                        let K = (L * N - M * M) / (E * G - F * F);
                        let H = (E * N + G * L - 2 * F * M) / (2 * (E * G - F * F));

                        let kmax = H + Math.sqrt(H * H - K);
                        let kmin = H - Math.sqrt(H * H - K);

                        let gamm_min = -(M - kmin * F) / (N - kmin * G);
                        let gamm_max = -(M - kmax * F) / (N - kmax * G);

                        let a0 = Math.atan(gamm_min);
                        let a1 = Math.atan(gamm_max);

                        if (isNaN(a1))
                            a1 = a0 + Math.PI / 2;
                        else if (isNaN(a0))
                            a0 = a1 + Math.PI / 2;

                        let cp = [];

                        for (let kk = 0; kk < 2; kk++) {
                            let cpoints = [];



                            let r = 1 / ([kmin, kmax][kk]);
                            if (!isFinite(r))
                                r = r > 0 ? 1e20 : -1e20;
                            let rr = Math.abs(r);
                            let lmax = 4.0;
                            let l = Math.min(lmax, Math.PI * 2 * rr);
                            let fi = 0.25 * l / rr;
                            let k = 4 / 3 * Math.tan(fi / 4);

                            for (let i = 0; i < 4; i++) {
                                let rot = rot_z_mat3(i * fi - 2 * fi);

                                cpoints.push(mat3_mul_vec(rot, [1.0, 0, 0]));
                                cpoints.push(mat3_mul_vec(rot, [1.0, k, 0]));
                                cpoints.push(mat3_mul_vec(rot, [Math.cos(fi) + k * Math.sin(fi), Math.sin(fi) - k * Math.cos(fi), 0]));
                                cpoints.push(mat3_mul_vec(rot, [Math.cos(fi), Math.sin(fi), 0]));
                            }

                            cpoints = cpoints.map(p => {
                                p[0] -= 1;
                                p = vec_scale(p, r);
                                p = mat3_mul_vec(rot_x_mat3(Math.PI * 0.5), p);
                                p = mat3_mul_vec(rot_y_mat3(Math.PI * 0.5), p);
                                p = mat3_mul_vec(rot_z_mat3(([a0, a1][kk])), p);
                                p = mat3_mul_vec(arrow_rot, p);

                                return p;
                            });

                            cp = cp.concat(cpoints);
                        }

                        let colors = [
                            red_color,
                            red_color,
                            red_color,
                            red_color,
                            green_color,
                            green_color,
                            green_color,
                            green_color,

                        ]

                        let mat = mat4_mul(vp, translation_mat4(p));
                        gl.draw_bezier_curves(mat, rot, colors, cp, 0.01);
                    }
                }

                let plane_color = vec_scale(red_color, 0.4);

                if (mode === "cubic_patch_curvature_circle_principal") {

                    gl.draw_bezier_patches(vp, rot, [vec_scale(colors[0], 0.3)], points);
                } else {
                    if (test[2] > 0) {
                        gl.draw_bezier_patches(vp, rot, [vec_scale(colors[0], 0.4)], points);
                        gl.draw_quads(vp, rot, plane_color, new Float32Array(flatten(qp)));
                    } else {
                        gl.draw_quads(vp, rot, plane_color, new Float32Array(flatten(qp)));
                        gl.draw_bezier_patches(vp, rot, [vec_scale(colors[0], 0.4)], points);
                    }
                }


                gl.draw_lines(vp, rot, line_color, lines_points);
                gl.draw_control_points(vp, rot, points);

                ctx.drawImage(gl.finish(), 0, 0, width, height);

                ctx.feather(canvas.width, canvas.height, canvas.height * 0.05, canvas.height * 0.05, canvas.height * 0.05, canvas.height * 0.05);

                draw_st(arg0, arg1);

                ctx.translate(width - 10, height - 10);
                draw_camera_axes(ctx, 10, mat3_mul(rot, rot_z_mat3(Math.PI)));

            } else if (mode === "two_cubic_patches_mirror" ||
                mode === "two_cubic_patches_lambert") {


                let ps = points.slice();

                let tt = mode === "two_cubic_patches_mirror" ? arg1 : arg0;

                for (let i = 0; i < 4; i++) {
                    ps[i + 4] = ps[i + 4].slice();
                    ps[i + 4][2] = lerp(ps[i + 4][2], 0, tt);
                }


                let start = mat3_mul_vec(mat3_invert(rot), [0, 0, 4])
                gl.begin(width, height)


                let tr = [lerp(-0.5, 0.7, arg0), 0.0, 0.4];

                if (mode === "two_cubic_patches_mirror") {

                    let sp = mat4_mul_vec3(vp, tr);
                    sp[0] = (sp[0] / sp[3] + 1) * width * scale / 2;
                    sp[1] = (sp[1] / sp[3] + 1) * height * scale / 2;
                    let clip = [sp[0] - 60 * scale, sp[1] - 60 * scale, 120 * scale, 120 * scale];

                    if (rot[8] <= 0)
                        gl.draw_sphere(start, tr, rot, clip);

                    let colors = [
                        [0.15, 0.15, 0.15, 1.0],
                        [0.25, 0.25, 0.25, 1.0],
                    ]
                    gl.draw_mirror_bezier_patches(vp, rot, ps, colors, start, tr);
                    // gl.draw_points(vp, rot, [red_color], tr, 0.2);

                    if (rot[8] > 0)
                        gl.draw_sphere(start, tr, rot, clip);

                } else {
                    let c = 0.8;
                    gl.draw_bezier_patches(vp, rot, [[c, c, c, 1], [c, c, c, 1]], ps, 0.9);
                }

                ctx.drawImage(gl.finish(), 0, 0, width, height);

                ctx.save();
                ctx.lineWidth = 4;

                ctx.translate(Math.round(width * 0.5), Math.round(height * 0.85));
                ctx.scale(1, -1);
                let arc_p = ps.filter((a, i) => {
                    return i % 4 == 0;
                }).map(a => [a[0], a[2]]);

                draw_cubic_bezier(arc_p.slice(0).map(a => { return vec_scale(a, width * 0.2) }));
                draw_cubic_bezier(arc_p.slice(4).map(a => { return vec_scale(a, width * 0.2) }));
                ctx.restore();

                ctx.translate(width - 10, height - 10);
                draw_camera_axes(ctx, 10, mat3_mul(rot, rot_z_mat3(Math.PI)));

                ctx.translate(width - 10, height - 10);
            } else if (mode === "cubic_patch_mirror") {

                let l = 1.2;
                let fi = arg0 * Math.PI * 0.5;
                let r = l / fi;
                let k = 4 / 3 * Math.tan(fi / 4);

                let arc_p = [[1.0, 0, 0],
                [1, k, 0],
                [Math.cos(fi) + k * Math.sin(fi), Math.sin(fi) - k * Math.cos(fi), 0],
                [Math.cos(fi), Math.sin(fi), 0]];



                let mat = rot_z_mat3(-fi / 2);

                arc_p = arc_p.map(a => { return vec_scale(a, r) });
                arc_p = arc_p.map(a => { return mat3_mul_vec(mat, a) });
                arc_p.forEach(a => {
                    a[0] -= r + 0.25;
                });

                if (arg0 < 0.001) {
                    arc_p = []
                    for (let j = 0; j < 4; j++) {
                        arc_p.push([-0.25, l * (j / 3 - 0.5), 0]);
                    }
                }

                arc_p.reverse();


                let ps = [];

                for (let i = 0; i < 4; i++) {
                    for (let j = 0; j < 4; j++) {
                        ps.push([arc_p[j][0], arc_p[j][1], l * (i / 3 - 0.5)]);
                    }
                }

                let start = mat3_mul_vec(mat3_invert(rot), [0, 0, 4]);
                // let start = mat4_mul_vec4(mat4_invert(vp), [0, 0, -1, 0]);
                // start = vec_scale(start, 1/start[3]);
                gl.begin(width, height)


                let tr = [0.5, 0.0, 0.0];


                let sp = mat4_mul_vec3(vp, tr);
                sp[0] = (sp[0] / sp[3] + 1) * width * scale / 2;
                sp[1] = (sp[1] / sp[3] + 1) * height * scale / 2;
                let clip = [sp[0] - 60 * scale, sp[1] - 60 * scale, 120 * scale, 120 * scale];

                if (rot[6] <= 0)
                    gl.draw_sphere(start, tr, rot, clip);

                gl.draw_mirror_bezier_patches(vp, rot, ps, [0.2, 0.2, 0.2, 1.0], start, tr);

                if (rot[6] > 0)
                    gl.draw_sphere(start, tr, rot, clip);

                ctx.drawImage(gl.finish(), 0, 0, width, height);


                ctx.save();
                ctx.lineWidth = 4;

                ctx.translate(Math.round(width * 0.5), Math.round(height * 0.85));
                ctx.rotate(-Math.PI * 0.5);
                draw_cubic_bezier(arc_p.map(a => { return vec_scale(a, width * 0.2) }));
                ctx.restore();

                ctx.translate(width - 10, height - 10);
                draw_camera_axes(ctx, 10, mat3_mul(rot, rot_z_mat3(Math.PI)));
            } else if (mode === "cubic_patch_mirror_normals") {

                let l = 1.2;
                let fi = arg0 * Math.PI * 0.5;
                let r = l / fi;
                let k = 4 / 3 * Math.tan(fi / 4);

                let arc_p = [[1.0, 0, 0],
                [1, k, 0],
                [Math.cos(fi) + k * Math.sin(fi), Math.sin(fi) - k * Math.cos(fi), 0],
                [Math.cos(fi), Math.sin(fi), 0]];

                let mat = rot_z_mat3(-fi / 2);

                arc_p = arc_p.map(a => { return vec_scale(a, r) });
                arc_p = arc_p.map(a => { return mat3_mul_vec(mat, a) });
                arc_p.forEach(a => {
                    a[0] -= r + 0.25;
                });

                if (arg0 < 0.001) {
                    arc_p = []
                    for (let j = 0; j < 4; j++) {
                        arc_p.push([-0.25, l * (j / 3 - 0.5), 0]);
                    }
                }

                arc_p.reverse();



                ctx.save();
                ctx.lineWidth = 4;

                ctx.translate(Math.round(width * 0.5), Math.round(height * 0.58));
                ctx.rotate(-Math.PI * 0.5);

                let s = width * 0.37;

                let tr = [0.5, 0.0, 0.0];
                let sr = 0.2;

                ctx.fillStyle = red_style;

                ctx.fillEllipse(tr[0] * s, tr[1] * s, sr * s);


                function bisector(t) {
                    let ray_org = cubic_bezier(t, arc_p);
                    let tan = vec_norm(cubic_bezier_tangent(t, arc_p));
                    let ray_dir = [-tan[1], tan[0], 0];

                    let oc = vec_sub(ray_org, tr);
                    let b = vec_dot(oc, ray_dir);
                    let c = vec_dot(oc, oc) - sr * sr;
                    let h = b * b - c;

                    return h < 0.0 ? -1 : 1;
                }

                let t0 = bisect(0.0, 0.5, bisector);
                let t1 = bisect(1.0, 0.5, bisector);

                ctx.lineWidth = 1;

                ctx.globalAlpha = 0.4;
                ctx.strokeStyle = red_style;
                [t0, t1].forEach(function (t) {

                    let p0 = cubic_bezier(t, arc_p);
                    let tan = vec_norm(cubic_bezier_tangent(t, arc_p));
                    let p1 = vec_add(p0, vec_scale([-tan[1], tan[0]], 20));

                    ctx.beginPath();
                    ctx.lineTo(p0[0] * s, p0[1] * s);
                    ctx.lineTo(p1[0] * s, p1[1] * s);
                    ctx.stroke();
                })

                ctx.globalAlpha = 1;

                ctx.fillStyle = "#888";


                let n_arrows = 10;

                for (let i = 0; i <= n_arrows; i++) {
                    let t = i / n_arrows;

                    let p0 = cubic_bezier(t, arc_p);
                    let tan = vec_norm(cubic_bezier_tangent(t, arc_p));
                    let p1 = vec_add(p0, vec_scale([-tan[1], tan[0]], 0.4));

                    ctx.beginPath();
                    ctx.arrow(p0[0] * s, p0[1] * s, p1[0] * s, p1[1] * s, 2, 6, 12);
                    ctx.fill();
                    // ctx.stroke();
                }

                ctx.lineWidth = 4;
                ctx.lineCap = "round";

                ctx.strokeStyle = "#222";

                draw_cubic_bezier(arc_p.map(a => { return vec_scale(a, s) }));

                ctx.lineWidth = 5;
                ctx.lineCap = "butt";
                ctx.strokeStyle = red_style;

                ctx.beginPath();


                let n = 128;
                for (let i = 0; i <= n; i++) {
                    let t = i / n;

                    let next_t = Math.min(1.0, (i + 1) / n);

                    if (t0 > next_t)
                        continue;


                    let p = cubic_bezier(t, arc_p);


                    if (t0 >= t && t0 <= next_t) {
                        let next_p = cubic_bezier(next_t, arc_p)
                        p = vec_lerp(p, next_p, (t0 - t) / (next_t - t));
                        ctx.lineTo(p[0] * s, p[1] * s);
                    } else if (t1 >= t && t1 <= next_t) {
                        let next_p = cubic_bezier(next_t, arc_p);
                        p = vec_lerp(p, next_p, (t1 - t) / (next_t - t));
                        ctx.lineTo(p[0] * s, p[1] * s);
                        break;
                    } else {

                        ctx.lineTo(p[0] * s, p[1] * s);
                    }
                }
                ctx.stroke();

                ctx.restore();

                ctx.feather(canvas.width, canvas.height, canvas.height * 0.05, canvas.height * 0.05, canvas.height * 0.05, canvas.height * 0.05);


            } else if (mode === "two_cubic_patches_side") {

                let ps = points.slice();

                for (let i = 0; i < 4; i++) {
                    ps[i + 4] = ps[i + 4].slice();
                    // ps[i+0] = ps[i+0].slice();
                    ps[i + 4][2] = lerp(ps[i + 4][2], 0, arg1)
                    // ps[i][2] = lerp(ps[i][2], -2/3, arg1)
                }

                let arc_p = ps.filter((a, i) => {
                    return i % 4 == 0;
                }).map(a => [a[0], a[2]]);




                ctx.save();
                ctx.lineWidth = 4;

                ctx.translate(Math.round(width * 0.5), Math.round(height * 0.5));
                ctx.scale(1, -1);
                // ctx.rotate(-Math.PI*0.5);

                let s = width * 0.35;

                let tr = [lerp(-0.5, 0.7, arg0), 0.0, 0.4];

                tr[1] = tr[2];

                let sr = 0.2;

                ctx.fillStyle = red_style;

                ctx.fillEllipse(tr[0] * s, tr[1] * s, sr * s);


                function bisector(t) {
                    let ray_org = cubic_bezier(t, arc_p);
                    let tan = vec_norm(cubic_bezier_tangent(t, arc_p));
                    let ray_dir = [-tan[1], tan[0], 0];

                    let oc = vec_sub(ray_org, tr);
                    let b = vec_dot(oc, ray_dir);
                    let c = vec_dot(oc, oc) - sr * sr;
                    let h = b * b - c;

                    return h < 0.0 ? -1 : 1;
                }

                // let t0 = (tr[0] - sr)

                let t0 = bisect(0.0, 1.0, bisector);
                let t1 = bisect(1.1, 0.7, bisector);

                let plane_len = (arc_p[7][0] - arc_p[4][0]);

                let tt0 = (tr[0] - sr) / plane_len;
                let tt1 = (tr[0] + sr) / plane_len;

                if (tr[0] + sr > 0)
                    t1 = 1;

                if (tr[0] - sr > 0)
                    t0 = 1;

                // let t1 = 1;

                ctx.lineWidth = 1;
                ctx.globalAlpha = 0.5;
                ctx.strokeStyle = red_style;

                [t0, t1].forEach(function (t) {

                    if (t == 1)
                        return;

                    let p0 = cubic_bezier(t, arc_p);
                    let tan = vec_norm(cubic_bezier_tangent(t, arc_p));
                    let p1 = vec_add(p0, vec_scale([-tan[1], tan[0]], 20));

                    ctx.beginPath();
                    ctx.lineTo(p0[0] * s, p0[1] * s);
                    ctx.lineTo(p1[0] * s, p1[1] * s);
                    ctx.stroke();
                });

                [tt0, tt1].forEach(function (t) {

                    if (t < 0)
                        return;

                    let p0 = [t * plane_len, 0];
                    let tan = [1, 0];
                    let p1 = vec_add(p0, vec_scale([-tan[1], tan[0]], 20));

                    ctx.beginPath();
                    ctx.lineTo(p0[0] * s, p0[1] * s);
                    ctx.lineTo(p1[0] * s, p1[1] * s);
                    ctx.stroke();
                });

                ctx.globalAlpha = 1;
                ctx.strokeStyle = "#000";

                ctx.fillStyle = "#333";


                ctx.lineWidth = 4;
                ctx.lineCap = "round";

                let arc0 = arc_p.map(a => { return vec_scale(a, s) });
                let arc1 = arc_p.slice(4).map(a => { return vec_scale(a, s) });

                draw_cubic_bezier(arc0);
                draw_cubic_bezier(arc1);

                ctx.lineWidth = 2;
                draw_comb(arc0, 64, 3000 * width / 700);
                draw_comb(arc1, 64, 3000 * width / 700);

                ctx.lineWidth = 5;
                ctx.lineCap = "butt";
                ctx.strokeStyle = red_style;

                ctx.beginPath();


                let n = 128;
                for (let i = 0; i <= n; i++) {
                    let t = i / n;

                    let next_t = Math.min(1.0, (i + 1) / n);

                    if (t0 > next_t)
                        continue;


                    let p = cubic_bezier(t, arc_p);


                    if (t0 >= t && t0 <= next_t) {
                        let next_p = cubic_bezier(next_t, arc_p)
                        p = vec_lerp(p, next_p, (t0 - t) / (next_t - t));
                        ctx.lineTo(p[0] * s, p[1] * s);
                    } else if (t1 >= t && t1 <= next_t) {
                        let next_p = cubic_bezier(next_t, arc_p);
                        p = vec_lerp(p, next_p, (t1 - t) / (next_t - t));
                        ctx.lineTo(p[0] * s, p[1] * s);
                        break;
                    } else {

                        ctx.lineTo(p[0] * s, p[1] * s);
                    }
                }
                ctx.stroke();

                ctx.beginPath();
                ctx.lineTo(Math.max(0, tt0 * plane_len * s), 0);
                ctx.lineTo(Math.max(0, tt1 * plane_len * s), 0);
                ctx.stroke();

                ctx.restore();

                ctx.feather(canvas.width, canvas.height, canvas.height * 0.05, canvas.height * 0.05, canvas.height * 0.05, canvas.height * 0.05);


            } else if (mode === "bspline_surface") {

                let lines_points = [];

                for (let i = 0; i < 3; i++) {
                    for (let k = 0; k < 4; k++) {
                        lines_points.push(points[k * 4 + i]);
                        lines_points.push(points[k * 4 + i + 1]);
                        lines_points.push(points[k + i * 4]);
                        lines_points.push(points[k + i * 4 + 4]);
                    }
                }


                let patch = points.slice();

                for (let i = 0; i < 4; i++) {
                    patch[i * 4 + 0] = vec_lerp(patch[i * 4 + 0], patch[i * 4 + 1], 2 / 3);
                    patch[i * 4 + 3] = vec_lerp(patch[i * 4 + 2], patch[i * 4 + 3], 1 / 3);

                    patch[i * 4 + 1] = vec_lerp(patch[i * 4 + 1], patch[i * 4 + 2], 1 / 3);
                    patch[i * 4 + 2] = vec_lerp(patch[i * 4 + 1], patch[i * 4 + 2], 1 / 2);

                    patch[i * 4 + 0] = vec_lerp(patch[i * 4 + 0], patch[i * 4 + 1], 1 / 2);
                    patch[i * 4 + 3] = vec_lerp(patch[i * 4 + 2], patch[i * 4 + 3], 1 / 2);
                }

                for (let i = 0; i < 4; i++) {
                    patch[i + 0 * 4] = vec_lerp(patch[i + 0 * 4], patch[i + 1 * 4], 2 / 3);
                    patch[i + 3 * 4] = vec_lerp(patch[i + 2 * 4], patch[i + 3 * 4], 1 / 3);
                    patch[i + 1 * 4] = vec_lerp(patch[i + 1 * 4], patch[i + 2 * 4], 1 / 3);
                    patch[i + 2 * 4] = vec_lerp(patch[i + 1 * 4], patch[i + 2 * 4], 1 / 2);
                    patch[i + 0 * 4] = vec_lerp(patch[i + 0 * 4], patch[i + 1 * 4], 1 / 2);
                    patch[i + 3 * 4] = vec_lerp(patch[i + 2 * 4], patch[i + 3 * 4], 1 / 2);
                }

                let colors = Array().fill(purple_color);

                gl.begin(width, height)

                gl.draw_bezier_patches(vp, rot, [red_color], patch);

                gl.draw_lines(vp, rot, line_color, lines_points);


                gl.draw_control_points(vp, rot, points);

                ctx.drawImage(gl.finish(), 0, 0, width, height);
                ctx.feather(canvas.width, canvas.height, canvas.height * 0.05, canvas.height * 0.05, canvas.height * 0.05, canvas.height * 0.05);


                ctx.translate(width - 10, height - 10);
                draw_camera_axes(ctx, 10, mat3_mul(rot, rot_z_mat3(Math.PI)));
            } else if (mode === "bspline_surface2") {
                let bezier_patch_points = [];
                let lines_points = [];

                for (let i = 0; i < 4; i++) {
                    for (let k = 0; k < 6; k++) {
                        lines_points.push(points[k * 5 + i]);
                        lines_points.push(points[k * 5 + i + 1]);
                    }
                }

                for (let i = 0; i < 5; i++) {
                    for (let k = 0; k < 5; k++) {
                        lines_points.push(points[k + i * 5]);
                        lines_points.push(points[k + i * 5 + 5]);
                    }
                }


                for (let i = -2; i < 4; i++) {
                    for (let k = -2; k < 5; k++) {

                        let o = k * 6 + i;

                        let patch = [];
                        for (let ii = 0; ii < 4; ii++) {
                            for (let kk = 0; kk < 4; kk++) {

                                let x = Math.max(0, Math.min(4, ii + i));
                                let y = Math.max(0, Math.min(5, kk + k));
                                patch.push(points[y * 5 + x]);
                            }
                        }

                        for (let i = 0; i < 4; i++) {
                            patch[i * 4 + 0] = vec_lerp(patch[i * 4 + 0], patch[i * 4 + 1], 2 / 3);
                            patch[i * 4 + 3] = vec_lerp(patch[i * 4 + 2], patch[i * 4 + 3], 1 / 3);

                            patch[i * 4 + 1] = vec_lerp(patch[i * 4 + 1], patch[i * 4 + 2], 1 / 3);
                            patch[i * 4 + 2] = vec_lerp(patch[i * 4 + 1], patch[i * 4 + 2], 1 / 2);

                            patch[i * 4 + 0] = vec_lerp(patch[i * 4 + 0], patch[i * 4 + 1], 1 / 2);
                            patch[i * 4 + 3] = vec_lerp(patch[i * 4 + 2], patch[i * 4 + 3], 1 / 2);
                        }

                        for (let i = 0; i < 4; i++) {
                            patch[i + 0 * 4] = vec_lerp(patch[i + 0 * 4], patch[i + 1 * 4], 2 / 3);
                            patch[i + 3 * 4] = vec_lerp(patch[i + 2 * 4], patch[i + 3 * 4], 1 / 3);
                            patch[i + 1 * 4] = vec_lerp(patch[i + 1 * 4], patch[i + 2 * 4], 1 / 3);
                            patch[i + 2 * 4] = vec_lerp(patch[i + 1 * 4], patch[i + 2 * 4], 1 / 2);
                            patch[i + 0 * 4] = vec_lerp(patch[i + 0 * 4], patch[i + 1 * 4], 1 / 2);
                            patch[i + 3 * 4] = vec_lerp(patch[i + 2 * 4], patch[i + 3 * 4], 1 / 2);
                        }

                        bezier_patch_points = bezier_patch_points.concat(patch);
                    }
                }

                let colors = Array(48).fill(yellow_color);

                gl.begin(width, height)

                gl.draw_bezier_patches(vp, rot, colors, bezier_patch_points);

                gl.draw_lines(vp, rot, line_color, lines_points);


                gl.draw_control_points(vp, rot, points);

                ctx.drawImage(gl.finish(), 0, 0, width, height);
                ctx.feather(canvas.width, canvas.height, canvas.height * 0.05, canvas.height * 0.05, canvas.height * 0.05, canvas.height * 0.05);


                ctx.translate(width - 10, height - 10);
                draw_camera_axes(ctx, 10, mat3_mul(rot, rot_z_mat3(Math.PI)));
            } else if (mode === "subdiv0" || mode === "subdiv2" ||
                mode === "subdiv_hero" || mode === "subdiv_hero2") {

                gl.begin(width, height);


                let f = [];
                let p = points;

                let line_points = faces_edges(faces, p.length).map(ei => p[ei]);

                faces.forEach(face => {
                    f.push(face.slice());
                });


                let n = Math.round(arg0 * 5);

                if (mode === "subdiv2")
                    n = 4;
                else if (mode === "subdiv_hero")
                    n = 4;
                else if (mode === "subdiv_hero2")
                    n = Math.round(arg0 * 4);


                let func = subdiv_quad;

                if (mode === "subdiv_hero" || mode === "subdiv_hero2")
                    func = function (a, b) { return subdiv_generic(a, b, true); }

                // n = 5;

                for (let k = 0; k < n; k++) {

                    let r = func(f, p);

                    f = r[0];
                    p = r[1];
                }


                let face_points = make_face_points(f, p);


                gl.draw_quads(vp, rot, yellow_color, face_points);


                if (mode !== "subdiv2") {
                    gl.draw_lines(vp, rot, line_color, line_points);
                    gl.draw_control_points(vp, rot, points);
                }

                ctx.drawImage(gl.finish(), 0, 0, width, height);

                ctx.feather(canvas.width, canvas.height, canvas.height * 0.05, canvas.height * 0.05, canvas.height * 0.05, canvas.height * 0.05);

                if (mode !== "subdiv2" && mode !== "subdiv_hero")
                    ctx.fillText(n + " subdivision" + (n == 1 ? " " : "s"), width / 2, height - 10);

                ctx.translate(width - 10, height - 10);
                draw_camera_axes(ctx, 10, mat3_mul(rot, rot_x_mat3(-Math.PI / 2)));
            } else if (mode === "subdiv1") {

                gl.begin(width, height);


                let f = [];
                let p = points;

                let line_points = faces_edges(faces, p.length).map(ei => p[ei]);

                faces.forEach(face => {
                    f.push(face.slice());
                });


                let n = Math.round(arg0 * 5);

                let func = function (a, b) { return subdiv_generic(a, b, false); }


                for (let k = 0; k < n; k++) {

                    let r = func(f, p);

                    f = r[0];
                    p = r[1];
                }



                let tri = n == 0;

                let ff0 = f[0][3];
                if (tri) {
                    f.forEach(face => face[3] = face[2]);
                }

                let face_points = make_face_points(f, p);

                if (tri) {

                    let face_points2 = new Float32Array((f.length + 1) * 4 * 2 * 3);
                    for (let i = 0; i < face_points.length; i++)
                        face_points2[i] = face_points[i];

                    face_points = face_points2;

                    let face = f[0];
                    let p0 = p[face[0]];
                    let p1 = p[face[2]];
                    let p2 = p[ff0];
                    let p3 = p[face[4]];

                    let d0 = [p2[0] - p0[0], p2[1] - p0[1], p2[2] - p0[2]];
                    let d1 = [p3[0] - p1[0], p3[1] - p1[1], p3[2] - p1[2]];

                    let n = (vec_cross(d0, d1));

                    for (let k = 0; k < 3; k++) face_points[f.length * 8 * 3 + 3 * 0 + k] = p0[k];
                    for (let k = 0; k < 3; k++) face_points[f.length * 8 * 3 + 3 * 1 + k] = n[k];
                    for (let k = 0; k < 3; k++) face_points[f.length * 8 * 3 + 3 * 2 + k] = p1[k];
                    for (let k = 0; k < 3; k++) face_points[f.length * 8 * 3 + 3 * 3 + k] = n[k];
                    for (let k = 0; k < 3; k++) face_points[f.length * 8 * 3 + 3 * 4 + k] = p2[k];
                    for (let k = 0; k < 3; k++) face_points[f.length * 8 * 3 + 3 * 5 + k] = n[k];
                    for (let k = 0; k < 3; k++) face_points[f.length * 8 * 3 + 3 * 6 + k] = p3[k];
                    for (let k = 0; k < 3; k++) face_points[f.length * 8 * 3 + 3 * 7 + k] = n[k];
                }


                gl.draw_quads(vp, rot, yellow_color, face_points);


                if (mode !== "subdiv2") {
                    gl.draw_lines(vp, rot, line_color, line_points);
                    gl.draw_control_points(vp, rot, points);
                }

                ctx.drawImage(gl.finish(), 0, 0, width, height);

                ctx.feather(canvas.width, canvas.height, canvas.height * 0.05, canvas.height * 0.05, canvas.height * 0.05, canvas.height * 0.05);

                if (mode !== "subdiv2" && mode !== "subdiv_hero")
                    ctx.fillText(n + " subdivision" + (n == 1 ? " " : "s"), width / 2, height - 10);

                ctx.translate(width - 10, height - 10);
                draw_camera_axes(ctx, 10, mat3_mul(rot, rot_x_mat3(-Math.PI / 2)));
            } else if (mode === "subdiv_base") {

                gl.begin(width, height);


                let f = [];
                let p = points;

                let line_points = faces_edges(faces, p.length).map(ei => p[ei]);

                faces.forEach(face => f.push(face.slice()));


                let r = subdiv_generic(f, p);

                f = r[0];
                p = r[1];

                let line_points2 = faces_edges(f, p.length).map(ei => p[ei]);


                let face_color = red_color;
                let edge_color = blue_color;
                let vert_color = yellow_color;

                let colors = [];
                for (let i = 0; i < p.length; i++) {
                    colors.push(edge_color);
                }

                for (let i = 0; i < 4; i++)
                    colors[i] = vert_color;

                for (let i = 4; i < 13; i++)
                    colors[i] = face_color;


                gl.draw_points(vp, rot, colors, flatten(p))


                let patch = points.slice();

                for (let i = 0; i < 4; i++) {
                    patch[i * 4 + 0] = vec_lerp(patch[i * 4 + 0], patch[i * 4 + 1], 2 / 3);
                    patch[i * 4 + 3] = vec_lerp(patch[i * 4 + 2], patch[i * 4 + 3], 1 / 3);

                    patch[i * 4 + 1] = vec_lerp(patch[i * 4 + 1], patch[i * 4 + 2], 1 / 3);
                    patch[i * 4 + 2] = vec_lerp(patch[i * 4 + 1], patch[i * 4 + 2], 1 / 2);

                    patch[i * 4 + 0] = vec_lerp(patch[i * 4 + 0], patch[i * 4 + 1], 1 / 2);
                    patch[i * 4 + 3] = vec_lerp(patch[i * 4 + 2], patch[i * 4 + 3], 1 / 2);
                }

                for (let i = 0; i < 4; i++) {
                    patch[i + 0 * 4] = vec_lerp(patch[i + 0 * 4], patch[i + 1 * 4], 2 / 3);
                    patch[i + 3 * 4] = vec_lerp(patch[i + 2 * 4], patch[i + 3 * 4], 1 / 3);
                    patch[i + 1 * 4] = vec_lerp(patch[i + 1 * 4], patch[i + 2 * 4], 1 / 3);
                    patch[i + 2 * 4] = vec_lerp(patch[i + 1 * 4], patch[i + 2 * 4], 1 / 2);
                    patch[i + 0 * 4] = vec_lerp(patch[i + 0 * 4], patch[i + 1 * 4], 1 / 2);
                    patch[i + 3 * 4] = vec_lerp(patch[i + 2 * 4], patch[i + 3 * 4], 1 / 2);
                }

                gl.draw_bezier_patches(vp, rot, gray_color, patch);

                gl.draw_lines(vp, rot, vec_scale(line_color, 1.5), line_points);
                gl.draw_lines(vp, rot, vec_scale(line_color, 0.5), line_points2);

                gl.draw_control_points(vp, rot, points);

                ctx.drawImage(gl.finish(), 0, 0, width, height);
                ctx.feather(canvas.width, canvas.height, canvas.height * 0.05, canvas.height * 0.05, canvas.height * 0.05, canvas.height * 0.05);

                ctx.translate(width - 10, height - 10);
                draw_camera_axes(ctx, 10, mat3_mul(rot, rot_z_mat3(Math.PI)));
            } else if (mode === "subdiv_base_patch" || mode === "subdiv_base_patch2") {

                gl.begin(width, height);


                let f = [];
                let p = points.slice();

                let line_points = faces_edges(faces, p.length).map(ei => p[ei]);

                faces.forEach(face => f.push(face.slice()));


                let n = Math.round(arg0 * 5.0)


                for (let k = 0; k < n; k++) {

                    let r = subdiv_generic(f, p);

                    f = r[0];
                    p = r[1];
                }

                let face_points = make_face_points(f, p);

                gl.draw_quads(vp, rot, red_color, face_points);

                if (mode === "subdiv_base_patch2") {
                    let line_points = faces_edges(f, p.length).map(ei => p[ei]);

                    gl.draw_lines(vp, rot, vec_scale(line_color, 2.0), line_points);

                }


                gl.draw_lines(vp, rot, vec_scale(line_color, 1), line_points);

                gl.draw_control_points(vp, rot, points);


                ctx.drawImage(gl.finish(), 0, 0, width, height);
                ctx.feather(canvas.width, canvas.height, canvas.height * 0.05, canvas.height * 0.05, canvas.height * 0.05, canvas.height * 0.05);

                ctx.fillText(n + " subdivision" + (n == 1 ? " " : "s"), width / 2, height - 10);

                ctx.translate(width - 10, height - 10);
                draw_camera_axes(ctx, 10, mat3_mul(rot, rot_z_mat3(Math.PI)));


            } else if (mode === "cubic_curve_curvature") {
                draw_control_lines(ss_points);


                let np = 256;
                let prev_p = cubic_bezier(0, ss_points);

                ctx.lineWidth = 8;

                for (let i = 1; i <= np; i++) {
                    let t = i / np;


                    let p = cubic_bezier(t, ss_points);

                    let tan = cubic_bezier_tangent(t, ss_points);
                    let len = vec_len(tan);
                    let snd = cubic_bezier_2nd_derivative(t, ss_points);
                    let n = vec_scale([-tan[1], tan[0]], 1 / len);
                    let k = (tan[0] * snd[1] - snd[0] * tan[1]) / (len * len * len);

                    ctx.strokeStyle = curvature_style(k);
                    ctx.beginPath();
                    ctx.lineTo(p[0], p[1]);
                    ctx.lineTo(prev_p[0], prev_p[1]);
                    ctx.stroke();

                    prev_p = p;
                }

                let p = cubic_bezier(arg0, ss_points);
                let t = vec_norm(cubic_bezier_tangent(arg0, ss_points));
                let p2 = vec_add(p, vec_scale(t, width * 0.1));

                ctx.fillStyle = "#000";

                ctx.arrow(p[0], p[1], p2[0], p2[1], 3.0, 6.0, 10.0);
                ctx.fill();

                ctx.fillEllipse(p[0], p[1], base_target_size);

                draw_control_points(ss_points);


            } else if (mode === "cubic_curve_circle") {

                draw_control_lines(ss_points);


                let t = arg0;
                let p = cubic_bezier(t, ss_points);

                let tan = cubic_bezier_tangent(t, ss_points);
                let len = vec_len(tan);
                let snd = cubic_bezier_2nd_derivative(t, ss_points);
                let n = vec_scale([-tan[1], tan[0]], 1 / len);


                let k = (tan[0] * snd[1] - snd[0] * tan[1]) / (len * len * len);
                let r = 1 / Math.max(1e-10, Math.abs(k));
                let c = vec_add(p, vec_scale(n, r * (k > 0 ? 1 : -1)));



                ctx.save();

                ctx.strokeStyle = red_style;
                ctx.lineWidth = base_line_width;

                {

                    let np = 256;
                    let prev_p = cubic_bezier(0, ss_points);

                    ctx.lineWidth = 8;
                    for (let i = 1; i <= np; i++) {
                        let t = i / np;


                        let p = cubic_bezier(t, ss_points);

                        let tan = cubic_bezier_tangent(t, ss_points);
                        let len = vec_len(tan);
                        let snd = cubic_bezier_2nd_derivative(t, ss_points);
                        let n = vec_scale([-tan[1], tan[0]], 1 / len);
                        let k = (tan[0] * snd[1] - snd[0] * tan[1]) / (len * len * len);

                        ctx.strokeStyle = curvature_style(k);
                        ctx.beginPath();
                        ctx.lineTo(p[0], p[1]);
                        ctx.lineTo(prev_p[0], prev_p[1]);
                        ctx.stroke();

                        prev_p = p;
                    }
                }


                ctx.fillStyle = "#333";
                ctx.fillEllipse(c[0], c[1], 3);

                ctx.strokeStyle = "#666";
                ctx.lineWidth = 2;

                ctx.save();
                ctx.strokeStyle = "rgba(0,0,0,0.3)"
                ctx.beginPath();
                ctx.lineTo(p[0], p[1]);
                ctx.lineTo(c[0], c[1]);
                ctx.stroke();

                let dir = vec_norm(vec_sub(p.slice(0, 2), c.slice(0, 2)));

                let tp = vec_lerp(p, c, 0.5);
                tp[0] += dir[1] * font_size * 0.75;
                tp[1] += -dir[0] * font_size * 0.75;

                ctx.fillText("R", tp[0], tp[1] + font_size * 0.5);
                ctx.restore();



                if (Math.abs(r) < 10000) {
                    ctx.strokeEllipse(c[0], c[1], Math.abs(r));
                } else {
                    let n = 128;
                    let a0 = Math.atan2(-tan[0] * (k > 0 ? 1 : -1), tan[1] * (k > 0 ? 1 : -1));


                    // ctx.lineTo(c[0] + c * r, c[1] + s*r);
                    for (let i = 0; i <= n; i++) {
                        let a = a0 + (i / n - 0.5) * width * 2 / r;
                        ctx.lineTo(c[0] + Math.cos(a) * r, c[1] + Math.sin(a) * r);
                    }

                    ctx.stroke();
                }

                ctx.fillStyle = "#000";

                ctx.fillEllipse(p[0], p[1], base_target_size);



                ctx.restore();

                ctx.save();

                ctx.feather(canvas.width, canvas.height, canvas.height * 0.05, canvas.height * 0.05, canvas.height * 0.05, canvas.height * 0.05);

                ctx.restore();

                draw_control_points(ss_points);

            } else if (mode === "cubic_curve_comb") {

                draw_control_lines(ss_points);
                draw_control_points(ss_points);

                ctx.globalCompositeOperation = "destination-over";

                let t = arg0;
                let p = cubic_bezier(t, ss_points);


                ctx.save();
                ctx.fillStyle = "#333";

                ctx.strokeStyle = "#333";
                ctx.lineWidth = 2;




                draw_comb(ss_points, 128, 2000.0 * width / 700);


                {

                    let np = 256;
                    let prev_p = cubic_bezier(0, ss_points);

                    ctx.lineWidth = 8;
                    for (let i = 1; i <= np; i++) {
                        let t = i / np;


                        let p = cubic_bezier(t, ss_points);

                        let tan = cubic_bezier_tangent(t, ss_points);
                        let len = vec_len(tan);
                        let snd = cubic_bezier_2nd_derivative(t, ss_points);
                        let n = vec_scale([-tan[1], tan[0]], 1 / len);
                        let k = (tan[0] * snd[1] - snd[0] * tan[1]) / (len * len * len);

                        ctx.strokeStyle = curvature_style(k);
                        ctx.beginPath();
                        ctx.lineTo(p[0], p[1]);
                        ctx.lineTo(prev_p[0], prev_p[1]);
                        ctx.stroke();

                        prev_p = p;
                    }
                }


                ctx.restore();

                ctx.feather(canvas.width, canvas.height, canvas.height * 0.05, canvas.height * 0.05, canvas.height * 0.05, canvas.height * 0.05);


            } else if (mode === "square") {

                let pad = 10;
                let w = width - pad * 2;
                ctx.translate(pad, pad);

                ctx.fillStyle = "rgba(0,0,0,0.05)";
                ctx.fillRect(0, 0, w, w);
                ctx.strokeStyle = "rgba(0,0,0,0.1)";
                ctx.strokeRect(0, 0, w, w);


                let tw = ctx.measureText("t = 0.00").width;

                ctx.textAlign = "right";
                ctx.fillStyle = "#6ea7d6";
                ctx.fillText("t = " + arg0.toFixed(2), w / 2 + tw / 2, w / 2 - font_size * 0.3);

                ctx.fillStyle = "#EBBC3F";
                ctx.fillText("s = " + arg1.toFixed(2), w / 2 + tw / 2, w / 2 + font_size);

                ctx.fillStyle = "#222";
                ctx.fillEllipse(arg0 * w, (1 - arg1) * w, 5);

            } else if (mode === "cubic_four_curves_surface" || mode === "cubic_four_curves_surface2") {

                let lines_points = [];


                for (let i = 0; i < 3; i++) {
                    for (let k = 0; k < 4; k++) {
                        lines_points.push(points[k * 4 + i]);
                        lines_points.push(points[k * 4 + i + 1]);
                    }
                }

                let bezier_curves = points.slice();

                let bezier_colors = Array(4).fill(purple_color);
                let point_colors = Array(4).fill(black_color);

                bezier_curves.push(cubic_bezier(arg0, points.slice(0)));
                bezier_curves.push(cubic_bezier(arg0, points.slice(4)));
                bezier_curves.push(cubic_bezier(arg0, points.slice(8)));
                bezier_curves.push(cubic_bezier(arg0, points.slice(12)));

                bezier_colors.push(yellow_color);


                let pps = bezier_curves.slice(16);

                if (mode === "cubic_four_curves_surface2") {
                    bezier_colors = Array(4).fill(blue_color);
                    point_colors = bezier_colors;
                    point_colors.push(yellow_color);

                    pps.push(flatten(cubic_bezier_patch([arg0, arg1], points)));

                }


                gl.begin(width, height)


                let psize = mode === "cubic_four_curves_surface2" ? 0.028 : 0.025;

                gl.draw_bezier_curves(vp, rot, bezier_colors, bezier_curves);
                gl.draw_points(vp, rot, point_colors, flatten(pps), psize);
                if (mode === "cubic_four_curves_surface2")
                    gl.draw_bezier_patches(vp, rot, gray_color, points);
                else
                    gl.draw_trim_bezier_patch(vp, rot, yellow_color, points, [arg0, 2, 0, 0]);
                gl.draw_lines(vp, rot, line_color, lines_points);
                gl.draw_control_points(vp, rot, points);

                ctx.drawImage(gl.finish(), 0, 0, width, height);

                ctx.feather(canvas.width, canvas.height, canvas.height * 0.05, canvas.height * 0.05, canvas.height * 0.05, canvas.height * 0.05);

                ctx.translate(width - 10, height - 10);
                draw_camera_axes(ctx, 10, mat3_mul(rot, rot_z_mat3(Math.PI)));
            } else if (mode === "linear_segment_weight_plot") {

                let end = vec_lerp(ss_points[0], ss_points[1], Math.max(0.0001, arg0));

                draw_control_points(ss_points);

                ctx.save();
                ctx.globalCompositeOperation = "destination-over";

                ctx.fillStyle = "#111";
                ctx.lineWidth = base_line_width;

                ctx.fillEllipse(end[0], end[1], base_target_size);

                if (selected_point !== undefined) {
                    let p0 = ss_points[1 - selected_point];
                    let p1 = ss_points[selected_point];

                    let n = 128;
                    let prev_p = p0;
                    for (let i = 1; i <= n; i++) {
                        let t = i / n;
                        let p = vec_lerp(p0, p1, t);
                        ctx.strokeStyle = weight_style(t);
                        ctx.beginPath();
                        ctx.lineTo(p[0], p[1]);
                        ctx.lineTo(prev_p[0], prev_p[1]);
                        ctx.stroke();

                        prev_p = p;
                    }
                } else {
                    ctx.strokeStyle = weight_style(0);

                    ctx.beginPath();
                    ctx.lineTo(ss_points[0][0], ss_points[0][1]);
                    ctx.lineTo(ss_points[1][0], ss_points[1][1]);
                    ctx.stroke();
                }
                ctx.restore();

                ctx.fillStyle = "#333"
                ctx.fillText("A", ss_points[0][0], ss_points[0][1] - control_points_size - 7);
                ctx.fillText("B", ss_points[1][0], ss_points[1][1] - control_points_size - 7);

                ctx.globalAlpha = smooth_step(0, 0.05, arg0) - smooth_step(0.95, 1, arg0);
                ctx.fillText("P", end[0], end[1] - control_points_size - 7);
                ctx.globalAlpha = 1;


                let plot_w = Math.round(width * plot_scale) * 2;
                let plot_h = Math.ceil(height * 0.2);

                ctx.save();
                ctx.translate(Math.round(width * 0.5) - plot_w * 0.5, height - plot_h - plot_pad - font_size);


                let functions = [
                    function (x) { return 1 - x },
                    function (x) { return x }
                ]

                draw_plot(plot_w, plot_h, functions, arg0, selected_point);
                ctx.restore();

                ctx.font = Math.ceil(font_size * 0.9) + "px IBM Plex Sans";

                ctx.lineWidth = 1;
                ctx.strokeStyle = "rgba(0,0,0,0.4)";

                let y = height - (1 - arg0) * plot_h - plot_pad - font_size;

                ctx.beginPath();
                ctx.lineTo(Math.round(width * 0.5) - plot_w * 0.5 - 5, y);
                ctx.lineTo(Math.round(width * 0.5) - plot_w * 0.5 + plot_w * arg0, y);
                ctx.stroke();

                let font_scale = width > 640 ? 0.9 : width > 540 ? 0.8 : width > 470 ? 0.7 : 0.6;
                ctx.font = Math.floor(font_size * font_scale) + "px IBM Plex Sans";

                ctx.textAlign = "right";
                ctx.fillText("weight A = " + (1 - arg0).toFixed(2), Math.round(width * 0.5) - plot_w * 0.5 - 10, y + font_size / 3);


                y = height - (arg0) * plot_h - plot_pad - font_size;

                ctx.beginPath();
                ctx.lineTo(Math.round(width * 0.5) + plot_w * 0.5 + 5, y);
                ctx.lineTo(Math.round(width * 0.5) - plot_w * 0.5 + plot_w * arg0, y);
                ctx.stroke();

                ctx.textAlign = "left";
                ctx.fillText("weight B = " + (arg0).toFixed(2), Math.round(width * 0.5) + plot_w * 0.5 + 10, y + font_size / 3);



                ctx.textAlign = "center";

                ctx.fillText("progress = " + arg0.toFixed(2), Math.round(width * 0.5), height - font_size * 0.3);


            } else if (mode === "linear_patch_hats" || mode === "linear_patch_hats2") {
                gl.begin(width, height)


                let lines = [];
                for (let i = 0; i < 3; i++) {
                    let p0 = [-0.5, -0.5, -0.5];
                    let p1 = [-0.5, -0.5, -0.5];
                    p0[i] += -0.1;
                    p1[i] += 1.1;
                    lines.push(p0, p1);
                }


                let s = 1.2;

                let n = mode === "linear_patch_hats" ? 2 : 4

                let f0 = function (x, y, i, j) {
                    let s = j / 3;
                    let t = i / 3;
                    return (t * x + (1 - t) * (1 - x)) *
                        (s * y + (1 - s) * (1 - y));
                };

                let f1 = function (x, y, i, j) {
                    return x == i && y == j ? 1 : 0;
                };

                let f = mode === "linear_patch_hats" ? f0 : f1;
                for (let x = 0; x < n; x++) {
                    for (let y = 0; y < n; y++) {
                        let points = [];
                        for (let j = 0; j <= 3; j++) {
                            for (let i = 0; i <= 3; i++) {

                                let s = j / 3;
                                let t = i / 3;
                                let z = f(x, y, i, j);
                                // z = 0;
                                points.push([s - 0.5, t - 0.5, z - 0.5]);
                            }
                        }

                        points = points.map(p => vec_scale(p, s));

                        gl.viewport(Math.floor(width * x / n),
                            Math.floor(height - height * (y + 1) / n + font_size / 2),
                            Math.floor(width / n),
                            Math.floor(height / n));


                        let line_colors = [
                            blue_color,
                            yellow_color,
                            gray_color
                        ]

                        let line_points = [
                            [0, 0, 0], [0, 0, 0], [1, 0, 0], [1, 0, 0],
                            [0, 0, 0], [0, 0, 0], [0, 1, 0], [0, 1, 0],
                            [0, 0, 0], [0, 0, 0], [0, 0, 1], [0, 0, 1],
                        ];
                        line_points = line_points.map(p => vec_sub(p, [0.5, 0.5, 0.5]));
                        line_points = line_points.map(p => vec_scale(p, s));

                        gl.draw_bezier_curves(vp, rot, line_colors, line_points);

                        let points_colors = [
                            blue_color,
                            yellow_color,
                            black_color,
                        ];

                        let points_pos = [
                            [arg0 - 0.5, -0.5, -0.5],
                            [-0.5, arg1 - 0.5, -0.5],
                            cubic_bezier_patch([arg1, arg0], points)];
                        points_pos[0] = vec_scale(points_pos[0], s);
                        points_pos[1] = vec_scale(points_pos[1], s);

                        gl.draw_points(vp, rot, points_colors, flatten(points_pos), 0.04);

                        gl.draw_bezier_patches(vp, rot, gray_color, points, undefined, false, true);

                    }
                }

                ctx.drawImage(gl.finish(), 0, 0, width, height);



                if (mode === "linear_patch_hats") {
                    let names = ["A", "B", "C", "D"];
                    for (let x = 0; x < n; x++) {
                        for (let y = 0; y < n; y++) {

                            ctx.fillText(names[x + y * n], (x + 0.5) * width / n, (y + 1) * height / n - font_size / 2);
                        }
                    }
                } else {
                    for (let x = 0; x < n; x++) {
                        for (let y = 0; y < n; y++) {

                            ctx.fillText("P", (x + 0.5) * width / n, (y + 1) * height / n - font_size / 2);
                        }
                    }

                    ctx.font = Math.ceil(font_size * 0.6) + "px IBM Plex Sans";

                    for (let x = 0; x < n; x++) {
                        for (let y = 0; y < n; y++) {

                            ctx.fillText((y + 1).toString() + (x + 1).toString(),
                                (x + 0.5) * width / n + font_size / 2,
                                (y + 1) * height / n - font_size / 4);
                        }
                    }
                }

            } else if (mode === "quad_curve" || mode === "quad_curve_plot" || mode === "quad_curve_plot2") {

                function f(t) { return quad_bezier(t, ss_points); };


                draw_control_lines(ss_points);

                ctx.save();

                let end = f(arg0);

                let n = 128;


                let functions = [
                    function (x) { return (1 - x) * (1 - x) },
                    function (x) { return x * (1 - x) },
                    function (x) { return x * x },
                ]

                if (mode === "quad_curve_plot" && selected_point !== undefined) {
                    ctx.lineWidth = 6;

                    let sf = functions[selected_point];
                    let n = 256;
                    let prev_p = f(0);
                    for (let i = 1; i <= n; i++) {
                        let t = i / n;
                        let p = f(t);
                        ctx.strokeStyle = weight_style(sf(t));
                        ctx.beginPath();
                        ctx.lineTo(p[0], p[1]);
                        ctx.lineTo(prev_p[0], prev_p[1]);
                        ctx.stroke();

                        prev_p = p;
                    }
                } else {



                    ctx.beginPath();
                    {
                        let p = f(0);
                        ctx.lineTo(p[0], p[1]);
                        p = f(0.0001);
                        ctx.lineTo(p[0], p[1]);
                    }
                    for (let i = 0; i <= n; i++) {
                        let t = i / n;
                        let p = f(t);

                        if (mode === "quad_curve") {
                            let next_t = Math.min(1.0, (i + 1) / n);

                            if (arg0 < next_t) {
                                let next_p = f(next_t);
                                p = vec_lerp(p, next_p, (arg0 - t) / (next_t - t));
                                ctx.lineTo(p[0], p[1]);
                                break;
                            }
                        }

                        ctx.lineTo(p[0], p[1]);
                    }




                    ctx.strokeStyle = mode === "quad_curve" ? base_style : weight_style(0);
                    ctx.lineWidth = base_line_width;
                    if (mode === "quad_curve_plot2")
                        ctx.lineWidth = 2;
                    ctx.stroke();
                }


                ctx.fillStyle = mode === "quad_curve" ? red_style : "#000";
                ctx.fillEllipse(end[0], end[1], base_target_size);


                let points = undefined;
                if (mode === "quad_curve_plot2") {
                    let n = 20;
                    points = [];
                    for (let i = 0; i <= n; i++) {
                        points.push(i / n);
                        let p = f(i / n);
                        ctx.fillEllipse(p[0], p[1], 2);
                    }
                }


                ctx.restore();

                let names = undefined;
                if (mode === "quad_curve")
                    names = ["A", "B", "C"];
                else if (mode === "quad_curve_plot")
                    names = ["A", "B", "C"];
                draw_control_points(ss_points, names);



                if (mode === "quad_curve_plot" || mode === "quad_curve_plot2") {
                    let plot_w = Math.round(width * plot_scale) * 2;
                    let plot_h = Math.ceil(height * 0.2);

                    ctx.translate(Math.round(width * 0.5) - plot_w * 0.5, height - plot_h - plot_pad);



                    draw_plot(plot_w, plot_h, functions, arg0, selected_point, undefined, undefined, points, true);
                }
            } else if (mode === "cubic_curve_plot" || mode === "septic_curve_plot" || mode === "septic_curve_plot2") {

                let points_names = ["A", "B", "C", "D", "E", "F", "G", "H"]
                draw_control_lines(ss_points);


                let f;

                if (mode === "cubic_curve_plot")
                    f = function (t) { return cubic_bezier(t, ss_points); };
                else
                    f = function (t) { return septic_bezier(t, ss_points); };


                ctx.save();
                ctx.globalCompositeOperation = "source-over";

                let end = f(arg0);

                let n = 128;

                let functions;

                if (mode === "cubic_curve_plot") {
                    functions = [
                        function (x) { return (1 - x) * (1 - x) * (1 - x) },
                        function (x) { return 3 * x * (1 - x) * (1 - x) },
                        function (x) { return 3 * x * x * (1 - x) },
                        function (x) { return x * x * x },
                    ]
                } else {
                    functions = [
                        function (x) { return (1 - x) * (1 - x) * (1 - x) * (1 - x) * (1 - x) * (1 - x) * (1 - x) },
                        function (x) { return 7 * (1 - x) * (1 - x) * (1 - x) * (1 - x) * (1 - x) * (1 - x) * (x) },
                        function (x) { return 21 * (1 - x) * (1 - x) * (1 - x) * (1 - x) * (1 - x) * (x) * (x) },
                        function (x) { return 35 * (1 - x) * (1 - x) * (1 - x) * (1 - x) * (x) * (x) * (x) },
                        function (x) { return 35 * (1 - x) * (1 - x) * (1 - x) * (x) * (x) * (x) * (x) },
                        function (x) { return 21 * (1 - x) * (1 - x) * (x) * (x) * (x) * (x) * (x) },
                        function (x) { return 7 * (1 - x) * (x) * (x) * (x) * (x) * (x) * (x) },
                        function (x) { return (x) * (x) * (x) * (x) * (x) * (x) * (x) },
                    ]
                }

                ctx.lineWidth = base_line_width;

                if (selected_point !== undefined) {

                    let sf = functions[selected_point];
                    let n = 256;
                    let prev_p = f(0);
                    for (let i = 1; i <= n; i++) {
                        let t = i / n;
                        let p = f(t);
                        ctx.strokeStyle = weight_style(sf(t));
                        ctx.beginPath();
                        ctx.lineTo(p[0], p[1]);
                        ctx.lineTo(prev_p[0], prev_p[1]);
                        ctx.stroke();

                        prev_p = p;
                    }
                } else {


                    ctx.beginPath();
                    {
                        let p = f(0);
                        ctx.lineTo(p[0], p[1]);
                        p = f(0.0001);
                        ctx.lineTo(p[0], p[1]);
                    }
                    for (let i = 0; i <= n; i++) {
                        let t = i / n;
                        let p = f(t);

                        ctx.lineTo(p[0], p[1]);
                    }
                    ctx.strokeStyle = weight_style(0);
                    ctx.stroke();

                }
                ctx.restore();

                ctx.fillStyle = "#000";
                ctx.fillEllipse(end[0], end[1], base_target_size);


                draw_control_points(ss_points, mode === "septic_curve_plot2" || mode === "septic_curve_plot" ? undefined : points_names);



                let plot_w = Math.round(width * plot_scale) * 2;
                let plot_h = Math.ceil(height * 0.2);

                ctx.translate(Math.round(width * 0.5) - plot_w * 0.5, height - plot_h - plot_pad);


                draw_plot(plot_w, plot_h, functions, arg0, selected_point);

            } else if (mode === "paper") {
                let w = width * 0.4;
                let h = w * Math.SQRT1_2;

                let nn = arg0 * 2.999;
                let n = Math.floor(nn);
                let t = nn - n;

                let ww = Math.round(width * 0.5);
                let hh = Math.round(height * 0.5);
                ctx.translate(ww, hh - Math.round(height * 0.02));

                let c0 = w;

                let prev_pp = [[w, h - c0], [w, h], [w - c0, h]];
                let pp = prev_pp;

                for (let i = 0; i <= n; i++) {
                    let new_pp = [];

                    for (let k = 0; k < pp.length - 1; k++) {
                        new_pp.push(vec_lerp(pp[k], pp[k + 1], 0.25));
                        new_pp.push(vec_lerp(pp[k], pp[k + 1], 0.75));
                    }

                    prev_pp = pp;
                    pp = new_pp;
                }

                function draw(stroke) {

                    if (t < 0.4) {
                        ctx.beginPath()
                        ctx.lineTo(-w, -h);
                        ctx.lineTo(w, -h);
                        prev_pp.forEach(a => { ctx.lineTo(a[0], a[1]); });
                        ctx.lineTo(-w, h);
                        ctx.closePath();
                        if (stroke) ctx.stroke();
                        ctx.fill();

                    } else {
                        ctx.beginPath()
                        ctx.lineTo(-w, -h);
                        ctx.lineTo(w, -h);
                        pp.forEach(a => { ctx.lineTo(a[0], a[1]); });
                        ctx.lineTo(-w, h);
                        ctx.closePath();
                        if (stroke) ctx.stroke();
                        ctx.fill();


                        let d = smooth_step(0.6, 1.4, t) * w;
                        ctx.save();
                        ctx.translate(d, d);

                        let k = prev_pp.length - 2;

                        for (let i = 0; i < k; i++) {
                            ctx.beginPath()

                            ctx.lineTo(pp[2 * i + 1][0], pp[2 * i + 1][1]);
                            ctx.lineTo(prev_pp[i + 1][0], prev_pp[i + 1][1]);
                            ctx.lineTo(pp[2 * i + 2][0], pp[2 * i + 2][1]);

                            ctx.closePath();
                            if (stroke) ctx.stroke();
                            ctx.fill();
                        }

                        ctx.restore();
                    }
                }



                ctx.save();
                ctx.fillStyle = "rgba(255,255,255,0.4)";
                ctx.globalCompositeOperation = "lighter";
                ctx.shadowColor = "#000";
                ctx.shadowBlur = w * 0.2;
                ctx.shadowOffsetX = 0;
                ctx.shadowOffsetY = w * 0.1;
                draw(false);
                ctx.restore();

                ctx.fillStyle = "#fff"
                ctx.strokeStyle = "#aaa";
                ctx.lineWidth = 1;
                draw(true);

                ctx.strokeStyle = "red";
                ctx.lineWidth = 3;
                ctx.globalAlpha = 1 - smooth_step(0.4, 0.5, t);

                let k = prev_pp.length - 2;

                for (let i = 0; i < k; i++) {
                    ctx.beginPath()

                    let p0 = vec_lerp(pp[2 * i + 2], pp[2 * i + 1], smooth_step(0.0, 0.3, t));

                    ctx.lineTo(pp[2 * i + 2][0], pp[2 * i + 2][1]);
                    ctx.lineTo(p0[0], p0[1]);

                    ctx.stroke();
                }

                ctx.globalAlpha = 1;

                ctx.feather(canvas.width, canvas.height, 0, canvas.height * 0.1, 0, canvas.height * 0.1);

            } else if (mode === "chaikin" || mode === "chaikin_quadratic_bspline" ||
                mode === "chaikin_cubic" || mode === "chaikin_cubic_bspline" ||
                mode === "curve_subdiv_topo") {

                let nn = 5;

                if (mode === "chaikin" || mode === "chaikin_cubic")
                    nn = 4;

                let t = 0.00001 + arg0 * (nn - 0.0001);
                let subdiv = Math.ceil(t)
                let m = 0.25;
                if (mode === "chaikin")
                    m = arg1 * 0.5;
                else if (mode === "chaikin_cubic") {
                    m = 0.5 + arg1 * 0.5;
                    document.getElementById("chw0").textContent = ((1 - m) * 0.5).toFixed(3);
                    document.getElementById("chw1").textContent = m.toFixed(3);
                    document.getElementById("chw2").innerHTML = ((1 - m) * 0.5).toFixed(3);
                }
                else if (mode === "chaikin_cubic_bspline")
                    m = 0.75;

                let tt = 1 - (subdiv - t);

                let point_alpha = smooth_step(0.1, 0.2, tt) - smooth_step(0.8, 0.9, tt);
                let f = smooth_step(0.2, 0.8, tt);

                if (mode !== "curve_subdiv_topo")
                    draw_control_lines(ss_points);
                else {
                    faces.forEach(e => {
                        draw_control_lines([ss_points[e[0]], ss_points[e[1]]]);
                    })
                }


                let pp = ss_points;
                let prev_pp = ss_points;
                let edges = faces;
                let prev_edges = faces;

                function subdiv_quad(pp, k, new_pp) {
                    new_pp.push(vec_lerp(pp[k], pp[k + 1], m));
                    new_pp.push(vec_lerp(pp[k], pp[k + 1], 1 - m));
                }

                function subdiv_cubic(pp, k, new_pp) {
                    if (k > 0)
                        new_pp.push(vec_add(vec_add(vec_scale(pp[k - 1], (1 - m) * 0.5), vec_scale(pp[k], m)),
                            vec_scale(pp[k + 1], (1 - m) * 0.5)));
                    new_pp.push(vec_lerp(pp[k], pp[k + 1], 0.5));
                }

                let func = subdiv_quad;

                if (mode === "chaikin_cubic" || mode === "chaikin_cubic_bspline") {
                    func = subdiv_cubic;
                }

                for (let i = 0; i < subdiv; i++) {
                    let new_pp = [];
                    let new_edges = [];

                    if (mode === "curve_subdiv_topo") {
                        let edge_p = [];
                        let valences = new Array(pp.length).fill(0);

                        edges.forEach(e => {
                            edge_p.push(vec_lerp(pp[e[0]], pp[e[1]], 0.5));
                            valences[e[0]]++;
                            valences[e[1]]++;
                        })

                        let new_v = pp.map((v, i) => {
                            if (valences[i] == 1)
                                return v;

                            let w = 0.75;
                            return vec_scale(v, w);
                        });

                        edges.forEach(e => {

                            if (valences[e[0]] > 1)
                                new_v[e[0]] = vec_add(new_v[e[0]], vec_scale(pp[e[1]], 1 / (4 * valences[e[0]])));

                            if (valences[e[1]] > 1)
                                new_v[e[1]] = vec_add(new_v[e[1]], vec_scale(pp[e[0]], 1 / (4 * valences[e[1]])));
                        });

                        let n = new_v.length;

                        new_v = new_v.concat(edge_p);

                        edges.forEach((e, i) => {
                            new_edges.push([e[1], n + i]);
                            new_edges.push([e[0], n + i]);
                        })

                        new_pp = new_v;

                    } else {
                        for (let k = 0; k < pp.length - 1; k++) {
                            func(pp, k, new_pp);
                        }
                    }

                    prev_pp = pp;
                    pp = new_pp;

                    prev_edges = edges;
                    edges = new_edges;
                }

                let a0 = f;
                let a1 = 1 - f;
                ctx.lineWidth = base_line_width - 1;

                // ctx.globalCompositeOperation = "lighter";
                ctx.fillStyle = "#000";

                let tx = Math.round((width - ctx.measureText("2 iterations").width) * 0.5);
                let ty = Math.round(height - font_size * 0.5);

                ctx.textAlign = "left";

                let s0 = base_style;

                if (mode === "chaikin_cubic" || mode === "chaikin")
                    s0 = "#bbb";

                let s1 = s0;

                ctx.globalAlpha = a0;
                ctx.strokeStyle = subdiv & 1 ? s0 : s1;

                if (mode === "curve_subdiv_topo") {
                    edges.forEach(e => {
                        ctx.beginPath();
                        ctx.lineTo(pp[e[0]][0], pp[e[0]][1]);
                        ctx.lineTo(pp[e[1]][0], pp[e[1]][1]);
                        ctx.stroke();
                    });
                } else {
                    ctx.beginPath();
                    pp.forEach(a => { ctx.lineTo(a[0], a[1]); });
                    ctx.stroke();
                }
                ctx.fillText((subdiv) + " iteration" + (subdiv == 1 ? " " : "s"), tx, ty);


                ctx.globalAlpha = a1;
                ctx.strokeStyle = subdiv & 1 ? s1 : s0;

                if (mode === "curve_subdiv_topo") {
                    prev_edges.forEach(e => {
                        ctx.beginPath();
                        ctx.lineTo(prev_pp[e[0]][0], prev_pp[e[0]][1]);
                        ctx.lineTo(prev_pp[e[1]][0], prev_pp[e[1]][1]);
                        ctx.stroke();
                    });
                } else {
                    ctx.beginPath();
                    prev_pp.forEach(a => { ctx.lineTo(a[0], a[1]); });
                    ctx.stroke();
                }
                ctx.fillText((subdiv - 1) + " iteration" + (subdiv == 2 ? " " : "s"), tx, ty);

                ctx.globalAlpha = 1;

                ctx.globalCompositeOperation = "source-over";

                if (mode === "chaikin_cubic") {
                    ctx.globalAlpha = point_alpha;
                    pp.forEach((pt, i) => {
                        ctx.fillStyle = i & 1 ? "#0979AC" : "#EBBC3F";
                        ctx.fillEllipse(pt[0], pt[1], 5);
                    });
                    ctx.globalAlpha = 1;
                } else if (mode === "chaikin") {
                    ctx.globalAlpha = point_alpha;
                    ctx.fillStyle = "#0979AC";

                    pp.forEach((pt, i) => {
                        ctx.fillEllipse(pt[0], pt[1], 4);
                    });
                    ctx.globalAlpha = 1;
                }


                draw_control_points(ss_points);


                if (mode === "chaikin_quadratic_bspline" || mode === "chaikin_cubic_bspline") {
                    ctx.globalCompositeOperation = "destination-over";

                    function quadratic(x) {
                        if (x < 0 || x > 3)
                            return 0;

                        if (x < 1)
                            return x * x * 0.5;

                        if (--x < 1)
                            return -x * x + x + 0.5;

                        --x;
                        return (1 - x) * (1 - x) * 0.5;
                    }

                    function cubic(x) {
                        if (x < 0 || x > 4)
                            return 0;

                        if (x < 1)
                            return x * x * x / 6;
                        if (--x < 1)
                            return (1 + 3 * x + 3 * x * x - 3 * x * x * x) / 6;
                        if (--x < 1)
                            return (4 - 6 * x * x + 3 * x * x * x) / 6;
                        if (--x < 1)
                            return (1 - 3 * x + 3 * x * x - x * x * x) / 6;
                    }

                    let func = mode === "chaikin_quadratic_bspline" ? quadratic : cubic;
                    let deg = mode === "chaikin_quadratic_bspline" ? 2 : 3;

                    function make(off) {
                        return function (t) {
                            return func(t * (points.length - deg) + deg - off);
                        }
                    }

                    let functions = [];

                    for (let i = 0; i < points.length; i++) {
                        functions.push(make(i));
                    }


                    function f(x) {
                        let p = [0, 0];
                        for (let i = 0; i < functions.length; i++) {
                            let w = functions[i](x);
                            p[0] += ss_points[i][0] * w;
                            p[1] += ss_points[i][1] * w;
                        }
                        return p;
                    }


                    let n = 32 * (points.length - 1);
                    ctx.beginPath();

                    for (let i = 0; i <= n; i++) {
                        let t = i / n;
                        let p = f(t);

                        ctx.lineTo(p[0], p[1]);
                    }
                    ctx.strokeStyle = "#d2d2d2";
                    ctx.lineWidth = 10;
                    ctx.stroke();
                }

            } else if (mode === "spline_triangle_plot" || mode === "spline_funky_plot" ||
                mode === "spline_funky_plot2" ||
                mode === "spline_cubic_plot" || mode === "spline_quadratic_plot" ||
                mode === "spline_cubic_loop_plot" || mode === "spline_cubic_knots_plot" ||
                mode === "spline_cubic_knots_plot2" || mode === "spline_cubic_weight_plot" ||
                mode === "control_points" || mode === "control_points2" || mode === "curve_hero") {

                function hat(x) {
                    if (x <= 0 || x >= 2)
                        return 0;
                    if (x < 1)
                        return x;

                    return 2 - x;
                }

                function funky(x) {
                    if (x <= 0 || x >= 2)
                        return 0;


                    return -(x - 2) * (x - 0);
                }
                function quadratic(x) {
                    if (x <= 0 || x >= 3)
                        return 0;

                    if (x < 1)
                        return x * x * 0.5;

                    if (--x < 1)
                        return -x * x + x + 0.5;

                    --x;
                    return (1 - x) * (1 - x) * 0.5;

                }
                function cubic(x) {
                    if (x <= 0 || x >= 4)
                        return 0;

                    if (x < 1)
                        return x * x * x / 6;
                    if (--x < 1)
                        return (1 + 3 * x + 3 * x * x - 3 * x * x * x) / 6;
                    if (--x < 1)
                        return (4 - 6 * x * x + 3 * x * x * x) / 6;
                    if (--x < 1)
                        return (1 - 3 * x + 3 * x * x - x * x * x) / 6;
                }

                let base_f = hat;
                let deg = 1;

                let pn = points.length;

                if (mode === "spline_cubic_loop_plot")
                    pn += 3;

                if (mode === "spline_funky_plot" || mode === "spline_funky_plot2") {
                    base_f = funky;
                } else if (mode === "spline_quadratic_plot") {
                    base_f = quadratic;
                    deg = 2;
                } else if (mode === "spline_cubic_plot" || mode === "spline_cubic_loop_plot") {
                    base_f = cubic;
                    deg = 3;
                } else if (mode === "spline_cubic_knots_plot" || mode === "spline_cubic_knots_plot2" ||
                    mode === "control_points" || mode === "control_points2" ||
                    mode === "spline_cubic_weight_plot" || mode === "curve_hero") {
                    deg = 3;
                }



                function make(off) {
                    return function (t) {
                        return base_f(t * (pn - deg) + deg - off);
                    }
                }

                let functions = [];
                let knots = [];

                for (let i = -deg; i <= pn; i++) {
                    knots.push(i)
                }

                if (mode === "spline_cubic_loop_plot") {
                    for (let i = 0; i < points.length; i++) {
                        if (i < 3) {
                            let f0 = make(i);
                            let f1 = make(i + points.length);
                            functions.push(function f(t) {
                                return f0(t) + f1(t);
                            });
                        } else {
                            functions.push(make(i));
                        }
                    }

                } else if (mode === "spline_cubic_knots_plot" || mode === "spline_cubic_knots_plot2" ||
                    mode === "spline_cubic_weight_plot" || mode === "curve_hero" ||
                    mode === "control_points" || mode === "control_points2") {


                    let t = (1 - arg1);

                    if (mode === "spline_cubic_knots_plot2" || mode === "control_points" || mode === "control_points2" ||
                        mode === "spline_cubic_weight_plot" || mode === "curve_hero") {
                        t = 0;
                    }

                    for (let i = 0; i < deg; i++) {
                        knots[i] = knots[i] * t
                        knots[pn + deg - i] = (knots[pn + deg - i] - pn + deg) * t + pn - deg;
                    }

                    if (mode === "spline_cubic_knots_plot2") {

                        for (let i = deg + 1; i < pn; i++) {
                            knots[i] = knots[i] / (pn - deg);
                            knots[i] -= 0.4;
                            knots[i] = Math.sign(knots[i]) * Math.max(0, (Math.abs(knots[i]) - arg1 * .2));
                            knots[i] += 0.4;
                            knots[i] = knots[i] * (pn - deg);
                        }

                    }



                    function b_spline(i, k, x) {

                        if (k == 0)
                            return x < knots[i] || x >= knots[i + 1] ? 0 : 1;

                        if (x < knots[i] || x > knots[i + k + 1])
                            return 0;

                        let d0 = knots[i + k] - knots[i];
                        let d1 = knots[i + k + 1] - knots[i + 1];

                        let w0 = d0 == 0 ? 0.0 : (x - knots[i]) / d0;
                        let w1 = d1 == 0 ? 0.0 : (x - knots[i + 1]) / d1;

                        return b_spline(i, k - 1, x) * w0 + b_spline(i + 1, k - 1, x) * (1 - w1);
                    }


                    function make_bb(i, k) {
                        return function (x) { return b_spline(i, k, x * (pn - deg) * 0.999999); }
                    }

                    for (let i = 0; i < points.length; i++) {
                        functions.push(make_bb(i, 3));
                    }

                    if (mode === "spline_cubic_weight_plot") {

                        let w3 = arg1 * arg1 * 10.0
                        let base_functions = functions.slice();
                        for (let i = 3 - 2; i <= 3 + 2; i++) {

                            function wf(i) {
                                return i == 3 ? w3 : 1.0;
                            }

                            functions[i] =
                                function (x) {

                                    let num = make_bb(i, 3)(x) * wf(i);

                                    let denom = 0;
                                    base_functions.forEach((f, i) => denom += f(x) * wf(i));
                                    return num / denom;
                                }
                        }
                    }

                } else {
                    for (let i = 0; i < points.length; i++) {
                        functions.push(make(i));
                    }
                }


                function f(x) {
                    let p = [0, 0];
                    for (let i = 0; i < functions.length; i++) {
                        let w = functions[i](x);
                        p[0] += ps[i][0] * w;
                        p[1] += ps[i][1] * w;
                    }
                    return p;
                }



                ctx.strokeStyle = "rgba(0,0,0,0.4)";
                ctx.fillStyle = "rgba(0,0,0,0.4)";

                ctx.lineWidth = 1;

                let ww = Math.round(width * 0.5);
                let hh = Math.round(height * 0.5);
                ctx.translate(ww, hh);

                let ps = ss_points.map(a => vec_sub(a, [ww, hh]));

                if (mode === "spline_cubic_loop_plot")
                    ps.push(ps[0]);

                draw_control_lines(ps);

                ctx.save();



                ctx.lineWidth = base_line_width;

                if (selected_point !== undefined) {

                    let sf = functions[selected_point];
                    let n = 64 * (points.length - 1);
                    let prev_p = f(0);
                    for (let i = 1; i <= n; i++) {
                        let t = i / n;
                        let p = f(t);
                        ctx.strokeStyle = weight_style(sf(t));
                        ctx.beginPath();
                        ctx.lineTo(p[0], p[1]);
                        ctx.lineTo(prev_p[0], prev_p[1]);
                        ctx.stroke();

                        prev_p = p;
                    }
                } else {


                    let n = 64 * (points.length - 1);
                    ctx.beginPath();
                    for (let i = 0; i <= n; i++) {
                        let t = i / n;
                        let p = f(t);

                        ctx.lineTo(p[0], p[1]);
                    }

                    ctx.strokeStyle = weight_style(0);
                    if (mode === "control_points" || mode === "curve_hero") {
                        ctx.strokeStyle = base_style;
                        if (mode === "curve_hero")
                            ctx.lineWidth = base_line_width * 1.5 * width / 700;
                    }

                    ctx.stroke();
                }

                ctx.restore();

                if (mode !== "control_points" && mode !== "control_points2" && mode !== "curve_hero") {
                    let end = f(arg0);
                    ctx.fillStyle = "#000";
                    ctx.fillEllipse(end[0], end[1], base_target_size);
                }

                let names = undefined;

                if (mode === "spline_cubic_weight_plot")
                    names = ["", "", "", "D", "", "", "", ""];

                draw_control_points(ps, names);

                if (mode !== "control_points" && mode !== "control_points2" && mode !== "curve_hero") {

                    let plot_w = Math.round(width * plot_scale) * 2;
                    let plot_h = Math.ceil(height * 0.2);
                    ctx.translate(- plot_w * 0.5, hh - plot_h - plot_pad);

                    let tt = deg / (points.length - deg);

                    let ppoints = knots.map(x => x / (pn - deg));

                    draw_plot(plot_w, plot_h, functions, arg0, selected_point,
                        [-tt, 1 + tt], (points.length + 1) * 32, ppoints,
                        undefined,
                        mode === "spline_funky_plot2");

                }
            } else if (mode === "train_force0") {

                let s = Math.round(width * 0.45);

                let ww = Math.round(width * 0.5);
                let hh = Math.round(height * 1.1);


                let deg = arg0 * 4;
                {
                    ctx.save();
                    ctx.globalAlpha = 1.0;

                    let clock_r = 15;

                    let sc = 2 * width / 700;

                    ctx.translate(ww, height - Math.round(30 * sc));

                    ctx.scale(sc, sc);
                    ctx.strokeStyle = "#444";
                    ctx.fillStyle = "#444";

                    ctx.strokeEllipse(0, 0, clock_r);

                    ctx.save();
                    ctx.lineWidth = 1 / sc;
                    ctx.strokeStyle = "#777";
                    for (let i = 0; i < 24; i++) {
                        ctx.rotate(Math.PI / 12);
                        ctx.beginPath();
                        ctx.lineTo(0, -clock_r + 2);
                        ctx.lineTo(0, -clock_r + 3);
                        ctx.stroke();
                    }
                    ctx.restore();

                    ctx.fillEllipse(0, 0, 1.5);

                    ctx.save();
                    ctx.strokeStyle = "#000";

                    ctx.rotate(deg);
                    ctx.beginPath();
                    ctx.lineTo(0, 0);
                    ctx.lineTo(0, -clock_r + 4);
                    ctx.stroke();
                    ctx.restore();

                    ctx.lineCap = "butt";
                    ctx.lineWidth = 2 / sc;
                    ctx.save();
                    ctx.beginPath();
                    ctx.lineTo(0, -clock_r);
                    ctx.lineTo(0, -clock_r - 3);
                    ctx.stroke();

                    ctx.lineWidth = 2.5;

                    ctx.rotate(0.8);
                    ctx.beginPath();
                    ctx.lineTo(0, -clock_r);
                    ctx.lineTo(0, -clock_r - 2.5);
                    ctx.stroke();
                    ctx.restore();

                    ctx.lineWidth = 1;

                    ctx.strokeEllipse(0, -clock_r - 5, 2);
                    ctx.restore();
                }


                let track = s * 0.03;
                ctx.translate(ww, hh);

                ctx.scale(-1, 1);
                ctx.rotate(Math.PI * 0.75);

                ctx.lineCap = "butt";
                ctx.beginPath();

                ctx.lineTo(-s, -s * 10);
                ctx.lineTo(-s, 0);
                ctx.bezierCurveTo(-s, 0.55228 * s, -s * 0.55228, s, 0, s);
                ctx.lineTo(s * 10, s);


                ctx.strokeStyle = "#aaa";
                ctx.lineWidth = track + 1;
                ctx.stroke();

                ctx.globalCompositeOperation = "destination-out";

                ctx.strokeStyle = "#000";
                ctx.lineWidth = track - 1;
                ctx.stroke();

                ctx.globalCompositeOperation = "destination-over";


                ctx.strokeStyle = "#666";
                ctx.lineWidth = track + 2;
                ctx.stroke();

                ctx.globalCompositeOperation = "destination-out";

                ctx.strokeStyle = "#000";
                ctx.lineWidth = track - 2;
                ctx.stroke();

                ctx.globalCompositeOperation = "destination-over";

                ctx.strokeStyle = "#713C0A";
                ctx.lineWidth = track * 2;
                ctx.setLineDash([track * 0.3, track * 0.8]);
                ctx.stroke();
                ctx.setLineDash([]);

                ctx.globalAlpha = 0.2;

                ctx.strokeStyle = "#E92525";
                ctx.lineWidth = track * 5;
                ctx.lineCap = "butt";

                ctx.beginPath();
                ctx.lineTo(-s, 0);
                ctx.bezierCurveTo(-s, 0.55228 * s, -s * 0.55228, s, 0, s);
                ctx.stroke();

                ctx.strokeStyle = "#4797D9";

                ctx.beginPath();
                ctx.lineTo(-s, -s * 10);
                ctx.lineTo(-s, 0);
                ctx.stroke();

                ctx.beginPath();
                ctx.lineTo(0, s);
                ctx.lineTo(s * 10, s);
                ctx.stroke();

                ctx.globalAlpha = 1;

                ctx.globalCompositeOperation = "source-over";
                ctx.setLineDash([]);

                let ps = [
                    [-s, 0],
                    [-s, 0.55228 * s],
                    [-s * 0.55228, s],
                    [0, s]
                ]
                let t = arg0;
                let pos, tan;

                let v = 0.5 * Math.PI * s / 0.7;
                if (t < 0.15) {

                    pos = [-s, v * (t - 0.15)];
                    tan = [0, 1];

                } else if (t > 0.85) {

                    pos = [v * (t - 0.85), s];
                    tan = [1, 0];
                } else {
                    let tt = (t - 0.15) / 0.7;
                    pos = cubic_bezier(tt, ps);
                    tan = vec_norm(cubic_bezier_tangent(tt, ps));
                }


                ctx.translate(pos[0], pos[1]);
                ctx.transform(-tan[1], tan[0], tan[0], tan[1], 0, 0);

                if (t > 0.15 && t < 0.85) {
                    ctx.fillStyle = red_style;
                    ctx.arrow(0, 0, -track * 12, 0, track, track * 2.5, track * 4);
                    ctx.fill();

                    ctx.save();
                    ctx.fillStyle = "#333";
                    ctx.font = "500 " + Math.floor(font_size + 2) + "px IBM Plex Sans";

                    ctx.translate(-track * 5, -track * 1.7);
                    ctx.transform(tan[0], tan[1], -tan[1], tan[0], 0, 0);
                    ctx.rotate(Math.PI * 0.25);
                    ctx.fillText("F", 0, +font_size * 0.5);
                    ctx.restore();
                }

                ctx.fillStyle = "#FFBF0A";
                ctx.strokeStyle = "#333";
                ctx.lineWidth = 1.5;
                ctx.save();

                ctx.shadowColor = "rgba(0,0,0,0.4)";
                ctx.shadowBlur = track * 2;
                ctx.shadowOffsetX = 0;
                ctx.shadowOffsetY = track * 0.5;

                let tw = track * 2 - 1;
                let tl = track * 5 - 1;

                ctx.beginPath();
                // ctx.roundRect(-tw*0.5, -tl*0.5, tw, tl, track*0.5);


                ctx.beginPath();
                ctx.lineTo(-tw * 0.5, -tl * 0.5);
                ctx.lineTo(tw * 0.5, -tl * 0.5);
                ctx.lineTo(tw * 0.5, tl * 0.3);
                ctx.bezierCurveTo(tw * 0.5, tl * 0.4, tw * 0.5, tl * 0.5, 0, tl * 0.5);
                ctx.bezierCurveTo(-tw * 0.5, tl * 0.5, -tw * 0.5, tl * 0.4, -tw * 0.5, tl * 0.4);
                ctx.closePath();

                ctx.fill();
                ctx.restore();
                ctx.stroke();

                ctx.fillStyle = "#333";
                ctx.fillEllipse(0, 0, tw * 0.15);



                ctx.feather(canvas.width, canvas.height, canvas.height * 0.1, canvas.height * 0.1, canvas.height * 0.1, canvas.height * 0.1);

            } else if (mode === "high_deg_bezier" || mode === "quad_curve_interpolation" || mode === "cubic_curve_interpolation") {

                let f = function (t) {
                    let s = 1 - t;

                    let factors;

                    if (mode === "high_deg_bezier") {
                        factors = [
                            s * s * s * s * s * s * s * 1.0,
                            s * s * s * s * s * s * t * 7.0,
                            s * s * s * s * s * t * t * 21.0,
                            s * s * s * s * t * t * t * 35.0,
                            s * s * s * t * t * t * t * 35.0,
                            s * s * t * t * t * t * t * 21.0,
                            s * t * t * t * t * t * t * 7.0,
                            t * t * t * t * t * t * t * 1.0,
                        ];
                    } else if (mode === "quad_curve_interpolation") {
                        factors = [
                            s * s * 1.0,
                            s * t * 2.0,
                            t * t * 1.0,
                        ];
                    } else if (mode === "cubic_curve_interpolation") {
                        factors = [
                            s * s * s * 1.0,
                            s * s * t * 3.0,
                            s * t * t * 3.0,
                            t * t * t * 1.0,
                        ];
                    }

                    let p = [0, 0];
                    for (let k = 0; k < factors.length; k++) {
                        p[0] += factors[k] * ss_points[k][0];
                        p[1] += factors[k] * ss_points[k][1];
                    }
                    return p;
                }

                ctx.strokeStyle = "rgba(0,0,0,0.3)";
                ctx.fillStyle = "#555";

                ctx.lineWidth = 1;
                ctx.globalAlpha = smooth_step(0.0, 0.03, arg0) - smooth_step(0.97, 1.0, arg0);

                let pp = ss_points.slice();

                while (pp.length >= 2) {

                    let new_pp = [];
                    for (let i = 0; i < pp.length - 1; i++) {
                        ctx.beginPath();
                        ctx.lineTo(pp[i][0], pp[i][1]);
                        ctx.lineTo(pp[i + 1][0], pp[i + 1][1]);
                        ctx.stroke();

                        let p = vec_lerp(pp[i], pp[i + 1], arg0);

                        new_pp.push(p);
                    }

                    pp = new_pp;
                }

                ctx.globalAlpha = 1;


                ctx.save();

                pp = ss_points.slice();

                while (pp.length >= 2) {


                    let new_pp = [];
                    for (let i = 0; i < pp.length - 1; i++) {

                        let p = vec_lerp(pp[i], pp[i + 1], arg0);

                        if (pp.length == 2) {
                            ctx.fillStyle = "#000";
                            ctx.fillEllipse(p[0], p[1], 5);

                            if (mode === "quad_curve_interpolation" ||
                                mode === "cubic_curve_interpolation") {
                                ctx.fillStyle = "#333";
                                ctx.globalAlpha = saturate(arg0 * (1 - arg0) * 10);
                                ctx.fillText("P", p[0], p[1] - control_points_size - 7);
                                ctx.globalAlpha = 1;
                            }
                        }
                        else {
                            ctx.fillEllipse(p[0], p[1], 3);

                            if (mode === "quad_curve_interpolation") {
                                ctx.fillStyle = "#333";
                                ctx.globalAlpha = saturate(arg0 * (1 - arg0) * 10);

                                ctx.fillText(i == 0 ? "AB" : "BC", p[0], p[1] - control_points_size - 7);
                                ctx.globalAlpha = 1;

                            }
                        }

                        new_pp.push(p);
                    }

                    pp = new_pp;
                }

                ctx.restore();

                ctx.globalCompositeOperation = "source-over";

                let points_names = undefined;

                if (mode !== "high_deg_bezier")
                    points_names = ["A", "B", "C", "D", "E", "F", "G", "H"];


                draw_control_lines(ss_points);
                draw_control_points(ss_points, points_names);

                ctx.save();
                ctx.globalCompositeOperation = "destination-over";
                let n = 128;

                ctx.beginPath();
                {
                    let p = f(0);
                    ctx.lineTo(p[0], p[1]);
                    p = f(0.0001);
                    ctx.lineTo(p[0], p[1]);
                }
                for (let i = 0; i <= n; i++) {
                    let t = i / n;
                    let p = f(t);
                    let next_t = Math.min(1.0, (i + 1) / n);

                    if (arg0 < next_t) {
                        let next_p = f(next_t);
                        p = vec_lerp(p, next_p, (arg0 - t) / (next_t - t));
                        ctx.lineTo(p[0], p[1]);
                        break;
                    }

                    ctx.lineTo(p[0], p[1]);
                }
                ctx.strokeStyle = red_style;
                ctx.lineWidth = 6;
                ctx.stroke();

                ctx.restore();
            } else if (mode === "septic_zoom") {




                let septic_f = function (t, points) {
                    let s = 1 - t;

                    let factors = [
                        s * s * s * s * s * s * s * 1.0,
                        s * s * s * s * s * s * t * 7.0,
                        s * s * s * s * s * t * t * 21.0,
                        s * s * s * s * t * t * t * 35.0,
                        s * s * s * t * t * t * t * 35.0,
                        s * s * t * t * t * t * t * 21.0,
                        s * t * t * t * t * t * t * 7.0,
                        t * t * t * t * t * t * t * 1.0,
                    ];

                    let p = [0, 0];
                    for (let k = 0; k < factors.length; k++) {
                        p[0] += factors[k] * points[k][0];
                        p[1] += factors[k] * points[k][1];
                    }
                    return p;
                }

                function draw(scale) {

                    ctx.save();
                    ctx.scale(scale, scale);
                    let n = 128;

                    ctx.beginPath();

                    for (let i = 0; i <= n; i++) {
                        let t = i / n;
                        let p = septic_f(t, ss_points);

                        ctx.lineTo(p[0], p[1]);
                    }
                    ctx.strokeStyle = red_style;
                    ctx.lineWidth = 8;
                    ctx.stroke();
                    ctx.restore();
                }


                ctx.save();
                let rr = Math.round(width * 0.1);

                ctx.translate(rr + 4 + Math.floor(width * 0.3), height - rr - 4);
                ctx.globalCompositeOperation = "destination-out";
                ctx.fillStyle = "#000";
                ctx.fillEllipse(0, 0, rr);

                ctx.globalCompositeOperation = "destination-over";

                ctx.save();


                ctx.beginPath();
                ctx.rect(-rr, -rr, 2 * rr, 2 * rr);
                ctx.clip();


                ctx.save();

                let p = [3 * rr, 1.56 * rr];

                let scale = 15 * width / 706;
                ctx.translate(-p[0] * scale, -p[1] * scale);
                draw(scale);



                ctx.restore();

                ctx.globalCompositeOperation = "destination-over";

                ctx.fillStyle = "#f8f8f8";
                ctx.fillEllipse(0, 0, rr);

                ctx.globalCompositeOperation = "source-over";

                ctx.globalCompositeOperation = "destination-out";
                ctx.strokeStyle = "#000";
                ctx.lineWidth = rr;
                ctx.strokeEllipse(0, 0, rr * 1.5 - 0.5);

                ctx.restore();


                ctx.restore();
                ctx.globalCompositeOperation = "destination-over";


                draw(1);

                ctx.globalCompositeOperation = "destination-over";
                draw_control_lines(ss_points);

                ctx.globalCompositeOperation = "source-over";

                draw_control_points(ss_points);

                draw_zoom(rr, rr / scale, [rr + 4 + Math.floor(width * 0.3), height - rr - 4], p.slice(0, 2));

            } else if (mode === "tangent") {

                let t = arg0;
                let dt = (1 - arg1) * 0.2 + 0.001;
                let t0 = Math.max(0, t - dt);
                let t1 = Math.min(1, t + dt);

                draw_control_lines(ss_points);

                ctx.lineWidth = base_line_width;

                draw_cubic_bezier(ss_points);

                let p = cubic_bezier(t, ss_points);
                let p0 = cubic_bezier(t0, ss_points);
                let p1 = cubic_bezier(t1, ss_points);

                let l = vec_len(vec_sub(p1, p0));

                let ll = width * 0.1;

                let l0 = vec_lerp(p0, p1, -ll / l);
                let l1 = vec_lerp(p0, p1, 1 + ll / l);

                ctx.strokeStyle = "#333";
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.lineTo(l0[0], l0[1]);
                ctx.lineTo(l1[0], l1[1]);
                ctx.stroke();

                ctx.fillStyle = red_style;
                ctx.fillEllipse(p0[0], p0[1], base_target_size - 1);
                ctx.fillEllipse(p1[0], p1[1], base_target_size - 1);

                ctx.fillStyle = "#000";

                ctx.fillEllipse(p[0], p[1], base_target_size);

                draw_control_points(ss_points);

                ctx.feather(canvas.width, canvas.height, canvas.height * 0.05, canvas.height * 0.05, canvas.height * 0.05, canvas.height * 0.05);


            } else if (mode === "septic_fit" || mode === "cubic_fit") {


                let cubic = mode === "cubic_fit";

                let target_points = [
                    [-1.4958190169787864, -0.10549340786782725, 0],
                    [-1.1169176985523515, -0.6171364360267859, 0],
                    [-0.23692269275373962, -0.7068058327144393, 0],
                    [-0.9762514977262682, 0.5538403913060909, 0],
                    [0.06769576521634596, 0.7120805031078307, 0],
                    [0.6415411507238249, -0.5907630840598299, 0],
                    [1.5349290844768795, -0.6698831399606999, 0],
                    [1.5050309619120146, 0.3021873747443534, 0],
                ];
                target_points = target_points.map(p => vec_scale(p, 1.5));

                let vp = mat4_mul(proj, mat3_to_mat4(rot));

                target_points = target_points.map(a => {
                    let p = mat4_mul_vec3(vp, a);
                    p = vec_scale(p, 1 / p[3]);
                    p[0] = (p[0] + 1) * 0.5 * width;
                    p[1] = (-p[1] + 1) * 0.5 * height;
                    return p;
                });

                let septic_f = function (t, points) {
                    let s = 1 - t;

                    let factors = [
                        s * s * s * s * s * s * s * 1.0,
                        s * s * s * s * s * s * t * 7.0,
                        s * s * s * s * s * t * t * 21.0,
                        s * s * s * s * t * t * t * 35.0,
                        s * s * s * t * t * t * t * 35.0,
                        s * s * t * t * t * t * t * 21.0,
                        s * t * t * t * t * t * t * 7.0,
                        t * t * t * t * t * t * t * 1.0,
                    ];

                    let p = [0, 0];
                    for (let k = 0; k < factors.length; k++) {
                        p[0] += factors[k] * points[k][0];
                        p[1] += factors[k] * points[k][1];
                    }
                    return p;
                }

                let cubic_f = function (t, points) {
                    let s = 1 - t;

                    let factors = [
                        s * s * s * 1.0,
                        s * s * t * 3.0,
                        s * t * t * 3.0,
                        t * t * t * 1.0,
                    ];

                    let p = [0, 0];
                    for (let k = 0; k < factors.length; k++) {
                        p[0] += factors[k] * points[k][0];
                        p[1] += factors[k] * points[k][1];
                    }
                    return p;
                }


                draw_control_points(ss_points);

                ctx.save();
                ctx.globalCompositeOperation = "destination-over";

                let n = 128;

                ctx.beginPath();


                let f = cubic ? cubic_f : septic_f;
                for (let i = 0; i <= n; i++) {
                    let t = i / n;
                    let p = f(t, ss_points);

                    ctx.lineTo(p[0], p[1]);
                }
                ctx.strokeStyle = red_style;
                ctx.lineWidth = 8;
                ctx.stroke();

                draw_control_lines(ss_points);


                ctx.beginPath();

                for (let i = 0; i <= n; i++) {
                    let t = i / n;
                    let p = septic_f(t, target_points);

                    ctx.lineTo(p[0], p[1]);
                }
                ctx.strokeStyle = "#bbb";
                ctx.lineWidth = 8;
                ctx.stroke();

                ctx.restore();


            } else if (mode === "spiral") {


                let ww = Math.round(width * 0.5);
                let hh = Math.round(height * 0.5);

                let s = hh;
                ctx.translate(ww, hh);


                let n = 256;
                ctx.lineWidth = 8;
                ctx.strokeStyle = base_style;
                ctx.beginPath();

                for (let i = 0; i <= n; i++) {
                    let t = i / n;

                    let fi = t * (arg0 - 0.5) * 30;
                    let r = t * s * (0.1 + 0.85 * arg1);
                    let x = Math.cos(fi) * r;
                    let y = Math.sin(fi) * r;
                    ctx.lineTo(x, y);
                }

                ctx.stroke();

            } else if (mode === "linear_segment" || mode === "linear_segment_coords" || mode === "point_coords") {

                let ss_end, end;


                if (mode !== "point_coords") {

                    ss_end = vec_lerp(ss_points[0], ss_points[1], Math.max(0.0001, arg0));
                    end = vec_lerp(points[0], points[1], arg0);

                    ctx.save();
                    // ctx.globalCompositeOperation = "destination-over";

                    ctx.strokeStyle = ctx.fillStyle = base_style;
                    ctx.lineWidth = base_line_width;


                    ctx.beginPath();
                    ctx.lineTo(ss_points[0][0], ss_points[0][1]);

                    if (mode === "linear_segment")
                        ctx.lineTo(ss_end[0], ss_end[1]);
                    else
                        ctx.lineTo(ss_points[1][0], ss_points[1][1]);

                    ctx.stroke();
                    ctx.restore();

                    ctx.fillStyle = mode === "linear_segment" ? red_style : "#000";
                    ctx.fillEllipse(ss_end[0], ss_end[1], base_target_size);


                    ctx.fillStyle = "#333";

                    ctx.globalAlpha = smooth_step(0, 0.05, arg0) - smooth_step(0.95, 1, arg0);

                    if (mode !== "linear_segment")
                        ctx.fillText("P", ss_end[0], ss_end[1] - base_target_size - 7);

                    ctx.globalAlpha = 1;

                    ctx.fillText((mode === "linear_segment_coords" ? "t = " : "progress = ") + arg0.toFixed(2), Math.round(width * 0.5), height - font_size * 0.3);

                }

                draw_control_points(ss_points, ["A", "B"]);

                if (mode !== "linear_segment") {

                    let ww = Math.round(width * 0.5);
                    let hh = Math.round(height * 0.5);
                    ctx.translate(ww, hh);

                    ctx.globalCompositeOperation = "destination-over";

                    ctx.strokeStyle = ctx.fillStyle = "#888";
                    ctx.lineWidth = 1;
                    ctx.beginPath()
                    ctx.lineTo(-ww + 10, 0);
                    ctx.lineTo(ww - 10, 0);
                    ctx.stroke();

                    ctx.beginPath()
                    ctx.lineTo(ww - 8, 0);
                    ctx.lineTo(ww - 20, -3);
                    ctx.lineTo(ww - 20, 3);
                    ctx.fill();

                    ctx.beginPath()
                    ctx.lineTo(0, -hh + 10);
                    ctx.lineTo(0, hh - 10 - font_size);
                    ctx.stroke();

                    ctx.beginPath()
                    ctx.lineTo(0, -hh + 8);
                    ctx.lineTo(-3, -hh + 20);
                    ctx.lineTo(3, -hh + 20);
                    ctx.fill();

                    ctx.fillText("x", ww - 15, 0 - 9);
                    ctx.fillText("y", 15, -hh + font_size);



                    ctx.strokeStyle = "rgba(0,0,0,0.2)"
                    ctx.beginPath()
                    ctx.lineTo(ss_points[0][0] - ww, ss_points[0][1] - hh);
                    ctx.lineTo(ss_points[0][0] - ww, 0);
                    ctx.stroke();


                    if (mode === "linear_segment_coords") {

                        ctx.beginPath()
                        ctx.lineTo(ss_points[1][0] - ww, ss_points[1][1] - hh);
                        ctx.lineTo(ss_points[1][0] - ww, 0);
                        ctx.stroke();

                        ctx.beginPath()
                        ctx.lineTo(ss_end[0] - ww, ss_end[1] - hh);
                        ctx.lineTo(ss_end[0] - ww, 0);
                        ctx.stroke();

                    }

                    ctx.beginPath()
                    ctx.lineTo(0, ss_points[0][1] - hh);
                    ctx.lineTo(ss_points[0][0] - ww, ss_points[0][1] - hh);
                    ctx.stroke();

                    if (mode === "linear_segment_coords") {


                        ctx.beginPath()
                        ctx.lineTo(0, ss_points[1][1] - hh);
                        ctx.lineTo(ss_points[1][0] - ww, ss_points[1][1] - hh);
                        ctx.stroke();

                        ctx.beginPath()
                        ctx.lineTo(0, ss_end[1] - hh);
                        ctx.lineTo(ss_end[0] - ww, ss_end[1] - hh);
                        ctx.stroke();
                    }

                    ctx.font = Math.ceil(font_size * 0.8) + "px IBM Plex Sans";

                    function str(x) {
                        return (x < 0.0 ? "−" : "  ") + Math.abs(x).toFixed(2);
                    }
                    ctx.fillText(str(points[0][0]), ss_points[0][0] - ww,
                        (smooth_step(-0.05, 0.05, points[0][1]) * 1.5 - 0.5) * font_size);

                    if (mode === "linear_segment_coords") {

                        ctx.fillText(str(points[1][0]), ss_points[1][0] - ww,
                            (smooth_step(-0.05, 0.05, points[1][1]) * 1.5 - 0.5) * font_size);

                        ctx.globalAlpha = smooth_step(0, 0.05, arg0) - smooth_step(0.95, 1, arg0);



                        ctx.fillText(str(end[0]), ss_end[0] - ww,
                            (smooth_step(-0.05, 0.05, end[1]) * 1.5 - 0.5) * font_size);
                        ctx.globalAlpha = 1;

                        document.getElementById("linear_segment_coords_ax").textContent = str(points[0][0]);
                        document.getElementById("linear_segment_coords_bx").textContent = str(points[1][0]);
                        document.getElementById("linear_segment_coords_px").textContent = str(end[0]);

                        document.getElementById("linear_segment_coords_ay").textContent = str(points[0][1]);
                        document.getElementById("linear_segment_coords_by").textContent = str(points[1][1]);
                        document.getElementById("linear_segment_coords_py").textContent = str(end[1]);

                        let tstr = str(arg0);

                        document.getElementById("linear_segment_coords_t0").textContent = tstr;
                        document.getElementById("linear_segment_coords_t1").textContent = tstr;
                        document.getElementById("linear_segment_coords_t2").textContent = tstr;
                        document.getElementById("linear_segment_coords_t3").textContent = tstr;

                    }

                    ctx.fillText(str(points[0][1]),

                        (smooth_step(-0.05, 0.05, points[0][0]) * 2 - 1.0) * (-1.3 * font_size)
                        , ss_points[0][1] - hh + font_size / 4);
                    if (mode === "linear_segment_coords") {

                        ctx.fillText(str(points[1][1]),
                            (smooth_step(-0.05, 0.05, points[1][0]) * 2 - 1.0) * (-1.3 * font_size),
                            ss_points[1][1] - hh + font_size / 4);

                        ctx.globalAlpha = smooth_step(0, 0.05, arg0) - smooth_step(0.95, 1, arg0);

                        ctx.fillText(str(end[1]),
                            (smooth_step(-0.05, 0.05, end[0]) * 2 - 1.0) * (-1.3 * font_size),
                            ss_end[1] - hh + font_size / 4);
                        ctx.globalAlpha = 1;

                    }
                }


            } else if (mode === "cubic_spline" || mode === "cubic_spline1" || mode === "cubic_spline2") {

                if (mode !== "cubic_spline2") {
                    draw_control_lines(ss_points, 4);
                }



                ctx.lineWidth = base_line_width;

                let styles = [
                    "#EBBC3F",
                    base_style,
                    "#4797D9",
                ]



                for (let i = 0; i < 3; i++) {
                    ctx.strokeStyle = styles[i];
                    draw_cubic_bezier(ss_points.slice(i * 4, i * 4 + 4));
                }



                if (mode !== "cubic_spline2") {
                    draw_control_points(ss_points);
                } else {
                    ctx.strokeStyle = "rgba(0,0,0,0.2)";
                    ctx.lineWidth = 1;

                    let pairs = [[0, 1], [2, 5], [6, 9], [10, 11]];

                    pairs.forEach(pair => {
                        ctx.beginPath();

                        ctx.lineTo(ss_points[pair[0]][0], ss_points[pair[0]][1]);
                        ctx.lineTo(ss_points[pair[1]][0], ss_points[pair[1]][1]);
                        ctx.stroke();
                    })
                    draw_control_points([ss_points[0], ss_points[3], ss_points[7], ss_points[11]]);



                    ctx.fillStyle = "rgba(255,255,255,0.4)";
                    ctx.strokeStyle = "#333";
                    ctx.lineWidth = 2.5;


                    [ss_points[1], ss_points[2], ss_points[5], ss_points[6], ss_points[9], ss_points[10]].forEach((a, i) => {
                        ctx.fillRect(a[0] - control_points_size / 2, a[1] - control_points_size / 2, control_points_size, control_points_size);
                        ctx.strokeRect(a[0] - control_points_size / 2, a[1] - control_points_size / 2, control_points_size, control_points_size);

                    });

                }

                if (mode === "cubic_spline2")
                    ctx.feather(canvas.width, canvas.height, canvas.height * 0.05, canvas.height * 0.05, canvas.height * 0.05, canvas.height * 0.05);

            } else if (mode === "linear_weight_color") {


                draw_control_points(ss_points);

                ctx.save();
                ctx.globalCompositeOperation = "destination-over";

                ctx.strokeStyle = ctx.fillStyle = red_style;
                ctx.lineWidth = base_line_width;

                // ctx.lineCap = "butt";
                // ctx.fillEllipse(end[0], end[1], 4);

                if (selected_point !== undefined) {
                    let p0 = ss_points[1 - selected_point];
                    let p1 = ss_points[selected_point];

                    let n = 128;
                    let prev_p = p0;
                    for (let i = 1; i <= n; i++) {
                        let t = i / n;
                        let p = vec_lerp(p0, p1, t);
                        ctx.strokeStyle = weight_style(t);
                        ctx.beginPath();
                        ctx.lineTo(p[0], p[1]);
                        ctx.lineTo(prev_p[0], prev_p[1]);
                        ctx.stroke();

                        prev_p = p;
                    }
                } else {
                    ctx.strokeStyle = weight_style(0);

                    ctx.beginPath();
                    ctx.lineTo(ss_points[0][0], ss_points[0][1]);
                    ctx.lineTo(ss_points[1][0], ss_points[1][1]);
                    ctx.stroke();
                }

                ctx.restore();

                ctx.fillStyle = "#333"
                ctx.fillText("A", ss_points[0][0], ss_points[0][1] - control_points_size - 7);
                ctx.fillText("B", ss_points[1][0], ss_points[1][1] - control_points_size - 7);
            } else if (mode === "bspline_creation" || mode === "bspline_creation2") {

                let ww = Math.round(width * 0.5);
                let hh = Math.round(height * 0.5);

                let ah = Math.round(height * 0.02);
                ctx.translate(0, ah);

                let outpad = 15;
                let inpad = 50;
                let plot_extent = 10;

                let pw = width - outpad * 2 - inpad;
                pw = Math.floor(pw / 2);
                let ph = hh;

                let n = 4;
                let knots = [];

                for (let i = 0; i <= n + 1; i++)
                    knots.push(i);


                if (mode === "bspline_creation2") {
                    let t = (1 - arg1);
                    let deg = 3;
                    let pn = n;
                    for (let i = 0; i <= deg; i++) {
                        // knots[i] -= deg;
                        knots[i] = knots[i] * (1 - arg1 * 0.9999);
                        // knots[i] += deg;
                    }
                }




                function b_spline(i, k, x) {

                    if (k == 0)
                        return x < knots[i] || x >= knots[i + 1] ? 0 : 1;

                    let d0 = knots[i + k] - knots[i];
                    let d1 = knots[i + k + 1] - knots[i + 1];

                    let w0 = d0 == 0 ? 0.0 : (x - knots[i]) / d0;
                    let w1 = d1 == 0 ? 0.0 : (x - knots[i + 1]) / d1;

                    return b_spline(i, k - 1, x) * w0 + b_spline(i + 1, k - 1, x) * (1 - w1);
                }


                let points = knots.map(x => x / n);
                points.pop();

                let fstep = Math.floor(arg0 * 3);
                let fstep_t = arg0 * 3 - fstep;

                let step = Math.floor(fstep_t * 5);
                let step_t = fstep_t * 5 - step;

                let fh = ph * 0.8;

                for (let i = 0; i < 2; i++) {
                    ctx.save();

                    ctx.globalAlpha = 1;
                    if (step <= 1 && i == 1) {
                        ctx.globalAlpha = step == 0 ? 0 : smooth_step(0.2, 0.5, step_t);
                    }

                    ctx.translate(outpad + i * (pw + inpad), 0);
                    let sign = 1 - 2 * i;

                    if (step == 0) {
                        ctx.translate((pw + inpad) * 0.5 * sign, 0);

                        let tx = smooth_step(0.1, 0.9, step_t) * (pw + inpad) * 0.5;
                        ctx.translate(-tx, 0);
                    }
                    if (step == 3) {

                        let tx = smooth_step(0.1, 0.9, step_t) * (pw + inpad) * 0.5 * sign;
                        let ty = -(smooth_step(0.1, 0.5, step_t) - smooth_step(0.5, 0.9, step_t)) * hh * 0.2 * sign;
                        ctx.translate(tx, ty);
                    } else if (step >= 3) {
                        ctx.translate((pw + inpad) * 0.5 * sign, 0);


                    }

                    ctx.beginPath();
                    ctx.lineTo(0, ph);
                    ctx.lineTo(pw, ph);
                    ctx.stroke();

                    ctx.fillStyle = "black";

                    let points_colors = [
                        "#ff595e",
                        "#ffca3a",
                        "#8ac926",
                        "#1982c4",
                        "#6a4c93",
                    ]
                    points.forEach((x, i) => {
                        ctx.fillStyle = points_colors[i];
                        ctx.beginPath();
                        ctx.lineTo(x * pw, ph);
                        ctx.lineTo(x * pw - 4, ph + 9);
                        ctx.lineTo(x * pw + 4, ph + 9);
                        ctx.fill();
                    })

                    ctx.lineWidth = 4;
                    ctx.strokeStyle = "#333";
                    ctx.lineCap = "butt";

                    ctx.beginPath();
                    ctx.lineTo(points[0] * pw - plot_extent, ph);
                    ctx.lineTo(points[0] * pw, ph);
                    ctx.stroke();

                    if (i == 1 && step > 0) {
                        ctx.save();
                        if (step == 4)
                            ctx.globalAlpha = 1 - smooth_step(0., 0.9, step_t);

                        ctx.beginPath();
                        ctx.lineTo(points[0] * pw, ph);
                        ctx.lineTo(points[0 + i] * pw, ph);
                        ctx.stroke();
                        ctx.restore();
                    }

                    let triangle_scale = 1;

                    if (step == 2) {
                        triangle_scale = 1 - smooth_step(0.2, 0.8, step_t);
                    } else if (step > 2) {
                        triangle_scale = 0;
                    }
                    let kn = 32;

                    ctx.save();



                    if (fstep == 0) {
                        ctx.beginPath();
                        ctx.lineTo(points[0 + i] * pw, ph - fh * (i == 0 ? triangle_scale : 1));
                        ctx.lineTo(points[1 + i] * pw, ph - fh * (i == 1 ? triangle_scale : 1));
                        ctx.stroke();
                    } else {
                        ctx.beginPath();
                        for (let p = 0; p < fstep + 1; p++) {
                            for (let k = 0; k <= kn; k++) {
                                let tt = k / kn;

                                let x = lerp(knots[p + i], knots[p + 1 + i], tt);
                                let scale = i == 0 ? lerp(sharp_step(knots[0], knots[fstep + 1], x), 1, triangle_scale)
                                    : lerp(sharp_step(knots[fstep + 2], knots[1], x), 1, triangle_scale);

                                let val = scale * b_spline(i, fstep, x);

                                if (step >= 4) {
                                    let ff = step == 4 ? step_t : 1;
                                    if (i == 0)
                                        val = lerp(val, b_spline(0, fstep + 1, x), ff);
                                    else
                                        val = lerp(val, b_spline(0, fstep + 1, lerp(knots[p + 1], knots[p + 2], tt)), ff);
                                }
                                ctx.lineTo(lerp(points[i + p], points[1 + i + p], tt) * pw,
                                    ph - fh * val);
                            }
                        }



                        ctx.stroke();
                    }


                    ctx.restore();

                    if (i == 0) {
                        ctx.save();
                        if (step == 4)
                            ctx.globalAlpha = 1 - smooth_step(0.1, 0.9, step_t);

                        ctx.beginPath();
                        ctx.lineTo(points[1 + fstep] * pw, ph);
                        ctx.lineTo(points[Math.min(4, 2 + fstep)] * pw, ph);
                        ctx.stroke();
                        ctx.restore();

                    }


                    ctx.beginPath();
                    ctx.lineTo(points[Math.min(4, 2 + fstep)] * pw, ph);
                    ctx.lineTo(points[Math.min(4, 4 + i)] * pw + plot_extent, ph);
                    ctx.stroke();

                    if (step == 2) {

                        ctx.strokeStyle = "#F1645A";
                        ctx.setLineDash([3, 3]);
                        ctx.lineWidth = 1;
                        ctx.globalAlpha = smooth_step(0, 0.2, step_t) - smooth_step(0.8, 1, step_t);
                        ctx.beginPath();
                        ctx.lineTo(points[0 + i] * pw, ph - fh * (i == 1 ? 1 : 0));
                        ctx.lineTo(points[1 + fstep + i] * pw, ph - fh * (i == 0 ? 1 : 0));
                        ctx.stroke();

                        ctx.setLineDash([]);

                        ctx.fillStyle = "rgba(240,100,90,0.1)"
                        ctx.beginPath();
                        ctx.lineTo(points[0 + i] * pw, ph);
                        ctx.lineTo(points[1 + fstep + i] * pw, ph);
                        ctx.lineTo(points[1 + fstep + i] * pw, ph - fh * (i == 1 ? triangle_scale : 1));
                        ctx.lineTo(points[0 + i] * pw, ph - fh * (i == 0 ? triangle_scale : 1));
                        ctx.fill();

                        ctx.fillStyle = "#F1645A";

                        let an = Math.ceil((points[1 + i + fstep] - points[0 + i]) * pw / 7);
                        for (let k = 0; k < an; k++) {
                            let tt = (k + 0.5) / an;
                            let x = lerp(points[0 + i] * pw, points[1 + i + fstep] * pw, tt);


                            let scale = lerp(i == 0 ? tt : (1 - tt), 1, triangle_scale) * fh;

                            ctx.arrow(x, -ah, x, ph - scale, 2, 7, 12);
                            ctx.fill();
                        }

                    }


                    ctx.restore();
                }


                let txts = ["Get a base function of order " + (Math.floor(arg0 * 3 + 0.1 * 5 / 3) + 1),
                mode === "bspline_creation2" ? "Get the neighboring base function"
                    : "Duplicate it and shift it right by one unit",
                    "Squeeze the functions to triangular shapes",
                    "Overlap the functions",
                    "Then add them to...",];

                let tt = (step_t + 0.1) % 1;
                let tstep = Math.floor(Math.floor(fstep_t * 5 + 0.1) % 5);
                ctx.globalAlpha = smooth_step(0, 0.1, tt) - smooth_step(0.9, 1, tt);

                ctx.fillText(txts[tstep], ww, height - font_size);
            }

        }

        if (load_text)
            document.fonts.load("10px IBM Plex Sans").then(function () { request_repaint() });

        window.addEventListener("resize", this.on_resize, true);
        window.addEventListener("load", this.on_resize, true);

        this.on_resize();

    }

    document.addEventListener("DOMContentLoaded", function (event) {

        let strings = ["t", "(1 &minus; t)", "s", "(1 &minus; s)"];

        ["t", "nt", "s", "ns"].forEach((s, k) => {

            let divs = document.getElementsByClassName(s)
            for (let i = 0; i < divs.length; i++) {
                let div = divs[i];

                let triangle = document.createElement("div");
                triangle.classList.add("triangle");


                if (!div.classList.contains("small")) {
                    let text = document.createElement("div");
                    text.innerHTML = strings[k];
                    text.classList.add("text");

                    div.appendChild(text);
                }
                div.appendChild(triangle);
            }
        })




        function make_drawer(name, slider_count, args) {
            let ret = [];

            let drawer = new Drawer(document.getElementById("cs_" + name), name);
            ret.push(drawer);

            if (slider_count === undefined)
                slider_count = 0;

            for (let i = 0; i < slider_count; i++) {
                let slider = new Slider(document.getElementById("cs_" + name + "_sl" + i), function (x) {
                    if (i == 0)
                        drawer.set_arg0(x);
                    else if (i == 1)
                        drawer.set_arg1(x);
                    else if (i == 2)
                        drawer.set_arg2(x);
                }, undefined, args ? args[i] : 0.5);
                ret.push(slider);
            }

            return ret;
        }

        make_drawer("spiral", 2, [0.3, 0.7]);

        make_drawer("curve_hero", 0);
        control_points = make_drawer("control_points", 0);
        make_drawer("control_points2", 0);

        linear_segment = make_drawer("linear_segment", 1, [0]);
        make_drawer("linear_segment_coords", 1, [0.3]);
        make_drawer("point_coords");
        make_drawer("linear_weight_color", 0);

        make_drawer("linear_segment_3d", 1, [0]);
        make_drawer("cubic_bezier_3d", 0);

        make_drawer("surface", 1, [0]);
        linear_patch = make_drawer("linear_patch", 1, [0]);
        make_drawer("linear_patch_point", 2);
        make_drawer("linear_patch_point2", 2);
        make_drawer("linear_patch_point3", 2);
        make_drawer("linear_patch_point4", 2);


        linear_segment_weight_plot = make_drawer("linear_segment_weight_plot", 1, [0.2]);


        make_drawer("quad_curve", 1, [0]);
        quad_curve_plot = make_drawer("quad_curve_plot", 1);
        quad_curve_plot2 = make_drawer("quad_curve_plot2", 1, [0.3]);

        make_drawer("cubic_curve_plot", 1);

        make_drawer("septic_curve_plot", 1);
        make_drawer("septic_curve_plot2", 1);

        make_drawer("cubic_linear_patch", 1, [0]);
        make_drawer("cubic_four_curves_surface", 1, [0]);
        make_drawer("cubic_four_curves_surface2", 2, [0.3, 0.6]);
        make_drawer("cubic_patch", 0);
        make_drawer("cubic_patch2", 2);
        make_drawer("two_cubic_patches", 0);
        two_cubic_patches_normals = make_drawer("two_cubic_patches_normals", 0);
        two_cubic_patches_mirror = make_drawer("two_cubic_patches_mirror", 2, [0, 0]);
        two_cubic_patches_lambert = make_drawer("two_cubic_patches_lambert", 1, [0]);
        two_cubic_patches_side = make_drawer("two_cubic_patches_side", 2, [0, 0]);

        make_drawer("cubic_patch_mirror", 1, [0]);

        make_drawer("cubic_patch_mirror_normals", 1, [0]);

        make_drawer("cubic_curve_circle", 1);
        cubic_curve_curvature = make_drawer("cubic_curve_curvature", 1, [0]);

        make_drawer("cubic_curve_comb", 0);


        linear_patch_symmetry = make_drawer("linear_patch_symmetry", 2);

        make_drawer("linear_patch_hats", 2);
        make_drawer("linear_patch_hats2", 2);

        make_drawer("cubic_fit", 0);
        septic_fit = make_drawer("septic_fit", 0);
        make_drawer("septic_zoom", 0);

        cubic_spline = make_drawer("cubic_spline", 0);
        make_drawer("cubic_spline1", 0);
        make_drawer("cubic_spline2", 0);

        make_drawer("tangent", 2);

        make_drawer("spline_triangle_plot", 1);
        make_drawer("spline_funky_plot", 1);
        make_drawer("spline_funky_plot2", 1);
        make_drawer("spline_quadratic_plot", 1);
        make_drawer("spline_cubic_plot", 1);
        make_drawer("spline_cubic_loop_plot", 1);
        make_drawer("spline_cubic_knots_plot", 2);
        make_drawer("spline_cubic_knots_plot2", 2);
        make_drawer("spline_cubic_weight_plot", 2);

        make_drawer("surface_tangent_plane", 3, [0.8, 0.4, 0.2]);
        make_drawer("surface_normal", 2, [0.8, 0.4]);

        make_drawer("cubic_patch_curvature_cut", 3);
        make_drawer("cubic_patch_curvature_circle", 3, [0.3, 0.6, 0.5]);
        cubic_patch_curvature_circle_principal = make_drawer("cubic_patch_curvature_circle_principal", 2, [0.9, 0.5]);

        chaikin = make_drawer("chaikin", 2, [0, 0.5]);
        chaikin_cubic = make_drawer("chaikin_cubic", 2, [0, 0.5]);

        make_drawer("chaikin_quadratic_bspline", 1, [0]);
        make_drawer("chaikin_cubic_bspline", 1, [0]);
        make_drawer("curve_subdiv_topo", 1, [0]);

        bspline_creation = make_drawer("bspline_creation", 1, [0]);
        make_drawer("bspline_creation2", 2, [0]);

        make_drawer("high_deg_bezier", 1);
        make_drawer("quad_curve_interpolation", 1);
        make_drawer("cubic_curve_interpolation", 1);

        make_drawer("bspline_surface", 0);
        make_drawer("bspline_surface2", 0);

        make_drawer("nurbs_hole", 3);


        make_drawer("subdiv0", 1, [0]);
        make_drawer("subdiv1", 1, [0]);
        make_drawer("subdiv2", 0);
        make_drawer("subdiv_hero", 0);
        make_drawer("subdiv_hero2", 1, [0]);

        make_drawer("subdiv_base_patch", 1, [0]);
        make_drawer("subdiv_base_patch2", 1, [0]);


        make_drawer("subdiv_base", 0);

        make_drawer("train_force0", 1, [0]);
        make_drawer("paper", 1, [0]);

        make_drawer("linear_patch_quad_curve_flat", 1);



        let square_drawer = new Drawer(document.getElementById("cs_square"), "square");
        new Slider(document.getElementById("cs_square_sl0"), function (x) {

            square_drawer.set_arg0(x);
        }, undefined, 0.3);
        new VerticalSlider(document.getElementById("cs_square_sl1"), function (x) {

            square_drawer.set_arg1(x);
        });


        let quad_drawer = new Drawer(document.getElementById("cs_linear_patch_quad_curve"), "linear_patch_quad_curve");
        let quad_drawer_sliders = [];

        function set_drawer_slider(i, x) {
            if (quad_drawer_sliders.length == 2)
                quad_drawer_sliders[i].set_value(x);
        }
        quad_drawer_sliders.push(new Slider(document.getElementById("cs_linear_patch_quad_curve_sl0"), function (x) {

            quad_drawer.set_arg0(x);
            set_drawer_slider(1, x);
        }));

        quad_drawer_sliders.push(new Slider(document.getElementById("cs_linear_patch_quad_curve_sl1"), function (x) {

            quad_drawer.set_arg0(x);
            set_drawer_slider(0, x);
        }));


        linear_patch_quad_curve = quad_drawer;



        let continuities = make_drawer("continuities", 0);


        new SegmentedControl(document.getElementById("cs_continuities_seg0"), function (x) {
            continuities[0].set_arg0(x);
            continuities[0].reapply_restrictions();
        },
            ["none", "G0", "G1", "G2"]
        );

        if ("IntersectionObserver" in window) {
            const observer = new IntersectionObserver(entries => {
                entries.forEach(entry => {entry.target.drawer.set_visible(entry.isIntersecting);})
            }, {rootMargin: "100px"})

            all_containers.forEach(container => observer.observe(container));
        } else  {
            all_containers.forEach(container => container.drawer.set_visible(true));
        }


    });
})();


function cubic_chaikin_weights() {
    chaikin_cubic[0].set_arg1(0.5);
    chaikin_cubic[2].set_value(0.5);
}

function control_points_swap() {
    let ps = control_points[0].points();
    let t = ps[4];
    ps[4] = ps[3];
    ps[3] = t;
    control_points[0].set_points(ps);
}

function progress_50() {
    linear_segment[0].set_arg0(0.5);
    linear_segment[1].set_value(0.5);
}

function progress_90() {
    linear_segment[0].set_arg0(0.90);
    linear_segment[1].set_value(0.90);
}

function progress_99() {
    linear_segment[0].set_arg0(0.99);
    linear_segment[1].set_value(0.99);
}

function linear_segment_weight_plot_1() {
    linear_segment_weight_plot[0].set_arg0(1);
    linear_segment_weight_plot[1].set_value(1);
}

function linear_patch_f0() {

    let points = [];
    for (let j = 0; j <= 1; j++) {
        for (let i = 0; i <= 1; i++) {
            points.push([j - 0.5, i - 0.5, 0.0]);
        }
    }

    points[3][1] = 0.1;
    points[3][2] = 0.1;
    points[2][1] = -0.1;
    points = points.map(p => vec_scale(p, 1.5));
    linear_patch[0].set_points(points);

}

function linear_patch_f1() {
    linear_patch[0].set_arg0(0.5);
    linear_patch[1].set_value(0.5);
}

function linear_patch_f2() {

    let points = [];
    for (let j = 0; j <= 1; j++) {
        for (let i = 0; i <= 1; i++) {
            points.push([j - 0.5, i - 0.5, 0.0]);
        }
    }

    points[3][0] = -0.2;

    points = points.map(p => vec_scale(p, 1.5));

    linear_patch[0].set_points(points);
}

function linear_patch_symmetry_f0() {
    let points = [
        [-0.49267200821428003, -0.9486648498884359, -0.07222560865636403],
        [-0.838382018133068, 0.5315064540387805, -0.6169441941771431],
        [-0.28540309205679915, 0.14596675453693747, 1.0978826786834648],
        [1.132971688709113, 0.39375461231235426, -0.08492383054987038]];

    let rot = [0.7240980683194795, 0.6890574640674203, -0.029695095032265785,
        -0.6709635598902701, 0.7137436952009591, 0.20094237696477896,
        0.15965553155270246, -0.12557766032959244, 0.9791528800298598];

    linear_patch_symmetry[0].set_points(points);
    linear_patch_symmetry[0].set_rot(rot);
    linear_patch_symmetry[0].set_arg0(1);
    linear_patch_symmetry[0].set_arg1(1);

    linear_patch_symmetry[1].set_value(1);
    linear_patch_symmetry[2].set_value(1);

}

function linear_patch_quad_curve_f0() {

    let points = [];
    for (let j = 0; j <= 1; j++) {
        for (let i = 0; i <= 1; i++) {
            points.push([j - 0.5, i - 0.5, -0.5]);
        }
    }

    points[0][2] = 0.5;
    points[3][2] = 0.5;

    linear_patch_quad_curve.set_points(points);

    let rot = [0.7007623271818373, 0.7122069910272723, -0.04115048887410637,
        0.091548777111713, -0.032572244322617995, 0.9952677380027622,
        0.7074962771718636, -0.7012134131857917, -0.08802708081201202];

    linear_patch_quad_curve.set_rot(rot);
}

function quad_curve_plot_f0() {
    quad_curve_plot[0].set_arg0(0);
    quad_curve_plot[1].set_value(0);
}

function quad_curve_plot_f1() {
    quad_curve_plot[0].set_arg0(1);
    quad_curve_plot[1].set_value(1);
}

function quad_curve_plot_f2() {
    quad_curve_plot[0].set_arg0(0.4);
    quad_curve_plot[1].set_value(0.4);
}

function quad_curve_plot2_f0() {

    let ps = [[-1.4578413901463678, 0.339688773334402, 0],
    [-1.8052109460929509, 0.8732279263776713, 0],
    [1.5492219333360053, 0.09076308405982962, 0]];

    quad_curve_plot2[0].set_points(ps);
}

function quad_curve_plot2_f1() {
    quad_curve_plot2[0].set_arg0(0.5);
    quad_curve_plot2[1].set_value(0.5);
}

function cubic_spline_f0() {
    let ps = cubic_spline[0].points();

    ps[4] = ps[3];
    ps[8] = ps[7];
    cubic_spline[0].set_points(ps);
}

function cubic_curve_curvature_f0() {
    let ps = [[-2, 0, 0], [-2 / 3, 0, 0], [2 / 3, 0, 0], [2, 0, 0]];
    cubic_curve_curvature[0].set_points(ps);
}

function cubic_curve_curvature_f1() {
    let ps = [[-1.3058533762297004, 0.05169176985523512, 0],
    [1.4748495130502153, 0.5907630840598301, 0],
    [1.4937349843504286, 0.42830323594337666, 0],
    [-0.16366979536912613, -0.29538154202991485, 0]];
    cubic_curve_curvature[0].set_points(ps);
}

function two_cubic_patches_mirror_f0() {

    two_cubic_patches_mirror[0].set_rot([0.905753503409964, -0.4104416256825366, 0.10558533500280129,
        0.2787574176333325, 0.7646324659727656, 0.5810606630075738,
        -0.31922545821875464, -0.49686503588749475, 0.8069821825403243]);
    two_cubic_patches_mirror[0].set_arg0(0.442);
    two_cubic_patches_mirror[0].set_arg1(0);
    two_cubic_patches_mirror[1].set_value(0.442);
    two_cubic_patches_mirror[2].set_value(0);
}


function two_cubic_patches_mirror_f1() {

    two_cubic_patches_mirror[0].set_rot([0.905753503409964, -0.4104416256825366, 0.10558533500280129,
        0.2787574176333325, 0.7646324659727656, 0.5810606630075738,
        -0.31922545821875464, -0.49686503588749475, 0.8069821825403243]);
    two_cubic_patches_mirror[0].set_arg0(0.442);
    two_cubic_patches_mirror[0].set_arg1(1);
    two_cubic_patches_mirror[1].set_value(0.442);
    two_cubic_patches_mirror[2].set_value(1);
}

function two_cubic_patches_side_f0() {
    two_cubic_patches_side[0].set_arg0(0.4);
    two_cubic_patches_side[0].set_arg1(0);
    two_cubic_patches_side[1].set_value(0.4);
    two_cubic_patches_side[2].set_value(0);
}

function two_cubic_patches_side_f1() {
    two_cubic_patches_side[0].set_arg0(0.4);
    two_cubic_patches_side[0].set_arg1(1);
    two_cubic_patches_side[1].set_value(0.4);
    two_cubic_patches_side[2].set_value(1);
}

function two_cubic_patches_lambert_f0() {
    two_cubic_patches_lambert[0].set_rot([0.5076532577324352, -0.763432023111832, 0.3993240739061696,
        -0.11573645334519285, 0.39886023006983434, 0.9096788390611898,
        -0.8537524484771446, -0.508017778188927, 0.1141257804497512]);
    two_cubic_patches_lambert[0].set_arg0(0);
    two_cubic_patches_lambert[1].set_value(0);
}

function two_cubic_patches_lambert_f1() {
    two_cubic_patches_lambert[0].set_rot([0.5076532577324352, -0.763432023111832, 0.3993240739061696,
        -0.11573645334519285, 0.39886023006983434, 0.9096788390611898,
        -0.8537524484771446, -0.508017778188927, 0.1141257804497512]);
    two_cubic_patches_lambert[0].set_arg0(1);
    two_cubic_patches_lambert[1].set_value(1);
}

function chaikin_f0() {
    chaikin[0].set_arg0(1);
    chaikin[0].set_arg1(0.2);
    chaikin[1].set_value(1);
    chaikin[2].set_value(0.2);
}

function chaikin_f1() {
    chaikin[0].set_arg0(1);
    chaikin[0].set_arg1(0.8);
    chaikin[1].set_value(1);
    chaikin[2].set_value(0.8);
}

function chaikin_f2() {
    chaikin[0].set_arg0(1);
    chaikin[0].set_arg1(0.47);
    chaikin[1].set_value(1);
    chaikin[2].set_value(0.47);
}

function chaikin_f3() {
    chaikin[0].set_arg0(1);
    chaikin[0].set_arg1(0.5);
    chaikin[1].set_value(1);
    chaikin[2].set_value(0.5);
}

function bspline_creation_f0() {
    bspline_creation[0].set_arg0(0.34);
    bspline_creation[1].set_value(0.34);
}

function bspline_creation_f1() {
    bspline_creation[0].set_arg0(0.67);
    bspline_creation[1].set_value(0.67);
}

function septic_fit_f0() {
    let target_points = [
        [-1.4958190169787864, -0.10549340786782725, 0],
        [-1.1169176985523515, -0.6171364360267859, 0],
        [-0.23692269275373962, -0.7068058327144393, 0],
        [-0.9762514977262682, 0.5538403913060909, 0],
        [0.06769576521634596, 0.7120805031078307, 0],
        [0.6415411507238249, -0.5907630840598299, 0],
        [1.5349290844768795, -0.6698831399606999, 0],
        [1.5050309619120146, 0.3021873747443534, 0],
    ];

    target_points = target_points.map(p => vec_scale(p, 1.5));


    septic_fit[0].set_points(target_points);
}

function two_cubic_patches_normals_f0() {
    let p = two_cubic_patches_normals[0].points();

    for (let i = 0; i < 4; i++)
        p[20 + i] = vec_add(p[16 + i], vec_sub(p[12 + i], p[8 + i]));


    two_cubic_patches_normals[0].set_points(p);
}

function cubic_patch_curvature_circle_principal_f0() {
    let ps = [];

    for (let j = 0; j <= 3; j++) {
        for (let i = 0; i <= 3; i++) {
            ps.push([j / 3 - 0.5 + 0.001 * j * j,
            i / 3 - 0.5 + 0.001 * j * j,
            2.0 * (i / 3) * (1 - i / 3)]);
        }
    }
    cubic_patch_curvature_circle_principal[0].set_points(ps);
}


function cubic_patch_curvature_circle_principal_f1() {

    let qp = [[-0.5, -0.5, 0.75],
    [0.5, -0.5, -0.75],
    [-0.5, 0.5, -0.75],
    [0.5, 0.5, 0.75]];

    let p10 = vec_lerp(qp[0], qp[2], 1 / 3);
    let p13 = vec_lerp(qp[1], qp[3], 1 / 3);
    let p20 = vec_lerp(qp[0], qp[2], 2 / 3);
    let p23 = vec_lerp(qp[1], qp[3], 2 / 3);

    let pp = [qp[0],
    vec_lerp(qp[0], qp[1], 1 / 3),
    vec_lerp(qp[0], qp[1], 2 / 3),
    qp[1],

        p10,
    vec_lerp(p10, p13, 1 / 3),
    vec_lerp(p10, p13, 2 / 3),
        p13,

        p20,
    vec_lerp(p20, p23, 1 / 3),
    vec_lerp(p20, p23, 2 / 3),
        p23,

    qp[2],
    vec_lerp(qp[2], qp[3], 1 / 3),
    vec_lerp(qp[2], qp[3], 2 / 3),
    qp[3]];
    cubic_patch_curvature_circle_principal[0].set_points(pp);
}