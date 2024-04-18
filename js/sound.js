/// <reference path="./base.js" />
"use strict";

let metric = true;

let animated_drawers = [];
let model_drawers = [];
let units_drawers = [];
let all_keyboards = [];

let active_keyboard;

let particles4;
let waveform_sound1;
let waveform_addition4;
let string2;
let string3;
let string5;
let string5_seg;
let frequency_shape;
let doppler2;
let reflection1;

let red_style = "#8DD1C8";
let green_style = "#6188A9";
let blue_style = "#301F71";

let f_style = "#89BAD2";
let a_style = "#EBAA09";
let ph_style = "#0C506B";

let base_plot_style = "#E63946";

let signal_samples = 128;

let n_correlations = 64;

let microphone_source;

let firefox = navigator.userAgent.toLowerCase().indexOf('firefox') > -1;

(function() {

    const pi = Math.PI;

    const sqrt = Math.sqrt;
    const sin = Math.sin;
    const cos = Math.cos;
    const max = Math.max;
    const min = Math.min;
    const abs = Math.abs;
    const round = Math.round;
    const floor = Math.floor;
    const ceil = Math.ceil;



    let cosine_correlations = [];
    let sine_correlations = [];


    for (let i = 0; i < n_correlations; i++) {

        cosine_correlations[i] = new Float32Array(signal_samples);
        sine_correlations[i] = new Float32Array(signal_samples);

        let s = i * 2 * pi;

        for (let k = 0; k < signal_samples; k++) {
            let t = k / signal_samples;

            cosine_correlations[i][k] = cos(t * s);
            sine_correlations[i][k] = sin(t * s);
        }
    }

    const float_size = 4;

    const speed_of_sound = 340;

    const touch_size = matchMedia("(pointer:coarse)").matches;

    const history_texture_size = 1024;
    const particles_count = 3360;
    const quad_count = 3360 * 2;

    const particle_r = 0.0072;

    const bin_capacity = 4;
    const bin_n = 20;
    const inv_bin_dim = (bin_n - 1) / 2.0;

    const positive_color = [0.157, 0.522, 0.784, 1.0];
    const negative_color = [0.882, 0.173, 0.067, 1.0];

    let bin_n_3 = bin_n * bin_n * bin_n;
    let bin_counts = new Uint8Array(bin_n_3);
    let bin_indices = new Uint16Array(bin_n_3 * bin_capacity);

    const scale = (window.devicePixelRatio || 1) > 1.75 ? 2 : 1;

    let all_drawers = [];
    let all_containers = [];


    function distance_to_gain(d) {
        let t = 0.8;
        d += t;
        return t * t / (d * d);
    }


    function sample_custom(signal, t) {
        t *= signal_samples;
        let i0 = Math.floor(t);
        t = t - i0;
        let i1 = (i0 + 1) % signal_samples;

        return lerp(signal[i0], signal[i1], t);
    }


    function GLDrawer(scale) {

        let canvas = document.createElement("canvas");
        this.canvas = canvas;
        let gl = canvas.getContext('experimental-webgl', { antialias: true });

        gl.getExtension('OES_element_index_uint');

        const float_size = 4;

        let full_screen_vertices = [
            -1.0, -1.0,
            3.0, -1.0,
            -1.0, 3.0,
        ];

        let full_screen_vertex_buffer = gl.createBuffer();

        gl.bindBuffer(gl.ARRAY_BUFFER, full_screen_vertex_buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(full_screen_vertices), gl.STATIC_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);

        let point_vertex_buffer = gl.createBuffer();

        gl.bindBuffer(gl.ARRAY_BUFFER, point_vertex_buffer);
        gl.bufferData(gl.ARRAY_BUFFER, particles_count * 4 * float_size, gl.DYNAMIC_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);

        let quad_vertex_buffer = gl.createBuffer();

        gl.bindBuffer(gl.ARRAY_BUFFER, quad_vertex_buffer);
        gl.bufferData(gl.ARRAY_BUFFER, quad_count * 4 * 6 * float_size, gl.DYNAMIC_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);

        let quad_indices = new Uint16Array(quad_count * 6);
        for (let i = 0; i < quad_count; i++) {
            quad_indices[i * 6 + 0] = i * 4 + 3;
            quad_indices[i * 6 + 1] = i * 4 + 2;
            quad_indices[i * 6 + 2] = i * 4 + 1;
            quad_indices[i * 6 + 3] = i * 4 + 0;
            quad_indices[i * 6 + 4] = i * 4 + 2;
            quad_indices[i * 6 + 5] = i * 4 + 1;
        }

        var quad_index_buffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, quad_index_buffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, quad_indices, gl.STATIC_DRAW);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);



        let history_texture = gl.createTexture();

        gl.bindTexture(gl.TEXTURE_2D, history_texture);

        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

        gl.texImage2D(gl.TEXTURE_2D, 0, gl.ALPHA, history_texture_size, 1, 0, gl.ALPHA, gl.UNSIGNED_BYTE, undefined);


        let full_screen_vert_src =
            `
        attribute vec2 v_position;
        
        uniform vec4 u_map;        
        
        varying vec2 xy;
        
        void main(void) {
            xy = u_map.xy * v_position + u_map.zw;
            gl_Position = vec4(v_position, 0.0, 1.0);
        }
        `;

        let frag_preamble_src =
            `
            precision mediump float;
        
            varying vec2 xy;
            
            uniform sampler2D u_history;
            
            float history_amplitude(float d) {
                float a = texture2D(u_history, vec2(d, 0.5)).a * 255.0/127.0 - 1.0;
                return a;
            }
        
            vec4 intensity_to_color(float a) {
           
                return a > 0.0 ? vec4(0.157, 0.522, 0.784, 1.0) * a
                               : vec4(0.882, 0.173, 0.067, 1.0) * -a;
            }            
        `

        let two_sources_frag_src =
            `
        uniform vec2 u_pos0;
        uniform vec2 u_pos1;

        uniform vec2 u_param;
        
        void main(void) {
            
            float d0 = length(xy - u_pos0.xy);   
            float a0 = history_amplitude(d0 * u_param.x + u_param.y);
            
            float d1 = length(xy - u_pos1.xy);            
            float a1 = history_amplitude(d1 * u_param.x + u_param.y) ;
                
            float a = a0 + a1;
            
            gl_FragColor = intensity_to_color(a * 0.5);
        }
        `;

        let radial_frag_src =
            `
        uniform vec2 u_pos;
        uniform vec2 u_param;
        
        void main(void) {
            
            float d = length(xy - u_pos.xy);   
            float a = history_amplitude(d * u_param.x + u_param.y);

            gl_FragColor = intensity_to_color(a);
        }
        `;

        let shape_frag_src =
            `
        uniform vec2 u_pos;
        uniform vec2 u_param;
        
        
        void main(void) {
                        
            float a = 0.0;
            
            const int n = 48;

            const float m = 2.39996323;            
            //const float rr = 0.15 / sqrt(float(n));
            const float rr = 0.02165063509;


            float fi = 1.0;
            for (int i = 0; i < n; i++)
            {
                float pr = rr * sqrt(fi);
                float theta = m * fi;
                fi += 1.0;

                float px = cos(theta) * pr;
                float py = sin(theta) * pr;

                vec3 pp = vec3(u_pos.x, px, py);
                vec3 p = vec3(xy.x, 0.0, xy.y);
                
                float d = length(p - pp); 
                
                float s = 1.0 / (0.7 + d);

                a += s * sin(u_param.x * d + u_param.y);
            }
            
            
            a *= -0.8 / (float(n));
            
         
            gl_FragColor = intensity_to_color(a);            
        }
        `;


        let reflected_frag_src =
            `
        uniform vec2 u_pos0;
        uniform vec2 u_pos1;
        uniform vec2 u_param;
        
        void main(void) {
            
            float d0 = length(xy - u_pos0.xy);   
            float a0 = history_amplitude(d0 * u_param.x + u_param.y);

            float d1 = length(xy - u_pos1.xy);            
            float a1 = history_amplitude(d1 * u_param.x + u_param.y) * 0.6;
        
            float a = a0 + a1;
            
            gl_FragColor = intensity_to_color(a);
        }
        `;



        let doppler_frag_src =
            `
        uniform vec4 u_param;
        
        float f(float x) {
            return 1.0 - acos(0.95*sin(x)) * (2.0/3.141592741);
        }
        
        float df(float x) {
            float s = sin(x);
            return 0.694789*cos(x)/sqrt(1.0 - 0.9025*s*s);
        }
            
        
        void main(void) {
            
            float v = u_param.z;
            float t = u_param.w;
            float t0 = -2.0;
            
            for (int i = 0; i < 5; i++) {
                float x = v*t0 + t;
                float num = (xy.x - f(x));
                num *= num;
                num += -t0*t0 + xy.y*xy.y;
                
                float denom = -2.0*t0 + 2.0 * (xy.x - f(x))*(-df(x)) * v;
                t0 -= num/denom;
            }   
            
            float a = history_amplitude(-t0 * u_param.x + u_param.y);
        
            
            gl_FragColor = intensity_to_color(a);
        }
        `

        let reverb_frag_src =
            `
        uniform vec4 u_pos;
        uniform vec2 u_param;
        
        void main(void) {
            
            float a = 0.0;
            
            for (int i = -2; i <= 2; i++)
            {
                float dx = float(i) * u_pos.z;
                
                for (int j = -2; j <= 2; j++)
                {
                    float dy = float(j) * u_pos.w;
                    
                    float d = length(xy - u_pos.xy + vec2(dx, dy));
                    
                    a += history_amplitude(d * u_param.x + u_param.y) * pow(0.6, abs(float(j)) + abs(float(i)));
                }
            }

            gl_FragColor = intensity_to_color(a);
        }
        `;


        let point_vert_src =
            `
        attribute vec4 v_coords;
        uniform mat4 u_mvp;
        
        uniform float u_size;
        uniform vec2 u_clip;
        uniform vec4 u_color0;
        uniform vec4 u_color1;
        
        varying mediump vec4 color;
            
        void main(void) {

            gl_Position = u_mvp * vec4(v_coords.xyz, 1.0);
            
            color = mix(u_color0, u_color1, v_coords.w);
            
            color *= 1.0 - smoothstep(u_clip.x, u_clip.y, max(max(abs(v_coords.x), abs(v_coords.y)), abs(v_coords.z)));
        
            float size = u_size * (1.0 + v_coords.w) / gl_Position.w;
            
            color *= min(1.0, size*size);
            gl_PointSize = size;
        }
        `;

        let point_frag_src =
            `
        varying mediump vec4 color;
        precision mediump float;
        
        void main(void) {
            mediump vec2 xy = (gl_PointCoord - 0.5);
            mediump float d = dot(xy, xy);
            mediump float a = 1.0 - smoothstep(0.2, 0.25, d);
        
            gl_FragColor = color * a;
        }
        `;

        let quad_vert_src =
            `
 attribute vec3 v_coords;
 attribute vec3 v_sta;
 
 uniform mat4 u_mvp;
 
 varying mediump vec3 sta;
     
 void main(void) {
     
     sta = v_sta;
 
     gl_Position = u_mvp * vec4(v_coords, 1.0);
 }
 `;

        let glow_frag_src =
            `
     
     precision mediump float;
     
 varying mediump vec3 sta;
 
 
 void main(void) {
    
    mediump float d = dot(sta.xy, sta.xy);
    mediump float a = (1.0 - smoothstep(0.5, 1.0, d)) * sta.z;
    
     gl_FragColor = vec4(0.2, 0.5, 0.85, 1.0) * a;
 }
 `;

        let two_sources_shader = new Shader(gl,
            full_screen_vert_src,
            frag_preamble_src + two_sources_frag_src,
            ["v_position"],
            ["u_map", "u_history", "u_pos0", "u_pos1", "u_param"]);

        let reflected_shader = new Shader(gl,
            full_screen_vert_src,
            frag_preamble_src + reflected_frag_src,
            ["v_position"],
            ["u_map", "u_history", "u_pos0", "u_pos1", "u_param"]);

        let radial_shader = new Shader(gl,
            full_screen_vert_src,
            frag_preamble_src + radial_frag_src,
            ["v_position"],
            ["u_map", "u_history", "u_pos", "u_param"]);

        let shape_shader = new Shader(gl,
            full_screen_vert_src,
            frag_preamble_src + shape_frag_src,
            ["v_position"],
            ["u_map", "u_pos", "u_param"]);

        let doppler_shader = new Shader(gl,
            full_screen_vert_src,
            frag_preamble_src + doppler_frag_src,
            ["v_position"],
            ["u_map", "u_history", "u_param"]);

        let reverb_shader = new Shader(gl,
            full_screen_vert_src,
            frag_preamble_src + reverb_frag_src,
            ["v_position"],
            ["u_map", "u_history", "u_pos", "u_param"]);

        let point_shader = new Shader(gl,
            point_vert_src,
            point_frag_src, ["v_coords"], ["u_mvp", "u_size", "u_clip", "u_color0", "u_color1"]);

        let glow_shader = new Shader(gl,
            quad_vert_src,
            glow_frag_src, ["v_coords", "v_sta"], ["u_mvp"]);


        let prev_width, prev_height;

        let viewport_w = 0;
        let viewport_h = 0;



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

            viewport_w = Math.round(width);
            viewport_h = Math.round(height);
        }

        this.viewport = function(x, y, w, h) {
            gl.viewport(x * scale, y * scale, w * scale, h * scale);
        }


        this.finish = function() {
            gl.flush();
            return gl.canvas;
        }

        this.update_history_texture = function(data) {
            gl.bindTexture(gl.TEXTURE_2D, history_texture);
            gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, history_texture_size, 1, gl.ALPHA, gl.UNSIGNED_BYTE, data);
        }

        this.update_point_buffer = function(positions) {
            gl.bindBuffer(gl.ARRAY_BUFFER, point_vertex_buffer);
            gl.bufferSubData(gl.ARRAY_BUFFER, 0, positions);
            gl.bindBuffer(gl.ARRAY_BUFFER, null);
        }

        this.update_quad_buffer = function(attributes) {
            gl.bindBuffer(gl.ARRAY_BUFFER, quad_vertex_buffer);
            gl.bufferSubData(gl.ARRAY_BUFFER, 0, attributes);
            gl.bindBuffer(gl.ARRAY_BUFFER, null);
        }


        this.draw_points = function(mvp, size, clip = [1, 1], colors = [
            [0, 0, 0, 1],
            [0, 0, 0, 1]
        ]) {

            gl.useProgram(point_shader.shader);

            gl.bindBuffer(gl.ARRAY_BUFFER, point_vertex_buffer);

            gl.enable(gl.BLEND);
            gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
            gl.depthMask(false);

            gl.enableVertexAttribArray(point_shader.attributes["v_coords"]);
            gl.vertexAttribPointer(point_shader.attributes["v_coords"], 4, gl.FLOAT, false, 0, 0);

            gl.uniformMatrix4fv(point_shader.uniforms["u_mvp"], false, mat4_transpose(mvp));

            gl.uniform1f(point_shader.uniforms["u_size"], size);
            gl.uniform2fv(point_shader.uniforms["u_clip"], clip);
            gl.uniform4fv(point_shader.uniforms["u_color0"], colors[0]);
            gl.uniform4fv(point_shader.uniforms["u_color1"], colors[1]);

            gl.drawArrays(gl.POINTS, 0, particles_count);
        }

        this.draw_quads = function(mode, count, mvp) {

            let shader = glow_shader;

            gl.useProgram(shader.shader);


            gl.bindBuffer(gl.ARRAY_BUFFER, quad_vertex_buffer);
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, quad_index_buffer);

            gl.enableVertexAttribArray(shader.attributes["v_coords"]);
            gl.vertexAttribPointer(shader.attributes["v_coords"], 3, gl.FLOAT, false, 24, 0);

            gl.enableVertexAttribArray(shader.attributes["v_sta"]);
            gl.vertexAttribPointer(shader.attributes["v_sta"], 3, gl.FLOAT, false, 24, 12);

            gl.uniformMatrix4fv(shader.uniforms["u_mvp"], false, mat4_transpose(mvp));


            gl.drawElements(gl.TRIANGLES, count * 6, gl.UNSIGNED_SHORT, 0);
        }

        this.draw_full = function(mode, params) {

            let shader;

            if (mode === "two_sources") {
                shader = two_sources_shader;
            } else if (mode === "reflected") {
                shader = reflected_shader;
            } else if (mode === "radial") {
                shader = radial_shader;
            } else if (mode === "shape") {
                shader = shape_shader;
            } else if (mode === "doppler") {
                shader = doppler_shader;
            } else if (mode === "reverb") {
                shader = reverb_shader;
            }

            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, history_texture);

            gl.useProgram(shader.shader);

            gl.bindBuffer(gl.ARRAY_BUFFER, full_screen_vertex_buffer);

            gl.enableVertexAttribArray(shader.attributes["v_position"]);
            gl.vertexAttribPointer(shader.attributes["v_position"], 2, gl.FLOAT, false, 0, 0);

            gl.uniform4fv(shader.uniforms["u_map"], [viewport_w / viewport_h, -1, 0, 0]);

            if (shader.uniforms["u_history"])
                gl.uniform1i(shader.uniforms["u_history"], 0);

            if (mode === "two_sources") {
                gl.uniform2fv(shader.uniforms["u_pos0"], params[0]);
                gl.uniform2fv(shader.uniforms["u_pos1"], params[1]);
                gl.uniform2fv(shader.uniforms["u_param"], params[2]);
            } else if (mode === "reflected") {
                gl.uniform2fv(shader.uniforms["u_pos0"], params[0]);
                gl.uniform2fv(shader.uniforms["u_pos1"], params[1]);
                gl.uniform2fv(shader.uniforms["u_param"], params[2]);
            } else if (mode === "radial") {
                gl.uniform2fv(shader.uniforms["u_pos"], params[0]);
                gl.uniform2fv(shader.uniforms["u_param"], params[1]);
            } else if (mode === "shape") {
                gl.uniform2fv(shader.uniforms["u_pos"], params[0]);
                gl.uniform2fv(shader.uniforms["u_param"], params[1]);
            } else if (mode === "reverb") {
                gl.uniform4fv(shader.uniforms["u_pos"], params[0]);
                gl.uniform2fv(shader.uniforms["u_param"], params[1]);
            } else if (mode === "doppler") {
                gl.uniform4fv(shader.uniforms["u_param"], params[0]);
            }


            gl.drawArrays(gl.TRIANGLES, 0, 3);
        }
    }


    function AudioPlayer() {

        let creator = window.AudioContext || window.webkitAudioContext;

        const ctx = new creator();

        const sample_rate = ctx.sampleRate;

        const pop_duration = 0.1;
        const pop_sample_count = (pop_duration * sample_rate) >>> 0;
        const pop_buffer = ctx.createBuffer(1, pop_sample_count, sample_rate);


        const pop_buffer_data = pop_buffer.getChannelData(0);

        let started = false;

        for (let i = 0; i < pop_sample_count; i++) {
            pop_buffer_data[i] = 1 - smooth_step(0, pop_sample_count - 1, i);
        }

        this.time = function() {
            return ctx.currentTime;
        }

        this.warmup = function() {
            if (started)
                return;

            started = true;

            const source_node = ctx.createOscillator();
            source_node.type = "sine";
            source_node.frequency.value = 50;

            let gain_node = ctx.createGain();
            gain_node.gain.value = 1e-10;

            source_node.connect(gain_node);

            gain_node.connect(ctx.destination);


            source_node.start();
            source_node.stop(ctx.currentTime + 0.1);
        }


        this.play_custom_square = function(frequency, gain, ramp) {

            const base_gain = 0.1;

            const duration = 1 / frequency;
            const sample_count = (duration * sample_rate) >>> 0;
            const buffer = ctx.createBuffer(1, sample_count, sample_rate);


            const buffer_data = buffer.getChannelData(0);

            for (let i = 0; i < sample_count; i++) {
                buffer_data[i] = i < sample_count / 2 ? 1 : 0;
            }

            const source_node = ctx.createBufferSource();
            source_node.buffer = buffer;
            source_node.loop = true;


            let gain_node = ctx.createGain();

            if (ramp) {
                gain_node.gain.value = 0.0;
                gain_node.gain.linearRampToValueAtTime(gain * base_gain, ctx.currentTime + ramp);
            } else {
                gain_node.gain.value = gain * base_gain;
            }

            source_node.connect(gain_node);
            gain_node.connect(ctx.destination);

            source_node.start();

            let last_gain = gain;
            let last_gain_time = ctx.currentTime;
            let last_gain_ramp = 0;

            return {
                stop: function(stop_duration) {
                    gain_node.gain.linearRampToValueAtTime(0, ctx.currentTime + stop_duration);
                    source_node.stop(ctx.currentTime + stop_duration + 0.05);
                },

                set_gain: function(g, ramp = 0.15) {
                    let t = ctx.currentTime;

                    gain_node.gain.setValueAtTime(last_gain * base_gain, max(last_gain_time + last_gain_ramp, t));
                    gain_node.gain.linearRampToValueAtTime(g * base_gain, t + ramp);

                    last_gain = g;
                    last_gain_time = t;
                    last_gain_ramp = ramp;
                },
            }
        }


        this.play_custom = function(t, frequency, signal, gain, time_offset = 0) {

            const base_gain = 0.4;

            const duration = 1 / frequency;
            const sample_count = (duration * sample_rate) >>> 0;
            const buffer = ctx.createBuffer(1, sample_count, sample_rate);

            const sample_offset = ceil(((time_offset / duration) % 1) * sample_count);

            const buffer_data = buffer.getChannelData(0);

            for (let i = 0; i < sample_count; i++) {
                let ii = i - sample_offset;
                if (ii < 0)
                    ii += sample_count;
                buffer_data[ii] = sample_custom(signal, i / sample_count);
            }

            const source_node = ctx.createBufferSource();
            source_node.buffer = buffer;
            source_node.loop = true;


            let gain_node = ctx.createGain();
            gain_node.gain.value = gain * base_gain;

            source_node.connect(gain_node);
            gain_node.connect(ctx.destination);

            source_node.start(t);

            let last_gain = gain;
            let last_gain_time = t;
            let last_gain_ramp = 0;

            return {
                stop: function(stop_duration) {
                    if (stop_duration === 0)
                        gain_node.gain.value = 0;
                    else
                        gain_node.gain.linearRampToValueAtTime(0, ctx.currentTime + stop_duration);

                    source_node.stop(ctx.currentTime + stop_duration + 0.05);
                },

                set_gain: function(g, ramp = 0.15) {
                    let t = ctx.currentTime;

                    gain_node.gain.setValueAtTime(last_gain * base_gain, max(last_gain_time + last_gain_ramp, t));
                    gain_node.gain.linearRampToValueAtTime(g * base_gain, t + ramp);

                    last_gain = g;
                    last_gain_time = t;
                    last_gain_ramp = ramp;
                },
            }
        }


        this.analyze_sound = function(stream) {

            const source = ctx.createMediaStreamSource(stream);
            const fftSize = 1024 * 8;
            const sample_rate = ctx.sampleRate;

            const analyser = ctx.createAnalyser();
            const fmax = 4096;
            analyser.fftSize = fftSize;

            let bin_range = sample_rate / fftSize;

            let max_bin = ceil(fmax / bin_range);

            const length = analyser.frequencyBinCount;
            const data = new Float32Array(max_bin);

            source.connect(analyser);

            return {

                fmax: fmax,
                stop: function() {
                    stream.getTracks().forEach(function(track) {
                        track.stop();
                    });
                },
                data: function() {
                    analyser.getFloatFrequencyData(data);
                    return data;
                },
                frequency: function(i) {
                    return i * bin_range;
                }
            }

        }

        this.play_oscillator = function(t, frequency, type, gain = 1, delay = 0) {

            const base_gain = type == "square" ? 0.21 : 0.5;
            const source_node = ctx.createOscillator();
            source_node.type = type;
            source_node.frequency.value = frequency;

            let t_start = t;

            let gain_node = ctx.createGain();
            gain_node.gain.value = gain * base_gain;

            let decay_node = ctx.createGain();
            decay_node.gain.value = 1.0;

            let delay_node = ctx.createDelay(5);
            delay_node.delayTime.value = delay;


            source_node.connect(decay_node);

            decay_node.connect(gain_node);
            gain_node.connect(delay_node);

            delay_node.connect(ctx.destination);

            let last_gain = gain;
            let last_gain_time = t_start;
            let last_gain_ramp = 0;

            let last_delay = delay;
            let last_delay_time = t_start;
            let last_delay_ramp = 0;

            let last_freq = frequency;
            let last_freq_time = t_start;
            let last_freq_ramp = 0;


            source_node.start(t);

            return {
                stop: function(stop_duration = 0.2) {
                    let t = ctx.currentTime;
                    source_node.stop(ctx.currentTime + stop_duration + 0.1);
                },

                set_decay: function(t) {

                    if (firefox) {

                        /* Ugh. */
                        let t0 = ctx.currentTime;
                        let dt = t - t0;

                        function f() {
                            let now = ctx.currentTime;
                            if (now <= t) {
                                let v = Math.pow(1e-5, (now - t0) / dt)

                                decay_node.gain.value = v;
                                setTimeout(f, 4);
                            }
                        };

                        f();
                    } else {
                        decay_node.gain.exponentialRampToValueAtTime(1e-5, t);
                    }
                },

                set_gain: function(g, ramp = 0.05) {

                    if (last_gain == g)
                        return;

                    let t = ctx.currentTime;

                    gain_node.gain.setValueAtTime(last_gain * base_gain, max(last_gain_time + last_gain_ramp, t));
                    gain_node.gain.linearRampToValueAtTime(g * base_gain, t + ramp);

                    last_gain = g;
                    last_gain_time = t;
                    last_gain_ramp = ramp;
                },
                set_delay: function(d, duration = 0.15) {
                    duration = 0.2;
                    if (delay && last_delay != d) {
                        let t = ctx.currentTime + 0.02;
                        if (duration == 0) {
                            delay_node.delayTime.value = d;
                        } else {
                            delay_node.delayTime.setValueAtTime(last_delay, max(last_delay_time + last_delay_ramp, t));
                            if (delay_node.delayTime.cancelAndHoldAtTime)
                                delay_node.delayTime.cancelAndHoldAtTime(t);
                            delay_node.delayTime.linearRampToValueAtTime(d, t + duration);
                        }

                        last_delay = d;
                        last_delay_time = t;
                        last_delay_ramp = duration;
                    }
                },

                set_frequency: function(f, duration = 0.05) {

                    if (last_freq == f)
                        return;

                    let t = ctx.currentTime;

                    source_node.frequency.setValueAtTime(last_freq, max(last_freq_time + last_freq_ramp, t));
                    source_node.frequency.linearRampToValueAtTime(f, t + duration);

                    last_freq = f;
                    last_freq_time = t;
                    last_freq_ramp = duration;
                }
            }
        }

        this.play_pop = function(gain = 1.0) {

            self = this;
            const source_node = ctx.createBufferSource();
            source_node.buffer = pop_buffer;

            let gain_node = ctx.createGain();
            gain_node.gain.value = gain;

            source_node.connect(gain_node);
            gain_node.connect(ctx.destination);

            source_node.start();
            source_node.stop(ctx.currentTime + pop_duration);
        }

    }

    let gl = new GLDrawer(scale);
    let audio = new AudioPlayer();

    function Drawer(container, mode) {
        let self = this;

        all_drawers.push(self);
        all_containers.push(container);
        container.drawer = this;



        let wrapper = document.createElement("div");
        wrapper.classList.add("canvas_container");
        wrapper.classList.add("non_selectable");

        let canvas = document.createElement("canvas");
        canvas.classList.add("non_selectable");
        canvas.style.position = "absolute";
        canvas.style.top = "0";
        canvas.style.left = "0";
        this.canvas = canvas;

        wrapper.appendChild(canvas);
        container.appendChild(wrapper);

        let play = document.createElement("div");
        play.classList.add("play_pause_button");

        play.onclick = function() {
            self.set_paused(!self.paused);
        }


        let arcball;


        let load_text = mode === "waveform_sound1" || mode === "waveform_sound2"
        mode === "analyser"
        mode === "waveform_addition1" || mode === "waveform_addition2" ||
            mode === "waveform_addition3" || mode === "waveform_addition4" ||
            mode === "reflection1" || mode === "reflection2" ||
            mode === "interference1" ||
            mode === "distance" || mode === "doppler";

        let animated = mode === "waveform_circle" ||
            mode === "string4" ||
            mode === "string5";

        let simulated = mode === "particles1" ||
            mode === "particles2" ||
            mode === "particles3" ||
            mode === "particles4" ||
            mode === "particles5" ||
            mode === "particles6" ||
            mode === "airspring1" ||
            mode === "airspring2" ||
            mode === "airspring3" ||
            mode === "airspring4" ||
            mode === "airspring5" ||
            mode === "hero" ||
            mode === "waveform1" ||
            mode === "waveform2" ||
            mode === "waveform3" ||
            mode === "waveform4" ||
            mode === "waveform5" ||
            mode === "waveform6" ||
            mode === "waveform7" ||
            mode === "waveform8" ||
            mode === "waveform9" ||
            mode === "waveform10" ||
            mode === "waveform_sound1" ||
            mode === "waveform_sound2" ||
            mode === "string1" ||
            mode === "string2" ||
            mode === "string3" ||
            mode === "string7" ||
            mode === "string8" ||
            mode === "string9" ||
            mode === "interference1" ||
            mode === "distance" ||
            mode === "doppler" ||
            mode === "reflection1" ||
            mode === "reflection2" ||
            mode === "frequency_shape" ||
            mode === "frequency_shape2" ||
            mode === "analyser" ||
            mode === "pulse_sphere" ||
            mode === "pulse_piston";

        let has_waveform =
            mode === "waveform8" ||
            mode === "waveform_addition3" ||
            mode === "waveform_addition4";

        let has_reset = mode === "particles6" || mode === "string1" || mode === "string2";

        let has_arcball = mode.startsWith("particles") ||
            mode === "airspring1" ||
            mode === "pulse_piston";

        if (mode === "reflection1" || mode === "reflection2" ||
            mode === "interference1" ||
            mode === "distance" || mode === "doppler")
            units_drawers.push(this);

        let track_drags = mode === "reflection1" || mode === "reflection2" ||
            mode === "interference1" ||
            mode === "distance" || mode === "doppler" || mode === "doppler2";

        const waveform_width_factor = 0.75;
        const waveform_plot_height_factor = 0.95;
        let waveform_height_factor = 1 / 3;

        let prev_timestamp;
        let t = 10;
        let time_track_delta = 0;

        let sim0;
        let sim1;
        let sim2;
        let sim3;
        let sim4;

        let state;
        let signal;
        let signal_changed;

        this.set_signal = function(x) {
            signal = x;
            request_repaint();
        }

        let width, height;

        let ctx_scale;
        let aspect;

        let rot = mat3_mul(rot_x_mat3(2.1), rot_z_mat3(-3.7));

        if (mode === "airspring1") {
            rot = mat3_mul(rot_y_mat3(1.5), rot_x_mat3(-0.2));
        } else if (mode === "pulse_piston") {
            rot = mat3_mul(rot_y_mat3(0.7), rot_x_mat3(-0.2));
        }

        this.paused = true;
        this.requested_repaint = false;
        this.requested_tick = false;

        this.first_draw = true;

        let keyboard;

        this.set_keyboard = function(x) {
            keyboard = x;
        }

        let vp = ident_mat4;
        let proj;
        let ortho_proj;


        if (has_arcball) {
            arcball = new ArcBall(rot, function() {
                rot = arcball.matrix.slice();
                request_repaint();
            });
        }


        function canvas_coordinates(e) {
            let x = e.clientX;
            let y = e.clientY;

            let r = canvas.getBoundingClientRect();
            return [(x - r.left), (y - r.top)];
        }

        function canvas_to_world_space(p) {
            return vec_scale(vec_sub(p, [width / 2, height / 2]), 2 / height);
        }

        let draggables;

        this.set_draggable = function(i, p) {
            if (draggables && i < draggables.length) {
                draggables[i] = p;
                request_repaint();
            }
        }

        let dragged_index = -1;
        let drag_delta;
        const draggable_size = 23;


        let hit_test = function(draggable, p) {
            let size = draggable_size / ctx_scale;

            return vec_len_sq(vec_sub(p, draggable)) < size * size;
        }


        if (track_drags) {
            canvas.addEventListener("mousemove", e => {

                if (dragged_index >= 0)
                    return;

                let p = canvas_to_world_space(canvas_coordinates(e));

                let hit = false;
                if (draggables) {
                    draggables.forEach(draggable => {
                        if (hit_test(draggable, p)) {
                            hit = true;
                            return;
                        }
                    })
                }

                canvas.style.cursor = hit ? "grab" : "default";

                return true;
            }, false);
        }

        if (has_waveform) {
            signal = new Float32Array(signal_samples);

            if (mode === "waveform_addition4") {
                for (let i = 0; i < signal_samples; i++) {
                    let t = i / signal_samples;
                    signal[i] = t >= 0.5 ? 0.9 : -0.9;
                }
            } else {
                for (let i = 0; i < signal_samples; i++) {
                    let t = i / signal_samples;
                    signal[i] = -t * (t - 1) * 4 - 0.1;
                    signal[i] += -1.6 * (sharp_step(0.2, 0.3, t) - sharp_step(0.6, 0.9, t));
                }
            }

            function mod(a, n) {
                return ((a % n) + n) % n;
            };

            let prev_point = undefined;

            function fill_samples_with_event(e) {
                let c = canvas_coordinates(e);

                let w = width * waveform_width_factor;
                let x = (c[0] - (1 - waveform_width_factor) * 0.5 * width) / w;
                let y = (2 * saturate(c[1] / (height * waveform_height_factor)) - 1) * waveform_plot_height_factor;

                let sample = round(x * signal_samples);

                if (prev_point) {
                    let prev_sample = round(prev_point[0] * signal_samples);

                    let prev_y = prev_point[1];

                    let ds = prev_sample <= sample ? 1 : -1;
                    let dx = x - prev_point[0];

                    while (prev_sample != sample) {
                        let xx = (prev_sample + 0.5) / signal_samples;
                        let f = (xx - prev_point[0]) / dx;
                        let yy = lerp(prev_y, y, f);
                        signal[mod(prev_sample, signal_samples)] = yy;

                        prev_sample += ds;
                    }
                }

                signal[mod(sample, signal_samples)] = y;
                signal_changed = true;

                prev_point = [x, y];

                request_repaint();

                return true;
            };

            new TouchHandler(canvas,
                function(e) {
                    return fill_samples_with_event(e);
                },
                function(e) {
                    return fill_samples_with_event(e);
                },
                function(e) {
                    prev_point = undefined;
                });
        } else {
            new TouchHandler(canvas,
                function(e) {
                    let c = canvas_coordinates(e);
                    let p = canvas_to_world_space(c);

                    if (track_drags) {
                        if (draggables) {
                            for (let i = 0; i < draggables.length; i++) {
                                if (hit_test(draggables[i], p)) {
                                    dragged_index = i;
                                }
                            }
                        }

                        if (dragged_index >= 0) {
                            drag_delta = vec_sub(p, draggables[dragged_index]);
                            canvas.style.cursor = "grabbing";
                            return true
                        }
                        return false;
                    } else if (arcball) {
                        arcball.start(width - c[0], c[1]);
                        return true;
                    }

                    return false;
                },
                function(e) {
                    let c = canvas_coordinates(e);
                    let p = canvas_to_world_space(c);

                    if (dragged_index >= 0) {

                        draggables[dragged_index] = vec_sub(p, drag_delta);

                        request_repaint();
                    } else if (arcball) {
                        arcball.update(width - c[0], c[1], e.timeStamp);
                        rot = arcball.matrix.slice();
                        request_repaint();
                    }
                    return true;
                },
                function(e) {
                    let p = canvas_to_world_space(canvas_coordinates(e));

                    if (dragged_index >= 0) {

                        if (hit_test(draggables[dragged_index], p)) {
                            canvas.style.cursor = "grab";
                        } else {
                            canvas.style.cursor = "default";
                        }

                        dragged_index = -1;
                    } else if (arcball) {
                        arcball.end(e.timeStamp);
                    }
                });
        }

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


        this.reset = function() {
            sim0 = undefined;
            sim1 = undefined;
            sim2 = undefined;
            state = undefined;
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

        if (animated) {
            wrapper.appendChild(play);
            animated_drawers.push(this);
        }

        if (has_reset) {

            let reset = document.createElement("div");
            reset.classList.add("restart_button");

            reset.onclick = function() {
                self.reset();
                self.set_paused(false);
            }

            wrapper.appendChild(reset);

        }

        if (simulated) {
            this.set_paused(false);
        }


        function request_repaint(force = false) {
            if (!self.requested_repaint && (self.f_draw || self.paused || force)) {
                self.requested_repaint = true;
                window.requestAnimationFrame(function() {
                    self.f_draw = true;
                    self.repaint();
                });
            }
        }

        this.set_visible = function(x) {
            this.visible = x;
            if (x && !this.was_drawn)
                request_repaint();
        }

        let finger_pos = undefined;

        this.set_finger_pos = function(p) {
            finger_pos = p;
            request_repaint();
        }

        let sim_sliders = [];

        this.set_sim_slider = function(i, x) {
            sim_sliders[i] = x;
        }


        let arg0 = 0,
            arg1 = 0,
            arg2 = 0;

        let keys = [0, 0, 0];

        this.set_arg0 = function(x, force = false) {
            arg0 = x;
            if (simulated)
                this.set_paused(false);
            request_repaint(force);
        }
        this.set_arg1 = function(x, force = false) {
            arg1 = x;
            if (simulated)
                this.set_paused(false);
            request_repaint(force);
        }
        this.set_arg2 = function(x, force = false) {
            arg2 = x;
            if (simulated)
                this.set_paused(false);
            request_repaint(force);
        }

        this.set_key = function(key, value) {
            keys[key] = value;
            request_repaint(true);
        }

        this.set_rot = function(x) {
            rot = x;
            if (arcball)
                arcball.set_matrix(x);

            request_repaint();
        }

        let invalidated = false;

        this.invalidate_state = function() {
            invalidated = true;
        }


        let start_audio_nodes = undefined;
        let control_audio_nodes = undefined;

        let audio_started = false;

        this.start_audio = function() {
            if (!audio_started && start_audio_nodes) {
                start_audio_nodes.forEach((node) => node.start());
                audio_started = true;
            }
        }

        this.request_repaint = request_repaint;


        this.reset();

        this.on_resize = function() {
            let new_width = wrapper.clientWidth;
            let new_height = wrapper.clientHeight;

            if (new_width != width || new_height != height) {

                width = new_width;
                height = new_height;

                ctx_scale = height / 2;

                canvas.style.width = width + "px";
                canvas.style.height = height + "px";
                canvas.width = width * scale;
                canvas.height = height * scale;

                aspect = width / height;

                let proj_w = 13.50;
                let proj_h = proj_w / aspect;

                ortho_proj = [1 / proj_w, 0, 0, 0,
                    0, 1 / proj_h, 0, 0,
                    0, 0, -0.015, 0,
                    0, 0, 0, 1
                ];


                let fov = Math.PI * 0.18;
                let near = 1.0;
                let far = 17.0;

                let f = 1.0 / Math.tan(fov / 2);
                let rangeInv = 1 / (near - far);

                proj = [
                    f / aspect, 0, 0, 0,
                    0, f, 0, 0,
                    0, 0, (near + far) * rangeInv, -1,
                    0, 0, near * far * rangeInv * 2, 0
                ];


                proj = mat4_transpose(proj);
                proj = mat4_mul(proj, translation_mat4([0, 0, -6.5]));


                let pad = 5;
                let a_size = Math.max(width, height) - pad * 2;


                if (arcball)
                    arcball.set_viewport(width / 2 - a_size / 2 + pad,
                        height / 2 - a_size / 2 + pad,
                        a_size, a_size);

                request_repaint();
            }
        }




        this.repaint = function(dt) {

            if (dt === undefined)
                dt = 0;

            self.requested_repaint = false;

            if (!self.visible && !self.f_draw)
                return;

            if (width == 0 || height == 0)
                return;

            vp = mat4_mul(proj, mat3_to_mat4(rot));

            let ctx = canvas.getContext("2d");


            ctx.resetTransform();
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.scale(scale, scale);
            ctx.setLineDash([]);

            let base_line_width = 1.5;

            let font_size = 22;

            if (window.innerWidth < 500)
                font_size = 20;

            if (window.innerWidth < 400)
                font_size = 18;

            if (window.innerWidth < 350)
                font_size = 16;


            ctx.lineCap = "round";
            ctx.lineJoin = "round";
            ctx.lineWidth = base_line_width;

            ctx.font = font_size + "px IBM Plex Sans";
            ctx.textAlign = "center";
            ctx.globalAlpha = 1.0;
            ctx.globalCompositeOperation = "source-over";



            self.first_draw = false;
            self.f_draw = false;


            const cube_pairs = [
                [0, 1],
                [2, 3],
                [0, 2],
                [1, 3],
                [4, 5],
                [6, 7],
                [4, 6],
                [5, 7],
                [0, 4],
                [1, 5],
                [2, 6],
                [3, 7]
            ];

            if (mode === "particles1" || mode === "particles2" ||
                mode === "particles3" || mode === "particles4" ||
                mode === "particles5" || mode === "particles6") {

                let dt_scale = arg0;

                let colors = [
                    rgba255_color(43, 115, 184, 0.8),
                    rgba255_color(43, 115, 184, 0.8),
                ];
                let clip = [0.9, 1.02];
                let zoom = 1.04;
                let particle_start = 0;

                const zoom_out_scale = 20.0;


                if (mode === "particles2") {
                    particle_start = 1;
                    colors = [
                        rgba255_color(43, 115, 184, 0.2),
                        [1, 0, 0, 1]
                    ];
                } else if (mode === "particles3") {
                    particle_start = 1;
                    colors = [
                        [0, 0, 0, 0.1],
                        [0, 0, 0, 0.1],
                    ];
                    clip = [1, 2];
                } else if (mode === "particles4") {
                    colors = [
                        [0, 0, 0, 0.1],
                        [0, 0, 0, 0.1]
                    ];
                    dt_scale = 0.5;
                    clip = [1, 2];
                    zoom = 0.8;
                } else if (mode === "particles5") {
                    zoom = lerp(1, 1 / zoom_out_scale, sqrt(arg0));
                    dt_scale = 0.3;
                } else if (mode === "particles6") {
                    zoom = 1 / zoom_out_scale;
                }

                this.set_paused(dt_scale === 0);


                let walls = mode === "particles3" ||
                    mode === "particles4";


                if (sim0 == undefined) {

                    if (mode === "particles6") {
                        sim0 = [0, 0, 0];
                        sim1 = [0, 0, 0];
                        sim2 = 0;
                        sim3 = undefined;
                        sim4 = [];
                    } else {
                        initialize_particles();
                    }

                    if (mode === "particles3" || mode === "particles4") {
                        sim2 = [];
                        sim3 = [];
                        sim4 = 0.5;
                        for (let i = 0; i < 100; i++) {
                            sim3[i] = 3.1 + Math.random() * 0.2;
                        }
                    }
                }

                if (mode === "particles3" || mode === "particles4") {
                    if (sim4 != arg0) {
                        let v = 0.4;
                        if (sim4 < arg0)
                            sim4 = min(arg0, sim4 + v * dt);
                        else
                            sim4 = max(arg0, sim4 - v * dt);
                    }
                }

                let wx = mode === "particles4" ? (0.5 + sim4) : 1;

                let area = 2 + wx * 4;

                dt = min(dt, 1 / 30) * dt_scale;


                let point_size = particle_r * width * proj[0] * scale * zoom;
                let mvp = mat4_mul(vp, scale_mat4(zoom));

                if (mode === "particles6") {

                    const nanometers_per_unit = 25;
                    const mean_free_path = 65;


                    if (sim2 <= 0) {
                        /* Nothing scientific here. CDF of Maxwell-Boltzman approximated by sigmoid and inverted. */
                        let free_path = Math.max(1, (-Math.log(1 / Math.random() - 1) + 4) / 0.06) / nanometers_per_unit;
                        sim2 = free_path;

                        let v = Math.max(20, (-Math.log(1 / Math.random() - 1) + 4) / 0.06) * 0.2;
                        let a0 = 2 * pi * Math.random();
                        let a1 = Math.acos(1 - 2 * Math.random());
                        sim1[0] = Math.sin(a0) * Math.sin(a1) * v;
                        sim1[1] = Math.cos(a0) * Math.sin(a1) * v;
                        sim1[2] = Math.cos(a1) * v;
                        sim3 = sim3 === undefined ? 0 : 1;

                        if (sim4.length >= 64)
                            sim4.pop();
                        sim4.unshift(sim0);
                    }

                    if (abs(sim0[0]) > zoom_out_scale ||
                        abs(sim0[1]) > zoom_out_scale ||
                        abs(sim0[2]) > zoom_out_scale) {

                        sim1 = [0, 0, 0];
                    }

                    let ds = vec_scale(sim1, dt);
                    sim0 = vec_add(sim0, ds);
                    sim2 -= vec_len(ds);
                    sim3 -= dt * 5.0;



                    let color = vec_lerp([0, 0, 0, 0.5], [1, 0, 0, 1], saturate(sim3));

                    let pp = mat4_mul_vec3(mvp, sim0);
                    let p = project(pp);

                    ctx.fillStyle = rgba_color_string(color);
                    ctx.translate(width / 2, height / 2);

                    ctx.setLineDash([]);
                    let path_length = 0;
                    let p0 = sim0;

                    ctx.strokeStyle = "rgba(0,0,0,0.1)";
                    ctx.lineCap = "butt";

                    for (let i = 0; i < sim4.length; i++) {

                        let p1 = sim4[i];

                        let len = vec_len(vec_sub(p1, p0));
                        path_length += len;

                        let pp0 = project(mat4_mul_vec3(mvp, p0));
                        let pp1 = project(mat4_mul_vec3(mvp, p1));

                        ctx.globalAlpha = 1 - smooth_step(50, 140, path_length);
                        ctx.beginPath();
                        ctx.lineTo(pp0[0], pp0[1]);
                        ctx.lineTo(pp1[0], pp1[1]);
                        ctx.stroke();

                        p0 = p1;
                    }

                    ctx.globalAlpha = 1;
                    ctx.fillEllipse(p[0], p[1], height * 0.02 * (1 + 0.5 * saturate(sim3)) / pp[3]);
                } else {

                    let collisions = simulate_particles(dt, walls, wx, particle_start);

                    let sc = 0.5;
                    gl.begin(width * sc, width * sc);
                    gl.update_point_buffer(sim0);
                    gl.draw_points(mvp, point_size * sc, clip, colors);

                    if (mode === "particles3" || mode === "particles4") {

                        let kk = 0.97;

                        let val = dt ? (collisions.length / (area * 120 * dt)) : 0.0;
                        sim3.pop();
                        sim3.unshift(kk * sim3[0] + (1 - kk) * val);

                        sim2 = sim2.filter(xydl => {
                            xydl[3] -= dt * 8;
                            return xydl[3] > 0;
                        }).concat(collisions);

                        let length = min(sim2.length, quad_count);
                        if (length) {
                            let buf = new Float32Array(length * 6 * 4);

                            for (let i = 0; i < length; i++) {

                                let xydl = sim2[i];

                                for (let k = 0; k < 4; k++) {

                                    const size = 0.02 * (0.5 + 0.5 * xydl[3]);
                                    let x, y, z;
                                    if (abs(xydl[2]) == 1) {
                                        x = xydl[2] < 0 ? -wx : wx;
                                        y = xydl[0] + (k & 1 ? -size : size);
                                        z = xydl[1] + (k & 2 ? -size : size);
                                    } else if (abs(xydl[2]) == 2) {
                                        y = xydl[2] < 0 ? -1 : 1;
                                        x = xydl[0] + (k & 1 ? -size : size);
                                        z = xydl[1] + (k & 2 ? -size : size);
                                    } else if (abs(xydl[2]) == 3) {
                                        z = xydl[2] < 0 ? -1 : 1;
                                        x = xydl[0] + (k & 1 ? -size : size);
                                        y = xydl[1] + (k & 2 ? -size : size);
                                    }

                                    buf[i * 24 + k * 6 + 0] = x;
                                    buf[i * 24 + k * 6 + 1] = y;
                                    buf[i * 24 + k * 6 + 2] = z;
                                    buf[i * 24 + k * 6 + 3] = k & 1 ? -1 : 1;
                                    buf[i * 24 + k * 6 + 4] = k & 2 ? -1 : 1;
                                    buf[i * 24 + k * 6 + 5] = xydl[3];
                                }
                            }

                            gl.update_quad_buffer(buf);
                            gl.draw_quads("glow", sim2.length, mvp);

                        }
                    }

                    ctx.drawImage(gl.finish(), 0, 0, width, width);
                    ctx.translate(width / 2, width / 2);
                }



                let points = [];
                for (let i = 0; i < 8; i++) {
                    let x = (((i & 1) * 2) - 1) * wx;
                    let y = ((i & 2) * 1) - 1;
                    let z = ((i & 4) * 0.5) - 1;
                    points.push(project(mat4_mul_vec3(mvp, [x, y, z])));
                }

                if (walls) {
                    ctx.fillStyle = "rgba(0,0,0,0.025)";
                    ctx.beginPath();

                    convex_hull(points.slice()).forEach(p => {
                        ctx.lineTo(p[0], p[1]);
                    });
                    ctx.fill();
                }


                let stroke_style;

                if (walls) {
                    stroke_style = "rgba(0,0,0,0.15)";
                } else {
                    ctx.lineCap = "butt";
                    stroke_style = "rgba(103,143,193,0.6)";
                }


                cube_pairs.forEach((pair, i) => {

                    if (!walls) {
                        let len = vec_len(vec_sub(points[pair[0]].slice(0, 2),
                            points[pair[1]].slice(0, 2)));

                        let dash = 0.011 * len;
                        ctx.setLineDash([dash, dash * 1.5]);
                    }

                    if (mode === "particles4" && (i == 0 || i == 1 || i == 4 || i == 5)) {
                        ctx.strokeStyle = "#EDBA38";
                        ctx.lineWidth = 3.0;
                    } else {
                        ctx.strokeStyle = stroke_style;
                        ctx.lineWidth = walls ? 1.5 : 1.0;
                    }

                    ctx.beginPath();
                    ctx.lineTo(points[pair[0]][0], points[pair[0]][1]);
                    ctx.lineTo(points[pair[1]][0], points[pair[1]][1]);
                    ctx.stroke();
                });


                if (mode === "particles5" || mode === "particles6") {

                    ctx.save();

                    ctx.lineWidth = 1.5;
                    let points = [];
                    for (let i = 0; i < 8; i++) {
                        let x = (((i & 1) * 2) - 1) * zoom_out_scale;
                        let y = (((i & 2) * 1) - 1) * zoom_out_scale;
                        let z = (((i & 4) * 0.5) - 1) * zoom_out_scale;
                        points.push(project(mat4_mul_vec3(mvp, [x, y, z])));
                    }

                    ctx.globalAlpha = smooth_step(2 / zoom_out_scale, 1 / zoom_out_scale, zoom);
                    ctx.strokeStyle = "#CE8522";

                    cube_pairs.forEach((pair, i) => {

                        let len = vec_len(vec_sub(points[pair[0]].slice(0, 2),
                            points[pair[1]].slice(0, 2)));

                        let dash = 0.011 * len;
                        ctx.setLineDash([dash, dash * 1.5]);

                        ctx.beginPath();
                        ctx.lineTo(points[pair[0]][0], points[pair[0]][1]);
                        ctx.lineTo(points[pair[1]][0], points[pair[1]][1]);
                        ctx.stroke();
                    });
                    ctx.restore();

                    ctx.feather(width * scale, height * scale,
                        canvas.height * 0.1, canvas.height * 0.1,
                        canvas.height * 0.1, canvas.height * 0.1);
                }

                ctx.fillStyle = "black";

                if (mode === "particles4") {

                    ctx.lineWidth = 1;



                    let ys = ceil(height * 0.04);
                    ctx.translate(width * 0.1, -width * 0.5 + height - 5);

                    {
                        let sc = 0.015 * width;

                        ctx.save()

                        ctx.translate(-width * 0.6, -height * 0.06);

                        ctx.fillStyle = "#337FD9";

                        ctx.save()

                        ctx.translate(-0, -sc * 0.25);

                        ctx.globalAlpha = 0.7;
                        ctx.fillEllipse(sc, -sc, sc * 0.2);
                        ctx.fillEllipse(sc * 2, -sc * 1.5, sc * 0.4);
                        ctx.fillEllipse(sc * 3, -sc * 1.0, sc * 0.3);
                        ctx.fillEllipse(sc * 1.5, -sc * 3.0, sc * 0.3);
                        ctx.fillEllipse(sc * 2.5, -sc * 2.5, sc * 0.2);
                        ctx.fillEllipse(sc * 3.5, -sc * 3, sc * 0.35);
                        ctx.fillEllipse(sc * 4.5, -sc * 1.5, sc * 0.4);

                        ctx.restore();


                        ctx.lineWidth = 2;
                        ctx.strokeStyle = "#aaa";
                        ctx.strokeLine(0, 0, sc * 5, 0);


                        ctx.lineWidth = 1.0;
                        ctx.strokeStyle = "#999";

                        ctx.save();
                        ctx.translate(width * 0.1 - sc * 3, sc);
                        ctx.rotate(pi / 2);


                        ctx.fillStyle = "#e8e8e8";
                        ctx.fillRect(0, 0, sc * 2 + wx * sc, sc);
                        ctx.fillRect(sc, -sc, sc * wx, sc * 4);

                        ctx.strokeLine(0, 0, 0, sc);
                        ctx.strokeLine(sc, -sc, sc, sc * 3);
                        ctx.strokeLine(sc + wx * sc, -sc, sc + wx * sc, sc * 3);
                        ctx.strokeLine(sc * 2 + wx * sc, 0, sc * 2 + wx * sc, sc);

                        ctx.strokeLine(0, 0, sc * 2 + wx * sc, 0);
                        ctx.strokeLine(0, sc, sc * 2 + wx * sc, sc);

                        ctx.lineWidth = 2;
                        ctx.strokeStyle = "#CEA233";

                        ctx.strokeLine(sc, -sc, sc + wx * sc, -sc);
                        ctx.strokeLine(sc, 0, sc + wx * sc, 0);
                        ctx.strokeLine(sc, sc, sc + wx * sc, sc);
                        ctx.strokeLine(sc, sc * 2, sc + wx * sc, sc * 2);
                        ctx.strokeLine(sc, sc * 3, sc + wx * sc, sc * 3);

                        ctx.restore();
                        ctx.restore();
                    }

                    ctx.globalAlpha = 1;
                    ctx.strokeStyle = "rgba(0,0,0,0.25)";
                    ctx.lineWidth = 1.5;
                    for (let i = 0; i < 4; i++) {


                        let y = -i * ys;
                        ctx.strokeLine(-width * 0.5, y, width * 0.5, y);
                        ctx.lineWidth = 1;
                        ctx.globalAlpha = 0.7;
                    }

                    let n = sim3.length;
                    ctx.lineWidth = 3;

                    ctx.globalAlpha = 0.8;
                    ctx.strokeStyle = "#337ED8";
                    ctx.beginPath();
                    sim3.forEach((y, i) => {
                        let x = -width * 0.5 + i / n * width;

                        ctx.lineTo(x, -y * ys / 2.1);

                    })

                    ctx.stroke();

                    ctx.feather(width * scale, height * scale,
                        canvas.height * 0.0, canvas.height * 0.1,
                        canvas.height * 0.1, canvas.height * 0.0);
                }


            } else if (mode === "string1" || mode === "string2" ||
                mode === "string3" || mode === "string4") {



                let k = 5;
                let c = 0.01;
                let f0 = 3;

                let n = 1;

                if (mode === "string2" || mode === "string3") {
                    n = 2;
                    f0 = 8;
                } else if (mode === "string4") {
                    n = 5;
                }

                ctx.translate(width / 2, height / 2);

                if (state === undefined) {
                    state = {
                        p: new Array(n + 2).fill(0),
                        v: new Array(n + 2).fill(0),
                    }

                    if (mode === "string1") {
                        sim_sliders[0].set_value(0.5);
                    } else if (mode === "string2") {
                        sim_sliders[0].set_value(0.5);
                        sim_sliders[1].set_value(0.5);
                    }

                }

                if (mode === "string1" || mode === "string2") {

                    let new_p = state.p.slice();
                    let new_v = state.v.slice();
                    let any_moving = false;

                    for (let i = 1; i <= n; i++) {


                        if (sim_sliders[i - 1].dragged || invalidated) {
                            new_p[i] = (i == 1 ? arg0 : arg1) - 0.5;
                            new_v[i] = 0;
                            self.set_paused(false);
                            any_moving = true;
                            invalidated = false;
                        } else if (abs(new_p[i]) > 0.001 || abs(new_v[i]) > 0.001 ||
                            abs(new_p[i - 1] - new_p[i]) > 0.001 ||
                            abs(new_p[i + 1] - new_p[i]) > 0.001) {
                            new_v[i] += -k * (2 * state.p[i] - state.p[i - 1] - state.p[i + 1]) - c * state.v[i];

                            new_p[i] += new_v[i] * dt;

                            new_p[i] = clamp(new_p[i], -0.5, 0.5);

                            if (i == 1)
                                arg0 = new_p[i] + 0.5;
                            else
                                arg1 = new_p[i] + 0.5;

                            sim_sliders[i - 1].set_value(new_p[i] + 0.5);
                            any_moving = true;
                        }
                    }

                    if (!any_moving)
                        self.set_paused(true);

                    state.p = new_p;
                    state.v = new_v;
                } else if (mode === "string3") {

                    let f1 = sqrt(3) * f0;

                    state.p[1] = 0.25 * (arg0 * sin(f0 * t) * sin(1 / 3 * pi) + arg1 * sin(f1 * t) * sin(1 / 3 * pi * 2));
                    state.p[2] = 0.25 * (arg0 * sin(f0 * t) * sin(2 / 3 * pi) + arg1 * sin(f1 * t) * sin(2 / 3 * pi * 2));

                    self.set_paused(arg0 === 0 && arg1 === 0);
                } else if (mode === "string4") {


                    let i = arg0 + 1;
                    f0 = 7;
                    let f = 2 * f0 * sin(i * pi / (2 * (n + 1)));
                    let a = 0.5 * sin(f * t);
                    for (let k = 1; k <= n; k++)
                        state.p[k] = a * sin(k / (n + 1) * pi * i);
                }


                function draw_spring(x0, y0, x1, y1, r, k) {

                    let dx = x1 - x0;
                    let dy = y1 - y0;

                    let l = sqrt(dx * dx + dy * dy);

                    ctx.save();
                    ctx.translate(x0, y0);
                    ctx.transform(dx / l, dy / l, -dy / l, dx / l, 0, 0);

                    ctx.lineWidth = width * 0.005;
                    ctx.lineCap = "round";
                    ctx.strokeStyle = "#888";

                    let rr = r * 0.16;

                    ctx.beginPath();
                    ctx.arc(0, 0, rr, pi / 2, pi * 0.);

                    let n = k * 10;
                    let prev_y = -1;
                    for (let i = 0; i <= n; i++) {
                        let t = i / n;

                        let a = Math.PI * k * t;

                        let x = Math.cos(a) * (r * 0.25);
                        let y = Math.sin(a) * (r * 0.25);
                        let z = rr + t * (l - 2 * rr);

                        ctx.lineTo(z, x);
                        prev_y = y;
                    }

                    ctx.arc(l, 0, rr, pi, pi / 2);
                    ctx.stroke();


                    ctx.stroke();
                    ctx.restore();
                }

                function draw_mass(x0, y0, size) {
                    ctx.lineWidth = width * 0.006;
                    let style = ctx.strokeStyle;
                    ctx.strokeStyle = "#666";
                    ctx.strokeLine(x0 - size * 0.8, y0, x0 + size * 0.8, y0);
                    ctx.strokeStyle = style;
                    ctx.lineWidth = width * 0.003;

                    ctx.beginPath();
                    ctx.rect(x0 - size / 2, y0 - size / 2, size, size);
                    ctx.fill();
                    ctx.stroke();
                }



                for (let i = 0; i <= n; i++) {

                    let x0 = ((i + 0) / (n + 1) - 0.5) * (width * 0.9) + width * 0.04;
                    let x1 = ((i + 1) / (n + 1) - 0.5) * (width * 0.9) - width * 0.04;
                    let y0 = state.p[i] * (height * 0.7);
                    let y1 = state.p[i + 1] * (height * 0.7);
                    draw_spring(x0, y0, x1, y1, width * 0.04, ceil(30 / (n + 1)) * 2);
                }

                ctx.fillStyle = "#B08C72";
                ctx.strokeStyle = "#5F4C3E";

                for (let i = 1; i <= n; i++) {
                    let x0 = ((i + 0) / (n + 1) - 0.5) * (width * 0.9);
                    let y0 = state.p[i] * (height * 0.7);

                    if (mode === "string1") {
                        ctx.fillStyle = "#89BAD2";
                        ctx.strokeStyle = "#587A8A";
                    } else if (mode === "string2") {
                        ctx.fillStyle = i == 1 ? "#89BAD2" : "#EBAA09";
                        ctx.strokeStyle = i == 1 ? "#587A8A" : "#AA7B07";
                    }
                    draw_mass(x0, y0, width * 0.05);
                }

                ctx.strokeStyle = "#666";
                ctx.lineWidth = width * 0.006;
                ctx.strokeLine(-width / 2, 0, -width * 0.41, 0);
                ctx.strokeLine(width * 0.41, 0, width * 0.5, 0);

                ctx.fillStyle = "#ddd";
                ctx.strokeStyle = "#888";
                ctx.lineWidth = 2;

                ctx.beginPath();
                ctx.rect(-10 - width / 2, -height, width * 0.07 + 10, height * 2);
                ctx.fill();
                ctx.stroke();

                ctx.beginPath();
                ctx.rect(width / 2 - width * 0.07, -height, width * 0.07 + 10, height * 2);
                ctx.fill();
                ctx.stroke();



                ctx.feather(width * scale, height * scale,
                    canvas.height * 0.15, canvas.height * 0.15,
                    canvas.height * 0.15, canvas.height * 0.15);

            } else if (mode === "string5") {

                let f0 = 1;

                let n = 6;

                ctx.translate(width / 2, height / 2);

                let w = (width * 0.9);

                let time = t;

                let i = arg0 + 1;

                let f = f0 * i;
                let a = 0.125 * sin(f * t * 2 * pi);

                let func = function(t) {
                    return a * sin(t * pi * i) * height * 0.7
                }




                ctx.strokeStyle = "#888";
                ctx.lineWidth = 2;
                ctx.beginPath();

                ctx.lineTo(-width, 0);

                let nn = floor(w / 6);


                for (let k = 0; k <= nn; k++) {
                    let t = k / nn;

                    let y = func(t);
                    let x = (t - 0.5) * w;

                    ctx.lineTo(x, y);
                }
                ctx.lineTo(width, 0);

                ctx.stroke();


                ctx.lineWidth = 1;
                ctx.fillStyle = "#B08C72";
                ctx.strokeStyle = "#5F4C3E";

                for (let k = -10; k <= nn + 10; k++) {
                    let t = k / nn;

                    let y = func(t);
                    if (k <= 0 || k > nn)
                        y = 0;
                    let x = (t - 0.5) * w;

                    ctx.fillRect(x - 2, y - 2, 4, 4);
                    ctx.strokeRect(x - 2, y - 2, 4, 4);
                }


                ctx.strokeStyle = "#666";
                ctx.lineWidth = 9;
                ctx.strokeLine(-width * 0.9 * 0.5, -8, -width * 0.9 * 0.5, 8);
                ctx.strokeLine(+width * 0.9 * 0.5, -8, +width * 0.9 * 0.5, 8);

                ctx.strokeStyle = "#aaa";
                ctx.lineWidth = 6;
                ctx.strokeLine(-width * 0.9 * 0.5, -8, -width * 0.9 * 0.5, 8);
                ctx.strokeLine(+width * 0.9 * 0.5, -8, +width * 0.9 * 0.5, 8);

                ctx.feather(width * scale, height * scale,
                    canvas.height * 0.15, canvas.height * 0.15,
                    canvas.height * 0.15, canvas.height * 0.15);


                ctx.fillStyle = "#333";

                ctx.fillText("frequency = " + (f0 * (arg0 + 1)) + " Hz", 0, height * 0.5 - font_size * 0.5);


            } else if (mode === "string7" || mode === "string8" || mode === "string9") {

                let f0 = 19;
                let sound_f0 = 200;

                const n_sines = 128;


                let limit = 1;
                let range = 1;
                let d = 1;

                if (mode === "string8") {
                    limit = arg0;
                    range = (1.0 + limit) / 2;

                } else if (mode === "string9") {
                    d = 0.5 + arg0;
                }

                f0 /= range * d;
                sound_f0 /= range * d;


                if (state === undefined) {
                    state = {
                        prev_p: [0, 0],
                        amplitudes: new Array(n_sines).fill(0),
                        nodes: undefined,
                        f0: f0,
                    }
                }


                ctx.translate(width / 2, height / 2);

                let r = 4;



                let w = (width * 0.9);

                let time = t;

                let decay = 5;

                if (f0 != state.f0) {
                    if (state.nodes) {
                        state.nodes.forEach((node, i) => {
                            node.set_frequency((i + 1) * sound_f0, 0.1);
                        });
                    }

                    state.f0 = f0;

                }

                let pp;

                if (finger_pos) {
                    if (state.nodes) {
                        let decay = 0.05;
                        state.nodes.forEach(node => {
                            node.set_gain(0, decay);
                        });

                        state.nodes = undefined;
                    }

                    let p = vec_sub(finger_pos, [width * 0.5, height * 0.5]);

                    p[0] /= w * 0.5;
                    p[1] /= height * 0.5;

                    p[0] = clamp(p[0], -0.8, -1.0 + 2.0 * range - 0.2);
                    p[1] = clamp(p[1], -0.6, 0.6);

                    pp = p.slice();
                    pp[0] *= w * 0.5;
                    pp[1] *= height * 0.5;

                    p[0] = (p[0] + 1) * 0.5;


                    if (state.prev_p) {
                        if (!state.touching) {
                            state.touching = (state.prev_p[1] > 0) != (p[1] > 0);
                        }


                    }

                    let l = range;

                    if (state.touching) {
                        for (let i = 1; i < n_sines; i++) {

                            let a = 2 * p[1] / (i * i * pi * pi)
                            a *= l * l / (p[0] * (l - p[0]));
                            a *= sin(p[0] * i * pi / l);

                            state.amplitudes[i] = a;
                        }
                    } else {
                        state.amplitudes.fill(0);
                    }

                    state.t0 = time;
                    state.prev_p = p;

                } else if (state.prev_p) {
                    state.nodes = [];
                    state.touching = false;
                    state.prev_p = undefined;

                    let t0 = audio.time() + 0.01;
                    for (let i = 1; i < 16; i++) {
                        let node = audio.play_oscillator(t0, sound_f0 * i, "sine", abs(state.amplitudes[i]));
                        node.set_decay(t0 + decay);
                        node.stop(decay);
                        state.nodes.push(node);
                    }
                }



                ctx.globalAlpha = 1;

                ctx.strokeStyle = "#957863";
                ctx.lineWidth = 4 * d + 3;

                ctx.beginPath();
                ctx.lineTo(-width, 0);

                let dt = (time - state.t0);

                let a0 = Math.exp(-dt);

                self.set_paused(!state.t0 || a0 < 3e-3);

                let nn = ceil(width / 5);
                for (let i = 0; i <= nn; i++) {
                    let t = i / nn;
                    let x = -0.5 * w + w * t * range;
                    let y = 0;

                    for (let k = 0; k < n_sines; k++) {
                        let f = f0 * k;

                        let a = cos(f * dt * 2 * pi);

                        y += sin((k) * pi * t) * state.amplitudes[k] * a;
                    }

                    y *= a0 * height * 0.5;

                    ctx.lineTo(x, y);
                }
                ctx.lineTo(width, 0);

                ctx.stroke();

                ctx.strokeStyle = "#C5A085";
                ctx.lineWidth = 4 * d;
                ctx.stroke();

                ctx.strokeStyle = "#666";
                ctx.lineWidth = 9;
                ctx.strokeLine(-width * 0.9 * 0.5, -8, -width * 0.9 * 0.5, 8);
                ctx.strokeLine(+width * 0.9 * 0.5, -8, +width * 0.9 * 0.5, 8);

                ctx.strokeStyle = "#aaa";
                ctx.lineWidth = 6;
                ctx.strokeLine(-width * 0.9 * 0.5, -8, -width * 0.9 * 0.5, 8);
                ctx.strokeLine(+width * 0.9 * 0.5, -8, +width * 0.9 * 0.5, 8);


                ctx.fillStyle = "#E0841C";
                if (pp) {
                    ctx.fillEllipse(pp[0], pp[1], 4);
                    ctx.globalAlpha = 0.3;
                    ctx.fillEllipse(pp[0], pp[1], 20);
                    ctx.globalAlpha = 1;

                }

                if (mode === "string8") {
                    ctx.fillStyle = "#0C506B";
                    ctx.fillEllipse(w * limit * 0.5, 0, 4);
                    ctx.globalAlpha = 0.3;
                    ctx.fillEllipse(w * limit * 0.5, 0, 20);
                    ctx.globalAlpha = 1;
                }


                ctx.feather(width * scale, height * scale,
                    canvas.height * 0.15, canvas.height * 0.15,
                    canvas.height * 0.15, canvas.height * 0.15);


            } else if (mode === "airspring1" || mode === "airspring2" || mode === "airspring3" ||
                mode === "airspring4" || mode === "airspring5") {

                let N = 200;
                let NSIM = 10;

                let k = 300;
                let c = 1;
                let m = 1;
                let p_scale = 4;
                let dt = 0.1;
                let draw_scale = width * 0.02;
                let f = 0;

                let rr = 4;


                if (mode === "airspring1") {
                    k = 40;
                } else if (mode === "airspring4") {

                    p_scale = 10.0;
                    dt = 0.02 * arg0;

                } else if (mode === "airspring5") {

                    p_scale = 70.0;
                    dt = 0.02 * arg0;
                }
                self.set_paused(dt === 0);

                if (state === undefined) {

                    let positions = new Float32Array(N);
                    let velocities = new Float32Array(N);
                    let new_positions = new Float32Array(N);
                    let new_velocities = new Float32Array(N);


                    for (let i = 0; i < N; i++)
                        positions[i] = i;

                    state = {
                        positions: positions,
                        velocities: velocities,
                        new_positions: new_positions,
                        new_velocities: new_velocities,
                        time: 0,
                    }
                }


                t = state.time;
                state.time += dt;

                let plate = (arg0 - 0.5);


                if (mode === "airspring1" || mode === "airspring2" || mode === "airspring3") {



                    let any_non_zero = false;

                    dt /= NSIM;

                    for (let i = 0; i < NSIM; i++) {

                        let p = state.positions;
                        let v = state.velocities;
                        let np = state.new_positions;
                        let nv = state.new_velocities;


                        let d = 1;
                        p[0] = f == 0 ? (arg0 - 0.5) : 0.5 * sin(t * 2 * pi * f);

                        for (let i = 1; i < N - 1; i++) {
                            let dx = (p[i + 1] - p[i] - d) - (p[i] - p[i - 1] - 1);
                            let f = k * dx - c * v[i];
                            let a = f / m;

                            np[i] = p[i] + v[i] * dt + 0.5 * a * dt * dt;
                        }

                        np[N - 1] = np[N - 2] + d;

                        for (let i = 1; i < N; i++) {

                            let new_a;
                            let a;
                            let dx = (np[i + 1] - np[i] - d) - (np[i] - np[i - 1] - d);
                            let f = k * dx - c * v[i];
                            new_a = f / m;

                            {
                                let dx = (p[i + 1] - p[i] - d) - (p[i] - p[i - 1] - d);
                                let f = k * dx - c * v[i];
                                a = f / m;
                            }

                            nv[i] = v[i] + 0.5 * (a + new_a) * dt;

                            if (abs(nv[i]) > 5e-3)
                                any_non_zero = true;
                        }


                        state.positions = np;
                        state.velocities = nv;

                        state.new_positions = p;
                        state.new_velocities = v;

                        t += dt;
                    }

                    self.set_paused(!any_non_zero);
                } else {

                    let f = mode === "airspring4" ? 2 : 0.3;

                    let c = 20;
                    let w = f * 2.0 * pi;
                    let k = w / c;

                    let phase = mode === "airspring4" ? 0.1 : -1.5;

                    for (let i = 0; i < 60; i++) {
                        state.positions[i] = i + 0.1 * sin(k * i - t * w + phase);
                    }

                    state.positions[0] = 0.25 * sin(-t * w);
                }



                if (mode === "airspring1") {

                    ctx.translate(width / 2, height / 2);

                    let mvp = mat4_mul(vp, scale_mat4(1.15));


                    let sc = 0.3;
                    let offset = 1.55;

                    let circle_n = 100;

                    function draw_wall() {

                        ctx.fillStyle = "#B4B5BA";
                        ctx.strokeStyle = "#555";
                        ctx.lineWidth = 2;


                        let all_points = [];

                        let z0 = state.positions[0] * sc - offset;

                        for (let i = 0; i < circle_n; i++) {
                            let a = 2 * pi * i / circle_n;
                            let x = cos(a);
                            let y = sin(a);
                            let z = z0;

                            let p = project(mat4_mul_vec3(mvp, [x, y, z]));

                            all_points.push(p);

                            p = project(mat4_mul_vec3(mvp, [x, y, z - 0.1]));

                            all_points.push(p);
                        }

                        ctx.beginPath();
                        convex_hull(all_points.slice()).forEach(p => {
                            ctx.lineTo(p[0], p[1]);
                        });
                        ctx.fill();
                        ctx.stroke();

                        let p0 = mat4_mul_vec4(mat4_invert(mvp), [0, 0, -1, 0]);
                        p0[2] /= p0[3];

                        if (p0[2] - z0 > 0) {
                            ctx.beginPath();
                            for (let i = 0; i < circle_n; i++)
                                ctx.lineTo(all_points[i * 2][0], all_points[i * 2][1]);
                            ctx.closePath();
                            ctx.stroke();
                        } else if (p0[2] - z0 + 0.1 < 0) {

                            ctx.beginPath();
                            for (let i = 0; i < circle_n; i++)
                                ctx.lineTo(all_points[i * 2 + 1][0], all_points[i * 2 + 1][1]);
                            ctx.closePath();
                            ctx.stroke();
                        }

                    }

                    function draw_slices() {
                        ctx.strokeStyle = "rgba(0,0,0,0.08)";
                        ctx.fillStyle = "rgba(0,0,0,0.004)";
                        ctx.lineWidth = 1.5;

                        for (let k = 1; k < 11; k++) {

                            ctx.globalAlpha = 1 - smooth_step(7, 12, k);

                            ctx.beginPath();

                            for (let i = 0; i < circle_n; i++) {
                                let a = 2 * pi * i / circle_n;
                                let x = cos(a);
                                let y = sin(a);
                                let z = state.positions[k] * sc - offset;

                                let p = project(mat4_mul_vec3(mvp, [x, y, z]));
                                ctx.lineTo(p[0], p[1]);
                            }

                            ctx.closePath();
                            ctx.stroke();
                        }
                        ctx.globalAlpha = 1;
                    }

                    if (rot[8] > 0) {
                        draw_wall();
                        draw_slices();
                    } else {
                        draw_slices();
                        draw_wall();

                    }

                    ctx.fillStyle = "rgba(0,0,0,0.04)"


                    let all_points = [];

                    for (let i = 0; i < circle_n; i++) {
                        let a = 2 * pi * i / circle_n;
                        let x = cos(a);
                        let y = sin(a);


                        let p = project(mat4_mul_vec3(mvp, [x, y, -offset - 0.25]));

                        all_points.push(p);

                        p = project(mat4_mul_vec3(mvp, [x, y, 1.8]));

                        all_points.push(p);
                    }


                    ctx.beginPath();
                    convex_hull(all_points.slice()).forEach(p => {
                        ctx.lineTo(p[0], p[1]);
                    });
                    ctx.fill();





                    ctx.feather(width * scale, height * scale,
                        canvas.height * 0.1, canvas.height * 0.1,
                        canvas.height * 0.1, canvas.height * 0.1);

                } else {


                    let visible_n = 60;
                    ctx.translate(draw_scale * 2, 0);

                    if (mode == "airspring4" || mode === "airspring5") {
                        ctx.translate(draw_scale * 8, 0);
                    }




                    for (let i = 1; i < visible_n; i++) {

                        let x0 = state.positions[i];
                        let x1 = state.positions[i + 1];

                        let p = x1 - x0 - 1;
                        let color = p < 0 ? negative_color : positive_color;
                        color[3] = abs(p * p_scale);



                        if (mode == "airspring4" || mode === "airspring5") {
                            ctx.strokeStyle = rgba_color_string(color);
                            let r = (rr + (x0 + x1) * 0.5) * draw_scale;

                            ctx.lineWidth = (x1 - x0) * draw_scale;
                            ctx.strokeEllipse(0, height / 2, r);
                        } else {
                            ctx.fillStyle = rgba_color_string(color);
                            ctx.fillRect(x0 * draw_scale, 0, (x1 - x0) * draw_scale, height);
                        }
                    }
                    ctx.strokeStyle = "rgba(0,0,0,0.2)";
                    ctx.lineWidth = 1;


                    for (let i = 1; i < visible_n; i++) {
                        if (mode == "airspring4" || mode === "airspring5") {

                            let r = (rr + state.positions[i]) * draw_scale;
                            ctx.strokeEllipse(0, height / 2, r);
                        } else {

                            let x = state.positions[i] * draw_scale;
                            ctx.strokeLine(x, 0, x, height);
                        }
                    }

                    ctx.globalAlpha = 1;
                    ctx.save();

                    if (mode == "airspring4" || mode === "airspring5") {

                        ctx.translate(0, height * 0.5);
                        let r = (rr + state.positions[0] + 1.25) * draw_scale

                        let grd = ctx.createRadialGradient(0, 0, 0, 0, 0, r);

                        let n = 20;

                        for (let i = 0; i <= n; i++) {
                            let t = i / n;
                            let a = t * pi * 0.5;
                            let c = cos(a);
                            let dim = lerp(1.0, sqrt(c), 0.4);
                            let color = [180 / 255, 180 / 255, 180 / 255, 1 / dim];
                            grd.addColorStop(t, rgba_color_string(vec_scale(color, dim)));

                        }

                        ctx.lineWidth = 2;

                        ctx.fillStyle = grd;
                        ctx.strokeStyle = "#555";
                        ctx.fillEllipse(0, 0, r);
                        ctx.strokeEllipse(0, 0, r);

                    } else {
                        ctx.translate(state.positions[1] * draw_scale - height * 0.03, height * 0.5);
                        draw_plate(height);
                    }
                    ctx.restore();


                    if (mode === "airspring2" || mode === "airspring3") {
                        ctx.lineWidth = 2;
                        ctx.strokeStyle = "#666";
                        ctx.strokeLine(0, 1, width, 1);
                        ctx.strokeLine(0, height - 1, width, height - 1);
                        ctx.feather(width * scale, height * scale,
                            canvas.height * 0.0, canvas.height * 0.4,
                            canvas.height * 0.0, canvas.height * 0.0);
                    } else {

                        ctx.feather(width * scale, height * scale,
                            canvas.height * 0.3, canvas.height * 0.3,
                            canvas.height * 0.3, canvas.height * 0.3);
                    }
                }

            } else if (mode === "waveform_sound1" || mode === "waveform_sound2") {

                let freq = (Math.pow(2, arg0 * arg0 * arg0) - 1) * 5000;

                if (mode === "waveform_sound2")
                    freq = (Math.pow(2, arg0 * arg0 * arg0) - 1) * 20000;

                freq = round(freq);

                let gain = arg1;

                self.set_paused(arg0 === 0 || arg1 === 0);

                if (state === undefined) {
                    state = {};
                    state.frequency = 0;
                    state.node = undefined;
                    state.gain = gain;
                    state.t0 = 0;
                }

                if (mode === "waveform_sound2")
                    gain *= 0.4;

                let t = audio.time();

                const ramp = 0.1;

                if (state.frequency != freq) {

                    if (mode === "waveform_sound1") {
                        if (state.node) {
                            state.node.stop(ramp);
                            state.node = undefined;
                        }

                        if (freq) {
                            state.node = audio.play_custom_square(freq, 0, ramp);

                            state.node.set_gain(gain, ramp);
                        } else {
                            state.node = undefined;
                        }
                    } else {

                        if (!freq) {
                            state.node.set_gain(0, ramp);
                            state.node.stop(ramp);
                            state.node = undefined;
                        } else if (state.node) {
                            state.node.set_frequency(freq, ramp);
                        } else {
                            state.node = audio.play_oscillator(t, freq, "sine", gain);

                            state.node.set_gain(gain, ramp);
                        }
                    }
                    state.t0 = t;
                    state.frequency = freq;
                }

                if (state.gain != gain) {
                    if (state.node)
                        state.node.set_gain(gain, ramp);

                    state.gain = gain;
                }

                let A = width * 0.1 * arg1;

                function f(t) {

                    const step_size = 0.2;

                    let s = sin((t - state.t0) * 2 * pi * freq);

                    if (mode === "waveform_sound2")
                        return A * s;

                    return A * (smooth_step(-step_size, step_size, s) * 2 - 1);
                }


                ctx.translate(width * 0.8, height / 2);


                let plate_height = height * 0.8;

                ctx.save();

                ctx.lineWidth = 3;
                ctx.strokeStyle = a_style;
                ctx.strokeLine(-A, plate_height * 0.5 + 8, A, plate_height * 0.5 + 8);

                if (freq == 0) {
                    draw_plate(plate_height);
                } else {


                    if (freq < 25 || A == 0) {

                        ctx.save();
                        ctx.translate(f(t), 0);
                        draw_plate(plate_height);


                    } else {

                        let aa = Math.random() * 0.8;

                        let ig = (1.0 - arg1);
                        ig = ig * ig * ig;

                        if (mode === "waveform_sound1") {

                            for (let i = 0; i < 6; i++) {

                                let rand = Math.random();

                                let a = (0.9 + 0.1 * rand) * A;
                                let x = rand > 0.5 ? -a : a;
                                ctx.save();
                                ctx.globalAlpha = 0.25 + ig * 0.4;

                                ctx.translate(x, 0);
                                draw_plate(plate_height);
                                ctx.restore();

                            }

                        } else {

                            for (let i = 0; i < 5; i++) {

                                let rand = Math.random();

                                let a = sin(rand * pi * 2) * A;
                                ctx.save();
                                ctx.globalAlpha = 0.4 + ig * 0.2;

                                ctx.translate(a, 0);
                                draw_plate(plate_height);
                                ctx.restore();
                            }

                        }
                    }

                }
                ctx.restore();


                ctx.save();

                ctx.globalCompositeOperation = "destination-over";
                ctx.lineWidth = 1.5;
                ctx.strokeStyle = "#ccc";
                ctx.strokeLine(0, -plate_height * 0.9, 0, plate_height * 0.7);

                ctx.globalCompositeOperation = "source-over";




                ctx.translate(-width * 0.45, 0);

                ctx.globalAlpha = 0.3;
                let ww = (Math.log10(freq + 1) * 1 + 4) * width * 0.08;
                let hh = width * 0.2;
                ctx.fillStyle = f_style;
                ctx.roundRect(-ww / 2, -hh / 2 - font_size * 0.4, ww, hh, hh * 0.2);
                ctx.fill();

                ctx.fillStyle = "#7BAEC6";
                ctx.globalAlpha = 1;
                ctx.font = font_size * 2.5 + "px IBM Plex Sans";

                ctx.fillText(freq + " Hz", 0, font_size * 0.5);

                ctx.restore();

            } else if (mode === "waveform1" || mode === "waveform2" ||
                mode === "waveform3" || mode === "waveform4" ||
                mode === "waveform5" || mode === "waveform6" ||
                mode === "waveform7" || mode === "waveform8" ||
                mode === "waveform9" || mode === "waveform10" ||
                mode === "hero") {

                function make_step(f, a) {
                    return function(t) {
                        return a;
                    }
                }

                function make_square(f, a) {
                    return function(t) {
                        const step_size = 0.0;

                        let s = sin(t * 2 * pi * f);
                        return a * (smooth_step(-step_size * f, step_size * f, s) * 2 - 1);
                    }
                }

                function make_triangle(f, a) {
                    return function(t) {
                        let s = (t * f + f * 20) % 1;
                        return a * (abs(s - 0.5) * 4 - 1);
                    }
                }

                function make_sine(f, a) {
                    return function(t) {
                        let s = sin(t * 2 * pi * f);
                        return a * s;
                    }
                }



                function make_custom(f, a) {
                    return function(t) {
                        return -a * sample_custom(signal, ((t + 10) * f) % 1);
                    }
                }

                function shift_make_function(func, shift) {

                    return function(f, a) {
                        let inner = func(f, a);
                        return function(t) {
                            return inner(t + shift);
                        }
                    }
                }


                let key_count = 3;

                let creators = new Array(3).fill(make_square);
                let nodes_creator = function() { return undefined; }
                let ramp = 0;
                let decay = 0;
                let frequencies = [220, 330, 440];
                let frequency_scale = 0.002;
                let amplitudes = [1 / 3, 1 / 3, 1 / 3];

                const key_ramp_time = 0.05;

                if (mode === "waveform1" || mode === "waveform2") {
                    creators = new Array(3).fill(make_step);
                    amplitudes = [1 / 2 * 0.25, 1 / 2 * 0.5, 1 / 2];
                } else if (mode === "waveform3") {

                    nodes_creator = function(t) {
                        return [
                            audio.play_oscillator(t, frequencies[0], "square", 0),
                            audio.play_oscillator(t, frequencies[1], "square", 0),
                            audio.play_oscillator(t, frequencies[2], "square", 0),
                        ];
                    }
                } else if (mode === "waveform4") {
                    amplitudes = [1 / 4, 1 / 4, 1 / 4];
                    creators = [make_square, make_square,
                        function(_, a) {
                            let f0 = make_square(frequencies[0] * frequency_scale, a);
                            let f1 = make_square(frequencies[1] * frequency_scale, a);
                            return function(t) {

                                return f0(t) + f1(t);
                            }
                        }
                    ];

                    nodes_creator = function(t) {
                        return [
                            audio.play_oscillator(t, frequencies[0], "square", 0),
                            audio.play_oscillator(t, frequencies[1], "square", 0),
                            audio.play_oscillator(t, frequencies[0], "square", 0),
                            audio.play_oscillator(t, frequencies[1], "square", 0),
                        ];
                    }
                } else if (mode === "waveform5") {
                    creators = new Array(3).fill(make_triangle);
                    amplitudes = [1 / 2 * 0.25, 1 / 2 * 0.5, 1 / 2];
                    frequencies = [330, 330, 330];
                    nodes_creator = function(t) {
                        return [
                            audio.play_oscillator(t, frequencies[0], "triangle", 0),
                            audio.play_oscillator(t, frequencies[1], "triangle", 0),
                            audio.play_oscillator(t, frequencies[2], "triangle", 0),
                        ];
                    }
                } else if (mode === "waveform6") {
                    creators = new Array(3).fill(make_triangle);
                    nodes_creator = function(t) {
                        return [
                            audio.play_oscillator(t, frequencies[0], "triangle", 0),
                            audio.play_oscillator(t, frequencies[1], "triangle", 0),
                            audio.play_oscillator(t, frequencies[2], "triangle", 0),
                        ];
                    }
                } else if (mode === "waveform7") {
                    frequencies = [330, 330, 330];

                    creators = [
                        make_triangle,
                        shift_make_function(make_triangle, 0.25 / frequencies[1] / frequency_scale),
                        shift_make_function(make_triangle, 0.5 / frequencies[1] / frequency_scale),
                    ]

                    nodes_creator = function(t) {
                        return [
                            audio.play_oscillator(t, frequencies[1], "triangle", 0, 0),
                            audio.play_oscillator(t, frequencies[1], "triangle", 0, 0.25 / frequencies[1]),
                            audio.play_oscillator(t, frequencies[1], "triangle", 0, 0.5 / frequencies[1]),
                        ];
                    }
                } else if (mode === "waveform8") {
                    creators = new Array(3).fill(make_custom);


                    nodes_creator = function(t) {
                        return [
                            audio.play_custom(t, frequencies[0], signal, 0),
                            audio.play_custom(t, frequencies[1], signal, 0),
                            audio.play_custom(t, frequencies[2], signal, 0),
                        ];
                    }
                } else if (mode === "waveform9" || mode === "hero") {
                    creators = new Array(3).fill(make_sine);

                    nodes_creator = function(t) {
                        return [
                            audio.play_oscillator(t, frequencies[0], "sine", 0),
                            audio.play_oscillator(t, frequencies[1], "sine", 0),
                            audio.play_oscillator(t, frequencies[2], "sine", 0),
                        ];
                    }
                } else if (mode === "waveform10") {
                    frequency_scale = 1;
                    frequencies = [10, 11, 14];
                    creators = new Array(3).fill(make_sine);

                    nodes_creator = function(t) {
                        return [
                            audio.play_oscillator(t, 330, "sine", 0),
                            audio.play_oscillator(t, 331, "sine", 0),
                            audio.play_oscillator(t, 334, "sine", 0),
                        ];
                    }
                }




                if (state == undefined) {
                    state = {};
                    state.nodes = undefined;
                    state.times = new Array(key_count);
                    state.key_down = new Array(key_count);
                    state.start = 0;
                    for (let i = 0; i < key_count; i++) {
                        state.times[i] = [];
                        state.key_down[i] = false;
                    }

                    if (mode === "waveform1" || mode === "waveform2" || mode === "waveform5") {
                        keyboard.set_label(0, "↑ 0.25");
                        keyboard.set_label(1, "↑ 0.5&nbsp;");
                        keyboard.set_label(2, "↑ 1.0&nbsp;&nbsp;");
                    } else if (mode === "waveform4") {
                        keyboard.set_label(0, "A");
                        keyboard.set_label(1, "B");
                        keyboard.set_label(2, "A + B");
                    } else if (mode === "waveform7") {
                        keyboard.set_label(0, "← 0.0");
                        keyboard.set_label(1, "← 0.25");
                        keyboard.set_label(2, "← 0.5");
                    } else if (mode === "waveform10") {
                        keyboard.set_label(0, "330 Hz");
                        keyboard.set_label(1, "331 Hz");
                        keyboard.set_label(2, "334 Hz");
                    } else {
                        keyboard.set_label(0, frequencies[0] + " Hz");
                        keyboard.set_label(1, frequencies[1] + " Hz");
                        keyboard.set_label(2, frequencies[2] + " Hz");
                    }
                }

                let t = audio.time();

                if (signal_changed) {
                    if (state.nodes) {
                        state.nodes.forEach(node => {
                            node.stop(0);
                        })
                        state.nodes = undefined;
                    }

                    if (keys.some(a => a != 0)) {
                        state.nodes = [];

                        for (let i = 0; i < key_count; i++) {

                            let gain = state.key_down[i] ? amplitudes[i] : 0
                            state.nodes[i] = audio.play_custom(t, frequencies[i], signal, gain, t - state.start);
                        }
                    }

                    signal_changed = false;
                }

                if (!state.nodes && keys.some(a => a != 0)) {

                    state.nodes = nodes_creator(t + 0.02);
                    state.start = t;
                }

                keys.forEach((value, i) => {
                    if (value && !state.key_down[i]) {
                        state.key_down[i] = true;
                        state.times[i].unshift([t, Infinity]);

                        if (mode === "waveform1" || mode === "waveform2") {
                            audio.play_pop(amplitudes[i])
                        } else if (mode === "waveform4" && i == 2) {
                            state.nodes[2].set_gain(amplitudes[i], key_ramp_time);
                            state.nodes[3].set_gain(amplitudes[i], key_ramp_time);
                        } else {
                            if (state.nodes) {
                                state.nodes[i].set_gain(amplitudes[i], key_ramp_time);
                            }
                        }

                    } else if (!value && state.key_down[i]) {
                        state.key_down[i] = false;
                        state.times[i][0][1] = t;

                        if (mode === "waveform1" || mode === "waveform2") {
                            audio.play_pop(amplitudes[i])
                        } else if (mode === "waveform4" && i == 2) {
                            state.nodes[2].set_gain(0, key_ramp_time);
                            state.nodes[3].set_gain(0, key_ramp_time);
                        } else {
                            if (state.nodes) {
                                state.nodes[i].set_gain(0, key_ramp_time);
                            }
                        }
                    }
                });

                if (state.nodes && keys.every(a => a == 0)) {
                    state.nodes.forEach(node => {
                        node.stop(decay + key_ramp_time);
                    })
                    state.nodes = undefined;
                }



                if (mode === "hero") {
                    self.set_paused(true);
                    return;
                }



                let functions = [];

                for (let i = 0; i < key_count; i++) {

                    let last_i = -1;
                    let a = 0;
                    state.times[i].forEach((t0t1, i) => {

                        if (ramp)
                            a += sharp_step(t0t1[0], t0t1[0] + ramp, t);
                        else
                            a += step(t0t1[0], t);

                        if (t0t1[1] != Infinity) {
                            if (decay)
                                a -= sharp_step(t0t1[1], t0t1[1] + decay, t);
                            else
                                a -= step(t0t1[1], t);
                        }

                        if (t <= t0t1[1] + decay)
                            last_i = i;
                    });

                    state.times[i].splice(last_i + 1, state.times[i].length - last_i);

                    functions.push(creators[i](frequencies[i] * frequency_scale, amplitudes[i] * a));
                }


                if (state.times.every(span => {
                        return span.length == 0;
                    })) {
                    self.set_paused(true);
                } else {
                    self.set_paused(false);
                }



                let ff = function(x) {
                    let sum = 0;
                    functions.forEach(f => sum += f(x));
                    return sum;
                };

                /* Drawing. */


                t -= state.start;

                let plot_pad = 4;
                let plot_width = width * 0.7;
                let plot_height = height / (key_count + 1) - plot_pad;

                let plate_height = height * 0.5;
                let plate_offset_scale = width * 0.1;


                if (mode === "waveform8") {
                    plot_height = height * 2 / 3 / (key_count + 1) - 3;

                    plate_height = height * 0.4;
                    ctx.save();

                    ctx.translate(width * 0.5, height * waveform_height_factor * 0.5);
                    draw_signal(width * waveform_width_factor, height * waveform_height_factor);


                    ctx.globalCompositeOperation = "destination-out";
                    ctx.fillStyle = "rgba(0,0,0,0.7)"

                    ctx.fillRect(-width, -height, width, height * 2);
                    ctx.fillRect(width * waveform_width_factor, -height, width, height * 2);

                    ctx.restore();

                    ctx.translate(0, height * waveform_height_factor + 9);


                }


                let styles = [red_style, green_style, blue_style];



                if (mode !== "waveform1") {

                    ctx.save();
                    ctx.translate(0, plot_pad);
                    draw_plot(plot_width, plot_height, ff, t, "#E63946");
                    for (let i = 0; i < key_count; i++) {
                        ctx.translate(0, plot_height + plot_pad);
                        draw_plot(plot_width, plot_height, functions[i], t, styles[i]);
                    }
                    ctx.restore();


                } else {
                    plot_width = 0;
                    plate_height = height * 0.7;
                    plate_offset_scale = width * 0.5;
                    ctx.translate(0, height * 0.03);
                }


                ctx.save();
                ctx.translate(Math.ceil(plot_width), 0);
                ctx.translate(Math.ceil((width - plot_width) / 2), plot_height * (key_count + 2) / 2);

                ctx.lineWidth = 1.5;
                ctx.strokeStyle = "#ccc";
                ctx.strokeLine(0, -plate_height * 0.9, 0, plate_height * 0.7);

                let x = ff(t) * plate_offset_scale;


                ctx.save();


                ctx.translate(x, 0);
                ctx.strokeLine(0, -plate_height * 0.9, 0, plate_height * 0.7);

                draw_plate(plate_height);

                ctx.restore();


                let offset_line_height = width < 600 ? 7 : 10;

                ctx.translate(0, -plate_height / 2 - offset_line_height * 4);
                ctx.lineCap = "butt";

                ctx.strokeStyle = base_plot_style;
                ctx.lineWidth = offset_line_height;

                let yy = offset_line_height * 1.2;
                ctx.strokeLine(0, -1 * yy, x, -1 * yy);

                ctx.fillStyle = "rgba(0,0,0,0.5)";

                ctx.globalCompositeOperation = "destination-out";

                for (let i = 0; i < abs(x) / offset_line_height; i++) {
                    let sign = x > 0 ? 1 : -1;
                    ctx.beginPath();
                    ctx.lineTo(x - sign * (i * offset_line_height), -yy);
                    ctx.lineTo(x - sign * (offset_line_height * 0.7 + i * offset_line_height), -yy - 3);
                    ctx.lineTo(x - sign * (offset_line_height * 0.7 + i * offset_line_height), -yy + 3);
                    ctx.fill();
                }


                let last_x = 0;
                for (let i = 0; i < 3; i++) {
                    let f = plate_offset_scale * functions[i](t);

                    let x = last_x + f;
                    ctx.lineWidth = offset_line_height;
                    ctx.globalCompositeOperation = "source-over";
                    ctx.strokeStyle = [red_style, green_style, blue_style][i];
                    ctx.strokeLine(last_x, i * yy, x, i * yy);

                    ctx.lineWidth = 1;
                    ctx.strokeStyle = "#ccc";
                    ctx.strokeLine(x, i * yy - offset_line_height / 2,
                        x, (i + 1) * yy - offset_line_height / 2);

                    ctx.globalCompositeOperation = "destination-out";

                    for (let k = 0; k < abs(x - last_x) / offset_line_height; k++) {
                        let sign = (x - last_x) > 0 ? 1 : -1;
                        ctx.beginPath();
                        ctx.lineTo(x - sign * (k * offset_line_height), i * yy);
                        ctx.lineTo(x - sign * (offset_line_height * 0.7 + k * offset_line_height), i * yy - 3);
                        ctx.lineTo(x - sign * (offset_line_height * 0.7 + k * offset_line_height), i * yy + 3);
                        ctx.fill();
                    }

                    last_x = x;
                }

                ctx.restore();


                if (mode === "waveform8") {

                    ctx.feather(canvas.width, waveform_height_factor * canvas.height,
                        canvas.height * 0.15, canvas.height * 0.15, 0, 0);

                    ctx.feather(plot_width * scale, height * scale,
                        canvas.height * 0.15, canvas.height * 0.15, 0, 0, 0, waveform_height_factor * height * scale);

                } else {
                    ctx.feather(plot_width * scale, height * scale,
                        canvas.height * 0.15, canvas.height * 0.15, 0, 0);

                    ctx.feather(plot_width * scale, height * scale,
                        canvas.height * 0.15, canvas.height * 0.15, 0, 0, plot_width * scale, 0);

                }


                function draw_plot(width, height, func, t, color) {

                    let n_samples = 2 * Math.ceil(width / signal_samples) * signal_samples;
                    let sample_duration = 4 / n_samples;

                    let sample_length = width / n_samples;
                    let sample_height = height * 0.5 - 2;

                    ctx.save();
                    ctx.translate(0, sample_height);

                    ctx.strokeStyle = "#ddd";
                    ctx.lineWidth = 2.0;
                    ctx.strokeLine(0, 0, width, 0);

                    ctx.strokeStyle = "#bbb";
                    ctx.lineWidth = 1.0;
                    ctx.strokeLine(width / 2, sample_height, width / 2, -sample_height);

                    ctx.strokeStyle = color;
                    ctx.lineCap = "butt";

                    let h = sample_height * func(t);

                    ctx.lineWidth = 6;
                    ctx.strokeLine(width / 2, 0, width / 2, -h);

                    ctx.beginPath();
                    ctx.lineWidth = 3;
                    ctx.globalAlpha = 0.7;

                    for (let i = 0; i <= n_samples; i++) {

                        let local_t = t - (i - n_samples / 2) * sample_duration;

                        local_t = round(local_t * signal_samples * 2) / (signal_samples * 2);
                        let x = width - sample_length * i;
                        let y = -sample_height * func(local_t);

                        ctx.lineTo(x, y);
                    }

                    ctx.stroke();

                    ctx.restore();
                }



            } else if (mode === "waveform_addition1" || mode === "waveform_addition2" ||
                mode === "waveform_addition3" || mode === "waveform_addition4") {

                function make_triangle(f, a, phase = 0) {
                    return function(t) {
                        let s = (t * f + phase + 0.75) % 1;
                        return -a * (abs(s - 0.5) * 4 - 1);
                    }
                }

                function make_sine(f, a, phase) {
                    if (f == 0)
                        return function(t) {
                            return phase < 0 ? a : -a;
                        }
                    return function(t) {
                        let s = -sin((t * f + phase) * 2 * pi);
                        return a * s;
                    }
                }

                let maker = make_triangle;
                let n_f = 4;
                let phases = [];
                let frequencies = [];
                let amplitudes = [];
                let functions = [];

                if (mode === "waveform_addition1") {
                    frequencies = [1, 2, 3, 4];
                    if (arg1 == 0)
                        amplitudes = [0.5, 0.2, 0.3, 0.1];
                    else if (arg1 == 1)
                        amplitudes = [0.1, 0.15, 0.2, 0.25];
                    else if (arg1 == 2)
                        amplitudes = [0.3, 0.001, 0.6, 0.1];

                    phases = [0, 0, 0, 0];
                } else if (mode === "waveform_addition2") {
                    maker = make_sine;
                    frequencies = [0, 1, 2, 3, 4, 5];

                    if (arg1 == 0)
                        amplitudes = [0.1, 0.4, 0.2, 0.1, 0.2, 0.1];
                    else if (arg1 == 1)
                        amplitudes = [0.001, 0.1, 0.2, 0.1, 0.1, 0.4];
                    else if (arg1 == 2)
                        amplitudes = [0.001, 0.6, 0.001, 0.6 * 1 / 5, 0.001, 0.6 * 1 / 9];

                    phases = [0, 0, 0, 0, 0, 0, 0];
                    n_f = 6;
                } else if (mode === "waveform_addition3" || mode === "waveform_addition4") {
                    n_f = n_correlations;

                    let cc = cosine_correlations;
                    let sc = sine_correlations;
                    maker = make_sine;

                    for (let i = 0; i < n_correlations; i++) {
                        frequencies.push(i);

                        let c = 0;
                        let s = 0;
                        for (let k = 0; k < signal_samples; k++) {
                            c += signal[k] * cc[i][k];
                            s += signal[k] * sc[i][k];
                        }
                        c /= signal_samples;
                        s /= signal_samples;

                        if (i == 0) {
                            c *= 0.5;
                            s *= 0.5;
                        }

                        amplitudes.push(-sqrt(c * c + s * s) * 2);

                        phases.push(Math.atan2(c, s) / (2 * pi));
                    }

                }

                const steps = n_f;

                let n = 500;
                let dx = width * waveform_width_factor / n;

                let step = arg0 * steps * 0.999999;

                let step_progress = step % 1;

                let amplitude = height * 0.2;

                step = floor(step);


                for (let i = 0; i < n_f; i++) {
                    functions.push(maker(frequencies[i], amplitudes[i], phases[i]));
                }

                let ps = 1;
                let pt = 0;

                if (mode === "waveform_addition3" || mode === "waveform_addition4") {
                    ctx.save();

                    ctx.translate(width * 0.5, height * waveform_height_factor * 0.5);
                    draw_signal(width * waveform_width_factor, height * waveform_height_factor);

                    ctx.restore();

                    ctx.translate(0, height * waveform_height_factor);

                    amplitude = height * waveform_height_factor * 0.5;
                    ctx.translate(0, amplitude * 1.2);

                } else {
                    ctx.translate(0, amplitude * 2.5);
                }


                let func_progress = smooth_step(0.0, 0.1, step_progress);
                let amplitude_progress = smooth_step(0.0, 0.1, step_progress) - smooth_step(0.3, 0.4, step_progress);
                let arrow_progress = smooth_step(0.2, 0.3, step_progress);
                let new_line_progress = smooth_step(0.3, 0.4, step_progress);
                let lerp_progress = smooth_step(0.45, 0.8, step_progress);
                let add_progress = smooth_step(0.8, 0.9, step_progress);
                let fin_progress = smooth_step(0.9, 0.95, step_progress);

                let offset = -((1 - lerp_progress) * 3.8 - 2);


                ctx.translate((1 - waveform_width_factor) * 0.5 * width, 0);


                if (mode === "waveform_addition3" || mode === "waveform_addition4") {

                    add_progress = step_progress;
                }
                ctx.save();

                ctx.strokeStyle = "#aaa";
                ctx.lineWidth = 1;

                ctx.beginPath();

                ctx.lineTo(-width, 0);
                ctx.lineTo(width, 0);

                ctx.stroke();
                ctx.restore();


                ctx.save();
                ctx.strokeStyle = ph_style;
                ctx.lineWidth = 3;

                ctx.beginPath();

                for (let i = -n / 2; i < n * 1.5; i++) {

                    let t = i / n;
                    let tt = (t + 1) % 1;
                    let y = 0;

                    for (let k = 0; k < step; k++)
                        y += functions[k](tt);

                    y += add_progress * functions[step](tt);

                    let x = t * width * waveform_width_factor;
                    ctx.lineTo(x, y * amplitude);
                }

                ctx.stroke();

                ctx.restore();

                if (mode === "waveform_addition1" || mode === "waveform_addition2") {


                    ctx.globalAlpha = (1 - new_line_progress) * func_progress;

                    ctx.save();

                    ctx.strokeStyle = "#aaa";
                    ctx.lineWidth = 1;

                    ctx.beginPath();

                    ctx.lineTo(-width, offset * amplitude);
                    ctx.lineTo(width, offset * amplitude);

                    ctx.stroke();

                    ctx.restore();
                    ctx.strokeStyle = "#6188A9";
                    ctx.lineWidth = 3;

                    ctx.beginPath();

                    for (let i = -n / 2; i < n * 1.5; i++) {

                        let t = i / n;
                        let tt = (t + 1) % 1;

                        let base = 0;
                        for (let k = 0; k < step; k++)
                            base += functions[k](tt);

                        let y = min(base, offset) + functions[step](tt);

                        let x = t * width * waveform_width_factor;
                        ctx.lineTo(x, (y * amplitude));
                    }

                    ctx.stroke();


                    ctx.lineWidth = 2;


                    ctx.globalAlpha = arrow_progress * (1 - fin_progress);

                    let nn = ceil(width / 16) * 2;
                    for (let i = -nn / 2; i < nn * 1.5; i++) {

                        let t = i / nn;
                        let tt = (t + 1) % 1;

                        let base = 0;
                        for (let k = 0; k < step; k++)
                            base += functions[k](tt);

                        let start = min(base, offset);
                        let y = start + functions[step](tt);

                        let sign = (y < start ? -1 : 1);

                        if (amplitudes[step] < 0.01)
                            ctx.strokeStyle = ctx.fillStyle = "#777";
                        else if (y < start)
                            ctx.strokeStyle = ctx.fillStyle = "#49AD22";
                        else
                            ctx.strokeStyle = ctx.fillStyle = "#D01E04";

                        let x = t * width * waveform_width_factor;

                        ctx.fillEllipse(x, start * amplitude, 1.5);

                        let sc = min(1, abs(y - start) * amplitude / 7);


                        ctx.strokeLine(x, start * amplitude, x, y * amplitude - 7 * sign * sc);

                        ctx.beginPath();
                        ctx.lineTo(x, y * amplitude);
                        ctx.lineTo(x - 2.5 * sc, y * amplitude - 7 * sign * sc);
                        ctx.lineTo(x + 2.5 * sc, y * amplitude - 7 * sign * sc);
                        ctx.fill();
                    }
                }

                ctx.globalAlpha = 1;




                let w1 = width * waveform_width_factor;

                ctx.globalCompositeOperation = "destination-out";
                ctx.fillStyle = "rgba(0,0,0,0.7)"

                ctx.fillRect(-width, -height, width, height * 2);
                ctx.fillRect(width * waveform_width_factor, -height, width, height * 2);

                ctx.globalCompositeOperation = "source-over";

                ctx.lineWidth = 1;
                ctx.strokeStyle = "#aaa";

                ctx.strokeLine(0, -amplitude, 0, amplitude);
                ctx.strokeLine(w1, -amplitude, w1, amplitude);


                if (mode === "waveform_addition1" || mode === "waveform_addition2") {

                    ctx.strokeStyle = ctx.fillStyle = "#EDBA38";
                    ctx.lineWidth = 3;
                    ctx.globalAlpha = amplitude_progress;

                    ctx.strokeLine(0, (offset - amplitudes[step]) * amplitude,
                        0, (offset + amplitudes[step]) * amplitude);

                    ctx.strokeLine(w1, (offset - amplitudes[step]) * amplitude,
                        w1, (offset + amplitudes[step]) * amplitude);

                    ctx.globalCompositeOperation = "destination-over";
                    ctx.globalAlpha *= 0.2;

                    ctx.fillRect(0, (offset - amplitudes[step]) * amplitude,
                        w1, 2 * amplitudes[step] * amplitude);


                    ctx.globalCompositeOperation = "source-over";
                    ctx.globalAlpha = 1;

                }


                ctx.feather(canvas.width, canvas.height * 0.8,
                    canvas.height * 0.1, canvas.height * 0.1, 0, 0);

                ctx.translate(-(1 - waveform_width_factor) * 0.5 * width, 0);

                let plot_pad = ceil(width * 0.03);
                let side_pad = ceil(width > 500 ? width * 0.15 : width * 0.06);
                let plot_inset = 4;

                if (mode === "waveform_addition3" || mode === "waveform_addition4") {
                    plot_pad = 0;
                }

                let plot_width = ((width - side_pad * 2) / n_f);
                ctx.translate(side_pad + plot_pad / 2, height * 0.4 - 4);

                ctx.fillStyle = ph_style;
                ctx.globalAlpha = 0.1;
                ctx.fillRect(-plot_pad * 0.5, -height * 0.2, plot_width * step, height);

                ctx.fillStyle = ph_style;
                ctx.globalAlpha = 0.15 * func_progress - 0.05 * fin_progress;
                ctx.fillRect(-plot_pad * 0.5 + plot_width * step, -height * 0.2, plot_width, height);

                ctx.globalAlpha = 1;

                let ww = plot_width - plot_pad;

                let fs = font_size * 0.7;
                if (width < 500)
                    fs -= 1;

                ctx.font = ceil(fs) + "px IBM Plex Sans";

                if (mode === "waveform_addition1" || mode === "waveform_addition2") {
                    for (let i = 0; i < n_f; i++) {

                        ctx.save();
                        ctx.fillStyle = "#EDBA38"

                        let h = amplitudes[i] * height * 0.1;
                        ctx.fillRect(4, -h - 10, ww - 4 * 2, h);

                        ctx.lineWidth = 1;
                        ctx.strokeStyle = "#888";
                        ctx.strokeLine(0, -10, ww, -10);

                        ctx.lineWidth = 2;
                        ctx.strokeStyle = ph_style;

                        ctx.beginPath();

                        let n = ceil(width / n_f * 0.5);
                        for (let k = 0; k <= n; k++) {

                            let t = k / n;
                            let y = functions[i](t) / amplitudes[i];

                            let x = 0.2 * ww + 0.6 * t * ww;
                            ctx.lineTo(x, y * height * 0.015 + font_size * 0.1);
                        }
                        ctx.stroke();
                        ctx.fillStyle = "#333";
                        ctx.fillText(frequencies[i] + " Hz", ww / 2, font_size * 1.1);

                        ctx.restore();
                        ctx.translate(plot_width, 0);

                    }
                } else {

                    ctx.lineWidth = 1;
                    ctx.strokeStyle = "#888";
                    ctx.strokeLine(0, -10, plot_width * n_f, -10);

                    for (let i = 0; i < n_f; i++) {
                        ctx.fillStyle = "#EDBA38"

                        let h = -amplitudes[i] * height * 0.2;
                        ctx.fillRect(0, -h - 10, ww, h);

                        if (i % 10 == 0) {
                            ctx.fillStyle = "#333";
                            ctx.strokeLine(ww / 2, -10, ww / 2, -8);
                            ctx.fillText(frequencies[i] + " Hz", ww / 2, height * 0.03);
                        }

                        ctx.translate(plot_width, 0);
                    }
                }

            } else if (mode === "triangle_shape") {


                ctx.translate(width * 0.5, height * 0.5);
                let f = arg0 * 4 + 0.5;
                let a = arg1;
                let p = arg2;



                let n = 20;

                let dx = width * 0.2;

                let yy = a * (height * 0.5 - 5);

                ctx.lineWidth = 1;
                ctx.strokeStyle = "rgba(0,0,0,0.3)"
                ctx.strokeLine(-width, 0, width, 0);

                ctx.setLineDash([3, 4]);

                ctx.strokeStyle = f_style;

                ctx.strokeLine(-width, +yy, width, +yy);
                ctx.strokeLine(-width, -yy, width, -yy);


                ctx.strokeStyle = a_style;

                for (let i = -7; i < 7; i++) {
                    ctx.strokeLine(dx * (1 + i * 2) / f, -yy, dx * (1 + i * 2) / f, yy);
                }

                ctx.setLineDash([]);

                ctx.lineWidth = 5;
                ctx.strokeStyle = ph_style;

                ctx.beginPath();
                for (let i = -n; i < n; i++) {
                    let y = a * ((i & 1) * 2 - 1);
                    let x = (i - 0.5 - p * 2) / f;

                    ctx.lineTo(x * dx, y * (height * 0.5 - 5));
                }

                ctx.stroke();

                let x0 = -dx / f;
                let x1 = dx / f;

                ctx.globalCompositeOperation = "destination-out";
                ctx.fillStyle = "rgba(0,0,0,0.7)"

                ctx.fillRect(-width, -height, width + x0, height * 2);
                ctx.fillRect(x1, -height, width, height * 2);

                ctx.globalCompositeOperation = "destination-over";
                ctx.lineWidth = 3;

                ctx.strokeStyle = a_style;

                for (let i = -1; i < 1; i++) {
                    ctx.strokeLine(dx * (1 + i * 2) / f, -yy, dx * (1 + i * 2) / f, yy);
                }

                ctx.strokeStyle = f_style;

                ctx.strokeLine(x0, +yy, x1, +yy);
                ctx.strokeLine(x0, -yy, x1, -yy);



                ctx.feather(canvas.width, canvas.height,
                    canvas.height * 0.2, canvas.height * 0.2, 0, 0);


            } else if (mode === "pulse_sphere") {

                let f = arg0 * 10;

                if (state === undefined) {
                    state = {
                        angle: 0,
                    }
                }

                self.set_paused(f === 0);

                state.angle += dt * f * 2 * pi;
                state.angle = state.angle % (2 * pi);

                let r = (0.9 + 0.02 * Math.sin(state.angle)) * width * 0.5;

                ctx.translate(width * 0.5, height * 0.5);

                let grd = ctx.createRadialGradient(0, 0, 0, 0, 0, r);

                let n = 20;

                for (let i = 0; i <= n; i++) {
                    let t = i / n;
                    let a = t * pi * 0.5;
                    let c = cos(a);
                    let dim = lerp(1.0, sqrt(c), 0.4);
                    let color = [180 / 255, 180 / 255, 180 / 255, 1 / dim];
                    grd.addColorStop(t, rgba_color_string(vec_scale(color, dim)));

                }

                ctx.lineWidth = 2;

                ctx.fillStyle = grd;
                ctx.strokeStyle = "#333";
                ctx.fillEllipse(0, 0, r);
                ctx.strokeEllipse(0, 0, r);

            } else if (mode === "pulse_piston") {

                let f = arg0 * 10;

                if (state === undefined) {
                    state = {
                        angle: 0,
                    }
                }

                state.angle += dt * f * 2 * pi;
                state.angle = state.angle % (2 * pi);

                self.set_paused(f === 0);

                let h = (1.0 + sin(state.angle)) * 0.02;

                ctx.translate(width / 2, height / 2);

                let mvp = mat4_mul(vp, scale_mat4(1.15));


                let sc = 0.3;
                let offset = 1.55;

                let circle_n = 100;

                function draw_piston(r, h, z) {

                    let all_points = [];

                    for (let i = 0; i < circle_n; i++) {
                        let a = 2 * pi * i / circle_n;
                        let x = r * cos(a);
                        let y = r * sin(a);

                        let p = project(mat4_mul_vec3(mvp, [x, y, z]));

                        all_points.push(p);

                        p = project(mat4_mul_vec3(mvp, [x, y, z - h]));

                        all_points.push(p);
                    }

                    ctx.beginPath();
                    convex_hull(all_points.slice()).forEach(p => {
                        ctx.lineTo(p[0], p[1]);
                    });
                    ctx.fill();
                    ctx.stroke();

                    let p0 = mat4_mul_vec4(mat4_invert(mvp), [0, 0, -1, 0]);
                    p0[2] /= p0[3];

                    if (p0[2] - z > 0) {
                        ctx.beginPath();
                        for (let i = 0; i < circle_n; i++)
                            ctx.lineTo(all_points[i * 2][0], all_points[i * 2][1]);
                        ctx.closePath();
                        ctx.stroke();
                    } else if (p0[2] - z + h < 0) {

                        ctx.beginPath();
                        for (let i = 0; i < circle_n; i++)
                            ctx.lineTo(all_points[i * 2 + 1][0], all_points[i * 2 + 1][1]);
                        ctx.closePath();
                        ctx.stroke();
                    }
                }

                function draw_wall(s, h, z) {
                    let ps = [
                        [s, s, z],
                        [s, -s, z],
                        [-s, -s, z],
                        [-s, s, z],
                        [s, s, z - h],
                        [s, -s, z - h],
                        [-s, -s, z - h],
                        [-s, s, z - h]
                    ];

                    ps = ps.map(p => project(mat4_mul_vec3(mvp, p)));

                    function draw_quad(a, b, c, d) {
                        ctx.beginPath();
                        ctx.lineTo(a[0], a[1]);
                        ctx.lineTo(b[0], b[1]);
                        ctx.lineTo(c[0], c[1]);
                        ctx.lineTo(d[0], d[1]);
                        ctx.closePath();
                        ctx.fill();
                        ctx.stroke();
                    }

                    let p0 = mat4_mul_vec4(mat4_invert(mvp), [0, 0, -1, 0]);
                    p0[0] /= p0[3];
                    p0[1] /= p0[3];
                    p0[2] /= p0[3];


                    if (p0[2] - z > 0) {
                        draw_quad(ps[0], ps[1], ps[2], ps[3]);
                    }
                    if (p0[2] - z + h < 0) {
                        draw_quad(ps[4], ps[5], ps[6], ps[7]);
                    }
                    if (p0[0] - s > 0) {
                        draw_quad(ps[0], ps[1], ps[5], ps[4]);
                    }
                    if (p0[0] + s < 0) {
                        draw_quad(ps[2], ps[3], ps[7], ps[6]);
                    }
                    if (p0[1] - s > 0) {
                        draw_quad(ps[3], ps[0], ps[4], ps[7]);
                    }
                    if (p0[1] + s < 0) {
                        draw_quad(ps[1], ps[2], ps[6], ps[5]);
                    }
                }

                ctx.lineWidth = 2;

                if (rot[8] > 0) {
                    ctx.fillStyle = "#ddd";
                    ctx.strokeStyle = "#555";
                    draw_wall(1.1, 0.2, 0.0);


                    ctx.fillStyle = "#999";
                    ctx.strokeStyle = "#555";
                    draw_piston(0.15, h, h);


                } else {
                    ctx.fillStyle = "#999";
                    ctx.strokeStyle = "#555";
                    draw_piston(0.15, h, h);

                    ctx.fillStyle = "#ddd";
                    ctx.strokeStyle = "#555";
                    draw_wall(1.1, 0.2, 0.0);
                }

                ctx.fillStyle = "rgba(0,0,0,0.04)"


                let all_points = [];

                for (let i = 0; i < circle_n; i++) {
                    let a = 2 * pi * i / circle_n;
                    let x = cos(a);
                    let y = sin(a);


                    let p = project(mat4_mul_vec3(mvp, [x, y, -offset - 0.25]));

                    all_points.push(p);

                    p = project(mat4_mul_vec3(mvp, [x, y, 1.8]));

                    all_points.push(p);
                }



            } else if (mode === "analyser") {

                if (microphone_source) {

                    this.set_paused(false);
                    let data = microphone_source.data();

                    let n = data.length;

                    let pad = font_size;

                    let ww = (width - pad * 2);
                    let bar_width = 3;
                    let n_bars = floor(ww / bar_width);

                    let bar_samples = floor(n / n_bars);
                    let bottom_height = font_size;

                    ctx.translate(pad + ceil((ww - n_bars * bar_width) * 0.5), height - bottom_height);

                    ctx.lineWidth = 2.5;
                    ctx.strokeStyle = "#EDBA38";


                    for (let i = 0; i < n_bars; i++) {

                        let s = 0;
                        for (let l = 0; l < bar_samples; l++) {

                            let sample = data[i * bar_samples + l];
                            sample = clamp(sample, -100, -20);
                            sample /= 20.0;

                            sample += 2.0;
                            s += Math.pow(10, sample);
                        }

                        s /= bar_samples;

                        ctx.strokeLine(i * bar_width, 0, i * bar_width, -s * height);
                    }

                    ctx.lineWidth = 1.5;
                    ctx.strokeStyle = "#666";
                    ctx.fillStyle = "#333";
                    ctx.strokeLine(0, 0, width - pad * 2, 0);
                    ctx.font = ceil(font_size * 0.7) + "px IBM Plex Sans";

                    let fstep = 500;
                    let nf = microphone_source.frequency(bar_samples * n_bars) / fstep;

                    let tt = 1;

                    if (width < 600)
                        tt = 2;

                    for (let i = 0; i < nf; i += tt) {
                        let x = (ww * i / nf);

                        ctx.strokeLine(x, 0, x, 5);
                        ctx.fillText((i * fstep) + " Hz", x, font_size * 0.7 + 5)
                    }
                } else {
                    this.set_paused(true);

                    ctx.translate(width * 0.5, height * 0.5);
                    ctx.font = ceil(font_size * 1.5) + "px IBM Plex Sans";

                    let w = width * 0.01;

                    ctx.fillStyle = "#444";
                    ctx.fillText("Press to start recording", 0, 0);
                    ctx.fillStyle = "#bbb";
                    ctx.arrow(0, font_size * 1.5, 0, height * 0.5 - 1, w, w * 3, w * 4);
                    ctx.fill();


                }


            } else if (mode === "waveform_circle") {


                let f = arg0 * 1.9 + 0.1;
                let a = arg1 * 0.7 + 0.3;
                let p = arg2 * 2 * pi;

                let r = a * (height * 0.5 - 14);

                if (state === undefined) {
                    state = {
                        angle: p,
                        phase: p,
                    }
                }

                if (state.phase != p) {
                    state.angle -= state.phase;
                    state.angle += p;
                    state.phase = p;
                }

                state.angle += dt * f * 2 * pi;
                state.angle = state.angle % (2 * pi);

                ctx.translate(height * 0.5, height * 0.5);

                ctx.save();


                ctx.fillStyle = "#E5E2E2";
                ctx.strokeStyle = "#888";
                ctx.fillEllipse(0, 0, r);
                ctx.stroke();


                ctx.rotate(state.angle);

                ctx.save();
                ctx.rotate(0);


                ctx.strokeStyle = "6695AB";
                ctx.fillStyle = f_style;

                let ss = width / 600;
                ctx.lineWidth = 10 * ss;


                ctx.beginPath();
                ctx.arc(0, 0, r * 0.5, -f * 1.5, 0);
                ctx.stroke();

                ctx.lineWidth = 1;


                ctx.beginPath();
                ctx.lineTo(r * 0.5, 18 * ss);
                ctx.lineTo(r * 0.5 - 12 * ss, 0);
                ctx.lineTo(r * 0.5 + 12 * ss, 0);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();

                ctx.lineWidth = 10 * ss - 2;

                ctx.strokeStyle = f_style;
                ctx.beginPath();
                ctx.arc(0, 0, r * 0.5, -f * 1.5, 0);
                ctx.stroke();

                ctx.restore();


                ctx.lineWidth = 6;

                ctx.strokeStyle = "#A07304";
                ctx.strokeLine(0, 0, 0, -r);

                ctx.lineWidth = 4;
                ctx.strokeStyle = a_style;
                ctx.strokeLine(0, 0, 0, -r);

                ctx.fillStyle = "#333";
                ctx.fillEllipse(0, 0, 2);


                ctx.fillStyle = base_plot_style;
                ctx.fillEllipse(0, -r, 3);

                ctx.restore();

                ctx.lineWidth = 4;
                ctx.lineCap = "butt";
                ctx.strokeStyle = ph_style;
                ctx.beginPath();
                ctx.arc(0, 0, r + 8, 0 + pi, p + pi);
                ctx.stroke();


                ctx.lineWidth = 1;

                ctx.strokeStyle = "#bbb";
                ctx.strokeLine(height * 0.5, 0, width, 0);

                ctx.strokeStyle = "#ddd";
                ctx.strokeLine(height * 0.5, -height, height * 0.5, height);

                ctx.lineWidth = 2;

                ctx.strokeStyle = base_plot_style;
                ctx.globalAlpha = 0.3;
                ctx.strokeLine(r * sin(state.angle), -r * cos(state.angle), height * 0.5, -r * cos(state.angle));
                ctx.globalAlpha = 1;

                ctx.translate(height * 0.5, 0);



                ctx.lineWidth = 4;

                ctx.beginPath();


                let n = ceil(width / 2);
                for (let i = 0; i < n; i++) {


                    let x = width * i / n;
                    let fi = 0.05 * x * f;
                    let y = -cos(-state.angle + fi) * r;
                    ctx.lineTo(x, y);
                }

                ctx.stroke();


                ctx.feather(canvas.width, canvas.height,
                    canvas.height * 0.0, canvas.height * 0.2,
                    canvas.height * 0.0, canvas.height * 0.0);


            } else if (mode === "frequency_shape" || mode === "frequency_shape2") {

                if (state === undefined) {
                    state = { a: 0 };
                }

                let downsample_scale = 3;

                let f = 0.2 + arg0 * 5.8;

                let c = 0.4;
                let w = f * 2.0 * pi;
                let k = w / c;

                let a = 0.15;


                state.a += dt * w;

                gl.begin(width / downsample_scale, height / downsample_scale);

                gl.draw_full("shape", [
                    [-1.4, 0],
                    [k, -state.a]
                ]);

                ctx.save();
                if (mode === "frequency_shape") {
                    ctx.drawImage(gl.finish(), 0, 0, width, height);
                    ctx.translate(width * 0.5 - height * 1.4 * 0.5, height * 0.5);
                } else {
                    ctx.drawImage(gl.finish(), 0, -height / 4, width, height);
                    ctx.translate(width * 0.5 - height * 1.4 * 0.5, height * 0.5 - height / 4);
                }


                let x = (1 + Math.sin(state.a)) * width * 0.003;

                ctx.fillStyle = "#999";
                ctx.strokeStyle = "#555";
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.rect(x - width, -a * (height * 0.5), width, 2 * a * (height * 0.5));
                ctx.fill();
                ctx.stroke();

                ctx.lineWidth = 2;
                ctx.fillStyle = "#ddd";
                ctx.strokeStyle = "#555";
                ctx.fillRect(-width, -height / 2, width, height);
                ctx.strokeLine(0, -height / 2, 0, height / 2);






                if (mode === "frequency_shape") {
                    ctx.restore();

                    ctx.feather(canvas.width, canvas.height,
                        canvas.height * 0.15, canvas.height * 0.15,
                        canvas.height * 0.15, canvas.height * 0.15);
                } else {
                    ctx.feather(canvas.width, canvas.height * 0.5,
                        canvas.height * 0.15, canvas.height * 0.15,
                        canvas.height * 0.15, canvas.height * 0.15);

                    function f(x) {
                        let a = 0.0;

                        const n = 48;

                        const m = 2.39996323;
                        const rr = 0.02165063509;

                        let fi = 1.0;
                        for (let i = 0; i < n; i++) {
                            let pr = rr * sqrt(fi);
                            let theta = m * fi;
                            fi += 1.0;

                            let px = cos(theta) * pr;
                            let py = sin(theta) * pr;

                            let pp = [-1.4, px, py];
                            let p = [x, 0.0, 0];

                            let d = vec_len(vec_sub(p, pp));

                            let s = 1.0 / (0.7 + d);

                            a += s * sin(k * d - state.a);
                        }

                        a *= -0.8 / n;
                        return a;
                    }

                    ctx.strokeStyle = "rgba(0,0,0,0.2)";

                    ctx.lineWidth = 2;
                    ctx.setLineDash([3, 5]);

                    ctx.strokeLine(0, 0, width, 0);

                    ctx.restore();

                    ctx.save();
                    ctx.translate(0, height * 0.25);


                    apply_world_space_transform();

                    ctx.strokeStyle = "rgba(255, 255, 255, 1.0)";
                    ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
                    ctx.lineWidth = 2 / ctx_scale;

                    ctx.beginPath();


                    let n = ceil(width / 1);
                    for (let i = 0; i < n; i++) {

                        let t = i / n;

                        let x = -1.4 + 3.2 * t;
                        let y = f(x) * 0.45;


                        ctx.lineTo(x, y);
                    }
                    ctx.stroke();


                    ctx.lineTo(3, 0);
                    ctx.lineTo(-1.4, 0);

                    ctx.fill();

                    let grd = ctx.createLinearGradient(0, -0.4, 0, 0.4);
                    grd.addColorStop(0.0, "rgba(255,44,17,1)");
                    grd.addColorStop(0.5, "rgba(255,44,17,0.2)");
                    grd.addColorStop(0.5, "rgba(40,133,200,0.2)");
                    grd.addColorStop(1.0, "rgba(40,133,200,1)");

                    ctx.fillStyle = grd;
                    ctx.globalCompositeOperation = "source-in";

                    ctx.beginPath();
                    ctx.rect(-1.4, -0.5, 3.2, 1);
                    ctx.clip()
                    ctx.fill();

                    ctx.restore();

                    ctx.translate(width * 0.5 - height * 1.4 * 0.5, height * 0.5 + height / 4);


                    ctx.fillStyle = "#999";
                    ctx.strokeStyle = "#555";
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.rect(x - width, -a * (height * 0.5), width, 2 * a * (height * 0.5));
                    ctx.fill();
                    ctx.stroke();

                    ctx.lineWidth = 2;
                    ctx.fillStyle = "#ddd";
                    ctx.strokeStyle = "#555";
                    ctx.fillRect(-width, -height / 4, width, height / 2);
                    ctx.strokeLine(0, -height / 4, 0, height / 4);


                    ctx.strokeStyle = "rgba(0,0,0,0.2)";


                    ctx.lineWidth = 2;
                    ctx.setLineDash([3, 5]);

                    ctx.strokeLine(0, 0, width, 0);

                    ctx.feather(canvas.width, canvas.height * 0.5,
                        canvas.height * 0.15, canvas.height * 0.15,
                        canvas.height * 0.25, canvas.height * 0.25, 0, canvas.height * 0.5 - 2);

                    ctx.strokeStyle = "rgba(0,0,0,0.6)";
                    ctx.lineWidth = 1.5;
                    ctx.setLineDash([]);
                    ctx.strokeLine(-width / 2, -height / 4, width * 2, -height / 4);

                }
            } else if (mode === "doppler2") {

                if (draggables === undefined) {
                    draggables = [
                        [0.3, 0.1]
                    ];
                }

                let time_scale = 1;
                let p = draggables[0];

                let t = arg0 * time_scale;

                let f = 20;
                let c = 5;

                let v = arg1 * 3;
                let x = -1 + v * t;
                let y = -0.3;

                ctx.save();
                apply_world_space_transform();

                ctx.globalAlpha = 0.8;
                draw_speaker([x, y]);
                draw_ear(p);



                ctx.lineWidth = 3.0 / ctx_scale;

                const nn = 24;

                ctx.globalAlpha = 0.7;
                ctx.strokeStyle = "#C04A38";

                for (let i = 0; i < nn; i++) {

                    let lt = time_scale * i / f;

                    let x = -1 + v * lt;

                    let r = (t - lt) * c;

                    if (r < 0)
                        break;

                    ctx.strokeEllipse(x, y, r + 0.1 / ctx_scale);
                }

                ctx.globalAlpha = 1;


                ctx.restore();

                ctx.feather(canvas.width, canvas.height * 0.7,
                    canvas.height * 0.1, canvas.height * 0.1,
                    canvas.height * 0.1, canvas.height * 0.1);

                let w = width * 0.9;

                ctx.translate(w * 0.05, height * 0.8);



                ctx.strokeStyle = "#777";
                ctx.lineCap = "butt";

                ctx.lineWidth = 1;
                ctx.strokeLine(-2, 0, width, 0);

                ctx.strokeStyle = "#7CB7D9";
                ctx.lineWidth = 4;

                for (let i = 0; i <= nn; i++) {
                    let lt = time_scale * i / f;
                    let x = w * lt;
                    ctx.globalAlpha = lt <= t ? 1.0 : 0.3;

                    ctx.strokeLine(x, 0, x, height * 0.1 - 4);
                }

                ctx.translate(0, height * 0.1);

                ctx.strokeStyle = "#C5B118";

                for (let i = 0; i <= nn; i++) {

                    let lt = time_scale * i / f;

                    let lx = -1 + v * lt;
                    let d = vec_len(vec_sub(p, [lx, y]));
                    lt += d / c;
                    let x = w * lt;


                    ctx.globalAlpha = lt <= t ? 1.0 : 0.3;
                    ctx.strokeLine(x, 0, x, height * 0.1 - 4);
                }

                ctx.translate(0, -height * 0.1);

                ctx.globalAlpha = 1;

                ctx.strokeStyle = ctx.fillStyle = "#44A781";
                ctx.lineWidth = 2;
                ctx.strokeLine(t * w, -3, t * w, height * 0.3);

                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.lineTo(t * w, -1);
                ctx.lineTo(t * w + 4, -8);
                ctx.lineTo(t * w - 4, -8);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();

                ctx.feather(canvas.width, canvas.height * 0.5,
                    canvas.height * 0.0, canvas.height * 0.2,
                    canvas.height * 0.0, canvas.height * 0.0,
                    0, canvas.height * 0.7 - 2);

            } else if (mode === "reflection1" || mode === "reflection2" ||
                mode === "interference1" ||
                mode === "distance" || mode === "doppler") {

                if (draggables === undefined) {

                    if (mode === "doppler") {

                        draggables = [
                            [0.2, 0.2]
                        ];
                    } else {
                        draggables = [
                            [0.3, 0.4]
                        ];
                    }
                }

                let wall_x = 1.2;

                let w = (aspect - 0.24) * 2;
                let h = (1 - 0.24) * 2;

                if (mode === "reflection2") {
                    w = 1.5 * (arg0 + 0.5);
                    h = 1.0 * (arg0 + 0.5);
                } else if (mode === "reflection1") {
                    w = wall_x * 2;
                }


                draggables[0][0] = clamp(draggables[0][0], -w * 0.5, w * 0.5);
                draggables[0][1] = clamp(draggables[0][1], -h * 0.5, h * 0.5);

                let p = draggables[0];

                const key_count = 3;

                let frequencies = [200, 400, 600];


                if (state === undefined) {
                    state = {};
                    state.keys = new Array(key_count);

                    for (let i = 0; i < key_count; i++) {
                        state.keys[i] = {};
                        state.keys[i].active = false;
                        state.keys[i].waves = [];
                        state.keys[i].nodes = [];
                    }

                    state.position = p;

                    keyboard.set_label(0, frequencies[0] + " Hz");
                    keyboard.set_label(1, frequencies[1] + " Hz");
                    keyboard.set_label(2, frequencies[2] + " Hz");
                }

                let t = audio.time();

                let ramp = 0.1;
                let decay = 0.1;

                let v = speed_of_sound;
                let f_scale = 1 / 64;

                let speaker_v = 0;


                let source_position = [0, 0];


                let reflectivity = 0.6;
                let unit_scale = 100;
                let measure_scale = 1;

                let base_gain = 0.5;

                let node_positions = [];
                let node_gains = [];
                if (mode === "distance") {
                    node_positions.push([0, 0]);
                    node_gains.push(base_gain);
                } else if (mode === "doppler") {
                    if (sim0 === undefined)
                        sim0 = 0;

                    speaker_v = arg0;


                    sim0 += dt * speaker_v;



                    /* https://mathematica.stackexchange.com/questions/38293/make-a-differentiable-smooth-sawtooth-waveform */

                    let pos = 1 - 2 * Math.acos((1 - 0.05) * sin(sim0)) / pi;


                    node_positions.push([pos, 0]);
                    node_gains.push(base_gain);
                } else if (mode === "reflection1") {
                    node_positions.push([0, 0]);
                    node_positions.push([wall_x * 2, 0]);
                    node_gains.push(base_gain);
                    node_gains.push(reflectivity);
                } else if (mode === "reflection2") {

                    const nn = 3;

                    for (let i = -nn; i <= nn; i++) {
                        for (let j = -nn; j <= nn; j++) {

                            let pp = [i * w, j * h];
                            node_positions.push(pp);
                            node_gains.push(0.2 * Math.pow(reflectivity, abs(i) + abs(j)));
                        }
                    }
                } else if (mode === "interference1") {

                    unit_scale = 5;
                    measure_scale = 1 / 5;

                    node_positions.push([-1 / unit_scale, 0]);
                    node_positions.push([+1 / unit_scale, 0]);
                    node_gains.push(0.1);
                    node_gains.push(0.1);
                    f_scale = 1;
                    let scale = 0.01;
                }
                keys.forEach((value, i) => {

                    let key = state.keys[i];


                    if (key.nodes.length && (state.position[0] != p[0] || state.position[1] != p[1] ||
                            speaker_v != 0)) {

                        node_positions.forEach((node_p, k) => {
                            let d = vec_len(vec_sub(p, node_p)) * unit_scale;
                            let t = d / speed_of_sound;

                            let gain = distance_amplitude(d) * node_gains[k];

                            key.nodes[k].set_gain(gain, 0.05);
                            key.nodes[k].set_delay(t, 0.05);
                        });
                    }


                    if (value) {
                        if (!key.active) {
                            node_positions.forEach((node_p, k) => {
                                let d = vec_len(vec_sub(p, node_p)) * unit_scale;
                                let lt = d / speed_of_sound;

                                let gain = distance_amplitude(d) * node_gains[k];
                                let node = audio.play_oscillator(t + 0.02, frequencies[i], "sine", 0, lt);
                                node.set_gain(gain, 0.05);
                                node.set_delay(lt, 0.05);
                                key.nodes.push(node);
                            })

                            key.waves.unshift([t, Infinity]);
                            key.active = true;
                        }
                    } else if (key.active) {

                        key.nodes.forEach(node => {
                            node.set_gain(0, decay);
                            node.stop(decay);
                        });
                        key.nodes = [];
                        key.waves[0][1] = t;
                        key.active = false;
                    }
                });

                state.position = p;


                let samples = new Uint8Array(history_texture_size);

                function sample_wave(d, t0, t1, f) {

                    f *= f_scale;
                    let lambda = v / f;

                    let w0 = 2 * pi * f;
                    let k0 = 2 * pi / lambda;


                    let t_local = t - d / v;
                    let a = 0;
                    a += sharp_step(t0, t0 + ramp, t_local);

                    if (t1 != Infinity)
                        a -= sharp_step(t1, t1 + decay, t_local);

                    a *= distance_amplitude(d);
                    a *= sin((t - t0) * w0 - k0 * d);

                    return a;
                }

                const history_range = mode === "reflection2" ? 9 : 4;
                const sample_distance = history_range / history_texture_size;

                state.keys.forEach(key => {
                    let last_i = -1;

                    key.waves.forEach((wave, i) => {
                        if (t <= wave[1] + decay + history_range)
                            last_i = i;
                    })

                    key.waves.splice(last_i + 1, key.waves.length - last_i);
                })

                for (let i = 0; i < history_texture_size; i++) {

                    let distance = i * sample_distance * unit_scale;
                    let sample = 0;

                    state.keys.forEach((key, w) => {
                        let frequency = frequencies[w];
                        key.waves.forEach((wave, i) => {
                            sample += sample_wave(distance, wave[0], wave[1], frequency);
                        })
                    })

                    samples[i] = encode_amplitude(sample);
                }

                if (state.keys.every(key => {
                        return key.waves.length == 0;
                    }) && (mode !== "doppler" || speaker_v === 0)) {
                    self.set_paused(true);
                } else {
                    self.set_paused(false);
                }

                let downsample_scale = 2.5;

                gl.begin(width / downsample_scale, height / downsample_scale);
                gl.update_history_texture(samples);
                if (mode === "distance") {

                    gl.draw_full("radial", [node_positions[0],
                        [1 / history_range, 0]
                    ]);

                } else if (mode === "reflection1") {
                    gl.draw_full("reflected", [node_positions[0], node_positions[1],
                        [1 / history_range, 0]
                    ]);
                } else if (mode === "reflection2") {
                    gl.draw_full("reverb", [
                        [0, 0, w, h],
                        [1 / history_range, 0]
                    ]);
                } else if (mode === "interference1") {
                    gl.draw_full("two_sources", [node_positions[0], node_positions[1],
                        [1 / history_range, 0]
                    ]);
                } else if (mode === "doppler") {
                    gl.draw_full("doppler", [
                        [1 / history_range, 0, speaker_v, sim0]
                    ]);
                }

                ctx.drawImage(gl.finish(), 0, 0, width, height);

                ctx.save();


                apply_world_space_transform();

                if (mode === "distance") {

                    draw_speaker([0, 0]);

                } else if (mode === "doppler") {

                    draw_speaker(node_positions[0]);


                } else if (mode === "reflection1") {


                    ctx.fillStyle = "#ccc";
                    ctx.strokeStyle = "#555";
                    ctx.lineWidth = 2 / ctx_scale;
                    ctx.beginPath();
                    ctx.rect(wall_x, -2, 2, 4);
                    ctx.fill();
                    ctx.stroke();


                    draw_speaker([0, 0]);

                } else if (mode === "reflection2") {
                    ctx.globalCompositeOperation = "destination-in";

                    ctx.fillRect(-w * 0.5, -h * 0.5, w, h);

                    ctx.globalCompositeOperation = "source-over";


                    ctx.lineJoin = "miter";

                    let ww = height * 0.03 / ctx_scale;

                    ctx.strokeStyle = "#555";
                    ctx.lineWidth = ww;
                    ctx.strokeRect(-w * 0.5 - ww * 0.5, -h * 0.5 - ww * 0.5, w + ww, h + ww);
                    ctx.strokeStyle = "#ccc";

                    ctx.lineWidth = ww - 4.0 / ctx_scale;
                    ctx.strokeRect(-w * 0.5 - ww * 0.5, -h * 0.5 - ww * 0.5, w + ww, h + ww);

                    draw_speaker([0, 0]);

                } else if (mode === "interference1") {
                    draw_speaker(node_positions[0]);
                    draw_speaker(node_positions[1]);

                }

                draw_ear(p);
                ctx.restore();


                if (mode !== "reflection2") {
                    ctx.feather(canvas.width, canvas.height,
                        canvas.height * 0.2, canvas.height * 0.2,
                        canvas.height * 0.2, canvas.height * 0.2);
                }


                let distance = unit_scale * measure_scale;
                let hundred = ctx_scale * measure_scale * (metric ? 1 : 0.9144);

                ctx.strokeStyle = ctx.fillStyle = "#555";

                ctx.lineWidth = 1.5;
                ctx.translate(15, height - 20);
                ctx.strokeLine(0, 0, hundred, 0);
                ctx.strokeLine(0, -5, 0, 5);
                ctx.strokeLine(hundred, -5, hundred, 5);

                ctx.font = ceil(font_size * 0.8) + "px IBM Plex Sans";


                if (metric)
                    ctx.fillText(distance + " m", hundred / 2, -font_size * 0.5);
                else
                    ctx.fillText(distance * 3 + " ft", hundred / 2, -font_size * 0.5);

            }


            /* Helpers */

            function convex_hull(points) {
                if (points.length < 4)
                    return points;

                points = points.sort(function(a, b) { return a[0] - b[0]; });

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


            function initialize_particles() {

                sim0 = new Float32Array(particles_count * 4);
                sim1 = new Float32Array(particles_count * 3);

                for (let i = 0; i < particles_count; i++) {

                    sim0[i * 4 + 0] = Math.random() * 2 - 1;
                    sim0[i * 4 + 1] = Math.random() * 2 - 1;
                    sim0[i * 4 + 2] = Math.random() * 2 - 1;

                    sim1[i * 3 + 0] = Math.random() * 2 - 1;
                    sim1[i * 3 + 1] = Math.random() * 2 - 1;
                    sim1[i * 3 + 2] = Math.random() * 2 - 1;

                }
            }

            function simulate_particles(dt, collide, wx = 1, particle_start = 0.0) {

                const limit = particle_r * particle_r * 4.0;

                let collisions = [];

                /* Clear the bin counters. */

                for (let bin_index = 0; bin_index < bin_n_3; bin_index++) {
                    bin_counts[bin_index] = 0;
                }

                const one_minus_eps = 0.99999994;
                const wx_minus_eps = wx * one_minus_eps;

                for (let i = 0; i < particles_count; i++) {

                    /* Forward positions and bounce off walls. */

                    sim0[i * 4 + 0] += sim1[i * 3 + 0] * dt;
                    sim0[i * 4 + 1] += sim1[i * 3 + 1] * dt;
                    sim0[i * 4 + 2] += sim1[i * 3 + 2] * dt;
                    sim0[i * 4 + 3] = max(0, sim0[i * 4 + 3] - dt * 8.0);

                    if (collide) {
                        if (abs(sim0[i * 4 + 0]) >= wx) {
                            sim0[i * 4 + 0] = sim0[i * 4 + 0] < 0 ? -wx_minus_eps : wx_minus_eps;

                            if (sim0[i * 4 + 0] > 0 == sim1[i * 3 + 0] > 0) {
                                sim1[i * 3 + 0] *= -1;
                                sim0[i * 4 + 0] += sim1[i * 3 + 0] * dt;
                                collisions.push([sim0[i * 4 + 1], sim0[i * 4 + 2], sim0[i * 4 + 0] < 0 ? -1 : 1, 1, i]);
                                sim0[i * 4 + 3] = particle_start;
                            }
                        }

                        if (abs(sim0[i * 4 + 1]) >= 1) {
                            sim1[i * 3 + 1] *= -1;
                            sim0[i * 4 + 1] = sim0[i * 4 + 1] < 0 ? -one_minus_eps : one_minus_eps;
                            collisions.push([sim0[i * 4 + 0], sim0[i * 4 + 2], sim0[i * 4 + 1] < 0 ? -2 : 2, 1, i]);
                            sim0[i * 4 + 3] = particle_start;
                        }
                        if (abs(sim0[i * 4 + 2]) >= 1) {
                            sim1[i * 3 + 2] *= -1;
                            sim0[i * 4 + 2] = sim0[i * 4 + 2] < 0 ? -one_minus_eps : one_minus_eps;
                            collisions.push([sim0[i * 4 + 0], sim0[i * 4 + 1], sim0[i * 4 + 2] < 0 ? -3 : 3, 1, i]);
                            sim0[i * 4 + 3] = particle_start;
                        }
                    } else {
                        if (abs(sim0[i * 4 + 0]) >= 1) {
                            sim0[i * 4 + 0] += sim0[i * 4 + 0] < 0 ? 2 : -2;
                        }
                        if (abs(sim0[i * 4 + 1]) >= 1) {
                            sim0[i * 4 + 1] += sim0[i * 4 + 1] < 0 ? 2 : -2;
                        }
                        if (abs(sim0[i * 4 + 2]) >= 1) {
                            sim0[i * 4 + 2] += sim0[i * 4 + 2] < 0 ? 2 : -2;
                        }
                    }


                    /* Bin. */

                    let ix = ((sim0[i * 4 + 0] + 1.0) * inv_bin_dim) | 0;
                    let iy = ((sim0[i * 4 + 1] + 1.0) * inv_bin_dim) | 0;
                    let iz = ((sim0[i * 4 + 2] + 1.0) * inv_bin_dim) | 0;

                    let bin_index = ix + iy * bin_n + iz * (bin_n * bin_n);

                    if (bin_counts[bin_index] < bin_capacity) {
                        bin_indices[bin_index * bin_capacity + bin_counts[bin_index]++] = i;
                    }
                }



                for (let bin_index = 0; bin_index < bin_n_3; bin_index++) {

                    let count = bin_counts[bin_index];

                    if (count == 0)
                        continue;


                    for (let i = 0; i < count; i++) {
                        let i0 = bin_indices[bin_index * bin_capacity + i];

                        for (let j = i + 1; j < count; j++) {
                            let i1 = bin_indices[bin_index * bin_capacity + j];

                            collide_particles(i0, i1)
                        }
                    }

                    let first = true;

                    for (let zz = 0; zz <= 1; zz++) {
                        for (let yy = 0; yy <= 1; yy++) {
                            for (let xx = 0; xx <= 1; xx++) {

                                if (first) {
                                    first = false;
                                    continue;
                                }

                                let other_bin_index = bin_index + xx + yy * bin_n + zz * (bin_n * bin_n);
                                let other_count = bin_counts[other_bin_index];

                                if (other_count == 0)
                                    continue;

                                for (let i = 0; i < count; i++) {
                                    let i0 = bin_indices[bin_index * bin_capacity + i];

                                    for (let j = 0; j < other_count; j++) {
                                        let i1 = bin_indices[other_bin_index * bin_capacity + j];

                                        collide_particles(i0, i1)
                                    }
                                }
                            }
                        }
                    }
                }


                function collide_particles(i0, i1) {
                    let x0 = sim0[i0 * 4 + 0];
                    let y0 = sim0[i0 * 4 + 1];
                    let z0 = sim0[i0 * 4 + 2];

                    let x1 = sim0[i1 * 4 + 0];
                    let y1 = sim0[i1 * 4 + 1];
                    let z1 = sim0[i1 * 4 + 2];

                    let dx = x1 - x0;
                    let dy = y1 - y0;
                    let dz = z1 - z0;

                    let d_sq = dx * dx + dy * dy + dz * dz;


                    if (d_sq > limit || d_sq == 0)
                        return;

                    let vx0 = sim1[i0 * 3 + 0];
                    let vy0 = sim1[i0 * 3 + 1];
                    let vz0 = sim1[i0 * 3 + 2];
                    let vx1 = sim1[i1 * 3 + 0];
                    let vy1 = sim1[i1 * 3 + 1];
                    let vz1 = sim1[i1 * 3 + 2];

                    let v_factor = (vx0 - vx1) * (x0 - x1) + (vy0 - vy1) * (y0 - y1) + (vz0 - vz1) * (z0 - z1);
                    v_factor /= d_sq;

                    sim1[i0 * 3 + 0] += v_factor * dx;
                    sim1[i0 * 3 + 1] += v_factor * dy;
                    sim1[i0 * 3 + 2] += v_factor * dz;

                    sim1[i1 * 3 + 0] -= v_factor * dx;
                    sim1[i1 * 3 + 1] -= v_factor * dy;
                    sim1[i1 * 3 + 2] -= v_factor * dz;

                    let d = sqrt(d_sq);
                    let p_factor = (d - particle_r * 2.0) * 0.5 / d;

                    sim0[i0 * 4 + 0] += p_factor * dx;
                    sim0[i0 * 4 + 1] += p_factor * dy;
                    sim0[i0 * 4 + 2] += p_factor * dz;

                    sim0[i1 * 4 + 0] -= p_factor * dx;
                    sim0[i1 * 4 + 1] -= p_factor * dy;
                    sim0[i1 * 4 + 2] -= p_factor * dz;

                    if (!collide)
                        sim0[i0 * 4 + 3] = sim0[i1 * 4 + 3] = particle_start;
                }

                return collisions;
            }


            function draw_ear(p) {
                ctx.save();

                ctx.translate(p[0], p[1]);

                ctx.fillStyle = "#DCC61F";
                ctx.strokeStyle = "#5D5410";

                ctx.save();

                ctx.lineWidth = 2;

                ctx.scale(1 / ctx_scale, 1 / ctx_scale);
                ctx.fillEllipse(0, 0, 23);
                ctx.strokeEllipse(0, 0, 23);

                ctx.translate(-23, -23);
                ctx.save();
                ctx.translate(14.383773797363524, 9.249511718750222);
                ctx.beginPath();
                ctx.moveTo(0, 9.18340746);
                ctx.bezierCurveTo(0, 3.70125756, 4.68802065, 0, 9.4157627, 0);
                ctx.bezierCurveTo(14.1435047, 0, 18.2392883, 4.11609229, 18.2392883, 9.18340746);
                ctx.bezierCurveTo(18.2392883, 14.2507226, 15.011701, 16.0791015, 12.9826246, 18.0866746);
                ctx.bezierCurveTo(10.9535482, 20.0942477, 10.494132, 21.4266353, 10.3952521, 23.5571768);
                ctx.bezierCurveTo(10.2963721, 25.6877183, 8.91640801, 28, 6.06035007, 28);
                ctx.bezierCurveTo(3.20429213, 28, 1.71070792, 25.9031284, 1.71070792, 23.5571768);
                ctx.stroke();
                ctx.restore();

                ctx.save();
                ctx.translate(17.346900310648262, 12.37540635678845);

                ctx.beginPath();
                ctx.moveTo(12.31199, 6.05751283);
                ctx.bezierCurveTo(12.31199, 3.06123537, 10.022186, 0, 6.15547236, 0);
                ctx.bezierCurveTo(2.28875876, 0, 0, 3.3479462, 0, 6.05751283);
                ctx.bezierCurveTo(0, 7.90261645, 1.15953623, 9.51178096, 1.15953623, 11.0270178);
                ctx.stroke();
                ctx.restore();

                ctx.save();

                ctx.translate(17.346900310648543, 16.60887088592354);

                ctx.beginPath();
                ctx.moveTo(0.493082888, 12.0897891);
                ctx.bezierCurveTo(0.493082888, 13.688202, 1.28409068, 14.4354421, 2.32444828, 14.4354421);
                ctx.bezierCurveTo(3.55596088, 14.4354421, 4.32224362, 13.851997, 4.38040383, 12.501488);
                ctx.bezierCurveTo(4.43856403, 11.1509789, 4.78197522, 10.2449765, 5.44093522, 9.77639116);
                ctx.bezierCurveTo(7.26139964, 8.48186191, 8.29087069, 7.52780178, 8.29087069, 4.72938466);
                ctx.bezierCurveTo(8.29087069, 1.93096754, 5.83770119, 0, 3.55596088, 0);
                ctx.bezierCurveTo(1.70891598, 0, 0.497562745, 0.935394067, 0, 1.8240483);
                ctx.stroke();
                ctx.restore();

                ctx.restore();
                ctx.restore();
            }

            function draw_speaker(p) {

                ctx.save();

                ctx.translate(p[0], p[1]);

                ctx.fillStyle = "#7CB7D9";
                ctx.strokeStyle = "#314957";


                ctx.lineWidth = 2;

                ctx.scale(1 / ctx_scale, 1 / ctx_scale);
                ctx.fillEllipse(0, 0, 23);
                ctx.strokeEllipse(0, 0, 23);

                ctx.translate(-23, -23);


                ctx.save();
                ctx.translate(10.926229508196652, 34.5);
                ctx.scale(1, -1);
                ctx.beginPath();
                ctx.moveTo(0, 16.2131148);
                ctx.lineTo(5.6557377, 16.2131148);
                ctx.lineTo(15.0819672, 23);
                ctx.lineTo(15.0819672, 0);
                ctx.lineTo(5.6557377, 6.78688525);
                ctx.lineTo(0, 6.78688525);
                ctx.bezierCurveTo(0, 8.3579235, 0, 9.92896175, 0, 11.5);
                ctx.bezierCurveTo(0, 13.0710383, 0, 14.6420765, 0, 16.2131148);
                ctx.closePath();
                ctx.stroke();
                ctx.restore();

                ctx.save();
                ctx.beginPath();
                ctx.translate(15.549180327868726, 27.35245901639348);
                ctx.scale(1, -1);
                ctx.moveTo(1.45081967, 0.352459016);
                ctx.lineTo(1.45081967, 8.35245902);
                ctx.stroke();
                ctx.restore();

                ctx.save();
                ctx.translate(29.401639344261994, 23.31147540983602);
                ctx.scale(1, -1);
                ctx.beginPath();
                ctx.moveTo(0.18852459, 0.25);
                ctx.lineTo(6.59836066, 0.25);
                ctx.stroke();
                ctx.restore();


                ctx.save();
                ctx.translate(29.590163934425924, 29.06147540983602);
                ctx.scale(1, -1);
                ctx.beginPath();
                ctx.moveTo(0, 2);
                ctx.lineTo(5.40983607, 0);
                ctx.stroke();
                ctx.restore();


                ctx.save();
                ctx.translate(29.590163934425924, 19.06147540983602);
                ctx.scale(1, -1);
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(5.40983607, 2);

                ctx.stroke();
                ctx.restore();


                ctx.restore();
            }


            function draw_pressure_plot(values, sample_height, sample_width) {

                let samples = values.length;
                ctx.lineWidth = 4;
                ctx.beginPath();

                for (let i = 0; i < samples; i++) {
                    let y = values[i] * sample_height;
                    let x = i * sample_width;

                    ctx.lineTo(x, y);
                }

                ctx.stroke();

                ctx.save();

                let grd;
                grd = ctx.createLinearGradient(0, -sample_height - 3, 0, sample_height + 3);
                grd.addColorStop(0.0, "rgba(255,0,0,1)");
                grd.addColorStop(0.5, "rgba(200, 200, 200)");
                grd.addColorStop(1.0, "rgba(0,0,255,1)");


                ctx.globalCompositeOperation = "source-atop";

                ctx.fillStyle = grd;
                ctx.fillRect(0, -sample_height - 3, samples * sample_width, sample_height * 2 + 6);

                ctx.restore();
            }

            function draw_plate(size) {

                let h = size;
                let w = h * 0.06;
                let hh = size * 0.2;

                let grd = ctx.createLinearGradient(0, -h / 2, 0, h / 2);
                let grd2 = ctx.createLinearGradient(0, -hh / 2, 0, hh / 2);

                let n = 15;
                for (let i = 0; i <= n; i++) {
                    let t = i / n;
                    let a = t * pi;
                    let c = sqrt(abs(sin(a)));
                    let dim = lerp(1.0, c, 0.3);
                    let color = [180 / 255, 180 / 255, 180 / 255, 1 / dim];

                    grd.addColorStop(t, rgba_color_string(vec_scale(color, dim)));

                    color = [0.8, 0.8, 0.8, 1 / dim];
                    grd2.addColorStop(t, rgba_color_string(vec_scale(color, dim)));
                }

                ctx.lineWidth = 2;

                ctx.fillStyle = grd;
                ctx.strokeStyle = "#555";

                ctx.beginPath();
                ctx.rect(-w / 2, -h / 2, w, h);
                ctx.fill();
                ctx.stroke();
            }

            function draw_signal(width, height) {

                ctx.translate(-0.5 * width, 0.0);

                ctx.globalAlpha = 0.1;
                ctx.fillStyle = "#D19D41";
                ctx.fillRect(-width, -height * 0.5, width * 3, height);
                ctx.globalAlpha = 1.0;

                ctx.feather(width * 2 * scale, height * scale, 0, 0, height * 0.2, height * 0.2, 0, 0);


                ctx.strokeStyle = "rgba(0,0,0,0.15)";
                ctx.strokeLine(-width, 0, width * 2, 1);


                ctx.strokeLine(0, -height * 0.5, 0, height * 0.5);
                ctx.strokeLine(width, -height * 0.5, width, height * 0.5);


                ctx.lineWidth = 4;
                ctx.strokeStyle = ctx.fillStyle;

                ctx.beginPath();

                for (let i = 0; i < signal_samples * 3; i++) {

                    let ii = i;
                    if (ii >= signal_samples)
                        ii -= signal_samples;

                    if (ii >= signal_samples)
                        ii -= signal_samples;

                    let x = (i / signal_samples - 1) * width;
                    let y = signal[ii] * height * 0.5 * waveform_plot_height_factor;
                    ctx.lineTo(x, y);
                }
                ctx.stroke();



            }

            function square(f, t, tt) {
                let dt = 0.5 / f;

                t = t / dt % 1;

                let val = (smooth_step(0, tt * f * 2, t) - smooth_step(0.5, 0.5 + tt * f * 2, t));
                return state.flip ? (1 - val) : val;
            }


            function d_square(f, t, tt) {

                let dt = 0.5 / f;

                t = t / dt % 1;

                return -(d_smooth_step(0, tt * f * 2, t) - d_smooth_step(0.5, 0.5 + tt * f * 2, t));
            }


            function distance_amplitude(d) {
                return 1.0 / (0.3 + d * 0.05);
            }

            function encode_amplitude(a) {
                return clamp(Math.round((a + 1.0) * 127), 0, 255);
            }


            function project(p) {
                p = vec_scale(p, 1 / p[3]);
                p[0] *= width * 0.5;
                p[1] *= -height * 0.5;
                return p;
            }

            function apply_world_space_transform() {
                ctx.translate(width / 2, height / 2);
                ctx.scale(ctx_scale, ctx_scale);
            }

            function d_smooth_step(edge0, edge1, x) {
                x = sharp_step(edge0, edge1, x);
                return 6 * x * (1 - x);
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

    function KeyBoard(container, drawer_container, drawer) {

        all_keyboards.push(this);

        drawer.set_keyboard(this);

        this.container = container;
        this.drawer_container = drawer_container;

        const keyboard_letters = ["w", "e", "r"];

        let mouse_state = [0, 0, 0];
        let alpha_key_state = [0, 0, 0];

        let buttons = [];
        let labels = [];

        this.alpha_key_down = function(code) {
            let index = keyboard_letters.findIndex((e) => e == code);
            if (index >= 0) {
                alpha_key_state[index] = 1;
                this.key_down(index);
                return true;
            }
            return false;
        }

        this.alpha_key_up = function(code) {
            let index = keyboard_letters.findIndex((e) => e == code);
            if (index >= 0) {
                alpha_key_state[index] = 0;
                this.key_up(index);
                return true;
            }
            return false;
        }

        this.key_down = function(index) {
            if (alpha_key_state[index] || mouse_state[index]) {
                audio.warmup();
                buttons[index].classList.add("pressed");
                drawer.set_key(index, 1);
            }
        }


        this.key_up = function(index) {
            if (!(alpha_key_state[index] || mouse_state[index])) {
                audio.warmup();
                buttons[index].classList.remove("pressed");
                drawer.set_key(index, 0);
            }
        }

        this.set_label = function(i, string) {
            labels[i].innerHTML = string;
        }


        let self = this;

        let body = document.createElement("div");
        body.classList.add("keyboard_body");
        body.classList.add("non_selectable");
        container.appendChild(body);

        let tray = document.createElement("div");
        tray.classList.add("keyboard_tray");
        tray.classList.add("non_selectable");
        body.appendChild(tray);

        let styles = [
            "rgba(130, 195, 186, 0.3)",
            "rgba(97, 136, 169, 0.3)",
            "rgba(48, 31, 113, 0.3)",
        ];

        let label_styles = [
            "rgba(80, 151, 141, 0.7)",
            "rgba(57, 95, 128, 0.7)",
            "rgba(56, 42, 111, 0.7)",
        ]

        for (let i = 0; i < 3; i++) {
            let button = document.createElement("div");
            button.classList.add("keyboard_button");
            button.classList.add("non_selectable");
            button.style.left = `${13 + i * 74}px`;

            let button_label = document.createElement("div");
            if (!touch_size)
                button_label.innerHTML = keyboard_letters[i];
            button_label.classList.add("keyboard_button_label");
            button_label.classList.add("non_selectable");
            button_label.style.background = styles[i];
            button_label.style.color = label_styles[i];
            button.appendChild(button_label);

            let label = document.createElement("div");
            label.classList.add("keyboard_label");
            label.classList.add("non_selectable");
            label.style.left = `${13 + i * 74}px`;

            body.appendChild(button);
            body.appendChild(label);
            buttons.push(button);
            labels.push(label);

        }

        container.style.visibility = "visible";

        let last_mouse_key;


        function key_index(p) {
            let r = body.getBoundingClientRect();
            p[0] -= r.left;
            p[1] -= r.top;

            if (p[1] < 30 || p[1] > 230)
                return -1;

            if (p[0] < 0 || p[0] > 13 * 2 + 74 * 3)
                return -1;

            if (p[0] < 13 + 74)
                return 0;

            if (p[0] < 13 + 74 * 2)
                return 1;

            return 2;
        }

        function mouse_move(e) {
            let key = key_index([e.clientX, e.clientY]);

            if (key != last_mouse_key) {

                if (last_mouse_key != -1) {
                    mouse_state[last_mouse_key] = 0;
                    self.key_up(last_mouse_key);
                }

                if (key != -1) {
                    mouse_state[key] = 1;
                    self.key_down(key);
                }

                last_mouse_key = key;
            }
        }

        function mouse_up(e) {
            if (last_mouse_key != -1) {
                mouse_state[last_mouse_key] = 0;
                self.key_up(last_mouse_key);
            }

            window.removeEventListener("mousemove", mouse_move, false);
            window.removeEventListener("mouseup", mouse_up, false);
        }

        function mouse_down(e) {
            let key = key_index([e.clientX, e.clientY]);

            if (key != -1) {
                mouse_state[key] = 1;
                self.key_down(key);
            }

            last_mouse_key = key;

            window.addEventListener("mousemove", mouse_move, false);
            window.addEventListener("mouseup", mouse_up, false);

            e.preventDefault();
        }


        function resolve_touches(e) {
            let old_state = mouse_state.slice();

            for (let i = 0; i < 3; i++)
                mouse_state[i] = 0;

            for (let i = 0; i < e.touches.length; i++) {
                let key = key_index([e.touches[i].clientX, e.touches[i].clientY]);

                if (key != -1) {
                    mouse_state[key] = 1;
                }
            }

            for (let i = 0; i < 3; i++) {
                if (old_state[i] == mouse_state[i])
                    continue;

                if (old_state[i]) {
                    self.key_up(i);
                }

                if (mouse_state[i]) {
                    self.key_down(i);
                }
            }

        }

        let has_handler = false;

        function touch_move(e) {
            resolve_touches(e);
        }

        function touch_up(e) {
            resolve_touches(e);

            if (e.touches.length == 0) {
                window.removeEventListener("touchmove", touch_move, false);
                window.removeEventListener("touchend", touch_up, false);
                window.removeEventListener("touchcancel", touch_up, false);

                has_handler = false;
            }
        }

        function touch_start(e) {


            resolve_touches(e);


            if (!has_handler) {
                window.addEventListener("touchmove", touch_move, false);
                window.addEventListener("touchend", touch_up, false);
                window.addEventListener("touchcancel", touch_up, false);
                has_handler = true;
            }

            e.preventDefault();
        }


        body.addEventListener("mousedown", mouse_down, false);

        body.addEventListener("touchstart", touch_start, false);

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

        function make_drawer(name, slider_count, args, has_keyboard, has_string) {
            let ret = [];

            let drawer_container = document.getElementById(name);
            let drawer = new Drawer(drawer_container, name);
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

                if (name === "waveform_sound1" || name === "waveform_sound2") {
                    let f = function(event) {
                        audio.warmup();
                        slider.knob_div.removeEventListener(f);
                    }
                    slider.knob_div().addEventListener("mousedown", f);
                }
            }

            if (has_keyboard) {
                let container = document.getElementById(name + "_keyboard")
                new KeyBoard(container, drawer_container, drawer);
            }

            if (has_string) {
                function canvas_coordinates(e) {
                    let r = drawer.canvas.getBoundingClientRect();
                    return [(e.clientX - r.left), (e.clientY - r.top)];
                }

                new TouchHandler(drawer.canvas,
                    function(e) {
                        audio.warmup();
                        drawer.set_finger_pos(canvas_coordinates(e));
                        return true;
                    },
                    function(e) {
                        drawer.set_finger_pos(canvas_coordinates(e));
                        return true;
                    },
                    function(e) {
                        drawer.set_finger_pos(undefined);
                        return true;
                    });
            }

            return ret;
        }

        make_drawer("particles1", 1);
        make_drawer("particles2", 1);
        make_drawer("particles3", 1);
        particles4 = make_drawer("particles4", 1);
        make_drawer("particles5", 1, [0]);
        make_drawer("particles6", 1, [0]);


        make_drawer("airspring1", 1);
        make_drawer("airspring2", 1);
        make_drawer("airspring3", 1);
        make_drawer("airspring4", 1);
        make_drawer("airspring5", 1);




        make_drawer("waveform1", 0, [], true);
        make_drawer("waveform3", 0, [], true);
        make_drawer("waveform4", 0, [], true);
        make_drawer("waveform5", 0, [], true);
        make_drawer("waveform6", 0, [], true);
        make_drawer("waveform7", 0, [], true);
        make_drawer("waveform8", 0, [], true);
        make_drawer("waveform9", 0, [], true);
        make_drawer("waveform10", 0, [], true);

        make_drawer("hero", 0, [], true);

        waveform_sound1 = make_drawer("waveform_sound1", 2, [0, 0.5]);
        make_drawer("waveform_sound2", 2, [0, 0.5]);

        make_drawer("waveform_circle", 3, [0.3, 0.5, 0.7]);

        let string1 = make_drawer("string1", 1);
        string1[0].set_sim_slider(0, string1[1]);

        string2 = make_drawer("string2", 2);
        string2[0].set_sim_slider(0, string2[1]);
        string2[0].set_sim_slider(1, string2[2]);

        string3 = make_drawer("string3", 2);

        let string4 = make_drawer("string4");
        let string4_seg = new SegmentedControl(document.getElementById("string4_seg0"), function(x) {
            string4[0].set_arg0(x);
        }, ["1", "2", "3", "4", "5"]);


        string5 = make_drawer("string5");
        string5_seg = new SegmentedControl(document.getElementById("string5_seg0"), function(x) {
            string5[0].set_arg0(x);
        }, ["1", "2", "3", "4", "5", "6", "7"]);



        function make_string_drawer(name) {
            let ret = [];

            let drawer_container = document.getElementById(name);
            let drawer = new Drawer(drawer_container, name);



        }
        make_drawer("string7", 0, [], false, true);
        make_drawer("string8", 1, [], false, true);
        make_drawer("string9", 1, [], false, true);


        let analyser = make_drawer("analyser");

        let analyser_button = document.getElementById("analyser_button");
        analyser_button.onclick = function() {

            if (microphone_source) {

                microphone_source.stop();
                microphone_source = undefined;

                analyser[0].request_repaint(false);
                analyser_button.classList.remove("selected");
                analyser_button.classList.remove("pressed");
            } else if (navigator.mediaDevices) {
                analyser_button.classList.add("pressed");

                const handleSuccess = function(stream) {

                    microphone_source = audio.analyze_sound(stream);

                    if (microphone_source) {
                        analyser_button.classList.add("selected");
                        analyser[0].request_repaint(false);
                    }
                };

                navigator.mediaDevices.getUserMedia({ audio: true, video: false })
                    .then(handleSuccess)
                    .catch(function() {
                        analyser_button.classList.remove("pressed");
                    });
            }
        }


        let waveform_addition1 = make_drawer("waveform_addition1", 1, [0]);
        let waveform_addition2 = make_drawer("waveform_addition2", 1, [0]);
        make_drawer("waveform_addition3", 1, [0]);
        waveform_addition4 = make_drawer("waveform_addition4", 1, [0]);

        let waveform_addition1_seg = new SegmentedControl(document.getElementById("waveform_addition1_seg0"), function(x) {
            waveform_addition1[0].set_arg1(x);
        }, ["A", "B", "c"]);

        let waveform_addition2_seg = new SegmentedControl(document.getElementById("waveform_addition2_seg0"), function(x) {
            waveform_addition2[0].set_arg1(x);
        }, ["A", "B", "c"]);


        make_drawer("distance", 0, [0], true);
        make_drawer("doppler", 1, [0.5], true);
        doppler2 = make_drawer("doppler2", 2, [0, 0.5]);
        make_drawer("pulse_sphere", 1);
        make_drawer("pulse_piston", 1);
        make_drawer("interference1", 0, [0], true);
        reflection1 = make_drawer("reflection1", 0, [0], true);
        make_drawer("reflection2", 1, [0.5], true);

        frequency_shape = make_drawer("frequency_shape", 1, [0]);
        make_drawer("frequency_shape2", 1, 0);

        make_drawer("triangle_shape", 3, [0.3, 0.6, 0.0]);



        let pressure_value_span = document.getElementById("pressure_value");
        let spl_value_span = document.getElementById("spl_value");
        let pressure_slider = new Slider(document.getElementById("pressure_spl_sl0"), function(x) {

            let p = Math.floor(Math.pow(10, x * 8) * 2);
            let spl = 20 * Math.log10(p / 20);
            pressure_value_span.textContent = p.toString() + " µPa";
            spl_value_span.textContent = (spl < 0 ? "−" : "") + abs(spl).toFixed(1);
        });


        if ("IntersectionObserver" in window) {
            const observer = new IntersectionObserver(entries => {
                entries.forEach(entry => { entry.target.drawer.set_visible(entry.isIntersecting); })
            }, { rootMargin: "300px" })

            all_containers.forEach(container => observer.observe(container));
        } else {
            all_containers.forEach(container => container.drawer.set_visible(true));
        }


        function find_keyboard() {
            let best = undefined;
            let best_height = -1;
            all_keyboards.forEach(keyboard => {
                let rect = keyboard.drawer_container.getBoundingClientRect();
                let y0 = max(0, rect.top);
                let y1 = min(window.innerHeight, rect.bottom + 200);
                let height = y1 - y0;
                if (height > best_height) {
                    best_height = height;
                    best = keyboard;
                }
            });

            return best;
        }


        document.addEventListener('keydown', function(event) {

            if (event.ctrlKey || event.altKey || event.metaKey)
                return;

            let keyboard = find_keyboard();


            if (keyboard && (!active_keyboard || active_keyboard == keyboard) &&
                keyboard.alpha_key_down(event.key)) {

                function f(event2) {
                    if (event2.key == event.key) {
                        keyboard.alpha_key_up(event.key);
                        document.removeEventListener('keyup', f, false);
                        event.preventDefault();
                        active_keyboard = undefined;
                    }
                }

                document.addEventListener('keyup', f, false);
                active_keyboard = keyboard;
                event.preventDefault();
            }
        }, false);

    });
})();

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

function particles4_f0() {
    particles4[0].set_arg0(0);
    particles4[1].set_value(0);
}

function particles4_f1() {
    particles4[0].set_arg0(1);
    particles4[1].set_value(1);
}

function waveform_sound1_f0() {
    waveform_sound1[0].set_arg0(0.08324967792);
    waveform_sound1[1].set_value(0.08324967792);
}



function waveform_addition4_f0() {
    let signal = new Float32Array(signal_samples);
    for (let i = 0; i < signal_samples; i++) {
        let t = i / signal_samples;
        signal[i] = t >= 0.5 ? 0.9 : -0.9;
    }

    waveform_addition4[0].set_signal(signal);
}

function waveform_addition4_f1() {
    let signal = new Float32Array(signal_samples);
    for (let i = 0; i < signal_samples; i++) {
        let t = i / signal_samples;
        signal[i] = -0.9 * Math.sin(t * 2 * Math.PI);
    }

    waveform_addition4[0].set_signal(signal);
}

function waveform_addition4_f2() {
    waveform_addition4[0].set_arg0(1);
    waveform_addition4[1].set_value(1);
}


function string2_f0() {
    string2[0].set_arg0(1);
    string2[0].set_arg1(2 / 3);
    string2[1].set_value(1);
    string2[2].set_value(2 / 3);
    string2[0].invalidate_state();
}

function string3_f0() {
    string3[0].set_arg0(1);
    string3[0].set_arg1(1 / 3);
    string3[1].set_value(1);
    string3[2].set_value(1 / 3);
    string3[0].invalidate_state();
}

function string3_f1() {
    string3[0].set_arg0(0);
    string3[0].set_arg1(1);
    string3[1].set_value(0);
    string3[2].set_value(1);
    string3[0].invalidate_state();
}

function string3_f2() {
    string3[0].set_arg0(1);
    string3[0].set_arg1(0);
    string3[1].set_value(1);
    string3[2].set_value(0);
    string3[0].invalidate_state();
}

function string5_f0() {
    string5[0].set_arg0(0);
    string5_seg.set_selection(0);
}

function string5_f1() {
    string5[0].set_arg0(2);
    string5_seg.set_selection(2);
}

function frequency_shape_f0() {
    frequency_shape[0].set_arg0(0.9);
    frequency_shape[1].set_value(0.9);
}

function doppler2_f0() {
    doppler2[0].set_draggable(0, [0.3, 0.1]);
    doppler2[0].set_arg0(0);
    doppler2[1].set_value(0);
}


function doppler2_f1() {
    doppler2[0].set_draggable(0, [0.3, 0.1]);
    doppler2[0].set_arg0(0.05);
    doppler2[1].set_value(0.05);

}

function reflection1_f0() {
    reflection1[0].set_draggable(0, [0.3, 0.4]);
}

function reflection1_f1() {
    reflection1[0].set_draggable(0, [1.19, 0.4]);
}