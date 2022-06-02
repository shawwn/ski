"use strict";

let models = {
    "cube": {
        "index_offset": 0,
        "index_count": 9204,
    },
    "hull": {
        "index_offset": 9204,
        "index_count": 11016,
    },
    "rudder": {
        "index_offset": 20220,
        "index_count": 1926,
    },
    "tub": {
        "index_offset": 22146,
        "index_count": 16884,
    },
    "box": {
        "index_offset": 39030,
        "index_count": 36,
    },
}


let animated_drawers = [];
let drawers_ready = false;
let all_drawers = [];

let active_sliders_held = [];
let active_objects = [];

let water_fill_style = "#88C3EE";
let water_stroke_style = "#6591B1";
let container_stroke_style = "#9A9EAA";
let container_inner_stroke_style = "#E2E2E2";
let container_outer_stroke_style = "#7F7F7F";
let container_top_stroke_style = "#979797";
let container_fill_style = "rgba(0,0,0,0.028)";
let table_fill_style = "#C8A070"
let table_stroke_style = "#7E6546";
let wood_fill_style = "#D8A972";
let wood_stroke_style = "#8F704B";

let weight_fill_style = "#C2A869";
let weight_stroke_style = "#645634";
let buoy_fill_style = "#9CC7DF";
let buoy_stroke_style = "#334D5C";

let arrow_fill_style = "rgba(255,255,255, 0.8)";


let wave_w = 368;
let wave_h = 64;

let wind_w = 120 * 4;
let wind_h = 40;

let wind_uri;


let omegadot_omega_factor = 0.07;

let weight_pressure;
let L_demo;
let hull_ratio;
let wind_tilt;
let tilt;
let prop_n;
let prop_n_seg;
let loading;
let cgy_plot;
let slide;
let pitch_force;
let free_surface;
let arm_plot;

