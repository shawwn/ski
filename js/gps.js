/// <reference path="./base.js" />
"use strict";

let metric = true;

let animated_drawers = [];
let units_drawers = [];

let map_drone0;
let map_sound4;
let map_sound6;
let map_ladder0;
let hill;
let satellite_sim1;
let ellipse;
let geostat_coverage;
let overlap;
let orbital_period;
let orbital_inclination;
let time_dilation;
let signal6;
let signal8;
let signal8_seg;
let signal11;

(function() {

    let scale = window.devicePixelRatio || 1;
    scale = scale > 1.75 ? 2 : 1;


    const pi = Math.PI;

    let all_drawers = [];
    let all_containers = [];
    let earth_drawers = [];

    let touch_size = matchMedia("(pointer:coarse)").matches;

    let orbital_color = rgba255_color(255, 207, 88, 0.15);
    let equatorial_color = rgba255_color(102, 200, 255, 0.15);
    let orbit_color = rgba255_color(223, 200, 141, 0.38);
    let earth_axis_color = rgba255_color(56, 71, 101, 1);

    let marker_styles = [
        "#3FBF15",
        "#4CA3E3",
        "#CD5353",
        "#DCCF45"
    ];

    let sound_style = "rgba(80, 80, 80, 0.8)";

    let coverage_lut = [
        [0, 0, 3, 255],
        [20, 11, 55, 255],
        [59, 14, 99, 255],
        [97, 30, 106, 255],
        [135, 46, 101, 255],
        [172, 64, 86, 255],
        [204, 90, 66, 255],
        [226, 124, 54, 255],
        [238, 168, 61, 255],
        [241, 214, 95, 255],
        [252, 254, 174, 255],
        [252, 254, 174, 255],
        [252, 254, 174, 255],
        [252, 254, 174, 255],
        [252, 254, 174, 255],
        [252, 254, 174, 255],
    ];

    let coverage_lut_size = coverage_lut.length;
    let coverage_lut_scale = (1.0 / (coverage_lut_size - 1)) * (coverage_lut_size - 1) / coverage_lut_size;


    let random_vertices = [];
    let random_numbers = [];

    {
        let fi = 0.5 * (1 + Math.sqrt(5));
        let a = (2.0 - fi) * 2.0 * Math.PI;

        for (let i = 1; i < 128; i++) {

            let lat = Math.asin(-1 + 2 * i / 128) + Math.random() * 0.05;
            let lon = a * i + Math.random() * 0.08;

            let x = Math.cos(lon) * Math.cos(lat);
            let y = Math.sin(lon) * Math.cos(lat);
            let z = Math.sin(lat);

            random_vertices.push([x, y, z]);
            random_numbers.push(Math.random());
        }
    }

    let chips_in_gold_sequence = 63;

    let gold_sequence0 = [];
    let gold_sequence1 = [];
    let gold_sequence2 = [];
    let gold_sequence3 = [];




    {
        let register0 = [1, 1, 1, 1, 1, 1];
        let register1 = [1, 1, 1, 1, 1, 1];

        for (let i = 0; i < chips_in_gold_sequence; i++) {
            let new_code0 = register0[5] ^ register0[0];
            let code0 = register0.pop();
            register0.splice(0, 0, new_code0);

            let new_code1 = register1[5] ^ register1[4] ^ register1[1] ^ register1[0];


            gold_sequence0.push((register1[5] ^ register1[1]) ^ code0 == 0 ? -1 : 1);
            gold_sequence1.push((register1[3] ^ register1[1]) ^ code0 == 0 ? -1 : 1);
            gold_sequence2.push((register1[4] ^ register1[2]) ^ code0 == 0 ? -1 : 1);
            gold_sequence3.push((register1[0] ^ register1[2]) ^ code0 == 0 ? -1 : 1);

            register1.pop();
            register1.splice(0, 0, new_code1);
        }
    }

    let prn_sequence0 = [];
    let prn_sequence1 = [];
    let prn_sequence2 = [];
    let long_bit_sequence = [1, -1, 1, -1, -1, 1, 1];

    {
        let register0 = Array(10).fill(1);
        let register1 = Array(10).fill(1);

        for (let i = 0; i < 1023; i++) {
            let new_code0 = register0[2] ^ register0[9];
            let code0 = register0.pop();
            register0.splice(0, 0, new_code0);

            let new_code1 = register1[1] ^ register1[2] ^ register1[5] ^ register1[7] ^ register1[8] ^ register1[9];


            prn_sequence0.push((register1[1] ^ register1[5]) ^ code0 == 0 ? -1 : 1);
            prn_sequence1.push((register1[2] ^ register1[6]) ^ code0 == 0 ? -1 : 1);
            prn_sequence2.push((register1[3] ^ register1[7]) ^ code0 == 0 ? -1 : 1);

            register1.pop();
            register1.splice(0, 0, new_code1);
        }
    }




    const gps_sat_lon_offset = -123.5 * pi / 180 - pi * 0.5;
    const gps_sat_aol_offset = 1.16052631;
    const gps_sat_glan = [
        [127.85, 74.68, 179.63, 14.69, -1, -1],
        [86.97, 101.25, 140.46, 28.78, 155.98, -1],
        [169.73, 119.69, 103.62, 58.30, 45.95, -1],
        [61.4, 122.78, 135.13, 11.37, 77.47, -1],
        [152.31, 25.09, 79.84, 94.18, 40.63, 160.00],
        [53.23, 100.80, 114.02, 166.39, 1.46, -1],
    ]


    function GLDrawer(scale, ready_callback) {

        let canvas = document.createElement("canvas");
        this.canvas = canvas;
        let gl = canvas.getContext('experimental-webgl', { antialias: true });

        gl.getExtension('OES_element_index_uint');
        gl.getExtension('OES_standard_derivatives');

        let asset_names = ["land", "clouds", "outline"].map(s => s + (scale > 1 ? "0" : "1"));
        let textures = [];
        let assets = [];
        let loaded_assets_count = 0;

        let aniso_ext = (
            gl.getExtension('EXT_texture_filter_anisotropic')
        );

        asset_names.forEach((name, i) => {

            for (let k = 0; k < 2; k++) {

                textures[i * 2 + k] = gl.createTexture();

                gl.bindTexture(gl.TEXTURE_2D, textures[i * 2 + k]);

                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            }
        });

        {
            textures[6] = gl.createTexture();

            gl.bindTexture(gl.TEXTURE_2D, textures[6]);

            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
            let pixels = new Uint8Array(flatten(coverage_lut));

            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, coverage_lut_size, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, pixels);

            let resize_canvas = document.createElement("canvas");
            let ctx = resize_canvas.getContext("2d");

            function asset_loaded() {
                loaded_assets_count++;

                if (loaded_assets_count != asset_names.length)
                    return;

                assets.forEach((asset, i) => {
                    gl.bindTexture(gl.TEXTURE_2D, textures[i * 2]);
                    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, asset);

                    resize_canvas.width = asset.width >> 1;
                    resize_canvas.height = asset.height >> 1;
                    ctx.drawImage(asset, 0, 0, resize_canvas.width, resize_canvas.height);

                    gl.bindTexture(gl.TEXTURE_2D, textures[i * 2 + 1]);
                    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, resize_canvas);
                })

                ready_callback();
            }

            asset_names.forEach((name, i) => {
                let image = new Image();

                assets[i] = image;
                image.onload = asset_loaded;
                image.src = "/images/gps/" + name + ".jpg";
            });
        }



        const float_size = 4;

        let basic_vertex_buffer = gl.createBuffer();
        let basic_index_buffer = gl.createBuffer();

        let sphere_index_offset = 0;
        let sphere_index_count = 0;

        let cube_index_offset = 0;
        let cube_index_count = 0;

        let cone_index_offset = 0;
        let cone_index_count = 0;

        let curve_index_offset = 0;
        let curve_index_count = 0;

        let segment_index_offset = 0;
        let segment_index_count = 0;

        let quad_index_offset = 0;
        let quad_index_count = 0;

        {
            let vertices = [];
            let indices = [];

            sphere_index_offset = indices.length;

            {
                let n = 24;

                let permute = [
                    [0, 1, 2],
                    [1, 2, 0],
                    [2, 0, 1]
                ];

                for (let w = 0; w < 6; w++) {
                    let off = vertices.length / 6;
                    let sign = ((w & 1) ? -1 : 1);
                    for (let j = 0; j <= n; j++) {

                        let s = j / n - 0.5;

                        for (let i = 0; i <= n; i++) {

                            let t = i / n - 0.5;

                            let p = [0, 0, 0];
                            p[permute[w >> 1][0]] = s * sign;
                            p[permute[w >> 1][1]] = t;
                            p[permute[w >> 1][2]] = 0.5 * sign;

                            p = vec_norm(p);

                            vertices.push(p[0]);
                            vertices.push(p[1]);
                            vertices.push(p[2]);

                            vertices.push(p[0]);
                            vertices.push(p[1]);
                            vertices.push(p[2]);
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
            }

            sphere_index_count = indices.length - sphere_index_offset;

            cube_index_offset = indices.length; {
                let n = 1;

                let permute = [
                    [0, 1, 2],
                    [1, 2, 0],
                    [2, 0, 1]
                ];

                for (let w = 0; w < 6; w++) {
                    let off = vertices.length / 6;
                    let sign = ((w & 1) ? -1 : 1);
                    for (let j = 0; j <= n; j++) {

                        let s = j / n - 0.5;

                        for (let i = 0; i <= n; i++) {

                            let t = i / n - 0.5;

                            let p = [0, 0, 0];
                            p[permute[w >> 1][0]] = s * sign;
                            p[permute[w >> 1][1]] = t;
                            p[permute[w >> 1][2]] = 0.5 * sign;

                            let q = [0, 0, 0];
                            q[permute[w >> 1][0]] = 0;
                            q[permute[w >> 1][1]] = 0;
                            q[permute[w >> 1][2]] = sign;

                            vertices.push(p[0]);
                            vertices.push(p[1]);
                            vertices.push(p[2]);

                            vertices.push(q[0]);
                            vertices.push(q[1]);
                            vertices.push(q[2]);
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
            }


            cube_index_count = indices.length - cube_index_offset;


            cone_index_offset = indices.length;

            {
                let n = 64;
                let m = 2;

                let off = vertices.length / 6;

                for (let j = 0; j <= n; j++) {

                    let a = 2 * pi * j / n;
                    let x = Math.cos(a);
                    let y = Math.sin(a);

                    let nx = x * Math.SQRT1_2;
                    let ny = y * Math.SQRT1_2;
                    let nz = Math.SQRT1_2;

                    for (let i = 0; i <= m; i++) {

                        let z = i / m;

                        vertices.push(x * z);
                        vertices.push(y * z);
                        vertices.push(z);

                        vertices.push(nx);
                        vertices.push(ny);
                        vertices.push(nz);
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

            cone_index_count = indices.length - cone_index_offset;

            curve_index_offset = indices.length;

            {
                let n = 192;
                let m = 12;

                let off = vertices.length / 2;

                for (let j = 0; j <= n; j++) {
                    for (let i = 0; i <= m; i++) {
                        vertices.push(j / n);
                        vertices.push(2 * pi * i / m);
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

            segment_index_offset = indices.length;

            {
                let n = 1;
                let m = 12;

                let off = vertices.length / 2;

                for (let j = 0; j <= n; j++) {
                    for (let i = 0; i <= m; i++) {
                        vertices.push(j / n);
                        vertices.push(2 * pi * i / m);
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

            quad_index_offset = indices.length;

            {
                let off = vertices.length / 6;

                for (let i = 0; i < 2; i++) {
                    for (let j = 0; j < 2; j++) {
                        vertices.push(i);
                        vertices.push(j);
                        vertices.push(0);

                        vertices.push(0);
                        vertices.push(0);
                        vertices.push(1);
                    }
                }

                indices.push(off + 0);
                indices.push(off + 1);
                indices.push(off + 2);

                indices.push(off + 2);
                indices.push(off + 1);
                indices.push(off + 3);
            }

            quad_index_count = indices.length - quad_index_offset;


            gl.bindBuffer(gl.ARRAY_BUFFER, basic_vertex_buffer);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
            gl.bindBuffer(gl.ARRAY_BUFFER, null);


            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, basic_index_buffer);
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(indices), gl.STATIC_DRAW);
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
        }

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


        let ellipse_vert_src =
            `
        attribute vec2 v_st;

        uniform mat4 m_mvp;
        uniform mat3 m_rot;

        uniform vec4 params;

        varying vec3 n_dir;
        varying vec3 model_pos;

        void main(void) {
            float x = params.x * cos(v_st.x * params.w);
            float y = params.y * sin(v_st.x * params.w);
            float z = params.z * cos(v_st.y);

            vec2 dir = normalize(vec2(x, y));
            x += params.z * dir.x * sin(v_st.y);
            y += params.z * dir.y * sin(v_st.y);
            
            vec3 n = vec3(dir * sin(v_st.y), cos(v_st.y));

            model_pos = vec3(x,y,z);
            n_dir = m_rot * n;
            gl_Position = m_mvp * vec4(model_pos, 1.0);
        }
        `;

        let segment_vert_src =
            `
        attribute vec2 v_st;

        uniform mat4 m_mvp;
        uniform mat3 m_rot;

        uniform vec3 p0;
        uniform vec3 p1;
        uniform float r;

        varying vec3 n_dir;
        varying vec3 model_pos;

        void main(void) {
            vec3 dummy0 = vec3(0.0, 0.0, 1.0);
            vec3 dummy1 = vec3(0.7071067812, -0.7071067812, 0.0);
            
            vec3 tan = normalize(p1 - p0);

            vec3 norm = abs(dot(tan, dummy0)) > abs(dot(tan, dummy1)) ? cross(tan, dummy1) 
                                                                      : cross(tan, dummy0);
            vec3 bnorm = normalize(cross(norm, tan));

            vec3 n = norm * sin(v_st.y) + bnorm * cos(v_st.y);

            vec3 p = mix(p0, p1, v_st.x) + n * r;;

            model_pos = p;
            n_dir = m_rot * n;
            gl_Position = m_mvp * vec4(p, 1.0);
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

        let disc_frag_src =
            `
        precision mediump float;

        varying vec3 model_pos;

        uniform vec4 color;
        uniform vec4 coords;

        void main(void) {
            vec2 xy = model_pos.xy * coords.xy + coords.zw;
            gl_FragColor = color * (1.0 - smoothstep(0.98, 1.0, length(xy)));
        }
        `;


        let earth_frag_src =
            `
            #extension GL_OES_standard_derivatives : enable

        precision highp float;

        uniform sampler2D tex_ground0;
        uniform sampler2D tex_ground1;
        uniform sampler2D tex_clouds0;
        uniform sampler2D tex_clouds1;

        uniform vec2 params;

        varying vec3 n_dir;
        varying vec3 model_pos;

        
        float hash (vec3 st) {
            return fract(sin(dot(st,
                                 vec3(13.54353, 83.8981, 342.875345)))
                         * 43758.5453123);
        }

        float noise(in vec3 x)
        {
            vec3 i = floor(x);
            vec3 f = x-i;
            
            return mix(mix(mix(hash(i+vec3(0,0,0)), 
                               hash(i+vec3(1,0,0)),f.x),
                           mix(hash(i+vec3(0,1,0)), 
                               hash(i+vec3(1,1,0)),f.x),f.y),
                       mix(mix(hash(i+vec3(0,0,1)), 
                               hash(i+vec3(1,0,1)),f.x),
                           mix(hash(i+vec3(0,1,1)), 
                               hash(i+vec3(1,1,1)),f.x),f.y),f.z);
        }

        void main(void) {
            
            float pi = 3.1415926536;
            
            vec3 xyz = model_pos;

            vec2 ll = vec2(atan(-xyz.y, xyz.x), asin(xyz.z));

            vec2 coord = vec2(1.0 - (ll.x * 0.5 / pi + 0.5), 1.0 - (ll.y  / pi + 0.5));

            float ff = smoothstep(0.0, 0.005, max(fwidth(coord.x), fwidth(coord.y)));

            mediump vec4 color = mix(texture2D(tex_ground0, coord), texture2D(tex_ground1, coord), ff);

            float time = params.x;
            vec2 delta = vec2(0.0);

            delta.x = 5.0*abs(coord.x - 0.5);
            delta.y = coord.y * 3.0;
            delta = vec2(noise(vec3(delta * 12.0, time * 5.0)), noise(vec3(delta * 13.0, time * 8.0)));
            delta = delta * delta * (3.0 - 2.0 * delta);
            delta *= 0.015;
            delta.x -= time * 0.3;
            
            coord += delta * params.y;

            mediump float clouds_a = mix(texture2D(tex_clouds0, coord).r, texture2D(tex_clouds1, coord).r, ff);

            clouds_a = clouds_a * 0.9;

            color.rgb *= 1.0 - clouds_a;
            color.rgb += vec3(clouds_a);

            float haze_a = smoothstep(0.4, 0.95, 1.0 - abs(normalize(n_dir).z));
            color.rgb *= 1.0 - haze_a;
            color.rgb += vec3(113.0/255.0, 116.0/255.0, 142.0/255.0) * haze_a;

            gl_FragColor = color;
        }
        `;

        let coverage_frag_src =
            `
            #extension GL_OES_standard_derivatives : enable

        precision highp float;

        uniform vec3 positions[30];
        uniform vec2 t_map;

        uniform sampler2D lut;
        uniform sampler2D outline0;
        uniform sampler2D outline1;

        varying vec3 n_dir;
        varying vec3 model_pos;

        void main(void) {
            
            float pi = 3.1415926536;
            
            vec3 xyz = model_pos;

            vec2 ll = vec2(atan(-xyz.y, xyz.x), asin(xyz.z));

            vec2 coord = vec2(1.0 - (ll.x * 0.5 / pi + 0.5), 1.0 - (ll.y  / pi + 0.5));
 
            float ff = smoothstep(0.005, 0.01, max(fwidth(coord.x), fwidth(coord.y)));


            mediump float mask = mix(texture2D(outline0, coord), texture2D(outline1, coord), ff).r * 0.7;


            float t = 0.0;

            for (int i = 0; i < 30; i++) {
                vec3 pos = positions[i];
                vec3 dir = pos - xyz;
                t += dot(dir, xyz) > 0.0 ? 1.0 : 0.0;
            }

            t = t * t_map.x + t_map.y;
            
            mediump vec4 color = texture2D(lut, vec2(t, 0.5));
            // color = vec4(t, 0.0, 0.0, 1.0);

            color = color * (1.0 - mask) + mask;
            

            // color = mix(vec4(1.0, 0.0, 0.0, 1.0), vec4(0.0, 1.0, 0.0, 1.0), ff);


            gl_FragColor = color;
        }
        `;

        let edge_frag_src =
            `
        precision mediump float;

        varying vec3 n_dir;
        varying vec3 model_pos;

        uniform vec4 color;
        uniform vec4 clip;

        float hash(vec2 p)
        {
            return fract(sin(dot(p,vec2(129.1,311.7)))*43758.5453123);
        }

        void main(void) {
            
        
            vec3 n = normalize(n_dir);
            float f = 1.0 - abs(n.z);
            f = f * f * f * 0.8 + 0.2;
            
            f *= (254.0/255.0 + 2.0 / 255.0 * hash(gl_FragCoord.xy));

            if (dot(model_pos, clip.xyz) > clip.w)
                f = 0.0;

            gl_FragColor = color * f;
        }
        `;

        let hill_edge_frag_src =
            `
    precision mediump float;

    varying vec3 n_dir;
    varying vec3 model_pos;

    uniform vec4 color;
    uniform vec4 param;

    float hash(vec2 p)
    {
        return fract(sin(dot(p,vec2(129.1,311.7)))*43758.5453123);
    }

    void main(void) {
        
    
        vec3 n = normalize(n_dir);
        float f = 1.0 - abs(n.z);
        f = f * f * f * 0.8 + 0.2;
        
        f *= (254.0/255.0 + 2.0 / 255.0 * hash(gl_FragCoord.xy));

        vec3 pp = model_pos*param.w + param.xyz;

        if (pp.z < 0.0)
            f = 0.0;

        vec3 wall_n = vec3(0.894427190999916, 0.0, -0.44721359549995787);
            
        if (dot(pp, wall_n) > 0.6 * 0.894427190999916 &&
            pp.z < 0.2 && pp.x < 0.7)
            f = 0.0;

        vec2 pos_norm = normalize(param.xz - vec2(0.7, 0.2));
        pos_norm = vec2(-pos_norm.y, pos_norm.x);
        
        vec3 shadow_norm = vec3(pos_norm.x, 0, pos_norm.y);

        if (dot(pp, shadow_norm) > dot(param.xyz, shadow_norm) && pp.x > 0.7)
            f = 0.0;

        gl_FragColor = color * f;
    }
    `;

        let stroke_frag_src =
            `
    precision mediump float;

    varying vec3 n_dir;
    varying vec3 model_pos;

    uniform vec4 color;

    void main(void) {
        
    
        vec3 n = normalize(n_dir);
        float f = 1.0 - abs(n.z);
        
        vec4 c = color;
        c.rgb *= 1.0 - smoothstep(0.2, 0.4, f) * 0.5;
        gl_FragColor = c;
    }
    `;

        let simple_shader = new Shader(gl,
            base_vert_src,
            color_frag_src, ["v_position", "v_normal"], ["m_mvp", "m_rot", "color", "normal_f"]);


        let disc_shader = new Shader(gl,
            base_vert_src,
            disc_frag_src, ["v_position", "v_normal"], ["m_mvp", "m_rot", "color", "coords"]);


        let ellipse_shader = new Shader(gl,
            ellipse_vert_src,
            color_frag_src, ["v_st"], ["m_mvp", "m_rot", "params", "color", "normal_f"]);

        let segment_shader = new Shader(gl,
            segment_vert_src,
            color_frag_src, ["v_st"], ["m_mvp", "m_rot", "p0", "p1", "r", "color", "normal_f"]);


        let earth_shader = new Shader(gl,
            base_vert_src,
            earth_frag_src, ["v_position", "v_normal"], [
                "m_mvp", "m_rot", "tex_ground0", "tex_ground1", "tex_clouds0", "tex_clouds1", "params"
            ]);

        let coverage_shader = new Shader(gl,
            base_vert_src,
            coverage_frag_src, ["v_position", "v_normal"], ["m_mvp", "m_rot", "positions", "t_map", "lut", "outline0", "outline1"]);

        let stroke_shader = new Shader(gl,
            base_vert_src,
            stroke_frag_src, ["v_position", "v_normal"], ["m_mvp", "m_rot", "color"]);

        let edge_shader = new Shader(gl,
            base_vert_src,
            edge_frag_src, ["v_position", "v_normal"], ["m_mvp", "m_rot", "color", "clip"]);

        let hill_edge_shader = new Shader(gl,
            base_vert_src,
            hill_edge_frag_src, ["v_position", "v_normal"], ["m_mvp", "m_rot", "color", "param"]);

        let prev_width, prev_height;

        this.begin = function(width, height) {

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

            gl.disable(gl.CULL_FACE);

            gl.enable(gl.DEPTH_TEST);
            gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
        }

        this.viewport = function(x, y, w, h) {
            gl.viewport(x * scale, y * scale, w * scale, h * scale);
        }


        this.finish = function() {
            gl.flush();
            return gl.canvas;
        }

        this.reset_blending = function() {
            gl.disable(gl.BLEND);
            gl.depthMask(true);
        }

        this.draw_satellite = function(mvp, rot, pos, scale) {

            if (scale === undefined)
                scale = 0.06;


            let sun_a = 0.3;


            let sc1 = scale_mat4([0.8, 2.0, 0.1]);
            let sc2 = scale_mat4([0.2, 0.2, 0.6]);

            let tr1 = translation_mat4([0, -1.7, 0]);
            let tr2 = translation_mat4([0, +1.7, 0]);
            let tr3 = translation_mat4([0, 0, -0.8]);


            let sun_dir = mat3_mul_vec(rot_z_mat3(0.5), mat3_mul_vec(rot_x_mat3(sun_a), [0, 1, 0]));
            let n0 = vec_norm(pos);
            let n1 = vec_norm(vec_cross(n0, sun_dir));
            let n2 = vec_cross(n0, n1);
            let sat_rot = mat3_transpose([n2[0], n2[1], n2[2], n1[0], n1[1], n1[2], n0[0], n0[1], n0[2]])

            // this.draw_sphere(mat4_mul(mvp, translation_mat4(sun_dir)), rot, [1, 0, 0, 1], 0.2);


            mvp = mat4_mul(mvp, translation_mat4(pos));
            mvp = mat4_mul(mvp, mat3_to_mat4(sat_rot));
            mvp = mat4_mul(mvp, scale_mat4(scale));

            rot = mat3_mul(rot, sat_rot);

            let panel_a = -Math.acos(vec_dot(n0, sun_dir));

            let mat0 = mat4_mul(mat4_mul(mvp, tr1), mat4_mul(rot_y_mat4(panel_a), sc1));
            let mat1 = mat4_mul(mat4_mul(mvp, tr2), mat4_mul(rot_y_mat4(panel_a), sc1));

            let shader = simple_shader;
            gl.disable(gl.CULL_FACE);


            gl.useProgram(shader.shader);

            gl.bindBuffer(gl.ARRAY_BUFFER, basic_vertex_buffer);
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, basic_index_buffer);

            gl.enableVertexAttribArray(shader.attributes["v_position"]);
            gl.vertexAttribPointer(shader.attributes["v_position"], 3, gl.FLOAT, false, 6 * float_size, 0);
            gl.enableVertexAttribArray(shader.attributes["v_normal"]);
            gl.vertexAttribPointer(shader.attributes["v_normal"], 3, gl.FLOAT, false, 6 * float_size, 3 * float_size);


            gl.uniformMatrix3fv(shader.uniforms["m_rot"], false, mat3_invert(rot));

            gl.uniform1f(shader.uniforms["normal_f"], 0.7);
            gl.uniform4fv(shader.uniforms["color"], rgba255_color(240, 162, 53, 1));

            gl.uniformMatrix4fv(shader.uniforms["m_mvp"], false, mat4_transpose(mvp));
            gl.drawElements(gl.TRIANGLES, cube_index_count, gl.UNSIGNED_INT, cube_index_offset * 4);

            gl.uniform4fv(shader.uniforms["color"], rgba255_color(73, 117, 152, 1));

            gl.uniformMatrix4fv(shader.uniforms["m_mvp"], false, mat4_transpose(mat0));
            gl.drawElements(gl.TRIANGLES, cube_index_count, gl.UNSIGNED_INT, cube_index_offset * 4);

            gl.uniformMatrix4fv(shader.uniforms["m_mvp"], false, mat4_transpose(mat1));
            gl.drawElements(gl.TRIANGLES, cube_index_count, gl.UNSIGNED_INT, cube_index_offset * 4);

            gl.uniform4fv(shader.uniforms["color"], rgba255_color(150, 150, 150, 1));


            gl.uniformMatrix4fv(shader.uniforms["m_mvp"], false, mat4_transpose(mat4_mul(mvp, mat4_mul(tr3, sc2))));
            gl.drawElements(gl.TRIANGLES, cube_index_count, gl.UNSIGNED_INT, cube_index_offset * 4);


        }

        this.draw_earth = function(mvp, rot, time) {

            let shader = earth_shader;

            gl.useProgram(shader.shader);

            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, textures[0]);

            gl.activeTexture(gl.TEXTURE1);
            gl.bindTexture(gl.TEXTURE_2D, textures[1]);

            gl.activeTexture(gl.TEXTURE2);
            gl.bindTexture(gl.TEXTURE_2D, textures[2]);

            gl.activeTexture(gl.TEXTURE3);
            gl.bindTexture(gl.TEXTURE_2D, textures[3]);


            gl.bindBuffer(gl.ARRAY_BUFFER, basic_vertex_buffer);
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, basic_index_buffer);

            gl.enableVertexAttribArray(shader.attributes["v_position"]);
            gl.vertexAttribPointer(shader.attributes["v_position"], 3, gl.FLOAT, false, 6 * float_size, 0);
            gl.enableVertexAttribArray(shader.attributes["v_normal"]);
            gl.vertexAttribPointer(shader.attributes["v_normal"], 3, gl.FLOAT, false, 6 * float_size, 3 * float_size);

            gl.uniformMatrix4fv(shader.uniforms["m_mvp"], false, mat4_transpose(mvp));
            gl.uniformMatrix3fv(shader.uniforms["m_rot"], false, mat3_invert(rot));
            gl.uniform2fv(shader.uniforms["params"], time === undefined ? [0, 0] : [time, 1]);

            gl.uniform1i(earth_shader.uniforms["tex_ground0"], 0);
            gl.uniform1i(earth_shader.uniforms["tex_ground1"], 1);
            gl.uniform1i(earth_shader.uniforms["tex_clouds0"], 2);
            gl.uniform1i(earth_shader.uniforms["tex_clouds1"], 3);

            gl.drawElements(gl.TRIANGLES, sphere_index_count, gl.UNSIGNED_INT, sphere_index_offset * 4);
        }

        this.draw_coverage = function(mvp, rot, positions, t_map) {


            let shader = coverage_shader;

            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, textures[4]);

            gl.activeTexture(gl.TEXTURE1);
            gl.bindTexture(gl.TEXTURE_2D, textures[5]);

            gl.activeTexture(gl.TEXTURE2);
            gl.bindTexture(gl.TEXTURE_2D, textures[6]);

            gl.useProgram(shader.shader);

            gl.bindBuffer(gl.ARRAY_BUFFER, basic_vertex_buffer);
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, basic_index_buffer);

            gl.enableVertexAttribArray(shader.attributes["v_position"]);
            gl.vertexAttribPointer(shader.attributes["v_position"], 3, gl.FLOAT, false, 6 * float_size, 0);
            gl.enableVertexAttribArray(shader.attributes["v_normal"]);
            gl.vertexAttribPointer(shader.attributes["v_normal"], 3, gl.FLOAT, false, 6 * float_size, 3 * float_size);

            gl.uniformMatrix4fv(shader.uniforms["m_mvp"], false, mat4_transpose(mvp));
            gl.uniformMatrix3fv(shader.uniforms["m_rot"], false, mat3_invert(rot));

            gl.uniform3fv(shader.uniforms["positions"], positions);
            gl.uniform2fv(shader.uniforms["t_map"], t_map);

            gl.uniform1i(shader.uniforms["outline0"], 0);
            gl.uniform1i(shader.uniforms["outline1"], 1);
            gl.uniform1i(shader.uniforms["lut"], 2);

            gl.drawElements(gl.TRIANGLES, sphere_index_count, gl.UNSIGNED_INT, sphere_index_offset * 4);
        }

        this.draw_sphere = function(mvp, rot, color, r, mode, param) {

            let shader = simple_shader;

            mvp = mat4_mul(mvp, scale_mat4(r));

            if (mode === "edge" || mode === "hill_edge") {
                gl.enable(gl.BLEND);
                gl.disable(gl.CULL_FACE);
                gl.depthMask(false);
                shader = mode === "edge" ? edge_shader : hill_edge_shader;
            } else if (mode === "stroke") {
                shader = stroke_shader;
            } else if (mode === "depth") {
                gl.colorMask(false, false, false, false);
            }

            gl.useProgram(shader.shader);

            gl.bindBuffer(gl.ARRAY_BUFFER, basic_vertex_buffer);
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, basic_index_buffer);

            gl.enableVertexAttribArray(shader.attributes["v_position"]);
            gl.vertexAttribPointer(shader.attributes["v_position"], 3, gl.FLOAT, false, 6 * float_size, 0);
            gl.enableVertexAttribArray(shader.attributes["v_normal"]);
            gl.vertexAttribPointer(shader.attributes["v_normal"], 3, gl.FLOAT, false, 6 * float_size, 3 * float_size);

            gl.uniformMatrix4fv(shader.uniforms["m_mvp"], false, mat4_transpose(mvp));
            gl.uniformMatrix3fv(shader.uniforms["m_rot"], false, mat3_invert(rot));

            if (mode === "edge") {
                if (!param)
                    param = [0, 0, -1, 10000];
                gl.uniform4fv(shader.uniforms["clip"], param);
            } else if (mode === "hill_edge") {
                gl.uniform4fv(shader.uniforms["param"], param);
            }


            gl.uniform4fv(shader.uniforms["color"], color);
            gl.uniform1f(shader.uniforms["normal_f"], 0.0);

            gl.drawElements(gl.TRIANGLES, sphere_index_count, gl.UNSIGNED_INT, sphere_index_offset * 4);

            if (mode === "depth")
                gl.colorMask(true, true, true, true);

        }

        this.draw_ellipse = function(mvp, rot, color, a, e, r, span) {

            let shader = ellipse_shader;
            let b = a * Math.sqrt(1 - e * e);
            let c = e * a;

            if (span === undefined) {
                span = 2 * pi;
            }

            mvp = mat4_mul(mvp, translation_mat4([-c, 0, 0]));

            if (color[3] != 1) {
                gl.enable(gl.BLEND);
                gl.disable(gl.CULL_FACE);
                gl.depthMask(false);
            }

            gl.useProgram(shader.shader);

            gl.bindBuffer(gl.ARRAY_BUFFER, basic_vertex_buffer);
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, basic_index_buffer);

            gl.enableVertexAttribArray(shader.attributes["v_st"]);
            gl.vertexAttribPointer(shader.attributes["v_st"], 2, gl.FLOAT, false, 2 * float_size, 0);

            gl.uniformMatrix4fv(shader.uniforms["m_mvp"], false, mat4_transpose(mvp));
            gl.uniformMatrix3fv(shader.uniforms["m_rot"], false, mat3_invert(rot));

            gl.uniform4fv(shader.uniforms["params"], [a, b, r, span]);
            gl.uniform4fv(shader.uniforms["color"], color);
            gl.uniform1f(shader.uniforms["normal_f"], 0.0);

            gl.drawElements(gl.TRIANGLES, curve_index_count,
                gl.UNSIGNED_INT, curve_index_offset * 4);
        }

        this.draw_quad = function(mvp, rot, color, mode) {

            let shader = simple_shader;

            if (mode === "depth") {
                gl.colorMask(false, false, false, false);
            } else if (color[3] != 1) {
                gl.enable(gl.BLEND);
                gl.disable(gl.CULL_FACE);
                gl.depthMask(false);
            }

            gl.useProgram(shader.shader);

            gl.bindBuffer(gl.ARRAY_BUFFER, basic_vertex_buffer);
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, basic_index_buffer);

            gl.enableVertexAttribArray(shader.attributes["v_position"]);
            gl.vertexAttribPointer(shader.attributes["v_position"], 3, gl.FLOAT, false, 6 * float_size, 0);
            gl.enableVertexAttribArray(shader.attributes["v_normal"]);
            gl.vertexAttribPointer(shader.attributes["v_normal"], 3, gl.FLOAT, false, 6 * float_size, 3 * float_size);

            gl.uniformMatrix4fv(shader.uniforms["m_mvp"], false, mat4_transpose(mvp));
            gl.uniformMatrix3fv(shader.uniforms["m_rot"], false, mat3_invert(rot));

            gl.uniform4fv(shader.uniforms["color"], color);
            gl.uniform1f(shader.uniforms["normal_f"], 0.0);

            gl.drawElements(gl.TRIANGLES, quad_index_count, gl.UNSIGNED_INT, quad_index_offset * 4);

            if (mode === "depth")
                gl.colorMask(true, true, true, true);
        }

        this.draw_disc = function(mvp, rot, color, coords) {

            let shader = disc_shader;

            gl.enable(gl.BLEND);
            gl.disable(gl.CULL_FACE);
            gl.depthMask(false);

            gl.useProgram(shader.shader);

            gl.bindBuffer(gl.ARRAY_BUFFER, basic_vertex_buffer);
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, basic_index_buffer);

            gl.enableVertexAttribArray(shader.attributes["v_position"]);
            gl.vertexAttribPointer(shader.attributes["v_position"], 3, gl.FLOAT, false, 6 * float_size, 0);

            gl.uniformMatrix4fv(shader.uniforms["m_mvp"], false, mat4_transpose(mvp));

            gl.uniform4fv(shader.uniforms["color"], color);
            gl.uniform4fv(shader.uniforms["coords"], coords);

            gl.drawElements(gl.TRIANGLES, quad_index_count, gl.UNSIGNED_INT, quad_index_offset * 4);
        }

        this.draw_segment = function(mvp, rot, color, p0, p1, r, mode) {

            let shader = segment_shader;

            if (mode === "depth") {
                gl.colorMask(false, false, false, false);
            } else if (color[3] != 1) {
                gl.enable(gl.BLEND);
                gl.disable(gl.CULL_FACE);
                gl.depthMask(false);
            }

            gl.useProgram(shader.shader);

            gl.bindBuffer(gl.ARRAY_BUFFER, basic_vertex_buffer);
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, basic_index_buffer);

            gl.enableVertexAttribArray(shader.attributes["v_st"]);
            gl.vertexAttribPointer(shader.attributes["v_st"], 2, gl.FLOAT, false, 2 * float_size, 0);

            gl.uniformMatrix4fv(shader.uniforms["m_mvp"], false, mat4_transpose(mvp));
            gl.uniformMatrix3fv(shader.uniforms["m_rot"], false, mat3_invert(rot));

            gl.uniform3fv(shader.uniforms["p0"], p0);
            gl.uniform3fv(shader.uniforms["p1"], p1);
            gl.uniform1f(shader.uniforms["r"], r);

            gl.uniform4fv(shader.uniforms["color"], color);
            gl.uniform1f(shader.uniforms["normal_f"], 0.0);

            gl.drawElements(gl.TRIANGLES, segment_index_count,
                gl.UNSIGNED_INT, segment_index_offset * 4);

            if (mode === "depth")
                gl.colorMask(true, true, true, true);
        }

        this.draw_cone = function(mvp, rot, color, length, radius) {

            let shader = simple_shader;

            mvp = mat4_mul(mvp, scale_mat4([radius, radius, length]));

            // FIXME: rot matrix for normals

            gl.enable(gl.BLEND);
            gl.enable(gl.CULL_FACE);
            gl.depthMask(false);

            gl.useProgram(shader.shader);

            gl.bindBuffer(gl.ARRAY_BUFFER, basic_vertex_buffer);
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, basic_index_buffer);

            gl.enableVertexAttribArray(shader.attributes["v_position"]);
            gl.vertexAttribPointer(shader.attributes["v_position"], 3, gl.FLOAT, false, 6 * float_size, 0);
            gl.enableVertexAttribArray(shader.attributes["v_normal"]);
            gl.vertexAttribPointer(shader.attributes["v_normal"], 3, gl.FLOAT, false, 6 * float_size, 3 * float_size);

            gl.uniformMatrix4fv(shader.uniforms["m_mvp"], false, mat4_transpose(mvp));
            gl.uniformMatrix3fv(shader.uniforms["m_rot"], false, mat3_invert(rot));

            gl.uniform4fv(shader.uniforms["color"], color);
            gl.uniform1f(shader.uniforms["normal_f"], 0.0);


            gl.drawElements(gl.TRIANGLES, cone_index_count, gl.UNSIGNED_INT, cone_index_offset * 4);
        }
    }


    let gl = new GLDrawer(scale, function() {
        earth_drawers.forEach(drawer => drawer.request_repaint());
    });

    function Drawer(container, mode) {
        let self = this;

        all_drawers.push(self);
        all_containers.push(container);
        container.drawer = this;


        if (mode === "visible_cone" ||
            mode === "geostat_coverage" ||
            mode === "geostat_distance" ||
            mode === "visible_area" ||
            mode === "visible_cone" ||
            mode === "orbital_inclination" ||
            mode === "orbital_period" ||
            mode === "time_dilation" ||
            mode.startsWith("satellite_sim") ||
            mode.startsWith("gps_orbits") ||
            mode.startsWith("keplerian"))
            earth_drawers.push(self);

        if (mode === "time_dilation" ||
            mode === "keplerian0" ||
            mode === "orbital_period" ||
            mode === "visible_cone")
            units_drawers.push(self);

        let wrapper = document.createElement("div");
        wrapper.classList.add("canvas_container");
        wrapper.classList.add("non_selectable");

        let canvas = document.createElement("canvas");
        canvas.classList.add("non_selectable");
        canvas.style.position = "absolute";
        canvas.style.top = "0";
        canvas.style.left = "0";

        wrapper.appendChild(canvas);
        container.appendChild(wrapper);

        let play = document.createElement("div");
        play.classList.add("play_pause_button");

        if (!mode.startsWith("signal"))
            play.classList.add("white");
        // play.classList.add("playing");


        let reset = document.createElement("div");
        reset.classList.add("restart_button");
        reset.classList.add("white");


        play.onclick = function() {
            self.set_paused(!self.paused);
        }
        reset.onclick = function() {
            self.reset();
            self.set_paused(false);
        }


        let load_text = mode === "ellipse" ||
            mode === "visible_area" ||
            mode === "visible_cone" ||
            mode === "geostat_coverage";

        let track_drags = mode === "map0" ||
            mode === "map1" ||
            mode === "map2" ||
            mode === "map3" ||
            mode === "map4" ||
            mode === "map5" ||
            mode === "map_drone0" ||
            mode === "map_drone1" ||
            mode === "map_sound0" ||
            mode === "map_sound1" ||
            mode === "map_sound2" ||
            mode === "map_sound3" ||
            mode === "map_sound4" ||
            mode === "map_sound5" ||
            mode === "map_sound6" ||
            mode === "map_sound7" ||
            mode === "map_ladder0" ||
            mode === "map_ladder1" ||
            mode === "map_ladder2" ||
            mode === "map_ladder3" ||
            mode === "map_ladder4" ||
            mode === "string" ||
            mode === "hill" ||
            mode === "satellite_sim0" ||
            mode === "satellite_sim1" ||
            mode === "gps_orbits2" ||
            mode === "gps_orbits4" ||
            mode === "geostat_distance";

        let animated = mode === "orbital_period" ||
            mode === "gps_orbits_hero" ||
            mode === "gps_orbits0" ||
            mode === "gps_orbits1" ||
            mode === "gps_orbits2" ||
            mode === "gps_orbits3" ||
            mode === "gps_orbits4" ||
            mode === "ellipse" ||
            mode === "keplerian0" ||
            mode === "keplerian1" ||
            mode === "time_dilation" ||
            mode === "signal0" ||
            mode === "signal1" ||
            mode === "signal2" ||
            mode === "signal3" ||
            mode === "signal4" ||
            mode === "signal5" ||
            mode === "signal8" ||
            mode === "signal9" ||
            mode === "signal10" ||
            mode === "signal11" ||
            mode === "signal12" ||
            mode === "signal13" ||
            mode === "signal14";

        let simulated = mode === "satellite_sim0" ||
            mode === "satellite_sim1";

        let ss_drag = mode === "satellite_sim0" ||
            mode === "satellite_sim1";

        let left_camera_pans = mode === "map_ladder0" ||
            (mode.startsWith("map") && !mode.startsWith("map_ladder"));

        let no_camera_pans = mode === "visible_area" ||
            mode === "satellite_sim0" ||
            mode === "satellite_sim1" ||
            mode === "ellipse" ||
            mode === "time_dilation" ||
            mode === "atmosphere" ||
            mode === "overlap" ||
            mode === "clocks" ||
            mode.startsWith("signal");

        let prev_timestamp;
        let t = 0;

        let rot = ident_mat3;
        let width, height;

        let size = 0;
        let arcball;
        let two_axis;

        rot = mat3_mul(rot_x_mat3(-pi * 0.35), rot_z_mat3(-0.9));

        if (mode.startsWith("spheres") || mode === "visible_cone")
            rot = mat3_mul(rot_x_mat3(-0.7), rot_z_mat3(-0.7));
        else if (mode == "geostat_distance")
            rot = mat3_mul(rot_x_mat3(-1), rot_z_mat3(0.9));
        else if (mode == "keplerian0")
            rot = mat3_mul(rot_x_mat3(-0.5), rot_z_mat3(-0.4));
        else if (mode == "keplerian1")
            rot = mat3_mul(rot_x_mat3(-pi * 0.35), rot_z_mat3(-2.3));
        else if (mode == "keplerian2")
            rot = mat3_mul(rot_x_mat3(-pi * 0.35), rot_z_mat3(-1.4));

        if (mode.startsWith("map") || mode === "string" || mode === "hill") {
            rot = mat3_mul(rot_x_mat3(-0.7), rot_z_mat3(-0.7));

            two_axis = new TwoAxis();
            two_axis.set_angles([-0.7, -0.7]);
            two_axis.set_vertical_limits([-pi / 2, -0.0]);
            two_axis.set_callback(function() {
                rot = two_axis.matrix.slice();
                update_ss_point();
                request_repaint();
            });
        } else if (mode.startsWith("spheres") || mode === "visible_cone" ||
            mode === "orbital_period" || mode === "orbital_inclination" ||
            mode === "geostat_distance" || mode === "geostat_coverage" ||
            mode.startsWith("gps_orbits") ||
            mode.startsWith("keplerian")) {
            arcball = new ArcBall(rot, function() {
                rot = arcball.matrix.slice();
                update_ss_point();
                request_repaint();
            });
        }

        this.paused = true;
        this.requested_repaint = false;
        this.requested_tick = false;

        this.first_draw = true;

        let vp = ident_mat4;
        let proj;

        let ortho_scale = 1.3;
        let ortho_proj = ident_mat4.slice();

        if (mode === "map_ladder1" || mode === "map_ladder2" ||
            mode === "map_ladder3" || mode === "map_ladder4")
            ortho_scale = 1.1;

        if (mode === "hill")
            ortho_scale = 0.75;

        ortho_proj[0] = ortho_scale;
        ortho_proj[5] = ortho_scale;
        ortho_proj[10] = -0.3;


        let point = vec_norm([Math.cos(37.324 * pi / 180) * Math.cos(-122.03 * pi / 180),
            Math.cos(37.324 * pi / 180) * Math.sin(-122.03 * pi / 180),
            Math.sin(37.324 * pi / 180)
        ]);
        let secondary_point = [-1, -1, 0.0];
        let ss_point = [0, 0];

        if (mode === "map0" || mode === "map2" ||
            mode === "map3" || mode === "map4" || mode === "map5" ||
            mode === "string")
            point = [0.4, 0.6, 0.0];
        else if (mode === "map1")
            point = [0.2, 0.5, 0.0];
        else if (mode === "hill")
            point = [0.9, 0.6, 0.0];
        else if (mode === "map_drone0" || mode === "map_drone1")
            point = [0.6, 0.1, 0.0];
        else if (mode === "map_ladder0" || mode === "map_ladder1" ||
            mode === "map_ladder2" || mode === "map_ladder3")
            point = [0.5, 0.6, 0.0];
        else if (mode === "map_sound0" || mode === "map_sound1" ||
            mode === "map_sound2" || mode === "map_sound3" ||
            mode === "map_sound4" || mode === "map_sound5" ||
            mode === "map_sound6" || mode === "map_sound7")
            point = [0.3, 0.3, 0.0];

        if (mode === "map_sound2" || mode === "map_sound7")
            secondary_point = [0.7, 0.6, 0.0];

        let size_height_factor = 1.0;

        if (container.classList.contains("ratio_70"))
            size_height_factor = 6 / 7;

        if (mode === "map_ladder2" || mode === "map_ladder2" || mode === "map_ladder3" || mode === "map_ladder4")
            size_height_factor = 5 / 6;

        if (mode === "clocks")
            size_height_factor = 6 / 8;

        if (mode === "hill")
            size_height_factor = 1 / 0.8;


        function canvas_space(e) {
            let r = canvas.getBoundingClientRect();
            return [(e.clientX - r.left), (e.clientY - r.top)];
        }

        let earth_rot_angle = 0;

        let start = [0, 0];
        let oob_drag = false;
        let dragging = false;
        let drag_delta = [0, 0];


        function update_ss_point() {
            ss_point = project(mat4_mul_vec3(vp, mat3_mul_vec(rot_z_mat3(earth_rot_angle), point))).slice();
            ss_point[0] += size * 0.5;
            ss_point[1] += size * 0.5;
        }

        function hit_test_figurine(src) {
            let tilt = Math.max(0, rot[8]);
            if (tilt < 1e-7)
                return false;
            let diff = vec_sub(src, ss_point);

            if (diff[1] < 0)
                diff[1] /= (1.0 + (1 - tilt) * 2.5);
            return vec_len_sq(diff) < (touch_size ? 30 * 30 : 15 * 15);
        }

        function limit_figurine(point, p, drag_delta) {
            let pp0 = [0, 0, 0, 1];
            pp0[0] = (p[0] - drag_delta[0]) * 2.0 / size - 1;
            pp0[1] = -(p[1] - drag_delta[1]) * 2.0 / size + 1;

            let pp1 = pp0.slice();
            pp1[2] = 1;

            let ivp = mat4_invert(vp);

            pp0 = mat4_mul_vec4(ivp, pp0);
            pp0 = vec_scale(pp0, 1 / pp0[3]);

            pp1 = mat4_mul_vec4(ivp, pp1);
            pp1 = vec_scale(pp1, 1 / pp1[3]);

            let dir = vec_sub(pp1, pp0);

            let hit_t = (-pp0[2] + point[2]) / dir[2];
            let hit = vec_add(pp0, vec_scale(dir, hit_t));

            let to_secondary = vec_sub(hit.slice(0, 3), secondary_point);
            if (vec_len_sq(to_secondary) < 0.05 * 0.05) {
                hit = vec_add(secondary_point, vec_scale(vec_norm(to_secondary), 0.05));
            }

            let c = [0.5, 0.5, 0.0];
            let d = vec_sub(hit, c);
            if (hit[0] < 0.03) {
                hit = vec_add(c, vec_scale(d, -(c[0] - 0.03) / d[0]));
            } else if (hit[0] > 0.97) {
                hit = vec_add(c, vec_scale(d, -(c[0] - 0.97) / d[0]));
            }

            if (hit[1] < 0.03) {
                hit = vec_add(c, vec_scale(d, -(c[1] - 0.03) / d[1]));
            } else if (hit[1] > 0.97) {
                hit = vec_add(c, vec_scale(d, -(c[1] - 0.97) / d[1]));
            }
            return [hit[0], hit[1], point[2]];
        }

        function limit_earth(point, p, drag_delta) {

            let pp0 = [0, 0, 0, 1];
            pp0[0] = (p[0] - drag_delta[0]) * 2.0 / size - 1;
            pp0[1] = -(p[1] - drag_delta[1]) * 2.0 / size + 1;

            pp0[2] = -5;
            pp0[3] = 1;

            let pp1 = pp0.slice();
            pp1[2] = -4;

            let ivp = mat4_invert(vp);

            pp0 = mat4_mul_vec4(ivp, pp0);
            pp0 = vec_scale(pp0, 1 / pp0[3]);

            pp1 = mat4_mul_vec4(ivp, pp1);
            pp1 = vec_scale(pp1, 1 / pp1[3]);

            let ray_org = pp0.slice(0, 3);
            let ray_dir = vec_norm(vec_sub(pp1.slice(0, 3), pp0.slice(0, 3)));
            let sr = 1;
            let tr = [0, 0, 0];

            let oc = vec_sub(ray_org, tr);
            let b = vec_dot(oc, ray_dir);
            let c = vec_dot(oc, oc) - sr * sr;
            let h = b * b - c;


            let t = -b - Math.sqrt(Math.max(0, h));
            let hit = vec_add(ray_org, vec_scale(ray_dir, t));

            hit = mat3_mul_vec(rot_z_mat3(-earth_rot_angle), hit);
            hit = vec_norm(hit);
            return hit;
        }

        function hit_test_earth(src) {
            return vec_len_sq(vec_sub(src, ss_point)) < (touch_size ? 30 * 30 : 15 * 15);
        }

        let hit_test = hit_test_figurine;
        let limit = limit_figurine;

        if (mode === "gps_orbits2" || mode === "gps_orbits4" || mode === "geostat_distance") {
            hit_test = hit_test_earth;
            limit = limit_earth;
        }

        if (mode === "hill") {
            limit = function(point, p, drag_delta) {
                let hit = limit_figurine(point, p, drag_delta);
                hit[0] = Math.max(0.83, hit[0]);
                return hit;
            }
        }

        if (track_drags) {
            canvas.addEventListener("mousemove", e => {

                if (dragging)
                    return;

                let src = canvas_space(e);

                if (hit_test(src)) {
                    canvas.style.cursor = "grab";
                } else {
                    canvas.style.cursor = "default";
                }

                return true;
            }, false);
        }


        new TouchHandler(canvas,
            function(e) {
                let p = canvas_space(e);
                oob_drag = false;

                if (left_camera_pans && p[0] > width * 0.5) {
                    oob_drag = true;
                    return false;
                }

                if (track_drags && hit_test(p)) {
                    dragging = true;
                    drag_delta = vec_sub(p, ss_point);
                    canvas.style.cursor = "grabbing";
                } else if (no_camera_pans) {

                    oob_drag = true;
                    return false;
                } else if (two_axis) {
                    two_axis.start(width - p[0], p[1]);
                } else if (arcball) {
                    arcball.start(width - p[0], p[1]);
                }

                start = p;

                return true;
            },
            function(e) {
                let p = canvas_space(e);


                if (dragging) {

                    if (ss_drag) {
                        ss_point = vec_sub(p, drag_delta);
                    } else {
                        point = limit(point, p, drag_delta);
                    }

                    request_repaint();
                } else if (oob_drag) {
                    return false;
                } else if (two_axis) {
                    two_axis.update(width - p[0], p[1], e.timeStamp);
                    rot = two_axis.matrix.slice();
                    request_repaint();
                } else if (arcball) {
                    arcball.update(width - p[0], p[1], e.timeStamp);
                    rot = arcball.matrix.slice();
                    request_repaint();
                }

                return true;
            },
            function(e) {
                let p = canvas_space(e);

                if (dragging) {
                    dragging = false;

                    if (simulated) self.set_paused(false);

                    if (hit_test(p)) {
                        canvas.style.cursor = "grab";
                    } else {
                        canvas.style.cursor = "default";
                    }
                }

                if (oob_drag)
                ;
                else if (two_axis)
                    two_axis.end(e.timeStamp);
                else if (arcball)
                    arcball.end(e.timeStamp);

            });



        this.set_paused = function(p) {

            if (self.paused == p)
                return;

            self.paused = p;

            if (self.paused) {
                play.classList.remove("playing");
            } else {
                play.classList.add("playing");
                if (!self.requested_tick) {
                    self.requested_tick = true;
                    window.requestAnimationFrame(tick);
                }

            }
        }

        function tick(timestamp) {

            self.requested_tick = false;

            let rect = canvas.getBoundingClientRect();

            let wh = window.innerHeight || document.documentElement.clientHeight;
            let ww = window.innerWidth || document.documentElement.clientWidth;
            if (!(rect.top > wh || rect.bottom < 0 || rect.left > ww || rect.right < 0)) {

                let dt = 0;
                if (prev_timestamp)
                    dt = (timestamp - prev_timestamp) / 1000;

                dt = Math.min(dt, 1.0 / 20.0);

                t += dt;

                self.repaint(dt);
            }
            prev_timestamp = timestamp;

            if (self.paused)
                prev_timestamp = undefined;
            else
                window.requestAnimationFrame(tick);
        }

        function project(p) {
            p = vec_scale(p, 1 / p[3]);
            p[0] *= size * 0.5;
            p[1] *= -size * 0.5;
            return p;
        }

        if (animated) {
            wrapper.appendChild(play);
            animated_drawers.push(this);
        }

        if (simulated) {
            this.paused = false;
            wrapper.appendChild(reset);
            window.requestAnimationFrame(tick);
        }

        function request_repaint() {
            if (!self.requested_repaint && (self.first_draw || self.paused)) {
                self.first_draw = false;
                self.requested_repaint = true;
                window.requestAnimationFrame(function() {
                    self.repaint();
                });
            }
        }

        let arg0 = 0,
            arg1 = 0,
            arg2 = 0;

        this.set_arg0 = function(x) {
            arg0 = x;
            request_repaint();
        }
        this.set_arg1 = function(x) {
            arg1 = x;
            request_repaint();
        }
        this.set_arg2 = function(x) {
            arg2 = x;
            request_repaint();
        }

        this.set_rot = function(x) {
            rot = x;

            if (arcball)
                arcball.set_matrix(x);

            request_repaint();
        }

        this.set_point = function(x) {
            point = x;
            update_ss_point();
            request_repaint();
        }

        this.set_sim = function(x) {
            sim = x;
            request_repaint();
            this.set_paused(false);
        }

        this.request_repaint = request_repaint;

        this.set_visible = function(x) {
            this.visible = x;
            if (x && !this.was_drawn)
                request_repaint();
        }

        document.fonts.load("500 10px IBM Plex Sans").then(function() { request_repaint() });






        this.on_resize = function() {
            let new_width = wrapper.clientWidth;
            let new_height = wrapper.clientHeight;

            if (new_width != width || new_height != height) {

                width = new_width;
                height = new_height;

                size = height * size_height_factor

                canvas.style.width = width + "px";
                canvas.style.height = height + "px";
                canvas.width = width * scale;
                canvas.height = height * scale;

                let aspect = 1;

                let fov = Math.PI * 0.2;
                let near = 1.0;
                let far = 40.0;

                let f = 1.0 / Math.tan(fov / 2);
                let rangeInv = 1 / (near - far);

                proj = [
                    f / aspect, 0, 0, 0,
                    0, f, 0, 0,
                    0, 0, (near + far) * rangeInv, -1,
                    0, 0, near * far * rangeInv * 2, 0
                ];

                proj = mat4_transpose(proj);
                proj = mat4_mul(proj, translation_mat4([0, 0, -4]));

                let pad = 5;
                let a_size = Math.max(width, height) - pad * 2;

                if (two_axis)
                    two_axis.set_size([size, size]);
                else if (arcball)
                    arcball.set_viewport(width / 2 - a_size / 2 + pad,
                        height / 2 - a_size / 2 + pad,
                        a_size, a_size);

                request_repaint();
            }
        }

        const EarthRadius = 6378137;
        const EarthMu = 3.986004418e14;
        const EarthSiderealDay = 86164.0905;


        function distance_string(m) {
            if (metric)
                return (m / 1000).toFixed(0) + " km";
            else
                return (m / 1609).toFixed(0) + " mi";
        }

        function time_string(t) {
            let h = Math.floor(t / 3600);
            let m = Math.floor((t - h * 3600) / 60);
            let s = Math.floor(t - h * 3600 - m * 60);

            return `${h} hr${h == 1 ? "" : "s"} ${m} min ${s} s`;
        }


        function circle_circle_intersection(p0, r0, p1, r1) {
            let p10 = vec_sub(p1, p0);
            let d = vec_len(p10);
            let x = (d * d - r0 * r0 + r1 * r1) / (2 * d);
            let a = Math.sqrt((-d + r0 - r1) * (-d - r0 + r1) * (-d + r0 + r1) * (d + r0 + r1)) / d;

            let p = vec_add(p0, vec_scale(p10, 1 - x / d));
            let n = [p10[1] / d, -p10[0] / d, 0];

            return [vec_add(p, vec_scale(n, a * 0.5)), vec_add(p, vec_scale(n, -a * 0.5)), p, a * 0.5];
        }

        function eccentric_anomaly(e, M) {
            function f(E) {
                return E - e * Math.sin(E) - M;
            }

            function fp(E) {
                return 1 - e * Math.cos(E);
            }

            let E = M;
            let old_E;
            for (let i = 0; i < 20; i++) {
                old_E = E;
                E = E - f(E) / fp(E);
                if (Math.abs(old_E - E) < 0.00000001)
                    break;
            }

            return E;
        }

        function true_anomaly(e, E) {
            return 2 * Math.atan(Math.sqrt((1 + e) / (1 - e)) * Math.tan(E * 0.5));
        }


        let sim = undefined;


        this.reset = function() {
            sim = undefined;
        }

        this.repaint = function(dt) {

            if (dt === undefined)
                dt = 0;

            self.requested_repaint = false;

            if (!self.visible)
                return;

            if (width == 0 || height == 0)
                return;

            let ctx = canvas.getContext("2d");


            ctx.resetTransform();
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.scale(scale, scale);
            ctx.setLineDash([]);

            let base_line_width = 1.5;

            if (window.innerWidth < 500)
                base_line_width = 1;

            let font_size = 20;

            if (window.innerWidth < 500)
                font_size = 18;

            if (window.innerWidth < 400)
                font_size = 16;


            ctx.lineCap = "round";
            ctx.lineJoin = "round";
            ctx.lineWidth = base_line_width;

            ctx.font = font_size + "px IBM Plex Sans";
            ctx.textAlign = "center";
            ctx.globalAlpha = 1.0;
            ctx.globalCompositeOperation = "source-over";

            let quarter_width = Math.floor(width * 0.25);
            let half_width = quarter_width * 2;
            let half_height = Math.floor(height * 0.5);

            let half_size = Math.floor(size * 0.5);
            let map_size = Math.round(size * 0.5 * ortho_scale);
            let oob = height * 2;

            let markers = [
                [0.1, 0.3, 0.0],
                [0.4, 0.8, 0.0],
                [0.9, 0.6, 0.0],
                [0.6, 0.2, 0.0]
            ];
            // let markers = [[0.2, 0.2, 0.0], [0.2, 0.8, 0.0], [0.8, 0.2, 0.0], [0.8, 0.8, 0.0]];

            const fig_w = 0.023;
            const fig_h = 0.08;


            if (mode === "visible_cone" ||
                mode === "geostat_coverage" ||
                mode === "geostat_distance") {

                let n = 1;
                let zoom_t = arg0 * arg0;

                if (mode === "geostat_coverage") {
                    n = Math.round(arg0 * 9) + 1;
                    zoom_t = (6.6107077976 - 1.015678553) / (7.0 - 1.015678553);
                } else if (mode === "geostat_distance") {
                    n = 12;
                    zoom_t = 0.2;
                }

                let camera_dist = lerp(0, -19, zoom_t);
                let dist = lerp(1.015678553, 7.0, zoom_t);
                let rr = 2 * lerp(0.003, 0.01, zoom_t);

                let sin = 1 / dist;
                let cos = Math.sqrt(1 - sin * sin);

                let sub = sin;
                let r = cos + 0.001;
                let h = 1 - sub;
                let percent = h / 2;

                let pos = [dist, 0, 0];

                vp = mat4_mul(mat4_mul(proj, translation_mat4([0, 0, camera_dist])),
                    mat3_to_mat4(rot));

                gl.begin(width, width)

                gl.draw_earth(vp, rot);

                let angle_offset = 0.15;
                let positions = [];

                for (let i = 0; i < n; i++) {
                    let angle = i / n * 2 * pi + angle_offset;
                    let n_rot = rot_z_mat3(angle);
                    let p = mat3_mul_vec(n_rot, pos);

                    positions.push(p);

                    if (mode === "visible_cone")
                        gl.draw_sphere(mat4_mul(vp, translation_mat4(p)), rot, rgba255_color(248, 38, 26, 1), 0.02);
                    else if (mode === "geostat_coverage")
                        gl.draw_satellite(vp, rot, p, 0.15);
                    else
                        gl.draw_satellite(vp, rot, p, 0.05);
                }



                if (mode === "geostat_distance") {
                    let pos = point;
                    let ghost_pos = pos.slice();
                    ghost_pos[2] *= -1;

                    gl.draw_sphere(mat4_mul(vp, translation_mat4(pos)), rot, rgba255_color(255, 35, 21, 1), 0.04);
                    gl.draw_sphere(mat4_mul(vp, translation_mat4(ghost_pos)), rot, rgba255_color(240, 240, 240, 1), 0.04);

                    for (let i = 0; i < n; i++) {
                        let angle = i / n * 2 * pi + angle_offset;
                        let sat_pos = [dist * Math.cos(angle), dist * Math.sin(angle), 0];

                        if (vec_dot(vec_sub(sat_pos, pos), pos) < 0)
                            continue;

                        gl.draw_segment(vp, rot, rgba255_color(182, 23, 13, 0.5), pos, sat_pos, 0.01);
                        gl.draw_segment(vp, rot, rgba255_color(180, 180, 180, 0.5), ghost_pos, sat_pos, 0.01);
                    }
                }



                for (let i = n; i < 30; i++)
                    positions.push([0, 0, 0]);


                if (mode !== "geostat_distance") {
                    let cone_a = mode === "visible_cone" ? 0.4 : 0.17;
                    for (let i = 0; i < n; i++) {
                        let angle = i / n * 2 * pi + angle_offset;
                        let n_rot = rot_z_mat3(angle);

                        let cone_rot = rot_y_mat3(-pi * 0.5);
                        let cone_mat = mat4_mul(mat4_mul(vp, mat3_to_mat4(n_rot)),
                            mat4_mul(translation_mat4(pos), mat3_to_mat4(cone_rot)));

                        gl.draw_cone(cone_mat, mat3_mul(rot, cone_rot), rgba255_color(255, 255, 255, cone_a), dist - sub, r);
                    }
                }


                if (mode === "geostat_coverage")
                    gl.draw_coverage(vp, rot, flatten(positions), [2 * coverage_lut_scale, 0.5 * coverage_lut_scale]);

                gl.draw_segment(vp, rot, earth_axis_color, [0, 0, +1.2], [0, 0, +1.05], rr);
                gl.draw_segment(vp, rot, earth_axis_color, [0, 0, -1.2], [0, 0, -1.05], rr);


                if (mode !== "visible_cone")
                    gl.draw_ellipse(vp, rot, orbit_color, dist, 0.0, rr);


                let offset = mode === "geostat_coverage" ? Math.round(width * 0.1) : 0;

                ctx.drawImage(gl.finish(), 0, offset, width, width);

                ctx.fillStyle = "#aaa";

                if (mode === "visible_cone") {
                    let string = "altitude " + distance_string(EarthRadius * (dist - 1));
                    ctx.fillText(string, half_width, height - font_size * 2);

                    string = (percent * 100).toFixed(1) + "% of the Earth's surface visible";
                    ctx.fillText(string, half_width, height - font_size * 0.5);
                } else if (mode === "geostat_coverage") {

                    ctx.fillText(`${n} satellite${n == 1 ? "" : "s"}`, half_width, height - font_size * 0.5);

                    let w = Math.ceil((width - 100) / 6);

                    ctx.translate(Math.ceil(width - w * 6) * 0.5, height * 0.1);

                    ctx.font = Math.floor(font_size * 0.8) + "px IBM Plex Sans";

                    for (let i = 0; i < 6; i++) {
                        ctx.fillStyle = `rgb(${coverage_lut[i * 2][0]}, ${coverage_lut[i * 2][1]}, ${coverage_lut[i * 2][2]})`;
                        ctx.fillRect(i * w, -font_size * 2.5, w, font_size * 1.2);
                        ctx.fillStyle = "#aaa";
                        ctx.fillText(i, (i + 0.5) * w, -font_size * 0.4);
                    }

                }

            } else if (mode === "orbital_period") {

                let zoom_t = arg0 * arg0;
                let camera_dist = lerp(0, -19.9, zoom_t);
                let dist = lerp(1.015678553, 7.0, zoom_t);
                let rr = 2 * lerp(0.003, 0.01, zoom_t);
                let pos = [dist, 0, 0];

                let inclination = 0.96;


                let dist_m = dist * EarthRadius;
                let sat_period = Math.sqrt(4 * pi * pi * dist_m * dist_m * dist_m / EarthMu);
                let time = t / 18.0;

                if (sim === undefined)
                    sim = 0;

                sim += EarthSiderealDay * dt / sat_period / 18.0;


                let sat_time = sim;


                let earth_rot = rot_z_mat3(time * pi * 2);
                let sat_rot = rot_z_mat3(sat_time * pi * 2);
                let inclination_rot = rot_x_mat3(inclination);

                let vp = mat4_mul(mat4_mul(proj, translation_mat4([0, 0, camera_dist])),
                    mat3_to_mat4(rot));


                pos = mat3_mul_vec(sat_rot, pos);
                pos = mat3_mul_vec(inclination_rot, pos);

                gl.begin(width, width)

                gl.draw_earth(mat4_mul(vp, mat3_to_mat4(earth_rot)), mat3_mul(rot, earth_rot), time);
                gl.draw_satellite(vp, rot, pos);

                let quad_mat0 = translation_mat4([-0.5, -0.5, 0.0]);
                quad_mat0 = mat4_mul(scale_mat4(2 * dist * 1.05), quad_mat0);
                quad_mat0 = mat4_mul(rot_x_mat4(inclination), quad_mat0);
                quad_mat0 = mat4_mul(vp, quad_mat0);


                gl.draw_disc(quad_mat0, rot, orbital_color, [2, 2, -1, -1]);

                gl.draw_segment(vp, rot, earth_axis_color, [0, 0, +1.2], [0, 0, +1.05], rr);
                gl.draw_segment(vp, rot, earth_axis_color, [0, 0, -1.2], [0, 0, -1.05], rr);

                // gl.draw_segment(vp, rot, earth_axis_color, [0,0,0], pos, rr);

                gl.draw_ellipse(mat4_mul(vp, mat3_to_mat4(inclination_rot)), rot, orbit_color, dist, 0.0, rr);

                ctx.drawImage(gl.finish(), 0, 0, width, width);

                ctx.fillStyle = "#aaa";

                ctx.fillStyle = "#aaa";
                let string = "altitude " + distance_string(EarthRadius * (dist - 1));
                ctx.fillText(string, half_width, height - font_size * 2);

                string = time_string(sat_period);
                ctx.fillText(string, half_width, height - font_size * 0.5);
            } else if (mode === "orbital_inclination") {

                let camera_dist = -19;
                let dist = 6.6107077976;
                let rr = 0.019;
                let pos = [dist, 0, 0];

                let inclination = arg1 * pi * 0.5;

                let dist_m = dist * EarthRadius;
                let sat_period = Math.sqrt(4 * pi * pi * dist_m * dist_m * dist_m / EarthMu);


                let time = arg0 * EarthSiderealDay;
                let a = time * pi * 2 / EarthSiderealDay;



                let earth_rot = rot_z_mat3(a);
                let sat_rot = rot_z_mat3(a);
                let inclination_rot = rot_x_mat3(inclination);

                let vp = mat4_mul(mat4_mul(proj, translation_mat4([0, 0, camera_dist])),
                    mat3_to_mat4(rot));


                let sat_pos = mat3_mul_vec(mat3_mul(inclination_rot, sat_rot), pos);


                let quad_mat0 = translation_mat4([-0.5, -0.5, 0.0]);
                quad_mat0 = mat4_mul(scale_mat4(14), quad_mat0);
                quad_mat0 = mat4_mul(vp, quad_mat0);

                let quad_mat1 = translation_mat4([-0.5, 0.0, 0.0]);
                quad_mat1 = mat4_mul(scale_mat4([14, 7, 1]), quad_mat1);
                quad_mat1 = mat4_mul(mat3_to_mat4(inclination_rot), quad_mat1);
                quad_mat1 = mat4_mul(vp, quad_mat1);

                let quad_mat2 = mat4_mul(quad_mat1, translation_mat4([0, -1, 0]));

                gl.begin(width, width);

                gl.draw_earth(mat4_mul(vp, mat3_to_mat4(earth_rot)), mat3_mul(rot, earth_rot));
                gl.draw_sphere(mat4_mul(vp, translation_mat4(vec_norm(sat_pos))), rot, [0.7, 0, 0, 1], 0.1);
                gl.draw_satellite(vp, rot, sat_pos, 0.15);


                let c0 = orbital_color;
                let c1 = equatorial_color;

                let cc = vec_lerp(c0, c1, 0.5);

                c0 = vec_lerp(c0, cc, 1 - smooth_step(0.0, 0.3, inclination));
                c1 = vec_lerp(c1, cc, 1 - smooth_step(0.0, 0.3, inclination));


                if (rot[8] > 0)
                    gl.draw_disc(quad_mat2, rot, c0, [2, 1, -1, -1]);
                else
                    gl.draw_disc(quad_mat1, rot, c0, [2, 1, -1, 0]);

                gl.draw_disc(quad_mat0, rot, c1, [2, 2, -1, -1]);

                if (rot[8] <= 0)
                    gl.draw_disc(quad_mat2, rot, c0, [2, 1, -1, -1]);
                else
                    gl.draw_disc(quad_mat1, rot, c0, [2, 1, -1, 0]);

                gl.draw_segment(vp, rot, earth_axis_color, [0, 0, +1.2], [0, 0, +1.05], rr);
                gl.draw_segment(vp, rot, earth_axis_color, [0, 0, -1.2], [0, 0, -1.05], rr);


                gl.draw_segment(vp, rot, rgba255_color(255, 255, 255, 0.03), [-dist * 1.05, 0, 0], [dist * 1.05, 0, 0], rr);

                gl.draw_segment(vp, rot, rgba255_color(255, 255, 255, 0.1), [0, 0, 0], [0, dist * 1.05, 0], rr);
                gl.draw_segment(vp, rot, rgba255_color(255, 255, 255, 0.1), [0, 0, 0], mat3_mul_vec(inclination_rot, [0, dist * 1.05, 0]), rr);

                gl.draw_ellipse(mat4_mul(vp, mat4_mul(rot_z_mat4(pi * 0.5), rot_x_mat4(pi * 0.5))), rot, rgba255_color(217, 47, 31, 0.66), dist * 0.96, 0, rr * 2, inclination);

                gl.draw_ellipse(mat4_mul(vp, mat3_to_mat4(inclination_rot)), rot, orbit_color, dist, 0.0, rr);


                ctx.drawImage(gl.finish(), 0, 0, width, width);


                ctx.fillStyle = "#aaa";
                let string = "elapsed time = " + time_string(time);
                ctx.fillText(string, half_width, height - font_size * 2);

                ctx.fillStyle = "#E92525";
                ctx.fillText(`inclination = ${(inclination * 180 / pi).toFixed(1)}°`, half_width, height - font_size * 0.5);

            } else if (mode === "gps_orbits_hero" || mode === "gps_orbits0" || mode === "gps_orbits1" ||
                mode === "gps_orbits2" || mode === "gps_orbits3" || mode === "gps_orbits4") {

                let camera_dist = -10;
                let a = 4.1642253843;
                let e = 0.0;
                let rr = 0.01;

                if (mode === "gps_orbits4")
                    camera_dist = -15.5;

                let inclination = 55 * pi / 180;
                let time = t * 2000.0;

                earth_rot_angle = time * pi * 2 / EarthSiderealDay;

                let earth_rot = rot_z_mat3(earth_rot_angle);
                let inv_earth_rot = rot_z_mat3(-earth_rot_angle);

                let inclination_rot = rot_x_mat3(inclination);

                let target_point = mat3_mul_vec(earth_rot, point);

                vp = mat4_mul(mat4_mul(proj, translation_mat4([0, 0, camera_dist])),
                    mat3_to_mat4(rot));

                let i0 = 0;
                let i1 = 6;
                let k0 = 0;
                let k1 = 6;

                if (mode === "gps_orbits0") {
                    i0 = 0;
                    i1 = i0 + 1;
                    k0 = 3;
                    k1 = 4;
                } else if (arg0 != 0) {
                    i0 = arg0 - 1;
                    i1 = i0 + 1;
                }

                let positions = [];
                for (let i = i0; i < i1; i++) {
                    let lon = i * 2 * pi / 6 + gps_sat_lon_offset;

                    for (let k = k0; k < k1; k++) {
                        let ta = gps_sat_glan[i][k];

                        if (ta < 0)
                            continue;

                        ta = (ta * 2) * pi / 180 + gps_sat_aol_offset - i * 2 * pi / 3;

                        ta += time * pi * 4 / EarthSiderealDay;

                        let pos = [a, 0, 0];
                        pos = mat3_mul_vec(rot_z_mat3(ta), pos);
                        pos = mat3_mul_vec(rot_x_mat3(inclination), pos);
                        pos = mat3_mul_vec(rot_z_mat3(lon), pos);

                        positions.push(pos);
                    }
                }


                gl.begin(width, width)

                if (mode !== "gps_orbits3") {
                    gl.draw_earth(mat4_mul(vp, mat3_to_mat4(earth_rot)), mat3_mul(rot, earth_rot), earth_rot_angle / (2 * pi));
                } else {
                    let pos = positions.map(p => mat3_mul_vec(inv_earth_rot, p));
                    gl.draw_coverage(mat4_mul(vp, mat3_to_mat4(earth_rot)), rot, flatten(pos), [coverage_lut_scale, -6 * coverage_lut_scale + 0.5 * coverage_lut_scale]);
                }


                if (mode === "gps_orbits0") {
                    gl.draw_sphere(mat4_mul(vp, translation_mat4(vec_norm(positions[0]))), rot, rgba255_color(255, 35, 21, 1), 0.04);
                } else if (mode === "gps_orbits2" || mode === "gps_orbits4") {
                    gl.draw_sphere(mat4_mul(vp, translation_mat4(target_point)), rot, rgba255_color(255, 35, 21, 1), 0.06);
                }

                positions.forEach(p => {
                    gl.draw_satellite(vp, rot, p);
                })


                let o1 = mode === "gps_orbits0" ? 1 : 6;

                for (let i = 0; i < o1; i++) {
                    let lon = i * 2 * pi / 6 + gps_sat_lon_offset;
                    let lon_rot = rot_z_mat3(lon);

                    let alpha = (arg0 == 0 || arg0 == i + 1) ? 1 : 0.6;
                    let r = (arg0 == i + 1) ? rr * 2.5 : rr;

                    gl.draw_ellipse(mat4_mul(vp, mat4_mul(mat3_to_mat4(lon_rot), mat3_to_mat4(inclination_rot))),
                        rot, vec_scale(orbital_color, alpha), a, e, r);
                }


                if (mode === "gps_orbits2" || mode === "gps_orbits4") {
                    positions.forEach(pos => {
                        let d = vec_sub(pos, target_point);
                        let l = vec_len(d);
                        let dir = vec_scale(d, 1 / l);
                        let dot = vec_dot(dir, target_point);
                        if (dot < 0)
                            return;

                        let alpha = 0.4 * smooth_step(0.0, 0.1, dot);
                        if (mode === "gps_orbits2") {
                            gl.draw_segment(vp, rot, rgba255_color(255, 255, 255, alpha), target_point, pos, rr);
                        } else {

                            let plane = [...dir, 0];
                            let dd = 0.02 + (1 - dot) * 0.1;
                            gl.draw_sphere(mat4_mul(vp, translation_mat4(pos)), rot, rgba255_color(255, 255, 255, alpha * 0.25), l - dd, "edge", plane);
                            gl.draw_sphere(mat4_mul(vp, translation_mat4(pos)), rot, rgba255_color(255, 255, 255, alpha * 0.25), l + dd, "edge", plane);
                        }

                    })
                }
                gl.draw_segment(vp, rot, earth_axis_color, [0, 0, +1.2], [0, 0, +1.05], rr);
                gl.draw_segment(vp, rot, earth_axis_color, [0, 0, -1.2], [0, 0, -1.05], rr);




                if (mode === "gps_orbits3") {

                    ctx.drawImage(gl.finish(), 0, height - width, width, width);

                    let size = 11;
                    let w = Math.ceil((width - 10) / size);

                    ctx.translate(Math.ceil((width - w * size) * 0.5), height * 0.1);

                    ctx.font = Math.floor(font_size * 0.8) + "px IBM Plex Sans";

                    for (let i = 0; i < size; i++) {
                        ctx.fillStyle = `rgb(${coverage_lut[i][0]}, ${coverage_lut[i][1]}, ${coverage_lut[i][2]})`;
                        ctx.fillRect(i * w, -font_size * 2.5, w, font_size * 1.2);
                        ctx.fillStyle = "#aaa";
                        ctx.fillText(6 + i, (i + 0.5) * w, -font_size * 0.5);
                    }
                } else {
                    ctx.drawImage(gl.finish(), 0, 0, width, width);
                }

            } else if (mode === "keplerian0" || mode === "keplerian1" || mode === "keplerian2") {

                let camera_dist = -14;
                let rr = 0.02;


                let a = 4.1642253843;
                let e = 0.2;

                let inclination = pi * 55 / 180;
                let time_scale = 0.07;
                let time = t * time_scale;
                let lon = 0.5;
                let aop = pi * 0.5;
                let ta = 0;


                if (mode === "keplerian0") {
                    inclination = 0.0;
                    camera_dist = -20;
                    aop = 0;
                    lon = 0;
                    rr = 0.03;
                    a = lerp(2.9, 4.5, arg0);
                    e = lerp(0, 0.6, arg1);
                } else if (mode === "keplerian1") {
                    inclination = arg0 * 0.5 * pi;
                    lon = arg1 * 2 * pi;
                } else if (mode === "keplerian2") {
                    aop = arg0 * 2 * pi;
                }

                let l = a * (1 - e * e);
                let b = a * Math.sqrt(1 - e * e);

                let c = e * a;


                let dist_m = a * EarthRadius;
                let sat_period = Math.sqrt(4 * pi * pi * dist_m * dist_m * dist_m / EarthMu);

                if (sim === undefined)
                    sim = 1;

                sim += dt * (EarthSiderealDay / sat_period) * time_scale;

                ta = sim * 2 * pi;

                let orbit_rot = rot_z_mat3(aop);
                orbit_rot = mat3_mul(rot_x_mat3(inclination), orbit_rot);
                orbit_rot = mat3_mul(rot_z_mat3(lon), orbit_rot);

                let earth_rot = rot_z_mat3(time * pi * 2 + 2);


                let ecc_a = eccentric_anomaly(e, ta);
                let sat_angle = true_anomaly(e, ecc_a);

                if (mode === "keplerian2")
                    sat_angle = arg1 * 2 * pi;

                let sat_r = a * (1 - e * e) / (1 + e * Math.cos(sat_angle));
                let sat_pos = mat3_mul_vec(orbit_rot, [sat_r * Math.cos(sat_angle), sat_r * Math.sin(sat_angle), 0]);



                vp = mat4_mul(mat4_mul(proj, translation_mat4([0, 0, camera_dist])),
                    mat3_to_mat4(rot));

                gl.begin(width, width);

                gl.draw_earth(mat4_mul(vp, mat3_to_mat4(earth_rot)), mat3_mul(rot, earth_rot), time);
                gl.draw_segment(vp, rot, earth_axis_color, [0, 0, +1.2], [0, 0, +1.05], rr);
                gl.draw_segment(vp, rot, earth_axis_color, [0, 0, -1.2], [0, 0, -1.05], rr);

                gl.draw_satellite(vp, rot, sat_pos, 0.15);

                let r = 5.5;

                let l0 = a * (1 - e * e) / (1 + e * Math.cos(aop));
                let l1 = -a * (1 - e * e) / (1 + e * Math.cos(aop + pi));


                if (mode === "keplerian2") {
                    gl.draw_sphere(mat4_mul(vp, translation_mat4(mat3_mul_vec(orbit_rot, [a - c, 0, 0]))), rot, rgba255_color(229, 193, 58, 1), 0.08);
                }


                if (mode === "keplerian1" || mode === "keplerian2") {
                    gl.draw_sphere(mat4_mul(vp, mat4_mul(rot_z_mat4(lon), translation_mat4([l0, 0, 0]))), rot, rgba255_color(78, 179, 0, 1), 0.08);
                    gl.draw_sphere(mat4_mul(vp, mat4_mul(rot_z_mat4(lon), translation_mat4([l1, 0, 0]))), rot, rgba255_color(193, 43, 38, 1), 0.08);

                    gl.draw_segment(vp, rot, vec_scale([1, 1, 1, 1], 0.1), [0, 0, 0], [r * Math.cos(lon), r * Math.sin(lon), 0], rr * 0.5);
                }





                if (mode === "keplerian1" || mode === "keplerian2") {


                    let c0 = orbital_color;
                    let c1 = equatorial_color;

                    let cc = vec_lerp(c0, c1, 0.5);

                    c0 = vec_lerp(c0, cc, 1 - smooth_step(0.0, 0.3, inclination));
                    c1 = vec_lerp(c1, cc, 1 - smooth_step(0.0, 0.3, inclination));

                    let quad_mat0 = translation_mat4([-0.5, -0.5, 0.0]);
                    quad_mat0 = mat4_mul(scale_mat4(r * 2), quad_mat0);
                    quad_mat0 = mat4_mul(vp, quad_mat0);


                    let quad_mat1 = translation_mat4([-0.5, 0.0, 0.0]);
                    quad_mat1 = mat4_mul(scale_mat4([r * 2, r, 1]), quad_mat1);
                    quad_mat1 = mat4_mul(rot_x_mat4(inclination), quad_mat1);
                    quad_mat1 = mat4_mul(rot_z_mat4(lon), quad_mat1);
                    quad_mat1 = mat4_mul(vp, quad_mat1);

                    let quad_mat2 = mat4_mul(quad_mat1, translation_mat4([0, -1, 0]));


                    if (rot[8] > 0)
                        gl.draw_disc(quad_mat2, rot, c0, [2, 1, -1, -1]);
                    else
                        gl.draw_disc(quad_mat1, rot, c0, [2, 1, -1, 0]);

                    gl.draw_disc(quad_mat0, rot, c1, [2, 2, -1, -1]);

                    if (rot[8] <= 0)
                        gl.draw_disc(quad_mat2, rot, c0, [2, 1, -1, -1]);
                    else
                        gl.draw_disc(quad_mat1, rot, c0, [2, 1, -1, 0]);
                } else {

                    let quad_mat = translation_mat4([-0.5, -0.5, 0.0]);
                    quad_mat = mat4_mul(scale_mat4(15), quad_mat);
                    quad_mat = mat4_mul(rot_x_mat4(inclination), quad_mat);
                    quad_mat = mat4_mul(vp, quad_mat);

                    gl.draw_disc(quad_mat, rot, orbital_color, [2, 2, -1, -1]);
                }


                if (mode === "keplerian0") {

                    gl.draw_segment(vp, rot, rgba255_color(255, 255, 255, 0.2), [-c, 0, 0], [-c, b + 1, 0], rr * 0.5);

                    gl.draw_segment(vp, rot, rgba255_color(255, 255, 255, 0.2), [-c, 0, 0], [-c + a, 0, 0], rr * 0.5);

                    gl.draw_segment(vp, rot, rgba255_color(255, 255, 255, 0.2), [-c + a, 0, 0], [-c + a, b + 1, 0], rr * 0.5);

                    gl.draw_segment(vp, rot, rgba255_color(217, 202, 31, 0.6), [-c, b + 0.5, 0], [-c + a, b + 0.5, 0], rr * 2);

                } else if (mode === "keplerian1") {

                    gl.draw_segment(vp, rot, rgba255_color(255, 255, 255, 0.5), [0, 0, 0], [r * 1.05, 0, 0], rr);

                    gl.draw_segment(vp, rot, rgba255_color(255, 255, 255, 0.1), [0, 0, 0], [r * Math.cos(lon + pi * 0.5), r * Math.sin(lon + pi * 0.5), 0], rr * 0.5);

                    gl.draw_segment(vp, rot, rgba255_color(255, 255, 255, 0.1), [0, 0, 0],
                        mat3_mul_vec(orbit_rot, [r, 0, 0]), rr * 0.5);


                    gl.draw_ellipse(vp, rot, rgba255_color(31, 170, 217, 0.66), r * 0.96, 0, rr * 2, lon);

                    gl.draw_ellipse(mat4_mul(vp, mat4_mul(rot_z_mat4(lon + pi * 0.5), rot_x_mat4(pi * 0.5))), rot,
                        rgba255_color(217, 47, 31, 0.66), r * 0.95, 0, rr * 2, inclination);

                } else if (mode === "keplerian2") {

                    gl.draw_segment(vp, rot, rgba255_color(255, 255, 255, 0.1), [0, 0, 0], mat3_mul_vec(orbit_rot, [r, 0, 0]), rr * 1.2);
                    gl.draw_segment(vp, rot, rgba255_color(255, 255, 255, 0.1), [0, 0, 0], mat3_mul_vec(orbit_rot, [r * Math.cos(sat_angle), r * Math.sin(sat_angle), 0]), rr * 1.2);


                    gl.draw_ellipse(mat4_mul(vp, mat3_to_mat4(orbit_rot)), rot,
                        rgba255_color(85, 169, 39, 0.51), r * 0.9, 0, rr * 2, -aop);

                    gl.draw_ellipse(mat4_mul(vp, mat3_to_mat4(mat3_mul(orbit_rot, rot_z_mat3(0)))), rot,
                        rgba255_color(222, 91, 65, 0.51), r * 0.95, 0, rr * 2, sat_angle);
                }

                gl.draw_ellipse(mat4_mul(vp, mat3_to_mat4(orbit_rot)), rot, orbit_color, a, e, rr);

                ctx.drawImage(gl.finish(), 0, 0, width, width);

                if (mode === "keplerian0") {

                    ctx.fillStyle = "#BCAF1E";
                    ctx.fillText(`semi major axis = ` + distance_string(EarthRadius * a), half_width, height - font_size * 2);

                    ctx.fillStyle = "#aaa";
                    ctx.fillText(`eccentricity = ${e.toFixed(2)}`, half_width, height - font_size * 0.5);

                } else if (mode === "keplerian1") {

                    ctx.fillStyle = "#E92525";
                    ctx.fillText(`inclination = ${(inclination * 180 / pi).toFixed(1)}°`, half_width, height - font_size * 2);

                    ctx.fillStyle = "#1B9AC3";
                    ctx.fillText(`longitude of the ascending node = ${(lon * 180 / pi).toFixed(1)}°`, half_width, height - font_size * 0.5);
                } else if (mode === "keplerian2") {
                    ctx.fillStyle = "#4F8E29";
                    ctx.fillText(`argument of perigee = ${(aop * 180 / pi).toFixed(1)}°`, half_width, height - font_size * 2);

                    ctx.fillStyle = "#DE5B41";
                    ctx.fillText(`true anomaly = ${(sat_angle * 180 / pi).toFixed(1)}°`, half_width, height - font_size * 0.5);
                }
            } else if (mode === "map0" || mode === "map1" || mode === "map2" ||
                mode === "map3" || mode === "map4" || mode === "map5") {


                let l0 = vec_len(vec_sub(point, markers[0]));
                let l1 = vec_len(vec_sub(point, markers[1]));
                let l2 = vec_len(vec_sub(point, markers[2]));

                vp = mat4_mul(mat4_mul(ortho_proj, mat3_to_mat4(rot)),
                    translation_mat4([-0.5, -0.5, 0]));

                ctx.save();
                ctx.translate(size * 0.5, size * 0.5);

                draw_base(vp, rot);
                draw_marker(vp, rot, markers[0], marker_styles[0]);
                draw_marker(vp, rot, markers[1], marker_styles[1]);
                draw_marker(vp, rot, markers[2], marker_styles[2]);

                if (mode === "map2" || mode === "map3" || mode === "map4" || mode === "map5") {
                    draw_tape(vp, rot, markers[0], point);
                }
                if (mode === "map3" || mode === "map4") {
                    draw_tape(vp, rot, markers[1], point);
                }
                if (mode === "map4" || mode === "map5") {
                    draw_tape(vp, rot, markers[2], point);
                }

                draw_figurine(vp, rot, point);
                ctx.restore();

                ctx.translate(Math.round(width * 0.6), half_size - Math.floor(0.5 * map_size));

                draw_map_base(map_size);

                draw_map_marker(map_size, markers[0], marker_styles[0]);
                draw_map_marker(map_size, markers[1], marker_styles[1]);
                draw_map_marker(map_size, markers[2], marker_styles[2]);

                ctx.save();
                clip_map_base(map_size);

                // if (mode === "map0") {
                //     ctx.fillStyle = "rgba(0,0,0,0.2)"
                //     ctx.font = "500 " + Math.round(map_size * 0.6) + "px Helvetica";

                //     ctx.fillText("?", map_size * 0.5, map_size * 0.7);
                // }
                if (mode === "map1") {
                    draw_map_estimation(map_size, point, 0.01 + 0.5 * Math.min(l0, l1, l2));
                }
                if (mode === "map2" || mode === "map3" || mode === "map4" || mode === "map5") {
                    draw_map_circle(map_size, markers[0], l0, marker_styles[0]);
                }
                if (mode === "map3" || mode === "map4") {
                    draw_map_circle(map_size, markers[1], l1, marker_styles[1]);
                }
                if (mode === "map4" || mode === "map5") {
                    draw_map_circle(map_size, markers[2], l2, marker_styles[2]);
                }

                if (mode === "map2") {
                    draw_map_ring_estimation(map_size, markers[0], l0, 0.015);
                } else if (mode === "map3") {
                    let ps = circle_circle_intersection(markers[0], l0, markers[1], l1);
                    draw_map_estimation(map_size, ps[0], 0.015);
                    draw_map_estimation(map_size, ps[1], 0.015);
                } else if (mode === "map4") {
                    draw_map_estimation(map_size, point, 0.015);
                } else if (mode === "map5") {
                    let ps = circle_circle_intersection(markers[0], l0, markers[2], l2);
                    draw_map_estimation(map_size, ps[0], 0.015);
                    draw_map_estimation(map_size, ps[1], 0.015);
                }

                ctx.restore();

                draw_map_decoration(map_size);
            } else if (mode === "string") {

                let start = [0.4, 0.5, 0.0];

                const l = 0.3;

                let clamp = false;
                let dir = vec_sub(point, start);
                let point_l = vec_len(dir);
                if (point_l > l) {
                    point = vec_add(start, vec_scale(dir, l / point_l));
                    clamp = true;
                }

                vp = mat4_mul(mat4_mul(ortho_proj, mat3_to_mat4(rot)),
                    translation_mat4([-0.5, -0.5, 0]));

                ctx.save();
                ctx.translate(size * 0.5, size * 0.5);

                draw_base(vp, rot);
                draw_marker(vp, rot, start, marker_styles[1]);

                // draw_tape(vp, rot, start, point, true);

                let n = 40;
                if (sim === undefined) {
                    sim = [];
                    for (let i = 0; i <= n; i++) {
                        let t = i / n;
                        sim.push([0.5 + t * 0.5, 0.5 + t * 0.5, 0]);
                    }
                }

                const ll = 0.98 * l / n;

                sim[0] = start.slice(0, 2);
                sim[n] = point.slice(0, 2);

                let iter = 25;
                for (let i = 0; i < iter; i++) {

                    sim[0] = start;
                    sim[n] = point;

                    for (let k = n; k > 1; k--) {
                        sim[k - 1] = vec_add(sim[k], vec_scale(vec_norm(vec_sub(sim[k - 1], sim[k])), ll));
                    }

                    for (let k = 1; k < n; k++) {
                        sim[k] = vec_add(sim[k - 1], vec_scale(vec_norm(vec_sub(sim[k], sim[k - 1])), ll));
                    }
                }

                if (clamp) {
                    for (let k = 0; k < n; k++) {
                        sim[k] = vec_lerp(start, point, k / n);
                    }
                }


                ctx.save();
                clip_base(vp, rot);
                draw_circle(vp, rot, start, l, "rgba(0,0,0,0.2");
                draw_string(vp, rot, sim);
                ctx.restore();

                draw_figurine(vp, rot, point);
                ctx.restore();

            } else if (mode === "hill") {

                let t = arg0 * 25;
                let v = 0.046;

                let s = t * v;

                let start = [0.4, 0.5, arg1 * 0.5 + 0.02];

                let head_pos = [point[0], point[1], fig_h - fig_w * 0.5];

                let len = vec_len(vec_sub(head_pos, start));
                let light = Math.abs(s - len) < 0.007;


                if (light) {
                    let p = [0.6, 0.0, 0];
                    let r = vec_sub([0.7, 0.2, 0], p);

                    let q = [start[0], start[2], 0];
                    let s = vec_sub([head_pos[0], head_pos[2], 0], q);

                    let t = vec_cross(vec_sub(q, p), s)[2] / vec_cross(r, s)[2];

                    if (t == saturate(t))
                        light = false;
                }

                vp = mat4_mul(mat4_mul(ortho_proj, mat3_to_mat4(rot)),
                    translation_mat4([-0.5, -0.5, 0]));

                ctx.save();
                ctx.translate(size * 0.5, size * 0.5);

                draw_base(vp, rot);


                if (rot[6] > 0) {
                    draw_ladder(vp, rot, start);

                    draw_marker(vp, ident_mat3, start, marker_styles[1]);
                    draw_hill(vp, rot);
                    draw_figurine(vp, rot, point, light);
                } else {
                    draw_figurine(vp, rot, point, light);
                    draw_hill(vp, rot);
                    draw_ladder(vp, rot, start);
                    draw_marker(vp, ident_mat3, start, marker_styles[1]);

                }


                ctx.restore();

                gl.begin(width, size);


                let wall_a = -Math.atan(2);

                let wall0 = scale_mat4([Math.sqrt(0.05), 1, 1]);
                wall0 = mat4_mul(rot_y_mat4(wall_a), wall0);
                wall0 = mat4_mul(translation_mat4([0.6, 0, 0]), wall0);

                gl.draw_quad(mat4_mul(vp, wall0), rot, [0, 0, 0, 1], "depth");

                let wall1 = scale_mat4([Math.sqrt(0.05), 1, 1]);
                wall1 = mat4_mul(rot_y_mat4(pi - wall_a), wall1);
                wall1 = mat4_mul(translation_mat4([0.8, 0, 0]), wall1);

                gl.draw_quad(mat4_mul(vp, wall1), rot, [0, 0, 0, 1], "depth");


                let wall2 = rot_x_mat4(pi * 0.5);
                wall2 = mat4_mul(rot_y_mat4(pi * 0.25), wall2);
                wall2 = mat4_mul(scale_mat4([0.1 * Math.SQRT2, 1, 0.2 * Math.SQRT2]), wall2);
                wall2 = mat4_mul(translation_mat4([0.6, 0, 0]), wall2);
                let wall3 = mat4_mul(translation_mat4([0, 1, 0]), wall2);

                gl.draw_quad(mat4_mul(vp, wall2), rot, [0, 0, 0, 1], "depth");
                gl.draw_quad(mat4_mul(vp, wall3), rot, [0, 0, 0, 1], "depth");

                {
                    let p0 = point.slice();
                    p0[2] += fig_w;

                    let p1 = point.slice();
                    p1[2] += fig_h - fig_w;

                    let p2 = point.slice();
                    p2[2] += fig_h + fig_w * 0.75;

                    let p3 = start.slice();
                    p3[2] = 0;

                    gl.draw_sphere(mat4_mul(vp, translation_mat4(p0)), rot, [0, 0, 0, 1], fig_w, "depth");
                    gl.draw_sphere(mat4_mul(vp, translation_mat4(p1)), rot, [0, 0, 0, 1], fig_w, "depth");
                    gl.draw_sphere(mat4_mul(vp, translation_mat4(p2)), rot, [0, 0, 0, 1], fig_w, "depth");
                    gl.draw_segment(vp, rot, [0, 0, 0, 1], p0, p1, fig_w, "depth");
                    gl.draw_segment(vp, rot, [0, 0, 0, 1], p3, start, 0.015 * 0.5, "depth");
                }


                gl.draw_sphere(mat4_mul(vp, translation_mat4(start)), rot, [0.3, 0.3, 0.3, 1.0], s, "hill_edge", [...start, s]);


                ctx.drawImage(gl.finish(), 0, 0, width, size);

                ctx.feather(width * scale, height * scale,
                    canvas.height * 0.00, canvas.height * 0.00,
                    canvas.height * 0.08, canvas.height * 0.08);


            } else if (mode === "map_drone0") {
                let marker = [0.4, 0.7, 0.0];

                let t = arg0 * 25;
                let v = 0.04;
                let s = +t * v;
                let l0 = vec_len(vec_sub(point, marker));
                let d = vec_lerp(point, marker, Math.min(l0, s) / l0);
                d[2] = 0.2;

                vp = mat4_mul(mat4_mul(ortho_proj, mat3_to_mat4(rot)), translation_mat4([-0.5, -0.5, 0]));

                ctx.save();
                ctx.translate(size * 0.5, size * 0.5);

                draw_base(vp, rot);
                draw_marker(vp, rot, marker, marker_styles[1]);
                draw_drone_shadow(vp, rot, d);
                draw_figurine(vp, rot, point);
                draw_drone_head_shadow(vp, rot, point, d, 1);

                draw_drone(vp, rot, d, t, marker_styles[1]);

                ctx.restore();

                ctx.save();
                ctx.translate(Math.round(width * 0.8), half_size);

                draw_clock(map_size * 0.4, 4, 49, t);
                draw_clock_arc(map_size * 0.4, 0, 0 + Math.min(l0, s) / v, marker_styles[1]);

                ctx.restore();

                ctx.translate(half_width, height);

                draw_timeline(Math.min(380, Math.round(width * 0.8 / 2 - 10) * 2),
                    Math.ceil(height * 0.1),
                    0, 25, t, undefined, [
                        [0, 0 + Math.min(l0, s) / v]
                    ], [marker_styles[1]]);

            } else if (mode === "map_drone1") {

                let l0 = vec_len(vec_sub(point, markers[0]));
                let l1 = vec_len(vec_sub(point, markers[1]));

                let t = arg0 * 25;
                let v = 0.046;

                let s = t * v;

                let d0 = vec_lerp(point, markers[0], Math.min(l0, s) / l0);
                let d1 = vec_lerp(point, markers[1], Math.min(l1, s) / l1);
                d0[2] = 0.2;
                d1[2] = 0.28;

                vp = mat4_mul(mat4_mul(ortho_proj, mat3_to_mat4(rot)),
                    translation_mat4([-0.5, -0.5, 0]));

                // ctx.translate(0, -20);
                ctx.save();
                ctx.translate(size * 0.5, size * 0.5);

                draw_base(vp, rot);
                draw_marker(vp, rot, markers[0], marker_styles[0]);
                draw_marker(vp, rot, markers[1], marker_styles[1]);
                draw_marker(vp, rot, markers[2], marker_styles[2]);

                draw_drone_shadow(vp, rot, d0);
                draw_drone_shadow(vp, rot, d1);

                draw_figurine(vp, rot, point);
                draw_drone_head_shadow(vp, rot, point, d0, 0.5);
                draw_drone_head_shadow(vp, rot, point, d1, 0.5);


                draw_drone(vp, rot, d0, t + 0.01, marker_styles[0]);
                draw_drone(vp, rot, d1, t, marker_styles[1]);

                ctx.restore();

                ctx.save();
                ctx.translate(Math.round(width * 0.6), half_size - Math.floor(0.5 * map_size));

                draw_map_base(map_size);

                draw_map_marker(map_size, markers[0], marker_styles[0]);
                draw_map_marker(map_size, markers[1], marker_styles[1]);
                draw_map_marker(map_size, markers[2], marker_styles[2]);

                ctx.save();
                clip_map_base(map_size);

                ctx.globalAlpha = smooth_step(l0, l0 + 0.05, s);
                draw_map_circle(map_size, markers[0], l0, marker_styles[0]);

                ctx.globalAlpha = smooth_step(l1, l1 + 0.05, s);
                draw_map_circle(map_size, markers[1], l1, marker_styles[1]);

                ctx.globalAlpha = smooth_step(Math.max(l0, l1), Math.max(l0, l1) + 0.05, s);

                draw_map_estimation(map_size, point, 0.015);

                ctx.globalAlpha = 1;

                ctx.restore();

                draw_map_decoration(map_size);

                ctx.restore();

                ctx.translate(half_width, height);

                draw_timeline(Math.min(380, Math.round(width * 0.8 / 2 - 10) * 2),
                    Math.ceil(height * 0.1),
                    0, 25, t, undefined, [
                        [0, Math.min(l0, s) / v],
                        [0, Math.min(l1, s) / v]
                    ], [marker_styles[0], marker_styles[1]]);
            } else if (mode === "map_sound0" || mode === "map_sound3" || mode === "map_sound4") {

                let has_bias = mode === "map_sound4";

                let marker = [0.4, 0.7, 0.0];

                let t = arg0 * 25;
                let bias = has_bias ? arg1 * 5 - 2.5 : 0;

                let v = 0.04;
                let s = +t * v;

                let l0 = vec_len(vec_sub(point, marker));

                vp = mat4_mul(mat4_mul(ortho_proj, mat3_to_mat4(rot)), translation_mat4([-0.5, -0.5, 0]));

                ctx.save();
                ctx.translate(size * 0.5, size * 0.5);

                draw_base(vp, rot);
                draw_marker(vp, rot, marker, marker_styles[1]);

                ctx.save();
                clip_base(vp, rot);
                if (mode === "map_sound0")
                    draw_circle(vp, rot, point, s, sound_style);
                else
                    draw_circle(vp, rot, marker, s, sound_style);

                ctx.restore();

                if (mode === "map_sound0" && Math.abs(s - l0) < 0.007)
                    draw_marker_light(vp, rot, marker, marker_styles[1]);

                let light0 = mode !== "map_sound0" && Math.abs(s - l0) < 0.007

                draw_figurine(vp, rot, point, light0);

                ctx.restore();

                ctx.save();
                ctx.translate(Math.round(width * 0.8), half_size);

                draw_clock(map_size * 0.4, 4, 49, t + bias, bias);
                draw_clock_arc(map_size * 0.4, 0, Math.max(0, Math.min(l0, s) / v + bias), marker_styles[1]);

                ctx.restore();

                ctx.translate(half_width, height);

                draw_timeline(Math.min(380, Math.round(width * 0.8 / 2 - 10) * 2),
                    Math.ceil(height * 0.1),
                    0, 25, t + bias, has_bias ? t : undefined, [
                        [0, Math.max(0, Math.min(l0, s) / v + bias)]
                    ], [marker_styles[1]]);
            } else if (mode === "map_sound1" || mode === "map_sound5" || mode === "map_sound6" || mode === "map_sound7") {

                let has_bias = mode !== "map_sound1";

                let l0 = vec_len(vec_sub(point, markers[0]));
                let l1 = vec_len(vec_sub(point, markers[1]));
                let l2 = vec_len(vec_sub(point, markers[2]));

                let bias = has_bias ? arg1 * 5 - 2.5 : 0;;

                let t = arg0 * 25;
                let v = 0.046;

                let s = t * v;

                vp = mat4_mul(mat4_mul(ortho_proj, mat3_to_mat4(rot)),
                    translation_mat4([-0.5, -0.5, 0]));

                ctx.save();
                ctx.translate(size * 0.5, size * 0.5);

                draw_base(vp, rot);

                draw_marker(vp, rot, markers[0], marker_styles[0]);
                draw_marker(vp, rot, markers[1], marker_styles[1]);
                draw_marker(vp, rot, markers[2], marker_styles[2]);

                ctx.save();
                clip_base(vp, rot);
                if (mode === "map_sound1") {
                    draw_circle(vp, rot, point, s, sound_style);
                } else {
                    draw_circle(vp, rot, markers[0], s, sound_style);
                    draw_circle(vp, rot, markers[1], s, sound_style);
                    draw_circle(vp, rot, markers[2], s, sound_style);
                }
                ctx.restore();

                if (mode === "map_sound1") {
                    if (Math.abs(s - l0) < 0.007)
                        draw_marker_light(vp, rot, markers[0], marker_styles[0]);
                    if (Math.abs(s - l1) < 0.007)
                        draw_marker_light(vp, rot, markers[1], marker_styles[1]);
                    if (Math.abs(s - l2) < 0.007)
                        draw_marker_light(vp, rot, markers[2], marker_styles[2]);
                }

                if (mode === "map_sound7") {
                    let point_a = point;
                    let point_b = secondary_point;

                    let l3 = vec_len(vec_sub(point_b, markers[0]));
                    let l4 = vec_len(vec_sub(point_b, markers[1]));
                    let l5 = vec_len(vec_sub(point_b, markers[2]));

                    let light0 = Math.abs(s - l0) < 0.007 || Math.abs(s - l1) < 0.007 || Math.abs(s - l2) < 0.007;
                    let light1 = Math.abs(s - l3) < 0.007 || Math.abs(s - l4) < 0.007 || Math.abs(s - l5) < 0.007;

                    if (project(mat4_mul_vec3(vp, point_a))[1] < project(mat4_mul_vec3(vp, point_b))[1]) {
                        draw_figurine(vp, rot, point_a, light0);
                        draw_figurine(vp, rot, point_b, light1, true);
                    } else {
                        draw_figurine(vp, rot, point_b, light1, true);
                        draw_figurine(vp, rot, point_a, light0);
                    }
                } else {

                    let light0 = Math.abs(s - l0) < 0.007 || Math.abs(s - l1) < 0.007 || Math.abs(s - l2) < 0.007;

                    if (mode === "map_sound1")
                        light0 = false;

                    draw_figurine(vp, rot, point, light0);
                }

                ctx.restore();

                ctx.save();
                ctx.translate(Math.round(width * 0.6), half_size - Math.floor(0.5 * map_size));

                draw_map_base(map_size);

                draw_map_marker(map_size, markers[0], marker_styles[0]);
                draw_map_marker(map_size, markers[1], marker_styles[1]);
                draw_map_marker(map_size, markers[2], marker_styles[2]);

                ctx.save();
                clip_map_base(map_size);

                ctx.globalAlpha = smooth_step(l0, l0 + 0.05, s);
                draw_map_circle(map_size, markers[0], Math.max(0, l0 + bias * v), marker_styles[0]);

                ctx.globalAlpha = smooth_step(l1, l1 + 0.05, s);
                draw_map_circle(map_size, markers[1], Math.max(0, l1 + bias * v), marker_styles[1]);

                ctx.globalAlpha = smooth_step(l2, l2 + 0.05, s);
                draw_map_circle(map_size, markers[2], Math.max(0, l2 + bias * v), marker_styles[2]);

                ctx.globalAlpha = smooth_step(Math.max(l0, l1), Math.max(l0, l1) + 0.05, s);

                if (mode !== "map_sound5") {
                    if (mode === "map_sound6" || mode === "map_sound7")
                        ctx.globalAlpha *= smooth_step(-0.2, -0.1, bias) - smooth_step(0.1, 0.2, bias);

                    draw_map_estimation(map_size, point, 0.015);
                    ctx.globalAlpha = 1;
                }

                ctx.globalAlpha = 1;

                ctx.restore();

                draw_map_decoration(map_size);

                ctx.restore();

                ctx.translate(half_width, height);

                draw_timeline(Math.min(380, Math.round(width * 0.8 / 2 - 10) * 2),
                    Math.ceil(height * 0.1),
                    0, 25, t + bias, has_bias ? t : undefined, [
                        [0, Math.max(0, Math.min(l0, s) / v + bias)],
                        [0, Math.max(0, Math.min(l1, s) / v + bias)],
                        [0, Math.max(0, Math.min(l2, s) / v + bias)]
                    ],
                    marker_styles);
            } else if (mode === "map_sound2") {

                let point_a = point;
                let point_b = secondary_point;

                let l0_a = vec_len(vec_sub(point_a, markers[0]));
                let l1_a = vec_len(vec_sub(point_a, markers[1]));
                let l2_a = vec_len(vec_sub(point_a, markers[2]));

                let l0_b = vec_len(vec_sub(point_b, markers[0]));
                let l1_b = vec_len(vec_sub(point_b, markers[1]));
                let l2_b = vec_len(vec_sub(point_b, markers[2]));

                let l0 = Math.min(l0_a, l0_b);
                let l1 = Math.min(l1_a, l1_b);
                let l2 = Math.min(l2_a, l2_b);

                let t = arg0 * 25;
                let v = 0.046;
                let s_a = t * v;
                let s_b = t * v;

                vp = mat4_mul(mat4_mul(ortho_proj, mat3_to_mat4(rot)), translation_mat4([-0.5, -0.5, 0]));

                ctx.save();
                ctx.translate(size * 0.5, size * 0.5);

                draw_base(vp, rot);

                draw_marker(vp, rot, markers[0], marker_styles[0]);
                draw_marker(vp, rot, markers[1], marker_styles[1]);
                draw_marker(vp, rot, markers[2], marker_styles[2]);

                ctx.save();
                clip_base(vp, rot);
                draw_circle(vp, rot, point_a, s_a, sound_style);
                draw_circle(vp, rot, point_b, s_b, sound_style);
                ctx.restore();

                if (Math.abs(s_a - l0_a) < 0.007 || Math.abs(s_b - l0_b) < 0.007)
                    draw_marker_light(vp, rot, markers[0], marker_styles[0]);
                if (Math.abs(s_a - l1_a) < 0.007 || Math.abs(s_b - l1_b) < 0.007)
                    draw_marker_light(vp, rot, markers[1], marker_styles[1]);
                if (Math.abs(s_a - l2_a) < 0.007 || Math.abs(s_b - l2_b) < 0.007)
                    draw_marker_light(vp, rot, markers[2], marker_styles[2]);

                if (project(mat4_mul_vec3(vp, point_a))[1] < project(mat4_mul_vec3(vp, point_b))[1]) {
                    draw_figurine(vp, rot, point_a, false);
                    draw_figurine(vp, rot, point_b, false, true);
                } else {
                    draw_figurine(vp, rot, point_b, false, true);
                    draw_figurine(vp, rot, point_a, false);
                }

                ctx.restore();

                ctx.save();
                ctx.translate(Math.round(width * 0.6), half_size - Math.floor(0.5 * map_size));

                draw_map_base(map_size);

                draw_map_marker(map_size, markers[0], marker_styles[0]);
                draw_map_marker(map_size, markers[1], marker_styles[1]);
                draw_map_marker(map_size, markers[2], marker_styles[2]);

                ctx.save();
                clip_map_base(map_size);

                ctx.globalAlpha = smooth_step(l0, l0 + 0.05, s_a);
                draw_map_circle(map_size, markers[0], l0, marker_styles[0]);

                ctx.globalAlpha = smooth_step(l1, l1 + 0.05, s_a);
                draw_map_circle(map_size, markers[1], l1, marker_styles[1]);

                ctx.globalAlpha = smooth_step(l2, l2 + 0.05, s_a);
                draw_map_circle(map_size, markers[2], l2, marker_styles[2]);

                ctx.restore();

                draw_map_decoration(map_size);

                ctx.restore();

                ctx.translate(half_width, height);

                draw_timeline(Math.min(380, Math.round(width * 0.8 / 2 - 10) * 2),
                    Math.ceil(height * 0.1),
                    0, 25, t, undefined, [
                        [0, Math.min(l0, s_a) / v],
                        [0, Math.min(l1, s_a) / v],
                        [0, Math.min(l2, s_a) / v]
                    ],
                    marker_styles);
            } else if (mode === "clocks") {

                let t = arg0 * 25;
                let bias = arg1 * 5 - 2.5;

                ctx.save();
                ctx.translate(half_size, half_size + font_size);

                ctx.fillStyle = "#4C6DD0";
                ctx.font = "500 " + font_size + "px IBM Plex Sans";
                ctx.fillText("system clock", 0, -half_size);

                draw_big_clock(Math.round(size * 0.4), 4, 49, t);

                ctx.restore();

                ctx.save();
                ctx.translate(Math.round(width * 0.8), half_size + font_size);

                draw_clock(map_size * 0.4, 4, 49, t + bias, bias);

                ctx.fillStyle = "#E92525";
                ctx.font = "500 " + font_size + "px IBM Plex Sans";
                ctx.fillText("our clock", 0, -half_size);

                ctx.restore();

                ctx.translate(half_width, height);

                draw_timeline(Math.min(380, Math.round(width * 0.8 / 2 - 10) * 2),
                    Math.ceil(height * 0.1),
                    0, 25, t + bias, t, [], []);
            } else if (mode === "map_ladder0") {

                point[2] = arg0 * 0.25;

                let p0 = [point[0], point[1], 0];

                let l0 = vec_len(vec_sub(point, markers[0]));
                let l1 = vec_len(vec_sub(point, markers[1]));
                let l2 = vec_len(vec_sub(point, markers[2]));

                vp = mat4_mul(mat4_mul(ortho_proj, mat3_to_mat4(rot)), translation_mat4([-0.5, -0.5, 0]));

                ctx.save();
                ctx.translate(size * 0.5, size * 0.5);

                draw_base(vp, rot);
                draw_marker(vp, rot, markers[0], marker_styles[0]);
                draw_marker(vp, rot, markers[1], marker_styles[1]);
                draw_marker(vp, rot, markers[2], marker_styles[2]);

                draw_marker(vp, rot, p0, "#999");

                let items = [
                    [project(mat4_mul_vec3(vp, p0))[1], function() { draw_ladder(vp, rot, point); }],
                    [project(mat4_mul_vec3(vp, markers[0]))[1], function() { draw_tape(vp, rot, markers[0], point); }],
                    [project(mat4_mul_vec3(vp, markers[1]))[1], function() { draw_tape(vp, rot, markers[1], point); }],
                    [project(mat4_mul_vec3(vp, markers[2]))[1], function() { draw_tape(vp, rot, markers[2], point); }],
                ]

                items.sort((a, b) => a[0] - b[0]);

                items.forEach(a => {
                    a[1]();
                })


                draw_marker(vp, rot, point, "#999");

                draw_figurine(vp, rot, point);
                ctx.restore();

                ctx.save();



                ctx.translate(Math.round(width * 0.6), half_size - Math.floor(0.5 * map_size));
                draw_map_base(map_size);

                draw_map_marker(map_size, markers[0], marker_styles[0]);
                draw_map_marker(map_size, markers[1], marker_styles[1]);
                draw_map_marker(map_size, markers[2], marker_styles[2]);

                ctx.save();
                clip_map_base(map_size);

                draw_map_circle(map_size, markers[0], l0, marker_styles[0]);
                draw_map_circle(map_size, markers[1], l1, marker_styles[1]);
                draw_map_circle(map_size, markers[2], l2, marker_styles[2]);

                ctx.restore();

                draw_map_decoration(map_size);

                ctx.restore();


            } else if (mode === "map_ladder1" || mode === "map_ladder2" ||
                mode === "map_ladder3" || mode === "map_ladder4") {

                point[2] = arg0 * 0.25;

                let bias = arg2 * 5 - 2.5;

                let t = arg1 * 25;
                let v = 0.046;

                let s = t * v;

                let count = 3;
                if (mode === "map_ladder3" || mode === "map_ladder4") {
                    count = 4;
                }

                if (mode === "map_ladder4")
                    markers[3][2] = 0.5;

                let pairs_count = (count - 1) * count / 2;

                let lengths = [];
                let alphas = [];

                let light = false;

                for (let i = 0; i < count; i++) {
                    let len = vec_len(vec_sub(point, markers[i]));
                    lengths.push(len);
                    alphas.push(smooth_step(len, len + 0.02, s));
                    light = light || Math.abs(s - len) < 0.007;
                }

                if (mode === "map_ladder1") {
                    alphas[0] = alphas[1] = alphas[2] = 1;
                } else {
                    lengths = lengths.map(l => Math.max(0, l + bias * v));
                }

                vp = mat4_mul(mat4_mul(ortho_proj, mat3_to_mat4(rot)), translation_mat4([-0.5, -0.5, 0]));

                let s_color = vec_scale([0.5, 0.5, 0.5, 1.0], 0.4);
                let s_color2 = vec_scale([0.3, 0.3, 0.3, 1.0], 0.7);

                let pc = vec_scale([255, 211, 9, 255], 1 / 255);
                let ec = vec_scale([0.55, 0.55, 0.55, 1.0], 0.4);

                let er = 0.005;
                let pr = 0.023;

                gl.begin(width, size);

                if (mode !== "map_ladder1") {
                    gl.viewport(0, 0, size, size);

                    gl.draw_quad(vp, rot, [0, 0, 0, 1], "depth");

                    let sc = scale_mat4([1, 0.15, 1]);
                    let r = rot_x_mat4(-pi / 2);
                    let tr = translation_mat4([-0.5, 0.5, 0.0]);
                    let m = mat4_mul(mat4_mul(tr, r), sc);
                    let tr2 = translation_mat4([0.5, 0.5, 0.0]);

                    for (let i = 0; i < 4; i++) {
                        let rz = rot_z_mat4(i * pi / 2);
                        gl.draw_quad(mat4_mul(mat4_mul(vp, tr2), mat4_mul(rz, m)), rot, [0, 0, 0, 1], "depth");
                    }

                    {
                        let p0 = point.slice();
                        p0[2] += fig_w;

                        let p1 = point.slice();
                        p1[2] += fig_h - fig_w;

                        let p2 = point.slice();
                        p2[2] += fig_h + fig_w * 0.75;

                        let p3 = point.slice();
                        p3[2] = 0;

                        gl.draw_sphere(mat4_mul(vp, translation_mat4(p0)), rot, [0, 0, 0, 1], fig_w, "depth");
                        gl.draw_sphere(mat4_mul(vp, translation_mat4(p1)), rot, [0, 0, 0, 1], fig_w, "depth");
                        gl.draw_sphere(mat4_mul(vp, translation_mat4(p2)), rot, [0, 0, 0, 1], fig_w, "depth");
                        gl.draw_segment(vp, rot, [0, 0, 0, 1], p0, p1, fig_w, "depth");
                        gl.draw_segment(vp, rot, [0, 0, 0, 1], p3, point, 0.015 * 0.5, "depth");
                    }

                    for (let i = 0; i < count; i++)
                        gl.draw_sphere(mat4_mul(vp, translation_mat4(markers[i])), rot, s_color2, s, "edge", [0, 0, -1, 0]);
                }

                gl.viewport(half_width, 0, size, size);
                gl.reset_blending();

                gl.draw_quad(mat4_mul(vp, mat4_mul(translation_mat4([-0.01, -0.01, 0.0]), scale_mat4(1.02))),
                    rot, [0, 0, 0, 1], "depth");

                let pairs = [
                    [0, 1],
                    [0, 2],
                    [1, 2],
                    [0, 3],
                    [1, 3],
                    [2, 3]
                ];
                let e_rots = [];
                let e_trs = [];
                let ints = [];

                for (let i = 0; i < pairs_count; i++) {

                    let i0 = pairs[i][0];
                    let i1 = pairs[i][1];

                    let int = circle_circle_intersection(markers[i0], lengths[i0], markers[i1], lengths[i1]);

                    let n0 = vec_norm(vec_sub(markers[i0], markers[i1]));
                    let n1 = [0, Math.SQRT1_2, Math.SQRT1_2];
                    let n2 = vec_norm(vec_cross(n0, n1));
                    n1 = vec_cross(n2, n0);

                    e_rots.push(mat3_transpose([n2[0], n2[1], n2[2], n1[0], n1[1], n1[2], n0[0], n0[1], n0[2]]));
                    e_trs.push(translation_mat4(int[2]));
                    ints.push(int);
                }

                if (count == 3) {
                    let p = ints[1][2];
                    let r = vec_sub(ints[1][0], p);

                    let q = ints[2][2];
                    let s = vec_sub(ints[2][0], q);

                    let int_t = vec_cross(vec_sub(q, p), s)[2] / vec_cross(r, s)[2];

                    if (int_t > -1.0001 && int_t < 1.0001) {
                        int_t = clamp(int_t, -1, 1);

                        let intersection_point = vec_add(p, vec_scale(r, int_t));
                        intersection_point[2] = Math.sqrt(1 - int_t * int_t) * ints[1][3];

                        let a = alphas[0] * alphas[1] * alphas[2];
                        if (intersection_point && a > 0.3)
                            gl.draw_sphere(mat4_mul(vp, translation_mat4(intersection_point)), rot, vec_scale(pc, a), pr, "stroke");
                    }

                } else if (count == 4) {
                    let a = smooth_step(-0.2, -0.1, bias) - smooth_step(0.1, 0.2, bias);
                    if (a > 0.3)
                        gl.draw_sphere(mat4_mul(vp, translation_mat4(point)), rot, vec_scale(pc, a), pr, "stroke");
                }



                for (let i = 0; i < pairs_count; i++)
                    gl.draw_ellipse(mat4_mul(mat4_mul(vp, e_trs[i]), mat3_to_mat4(e_rots[i])),
                        rot, vec_scale(ec, alphas[pairs[i][0]] * alphas[pairs[i][1]]),
                        ints[i][3], 0, er);

                for (let i = 0; i < count; i++)
                    gl.draw_sphere(mat4_mul(vp, translation_mat4(markers[i])), rot,
                        vec_scale(s_color, alphas[i]), lengths[i], "edge");


                ctx.save();
                ctx.translate(size * 0.5, size * 0.5);

                draw_base(vp, rot);
                for (let i = 0; i < 3; i++)
                    draw_marker(vp, rot, markers[i], marker_styles[i]);

                if (mode === "map_ladder3")
                    draw_marker(vp, rot, markers[3], marker_styles[3]);
                else if (mode === "map_ladder4")
                    draw_marker(vp, ident_mat3, markers[3], marker_styles[3]);

                draw_marker(vp, rot, [point[0], point[1], 0], "#999");

                draw_ladder(vp, rot, point);

                if (mode === "map_ladder1") {
                    draw_tape(vp, rot, markers[0], point);
                    draw_tape(vp, rot, markers[1], point);
                    draw_tape(vp, rot, markers[2], point);
                }

                draw_marker(vp, rot, point, "#999");

                draw_figurine(vp, rot, point, light);
                ctx.restore();

                ctx.save();



                ctx.save();
                ctx.translate(half_width + size * 0.5, size * 0.5);

                draw_proj_map_base(vp, rot);
                for (let i = 0; i < 3; i++)
                    draw_marker(vp, rot, markers[i], marker_styles[i]);

                if (mode === "map_ladder3")
                    draw_marker(vp, rot, markers[3], marker_styles[3]);

                ctx.restore();




                ctx.drawImage(gl.finish(), 0, 0, width, size);

                ctx.feather(half_width * scale, size * scale,
                    canvas.height * 0.08, canvas.height * 0.08,
                    canvas.height * 0.08, canvas.height * 0.08,
                    half_width * scale, 0);

                ctx.feather(half_width * scale, size * scale,
                    canvas.height * 0.08, canvas.height * 0.08,
                    canvas.height * 0.08, canvas.height * 0.08);


                ctx.strokeStyle = "#aaa";
                ctx.strokeLine(half_width, size * 0.1, half_width, size * 0.9);

                ctx.restore();

                if (mode !== "map_ladder1") {
                    ctx.translate(half_width, height);

                    let bars = [];
                    for (let i = 0; i < count; i++)
                        bars.push([0, Math.max(0, Math.min(lengths[i], s) / v + bias)]);


                    draw_timeline(Math.min(380, Math.round(width * 0.8 / 2 - 10) * 2),
                        Math.ceil(height * 0.1),
                        0, 25, t + bias, t, bars,
                        marker_styles);
                }


            } else if (mode === "spheres0" || mode === "spheres1" || mode === "spheres2") {

                let l0 = arg0 * 0.8;
                let l1 = arg1 * 0.8;
                let l2 = arg2 * 0.8;

                let p0 = vec_scale(vec_sub(markers[0], [0.5, 0.5, 0.0]), 0.9);
                let p1 = vec_scale(vec_sub(markers[1], [0.5, 0.5, 0.0]), 0.9);
                let p2 = vec_scale(vec_sub(markers[2], [0.5, 0.5, 0.0]), 0.9);

                let c2 = [247 / 255, 65 / 255, 57 / 255, 1];
                let c0 = [104 / 255, 204 / 255, 105 / 255, 1];
                let c1 = [91 / 255, 127 / 255, 216 / 255, 1];
                let pc = [0.2, 0.2, 0.2, 1.0];
                let ec = vec_scale([0.55, 0.55, 0.55, 1.0], 0.4);

                let rr = 0.02;
                let er = 0.005;
                let pr = 0.025;


                vp = mat4_mul(proj, mat3_to_mat4(rot));

                gl.begin(width, height);

                let s_color = vec_scale([0.5, 0.5, 0.5, 1.0], 0.4);

                gl.draw_sphere(mat4_mul(vp, translation_mat4(p0)), rot, c0, rr);
                gl.draw_sphere(mat4_mul(vp, translation_mat4(p1)), rot, c1, rr);
                gl.draw_sphere(mat4_mul(vp, translation_mat4(p2)), rot, c2, rr);

                let int01 = circle_circle_intersection(p0, l0, p1, l1);
                let int02 = circle_circle_intersection(p0, l0, p2, l2);
                let int12 = circle_circle_intersection(p1, l1, p2, l2);

                let e01_rot, e01_tr0, e02_rot, e02_tr0, e12_rot, e12_tr0;

                {
                    let n0 = vec_norm(vec_sub(p1, p0));
                    let n1 = [0, 0, 1];
                    let n2 = vec_cross(n0, n1);

                    e01_rot = mat3_transpose([n2[0], n2[1], n2[2], n1[0], n1[1], n1[2], n0[0], n0[1], n0[2]]);
                    e01_tr0 = translation_mat4(int01[2]);
                }


                {
                    let n0 = vec_norm(vec_sub(p2, p0));
                    let n1 = [0, 0, 1];
                    let n2 = vec_cross(n0, n1);

                    e02_rot = mat3_transpose([n2[0], n2[1], n2[2], n1[0], n1[1], n1[2], n0[0], n0[1], n0[2]]);
                    e02_tr0 = translation_mat4(int02[2]);
                }

                {
                    let n0 = vec_norm(vec_sub(p2, p1));
                    let n1 = [0, 0, 1];
                    let n2 = vec_cross(n0, n1);

                    e12_rot = mat3_transpose([n2[0], n2[1], n2[2], n1[0], n1[1], n1[2], n0[0], n0[1], n0[2]]);
                    e12_tr0 = translation_mat4(int12[2]);
                }

                let p = int02[2];
                let r = vec_sub(int02[0], p);

                let q = int12[2];
                let s = vec_sub(int12[0], q);

                let t = vec_cross(vec_sub(q, p), s)[2] / vec_cross(r, s)[2];



                if (Math.abs(t) <= 1) {
                    let flat = vec_add(p, vec_scale(r, t));
                    flat[2] = Math.sqrt(1 - t * t) * int02[3];
                    gl.draw_sphere(mat4_mul(vp, translation_mat4(flat)), rot, pc, pr);
                    flat[2] *= -1;
                    gl.draw_sphere(mat4_mul(vp, translation_mat4(flat)), rot, pc, pr);
                }


                gl.draw_ellipse(mat4_mul(mat4_mul(vp, e01_tr0), mat3_to_mat4(e01_rot)), rot, ec, int01[3], 0, er);
                gl.draw_ellipse(mat4_mul(mat4_mul(vp, e02_tr0), mat3_to_mat4(e02_rot)), rot, ec, int02[3], 0, er);
                gl.draw_ellipse(mat4_mul(mat4_mul(vp, e12_tr0), mat3_to_mat4(e12_rot)), rot, ec, int12[3], 0, er);

                gl.draw_sphere(mat4_mul(vp, translation_mat4(p0)), rot, s_color, l0, "edge");
                gl.draw_sphere(mat4_mul(vp, translation_mat4(p1)), rot, s_color, l1, "edge");
                gl.draw_sphere(mat4_mul(vp, translation_mat4(p2)), rot, s_color, l2, "edge");


                ctx.drawImage(gl.finish(), 0, 0, width, height);
            } else if (mode === "satellite_sim0" || mode === "satellite_sim1") {

                dt *= 1.5;

                let sc = height * 0.12;
                let R = 1;
                let r = 0.1;

                let mu = 10;

                let a, b, c, argp, ecc;


                if (sim === undefined) {
                    sim = [
                        [0, R + r],
                        [0, 0], 0
                    ];
                    ecc = 0;
                    a = 0;
                } else {

                    let p = [sim[0][0], sim[0][1], 0];
                    let v = [sim[1][0], sim[1][1], 0];
                    let r = vec_len(p);

                    let h = vec_cross(p, v);
                    let n = [1, 0, 0];

                    let e = vec_sub(vec_scale(vec_cross(v, h), 1 / mu), vec_scale(p, 1 / r));

                    let ee = vec_len(e);
                    ecc = ee;

                    let E = vec_dot(v, v) * 0.5 - mu / r;

                    a = -mu * 0.5 / E;

                    b = a * Math.sqrt(1 - ee * ee);
                    c = ee * a;

                    argp = Math.acos(vec_dot(n, e) / (ee));

                    if (e[1] < 0)
                        argp = 2 * pi - argp;

                    dt /= 32;

                    for (let i = 0; i < 32; i++) {
                        let r2 = vec_len_sq(sim[0]);
                        let dir = vec_norm(sim[0]);
                        let a = vec_scale(dir, -mu / r2);

                        sim[1] = vec_add(sim[1], vec_scale(a, dt));
                        sim[0] = vec_add(sim[0], vec_scale(sim[1], dt));
                    }
                }


                let pos = sim[0];
                let vel = sim[1];
                let acc = vec_scale(vec_norm(pos), -mu / vec_len_sq(pos));

                let stationary = false;

                let ll = vec_len(pos);
                if (ll <= R + r) {
                    stationary = true;
                    pos = vec_scale(pos, (R + r) / ll);
                    vel = [0, 0];
                    this.set_paused(true);
                } else if (ecc > 1 && vec_len(vec_sub(ss_point, [half_width, half_height])) > width * 2) {
                    this.set_paused(true);
                }

                if (dragging) {
                    ss_point[0] = Math.min(width - height * 0.05, Math.max(height * 0.05, ss_point[0]));
                    ss_point[1] = Math.min(height * 0.95, Math.max(height * 0.05, ss_point[1]));

                    pos[0] = (ss_point[0] - half_width) / sc;
                    pos[1] = (ss_point[1] - half_height) / sc;


                    let ll = vec_len(pos);

                    if (ll <= R + r) {
                        pos = vec_scale(pos, (R + r) / ll);
                        ss_point[0] = pos[0] * sc + half_width;
                        ss_point[1] = pos[1] * sc + half_height;
                    }

                    sim[0] = pos;
                    sim[1] = [mode === "satellite_sim1" ? -2 : 0, 0];
                } else {
                    ss_point[0] = pos[0] * sc + half_width;
                    ss_point[1] = pos[1] * sc + half_height;
                }

                vp = ortho_proj;

                ctx.translate(half_width, half_size);

                ctx.scale(sc, sc);



                ctx.lineWidth = 1.5 / sc;
                // ctx.strokeStyle = "#13375C";
                ctx.strokeStyle = "#325480";
                ctx.lineCap = "butt";

                let dc = Math.cos(1.1);
                let ds = Math.sin(1.1);

                for (let i = 0; i < 12; i++) {

                    let r = R * 1.5 + i * 0.5 * R;
                    let n = Math.ceil(2 * pi * r * 2);

                    let l = 0.7 / (r * r);
                    ctx.globalAlpha = 1 - i / 12;

                    for (let k = 0; k < n; k++) {
                        let a = 2 * pi * k / n + random_numbers[i];
                        let c = Math.cos(a);
                        let s = Math.sin(a);
                        ctx.strokeLine(r * c, r * s, (r - l) * c, (r - l) * s);

                        ctx.strokeLine((r - l) * c, (r - l) * s,
                            (r - l) * c + l * 0.4 * (s * dc + c * ds),
                            (r - l) * s - l * 0.4 * (c * dc - s * ds));

                        ctx.strokeLine((r - l) * c, (r - l) * s,
                            (r - l) * c - l * 0.4 * (s * dc - c * ds),
                            (r - l) * s + l * 0.4 * (c * dc + s * ds));
                    }
                }
                ctx.globalAlpha = 1;


                function bisect(a, b, f) {
                    let fa = f(a);

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
                        }
                    }

                    return a;
                }

                ctx.save();

                if (mode === "satellite_sim1" && !stationary) {
                    ctx.rotate(argp);

                    ctx.lineWidth = 1.5 / sc;

                    let max_r = (width + height) / sc;

                    let fx, fy;
                    let range;

                    if (ecc < 1) {
                        ctx.strokeStyle = "rgba(223, 200, 141, 0.38)";

                        fx = function(t) { return a * Math.cos(t) - c; }
                        fy = function(t) { return b * Math.sin(t) }

                        range = pi;
                    } else {
                        b = a * Math.sqrt((ecc * ecc - 1));
                        c = Math.sqrt(a * a + b * b);

                        fx = function(t) { return a * Math.cosh(t) + c; }
                        fy = function(t) { return b * Math.sinh(t) }

                        range = 10e5;

                        ctx.strokeStyle = "#880000";

                    }

                    let func = function(t) {
                        let x = fx(t);
                        let y = fy(t);
                        return x * x + y * y - max_r * max_r;
                    }


                    let t0 = bisect(0, range, func);
                    let t1 = bisect(0, -range, func);

                    ctx.beginPath();

                    let n = 128;
                    for (let i = 0; i <= n; i++) {
                        let t = lerp(t0, t1, i / n);
                        ctx.lineTo(fx(t), fy(t));
                    }

                    ctx.stroke();

                }

                ctx.restore();




                ctx.fillStyle = "#8A4141";
                ctx.strokeStyle = "#3377CD";

                // ctx.strokeEllipse(0, 0, R);
                // ctx.fillEllipse(0, 0, R);

                gl.begin(sc * 2, sc * 2)

                gl.draw_earth(mat4_mul(x_flip_mat4, rot_x_mat4(-pi * 0.8)), rot_x_mat3(-pi * 0.8));

                ctx.drawImage(gl.finish(), -R, -R, R * 2, R * 2);

                ctx.lineWidth = 1 / sc;

                ctx.fillStyle = "rgba(255,205,70,0.8)";
                ctx.strokeStyle = "#793434";

                let vel_sc = 0.7;

                let dd = 0.7 * Math.min(1, vec_len(vel) * vel_sc / (4 * r));
                ctx.arrow(pos[0], pos[1], pos[0] + vel[0] * vel_sc, pos[1] + vel[1] * vel_sc, r * dd * 1.2, 4 * r * dd, 5 * r * dd);
                ctx.fill();
                // ctx.stroke();




                ctx.fillStyle = "#FFB200";
                ctx.strokeStyle = "#E48900";

                ctx.fillEllipse(pos[0], pos[1], r);
                ctx.strokeEllipse(pos[0], pos[1], r);

                ctx.feather(canvas.width, canvas.height,
                    canvas.height * 0.05, canvas.height * 0.05,
                    canvas.height * 0.05, canvas.height * 0.05);
            } else if (mode === "overlap") {

                ctx.translate(half_width, half_width);

                let s = half_width * 0.8;

                let r = lerp(0.03, 0.15, arg0);
                let a = lerp(0.15, 1.4, arg1);

                ctx.strokeStyle = "#E21503";

                ctx.save();
                ctx.lineWidth = s * r;
                ctx.rotate(-a);
                for (let i = 0; i < 3; i++) {

                    ctx.strokeEllipse(0, -s, s);
                    ctx.rotate(a);
                    ctx.globalCompositeOperation = "source-in";
                }

                ctx.restore();


                ctx.globalCompositeOperation = "destination-over";

                ctx.strokeStyle = "rgba(255,255,255,0.25)";


                ctx.save();
                ctx.lineWidth = s * r;
                ctx.rotate(-a);

                let rw = s * 0.02;

                for (let i = 0; i < 3; i++) {

                    ctx.fillStyle = "rgba(240, 162, 53, 0.8)";
                    ctx.fillRect(-rw * 0.5, -s - rw * 0.5, rw, rw);

                    ctx.fillStyle = "rgba(73, 117, 152, 0.8)";
                    ctx.fillRect(rw * 0.7, -s - rw * 0.5 * 0.8, rw * 2.0, rw * 0.8);
                    ctx.fillRect(-rw * 2.7, -s - rw * 0.5 * 0.8, rw * 2.0, rw * 0.8);
                    // 
                    // ctx.fillEllipse(0, -s, rw);
                    ctx.strokeEllipse(0, -s, s);
                    ctx.rotate(a);
                }

                ctx.restore();

                ctx.beginPath();

                ctx.strokeStyle = "rgba(223, 200, 141, 0.38)";
                ctx.lineWidth = 1.5;
                ctx.setLineDash([s * 0.01, s * 0.02]);
                ctx.arc(0, 0, s, 0, pi, true);
                ctx.stroke();



                ctx.feather(canvas.width, canvas.height,
                    canvas.height * 0.2, canvas.height * 0.2,
                    canvas.height * 0.2, canvas.height * 0.2);

            } else if (mode === "atmosphere") {
                ctx.translate(half_width, half_height);

                ctx.scale(half_height, half_height);

                let a = arg0 * pi * 0.5;
                let rs = 11.995;
                let r0 = 12;

                let r1 = r0 * (1 + 14 * 1000 / EarthRadius);
                let r2 = r0 * (1 + 16 * 1000 / EarthRadius);
                let r3 = r0 * (1 + 20 * 1000 / EarthRadius);
                let r4 = r0 * (1 + 35 * 1000 / EarthRadius);
                let r5 = r0 * (1 + 50 * 1000 / EarthRadius);
                let r6 = r0 * (1 + 1000 * 1000 / EarthRadius);


                let d = 12.6;


                ctx.lineWidth = 2.5 / half_height;


                ctx.save();
                ctx.translate(0, d);

                let grad = ctx.createRadialGradient(0, 0, 0, 0, 0, r6);

                grad.addColorStop(0, "#000");
                grad.addColorStop(rs / r6, "#000");
                grad.addColorStop(r0 / r6, "rgba(177,254,254,0.9)");
                grad.addColorStop(r1 / r6, "rgba(177,254,254,0.9)");
                grad.addColorStop(r2 / r6, "rgba(21,140,242,0.9)");
                grad.addColorStop(r3 / r6, "rgba(21,140,242,0.9)");
                grad.addColorStop(r4 / r6, "rgba(0,61,126,0.64)");
                grad.addColorStop(r5 / r6, "rgba(0,61,126,0.1)");
                grad.addColorStop(1, "rgba(0,0,0,0)");



                ctx.fillStyle = grad;


                ctx.fillEllipse(0, 0, r6);

                ctx.feather(canvas.width, canvas.height,
                    canvas.height * 0.8, canvas.height * 0.8,
                    canvas.height * 0.2, canvas.height * 0.2);

                let l = 1.5;
                let h = 0.03;

                ctx.globalCompositeOperation = "source-atop";

                ctx.strokeStyle = "#DB1001"

                ctx.translate(0, -r0 - ctx.lineWidth * 0.5);
                ctx.save();
                ctx.rotate(a);

                ctx.strokeLine(0, 0, 0, -l);
                ctx.strokeLine(-h, -l + l * 0.1, 0, -l + h * 2 + l * 0.1);
                ctx.strokeLine(+h, -l + l * 0.1, 0, -l + h * 2 + l * 0.1);

                ctx.strokeStyle = "#9A8B60"

                ctx.globalCompositeOperation = "destination-over";
                ctx.strokeLine(0, 0, 0, -l);

                ctx.strokeLine(-h, -l + l * 0.1, 0, -l + h * 2 + l * 0.1);
                ctx.strokeLine(+h, -l + l * 0.1, 0, -l + h * 2 + l * 0.1);

                ctx.restore();

                ctx.globalCompositeOperation = "destination-over";

                ctx.strokeStyle = "#444";

                ctx.beginPath();
                ctx.arc(0, 0, l * 0.8, -pi * 0.5, -pi * 0.5 + a);
                ctx.stroke();

                ctx.lineWidth = 1.5 / half_height;

                ctx.setLineDash([2.0 / half_height, 4.0 / half_height]);

                ctx.strokeLine(0, 0, 0, -l);



                ctx.translate(-0.3, 0.0)
                grad = ctx.createRadialGradient(0, 0, 0, 0, 0, 0.15);
                grad.addColorStop(0.00, "#ffffff");
                grad.addColorStop(0.05, "#ffffff");
                grad.addColorStop(0.07, "#FDFFA1");
                grad.addColorStop(0.15, "rgba(252, 202, 135, 0.75)");
                grad.addColorStop(0.22, "rgba(253, 180, 119, 0.47)");
                grad.addColorStop(0.33, "rgba(254, 153, 99, 0.22)");
                grad.addColorStop(0.42, "rgba(255, 122, 76, 0.12)");
                grad.addColorStop(0.50, "rgba(255, 119, 73, 0.00)");

                ctx.globalCompositeOperation = "lighter";
                ctx.fillStyle = grad;
                ctx.fillEllipse(0, 0, 0.15);

            } else if (mode === "time_dilation") {

                let R = 1;
                let r = 0.1;

                let dist = lerp(1.015678553, 8.8393, arg0);

                let dist_m = dist * EarthRadius;
                let sat_period = Math.sqrt(4 * pi * pi * dist_m * dist_m * dist_m / EarthMu);
                let time = t / 14.0;

                if (sim === undefined)
                    sim = 0;

                sim += EarthSiderealDay * dt / sat_period / 14.0;


                let a = sim * pi * 2;

                let speed = 0.01 * 2 * pi * dist_m / sat_period;

                let pos = [dist * Math.cos(a), dist * Math.sin(a), 0];
                let vel = vec_scale([Math.sin(a), -Math.cos(a)],
                    speed);

                let sc = 0.105;


                // ctx.scale(sc, sc);

                gl.begin(width, width);

                let vp = mat4_mul(scale_mat4(sc), x_flip_mat4);

                gl.draw_earth(mat4_mul(vp, rot_x_mat4(-pi * 0.5)), rot_x_mat3(-pi * 0.5));

                gl.draw_satellite(vp, ident_mat3, pos, 0.2);
                gl.draw_ellipse(vp, ident_mat3, orbit_color, dist, 0.0, 0.02);


                ctx.translate(half_width, half_height);

                ctx.drawImage(gl.finish(), -half_width, -half_width, width, width);



                ctx.lineWidth = 1.5;
                ctx.strokeStyle = "#325480";
                ctx.lineCap = "butt";

                let dc = Math.cos(1.1);
                let ds = Math.sin(1.1);

                for (let i = 0; i < 12; i++) {

                    let r = (R * 1.5 + i * 0.5 * R)
                    let n = Math.ceil(2 * pi * r * 2);

                    let l = 0.8 / (r * r);
                    l *= width * sc * 0.5;
                    r *= width * sc * 0.5;
                    ctx.globalAlpha = 1 - i / 12;

                    for (let k = 0; k < n; k++) {
                        let a = 2 * pi * k / n + random_numbers[i];
                        let c = Math.cos(a);
                        let s = Math.sin(a);
                        ctx.strokeLine(r * c, r * s, (r - l) * c, (r - l) * s);

                        ctx.strokeLine((r - l) * c, (r - l) * s,
                            (r - l) * c + l * 0.4 * (s * dc + c * ds),
                            (r - l) * s - l * 0.4 * (c * dc - s * ds));

                        ctx.strokeLine((r - l) * c, (r - l) * s,
                            (r - l) * c - l * 0.4 * (s * dc - c * ds),
                            (r - l) * s + l * 0.4 * (c * dc + s * ds));
                    }
                }
                ctx.globalAlpha = 1;

                ctx.fillStyle = "rgba(255,205,70,0.8)";
                ctx.strokeStyle = "#793434";


                pos = vec_scale(pos, -width * sc * 0.5);


                let dd = width * 0.005;
                ctx.arrow(pos[0], pos[1], pos[0] + vel[0], pos[1] + vel[1], dd * 1.2, 4 * dd, 5 * dd);
                ctx.fill();


                ctx.translate(0, half_width);

                let ww = width * 0.4;

                let hh = width * 0.04;


                let c = 299792458;
                let ddt = -(3 * EarthMu / (2 * dist_m * c * c) - 6.9693e-10);


                let exp = Math.floor(Math.log10(Math.abs(ddt)));

                let mant = Math.abs(ddt) * Math.pow(10, -exp);

                let ddt_string = `gain of ${ddt < 0 ? "−" : ""}${mant.toFixed(4)} × 10`;
                let w0 = ctx.measureText(ddt_string).width;
                ddt_string += `       seconds per second`;
                let w1 = ctx.measureText(ddt_string).width;

                ddt *= -0.2 * 1e9;

                let te = ((t * 0.4) % 1.1);

                ctx.fillStyle = "#aaa";

                let string = "altitude " + distance_string(EarthRadius * (dist - 1));
                ctx.fillText(string, 0, +font_size * 2.5);

                ctx.fillStyle = "#CBA339";
                ctx.fillText(ddt_string, 0, +font_size * 0.5);
                ctx.textAlign = "left";
                ctx.font = Math.round(0.7 * font_size) + "px IBM Plex Sans";

                ctx.fillText(`${exp < 0 ? "−" : ""}${Math.abs(exp)}`, -w1 * 0.5 + w0, +font_size * 0.5 - font_size * 0.6);

                ctx.translate(0, -width - hh * 3);


                ctx.globalAlpha = 0.3;
                ctx.fillStyle = "#CBA339";

                ctx.fillRect(-ww, 0, ww * 2 * (1 + ddt), hh);

                ctx.fillStyle = "#325480";

                ctx.fillRect(-ww, hh * 1.5, ww * 2, hh);

                ctx.globalAlpha = 1;
                ctx.fillStyle = "#CBA339";

                ctx.fillRect(-ww, 0, ww * 2 * Math.min(te, (1 + ddt)), hh);
                ctx.fillStyle = "#325480";

                ctx.fillRect(-ww, hh * 1.5, ww * 2 * Math.min(1, te), hh);


            } else if (mode === "ellipse") {

                let sc = half_width - 10;

                let e = lerp(1e-6, 1, arg0);
                let a = 1 * sc;
                let b = a * Math.sqrt(1 - e * e);
                let c = e * a;


                let rr = 0.012 * sc;
                let rw = 0.009 * sc;

                let l = (2 * a + 2 * c + (rw + rr) * pi * 2);

                let angle = (t * 0.5 + 2.01) % (2 * pi);

                let sign = angle > pi ? 1 : -1
                let points = [
                    [sign * c, 0],
                    [-sign * c, 0],
                    [a * Math.cos(angle), b * Math.sin(angle)]
                ];

                ctx.save();
                ctx.translate(half_width, half_height);

                ctx.lineWidth = 2;

                ctx.save();

                ctx.lineWidth = 1.5;
                ctx.strokeStyle = "#614E13";
                ctx.strokeLine(0, -a - font_size * 0.5, a, -a - font_size * 0.5);

                ctx.lineWidth = 1;

                ctx.lineCap = "round";
                ctx.setLineDash([0.2, 3]);


                ctx.strokeLine(0, 0, 0, -a - font_size);
                ctx.strokeLine(a, 0, a, -a - font_size);

                ctx.fillText("semi-major axis", a * 0.5, -a - font_size);

                ctx.restore();


                ctx.strokeStyle = "#614E13";
                ctx.beginPath();
                for (let i = 0; i < 128; i++) {
                    let angle = pi * 2 * i / 128;
                    ctx.lineTo(a * Math.cos(angle), b * Math.sin(angle))
                }
                ctx.closePath();
                ctx.stroke();


                let dir01 = vec_norm(vec_sub(points[1], points[0]));
                let dir12 = vec_norm(vec_sub(points[2], points[1]));
                let dir20 = vec_norm(vec_sub(points[0], points[2]));



                function add_main_path() {
                    ctx.beginPath();

                    ctx.lineTo(points[0][0] + dir01[1] * (rw + rr), points[0][1] - dir01[0] * (rw + rr));
                    ctx.lineTo(points[1][0] + dir01[1] * (rw + rr), points[1][1] - dir01[0] * (rw + rr));
                    ctx.arc(points[1][0], points[1][1], rw + rr,
                        Math.atan2(-dir01[0], dir01[1]), Math.atan2(-dir12[0], dir12[1]));


                    ctx.lineTo(points[1][0] + dir12[1] * (rw + rr), points[1][1] - dir12[0] * (rw + rr));
                    ctx.lineTo(points[2][0] + dir12[1] * (rw + rr), points[2][1] - dir12[0] * (rw + rr));

                    ctx.arc(points[2][0], points[2][1], rw + rr,
                        Math.atan2(-dir12[0], dir12[1]), Math.atan2(-dir20[0], dir20[1]));

                    ctx.lineTo(points[2][0] + dir20[1] * (rw + rr), points[2][1] - dir20[0] * (rw + rr));
                    ctx.lineTo(points[0][0] + dir20[1] * (rw + rr), points[0][1] - dir20[0] * (rw + rr));

                    ctx.arc(points[0][0], points[0][1], rw + rr,
                        Math.atan2(-dir20[0], dir20[1]), Math.atan2(-dir01[0], dir01[1]));




                    ctx.closePath();
                }

                ctx.lineWidth = rw * 2;
                ctx.strokeStyle = "#777";
                ctx.lineCap = "butt";

                add_main_path();

                ctx.stroke();

                ctx.lineWidth = rw * 2;

                ctx.strokeStyle = "#8E1F14";
                ctx.beginPath();
                ctx.lineTo(points[2][0] + dir20[1] * (rw + rr), points[2][1] - dir20[0] * (rw + rr));
                ctx.lineTo(points[0][0] + dir20[1] * (rw + rr), points[0][1] - dir20[0] * (rw + rr));
                ctx.stroke();

                ctx.strokeStyle = "#48860F";
                ctx.beginPath();
                ctx.lineTo(points[0][0] + dir01[1] * (rw + rr), points[0][1] - dir01[0] * (rw + rr));
                ctx.lineTo(points[1][0] + dir01[1] * (rw + rr), points[1][1] - dir01[0] * (rw + rr));
                ctx.stroke();

                ctx.strokeStyle = "#146F8E";
                ctx.beginPath();
                ctx.lineTo(points[1][0] + dir12[1] * (rw + rr), points[1][1] - dir12[0] * (rw + rr));
                ctx.lineTo(points[2][0] + dir12[1] * (rw + rr), points[2][1] - dir12[0] * (rw + rr));
                ctx.stroke();


                add_main_path();



                ctx.strokeStyle = "rgba(0,0,0,0.3)"
                ctx.setLineDash([l * 0.55 / 100, l * 0.45 / 100]);

                ctx.stroke();
                ctx.setLineDash([])

                ctx.fillStyle = "#C49D22";
                ctx.fillEllipse(points[2][0], points[2][1], rr);

                ctx.fillStyle = "#FDCC33";
                ctx.fillEllipse(points[2][0], points[2][1], rr - 1);

                ctx.fillStyle = "#666";
                ctx.fillEllipse(points[0][0], points[0][1], rr);
                ctx.fillEllipse(points[1][0], points[1][1], rr);

                ctx.fillStyle = "#888";
                ctx.fillEllipse(points[0][0], points[0][1], rr - 1);
                ctx.fillEllipse(points[1][0], points[1][1], rr - 1);

                ctx.restore();
                ctx.fillStyle = ctx.strokeStyle = "#aaa";
                ctx.lineCap = "butt";

                let str0 = "eccentricity = ";
                let str1 = " = " + e.toFixed(2);
                let w0 = ctx.measureText(str0).width;
                let w1 = ctx.measureText(str1).width;

                let w2 = Math.floor(w0 * 0.4);

                let off = Math.floor((width - w0 - w1 - w2) * 0.5);

                ctx.textAlign = "left";
                ctx.lineWidth = font_size * 0.08;
                ctx.fillText(str0, off, height - font_size);
                ctx.fillText(str1, off + w0 + w1, height - font_size);

                ctx.strokeLine(off + w0, height - font_size * 1.3, off + w0 + w1, height - font_size * 1.3);

                ctx.strokeLine(off + w0 + w1 * 0.5 - font_size * 0.25, height - font_size * 0.8,
                    off + w0 + w1 * 0.5 + font_size * 0.25, height - font_size * 0.8);

                ctx.strokeLine(off + w0 + w1 * 0.5, height - font_size * 0.8 - font_size * 0.25,
                    off + w0 + w1 * 0.5, height - font_size * 0.8 + font_size * 0.25);

                ctx.lineWidth = font_size * 0.5;
                ctx.strokeStyle = "#48860F";
                ctx.strokeLine(off + w0 + w1 * 0.35, height - font_size * 1.8,
                    off + w0 + w1 * 0.65, height - font_size * 1.8);

                ctx.strokeStyle = "#8E1F14";
                ctx.strokeLine(off + w0 + w1 * 0.05, height - font_size * 0.8,
                    off + w0 + w1 * 0.35, height - font_size * 0.8);

                ctx.strokeStyle = "#146F8E";
                ctx.strokeLine(off + w0 + w1 * 0.65, height - font_size * 0.8,
                    off + w0 + w1 * 0.95, height - font_size * 0.8);


                // string = (percent * 100).toFixed(1) + "% visible";
                // ctx.fillText(string, half_width, height - font_size);

            } else if (mode === "visible_area") {
                ctx.translate(half_width, half_height);

                ctx.scale(half_height, half_height);

                let h = arg0 * arg0 * 0.8;
                let r = 1.7;

                let ratio = width / height;

                let d = Math.sqrt(r * r - ratio * ratio) + 1.4;
                let c = r / (r + h);
                let s = Math.sqrt(1 - c * c);
                let a = Math.acos(c);


                ctx.lineWidth = 1 / half_height;


                let mat = ident_mat4.slice();
                mat[0] = -1;
                mat[5] = 3.0;
                mat[7] = -2.0;

                gl.begin(width, Math.ceil(width / 3));
                gl.draw_earth(mat4_mul(mat, rot_x_mat4(-pi * 0.85)), rot_x_mat3(-pi * 0.85));
                ctx.drawImage(gl.finish(), -r, -r + d, r * 2, r * 2 / 3);

                ctx.translate(0, d - r);



                ctx.globalCompositeOperation = "destination-over";

                ctx.save();
                ctx.translate(0, r);

                ctx.rotate(-a);
                ctx.fillStyle = "black";
                ctx.fillRect(-2, -r, 2, r);
                ctx.rotate(a * 2);
                ctx.fillRect(0, -r, 2, r);
                ctx.restore();

                let grad = ctx.createRadialGradient(0, -h, 0, 0, -h, 3);

                let n = 8;
                for (let i = 0; i < n; i++) {
                    let p = 10;
                    let tt = i / n;

                    for (let k = 0; k <= p; k++) {
                        let t = (k / p);
                        let a = (0.3 + 0.7 * t * t * t * t) * 0.5 * Math.max(0, 1 - tt * 2);
                        grad.addColorStop(tt + (0.01 + 0.99 * t) / n, `rgba(255, 255, 255, ${a})`);
                    }
                }



                ctx.fillStyle = grad;

                // ctx.fillEllipse(0, 0, size);

                ctx.fillEllipse(0, -h, 3);

                ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
                ctx.globalCompositeOperation = "source-over";
                ctx.strokeLine(0, -h, c * 3, -h + s * 3);
                ctx.strokeLine(0, -h, -c * 3, -h + s * 3);



                ctx.fillStyle = "#EA261A";
                ctx.fillEllipse(0, -h, 0.01);

                ctx.feather(canvas.width, canvas.height,
                    canvas.height * 0.2, canvas.height * 0.2,
                    canvas.height * 0.2, canvas.height * 0.2);
            } else if (mode === "signal0" || mode === "signal1" || mode === "signal2" ||
                mode === "signal3" || mode === "signal4" || mode === "signal5" ||
                mode === "signal6" || mode === "signal7" || mode === "signal8" ||
                mode === "signal9" || mode === "signal10" || mode === "signal11" ||
                mode === "signal12" || mode === "signal13" || mode === "signal14") {

                let waves_in_chip = 2;
                let codes_in_bit = 2;

                let chip_sequence = [+1, +1, -1, +1, -1, -1];
                let chips_in_code = chip_sequence.length;

                let total_gold_length = chips_in_gold_sequence * waves_in_chip;

                let waves_in_width = 40;

                let samples_per_wave = 16; //Math.ceil(width / waves_in_width);
                let time = t * waves_in_width * 0.2;


                if (mode === "signal6" || mode === "signal7") {
                    waves_in_width = total_gold_length * 2.4;
                    time = total_gold_length * 0.8;
                    chips_in_code = chips_in_gold_sequence;
                } else if (mode === "signal9") {
                    waves_in_chip = 1;
                    waves_in_width = 150;
                    time *= 4;
                } else if (mode === "signal10") {
                    time += total_gold_length * 10;
                    chips_in_code = chips_in_gold_sequence;

                    waves_in_width = 35;

                } else if (mode === "signal8" || mode === "signal11") {
                    time += total_gold_length * 10;
                    codes_in_bit = 3;
                    chips_in_code = chips_in_gold_sequence;

                    waves_in_width = total_gold_length * 3.4;
                    time *= 6;
                }


                let rounding = Math.max(1, Math.floor(width * waves_in_chip / waves_in_width));
                let offset = Math.round((arg0 * 1.1 - 0.05 - 2.0) * total_gold_length * rounding) / rounding;

                let sin_func = function(t) {
                    let lambdas = t;
                    return Math.sin(lambdas * 2 * pi);
                }

                let chip_func = function(t) {
                    let chip = Math.floor(t / waves_in_chip) % chips_in_code;
                    return chip_sequence[chip];
                }

                let bit_func = function(t) {
                    let bit = Math.floor(t / (waves_in_chip * chips_in_code * codes_in_bit)) % long_bit_sequence.length;
                    return long_bit_sequence[bit];
                }



                let flat_bit_func = function(t) {
                    return bit_func(t) > 0 ? 1 : 0;
                }

                let long_chip_func_base = function(t) {
                    let chip = Math.floor(t / waves_in_chip) % chips_in_gold_sequence;
                    return gold_sequence0[chip];
                }

                let long_chip_func0 = function(t) {
                    t += 40;
                    let chip = Math.floor(t / waves_in_chip) % chips_in_gold_sequence;
                    return gold_sequence0[chip];
                }

                let long_chip_func1 = function(t) {
                    let chip = Math.floor(t / waves_in_chip) % chips_in_gold_sequence;
                    return gold_sequence1[chip];
                }

                let long_chip_func2 = function(t) {
                    let chip = Math.floor(t / waves_in_chip) % chips_in_gold_sequence;
                    return gold_sequence2[chip];
                }

                let long_chip_func3 = function(t) {
                    let chip = Math.floor(t / waves_in_chip) % chips_in_gold_sequence;
                    return gold_sequence3[chip];
                }


                function clamped_function(f, t0, t1) {
                    return function(t) {
                        if (t <= t0 || t >= t1)
                            return 0;

                        return f(t);
                    }
                }

                function offset_function(f, off) {
                    return function(t) { return f(t + off); };
                }

                let placeholder = function(t) {};

                let integral2 = function(f, t0, t1, sign) {
                    let n = 16;
                    let sum = 0;

                    for (let s = t0; s < t1; s++) {

                        for (let i = 0; i < n; i++) {
                            let tt = s + i / n;
                            let val = sign * f(tt);
                            if (val > 0)
                                sum += val;
                        }
                    }

                    return sum / ((t1 - t0) * n);
                }


                let data_color = "#0051AA";
                let chip_color = "#CD9600";
                let chip_replica_color = "#AA8113";
                let carrier_color = "#BA0C00";
                let black_color = "#333";
                let gray_color = "#777";
                let cyan_color = "#3DABA6";
                let violet_color = "#752CC8"
                let decode_color = "#5690D2"
                let area_color = "AREA";

                let top_value = 0;
                let bottom_value = 0;

                let bit_name = "Source Data";
                let adjusted_name = "Data";
                let chip_name = "Code";
                let replica_name = "Replica";
                let sin_name = "Carrier";


                let int_t0, int_t1;

                let names, functions, colors, steps, steps_offsets = 0;

                if (mode === "signal0") {
                    names = [bit_name];
                    functions = [flat_bit_func];
                    steps = [chips_in_code * codes_in_bit * waves_in_chip];
                    colors = [data_color];
                } else if (mode === "signal1") {
                    names = ["Base Radio Wave"];
                    functions = [sin_func];
                    steps = [1];
                    colors = [carrier_color];
                } else if (mode === "signal2") {
                    names = [bit_name, sin_name, bit_name + " × " + sin_name];
                    functions = [flat_bit_func, sin_func, function(t) { return sin_func(t) * flat_bit_func(t) }];
                    steps = [chips_in_code * codes_in_bit * waves_in_chip, 1, 1];
                    colors = [data_color, carrier_color, gray_color];
                } else if (mode === "signal3") {
                    names = [bit_name, "Adjusted " + adjusted_name, sin_name, adjusted_name + " × " + sin_name];
                    functions = [flat_bit_func, bit_func, sin_func, function(t) { return sin_func(t) * bit_func(t); }];
                    steps = [chips_in_code * codes_in_bit * waves_in_chip, chips_in_code * codes_in_bit * waves_in_chip, 1, 1];
                    colors = [data_color, data_color, carrier_color, gray_color];
                } else if (mode === "signal4") {
                    names = [adjusted_name, chip_name, adjusted_name + " × " + chip_name];
                    functions = [bit_func, chip_func, function(t) { return chip_func(t) * bit_func(t); }];
                    steps = [chips_in_code * codes_in_bit * waves_in_chip,
                        chips_in_code * waves_in_chip,
                        chips_in_code *
                        waves_in_chip
                    ];
                    colors = [data_color, chip_color, cyan_color];
                } else if (mode === "signal5") {
                    names = [adjusted_name, chip_name, adjusted_name + " × " + chip_name, sin_name, adjusted_name + " × " + chip_name + " × " + sin_name];
                    functions = [bit_func, chip_func, function(t) { return chip_func(t) * bit_func(t); }, sin_func, function(t) { return sin_func(t) * chip_func(t) * bit_func(t); }];
                    steps = [chips_in_code * codes_in_bit * waves_in_chip,
                        chips_in_code * waves_in_chip,
                        chips_in_code * waves_in_chip, 1, 1
                    ];
                    colors = [data_color, chip_color, cyan_color, carrier_color, gray_color];
                } else if (mode === "signal6") {
                    let replica = offset_function(clamped_function(long_chip_func_base, 0, total_gold_length), offset);

                    names = [chip_name, chip_name + " " + replica_name, chip_name + " × " + chip_name + " " + replica_name, "Summed Areas"];
                    functions = [long_chip_func0, replica, function(t) { return long_chip_func0(t) * replica(t) }, placeholder];
                    steps = [total_gold_length, 0, 0, 0];
                    colors = [chip_color, chip_replica_color, area_color];

                    int_t0 = -offset;
                    int_t1 = int_t0 + total_gold_length;

                    top_value = integral2(function(t) { return long_chip_func0(t) * replica(t) }, int_t0, int_t1, 1);
                    bottom_value = integral2(function(t) { return long_chip_func0(t) * replica(t) }, int_t0, int_t1, -1);

                } else if (mode === "signal7") {
                    let replica = offset_function(clamped_function(long_chip_func_base, 0, total_gold_length), offset);

                    names = [chip_name + " 2", chip_name + " 1 " + replica_name, chip_name + " 2 × " + chip_name + " 1 " + replica_name, "Summed Areas"];
                    functions = [long_chip_func1, replica, function(t) { return long_chip_func1(t) * replica(t) }, placeholder];
                    steps = [total_gold_length, 0, 0, 0];
                    colors = [cyan_color, chip_replica_color, area_color];

                    int_t0 = -offset;
                    int_t1 = int_t0 + total_gold_length;

                    top_value = integral2(function(t) { return long_chip_func1(t) * replica(t) }, int_t0, int_t1, 1);
                    bottom_value = integral2(function(t) { return long_chip_func1(t) * replica(t) }, int_t0, int_t1, -1);


                } else if (mode === "signal9") {
                    names = ["PRN 1", "PRN 2", "PRN 3"];
                    functions = [
                        function(t) {
                            let chip = Math.floor(t / waves_in_chip) % 1023;
                            return prn_sequence0[chip];
                        },
                        function(t) {
                            let chip = Math.floor(t / waves_in_chip) % 1023;
                            return prn_sequence1[chip];
                        },
                        function(t) {
                            let chip = Math.floor(t / waves_in_chip) % 1023;
                            return prn_sequence2[chip];
                        }
                    ];

                    steps = [1023 * waves_in_chip, 1023 * waves_in_chip, 1023 * waves_in_chip];
                    colors = [chip_color, cyan_color, violet_color];
                } else if (mode === "signal10") {
                    names = ["Incoming Signal", sin_name + " Removed"];

                    let input = function(t) {
                        let s = 0;
                        s += long_chip_func0(t) * bit_func(t);
                        // s = 0.9 * s + 0.1 * Math.sin(t * 12424.23423);
                        return s;
                    }

                    functions = [
                        function(t) { return sin_func(t) * input(t) },
                        input,
                    ];
                    colors = [gray_color, violet_color];
                } else if (mode === "signal8" || mode === "signal11") {


                    names = [sin_name + " Removed",
                        "Code " + (arg1 + 1) + " " + replica_name,
                        sin_name + " Removed × Code " + (arg1 + 1) + " " + replica_name,
                        "Summed Areas",
                        "Difference of Summed Areas",
                        "Actual Satellite " + (arg1 + 1) + " Source Data"
                    ];
                    let replica = offset_function(long_chip_func_base, offset);
                    let input = function(t) {
                        let s = 0;
                        s += long_chip_func0(t) * bit_func(t);
                        // s = 0.5 * s + 0.5 * Math.sin(t * 12424.23423);
                        return s;
                    }

                    let real = bit_func;

                    let sat1_off = 30.;
                    let sat2_off = -10.;
                    let sat3_off = -52.;

                    let int_scale = 1;

                    if (mode === "signal8") {
                        input = function(t) {

                            let s = 0;
                            s += long_chip_func0(t) * bit_func(t);
                            s += long_chip_func1(t + sat1_off) * bit_func(t + sat1_off);
                            s += long_chip_func2(t + sat2_off) * bit_func(t + sat2_off);
                            // s += long_chip_func3(t + sat3_off) * bit_func(t + sat3_off);

                            s /= 3;
                            s = 0.6 * s + 0.4 * (random_numbers[Math.round(t * 2) % random_numbers.length] * 2 - 1);
                            return s;
                        }

                        if (arg1 == 1) {
                            replica = offset_function(long_chip_func1, offset);
                            real = offset_function(bit_func, sat1_off);
                        } else if (arg1 == 2) {
                            replica = offset_function(long_chip_func2, offset);
                            real = offset_function(bit_func, sat2_off);
                        } else if (arg1 == 3) {
                            replica = offset_function(long_chip_func3, offset);
                            real = offset_function(bit_func, sat3_off);
                        }

                        int_scale = 3;
                    }

                    int_t0 = time + waves_in_width * 0.5 - 63;
                    int_t1 = int_t0 + 126;

                    top_value = int_scale * integral2(function(t) { return input(t) * replica(t) }, int_t0, int_t1, 1);
                    bottom_value = int_scale * integral2(function(t) { return input(t) * replica(t) }, int_t0, int_t1, -1);


                    if (sim === undefined)
                        sim = [time, []];


                    let int_val = (top_value - bottom_value);

                    if (self.paused) {
                        sim[1][0] = int_val;
                    } else {

                        if (sim[1].length > 1024)
                            sim[1].pop();

                        if (time - sim[0] > 1) {
                            sim[0] = sim[0] + 1;
                            sim[1].splice(0, 0, int_val);
                        }
                    }



                    let sim_f = function(t) {
                        // return 0.5;
                        t = t - time - waves_in_width / 2;
                        t = -Math.round(t) / 1;

                        if (t < 0 || t >= sim[1].length)
                            return 0;

                        return sim[1][t];
                    }
                    functions = [
                        input,
                        replica,
                        function(t) { return input(t) * replica(t); },
                        placeholder,
                        sim_f,
                        real,
                    ];
                    colors = [violet_color, chip_replica_color, area_color, decode_color, decode_color, data_color];
                    steps = [0, chips_in_code * waves_in_chip, chips_in_code * waves_in_chip * codes_in_bit, 0, chips_in_code * waves_in_chip * codes_in_bit, chips_in_code * waves_in_chip * codes_in_bit];

                    if (mode === "signal8") {
                        steps_offsets = 0;
                        if (arg1 == 1)
                            steps_offsets = -sat1_off;
                        else if (arg1 == 2)
                            steps_offsets = -sat2_off;
                        else if (arg1 == 3)
                            steps_offsets = -sat3_off;
                    }

                } else if (mode === "signal12") {

                    let b0 = offset_function(bit_func, 73);
                    let b1 = offset_function(bit_func, 123);
                    let b2 = offset_function(bit_func, 354);

                    let input = function(t) {
                        let s = bit_func(t) + b0(t) + b1(t) + b2(t);
                        s /= 4;
                        s = 0.4 * s + 0.6 * (random_numbers[Math.round(t * 8) % random_numbers.length] * 2 - 1);
                        return s;

                    }
                    names = ["Incoming Signal", "Carrier Removed"];
                    functions = [function(t) { return sin_func(t) * input(t); }, input];
                    colors = [gray_color, violet_color];
                } else if (mode === "signal13") {

                    names = ["Incoming Signal", "Carrier Removed"];
                    functions = [function(t) { return sin_func(t) * bit_func(t); }, bit_func];
                    steps = [chips_in_code * codes_in_bit * waves_in_chip,
                        chips_in_code * codes_in_bit * waves_in_chip
                    ];
                    colors = [gray_color, violet_color];
                } else if (mode === "signal14") {

                    names = ["Code", "Chips of the Code"];
                    functions = [chip_func, chip_func];
                    steps = [chips_in_code * waves_in_chip, waves_in_chip];
                    colors = [chip_color, gray_color];
                } else {
                    names = [bit_name, chip_name, sin_name];
                    functions = [bit_func, chip_func, sin_func];
                    colors = [];
                }

                let n = functions.length;


                let h = Math.floor(height / n);
                let plot_h = h * 0.25;
                let back_h = h * 0.34;
                let plot_pad = h * 0.4;

                let t0 = Math.floor(Math.floor(time * samples_per_wave) / samples_per_wave);
                let t1 = t0 + waves_in_width;



                for (let i = 0; i < n; i++) {

                    ctx.save();
                    ctx.translate(0, h * i + back_h);

                    ctx.fillStyle = "#555";
                    ctx.font = Math.round(0.95 * font_size) + "px IBM Plex Sans";

                    if (names[i])
                        ctx.fillText(names[i], half_width, back_h + font_size * 1.1);

                    if (functions[i] == placeholder) {

                        ctx.translate(0, -plot_h);
                        let ww = width * 0.8;
                        let wp = width * 0.1;
                        let hh = plot_h / 4;

                        ctx.fillStyle = "#78C25D";
                        ctx.globalAlpha = 0.2;
                        ctx.fillRect(wp, 0, ww, hh * 2);
                        ctx.globalAlpha = 1.0;

                        ctx.fillRect(wp, 0, ww * top_value, hh * 2);

                        ctx.fillStyle = "#E37172";

                        ctx.globalAlpha = 0.2;
                        ctx.fillRect(wp, hh * 3, ww, hh * 2);
                        ctx.globalAlpha = 1.0;
                        ctx.fillRect(wp, hh * 3, ww * bottom_value, hh * 2);

                        ctx.fillStyle = decode_color;
                        ctx.globalAlpha = 0.2;
                        ctx.fillRect(wp, hh * 6, ww, hh * 2);
                        ctx.globalAlpha = 1.0;
                        ctx.fillRect(wp + ww * bottom_value, hh * 6, ww * (-bottom_value + top_value), hh * 2);
                        ctx.restore();

                        continue;
                    }

                    // ctx.translate(0, plot_pad);

                    ctx.lineWidth = 2;

                    ctx.fillStyle = "rgba(187,187,187,0.1)";
                    ctx.strokeStyle = "rgba(187,187,187,1)";
                    add_plot(functions[i]);
                    ctx.fill();
                    ctx.stroke();

                    let x0 = t_to_x(int_t0) + 1;
                    let x1 = t_to_x(int_t1) - 1;

                    ctx.globalCompositeOperation = "source-atop";

                    if (colors && colors[i] === area_color) {


                        ctx.fillStyle = "rgba(53,201,0, 0.5)";
                        ctx.fillRect(0, -plot_h - 3, width, plot_h + 3);

                        ctx.fillStyle = "rgba(198, 12, 12, 0.5)";
                        ctx.fillRect(0, 0, width, plot_h + 3);

                        ctx.fillStyle = "#777";
                        ctx.fillRect(0, -1, width, 2);

                        ctx.globalCompositeOperation = "source-atop";

                        ctx.fillStyle = "#ddd";

                        ctx.fillRect(0, -plot_h - 3, x1, 2 * (plot_h + 3));
                        ctx.fillRect(x0, -plot_h - 3, width - x0, 2 * (plot_h + 3));

                    } else if (colors && colors[i]) {
                        ctx.fillStyle = colors[i];
                        ctx.fillRect(0, -plot_h - 3, width, 2 * (plot_h + 3));

                    }

                    ctx.globalCompositeOperation = "source-over";



                    ctx.globalCompositeOperation = "destination-over";

                    ctx.lineWidth = 1;
                    ctx.strokeStyle = "#aaa";
                    ctx.strokeLine(0, 0, width, 0);


                    // if (colors && colors[i] === area_color) {
                    //     ctx.fillStyle = "#eee";
                    //     ctx.fillRect(x0, -plot_h - 3, x1 - x0, 2 * (plot_h + 3));
                    // }

                    ctx.lineWidth = 1.5;
                    ctx.strokeStyle = "rgba(0,0,0,0.16)";


                    if (steps && steps[i])
                        draw_steps(steps[i], steps_offsets);



                    ctx.restore();

                }

                ctx.feather(canvas.width, canvas.height,
                    0.1 * canvas.width, 0.1 * canvas.width, 0, 0);

                function t_to_x(t) {
                    return width - width * (t - time) / (waves_in_width);
                }

                function draw_steps(space, steps_offsets) {

                    for (let t = Math.floor(t0 / space) * space - space * 2 + steps_offsets; t <= t1 + space * 2; t += space) {

                        let tt = Math.ceil(t);
                        let x = t_to_x(tt);
                        ctx.strokeLine(x, -back_h, x, back_h);
                    }
                }



                function add_plot(f) {


                    ctx.beginPath();

                    ctx.lineTo(width, 0);

                    let prev_tt = t0;
                    let prev_val = NaN;

                    for (let t = t0; t <= t1; t += 1) {

                        for (let i = 0; i <= samples_per_wave; i++) {

                            let tt = t + i / samples_per_wave;

                            let val = f(tt);

                            if (prev_val != val) {

                                ctx.lineTo(t_to_x(prev_tt), plot_h * -prev_val);
                            }

                            let d = Math.abs(val - prev_val)
                            if (d >= 0.5) {
                                ctx.lineTo(t_to_x(tt), plot_h * -prev_val);
                            }

                            if (prev_val != val) {

                                ctx.lineTo(t_to_x(tt), plot_h * -val);
                            }

                            prev_tt = tt;
                            prev_val = val;
                        }
                    }

                    let x = t_to_x(prev_tt);
                    let y = plot_h * -prev_val;
                    ctx.lineTo(x, y);

                    ctx.lineTo(0, 0);

                }

            }

            if (!simulated)
                update_ss_point();

            /* Helpers */


            function add_quad(a, b, c, d) {
                ctx.beginPath();
                ctx.lineTo(a[0], a[1]);
                ctx.lineTo(b[0], b[1]);
                ctx.lineTo(c[0], c[1]);
                ctx.lineTo(d[0], d[1]);
                ctx.closePath();
            }

            function add_line(a, b) {
                ctx.beginPath();
                ctx.lineTo(a[0], a[1]);
                ctx.lineTo(b[0], b[1]);
            }

            function draw_timeline(width, height, t0, t1, t, real_t, bars, styles) {

                ctx.translate(-width * 0.5, -height);

                let dt = t1 - t0;

                let ss_t = width * ((t - t0) / dt);


                ctx.lineWidth = 1;
                ctx.strokeStyle = ctx.fillStyle = "#666";
                ctx.strokeLine(-3 * width / dt, 0, width + 3 * width / dt, 0);
                ctx.beginPath();
                ctx.lineTo(width + 3 * width / dt + 7, 0);
                ctx.lineTo(width + 3 * width / dt, +3);
                ctx.lineTo(width + 3 * width / dt, -3);
                ctx.fill();

                ctx.strokeStyle = "#888";

                ctx.fillStyle = "#555";
                ctx.font = Math.ceil(width * 0.035) + "px IBM Plex Sans";

                let tt = Math.ceil(t0 / 5.0) * 5.0;
                while (tt <= t1) {
                    let ss_tt = width * ((tt - t0) / dt)
                    ctx.strokeLine(ss_tt, -5, ss_tt, 0);
                    ctx.fillText(tt, ss_tt, real_t !== undefined ? -17 : -10);
                    tt += 5;
                }

                ctx.globalAlpha = 0.5;
                let bh = (height - 4) / bars.length;
                bars.forEach((b, i) => {
                    ctx.fillStyle = styles[i];
                    let x0 = width * ((b[0] - t0) / dt);
                    let x1 = width * ((b[1] - t0) / dt);
                    ctx.roundRect(x0, bh * 0.2 + bh * i, x1 - x0, bh * 0.8, Math.min((x1 - x0) * 0.5, 2));
                    ctx.fill();
                });

                ctx.globalAlpha = 1;

                if (real_t !== undefined) {
                    let ss_real_t = width * ((real_t - t0) / dt);

                    ctx.lineWidth = 1.5;

                    ctx.strokeStyle = ctx.fillStyle = "#4C6DD0";
                    ctx.strokeLine(ss_real_t, -7, ss_real_t, height);

                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.lineTo(ss_real_t, -1 - 7);
                    ctx.lineTo(ss_real_t + 3.5, -7 - 7);
                    ctx.lineTo(ss_real_t - 3.5, -7 - 7);
                    ctx.closePath();
                    ctx.fill();
                    ctx.stroke();

                    ctx.globalCompositeOperation = "destination-over";
                    ctx.strokeStyle = "#D2A743";
                    ctx.lineCap = "butt";
                    ctx.lineWidth = 4;
                    ctx.strokeLine(ss_real_t, height - 3, ss_t, height - 3);
                    ctx.globalCompositeOperation = "source-over";
                }

                ctx.lineWidth = 1.5;
                ctx.strokeStyle = ctx.fillStyle = "#ee0000";
                ctx.strokeLine(ss_t, 0, ss_t, height);

                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.lineTo(ss_t, -1);
                ctx.lineTo(ss_t + 3.5, -7);
                ctx.lineTo(ss_t - 3.5, -7);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
            }

            function draw_clock_arc(size, s0, s1, style) {
                ctx.globalAlpha = 0.5;
                ctx.strokeStyle = style;
                ctx.lineWidth = size * 0.1;
                ctx.lineCap = "butt";
                ctx.beginPath();
                ctx.arc(0, 0, size * 0.75, s0 / 60 * 2 * pi - pi * 0.5, s1 / 60 * 2 * pi - pi * 0.5);
                ctx.stroke();
                ctx.globalAlpha = 1.0;
            }

            function draw_big_clock(size, h, m, s) {

                ctx.save();
                ctx.shadowColor = "rgba(0,0,0,0.4)";
                ctx.shadowBlur = 15 * scale;
                ctx.shadowOffsetY = 10 * scale;

                ctx.fillStyle = "black";
                ctx.fillEllipse(0, 0, size - 2);

                ctx.restore();

                let grad = ctx.createRadialGradient(0, 0, 0, 0, 0, size);

                grad.addColorStop(0, "#eee");
                grad.addColorStop(0.85, "#eee");
                grad.addColorStop(0.87, "#ddd");
                grad.addColorStop(0.88, "#ccc");
                grad.addColorStop(0.89, "#bbb");
                grad.addColorStop(0.90, "#bbb");
                grad.addColorStop(0.90, "#222");
                grad.addColorStop(0.94, "#444");
                grad.addColorStop(0.96, "#444");
                grad.addColorStop(1.0, "#222");

                ctx.fillStyle = grad;

                ctx.fillEllipse(0, 0, size);

                ctx.strokeStyle = "#222";
                ctx.strokeEllipse(0, 0, size * 0.9);
                ctx.strokeEllipse(0, 0, size);

                ctx.lineWidth = size * 0.025;
                ctx.save();

                ctx.fillStyle = "#444";

                ctx.font = "500 " + Math.ceil(size * 0.19) + "px IBM Plex Sans";

                for (let i = 0; i < 12; i++) {
                    ctx.fillText((i + 1).toString(),
                        size * 0.67 * Math.cos((i - 2) * pi / 6),
                        size * 0.67 * Math.sin((i - 2) * pi / 6) + size * 0.07);
                }

                ctx.strokeStyle = "#777";

                ctx.lineWidth = 2;
                ctx.lineWidth = size * 0.015;
                for (let i = 0; i < 60; i++) {
                    ctx.strokeLine(0, size * 0.83, 0, size * 0.85);
                    ctx.rotate(pi / 30);
                }

                ctx.lineWidth = 3;
                ctx.strokeStyle = "#555";

                for (let i = 0; i < 12; i++) {
                    ctx.strokeLine(0, size * 0.8, 0, size * 0.85);
                    ctx.rotate(pi / 6);
                }

                ctx.restore();

                ctx.save();
                ctx.lineCap = "square";
                ctx.shadowColor = "rgba(0,0,0,0.2)";
                ctx.shadowBlur = size * scale * 0.05;
                ctx.shadowOffsetY = size * scale * 0.03;

                let ah = pi * 2 * (h + m / 60 + s / 3600) / 12 - pi * 0.5;
                let rh = size * 0.5;

                ctx.strokeStyle = "#333";
                ctx.lineWidth = size * 0.06 + 2;
                ctx.strokeLine(Math.cos(ah) * rh * -0.2, Math.sin(ah) * rh * -0.2,
                    Math.cos(ah) * rh, Math.sin(ah) * rh);

                ctx.strokeStyle = "#555";
                ctx.lineWidth = size * 0.06;
                ctx.strokeLine(Math.cos(ah) * rh * -0.2, Math.sin(ah) * rh * -0.2,
                    Math.cos(ah) * rh, Math.sin(ah) * rh);

                ctx.shadowBlur = size * scale * 0.035;
                ctx.shadowOffsetY = size * scale * 0.03;

                ctx.fillStyle = "#dd0000";
                ctx.fillEllipse(0, 0, size * 0.04);

                let am = pi * 2 * (m + s / 60) / 60 - pi * 0.5;
                let rm = size * 0.65;

                ctx.strokeStyle = "#333";
                ctx.lineWidth = size * 0.04 + 2;
                ctx.strokeLine(Math.cos(am) * rm * -0.2, Math.sin(am) * rm * -0.2,
                    Math.cos(am) * rm, Math.sin(am) * rm);

                ctx.strokeStyle = "#555";
                ctx.lineWidth = size * 0.04;
                ctx.strokeLine(Math.cos(am) * rm * -0.2, Math.sin(am) * rm * -0.2,
                    Math.cos(am) * rm, Math.sin(am) * rm);

                ctx.shadowBlur = size * scale * 0.04;
                ctx.shadowOffsetY = size * scale * 0.04;

                let as = pi * 2 * (s) / 60 - pi * 0.5;
                let rs = size * 0.8;

                ctx.fillStyle = "#294394";
                ctx.fillEllipse(0, 0, size * 0.05 + 1);

                ctx.strokeStyle = "#294394";
                ctx.lineWidth = size * 0.025 + 2;
                ctx.strokeLine(-Math.cos(as) * rs * 0.15, -Math.sin(as) * rs * 0.15,
                    Math.cos(as) * rs, Math.sin(as) * rs);

                ctx.strokeStyle = "#2C62C6";
                ctx.lineWidth = size * 0.025;
                ctx.strokeLine(-Math.cos(as) * rs * 0.15, -Math.sin(as) * rs * 0.15,
                    Math.cos(as) * rs, Math.sin(as) * rs);

                ctx.restore()

                ctx.fillStyle = "#2C62C6";
                ctx.fillEllipse(0, 0, size * 0.05);

                ctx.fillStyle = "#333";
                ctx.fillEllipse(0, 0, size * 0.015);
            }

            function draw_clock(size, h, m, s, crown) {

                let shadow_scale = scale * size / 109;
                ctx.save();
                ctx.shadowColor = "rgba(0,0,0,0.4)";
                ctx.shadowBlur = 15 * shadow_scale;
                ctx.shadowOffsetY = 10 * shadow_scale;

                ctx.fillStyle = "black";
                ctx.fillEllipse(0, 0, size - 2);

                ctx.fillRect(size * 1.02, -size * 0.15, size * 0.13, size * 0.3);

                ctx.fillRect(-size * 0.45 + 2, -size * 1.8, size * 0.9 - 4, size * 0.78);
                ctx.fillRect(-size * 0.45 + 2, size * (1.8 - 0.78), size * 0.9 - 4, size * 0.5);

                ctx.restore();


                ctx.fillStyle = "#777";
                ctx.fillRect(size * 0.9, -size * 0.1, size * 0.15, size * 0.2);

                let grad;

                for (let i = 0; i < 2; i++) {

                    ctx.save();
                    ctx.rotate(pi * i);

                    ctx.strokeStyle = "#777";

                    grad = ctx.createLinearGradient(0, -size * 1.22, 0, size * (-1.2 + 0.14));
                    grad.addColorStop(0.0, "#777");
                    grad.addColorStop(0.4, "#aaa");
                    grad.addColorStop(0.6, "#aaa");
                    grad.addColorStop(1.0, "#777");
                    ctx.fillStyle = grad;

                    ctx.fillRect(-size * 0.5, -size * 1.22, size, size * 0.14);
                    ctx.strokeRect(-size * 0.5, -size * 1.22, size, size * 0.14);

                    grad = ctx.createLinearGradient(0, -size * 1.22, 0, size * (-1.2 + 0.4));
                    grad.addColorStop(0.00, "#6D6D6D");
                    grad.addColorStop(0.15, "#CBCBCB");
                    grad.addColorStop(0.4, "#888888");
                    grad.addColorStop(0.7, "#797979");
                    grad.addColorStop(1.0, "#333");
                    ctx.fillStyle = grad;

                    ctx.roundRect(-size * 0.55, -size * 1.22, size * 0.08, size * 0.4, size * 0.01);
                    ctx.fill();
                    ctx.stroke();

                    ctx.roundRect(size * (0.55 - 0.08), -size * 1.22, size * 0.08, size * 0.4, size * 0.01);
                    ctx.fill();
                    ctx.stroke();

                    grad = ctx.createLinearGradient(0, -size * 1.8, 0, size * (-1.8 + 0.78));

                    grad.addColorStop(0.4, "#705141");
                    grad.addColorStop(0.6, "#725242");
                    grad.addColorStop(0.85, "#8A6C5D");
                    grad.addColorStop(0.92, "#725242");

                    grad.addColorStop(1.0, "#4B3124");

                    ctx.fillStyle = grad;
                    ctx.strokeStyle = "#382820"


                    ctx.roundRect(-size * 0.45, -size * 1.8, size * 0.9, size * 0.78, size * 0.03);
                    ctx.fill();
                    ctx.stroke();

                    grad = ctx.createLinearGradient(0, -size * 1.85, 0, size * (-1.85 + 0.3));

                    ctx.globalCompositeOperation = "destination-out";
                    for (let i = 0; i <= 8; i++)
                        grad.addColorStop(i / 8 * 0.7 + 0.3,
                            "rgba(255, 255, 255, " + (1 - smooth_step(0, 1, i / 8)) + ")");

                    ctx.fillStyle = grad;

                    ctx.fillRect(-size * 0.7 - 2, -size * 1.85, size * 1.4 + 4, size * 0.3);

                    ctx.restore();
                }


                grad = ctx.createLinearGradient(0, -size * 0.15, 0, size * 0.15);
                grad.addColorStop(0.0, "#777");
                grad.addColorStop(0.4, "#aaa");
                grad.addColorStop(0.6, "#aaa");
                grad.addColorStop(1.0, "#777");

                ctx.fillStyle = grad;
                ctx.strokeStyle = "#666";
                ctx.roundRect(size * 1.02, -size * 0.15, size * 0.13, size * 0.3, size * 0.02);
                ctx.fill();
                ctx.stroke();

                ctx.save();
                let sn = 10;
                ctx.lineWidth = size * 0.13 - 2;
                ctx.lineCap = "butt";
                ctx.strokeStyle = "#777";
                if (crown)
                    ctx.lineDashOffset = crown * size / sn;
                ctx.setLineDash([size * 0.13 / sn, size * 0.13 / sn]);
                ctx.strokeLine(size * 1.085, -size * 0.15, size * 1.085, size * 0.15);
                ctx.restore();

                grad = ctx.createRadialGradient(0, 0, 0, 0, 0, size);

                grad.addColorStop(0, "#eee");
                grad.addColorStop(0.85, "#eee");
                grad.addColorStop(0.87, "#ddd");
                grad.addColorStop(0.88, "#bbb");
                grad.addColorStop(0.89, "#999");
                grad.addColorStop(0.90, "#999");
                grad.addColorStop(0.90, "#777");
                grad.addColorStop(0.94, "#aaa");
                grad.addColorStop(0.96, "#aaa");
                grad.addColorStop(1.0, "#777");

                ctx.fillStyle = grad;

                ctx.fillEllipse(0, 0, size);

                ctx.strokeStyle = "#666";
                ctx.strokeEllipse(0, 0, size * 0.9);
                ctx.strokeEllipse(0, 0, size);

                ctx.lineWidth = size * 0.02;
                ctx.save();
                for (let i = 0; i < 12; i++) {
                    ctx.strokeLine(0, size * 0.8, 0, size * 0.85);
                    ctx.rotate(pi / 6);
                }
                ctx.restore();

                ctx.save();
                ctx.shadowColor = "rgba(0,0,0,0.2)";
                ctx.shadowBlur = size * shadow_scale * 0.025;
                ctx.shadowOffsetY = size * shadow_scale * 0.03;

                let ah = pi * 2 * (h + m / 60 + s / 3600) / 12 - pi * 0.5;
                let rh = size * 0.5;

                ctx.strokeStyle = "#111";
                ctx.lineWidth = size * 0.06 + 2;
                ctx.strokeLine(0, 0, Math.cos(ah) * rh, Math.sin(ah) * rh);

                ctx.strokeStyle = "#444";
                ctx.lineWidth = size * 0.06;
                ctx.strokeLine(0, 0, Math.cos(ah) * rh, Math.sin(ah) * rh);

                ctx.shadowBlur = size * shadow_scale * 0.035;
                ctx.shadowOffsetY = size * shadow_scale * 0.03;

                ctx.fillStyle = "#dd0000";
                ctx.fillEllipse(0, 0, size * 0.04);

                let am = pi * 2 * (m + s / 60) / 60 - pi * 0.5;
                let rm = size * 0.65;

                ctx.strokeStyle = "#111";
                ctx.lineWidth = size * 0.04 + 2;
                ctx.strokeLine(0, 0, Math.cos(am) * rm, Math.sin(am) * rm);

                ctx.strokeStyle = "#444";
                ctx.lineWidth = size * 0.04;
                ctx.strokeLine(0, 0, Math.cos(am) * rm, Math.sin(am) * rm);

                ctx.shadowBlur = size * shadow_scale * 0.04;
                ctx.shadowOffsetY = size * shadow_scale * 0.04;

                let as = pi * 2 * (s) / 60 - pi * 0.5;
                let rs = size * 0.8;

                ctx.strokeStyle = "#dd0000";
                ctx.lineWidth = size * 0.025;
                ctx.strokeLine(-Math.cos(as) * rs * 0.15, -Math.sin(as) * rs * 0.15,
                    Math.cos(as) * rs, Math.sin(as) * rs);

                ctx.restore()

                ctx.fillStyle = "#dd0000";
                ctx.fillEllipse(0, 0, size * 0.05);

                ctx.fillStyle = "#333";
                ctx.fillEllipse(0, 0, size * 0.015);

            }

            function draw_string(vp, rot, ps) {
                let len = 0;
                for (let k = 0; k < ps.length - 1; k++) {
                    len += vec_len(vec_sub(ps[k + 1], ps[k]));
                }

                ps = ps.map(p => project(mat4_mul_vec3(vp, p)));

                let ss_len = 0;

                for (let k = 0; k < ps.length - 1; k++) {
                    ss_len += vec_len(vec_sub(ps[k + 1], ps[k]));
                }

                let dash = 0.01 * ss_len / len;
                ctx.save();
                ctx.save();
                ctx.shadowColor = "rgba(0,0,0,0.4)";
                ctx.shadowBlur = 2.5 * scale;
                ctx.shadowOffsetY = 1 * scale;

                ctx.lineCap = "round";
                ctx.lineWidth = ortho_scale * size * 0.006;
                ctx.strokeStyle = "#644D2F";

                ctx.beginPath();
                ps.forEach(p => ctx.lineTo(p[0], p[1]));
                ctx.stroke();

                ctx.restore();

                ctx.lineCap = "butt";
                ctx.strokeStyle = "#A68F6F";
                ctx.lineWidth = 2;
                ctx.setLineDash([dash, dash]);
                ctx.stroke();

                ctx.restore();
            }

            function draw_tape(vp, rot, p0, p1) {
                let len = vec_len(vec_sub(p1, p0));

                p0 = project(mat4_mul_vec3(vp, p0));
                p1 = project(mat4_mul_vec3(vp, p1));

                let ss_len = vec_len(vec_sub(p1, p0));

                let dash = 0.02 * ss_len / len;
                ctx.save();
                ctx.save();
                ctx.shadowColor = "rgba(0,0,0,0.4)";
                ctx.shadowBlur = 2.5 * scale;
                ctx.shadowOffsetY = 1 * scale;

                ctx.lineCap = "round";
                ctx.lineWidth = 3;
                ctx.strokeStyle = "#333";

                add_line(p0, p1);
                ctx.stroke();

                ctx.restore();

                ctx.lineCap = "butt";
                ctx.strokeStyle = "#eee";
                ctx.lineWidth = 2;
                ctx.setLineDash([dash, dash]);
                ctx.stroke();

                ctx.restore();
            }

            function draw_circle(vp, rot, pos, r, style) {
                r += 0.0000001;
                let n = 50 + r * 100;

                ctx.beginPath();
                for (let i = 0; i < n; i++) {
                    let a = 2 * pi * i / n;
                    let p = [pos[0] + r * Math.cos(a), pos[1] + r * Math.sin(a), 0.0];
                    p = project(mat4_mul_vec3(vp, p));
                    ctx.lineTo(p[0], p[1]);
                }
                ctx.closePath();

                ctx.lineWidth = base_line_width * 2;
                ctx.strokeStyle = style;
                ctx.stroke();
            }

            function clip_base(vp, rot) {
                add_quad(project(mat4_mul_vec3(vp, [0, 0, 0])),
                    project(mat4_mul_vec3(vp, [1, 0, 0])),
                    project(mat4_mul_vec3(vp, [1, 1, 0])),
                    project(mat4_mul_vec3(vp, [0, 1, 0])));
                ctx.clip();
            }


            function draw_base(vp, rot) {
                let ps = [];
                let zs = [0, -0.03, -0.15];
                zs.forEach(z => {
                    ps.push(project(mat4_mul_vec3(vp, [0, 0, z])));
                    ps.push(project(mat4_mul_vec3(vp, [1, 0, z])));
                    ps.push(project(mat4_mul_vec3(vp, [1, 1, z])));
                    ps.push(project(mat4_mul_vec3(vp, [0, 1, z])));
                })

                let normals = [
                    [0, -1, 0],
                    [1, 0, 0],
                    [0, 1, 0],
                    [-1, 0, 0]
                ];
                let vis = normals.map(n => mat3_mul_vec(rot, n)[2] > 0);


                ctx.fillStyle = "#837A63";
                ctx.strokeStyle = "#484848";

                let tilt = Math.max(0, rot[8]);

                // ctx.save();
                // ctx.shadowColor = "rgba(0,0,0,0.5)";
                // ctx.shadowBlur = 30 * scale;
                // ctx.shadowOffsetY = 75 * (1 - tilt) * scale;
                // add_quad(ps[8], ps[9], ps[10], ps[11]);
                // ctx.fill();
                // ctx.restore();


                add_quad(ps[4], ps[5], ps[9], ps[8]);
                ctx.fill();
                add_quad(ps[5], ps[6], ps[10], ps[9]);
                ctx.fill();
                add_quad(ps[6], ps[7], ps[11], ps[10]);
                ctx.fill();
                add_quad(ps[7], ps[4], ps[8], ps[11]);
                ctx.fill();


                if (vis[0]) {
                    add_line(ps[9], ps[8]);
                    ctx.stroke();
                }
                if (vis[1]) {
                    add_line(ps[10], ps[9]);
                    ctx.stroke();
                }
                if (vis[2]) {
                    add_line(ps[11], ps[10]);
                    ctx.stroke();
                }
                if (vis[3]) {
                    add_line(ps[8], ps[11]);
                    ctx.stroke();
                }


                ctx.fillStyle = "#779055";


                add_quad(ps[0], ps[1], ps[5], ps[4]);
                ctx.fill();
                add_quad(ps[1], ps[2], ps[6], ps[5]);
                ctx.fill();
                add_quad(ps[2], ps[3], ps[7], ps[6]);
                ctx.fill();
                add_quad(ps[3], ps[0], ps[4], ps[7]);
                ctx.fill();


                if (vis[0]) {
                    add_line(ps[5], ps[4]);
                    ctx.stroke();
                }
                if (vis[1]) {
                    add_line(ps[6], ps[5]);
                    ctx.stroke();
                }
                if (vis[2]) {
                    add_line(ps[7], ps[6]);
                    ctx.stroke();
                }
                if (vis[3]) {
                    add_line(ps[4], ps[7]);
                    ctx.stroke();
                }

                if (vis[0] || vis[3]) {
                    add_line(ps[0], ps[8]);
                    ctx.stroke();
                }
                if (vis[1] || vis[0]) {
                    add_line(ps[1], ps[9]);
                    ctx.stroke();
                }
                if (vis[2] || vis[1]) {
                    add_line(ps[2], ps[10]);
                    ctx.stroke();
                }
                if (vis[3] || vis[2]) {
                    add_line(ps[3], ps[11]);
                    ctx.stroke();
                }


                ctx.fillStyle = "#94B16D";
                ctx.strokeStyle = "#495834";
                add_quad(ps[0], ps[1], ps[2], ps[3]);
                ctx.fill();
                ctx.stroke();

            }

            function draw_hill(vp, rot) {

                let hill_p = [
                    [0.6, 0, 0],
                    [0.7, 0, 0.2],
                    [0.8, 0, 0],
                    [0.6, 1, 0],
                    [0.7, 1, 0.2],
                    [0.8, 1, 0],
                    [0.59, 0, -0.02],
                    [0.81, 0, -0.02],
                    [0.59, 1, -0.02],
                    [0.81, 1, -0.02]
                ];

                let normals = [
                    [0, -1, 0],
                    [1, 0, 0],
                    [0, 1, 0],
                    [-1, 0, 0]
                ];
                let vis = normals.map(n => mat3_mul_vec(rot, n)[2] > 0);




                hill_p = hill_p.map(p => project(mat4_mul_vec3(vp, p)));

                ctx.strokeStyle = "#495834";

                ctx.fillStyle = "#94B16D";

                if (rot[6] <= 0)
                    add_quad(hill_p[1], hill_p[2], hill_p[5], hill_p[4]);
                else
                    add_quad(hill_p[0], hill_p[1], hill_p[4], hill_p[3]);

                ctx.fill();
                ctx.stroke();

                if (rot[6] > 0)
                    add_quad(hill_p[1], hill_p[2], hill_p[5], hill_p[4]);
                else
                    add_quad(hill_p[0], hill_p[1], hill_p[4], hill_p[3]);

                ctx.fill();
                ctx.stroke();

                ctx.fillStyle = "#779055";

                if (vis[0]) {
                    add_quad(hill_p[6], hill_p[1], hill_p[7], hill_p[7]);

                    ctx.fill();


                    ctx.fill();
                    ctx.beginPath();
                    ctx.lineTo(hill_p[0][0], hill_p[0][1]);
                    ctx.lineTo(hill_p[1][0], hill_p[1][1]);
                    ctx.lineTo(hill_p[2][0], hill_p[2][1]);
                    ctx.stroke();
                }

                if (vis[2]) {
                    add_quad(hill_p[8], hill_p[4], hill_p[9], hill_p[9]);

                    ctx.fill();
                    ctx.beginPath();
                    ctx.lineTo(hill_p[3][0], hill_p[3][1]);
                    ctx.lineTo(hill_p[4][0], hill_p[4][1]);
                    ctx.lineTo(hill_p[5][0], hill_p[5][1]);
                    ctx.stroke();
                }

            }

            function draw_drone_shadow(vp, rot, pos) {

                let drone_r = 0.014;
                let ss_drone_r = drone_r * ortho_scale * size * 0.5;

                let p1 = project(mat4_mul_vec3(vp, [pos[0], pos[1], 0]));
                let tilt = Math.max(0, rot[8]);

                ctx.save();
                ctx.fillStyle = "#000";
                ctx.shadowColor = "rgba(0,0,0,0.25)";
                ctx.shadowBlur = 3 * scale;
                ctx.shadowOffsetY = -oob * scale;
                ctx.beginPath();
                ctx.ellipse(p1[0], p1[1] + oob, ss_drone_r, ss_drone_r * tilt, 0, 0, 2 * pi);
                ctx.fill();
                ctx.restore();
            }


            function draw_drone_head_shadow(vp, rot, point, pos, alpha) {

                let drone_r = 0.014;
                let ss_drone_r = drone_r * ortho_scale * size * 0.5;

                let p1 = project(mat4_mul_vec3(vp, [pos[0], pos[1], fig_h + fig_w * 1.5]));
                let tilt = Math.max(0, rot[8]);

                let p2 = project(mat4_mul_vec3(vp, [point[0], point[1], fig_h + fig_w * 0.75]));

                let ss_head_r = fig_w * ortho_scale * size * 0.5;

                ctx.save();

                ctx.ellipse(p2[0], p2[1], ss_head_r, ss_head_r, 0, 0, 2 * pi);
                ctx.clip();

                ctx.fillStyle = "#000";
                ctx.shadowColor = `rgba(0,0,0,${0.2 * alpha})`;
                ctx.shadowBlur = 2 * scale;
                ctx.shadowOffsetY = -oob * scale;
                ctx.beginPath();
                ctx.ellipse(p1[0], p1[1] + oob, ss_drone_r, ss_drone_r * tilt, 0, 0, 2 * pi);
                ctx.fill();
                ctx.restore();
            }

            function draw_drone(vp, rot, pos, t, style) {

                let prop_r = 0.028;

                let drone_r = 0.014;
                let ss_drone_r = drone_r * ortho_scale * size * 0.5;

                let p0 = project(mat4_mul_vec3(vp, pos));
                let p2 = project(mat4_mul_vec3(vp, [pos[0], pos[1], pos[2] + drone_r * 1.5]));


                ctx.lineWidth = 1;


                ctx.strokeStyle = "#444";
                ctx.fillStyle = style;
                ctx.fillEllipse(p0[0], p0[1], ss_drone_r);
                ctx.stroke();

                ctx.lineWidth = 1;
                ctx.fillStyle = "rgba(120, 120, 120, 0.4)";
                ctx.strokeStyle = "rgba(20, 20, 20, 0.6)";
                let n = 4;
                ctx.beginPath();



                for (let k = 0; k < 4; k++) {
                    ctx.lineTo(p2[0], p2[1]);
                    for (let i = 0; i <= n; i++) {
                        let a = 0.25 * pi * i / n;
                        let p = [pos[0] + prop_r * Math.cos(a + k * 0.5 * pi - t * 4.0),
                            pos[1] + prop_r * Math.sin(a + k * 0.5 * pi - t * 4.0),
                            pos[2] + drone_r * 1.5
                        ];
                        p = project(mat4_mul_vec3(vp, p));
                        ctx.lineTo(p[0], p[1]);
                    }
                }
                ctx.closePath();

                ctx.fill();
                ctx.stroke();
            }

            function draw_figurine(vp, rot, pos, light, red) {
                ctx.save();
                let tilt = Math.max(0, rot[8]);

                let pp = project(mat4_mul_vec3(vp, [pos[0], pos[1], pos[2] + 0]));
                let p0 = project(mat4_mul_vec3(vp, [pos[0], pos[1], pos[2] + fig_w]))
                let p1 = project(mat4_mul_vec3(vp, [pos[0], pos[1], pos[2] + fig_h - fig_w]));
                let p2 = project(mat4_mul_vec3(vp, [pos[0], pos[1], pos[2] + fig_h]))
                let p3 = project(mat4_mul_vec3(vp, [pos[0], pos[1], pos[2] + fig_h + fig_w * 0.75]))

                let r = Math.max(0, fig_w * ortho_scale * size);

                ctx.lineCap = "round";

                ctx.save();
                ctx.fillStyle = "#000";
                ctx.shadowColor = "rgba(0,0,0,0.25)";
                ctx.shadowBlur = 2 * scale;
                ctx.shadowOffsetY = -oob * scale;
                ctx.beginPath();
                ctx.ellipse(pp[0], pp[1] + oob, r * 0.45, r * 0.45 * tilt, 0, 0, 2 * pi);
                ctx.fill();
                ctx.restore();


                add_line(p0, p1);

                ctx.strokeStyle = red ? "#982A12" : "#856E00";
                ctx.lineWidth = r;

                ctx.stroke();

                ctx.strokeStyle = red ? "#EC5B5B" : "#FFD300";
                ctx.lineWidth = r - base_line_width * 2;

                ctx.stroke();

                if (light) {
                    ctx.save();

                    ctx.shadowColor = red ? "#EC5B5B" : "#FFD300";;
                    ctx.shadowBlur = size * 0.02 * scale;

                    ctx.strokeStyle = "rgba(255, 255, 255, " + (red ? 0.4 : 0.8) + ")";
                    ctx.globalCompositeOperation = "lighter";

                    ctx.stroke();

                    ctx.restore();
                }

                ctx.save();
                ctx.fillStyle = "#000";
                ctx.shadowColor = "rgba(0,0,0,0.5)";
                ctx.shadowBlur = 2.5 * scale;
                ctx.shadowOffsetY = -oob * scale;
                ctx.beginPath();
                ctx.ellipse(p2[0], p2[1] + oob, r * 0.3, r * 0.3 * tilt, 0, 0, 2 * pi);
                ctx.fill();
                ctx.restore();

                add_line(p3, vec_add(p3, [0, 0.01]));

                ctx.strokeStyle = red ? "#982A12" : "#856E00";
                ctx.lineWidth = r;

                ctx.stroke();

                ctx.strokeStyle = red ? "#EC5B5B" : "#FFD300";
                ctx.lineWidth = r - base_line_width * 2;

                ctx.stroke();

                if (light) {
                    ctx.save();

                    ctx.shadowColor = red ? "#EC5B5B" : "#FFD300";;
                    ctx.shadowBlur = size * scale * 0.02;

                    ctx.strokeStyle = "rgba(255, 255, 255, " + (red ? 0.4 : 0.8) + ")";
                    ctx.globalCompositeOperation = "lighter";

                    ctx.stroke();

                    ctx.restore();
                }

                ctx.restore();
            }

            function draw_ladder(vp, rot, pos) {
                let tilt = Math.max(0, rot[8]);

                let p0 = project(mat4_mul_vec3(vp, [pos[0], pos[1], 0]));
                let p1 = project(mat4_mul_vec3(vp, pos));

                let r = 0.015;
                let ss_r = r * ortho_scale * size * 0.5;

                ctx.fillStyle = "#999";
                ctx.strokeStyle = "#555";

                ctx.beginPath();
                ctx.ellipse(p0[0], p0[1], ss_r * 0.5, ss_r * tilt * 0.5, 0, 0, 2 * pi);
                ctx.fill();
                ctx.stroke();

                ctx.lineWidth = ss_r + base_line_width;
                ctx.lineCap = "butt";
                ctx.strokeLine(p0[0], p0[1], p1[0], p1[1]);

                ctx.strokeStyle = "#999";
                ctx.lineWidth = ss_r - base_line_width;
                ctx.strokeLine(p0[0], p0[1], p1[0], p1[1]);

                ctx.strokeStyle = "#555";
                ctx.lineWidth = base_line_width;
            }

            function draw_marker(vp, rot, pos, style) {

                let tilt = Math.max(0, rot[8]);

                let r = 0.015;
                let ss_r = r * ortho_scale * size * 0.5;

                let p = project(mat4_mul_vec3(vp, pos));

                ctx.beginPath();
                ctx.ellipse(p[0], p[1], ss_r, ss_r * tilt, 0, 0, 2 * pi);

                ctx.fillStyle = style;
                ctx.strokeStyle = "#555";
                ctx.fill();
                ctx.stroke();
            }

            function draw_marker_light(vp, rot, pos, style) {

                let tilt = Math.max(0, rot[8]);

                let r = 0.012;
                let ss_r = r * ortho_scale * size * 0.5;

                let p = project(mat4_mul_vec3(vp, pos));

                ctx.save();
                ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
                ctx.globalCompositeOperation = "lighter";

                ctx.beginPath();
                ctx.ellipse(p[0], p[1], ss_r, ss_r * tilt, 0, 0, 2 * pi);
                ctx.fill();

                ctx.fillStyle = "#fff";
                ctx.shadowColor = style;
                ctx.shadowBlur = size * scale * 0.025;
                ctx.shadowOffsetY = -oob * scale;

                ctx.beginPath();
                ctx.ellipse(p[0], p[1] + oob, ss_r * 2 + 2, ss_r * 2 * tilt + 2, 0, 0, 2 * pi);
                ctx.fill();

                ctx.restore();
            }



            function draw_map_base(map_size) {
                ctx.save();
                ctx.fillStyle = "#D1DFBF";
                ctx.shadowColor = "rgba(0,0,0,0.4)";
                ctx.shadowBlur = 7.5 * scale;
                ctx.shadowOffsetY = 5 * scale;
                ctx.fillRect(0, 0, map_size, map_size);
                ctx.restore();
            }

            function draw_proj_map_base(vp, rot) {

                let ps = [];

                let pad = 0.01;

                ps.push(project(mat4_mul_vec3(vp, [0, 0, 0])));
                ps.push(project(mat4_mul_vec3(vp, [1, 0, 0])));
                ps.push(project(mat4_mul_vec3(vp, [1, 1, 0])));
                ps.push(project(mat4_mul_vec3(vp, [0, 1, 0])));

                ps.push(project(mat4_mul_vec3(vp, [0 - pad, 0 - pad, 0])));
                ps.push(project(mat4_mul_vec3(vp, [1 + pad, 0 - pad, 0])));
                ps.push(project(mat4_mul_vec3(vp, [1 + pad, 1 + pad, 0])));
                ps.push(project(mat4_mul_vec3(vp, [0 - pad, 1 + pad, 0])));

                ps.push(project(mat4_mul_vec3(vp, [1 / 3, 0 - pad, 0])));
                ps.push(project(mat4_mul_vec3(vp, [1 / 3, 1 + pad, 0])));
                ps.push(project(mat4_mul_vec3(vp, [2 / 3, 0 - pad, 0])));
                ps.push(project(mat4_mul_vec3(vp, [2 / 3, 1 + pad, 0])));

                // let tilt = Math.max(0, rot[8]);

                // ctx.save();
                // ctx.shadowColor = "rgba(0,0,0,0.4)";
                // ctx.shadowBlur = 35 * scale;
                // ctx.shadowOffsetY = 75 * (1 - tilt) * scale;
                // add_quad(ps[4], ps[5], ps[6], ps[7]);
                // ctx.fill();
                // ctx.restore();



                ctx.fillStyle = "#fff";
                ctx.strokeStyle = "#bbb";
                ctx.lineWidth = base_line_width;

                add_quad(ps[4], ps[5], ps[6], ps[7]);
                ctx.fill();
                ctx.stroke()

                ctx.fillStyle = "#D1DFBF";

                add_quad(ps[0], ps[1], ps[2], ps[3]);
                ctx.fill();

                {


                    ctx.strokeStyle = "#aaa";
                    ctx.lineWidth = 1;
                    let tw = 0.05;
                    let ps = [

                        project(mat4_mul_vec3(vp, [tw, tw, 0])),
                        project(mat4_mul_vec3(vp, [tw * 5, tw, 0])),
                        project(mat4_mul_vec3(vp, [tw, tw * 1.25, 0])),
                        project(mat4_mul_vec3(vp, [tw, tw * 0.75, 0])),
                        project(mat4_mul_vec3(vp, [tw * 5, tw * 1.25, 0])),
                        project(mat4_mul_vec3(vp, [tw * 5, tw * 0.75, 0])),
                    ]

                    ctx.strokeLine(ps[0][0], ps[0][1], ps[1][0], ps[1][1]);
                    ctx.strokeLine(ps[2][0], ps[2][1], ps[3][0], ps[3][1]);
                    ctx.strokeLine(ps[4][0], ps[4][1], ps[5][0], ps[5][1]);
                }


                ctx.lineWidth = 1;
                ctx.lineCap = "butt";
                ctx.strokeStyle = "rgba(0,0,0,0.07)";

                ctx.strokeLine(ps[8][0], ps[8][1], ps[9][0], ps[9][1]);
                ctx.strokeLine(ps[10][0], ps[10][1], ps[11][0], ps[11][1]);
            }

            function clip_map_base(map_size) {
                ctx.rect(0, 0, map_size, map_size);
                ctx.clip();
            }

            function draw_map_circle(map_size, pos, r, style) {

                ctx.lineWidth = base_line_width * 2;
                ctx.strokeStyle = style;
                ctx.strokeEllipse(pos[0] * map_size, map_size - pos[1] * map_size, r * map_size);
            }

            function draw_map_estimation(map_size, pos, r) {
                let x = pos[0] * map_size;
                let y = map_size - pos[1] * map_size;
                r *= map_size;

                ctx.lineWidth = 2 * base_line_width / 1.5;
                ctx.fillStyle = "rgba(255,211,0,0.8)";
                ctx.fillEllipse(x, y, r);


                ctx.strokeStyle = "rgba(139,115,1,0.9)";
                ctx.strokeEllipse(x, y, r);
            }

            function draw_map_ring_estimation(map_size, pos, R, r) {
                let x = pos[0] * map_size;
                let y = map_size - pos[1] * map_size;
                R *= map_size;
                r *= map_size;

                ctx.lineWidth = r * 2;
                ctx.strokeStyle = "rgba(255,211,0,0.8)";
                ctx.strokeEllipse(x, y, R);

                ctx.lineWidth = 2 * base_line_width / 1.5;
                ctx.strokeStyle = "rgba(139,115,1,0.9)";
                ctx.strokeEllipse(x, y, R + r);
                if (R > r)
                    ctx.strokeEllipse(x, y, R - r);
            }

            function draw_map_decoration(map_size) {

                ctx.lineWidth = 1;
                ctx.strokeStyle = "#555";
                let tw = Math.floor(map_size * 0.05);

                ctx.strokeLine(tw, map_size - tw, tw * 5, map_size - tw);
                ctx.strokeLine(tw, map_size - tw * 1.25, tw, map_size - tw * 0.75);
                ctx.strokeLine(tw * 5, map_size - tw * 1.25, tw * 5, map_size - tw * 0.75);

                ctx.strokeStyle = "#bbb";
                ctx.lineWidth = 2;
                ctx.strokeRect(-2, -2, map_size + 4, map_size + 4);

                ctx.fillStyle = "rgba(255,255,255,0.2)";
                ctx.strokeStyle = "white";

                ctx.lineWidth = 2;
                ctx.strokeRect(-1, -1, map_size + 2, map_size + 2);
                ctx.fillRect(-1, -1, map_size + 2, map_size + 2);

                ctx.lineWidth = 1;
                ctx.lineCap = "butt";
                ctx.strokeStyle = "rgba(0,0,0,0.07)";
                ctx.strokeLine(Math.floor(map_size / 3), -2, Math.floor(map_size / 3), map_size + 2);
                ctx.strokeLine(Math.floor(2 * map_size / 3), -2, Math.floor(2 * map_size / 3), map_size + 2);
            }

            function draw_map_marker(map_size, pos, style) {
                ctx.fillStyle = style;
                ctx.strokeStyle = "#444";
                ctx.fillEllipse(pos[0] * map_size, map_size - pos[1] * map_size, map_size * 0.015);
                ctx.strokeEllipse(pos[0] * map_size, map_size - pos[1] * map_size, map_size * 0.015);

            }

        }

        if (animated)
            this.set_paused(false);

        if (load_text)
            document.fonts.load("10px IBM Plex Sans").then(function() { request_repaint() });

        window.addEventListener("resize", this.on_resize, true);
        window.addEventListener("load", this.on_resize, true);

        this.on_resize();
    }

    document.addEventListener("DOMContentLoaded", function(event) {

        if (!localStorage.getItem("global.metric")) {      
            let language = window.navigator.userLanguage || window.navigator.language;
            if (language == "en_US" || language == "en-US") {
                metric = false;
        }
        } else {
            metric = localStorage.getItem("global.metric") === "true";
        }
        
        if (!metric)
            document.body.classList.add("show_imperial");

        function make_drawer(name, slider_count, args) {
            let ret = [];

            let drawer = new Drawer(document.getElementById(name), name);
            ret.push(drawer);

            if (slider_count === undefined)
                slider_count = 0;

            for (let i = 0; i < slider_count; i++) {
                let slider = new Slider(document.getElementById(name + "_sl" + i), function(x) {
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

        make_drawer("visible_cone", 1);
        orbital_period = make_drawer("orbital_period", 1);
        orbital_inclination = make_drawer("orbital_inclination", 2, [0, 0.4]);
        geostat_coverage = make_drawer("geostat_coverage", 1, [0]);
        make_drawer("geostat_distance");
        make_drawer("map0");
        make_drawer("map1");
        make_drawer("map2");
        make_drawer("map3");
        make_drawer("map4");
        make_drawer("map5");
        make_drawer("string");
        hill = make_drawer("hill", 2, [0, 0]);
        make_drawer("clocks", 2, [0, 0.2]);
        map_drone0 = make_drawer("map_drone0", 1, [0]);
        make_drawer("map_drone1", 1, [0]);
        make_drawer("map_sound0", 1, [0]);
        make_drawer("map_sound1", 1, [0]);
        make_drawer("map_sound2", 1, [0]);
        make_drawer("map_sound3", 1, [0]);
        map_sound4 = make_drawer("map_sound4", 2, [0, 0.2]);
        make_drawer("map_sound5", 2, [0, 0.3]);
        map_sound6 = make_drawer("map_sound6", 2, [0, 0.3]);
        make_drawer("map_sound7", 2, [0, 0.3]);
        map_ladder0 = make_drawer("map_ladder0", 1, [0]);
        make_drawer("map_ladder1", 1);
        make_drawer("map_ladder2", 3, [0.5, 0, 0]);
        make_drawer("map_ladder3", 3, [0.5, 0, 0]);
        make_drawer("spheres0", 1);
        make_drawer("spheres1", 2);
        make_drawer("spheres2", 3);
        make_drawer("satellite_sim0");
        satellite_sim1 = make_drawer("satellite_sim1");
        ellipse = make_drawer("ellipse", 1);

        make_drawer("keplerian0", 2);
        make_drawer("keplerian1", 2, [0.611, 0.2]);
        make_drawer("keplerian2", 2, [0.34, 0.11]);

        time_dilation = make_drawer("time_dilation", 1);
        make_drawer("atmosphere", 1);
        overlap = make_drawer("overlap", 2);

        make_drawer("visible_area", 1, [0]);


        make_drawer("signal0");
        make_drawer("signal1");
        make_drawer("signal2");
        make_drawer("signal3");
        make_drawer("signal4");
        make_drawer("signal5");
        signal6 = make_drawer("signal6", 1);
        make_drawer("signal7", 1);
        signal8 = make_drawer("signal8", 1);
        make_drawer("signal9");
        make_drawer("signal10");
        signal11 = make_drawer("signal11", 1);
        make_drawer("signal12");
        make_drawer("signal13");
        make_drawer("signal14");

        signal8_seg = new SegmentedControl(document.getElementById("signal8_seg0"), function(x) {
            signal8[0].set_arg1(x);
        }, ["Code 1", "Code 2", "Code 3", "Code 4"]);

        make_drawer("gps_orbits_hero");
        make_drawer("gps_orbits0");
        let gps_orbits1 = make_drawer("gps_orbits1");
        make_drawer("gps_orbits2");
        make_drawer("gps_orbits3");
        make_drawer("gps_orbits4");

        new SegmentedControl(document.getElementById("gps_orbits1_seg0"), function(x) {
            gps_orbits1[0].set_arg0(x);
        }, ["All", "1", "2", "3", "4", "5", "6"]);

        if ("IntersectionObserver" in window) {
            const observer = new IntersectionObserver(entries => {
                entries.forEach(entry => {entry.target.drawer.set_visible(entry.isIntersecting);})
            }, {rootMargin: "100px"})

            all_containers.forEach(container => observer.observe(container));
        } else {
            all_containers.forEach(container => container.drawer.set_visible(true));
        }
    });
})();

function map_drone0_f0() {
    map_drone0[0].set_point([Math.random() * 0.9 + 0.05, Math.random() * 0.9 + 0.05, 0]);
    map_drone0[0].set_arg0(1);
    map_drone0[1].set_value(1);
}

function map_sound4_f0() {
    map_sound4[0].set_arg1(0.5);
    map_sound4[2].set_value(0.5);
}

function map_sound4_f1() {
    map_sound4[0].set_arg1(0.0);
    map_sound4[2].set_value(0.0);
}

function map_sound4_f2() {
    map_sound4[0].set_arg0(0.1);
    map_sound4[0].set_arg1(0.0);
    map_sound4[1].set_value(0.1);
    map_sound4[2].set_value(0.0);
}

function map_sound4_f3() {
    map_sound4[0].set_arg1(1.0);
    map_sound4[2].set_value(1.0);
}

function map_sound4_f4() {
    map_sound4[0].set_arg0(0.0);
    map_sound4[0].set_arg1(1.0);
    map_sound4[1].set_value(0.0);
    map_sound4[2].set_value(1.0);
}

function map_sound6_f0() {
    map_sound6[0].set_arg0(1.0);
    map_sound6[1].set_value(1.0);
}

function map_sound6_f1() {
    map_sound6[0].set_arg1(0.5);
    map_sound6[2].set_value(0.5);
}

function map_ladder0_f0() {
    map_ladder0[0].set_arg0(0.7);
    map_ladder0[1].set_value(0.7);
}

function hill_f0() {
    hill[0].set_arg1(1);
    hill[2].set_value(1);
}

function satellite_sim1_f0() {
    satellite_sim1[0].set_sim([
        [4, 1.6],
        [-2, 0]
    ]);
}

function satellite_sim1_f1() {
    satellite_sim1[0].set_sim([
        [-1, 2.3],
        [-2, 0]
    ]);
}

function satellite_sim1_f2() {
    satellite_sim1[0].set_sim([
        [4, 3.7],
        [-2, 0]
    ]);
}

function ellipse_f0() {
    ellipse[0].set_arg0(0);
    ellipse[1].set_value(0);
}

function geostat_coverage_f0() {
    geostat_coverage[0].set_arg0(1);
    geostat_coverage[1].set_value(1);
}

function overlap_f0() {
    overlap[0].set_arg0(0.95);
    overlap[1].set_value(0.95);
}

function overlap_f1() {
    overlap[0].set_arg1(0.05);
    overlap[2].set_value(0.05);
}

function orbital_period_f0() {
    let v = 0.0888;
    orbital_period[0].set_arg0(v);
    orbital_period[1].set_value(v);
}

function orbital_period_f1() {
    let v = 0.96693;
    orbital_period[0].set_arg0(v);
    orbital_period[1].set_value(v);
}


function orbital_inclination_f0() {
    orbital_inclination[0].set_arg1(0);
    orbital_inclination[2].set_value(0);
}

function time_dilation_f0() {
    let v = 0.40246;
    time_dilation[0].set_arg0(v);
    time_dilation[1].set_value(v);
}

function signal6_f0() {
    let v = Math.random() * 0.6 + 0.2;
    if (Math.abs(v - 0.333) < 0.05)
        v = 0.7;

    signal6[0].set_arg0(v);
    signal6[1].set_value(v);
}

function signal6_f1() {
    signal6[0].set_arg0(0.334);
    signal6[1].set_value(0.334);
}

function signal11_f0() {
    signal11[0].set_arg0(0.334);
    signal11[1].set_value(0.334);
}


function signal8_f0() {
    signal8[0].set_arg0(0.334);
    signal8[1].set_value(0.334);
    signal8_seg.set_selection(0);
}


function signal8_f1() {
    signal8[0].set_arg0(0.262);
    signal8[1].set_value(0.262);
    signal8_seg.set_selection(1);
}


function signal8_f2() {
    signal8[0].set_arg0(0.883);
    signal8[1].set_value(0.883);
    signal8_seg.set_selection(2);
}




function global_animate(animate) {

    for (var i = 0; i < animated_drawers.length; i++) {
        animated_drawers[i].set_paused(!animate);
    }

    if (animate) {
        document.getElementById("global_animate_on").classList.remove("hidden");
        document.getElementById("global_animate_off").classList.add("hidden");
    } else {
        document.getElementById("global_animate_on").classList.add("hidden");
        document.getElementById("global_animate_off").classList.remove("hidden");
    }
}

function switch_units() {
    metric = !metric;
    
    localStorage.setItem("global.metric", metric ? "true" : "false");

    if (metric)
        document.body.classList.remove("show_imperial");
    else
        document.body.classList.add("show_imperial");

    units_drawers.forEach(drawer => drawer.request_repaint());
}