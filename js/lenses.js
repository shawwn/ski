let animated_drawers;
let detector;
let detector_slider;
let lens_hole_sharpness;
let lens_hole_sharpness_slider;
let glass;
let glass_slider;
let snell_w;
let snell_slider0;
let snell_slider1;
let snell_slider2;

let snell2;
let snell_slider20;
let snell_slider21;
let snell_slider22;

let subdiv;
let subdiv_seg;

let rotational_focal_slider;
let rotational_focal;

let box_lens;


let cone_dof;
let cone_dof_slider0;
let cone_dof_slider1;
let cone_dof_slider2;

let field;
let field_slider;

let glass_rays;
let glass_rays_slider_0;
let glass_rays_slider_1;

let wave_glass;

let wave_glass2;
let wave_glass2_slider0;
let wave_glass2_slider1;

(function () {
    let scale = Math.min(2, Math.max(1, (Math.floor(window.devicePixelRatio || 1))));

    let camera_glass_fill = "rgba(130,165,200,0.3)";
    let glass_fill = "rgba(130,165,200,0.04)";
    let glass_stroke = "rgba(32,42,50,0.3)";
    let glass_dark_fill = "rgba(195,247,255,0.04)";
    let glass_dark_stroke = "rgba(132,142,150,0.3)";

    let light_stroke = "#FC5A5A";

    let yellow_style = "#E8A938";
    let blue_style = "#2182C7";
    let black_style = "#333";
    let red_style = "#FF593F";


    let ray_width = 2.0;

    let ray_stroke = "rgba(245, 142, 126, 0.2)";
    let ray_fill = "rgba(245, 142, 126, 0.5)";
    let source_fill = "#FF593F";


    let n_rand_vertices = 512;
    let n_rand_vertices_small = 256;
    let n_disc_vertices_big = 348;

    let n_ray_vertices = 256;
    let n_disc_vertices_small = 40;



    let sphere_r0 = 0.3;
    let sphere_r1 = 0.5;
    let sphere_p0 = [0.7, 0.7, 0.3];
    let sphere_p1 = [-0.7, -0.7, 0.5];


    let base_size = 4.0;

    let rand_vertices = [];
    let out_vertices_small = [];
    let disc_vertices_big = [];
    let ray_vertices = [];
    let disc_vertices_small = [];

    let rand1024 = [];

    var cie_xs = [0.001368, 0.002236, 0.004243, 0.007650, 0.014310, 0.023190, 0.043510, 0.077630, 0.134380, 0.214770, 0.283900, 0.328500, 0.348280, 0.348060, 0.336200, 0.318700, 0.290800, 0.251100, 0.195360, 0.142100, 0.095640, 0.057950, 0.032010, 0.014700, 0.004900, 0.002400, 0.009300, 0.029100, 0.063270, 0.109600, 0.165500, 0.225750, 0.290400, 0.359700, 0.433450, 0.512050, 0.594500, 0.678400, 0.762100, 0.842500, 0.916300, 0.978600, 1.026300, 1.056700, 1.062200, 1.045600, 1.002600, 0.938400, 0.854450, 0.751400, 0.642400, 0.541900, 0.447900, 0.360800, 0.283500, 0.218700, 0.164900, 0.121200, 0.087400, 0.063600, 0.046770, 0.032900, 0.022700, 0.015840, 0.011359, 0.008111, 0.005790, 0.004109, 0.002899, 0.002049, 0.001440, 0.001000, 0.000690, 0.000476, 0.000332];
    var cie_ys = [0.000039, 0.000064, 0.000120, 0.000217, 0.000396, 0.000640, 0.001210, 0.002180, 0.004000, 0.007300, 0.011600, 0.016840, 0.023000, 0.029800, 0.038000, 0.048000, 0.060000, 0.073900, 0.090980, 0.112600, 0.139020, 0.169300, 0.208020, 0.258600, 0.323000, 0.407300, 0.503000, 0.608200, 0.710000, 0.793200, 0.862000, 0.914850, 0.954000, 0.980300, 0.994950, 1.000000, 0.995000, 0.978600, 0.952000, 0.915400, 0.870000, 0.816300, 0.757000, 0.694900, 0.631000, 0.566800, 0.503000, 0.441200, 0.381000, 0.321000, 0.265000, 0.217000, 0.175000, 0.138200, 0.107000, 0.081600, 0.061000, 0.044580, 0.032000, 0.023200, 0.017000, 0.011920, 0.008210, 0.005723, 0.004102, 0.002929, 0.002091, 0.001484, 0.001047, 0.000740, 0.000520, 0.000361, 0.000249, 0.000172, 0.000120];
    var cie_zs = [0.006450, 0.010550, 0.020050, 0.036210, 0.067850, 0.110200, 0.207400, 0.371300, 0.645600, 1.039050, 1.385600, 1.622960, 1.747060, 1.782600, 1.772110, 1.744100, 1.669200, 1.528100, 1.287640, 1.041900, 0.812950, 0.616200, 0.465180, 0.353300, 0.272000, 0.212300, 0.158200, 0.111700, 0.078250, 0.057250, 0.042160, 0.029840, 0.020300, 0.013400, 0.008750, 0.005750, 0.003900, 0.002750, 0.002100, 0.001800, 0.001650, 0.001400, 0.001100, 0.001000, 0.000800, 0.000600, 0.000340, 0.000240, 0.000190, 0.000100, 0.000050, 0.000030, 0.000020, 0.000010, 0.000000, 0.000000, 0.000000, 0.000000, 0.000000, 0.000000, 0.000000, 0.000000, 0.000000, 0.000000, 0.000000, 0.000000, 0.000000, 0.000000, 0.000000, 0.000000, 0.000000, 0.000000, 0.000000, 0.000000, 0.000000];

    var pcs_to_srgb = [
        3.1338561, -1.6168667, -0.4906146,
        -0.9787684, 1.9161415, 0.0334540,
        0.0719453, -0.2289914, 1.4052427,
    ]
    var srgb_to_pcs = mat3_invert(pcs_to_srgb);

    var cie_rgb_to_cie_xyz = [2.768892, 1.751748, 1.130160,
        1.0, 4.590700, 0.060100,
        0, 0.056508, 5.594292];

    var xyz_to_cie_rgb = mat3_invert(cie_rgb_to_cie_xyz);

    function engamma(x) {
        return x < 0.0031308 ? x * 12.92 : (1.055 * Math.pow(x, 1.0 / 2.4) - 0.055);
    }


    function srgb_callback(rgb) {
        rgb = rgb.slice();

        rgb[0] = engamma(rgb[0]);
        rgb[1] = engamma(rgb[1]);
        rgb[2] = engamma(rgb[2]);

        return rgb;
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


    (function () {

        let fi = 0.5 * (1 + Math.sqrt(5));
        let a = (2.0 - fi) * 2.0 * Math.PI;



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

            z = Math.abs(z);

            out_vertices_small.push(vec_scale([x, y, z], z));
        }

        for (let i = 1; i < n_disc_vertices_big; i++) {

            let r = Math.sqrt(i / n_disc_vertices_big);
            let theta = a * i;

            let x = Math.cos(theta) * r;
            let y = Math.sin(theta) * r;



            disc_vertices_big.push([x, y, 0]);
        }

        for (let i = 1; i < n_ray_vertices; i++) {

            let r = 0.93 * Math.sqrt(i / n_ray_vertices);
            let theta = a * i;

            let x = Math.cos(theta) * r;
            let y = Math.sin(theta) * r;

            let jiggle = 0.08;
            x += (Math.random() - 0.5) * jiggle;
            y += (Math.random() - 0.5) * jiggle;

            ray_vertices.push([x, y, 0]);
        }

        for (let i = 1; i < n_disc_vertices_small; i++) {

            let r = Math.sqrt(i / n_disc_vertices_small);
            let theta = a * i;

            let x = Math.cos(theta) * r;
            let y = Math.sin(theta) * r;

            disc_vertices_small.push([x, y, 0]);
        }

        rand_vertices = shuffle(rand_vertices);


        for (let i = 0; i < 1024; i++) {
            rand1024.push(Math.random());
        }

    })();


    function GLDrawer(scale) {

        let canvas = document.createElement("canvas");
        let gl = canvas.getContext('experimental-webgl');

        let iter = 32;

        /* Crude non-mobile GPU detection. */

        if (!window.matchMedia("(hover: none)").matches) {
            iter = 96;
        }

        var viewport_x = 0;
        var viewport_y = 0;
        var viewport_w = 0;
        var viewport_h = 0;

        let vertices = [
            -1.0, -1.0,
            3.0, -1.0,
            -1.0, 3.0,
        ];

        let vertex_buffer = gl.createBuffer();

        gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);


        let point_buffer_n = 100;
        let point_arr = new Float32Array(point_buffer_n * point_buffer_n * 3);

        let point_arr_ptr = 0;
        for (let j = 0; j < point_buffer_n; j++) {
            for (let i = 0; i < point_buffer_n; i++) {
                let x = (i / (point_buffer_n - 1) - 0.5)
                let y = (j / (point_buffer_n - 1) - 0.5)
                let r = Math.sqrt(x * x + y * y);

                point_arr[point_arr_ptr++] = x;
                point_arr[point_arr_ptr++] = y;
                point_arr[point_arr_ptr++] = r;
            }
        }

        let point_buffer = gl.createBuffer();

        gl.bindBuffer(gl.ARRAY_BUFFER, point_buffer);
        gl.bufferData(gl.ARRAY_BUFFER, point_arr, gl.STATIC_DRAW);
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

        let point_vert_src =
            `
    attribute vec3 coordinates;
    uniform highp float t;
    uniform highp mat3 rot;

    varying mediump vec4 color;

    
    void main(void) {
        float r = coordinates.z * 5.0;
        float z = sin(r*10.0 - t);
        vec3 p = vec3(coordinates.xy * 5.5, 0.3 * z/(r+1.0));
        
        p = rot * p;
        
        float g = 1.0 - smoothstep(1.8, 2.5, r);
        float a = 0.3 * g;
        color = vec4(mix(vec3(36.0/255.0, 11.0/255.0, 54.0/255.0), vec3(194.0/255.0, 19.0/255.0, 50.0/255.0), 0.5*z + 0.5)*a, a);

        p *= 1.4;
        float fov_start = 2.4142135624;
        p.z -= 10.0;

        float s = -p.z / fov_start;
        
        
        gl_Position = vec4(p.xy/s, 0.0, 1.0);

        gl_PointSize = 9.0 * g;
    }
    `;

        let point_frag_src =
            `
    varying mediump vec4 color;

    void main(void) {
        mediump vec2 xy = (gl_PointCoord - 0.5);
        mediump float d = 1.0 - sqrt(dot(xy, xy));
        mediump float a = smoothstep(0.4, 0.6, d);
        gl_FragColor = color * a;
    }
    `;



        let preamble =
            `
            precision highp float;

            varying highp vec2 unit;
            
            uniform mat3 rot;

            float RAY_MAX = 1.0e20;

            void ray(out vec3 ray_pos, out vec3 ray_dir, vec2 uv)
            {
                float camera_dist = 9.8;

                float fov_start = 2.4142135624;
                
                vec3 pos = vec3(0.0,0.0,fov_start);

                vec3 dir = normalize(vec3(uv, 0.0) - pos);

                ray_dir = dir * rot;
                ray_pos = (vec3(0,0,camera_dist)) * rot;
            }

            float sat(float x) {
                return min(1.0, max(x, 0.0));
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

            vec3 snell (vec3 ray_org, vec3 ray_dir, vec3  normal, float n1, float n2) {
                vec3 ndir = -ray_dir;
                vec3 perp1 = normal * dot(normal, ndir);
                vec3 tan1 = ndir - perp1;
        
                vec3 tan2 = tan1 * -n1/n2;
                vec3 perp2 = normal * -sqrt(1.0 - dot(tan2, tan2));
        
                return perp2 + tan2;
            }

            float quick_sphere(vec3 ray_org, vec3 ray_dir, vec3 pos, float r2) {
                vec3 oc = ray_org - pos;
                float b = dot(oc, ray_dir);
                float c = dot(oc, oc) - r2;
                float h = b*b - c;
                
                if (h<0.0) return RAY_MAX;

                return -b - sqrt(h);
            }
        `

        let iter_str = "#define ITER " + iter.toFixed(0) + "\n#define ITERF " + iter.toFixed(1) + "\n";

        let world0 =
            `
            float world(vec3 ray_org, vec3 ray_dir, out vec4 color)
            {
                color = vec4(0.0);

                float t = RAY_MAX;

                float base_t = -ray_org.z / ray_dir.z;
                vec2 base_hit = ray_dir.xy * base_t + ray_org.xy;

                float base_width = 2.0;

                const float r0 = 0.3;
                const float r1 = 0.5;
                const vec3 s0 = vec3(0.7, 0.7, 0.3);
                const vec3 s1 = vec3(-0.7, -0.7, 0.5);
                const vec4 c0 = vec4(1.0, 0.1, 0.05, 1.0);
                const vec4 c1 = vec4(0.1, 0.8, 0.05, 1.0);

                if (max(abs(base_hit.x), abs(base_hit.y)) < base_width)
                {
                    vec2 d = base_hit - s0.xy;
                    float f0 = 12.0*dot(d,d);

                    d = base_hit - s1.xy;
                    float f1 = 5.0*dot(d,d);

                    // f0 = 1.0/(f0+1.0);
                    // f1 = 1.0/(f1+1.0);
                    // float f = 1.0 - f0 - f1;

                    float f = (f0*f1 - 1.0)/((f0 + 1.0)*(f1 + 1.0));

                    if (ray_org.z < 0.0)
                        f = 1.0;

                    float s = step(0.5, fract(base_hit.x)) + step(0.5, fract(base_hit.y)) == 1.0 ? 0.54 : 0.66;

                    f *= s;

                    color = vec4(f, f, f, 1.0);

             
                    t = base_t;
                }
            
                float sphere0_t = quick_sphere(ray_org, ray_dir, s0, (r0 * r0));

                if (sphere0_t < t)
                {
                    t = sphere0_t;
                    float z = ray_org.z + ray_dir.z*t;
                    float d = z * (0.5/r0);
                    d = sqrt(d);
                

                    color = c0;
                    color.rgb *= d;
                }

                float sphere1_t = quick_sphere(ray_org, ray_dir, s1, (r1 * r1));

                if (sphere1_t < t)
                {
                    t = sphere1_t;
                    float z = ray_org.z + ray_dir.z*t;
                    float d = z * (0.5/r1);
                    d = sqrt(d);

                    color = c1;
                    color.rgb *= d;
                }
        
                return t;
            }

            `

        let world0_camera =
            `
            void world(vec3 ray_org, vec3 ray_dir, out vec3 color)
            {
                color = vec3(0.9386857285);
      
                const float r0 = 0.3;
                const float r1 = 0.5;
                const vec3 s0 = vec3(0.7, 0.7, 0.3);
                const vec3 s1 = vec3(-0.7, -0.7, 0.5);
                const  vec3 c0 = vec3(1.0, 0.1, 0.05);
                const  vec3 c1 = vec3(0.1, 0.8, 0.05);

                if (ray_dir.z > -0.15 * ray_dir.x)
                    return;

                float test = ray_dir.y;

                ray_dir = normalize(ray_dir);

                float radius = test > 0.0 ? r0 : r1;
                vec3 sphere_pos = test > 0.0 ? s0 : s1;

                float sphere_t = quick_sphere(ray_org, ray_dir, sphere_pos, (radius * radius));

                if (sphere_t != RAY_MAX)
                {
                    vec3 col = test > 0.0 ? c0 : c1;

                    float z = ray_org.z + ray_dir.z*sphere_t;
                    float d = (z * 0.5) / radius;
                    d = sqrt(d);
                    
                    color = col * d;
                }
                else if (ray_dir.z < -0.1) {
                
                    float base_t = -ray_org.z / ray_dir.z;
                    vec2 base_hit = ray_dir.xy * base_t + ray_org.xy;
    
                    float base_width = 2.0;

                    
                    if (max(abs(base_hit.x), abs(base_hit.y)) < base_width)
                    {
                        vec2 d = base_hit - s0.xy;
                        float f0 = 12.0*dot(d,d);

                        d = base_hit - s1.xy;
                        float f1 = 5.0*dot(d,d);

                        // f0 = 1.0/(f0+1.0);
                        // f1 = 1.0/(f1+1.0);
                        // float f = 1.0 - f0 - f1;

                        float f = (f0*f1 - 1.0) / ((f0 + 1.0)*(f1 + 1.0));

                        float s = step(0.5, fract(base_hit.x)) + step(0.5, fract(base_hit.y )) == 1.0 ? 0.54 : 0.66;
                        f *= s;

                        color = vec3(f);
                    }
                }
            }

            `

            let world0floor_camera =
            `
            void world(vec3 ray_org, vec3 ray_dir, out vec3 color)
            {
                color = vec3(0.9386857285);
      
                const float r0 = 0.3;
                const float r1 = 0.5;
                const vec3 s0 = vec3(0.7, 0.7, 0.3);
                const vec3 s1 = vec3(-0.7, -0.7, 0.5);

                float base_t = -ray_org.z / ray_dir.z;
                vec2 base_hit = ray_dir.xy * base_t + ray_org.xy;

                float base_width = 2.0;
                
                if (max(abs(base_hit.x), abs(base_hit.y)) < base_width)
                {
                    vec2 d = base_hit - s0.xy;
                    float f0 = 12.0*dot(d,d);

                    d = base_hit - s1.xy;
                    float f1 = 5.0*dot(d,d);

                    // f0 = 1.0/(f0+1.0);
                    // f1 = 1.0/(f1+1.0);
                    // float f = 1.0 - f0 - f1;

                    float f = (f0*f1 - 1.0) / ((f0 + 1.0)*(f1 + 1.0));

                    float s = step(0.5, fract(base_hit.x)) + step(0.5, fract(base_hit.y )) == 1.0 ? 0.54 : 0.66;
                    f *= s;

                    color = vec3(f);
                }
            }

            `

        let worldb0 =
            `
            float world(vec3 ray_org, vec3 ray_dir, out vec4 color)
            {
                color = vec4(0.0);

                float t = RAY_MAX;

                float base_t = -ray_org.z / ray_dir.z;
                vec2 base_hit = ray_dir.xy * base_t + ray_org.xy;

                float base_width = 2.0;

                float sr = 0.02;
                const float z = 0.75;

                if (max(abs(base_hit.x), abs(base_hit.y)) < base_width)
                {
                    float d = 1.0;
                    float r = 1.0;

                    vec3 c = vec3(0.0);

                    for (int i = 0; i < 5; i++) {
                        vec3 to_light = vec3(d, d, z) - vec3(base_hit, 0.0);

                        float inv_to_light_len = 1.0/(length(to_light));

                        float cos_omega = to_light.z * inv_to_light_len;
                        float sin_sig = sr*inv_to_light_len;
                        c += vec3(100.0*r, 0.0, 100.0*(1.0 - r))*(cos_omega * sin_sig * sin_sig);

                        d -= 0.5;
                        r -= 0.25;
                    }

                    float s = step(0.5, fract(base_hit.x)) + step(0.5, fract(base_hit.y)) == 1.0 ? 0.8 : 1.0;

                    color.rgb = c * s;
                    color.a = 1.0;
                
             
                    t = base_t;
                }

                {
                    float d = 1.0;
                    float r = 1.0;

                    for (int i = 0; i < 5; i++) {
                        float sphere_t = quick_sphere(ray_org, ray_dir, vec3(d, d, z), (sr * sr * 1.5));

                        if (sphere_t < t) {
                            color = vec4(r, 0.0, 1.0 - r, 1.0);
                            t = sphere_t;
                        }

                        d -= 0.5;
                        r -= 0.25;
                    }
                }
            
                return t;
            }

            `

        let worldb0_camera =
            `
            void world(vec3 ray_org, vec3 ray_dir, out vec3 color)
            {
                color = vec3(0.0);

                if (ray_dir.z > 0.15 * ray_dir.x)
                    return;

                ray_dir = normalize(ray_dir);

                float t = RAY_MAX;

                float base_t = -ray_org.z / ray_dir.z;
                vec2 base_hit = ray_dir.xy * base_t + ray_org.xy;

                float base_width = 2.0;

                float sr = 0.02;
                const float z = 0.75;

                if (max(abs(base_hit.x), abs(base_hit.y)) < base_width)
                {
                    float d = 1.0;
                    float r = 0.04;

                    vec3 c = vec3(0.0);

                    for (int i = 0; i < 5; i++) {
                        vec3 to_light = vec3(d, d, z) - vec3(base_hit, 0.0);

                        float inv_to_light_len = 1.0/(length(to_light));

                        float cos_omega = to_light.z * inv_to_light_len;
                        float sin_sig = inv_to_light_len;
                        c += vec3(r, 0.0, (0.04 - r))*(cos_omega * sin_sig * sin_sig);

                        d -= 0.5;
                        r -= (0.25*0.04);
                    }

                    float s = step(0.5, fract(base_hit.x)) + step(0.5, fract(base_hit.y)) == 1.0 ? 0.8 : 1.0;


                    color = c * s;
                         
                    t = base_t;
                }
            }

            `


        let scene_flat_frag_src =
            `
            void main(void) {

                vec4 color = vec4(1.0, 0.0, 0.0, 1.0);

                vec3 ray_org, ray_dir;
                ray(ray_org, ray_dir, unit);
            
                float world_t = world(vec3(unit*3.0, 2.0), vec3(0, 0, -1), color); 

                gl_FragColor = vec4(engamma(color.rgb/color.a)*color.a, color.a);
            }
            `;


        let scene_frag_src =
            `
            void main(void) {
                vec4 color = vec4(1.0, 0.0, 0.0, 1.0);

                vec3 ray_org, ray_dir;
                ray(ray_org, ray_dir, unit);
            
                float world_t = world(ray_org, ray_dir, color); 

                gl_FragColor = vec4(engamma(color.rgb/color.a)*color.a, color.a);
            }
            `;


        let frustum_frag_src =
            `
            uniform float size;
            uniform float plane_x;
            uniform vec3 camera_pos;
    

            void main(void) {
    
                vec4 color = vec4(1.0, 0.0, 0.0, 1.0);

                vec3 ray_org, ray_dir;
                ray(ray_org, ray_dir, unit);

                float dim = 0.0;

            
                float world_t = world(ray_org, ray_dir, color); 

                vec3 hit_p = ray_org + world_t*ray_dir;

                vec3 p = camera_pos;
                vec3 p0 = vec3(plane_x, camera_pos.yz + vec2(size, size));
                vec3 p1 = vec3(plane_x, camera_pos.yz + vec2(size, -size));
                vec3 p2 = vec3(plane_x, camera_pos.yz + vec2(-size, -size));
                vec3 p3 = vec3(plane_x, camera_pos.yz + vec2(-size, size));

                if (dot(hit_p - p, cross(p0 - p, p1 - p)) > 0.0 &&
                    dot(hit_p - p, cross(p1 - p, p2 - p)) > 0.0 &&
                    dot(hit_p - p, cross(p2 - p, p3 - p)) > 0.0 &&
                    dot(hit_p - p, cross(p3 - p, p0 - p)) > 0.0)
                    dim = 1.0;

                
                color *= dim * 0.75 + 0.25;

                gl_FragColor = vec4(engamma(color.rgb/color.a)*color.a, color.a);
            }
            `;


        //https://www.iquilezles.org/www/articles/intersectors/intersectors.htm

        // this shader is UGLY
        let glass_scene_frag_src =
            `
            uniform float d;

            float capIntersect( in vec3 ro, in vec3 rd, in vec3 pa, in vec3 pb, in float ra )
            {
                vec3  ba = pb - pa;
                vec3  oa = ro - pa;
                float baba = dot(ba,ba);
                float bard = dot(ba,rd);
                float baoa = dot(ba,oa);
                float rdoa = dot(rd,oa);
                float oaoa = dot(oa,oa);
                float a = baba      - bard*bard;
                float b = baba*rdoa - baoa*bard;
                float c = baba*oaoa - baoa*baoa - ra*ra*baba;
                float h = b*b - a*c;
                if( h >= 0.0 )
                {
                    float t = (-b-sqrt(h))/a;
                    float y = baoa + t*bard;
                    // body
                    if( y>0.0 && y<baba ) return t;
                    // caps
                    vec3 oc = (y <= 0.0) ? oa : ro - pb;
                    b = dot(rd,oc);
                    c = dot(oc,oc) - ra*ra;
                    h = b*b - c;
                    if( h>0.0 ) return -b - sqrt(h);
                }
                return RAY_MAX;
            }

            vec4 col(vec3 ray_org, vec3 ray_dir) {

                vec4 color = vec4(0,0,0,0);


                float start_org = ray_org.z;
                float base_width = 6.4;
                float base_height = 3.0;

                float n = 1.5;

                float t = RAY_MAX;
                const vec4 stick_color = vec4(1.0, 0.05, 0.02, 1.0);
                const vec4 wall_color = vec4(0.8, 0.8, 0.85, 1.0);

                float wall_hit = 0.0;

                if (start_org < 0.0)
                {
                    float stick_t = capIntersect(ray_org, ray_dir, vec3 (0.0, 3.2, -1.0), vec3 (0.0, -3.2, -1.0), 0.15);
                    if (stick_t < t)
                        return stick_color;
                }
                
                if (start_org > d) {
                    float base_t = (-ray_org.z + d) / ray_dir.z;
                    vec3 base_hit = ray_dir * base_t + ray_org;
        
                    if (abs(base_hit.x) < base_width*0.5 && abs(base_hit.y) < base_height*0.5) {
                        float ray_dirz0 = ray_dir.z;
                        ray_org = ray_org + ray_dir*base_t;
                        ray_dir = snell (ray_org, ray_dir, vec3(0.0,0.0,1.0), 1.0, n);

                        float Rs = (ray_dirz0 - n * ray_dir.z) / (ray_dirz0 + n * ray_dir.z);    
                        float Rp = (ray_dir.z - n * ray_dirz0) / (ray_dir.z + n * ray_dirz0);
    
                        float a = sat(0.5 * (Rs*Rs + Rp * Rp));
                        color = vec4(vec3(0.9386857285 * a), a);
                        color.a += 0.02 * (1.0 - a);
                    }
                }  else if (start_org < 0.0) {
                    float base_t = (-ray_org.z) / ray_dir.z;
                    vec3 base_hit = ray_dir * base_t + ray_org;
        
                    if (abs(base_hit.x) < base_width*0.5 && abs(base_hit.y) < base_height*0.5)
                    {
                        vec3 refl_dir = ray_dir;
                        refl_dir.z *= -1.0;

                        float ray_dirz0 = ray_dir.z;

                        ray_org = ray_org + ray_dir*base_t;
                        ray_dir = snell (ray_org, ray_dir, vec3(0.0,0.0,-1.0), 1.0, n);
                    
                        float Rs = (ray_dirz0 - n * ray_dir.z) / (ray_dirz0 + n * ray_dir.z);    
                        float Rp = (ray_dir.z - n * ray_dirz0) / (ray_dir.z + n * ray_dirz0);

                        float a = 0.5 * (Rs*Rs + Rp*Rp);

                        vec4 c = vec4(vec3(0.9386857285), 1.0);

                        float stick_t = capIntersect(ray_org, refl_dir, vec3 (0.0, 3.2, -1.0), vec3 (0.0, -3.2, -1.0), 0.15);
                        if (stick_t < t)
                            c = stick_color;

                        color = c * a;
                        color.a += 0.02 * (1.0 - a);
                    }
                }

                {
                    float base_t = (-ray_org.x + base_width * 0.5 ) / ray_dir.x;
                    vec3 base_hit = ray_dir * base_t + ray_org;
                    if (base_hit.z > 0.0 && base_hit.z < d && abs(base_hit.y) < base_height*0.5)
                    {
                        color += wall_color * (1.0 - color.a);
                        return color;
                    }
                }

                {
                    float base_t = (-ray_org.x - base_width * 0.5 ) / ray_dir.x;
                    vec3 base_hit = ray_dir * base_t + ray_org;
                    if (base_hit.z > 0.0 && base_hit.z < d && abs(base_hit.y) < base_height*0.5)
                    {
                        color += wall_color * (1.0 - color.a);
                        return color;
                    }
                }

                {
                    float base_t = (-ray_org.y - base_height * 0.5 ) / ray_dir.y;
                    vec3 base_hit = ray_dir * base_t + ray_org;
                    if (base_hit.z > 0.0 && base_hit.z < d && abs(base_hit.x) < base_width*0.5)
                    {
                        color += wall_color * (1.0 - color.a);
                        return color;
                    }
                }

                {
                    float base_t = (-ray_org.y + base_height * 0.5 ) / ray_dir.y;
                    vec3 base_hit = ray_dir * base_t + ray_org;
                    if (base_hit.z > 0.0 && base_hit.z < d && abs(base_hit.x) < base_width*0.5)
                    {
                        color += wall_color * (1.0 - color.a);
                        return color;
                    }
                }

                if (start_org > d) {

                    float base_t = (-ray_org.z) / ray_dir.z;
                    vec3 base_hit = ray_dir * base_t + ray_org;
        
                    if (abs(base_hit.x) < base_width*0.5 && abs(base_hit.y) < base_height*0.5)
                    {
                        ray_org = ray_org + ray_dir*base_t;
                        ray_dir = snell (ray_org, ray_dir, vec3(0.0,0.0,1.0), n, 1.0);
    
                    }

                }  else if (start_org < 0.0) {
                    float base_t = (-ray_org.z + d) / ray_dir.z;
                    vec3 base_hit = ray_dir * base_t + ray_org;
        
                    if (abs(base_hit.x) < base_width*0.5 && abs(base_hit.y) < base_height*0.5) {

                        ray_org = ray_org + ray_dir*base_t;
                        ray_dir = snell (ray_org, ray_dir, vec3(0.0,0.0,-1.0), n, 1.0);

                    }
                }

                if (start_org > 0.0)
                {
                    float stick_t = capIntersect(ray_org, ray_dir, vec3 (0.0, 3.2, -1.0), vec3 (0.0, -3.2, -1.0), 0.15);
                    if (stick_t < t)
                        color += stick_color * (1.0 - color.a);
                }

                return color;
            }
         

            void main(void) {
                gl_FragColor = vec4(0.0);
                if (dot(unit, unit) < 1.0) {
                vec3 ray_org, ray_dir;
                ray(ray_org, ray_dir, unit);

                vec4 color = col(ray_org, ray_dir);
                
                gl_FragColor = vec4(engamma(color.rgb/max(0.001, color.a))*color.a, color.a);
                }
            }
            `;


        let pinhole_frag_src =
            `
            uniform float r;
            uniform float hd;
            uniform float fill;
            uniform vec4 pos_size;

            void main(void) {

                const float a = 2.39996323;
        
                vec3 pos = pos_size.xyz;
                vec3 hole = pos;
                hole.x -= hd;

                pos.yz += unit*pos_size.w;

                vec3 color = vec3(0.0);

                // bulk cosine fallof, the angle difference is small
                float fall = normalize (hole - pos).x;
                fall *= fall;
                fall *= fall;
                
                float fi = 1.0;
                for (int i = 0; i < ITER; i++)
                {
                    float pr = r * sqrt(fi);
                    float theta = a * fi;
                    fi += 1.0;

                    float dy = cos(theta) * pr;
                    float dz = sin(theta) * pr;

                    vec3 hole_spot = hole;
                    hole_spot.y += dy;
                    hole_spot.z += dz;
                    vec3 ray_org = pos;
                    vec3 ray_dir = hole_spot - pos;
        
                    vec3 c;
                    world(ray_org, ray_dir, c); 
                    color += c.rgb;
                }
             
                color *= (fall * fill * (1.0/ITERF));
                gl_FragColor = vec4(engamma(color.rgb), 1.0);
            }
            `;


        let lens_frag_src =
            `
            uniform float fd;
            uniform float hd;
            uniform float ap;
            uniform float focus_dir;
            uniform vec4 pos_size;

            void main(void) {

                const float a = 2.39996323;
                
                vec3 pos = pos_size.xyz;
                vec3 hole = pos;
                hole.x -= hd;

                pos.yz += unit*pos_size.w;

                vec3 color = vec3(0.0);

                float ratio = fd/hd;

                vec3 focus = hole;
                focus.x -= fd;
                focus.yz += unit*ratio*pos_size.w;
                vec3 ray_dir;
                ray_dir.x = focus_dir * (-fd);

                float fi = 1.0;
                for (int i = 0; i < ITER; i++)
                {
                    float pr = ap * sqrt(fi);
                    float theta = a * fi;
                    fi += 1.0;

                    float dy = cos(theta) * pr;
                    float dz = sin(theta) * pr;

                    vec3 hole_spot = hole;
                    hole_spot.y += dy;
                    hole_spot.z += dz;
                
                    ray_dir.yz = focus_dir * (focus.yz - hole_spot.yz);
        
                    vec3 c;
                    world(hole_spot, ray_dir, c); 
                    color += c;
                }
             
                color *= (1.0/ITERF);
                gl_FragColor = vec4(engamma(color.rgb), 1.0);
            }
            `;




        let pinhole_cheap_src =
            `
            uniform float r;
            uniform float hd;
            uniform float cosine;
            uniform vec4 pos_size;

            void main(void) {
        
                vec3 pos = pos_size.xyz;
                vec3 hole = pos;
                hole.x -= hd;

                pos.yz += (-unit)*pos_size.w;

                 vec3 color = vec3(0.0);

                
                float dy = - r;
                float sample = 0.0;
                for (int i = 0; i <3; i++)
                {
                    float dz = - r;
                    for (int j = 0; j <3; j++)
                    {
                        if (dy*dy + dz*dz <= r*r)
                        {
                            sample += 1.0;
                            vec3 hole_spot = hole;
                            hole_spot.y += dy;
                            hole_spot.z += dz;
                            vec3 ray_org = pos;
                            vec3 ray_dir = normalize (hole_spot - pos);
                
                            float vig = cosine == 1.0 ? ray_dir.x : 1.0;
                            vig *= vig;
                            vig *= vig;

                             vec3 c;
                            world(ray_org, ray_dir, c); 
                            color += c * vig;
                            }
                        dz += r;
                    }

                    dy += r;
                }

                color.rgb *= (1.0/sample);
                gl_FragColor = vec4(engamma(color.rgb), 1.0);
            }
            `;



        let wave2d_shader = new Shader(gl,
            point_vert_src,
            point_frag_src,
            ["coordinates"],
            ["rot", "t"]);


        let scene_flat_shader = new Shader(gl,
            base_vert_src,
            preamble + world0 + scene_flat_frag_src,
            ["coordinates"],
            ["aspect"]);



        let scene_shader = new Shader(gl,
            base_vert_src,
            preamble + world0 + scene_frag_src,
            ["coordinates"],
            ["aspect", "rot"]);

        let bokeh_scene_shader = new Shader(gl,
            base_vert_src,
            preamble + worldb0 + scene_frag_src,
            ["coordinates"],
            ["aspect", "rot"]);




        let frustum_shader = new Shader(gl,
            base_vert_src,
            preamble + world0 + frustum_frag_src,
            ["coordinates"],
            ["aspect", "rot", "camera_pos", "plane_x", "size"]);


        let glass_scene_shader = new Shader(gl,
            base_vert_src,
            preamble + glass_scene_frag_src,
            ["coordinates"],
            ["aspect", "rot", "d"]);


        let pinhole_shader = new Shader(gl,
            base_vert_src,
            preamble + iter_str + world0_camera + pinhole_frag_src,
            ["coordinates"],
            ["aspect", "rot", "r", "hd", "fill", "pos_size"]);


        let lens_shader = new Shader(gl,
            base_vert_src,
            preamble + iter_str + world0_camera + lens_frag_src,
            ["coordinates"],
            ["aspect", "rot", "fd", "hd", "ap", "focus_dir", "pos_size"]);

            let lens_floor_shader = new Shader(gl,
                base_vert_src,
                preamble + iter_str + world0floor_camera + lens_frag_src,
                ["coordinates"],
                ["aspect", "rot", "fd", "hd", "ap", "focus_dir", "pos_size"]);


        let bokeh_shader = new Shader(gl,
            base_vert_src,
            preamble + iter_str + worldb0_camera + lens_frag_src,
            ["coordinates"],
            ["aspect", "rot", "fd", "hd", "ap", "focus_dir", "pos_size"]);



        let pinhole_cheap_shader = new Shader(gl,
            base_vert_src,
            preamble + world0_camera + pinhole_cheap_src,
            ["coordinates"],
            ["aspect", "rot", "r", "hd", "pos_size", "cosine"]);


        this.begin = function (width, height) {
            canvas.width = width * scale;
            canvas.height = height * scale;

            gl.disable(gl.BLEND);
            gl.clearColor(0.0, 0.0, 0.0, 0.0);
            gl.clear(gl.COLOR_BUFFER_BIT);
            gl.viewport(0, 0, canvas.width, canvas.height);

            viewport_x = 0;
            viewport_y = 0;
            viewport_w = Math.round(width * scale);
            viewport_h = Math.round(height * scale);
        }

        this.viewport = function (x, y, w, h) {
            gl.viewport(x * scale, y * scale, w * scale, h * scale);

            viewport_x = Math.round(x * scale);
            viewport_y = Math.round(y * scale);
            viewport_w = Math.round(w * scale);
            viewport_h = Math.round(h * scale);
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

            gl.uniform1f(shader.uniforms["aspect"], viewport_w / viewport_h);
        }



        this.draw_wave2d = function (rot, t) {

            gl.useProgram(wave2d_shader.shader);

            gl.bindBuffer(gl.ARRAY_BUFFER, point_buffer);

            gl.enable(gl.BLEND);
            gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

            gl.enableVertexAttribArray(wave2d_shader.attributes["coordinates"]);
            gl.vertexAttribPointer(wave2d_shader.attributes["coordinates"], 3, gl.FLOAT, false, 0, 0);

            gl.uniformMatrix3fv(wave2d_shader.uniforms["rot"], false, mat3_transpose(rot));
            gl.uniform1f(wave2d_shader.uniforms["t"], t);



            gl.drawArrays(gl.POINTS, 0, point_buffer_n * point_buffer_n);

        }



        this.draw_pinhole = function (rot, r, hd, pos, size, fill) {

            let pos_size = pos.slice();
            pos_size.push(size);
            setup_shader(pinhole_shader);
            gl.uniformMatrix3fv(pinhole_shader.uniforms["rot"], false, mat3_transpose(rot));

            gl.uniform1f(pinhole_shader.uniforms["r"], r * Math.sqrt(1.0 / iter));
            gl.uniform1f(pinhole_shader.uniforms["hd"], hd);
            gl.uniform1f(pinhole_shader.uniforms["fill"], fill);
            gl.uniform4fv(pinhole_shader.uniforms["pos_size"], pos_size);

            gl.drawArrays(gl.TRIANGLES, 0, 3);
        }

        this.draw_lens = function (rot, fd, hd, ap, pos, size, clip0, clip1) {

            if (clip0 === undefined)
                clip0 = 0.0;
            if (clip1 === undefined)
                clip1 = 1.0;

            let pos_size = pos.slice();
            pos_size.push(size);
            setup_shader(lens_shader);
            gl.uniformMatrix3fv(lens_shader.uniforms["rot"], false, mat3_transpose(rot));

            gl.uniform1f(lens_shader.uniforms["fd"], fd);
            gl.uniform1f(lens_shader.uniforms["hd"], hd);
            gl.uniform1f(lens_shader.uniforms["ap"], ap * Math.sqrt(1.0 / iter));
            gl.uniform1f(lens_shader.uniforms["focus_dir"], fd < 0.0 ? -1.0 : 1.0);
            gl.uniform4fv(lens_shader.uniforms["pos_size"], pos_size);

            gl.enable(gl.SCISSOR_TEST);

            gl.scissor(viewport_x, viewport_y + Math.floor(viewport_h*clip0), viewport_w, viewport_h*(clip1 - clip0));

            gl.drawArrays(gl.TRIANGLES, 0, 3);
            gl.disable(gl.SCISSOR_TEST);
        }

        this.draw_lens_floor = function (rot, fd, hd, ap, pos, size, clip) {

            if (clip === undefined)
                clip = 1.0;

            let pos_size = pos.slice();
            pos_size.push(size);
            setup_shader(lens_floor_shader);
            gl.uniformMatrix3fv(lens_floor_shader.uniforms["rot"], false, mat3_transpose(rot));

            gl.uniform1f(lens_floor_shader.uniforms["fd"], fd);
            gl.uniform1f(lens_floor_shader.uniforms["hd"], hd);
            gl.uniform1f(lens_floor_shader.uniforms["ap"], ap * Math.sqrt(1.0 / iter));
            gl.uniform1f(lens_floor_shader.uniforms["focus_dir"], fd < 0.0 ? -1.0 : 1.0);
            gl.uniform4fv(lens_floor_shader.uniforms["pos_size"], pos_size);

            gl.enable(gl.SCISSOR_TEST);

            gl.scissor(viewport_x, viewport_y, viewport_w, Math.floor(viewport_h*clip));

            gl.drawArrays(gl.TRIANGLES, 0, 3);
            gl.disable(gl.SCISSOR_TEST);
        }

        this.draw_bokeh_lens = function (rot, fd, hd, ap, pos, size) {

            let pos_size = pos.slice();
            pos_size.push(size);
            setup_shader(bokeh_shader);
            gl.uniformMatrix3fv(bokeh_shader.uniforms["rot"], false, mat3_transpose(rot));

            gl.uniform1f(bokeh_shader.uniforms["fd"], fd);
            gl.uniform1f(bokeh_shader.uniforms["hd"], hd);
            gl.uniform1f(bokeh_shader.uniforms["ap"], ap * Math.sqrt(1.0 / iter));
            gl.uniform1f(bokeh_shader.uniforms["focus_dir"], fd < 0.0 ? -1.0 : 1.0);
            gl.uniform4fv(bokeh_shader.uniforms["pos_size"], pos_size);

            gl.drawArrays(gl.TRIANGLES, 0, 3);
        }

        this.draw_pinhole_cheap = function (rot, r, hd, pos, size, cosine) {

            let pos_size = pos.slice();
            pos_size.push(size);
            setup_shader(pinhole_cheap_shader);
            gl.uniformMatrix3fv(pinhole_cheap_shader.uniforms["rot"], false, mat3_transpose(rot));

            gl.uniform1f(pinhole_cheap_shader.uniforms["r"], r * 0.2);
            gl.uniform1f(pinhole_cheap_shader.uniforms["hd"], hd);
            gl.uniform1f(pinhole_cheap_shader.uniforms["cosine"], cosine);
            gl.uniform4fv(pinhole_cheap_shader.uniforms["pos_size"], pos_size);

            gl.drawArrays(gl.TRIANGLES, 0, 3);
        }

        this.draw_flat_scene = function () {
            setup_shader(scene_flat_shader);

            gl.drawArrays(gl.TRIANGLES, 0, 3);
        }



        this.draw_scene = function (rot) {
            setup_shader(scene_shader);
            gl.uniformMatrix3fv(scene_shader.uniforms["rot"], false, mat3_transpose(rot));

            // gl.drawArrays(gl.TRIANGLES, 0, 3);


            let points = [[-base_size*0.5, -base_size*0.5, 0.0],
                          [+base_size*0.5, -base_size*0.5, 0.0],
                          [+base_size*0.5, +base_size*0.5, 0.0],
                          [-base_size*0.5, +base_size*0.5, 0.0],
                          [-base_size*0.5, -base_size*0.5, sphere_r1*2],
                          [+base_size*0.5, -base_size*0.5, sphere_r1*2],
                          [+base_size*0.5, +base_size*0.5, sphere_r1*2],
                          [-base_size*0.5, +base_size*0.5, sphere_r1*2]];

            let minx = +Infinity;
            let miny = +Infinity;
            let maxx = -Infinity;
            let maxy = -Infinity;


            function ray_project(p) {

                let fov_start = 2.4142135624;
                let camera_dist = 9.8;
                p = p.slice();
                p[2] -= camera_dist;
        
                let z = p[2] / fov_start;
                return [(-p[0] * 0.5 / z + 0.5)*viewport_w + viewport_x,
                        (-p[1] * 0.5/ z + 0.5)*viewport_h + viewport_y,
                         -z];
            }
            
            for (let i = 0; i < 8; i++) {

                let p = ray_project(mat3_mul_vec(rot, points[i]));
                minx = Math.min(minx,p[0]);
                miny = Math.min(miny,p[1]);
                maxx = Math.max(maxx,p[0]);
                maxy = Math.max(maxy,p[1]);
            }

            gl.enable(gl.SCISSOR_TEST);
            gl.uniformMatrix3fv(scene_shader.uniforms["rot"], false, mat3_transpose(rot));

            gl.scissor(minx - 3, miny - 3, maxx - minx + 6, maxy - miny + 6);

            gl.drawArrays(gl.TRIANGLES, 0, 3);

            
            gl.disable(gl.SCISSOR_TEST);
        }

        this.draw_bokeh_scene = function (rot) {
            setup_shader(bokeh_scene_shader);
            gl.uniformMatrix3fv(bokeh_scene_shader.uniforms["rot"], false, mat3_transpose(rot));

            gl.drawArrays(gl.TRIANGLES, 0, 3);
        }


        this.draw_frustum = function (rot, camera_pos, plane_x, size) {
            setup_shader(frustum_shader);
            gl.uniformMatrix3fv(frustum_shader.uniforms["rot"], false, mat3_transpose(rot));
            gl.uniform3fv(frustum_shader.uniforms["camera_pos"], camera_pos);
            gl.uniform1f(frustum_shader.uniforms["plane_x"], plane_x);
            gl.uniform1f(frustum_shader.uniforms["size"], size);


            gl.drawArrays(gl.TRIANGLES, 0, 3);
        }



        this.draw_glass_scene = function (rot, d) {
            setup_shader(glass_scene_shader);
            gl.uniformMatrix3fv(glass_scene_shader.uniforms["rot"], false, mat3_transpose(rot));
            gl.uniform1f(glass_scene_shader.uniforms["d"], d);

            gl.drawArrays(gl.TRIANGLES, 0, 3);
        }

        this.finish = function () {
            gl.flush();
            return gl.canvas;
        }
    }

    let gl = new GLDrawer(scale);


    function sphere_intersect(ray, pos, r) {
        let oc = vec_sub(ray[0], pos);
        let b = vec_dot(oc, ray[1]);
        let c = vec_dot(oc, oc) - r * r;
        let h = b * b - c;

        if (h > 0.0)
            return -b - Math.sqrt(h) * (r > 0.0 ? 1.0 : -1.0);

        return -1.0;
    }

    //https://www.shadertoy.com/view/4lcSRn
    function cylinder_intersect(ray, pa, pb, ra) {
        let ba = vec_sub(pb, pa);
        let oc = vec_sub(ray[0], pa);

        let baba = vec_dot(ba, ba);
        let bard = vec_dot(ba, ray[1]);
        let baoc = vec_dot(ba, oc);

        let k2 = baba - bard * bard;
        let k1 = baba * vec_dot(oc, ray[1]) - baoc * bard;
        let k0 = baba * vec_dot(oc, oc) - baoc * baoc - ra * ra * baba;

        let h = k1 * k1 - k2 * k0;
        if (h < 0.0) return -1.0;
        h = Math.sqrt(h);
        let t = (-k1 - h) / k2;

        let y = baoc + t * bard;
        if (y > 0.0 && y < baba) return t;

        return -1.0;
    }


    function sphere_normal(p, sphere_pos) {
        return vec_norm(vec_sub(p, sphere_pos));
    }

    function plane_intersect(ray, plane) {
        return vec_dot(vec_sub(plane[0], ray[0]), plane[1]) / vec_dot(plane[1], ray[1]);
    }

    function snell(ray, normal, n1, n2) {
        let ndir = vec_scale(ray[1], -1);
        let perp1 = vec_scale(normal, vec_dot(normal, ndir));
        let tan1 = vec_sub(ndir, perp1);

        let sin1 = vec_len(tan1);
        let sin2 = n1 * sin1 / n2;

        if (sin2 > 1) {
            return [[0, 0, 0], [0, 0, 0]];
        }

        let tan2 = vec_scale(tan1, -n1 / n2);
        let perp2 = vec_scale(normal, -Math.sqrt(1 - vec_dot(tan2, tan2)));

        return [ray[0].slice(), vec_add(perp2, tan2)];
    }

    function ray_ray_intersect(ray0, ray1) {
        return vec_cross(vec_sub(ray1[0], ray0[0]), ray1[1])[2] / vec_cross(ray0[1], ray1[1])[2];
    }




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


        var play = document.createElement("div");
        play.classList.add("play_pause_button");
        play.classList.add("playing");

        wrapper.appendChild(canvas);



        container.appendChild(wrapper);




        this.paused = true;

        this.set_paused = function (p) {
            self.paused = p;

            if (self.paused) {
                play.classList.remove("playing");
            }
            else {
                play.classList.add("playing");
                window.requestAnimationFrame(tick);
            }
        }

        this.requested_repaint = false;

        function request_repaint() {
            if (self.paused && !self.requested_repaint) {
                self.requested_repaint = true;
                window.requestAnimationFrame(function () {
                    self.repaint();
                });
            }
        }

        let t = 0;
        let prev_timestamp;

        function tick(timestamp) {


            var rect = canvas.getBoundingClientRect();

            var wh = window.innerHeight || document.documentElement.clientHeight;
            var ww = window.innerWidth || document.documentElement.clientWidth;
            if (!(rect.top > wh || rect.bottom < 0 || rect.left > ww || rect.right < 0)) {



                let dt = 0;
                if (prev_timestamp)
                    dt = (timestamp - prev_timestamp) / 1000;

                t += dt;

                sine_phase += sine_w * dt;

                self.repaint();
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




        let width, height;

        let film_inset = 20.0;

        wrapper.appendChild(canvas);
        container.appendChild(wrapper);


        var drag_div;
        if (mode === "hero" ||
            mode === "detector" ||
            mode === "detector_rgbg" ||
            mode === "detector_rgb" ||
            mode === "bare_film" ||
            mode === "film" ||
            mode === "frustum" ||
            mode === "film_exposure" ||
            mode === "focus_demo" ||
            mode === "basic" ||
            mode === "focus_demo2" ||
            mode === "focus_demo3" ||
            mode === "bokeh" ||
            mode === "lens_solid_angle2") {
            drag_div = document.createElement("div");
            drag_div.classList.add("drag_div");
            drag_div.classList.add("non_selectable");

            drag_div.style.left = "0";
            drag_div.style.top = "0";
            wrapper.appendChild(drag_div);
        }


        if (mode === "em" || mode === "sine" || mode === "wave_glass" || mode === "wave_glass2" || mode === "wave_2d" || mode == "wave_3d" || mode === "wave_rays") {
            wrapper.appendChild(play);
            window.requestAnimationFrame(tick);
        }

        let mvp = ident_matrix.slice();
        mvp = mat3_mul(rot_x_mat3(-1.0), rot_z_mat3(0.7));


        if (mode === "glass_rays" || mode === "prism" || mode === "device" || mode === "rotational" || mode === "focal_length" || mode === "rotational_focal" || mode === "parallel" || mode === "subdiv" || mode === "spherical" || mode === "chromatic")
            mvp = mat3_mul(rot_z_mat3(0), rot_y_mat3(Math.PI * 0.5));
        else if (mode === "cone_aperture" || mode === "cone_dof" || mode === "cone_hex" || mode === "cone_angle" || mode === "cone_slice")
            mvp = mat3_mul(rot_z_mat3(-0.0), rot_y_mat3(Math.PI * 0.4));
        else if (mode === "hole_sharpness")
            mvp = mat3_mul(rot_z_mat3(-0.0), rot_y_mat3(Math.PI * 0.2));
        else if (mode === "wave_glass")
            mvp = mat3_mul(rot_x_mat3(Math.PI * 0.25), mat3_mul(rot_y_mat3(Math.PI * 0.75), rot_z_mat3(-Math.PI * 1)));
        else if (mode === "wave_glass2")
            mvp = mat3_mul(rot_y_mat3(Math.PI * 0.5), rot_z_mat3(-Math.PI * 0.5));
        else if (mode === "glass")
            mvp = rot_y_mat3(-Math.PI * 0.25);
        else if (mode === "rgb_filter")
            mvp = mat3_mul(rot_x_mat3(-1.2), rot_z_mat3(-0.3));
        else if (mode === "pixel_view" || mode === "hole_solid_angle" || mode === "lens_solid_angle" || mode === "lens_solid_angle2")
          mvp = mat3_mul(rot_x_mat3(-1.1), rot_z_mat3(-1.2));

        let arcball = new ArcBall(mvp, function () {
            mvp = arcball.matrix.slice();
            request_repaint();
        });

        function canvas_space(e) {
            let r = canvas.getBoundingClientRect();
            return [width - (e.clientX - r.left), (e.clientY - r.top)];
        }

        let sine_w = 0;
        let sine_phase = 0;
        let no_drag = mode === "snell" ||
                      mode === "snell2" ||
                      mode === "wave_3d" ||
                      mode === "field" ||
                      mode === "field2" ||
                      mode === "sine" ||
                      mode === "blades" ||
                      mode === "f";

        let load_text = mode === "snell" ||
            mode === "snell2" ||
            mode === "rotational_focal" ||
            mode === "focal_length" ||
            mode === "wave_glass2" ||
            mode === "sine" ||
            mode === "em" ||
            mode === "f";


        if (!no_drag) {
            new TouchHandler(drag_div ? drag_div : canvas,

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
                let size = Math.max(width, height) - pad * 2;
                arcball.set_viewport(width / 2 - size / 2 + pad, height / 2 - size / 2 + pad, size, size);

                if (drag_div) {
                    drag_div.style.width = height + "px";
                    drag_div.style.height = height + "px";
                    arcball.set_viewport(height + pad, pad, height - pad * 2, height - pad * 2);
                }

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
            let camera_dist = 9.8;
            p = p.slice();
            p[2] -= camera_dist;

            let z = p[2] / fov_start;
            return [p[0] / z, p[1] / z, -z];
        }

        function ray_project(p) {

            let fov_start = 2.4142135624;
            let camera_dist = 9.8;
            p = p.slice();
            p[2] -= camera_dist;

            let z = p[2] / fov_start;
            p = vec_scale(p, height * 0.5);
            return [p[0] / z, p[1] / z, -z];
        }

        function flat_project(p) {
            p = vec_scale(p, height / 6.0);
            p[1] = -p[1];
            return p;
        }

        let x_flip = [-1, 0, 0, 0, 1, 0, 0, 0, 1];



        function context_add_points(ctx, points, mvp, close, begin) {
            if (begin === undefined || begin)
                ctx.beginPath();

            for (let i = 0; i < points.length; i++) {
                let p = mat3_mul_vec(mvp, points[i]);
                p = ray_project(p);
                if (i != 0 || begin === undefined || begin)
                    ctx.lineTo(p[0], p[1]);
                else
                    ctx.moveTo(p[0], p[1]);
            }
            if (close || close === undefined)
                ctx.closePath();
        }



        function poly_front_facing(poly, proj) {

            poly = poly.slice();

            for (let i = 0; i < poly.length; i++) {
                poly[i] = ray_project(mat3_mul_vec(proj, poly[i]));
            }

            let lsum = 0.0;
            for (let i = 0; i < 4; i++)
                lsum += vec_cross(poly[i], poly[(i + 1) & 3])[2];

            return lsum < 0.0;
        }


        function transform_points(points, mat) {
            for (let i = 0; i < points.length; i++)
                points[i] = mat3_mul_vec(mat, points[i]);
        }

        function scale_points(points, s) {
            for (let i = 0; i < points.length; i++)
                points[i] = (vec_scale(points[i], s));
        }


        function translate_points(points, tr) {
            for (let i = 0; i < points.length; i++)
                points[i] = (vec_add(points[i], tr));
        }

        function circle_points(n) {
            let circle_ps = [];
            for (let i = 0; i < n; i++) {
                let t = 2.0 * Math.PI * i / n;

                circle_ps.push([Math.cos(t), Math.sin(t), 0]);
            }

            return circle_ps;
        }

        function thin_lens_maker(n, r1, r2) {
            return 1 / ((n - 1) * (1 / r1 - 1 / r2));
        }

        this.repaint = function () {

            self.requested_repaint = false;

            let ctx = canvas.getContext("2d");

            let proj_rot = mat3_mul(x_flip, mvp);

            let film_size = 0.2;
            let camera_size = 0.3;
            let camera_mat = ident_matrix;
            let camera_wx = 1.2;
            let camera_pos = [3.6, 0, 0.7];

            function draw_feather() {
                ctx.resetTransform();
                let p = 0.1;

                ctx.globalCompositeOperation = "destination-out";


                let grd;
                grd = ctx.createLinearGradient(0, 0, 0, canvas.height * p);
                grd.addColorStop(0.0, "rgba(0,0,0,1.0)");
                grd.addColorStop(0.2, "rgba(0,0,0,0.9)");
                grd.addColorStop(0.4, "rgba(0,0,0,0.7)");
                grd.addColorStop(0.6, "rgba(0,0,0,0.3)");
                grd.addColorStop(0.8, "rgba(0,0,0,0.1)");
                grd.addColorStop(1.0, "rgba(0,0,0,0.0)");


                ctx.fillStyle = grd;
                ctx.fillRect(0, 0, canvas.width, canvas.height * p);

                grd = ctx.createLinearGradient(0, canvas.height * (1.0 - p), 0, canvas.height);
                grd.addColorStop(1.0, "rgba(0,0,0,1.0)");
                grd.addColorStop(0.8, "rgba(0,0,0,0.9)");
                grd.addColorStop(0.6, "rgba(0,0,0,0.7)");
                grd.addColorStop(0.4, "rgba(0,0,0,0.3)");
                grd.addColorStop(0.2, "rgba(0,0,0,0.1)");
                grd.addColorStop(0.0, "rgba(0,0,0,0.0)");

                ctx.fillStyle = grd;
                ctx.fillRect(0, canvas.height * (1.0 - p), canvas.width, canvas.height * p);

                ctx.globalCompositeOperation = "source-over";
            }


            function draw_film(camera_pos, film_size, camera_mat, wire, thick, flat) {
                ctx.strokeStyle = "rgba(0,0,0,0.1)";

                if (thick)
                    ctx.strokeStyle = "rgba(0,0,0,0.3)";

                let hx = flat ? 0 : 1;
                let film_ps = [[0, -film_size, -film_size * hx],
                [0, -film_size, film_size * hx],
                [0, film_size, film_size * hx],
                [0, film_size, -film_size * hx]];

                transform_points(film_ps, camera_mat);
                translate_points(film_ps, camera_pos);
                context_add_points(ctx, film_ps, proj_rot);



                if (poly_front_facing(film_ps, proj_rot) && !wire) {

                    let hue = 280 * Math.abs(proj_rot[8]) - 10;
                    ctx.fillStyle = "hsla(" + hue + ",100%, 50%, 0.2)";

                    ctx.fill();

                    ctx.fillStyle = "rgba(33, 120, 115, 0.5)";
                    ctx.fill();
                }


                ctx.stroke();
            }

            function draw_camera(camera_pos, film_size, distance, r_pinhole, R_lens, r_aperture, camera_size, camera_mat, color_lens, color_aperture, color_distance, big, wire, flat, dark) {
                ctx.save()

                ctx.lineCap = ctx.lineJoin = "round";

                // ctx.strokeStyle = "rgba(255,255,255,0.2)";
                ctx.strokeStyle = dark ? "rgba(255, 255, 255,0.15)" : "rgba(0,0,0,0.1)";


                let wx = camera_wx;
                let hx = flat ? 0 : 1;
                let box_ps = [
                    [0, -camera_size * wx, -camera_size * hx],
                    [0, -camera_size * wx, camera_size * hx],
                    [0, camera_size * wx, camera_size * hx],
                    [0, camera_size * wx, -camera_size * hx],
                    [-distance, -camera_size * wx, -camera_size * hx],
                    [-distance, -camera_size * wx, camera_size * hx],
                    [-distance, camera_size * wx, camera_size * hx],
                    [-distance, camera_size * wx, -camera_size * hx],
                ];

                transform_points(box_ps, camera_mat);
                translate_points(box_ps, camera_pos);

                let hull_points = box_ps.slice();
                transform_points(hull_points, proj_rot);
                for (let i = 0; i < hull_points.length; i++)
                    hull_points[i] = ray_project(hull_points[i]);

                hull_points = convex_hull(hull_points);
                ctx.beginPath();

                for (let i = 0; i < hull_points.length; i++)
                    ctx.lineTo(hull_points[i][0], hull_points[i][1]);

                ctx.fillStyle = "rgba(0,0,0,0.1)"
                if (!wire)
                    ctx.fill();


                let circle_ps = circle_points(big ? 50 : 20)

                let pinhole_ps = circle_ps.slice();

                transform_points(pinhole_ps, mat3_mul(scale_mat3(r_pinhole), rot_y_mat3(Math.PI * 0.5)));
                translate_points(pinhole_ps, [-distance, 0, 0]);

                transform_points(pinhole_ps, camera_mat);
                translate_points(pinhole_ps, camera_pos);

                if (R_lens == 0) {

                    ctx.save();
                    ctx.globalCompositeOperation = "destination-out";
                    context_add_points(ctx, pinhole_ps, proj_rot);

                    ctx.fillStyle = "rgba(0,0,0,0.5)"
                    ctx.fill();
                    ctx.restore();
                }



                context_add_points(ctx, box_ps.slice(0, 4), proj_rot);
                ctx.stroke();
                context_add_points(ctx, box_ps.slice(4), proj_rot);
                ctx.stroke();


                ctx.save();

                if (color_distance) {
                    ctx.strokeStyle = dark ? "#664a17" : yellow_style;
                    ctx.lineWidth *= 1.5;
                }

                for (let i = 0; i < 4; i++) {
                    context_add_points(ctx, [box_ps[i], box_ps[i + 4]], proj_rot);
                    ctx.stroke();
                }
                ctx.restore();

                draw_film(camera_pos, film_size, camera_mat, wire, flat, flat);
                let base = Math.sqrt(R_lens * R_lens - r_pinhole * r_pinhole);


                if (R_lens != 0.0) {

                    let points = circle_ps.slice();

                    transform_points(points, mat3_mul(scale_mat3(r_pinhole), rot_y_mat3(Math.PI * 0.5)));


                    let arr = big ? disc_vertices_big : disc_vertices_small;
                    for (let i = 0; i < arr.length; i++) {
                        let p = arr[i];
                        p = vec_scale(p, r_pinhole);
                        p[2] += base;
                        p = vec_scale(vec_norm(p), R_lens);
                        p[2] -= base;
                        // p = vec_scale(p, sc);

                        // p = mat3_mul_vec(s, p);
                        p = [p[2], p[1], p[0]]
                        points.push(p);
                        p = p.slice();
                        p[0] *= -1;

                        points.push(p);
                    }


                    for (let i = 0; i < points.length; i++) {
                        let p = points[i].slice();
                        p[0] -= distance;
                        p = mat3_mul_vec(camera_mat, p);
                        p = vec_add(p, camera_pos);
                        p = mat3_mul_vec(proj_rot, p);
                        p = ray_project(p);
                        points[i] = p;
                    }

                    points = convex_hull(points);

                    ctx.fillStyle = camera_glass_fill;


                    ctx.beginPath();
                    for (let i = 0; i < points.length; i++) {
                        let p = points[i];
                        ctx.lineTo(p[0], p[1]);
                    }
                    // ctx.closePath();
                    ctx.fill();


                    ctx.strokeStyle = "#rgba(0,0,0,0.4)";

                    if (color_lens) {
                        ctx.strokeStyle = blue_style;
                        ctx.lineWidth *= 1.5;
                    }


                    ctx.stroke();
                }

                if (r_aperture != 0.0) {

                    let ap_ps = circle_ps.slice();

                    transform_points(ap_ps, mat3_mul(scale_mat3(0.25), rot_y_mat3(Math.PI * 0.5)));
                    translate_points(ap_ps, [-distance + R_lens - base + 0.03, 0, 0]);

                    transform_points(ap_ps, camera_mat);
                    translate_points(ap_ps, camera_pos);


                    let ap_ps2 = circle_ps.slice();

                    transform_points(ap_ps2, mat3_mul(scale_mat3(r_aperture), rot_y_mat3(Math.PI * 0.5)));
                    translate_points(ap_ps2, [-distance + R_lens - base + 0.03, 0, 0]);

                    transform_points(ap_ps2, camera_mat);
                    translate_points(ap_ps2, camera_pos);

                    ctx.fillStyle = "rgba(0,0,0,0.3)"

                    context_add_points(ctx, ap_ps, proj_rot, true);
                    context_add_points(ctx, ap_ps2, proj_rot, true, false);

                    ctx.fill("evenodd");

                    if (color_aperture) {
                        ctx.save();

                        context_add_points(ctx, ap_ps2, proj_rot);


                        ctx.strokeStyle = black_style;
                        ctx.lineWidth *= 1.5;

                        ctx.stroke();

                        ctx.restore();

                    }

                }


                if (R_lens == 0) {
                    if (color_lens) {
                        ctx.strokeStyle = "#333";
                        ctx.lineWidth *= 1.5;
                    }

                    context_add_points(ctx, pinhole_ps, proj_rot);

                    ctx.stroke();
                }


                ctx.restore();
            }

            function draw_film_decoration(dark) {

                ctx.save();
                ctx.globalCompositeOperation = "destination-over";

                ctx.fillStyle = dark ? "#000" : "#f8f8f8";
                ctx.fillRect(film_inset, film_inset, height - 2*film_inset, height - 2*film_inset);
                
                if (!dark) {
                ctx.fillStyle = "#f6f6f6";
                ctx.fillRect(film_inset - 1, film_inset - 1, height - 2*film_inset + 2, height - 2*film_inset + 2);
                }

                let r = 12;

                ctx.fillStyle = dark ? "#ddd" : "#fff";
                ctx.fillRect(film_inset - r, film_inset - r, height - 2*film_inset + 2*r, height - 2*film_inset + 2*r);


                if (!dark) {
                    ctx.shadowBlur=7;
                    ctx.shadowColor="rgba(0,0,0,0.1)";
                    ctx.shadowOffsetY = 4;

                    ctx.fillRect(film_inset - r, film_inset - r, height - 2*film_inset + 2*r, height - 2*film_inset + 2*r);
                }

                ctx.restore();
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

            function add_sphere(proj, pos, r, n) {

                let c = mat3_mul_vec(proj, vec_sub(pos, [0, 0, 0]));

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
            }

            function draw_source(proj, light_pos, r, n, white) {
                ctx.fillStyle = white ? "#fff" : source_fill;

                add_sphere(proj, light_pos, r, n);
                ctx.fill();
            }

            function draw_clock(deg) {

                ctx.globalAlpha = 1.0;

                let clock_r = 15;

                ctx.translate(20, height - 20);
                ctx.strokeStyle = "#bbb";
                ctx.fillStyle = "#bbb";

                ctx.strokeEllipse(0, 0, clock_r);

                ctx.save();
                ctx.strokeStyle = "#666";
                for (let i = 0; i < 24; i++) {
                    ctx.rotate(Math.PI / 12);
                    ctx.beginPath();
                    ctx.lineTo(0, -clock_r + 3);
                    ctx.lineTo(0, -clock_r + 4);
                    ctx.stroke();
                }
                ctx.restore();

                ctx.fillEllipse(0, 0, 1.5);

                ctx.save();
                ctx.strokeStyle = "#eee";

                ctx.rotate(deg);
                ctx.beginPath();
                ctx.lineTo(0, 0);
                ctx.lineTo(0, -clock_r + 4);
                ctx.stroke();
                ctx.restore();

                ctx.lineCap = "butt";
                ctx.lineWidth = 2.;
                ctx.save();
                ctx.beginPath();
                ctx.lineTo(0, -clock_r);
                ctx.lineTo(0, -clock_r - 3);
                ctx.stroke();

                ctx.lineWidth = 3.;

                ctx.rotate(0.8);
                ctx.beginPath();
                ctx.lineTo(0, -clock_r);
                ctx.lineTo(0, -clock_r - 4);
                ctx.stroke();
                ctx.restore();

                ctx.lineWidth = 1.;

                ctx.strokeEllipse(0, -clock_r - 5, 2);
            }


            function draw_lens(R, r, pos, proj, dark, blue) {

                let cn = 90;
                let side0 = circle_points(cn);
                translate_points(side0, pos);

                let base = Math.sqrt(R * R - r * r);
                let base_vec = [0, 0, base];

                let points = [];
                for (let i = 0; i < disc_vertices_big.length; i++) {
                    let p = disc_vertices_big[i];
                    p = p.slice();
                    p[2] += base;
                    p = vec_scale(vec_norm(p), R);
                    p[2] -= base;
                    points.push(vec_add(p, pos));
                    p[2] *= -1;
                    points.push(vec_add(p, pos));
                }



                points = points.concat(side0);

                transform_points(points, proj);

                for (let i = 0; i < points.length; i++) {
                    points[i] = ray_project(points[i]);
                }

                points = convex_hull(points);

                ctx.fillStyle = dark ? glass_dark_fill : glass_fill;
                ctx.strokeStyle = dark ? glass_dark_stroke : glass_stroke;
                ctx.lineWidth = 1.5;


                ctx.beginPath();
                for (let i = 0; i < side0.length; i++) {
                    let p = mat3_mul_vec(proj, side0[i]);
                    p = ray_project(p);
                    ctx.lineTo(p[0], p[1]);
                }
                ctx.closePath();
                ctx.globalAlpha = 0.25;
                ctx.stroke();
                ctx.globalAlpha = 1.0;





                ctx.beginPath();
                for (let i = 0; i < points.length; i++) {
                    let p = points[i];
                    // p = ray_project(p);
                    ctx.lineTo(p[0], p[1]);
                }
                // ctx.closePath();
                ctx.fill();
                if (blue) {
                    ctx.strokeStyle = blue_style;
                    ctx.globalAlpha = 0.5;
                }
                ctx.stroke();
                ctx.globalAlpha = 1.0;

            }


            function draw_scene() {



                let box_ps = [
                    [+base_size * 0.5, +base_size * 0.5, 0],
                    [+base_size * 0.5, -base_size * 0.5, 0],
                    [-base_size * 0.5, -base_size * 0.5, 0],
                    [-base_size * 0.5, +base_size * 0.5, 0],
                ];

                ctx.strokeStyle = "rgba(0,0,0,0.06)";

                context_add_points(ctx, box_ps, proj_rot);
                // ctx.fillStyle = "rgba(200,200,200,0.3)";
                // ctx.fill();
                ctx.stroke();

                add_sphere(proj_rot, sphere_p0, sphere_r0, 50);
                // ctx.fillStyle = "rgba(255, 89, 63,0.3)";
                // ctx.fill();
                ctx.stroke();

                add_sphere(proj_rot, sphere_p1, sphere_r1, 50);
                // ctx.fillStyle = "rgba(89, 231, 62,0.3)";
                // ctx.fill();
                ctx.stroke();
            }



            ctx.resetTransform();
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.scale(scale, scale);
            ctx.lineCap = "round";
            ctx.lineJoin = "round";

            font_size = 21;

            if (window.innerWidth < 500)
                font_size = 18;

            if (window.innerWidth < 400)
                font_size = 16;

            ctx.font = font_size + "px IBM Plex Sans";
            ctx.textAlign = "center";
            ctx.globalAlpha = 1.0;

            if (mode === "detector" || mode === "detector_rgbg" || mode === "detector_rgb") {

                let w = 16;
                let h = 16;
                let d = 2.5;

                let inset = 0.03;
                let stride = 2;

                let rgbg = mode === "detector_rgbg";
                let rgb = mode === "detector_rgb";
                if (rgbg || rgb) {
                    w = h = 32;
                    inset = 0.02;
                    stride = 1;
                }


                let dw = d * 2 / w;
                let dh = d * 2 / h;

                let t = (arg0 + 0.5) * 20.0;

                let z_alpha_0 = 3.0;
                let z_scale = 20.0;


                ctx.lineWidth = 1.0;

                ctx.save();
                ctx.translate(Math.round(height), 0);
                draw_film_decoration(true);

                ctx.translate(film_inset, film_inset);
                ctx.fillStyle = "#ddd";
                ctx.fillRect(0, 0, height - 2 * film_inset, height - 2 * film_inset);

                let pixel_w = Math.floor((height - film_inset) / 32)*32/w;
                let pixel_h = Math.floor((height - film_inset) / 32)*32/w;

                ctx.translate(Math.ceil((height - 2 * film_inset - pixel_w * w) * 0.5),
                    Math.ceil((height - 2 * film_inset - pixel_h * h) * 0.5)
                );

                for (let j = 0; j < h; j++) {
                    for (let i = 0; i < w; i++) {
                        let x = i * pixel_w;
                        let y = j * pixel_h;

                        let color = [0, 0, 0];

                        if (rgbg) {
                            let idx = (j & 1) ? ((i & 1) ? 1 : 0) : ((i & 1) ? 2 : 1);

                            let channel = im32[(i + j * w * stride) * stride * 4 + idx + 1];
                            channel = channel * arg0 * 2.5;
                            channel = Math.sqrt(channel);
                            color[idx] = Math.round(255 * Math.min(1.0, channel));
                        } else if (rgb) {
                            color[0] = Math.round(255 * Math.min(1.0, im32[(i + j * w * stride) * stride * 4 + 1] * arg0 * 2.5));
                            color[1] = Math.round(255 * Math.min(1.0, im32[(i + j * w * stride) * stride * 4 + 2] * arg0 * 2.5));
                            color[2] = Math.round(255 * Math.min(1.0, im32[(i + j * w * stride) * stride * 4 + 3] * arg0 * 2.5));
                        } else {
                            let intensity = im32[(i + j * w * stride) * stride * 4];
                            intensity = intensity * arg0 * 2.5;
                            intensity = Math.sqrt(intensity);
                            let c = 255 * Math.min(1.0, intensity);
                            color[0] = color[1] = color[2] = c;
                        }


                        ctx.fillStyle = "rgb(" + color[0] + "," + color[1] + "," + color[2] + ")";
                        ctx.fillRect(x, y, pixel_w, pixel_h);
                    }
                }

                ctx.restore();





                function fz(i, j) {

                    function inv_frac(x) {
                        return Math.ceil(x) - x;
                    }
                    let rand = rand1024[i + j * w];
                    let intensity = im32[(i + j * w) * stride * 4];

                    let tt = t + rand * z_scale;

                    let z_max = (1.0 - intensity) * z_scale + z_alpha_0;
                    let z = inv_frac(tt / z_max) * z_max;

                    return z;
                }


                function draw_sensor() {

                    ctx.strokeStyle = "#333";

                    let box_ps = [
                        [-d - inset, -d - inset, 0],
                        [-d - inset, d + inset, 0],
                        [d + inset, d + inset, 0],
                        [d + inset, -d - inset, 0],
                    ];

                    context_add_points(ctx, box_ps.slice(0, 4), proj_rot);
                    ctx.stroke();




                    for (let j = 0; j < h; j++) {
                        for (let i = 0; i < w; i++) {
                            let x = -d + i * 2 * d / w + inset;
                            let y = -d + j * 2 * d / h + inset;
                            let z = fz(i, j);

                            let ps = [
                                [x, y, 0],
                                [x, y + dh - 2 * inset, 0],
                                [x + dw - 2 * inset, y + dh - 2 * inset, 0],
                                [x + dw - 2 * inset, y, 0],
                            ];


                            let a = saturate(0.2 - z) * 5.0;

                            if (rgbg || rgb) {
                                let idx = (j & 1) ? ((i & 1) ? 1 : 0) : ((i & 1) ? 2 : 1);
                                let color = [0, 0, 0];
                                color[idx] = 255;
                                ctx.fillStyle = "rgb(" + color[0] + "," + color[1] + "," + color[2] + ")";
                                a = 0.35;
                            } else {
                                ctx.fillStyle = "#ddd";
                            }
                            context_add_points(ctx, ps, proj_rot);
                            if (a > 0) {
                                ctx.globalAlpha = a;
                                ctx.fill();
                                ctx.globalAlpha = 1.0;
                            }

                            if (w == 16)
                                ctx.stroke();
                        }
                    }

                    // context_add_points(ctx, box_ps.slice(0, 4), proj_rot);
                    // ctx.stroke();
                    ctx.globalAlpha = 1.0;
                }

                function draw_photons() {

                    for (let j = 0; j < h; j++) {
                        for (let i = 0; i < w; i++) {
                            let x = -d + (i + 0.5) * 2 * d / w;
                            let y = -d + (j + 0.5) * 2 * d / h;
                            let z = fz(i, j);

                            let a = 0.85* smooth_step(z_alpha_0, 1.5, z);

                            if (a == 0)
                                continue;

                            ctx.globalAlpha = a;

                            let p = [x, y, z];
                            p = mat3_mul_vec(proj_rot, p);
                            p = ray_project(p);

                            let intensity = im32[(i + j * w) * stride * 4];
                            let rand = rand1024[i + j * w];

                            let tt = t + rand * z_scale;

                            // hacky spectrum, no pinks please

                            let max_hue = 280;
                            let prime = 83;
                            let z_max = (1.0 - intensity) * z_scale + z_alpha_0;
                            let hue = ((Math.floor(tt / z_max) + rand * max_hue) * prime) % max_hue - 10;
                            if (hue < 0)
                                hue += 360;


                            ctx.fillStyle = "hsl(" + hue + ",100%, 50%)";
                            ctx.fillEllipse(p[0], p[1], 2.0);
                        }
                    }
                    ctx.globalAlpha = 1.0;



                }

                ctx.save()
                ctx.translate(Math.round(width * 0.25), Math.round(height * 0.5));


                if (mvp[8] > 0.0) {
                    draw_sensor();
                    draw_photons();
                } else {
                    draw_photons();
                    draw_sensor();

                }
                ctx.restore();

                draw_clock(arg0 * 4);

                if (arcball)
                    arcball.set_viewport(height, 0, height, height);

            } else if (mode === "rgb_filter") {

                ctx.lineWidth = 1.0;


                ctx.save()
                ctx.translate(Math.round(width * 0.5), Math.round(height * 0.5));

                let d = 1.0;

                let inset = 0.03;
                let bottom_z = -2;


                let t = (arg0 + 0.5) * 20.0;
                let z_alpha_0 = 4.0;
                let z_scale = 4.0;

                let k = 14;


                function fz(i, j) {

                    function inv_frac(x) {
                        return Math.ceil(x) - x;
                    }
                    let rand = rand1024[i + j * k];


                    let tt = t + rand * z_scale - 12.5;

                    let z_max = + z_alpha_0;

                    if (tt < 0)
                        return z_max;
                    let z = inv_frac(tt / z_max) * z_max;

                    return z;
                }

                ctx.strokeStyle = "rgba(255,255,255,0.2)";

                for (let pane = -1; pane < 2; pane++) {
                    let x = -d + pane * d * 2 + inset;
                    let y = -d + inset;
                    // let z = fz(i, j);

                    let ps = [
                        [x, y, 0],
                        [x, y + d * 2 - 2 * inset, 0],
                        [x + d * 2 - 2 * inset, y + d * 2 - 2 * inset, 0],
                        [x + d * 2 - 2 * inset, y, 0],
                    ];
                    if (pane == -1) ctx.fillStyle = "rgba(255, 0, 0, 0.3)";
                    else if (pane == 0) ctx.fillStyle = "rgba(0, 255, 0, 0.3)";
                    else if (pane == 1) ctx.fillStyle = "rgba(0, 0, 255, 0.3)";
                    context_add_points(ctx, ps, proj_rot);
                    ctx.fill();
                    ctx.stroke();

                    translate_points(ps, [0, 0, bottom_z]);
                    context_add_points(ctx, ps, proj_rot);
                    ctx.stroke();
                }


                for (let pane = -1; pane < 2; pane++) {
                    for (let j = 0; j < k; j++) {
                        for (let i = 0; i < k; i++) {
                            let x = -d + inset + (i + 0.5) * 2 * (d - inset) / k + pane * d * 2;
                            let y = -d + inset + (j + 0.5) * 2 * (d - inset) / k;
                            let z = fz(i + (pane + 1) * 256, j);

                            let a = 0.85 * smooth_step(z_alpha_0, 0 - bottom_z + 0.5, z);

                            z += bottom_z;

                            if (a == 0)
                                continue;

                            ctx.globalAlpha = a;

                            let p = [x, y, z];
                            p = mat3_mul_vec(proj_rot, p);
                            p = ray_project(p);

                            let rand = rand1024[i + (pane + 1) * 256 + j * k];

                            let tt = t + rand * z_scale - 12.5;

                            let max_hue = 280;
                            let prime = 83;
                            let z_max = z_alpha_0;
                            let hue = ((Math.floor(tt / z_max) + rand * max_hue) * prime) % max_hue;

                            hue = smooth_step(0, max_hue, hue) * max_hue - 10;


                            if (z <= 0.0) {
                                if (pane == -1) {
                                    if (hue < -10 || hue > 50)
                                        continue;
                                } else if (pane == 0) {
                                    if (hue < 50 || hue > 170)
                                        continue;
                                }
                                else if (pane == 1) {
                                    if (hue < 170 || hue > 280)
                                        continue;
                                }
                            }
                            if (hue < 0)
                                hue += 360;

                            ctx.fillStyle = "hsla(" + hue + ",100%, 50%, 0.8)";
                            ctx.fillEllipse(p[0], p[1], 2.0);
                        }
                    }
                }

                ctx.globalAlpha = 1.0;

                ctx.restore();

                draw_clock(arg0 * 4);


            } else if (mode === "bayer") {

                let w = 2;
                let h = 2;

                ctx.lineWidth = 1.0;

                ctx.strokeStyle = "#333";

                ctx.save()
                ctx.translate(Math.round(width * 0.5), Math.round(height * 0.5));

                let d = 2.5;

                let inset = 0.03;

                let box_ps = [
                    [-d - inset, -d - inset, 0],
                    [-d - inset, d + inset, 0],
                    [d + inset, d + inset, 0],
                    [d + inset, -d - inset, 0],
                ];

                context_add_points(ctx, box_ps.slice(0, 4), proj_rot);
                ctx.stroke();

                let dw = d * 2 / w;
                let dh = d * 2 / h;


                ctx.fillStyle = "#ddd";

                for (let j = 0; j < h; j++) {
                    for (let i = 0; i < w; i++) {
                        let x = -d + i * 2 * d / w + inset;
                        let y = -d + j * 2 * d / h + inset;

                        let ps = [
                            [x, y, 0],
                            [x, y + dh - 2 * inset, 0],
                            [x + dw - 2 * inset, y + dh - 2 * inset, 0],
                            [x + dw - 2 * inset, y, 0],
                        ];
                        context_add_points(ctx, ps, proj_rot);

                        let color = [0, 0, 0];

                        let idx = (j & 1) ? ((i & 1) ? 1 : 0) : ((i & 1) ? 2 : 1);
                        color[idx] = 180;

                        ctx.fillStyle = "rgba(" + color[0] + "," + color[1] + "," + color[2] + ",0.75)";
                        ctx.fill();
                    }
                }

                context_add_points(ctx, box_ps.slice(0, 4), proj_rot);
                ctx.stroke();

            } else if (mode === "field") {

                let r = 0.001;
                let hd = 0.45 + arg0 * 0.6;

                mvp = ident_matrix;
                proj_rot = mat3_mul(x_flip, mvp);

                let flat_pos = camera_pos.slice();
                flat_pos[2] = 0;
                let hole = vec_add(flat_pos, [-hd, 0, 0]);


                gl.begin(height, height);

                gl.draw_flat_scene();
                ctx.translate(-Math.round(width * 0.05), 0);

                ctx.drawImage(gl.finish(), 0, 0, height, height);

                ctx.translate(Math.round(width * 0.25), Math.round(height * 0.5));


                function draw() {
                    for (let i = 0; i < 2; i++) {
                        let sphere_pos = i == 0 ? sphere_p0 : sphere_p1;
                        sphere_pos = sphere_pos.slice();
                        sphere_pos[2] = 0;
                        let sphere_r = (i == 0 ? sphere_r0 : sphere_r1);

                        let sphere_vec = vec_sub(sphere_pos, hole);
                        let sphere_dir = vec_norm(sphere_vec);
                        let sphere_hit_dist = Math.sqrt(vec_len_sq(sphere_vec) - sphere_r * sphere_r);

                        let a = Math.atan2(sphere_r, sphere_hit_dist);
                        let hit0_dir = mat3_mul_vec(rot_z_mat3(a * 0.98), sphere_dir);
                        let hit1_dir = mat3_mul_vec(rot_z_mat3(-a), sphere_dir);

                        let hit0 = vec_add(hole, vec_scale(hit0_dir, sphere_hit_dist));
                        let hit1 = vec_add(hole, vec_scale(hit1_dir, sphere_hit_dist));

                        let sens0 = vec_add(hole, vec_scale(hit0_dir, plane_intersect([hole, hit0_dir], [flat_pos, [-1, 0, 0]])));
                        let sens1 = vec_add(hole, vec_scale(hit1_dir, plane_intersect([hole, hit1_dir], [flat_pos, [-1, 0, 0]])));

                        let p;
                        ctx.beginPath();
                        p = flat_project(hit0);
                        ctx.lineTo(p[0], p[1]);
                        p = flat_project(sens0);
                        ctx.lineTo(p[0], p[1]);
                        p = flat_project(sens1);
                        ctx.lineTo(p[0], p[1]);
                        p = flat_project(hit1);
                        ctx.lineTo(p[0], p[1]);

                        ctx.fillStyle = i == 0 ? "rgba(255, 89, 63,0.4)" : "rgba(89, 231, 62,0.4)"
                        ctx.strokeStyle = i == 0 ? "rgba(255, 89, 63,0.7)" : "rgba(89, 231, 62,0.7)"
                        ctx.fill();

                        ctx.beginPath();
                        p = flat_project(hit0);
                        ctx.lineTo(p[0], p[1]);
                        p = flat_project(sens0);
                        ctx.lineTo(p[0], p[1]);
                        ctx.stroke();

                        ctx.beginPath();
                        p = flat_project(hit1);
                        ctx.lineTo(p[0], p[1]);
                        p = flat_project(sens1);
                        ctx.lineTo(p[0], p[1]);
                        ctx.stroke();
                    }



                    let endp = [];
                    let startp = [];

                    let plane_x = -2.0;

                    let s0 = flat_project(vec_add(flat_pos, [0, film_size, 0]));
                    let s1 = flat_project(vec_add(flat_pos, [0, -film_size, 0]));


                    let c0 = flat_project(vec_add(flat_pos, [0, camera_size * camera_wx, 0]));
                    let c1 = flat_project(vec_add(flat_pos, [0, -camera_size * camera_wx, 0]));
                    let c2 = flat_project(vec_add(hole, [0, camera_size * camera_wx, 0]));
                    let c3 = flat_project(vec_add(hole, [0, -camera_size * camera_wx, 0]));


                    for (let j = -1; j < 2; j += 2) {
                        let y = film_size * j;
                        let start = vec_add(flat_pos, [0, y, 0]);

                        let ray = [start, vec_norm(vec_sub([-hd, 0, 0], [0, y, 0]))];

                        let t = plane_intersect(ray, [[plane_x, 0, 0], [-1, 0, 0]]);
                        let hit = vec_add(ray[0], vec_scale(ray[1], t));

                        hit[2] = 0;
                        start[2] = 0;

                        endp.push(hit);
                        startp.push(start);
                    }

                    ctx.save();
                    ctx.beginPath();
                    ctx.rect(-width, -height, width * 2, height * 2);

                    let p = flat_project(startp[0]);
                    ctx.moveTo(p[0], p[1]);
                    p = flat_project(startp[1]);
                    ctx.lineTo(p[0], p[1]);
                    p = flat_project(endp[1]);
                    ctx.lineTo(p[0], p[1]);
                    p = flat_project(endp[0]);
                    ctx.lineTo(p[0], p[1]);
                    ctx.closePath();
                    ctx.fillStyle = "rgba(0,0,0,0.6)";
                    ctx.globalCompositeOperation = "destination-out";
                    ctx.fill("evenodd");


                    ctx.fillStyle = "rgba(0,0,0,1)";
                    ctx.fillRect(c3[0],c3[1],200, 200);
                    ctx.fillRect(c2[0],c2[1] - 200,200, 200);

                    ctx.globalCompositeOperation = "source-over";


                    ctx.strokeStyle = "rgba(0,0,0,0.3)";

                    for (let i = 0; i < 2; i++) {
                        let p0 = flat_project(startp[i]);
                        let p1 = flat_project(endp[i]);
                        ctx.beginPath();
                        ctx.lineTo(p0[0], p0[1]);
                        ctx.lineTo(p1[0], p1[1]);
                        ctx.stroke();
                    }
                    ctx.restore();

                  


                    ctx.save();
                    ctx.lineCap = "square";


                    ctx.strokeStyle = "#ddd";
                    ctx.beginPath();
                    ctx.lineTo(c0[0], c0[1]);
                    ctx.lineTo(c1[0], c1[1]);
                    ctx.stroke();

                    ctx.beginPath();
                    ctx.lineTo(c2[0], c2[1]);
                    ctx.lineTo(c3[0], c3[1]);
                    ctx.stroke();

                    ctx.strokeStyle = "#333";

                    ctx.beginPath();
                    ctx.lineTo(s0[0], s0[1]);
                    ctx.lineTo(s1[0], s1[1]);
                    ctx.stroke();


                    ctx.fillStyle = "#555";

                    p = flat_project(hole);

                    ctx.beginPath();
                    ctx.lineTo(p[0], p[1] - 0.25);
                    ctx.lineTo(p[0], p[1] + 0.25);
                    ctx.stroke();

                    ctx.lineWidth *= 1.5;

                    ctx.strokeStyle = yellow_style;
                    ctx.beginPath();
                    ctx.lineTo(c2[0], c2[1]);
                    ctx.lineTo(c0[0], c0[1]);
                    ctx.stroke();

                    ctx.beginPath();
                    ctx.lineTo(c1[0], c1[1]);
                    ctx.lineTo(c3[0], c3[1]);
                    ctx.stroke();

                    ctx.restore();

                }

                draw();

                let zr = Math.floor(height * 0.4);
                let sc = 5.2;

                let tx = Math.round(width * 0.57);
                let tx0 = flat_project(vec_sub(flat_pos, [0.225, 0, 0]))[0];

                ctx.save();

                ctx.translate(tx, 0);


                ctx.beginPath();
                ctx.rect(-zr, -zr, 2 * zr, 2 * zr);

                ctx.clip();
                ctx.save();

                ctx.scale(sc, sc);
                ctx.translate(-tx0, 0);
                ctx.lineWidth = 2.0 / sc;
                draw();
                ctx.restore();


                ctx.globalCompositeOperation = "destination-in";
                ctx.fillStyle = "#000";
                ctx.fillEllipse(0, 0, zr);
                ctx.restore();


                ctx.setLineDash([2, 2]);


                let r1 = zr;
                let r0 = zr / sc;
                var d = tx - tx0;
                var cos = (r1 - r0) / d;
                var sin = Math.sqrt(1 - cos * cos);

                ctx.strokeStyle = "rgba(0,0,0,0.2)";

                ctx.beginPath();
                ctx.moveTo(tx - r1 * cos, - sin * r1,);
                ctx.lineTo(tx0 - r0 * cos, - sin * r0,);
                ctx.stroke();


                ctx.beginPath();
                ctx.moveTo(tx - r1 * cos, sin * r1,);
                ctx.lineTo(tx0 - r0 * cos, sin * r0,);
                ctx.stroke();

                ctx.setLineDash([]);

                ctx.strokeStyle = "rgba(0,0,0,0.4)";
                ctx.strokeEllipse(tx0, 0, zr / sc);

                ctx.strokeStyle = "#888";
                ctx.strokeEllipse(tx, 0, zr);


            } else if (mode === "field2") {

                let r = 0.001;
                let hd = 0.45 + arg0 * 0.6;
                let f = 0.4 + arg1 * 0.7;
                let ap = 0.15

                mvp = ident_matrix;
                proj_rot = mat3_mul(x_flip, mvp);

                let flat_pos = camera_pos.slice();
                flat_pos[2] = 0;
                let hole = vec_add(flat_pos, [-hd, 0, 0]);


                gl.begin(height, height);

                gl.draw_flat_scene();
                ctx.translate(-Math.round(width * 0.05), 0);

                ctx.drawImage(gl.finish(), 0, 0, height, height);

                ctx.translate(Math.round(width * 0.25), Math.round(height * 0.5));


                function draw() {

                    let endp = [];
                    let startp = [];

                    let plane_x = -2.0;


                    for (let j = -1; j < 2; j += 2) {
                        let y = film_size * j;
                        let start = vec_add(flat_pos, [0, y, 0]);

                        let ray = [start, vec_norm(vec_sub([-hd, 0, 0], [0, y, 0]))];

                        let t = plane_intersect(ray, [[plane_x, 0, 0], [-1, 0, 0]]);
                        let hit = vec_add(ray[0], vec_scale(ray[1], t));

                        hit[2] = 0;
                        start[2] = 0;

                        endp.push(hit);
                        startp.push(start);
                    }

                    let a0 = flat_project(vec_add(hole, [0, ap, 0]));
                    let a1 = flat_project(vec_add(hole, [0, -ap, 0]));

                    let s0 = flat_project(vec_add(flat_pos, [0, film_size, 0]));
                    let s1 = flat_project(vec_add(flat_pos, [0, -film_size, 0]));


                    let c0 = flat_project(vec_add(flat_pos, [0, camera_size * camera_wx, 0]));
                    let c1 = flat_project(vec_add(flat_pos, [0, -camera_size * camera_wx, 0]));
                    let c2 = flat_project(vec_add(hole, [0, camera_size * camera_wx, 0]));
                    let c3 = flat_project(vec_add(hole, [0, -camera_size * camera_wx, 0]));


                    ctx.save();

                    ctx.globalCompositeOperation = "destination-out";

                    let angle = Math.atan2(film_size, hd);
                    {
                        ctx.save();

                        let p = flat_project(hole);
                        ctx.translate(p[0], p[1]);
                        ctx.rotate(angle);

                        let s = width * 0.012;


                        let grd = ctx.createLinearGradient(0, -s, 0, s);
                        grd.addColorStop(0, "rgba(0,0,0,0.6)");
                        grd.addColorStop(1, "rgba(0,0,0,0)");

                        ctx.fillStyle = grd;
                        ctx.fillRect(-width, -s - height, width, height + 2 * s);

                        ctx.rotate(-2 * angle);
                        ctx.scale(1, -1);

                        ctx.fillRect(-width, -s - height, width, height + 2 * s);

                        ctx.restore();
                    }


                    ctx.globalCompositeOperation = "source-over";


                    ctx.strokeStyle = "rgba(0,0,0,0.1)";

                    for (let i = 0; i < 2; i++) {
                        let p0 = flat_project(startp[i]);
                        let p1 = flat_project(hole);
                        ctx.beginPath();
                        ctx.lineTo(p0[0], p0[1]);
                        ctx.lineTo(p1[0], p1[1]);
                        ctx.stroke();
                    }


                    {
                        let c0 = vec_add(flat_pos, [0, film_size, 0]);
                        let d0 = vec_sub(c0, hole);
                        let c1 = vec_add(flat_pos, [0, -film_size, 0]);
                        let d1 = vec_sub(c1, hole);


                        let f_pos0 = flat_project(vec_add(hole, vec_scale(d0, f / hd)));
                        let f_pos1 = flat_project(vec_add(hole, vec_scale(d1, f / hd)));
                        for (let i = 0; i <= 10; i++) {
                            let t = (i - 5) / 5.0;


                            {
                                ctx.strokeStyle = "rgba(0,0,0,0.3)";

                                let p = flat_project(vec_add(hole, [0, t * ap, 0]));
                                // ctx.beginPath();
                                // ctx.lineTo(p[0], p[1]);
                                // ctx.lineTo(f_pos0[0], f_pos0[1]);
                                // ctx.stroke();

                        

                                let inf = flat_project(vec_add(vec_add(hole, [0, t * ap, 0]), vec_scale(d0, -15.0)));
                                ctx.beginPath();
                                ctx.lineTo(p[0], p[1]);
                                ctx.lineTo(inf[0], inf[1]);
                                ctx.stroke();

                                // ctx.strokeStyle = "rgba(0,0,0,0.07)";

                                {
                                    let dir = vec_add(f_pos0, vec_scale(vec_sub(f_pos0, p), 2.5));
                                    ctx.beginPath();
                                    ctx.lineTo(p[0], p[1]);
                                    ctx.lineTo(dir[0], dir[1]);
                                    ctx.stroke();
                                }
                            }

                          

                            {
                                ctx.strokeStyle = "rgba(0,0,0,0.3)";

                                let p = flat_project(vec_add(hole, [0, t * ap, 0]));
                                // ctx.beginPath();
                                // ctx.lineTo(p[0], p[1]);
                                // ctx.lineTo(f_pos1[0], f_pos1[1]);
                                // ctx.stroke();

                                let inf = flat_project(vec_add(vec_add(hole, [0, t * ap, 0]), vec_scale(d1, -15.0)));
                                ctx.beginPath();
                                ctx.lineTo(p[0], p[1]);
                                ctx.lineTo(inf[0], inf[1]);
                                ctx.stroke();

                                // ctx.strokeStyle = "rgba(0,0,0,0.07)";

                                {
                                    let dir = vec_add(f_pos1, vec_scale(vec_sub(f_pos1, p), 2.5));
                                    ctx.beginPath();
                                    ctx.lineTo(p[0], p[1]);
                                    ctx.lineTo(dir[0], dir[1]);
                                    ctx.stroke();
                                }
                            }
                        }


                        ctx.globalCompositeOperation = "destination-out";
                        ctx.fillStyle = "#fff";
                        let p = flat_project([-2, 0, 0]);

                        ctx.fillRect(-width, -height, width + p[0], 2 * height);

                        p = flat_project(flat_pos);

                        ctx.fillRect(p[0], -height, width, 2 * height);

                 
    
                        ctx.fillRect(c3[0],c3[1],200, 200);
                        ctx.fillRect(c2[0],c2[1] - 200,200, 200);
    
                

                        ctx.globalCompositeOperation = "source-over";


                    }

                    ctx.restore();

                   

                    ctx.save();
                    ctx.lineCap = "square";


                    ctx.strokeStyle = "#ddd";
                    ctx.beginPath();
                    ctx.lineTo(c0[0], c0[1]);
                    ctx.lineTo(c1[0], c1[1]);
                    ctx.stroke();

                    ctx.beginPath();
                    ctx.lineTo(c2[0], c2[1]);
                    ctx.lineTo(a0[0], a0[1]);
                    ctx.stroke();

                    ctx.beginPath();
                    ctx.lineTo(c3[0], c3[1]);
                    ctx.lineTo(a1[0], a1[1]);
                    ctx.stroke();

                    ctx.strokeStyle = "#333";

                    ctx.beginPath();
                    ctx.lineTo(s0[0], s0[1]);
                    ctx.lineTo(s1[0], s1[1]);
                    ctx.stroke();

{
                    ctx.strokeStyle = blue_style;
                    ctx.fillStyle = "rgba(130,165,200,0.3)";

                    let R = 0.6 + arg1 ;
                    let base = Math.sqrt(R * R - ap * ap);
                    let angle = Math.atan2(ap, R);

                    ctx.beginPath();
                    for (let i = 0; i <= 10; i++) {
                        let t= (i - 5)/5;
                        let p = vec_add(hole, [base, 0, 0]);
                        p[0] -= R * Math.cos(angle*t);
                        p[1] += R * Math.sin(angle*t);
                        p = flat_project(p);
                        ctx.lineTo(p[0], p[1]);
                    }
                    for (let i = 0; i <= 10; i++) {
                        let t= (i - 5)/5;
                        let p = vec_add(hole, [-base, 0, 0]);
                        p[0] += R * Math.cos(angle*t);
                        p[1] -= R * Math.sin(angle*t);
                        p = flat_project(p);
                        ctx.lineTo(p[0], p[1]);
                    }
                    ctx.fill();
                    ctx.stroke();
                }

                    ctx.lineWidth *= 1.5;

                    ctx.strokeStyle = yellow_style;
                    ctx.beginPath();
                    ctx.lineTo(c2[0], c2[1]);
                    ctx.lineTo(c0[0], c0[1]);
                    ctx.stroke();

                    ctx.beginPath();
                    ctx.lineTo(c1[0], c1[1]);
                    ctx.lineTo(c3[0], c3[1]);
                    ctx.stroke();

                    ctx.restore();

                }

                draw();

                let zr = Math.floor(height * 0.4);
                let sc = 5.2;

                let tx = Math.round(width * 0.57);
                let tx0 = flat_project(vec_sub(flat_pos, [0.225, 0, 0]))[0];

                ctx.save();

                ctx.translate(tx, 0);


                ctx.beginPath();
                ctx.rect(-zr, -zr, 2 * zr, 2 * zr);

                ctx.clip();
                ctx.save();

                ctx.scale(sc, sc);
                ctx.translate(-tx0, 0);
                ctx.lineWidth = 2.0 / sc;
                draw();
                ctx.restore();


                ctx.globalCompositeOperation = "destination-in";
                ctx.fillStyle = "#000";
                ctx.fillEllipse(0, 0, zr);
                ctx.restore();


                ctx.setLineDash([2, 2]);


                let r1 = zr;
                let r0 = zr / sc;
                var d = tx - tx0;
                var cos = (r1 - r0) / d;
                var sin = Math.sqrt(1 - cos * cos);

                ctx.strokeStyle = "rgba(0,0,0,0.2)";

                ctx.beginPath();
                ctx.moveTo(tx - r1 * cos, - sin * r1,);
                ctx.lineTo(tx0 - r0 * cos, - sin * r0,);
                ctx.stroke();


                ctx.beginPath();
                ctx.moveTo(tx - r1 * cos, sin * r1,);
                ctx.lineTo(tx0 - r0 * cos, sin * r0,);
                ctx.stroke();

                ctx.setLineDash([]);

                ctx.strokeStyle = "rgba(0,0,0,0.4)";
                ctx.strokeEllipse(tx0, 0, zr / sc);

                ctx.strokeStyle = "#888";
                ctx.strokeEllipse(tx, 0, zr);


            } else if (mode === "scene") {


                gl.begin(width, height);
                gl.viewport(-width * 0.2, -height * 0.2, width * 1.4, height * 1.4);

                gl.draw_scene(mvp);
                ctx.drawImage(gl.finish(), 0, 0, width, height);


            } else if (mode === "blades") {


                function draw_blade() {

                    ctx.save();

                    ctx.translate(71, 25);

                    ctx.rotate(-0.3490658503988659);
                    ctx.translate(-71, -25);
                    ctx.translate(-158, -189);

                    ctx.fillStyle = "#111";
                    ctx.strokeStyle = "#777";

                    ctx.beginPath();
                    ctx.moveTo(89.4010224, 104.878569);
                    ctx.bezierCurveTo(89.2014641, 59.0393448, 52.2406566, 21.8785692, 6.40102238, 21.8785692);
                    ctx.bezierCurveTo(-0.598977616, 21.8785692, -3.54240333, 14.8213764, 6.40102238, 10.3785692);
                    ctx.bezierCurveTo(29.9010224, -0.121430803, 60.1944849, -2.5577938, 85.1944849, 4.4422062);
                    ctx.bezierCurveTo(106.455278, 10.3952284, 130.17673, 17.6283113, 144.389943, 43.5465243);
                    ctx.bezierCurveTo(161.389943, 74.5465243, 150.901934, 94.6590605, 155.901022, 116.878569);
                    ctx.bezierCurveTo(162.227448, 144.997707, 171.289513, 153.053505, 176.736821, 156.416713);
                    ctx.bezierCurveTo(183.731851, 160.735498, 184.243043, 167.938877, 181.743043, 172.438877);
                    ctx.bezierCurveTo(179.243043, 176.938877, 173.80372, 180.55601, 166.350116, 177.644439);
                    ctx.bezierCurveTo(157.688987, 174.261179, 122.055011, 166.31114, 109.41407, 154.260969);
                    ctx.bezierCurveTo(103.684297, 148.798975, 89.5544242, 140.115494, 89.4010224, 104.878569);
                    ctx.closePath();
                    ctx.fill("evenodd");
                    ctx.stroke();

                    ctx.fillStyle = "#333";
                    ctx.strokeStyle = "#777";
                    ctx.beginPath();
                    ctx.arc(171, 166, 4, 0, 6.283185307179586, false);
                    ctx.closePath();
                    ctx.fill("evenodd");
                    ctx.stroke();
                    ctx.restore();
                }

                ctx.translate(Math.round(width * 0.5), Math.round(height * 0.5));

                let s = width / 400;
                ctx.scale(s, s);
                ctx.lineWidth = 1 / s;

                let a = -arg0 * 0.45;

                ctx.fillStyle = "#222";
                ctx.strokeStyle = "#000";
                ctx.fillEllipse(0, 0, 194);
                ctx.strokeEllipse(0, 0, 194);

                ctx.globalCompositeOperation = "destination-out";
                ctx.fillEllipse(0, 0, 85);
                ctx.globalCompositeOperation = "source-over";

                let phase = [1, 2, 4, 5];
                for (let k = 0; k < 4; k++) {

                    ctx.save();

                    ctx.rotate(Math.PI * 0.5 * k)
                    ctx.beginPath();
                    ctx.rect(-2000, 0, 2000, 2000);
                    ctx.clip();

                    for (let i = 0; i < 6; i++) {
                        ctx.save();
                        ctx.rotate((i + phase[k]) * Math.PI * 1.0 / 3.0 - Math.PI * 0.5 * k);
                        ctx.translate(176, 0);
                        ctx.rotate(a);
                        draw_blade();

                        ctx.restore();
                    }

                    ctx.restore();

                }



            } else if (mode === "box" || mode === "box_lens" || mode === "box_aperture") {

                let r_max = 0.05;
                let r_min = 0.0001;
                let hd_min = 0.3;
                let hd_max = 0.7;
                let film_size = 0.2;


                let color_lens = true;
                let color_aperture = true;
                let color_distance = true;

                let ap_r = 0

                let r = lerp(r_max, r_min, arg0);
                let lens_r = 0.0;

                if (mode === "box_lens") {
                    r = 0.15;
                    lens_r = lerp(0.25, 0.8, arg0 * arg0);
                } else if (mode === "box_aperture") {
                    color_lens = false;
                    r = 0.2;
                    lens_r = 0.7;
                    ap_r = lerp(0.19, 0.005, arg0);
                }

                let hd = lerp(hd_min, hd_max, arg1);
                ctx.translate(Math.round(width * 0.5), Math.round(height * 0.5));

                ctx.lineWidth = 2.0;


                let s = 6.5;
                draw_camera([hd * s / 2, 0, 0], film_size, hd, r, lens_r, ap_r, camera_size, scale_mat3(s), color_lens, color_aperture, color_distance, true);
            } else if (mode === "pixel_view") {

                let r = 0.03;


                let film_size = 0.2;
                let lens_r = 0.0;
                let hd = 0.3;


                let color_lens = true;
                let color_aperture = true;
                let color_distance = false;

                let ap_r = 0


                ctx.translate(Math.round(width * 0.5), Math.round(height * 0.5));

                ctx.lineWidth = 2.0;


                let s = 6.5;
                draw_camera([hd * s / 2, 0, 0], film_size, hd, r, lens_r, ap_r, camera_size, scale_mat3(s), color_lens, color_aperture, color_distance, true);

                let p = [hd / 2, film_size * (arg0 - 0.5) * 2, 0];

                let sy = (hd) / Math.sqrt(hd * hd + p[1] * p[1]);
                let sx = sy * sy;

                let p0 = [hd / 2, 0, 0];
                let pc = [-hd / 2, 0, 0];

                p0 = vec_scale(p0, s);
                pc = vec_scale(pc, s);

                p = vec_scale(p, s);

                ctx.lineWidth = 1.0

                let n0 = vec_sub(p, pc);
                let n1 = vec_sub(p0, pc);

                let sub = 20;
                let arcp = [pc];
                for (let i = 0; i <= sub; i++) {
                    let t = i / sub;

                    let p = vec_add(pc, vec_scale(vec_norm(vec_lerp(n0, n1, t)), hd * 0.7 * s));
                    arcp.push(p);
                }



                ctx.globalAlpha = 0.7;
                ctx.fillStyle = yellow_style;
                context_add_points(ctx, arcp, proj_rot, false);
                ctx.fill();

                ctx.globalAlpha = 1.0;

                ctx.strokeStyle = "rgba(0,0,0,0.3)"
                context_add_points(ctx, [p0, pc], proj_rot);
                ctx.stroke();

                context_add_points(ctx, [p, pc], proj_rot);
                ctx.stroke();

                p = ray_project(mat3_mul_vec(proj_rot, p));

                let r_base = height * 0.1;

                ctx.fillStyle = blue_style;
                ctx.fillEllipse(p[0], p[1], 4);

                ctx.translate(width * 0.37, height * 0.37);


                ctx.strokeStyle = "#333";
                ctx.lineWidth = 4.0;
                ctx.beginPath();
                ctx.ellipse(0, 0, r_base * sx, r_base * sy, 0, 0, Math.PI * 2);
                ctx.stroke();
            }
            else if (mode === "film" || mode === "film_exposure") {

                let r_max = 0.04;
                let r_min = 0.0001;
                let hd_min = 0.3;
                let hd_max = 0.7;

                let exposure = mode === "film_exposure";


                let r = lerp(r_max, r_min, arg0);
                let hd = lerp(hd_min, hd_max, arg1);

                let fill = 1.0;

                if (exposure) {

                    /* solid angle reduction due to distance */
                    fill = hd_min / hd;

                    /* solid angle reduction to to area */
                    fill *= r / r_max;

                    /* square factor for area and distance */
                    fill *= fill;
                }

                function draw_2d()
                {
                    ctx.save()
                    ctx.translate(Math.round(width * 0.25), Math.round(height * 0.5));

                    draw_camera(camera_pos, film_size, hd, r, 0.0, 0.0, camera_size, camera_mat, true, true, true);

                    ctx.restore()
                }

                if (mvp[6] < 0.0)
                    draw_2d()
                

                gl.begin(width, height);
                gl.viewport(0, 0, height, height);
                gl.draw_scene(mvp);

                gl.viewport(height + film_inset, film_inset, height - 2 * film_inset, height - 2 * film_inset);
                gl.draw_pinhole(mvp, r, hd, camera_pos, exposure ? -film_size : film_size, fill);


                // var t0 = performance.now()
                ctx.drawImage(gl.finish(), 0, 0, width, height);
                // var t1 = performance.now()

                ctx.save();
                ctx.translate(height, 0);
                draw_film_decoration();
                ctx.restore();

                if (mvp[6] >= 0.0)
                    draw_2d()
                
                // ctx.fillText(Math.round((t1 - t0) * 1000), 100, 20);


                ctx.translate(height, 0);


            } else if (mode === "hero" || mode === "basic" || mode === "focus_demo" || mode === "focus_demo2" || mode === "focus_demo3") {

                let f_min = 0.34;
                let f_max = 0.45;
                let hd_min = 0.38;
                let hd_max = 0.5;

                let aperture = 0.12;

                let f = lerp(f_min, f_max, arg0);
                let hd = lerp(hd_min, hd_max, arg1);
                let camera_lens_r = lerp(0.3, 0.4, arg0);

                let camera_ap_r = 0.0;

                let camera_pinhole_r = 0.2;

                let color_lens = true;
                let color_aperture = false;
                let color_distance = true;
                if (mode === "focus_demo") {
                    f = lerp(0.345, 0.363, arg0);
                    hd = 0.4;
                    aperture = 0.2;
                    color_lens = false;
                    color_distance = false;
                    camera_lens_r = 0;
                } else if (mode === "focus_demo2") {
                    f = 0.35;
                    hd = 0.383 + 0.022 * arg0;
                    aperture = 0.15;
                    camera_pinhole_r = 0.15;
                    color_lens = false;
                } else if (mode === "focus_demo3") {
                    f = 0.35;
                    hd = 0.35 + 0.1 * arg1;
                    camera_lens_r = 0.5;
                    aperture = lerp(0.19, 0.005, arg0);
                    camera_ap_r = aperture;
                    color_lens = false;
                    color_aperture = true;
                } else if (mode === "hero") {
                    f = 0.32 + 0.1 * arg1;
                    hd = 0.35 + 0.1 * arg2;
                    camera_lens_r = lerp(0.45, 0.55, arg1);
                    aperture = lerp(0.15, 0.005, arg0);
                    camera_ap_r = aperture;
                    color_lens = true;
                    color_aperture = true;
                }


                let fd = 1 / (1 / f - 1 / hd);

                if (Math.abs(f - hd) / hd <= 0.001) {
                    fd = 65504.0;
                }


                function draw_2d()
                {
                    ctx.save()
                    ctx.translate(Math.round(width * 0.25), Math.round(height * 0.5));

                    draw_camera(camera_pos, film_size, hd, camera_pinhole_r, camera_lens_r, camera_ap_r, camera_size, camera_mat, color_lens, color_aperture, color_distance);

                    ctx.restore()
                }

                if (mvp[6] < 0.0)
                    draw_2d()


                    // let rs = [sphere_r0, sphere_r1];
                    // let ps = [sphere_p0, sphere_p1];

                let clips = [];

                for (let i = 0; i < 2; i++)
                {
                    let point = i == 0 ? sphere_p0 : sphere_p1;
                    point = point.slice();
                    point[2] += i == 0 ? -sphere_r0*1.1 : sphere_r1 * 1.1;

                let c = vec_sub(camera_pos, [hd, 0, 0]);
                let dir = vec_norm(vec_sub(c, point));
                let d = c[0] - point[0];

                let foc_d = 1 / (1 / f - 1 / d);
                
                let hit_t = plane_intersect([c, dir], [vec_add(c, [hd, 0, 0]), [-1, 0, 0]]);
                let hit = vec_add(c, vec_scale(dir, hit_t));
                let fac = Math.abs((hd - foc_d) / foc_d);
                let cr = (aperture * fac);
                if (i == 1)
                    cr*=-1;
                let h = -((hit[2] - camera_pos[2] +cr) / film_size) * 0.5 + 0.5;
                clips.push(h);
                }
            

                gl.begin(width, height);
                gl.viewport(0, 0, height, height);
                gl.draw_scene(mvp);

                // let clipf

                gl.viewport(height + film_inset, film_inset, height - 2 * film_inset, height - 2 * film_inset);
                gl.draw_lens(mvp, fd, hd, aperture, camera_pos, film_size,clips[0], clips[1]);
                gl.draw_lens_floor(mvp, fd, hd, aperture, camera_pos, film_size,clips[0]);


                // var t0 = performance.now()
                ctx.drawImage(gl.finish(), 0, 0, width, height);
                // var t1 = performance.now()

    
                ctx.save();
                ctx.translate(height, 0);
                draw_film_decoration();
                ctx.restore();



                if (mvp[6] >= 0.0)
                    draw_2d()

                // ctx.fillText(Math.round((t1 - t0) * 1000), 100, 20);


                ctx.translate(height, 0);



            } else if (mode === "bokeh") {

                let aperture = 0.2;

                let z = 0.75;
                let d0 = -1.0;
                let d1 = -1.0;
                let f = 0.35;
                let hd = lerp(0.3818, 0.41647, arg0);
                let camera_lens_r = lerp(0.3, 0.4, arg0);

                let camera_ap_r = 0.0;

                let camera_pinhole_r = 0.23;

                let color_lens = false;
                let color_aperture = false;
                let color_distance = true;


                let fd = 1 / (1 / f - 1 / hd);

                if (Math.abs(f - hd) / hd <= 0.001) {
                    fd = 65504.0;
                }


                function draw_2d()
                {
                    ctx.save()
                    ctx.translate(Math.round(width * 0.25), Math.round(height * 0.5));

                    draw_camera(camera_pos, film_size, hd, camera_pinhole_r, camera_lens_r, camera_ap_r, camera_size, camera_mat, color_lens, color_aperture, color_distance, false, false, false, true);

                    ctx.restore()
                }


                if (mvp[6] < 0.0)
                    draw_2d()
                

                gl.begin(width, height);
                gl.viewport(0, 0, height, height);
                gl.draw_bokeh_scene(mvp);

                gl.viewport(height + film_inset, film_inset, height - 2 * film_inset, height - 2 * film_inset);
                gl.draw_bokeh_lens(mvp, fd, hd, aperture, camera_pos, film_size);

                ctx.drawImage(gl.finish(), 0, 0, width, height);

                ctx.save();
                ctx.translate(height, 0);
                draw_film_decoration(true);

                ctx.translate(Math.round(height * 0.5) - 1, Math.round(height * 0.5) - 1);
                // ctx.translate(0, - 50);

                let w = height - film_inset * 2;

                ctx.globalCompositeOperation = "lighter";


                for (let o = 0; o < 5; o++) {
                    let r = (1 - o / 4);
                    ctx.fillStyle = "rgba(" + Math.floor(engamma(r) * 255) + ", 0, " + Math.floor(255 * engamma(1 - r)) + ", 0.25)";

                    let pos = [1.0 - o * 0.5, 1.0 - o * 0.5, z];
                    let c = vec_sub(camera_pos, [hd, 0, 0]);
                    let dir = vec_norm(vec_sub(c, pos));
                    let d = c[0] - pos[0];

                    let foc_d = 1 / (1 / f - 1 / d);

                    let foc_t = plane_intersect([c, dir], [vec_add(c, [foc_d, 0, 0]), [-1, 0, 0]]);
                    let foc = vec_add(c, vec_scale(dir, foc_t));

                    let hit_t = plane_intersect([c, dir], [vec_add(c, [hd, 0, 0]), [-1, 0, 0]]);

                    let hit = vec_add(c, vec_scale(dir, hit_t));

                    let fac = Math.abs((hd - foc_d) / foc_d);
                    let cr = (w * 0.5 * aperture / film_size * fac) + 1.0;

                    // close enough to match the ray traced
                    ctx.globalAlpha = saturate((0.0025 + (4 - o) * 0.0003) / (fac * fac));

                    let x = -hit[1] * w * 0.5 / film_size;
                    let y = (hit[2] - camera_pos[2]) * w * 0.5 / film_size;
                    ctx.fillEllipse(x, y, cr);
                    ctx.fillEllipse(x, y, cr * 0.97);
                    ctx.fillEllipse(x, y, cr * 0.94);
                    ctx.fillEllipse(x, y, cr * 0.91);
                }

                ctx.restore();

                if (mvp[6] >= 0.0)
                    draw_2d()


                ctx.translate(height, 0);



            } else if (mode === "bare_film") {


                function draw_2d()
                {
                    ctx.save()
                    ctx.translate(Math.round(width * 0.25), Math.round(height * 0.5));

                    draw_film(camera_pos, film_size, camera_mat, false, true);


                    ctx.restore()
                }

                if (mvp[6] < 0.0)
                    draw_2d()
                
                gl.begin(width, height);
                gl.viewport(0, 0, height, height);
                gl.draw_scene(mvp);

                ctx.drawImage(gl.finish(), 0, 0, width, height);

                ctx.save();
                ctx.translate(height, 0);
                ctx.fillStyle = "rgb(240, 240, 238)"
                ctx.fillRect(film_inset, film_inset, height - 2 * film_inset, height - 2 * film_inset);

                draw_film_decoration();
                ctx.restore();


                if (mvp[6] >= 0.0)
                draw_2d()


                ctx.translate(height, 0);



            }

            else if (mode === "frustum") {

                let r = 0.001;
                let hd = 0.45 + arg0 * 0.6;

                let endp = [];
                let startp = [];

                let plane_x = -2.0;

                let n = 2;
                for (let i = -1; i < 2; i += 2) {
                    let z = film_size * i;
                    for (let j = -1; j < 2; j += 2) {
                        let y = film_size * j;
                        let start = vec_add(camera_pos, [0, y, z]);

                        let ray = [start, vec_norm(vec_sub([-hd, 0, 0], [0, y, z]))];

                        let t = plane_intersect(ray, [[plane_x, 0, 0], [-1, 0, 0]]);
                        let hit = vec_add(ray[0], vec_scale(ray[1], t));

                        endp.push(hit);
                        startp.push(start);
                    }
                }
                endp.push(endp[2]);
                endp.splice(2, 1);

                startp.push(startp[2]);
                startp.splice(2, 1);

                let p0 = vec_sub(camera_pos, [hd, 0, 0]);


                function draw_2d()
                {
           
                    ctx.save();
                    ctx.beginPath();
                    ctx.rect(0, 0, height, height);
                    ctx.clip();
                    ctx.translate(Math.round(width * 0.25), Math.round(height * 0.5));

                draw_camera(camera_pos, film_size, hd, 0.01, 0.0, 0.0, camera_size, camera_mat, true, true, true, false, true);

                ctx.restore();
                }

                if (mvp[6] < 0.0)
                    draw_2d()
                

                gl.begin(width, height);

                gl.viewport(0, 0, height, height);
                gl.draw_frustum(mvp, p0, plane_x, 0.5 * (endp[0][1] - endp[1][1]));

                gl.viewport(height + film_inset, film_inset, height - 2 * film_inset, height - 2 * film_inset);
                gl.draw_pinhole_cheap(mvp, r, hd, camera_pos, film_size, 1.0);



                ctx.drawImage(gl.finish(), 0, 0, width, height);


                ctx.save();

                ctx.translate(height, 0);
                draw_film_decoration();
                ctx.restore();



                if (mvp[6] >= 0.0)
                    draw_2d()

                ctx.save();
                ctx.beginPath();
                ctx.rect(0, 0, height, height);
                ctx.clip();
                ctx.translate(Math.round(width * 0.25), Math.round(height * 0.5));



                ctx.strokeStyle = "rgba(0,0,0,0.1)"
                ctx.fillStyle = "rgba(0,0,0,0.05)"

                for (let i = 0; i < 4; i++) {


                    context_add_points(ctx, [p0, endp[i]], proj_rot);
                    ctx.stroke();


                    context_add_points(ctx, [p0, startp[i]], proj_rot);
                    ctx.stroke();
                }

                context_add_points(ctx, endp, proj_rot);
                ctx.stroke();

                ctx.restore();


            } else if (mode === "hole_sharpness") {

                ctx.translate(Math.round(width * 0.5), Math.round(height * 0.5));


                let r = 0.01 + arg0 * 0.1;
                let n = 1.5;
                let source_z = -3.0;
                let hole_z = 0.0;
                let im_z = 3.0;
                let s = 1.6;

                let proj = mat3_mul(proj_rot, scale_mat3(s));


                let im_r = (im_z - source_z) / (hole_z - im_z) * r;


                let start = [0, 0, source_z];

                function draw_start_rays() {
                    ctx.strokeStyle = ray_stroke;
                    ctx.lineWidth = ray_width;
                    for (let i = 0; i < disc_vertices_small.length; i++) {
                        let center = vec_add(vec_scale(disc_vertices_small[i], r), [0, 0, hole_z]);

                        context_add_points(ctx, [start, center], proj, false);
                        ctx.stroke();
                    }
                }

                function draw_end_rays() {
                    ctx.strokeStyle = ray_stroke;
                    ctx.lineWidth = ray_width;
                    for (let i = 0; i < disc_vertices_small.length; i++) {
                        let center = vec_add(vec_scale(disc_vertices_small[i], r), [0, 0, hole_z]);

                        let ray0 = vec_sub(center, start);
                        let end = vec_add(center, ray0);

                        context_add_points(ctx, [center, end], proj, false);
                        ctx.stroke();
                    }
                }


                function draw_projection() {

                    let inset = 0.01;
                    let d = 1;

                    let box_ps = [
                        [-d - inset, -d - inset, im_z],
                        [-d - inset, d + inset, im_z],
                        [d + inset, d + inset, im_z],
                        [d + inset, -d - inset, im_z],
                    ];

                    if (poly_front_facing(box_ps, proj))
                        ctx.globalCompositeOperation = "destination-over";

                    context_add_points(ctx, box_ps, proj);
                    ctx.lineWidth = 1.0 / s;
                    ctx.strokeStyle = "rgba(0,0,0,0.3)"
                    ctx.stroke();

                    let w = h = 15;
                    let dw = d * 2 / w;
                    let dh = d * 2 / h;
                    for (let j = 0; j < h; j++) {
                        for (let i = 0; i < w; i++) {
                            let x = -d + i * 2 * d / w + inset;
                            let y = -d + j * 2 * d / h + inset;

                            let ps = [
                                [x, y, im_z],
                                [x, y + dh - 2 * inset, im_z],
                                [x + dw - 2 * inset, y + dh - 2 * inset, im_z],
                                [x + dw - 2 * inset, y, im_z],
                            ];

                            context_add_points(ctx, ps, proj);

                            ctx.stroke();
                        }
                    }


                    ctx.fillStyle = source_fill;
                    let circle_ps = circle_points(mode === "cone_hex" ? 6 : 60);
                    scale_points(circle_ps, im_r);
                    translate_points(circle_ps, [0, 0, im_z]);
                    context_add_points(ctx, circle_ps, proj, true);
                    ctx.globalAlpha = 0.6;
                    ctx.fill();
                    ctx.globalAlpha = 1.0;

                    ctx.globalCompositeOperation = "source-over";

                }


                function draw_hole() {


                    let box_ps = [
                        [-1, -1, 0],
                        [-1, 1, 0],
                        [1, 1, 0],
                        [1, -1, 0],
                    ];


                    let ap_ps2 = circle_points(30);

                    transform_points(ap_ps2, scale_mat3(r));


                    ctx.fillStyle = "rgba(0,0,0,0.5)"

                    context_add_points(ctx, box_ps, proj, true);
                    context_add_points(ctx, ap_ps2, proj, true, false);

                    ctx.fill("evenodd");

                    ctx.lineWidth = 3.0 / s;
                    ctx.strokeStyle = black_style;

                    context_add_points(ctx, ap_ps2, proj, true);
                    ctx.stroke();

                }


                if (mvp[8] > 0.0) {
                    draw_start_rays();
                    draw_source(proj, start, 0.08, 20);
                    draw_hole();
                    draw_end_rays();
                } else {
                    draw_end_rays();
                    draw_hole();
                    draw_start_rays();
                    draw_source(proj, start, 0.08, 20);

                }

                draw_projection();

            } else if (mode === "hole_solid_angle") {

                let r = 0.001 + (1.0 - arg0) * 0.07;
                let hd = 0.5;

                gl.begin(width, height);

                gl.draw_scene(mvp);

                ctx.globalAlpha = 0.3;

                ctx.drawImage(gl.finish(), 0, 0, width, height);
                ctx.globalAlpha = 1.0;


                let rot_mat = rot_y_mat3(Math.PI * 0.35);


                ctx.save()
                ctx.translate(Math.round(width * 0.5), Math.round(height * 0.5));

                draw_scene();

                draw_camera(camera_pos, film_size, hd, r, 0.0, 0.0, camera_size, camera_mat, true, false, false, false, true);


                let rs = [sphere_r0, sphere_r1];
                let ps = [sphere_p0, sphere_p1];
                let cs = ["rgba(255, 89, 63,0.15)",
                    "rgba(89, 231, 62,0.2)"];

                for (let o = 1; o >= 0; o--) {
                    ctx.strokeStyle = cs[o];

                    let p0 = [0.0, 0.0, rs[o]];
                    p0 = mat3_mul_vec(rot_mat, p0);
                    p0 = vec_add(p0, ps[o]);
                    let p0_proj = ray_project(mat3_mul_vec(proj_rot, p0));

                    for (let i = 0; i < out_vertices_small.length; i++) {
                        let p = out_vertices_small[i];

                        let p0 = [0.0, 0.0, rs[o]];
                        let p1 = vec_add(p0, vec_scale(p, 0.3));

                        p1 = mat3_mul_vec(rot_mat, p1);
                        p1 = vec_add(p1, ps[o]);

                        p1 = ray_project(mat3_mul_vec(proj_rot, p1));

                        ctx.beginPath();
                        ctx.moveTo(p0_proj[0], p0_proj[1]);
                        ctx.lineTo(p1[0], p1[1]);
                        ctx.stroke();
                    }


                    for (let i = 0; i < disc_vertices_small.length; i++) {


                        let p = disc_vertices_small[i].slice();
                        p = vec_scale(p, r);
                        p = [-hd, p[0], p[1]];
                        p = vec_add(p, camera_pos);
                        p = vec_sub(p, p0);

                        p = vec_scale(p, (camera_pos[0] - p0[0]) / ((camera_pos[0] - p0[0]) - hd));
                        p = vec_add(p, p0);

                        p = ray_project(mat3_mul_vec(proj_rot, p));


                        ctx.beginPath();
                        ctx.moveTo(p0_proj[0], p0_proj[1]);
                        ctx.lineTo(p[0], p[1]);
                        ctx.stroke();
                    }
                }

                ctx.restore()



            } else if (mode === "lens_solid_angle" || mode === "lens_solid_angle2") {

                let f_min = 0.3;
                let f_max = 0.45;
                let hd_min = 0.38;
                let hd_max = 0.5;

                let aperture = 0.15;
                let r = aperture;

                let f = lerp(f_min, f_max, arg0);
                let hd = lerp(hd_min, hd_max, arg1);

                let color_lens = true;
                let color_distance = true;


                let double = mode === "lens_solid_angle2";
                if (double) {
                    f = 0.35;
                    hd = 0.383 + 0.022 * arg0;
                    aperture = 0.15;
                    camera_pinhole_r = 0.15;
                    color_lens = false;
                }

                let fd = 1 / (1 / f - 1 / hd);

                if (f == hd) {
                    fd = 65504.0;
                }

                let camera_lens_r = lerp(0.3, 0.4, arg0);

                gl.begin(height, height);

                gl.draw_scene(mvp);

                ctx.globalAlpha = 0.3;

                ctx.drawImage(gl.finish(), 0, 0, height, height);
                ctx.globalAlpha = 1.0;


                let rot_mat = rot_y_mat3(Math.PI * 0.35);


                ctx.save()
                ctx.translate(width * 0.5 * (double ? 0.5 : 1.0), height * 0.5);

                draw_scene();

                draw_camera(camera_pos, film_size, hd, r, camera_lens_r, 0.0, camera_size, camera_mat, color_lens, false, color_distance, false, true);


                let rs = [sphere_r0, sphere_r1];
                let ps = [sphere_p0, sphere_p1];
                let cs = ["rgba(255, 89, 63,0.15)",
                    "rgba(89, 231, 62,0.2)"];

                let cs2 = ["rgba(255, 89, 63,1.0)",
                    "rgba(89, 231, 62,1.0)"];

                for (let o = 1; o >= 0; o--) {
                    ctx.strokeStyle = cs[o];

                    let p0 = [0.0, 0.0, rs[o]];
                    p0 = mat3_mul_vec(rot_mat, p0);
                    p0 = vec_add(p0, ps[o]);
                    let p0_proj = ray_project(mat3_mul_vec(proj_rot, p0));

                    for (let i = 0; i < out_vertices_small.length; i++) {
                        let p = out_vertices_small[i];

                        let p0 = [0.0, 0.0, rs[o]];
                        let p1 = vec_add(p0, vec_scale(p, 0.3));

                        p1 = mat3_mul_vec(rot_mat, p1);
                        p1 = vec_add(p1, ps[o]);

                        p1 = ray_project(mat3_mul_vec(proj_rot, p1));

                        ctx.beginPath();
                        ctx.moveTo(p0_proj[0], p0_proj[1]);
                        ctx.lineTo(p1[0], p1[1]);
                        ctx.stroke();
                    }

                    let c = vec_sub(camera_pos, [hd, 0, 0]);
                    let dir = vec_norm(vec_sub(c, ps[o]));
                    let d = c[0] - ps[o][0];

                    let foc_d = 1 / (1 / f - 1 / d);

                    let foc_t = plane_intersect([c, dir], [vec_add(c, [foc_d, 0, 0]), [-1, 0, 0]]);
                    let foc = vec_add(c, vec_scale(dir, foc_t));


                    for (let i = 0; i < disc_vertices_small.length; i++) {

                        let p = disc_vertices_small[i].slice();
                        p = vec_scale(p, r);
                        p = [-hd, p[0], p[1]];
                        p = vec_add(p, camera_pos);

                        let ray = [p, vec_norm(vec_sub(foc, p))];
                        let t = plane_intersect(ray, [camera_pos, [-1, 0, 0]]);
                        let p2 = vec_add(ray[0], vec_scale(ray[1], t));
                        p2 = ray_project(mat3_mul_vec(proj_rot, p2));

                        p = ray_project(mat3_mul_vec(proj_rot, p));


                        ctx.beginPath();
                        ctx.moveTo(p0_proj[0], p0_proj[1]);
                        ctx.lineTo(p[0], p[1]);
                        ctx.stroke();


                        ctx.beginPath();
                        ctx.lineTo(p[0], p[1]);
                        ctx.lineTo(p2[0], p2[1]);

                        ctx.stroke();
                    }
                }


                ctx.restore();

                if (double) {

                    let w = height - film_inset * 2;
                    ctx.translate(Math.round(width * 0.5), 0);
                    ctx.fillStyle = "#000";
                    ctx.fillRect(film_inset, film_inset, w, w);

                    ctx.save();
                    ctx.translate(Math.round(height * 0.5), Math.round(height * 0.5));


                    for (let o = 1; o >= 0; o--) {
                        ctx.fillStyle = cs2[o];

                        let c = vec_sub(camera_pos, [hd, 0, 0]);
                        let dir = vec_norm(vec_sub(c, ps[o]));
                        let d = c[0] - ps[o][0];

                        let foc_d = 1 / (1 / f - 1 / d);

                        let foc_t = plane_intersect([c, dir], [vec_add(c, [foc_d, 0, 0]), [-1, 0, 0]]);
                        let foc = vec_add(c, vec_scale(dir, foc_t));

                        let hit_t = plane_intersect([c, dir], [vec_add(c, [hd, 0, 0]), [-1, 0, 0]]);

                        let hit = vec_add(c, vec_scale(dir, hit_t));

                        let fac = Math.abs((hd - foc_d) / foc_d);
                        let cr = (w * 0.5 * aperture / film_size * fac);
                        ctx.globalAlpha = (1.0 - 5.0 * fac) * (1.0 - 5.0 * fac);
                        ctx.fillEllipse(-hit[1] * w * 0.5 / film_size, (hit[2] - camera_pos[2]) * w * 0.5 / film_size, cr);
                        ctx.globalAlpha = 1.0;

                    }
                    ctx.restore();

                    draw_film_decoration();
                }




            } else if (mode === "sensor_rays") {

                function draw3d() {
                    gl.begin(width, height);
                    gl.draw_scene(mvp);

                    ctx.drawImage(gl.finish(), 0, 0, width, height);
                }

                function draw2d() {

                    ctx.save();
                    ctx.translate(Math.round(width * 0.5), Math.round(height * 0.5));

                    draw_film(camera_pos, film_size, camera_mat, false, true);

                    let p0 = camera_pos;

                    let p0_proj = ray_project(mat3_mul_vec(proj_rot, p0));

                    ctx.globalAlpha = 0.2;

                    for (let i = 0; i < rand_vertices.length; i++) {
                        let p = rand_vertices[i].slice();
                        if (p[2] < 0.0)
                            p[2] = -p[2];

                        let p0 = camera_pos;
                        let p1 = vec_scale(p, 0.7);
                        let tmp = p1[0];
                        p1[0] = -p1[2];
                        p1[2] = tmp;
                        p1 = vec_add(p1, camera_pos);

                        let ray = [p0, vec_norm(vec_sub(p1, p0))];
                        let plane_t = plane_intersect(ray, [[0, 0, 0], [0, 0, 1]]);

                        if (sphere_intersect(ray, sphere_p1, sphere_r1) > 0.0) {
                            ctx.strokeStyle = "#00ff00";
                        } else if (sphere_intersect(ray, sphere_p0, sphere_r0) > 0.0) {
                            ctx.strokeStyle = "#dd0000";
                        } else if (plane_t > 0.0 && Math.abs(ray[0][0] + plane_t * ray[1][0]) < base_size &&
                            Math.abs(ray[0][1] + plane_t * ray[1][1]) < base_size) {
                            ctx.strokeStyle = "#bbb";
                        }
                        else {
                            ctx.strokeStyle = "#ddd";
                        }

                        p1 = ray_project(mat3_mul_vec(proj_rot, p1));

                        ctx.beginPath();
                        ctx.moveTo(p0_proj[0], p0_proj[1]);
                        ctx.lineTo(p1[0], p1[1]);
                        ctx.stroke();
                    }

                    ctx.restore();
                }

                if (mvp[6] < 0.0) {
                    draw2d();
                    draw3d();
                } else {
                    draw3d();
                    draw2d();
                }



            } else if (mode === "scene_rays") {


                gl.begin(width, height);
                gl.viewport(-width * 0.2, -height * 0.2, width * 1.4, height * 1.4);

                gl.draw_scene(mvp);

                ctx.globalAlpha = 0.3;

                ctx.drawImage(gl.finish(), 0, 0, width, height);
                ctx.globalAlpha = 1.0;

                ctx.translate(Math.round(width * 0.5), Math.round(height * 0.5));
                ctx.scale(1.4, 1.4);

                draw_scene();



                ctx.save();


                function draw_bunch(rot, pos, style) {

                    ctx.strokeStyle = style;

                    for (let i = 0; i < out_vertices_small.length; i += 2) {
                        let p = out_vertices_small[i];


                        let p1 = vec_scale(p, 0.4);
                        p1 = mat3_mul_vec(rot, p1);
                        p1 = vec_add(p1, pos);
                        p1 = ray_project(mat3_mul_vec(proj_rot, p1));

                        let p0 = ray_project(mat3_mul_vec(proj_rot, pos));

                        ctx.beginPath();
                        ctx.moveTo(p0[0], p0[1]);
                        ctx.lineTo(p1[0], p1[1]);
                        ctx.stroke();
                    }
                }

                draw_bunch(ident_matrix, [1.25, -0.25, 0], "rgba(187, 187, 187, 0.3)");
                draw_bunch(ident_matrix, [-1.75, -1.75, 0], "rgba(187, 187, 187, 0.3)");

                let mat;

                mat = mat3_mul(rot_z_mat3(0.3), rot_y_mat3(Math.PI * 0.25));
                draw_bunch(mat, vec_add(sphere_p0, mat3_mul_vec(mat, [0, 0, sphere_r0])), "rgba(255, 89, 63,0.3)");


                mat = mat3_mul(rot_z_mat3(-4.2), rot_y_mat3(Math.PI * 0.52));
                draw_bunch(mat, vec_add(sphere_p0, mat3_mul_vec(mat, [0, 0, sphere_r0])), "rgba(255, 89, 63,0.3)");

                mat = mat3_mul(rot_z_mat3(-0.7), rot_y_mat3(Math.PI * 0.25));
                draw_bunch(mat, vec_add(sphere_p1, mat3_mul_vec(mat, [0, 0, sphere_r1])), "rgba(89, 231, 62,0.3)");

                mat = mat3_mul(rot_z_mat3(1.7), rot_y_mat3(Math.PI * 0.3));
                draw_bunch(mat, vec_add(sphere_p1, mat3_mul_vec(mat, [0, 0, sphere_r1])), "rgba(89, 231, 62,0.3)");


                ctx.restore();

            }

            else if (mode === "film_invert") {


                let r =  0.0001;
                let hd = 0.5;


                gl.begin(width, height);
                gl.draw_scene(mvp);


                ctx.globalAlpha = 0.3;
                ctx.drawImage(gl.finish(), 0, 0, width, height);
                ctx.globalAlpha = 1.0;

                ctx.translate(Math.round(width * 0.5), Math.round(height * 0.5));
                ctx.lineWidth = 1.0;

                draw_camera(camera_pos, film_size, hd, r, 0.0, 0.0, camera_size, camera_mat, true, false, false, false, true);


                draw_scene();

                let hole_p = vec_sub(camera_pos, [hd, 0, 0]);

                function hit_point(p) {
                    let ray = [p, vec_norm(vec_sub(hole_p, p))];
                    let t = plane_intersect(ray, [camera_pos, [-1, 0, 0]]);

                    return vec_add(ray[0], vec_scale(ray[1], t));
                }

                ctx.lineWidth = 2.0;

                ctx.strokeStyle = ctx.fillStyle = "rgba(255, 89, 63,0.7)";

                let p, hp;
                p = vec_add(sphere_p0, [sphere_r0, 0, 0]);
                hp = hit_point(p);
                context_add_points(ctx, [p, hp], proj_rot);
                ctx.stroke();
                hp = ray_project(mat3_mul_vec(proj_rot, hp));
                ctx.fillEllipse(hp[0], hp[1], 2.0);


                ctx.strokeStyle = ctx.fillStyle = "rgba(89, 231, 62,0.7)";

                p = vec_add(sphere_p1, [sphere_r1, 0, 0]);
                hp = hit_point(p);
                context_add_points(ctx, [p, hp], proj_rot);
                ctx.stroke();
                hp = ray_project(mat3_mul_vec(proj_rot, hp));
                ctx.fillEllipse(hp[0], hp[1], 2.0);

                ctx.strokeStyle = ctx.fillStyle = "rgba(150, 150, 150, 0.5)";
                p = [1.0, 0, 0];
                hp = hit_point(p);
                context_add_points(ctx, [p, hp], proj_rot);
                ctx.stroke();
                hp = ray_project(mat3_mul_vec(proj_rot, hp));
                ctx.fillEllipse(hp[0], hp[1], 2.0);




            } else if (mode === "glass") {
                let d = arg0 * 0.65 + 0.05;

                gl.begin(width, height);
                gl.draw_glass_scene(mvp, d);

                ctx.drawImage(gl.finish(), 0, 0, width, height);

            } else if (mode === "wave_glass" || mode === "wave_glass2") {

                ctx.translate(Math.round(width * 0.5), Math.round(height * 0.5));

                ctx.lineCap = "butt";
                let n = 1.0 + arg0;

                let d = 0.7;

                let tt = t * 0.2;
                let angle0 = 1.8 * (arg1 - 0.5);

                if (mode === "wave_glass") {
                    angle0 = 0;
                    n = 2.0;
                }

                let sin0 = Math.sin(angle0);
                let sin1 = sin0 / n;


                let angle1 = Math.asin(sin1);

                let tan1 = Math.tan(angle1);

                let mat0 = rot_y_mat3(angle0);
                let mat1 = rot_y_mat3(angle1);

                let n_lines = 250;

                let wavelength = 1.0;
                let k = Math.PI * 2 / wavelength;
                let w = 50.0;

                let x0 = wavelength * 3;
                let glass_w = 1.0;


                ctx.lineWidth = 2.5;
                ctx.strokeStyle = "rgba(255, 0, 0, 0.3)";


                let zs = d * Math.cos(angle1) / Math.cos(angle0);
                let ls = 1 / Math.cos(angle1);


                let phase0 = -glass_w * k;
                let phase1 = -glass_w * k * n - phase0;

                let phase2 = (2 * glass_w * ls - glass_w) * k * n - phase1;
                let phase3 = - phase2;

                function stroke_color(y) {

                    y = (y + 0.3) / 0.6;

                    let rgb = vec_lerp([194, 19, 50], [36, 11, 54], y);

                    return "rgb(" + Math.round(rgb[0]) + "," + Math.round(rgb[1]) + "," + Math.round(rgb[2]) + ")";
                }

                let alpha = 0.3;

                function draw_start() {



                    for (let i = 0; i < n_lines; i++) {
                        let wx = i * x0 * 2 / n_lines - x0;

                        let wy = 0.3 * Math.sin(wx * k - w * tt);
                        // if (wy < 0.25) continue;
                        let p0 = [wx, wy, -d];
                        let p1 = [wx, wy, d];
                        let ps = [p0, p1];
                        translate_points(ps, [glass_w, 0, 0]);
                        transform_points(ps, mat0);
                        translate_points(ps, [-glass_w, 0, 0]);

                        if (ps[0][0] > -glass_w && ps[1][0] > -glass_w)
                            continue;

                        let dir = vec_norm(vec_sub(ps[1], ps[0]));
                        let ht = plane_intersect([ps[0], dir], [[-glass_w, 0, 0], [1, 0, 0]]);

                        if (ps[0][0] > -glass_w)
                            ps[0] = vec_add(ps[0], vec_scale(dir, ht));
                        else if (ps[1][0] > -glass_w)
                            ps[1] = vec_add(ps[0], vec_scale(dir, ht));


                        ctx.globalAlpha = alpha * smooth_step(-x0, -x0 * 0.8, wx);
                        context_add_points(ctx, ps, proj_rot);
                        ctx.strokeStyle = stroke_color(wy);
                        ctx.stroke();
                    }

                }


                function draw_mid() {

                    for (let i = 0; i < n_lines * 2; i++) {
                        let wx = i * x0 * 2 / n_lines / n - x0;
                        let wy = 0.3 * Math.sin(wx * k * n - w * tt - phase1);
                        // if (wy < 0.25) continue;
                        let p0 = [wx, wy, -zs];
                        let p1 = [wx, wy, zs];
                        let ps = [p0, p1];
                        translate_points(ps, [glass_w, 0, 0]);
                        transform_points(ps, mat1);
                        translate_points(ps, [-glass_w, 0, 0]);

                        if (ps[0][0] < -glass_w && ps[1][0] < -glass_w)
                            continue;

                        if (ps[0][0] > glass_w && ps[1][0] > glass_w)
                            continue;

                        let dir = vec_norm(vec_sub(ps[1], ps[0]));
                        let ht = plane_intersect([ps[0], dir], [[-glass_w, 0, 0], [1, 0, 0]]);

                        if (ps[0][0] < -glass_w)
                            ps[0] = vec_add(ps[0], vec_scale(dir, ht));
                        else if (ps[1][0] < -glass_w)
                            ps[1] = vec_add(ps[0], vec_scale(dir, ht));

                        ht = plane_intersect([ps[0], dir], [[glass_w, 0, 0], [1, 0, 0]]);
                        if (ps[0][0] > glass_w)
                            ps[0] = vec_add(ps[0], vec_scale(dir, ht));
                        else if (ps[1][0] > glass_w)
                            ps[1] = vec_add(ps[0], vec_scale(dir, ht));

                        context_add_points(ctx, ps, proj_rot);
                        ctx.strokeStyle = stroke_color(wy);
                        ctx.globalAlpha = alpha;
                        ctx.stroke();
                    }

                }

                function draw_end() {



                    for (let i = 0; i < n_lines; i++) {
                        let wx = i * x0 * 2 / n_lines - x0;
                        let wy = 0.3 * Math.sin(wx * k - w * tt - phase3);
                        // if (wy < 0.25) continue;
                        let p0 = [wx, wy, -d];
                        let p1 = [wx, wy, d];
                        let ps = [p0, p1];

                        translate_points(ps, [-glass_w, 0, 0]);
                        transform_points(ps, mat0);
                        translate_points(ps, [glass_w, 0, -glass_w * 2 * tan1]);


                        if (ps[0][0] < glass_w && ps[1][0] < glass_w)
                            continue;

                        let dir = vec_norm(vec_sub(ps[1], ps[0]));

                        let ht = plane_intersect([ps[0], dir], [[glass_w, 0, 0], [1, 0, 0]]);
                        if (ps[0][0] < glass_w)
                            ps[0] = vec_add(ps[0], vec_scale(dir, ht));
                        else if (ps[1][0] < glass_w)
                            ps[1] = vec_add(ps[0], vec_scale(dir, ht));

                        ctx.globalAlpha = alpha * (1.0 - smooth_step(x0 * 0.8, x0, wx));
                        ctx.strokeStyle = stroke_color(wy);

                        context_add_points(ctx, ps, proj_rot);
                        ctx.stroke();
                    }

                }

                let glass_l = mode === "wave_glass2" ? 3.75 : 2.5;

                let box_ps = [
                    [-glass_w, +1.5, +glass_l],
                    [-glass_w, -1.5, +glass_l],
                    [-glass_w, -1.5, -glass_l],
                    [-glass_w, +1.5, -glass_l],
                    [glass_w, +1.5, +glass_l],
                    [glass_w, -1.5, +glass_l],
                    [glass_w, -1.5, -glass_l],
                    [glass_w, +1.5, -glass_l],
                ];

                function draw_glass() {


                    ctx.globalAlpha = 1.0;

                    ctx.save();
                    ctx.lineWidth = 1.5;

                    let ps = box_ps.slice();

                    for (let i = 0; i < ps.length; i++) {
                        ps[i] = mat3_mul_vec(proj_rot, ps[i]);
                        ps[i] = ray_project(ps[i]);
                    }
                    ps = convex_hull(ps);

                    ctx.globalAlpha = 0.05 + 0.1 * arg0;
                    ctx.fillStyle = "rgba(130,165,200,1.0)";
                    ctx.strokeStyle = glass_stroke;


                    ctx.beginPath();
                    for (let i = 0; i < ps.length; i++) {
                        let p = ps[i];
                        // p = ray_project(p);
                        ctx.lineTo(p[0], p[1]);
                    }
                    ctx.closePath();

                    ctx.fill();
                    ctx.globalAlpha = 0.5;


                    context_add_points(ctx, box_ps.slice(0, 4), proj_rot);
                    ctx.stroke();
                    context_add_points(ctx, box_ps.slice(4), proj_rot);
                    ctx.stroke();

                    for (let i = 0; i < 4; i++) {
                        context_add_points(ctx, [box_ps[i], box_ps[i + 4]], proj_rot);
                        ctx.stroke();
                    }

                    ctx.restore();

                }

                let front = poly_front_facing(box_ps.slice(0, 4), proj_rot);
                let back = poly_front_facing(box_ps.slice(4), proj_rot);


                if (front)
                    draw_start();
                draw_mid();
                if (!back)
                    draw_end();
                draw_glass();

                if (!front)
                    draw_start();

                if (back)
                    draw_end();

                ctx.globalAlpha = 1.0;


                if (mode === "wave_glass2") {
                    ctx.fillStyle = black_style;
                    ctx.fillText("n = " + n.toFixed(2), 0, -height / 2 + font_size * 1.9);

                }

                draw_feather();

            } else if (mode === "wave_2d") {

                // ctx.translate(Math.round(width * 0.5), Math.round(height * 0.5));


                let w = 20;
                let k = 50.0;
                let lt = t * 0.3;

                lt = lt % ((2 * Math.PI) / w);
                gl.begin(width, height);
                gl.draw_wave2d(mvp, lt * w);

                ctx.drawImage(gl.finish(), 0, 0, width, height);

                ctx.translate(Math.round(width * 0.5), Math.round(height * 0.5));


                ctx.lineWidth = 2.0;

                for (let i = -2; i < 6; i++) {
                    let r = (lt * w / k + (0.5 + i) * Math.PI / k) * 5.5 * 1.4;

                    if (r < 0)
                        continue;

                    let a = 1.0 - smooth_step(2.5, 3.5, r);
                    let ps = circle_points((i + 2) * 20);

                    ctx.strokeStyle = i % 2 == 0 ? "rgba(194, 19, 50, 1.0)" : "rgba(36, 11, 54, 1.0)";

                    transform_points(ps, scale_mat3(r));
                    ctx.globalAlpha = a;
                    context_add_points(ctx, ps, proj_rot);
                    ctx.stroke();
                    ctx.globalAlpha = 1;
                }


            } else if (mode === "wave_3d") {



                let w = 20;
                let k = 50.0;
                let lt = t * 0.3;

                lt = lt % ((2 * Math.PI) / w);

                ctx.translate(Math.round(width * 0.5), Math.round(height * 0.5));


                ctx.lineWidth = 2.0;
                for (let i = -2; i < 6; i++) {
                    let r = 1.3333 * (lt * w / k + (0.5 + 1 * i) * Math.PI / k);
                    let a = 1.0 - smooth_step(0.4, 0.5, r);


                    if (r < 0)
                        continue;

                    ctx.fillStyle = i % 2 == 0 ? "rgba(194, 19, 50, 1.0)" : "rgba(36, 11, 54, 1.0)";

                    ctx.globalAlpha = a * 0.4;
                    ctx.fillEllipse(0, 0, r * width);
                    ctx.globalAlpha = 1;
                }
                // ctx.fillStyle = source_fill;

                ctx.fillEllipse(0, 0, 0.01 * width);

            } else if (mode === "wave_rays") {



                let w = 20;
                let k = 50.0;
                let lt = t * 0.3;

                lt = lt % ((2 * Math.PI) / w);

                ctx.translate(Math.round(width * 0.5), Math.round(height * 0.5));





                let r = 0.7;
                let base = Math.sqrt(1 * 1 - r * r);


                let cn = 90;
                let side0 = circle_points(cn);
                scale_points(side0, r);
                translate_points(side0, [0, 0, base]);
                let points = side0;
                let ends = [];

                ctx.strokeStyle = "rgba(203, 58, 84, 0.1)";

                ctx.fillStyle = "rgba(194, 19, 50, 1.0)";

                for (let i = 0; i < disc_vertices_big.length; i++) {
                    let p = disc_vertices_big[i];
                    p = vec_scale(p, r);
                    p[2] += base;
                    p = vec_norm(p);
                    points.push(p);

                    if ((i & 1) == 0) {
                        context_add_points(ctx, [[0, 0, 0], vec_scale(p, 3.5)], proj_rot);
                        ctx.stroke();
                    }
                }


                for (let i = -1; i < 6; i++) {
                    let r = 1.3333 * (lt * w / k + (0.5 + 1 * i) * Math.PI / k);
                    let a = 1.0 - smooth_step(0.4, 0.5, r);


                    r *= 5.5 * 1.4;
                    if (r < 0)
                        continue;

                    let ps = points.slice();


                    transform_points(ps, scale_mat3(r));
                    for (let i = 0; i < ps.length; i++) {
                        ps[i] = mat3_mul_vec(proj_rot, ps[i]);
                        ps[i] = ray_project(ps[i]);
                    }
                    ps = convex_hull(ps);

                    ctx.fillStyle = i % 2 == 0 ? "rgba(194, 19, 50, 1.0)" : "rgba(36, 11, 54, 1.0)";

                    ctx.globalAlpha = a * 0.4;
                    ctx.beginPath();
                    for (let i = 0; i < ps.length; i++) {
                        let p = ps[i];
                        // p = ray_project(p);
                        ctx.lineTo(p[0], p[1]);
                    }
                    ctx.closePath();
                    ctx.fill();
                    ctx.stroke();


                    ctx.globalAlpha = 1;


                }

                // ctx.fillStyle = source_fill;

                ctx.fillEllipse(0, 0, 0.01 * width);

            } else if (mode === "sine") {

                ctx.save();
                ctx.translate(Math.round(width * 0.5), Math.round(height * 0.45));

                let wavelength = 0.05 + arg0 * 0.45;
                let f = 0.25 + arg1 * 3.75;

                let v = f * wavelength;

                let k = Math.PI * 2 / wavelength;
                sine_w = 2 * Math.PI * f;


                let sx = width;
                let sy = height * 0.5;
                let n = Math.floor(width * 1.5 / scale);
                let amp = 0.3;

                ctx.lineWidth = 5.0;

                ctx.strokeStyle = "rgba(0,0,0,0.7)"
                ctx.beginPath();
                for (let i = 0; i <= n; i++) {
                    let x = i / n - 0.5;
                    let y = amp * Math.sin(x * k - sine_phase);

                    ctx.lineTo(x * sx, y * sy);
                }

                ctx.stroke();

                // Create gradient
                var grd = ctx.createLinearGradient(0, -amp * sy, 0, amp * sy);
                grd.addColorStop(0, "#c31432");
                grd.addColorStop(1, "#240b36");

                ctx.globalCompositeOperation = "source-in";
                ctx.fillStyle = grd;
                ctx.fillRect(-width, -amp * sy - 3.0, width * 2, amp * 2 * sy + 6.0);
                ctx.globalCompositeOperation = "source-over";


                let local_phase = (sine_phase % (2 * Math.PI)) - Math.PI * 0.5;

                ctx.lineWidth = 1.0;

                ctx.globalCompositeOperation = "destination-over";

                ctx.strokeStyle = "#bbb";
                ctx.textAlign = "center";
                ctx.fillStyle = "#333";

                ctx.beginPath();
                ctx.lineTo(-width, -(amp + 0.1) * sy);
                ctx.lineTo(width, -(amp + 0.1) * sy);
                ctx.stroke();

                ctx.fillStyle = black_style;
                for (let i = -10; i < 100; i++) {

                    let x = (local_phase + i * Math.PI * 2) * sx / k;

                    ctx.beginPath();
                    ctx.lineTo(x, -amp * sy);
                    ctx.lineTo(x, -(amp + 0.15) * sy);
                    ctx.stroke();

                    x += Math.PI * sx / k;

                    ctx.fillText("λ", x, -(amp + 0.15) * sy);
                }


                ctx.restore();


                grd = ctx.createLinearGradient(0, 0, width * 0.1, 0);
                grd.addColorStop(0, "rgba(0,0,0,1)");
                grd.addColorStop(0, "rgba(0,0,0,1)");
                grd.addColorStop(1, "rgba(0,0,0,0)");

                ctx.globalCompositeOperation = "destination-out";
                ctx.fillStyle = grd;
                ctx.fillRect(0, 0, width * 0.1, height);

                grd = ctx.createLinearGradient(width * 0.9, 0, width, 0);
                grd.addColorStop(0, "rgba(0,0,0,0)");
                grd.addColorStop(1, "rgba(0,0,0,1)");

                ctx.fillStyle = grd;
                ctx.fillRect(width * 0.9, 0, width * 0.1, height);
                ctx.globalCompositeOperation = "source-over";


                ctx.translate(Math.round(width * 0.5), Math.round(height * 0.45));

                ctx.globalCompositeOperation = "destination-over";
                ctx.strokeStyle = "#ccc";
                ctx.setLineDash([3, 3]);
                ctx.beginPath();
                ctx.lineTo(0, -amp * sy);
                ctx.lineTo(0, + (amp + 0.3) * sy);
                ctx.stroke();
                ctx.setLineDash([]);

                ctx.globalCompositeOperation = "source-over";


                {

                    ctx.save();
                    ctx.globalAlpha = 1.0;

                    let clock_r = 15;

                    ctx.translate(0, height * 0.5 - 20);
                    ctx.scale(1.25, 1.25);
                    ctx.strokeStyle = "#333";
                    ctx.fillStyle = "#333";

                    ctx.strokeEllipse(0, 0, clock_r);

                    ctx.save();
                    ctx.strokeStyle = "#666";
                    for (let i = 0; i < 24; i++) {
                        ctx.rotate(Math.PI / 12);
                        ctx.beginPath();
                        ctx.lineTo(0, -clock_r + 3);
                        ctx.lineTo(0, -clock_r + 4);
                        ctx.stroke();
                    }
                    ctx.restore();

                    ctx.fillEllipse(0, 0, 1.5);



                    ctx.save();
                    ctx.strokeStyle = "#333";

                    ctx.rotate((t - Math.floor(t)) * Math.PI * 2);
                    ctx.beginPath();
                    ctx.lineTo(0, 0);
                    ctx.lineTo(0, -clock_r + 4);
                    ctx.stroke();
                    ctx.restore();



                    ctx.lineCap = "butt";
                    ctx.lineWidth = 2.;
                    ctx.save();
                    ctx.beginPath();
                    ctx.lineTo(0, -clock_r);
                    ctx.lineTo(0, -clock_r - 3);
                    ctx.stroke();

                    ctx.lineWidth = 3.;

                    ctx.rotate(0.8);
                    ctx.beginPath();
                    ctx.lineTo(0, -clock_r);
                    ctx.lineTo(0, -clock_r - 4);
                    ctx.stroke();
                    ctx.restore();

                    ctx.lineWidth = 1.;

                    ctx.strokeEllipse(0, -clock_r - 5, 2);

                    ctx.restore();
                }

                ctx.translate(Math.round(width * 0.5) - font_size * 3, Math.round(height * 0.5) - font_size * 1.25);

                ctx.fillStyle = "#777";
                ctx.fillText("T = " + (1 / f).toFixed(2) + " s", 0, 0);
                ctx.fillText("f = " + (f).toFixed(2) + " Hz", 0, font_size * 1.5);



            } else if (mode === "em") {


                ctx.translate(Math.round(width * 0.5), Math.round(height * 0.5));

                ctx.lineCap = "butt";
                let wavelength = 3.0;
                let f = 1.0;
                let amp = 1.5;

                let k = Math.PI * 2 / wavelength;
                sine_w = 2 * Math.PI * f;


                let n = Math.floor(width * 0.75 / scale);

                let s = 12.0;

                ctx.lineWidth = 2.0;
                ctx.fillStyle = ctx.strokeStyle = "#ccc";

                {
                    ctx.beginPath();

                    let p = [-s * 0.5, 0, 0];
                    p = ray_project(mat3_mul_vec(proj_rot, p));
                    ctx.lineTo(p[0], p[1]);

                    p = [s * 0.5, 0, 0];
                    p = ray_project(mat3_mul_vec(proj_rot, p));
                    ctx.lineTo(p[0], p[1]);

                    ctx.stroke();

                    ctx.beginPath();

                    p = [0, 0, 0];
                    p = ray_project(mat3_mul_vec(proj_rot, p));
                    ctx.lineTo(p[0], p[1]);

                    p = [0, 0, 2.0];
                    p = ray_project(mat3_mul_vec(proj_rot, p));
                    ctx.lineTo(p[0], p[1]);

                    ctx.stroke();


                    ctx.beginPath();

                    p = [0, 0, 0];
                    p = ray_project(mat3_mul_vec(proj_rot, p));
                    ctx.lineTo(p[0], p[1]);

                    p = [0.0, -2.0, 0];
                    p = ray_project(mat3_mul_vec(proj_rot, p));
                    ctx.lineTo(p[0], p[1]);

                    ctx.stroke();


                    draw_arrow_tip([0.0, -2.1, 0], rot_x_mat3(Math.PI * 0.5), proj_rot, 0.08);
                    draw_arrow_tip([0, 0, 2.1], ident_matrix, proj_rot, 0.08);

                }


                ctx.lineWidth = 3.0;

                ctx.strokeStyle = "blue";

                let prev = undefined;
                for (let i = 0; i <= n; i++) {

                    let x = (i / n - 0.5);
                    let a = smooth_step(-0.5, -0.4, x) - smooth_step(0.4, 0.5, x);

                    x *= s;
                    let yy = Math.sin(x * k - sine_phase);
                    let y = amp * yy;
                    let p = [x, 0, y];

                    p = ray_project(mat3_mul_vec(proj_rot, p));

                    if (prev) {
                        let rgb = vec_lerp([194, 19, 50], [36, 11, 54], -y * 0.5 + 0.5);

                        ctx.strokeStyle = "rgba(" + Math.round(rgb[0]) + "," + Math.round(rgb[1]) + "," + Math.round(rgb[2]) + ",0.75)";

                        ctx.globalAlpha = a;
                        ctx.beginPath();
                        ctx.lineTo(prev[0], prev[1]);
                        ctx.lineTo(p[0], p[1]);
                        ctx.stroke();
                    }

                    prev = p;
                }

                ctx.strokeStyle = "red";

                prev = undefined;
                for (let i = 0; i <= n; i++) {

                    let x = (i / n - 0.5);
                    let a = smooth_step(-0.5, -0.4, x) - smooth_step(0.4, 0.5, x);

                    x *= s;
                    let yy = Math.sin(x * k - sine_phase);
                    let y = amp * yy;
                    let p = [x, -y, 0];

                    p = ray_project(mat3_mul_vec(proj_rot, p));

                    if (prev) {

                        let rgb = vec_lerp([16, 98, 100], [67, 159, 140], y * 0.5 + 0.5);

                        ctx.strokeStyle = "rgba(" + Math.round(rgb[0]) + "," + Math.round(rgb[1]) + "," + Math.round(rgb[2]) + ",0.75)";
                        ctx.globalAlpha = a;
                        ctx.beginPath();
                        ctx.lineTo(prev[0], prev[1]);
                        ctx.lineTo(p[0], p[1]);
                        ctx.stroke();
                    }

                    prev = p;
                }


                ctx.globalAlpha = 1.0;
                ctx.fillStyle = "#333";

                let pe = [0, 0, 2.2];
                pe = ray_project(mat3_mul_vec(proj_rot, pe));
                ctx.fillText("E", pe[0], pe[1] - font_size / 2);


                let pb = [0, -2.4, 0.0];
                pb = ray_project(mat3_mul_vec(proj_rot, pb));
                ctx.fillText("B", pb[0], pb[1] + font_size / 2);

                draw_feather();
            } else if (mode === "prism") {
                ctx.translate(Math.round(width * 0.5), Math.round(height * 0.5));

                let a = (arg0 - 0.5) * Math.PI * 0.27;
                let norm0 = [0, -Math.sin(a), -Math.cos(a)];
                let norm1 = [0, Math.sin(a), -Math.cos(a)];
                let d = 0.6;

                let n = 1.8;

                let proj = mat3_mul(proj_rot, scale_mat3(1.2));

                let source_d = 5.0;
                let start = [0, 0, -source_d];


                function ref(lambda) {

                    let B1 = 1.55912923;
                    let B2 = 0.209073176;
                    let B3 = 0.968842926;
                    let C1 = 0.0121481001;
                    let C2 = 0.0534549042;
                    let C3 = 112.174809;

                    lambda *= lambda;

                    let n = 1;
                    n += B1 * lambda / (lambda - C1);
                    n += B2 * lambda / (lambda - C2);
                    n += B3 * lambda / (lambda - C3);

                    return Math.sqrt(n);
                }


                function draw_glass() {

                    let s = 1.4;
                    let side0 = [[s, s, 0], [s, -s, 0], [-s, -s, 0], [-s, s, 0]];
                    let side1 = side0.slice();

                    transform_points(side0, rot_x_mat3(a));
                    transform_points(side1, rot_x_mat3(-a));

                    translate_points(side0, [0, 0, d]);
                    translate_points(side1, [0, 0, -d]);

                    let points = side0.concat(side1);
                    transform_points(points, proj);

                    for (let i = 0; i < points.length; i++) {
                        points[i] = ray_project(points[i]);
                    }

                    points = convex_hull(points);
                    ctx.fillStyle = glass_dark_fill;
                    ctx.strokeStyle = glass_dark_stroke;

                    ctx.beginPath();
                    for (let i = 0; i < points.length; i++) {
                        let p = points[i];
                        // p = ray_project(p);
                        ctx.lineTo(p[0], p[1]);
                    }
                    // ctx.closePath();
                    ctx.fill();

                    context_add_points(ctx, side0, proj);
                    ctx.stroke();
                    context_add_points(ctx, side1, proj);
                    ctx.stroke();

                    for (let i = 0; i < 4; i++) {
                        context_add_points(ctx, [side0[i], side1[i]], proj);
                        ctx.stroke();
                    }
                }


                function draw_rays() {

                    ctx.lineWidth = 1.5;
                    ctx.strokeStyle = "#fff";

                    ctx.lineCap = "butt";

                    let p0 = [0, 0, -source_d];
                    let p1 = [0, 0, -d];
                    let dir0 = vec_norm(vec_sub(p1, p0));
                    let rays = cie_xs.length;


                    context_add_points(ctx, [p0, p1], proj, false);
                    ctx.stroke();


                    ctx.globalCompositeOperation = "lighter";
                    ctx.globalAlpha = 0.12;

                    for (let i = 0; i <= rays; i++) {


                        let t = i / rays;
                        let lambda = 380 + t * (750 - 380);
                        let n = ref(lambda * 0.001);

                        let out_dir, out_p;
                        {
                            let dir1 = snell([p1, [0, 0, 1]], norm0, 1, n)[1];
                            let t1 = plane_intersect([p1, dir1], [[0, 0, d], norm1]);

                            let p2 = vec_add(p1, vec_scale(dir1, t1));

                            let dir2 = snell([p2, dir1], norm1, n, 1.0)[1];
                            let p3 = vec_add(p2, vec_scale(dir2, 3.5));
                            out_dir = dir2;
                            out_p = p3;
                        }


                        let dir1 = snell([p1, dir0], norm0, 1, n)[1];
                        let t1 = plane_intersect([p1, dir1], [[0, 0, d], norm1]);

                        let p2 = vec_add(p1, vec_scale(dir1, t1));


                        let dir2 = snell([p2, dir1], norm1, n, 1.0)[1];
                        let t2 = plane_intersect([p2, dir2], [out_p, out_dir]);

                        let p3 = vec_add(p2, vec_scale(dir2, t2));

                        context_add_points(ctx, [p1, p2, p3], proj, false);
                        ctx.strokeStyle = rgb_color_string(srgb_callback(mat3_mul_vec(pcs_to_srgb, [cie_xs[i], cie_ys[i], cie_zs[i]])))
                        ctx.stroke();
                    }

                    ctx.globalCompositeOperation = "source-over";
                    ctx.globalAlpha = 1.0;
                }

                draw_rays();

                ctx.lineWidth = 1.5;

                draw_glass();

                draw_feather();

            } else if (mode === "parallel" || mode === "glass_rays") {
                ctx.translate(Math.round(width * 0.5), Math.round(height * 0.5));
                let source_d = 5.0;
                let start = [0, 0, -source_d];
                let d = 0.4;

                let a = (arg0 - 0.5) * Math.PI * 0.16;
                if (mode === "glass_rays") {
                    a = 0.0;
                    start = mat3_mul_vec(rot_x_mat3((arg0 - 0.5)), start);
                    d = 0.05 + 0.7 * arg1;
                }
                let norm0 = [0, -Math.sin(a), -Math.cos(a)];
                let norm1 = [0, Math.sin(a), -Math.cos(a)];

                let n = 1.8;

                let proj = mat3_mul(proj_rot, scale_mat3(1.4));


                function draw_glass() {

                    let s = 1.4;
                    let side0 = [[s, s, 0], [s, -s, 0], [-s, -s, 0], [-s, s, 0]];
                    let side1 = side0.slice();

                    transform_points(side0, rot_x_mat3(a));
                    transform_points(side1, rot_x_mat3(-a));

                    translate_points(side0, [0, 0, d]);
                    translate_points(side1, [0, 0, -d]);

                    let points = side0.concat(side1);
                    transform_points(points, proj);

                    for (let i = 0; i < points.length; i++) {
                        points[i] = ray_project(points[i]);
                    }

                    points = convex_hull(points);
                    ctx.fillStyle = glass_fill;
                    ctx.strokeStyle = glass_stroke;

                    ctx.beginPath();
                    for (let i = 0; i < points.length; i++) {
                        let p = points[i];
                        // p = ray_project(p);
                        ctx.lineTo(p[0], p[1]);
                    }
                    // ctx.closePath();
                    ctx.fill();

                    context_add_points(ctx, side0, proj);
                    ctx.stroke();
                    context_add_points(ctx, side1, proj);
                    ctx.stroke();

                    for (let i = 0; i < 4; i++) {
                        context_add_points(ctx, [side0[i], side1[i]], proj);
                        ctx.stroke();
                    }
                }

                function draw_rays() {

                    ctx.lineWidth = ray_width;
                    ctx.strokeStyle = ray_stroke;

                    ctx.lineCap = "butt";

                    let out_dir, out_p;
                    {
                        let p1 = [0, 0, -d];
                        let dir1 = snell([p1, [0, 0, 1]], norm0, 1, 1.5)[1];
                        let t1 = plane_intersect([p1, dir1], [[0, 0, d], norm1]);

                        let p2 = vec_add(p1, vec_scale(dir1, t1));

                        let dir2 = snell([p2, dir1], norm1, 1.5, 1.0)[1];
                        let p3 = vec_add(p2, vec_scale(dir2, 3.5));
                        out_dir = dir2;
                        out_p = p3;
                    }

                    if (mode === "glass_rays") {
                        out_dir = vec_norm(start);
                    }

                    for (let i = 0; i < ray_vertices.length; i++) {

                        let center = ray_vertices[i];
                        // let p0 = vec_add(center, [0, 0, -source_d]);
                        let p0 = start;
                        let dir0 = vec_norm(vec_sub(center, p0));
                        let t0 = plane_intersect([p0, dir0], [[0, 0, -d], norm0]);

                        let p1 = vec_add(p0, vec_scale(dir0, t0));

                        let dir1 = snell([p1, dir0], norm0, 1, n)[1];
                        let t1 = plane_intersect([p1, dir1], [[0, 0, d], norm1]);

                        let p2 = vec_add(p1, vec_scale(dir1, t1));


                        let dir2 = snell([p2, dir1], norm1, n, 1.0)[1];
                        let t2 = plane_intersect([p2, dir2], [out_p, out_dir]);

                        let p3 = vec_add(p2, vec_scale(dir2, t2));

                        // p0 = mat3_mul_vec(rot, p0);

                        context_add_points(ctx, [p0, p1, p2, p3], proj, false);
                        ctx.stroke();
                    }
                }

                draw_rays();
                draw_source(proj, start, 0.08, 20);


                ctx.lineWidth = 1.5;

                draw_glass();

                draw_feather();

            } else if (mode === "subdiv") {
                ctx.translate(Math.round(width * 0.5), Math.round(height * 0.5));

                let sub = arg0 * 2 + 3;
                if (arg0 == 3)
                    sub = 15;

                let d = 0.4;

                let n = 1.8;

                let proj = mat3_mul(proj_rot, scale_mat3(1.6));

                let r = 1.1;
                let R = 2.5;
                let base = Math.sqrt(R * R - r * r);
                let angle = Math.asin(r / R);

                let clip_d = 4.0;

                let source_d = 4.0;
                let start = [0, 0, -source_d];

                let f = thin_lens_maker(n, R, -R);

                let focus_d = 1 / (1 / f - 1 / source_d);



                ctx.fillStyle = "red";
                let planes0 = [];
                let planes1 = [];
                for (let i = 0; i < sub; i++) {
                    let a = -angle + (i + 0.5) / sub * 2 * angle + Math.PI * 0.5;
                    let p = [0, R * Math.cos(a), + base - R * Math.sin(a)];

                    let norm = p.slice();
                    norm[2] -= base;
                    norm = vec_norm(norm);

                    let a0 = -angle + (i) / sub * 2 * angle + Math.PI * 0.5;
                    let p0 = [0, R * Math.cos(a0), + base - R * Math.sin(a0)];

                    let a1 = -angle + (i + 1) / sub * 2 * angle + Math.PI * 0.5;
                    let p1 = [0, R * Math.cos(a1), + base - R * Math.sin(a1)];


                    let pp = vec_lerp(p0, p1, 0.5);
                    planes0.push([pp, norm]);
                    pp = pp.slice();
                    pp[2] *= -1;
                    norm = norm.slice();
                    norm[2] *= -1;
                    planes1.push([pp, vec_scale(norm, -1)]);

                }

                function draw_glass() {


                    let side0 = [];

                    for (let i = 0; i <= sub; i++) {
                        let a = -angle + i / sub * 2 * angle + Math.PI * 0.5;
                        side0.push([r, R * Math.cos(a), - base + R * Math.sin(a)]);
                    }

                    for (let i = 0; i <= sub; i++) {
                        let a = angle - i / sub * 2 * angle + Math.PI * 0.5;
                        side0.push([r, R * Math.cos(a), + base - R * Math.sin(a)]);
                    }


                    let side1 = side0.slice();

                    scale_points(side1, -1);


                    let points = side0.slice().concat(side1);
                    transform_points(points, proj);

                    for (let i = 0; i < points.length; i++) {
                        points[i] = ray_project(points[i]);
                    }


                    let pairs = [];
                    if (arg0 == 0) {
                        ctx.strokeStyle = "rgba(255,255,255, 0.4)";

                        pairs = [1, 13, 2, 14, 6, 10, 5, 9];
                    } else if (arg0 == 1) {
                        ctx.strokeStyle = "rgba(255,255,255, 0.3)";

                        pairs = [1, 19, 2, 20, 3, 21, 4, 22, 7, 13, 8, 14, 9, 15, 10, 16];
                    } else if (arg0 == 2) {
                        ctx.strokeStyle = "rgba(255,255,255, 0.2)";

                        pairs = [1, 25, 2, 26, 3, 27, 4, 28, 5, 29, 6, 30,
                            14, 22, 13, 21, 12, 20, 11, 19, 10, 18, 9, 17];
                    }

                    for (let i = 0; i < pairs.length; i += 2) {
                        ctx.beginPath();
                        ctx.lineTo(points[pairs[i + 0]][0], points[pairs[i + 0]][1]);
                        ctx.lineTo(points[pairs[i + 1]][0], points[pairs[i + 1]][1]);
                        ctx.stroke();
                    }

                    points = convex_hull(points);
                    ctx.fillStyle = glass_fill;
                    ctx.strokeStyle = glass_stroke;

                    ctx.beginPath();
                    for (let i = 0; i < points.length; i++) {
                        let p = points[i];
                        // p = ray_project(p);
                        ctx.lineTo(p[0], p[1]);
                    }
                    ctx.closePath();

                    ctx.fill();

                    context_add_points(ctx, side0, proj, false, false);
                    context_add_points(ctx, side1, proj, false, false);
                    context_add_points(ctx, [[-r, r, 0], [r, r, 0]], proj, false, false);
                    context_add_points(ctx, [[-r, -r, 0], [r, -r, 0]], proj, false, false);
                    ctx.stroke();
                }

                function draw_rays() {

                    ctx.lineWidth = ray_width;
                    ctx.strokeStyle = ray_stroke;

                    ctx.lineCap = "butt";


                    let end = [0, 0, focus_d];

                    for (let i = 0; i < ray_vertices.length; i++) {

                        let center = ray_vertices[i];
                        // let p0 = vec_add(center, [0, 0, -source_d]);
                        let p0 = [0, 0, -source_d];
                        let dir0 = vec_norm(vec_sub(center, p0));

                        let p1 = center;
                        let norm1;
                        for (let k = 0; k < sub; k++) {
                            let lt = plane_intersect([p0, dir0], planes0[k]);
                            let p = vec_add(p0, vec_scale(dir0, lt));
                            p[2] -= base;
                            if (vec_len_sq([p[1], p[2]]) <= R * R) {
                                p[2] += base;
                                p1 = p;
                                norm1 = planes0[k][1];
                            }
                        }

                        let dir1 = snell([p1, dir0], norm1, 1, n)[1];
                        let p2 = center;
                        let norm2;

                        for (let k = 0; k < sub; k++) {
                            let lt = plane_intersect([p1, dir1], planes1[k]);
                            let p = vec_add(p1, vec_scale(dir1, lt));
                            p[2] += base;
                            if (vec_len_sq([p[1], p[2]]) <= R * R) {
                                p[2] -= base;
                                p2 = p;
                                norm2 = planes1[k][1];
                            }
                        }


                        let dir2 = snell([p2, dir1], norm2, n, 1)[1];

                        if (arg0 == 3) {

                            let t = plane_intersect([p2, dir2], [end, [0, 0, -1]]);
                            let p = vec_add(p2, vec_scale(dir2, t));
                            p[1] = 0;
                            dir2 = vec_norm(vec_sub(p, p2));
                            // dir2[1] = end[1] - p[2];
                        }


                        let p3 = vec_add(p2, vec_scale(dir2, 4));




                        context_add_points(ctx, [p0, p1, p2, p3], proj, false);
                        ctx.stroke();
                    }
                }

                draw_rays();
                draw_source(proj, start, 0.08, 20);


                ctx.lineWidth = 1.5;

                draw_glass();

                draw_feather();
            }


            else if (mode === "rotational" || mode === "focal_length" || mode === "rotational_focal" || mode === "device") {
                ctx.translate(Math.round(width * 0.5), Math.round(height * 0.5));

                let proj = mat3_mul(proj_rot, scale_mat3(1.7));
                if (mode === "rotational_focal"  || mode === "focal_length")
                    proj = mat3_mul(proj_rot, scale_mat3(1.5));
                let r = 1.0;
                let R = 2.0;
                let n = 1.7;


                let clip_d = 4.0;


                if (mode === "focal_length") {
                    R = lerp(2.5, 1.5, arg0);
                    n = lerp(1.3, 1.7, arg1);
                }
                let f = thin_lens_maker(n, R, -R);

                let source_d = 2 * f;

                if (mode === "rotational_focal") {
                    source_d = lerp(100, f * 1.01, Math.pow(arg0, 0.05));
                } else if (mode === "focal_length") {
                    source_d = 10000.0;
                }

                let focus_d = 1 / (1 / f - 1 / source_d);
                let base = Math.sqrt(R * R - r * r);


                ctx.lineWidth = ray_width;
                ctx.strokeStyle = ray_stroke;
                // ctx.strokeStyle = "rgba(44, 108, 240, 0.2)";

                ctx.lineCap = "butt";

                let device = mode === "device";

                if (device) {
                    clip_d = focus_d;
                }

                let start = [0, 0, -source_d];
                let end = [0, 0, focus_d];

                for (let i = 0; i < ray_vertices.length; i++) {
                    let center = ray_vertices[i];

                    let ray0 = vec_norm(vec_sub(center, start));
                    let ray1 = vec_norm(vec_sub(center, end));



                    let render0 = start;
                    let render1 = end;

                    if (source_d > clip_d) {
                        render0 = vec_add(center, vec_scale(ray0, plane_intersect([center, ray0], [[0, 0, -clip_d], [0, 0, -1]])));
                    }



                    let t_hit = sphere_intersect([start, ray0], [0, 0, base], R);
                    let p1 = vec_add(start, vec_scale(ray0, t_hit));

                    let t_hit2 = sphere_intersect([end, ray1], [0, 0, -base], R);
                    let p2 = vec_add(end, vec_scale(ray1, t_hit2));

                    // if (end[2] > clip_d) {
                    render1 = vec_add(center, vec_scale(ray1, plane_intersect([center, ray1], [[0, 0, clip_d], [0, 0, -1]])));
                    // }

                    if (device)
                        context_add_points(ctx, [render0, center, render1], proj, false);
                    else
                        context_add_points(ctx, [render0, p1, p2, render1], proj, false);
                    ctx.stroke();
                }

                ctx.globalAlpha = saturate(1.0 - (source_d - clip_d));
                draw_source(proj, start, 0.08, 20);
                ctx.globalAlpha = 1.0;

                if (device) {
                    ctx.strokeStyle = "rgba(0,0,0,0.3)";
                    ctx.fillStyle = "rgba(255,255,255,0.1)";
                    let side = circle_points(90);
                    // transform_points(side, proj);
                    context_add_points(ctx, side, proj);
                    ctx.fill();
                    ctx.stroke();
                }
                else
                    draw_lens(R, r, [0, 0, 0], proj, false, mode === "focal_length");

                ctx.strokeStyle = "rgba(0,0,0,0.3)";

                if (mode === "rotational_focal" || mode === "focal_length") {
                    let l = 0.2;
                    let d = -1.5;
                    context_add_points(ctx, [[-l, d, 0], [l, d, 0]], proj, false);
                    ctx.stroke();

                    ctx.globalAlpha = saturate(1.0 - (source_d - clip_d));
                    context_add_points(ctx, [[-l, d, -source_d], [l, d, -source_d]], proj, false);
                    ctx.stroke();
                    context_add_points(ctx, [[0, 0, -source_d], [0, d, -source_d]], proj, false);
                    ctx.stroke();
                    ctx.globalAlpha = 1.0;


                    context_add_points(ctx, [[0, -r, 0], [0, d, 0]], proj, false);
                    ctx.stroke();

                    context_add_points(ctx, [[0, d, 0], [0, d, -Math.min(source_d, clip_d)]], proj, false);
                    ctx.stroke();

                    context_add_points(ctx, [[0, d, 0], [0, d, Math.min(focus_d, clip_d)]], proj, false);
                    ctx.stroke();

                    ctx.globalAlpha = saturate(1.0 - (focus_d - clip_d));

                    context_add_points(ctx, [[-l, d, focus_d], [l, d, focus_d]], proj, false);
                    ctx.stroke();
                    context_add_points(ctx, [[0, 0, focus_d], [0, d, focus_d]], proj, false);
                    ctx.stroke();
                    ctx.globalAlpha = 1.0;

                    let o = height * 0.08;
                    let p;
                    p = [-l, d, -Math.min(source_d, clip_d) * 0.5];
                    p = ray_project(mat3_mul_vec(proj, p));

                    ctx.textAlign = "center";
                    ctx.fillStyle = "#333";

                    if (mode === "focal_length") {
                        ctx.fillText("∞", p[0], p[1] + o);

                        let p2 = [-l, d, f * 0.5];
                        p2 = ray_project(mat3_mul_vec(proj, p2));

                        ctx.fillText("f", p2[0], p2[1] + o);

                        ctx.fillText("n = " + n.toFixed(2), 0, -height / 2 + 40);
                    } else {
                        ctx.fillText("s", p[0], p[1] + o);

                        let p2 = [-l, d, Math.min(focus_d, clip_d) * 0.5];
                        p2 = ray_project(mat3_mul_vec(proj, p2));


                        ctx.fillText("s", p2[0], p2[1] + o);

                        ctx.font = font_size * 0.7 + "px IBM Plex Sans";

                        ctx.textAlign = "left";
                        ctx.fillText("o", p[0] + font_size * 0.2, p[1] + o + font_size * 0.1);
                        ctx.fillText("i", p2[0] + font_size * 0.2, p2[1] + o + font_size * 0.1);
                    }
                }

                draw_feather();

            } else if (mode === "spherical") {
                ctx.translate(Math.round(width * 0.5), Math.round(height * 0.5));

                let proj = mat3_mul(proj_rot, scale_mat3(1.65));
                let r = 1.0;
                let R = 1.85 + arg0 * 0.6;
                let n = 1.7;


                let clip_d = 4.0;


                let f = thin_lens_maker(n, R, -R);

                let source_d = 4.0;

                let focus_d = 1 / (1 / f - 1 / source_d);

                let base = Math.sqrt(R * R - r * r);
                let base_vec = [0, 0, base];


                ctx.lineWidth = ray_width;
                ctx.strokeStyle = ray_stroke;

                ctx.lineCap = "butt";


                let start = [0, 0, -source_d];
                let end = [0, 0, focus_d];

                ctx.globalAlpha = 0.5;
                for (let i = 0; i < ray_vertices.length; i++) {
                    let center = vec_scale(ray_vertices[i], 0.95);

                    let dir0 = vec_norm(vec_sub(center, start));

                    let render0 = start;

                    let t_hit = sphere_intersect([start, dir0], [0, 0, base], R);
                    let p1 = vec_add(start, vec_scale(dir0, t_hit));

                    let ray0 = [p1, dir0];
                    let ray1 = snell(ray0, sphere_normal(p1, base_vec), 1, n);

                    let t_hit2 = sphere_intersect(ray1, [0, 0, -base], -R);
                    let p2 = vec_add(p1, vec_scale(ray1[1], t_hit2));

                    let ray2 = [p2, ray1[1]];
                    let ray3 = snell(ray2, vec_scale(sphere_normal(p2, [0, 0, -base]), -1), n, 1);

                    let t_hit3 = plane_intersect(ray3, [[0, 0, clip_d], [0, 0, -1]]);
                    let p3 = vec_add(p2, vec_scale(ray3[1], t_hit3));

                    context_add_points(ctx, [render0, p1, p2, p3], proj, false);
                    ctx.stroke();
                }

                ctx.globalAlpha = 1.0;

                ctx.globalAlpha = saturate(1.0 - (source_d - clip_d));
                draw_source(proj, start, 0.08, 20);
                ctx.globalAlpha = 1.0;
                draw_lens(R, r, [0, 0, 0], proj);

                draw_feather();
            } else if (mode === "chromatic") {
                ctx.translate(Math.round(width * 0.5), Math.round(height * 0.5));

                let proj = mat3_mul(proj_rot, scale_mat3(1.55));
                let r = 1.0;
                let R = 2.0;


                let clip_d = 4.0;
                let source_d = 3.5;


                let fs = [];
                let ends = [];
                let colors = ["#ff0000", "#00ff00", "#0000ff"];
                let wave_n = 3;

                let fac = arg0 * 0.05 + 0.01;
                for (let i = 0; i < wave_n; i++) {
                    let n = 1.6 + fac * (i - 1);
                    let f = thin_lens_maker(n, R, -R);
                    fs.push(f);
                    ends.push([0, 0, 1 / (1 / f - 1 / source_d)]);
                }




                let base = Math.sqrt(R * R - r * r);
                let base_vec = [0, 0, base];


                ctx.lineWidth = ray_width;
                ctx.strokeStyle = ray_stroke;

                ctx.lineCap = "butt";

                ctx.globalCompositeOperation = "lighter";

                let start = [0, 0, -source_d];

                for (let i = 0; i < ray_vertices.length; i += 2) {
                    let center = ray_vertices[i];

                    let ray0 = vec_norm(vec_sub(center, start));



                    let render0 = start;

                    if (source_d > clip_d) {
                        render0 = vec_add(center, vec_scale(ray0, plane_intersect([center, ray0], [[0, 0, -clip_d], [0, 0, -1]])));
                    }


                    ctx.strokeStyle = "#fff";

                    ctx.globalAlpha = 0.1;
                    let t_hit = sphere_intersect([start, ray0], [0, 0, base], R);
                    let p1 = vec_add(start, vec_scale(ray0, t_hit));

                    context_add_points(ctx, [start, p1], proj, false);
                    ctx.stroke();

                    for (let k = 0; k < wave_n; k++) {
                        let end = ends[k];
                        let ray1 = vec_norm(vec_sub(center, end));

                        let t_hit2 = sphere_intersect([end, ray1], [0, 0, -base], R);
                        let p2 = vec_add(end, vec_scale(ray1, t_hit2));

                        let t_hit3 = plane_intersect([p2, ray1], [[0, 0, clip_d], [0, 0, -1]]);
                        let p3 = vec_add(p2, vec_scale(ray1, t_hit3));

                        ctx.strokeStyle = colors[k];
                        context_add_points(ctx, [p1, p2, p3], proj, false);
                        ctx.stroke();

                    }
                }
                ctx.globalCompositeOperation = "source-over";

                ctx.globalAlpha = 1.0;

                ctx.globalAlpha = saturate(1.0 - (source_d - clip_d));
                draw_source(proj, start, 0.08, 20, true);
                ctx.globalAlpha = 1.0;
                draw_lens(R, r, [0, 0, 0], proj, true);

                draw_feather();

            }
            else if (mode === "snell" || mode === "snell2") {
                ctx.translate(Math.round(width * 0.5), Math.round(height * 0.5));

                let a = (-arg0 + 0.5) * Math.PI * 8 / 9;
                let n1 = 1.0 + arg1 * 1.5;
                let n2 = 1.0 + arg2 * 1.5;

                let sin1 = Math.sin(a);
                let sin2 = n1 * sin1 / n2;

                let a2 = Math.asin(sin2);


                let refl = 0.0;

                if (mode === "snell2") {
                    let Rs = (n1 * Math.cos(a) - n2 * Math.cos(a2)) / (n1 * Math.cos(a) + n2 * Math.cos(a2))
                    Rs *= Rs;

                    let Rp = (n1 * Math.cos(a2) - n2 * Math.cos(a)) / (n1 * Math.cos(a2) + n2 * Math.cos(a))
                    Rp *= Rp;

                    refl = 0.5 * (Rs + Rp);
                }

                let trans = 1.0 - refl;

                ctx.lineCap = "round";
                ctx.lineJoin = "miter";

                let s = width * 0.5;

                ctx.save();
                ctx.scale(s, s);


                ctx.fillStyle = "rgba(130,165,200,0.1)";

                ctx.globalAlpha = arg1;
                ctx.fillRect(-width, -height, width * 2, height);

                ctx.globalAlpha = arg2;
                ctx.fillRect(-width, 0, width * 2, height);

                ctx.globalAlpha = 1.0;

                ctx.lineWidth = 2.0 / s;

                ctx.strokeStyle = glass_stroke;
                ctx.strokeRect(-width, 0, width * 2, height);


                ctx.lineWidth = 1.0 / s;


                ctx.setLineDash([1 / s, 4 / s]);
                ctx.strokeStyle = "rgba(0,0,0,0.3)";

                ctx.beginPath();
                ctx.lineTo(0, -0.8);
                ctx.lineTo(0, 0.8);
                ctx.stroke();

                ctx.setLineDash([]);

                let ray_l = 0.8;


                ctx.lineWidth = 2.5 / s;
                ctx.strokeStyle = "#222";
                ctx.beginPath();
                ctx.arc(0, 0, ray_l * 0.9, -a - Math.PI * 0.5, -Math.PI * 0.5, a < 0.0);
                ctx.stroke();



                ctx.strokeStyle = "#888";
                ctx.lineWidth = 1.5 / s;

                ctx.beginPath();
                ctx.arc(0, 0, ray_l * 0.9, -a2 - Math.PI * 1.5, -Math.PI * 1.5, a2 < 0.0);
                ctx.stroke();


                ctx.lineWidth = 4.0 / s;

                ctx.strokeStyle = light_stroke;

                ctx.save()

                ctx.beginPath();
                ctx.lineTo(0, 0);
                ctx.lineTo(-ray_l * Math.sin(a), -ray_l * Math.cos(a));


                ctx.rotate(-a);
                ctx.moveTo(0, -ray_l * 0.5);
                ctx.lineTo(-0.015, -ray_l * 0.5 - 0.05);
                ctx.lineTo(0.015, -ray_l * 0.5 - 0.05);
                ctx.closePath();

                ctx.stroke();

                ctx.restore();

                if (refl != 0.0) {
                    ctx.globalAlpha = refl;

                    ctx.save()
                    ctx.beginPath();
                    ctx.lineTo(0, 0);
                    ctx.lineTo(ray_l * Math.sin(a), -ray_l * Math.cos(a));

                    ctx.rotate(a);
                    ctx.moveTo(0, -ray_l * 0.5 - 0.05);
                    ctx.lineTo(-0.015, -ray_l * 0.5);
                    ctx.lineTo(0.015, -ray_l * 0.5);
                    ctx.closePath();
                    ctx.stroke();
                    ctx.restore();
                }

                ctx.globalAlpha = trans;


                if (Math.abs(sin2) < 1) {

                    ctx.save()

                    ctx.beginPath();
                    ctx.lineTo(0, 0);
                    ctx.lineTo(ray_l * Math.sin(a2), ray_l * Math.cos(a2));

                    ctx.rotate(-a2);
                    ctx.moveTo(0, ray_l * 0.5 + 0.05);
                    ctx.lineTo(-0.015, ray_l * 0.5);
                    ctx.lineTo(0.015, ray_l * 0.5);
                    ctx.closePath();
                    ctx.stroke();
                    ctx.restore();
                }

                ctx.globalAlpha = 1.0;


                ctx.restore();

                ctx.fillStyle = "#222";
                ctx.textAlign = "center";


                ctx.save();

                ctx.rotate(-a / 2);
                ctx.translate(0, -s * (0.85 - 0.08 * Math.abs(sin1)));
                ctx.fillText("θ₁ = " + (Math.abs(a) * 180 / Math.PI).toFixed(1) + "°", 0, 0);
                ctx.restore();

                if (Math.abs(sin2) < 1) {
                    ctx.save();

                    ctx.fillStyle = "#666";

                    ctx.rotate(-a2 / 2);
                    ctx.translate(0, s * (0.93 - 0.08 * Math.abs(sin2)));
                    ctx.fillText("θ₂ = " + (Math.abs(a2) * 180 / Math.PI).toFixed(1) + "°", 0, 0);
                    ctx.restore();

                }

                ctx.textAlign = "left";
                ctx.fillStyle = blue_style;
                ctx.fillText("n₁ = " + n1.toFixed(2), -width * 0.45, -height * 0.45 + 10);

                ctx.fillStyle = yellow_style;
                ctx.fillText("n₂ = " + n2.toFixed(2), -width * 0.45, height * 0.45);

            } else if (mode === "cone_angle") {

                ctx.translate(Math.round(width * 0.5), Math.round(height * 0.5));

                let r = 1.0 * (1.0 - arg0 * 0.75);
                let im_r = 0.5 * r;

                let proj = mat3_mul(proj_rot, scale_mat3(1.6));

                let lens_z = -3.0;
                let im_z = 3.0;
                let end0 = [0.0, 0.0, 1];

                function draw_start_rays() {
                    ctx.lineWidth = ray_width;
                    for (let i = 0; i < ray_vertices.length; i++) {
                        ctx.strokeStyle = ray_stroke;

                        let center = vec_add(vec_scale(ray_vertices[i], r), [0, 0, lens_z]);

                        let ray0 = vec_norm(vec_sub(center, end0));
                        let clip = vec_add(end0, vec_scale(ray0, (-end0[2] + im_z) / ray0[2]));
                        context_add_points(ctx, [center, clip], proj, false);
                        ctx.stroke();
                    }
                }


                function draw_projection() {

                    let box_ps = [
                        [+1, +1, im_z],
                        [-1, +1, im_z],
                        [-1, -1, im_z],
                        [+1, -1, im_z],
                    ];


                    if (!poly_front_facing(box_ps, proj))
                        ctx.globalCompositeOperation = "destination-over";

                    context_add_points(ctx, box_ps, proj);
                    ctx.lineWidth = 1.0;
                    ctx.strokeStyle = "rgba(0,0,0,0.3)"
                    ctx.fillStyle = "rgba(255,255,255,0.3)"
                    ctx.fill();
                    ctx.stroke();


                    ctx.fillStyle = ray_fill;
                    let circle_ps = circle_points(mode === "cone_hex" ? 6 : 60);
                    scale_points(circle_ps, im_r);
                    translate_points(circle_ps, [0, 0, im_z]);
                    context_add_points(ctx, circle_ps, proj, true);
                    ctx.fill();

                    ctx.globalCompositeOperation = "source-over";

                }


                draw_start_rays();


                draw_projection();

                draw_feather();

            } else if (mode === "cone_slice") {

                ctx.translate(Math.round(width * 0.5), Math.round(height * 0.5));

                let r = 1.0;
                let R = 2.0;
                let n = 1.5;
                let source_d = 3.75 - 1.5 * arg0;
                let lens_z = 0.0;
                let im_z = 3.0;


                let base = Math.sqrt(R * R - r * r);
                let proj = mat3_mul(proj_rot, scale_mat3(1.6));

                let f = 1.5;


                let focus_d = 1 / (1 / f - 1 / source_d);

                let im_r = Math.abs((im_z - (focus_d + lens_z)) * r / (focus_d));


                let start = [0, 0, -source_d + lens_z];
                let end = [0, 0, focus_d + lens_z];

                function draw_start_rays() {
                    ctx.strokeStyle = ray_stroke;
                    ctx.lineWidth = ray_width;
                    for (let i = 0; i < ray_vertices.length; i++) {
                        let center = vec_add(ray_vertices[i], [0, 0, lens_z]);

                        let ray0 = vec_norm(vec_sub(center, start));
                        let ray1 = vec_norm(vec_sub(center, end));

                        let t_hit = sphere_intersect([start, ray0], [0, 0, base + lens_z], R);
                        let p0 = vec_add(start, vec_scale(ray0, t_hit));

                        let t_hit2 = sphere_intersect([end, ray1], [0, 0, -base + lens_z], R);
                        let p1 = vec_add(end, vec_scale(ray1, t_hit2));


                        let clip = vec_add(end, vec_scale(ray1, (-end[2] + im_z) / ray1[2]));

                        context_add_points(ctx, [start, p0, p1, clip], proj, false);
                        ctx.stroke();
                    }
                }


                function draw_projection() {

                    let box_ps = [
                        [+1, +1, im_z],
                        [-1, +1, im_z],
                        [-1, -1, im_z],
                        [+1, -1, im_z],
                    ];


                    if (!poly_front_facing(box_ps, proj))
                        ctx.globalCompositeOperation = "destination-over";

                    context_add_points(ctx, box_ps, proj);
                    ctx.lineWidth = 1.0;
                    ctx.strokeStyle = "rgba(0,0,0,0.3)"
                    ctx.fillStyle = "rgba(255,255,255,0.3)"
                    ctx.fill();
                    ctx.stroke();


                    ctx.fillStyle = ray_fill;
                    let circle_ps = circle_points(mode === "cone_hex" ? 6 : 60);
                    scale_points(circle_ps, im_r);
                    translate_points(circle_ps, [0, 0, im_z]);
                    context_add_points(ctx, circle_ps, proj, true);
                    // transform_points(box_ps, proj);
                    ctx.fill();

                    ctx.globalCompositeOperation = "source-over";

                }


                draw_start_rays();

                draw_lens(R, r, [0, 0, lens_z], proj);
                draw_source(proj, start, 0.08, 20);


                draw_projection();

                draw_feather();

            } else if (mode === "f") {

                ctx.translate(Math.round(width * 0.5), Math.round(height * 0.5));
                let r = Math.floor(height * 0.5) * Math.pow(2.0, -0.5 * arg0);

                ctx.fillStyle = "#fff";
                ctx.fillEllipse(0, 0, r);

            }  else if (mode === "cone_aperture" || mode === "cone_dof" || mode === "cone_hex") {
                ctx.translate(Math.round(width * 0.5), Math.round(height * 0.5));

                let ap = lerp(0.5, 0.05, arg0);
                let r = 1.0;
                let R = 2.0;
                let n = 1.5;
                let source_d = 2.0;
                let lens_z = -2.0;
                let ap_z = 0.0;
                let im_z = 3.0;


                let proj = mat3_mul(proj_rot, scale_mat3(1.6));
                if (mode === "cone_dof")
                    proj = mat3_mul(proj_rot, scale_mat3(1.4));

                let f = 1 / (1 / 2.0 + 1 / 4.0);
                if (mode === "cone_dof") {
                    ap = lerp(0.34, 0.2, arg0);
                    source_d = lerp(5.5, 1.5, arg2);
                    im_z = 3.0;
                    ap_z = 2.0;
                    lens_z = 1.0
                    f = lerp(1.1, 1.3, arg1);
                    R = lerp(1.8, 2.1, arg1);
                }
                let max_im_r = 0.1;

                let base = Math.sqrt(R * R - r * r);

                let focus_d = 1 / (1 / f - 1 / source_d);


                let light_r_at_ap = Math.min(ap, Math.abs((ap_z - (focus_d + lens_z)) * r / (focus_d)));

                function im_r_f(src) {
                    let foc_d = 1 / (1 / f - 1 / src);
                    return Math.abs((im_z - (foc_d + lens_z)) * light_r_at_ap / (foc_d + lens_z - ap_z));
                }
                let im_r = im_r_f(source_d);

                function bisect(a, b) {
                    let c = a;
                    for (let i = 0; i < 20; i++) {
                        c = (a + b) * 0.5;

                        if ((im_r_f(c) >= max_im_r) == (im_r_f(a) >= max_im_r))
                            a = c;
                        else
                            b = c;
                    }
                    return c;
                }

                let focus_source_d = 1 / (1 / f - 1 / (im_z - lens_z));

                let dof0_source_d = bisect(30, focus_source_d);
                let dof1_source_d = bisect(focus_source_d, 0.01);




                let start = [0, 0, -source_d + lens_z];
                let end = [0, 0, focus_d + lens_z];

                function draw_start_rays() {
                    ctx.strokeStyle = ray_stroke;
                    ctx.lineWidth = ray_width;
                    for (let i = 0; i < ray_vertices.length; i++) {
                        let center = vec_add(ray_vertices[i], [0, 0, lens_z]);

                        let ray0 = vec_norm(vec_sub(center, start));
                        let ray1 = vec_norm(vec_sub(center, end));

                        let t_hit = sphere_intersect([start, ray0], [0, 0, base + lens_z], R);
                        let p0 = vec_add(start, vec_scale(ray0, t_hit));

                        let t_hit2 = sphere_intersect([end, ray1], [0, 0, -base + lens_z], R);
                        let p1 = vec_add(end, vec_scale(ray1, t_hit2));


                        let clip = vec_add(end, vec_scale(ray1, (-end[2] + ap_z) / ray1[2]));

                        context_add_points(ctx, [start, p0, p1, clip], proj, false);
                        ctx.stroke();
                    }
                }

                function draw_end_rays() {
                    ctx.strokeStyle = ray_stroke;
                    ctx.lineWidth = ray_width;
                    for (let i = 0; i < ray_vertices.length; i++) {
                        let center = vec_add(ray_vertices[i], [0, 0, lens_z]);

                        let ray1 = vec_norm(vec_sub(center, end));

                        let clip = vec_add(end, vec_scale(ray1, (-end[2] + ap_z) / ray1[2]));

                        if (mode === "cone_hex") {
                            // let w = 0.2;
                            if (Math.max(Math.abs(clip[1]) * 0.5 + Math.abs(clip[0]) * 0.8660254, Math.abs(clip[1])) > ap * 0.8660254)
                                continue;

                        } else if (clip[0] * clip[0] + clip[1] * clip[1] > ap * ap)
                            continue;


                        let clip2 = vec_add(clip, vec_scale(ray1, (-clip[2] + im_z) / ray1[2]));


                        context_add_points(ctx, [clip, clip2], proj, false);
                        ctx.stroke();
                    }
                }

                function draw_aperture() {

                    let circle_ps = circle_points(60);



                    translate_points(circle_ps, [0, 0, ap_z]);
                    context_add_points(ctx, circle_ps, proj, true);

                    if (mode === "cone_hex") {
                        circle_ps = circle_points(6);
                    }
                    for (let i = 0; i < circle_ps.length; i++) {
                        let p = vec_scale(circle_ps[i], ap);
                        p[2] = ap_z;
                        p = mat3_mul_vec(proj, p);
                        p = ray_project(p);
                        if (i == 0)
                            ctx.moveTo(p[0], p[1]);
                        else
                            ctx.lineTo(p[0], p[1]);
                    }
                    ctx.closePath();
                    ctx.fillStyle = "rgba(0,0,0,0.8)";
                    ctx.fill("evenodd");
                }
                function draw_projection() {

                    let box_ps = [
                        [+1, +1, im_z],
                        [-1, +1, im_z],
                        [-1, -1, im_z],
                        [+1, -1, im_z],
                    ];


                    if (!poly_front_facing(box_ps, proj))
                        ctx.globalCompositeOperation = "destination-over";

                    context_add_points(ctx, box_ps, proj);
                    ctx.lineWidth = 1.0;
                    ctx.strokeStyle = "rgba(0,0,0,0.3)"
                    ctx.fillStyle = "rgba(255,255,255,0.3)"
                    ctx.fill();
                    ctx.stroke();

                    if (mode === "cone_dof") {

                        translate_points(box_ps, [0, 0, -im_z])
                        scale_points(box_ps, max_im_r);
                        translate_points(box_ps, [0, 0, im_z])

                        context_add_points(ctx, box_ps, proj);
                        ctx.lineWidth = 1.0;
                        ctx.strokeStyle = "rgba(0,0,0,0.3)"
                        ctx.fillStyle = "rgba(255,255,255,0.3)"
                        ctx.fill();
                        ctx.stroke();
                    }


                    ctx.fillStyle = ray_fill;
                    let circle_ps = circle_points(mode === "cone_hex" ? 6 : 60);
                    scale_points(circle_ps, im_r);
                    translate_points(circle_ps, [0, 0, im_z]);
                    context_add_points(ctx, circle_ps, proj, true);
                    // transform_points(box_ps, proj);
                    ctx.fill();

                    ctx.globalCompositeOperation = "source-over";

                }

                function draw_start() {

                    draw_start_rays();
                    draw_source(proj, start, 0.08, 20);

                    draw_lens(R, r, [0, 0, lens_z], proj, false, mode === "cone_dof");


                    if (mode === "cone_dof") {

                        let p0 = ray_project(mat3_mul_vec(proj, [0, 0, -dof0_source_d + lens_z]));
                        let p1 = ray_project(mat3_mul_vec(proj, [0, 0, -dof1_source_d + lens_z]));

                        ctx.strokeStyle = ctx.fillStyle = "#3E53A7";
                        ctx.fillEllipse(p0[0], p0[1], 3);
                        ctx.fillEllipse(p1[0], p1[1], 3);

                        let p = ray_project(mat3_mul_vec(proj, [0, 0, -focus_source_d + lens_z]));

                        ctx.fillStyle = "#5DC614";
                        ctx.fillEllipse(p[0], p[1], 3);
                    }
                }


                let box_ps = [
                    [+1, +1, ap_z],
                    [-1, +1, ap_z],
                    [-1, -1, ap_z],
                    [+1, -1, ap_z],
                ];


                if (poly_front_facing(box_ps, proj)) {
                    draw_start();
                    draw_aperture();
                    draw_end_rays();
                }
                else {
                    draw_end_rays();
                    draw_aperture();
                    draw_start();
                }

                draw_projection();

                draw_feather();
            }

            else if (mode === "sphere") {
                ctx.translate(Math.round(width * 0.5), Math.round(height * 0.5));

                let a = arg0 * Math.PI * 0.5;
                let n = 1.0 + arg1 * 2.0;

                let ray_in = [[0, 0, 0], [Math.sin(a), -Math.cos(a), 0]];
                let ray_out = snell(ray_in, [0, 1, 0], n, 1);

                let s = width * 0.2;

                ctx.lineWidth = 3.0 / s;
                ctx.scale(s, s);

                ctx.strokeStyle = "blue";
                ctx.beginPath();
                ctx.lineTo(0, 0);
                ctx.lineTo(-0.8 * ray_in[1][0], 0.8 * ray_in[1][1]);
                ctx.stroke();

                ctx.strokeStyle = "red";
                ctx.beginPath();
                ctx.lineTo(0, 0);
                ctx.lineTo(0.8 * ray_out[1][0], -0.8 * ray_out[1][1]);
                ctx.stroke();
            }

        }

        if (load_text)
            document.fonts.load("10px IBM Plex Sans").then(function () { request_repaint() });

        this.on_resize();

        window.addEventListener("resize", this.on_resize, true);
        window.addEventListener("load", this.on_resize, true);

    }

    document.addEventListener("DOMContentLoaded", function (event) {



        new Drawer(scale, document.getElementById("lens_scene"), "scene");
        new Drawer(scale, document.getElementById("lens_bare_film"), "bare_film");

        detector = new Drawer(scale, document.getElementById("lens_detector"), "detector");
        detector_slider = new Slider(document.getElementById("lens_detector_sl0"), function (x) {
            detector.set_arg0(x);
        }, undefined, 0);


        let detector_rgbg = new Drawer(scale, document.getElementById("lens_detector_rgbg"), "detector_rgbg");
        new Slider(document.getElementById("lens_detector_rgbg_sl0"), function (x) {
            detector_rgbg.set_arg0(x);
        }, undefined, 0);

        let detector_rgb = new Drawer(scale, document.getElementById("lens_detector_rgb"), "detector_rgb");
        new Slider(document.getElementById("lens_detector_rgb_sl0"), function (x) {
            detector_rgb.set_arg0(x);
        }, undefined, 0);

        let bayer = new Drawer(scale, document.getElementById("lens_bayer"), "bayer");

        let rgb_filter = new Drawer(scale, document.getElementById("lens_rgb_filter"), "rgb_filter");
        new Slider(document.getElementById("lens_rgb_filter_sl0"), function (x) {
            rgb_filter.set_arg0(x);
        }, undefined, 0);


        new Drawer(scale, document.getElementById("lens_sensor_rays"), "sensor_rays");
        new Drawer(scale, document.getElementById("lens_scene_rays"), "scene_rays");


        let box = new Drawer(scale, document.getElementById("lens_box"), "box");
        new Slider(document.getElementById("lens_box_sl0"), function (x) {
            box.set_arg0(x);
        });
        new Slider(document.getElementById("lens_box_sl1"), function (x) {
            box.set_arg1(x);
        });

        box_lens = new Drawer(scale, document.getElementById("lens_box_lens"), "box_lens");
        new Slider(document.getElementById("lens_box_lens_sl0"), function (x) {
            box_lens.set_arg0(x);
        });
        new Slider(document.getElementById("lens_box_lens_sl1"), function (x) {
            box_lens.set_arg1(x);
        });


        let box_ap = new Drawer(scale, document.getElementById("lens_box_aperture"), "box_aperture");
        new Slider(document.getElementById("lens_box_aperture_sl0"), function (x) {
            box_ap.set_arg0(x);
        });
        new Slider(document.getElementById("lens_box_aperture_sl1"), function (x) {
            box_ap.set_arg1(x);
        });


        let film = new Drawer(scale, document.getElementById("lens_film"), "film");
        new Slider(document.getElementById("lens_film_sl0"), function (x) {
            film.set_arg0(x);
        });
        new Slider(document.getElementById("lens_film_sl1"), function (x) {
            film.set_arg1(x);
        });


        let film_exposure = new Drawer(scale, document.getElementById("lens_film_exposure"), "film_exposure");
        new Slider(document.getElementById("lens_film_exposure_sl0"), function (x) {
            film_exposure.set_arg0(x);
        });
        new Slider(document.getElementById("lens_film_exposure_sl1"), function (x) {
            film_exposure.set_arg1(x);
        });



        let basic = new Drawer(scale, document.getElementById("lens_basic"), "basic");
        new Slider(document.getElementById("lens_basic_sl0"), function (x) {
            basic.set_arg0(x);
        });
        new Slider(document.getElementById("lens_basic_sl1"), function (x) {
            basic.set_arg1(x);
        });


        let focus_demo = new Drawer(scale, document.getElementById("lens_focus_demo"), "focus_demo");

        new Slider(document.getElementById("lens_focus_demo_sl0"), function (x) {
            focus_demo.set_arg0(x);
        }, undefined, 0);

        let focus_demo2 = new Drawer(scale, document.getElementById("lens_focus_demo2"), "focus_demo2");
        new Slider(document.getElementById("lens_focus_demo2_sl0"), function (x) {
            focus_demo2.set_arg0(x);
        }, undefined, 0);

        let focus_demo3 = new Drawer(scale, document.getElementById("lens_focus_demo3"), "focus_demo3");
        new Slider(document.getElementById("lens_focus_demo3_sl0"), function (x) {
            focus_demo3.set_arg0(x);
        }, undefined, 0);
        new Slider(document.getElementById("lens_focus_demo3_sl1"), function (x) {
            focus_demo3.set_arg1(x);
        }, undefined, 0);

        let bokeh = new Drawer(scale, document.getElementById("lens_bokeh"), "bokeh");
        new Slider(document.getElementById("lens_bokeh_sl0"), function (x) {
            bokeh.set_arg0(x);
        }, undefined, 0);


        let hero = new Drawer(scale, document.getElementById("lens_hero"), "hero");
        new Slider(document.getElementById("lens_hero_sl0"), function (x) {
            hero.set_arg0(x);
        });
        new Slider(document.getElementById("lens_hero_sl1"), function (x) {
            hero.set_arg1(x);
        });
        new Slider(document.getElementById("lens_hero_sl2"), function (x) {
            hero.set_arg2(x);
        });


        let film_invert = new Drawer(scale, document.getElementById("lens_film_invert"), "film_invert");


        let frustum = new Drawer(scale, document.getElementById("lens_frustum"), "frustum");
        new Slider(document.getElementById("lens_frustum_sl0"), function (x) {
            frustum.set_arg0(x);
        });

        field = new Drawer(scale, document.getElementById("lens_field"), "field");
        field_slider = new Slider(document.getElementById("lens_field_sl0"), function (x) {
            field.set_arg0(x);
        });


        let field2 = new Drawer(scale, document.getElementById("lens_field2"), "field2");
        new Slider(document.getElementById("lens_field2_sl0"), function (x) {
            field2.set_arg0(x);
        });

        new Slider(document.getElementById("lens_field2_sl1"), function (x) {
            field2.set_arg1(x);
        });

        let pixel_view = new Drawer(scale, document.getElementById("lens_hole_pixel_view"), "pixel_view");
        new Slider(document.getElementById("lens_hole_pixel_view_sl0"), function (x) {
            pixel_view.set_arg0(x);
        });


        let hole_solid_angle = new Drawer(scale, document.getElementById("lens_hole_solid_angle"), "hole_solid_angle");
        new Slider(document.getElementById("lens_hole_solid_angle_sl0"), function (x) {
            hole_solid_angle.set_arg0(x);
        });

        let lens_solid_angle = new Drawer(scale, document.getElementById("lens_lens_solid_angle"), "lens_solid_angle");
        new Slider(document.getElementById("lens_lens_solid_angle_sl0"), function (x) {
            lens_solid_angle.set_arg0(x);
        });

        new Slider(document.getElementById("lens_lens_solid_angle_sl1"), function (x) {
            lens_solid_angle.set_arg1(x);
        });

        let lens_solid_angle2 = new Drawer(scale, document.getElementById("lens_lens_solid_angle2"), "lens_solid_angle2");
        new Slider(document.getElementById("lens_lens_solid_angle2_sl0"), function (x) {
            lens_solid_angle2.set_arg0(x);
        }, undefined, 0);

        lens_hole_sharpness = new Drawer(scale, document.getElementById("lens_hole_sharpness"), "hole_sharpness");

        lens_hole_sharpness_slider = new Slider(document.getElementById("lens_hole_sharpness_sl0"), function (x) {
            lens_hole_sharpness.set_arg0(x);
        });


        glass = new Drawer(scale, document.getElementById("lens_glass"), "glass");
        glass_slider = new Slider(document.getElementById("lens_glass_sl0"), function (x) {
            glass.set_arg0(x);
        });

        glass_rays = new Drawer(scale, document.getElementById("lens_glass_rays"), "glass_rays");

        glass_rays_slider_0 = new Slider(document.getElementById("lens_glass_rays_sl0"), function (x) {
            glass_rays.set_arg0(x);
        });
        glass_rays_slider_1 = new Slider(document.getElementById("lens_glass_rays_sl1"), function (x) {
            glass_rays.set_arg1(x);
        });


        let wave_2d = new Drawer(scale, document.getElementById("lens_wave_2d"), "wave_2d");
        let wave_3d = new Drawer(scale, document.getElementById("lens_wave_3d"), "wave_3d");
        let wave_rays = new Drawer(scale, document.getElementById("lens_wave_rays"), "wave_rays");


        wave_glass = new Drawer(scale, document.getElementById("lens_wave_glass"), "wave_glass");


        wave_glass2 = new Drawer(scale, document.getElementById("lens_wave_glass2"), "wave_glass2");
        wave_glass2_slider0 = new Slider(document.getElementById("lens_wave_glass2_sl0"), function (x) {
            wave_glass2.set_arg0(x);
        });
        wave_glass2_slider1 = new Slider(document.getElementById("lens_wave_glass2_sl1"), function (x) {
            wave_glass2.set_arg1(x);
        });


        let prism = new Drawer(scale, document.getElementById("lens_prism"), "prism");

        new Slider(document.getElementById("lens_prism_sl0"), function (x) {
            prism.set_arg0(x);
        });

        let parallel = new Drawer(scale, document.getElementById("lens_parallel"), "parallel");

        new Slider(document.getElementById("lens_parallel_sl0"), function (x) {
            parallel.set_arg0(x);
        });

        subdiv = new Drawer(scale, document.getElementById("lens_subdiv"), "subdiv");

        subdiv_seg = new SegmentedControl(document.getElementById("lens_subdiv_seg0"), function (x) {
            subdiv.set_arg0(x);
        },
            ["3", "5", "7", "∞"]
        );

        let fs = new Drawer(scale, document.getElementById("lens_f"), "f");

        new SegmentedControl(document.getElementById("lens_f_seg0"), function (x) {
            fs.set_arg0(x);
        },
            ["<em>f</em>/1.4", "<em>f</em>/2", "<em>f</em>/2.8", "<em>f</em>/4", "<em>f</em>/5.6", "<em>f</em>/8"]
        );

        new Drawer(scale, document.getElementById("lens_device"), "device");
        new Drawer(scale, document.getElementById("lens_rotational"), "rotational");
        let spherical = new Drawer(scale, document.getElementById("lens_spherical"), "spherical");
        new Slider(document.getElementById("lens_spherical_sl0"), function (x) {
            spherical.set_arg0(x);
        });

        let chromatic = new Drawer(scale, document.getElementById("lens_chromatic"), "chromatic");
        new Slider(document.getElementById("lens_chromatic_sl0"), function (x) {
            chromatic.set_arg0(x);
        });

        let focal_length = new Drawer(scale, document.getElementById("lens_focal_length"), "focal_length");

        new Slider(document.getElementById("lens_focal_length_sl0"), function (x) {
            focal_length.set_arg0(x);
        });
        new Slider(document.getElementById("lens_focal_length_sl1"), function (x) {
            focal_length.set_arg1(x);
        });


        let sine = new Drawer(scale, document.getElementById("lens_sine"), "sine");

        new Slider(document.getElementById("lens_sine_sl0"), function (x) {
            sine.set_arg0(x);
        });
        new Slider(document.getElementById("lens_sine_sl1"), function (x) {
            sine.set_arg1(x);
        }, undefined, 0);

        let em = new Drawer(scale, document.getElementById("lens_em"), "em");




        rotational_focal = new Drawer(scale, document.getElementById("lens_rotational_focal"), "rotational_focal");
        rotational_focal_slider = new Slider(document.getElementById("lens_rotational_focal_sl0"), function (x) {
            rotational_focal.set_arg0(x);
        }, undefined, 0.8);



        snell_w = new Drawer(scale, document.getElementById("lens_snell"), "snell");

        snell_slider0 = new Slider(document.getElementById("lens_snell_sl0"), function (x) {
            snell_w.set_arg0(x);
        });

        snell_slider1 = new Slider(document.getElementById("lens_snell_sl1"), function (x) {
            snell_w.set_arg1(x);
        }, undefined, 0);

        snell_slider2 = new Slider(document.getElementById("lens_snell_sl2"), function (x) {
            snell_w.set_arg2(x);
        });


        snell2 = new Drawer(scale, document.getElementById("lens_snell2"), "snell2");

        snell_slider20 = new Slider(document.getElementById("lens_snell2_sl0"), function (x) {
            snell2.set_arg0(x);
        });

        snell_slider21 = new Slider(document.getElementById("lens_snell2_sl1"), function (x) {
            snell2.set_arg1(x);
        }, undefined, 0);

        snell_slider22 = new Slider(document.getElementById("lens_snell2_sl2"), function (x) {
            snell2.set_arg2(x);
        });



        let cone_angle = new Drawer(scale, document.getElementById("lens_cone_angle"), "cone_angle");

        new Slider(document.getElementById("lens_cone_angle_sl0"), function (x) {
            cone_angle.set_arg0(x);
        });


        let cone_slice = new Drawer(scale, document.getElementById("lens_cone_slice"), "cone_slice");

        new Slider(document.getElementById("lens_cone_slice_sl0"), function (x) {
            cone_slice.set_arg0(x);
        });



        let cone_aperture = new Drawer(scale, document.getElementById("lens_cone_aperture"), "cone_aperture");

        new Slider(document.getElementById("lens_cone_aperture_sl0"), function (x) {
            cone_aperture.set_arg0(x);
        });

        let cone_hex = new Drawer(scale, document.getElementById("lens_cone_hex"), "cone_hex");

        new Slider(document.getElementById("lens_cone_hex_sl0"), function (x) {
            cone_hex.set_arg0(x);
        });

        cone_dof = new Drawer(scale, document.getElementById("lens_cone_dof"), "cone_dof");
        cone_dof_slider0 = new Slider(document.getElementById("lens_cone_dof_sl0"), function (x) {
            cone_dof.set_arg0(x);
        });
        cone_dof_slider1 = new Slider(document.getElementById("lens_cone_dof_sl1"), function (x) {
            cone_dof.set_arg1(x);
        });
        cone_dof_slider2 = new Slider(document.getElementById("lens_cone_dof_sl2"), function (x) {
            cone_dof.set_arg2(x);
        });



        let blades = new Drawer(scale, document.getElementById("lens_blades"), "blades");

        new Slider(document.getElementById("lens_blades_sl0"), function (x) {
            blades.set_arg0(x);
        }, undefined, 0);



        animated_drawers = [
            sine,
            wave_2d,
            wave_3d,
            wave_rays,
            wave_glass,
            wave_glass2,
            em,
        ];

        for (let i = 0; i < animated_drawers.length; i++) {
            animated_drawers[i].set_paused(false);
        }
    });
})();

function lens_under_exp() {
    detector.set_arg0(0.1);
    detector_slider.set_value(0.1);
}

function lens_over_exp() {
    detector.set_arg0(1.0);
    detector_slider.set_value(1.0);
}

function lens_sharp_0() {
    lens_hole_sharpness.set_arg0(0.1);
    lens_hole_sharpness_slider.set_value(0.1);
}

function lens_sharp_1() {
    lens_hole_sharpness.set_arg0(0.8);
    lens_hole_sharpness_slider.set_value(0.8);
}

function lens_glass_0() {
    glass.set_mvp(ident_matrix);
    glass.set_arg0(0.7);
    glass_slider.set_value(0.7);
}


function lens_glass_1() {
    glass.set_mvp(rot_y_mat3(-0.92));
    glass.set_arg0(0.7);
    glass_slider.set_value(0.7);
}


function lens_snell_0() {
    snell_w.set_arg0(0.25);
    snell_slider0.set_value(0.25);
    
    snell_w.set_arg1(0.0);
    snell_slider1.set_value(0.0);

    snell_w.set_arg2(0.7);
    snell_slider2.set_value(0.7);
}


function lens_snell_1() {
    snell_w.set_arg0(0.25);
    snell_slider0.set_value(0.25);
    snell_w.set_arg1(0.7);
    snell_slider1.set_value(0.7);
    snell_w.set_arg2(0.4);
    snell_slider2.set_value(0.4);
}

function lens_snell_2() {
    snell_w.set_arg0(0.1);
    snell_slider0.set_value(0.1);
    snell_w.set_arg1(0.7);
    snell_slider1.set_value(0.7);
    snell_w.set_arg2(0.4);
    snell_slider2.set_value(0.4);
}

function lens_snell_3() {
    snell2.set_arg0(0.1);
    snell_slider20.set_value(0.1);
    snell2.set_arg1(0.7);
    snell_slider21.set_value(0.7);
    snell2.set_arg2(0.4);
    snell_slider22.set_value(0.4);
}

function lens_snell_4() {
    let a = 0.1792;
    snell2.set_arg0(a);
    snell_slider20.set_value(a);
    snell2.set_arg1(0.7);
    snell_slider21.set_value(0.7);
    snell2.set_arg2(0.4);
    snell_slider22.set_value(0.4);
}

function lens_subdiv_0() {
    subdiv.set_arg0(3);
    subdiv_seg.set_selection(3);
}


function lens_subdiv_1() {
    subdiv.set_arg0(3);
    subdiv_seg.set_selection(3);
    subdiv.set_mvp(rot_y_mat3(Math.PI * 0.37));
}

function lens_subdiv_2() {
    subdiv.set_arg0(3);
    subdiv_seg.set_selection(3);
    subdiv.set_mvp(mat3_mul(rot_x_mat3(Math.PI*0.5), rot_y_mat3(Math.PI * 0.5)));
}


function lens_inf() {
    rotational_focal.set_arg0(0);
    rotational_focal_slider.set_value(0);
}


function lens_camera_lens() {
    
    box_lens.set_mvp(rot_y_mat3(Math.PI * 0.052));
}



function lens_dof_0() {
    cone_dof.set_arg0(0.0);
    cone_dof_slider0.set_value(0.0);

}

function lens_dof_1() {
    cone_dof.set_arg1(0.0);
    cone_dof_slider1.set_value(0.0);
}

function lens_field_0() {
    field.set_arg0(0.0);
    field_slider.set_value(0.0);
}

function lens_glass_rays_0() {
    glass_rays.set_mvp(rot_y_mat3(Math.PI * 0.5));
    glass_rays.set_arg0(1);
    glass_rays.set_arg1(1);
    glass_rays_slider_0.set_value(1);
    glass_rays_slider_1.set_value(1);
}

function lens_wave_glass_0() {
    wave_glass.set_mvp(ident_matrix);
}

function lens_wave_glass_2() {
    wave_glass2.set_mvp(mat3_mul(rot_y_mat3(Math.PI * 0.5), rot_z_mat3(-Math.PI * 0.5)));
    wave_glass2.set_arg0(1);
    wave_glass2.set_arg1(1);
    wave_glass2_slider0.set_value(1);
    wave_glass2_slider1.set_value(1);
}


function global_animate(animate) {

    for (var i = 0; i < animated_drawers.length; i++) {
        animated_drawers[i].set_paused(!animate);
    }

    if (animate) {
        document.getElementById("global_animate_on").classList.remove("hidden");
        document.getElementById("global_animate_off").classList.add("hidden");
    }
    else {
        document.getElementById("global_animate_on").classList.add("hidden");
        document.getElementById("global_animate_off").classList.remove("hidden");
    }
}



let im32 = [
    0.388235, 0.380392, 0.454902, 0.329412,
    0.369935, 0.360784, 0.45098, 0.298039, 0.368627, 0.372549, 0.447059, 0.286275,
    0.383007, 0.364706, 0.462745, 0.321569, 0.364706, 0.360784, 0.447059, 0.286275,
    0.369935, 0.360784, 0.454902, 0.294118, 0.377778, 0.376471, 0.462745, 0.294118,
    0.363399, 0.356863, 0.45098, 0.282353, 0.34902, 0.341176, 0.435294, 0.270588,
    0.35817, 0.352941, 0.443137, 0.278431, 0.363399, 0.356863, 0.45098, 0.282353,
    0.35817, 0.345098, 0.443137, 0.286275, 0.371242, 0.380392, 0.447059, 0.286275,
    0.381699, 0.388235, 0.462745, 0.294118, 0.372549, 0.364706, 0.458824, 0.294118,
    0.385621, 0.376471, 0.470588, 0.309804, 0.381699, 0.368627, 0.466667, 0.309804,
    0.360784, 0.341176, 0.443137, 0.298039, 0.364706, 0.360784, 0.454902, 0.278431,
    0.352941, 0.352941, 0.443137, 0.262745, 0.347712, 0.345098, 0.439216, 0.258824,
    0.337255, 0.337255, 0.427451, 0.247059, 0.334641, 0.341176, 0.419608, 0.243137,
    0.329412, 0.321569, 0.415686, 0.25098, 0.328105, 0.317647, 0.415686, 0.25098,
    0.335948, 0.313725, 0.423529, 0.270588, 0.343791, 0.317647, 0.431373, 0.282353,
    0.351634, 0.317647, 0.439216, 0.298039, 0.354248, 0.309804, 0.443137, 0.309804,
    0.363399, 0.32549, 0.443137, 0.321569, 0.359477, 0.317647, 0.439216, 0.321569,
    0.364706, 0.345098, 0.443137, 0.305882, 0.430065, 0.454902, 0.505882, 0.329412,
    0.413072, 0.447059, 0.490196, 0.301961, 0.396078, 0.435294, 0.478431, 0.27451,
    0.403922, 0.435294, 0.486275, 0.290196, 0.389542, 0.419608, 0.470588, 0.278431,
    0.401307, 0.431373, 0.482353, 0.290196, 0.407843, 0.435294, 0.486275, 0.301961,
    0.397386, 0.423529, 0.47451, 0.294118, 0.384314, 0.411765, 0.462745, 0.278431,
    0.379085, 0.411765, 0.462745, 0.262745, 0.385621, 0.415686, 0.470588, 0.270588,
    0.398693, 0.419608, 0.482353, 0.294118, 0.396078, 0.443137, 0.470588, 0.27451,
    0.389542, 0.439216, 0.470588, 0.258824, 0.394771, 0.419608, 0.47451, 0.290196,
    0.402614, 0.423529, 0.486275, 0.298039, 0.407843, 0.427451, 0.490196, 0.305882,
    0.405229, 0.411765, 0.486275, 0.317647, 0.401307, 0.423529, 0.486275, 0.294118,
    0.403922, 0.427451, 0.490196, 0.294118, 0.4, 0.423529, 0.486275, 0.290196,
    0.39085, 0.419608, 0.470588, 0.282353, 0.384314, 0.407843, 0.462745, 0.282353,
    0.389542, 0.419608, 0.47451, 0.27451, 0.393464, 0.423529, 0.478431, 0.278431,
    0.393464, 0.419608, 0.47451, 0.286275, 0.392157, 0.407843, 0.470588, 0.298039,
    0.414379, 0.431373, 0.490196, 0.321569, 0.413072, 0.439216, 0.494118, 0.305882,
    0.424837, 0.443137, 0.505882, 0.32549, 0.433987, 0.447059, 0.513725, 0.341176,
    0.414379, 0.431373, 0.486275, 0.32549, 0.43268, 0.478431, 0.509804, 0.309804,
    0.437908, 0.466667, 0.517647, 0.329412, 0.433987, 0.462745, 0.517647, 0.321569,
    0.418301, 0.454902, 0.501961, 0.298039, 0.420915, 0.447059, 0.501961, 0.313725,
    0.427451, 0.458824, 0.509804, 0.313725, 0.415686, 0.454902, 0.494118, 0.298039,
    0.407843, 0.439216, 0.486275, 0.298039, 0.397386, 0.431373, 0.47451, 0.286275,
    0.397386, 0.435294, 0.478431, 0.278431, 0.405229, 0.435294, 0.486275, 0.294118,
    0.416993, 0.454902, 0.501961, 0.294118, 0.40915, 0.454902, 0.486275, 0.286275,
    0.410458, 0.462745, 0.490196, 0.278431, 0.426144, 0.462745, 0.505882, 0.309804,
    0.431373, 0.458824, 0.513725, 0.321569, 0.430065, 0.454902, 0.509804, 0.32549,
    0.411765, 0.443137, 0.486275, 0.305882, 0.410458, 0.443137, 0.486275, 0.301961,
    0.420915, 0.447059, 0.501961, 0.313725, 0.433987, 0.454902, 0.517647, 0.329412,
    0.430065, 0.466667, 0.509804, 0.313725, 0.418301, 0.45098, 0.494118, 0.309804,
    0.418301, 0.458824, 0.494118, 0.301961, 0.424837, 0.462745, 0.501961, 0.309804,
    0.419608, 0.454902, 0.494118, 0.309804, 0.439216, 0.454902, 0.517647, 0.345098,
    0.452288, 0.470588, 0.529412, 0.356863, 0.437908, 0.462745, 0.513725, 0.337255,
    0.443137, 0.470588, 0.521569, 0.337255, 0.45098, 0.490196, 0.533333, 0.329412,
    0.426144, 0.458824, 0.498039, 0.321569, 0.45098, 0.494118, 0.529412, 0.329412,
    0.448366, 0.478431, 0.52549, 0.341176, 0.437908, 0.478431, 0.521569, 0.313725,
    0.448366, 0.494118, 0.533333, 0.317647, 0.464052, 0.486275, 0.545098, 0.360784,
    0.462745, 0.494118, 0.541176, 0.352941, 0.461438, 0.498039, 0.541176, 0.345098,
    0.45098, 0.494118, 0.529412, 0.329412, 0.440523, 0.490196, 0.521569, 0.309804,
    0.437908, 0.482353, 0.517647, 0.313725, 0.439216, 0.482353, 0.521569, 0.313725,
    0.45098, 0.501961, 0.533333, 0.317647, 0.428758, 0.490196, 0.505882, 0.290196,
    0.448366, 0.494118, 0.521569, 0.329412, 0.473203, 0.509804, 0.54902, 0.360784,
    0.473203, 0.517647, 0.545098, 0.356863, 0.484967, 0.52549, 0.556863, 0.372549,
    0.466667, 0.509804, 0.541176, 0.34902, 0.44183, 0.478431, 0.517647, 0.329412,
    0.444444, 0.470588, 0.521569, 0.341176, 0.469281, 0.490196, 0.54902, 0.368627,
    0.457516, 0.490196, 0.537255, 0.345098, 0.437908, 0.482353, 0.513725, 0.317647,
    0.447059, 0.486275, 0.521569, 0.333333, 0.445752, 0.490196, 0.517647, 0.329412,
    0.45098, 0.490196, 0.521569, 0.341176, 0.464052, 0.486275, 0.537255, 0.368627,
    0.465359, 0.490196, 0.537255, 0.368627, 0.465359, 0.494118, 0.537255, 0.364706,
    0.452288, 0.498039, 0.529412, 0.329412, 0.479739, 0.513725, 0.556863, 0.368627,
    0.462745, 0.494118, 0.533333, 0.360784, 0.479739, 0.517647, 0.556863, 0.364706,
    0.470588, 0.509804, 0.54902, 0.352941, 0.479739, 0.52549, 0.560784, 0.352941,
    0.469281, 0.517647, 0.552941, 0.337255, 0.469281, 0.517647, 0.54902, 0.341176,
    0.460131, 0.509804, 0.537255, 0.333333, 0.466667, 0.513725, 0.545098, 0.341176,
    0.475817, 0.52549, 0.552941, 0.34902, 0.48366, 0.537255, 0.564706, 0.34902,
    0.464052, 0.521569, 0.545098, 0.32549, 0.462745, 0.52549, 0.545098, 0.317647,
    0.466667, 0.521569, 0.54902, 0.329412, 0.481046, 0.54902, 0.556863, 0.337255,
    0.457516, 0.537255, 0.52549, 0.309804, 0.383007, 0.462745, 0.423529, 0.262745,
    0.320261, 0.403922, 0.34902, 0.207843, 0.31634, 0.388235, 0.345098, 0.215686,
    0.351634, 0.419608, 0.396078, 0.239216, 0.414379, 0.47451, 0.478431, 0.290196,
    0.469281, 0.509804, 0.545098, 0.352941, 0.471895, 0.513725, 0.552941, 0.34902,
    0.462745, 0.505882, 0.545098, 0.337255, 0.44183, 0.498039, 0.517647, 0.309804,
    0.45098, 0.505882, 0.529412, 0.317647, 0.461438, 0.505882, 0.533333, 0.345098,
    0.465359, 0.501961, 0.537255, 0.356863, 0.47451, 0.513725, 0.54902, 0.360784,
    0.487582, 0.533333, 0.560784, 0.368627, 0.495425, 0.541176, 0.572549, 0.372549,
    0.464052, 0.52549, 0.545098, 0.321569, 0.49281, 0.541176, 0.572549, 0.364706,
    0.486275, 0.517647, 0.560784, 0.380392, 0.488889, 0.521569, 0.560784, 0.384314,
    0.490196, 0.52549, 0.568627, 0.376471, 0.491503, 0.529412, 0.568627, 0.376471,
    0.482353, 0.541176, 0.560784, 0.345098, 0.500654, 0.564706, 0.580392, 0.356863,
    0.490196, 0.545098, 0.564706, 0.360784, 0.49281, 0.54902, 0.564706, 0.364706,
    0.50719, 0.560784, 0.584314, 0.376471, 0.505882, 0.560784, 0.584314, 0.372549,
    0.499346, 0.560784, 0.580392, 0.356863, 0.498039, 0.564706, 0.584314, 0.345098,
    0.512418, 0.568627, 0.592157, 0.376471, 0.431373, 0.513725, 0.490196, 0.290196,
    0.223529, 0.388235, 0.231373, 0.0509804, 0.211765, 0.411765, 0.215686, 0.00784314,
    0.164706, 0.294118, 0.12549, 0.0745098, 0.129412, 0.227451, 0.0862745, 0.0745098,
    0.0745098, 0.176471, 0, 0.0470588, 0.105882, 0.211765, 0.0627451, 0.0431373,
    0.341176, 0.403922, 0.392157, 0.227451, 0.495425, 0.54902, 0.576471, 0.360784,
    0.487582, 0.529412, 0.564706, 0.368627, 0.461438, 0.513725, 0.537255, 0.333333,
    0.467974, 0.513725, 0.541176, 0.34902, 0.495425, 0.52549, 0.568627, 0.392157,
    0.500654, 0.541176, 0.576471, 0.384314, 0.491503, 0.556863, 0.572549, 0.345098,
    0.504575, 0.576471, 0.580392, 0.356863, 0.505882, 0.568627, 0.584314, 0.364706,
    0.495425, 0.556863, 0.576471, 0.352941, 0.50719, 0.556863, 0.588235, 0.376471,
    0.508497, 0.556863, 0.588235, 0.380392, 0.47451, 0.521569, 0.541176, 0.360784,
    0.521569, 0.556863, 0.596078, 0.411765, 0.529412, 0.576471, 0.603922, 0.407843,
    0.529412, 0.584314, 0.607843, 0.396078, 0.522876, 0.572549, 0.596078, 0.4,
    0.513725, 0.576471, 0.588235, 0.376471, 0.522876, 0.584314, 0.596078, 0.388235,
    0.537255, 0.596078, 0.611765, 0.403922, 0.517647, 0.580392, 0.592157, 0.380392,
    0.51634, 0.584314, 0.596078, 0.368627, 0.545098, 0.603922, 0.623529, 0.407843,
    0.499346, 0.552941, 0.560784, 0.384314, 0.296732, 0.458824, 0.313725, 0.117647,
    0.470588, 0.662745, 0.513725, 0.235294, 0.500654, 0.698039, 0.552941, 0.25098,
    0.393464, 0.576471, 0.431373, 0.172549, 0.248366, 0.380392, 0.247059, 0.117647,
    0.156863, 0.215686, 0.141176, 0.113725, 0.117647, 0.14902, 0.0980392, 0.105882,
    0, 0, 0, 0, 0.383007, 0.447059, 0.443137, 0.258824,
    0.522876, 0.568627, 0.603922, 0.396078, 0.500654, 0.537255, 0.576471, 0.388235,
    0.494118, 0.541176, 0.568627, 0.372549, 0.505882, 0.541176, 0.580392, 0.396078,
    0.524183, 0.568627, 0.6, 0.403922, 0.532026, 0.596078, 0.611765, 0.388235,
    0.518954, 0.592157, 0.596078, 0.368627, 0.50719, 0.576471, 0.584314, 0.360784,
    0.50719, 0.572549, 0.584314, 0.364706, 0.521569, 0.580392, 0.596078, 0.388235,
    0.524183, 0.576471, 0.6, 0.396078, 0.495425, 0.560784, 0.564706, 0.360784,
    0.524183, 0.576471, 0.603922, 0.392157, 0.534641, 0.588235, 0.611765, 0.403922,
    0.550327, 0.603922, 0.627451, 0.419608, 0.545098, 0.607843, 0.623529, 0.403922,
    0.534641, 0.607843, 0.611765, 0.384314, 0.546405, 0.619608, 0.623529, 0.396078,
    0.554248, 0.623529, 0.631373, 0.407843, 0.545098, 0.611765, 0.619608, 0.403922,
    0.546405, 0.619608, 0.623529, 0.396078, 0.572549, 0.615686, 0.643137, 0.458824,
    0.34902, 0.435294, 0.372549, 0.239216, 0.541176, 0.74902, 0.592157, 0.282353,
    0.694118, 0.913725, 0.760784, 0.407843, 0.678431, 0.909804, 0.74902, 0.376471,
    0.6, 0.831373, 0.670588, 0.298039, 0.414379, 0.619608, 0.458824, 0.164706,
    0.192157, 0.309804, 0.168627, 0.0980392, 0.124183, 0.172549, 0.101961, 0.0980392,
    0.0928105, 0.113725, 0.0588235, 0.105882, 0.0993464, 0.141176, 0.0745098, 0.0823529,
    0.494118, 0.541176, 0.564706, 0.376471, 0.537255, 0.572549, 0.611765, 0.427451,
    0.532026, 0.580392, 0.611765, 0.403922, 0.545098, 0.6, 0.623529, 0.411765,
    0.546405, 0.6, 0.623529, 0.415686, 0.547712, 0.607843, 0.623529, 0.411765,
    0.559477, 0.615686, 0.631373, 0.431373, 0.533333, 0.596078, 0.607843, 0.396078,
    0.513725, 0.592157, 0.588235, 0.360784, 0.538562, 0.607843, 0.615686, 0.392157,
    0.545098, 0.596078, 0.615686, 0.423529, 0.508497, 0.560784, 0.584314, 0.380392,
    0.566013, 0.619608, 0.647059, 0.431373, 0.528105, 0.584314, 0.607843, 0.392157,
    0.568627, 0.627451, 0.643137, 0.435294, 0.602614, 0.65098, 0.67451, 0.482353,
    0.596078, 0.662745, 0.67451, 0.45098, 0.581699, 0.658824, 0.658824, 0.427451,
    0.559477, 0.627451, 0.635294, 0.415686, 0.564706, 0.627451, 0.639216, 0.427451,
    0.579085, 0.643137, 0.654902, 0.439216, 0.504575, 0.564706, 0.556863, 0.392157,
    0.240523, 0.407843, 0.25098, 0.0627451, 0.603922, 0.815686, 0.658824, 0.337255,
    0.660131, 0.886275, 0.721569, 0.372549, 0.657516, 0.882353, 0.72549, 0.364706,
    0.610458, 0.835294, 0.678431, 0.317647, 0.470588, 0.686275, 0.52549, 0.2,
    0.320261, 0.490196, 0.337255, 0.133333, 0.164706, 0.25098, 0.137255, 0.105882,
    0.118954, 0.145098, 0.0980392, 0.113725, 0.00784314, 0, 0, 0.0235294,
    0.35817, 0.392157, 0.411765, 0.270588, 0.488889, 0.537255, 0.568627, 0.360784,
    0.49281, 0.54902, 0.568627, 0.360784, 0.533333, 0.584314, 0.615686, 0.4,
    0.541176, 0.596078, 0.619608, 0.407843, 0.552941, 0.623529, 0.627451, 0.407843,
    0.580392, 0.643137, 0.658824, 0.439216, 0.56732, 0.639216, 0.647059, 0.415686,
    0.538562, 0.623529, 0.615686, 0.376471, 0.559477, 0.631373, 0.635294, 0.411765,
    0.573856, 0.631373, 0.647059, 0.443137, 0.423529, 0.466667, 0.486275, 0.317647,
    0.470588, 0.509804, 0.541176, 0.360784, 0.439216, 0.498039, 0.505882, 0.313725,
    0.504575, 0.560784, 0.572549, 0.380392, 0.55817, 0.635294, 0.631373, 0.407843,
    0.528105, 0.603922, 0.611765, 0.368627, 0.580392, 0.647059, 0.654902, 0.439216,
    0.596078, 0.654902, 0.662745, 0.470588, 0.598693, 0.666667, 0.67451, 0.454902,
    0.614379, 0.705882, 0.698039, 0.439216, 0.347712, 0.439216, 0.376471, 0.227451,
    0.320261, 0.47451, 0.32549, 0.160784, 0.6, 0.811765, 0.65098, 0.337255,
    0.639216, 0.858824, 0.698039, 0.360784, 0.636601, 0.854902, 0.698039, 0.356863,
    0.56732, 0.780392, 0.623529, 0.298039, 0.532026, 0.745098, 0.584314, 0.266667,
    0.443137, 0.639216, 0.482353, 0.207843, 0.210458, 0.317647, 0.196078, 0.117647,
    0.0901961, 0.101961, 0.0509804, 0.117647, 0.0601307, 0.0901961, 0, 0.0901961,
    0.207843, 0.219608, 0.235294, 0.168627, 0.360784, 0.403922, 0.427451, 0.25098,
    0.406536, 0.443137, 0.47451, 0.301961, 0.464052, 0.482353, 0.54902, 0.360784,
    0.487582, 0.529412, 0.568627, 0.364706, 0.566013, 0.643137, 0.643137, 0.411765,
    0.573856, 0.654902, 0.654902, 0.411765, 0.581699, 0.670588, 0.666667, 0.407843,
    0.538562, 0.631373, 0.619608, 0.364706, 0.52549, 0.580392, 0.6, 0.396078,
    0.521569, 0.564706, 0.592157, 0.407843, 0.295425, 0.329412, 0.321569, 0.235294,
    0.341176, 0.356863, 0.392157, 0.27451, 0.386928, 0.435294, 0.439216, 0.286275,
    0.414379, 0.470588, 0.470588, 0.301961, 0.405229, 0.478431, 0.466667, 0.270588,
    0.389542, 0.443137, 0.45098, 0.27451, 0.40915, 0.45098, 0.470588, 0.305882,
    0.541176, 0.592157, 0.611765, 0.419608, 0.630065, 0.694118, 0.701961, 0.494118,
    0.579085, 0.654902, 0.65098, 0.431373, 0.266667, 0.341176, 0.270588, 0.188235,
    0.299346, 0.427451, 0.286275, 0.184314, 0.416993, 0.6, 0.435294, 0.215686,
    0.511111, 0.72549, 0.556863, 0.25098, 0.494118, 0.698039, 0.537255, 0.247059,
    0.371242, 0.564706, 0.388235, 0.160784, 0.350327, 0.521569, 0.364706, 0.164706,
    0.318954, 0.470588, 0.32549, 0.160784, 0.245752, 0.368627, 0.235294, 0.133333,
    0.096732, 0.113725, 0.0392157, 0.137255, 0.0901961, 0.117647, 0.0313725, 0.121569,
    0.176471, 0.188235, 0.176471, 0.164706, 0.288889, 0.298039, 0.337255, 0.231373,
    0.354248, 0.364706, 0.415686, 0.282353, 0.389542, 0.372549, 0.462745, 0.333333,
    0.396078, 0.407843, 0.466667, 0.313725, 0.542484, 0.627451, 0.623529, 0.376471,
    0.586928, 0.686275, 0.670588, 0.403922, 0.606536, 0.698039, 0.686275, 0.435294,
    0.530719, 0.623529, 0.607843, 0.360784, 0.487582, 0.521569, 0.560784, 0.380392,
    0.467974, 0.478431, 0.529412, 0.396078, 0.260131, 0.27451, 0.27451, 0.231373,
    0.364706, 0.380392, 0.415686, 0.298039, 0.385621, 0.4, 0.439216, 0.317647,
    0.384314, 0.423529, 0.439216, 0.290196, 0.356863, 0.407843, 0.407843, 0.254902,
    0.329412, 0.360784, 0.376471, 0.25098, 0.341176, 0.388235, 0.392157, 0.243137,
    0.443137, 0.501961, 0.509804, 0.317647, 0.481046, 0.541176, 0.541176, 0.360784,
    0.457516, 0.505882, 0.517647, 0.34902, 0.226144, 0.301961, 0.207843, 0.168627,
    0.360784, 0.521569, 0.368627, 0.192157, 0.50719, 0.709804, 0.545098, 0.266667,
    0.524183, 0.741176, 0.572549, 0.258824, 0.47451, 0.67451, 0.513725, 0.235294,
    0.513725, 0.729412, 0.564706, 0.247059, 0.501961, 0.705882, 0.545098, 0.254902,
    0.499346, 0.709804, 0.541176, 0.247059, 0.282353, 0.419608, 0.282353, 0.145098,
    0.0666667, 0.0666667, 0, 0.133333, 0.105882, 0.129412, 0.0627451, 0.12549,
    0.151634, 0.168627, 0.141176, 0.145098, 0.254902, 0.25098, 0.298039, 0.215686,
    0.301961, 0.290196, 0.356863, 0.258824, 0.324183, 0.309804, 0.380392, 0.282353,
    0.300654, 0.278431, 0.356863, 0.266667, 0.501961, 0.564706, 0.576471, 0.364706,
    0.596078, 0.678431, 0.67451, 0.435294, 0.564706, 0.643137, 0.639216, 0.411765,
    0.515033, 0.607843, 0.592157, 0.345098, 0.481046, 0.517647, 0.54902, 0.376471,
    0.498039, 0.521569, 0.556863, 0.415686, 0.312418, 0.34902, 0.341176, 0.247059,
    0.324183, 0.34902, 0.356863, 0.266667, 0.342484, 0.341176, 0.392157, 0.294118,
    0.333333, 0.356863, 0.384314, 0.258824, 0.321569, 0.360784, 0.368627, 0.235294,
    0.301961, 0.329412, 0.34902, 0.227451, 0.279739, 0.294118, 0.321569, 0.223529,
    0.279739, 0.321569, 0.309804, 0.207843, 0.28366, 0.345098, 0.313725, 0.192157,
    0.300654, 0.356863, 0.329412, 0.215686, 0.166013, 0.247059, 0.117647, 0.133333,
    0.36732, 0.541176, 0.380392, 0.180392, 0.639216, 0.870588, 0.694118, 0.352941,
    0.631373, 0.847059, 0.686275, 0.360784, 0.534641, 0.741176, 0.576471, 0.286275,
    0.605229, 0.831373, 0.658824, 0.32549, 0.647059, 0.886275, 0.705882, 0.34902,
    0.464052, 0.67451, 0.501961, 0.215686, 0.185621, 0.290196, 0.160784, 0.105882,
    0.122876, 0.141176, 0.0901961, 0.137255, 0.124183, 0.145098, 0.0901961, 0.137255,
    0.137255, 0.152941, 0.121569, 0.137255, 0.303268, 0.32549, 0.345098, 0.239216,
    0.355556, 0.376471, 0.415686, 0.27451, 0.362092, 0.356863, 0.423529, 0.305882,
    0.350327, 0.337255, 0.415686, 0.298039, 0.435294, 0.45098, 0.509804, 0.345098,
    0.528105, 0.6, 0.603922, 0.380392, 0.50719, 0.588235, 0.580392, 0.352941,
    0.482353, 0.552941, 0.54902, 0.345098, 0.478431, 0.52549, 0.541176, 0.368627,
    0.449673, 0.47451, 0.501961, 0.372549, 0.290196, 0.32549, 0.309804, 0.235294,
    0.248366, 0.266667, 0.266667, 0.211765, 0.290196, 0.298039, 0.32549, 0.247059,
    0.299346, 0.321569, 0.337255, 0.239216, 0.315033, 0.345098, 0.356863, 0.243137,
    0.318954, 0.345098, 0.364706, 0.247059, 0.286275, 0.305882, 0.32549, 0.227451,
    0.284967, 0.313725, 0.317647, 0.223529, 0.273203, 0.305882, 0.301961, 0.211765,
    0.228758, 0.266667, 0.235294, 0.184314, 0.143791, 0.235294, 0.0745098, 0.121569,
    0.248366, 0.376471, 0.227451, 0.141176, 0.551634, 0.772549, 0.592157, 0.290196,
    0.573856, 0.788235, 0.619608, 0.313725, 0.419608, 0.588235, 0.439216, 0.231373,
    0.556863, 0.772549, 0.6, 0.298039, 0.534641, 0.74902, 0.576471, 0.278431,
    0.338562, 0.501961, 0.345098, 0.168627, 0.156863, 0.243137, 0.12549, 0.101961,
    0.130719, 0.160784, 0.0980392, 0.133333, 0.129412, 0.145098, 0.0980392, 0.145098,
    0.118954, 0.129412, 0.0901961, 0.137255, 0.216993, 0.227451, 0.239216, 0.184314,
    0.27451, 0.282353, 0.309804, 0.231373, 0.30719, 0.294118, 0.356863, 0.270588,
    0.32549, 0.305882, 0.380392, 0.290196, 0.375163, 0.372549, 0.439216, 0.313725,
    0.39085, 0.4, 0.458824, 0.313725, 0.376471, 0.388235, 0.435294, 0.305882,
    0.338562, 0.352941, 0.380392, 0.282353, 0.364706, 0.380392, 0.415686, 0.298039,
    0.350327, 0.360784, 0.384314, 0.305882, 0.223529, 0.243137, 0.227451, 0.2,
    0.243137, 0.262745, 0.25098, 0.215686, 0.29281, 0.305882, 0.329412, 0.243137,
    0.296732, 0.329412, 0.329412, 0.231373, 0.288889, 0.329412, 0.317647, 0.219608,
    0.300654, 0.321569, 0.337255, 0.243137, 0.291503, 0.321569, 0.321569, 0.231373,
    0.288889, 0.329412, 0.313725, 0.223529, 0.265359, 0.298039, 0.294118, 0.203922,
    0.226144, 0.254902, 0.239216, 0.184314, 0.176471, 0.254902, 0.133333, 0.141176,
    0.154248, 0.254902, 0.0901961, 0.117647, 0.454902, 0.658824, 0.482353, 0.223529,
    0.524183, 0.74902, 0.568627, 0.254902, 0.337255, 0.517647, 0.333333, 0.160784,
    0.448366, 0.639216, 0.478431, 0.227451, 0.477124, 0.678431, 0.513725, 0.239216,
    0.318954, 0.478431, 0.317647, 0.160784, 0.152941, 0.239216, 0.121569, 0.0980392,
    0.12549, 0.160784, 0.0901961, 0.12549, 0.128105, 0.145098, 0.0980392, 0.141176,
    0.115033, 0.12549, 0.0784314, 0.141176, 0.206536, 0.219608, 0.219608, 0.180392,
    0.249673, 0.25098, 0.282353, 0.215686, 0.248366, 0.231373, 0.278431, 0.235294,
    0.253595, 0.247059, 0.286275, 0.227451, 0.269281, 0.262745, 0.309804, 0.235294,
    0.304575, 0.294118, 0.352941, 0.266667, 0.346405, 0.352941, 0.396078, 0.290196,
    0.308497, 0.313725, 0.345098, 0.266667, 0.279739, 0.294118, 0.301961, 0.243137,
    0.343791, 0.356863, 0.364706, 0.309804, 0.215686, 0.247059, 0.219608, 0.180392,
    0.249673, 0.278431, 0.262745, 0.207843, 0.294118, 0.32549, 0.317647, 0.239216,
    0.288889, 0.333333, 0.313725, 0.219608, 0.291503, 0.337255, 0.313725, 0.223529,
    0.270588, 0.305882, 0.294118, 0.211765, 0.270588, 0.298039, 0.294118, 0.219608,
    0.278431, 0.305882, 0.305882, 0.223529, 0.281046, 0.309804, 0.313725, 0.219608,
    0.270588, 0.313725, 0.294118, 0.203922, 0.201307, 0.294118, 0.164706, 0.145098,
    0.100654, 0.184314, 0.00392157, 0.113725, 0.330719, 0.482353, 0.333333, 0.176471,
    0.554248, 0.780392, 0.6, 0.282353, 0.500654, 0.713725, 0.537255, 0.25098,
    0.445752, 0.639216, 0.47451, 0.223529, 0.416993, 0.6, 0.443137, 0.207843,
    0.254902, 0.392157, 0.243137, 0.129412, 0.147712, 0.215686, 0.117647, 0.109804,
    0.133333, 0.168627, 0.0980392, 0.133333, 0.115033, 0.133333, 0.0862745, 0.12549,
    0.10719, 0.12549, 0.0627451, 0.133333, 0.226144, 0.258824, 0.239216, 0.180392,
    0.281046, 0.294118, 0.321569, 0.227451, 0.300654, 0.305882, 0.341176, 0.254902,
    0.291503, 0.290196, 0.333333, 0.25098, 0.299346, 0.282353, 0.341176, 0.27451,
    0.317647, 0.305882, 0.360784, 0.286275, 0.298039, 0.301961, 0.337255, 0.254902,
    0.305882, 0.305882, 0.337255, 0.27451, 0.305882, 0.317647, 0.333333, 0.266667,
    0.337255, 0.341176, 0.364706, 0.305882, 0.196078, 0.215686, 0.188235, 0.184314,
    0.231373, 0.266667, 0.247059, 0.180392, 0.236601, 0.266667, 0.25098, 0.192157,
    0.288889, 0.317647, 0.317647, 0.231373, 0.265359, 0.305882, 0.286275, 0.203922,
    0.244444, 0.286275, 0.262745, 0.184314, 0.265359, 0.294118, 0.290196, 0.211765,
    0.28366, 0.301961, 0.313725, 0.235294, 0.318954, 0.337255, 0.360784, 0.258824,
    0.330719, 0.376471, 0.364706, 0.25098, 0.192157, 0.282353, 0.156863, 0.137255,
    0.168627, 0.266667, 0.121569, 0.117647, 0.0300654, 0, 0, 0.0901961,
    0.4, 0.564706, 0.419608, 0.215686, 0.512418, 0.717647, 0.552941, 0.266667,
    0.351634, 0.517647, 0.360784, 0.176471, 0.244444, 0.376471, 0.227451, 0.129412,
    0.192157, 0.282353, 0.168627, 0.12549, 0.134641, 0.188235, 0.105882, 0.109804,
    0.122876, 0.160784, 0.0901961, 0.117647, 0.122876, 0.145098, 0.0980392, 0.12549,
    0.105882, 0.129412, 0.0627451, 0.12549, 0.213072, 0.231373, 0.227451, 0.180392,
    0.29281, 0.305882, 0.333333, 0.239216, 0.318954, 0.337255, 0.364706, 0.254902,
    0.294118, 0.298039, 0.337255, 0.247059, 0.294118, 0.286275, 0.333333, 0.262745,
    0.290196, 0.282353, 0.329412, 0.258824, 0.28366, 0.282353, 0.321569, 0.247059,
    0.330719, 0.321569, 0.368627, 0.301961, 0.317647, 0.321569, 0.345098, 0.286275,
    0.318954, 0.333333, 0.337255, 0.286275, 0.197386, 0.211765, 0.184314, 0.196078,
    0.219608, 0.243137, 0.239216, 0.176471, 0.213072, 0.231373, 0.227451, 0.180392,
    0.267974, 0.298039, 0.286275, 0.219608, 0.298039, 0.309804, 0.32549, 0.258824,
    0.290196, 0.294118, 0.321569, 0.254902, 0.31634, 0.32549, 0.352941, 0.270588,
    0.346405, 0.356863, 0.384314, 0.298039, 0.388235, 0.403922, 0.439216, 0.321569,
    0.385621, 0.411765, 0.435294, 0.309804, 0.214379, 0.27451, 0.2, 0.168627,
    0.139869, 0.227451, 0.0784314, 0.113725, 0.145098, 0.203922, 0.113725, 0.117647,
    0.0640523, 0.0862745, 0, 0.105882, 0.223529, 0.337255, 0.203922, 0.129412,
    0.224837, 0.329412, 0.203922, 0.141176, 0.188235, 0.270588, 0.164706, 0.129412,
    0.214379, 0.309804, 0.2, 0.133333, 0.211765, 0.313725, 0.2, 0.121569,
    0.130719, 0.192157, 0.101961, 0.0980392, 0.115033, 0.137255, 0.0901961, 0.117647,
    0.100654, 0.121569, 0.0627451, 0.117647, 0.173856, 0.176471, 0.180392, 0.164706,
    0.264052, 0.262745, 0.305882, 0.223529, 0.290196, 0.278431, 0.337255, 0.254902,
    0.277124, 0.282353, 0.317647, 0.231373, 0.264052, 0.27451, 0.294118, 0.223529,
    0.253595, 0.258824, 0.278431, 0.223529, 0.260131, 0.254902, 0.286275, 0.239216,
    0.301961, 0.301961, 0.337255, 0.266667, 0.333333, 0.329412, 0.368627, 0.301961,
    0.338562, 0.352941, 0.360784, 0.301961, 0.211765, 0.223529, 0.2, 0.211765,
    0.237908, 0.254902, 0.25098, 0.207843, 0.236601, 0.25098, 0.254902, 0.203922,
    0.284967, 0.305882, 0.309804, 0.239216, 0.330719, 0.345098, 0.364706, 0.282353,
    0.343791, 0.360784, 0.384314, 0.286275, 0.362092, 0.368627, 0.403922, 0.313725,
    0.392157, 0.396078, 0.435294, 0.345098, 0.396078, 0.407843, 0.443137, 0.337255,
    0.372549, 0.4, 0.419608, 0.298039, 0.248366, 0.294118, 0.254902, 0.196078,
    0.152941, 0.25098, 0.0862745, 0.121569, 0.169935, 0.243137, 0.145098, 0.121569,
    0.0836601, 0.117647, 0.0196078, 0.113725, 0.345098, 0.478431, 0.360784, 0.196078,
    0.427451, 0.596078, 0.462745, 0.223529, 0.30719, 0.458824, 0.317647, 0.145098,
    0.339869, 0.501961, 0.360784, 0.156863, 0.338562, 0.501961, 0.360784, 0.152941,
    0.166013, 0.278431, 0.137255, 0.0823529, 0.10719, 0.145098, 0.0745098, 0.101961,
    0.12549, 0.172549, 0.0941176, 0.109804, 0.133333, 0.152941, 0.121569, 0.12549,
    0.260131, 0.27451, 0.298039, 0.207843, 0.308497, 0.341176, 0.360784, 0.223529,
    0.326797, 0.345098, 0.376471, 0.258824, 0.342484, 0.356863, 0.392157, 0.278431,
    0.347712, 0.392157, 0.392157, 0.258824, 0.373856, 0.45098, 0.415686, 0.254902,
    0.335948, 0.4, 0.368627, 0.239216, 0.339869, 0.368627, 0.364706, 0.286275,
    0.364706, 0.423529, 0.384314, 0.286275, 0.254902, 0.27451, 0.258824, 0.231373,
    0.315033, 0.305882, 0.34902, 0.290196, 0.329412, 0.305882, 0.364706, 0.317647,
    0.354248, 0.34902, 0.396078, 0.317647, 0.343791, 0.427451, 0.380392, 0.223529,
    0.284967, 0.376471, 0.305882, 0.172549, 0.277124, 0.352941, 0.298039, 0.180392,
    0.277124, 0.32549, 0.290196, 0.215686, 0.286275, 0.341176, 0.309804, 0.207843,
    0.254902, 0.301961, 0.278431, 0.184314, 0.189542, 0.239216, 0.176471, 0.152941,
    0.147712, 0.215686, 0.0980392, 0.129412, 0.117647, 0.176471, 0.0588235, 0.117647,
    0.230065, 0.341176, 0.219608, 0.129412, 0.452288, 0.623529, 0.490196, 0.243137,
    0.528105, 0.72549, 0.580392, 0.278431, 0.486275, 0.67451, 0.537255, 0.247059,
    0.503268, 0.694118, 0.556863, 0.258824, 0.479739, 0.682353, 0.533333, 0.223529,
    0.278431, 0.439216, 0.282353, 0.113725, 0.154248, 0.243137, 0.109804, 0.109804,
    0.192157, 0.282353, 0.172549, 0.121569, 0.109804, 0.133333, 0.0745098, 0.121569,
    0.14902, 0.176471, 0.141176, 0.129412, 0.2, 0.235294, 0.223529, 0.141176,
    0.258824, 0.290196, 0.294118, 0.192157, 0.256209, 0.27451, 0.294118, 0.2,
    0.410458, 0.541176, 0.466667, 0.223529, 0.39085, 0.498039, 0.435294, 0.239216,
    0.36732, 0.45098, 0.411765, 0.239216, 0.332026, 0.380392, 0.345098, 0.270588,
    0.339869, 0.392157, 0.34902, 0.278431, 0.279739, 0.384314, 0.254902, 0.2,
    0.30719, 0.34902, 0.313725, 0.258824, 0.286275, 0.294118, 0.305882, 0.258824,
    0.320261, 0.415686, 0.337255, 0.207843, 0.296732, 0.427451, 0.313725, 0.14902,
    0.29281, 0.407843, 0.313725, 0.156863, 0.279739, 0.376471, 0.298039, 0.164706,
    0.166013, 0.227451, 0.14902, 0.121569, 0.183007, 0.239216, 0.176471, 0.133333,
    0.188235, 0.243137, 0.180392, 0.141176, 0.150327, 0.188235, 0.113725, 0.14902,
    0.129412, 0.203922, 0.0588235, 0.12549, 0.324183, 0.482353, 0.337255, 0.152941,
    0.543791, 0.745098, 0.6, 0.286275, 0.637908, 0.847059, 0.701961, 0.364706,
    0.613072, 0.831373, 0.682353, 0.32549, 0.610458, 0.819608, 0.678431, 0.333333,
    0.628758, 0.835294, 0.698039, 0.352941, 0.559477, 0.780392, 0.627451, 0.270588,
    0.339869, 0.521569, 0.356863, 0.141176, 0.210458, 0.345098, 0.176471, 0.109804,
    0.219608, 0.329412, 0.207843, 0.121569, 0.139869, 0.184314, 0.105882, 0.129412,
    0.150327, 0.192157, 0.121569, 0.137255, 0.223529, 0.27451, 0.235294, 0.160784,
    0.368627, 0.443137, 0.423529, 0.239216, 0.447059, 0.556863, 0.509804, 0.27451,
    0.423529, 0.54902, 0.47451, 0.247059, 0.368627, 0.458824, 0.415686, 0.231373,
    0.355556, 0.423529, 0.392157, 0.25098, 0.345098, 0.392157, 0.364706, 0.278431,
    0.342484, 0.396078, 0.352941, 0.278431, 0.299346, 0.423529, 0.282353, 0.192157,
    0.29281, 0.439216, 0.270588, 0.168627, 0.27451, 0.396078, 0.266667, 0.160784,
    0.337255, 0.482353, 0.352941, 0.176471, 0.338562, 0.47451, 0.360784, 0.180392,
    0.335948, 0.482353, 0.360784, 0.164706, 0.260131, 0.376471, 0.262745, 0.141176,
    0.231373, 0.313725, 0.235294, 0.145098, 0.224837, 0.309804, 0.223529, 0.141176,
    0.197386, 0.270588, 0.184314, 0.137255, 0.133333, 0.152941, 0.0980392, 0.14902,
    0.185621, 0.337255, 0.121569, 0.0980392, 0.538562, 0.752941, 0.592157, 0.270588,
    0.68366, 0.898039, 0.752941, 0.4, 0.688889, 0.909804, 0.760784, 0.396078,
    0.664052, 0.894118, 0.737255, 0.360784, 0.673203, 0.894118, 0.745098, 0.380392,
    0.664052, 0.882353, 0.733333, 0.376471, 0.566013, 0.792157, 0.635294, 0.270588,
    0.335948, 0.533333, 0.34902, 0.12549, 0.224837, 0.372549, 0.196078, 0.105882,
    0.168627, 0.239216, 0.14902, 0.117647, 0.113725, 0.168627, 0.0588235, 0.113725,
    0.171242, 0.258824, 0.133333, 0.121569, 0.132026, 0.180392, 0.0901961, 0.12549,
    0.288889, 0.384314, 0.321569, 0.160784, 0.426144, 0.541176, 0.486275, 0.25098,
    0.43268, 0.54902, 0.494118, 0.254902, 0.405229, 0.533333, 0.458824, 0.223529,
    0.411765, 0.517647, 0.458824, 0.258824, 0.389542, 0.470588, 0.419608, 0.278431,
    0.339869, 0.403922, 0.34902, 0.266667, 0.296732, 0.415686, 0.278431, 0.196078,
    0.291503, 0.411765, 0.282353, 0.180392, 0.266667, 0.384314, 0.254902, 0.160784,
    0.341176, 0.478431, 0.352941, 0.192157, 0.40915, 0.572549, 0.462745, 0.192157,
    0.384314, 0.545098, 0.431373, 0.176471, 0.284967, 0.415686, 0.305882, 0.133333,
    0.273203, 0.4, 0.282353, 0.137255, 0.224837, 0.333333, 0.207843, 0.133333,
    0.122876, 0.141176, 0.0901961, 0.137255, 0.188235, 0.290196, 0.145098, 0.129412,
    0.375163, 0.6, 0.388235, 0.137255, 0.633987, 0.862745, 0.705882, 0.333333,
    0.705882, 0.92549, 0.780392, 0.411765, 0.700654, 0.921569, 0.772549, 0.407843,
    0.678431, 0.901961, 0.74902, 0.384314, 0.691503, 0.913725, 0.764706, 0.396078,
    0.660131, 0.878431, 0.733333, 0.368627, 0.562092, 0.784314, 0.631373, 0.270588,
    0.309804, 0.517647, 0.317647, 0.0941176, 0.20915, 0.345098, 0.176471, 0.105882,
    0.218301, 0.321569, 0.211765, 0.121569, 0.298039, 0.443137, 0.309804, 0.141176,
    0.313725, 0.462745, 0.321569, 0.156863, 0.205229, 0.290196, 0.184314, 0.141176,
    0.155556, 0.203922, 0.129412, 0.133333, 0.279739, 0.384314, 0.290196, 0.164706,
    0.396078, 0.501961, 0.439216, 0.247059, 0.44183, 0.54902, 0.494118, 0.282353,
    0.47451, 0.584314, 0.52549, 0.313725, 0.467974, 0.596078, 0.513725, 0.294118,
    0.385621, 0.490196, 0.403922, 0.262745, 0.29281, 0.411765, 0.258824, 0.207843,
    0.308497, 0.45098, 0.298039, 0.176471, 0.287582, 0.419608, 0.282353, 0.160784,
    0.265359, 0.388235, 0.239216, 0.168627, 0.300654, 0.427451, 0.290196, 0.184314,
    0.362092, 0.517647, 0.388235, 0.180392, 0.356863, 0.533333, 0.392157, 0.145098,
    0.281046, 0.415686, 0.282353, 0.145098, 0.133333, 0.152941, 0.0901961, 0.156863,
    0.0849673, 0.0941176, 0.0196078, 0.141176, 0.330719, 0.501961, 0.337255, 0.152941,
    0.620915, 0.858824, 0.690196, 0.313725, 0.696732, 0.921569, 0.776471, 0.392157,
    0.690196, 0.909804, 0.764706, 0.396078, 0.709804, 0.921569, 0.776471, 0.431373,
    0.726797, 0.933333, 0.796078, 0.45098, 0.711111, 0.921569, 0.780392, 0.431373,
    0.687582, 0.905882, 0.760784, 0.396078, 0.556863, 0.788235, 0.627451, 0.254902,
    0.332026, 0.533333, 0.341176, 0.121569, 0.321569, 0.478431, 0.333333, 0.152941,
    0.403922, 0.588235, 0.443137, 0.180392, 0.39085, 0.564706, 0.419608, 0.188235,
    0.305882, 0.435294, 0.313725, 0.168627, 0.196078, 0.266667, 0.180392, 0.141176,
    0.124183, 0.133333, 0.0862745, 0.152941, 0.122876, 0.141176, 0.0745098, 0.152941,
    0.224837, 0.329412, 0.188235, 0.156863, 0.281046, 0.376471, 0.258824, 0.207843,
    0.342484, 0.415686, 0.352941, 0.258824, 0.461438, 0.572549, 0.509804, 0.301961,
    0.473203, 0.584314, 0.521569, 0.313725, 0.29281, 0.4, 0.254902, 0.223529,
    0.313725, 0.466667, 0.294118, 0.180392, 0.312418, 0.466667, 0.298039, 0.172549,
    0.347712, 0.517647, 0.345098, 0.180392, 0.342484, 0.494118, 0.341176, 0.192157,
    0.366013, 0.541176, 0.384314, 0.172549, 0.366013, 0.537255, 0.388235, 0.172549,
    0.206536, 0.266667, 0.184314, 0.168627, 0.132026, 0.14902, 0.0980392, 0.14902,
    0.139869, 0.188235, 0.0980392, 0.133333, 0.303268, 0.462745, 0.301961, 0.145098,
    0.592157, 0.811765, 0.658824, 0.305882, 0.681046, 0.901961, 0.760784, 0.380392,
    0.67451, 0.890196, 0.74902, 0.384314, 0.750327, 0.960784, 0.827451, 0.462745,
    0.772549, 0.964706, 0.847059, 0.505882, 0.75817, 0.952941, 0.827451, 0.494118,
    0.715033, 0.929412, 0.788235, 0.427451, 0.534641, 0.745098, 0.6, 0.258824,
    0.342484, 0.505882, 0.364706, 0.156863, 0.312418, 0.45098, 0.329412, 0.156863,
    0.243137, 0.341176, 0.243137, 0.145098, 0.118954, 0.156863, 0.0745098, 0.12549,
    0.0601307, 0.0470588, 0.00392157, 0.129412, 0.0941176, 0.0823529, 0.0588235, 0.141176,
    0.121569, 0.121569, 0.0901961, 0.152941, 0.139869, 0.133333, 0.113725, 0.172549,
    0.183007, 0.231373, 0.137255, 0.180392, 0.252288, 0.372549, 0.196078, 0.188235,
    0.261438, 0.372549, 0.211765, 0.2, 0.379085, 0.498039, 0.384314, 0.254902,
    0.430065, 0.541176, 0.447059, 0.301961, 0.245752, 0.317647, 0.2, 0.219608,
    0.321569, 0.517647, 0.278431, 0.168627, 0.375163, 0.580392, 0.360784, 0.184314,
    0.369935, 0.568627, 0.352941, 0.188235, 0.377778, 0.560784, 0.372549, 0.2,
    0.350327, 0.513725, 0.360784, 0.176471, 0.203922, 0.270588, 0.160784, 0.180392,
    0.130719, 0.121569, 0.0901961, 0.180392, 0.163399, 0.196078, 0.133333, 0.160784,
    0.223529, 0.305882, 0.211765, 0.152941, 0.28366, 0.4, 0.282353, 0.168627,
    0.287582, 0.435294, 0.278431, 0.14902, 0.377778, 0.556863, 0.396078, 0.180392,
    0.504575, 0.686275, 0.54902, 0.278431, 0.611765, 0.811765, 0.670588, 0.352941,
    0.647059, 0.839216, 0.705882, 0.396078, 0.65098, 0.85098, 0.713725, 0.388235,
    0.517647, 0.709804, 0.572549, 0.270588, 0.31634, 0.458824, 0.337255, 0.152941,
    0.197386, 0.270588, 0.188235, 0.133333, 0.0941176, 0.0980392, 0.0431373, 0.141176,
    0.130719, 0.141176, 0.105882, 0.145098, 0.181699, 0.215686, 0.168627, 0.160784,
    0.142484, 0.156863, 0.121569, 0.14902, 0.0849673, 0.0588235, 0.0588235, 0.137255,
    0.113725, 0.0941176, 0.0862745, 0.160784, 0.143791, 0.14902, 0.109804, 0.172549,
    0.155556, 0.145098, 0.12549, 0.196078, 0.275817, 0.396078, 0.219608, 0.211765,
    0.304575, 0.462745, 0.25098, 0.2, 0.29281, 0.419608, 0.227451, 0.231373,
    0.329412, 0.439216, 0.270588, 0.278431, 0.206536, 0.227451, 0.164706, 0.227451,
    0.27451, 0.435294, 0.219608, 0.168627, 0.351634, 0.560784, 0.313725, 0.180392,
    0.364706, 0.584314, 0.345098, 0.164706, 0.377778, 0.588235, 0.376471, 0.168627,
    0.342484, 0.501961, 0.337255, 0.188235, 0.168627, 0.184314, 0.129412, 0.192157,
    0.194771, 0.211765, 0.164706, 0.207843, 0.181699, 0.207843, 0.14902, 0.188235,
    0.247059, 0.333333, 0.243137, 0.164706, 0.240523, 0.329412, 0.239216, 0.152941,
    0.236601, 0.329412, 0.227451, 0.152941, 0.291503, 0.411765, 0.290196, 0.172549,
    0.315033, 0.45098, 0.317647, 0.176471, 0.29281, 0.45098, 0.286275, 0.141176,
    0.291503, 0.45098, 0.286275, 0.137255, 0.312418, 0.443137, 0.32549, 0.168627,
    0.256209, 0.352941, 0.262745, 0.152941, 0.173856, 0.227451, 0.160784, 0.133333,
    0.117647, 0.113725, 0.0980392, 0.141176, 0.155556, 0.176471, 0.137255, 0.152941,
    0.224837, 0.286275, 0.223529, 0.164706, 0.207843, 0.262745, 0.2, 0.160784,
    0.171242, 0.211765, 0.156863, 0.145098, 0.14902, 0.180392, 0.129412, 0.137255,
    0.134641, 0.145098, 0.105882, 0.152941, 0.145098, 0.152941, 0.109804, 0.172549,
    0.155556, 0.145098, 0.12549, 0.196078, 0.216993, 0.266667, 0.172549, 0.211765,
    0.265359, 0.388235, 0.211765, 0.196078, 0.304575, 0.435294, 0.25098, 0.227451,
    0.321569, 0.411765, 0.278431, 0.27451, 0.216993, 0.231373, 0.180392, 0.239216,
    0.193464, 0.27451, 0.121569, 0.184314, 0.288889, 0.47451, 0.215686, 0.176471,
    0.30719, 0.509804, 0.247059, 0.164706, 0.300654, 0.509804, 0.239216, 0.152941,
    0.269281, 0.423529, 0.215686, 0.168627, 0.173856, 0.176471, 0.145098, 0.2,
    0.16732, 0.176471, 0.133333, 0.192157, 0.180392, 0.211765, 0.152941, 0.176471,
    0.20915, 0.270588, 0.196078, 0.160784, 0.185621, 0.243137, 0.168627, 0.145098,
    0.202614, 0.258824, 0.188235, 0.160784, 0.273203, 0.360784, 0.282353, 0.176471,
    0.309804, 0.419608, 0.321569, 0.188235, 0.281046, 0.388235, 0.282353, 0.172549,
    0.267974, 0.356863, 0.270588, 0.176471, 0.253595, 0.329412, 0.262745, 0.168627,
    0.179085, 0.215686, 0.168627, 0.152941, 0.100654, 0.0901961, 0.0784314, 0.133333,
    0.129412, 0.141176, 0.109804, 0.137255, 0.172549, 0.219608, 0.160784, 0.137255,
    0.173856, 0.215686, 0.164706, 0.141176, 0.219608, 0.286275, 0.215686, 0.156863,
    0.269281, 0.380392, 0.27451, 0.152941, 0.220915, 0.321569, 0.207843, 0.133333,
    0.181699, 0.239216, 0.152941, 0.152941, 0.145098, 0.145098, 0.117647, 0.172549,
    0.147712, 0.152941, 0.117647, 0.172549, 0.188235, 0.215686, 0.14902, 0.2,
    0.304575, 0.45098, 0.262745, 0.2, 0.296732, 0.407843, 0.25098, 0.231373,
    0.291503, 0.341176, 0.25098, 0.282353, 0.224837, 0.254902, 0.188235, 0.231373,
    0.30719, 0.411765, 0.290196, 0.219608, 0.396078, 0.564706, 0.396078, 0.227451,
    0.397386, 0.556863, 0.4, 0.235294, 0.389542, 0.564706, 0.392157, 0.211765,
    0.262745, 0.34902, 0.235294, 0.203922, 0.168627, 0.168627, 0.137255, 0.2,
    0.160784, 0.168627, 0.129412, 0.184314, 0.169935, 0.188235, 0.141176, 0.180392,
    0.184314, 0.219608, 0.160784, 0.172549, 0.180392, 0.223529, 0.160784, 0.156863,
    0.184314, 0.227451, 0.164706, 0.160784, 0.207843, 0.266667, 0.196078, 0.160784,
    0.218301, 0.286275, 0.207843, 0.160784, 0.222222, 0.298039, 0.211765, 0.156863,
    0.252288, 0.329412, 0.254902, 0.172549, 0.202614, 0.247059, 0.192157, 0.168627,
    0.129412, 0.141176, 0.105882, 0.141176, 0.122876, 0.129412, 0.0980392, 0.141176,
    0.143791, 0.164706, 0.12549, 0.141176, 0.12549, 0.141176, 0.105882, 0.129412,
    0.155556, 0.196078, 0.141176, 0.129412, 0.249673, 0.356863, 0.243137, 0.14902,
    0.266667, 0.388235, 0.262745, 0.14902, 0.196078, 0.278431, 0.172549, 0.137255,
    0.122876, 0.129412, 0.0901961, 0.14902, 0.120261, 0.101961, 0.0901961, 0.168627,
    0.175163, 0.196078, 0.145098, 0.184314, 0.176471, 0.172549, 0.145098, 0.211765,
    0.254902, 0.329412, 0.211765, 0.223529, 0.291503, 0.376471, 0.25098, 0.247059,
    0.28366, 0.313725, 0.247059, 0.290196, 0.304575, 0.392157, 0.278431, 0.243137,
    0.372549, 0.513725, 0.376471, 0.227451, 0.407843, 0.556863, 0.423529, 0.243137,
    0.427451, 0.596078, 0.45098, 0.235294, 0.392157, 0.552941, 0.403922, 0.219608,
    0.203922, 0.239216, 0.176471, 0.196078, 0.188235, 0.2, 0.156863, 0.207843,
    0.186928, 0.203922, 0.152941, 0.203922, 0.183007, 0.192157, 0.152941, 0.203922,
    0.173856, 0.2, 0.145098, 0.176471, 0.172549, 0.211765, 0.14902, 0.156863,
    0.16732, 0.2, 0.141176, 0.160784, 0.193464, 0.239216, 0.176471, 0.164706,
    0.183007, 0.227451, 0.160784, 0.160784, 0.228758, 0.301961, 0.223529, 0.160784,
    0.215686, 0.278431, 0.207843, 0.160784, 0.171242, 0.203922, 0.152941, 0.156863,
    0.120261, 0.129412, 0.0901961, 0.141176, 0.122876, 0.129412, 0.0980392, 0.141176,
    0.122876, 0.12549, 0.0980392, 0.145098, 0.14902, 0.156863, 0.133333, 0.156863,
    0.205229, 0.27451, 0.192157, 0.14902, 0.23268, 0.333333, 0.219608, 0.145098,
    0.186928, 0.258824, 0.164706, 0.137255, 0.0836601, 0.0784314, 0.0392157, 0.133333,
    0.113725, 0.113725, 0.0784314, 0.14902, 0.126797, 0.105882, 0.0980392, 0.176471,
    0.186928, 0.211765, 0.156863, 0.192157, 0.201307, 0.219608, 0.168627, 0.215686,
    0.256209, 0.313725, 0.227451, 0.227451, 0.337255, 0.466667, 0.321569, 0.223529,
    0.328105, 0.419608, 0.301961, 0.262745, 0.295425, 0.34902, 0.270588, 0.266667,
    0.256209, 0.333333, 0.231373, 0.203922, 0.29281, 0.376471, 0.282353, 0.219608,
    0.288889, 0.380392, 0.278431, 0.207843, 0.20915, 0.258824, 0.172549, 0.196078,
    0.164706, 0.168627, 0.129412, 0.196078, 0.214379, 0.254902, 0.188235, 0.2,
    0.205229, 0.25098, 0.172549, 0.192157, 0.172549, 0.184314, 0.141176, 0.192157,
    0.163399, 0.180392, 0.133333, 0.176471, 0.159477, 0.184314, 0.133333, 0.160784,
    0.162092, 0.188235, 0.133333, 0.164706, 0.172549, 0.203922, 0.14902, 0.164706,
    0.193464, 0.239216, 0.176471, 0.164706, 0.20915, 0.270588, 0.196078, 0.160784,
    0.194771, 0.243137, 0.180392, 0.160784, 0.159477, 0.180392, 0.137255, 0.160784,
    0.117647, 0.117647, 0.0862745, 0.14902, 0.113725, 0.117647, 0.0901961, 0.133333,
    0.111111, 0.0980392, 0.0862745, 0.14902, 0.147712, 0.160784, 0.133333, 0.14902,
    0.173856, 0.231373, 0.156863, 0.133333, 0.133333, 0.160784, 0.0980392, 0.141176,
    0.0954248, 0.0941176, 0.0588235, 0.133333, 0.118954, 0.14902, 0.0784314, 0.129412,
    0.118954, 0.137255, 0.0784314, 0.141176, 0.130719, 0.113725, 0.0980392, 0.180392,
    0.164706, 0.160784, 0.137255, 0.196078, 0.179085, 0.184314, 0.14902, 0.203922,
    0.196078, 0.196078, 0.164706, 0.227451, 0.239216, 0.278431, 0.203922, 0.235294,
    0.277124, 0.329412, 0.247059, 0.254902, 0.279739, 0.32549, 0.254902, 0.258824,
    0.253595, 0.317647, 0.235294, 0.207843, 0.260131, 0.32549, 0.247059, 0.207843,
    0.205229, 0.239216, 0.176471, 0.2, 0.193464, 0.211765, 0.164706, 0.203922,
    0.205229, 0.227451, 0.176471, 0.211765, 0.228758, 0.290196, 0.203922, 0.192157,
    0.231373, 0.301961, 0.207843, 0.184314, 0.176471, 0.215686, 0.145098, 0.168627,
    0.142484, 0.164706, 0.109804, 0.152941, 0.129412, 0.137255, 0.0980392, 0.152941,
    0.154248, 0.172549, 0.12549, 0.164706, 0.156863, 0.180392, 0.129412, 0.160784,
    0.192157, 0.239216, 0.172549, 0.164706, 0.205229, 0.266667, 0.192157, 0.156863,
    0.163399, 0.196078, 0.141176, 0.152941, 0.129412, 0.129412, 0.0980392, 0.160784,
    0.128105, 0.137255, 0.0980392, 0.14902, 0.111111, 0.105882, 0.0862745, 0.141176,
    0.100654, 0.0823529, 0.0784314, 0.141176, 0.133333, 0.145098, 0.117647, 0.137255,
    0.117647, 0.133333, 0.0901961, 0.129412, 0.0915033, 0.0745098, 0.0588235, 0.141176,
    0.118954, 0.141176, 0.0823529, 0.133333, 0.115033, 0.141176, 0.0745098, 0.129412,
    0.105882, 0.121569, 0.0627451, 0.133333, 0.124183, 0.113725, 0.0901961, 0.168627,
    0.160784, 0.160784, 0.133333, 0.188235, 0.172549, 0.172549, 0.145098, 0.2,
    0.185621, 0.176471, 0.152941, 0.227451, 0.219608, 0.247059, 0.180392, 0.231373,
    0.277124, 0.337255, 0.243137, 0.25098,];

