"use strict";

let animated_drawers = [];
let drawers_map = {};

let metric;

let initial_data;
let initial_data_offsets = {
    "symmetric_airfoil": 0,
    "symmetric_airfoil_18": 35346,
    "asymmetric_airfoil": 70692,
    "naca_64_1_212": 106038,
    "flat_plate": 128298,
}

download_file("/models/airfoil.dat", function (buffer) {
    initial_data = new Float32Array(buffer);
});

(function () {

    const pi = Math.PI;

    const sqrt = Math.sqrt;
    const sin = Math.sin;
    const cos = Math.cos;
    const max = Math.max;
    const min = Math.min;
    const abs = Math.abs;
    const pow = Math.pow;
    const atan2 = Math.atan2;
    const round = Math.round;
    const floor = Math.floor;
    const ceil = Math.ceil;
    const random = Math.random;

    const coarse_pointer = matchMedia("(pointer:coarse)").matches;

    const scale = min(window.devicePixelRatio || 1, 2);

    let all_drawers = [];
    let all_containers = [];


    const grass_x = 64;
    const grass_y = 64;
    const grass_count = grass_x * grass_y;

    const leaf_count = 12;

    const arrow_instance_side_count = 6;


    const particles_count = 17587;
    const quad_count = 3000;

    const texture_velocity_arrow_side_count = 48;

    const marker_count = 512;
    const marker_batch_count = 8;
    const marker_batch_size = 40;
    const marker_history_size = 32;
    const batch_marker_count = marker_batch_count * marker_batch_size;
    const free_marker_count = marker_count - batch_marker_count;



    const mu_air = 1.5e-5; // actually nu
    const mu = mu_air;
    const rho = 1.0;

    const negative_color = [0.157, 0.522, 0.784, 1.0];
    const positive_color = [0.882, 0.173, 0.067, 1.0];

    const surface_max = 0.1;

    const FDM_width = 384;
    const FDM_height = 127;
    const FDM_dx = 0.02;
    const FDM_dy = 0.02;

    const boundary_nx = 200;
    const boundary_ny = 50;

    const velocity_lut = [
        [3, 5, 16, 255],
        [28, 17, 44, 255],
        [54, 24, 62, 255],
        [82, 30, 77, 255],
        [112, 31, 87, 255],
        [142, 30, 91, 255],
        [173, 23, 88, 255],
        [202, 26, 80, 255],
        [225, 50, 67, 255],
        [238, 84, 63, 255],
        [243, 119, 82, 255],
        [245, 150, 109, 255],
        [246, 180, 142, 255],
        [247, 208, 182, 255],
        [249, 236, 221, 255],
    ];

    function smooth_data(a) {
        let t = new Array();
        for (let i = 0; i < a.length - 1; i++) {
            t.push(a[i]);
            t.push(vec_lerp(a[i], a[i + 1], 0.25));
            t.push(vec_lerp(a[i], a[i + 1], 0.5));
            t.push(vec_lerp(a[i], a[i + 1], 0.75));
        }
        t.push(a[a.length - 1]);

        let aa = new Array();
        aa.push(t[0]);
        for (let i = 1; i < t.length - 2; i++) {
            aa.push(vec_add(vec_scale(t[i], 0.5), vec_scale(vec_add(t[i - 1], t[i + 1]), 0.25)));
        }
        aa.push(t[t.length - 1]);
        return aa;
    }

    let symmetric_airfoil_plot_data = smooth_data([
        [-18, -58.3],
        [-16, -67],
        [-14, -66.4],
        [-12, -62.5],
        [-10, -58.4],
        [-8, -48.8],
        [-6, -35],
        [-4, -22.6],
        [-2, -12.7],
        [0, 0],
        [2, 12.7],
        [4, 23.6],
        [6, 35],
        [8, 48.8],
        [10, 58.4],
        [12, 62.5],
        [14, 66.4],
        [16, 67],
        [18, 58.3],
    ]);

    let asymmetric_airfoil_plot_data = smooth_data([
        [-4, -13.3],
        [-2, -4.2],
        [0, 8.2],
        [2, 20.7],
        [4, 34.3],
        [6, 47.7],
        [8, 59.3],
        [10, 63],
        [12, 69],
        [14, 76],
        [16, 81.3],
        [18, 70.7],
    ]);

    function surface_z(x, y) {

        // let r = x*x + y*y;

        // return -0.8 + 0.5 * smooth_step(0, 0.3, r);
        let z = 0;
        z += 0.25 * cos(y * 2.2 + x) * sin(x * 1.8 + y);
        z += 0.18 * cos(x * 4.2 + 2) * sin(y * 6.8);
        z += 0.13 * cos(y * 16.0 + 3) * sin(x * 19.0 + 4);
        z += 0.06 * cos(x * 17.3 + sin(30 * y) * 1.3);
        z += 0.06 * sin(y * 15.4 + cos(30 * x) * 1.8);

        z = z - 0.5;

        return z;
    }

    function surface_n(x, y) {
        const eps = 0.001;
        let dx = surface_z(x - eps, y) - surface_z(x + eps, y);
        let dy = surface_z(x, y - eps) - surface_z(x, y + eps);
        let dz = 2.0 * eps;

        return vec_norm([dx, dy, dz]);
    }

    function GLDrawer(scale) {

        const canvas = document.createElement("canvas");
        this.canvas = canvas;

        const gl = canvas.getContext('experimental-webgl', { antialias: true });
        gl.getExtension('OES_standard_derivatives');
        gl.getExtension("WEBGL_color_buffer_float");

        const float_ext = gl.getExtension("OES_texture_float");

        let linear_filtering = gl.getExtension("OES_texture_float_linear");

        let ext = gl.getExtension('ANGLE_instanced_arrays');

        const float_size = 4;

        let full_screen_vertices = [
            -1.0, -1.0,
            3.0, -1.0,
            -1.0, 3.0,
        ];

        let full_screen_vertex_buffer = gl.createBuffer();

        gl.bindBuffer(gl.ARRAY_BUFFER, full_screen_vertex_buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(full_screen_vertices), gl.STATIC_DRAW);


        let line_vertex_buffer = gl.createBuffer();

        {
            let line_vertices = [0.0, 1.0];
            gl.bindBuffer(gl.ARRAY_BUFFER, line_vertex_buffer);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(line_vertices), gl.STATIC_DRAW);
        }

        let marker_trail_vertex_buffer = gl.createBuffer();
        {
            let pos = new Float32Array(marker_history_size * 6 * 3);

            for (let i = 0; i < marker_history_size; i++) {

                let t = i / marker_history_size;
                pos[i * 18 + 0] = 0;
                pos[i * 18 + 1] = -1;
                pos[i * 18 + 2] = t;

                pos[i * 18 + 3] = 1;
                pos[i * 18 + 4] = -1;
                pos[i * 18 + 5] = t;

                pos[i * 18 + 6] = 0;
                pos[i * 18 + 7] = 1;
                pos[i * 18 + 8] = t;

                pos[i * 18 + 9] = 1;
                pos[i * 18 + 10] = -1;
                pos[i * 18 + 11] = t;

                pos[i * 18 + 12] = 1;
                pos[i * 18 + 13] = 1;
                pos[i * 18 + 14] = t;

                pos[i * 18 + 15] = 0;
                pos[i * 18 + 16] = 1;
                pos[i * 18 + 17] = t;
            }

            gl.bindBuffer(gl.ARRAY_BUFFER, marker_trail_vertex_buffer);
            gl.bufferData(gl.ARRAY_BUFFER, pos, gl.STATIC_DRAW);
        }

        let marker_x_offset_buffer = gl.createBuffer();
        {
            let pos = new Float32Array(marker_count);

            for (let i = 0; i < marker_count; i++)
                pos[i] = (i + 0.5) / marker_count;

            gl.bindBuffer(gl.ARRAY_BUFFER, marker_x_offset_buffer);
            gl.bufferData(gl.ARRAY_BUFFER, pos, gl.STATIC_DRAW);
        }

        let marker_reset_y_offset_buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, marker_reset_y_offset_buffer);
        gl.bufferData(gl.ARRAY_BUFFER, marker_count * float_size, gl.DYNAMIC_DRAW);

        let marker_trail_reset_y_offset_buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, marker_trail_reset_y_offset_buffer);
        gl.bufferData(gl.ARRAY_BUFFER, marker_count * float_size, gl.DYNAMIC_DRAW);

        let marker_trail_write_y_offset_buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, marker_trail_write_y_offset_buffer);
        gl.bufferData(gl.ARRAY_BUFFER, marker_count * float_size, gl.DYNAMIC_DRAW);


        let grass_vertex_buffer = gl.createBuffer();

        let grass_vertex_count = 13;
        let grass_vertices = new Float32Array(grass_vertex_count * 2);

        for (let i = 0; i < grass_vertex_count - 1; i++) {
            let t = (i >> 1) / (grass_vertex_count >> 1);
            let w = 1 - t * t * t * t;
            grass_vertices[2 * i + 0] = (i & 1 ? -0.02 : 0.02) * w;
            grass_vertices[2 * i + 1] = t;
        }

        grass_vertices[2 * grass_vertex_count - 2 + 0] = 0.0;
        grass_vertices[2 * grass_vertex_count - 2 + 1] = 1.0;

        gl.bindBuffer(gl.ARRAY_BUFFER, grass_vertex_buffer);
        gl.bufferData(gl.ARRAY_BUFFER, grass_vertices, gl.STATIC_DRAW);

        let grass_params_buffer = gl.createBuffer();
        let grass_params = new Float32Array(grass_count * 6);

        for (let y = 0; y < grass_y; y++) {
            for (let x = 0; x < grass_x; x++) {
                let i = y * grass_x + x;
                let a = random() * 2 * pi;

                let r = random();
                grass_params[i * 6 + 0] = (saturate((x + random() - 0.5) / (grass_x - 1)) * 2.0 - 1.0);
                grass_params[i * 6 + 1] = (saturate((y + random() - 0.5) / (grass_y - 1)) * 2.0 - 1.0);
                grass_params[i * 6 + 2] = cos(a);
                grass_params[i * 6 + 3] = sin(a);
                grass_params[i * 6 + 4] = lerp(0.5, 0.75, r * r);
                grass_params[i * 6 + 5] = random();

                if (x + y < 5)
                    grass_params[i * 6 + 0] = grass_params[i * 6 + 1] = NaN;
            }
        }

        gl.bindBuffer(gl.ARRAY_BUFFER, grass_params_buffer);
        gl.bufferData(gl.ARRAY_BUFFER, grass_params, gl.STATIC_DRAW);


        let grass_tilt_buffer = gl.createBuffer();

        gl.bindBuffer(gl.ARRAY_BUFFER, grass_tilt_buffer);
        gl.bufferData(gl.ARRAY_BUFFER, 2 * float_size * grass_count, gl.DYNAMIC_DRAW);


        let leaf_vertex_buffer = gl.createBuffer();

        let leaf_vertex_count = 25;
        let leaf_vertices = new Float32Array(leaf_vertex_count * 2);

        for (let i = 0; i < leaf_vertex_count - 1; i++) {
            let t = (i >> 1) / (leaf_vertex_count >> 1);
            let tt = (t - 0.2) / (1 - 0.2);

            let w = 0.015;

            if (t >= 0.3)
                w += 0.8 * tt * (1 - tt);
            leaf_vertices[2 * i + 0] = (i & 1 ? -w : w);
            leaf_vertices[2 * i + 1] = t - 0.5;
        }

        leaf_vertices[2 * leaf_vertex_count - 2 + 0] = 0.0;
        leaf_vertices[2 * leaf_vertex_count - 2 + 1] = 0.5;

        gl.bindBuffer(gl.ARRAY_BUFFER, leaf_vertex_buffer);
        gl.bufferData(gl.ARRAY_BUFFER, leaf_vertices, gl.STATIC_DRAW);

        let ground_x = 48;
        let ground_y = 48;
        let ground_count = ground_x * ground_y + 2 * ground_x + 2 * ground_y;

        let ground_vertex_buffer = gl.createBuffer();

        gl.bindBuffer(gl.ARRAY_BUFFER, ground_vertex_buffer);
        {

            let ground = new Float32Array(ground_count * 2 * 3 * 3)

            let height = new Float32Array((ground_y + 1) * (ground_x + 1));
            let pos = new Float32Array((ground_y + 1) * (ground_x + 1) * 2);

            const range = 1.005;

            let x_coords = [0, 1, 0, 1, 1, 0];
            let y_coords = [0, 0, 1, 0, 1, 1];


            for (let y = 0; y <= ground_y; y++) {
                for (let x = 0; x <= ground_x; x++) {
                    let i = y * (ground_x + 1) + x;
                    height[i] = random();
                    pos[2 * i + 0] = ((x + 0.2 * (random() - 0.5)) / ground_x * 2.0 * range - range);
                    pos[2 * i + 1] = ((y + 0.2 * (random() - 0.5)) / ground_y * 2.0 * range - range);
                }
            }

            let depth = -1.5;


            let i = 0;

            for (let y = 0; y < ground_y; y++) {
                for (let x = 0; x < ground_x; x++) {
                    for (let k = 0; k < 6; k++) {
                        ground[i + 0] = pos[((y + y_coords[k]) * (ground_x + 1) + x + x_coords[k]) * 2 + 0];
                        ground[i + 1] = pos[((y + y_coords[k]) * (ground_x + 1) + x + x_coords[k]) * 2 + 1];
                        ground[i + 2] = height[(y + y_coords[k]) * (ground_x + 1) + (x + x_coords[k])];

                        i += 3;
                    }
                }
            }



            for (let y = 0; y <= ground_y; y += ground_y) {
                for (let x = 0; x < ground_x; x++) {
                    for (let k = 0; k < 6; k++) {
                        ground[i + 0] = pos[((y) * (ground_x + 1) + x + x_coords[k]) * 2 + 0];
                        ground[i + 1] = pos[((y) * (ground_x + 1) + x + x_coords[k]) * 2 + 1];
                        ground[i + 2] = y_coords[k] == 1 ? height[y * (ground_x + 1) + (x + x_coords[k])] : depth;

                        i += 3;

                    }
                }
            }

            for (let x = 0; x <= ground_x; x += ground_x) {
                for (let y = 0; y < ground_y; y++) {
                    for (let k = 0; k < 6; k++) {
                        ground[i + 0] = pos[((y + y_coords[k]) * (ground_x + 1) + x) * 2 + 0];
                        ground[i + 1] = pos[((y + y_coords[k]) * (ground_x + 1) + x) * 2 + 1];
                        ground[i + 2] = x_coords[k] == 1 ? height[(y + y_coords[k]) * (ground_x + 1) + (x)] : depth;
                        i += 3;
                    }
                }
            }

            gl.bufferData(gl.ARRAY_BUFFER, ground, gl.STATIC_DRAW);
        }

        let surface_x = 192;
        let surface_y = 192;
        let surface_count = (surface_x + 1) * (surface_y + 1);

        let surface_vertex_buffer = gl.createBuffer();
        let surface_index_buffer = gl.createBuffer();
        let surface_index_count = surface_x * surface_y * 6;

        {

            let surface_indices = new Uint16Array(surface_index_count);


            for (let y = 0; y < surface_y; y++) {
                for (let x = 0; x < surface_x; x++) {

                    let i = y * surface_x + x;

                    surface_indices[i * 6 + 0] = y * (surface_x + 1) + x;
                    surface_indices[i * 6 + 1] = y * (surface_x + 1) + x + 1;
                    surface_indices[i * 6 + 2] = y * (surface_x + 1) + x + surface_x + 1;

                    surface_indices[i * 6 + 3] = y * (surface_x + 1) + x + 1;
                    surface_indices[i * 6 + 4] = y * (surface_x + 1) + x + surface_x + 1 + 1;
                    surface_indices[i * 6 + 5] = y * (surface_x + 1) + x + surface_x + 1;
                }
            }



            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, surface_index_buffer);
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, surface_indices, gl.STATIC_DRAW);


            let surface = new Float32Array(surface_count * 6)

            for (let y = 0; y <= surface_y; y++) {
                for (let x = 0; x <= surface_x; x++) {
                    let i = y * (surface_x + 1) + x;

                    let xx = x / surface_x * 2 - 1;
                    let yy = y / surface_y * 2 - 1;

                    let z = surface_z(xx, yy);
                    let n = surface_n(xx, yy);


                    surface[6 * i + 0] = xx;
                    surface[6 * i + 1] = yy;
                    surface[6 * i + 2] = z;

                    surface[6 * i + 3] = n[0];
                    surface[6 * i + 4] = n[1];
                    surface[6 * i + 5] = n[2];
                }
            }
            gl.bindBuffer(gl.ARRAY_BUFFER, surface_vertex_buffer);

            gl.bufferData(gl.ARRAY_BUFFER, surface, gl.STATIC_DRAW);
        }


        let point_pos_buffer = gl.createBuffer();

        gl.bindBuffer(gl.ARRAY_BUFFER, point_pos_buffer);
        gl.bufferData(gl.ARRAY_BUFFER, particles_count * 3 * float_size, gl.DYNAMIC_DRAW);

        let point_vel_buffer = gl.createBuffer();

        gl.bindBuffer(gl.ARRAY_BUFFER, point_vel_buffer);
        gl.bufferData(gl.ARRAY_BUFFER, particles_count * 3 * float_size, gl.DYNAMIC_DRAW);

        let point_col_buffer = gl.createBuffer();

        gl.bindBuffer(gl.ARRAY_BUFFER, point_col_buffer);
        gl.bufferData(gl.ARRAY_BUFFER, particles_count * float_size, gl.DYNAMIC_DRAW);

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

        let quad_index_buffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, quad_index_buffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, quad_indices, gl.STATIC_DRAW);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

        let flat_arrow_vertex_buffer = gl.createBuffer();
        let flat_arrow_vertex_count = 6;


        {
            gl.bindBuffer(gl.ARRAY_BUFFER, flat_arrow_vertex_buffer);

            let x0 = -0.2;
            let x1 = 1.2;
            let y = 0.4;

            let arrow = new Float32Array(flat_arrow_vertex_count * 2);
            arrow[0] = x0;
            arrow[1] = -y;
            arrow[2] = x1;
            arrow[3] = -y;
            arrow[4] = x0;
            arrow[5] = y;

            arrow[6] = x0;
            arrow[7] = y;
            arrow[8] = x1;
            arrow[9] = y;
            arrow[10] = x1;
            arrow[11] = -y;

            gl.bufferData(gl.ARRAY_BUFFER, arrow, gl.STATIC_DRAW);

        }

        let point_arrow_vertex_buffer = gl.createBuffer();
        let point_arrow_vertex_count = 21;

        gl.bindBuffer(gl.ARRAY_BUFFER, point_arrow_vertex_buffer);

        {
            let w = 0.08;
            let l = 0.27;
            let g = 0.7;
            let point_arrow = new Float32Array(point_arrow_vertex_count * 2);
            point_arrow[0] = 0;
            point_arrow[1] = -w;
            point_arrow[2] = g;
            point_arrow[3] = -w;
            point_arrow[4] = 0;
            point_arrow[5] = w;

            point_arrow[6] = 0;
            point_arrow[7] = w;
            point_arrow[8] = g;
            point_arrow[9] = -w;
            point_arrow[10] = g;
            point_arrow[11] = w;


            point_arrow[12] = 1;
            point_arrow[13] = 0;
            point_arrow[14] = 1.0 - l;
            point_arrow[15] = l;
            point_arrow[16] = g;
            point_arrow[17] = w;

            point_arrow[18] = g;
            point_arrow[19] = w;
            point_arrow[20] = 1.0 - l;
            point_arrow[21] = l;
            point_arrow[22] = 1.0 - l - sqrt(2) * w;
            point_arrow[23] = l - sqrt(2) * w;

            point_arrow[24] = 1;
            point_arrow[25] = 0;
            point_arrow[26] = 1.0 - l;
            point_arrow[27] = -l;
            point_arrow[28] = g;
            point_arrow[29] = -w;

            point_arrow[30] = g;
            point_arrow[31] = -w;
            point_arrow[32] = 1.0 - l;
            point_arrow[33] = -l;
            point_arrow[34] = 1.0 - l - sqrt(2) * w;
            point_arrow[35] = -l + sqrt(2) * w;

            point_arrow[36] = 1;
            point_arrow[37] = 0;
            point_arrow[38] = g;
            point_arrow[39] = w;
            point_arrow[40] = g;
            point_arrow[41] = -w;


            gl.bufferData(gl.ARRAY_BUFFER, point_arrow, gl.STATIC_DRAW);

        }


        let texture_velocity_arrow_pos_buffer = gl.createBuffer();

        {
            let i = 0;
            let pos_buffer = new Float32Array(texture_velocity_arrow_side_count * texture_velocity_arrow_side_count * 2);
            for (let x = 0; x < texture_velocity_arrow_side_count; x++) {
                for (let y = 0; y < texture_velocity_arrow_side_count; y++) {
                    pos_buffer[i++] = (x + 0.5) / texture_velocity_arrow_side_count;
                    pos_buffer[i++] = (y + 0.5) / texture_velocity_arrow_side_count;
                }
            }

            gl.bindBuffer(gl.ARRAY_BUFFER, texture_velocity_arrow_pos_buffer);
            gl.bufferData(gl.ARRAY_BUFFER, pos_buffer, gl.STATIC_DRAW);
        }





        let box_vertex_buffer = gl.createBuffer();
        let box_vertex_count = 6 * 6;

        gl.bindBuffer(gl.ARRAY_BUFFER, box_vertex_buffer);

        let box = new Float32Array(box_vertex_count * 8);

        let x_vec = [[1, 0, 0], [0, 1, 0], [-1, 0, 0], [0, -1, 0], [1, 0, 0], [-1, 0, 0]];
        let y_vec = [[0, 0, 1], [0, 0, 1], [0, 0, 1], [0, 0, 1], [0, -1, 0], [0, -1, 0]];

        for (let side = 0; side < 6; side++) {

            let norm = vec_cross(x_vec[side], y_vec[side]);

            let x_signs = [1, -1, -1, 1, 1, -1];
            let y_signs = [-1, -1, 1, -1, 1, 1];

            for (let v = 0; v < 6; v++) {
                box[side * 48 + v * 8 + 0] = x_signs[v] * x_vec[side][0] + y_signs[v] * y_vec[side][0] + norm[0];
                box[side * 48 + v * 8 + 1] = x_signs[v] * x_vec[side][1] + y_signs[v] * y_vec[side][1] + norm[1];
                box[side * 48 + v * 8 + 2] = x_signs[v] * x_vec[side][2] + y_signs[v] * y_vec[side][2] + norm[2];
                box[side * 48 + v * 8 + 3] = norm[0];
                box[side * 48 + v * 8 + 4] = norm[1];
                box[side * 48 + v * 8 + 5] = norm[2];
                box[side * 48 + v * 8 + 6] = x_signs[v];
                box[side * 48 + v * 8 + 7] = y_signs[v];
            }
        }

        gl.bufferData(gl.ARRAY_BUFFER, box, gl.STATIC_DRAW);


        let sphere_vertex_buffer = gl.createBuffer();
        let sphere_vertex_count = 6 * 6 * 6 * 6;

        gl.bindBuffer(gl.ARRAY_BUFFER, sphere_vertex_buffer);

        let sphere = new Float32Array(sphere_vertex_count * 3);
        let sphere_i = 0;

        for (let side = 0; side < 6; side++) {

            let norm = vec_cross(x_vec[side], y_vec[side]);

            for (let ix = 0; ix < 6; ix++) {
                for (let iy = 0; iy < 6; iy++) {

                    let s = [
                        (ix / 6) * 2 - 1.0,
                        ((ix + 1) / 6) * 2 - 1.0
                    ];

                    let t = [
                        (iy / 6) * 2 - 1.0,
                        ((iy + 1) / 6) * 2 - 1.0
                    ];

                    let x = [[], []];
                    let y = [[], []];
                    let z = [[], []];
                    let l = [[], []];

                    for (let i = 0; i < 2; i++) {
                        for (let k = 0; k < 2; k++) {
                            x[i][k] = s[k] * x_vec[side][0] + t[i] * y_vec[side][0] + norm[0];
                            y[i][k] = s[k] * x_vec[side][1] + t[i] * y_vec[side][1] + norm[1];
                            z[i][k] = s[k] * x_vec[side][2] + t[i] * y_vec[side][2] + norm[2];
                        }
                    }

                    for (let i = 0; i < 2; i++) {
                        for (let k = 0; k < 2; k++) {
                            l[i][k] = 1 / sqrt(x[i][k] * x[i][k] + y[i][k] * y[i][k] + z[i][k] * z[i][k]);
                        }
                    }

                    for (let pair of [[0, 0], [1, 0], [0, 1], [1, 0], [1, 1], [0, 1]]) {
                        sphere[sphere_i++] = x[pair[0]][pair[1]] * l[pair[0]][pair[1]];
                        sphere[sphere_i++] = y[pair[0]][pair[1]] * l[pair[0]][pair[1]];
                        sphere[sphere_i++] = z[pair[0]][pair[1]] * l[pair[0]][pair[1]];
                    }
                }
            }

        }

        gl.bufferData(gl.ARRAY_BUFFER, sphere, gl.STATIC_DRAW);



        let arrow_instance_count = arrow_instance_side_count * arrow_instance_side_count * arrow_instance_side_count;

        let arrow_instance_transform_buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, arrow_instance_transform_buffer);
        gl.bufferData(gl.ARRAY_BUFFER, 16 * float_size * arrow_instance_count, gl.DYNAMIC_DRAW);

        let arrow_instance_rot_buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, arrow_instance_rot_buffer);
        gl.bufferData(gl.ARRAY_BUFFER, 9 * float_size * arrow_instance_count, gl.DYNAMIC_DRAW);


        let arrow_vertex_buffer = gl.createBuffer();
        let arrow_index_buffer = gl.createBuffer();


        let arrow_index_count;
        {
            // arrow
            let n = 40;
            let m = 7;

            let vertices = new Float32Array((n + 1) * (m + 1) * 6);
            let indices = new Uint16Array(n * m * 6);

            let ii = 0;

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
                        z = 1;
                    } else if (i == 4) {
                        z = 1;
                        nz = -1;
                        nx = ny = 0;
                    } else if (i == 5) {
                        r = 2;
                        z = 1;
                        nz = -1;
                        nx = ny = 0;
                    } else if (i == 6) {
                        r = 2;
                        z = 1;
                        nz = 0.5;
                    } else if (i == 7) {
                        r = 0;
                        z = 5;
                        nz = 0.3;
                    }


                    vertices[ii++] = x * r;
                    vertices[ii++] = y * r;
                    vertices[ii++] = z;

                    let v = [nx, ny, nz];
                    v = vec_norm(v);

                    vertices[ii++] = v[0];
                    vertices[ii++] = v[1];
                    vertices[ii++] = v[2];
                }
            }

            ii = 0;

            for (let i = 0; i < m; i++) {
                for (let j = 0; j < n; j++) {

                    indices[ii++] = j * (m + 1) + i;
                    indices[ii++] = j * (m + 1) + i + m + 2;
                    indices[ii++] = j * (m + 1) + i + 1;


                    indices[ii++] = j * (m + 1) + i;
                    indices[ii++] = j * (m + 1) + i + m + 1;
                    indices[ii++] = j * (m + 1) + i + m + 2;
                }
            }

            arrow_index_count = ii;


            gl.bindBuffer(gl.ARRAY_BUFFER, arrow_vertex_buffer);
            gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, arrow_index_buffer);
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
        }


        let landscape_edge_vertex_buffer = gl.createBuffer();
        let landscape_edge_index_buffer = gl.createBuffer();

        let landscape_edge_index_count;

        let landscape_vertex_buffer = gl.createBuffer();
        let landscape_index_buffer = gl.createBuffer();

        let landscape_index_count;
        {
            let pad = 40;
            let n = 200 + 2 * pad;
            let m = 120 + 2 * pad;

            let sc = 1 / 200;

            let vertices = new Float32Array((n + 1) * (m + 1) * 2);
            let indices = new Uint16Array(n * m * 6);

            let ii = 0;

            for (let j = 0; j <= n; j++) {
                let x = (j - pad) * sc;

                for (let i = 0; i <= m; i++) {
                    let y = (i - pad) * sc;

                    vertices[ii++] = x;
                    vertices[ii++] = y;
                }
            }

            ii = 0;

            for (let i = 0; i < m; i++) {
                for (let j = 0; j < n; j++) {

                    indices[ii++] = j * (m + 1) + i;
                    indices[ii++] = j * (m + 1) + i + m + 2;
                    indices[ii++] = j * (m + 1) + i + 1;


                    indices[ii++] = j * (m + 1) + i;
                    indices[ii++] = j * (m + 1) + i + m + 1;
                    indices[ii++] = j * (m + 1) + i + m + 2;
                }
            }


            landscape_index_count = ii;

            gl.bindBuffer(gl.ARRAY_BUFFER, landscape_vertex_buffer);
            gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, landscape_index_buffer);
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);



            let edge_vertices = new Float32Array(16 * 4);
            let edge_indices = new Uint16Array(16 * 3);


            let fade = 20;

            for (let i = 0; i < 4; i++) {
                edge_vertices[(i * 4 + 0) * 4 + 0] = (-fade - pad) * sc;
                edge_vertices[(i * 4 + 1) * 4 + 0] = (-pad) * sc;
                edge_vertices[(i * 4 + 2) * 4 + 0] = (200 + pad) * sc;
                edge_vertices[(i * 4 + 3) * 4 + 0] = (200 + pad + fade) * sc;

                edge_vertices[(i * 4 + 0) * 4 + 2] = -1;
                edge_vertices[(i * 4 + 1) * 4 + 2] = 0;
                edge_vertices[(i * 4 + 2) * 4 + 2] = 0;
                edge_vertices[(i * 4 + 3) * 4 + 2] = +1;

                edge_vertices[(0 * 4 + i) * 4 + 1] = (-fade - pad) * sc;
                edge_vertices[(1 * 4 + i) * 4 + 1] = (-pad) * sc;
                edge_vertices[(2 * 4 + i) * 4 + 1] = (120 + pad) * sc;
                edge_vertices[(3 * 4 + i) * 4 + 1] = (120 + pad + fade) * sc;

                edge_vertices[(0 * 4 + i) * 4 + 3] = -1;
                edge_vertices[(1 * 4 + i) * 4 + 3] = 0;
                edge_vertices[(2 * 4 + i) * 4 + 3] = 0;
                edge_vertices[(3 * 4 + i) * 4 + 3] = 1;
            }

            ii = 0

            for (let k of [0, 1, 2, 4, 6, 8, 9, 10]) {
                edge_indices[ii++] = 0 + k;
                edge_indices[ii++] = 1 + k;
                edge_indices[ii++] = 4 + k;
                edge_indices[ii++] = 1 + k;
                edge_indices[ii++] = 5 + k;
                edge_indices[ii++] = 4 + k;
            }


            landscape_edge_index_count = ii;

            gl.bindBuffer(gl.ARRAY_BUFFER, landscape_edge_vertex_buffer);
            gl.bufferData(gl.ARRAY_BUFFER, edge_vertices, gl.STATIC_DRAW);

            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, landscape_edge_index_buffer);
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, edge_indices, gl.STATIC_DRAW);
        }


        function make_fvm_mesh_buffers(geometry, dynamic = false) {
            let mesh_index_buffer = gl.createBuffer();

            let mesh_vertex_p_pos_buffer = gl.createBuffer();
            let mesh_vertex_p_val_buffer = gl.createBuffer();

            let mesh_vertex_uv_pos_buffer = gl.createBuffer();
            let mesh_vertex_uv_val_buffer = gl.createBuffer();

            let mesh_vertex_count = geometry.ngx * geometry.ngy;
            let mesh_index_count = geometry.nx * geometry.nx * 6;

            {
                let mesh_vertices = new Float32Array(mesh_vertex_count * 2);

                let i = 0;

                for (let y = 0; y < geometry.ngy; y++) {
                    for (let x = 0; x < geometry.ngx; x++) {
                        let pos = geometry.cell_position(x, y);

                        mesh_vertices[i++] = pos[0];
                        mesh_vertices[i++] = pos[1];
                    }
                }

                gl.bindBuffer(gl.ARRAY_BUFFER, mesh_vertex_p_pos_buffer);
                gl.bufferData(gl.ARRAY_BUFFER, mesh_vertices, dynamic ? gl.DYNAMIC_DRAW : gl.STATIC_DRAW);


                gl.bindBuffer(gl.ARRAY_BUFFER, mesh_vertex_p_val_buffer);
                gl.bufferData(gl.ARRAY_BUFFER, float_size * mesh_vertex_count, gl.DYNAMIC_DRAW);

                i = 0;

                for (let y = 0; y < geometry.ngy; y++) {
                    for (let x = 0; x < geometry.ngx; x++) {
                        let pos = geometry.grid_position(x, y);

                        mesh_vertices[i++] = pos[0];
                        mesh_vertices[i++] = pos[1];
                    }
                }

                gl.bindBuffer(gl.ARRAY_BUFFER, mesh_vertex_uv_pos_buffer);
                gl.bufferData(gl.ARRAY_BUFFER, mesh_vertices, dynamic ? gl.DYNAMIC_DRAW : gl.STATIC_DRAW);


                gl.bindBuffer(gl.ARRAY_BUFFER, mesh_vertex_uv_val_buffer);
                gl.bufferData(gl.ARRAY_BUFFER, 2 * float_size * mesh_vertex_count, gl.DYNAMIC_DRAW);
            }

            {
                let indices = new Uint16Array(mesh_index_count);

                let i = 0;
                for (let y = 0; y < geometry.ny; y++) {

                    for (let x = 0; x < geometry.nx; x++) {

                        indices[i++] = (y + 0) * geometry.ngx + x;
                        indices[i++] = (y + 0) * geometry.ngx + x + 1;
                        indices[i++] = (y + 1) * geometry.ngx + x;

                        indices[i++] = (y + 1) * geometry.ngx + x;
                        indices[i++] = (y + 0) * geometry.ngx + x + 1;
                        indices[i++] = (y + 1) * geometry.ngx + x + 1;
                    }
                }

                gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, mesh_index_buffer);
                gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
            }

            let buffers = {};

            buffers.vertex_count = mesh_vertex_count;
            buffers.index_count = mesh_index_count;

            buffers.index_buffer = mesh_index_buffer;
            buffers.vertex_p_pos_buffer = mesh_vertex_p_pos_buffer;
            buffers.vertex_p_val_buffer = mesh_vertex_p_val_buffer;
            buffers.vertex_uv_pos_buffer = mesh_vertex_uv_pos_buffer;
            buffers.vertex_uv_val_buffer = mesh_vertex_uv_val_buffer;

            return buffers;
        }

        let symmetric_airfoil_fvm_buffers = make_fvm_mesh_buffers(symmetric_airfoil_geometry);

        let plate_fvm_buffers = make_fvm_mesh_buffers(plate_geometry);

        let asymmetric_airfoil_fvm_buffers = make_fvm_mesh_buffers
            (asymmetric_airfoil_geometry);

        let dynamic_symmetric_airfoil_fvm_buffers = make_fvm_mesh_buffers(symmetric_airfoil_geometry, true);

        let dynamic_uneven_airfoil_fvm_buffers = make_fvm_mesh_buffers(symmetric_airfoil_geometry, true);

        let naca_64_1_212_fvm_buffers = make_fvm_mesh_buffers(naca_64_1_212_geometry, true);


        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);


        let velocity_lut_texture = gl.createTexture();

        gl.bindTexture(gl.TEXTURE_2D, velocity_lut_texture);

        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        let pixels = new Uint8Array(flatten(velocity_lut));

        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, velocity_lut.length, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, pixels);

        gl.bindTexture(gl.TEXTURE_2D, null);



        let boundary_texture = gl.createTexture();

        gl.bindTexture(gl.TEXTURE_2D, boundary_texture);

        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

        gl.texImage2D(gl.TEXTURE_2D, 0, gl.ALPHA, boundary_nx, boundary_ny, 0, gl.ALPHA, gl.UNSIGNED_BYTE, null);

        gl.bindTexture(gl.TEXTURE_2D, null);


        let full_screen_vert_src =
            `
            attribute vec2 v_position;
            
            uniform float u_aspect;

            varying vec2 xy;
            
            void main(void) {
                xy = vec2(v_position.x, u_aspect * v_position.y);
                gl_Position = vec4(v_position, 0.0, 1.0);
            }
            `;

        let sky_frag_src =
            `

        precision mediump float;
                
        varying vec2 xy;
        
        uniform mat3 u_rot;
        uniform float u_map;

        float RAY_MAX = 1.0e20;
        
        void ray(out vec3 ray_pos, out vec3 ray_dir, vec2 uv)
        {
            float camera_dist = 10.5;
            float fov_start = 6.3137515138;
            
            vec3 pos = vec3(0.0,0.0,fov_start);

            vec3 dir = normalize(vec3(uv, 0.0) - pos);

            ray_dir = dir * u_rot;
            ray_pos = (vec3(0,0,camera_dist)) * u_rot;
        }

        float quick_sphere(vec3 ray_org, vec3 ray_dir, vec3 pos, float r2) {
            vec3 oc = ray_org - pos;
            float b = dot(oc, ray_dir);
            float c = dot(oc, oc) - r2;
            float h = b*b - c;
            
            if (h<0.0) return RAY_MAX;

            return -b + sqrt(h);
        }
        
        void main(void) {
            vec3 ray_org, ray_dir;
            ray(ray_org, ray_dir, xy);

            vec3 pos = vec3(0.0,0.0,-0.5);
            float r2 = 6.0;

            vec3 oc = ray_org - pos;
            float b = dot(oc, ray_dir);
            float c = dot(oc, oc) - r2;
            float h = b*b - c;

            float t0 = -b + sqrt(h);
            float t1 = -b - sqrt(h);

            vec3 p = ray_org + t0 * ray_dir;

            float hf = smoothstep(-0.8, 1.0, p.z);
            vec3 rgb = vec3(0.84, 0.87, 0.9) * (1.0 + 0.02*hf);
            float a = 0.2 + 0.8 * smoothstep(-1.5, -0.0, p.z);
            

            gl_FragColor = vec4(rgb, 1.0) * a;
        }
        
        `

        let simple_frag_src =
            `
            precision mediump float;
                
            varying vec2 xy;
                
            uniform float u_map;

            void main(void) {
                gl_FragColor = vec4(xy.x, xy.y, u_map, 1.0);
            }
            `;

        let grass_vert_src =
            `
            attribute vec2 v_position;
            attribute vec4 v_pos_params;
            attribute vec2 v_style_params;

            attribute vec2 v_tilt;

            uniform mat4 u_mvp;
            uniform mat3 u_rot;
            
            varying vec2 color_params;
            varying vec3 color;
            
            void main(void) {  
                float tilt_len = dot(v_tilt, v_tilt);

                float h = v_position.y;

                vec3 pos;
                pos.x = v_position.x * v_pos_params.z;
                pos.y = v_position.x * v_pos_params.w;
                pos.z = h;
                pos *= v_style_params.x;

                pos.xy += v_pos_params.xy;

                float sc = 1.0 + 0.4789*tilt_len + 0.12*tilt_len * (1.0 - tilt_len);
                pos.xy += v_tilt * h * h / (sc);
                pos.z /= sc;

                float edge_x = v_pos_params.x * v_pos_params.x * 0.8;
                float edge_y = v_pos_params.y * v_pos_params.y * 0.8;

                color_params.x = h;
                color_params.y = min(1.0, (1.0 - max(abs(pos.x), abs(pos.y))) * 6.0);
                color_params.y = 0.25 * color_params.y + 0.75;

                color = mix(vec3(0.39, 0.54, 0.19), vec3(0.45, 0.53, 0.16), v_style_params.y);

                gl_Position = u_mvp * vec4(pos, 1.0);
            }
            `;

        let grass_frag_src =
            `
            precision mediump float;
                                
            varying vec2 color_params;  
            varying vec3 color;

        
            void main(void) {
                float y = color_params.x;
                float dim = mix(1.0, y, color_params.y);
                gl_FragColor = vec4(color * dim, 1.0);
            }
            `;


        let leaf_vert_src =
            `
            attribute vec2 v_position;

            uniform mat4 u_mvp;
            uniform mat3 u_rot;
            
            uniform vec4 u_color;

            varying vec4 color;
            varying float x;
            
            void main(void) {  

                vec3 pos;
                pos.x = v_position.x * 0.2;
                pos.y = v_position.y * 0.2;
                pos.z = v_position.y * v_position.y * 0.15;
            
                x = v_position.x;

                color = u_color;

                gl_Position = u_mvp * vec4(pos, 1.0);
            }
            `;

        let leaf_frag_src =
            `
            precision mediump float;
                                
            varying vec4 color;
            varying float x;
        
            void main(void) {
                vec4 c = color;

                c.rgb *= 0.85 + 0.15 * smoothstep(0.02, 0.03, abs(x));

                gl_FragColor = c;
            }
            `;


        let ground_vert_src =
            `
            attribute vec3 v_position;
        
            uniform mat4 u_mvp;
            uniform mat3 u_rot;
            
            varying vec3 color;
            varying vec3 pos;
            
            void main(void) {  
                pos = v_position;
                pos.z *= 0.1;

                float d = 0.15;

                float g = abs(cos(v_position.x * 1234.0) * sin(v_position.y*2562.0) *
                sin(v_position.z*12562.0));
                d *= 0.8 + 0.2 * g;
                
                d *= 1.0 - min(1.0, (1.0 - max(abs(pos.x), abs(pos.y))) * 10.0);

                color = vec3(1.0, 0.7, 0.4) * d;

                gl_Position = u_mvp * vec4(pos, 1.0);
            }
            `;

        let ground_frag_src =
            `
            precision mediump float;
                                
            varying vec3 color;
            varying vec3 pos;
        
            void main(void) {
                float f = 20.0;
                float a = smoothstep(-0.1, 0.0, pos.z + 0.01 * cos(f * pos.x) * cos(f * pos.y));
                gl_FragColor = vec4(color, 1.0) * a;
            }
            `;

        let surface_vert_src =
            `
            attribute vec3 v_position;
            attribute vec3 v_normal;
        
            uniform mat4 u_mvp;
            uniform mat3 u_rot;
            
            varying float shade;
            
            void main(void) {  
                vec3 pos = v_position;

                shade = 0.4 + 0.6 * abs(u_rot * v_normal).z;

                shade *= 0.3 + 0.7 * smoothstep(-0.9, 0.0, pos.z);

                gl_Position = u_mvp * vec4(pos, 1.0);
            }
            `;

        let surface_frag_src =
            `
            precision mediump float;
                      
            varying float shade;
            
            void main(void) {
                vec3 color = vec3(0.9);
                color *= sqrt(shade);

                gl_FragColor = vec4(color, 1.0);
            }
            `;





        let point_vert_src =
            `
            attribute vec3 v_pos;
            attribute float v_col;
            
            uniform mat4 u_mvp;
            
            uniform float u_size;
            uniform vec4 u_color0;
            uniform vec4 u_color1;
            
            varying mediump vec4 color;
                
            void main(void) {

                vec4 pos = u_mvp * vec4(v_pos, 1.0);
                
                color = mix(u_color0, u_color1, v_col);
                
                color *= 1.0 - smoothstep(0.85, 0.95, max(max(abs(v_pos.x), abs(v_pos.y)), abs(v_pos.z)));
            
                float size = u_size / pos.w;
                
                gl_Position = pos;
                gl_PointSize = max(2.0, size);
            }
            `;

        let point_frag_src =
            `
            precision mediump float;

            varying mediump vec4 color;
            
            void main(void) {
                highp vec2 xy = (gl_PointCoord - 0.5);
                highp float d_sq = dot(xy, xy);

                vec4 c = color;
                c.rgb *= 1.0 - 0.5*d_sq;
                float a = 1.0 - smoothstep(0.0, 0.25, d_sq);
            
                gl_FragColor = c * a;
            }
            `;


        let point_arrow_vert_src =
            `
            attribute vec3 v_pos;
            attribute vec3 v_vel;
            attribute float v_col;

            attribute vec2 v_position;
            
            uniform mat4 u_mvp;
            
            uniform vec4 u_line_arg;
            uniform vec4 u_color0;
            uniform vec4 u_color1;
            
            
            varying mediump vec4 color;
                
            void main(void) {

                vec4 pos0 = u_mvp * vec4(v_pos, 1.0);
                pos0.xyz *= (1.0 / max(0.00001, pos0.w));

                vec4 pos1 = u_mvp * vec4(v_pos + v_vel, 1.0);
                pos1.xyz *= (1.0 / max(0.00001, pos1.w));


                vec3 dir = pos1.xyz - pos0.xyz;
                vec2 ss_normal = normalize(dir.xy);
                vec2 ss_perp = vec2(ss_normal.y, -ss_normal.x);
            
                vec3 position = pos0.xyz + dir * v_position.x * u_line_arg.x;
                
                vec2 delta = (ss_perp) * u_line_arg.y * v_position.y;
                delta.x *= u_line_arg.z;

                position.xy += delta;

                color = mix(u_color0, u_color1, v_col);
                color *= 1.0 - smoothstep(0.9, 1.0, max(max(abs(v_pos.x), abs(v_pos.y)), abs(v_pos.z)));

                gl_Position = vec4(position, 1.0);
            }
            `;

        let point_arrow_frag_src =
            `
            varying mediump vec4 color;
            precision mediump float;
            
            void main(void) {
                gl_FragColor = color;
            }
            `;

        let marker_vert_src =
            `
            attribute vec2 v_pos;
            attribute float v_alpha;
            
            uniform mat4 u_mvp;
            uniform float u_size;
            uniform sampler2D u_history_tex;
                                     
            varying float alpha;

            void main(void) {

                vec4 data = texture2D(u_history_tex, v_pos);
                vec4 pos = u_mvp * vec4(data.xy, 0.0, 1.0);
                
                alpha = v_alpha;

                gl_PointSize = max(2.0, u_size);
                gl_Position = pos;
            }
            `;


        let marker_frag_src =
            `
            precision mediump float;
            
            varying float alpha;

            void main(void) {
                highp vec2 xy = (gl_PointCoord - 0.5);
                highp float d_sq = dot(xy, xy);

            
                float a = 1.0 - smoothstep(0.24, 0.25, d_sq);
            
                gl_FragColor = vec4(0.0, 0.0, 0.0, a * alpha);
            }
            `;


        let marker_trail_write_vert_src =
            `
            attribute vec2 v_pos;
            attribute vec3 v_val;

            varying highp vec3 val;
                                                        
            void main(void) {

                val = v_val;
                
                vec2 pos = v_pos * 2.0 - 1.0;

                gl_Position = vec4(pos, 0.0, 1.0);
                gl_PointSize = 1.0;
            }
            `;

        let marker_trail_write_frag_src =
            `
            precision highp float;

            varying highp vec3 val;
                                        
            void main(void) {
                gl_FragColor = vec4(val, 0.0);
            }
            `;


        let marker_trail_reset_vert_src =
            `
            attribute float v_y;
            attribute vec3 v_x_xy;

            varying highp vec2 val;
                                                        
            void main(void) {

                val = v_x_xy.yz;
                
                vec2 pos = vec2(v_x_xy.x, v_y) * 2.0 - 1.0;
                pos.y *= 1.1;
                gl_Position = vec4(pos, 0.0, 1.0);
            }
            `;

        let marker_trail_reset_frag_src =
            `
            precision mediump float;

            varying highp vec2 val;
                                        
            void main(void) {
                gl_FragColor = vec4(val, 0.0, 0.0);
            }
            `;


        let marker_trail_vert_src =
            `
            #define TEX_Y_STEP ${1 / marker_history_size}

            attribute vec3 v_uvt;
            attribute vec2 v_pos;
            attribute float v_alpha;

            uniform sampler2D u_history_tex;

            uniform mat4 u_mvp;
            uniform vec4 u_line_params;

            varying float alpha;
                                        
            void main(void) {

                vec2 loc0 = vec2(0.0, v_uvt.z) + v_pos;
                vec2 loc1 = vec2(0.0, v_uvt.z + TEX_Y_STEP) + v_pos;

                vec4 data0 = texture2D(u_history_tex, loc0);
                vec4 data1 = texture2D(u_history_tex, loc1);

                vec2 pos0 = data0.xy;
                vec2 pos1 = data1.xy;

                vec2 tan = normalize(pos1 - pos0);
                vec2 norm = vec2(-tan.y, tan.x);

                vec2 p = mix(pos0, pos1, v_uvt.x);
                p += norm * u_line_params.x * v_uvt.y;
                
                float z = 0.0;
                if (data0 == vec4(0.0) || data1 == vec4(0.0))
                    z = -2.0;

                alpha = v_alpha * v_uvt.z * 0.6;
                
                gl_Position = u_mvp * vec4(p, z, 1.0);
            }
            `;

        let marker_trail_vert_depth_src =
            `
            #define TEX_Y_STEP ${1 / marker_history_size}

            attribute vec3 v_uvt;
            attribute vec2 v_pos;
            attribute float v_alpha;

            uniform sampler2D u_history_tex;

            uniform mat4 u_mvp;
            uniform vec4 u_line_params;

            varying float alpha;
                                        
            void main(void) {

                vec2 loc0 = vec2(0.0, v_uvt.z) + v_pos;
                vec2 loc1 = vec2(0.0, v_uvt.z + TEX_Y_STEP) + v_pos;

                vec4 data0 = texture2D(u_history_tex, loc0);
                vec4 data1 = texture2D(u_history_tex, loc1);

                vec3 pos0 = data0.xyz;
                vec3 pos1 = data1.xyz;

                vec3 tan = normalize(pos1 - pos0);
                vec3 up = cross(normalize(cross(tan, vec3(0.0, 0.0, 1.0))), tan);
                vec3 side = cross(tan, up);
                vec3 norm = u_line_params.y != 0.0 ? side : up;

                vec3 p = mix(pos0, pos1, v_uvt.x);
                p += norm * u_line_params.x * v_uvt.y;
                p += u_line_params.y * up;
                
                float w = 1.0;
                if (data0 == vec4(0.0) || data1 == vec4(0.0))
                    w = -2.0;

                alpha = v_uvt.z * v_alpha * 0.4;

                alpha *= smoothstep(-0.2, -0.1, p.x) - smoothstep(1.1, 1.2, p.x);
                alpha *= smoothstep(-0.2, -0.1, p.y) - smoothstep(0.6 + 0.1, 0.6 + 0.2, p.y);
                
                gl_Position = u_mvp * vec4(p, w);
            }
            `;

        let marker_trail_frag_src =
            `
            precision mediump float;

            varying float alpha;
           
            void main(void) {
                gl_FragColor = vec4(0.0, 0.0, 0.0, alpha);
            }
            `;

        let arrow_vert_src =
            `
            attribute vec3 v_pos;
            attribute vec3 v_norm;
                
            uniform mat4 u_mvp;
            uniform mat3 u_rot;
            uniform float u_offset;
            
            varying mediump float shade;

            void main(void) {

                vec4 pos = vec4(v_pos, 1.0);

                if (pos.z > 0.0)
                    pos.z += u_offset;

                pos = u_mvp * pos;
                shade = 0.6 + 0.4 * max(0.0, (u_rot * v_norm).z);
        
                gl_Position = pos;
            }
            `;


        let plain_vert_src =
            `
            attribute vec3 v_pos;
            attribute vec3 v_norm;
                
            uniform mat4 u_mvp;
            uniform mat3 u_rot;
            
            varying mediump float shade;

            void main(void) {

                vec4 pos = u_mvp * vec4(v_pos, 1.0);
                shade = 0.6 + 0.4 * max(0.0, (u_rot * v_norm).z);
        
                gl_Position = pos;
            }
            `;

        let instanced_plain_vert_src =
            `
            attribute vec3 v_pos;
            attribute vec3 v_norm;

            attribute mat4 v_transform;
            attribute mat3 v_rot;

            varying mediump float shade;

            void main(void) {

                vec4 pos = v_transform * vec4(v_pos, 1.0);

                shade = 0.5 + 0.5 * max(0.0, (v_rot * v_norm).z);

                gl_Position = pos;
            }
            `;

        let plain_frag_src =
            `
            precision mediump float;

            uniform vec4 u_color;

            varying mediump float shade;
            
            void main(void) {
                vec4 color = u_color;
                color.rgb *= sqrt(shade);
                gl_FragColor = color;
            }
            `;

        let box_frag_src =
            `
            precision mediump float;

            uniform vec4 u_color;

            varying highp vec2 st;
            varying highp vec3 pos;
            varying highp float shade;
            
            void main(void) {
                vec4 color = u_color;
                color.rgb *= sqrt(shade) * (1.0 - 0.4*smoothstep(0.98, 0.99, max(abs(st.x), abs(st.y))));
                gl_FragColor = color;
            }
            `;

        let ball_vert_src =
            `
            attribute vec3 v_pos;
                
            uniform mat4 u_mvp;
            uniform mat3 u_rot;

            varying highp vec3 norm;
            varying highp float shade;

                
            void main(void) {

                norm = v_pos;
                shade = 0.4 + 0.6 * max(0.0, (u_rot * v_pos).z);

                gl_Position = u_mvp * vec4(v_pos, 1.0);
            }
            `;

        let ball_frag_src =
            `        
            varying highp vec3 norm;
            varying highp float shade;

            uniform highp vec3 u_box_dir;

            precision mediump float;

            float hash (vec3 st) {
                return fract(sin(dot(st,
                                    vec3(13.54353, 83.8981, 342.875345)))
                            * 43758.5453123);
            }

            void main(void) {

                vec3 n = normalize(norm);
        
                float a = 1.6;
                float b = 0.2;
                float c = 0.5;
                float d = 1.1;
            
                float p0 = d*n.x*n.x + c*n.y*n.y + n.z*n.z - 0.5 -cos(1.6*n.y)*cos(n.x)*a + b*n.x;
                float p1 = d*n.x*n.x + c*n.z*n.z + n.y*n.y - 0.5 -cos(1.6*n.z)*cos(n.x)*a - b*n.x;

                float p = max(abs(p0 + 1.0), abs(p1 + 1.0));
            
                float strip = p < 0.65 ? 1.0 : 0.0;
                float strip_c = 0.9 + -(p - 0.62) * 4.0;

                float v = hash(n) * 0.05 + 1.0;

                vec3 color = mix(vec3(0.92, 0.98, 0.18)*v, vec3(strip_c), strip);

                float dim = shade;
                dim *= 1.0 - 0.5 * max(0.0, dot(u_box_dir, norm));
                color *= sqrt(dim);

                gl_FragColor = vec4(color, 1.0);
            }
            `;

        let plain_sphere_vert_src =
            `
            attribute vec3 v_pos;
                
            uniform mat4 u_mvp;
            uniform mat3 u_rot;

            varying highp float shade;


            void main(void) {

                shade = 0.6 + 0.4 * max(0.0, (u_rot * v_pos).z);

                gl_Position = u_mvp * vec4(v_pos, 1.0);
            }
            `;

        let plain_sphere_frag_src =
            `        
            precision mediump float;

            uniform vec4 u_color;

            varying highp float shade;


            void main(void) {
                vec4 c = u_color;
                c.rgb *= shade;
                gl_FragColor = c;
            }
            `;



        let cardboard_vert_src =
            `
            attribute vec3 v_pos;
            attribute vec3 v_norm;
            attribute vec2 v_st;
                
            uniform mat4 u_mvp;
            uniform mat3 u_rot;

            varying highp vec2 st;
            varying highp vec3 pos;
            varying highp float shade;
            
            void main(void) {

                pos = v_pos;
                st = v_st;        
                shade = 0.6 + 0.4 * max(0.0, (u_rot * v_norm).z);

                gl_Position = u_mvp * vec4(v_pos, 1.0);
            }
            `;

        let cardboard_frag_src =
            `        
            varying highp vec2 st;
            varying highp vec3 pos;
            varying highp float shade;
            
            precision mediump float;

            void main(void) {

    
                float f = 100.0;

                float a = sqrt(shade);
                a *= 0.98 + 0.02 * (sin(st.x * f) > 0.8 ? 0.0 : 1.0);
                
                a *= 1.0 + 0.05 * step(0.98, max(abs(st.x), abs(st.y)));

                vec3 color = vec3(0.83, 0.64, 0.45) * 0.9;

                color *= a;

                float t = (1.0 - smoothstep(0.2, 0.22, abs(pos.y))) * smoothstep(0.4, 0.42, pos.z + 0.015 * cos(100.0*pos.y));
            
                float s = (1.0 - smoothstep(0.0, 0.02, abs(pos.y)));
                s += 0.5 * (smoothstep(0.98, 1.0, abs(pos.x)));

                s *= smoothstep(0.97, 0.99, pos.z);

                color *= 1.0 - s * 0.4 * (1.0 - t*0.9)  - 0.5*t;
                
                float h = min(1.0, (pos.z + 0.84)/0.5);
                color *= 0.5 + 0.5 * sqrt(sqrt(sqrt(h)));

                gl_FragColor = vec4(color, 1.0);
            }
            `;


        let floor_vert_src =
            `
            attribute vec3 v_pos;
            attribute vec3 v_norm;
            attribute vec2 v_st;
                
            uniform mat4 u_mvp;
            uniform mat3 u_rot;

            varying highp vec2 st;
            varying highp float shade;
            
            void main(void) {

                st = v_st;        
                shade = 0.9 + 0.1 * max(0.0, (u_rot * v_norm).z);

                gl_Position = u_mvp * vec4(v_pos, 1.0);
            }
            `;

        let floor_frag_src =
            `
            #extension GL_OES_standard_derivatives : enable

            varying mediump vec4 color;
            
            varying highp vec2 st;
            varying highp float shade;

            uniform highp vec2 u_shade_pos;
            
            precision mediump float;

            void main(void) {

                float s = shade;

                vec2 p = u_shade_pos + st.xy * 16.0;
                vec2 d = abs(p) - vec2(0.45);

                float ff = length(max(d,0.0)) + min(max(d.x,d.y),0.0);

                float shadow = smoothstep(0.05, 0.8, ff);
                shadow = 0.3 + 0.7 * sqrt(sqrt(sqrt(shadow)));

                float sx = 10.0 * fwidth(st.x);
                float sy = 10.0 * fwidth(st.y);

                float f = 64.0 * 3.1415926535;
                s *= 0.9 + 0.1 * (1.0 - smoothstep(1.0 - 2.0*sx,1.0 - sx, cos(st.x * f)));
                s *= 0.9 + 0.1 * (1.0 - smoothstep(1.0 - 2.0*sy,1.0 - sx, cos(st.y * f)));

                s *=  shadow;

                vec3 color = vec3(0.8);

                color *= s;

                float a = 1.0 - smoothstep(0.3, 0.5, abs(st.y));
            
    
                gl_FragColor = vec4(color * a, a);
            }
            `;

        let quad_vert_src =
            `
            attribute vec3 v_coords;
            attribute vec3 v_sta;
            
            uniform mat4 u_mvp;
            
            varying mediump vec3 pos;
            varying mediump vec3 sta;
                
            void main(void) {
                
                pos = v_coords;
                sta = v_sta;
            
                gl_Position = u_mvp * vec4(v_coords, 1.0);
            }
            `;

        let glow_frag_src =
            `
            precision mediump float;
                
            varying mediump vec3 sta;
            varying mediump vec3 pos;

            uniform highp vec2 u_pos_size;
            
            void main(void) {
                
                mediump float d = length(sta.xy);
                mediump float a = (1.0 - smoothstep(0.1, 1.0, d)) * sta.z;

                a *= abs(pos.x - u_pos_size.x) > u_pos_size.y ? 0.0 : 1.0;
                a *= abs(pos.y) > u_pos_size.y ? 0.0 : 1.0;
                a *= abs(pos.z) > u_pos_size.y ? 0.0 : 1.0;
                
                
                gl_FragColor = vec4(0.2, 0.2, 0.2, 1.0) * a;
            }
            `;

        // https://iquilezles.org/articles/sphereao
        let ball_shadow_frag_src =
            `
            precision mediump float;

            varying mediump vec3 sta;
            varying mediump vec3 pos;

            void main(void) {
                float sph_r = 1.0/3.0;
                vec3 dir =  vec3(-sta.xy, sta.z);
                float dir_l = length(dir);
                float nl = dir.z/dir_l;
                float h = dir_l * (1.0 / sph_r);

                float a = (nl*h + 1.0) / (h * h);
                a = a*a * 0.5/3.0;

                a = pos.z > 0.5 ? 0.0 : a;

                gl_FragColor = vec4(0.0, 0.0, 0.0, a);
            }
            `;


        let velocity_preamble_frag_src =
            `
            precision mediump float;

            uniform sampler2D u_vel_lut;
                
            vec4 velocity_color(vec2 v) {
                
                float s = length(v);

                return texture2D(u_vel_lut, vec2(s, 0));
            }
            `

        let velocity_grass_frag_src =
            `
            varying vec2 xy;

            uniform float u_t;

            void main(void) {

                float t = u_t;
                float x = xy.x * 1.5 / 1.1 + 2.0;
                float y = xy.y * 1.5 / 1.1 + 2.0;

                float vx = 1.0 + -1.5 * cos(t + y + cos(1.4 * t + 0.3 * x)) * sin(1.4 * t + 0.3 * x) - 5.0 * sin(2.0 * t + x + sin(y));
                float vy = 5.0 * (cos(t + y + cos(1.4 * y + 0.3 * x)) - cos(y) * sin(2.0 * t + x + sin(y)));

                gl_FragColor = velocity_color(vec2(vx * 0.08, vy * 0.08));
            }
            `;

        let velocity_boundary_frag_src =
            `
            varying vec2 xy;

            uniform sampler2D u_vel_tex;

            void main(void) {

                vec2 uv = xy;
                uv.y = -uv.y;
                uv = uv * 0.5 + 0.5;

                float v = 1.03 * texture2D(u_vel_tex, uv).a;
                gl_FragColor = velocity_color(vec2(v, 0.0));
            }
            `;

        let pressure_preamble_frag_src =
            `
            #extension GL_OES_standard_derivatives : enable

            precision mediump float;
                
            uniform vec3 u_pressure_map_params;

            vec4 pressure_color(float p) {
                
                vec4 cp = vec4(0.882, 0.173, 0.067, 1.0);
                vec4 cn = vec4(0.157, 0.522, 0.784, 1.0);

                float dx = dFdx(p);
                float dy = dFdy(p);
                float d = sqrt(dx*dx + dy*dy);

                float a = min(1.0, abs(p));

                a = a * a * (3.0 - 2.0 * a);

                float f = u_pressure_map_params.x;
                float l = fract(p * f);
                d *= f * u_pressure_map_params.z;
                
                a += u_pressure_map_params.y * (smoothstep(0.5 - d * 2.0, 0.5 - d, l) - smoothstep(0.5 + d, 0.5 + d * 2.0, l));
                a = min(1.0, a);
                
                return (p > 0.0 ? cp : cn) * a;
            }
            `
        let pressure_manual_frag_src =
            `
            varying vec2 xy;

            uniform vec4 u_pos0;
            uniform vec4 u_pos1;
            uniform vec4 u_pos2;
            uniform vec4 u_pos3;
            uniform vec2 u_scale_shift;

            float map(vec2 pos, vec2 center, float radius, float strength) {
            
                float d = length(pos - center) / radius;
                d = clamp(d, 0.0, 1.0);

                return strength * (1.0 - d*d*(3.0-2.0*d));
            }

            void main(void) {

                float p = 0.0;
                p += map(xy, u_pos0.xy, u_pos0.z, u_pos0.w);
                p += map(xy, u_pos1.xy, u_pos1.z, u_pos1.w);
                p += map(xy, u_pos2.xy, u_pos2.z, u_pos2.w);
                p += map(xy, u_pos3.xy, u_pos3.z, u_pos3.w);

                gl_FragColor = pressure_color(p * u_scale_shift.x + u_scale_shift.y);
            }
            `;


        let FVM_mesh_val_vert_src =
            `
            attribute vec2 v_pos;
            attribute float v_val;
            
            uniform mat4 u_mvp;
            uniform vec2 u_scale_offset;

            varying mediump float val;
                
            void main(void) {
                val = v_val * u_scale_offset.x + u_scale_offset.y;
            
                gl_Position = u_mvp * vec4(v_pos, 0.0, 1.0);
            }
            `;


        let FVM_mesh_pressure_frag_src =
            `
            precision mediump float;
                
            varying mediump float val;

            void main(void) {
     
                gl_FragColor = pressure_color(val);
            }
            `;

        let FVM_mesh_velocity_frag_src =
            `
            precision mediump float;
                
            varying mediump float val;

            uniform sampler2D u_vel_lut;


            void main(void) {
     
                gl_FragColor = texture2D(u_vel_lut, vec2(val, 0));
            }
            `;

        let texture_velocity_arrow_vert_src =
            `
            attribute vec2 v_pos;
            attribute vec2 v_position;
            
            uniform vec4 u_world_map;
            uniform vec4 u_sampling_map;
            uniform mat4 u_mvp;
            uniform vec2 u_pixel_scale;
            uniform float u_vel_scale;

            uniform sampler2D u_tex;

            varying vec3 v_uv_pixel;
                                        
            void main(void) {

                vec2 sampling_location = v_pos * u_sampling_map.xy + u_sampling_map.zw;
                vec2 velocity = texture2D(u_tex, sampling_location).rg;

                vec2 pos = v_pos * u_world_map.xy + u_world_map.zw;

                vec2 dir = velocity * u_vel_scale;
                vec2 normal = dir;
                vec2 perp = vec2(dir.y, -dir.x);
            
                vec2 position = pos + normal * v_position.x + perp * v_position.y;

                v_uv_pixel.x = v_position.x * length(dir * u_pixel_scale);
                v_uv_pixel.y = v_position.y * length(perp * u_pixel_scale);
                v_uv_pixel.z = length(dir * u_pixel_scale);
                
                gl_Position = u_mvp * vec4(position, 0.0, 1.0);
            }
            `;

        let texture_velocity_arrow_frag_src =
            `
            precision mediump float;
                
            varying vec3 v_uv_pixel;
            uniform vec4 u_color;

            void main(void) {

                vec2 p = vec2(v_uv_pixel.x, abs(v_uv_pixel.y));

                vec2 p0 = vec2(0.0, 0.0);
                vec2 p1 = vec2(v_uv_pixel.z, 0.0);
                vec2 p2 = vec2(v_uv_pixel.z * 0.8, v_uv_pixel.z * 0.2);

                float h0 = clamp(dot(p - p0, p1 - p0)/dot(p1 - p0, p1 - p0), 0.0, 1.0);
                float l0 = length(p - p0 - (p1 - p0) * h0);

                float h1 = clamp(dot(p - p1, p2 - p1)/dot(p2 - p1, p2 - p1), 0.0, 1.0);
                float l1 = length(p - p1 - (p2 - p1) * h1);

                float l = 1.0 - smoothstep(1.0, 2.0, min(l0, l1));
                gl_FragColor = u_color * l;
            }
            `;

        let landscape_vert_src =
            `
            attribute vec2 v_pos;
                
            uniform mat4 u_mvp;

            uniform vec4 u_pos0;
            uniform vec4 u_pos1;
            uniform vec4 u_pos2;
            uniform vec4 u_pos3;
            
            varying highp float p;

            float map(vec2 pos, vec2 center, float radius, float strength) {
                float d = length(pos - center) / radius;
                d = clamp(d, 0.0, 1.0);

                return strength * (1.0 - d*d*(3.0-2.0*d));
            }        
                
            void main(void) {

                float pressure = 0.0;
                pressure += map(v_pos, u_pos0.xy, u_pos0.z, u_pos0.w);
                pressure += map(v_pos, u_pos1.xy, u_pos1.z, u_pos1.w);
                pressure += map(v_pos, u_pos2.xy, u_pos2.z, u_pos2.w);
                pressure += map(v_pos, u_pos3.xy, u_pos3.z, u_pos3.w);

                p = pressure;
                
                gl_Position = u_mvp * vec4(v_pos, p * 0.25, 1.0);
            }
            `;

        let landscape_frag_src =
            `        
            precision mediump float;

            varying highp float p;

            void main(void) {

                vec4 c = pressure_color(p);
                c += vec4(0.9,0.9,0.9,1.0) * (1.0 - c.a);
    
                gl_FragColor = c;
            }
            `;

        let landscape_edge_vert_src =
            `
            attribute vec2 v_pos;
            attribute vec2 v_uv;
                
            uniform mat4 u_mvp;
  
            varying highp vec2 uv;
                
            void main(void) {
                
                uv = v_uv;

                gl_Position = u_mvp * vec4(v_pos, 0.0, 1.0);
            }
            `;

        let landscape_edge_frag_src =
            `        
            precision mediump float;

            varying highp vec2 uv;

            void main(void) {

                vec4 c = vec4(0.9,0.9,0.9,1.0);

                float a = (1.0 - smoothstep(0.0, 1.0, abs(uv.x))) * 
                          (1.0 - smoothstep(0.0, 1.0, abs(uv.y)));

                c *= a;
                
                gl_FragColor = c;
            }
            `;

        //FDM

        let FDM_vert_src =
            `
            attribute vec2 v_position;

            varying vec2 pos;

            uniform vec2 u_offset;

            void main(void) {

                pos = v_position + u_offset;

                gl_Position = vec4(v_position * 2.0 - 1.0, 0.0, 1.0);
            }
            `;

        let FDM_quad_vert_src =
            `
            attribute vec2 v_position;

            varying vec2 pos;

            uniform vec4 u_map;

            void main(void) {

                pos = v_position * u_map.xy + u_map.zw;

                gl_Position = vec4(v_position * 2.0 - 1.0, 0.0, 1.0);
            }
            `;



        const FDM_preamble = `
            #define TDX ${1.0 / FDM_width}
            #define TDY ${1.0 / FDM_height}
            #define DX ${FDM_dx}
            #define DY ${FDM_dy}
            #define DX2 ${FDM_dx * FDM_dx}
            #define DY2 ${FDM_dy * FDM_dy}
            #define rho 1.0
            
            uniform highp float u_mu;
            uniform highp float u_dt;

            `;

        const FDM_no_obstacle_preamble = `
            highp float uv_clamp(highp vec2 pos) {
                return 1.0;
            }
        `

        const FDM_plate_obstacle_preamble = `

            uniform highp vec3 u_obstacle;

            highp float uv_clamp(highp vec2 pos) {
                if (abs(pos.y - 0.5) < u_obstacle.z && pos.x > u_obstacle.x && pos.x < u_obstacle.y)
                    return 0.0;
                return 1.0;
            }
        `

        let FDM_init_split_velocity_frag_src =
            `
            precision highp float;

            varying vec2 pos;

            void main(void) {
                
                float u = pos.y > 0.5 ? 1.0 : 0.3;

                gl_FragColor = vec4(u, 0.0, 0.0, 1.0);
            }
            `;

        let FDM_init_eddy_velocity_frag_src =
            `
            precision highp float;

            varying vec2 pos;

            void main(void) {

                vec2 pp = pos;
                pp -= 0.5;
                pp.x *= 3.0;
                pp.x += 0.005 * cos(pp.y * 60.0) * cos(pp.x * 60.0);

                float r = length(pp);
                float s = 1.0 - smoothstep(0.45, 0.48, r); 
                r *= 12.0;
                float vv = s * 15.0 * (r < 1.0 ? r : 1.0/(r*r));

                float u = vv * pp.y/r;
                float v = -vv * pp.x/r;

                gl_FragColor = vec4(u, v, 0.0, 1.0);
            }
            `;

        let FDM_init_layers_velocity_frag_src =
            `
            precision highp float;

            varying vec2 pos;

            void main(void) {

                float u = abs(pos.y - 0.5) > 0.04 ? 1.0 : 0.3;

                gl_FragColor = vec4(u, 0.0, 0.0, 1.0);
            }
            `;

        let FDM_init_plate_velocity_frag_src =
            `
            precision highp float;

            varying vec2 pos;

            void main(void) {
                
                float u = 1.0 * uv_clamp(pos);

                gl_FragColor = vec4(u, 0.0, 0.0, 1.0);
            }
            `;

        let FDM_init_boundary_velocity_frag_src =
            `
            precision highp float;

            varying vec2 pos;

            uniform vec2 u_seed;

            void main(void) {
                
                float yy = (pos.y - TDY*0.5) * 2.5;
                float u = 1.0-(2.0*(1.0/(1.0+exp(yy*2.0))));
                float v = 0.0;


                if (pos.y > 10.0 * TDY) {
                    float mask = max(0.0, 1.0 - 1.2 * u);
                    float s = sin(yy * u_seed.x + u_seed.y + pos.x * pos.y * 200.0 + pos.x * 20.0);
                    u += mask * 2.0 * s * s * s * s;
                    v += mask * (0.1 + 0.25 * cos(yy * u_seed.x * 2.0 + u_seed.y));
                }


                if (pos.y < 2.0 * TDY)
                    u = v = 0.0;

                gl_FragColor = vec4(u, v, 0.0, 1.0);
            }
            `;

        let FDM_update_velocity_frag_src =
            `
            precision highp float;

            uniform sampler2D u_vel_tex;

            varying vec2 pos;

            void main(void) {
                
                vec2 uv0 = texture2D(u_vel_tex, pos).rg;

                vec2 uvw = texture2D(u_vel_tex, pos - vec2(TDX, 0.0)).rg;
                vec2 uve = texture2D(u_vel_tex, pos + vec2(TDX, 0.0)).rg;
                vec2 uvn = texture2D(u_vel_tex, pos - vec2(0.0, TDY)).rg;
                vec2 uvs = texture2D(u_vel_tex, pos + vec2(0.0, TDY)).rg;

                vec2 uvww = texture2D(u_vel_tex, pos - vec2(2.0*TDX, 0.0)).rg;
                vec2 uvee = texture2D(u_vel_tex, pos + vec2(2.0*TDX, 0.0)).rg;
                vec2 uvnn = texture2D(u_vel_tex, pos - vec2(0.0, 2.0*TDY)).rg;
                vec2 uvss = texture2D(u_vel_tex, pos + vec2(0.0, 2.0*TDY)).rg;

                vec2 dduv = (uvw - 2.0 * uv0 + uve) / (DX * DX) +
                            (uvn - 2.0 * uv0 + uvs) / (DY * DY);

                float duu = (max(0.0, uv0.x) * (2.0*uve.x + 3.0*uv0.x - 6.0*uvw.x + uvww.x) + min(0.0, uv0.x) * (-uvee.x + 6.0*uve.x - 3.0*uv0.x - 2.0*uvw.x)) / (6.0 * DX);
                float dvu = (max(0.0, uv0.y) * (2.0*uvs.x + 3.0*uv0.x - 6.0*uvn.x + uvnn.x) + min(0.0, uv0.y) * (-uvss.x + 6.0*uvs.x - 3.0*uv0.x - 2.0*uvn.x)) / (6.0 * DY);
                float duv = (max(0.0, uv0.x) * (2.0*uve.y + 3.0*uv0.y - 6.0*uvw.y + uvww.y) + min(0.0, uv0.x) * (-uvee.y + 6.0*uve.y - 3.0*uv0.y - 2.0*uvw.y)) / (6.0 * DX);
                float dvv = (max(0.0, uv0.y) * (2.0*uvs.y + 3.0*uv0.y - 6.0*uvn.y + uvnn.y) + min(0.0, uv0.y) * (-uvss.y + 6.0*uvs.y - 3.0*uv0.y - 2.0*uvn.y)) / (6.0 * DY);

                vec2 rhs = (dduv) * (u_mu / rho);
                rhs.x -= duu + dvu;
                rhs.y -= duv + dvv;

                vec2 uv = uv0 + rhs * u_dt;

                uv = min(max(vec2(-3.0), uv), vec2(3.0));

                uv *= uv_clamp(pos);

                gl_FragColor = vec4(uv, 0.0, 1.0);
            }
            `;

        let FDM_pressure_iter_frag_src =
            `
            precision highp float;

            uniform sampler2D u_vel_tex;
            uniform sampler2D u_p_tex;

            varying vec2 pos;

            void main(void) {
                
                vec2 uv00 = texture2D(u_vel_tex, pos + vec2(0.0, 0.0)).rg;
                vec2 uv10 = texture2D(u_vel_tex, pos + vec2(TDX, 0.0)).rg;
                vec2 uv01 = texture2D(u_vel_tex, pos + vec2(0.0, +TDY)).rg;
                vec2 uv11 = texture2D(u_vel_tex, pos + vec2(TDX, +TDY)).rg;

                float divuv = (uv10.x + uv11.x - uv00.x - uv01.x) / (2.0 * DX) +
                                (uv01.y + uv11.y - uv00.y - uv10.y) / (2.0 * DY);

                float pw = texture2D(u_p_tex, pos - vec2(TDX, 0.0)).r;
                float pe = texture2D(u_p_tex, pos + vec2(TDX, 0.0)).r;
                float pn = texture2D(u_p_tex, pos - vec2(0.0, TDY)).r;
                float ps = texture2D(u_p_tex, pos + vec2(0.0, TDY)).r;

                float rhs = divuv / u_dt * DX2 * DY2;

                rhs -= (pw + pe) * DY2;
                rhs -= (pn + ps) * DX2;

                float x_coeff = 2.0;
                float y_coeff = 2.0;

                rhs /= -y_coeff * DY2 - x_coeff * DX2;


                gl_FragColor = vec4(rhs, uv00, 0.0);
            }
            `;


        let FDM_finish_velocity_frag_src =
            `
            precision highp float;

            uniform sampler2D u_vel_tex;
            uniform sampler2D u_p_tex;

            varying vec2 pos;

            void main(void) {


                vec4 t11 = texture2D(u_p_tex, pos + vec2( 0.0, 0.0));


                float p00 = texture2D(u_p_tex, pos + vec2(-TDX, -TDY)).r;
                float p10 = texture2D(u_p_tex, pos + vec2( 0.0, -TDY)).r;
                float p01 = texture2D(u_p_tex, pos + vec2(-TDX, 0.0)).r;
                float p11 = t11.r;


                vec2 uv = t11.gb;
                uv.x -= u_dt * (p10 + p11 - p00 - p01) / (2.0 * DX);
                uv.y -= u_dt * (p01 + p11 - p00 - p10) / (2.0 * DY);


                gl_FragColor = vec4(uv, 0.0, 0.0);
            } 
            `;


        let FDM_velocity_quad_frag_src =
            `
            precision mediump float;

            uniform sampler2D u_texture;
            uniform float u_scale;

            varying vec2 pos;

            void main(void) {

                gl_FragColor = velocity_color(texture2D(u_texture, pos).rg * u_scale);
            }
            `;

        let FDM_velocity_quad_bilerp_frag_src =
            `
            #define SX ${FDM_width}
            #define SY ${FDM_height}
            #define INV_SX ${1.0 / FDM_width}
            #define INV_SY ${1.0 / FDM_height}

            precision mediump float;

            uniform sampler2D u_texture;
            uniform float u_scale;

            varying vec2 pos;

            void main(void) {

                vec2 p = pos * vec2(SX, SY) - vec2(0.5);
                vec2 p00 = floor(p);
                vec2 t = p - p00;

                vec2 st00 = (p00 + 0.5) * vec2(INV_SX, INV_SY);
                vec2 st11 = (p00 + 1.5) * vec2(INV_SX, INV_SY);

                vec2 c00 = texture2D(u_texture, vec2(st00.x, st00.y)).rg;
                vec2 c01 = texture2D(u_texture, vec2(st00.x, st11.y)).rg;
                vec2 c10 = texture2D(u_texture, vec2(st11.x, st00.y)).rg;
                vec2 c11 = texture2D(u_texture, vec2(st11.x, st11.y)).rg;

                vec2 c = mix(mix(c00, c10, t.x), mix(c01, c11, t.x), t.y);

                gl_FragColor = velocity_color(c * u_scale);
            }
            `;


        let simple_shader = new Shader(gl,
            full_screen_vert_src,
            simple_frag_src,
            ["v_position"],
            ["u_map"]);

        let velocity_grass_shader = new Shader(gl,
            full_screen_vert_src,
            velocity_preamble_frag_src + velocity_grass_frag_src,
            ["v_position"],
            ["u_aspect", "u_t", "u_vel_lut"]);

        let velocity_boundary_shader = new Shader(gl,
            full_screen_vert_src,
            velocity_preamble_frag_src + velocity_boundary_frag_src,
            ["v_position"],
            ["u_aspect", "u_vel_tex", "u_vel_lut"]);

        let pressure_manual_shader = new Shader(gl,
            full_screen_vert_src,
            pressure_preamble_frag_src + pressure_manual_frag_src,
            ["v_position"],
            ["u_aspect", "u_pos0", "u_pos1", "u_pos2", "u_pos3", "u_pressure_map_params", "u_scale_shift"]);


        let sky_shader = new Shader(gl,
            full_screen_vert_src,
            sky_frag_src,
            ["v_position"],
            ["u_aspect", "u_rot"]);

        let grass_shader = new Shader(gl,
            grass_vert_src,
            grass_frag_src,
            ["v_position", "v_pos_params", "v_style_params", "v_tilt"],
            ["u_mvp", "u_rot"]);

        let leaf_shader = new Shader(gl,
            leaf_vert_src,
            leaf_frag_src,
            ["v_position", "v_pos_params"],
            ["u_mvp", "u_rot", "u_color"]);

        let ground_shader = new Shader(gl,
            ground_vert_src,
            ground_frag_src,
            ["v_position"],
            ["u_mvp", "u_rot"]);

        let surface_shader = new Shader(gl,
            surface_vert_src,
            surface_frag_src,
            ["v_position", "v_normal"],
            ["u_mvp", "u_rot"]);

        let point_shader = new Shader(gl,
            point_vert_src,
            point_frag_src,
            ["v_pos", "v_col"],
            ["u_mvp", "u_size", "u_color0", "u_color1"]);

        let point_arrow_shader = new Shader(gl,
            point_arrow_vert_src,
            point_arrow_frag_src,
            ["v_pos", "v_vel", "v_col", "v_position"],
            ["u_mvp", "u_line_arg", "u_color0", "u_color1"]);


        let marker_trail_reset_shader = new Shader(gl,
            marker_trail_reset_vert_src,
            marker_trail_reset_frag_src,
            ["v_x_xy", "v_y"],
            []);


        let marker_trail_write_shader = new Shader(gl,
            marker_trail_write_vert_src,
            marker_trail_write_frag_src,
            ["v_val", "v_pos"],
            []);


        let marker_trail_shader = new Shader(gl,
            marker_trail_vert_src,
            marker_trail_frag_src,
            ["v_uvt", "v_pos", "v_alpha"],
            ["u_mvp", "u_line_params", "u_history_tex"]);

        let marker_trail_shader_depth = new Shader(gl,
            marker_trail_vert_depth_src,
            marker_trail_frag_src,
            ["v_uvt", "v_pos", "v_alpha"],
            ["u_mvp", "u_line_params", "u_history_tex"]);

        let marker_shader = new Shader(gl,
            marker_vert_src,
            marker_frag_src,
            ["v_pos", "v_alpha"],
            ["u_mvp", "u_size", "u_history_tex"]);

        let ball_shader = new Shader(gl,
            ball_vert_src,
            ball_frag_src,
            ["v_pos"],
            ["u_mvp", "u_rot", "u_box_dir"]);

        let plain_sphere_shader = new Shader(gl,
            plain_sphere_vert_src,
            plain_sphere_frag_src,
            ["v_pos"],
            ["u_mvp", "u_rot", "u_color"]);

        let box_shader = new Shader(gl,
            cardboard_vert_src,
            box_frag_src,
            ["v_pos", "v_norm", "v_st"],
            ["u_mvp", "u_rot", "u_color"]);


        let plain_shader = new Shader(gl,
            plain_vert_src,
            plain_frag_src,
            ["v_pos", "v_norm"],
            ["u_mvp", "u_rot", "u_color"]);

        let arrow_shader = new Shader(gl,
            arrow_vert_src,
            plain_frag_src,
            ["v_pos", "v_norm"],
            ["u_mvp", "u_rot", "u_offset", "u_color"]);

        let instanced_plain_shader = new Shader(gl,
            instanced_plain_vert_src,
            plain_frag_src,
            ["v_pos", "v_norm", "v_transform", "v_rot"],
            ["u_color"]);

        let cardboard_shader = new Shader(gl,
            cardboard_vert_src,
            cardboard_frag_src,
            ["v_pos", "v_norm", "v_st"],
            ["u_mvp", "u_rot"]);

        let floor_shader = new Shader(gl,
            floor_vert_src,
            floor_frag_src,
            ["v_pos", "v_norm", "v_st"],
            ["u_mvp", "u_rot", "u_shade_pos"]);

        let glow_shader = new Shader(gl,
            quad_vert_src,
            glow_frag_src,
            ["v_coords", "v_sta"],
            ["u_mvp", "u_pos_size"]);

        let ball_shadow_shader = new Shader(gl,
            quad_vert_src,
            ball_shadow_frag_src,
            ["v_coords", "v_sta"],
            ["u_mvp"]);

        let FVM_mesh_pressure_shader = new Shader(gl,
            FVM_mesh_val_vert_src,
            pressure_preamble_frag_src + FVM_mesh_pressure_frag_src,
            ["v_pos", "v_val"],
            ["u_mvp", "u_scale_offset", "u_pressure_map_params"]);

        let FVM_mesh_velocity_shader = new Shader(gl,
            FVM_mesh_val_vert_src,
            FVM_mesh_velocity_frag_src,
            ["v_pos", "v_val"],
            ["u_mvp", "u_rot", "u_scale_offset", "u_vel_lut"]);


        let texture_velocity_arrow_shader = new Shader(gl,
            texture_velocity_arrow_vert_src,
            texture_velocity_arrow_frag_src,
            ["v_pos", "v_position"],
            ["u_world_map", "u_sampling_map", "u_mvp", "u_pixel_scale", "u_vel_scale", "u_tex", "u_color"]);

        let landscape_shader = new Shader(gl,
            landscape_vert_src,
            pressure_preamble_frag_src + landscape_frag_src,
            ["v_pos"],
            ["u_mvp", "u_pos0", "u_pos1", "u_pos2", "u_pos3", "u_pressure_map_params"]);

        let landscape_edge_shader = new Shader(gl,
            landscape_edge_vert_src,
            landscape_edge_frag_src,
            ["v_pos", "v_uv"],
            ["u_mvp"]);

        let FDM_init_split_velocity_shader = new Shader(gl,
            FDM_vert_src,
            FDM_preamble + FDM_no_obstacle_preamble + FDM_init_split_velocity_frag_src,
            ["v_position"],
            ["u_offset"]);

        let FDM_init_eddy_velocity_shader = new Shader(gl,
            FDM_vert_src,
            FDM_preamble + FDM_no_obstacle_preamble + FDM_init_eddy_velocity_frag_src,
            ["v_position"],
            ["u_offset"]);

        let FDM_init_layers_velocity_shader = new Shader(gl,
            FDM_vert_src,
            FDM_preamble + FDM_no_obstacle_preamble + FDM_init_layers_velocity_frag_src,
            ["v_position"],
            ["u_offset"]);

        let FDM_init_plate_velocity_shader = new Shader(gl,
            FDM_vert_src,
            FDM_preamble + FDM_plate_obstacle_preamble + FDM_init_plate_velocity_frag_src,
            ["v_position"],
            ["u_offset"]);

        let FDM_init_boundary_velocity_shader = new Shader(gl,
            FDM_vert_src,
            FDM_preamble + FDM_no_obstacle_preamble + FDM_init_boundary_velocity_frag_src,
            ["v_position"],
            ["u_offset", "u_seed"]);


        let FDM_update_velocity_shader = new Shader(gl,
            FDM_vert_src,
            FDM_preamble + FDM_no_obstacle_preamble + FDM_update_velocity_frag_src,
            ["v_position"],
            ["u_offset", "u_mu", "u_dt", "u_vel_tex"]);

        let FDM_update_velocity_plate_shader = new Shader(gl,
            FDM_vert_src,
            FDM_preamble + FDM_plate_obstacle_preamble + FDM_update_velocity_frag_src,
            ["v_position"],
            ["u_offset", "u_mu", "u_dt", "u_obstacle", "u_vel_tex"]);


        let FDM_pressure_iter_shader = new Shader(gl,
            FDM_vert_src,
            FDM_preamble + FDM_pressure_iter_frag_src,
            ["v_position"],
            ["u_offset", "u_dt", "u_vel_tex", "u_p_tex"]);


        let FDM_finish_velocity_shader = new Shader(gl,
            FDM_vert_src,
            FDM_preamble + FDM_no_obstacle_preamble + FDM_finish_velocity_frag_src,
            ["v_position"],
            ["u_offset", "u_dt", "u_vel_tex", "u_p_tex"]);


        let FDM_finish_velocity_plate_shader = new Shader(gl,
            FDM_vert_src,
            FDM_preamble + FDM_plate_obstacle_preamble + FDM_finish_velocity_frag_src,
            ["v_position"],
            ["u_offset", "u_dt", "u_vel_tex", "u_obstacle", "u_p_tex"]);


        let FDM_velocity_quad_shader = new Shader(gl,
            FDM_quad_vert_src,
            velocity_preamble_frag_src + FDM_velocity_quad_frag_src,
            ["v_position"],
            ["u_map", "u_texture", "u_vel_lut", "u_scale"]);

        let FDM_velocity_quad_bilerp_shader = new Shader(gl,
            FDM_quad_vert_src,
            velocity_preamble_frag_src + FDM_velocity_quad_bilerp_frag_src,
            ["v_position"],
            ["u_map", "u_texture", "u_vel_lut", "u_scale"]);

        let prev_width, prev_height;

        let viewport_w = 0;
        let viewport_h = 0;

        this.has_float_ext = float_ext;

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

            gl.disable(gl.CULL_FACE);

            gl.enable(gl.DEPTH_TEST);
            gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

            viewport_w = Math.round(width);
            viewport_h = Math.round(height);
        }

        this.viewport = function (x, y, w, h) {
            gl.viewport(x * scale, y * scale, w * scale, h * scale);
        }


        this.finish = function () {
            gl.flush();
            return gl.canvas;
        }

        let offscreen_width;
        let offscreen_height;
        let offscreen_texture;

        const offscreen_framebuffer = gl.createFramebuffer();

        this.begin_offscreen = function (width, height) {

            gl.bindFramebuffer(gl.FRAMEBUFFER, offscreen_framebuffer);

            if (width != offscreen_width || height != offscreen_height) {

                offscreen_texture = gl.createTexture();
                gl.bindTexture(gl.TEXTURE_2D, offscreen_texture);

                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.FLOAT, null);


                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

                offscreen_width = width;
                offscreen_height = height;

                gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, offscreen_texture, 0);
            }

            gl.viewport(0, 0, width, height);

            gl.clearColor(0.0, 0.0, 0.0, 0.0);
            gl.clear(gl.COLOR_BUFFER_BIT);

        }

        this.finish_offscreen = function () {

            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        }

        function create_render_target(w, h, smode = gl.CLAMP_TO_EDGE, tmode = gl.CLAMP_TO_EDGE, filter = true) {

            let framebuffer = gl.createFramebuffer();
            let texture = gl.createTexture();

            gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
            gl.bindTexture(gl.TEXTURE_2D, texture);

            let type = gl.FLOAT;

            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, type, null);

            let mode = filter && linear_filtering ? gl.LINEAR : gl.NEAREST;

            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, mode);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, mode);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, smode);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, tmode);

            gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);

            return [framebuffer, texture];
        }

        this.create_FDM_state = function (mode) {

            let r = {};
            r.p_framebuffers = [];
            r.p_textures = [];
            r.v_framebuffers = [];
            r.v_textures = [];
            r.mode = mode;
            r.index = 0;

            for (let i = 0; i < 2; i++) {
                let target = create_render_target(FDM_width, FDM_height);

                r.p_framebuffers[i] = target[0];
                r.p_textures[i] = target[1];
            }

            for (let i = 0; i < 2; i++) {
                let target = create_render_target(FDM_width, FDM_height);

                r.v_framebuffers[i] = target[0];
                r.v_textures[i] = target[1];
            }

            gl.viewport(0, 0, FDM_width, FDM_height);
            gl.disable(gl.BLEND);

            for (let i = 0; i < 2; i++) {
                gl.bindFramebuffer(gl.FRAMEBUFFER, r.p_framebuffers[i]);
                gl.clearColor(0.0, 0.0, 0.0, 0.0);
                gl.clear(gl.COLOR_BUFFER_BIT);
            }


            let shader;

            if (mode === "split")
                shader = FDM_init_split_velocity_shader;
            else if (mode === "eddy")
                shader = FDM_init_eddy_velocity_shader;
            else if (mode === "layers")
                shader = FDM_init_layers_velocity_shader;
            else if (mode === "obstacle")
                shader = FDM_init_plate_velocity_shader;
            else if (mode === "boundary")
                shader = FDM_init_boundary_velocity_shader;

            gl.useProgram(shader.shader);
            gl.disable(gl.SCISSOR_TEST);

            gl.bindBuffer(gl.ARRAY_BUFFER, full_screen_vertex_buffer);

            gl.enableVertexAttribArray(shader.attributes["v_position"]);
            gl.vertexAttribPointer(shader.attributes["v_position"], 2, gl.FLOAT, false, 0, 0);


            gl.uniform2f(shader.uniforms["u_seed"], 15, 0);


            for (let i = 0; i < 2; i++) {
                gl.bindFramebuffer(gl.FRAMEBUFFER, r.v_framebuffers[i]);
                gl.clearColor(0.0, 0.0, 0.0, 0.0);
                gl.clear(gl.COLOR_BUFFER_BIT);
                gl.drawArrays(gl.TRIANGLES, 0, 3);
            }


            gl.bindTexture(gl.TEXTURE_2D, null);
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);

            return r;
        }

        this.update_FDM_state = function (state, dt, time, mu, pressure_iterations, obstacle) {

            let prev_index = state.index;
            let current_index = (state.index + 1) & 1;

            state.index = current_index;

            gl.disable(gl.BLEND);


            gl.viewport(0, 0, FDM_width, FDM_height);

            gl.enable(gl.SCISSOR_TEST);
            gl.scissor(2, 2, FDM_width - 3, FDM_height - 3);

            gl.bindBuffer(gl.ARRAY_BUFFER, full_screen_vertex_buffer);

            {

                gl.bindFramebuffer(gl.FRAMEBUFFER, state.v_framebuffers[current_index]);

                let shader = state.mode === "obstacle" ? FDM_update_velocity_plate_shader : FDM_update_velocity_shader;

                gl.useProgram(shader.shader);

                gl.uniform2f(shader.uniforms["u_offset"], 0, 0);
                gl.enableVertexAttribArray(shader.attributes["v_position"]);
                gl.vertexAttribPointer(shader.attributes["v_position"], 2, gl.FLOAT, false, 0, 0);

                gl.activeTexture(gl.TEXTURE0);
                gl.bindTexture(gl.TEXTURE_2D, state.v_textures[prev_index]);
                gl.uniform1i(shader.uniforms["u_vel_tex"], 0);

                gl.uniform1f(shader.uniforms["u_dt"], dt);
                gl.uniform1f(shader.uniforms["u_mu"], mu);

                if (state.mode === "obstacle")
                    gl.uniform3fv(shader.uniforms["u_obstacle"], obstacle);


                gl.drawArrays(gl.TRIANGLES, 0, 3);
            }

            gl.scissor(1, 1, FDM_width - 2, FDM_height - 2);

            for (let i = 0; i < pressure_iterations; i++) {

                let src = (i + 0) & 1;
                let dst = (i + 1) & 1;

                gl.bindFramebuffer(gl.FRAMEBUFFER, state.p_framebuffers[dst]);

                let shader = FDM_pressure_iter_shader;
                gl.useProgram(shader.shader);

                gl.uniform2f(shader.uniforms["u_offset"], 0, 0);
                gl.enableVertexAttribArray(shader.attributes["v_position"]);
                gl.vertexAttribPointer(shader.attributes["v_position"], 2, gl.FLOAT, false, 0, 0);

                gl.activeTexture(gl.TEXTURE0);
                gl.bindTexture(gl.TEXTURE_2D, state.v_textures[current_index]);
                gl.uniform1i(shader.uniforms["u_vel_tex"], 0);

                gl.activeTexture(gl.TEXTURE1);
                gl.bindTexture(gl.TEXTURE_2D, state.p_textures[src]);
                gl.uniform1i(shader.uniforms["u_p_tex"], 1);

                gl.uniform1f(shader.uniforms["u_dt"], dt);

                gl.drawArrays(gl.TRIANGLES, 0, 3);

            }


            gl.scissor(2, 2, FDM_width - 3, FDM_height - 3);

            {
                gl.bindFramebuffer(gl.FRAMEBUFFER, state.v_framebuffers[current_index]);

                let shader = state.mode === "obstacle" ? FDM_finish_velocity_plate_shader : FDM_finish_velocity_shader;
                gl.useProgram(shader.shader);

                gl.uniform2f(shader.uniforms["u_offset"], 0, 0);
                gl.enableVertexAttribArray(shader.attributes["v_position"]);
                gl.vertexAttribPointer(shader.attributes["v_position"], 2, gl.FLOAT, false, 0, 0);

                gl.activeTexture(gl.TEXTURE1);
                gl.bindTexture(gl.TEXTURE_2D, state.p_textures[0]);
                gl.uniform1i(shader.uniforms["u_p_tex"], 1);

                gl.uniform1f(shader.uniforms["u_dt"], dt);

                if (state.mode === "obstacle")
                    gl.uniform3fv(shader.uniforms["u_obstacle"], obstacle);

                gl.drawArrays(gl.TRIANGLES, 0, 3);
            }

            if (state.mode === "boundary") {

                let seedx = 15 + 5 * cos(time) + 3 * cos(time * pi) + 2 * cos(time * 13.01);
                let seedy = 5 * cos(time);

                gl.scissor(0, 4, 2, FDM_height - 3);

                let shader = FDM_init_boundary_velocity_shader;

                gl.useProgram(shader.shader);

                gl.bindBuffer(gl.ARRAY_BUFFER, full_screen_vertex_buffer);

                gl.enableVertexAttribArray(shader.attributes["v_position"]);
                gl.vertexAttribPointer(shader.attributes["v_position"], 2, gl.FLOAT, false, 0, 0);

                gl.uniform2f(shader.uniforms["u_seed"], seedx, seedy);

                gl.drawArrays(gl.TRIANGLES, 0, 3);


                gl.bindTexture(gl.TEXTURE_2D, null);
                gl.bindFramebuffer(gl.FRAMEBUFFER, null);
            }

            gl.bindFramebuffer(gl.FRAMEBUFFER, null);

            gl.disable(gl.SCISSOR_TEST);


        }

        this.draw_FDM_velocity = function (state, map, v_scale = 1) {
            let shader = linear_filtering ? FDM_velocity_quad_shader : FDM_velocity_quad_bilerp_shader;


            gl.useProgram(shader.shader);


            gl.bindBuffer(gl.ARRAY_BUFFER, full_screen_vertex_buffer);

            gl.enableVertexAttribArray(shader.attributes["v_position"]);
            gl.vertexAttribPointer(shader.attributes["v_position"], 2, gl.FLOAT, false, 0, 0);


            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, state.v_textures[state.index]);

            gl.activeTexture(gl.TEXTURE3);
            gl.bindTexture(gl.TEXTURE_2D, velocity_lut_texture);

            gl.uniform1i(shader.uniforms["u_texture"], 0);
            gl.uniform1i(shader.uniforms["u_vel_lut"], 3);
            gl.uniform4fv(shader.uniforms["u_map"], map);
            gl.uniform1f(shader.uniforms["u_scale"], v_scale);

            gl.drawArrays(gl.TRIANGLES, 0, 3);
        }



        this.create_marker_state = function (marker_count) {

            let r = {};

            r.marker_count = marker_count;

            let reset_buffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, reset_buffer);
            gl.bufferData(gl.ARRAY_BUFFER, marker_count * float_size * 3, gl.DYNAMIC_DRAW);

            let write_buffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, write_buffer);
            gl.bufferData(gl.ARRAY_BUFFER, marker_count * float_size * 5, gl.DYNAMIC_DRAW);

            let alpha_buffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, alpha_buffer);
            gl.bufferData(gl.ARRAY_BUFFER, marker_count * float_size * 4, gl.DYNAMIC_DRAW);

            let target = create_render_target(marker_count, marker_history_size, gl.REPEAT, gl.REPEAT, false);

            gl.bindTexture(gl.TEXTURE_2D, null);
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);

            r.reset_buffer = reset_buffer;
            r.write_buffer = write_buffer;
            r.alpha_buffer = alpha_buffer;
            r.target = target;

            return r;
        }

        this.update_marker_state = function (state, reset_data, write_data, alpha_data) {


            if (alpha_data) {
                gl.bindBuffer(gl.ARRAY_BUFFER, state.alpha_buffer);
                gl.bufferSubData(gl.ARRAY_BUFFER, 0, alpha_data);
            }

            let marker_count = state.marker_count;

            gl.bindFramebuffer(gl.FRAMEBUFFER, state.target[0]);
            gl.disable(gl.BLEND);
            gl.depthMask(false);

            gl.viewport(0, 0, marker_count, marker_history_size);

            if (reset_data.length) {
                gl.bindBuffer(gl.ARRAY_BUFFER, state.reset_buffer);
                gl.bufferSubData(gl.ARRAY_BUFFER, 0, reset_data);

                let shader = marker_trail_reset_shader;
                gl.useProgram(shader.shader);

                const loc = shader.attributes["v_x_xy"];
                gl.enableVertexAttribArray(loc);
                gl.vertexAttribPointer(loc, 3, gl.FLOAT, false, 3 * float_size, 0);
                ext.vertexAttribDivisorANGLE(loc, 1);

                gl.bindBuffer(gl.ARRAY_BUFFER, line_vertex_buffer);

                gl.enableVertexAttribArray(shader.attributes["v_y"]);
                gl.vertexAttribPointer(shader.attributes["v_y"], 1, gl.FLOAT, false, float_size, 0);

                ext.drawArraysInstancedANGLE(gl.LINES, 0, 2, reset_data.length / 3);

                ext.vertexAttribDivisorANGLE(loc, 0);

            }

            gl.bindBuffer(gl.ARRAY_BUFFER, state.write_buffer);
            gl.bufferSubData(gl.ARRAY_BUFFER, 0, write_data);


            {
                let shader = marker_trail_write_shader;
                gl.useProgram(shader.shader);


                gl.enableVertexAttribArray(shader.attributes["v_pos"]);
                gl.vertexAttribPointer(shader.attributes["v_pos"], 2, gl.FLOAT, false, 5 * float_size, 0);

                gl.enableVertexAttribArray(shader.attributes["v_val"]);
                gl.vertexAttribPointer(shader.attributes["v_val"], 3, gl.FLOAT, false, 5 * float_size, 2 * float_size);

                gl.drawArrays(gl.POINTS, 0, write_data.length / 5);
            }

            gl.bindFramebuffer(gl.FRAMEBUFFER, null);

        }

        this.draw_marker_trails = function (state, mvp, params = {}) {

            let marker_count = state.marker_count;

            let shader = marker_trail_shader;

            if (params.depth)
                shader = marker_trail_shader_depth;

            gl.useProgram(shader.shader);

            gl.enable(gl.BLEND);
            gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
            gl.depthMask(false);

            gl.bindBuffer(gl.ARRAY_BUFFER, marker_trail_vertex_buffer);
            gl.enableVertexAttribArray(shader.attributes["v_uvt"]);
            gl.vertexAttribPointer(shader.attributes["v_uvt"], 3, gl.FLOAT, false, 3 * float_size, 0);

            gl.bindBuffer(gl.ARRAY_BUFFER, state.write_buffer);

            const y_offset_location = shader.attributes["v_pos"];
            gl.enableVertexAttribArray(y_offset_location);
            gl.vertexAttribPointer(y_offset_location, 2, gl.FLOAT, false, 5 * float_size, 0);
            ext.vertexAttribDivisorANGLE(y_offset_location, 1);

            gl.bindBuffer(gl.ARRAY_BUFFER, state.alpha_buffer);

            const color_location = shader.attributes["v_alpha"];
            gl.enableVertexAttribArray(color_location);
            gl.vertexAttribPointer(color_location, 1, gl.FLOAT, false, 1 * float_size, 0);
            ext.vertexAttribDivisorANGLE(color_location, 1);


            let line_width = params.line_width || 0.01;

            gl.uniformMatrix4fv(shader.uniforms["u_mvp"], false, mat4_transpose(mvp));


            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, state.target[1]);

            gl.uniform1i(shader.uniforms["u_history_tex"], 0);


            gl.uniform4f(shader.uniforms["u_line_params"], line_width, 0, 0, 0);

            ext.drawArraysInstancedANGLE(gl.TRIANGLES, 0, marker_history_size * 6, marker_count);

            if (params.depth) {


                gl.uniform4f(shader.uniforms["u_line_params"], line_width * 0.5, line_width, 0, 0);

                ext.drawArraysInstancedANGLE(gl.TRIANGLES, 0, marker_history_size * 6, marker_count);
            }

            ext.vertexAttribDivisorANGLE(y_offset_location, 0);
            ext.vertexAttribDivisorANGLE(color_location, 0);
        }

        this.draw_markers = function (state, mvp, params) {

            let marker_count = state.marker_count;

            let shader = marker_shader;
            gl.useProgram(shader.shader);

            gl.enable(gl.BLEND);
            gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
            gl.depthMask(false);

            gl.bindBuffer(gl.ARRAY_BUFFER, state.write_buffer);

            gl.enableVertexAttribArray(shader.attributes["v_pos"]);
            gl.vertexAttribPointer(shader.attributes["v_pos"], 2, gl.FLOAT, false, 5 * float_size, 0);

            gl.bindBuffer(gl.ARRAY_BUFFER, state.alpha_buffer);

            gl.enableVertexAttribArray(shader.attributes["v_alpha"]);
            gl.vertexAttribPointer(shader.attributes["v_alpha"], 1, gl.FLOAT, false, 1 * float_size, 0);


            gl.uniformMatrix4fv(shader.uniforms["u_mvp"], false, mat4_transpose(mvp));
            gl.uniform1f(shader.uniforms["u_size"], params.point_size || 10.0);


            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, state.target[1]);

            gl.uniform1i(shader.uniforms["u_history_tex"], 0);


            gl.drawArrays(gl.POINTS, 0, marker_count);
        }


        this.draw_full = function (mode, params = {}) {

            let shader;

            if (mode === "simple") {
                shader = simple_shader;
            } else if (mode === "pressure_manual") {
                shader = pressure_manual_shader;
            } else if (mode === "velocity_grass") {
                shader = velocity_grass_shader;
            } else if (mode === "velocity_boundary") {
                shader = velocity_boundary_shader;
            } else if (mode === "sky") {

                gl.enable(gl.BLEND);
                gl.blendFunc(gl.ONE_MINUS_DST_ALPHA, gl.ONE);
                gl.depthMask(false);
                shader = sky_shader;
            }
            gl.useProgram(shader.shader);

            gl.bindBuffer(gl.ARRAY_BUFFER, full_screen_vertex_buffer);

            gl.enableVertexAttribArray(shader.attributes["v_position"]);
            gl.vertexAttribPointer(shader.attributes["v_position"], 2, gl.FLOAT, false, 2 * float_size, 0);

            gl.uniform1f(shader.uniforms["u_aspect"], params.aspect || viewport_h / viewport_w);

            if (mode === "pressure_manual") {
                gl.uniform4fv(shader.uniforms["u_pos0"], params.pos0);
                gl.uniform4fv(shader.uniforms["u_pos1"], params.pos1);
                gl.uniform4fv(shader.uniforms["u_pos2"], params.pos2);
                gl.uniform4fv(shader.uniforms["u_pos3"], params.pos3);
                gl.uniform2fv(shader.uniforms["u_scale_shift"], params.scale_shift);

                gl.uniform3fv(shader.uniforms["u_pressure_map_params"], params.pressure_map_params);
            } else if (mode === "velocity_grass") {
                gl.uniform1f(shader.uniforms["u_t"], params.t);

                gl.activeTexture(gl.TEXTURE3);
                gl.bindTexture(gl.TEXTURE_2D, velocity_lut_texture);

                gl.uniform1i(shader.uniforms["u_vel_lut"], 3);
            } else if (mode === "velocity_boundary") {
                gl.activeTexture(gl.TEXTURE2);
                gl.bindTexture(gl.TEXTURE_2D, boundary_texture);

                gl.uniform1i(shader.uniforms["u_vel_tex"], 2);

                gl.activeTexture(gl.TEXTURE3);
                gl.bindTexture(gl.TEXTURE_2D, velocity_lut_texture);

                gl.uniform1i(shader.uniforms["u_vel_lut"], 3);
            } else if (mode === "sky") {
                gl.uniformMatrix3fv(shader.uniforms["u_rot"], false, mat3_invert(params.rot));
            }

            gl.drawArrays(gl.TRIANGLES, 0, 3);
        }

        this.draw_landscape = function (mvp, params) {

            let shader = landscape_shader;

            gl.useProgram(shader.shader);

            gl.bindBuffer(gl.ARRAY_BUFFER, landscape_vertex_buffer);

            gl.enableVertexAttribArray(shader.attributes["v_pos"]);
            gl.vertexAttribPointer(shader.attributes["v_pos"], 2, gl.FLOAT, false, 2 * float_size, 0);


            gl.uniformMatrix4fv(shader.uniforms["u_mvp"], false, mat4_transpose(mvp));


            gl.uniform4fv(shader.uniforms["u_pos0"], params.pos0);
            gl.uniform4fv(shader.uniforms["u_pos1"], params.pos1);
            gl.uniform4fv(shader.uniforms["u_pos2"], params.pos2);
            gl.uniform4fv(shader.uniforms["u_pos3"], params.pos3);

            gl.uniform3fv(shader.uniforms["u_pressure_map_params"], [10.0, 0.2, scale * 0.5]);


            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, landscape_index_buffer);
            gl.drawElements(gl.TRIANGLES, landscape_index_count, gl.UNSIGNED_SHORT, 0);
        }

        this.draw_landscape_edge = function (mvp) {

            let shader = landscape_edge_shader;

            gl.enable(gl.BLEND);
            gl.depthMask(false);

            gl.useProgram(shader.shader);

            gl.bindBuffer(gl.ARRAY_BUFFER, landscape_edge_vertex_buffer);

            gl.enableVertexAttribArray(shader.attributes["v_pos"]);
            gl.vertexAttribPointer(shader.attributes["v_pos"], 2, gl.FLOAT, false, 4 * float_size, 0);

            gl.enableVertexAttribArray(shader.attributes["v_uv"]);
            gl.vertexAttribPointer(shader.attributes["v_uv"], 2, gl.FLOAT, false, 4 * float_size, 2 * float_size);

            gl.uniformMatrix4fv(shader.uniforms["u_mvp"], false, mat4_transpose(mvp));

            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, landscape_edge_index_buffer);
            gl.drawElements(gl.TRIANGLES, landscape_edge_index_count, gl.UNSIGNED_SHORT, 0);
        }

        this.draw_grass = function (mvp, rot, tilt) {

            let shader = grass_shader;

            gl.useProgram(shader.shader);

            gl.bindBuffer(gl.ARRAY_BUFFER, grass_vertex_buffer);

            gl.enableVertexAttribArray(shader.attributes["v_position"]);
            gl.vertexAttribPointer(shader.attributes["v_position"], 2, gl.FLOAT, false, 2 * float_size, 0);

            gl.bindBuffer(gl.ARRAY_BUFFER, grass_params_buffer);

            const pos_location = shader.attributes["v_pos_params"];
            gl.enableVertexAttribArray(pos_location);
            gl.vertexAttribPointer(pos_location, 4, gl.FLOAT, false, 6 * float_size, 0);
            ext.vertexAttribDivisorANGLE(pos_location, 1);

            const style_location = shader.attributes["v_style_params"];
            gl.enableVertexAttribArray(style_location);
            gl.vertexAttribPointer(style_location, 2, gl.FLOAT, false, 6 * float_size, 4 * float_size);
            ext.vertexAttribDivisorANGLE(style_location, 1);

            gl.bindBuffer(gl.ARRAY_BUFFER, grass_tilt_buffer);

            gl.bufferSubData(gl.ARRAY_BUFFER, 0, tilt);

            const tilt_location = shader.attributes["v_tilt"];
            gl.enableVertexAttribArray(tilt_location);
            gl.vertexAttribPointer(tilt_location, 2, gl.FLOAT, false, 2 * float_size, 0);
            ext.vertexAttribDivisorANGLE(tilt_location, 1);



            gl.uniformMatrix4fv(shader.uniforms["u_mvp"], false, mat4_transpose(mvp));
            gl.uniformMatrix3fv(shader.uniforms["u_rot"], false, mat3_invert(rot));

            ext.drawArraysInstancedANGLE(gl.TRIANGLE_STRIP, 0, grass_vertex_count, grass_count);


            ext.vertexAttribDivisorANGLE(pos_location, 0);
            ext.vertexAttribDivisorANGLE(style_location, 0);
            ext.vertexAttribDivisorANGLE(tilt_location, 0);
        }

        this.draw_ground = function (mvp, rot) {

            let shader = ground_shader;

            gl.useProgram(shader.shader);

            gl.bindBuffer(gl.ARRAY_BUFFER, ground_vertex_buffer);

            gl.enableVertexAttribArray(shader.attributes["v_position"]);
            gl.vertexAttribPointer(shader.attributes["v_position"], 3, gl.FLOAT, false, 3 * float_size, 0);

            gl.uniformMatrix4fv(shader.uniforms["u_mvp"], false, mat4_transpose(mvp));
            gl.uniformMatrix3fv(shader.uniforms["u_rot"], false, mat3_invert(rot));

            gl.drawArrays(gl.TRIANGLES, 0, ground_count * 6);
        }

        this.draw_leaf = function (mvp, rot, params) {

            let shader = leaf_shader;

            gl.useProgram(shader.shader);

            gl.bindBuffer(gl.ARRAY_BUFFER, leaf_vertex_buffer);

            gl.enableVertexAttribArray(shader.attributes["v_position"]);
            gl.vertexAttribPointer(shader.attributes["v_position"], 2, gl.FLOAT, false, 2 * float_size, 0);

            gl.uniformMatrix4fv(shader.uniforms["u_mvp"], false, mat4_transpose(mvp));
            gl.uniformMatrix3fv(shader.uniforms["u_rot"], false, mat3_invert(rot));
            gl.uniform4fv(shader.uniforms["u_color"], params.color || [1, 0, 0, 1]);

            gl.enable(gl.BLEND);
            gl.depthMask(false);

            gl.drawArrays(gl.TRIANGLE_STRIP, 0, leaf_vertex_count);

            gl.disable(gl.BLEND);
            gl.depthMask(true);

        }

        this.draw_arrow = function (mvp, rot, params = {}) {

            let shader = arrow_shader;

            gl.useProgram(shader.shader);

            gl.bindBuffer(gl.ARRAY_BUFFER, arrow_vertex_buffer);

            gl.enableVertexAttribArray(shader.attributes["v_pos"]);
            gl.vertexAttribPointer(shader.attributes["v_pos"], 3, gl.FLOAT, false, 6 * float_size, 0);
            gl.enableVertexAttribArray(shader.attributes["v_norm"]);
            gl.vertexAttribPointer(shader.attributes["v_norm"], 3, gl.FLOAT, false, 6 * float_size, 3 * float_size);

            gl.uniformMatrix4fv(shader.uniforms["u_mvp"], false, mat4_transpose(mvp));
            gl.uniformMatrix3fv(shader.uniforms["u_rot"], false, mat3_invert(rot));

            gl.uniform4fv(shader.uniforms["u_color"], params.color || [1, 0, 0, 1]);
            gl.uniform1f(shader.uniforms["u_offset"], params.length);

            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, arrow_index_buffer);
            gl.drawElements(gl.TRIANGLES, arrow_index_count, gl.UNSIGNED_SHORT, 0);
        }

        this.draw_surface = function (mvp, rot) {

            let shader = surface_shader;

            gl.useProgram(shader.shader);

            gl.bindBuffer(gl.ARRAY_BUFFER, surface_vertex_buffer);

            gl.enableVertexAttribArray(shader.attributes["v_position"]);
            gl.vertexAttribPointer(shader.attributes["v_position"], 3, gl.FLOAT, false, 6 * float_size, 0);
            gl.enableVertexAttribArray(shader.attributes["v_normal"]);
            gl.vertexAttribPointer(shader.attributes["v_normal"], 3, gl.FLOAT, false, 6 * float_size, 3 * float_size);

            gl.uniformMatrix4fv(shader.uniforms["u_mvp"], false, mat4_transpose(mvp));
            gl.uniformMatrix3fv(shader.uniforms["u_rot"], false, mat3_invert(rot));

            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, surface_index_buffer);
            gl.drawElements(gl.TRIANGLES, surface_index_count, gl.UNSIGNED_SHORT, 0);
        }

        this.draw_arrows = function (matrices, rots, params = {}) {

            let shader = instanced_plain_shader;

            gl.useProgram(shader.shader);

            gl.bindBuffer(gl.ARRAY_BUFFER, arrow_vertex_buffer);

            gl.enableVertexAttribArray(shader.attributes["v_pos"]);
            gl.vertexAttribPointer(shader.attributes["v_pos"], 3, gl.FLOAT, false, 6 * float_size, 0);
            gl.enableVertexAttribArray(shader.attributes["v_norm"]);
            gl.vertexAttribPointer(shader.attributes["v_norm"], 3, gl.FLOAT, false, 6 * float_size, 3 * float_size);

            gl.bindBuffer(gl.ARRAY_BUFFER, arrow_instance_transform_buffer);
            gl.bufferSubData(gl.ARRAY_BUFFER, 0, matrices);

            const transform_location = shader.attributes["v_transform"];

            for (let i = 0; i < 4; i++) {
                const location = transform_location + i;
                gl.enableVertexAttribArray(location);
                gl.vertexAttribPointer(location, 4, gl.FLOAT, false, 16 * float_size, i * 4 * float_size);
                ext.vertexAttribDivisorANGLE(location, 1);
            }

            gl.bindBuffer(gl.ARRAY_BUFFER, arrow_instance_rot_buffer);
            gl.bufferSubData(gl.ARRAY_BUFFER, 0, rots);

            const rots_location = shader.attributes["v_rot"];

            for (let i = 0; i < 3; i++) {
                const location = rots_location + i;
                gl.enableVertexAttribArray(location);
                gl.vertexAttribPointer(location, 3, gl.FLOAT, false, 9 * float_size, i * 3 * float_size);
                ext.vertexAttribDivisorANGLE(location, 1);
            }

            gl.uniform4fv(shader.uniforms["u_color"], [1, 0, 0, 1]);


            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, arrow_index_buffer);

            ext.drawElementsInstancedANGLE(gl.TRIANGLES, arrow_index_count, gl.UNSIGNED_SHORT, 0, matrices.length / 16)

            for (let i = 0; i < 4; i++)
                ext.vertexAttribDivisorANGLE(transform_location + i, 0);

            for (let i = 0; i < 3; i++)
                ext.vertexAttribDivisorANGLE(rots_location + i, 0);
        }

        this.draw_box = function (mvp, rot, params = {}) {

            let shader = box_shader;
            if (params.type === "cardboard") {
                shader = cardboard_shader;
            } else if (params.type === "floor") {
                shader = floor_shader;
            }
            gl.useProgram(shader.shader);

            gl.bindBuffer(gl.ARRAY_BUFFER, box_vertex_buffer);

            gl.enableVertexAttribArray(shader.attributes["v_pos"]);
            gl.vertexAttribPointer(shader.attributes["v_pos"], 3, gl.FLOAT, false, 8 * float_size, 0);
            gl.enableVertexAttribArray(shader.attributes["v_norm"]);
            gl.vertexAttribPointer(shader.attributes["v_norm"], 3, gl.FLOAT, false, 8 * float_size, 3 * float_size);
            gl.enableVertexAttribArray(shader.attributes["v_st"]);
            gl.vertexAttribPointer(shader.attributes["v_st"], 2, gl.FLOAT, false, 8 * float_size, 6 * float_size);


            gl.uniformMatrix4fv(shader.uniforms["u_mvp"], false, mat4_transpose(mvp));
            gl.uniformMatrix3fv(shader.uniforms["u_rot"], false, mat3_invert(rot));

            if (shader === box_shader) {
                gl.uniform4fv(shader.uniforms["u_color"], params.color || [1, 0, 0, 1]);
            } else if (shader === floor_shader) {
                gl.uniform2fv(shader.uniforms["u_shade_pos"], params.shade_pos);
            }

            gl.drawArrays(gl.TRIANGLES, 0, box_vertex_count);
        }

        this.draw_sphere = function (mvp, rot, params = {}) {

            let shader;

            if (params.type === "ball")
                shader = ball_shader;
            else if (params.type === "plain_sphere")
                shader = plain_sphere_shader;

            gl.useProgram(shader.shader);

            gl.bindBuffer(gl.ARRAY_BUFFER, sphere_vertex_buffer);

            gl.enableVertexAttribArray(shader.attributes["v_pos"]);
            gl.vertexAttribPointer(shader.attributes["v_pos"], 3, gl.FLOAT, false, 3 * float_size, 0);

            gl.uniformMatrix4fv(shader.uniforms["u_mvp"], false, mat4_transpose(mvp));
            gl.uniformMatrix3fv(shader.uniforms["u_rot"], false, mat3_invert(rot));

            if (params.type === "ball") {
                gl.uniform3fv(shader.uniforms["u_box_dir"], params.box_dir || [0, 0, 0]);
            } else if (params.type === "plain_sphere") {
                gl.uniform4fv(shader.uniforms["u_color"], params.color || [1, 0, 0, 1]);
            }

            gl.drawArrays(gl.TRIANGLES, 0, sphere_vertex_count);
        }

        this.draw_points = function (mvp, count = particles_count, offset = 0, params = {}) {

            let shader = point_shader;
            gl.useProgram(shader.shader);

            gl.enable(gl.BLEND);
            gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
            gl.depthMask(false);

            gl.bindBuffer(gl.ARRAY_BUFFER, point_pos_buffer);
            gl.enableVertexAttribArray(shader.attributes["v_pos"]);
            gl.vertexAttribPointer(shader.attributes["v_pos"], 3, gl.FLOAT, false, 3 * float_size, 0);

            gl.bindBuffer(gl.ARRAY_BUFFER, point_col_buffer);
            gl.enableVertexAttribArray(shader.attributes["v_col"]);
            gl.vertexAttribPointer(shader.attributes["v_col"], 1, gl.FLOAT, false, float_size, 0);

            gl.uniformMatrix4fv(shader.uniforms["u_mvp"], false, mat4_transpose(mvp));


            gl.uniform1f(shader.uniforms["u_size"], params.point_size || 2.0);
            gl.uniform4fv(shader.uniforms["u_color0"], params.color0 || vec_scale([0.5, 0.5, 0.5, 1], 0.1));
            gl.uniform4fv(shader.uniforms["u_color1"], params.color1 || [1, 0, 0, 1]);

            gl.drawArrays(gl.POINTS, offset, count);
        }

        this.draw_point_arrows = function (mvp, count = particles_count, offset = 0, params = {}) {

            let shader = point_arrow_shader;
            gl.useProgram(shader.shader);

            gl.enable(gl.BLEND);
            gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
            gl.depthMask(false);


            const pos_location = shader.attributes["v_pos"];
            gl.bindBuffer(gl.ARRAY_BUFFER, point_pos_buffer);
            gl.enableVertexAttribArray(pos_location);
            gl.vertexAttribPointer(pos_location, 3, gl.FLOAT, false, 0, offset * 3 * float_size);
            ext.vertexAttribDivisorANGLE(pos_location, 1);

            const vel_location = shader.attributes["v_vel"];
            gl.bindBuffer(gl.ARRAY_BUFFER, point_vel_buffer);
            gl.enableVertexAttribArray(vel_location);
            gl.vertexAttribPointer(vel_location, 3, gl.FLOAT, false, 0, offset * 3 * float_size);
            ext.vertexAttribDivisorANGLE(vel_location, 1);


            const col_location = shader.attributes["v_col"];
            gl.bindBuffer(gl.ARRAY_BUFFER, point_col_buffer);
            gl.enableVertexAttribArray(col_location);
            gl.vertexAttribPointer(col_location, 1, gl.FLOAT, false, 0, offset * 1 * float_size);
            ext.vertexAttribDivisorANGLE(col_location, 1);


            gl.bindBuffer(gl.ARRAY_BUFFER, point_arrow_vertex_buffer);

            gl.enableVertexAttribArray(shader.attributes["v_position"]);
            gl.vertexAttribPointer(shader.attributes["v_position"], 2, gl.FLOAT, false, 2 * float_size, 0);

            gl.uniformMatrix4fv(shader.uniforms["u_mvp"], false, mat4_transpose(mvp));


            let line_arg = [
                0.08, 0.03, viewport_w / viewport_h, 1
            ]
            gl.uniform4fv(shader.uniforms["u_line_arg"], line_arg);
            gl.uniform4fv(shader.uniforms["u_color0"], params.color0 || vec_scale([0.5, 0.5, 0.5, 1], 0.1));
            gl.uniform4fv(shader.uniforms["u_color1"], params.color1 || [1, 0, 0, 1]);

            ext.drawArraysInstancedANGLE(gl.TRIANGLES, 0, point_arrow_vertex_count, count);

            ext.vertexAttribDivisorANGLE(pos_location, 0);
            ext.vertexAttribDivisorANGLE(vel_location, 0);
            ext.vertexAttribDivisorANGLE(col_location, 0);
        }

        this.draw_quads = function (mvp, count, params = {}) {

            gl.enable(gl.BLEND);
            gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
            gl.depthMask(false);

            let shader = glow_shader;

            if (params.type === "ball_shadow") {
                shader = ball_shadow_shader;
            }

            gl.useProgram(shader.shader);


            gl.bindBuffer(gl.ARRAY_BUFFER, quad_vertex_buffer);
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, quad_index_buffer);

            gl.enableVertexAttribArray(shader.attributes["v_coords"]);
            gl.vertexAttribPointer(shader.attributes["v_coords"], 3, gl.FLOAT, false, 6 * float_size, 0);

            gl.enableVertexAttribArray(shader.attributes["v_sta"]);
            gl.vertexAttribPointer(shader.attributes["v_sta"], 3, gl.FLOAT, false, 6 * float_size, 3 * float_size);

            gl.uniformMatrix4fv(shader.uniforms["u_mvp"], false, mat4_transpose(mvp));

            if (params.type === "glow") {
                gl.uniform2fv(shader.uniforms["u_pos_size"], params.pos_size);
            }

            gl.drawElements(gl.TRIANGLES, count * 6, gl.UNSIGNED_SHORT, 0);
        }

        this.draw_FVM_mesh = function (mvp, params = {}) {


            let shader;

            let vertex_pos_buffer;
            let vertex_val_buffer;
            let val_count = 1;

            let buffers;

            if (params.type === "pressure") {
                shader = FVM_mesh_pressure_shader;
            } else if (params.type === "velocity") {
                shader = FVM_mesh_velocity_shader;
            }

            if (params.mesh === "symmetric_airfoil") {
                buffers = symmetric_airfoil_fvm_buffers;
            } else if (params.mesh === "plate") {
                buffers = plate_fvm_buffers;
            } else if (params.mesh === "asymmetric_airfoil") {
                buffers = asymmetric_airfoil_fvm_buffers;
            } else if (params.mesh === "dynamic_symmetric_airfoil") {
                buffers = dynamic_symmetric_airfoil_fvm_buffers;
            } else if (params.mesh === "dynamic_uneven_airfoil") {
                buffers = dynamic_uneven_airfoil_fvm_buffers;
            } else if (params.mesh === "naca_64_1_212") {
                buffers = naca_64_1_212_fvm_buffers;
            }

            let index_count = buffers.index_count;
            let index_buffer = buffers.index_buffer;

            vertex_pos_buffer = buffers.vertex_p_pos_buffer;
            vertex_val_buffer = buffers.vertex_p_val_buffer;


            gl.useProgram(shader.shader);


            gl.bindBuffer(gl.ARRAY_BUFFER, vertex_pos_buffer);

            gl.enableVertexAttribArray(shader.attributes["v_pos"]);
            gl.vertexAttribPointer(shader.attributes["v_pos"], 2, gl.FLOAT, false, 2 * float_size, 0);

            gl.bindBuffer(gl.ARRAY_BUFFER, vertex_val_buffer);

            gl.enableVertexAttribArray(shader.attributes["v_val"]);
            gl.vertexAttribPointer(shader.attributes["v_val"], val_count, gl.FLOAT, false, val_count * float_size, 0);


            gl.uniformMatrix4fv(shader.uniforms["u_mvp"], false, mat4_transpose(mvp));
            gl.uniform2fv(shader.uniforms["u_scale_offset"], params.scale_offset);


            if (params.type === "pressure") {
                gl.uniform3fv(shader.uniforms["u_pressure_map_params"], [10.0, 0.2, scale * 0.5]);
            } else if (params.type === "velocity") {

                gl.activeTexture(gl.TEXTURE3);
                gl.bindTexture(gl.TEXTURE_2D, velocity_lut_texture);
                gl.uniform1i(shader.uniforms["u_vel_lut"], 3);
            }

            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, index_buffer);

            gl.drawElements(gl.TRIANGLES, index_count, gl.UNSIGNED_SHORT, 0);
        }

        this.draw_texture_velocity_arrows = function (state, mvp, world_map, sampling_map, vel_scale, pixel_scale, color) {


            gl.enable(gl.BLEND);
            gl.depthMask(false);

            let shader = texture_velocity_arrow_shader;
            gl.useProgram(shader.shader);

            const pos_location = shader.attributes["v_pos"];
            gl.bindBuffer(gl.ARRAY_BUFFER, texture_velocity_arrow_pos_buffer);
            gl.enableVertexAttribArray(pos_location);
            gl.vertexAttribPointer(pos_location, 2, gl.FLOAT, false, 0, 0);
            ext.vertexAttribDivisorANGLE(pos_location, 1);


            gl.bindBuffer(gl.ARRAY_BUFFER, flat_arrow_vertex_buffer);

            gl.enableVertexAttribArray(shader.attributes["v_position"]);
            gl.vertexAttribPointer(shader.attributes["v_position"], 2, gl.FLOAT, false, 2 * float_size, 0);


            gl.uniformMatrix4fv(shader.uniforms["u_mvp"], false, mat4_transpose(mvp));
            gl.uniform4fv(shader.uniforms["u_world_map"], world_map);
            gl.uniform4fv(shader.uniforms["u_sampling_map"], sampling_map);
            gl.uniform2fv(shader.uniforms["u_pixel_scale"], pixel_scale);
            gl.uniform1f(shader.uniforms["u_vel_scale"], vel_scale);
            gl.uniform4fv(shader.uniforms["u_color"], color);

            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, state.v_textures[state.index]);
            gl.uniform1i(shader.uniforms["u_tex"], 0);


            const count = texture_velocity_arrow_side_count * texture_velocity_arrow_side_count;


            ext.drawArraysInstancedANGLE(gl.TRIANGLES, 0, flat_arrow_vertex_count, count);

            ext.vertexAttribDivisorANGLE(pos_location, 0);
        }


        this.update_point_pos_buffer = function (positions) {
            gl.bindBuffer(gl.ARRAY_BUFFER, point_pos_buffer);
            gl.bufferSubData(gl.ARRAY_BUFFER, 0, positions);
            gl.bindBuffer(gl.ARRAY_BUFFER, null);
        }

        this.update_point_vel_buffer = function (vel) {
            gl.bindBuffer(gl.ARRAY_BUFFER, point_vel_buffer);
            gl.bufferSubData(gl.ARRAY_BUFFER, 0, vel);
            gl.bindBuffer(gl.ARRAY_BUFFER, null);
        }

        this.update_point_col_buffer = function (colors) {
            gl.bindBuffer(gl.ARRAY_BUFFER, point_col_buffer);
            gl.bufferSubData(gl.ARRAY_BUFFER, 0, colors);
            gl.bindBuffer(gl.ARRAY_BUFFER, null);
        }

        this.update_quad_buffer = function (attributes) {
            gl.bindBuffer(gl.ARRAY_BUFFER, quad_vertex_buffer);
            gl.bufferSubData(gl.ARRAY_BUFFER, 0, attributes);
            gl.bindBuffer(gl.ARRAY_BUFFER, null);
        }

        this.update_boundary_texture = function (data) {
            gl.bindTexture(gl.TEXTURE_2D, boundary_texture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.ALPHA, boundary_nx, boundary_ny, 0, gl.ALPHA, gl.UNSIGNED_BYTE, data);
            gl.bindTexture(gl.TEXTURE_2D, null);
        }

        this.update_fvm_mesh_p_pos_buffer = function (name, values) {
            if (name === "dynamic_symmetric_airfoil") {
                gl.bindBuffer(gl.ARRAY_BUFFER, dynamic_symmetric_airfoil_fvm_buffers.vertex_p_pos_buffer);
            } else if (name === "dynamic_uneven_airfoil") {
                gl.bindBuffer(gl.ARRAY_BUFFER, dynamic_uneven_airfoil_fvm_buffers.vertex_p_pos_buffer);
            }

            gl.bufferSubData(gl.ARRAY_BUFFER, 0, values);
            gl.bindBuffer(gl.ARRAY_BUFFER, null);
        }

        this.update_fvm_mesh_p_val_buffer = function (name, values) {

            if (name === "symmetric_airfoil") {
                gl.bindBuffer(gl.ARRAY_BUFFER, symmetric_airfoil_fvm_buffers.vertex_p_val_buffer);
            } else if (name === "plate") {
                gl.bindBuffer(gl.ARRAY_BUFFER, plate_fvm_buffers.vertex_p_val_buffer);
            } else if (name === "asymmetric_airfoil") {
                gl.bindBuffer(gl.ARRAY_BUFFER, asymmetric_airfoil_fvm_buffers.vertex_p_val_buffer);
            } else if (name === "dynamic_symmetric_airfoil") {
                gl.bindBuffer(gl.ARRAY_BUFFER, dynamic_symmetric_airfoil_fvm_buffers.vertex_p_val_buffer);
            } else if (name === "dynamic_uneven_airfoil") {
                gl.bindBuffer(gl.ARRAY_BUFFER, dynamic_uneven_airfoil_fvm_buffers.vertex_p_val_buffer);
            } else if (name === "naca_64_1_212") {
                gl.bindBuffer(gl.ARRAY_BUFFER, naca_64_1_212_fvm_buffers.vertex_p_val_buffer);
            }


            gl.bufferSubData(gl.ARRAY_BUFFER, 0, values);
            gl.bindBuffer(gl.ARRAY_BUFFER, null);
        }
    }

    let car_geometry = generate_car_geometry();
    let plate_geometry = generate_plate_geometry();
    let symmetric_airfoil_geometry = generate_symmetric_airfoil_geometry();
    let asymmetric_airfoil_geometry = generate_asymmetric_airfoil_geometry();
    let naca_64_1_212_geometry = generate_naca_64_1_212_geometry();

    function generate_plate_geometry() {

        const ncap = 50;
        const nside = 90;
        const ngx = nside * 2 + ncap * 2 + 1;
        const ngy = 40;

        const r = 0.025;

        let gx = new Float64Array(ngx * ngy);
        let gy = new Float64Array(ngx * ngy);

        let gi = function (x, y) {
            return y * ngx + x;
        };
        const boundary_h = 0.0015;


        for (let y = 0; y < ngy; y++) {

            let rr = r;
            const nb = 5;
            if (y < nb) {
                rr += boundary_h * y;
            } else {
                let ty = (y - nb) / (ngy - 1 - nb);
                rr += 3.5 * ty * ty + boundary_h * y;
            }



            for (let x = 0; x < ngx; x++) {
                let i = gi(x, y);

                if (x < ncap) {
                    let a = pi + pi * x / ncap;
                    gx[i] = rr * sin(a);
                    gy[i] = rr * cos(a);
                }
                else if (x < ncap + nside) {
                    let t = (x - ncap) / nside;
                    gx[i] = t;
                    gy[i] = rr;
                }
                else if (x < ncap * 2 + nside) {
                    let a = - pi * (x - ncap - nside) / ncap;
                    gx[i] = 1 - rr * sin(a);
                    gy[i] = rr * cos(a);
                }
                else {
                    let t = (x - ncap * 2 - nside) / nside;
                    gx[i] = 1.0 - t;
                    gy[i] = -rr;
                }
            }
        }

        return generate_geometry_with_mesh(ngx, ngy, gx, gy, "cylinder", 56);
    }

    function generate_naca_64_1_212_geometry() {
        let _coords = [

            1.0000000, 0.0000000,
            0.9501300, 0.0060400,
            0.9002700, 0.0130300,
            0.8503800, 0.0205400,
            0.8004500, 0.0282500,
            0.7504700, 0.0359000,
            0.7004500, 0.0432200,
            0.6503900, 0.0500400,
            0.6002900, 0.0561900,
            0.5501600, 0.0615100,
            0.5000000, 0.0658300,
            0.4498200, 0.0689300,
            0.3996100, 0.0705200,
            0.3494100, 0.0700800,
            0.2992100, 0.0681500,
            0.2490300, 0.0647000,
            0.1988600, 0.0596800,
            0.1487200, 0.0529100,
            0.0986500, 0.0438600,
            0.0736400, 0.0381500,
            0.0486800, 0.0312300,
            0.0238200, 0.0221800,
            0.0114700, 0.0159300,
            0.0065900, 0.0124500,
            0.0041800, 0.0102500,

            // 0.0000000, 0.0000000,

            0.0058200, -.0092500,
            0.0084100, -.0110500,
            0.0135300, -.0137900,
            0.0261800, -.0184600,
            0.0513200, -.0249100,
            0.0763600, -.0296700,
            0.1013500, -.0335200,
            0.1512800, -.0394500,
            0.2011400, -.0437600,
            0.2509700, -.0468000,
            0.3007900, -.0487100,
            0.3505900, -.0494800,
            0.4003900, -.0491000,
            0.4501800, -.0470300,
            0.5000000, -.0437700,
            0.5498400, -.0396100,
            0.5997100, -.0347700,
            0.6496100, -.0294400,
            0.6995500, -.0237800,
            0.7495300, -.0180000,
            0.7995500, -.0123300,
            0.8496200, -.0070800,
            0.8997300, -.0026900,
            0.9498700, 0.0002800,
            1.0000000, 0.0000000,
        ];

        let n = _coords.length / 2;

        let coords = [];

        for (let i = 0; i < n / 2 - 1; i++) {
            coords.push(_coords[2 * n - 2 - 2 * i]);
            coords.push(_coords[2 * n - 1 - 2 * i]);

            coords.push(lerp(_coords[2 * n - 2 - 2 * i], _coords[2 * n - 4 - 2 * i], 0.5));
            coords.push(lerp(_coords[2 * n - 1 - 2 * i], _coords[2 * n - 3 - 2 * i], 0.5));
        }

        let pp0 = [0.0084100, -.0110500];
        let p0 = [0.0058200, -.0092500];
        let p1 = [0.0041800, 0.0102500];
        let np1 = [0.0065900, 0.0124500];

        let dir0 = vec_scale(vec_sub(p0, pp0), 2);
        let dir1 = vec_scale(vec_sub(p1, np1), 2);

        let ps = [p0, vec_add(p0, dir0), vec_add(p1, dir1), p1];

        function bezier(t, ps) {
            let nt = 1 - t;
            let x0 = ps[0][0] * nt * nt * nt;
            let x1 = ps[1][0] * 3 * nt * nt * t;
            let x2 = ps[2][0] * 3 * nt * t * t;
            let x3 = ps[3][0] * t * t * t;

            let y0 = ps[0][1] * nt * nt * nt;
            let y1 = ps[1][1] * 3 * nt * nt * t;
            let y2 = ps[2][1] * 3 * nt * t * t;
            let y3 = ps[3][1] * t * t * t;
            return [x0 + x1 + x2 + x3, y0 + y1 + y2 + y3];
        }

        let nn = 16;
        for (let i = 0; i <= nn; i++) {
            let p = bezier(i / nn, ps);
            coords.push(p[0], p[1]);
        }

        for (let i = n / 2; i < n - 1; i++) {
            coords.push(_coords[2 * n - 2 - 2 * i]);
            coords.push(_coords[2 * n - 1 - 2 * i]);

            coords.push(lerp(_coords[2 * n - 2 - 2 * i], _coords[2 * n - 4 - 2 * i], 0.5));
            coords.push(lerp(_coords[2 * n - 1 - 2 * i], _coords[2 * n - 3 - 2 * i], 0.5));
        }

        coords.push(_coords[0]);
        coords.push(_coords[1]);

        n = coords.length / 2;

        const n_back = 22;
        const r_back = 0.002;
        const ngy = 50;
        const ngx = n + n_back + 1;

        const boundary_h = 0.002;

        let gx = new Float64Array(ngx * ngy);
        let gy = new Float64Array(ngx * ngy);

        function pos(x) {

            let xx;
            let yy;
            const a_span = 0.99 * pi;

            if (x <= n_back / 2) {
                let tx = 2 * x / n_back;

                let a = tx * a_span * 0.5;
                xx = 1.0 + cos(a) * r_back;
                yy = -sin(a) * r_back;
            } else if (x <= n_back / 2 + n) {
                x -= n_back / 2 + 1;

                xx = coords[2 * x + 0];
                yy = coords[2 * x + 1] + r_back * xx * (x < n / 2 ? -1.0 : 1.0);
            } else {
                let tx = 1.0 - 2 * (x - n_back / 2 - n) / n_back;

                let a = tx * a_span * 0.5;
                xx = 1.0 + cos(a) * r_back;
                yy = sin(a) * r_back;
            }


            return [xx, yy];
        }

        function offset(y) {
            const nb = 6;
            if (y < nb) {
                return boundary_h * y;
            }
            let ty = (y - nb) / (ngy - 1 - nb);
            return 3.5 * ty * ty + boundary_h * y;
        }

        let gi = function (x, y) {
            return y * ngx + x;
        };


        for (let x = 0; x < ngx; x++) {

            let pos0 = pos(x);

            let pp = pos(x - 1);
            let pn = pos(x + 1);

            let ctoc = [0.5 * (pn[0] - pp[0]), 0.5 * (pn[1] - pp[1])];
            let inv_len = 1 / Math.sqrt(ctoc[0] * ctoc[0] + ctoc[1] * ctoc[1]);

            let norm_x = -ctoc[1] * inv_len;
            let norm_y = ctoc[0] * inv_len;


            let aa = 2 * pi * x / (ngx - 1) + pi / 2;

            let cnx = sin(aa);
            let cny = cos(aa);


            for (let y = 0; y < ngy; y++) {

                let ty = y / ngy;

                let nx = lerp(norm_x, cnx, 0.6 * ty);
                let ny = lerp(norm_y, cny, 0.6 * ty);

                inv_len = 1 / Math.sqrt(nx * nx + ny * ny);

                nx *= inv_len;
                ny *= inv_len;

                let h = offset(y);

                let i = gi(x, y);
                gx[i] = pos0[0] + nx * h;
                gy[i] = pos0[1] + ny * h;

            }
        }

        return generate_geometry_with_mesh(ngx, ngy, gx, gy, "cylinder");

    }

    function generate_asymmetric_airfoil_geometry() {

        const n_back = 30;
        const n_upper = 120;
        const n_lower = 120;
        const ngy = 40;

        const r_back = 0.0045;

        const a_span = 2.8;
        const a0 = 0.0
        const yend = cos(a0) * r_back;

        // NACA 2415
        const t = 0.15;
        const p = 0.4;
        const m = 0.02;

        function thickness(x) {
            let y = 5 * t * (0.2969 * sqrt(x) - 0.1260 * x - 0.3526 * x * x + 0.2843 * x * x * x - 0.1015 * x * x * x * x - 0.0011 * x);

            y += yend * x;

            return y;
        }


        function camber(x) {
            if (x < p)
                return (m / (p * p)) * (2 * p * x - x * x);

            return (m / ((1 - p) * (1 - p))) * (1 - 2 * p + 2 * p * x - x * x);
        }

        function normal(x) {

            let tan;
            if (x < p)
                tan = (2 * m / (p * p)) * (p - x);
            else
                tan = (m / ((1 - p) * (1 - p))) * (p - x);

            // meh
            let a = Math.atan(tan);

            return [sin(a), cos(a)];
        }

        return generate_airfoil_geometry(n_back, n_upper, n_lower, ngy, a_span, a0, r_back, thickness, camber, normal, 1);
    }

    function generate_symmetric_airfoil_geometry(t = 0.15, tu = undefined) {

        const n_back = 30;
        const n_upper = 120;
        const n_lower = 120;
        const ngy = 40;

        const r_back = 0.0045;

        const a_span = 3.3 - 3 * t;
        const a0 = 0;
        const yend = cos(a0) * r_back;

        tu = tu ? tu : t;

        function thickness(x, upper) {

            // NACA 0015

            let tt = upper ? tu : t;
            let y = 5 * tt * (0.2969 * sqrt(x) - 0.1260 * x - 0.3526 * x * x + 0.2843 * x * x * x - 0.1015 * x * x * x * x - 0.0011 * x);

            y += yend * x;

            return y;
        }

        function camber(x) {
            return 0;
        }

        function normal(x) {
            return [0, 1];
        }



        return generate_airfoil_geometry(n_back, n_upper, n_lower, ngy, a_span, a0, r_back, thickness, camber, normal, 1);

    }

    function generate_airfoil_geometry(n_back, n_upper, n_lower, ngy, a_span, a0, r_back, thickness, camber, normal, upper_scale) {

        const ngx = n_back + n_upper + n_lower + 1;

        const boundary_h = 0.0015;
        const base_h = 0.01;


        const x0 = 1.0 - sin(a0) * r_back;


        let gx = new Float64Array(ngx * ngy);
        let gy = new Float64Array(ngx * ngy);

        let gi = function (x, y) {
            return y * ngx + x;
        };

        function offset(y) {
            const nb = 5;
            if (y < nb) {
                return boundary_h * y;
            }

            let ty = (y - nb) / (ngy - 1 - nb);
            return 3.5 * ty * ty + boundary_h * y;
        }


        let tsu = make_t_array(n_upper, (t) => {

            return t * t * 20 + 1;

        })

        let tsl = make_t_array(n_lower, (t) => {
            t = 1 - t;
            return t * t * 20 + 1;
        })

        let tsb = make_t_array(n_back, (t) => {
            return 1;
        })


        function make_t_array(n, mapt) {

            let ts = new Array(n);

            let tsum = 0;
            for (let x = 0; x < n; x++) {
                let t = x / (n - 1);

                let mt = mapt(t);

                ts[x] = mt;
                tsum += mt;
            }

            for (let x = 0; x < n; x++) {
                ts[x] *= 1 / tsum;
            }

            tsum = 0;

            for (let x = 0; x < n; x++) {
                let t = ts[x];
                ts[x] = tsum;
                tsum += t;
            }

            ts.push(1);

            return ts;
        }



        function pos(x) {
            let yy = 0
            let xx;

            x = (x + ngx - 1) % (ngx - 1);

            if (x <= n_back / 2) {
                let tx = 2 * x / n_back;

                let a = a0 + tx * a_span * 0.5;
                xx = x0 + cos(a) * r_back;
                yy = -sin(a) * r_back;


            } else if (x < n_back / 2 + n_lower) {
                let tx = tsl[x - n_back / 2];
                xx = 1 - tx;

                let th = thickness(xx, false);
                let norm = normal(xx);
                yy = camber(xx) - th * norm[1];
                xx += th * norm[0];
            } else if (x < n_back / 2 + n_lower + n_upper) {
                let tx = tsu[x - n_back / 2 - n_lower];

                xx = tx;
                let th = thickness(xx, true) * upper_scale;
                let norm = normal(xx);
                yy = camber(xx) + th * norm[1];
                xx -= th * norm[0];
            }
            else {
                let tx = 1.0 - 2 * (x - n_back / 2 - n_lower - n_upper) / n_back;

                let a = tx * a_span * 0.5;
                xx = x0 + cos(a) * r_back;
                yy = sin(a) * r_back;
            }

            return [xx, yy];
        }


        for (let x = 0; x < ngx; x++) {


            let pos0 = pos(x);
            let pp = pos(x - 1);
            let pn = pos(x + 1);

            let ctoc = [0.5 * (pn[0] - pp[0]), 0.5 * (pn[1] - pp[1])];
            let inv_len = 1 / Math.sqrt(ctoc[0] * ctoc[0] + ctoc[1] * ctoc[1]);

            let norm_x = -ctoc[1] * inv_len;
            let norm_y = ctoc[0] * inv_len;


            for (let y = 0; y < ngy; y++) {


                let h = offset(y);

                let nx = norm_x;
                let ny = norm_y;

                let i = gi(x, y);
                gx[i] = pos0[0] + nx * h;
                gy[i] = pos0[1] + ny * h;
            }
        }

        return generate_geometry_with_mesh(ngx, ngy, gx, gy, "cylinder");
    }

    function generate_car_geometry() {

        let ppos = [
            [-11.5, -7],
            [-11.5, -5],
            [-11.5, -2.5],
            [-11.3, -2.1],
            [-11.0, -1.7],
            [-10.0, -1],
            [-8.0, -0.5],
            [-4.0, -0.2],
            [-1.0, 1.5],
            [0.5, 2],
            [3.2, 2.3],
            [7, 2.0],
            [10, 0.5],
            [13, 0],
            [13.5, -0.5],
            [13.8, -1],
            [14, -3],
            [14, -5],
            [14, -5.1],
            [14, -9],
        ]

        let pos = [];

        for (let i = 0; i < ppos.length - 1; i++) {
            pos.push(ppos[i]);
            pos.push(vec_lerp(ppos[i], ppos[i + 1], 0.5));
        }

        const ngx = pos.length - 2;
        const ngy = 1 + 20;

        let gx = new Float64Array(ngx * ngy);
        let gy = new Float64Array(ngx * ngy);

        let gi = function (x, y) {
            return y * ngx + x;
        };



        for (let y = 0; y < ngy; y++) {
            for (let x = 0; x < ngx; x++) {


                let pos0 = pos[x + 1];
                let pp = pos[x - 1 + 1];
                let pn = pos[x + 1 + 1];

                let ctoc = [0.5 * (pn[0] - pp[0]), 0.5 * (pn[1] - pp[1])];
                let inv_len = 1 / Math.sqrt(ctoc[0] * ctoc[0] + ctoc[1] * ctoc[1]);

                let norm_x = -ctoc[1] * inv_len;
                let norm_y = ctoc[0] * inv_len;

                let tr = y / (ngy - 1);

                let a = pi * x / (ngx - 2) - pi / 2;

                let r = 20 * tr;

                let px = pos0[0] + norm_x * r;
                let py = pos0[1] + norm_y * r;

                let cx = 60 * sin(a);
                let cy = 60 * cos(a) - 5;

                let i = gi(x, y);
                gx[i] = lerp(px, cx, tr * tr);
                gy[i] = lerp(py, cy, tr * tr);
            }
        }

        return generate_geometry_with_mesh(ngx, ngy, gx, gy, "car");
    }


    const gl = new GLDrawer(scale);

    /* grid and neighbor indexing

              
                     N2
                     ^
               G2--------G3
                |         |
          N3 <- |         | -> N1
                |         |
               G0--------G1
                     v
                     N0

        */

    function generate_geometry_with_mesh(ngx, ngy, gx, gy, topology, pressure_taps_count = 51) {

        let nx = ngx - 1;
        let ny = ngy - 1;

        let ncx = nx + 4;
        let ncy = ny + 4;

        let cx = new Float64Array(ncx * ncy);
        let cy = new Float64Array(ncx * ncy);


        let fa_over_celldist = new Float64Array(ncx * ncy * 4);
        let half_fa_vector = new Float64Array(ncx * ncy * 8);
        let p_uv_factors = new Float64Array(ncx * ncy * 8);

        let v_mu_fa_over_celldist = new Float64Array(ncx * ncy * 4);
        let v_half_fa_vector = new Float64Array(ncx * ncy * 8);

        let p_grads = new Float64Array(ncx * ncy * 4);

        let wall_vectors = new Float64Array(nx * 2);

        let pressure_taps = new Array(pressure_taps_count);

        // this is for O geometry

        let gi;

        if (topology === "cylinder") {

            gi = function (x, y) {
                x = (x + nx) % nx;

                if (y < 0)
                    y = 0;
                else if (y >= ngy)
                    y = ngy - 1;

                return y * ngx + x;
            };
        } else if (topology === "car") {

            gi = function (x, y) {
                if (x < 0)
                    x = 0;
                else if (x >= ngx)
                    x = ngx - 1;

                if (y < 0)
                    y = 0;
                else if (y >= ngy)
                    y = ngy - 1;

                return y * ngx + x;
            };
        }

        let ci = function (x, y) {

            x += 2;
            y += 2;

            return y * ncx + x;
        };



        for (let y = -2; y < ny + 2; y++) {
            for (let x = -2; x < nx + 2; x++) {

                let ccx = 0;
                ccx += gx[gi(x, y)];
                ccx += gx[gi(x + 1, y)];
                ccx += gx[gi(x, y + 1)];
                ccx += gx[gi(x + 1, y + 1)];

                cx[ci(x, y)] = ccx * 0.25;

                let ccy = 0;
                ccy += gy[gi(x, y)];
                ccy += gy[gi(x + 1, y)];
                ccy += gy[gi(x, y + 1)];
                ccy += gy[gi(x + 1, y + 1)];

                cy[ci(x, y)] = ccy * 0.25;
            }
        }

        // pressure coeffs

        for (let y = 0; y < ny; y++) {
            for (let x = 0; x < nx; x++) {

                let x0 = gx[gi(x, y)];
                let x1 = gx[gi(x + 1, y)];
                let x2 = gx[gi(x, y + 1)];
                let x3 = gx[gi(x + 1, y + 1)];

                let y0 = gy[gi(x, y)];
                let y1 = gy[gi(x + 1, y)];
                let y2 = gy[gi(x, y + 1)];
                let y3 = gy[gi(x + 1, y + 1)];

                let ip = ci(x, y);

                let ccx = cx[ip];
                let ccy = cy[ip];

                let cx0 = cx[ci(x, y - 1)];
                let cx1 = cx[ci(x + 1, y)];
                let cx2 = cx[ci(x, y + 1)];
                let cx3 = cx[ci(x - 1, y)];

                let cy0 = cy[ci(x, y - 1)];
                let cy1 = cy[ci(x + 1, y)];
                let cy2 = cy[ci(x, y + 1)];
                let cy3 = cy[ci(x - 1, y)];

                fa_over_celldist[ip * 4 + 0] = sqrt((x1 - x0) * (x1 - x0) + (y1 - y0) * (y1 - y0))
                    / sqrt((cx0 - ccx) * (cx0 - ccx) + (cy0 - ccy) * (cy0 - ccy));
                fa_over_celldist[ip * 4 + 1] = sqrt((x3 - x1) * (x3 - x1) + (y3 - y1) * (y3 - y1))
                    / sqrt((cx1 - ccx) * (cx1 - ccx) + (cy1 - ccy) * (cy1 - ccy));
                fa_over_celldist[ip * 4 + 2] = sqrt((x2 - x3) * (x2 - x3) + (y2 - y3) * (y2 - y3))
                    / sqrt((cx2 - ccx) * (cx2 - ccx) + (cy2 - ccy) * (cy2 - ccy));
                fa_over_celldist[ip * 4 + 3] = sqrt((x0 - x2) * (x0 - x2) + (y0 - y2) * (y0 - y2))
                    / sqrt((cx3 - ccx) * (cx3 - ccx) + (cy3 - ccy) * (cy3 - ccy));

                half_fa_vector[ip * 8 + 0] = 0.5 * (y1 - y0);
                half_fa_vector[ip * 8 + 1] = 0.5 * (x0 - x1);
                half_fa_vector[ip * 8 + 2] = 0.5 * (y3 - y1);
                half_fa_vector[ip * 8 + 3] = 0.5 * (x1 - x3);
                half_fa_vector[ip * 8 + 4] = 0.5 * (y2 - y3);
                half_fa_vector[ip * 8 + 5] = 0.5 * (x3 - x2);
                half_fa_vector[ip * 8 + 6] = 0.5 * (y0 - y2);
                half_fa_vector[ip * 8 + 7] = 0.5 * (x2 - x0);
            }
        }

        // velocity coeffs


        for (let y = 0; y < ny; y++) {
            for (let x = 0; x < nx; x++) {

                let x0 = cx[ci(x - 1, y - 1)];
                let x1 = cx[ci(x, y - 1)];
                let x2 = cx[ci(x - 1, y)];
                let x3 = cx[ci(x, y)];

                let y0 = cy[ci(x - 1, y - 1)];
                let y1 = cy[ci(x, y - 1)];
                let y2 = cy[ci(x - 1, y)];
                let y3 = cy[ci(x, y)];

                let cx0 = gx[gi(x, y - 1)];
                let cx1 = gx[gi(x + 1, y)];
                let cx2 = gx[gi(x, y + 1)];
                let cx3 = gx[gi(x - 1, y)];

                let cy0 = gy[gi(x, y - 1)];
                let cy1 = gy[gi(x + 1, y)];
                let cy2 = gy[gi(x, y + 1)];
                let cy3 = gy[gi(x - 1, y)];

                let gip = gi(x, y);

                let ccx = gx[gip];
                let ccy = gy[gip];


                let ip = ci(x, y);

                let area1 = Math.abs((x1 - x0) * (y2 - y0) - (x2 - x0) * (y1 - y0));
                let area2 = Math.abs((x2 - x1) * (y3 - y1) - (x3 - x1) * (y2 - y1));


                let inv_volume = 1 / (0.5 * (area1 + area2));

                v_mu_fa_over_celldist[ip * 4 + 0] = mu * Math.sqrt((x1 - x0) * (x1 - x0) + (y1 - y0) * (y1 - y0))
                    / Math.sqrt((cx0 - ccx) * (cx0 - ccx) + (cy0 - ccy) * (cy0 - ccy));
                v_mu_fa_over_celldist[ip * 4 + 1] = mu * Math.sqrt((x3 - x1) * (x3 - x1) + (y3 - y1) * (y3 - y1))
                    / Math.sqrt((cx1 - ccx) * (cx1 - ccx) + (cy1 - ccy) * (cy1 - ccy));
                v_mu_fa_over_celldist[ip * 4 + 2] = mu * Math.sqrt((x2 - x3) * (x2 - x3) + (y2 - y3) * (y2 - y3))
                    / Math.sqrt((cx2 - ccx) * (cx2 - ccx) + (cy2 - ccy) * (cy2 - ccy));
                v_mu_fa_over_celldist[ip * 4 + 3] = mu * Math.sqrt((x0 - x2) * (x0 - x2) + (y0 - y2) * (y0 - y2))
                    / Math.sqrt((cx3 - ccx) * (cx3 - ccx) + (cy3 - ccy) * (cy3 - ccy));

                // bake in 1/volume factor into the coefficients

                v_half_fa_vector[ip * 8 + 0] = 0.5 * (y1 - y0) * inv_volume;
                v_half_fa_vector[ip * 8 + 1] = 0.5 * (x0 - x1) * inv_volume;
                v_half_fa_vector[ip * 8 + 2] = 0.5 * (y3 - y1) * inv_volume;
                v_half_fa_vector[ip * 8 + 3] = 0.5 * (x1 - x3) * inv_volume;
                v_half_fa_vector[ip * 8 + 4] = 0.5 * (y2 - y3) * inv_volume;
                v_half_fa_vector[ip * 8 + 5] = 0.5 * (x3 - x2) * inv_volume;
                v_half_fa_vector[ip * 8 + 6] = 0.5 * (y0 - y2) * inv_volume;
                v_half_fa_vector[ip * 8 + 7] = 0.5 * (x2 - x0) * inv_volume;

                v_mu_fa_over_celldist[ip * 4 + 0] *= inv_volume;
                v_mu_fa_over_celldist[ip * 4 + 1] *= inv_volume;
                v_mu_fa_over_celldist[ip * 4 + 2] *= inv_volume;
                v_mu_fa_over_celldist[ip * 4 + 3] *= inv_volume;


                let dxds = 0.5 * (-x0 + x1 - x2 + x3);
                let dxdt = 0.5 * (-x0 + x2 - x1 + x3);
                let dyds = 0.5 * (-y0 + y1 - y2 + y3);
                let dydt = 0.5 * (-y0 + y2 - y1 + y3);

                let id = 1 / (dxds * dydt - dxdt * dyds);

                // bake in 0.5 lerp factors

                p_grads[ip * 4 + 0] = 0.5 * dydt * id;
                p_grads[ip * 4 + 1] = 0.5 * -dxdt * id;
                p_grads[ip * 4 + 2] = 0.5 * -dyds * id;
                p_grads[ip * 4 + 3] = 0.5 * dxds * id;
            }
        }


        for (let x = 0; x < nx; x++) {

            let ip = ci(x, 0);
            wall_vectors[x * 2 + 0] = half_fa_vector[ip * 8 + 0];
            wall_vectors[x * 2 + 1] = half_fa_vector[ip * 8 + 1];
        }





        if (topology === "cylinder" || topology === "car") {

            for (let x = 0; x < nx; x++) {

                let ip = ci(x, 0);

                fa_over_celldist[ip * 4 + 0] = 0;
                half_fa_vector[ip * 8 + 0] = 0;
                half_fa_vector[ip * 8 + 1] = 0;

                v_mu_fa_over_celldist[ip * 4 + 0] = 0;
                v_half_fa_vector[ip * 8 + 0] = 0;
                v_half_fa_vector[ip * 8 + 1] = 0;
            }
        }

        if (topology === "car") {

            for (let y = 0; y < ny; y++) {

                let ip = ci(0, y);

                fa_over_celldist[ip * 4 + 3] = 0;
                half_fa_vector[ip * 8 + 6] = 0;
                half_fa_vector[ip * 8 + 7] = 0;

                v_mu_fa_over_celldist[ip * 4 + 3] = 0;
                v_half_fa_vector[ip * 8 + 6] = 0;
                v_half_fa_vector[ip * 8 + 7] = 0;
            }

            for (let y = 0; y < ny; y++) {

                let ip = ci(nx - 1, y);

                fa_over_celldist[ip * 4 + 1] = 0;
                half_fa_vector[ip * 8 + 2] = 0;
                half_fa_vector[ip * 8 + 3] = 0;

                v_mu_fa_over_celldist[ip * 4 + 1] = 0;
                v_half_fa_vector[ip * 8 + 2] = 0;
                v_half_fa_vector[ip * 8 + 3] = 0;
            }
        }


        for (let y = 0; y < ny; y++) {
            for (let x = 0; x < nx; x++) {

                let ip = ci(x, y);


                let foc0 = fa_over_celldist[ip * 4 + 0];
                let foc1 = fa_over_celldist[ip * 4 + 1];
                let foc2 = fa_over_celldist[ip * 4 + 2];
                let foc3 = fa_over_celldist[ip * 4 + 3];

                let f = -1 / (foc0 + foc1 + foc2 + foc3);

                fa_over_celldist[ip * 4 + 0] = foc0 * f;
                fa_over_celldist[ip * 4 + 1] = foc1 * f;
                fa_over_celldist[ip * 4 + 2] = foc2 * f;
                fa_over_celldist[ip * 4 + 3] = foc3 * f;


                p_uv_factors[ip * 8 + 0] = (half_fa_vector[ip * 8 + 0] + half_fa_vector[ip * 8 + 6]) * f;
                p_uv_factors[ip * 8 + 1] = (half_fa_vector[ip * 8 + 0] + half_fa_vector[ip * 8 + 2]) * f;
                p_uv_factors[ip * 8 + 2] = (half_fa_vector[ip * 8 + 4] + half_fa_vector[ip * 8 + 6]) * f;
                p_uv_factors[ip * 8 + 3] = (half_fa_vector[ip * 8 + 2] + half_fa_vector[ip * 8 + 4]) * f;

                p_uv_factors[ip * 8 + 4] = (half_fa_vector[ip * 8 + 1] + half_fa_vector[ip * 8 + 7]) * f;
                p_uv_factors[ip * 8 + 5] = (half_fa_vector[ip * 8 + 1] + half_fa_vector[ip * 8 + 3]) * f;
                p_uv_factors[ip * 8 + 6] = (half_fa_vector[ip * 8 + 5] + half_fa_vector[ip * 8 + 7]) * f;
                p_uv_factors[ip * 8 + 7] = (half_fa_vector[ip * 8 + 3] + half_fa_vector[ip * 8 + 5]) * f;
            }
        }

        {
            let total_length = 0;
            let lengths = new Float64Array(nx);

            for (let x = 0; x < nx; x++) {
                let x0 = gx[gi(x, 0)];
                let x1 = gx[gi(x + 1, 0)];
                let y0 = gy[gi(x, 0)];
                let y1 = gy[gi(x + 1, 0)];

                let len = sqrt((x1 - x0) * (x1 - x0) + (y1 - y0) * (y1 - y0));

                lengths[x] = len;
                total_length += len
            }

            let x = 0;

            let l0 = 0;
            let l1 = lengths[0];

            let dd = [0, 0];

            for (let i = 0; i < pressure_taps_count; i++) {
                let l = ((i + 0.5) / pressure_taps_count) * total_length;

                let tap = {};

                while (l >= l1) {
                    x++;
                    l0 = l1;
                    l1 += lengths[x];
                }

                let t = (l - l0) / (l1 - l0);

                let x0 = gx[gi(x, 0)];
                let x1 = gx[gi(x + 1, 0)];
                let y0 = gy[gi(x, 0)];
                let y1 = gy[gi(x + 1, 0)];

                let nx0 = gx[gi(x, 1)];
                let nx1 = gx[gi(x + 1, 1)];
                let ny0 = gy[gi(x, 1)];
                let ny1 = gy[gi(x + 1, 1)];



                tap.p = [lerp(x0, x1, t), lerp(y0, y1, t)];
                tap.dir = vec_norm([lerp(nx0 - x0, nx1 - x1, t),
                lerp(ny0 - y0, ny1 - y1, t)]);

                dd = vec_add(dd, tap.dir);
                tap.x0 = x;
                tap.x1 = x + 1;
                tap.t = t;

                pressure_taps[i] = tap;
            }

            dd = vec_scale(dd, 1 / pressure_taps_count);
            for (let tap of pressure_taps) {
                tap.dir = vec_sub(tap.dir, dd);
            }

        }


        let g = {};

        g.nx = nx;
        g.ny = ny;
        g.ncx = ncx;
        g.ncy = ncy;
        g.ngx = ngx;
        g.ngy = ngy;

        g.gx = gx;
        g.gy = gy;
        g.cx = cx;
        g.cy = cy;

        g.fa_over_celldist = fa_over_celldist;
        g.p_uv_factors = p_uv_factors;
        g.p_grads = p_grads;

        g.half_fa_vector = half_fa_vector;

        g.v_mu_fa_over_celldist = v_mu_fa_over_celldist;
        g.v_half_fa_vector = v_half_fa_vector;

        g.pressure_taps = pressure_taps;

        g.grid_position = function (x, y) {
            let i = gi(x, y);
            return [gx[i], gy[i]];
        }

        g.cell_position = function (x, y) {
            let i = ci(x, y);
            return [cx[i], cy[i]];
        }

        g.wall_vector = function (x) {
            return [wall_vectors[x * 2 + 0], wall_vectors[x * 2 + 1]];
        }

        g.uv_sample = function (px, py, x, y) {

            let i = gi(x, y);

            let d_sq = (gx[i] - px) * (gx[i] - px) + (gy[i] - py) * (gy[i] - py);

            while (true) {

                let i0 = gi(x, y - 1);
                let i1 = gi(x + 1, y);
                let i2 = gi(x, y + 1);
                let i3 = gi(x - 1, y);

                let d_sq0 = (gx[i0] - px) * (gx[i0] - px) + (gy[i0] - py) * (gy[i0] - py);
                let d_sq1 = (gx[i1] - px) * (gx[i1] - px) + (gy[i1] - py) * (gy[i1] - py);
                let d_sq2 = (gx[i2] - px) * (gx[i2] - px) + (gy[i2] - py) * (gy[i2] - py);
                let d_sq3 = (gx[i3] - px) * (gx[i3] - px) + (gy[i3] - py) * (gy[i3] - py);

                let best_x = x;
                let best_y = y;
                let best_d = d_sq;

                if (d_sq0 < best_d) {
                    best_y = y - 1;
                    best_d = d_sq0;
                }

                if (d_sq1 < best_d) {
                    best_x = x + 1;
                    best_y = y;
                    best_d = d_sq1;
                }

                if (d_sq2 < best_d) {
                    best_y = y + 1;
                    best_x = x;
                    best_d = d_sq2;
                }

                if (d_sq3 < best_d) {
                    best_x = x - 1;
                    best_y = y;
                    best_d = d_sq3;
                }


                if (best_x == x && best_y == y)
                    break;

                x = best_x;
                y = best_y;
                d_sq = best_d;

                x = (x + nx) % nx;
            }




            function inverse_bilerp(p0x, p0y, p1x, p1y, p2x, p2y, p3x, p3y, px, py) {

                let p0px = p0x - px;
                let p1px = p1x - px;
                let p0p2x = p0x - p2x;
                let p1p3x = p1x - p3x;

                let p0py = p0y - py;
                let p1py = p1y - py;
                let p0p2y = p0y - p2y;
                let p1p3y = p1y - p3y;

                let a = p0px * p0p2y - p0py * p0p2x;
                let b = (p0px * p1p3y - p0py * p1p3x + p1px * p0p2y - p1py * p0p2x) * 0.5;
                let c = p1px * p1p3y - p1py * p1p3x;


                let s = ((a - b) - sqrt(b * b - a * c)) / (a - 2 * b + c);
                let t = -1;
                if (s >= 0.0 && s <= 1.0)
                    t = ((1 - s) * p0px + s * p1px) / ((1 - s) * p0p2x + s * p1p3x);
                return [s, t];
            }

            let i00 = gi(x, y);

            let i0n = gi(x, y - 1);
            let i0p = gi(x, y + 1);
            let in0 = gi(x - 1, y);
            let ip0 = gi(x + 1, y);

            let inp = gi(x - 1, y + 1);
            let ipn = gi(x + 1, y - 1);
            let inn = gi(x - 1, y - 1);
            let ipp = gi(x + 1, y + 1);

            let st0 = inverse_bilerp(gx[inn], gy[inn],
                gx[i0n], gy[i0n],
                gx[in0], gy[in0],
                gx[i00], gy[i00],
                px, py);
            if (saturate(st0[0]) == st0[0] && saturate(st0[1]) == st0[1]) {
                return [x, y, -1, -1, st0[0], st0[1]];
            }

            let st1 = inverse_bilerp(gx[i0n], gy[i0n],
                gx[ipn], gy[ipn],
                gx[i00], gy[i00],
                gx[ip0], gy[ip0],
                px, py);

            if (saturate(st1[0]) == st1[0] && saturate(st1[1]) == st1[1]) {
                return [x, y, 1, -1, 1 - st1[0], st1[1]];
            }

            let st2 = inverse_bilerp(gx[in0], gy[in0],
                gx[i00], gy[i00],
                gx[inp], gy[inp],
                gx[i0p], gy[i0p],
                px, py);

            if (saturate(st2[0]) == st2[0] && saturate(st2[1]) == st2[1]) {
                return [x, y, -1, 1, st2[0], 1 - st2[1]];
            }

            let st3 = inverse_bilerp(gx[i00], gy[i00],
                gx[ip0], gy[ip0],
                gx[i0p], gy[i0p],
                gx[ipp], gy[ipp],
                px, py);


            if (saturate(st3[0]) == st3[0] && saturate(st3[1]) == st3[1]) {
                return [x, y, 1, 1, 1 - st3[0], 1 - st3[1]];
            }

            return [x, y, 0, 0, 0, 0];

        }


        return g;
    }

    function FVMSolver(geometry, topology, velocity = [1, 0]) {

        const pressure_steps = 6;

        const zero_pressure_boundary = false;


        const u0 = velocity[0];
        const v0 = velocity[1];

        const nx = geometry.nx;
        const ny = geometry.ny;
        const ncx = geometry.ncx;
        const ncy = geometry.ncy;
        const ngx = geometry.ngx;
        const ngy = geometry.ngy;

        let _u = new Float64Array(ncx * ncy);
        let _v = new Float64Array(ncx * ncy);

        let _u_new = new Float64Array(ncx * ncy);
        let _v_new = new Float64Array(ncx * ncy);

        let _p = new Float64Array(ncx * ncy);
        let _p_tmp = new Float64Array(ncx * ncy);
        let _p_rhs = new Float64Array(ncx * ncy);

        let p_values;
        let speed_values;

        let p = _p;


        const p_grad_coeff = geometry.p_grads;

        this.cell_velocity = function (x, y) {
            let i = ci(x, y);
            return [_u[i], _v[i]];
        }

        this.cell_pressure = function (x, y) {
            let i = ci(x, y);
            return p[i];
        }

        this.raw_pressure = function () {
            return p;
        }

        this.pressure_mesh_values = function () {

            if (!p_values)
                p_values = new Float32Array(ngx * ngy);

            for (let y = 0; y < ngy; y++) {
                for (let x = 0; x < ngx; x++) {
                    p_values[y * ngx + x] = p[ci(x, y)];
                }
            }
            return p_values;
        }

        this.speed_mesh_values = function () {
            if (!speed_values)
                speed_values = new Float32Array(ngx * ngy);

            for (let y = 0; y < ngy; y++) {
                for (let x = 0; x < ngx; x++) {
                    let ii = ci(x, y);
                    let uu = _u[ii];
                    let vv = _v[ii];
                    speed_values[y * ngx + x] = sqrt(uu * uu + vv * vv);
                }
            }
            return speed_values;
        }

        this.set_data = function (data, offset) {

            let n = ncx * ncy;

            for (let i = 0; i < n; i++) {
                _p[i] = _p_tmp[i] = data[offset + i];
                _u[i] = data[offset + n + i];
                _v[i] = data[offset + 2 * n + i];
            }
        }

        this.export_data = function () {
            let n = ncx * ncy;
            let data = new Float32Array(n * 3);

            for (let i = 0; i < n; i++) {
                data[i] = _p[i];
                data[n + i] = _u[i];
                data[2 * n + i] = _v[i];
            }

            return data;
        }


        this.u_array = function () { return u; }
        this.v_array = function () { return v; }

        let car = topology === "car";
        let cylinder = topology === "cylinder";


        function apply_cylinder_topology(f) {
            for (let y = 0; y < ny; y++) {
                f[ci(-1, y)] = f[ci(nx - 1, y)];
                f[ci(-2, y)] = f[ci(nx - 2, y)];
                f[ci(nx, y)] = f[ci(0, y)];
                f[ci(nx + 1, y)] = f[ci(1, y)];
            }


        }

        function apply_cylinder_v_boundary(f) {
            for (let x = -2; x < nx + 2; x++) {
                f[ci(x, 0)] = 0;
            }
        }







        function apply_car_v_boundary(f) {
            for (let x = 0; x < nx; x++) {
                f[ci(x, 0)] = 0;
            }

            for (let y = 1; y < ny; y++) {
                f[ci(0, y)] = f[ci(1, y)];
                f[ci(-1, y)] = f[ci(0, y)];

                f[ci(nx - 1, y)] = f[ci(nx - 2, y)];
                f[ci(nx, y)] = f[ci(nx - 1, y)];
            }
        }




        let ci = function (x, y) {

            x += 2;
            y += 2;

            return y * ncx + x;
        };

        for (let x = -2; x < nx + 2; x++) {
            for (let y = 0; y < ny + 2; y++) {
                let ip = ci(x, y);

                _u_new[ip] = _u[ip] = u0;
                _v_new[ip] = _v[ip] = v0;
            }
        }

        if (cylinder) {
            apply_cylinder_topology(_u);
            apply_cylinder_topology(_v);
            apply_cylinder_topology(_u_new);
            apply_cylinder_topology(_v_new);
        }


        this.set_geometry = function (g) {
            geometry = g;
        }

        this.rot_velocity = function (delta) {


            let c = cos(-delta);
            let s = sin(-delta);

            for (let x = -2; x < nx + 2; x++) {
                for (let y = 0; y < ny + 2; y++) {
                    let ip = ci(x, y);

                    let u = _u[ip];
                    let v = _v[ip];

                    _u_new[ip] = _u[ip] = u * c + v * s;
                    _v_new[ip] = _v[ip] = -u * s + v * c;

                }
            }


            if (cylinder) {
                apply_cylinder_v_boundary(_u);
                apply_cylinder_v_boundary(_v);
                apply_cylinder_topology(_u);
                apply_cylinder_topology(_v);
            } else if (car) {
                apply_car_v_boundary(_u);
                apply_car_v_boundary(_v);
            }
        }


        this.update = function (dt) {

            function update_velocity() {

                const v_mu_fa_over_celldist = geometry.v_mu_fa_over_celldist;
                const v_half_fa_vector = geometry.v_half_fa_vector;

                const u_new = _u_new;
                const v_new = _v_new;
                const v = _v;
                const u = _u;

                const nx = geometry.nx;
                const ny = geometry.ny;
                const ncx = geometry.ncx;
                const ncy = geometry.ncy;

                for (let y = 0; y < ny; y++) {
                    for (let x = 0; x < nx; x++) {

                        let ip = ci(x, y);

                        // let i0 = ci(x, y - 1);
                        // let i1 = ci(x + 1, y);
                        // let i2 = ci(x, y + 1);
                        // let i3 = ci(x - 1, y);

                        let i0 = ip - ncx;
                        let i1 = ip + 1;
                        let i2 = ip + ncx;
                        let i3 = ip - 1;

                        let uc = u[ip];
                        let vc = v[ip];

                        let u0 = u[i0];
                        let u1 = u[i1];
                        let u2 = u[i2];
                        let u3 = u[i3];

                        let v0 = v[i0];
                        let v1 = v[i1];
                        let v2 = v[i2];
                        let v3 = v[i3];


                        let fu0 = u0 + uc;
                        let fu1 = u1 + uc;
                        let fu2 = u2 + uc;
                        let fu3 = u3 + uc;

                        let fv0 = v0 + vc;
                        let fv1 = v1 + vc;
                        let fv2 = v2 + vc;
                        let fv3 = v3 + vc;

                        // halving is baked into the vector

                        let mf0 = (fu0 * v_half_fa_vector[ip * 8 + 0] + fv0 * v_half_fa_vector[ip * 8 + 1]);
                        let mf1 = (fu1 * v_half_fa_vector[ip * 8 + 2] + fv1 * v_half_fa_vector[ip * 8 + 3]);
                        let mf2 = (fu2 * v_half_fa_vector[ip * 8 + 4] + fv2 * v_half_fa_vector[ip * 8 + 5]);
                        let mf3 = (fu3 * v_half_fa_vector[ip * 8 + 6] + fv3 * v_half_fa_vector[ip * 8 + 7]);




                        let urhs = 0;
                        let vrhs = 0;

                        // convection


                        let i00 = i0 - ncx
                        let i11 = i1 + 1;
                        let i22 = i2 + ncx;
                        let i33 = i3 - 1;

                        let u00 = u[i00];
                        let u11 = u[i11];
                        let u22 = u[i22];
                        let u33 = u[i33];

                        let v00 = v[i00];
                        let v11 = v[i11];
                        let v22 = v[i22];
                        let v33 = v[i33];

                        const eps = 1e-25;

                        let du0 = u0 - uc;
                        let du1 = u1 - uc;
                        let du2 = u2 - uc;
                        let du3 = u3 - uc;


                        let rdenom_u0 = 0.5 / (du0 + eps);
                        let rdenom_u1 = 0.5 / (du1 + eps);
                        let rdenom_u2 = 0.5 / (du2 + eps);
                        let rdenom_u3 = 0.5 / (du3 + eps);

                        let ru0 = (mf0 > 0 ? -du2 : (u00 - u0)) * rdenom_u0;
                        let ru1 = (mf1 > 0 ? -du3 : (u11 - u1)) * rdenom_u1;
                        let ru2 = (mf2 > 0 ? -du0 : (u22 - u2)) * rdenom_u2;
                        let ru3 = (mf3 > 0 ? -du1 : (u33 - u3)) * rdenom_u3;


                        // min-mod, 0.5 baked in earlier
                        ru0 = max(min(ru0, 1), 0);
                        ru1 = max(min(ru1, 1), 0);
                        ru2 = max(min(ru2, 1), 0);
                        ru3 = max(min(ru3, 1), 0);

                        ru0 *= du0;
                        ru1 *= du1;
                        ru2 *= du2;
                        ru3 *= du3;

                        urhs -= (mf0 > 0 ? uc + ru0 : u0 - ru0) * mf0;
                        urhs -= (mf1 > 0 ? uc + ru1 : u1 - ru1) * mf1;
                        urhs -= (mf2 > 0 ? uc + ru2 : u2 - ru2) * mf2;
                        urhs -= (mf3 > 0 ? uc + ru3 : u3 - ru3) * mf3;


                        let dv0 = v0 - vc;
                        let dv1 = v1 - vc;
                        let dv2 = v2 - vc;
                        let dv3 = v3 - vc;


                        let rdenom_v0 = 0.5 / (dv0 + eps);
                        let rdenom_v1 = 0.5 / (dv1 + eps);
                        let rdenom_v2 = 0.5 / (dv2 + eps);
                        let rdenom_v3 = 0.5 / (dv3 + eps);

                        let rv0 = (mf0 > 0 ? -dv2 : (v00 - v0)) * rdenom_v0;
                        let rv1 = (mf1 > 0 ? -dv3 : (v11 - v1)) * rdenom_v1;
                        let rv2 = (mf2 > 0 ? -dv0 : (v22 - v2)) * rdenom_v2;
                        let rv3 = (mf3 > 0 ? -dv1 : (v33 - v3)) * rdenom_v3;

                        rv0 = max(min(rv0, 1), 0);
                        rv1 = max(min(rv1, 1), 0);
                        rv2 = max(min(rv2, 1), 0);
                        rv3 = max(min(rv3, 1), 0);

                        rv0 *= dv0;
                        rv1 *= dv1;
                        rv2 *= dv2;
                        rv3 *= dv3;


                        vrhs -= (mf0 > 0 ? vc + rv0 : v0 - rv0) * mf0;
                        vrhs -= (mf1 > 0 ? vc + rv1 : v1 - rv1) * mf1;
                        vrhs -= (mf2 > 0 ? vc + rv2 : v2 - rv2) * mf2;
                        vrhs -= (mf3 > 0 ? vc + rv3 : v3 - rv3) * mf3;


                        let foc0 = v_mu_fa_over_celldist[ip * 4 + 0];
                        let foc1 = v_mu_fa_over_celldist[ip * 4 + 1];
                        let foc2 = v_mu_fa_over_celldist[ip * 4 + 2];
                        let foc3 = v_mu_fa_over_celldist[ip * 4 + 3];

                        // diffusion

                        let grad_fu0 = du0 * foc0;
                        let grad_fu1 = du1 * foc1;
                        let grad_fu2 = du2 * foc2;
                        let grad_fu3 = du3 * foc3;

                        let grad_fv0 = dv0 * foc0;
                        let grad_fv1 = dv1 * foc1;
                        let grad_fv2 = dv2 * foc2;
                        let grad_fv3 = dv3 * foc3;

                        urhs += grad_fu0;
                        urhs += grad_fu1;
                        urhs += grad_fu2;
                        urhs += grad_fu3;

                        vrhs += grad_fv0;
                        vrhs += grad_fv1;
                        vrhs += grad_fv2;
                        vrhs += grad_fv3;

                        u_new[ip] = uc + urhs * dt;
                        v_new[ip] = vc + vrhs * dt;
                    }
                }



                if (cylinder) {
                    apply_cylinder_v_boundary(u_new);
                    apply_cylinder_v_boundary(v_new);
                    apply_cylinder_topology(u_new);
                    apply_cylinder_topology(v_new);
                } else if (car) {
                    apply_car_v_boundary(u_new);
                    apply_car_v_boundary(v_new);
                }
            }



            function update_pressure() {


                const fa_over_celldist = geometry.fa_over_celldist;
                const p_uv_factors = geometry.p_uv_factors;

                const nx = geometry.nx;
                const ny = geometry.ny;

                const ncx = geometry.ncx;

                let p = _p;
                let p_tmp = _p_tmp;
                const v_new = _v_new;
                const u_new = _u_new;

                const dt_inv = 1 / dt;

                const p_rhs = _p_rhs;


                for (let y = 0; y < ny; y++) {
                    for (let x = 0; x < nx; x++) {

                        let ip = (y + 2) * ncx + (x + 2);
                        // let ip = ci(x, y);

                        // let i00 = ip;
                        // let i10 = ci(x + 1, y);
                        // let i01 = ci(x, y + 1);
                        // let i11 = ci(x + 1, y + 1);

                        let i00 = ip;
                        let i10 = ip + 1;
                        let i01 = ip + ncx;
                        let i11 = ip + ncx + 1;

                        let u00 = u_new[i00];
                        let u10 = u_new[i10];
                        let u01 = u_new[i01];
                        let u11 = u_new[i11];

                        let v00 = v_new[i00];
                        let v10 = v_new[i10];
                        let v01 = v_new[i01];
                        let v11 = v_new[i11];

                        let rhs = 0;

                        rhs += u00 * p_uv_factors[ip * 8 + 0];
                        rhs += u10 * p_uv_factors[ip * 8 + 1];
                        rhs += u01 * p_uv_factors[ip * 8 + 2];
                        rhs += u11 * p_uv_factors[ip * 8 + 3];

                        rhs += v00 * p_uv_factors[ip * 8 + 4];
                        rhs += v10 * p_uv_factors[ip * 8 + 5];
                        rhs += v01 * p_uv_factors[ip * 8 + 6];
                        rhs += v11 * p_uv_factors[ip * 8 + 7];

                        rhs *= dt_inv;

                        p_rhs[ip] = rhs;
                    }
                }


                const y_limit = zero_pressure_boundary ? ny - 1 : ny;

                for (let k = 0; k < pressure_steps; k++) {


                    for (let y = 0; y < y_limit; y++) {
                        let p3 = p[ci(0 - 1, y)];
                        let pc = p[ci(0, y)];

                        for (let x = 0; x < nx; x++) {
                            let ip = (y + 2) * ncx + (x + 2);
                            let ip4 = ip * 4;
                            // let ip = ci(x, y);

                            // let i0 = ci(x, y - 1);
                            // let i1 = ci(x + 1, y);
                            // let i2 = ci(x, y + 1);
                            // let i3 = ci(x - 1, y);

                            let i0 = ip - ncx;
                            let i2 = ip + ncx;

                            let i1 = ip + 1;

                            let rhs = p_rhs[ip];

                            let p0 = p[i0];
                            let p1 = p[i1];
                            let p2 = p[i2];

                            rhs -= p0 * fa_over_celldist[ip4 + 0];
                            rhs -= p1 * fa_over_celldist[ip4 + 1];
                            rhs -= p2 * fa_over_celldist[ip4 + 2];
                            rhs -= p3 * fa_over_celldist[ip4 + 3];

                            p_tmp[ip] = rhs;

                            p3 = pc;
                            pc = p1;
                        }
                    }

                    let tmp = p;
                    p = p_tmp;
                    p_tmp = tmp;

                    for (let y = 0; y < ny; y++) {
                        p[ci(-1, y)] = p[ci(nx - 1, y)];
                        p[ci(nx, y)] = p[ci(0, y)];
                    }
                }
            }




            function fix_velocity() {

                const v_new = _v_new;
                const u_new = _u_new;
                const v = _v;
                const u = _u;

                for (let y = 0; y < ny; y++) {
                    let ip = (y + 2) * ncx + (0 + 2);
                    let i00 = ip - ncx - 1;
                    let i01 = ip - 1

                    let p00 = p[i00];
                    let p01 = p[i01];

                    for (let x = 0; x < nx; x++) {
                        let ip = (y + 2) * ncx + (x + 2);
                        // let ip = ci(x, y);

                        // let i00 = ci(x - 1, y - 1);
                        // let i10 = ci(x, y - 1);
                        // let i01 = ci(x - 1, y);
                        // let i11 = ci(x, y);


                        let i10 = ip - ncx;
                        let i11 = ip;


                        let p10 = p[i10];
                        let p11 = p[i11];

                        // 0.5 lerps are baked into p_grads

                        let dpds = (-p00 + p10 - p01 + p11);
                        let dpdt = (-p00 - p10 + p01 + p11);

                        let dpdx = dpds * p_grad_coeff[ip * 4 + 0] + dpdt * p_grad_coeff[ip * 4 + 2];
                        let dpdy = dpds * p_grad_coeff[ip * 4 + 1] + dpdt * p_grad_coeff[ip * 4 + 3];

                        u[ip] = u_new[ip] - dt * dpdx;
                        v[ip] = v_new[ip] - dt * dpdy;

                        p00 = p10;
                        p01 = p11;
                    }
                }

                if (cylinder) {
                    apply_cylinder_v_boundary(u);
                    apply_cylinder_v_boundary(v);
                    apply_cylinder_topology(u);
                    apply_cylinder_topology(v);
                } else if (car) {
                    apply_car_v_boundary(u);
                    apply_car_v_boundary(v);
                }

            }


            update_velocity();

            update_pressure();

            fix_velocity();

        }


    }

    function Drawer(container, mode, args) {
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

        play.onclick = function () {
            self.set_paused(!self.paused);
        }

        let state;
        let slider_args = [0, 0, 0];

        let arcball;
        let two_axis;

        let width, height;
        let aspect;

        let rot = args.rotation ? args.rotation : mat3_mul(rot_x_mat3(5.5), rot_z_mat3(2));

        let vp = ident_mat4;
        let proj;
        let ortho_proj;


        this.paused = true;
        this.requested_repaint = false;
        this.requested_tick = false;
        this.first_draw = true;


        if (args.has_arcball) {
            arcball = new ArcBall(rot, function () {
                rot = arcball.matrix.slice();
                request_repaint();
            });

            if (args.matrix) {
                rot = args.matrix.slice();
                arcball.set_matrix(rot);
            }

        } else if (args.two_axis) {

            two_axis = new TwoAxis();
            two_axis.set_angles([0, 0]);

            if (args.two_axis.angles)
                two_axis.set_angles(args.two_axis.angles);
            if (args.two_axis.horizontal_limits)
                two_axis.set_horizontal_limits(args.two_axis.horizontal_limits);
            if (args.two_axis.vertical_limits)
                two_axis.set_vertical_limits(args.two_axis.vertical_limits);

            rot = two_axis.matrix.slice();

            two_axis.set_callback(function () {
                rot = two_axis.matrix.slice();
                request_repaint();
            });


        }

        function event_canvas_coordinates(e) {
            let x = e.clientX;
            let y = e.clientY;

            let r = canvas.getBoundingClientRect();
            return [(x - r.left), (y - r.top)];
        }


        if (arcball || two_axis) {

            let object = arcball || two_axis;

            canvas.style.cursor = "grab";

            new TouchHandler(canvas,
                function (e) {
                    let c = event_canvas_coordinates(e);
                    canvas.style.cursor = "grabbing";
                    object.start(width - c[0], c[1]);
                    return true;
                },
                function (e) {
                    let c = event_canvas_coordinates(e);

                    object.update(width - c[0], c[1], e.timeStamp);
                    rot = object.matrix.slice();
                    request_repaint();
                    return true;
                },
                function (e) {
                    canvas.style.cursor = "grab";
                    object.end(e.timeStamp);
                });
        }

        let last_click_position = undefined;

        if (args.store_last_click) {
            canvas.addEventListener("click", e => {
                let p = event_canvas_coordinates(e);
                p = vec_scale(p, 1 / width);
                last_click_position = p;
            })
        }

        let draggables = args.draggables;
        let dragged_index = -1;
        let drag_delta;

        if (draggables) {

            function hit_test(p) {
                p = vec_scale(p, 1 / width);



                for (let i = draggables.length - 1; i >= 0; i--) {
                    let s = draggables[i].size;
                    s = s * s;
                    if (vec_len_sq(vec_sub(draggables[i].pos, p)) < s)
                        return i;
                }

                return -1;
            }

            canvas.addEventListener("mousemove", e => {

                if (dragged_index >= 0)
                    return;

                if (hit_test(event_canvas_coordinates(e)) >= 0) {
                    canvas.style.cursor = "grab";
                } else {
                    canvas.style.cursor = "default";
                }

                return true;
            }, false);


            new TouchHandler(canvas,
                function (e) {
                    let p = event_canvas_coordinates(e);

                    dragged_index = hit_test(p);

                    if (dragged_index >= 0) {
                        let ss_point = vec_scale(draggables[dragged_index].pos, width);
                        drag_delta = vec_sub(p, ss_point);
                        canvas.style.cursor = "grabbing";
                    }

                    return true;
                },
                function (e) {

                    if (dragged_index < 0)
                        return;

                    let p = event_canvas_coordinates(e);

                    let draggable = draggables[dragged_index];

                    let size = 2 * draggable.size * width;

                    p[0] = clamp(p[0] - drag_delta[0], size + 3, width - size - 3) / width;
                    p[1] = clamp(p[1] - drag_delta[1], size + 3, height * 0.95 - size - 3) / width;

                    if (draggable.limiter)
                        p = draggable.limiter(p);

                    draggable.pos = p;

                    request_repaint();
                    return true;
                },
                function (e) {
                    if (dragged_index < 0)
                        return;

                    let p = event_canvas_coordinates(e);

                    dragged_index = -1;

                    if (hit_test(p) >= 0) {
                        canvas.style.cursor = "grab";
                    } else {
                        canvas.style.cursor = "default";
                    }
                });
        }

        this.set_paused = function (p) {

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

        this.reset = function () {
            state = undefined;

            if (args.reset_sliders && sliders) {
                for (let i = 0; i < sliders.length; i++) {
                    slider_args[i] = slider_default_values[i];
                    sliders[i].set_value(slider_default_values[i]);
                }

            }

        }

        let t = 0;
        let prev_timestamp = undefined;

        function tick(timestamp) {

            self.requested_tick = false;

            let rect = canvas.getBoundingClientRect();

            let wh = window.innerHeight || document.documentElement.clientHeight;
            let ww = window.innerWidth || document.documentElement.clientWidth;

            if (prev_timestamp === undefined)
                prev_timestamp = timestamp;

            if (!(rect.top > wh || rect.bottom < 0 || rect.left > ww || rect.right < 0)) {

                const dt = Math.min((timestamp - prev_timestamp) / 1000, 1.0 / 20.0);
                t += dt;

                if (self.active || args.draggables || args.locations)
                    self.repaint(dt);
            }

            if (self.paused) {
                prev_timestamp = undefined;
            } else {
                prev_timestamp = timestamp;
                window.requestAnimationFrame(tick);
            }

        }

        if (args.animated) {
            wrapper.appendChild(play);
            animated_drawers.push(this);
        }

        if (args.has_reset) {

            let reset = document.createElement("div");
            reset.classList.add("restart_button");

            reset.onclick = function () {
                self.reset();
                self.set_paused(false);
            }

            wrapper.appendChild(reset);
        }

        if (args.simulated) {
            this.set_paused(false);
        }


        function request_repaint(force = false) {
            if (self.requested_repaint || (!self.paused && !self.first_draw && !force))
                return;

            self.requested_repaint = true;
            window.requestAnimationFrame(function () {
                self.repaint();
            });
        }

        this.active = true;

        this.set_active = function (x) {

            if (this.active == x)
                return;

            this.active = x;
            if (x) {
                container.classList.add("active_container");
                container.classList.remove("inactive_container");
            } else {
                container.classList.remove("active_container");
                container.classList.add("inactive_container");
            }
        }

        this.set_visible = function (x) {
            this.visible = x;
            if (x)
                request_repaint();
        }

        this.set_slider_arg = function (i, x) {
            slider_args[i] = x;
            if (args.simulated)
                this.set_paused(false);

            request_repaint();
        }

        let sliders;
        let slider_default_values;
        this.set_sliders = function (s, v) { sliders = s; slider_default_values = v; }

        this.set_rot = function (x) {
            rot = x;
            if (arcball)
                arcball.set_matrix(x);

            request_repaint();
        }



        this.reset();

        this.on_resize = function () {
            let new_width = wrapper.clientWidth;
            let new_height = wrapper.clientHeight;

            if (new_width == width && new_height == height)
                return;

            width = new_width;
            height = new_height;

            canvas.style.width = width + "px";
            canvas.style.height = height + "px";
            canvas.width = width * scale;
            canvas.height = height * scale;

            aspect = args.aspect ? args.aspect : width / height;

            let proj_w = 2;
            let proj_h = proj_w / aspect;

            ortho_proj = [
                1 / proj_w, 0, 0, 0,
                0, 1 / proj_h, 0, 0,
                0, 0, -0.015, 0,
                0, 0, 0, 1
            ];

            let fov = pi * 0.1;
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
            proj = mat4_mul(proj, translation_mat4([0, 0, -10.5]));


            let pad = 5;
            let a_size = Math.max(width, height) - pad * 2;

            let arcball_viewport = [width / 2 - a_size / 2 + pad,
            height / 2 - a_size / 2 + pad,
                a_size, a_size]

            if (arcball)
                arcball.set_viewport(arcball_viewport[0], arcball_viewport[1], arcball_viewport[2], arcball_viewport[3]);
            else if (two_axis)
                two_axis.set_size([width, height]);

            request_repaint();
        }


        this.repaint = function (dt = 0) {

            self.requested_repaint = false;

            if (!self.visible)
                return;

            if (width == 0 || height == 0)
                return;

            self.first_draw = false;

            vp = mat4_mul(proj, mat3_to_mat4(rot));

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

            function project(p) {
                p = vec_scale(p, 1 / p[3]);
                p[0] *= width * 0.5;
                p[1] *= -height * 0.5;
                return p;
            }

            const ctx = canvas.getContext("2d");

            ctx.resetTransform();
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.scale(scale, scale);
            ctx.setLineDash([]);

            let base_line_width = 1.5;

            let font_size = 20;

            if (window.innerWidth < 600)
                font_size = 17;
            else if (window.innerWidth < 400)
                font_size = 15;

            ctx.lineCap = "round";
            ctx.lineJoin = "round";
            ctx.lineWidth = base_line_width;

            ctx.font = font_size + "px IBM Plex Sans";
            ctx.textAlign = "center";
            ctx.globalAlpha = 1.0;
            ctx.globalCompositeOperation = "source-over";


            if (mode.startsWith("grass")) {

                if (mode !== "grass1") {
                    rot = ident_mat3;
                    vp = mat4_mul(ortho_proj, mat3_to_mat4(rot));
                    vp = mat4_mul(scale_mat4(1.6), vp);
                }

                const history_steps = 64;

                if (state === undefined) {
                    state = {};
                    state.t = 0;
                    state.grass_tilt = new Float32Array(grass_count * 2);
                    state.leaves = new Array(leaf_count);

                    state.leaves_history = new Float32Array(leaf_count * 2 * history_steps);
                    state.history_i = 0;
                    state.history_t = 0;

                    for (let i = 0; i < leaf_count; i++) {
                        let leaf = {};
                        leaf.pos = [random() * 2 - 1, random() * 2 - 1, random() * 0.5 + 0.5];
                        leaf.ttl = -i;
                        leaf.phase = random() * 2 * pi;;
                        leaf.rot = random() * 2 * pi;
                        leaf.scale = random() * 0.2 + 0.8;
                        leaf.color = random() * 0.2 + 0.8;


                        state.leaves[i] = leaf;

                        state.leaves_history[(i * history_steps + history_steps - 1) * 2] = NaN;
                    }
                }

                dt *= slider_args[0] * 2.0;

                state.t += dt;

                let t = state.t;
                let grass_tilt = state.grass_tilt;
                let leaves = state.leaves;
                let history = state.leaves_history;

                // potential field:
                // p = x + 5*(sin(y + t + cos(0.3*x + t*1.4)) + cos(x + t + sin(y) + t))

                let vx = function (x, y, t) {
                    x = 1.5 * x + 2;
                    y = 1.5 * y + 2;
                    return 1 + -1.5 * cos(t + y + cos(1.4 * t + 0.3 * x)) * sin(1.4 * t + 0.3 * x) - 5 * sin(2 * t + x + sin(y));
                }
                let vy = function (x, y, t) {
                    x = 1.5 * x + 2;
                    y = 1.5 * y + 2;
                    return 5 * (cos(t + y + cos(1.4 * y + 0.3 * x)) - cos(y) * sin(2 * t + x + sin(y)));
                }

                if (mode === "grass5") {
                    let v = 4;

                    let a = -slider_args[1] * 2 * pi + pi;
                    let c = cos(a);
                    let s = sin(a);


                    vx = function (x_, y_, t_) {

                        let x = x_ * c - y_ * s;
                        let y = x_ * s + y_ * c;

                        return v * y * cos(3 * x * y) + 4 * c;
                    };
                    vy = function (x_, y_, t_) {

                        let x = x_ * c - y_ * s;
                        let y = x_ * s + y_ * c;

                        return v * x * cos(3 * x * y) - 4 * s;
                    };
                }

                for (let y = 0; y < grass_y; y++) {
                    for (let x = 0; x < grass_x; x++) {
                        let i = y * grass_x + x;
                        let xx = x / (grass_x - 1) * 2.0 - 1.0;
                        let yy = y / (grass_y - 1) * 2.0 - 1.0;

                        grass_tilt[i * 2 + 0] = 0.03 * vx(xx, yy, t);
                        grass_tilt[i * 2 + 1] = 0.03 * vy(xx, yy, t);
                    }
                }

                const leaf_space = 1.3;

                for (let i = 0; i < leaf_count; i++) {

                    let leaf = leaves[i];

                    if (leaf.ttl > 0) {

                        let x = leaf.pos[0];
                        let y = leaf.pos[1];
                        leaf.pos[0] += 0.15 * vx(x, y, t) * dt;
                        leaf.pos[1] += 0.15 * vy(x, y, t) * dt;
                        leaf.pos[2] -= 0.05 * dt;

                        if (dt > 0) {
                            history[(i * history_steps + state.history_i) * 2 + 0] = leaf.pos[0];
                            history[(i * history_steps + state.history_i) * 2 + 1] = leaf.pos[1];
                        }
                    } else if (dt > 0) {
                        history[(i * history_steps + state.history_i) * 2 + 0] = NaN;
                    }

                    let max_pos = max(abs(leaf.pos[0]), abs(leaf.pos[1]));


                    if (max_pos > leaf_space) {
                        leaf.pos[0] = Math.random() * 1.8 - 0.9;
                        leaf.pos[1] = Math.random() * 1.8 - 0.9;
                        leaf.pos[2] = Math.random() * 0.5 + 0.5;
                        leaf.ttl = -(1 + random() * 20);

                        leaf.phase = random() * 2 * pi;;
                        leaf.rot = random() * 2 * pi;


                        if (dt > 0) {
                            let hi = state.history_i;
                            let hin = (state.history_i + history_steps - 1) % history_steps;

                            history[(i * history_steps + hin) * 2 + 0] = NaN;

                            history[(i * history_steps + hi) * 2 + 0] = leaf.pos[0];
                            history[(i * history_steps + hi) * 2 + 1] = leaf.pos[1];
                        }
                    } else if (max_pos > 1) {
                        leaf.ttl = (1.0 - smooth_step(1, leaf_space, max_pos));
                    } else {
                        leaf.ttl = min(1, leaf.ttl + 3.0 * dt);
                    }
                }




                if (mode !== "grass5") {

                    let glw = mode === "grass4" ? width : height;

                    let mat = scale_mat4(mode === "grass1" ? 0.9 : 1.0);
                    mat = mat4_mul(translation_mat4([0, 0, -0.8]), mat);
                    mat = mat4_mul(vp, mat);

                    gl.begin(glw, height);
                    gl.viewport(0, 0, height, height);




                    gl.draw_grass(mat, rot, grass_tilt);
                    gl.draw_ground(mat, rot);

                    for (let leaf of leaves) {

                        let mat = scale_mat4(leaf.scale);

                        mat = mat4_mul(rot_y_mat4(0.3 * sin(10 * t + leaf.phase)), mat);
                        mat = mat4_mul(rot_z_mat4(leaf.rot), mat);
                        mat = mat4_mul(translation_mat4(leaf.pos), mat);

                        mat = mat4_mul(vp, mat);

                        let color = vec_scale([0.88 - 0.03 * leaf.phase, 0.61 - 0.03 * leaf.phase, 0.04, 1.0], leaf.ttl);

                        gl.draw_leaf(mat, rot, { color: color });
                    }

                    if (mode === "grass4") {
                        let inset = round(height * 0.08);
                        gl.viewport(height + inset, inset, height - 2 * inset, height - 2 * inset);

                        gl.draw_full("velocity_grass", {
                            aspect: 1,
                            t: t
                        });
                    }


                    gl.draw_full("sky", {
                        rot: rot
                    });



                    ctx.drawImage(gl.finish(), 0, 0, glw, height);

                }

                if (mode !== "grass1" && mode !== "grass4") {

                    ctx.save();

                    if (mode !== "grass5") {
                        ctx.translate(height, 0);
                    }

                    ctx.translate(round(height / 2), round(height / 2));

                    let ww = 1.0;

                    let vpx = -ww;
                    let vpy = -ww;
                    let vpw = 2 * ww;
                    let vph = 2 * ww;

                    let v_spacing = 0.1;
                    let view_scale = 0.8 * height / vpw;

                    if (mode === "grass5") {
                        v_spacing = 0.1;
                        view_scale = 0.95 * height / vpw;
                    }

                    ctx.scale(view_scale, view_scale);
                    ctx.lineWidth = 1.5 / view_scale;

                    ctx.strokeStyle = "#555";






                    {
                        let x0 = ceil(vpx / v_spacing) * v_spacing;
                        let y0 = ceil(vpy / v_spacing) * v_spacing;
                        let x1 = ceil((vpx + vpw) / v_spacing) * v_spacing;
                        let y1 = ceil((vpy + vph) / v_spacing) * v_spacing;


                        if (mode === "grass2a") {
                            ctx.save();
                            let pp = v_spacing * 0.25;
                            ctx.setLineDash([pp * 0.5, pp * 0.5]);
                            ctx.lineCap = "butt";
                            ctx.strokeStyle = "#F3928D";


                            for (let y = y0; y < y1; y += v_spacing) {
                                for (let x = x0; x < x1; x += v_spacing) {


                                    ctx.strokeRect(-pp + x, -pp + y, 2 * pp, 2 * pp);
                                }
                            }

                            ctx.restore();
                        }

                        if (mode === "grass2" || mode === "grass2a") {
                            ctx.strokeStyle = "#435e27";
                        } else if (mode === "grass3") {
                            ctx.strokeStyle = "#D6DBD0";
                        } else if (mode === "grass5") {
                            ctx.strokeStyle = "#A8B29B";
                        }

                        ctx.fillEllipse(-1 * view_scale, 1 * view_scale, 4);

                        const v_scale = 0.012;

                        for (let y = y0; y < y1; y += v_spacing) {
                            for (let x = x0; x < x1; x += v_spacing) {

                                let vvx = vx(x, y, t) * v_scale;
                                let vvy = vy(x, y, t) * v_scale;

                                ctx.strokeLine(x, -y,
                                    (x + vvx),
                                    -(y + vvy));

                                ctx.strokeLine((x + vvx), -(y + vvy),
                                    (x + vvx * 0.8) + vvy * 0.2, -(y + vvy * 0.8) + vvx * 0.2);

                                ctx.strokeLine((x + vvx), -(y + vvy),
                                    (x + vvx * 0.8) - vvy * 0.2, -(y + vvy * 0.8) - vvx * 0.2);
                            }
                        }

                        if (mode === "grass3" || mode === "grass5") {

                            ctx.strokeStyle = ctx.fillStyle = "#715728";
                            ctx.lineCap = "butt";

                            for (let k = 0; k < history_steps - 1; k++) {

                                let t = 1.0 - k / history_steps;

                                let hi = (state.history_i + history_steps - k) % history_steps;
                                let hin = (state.history_i + history_steps - k - 1) % history_steps;

                                ctx.globalAlpha = t * t * 0.6;

                                for (let i = 0; i < leaf_count; i++) {

                                    if (isNaN(history[(i * history_steps + hin) * 2 + 0]))
                                        continue;
                                    ctx.strokeLine(history[(i * history_steps + hi) * 2 + 0],
                                        -history[(i * history_steps + hi) * 2 + 1],
                                        history[(i * history_steps + hin) * 2 + 0],
                                        -history[(i * history_steps + hin) * 2 + 1]);

                                }
                            }

                            ctx.globalAlpha = 1;

                            for (let leaf of leaves) {

                                if (leaf.ttl < 0)
                                    continue;
                                ctx.globalAlpha = leaf.ttl;
                                ctx.fillEllipse(leaf.pos[0], -leaf.pos[1], 0.02);

                            }
                        }
                    }

                    ctx.restore();

                }

                if (mode === "grass5") {

                    ctx.feather(height * scale, height * scale,
                        canvas.width * 0.1, canvas.width * 0.1,
                        canvas.width * 0.1, canvas.width * 0.1);
                } else if (mode === "grass1") {
                    ctx.feather(height * scale, height * scale,
                        canvas.width * 0.1, canvas.width * 0.1,
                        canvas.width * 0.1, canvas.width * 0.1);
                } else {
                    ctx.feather(height * scale, height * scale,
                        canvas.width * 0.05, canvas.width * 0.05,
                        canvas.width * 0.05, canvas.width * 0.05);
                }

                if (mode === "grass4") {
                    let inset = round(height * 0.08);

                    ctx.feather(ceil((height - 2 * inset) * scale), (height - 2 * inset) * scale,
                        canvas.width * 0.02, canvas.width * 0.02,
                        canvas.width * 0.02, canvas.width * 0.02,
                        floor((height + inset) * scale), (inset) * scale);

                    ctx.translate(width * 0.75, height * 0.95);
                    draw_speed_scale(width * 0.3, height * 0.04);

                } else {


                    ctx.feather(height * scale, height * scale,
                        canvas.height * 0.1, canvas.height * 0.1,
                        canvas.height * 0.1, canvas.height * 0.1,
                        height * scale, 0);
                }

                ctx.strokeStyle = "#999";
                ctx.lineWidth = 1;

                if (mode != "grass1" && mode != "grass5")
                    ctx.strokeLine(height, height * 0.05, height, height * 0.95);



                if (dt > 0) {
                    state.history_t += dt;

                    if (state.history_t > 0.05) {
                        state.history_i = (state.history_i + 1) % history_steps;
                        state.history_t -= 0.05;
                    }


                }

            } else if (mode === "laminar_turb_comparison") {


                ctx.font = "500 " + font_size + "px IBM Plex Sans";

                let sc = width * 0.0012;
                ctx.save();


                ctx.translate(width / 2, 5);
                ctx.scale(sc, sc);
                ctx.lineWidth = 4 / sc;

                ctx.save();

                ctx.translate(1.10181769, 347.421589);

                ctx.globalAlpha = 1.0;
                ctx.fillStyle = "#777";
                ctx.strokeStyle = "#333";

                ctx.beginPath();
                ctx.lineWidth *= 1.2;
                ctx.rect(-1000, 5, 2000, 100);
                ctx.stroke();
                ctx.fill();


                ctx.restore();

                ctx.save();


                ctx.translate(-129, 0);
                ctx.translate(-width * 0.25 / sc, 0);
                let l0 = [50, 170, 241, 256, 259, 259, 259, 259, 259, 259, 259, 259, 259];

                let grd = ctx.createLinearGradient(0, 0, 0, 353);

                for (let i = 0; i < 24; i++) {
                    let y = -10 - 15 * i;
                    let t = -y / 370;

                    let iv = i / 2;
                    let fract = iv % 1;
                    iv = iv >>> 0;

                    let v = (1 - fract) * l0[iv] + fract * l0[iv + 1];
                    let ii = 200 / 255 * v / 259 * (velocity_lut.length - 1);
                    let it = ii % 1;
                    ii = ii >>> 0;

                    let c = vec_lerp(velocity_lut[ii], velocity_lut[ii + 1], it);
                    c = vec_scale(c, 1 / 255);
                    grd.addColorStop(1 - t, rgba_color_string(c));
                }

                let c0 = vec_scale(velocity_lut[0], 1 / 255);
                grd.addColorStop(1, rgba_color_string(c0));


                ctx.fillStyle = grd;
                ctx.fillRect(-100, 0, 500, 350);

                ctx.strokeStyle = ctx.fillStyle = "#f8f8f8";

                ctx.beginPath();
                ctx.moveTo(1.10181769, 347.421589);
                ctx.bezierCurveTo(45.4400938, 338.564782, 79.5092344, 331.340326, 103.30924, 325.748221);
                ctx.bezierCurveTo(139.009247, 317.360064, 186.976569, 303.361669, 200.851872, 298.326566);
                ctx.bezierCurveTo(214.727175, 293.291462, 228.186909, 287.051448, 238.714143, 278.39044);
                ctx.bezierCurveTo(249.241377, 269.729432, 253.644214, 259.213473, 256.252953, 245.715704);
                ctx.bezierCurveTo(257.992113, 236.717191, 258.861692, 225.327819, 258.861692, 211.547587);
                ctx.lineTo(258.861692, 0.534347515);
                ctx.stroke();

                ctx.globalAlpha = 0.7;

                ctx.translate(1.10181769, 347.421589);

                for (let i = 0; i < 12; i++) {
                    let y = -10 - 30 * i;
                    ctx.arrow(0, y, l0[i], y, 5, 13, 20);
                    ctx.fill();
                }

                ctx.globalAlpha = 0.6;
                ctx.setLineDash([0.01, 10.0]);
                ctx.lineWidth *= 0.8;
                ctx.strokeLine(0, 0, 300, -60);
                ctx.setLineDash([]);

                ctx.globalAlpha = 0.2;
                ctx.strokeLine(0, 0, 0, -347);

                ctx.restore();

                ctx.save();
                ctx.translate(-129, 0);
                ctx.translate(width * 0.25 / sc, 0);

                let l1 = [140, 184, 200, 212, 222, 230, 237, 243, 248, 252, 255, 258, 259];


                grd = ctx.createLinearGradient(0, 0, 0, 353);


                for (let i = 0; i < 24; i++) {
                    let y = -10 - 15 * i;
                    let t = -y / 370;

                    let iv = i / 2;
                    let fract = iv % 1;
                    iv = iv >>> 0;

                    let v = (1 - fract) * l1[iv] + fract * l1[iv + 1];
                    let ii = 200 / 255 * v / 259 * (velocity_lut.length - 1);
                    let it = ii % 1;
                    ii = ii >>> 0;

                    let c = vec_lerp(velocity_lut[ii], velocity_lut[ii + 1], it);
                    c = vec_scale(c, 1 / 255);
                    grd.addColorStop(1 - t, rgba_color_string(c));
                }

                grd.addColorStop(1, rgba_color_string(c0));
                ctx.fillStyle = grd;
                ctx.fillRect(-100, 0, 500, 350);

                ctx.strokeStyle = ctx.fillStyle = "#f8f8f8";

                ctx.beginPath();
                ctx.moveTo(1.10181769, 347.421589);
                ctx.bezierCurveTo(1.36727256, 347.473863, 19.1308712, 346.923196, 54.3926136, 345.769587);
                ctx.bezierCurveTo(85.8681742, 344.739845, 118, 343.739845, 127.420434, 341.702294);
                ctx.bezierCurveTo(146.592367, 337.555584, 162.123559, 330.219894, 176.265409, 315.893233);
                ctx.bezierCurveTo(190.407259, 301.566572, 201.581371, 278.540406, 215.354822, 239.417613);
                ctx.bezierCurveTo(229.128274, 200.29482, 235.160653, 173.977968, 245.503564, 119.567877);
                ctx.bezierCurveTo(252.398837, 83.2944829, 256.851547, 43.6166397, 258.861692, 0.534347515);
                ctx.stroke();


                ctx.globalAlpha = 0.7;
                ctx.translate(1.10181769, 347.421589);

                for (let i = 0; i < 12; i++) {

                    let y = -10 - 30 * i;
                    ctx.arrow(0, y, l1[i], y, 5, 13, 20);
                    ctx.fill();
                }

                ctx.globalAlpha = 0.6;

                ctx.setLineDash([0.01, 10.0]);
                ctx.lineWidth *= 0.8;
                ctx.strokeLine(0, 0, 300, -10);
                ctx.setLineDash([]);

                ctx.globalAlpha = 0.2;
                ctx.strokeLine(0, 0, 0, -347);

                ctx.restore();



                ctx.restore();



                ctx.feather(floor(width * 0.5 * scale), height * scale * 0.88,
                    canvas.height * 0.15, canvas.height * 0.15,
                    canvas.height * 0.15, canvas.height * 0.15);

                ctx.feather(ceil(width * 0.5 * scale), height * scale * 0.88,
                    canvas.height * 0.15, canvas.height * 0.15,
                    canvas.height * 0.15, canvas.height * 0.15,
                    floor(width * 0.5 * scale), 0);


                ctx.fillStyle = "#4A9ABA";
                ctx.fillText("laminar", width * 0.25, height - font_size * 0.5);

                ctx.fillStyle = "#DA882D";
                ctx.fillText("turbulent", width * 0.75, height - font_size * 0.5);
            } else if (mode === "bottle") {

                const n = 128;

                if (state === undefined) {
                    state = {};

                    state.values = new Float64Array(n);
                    state.new_values = new Float64Array(n);
                    for (let i = 0; i < n / 2; i++) {
                        state.values[i] = 1.0;
                    }
                }

                dt *= slider_args[0] * 0.1;
                dt = min(dt, 0.01);
                const diff = 50;

                let iters = 100;

                for (let k = 0; k < iters; k++) {
                    for (let i = 1; i < n - 1; i++) {
                        let v0 = state.values[i - 1];
                        let vc = state.values[i];
                        let v1 = state.values[i + 1];
                        state.new_values[i] = vc + diff * dt * (v0 - 2 * vc + v1);
                    }

                    state.new_values[0] = state.new_values[1];
                    state.new_values[n - 1] = state.new_values[n - 2];

                    let tmp = state.values;
                    state.values = state.new_values;
                    state.new_values = tmp;
                }

                let sc = width * 1.15;
                ctx.translate(width, 0);
                ctx.scale(-sc, sc);

                ctx.translate(0.025, 0.13);

                let c0 = rgba_hex_color(0xFF251C);
                let c1 = rgba_hex_color(0x43A9DF);

                for (let i = 0; i < 3; i++) {
                    c0[i] *= c0[i];
                    c1[i] *= c1[i];
                }

                c0[3] = c1[3] = 0.5;

                let grd = ctx.createLinearGradient(0, -0.12, 0, 0.12);
                for (let i = 0; i < n; i++) {
                    let t = i / (n - 1);
                    let c = vec_lerp(c0, c1, state.values[i]);
                    c[0] = sqrt(c[0]);
                    c[1] = sqrt(c[1]);
                    c[2] = sqrt(c[2]);
                    grd.addColorStop(t, rgba_color_string(c));
                }
                ctx.fillStyle = grd;
                ctx.strokeStyle = "rgba(0,0,0,0.3)";

                ctx.lineWidth = 0.01;
                ctx.beginPath();

                ctx.lineTo(0, -0.1);
                ctx.lineTo(0, 0.1);
                ctx.bezierCurveTo(0, 0.11, 0.01, 0.12, 0.02, 0.12);
                ctx.lineTo(0.5, 0.12);
                ctx.bezierCurveTo(0.65, 0.12, 0.7, 0.04, 0.75, 0.04);
                ctx.lineTo(0.8, 0.04);
                ctx.lineTo(0.8, -0.04);
                ctx.lineTo(0.75, -0.04);
                ctx.bezierCurveTo(0.7, -0.04, 0.65, -0.12, 0.5, -0.12);
                ctx.lineTo(0.02, -0.12);
                ctx.bezierCurveTo(0.01, -0.12, 0.0, -0.11, 0.0, -0.1);

                ctx.fill();
                ctx.stroke();

                ctx.lineWidth = 0.004;
                ctx.strokeStyle = "#f8f8f8";
                ctx.stroke();


                grd = ctx.createLinearGradient(0, -0.05, 0, 0.05);
                for (let i = 0; i < 64; i++) {
                    let t = i / 63;

                    let b = 0.4 + 0.3 * sin(t * pi);
                    b += 0.1 * cos(t * 40 * pi);

                    grd.addColorStop(t, rgba_color_string([b, b, b, 1]));
                }
                ctx.fillStyle = grd;

                let grd2 = ctx.createLinearGradient(0.817, 0, 0.814, 0.0);
                grd2.addColorStop(0, rgba_color_string([0.6, 0.6, 0.6, 1]));
                grd2.addColorStop(1, rgba_color_string([0.6, 0.6, 0.6, 0]));

                ctx.beginPath();
                ctx.lineTo(0.75, -0.05);
                ctx.lineTo(0.75, 0.05);
                ctx.lineTo(0.81, 0.05);
                ctx.bezierCurveTo(0.815, 0.05, 0.82, 0.045, 0.82, 0.04);
                ctx.lineTo(0.82, -0.04);
                ctx.bezierCurveTo(0.82, -0.045, 0.815, -0.05, 0.81, -0.05);
                ctx.lineTo(0.75, -0.05);

                ctx.strokeStyle = "#555";
                ctx.lineWidth = 0.003;
                ctx.fill();

                ctx.fillStyle = grd2;
                ctx.fill();

                ctx.stroke();

            } else if (mode === "parcels_crossing") {

                let t = slider_args[0] + 0.2;

                let hh = round(height * 0.5);

                function bezier(t, ps) {
                    let nt = 1 - t;
                    let x0 = ps[0][0] * nt * nt * nt;
                    let x1 = ps[1][0] * 3 * nt * nt * t;
                    let x2 = ps[2][0] * 3 * nt * t * t;
                    let x3 = ps[3][0] * t * t * t;

                    let y0 = ps[0][1] * nt * nt * nt;
                    let y1 = ps[1][1] * 3 * nt * nt * t;
                    let y2 = ps[2][1] * 3 * nt * t * t;
                    let y3 = ps[3][1] * t * t * t;
                    return [x0 + x1 + x2 + x3, y0 + y1 + y2 + y3];
                }

                function bezier_tan(t, ps) {

                    let nt = 1 - t;
                    let x0 = ps[0][0] * -3 * nt * nt;
                    let x1 = ps[1][0] * 3 * (nt * nt - 2 * t * nt);
                    let x2 = ps[2][0] * -3 * (t * t - 2 * nt * t);
                    let x3 = ps[3][0] * 3 * t * t;

                    let y0 = ps[0][1] * -3 * nt * nt;
                    let y1 = ps[1][1] * 3 * (nt * nt - 2 * t * nt);
                    let y2 = ps[2][1] * -3 * (t * t - 2 * nt * t);
                    let y3 = ps[3][1] * 3 * t * t;
                    return [x0 + x1 + x2 + x3, y0 + y1 + y2 + y3];
                }

                function draw_trail(limit, ps) {
                    let t = limit;
                    let p = bezier(t, ps);

                    while (t >= 0) {
                        let tn = t - 0.02;
                        let pn = bezier(tn, ps);

                        ctx.globalAlpha = 0.6 * (1.0 - (limit - t));
                        ctx.strokeLine(p[0], p[1], pn[0], pn[1]);

                        t = tn;
                        p = pn;
                    }
                    ctx.globalAlpha = 1;
                }


                let b0 = [[-1, 0], [-0.5, 0], [0.5, 0], [1, -0.5]];
                let b1 = [[0, -1], [0, -0.5], [0.0, 0.5], [0.6, 1]];

                let c0 = "#DA882D";
                let c1 = "#4A9ABA";

                function draw(offset) {
                    ctx.lineWidth = 0.025;
                    ctx.lineCap = "butt"

                    ctx.strokeStyle = c0;
                    draw_trail(t, b0);
                    ctx.strokeStyle = c1;
                    draw_trail(t - offset, b1);

                    let p0 = bezier(t, b0);
                    let p1 = bezier(t - offset, b1);

                    let tan0 = (bezier_tan(t, b0));
                    let tan1 = (bezier_tan(t - offset, b1));

                    let ss = 0.1;
                    ctx.fillStyle = c0;
                    ctx.fillEllipse(p0[0], p0[1], 0.04);

                    ctx.globalAlpha = 0.8;
                    ctx.arrow(p0[0], p0[1], p0[0] + tan0[0] * ss, p0[1] + tan0[1] * ss,
                        0.02, 0.06, 0.08);
                    ctx.fill();

                    ctx.globalAlpha = 1;
                    ctx.fillStyle = c1;
                    ctx.fillEllipse(p1[0], p1[1], 0.04);

                    ctx.globalAlpha = 0.8;
                    ctx.arrow(p1[0], p1[1], p1[0] + tan1[0] * ss, p1[1] + tan1[1] * ss,
                        0.02, 0.06, 0.08);
                    ctx.fill();

                    ctx.globalAlpha = 1;

                    ctx.feather(height * scale, height * scale * 0.9,
                        canvas.height * 0.1, canvas.height * 0.1,
                        canvas.height * 0.1, canvas.height * 0.1);

                }


                ctx.save();


                ctx.translate(hh, hh);
                ctx.beginPath();
                ctx.rect(-hh, -hh, hh * 2, hh * 2);
                ctx.clip();

                ctx.scale(hh, hh);

                draw(0.058);

                ctx.restore();

                ctx.save();


                ctx.translate(3 * hh, hh);
                ctx.beginPath();
                ctx.rect(-hh, -hh, hh * 2, hh * 2);
                ctx.clip();

                ctx.scale(hh, hh);
                draw(0.3);

                ctx.restore();

                ctx.feather(height * scale, height * scale * 0.9,
                    canvas.height * 0.1, canvas.height * 0.1,
                    canvas.height * 0.1, canvas.height * 0.1,
                    height * scale, 0);

                ctx.strokeLine(height, 0, height, height);

                ctx.fillText("not realistic", hh, height * 0.95);
                ctx.fillText("conditionally realistic", 3 * hh, height * 0.95);

            } else if (mode.startsWith("vector_average")) {

                const pos_spread = 20;
                const vel_spread = 20;
                let sc = 0.065;


                let colors = [
                    rgba_hex_color(0xD04848),
                    rgba_hex_color(0xF3B95F),
                    rgba_hex_color(0x6895D2),
                ]

                let sphere_color = rgba_hex_color(0x666666);
                let sum_color = rgba_hex_color(0x4FA075);
                let avg_color = rgba_hex_color(0x333333);

                let count = 3;
                let vectors = [[1, 0, 0], [0.2, 0.8, 0.4], [-0.3, -0.0, -0.5]];
                let positions = [[0.3, 0, 0], [-0.2, 0.5, -0.4], [-0.3, -0.4, -0.3]];

                for (let i = 0; i < count; i++) {
                    positions[i] = vec_scale(positions[i], pos_spread);
                    vectors[i] = vec_scale(vectors[i], vel_spread);
                }


                let w = round(0.5 * width);


                gl.begin(width, width);


                for (let step = 0; step < 4; step++) {

                    let x = step & 1;
                    let y = (step >> 1) & 1;

                    gl.viewport(x * w, (1 - y) * w, w, w);


                    let tv = [0, 0, 0];

                    for (let i = 0; i < count; i++) {
                        tv = vec_add(tv, vectors[i]);
                    }
                    let p0 = vec_scale(tv, -0.5);

                    let avg = vec_scale(tv, 1 / count);

                    for (let i = 0; i < count; i++) {

                        let v = vectors[i];
                        let pp = positions[i];
                        let p = step == 0 ? pp : p0;

                        p0 = vec_add(p0, v);


                        let ll = vec_len(v) - 5;

                        let r = arrow_rot_to_dir(vec_norm(v))

                        let mat = mat3_to_mat4(r);
                        mat = mat4_mul(translation_mat4(p), mat);
                        mat = mat4_mul(scale_mat4(sc), mat);
                        mat = mat4_mul(vp, mat);

                        r = mat3_mul(rot, r);

                        let c = vec_lerp(colors[i], [0.9, 0.9, 0.9, 1.0], step < 2 ? 0.0 : 0.7);

                        if (step !== 3)
                            gl.draw_arrow(mat, r, { color: c, length: ll });

                        if (step === 0) {
                            let ball_mat = scale_mat4(2.0);
                            ball_mat = mat4_mul(translation_mat4(p), ball_mat);
                            ball_mat = mat4_mul(scale_mat4(sc), ball_mat);
                            ball_mat = mat4_mul(vp, ball_mat);

                            gl.draw_sphere(ball_mat, rot,
                                { type: "plain_sphere", color: sphere_color });
                        }
                    }


                    if (step == 2 || step == 3) {

                        let v = step == 2 ? tv : avg;
                        let ll = vec_len(v) - 5;

                        let r = arrow_rot_to_dir(vec_norm(v))

                        let mat = mat3_to_mat4(r);
                        mat = mat4_mul(translation_mat4(vec_scale(v, -0.5)), mat);
                        mat = mat4_mul(scale_mat4(sc), mat);
                        mat = mat4_mul(vp, mat);

                        r = mat3_mul(rot, r);

                        gl.draw_arrow(mat, r, { color: step == 2 ? sum_color : avg_color, length: ll });
                    }

                }


                ctx.drawImage(gl.finish(), 0, 0, width, width);

                ctx.strokeStyle = "#ddd"
                ctx.strokeLine(w, 10, w, w - 10);
                ctx.strokeLine(w, w + 10, w, 2 * w - 20);
                ctx.strokeLine(10, w, w - 10, w);
                ctx.strokeLine(w + 10, w, 2 * w - 20, w);

                ctx.fillText("1. Take velocities", w * 0.5, w - font_size);
                ctx.fillText("2. Place head to toe", w * 1.5, w - font_size);
                ctx.fillText("3. Connect first and last", w * 0.5, 2 * w - font_size);
                ctx.fillText("4. Scale down", w * 1.5, 2 * w - font_size);

            } else if (mode.startsWith("vehicle")) {

                let h = floor(height * 0.5);
                let w = width;

                let ww = 100;
                let s = width / ww;

                const has_FVM = mode === "vehicle2" || mode === "vehicle2a";

                if (mode === "vehicle4" || mode === "vehicle5" || mode === "vehicle6") {
                    h = height;
                }

                if (state === undefined) {
                    state = {};
                    state.t = 0;

                    if (has_FVM) {
                        state.solver = new FVMSolver(car_geometry, "car");
                        state.solver.update(10);
                        for (let i = 0; i < 10; i++)
                            state.solver.update(0.5);

                        let arrows = [];

                        const step = 2.5;

                        let cxcy = [0, 0];

                        for (let x = -50; x <= 50; x += step) {
                            for (let y = -3.8; y < 30; y += step) {

                                let arrow = {};
                                arrow.x = x;
                                arrow.y = y;

                                cxcy = car_geometry.uv_sample(x, y, 20, 20);

                                arrow.cxcy = cxcy;
                                arrows.push(arrow);
                            }
                        }

                        state.arrows = arrows;
                    }
                }

                if (mode === "vehicle6")
                    state.t += dt;
                else
                    state.t += dt * slider_args[0];

                if (has_FVM) {
                    for (let i = 0; i < 5; i++)
                        state.solver.update(0.3);
                }

                const stroke_size = 2 * width / 706;

                function draw_plane_background(offset, boxes = true) {

                    let grd = ctx.createLinearGradient(0, 0, 0, s * 4);
                    grd.addColorStop(0.0, "#D2EFFF");
                    grd.addColorStop(1.0, "#67B4DD");
                    ctx.fillStyle = grd;

                    ctx.fillRect(0, 0, w, h);

                    const air_space = 17;
                    let air_x = offset % air_space - 40 - air_space;

                    ctx.strokeStyle = "rgba(0,0,0,0.3)";

                    if (!boxes)
                        return;

                    for (let i = 0; i < 10; i++) {
                        ctx.setLineDash([ctx.lineWidth * 2, ctx.lineWidth * 2]);
                        ctx.strokeRect(air_x + i * air_space + ww * 0.5 - 0.5, 18, 4, 4);
                        ctx.setLineDash([]);
                    }

                }

                function draw_car_background(offset) {

                    let grd = ctx.createLinearGradient(0, 0, 0, s * 4);
                    grd.addColorStop(0.0, "#ECF8FF");
                    grd.addColorStop(1.0, "#AED5E9");
                    ctx.fillStyle = grd;

                    ctx.fillRect(0, 0, w, h);
                    ctx.translate(0, 4);

                    const air_space = 27;
                    let air_x = offset % air_space - 40 - air_space;

                    ctx.strokeStyle = "rgba(0,0,0,0.3)";

                    for (let i = 0; i < 10; i++) {
                        ctx.setLineDash([ctx.lineWidth * 2, ctx.lineWidth * 2]);
                        ctx.strokeRect(air_x + i * air_space + ww * 0.5 - 0.5, 18, 4, 4);
                        ctx.setLineDash([]);
                    }

                    const land_space = 91;
                    let land_x = offset % land_space - 10 - land_space;


                    ctx.fillStyle = "#81A346";
                    ctx.strokeStyle = "#5D782F";


                    ctx.beginPath();
                    ctx.moveTo(land_x, 0);
                    ctx.lineTo(land_x, 4);

                    for (let i = 0; i < 3; i++) {
                        ctx.bezierCurveTo(land_x + (i + 0.2) * land_space, 4,
                            land_x + (i + 0.4) * land_space, 3,
                            land_x + (i + 0.6) * land_space, 3);
                        ctx.bezierCurveTo(land_x + (i + 0.7) * land_space, 3,
                            land_x + (i + 0.8) * land_space, 4,
                            land_x + (i + 1) * land_space, 4);
                    }

                    ctx.lineTo(land_x + land_space * 3, 0);
                    ctx.fill();
                    ctx.stroke();


                    const power_space = 41;
                    let power_x = offset % power_space - power_space - 10;

                    ctx.fillStyle = "#885D45";
                    ctx.strokeStyle = "#462F22";

                    for (let i = 0; i < 5; i++) {
                        ctx.fillRect(power_x + i * power_space - 0.4, 0, 0.8, 17);
                        ctx.strokeRect(power_x + i * power_space - 0.4, 0, 0.8, 17);

                        ctx.fillEllipse(power_x + i * power_space, 15, 0.4);
                        ctx.strokeEllipse(power_x + i * power_space, 15, 0.4);;
                    }

                    ctx.fillStyle = "#ddd";
                    ctx.strokeStyle = "#444";

                    for (let i = 0; i < 5; i++) {
                        ctx.fillRect(power_x + i * power_space - 0.3, 15.5, 0.6, 1);
                        ctx.strokeRect(power_x + i * power_space - 0.3, 15.5, 0.6, 1);
                    }

                    ctx.strokeStyle = "#555";
                    ctx.beginPath();
                    ctx.moveTo(power_x, 16);


                    for (let i = 0; i < 5; i++) {
                        ctx.bezierCurveTo(power_x + (i + 0.3) * power_space, 11,
                            power_x + (i + 0.7) * power_space, 11,
                            power_x + (i + 1) * power_space, 16);
                    }
                    ctx.stroke();


                    let bird_i = floor(offset / power_space);
                    let bird_x = offset - bird_i * power_space - 10 - power_space;


                    for (let i = 0; i < 5; i++) {

                        let ii = bird_i - i;

                        let count = round(4 * hash(ii * 1712.12));

                        for (let k = 0; k < count; k++) {

                            let size = 1.0 + 0.08 * sin((ii + k) * 11)
                            let t = k * (0.05 + 0.01 * sin((ii + k) * 231)) + 0.4;
                            let nt = 1 - t;
                            let x = (3 * nt * nt * t * 0.3 + 3 * nt * t * t * 0.7 + t * t * t) * power_space;
                            let y = - 3 * nt * nt * t * 5 - 3 * nt * t * t * 5;

                            ctx.save();
                            ctx.translate(bird_x + i * power_space + x, 16 + y + 1);
                            draw_bird(ctx, size);
                            ctx.restore();
                        }

                    }


                    const post_space = 69;
                    let post_x = offset % post_space - 5;

                    ctx.fillStyle = "#ddd";
                    ctx.strokeStyle = "#444";

                    for (let i = 0; i < 3; i++) {
                        ctx.fillRect(post_x + i * post_space, 2, 0.4, 4);
                        ctx.strokeRect(post_x + i * post_space, 2, 0.4, 4);
                    }

                    ctx.fillStyle = "#444";
                    ctx.strokeStyle = "#222";

                    ctx.fillRect(0, -10, ww, 12);
                    ctx.strokeRect(0, -10, ww, 12);

                    ctx.strokeStyle = "#E8AF3D";
                    const line_space = 10;

                    ctx.setLineDash([0.4 * line_space, 0.6 * line_space]);

                    let line_x = offset % line_space - line_space - 10;

                    ctx.strokeLine(line_x, 0, ww, 0);
                    ctx.setLineDash([]);
                }

                function draw_cog(cog_r, p = [0, 0], color = "#000") {

                    ctx.lineWidth = cog_r / 4;

                    ctx.save();
                    ctx.translate(p[0], p[1]);


                    ctx.fillStyle = "#fff";
                    ctx.beginPath();

                    ctx.ellipse(0, 0, cog_r, cog_r, 0, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.clip();
                    ctx.fillStyle = color;
                    ctx.fillRect(0, -cog_r, cog_r, cog_r);
                    ctx.fillRect(-cog_r, 0, cog_r, cog_r);

                    ctx.restore();

                    ctx.strokeStyle = color;
                    ctx.strokeEllipse(p[0], p[1], cog_r);
                }


                let offset = state.t * 40 - ww / 2;
                let wheel_rot = -offset * 0.4;
                let prop_rot = offset * 4.0;


                ctx.lineWidth = stroke_size / s;

                ctx.save();
                ctx.beginPath();
                ctx.rect(0, 0, width, h);
                ctx.clip();
                ctx.translate(0, h);

                ctx.scale(s, -s);


                if (mode === "vehicle3") {
                    draw_plane_background(0);


                    ctx.translate(ww * 0.5 - offset, 0);

                    draw_plane(ctx, prop_rot, asymmetric_airfoil_geometry);

                } else if (mode === "vehicle4") {

                    ctx.translate(0, 1);
                    draw_car_background(offset);

                    ctx.globalCompositeOperation = "destination-out";
                    ctx.fillStyle = "rgba(0,0,0,0.5)";
                    ctx.fillRect(0, -h, ww, h * 2);
                    ctx.globalCompositeOperation = "source-over";
                    ctx.translate(ww * 0.5, 6.5);

                    draw_car(ctx, wheel_rot);

                } else if (mode === "vehicle5" || mode === "vehicle6") {


                    draw_plane_background(offset, mode !== "vehicle6");

                    ctx.globalCompositeOperation = "destination-out";
                    ctx.fillStyle = "rgba(0,0,0,0.5)";
                    ctx.fillRect(0, -h, ww, h * 2);
                    ctx.globalCompositeOperation = "source-over";

                    ctx.translate(ww * 0.5, 0);

                    if (mode === "vehicle6") {
                        ctx.translate(0, -24);
                        ctx.scale(3, 3);
                        ctx.lineWidth *= 1 / 3;
                    }
                    draw_plane(ctx, prop_rot, asymmetric_airfoil_geometry, mode === "vehicle6");


                } else {
                    draw_car_background(0);

                    if (mode === "vehicle2" || mode === "vehicle2a") {
                        ctx.globalCompositeOperation = "destination-out";
                        ctx.fillStyle = "rgba(0,0,0,0.5)";
                        ctx.fillRect(0, -h, ww, h * 2);
                        ctx.globalCompositeOperation = "source-over";
                    }

                    ctx.translate(ww * 0.5 - offset, 6.5);

                    if (has_FVM) {
                        ctx.strokeStyle = "#555";

                        for (let arrow of state.arrows) {

                            let cxcy = arrow.cxcy;

                            let v0 = state.solver.cell_velocity(cxcy[0] + cxcy[2], cxcy[1] + cxcy[3]);
                            let v1 = state.solver.cell_velocity(cxcy[0], cxcy[1] + cxcy[3]);
                            let v2 = state.solver.cell_velocity(cxcy[0] + cxcy[2], cxcy[1]);
                            let v3 = state.solver.cell_velocity(cxcy[0], cxcy[1]);

                            let v = vec_lerp(vec_lerp(v0, v1, cxcy[4]),
                                vec_lerp(v2, v3, cxcy[4]), cxcy[5]);

                            let arrow_scale = 1;

                            let x = arrow.x;
                            let y = arrow.y;

                            let vvx = (v[0] - 1) * arrow_scale;
                            let vvy = v[1] * arrow_scale;

                            let vvv = vvx * vvx + vvy * vvy;
                            if (vvv < 0.02)
                                continue;

                            ctx.globalAlpha = smooth_step(0.02, 0.15, vvv);

                            ctx.strokeLine(x, y,
                                (x + vvx),
                                (y + vvy));

                            ctx.strokeLine((x + vvx), (y + vvy),
                                (x + vvx * 0.8) - vvy * 0.2, (y + vvy * 0.8) + vvx * 0.2);

                            ctx.strokeLine((x + vvx), (y + vvy),
                                (x + vvx * 0.8) + vvy * 0.2, (y + vvy * 0.8) - vvx * 0.2);
                        }

                        ctx.globalAlpha = 1;
                    }

                    draw_car(ctx, wheel_rot);
                }


                ctx.feather(width * scale, h * scale,
                    canvas.width * 0.05, canvas.width * 0.05,
                    canvas.width * 0.05, canvas.width * 0.05);

                if (mode === "vehicle4" || mode === "vehicle5") {

                    if (mode === "vehicle4")
                        ctx.translate(0, -2);
                    else
                        ctx.translate(0, 14);

                    ctx.fillStyle = "#ff4400";
                    ctx.strokeStyle = "#772200";
                    ctx.arrow(0, 0, 6, 0, 1, 2.5, 3);
                    ctx.fill();
                    ctx.stroke();

                    ctx.fillStyle = "#FFD063";
                    ctx.strokeStyle = "#382E17";
                    ctx.arrow(0, 0, -6, 0, 1, 2.5, 3);
                    ctx.fill();
                    ctx.stroke();


                    ctx.fillStyle = "#85BB69";
                    ctx.strokeStyle = "#22311A";
                    ctx.arrow(0, 0, 0, 9, 1, 2.5, 3);
                    ctx.fill();
                    ctx.stroke();


                    ctx.fillStyle = "#73A8E6";
                    ctx.strokeStyle = "#26384D";
                    ctx.arrow(0, 0, 0, -9, 1, 2.5, 3);
                    ctx.fill();
                    ctx.stroke();


                    draw_cog(1);

                }

                ctx.restore();



                ctx.save();
                ctx.beginPath();
                ctx.rect(0, h, width, h * 2);
                ctx.clip();

                ctx.translate(0, 2 * h);

                ctx.scale(s, -s);


                if (mode === "vehicle3") {
                    draw_plane_background(offset);

                    ctx.translate(ww * 0.5, 0);
                    draw_plane(ctx, prop_rot, asymmetric_airfoil_geometry);

                } else {
                    draw_car_background(offset);

                    if (mode === "vehicle2" || mode === "vehicle2a") {
                        ctx.globalCompositeOperation = "destination-out";
                        ctx.fillStyle = "rgba(0,0,0,0.7)";
                        ctx.fillRect(0, -h, ww, h * 2);
                        ctx.globalCompositeOperation = "source-over";
                    }

                    ctx.translate(ww * 0.5, 6.5);


                    if (has_FVM) {
                        ctx.strokeStyle = "#555";

                        for (let arrow of state.arrows) {

                            ctx.fillEllipse(arrow.x, arrow.y, 0.1);

                            let cxcy = arrow.cxcy;

                            let v0 = state.solver.cell_velocity(cxcy[0] + cxcy[2], cxcy[1] + cxcy[3]);
                            let v1 = state.solver.cell_velocity(cxcy[0], cxcy[1] + cxcy[3]);
                            let v2 = state.solver.cell_velocity(cxcy[0] + cxcy[2], cxcy[1]);
                            let v3 = state.solver.cell_velocity(cxcy[0], cxcy[1]);

                            let v = vec_lerp(vec_lerp(v0, v1, cxcy[4]),
                                vec_lerp(v2, v3, cxcy[4]), cxcy[5]);

                            let arrow_scale = 1;

                            let x = arrow.x;
                            let y = arrow.y;

                            let vvx = v[0] * arrow_scale;
                            let vvy = v[1] * arrow_scale;

                            ctx.strokeLine(x, y,
                                (x + vvx),
                                (y + vvy));

                            ctx.strokeLine((x + vvx), (y + vvy),
                                (x + vvx * 0.8) - vvy * 0.2, (y + vvy * 0.8) + vvx * 0.2);

                            ctx.strokeLine((x + vvx), (y + vvy),
                                (x + vvx * 0.8) + vvy * 0.2, (y + vvy * 0.8) - vvx * 0.2);
                        }
                    }

                    draw_car(ctx, wheel_rot);

                }


                ctx.restore();


                ctx.feather(width * scale, h * scale,
                    canvas.width * 0.05, canvas.width * 0.05,
                    canvas.width * 0.05, canvas.width * 0.05, 0, h * scale);

                if (args.has_reset) {
                    ctx.resetTransform();
                    ctx.save();
                    ctx.shadowColor = "rgba(0,0,0,1.0)";
                    ctx.shadowBlur = canvas.width * 0.05 * 0.5;
                    ctx.shadowOffsetY = -60 * scale;
                    ctx.shadowOffsetX = 60 * scale;
                    ctx.globalCompositeOperation = "destination-out";


                    ctx.fillRect(-200, height * scale, 200, 200);
                    ctx.restore();
                }

            } else if (mode.startsWith("particles")) {

                /* size == 44.44nm */

                let N = particles_count;
                const size = 1;
                const R = 0.003375;

                const bin_size = 0.064;
                const inv_bin_size = 1 / bin_size;
                const bin_n = (ceil((2 * size + 2 * R) * inv_bin_size));
                const bin_n2 = (bin_n * bin_n);
                const bin_n3 = (bin_n * bin_n * bin_n);
                const bin_capacity = 64;
                const N_collisions = ceil(particles_count / 2);


                const v0 = 1.0;

                const glow_rate = 5.0;

                dt *= slider_args[0] * slider_args[0] * 2;

                let base_vx = 0;
                let show_velocity = true;
                let solid_box_size = 0.0;
                let first_run = false;
                let show_velocity_label = false;
                let show_count_label = false;
                let has_surface = false;
                let count_wall_collisions = false;

                let average_boxes = [];

                let average_box_styles = ["#E72016", "#E72016"];

                let color0 = rgba255_color(70, 70, 70, 0.4);
                let color1 = rgba255_color(241, 32, 22, 0.9);

                let average_velocity_color = rgba_hex_color(0x555555);

                if (mode === "particles1") {
                    show_velocity = false;

                } else if (mode === "particles2") {
                    color0 = rgba255_color(70, 70, 70, 0.03);
                } else if (mode === "particles3") {
                    let box_size = lerp(0.2, 0.9, slider_args[1]);

                    average_boxes = [
                        [0, 0, 0, box_size, box_size, box_size]
                    ];
                    show_count_label = true;
                    color0 = rgba255_color(70, 70, 70, 0.03);
                    color1 = rgba255_color(241, 32, 22, 0.3);
                } else if (mode === "particles4") {
                    base_vx = slider_args[1] * 0.1 * v0;
                    show_velocity_label = true;
                    color0 = rgba255_color(70, 70, 70, 0.05);
                } else if (mode === "particles5") {
                    let box_size = lerp(0.2, 0.9, slider_args[1]);
                    average_boxes = [
                        [0, 0, 0, box_size, box_size, box_size]
                    ];
                    base_vx = slider_args[2] * 0.1 * v0;

                    color0 = rgba255_color(70, 70, 70, 0.03);
                    color1 = rgba255_color(255, 0, 0, 0.2);

                    show_velocity_label = true;
                } else if (mode === "particles8") {
                    show_velocity = false;
                    solid_box_size = 0.4;
                } else if (mode === "particles9") {
                    show_velocity = false;
                    count_wall_collisions = true;

                    solid_box_size = 0.4;

                    N = ceil(particles_count * lerp(0.2, 1.0, slider_args[1]));
                } else if (mode === "particles10") {
                    show_velocity = false;
                    count_wall_collisions = true;

                    solid_box_size = 0.4;
                } else if (mode === "particles11") {
                    color0 = rgba255_color(70, 70, 70, 0.2);
                    show_velocity = false;
                    let box_size = lerp(0.1, 0.9, slider_args[1]);
                    average_boxes = [
                        [0, 0, 0, box_size, box_size, box_size]
                    ];
                } else if (mode === "particles12") {
                    base_vx = 0.1 * v0;
                    N = floor(0.75 * particles_count);

                    color0 = rgba255_color(70, 70, 70, 0.03);
                    show_velocity = true;
                    has_surface = true;


                } else if (mode === "particles14") {
                    color0 = rgba255_color(18, 148, 209, 0.7);
                    color1 = rgba255_color(241, 32, 22, 0.7);

                    average_box_styles = ["#1294D1", "#E72016"];

                    base_vx = 0.1 * v0;

                    show_velocity = false;
                    let box_h = 0.9;

                    average_boxes = [
                        [0, 0.45, 0, box_h, 0.45, 0.9],
                        [0, -0.45, 0, box_h, 0.45, 0.9]
                    ];
                }

                if (state === undefined) {
                    first_run = true;

                    state = {};

                    state.base_vx = base_vx;

                    state.pos = new Float64Array(particles_count * 3);
                    state.vel = new Float64Array(particles_count * 3);
                    state.col = new Float64Array(particles_count);

                    state.gfx_pos = new Float32Array(particles_count * 3);
                    state.gfx_vel = new Float32Array(particles_count * 3);
                    state.gfx_col = new Float32Array(particles_count);

                    state.sort_buckets = new Array(256);
                    state.sort_buckets2 = new Array(256);
                    state.sort_key = new Uint16Array(particles_count);
                    state.sort_array = new Uint16Array(particles_count);


                    state.bins_counts = new Uint8Array(bin_n3);
                    state.bins = new Uint32Array(bin_n3 * bin_capacity);

                    state.box_x = 0;
                    state.box_delta = 0;


                    if (solid_box_size) {
                        state.collisions = new Float64Array(N_collisions * 4);
                        state.collisions_count = 0;
                    }

                    let pos = state.pos;
                    let vel = state.vel;
                    let col = state.col;

                    if (solid_box_size) {
                        for (let i = 0; i < particles_count; i++) {
                            while (true) {
                                pos[3 * i + 0] = (random() - 0.5) * 2 * size;
                                pos[3 * i + 1] = (random() - 0.5) * 2 * size;
                                pos[3 * i + 2] = (random() - 0.5) * 2 * size;

                                if (max(abs(pos[3 * i + 0] - state.box_x), max(abs(pos[3 * i + 1]), abs(pos[3 * i + 2]))) >= solid_box_size)
                                    break;
                            }
                        }
                    } else if (has_surface) {
                        for (let i = 0; i < particles_count; i++) {
                            while (true) {
                                pos[3 * i + 0] = (random() - 0.5) * 2 * size;
                                pos[3 * i + 1] = (random() - 0.5) * 2 * size;
                                pos[3 * i + 2] = (random() - 0.5) * 2 * size;

                                if (pos[3 * i + 2] > surface_max || pos[3 * i + 2] > surface_z(pos[3 * i + 0], pos[3 * i + 1]))
                                    break;
                            }
                        }
                    } else {

                        for (let i = 0; i < particles_count; i++) {
                            pos[3 * i + 0] = (random() - 0.5) * 2 * size;
                            pos[3 * i + 1] = (random() - 0.5) * 2 * size;
                            pos[3 * i + 2] = (random() - 0.5) * 2 * size;
                        }
                    }



                    if (mode === "particles10" || mode === "particles11") {
                        for (let i = 0; i < particles_count; i++) {
                            if (pos[3 * i + 0] > 0 && random() > 1 / 2)
                                pos[3 * i + 0] *= -1;
                        }
                    }

                    if (mode === "particles11") {
                        for (let i = 0; i < particles_count; i++) {
                            if (abs(pos[3 * i + 0]) < 0.2)
                                col[i] = 1;
                        }
                    }


                    let avx = 0;
                    let avy = 0;
                    let avz = 0;

                    for (let i = 0; i < particles_count; i++) {
                        let vx = (random() - 0.5) * 2;
                        let vy = (random() - 0.5) * 2;
                        let vz = (random() - 0.5) * 2;

                        let vv = v0 / (1e-5 + sqrt(vx * vx + vy * vy + vz * vz));

                        vel[3 * i + 0] = vx * vv;
                        vel[3 * i + 1] = vy * vv;
                        vel[3 * i + 2] = vz * vv;

                        avx += vel[3 * i + 0];
                        avy += vel[3 * i + 1];
                        avz += vel[3 * i + 2];
                    }

                    avx /= particles_count;
                    avy /= particles_count;
                    avz /= particles_count;

                    avx -= base_vx;

                    for (let i = 0; i < particles_count; i++) {
                        vel[3 * i + 0] -= avx;
                        vel[3 * i + 1] -= avy;
                        vel[3 * i + 2] -= avz;
                    }

                    if (mode === "particles2" || mode === "particles4") {
                        for (let i = 0; i < 20; i++) {
                            state.col[i] = 1;
                        }

                    }
                    if (mode === "particles14") {
                        for (let i = 0; i < particles_count; i++) {

                            if (pos[3 * i + 1] < 0)
                                vel[3 * i + 0] -= base_vx * 0.7;
                        }

                    }

                }

                let pos = state.pos;
                let vel = state.vel;
                let col = state.col;

                let collisions = state.collisions;
                let collisions_count = state.collisions_count;

                let vel_delta = base_vx - state.base_vx;

                if (vel_delta != 0) {
                    state.base_vx = base_vx;

                    for (let i = 0; i < particles_count; i++) {
                        vel[3 * i + 0] += vel_delta;
                    }
                }

                function simulate_particles(dt) {

                    let bins_counts = state.bins_counts;
                    let bins = state.bins;


                    function advance_repeat(dt) {
                        const size2 = 2 * size;

                        for (let i = 0; i < N; i++) {
                            pos[3 * i + 0] += dt * vel[3 * i + 0];
                            pos[3 * i + 1] += dt * vel[3 * i + 1];
                            pos[3 * i + 2] += dt * vel[3 * i + 2];

                            if (abs(pos[3 * i + 0]) > size) {
                                pos[3 * i + 0] -= (pos[3 * i + 0] > 0) ? size2 : -size2;
                            }
                            if (abs(pos[3 * i + 1]) > size) {
                                pos[3 * i + 1] -= (pos[3 * i + 1] > 0) ? size2 : -size2;
                            }
                            if (abs(pos[3 * i + 2]) > size) {
                                pos[3 * i + 2] -= (pos[3 * i + 2] > 0) ? size2 : -size2;
                            }
                        }
                    }

                    function advance_surface(dt) {
                        const size2 = 2 * size;

                        for (let i = 0; i < N; i++) {

                            pos[3 * i + 0] += dt * vel[3 * i + 0];
                            pos[3 * i + 1] += dt * vel[3 * i + 1];
                            pos[3 * i + 2] += dt * vel[3 * i + 2];

                            if (abs(pos[3 * i + 0]) > size) {

                                pos[3 * i + 0] -= (pos[3 * i + 0] > 0) ? size2 : -size2;


                                let vx = (random() - 0.5) * 2;
                                let vy = (random() - 0.5) * 2;
                                let vz = (random() - 0.5) * 2;

                                let vv = v0 / (1e-5 + sqrt(vx * vx + vy * vy + vz * vz));

                                vel[3 * i + 0] = vx * vv + base_vx;
                                vel[3 * i + 1] = vy * vv;
                                vel[3 * i + 2] = vz * vv;


                            }
                            if (abs(pos[3 * i + 1]) > size) {
                                pos[3 * i + 1] -= (pos[3 * i + 1] > 0) ? size2 : -size2;
                            }

                            if (pos[3 * i + 2] > size) {
                                vel[3 * i + 2] *= -1;
                                pos[3 * i + 2] = size2 - pos[3 * i + 2];
                            } else if (pos[3 * i + 2] < surface_max) {

                                let zf = surface_z(pos[3 * i + 0], pos[3 * i + 1]);

                                if (pos[3 * i + 2] > zf)
                                    continue;

                                let n = surface_n(pos[3 * i + 0], pos[3 * i + 1]);

                                let dot = n[0] * vel[3 * i + 0] +
                                    n[1] * vel[3 * i + 1] +
                                    n[2] * vel[3 * i + 2];

                                dot *= 2;

                                vel[3 * i + 0] -= dot * n[0];
                                vel[3 * i + 1] -= dot * n[1];
                                vel[3 * i + 2] -= dot * n[2];

                                pos[3 * i + 2] = zf;
                            }
                        }



                    }


                    function advance_reflect(dt) {
                        const size2 = 2 * size;

                        for (let i = 0; i < N; i++) {
                            pos[3 * i + 0] += dt * vel[3 * i + 0];
                            pos[3 * i + 1] += dt * vel[3 * i + 1];
                            pos[3 * i + 2] += dt * vel[3 * i + 2];

                            if (abs(pos[3 * i + 0]) > size) {

                                pos[3 * i + 0] = random() > 0.5 ? -size : size;
                                vel[3 * i + 0] *= -1;
                            }
                            if (abs(pos[3 * i + 1]) > size) {
                                pos[3 * i + 1] -= (pos[3 * i + 1] > 0) ? size2 : -size2;
                            }
                            if (abs(pos[3 * i + 2]) > size) {
                                pos[3 * i + 2] -= (pos[3 * i + 2] > 0) ? size2 : -size2;
                            }
                        }
                    }




                    function solid_box_collide(dt) {

                        state.box_x += state.box_delta * 0.0004;

                        let box_x = state.box_x;

                        for (let i = 0; i < collisions_count; i++) {
                            collisions[4 * i + 3] -= glow_rate * dt;

                            if (collisions[4 * i + 3] < 0) {

                                collisions_count--;

                                if (i < collisions_count) {
                                    collisions[4 * i + 0] = collisions[4 * collisions_count + 0];
                                    collisions[4 * i + 1] = collisions[4 * collisions_count + 1];
                                    collisions[4 * i + 2] = collisions[4 * collisions_count + 2];
                                    collisions[4 * i + 3] = collisions[4 * collisions_count + 3];
                                    i--;
                                }
                            }
                        }


                        const limit = solid_box_size + R;
                        const move_box = mode === "particles10";

                        let box_delta = 0;

                        for (let i = 0; i < N; i++) {

                            col[i] = max(0, col[i] - dt * 5);

                            if (abs(pos[3 * i + 0] - box_x) > limit)
                                continue;
                            if (abs(pos[3 * i + 1]) > limit)
                                continue;
                            if (abs(pos[3 * i + 2]) > limit)
                                continue;

                            let k = 2;

                            if (abs(pos[3 * i + 1]) > abs(pos[3 * i + k]))
                                k = 1;
                            if (abs(pos[3 * i + 0] - box_x) > abs(pos[3 * i + k]))
                                k = 0;

                            let dx = k == 0 ? box_x : 0

                            pos[3 * i + k] += (abs(pos[3 * i + k] - dx) - limit) * (pos[3 * i + k] > 0 ? -1 : 1);
                            vel[3 * i + k] *= -1;

                            if (move_box && k == 0) {
                                box_delta += (pos[3 * i + 0] > box_x) ? -1 : 1;

                            }

                            if (collisions_count >= N_collisions)
                                continue;

                            collisions[collisions_count * 4 + 0] = pos[3 * i + 0] - box_x;
                            collisions[collisions_count * 4 + 1] = pos[3 * i + 1];
                            collisions[collisions_count * 4 + 2] = pos[3 * i + 2];
                            collisions[collisions_count * 4 + 3] = 1.0;

                            collisions_count++;
                        }

                        state.box_delta = box_delta;
                        state.collisions_count = collisions_count;

                    }


                    function clear_bins() {
                        for (let i = 0; i < bin_n3; i++) {
                            bins_counts[i] = 0;
                        }
                    }

                    function bin() {
                        const bins_counts = state.bins_counts;
                        const bins = state.bins;
                        const pos = state.pos;

                        const n = N;

                        const bn = bin_n >>> 0;
                        const bn2 = bin_n2 >>> 0;

                        const capacity = bin_capacity >>> 0;

                        const bin_scale = inv_bin_size;
                        const shift = size * inv_bin_size;

                        const next_bin_shift = R * inv_bin_size;


                        /* fx0 = (pos[i * 3 + 0] + size)/bin_size */
                        /* fx1 = (pos[i * 3 + 0] + R + size)/bin_size */

                        for (let i = 0; i < n; i++) {


                            let fx0 = pos[i * 3 + 0] * bin_scale + shift;
                            let fy0 = pos[i * 3 + 1] * bin_scale + shift;
                            let fz0 = pos[i * 3 + 2] * bin_scale + shift;

                            let fx1 = fx0 + next_bin_shift;
                            let fy1 = fy0 + next_bin_shift;
                            let fz1 = fz0 + next_bin_shift;

                            const ix0 = fx0 >>> 0;
                            const iy0 = fy0 >>> 0;
                            const iz0 = fz0 >>> 0;

                            const ix1 = fx1 >>> 0;
                            const iy1 = fy1 >>> 0;
                            const iz1 = fz1 >>> 0;

                            for (let ix = ix0; ix <= ix1; ix++) {
                                for (let iy = iy0; iy <= iy1; iy++) {
                                    for (let iz = iz0; iz <= iz1; iz++) {

                                        // let bin_i = ((ix << 0) + (iy << 5)  + (iz << 10)) >>> 0;
                                        let bin_i = (ix + iy * bn + iz * bn2) >>> 0;
                                        let count = bins_counts[bin_i] >>> 0;

                                        if (count == capacity)
                                            continue;

                                        bins[bin_i * capacity + count] = i;
                                        bins_counts[bin_i] = count + 1;
                                    }
                                }
                            }
                        }
                    }





                    function collide() {
                        const bn3 = bin_n3;
                        const capacity = bin_capacity;
                        const pos = state.pos;
                        const vel = state.vel;
                        const bins_counts = state.bins_counts;

                        const collision_limit = R * R * 4;


                        for (let i = 0; i < bn3; i++) {
                            let c = bins_counts[i];

                            if (c <= 1)
                                continue;

                            for (let j = 0; j < c; j++) {
                                let i0 = bins[i * capacity + j];

                                for (let k = j + 1; k < c; k++) {
                                    let i1 = bins[i * capacity + k];


                                    let x0 = pos[3 * i0 + 0];
                                    let y0 = pos[3 * i0 + 1];
                                    let z0 = pos[3 * i0 + 2];

                                    let x1 = pos[3 * i1 + 0];
                                    let y1 = pos[3 * i1 + 1];
                                    let z1 = pos[3 * i1 + 2];

                                    let dx = x1 - x0;
                                    let dy = y1 - y0;
                                    let dz = z1 - z0;

                                    let d_sq = dx * dx + dy * dy + dz * dz;

                                    if (d_sq > collision_limit)
                                        continue;

                                    let vx0 = vel[i0 * 3 + 0];
                                    let vy0 = vel[i0 * 3 + 1];
                                    let vz0 = vel[i0 * 3 + 2];

                                    let vx1 = vel[i1 * 3 + 0];
                                    let vy1 = vel[i1 * 3 + 1];
                                    let vz1 = vel[i1 * 3 + 2];

                                    let v_factor = (vx0 - vx1) * (x0 - x1) + (vy0 - vy1) * (y0 - y1) + (vz0 - vz1) * (z0 - z1);
                                    v_factor /= d_sq;

                                    vel[i0 * 3 + 0] += v_factor * dx;
                                    vel[i0 * 3 + 1] += v_factor * dy;
                                    vel[i0 * 3 + 2] += v_factor * dz;

                                    vel[i1 * 3 + 0] -= v_factor * dx;
                                    vel[i1 * 3 + 1] -= v_factor * dy;
                                    vel[i1 * 3 + 2] -= v_factor * dz;

                                    let d = sqrt(d_sq);
                                    let p_factor = (d - R * 2.0) * 0.5 / d;

                                    pos[i0 * 3 + 0] += p_factor * dx;
                                    pos[i0 * 3 + 1] += p_factor * dy;
                                    pos[i0 * 3 + 2] += p_factor * dz;

                                    pos[i1 * 3 + 0] -= p_factor * dx;
                                    pos[i1 * 3 + 1] -= p_factor * dy;
                                    pos[i1 * 3 + 2] -= p_factor * dz;
                                }
                            }
                        }
                    }


                    if (mode === "particles10" || mode === "particles11")
                        advance_reflect(dt);
                    else if (has_surface)
                        advance_surface(dt);
                    else
                        advance_repeat(dt);

                    if (solid_box_size > 0)
                        solid_box_collide(dt);

                    clear_bins();
                    bin();
                    collide();
                }


                if (dt > 0 || first_run)
                    simulate_particles(dt);

                let average_velocities = []
                let average_boxes_counts = [];

                if (average_boxes.length > 0) {

                    for (let box of average_boxes) {
                        let vx = 0;
                        let vy = 0;
                        let vz = 0;
                        let count = 0;


                        for (let i = 0; i < N; i++) {

                            let inside = abs(pos[3 * i + 0] - box[0]) < box[3] &&
                                abs(pos[3 * i + 1] - box[1]) < box[4] &&
                                abs(pos[3 * i + 2] - box[2]) < box[5];

                            col[i] = inside ? 1 : 0;
                            if (inside) {
                                vx += vel[3 * i + 0];
                                vy += vel[3 * i + 1];
                                vz += vel[3 * i + 2];
                                count++;
                            }
                        }

                        average_boxes_counts.push(count);

                        if (count == 0)
                            count = 1;

                        average_velocities.push([vx / count, vy / count, vz / count]);
                    }
                } else if (mode === "particles11") {
                    let vx = 0;
                    let vy = 0;
                    let vz = 0;
                    let count = 0;

                    for (let i = 0; i < N; i++) {
                        if (col[i] > 0) {
                            vx += vel[3 * i + 0];
                            vy += vel[3 * i + 1];
                            vz += vel[3 * i + 2];
                            count++;
                        }
                    }

                    average_velocities.push([vx / count, vy / count, vz / count]);
                } else if (mode === "particles12") {


                    for (let i = 0; i < N; i += 40) {
                        col[i] = smooth_step(-0.0, -0.25, pos[3 * i + 2]);
                    }
                }

                let total_vel = 0;
                let total_vel_sq = 0;

                for (let i = 0; i < N; i++) {
                    let vx = vel[3 * i + 0];
                    let vy = vel[3 * i + 1];
                    let vz = vel[3 * i + 2];

                    let vvv = vx * vx + vy * vy + vz * vz;
                    let vv = sqrt(vvv);

                    total_vel += vv;
                    total_vel_sq += vvv;
                }

                total_vel /= N;
                total_vel_sq /= N;


                let mvp = vp;
                let point_size = R * 2 * width * proj[0] * scale;



                function sort_and_upload() {
                    let rx = rot[6];
                    let ry = rot[7];
                    let rz = rot[8];

                    let sort_buckets = state.sort_buckets;
                    let sort_buckets2 = state.sort_buckets2;
                    let sort_key = state.sort_key;
                    let sort_array = state.sort_array;

                    let pos = state.pos;
                    let col = state.col;



                    /* Remap projected z-position to uint16 range then radix sort. */
                    /* ((x + sqrt(3)) / (2 * sqrt(3))) * 0xffff; */

                    const shift = 0xffff / 2.0;
                    const scale = 0xffff / (2.0 * sqrt(3.0));

                    for (let i = 0; i < N; i++) {
                        let z = rx * pos[3 * i + 0] + ry * pos[3 * i + 1] + rz * pos[3 * i + 2];
                        sort_key[i] = z * scale + shift;
                    }


                    for (let i = 0; i < 256; i++) {
                        sort_buckets[i] = [];
                        sort_buckets2[i] = [];
                    }

                    // radix step 1

                    for (let i = 0; i < N; i++) {
                        sort_buckets[sort_key[i] & 0xff].push(i);
                    }

                    // radix step 2

                    for (let bucket of sort_buckets) {
                        for (let index of bucket) {
                            sort_buckets2[(sort_key[index] >> 8) & 0xff].push(index);
                        }
                    }


                    let gfx_pos = state.gfx_pos;
                    let gfx_col = state.gfx_col;


                    let k = 0;
                    for (let bucket of sort_buckets2) {
                        for (let index of bucket) {
                            gfx_pos[3 * k + 0] = pos[3 * index + 0];
                            gfx_pos[3 * k + 1] = pos[3 * index + 1];
                            gfx_pos[3 * k + 2] = pos[3 * index + 2];
                            gfx_col[k] = col[index];
                            k++;
                        }
                    }

                    gl.update_point_pos_buffer(gfx_pos);
                    gl.update_point_col_buffer(gfx_col);

                    if (show_velocity) {
                        let vel = state.vel;

                        let gfx_vel = state.gfx_vel;
                        k = 0;
                        for (let bucket of sort_buckets2) {
                            for (let index of bucket) {
                                gfx_vel[3 * k + 0] = vel[3 * index + 0];
                                gfx_vel[3 * k + 1] = vel[3 * index + 1];
                                gfx_vel[3 * k + 2] = vel[3 * index + 2];
                                k++;
                            }
                        }

                        gl.update_point_vel_buffer(gfx_vel);
                    }
                }

                gl.begin(height, height);

                {
                    sort_and_upload();
                }


                if (has_surface) {
                    gl.draw_surface(mvp, rot);
                }

                if (solid_box_size) {
                    let box_mat = scale_mat4(solid_box_size);
                    box_mat = mat4_mul(translation_mat4([state.box_x, 0, 0]), box_mat);
                    box_mat = mat4_mul(mvp, box_mat);
                    gl.draw_box(box_mat, rot, {
                        color: rgba_hex_color(0xF0C529)
                    });
                }

                if (count_wall_collisions) {

                    let counts = [0, 0, 0, 0, 0, 0];
                    let pos = [[1, 0, 0], [-1, 0, 0],
                    [0, 1, 0], [0, -1, 0],
                    [0, 0, 1], [0, 0, -1]];

                    for (let i = 0; i < collisions_count; i++) {

                        if (collisions[4 * i + 3] < 0)
                            continue;

                        let d = 2;

                        if (abs(collisions[4 * i + 1]) > abs(collisions[4 * i + d]))
                            d = 1;
                        if (abs(collisions[4 * i + 0]) > abs(collisions[4 * i + d]))
                            d = 0;

                        counts[d * 2 + (collisions[4 * i + d] > 0 ? 0 : 1)]++;
                    }

                    for (let i = 0; i < 6; i++) {

                        if (counts[i] == 0)
                            continue;

                        let ll = counts[i] * 0.15;

                        let s = ll > 1 ? 1 : ll;

                        let r = arrow_rot_to_dir(vec_neg(pos[i]));


                        let mat = translation_mat4([0, 0, -ll - 5]);
                        mat = mat4_mul(scale_mat4(0.03 * s), mat);
                        mat = mat4_mul(mat3_to_mat4(r), mat);
                        mat = mat4_mul(translation_mat4(vec_add([state.box_x, 0, 0], vec_scale(pos[i], solid_box_size))), mat);
                        mat = mat4_mul(mvp, mat);

                        r = mat3_mul(rot, r);
                        gl.draw_arrow(mat, r, { color: [0.2, 0.2, 0.2, 1.0], length: ll });

                    }
                }

                for (let i = 0; i < average_boxes.length; i++) {

                    let box = average_boxes[i];
                    let average_velocity = average_velocities[i];
                    let ll = vec_len(average_velocity);

                    let r = arrow_rot_to_dir(vec_norm(average_velocity))

                    if (ll == 0)
                        continue;

                    ll *= 250;

                    let s = ll > 1 ? 1 : ll;

                    let mat = scale_mat4(0.02 * s);
                    mat = mat4_mul(mat3_to_mat4(r), mat);
                    mat = mat4_mul(translation_mat4(box), mat);
                    mat = mat4_mul(mvp, mat);

                    r = mat3_mul(rot, r);
                    gl.draw_arrow(mat, r, { color: average_velocity_color, length: ll });

                }


                if (collisions_count > 0) {
                    let quads = new Float32Array(collisions_count * 4 * 6);
                    let quad_count = 0;

                    const quad_size = 0.015;
                    const wall_pos = solid_box_size + 0.0001;

                    for (let i = 0; i < collisions_count; i++) {

                        let d = 2;

                        if (abs(collisions[4 * i + 1]) > abs(collisions[4 * i + d]))
                            d = 1;
                        if (abs(collisions[4 * i + 0]) > abs(collisions[4 * i + d]))
                            d = 0;

                        for (let k = 0; k < 4; k++) {


                            let x, y, z;
                            if (d == 0) {
                                x = collisions[4 * i + 0] > 0 ? wall_pos : -wall_pos;
                                y = collisions[4 * i + 1] + (k & 1 ? -quad_size : quad_size);
                                z = collisions[4 * i + 2] + (k & 2 ? -quad_size : quad_size);
                            }
                            else if (d == 1) {
                                y = collisions[4 * i + 1] > 0 ? wall_pos : -wall_pos;
                                x = collisions[4 * i + 0] + (k & 1 ? -quad_size : quad_size);
                                z = collisions[4 * i + 2] + (k & 2 ? -quad_size : quad_size);
                            } else if (d == 2) {
                                z = collisions[4 * i + 2] > 0 ? wall_pos : -wall_pos;
                                y = collisions[4 * i + 1] + (k & 1 ? -quad_size : quad_size);
                                x = collisions[4 * i + 0] + (k & 2 ? -quad_size : quad_size);
                            }

                            quads[quad_count * 24 + k * 6 + 0] = x + state.box_x;
                            quads[quad_count * 24 + k * 6 + 1] = y;
                            quads[quad_count * 24 + k * 6 + 2] = z;
                            quads[quad_count * 24 + k * 6 + 3] = k & 1 ? -1 : 1;
                            quads[quad_count * 24 + k * 6 + 4] = k & 2 ? -1 : 1;
                            quads[quad_count * 24 + k * 6 + 5] = collisions[4 * i + 3];
                        }

                        quad_count++;
                    }

                    gl.update_quad_buffer(quads);
                    gl.draw_quads(mvp, collisions_count, { type: "glow", pos_size: [state.box_x, wall_pos + 0.0001] });
                }

                gl.draw_points(mvp, N, 0, { point_size: point_size, color0: color0, color1: color1 });

                if (show_velocity) {
                    gl.draw_point_arrows(mvp, N, 0, { color0: vec_scale(color0, 0.8), color1: vec_scale(color1, 0.8) });
                }

                ctx.drawImage(gl.finish(), 0, 0, height, height);




                ctx.translate(round(width * 0.5), round(height * 0.5));

                if (average_velocities.length > 0) {


                    ctx.lineCap = "butt"

                    for (let i = 0; i < average_boxes.length; i++) {

                        let box = average_boxes[i];
                        ctx.strokeStyle = average_box_styles[i];

                        let points = [];
                        for (let i = 0; i < 8; i++) {
                            let x = (((i & 1) * 2.0) - 1) * box[3] + box[0];
                            let y = (((i & 2) * 1.0) - 1) * box[4] + box[1];
                            let z = (((i & 4) * 0.5) - 1) * box[5] + box[2];
                            points.push(project(mat4_mul_vec3(mvp, [x, y, z])));
                        }

                        cube_pairs.forEach((pair, i) => {

                            let len = vec_len(vec_sub(points[pair[0]].slice(0, 2),
                                points[pair[1]].slice(0, 2)));

                            let dash = 0.03 * len / 2;
                            ctx.setLineDash([dash, dash * 1.5]);
                            ctx.lineDashOffset = 0.02 * len;
                            ctx.beginPath();
                            ctx.lineTo(points[pair[0]][0], points[pair[0]][1]);
                            ctx.lineTo(points[pair[1]][0], points[pair[1]][1]);
                            ctx.stroke();
                        });
                    }

                }

                ctx.strokeStyle = "rgba(0,0,0,0.15)";

                let points = [];
                for (let i = 0; i < 8; i++) {
                    let x = (((i & 1) * 2.0) - 1) * size * 0.9;
                    let y = (((i & 2) * 1.0) - 1) * size * 0.9;
                    let z = (((i & 4) * 0.5) - 1) * size * 0.9;
                    points.push(project(mat4_mul_vec3(mvp, [x, y, z])));
                }

                ctx.lineCap = "butt";

                cube_pairs.forEach((pair, i) => {

                    let len = vec_len(vec_sub(points[pair[0]].slice(0, 2),
                        points[pair[1]].slice(0, 2)));

                    let dash = 0.0142 * len;
                    ctx.setLineDash([dash, dash * 1.5]);
                    ctx.lineDashOffset = 0.02 * len;
                    ctx.beginPath();
                    ctx.lineTo(points[pair[0]][0], points[pair[0]][1]);
                    ctx.lineTo(points[pair[1]][0], points[pair[1]][1]);
                    ctx.stroke();
                });

                ctx.translate(0, round(height * 0.5) - 0.7 * font_size);

                if (show_velocity_label) {
                    ctx.fillStyle = "#5475a3";

                    let wind_speed = base_vx * 500 * 3.6
                    ctx.fillText(metric ? round(wind_speed) + " km/h" : round(wind_speed * 0.621371) + " mph", 0, 0);
                } else if (show_count_label) {
                    ctx.fillText(`${average_boxes_counts[0]} particle${average_boxes_counts[0] == 1 ? "" : "s"}`, 0, 0);
                }

            }
            else if (mode.startsWith("balls")) {

                if (state === undefined) {
                    state = {};
                    state.particles = [];
                    state.left_t = -dt * 0.5;
                    state.right_t = -dt * 0.5 - 0.25;

                    state.box_p = 0;
                    state.box_v = 0;
                }

                let left_interval = 1;
                let right_interval = 1;

                let left_v0 = 6;
                let right_v0 = 6;


                if (mode === "balls1") {
                    left_interval = right_interval = 1 / lerp(0.5, 3.0, slider_args[0]);
                }
                else if (mode === "balls2") {
                    let r = lerp(0.9, 0.1, slider_args[0]);
                    left_interval = r * 2;
                    right_interval = (1 - r) * 2;
                }
                else if (mode === "balls3") {
                    if (slider_args[0] > 0.5)
                        left_v0 += (slider_args[0] - 0.5) * 14
                    else if (slider_args[0] < 0.5)
                        right_v0 -= (slider_args[0] - 0.5) * 14
                }


                const fade_rate = 2;

                const box_size = 1;
                const particle_r = 0.1;

                const box_m = 1;
                const ball_m = 0.05;

                state.left_t += dt;
                state.right_t += dt;

                if (state.left_t > left_interval) {
                    state.particles.push({ p: -4, v: left_v0, l: 1, y: (random() - 0.5) * 0.8 + 0.1, a0: random() * 2 * pi, a1: random() * 2 * pi });
                    state.left_t %= left_interval;
                }

                if (state.right_t > right_interval) {
                    state.particles.push({ p: 4, v: -right_v0, l: 1, y: (random() - 0.5) * 0.8 + 0.1, a0: random() * 2 * pi, a1: random() * 2 * pi });
                    state.right_t %= right_interval;
                }

                state.box_v *= 0.5;
                state.box_p += state.box_v * dt;

                for (let i = 0; i < state.particles.length; i++) {
                    let particle = state.particles[i];

                    particle.p += particle.v * dt;
                    if (particle.l < 1)
                        particle.l -= fade_rate * dt;

                    const limit = box_size * 0.5 + particle_r;
                    if (abs(particle.p - state.box_p) < limit) {
                        let v = particle.v;
                        particle.v = (ball_m - box_m) / (ball_m + box_m) * v +
                            (box_m + box_m) / (ball_m + box_m) * state.box_v;
                        state.box_v = (ball_m + ball_m) / (ball_m + box_m) * v +
                            (box_m - ball_m) / (ball_m + box_m) * state.box_v;
                        particle.p += (abs(particle.p - state.box_p) - limit) * (particle.p > state.box_p ? -1 : 1);

                        particle.l = 1 - 1e-5;
                    }

                    if (abs(particle.p) > 7) {
                        if (i < state.particles.length - 1) {
                            state.particles[i] = state.particles.pop()
                            i--;
                        }
                    }
                }

                gl.begin(width, height);

                let mvp = mat4_mul(scale_mat4([1, 1, 0.1]), vp);


                let quads = new Float32Array(state.particles.length * 4 * 6);
                let quad_count = 0;

                for (let particle of state.particles) {

                    let ball_mat = scale_mat4(0.1);

                    let ball_tx = [particle.p, 0, particle.y];

                    let ball_rot = mat3_mul(rot_x_mat3(particle.a0), rot_z_mat3(particle.a1));

                    ball_mat = mat4_mul(mat3_to_mat4(ball_rot), ball_mat);
                    ball_mat = mat4_mul(translation_mat4(ball_tx), ball_mat);
                    ball_mat = mat4_mul(mvp, ball_mat);

                    let dist = abs(particle.p - state.box_p) - 0.5;

                    let ball_dim = (particle.p > state.box_p ? -1 : 1) * (1 / (5 * (dist - particle_r) + 1))

                    let inv_ball_rot = mat3_mul(rot_z_mat3(-particle.a1), rot_x_mat3(-particle.a0));
                    gl.draw_sphere(ball_mat, mat3_mul(rot, ball_rot),
                        { type: "ball", box_dir: mat3_mul_vec(inv_ball_rot, [ball_dim, 0, 0]) });


                    const quad_size = 0.3;
                    dist /= quad_size;

                    for (let k = 0; k < 4; k++) {

                        quads[quad_count * 24 + k * 6 + 0] = state.box_p + (particle.p < state.box_p ? - 0.51 : 0.51);
                        quads[quad_count * 24 + k * 6 + 1] = (k & 2 ? -quad_size : quad_size);
                        quads[quad_count * 24 + k * 6 + 2] = (k & 1 ? -quad_size : quad_size) + particle.y;
                        quads[quad_count * 24 + k * 6 + 3] = k & 1 ? -1 : 1;
                        quads[quad_count * 24 + k * 6 + 4] = k & 2 ? -1 : 1;
                        quads[quad_count * 24 + k * 6 + 5] = dist;
                    }

                    quad_count++;
                }

                gl.update_quad_buffer(quads);

                let box_mat = scale_mat4([0.5, 0.5, 0.48]);
                box_mat = mat4_mul(translation_mat4([state.box_p, 0, 0]), box_mat);
                box_mat = mat4_mul(mvp, box_mat);

                gl.draw_box(box_mat, rot, { type: "cardboard" });

                let floor_mat = scale_mat4([16, 16, 0.1]);
                floor_mat = mat4_mul(translation_mat4([0, 0, -0.5]), floor_mat);
                floor_mat = mat4_mul(mvp, floor_mat);
                gl.draw_box(floor_mat, rot, { type: "floor", shade_pos: [state.box_p, 0] });

                gl.draw_quads(mvp, quad_count, { type: "ball_shadow" });

                ctx.drawImage(gl.finish(), 0, 0, width, height);

                ctx.feather(width * scale, height * scale,
                    canvas.height * 0.15, canvas.height * 0.15,
                    canvas.height * 0.15, canvas.height * 0.15);

                {
                    ctx.resetTransform();
                    ctx.save();
                    ctx.shadowColor = "rgba(0,0,0,1.0)";
                    ctx.shadowBlur = canvas.width * 0.05 * 0.5;
                    ctx.shadowOffsetY = -60 * scale;
                    ctx.shadowOffsetX = 60 * scale;
                    ctx.globalCompositeOperation = "destination-out";
                    ctx.fillRect(-200, height * scale, 200, 200);
                    ctx.restore();
                }

            } else if (mode.startsWith("pressure_manual") || mode === "landscape") {

                let aspect = height / width;

                let radii = [0.1, 0.2, 0.25, 0.1];
                let strengths = [0.2, 0.7, -0.3, -0.5];

                let batch_marker_life = 2;
                let marker_path_dt = 0.008;

                dt *= 0.4;


                let scale_shift = [1, 0];
                let map_params = [0, 0, 0];

                let has_markers = false;

                let has_total_force = false;

                const marker_batch_count = 8;
                const marker_batch_size = 16;
                const marker_count = marker_batch_count * marker_batch_size;

                if (mode === "pressure_manual1" || mode === "pressure_manual2"
                    || mode === "pressure_manual2a") {
                    scale_shift = [0.5, 0.5];
                } else if (mode === "pressure_manual5" || mode === "pressure_manual6" || mode === "pressure_manual7") {
                    map_params = [10.0, 0.2, scale * 0.5]
                }

                if (mode === "pressure_manual2a" || mode === "pressure_manual4" || mode === "pressure_manual5")
                    has_total_force = true;

                if (mode === "pressure_manual6" || mode === "pressure_manual7" || mode === "landscape") {
                    has_markers = true;
                    dt *= slider_args[0];
                }

                function map(pos, center, radius, strength) {

                    let d = vec_len(vec_sub(pos, center)) / radius;
                    d = clamp(d, 0.0, 1.0);

                    return strength * (1.0 - d * d * (3.0 - 2.0 * d));
                }

                let pp = draggables || args.locations;

                function pressure(pos) {
                    let p = 0;
                    for (let i = 0; i < 4; i++) {
                        p += map(pos, pp[i].pos, radii[i], strengths[i]);
                    }
                    return p;
                }

                function pressure_grad(pos) {
                    const dx = 0.001;
                    const p = pressure(pos);
                    const px = pressure([pos[0] + dx, pos[1]]);
                    const py = pressure([pos[0], pos[1] + dx]);
                    return [(px - p) / dx, (py - p) / dx];
                }

                let batch_spawn_interval = 0.2;

                if (has_markers) {

                    if (state === undefined) {
                        state = {};

                        state.markers = new Array(marker_count);

                        const marker_spawn_rate = batch_marker_life / (marker_batch_count - 1);

                        for (let i = 0; i < marker_count; i++) {
                            let batch = floor(i / marker_batch_size);

                            let marker = {};
                            marker.x = 100;
                            marker.y = 100;
                            marker.life = marker_spawn_rate * batch;

                            marker.history_i = 0;

                            marker.vx = 0;

                            state.markers[i] = marker;
                        }

                        state.gl_marker_state = gl.create_marker_state(marker_count);
                    }

                    let c = state.markers.length;

                    let marker_writes = new Float32Array(c * 5);
                    let marker_alphas = new Float32Array(c);

                    let marker_resets = [];

                    let track_z = mode === "landscape";

                    for (let i = 0; i < c; i++) {

                        let marker = state.markers[i];

                        if (marker.life === -Infinity)
                            continue;

                        if (marker.life <= 0) {


                            let k = i % marker_batch_size;

                            let x = -0.2;
                            let y = 0.6 * (k) / marker_batch_size;
                            marker.x = x;
                            marker.y = y;
                            marker.life = batch_marker_life;
                            marker.history_i = 1;

                            marker.vx = 1;
                            marker.vy = 0;

                            marker_resets.push((i + 0.5) / marker_count);
                            marker_resets.push(x);
                            marker_resets.push(y);
                        }


                        let gp = pressure_grad([marker.x, marker.y]);

                        marker.vx += -gp[0] * dt;
                        marker.vy += -gp[1] * dt;
                        marker.x += marker.vx * dt;
                        marker.y += marker.vy * dt;


                        let new_life = marker.life - dt;

                        if (ceil(marker.life / marker_path_dt) != ceil(new_life / marker_path_dt))
                            marker.history_i++;


                        let ii = marker.history_i % marker_history_size;

                        marker.life = new_life;

                        marker_writes[i * 5 + 0] = (i + 0.5) / marker_count;
                        marker_writes[i * 5 + 1] = (ii + 0.5) /
                            marker_history_size;

                        marker_writes[i * 5 + 2] = marker.x;
                        marker_writes[i * 5 + 3] = marker.y;

                        let a = smooth_step(0, 0.03, new_life);

                        marker_alphas[i] = a;

                        if (track_z)
                            marker_writes[i * 5 + 4] = pressure([marker.x, marker.y]) * 0.25;

                    }


                    gl.update_marker_state(state.gl_marker_state, new Float32Array(marker_resets), marker_writes, marker_alphas);
                }


                function x_map(x) {
                    return x * 2 - 1;
                }

                function y_map(y) {
                    y -= aspect * 0.5;
                    return -y * 2;
                }

                gl.begin(width, height);


                if (mode === "landscape") {

                    function x_map(x) {
                        return x;
                    }

                    function y_map(y) {
                        return aspect - y;
                    }

                    let mat = translation_mat4([-0.5, -0.5 * aspect, 0.0]);

                    mat = mat4_mul(scale_mat4(4.5), mat);
                    mat = mat4_mul(vp, mat);


                    gl.draw_landscape(mat, {
                        pos0: [x_map(args.locations[0].pos[0]), y_map(args.locations[0].pos[1]), radii[0], strengths[0]],
                        pos1: [x_map(args.locations[1].pos[0]), y_map(args.locations[1].pos[1]), radii[1], strengths[1]],
                        pos2: [x_map(args.locations[2].pos[0]), y_map(args.locations[2].pos[1]), radii[2], strengths[2]],
                        pos3: [x_map(args.locations[3].pos[0]), y_map(args.locations[3].pos[1]), radii[3], strengths[3]],
                    })

                    gl.draw_landscape_edge(mat);


                    for (let marker of state.markers) {
                        if (marker.life <= 0)
                            continue;

                        let pos = [marker.x,
                        y_map(marker.y),
                        pressure([marker.x, marker.y]) * 0.25];

                        let alpha = 1;
                        alpha *= smooth_step(-0.2, -0.1, pos[0]) - smooth_step(1.1, 1.2, pos[0]);
                        alpha *= smooth_step(-0.2, -0.1, pos[1]) - smooth_step(aspect + 0.1, aspect + 0.2, pos[1]);

                        if (alpha == 0)
                            continue;

                        let ball_mat = scale_mat4(0.005);
                        ball_mat = mat4_mul(translation_mat4(pos), ball_mat);
                        ball_mat = mat4_mul(mat, ball_mat);

                        let color = [0, 0, 0, alpha];

                        gl.draw_sphere(ball_mat, rot,
                            { type: "plain_sphere", color: color });
                    }

                    mat = mat4_mul(mat, translation_mat4([0, aspect, 0]));
                    mat = mat4_mul(mat, scale_mat4([1, -1, 1]));

                    gl.draw_marker_trails(state.gl_marker_state, mat, {
                        line_width: 0.004,
                        depth: true
                    });


                } else {
                    gl.draw_full("pressure_manual", {
                        pos0: [x_map(draggables[0].pos[0]), y_map(draggables[0].pos[1]), radii[0] * 2, strengths[0]],
                        pos1: [x_map(draggables[1].pos[0]), y_map(draggables[1].pos[1]), radii[1] * 2, strengths[1]],
                        pos2: [x_map(draggables[2].pos[0]), y_map(draggables[2].pos[1]), radii[2] * 2, strengths[2]],
                        pos3: [x_map(draggables[3].pos[0]), y_map(draggables[3].pos[1]), radii[3] * 2, strengths[3]],
                        scale_shift: scale_shift,
                        pressure_map_params: map_params
                    });

                    if (has_markers) {

                        let mat = scale_mat4([2.0, -2.0 / aspect, 1.0]);
                        mat = mat4_mul(translation_mat4([-1, 1, 0]), mat);
                        gl.draw_marker_trails(state.gl_marker_state, mat, {
                            line_width: 0.002
                        });


                        gl.draw_markers(state.gl_marker_state, mat, {
                            point_size: width * 0.009 * scale
                        });
                    }
                }

                ctx.drawImage(gl.finish(), 0, 0, width, height);

                ctx.save();

                ctx.scale(width, width);
                ctx.lineWidth = 2 / width;

                let body_pos = [0.5, aspect * 0.5];

                if (mode === "pressure_manual2" || mode === "pressure_manual2a" ||
                    mode === "pressure_manual4" ||
                    mode === "pressure_manual5" || mode === "pressure_manual7") {

                    let sc = 0.5;
                    ctx.save();
                    ctx.lineWidth /= sc;
                    ctx.translate(body_pos[0], body_pos[1]);
                    ctx.scale(sc, sc);
                    ctx.translate(-0.5, 0);


                    let n = symmetric_airfoil_geometry.pressure_taps.length;



                    ctx.fillStyle = "#333";

                    for (let i = 0; i < n; i += 1) {
                        let tap = symmetric_airfoil_geometry.pressure_taps[i];
                        let pos = tap.p;
                        let dir = tap.dir;
                        let ppos = [(pos[0] - 0.5) * sc + body_pos[0], pos[1] * sc + body_pos[1]];
                        let p = (pressure(ppos) * scale_shift[0] + scale_shift[1]) * 0.2;


                        let ss = min(1, abs(p) * 30);

                        if (p > 0)
                            ctx.arrow(pos[0] + dir[0] * p, pos[1] + dir[1] * p, pos[0], pos[1], 0.006, 0.018 * ss, 0.027 * ss);
                        else
                            ctx.arrow(pos[0], pos[1], pos[0] - dir[0] * p, pos[1] - dir[1] * p, 0.006, 0.018 * ss, 0.027 * ss);

                        ctx.fill();
                    }


                    ctx.fillStyle = "#F0C529";
                    ctx.strokeStyle = "#444";


                    ctx.fillStyle = "#F0C529";
                    ctx.strokeStyle = "#444";


                    ctx.lineWidth = 0.006;
                    ctx.beginPath();
                    for (let x = 0; x < symmetric_airfoil_geometry.nx; x++) {
                        let p = symmetric_airfoil_geometry.grid_position(x, 0);
                        ctx.lineTo(p[0], p[1]);
                    }
                    ctx.closePath();
                    ctx.globalAlpha = 0.8;
                    ctx.fill();
                    ctx.globalAlpha = 1.0;
                    ctx.stroke();

                    ctx.globalCompositeOperation = "destination-over";
                    ctx.fill();
                    ctx.globalCompositeOperation = "source-over";

                    ctx.fillStyle = "#5BAFA2";
                    ctx.strokeStyle = "#2B524C";

                    if (has_total_force) {

                        let f = [0, 0];

                        for (let i = 0; i < n; i++) {
                            let tap = symmetric_airfoil_geometry.pressure_taps[i];
                            let pos = tap.p;
                            let dir = tap.dir;
                            let ppos = [(pos[0] - 0.5) * sc + body_pos[0], pos[1] * sc + body_pos[1]];
                            let p = (pressure(ppos) * scale_shift[0] + scale_shift[1]);

                            f = vec_add(f, vec_scale(dir, -p));
                        }



                        let ll = vec_len(f);

                        let ls = 0.1;
                        let ss = min(1, 2.0 * ll);

                        ctx.save();
                        ctx.translate(0.5, 0);
                        ctx.arrow(0, 0, ls * f[0], ls * f[1], 0.015 * ss, 0.04 * ss, 0.05 * ss);
                        ctx.fill();
                        ctx.stroke();

                        ctx.restore();

                    }

                    ctx.restore();
                }

                ctx.feather(width * scale, height * 0.95 * scale,
                    canvas.width * 0.1, canvas.width * 0.1,
                    canvas.width * 0.1, canvas.width * 0.1);


                ctx.restore();
                ctx.save();

                ctx.translate(width * 0.5, height * 0.95);


                function draw_scale(absolute, isolines) {

                    let grd = ctx.createLinearGradient(-width * 0.3, 0, width * 0.3, 0);

                    if (absolute) {

                        for (let i = 0; i <= 10; i++) {
                            let t = i / 10
                            grd.addColorStop(t, rgba_color_string(vec_mul(positive_color, [1, 1, 1, t * t * (3 - 2 * t)])));
                        }
                    } else {

                        ctx.strokeStyle = rgba_color_string(vec_mul(negative_color, [1, 1, 1, 0.2]))

                        for (let i = 0; i < 9; i++) {
                            let t = i / 8;
                            grd.addColorStop(t * 0.5, rgba_color_string(vec_mul(negative_color, [1, 1, 1, 1 - t * t * (3 - 2 * t)])));

                            if (isolines) {
                                let lt = (i + 0.5) / 9;
                                ctx.strokeLine(-width * 0.25 + lt * width * 0.25, 0,
                                    -width * 0.25 + lt * width * 0.25, height * 0.05 - 2);
                            }
                        }

                        ctx.strokeStyle = rgba_color_string(vec_mul(positive_color, [1, 1, 1, 0.2]))


                        for (let i = 0; i < 9; i++) {
                            let t = i / 8;
                            grd.addColorStop(0.5 + t * 0.5, rgba_color_string(vec_mul(positive_color, [1, 1, 1, t * t * (3 - 2 * t)])));

                            if (isolines) {
                                let lt = (i + 0.5) / 9;
                                ctx.strokeLine(lt * width * 0.25, 0,
                                    lt * width * 0.25, height * 0.05 - 2);
                            }
                        }
                    }
                    ctx.fillStyle = grd;

                    ctx.lineWidth = 1.5;
                    ctx.strokeStyle = "#555";
                    ctx.globalCompositeOperation = "source-over";
                    ctx.roundRect(-width * 0.25, 0, width * 0.5, height * 0.05 - 2, height * 0.015);
                    ctx.fill();
                    ctx.stroke();

                    ctx.fillStyle = ctx.strokeStyle = "#333";
                    ctx.lineWidth = 1.0;
                    ctx.beginPath();
                    ctx.lineTo(0, 0);
                    ctx.lineTo(-height * 0.009, -height * 0.018);
                    ctx.lineTo(+height * 0.009, -height * 0.018);
                    ctx.closePath();
                    ctx.fill();
                    ctx.stroke();
                }

                draw_scale(scale_shift[1] != 0, map_params[1] != 0)
                ctx.restore();


                if (mode !== "landscape") {
                    ctx.save();
                    ctx.scale(width, width);


                    let dash_n = 20;
                    let dash_l = draggables[0].size * pi / dash_n;

                    ctx.lineCap = "butt";
                    ctx.lineWidth = 0.003;
                    ctx.setLineDash([dash_l, dash_l]);
                    ctx.strokeStyle = "rgba(0,0,0,0.5)"
                    for (let draggable of draggables) {
                        ctx.strokeEllipse(draggable.pos[0], draggable.pos[1], draggable.size);
                    }




                    ctx.setLineDash([]);
                    ctx.strokeStyle = "#333"
                    ctx.lineWidth = 0.004;
                    for (let i = 0; i < draggables.length; i++) {
                        let p = draggables[i].pos;
                        let s = 0.03 * (abs(strengths[i]) * 0.3 + 0.3);
                        ctx.strokeLine(p[0] - s, p[1],
                            p[0] + s, p[1])
                        if (strengths[i] > 0) {
                            ctx.strokeLine(p[0], p[1] - s, p[0], p[1] + s)
                        }
                    }
                    ctx.restore();
                }


            } else if (mode.includes("fvm")) {

                let aspect = height / width;

                let zoom = 1;
                let tx = 0;
                let ty = 0;

                let re = 1000000;
                let sim_dt = 1e-5;
                let sim_iterations = min(21, floor(dt * 1000));


                let has_markers = true;
                let has_velocity_arrows = true;
                let has_velocity = false;
                let has_pressure = true;
                let has_pressure_arrows = false;
                let has_pressure_based_markers = false;
                let has_aoa = false;
                let has_total_force = false;
                let has_plane = false;

                let plot_data;
                let plot_range;

                let batch_marker_life = 0.17;
                let free_marker_life = 2;
                let marker_path_dt = 0.0008;

                let marker_start_x = -0.5;
                let marker_start_y0 = -0.8;
                let marker_start_y1 = 0.8;

                let marker_size = 0.0065;
                let marker_alpha = 0.7;

                let arrow_step = 0.06;

                let arrows_x0 = -0.42;
                let arrows_x1 = 1.5;
                let arrows_y0 = -0.6;
                let arrows_y1 = 0.6;
                let arrow_scale = 0.002;

                let pressure_arrow_scale = 0.0035;
                let total_force_scale = 0.01;


                let fixed = false;
                let initial_data_offset = undefined;

                let fvm_mode = "cylinder";
                let mesh_name = "symmetric_airfoil";
                let angle = 0;
                let geometry = symmetric_airfoil_geometry;

                let pressure_limiter = undefined;

                let pressure_scale = 1.5;

                if (mode.startsWith("symmetric_airfoil_fvm")) {


                    if (mode === "symmetric_airfoil_fvm1") {
                        has_pressure = false;
                        marker_start_y0 = -0.83;
                    }


                    fvm_mode = "cylinder";
                    mesh_name = "symmetric_airfoil";

                    tx = -0.5;
                    geometry = symmetric_airfoil_geometry;
                    initial_data_offset = initial_data_offsets["symmetric_airfoil"];
                } else if (mode.startsWith("airfoil_fvm") || mode === "hero_fvm") {

                    fvm_mode = "cylinder";
                    mesh_name = "asymmetric_airfoil";
                    initial_data_offset = initial_data_offsets["asymmetric_airfoil"];

                    marker_start_y0 = -0.8;
                    zoom = 1;
                    tx = -0.5;
                    geometry = asymmetric_airfoil_geometry;


                    has_velocity_arrows = false;

                    if (mode === "airfoil_fvm1") {
                        has_pressure = false;
                        has_markers = false;
                        has_velocity_arrows = true;
                        zoom = 1.5;


                        arrows_x0 = -0.15;
                        arrows_x1 = 1.2;
                        arrows_y0 = -0.44;
                        arrows_y1 = 0.4;
                        arrow_scale = 0.0015;
                        arrow_step = 0.035;

                    } else if (mode === "airfoil_fvm1a") {
                        has_pressure = false;
                        has_velocity_arrows = true;
                    }




                    if (mode === "airfoil_fvm4") {
                        zoom = 1;
                        mesh_name = "naca_64_1_212";
                        geometry = naca_64_1_212_geometry;
                        has_total_force = true;
                        initial_data_offset = initial_data_offsets["naca_64_1_212"];
                    }
                } else if (mode.startsWith("plate_fvm")) {

                    fvm_mode = "cylinder";
                    mesh_name = "plate";
                    zoom = 0.9;
                    tx = -0.5;
                    geometry = plate_geometry;

                    initial_data_offset = initial_data_offsets["flat_plate"];
                }

                if (mode === "symmetric_airfoil_fvm3") {
                    has_velocity_arrows = false;
                    fixed = true;
                    marker_alpha = 0.5;
                }
                if (mode === "symmetric_airfoil_fvm4" ||
                    mode === "symmetric_airfoil_fvm5" ||
                    mode === "symmetric_airfoil_fvm5a") {
                    marker_alpha = 0.5;
                    fixed = true;
                    has_pressure_based_markers = true;
                    has_velocity_arrows = false;

                    let scale = lerp(-1, 2, slider_args[0]);

                    if (mode === "symmetric_airfoil_fvm5a") {
                        scale = 0.9804;
                        zoom = 1.0;
                        tx = -0.2;
                        marker_start_x = -0.8;
                        marker_alpha = 0.25;
                    } else if (mode === "symmetric_airfoil_fvm5") {
                        if (state && state.slider_args[1] != slider_args[1]) {
                            state = undefined;
                        }

                        scale = lerp(0, 2, slider_args[0]);
                    }

                    pressure_limiter = function (p, x, y) {

                        if (x < nx / 4 || x > nx * 3 / 4)
                            return 0;
                        if (p < 0)
                            return 0;
                        return p * scale;
                    }
                } else if (mode === "symmetric_airfoil_fvm6") {
                    fixed = true;
                    has_pressure_based_markers = true;
                    has_velocity_arrows = false;
                    marker_alpha = 0.5;

                    const scale = lerp(2, -1, slider_args[0]);

                    pressure_limiter = function (p, x, y) {

                        if ((x < nx / 4 || x > nx * 3 / 4) && p > 0)
                            return 0;

                        if (p < 0)
                            return p * scale;

                        // markers start early
                        return p * 1.00805;
                    }
                } else if (mode === "symmetric_airfoil_fvm7") {
                    fixed = true;
                    has_pressure_based_markers = true;
                    has_velocity_arrows = false;
                    marker_alpha = 0.5;

                    const scale = lerp(-1, 2, slider_args[0]);

                    pressure_limiter = function (p, x, y) {

                        if ((x < nx / 4 || x > nx * 3 / 4) && p > 0)
                            return p * scale;

                        return p * 1.00805
                    }
                }

                else if (mode === "symmetric_airfoil_fvm9" || mode === "symmetric_airfoil_fvm9a") {

                    has_markers = false;

                    has_pressure_arrows = true;
                    has_velocity_arrows = false;

                    has_total_force = true;
                    total_force_scale = 0.2;


                } else if (mode === "symmetric_airfoil_fvm10") {


                    has_velocity_arrows = false;
                    zoom = 0.6;

                    marker_start_x = -1.2;
                    marker_start_y0 = -0.95;
                    marker_start_y1 = 0.95;
                    batch_marker_life = 0.23;
                    marker_path_dt = 0.001;

                    marker_size = 0.008;

                } else if (mode === "symmetric_airfoil_fvm11") {

                    mesh_name = "dynamic_symmetric_airfoil";

                    has_markers = false;
                    has_pressure_arrows = true;
                    has_velocity_arrows = false;

                    has_total_force = true;

                    total_force_scale = 0.2;

                    if (state && state.geometry)
                        geometry = state.geometry
                    else
                        geometry = generate_symmetric_airfoil_geometry(0.15);
                } else if (mode === "symmetric_airfoil_fvm12") {

                    mesh_name = "dynamic_uneven_airfoil";

                    has_markers = false;
                    has_pressure_arrows = true;
                    has_velocity_arrows = false;
                    has_total_force = true;

                    total_force_scale = 0.05;

                    if (state && state.geometry)
                        geometry = state.geometry
                    else
                        geometry = generate_symmetric_airfoil_geometry(0.15);
                } else if (mode === "symmetric_airfoil_fvm20") {
                    has_pressure_arrows = false;
                    angle = pi / 180 * lerp(-5, 5, slider_args[0]);
                    has_aoa = true;
                    has_plane = true;
                } else if (mode === "symmetric_airfoil_fvm21") {
                    has_markers = false;
                    has_pressure_arrows = true;
                    has_velocity_arrows = false;
                    angle = pi / 180 * lerp(-5, 5, slider_args[0]);
                    has_aoa = true;
                    has_total_force = true;
                    has_plane = true;
                    pressure_arrow_scale = 0.0022;
                } else if (mode === "symmetric_airfoil_fvm22") {
                    has_markers = false;
                    has_pressure_arrows = true;
                    has_velocity_arrows = false;
                    angle = pi / 180 * lerp(-5, 5, slider_args[0]);
                    has_aoa = true;
                    has_total_force = true;
                    plot_range = [-6, 6, -50, 50];
                    plot_data = symmetric_airfoil_plot_data;
                    pressure_arrow_scale = 0.0022;
                    zoom = 0.8;
                    tx = -0.8;
                } else if (mode === "symmetric_airfoil_fvm23") {
                    has_markers = false;
                    has_pressure_arrows = true;
                    has_velocity_arrows = false;
                    angle = pi / 180 * lerp(0, 18, slider_args[0]);
                    has_aoa = true;
                    has_total_force = true;

                    if (!state && slider_args[0] == 1)
                        initial_data_offset = initial_data_offsets["symmetric_airfoil_18"];

                    plot_range = [-6, 18, -20, 80];
                    plot_data = symmetric_airfoil_plot_data;
                    pressure_arrow_scale = 0.0014;
                    zoom = 0.5;
                    tx = -1;
                    ty = -0.3;

                } else if (mode === "symmetric_airfoil_fvm24" ||
                    mode === "symmetric_airfoil_fvm24a") {


                    angle = pi / 180 * lerp(0, 18, slider_args[0]);
                    has_aoa = true;

                    if (!state && slider_args[0] == 1)
                        initial_data_offset = initial_data_offsets["symmetric_airfoil_18"];

                } else if (mode === "symmetric_airfoil_fvm25") {
                    initial_data_offset = initial_data_offsets["symmetric_airfoil_18"];
                    angle = pi / 180 * 18;
                    has_aoa = true;


                    marker_start_x = -0.1;
                    marker_start_y0 = -0.4;
                    marker_start_y1 = 0.2;
                    marker_size = 0.003;
                    zoom = 3.5;
                    tx = -0.2;
                    ty = -0.1;
                    marker_path_dt = 0.0004;
                    batch_marker_life = 0.07;


                    arrow_step = 0.025;
                    arrows_x0 = -0.3;
                    arrows_x1 = 0.5;
                    arrows_y0 = -0.2;
                    arrows_y1 = 0.4;
                    arrow_scale = 0.001;
                } else if (mode === "plate_fvm1") {
                    has_markers = false;
                    // has_velocity_arrows = false;
                    has_total_force = true;

                    has_pressure_arrows = true;
                    angle = pi / 180 * lerp(0, 5, slider_args[0]);
                    has_aoa = true;
                } else if (mode === "hero_fvm") {
                    has_pressure_arrows = false;
                    angle = pi / 180 * lerp(0, 10, slider_args[0]);
                    has_plane = true;

                    marker_start_y0 = -0.84;
                } else if (mode === "airfoil_fvm2") {

                    has_markers = false;
                    has_pressure_arrows = true;
                    has_velocity_arrows = false;
                    has_total_force = true;
                    angle = pi / 180 * lerp(-4, 18, slider_args[0]);
                    has_aoa = true;

                    plot_range = [-6, 20, -10, 90];
                    plot_data = asymmetric_airfoil_plot_data;


                    pressure_arrow_scale = 0.0014;
                    zoom = 0.5;
                    tx = -1;
                    ty = -0.3;

                } else if (mode === "airfoil_fvm3") {

                    angle = pi / 180 * lerp(0, 10, slider_args[0]);
                    has_aoa = true;
                    has_pressure = false;
                    has_velocity = true;
                } else if (mode === "airfoil_fvm4") {

                    angle = pi / 180 * lerp(0, 7, slider_args[0]);
                    has_aoa = true;
                }

                let d = 1;
                let v = mu * re / d;


                let fvm_vel = [v * cos(angle), v * sin(angle)];


                let velocity_scale = 1 / v;


                const ngx = geometry.ngx;
                const ngy = geometry.ngy;
                const ncx = geometry.ncx;
                const ncy = geometry.ncy;
                const nx = geometry.nx;
                const ny = geometry.ny;
                const gx = geometry.gx;
                const gy = geometry.gy;
                const cx = geometry.cx;
                const cy = geometry.cy;

                let gi = function (x, y) {
                    x = (x + ngx) % ngx;

                    if (y < 0)
                        y = 0;
                    if (y >= ngx)
                        y = ngx - 1;

                    return y * ngx + x;
                };

                let ci = function (x, y) {

                    x += 2;
                    y += 2;

                    return y * ncx + x;
                };

                if (state === undefined) {


                    state = {};
                    state.solver = new FVMSolver(geometry, fvm_mode, fvm_vel, has_pressure_based_markers);

                    state.avg_force = [0, 0];

                    state.angle = angle;
                    state.iters = 0;
                    state.start_iters = 0;

                    state.slider_args = slider_args.slice();

                    if (has_markers) {
                        state.markers = new Array(marker_count);

                        const marker_spawn_rate = batch_marker_life / (marker_batch_count - 1);

                        state.free_marker_slots = new Array(free_marker_count);

                        for (let i = 0; i < marker_count; i++) {
                            let batch = floor(i / marker_batch_size);

                            let marker = {};
                            marker.x = 100;
                            marker.y = 100;
                            marker.cx = 0;
                            marker.cy = 0;
                            marker.life = marker_spawn_rate * batch;
                            marker.history_i = 0;

                            marker.vx = 0;
                            marker.vy = 0;

                            marker.alpha = marker_alpha;

                            if (i >= batch_marker_count) {
                                marker.life = -Infinity;
                                state.free_marker_slots.push(i);
                            }

                            state.markers[i] = marker;
                        }

                        state.gl_marker_state = gl.create_marker_state(marker_count);

                        if (!has_pressure_based_markers) {
                            container.classList.add("marker_drop");
                        }
                    } else {
                        state.markers = new Array();
                    }

                }

                let overwrite_pc = false;

                if (initial_data_offset !== undefined && !state.has_set_data && initial_data) {

                    state.solver.set_data(initial_data, initial_data_offset);
                    state.has_set_data = true;
                    overwrite_pc = true;
                }

                if (mode === "symmetric_airfoil_fvm11" || mode === "symmetric_airfoil_fvm12") {



                    let t;

                    if (mode === "symmetric_airfoil_fvm11")
                        t = lerp(0.15, 0.22, slider_args[0]);
                    else if (mode === "symmetric_airfoil_fvm12")
                        t = lerp(0.15, 0.22, slider_args[0]);

                    if (t != state.thickness) {

                        if (mode === "symmetric_airfoil_fvm11")
                            geometry = generate_symmetric_airfoil_geometry(t);
                        else if (mode === "symmetric_airfoil_fvm12")
                            geometry = generate_symmetric_airfoil_geometry(0.15, t);

                        state.geometry = geometry;
                        state.solver.set_geometry(geometry);
                        state.start_iters = -5000;
                        state.thickness = t;

                        let mesh_vertex_count = geometry.ngx * geometry.ngy;

                        let mesh_vertices = new Float32Array(mesh_vertex_count * 2);

                        let i = 0;

                        for (let y = 0; y < geometry.ngy; y++) {
                            for (let x = 0; x < geometry.ngx; x++) {
                                let pos = geometry.cell_position(x, y);

                                mesh_vertices[i++] = pos[0];
                                mesh_vertices[i++] = pos[1];
                            }
                        }

                        gl.update_fvm_mesh_p_pos_buffer(mesh_name, mesh_vertices);
                    }
                }


                if (state.angle != angle) {

                    const max_step = 0.002;

                    let delta = angle - state.angle;

                    if (abs(delta) < max_step) {
                        state.angle = angle;
                    } else {

                        delta = delta > 0 ? max_step : -max_step;

                        state.angle += delta;
                    }

                    state.solver.rot_velocity(delta);

                    state.start_iters = 0;
                    state.arrows = undefined;
                    angle = state.angle;
                }

                let ca = cos(-angle);
                let sa = sin(-angle);


                let pc = smooth_step(0, 6000, state.start_iters);
                pc = 0.995 * (1.0 - pc * pc);

                if (overwrite_pc || fixed)
                    pc = 0;

                if (has_velocity_arrows && !state.arrows) {

                    let arrows = [];


                    let cxcy = [0, 0];

                    let f0 = 3;
                    let f1 = 1;

                    if (mode === "plate_fvm1") {
                        f0 = 2;
                        f1 = 3;
                    }

                    for (let x = arrows_x0; x <= arrows_x1; x += arrow_step) {
                        for (let y = arrows_y0; y < arrows_y1; y += arrow_step) {

                            let arrow = {};
                            arrow.x = (x - 0.5) * ca + y * sa + 0.5;
                            arrow.y = -(x - 0.5) * sa + y * ca;

                            cxcy = geometry.uv_sample(arrow.x, arrow.y, arrow.y > 0 ? ceil(nx * f0 / 4) : ceil(f1 * nx / 4), 0);

                            arrow.cxcy = cxcy;
                            arrows.push(arrow);
                        }
                    }

                    state.arrows = arrows;

                }



                let gl_mat = translation_mat4([tx, ty, 0]);
                gl_mat = mat4_mul(rot_z_mat4(-angle), gl_mat);
                gl_mat = mat4_mul(scale_mat4([zoom, zoom * width / height, 1]), gl_mat);



                if (!fixed && sim_dt > 0 && (initial_data_offset === undefined || state.has_set_data)) {
                    for (let i = 0; i < sim_iterations; i++)
                        state.solver.update(sim_dt);

                    state.iters += sim_iterations;
                    state.start_iters += sim_iterations;
                }


                if (has_markers) {

                    let c = state.markers.length;



                    let marker_writes = new Float32Array(c * 5);
                    let marker_alphas = new Float32Array(c);
                    let marker_resets = [];

                    if (last_click_position && !has_pressure_based_markers) {

                        if (state.free_marker_slots.length) {
                            let slot = state.free_marker_slots.pop();

                            let p = last_click_position;

                            p[0] = (2 * p[0] - 1) / zoom;
                            p[1] = (2 * -p[1] + aspect) / zoom;

                            p = [p[0] * ca + p[1] * sa,
                            -p[0] * sa + p[1] * ca]

                            p[0] = p[0] - tx;
                            p[1] = p[1] - ty;

                            let marker = state.markers[slot];
                            marker.x = p[0];
                            marker.y = p[1];
                            marker.cx = p[1] > 0 ? ceil(nx * 3 / 4) : ceil(nx / 4);
                            marker.cy = 0;
                            marker.life = free_marker_life * 0.1;
                            marker.history_i = 1;
                            marker.alpha = marker_alpha;

                            marker_resets.push((slot + 0.5) / marker_count);
                            marker_resets.push(marker.x);
                            marker_resets.push(marker.y);
                        }

                        last_click_position = undefined;
                    }



                    for (let iter = 0; iter < sim_iterations; iter++) {
                        for (let i = 0; i < c; i++) {

                            let marker = state.markers[i];

                            if (marker.life === -Infinity) {
                                marker_writes[i * 5 + 0] = -10;
                                continue;
                            }
                            let batch = i % marker_batch_size;

                            if (marker.life <= 0) {

                                if (i >= batch_marker_count) {
                                    state.free_marker_slots.push(i);
                                    marker.life = -Infinity;
                                    marker_writes[i * 5 + 0] = -10;
                                    continue;
                                }


                                let x = marker_start_x;
                                let y = lerp(marker_start_y0, marker_start_y1, (batch) / marker_batch_size);
                                marker.x = x * ca + y * sa;
                                marker.y = -x * sa + y * ca;
                                marker.cx = 10;
                                marker.cy = 10;
                                marker.life = batch_marker_life;
                                marker.history_i = 1;

                                if (has_pressure_based_markers) {
                                    marker.vx = fvm_vel[0];
                                    marker.vy = fvm_vel[1];

                                    if (mode === "symmetric_airfoil_fvm5") {
                                        marker.vx *= slider_args[1] * 1.4;
                                        marker.vy *= slider_args[1] * 1.4;
                                    }
                                }

                                marker_resets.push((i + 0.5) / marker_count);
                                marker_resets.push(marker.x);
                                marker_resets.push(marker.y);
                            }


                            let cxcy = geometry.uv_sample(marker.x, marker.y, marker.cx, marker.cy);

                            marker.cx = cxcy[0];
                            marker.cy = cxcy[1];


                            const p = state.solver.raw_pressure();
                            const p_grad_coeff = geometry.p_grads;

                            function cell_pressure_grad(x, y) {
                                let ip = ci(x, y);


                                // let i00 = ci(x - 1, y - 1);
                                // let i10 = ci(x, y - 1);
                                // let i01 = ci(x - 1, y);
                                // let i11 = ci(x, y);

                                let i00 = ip - ncx - 1;
                                let i10 = ip - ncx;
                                let i01 = ip - 1
                                let i11 = ip;

                                let p00 = p[i00];
                                let p10 = p[i10];
                                let p01 = p[i01];
                                let p11 = p[i11];

                                if (y == 0) {
                                    return [0, 0];
                                }


                                if (pressure_limiter) {
                                    p00 = pressure_limiter(p00, x - 1, y - 1);
                                    p10 = pressure_limiter(p10, x, y - 1);
                                    p01 = pressure_limiter(p01, x - 1, y);
                                    p11 = pressure_limiter(p11, x, y);
                                }

                                // 0.5 lerps are baked into p_grads

                                let dpds = (-p00 + p10 - p01 + p11);
                                let dpdt = (-p00 - p10 + p01 + p11);

                                let dpdx = dpds * p_grad_coeff[ip * 4 + 0] + dpdt * p_grad_coeff[ip * 4 + 2];
                                let dpdy = dpds * p_grad_coeff[ip * 4 + 1] + dpdt * p_grad_coeff[ip * 4 + 3];
                                return [dpdx, dpdy];
                            }

                            // return [x, y, -1, -1, st0[0], st0[1]];

                            if (has_pressure_based_markers) {
                                let gp0 = cell_pressure_grad(cxcy[0] + cxcy[2], cxcy[1] + cxcy[3]);
                                let gp1 = cell_pressure_grad(cxcy[0], cxcy[1] + cxcy[3]);
                                let gp2 = cell_pressure_grad(cxcy[0] + cxcy[2], cxcy[1]);
                                let gp3 = cell_pressure_grad(cxcy[0], cxcy[1]);

                                let gp = vec_lerp(vec_lerp(gp0, gp1, cxcy[4]),
                                    vec_lerp(gp2, gp3, cxcy[4]), cxcy[5]);

                                marker.vx += -gp[0] * sim_dt;
                                marker.vy += -gp[1] * sim_dt;
                                marker.x += marker.vx * sim_dt;
                                marker.y += marker.vy * sim_dt;
                            } else {

                                let v0 = state.solver.cell_velocity(cxcy[0] + cxcy[2], cxcy[1] + cxcy[3]);
                                let v1 = state.solver.cell_velocity(cxcy[0], cxcy[1] + cxcy[3]);
                                let v2 = state.solver.cell_velocity(cxcy[0] + cxcy[2], cxcy[1]);
                                let v3 = state.solver.cell_velocity(cxcy[0], cxcy[1]);


                                let vx01 = v0[0] * (1 - cxcy[4]) + v1[0] * cxcy[4];
                                let vx23 = v2[0] * (1 - cxcy[4]) + v3[0] * cxcy[4];
                                let vx = vx01 * (1 - cxcy[5]) + vx23 * cxcy[5];


                                let vy01 = v0[1] * (1 - cxcy[4]) + v1[1] * cxcy[4];
                                let vy23 = v2[1] * (1 - cxcy[4]) + v3[1] * cxcy[4];
                                let vy = vy01 * (1 - cxcy[5]) + vy23 * cxcy[5];

                                marker.x += vx * sim_dt;
                                marker.y += vy * sim_dt;
                            }


                            let new_life = marker.life - sim_dt;

                            if (ceil(marker.life / marker_path_dt) != ceil(new_life / marker_path_dt))
                                marker.history_i++;


                            let ii = marker.history_i % marker_history_size;

                            marker_writes[i * 5 + 0] = (i + 0.5) / marker_count;
                            marker_writes[i * 5 + 1] = (ii + 0.5) /
                                marker_history_size;

                            marker_writes[i * 5 + 2] = marker.x;
                            marker_writes[i * 5 + 3] = marker.y;

                            let a = smooth_step(0, 0.03, new_life);

                            marker_alphas[i] = a * marker.alpha;

                            marker.life = new_life;
                        }
                    }

                    gl.update_marker_state(state.gl_marker_state, new Float32Array(marker_resets), marker_writes, marker_alphas);
                }


                gl.begin(width, height);


                if (has_pressure) {

                    let pressure_values = state.solver.pressure_mesh_values();

                    if (pressure_limiter) {

                        for (let y = 0; y < ny + 1; y++) {
                            for (let x = 0; x < nx + 1; x++) {
                                pressure_values[y * (nx + 1) + x] = pressure_limiter(pressure_values[y * (nx + 1) + x], x, y);
                            }
                        }
                    }

                    if (!state.pressure_values) {
                        state.pressure_values = pressure_values.slice();
                        for (let y = 0; y < ny + 1; y++) {
                            for (let x = 0; x < nx + 1; x++) {
                                let i = y * (nx + 1) + x;
                                state.pressure_values[i] = 0;
                            }
                        }
                    }

                    {

                        let val = state.pressure_values;

                        for (let y = 0; y < ny + 1; y++) {
                            for (let x = 0; x < nx + 1; x++) {
                                let i = y * (nx + 1) + x;
                                val[i] = val[i] * pc + pressure_values[i] * (1 - pc);
                            }
                        }
                    }


                    gl.update_fvm_mesh_p_val_buffer(mesh_name, state.pressure_values);
                    gl.draw_FVM_mesh(gl_mat, {
                        type: "pressure",
                        mesh: mesh_name,
                        scale_offset: [pressure_scale * velocity_scale * velocity_scale, 0],
                    });


                } else if (has_velocity) {

                    let speed_values = state.solver.speed_mesh_values();

                    if (!state.speed_values) {
                        state.speed_values = speed_values.slice();
                        for (let y = 0; y < ny + 1; y++) {
                            for (let x = 0; x < nx + 1; x++) {
                                let i = y * (nx + 1) + x;
                                state.speed_values[i] = 0;
                            }
                        }
                    }

                    {

                        let val = state.speed_values;

                        for (let y = 0; y < ny + 1; y++) {
                            for (let x = 0; x < nx + 1; x++) {
                                let i = y * (nx + 1) + x;
                                val[i] = val[i] * pc + speed_values[i] * (1 - pc);
                            }
                        }
                    }

                    gl.update_fvm_mesh_p_val_buffer(mesh_name, state.speed_values);
                    gl.draw_FVM_mesh(gl_mat, {
                        type: "velocity",
                        mesh: mesh_name,
                        scale_offset: [0.04, 0.0],
                    });
                }



                if (has_markers) {
                    gl.draw_marker_trails(state.gl_marker_state, gl_mat, {
                        line_width: marker_size * 0.5
                    });
                    gl.draw_markers(state.gl_marker_state, gl_mat, {
                        point_size: marker_size * zoom * width * scale
                    });
                }


                let zoom_scale = 0.5 * width * zoom;


                ctx.save();
                ctx.translate(round(width * 0.5), round(height * 0.5));

                ctx.scale(zoom_scale, -zoom_scale);
                ctx.rotate(-angle);

                ctx.translate(tx, ty);
                ctx.lineWidth = 2 / zoom_scale;

                ctx.fillStyle = "rgba(0,0,0,0.2)";
                ctx.strokeStyle = "rgba(33, 33, 33,0.3)";

                if (has_velocity_arrows) {
                    ctx.strokeStyle = "#000";
                    ctx.lineCap = "round";
                    ctx.lineWidth = 2 * width / 700 / zoom_scale;

                    for (let arrow of state.arrows) {
                        let cxcy = arrow.cxcy;


                        let v0 = state.solver.cell_velocity(cxcy[0] + cxcy[2], cxcy[1] + cxcy[3]);
                        let v1 = state.solver.cell_velocity(cxcy[0], cxcy[1] + cxcy[3]);
                        let v2 = state.solver.cell_velocity(cxcy[0] + cxcy[2], cxcy[1]);
                        let v3 = state.solver.cell_velocity(cxcy[0], cxcy[1]);

                        let v = vec_lerp(vec_lerp(v0, v1, cxcy[4]),
                            vec_lerp(v2, v3, cxcy[4]), cxcy[5]);

                        if (v[0] == 0.0 && v[1] == 0.0)
                            continue;

                        let x = arrow.x;
                        let y = arrow.y;

                        let vvx = v[0] * arrow_scale;
                        let vvy = v[1] * arrow_scale;

                        ctx.strokeLine(x, y,
                            (x + vvx),
                            (y + vvy));

                        ctx.strokeLine((x + vvx), (y + vvy),
                            (x + vvx * 0.8) - vvy * 0.2, (y + vvy * 0.8) + vvx * 0.2);

                        ctx.strokeLine((x + vvx), (y + vvy),
                            (x + vvx * 0.8) + vvy * 0.2, (y + vvy * 0.8) - vvx * 0.2);
                    }

                    ctx.globalCompositeOperation = "destination-out";
                    ctx.fillStyle = has_markers || mode === "plate_fvm1" ? "rgba(0,0,0,0.85)" : "rgba(0,0,0,0.4)";
                    ctx.fillRect(-10, -10, 20, 20);
                    ctx.globalCompositeOperation = "source-over";
                }


                ctx.strokeStyle = "black";
                ctx.lineCap = "butt";

                ctx.globalAlpha = 1;

                ctx.fillStyle = "#333";


                if (has_pressure_arrows) {

                    let n = geometry.pressure_taps.length;

                    if (!state.pressure_tap_values) {
                        state.pressure_tap_values = new Float64Array(n);
                    }

                    {

                        let val = state.pressure_tap_values;


                        for (let i = 0; i < n; i++) {
                            let tap = geometry.pressure_taps[i];
                            let pos = tap.p;
                            let dir = tap.dir;

                            let p0 = state.solver.cell_pressure(tap.x0, 0);
                            let p1 = state.solver.cell_pressure(tap.x1, 0);

                            let p = lerp(p0, p1, tap.t);

                            val[i] = val[i] * pc + p * (1 - pc);
                        }

                    }


                    for (let i = 0; i < n; i++) {
                        let tap = geometry.pressure_taps[i];
                        let pos = tap.p;
                        let dir = tap.dir;

                        let p = state.pressure_tap_values[i]

                        p *= pressure_arrow_scale;

                        let ss = min(1, abs(p) * 40);

                        if (p > 0)
                            ctx.arrow(pos[0] + dir[0] * p, pos[1] + dir[1] * p, pos[0], pos[1], 0.006, 0.018 * ss, 0.027 * ss);
                        else
                            ctx.arrow(pos[0], pos[1], pos[0] - dir[0] * p, pos[1] - dir[1] * p, 0.006, 0.018 * ss, 0.027 * ss);

                        ctx.fill();
                    }

                }



                ctx.save();

                ctx.resetTransform();
                ctx.globalCompositeOperation = "destination-over";
                ctx.drawImage(gl.finish(), 0, 0, width * scale, height * scale);

                ctx.restore();

                ctx.fillStyle = "#F0C529";
                ctx.strokeStyle = "#444";
                ctx.lineWidth = 0.006 / zoom;

                ctx.beginPath();
                for (let x = 0; x < nx; x++) {
                    let p = geometry.grid_position(x, 0);
                    ctx.lineTo(p[0], p[1]);
                }
                ctx.closePath();
                ctx.globalAlpha = 0.7;
                ctx.fill();
                ctx.globalAlpha = 1.0;
                ctx.stroke();

                ctx.globalCompositeOperation = "destination-over";
                ctx.fill();
                ctx.globalCompositeOperation = "source-over";

                if (mode === "symmetric_airfoil_fvm1") {
                    ctx.save();
                    ctx.strokeStyle = "rgba(0,0,0,0.4)";
                    ctx.setLineDash([3 * ctx.lineWidth, 3 * ctx.lineWidth]);

                    ctx.beginPath();
                    for (let x = 0; x < asymmetric_airfoil_geometry.nx; x++) {
                        let p = asymmetric_airfoil_geometry.grid_position(x, 0);
                        ctx.lineTo(p[0], p[1]);
                    }

                    ctx.stroke();
                    ctx.setLineDash([]);


                    ctx.restore();
                }


                ctx.fillStyle = "#333"

                ctx.lineWidth = 0.004 / zoom;


                if (has_aoa) {
                    ctx.save();
                    ctx.translate(0.5, 0);
                    ctx.rotate(angle);


                    ctx.strokeStyle = "#756117"
                    ctx.fillStyle = "rgba(0,0,0,0.2)"
                    ctx.beginPath();
                    ctx.arc(0, 0, 0.21, pi, pi - angle, angle > 0);
                    ctx.lineTo(0, 0);
                    ctx.fill();


                    ctx.strokeStyle = "#A38721"
                    ctx.strokeLine(-0.23, 0, 0, 0.0);


                    ctx.strokeStyle = "rgba(0,0,0,0.2)"
                    ctx.strokeLine(-0.5 * ca, -0.5 * sa, 0.5 * ca, 0.5 * sa);

                    ctx.strokeStyle = "#615012"
                    ctx.lineWidth *= 2;


                    ctx.beginPath();
                    ctx.arc(0, 0, 0.21, pi, pi - angle, angle > 0);
                    ctx.stroke();


                    ctx.fillStyle = "#333"
                    ctx.fillEllipse(0, 0, 0.008);

                    ctx.fillStyle = "#F0C529"
                    ctx.fillEllipse(0, 0, 0.003);

                    ctx.restore();

                }

                if (has_total_force) {

                    let f = [0, 0];

                    for (let x = 0; x < nx; x++) {
                        let p = state.solver.cell_pressure(x, 0);

                        let v = geometry.wall_vector(x);
                        f = vec_add(f, vec_scale(v, p));
                    }

                    f = [f[0] * cos(angle) + f[1] * sin(angle),
                    -f[0] * sin(angle) + f[1] * cos(angle)];


                    state.avg_force = vec_add(vec_scale(state.avg_force, pc), vec_scale(f, 1 - pc));

                    f = vec_scale(state.avg_force, total_force_scale);


                    ctx.save();
                    ctx.translate(0.5, 0);

                    if (mode === "symmetric_airfoil_fvm9") {

                        ctx.fillStyle = "#5BAFA2";
                        ctx.strokeStyle = "#2B524C";

                        let ll = vec_len(f);

                        let ss = min(1, 20 * ll);

                        ctx.arrow(0, 0, f[0], f[1], 0.015 * ss, 0.04 * ss, 0.05 * ss);
                        ctx.fill();
                        ctx.stroke();
                    } else {

                        let ss0 = min(1, 20 * abs(f[0]));
                        let ss1 = min(1, 20 * abs(f[1]));

                        ctx.rotate(angle);


                        ctx.fillStyle = "#84B26A";
                        ctx.strokeStyle = "#25321E";


                        ctx.arrow(0, 0, 0, f[1], 0.015 * ss1, 0.04 * ss1, 0.05 * ss1);
                        ctx.fill();
                        ctx.stroke();


                        ctx.fillStyle = "#AF4A4A";
                        ctx.strokeStyle = "#512222";


                        ctx.arrow(0, 0, f[0], 0, 0.015 * ss0, 0.04 * ss0, 0.05 * ss0);
                        ctx.fill();
                        ctx.stroke();

                    }
                    // console.log(state.avg_force[1]);

                    ctx.restore();
                }


                ctx.restore();



                ctx.fillStyle = "#333";
                // ctx.fillText((t1 - t0).toFixed(4), 600, 200);


                // ctx.fillText(`fx: ${(state.avg_force[0]).toFixed(4)}`, 150, 140);
                // ctx.fillText(`fy: ${(state.avg_force[1]).toFixed(4)}`, 150, 180);

                // ctx.fillText(`start its: ${state.start_iters}`, 150, 220);


                let ww = plot_data ? 0.07 : 0.1;
                ctx.feather(ceil(width * scale * (plot_data ? 0.7 : 1.0)), height * scale,
                    canvas.width * ww, canvas.width * ww,
                    canvas.width * ww, canvas.width * ww);

                if (has_plane) {

                    ctx.save();
                    ctx.translate(width * 0.1, height * 0.9);


                    ctx.save();

                    ctx.shadowColor = "rgba(0,0,0,1)";
                    ctx.shadowBlur = canvas.width * 0.05 * 0.5;
                    ctx.shadowOffsetY = -width * scale;
                    ctx.shadowOffsetX = width * scale;
                    ctx.globalCompositeOperation = "destination-out";


                    ctx.fillRect(-width * 1.23, width * 0.92, width * 0.4, width * 0.4);
                    ctx.restore();



                    ctx.globalCompositeOperation = "source-over";

                    let sc = 5.0;
                    ctx.scale(sc, -sc);
                    ctx.rotate(-angle);
                    ctx.lineWidth = 1.5 / sc;

                    ctx.save();
                    ctx.scale(width / 700, width / 700);

                    ctx.translate(0.4 * sc, -2.7 * sc);
                    draw_plane(ctx, t * 100.0, geometry);
                    ctx.restore();


                    ctx.restore();
                }

                if (has_velocity) {
                    ctx.save();
                    ctx.translate(width * (plot_data ? 0.35 : 0.5), height - font_size - (has_aoa ? font_size * 2.5 : 0));

                    draw_speed_scale(width * 0.3, height * 0.04);;
                    ctx.restore();
                }
                if (has_aoa) {

                    ctx.save();
                    ctx.translate(width * (plot_data ? 0.35 : 0.5), height - font_size);


                    let str = `angle of attack = ${angle < 0 ? "−" : ""}${(abs(angle) * 180 / pi).toFixed(2)}°`;

                    let w = ctx.measureText(str).width + font_size;

                    ctx.fillStyle = "rgba(238, 229, 197, 0.8)";

                    ctx.roundRect(-w / 2, -font_size * 1.25, w, font_size * 1.8, font_size * 0.4);
                    ctx.fill();

                    ctx.globalCompositeOperation = "source-over";
                    ctx.fillStyle = "#6f5c17";
                    ctx.fillText(str, 0, 0);
                    ctx.restore();
                }

                if (has_markers && !has_pressure_based_markers) {

                    ctx.save();
                    ctx.translate(width * 0.95 - 30, height - width * 0.05 - 30);
                    ctx.lineWidth = 1.5;
                    ctx.lineCap = "round";
                    ctx.lineJoin = "round"

                    ctx.save();
                    ctx.save();
                    ctx.fillStyle = "#CFB0B0";
                    ctx.strokeStyle = "#333333";

                    ctx.beginPath();
                    ctx.arc(17, 17, 16.25, 0, 6.283185307179586, false);
                    ctx.closePath();
                    ctx.save()

                    ctx.shadowColor = "rgba(0,0,0,0.5)";
                    ctx.shadowBlur = 10;
                    ctx.shadowOffsetY = 0;
                    ctx.shadowOffsetX = 0;
                    ctx.fill("evenodd");

                    ctx.restore();
                    ctx.stroke();
                    ctx.restore();

                    ctx.save();
                    ctx.fillStyle = "#000000";
                    ctx.strokeStyle = "rgba(0,0,0,0)";
                    ctx.beginPath();
                    ctx.arc(13.7692308, 7.07692308, 2.76923077, 0, 6.283185307179586, false);
                    ctx.closePath();
                    ctx.fill("evenodd");
                    ctx.stroke();
                    ctx.restore();
                    ctx.save();
                    ctx.fillStyle = "#E9E9E9";
                    ctx.strokeStyle = "#333333";

                    ctx.beginPath();
                    ctx.moveTo(12.3430277, 19.8462379);
                    ctx.lineTo(12.3430277, 17.2569382);
                    ctx.bezierCurveTo(12.3430277, 13.3644045, 12.3430277, 11.1129809, 12.3430277, 10.5026674);
                    ctx.bezierCurveTo(12.3430277, 9.58719707, 12.9190353, 9.00611923, 13.7781936, 9.00611923);
                    ctx.bezierCurveTo(14.6373519, 9.00611923, 15.2133595, 9.58719707, 15.2133595, 10.5026674);
                    ctx.bezierCurveTo(15.2133595, 11.1129809, 15.2133595, 12.6197263, 15.2133595, 15.0229034);
                    ctx.lineTo(15.2133595, 18.0522805);
                    ctx.bezierCurveTo(15.2133595, 16.6894975, 15.2133595, 15.6797052, 15.2133595, 15.0229034);
                    ctx.bezierCurveTo(15.2133595, 14.0377009, 15.6922879, 13.3413557, 16.6485254, 13.3413557);
                    ctx.bezierCurveTo(17.6047629, 13.3413557, 18.0836913, 14.0377009, 18.0836913, 15.0229034);
                    ctx.bezierCurveTo(18.0836913, 15.6797052, 18.0836913, 16.6894975, 18.0836913, 18.0522805);
                    ctx.bezierCurveTo(18.0836913, 16.8156914, 18.0836913, 15.9103791, 18.0836913, 15.3363435);
                    ctx.bezierCurveTo(18.0836913, 14.4752903, 18.6023698, 13.9009749, 19.5188572, 13.9009749);
                    ctx.bezierCurveTo(20.4353446, 13.9009749, 20.9540231, 14.4934112, 20.9540231, 15.5157393);
                    ctx.bezierCurveTo(20.9540231, 16.1972913, 20.9540231, 17.0428051, 20.9540231, 18.0522805);
                    ctx.bezierCurveTo(20.9540231, 17.2279438, 20.9540231, 16.5465523, 20.9540231, 16.008106);
                    ctx.bezierCurveTo(20.9540231, 15.2004366, 21.4901512, 14.6187606, 22.389189, 14.6187606);
                    ctx.bezierCurveTo(23.2882269, 14.6187606, 23.8243549, 15.2004366, 23.8243549, 16.008106);
                    ctx.bezierCurveTo(23.8243549, 16.5465523, 23.8243549, 17.2279438, 23.8243549, 18.0522805);
                    ctx.lineTo(23.8243549, 21.2719892);
                    ctx.bezierCurveTo(23.8243549, 23.0555087, 23.3536697, 24.3978822, 22.4122993, 25.2991097);
                    ctx.bezierCurveTo(22.4007441, 25.3320644, 22.389189, 27.2194234, 22.389189, 27.6982885);
                    ctx.bezierCurveTo(22.389189, 28.1771535, 21.99754, 28.6982885, 21.4915423, 28.6982885);
                    ctx.bezierCurveTo(20.9855447, 28.6982885, 15.2960674, 28.6982885, 14.7949288, 28.6982885);
                    ctx.bezierCurveTo(14.2937902, 28.6982885, 13.7781936, 28.1793112, 13.7781936, 27.6982885);
                    ctx.bezierCurveTo(13.7781936, 27.3776066, 13.7781936, 26.5998501, 13.7781936, 25.365019);
                    ctx.bezierCurveTo(12.9990748, 24.5828518, 12.0836464, 23.5057992, 11.0319084, 22.1338612);
                    ctx.bezierCurveTo(9.4543015, 20.0759541, 10.9390568, 16.7756801, 12.3430277, 15.9875157);
                    ctx.fill();
                    ctx.stroke();

                    ctx.restore();
                    ctx.restore();
                    ctx.restore();
                }

                if (plot_data) {
                    ctx.save();
                    ctx.translate(floor(width * 0.7), 0);


                    ctx.beginPath();
                    ctx.rect(0, 0, width, height);
                    ctx.clip();
                    ctx.clearRect(0, 0, width, height);


                    let n = plot_data.length;


                    let pad = width * 0.03;
                    let ww = width * 0.3 - 2 * pad;
                    let hh = height - 2 * pad;

                    ctx.translate(pad, pad);

                    let sx = ww / (plot_range[1] - plot_range[0])
                    let sy = hh / (plot_range[3] - plot_range[2])

                    let xx = angle * 180 / pi * sx;
                    let ff = state.avg_force[1];



                    ctx.translate(-plot_range[0] * sx, plot_range[3] * sy);

                    ctx.strokeStyle = "#444";
                    ctx.strokeLine(plot_range[1] * sx + pad, 0, plot_range[0] * sx - pad, 0);
                    ctx.strokeLine(0, -plot_range[3] * sy - pad, 0, -plot_range[2] * sy + pad);



                    ctx.lineWidth = width * 0.0025;
                    ctx.setLineDash([0.001, width * 0.006]);
                    ctx.strokeLine(xx, 0, xx, -ff * sy);
                    ctx.setLineDash([]);

                    ctx.strokeStyle = "#BB9C29";
                    ctx.fillStyle = "#BB9C29";
                    ctx.strokeLine(plot_range[1] * sx + pad, 0, plot_range[0] * sx - pad, 0);
                    ctx.fillEllipse(xx, 0, width * 0.005);

                    // ctx.fillText("angle", 0, 0)


                    ctx.lineWidth = width * 0.012;

                    ctx.strokeStyle = "#84B26A";

                    ctx.globalAlpha = 0.5;

                    ctx.beginPath();
                    ctx.lineTo(plot_data[0][0] * sx, -plot_data[0][1] * sy);
                    for (let i = 0; i < n; i++) {
                        let p = plot_data[i];
                        ctx.lineTo(p[0] * sx, -p[1] * sy);
                    }

                    ctx.stroke();
                    ctx.lineWidth = width * 0.004;
                    ctx.stroke();
                    ctx.globalAlpha = 1;

                    ctx.save()

                    ctx.feather(ceil(width * scale * 0.3 + 1), height * scale,
                        canvas.width * 0.06, canvas.width * 0.06,
                        canvas.width * 0.06, canvas.width * 0.06,
                        floor(width * scale * 0.7), 0);
                    ctx.restore();

                    ctx.fillStyle = "#84B26A";
                    ctx.strokeStyle = "#25321E";
                    ctx.lineWidth = width * 0.003;


                    ctx.beginPath();
                    ctx.ellipse(xx, -ff * sy, width * 0.007, width * 0.007, 0, 0, Math.PI * 2);

                    ctx.fill();
                    ctx.stroke();

                    ctx.restore();

                    ctx.strokeStyle = "#999";
                    ctx.lineWidth = 1.5;
                    ctx.setLineDash([3, 6]);
                    ctx.strokeLine(floor(width * 0.7), 0, floor(width * 0.7), height)
                    ctx.setLineDash([]);
                }

            } else if (mode.startsWith("fdm")) {

                if (!gl.has_float_ext) {

                    ctx.fillStyle = "#aa0000";
                    ctx.translate(width * 0.5, height * 0.5);
                    ctx.fillText("Unfortunately your device", 0, -font_size * 0.7);
                    ctx.fillText("doesn't support this feature.", 0, font_size * 0.7);
                    return;
                }

                const sim_dt = 0.002;
                let mu = pow(10, lerp(-4.5, -1.5, slider_args[0]));

                const iters = min(30, ceil(dt * 500));

                let FDM_mode = "split";
                let draw_offset = -0.01;

                let obstacle_size = [0.1, 0.2, 0.1 / FDM_height];

                let draw_velocity = true;
                let draw_scale = true;
                let draw_arrows = true;
                let arrow_color = [0.5, 0.5, 0.5, 0.5];
                let v_scale = 0.8;

                let sc = 0.65;
                let arrow_tx = 0.0;
                let arrow_ty = 0.0103;
                let arrow_scale = 0.008;

                if (mode === "fdm1") {
                    draw_velocity = false;
                    draw_scale = false;
                    arrow_color = [0, 0, 0, 0.8];
                } else if (mode === "fdm4") {
                    FDM_mode = "eddy";
                    draw_offset = 1 / 6;

                    sc = 0.4;
                    arrow_tx = 0.3;
                }
                else if (mode === "fdm5") {
                    FDM_mode = "obstacle";
                    arrow_tx = -0.003;
                }
                else if (mode === "fdm7") {
                    FDM_mode = "obstacle";
                    mu = 1e-6;
                } else if (mode === "fdm8") {
                    FDM_mode = "boundary";
                    mu = 1e-6;
                    draw_offset = 0.2;
                    draw_scale = false;
                    draw_arrows = false;
                } else if (mode === "fdm9" || mode === "fdm_hero") {
                    FDM_mode = "obstacle";
                    obstacle_size = [0.15, 0.15 + 0.08 * 2 / 3, 0.08];
                    v_scale = 0.4;
                    arrow_scale = 0.006;
                } else if (mode === "fdm10") {
                    FDM_mode = "layers";
                    draw_offset = 0.05;
                    arrow_tx = 0.05;
                }


                if (state === undefined) {
                    state = {};

                    state.gl_state = gl.create_FDM_state(FDM_mode);
                    state.t = 0;
                }


                for (let i = 0; i < iters; i++) {
                    state.t += sim_dt;
                    gl.update_FDM_state(state.gl_state, sim_dt, state.t, mu, 10, obstacle_size);
                }

                let fdm_aspect = FDM_width / FDM_height;
                let aspect = width / height;

                let fdm_map = [aspect / fdm_aspect, 1, draw_offset, 0];

                gl.begin(width, height);

                if (draw_velocity)
                    gl.draw_FDM_velocity(state.gl_state, fdm_map, v_scale);


                let world_map = [sc, sc, arrow_tx, arrow_ty];
                let sampling_map = [sc, sc * fdm_aspect, arrow_tx, arrow_ty * fdm_aspect];


                let arrow_mvp = scale_mat4([fdm_aspect, fdm_aspect * aspect, 1]);
                arrow_mvp = mat4_mul(translation_mat4([-1 - draw_offset * fdm_aspect, -1 + arrow_ty, 0]), arrow_mvp);

                if (draw_arrows)
                    gl.draw_texture_velocity_arrows(state.gl_state, arrow_mvp, world_map, sampling_map, arrow_scale, [3.0 * width, 3.0 * width], arrow_color);



                if (FDM_mode === "boundary") {
                    ctx.translate(0, -height * 0.1);
                }

                ctx.drawImage(gl.finish(), 0, 0, width, height);


                if (FDM_mode === "obstacle") {
                    ctx.save();

                    ctx.scale(height, height);

                    let ratio = FDM_width / FDM_height;

                    ctx.fillStyle = "#888";

                    ctx.strokeStyle = "#222";
                    ctx.lineWidth = 1 / height;

                    let h = max(1.0 / FDM_height, obstacle_size[2] * 2);
                    ctx.rect(-draw_offset * ratio + obstacle_size[0] * ratio, 0.5 - h / 2, (obstacle_size[1] - obstacle_size[0]) * ratio, h);

                    ctx.fill();
                    ctx.stroke();

                    if (mode === "fdm7") {
                        let s = 0.06;
                        ctx.lineWidth = 2 / height;

                        ctx.beginPath();
                        ctx.rect(-draw_offset * ratio + 0.102 * ratio, 0.483, s * ratio, s * 0.3);

                        ctx.strokeStyle = "#000";
                        ctx.stroke();

                        let ss = 0.014;
                        ctx.strokeStyle = "#fff";
                        ctx.lineCap = "butt";
                        ctx.lineDashOffset = ss * 0.5;
                        ctx.setLineDash([ss, ss]);
                        ctx.stroke();

                        ctx.setLineDash([]);
                    }

                    ctx.restore();
                } else if (FDM_mode === "boundary") {

                    ctx.fillStyle = "#777";
                    // ctx.strokeStyle = "#444";
                    ctx.beginPath();
                    ctx.rect(-10, height * 0.98, width + 20, height);
                    ctx.fill();
                    ctx.stroke();
                }




                ctx.feather(width * scale, height * scale,
                    canvas.height * 0.1, canvas.height * 0.1,
                    canvas.height * 0.1, canvas.height * 0.1);

                if (draw_scale) {
                    ctx.save()
                    ctx.translate(width * 0.5, height * 0.87);
                    draw_speed_scale(width * 0.3, height * 0.04);;
                    ctx.restore();
                }


                if (args.has_reset) {
                    ctx.save();
                    ctx.resetTransform();

                    ctx.shadowColor = "rgba(0,0,0,1.0)";
                    ctx.shadowBlur = canvas.width * 0.05 * 0.4;
                    ctx.shadowOffsetY = -60 * scale;
                    ctx.shadowOffsetX = 60 * scale;
                    ctx.globalCompositeOperation = "destination-out";


                    ctx.fillRect(-200, height * scale, 200, 200);
                    ctx.restore();
                }




            } else if (mode.startsWith("boundary")) {



                const nx = boundary_nx;
                const ny = boundary_ny;

                function ci(x, y) {
                    return y * nx + x;
                }

                const mu = 0.002;

                let show_border = true;
                let show_profiles = true;
                let gradp = 0.0;

                if (mode === "boundary1") {
                    show_border = false;
                    show_profiles = false;
                } else if (mode === "boundary2") {
                    show_profiles = false;
                } else if (mode === "boundary4") {
                    gradp = (slider_args[0] - 0.5) * 2 * 0.14;
                }

                const DX = 0.015;
                const DY = 0.015;
                const sim_dt = 0.005;

                const iters = min(12, ceil(dt * 300));

                if (state === undefined) {
                    state = {};

                    let u = new Float64Array(nx * ny);
                    let v = new Float64Array(nx * ny);

                    let utmp = new Float64Array(nx * ny);
                    let vtmp = new Float64Array(nx * ny);

                    state.u = u;
                    state.v = v;

                    state.utmp = utmp;
                    state.vtmp = vtmp;


                    for (let y = 2; y < ny; y++) {
                        for (let x = 0; x < nx; x++) {
                            u[ci(x, y)] = 1;
                            utmp[ci(x, y)] = 1;
                        }
                    }

                    state.tex_data = new Uint8Array(nx * ny);
                }



                /* grid and neighbor indexing
            
                          
                                 N2
                                 ^
                           G2--------G3
                            |         |
                      N3 <- |         | -> N1
                            |         |
                           G0--------G1
                                 v
                                 N0
            
                    */

                let u = state.u;
                let v = state.v;

                let utmp = state.utmp;
                let vtmp = state.vtmp;

                let t0 = performance.now();

                for (let i = 0; i < iters; i++) {

                    for (let y = 2; y < ny - 2; y++) {
                        for (let x = 2; x < nx - 2; x++) {

                            let ip = ci(x, y);

                            let uc = u[ip];
                            let vc = v[ip];

                            let u0 = u[ip - nx];
                            let u1 = u[ip + 1];
                            let u2 = u[ip + nx];
                            let u3 = u[ip - 1];

                            let ddu = (u3 - 2.0 * uc + u1) / (DX * DX) +
                                (u0 - 2.0 * uc + u2) / (DY * DY);


                            // upwind

                            let duu = (max(0.0, uc) * (uc - u3) + min(0.0, uc) * (u1 - uc)) / DX;
                            let dvu = (max(0.0, vc) * (uc - u0) + min(0.0, vc) * (u2 - uc)) / DY;

                            let rhsu = (ddu) * (mu / rho);

                            rhsu -= duu + dvu - gradp;

                            utmp[ip] = uc + rhsu * sim_dt;
                        }
                    }

                    for (let x = 0; x < nx; x++) {
                        utmp[ci(x, ny - 2)] = utmp[ci(x, ny - 3)];
                        utmp[ci(x, ny - 1)] = utmp[ci(x, ny - 3)];
                    }

                    let t = u;
                    u = utmp;
                    utmp = t;

                    for (let y = 2; y < ny - 2; y++) {
                        for (let x = 2; x < nx - 2; x++) {

                            let ip = ci(x, y);

                            let uc = u[ip];

                            let u1 = u[ip + 1];
                            let u3 = u[ip - 1];
                            let v0 = v[ip - nx];

                            let duu = (max(0.0, uc) * (uc - u3) + min(0.0, uc) * (u1 - uc));
                            let div = (-duu) + v0;

                            v[ip] = div;
                        }
                    }
                }
                let t1 = performance.now();


                // render

                {
                    let d = state.tex_data;
                    for (let i = 0; i < nx * ny; i++) {
                        d[i] = min(1, abs(u[i])) * 200;
                    }

                    gl.update_boundary_texture(d);
                }


                gl.begin(nx * 2, ny * 2);

                gl.draw_full("velocity_boundary", { aspect: 1 });

                let ss = 4.5 * width / 704;

                ctx.save();
                ctx.translate(0, height);

                if (mode === "boundary4")
                    ctx.translate(0, round(-height * 0.5));

                ctx.scale(ss, -ss);
                ctx.translate(0, 8);


                ctx.drawImage(gl.finish(), 0, 0, nx, ny);



                ctx.lineWidth = 0.5;


                if (show_border) {

                    // ctx.strokeStyle = ""
                    ctx.strokeStyle = "#1F5699";
                    ctx.globalAlpha = 0.4;
                    ctx.setLineDash([2, 2]);
                    ctx.beginPath();

                    let y = 0;

                    for (let x = 0; x < nx; x++) {

                        let max = u[ci(x, ny - 4)];
                        let yy = y;

                        let prev_uu = u[ci(x, y - 1)]
                        for (; y < ny; y++) {
                            let uu = u[ci(x, y)];
                            if (uu >= 0.99 * max) {

                                yy = y + (0.99 * max - prev_uu) / (uu - prev_uu);
                                break;
                            }
                            prev_uu = uu;
                        }


                        ctx.lineTo(x, yy);
                    }

                    ctx.stroke();
                    ctx.setLineDash([]);
                }


                if (show_profiles) {
                    ctx.strokeStyle = "#F8F8F8";
                    ctx.setLineDash([]);

                    for (let i = 0; i < 11; i++) {

                        let x = 8 + i * 13;

                        ctx.globalAlpha = 0.2;

                        ctx.strokeLine(x, 1, x, 200);

                        {
                            let tan = u[ci(x, 2)];
                            let a = atan2(tan * 10, 1);

                            let l = 8 + cos(abs(a)) * 8;

                            ctx.globalAlpha = 1;
                            ctx.setLineDash([0.01, 1]);
                            ctx.strokeLine(x + sin(a) * l, 1 + cos(a) * l, x, 1);

                            ctx.setLineDash([]);
                        }

                        ctx.globalAlpha = 1;
                        ctx.beginPath();
                        for (let y = 1; y < ny; y++) {
                            let uu = u[ci(x, y)];
                            ctx.lineTo(x + uu * 10, y);
                        }
                        ctx.stroke();

                        ctx.globalAlpha = 0.9;
                        for (let y = 3; y < ny; y += 3) {
                            let uu = u[ci(x, y)];
                            let vv = v[ci(x, y)];

                            let sc = smooth_step(-0.3, 0.3, uu) * 2.0 - 1;

                            ctx.strokeLine(x, y, x + uu * 10, y + vv);
                            ctx.strokeLine(x + uu * 10, y + vv, x + uu * 10 - sc * 1.5, y + vv - sc * 0.5);
                            ctx.strokeLine(x + uu * 10, y + vv, x + uu * 10 - sc * 1.5, y + vv + sc * 0.5);
                        }
                    }
                }

                ctx.globalAlpha = 1.0;

                ctx.fillStyle = "#777";
                ctx.strokeStyle = "#333";
                ctx.lineWidth = 1.5 / ss;
                ctx.fillRect(0, -10, 200, 10.7);
                ctx.strokeRect(0, -10, 200, 10.7);

                ctx.restore();


                if (mode === "boundary4") {

                    let hh = round(height * 0.5);
                    let hh2 = round(height * 0.48);
                    ctx.feather(width * scale, ceil(hh2 * scale),
                        canvas.width * 0.06, canvas.width * 0.06,
                        canvas.width * 0.06, canvas.width * 0.06);

                    ctx.save();


                    ctx.translate(0, hh);
                    ctx.beginPath();
                    ctx.rect(0, 0, 1000, height);
                    ctx.clip();
                    ctx.clearRect(0, 0, 1000, hh2);

                    ctx.translate(0, hh2);

                    ctx.scale(ss, -ss);
                    ctx.translate(0, 8);

                    ctx.lineWidth = 0.01;
                    let w = 157;
                    let grd = ctx.createLinearGradient(0, 0, w, 0);

                    let c0 = [0.882, 0.173, 0.067, 0.0];
                    let c1 = [0.157, 0.522, 0.784, 0.0];

                    let n = 30;

                    for (let i = 0; i <= n; i++) {

                        if (i == n / 2) {
                            grd.addColorStop(0.5, rgba_color_string(gradp < 0 ? c1 : c0));
                            grd.addColorStop(0.5, rgba_color_string(gradp < 0 ? c0 : c1));
                            continue;
                        }
                        let t = i / n;
                        let gt = t;



                        let p = (t - 0.5) * gradp * 13.0;
                        let a = abs(p);
                        a = a * a * (3.0 - 2.0 * a);

                        let c = p < 0 ? c0.slice() : c1.slice();
                        c[3] = a;

                        grd.addColorStop(gt, rgba_color_string(c));
                    }

                    ctx.fillStyle = grd;
                    ctx.fillRect(0, 0, w, 110);
                    ctx.lineWidth = 2 / ss;

                    c0[3] = 0.2;
                    ctx.strokeStyle = rgba_color_string(c0);
                    for (let i = 0; i < 10; i++) {
                        let x = -2.0 * (0.5 + i) / gradp;
                        ctx.strokeLine(w / 2 + x, 0, w / 2 + x, 200);
                    }


                    c1[3] = 0.2;
                    ctx.strokeStyle = rgba_color_string(c1);
                    for (let i = 0; i < 10; i++) {
                        let x = 2.0 * (0.5 + i) / gradp;
                        ctx.strokeLine(w / 2 + x, 0, w / 2 + x, 200);
                    }


                    ctx.fillStyle = "#777";
                    ctx.strokeStyle = "#333";
                    ctx.lineWidth = 1.5 / ss;
                    ctx.fillRect(0, -10, 200, 11);
                    ctx.strokeRect(0, -10, 200, 11);


                    ctx.feather(width * scale, ceil(hh2 * scale),
                        canvas.width * 0.06, canvas.width * 0.06,
                        canvas.width * 0.06, canvas.width * 0.06, 0, ceil(hh * scale));

                    ctx.restore();

                    ctx.setLineDash([1, 5]);
                    ctx.lineWidth = 1.5;
                    ctx.strokeStyle = "#aaa";
                    ctx.strokeLine(width * 0.05, hh, width * 0.95, hh);
                    ctx.setLineDash([]);


                } else {
                    ctx.feather(width * scale, height * scale,
                        canvas.width * 0.06, canvas.width * 0.06,
                        canvas.width * 0.06, canvas.width * 0.06);


                    ctx.translate(width * 0.5, height * 0.9);
                    draw_speed_scale(width * 0.3, width * 0.02);
                }

            } else if (mode === "lennardjones") {

                const R = 0.03;

                const v0 = 1000;
                const ratio = 3;

                const dt_scale = 1.5e-4;

                const fade_duration = 0.15;

                function calc_velocity() {

                    let p0x = state.p0[0];
                    let p0y = state.p0[1];

                    let p1x = state.p1[0];
                    let p1y = state.p1[1];

                    let dx = p0x - p1x;
                    let dy = p0y - p1y;

                    let a = 1 - ratio * ratio;
                    let b = 2 * dx;
                    let c = dy * dy + dx * dx;

                    let d = b * b - 4 * a * c;

                    let ta = (-b + sqrt(d)) / (2 * a);
                    let tb = (-b - sqrt(d)) / (2 * a);

                    let t = ta < 0 ? tb : tb < 0 ? ta : min(ta, tb);

                    let v1x = v0 * (dx + t) / (t);
                    let v1y = v0 * (dy) / (t);


                    return [v1x, v1y];
                }

                function clear_state() {
                    state.p0 = [0.4, 0.25];
                    state.v0 = [v0, 0];
                    state.v1 = [ratio * v0, 0];
                    state.p1 = draggables[0].pos;

                    state.line_alpha = 0;
                    state.other_alpha = 0.2;

                    state.a0 = random() * pi;
                    state.w0 = 20000;
                    state.a1 = random() * pi;
                    state.w1 = -30000;

                    state.fade_a = 1;

                    state.state = 0;
                }

                if (state === undefined) {
                    state = {};
                    clear_state();
                }

                state.fade_a = saturate(state.fade_a + dt / fade_duration);


                if (state.state == 0) {
                    if (state.fade_a == 1.0)
                        self.set_paused(false);

                    if (dragged_index != -1) {
                        state.state = 1;
                    }
                } else {
                    state.other_alpha = saturate(state.other_alpha + dt / fade_duration);
                }

                if (state.state == 1) {
                    state.line_alpha = saturate(state.line_alpha + dt / fade_duration);

                    state.v1 = calc_velocity();

                    if (dragged_index == -1) {
                        state.state = 2;
                    } else {
                        state.p1 = draggables[0].pos;
                    }
                }

                if (state.state == 2) {
                    state.line_alpha = saturate(state.line_alpha - dt / fade_duration);

                    const eps = 0.0001;
                    const d0 = 1.21 * 2 * R;
                    const d0_6 = d0 * d0 * d0 * d0 * d0 * d0;

                    const iters = 512;

                    dt = dt * dt_scale / iters;

                    for (let i = 0; i < iters; i++) {

                        let dir = vec_sub(state.p1, state.p0);
                        let d_sq = vec_len_sq(dir);
                        let d = sqrt(d_sq);
                        let d_6 = d_sq * d_sq * d_sq;

                        dir = vec_scale(dir, 1 / d);

                        let f = 48 * eps * (d0_6 * d0_6 / (d_6 * d_6 * d) - 0.5 * d0_6 / (d_6 * d));

                        state.v0 = vec_add(state.v0, vec_scale(dir, -f));
                        state.v1 = vec_add(state.v1, vec_scale(dir, f));
                        state.p0 = vec_add(state.p0, vec_scale(state.v0, dt));
                        state.p1 = vec_add(state.p1, vec_scale(state.v1, dt));


                        state.a0 += state.w0 * dt;
                        state.a1 += state.w1 * dt;
                    }

                    if (state.p1[0] < -0.1 || state.p1[0] > 1.1 || state.p1[1] < -0.1 || state.p1[1] > 0.7) {
                        clear_state();
                        state.fade_a = 0;
                    }

                }

                function make_gradient(color, x, y) {
                    color = color.slice();

                    let grad = ctx.createRadialGradient(x, y, 0, x, y, R);

                    for (let i = 0; i < 16; i++) {
                        let t = i / 15;
                        let a = (smooth_step(0.0, 1.0, t));
                        a = 1.0 - a * a;
                        a *= 0.9;

                        color[3] = a;
                        grad.addColorStop(t, rgba_color_string(color));
                    }
                    return grad;
                }


                let color0 = rgba_hex_color(0x0B89DB);
                let color1 = rgba_hex_color(0xEE9842);

                let overlap = 0.4;

                ctx.save();
                ctx.scale(width, width);

                if (state.line_alpha) {

                    let ss = 0.0005;

                    ctx.lineWidth = R * 0.2;
                    ctx.lineCap = "round";
                    ctx.setLineDash([R * 0.001, R * 0.4])
                    ctx.globalAlpha = 0.2 * smooth_step(0, 1, state.line_alpha);

                    ctx.strokeStyle = rgba_color_string(color0);

                    ctx.strokeLine(state.p0[0],
                        state.p0[1],
                        state.p0[0] + state.v0[0] * ss,
                        state.p0[1] + state.v0[1] * ss);

                    ctx.strokeStyle = rgba_color_string(color1);

                    ctx.strokeLine(state.p1[0],
                        state.p1[1],
                        state.p1[0] + state.v1[0] * ss,
                        state.p1[1] + state.v1[1] * ss);

                    ctx.globalAlpha = 1;
                }

                ctx.save();

                let color = vec_lerp(color0, [1, 1, 1, 1], 1.0 - state.other_alpha);

                ctx.translate(state.p0[0], state.p0[1]);
                ctx.rotate(state.a0);
                ctx.fillStyle = make_gradient(color, -R * overlap, 0);
                ctx.fillEllipse(-R * overlap, 0, R);
                ctx.fillStyle = make_gradient(color, R * overlap, 0);
                ctx.fillEllipse(R * overlap, 0, R);

                ctx.restore();

                ctx.save();

                ctx.translate(state.p1[0], state.p1[1]);
                ctx.rotate(state.a1);
                ctx.fillStyle = make_gradient(color1, -R * overlap, 0);
                ctx.fillEllipse(-R * overlap, 0, R);
                ctx.fillStyle = make_gradient(color1, R * overlap, 0);
                ctx.fillEllipse(R * overlap, 0, R);
                ctx.restore();


                ctx.feather(width * scale, height * scale,
                    canvas.width * 0.1, canvas.width * 0.1,
                    canvas.width * 0.1, canvas.width * 0.1);

                let dash_n = 30;
                let dash_l = draggables[0].size * pi / dash_n;

                ctx.globalAlpha = 1.0 - state.other_alpha;
                ctx.lineCap = "butt";
                ctx.lineWidth = 2 / width;
                ctx.setLineDash([dash_l, dash_l]);
                ctx.strokeStyle = "rgba(0,0,0,0.5)"
                ctx.strokeEllipse(draggables[0].pos[0], draggables[0].pos[1], draggables[0].size);

                if (state.fade_a < 1) {
                    ctx.globalCompositeOperation = "destination-out";
                    ctx.globalAlpha = 1.0 - state.fade_a;
                    ctx.fillStyle = "#fff";
                    ctx.fillRect(0, 0, 1, 1);
                }

                ctx.restore();

            }




            /* Helpers */


            function arrow_rot_to_dir(dir) {
                let eps = 0.00001;
                let axis = vec_cross([0, eps, 1 - eps * eps], dir);

                let c = dir[2];
                let s = vec_len(axis);

                let x = axis[0] / s;
                let y = axis[1] / s;
                let z = axis[2] / s;

                return [
                    x * x * (1 - c) + c,
                    x * y * (1 - c) - z * s,
                    x * z * (1 - c) + y * s,

                    y * x * (1 - c) + z * s,
                    y * y * (1 - c) + c,
                    y * z * (1 - c) - x * s,

                    z * x * (1 - c) - y * s,
                    z * y * (1 - c) + x * s,
                    z * z * (1 - c) + c,
                ];
            }



            function draw_speed_scale(w, h) {

                let grd = ctx.createLinearGradient(-w * 0.5, 0, w * 0.5, 0);

                let n = velocity_lut.length;

                for (let i = 0; i < n; i++) {
                    let t = i / (n - 1);

                    let c = vec_scale(velocity_lut[i], 1 / 255);

                    grd.addColorStop(t, rgba_color_string(c));
                }

                ctx.fillStyle = grd;

                ctx.lineWidth = 1.5;
                ctx.strokeStyle = "#777";
                ctx.globalCompositeOperation = "source-over";
                ctx.roundRect(-w * 0.5, 0, w, h, h * 0.25);
                ctx.fill();
                ctx.stroke();
            }


        }

        if (args.animated)
            this.set_paused(false);

        if (args.has_text)
            document.fonts.load("10px IBM Plex Sans").then(function () { request_repaint(true); });

        window.addEventListener("resize", this.on_resize, true);
        window.addEventListener("load", this.on_resize, true);

        this.on_resize();
    }


    document.addEventListener("DOMContentLoaded", function (event) {

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


        let switches = document.getElementsByClassName("unit_switch");
        for (let sw of switches) {

            sw.addEventListener('click', function (event) {
                event.preventDefault();
                switch_units();
            });
        }



        function make_drawer(name, args = {}, slider_count = 0, slider_values = [0.5, 0.5, 0.5]) {
            let ret = {};

            let drawer_container = document.getElementById(name);
            let drawer = new Drawer(drawer_container, name, args);
            let sliders = [];

            for (let i = 0; i < slider_count; i++) {
                let slider = new Slider(document.getElementById(name + "_sl" + i), function (x) {
                    drawer.set_slider_arg(i, x);
                }, undefined, slider_values[i]);

                sliders.push(slider);
            }

            drawer.set_sliders(sliders, slider_values);

            let d = {};
            d.drawer = drawer;
            d.sliders = sliders;

            drawers_map[name] = d;

            return ret;
        }

        make_drawer("grass1", { simulated: true, two_axis: { vertical_limits: [-pi / 2, 0], angles: [0.4, -1] }, aspect: 1 }, 1);
        make_drawer("grass2", { simulated: true, aspect: 1 }, 1);
        make_drawer("grass2a", { simulated: true, aspect: 1 }, 1);
        make_drawer("grass3", { simulated: true, aspect: 1 }, 1);
        make_drawer("grass4", { simulated: true, aspect: 1 }, 1);
        make_drawer("grass5", { simulated: true, aspect: 1 }, 2);

        make_drawer("particles1", { simulated: true, has_arcball: true }, 1);
        make_drawer("particles2", { simulated: true, has_arcball: true }, 1);
        make_drawer("particles3", { simulated: true, has_arcball: true }, 2, [0.5, 0.3]);
        make_drawer("particles4", { simulated: true, has_arcball: true }, 2);
        make_drawer("particles5", { simulated: true, has_arcball: true }, 3, [0.5, 0, 0.5]);

        make_drawer("particles8", { simulated: true, has_arcball: true }, 1);
        make_drawer("particles9", { simulated: true, has_arcball: true }, 2);
        make_drawer("particles10", { simulated: true, has_arcball: true, has_reset: true, matrix: ident_mat3 }, 1, [0]);
        make_drawer("particles11", { simulated: true, has_arcball: true, has_reset: true, matrix: ident_mat3 }, 2, [0]);

        make_drawer("particles12", { simulated: true, has_arcball: true }, 1);
        make_drawer("particles14", { simulated: true, has_arcball: true, has_reset: true, matrix: ident_mat3 }, 1, [0]);


        make_drawer("vehicle1", { simulated: true, has_reset: true }, 1);
        make_drawer("vehicle2", { simulated: true, has_reset: true }, 1);
        make_drawer("vehicle2a", { simulated: true, has_reset: true }, 1);
        make_drawer("vehicle3", { simulated: true, has_reset: true }, 1);
        make_drawer("vehicle4", { simulated: true }, 1);
        make_drawer("vehicle5", { simulated: true }, 1);
        make_drawer("vehicle6", { simulated: true }, 0);


        make_drawer("parcels_crossing", {}, 1, [0]);

        make_drawer("bottle", { simulated: true, has_reset: true }, 1, [0]);

        make_drawer("laminar_turb_comparison", {}, 0);

        make_drawer("vector_average", { has_arcball: true, aspect: 1 }, 0);


        make_drawer("fdm1", { simulated: true, has_reset: true }, 1, [0.8]);
        make_drawer("fdm2", { simulated: true, has_reset: true }, 1, [0.8]);
        make_drawer("fdm3", { simulated: true, has_reset: true }, 1, [0.7]);
        make_drawer("fdm4", { simulated: true, has_reset: true }, 1);
        make_drawer("fdm5", { simulated: true, has_reset: true }, 1);
        make_drawer("fdm7", { simulated: true });
        make_drawer("fdm8", { simulated: true });
        make_drawer("fdm9", { simulated: true, has_reset: true }, 1);
        make_drawer("fdm10", { simulated: true, has_reset: true }, 1, [0.7]);
        make_drawer("fdm_hero", { simulated: true, has_reset: true }, 1, [0.1]);

        make_drawer("boundary1", { simulated: true }, 0);
        make_drawer("boundary2", { simulated: true }, 0);
        make_drawer("boundary3", { simulated: true }, 0);
        make_drawer("boundary4", { simulated: true }, 1, [0.7]);


        make_drawer("airfoil_fvm1", { simulated: true, store_last_click: true }, 0);
        make_drawer("airfoil_fvm1a", { simulated: true, store_last_click: true }, 0);
        make_drawer("airfoil_fvm2", { simulated: true, store_last_click: true }, 1, [4 / 22]);
        make_drawer("airfoil_fvm3", { simulated: true, store_last_click: true }, 1, [0]);
        make_drawer("airfoil_fvm4", { simulated: true, store_last_click: true }, 1, [0]);

        make_drawer("plate_fvm1", { simulated: true, store_last_click: true }, 1, [0]);
        make_drawer("hero_fvm", { simulated: true, store_last_click: true }, 1, [0]);



        make_drawer("symmetric_airfoil_fvm1", { simulated: true, store_last_click: true }, 0);
        make_drawer("symmetric_airfoil_fvm3", { simulated: true, store_last_click: true }, 0);
        make_drawer("symmetric_airfoil_fvm4", { simulated: true, store_last_click: true }, 1);
        make_drawer("symmetric_airfoil_fvm5", { simulated: true, store_last_click: true }, 2);
        make_drawer("symmetric_airfoil_fvm5a", { simulated: true, store_last_click: true }, 0);
        make_drawer("symmetric_airfoil_fvm6", { simulated: true, store_last_click: true }, 1);
        make_drawer("symmetric_airfoil_fvm7", { simulated: true, store_last_click: true }, 1);
        make_drawer("symmetric_airfoil_fvm9", { simulated: true, store_last_click: true }, 0);
        make_drawer("symmetric_airfoil_fvm9a", { simulated: true, store_last_click: true }, 0);
        make_drawer("symmetric_airfoil_fvm10", { simulated: true, store_last_click: true }, 0);
        make_drawer("symmetric_airfoil_fvm11", { simulated: true, store_last_click: true }, 1, [0]);
        make_drawer("symmetric_airfoil_fvm12", { simulated: true, store_last_click: true }, 1, [0]);


        make_drawer("symmetric_airfoil_fvm20", { simulated: true, store_last_click: true }, 1);
        make_drawer("symmetric_airfoil_fvm21", { simulated: true, store_last_click: true }, 1);
        make_drawer("symmetric_airfoil_fvm22", { simulated: true, store_last_click: true }, 1);

        make_drawer("symmetric_airfoil_fvm23", { simulated: true, store_last_click: true }, 1, [0]);
        make_drawer("symmetric_airfoil_fvm24", { simulated: true, store_last_click: true }, 1, [1]);
        make_drawer("symmetric_airfoil_fvm24a", { simulated: true, store_last_click: true }, 1, [0]);
        make_drawer("symmetric_airfoil_fvm25", { simulated: true, store_last_click: true });


        make_drawer("lennardjones", {
            simulated: true, has_reset: true, draggables: [
                {
                    pos: [0.65, 0.35],
                    size: 0.05,
                    limiter: function (pos) {
                        let c0 = [0.4, 0.25];
                        let dir = vec_sub(pos, c0);
                        let d = vec_len(dir);
                        let limit = 0.1;
                        if (d < limit) {
                            pos = vec_add(c0, vec_scale(dir, limit / d));
                            if (d < 1e-9) {
                                pos = [c[0], c[1] + limit];
                            }
                        }

                        return pos;
                    }
                }]
        }, 0);


        let pressure_draggable_size = coarse_pointer ? 0.035 : 0.026;
        let pressure_draggables = [
            { pos: [0.5, 0.5], size: pressure_draggable_size },
            { pos: [0.7, 0.3], size: pressure_draggable_size },
            { pos: [0.2, 0.3], size: pressure_draggable_size },
            { pos: [0.3, 0.2], size: pressure_draggable_size },
        ];

        make_drawer("pressure_manual1", { simulated: true, draggables: pressure_draggables }, 0);
        make_drawer("pressure_manual2", { simulated: true, draggables: pressure_draggables }, 0);
        make_drawer("pressure_manual2a", { simulated: true, draggables: pressure_draggables }, 0);

        make_drawer("pressure_manual3", { simulated: true, draggables: pressure_draggables }, 0);
        make_drawer("pressure_manual4", { simulated: true, draggables: pressure_draggables }, 0);
        make_drawer("pressure_manual5", { simulated: true, draggables: pressure_draggables }, 0);
        make_drawer("pressure_manual6", { simulated: true, draggables: pressure_draggables }, 1);
        make_drawer("pressure_manual7", { simulated: true, draggables: pressure_draggables }, 1);

        make_drawer("landscape", {
            simulated: true, two_axis: {
                horizontal_limits: [-pi / 3, pi / 3],
                vertical_limits: [-pi, 0],
                angles: [0.4, -1.1],
            }, locations: pressure_draggables
        }, 1);

        let balls_two_axis = {
            horizontal_limits: [-pi / 5, pi / 5],
            vertical_limits: [-pi / 2, 0],
            angles: [0.4, -1.1],
        };
        make_drawer("balls1", {
            simulated: true,
            has_reset: true,
            two_axis: balls_two_axis
        }, 1);

        make_drawer("balls2", {
            simulated: true,
            has_reset: true,
            reset_sliders: true,
            two_axis: balls_two_axis
        }, 1);

        make_drawer("balls3", {
            simulated: true,
            has_reset: true,
            reset_sliders: true,
            two_axis: balls_two_axis
        }, 1);


        let grads = document.getElementsByClassName("speed_gradient");
        for (let span of grads) {
            let str = span.innerText;
            let n = str.length;
            span.innerText = "";

            let cn = velocity_lut.length;

            for (var i = 0; i < n; i++) {
                let tt = i / (n - 1) * (cn - 1);
                let i0 = floor(tt);
                let t = tt - i0;

                let i1 = min(i0 + 1, cn - 1);
                let c = vec_lerp(velocity_lut[i0], velocity_lut[i1], t);
                c = vec_scale(c, 1 / 255);
                c = vec_lerp(c, [0.5, 0.5, 0.5, 1.0], 0.1);
                let letter = document.createElement("span");
                letter.style.color = rgba_color_string(c);
                letter.innerText = str.charAt(i);
                span.appendChild(letter);
            }
        }


        let c_grads = document.getElementsByClassName("gradient_word");
        for (let span of c_grads) {
            let str = span.innerText;
            let n = str.length;
            let c0 = rgba_hex_color(parseInt(span.dataset.color0, 16));
            let c1 = rgba_hex_color(parseInt(span.dataset.color1, 16));
            let c2;

            if (span.dataset.color2)
                c2 = rgba_hex_color(parseInt(span.dataset.color2, 16));

            function color(t) {
                if (!c2)
                    return vec_lerp(c0, c1, t);

                return t < 0.5 ? vec_lerp(c0, c1, t * 2) : vec_lerp(c1, c2, 2 * t - 1);
            }
            span.innerText = ""

            for (var i = 0; i < n; i++) {
                let letter = document.createElement("span");
                letter.style.color = rgba_color_string(color(i / (n - 1)));
                letter.innerText = str.charAt(i);
                span.appendChild(letter);
            }

        }

        if ("IntersectionObserver" in window) {

            let active_containers = [];

            window.addEventListener("scroll", (event) => {

                if (active_containers.length == 0)
                    return;

                let best_entry;
                let best_score = -1;

                if (active_containers.length > 1) {

                    for (let container of active_containers) {
                        let rect = container.getBoundingClientRect();

                        let wh = window.innerHeight || document.documentElement.clientHeight;

                        let h = rect.height;
                        let h0 = h;

                        if (rect.top < 0)
                            h += rect.top;

                        if (rect.bottom > wh)
                            h += wh - rect.bottom;

                        let score = max(0, h) / h0;

                        if (score > best_score) {
                            best_entry = container;
                            best_score = score;
                        }

                        container.drawer.set_active(false);
                    }
                } else {
                    best_entry = active_containers[0];
                }

                best_entry.drawer.set_active(true);
            });

            const observer = new IntersectionObserver(entries => {
                entries.forEach(entry => {
                    active_containers = active_containers.filter(item => item !== entry.target)
                    entry.target.drawer.set_visible(entry.isIntersecting);

                    if (entry.isIntersecting)
                        active_containers.push(entry.target);
                });

            }, { rootMargin: "300px" })

            all_containers.forEach(container => observer.observe(container));


        } else {
            all_containers.forEach(container => container.drawer.set_visible(true));
        }


    });
})();

function global_animate(animate) {

    for (let i = 0; i < animated_drawers.length; i++) {
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
}

function draw_plane(ctx, rot, geometry, fade = false) {

    ctx.save();

    let sc = 0.04;
    ctx.scale(sc, -sc);
    ctx.lineWidth *= 1 / sc;
    ctx.translate(-300, -492);



    ctx.strokeStyle = 'rgba(0,0,0,0)';
    ctx.lineCap = 'butt';
    ctx.lineJoin = 'round';
    ctx.miterLimit = 4;
    ctx.save();
    ctx.save();
    ctx.translate(1.884306, 2.153978);
    ctx.save();
    ctx.fillStyle = "#99c2d8";
    ctx.strokeStyle = "#535353";
    ctx.beginPath();
    ctx.moveTo(192.260259, 77.6722237);
    ctx.bezierCurveTo(173.787662, 81.7932359, 163.264816, 85.1567853, 151.544031, 90.5472896);
    ctx.bezierCurveTo(139.823247, 95.9377939, 132.716658, 100.560719, 123.960125, 109.084128);
    ctx.bezierCurveTo(120.150815, 114.348527, 120.150815, 120.876405, 123.960125, 128.667763);
    ctx.lineTo(164.437466, 128.667763);
    ctx.bezierCurveTo(184.180683, 99.324908, 193.454947, 82.3263949, 192.260259, 77.6722237);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
    ctx.save();
    ctx.fillStyle = "#ededed";
    ctx.strokeStyle = "#535353";
    ctx.beginPath();
    ctx.moveTo(573.518756, 115.624974);
    ctx.lineTo(640.762457, 117.436495);
    ctx.lineTo(674.190302, 8.28996268);
    ctx.bezierCurveTo(661.296577, 3.9336239, 652.078869, 1.36490019, 646.537176, 0.58379155);
    ctx.bezierCurveTo(638.224636, -0.587871404, 625.489462, -0.133368881, 621.251369, 3.21217852);
    ctx.bezierCurveTo(617.013275, 6.55772593, 549.491238, 86.4895208, 544.241312, 92.2505892);
    ctx.bezierCurveTo(538.991386, 98.0116576, 536.432346, 99.6083228, 531.029504, 102.21821);
    ctx.bezierCurveTo(527.42761, 103.958135, 521.739245, 105.510764, 513.964408, 106.876097);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
    ctx.save();
    ctx.fillStyle = "#383838";
    ctx.strokeStyle = "#090909";
    ctx.beginPath();
    ctx.arc(72.6156942, 238.346022, 19, 0, 6.283185307179586, true);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
    ctx.save();
    ctx.fillStyle = "#d8d8d8";
    ctx.strokeStyle = "#141414";
    ctx.beginPath();
    ctx.arc(73.1156942, 237.846022, 8.5, 0, 6.283185307179586, true);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
    ctx.save();
    ctx.fillStyle = "#d8d8d8";
    ctx.strokeStyle = "#979797";
    ctx.beginPath();
    ctx.arc(73.1156942, 237.846022, 1.5, 0, 6.283185307179586, true);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
    ctx.save();
    ctx.fillStyle = "#d8d8d8";
    ctx.strokeStyle = "#535353";
    ctx.beginPath();
    ctx.moveTo(79.8768995, 198.03942);
    ctx.lineTo(75.0191978, 216.915521);
    ctx.lineTo(78.8886258, 217.41214);
    ctx.lineTo(83.7151191, 198.496833);
    ctx.lineTo(79.8768995, 198.03942);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
    ctx.save();
    ctx.fillStyle = "#d8d8d8";
    ctx.strokeStyle = "#535353";
    ctx.beginPath();
    ctx.moveTo(72.6156942, 213.445933);
    ctx.lineTo(83.1156942, 216.440269);
    ctx.lineTo(75.1156942, 238.346022);
    ctx.bezierCurveTo(74.7794649, 240.011526, 73.9461316, 240.70586, 72.6156942, 240.429026);
    ctx.bezierCurveTo(71.2852569, 240.152191, 70.6522467, 239.29119, 70.7166634, 237.846022);
    ctx.lineTo(72.6156942, 213.445933);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
    ctx.save();
    ctx.fillStyle = "#d8d8d8";
    ctx.strokeStyle = "#535353";

    ctx.beginPath();
    ctx.moveTo(78.0483471, 199.434921);
    ctx.lineTo(84.4094147, 200.817089);
    ctx.lineTo(88.4598618, 181.636369);
    ctx.lineTo(81.8850749, 180.103255);
    ctx.lineTo(78.0483471, 199.434921);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
    ctx.save();
    ctx.strokeStyle = "#535353";

    ctx.beginPath();
    ctx.moveTo(611.230702, 152.437396);
    ctx.lineTo(611.230702, 160.839405);
    ctx.bezierCurveTo(611.294879, 162.687905, 610.910322, 163.948453, 610.077032, 164.621048);
    ctx.bezierCurveTo(609.243741, 165.293643, 607.806833, 165.293643, 605.766307, 164.621048);
    ctx.lineTo(582.228906, 154.954203);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
    ctx.save();
    ctx.fillStyle = "#ededed";
    ctx.strokeStyle = "#535353";

    ctx.beginPath();
    ctx.moveTo(24.5375546, 124.259851);
    ctx.lineTo(24.5375546, 155.409756);
    ctx.bezierCurveTo(25.2527039, 164.21822, 27.94447, 170.9892, 32.612853, 175.722695);
    ctx.bezierCurveTo(39.6154276, 182.822937, 42.816226, 182.822937, 57.8151142, 185.077964);
    ctx.bezierCurveTo(72.8140023, 187.33299, 157.178834, 195.933067, 190.330039, 195.933067);
    ctx.bezierCurveTo(223.481244, 195.933067, 284.320694, 196.789191, 335.164153, 190.845031);
    ctx.bezierCurveTo(369.059793, 186.882257, 470.735395, 174.34643, 640.19096, 153.23755);
    ctx.bezierCurveTo(644.42177, 148.521093, 646.537176, 143.373174, 646.537176, 137.793792);
    ctx.bezierCurveTo(646.537176, 132.21441, 644.42177, 126.633713, 640.19096, 121.0517);
    ctx.lineTo(295.847887, 77.6722237);
    ctx.bezierCurveTo(268.40324, 75.0294704, 247.347746, 73.7080938, 232.681406, 73.7080938);
    ctx.bezierCurveTo(210.681896, 73.7080938, 200.722952, 75.6751831, 192.260259, 77.6722237);
    ctx.bezierCurveTo(171.936684, 109.882369, 171.936684, 107.882369, 162.432591, 122.259851);
    ctx.bezierCurveTo(152.04255, 122.419844, 139.218394, 118.027936, 123.960125, 109.084128);
    ctx.lineTo(24.5375546, 124.259851);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
    ctx.save();
    ctx.fillStyle = "#99c2d8";
    ctx.strokeStyle = "#535353";

    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(170.918082, 122.499841);
    ctx.lineTo(194.745422, 85.289783);
    ctx.lineTo(246.650114, 85.289783);
    ctx.lineTo(246.650114, 122.499841);
    ctx.lineTo(170.918082, 122.499841);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
    ctx.save();
    ctx.fillStyle = "#99c2d8";
    ctx.strokeStyle = "#535353";

    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(252.880473, 122.499841);
    ctx.lineTo(252.880473, 85.289783);
    ctx.lineTo(305.226628, 103.169993);
    ctx.lineTo(298.642101, 122.499841);
    ctx.lineTo(252.880473, 122.499841);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
    ctx.save();
    ctx.fillStyle = "#ededed";
    ctx.strokeStyle = "#535353";

    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(183.947503, 152.754573);
    ctx.lineTo(183.947503, 165.25651);
    ctx.bezierCurveTo(178.659567, 166.570931, 173.664811, 167.921055, 168.963236, 169.306883);
    ctx.bezierCurveTo(161.910874, 171.385625, 152.910905, 174.222277, 152.910905, 179.236074);
    ctx.bezierCurveTo(152.910905, 184.249871, 168.662755, 188.296187, 181.522893, 189.822281);
    ctx.bezierCurveTo(194.383031, 191.348376, 238.526083, 192.379318, 252.880473, 192.379318);
    ctx.bezierCurveTo(262.450067, 192.379318, 293.307796, 191.526973, 345.45366, 189.822281);
    ctx.lineTo(328.554977, 184.22995);
    ctx.lineTo(328.554977, 152.754573);
    ctx.lineTo(183.947503, 152.754573);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
    ctx.save();
    ctx.fillStyle = "#ededed";
    ctx.strokeStyle = "#535353";

    ctx.beginPath();
    ctx.moveTo(183.947503, 165.25651);
    ctx.lineTo(183.947503, 173.940012);
    ctx.bezierCurveTo(181.512207, 178.04884, 177.846799, 180.103255, 172.95128, 180.103255);
    ctx.bezierCurveTo(168.055761, 180.103255, 163.626465, 180.103255, 159.663393, 180.103255);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(24.5375546, 124.812916);
    ctx.lineTo(24.5375546, 156.51681);
    ctx.bezierCurveTo(24.5375546, 156.51681, 0, 140.664863 + 5, 0, 140.664863);
    ctx.bezierCurveTo(0, 140.664863 - 5, 24.5375546, 124.812916, 24.5375546, 124.812916);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
    ctx.save();
    ctx.strokeStyle = "#535353";

    ctx.beginPath();
    ctx.moveTo(611.748095, 117.436495);
    ctx.lineTo(650.824516, 2.59075066);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
    ctx.save();
    ctx.fillStyle = "#d8d8d8";
    ctx.strokeStyle = "#535353";

    ctx.beginPath();
    ctx.moveTo(252.615694, 194.346022);
    ctx.lineTo(257.61569399999996, 194.346022);
    ctx.quadraticCurveTo(257.61569399999996, 194.346022, 257.61569399999996, 194.346022);
    ctx.lineTo(257.61569399999996, 222.346022);
    ctx.quadraticCurveTo(257.61569399999996, 222.346022, 257.61569399999996, 222.346022);
    ctx.lineTo(252.615694, 222.346022);
    ctx.quadraticCurveTo(252.615694, 222.346022, 252.615694, 222.346022);
    ctx.lineTo(252.615694, 194.346022);
    ctx.quadraticCurveTo(252.615694, 194.346022, 252.615694, 194.346022);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
    ctx.save();
    ctx.fillStyle = "#383838";
    ctx.strokeStyle = "#090909";

    ctx.beginPath();
    ctx.arc(256.115694, 237.846022, 19.5, 0, 6.283185307179586, true);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
    ctx.save();
    ctx.fillStyle = "#d8d8d8";
    ctx.strokeStyle = "#131313";

    ctx.beginPath();
    ctx.arc(256.115694, 237.846022, 10.5, 0, 6.283185307179586, true);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
    ctx.save();
    ctx.fillStyle = "#d8d8d8";
    ctx.strokeStyle = "#979797";

    ctx.beginPath();
    ctx.arc(256.115694, 237.846022, 6.5, 0, 6.283185307179586, true);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
    ctx.save();
    ctx.fillStyle = "#d8d8d8";
    ctx.strokeStyle = "#535353";

    ctx.beginPath();
    ctx.moveTo(249.615694, 185.346022);
    ctx.lineTo(264.61569399999996, 185.346022);
    ctx.quadraticCurveTo(264.61569399999996, 185.346022, 264.61569399999996, 185.346022);
    ctx.lineTo(264.61569399999996, 205.346022);
    ctx.quadraticCurveTo(264.61569399999996, 205.346022, 264.61569399999996, 205.346022);
    ctx.lineTo(249.615694, 205.346022);
    ctx.quadraticCurveTo(249.615694, 205.346022, 249.615694, 205.346022);
    ctx.lineTo(249.615694, 185.346022);
    ctx.quadraticCurveTo(249.615694, 185.346022, 249.615694, 185.346022);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
    ctx.save();
    ctx.fillStyle = "#d8d8d8";
    ctx.strokeStyle = "#535353";

    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(665.040338, 134.944558);
    ctx.bezierCurveTo(646.689145, 133.905462, 631.350989, 133.385914, 619.025872, 133.385914);
    ctx.bezierCurveTo(600.538197, 133.385914, 591.494761, 134.944558, 591.494761, 137.870901);
    ctx.bezierCurveTo(591.494761, 139.531367, 598.472608, 139.531367, 619.025872, 139.531367);
    ctx.bezierCurveTo(631.022929, 139.531367, 646.361085, 138.002431, 665.040338, 134.944558);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
    ctx.save();
    ctx.strokeStyle = "#535353";

    ctx.beginPath();
    ctx.moveTo(297.72978, 155.500705);
    ctx.lineTo(297.72978, 192.379318);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
    ctx.save();


    ctx.strokeStyle = "#535353";

    ctx.beginPath();
    ctx.moveTo(121.468375, 110.032454);
    ctx.lineTo(121.468375, 128.667763);
    ctx.lineTo(110.919622, 190.460172);
    ctx.fill();
    ctx.stroke();


    if (fade) {
        ctx.globalCompositeOperation = "destination-out";
        ctx.fillStyle = "rgba(0,0,0,0.5)";
        ctx.fillRect(-1000, -1000, 2000, 2000);
        ctx.globalCompositeOperation = "source-over";
    }


    ctx.fillStyle = "#F0C529";
    ctx.strokeStyle = "#444";


    ctx.save();
    let ssc = 145;
    ctx.translate(328.554977, 152.754573);
    ctx.scale(ssc, -ssc);
    ctx.translate(-1, 0);
    ctx.lineWidth *= 1 / ssc;
    ctx.beginPath();
    for (let x = 0; x < geometry.nx; x++) {
        let p = geometry.grid_position(x, 0);
        ctx.lineTo(p[0], p[1]);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();


    ctx.restore();

    ctx.restore();
    ctx.restore();

    let grd = ctx.createLinearGradient(0, 140.664863 - 70, 0, 140.664863 + 70);

    grd.addColorStop(0.0, `rgba(0,0,0,${(0.2 + 0.3 * Math.sin(rot)) * (fade ? 0.5 : 1)})`);
    grd.addColorStop(0.5, `rgba(0,0,0,${(0.6) * (fade ? 0.5 : 1)})`);
    grd.addColorStop(1.0, `rgba(0,0,0,${(0.2 + 0.3 * Math.cos(rot)) * (fade ? 0.5 : 1)})`);

    ctx.fillStyle = grd;

    ctx.fillRect(12, 140.664863 - 70, 8, 140);

    ctx.restore();
}


function draw_car(ctx, rot) {
    ctx.save();


    let sc = 0.04;
    ctx.scale(sc, -sc);
    ctx.lineWidth *= 1 / sc;
    ctx.translate(-286, -51);


    ctx.beginPath();
    ctx.moveTo(463.93652, 9.89137);
    ctx.bezierCurveTo(462.12793, 6.72347, 461.22363, 3.5344, 461.22363, 0.32417);
    ctx.bezierCurveTo(447.58911, -1.16177, 434.20691, 2.81333, 434.85754, 5.10777);
    ctx.fillStyle = '#144BA2';
    ctx.fill();

    ctx.strokeStyle = '#0A2550';
    ctx.setLineDash([]);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(201.50423, 61.17709);
    ctx.lineTo(188.16669, 61.17709);
    ctx.bezierCurveTo(203.20035, 51.65147, 216.29776, 43.74637, 227.45894, 37.46178);
    ctx.bezierCurveTo(238.62012, 31.17718, 254.27742, 22.76883, 274.43085, 12.23672);
    ctx.lineTo(274.43085, 12.23672);
    ctx.lineTo(279.9082, 12.23672);
    ctx.bezierCurveTo(270.26462, 16.95137, 262.56989, 20.88616, 256.82407, 24.0411);
    ctx.bezierCurveTo(248.20532, 28.77351, 232.23108, 37.35613, 223.36493, 44.59967);
    ctx.bezierCurveTo(217.45416, 49.42869, 210.16725, 54.9545, 201.50423, 61.17709);
    ctx.closePath();
    ctx.fillStyle = '#494949';
    ctx.fill();
    ctx.strokeStyle = '#262626';
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(39.84225, 172.14839);
    ctx.lineTo(147.84225, 174.03062);
    ctx.lineTo(445.54535, 174.03062);
    ctx.lineTo(553.84222, 166.23325);
    ctx.lineTo(553.84222, 87.1774);
    ctx.lineTo(39.84225, 92.7093);
    ctx.lineTo(39.84225, 172.14839);
    ctx.fillStyle = '#232323';
    ctx.fill();
    ctx.strokeStyle = '#070707';
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(371.28271, 0.32692);
    ctx.lineTo(374.35034, 0.32478);
    ctx.lineTo(377.45282, 0.33388);
    ctx.bezierCurveTo(398.66855, 0.43358, 416.60034, 1.29135, 428.79272, 2.45418);
    ctx.lineTo(428.79272, 2.45418);
    ctx.lineTo(432.09656, 2.77907);
    ctx.bezierCurveTo(444.13, 3.95401, 454.42374, 4.78989, 464.44556, 8.05787);
    ctx.lineTo(464.44556, 8.05787);
    ctx.lineTo(465.88657, 8.53597);
    ctx.bezierCurveTo(472.23199, 10.67301, 482.73993, 14.5829, 493.5853, 18.80076);
    ctx.lineTo(493.5853, 18.80076);
    ctx.lineTo(495.64261, 19.60299);
    ctx.lineTo(499.86032, 21.261);
    ctx.lineTo(502.03464, 22.12293);
    ctx.bezierCurveTo(507.45117, 24.27644, 512.7016, 26.41161, 517.2984, 28.34173);
    ctx.lineTo(517.2984, 28.34173);
    ctx.lineTo(518.20886, 28.72496);
    ctx.bezierCurveTo(529.41315, 33.45266, 541.96637, 39.42246, 555.86865, 46.63437);
    ctx.lineTo(555.86865, 46.63437);
    ctx.lineTo(557.76874, 46.79595);
    ctx.bezierCurveTo(562.90881, 47.24233, 566.89832, 47.66816, 569.73718, 48.07342);
    ctx.lineTo(569.73718, 48.07342);
    ctx.lineTo(570.17615, 48.14183);
    ctx.bezierCurveTo(575.34528, 49.00639, 589.36829, 53.1675, 601.63367, 53.1675);
    ctx.bezierCurveTo(606.16962, 53.1675, 610.85034, 52.59385, 615.6759, 51.44656);
    ctx.lineTo(615.6759, 51.44656);
    ctx.lineTo(620.51971, 58.30328);
    ctx.bezierCurveTo(619.68018, 62.4156, 618.87128, 66.52836, 618.09308, 70.64157);
    ctx.lineTo(618.09308, 70.64157);
    ctx.lineTo(617.84259, 70.92365);
    ctx.bezierCurveTo(615.91138, 73.16432, 615.70154, 75.0893, 615.67871, 81.39431);
    ctx.lineTo(615.67871, 81.39431);
    ctx.lineTo(615.6759, 83.90411);
    ctx.bezierCurveTo(615.6759, 92.56437, 620.51971, 105.43034, 630.54382, 113.29465);
    ctx.lineTo(630.54382, 113.29465);
    ctx.lineTo(630.54382, 143.89503);
    ctx.lineTo(623.17999, 152.65135);
    ctx.lineTo(611.66559, 156.4315);
    ctx.lineTo(606.11444, 157.57243);
    ctx.bezierCurveTo(577.81891, 163.34631, 560.3949, 166.23325, 553.84222, 166.23325);
    ctx.lineTo(553.84222, 166.23325);
    ctx.lineTo(553.84222, 154.83823);
    ctx.bezierCurveTo(553.84222, 125.01485, 529.66565, 100.83823, 499.84225, 100.83823);
    ctx.bezierCurveTo(470.31711, 100.83823, 446.32635, 124.53374, 445.84949, 153.94524);
    ctx.lineTo(445.84949, 153.94524);
    ctx.lineTo(445.84225, 154.83823);
    ctx.lineTo(445.84225, 174.03062);
    ctx.lineTo(147.84225, 174.03062);
    ctx.lineTo(147.84225, 154.83823);
    ctx.bezierCurveTo(147.84225, 125.01485, 123.66563, 100.83823, 93.84225, 100.83823);
    ctx.bezierCurveTo(64.31711, 100.83823, 40.32635, 124.53374, 39.84949, 153.94524);
    ctx.lineTo(39.84949, 153.94524);
    ctx.lineTo(39.84225, 154.83823);
    ctx.lineTo(39.84225, 172.14839);
    ctx.lineTo(20.25931, 172.14839);
    ctx.lineTo(7.73149, 170.47295);
    ctx.lineTo(1.45633, 163.36006);
    ctx.lineTo(0, 143.89503);
    ctx.bezierCurveTo(-0.04734, 139.47296, 0.43689, 135.35828, 1.45633, 131.55098);
    ctx.lineTo(1.45633, 131.55098);
    ctx.lineTo(1.64737, 130.86151);
    ctx.bezierCurveTo(2.72557, 127.09067, 4.75361, 121.81978, 7.73149, 115.04886);
    ctx.lineTo(7.73149, 115.04886);
    ctx.lineTo(9.6484, 98.4778);
    ctx.bezierCurveTo(10.81463, 95.81097, 13.56362, 93.24362, 17.89536, 90.77576);
    ctx.lineTo(17.89536, 90.77576);
    ctx.lineTo(19.50679, 89.87312);
    ctx.lineTo(22.16922, 88.36529);
    ctx.lineTo(23.16459, 87.80866);
    ctx.lineTo(24.05648, 87.3197);
    ctx.bezierCurveTo(28.32814, 85.00533, 33.23026, 82.77608, 44.28473, 79.26597);
    ctx.bezierCurveTo(54.88667, 75.89954, 66.62189, 73.02474, 79.49037, 70.64157);
    ctx.bezierCurveTo(93.47622, 67.93977, 108.53011, 65.72865, 124.65203, 64.00823);
    ctx.lineTo(124.65203, 64.00823);
    ctx.lineTo(126.59179, 63.80414);
    ctx.bezierCurveTo(151.87529, 61.18153, 172.07173, 60.3244, 180.72112, 60.14109);
    ctx.bezierCurveTo(186.48737, 60.01888, 193.44275, 60.34612, 201.58727, 61.12282);
    ctx.lineTo(201.58727, 61.12282);
    ctx.lineTo(203.97562, 59.33057);
    ctx.bezierCurveTo(218.23854, 48.67386, 231.29128, 39.75987, 243.13382, 32.58861);
    ctx.bezierCurveTo(255.63426, 25.01894, 267.5126, 18.23304, 278.76886, 12.23093);
    ctx.lineTo(278.76886, 12.23093);
    ctx.lineTo(274.21155, 12.23093);
    ctx.bezierCurveTo(278.50412, 9.89742, 283.14221, 8.17307, 288.12579, 7.05787);
    ctx.lineTo(288.12579, 7.05787);
    ctx.lineTo(289.71805, 6.70745);
    ctx.bezierCurveTo(296.91928, 5.14966, 305.80765, 3.59958, 317.39496, 2.56765);
    ctx.lineTo(317.39496, 2.56765);
    ctx.lineTo(319.03632, 2.42498);
    ctx.bezierCurveTo(331.17648, 1.39489, 349.46899, 0.38622, 371.28271, 0.32692);
    ctx.closePath();
    ctx.fillStyle = '#144BA2';
    ctx.fill();
    ctx.strokeStyle = '#0A2550';
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(244.72946, 37.07466);
    ctx.bezierCurveTo(254.3936, 30.73974, 277.3829, 18.08072, 289.11798, 14.11992);
    ctx.bezierCurveTo(300.85303, 10.15912, 339.24738, 5.49716, 361.37787, 5.49716);
    ctx.bezierCurveTo(383.50833, 5.49716, 406.32971, 4.18887, 434.45575, 9.1544);
    ctx.bezierCurveTo(462.58179, 14.11992, 474.71826, 19.89961, 487.5108, 26.47409);
    ctx.bezierCurveTo(500.30338, 33.04856, 508.55389, 35.80719, 508.55389, 42.09983);
    ctx.bezierCurveTo(508.55389, 48.39248, 502.4238, 56.96062, 499.07764, 56.96062);
    ctx.bezierCurveTo(497.50851, 56.96062, 447.70898, 57.23321, 350.1918, 60.98408);
    ctx.bezierCurveTo(323.70306, 62.00294, 276.53171, 64.32429, 208.67775, 67.94813);
    ctx.bezierCurveTo(207.10039, 68.03236, 204.70921, 68.16031, 201.50423, 68.33196);
    ctx.bezierCurveTo(223.87828, 51.71704, 238.2867, 41.29794, 244.72946, 37.07466);
    ctx.closePath();
    ctx.fillStyle = '#262626';
    ctx.fill();
    ctx.strokeStyle = '#131313';
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(190.99969, 161.6176);
    ctx.bezierCurveTo(188.68503, 139.69975, 187.52769, 127.03928, 187.52769, 123.63621);
    ctx.bezierCurveTo(187.52769, 118.53159, 185.7917, 109.00648, 187.52769, 94.69753);
    ctx.bezierCurveTo(189.2637, 80.38857, 186.34865, 84.11366, 190.99969, 77.15089);
    ctx.bezierCurveTo(194.10039, 72.50903, 197.6019, 69.5694, 201.50423, 68.33196);
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(148.51762, 161.6176);
    ctx.lineTo(408.7803, 154.83823);
    ctx.bezierCurveTo(415.9682, 154.87466, 421.72269, 153.5948, 426.04376, 150.99864);
    ctx.bezierCurveTo(432.52539, 147.1044, 435.71173, 143.43069, 441.315, 134.59973);
    ctx.bezierCurveTo(446.9183, 125.76877, 484.73331, 66.10316, 490.6571, 56.97174);
    ctx.bezierCurveTo(494.40659, 51.19204, 498.65356, 48.80537, 497.67941, 38.23672);
    ctx.bezierCurveTo(497.64481, 37.86137, 496.63312, 35.36238, 494.64429, 30.73974);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(229.01694, 64.36338);
    ctx.bezierCurveTo(228.96811, 60.75609, 228.96811, 56.62076, 229.01694, 51.9574);
    ctx.bezierCurveTo(234.10858, 44.47561, 280.06378, 20.84484, 289.97729, 17.24163);
    ctx.bezierCurveTo(299.89081, 13.63842, 344.4552, 8.46138, 361.37787, 8.46138);
    ctx.bezierCurveTo(378.30051, 8.46138, 394.91357, 7.63739, 416.11496, 9.93705);
    ctx.bezierCurveTo(437.31631, 12.23672, 455.32867, 16.56687, 467.86234, 20.99032);
    ctx.bezierCurveTo(476.21808, 23.93929, 481.37079, 27.18909, 483.3204, 30.73974);
    ctx.bezierCurveTo(486.09708, 35.30767, 487.48541, 38.91359, 487.48541, 41.5575);
    ctx.bezierCurveTo(487.48541, 44.20142, 483.77576, 48.43373, 476.35648, 54.25442);
    ctx.lineTo(476.35648, 54.25442);
    ctx.lineTo(351.67426, 58.22125);
    ctx.lineTo(229.01694, 64.36338);
    ctx.closePath();
    ctx.fillStyle = '#494949';
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(336.73383, 59.73424);
    ctx.lineTo(365.29755, 57.83158);
    ctx.lineTo(369.57443, 7.93705);
    ctx.lineTo(353.15411, 7.93705);
    ctx.lineTo(336.73383, 59.73424);
    ctx.fillStyle = '#262626';
    ctx.fill();
    ctx.strokeStyle = '#131313';
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(442.01224, 55.74638);
    ctx.lineTo(446.38367, 55.74638);
    ctx.lineTo(449.7402, 13.82648);
    ctx.lineTo(445.84225, 12.8555);
    ctx.lineTo(442.01224, 55.74638);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(343.28235, 157.98273);
    ctx.bezierCurveTo(340.71375, 153.71761, 339.42947, 150.01215, 339.42947, 146.86635);
    ctx.bezierCurveTo(339.42947, 142.14764, 341.3559, 108.80463, 341.3559, 101.33823);
    ctx.bezierCurveTo(341.3559, 93.87182, 347.12396, 72.11769, 350.1687, 62.73166);
    ctx.bezierCurveTo(352.19852, 56.47432, 355.93491, 37.77302, 361.37787, 6.62779);
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(6.46869, 115.58651);
    ctx.lineTo(10.35865, 115.58651);
    ctx.lineTo(15.53697, 111.6933);
    ctx.lineTo(16.4891, 114.22202);
    ctx.bezierCurveTo(19.3342, 114.42455, 22.33962, 113.96218, 25.50536, 112.83489);
    ctx.bezierCurveTo(30.25397, 111.14397, 47.60877, 102.64185, 54.93184, 96.17867);
    ctx.bezierCurveTo(49.25672, 92.44353, 40.16357, 92.21133, 30.70027, 93.22755);
    ctx.bezierCurveTo(24.3914, 93.90502, 16.98087, 96.60858, 8.46869, 101.33823);
    ctx.lineTo(8.46869, 101.33823);
    ctx.lineTo(7.67854, 106.96741);
    ctx.lineTo(6.46869, 115.58651);
    ctx.closePath();
    ctx.fillStyle = '#CCC';
    ctx.fill();
    ctx.strokeStyle = '#333333';
    ctx.stroke();

    ctx.strokeStyle = '#0A2550';

    ctx.beginPath();
    ctx.moveTo(304.40359, 80.15134);
    ctx.bezierCurveTo(304.72174, 77.48773, 313.44354, 76.14555, 319.24915, 75.7824);
    ctx.bezierCurveTo(325.05475, 75.41926, 334.104, 75.49333, 334.104, 78.29356);
    ctx.bezierCurveTo(334.104, 81.0938, 326.36017, 80.18391, 319.07278, 80.63974);
    ctx.bezierCurveTo(311.78537, 81.09557, 304.08542, 82.81496, 304.40359, 80.15134);
    ctx.closePath();
    ctx.stroke();

    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(439.40359, 72.15134);
    ctx.bezierCurveTo(439.72174, 69.48773, 448.44354, 68.14555, 454.24915, 67.7824);
    ctx.bezierCurveTo(460.05475, 67.41926, 469.104, 67.49333, 469.104, 70.29356);
    ctx.bezierCurveTo(469.104, 73.0938, 461.36017, 72.18391, 454.07278, 72.63974);
    ctx.bezierCurveTo(446.78537, 73.09557, 439.08542, 74.81496, 439.40359, 72.15134);
    ctx.closePath();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(21.47015, 162.37715);
    ctx.bezierCurveTo(17.78291, 163.82617, 15.11487, 164.18842, 13.46601, 163.46391);
    ctx.bezierCurveTo(10.99273, 162.37715, 6.46869, 158.07864, 6.46869, 154.83823);
    ctx.bezierCurveTo(6.46869, 151.59781, 5.18023, 137.13823, 5.18023, 135.23259);
    ctx.bezierCurveTo(5.18023, 133.32695, 10.18399, 130.81313, 10.18399, 130.81313);
    ctx.bezierCurveTo(10.18399, 130.81313, 12.59501, 130.81313, 17.41704, 130.81313);
    ctx.bezierCurveTo(17.83427, 138.01917, 18.28675, 143.52133, 18.77449, 147.31964);
    ctx.bezierCurveTo(19.26223, 151.11795, 20.16078, 156.13712, 21.47015, 162.37715);
    ctx.closePath();
    ctx.fillStyle = '#2B2B2B';
    ctx.fill();
    ctx.strokeStyle = '#0A1F40';
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(524.34229, 154.83823);
    ctx.bezierCurveTo(524.34229, 161.60373, 521.95032, 167.37843, 517.16638, 172.16234);
    ctx.bezierCurveTo(512.38245, 176.94627, 506.60773, 179.33823, 499.84225, 179.33823);
    ctx.bezierCurveTo(493.07678, 179.33823, 487.30209, 176.94627, 482.51813, 172.16234);
    ctx.bezierCurveTo(477.73422, 167.37843, 475.34225, 161.60373, 475.34225, 154.83823);
    ctx.bezierCurveTo(475.34225, 148.07274, 477.73422, 142.29803, 482.51813, 137.51411);
    ctx.bezierCurveTo(487.30209, 132.73019, 493.07678, 130.33823, 499.84225, 130.33823);
    ctx.bezierCurveTo(506.60773, 130.33823, 512.38245, 132.73019, 517.16638, 137.51411);
    ctx.bezierCurveTo(521.95032, 142.29803, 524.34229, 148.07274, 524.34229, 154.83823);
    ctx.bezierCurveTo(524.34229, 155.12332, 524.33728, 155.40834, 524.32733, 155.69327);
    ctx.fillStyle = '#414141';
    ctx.fill();
    ctx.strokeStyle = '#2C2C2C';
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(122.34225, 154.83823);
    ctx.bezierCurveTo(122.34226, 162.70828, 119.55978, 169.4258, 113.9948, 174.99077);
    ctx.bezierCurveTo(108.42983, 180.55574, 101.71232, 183.33823, 93.84225, 183.33823);
    ctx.bezierCurveTo(85.9722, 183.33823, 79.25468, 180.55574, 73.68971, 174.99077);
    ctx.bezierCurveTo(68.12474, 169.4258, 65.34225, 162.70828, 65.34225, 154.83823);
    ctx.bezierCurveTo(65.34225, 146.96817, 68.12474, 140.25066, 73.68971, 134.68568);
    ctx.bezierCurveTo(79.25468, 129.12071, 85.9722, 126.33823, 93.84225, 126.33823);
    ctx.bezierCurveTo(101.71232, 126.33823, 108.42983, 129.12071, 113.9948, 134.68568);
    ctx.bezierCurveTo(119.55978, 140.25066, 122.34226, 146.96817, 122.34225, 154.83823);
    ctx.bezierCurveTo(122.34226, 155.16988, 122.33647, 155.50142, 122.32489, 155.83286);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(470.66803, 166.83823);
    ctx.lineTo(482.87805, 163.31787);
    ctx.lineTo(483.3204, 145.49026);
    ctx.lineTo(470.66803, 141.89299);
    ctx.bezierCurveTo(468.79755, 145.25981, 467.86234, 149.41734, 467.86234, 154.3656);
    ctx.bezierCurveTo(467.86234, 159.31387, 468.79755, 163.47141, 470.66803, 166.83823);
    ctx.closePath();
    ctx.fillStyle = '#0C2F65';
    ctx.fill();
    ctx.strokeStyle = '#071C3C';
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(113.34725, 161.81915);
    ctx.lineTo(129.01038, 157.30321);
    ctx.lineTo(129.57785, 134.43376);
    ctx.lineTo(113.34725, 129.81915);
    ctx.bezierCurveTo(110.94778, 134.13814, 109.74805, 139.47148, 109.74805, 145.81915);
    ctx.bezierCurveTo(109.74805, 152.16684, 110.94778, 157.50017, 113.34725, 161.81915);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(4.18023, 117.92269);
    ctx.bezierCurveTo(4.85297, 111.58076, 6.00903, 105.09913, 7.6484, 98.4778);
    ctx.strokeStyle = '#3D3D3D';
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(248.32957, 58.88465);
    ctx.lineTo(248.32957, 45.75816);
    ctx.bezierCurveTo(246.33696, 44.09372, 243.62755, 43.26151, 240.20131, 43.26151);
    ctx.bezierCurveTo(235.06194, 43.26151, 226.66615, 46.1137, 224.90517, 47.93763);
    ctx.bezierCurveTo(223.1442, 49.76156, 222.69719, 53.87364, 224.25409, 55.93263);
    ctx.bezierCurveTo(225.81099, 57.99162, 230.24828, 60.32698, 233.03197, 60.32698);
    ctx.bezierCurveTo(235.81564, 60.32698, 240.96796, 61.06117, 244.64876, 60.32698);
    ctx.bezierCurveTo(247.10263, 59.83752, 248.32957, 59.35674, 248.32957, 58.88465);
    ctx.closePath();
    ctx.fillStyle = '#747474';
    ctx.fill();
    ctx.strokeStyle = '#2B2B2B';
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(617.55341, 70.30658);
    ctx.lineTo(612.8045, 68.20033);
    ctx.lineTo(597.30267, 68.20033);
    ctx.lineTo(597.30267, 77.63963);
    ctx.lineTo(615.25519, 81.39333);
    ctx.lineTo(617.55341, 70.30658);
    ctx.fillStyle = '#D8D8D8';
    ctx.fill();
    ctx.strokeStyle = '#979797';
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(615.19238, 86.88201);
    ctx.lineTo(618.71246, 82.27917);
    ctx.lineTo(615.19238, 78.90663);
    ctx.lineTo(608.80444, 78.90663);
    ctx.lineTo(596.66528, 65.82445);
    ctx.lineTo(578.78754, 65.82445);
    ctx.bezierCurveTo(577.59045, 65.99809, 576.99188, 66.74158, 576.99188, 68.05492);
    ctx.bezierCurveTo(576.99188, 70.02495, 588.76685, 78.60947, 592.19092, 80.99171);
    ctx.bezierCurveTo(594.47363, 82.57986, 597.4483, 84.5433, 601.11493, 86.88201);
    ctx.lineTo(601.11493, 86.88201);
    ctx.lineTo(615.19238, 86.88201);
    ctx.closePath();
    ctx.fillStyle = '#FE0041';
    ctx.fill();
    ctx.strokeStyle = '#8F0025';
    ctx.stroke();


    for (let k = 0; k < 2; k++) {
        ctx.save();

        ctx.translate(k == 0 ? 93.84 : 500, 154.83);
        ctx.strokeStyle = "#111";

        ctx.rotate(rot);

        for (let i = 0; i < 5; i++) {
            ctx.strokeLine(0, 0, -5, 40);
            ctx.strokeLine(0, 0, 5, 40);
            ctx.rotate(Math.PI * 2 / 5);
        }

        ctx.strokeEllipse(0, 0, 10);

        let lw = ctx.lineWidth;

        ctx.lineWidth = 15 + lw;
        ctx.strokeStyle = "#000";
        ctx.strokeEllipse(0, 0, 40);

        ctx.lineWidth = 15;
        ctx.strokeStyle = "#282828";
        ctx.strokeEllipse(0, 0, 40);

        ctx.restore();
    }

    ctx.restore();
}

function draw_bird(ctx, size) {
    ctx.fillStyle = "#333";
    ctx.strokeStyle = "#000";
    ctx.lineJoin = "miter";

    ctx.save();

    ctx.scale(0.1 * size, -0.1 * size);
    ctx.translate(-460, -70);

    ctx.beginPath();

    ctx.moveTo(460.728243, 72.977202);
    ctx.bezierCurveTo(461.585105, 72.8870268, 462.126551, 73.0120549, 462.352582, 73.3522865);
    ctx.bezierCurveTo(462.691628, 73.8626339, 462.667681, 74.1841349, 462.667681, 74.5402518);
    ctx.bezierCurveTo(462.667681, 74.8963688, 462.187682, 75.9202643, 462.187682, 75.9202643);
    ctx.bezierCurveTo(462.187682, 75.9202643, 463.438122, 78.5534432, 463.651034, 78.8046455);
    ctx.bezierCurveTo(463.863945, 79.0558479, 465.403167, 81.2202897, 465.675352, 81.2202897);
    ctx.bezierCurveTo(465.856809, 81.2202897, 466.298438, 81.2202897, 467.00024, 81.2202897);
    ctx.lineTo(468.202668, 84.3955867);
    ctx.lineTo(470.86584, 85.2787662);
    ctx.lineTo(468.701516, 78.560319);
    ctx.bezierCurveTo(467.924476, 76.5690357, 467.357384, 75.3399343, 467.00024, 74.8730149);
    ctx.bezierCurveTo(466.464523, 74.1726358, 465.5, 73.3522865, 464.951382, 72.977202);
    ctx.bezierCurveTo(464.402764, 72.6021174, 463.974076, 71.4149819, 463.163329, 71.4149819);
    ctx.bezierCurveTo(462.622831, 71.4149819, 461.811136, 71.9357219, 460.728243, 72.977202);
    ctx.closePath();



    ctx.restore();

    ctx.fill();
    ctx.stroke();
}



function grass3_f0() {
    drawers_map["grass3"].drawer.set_slider_arg(0, 0.07);
    drawers_map["grass3"].sliders[0].set_value(0.07);
}

function particles2_f0() {
    drawers_map["particles2"].drawer.set_slider_arg(0, 0);
    drawers_map["particles2"].sliders[0].set_value(0.0);
}

function particles2_f1() {
    drawers_map["particles2"].drawer.set_slider_arg(0, 1);
    drawers_map["particles2"].sliders[0].set_value(1);
}

function particles3_f0() {
    drawers_map["particles3"].drawer.set_slider_arg(1, 0.0);
    drawers_map["particles3"].sliders[1].set_value(0.0);
}

function particles3_f1() {
    drawers_map["particles3"].drawer.set_slider_arg(1, 1);
    drawers_map["particles3"].sliders[1].set_value(1);
}

function particles4_f0() {
    drawers_map["particles4"].drawer.set_slider_arg(1, 1);
    drawers_map["particles4"].sliders[1].set_value(1);
}

function particles4_f1() {
    drawers_map["particles4"].drawer.set_slider_arg(0, 0);
    drawers_map["particles4"].sliders[0].set_value(0);
}

function particles5_f0() {
    drawers_map["particles5"].drawer.set_slider_arg(0, 0.5);
    drawers_map["particles5"].sliders[0].set_value(0.5);
    drawers_map["particles5"].drawer.set_slider_arg(1, 1);
    drawers_map["particles5"].sliders[1].set_value(1);
    drawers_map["particles5"].drawer.set_slider_arg(2, 0.5);
    drawers_map["particles5"].sliders[2].set_value(0.5);
}


function balls2_f0() {
    drawers_map["balls2"].drawer.set_slider_arg(0, 0);
    drawers_map["balls2"].sliders[0].set_value(0);
}

function balls3_f0() {
    drawers_map["balls3"].drawer.set_slider_arg(0, 1);
    drawers_map["balls3"].sliders[0].set_value(1);
}

function parcels_crossing_f0() {
    drawers_map["parcels_crossing"].drawer.set_slider_arg(0, 0.326);
    drawers_map["parcels_crossing"].sliders[0].set_value(0.326);
}

function parcels_crossing_f1() {
    drawers_map["parcels_crossing"].drawer.set_slider_arg(0, 0.57);
    drawers_map["parcels_crossing"].sliders[0].set_value(0.57);
}


function symmetric_airfoil_fvm4_f0() {
    drawers_map["symmetric_airfoil_fvm4"].drawer.set_slider_arg(0, 0.4);
    drawers_map["symmetric_airfoil_fvm4"].sliders[0].set_value(0.4);
}

function symmetric_airfoil_fvm4_f1() {
    drawers_map["symmetric_airfoil_fvm4"].drawer.set_slider_arg(0, 0.8);
    drawers_map["symmetric_airfoil_fvm4"].sliders[0].set_value(0.8);
}

function symmetric_airfoil_fvm4_f2() {
    drawers_map["symmetric_airfoil_fvm4"].drawer.set_slider_arg(0, 0.66936);
    drawers_map["symmetric_airfoil_fvm4"].sliders[0].set_value(0.66936);
}

function symmetric_airfoil_fvm5_f0() {
    drawers_map["symmetric_airfoil_fvm5"].drawer.set_slider_arg(1, 0.30185);
    drawers_map["symmetric_airfoil_fvm5"].sliders[1].set_value(0.30185);
}

function symmetric_airfoil_fvm5_f1() {
    drawers_map["symmetric_airfoil_fvm5"].drawer.set_slider_arg(0, 0.09);
    drawers_map["symmetric_airfoil_fvm5"].sliders[0].set_value(0.09);
}

function symmetric_airfoil_fvm5_f2() {
    drawers_map["symmetric_airfoil_fvm5"].drawer.set_slider_arg(1, 0.9);
    drawers_map["symmetric_airfoil_fvm5"].sliders[1].set_value(0.9);
}

function symmetric_airfoil_fvm5_f3() {
    drawers_map["symmetric_airfoil_fvm5"].drawer.set_slider_arg(0, 0.80021);
    drawers_map["symmetric_airfoil_fvm5"].sliders[0].set_value(0.80021);
}

function symmetric_airfoil_fvm5_f4() {
    drawers_map["symmetric_airfoil_fvm5"].drawer.set_slider_arg(1, 0);
    drawers_map["symmetric_airfoil_fvm5"].sliders[1].set_value(0);
}

function symmetric_airfoil_fvm6_f0() {
    drawers_map["symmetric_airfoil_fvm6"].drawer.set_slider_arg(0, 0.8);
    drawers_map["symmetric_airfoil_fvm6"].sliders[0].set_value(0.8);
}

function symmetric_airfoil_fvm6_f1() {
    drawers_map["symmetric_airfoil_fvm6"].drawer.set_slider_arg(0, 1 / 3);
    drawers_map["symmetric_airfoil_fvm6"].sliders[0].set_value(1 / 3);
}

function symmetric_airfoil_fvm6_f2() {
    drawers_map["symmetric_airfoil_fvm6"].drawer.set_slider_arg(0, 0.1);
    drawers_map["symmetric_airfoil_fvm6"].sliders[0].set_value(0.1);
}

function symmetric_airfoil_fvm6_f3() {
    drawers_map["symmetric_airfoil_fvm6"].drawer.set_slider_arg(0, 2 / 3);
    drawers_map["symmetric_airfoil_fvm6"].sliders[0].set_value(2 / 3);
}

function symmetric_airfoil_fvm7_f0() {
    drawers_map["symmetric_airfoil_fvm7"].drawer.set_slider_arg(0, 0.7);
    drawers_map["symmetric_airfoil_fvm7"].sliders[0].set_value(0.7);
}

function symmetric_airfoil_fvm20_f0() {
    drawers_map["symmetric_airfoil_fvm20"].drawer.set_slider_arg(0, 0.9);
    drawers_map["symmetric_airfoil_fvm20"].sliders[0].set_value(0.9);
}

function symmetric_airfoil_fvm21_f0() {
    drawers_map["symmetric_airfoil_fvm21"].drawer.set_slider_arg(0, 0.9);
    drawers_map["symmetric_airfoil_fvm21"].sliders[0].set_value(0.9);
}

function symmetric_airfoil_fvm21_f1() {
    drawers_map["symmetric_airfoil_fvm21"].drawer.set_slider_arg(0, 0.1);
    drawers_map["symmetric_airfoil_fvm21"].sliders[0].set_value(0.1);
}


function symmetric_airfoil_fvm23_f0() {
    drawers_map["symmetric_airfoil_fvm23"].drawer.set_slider_arg(0, 0.8);
    drawers_map["symmetric_airfoil_fvm23"].sliders[0].set_value(0.8);
}

function symmetric_airfoil_fvm23_f1() {
    drawers_map["symmetric_airfoil_fvm23"].drawer.set_slider_arg(0, 1);
    drawers_map["symmetric_airfoil_fvm23"].sliders[0].set_value(1);
}

function symmetric_airfoil_fvm23_f2() {

    drawers_map["symmetric_airfoil_fvm23"].drawer.set_slider_arg(0, 1);
    drawers_map["symmetric_airfoil_fvm23"].sliders[0].set_value(1);
    drawers_map["symmetric_airfoil_fvm23"].drawer.reset();
}



function bottle_f0() {
    drawers_map["bottle"].drawer.set_slider_arg(0, 1);
    drawers_map["bottle"].sliders[0].set_value(1);
    drawers_map["bottle"].drawer.reset();
}



function fdm2_f0() {
    drawers_map["fdm2"].drawer.set_slider_arg(0, 1);
    drawers_map["fdm2"].sliders[0].set_value(1);
}

function fdm2_f1() {
    drawers_map["fdm2"].drawer.set_slider_arg(0, 0.4);
    drawers_map["fdm2"].sliders[0].set_value(0.4);
}

function fdm2_f2() {
    drawers_map["fdm2"].drawer.set_slider_arg(0, 0.1);
    drawers_map["fdm2"].sliders[0].set_value(0.1);
}

function fdm4_f0() {
    drawers_map["fdm4"].drawer.set_slider_arg(0, 0.9);
    drawers_map["fdm4"].sliders[0].set_value(0.9);
    drawers_map["fdm4"].drawer.reset();
}

function fdm4_f1() {
    drawers_map["fdm4"].drawer.set_slider_arg(0, 0.1);
    drawers_map["fdm4"].sliders[0].set_value(0.1);
    drawers_map["fdm4"].drawer.reset();
}


function fdm5_f0() {
    drawers_map["fdm5"].drawer.set_slider_arg(0, 0.9);
    drawers_map["fdm5"].sliders[0].set_value(0.9);
}


function fdm5_f1() {
    drawers_map["fdm5"].drawer.set_slider_arg(0, 0.4);
    drawers_map["fdm5"].sliders[0].set_value(0.4);
}

function fdm5_f2() {
    drawers_map["fdm5"].drawer.set_slider_arg(0, 0.05);
    drawers_map["fdm5"].sliders[0].set_value(0.05);
}

function fdm10_f0() {
    drawers_map["fdm10"].drawer.set_slider_arg(0, 0.25);
    drawers_map["fdm10"].sliders[0].set_value(0.25);
}

function fdm9_f0() {
    drawers_map["fdm9"].drawer.set_slider_arg(0, 0.95);
    drawers_map["fdm9"].sliders[0].set_value(0.95);
}


function fdm9_f1() {
    drawers_map["fdm9"].drawer.set_slider_arg(0, 0.6);
    drawers_map["fdm9"].sliders[0].set_value(0.6);
}

function fdm9_f2() {
    drawers_map["fdm9"].drawer.set_slider_arg(0, 0.0);
    drawers_map["fdm9"].sliders[0].set_value(0.0);
}

function boundary4_f0() {
    drawers_map["boundary4"].drawer.set_slider_arg(0, 1);
    drawers_map["boundary4"].sliders[0].set_value(1);
}


function boundary4_f1() {
    drawers_map["boundary4"].drawer.set_slider_arg(0, 0);
    drawers_map["boundary4"].sliders[0].set_value(0);
}


function symmetric_airfoil_fvm24a_f0() {
    drawers_map["symmetric_airfoil_fvm24a"].drawer.set_slider_arg(0, 0.1);
    drawers_map["symmetric_airfoil_fvm24a"].sliders[0].set_value(0.1);
}


function symmetric_airfoil_fvm24a_f1() {
    drawers_map["symmetric_airfoil_fvm24a"].drawer.set_slider_arg(0, 0.5);
    drawers_map["symmetric_airfoil_fvm24a"].sliders[0].set_value(0.5);
}

function symmetric_airfoil_fvm24a_f2() {
    drawers_map["symmetric_airfoil_fvm24a"].drawer.set_slider_arg(0, 1);
    drawers_map["symmetric_airfoil_fvm24a"].sliders[0].set_value(1);
}

function symmetric_airfoil_fvm24a_f3() {
    drawers_map["symmetric_airfoil_fvm24a"].drawer.set_slider_arg(0, 1);
    drawers_map["symmetric_airfoil_fvm24a"].sliders[0].set_value(1);
    drawers_map["symmetric_airfoil_fvm24a"].drawer.reset();
}


function airfoil_fvm3_f0() {
    drawers_map["airfoil_fvm3"].drawer.set_slider_arg(0, 0.7);
    drawers_map["airfoil_fvm3"].sliders[0].set_value(0.7);
}