(function () {
    let scale = window.devicePixelRatio || 1;
    scale = scale > 1.75 ? 2 : 1;

    function download_file(file_path, handler) {
        var xhr = new XMLHttpRequest();
        xhr.open("GET", file_path);
        xhr.responseType = "arraybuffer";

        xhr.onload = function (oEvent) {
            var buffer = xhr.response;
            if (buffer) {
                handler(buffer);
            }
        };
        xhr.send();
    }

    function GLDrawer(scale, ready_callback) {




        let canvas = document.createElement("canvas");
        this.canvas = canvas;
        let gl = canvas.getContext('experimental-webgl', { antialias: true });

        var ext = gl.getExtension('OES_element_index_uint');

        var viewport_x = 0;
        var viewport_y = 0;
        var viewport_w = 0;
        var viewport_h = 0;


        let basic_vertex_buffer = gl.createBuffer();
        let basic_index_buffer = gl.createBuffer();


        let has_vertices = false;
        let has_indicies = false;

        let vertex_buffer = gl.createBuffer();
        let index_buffer = gl.createBuffer();

        function mark_ready() {
            if (has_vertices && has_indicies) {
                ready_callback();
            }
        }

        download_file("/models/navarch_vertices.dat", function (buffer) {
            gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(buffer), gl.STATIC_DRAW);
            gl.bindBuffer(gl.ARRAY_BUFFER, null);
            has_vertices = true;
            mark_ready();
        });

        download_file("/models/navarch_indices.dat", function (buffer) {
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, index_buffer);
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(buffer), gl.STATIC_DRAW);
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
            has_indicies = true;
            mark_ready();
        });





        let blade_index_offset = 0;
        let blade_index_count = 0;

        let hub_index_offset = 0;
        let hub_index_count = 0;


        let arrow_index_offset = 0;
        let arrow_index_count = 0;

        let curl_arrow_index_offset = 0;
        let curl_arrow_index_count = 0;

        let segment_index_offset = 0;
        let segment_index_count = 0;

        let helicoid_index_offset = 0;
        let helicoid_index_count = 0;


        function gen_basic_geometry() {

            let vertices = [];
            let indices = [];


            // blade
            for (let k = 0; k < 2; k++) {

                let n = 30;
                let m = 20;

                let z_sign = k == 0 ? -1 : 1;
                let zh = k == 0 ? 0.02 : 0.1;

                for (let j = 0; j <= n; j++) {

                    let t = j / n;
                    let nt = 1 - t;
                    let y = + 3 * nt * t * t + t * t * t;

                    let r = 0.5;


                    let yy = Math.sqrt(1 - y);

                    let f = 0.05 + 0.95 * Math.sin(t * Math.PI * 0.5);
                    // let p = lerp(0.02, 0.0, t);
                    let x0 = 0.9 * Math.sqrt(r * r - (y - 0.5) * (y - 0.5)) * f;
                    let x1 = -x0;
                    for (let i = 0; i <= m; i++) {
                        let xt = i / m;
                        xt = + 3 * (1 - xt) * xt * xt + xt * xt * xt;
                        let x = lerp(x0, x1, xt);

                        let z = -z_sign * zh * Math.pow((xt) * (1 - xt), 0.5) * yy;

                        // z = 0;
                        vertices.push(x);
                        vertices.push(y);
                        vertices.push(z);

                        // fix

                        let v = [(-2 * xt + 1) * 0.3, 0, -z_sign];
                        v = vec_norm(v);
                        // v = vec_norm([0,0,1])

                        vertices.push(v[0]);
                        vertices.push(v[1]);
                        vertices.push(v[2]);
                    }
                }

                let off = k * (n + 1) * (m + 1);
                for (let i = 0; i < m; i++) {
                    for (let j = 0; j < n; j++) {

                        indices.push(off + j * (m + 1) + i);
                        if (k == 1)
                            indices.push(off + j * (m + 1) + i + 1);
                        else
                            indices.push(off + j * (m + 1) + i + m + 2);

                        if (k == 1)
                            indices.push(off + j * (m + 1) + i + m + 2);
                        else
                            indices.push(off + j * (m + 1) + i + 1);

                        indices.push(off + j * (m + 1) + i);

                        if (k == 1)
                            indices.push(off + j * (m + 1) + i + m + 2);
                        else
                            indices.push(off + j * (m + 1) + i + m + 1);

                        if (k == 1)
                            indices.push(off + j * (m + 1) + i + m + 1);
                        else
                            indices.push(off + j * (m + 1) + i + m + 2);
                    }
                }
            }

            blade_index_count = indices.length;
            hub_index_offset = blade_index_count;

            {
                // hub

                let n = 40;
                let m = 15;

                let off = vertices.length / 6;

                for (let j = 0; j <= n; j++) {

                    let t = j / n;

                    let x = Math.cos(t * Math.PI * 2);
                    let y = Math.sin(t * Math.PI * 2);

                    for (let i = 0; i <= m; i++) {

                        let tt = Math.max(0, (i - 1) / (m - 1));
                        // tt *= tt;
                        let r = Math.cos(Math.max(0, tt * Math.PI * 0.5));
                        let nz = Math.sin(Math.max(0, tt * Math.PI * 0.5));
                        let z = i == 0 ? 0 : (nz + 2);


                        vertices.push(x * r);
                        vertices.push(y * r);
                        vertices.push(z);

                        let v = [x * r, y * r, nz];
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

                off = vertices.length / 6;

                for (let j = 0; j <= n; j++) {

                    let t = j / n;

                    let x = Math.cos(t * Math.PI * 2);
                    let y = Math.sin(t * Math.PI * 2);

                    vertices.push(x);
                    vertices.push(y);
                    vertices.push(0);

                    vertices.push(0);
                    vertices.push(0);
                    vertices.push(-1);
                }

                for (let j = 1; j < n; j++) {

                    indices.push(off + 0);
                    indices.push(off + j + 1);
                    indices.push(off + j);

                }
            }

            hub_index_count = indices.length - hub_index_offset;

            arrow_index_offset = indices.length;

            {
                // arrow
                let n = 40;
                let m = 7;

                let off = vertices.length / 6;

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
                            z = 6;
                        } else if (i == 4) {
                            z = 6;
                            nz = -1;
                            nx = ny = 0;
                        } else if (i == 5) {
                            r = 2;
                            z = 6;
                            nz = -1;
                            nx = ny = 0;
                        } else if (i == 6) {
                            r = 2;
                            z = 6;
                            nz = 0.5;
                        } else if (i == 7) {
                            r = 0;
                            z = 11;
                            nz = 0.3;
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


            curl_arrow_index_offset = indices.length;

            {
                // curl arrow
                let n = 40;
                let m = 60;

                let off = vertices.length / 6;

                for (let j = 0; j <= n; j++) {

                    let t = j / n;

                    let x = Math.cos(t * Math.PI * 2);
                    let y = Math.sin(t * Math.PI * 2);

                    for (let i = 0; i <= m; i++) {

                        let tt = Math.max(0, Math.min(1, (i - 2) / (m - 9)));

                        let rr = 8;
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
                        } else if (i == m - 5) {
                            z = 6;
                        } else if (i == m - 4) {
                            z = 6;
                            nz = -1;
                            nx = ny = 0;
                        } else if (i == m - 3) {
                            r = 2;
                            z = 6;
                            nz = -1;
                            nx = ny = 0;
                        } else if (i == m - 2) {
                            r = 2;
                            z = 6;
                            nz = 0.5;
                        } else if (i == m - 1) {
                            r = 0;
                            z = 11;
                            nz = 0.3;
                        }

                        let a = (tt * 1.5) * Math.PI;


                        if (i == m - 1) {
                            vertices.push(0);
                            vertices.push(+rr * 0.5);
                            vertices.push(-rr);

                        } else {
                            vertices.push(x * r);
                            vertices.push((y * r + rr) * Math.cos(a));
                            vertices.push((y * r + rr) * Math.sin(a));
                        }
                        nz = ny * Math.sin(a);
                        ny *= Math.cos(a);

                        if (i == 0 || i == 1) {
                            ny = 0;
                            nz = -1;
                        } else if (i == m - 4 || i == m - 3) {
                            ny = -1;
                            // nz = -1;
                        }

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


            curl_arrow_index_count = indices.length - curl_arrow_index_offset;


            segment_index_offset = indices.length;

            {
                // segment
                let n = 40;
                let m = 5

                let off = vertices.length / 6;

                for (let j = 0; j <= n; j++) {

                    let t = j / n;

                    let x = Math.cos(t * Math.PI * 2);
                    let y = Math.sin(t * Math.PI * 2);

                    for (let i = 0; i <= m; i++) {

                        let r = 1.0;
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
                        } else if (i == 2) {
                            z = 0;
                        } else if (i == 3) {
                            z = 1;
                        } else if (i == 4) {
                            z = 1;
                            nz = 1;
                            nx = ny = 0;
                        } else if (i == 5) {
                            r = 0;
                            z = 1;
                            nz = 1;
                            nx = ny = 0;
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


            segment_index_count = indices.length - segment_index_offset;


            helicoid_index_offset = indices.length;

            {
                // helicoid
                let n = 32;
                let m = 384;

                let off = vertices.length / 6;

                for (let j = 0; j <= n; j++) {

                    let t = j / n;

                    for (let i = 0; i <= m; i++) {

                        let tt = i / m;

                        vertices.push(t);
                        vertices.push(tt);
                        vertices.push(0);

                        vertices.push(0);
                        vertices.push(0);
                        vertices.push(1);
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


            helicoid_index_count = indices.length - helicoid_index_offset;

            gl.bindBuffer(gl.ARRAY_BUFFER, basic_vertex_buffer);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
            gl.bindBuffer(gl.ARRAY_BUFFER, null);


            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, basic_index_buffer);
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(indices), gl.STATIC_DRAW);
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
        }

        gen_basic_geometry();





        let base_vert_src =
            `
        attribute vec3 v_position;
        attribute vec3 v_normal;

        uniform mat4 m_mvp;
        uniform mat3 m_rot;

        varying vec3 n_dir;
        varying vec3 model_pos;

        void main(void) {
            vec3 pos = v_position;
            model_pos = pos;
            n_dir = m_rot * v_normal;
            gl_Position = m_mvp * vec4(pos, 1.0);
        }
        `;



        let helicoid_vert_src =
            `
        attribute vec3 v_position;

        uniform mat4 m_mvp;
        uniform mat3 m_rot;

        uniform vec2 pitch_radius;

        varying float z;

        void main(void) {
            vec3 pos = v_position;
            float r = pos.x*pitch_radius.y;
            float a = (pos.y - 0.5)*pitch_radius.x;

            pos = vec3(r*cos(a),r*sin(a),pos.y*2.0 - 1.0);
            z = v_position.y;
            gl_Position = m_mvp * vec4(pos, 1.0);
        }
        `;

        let helicoid_frag_src =
            `
        precision mediump float;

        varying float z;

        uniform vec4 color;

        void main(void) {
            
            float a = smoothstep(0.0, 0.4, z) - smoothstep(0.8, 1.0, z);
            a *= z > 0.5 ? 0.1 : 1.0;
            gl_FragColor = color*a;
        }
        `;

        let helicoid_axis_frag_src =
            `
        precision mediump float;

        varying vec3 model_pos;

        uniform vec2 pitch_offset;
        uniform vec4 color;

        void main(void) {
            
            float a = smoothstep(0.0, 0.2, model_pos.z) - smoothstep(0.8, 1.0, model_pos.z);
            float f = fract(((model_pos.z - 0.5) *pitch_offset.x + pitch_offset.y)*0.5);

            vec4 c = color;
            c.rgb *= f < 0.5 ? 0.9 : 1.1;
            c *= a;

            gl_FragColor = c;
        }
        `;


        let blade_vert_src =
            `
        attribute vec3 v_position;
        attribute vec3 v_normal;

        uniform mat4 m_mvp;
        uniform mat3 m_rot;
        uniform vec2 twist_skew;

        varying vec3 n_dir;
        varying vec3 model_pos;

        void main(void) {
            vec3 pos = v_position;
            float r = length(pos.xy);
            
            float a = atan(r*twist_skew.x);
            float c = cos(a);
            float s = sin(a);

            model_pos = pos;
            pos.x -= pos.y*pos.y*twist_skew.y;


            vec3 pp = pos;
            pos.z = c*pp.z + s*pp.x;
            pos.x = -s*pp.z + c*pp.x;
            

            vec3 n = v_normal;
            n.z = c*v_normal.z + s*v_normal.x;
            n.x = -s*v_normal.z + c*v_normal.x;


            n_dir = m_rot * n;
            gl_Position = m_mvp * vec4(pos, 1.0);
        }
        `;



        let blade_frag_src =
            `
        precision mediump float;

        varying vec3 n_dir;
        varying vec3 model_pos;

        uniform vec4 color;
        uniform float cut;

        void main(void) {

            
            float f = (0.5 + 0.5 * max(0.0, normalize(n_dir).z));
            vec4 c = color;
            c.rgb *= sqrt(f);

            if (dot(model_pos.xy, model_pos.xy) > cut)
                discard;

            if (!gl_FrontFacing)
                c.rgb = vec3(0.13, 0.13, 0.13);

            gl_FragColor = c;
        }
    `;



        let color_frag_src =
            `
            precision mediump float;

            varying vec3 n_dir;
            varying vec3 model_pos;

            uniform vec4 color;
            uniform float normal_f;

            void main(void) {
                
                float f = mix(1.0, max(0.0, normalize(n_dir).z), normal_f);
                vec4 c = color;
                c.rgb *= sqrt(f);
                gl_FragColor = c;
            }
    `;

        let color_plane_frag_src =
            `
    precision mediump float;

    varying vec3 n_dir;
    varying vec3 model_pos;

    uniform vec4 color;
    uniform vec4 plane;
    uniform float multi;
    uniform float normal_f;

    void main(void) {
        
        float f = mix(1.0, max(0.0, normalize(n_dir).z), normal_f);
        vec4 c = mix(vec4(0.8, 0.8, 0.8, 1.0), color, smoothstep(plane.w - 4.0, plane.w, dot(model_pos, plane.xyz)));

        
        // dot(model_pos, plane.xyz) > plane.w ? color : vec4(0.8, 0.8, 0.8, 1.0);

        if (multi != 0.0) {
            c = mix(vec4(0.2, 0.2, 0.2, 1.0), vec4(0.4, 0.4, 0.4, 1.0), smoothstep(123.0, 126.2, model_pos.z));
            c = mix(vec4(0.77, 0.26, 0.18, 1.0), c, smoothstep(-8.0, -5.0, model_pos.z));
        }
        c.rgb *= sqrt(f);
        gl_FragColor = c;
    }
`;


        let flat_shader = new Shader(gl,
            base_vert_src,
            color_frag_src,
            ["v_position", "v_normal"],
            ["m_mvp", "m_rot", "color", "normal_f"]);


        let plane_flat_shader = new Shader(gl,
            base_vert_src,
            color_plane_frag_src,
            ["v_position", "v_normal"],
            ["m_mvp", "m_rot", "color", "normal_f", "multi", "plane"]);

        let helicoid_shader = new Shader(gl,
            helicoid_vert_src,
            helicoid_frag_src,
            ["v_position", "v_normal"],
            ["m_mvp", "m_rot", "pitch_radius", "color"]);

        let helicoid_axis_shader = new Shader(gl,
            base_vert_src,
            helicoid_axis_frag_src,
            ["v_position", "v_normal"],
            ["m_mvp", "m_rot", "pitch_offset", "color"]);

        let blade_shader = new Shader(gl,
            blade_vert_src,
            blade_frag_src,
            ["v_position", "v_normal"],
            ["m_mvp", "m_rot", "twist_skew", "cut", "color"]);


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
            gl.clearColor(0.0, 0.0, 0.0, 0.0);
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

            // gl.enable(gl.CULL_FACE);
            gl.cullFace(gl.BACK);
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


        this.flush = function () {
            gl.flush();
        }

        function setup_base_bindings(shader, mvp, rot) {
            gl.bindBuffer(gl.ARRAY_BUFFER, basic_vertex_buffer);
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, basic_index_buffer);

            gl.enableVertexAttribArray(shader.attributes["v_position"]);
            gl.vertexAttribPointer(shader.attributes["v_position"], 3, gl.FLOAT, false, 24, 0);
            gl.enableVertexAttribArray(shader.attributes["v_normal"]);
            gl.vertexAttribPointer(shader.attributes["v_normal"], 3, gl.FLOAT, false, 24, 12);

            gl.uniformMatrix4fv(shader.uniforms["m_mvp"], false, mat4_transpose(mvp));
            gl.uniformMatrix3fv(shader.uniforms["m_rot"], false, mat3_invert(rot));
        }



        this.draw_blade = function (mvp, rot, color, twist, skew, show_back, cut) {

            gl.disable(gl.BLEND);
            if (show_back)
                gl.disable(gl.CULL_FACE);
            else
                gl.enable(gl.CULL_FACE);

            if (cut === undefined)
                cut = 1000.0;

            gl.useProgram(blade_shader.shader);

            setup_base_bindings(blade_shader, mvp, rot);

            gl.uniform4fv(blade_shader.uniforms["color"], color);
            gl.uniform2fv(blade_shader.uniforms["twist_skew"], [twist, skew]);
            gl.uniform1f(blade_shader.uniforms["cut"], cut);

            gl.drawElements(gl.TRIANGLES, blade_index_count, gl.UNSIGNED_INT, blade_index_offset * 4);
        }

        this.draw_hub = function (mvp, rot, color) {

            gl.disable(gl.BLEND);
            gl.enable(gl.CULL_FACE);

            gl.useProgram(flat_shader.shader);
            setup_base_bindings(flat_shader, mvp, rot);
            gl.uniform4fv(flat_shader.uniforms["color"], color);
            gl.uniform1f(flat_shader.uniforms["normal_f"], 0.3);

            gl.drawElements(gl.TRIANGLES, hub_index_count, gl.UNSIGNED_INT, hub_index_offset * 4);
        }

        this.draw_arrow = function (mvp, rot, color) {

            gl.enable(gl.CULL_FACE);

            gl.useProgram(flat_shader.shader);

            setup_base_bindings(flat_shader, mvp, rot);

            gl.uniform4fv(flat_shader.uniforms["color"], color);
            gl.uniform1f(flat_shader.uniforms["normal_f"], 0.2);

            gl.drawElements(gl.TRIANGLES, arrow_index_count, gl.UNSIGNED_INT, arrow_index_offset * 4);
        }

        this.draw_curl_arrow = function (mvp, rot, color) {

            gl.enable(gl.CULL_FACE);
            gl.useProgram(flat_shader.shader);

            setup_base_bindings(flat_shader, mvp, rot);
            gl.uniform4fv(flat_shader.uniforms["color"], color);
            gl.uniform1f(flat_shader.uniforms["normal_f"], 0.3);

            gl.drawElements(gl.TRIANGLES, curl_arrow_index_count, gl.UNSIGNED_INT, curl_arrow_index_offset * 4);
        }


        this.draw_segment = function (mvp, rot, color) {

            // gl.disable(gl.BLEND);
            gl.enable(gl.CULL_FACE);
            gl.useProgram(flat_shader.shader);

            setup_base_bindings(flat_shader, mvp, rot);
            gl.uniform4fv(flat_shader.uniforms["color"], color);
            gl.uniform1f(flat_shader.uniforms["normal_f"], 0.3);

            gl.drawElements(gl.TRIANGLES, segment_index_count, gl.UNSIGNED_INT, segment_index_offset * 4);
        }

        this.draw_helicoid = function (mvp, rot, pitch, radius, color) {

            gl.enable(gl.BLEND);
            gl.disable(gl.CULL_FACE);
            gl.depthMask(false);

            gl.useProgram(helicoid_shader.shader);

            gl.bindBuffer(gl.ARRAY_BUFFER, basic_vertex_buffer);
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, basic_index_buffer);

            gl.enableVertexAttribArray(helicoid_shader.attributes["v_position"]);
            gl.vertexAttribPointer(helicoid_shader.attributes["v_position"], 3, gl.FLOAT, false, 24, 0);

            gl.uniformMatrix4fv(helicoid_shader.uniforms["m_mvp"], false, mat4_transpose(mvp));
            gl.uniformMatrix3fv(helicoid_shader.uniforms["m_rot"], false, mat3_invert(rot));

            gl.uniform2fv(helicoid_shader.uniforms["pitch_radius"], [pitch, radius]);
            gl.uniform4fv(helicoid_shader.uniforms["color"], color);

            gl.drawElements(gl.TRIANGLES, helicoid_index_count, gl.UNSIGNED_INT, helicoid_index_offset * 4);
        }

        this.draw_helicoid_axis = function (mvp, rot, pitch, offset, color) {

            gl.enable(gl.BLEND);
            gl.disable(gl.CULL_FACE);
            gl.depthMask(false);

            gl.useProgram(helicoid_axis_shader.shader);

            setup_base_bindings(helicoid_axis_shader, mvp, rot);
            gl.uniform2fv(helicoid_axis_shader.uniforms["pitch_offset"], [pitch, offset]);
            gl.uniform4fv(helicoid_axis_shader.uniforms["color"], color);

            gl.drawElements(gl.TRIANGLES, segment_index_count, gl.UNSIGNED_INT, segment_index_offset * 4);
        }


        this.draw_mesh = function (name, mvp, rot, color, ff, plane, multi) {

            let mesh = models[name];


            if (ff == undefined)
                ff = 0.5;

            gl.enable(gl.CULL_FACE);

            if (color[3] != 1) {
                gl.enable(gl.BLEND);
                gl.depthMask(false);
            } else {
                gl.disable(gl.BLEND);
                gl.depthMask(true);
            }

            let shader = plane ? plane_flat_shader : flat_shader;

            gl.useProgram(shader.shader);

            gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer);

            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, index_buffer);

            gl.enableVertexAttribArray(shader.attributes["v_position"]);
            gl.vertexAttribPointer(shader.attributes["v_position"], 3, gl.FLOAT, false, 24, 0);
            gl.enableVertexAttribArray(shader.attributes["v_normal"]);
            gl.vertexAttribPointer(shader.attributes["v_normal"], 3, gl.FLOAT, false, 24, 12);

            gl.uniformMatrix4fv(shader.uniforms["m_mvp"], false, mat4_transpose(mvp));
            gl.uniformMatrix3fv(shader.uniforms["m_rot"], false, mat3_invert(rot));
            gl.uniform4fv(shader.uniforms["color"], color);
            gl.uniform1f(shader.uniforms["normal_f"], ff);

            if (plane) {
                gl.uniform4fv(shader.uniforms["plane"], plane);
                gl.uniform1f(shader.uniforms["multi"], multi ? 1.0 : 0.0);
            }

            gl.drawElements(gl.TRIANGLES, mesh.index_count, gl.UNSIGNED_INT, mesh.index_offset * 4);
        }



        this.finish = function () {
            gl.flush();
            return gl.canvas;
        }
    }


    let gl = new GLDrawer(scale, function () {

        for (var i = 0; i < all_drawers.length; i++) {
            all_drawers[i].repaint();
        }
    });

    function wave_poly(off, w, h, n) {
        let points = [];
        let a = 2.5;
        let b = 1;
        for (let i = 0; i <= n; i++) {
            let t = (-0.5 + i / n) * Math.PI * 2;
            let x = + a * t - b * Math.sin(t);
            let y = b * (Math.cos(t) + 1) * 0.5;
            points.push([x * w + off, y * h]);
        }
        return points;
    }



    function Drawer(container, mode) {

        let self = this;

        all_drawers.push(self);

        let wrapper = document.createElement("div");
        wrapper.classList.add("canvas_container");
        wrapper.classList.add("non_selectable");

        let canvas = document.createElement("canvas");
        canvas.classList.add("non_selectable");
        canvas.style.position = "absolute";
        canvas.style.top = "0";
        canvas.style.left = "0";


        var play = document.createElement("div");
        play.classList.add("play_pause_button");
        play.classList.add("playing");

        var reset = document.createElement("div");
        reset.classList.add("restart_button");
        reset.classList.add("white");


        wrapper.appendChild(canvas);
        container.appendChild(wrapper);

        let disturbance_ttl = 1;

        this.paused = true;
        this.requested_repaint = false;

        this.set_paused = function (p) {

            if (self.paused == p)
                return;

            self.paused = p;
            disturbance_ttl = 1;

            if (self.paused) {
                play.classList.remove("playing");
            }
            else {
                play.classList.add("playing");
                // request_repaint
                window.requestAnimationFrame(tick);
            }
        }

        let t = 0;
        let prev_timestamp;

        let load_text = mode === "brick_scale" || mode === "brick_forces" ||
            mode === "brick_wood" || mode === "water_level" || mode === "syringe_pressure" ||
            mode === "barrel" || mode === "L" || mode === "weight_pressure" ||
            mode === "cgx" || mode === "slide" ||
            mode === "water_cylinder" || mode === "height" || mode === "cgx_plot";

        let simulated = mode === "wind_tilt" || mode === "wave" ||
            mode === "hero" || mode === "canister" ||
            mode === "wood_sub" || mode === "tub_sub" ||
            mode === "wood_tilt" || mode === "wood_tilt_f" ||
            mode === "loading" ||
            mode === "cgx" || mode === "slide" ||
            mode === "free_surface" || mode === "free_surface2";

        let animated = mode === "propeller" || mode === "propeller_pitch_force" ||
            mode === "helicoid" || mode === "propeller_radial" ||
            mode === "propeller_forward" || mode === "propeller_n";

        function tick(timestamp) {


            var rect = canvas.getBoundingClientRect();

            var wh = window.innerHeight || document.documentElement.clientHeight;
            var ww = window.innerWidth || document.documentElement.clientWidth;
            if (!(rect.top > wh || rect.bottom < 0 || rect.left > ww || rect.right < 0)) {

                let dt = 0;
                if (prev_timestamp)
                    dt = (timestamp - prev_timestamp) / 1000;

                dt = Math.min(dt, 1.0 / 30.0);

                t += dt;


                self.repaint(dt);
            }
            prev_timestamp = timestamp;

            if (self.paused)
                prev_timestamp = undefined;
            else
                window.requestAnimationFrame(tick);
        }

        play.onclick = function () {
            self.set_paused(!self.paused);
        }

        reset.onclick = function () {
            self.reset();
        }


        if (simulated || animated) {
            // animated_drawers.push(self);
            this.paused = false;
            window.requestAnimationFrame(tick);
            if (animated)
                wrapper.appendChild(play);
            else
                wrapper.appendChild(reset);
        }

        let width, height;

        let rot = rot_y_mat3(-0.6);
        rot = mat3_mul(rot_x_mat3(0.3), rot);

        if (mode === "water_cylinder") {
            rot = rot_z_mat3(-1);
            rot = mat3_mul(rot_x_mat3(-1.0), rot);
        } else if (mode === "subdiv") {
            rot = rot_z_mat3(-1);
            rot = mat3_mul(rot_x_mat3(-1.2), rot);
        } else if (mode === "hull" || mode === "hull_ratio") {
            rot = rot_z_mat3(1);
            rot = mat3_mul(rot_x_mat3(-1.2), rot);
        } else if (mode === "tub") {
            rot = rot_y_mat3(-1);
            rot = mat3_mul(rot_x_mat3(0.7), rot);
        } else if (mode === "3d_forces") {
            rot = rot_y_mat3(-0.5);
            rot = mat3_mul(rot_x_mat3(0.3), rot);
        } else if (mode === "helicoid") {
            rot = rot_x_mat3(-0.8);
            rot = mat3_mul(rot_z_mat3(0.5), rot);
        }


        let arcball = new ArcBall(rot, function () {
                        rot = arcball.matrix.slice();
                        request_repaint();
                    });
        let no_drag = true;

        if (mode === "water_cylinder" || mode === "3d_forces" ||
            mode === "tub" || mode === "hull" || mode === "subdiv" || mode === "hull_ratio" ||
            mode === "propeller" || mode === "propeller_pitch" ||
            mode === "propeller_pitch_force" || mode === "propeller_twist" ||
            mode === "propeller_n" || mode === "helicoid")
            no_drag = false;

        function canvas_space(e) {
            let r = canvas.getBoundingClientRect();
            return [width - (e.clientX - r.left), (e.clientY - r.top)];
        }

        function request_repaint() {
            if (self.paused && !self.requested_repaint) {
                self.requested_repaint = true;
                window.requestAnimationFrame(function () {
                    self.repaint();
                });
            }
        }


        if (!no_drag) {
            container.classList.add("move_cursor");

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
                    rot = arcball.matrix.slice();

                    request_repaint();


                    return true;
                },
                function (e) {
                    arcball.end(e.timeStamp);
                });
        }



        let arg0 = 0, arg1 = 0, arg2 = 0;


        this.get_arg0 = function () { return arg0; }
        this.set_arg0 = function (x) { arg0 = x; if (simulated) self.set_paused(false); request_repaint(); }
        this.set_arg1 = function (x) { arg1 = x; if (simulated) self.set_paused(false); request_repaint(); }
        this.set_arg2 = function (x) { arg2 = x; if (simulated) self.set_paused(false); request_repaint(); }

        this.set_rot = function (x) {
            rot = x;
            arcball.set_matrix(x);
            request_repaint();;
        }


        let aspect = width / height;

        let proj_w;
        let proj_h;

        let proj;


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

                proj_w = 15;
                proj_h = proj_w / aspect;

                proj = [1 / proj_w, 0, 0, 0,
                    0, 1 / proj_h, 0, 0,
                    0, 0, -0.00015, 0,
                    0, 0, 0, 1]

                let pad = 5;
                let size = Math.max(width, height) - pad * 2;
                arcball.set_viewport(width / 2 - size / 2 + pad, height / 2 - size / 2 + pad, size, size);

                request_repaint();
            }
        }



        function poly_y_clip(poly, sign) {
            var clip_y = 0.0;

            var clipped_poly = [];

            function is_in(p) {
                return sign ? (p[1] >= clip_y) : (p[1] < clip_y);
            }

            var prev = poly[poly.length - 1];
            for (var j = 0; j < poly.length; j++) {
                var curr = poly[j];

                if (!vec_eq(curr, prev)) {
                    if (is_in(curr)) {
                        if (!is_in(prev)) {
                            var dy = curr[1] - prev[1];
                            var t = (clip_y - prev[1]) / dy;
                            var p = vec_lerp(prev, curr, t);
                            p[1] = 0;
                            clipped_poly.push(p);
                        }

                        clipped_poly.push(curr);
                    } else if (is_in(prev)) {
                        var dy = curr[1] - prev[1];
                        var t = (clip_y - prev[1]) / dy;
                        var p = vec_lerp(prev, curr, t);
                        p[1] = 0;
                        clipped_poly.push(p);
                    }
                }

                prev = curr;
            }

            return clipped_poly;
        }

        function poly_area(poly) {
            if (poly.length < 3)
                return 0;

            let area = 0;
            let p = poly[0];

            for (let i = 1; i < poly.length - 1; i++) {

                let p0 = vec_sub(poly[i + 0], p);
                let p1 = vec_sub(poly[i + 1], p);

                area += (p0[0] * p1[1] - p0[1] * p1[0])
            }
            return Math.abs(area * 0.5);
        }

        function triangle_area(t) {
            let p0 = vec_sub(t[1], t[0]);
            let p1 = vec_sub(t[2], t[0]);
            return ((p0[0] * p1[1] - p0[1] * p1[0]) * 0.5);
        }

        function triangle_center(t) {
            return vec_scale(vec_add(t[0], vec_add(t[1], t[2])), 1 / 3);
        }

        function poly_center(p) {
            if (p.length < 3)
                return [0, 0];
            let total_weight = 0;
            let sum = [0, 0];
            let pend = p[p.length - 1];
            for (let i = 0; i < p.length - 2; i++) {
                let triangle = [pend, p[i], p[i + 1]];
                let weight = triangle_area(triangle);
                let center = triangle_center(triangle);
                sum = vec_add(sum, vec_scale(center, weight));
                total_weight += weight;
            }
            if (total_weight == 0)
                return [0, 0];

            return vec_scale(sum, 1 / total_weight);
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

        function rect_poly(w, h, a, d, cgx, cgy) {
            w *= 0.5;

            let c = Math.cos(a);
            let s = Math.sin(a);

            let ps = [[-w, 0], [w, 0], [w, h], [-w, h]];
            ps = ps.map(a => vec_add(a, [-cgx, -cgy]));
            ps = ps.map(a => [a[0] * c + a[1] * s, a[0] * -s + a[1] * c]);
            ps = ps.map(a => vec_add(a, [0, d]));

            return ps;
        }


        function ship_poly(w, h, a, d, cgx, cgy) {
            w *= 0.5;

            let c = Math.cos(a);
            let s = Math.sin(a);

            let ps = [[-w, 0], [w, 0], [w, h], [-w, h]];
            ps = ps.map(a => vec_add(a, [-cgx, -cgy]));
            ps = ps.map(a => [a[0] * c + a[1] * s, a[0] * -s + a[1] * c]);
            ps = ps.map(a => vec_add(a, [0, d]));

            return ps;
        }



        let a, omega, off, v, cgx, cgy, sim0, sim1, sim2, wind_sim;



        this.reset = function () {
            a = 0.0;
            omega = 0;
            off = 0;
            v = 0;
            cgx = 0.0;
            cgy = 0.0;
            sim0 = 0;
            sim1 = 0;
            sim2 = 0.5;
            wind_sim = 0;

            if (mode === "wood_sub" || mode === "wood_tilt" || mode === "wood_tilt_f") {
                off = -0.08;
            } else if (mode === "wind_tilt") {
                off = -0.03692134293639695;
            } else if (mode === "loading") {
                off = -0.0345;
            } else if (mode === "cgx" || mode === "slide") {
                off = -0.1375;
            } else if (mode === "free_surface" || mode === "free_surface2") {
                off = -0.14469354310478638;
            }
        }

        this.reset();


        this.repaint = function (dt) {

            if (dt === undefined)
                dt = 0;

            self.requested_repaint = false;

            let ctx = canvas.getContext("2d");

            ctx.resetTransform();
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.scale(scale, scale);
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



            function adjust_wind(name, wind) {

                wind_sim += wind * 0.02;

                for (let i = 0; i < 4; i++) {

                    let el = document.getElementById(name + i);
                    let a = Math.sqrt(Math.abs(wind * 2.0));
                    el.style.background = wind_uri;
                    el.style.opacity = Math.abs(a * (0.8 + 0.2 * Math.sin(i * 2))).toFixed(3);
                    // el.style.backgroundRepeat = "repeat-x";
                    el.style.backgroundPosition = (((wind_sim + 0.04 * Math.sin(wind_sim * 4.0 - i)) * width + Math.sin(i) * wind_w) % wind_w) + "px 0px"
                    el.style.backgroundSize = wind_w + "px " + wind_h + "px"
                }

            }



            function draw_arrow(pos, angle, size) {

                if (size == 0)
                    return;


                ctx.save();
                ctx.translate(pos[0], -pos[1]);
                ctx.rotate(angle);
                ctx.scale(size, size);


                ctx.beginPath();
                ctx.lineTo(0, 0);
                ctx.lineTo(1.5, 3.5);
                ctx.lineTo(0.5, 3.5);
                ctx.lineTo(0.5, 6);
                ctx.lineTo(-0.5, 6);
                ctx.lineTo(-0.5, 3.5);
                ctx.lineTo(-1.5, 3.5);
                ctx.closePath();
                ctx.fill();

                // ctx.strokeStyle = ctx.fillStyle;
                ctx.lineWidth = Math.min(1.5 / size, 1 / Math.sqrt(size));
                ctx.stroke();

                ctx.restore();
            }



            function bottom_rounded_rect(x, y, w, h, r) {
                ctx.beginPath();

                ctx.lineTo(x + w, y);
                ctx.arcTo(x + w, y + h, x, y + h, r);
                ctx.arcTo(x, y + h, x, y, r);
                ctx.lineTo(x, y);
                // ctx.closePath();;
            }

            function punch_water() {
                ctx.save();
                ctx.globalCompositeOperation = "destination-out";
                ctx.fillStyle = "rgba(0,0,0,0.25)";
                ctx.fillRect(-width, 0, width * 2, height);
                ctx.restore();
            }


            function draw_front_ship(w, h, r, wh, bridge) {

                bottom_rounded_rect(-w / 2, -h, w, h, r);
                ctx.lineCap = "butt";
                ctx.lineWidth = 2;

                ctx.strokeStyle = "#741818";
                ctx.fillStyle = "#C5432E";
                ctx.fill();
                ctx.stroke();

                if (bridge) {

                    ctx.fillStyle = "#777";
                    ctx.strokeStyle = "#555";


                    ctx.fillRect(-w * 0.05, -h * 1.7, w * 0.1, h * 0.5);
                    ctx.strokeRect(-w * 0.05, -h * 1.7, w * 0.1, h * 0.5);

                    ctx.strokeStyle = "#888";

                    ctx.lineWidth = w * 0.01 + 4;
                    ctx.beginPath();
                    ctx.lineTo(-w * 0.43, -h * 1.32);
                    ctx.lineTo(0, -h * 1);
                    ctx.lineTo(w * 0.43, -h * 1.32);
                    ctx.stroke();

                    ctx.lineWidth = w * 0.01;
                    ctx.strokeStyle = "#ddd";
                    ctx.stroke();

                    ctx.lineWidth = 2;
                    ctx.fillStyle = "#ddd";
                    ctx.strokeStyle = "#888";

                    ctx.fillRect(-w * 0.3, -h * 1.4, w * 0.6, h * 0.5);
                    ctx.strokeRect(-w * 0.3, -h * 1.4, w * 0.6, h * 0.5);

                    ctx.fillRect(-w * 0.45, -h * 1.4, w * 0.9, h * 0.1);
                    ctx.strokeRect(-w * 0.45, -h * 1.4, w * 0.9, h * 0.1);

                    ctx.fillRect(-w * 0.25, -h * 1.55, w * 0.5, h * 0.15);
                    ctx.strokeRect(-w * 0.25, -h * 1.55, w * 0.5, h * 0.15);


                    ctx.fillRect(-w * 0.012, -h * 1.35, w * 0.024, h * 0.35);
                    ctx.strokeRect(-w * 0.012, -h * 1.35, w * 0.024, h * 0.35);

                    ctx.fillStyle = "#444";
                    ctx.strokeStyle = "#222";

                    for (let i = -3; i <= 3; i++) {
                        ctx.fillRect(-w * (0.025 + i * 0.06), -h * 1.5, w * 0.05, h * 0.05);
                    }

                }

                ctx.beginPath();
                ctx.rect(-w / 2, -h, w, wh);
                ctx.fillStyle = "#333";
                ctx.strokeStyle = "#222";
                ctx.fill();
                ctx.stroke();

                ctx.fillStyle = "#282828";

                ctx.strokeStyle = "rgba(0,0,0,0.1)";
                ctx.beginPath();
                ctx.lineTo(0, -h + wh);
                ctx.lineTo(0, -h);
                ctx.stroke();

                ctx.beginPath();
                ctx.roundRect(-h * 0.1, -h + wh, h * 0.2, h - wh, h * 0.1);
                ctx.stroke();
            }

            function draw_forces(cg, cgl, cb, cbl, skip_arm) {

                ctx.lineWidth = 1.5;
                ctx.fillStyle = weight_fill_style;
                ctx.strokeStyle = weight_stroke_style;

                ctx.arrow(cg[0], cg[1], cg[0], cg[1] + cgl, 4.5, 13, 18);
                ctx.fill();
                ctx.stroke();

                ctx.fillEllipse(cg[0], cg[1], 4.5);
                ctx.strokeEllipse(cg[0], cg[1], 4.5);

                ctx.fillStyle = "blue";
                ctx.fillEllipse(cb[0], cb[1], 3);



                ctx.fillStyle = buoy_fill_style;
                ctx.strokeStyle = buoy_stroke_style;

                ctx.arrow(cb[0], cb[1], cb[0], cb[1] - cbl, 4.5, 13, 18);
                ctx.fill();
                ctx.stroke();

                ctx.fillEllipse(cb[0], cb[1], 4.5);
                ctx.strokeEllipse(cb[0], cb[1], 4.5);




                if (!skip_arm) {
                    ctx.beginPath();
                    ctx.lineTo(cg[0], cg[1] + 0.001);
                    ctx.lineTo(cb[0], cg[1]);

                    ctx.lineWidth = 5;
                    ctx.strokeStyle = "#111";
                    ctx.stroke();

                    ctx.lineWidth = 2;
                    ctx.strokeStyle = "#fff";

                    ctx.stroke();
                }
            }



            function draw_pressure_gauge(s, angle, hose) {
                ctx.save();

                ctx.lineWidth = 2.0;
                ctx.strokeStyle = "#222";
                let r = s * 0.45;
                let fill = 0.8;

                if (hose) {

                    ctx.lineCap = "butt";


                    ctx.beginPath();
                    ctx.moveTo(0, r * 1.2);
                    ctx.strokeStyle = "#555";

                    ctx.bezierCurveTo(0, r * 2.5,
                        hose[0] * 0.5,
                        hose[1],
                        hose[0],
                        hose[1]);

                    ctx.strokeStyle = "#333";

                    ctx.lineWidth = r * 0.07 + 4;
                    ctx.stroke();
                    ctx.strokeStyle = "#555";

                    ctx.lineWidth = r * 0.07;
                    ctx.stroke();

                    ctx.fillStyle = "#D3BA80";
                    ctx.strokeStyle = "#99875D";
                    ctx.lineWidth = 2.0;
                    ctx.beginPath();
                    ctx.rect(hose[0] - r * 0.09, hose[1] - r * 0.09, r * 0.18, r * 0.18);
                    ctx.fill();
                    ctx.stroke();
                }

                ctx.fillStyle = "#D3BA80";
                ctx.fillRect(-r * 0.12, 0, r * 0.24, r * 1.3);
                ctx.lineWidth = 2;
                ctx.strokeStyle = "#99875D";
                ctx.strokeRect(-r * 0.12, 0, r * 0.24, r * 1.3);


                ctx.beginPath();
                ctx.ellipse(0, 0, r, r, 0, 0, 2 * Math.PI);
                ctx.fillStyle = "#fff";
                ctx.fill();

                ctx.beginPath();
                ctx.ellipse(0, 0, r + 2.0, r + 2.0, 0, 0, 2 * Math.PI);
                ctx.lineWidth = r * 0.05 + 4;
                ctx.strokeStyle = "#666";
                ctx.stroke();

                ctx.lineWidth = r * 0.05;
                ctx.strokeStyle = "#aaa";
                ctx.stroke();

                ctx.save();
                ctx.rotate(Math.PI * (1 - fill));
                ctx.fillStyle = "#555";
                ctx.fillEllipse(3, 0.9 * r, 1.25);

                ctx.lineWidth = 2.0;

                ctx.lineCap = "round";

                for (let i = 0; i <= 60; i++) {
                    let rr = (i % 10) == 0 ? 0.82 : (i % 10 == 5 ? 0.87 : 0.92);
                    ctx.beginPath();
                    ctx.lineTo(0, rr * r);
                    ctx.lineTo(0, 0.95 * r);
                    ctx.stroke();
                    ctx.rotate(Math.PI * 2 * fill / 60);
                }

                ctx.restore();
                ctx.font = "500 " + s * 0.13 + "px IBM Plex Sans";

                ctx.fillStyle = "#333";
                for (let i = 0; i <= 6; i++) {
                    let a = 2 * Math.PI * fill * i / 6 + Math.PI * (1 - fill);
                    let ca = Math.cos(a);
                    let sa = -Math.sin(a);

                    ctx.fillText(i, sa * r * 0.65, ca * r * 0.65 + s * 0.04);
                }

                ctx.save();

                ctx.font = "500 " + s * 0.05 + "px IBM Plex Sans";
                ctx.fillText("PRESSURE", 0, r * 0.27);

                ctx.rotate(angle - Math.PI * (fill));

                ctx.lineWidth = 4;

                ctx.fillStyle = "#666";
                ctx.strokeStyle = "#444";

                ctx.strokeEllipse(0, 0, 0.07 * r);


                ctx.beginPath();
                ctx.lineTo(0.00 * r, -0.9 * r);
                ctx.lineTo(-0.02 * r, 0);
                ctx.lineTo(0, 0);
                ctx.arc(0, 0.05 * r, 0.25 * r, 0.3 + Math.PI * 0.5, -0.3 + Math.PI * 0.5, true);
                ctx.lineTo(0, 0);
                ctx.lineTo(0.02 * r, 0);
                ctx.closePath();
                ctx.stroke();

                ctx.lineWidth = 0.5;

                ctx.strokeStyle = ctx.fillStyle;

                ctx.fill();
                ctx.stroke();

                ctx.fillEllipse(0, 0, 0.07 * r);
                ctx.strokeEllipse(0, 0, 0.07 * r);

                ctx.fillStyle = "#444";
                ctx.fillEllipse(0, 0, 0.04 * r);

                ctx.restore();

                ctx.restore();
            }

            function project(p) {
                p = vec_scale(p, height / 4.0);
                p[1] = -p[1];
                return p;
            }

            if (mode === "syringe" || mode === "syringe_pressure") {

                let s = 0.3 * width;

                ctx.translate(Math.round(width * 0.25), Math.round(height * 0.6));
                ctx.strokeStyle = container_stroke_style;
                ctx.lineWidth = 2;
                ctx.lineJoin = "round";

                let sw = 0.2;

                if (mode === "syringe_pressure") {
                    sw = lerp(0.1, 0.3, arg1 * arg1);
                    s = 0.3 * width * 0.8;
                    ctx.translate(Math.round(width * 0.1), 0);
                }

                let offset = s - 5 - s * 0.4;

                if (mode === "syringe")
                    offset += arg0 * s * 0.1;


                ctx.save();
                ctx.strokeStyle = "#aaa";
                ctx.fillStyle = water_fill_style;
                ctx.beginPath();
                ctx.lineTo(s * 0.04 + 1, -s * 1.4 - 1);
                ctx.bezierCurveTo(s * 0.04 + 1, -s * 1.3, s * 0.04 + 5, -s * 1.3, s * 0.04 + 5, -s * 1.25);
                // ctx.lineTo(s*0.04+6, -s*1.25);
                ctx.lineTo(s * 0.04 + 5, -s * 1.1);
                ctx.lineTo(-s * 0.04 - 5, -s * 1.1);
                ctx.lineTo(-s * 0.04 - 5, -s * 1.25);
                ctx.bezierCurveTo(-s * 0.04 - 5, -s * 1.3, -s * 0.04 - 1, -s * 1.3, -s * 0.04 - 1, -s * 1.4 - 1);
                ctx.closePath();

                ctx.fill();
                ctx.stroke();

                if (mode === "syringe") {
                    ctx.save();
                    ctx.translate(1.8 * s, -s * 1.2);
                    ctx.strokeStyle = "#aaa";
                    ctx.fillStyle = water_fill_style;
                    ctx.beginPath();
                    ctx.lineTo(s * 0.04 + 1, s * 1.4 + 1);
                    ctx.bezierCurveTo(s * 0.04 + 1, s * 1.3, s * 0.04 + 5, s * 1.3, s * 0.04 + 5, s * 1.25);
                    // ctx.lineTo(s*0.04+6, -s*1.25);
                    ctx.lineTo(s * 0.04 + 5, s * 1.1);
                    ctx.lineTo(-s * 0.04 - 5, s * 1.1);
                    ctx.lineTo(-s * 0.04 - 5, s * 1.25);
                    ctx.bezierCurveTo(-s * 0.04 - 5, s * 1.3, -s * 0.04 - 1, s * 1.3, -s * 0.04 - 1, s * 1.4 + 1);
                    ctx.closePath();

                    ctx.fill();
                    ctx.stroke();


                    ctx.restore();
                }


                ctx.lineCap = "butt";
                ctx.lineWidth = s * 0.08 + 4;
                ctx.beginPath();
                // ctx.lineTo(0, -s*1.05);
                ctx.arc(s * 0.5, -s * 1.4, s * 0.5, Math.PI, 0);

                ctx.bezierCurveTo(s, -s * 0.8, s * 0.8, -s * 0.1, s * 0.8, s * 0.5);
                ctx.arc(s * 1.3, s * 0.5, s * 0.5, Math.PI, 0, true);
                ctx.lineTo(s * 1.8, s * 0.2);
                ctx.stroke();

                ctx.strokeStyle = water_fill_style;
                ctx.lineWidth = s * 0.08 + 0;
                ctx.stroke();

                if (mode === "syringe_pressure") {
                    ctx.translate(s * 1.8, -s)
                    draw_pressure_gauge(s, arg0 * 0.04 / (sw * sw), [0, s * 1.2])

                    ctx.lineWidth = 2;
                    ctx.strokeStyle = "#99875D";
                    ctx.fillStyle = "#D3BA80";
                    ctx.beginPath();
                    ctx.rect(-s * 0.04 - 4, s * 1.15, s * 0.08 + 8, s * 0.12);

                    ctx.fill();
                    ctx.stroke();
                }

                ctx.restore();

                ctx.beginPath();

                ctx.lineTo(-s * sw, -offset);
                ctx.lineTo(-s * sw, -s);
                ctx.lineTo(-s * 0.04, -s);
                ctx.lineTo(-s * 0.04, -s * 1.25);
                ctx.lineTo(s * 0.04, -s * 1.25);
                ctx.lineTo(s * 0.04, -s);
                ctx.lineTo(s * sw, -s);
                ctx.lineTo(s * sw, -offset);

                ctx.closePath();

                ctx.fillStyle = water_fill_style;
                ctx.fill();

                ctx.fillStyle = "rgba(0,0,0,0.03)"


                ctx.beginPath();
                ctx.rect(-s * sw * 0.7, -offset + s * 0.13 + 4, s * sw * 2 * 0.7, s * 1.3);
                ctx.fill();
                ctx.stroke();

                ctx.strokeStyle = "#c8c8c8";
                ctx.beginPath();
                ctx.rect(-2, -offset + s * 0.13 + 4, 4, s * 1.3);
                ctx.fill();
                ctx.stroke();

                ctx.strokeStyle = container_stroke_style;

                ctx.beginPath();
                ctx.rect(-s * sw + 5, -offset + s * 0.13, s * sw * 2 - 10, 4);
                ctx.fill();
                ctx.stroke();

                ctx.lineWidth = 6;

                ctx.beginPath();
                ctx.lineTo(s * sw * 1.7, -offset + s * 1.3 + s * 0.13 + 4);
                ctx.lineTo(-s * sw * 1.7, -offset + s * 1.3 + s * 0.13 + 4);
                ctx.strokeStyle = container_stroke_style;
                ctx.stroke();
                ctx.strokeStyle = "#ddd";
                ctx.lineWidth = 2;
                ctx.stroke();

                ctx.strokeStyle = container_stroke_style;

                ctx.fillStyle = "#333";
                ctx.fillRect(-s * sw + 4, -offset, s * sw * 2 - 8, s * 0.12);
                ctx.fillStyle = "#222";

                ctx.beginPath();
                ctx.roundRect(-s * sw + 3, -offset - s * 0.02, s * sw * 2 - 6, s * 0.04, s * 0.015);
                ctx.fill();

                ctx.beginPath();
                ctx.roundRect(-s * sw + 3, -offset - s * 0.02 + s * 0.12, s * sw * 2 - 6, s * 0.04, s * 0.015);
                ctx.fill();

                ctx.fillStyle = "rgba(0,0,0,0.03)"


                ctx.lineWidth = 6;

                ctx.beginPath();
                ctx.lineTo(-s * sw, s * 0.4);
                ctx.lineTo(-s * sw, -s);
                ctx.lineTo(-s * 0.05, -s);
                ctx.lineTo(-s * 0.05, -s * 1.25);
                ctx.lineTo(s * 0.05, -s * 1.25);
                ctx.lineTo(s * 0.05, -s);
                ctx.lineTo(s * sw, -s);
                ctx.lineTo(s * sw, s * 0.4);
                ctx.closePath();

                ctx.fill();
                ctx.stroke();

                ctx.strokeStyle = "#ddd";
                ctx.lineWidth = 2;
                ctx.stroke();

                ctx.lineWidth = 6;


                ctx.beginPath();
                ctx.lineTo(-s * sw * 1.7, s * 0.4);
                ctx.lineTo(s * sw * 1.7, s * 0.4);
                ctx.strokeStyle = container_stroke_style;
                ctx.stroke();
                ctx.strokeStyle = "#ddd";
                ctx.lineWidth = 2;
                ctx.stroke();

                if (mode === "syringe_pressure") {

                    ctx.fillStyle = "#333";
                    ctx.strokeStyle = "#222";

                    ctx.beginPath();
                    ctx.ellipse(-s * 0.9, -offset + s * 0.06, sw * s, sw * s, 0, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.stroke();

                    ctx.lineWidth = 1;
                    ctx.strokeStyle = "#aaa";
                    ctx.setLineDash([1, 2]);
                    ctx.beginPath();
                    ctx.ellipse(-s * 0.9, -offset + s * 0.06, s * 0.45, s * 0.45, 0, 0, Math.PI * 2);
                    ctx.stroke();
                    ctx.beginPath();
                    ctx.moveTo(-s * 0.45, -offset + s * 0.06);
                    ctx.lineTo(-sw * s, -offset + s * 0.06);
                    ctx.stroke();
                    ctx.setLineDash([])

                    ctx.save();

                    ctx.translate(-s * 0.9, -offset + s * 0.06);
                    ctx.scale(sw * 5, sw * 5);

                    ctx.fillStyle = "#eee";
                    ctx.fillText("A", 0, font_size * 0.3)

                    ctx.restore();

                    ctx.fillStyle = "#DE3F3F";
                    ctx.strokeStyle = "#A72F2F"
                    draw_arrow([0, -s * 0.9 - 2], 0, width * 0.015 * arg0);

                } else {
                    ctx.fillStyle = "#DE3F3F";
                    ctx.strokeStyle = "#A72F2F"
                    draw_arrow([0, offset - 3 - s * 1.45], 0, width * 0.015 * (0.6 + arg0 * 0.6));

                    ctx.translate(s * 1.8, -s * 1.2)

                    ctx.fillStyle = water_fill_style;

                    ctx.beginPath();

                    ctx.lineTo(-s * sw * 0.5, -arg0 * s * 0.2 + s * 0.5);
                    ctx.lineTo(-s * sw * 0.5, s);
                    ctx.lineTo(-s * 0.05, s);
                    ctx.lineTo(-s * 0.05, s * 1.25);
                    ctx.lineTo(s * 0.05, s * 1.25);
                    ctx.lineTo(s * 0.05, s);
                    ctx.lineTo(s * sw * 0.5, s);
                    ctx.lineTo(s * sw * 0.5, -arg0 * s * 0.2 + s * 0.5);
                    ctx.closePath();
                    ctx.fill();

                    ctx.fillStyle = "#C8A070";
                    ctx.strokeStyle = "#7E6546";
                    ctx.beginPath();
                    ctx.rect(-s * sw * 0.5 + 4, -arg0 * s * 0.2 + s * 0.5, s * sw - 8, s * 0.05);
                    ctx.fill();
                    ctx.stroke();


                    ctx.lineWidth = 5;
                    ctx.lineCap = "round";
                    ctx.strokeStyle = "#666";

                    ctx.beginPath();
                    let prev_y = -1;
                    for (let i = 0; i <= 100; i++) {
                        let t = i / 100;
                        let a = Math.PI * 7 * t;

                        let x = Math.cos(a) * (s * sw * 0.5 - 6);
                        let y = Math.sin(a) * (s * sw * 0.5 - 6);
                        let z = t * (s * 0.5 * (1 - arg0 * 0.4) - 8) + 5;
                        if (prev_y < 0 && y > 0) {
                            ctx.moveTo(x, z);
                        } else if (y > 0) {
                            ctx.lineTo(x, z);
                        }
                        prev_y = y;
                    }
                    ctx.stroke();


                    ctx.beginPath();
                    ctx.strokeStyle = "#999";
                    ctx.moveTo(s * sw * 0.5 - 6, 5);
                    ctx.lineTo(-s * sw * 0.5 + 6, 5);
                    prev_y = 1;
                    for (let i = 0; i <= 100; i++) {
                        let t = i / 100;
                        let a = Math.PI * 7 * t;

                        let x = Math.cos(a) * (s * sw * 0.5 - 6);
                        let y = Math.sin(a) * (s * sw * 0.5 - 6);
                        let z = t * (s * 0.5 * (1 - arg0 * 0.4) - 8) + 5;
                        if (prev_y > 0 && y < 0) {
                            ctx.moveTo(x, z);
                        } else if (y < 0) {
                            ctx.lineTo(x, z);
                        }
                        prev_y = y;
                    }
                    ctx.moveTo(s * sw * 0.5 - 6, (s * 0.5 * (1 - arg0 * 0.4) - 8) + 5);
                    ctx.lineTo(-s * sw * 0.5 + 6, (s * 0.5 * (1 - arg0 * 0.4) - 8) + 5);
                    ctx.stroke();

                    ctx.fillStyle = "rgba(0,0,0,0.03)"
                    ctx.strokeStyle = container_stroke_style;



                    ctx.lineWidth = 6;

                    ctx.beginPath();

                    ctx.lineTo(-s * sw * 0.5, 0);
                    ctx.lineTo(-s * sw * 0.5, s);
                    ctx.lineTo(-s * 0.05, s);
                    ctx.lineTo(-s * 0.05, s * 1.25);
                    ctx.lineTo(s * 0.05, s * 1.25);
                    ctx.lineTo(s * 0.05, s);
                    ctx.lineTo(s * sw * 0.5, s);
                    ctx.lineTo(s * sw * 0.5, 0);
                    ctx.lineTo(-s * sw * 0.5, 0);
                    ctx.closePath();

                    ctx.fill();
                    ctx.stroke();

                    ctx.strokeStyle = "#ddd";
                    ctx.lineWidth = 2;
                    ctx.stroke();

                }




            } else if (mode === "hull") {
                gl.begin(width, height)

                let mat = mat4_mul(vp, scale_mat4(0.01));
                let norm = [-1, 0, 0, 1000];

                let color;
                if (arg0 == 0) {
                    norm = [0, 0, 1, 120];
                    color = [248 / 255, 207 / 255, 67 / 255, 1];
                } else if (arg0 == 1) {
                    norm = [0, -1, 0, 1100];
                    color = [91 / 255, 173 / 255, 220 / 255, 1];
                } else if (arg0 == 2) {
                    norm = [0, 1, 0, 1000];
                    color = [0.4, 0.4, 0.4, 1];
                } else if (arg0 == 3) {
                    norm = [1, 0, 0, 0];
                    color = [247 / 255, 65 / 255, 57 / 255, 1];

                } else if (arg0 == 4) {
                    norm = [-1, 0, 0, 0];
                    color = [119 / 255, 208 / 255, 86 / 255, 1];
                }

                gl.draw_mesh("hull", mat, rot, color, 0.6, norm);


                gl.draw_mesh("rudder", mat4_mul(mat, translation_mat4([0, -40, 0])),
                    rot, arg0 == 2 ? [0.4, 0.4, 0.4, 1] : [0.8, 0.8, 0.8, 1], 0.6, norm);

                {

                    let pitch_a = Math.PI * 0.55;
                    let twist = 5.7;
                    let skew = 0.25;
                    let n = 5;

                    let color = arg0 == 2 ? [0.4, 0.4, 0.4, 1] : [0.8, 0.8, 0.8, 1];
                    let sc = scale_mat4(0.05);

                    let m = mat4_mul(mat4_mul(vp, translation_mat4([0, 11.25, -0.85])),
                        mat4_mul(sc, rot_x_mat4(-Math.PI * 0.5)));
                    gl.draw_hub(mat4_mul(m, mat4_mul(scale_mat4(2.0), translation_mat4([0, 0, -1]))), rot,
                        color);

                    for (let i = 0; i < n; i++) {
                        let mat = mat4_mul(mat4_mul(m, mat4_mul(rot_z_mat4(i * Math.PI * 2 / n), rot_y_mat4(pitch_a))), scale_mat4(12.0));
                        let r = mat3_mul(mat3_mul(rot, rot_x_mat3(-Math.PI * 0.5)), mat3_mul(rot_z_mat3(i * Math.PI * 2 / n), rot_y_mat3(pitch_a)));

                        gl.draw_blade(mat, r, color, twist, skew);
                    }
                }

                ctx.drawImage(gl.finish(), 0, 0, width, height);

                ctx.feather(canvas.width, canvas.height, 0, 0, canvas.height * 0.05, canvas.height * 0.05);

                ctx.translate(width - 10, height - 10);
                draw_camera_axes(ctx, 10, mat3_mul(rot, rot_z_mat3(Math.PI)));

            } else if (mode === "hull_ratio") {
                gl.begin(width, height)

                let a = 0.7 * (arg0 - 0.5);
                let mat = scale_mat4(0.01 * 0.9);
                mat = mat4_mul(mat, rot_y_mat4(a));
                mat = mat4_mul(vp, mat);

                let norm = [0, 0, -1, 6];

                let hull_color = [197 / 255, 67 / 255, 46 / 255, 1];

                gl.draw_mesh("hull", mat, mat3_mul(rot, rot_y_mat3(a)), hull_color, 0.6, norm, true);


                gl.draw_mesh("rudder", mat4_mul(mat, translation_mat4([0, -40, 0])),
                    rot, hull_color, 0.6);

                {

                    let pitch_a = Math.PI * 0.55;
                    let twist = 5.7;
                    let skew = 0.25;
                    let n = 5;

                    let color = [211 / 255, 186 / 255, 128 / 255, 1];

                    let sc = scale_mat4(0.05);

                    let m = mat4_mul(mat4_mul(mat4_mul(vp, mat4_mul(scale_mat4(0.9), rot_y_mat4(a))), translation_mat4([0, 11.25, -0.85])),
                        mat4_mul(sc, rot_x_mat4(-Math.PI * 0.5)));
                    gl.draw_hub(mat4_mul(m, mat4_mul(scale_mat4(2.0), translation_mat4([0, 0, -1]))), rot,
                        color);

                    for (let i = 0; i < n; i++) {
                        let mat = mat4_mul(mat4_mul(m, mat4_mul(rot_z_mat4(i * Math.PI * 2 / n), rot_y_mat4(pitch_a))), scale_mat4(12.0));
                        let r = mat3_mul(mat3_mul(rot, rot_x_mat3(-Math.PI * 0.5)), mat3_mul(rot_z_mat3(i * Math.PI * 2 / n), rot_y_mat3(pitch_a)));

                        gl.draw_blade(mat, r, color, twist, skew);
                    }
                }


                let color = vec_scale(vec_mul([44, 128, 172, 1], [1.0 / 255, 1.0 / 255, 1.0 / 255, 1]), 0.3);


                let scl = scale_mat4(0.01 * 0.9);
                scl[0] *= 0.4;
                scl[5] *= 1.46;
                scl[10] *= 0.14;
                scl[7] = -0.2;
                scl[11] = -1.4;
                mat = mat4_mul(vp, scl);
                gl.draw_mesh("box", mat, mat3_mul(rot, rot_y_mat3(a)), color, 0.2);


                ctx.drawImage(gl.finish(), 0, 0, width, height);

                ctx.feather(canvas.width, canvas.height, 0, 0, canvas.height * 0.05, canvas.height * 0.05);

                ctx.translate(width - 10, height - 10);
                draw_camera_axes(ctx, 10, mat3_mul(rot, rot_z_mat3(Math.PI)));


            } else if (mode === "tub") {
                gl.begin(width, height);

                let mat = mat4_mul(vp, scale_mat4(0.0045));
                gl.draw_mesh("tub", mat, rot, [0.9, 0.9, 0.9, 1], 0.7, [0, 1, 0, 900]);

                ctx.drawImage(gl.finish(), 0, 0, width, height);
                ctx.translate(width - 10, height - 10);

                draw_camera_axes(ctx, 10, mat3_mul(mat3_mul(rot, rot_y_mat3(-0.5*Math.PI)), rot_x_mat3(-0.5*Math.PI)));
            } else if (mode === "subdiv") {

                ctx.translate(0.5 * width, 0.5 * height);

                let n = Math.round(arg0 * 26 * 0.5) * 2 + 1;


                let w = 2 / n;
                let hw = 0.5 * w;

                let s = 1.25;


                let c0 = "rgba(253, 46, 34,";
                let c1 = "rgba(82, 172, 2,";

                let sign = rot[8] > 0 ? -1 : 1;

                ctx.strokeStyle = "#333"
                for (let j = 0; j < n; j++) {

                    let y = ((j + 0.5) / n - 0.5) * 2;
                    for (let i = 0; i < n; i++) {
                        let x = ((i + 0.5) / n - 0.5) * 2;

                        if (x * x + y * y > 1)
                            continue;

                        let z = sign * Math.sqrt(1 - x * x - y * y);

                        let ps = [
                            [x - hw, y - hw, z],
                            [x - hw, y + hw, z],
                            [x + hw, y + hw, z],
                            [x + hw, y - hw, z],
                            [x - hw, y - hw, -z],
                            [x - hw, y + hw, -z],
                            [x + hw, y + hw, -z],
                            [x + hw, y - hw, -z]];

                        ps = ps.map(p => vec_scale(project(mat3_mul_vec(rot, p)), s));

                        for (let i = 0; i < 4; i++) {

                            ctx.beginPath();

                            ctx.lineTo(ps[i][0], ps[i][1]);
                            ctx.lineTo(ps[i + 4][0], ps[i + 4][1]);

                            ctx.stroke();
                        }
                    }
                }

                ctx.save();
                ctx.fillStyle = "rgba(0,0,0,0.9)"
                ctx.globalCompositeOperation = "destination-out";
                ctx.fillRect(-width, -width, width * 2, width * 2);


                ctx.restore();

                // ctx.strokeStyle = "#333";
                ctx.fillStyle = (sign == 1 ? c0 : c1) + "0.7)"
                ctx.strokeStyle = (sign == 1 ? c0 : c1) + "0.8)"

                ctx.lineWidth = 1;

                for (let j = 0; j < n; j++) {

                    let y = ((j + 0.5) / n - 0.5) * 2;
                    for (let i = 0; i < n; i++) {
                        let x = ((i + 0.5) / n - 0.5) * 2;
                        if (x * x + y * y > 1)
                            continue;

                        let z = sign * Math.sqrt(1 - x * x - y * y);

                        let ps = [
                            [x - hw, y - hw, z],
                            [x - hw, y + hw, z],
                            [x + hw, y + hw, z],
                            [x + hw, y - hw, z]];

                        ps = ps.map(p => vec_scale(project(mat3_mul_vec(rot, p)), s));

                        ctx.beginPath();

                        for (let i = 0; i < 4; i++) {
                            ctx.lineTo(ps[i][0], ps[i][1]);
                        }
                        ctx.closePath();
                        ctx.fill();
                        ctx.stroke();
                    }
                }

                ctx.fillStyle = (sign == 1 ? c1 : c0) + "0.7)"
                ctx.strokeStyle = (sign == 1 ? c1 : c0) + "0.8)"

                for (let j = 0; j < n; j++) {

                    let y = ((j + 0.5) / n - 0.5) * 2;
                    for (let i = 0; i < n; i++) {
                        let x = ((i + 0.5) / n - 0.5) * 2;
                        let z = sign * Math.sqrt(1 - x * x - y * y);
                        if (x * x + y * y > 1)
                            continue;

                        let ps = [
                            [x - hw, y - hw, -z],
                            [x - hw, y + hw, -z],
                            [x + hw, y + hw, -z],
                            [x + hw, y - hw, -z]];

                        ps = ps.map(p => vec_scale(project(mat3_mul_vec(rot, p)), s));


                        ctx.beginPath();

                        for (let i = 0; i < 4; i++) {
                            ctx.lineTo(ps[i][0], ps[i][1]);
                        }
                        ctx.closePath();
                        ctx.fill();
                        ctx.stroke();
                    }
                }

                ctx.save();
                ctx.fillStyle = "rgba(0,0,0,0.2)"
                ctx.globalCompositeOperation = "destination-out";
                ctx.fillRect(-width, -width, width * 2, width * 2);

                ctx.globalCompositeOperation = "destination-over";
                ctx.fillStyle = "rgba(0,0,0,0.2)"
                ctx.strokeStyle = "rgba(0,0,0,0.1)";

                ctx.strokeEllipse(0, 0, height * s / 4.0);
                // ctx.fillEllipse(0,0, height *s/ 4.0);

                ctx.restore();

                ctx.feather(canvas.width, canvas.height, canvas.height * 0.05, canvas.height * 0.05, canvas.height * 0.05, canvas.height * 0.05);


                ctx.translate(+width * 0.5 - 10, height * 0.5 - 10);
                draw_camera_axes(ctx, 10, mat3_mul(rot, rot_z_mat3(-Math.PI * 0.5)));

            } else if (mode === "height") {

                let s = width * 0.09;

                ctx.translate(Math.round(width * 0.55), Math.round(height * 0.65));

                // ctx.fill();

                ctx.lineWidth = 2;
                ctx.fillStyle = "#DCECF5";
                ctx.strokeStyle = water_stroke_style;

                ctx.fillRect(-width, -4 * s, width * 2, height);
                ctx.strokeRect(-width, -4 * s, width * 2, height);

                ctx.fillStyle = ctx.strokeStyle = "#DD3B3B";

                ctx.beginPath();
                ctx.lineTo(-2.5 * s, -s);
                ctx.lineTo(-2.5 * s, -s * 4);
                ctx.stroke();

                ctx.beginPath();
                ctx.lineTo(-2.5 * s, -s);
                ctx.lineTo(-2.5 * s + 0.12 * s, -s - 0.25 * s);
                ctx.lineTo(-2.5 * s - 0.12 * s, -s - 0.25 * s);
                ctx.fill();

                ctx.beginPath();
                ctx.lineTo(-2.5 * s, -s * 4);
                ctx.lineTo(-2.5 * s + 0.12 * s, -s * 4 + 0.25 * s);
                ctx.lineTo(-2.5 * s - 0.12 * s, -s * 4 + 0.25 * s);
                ctx.fill();

                ctx.font = "500 " + s * 0.6 + "px IBM Plex Sans";
                ctx.fillText("h", -3 * s, -2.5 * s + font_size * 0.4);
                ctx.font = "500 " + s * 0.3 + "px IBM Plex Sans";
                ctx.fillText("T", -3 * s + font_size * 0.5, -2.5 * s + font_size * 0.6);


                ctx.fillStyle = "rgba(0,0,0,0.1)"
                ctx.beginPath()
                ctx.roundRect(-3 * s + font_size * 0.18 - font_size * 0.55, - font_size, 1.1 * font_size, 2 * font_size, font_size * 0.3);
                ctx.fill();

                ctx.fillStyle = ctx.strokeStyle = "#333";

                ctx.font = "500 " + s * 0.6 + "px IBM Plex Sans";
                ctx.fillText("h", -3 * s + font_size * 0.2, + font_size * 0.4);

                ctx.beginPath();
                ctx.lineTo(-2.5 * s, -s);
                ctx.lineTo(-2.5 * s, s);
                ctx.stroke();

                ctx.beginPath();
                ctx.lineTo(-2.5 * s, -s);
                ctx.lineTo(-2.5 * s + 0.12 * s, -s + 0.25 * s);
                ctx.lineTo(-2.5 * s - 0.12 * s, -s + 0.25 * s);
                ctx.fill();

                ctx.beginPath();
                ctx.lineTo(-2.5 * s, s);
                ctx.lineTo(-2.5 * s + 0.12 * s, s - 0.25 * s);
                ctx.lineTo(-2.5 * s - 0.12 * s, s - 0.25 * s);
                ctx.fill();


                ctx.fillStyle = ctx.strokeStyle = "#61A035";

                ctx.font = "500 " + s * 0.6 + "px IBM Plex Sans";
                ctx.fillText("h", -4.5 * s, -s * 1.5 + font_size * 0.4);
                ctx.font = "500 " + s * 0.3 + "px IBM Plex Sans";
                ctx.fillText("B", -4.5 * s + font_size * 0.5, -s * 1.5 + font_size * 0.6);


                ctx.beginPath();
                ctx.lineTo(-4 * s, -s * 4);
                ctx.lineTo(-4 * s, s);
                ctx.stroke();

                ctx.beginPath();
                ctx.lineTo(-4 * s, -s * 4);
                ctx.lineTo(-4 * s + 0.12 * s, -s * 4 + 0.25 * s);
                ctx.lineTo(-4 * s - 0.12 * s, -s * 4 + 0.25 * s);
                ctx.fill();

                ctx.beginPath();
                ctx.lineTo(-4 * s, s);
                ctx.lineTo(-4 * s + 0.12 * s, s - 0.25 * s);
                ctx.lineTo(-4 * s - 0.12 * s, s - 0.25 * s);
                ctx.fill();

                ctx.strokeStyle = "#333";

                ctx.beginPath();
                ctx.lineTo(0, -s);
                ctx.lineTo(-2.7 * s, -s);
                ctx.stroke();

                ctx.beginPath();
                ctx.lineTo(0, s);
                ctx.lineTo(-4.2 * s, s);
                ctx.stroke();


                ctx.fillStyle = "#D8A972";
                ctx.strokeStyle = "#8F704B";

                ctx.beginPath();
                ctx.roundRect(-s * 2, -s, 4.8 * s, 2 * s, 0.1 * s);
                ctx.fill();
                ctx.stroke();


                ctx.feather(canvas.width, canvas.height, canvas.height * 0.08, canvas.height * 0.08, canvas.height * 0.08, canvas.height * 0.08);

                // ctx.stroke();

            } else if (mode === "water_cylinder") {

                ctx.translate(0.5 * width, 0.5 * height);

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



                let points = [];

                let n = 64;
                for (let z = 0; z < 2; z++) {
                    for (let i = 0; i < n; i++) {
                        let a = 2 * Math.PI * i / n;
                        let p = [Math.cos(a), Math.sin(a), (z - 0.5) * 3];

                        p = mat3_mul_vec(rot, p);
                        p = project(p);

                        points.push(p);
                    }
                }

                ctx.font = font_size * 1.2 + "px IBM Plex Sans";

                ctx.fillStyle = "#333";
                ctx.fillText("V", 0, 0);


                let pA = project(mat3_mul_vec(rot, [0, 0, -1.8]));
                let ph = project(mat3_mul_vec(rot, [1.2, 0, 0]));

                let p0 = project(mat3_mul_vec(rot, [1.0, 0, -1.5]));
                let p1 = project(mat3_mul_vec(rot, [1.0, 0, 1.5]));

                if (rot[8] > 0)
                    ctx.fillText("A", pA[0], pA[1]);

                if (rot[6] < 0)
                    ctx.fillText("h", ph[0], ph[1]);



                ctx.save();

                ctx.fillStyle = "#333";
                ctx.strokeStyle = "rgba(0,0,0,0.4)"
                ctx.beginPath();
                for (let i = 0; i < 30; i++) {
                    let t0 = i / 29.5;
                    let t1 = (i + 0.5) / 29.5;
                    ctx.moveTo(lerp(p0[0], p1[0], t0), lerp(p0[1], p1[1], t0));
                    ctx.lineTo(lerp(p0[0], p1[0], t1), lerp(p0[1], p1[1], t1));
                }
                ctx.stroke();
                ctx.restore();



                ctx.globalAlpha = 0.4;
                ctx.fillStyle = water_fill_style;
                ctx.strokeStyle = water_stroke_style;

                for (let z = 0; z < 2; z++) {
                    ctx.beginPath();
                    for (let i = 0; i < n; i++) {
                        let p = points[i + z * n];
                        ctx.lineTo(p[0], p[1]);
                    }
                    ctx.closePath();
                    ctx.stroke();
                }

                ctx.globalAlpha = 0.3;
                ctx.fillStyle = "#333";

                ctx.beginPath();
                for (let i = 0; i < n; i++) {
                    let p = points[i];
                    ctx.lineTo(p[0], p[1]);
                }
                ctx.closePath();
                ctx.fill();

                ctx.fillStyle = water_fill_style;
                ctx.globalAlpha = 0.5;

                let hull_points = convex_hull(points.slice());

                ctx.beginPath();
                hull_points.forEach(p => { ctx.lineTo(p[0], p[1]); });
                ctx.closePath();
                ctx.fill();
                ctx.globalAlpha = 1;
                ctx.lineWidth = 1.5;
                ctx.stroke();

                let zz = rot[8] <= 0 ? 0 : 1

                ctx.beginPath();
                for (let i = 0; i < n; i++) {
                    let p = points[i + zz * n];
                    ctx.lineTo(p[0], p[1]);
                }
                ctx.closePath();
                ctx.stroke();


                ctx.fillStyle = "#333";

                if (rot[8] <= 0)
                    ctx.fillText("A", pA[0], pA[1]);

                if (rot[6] >= 0)
                    ctx.fillText("h", ph[0], ph[1]);



                ctx.translate(+width * 0.5 - 10, height * 0.5 - 10);
                draw_camera_axes(ctx, 10, mat3_mul(rot, rot_z_mat3(-Math.PI * 0.5)));

            } else if (mode === "3d_forces") {
                gl.begin(width, height);

                let sc = 5.3;

                let color = [0.8, 0.8, 0.8, 1];
                color = vec_mul([237, 186, 128, 1], [1.0 / 255, 1.0 / 255, 1.0 / 255, 1]);

                gl.draw_mesh("cube", mat4_mul(vp, scale_mat4(0.001 * sc)), rot, color, 0.2);

                let s0 = 0.24;
                let s1 = 0.12;

                let hc = 0.45;
                let hor_color = [hc, hc, hc, 1.0];

                for (let i = 0; i < 9; i++) {
                    let x = ((i + 0.5) / 9 - 0.5) * 4 * sc;

                    for (let i = 0; i < 3; i++) {
                        let t = (i) / 3;
                        let y = ((i + 0.5) / 3 - 0.5) * 2 * sc * 0.7;
                        let s = lerp(s0, s1, t);

                        gl.draw_arrow(mat4_mul(vp, mat4_mul(translation_mat4([x, y, -sc - 11 * s]), scale_mat4(s))),
                            rot, hor_color);

                        gl.draw_arrow(mat4_mul(mat4_mul(vp, rot_y_mat4(Math.PI)), mat4_mul(translation_mat4([x, y, -sc - 11 * s]), scale_mat4(s))),
                            mat3_mul(rot, rot_y_mat3(Math.PI)), hor_color);
                    }
                }

                for (let i = 0; i < 4; i++) {
                    let x = ((i + 0.5) / 4 - 0.5) * 2 * sc;

                    for (let i = 0; i < 3; i++) {
                        let t = (i) / 3;
                        let y = ((i + 0.5) / 3 - 0.5) * 2 * sc * 0.7;
                        let s = lerp(s0, s1, t);

                        gl.draw_arrow(mat4_mul(mat4_mul(mat4_mul(vp, translation_mat4([-sc * 2, y, x])),
                            mat4_mul(rot_y_mat4(Math.PI * 0.5), translation_mat4([0, 0, -11 * s]))),

                            scale_mat4(s)),
                            mat3_mul(rot, rot_y_mat3(Math.PI * 0.5)), hor_color);

                        gl.draw_arrow(mat4_mul(mat4_mul(mat4_mul(vp, translation_mat4([sc * 2, y, x])),
                            mat4_mul(rot_y_mat4(-Math.PI * 0.5), translation_mat4([0, 0, -11 * s]))),

                            scale_mat4(s)),
                            mat3_mul(rot, rot_y_mat3(-Math.PI * 0.5)), hor_color);


                    }
                }


                for (let k = 0; k < 2; k++) {
                    let sign = (k == 0 ? -1 : 1);
                    let s = k == 0 ? s0 : s1;
                    let r = mat3_mul(rot, rot_x_mat3(sign * Math.PI * 0.5));
                    let color = k == 1 ? [222 / 255, 80 / 255, 58 / 255, 1]
                        : [108 / 255, 179 / 255, 60 / 255, 1];
                    for (let i = 0; i < 9; i++) {
                        let x = ((i + 0.5) / 9 - 0.5) * 4 * sc;

                        for (let i = 0; i < 4; i++) {
                            let t = (i) / 4;
                            let y = ((i + 0.5) / 4 - 0.5) * 2 * sc;

                            gl.draw_arrow(mat4_mul(mat4_mul(mat4_mul(vp, translation_mat4([x, sign * 0.7 * sc, y])),
                                mat4_mul(rot_x_mat4(sign * Math.PI * 0.5), translation_mat4([0, 0, -11 * s]))),

                                scale_mat4(s)),
                                r, color);
                        }
                    }
                }

                ctx.drawImage(gl.finish(), 0, 0, width, height);

                ctx.feather(canvas.width, canvas.height, 0, 0, canvas.height * 0.05, canvas.height * 0.05);

                ctx.translate(width - 10, height - 10);
                draw_camera_axes(ctx, 10, mat3_mul(rot, mat3_mul(rot_y_mat3(-Math.PI * 0.5), rot_x_mat3(-Math.PI * 0.5))));
            } else if (mode === "helicoid") {
                gl.begin(width, height);

                let pitch = lerp(16, 2, arg1);
                let radius = arg0;
                let color = [38 / 255, 178 / 255, 255 / 255, 1];
                let offset = t * 0.3;
                let mat = mat4_mul(mat4_mul(vp, rot_z_mat4(offset * Math.PI * 2)), scale_mat4(12.0));

                let s0 = scale_mat4(0.01);

                s0[10] = radius;
                s0[11] = 0;

                gl.draw_segment(mat4_mul(mat, mat4_mul(rot_y_mat4(Math.PI * 0.5), s0)), rot,
                    color);


                s0[10] = 2;
                s0[11] = -1;
                gl.draw_helicoid_axis(mat4_mul(mat, s0), rot, pitch * 0.5, offset, [255 / 255, 156 / 255, 0 / 255, 1]);


                gl.draw_helicoid(mat, rot, pitch * Math.PI, radius, vec_scale(color, 0.3));
                ctx.drawImage(gl.finish(), 0, 0, width, height);

                ctx.translate(width - 10, height - 10);
                draw_camera_axes(ctx, 10, mat3_mul(rot, rot_z_mat3(Math.PI * 1.25)));


            } else if (mode === "propeller" || mode === "propeller_pitch" || mode === "propeller_n" ||
                mode === "propeller_twist" || mode === "propeller_pitch_force" ||
                mode === "propeller_radial" || mode === "propeller_forward") {

                let n = 3;

                let pitch_a = Math.PI * 0.55;
                let twist = 5.7;
                let skew = 0;

                let draw_axes = true;

                if (mode === "propeller_twist") {
                    twist *= arg0;
                } else if (mode === "propeller_pitch" || mode === "propeller_pitch_force") {
                    pitch_a = Math.PI * 0.5 * (1 - arg0);
                    twist = 0;
                } else if (mode === "propeller") {
                    skew = 0.25;
                    n = 5;
                } else if (mode === "propeller_n") {
                    n = 2 + arg0;
                } else if (mode === "propeller_radial") {
                    rot = ident_mat3;
                    draw_axes = false;
                    vp = mat4_mul(mat4_mul(proj, scale_mat4(0.9)), mat3_to_mat4(rot));
                    twist = 0;
                    pitch_a = 0.2;
                } else if (mode === "propeller_forward") {
                    rot = rot_x_mat3(Math.PI * 0.5);
                    draw_axes = false;
                    vp = mat4_mul(proj, mat3_to_mat4(rot));
                    twist = 0;
                    pitch_a = 0.2;
                }

                let sc = scale_mat4(1);
                sc[10] = 3.0;

                let shaft_color = [91 / 255, 173 / 255, 220 / 255, 1];;
                let hub_color = [248 / 255, 207 / 255, 67 / 255, 1];
                let blade_color = [247 / 255, 65 / 255, 57 / 255, 1];
                if (mode === "propeller_pitch_force" || mode === "propeller_radial" ||
                    mode === "propeller_forward" || mode === "propeller_twist") {
                    shaft_color = blade_color = hub_color = [0.8, 0.8, 0.8, 1];
                }

                let mvp = mat4_mul(mat4_mul(vp, scale_mat4(1.2)), rot_z_mat4(-t * 2));
                let rrot = mat3_mul(rot, rot_z_mat3(-t * 2));

                if (mode === "propeller_forward") {
                    mvp = mat4_mul(translation_mat4([0, -0.3, 0]), mvp);
                    mvp = mat4_mul(mvp, scale_mat4(0.9));
                }

                gl.begin(width, width);
                gl.draw_hub(mat4_mul(mvp, mat4_mul(scale_mat4(2.0), translation_mat4([0, 0, -1]))), rrot,
                    hub_color);

                gl.draw_hub(mat4_mul(mvp, mat4_mul(sc, translation_mat4([0, 0, -2.5]))), rrot,
                    shaft_color);

                for (let i = 0; i < n; i++) {
                    let mat = mat4_mul(mat4_mul(mvp, mat4_mul(rot_z_mat4(i * Math.PI * 2 / n), rot_y_mat4(pitch_a))), scale_mat4(12.0));
                    let r = mat3_mul(rrot, mat3_mul(rot_z_mat3(i * Math.PI * 2 / n), rot_y_mat3(pitch_a)));


                    if (mode === "propeller_pitch_force") {
                        let s = Math.sin(pitch_a) * 0.05;
                        gl.draw_arrow(mat4_mul(mat4_mul(mat, translation_mat4([0, 0.6, 0.07])), scale_mat4(s)), r,
                            [55 / 255, 156 / 255, 198 / 255, 1]);

                    }

                    gl.draw_blade(mat,
                        r,
                        blade_color, twist, skew);


                }




                if (mode === "propeller_pitch_force") {
                    let s = Math.cos(pitch_a) * Math.sin(pitch_a);
                    let cs = Math.sin(pitch_a) * 0.6;
                    let mat = mat4_mul(vp, mat4_mul(translation_mat4([0, 0, 6]), scale_mat4(s)));
                    gl.draw_arrow(mat, rot, [248 / 255, 207 / 255, 67 / 255, 1]);

                    let cmat = mat4_mul(vp, mat4_mul(translation_mat4([0, 0, 5]), scale_mat4(cs)));
                    cmat = mat4_mul(cmat, rot_y_mat4(Math.PI * 0.5));
                    gl.draw_curl_arrow(cmat, mat3_mul(rot, rot_y_mat3(Math.PI * 0.5)),
                        [221 / 255, 59 / 255, 59 / 255, 1]);
                }


                ctx.drawImage(gl.finish(), 0, 0, width, height);

                if (draw_axes) {


                    ctx.translate(width - 10, height - 10);


                    draw_camera_axes(ctx, 10, mat3_mul(rot, mat3_mul(rot_y_mat3(-Math.PI * 0.5), rot_x_mat3(-Math.PI * 0.5))));
                }

                if (mode === "propeller_radial") {

                    ctx.translate(0.5 * width, 0.5 * height);
                    let s = width * 0.1;

                    ctx.rotate(t * 2);
                    ctx.fillStyle = "#D23730";

                    for (let i = 0; i < n; i++) {
                        for (let j = 2; j <= 6; j++) {

                            ctx.arrow(0, -0.6 * s * j, j * s * 0.5, -0.6 * s * j, s * 0.1, s * 0.3, s * 0.5);
                            ctx.fill();

                        }
                        ctx.rotate(Math.PI * 2 / n);

                    }


                }
                else if (mode === "propeller_forward") {

                    ctx.translate(0.5 * width, 0.5 * height);

                    let s = width * 0.1;
                    ctx.fillStyle = "#EDB32D";

                    ctx.arrow(0, 0.2 * s, 0, -2.6 * s, s * 0.1, s * 0.3, s * 0.5);
                    ctx.fill();

                }


            } else if (mode === "propeller_aoa" || mode === "propeller_aoa2" || mode === "propeller_aoa3") {

                // made up
                let ideal_aoa = Math.PI * 0.05;

                let rr = arg0;

                let pitch_a = Math.PI * 0.3;
                if (mode === "propeller_aoa") {
                    pitch_a = arg0 * ideal_aoa * 2;
                    rr = 1.1;
                }
                let twist = 0;
                let skew = 0;

                if (mode === "propeller_aoa3") {
                    twist = 3.3;
                    pitch_a = Math.PI * 0.5 + ideal_aoa;
                }

                let l = lerp(2.2, 11.8, rr);

                let r = width * 0.35 * l / proj_w;

                let sc = scale_mat4(1);
                sc[10] = 3.0;

                gl.begin(width, width);

                rot = rot_x_mat3(Math.PI * 0.5);
                let tr = mode !== "propeller_aoa" ? -0.8 : -0.6;
                vp = mat4_mul(mat4_mul(translation_mat4([tr, -0.3, 0]), mat4_mul(proj, scale_mat4(0.7))), mat3_to_mat4(rot));


                let cut = Math.pow(l / 12, 2);

                if (mode === "propeller_aoa") {
                    vp = mat4_mul(vp, scale_mat4(1.7));
                    cut = undefined;
                }

                gl.draw_hub(mat4_mul(vp, mat4_mul(scale_mat4(2.0), translation_mat4([0, -2, -1]))), rot,
                    [0.8, 0.8, 0.8, 1]);

                gl.draw_hub(mat4_mul(vp, mat4_mul(sc, translation_mat4([0, -4, -2.5]))), rot,
                    [0.8, 0.8, 0.8, 1]);


                gl.draw_blade(mat4_mul(mat4_mul(vp, rot_y_mat4(pitch_a)), mat4_mul(scale_mat4(12.0), translation_mat4([0, 0, 0]))),
                    mat3_mul(rot, rot_y_mat3(pitch_a)),
                    [0.8, 0.8, 0.8, 1], twist, skew, true, cut);

                if (mode !== "propeller_aoa") {
                    rot = ident_mat3;
                    vp = mat4_mul(mat4_mul(translation_mat4([0.8, -0.5, 0]),
                        mat4_mul(proj, scale_mat4(0.7))), mat3_to_mat4(rot));


                    gl.draw_hub(mat4_mul(vp, mat4_mul(scale_mat4(2.0), translation_mat4([0, 0, -1]))), rot,
                        [0.8, 0.8, 0.8, 1]);


                    gl.draw_blade(mat4_mul(mat4_mul(vp, rot_y_mat4(pitch_a)), mat4_mul(scale_mat4(12.0), translation_mat4([0, 0, 0]))),
                        mat3_mul(rot, rot_y_mat3(pitch_a)),
                        [0.8, 0.8, 0.8, 1], twist, skew);
                }



                ctx.drawImage(gl.finish(), 0, 0, width, height);


                if (mode !== "propeller_aoa") {

                    ctx.save();
                    ctx.translate(0.9 * width, 0.75 * height);

                    ctx.strokeStyle = "#333"
                    ctx.lineWidth = 2.5;

                    ctx.save();
                    ctx.globalCompositeOperation = "source-atop";
                    ctx.beginPath();
                    ctx.strokeEllipse(0, 0, r)
                    ctx.restore();

                    ctx.restore();
                }


                ctx.strokeStyle = "#333";

                ctx.lineWidth = 0.01 * width;
                ctx.lineCap = "butt";

                ctx.fillStyle = ctx.strokeStyle = "#D23730";

                if (mode === "propeller_aoa")
                    ctx.fillStyle = ctx.strokeStyle = "#59A9D7";

                ctx.save();
                ctx.translate((mode !== "propeller_aoa" ? 0.1 : 0.2) * width, 0.65 * height);
                ctx.beginPath();
                ctx.moveTo(0, 0);

                let l0 = ((l * 0.055)) * width;
                let l1 = 0.2 * width;
                let l2 = Math.sqrt(l1 * l1 + l0 * l0);

                ctx.lineTo(l0 - 0.05 * width, 0);

                ctx.stroke();

                ctx.beginPath();


                ctx.lineTo(l0 - 0.05 * width, 0.015 * width);
                ctx.lineTo(l0, 0);
                ctx.lineTo(l0 - 0.05 * width, -0.015 * width);
                ctx.fill();

                ctx.save()
                ctx.rotate(-pitch_a + Math.atan(twist * l / 12));

                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.lineCap = "butt";
                ctx.setLineDash([3, 3])
                ctx.strokeStyle = "#333"
                ctx.moveTo(0, 0);

                ctx.lineTo((0.3 + rr * 0.2) * width, 0);

                ctx.stroke();



                ctx.restore();



                ctx.save();

                if (mode === "propeller_aoa")
                    ctx.rotate(-ideal_aoa);
                else
                    ctx.rotate(-Math.atan2(l0, -l1) - ideal_aoa + Math.PI * 0.5);

                ctx.fillStyle = "rgba(72, 186, 40, 0.2)"
                ctx.globalCompositeOperation = "destination-over";

                for (let i = 0; i < 4; i++) {
                    ctx.beginPath();
                    ctx.moveTo(0, 0);
                    ctx.arc(0, 0, width * (0.3 + rr * 0.2), -ideal_aoa * 0.25 * i - ideal_aoa * 0.25, ideal_aoa * 0.25 * i + ideal_aoa * 0.25);
                    ctx.fill();
                }

                ctx.restore();


                if (mode !== "propeller_aoa") {


                    ctx.fillStyle = ctx.strokeStyle = "#EDB32D";

                    ctx.save();
                    ctx.translate(l0, 0);

                    ctx.beginPath();
                    ctx.moveTo(0, 0);

                    ctx.lineTo(0, -l1 + 0.03 * width);
                    ctx.stroke();

                    ctx.beginPath();

                    ctx.lineTo(0.015 * width, -l1 + 0.05 * width);
                    ctx.lineTo(0, -l1)
                    ctx.lineTo(-0.015 * width, -l1 + 0.05 * width);
                    ctx.fill();


                    ctx.restore();

                    ctx.save();

                    ctx.fillStyle = ctx.strokeStyle = "#59A9D7";


                    ctx.rotate(-Math.atan2(l0, -l1));

                    ctx.beginPath();
                    ctx.moveTo(0, 0);
                    ctx.lineTo(0, l2 - 0.03 * width);
                    ctx.stroke();

                    ctx.beginPath();
                    ctx.lineTo(0.015 * width, l2 - 0.05 * width);
                    ctx.lineTo(0, l2)
                    ctx.lineTo(-0.015 * width, l2 - 0.05 * width);
                    ctx.fill();


                    ctx.restore();
                }



                ctx.restore();


                if (mode !== "propeller_aoa") {
                    ctx.lineWidth = 1;
                    ctx.strokeStyle = "rgba(0,0,0,0.2)"
                    ctx.setLineDash([2, 2]);
                    ctx.beginPath();

                    ctx.lineTo(0.78 * width, 0);
                    ctx.lineTo(0.78 * width, height);

                    ctx.stroke();

                    ctx.setLineDash([]);
                }

                // ctx.fillRect(0, 0, 200, 200);


            } else if (mode === "water_level") {

                ctx.translate(Math.round(width * 0.35), Math.round(height * 0.5));

                let w = width * 0.5;
                let h = width * 0.5;
                let r = width * 0.03;
                let wh = h * lerp(0.1, 0.9, arg0);

                let y = h * 0.3;
                let p = lerp(0.1, 0.9, arg0) - 0.2;


                bottom_rounded_rect(-w * 0.5, -h * 0.5, w, h, r);
                ctx.fillStyle = water_fill_style;
                ctx.fill();
                ctx.globalCompositeOperation = "destination-out";
                ctx.fillRect(-w * 0.5, -h * 0.5, w, h - wh);

                ctx.globalCompositeOperation = "source-over";

                ctx.fillStyle = water_stroke_style;
                ctx.fillRect(-w * 0.5, -h * 0.5 + h - wh, w, 2);

                ctx.fillStyle = container_fill_style;
                ctx.fill();

                ctx.lineCap = "butt";
                ctx.lineWidth = 8.0;
                ctx.strokeStyle = container_outer_stroke_style;
                ctx.stroke();

                ctx.lineWidth = 4.0;
                ctx.strokeStyle = container_inner_stroke_style;
                ctx.stroke();

                ctx.lineWidth = 2.0;
                ctx.strokeStyle = container_top_stroke_style;
                ctx.beginPath();
                ctx.lineTo(-w * 0.5 - 4, -h * 0.5);
                ctx.lineTo(w * 0.5 + 4, -h * 0.5);
                ctx.stroke();

                if (y > h * 0.5 - wh) {

                    let a = Math.min(1, (y - (h * 0.5 - wh)) / font_size);

                    ctx.save();
                    ctx.globalAlpha = a;
                    ctx.strokeStyle = "rgba(0,0,0,0.2)"
                    ctx.beginPath();
                    ctx.moveTo(-5, y);
                    ctx.lineTo(w * 0.5, y);
                    ctx.stroke();

                    ctx.setLineDash([3, 3]);
                    ctx.beginPath();
                    ctx.moveTo(0, y);
                    ctx.lineTo(0, h * 0.5 - wh);
                    ctx.stroke();

                    ctx.fillStyle = "#333";
                    ctx.fillText("h", -10, 0.5 * (y + h * 0.5 - wh) + font_size * 0.35);

                    ctx.restore();

                }

                ctx.translate(Math.round(width * 0.45), -Math.round(width * 0.15));


                draw_pressure_gauge(width * 0.3, Math.max(0, p) * 4, [-width * 0.2, y + width * 0.15]);

            } else if (mode === "shapes") {

                ctx.translate(Math.round(width * 0.5), Math.round(height * 0.5));

                let w = Math.round(width * 0.5) - 8;
                let h = w * 2;
                let wh = h * 0.95 * arg0;


                ctx.beginPath();

                ctx.arc(0, 0, w, -1.4, Math.PI + 1.4);


                ctx.fillStyle = water_fill_style;
                ctx.fill();

                ctx.fillStyle = water_stroke_style;
                ctx.fillRect(-w, -h * 0.5 + h - wh, w * 2, 2);

                ctx.globalCompositeOperation = "destination-out";

                ctx.fillRect(-width, -h * 0.5, width * 2, h - wh);

                ctx.globalCompositeOperation = "destination-in";
                ctx.fill();

                ctx.globalCompositeOperation = "source-over";

                ctx.lineCap = "butt";


                ctx.lineWidth = 2.0;
                ctx.strokeStyle = container_top_stroke_style;
                ctx.beginPath();
                ctx.lineTo(-w * Math.cos(1.4), -h * 0.5 - 0.5);
                ctx.lineTo(+w * Math.cos(1.4), -h * 0.5 - 0.5);
                ctx.stroke();

                ctx.beginPath();
                ctx.lineTo(-w * Math.cos(1.4), -h * 0.5 + 5.5);
                ctx.lineTo(+w * Math.cos(1.4), -h * 0.5 + 5.5);
                ctx.stroke();

                ctx.beginPath();

                ctx.arc(0, 0, w, -1.4, Math.PI + 1.4);

                // bottom_rounded_rect(-w*0.5, -h*0.5, w, h, r);


                ctx.fillStyle = container_fill_style;
                ctx.fill();


                ctx.lineCap = "square";
                ctx.lineWidth = 8.0;
                ctx.strokeStyle = container_outer_stroke_style;
                ctx.stroke();

                ctx.lineWidth = 4.0;
                ctx.strokeStyle = container_inner_stroke_style;
                ctx.stroke();



                ctx.fillStyle = "#eee";
                ctx.strokeStyle = "#777";
                let n = 60;
                let r = w - 4;
                for (let i = 0; i < n; i++) {
                    let a = 2 * Math.PI * i / n;
                    let c = Math.cos(a);
                    let s = Math.sin(a);

                    let p = [s * r, c * r];

                    ctx.fillStyle = buoy_fill_style;
                    ctx.strokeStyle = "#416275";

                    draw_arrow(p, a, width * 0.015 * Math.max(0, -h * 0.5 + wh - p[1]) / h);
                }


            } else if (mode === "weight_pressure") {

                ctx.translate(Math.round(width * 0.25), Math.round(height * 0.5));

                let w = Math.round(width * 0.25);
                let h = Math.round(width * 0.75);
                let r = width * 0.03;
                let wh = h * 0.6;

                let weight_h = 0.2 * height * arg0;

                let p = lerp(-0.05, 0.9, arg0);
                let y = -h * 0.5 + (h - wh) + p * wh;;

                bottom_rounded_rect(-w * 0.5, -h * 0.5, w, h, r);

                ctx.fillStyle = water_fill_style;
                ctx.fill();
                ctx.globalCompositeOperation = "destination-out";
                ctx.lineWidth = 4.0;
                ctx.stroke();
                ctx.fillRect(-w * 0.5, -h * 0.5, w, h - wh);


                ctx.globalCompositeOperation = "source-over";

                ctx.fillStyle = water_stroke_style;
                ctx.fillRect(-w * 0.5, -h * 0.5 + h - wh, w, 2);

                ctx.fillStyle = container_fill_style;
                ctx.fill();

                ctx.lineCap = "butt";
                ctx.lineWidth = 8.0;
                ctx.strokeStyle = container_outer_stroke_style;
                ctx.stroke();

                ctx.lineWidth = 4.0;
                ctx.strokeStyle = container_inner_stroke_style;
                ctx.stroke();

                ctx.lineWidth = 2.0;
                ctx.strokeStyle = container_top_stroke_style;
                ctx.beginPath();
                ctx.lineTo(-w * 0.5 - 4, -h * 0.5);
                ctx.lineTo(w * 0.5 + 4, -h * 0.5);
                ctx.stroke();

                ctx.fillStyle = "#666";
                ctx.strokeStyle = "#444";

                if (weight_h > 4) {
                    ctx.beginPath();
                    ctx.rect(-w * 0.5 + 3, -h * 0.5 + h - wh - weight_h + 1, w - 6, weight_h - 2);
                    ctx.fill();
                    ctx.stroke();
                } else {
                    ctx.beginPath();
                    ctx.fillStyle = ctx.strokeStyle;
                    ctx.rect(-w * 0.5 + 2, -h * 0.5 + h - wh - weight_h, w - 4, weight_h);
                    ctx.fill();
                    // ctx.stroke();
                }

                let kk = arg0;

                if (weight_h < 2)
                    ctx.lineWidth = weight_h;

                if (weight_h > 0) {

                    ctx.beginPath();
                    ctx.rect(-w * 0.05 * kk, -h * 0.5 + h - wh - weight_h - w * 0.1 * kk, w * 0.1 * kk, w * 0.1 * kk + 1);
                    ctx.fill();
                    ctx.stroke();

                    ctx.beginPath();
                    ctx.ellipse(0, -h * 0.5 + h - wh - weight_h - w * 0.15 * kk, w * 0.1 * kk, w * 0.1 * kk, 0, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.stroke();

                    ctx.save();


                    ctx.fillStyle = "#333";
                    ctx.font = "500 " + w * 0.21 + "px IBM Plex Sans";
                    ctx.translate(0, -h * 0.5 + h - wh - weight_h * 0.5);
                    ctx.scale(kk, kk);

                    ctx.fillStyle = "#333";
                    ctx.fillText("WEIGHT", 0, + w * 0.07)

                    ctx.restore();
                }


                bottom_rounded_rect(-w * 0.5, -h * 0.5, w, h, r);

                ctx.translate(Math.round(width * 0.45), -Math.round(width * 0.15));

                draw_pressure_gauge(width * 0.3, 0.5 + arg0 * 4.0, [-width * 0.325, + width * 0.45]);

            } else if (mode === "L") {

                ctx.translate(Math.round(width * 0.5), Math.round(height * 0.5));

                let w = width * 0.4;
                let h = width * 0.4;
                let r = width * 0.03;
                let wh = h * lerp(0.1, 0.9, arg0);


                let y = h * 0.3;
                let p = lerp(0.1, 0.9, arg0) - 0.2;

                ctx.beginPath();

                ctx.lineTo(0, -h * 0.5);
                ctx.arcTo(0, 0, w * 0.5, 0, r);
                ctx.arcTo(w * 0.5, 0, w * 0.5, h * 0.5, r);
                ctx.arcTo(w * 0.5, h * 0.5, 0, h * 0.5, r);
                ctx.arcTo(-w * 0.5, h * 0.5, -w * 0.5, 0, r);
                ctx.lineTo(-w * 0.5, -h * 0.5);
                // ctx.closePath();;


                ctx.fillStyle = water_fill_style;

                ctx.fill();

                ctx.fillStyle = water_stroke_style;
                ctx.fillRect(-w * 0.5, -h * 0.5 + h - wh, w, 2);

                ctx.globalCompositeOperation = "destination-out";

                ctx.fillRect(-w * 0.5, -h * 0.5, w, h - wh);



                ctx.globalCompositeOperation = "destination-in";
                ctx.fill();
                ctx.globalCompositeOperation = "source-over";


                ctx.fillStyle = container_fill_style;
                ctx.fill();

                ctx.lineCap = "butt";
                ctx.lineWidth = 8.0;
                ctx.strokeStyle = container_outer_stroke_style;
                ctx.stroke();

                ctx.lineWidth = 4.0;
                ctx.strokeStyle = container_inner_stroke_style;
                ctx.stroke();

                ctx.lineWidth = 2.0;
                ctx.strokeStyle = container_top_stroke_style;
                ctx.beginPath();
                ctx.lineTo(-w * 0.5 - 4, -h * 0.5);
                ctx.lineTo(+ 4, -h * 0.5);
                ctx.stroke();

                ctx.fillStyle = "#72B929";
                ctx.strokeStyle = "#588F1F";

                ctx.fillRect(w * 0.25 - 8, -4 - 8, 16, 8);
                ctx.strokeRect(w * 0.25 - 8, -4 - 8, 16, 8);

                ctx.fillRect(w * 0.25 - 4, -4, 8, 10);
                ctx.strokeRect(w * 0.25 - 4, -4, 8, 10);

                ctx.translate(Math.round(-width * 0.35), -Math.round(width * 0.15));
                draw_pressure_gauge(width * 0.24, Math.max(0, p) * 4, [width * 0.15, y + width * 0.15]);

                ctx.translate(Math.round(width * 0.7), 0);
                draw_pressure_gauge(width * 0.24, Math.max(0, p) * 4, [-width * 0.15, y + width * 0.15]);

            } else if (mode === "barrel") {

                ctx.translate(Math.round(width * 0.5), Math.round(height * 0.5));


                let s = width;
                let w = width * 0.2;
                let h = width * 0.6;
                let r = width * 0.01;

                let p = lerp(0.05, 0.95, arg0);
                let a = (p - 0.05) * 5;
                let wh = h * p;

                ctx.save();
                ctx.translate(Math.round(-w * 0.6), 0);

                bottom_rounded_rect(-w * 0.5, -h * 0.5, w, h, r);
                ctx.fillStyle = water_fill_style;
                ctx.fill();
                ctx.globalCompositeOperation = "destination-out";
                ctx.lineWidth = 4.0;
                ctx.stroke();
                ctx.fillRect(-w * 0.5, -h * 0.5, w, h - wh);

                ctx.globalCompositeOperation = "source-over";

                ctx.fillStyle = water_stroke_style;
                ctx.fillRect(-w * 0.5, -h * 0.5 + h - wh, w, 2);

                ctx.fillStyle = container_fill_style;
                ctx.fill();

                ctx.lineCap = "butt";
                ctx.lineWidth = 8.0;
                ctx.strokeStyle = container_outer_stroke_style;
                ctx.stroke();

                ctx.lineWidth = 4.0;
                ctx.strokeStyle = container_inner_stroke_style;
                ctx.stroke();

                ctx.lineWidth = 2.0;
                ctx.strokeStyle = container_top_stroke_style;
                ctx.beginPath();
                ctx.lineTo(-w * 0.5 - 4, -h * 0.5);
                ctx.lineTo(w * 0.5 + 4, -h * 0.5);
                ctx.stroke();

                ctx.translate(Math.round(-width * 0.25), 0);
                draw_pressure_gauge(width * 0.24, a, [w * 0.75, h * 0.45]);

                ctx.restore();

                ctx.translate(Math.round(w * 0.6), 0);

                ctx.beginPath();
                ctx.moveTo(6, -0.5 * h);
                ctx.lineTo(6, 0.3 * h);
                // ctx.lineTo(w*0.5,  0.4*h);
                ctx.arcTo(w * 0.5, h * 0.3, w * 0.5, h * 0.5, r);
                ctx.arcTo(w * 0.5, h * 0.5, 0, h * 0.5, r);
                ctx.arcTo(-w * 0.5, h * 0.5, -0.5 * w, h * 0.3, r);
                ctx.arcTo(-w * 0.5, h * 0.3, -w * 0.1, h * 0.3, r);
                // ctx.lineTo(-w*0.5, 0.4*h);
                ctx.lineTo(-6, 0.3 * h);
                ctx.lineTo(-6, -0.5 * h);
                // ctx.closePath();

                ctx.fillStyle = water_fill_style;
                ctx.fill();
                ctx.globalCompositeOperation = "destination-out";
                ctx.lineWidth = 4.0;
                ctx.stroke();
                ctx.fillRect(-w * 0.5, -h * 0.5, w, h - wh);


                ctx.globalCompositeOperation = "source-over";

                let ww = wh > h * 0.2 ? 5 : w;
                ctx.fillStyle = water_stroke_style;
                ctx.fillRect(-ww * 0.5, -h * 0.5 + h - wh, ww, 2);

                ctx.fillStyle = container_fill_style;
                ctx.fill();


                ctx.lineCap = "butt";
                ctx.lineWidth = 8.0;
                ctx.strokeStyle = container_outer_stroke_style;
                ctx.stroke();

                ctx.lineWidth = 4.0;
                ctx.strokeStyle = container_inner_stroke_style;
                ctx.stroke();

                ctx.lineWidth = 2.0;
                ctx.strokeStyle = container_top_stroke_style;
                ctx.beginPath();
                ctx.lineTo(-10, -h * 0.5);
                ctx.lineTo(+10, -h * 0.5);
                ctx.stroke();



                ctx.translate(Math.round(width * 0.25), 0);
                draw_pressure_gauge(width * 0.24, a, [-w * 0.75, h * 0.45]);


            } else if (mode === "brick_scale" || mode === "brick_forces" || mode === "brick_wood" || mode === "brick_container") {
                t *= 7.0;

                let w = 1.0;
                let h = 0.4;
                cgy = h * 0.5;
                a = 0;
                off = lerp(h * 0.75, -h * 0.9, arg0);

                if (mode === "brick_container")
                    off = lerp(h * 0.75, -h * 0.9, arg0);

                let scale_off = off;

                let area = w * h;
                let rho = 1.5;


                let base_off = off;
                if (mode === "brick_wood") {
                    rho = 0.7;
                    off = Math.max(off, -0.2 * h);
                }

                let weight = area * rho;

                let poly = rect_poly(w, h, a, off, cgx, cgy);
                let submerged_poly = poly_y_clip(poly, 0);
                let b = poly_area(submerged_poly);

                let s = width * 0.3;
                let r = s * 0.45;


                if (mode !== "brick_container")
                    ctx.translate(Math.round(width / 2), Math.round(height * 0.7));
                else
                    ctx.translate(Math.round(width / 2), Math.round(height * 0.55));

                let scale_a = (weight - b) * 2 * Math.PI * 2.5 / (8 * area);


                ctx.lineWidth = 2;
                ctx.fillStyle = "#B73239";
                ctx.strokeStyle = "#802025";

                if (mode === "brick_wood") {


                    ctx.fillStyle = wood_fill_style;
                    ctx.strokeStyle = wood_stroke_style;
                }

                {
                    let x = -w * 0.5 * s;
                    let y = (-h * 0.5 - off) * s;
                    let r = 3;

                    ctx.beginPath();
                    ctx.moveTo(x + r, y);
                    if (mode !== "brick_wood") {
                        for (let i = 1; i < 10; i++)
                            ctx.lineTo(x + w * s * 0.1 * i, y + 0.5 * ((43758.5453123 * Math.sin(i * 3422.2)) % 1));
                    }

                    ctx.arcTo(x + w * s, y, x + w * s, y + h * s, r);

                    if (mode !== "brick_wood") {
                        for (let i = 1; i < 4; i++)
                            ctx.lineTo(x + w * s + 0.2 * ((4358.5453123 * Math.sin(i * 3422.2)) % 1), y + h * s * 0.1 * i);
                    }

                    ctx.arcTo(x + w * s, y + h * s, x, y + h * s, r);


                    if (mode !== "brick_wood") {
                        for (let i = 9; i > 0; i--)
                            ctx.lineTo(x + w * s * 0.1 * i, y + h * s + 0.5 * ((43758.5453123 * Math.sin(i * 3422.2)) % 1));
                    }
                    ctx.arcTo(x, y + h * s, x, y, r);

                    if (mode !== "brick_wood") {
                        for (let i = 4; i > 0; i--)
                            ctx.lineTo(x + 0.2 * ((43758.5453123 * Math.sin(i * 3422.2)) % 1), y + h * s * 0.1 * i);
                    }
                    ctx.arcTo(x, y, x + w * s, y, r);
                    ctx.closePath();
                }


                ctx.fill();
                ctx.stroke();


                if (mode !== "brick_container") {
                    ctx.save();

                    ctx.translate(0, -scale_off * s - 1.5 * s);


                    ctx.strokeStyle = "#333";
                    ctx.lineWidth = 8;
                    ctx.beginPath();
                    ctx.moveTo(0, r);
                    ctx.lineTo(0, 1.17 * r);
                    ctx.arc(0, 1.35 * r, 0.15 * r, -Math.PI * 0.45, Math.PI);
                    ctx.stroke();

                    ctx.strokeStyle = "#777";
                    ctx.lineWidth = 4;
                    ctx.stroke();
                    ctx.restore();
                }


                ctx.save();
                ctx.translate(0, (-h * 0.5 - off) * s);


                let rr = 3.0;
                ctx.lineWidth = rr * 2 + 2;
                ctx.lineCap = "round";


                ctx.beginPath();
                let delta = -base_off + off;

                if (mode === "brick_wood") {
                    ctx.lineTo(-w * s * 0.3, h * s + 2);

                    ctx.quadraticCurveTo(-w * s * 0.3 + delta * s, h * s,
                        delta * 0.6 * s, (-0.3 + delta * 0.65) * s
                    )

                    ctx.quadraticCurveTo(delta * 0.7 * s, (-0.67 + delta * 1.1) * s,
                        0, (-0.68 + delta) * s
                    )

                    ctx.moveTo(delta * 0.6 * s, (-0.3 + delta * 0.65) * s);

                    ctx.quadraticCurveTo(delta * 2.1 * s, (-0.3 + delta * 1.2) * s,
                        +w * s * 0.3, h * s + 2
                    )
                } else {
                    ctx.lineTo(-w * s * 0.3, h * s + 2);
                    ctx.lineTo(0, -0.3 * s);
                    ctx.lineTo(0, -0.68 * s);
                    if (mode === "brick_container")
                        ctx.lineTo(0, -height);

                    ctx.moveTo(0, -0.3 * s);
                    ctx.lineTo(+w * s * 0.3, h * s + 2);
                }

                ctx.strokeStyle = "#766F59";
                ctx.stroke();
                ctx.strokeStyle = "#C8BD99";
                ctx.lineWidth = rr * 2 - 2;
                ctx.stroke();



                ctx.lineCap = "butt";

                ctx.save();
                ctx.translate(0, -0.31 * s);
                ctx.beginPath();

                if (mode === "brick_wood") {
                    ctx.translate(delta * 0.6 * s, (delta * 0.65) * s);
                    ctx.rotate(-delta * 0.5);
                }

                ctx.lineTo(1.5 * rr, - rr);
                ctx.lineTo(-1.5 * rr, + 2 * rr);
                ctx.lineTo(0, + 1 * rr);
                ctx.lineTo(1.5 * rr, + 2 * rr);
                ctx.lineTo(-1.5 * rr, - rr);
                ctx.lineCap = "round";
                ctx.lineWidth = rr * 2 + 2;

                ctx.strokeStyle = "#766F59";
                ctx.stroke();
                ctx.strokeStyle = "#C8BD99";
                ctx.lineWidth = rr * 2 - 2;
                ctx.stroke();
                ctx.restore();


                ctx.restore();

                punch_water();
                // ctx.strokeRect(-w*0.5*s, (-h*0.5 - off)*s,w*s,h*s);

                ctx.fillStyle = arrow_fill_style;
                let arrow_size = s * 0.04;
                if (mode === "brick_scale" || mode === "brick_container") {
                    ctx.save();

                    ctx.fillStyle = buoy_fill_style;
                    ctx.strokeStyle = "#416275";

                    ctx.translate(0, (-off + 0.5 * h) * s);

                    for (let i = 0; i < 10; i++) {
                        draw_arrow([(i - 4.5) * w * s / 10, 0], 0, arrow_size * Math.max(0, -off + 0.5 * h));
                    }

                    for (let i = 0; i < 10; i++) {
                        draw_arrow([(i - 4.5) * w * s / 10, h * s], Math.PI, arrow_size * Math.max(0, -off - 0.5 * h));
                    }

                    for (let i = 0; i < 4; i++) {
                        let y = (i + 0.5) * h / 4;
                        draw_arrow([-w * s * 0.5, y * s], Math.PI * 0.5, arrow_size * Math.max(0, -off + 0.5 * h - y));
                        draw_arrow([w * s * 0.5, y * s], -Math.PI * 0.5, arrow_size * Math.max(0, -off + 0.5 * h - y));
                    }
                    ctx.restore();
                }

                if (mode !== "brick_container") {

                    ctx.save();

                    ctx.translate(0, -scale_off * s - 1.5 * s);


                    ctx.beginPath();
                    ctx.ellipse(0, 0, r, r, 0, 0, 2 * Math.PI);
                    ctx.fillStyle = "#fff";
                    ctx.fill();
                    ctx.lineWidth = 7.0;
                    ctx.strokeStyle = "#333";
                    ctx.stroke();

                    ctx.lineWidth = 3.0;
                    ctx.strokeStyle = "#555";
                    ctx.stroke();

                    ctx.lineWidth = 2.0;

                    // ctx.beginPath();
                    // ctx.ellipse(0,0,r*0.9,r*0.9,0,0,2*Math.PI);
                    // ctx.stroke();

                    ctx.save();
                    for (let i = 0; i < 50; i++) {
                        let big = i % 5 == 0;
                        ctx.beginPath();
                        ctx.lineTo(0, (big ? 0.92 : 0.97) * r - 5);
                        ctx.lineTo(0, r - 5);
                        ctx.stroke();
                        ctx.rotate(Math.PI * 2 / 50);
                    }

                    ctx.restore();
                    ctx.font = "500 " + s * 0.13 + "px IBM Plex Sans";

                    ctx.fillStyle = "#333";
                    for (let i = 0; i < 10; i++) {
                        let a = 2 * Math.PI * i / 10;
                        let ca = -Math.cos(a);
                        let sa = Math.sin(a);

                        ctx.fillText(i, sa * r * 0.65, ca * r * 0.65 + s * 0.032);
                    }

                    ctx.save();

                    ctx.font = "500 " + s * 0.06 + "px IBM Plex Sans";

                    ctx.fillText("WEIGHT", 0, r * 0.3);


                    ctx.rotate(scale_a);


                    ctx.lineWidth = 4;

                    ctx.fillStyle = "#EB1E1E";
                    ctx.strokeStyle = "#B72020";

                    ctx.strokeEllipse(0, 0, 0.07 * r);


                    ctx.beginPath();
                    ctx.lineTo(0.00 * r, -0.84 * r);
                    ctx.lineTo(-0.02 * r, 0);
                    ctx.lineTo(0, 0);
                    ctx.arc(0, 0.05 * r, 0.25 * r, 0.3 + Math.PI * 0.5, -0.3 + Math.PI * 0.5, true);
                    ctx.lineTo(0, 0);
                    ctx.lineTo(0.02 * r, 0);
                    ctx.closePath();
                    ctx.stroke();

                    ctx.lineWidth = 0.5;

                    ctx.strokeStyle = ctx.fillStyle;

                    ctx.fill();
                    ctx.stroke();

                    ctx.fillEllipse(0, 0, 0.07 * r);
                    ctx.strokeEllipse(0, 0, 0.07 * r);

                    ctx.fillStyle = "#333";
                    ctx.fillEllipse(0, 0, 0.04 * r);

                    ctx.restore();
                    ctx.restore();

                } else {
                    let w = width * 0.9;
                    let h = width * 0.6;
                    let r = width * 0.02;

                    let wh = h * 0.5
                    bottom_rounded_rect(-w * 0.5, h * 0.5 - wh, w, wh, r);

                    ctx.globalCompositeOperation = "destination-over";


                    ctx.fillStyle = water_stroke_style;
                    ctx.fillRect(-w * 0.5, -h * 0.5 + h - wh, w, 2);


                    ctx.fillStyle = water_fill_style;
                    ctx.fill();



                    bottom_rounded_rect(-w * 0.5, -h * 0.5, w, h, r);

                    ctx.fillStyle = container_fill_style;
                    ctx.fill();

                    ctx.globalCompositeOperation = "source-over";

                    ctx.lineCap = "butt";
                    ctx.lineWidth = 8.0;
                    ctx.strokeStyle = container_outer_stroke_style;
                    ctx.stroke();

                    ctx.lineWidth = 4.0;
                    ctx.strokeStyle = container_inner_stroke_style;
                    ctx.stroke();

                    ctx.lineWidth = 2.0;
                    ctx.strokeStyle = container_top_stroke_style;
                    ctx.beginPath();
                    ctx.lineTo(-w * 0.5 - 4, -h * 0.5);
                    ctx.lineTo(w * 0.5 + 4, -h * 0.5);
                    ctx.stroke();


                    ctx.save();


                    ctx.fillStyle = buoy_fill_style;
                    ctx.strokeStyle = "#416275";


                    for (let i = 1; i < 18; i++) {
                        draw_arrow([(i - 9) * w / 20, -h * 0.5 + 4], Math.PI, arrow_size * Math.max(0, + 0.5 * h) / s);
                    }

                    for (let i = 1; i < 8; i++) {
                        let y = (i + 0.5) * h * 0.5 / 8;
                        draw_arrow([-w * 0.5 + 4, y - h * 0.5], -Math.PI * 0.5, arrow_size * Math.max(0, + 0.5 * h - y) / s);
                        draw_arrow([w * 0.5 - 4, y - h * 0.5], Math.PI * 0.5, arrow_size * Math.max(0, + 0.5 * h - y) / s);
                    }
                    ctx.restore();

                    ctx.feather(canvas.width, canvas.height, 0, 0, canvas.height * 0.05, 0);
                }

                let al = s * 0.4;

                if (mode === "brick_forces" || mode === "brick_wood") {

                    if (mode === "brick_wood")
                        al *= 2;

                    ctx.lineWidth = 1.5;
                    ctx.fillStyle = weight_fill_style;
                    ctx.strokeStyle = weight_stroke_style;

                    ctx.arrow(-0.02 * s, -off * s, -0.02 * s, -off * s + al * rho, 0.045 * s, 0.13 * s, 0.18 * s);
                    ctx.fill();
                    ctx.stroke();

                    let y0 = Math.max(0, (-off + 0.5 * h));
                    let y1 = Math.max(0, -off - 0.5 * h);

                    let y = lerp(y0, y1, 0.5);

                    let ah = (y1 - y0) * al / h;

                    let scale = Math.min(1, -ah / (s * 0.18));
                    ctx.fillStyle = buoy_fill_style;
                    ctx.strokeStyle = buoy_stroke_style;

                    ctx.arrow(0.02 * s, y * s, 0.02 * s, y * s + ah, 0.045 * s * scale, 0.13 * s * scale, 0.18 * s * scale);
                    ctx.fill();
                    ctx.stroke();
                }


            } else if (mode === "wood_sub" || mode === "tub_sub") {

                dt *= 7.0;

                let w = 1.0;
                let h = 0.4;
                cgy = h * 0.5;
                let rho = 0.7;
                if (mode === "tub_sub") {
                    h = 0.5;
                    cgy = h * 0.3;
                    rho = 0.3;
                }

                a = 0;

                let area = w * h;

                let weight = area * rho;

                let poly = rect_poly(w, h, a, off, cgx, cgy);
                let submerged_poly = poly_y_clip(poly, 0);
                let b = poly_area(submerged_poly);

                let f = -weight + b - v * (b != 0 ? 0.4 : 0.0);

                let draw_off = off;

                v += dt * f;
                off += dt * v;

                if (Math.abs(f) < 1e-8 && Math.abs(v) < 1e-8)
                    this.set_paused(true);

                let held = mode === "wood_sub" ? active_sliders_held[0] : active_sliders_held[1];
                let slider = mode === "wood_sub" ? active_objects[0][1] : active_objects[1][1];

                if (held) {
                    let f = mode === "tub_sub" ? (-(arg0 - 0.3) * 0.3) : (-(arg0 - 0.3) * 0.6);
                    draw_off = off = f;
                    v = 0;
                } else {
                    let val = -draw_off / (mode === "tub_sub" ? 0.3 : 0.6) + 0.3;
                    slider.set_value(val);
                    arg0 = val;
                }

                let s = width * 0.5;



                ctx.translate(Math.round(width / 2), Math.round(height / 2));


                ctx.beginPath();
                poly.forEach(a => { ctx.lineTo(a[0] * s, -a[1] * s); });
                ctx.closePath();




                ctx.fillStyle = "#D8A972";
                // ctx.fill();

                ctx.lineWidth = 2;
                ctx.strokeStyle = "#8F704B";
                // ctx.stroke();

                {
                    ctx.save();
                    ctx.translate(0, (-draw_off) * s);

                    ctx.translate(0, cgy * s);

                    if (mode === "wood_sub") {
                        ctx.roundRect(-w * s / 2, -h * s, w * s, h * s, 6);
                        ctx.fill();
                    }
                    else {
                        bottom_rounded_rect(-w * s / 2, -h * s, w * s, h * s, w * 0.13 * s);
                        ctx.closePath();
                        ctx.strokeStyle = "#777";
                        ctx.fillStyle = "#B2B2B2";
                        ctx.lineWidth = 2;
                        ctx.fill();
                        ctx.stroke();
                    }

                    ctx.stroke();
                    ctx.restore();
                }

                let al = s * 1.5;

                punch_water();

                let sh = 1;
                if (mode === "wood_sub") {
                    al = s * 0.8;
                } else {
                    sh = 0;
                }



                ctx.lineWidth = 1.5;
                ctx.fillStyle = weight_fill_style;
                ctx.strokeStyle = weight_stroke_style;

                ctx.arrow(-0.015 * s * sh, -off * s, -0.015 * s * sh, -off * s + al * rho, 0.035 * s, 0.10 * s, 0.14 * s);
                ctx.fill();
                ctx.stroke();

                let y0 = Math.max(0, (-off + cgy));
                let y1 = Math.max(0, -off - h + cgy);

                let y = lerp(y0, y1, 0.5);

                let ah = (y1 - y0) * al / h;

                let scale = Math.min(1, -ah / (s * 0.18));
                ctx.fillStyle = buoy_fill_style;
                ctx.strokeStyle = buoy_stroke_style;

                ctx.arrow(0.015 * s * sh, y * s, 0.015 * s * sh, y * s + ah, 0.035 * s * scale, 0.1 * s * scale, 0.14 * s * scale);
                ctx.fill();
                ctx.stroke();

            } else if (mode === "wood_tilt" || mode === "wood_tilt_f") {

                dt *= 7.0;

                let w = 1.0;
                let h = 0.4;
                cgy = h * 0.5;
                let rho = 0.7;

                let area = w * h;
                let weight = area * rho;

                let poly = rect_poly(w, h, a, off, cgx, cgy);
                let submerged_poly = poly_y_clip(poly, 0);
                let b = poly_area(submerged_poly);

                let p = poly_center(submerged_poly);

                let f = -weight + b - v * (b != 0 ? 0.4 : 0.0);

                let draw_off = off;
                let draw_a = a;

                v += dt * f;
                off += dt * v;

                let m = -p[0] * b;
                let omegadot = m * 2.0 - omega * omegadot_omega_factor;

                omega += dt * omegadot;
                a += dt * omega;


                if (Math.abs(f) < 1e-6 && Math.abs(v) < 1e-6 &&
                    Math.abs(m) < 1e-6 && Math.abs(omegadot) < 1e-6)
                    this.set_paused(true);

                let ii = mode === "wood_tilt" ? 2 : 3;

                let held = active_sliders_held[ii];
                let slider = active_objects[ii][1];

                if (held) {
                    let f = (arg0 - 0.5) * Math.PI * 0.3;
                    draw_a = a = f;
                    omega = 0;
                } else {
                    let val = draw_a / (Math.PI * 0.3) + 0.5;
                    slider.set_value(val);
                    arg0 = val;
                }

                let s = width * 0.5;

                ctx.translate(Math.round(width / 2), Math.round(height / 2));

                ctx.fillStyle = "#D8A972";

                ctx.lineWidth = 2;
                ctx.strokeStyle = "#8F704B";

                {
                    ctx.save();
                    ctx.translate(0, (-draw_off) * s);
                    ctx.rotate(draw_a);

                    ctx.translate(0, cgy * s);

                    ctx.roundRect(-w * s / 2, -h * s, w * s, h * s, 6);
                    ctx.fill();

                    ctx.stroke();

                    ctx.fillStyle = arrow_fill_style;
                    let arrow_size = s * 0.07;

                    if (mode === "wood_tilt") {
                        ctx.save();

                        ctx.fillStyle = buoy_fill_style;
                        ctx.strokeStyle = "#416275";


                        let ca = Math.cos(a);
                        let sa = Math.sin(a);

                        for (let i = 0; i < 10; i++) {
                            let x = (i - 4.5) * w / 10;
                            let as = arrow_size * Math.max(0, -off + 0.5 * h * ca + sa * x);
                            draw_arrow([x * s, 0], 0, as);
                        }

                        for (let i = 0; i < 10; i++) {
                            let x = (i - 4.5) * w / 10;

                            draw_arrow([x * s, h * s], Math.PI, arrow_size * Math.max(0, -off - 0.5 * h * ca + sa * x));
                        }

                        for (let i = 0; i < 4; i++) {
                            let y = (i + 0.5) * h / 4;
                            draw_arrow([-w * s * 0.5, y * s], Math.PI * 0.5, arrow_size * Math.max(0, -off + 0.5 * h - y - w * 0.5 * sa));
                            draw_arrow([w * s * 0.5, y * s], -Math.PI * 0.5, arrow_size * Math.max(0, -off + 0.5 * h - y + w * 0.5 * sa));
                        }
                        ctx.restore();
                    }

                    ctx.restore();
                }

                let al = s * 0.8;

                punch_water();



                if (mode === "wood_tilt_f") {

                    ctx.lineWidth = 1.5;
                    ctx.fillStyle = weight_fill_style;
                    ctx.strokeStyle = weight_stroke_style;

                    ctx.arrow(0, -off * s, 0, -off * s + al * rho, 0.035 * s, 0.10 * s, 0.14 * s);
                    ctx.fill();
                    ctx.stroke();

                    let y0 = Math.max(0, (-off + cgy));
                    let y1 = Math.max(0, -off - h + cgy);

                    let y = lerp(y0, y1, 0.5);

                    let ah = (y1 - y0) * al / h;

                    let scale = Math.min(1, -ah / (s * 0.18));
                    ctx.fillStyle = buoy_fill_style;
                    ctx.strokeStyle = buoy_stroke_style;

                    ctx.arrow(p[0] * s, -p[1] * s, p[0] * s, -p[1] * s + ah, 0.035 * s * scale, 0.10 * s * scale, 0.14 * s * scale);
                    ctx.fill();
                    ctx.stroke();

                    ctx.fillEllipse(p[0] * s, -p[1] * s, 0.03 * s * scale);
                    ctx.strokeEllipse(p[0] * s, -p[1] * s, 0.03 * s * scale);
                }

            }

            else if (mode === "canister") {
                // fix

                dt *= 6.0;

                let w = 1.0;
                let h = 0.6;
                cgy = h * 0.5;
                a = 0;

                let thin = lerp(0, 0.97, Math.pow(arg0, 1 / 5));
                let area = w * h;
                let weight = area * (1 - thin * thin) * 8;

                let s = width * 0.4;

                let bottom = -1;

                let poly = rect_poly(w, h, a, off, cgx, cgy);
                let submerged_poly = poly_y_clip(poly, 0);
                let b = poly_area(submerged_poly);

                let f = -weight + b - v * (b != 0 ? 0.4 : 0.0);

                let draw_off = off;

                v += dt * f;
                off += dt * v;

                if (off - cgy < bottom) {
                    off = bottom + cgy;
                    v = 0;
                }

                ctx.translate(Math.round(width / 2), Math.round(height / 2));



                ctx.beginPath();
                poly.forEach(a => { ctx.lineTo(a[0] * s, -a[1] * s); });
                ctx.closePath();
                ctx.strokeStyle = "rgba(0,0,0,0.5)";
                ctx.stroke();

                ctx.save();
                ctx.translate(0, (-draw_off) * s);
                ctx.translate(0, cgy * s);
                ctx.fillRect(-w * 0.5 * s, -h * s, w * s, h * s);
                ctx.restore();

                punch_water();

                ctx.fillStyle = "rgba(255, 0.0, 0.0, 0.5)";
                ctx.fillEllipse(0, -(draw_off) * s, 3);

                // ctx

            } else if (mode === "wind_tilt") {


                dt *= 7.0;


                let area = 0.24;

                let w = lerp(1.0, 0.3, arg1);
                let h = area / w;

                let cgx = 0.0;
                let cgy = 0.4 * h;


                let weight = 0.12;


                let poly = ship_poly(w, h, a, off, cgx, cgy);
                let submerged_poly = poly_y_clip(poly, 0);

                let b = poly_area(submerged_poly);
                let p = poly_center(submerged_poly);

                let f = -weight + b - v * 0.4;
                let base_a = a;

                v += dt * f;
                off += dt * v;

                let m = -p[0] * b + (arg0 - 0.5) * 0.01;
                let omegadot = m;

                omega += dt * omegadot;
                a += dt * omega;
                omega *= 0.99;

                if (Math.abs(f) < 1e-6 && Math.abs(v) < 1e-6 &&
                    Math.abs(m) < 1e-6 && Math.abs(omegadot) < 1e-6 && Math.abs(arg0 - 0.5) < 0.01)
                    this.set_paused(true);



                let s = width * 0.7;

                ctx.translate(Math.round(width / 2), Math.round(height / 2));

                adjust_wind("na_wind_tilt_wind", arg0 - 0.5);

                ctx.save();
                ctx.translate(cgx * s, 0);



                {

                    ctx.save();
                    ctx.translate(0, (-off) * s);

                    ctx.rotate(base_a)
                    ctx.translate(0, cgy * s);


                    draw_front_ship(w * s, h * s, Math.min(w, h) * s * 0.2, h * s * 0.45);
                    ctx.restore();
                }

                punch_water();

                ctx.restore();

            } else if (mode === "wave" || mode === "hero") {

                dt *= 5.0;

                let w = 1.0;
                let h = 0.6;

                let cgx = 0.0;
                let cgy = 0.4 * h;

                let s = width * 0.4;

                let weight = w * h * 0.4;

                let wd = Math.ceil(2.3 * s) / s;
                let wh = 0.15 * arg0;
                let ww = 0.1;
                let wv = Math.sqrt(wd) * 0.07;

                sim0 += dt * wv;
                sim0 = sim0 % wd;
                let wx = (sim0) - wd * 0.5;

                // wx = 0;
                let wave = wave_poly(wx, ww, wh, 7);
                let poly = ship_poly(w, h, a, off, cgx, cgy);
                let submerged_poly = poly_y_clip(poly, 0);

                let base_a = a;
                let base_off = off;


                // this is suuuuper lazy

                let ca = Math.cos(base_a);
                let sa = Math.sin(base_a);
                wave = wave.map(a => [a[0], a[1] - base_off]);
                wave = wave.map(a => [a[0] * ca - a[1] * sa, +a[0] * sa + a[1] * ca]);
                wave = wave.map(a => [a[1], -a[0]]);
                wave = wave.map(a => [a[0], a[1] - w * 0.5]);
                wave = poly_y_clip(wave, 0);
                wave = wave.map(a => [a[0], a[1] + w]);
                wave = poly_y_clip(wave, 1);

                wave = wave.map(a => [a[0], a[1] - w * 0.5]);
                wave = wave.map(a => [-a[1], a[0]]);

                wave = wave.map(a => [a[0], a[1] - h + cgy]);

                wave = poly_y_clip(wave, 0);
                wave = wave.map(a => [a[0], a[1] + h]);
                wave = poly_y_clip(wave, 1);
                wave = wave.map(a => [a[0], a[1] - cgy]);
                wave = wave.map(a => [a[0] * ca + a[1] * sa, -a[0] * sa + a[1] * ca]);
                wave = wave.map(a => [a[0], a[1] + base_off]);


                let b0 = poly_area(submerged_poly);
                let p0 = poly_center(submerged_poly);

                let b1 = poly_area(wave);
                let p1 = poly_center(wave);

                let b = b0 + b1;
                let p = [(p0[0] * b0 + p1[0] * b1) / (b0 + b1), (p0[1] * b0 + p1[1] * b1) / (b0 + b1)];

                // off = arg0 - 0.5;
                let f = -weight + b - v * 0.4;


                v += dt * f;
                off += dt * v;


                // let m = -p[0]*b - omega * Math.abs(omega) * 1.0 + (arg0 - 0.5)*0.01;
                let m = -p[0] * b;
                let omegadot = m * 0.7;

                if (isNaN(m)) {
                    let a = 0;
                }

                omega += dt * omegadot;
                a += dt * omega;
                omega *= 0.99;

                if (Math.abs(f) < 1e-6 && Math.abs(v) < 1e-6 &&
                    Math.abs(m) < 1e-6 && Math.abs(omegadot) < 1e-6 && wh == 0)
                    this.set_paused(true);


                ctx.translate(Math.round(width / 2), Math.round(height / 2));


                ctx.save();
                ctx.translate(cgx * s, 0);

                {

                    ctx.save();
                    ctx.translate(0, (-base_off) * s);

                    ctx.rotate(base_a)
                    ctx.translate(0, cgy * s);


                    draw_front_ship(w * s, h * s, w * 0.15 * s, h * s * 0.5, true);
                    ctx.restore();
                }



                wave = wave_poly(wx, ww, wh, 30);

                ctx.save();
                ctx.globalCompositeOperation = "destination-out";
                ctx.fillStyle = "rgba(0,0,0,0.25)";

                ctx.beginPath();
                wave.forEach(a => { ctx.lineTo(a[0] * s, -a[1] * s); });
                ctx.lineTo((wave[wave.length - 1][0] + w * 2) * s, 0);
                ctx.lineTo((wave[wave.length - 1][0] + w * 2) * s, h * s);
                ctx.lineTo((wave[0][0] - w * 2) * s, h * s);
                ctx.lineTo((wave[0][0] - w * 2) * s, 0);
                ctx.closePath();
                ctx.fill();
                ctx.restore();




                if (mode === "wave") {

                    let al = s * 4;
                    ctx.lineWidth = 1.5;
                    ctx.fillStyle = weight_fill_style;
                    ctx.strokeStyle = weight_stroke_style;

                    ctx.arrow(0, -off * s, 0, -off * s + weight * al, 0.045 * s, 0.13 * s, 0.18 * s);
                    ctx.fill();
                    ctx.stroke();


                    ctx.fillStyle = buoy_fill_style;
                    ctx.strokeStyle = buoy_stroke_style;
                    ctx.arrow(p[0] * s, -p[1] * s, p[0] * s, -p[1] * s - b * al, 0.045 * s, 0.13 * s, 0.18 * s);
                    ctx.fill();
                    ctx.stroke();

                    ctx.fillEllipse(p[0] * s, -p[1] * s, 0.017 * s * scale);
                    ctx.strokeEllipse(p[0] * s, -p[1] * s, 0.017 * s * scale);

                }

                ctx.restore();

                let el = document.getElementById(mode === "hero" ? "na_hero_wave" : "na_wave_wave");

                {
                    let bg_x = canvas.getBoundingClientRect().left + wx * s + (width - wd * s) * 0.5;
                    let w = wd * s;
                    let h = Math.ceil(wh * s * 2);

                    el.style.backgroundSize = w + "px " + h + "px"
                    el.style.height = h + "px";
                    el.style.backgroundRepeat = "repeat-x";
                    el.style.backgroundPosition = Math.ceil(bg_x) + "px " + 0 + "px";
                }

            } else if (mode === "loading") {

                dt *= 7.0;

                let s = width * 0.4;

                let w = 1.0;
                let h = 0.75;

                let nr = 4;
                let nc = 14;

                let shift = lerp(0.1, 0.4, arg1);

                let total = Math.round(arg0 * nr * nc / 2) * 2;

                let rows = Math.ceil(total / nc);
                let cols = total - (rows - 1) * nc;

                let side_pad = 5;
                let platform_pad = 10;

                let boxw = (w * s - 2 * side_pad) / nc;
                let boxh = boxw * 1.1;


                let base_weight = 0.2;
                let base_cgy = 0.4 * h;
                let cargo_weight = arg0 * 0.3;
                let cargo_cgy = shift + arg0 * 0.17;
                let cargo_cgx = 0;


                let weight = base_weight + cargo_weight;


                let cgy = (base_weight * base_cgy + cargo_weight * cargo_cgy) / weight;
                let cgx = (cargo_weight * cargo_cgx) / weight;


                let poly = ship_poly(w, h, a, off, cgx, cgy);
                let submerged_poly = poly_y_clip(poly, 0);

                let b = poly_area(submerged_poly);
                let p = poly_center(submerged_poly);

                {

                    let f = -weight + b - v * 0.7;

                    v += dt * f;
                    off += dt * v;

                    // let m = -p[0]*b - omega * Math.abs(omega) * 1.0 + (arg0 - 0.5)*0.01;
                    let m = -p[0] * b + (Math.random() - 0.5) * 0.003 * disturbance_ttl;
                    let omegadot = m - omega * omegadot_omega_factor;

                    omega += dt * omegadot;
                    a += dt * omega;

                    disturbance_ttl *= 0.99;

                    if (Math.abs(f) < 1e-6 && Math.abs(v) < 1e-6 &&
                        Math.abs(m) < 1e-6 && Math.abs(omegadot) < 1e-6) {
                        this.set_paused(true);
                    }

                }


                ctx.translate(Math.round(width / 2), Math.round(height / 2));


                ctx.strokeStyle = "rgba(0,0,0,0.5)";
                ctx.lineWidth = 2.0;

                ctx.save();
                ctx.translate(cgx * s, 0);

                {

                    ctx.save();
                    ctx.translate(0, (-off) * s);

                    ctx.rotate(a)
                    ctx.translate(-cgx * s, cgy * s);


                    bottom_rounded_rect(-w * s / 2, -h * s, w * s, h * s, w * s * 0.1);
                    ctx.lineCap = "butt";
                    ctx.lineWidth = 2;

                    ctx.strokeStyle = "#741818";
                    ctx.fillStyle = "#C5432E";
                    ctx.fill();
                    ctx.stroke();

                    ctx.beginPath();
                    ctx.rect(-w * s / 2, -h * s, w * s, h * s * 0.45);
                    ctx.fillStyle = "#333";
                    ctx.strokeStyle = "#222";
                    ctx.fill();
                    ctx.stroke();

                    let ww = 4;

                    bottom_rounded_rect(-w * s / 2 + ww, -h * s, w * s - 2 * ww, h * s - ww, w * s * 0.1 - ww);
                    ctx.fillStyle = "#555";
                    ctx.strokeStyle = "#333";
                    ctx.fill();
                    ctx.stroke();



                    ctx.lineJoin = "miter";
                    ctx.lineWidth = 2;


                    ctx.fillStyle = "#999";
                    ctx.fillRect(-w * 0.5 * s + side_pad, -h * s, w * s - side_pad * 2, (h - shift) * s);

                    ctx.strokeStyle = "#555";

                    for (let col = 1; col < nc; col++) {

                        ctx.beginPath();
                        ctx.lineTo(side_pad + col * boxw - w * 0.5 * s, - shift * s);
                        ctx.lineTo(side_pad + col * boxw - w * 0.5 * s, - boxh * nr - shift * s - 1);

                        // ctx.lineTo(side_pad + col * boxw - w * 0.5 * s, - h * s);
                        ctx.stroke();
                    }

                    for (let row = 1; row <= nr; row++) {

                        ctx.beginPath();
                        ctx.lineTo(side_pad - w * 0.5 * s, - shift * s - row * boxh - 1);
                        ctx.lineTo(-side_pad + w * 0.5 * s, - shift * s - row * boxh - 1);
                        ctx.stroke();
                    }

                    ctx.lineWidth = boxw * 0.5;
                    ctx.strokeStyle = "#999";
                    for (let col = 0; col < nc; col++) {

                        ctx.beginPath();
                        ctx.lineTo(side_pad + (col + 0.5) * boxw - w * 0.5 * s, - shift * s - 4);
                        ctx.lineTo(side_pad + (col + 0.5) * boxw - w * 0.5 * s, - boxh * nr - shift * s - 4);

                        // ctx.lineTo(side_pad + col * boxw - w * 0.5 * s, - h * s);
                        ctx.stroke();
                    }

                    ctx.lineWidth = 2;

                    ctx.strokeStyle = "#222";
                    ctx.fillStyle = "#444"

                    ctx.beginPath();
                    ctx.rect(-w * s / 4 - 4, - shift * s, 8, shift * s - 4);
                    ctx.fill();
                    ctx.stroke();

                    ctx.beginPath();
                    ctx.rect(- 4, - shift * s, 8, shift * s - 4);
                    ctx.fill();
                    ctx.stroke();

                    ctx.beginPath();
                    ctx.rect(w * s / 4 - 4, - shift * s, 8, shift * s - 4);
                    ctx.fill();
                    ctx.stroke();


                    ctx.beginPath();
                    ctx.rect(side_pad - w * s * 0.5, - shift * s, w * s - side_pad * 2, 4);
                    ctx.fill();
                    ctx.stroke();

                    ctx.beginPath();
                    ctx.rect(- w * s * 0.5, -h * s, w * s, 4);
                    ctx.fill();
                    ctx.stroke();

                    ctx.lineWidth = 1.;

                    for (let row = 0; row < rows; row++) {

                        let n = row == rows - 1 ? cols : nc;
                        let p = Math.ceil((nc - n) / 2);
                        // let space = (nc - n)*0.5 * boxw + side_pad;

                        for (let col = p; col < n + p; col++) {

                            let h = (Math.sin((col + row * nc) * 342.875345) * 43758.5453123) % 1;
                            let b = (Math.sin((col + row * nc) * 654.86345) * 63378.9812) % 20;
                            // b = 20;
                            // h = 1-Math.cos(h*Math.PI*0.5);
                            h = h * h * h;
                            h = Math.round(h * 360);
                            // h = 0.;
                            ctx.fillStyle = "hsl(" + h + ", 40%, " + (b + 40) + "%)";
                            ctx.strokeStyle = "hsl(" + h + ", 45%, " + (b + 20) + "%)";

                            ctx.beginPath();
                            ctx.rect(side_pad + col * boxw - w * 0.5 * s + 0.5, -row * boxh - boxh - shift * s, boxw - 1, boxh - 1);
                            ctx.fill();
                            ctx.stroke();
                        }
                    }
                    ctx.restore();
                }

                ctx.restore();

            } else if (mode === "cgx" || mode === "slide") {

                dt *= 7.0;

                let s = width * 0.4;

                let w = 1.0;
                let h = 0.75;

                let base_weight = 0.2;
                let base_cgy = 0.4 * h;
                let cargo_weight = 0.2;
                let cargo_cgy = h * 0.3;
                let cargo_cgx = sim0;

                if (mode === "cgx")
                    cargo_cgx = (arg0 - 0.5) * 0.5 * w;

                let weight = base_weight + cargo_weight;

                let cgy = (base_weight * base_cgy + cargo_weight * cargo_cgy) / weight;
                let cgx = (cargo_weight * cargo_cgx) / weight;


                let poly = ship_poly(w, h, a, off, cgx, cgy);
                let submerged_poly = poly_y_clip(poly, 0);

                let b = poly_area(submerged_poly);
                let p = poly_center(submerged_poly);

                let base_off = off;
                let base_a = a;
                {

                    let f = -weight + b - v * 0.7;

                    v += dt * f;
                    off += dt * v;

                    // let m = -p[0]*b - omega * Math.abs(omega) * 1.0 + (arg0 - 0.5)*0.01;
                    let m = -p[0] * b + (arg0 - 0.5) * 0.01;
                    if (m === "cgx")
                        m = -p[0] * b + (Math.random() - 0.5) * 0.003 * disturbance_ttl;

                    let omegadot = m - omega * omegadot_omega_factor;

                    omega += dt * omegadot;
                    a += dt * omega;

                    disturbance_ttl *= 0.99;

                    let fx = 0.0;

                    if (Math.abs(a) > 0.04)
                        fx = 0.1 * Math.sin(a - (a > 0 ? 0.04 : -0.04));

                    sim1 += dt * fx;
                    sim0 += dt * sim1;

                    let thr = 0.4 * w - 6 / s;
                    if (Math.abs(sim0) > thr) {
                        sim1 = 0;
                        sim0 = (sim0 > 0) ? thr : -thr;
                    }

                    if (Math.abs(f) < 1e-6 && Math.abs(v) < 1e-6 &&
                        Math.abs(m) < 1e-6 && Math.abs(omegadot) < 1e-6 && Math.abs(arg0 - 0.5) < 0.01)
                        this.set_paused(true);
                }


                ctx.translate(Math.round(width / 2), Math.round(height / 2));

                if (mode === "slide")
                    adjust_wind("na_slide_wind", arg0 - 0.5);


                ctx.strokeStyle = "rgba(0,0,0,0.5)";
                ctx.lineWidth = 2.0;

                ctx.save();
                ctx.translate(cgx * s, 0);

                {
                    ctx.save();
                    ctx.translate(0, (-base_off) * s);

                    ctx.rotate(base_a)
                    ctx.translate(-cgx * s, cgy * s);


                    let side_pad = 5;


                    bottom_rounded_rect(-w * s / 2, -h * s, w * s, h * s, w * s * 0.1);
                    ctx.lineCap = "butt";
                    ctx.lineWidth = 2;

                    ctx.strokeStyle = "#741818";
                    ctx.fillStyle = "#C5432E";
                    ctx.fill();
                    ctx.stroke();

                    ctx.beginPath();
                    ctx.rect(-w * s / 2, -h * s, w * s, h * s * 0.45);
                    ctx.fillStyle = "#333";
                    ctx.strokeStyle = "#222";
                    ctx.fill();
                    ctx.stroke();

                    let ww = 4;

                    bottom_rounded_rect(-w * s / 2 + ww, -h * s, w * s - 2 * ww, h * s - ww, w * s * 0.1 - ww);
                    ctx.fillStyle = "#444";
                    ctx.strokeStyle = "#222";
                    ctx.fill();
                    ctx.stroke();



                    ctx.lineJoin = "miter";
                    ctx.lineWidth = 2;

                    let boxw = 0.2 * w;

                    ctx.fillStyle = "#999";
                    ctx.fillRect(-w * 0.5 * s + side_pad, -h * s, w * s - side_pad * 2, (h - cargo_cgy + boxw * 0.5) * s + 2);


                    ctx.fillStyle = "#555"
                    ctx.beginPath();
                    ctx.rect(- w * s * 0.5, -h * s, w * s, 4);
                    ctx.fill();
                    ctx.stroke();


                    if (mode === "cgx") {

                        ctx.save();
                        ctx.lineJoin = "round";
                        ctx.lineCap = "round";
                        ctx.beginPath();
                        ctx.lineTo((-boxw * 1 + cargo_cgx) * s, (+boxw * 0.5 - cargo_cgy) * s);
                        ctx.lineTo((-boxw * 1 + cargo_cgx) * s, (+boxw * 0.5 - cargo_cgy) * s + 4);
                        ctx.lineTo((-boxw * 0.5 + cargo_cgx) * s, (-boxw * 0.25 - cargo_cgy) * s + 2);
                        ctx.lineTo((-boxw * 0.55 + cargo_cgx) * s, (-boxw * 0.25 - cargo_cgy) * s);
                        ctx.lineTo((boxw * 0.55 + cargo_cgx) * s, (-boxw * 0.25 - cargo_cgy) * s);
                        ctx.lineTo((boxw * 0.5 + cargo_cgx) * s, (-boxw * 0.25 - cargo_cgy) * s + 2);
                        ctx.lineTo((boxw * 1 + cargo_cgx) * s, (+boxw * 0.5 - cargo_cgy) * s + 4);
                        ctx.lineTo((boxw * 1 + cargo_cgx) * s, (+boxw * 0.5 - cargo_cgy) * s);

                        ctx.lineWidth = 6;
                        ctx.strokeStyle = "#766F59";
                        ctx.stroke();

                        ctx.lineWidth = 2;
                        ctx.strokeStyle = "#C8BD99";
                        ctx.stroke();

                        ctx.restore();

                    }


                    ctx.beginPath();
                    ctx.lineWidth = 6;
                    ctx.strokeStyle = "#222";

                    ctx.lineTo((-w * 0.5) * s + side_pad, (-cargo_cgy + boxw * 0.5) * s + 4);
                    ctx.lineTo((w * 0.5) * s - side_pad, (-cargo_cgy + boxw * 0.5) * s + 4);
                    ctx.stroke();

                    ctx.lineWidth = 2;
                    ctx.strokeStyle = "#444";
                    ctx.stroke();




                    ctx.fillStyle = "#37844F";
                    ctx.strokeStyle = "#225331";
                    ctx.lineWidth = 2;


                    ctx.beginPath();
                    ctx.roundRect((-boxw * 0.5 + cargo_cgx) * s, (-boxw * 0.5 - cargo_cgy) * s, boxw * s, boxw * s, 3);
                    ctx.fill();
                    ctx.stroke();

                    ctx.fillStyle = ctx.strokeStyle;
                    ctx.font = "500 " + s * 0.05 + "px IBM Plex Sans";
                    ctx.fillText("HEAVY", cargo_cgx * s, -cargo_cgy * s + s * 0.02);

                    ctx.restore();
                }

                ctx.restore();

            } else if (mode === "free_surface" || mode === "free_surface2") {

                dt *= 7.0;

                let s = width * 0.4;

                let w = 1.0;
                let h = 0.75;

                let base_off = off;
                let base_a = a;

                let max_water_h = 0.4 * h;
                let water_h = (sim2) * max_water_h * 0.99;


                let base_weight = 0.2;
                let base_cgy = 0.4 * h;
                let cargo_weight = water_h * w;
                let cargo_cgx = sim0;
                let cargo_cgy = sim1;

                let weight = base_weight + cargo_weight;


                let cgy = (base_weight * base_cgy + cargo_weight * cargo_cgy) / weight;
                let cgx = (cargo_weight * cargo_cgx) / weight;


                let change = false;
                let rate = (0.01 + Math.abs(sim2 - arg1) * 0.05) * dt;
                if (sim2 < arg1) {
                    sim2 = Math.min(arg1, sim2 + rate);
                    change = true;
                } else if (sim2 > arg1) {
                    sim2 = Math.max(arg1, sim2 - rate);
                    change = true;
                }



                let water_off = bisect(-2 * h, 2 * h, function (x) {
                    let poly = ship_poly(w, max_water_h, a, x, cgx, cgy)
                    poly = poly_y_clip(poly, 0);

                    return poly_area(poly) - cargo_weight;
                });


                let water_w = mode === "free_surface" ? w : w / 3;

                let water_poly = ship_poly(water_w, max_water_h, a, water_off, cgx, cgy);
                water_poly = poly_y_clip(water_poly, 0);
                water_poly = water_poly.map(a => vec_add(a, [0, -water_off]));

                {
                    let c = Math.cos(a);
                    let s = Math.sin(a);

                    water_poly = water_poly.map(a => [a[0] * c - a[1] * s, a[0] * s + a[1] * c]);
                    water_poly = water_poly.map(a => vec_add(a, [cgx, cgy]));
                }


                let wp = poly_center(water_poly);


                sim0 = wp[0];
                sim1 = wp[1];

                if (water_h == 0) {
                    sim0 = sim1 = 0;
                }


                let poly = ship_poly(w, h, a, off, cgx, cgy);
                let submerged_poly = poly_y_clip(poly, 0);

                let b = poly_area(submerged_poly);
                let p = poly_center(submerged_poly);


                {

                    let f = -weight + b - v * 0.5;


                    v += dt * f;

                    off += dt * v;
                    // v*= 0.95;

                    let m = -p[0] * b + (arg0 - 0.5) * 0.01;

                    let omegadot = m - omega * omegadot_omega_factor;

                    omega += dt * omegadot;
                    a += dt * omega;



                    if (Math.abs(f) < 1e-6 && Math.abs(v) < 1e-6 &&
                        Math.abs(m) < 1e-6 && Math.abs(omegadot) < 1e-6 &&
                        Math.abs(arg0 - 0.5) < 0.01 &&
                        !change)
                        this.set_paused(true);
                }


                ctx.translate(Math.round(width / 2), Math.round(height / 2));


                ctx.strokeStyle = "rgba(0,0,0,0.5)";
                ctx.lineWidth = 2.0;

                ctx.save();
                ctx.translate(cgx * s, 0);

                {
                    ctx.save();
                    ctx.translate(0, (-base_off) * s);

                    ctx.rotate(base_a)
                    ctx.translate(-cgx * s, cgy * s);

                    ctx.fillStyle = "#341500"

                    let n = 1;
                    let x = 0
                    if (mode === "free_surface2") {
                        n = 3;
                        x = -w / 3;
                    }

                    for (let i = 0; i < n; i++) {
                        ctx.beginPath();
                        water_poly.forEach(a => { ctx.lineTo((a[0] + w * i / 3 + x) * s, -a[1] * s); });
                        ctx.closePath();

                        ctx.fill();
                    }

                    ctx.globalCompositeOperation = "source-in";


                    bottom_rounded_rect(-w * s / 2, -h * s, w * s, h * s, w * s * 0.07);

                    ctx.fill();

                    ctx.restore();


                    {
                        ctx.save();
                        ctx.lineWidth = 2;

                        ctx.translate(0, (-base_off) * s);

                        ctx.rotate(base_a)
                        ctx.translate(-cgx * s, cgy * s);


                        ctx.globalCompositeOperation = "destination-over";

                        let ww = 4;

                        bottom_rounded_rect(-w * s / 2, -h * s, w * s, h * s + 0.5, w * s * 0.07);
                        ctx.fillStyle = "#999";
                        ctx.strokeStyle = "#333";
                        ctx.stroke();
                        ctx.fill();


                        ctx.beginPath();
                        ctx.rect(-w * s / 2 - ww, -h * s, w * s + ww * 2, h * s * 0.45);
                        ctx.fillStyle = "#333";
                        ctx.strokeStyle = "#222";
                        ctx.fill();
                        ctx.stroke();



                        bottom_rounded_rect(-w * s / 2 - ww, -h * s, w * s + ww * 2, h * s + ww + 0.5, w * s * 0.07 + ww);
                        ctx.lineCap = "butt";
                        ctx.lineWidth = 2;

                        ctx.strokeStyle = "#741818";
                        ctx.fillStyle = "#C5432E";
                        ctx.stroke();
                        ctx.fill();




                        ctx.lineJoin = "miter";
                        ctx.lineWidth = 2;


                        // ctx.fillStyle = "#999";
                        // ctx.fillRect(-w*0.5*s + side_pad, -h*s, w*s-side_pad*2, (h-shift)*s);

                        ctx.globalCompositeOperation = "source-over";


                        ctx.lineWidth = 2;

                        ctx.strokeStyle = "#222";
                        ctx.fillStyle = "#444"

                        ctx.beginPath();
                        ctx.rect(- w * s * 0.5 - ww, -h * s, w * s + ww * 2, 4);
                        ctx.fill();
                        ctx.stroke();


                        ctx.lineCap = "butt";

                        ctx.lineWidth = 6;
                        ctx.strokeStyle = "#333";

                        ctx.beginPath();
                        ctx.lineTo(-w * s / 2 + 1, -max_water_h * s);
                        ctx.lineTo(w * s / 2 - 1, -max_water_h * s);
                        ctx.stroke();

                        ctx.lineWidth = 3;
                        ctx.strokeStyle = "#666";
                        ctx.stroke();


                        if (mode === "free_surface2") {
                            for (let i = 0; i < 2; i++) {
                                ctx.lineWidth = 6;
                                ctx.strokeStyle = "#333";

                                ctx.beginPath();
                                ctx.lineTo(w * (-1 / 6 + i / 3) * s, 0);
                                ctx.lineTo(w * (-1 / 6 + i / 3) * s, -max_water_h * s + 3);
                                ctx.stroke();

                                ctx.lineWidth = 3;
                                ctx.strokeStyle = "#666";
                                ctx.stroke();
                            }
                        }


                        ctx.restore();
                    }
                }

                ctx.restore();


                ctx.globalCompositeOperation = "destination-over";

                adjust_wind("na_" + mode + "_wind", arg0 - 0.5);

                ctx.globalCompositeOperation = "source-over";


            } else if (mode === "tilt" || mode === "tilt_meta") {

                let area = 0.24;

                let w = lerp(1.0, 0.3, arg1);
                let h = area / w;
                let s = width * 0.7;

                let a = (arg0 - 0.5) * Math.PI * 0.2;

                if (mode === "tilt_meta" && Math.abs(a) < 0.001) {
                    a = 0.001;
                }

                let off;



                let base_weight = 0.12;
                let base_cgy = 0.4 * h;
                let cargo_weight = 0.0;
                let cargo_cgy = 0;
                let cargo_cgx = 0;


                let weight = base_weight + cargo_weight;


                let cgy = (base_weight * base_cgy + cargo_weight * cargo_cgy) / weight;
                let cgx = (cargo_weight * cargo_cgx) / weight;



                off = bisect(-2 * h, 2 * h, function (x) {
                    let poly = ship_poly(w, h, a, x, cgx, cgy)
                    poly = poly_y_clip(poly, 0);

                    return poly_area(poly) - weight;
                });


                // off = 0.0; 

                let poly = ship_poly(w, h, a, off, cgx, cgy);
                let submerged_poly = poly_y_clip(poly, 0);


                ctx.translate(Math.round(width / 2), Math.round(height / 2));



                ctx.save();
                ctx.translate(cgx * s, 0);



                {

                    ctx.save();
                    ctx.translate(0, (-off) * s);

                    ctx.rotate(a)
                    ctx.translate(0, cgy * s);

                    draw_front_ship(w * s, h * s, Math.min(w, h) * s * 0.2, h * s * 0.45);


                    if (mode === "tilt_meta") {

                        ctx.setLineDash([3, 3]);
                        ctx.strokeStyle = "rgba(0,0,0,0.3)";
                        ctx.beginPath()
                        ctx.lineTo(0, 0);
                        ctx.lineTo(0, -height);
                        ctx.stroke();
                    }

                    ctx.restore();
                }

                punch_water();

                let p = poly_center(submerged_poly);

                if (mode === "tilt_meta") {
                    ctx.save();
                    ctx.lineWidth = 2;
                    ctx.lineCap = "butt";
                    ctx.setLineDash([3, 3]);
                    ctx.strokeStyle = "rgba(0,0,0,0.3)";
                    ctx.beginPath()
                    ctx.lineTo(p[0] * s, -p[1] * s);
                    ctx.lineTo(p[0] * s, -p[1] * s - height);
                    ctx.stroke();

                    ctx.restore();
                }

                draw_forces([0, -(off) * s], width * 0.3, [p[0] * s, -p[1] * s], width * 0.3,
                    mode === "tilt_meta")

                if (mode === "tilt_meta") {
                    let mh = p[0] / Math.tan(a);
                    ctx.fillStyle = "#222";
                    ctx.fillEllipse(p[0] * s, -off * s - mh * s, 5.5);

                    ctx.fillStyle = "#fff";
                    ctx.fillEllipse(p[0] * s, -off * s - mh * s, 4);
                }

                ctx.restore();

                ctx.fillStyle = "#333";

                ctx.translate(0, -width * 0.42);

                ctx.save();
                let aa = sharp_step(0, 0.04, Math.abs(p[0]));
                ctx.globalAlpha = aa;
                ctx.scale(aa, aa);
                ctx.scale(p[0] < 0 ? 1 : -1, 1);
                let rs = width * 0.1;
                ctx.beginPath();

                ctx.arc(0, 0, rs * 0.6, -1.5 * Math.PI, 0);
                ctx.lineTo(rs * 0.8, 0);
                ctx.lineTo(rs * 0.5, rs * 0.45);
                ctx.lineTo(rs * 0.2, 0);
                ctx.arc(0, 0, rs * 0.4, 0, -1.5 * Math.PI, true);
                ctx.closePath();

                ctx.fill();
                ctx.restore();

            } else if (mode === "arm_plot" || mode === "curvature_plot" || mode === "cgy_plot" || mode === "cgx_plot") {
                let area = 0.24;
                let s = width * 0.2;

                if (mode === "cgx_plot")
                    s = width * 0.2;

                let a = (arg0 - 0.5) * Math.PI * 2;
                let w = lerp(1.0, 0.3, arg1);
                let h = area / w;

                let h_scale = 0.8;

                let cargo_weight = 0.0;
                let cargo_cgy = 0;
                let cargo_cgx = 0;

                let base_weight = 0.12;
                let base_cgy = 0.4 * h;

                let shift = lerp(0.1, 0.4, arg2);

                if (mode === "curvature_plot") {
                    h_scale = 2.0;
                    w = 0.7;
                    h = area / w;
                    base_cgy = 0.5 * h;
                } else if (mode === "cgy_plot") {
                    w = 1.0;
                    h = 0.75;

                    base_weight = 0.2;
                    base_cgy = 0.4 * h;


                    cargo_weight = arg1 * 0.3;
                    cargo_cgy = shift + arg1 * 0.17;

                    ctx.translate(0, Math.round(height * 0.1));

                } else if (mode === "cgx_plot") {
                    w = 1.0;
                    h = 0.75;



                    cargo_weight = 0.2;
                    cargo_cgy = h * 0.3;


                    cargo_cgx = (arg1 - 0.5) * (0.8 * w - 8 / s);

                    base_weight = 0.2;
                    base_cgy = 0.4 * h;


                    ctx.translate(0, Math.round(height * 0.06));
                }



                let weight = base_weight + cargo_weight;


                let poly_f = ship_poly;

                if (mode === "curvature_plot") {
                    function shape(w, h, a, d, cgx, cgy, arg) {
                        w *= 0.5;

                        let c = Math.cos(a);
                        let s = Math.sin(a);

                        let nh = 10;

                        let ps = [[w, h], [-w, h]];

                        let p0 = [-w, h];
                        let p1 = [-w, h - h * lerp(1.1, 0.1, arg)];
                        let p2 = [-w * lerp(1.1, 0.1, arg), 0];

                        for (let i = 0; i < nh; i++) {
                            let t = i / nh;
                            let nt = 1 - t;

                            let p = vec_add(vec_add(vec_scale(p0, nt * nt * nt),
                                vec_scale(p1, 3 * t * nt * nt)),
                                vec_scale(p2, 3 * t * t * nt));

                            ps.push(p);
                        }

                        p1 = [w * lerp(1.1, 0.1, arg), 0];
                        p2 = [w, h - h * lerp(1.1, 0.1, arg)];
                        let p3 = [w, h];

                        for (let i = 0; i < nh; i++) {
                            let t = i / nh;
                            let nt = 1 - t;

                            let p = vec_add(vec_add(vec_scale(p3, t * t * t),
                                vec_scale(p1, 3 * t * nt * nt)),
                                vec_scale(p2, 3 * t * t * nt));

                            ps.push(p);
                        }
                        ps = ps.map(a => vec_add(a, [-cgx, -cgy]));
                        ps = ps.map(a => [a[0] * c + a[1] * s, a[0] * -s + a[1] * c]);
                        ps = ps.map(a => vec_add(a, [0, d]));

                        return ps;
                    }
                    poly_f = function (w, h, a, d, cgx, cgy) {
                        return shape(w, h, a, d, cgx, cgy, arg1)
                    }

                    base_weight *= poly_area(shape(w, h, 0, 0, 0, 0, arg1)) / poly_area(shape(w, h, 0, 0, 0, 0, 0));
                    weight = base_weight + cargo_weight;
                }

                let cgy = (base_weight * base_cgy + cargo_weight * cargo_cgy) / weight;
                let cgx = (cargo_weight * cargo_cgx) / weight;

                let off = bisect(-2 * h, 2 * h, function (x) {
                    let poly = poly_f(w, h, a, x, cgx, cgy)
                    poly = poly_y_clip(poly, 0);

                    return poly_area(poly) - weight;
                });


                let poly = poly_f(w, h, a, off, cgx, cgy);
                let submerged_poly = poly_y_clip(poly, 0);

                let p = poly_center(submerged_poly);


                ctx.translate(0, Math.round(height * 0.7));


                let inset = 7;
                ctx.lineWidth = 1;

                ctx.strokeStyle = "#333"

                ctx.beginPath()
                ctx.lineTo(inset, 0);
                ctx.lineTo(width - inset, 0);
                ctx.stroke();

                let n = Math.ceil(width * 0.2);



                ctx.lineWidth = 4;

                let good = "#5FAE21";
                let bad = "#F24F4F";

                let crosses = [];

                let prev_sign = undefined;
                let prev_x = undefined;
                let prev_y = undefined;
                for (let i = 0; i <= n; i++) {

                    let t = i / n;
                    let a = (t - 0.5) * 2 * Math.PI;
                    let off = bisect(-2 * h, 2 * h, function (x) {
                        let poly = poly_f(w, h, a, x, cgx, cgy)
                        poly = poly_y_clip(poly, 0);

                        return poly_area(poly) - weight;
                    });


                    let poly = poly_f(w, h, a, off, cgx, cgy);
                    let submerged_poly = poly_y_clip(poly, 0);
                    let p = poly_center(submerged_poly);

                    let sign = p[0] < 0 ? -1 : (p[0] > 0 ? 1 : 0);

                    let x = t * (width - inset * 2) + inset;
                    let y = -p[0] * height * h_scale;

                    let th = 0.5;

                    if (mode === "cgx_plot")
                        th += arg1 * 0.15;
                    if (sign != prev_sign) {
                        if (prev_x === undefined) {
                            ctx.beginPath();
                            if (Math.abs(y) < 1e-5) {
                                crosses.push([x, y]);
                            }
                        } else {
                            let cy = 0;
                            let cx = lerp(prev_x, x, (cy - prev_y) / (y - prev_y));

                            ctx.lineTo(cx, cy);

                            crosses.push([cx, cy]);


                            ctx.strokeStyle = (prev_sign <= 0 != ((i - 1) / n) > th) ? good : bad;
                            ctx.stroke();
                            ctx.beginPath();
                            ctx.lineTo(cx, cy);
                        }

                        prev_sign = sign;
                    }

                    prev_x = x;
                    prev_y = y;

                    ctx.lineTo(x, y);

                    if (i == n && Math.abs(y) < 1e-5) {
                        crosses.push([x, y]);
                    }
                }

                ctx.strokeStyle = (prev_sign > 0) ? good : bad;
                ctx.stroke();

                ctx.fillStyle = "#888";
                ctx.strokeStyle = "#666";
                ctx.lineWidth = 2;

                crosses.forEach(a => { ctx.fillEllipse(a[0], a[1], 2.5); ctx.strokeEllipse(a[0], a[1], 2.5) });


                {
                    let x = inset + arg0 * (width - inset * 2);
                    let y = -p[0] * height * h_scale;

                    ctx.beginPath();
                    ctx.lineTo(x, 0);
                    ctx.lineTo(x, y);

                    ctx.lineWidth = 5;
                    ctx.strokeStyle = "#111";
                    ctx.stroke();

                    ctx.lineWidth = 2;
                    ctx.strokeStyle = "#fff";
                    ctx.stroke();

                    ctx.fillStyle = "#111";
                    ctx.fillEllipse(x, y, 3.5);

                    ctx.fillStyle = "#fff";
                    ctx.fillEllipse(x, y, 2);

                    ctx.fillStyle = "#000";
                    ctx.fillEllipse(x, 0, 4.5);

                    ctx.fillStyle = "#333";
                    ctx.fillEllipse(x, 0, 3);
                }


                ctx.save();

                ctx.translate(Math.round(width * 0.5), -height * 0.4);


                if (mode === "cgx_plot")
                    ctx.translate(0, Math.round(-height * 0.1));

                {

                    ctx.save();
                    ctx.translate(0, (-off) * s);

                    ctx.rotate(a)

                    ctx.translate(-cgx * s, cgy * s);

                    let side_pad = 5;


                    if (mode === "curvature_plot") {
                        ctx.save();
                        ctx.strokeStyle = "#555";
                        ctx.lineCap = "butt";
                        ctx.lineWidth = 2;

                        let t = lerp(1.1, 0.1, arg1);

                        let ww = 0;
                        ctx.beginPath();
                        ctx.moveTo(-w * 0.5 * s + ww, -h * s)
                        ctx.bezierCurveTo(-w * 0.5 * s + ww, -h * s + (h * s - ww) * t,
                            -(w * 0.5 * s - ww) * t + ww, -ww,
                            0, -ww);

                        ctx.bezierCurveTo((w * 0.5 * s - ww) * t - ww, -ww,
                            w * 0.5 * s - ww, -h * s + (h * s - ww) * t,
                            w * 0.5 * s - ww, -h * s);
                        ctx.closePath();


                        ctx.fillStyle = ctx.strokeStyle = "#C5432E";

                        ctx.lineWidth = 2;
                        ctx.fill();
                        ctx.stroke();

                        ctx.fillStyle = "#333";
                        ctx.globalCompositeOperation = "source-atop";
                        ctx.fillRect(-w * s * 0.5 - 4, -h * s - 4, w * s + 8, h * 0.45 * s + 4);
                        ctx.fillStyle = "#222";
                        ctx.fillRect(-w * s, -h * 0.55 * s - 1, w * 2 * s, 2);


                        ctx.strokeStyle = "rgba(0,0,0,0.5)"
                        ctx.stroke();



                        ctx.restore();
                    } else if (mode === "arm_plot") {
                        draw_front_ship(w * s, h * s, Math.min(w, h) * 0.2 * s, h * 0.45 * s);
                    } else {
                        bottom_rounded_rect(-w * s / 2, -h * s, w * s, h * s, w * s * 0.1);
                        ctx.lineCap = "butt";
                        ctx.lineWidth = 2;

                        ctx.strokeStyle = "#741818";
                        ctx.fillStyle = "#C5432E";
                        ctx.fill();
                        ctx.stroke();

                        ctx.beginPath();
                        ctx.rect(-w * s / 2, -h * s, w * s, h * s * 0.45);
                        ctx.fillStyle = "#333";
                        ctx.strokeStyle = "#222";
                        ctx.fill();
                        ctx.stroke();

                        let ww = 4;

                        bottom_rounded_rect(-w * s / 2 + ww, -h * s, w * s - 2 * ww, h * s - ww, w * s * 0.1 - ww);
                        ctx.fillStyle = "#555";
                        ctx.strokeStyle = "#333";
                        ctx.fill();
                        ctx.stroke();



                        ctx.lineJoin = "miter";
                        ctx.lineWidth = 2;


                        ctx.fillStyle = "#999";
                        ctx.fillRect(-w * 0.5 * s + side_pad, -h * s, w * s - side_pad * 2, (h - shift) * s);


                        ctx.lineWidth = 2;

                        ctx.strokeStyle = "#222";
                        ctx.fillStyle = "#444"

                        ctx.beginPath();
                        ctx.rect(- w * s * 0.5, -h * s, w * s, 4);
                        ctx.fill();
                        ctx.stroke();
                    }

                    if (mode === "cgy_plot") {
                        {
                            {

                                ctx.save();


                                let nr = 4;
                                let nc = 14;

                                let boxw = (w * s - 2 * side_pad) / nc;
                                let boxh = boxw * 1.1;

                                let total = Math.round(arg1 * nr * nc / 2) * 2;

                                let rows = Math.ceil(total / nc);
                                let cols = total - (rows - 1) * nc;



                                ctx.strokeStyle = "#555";

                                for (let col = 1; col < nc; col++) {

                                    ctx.beginPath();
                                    ctx.lineTo(side_pad + col * boxw - w * 0.5 * s, - shift * s);
                                    ctx.lineTo(side_pad + col * boxw - w * 0.5 * s, - boxh * nr - shift * s - 1);

                                    // ctx.lineTo(side_pad + col * boxw - w * 0.5 * s, - h * s);
                                    ctx.stroke();
                                }

                                for (let row = 1; row <= nr; row++) {

                                    ctx.beginPath();
                                    ctx.lineTo(side_pad - w * 0.5 * s, - shift * s - row * boxh - 1);
                                    ctx.lineTo(-side_pad + w * 0.5 * s, - shift * s - row * boxh - 1);
                                    ctx.stroke();
                                }

                                ctx.lineWidth = boxw * 0.5;
                                ctx.strokeStyle = "#999";
                                for (let col = 0; col < nc; col++) {

                                    ctx.beginPath();
                                    ctx.lineTo(side_pad + (col + 0.5) * boxw - w * 0.5 * s, - shift * s - 4);
                                    ctx.lineTo(side_pad + (col + 0.5) * boxw - w * 0.5 * s, - boxh * nr - shift * s - 4);

                                    // ctx.lineTo(side_pad + col * boxw - w * 0.5 * s, - h * s);
                                    ctx.stroke();
                                }

                                ctx.lineWidth = 2;

                                ctx.strokeStyle = "#222";
                                ctx.fillStyle = "#444"

                                ctx.beginPath();
                                ctx.rect(-w * s / 4 - 4, - shift * s, 8, shift * s - 4);
                                ctx.fill();
                                ctx.stroke();

                                ctx.beginPath();
                                ctx.rect(- 4, - shift * s, 8, shift * s - 4);
                                ctx.fill();
                                ctx.stroke();

                                ctx.beginPath();
                                ctx.rect(w * s / 4 - 4, - shift * s, 8, shift * s - 4);
                                ctx.fill();
                                ctx.stroke();


                                ctx.beginPath();
                                ctx.rect(side_pad - w * s * 0.5, - shift * s, w * s - side_pad * 2, 4);
                                ctx.fill();
                                ctx.stroke();

                                ctx.lineWidth = 1.;

                                for (let row = 0; row < rows; row++) {

                                    let n = row == rows - 1 ? cols : nc;
                                    let p = Math.ceil((nc - n) / 2);
                                    // let space = (nc - n)*0.5 * boxw + side_pad;

                                    for (let col = p; col < n + p; col++) {

                                        let h = (Math.sin((col + row * nc) * 342.875345) * 43758.5453123) % 1;
                                        let b = (Math.sin((col + row * nc) * 654.86345) * 63378.9812) % 20;
                                        // b = 20;
                                        // h = 1-Math.cos(h*Math.PI*0.5);
                                        h = h * h * h;
                                        h = Math.round(h * 360);
                                        // h = 0.;
                                        ctx.fillStyle = "hsl(" + h + ", 40%, " + (b + 40) + "%)";
                                        ctx.strokeStyle = "hsl(" + h + ", 45%, " + (b + 20) + "%)";

                                        ctx.beginPath();
                                        ctx.rect(side_pad + col * boxw - w * 0.5 * s + 0.5, -row * boxh - boxh - shift * s, boxw - 1, boxh - 1);
                                        ctx.fill();
                                        ctx.stroke();
                                    }
                                }
                                ctx.restore();
                            }
                        }
                    } else if (mode === "cgx_plot") {
                        ctx.fillStyle = "#37844F";
                        ctx.strokeStyle = "#225331";
                        ctx.lineWidth = 2;

                        let boxw = 0.2 * w;

                        ctx.beginPath();
                        ctx.roundRect((-boxw * 0.5 + cargo_cgx) * s, (-boxw * 0.5 - cargo_cgy) * s, boxw * s, boxw * s, 3);
                        ctx.fill();
                        ctx.stroke();

                        ctx.fillStyle = ctx.strokeStyle;
                        ctx.font = "500 " + s * 0.05 + "px IBM Plex Sans";
                        ctx.fillText("HEAVY", cargo_cgx * s, -cargo_cgy * s + s * 0.02);


                        ctx.beginPath();
                        ctx.lineWidth = 6;
                        ctx.strokeStyle = "#222";

                        ctx.lineTo((-w * 0.5) * s + side_pad, (-cargo_cgy + boxw * 0.5) * s + 4);
                        ctx.lineTo((w * 0.5) * s - side_pad, (-cargo_cgy + boxw * 0.5) * s + 4);
                        ctx.stroke();

                        ctx.lineWidth = 2;
                        ctx.strokeStyle = "#444";
                        ctx.stroke();
                        // ctx.restore();
                    }
                    ctx.restore();
                }

                ctx.strokeStyle = "#333";
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.lineTo(-s, 0);
                ctx.lineTo(s, 0);
                ctx.stroke();



                draw_forces([0, -(off) * s, 3], width * 0.1, [p[0] * s, -p[1] * s], width * 0.1)


                ctx.restore();
            }
        }

        if (load_text)
            document.fonts.load("500 10px IBM Plex Sans").then(function () { request_repaint() });

        this.on_resize();

        window.addEventListener("resize", this.on_resize, true);
        window.addEventListener("load", this.on_resize, true);
    }

    document.addEventListener("DOMContentLoaded", function (event) {

        function make_drawer(name, slider_count, args) {
            let ret = [];

            let drawer = new Drawer(document.getElementById("na_" + name), name);
            ret.push(drawer);

            if (slider_count === undefined)
                slider_count = 0;

            for (let i = 0; i < slider_count; i++) {
                let slider = new Slider(document.getElementById("na_" + name + "_sl" + i), function (x) {
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

        make_drawer("brick_container", 1, [0]);
        weight_pressure = make_drawer("weight_pressure", 1);
        make_drawer("syringe", 1, [0.0]);
        make_drawer("syringe_pressure", 2);
        make_drawer("shapes", 1);
        make_drawer("barrel", 1);
        make_drawer("water_level", 1);
        L_demo = make_drawer("L", 1, [0]);
        loading = make_drawer("loading", 2);
        make_drawer("brick_scale", 1, [0.0]);
        make_drawer("brick_forces", 1, [0.0]);
        make_drawer("brick_wood", 1, [0.0]);
        wind_tilt = make_drawer("wind_tilt", 2, [0.5, 0.5]);
        tilt = make_drawer("tilt", 2, [0.5, 0.0]);
        make_drawer("tilt_meta", 2, [0.5, 0.0]);
        make_drawer("cgx", 1);
        slide = make_drawer("slide", 1);
        free_surface = make_drawer("free_surface", 2);
        make_drawer("free_surface2", 2);
        arm_plot = make_drawer("arm_plot", 2, [0.5, 0.0]);
        make_drawer("curvature_plot", 2, [0.5, 0.0]);
        cgy_plot = make_drawer("cgy_plot", 3, [0.5, 0.5, 0.0]);
        make_drawer("cgx_plot", 2, [0.5, 0.5]);
        make_drawer("propeller", 0);

        make_drawer("propeller_aoa", 1);
        make_drawer("propeller_aoa2", 1, [0]);
        make_drawer("propeller_aoa3", 1, [0]);
        make_drawer("propeller_pitch", 1);
        pitch_force = make_drawer("propeller_pitch_force", 1);
        make_drawer("propeller_twist", 1, [0]);
        make_drawer("propeller_radial", 0);
        make_drawer("propeller_forward", 0);
        make_drawer("helicoid", 2);
        make_drawer("3d_forces", 0);
        make_drawer("subdiv", 1, [0]);
        make_drawer("water_cylinder", 0);
        make_drawer("tub", 0);
        make_drawer("height", 0);
        make_drawer("wave", 1);
        make_drawer("hero", 1);
        hull_ratio = make_drawer("hull_ratio", 1);
        let hull = make_drawer("hull", 0);


        new SegmentedControl(document.getElementById("na_hull_seg0"), function (x) {
            hull[0].set_arg0(x);
        },
            ["deck", "bow", "stern", "port", "starboard"]
        );

        prop_n = make_drawer("propeller_n", 0);
        prop_n_seg = new SegmentedControl(document.getElementById("na_propeller_n_seg0"), function (x) {
            prop_n[0].set_arg0(x);
        },
            ["2", "3", "4", "5"]
        );

        for (let i = 0; i < 4; i++)
            active_sliders_held.push(false);

        active_objects.push(make_drawer("wood_sub", 1, [0.0]));
        active_objects.push(make_drawer("tub_sub", 1, [0.0]));

        active_objects.push(make_drawer("wood_tilt", 1));
        active_objects.push(make_drawer("wood_tilt_f", 1));

        let maker = function (index) {
            let g = function (e) {
                active_sliders_held[index] = true;
                active_objects[index][0].repaint();
                let f = function (e) {
                    window.removeEventListener("mouseup", f);
                    window.removeEventListener("touchend", f);
                    window.removeEventListener("touchcancel", f);
                    active_sliders_held[index] = false;
                    active_objects[index][0].repaint();
                };

                window.addEventListener("mouseup", f);
                window.addEventListener("touchend", f);
                window.addEventListener("touchcancel", f);
            }

            return g;
        }

        for (let i = 0; i < 4; i++) {
            let func = maker(i);
            active_objects[i][1].knob_div().addEventListener("mousedown", func);
            active_objects[i][1].knob_div().addEventListener("touchstart", func);
        }


        drawers_ready = true;

        {

            let wave_canvas = document.createElement("canvas");


            wave_canvas.width = wave_w * scale;
            wave_canvas.height = wave_h * scale;

            let ctx = wave_canvas.getContext("2d");

            ctx.resetTransform();
            ctx.clearRect(0, 0, wave_canvas.width, wave_canvas.height);
            ctx.scale(scale, scale);


            ctx.translate(wave_w * 0.5, wave_h * 0.5);

            let wave = wave_poly(0, 17, 32, 30);
            ctx.beginPath();
            wave.forEach(a => { ctx.lineTo(a[0], -a[1]); });
            ctx.lineTo(wave[wave.length - 1][0], 20);
            ctx.lineTo(wave[0][0], 20);
            ctx.closePath();
            ctx.fillStyle = "#2D8BBC";
            // ctx.fillStyle = "red";
            ctx.fill();

            ctx.save();
            let grd = ctx.createLinearGradient(0, 0, 0, 20);
            grd.addColorStop(0.0, "rgba(0,0,0,0.0)");
            grd.addColorStop(1.0, "rgba(0,0,0,1.0)");
            ctx.fillStyle = grd;
            ctx.globalCompositeOperation = "destination-out";
            ctx.fillRect(-wave_w, 0, wave_w * 2, 22);
            ctx.restore();


            // ctx.fillEllipse(0,0,50, 50);

            let url = wave_canvas.toDataURL();
            document.getElementById("na_wave_wave").style.background = 'url(' + url + ')'
            document.getElementById("na_hero_wave").style.background = 'url(' + url + ')'

        }

        {

            let wind_canvas = document.createElement("canvas");


            wind_canvas.width = wind_w * scale;
            wind_canvas.height = wind_h * scale;

            let ctx = wind_canvas.getContext("2d");

            ctx.lineWidth = 2;
            ctx.lineCap = "round";
            ctx.strokeStyle = "#38677C";

            {

                ctx.resetTransform();

                ctx.clearRect(0, 0, wind_canvas.width, wind_canvas.height);

                ctx.scale(scale, scale);




                ctx.translate(wind_w * 0.5 / 3, wind_h * 0.5);


                for (let p = 0; p < 4; p++) {

                    for (let i = 0; i < 16; i++) {
                        ctx.beginPath();
                        let t = i / 16;
                        ctx.lineWidth = 0.6 + t * (1 - t) * 7;
                        for (let k = 0; k < 2; k++)
                            ctx.lineTo(((t + k / 16) * 0.2 - 0.1) * wind_w, + Math.sin(p) * wind_h * 0.2 +
                                Math.sin(p * 1.5 + Math.PI * (2 + p * 0.3) * (t + k / 16)) * wind_h * 0.12 * t * (1 - t));
                        ctx.stroke();
                    }


                    ctx.save();
                    let grd = ctx.createLinearGradient(-wind_w * 0.1, 0, wind_w * 0.0, 0);
                    for (let i = 0; i <= 10; i++) {
                        let t = i / 10;
                        grd.addColorStop(1 - t, "rgba(0,0,0," + ((t * t * t) + 3 * (1 - t) * t * t * t) + ")");
                    }


                    ctx.globalCompositeOperation = "destination-out";
                    ctx.fillStyle = grd;
                    ctx.fillRect(-wind_w * 0.1, -wind_h * 0.5, wind_w * 0.1, wind_h);
                    ctx.scale(-1, 1);
                    ctx.fillRect(-wind_w * 0.5, -wind_h * 0.5, wind_w * 0.6, wind_h);
                    ctx.restore();

                    ctx.translate(wind_w / 3, 0);

                }



                ctx.save();

                ctx.resetTransform();
                ctx.fillStyle = "rgba(0,0,0,0.5)";
                ctx.globalCompositeOperation = "destination-out";
                ctx.fillRect(0, 0, wind_canvas.width, wind_canvas.height);
                ctx.restore();

                // ctx.moveTo(wind_w*0.3 - wind_h *0.1, -wind_h *0.05);
                // ctx.lineTo(wind_w*0.3, 0);
                // ctx.lineTo(wind_w*0.3 - wind_h *0.1, wind_h *0.05);



                wind_uri = "url(" + wind_canvas.toDataURL() + ")";
            }


        }

        for (var i = 0; i < all_drawers.length; i++) {
            all_drawers[i].repaint();
        }

    });
})();


function zero_weight() {
    weight_pressure[0].set_arg0(0.0);
    weight_pressure[1].set_value(0.0);
}

function L_full() {
    L_demo[0].set_arg0(1.0);
    L_demo[1].set_value(1.0);
}

function front_3d() {
    hull_ratio[0].set_rot(rot_x_mat3(-Math.PI * 0.5));
}

function wind_tilt_0() {
    wind_tilt[0].set_arg1(0);
    wind_tilt[2].set_value(0);
}


function wind_tilt_1() {
    wind_tilt[0].set_arg0(0);
    wind_tilt[1].set_value(0);
}

function wind_tilt_2() {
    wind_tilt[0].set_arg0(0.5);
    wind_tilt[1].set_value(0.5);

}

function wind_tilt_3() {
    wind_tilt[0].reset();
    wind_tilt[0].set_arg0(1);
    wind_tilt[0].set_arg1(1);
    wind_tilt[1].set_value(1);
    wind_tilt[2].set_value(1);
}

function tilt_0() {
    tilt[0].set_arg0(0.3);
    tilt[0].set_arg1(0.0);
    tilt[1].set_value(0.3);
    tilt[2].set_value(0.0);
}

function tilt_1() {
    tilt[0].set_arg0(0.0);
    tilt[0].set_arg1(1.0);
    tilt[1].set_value(0.0);
    tilt[2].set_value(1.0);
}

function blade_count() {
    prop_n[0].set_rot(ident_mat3);
}

function loading_high() {
    loading[0].set_arg0(1);
    loading[0].set_arg1(1);
    loading[1].set_value(1);
    loading[2].set_value(1);
}

function loading_0() {
    cgy_plot[0].set_arg1(0.8);
    cgy_plot[0].set_arg2(0);
    cgy_plot[2].set_value(0.8);
    cgy_plot[3].set_value(0);
}

function loading_1() {
    cgy_plot[0].set_arg0(0.567);
    cgy_plot[0].set_arg1(0.8);
    cgy_plot[0].set_arg2(1);
    cgy_plot[1].set_value(0.567);
    cgy_plot[2].set_value(0.8);
    cgy_plot[3].set_value(1);
}

function loading_2() {
    cgy_plot[0].set_arg1(1);
    cgy_plot[0].set_arg2(1);
    cgy_plot[2].set_value(1);
    cgy_plot[3].set_value(1);
}


function slide_0() {
    slide[0].set_arg0(0.3);
    slide[1].set_value(0.3);
}

function slide_1() {
    slide[0].set_arg0(0.5);
    slide[1].set_value(0.5);
}

function blades_0() {
    pitch_force[0].set_arg0(0.0);
    pitch_force[1].set_value(0.0);
}

function blades_1() {
    pitch_force[0].set_arg0(1.0);
    pitch_force[1].set_value(1.0);
}

function blades_2() {
    pitch_force[0].set_arg0(0.6);
    pitch_force[1].set_value(0.6);
}


function free_surface_0() {
    free_surface[0].set_arg0(0.0);
    free_surface[1].set_value(0.0);

    free_surface[0].set_arg1(0.5);
    free_surface[2].set_value(0.5);
}

function free_surface_1() {
    free_surface[0].set_arg0(0.5);
    free_surface[1].set_value(0.5);

    free_surface[0].set_arg1(0.5);
    free_surface[2].set_value(0.5);
}

function free_surface_2() {
    free_surface[0].set_arg0(1);
    free_surface[1].set_value(1);

    free_surface[0].set_arg1(0.5);
    free_surface[2].set_value(0.5);
}


function free_surface_3() {
    free_surface[0].set_arg1(0);
    free_surface[2].set_value(0);
}

function free_surface_4() {
    free_surface[0].set_arg1(1);
    free_surface[2].set_value(1);
}


function arm_plot_0() {
    arm_plot[0].set_arg0(0.55);
    arm_plot[0].set_arg1(1);
    arm_plot[1].set_value(0.55);
    arm_plot[2].set_value(1);
}


function arm_plot_1() {
    arm_plot[0].set_arg0(0.78);
    arm_plot[0].set_arg1(0);
    arm_plot[1].set_value(0.78);
    arm_plot[2].set_value(0);
}