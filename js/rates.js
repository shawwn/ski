// noinspection PointlessArithmeticExpressionJS

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

document.addEventListener("visibilitychange", function() {
    if (!document.hidden) {
        for (let drawer of all_drawers) {
            drawer.repaint();
        }
    }
});


let active_sliders_held = [];
let active_objects = [];

let water_fill_style = "#88C3EE";
let water_stroke_style = "#6591B1";
let container_stroke_style = "#9A9EAA";
let container_inner_stroke_style = "#E2E2E2";
let container_outer_stroke_style = "#7F7F7F";
let container_top_stroke_style = "#0025bd";
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


let wall_fill_style = Color.parse("magenta").toHtml();
let wall_stroke_style = Color.parse("magenta").scaleRGB(0.8).toHtml();

let rc_wall;
let rc_cube;

let corner_color = "rgba(231, 76, 60,1.0)";
let edge_color = "rgba(230, 126, 34,1.0)";
let side_color = "rgba(241, 196, 15,0.5)";

let base_axis_color = "rgba(0,0,0,0.4)";
let cube_edge_color = "#666";
let cube_side_color = "rgba(140, 224, 123,0.9)";


(function () {
    let scale = window.devicePixelRatio || 1;
    scale = scale > 1.75 ? 2 : 1;

    function download_file(file_path, handler) {
        let xhr = new XMLHttpRequest();
        xhr.open("GET", file_path);
        xhr.responseType = "arraybuffer";

        xhr.onload = function (_oEvent) {
            let buffer = xhr.response;
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

        let ext = gl.getExtension('OES_element_index_uint');

        let viewport_x = 0;
        let viewport_y = 0;
        let viewport_w = 0;
        let viewport_h = 0;


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

                let z_sign = k === 0 ? -1 : 1;
                let zh = k === 0 ? 0.02 : 0.1;

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
                        if (k === 1)
                            indices.push(off + j * (m + 1) + i + 1);
                        else
                            indices.push(off + j * (m + 1) + i + m + 2);

                        if (k === 1)
                            indices.push(off + j * (m + 1) + i + m + 2);
                        else
                            indices.push(off + j * (m + 1) + i + 1);

                        indices.push(off + j * (m + 1) + i);

                        if (k === 1)
                            indices.push(off + j * (m + 1) + i + m + 2);
                        else
                            indices.push(off + j * (m + 1) + i + m + 1);

                        if (k === 1)
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
                        let z = i === 0 ? 0 : (nz + 2);


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

                        if (i === 0) {
                            r = 0;
                            nz = -1;
                            nx = ny = 0;
                        } else if (i === 1) {
                            nz = -1;
                            nx = ny = 0;
                        } else if (i === 3) {
                            z = 6;
                        } else if (i === 4) {
                            z = 6;
                            nz = -1;
                            nx = ny = 0;
                        } else if (i === 5) {
                            r = 2;
                            z = 6;
                            nz = -1;
                            nx = ny = 0;
                        } else if (i === 6) {
                            r = 2;
                            z = 6;
                            nz = 0.5;
                        } else if (i === 7) {
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

                        if (i === 0) {
                            r = 0;
                            nz = -1;
                            nx = ny = 0;
                        } else if (i === 1) {
                            nz = -1;
                            nx = ny = 0;
                        } else if (i === m - 5) {
                            z = 6;
                        } else if (i === m - 4) {
                            z = 6;
                            nz = -1;
                            nx = ny = 0;
                        } else if (i === m - 3) {
                            r = 2;
                            z = 6;
                            nz = -1;
                            nx = ny = 0;
                        } else if (i === m - 2) {
                            r = 2;
                            z = 6;
                            nz = 0.5;
                        } else if (i === m - 1) {
                            r = 0;
                            z = 11;
                            nz = 0.3;
                        }

                        let a = (tt * 1.5) * Math.PI;


                        if (i === m - 1) {
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

                        if (i === 0 || i === 1) {
                            ny = 0;
                            nz = -1;
                        } else if (i === m - 4 || i === m - 3) {
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

                        if (i === 0) {
                            r = 0;
                            nz = -1;
                            nx = ny = 0;
                        } else if (i === 1) {
                            nz = -1;
                            nx = ny = 0;
                        } else if (i === 2) {
                            z = 0;
                        } else if (i === 3) {
                            z = 1;
                        } else if (i === 4) {
                            z = 1;
                            nz = 1;
                            nx = ny = 0;
                        } else if (i === 5) {
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
            if (width !== prev_width || height !== prev_height) {
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


            if (ff === undefined)
                ff = 0.5;

            gl.enable(gl.CULL_FACE);

            if (color[3] !== 1) {
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

        for (let i = 0; i < all_drawers.length; i++) {
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
    
    
    function get(l, i, default_) {
        return (l ?? [])[i] ?? default_;
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


        let play = document.createElement("div");
        play.classList.add("play_pause_button");
        play.classList.add("playing");

        let reset = document.createElement("div");
        reset.classList.add("restart_button");
        reset.classList.add("white");


        wrapper.appendChild(canvas);
        container.appendChild(wrapper);

        let disturbance_ttl = 1;

        this.paused = true;
        this.requested_repaint = false;

        this.set_paused = function (p) {

            if (self.paused === p)
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


            let rect = canvas.getBoundingClientRect();

            let wh = window.innerHeight || document.documentElement.clientHeight;
            let ww = window.innerWidth || document.documentElement.clientWidth;
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

        // let rot = rot_y_mat3(-0.6);
        // rot = mat3_mul(rot_x_mat3(0.3), rot);
        
        let rot = mat3_mul(rot_x_mat3(Math.PI / 6), rot_y_mat3(Math.PI / 5));

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

                async function (e) {
                
                    await arcball.startWithBeginEvent(e);

                    // let p = canvas_space(e);
                    // console.log(p);
                    // console.log(canvasSpace(e), width, e.target.width, e.target.getBoundingClientRect())
                    // arcball.start(p[0], p[1]);
                    //
                    // // await canvas.requestPointerLock();
                    // console.log("begin");
                    return true;
                }
                ,
                function (e) {
                    if (true) {
                        rot = arcball.updateWithMoveEvent(e);
                        
                    } else {
                        window.e = e;
                        console.log(e.movementX, e.movementY);
                        arcball.updateDelta(-e.movementX, e.movementY, e.timeStamp);
                        rot = arcball.matrix.slice();
                        
                    }
                    request_repaint();
                    return true;
                },
                function (e) {
                    arcball.end(e.timeStamp);
                },
                { lock: true });
        }



        let arg = new Array(9).fill(0.0)
        let options = [new SliderOptions()];

        // noinspection JSUnusedGlobalSymbols
        this.get_arg = function (i) { return arg[i]; }
        this.set_arg  = function (i, x) { arg[i] = x; if (simulated) self.set_paused(false); request_repaint(); }
        // noinspection JSUnusedGlobalSymbols
        this.get_options = function (i) { return options[i]; }
        this.set_options = function (i, props) { options[i] = props; }
        // noinspection JSUnusedGlobalSymbols
        this.get_percent = function (i) { return between(options[i].from, options[i].upto, arg[i]); }
        // noinspection JSUnusedGlobalSymbols
        this.set_percent = function (i, p) { return this.set_arg(i, lerp(options[i].from, options[i].upto, p)); }

        this.set_rot = function (x) {
            rot = x;
            arcball.set_matrix(x);
            request_repaint();
        }
        
        let y_flip = [1, 0, 0, 0, -1, 0, 0, 0, 1];

        function pointKey(p) {
            return "p" + p[0] + "_" + p[1] + "_" + p[2];
        }

        function edgeKey(p0, p1) {
            if (p0[0] < p1[0]) {
                let tmp = p0; p0 = p1; p1 = tmp;
            } else if (p0[0] === p1[0]) {
                if (p0[1] < p1[1]) {
                    let tmp = p0; p0 = p1; p1 = tmp;
                } else if (p0[1] === p1[1]) {
                    if (p0[2] < p1[2]) {
                        let tmp = p0; p0 = p1; p1 = tmp;
                    }
                }
            }

            return "e" + p0[0] + "_" + p0[1] + "_" + p0[2] + "|" + p1[0] + "_" + p1[1] + "_" + p1[2] + "|";
        }

        /* Just for convex polys. */
        /*
        function Poly(points, fillColor) {
            this.points = points;
            this.fillColor = fillColor;

            this.pointKey = function (i) {
                return pointKey(this.points[i]);
            }

            this.edgeKey = function (i) {
                let p0 = this.points[i];
                let p1 = this.points[(i + 1) % this.points.length];

                return edgeKey(p0, p1);
            }
        }
        */
        class Poly {
            constructor(points, fillColor) {
                this.points = points
                this.fillColor = fillColor
            }
            
            pointKey(i) {
                return pointKey(this.points[i])
            }
            
            edgeKey (i) {
                let p0 = this.points[i];
                let p1 = this.points[(i + 1) % this.points.length];

                return edgeKey(p0, p1);
            }
        }
        

        function project(p) {
            let s = -0.001;
            let z = (1.0 + p[2] * s);
            return [p[0] / z, p[1] / z, -z];
        }
        
        function draw_polys(ctx, polys, vp) {
            polys = polys.slice();
            for (let i = 0; i < polys.length; i++) {
                polys[i] = polys[i].slice();

            }
            {
                let i = polys.length;
                while (i--) {
                    if (polys[i].length < 2) {
                        polys.splice(i, 1);
                    }
                }
            }

            for (let i = 0; i < polys.length; i++) {
                for (let j = 0; j < polys[i].length; j++) {
                    polys[i][j] = mat3_mul_vec(vp, polys[i][j]);
                }
            }

            polys.sort(function (a, b) {
                let norm = vec_cross(vec_sub(a[2], a[0]), vec_sub(a[1], a[0]));
                let d = vec_dot(norm, a[0]);
                if (norm[2] === 0)
                    return 0;

                let dist = 0;
                for (let i = 0; i < b.length; i++) {
                    dist += vec_dot(norm, b[i]) - d;
                }
                if (norm[2] < 0)
                    return dist < 0 ? -1 : 1;

                return dist > 0 ? -1 : 1;
            });

            ctx.lineJoin = "round";
            for (let i = 0; i < polys.length; i++) {
                if (polys[i].length === 0)
                    continue;


                ctx.beginPath();
                let p = project(polys[i][0]);
                ctx.moveTo(p[0], p[1]);
                for (let j = 1; j < polys[i].length; j++) {
                    let p = project(polys[i][j]);
                    ctx.lineTo(p[0], p[1])
                }

                ctx.closePath();
                ctx.fill();
                ctx.stroke();
            }
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

                let a = vec_cross(p[p.length - 1], p[0])[2];

                for (let i = 1; i < p.length; i++) {
                    a += vec_cross(p[i-1], p[i])[2];
                }

                if (a < 0)
                    p = p.reverse();

                return p;
            }

            function clip(a, b) {

                let points = a.slice();
                let prev_b = b[b.length - 1];

                function is_in(point, edge0, edge1) {
                    if (point[0] === edge0[0] && point[1] === edge0[1])
                        return false;

                    if (point[0] === edge1[0] && point[1] === edge1[1])
                        return false;

                    let clip_edge = vec_sub(edge1, edge0);
                    let rel = vec_sub(point, edge0);

                    return vec_cross(rel, clip_edge)[2] > 0;
                }

                function intersect(p, pp, q, pq) {

                    if (pp[0] === pq[0] && pp[1] === pq[1])
                        return pp;

                    if (p[0] === q[0] && p[1] === q[1])
                        return p;

                    if (pp[0] === q[0] && pp[1] === q[1])
                        return pp;

                    if (p[0] === pq[0] && p[1] === pq[1])
                        return p;

                    let r = vec_sub(p, pp);
                    let s = vec_sub(q, pq);

                    let t = vec_cross(vec_sub(pq, pp), s)[2] / vec_cross(r, s)[2];

                    return [pp[0] + t * r[0], pp[1] + t * r[1], 1/(1/pp[2] + t * (1/p[2] - 1/pp[2]))];
                }


                for (let i = 0; i < b.length; i++) {
                    let new_points = []
                    let curr_b = b[i];

                    if (curr_b[0] !== prev_b[0] || curr_b[1] !== prev_b[1]) {
                        let prev = points[points.length - 1];
                        for (let j = 0; j < points.length; j++) {
                            let curr = points[j];

                            if (curr[0] !== prev[0] || curr[1] !== prev[1]) {
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

                for (let j = 1; j < points.length; j++) {
                    if (points[j-1][0] === points[j][0] &&
                        points[j-1][1] === points[j][1] &&
                        points[j-1][2] === points[j][2]) {
                        points.splice(j,1);
                        j--;
                    }
                }

                if (points.length > 1 &&
                    points[points.length - 1][0] === points[0][0] &&
                    points[points.length - 1][1] === points[0][1] &&
                    points[points.length - 1][2] === points[0][2]) {
                    points.pop();
                }


                return points;
            }

            function area2d(p) {

                if (p.length < 3)
                    return 0;

                let a = (vec_cross(p[p.length - 1], p[0]))[2];

                for (let i = 1; i < p.length; i++) {
                    a += (vec_cross(p[i-1], p[i]))[2];
                }

                return Math.abs(a);
            }



            function compare(a, b) {
                let a_points = cc_normalize_points(a.points.slice());
                let b_points = cc_normalize_points(b.points.slice());

                let int_a = clip(a_points, b_points);
                if (int_a.length < 3)
                    return 0;

                let int_b = clip(b_points, a_points);
                if (int_b.length < 3)
                    return 0;

                if (area2d(int_a) < 1)
                    return 0;

                let avg_a = 0;
                let avg_b = 0;

                for (let i = 0; i < int_a.length; i++)
                    avg_a += int_a[i][2];

                for (let i = 0; i < int_b.length; i++)
                    avg_b += int_b[i][2];

                return avg_a / int_a.length - avg_b / int_b.length;
            }

            function topo_sort(polys) {

                let graph = [];
                let in_deg = [];
                for (let i = 0; i < polys.length; i++) {
                    in_deg.push(0);
                    graph.push([]);
                }

                for (let i = 0; i < polys.length; i++) {
                    for (let j = i + 1; j < polys.length; j++) {
                        let val = compare(polys[i], polys[j]);

                        if (val < 0) {
                            graph[i].push(j);
                            in_deg[j]++;
                        } else if (val > 0) {
                            graph[j].push(i);
                            in_deg[i]++;
                        }
                    }
                }

                let no_incoming = [];

                for (let i = 0; i < polys.length; i++) {
                    if (in_deg[i] === 0)
                        no_incoming.push(i);
                }

                let sorted = [];

                let visited = [];

                while (no_incoming.length > 0) {
                    let node = no_incoming.pop();
                    sorted.push(polys[node]);

                    visited.push(node);
                    for (let i = 0; i < graph[node].length; i++) {
                        in_deg[graph[node][i]]--;

                        if (in_deg[graph[node][i]] === 0)
                            no_incoming.push(graph[node][i]);
                    }
                }

                return sorted;
            }

            if (!intersections)
                polys = topo_sort(polys);

            let edge_map = {};
            let point_map = {};

            for (let i = 0; i < polys.length; i++) {
                for (let j = 0; j < polys[i].points.length; j++) {
                    edge_map[polys[i].edgeKey(j)] = i;
                    point_map[polys[i].pointKey(j)] = i;
                }
            }

            ctx.lineJoin = "round";
            for (let i = 0; i < polys.length; i++) {
                if (polys[i].points.length === 0)
                    continue;

                ctx.beginPath();
                let p = (polys[i].points[0]);
                ctx.moveTo(p[0], p[1]);
                for (let j = 1; j < polys[i].points.length; j++) {
                    let p = (polys[i].points[j]);
                    ctx.lineTo(p[0], p[1])
                }

                ctx.closePath();

                ctx.fillStyle = polys[i].fillColor ? polys[i].fillColor : fillStyle;
                ctx.fill();

                for (let j = 0; j < polys[i].points.length; j++) {

                    let edge_key = polys[i].edgeKey(j);
                    if (edge_map[edge_key] !== i)
                        continue;

                    let p0 = polys[i].points[j];
                    let p1 = polys[i].points[(j + 1) % polys[i].points.length];

                    ctx.strokeStyle = edgeStyleMap && edgeStyleMap[edge_key] ? edgeStyleMap[edge_key] : edgeStyle;
                    ctx.beginPath();
                    ctx.moveTo(p0[0], p0[1])
                    ctx.lineTo(p1[0], p1[1])
                    ctx.stroke();
                }

                for (let j = 0; j < polys[i].points.length; j++) {
                    let point_key = polys[i].pointKey(j);
                    if (point_map[point_key] !== i)
                        continue;

                    let p0 = polys[i].points[j];

                    ctx.fillStyle = cornerStyleMap && cornerStyleMap[point_key] ? cornerStyleMap[point_key] : cornerStyle;

                    ctx.beginPath();
                    ctx.ellipse(p0[0], p0[1], radius, radius, 0, 0, Math.PI * 2);
                    ctx.closePath();
                    ctx.fill();

                }
            }

            ctx.restore();
        }

        let cube_walls = [
            [0, 2, 3, 1], // +y
            [4, 6, 7, 5], // -y
            
            [2, 6, 7, 3], // +x
            [0, 4, 5, 1], // -x
            
            [0, 4, 6, 2], // +z
            [1, 3, 7, 5], // -z
        ];
        
        function cube_points(model, tr, ext = [1, 1, 1]) {
            // let vp = MMat(model)
            // let world = MMat.ident(vp.dimensions())
            //
            // world.translate_(tr)
            // // world.scale_(ext)
            // // world.translate_([0.5, 0.5, 0.5])
            //
            // // mat = MMat.translate(mat.dimensions(), tr).mul(mat);
            // // mat.translate_(tr)
            // // mat.translate_(-0.5)
            // // let mat = world.mul(model)
            // // let mat = MMat(world.mul(vp))
            //
            // let mat = vp.mul(world);
            // window.vp = vp;

            let mat = MMat(model);
            let world = MMat(mat3_to_mat4(mat.data()));
            // world = world.mul(MMat.translate(world.dimensions(), tr))
            world.translate_(tr)
            world.scale_(ext)
            world.translate_(-0.5)
            mat = world

            let points = [];
            /*

                    1   3
                0   2
  
                    5   7
                4   6

             */
            for (let x = 0; x <= 1; x++) {
                for (let y = 0; y <= 1; y++) {
                    for (let z = 0; z <= 1; z++) {
                        // let p = [(x - 0.5)*ext[0], (y - 0.5)*ext[1], (z - 0.5)*ext[2]];
                        // p[0] += tr[0];
                        // p[1] += tr[1];
                        // p[2] += tr[2];
                        // p = mat3_mul_vec(model, p);

                        let p = MVec([x, y, z])//.sub(0.5).mul(ext).add(tr)
                        p = mat.transform(p).data().slice(0, 3)

                        points.push(p);
                    }
                }
            }

            return points;
        }

        function cube_points2(model, tr, ext = [1, 1, 1]) {
            let points = 0 ? vertexArray : [];
            /*

                    1   3
                0   2

                    5   7
                4   6

             */
            for (let x = 0; x <= 1; x++) {
                for (let y = 0; y <= 1; y++) {
                    for (let z = 0; z <= 1; z++) {
                        let p = [(x - 0.5)*ext[0], (y - 0.5)*ext[1], (z - 0.5)*ext[2]];
                        p[0] += tr[0];
                        p[1] += tr[1];
                        p[2] += tr[2];
                        p = mat3_mul_vec(model, p);
                        points.push(SPolygonVertex.fromPosition(p));
                    }
                }
            }

            return points;
        }

        function cube_polys(model, tr, ext = [1, 1, 1]) {
            let points = cube_points(model, tr, ext);

            let polys = [];
            for (let i = 0; i < 6; i++) {
                polys.push([points[cube_walls[i][0]],
                    points[cube_walls[i][1]],
                    points[cube_walls[i][2]],
                    points[cube_walls[i][3]]
                ]);
            }
            return polys;
        }

        function cube_polys2(model, tr, ext = [1, 1, 1]) {
            let points = cube_points2(model, tr, ext);

            let polys = [];
            for (let i = 0; i < 6; i++) {
                polys.push(GrPolygon.fromVertices([
                    points[cube_walls[i][0]],
                    points[cube_walls[i][1]],
                    points[cube_walls[i][2]],
                    points[cube_walls[i][3]]
                ]));
            }
            return polys;
        }

        function draw_axes(ctx, mvp, dim = 3, flat = false) {
            let points = [[0, 0, 0], [2.2, 0, 0], [0, 2.2, 0], [0, 0, 2.2]];

            if (flat)
                points = [[0, 0, 0], [2.0, 0, 0], [0, 2.0, 0], [-1.0, -1.0, 0]];



            for (let i = 0; i < points.length; i++) {
                points[i] = project(mat3_mul_vec(mvp, points[i]));
            }

            ctx.strokeStyle = base_axis_color;
            ctx.fillStyle = base_axis_color;

            for (let i = 0; i < dim; i++) {
                ctx.beginPath();
                ctx.moveTo(points[0][0], points[0][1]);
                ctx.lineTo(points[i + 1][0], points[i + 1][1]);
                ctx.stroke();

                let offset = 14;
                let dir = vec_norm([points[i + 1][0] - points[0][0], points[i + 1][1] - points[0][1]]);
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
            ctx.beginPath();
            ctx.roundRect(Math.ceil(p[0]*scale)/scale - w/2, Math.ceil(p[1]*scale)/scale - h/2, w, h, 5);
            ctx.fill();

            ctx.fillStyle = "#333";

            ctx.fillText(str, Math.ceil(p[0]*scale)/scale, Math.ceil((p[1] + 7)*scale)/scale);

            ctx.restore();
        }


        let aspect = width / height;

        let proj_w;
        let proj_h;

        let proj;


        this.on_resize = function () {
            let new_width = wrapper.clientWidth;
            let new_height = wrapper.clientHeight;

            if (new_width !== width || new_height !== height) {

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
            let clip_y = 0.0;

            let clipped_poly = [];

            function is_in(p) {
                return sign ? (p[1] >= clip_y) : (p[1] < clip_y);
            }

            let prev = poly[poly.length - 1];
            for (let j = 0; j < poly.length; j++) {
                let curr = poly[j];

                if (!vec_eq(curr, prev)) {
                    if (is_in(curr)) {
                        if (!is_in(prev)) {
                            let dy = curr[1] - prev[1];
                            let t = (clip_y - prev[1]) / dy;
                            let p = vec_lerp(prev, curr, t);
                            p[1] = 0;
                            clipped_poly.push(p);
                        }

                        clipped_poly.push(curr);
                    } else if (is_in(prev)) {
                        let dy = curr[1] - prev[1];
                        let t = (clip_y - prev[1]) / dy;
                        let p = vec_lerp(prev, curr, t);
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
            if (total_weight === 0)
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
            const g = Graphics.fromContext(ctx);

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
            
            // ctx.save()
            // ctx.lineWidth = 1.0;
            // ctx.strokeRect(0, 0, width, height);
            // // ctx.beginPath()
            // // ctx.lineTo(0, 0)
            // // ctx.lineTo(0, height)
            // // ctx.lineTo(width, height)
            // // ctx.lineTo(width, 0)
            // // ctx.lineTo(0, 0)
            // // ctx.stroke()
            // ctx.restore()
            g.drawRectangle(Pen.fromColor(Color.Black), new Rectangle(0, 0, width, height));



            function draw_arrow(pos, angle, size) {

                if (size === 0)
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

            const baseColor = Color.parse("#F0EBE3");
            const wallColor = Color.parse("#F3D0D7");
            
            let x_color = Color.fromHex("#ff7777")
            let y_color = Color.fromHex("#77ff77")

            const wallBrush2 = new HatchBrush(
                HatchStyle.LargeCheckerBoard,
                wallColor,
                wallColor.withOpacity(/*arg[2]*/ 1.0).scaleRGB(Math.pow(0.9, 1/2.2)).sourceOver(baseColor));
            
            const wallBrush = new HatchBrush(
                HatchStyle.LargeCheckerBoard,
                x_color.withOpacity(0.15),
                y_color.withOpacity(0.15));

            function draw_map_base(map_width, map_height) {
                let rect = new Rectangle(0, 0, map_width, map_height);
                ctx.save();
                // ctx.shadowColor = `rgba(0,0,0,0.4)`;
                ctx.shadowColor = Color.Black.withOpacity(0.4).toHtml();
                ctx.shadowBlur = 7.5 * scale;
                ctx.shadowOffsetY = 5 * scale;
                g.fillRectangle(baseColor, rect);
                ctx.restore();
                // let pen = Pen.fromColor(Color.Red.withOpacity(arg[4]).sourceOver(baseColor))
                // let pen = Pen.fromBrush(wallBrush, arg[4]*8);
                // let pen = "#ff0000";
                let pen = Pen.fromColor(Color.Magenta, arg[4])
                // let pen = Color.DarkGray;
                rect.inflate(-10, -10);
                g.drawRectangle(pen, rect);
                return baseColor;
            }
            
            function cube(proj, tr = [0, 0, 0], ext = [1, 1, 1], fillColor = cube_side_color) {
                let cube_p = cube_polys(proj, tr, ext);

                let polys = [];

                for (let i = 0; i < cube_p.length; i++) {
                    let pts = [];
                    for (let j = 0; j < cube_p[i].length; j++) {
                        pts.push(project(cube_p[i][j]));
                    }
                    polys.push(new Poly(pts, fillColor));
                }
                return polys;
            }

            function cube2(proj, tr = [0, 0, 0], ext = [1, 1, 1], fillColor = cube_side_color) {
                let cube_p = cube_polys2(proj, tr, ext);

                let polys = [];

                for (let i = 0; i < cube_p.length; i++) {
                    let pts = [];
                    for (let j = 0; j < cube_p[i].length; j++) {
                        pts.push(project(cube_p[i][j]));
                    }
                    polys.push(new Poly(pts, fillColor));
                }
                return polys;
            }

            function d3d_cube_rot(mvp = rot) {
                let size = width * 0.55;

                ctx.save();
                ctx.translate(width * 0.5, height * 0.5);

                let proj_rot = ident_matrix;
                proj_rot = mat3_mul(proj_rot, y_flip);
                proj_rot = mat3_mul(proj_rot, mvp);
                proj_rot = mat3_mul(proj_rot, y_flip);

                let proj = mat3_mul(scale_mat3(size), proj_rot);

                // let cube_p = cube_polys(proj, [0, 0, 0]);

                // let polys = [];
                //
                // for (let i = 0; i < cube_p.length; i++) {
                //     let pts = [];
                //     for (let j = 0; j < cube_p[i].length; j++) {
                //         pts.push(project(cube_p[i][j]));
                //     }
                //     polys.push(new Poly(pts));
                // }


                let U = lerp(0.1, 1, arg[1]);
                let dU = lerp(0.01, 0.1, arg[0]);
                let polys = cube(proj, [0, 0, 0], [U, U, U]);
                let margin = 0.1;
                // polys.push(...cube(proj, [-(U - (U-dU-margin)/2), 0, 0], [dU, U, U], Color.Red.withOpacity(0.5).toHtml()));
                // polys.push(...cube(proj, [0, -(U - (U-dU-margin)/2), 0], [U, dU, U], Color.Green.withOpacity(0.5).toHtml()));
                // polys.push(...cube(proj, [0, 0, (U - (U-dU-margin)/2)], [U, U, dU], Color.Blue.withOpacity(0.5).toHtml()));
                polys.push(...cube(proj, [-(U - (U-dU-margin)/2), 0, 0], [dU, U, U], side_color));
                polys.push(...cube(proj, [0, -(U - (U-dU-margin)/2), 0], [U, dU, U], side_color));
                polys.push(...cube(proj, [0, 0, (U - (U-dU-margin)/2)], [U, U, dU], side_color));
                {
                    draw_polys2(ctx, polys, cube_side_color, cube_edge_color, "#333", 0, 0, 3, 2);
                    // draw_polys2(ctx, polys, side_color, edge_color, corner_color, 0, 0, 4, 3);
                }

                ctx.restore();
                
                window.raphson = (f, df, x, N = 5) => {
                    let r = x;
                    for (let i = 0; i < N; i++) {
                        r -= f(r) / df(r);
                    }
                    return r;
                }
            }

            if (mode === "cube") {
                d3d_cube_rot();
            } else if (mode === "wall") {
                    // ctx.translate(0, height);
                    // ctx.scale(1, -1);
                    
                    // ctx.save();
                    ctx.translate(width/2, height/2);
                    
                    let w = width/1.1;
                    let h = height/1.1;
                    ctx.translate(-w/2, -h/2);
                    const baseColor = draw_map_base(w, h);
                    
                    let S = 10;
                    let N = 1;
                    // ctx.scale(S, S)

                    function roundTo(x, n = N) {
                        return parseFloat(x.toFixed(n));
                    }

                    function rlerp(a, b, x, n = N) {
                        return roundTo(Util.lerp(a, b, x), n)
                    }

                    let x = Util.lerp(width-w, w, 0.1);
                    let y = Util.lerp(height-h, h, 0.0);

                    if (0) {
                        ctx.fillStyle = wallBrush.pattern(ctx);
                        // ctx.fillStyle.setTransform(new DOMMatrix().translate(-w/2, -h/2));
                        ctx.fillStyle.setTransform(new DOMMatrix().translate(x, y))

                        // ctx.strokeStyle = ctx.fillStyle;
                        ctx.strokeStyle = Color.Black.withOpacity(0.4).toHtml()

                        ctx.beginPath();
                        ctx.rect(0, 0, w, h);
                        ctx.clip();
                        // ctx.rect(x, y, 100, 100)
                        ctx.roundRect(x, y, 100, 100, 5)
                        // ctx.closePath()
                        ctx.fill();
                        ctx.stroke();
                    } else {
                    
                        window.uv = function uv([_u, _v = _u], [du = 1, dv = du] = []) {
                            return (
                                _u*_v + 
                                _u*dv + _v*du + 
                                du*dv
                            );
                        }
                        window.uvB = function uvB([_u, _v = _u], [du = 1, dv = du] = []) {
                            return (_u + du) * (_v + dv);
                        }
                        window.uu = function uu(_u, du= 1) {
                            return (
                                _u*_u +
                                _u*du + _u*du +
                                du*du
                            );
                        }
                        window.uuB = function uuB(_u, du = 1) {
                            // return (_u + du) * (_u + du);
                            return uvB([_u, _u], [du, du]);
                        }
                        window.uvw = function uvw([_u, _v = _u, _w = _v], [du = 1, dv = du, dw = dv] = []) {
                            return (
                                _u*_v*_w +
                                _u*_v*dw + _v*_w*du + _w*_u*dv +
                                _u*dv*dw + _v*dw*du + _w*du*dv +
                                du*dv*dw
                                );
                        }
                        window.uvwB = function uvwB([_u, _v = _u, _w = _v], [du = 1, dv = du, dw = dv] = []) {
                            return (_u + du) * (_v + dv) * (_w + dw);
                        }
                        window.d_u = function d_uv(_u, du = 1) {
                            return (_u + du) - _u;
                        }
                        window.d_uv = function d_uv([_u, _v = _u], [du = 1, dv = du] = []) {
                            // return (_u + du) * (_v + dv) - _u*_v;
                            return uv([_u, _v], [du, dv]) - _u*_v;
                        }
                        window.d_uvw = function d_uv([_u, _v = _u, _w = _v], [du = 1, dv = du, dw = dv] = []) {
                            // return (_u + du) * (_v + dv) * (_w + dw) - _u*_v*_w;
                            return ((_u + du) * (_v + dv) * (_w + dw) - _u*_v*_w) / ((du + dv + dw) / 3);
                        }
                        window.d_u2 = function d_u2(_u, du = 1) {
                            return d_uv([_u, _u], [du, du]);
                        }
                        window.d_u3 = function d_u3(_u, du = 1) {
                            return d_uvw([_u, _u, _u], [du, du, du]);
                        }
                        window.d_un = function d_un([_u, du = 1], n) {
                            // return Math.pow(_u + du, n) - Math.pow(_u, n);
                            return n * Math.pow(_u, n - 1) * du;
                        }
                        window.integrate = function integrate(d_f, a, b, f0 = 0, steps = 100, offset = 0.5) {
                            let d_u = (b - a) / steps;
                            let u = a + offset * d_u;
                            let v = f0;
                            for (let i = 0; i < steps; i++) {
                                v += d_f(u, v, d_u) * d_u;
                                u += d_u;
                            }
                            return v;
                        }
                        // > integrate((u, v, d_u) => v, 0, 1, 1, 1e5)
                        // 2.7182682371744953
                        
                        window.d_f_u = function d_f_u(f, [u, du = 1], ...args) {
                            return f(u + du, ...args) - f(u, ...args)
                        }
                        window.d_f_du = function d_f_du(f, [u, du = 1], ...args) {
                            return (f(u + du, ...args) - f(u, ...args)) / du
                        }
                        window.d_f_dudv = function d_f_dudv(f, [u, du = 1], [v, dv = 1], ...args) {
                            return (
                                (f(u + du, v, ...args) - f(u, v, ...args))*(f(u, v + dv, ...args) - f(u, v, ...args)) +
                                // (f(u, v + dv, ...args) - f(u, v, ...args))/dv +
                                // (f(u + du, v, ...args) - f(u, v, ...args))/du +
                                // (f(u, v + dv, ...args) - f(u, v, ...args))/dv +
                                // // (f(u + du, v + dv, ...args) - f(u, v, ...args)) * du * dv +
                                0
                            );
                        }
                        window.d_f_uv = function d_f_uv(f, [u, du = 1], [v = u, dv = 1], ...args) {
                            return f(u + du, v, ...args) + f(u, v + dv, ...args) - 2 * f(u, v, ...args)
                            // return (f(u + du, v, ...args) - f(u, v, ...args)) * (f(u, v + dv, ...args) - f(u, v, ...args))
                            // return d_f_du(f, [u, du], ...args)
                        }
                        window.f_uv = function f_uv(f, [u, du = 1], [v = u, dv = 1], ...args) {
                            return f(u, v, ...args) + d_f_uv(f, [u, du], [v, dv], ...args);
                        }
                        window.uuu = function uuu(_u, du = 1) {
                            return (
                                _u*_u*_u +
                                _u*_u*du + _u*_u*du + _u*_u*du +
                                _u*du*du + _u*du*du + _u*du*du +
                                du*du*du
                            );
                        }
                        window.uuuB = function uuu(_u, du = 1) {
                            return (_u + du) * uv(_u, du);
                        }
                        window.uvwx = function uvwx(_u, du = 1, _v = _u, dv = du, _w = _v, dw = dv, _x = _w, dx = dw) {
                            return (
                                _u*_v*_w*_x + 
                                _u*_v*_w*dx + _v*_w*_x*du + _w*_x*_u*dv + _x*_u*_v*dw +
                                _u*_v*dw*dx + _v*_w*dx*du + _w*_x*du*dv + _x*_u*dv*dw + du*_v*dw*_x + _u*dv*_w*dx +
                                _u*dv*dw*dx + _v*dw*dx*du + _w*dx*du*dv + _x*du*dv*dw +
                                du*dv*dw*dx + 
                                0
                            );
                        }
                        window.uvwxB = function uvwxB(_u, du = 1, _v = _u, dv = du, _w = _v, dw = dv, _x = _w, dx = dw) {
                            return (_u + du) * (_v + dv) * (_w + dw) * (_x + dx);
                        }
                        window.uvuv = function uvuv(_u, du = 1, _v = _u, dv = du) {
                            return (
                                _u*_v*_u*_v +
                                _u*_v*_u*dv + _v*_u*_v*du + _u*_v*_u*dv + _v*_u*_v*du +
                                _u*_v*du*dv + _v*_u*dv*du + _u*_v*du*dv + _v*_u*dv*du + du*_v*du*_v + _u*dv*_u*dv +
                                _u*dv*du*dv + _v*du*dv*du + _u*dv*du*dv + _v*du*dv*du +
                                du*dv*du*dv +
                                0
                            );
                        }
                        Math.sqr = (x) => (x*x);
                        window.uvuvB = function uvuvB(_u, du = 1, _v = _u, dv = du) {
                            return Math.sqr(uvB(_u, du, _v, dv));
                        }
                        window.uuuu = function uuuu(_u, du = 1) {
                            return (
                                _u*_u*_u*_u +
                                _u*_u*_u*du + _u*_u*_u*du + _u*_u*_u*du + _u*_u*_u*du + 
                                _u*_u*du*du + _u*_u*du*du + _u*_u*du*du + _u*_u*du*du + _u*_u*du*du + _u*_u*du*du +
                                _u*du*du*du + _u*du*du*du + _u*du*du*du + _u*du*du*du +
                                du*du*du*du
                            );
                        }
                        
                        window.uuuuB = function uuuu(_u, du = 1) {
                            return (_u + du) * uvw(_u, du);
                        }

                        let dW = rlerp(0, 10, Util.saturate(arg[0]), 1)*S;
                        let dH = rlerp(0, 10, Util.saturate(arg[0]), 1)*S;

                        let rect = new Rectangle(x, y,
                            rlerp(10, 20, (arg[3]+arg[2]/2), 0)*S,
                            rlerp(10, 20, (arg[3]+arg[2]/2), 0)*S);
                            
                        let bW = new Rectangle(rect.Right + 5, rect.Top, dW, rect.Height);
                        let bH = new Rectangle(rect.Left, rect.Bottom + 5, rect.Width, dH);
                        let bWbH = new Rectangle(rect.Right + 5, rect.Bottom + 5, dW, dH);
                    
                        g.setClip(new Rectangle(0, 0, w, h));
                        g.fillRectangle(wallBrush, rect, 1);
                        // g.drawRectangle(Color.Black.withOpacity(0.4), rect, 10)
                        // g.drawArc(Color.Black.withOpacity(0.4), rect, 0, 3*Math.PI/4)
                        g.drawShape(Pen.fromColor(Color.Black.withOpacity(0.4), 3), () => {
                            g.rectangle(rect, 1);
                            // g.rectangle(rect.withInflate(-10, -10), 10);
                            // g.arc(rect, 0, lerp(0, 2*Math.PI, arg[2]));
                        })
                        
                        g.fillRectangle(x_color, bW, 0);
                        g.fillRectangle(Color.fromHex("#77ff77"), bH, 0);
                        // g.fillRectangle(wallBrush, bWbH, 0);
                        
                        g.setClip(Rectangle.Empty)

                        let lbl = new Label();
                        lbl.Font = new Font(DefaultFontFamily(), DefaultFontSize() / 2);
                        lbl.Location = rect.Location;
                        let U = "W";
                        let V = "H";
                        let u = "w";
                        let v = "h";
                        // lbl.ForeColor = Color.Red;
                        {
                            // lbl.Text = `${U}•${V} = ${(rect.Width/S * rect.Height/S).toFixed(N-1)}`;
                            lbl.Text = `${U}•${V}`;
                            lbl.TextAlign = ContentAlignment.MiddleCenter;
                            lbl.Location = rect.Center;
                            lbl.paint(g)
                        }
                        {
                            // lbl.Text = `${U} = ${(rect.Width/S).toFixed(0)}`;
                            lbl.Text = `${U}`;
                            lbl.TextAlign = ContentAlignment.BottomCenter;
                            lbl.Left = rect.Center.X;
                            lbl.Top = rect.Top - 3;
                            lbl.paint(g)
                        }
                        {
                            // lbl.Text = `${V} = ${(rect.Height/S).toFixed(0)}`;
                            lbl.Text = `${V}`;
                            lbl.TextAlign = ContentAlignment.MiddleRight;
                            lbl.Left = rect.Left - 5;
                            lbl.Top = rect.Center.Y;
                            lbl.paint(g)
                        }
                        {
                            // lbl.Text = `d[${U}] = ${(bW.Width/S).toFixed(0)}`;
                            lbl.Text = `${u}`
                            lbl.TextAlign = ContentAlignment.BottomCenter;
                            lbl.Left = bW.Center.X;
                            lbl.Top = rect.Top - 3;
                            lbl.paint(g)
                        }
                        {
                            // lbl.Text = `d[${V}] = ${(bH.Height/S).toFixed(0)}`;
                            lbl.Text = `${v}`;
                            lbl.TextAlign = ContentAlignment.MiddleRight;
                            lbl.Left = rect.Left - 5;
                            lbl.Top = bH.Center.Y;
                            lbl.paint(g)
                        }
                        
                        {
                            // lbl.Text = `${U}•d[${V}] = ${(bH.Width/S * bH.Height/S).toFixed(N-1)}`;
                            lbl.Text = `${U}•${v}`;
                            lbl.TextAlign = ContentAlignment.MiddleCenter;
                            lbl.Left = bH.Center.X;
                            lbl.Top = bH.Center.Y + 3;
                            g.ClipBounds = bH;
                            lbl.paint(g)
                        }
                        
                        {
                            // lbl.Text = `${V}•d[${U}] = ${(bW.Width/S * bW.Height/S).toFixed(N-1)}`;
                            lbl.Text = `${V}•${u}`
                            lbl.TextAlign = ContentAlignment.MiddleCenter;
                            lbl.Left = bW.Center.X;
                            lbl.Top = bW.Center.Y;
                            g.ClipBounds = bW;
                            lbl.paint(g)
                        }
                        
                        if (0)
                        {
                            // lbl.Text = `d[U]•d[${V}] = ${(bWbH.Width/S * bWbH.Height/S).toFixed(N-1)}`;
                            lbl.Text = `d[U]•d[${V}]`
                            lbl.TextAlign = ContentAlignment.MiddleLeft;
                            lbl.Left = bWbH.Center.X;
                            lbl.Top = bWbH.Center.Y;
                            lbl.paint(g)
                        }
                    }

                    // ctx.beginPath();
                    // ctx.lineWidth = 8.0;
                    // ctx.lineTo(x-10, height/2);
                    // ctx.lineTo(x+10, height/2);
                    // ctx.stroke();
                    
            } else if (mode === "dxy") {
                ctx.save()
                ctx.lineWidth = 1.0;
                ctx.fillStyle = "#000";
                ctx.beginPath();
                ctx.lineTo(0, 0);
                ctx.lineTo(0, height);
                ctx.lineTo(width, height);
                ctx.lineTo(width, 0);
                ctx.lineTo(0, 0);
                ctx.stroke();
                ctx.restore()

                ctx.translate(Math.round(width * 0.5), Math.round(height * 0.75));
                ctx.font = "500 " + 10 + "px IBM Plex Sans";

                let w = Math.round(width * lerp(0.25, 0.75, argv[1]));
                let h = Math.round(width * 0.75);
                let r = width * 0.10;
                let wh = h * 0.6;

                let weight_w = w;
                let weight_h = 0.2 * height * arg0;
                let weight_area = weight_w * weight_h;

                let p = lerp(-0.05, 0.9, arg0);
                let y = -h * 0.5 + (h - wh) + p * wh;

                if (1) {
                    ctx.lineCap = "butt";
                    // ctx.lineWidth = 8.0;
                    // ctx.strokeStyle = container_outer_stroke_style;
                    // ctx.stroke();
                    //
                    // ctx.lineWidth = 2.0;
                    // ctx.strokeStyle = container_inner_stroke_style;
                    // ctx.stroke();

                    // ctx.lineWidth = 8.0;
                    // ctx.strokeStyle = container_top_stroke_style;
                    // ctx.beginPath();
                    // ctx.lineTo(-w * 0.5, -h * 0.5);
                    // ctx.lineTo(w * 0.5, -h * 0.5);
                    // ctx.stroke();
                    
                    function rect(x, y, w, h, color) {
                        ctx.beginPath();
                        ctx.strokeStyle = ctx.fillStyle = color;
                        ctx.rect(x, y-h, w, h);
                        ctx.fill();
                        ctx.stroke();
                    }
                    
                    ctx.translate(0, -wh);
                    ctx.translate(0,  h)
                    rect(-w * 0.5, -h * 0.5 - weight_h, w, weight_h, "#3dc6c6");
                    // ctx.beginPath();
                    // ctx.strokeStyle = ctx.fillStyle = "#3dc6c6";
                    // ctx.rect(-w * 0.5, -h * 0.5 - wh - weight_h*2, w, weight_h);
                    // ctx.fill();
                    // ctx.stroke();

                    ctx.fillStyle = "#dc713f";
                    
                    ctx.save();
                    ctx.translate(0, -h * 0.5 - weight_h*2)
                    ctx.translate(0, weight_h/2)
                    ctx.fillText("dh • w", 0, 5)
                    ctx.restore();
                }

                ctx.fillStyle = "#666";
                ctx.strokeStyle = "#444";
                ctx.lineWidth = 2.0;

                if (weight_h > 4 || 1) {
                    ctx.beginPath();
                    ctx.rect(-w * 0.5, -h * 0.5 - weight_h, w, weight_h);
                    ctx.fill();
                    ctx.stroke();
                }
                // else {
                //     ctx.beginPath();
                //     ctx.fillStyle = ctx.strokeStyle;
                //     ctx.rect(-w * 0.5 + 2, -h * 0.5 - weight_h, w - 4, weight_h);
                //     ctx.fill();
                //     // ctx.stroke();
                // }

                let kk = 1.0;

                if (weight_h < 2)
                    ctx.lineWidth = weight_h;

                if (weight_h > 0) {

                    ctx.save();

                    ctx.fillStyle = "#333";
                    // ctx.font = "500 " + w * 0.21 + "px IBM Plex Sans";

                    ctx.translate(0, -h * 0.5 - weight_h * 0.5);
                    ctx.scale(kk, kk);

                    ctx.fillStyle = "#fff";
                    ctx.fillText(`w • h = ${weight_area.toFixed(0)}`, 0, 7)

                    ctx.restore();

                    ctx.save();
                    ctx.fillStyle = "#000";
                    // ctx.font = "500 " + 20 + "px IBM Plex Sans";
                    ctx.translate(-w * 0.5 - 10, -h * 0.5 - weight_h * 0.5);
                    ctx.scale(kk, kk);
                    ctx.textAlign = "right";
                    ctx.fillText(`h = ${weight_h.toFixed(1)}`, 0, 7)
                    ctx.restore();

                    ctx.save();
                    ctx.fillStyle = "#000";
                    // ctx.font = "500 " + 20 + "px IBM Plex Sans";
                    ctx.translate(0, -h * 0.5 + 16);
                    ctx.scale(kk, kk);
                    ctx.fillText(`w = ${weight_w.toFixed(1)}`, 0, 0)
                    ctx.restore();
                }

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

            let drawer = new Drawer(document.getElementById("rc_" + name), name);
            ret.push(drawer);

            if (slider_count === undefined)
                slider_count = 0;

            for (let i = 0; i < slider_count; i++) {
                let defaults = get(args, i, new SliderOptions());
                drawer.set_options(i, defaults);
                let slider = new Slider(
                    document.getElementById("rc_" + name + "_sl" + i),
                    function (x) {
                        drawer.set_arg(i, x);
                    }, 
                    undefined,
                    defaults.value,
                    false,
                    defaults);
                ret.push(slider);
            }

            return ret;
        }

        // make_drawer("brick_container", 1, [0]);
        // weight_pressure = make_drawer("weight_pressure", 4);
        // dxy = make_drawer("dxy", 4, [0.50, 0.25, 0.75, 0.50]);
        // make_drawer("syringe", 1, [0.0]);
        // make_drawer("syringe_pressure", 2);
        // make_drawer("shapes", 1);
        // make_drawer("barrel", 1);
        // make_drawer("water_level", 1);
        // L_demo = make_drawer("L", 1, [0]);
        // loading = make_drawer("loading", 2);
        // make_drawer("brick_scale", 1, [0.0]);
        // make_drawer("brick_forces", 1, [0.0]);
        // make_drawer("brick_wood", 1, [0.0]);
        // wind_tilt = make_drawer("wind_tilt", 2, [0.5, 0.5]);
        // tilt = make_drawer("tilt", 2, [0.5, 0.0]);
        // make_drawer("tilt_meta", 2, [0.5, 0.0]);
        // make_drawer("cgx", 1);
        // slide = make_drawer("slide", 1);
        // free_surface = make_drawer("free_surface", 2);
        // make_drawer("free_surface2", 2);
        // arm_plot = make_drawer("arm_plot", 2, [0.5, 0.0]);
        // make_drawer("curvature_plot", 2, [0.5, 0.0]);
        // cgy_plot = make_drawer("cgy_plot", 3, [0.5, 0.5, 0.0]);
        // make_drawer("cgx_plot", 2, [0.5, 0.5]);
        // make_drawer("propeller", 0);
        //
        // make_drawer("propeller_aoa", 1);
        // make_drawer("propeller_aoa2", 1, [0]);
        // make_drawer("propeller_aoa3", 1, [0]);
        // make_drawer("propeller_pitch", 1);
        // pitch_force = make_drawer("propeller_pitch_force", 1);
        // make_drawer("propeller_twist", 1, [0]);
        // make_drawer("propeller_radial", 0);
        // make_drawer("propeller_forward", 0);
        // make_drawer("helicoid", 2);
        // make_drawer("3d_forces", 0);
        // make_drawer("subdiv", 1, [0]);
        // make_drawer("water_cylinder", 0);
        // make_drawer("tub", 0);
        // make_drawer("height", 0);
        rc_wall = make_drawer("wall", 5, [
            new SliderOptions(1.0, 0.01, 1, wall_fill_style),
            new SliderOptions(1.0, 0.01, 1, wall_stroke_style),
            new SliderOptions(0),
        ]);
        active_objects.push(rc_wall);
        rc_cube = make_drawer("cube", 3, [
            new SliderOptions(1.0, 0, 1, wall_fill_style),
            new SliderOptions(1.0, 0, 1, wall_stroke_style),
            new SliderOptions(0),
        ]);
        active_objects.push(rc_cube);
        // make_drawer("hero", 1);
        // hull_ratio = make_drawer("hull_ratio", 1);
        // let hull = make_drawer("hull", 0);


        // new SegmentedControl(document.getElementById("na_hull_seg0"), function (x) {
        //     hull[0].set_arg0(x);
        // },
        //     ["deck", "bow", "stern", "port", "starboard"]
        // );
        //
        // prop_n = make_drawer("propeller_n", 0);
        // prop_n_seg = new SegmentedControl(document.getElementById("na_propeller_n_seg0"), function (x) {
        //     prop_n[0].set_arg0(x);
        // },
        //     ["2", "3", "4", "5"]
        // );
        //
        // for (let i = 0; i < 4; i++)
        //     active_sliders_held.push(false);
        //
        // active_objects.push(make_drawer("wood_sub", 1, [0.0]));
        // active_objects.push(make_drawer("tub_sub", 1, [0.0]));
        //
        // active_objects.push(make_drawer("wood_tilt", 1));
        // active_objects.push(make_drawer("wood_tilt_f", 1));

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

        for (let i = 0; i < active_objects.length; i++) {
            let func = maker(i);
            active_objects[i][1].knob_div().addEventListener("mousedown", func);
            active_objects[i][1].knob_div().addEventListener("touchstart", func);
        }


        drawers_ready = true;

        for (let i = 0; i < all_drawers.length; i++) {
            all_drawers[i].repaint();
        }

    });
})();
