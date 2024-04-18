function int(a) {
    return a < 0 ? Math.ceil(a) : Math.floor(a);
}

function jdn(Y, M, D) {
    return int((1461 * (Y + 4800 + int((M - 14) / 12))) / 4) + int((367 * (M - 2 - 12 * int((M - 14) / 12))) / 12) - int((3 * int(((Y + 4900 + int((M - 14) / 12)) / 100)) / 4)) + D - 32075;
}

var earth_color = "#3A69C4";
var sun_color = "#FFD535";

var outline_image = new Image();
outline_image.src = "/images/earth_sun/outline.svg";


var analemma_data = [
    [1.0572914076712547, 22.7360591557582],
    [1.4680592568018003, 22.262969840101245],
    [1.8512380814694216, 21.673986595897134],
    [2.2011842311615357, 20.973226642840245],
    [2.512890522917738, 20.16554977902337],
    [2.7820792632958073, 19.256486189156327],
    [3.005280795582762, 18.25215405659741],
    [3.1798955558347757, 17.159168956607225],
    [3.304237959541483, 15.984547602277086],
    [3.3775608919439217, 14.73560903279218],
    [3.400060121069467, 13.419876696751007],
    [3.3728585606591803, 12.044985025355116],
    [3.2979709386517477, 10.618593970389135],
    [3.1782500295988663, 9.148314590930081],
    [3.0173161428292055, 7.641648135188533],
    [2.8194719886958777, 6.105940233665773],
    [2.589605351573314, 4.548350871537038],
    [2.333082174496864, 2.9758398260301426],
    [2.0556327154546263, 1.3951663207949734],
    [1.763233389291213, -0.18709916507796967],
    [1.4619867882746977, -1.7645536369737795],
    [1.1580022091561493, -3.3309340116437065],
    [0.8572788289934492, -4.880086582361991],
    [0.5655934880747503, -6.405936868225142],
    [0.2883948672235107, -7.902462985269442],
    [0.03070569057565942, -9.363675292045187],
    [-0.20296555848395845, -10.783604533807948],
    [-0.4087020636201527, -12.156300076424252],
    [-0.5832440522437033, -13.475839126047099],
    [-0.7240411069906116, -14.736347118586648],
    [-0.8292906035961957, -15.932028779036548],
    [-0.8979617082265343, -17.05720873731158],
    [-0.9298046412441608, -18.10638008096932],
    [-0.9253452102666704, -19.074258853233797],
    [-0.8858649203667003, -19.955842282109593],
    [-0.8133672666094939, -20.746468454199594],
    [-0.7105310870426981, -21.44187521239704],
    [-0.5806520891636959, -22.038256235404035],
    [-0.4275738489310852, -22.532312516338767],
    [-0.2556097167187815, -22.9212977614171],
    [-0.06945714887656136, -23.203056543445083],
    [0.12589397326272264, -23.376054340499767],
    [0.32525746515517384, -23.43939884920726],
    [0.5233498373068839, -23.392852177223684],
    [0.714890622178044, -23.236833694762367],
    [0.8947024962762787, -22.97241347335221],
    [1.0578096719821748, -22.601296380421534],
    [1.1995330369777601, -22.12579705154119],
    [1.3155805199632862, -21.54880614639471],
    [1.4021311730849133, -20.873748521369535],
    [1.4559114904420618, -20.104534223054323],
    [1.4742625452163958, -19.245503513700974],
    [1.455196630699519, -18.3013674616569],
    [1.397442241668388, -17.277145937711932],
    [1.3004764308512737, -16.17810511771365],
    [1.1645438158223866, -15.009696767413844],
    [0.9906617828138194, -13.77750164647933],
    [0.7806117207339996, -12.487179292760787],
    [0.5369164041317321, -11.144426225236655],
    [0.26280390880853965, -9.75494423779103],
    [-0.037841319955591916, -8.324419962319041],
    [-0.36053943481758094, -6.85851628549737],
    [-0.7002872238805922, -5.362875543376922],
    [-1.0516401384586573, -3.84313373020168],
    [-1.4088031422804232, -2.304944282111997],
    [-1.765729133622774, -0.7540093708690319],
    [-2.116223611611512, 0.8038838967482279],
    [-2.454054154070756, 2.3628253988481998],
    [-2.7730631452316867, 3.9167453349099306],
    [-3.0672820308421365, 5.459382374569331],
    [-3.3310451920635153, 6.9842599191427475],
    [-3.5591013358198724, 8.48467347584907],
    [-3.7467201192340984, 9.953691639476984],
    [-3.8897915891821353, 11.384172482653163],
    [-3.9849159561692162, 12.768796308893979],
    [-4.029481262405117, 14.100114776450438],
    [-4.021726663749604, 15.370615426356837],
    [-3.960789338966599, 16.572799726073168],
    [-3.8467334498340264, 17.699271951886175],
    [-3.680560090564199, 18.742835649493767],
    [-3.464197742205439, 19.696594081273453],
    [-3.200473347831427, 20.554051009179215],
    [-2.8930647023096103, 21.30920835903336],
    [-2.546435365685218, 21.95665771923882],
    [-2.0659278847625675, 22.6073601890519],
    [-1.6508682417105016, 22.99629144442897],
    [-1.215452244431006, 23.264936961504596],
    [-0.7664269621860137, 23.411183030869104],
    [-0.31077201624974476, 23.43381035250753],
    [0.1444293219852438, 23.332512310257144],
    [0.5921210124265244, 23.107900034715733],

];

function eccentric_anomaly(e, M) {
    function f(E) {
        return E - e * Math.sin(E) - M;
    }

    function fp(E) {
        return 1 - e * Math.cos(E);
    }

    var E = M;
    var oldE;
    for (var i = 0; i < 20; i++) {
        oldE = E;
        E = E - f(E) / fp(E);
        if (Math.abs(oldE - E) < 0.00000001)
            break;
    }

    return E;
}

function true_anomaly(e, E) {
    return 2 * Math.atan(Math.sqrt((1 + e) / (1 - e)) * Math.tan(E / 2));
}



function GLDrawer(scale, ready_callback) {

    var canvas = document.createElement("canvas");
    var gl = canvas.getContext('experimental-webgl');

    var asset_names = ["land", "clouds", "lights"];
    var mip_levels = 2;

    var assets = [];
    var textures = [];
    var loaded_assets_count = 0;

    var vert_scale = 1.1;
    var vertices = [-vert_scale, +vert_scale, -vert_scale, -vert_scale, +vert_scale, -vert_scale, +vert_scale, +vert_scale, ];

    indices = [3, 2, 1, 3, 1, 0];

    for (var j = 0; j < asset_names.length; j++) {
        textures[j] = gl.createTexture();

        gl.bindTexture(gl.TEXTURE_2D, textures[j]);

        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

        var pixel = new Uint8Array([2, 5, 20, 255]);

        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA,
            1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
            pixel);
    }

    function asset_loaded() {
        loaded_assets_count++;

        if (loaded_assets_count == mip_levels * asset_names.length) {
            for (var j = 0; j < asset_names.length; j++) {
                gl.bindTexture(gl.TEXTURE_2D, textures[j]);
                for (var i = 0; i < mip_levels; i++) {
                    gl.texImage2D(gl.TEXTURE_2D, i, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, assets[j][i]);
                }
            }

            ready_callback();
        }
    }

    for (var j = 0; j < asset_names.length; j++) {
        assets[j] = [];

        var name = asset_names[j];

        for (var i = 0; i < mip_levels; i++) {
            var image = new Image();
            assets[j].push(image);
            image.onload = asset_loaded;
            image.src = "/images/earth_sun/" + name + i + ".jpg";
        }
    }

    var vertex_buffer = gl.createBuffer();

    gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    var index_buffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, index_buffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);


    var earth_vert_src =
        `
    attribute vec2 coordinates;
    uniform mat2 ctm;
    uniform vec2 tr;
    varying highp vec2 unit;
    void main(void) {
        unit = coordinates;
        gl_Position = vec4(coordinates * ctm + tr, 0.0, 1.0);
    }
    `;

    var earth_frag_src =
        `
        precision highp float;
        varying highp vec2 unit;
        
        uniform sampler2D ground_tex;
        uniform sampler2D clouds_tex;
        uniform sampler2D lights_tex;

        uniform mat3 rot;
        uniform vec3 sun_dir;
        uniform float aa;
        uniform float sun_scale;
        uniform float point_scale;

        void main(void) {
            vec2 u = unit;

            float d_sq = u.x*u.x + u.y*u.y;
            float d = sqrt(d_sq);

            vec3 xyz = vec3(u.x, u.y, sqrt(max(0.0, 1.0 - d_sq)));
            vec3 ss_xyz = xyz;

            xyz *= rot;

            vec2 ll = vec2(atan(xyz.z, xyz.x), asin(xyz.y));

            vec2 coord = vec2(1.0 - (ll.x * 0.5 /3.1415926536 + 0.5), 1.0 - (ll.y  / 3.1415926536 + 0.5));

            float sun_dot = sqrt(max(0.0, dot(ss_xyz, sun_dir)));
            float mul = mix(1.0, sun_dot, sun_scale);

            mediump vec4 color = texture2D(ground_tex, coord);
            mediump float clouds_a = texture2D(clouds_tex, coord).r * 0.9;
            mediump float lights_a = texture2D(lights_tex, coord).r;

            lights_a *= (1.0 - mul) * (1.0 - mul) * 0.7;

            color.rgb *= mul;
            color.rgb *= 1.0 - lights_a;
            color.rgb += vec3(lights_a, lights_a*0.95, lights_a*0.8);

            color.rgb *= 1.0 - clouds_a;
            color.rgb += vec3(clouds_a * mul);


            mediump float rim_a = (1.0 - ss_xyz.z);
            rim_a = rim_a * rim_a;
            rim_a = rim_a * rim_a;
            rim_a = rim_a * rim_a;
            rim_a *= smoothstep(0.0, 0.4, sun_dot);
            color.rgb *= 1.0 - rim_a;
            color.rgb += vec3(0.5, 0.6, 0.8) * rim_a;

            mediump float dot_a = point_scale * smoothstep (0.99991, 0.99995, dot(ss_xyz, sun_dir));
            
            color.rgb *= 1.0 - dot_a;
            color.rgb += dot_a * vec3(1.0, 0.15, 0.15);
  
            gl_FragColor = color * (1.0 - smoothstep (1.0 - aa, 1.0 + aa, d));
        }
        `;

    var earth_shader = new Shader(gl,
        earth_vert_src,
        earth_frag_src, ["coordinates"], ["ctm", "tr", "rot", "sun_dir", "sun_scale", "point_scale", "aa", "ground_tex", "clouds_tex", "lights_tex"]);


    var outline_vert_src =
        `
    attribute vec2 coordinates;
    uniform mat2 ctm;
    uniform vec2 tr;
    varying vec2 unit;
    void main(void) {
        unit = coordinates * vec2(3.14159265359, 3.14159265359 * 0.5);
        gl_Position = vec4(coordinates * ctm + tr, 0.0, 1.0);
    }
    `;

    var outline_frag_src =
        `
        precision highp float;
        varying highp vec2 unit;
        
        uniform vec3 sun_dir;

        void main(void) {
            vec2 u = unit;

            vec3 xyz = vec3 (sin(u.x)*cos(u.y), sin(u.y), cos(u.x)*cos(u.y));

            float mul = mix(1.0, sqrt(max(0.0, dot(xyz, sun_dir))), 0.75);
            float dot_a = 0.8 * smoothstep (0.9996, 0.99995, dot(xyz, sun_dir));

            mediump vec4 color = vec4(0, 0, 0,1.0 - mul);
            
            color *= 1.0 - dot_a;
            color += dot_a * vec4(1.0, 0.15, 0.15, 1.0);

            gl_FragColor = color;
        }
        `;

    var outline_shader = new Shader(gl,
        outline_vert_src,
        outline_frag_src, ["coordinates"], ["ctm", "tr", "sun_dir", ]);



    var ndc_sx, ndc_sy;

    this.begin = function(width, height) {
        canvas.width = width * scale;
        canvas.height = height * scale;

        ndc_sx = 2 / width;
        ndc_sy = 2 / height;

        gl.clearColor(0.0, 0.0, 0.0, 0.0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.viewport(0, 0, canvas.width, canvas.height);
    }

    this.draw_earth = function(center, radius, rotation, sun_dir, sun_scale, point_scale) {
        gl.useProgram(earth_shader.shader);

        gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, index_buffer);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, textures[0]);

        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, textures[1]);

        gl.activeTexture(gl.TEXTURE2);
        gl.bindTexture(gl.TEXTURE_2D, textures[2]);

        var ctm = [radius * ndc_sx, 0, 0, radius * ndc_sy];
        var tr = [center[0] * ndc_sx - 1, center[1] * ndc_sy - 1];
        var aa = 1 / (vert_scale * radius * scale);

        var rot = mat3_mul([0, 0, 1, 0, 1, 0, -1, 0, 0], rotation);

        if (sun_scale === undefined)
            sun_scale = 0;

        if (sun_dir === undefined)
            sun_dir = [1, 0, 0];

        if (point_scale === undefined)
            point_scale = 0;

        gl.uniformMatrix2fv(earth_shader.uniforms["ctm"], false, ctm);
        gl.uniform2fv(earth_shader.uniforms["tr"], tr);
        gl.uniformMatrix3fv(earth_shader.uniforms["rot"], false, rot);
        gl.uniform3fv(earth_shader.uniforms["sun_dir"], sun_dir);
        gl.uniform1f(earth_shader.uniforms["sun_scale"], sun_scale);
        gl.uniform1f(earth_shader.uniforms["point_scale"], point_scale);
        gl.uniform1f(earth_shader.uniforms["aa"], aa);

        gl.uniform1i(earth_shader.uniforms["ground_tex"], 0);
        gl.uniform1i(earth_shader.uniforms["clouds_tex"], 1);
        gl.uniform1i(earth_shader.uniforms["lights_tex"], 2);

        gl.enableVertexAttribArray(earth_shader.attributes["coordinates"]);
        gl.vertexAttribPointer(earth_shader.attributes["coordinates"], 2, gl.FLOAT, false, 0, 0);

        gl.enable(gl.BLEND);
        gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

        gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);
    }

    this.draw_outline = function(size, sun_dir) {
        gl.useProgram(outline_shader.shader);

        gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, index_buffer);

        var ctm = [size[0] * ndc_sx / 2, 0, 0, size[1] * ndc_sy / 2];

        gl.uniformMatrix2fv(outline_shader.uniforms["ctm"], false, ctm);
        gl.uniform3fv(outline_shader.uniforms["sun_dir"], sun_dir);

        gl.vertexAttribPointer(outline_shader.attributes["coordinates"], 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(outline_shader.attributes["coordinates"]);

        gl.enable(gl.BLEND);
        gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

        gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);
    }

    this.finish = function() {
        return gl.canvas;
    }
}

function SpaceDrawer(gl, scale, container, mode) {

    var wrapper = document.createElement("div");
    wrapper.classList.add("canvas_container");

    var canvas;

    var year = 2019,
        month = 01,
        day = 01,
        hour = 12,
        minute = 00;
    var L_p, R_p, fake_L_p, fake_R_p;
    var e = 0.0167086;
    var fake_e = 0.4;

    var omega_p = 0;


    var date_string;
    var time_string;

    // relative to perihelium
    var earth_angle_at_start = -Math.PI / 2 - 0.039605960630149865 - 12.05 / 23.9344696 * Math.PI * 2;
    var earth_rot = 0;
    var progress = 0.5;

    // calculated from var year = 2019, month = 09, day = 23, hour = 07, minute = 50;
    var precession_angle = -0.22769915391360662;

    this.set_date = function(y, m, d) {
        year = y;
        month = m;
        day = d;

        this.recalc();
        this.repaint();
    }

    this.set_time = function(hh, mm) {
        hour = hh;
        minute = mm;

        this.recalc();
        this.repaint();
    }

    this.set_progress = function(x) {
        progress = x;
        this.repaint();
    }

    this.recalc = function() {

        var mi = minute;
        var h = hour;
        var d = day;
        var m = month;
        var y = year;

        var l = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

        if (h == 24) {
            h = 0;
            d++
        }

        if (l[m - 1] < d) {
            d -= l[m - 1];
            m++;
        }

        if (m == 13) {
            m = 1;
            y++;
        }


        var de = jdn(y, m, d);
        de += (h - 12) / 24 + mi / 1440;

        // solar azimuth at perihelion

        earth_rot = (de - (jdn(2019, 1, 3) + -7 / 24 + 19 / 1440)) * Math.PI * 2 * 24 / 23.9344696 +
            (-101 + 18 / 60 + 40 / 3600) * Math.PI / 180; // latitude of 180 azimuth
        de -= 2451545;

        var M = 6.24004077 + 0.01720197 * de;
        var dt = -7.659 * Math.sin(M) + 9.863 * Math.sin(2 * M + 3.5932);

        // earth_rot += dt * 2 * Math.PI /(24*60);

        omega_p = 102.937683 * Math.PI / 180; // - Math.PI * 2 * de/(25772 * 365.2425);

        var Tp = 1.000017;
        var eps_p = 100.464572 * Math.PI / 180;
        var mean_anomaly = Math.PI * 2 * de / (365.242191 * Tp) + eps_p - omega_p;

        var E_p = eccentric_anomaly(e, mean_anomaly);
        var ni_p = true_anomaly(e, E_p);
        L_p = ni_p;
        R_p = (1 - e * e) / (1 + e * Math.cos(ni_p));

        earth_rot -= ni_p;

        var fake_E_p = eccentric_anomaly(fake_e, mean_anomaly);
        var fake_ni_p = true_anomaly(fake_e, fake_E_p);
        fake_L_p = fake_ni_p;
        fake_R_p = (1 - fake_e * fake_e) / (1 + fake_e * Math.cos(fake_ni_p));

        function pad(num) {
            return (num.toString().length) == 1 ? "0" + num : num.toString();
        }

        date_string = !metric ? pad(m) + "/" + pad(d) + "/" + y :
            pad(d) + "/" + pad(m) + "/" + y;


        time_string = !metric ? pad((h + 11) % 12 + 1) + ":" + pad(mi) + " " + (h < 12 || hour == 24 ? "AM" : "PM") :
            pad(h) + ":" + pad(mi);

        time_string += " UTC"


    }

    this.recalc();
    var mvp = [1, 0, 0, 0, 1, 0, 0, 0, 1];
    var arcball;

    canvas = document.createElement("canvas");
    canvas.style.position = "absolute";
    canvas.style.top = "0";
    canvas.style.left = "0";

    wrapper.appendChild(canvas);


    container.appendChild(wrapper);

    if (mode == "earth_sunlight" || mode == "earth_sunlight2") {
        arcball = new ArcBall(mvp, function() {
            mvp = arcball.matrix.slice();
            self.repaint();
        });
    }



    arg = 0;
    this.set_arg = function(x) { arg = x;
        paint(); }


    var width, height;

    var max_tilt = 300;
    var drag_y = max_tilt * 0.6;


    if (mode == "plane") {
        new Dragger(canvas, function(x, y) {
            drag_y = Math.max(0, Math.min(max_tilt, drag_y - y));
            self.repaint();
        })
    }



    function canvas_space(e) {
        var r = canvas.getBoundingClientRect();
        return [width - (e.clientX - r.left), (e.clientY - r.top)];
    }


    if (arcball) {
        new TouchHandler(canvas,

            function(e) {

                var p = canvas_space(e);
                arcball.start(p[0], p[1]);

                return true;
            },
            function(e) {
                var p = canvas_space(e);
                arcball.update(p[0], p[1], e.timeStamp);
                mvp = arcball.matrix.slice();

                self.repaint();

                return true;
            },
            function(e) {
                arcball.end(e.timeStamp);
            });
    }


    var ecliptic_angle = 23.4392811 * Math.PI / 180;
    var sin = Math.sin(ecliptic_angle);
    var cos = Math.cos(ecliptic_angle);

    var top_down = mat3_mul([1, 0, 0, 0, 0, 1, 0, -1, 0], [cos, 0, -sin, 0, 1, 0, sin, 0, cos]);
    var psin = Math.sin(precession_angle);
    var pcos = Math.cos(precession_angle);

    top_down = mat3_mul(top_down, [pcos, psin, 0, -psin, pcos, 0, 0, 0, 1]);

    this.repaint = function() {




        var ctx = canvas.getContext("2d");

        ctx.resetTransform();
        ctx.fillStyle = "rgba(0,0,0,0)";
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.scale(scale, scale);




        if (mode == "sun_size") {
            ctx.translate(width / 2, height / 2);

            var size = Math.max(0, Math.min(width, height) - 30);

            var sun_size = size;

            ctx.fillStyle = sun_color;

            ctx.beginPath();
            ctx.ellipse(0, 0, sun_size / 2, sun_size / 2, 0, 0, Math.PI * 2);
            ctx.closePath();
            ctx.fill();

            ctx.fillStyle = earth_color;

            var ratio = 0.5 * 6371 / 695700;
            ctx.beginPath();
            ctx.ellipse(size / 2 + 10, 0, size * ratio, size * ratio, 0, 0, Math.PI * 2);
            ctx.closePath();
            ctx.fill();

        } else if (mode == "fake_orbit") {
            fake_orbit();
        } else if (mode == "orbit") {
            orbit();
        } else if (mode == "earth_rotation") {
            var size = Math.max(0, Math.min(width - 30, height - 80));

            var sidereal_day = 23.9344696;
            var angle = 2 * Math.PI * (hour + minute / 60) / sidereal_day + Math.PI;
            var sun_dir = [0, 0, 1];

            ctx.translate(width / 2, height / 2 - 10);

            gl.begin(size, size);
            gl.draw_earth([size / 2, size / 2], size / 2, mat3_mul(rot_y_mat3(-angle), rot_z_mat3(ecliptic_angle)), sun_dir);

            ctx.drawImage(gl.finish(), -size / 2, -size / 2, size, size);

            ctx.strokeStyle = "#666";
            ctx.lineWidth = 1;

            ctx.beginPath();
            ctx.moveTo(0, -size / 2 - 3);
            ctx.lineTo(0, -size / 2 - 13);
            ctx.stroke();


            ctx.beginPath();
            ctx.arc(0, 0, size / 2 + 8, 0 - Math.PI / 2, ecliptic_angle - Math.PI / 2);
            ctx.stroke();


            ctx.font = "20px IBM Plex Sans";
            ctx.textAlign = "left";

            ctx.fillStyle = "#5A617A";
            ctx.fillText(time_string, -20, height / 2 + 5);

            ctx.textAlign = "right";
            ctx.fillStyle = "#907567";
            ctx.fillText("Day " + (hour == 24 ? "2" : "1"), -35, height / 2 + 6);

            ctx.lineWidth = 2.0;
            ctx.strokeStyle = "#333";
            ctx.lineCap = "butt";

            ctx.beginPath();
            ctx.moveTo(-size / 2 - 1, 0);
            ctx.lineTo(-size / 2 - 50, 0);
            ctx.stroke();


            ctx.beginPath();
            ctx.moveTo(+size / 2 + 1, 0);
            ctx.lineTo(+size / 2 + 50, 0);
            ctx.stroke();

            ctx.rotate(ecliptic_angle);

            ctx.lineWidth = 2.0;
            ctx.strokeStyle = "5A617A";
            ctx.lineCap = "round";

            ctx.beginPath();
            ctx.moveTo(0, -size / 2 - 3);
            ctx.lineTo(0, -size / 2 - 18);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(0, size / 2 + 3);
            ctx.lineTo(0, size / 2 + 18);
            ctx.stroke();

            ctx.rotate(-ecliptic_angle / 2);

            ctx.font = "17px IBM Plex Sans";
            ctx.textAlign = "center";

            ctx.fillStyle = "#666";
            ctx.fillText("   23.437°", 0, -size / 2 - 15);




        } else if (mode == "earth_rotation_solar_day") {
            earth_rotation_solar_day();
        } else if (mode == "earth_orbit_axis") {
            earth_orbit_axis();
        } else if (mode == "earth_orbit_axis_side") {
            earth_orbit_axis_side();
        } else if (mode == "sun_peri_ap_size") {
            sun_peri_ap_size();
        } else if (mode == "earth_sunlight") {
            earth_sunlight();
        } else if (mode == "earth_sunlight2") {
            earth_sunlight(true);
        } else if (mode == "earth_sunlight_sun") {
            earth_sunlight_sun();
        } else if (mode == "tropical_year") {
            tropical_year();
        } else if (mode == "kepler") {
            kepler();
        } else if (mode == "ellipse_length") {
            ellipse_length();
        } else if (mode == "ellipse_e") {
            ellipse_e();
        } else if (mode == "plane") {
            plane();
        } else if (mode == "precession") {
            precession();
        } else if (mode == "outline") {
            outline();
        } else if (mode == "cosine") {
            cosine();
        } else if (mode == "analemma") {
            analemma();
        } else if (mode == "solar_noon") {
            solar_noon();
        }




        function draw_wire(pos, size, mvp, line_scale) {

            ctx.fillStyle = earth_color;
            ctx.beginPath();
            ctx.ellipse(pos[0], pos[1], size / 2, size / 2, 0, 0, Math.PI * 2);
            ctx.closePath();
            ctx.fill();

            if (line_scale == undefined)
                line_scale = 1.0;


            ctx.lineWidth = line_scale;
            ctx.strokeStyle = "rgba(0, 0, 0, 0.2)";
            ctx.lineCap = "butt";

            for (var i = 0; i < 8; i++) {
                var mat = mat3_mul(mvp, rot_y_mat3(i * Math.PI / 8));
                var start = true;

                // ctx.strokeStyle = "rgba(0, 0, 0, " + ((i%2)*0. + 0.2) + ")";


                var n = 64;
                for (var j = 0; j < n; j++) {

                    var p1 = [size / 2 * Math.cos(j * Math.PI * 2 / n),
                        size / 2 * Math.sin(j * Math.PI * 2 / n), 0.0
                    ];

                    var p0 = [size / 2 * Math.cos((j + 1) * Math.PI * 2 / n),
                        size / 2 * Math.sin((j + 1) * Math.PI * 2 / n), 0.0
                    ];

                    p0 = mat3_mul_vec(mat, p0);
                    p1 = mat3_mul_vec(mat, p1);

                    if (p0[2] > 0 && p1[2] > 0) {
                        ctx.beginPath();
                        ctx.moveTo(pos[0] + p0[0], pos[1] + p0[1]);
                        ctx.lineTo(pos[0] + p1[0], pos[1] + p1[1]);
                        ctx.stroke();
                    }
                }
            }


            for (var i = 0; i < 9; i++) {
                var mat = mat3_mul(mvp, rot_x_mat3(Math.PI / 2));
                var start = true;

                var n = 64;
                for (var j = 0; j < n; j++) {

                    var h = size / 2 * Math.sin((i - 4) * Math.PI / 8);

                    var r = Math.sqrt(size * size / 4 - h * h);
                    var p1 = [r * Math.cos(j * Math.PI * 2 / n),
                        r * Math.sin(j * Math.PI * 2 / n), h
                    ];

                    var p0 = [r * Math.cos((j + 1) * Math.PI * 2 / n),
                        r * Math.sin((j + 1) * Math.PI * 2 / n), h
                    ];

                    p0 = mat3_mul_vec(mat, p0);
                    p1 = mat3_mul_vec(mat, p1);

                    if (p0[2] > 0 && p1[2] > 0) {
                        ctx.beginPath();
                        ctx.moveTo(pos[0] + p0[0], pos[1] + p0[1]);
                        ctx.lineTo(pos[0] + p1[0], pos[1] + p1[1]);
                        ctx.stroke();
                    }
                }
            }

            ctx.beginPath();
            ctx.ellipse(pos[0], pos[1], size / 2, size / 2, 0, 0, Math.PI * 2);
            ctx.closePath();
            ctx.stroke();
        }


        function fake_orbit() {
            var major = 20;
            var minor = major * Math.sqrt(1 - fake_e * fake_e);
            var radius = 2.5;
            var earth_r = 1.0;

            minor /= major;
            radius /= major;
            earth_r /= major;
            major = 1;


            var offset = fake_e * major;

            var s = Math.max(0, (0.5 * Math.min(width, height - 30) - 5));

            ctx.translate(width / 2, height / 2 - 15);

            ctx.lineWidth = 1;
            ctx.strokeStyle = "rgba(255,255,255,0.3)";

            ctx.beginPath();
            ctx.ellipse(0, 0, major * s, minor * s, 0, 0, Math.PI * 2);
            ctx.closePath();
            ctx.stroke();

            ctx.strokeStyle = "#777";

            ctx.beginPath();
            ctx.moveTo(-3, 0);
            ctx.lineTo(3, 0);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(0, -3);
            ctx.lineTo(0, 3);
            ctx.stroke();



            var size = Math.min(2 * earth_r * s, 2 * earth_r * s);

            ctx.fillStyle = earth_color;


            gl.begin(size, size);
            gl.draw_earth([size / 2, size / 2], size / 2, top_down);

            var earth_pos = [offset * s + major * s * fake_R_p * Math.cos(fake_L_p), -major * s * fake_R_p * Math.sin(fake_L_p)];

            ctx.beginPath();
            ctx.ellipse(earth_pos[0], earth_pos[1], size / 2, size / 2, 0, 0, Math.PI * 2);
            ctx.closePath();
            ctx.fill();

            ctx.fillStyle = sun_color;

            size = Math.min(2 * radius * s, 2 * radius * s);
            var sun_size = size;

            ctx.beginPath();
            ctx.ellipse(offset * s, 0, sun_size / 2, sun_size / 2, 0, 0, Math.PI * 2);
            ctx.closePath();
            ctx.fill();



            ctx.strokeStyle = "rgba(22, 22, 22,1.0)";

            ctx.beginPath();
            ctx.ellipse(offset * s, 0, 1.5, 1.5, 0, 0, Math.PI * 2);
            ctx.closePath();
            ctx.stroke();

            ctx.strokeStyle = "rgba(127, 127, 127,1.0)";

            ctx.beginPath();
            ctx.ellipse(-offset * s, 0, 1.5, 1.5, 0, 0, Math.PI * 2);
            ctx.closePath();
            ctx.stroke();


            ctx.font = "20px IBM Plex Sans";
            ctx.textAlign = "center";

            ctx.fillStyle = "#907567";
            ctx.fillText(date_string, 0, height / 2 + 10);
        }

        function earth_rotation_solar_day() {
            var size = Math.min(width * 0.8, height);

            ctx.translate(width / 2, height / 2);

            ctx.lineWidth = 1;
            ctx.strokeStyle = "rgba(255,255,255,0.2)";

            ctx.beginPath();
            ctx.ellipse(0, 0, size / 2, size / 2, 0, 0, Math.PI * 2);
            ctx.closePath();
            ctx.stroke();

            var max_orbit_angle = Math.PI * 0.25;
            var max_rev_angle = 2 * Math.PI + max_orbit_angle;

            var earth_pos = [size / 2 * Math.cos(progress * -max_orbit_angle),
                size / 2 * Math.sin(progress * -max_orbit_angle)
            ];

            var sun_size = size / 5;


            ctx.fillStyle = sun_color;

            ctx.beginPath();
            ctx.ellipse(0, 0, sun_size / 2, sun_size / 2, 0, 0, Math.PI * 2);
            ctx.closePath();
            ctx.fill();


            ctx.strokeStyle = "rgba(127, 127, 127 ,1.0)";
            ctx.lineWidth = 1;

            ctx.beginPath();
            ctx.moveTo(-2, 0);
            ctx.lineTo(2, 0);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(0, -2);
            ctx.lineTo(0, 2);
            ctx.stroke();


            ctx.strokeStyle = "rgba(100, 100, 100, 0.5)";
            ctx.lineWidth = 1;

            ctx.beginPath();
            ctx.moveTo(earth_pos[0], earth_pos[1]);
            ctx.lineTo(0, 0);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(earth_pos[0], earth_pos[1]);
            ctx.lineTo(earth_pos[0] - size * 3, earth_pos[1]);
            ctx.stroke();


            var earth_size = size / 8;


            ctx.save();
            ctx.translate(earth_pos[0], earth_pos[1]);
            ctx.rotate(progress * -max_rev_angle);
            ctx.translate(-earth_size / 2 - 30, 0);

            ctx.beginPath();

            ctx.fillStyle = "#999";
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(15, -7);
            ctx.lineTo(15, -2);
            ctx.lineTo(30, -2);
            ctx.lineTo(30, 2);
            ctx.lineTo(15, 2);
            ctx.lineTo(15, 7);
            ctx.closePath();
            ctx.fill();


            ctx.restore();




            var mat = mat3_mul(rot_z_mat3(-max_rev_angle * progress),
                rot_x_mat3(-Math.PI / 2));

            draw_wire(earth_pos, earth_size, mat);

            ctx.font = "22px IBM Plex Sans";
            ctx.textAlign = "center";

            var sidereal_progress = progress * max_rev_angle / (2 * Math.PI);

            var solar_a = Math.max(0, (progress - 0.98) / 0.02);
            ctx.fillStyle = "rgba(255, 255, 255, " + solar_a + ")";
            ctx.fillText("solar day", 00, size / 3);

            solar_a = Math.max(0, (sidereal_progress < 1.0 ? (sidereal_progress - 0.97) / 0.03 : (1.03 - sidereal_progress) / 0.03));
            ctx.fillStyle = "rgba(255, 255, 255, " + solar_a + ")";
            ctx.fillText("sidereal day", 00, size / 3);

        };


        function earth_orbit_axis() {


            var size = Math.max(0, Math.min(width, height - 30) * 0.9);

            ctx.translate(width / 2, height / 2 - 15);


            ctx.lineWidth = 1;
            ctx.strokeStyle = "rgba(255,255,255,0.3)";


            var e = 0.0167086;
            var major = 1;
            var minor = major * Math.sqrt(1 - e * e);
            var radius = 0.2;

            minor /= major;
            radius /= major;
            major = 1;

            var offset = e * major;

            var s = size / 2;

            ctx.lineWidth = 1;
            ctx.strokeStyle = "rgba(255,255,255,0.2)";

            ctx.beginPath();
            ctx.ellipse(0, 0, major * s, minor * s, 0, 0, Math.PI * 2);
            ctx.closePath();
            ctx.stroke();

            ctx.lineWidth = 2;
            ctx.strokeStyle = "rgba(167, 89, 0, 0.6)";

            var event_angle = -omega_p;
            var event_r = major * s * (1 - e * e) / (1 + e * Math.cos(event_angle));

            ctx.beginPath();
            ctx.moveTo(offset * s, 0);
            ctx.lineTo(offset * s + event_r * Math.cos(event_angle), -event_r * Math.sin(event_angle));
            ctx.stroke();

            ctx.strokeStyle = "rgba(200, 200, 200, 0.6)";

            event_angle = -omega_p + Math.PI / 2;
            event_r = major * s * (1 - e * e) / (1 + e * Math.cos(event_angle));

            ctx.beginPath();
            ctx.moveTo(offset * s, 0);
            ctx.lineTo(offset * s + event_r * Math.cos(event_angle), -event_r * Math.sin(event_angle));
            ctx.stroke();


            ctx.strokeStyle = "rgba(39, 174, 96, 0.6)";

            event_angle = -omega_p + Math.PI;
            event_r = major * s * (1 - e * e) / (1 + e * Math.cos(event_angle));

            ctx.beginPath();
            ctx.moveTo(offset * s, 0);
            ctx.lineTo(offset * s + event_r * Math.cos(event_angle), -event_r * Math.sin(event_angle));
            ctx.stroke();



            ctx.strokeStyle = "rgba(255, 198, 0, 0.6)";

            event_angle = -omega_p - Math.PI / 2;
            event_r = major * s * (1 - e * e) / (1 + e * Math.cos(event_angle));

            ctx.beginPath();
            ctx.moveTo(offset * s, 0);
            ctx.lineTo(offset * s + event_r * Math.cos(event_angle), -event_r * Math.sin(event_angle));
            ctx.stroke();


            ctx.fillStyle = sun_color;

            ctx.beginPath();
            ctx.ellipse(offset * s, 0, radius * s, radius * s, 0, 0, Math.PI * 2);
            ctx.closePath();
            ctx.fill();


            var earth_pos = [offset * s + major * s * R_p * Math.cos(L_p), -major * s * R_p * Math.sin(L_p)];



            var axial_angle = Math.PI / 2 - omega_p;



            var earth_size = size / 9;


            var mat = rot_x_mat3(-Math.PI / 2);
            mat = mat3_mul(mat, rot_z_mat3(axial_angle));
            mat = mat3_mul(mat, rot_y_mat3(-ecliptic_angle));
            mat = mat3_mul(mat, rot_z_mat3(-axial_angle));


            var line_mat = mat3_mul([1, 0, 0, 0, -1, 0, 0, 0, 1], mat3_invert(mat));

            ctx.lineWidth = 2.0;
            ctx.strokeStyle = "#bbb";
            ctx.lineCap = "round";

            var p0 = mat3_mul_vec(line_mat, [0, -earth_size / 2, 0]);
            var p1 = mat3_mul_vec(line_mat, [0, -4 * earth_size / 2, 0]);

            ctx.beginPath();
            ctx.moveTo(p0[0] + earth_pos[0], p0[1] + earth_pos[1]);
            ctx.lineTo(p1[0] + earth_pos[0], p1[1] + earth_pos[1]);
            ctx.stroke();

            draw_wire(earth_pos, earth_size, line_mat);


            ctx.lineWidth = 2.0;
            ctx.strokeStyle = "#bbb";
            ctx.lineCap = "round";

            var p0 = mat3_mul_vec(line_mat, [0, earth_size / 2, 0]);
            var p1 = mat3_mul_vec(line_mat, [0, 4 * earth_size / 2, 0]);

            ctx.beginPath();
            ctx.moveTo(p0[0] + earth_pos[0], p0[1] + earth_pos[1]);
            ctx.lineTo(p1[0] + earth_pos[0], p1[1] + earth_pos[1]);
            ctx.stroke();


            ctx.strokeStyle = "rgba(0, 0, 0, 0.4)";
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(-1.5, 0);
            ctx.lineTo(1.5, 0);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(0, -1.5);
            ctx.lineTo(0, 1.5);
            ctx.stroke();

            ctx.beginPath();
            ctx.ellipse(offset * s, 0, 1, 1, 0, 0, Math.PI * 2);
            ctx.closePath();
            ctx.stroke();


            ctx.font = "20px IBM Plex Sans";
            ctx.textAlign = "center";

            ctx.fillStyle = "#907567";
            ctx.fillText(date_string, 0, height / 2 + 10);

        };


        function earth_orbit_axis_side() {

            var size = width * 0.9;

            ctx.translate(width / 2, height / 2 - 15);

            ctx.lineWidth = 1;
            ctx.strokeStyle = "rgba(255,255,255,0.2)";


            var e = 0.0167086;
            var major = 1;
            var minor = major * Math.sqrt(1 - e * e);
            var radius = 0.2;

            minor /= major;
            radius /= major;
            major = 1;

            var offset = e * major;

            var s = size / 2;

            var eq_a = L_p + omega_p - Math.PI / 2;


            if (eq_a <= 0) {
                ctx.fillStyle = sun_color;

                ctx.beginPath();
                ctx.ellipse(offset * s, 0, radius * s, radius * s, 0, 0, Math.PI * 2);
                ctx.closePath();
                ctx.fill();


                ctx.fillStyle = "rgba(167, 89, 0, 0.6)";

                ctx.beginPath();
                ctx.ellipse(offset * s, 0, 2.0, 2.0, 0, 0, Math.PI * 2);
                ctx.closePath();
                ctx.fill();
            }


            var earth_pos = [offset * s + major * s * R_p * Math.cos(eq_a), 0];

            var axial_angle = Math.PI / 2 - omega_p;



            var earth_size = size / 9 * (1.0 - 0.15 * Math.sin(eq_a));


            var mat = rot_x_mat3(-Math.PI / 2);
            mat = mat3_mul(mat, rot_z_mat3(axial_angle));
            mat = mat3_mul(mat, rot_y_mat3(-ecliptic_angle));
            mat = mat3_mul(mat, rot_z_mat3(-axial_angle));
            mat = mat3_mul(mat, rot_x_mat3(Math.PI / 2));


            var line_mat = mat3_mul([1, 0, 0, 0, -1, 0, 0, 0, 1], mat3_invert(mat));

            ctx.lineWidth = 2.0;
            ctx.strokeStyle = "#bbb";
            ctx.lineCap = "round";

            var p0 = mat3_mul_vec(line_mat, [0, -earth_size / 2, 0]);
            var p1 = mat3_mul_vec(line_mat, [0, -2 * earth_size / 2, 0]);

            ctx.beginPath();
            ctx.moveTo(p0[0] + earth_pos[0], p0[1] + earth_pos[1]);
            ctx.lineTo(p1[0] + earth_pos[0], p1[1] + earth_pos[1]);
            ctx.stroke();

            draw_wire(earth_pos, earth_size, line_mat);


            ctx.lineWidth = 2.0;
            ctx.strokeStyle = "#bbb";
            ctx.lineCap = "round";

            var p0 = mat3_mul_vec(line_mat, [0, earth_size / 2, 0]);
            var p1 = mat3_mul_vec(line_mat, [0, 2 * earth_size / 2, 0]);

            ctx.beginPath();
            ctx.moveTo(p0[0] + earth_pos[0], p0[1] + earth_pos[1]);
            ctx.lineTo(p1[0] + earth_pos[0], p1[1] + earth_pos[1]);
            ctx.stroke();

            ctx.lineCap = "butt";

            if (eq_a > 0) {
                ctx.fillStyle = sun_color;

                ctx.beginPath();
                ctx.ellipse(offset * s, 0, radius * s, radius * s, 0, 0, Math.PI * 2);
                ctx.closePath();
                ctx.fill();

                ctx.fillStyle = "rgba(167, 89, 0, 0.6)";

                ctx.beginPath();
                ctx.ellipse(offset * s, 0, 2.0, 2.0, 0, 0, Math.PI * 2);
                ctx.closePath();
                ctx.fill();
            }

            ctx.font = "20px IBM Plex Sans";
            ctx.textAlign = "center";

            ctx.fillStyle = "#907567";
            ctx.fillText(date_string, 0, height / 2 + 10);

        };



        function sun_peri_ap_size() {

            var size = Math.max(0, Math.min(width, height * 2));

            ctx.translate(Math.round(width / 2), Math.round(height / 2) - 20);

            var scale = 91402640 / 94509460;
            var sun_size = size / 2.5;

            ctx.strokeStyle = "rgba(255,255,255,0.3)";
            ctx.lineWidth = 1;


            var base_sun_size = sun_size;

            ctx.fillStyle = sun_color;

            ctx.beginPath();
            ctx.ellipse(-sun_size / 2 - 20, 0, sun_size / 2, sun_size / 2, 0, 0, Math.PI * 2);
            ctx.closePath();
            ctx.fill();



            sun_size *= scale;

            ctx.beginPath();
            ctx.ellipse(+sun_size / 2 + 20, 0, sun_size / 2, sun_size / 2, 0, 0, Math.PI * 2);
            ctx.closePath();
            ctx.fill();

            var overlap = size / 2;

            ctx.beginPath();
            ctx.moveTo(-size / 2, base_sun_size / 2);
            ctx.lineTo(overlap, base_sun_size / 2);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(-size / 2, -base_sun_size / 2);
            ctx.lineTo(overlap, -base_sun_size / 2);
            ctx.stroke();

            overlap = 0;

            ctx.beginPath();
            ctx.moveTo(-overlap, sun_size / 2);
            ctx.lineTo(size / 2, sun_size / 2);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(-overlap, -sun_size / 2);
            ctx.lineTo(size / 2, -sun_size / 2);
            ctx.stroke();


            ctx.font = "22px IBM Plex Sans";
            ctx.textAlign = "center";

            ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
            ctx.fillText("perihelion", -sun_size / 2 - 20, sun_size / 2 + 40);
            ctx.fillText("aphelion", sun_size / 2 + 20, sun_size / 2 + 40);

        };

        function orbit() {
            var e = 0.0167086;
            var major = 149.60 * 1e6;
            var minor = major * Math.sqrt(1 - e * e);
            var radius = 695700;

            minor /= major;
            radius /= major;
            major = 1;

            var offset = e * major;

            var s = Math.max(0, (0.5 * Math.min(width, height - 30) - 2));

            ctx.translate(width / 2, height / 2 - 15);

            ctx.lineWidth = 1;
            ctx.strokeStyle = "rgba(255,255,255,0.3)";

            ctx.beginPath();
            ctx.ellipse(0, 0, major * s, minor * s, 0, 0, Math.PI * 2);
            ctx.closePath();
            ctx.stroke();

            ctx.fillStyle = "rgba(255,255,255,0.4)";

            ctx.beginPath();
            ctx.moveTo(-2, 0);
            ctx.lineTo(2, 0);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(0, -2);
            ctx.lineTo(0, 2);
            ctx.stroke();

            ctx.fillStyle = sun_color;

            ctx.beginPath();
            ctx.ellipse(offset * s, 0, radius * s, radius * s, 0, 0, Math.PI * 2);
            ctx.closePath();
            ctx.fill();

            self.earth_size = 2 * radius * s * 6371 / 695700;

            var earth_pos = [offset * s + major * s * R_p * Math.cos(L_p), -major * s * R_p * Math.sin(L_p)];

            var dst = 20;

            ctx.font = "20px IBM Plex Sans";
            ctx.textAlign = "center";

            ctx.save();

            ctx.translate(earth_pos[0], earth_pos[1]);
            ctx.rotate(-L_p);

            ctx.fillStyle = "rgba(255,255,255,0.4)";
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(-20, -10);
            ctx.lineTo(-20, -3);
            ctx.lineTo(-40, -3);
            ctx.lineTo(-40, 3);
            ctx.lineTo(-20, 3);
            ctx.lineTo(-20, 10);
            ctx.closePath();
            ctx.fill();

            ctx.restore();


            ctx.font = "20px IBM Plex Sans";
            ctx.textAlign = "right";

            ctx.fillStyle = "#907567";
            ctx.fillText(date_string, -6, height / 2 + 10);

            ctx.textAlign = "left";

            ctx.fillStyle = "#5A617A";
            ctx.fillText(time_string, 6, height / 2 + 10);
        }

        function earth_sunlight_sun() {

            var size = Math.max(0, Math.min(width, height - 30) - 30);

            ctx.translate(width / 2, height / 2 - 15);

            var sun_dir = [0, 0, 1];


            var sun_to_ecliptic = L_p + omega_p;
            var mat = rot_y_mat3(-earth_rot);
            mat = mat3_mul(mat, rot_y_mat3(-sun_to_ecliptic));
            mat = mat3_mul(mat, rot_z_mat3(-ecliptic_angle));
            mat = mat3_mul(mat, rot_y_mat3(sun_to_ecliptic));

            var line_mat = mat3_mul([1, 0, 0, 0, -1, 0, 0, 0, 1], mat3_invert(mat));
            var p0 = mat3_mul_vec(line_mat, [0, size / 2 + 3, 0]);
            var p1 = mat3_mul_vec(line_mat, [0, size / 2 + 13, 0]);

            var p2 = mat3_mul_vec(line_mat, [0, -size / 2 - 3, 0]);
            var p3 = mat3_mul_vec(line_mat, [0, -size / 2 - 13, 0]);


            ctx.lineWidth = 2.0;
            ctx.strokeStyle = "#333";
            ctx.lineCap = "butt";

            ctx.beginPath();
            ctx.moveTo(-size / 2 - 1, 0);
            ctx.lineTo(-size / 2 - 50, 0);
            ctx.stroke();


            ctx.beginPath();
            ctx.moveTo(+size / 2 + 1, 0);
            ctx.lineTo(+size / 2 + 50, 0);
            ctx.stroke();

            ctx.lineWidth = 2.0;
            ctx.strokeStyle = "#5A617A";
            ctx.lineCap = "round";

            gl.begin(size, size);
            gl.draw_earth([size / 2, size / 2], size / 2, mat, sun_dir, 0.95);


            if (p0[2] < 0) {
                ctx.beginPath();
                ctx.moveTo(p0[0], p0[1]);
                ctx.lineTo(p1[0], p1[1]);
                ctx.stroke();
            } else {
                ctx.beginPath();
                ctx.moveTo(p2[0], p2[1]);
                ctx.lineTo(p3[0], p3[1]);
                ctx.stroke();
            }

            ctx.drawImage(gl.finish(), -size / 2, -size / 2, size, size);

            if (p0[2] >= 0) {
                ctx.beginPath();
                ctx.moveTo(p0[0], p0[1]);
                ctx.lineTo(p1[0], p1[1]);
                ctx.stroke();
            } else {
                ctx.beginPath();
                ctx.moveTo(p2[0], p2[1]);
                ctx.lineTo(p3[0], p3[1]);
                ctx.stroke();
            }


            ctx.font = "20px IBM Plex Sans";
            ctx.textAlign = "right";

            ctx.fillStyle = "#907567";
            ctx.fillText(date_string, -6, height / 2 + 10);

            ctx.textAlign = "left";

            ctx.fillStyle = "#5A617A";
            ctx.fillText(time_string, 6, height / 2 + 10);
        };


        function earth_sunlight(point) {

            var size = Math.max(0, Math.min(width, height - 30) - 30);

            ctx.translate(width / 2, height / 2 - 15);

            var sun_dir = [0, 0, 1];
            var sun_to_ecliptic = L_p + omega_p;

            var mat = mat3_invert(mvp);

            var line_mat = mat3_mul([1, 0, 0, 0, -1, 0, 0, 0, 1], mvp);
            var p0 = mat3_mul_vec(line_mat, [0, size / 2 + 3, 0]);
            var p1 = mat3_mul_vec(line_mat, [0, size / 2 + 13, 0]);

            var p2 = mat3_mul_vec(line_mat, [0, -size / 2 - 3, 0]);
            var p3 = mat3_mul_vec(line_mat, [0, -size / 2 - 13, 0]);

            ctx.lineWidth = 2.0;
            ctx.strokeStyle = "#5A617A";
            ctx.lineCap = "round";

            var sun_mat = mvp;

            sun_mat = mat3_mul(sun_mat, rot_y_mat3(-earth_rot));

            sun_mat = mat3_mul(sun_mat, rot_y_mat3(-sun_to_ecliptic));
            sun_mat = mat3_mul(sun_mat, rot_z_mat3(-ecliptic_angle));
            sun_mat = mat3_mul(sun_mat, rot_y_mat3(+sun_to_ecliptic));


            sun_dir = mat3_mul_vec(sun_mat, sun_dir);

            gl.begin(size, size);
            gl.draw_earth([size / 2, size / 2], size / 2, mat, sun_dir, 0.92, point ? 0.9 : 0.0);


            if (p0[2] < 0) {
                ctx.beginPath();
                ctx.moveTo(p0[0], p0[1]);
                ctx.lineTo(p1[0], p1[1]);
                ctx.stroke();
            } else {
                ctx.beginPath();
                ctx.moveTo(p2[0], p2[1]);
                ctx.lineTo(p3[0], p3[1]);
                ctx.stroke();
            }

            ctx.drawImage(gl.finish(), -size / 2, -size / 2, size, size);

            if (p0[2] >= 0) {
                ctx.beginPath();
                ctx.moveTo(p0[0], p0[1]);
                ctx.lineTo(p1[0], p1[1]);
                ctx.stroke();
            } else {
                ctx.beginPath();
                ctx.moveTo(p2[0], p2[1]);
                ctx.lineTo(p3[0], p3[1]);
                ctx.stroke();
            }



            ctx.font = "20px IBM Plex Sans";
            ctx.textAlign = "right";

            ctx.fillStyle = "#907567";
            ctx.fillText(date_string, -6, height / 2 + 10);

            ctx.textAlign = "left";

            ctx.fillStyle = "#5A617A";
            ctx.fillText(time_string, 6, height / 2 + 10);
        };

        function outline() {

            ctx.fillStyle = "#232731";
            ctx.rect(0, 0, width, 0.5 * width);
            ctx.fill();

            if (outline_image.complete) {
                ctx.drawImage(outline_image, 0, 0, width, 0.5 * width);
            }

            ctx.strokeStyle = "rgba(0,0,0,0.1)";

            for (var i = 0; i <= 24; i++) {
                ctx.beginPath();
                ctx.moveTo(i * width / 24, 0);
                ctx.lineTo(i * width / 24, width * 0.5);
                ctx.stroke();
            }


            var sun_dir = [0, 0, 1];

            var sun_to_ecliptic = L_p + omega_p;
            var sun_mat = ident_matrix;

            sun_mat = mat3_mul(sun_mat, rot_y_mat3(-earth_rot));

            sun_mat = mat3_mul(sun_mat, rot_y_mat3(-sun_to_ecliptic));
            sun_mat = mat3_mul(sun_mat, rot_z_mat3(-ecliptic_angle));
            sun_mat = mat3_mul(sun_mat, rot_y_mat3(+sun_to_ecliptic));

            sun_dir = mat3_mul_vec(sun_mat, sun_dir);

            gl.begin(width, 0.5 * width);
            gl.draw_outline([width, width * 0.5], sun_dir);

            ctx.drawImage(gl.finish(), 0, 0, width, 0.5 * width);

            ctx.translate(width / 2, width * 0.5 + 30);


            ctx.font = "20px IBM Plex Sans";
            ctx.textAlign = "right";

            ctx.fillStyle = "#907567";
            ctx.fillText(date_string, -6, 0);

            ctx.textAlign = "left";

            ctx.fillStyle = "#5A617A";
            ctx.fillText(time_string, 6, 0);
        };

        function tropical_year() {
            var size = Math.max(0, Math.min(width, height) - 70);

            ctx.translate(width / 2, height / 2);

            ctx.lineWidth = 1;
            ctx.strokeStyle = "rgba(255,255,255,0.2)";



            var max_precession_angle = 0.1 * Math.PI;
            var max_rev_angle = 2 * Math.PI - max_precession_angle;

            var axial_angle = -Math.PI / 2 - omega_p - max_precession_angle * progress;

            var orbit_angle = Math.PI + omega_p + progress * -max_rev_angle;

            var earth_pos = [size / 2 * Math.cos(orbit_angle),
                size / 2 * Math.sin(orbit_angle)
            ];


            ctx.strokeStyle = "rgba(200, 200, 200, 0.4)";
            ctx.lineWidth = 2;

            ctx.beginPath();
            ctx.arc(0, 0, size / 2, Math.PI + omega_p, Math.PI + omega_p - max_rev_angle, true);
            ctx.stroke();

            ctx.strokeStyle = "rgba(200, 200, 200, 0.1)";
            ctx.lineWidth = 2;

            ctx.beginPath();
            ctx.arc(0, 0, size / 2, Math.PI + omega_p, Math.PI + omega_p - max_rev_angle);
            ctx.stroke();

            var sun_size = size / 10;

            ctx.fillStyle = sun_color;

            ctx.beginPath();
            ctx.ellipse(0, 0, sun_size, sun_size, 0, 0, Math.PI * 2);
            ctx.closePath();
            ctx.fill();

            ctx.strokeStyle = "rgba(200, 200, 200, 0.2)";
            ctx.lineWidth = 1;

            ctx.beginPath();
            ctx.moveTo(size / 2 * Math.cos(Math.PI + omega_p),
                size / 2 * Math.sin(Math.PI + omega_p));
            ctx.lineTo(0, 0);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(size / 2 * Math.cos(Math.PI + omega_p - max_rev_angle),
                size / 2 * Math.sin(Math.PI + omega_p - max_rev_angle));
            ctx.lineTo(0, 0);
            ctx.stroke();


            var earth_size = size / 9;


            var mat = rot_x_mat3(-Math.PI / 2);
            mat = mat3_mul(mat, rot_z_mat3(axial_angle));
            mat = mat3_mul(mat, rot_y_mat3(ecliptic_angle));
            mat = mat3_mul(mat, rot_z_mat3(-axial_angle));


            var line_mat = mat3_mul([1, 0, 0, 0, -1, 0, 0, 0, 1], mat3_invert(mat));

            ctx.lineWidth = 2.0;
            ctx.strokeStyle = "#bbb";
            ctx.lineCap = "round";

            var p0 = mat3_mul_vec(line_mat, [0, -earth_size / 2, 0]);
            var p1 = mat3_mul_vec(line_mat, [0, -4 * earth_size / 2, 0]);

            ctx.beginPath();
            ctx.moveTo(p0[0] + earth_pos[0], p0[1] + earth_pos[1]);
            ctx.lineTo(p1[0] + earth_pos[0], p1[1] + earth_pos[1]);
            ctx.stroke();

            draw_wire(earth_pos, earth_size, line_mat);


            ctx.lineWidth = 2.0;
            ctx.strokeStyle = "#bbb";
            ctx.lineCap = "round";

            var p0 = mat3_mul_vec(line_mat, [0, earth_size / 2, 0]);
            var p1 = mat3_mul_vec(line_mat, [0, 4 * earth_size / 2, 0]);

            ctx.beginPath();
            ctx.moveTo(p0[0] + earth_pos[0], p0[1] + earth_pos[1]);
            ctx.lineTo(p1[0] + earth_pos[0], p1[1] + earth_pos[1]);
            ctx.stroke();

            var p0 = mat3_mul_vec(line_mat, [0, -4 * earth_size / 2, 0]);
            var p1 = mat3_mul_vec(line_mat, [0, 4 * earth_size / 2, 0]);

            ctx.strokeStyle = "#bbb";
            ctx.fillStyle = "#bbb";

            ctx.translate(width / 2 - earth_size, height / 2 - earth_size * 0.5);

            ctx.beginPath();
            ctx.moveTo(p0[0], p0[1]);
            ctx.lineTo(p1[0], p1[1]);
            ctx.stroke();

            ctx.lineCap = "butt";
            ctx.lineWidth = 1;
            ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";


            ctx.beginPath();
            ctx.ellipse(0, 0, 2, 2, 0, 0, Math.PI * 2);
            ctx.closePath();
            ctx.fill();

            ctx.beginPath();
            ctx.arc(0, 0, 4 * earth_size / 2 * Math.sin(ecliptic_angle), 0 - Math.PI / 2 + omega_p, -Math.PI / 2 + omega_p + max_precession_angle);
            ctx.stroke();


            ctx.beginPath();
            ctx.arc(0, 0, 4 * earth_size / 2 * Math.sin(ecliptic_angle), 0 - Math.PI / 2 + omega_p + Math.PI, -Math.PI / 2 + Math.PI + omega_p + max_precession_angle);
            ctx.stroke();
        };

        function kepler() {
            var major = 20;
            var minor = major * Math.sqrt(1 - fake_e * fake_e);
            var radius = 3.5;
            var earth_r = 2.0;

            minor /= major;
            radius /= major;
            earth_r /= major;
            major = 1;


            var offset = fake_e * major;

            var s = Math.max(0, (0.5 * Math.min(width, height - 30) - 5));

            ctx.translate(width / 2, height / 2 - 15);

            ctx.lineWidth = 1;
            ctx.strokeStyle = "rgba(255,255,255,0.2)";

            ctx.beginPath();
            ctx.ellipse(0, 0, major * s, minor * s, 0, 0, Math.PI * 2);
            ctx.closePath();
            ctx.stroke();

            ctx.fillStyle = "rgba(255,255,255,0.4)";

            ctx.beginPath();
            ctx.moveTo(-2, 0);
            ctx.lineTo(2, 0);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(0, -2);
            ctx.lineTo(0, 2);
            ctx.stroke();

            var base = Math.floor(progress * 20) / 20.0;

            var arc_length = 0;

            var prev = undefined;


            for (var j = 0; j < 20; j++) {

                ctx.beginPath();
                ctx.fillStyle = "rgba(255,255,255," + (j % 2 ? "0.07" : "0.12") + ")";

                if (j == base * 20.0 || (j == 0 && progress == 1.0))
                    ctx.fillStyle = "rgba(255,233,165,0.2)";

                ctx.moveTo(offset * s, 0);
                for (var i = 0; i < 32; i++) {

                    var mean_anomaly = Math.PI * 2 * (0.05 * i / 31 + 0.05 * j);

                    var fake_E_p = eccentric_anomaly(fake_e, mean_anomaly);
                    var angle = true_anomaly(fake_e, fake_E_p);
                    var r = (1 - fake_e * fake_e) / (1 + fake_e * Math.cos(angle));
                    var pos = [offset * s + major * s * r * Math.cos(angle), -major * s * r * Math.sin(angle)];

                    ctx.lineTo(pos[0], pos[1]);
                }

                ctx.closePath();
                ctx.fill();

            }

            ctx.lineWidth = 4;
            ctx.strokeStyle = "#655621";

            ctx.beginPath();
            for (var i = 0; i < 32; i++) {

                var mean_anomaly = Math.PI * 2 * (base + 0.05 * i / 31);

                var fake_E_p = eccentric_anomaly(fake_e, mean_anomaly);
                var angle = true_anomaly(fake_e, fake_E_p);
                var r = (1 - fake_e * fake_e) / (1 + fake_e * Math.cos(angle));
                var pos = [offset * s + major * s * r * Math.cos(angle), -major * s * r * Math.sin(angle)];

                if (prev) {
                    ctx.lineTo(pos[0], pos[1]);
                    arc_length += Math.sqrt(Math.pow(pos[0] - prev[0], 2.0) +
                        Math.pow(pos[1] - prev[1], 2.0));
                } else {
                    ctx.moveTo(pos[0], pos[1]);
                }
                prev = pos;
            }

            ctx.stroke();


            var size = Math.min(2 * earth_r * s, 2 * earth_r * s);

            var mean_anomaly = Math.PI * 2 * progress;

            var fake_E_p = eccentric_anomaly(fake_e, mean_anomaly);
            var angle = true_anomaly(fake_e, fake_E_p);
            var r = (1 - fake_e * fake_e) / (1 + fake_e * Math.cos(angle));

            var earth_pos = [offset * s + major * s * r * Math.cos(angle), -major * s * r * Math.sin(angle)];

            ctx.fillStyle = earth_color;

            ctx.beginPath();
            ctx.ellipse(earth_pos[0], earth_pos[1], 4.0, 4.0, 0, 0, Math.PI * 2);
            ctx.closePath();
            ctx.fill();


            ctx.fillStyle = sun_color;


            ctx.beginPath();
            ctx.ellipse(offset * s, 0, 5.5, 5.5, 0, 0, Math.PI * 2);
            ctx.closePath();
            ctx.fill();


            ctx.lineWidth = 4;

            ctx.beginPath();
            ctx.moveTo(-arc_length / 2, height / 2 - 5);
            ctx.lineTo(+arc_length / 2, height / 2 - 5);
            ctx.closePath();
            ctx.stroke();
        }

        function ellipse_length() {
            var major = 20;
            var minor = major * Math.sqrt(1 - fake_e * fake_e);
            var radius = 3.5;
            var earth_r = 2.0;

            minor /= major;
            radius /= major;
            earth_r /= major;
            major = 1;


            var offset = fake_e * major;

            var s = Math.max(0, (0.5 * Math.min(width, height - 30) - 5));

            ctx.translate(width / 2, height / 2 - 15);

            ctx.lineWidth = 2;
            ctx.strokeStyle = "#666";

            ctx.beginPath();
            ctx.ellipse(0, 0, major * s, minor * s, 0, 0, Math.PI * 2);
            ctx.closePath();
            ctx.stroke();

            ctx.lineWidth = 1;


            ctx.save();
            ctx.strokeStyle = "#444";

            ctx.setLineDash([5, 2.5]);

            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(major * s, 0);
            ctx.stroke();

            ctx.setLineDash([1.5, 2.0]);

            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(0, -minor * s);
            ctx.stroke();

            ctx.restore();

            ctx.strokeStyle = "#666";

            ctx.beginPath();
            ctx.moveTo(-4, 0);
            ctx.lineTo(4, 0);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(0, -4);
            ctx.lineTo(0, 4);
            ctx.stroke();

            var angle = Math.PI * 2 * progress;

            var pos = [major * s * Math.cos(angle), -minor * s * Math.sin(angle)];

            var l0 = Math.sqrt(Math.pow(pos[0] - offset * s, 2) + pos[1] * pos[1]);
            var l1 = Math.sqrt(Math.pow(pos[0] + offset * s, 2) + pos[1] * pos[1]);

            ctx.lineWidth = 2;

            ctx.strokeStyle = "rgba(41,104,255,0.75)";

            ctx.beginPath();
            ctx.moveTo(offset * s, 0);
            ctx.lineTo(pos[0], pos[1]);
            ctx.closePath();
            ctx.stroke();

            ctx.lineWidth = 3;

            ctx.beginPath();
            ctx.moveTo(-(l0 + l1) / 2, height / 2 - 10);
            ctx.lineTo(-(l0 + l1) / 2 + l0, height / 2 - 10);
            ctx.closePath();
            ctx.stroke();

            ctx.lineWidth = 2;

            ctx.strokeStyle = "rgba(255,67,67,0.75)";

            ctx.beginPath();
            ctx.moveTo(-offset * s, 0);
            ctx.lineTo(pos[0], pos[1]);
            ctx.closePath();
            ctx.stroke();

            ctx.lineWidth = 3;

            ctx.beginPath();
            ctx.moveTo(-(l0 + l1) / 2 + l0, height / 2 - 10);
            ctx.lineTo(-(l0 + l1) / 2 + l0 + l1, height / 2 - 10);
            ctx.closePath();
            ctx.stroke();

            ctx.fillStyle = "#333";


            ctx.beginPath();
            ctx.ellipse(pos[0], pos[1], 3.0, 3.0, 0, 0, Math.PI * 2);
            ctx.closePath();
            ctx.fill();

            ctx.fillStyle = "#ddd";

            ctx.beginPath();
            ctx.ellipse(offset * s, 0, 2.5, 2.5, 0, 0, Math.PI * 2);
            ctx.closePath();
            ctx.fill();


            ctx.beginPath();
            ctx.ellipse(-offset * s, 0, 2.5, 2.5, 0, 0, Math.PI * 2);
            ctx.closePath();
            ctx.fill();



        }


        function ellipse_e() {

            var e = progress;
            var major = 20;
            var minor = major * Math.sqrt(1 - e * e);
            var radius = 3.5;
            var earth_r = 2.0;

            minor /= major;
            radius /= major;
            earth_r /= major;
            major = 1;

            var c0 = "rgba(39, 174, 96, 0.6)";
            var c1 = "rgba(241, 196, 15, 0.6)";

            var offset = e * major;

            var s = Math.max(0, (0.5 * Math.min(width, height - 30) - 5));

            ctx.translate(width / 2, height / 2 - 15);


            ctx.save();
            ctx.lineWidth = 2;
            ctx.strokeStyle = "#666";

            ctx.beginPath();
            ctx.ellipse(0, 0, major * s, minor * s, 0, 0, Math.PI * 2);
            ctx.moveTo(0, 0); // workaround for Safari bug
            ctx.stroke();

            ctx.restore();

            ctx.fillStyle = "rgba(255,255,255,0.4)";


            ctx.lineWidth = 2;

            ctx.strokeStyle = c0;
            ctx.beginPath();
            ctx.moveTo(offset * s, -10);
            ctx.lineTo(0, -10);
            ctx.closePath();
            ctx.stroke();

            ctx.strokeStyle = c1;

            ctx.beginPath();
            ctx.moveTo(major * s, 10);
            ctx.lineTo(0, 10);
            ctx.closePath();
            ctx.stroke();

            ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";


            ctx.lineWidth = 1;

            ctx.beginPath();
            ctx.moveTo(major * s, 20);
            ctx.lineTo(major * s, 0);
            ctx.closePath();
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(0, 20);
            ctx.lineTo(0, -20);
            ctx.closePath();
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(major * s, 0);
            ctx.closePath();
            ctx.stroke();


            ctx.beginPath();
            ctx.moveTo(offset * s, 0);
            ctx.lineTo(offset * s, -20);
            ctx.closePath();
            ctx.stroke();



            ctx.fillStyle = "#777";

            ctx.beginPath();
            ctx.ellipse(offset * s, 0, 2.5, 2.5, 0, 0, Math.PI * 2);
            ctx.closePath();
            ctx.fill();


            ctx.beginPath();
            ctx.ellipse(-offset * s, 0, 2.5, 2.5, 0, 0, Math.PI * 2);
            ctx.closePath();
            ctx.fill();

            ctx.font = "20px IBM Plex Sans";
            ctx.textAlign = "center";

            str = "e =  c  /  a  = " + e.toFixed(3);


            ctx.fillStyle = c1;

            ctx.roundRect(major * s / 2 - 11, 20, 22, 30, 5);
            ctx.fill();


            var dx = -ctx.measureText(str).width * 0.5 + ctx.measureText("e =  c  /  ").width + ctx.measureText("a").width * 0.5;;
            ctx.roundRect(dx - 11, height / 2 - 16, 22, 30, 5);
            ctx.fill();

            ctx.fillStyle = c0;

            ctx.roundRect(offset * s / 2 - 11, -50, 22, 30, 5);
            ctx.fill();


            var dx = -ctx.measureText(str).width * 0.5 + ctx.measureText("e =  ").width + ctx.measureText("c").width * 0.5;
            ctx.roundRect(dx - 11, height / 2 - 16, 22, 30, 5);
            ctx.fill();






            ctx.fillStyle = "#bbb";
            ctx.fillText(str, 0, height / 2 + 5);

            ctx.textAlign = "center";
            ctx.fillText("a", major * s / 2, 42);
            ctx.fillText("c", offset * s / 2, -28);

        }


        function plane() {
            var e = 0.0167086;
            var major = 1;
            var minor = major * Math.sqrt(1 - e * e);
            var radius = 0.2;

            minor /= major;
            radius /= major;
            major = 1;

            var offset = e * major;
            var tilt = Math.PI * drag_y * 0.5 / max_tilt;
            var sc = Math.cos(tilt);

            var s = Math.max(0, (0.25 * Math.min(width, height / sc) - 2));

            ctx.translate(Math.round(width / 2), Math.round(height / 2));

            var grid_style = "rgba(60, 60, 60,0.25)";
            ctx.lineWidth = 1 / scale;
            ctx.strokeStyle = grid_style;

            var mat = rot_z_mat3(Math.PI / 4);
            mat = mat3_mul(rot_x_mat3(tilt), mat);

            var n = 24;
            var space = s * 2.8 / n;

            for (var i = 0; i <= n; i++) {
                var p0 = [(i - n / 2) * space, -n / 2 * space, 0.0];
                var p1 = [(i - n / 2) * space, +n / 2 * space, 0.0];

                p0 = mat3_mul_vec(mat, p0);
                p1 = mat3_mul_vec(mat, p1);

                ctx.beginPath();
                ctx.moveTo(p0[0], p0[1]);
                ctx.lineTo(p1[0], p1[1]);
                ctx.closePath();
                ctx.stroke();

                p0 = [-n / 2 * space, (i - n / 2) * space, 0.0];
                p1 = [+n / 2 * space, (i - n / 2) * space, 0.0];

                p0 = mat3_mul_vec(mat, p0);
                p1 = mat3_mul_vec(mat, p1);

                ctx.beginPath();
                ctx.moveTo(p0[0], p0[1]);
                ctx.lineTo(p1[0], p1[1]);
                ctx.closePath();
                ctx.stroke();
            }

            ctx.beginPath();
            var p0 = [-n / 2 * space, -n / 2 * space, 0.0];
            var p1 = [-n / 2 * space, +n / 2 * space, 0.0];
            var p2 = [+n / 2 * space, +n / 2 * space, 0.0];
            var p3 = [+n / 2 * space, -n / 2 * space, 0.0];

            p0 = mat3_mul_vec(mat, p0);
            p1 = mat3_mul_vec(mat, p1);
            p2 = mat3_mul_vec(mat, p2);
            p3 = mat3_mul_vec(mat, p3);

            ctx.fillStyle = "rgba(35, 35, 35, 0.5)";
            ctx.moveTo(p0[0], p0[1]);
            ctx.lineTo(p1[0], p1[1]);
            ctx.lineTo(p2[0], p2[1]);
            ctx.lineTo(p3[0], p3[1]);
            ctx.closePath();
            ctx.fill();

            // ctx.strokeStyle = "rgba(255,255,255,0.3)";
            // ctx.lineWidth = 1.5;
            // ctx.stroke();

            ctx.strokeStyle = "rgba(255,255,255,0.2)";
            ctx.lineWidth = 1;

            ctx.beginPath();
            var begin = true;
            for (var i = 0; i < 64; i++) {

                var a = 2 * Math.PI * i / 64;
                var p = [s * 1.1 * Math.cos(a), s * 1.1 * Math.sin(a), 0.0];

                p = mat3_mul_vec(mat, p);

                if (begin)
                    ctx.moveTo(p[0], p[1]);
                else
                    ctx.lineTo(p[0], p[1]);

                begin = false;
            }

            ctx.closePath();
            ctx.stroke();

            var sun_size = Math.round(radius * s);

            var earth_size = Math.round(sun_size * 0.5);

            var angle = -progress * Math.PI * 2;
            var earth_pos = [s * 1.1 * Math.cos(angle), s * 1.1 * Math.sin(angle), 0.0];


            ctx.fillStyle = "white";

            ctx.globalCompositeOperation = "destination-out";

            ctx.beginPath();
            ctx.ellipse(0, 0, sun_size - 0.25, sun_size * sc, 0, 0, Math.PI * 2);
            ctx.closePath();
            ctx.fill();

            earth_pos = mat3_mul_vec(mat, earth_pos);

            ctx.beginPath();
            ctx.ellipse(earth_pos[0], earth_pos[1], earth_size - 0.25, earth_size * sc, 0, 0, Math.PI * 2);
            ctx.closePath();
            ctx.fill();

            function draw_earth_sover() {

                ctx.globalCompositeOperation = "source-over";
                ctx.strokeStyle = grid_style;
                ctx.lineWidth = 1;


                ctx.beginPath();
                ctx.ellipse(earth_pos[0], earth_pos[1], earth_size, earth_size * sc, 0, 0, Math.PI * 2);
                ctx.closePath();
                ctx.stroke();


                ctx.globalCompositeOperation = "source-over";


                ctx.save();

                ctx.beginPath();
                ctx.rect(earth_pos[0] - earth_size, earth_pos[1] - earth_size, earth_size * 2, earth_size);
                ctx.clip();

                ctx.fillStyle = earth_color;
                ctx.beginPath();
                ctx.ellipse(earth_pos[0], earth_pos[1], earth_size, earth_size, 0, 0, Math.PI * 2);
                ctx.closePath();
                ctx.fill();

                ctx.restore();
            }

            function draw_earth_dover() {


                ctx.globalCompositeOperation = "destination-over";

                ctx.save();

                ctx.beginPath();
                ctx.rect(earth_pos[0] - earth_size, earth_pos[1], earth_size * 2, earth_size);
                ctx.clip();

                ctx.fillStyle = earth_color;
                ctx.beginPath();
                ctx.ellipse(earth_pos[0], earth_pos[1], earth_size, earth_size, 0, 0, Math.PI * 2);
                ctx.closePath();
                ctx.fill();


                ctx.restore();

            }

            function draw_sun_sover() {

                ctx.globalCompositeOperation = "source-over";
                ctx.strokeStyle = grid_style;
                ctx.lineWidth = 1;

                ctx.beginPath();
                ctx.ellipse(0, 0, sun_size, sun_size * sc, 0, 0, Math.PI * 2);
                ctx.closePath();
                ctx.stroke();


                ctx.globalCompositeOperation = "source-over";

                ctx.save();

                ctx.beginPath();
                ctx.rect(-sun_size, -sun_size, sun_size * 2, sun_size);
                ctx.clip();

                ctx.fillStyle = sun_color;
                ctx.beginPath();
                ctx.ellipse(0, 0, sun_size, sun_size, 0, 0, Math.PI * 2);
                ctx.closePath();
                ctx.fill();


                ctx.restore();
            }



            function draw_sun_dover() {



                ctx.globalCompositeOperation = "destination-over";


                ctx.save();

                ctx.beginPath();
                ctx.rect(-sun_size, 0, sun_size * 2, sun_size);
                ctx.clip();

                ctx.fillStyle = sun_color;
                ctx.beginPath();
                ctx.ellipse(0, 0, sun_size, sun_size, 0, 0, Math.PI * 2);
                ctx.closePath();
                ctx.fill();


                ctx.restore();

            }

            if (earth_pos[2] > 0) {
                draw_sun_sover();

                draw_earth_dover();
                draw_earth_sover();
                draw_sun_dover();
            } else {
                draw_sun_dover();

                draw_earth_sover();

                draw_earth_dover();

                draw_sun_sover();
            }

            ctx.globalCompositeOperation = "source-over";

        }


        function precession() {
            var size = Math.max(0, Math.min(width, height) - 30);

            ctx.translate(width / 2, height / 2);

            var max_precession_angle = 2 * Math.PI;
            var axial_angle = Math.PI / 2 - omega_p - max_precession_angle * progress;

            var earth_pos = [0, 0];

            var tilt = Math.PI * 0.3;

            ctx.strokeStyle = "rgba(200, 200, 200, 0.2)";
            ctx.lineWidth = 1;


            var earth_size = size * 0.7;


            var mat = rot_x_mat3(-Math.PI * 0.5);
            mat = mat3_mul(mat, rot_z_mat3(axial_angle));
            mat = mat3_mul(mat, rot_y_mat3(-ecliptic_angle));
            mat = mat3_mul(mat, rot_z_mat3(-axial_angle));
            mat = mat3_mul(mat, rot_x_mat3(tilt));
            var line_mat = mat3_mul([1, 0, 0, 0, -1, 0, 0, 0, 1], mat3_invert(mat));

            ctx.lineWidth = 2.0;
            ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";

            ctx.beginPath();
            ctx.ellipse(0,
                1.4 * earth_size / 2 * Math.sin(tilt) * Math.cos(ecliptic_angle),
                1.4 * earth_size / 2 * Math.sin(ecliptic_angle),
                1.4 * earth_size / 2 * Math.sin(ecliptic_angle) * Math.cos(tilt),
                0, 0, Math.PI * 2);

            ctx.closePath();
            ctx.stroke();



            ctx.lineWidth = 2.0;
            ctx.strokeStyle = "#bbb";
            ctx.lineCap = "round";

            var p0 = mat3_mul_vec(line_mat, [0, -earth_size / 2, 0]);
            var p1 = mat3_mul_vec(line_mat, [0, -1.4 * earth_size / 2, 0]);

            ctx.beginPath();
            ctx.moveTo(p0[0] + earth_pos[0], p0[1] + earth_pos[1]);
            ctx.lineTo(p1[0] + earth_pos[0], p1[1] + earth_pos[1]);
            ctx.stroke();

            draw_wire(earth_pos, earth_size, line_mat, 1.8);

            ctx.lineWidth = 2.0;
            ctx.strokeStyle = "#bbb";
            ctx.lineCap = "round";

            var p0 = mat3_mul_vec(line_mat, [0, earth_size / 2, 0]);
            var p1 = mat3_mul_vec(line_mat, [0, 1.4 * earth_size / 2, 0]);

            ctx.beginPath();
            ctx.moveTo(p0[0] + earth_pos[0], p0[1] + earth_pos[1]);
            ctx.lineTo(p1[0] + earth_pos[0], p1[1] + earth_pos[1]);
            ctx.stroke();


            ctx.lineWidth = 2.0;
            ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";

            ctx.beginPath();
            ctx.ellipse(0, -1.4 * earth_size / 2 * Math.sin(tilt) * Math.cos(ecliptic_angle),
                1.4 * earth_size / 2 * Math.sin(ecliptic_angle),
                1.4 * earth_size / 2 * Math.sin(ecliptic_angle) * Math.cos(tilt),
                0, 0, Math.PI * 2);
            ctx.closePath();
            ctx.stroke();

            ctx.translate(size / 2 - 10, size / 2 - 10);

            ctx.lineWidth = 1.0;

            ctx.beginPath();
            ctx.ellipse(0,
                0, 16, 16,
                0, 0, Math.PI * 2);
            ctx.closePath();
            ctx.stroke();

            ctx.fillStyle = sun_color;
            ctx.beginPath();
            ctx.ellipse(0,
                0, 2, 2,
                0, 0, Math.PI * 2);
            ctx.closePath();
            ctx.fill();

            ctx.translate(16, 0);

            ctx.rotate(-axial_angle);

            ctx.strokeStyle = "#bbb";
            ctx.beginPath();
            ctx.moveTo(-4, 0);
            ctx.lineTo(4, 0);
            ctx.stroke();

        }


        function solar_noon() {
            var size = Math.min(width, height);

            ctx.translate(width / 2, height / 2);

            var angle = Math.PI * 2 * progress;

            var earth_pos = [0, 0];

            var tilt = Math.PI * 0.2;

            ctx.strokeStyle = "rgba(200, 200, 200, 0.2)";
            ctx.lineWidth = 1;


            var earth_size = size * 0.5;

            ctx.translate(size * 0.25, -size * 0.25);


            var mat = rot_x_mat3(-Math.PI * 0.5);
            mat = mat3_mul(mat, rot_z_mat3(angle));
            mat = mat3_mul(mat, rot_x_mat3(tilt));
            var line_mat = mat3_mul([1, 0, 0, 0, -1, 0, 0, 0, 1], mat3_invert(mat));


            ctx.lineWidth = 2.0;
            ctx.strokeStyle = "#bbb";
            ctx.lineCap = "round";

            var p0 = mat3_mul_vec(line_mat, [0, -earth_size / 2, 0]);
            var p1 = mat3_mul_vec(line_mat, [0, -1.4 * earth_size / 2, 0]);

            ctx.beginPath();
            ctx.moveTo(p0[0] + earth_pos[0], p0[1] + earth_pos[1]);
            ctx.lineTo(p1[0] + earth_pos[0], p1[1] + earth_pos[1]);
            ctx.stroke();

            draw_wire(earth_pos, earth_size, line_mat, 1.5);


            ctx.lineWidth = 2.0;
            ctx.strokeStyle = sun_color;
            ctx.lineCap = "round";

            var mmat = rot_x_mat3(-Math.PI * 0.5);;
            mmat = mat3_mul(mmat, rot_x_mat3(tilt));
            mmat = mat3_mul([1, 0, 0, 0, -1, 0, 0, 0, 1], mat3_invert(mmat));


            mmat = mat3_mul(mmat,

                mat3_mul(
                    rot_y_mat3(Math.PI * 0.25),
                    rot_z_mat3(Math.PI / 2)
                ));

            var n = 64;

            ctx.beginPath();
            var start = true;
            for (var j = 0; j < n; j++) {

                var p0 = [earth_size / 2 * Math.cos(j * Math.PI / n),
                    earth_size / 2 * Math.sin(j * Math.PI / n), 0.0
                ];

                var p1 = [earth_size / 2 * Math.cos((j + 1) * Math.PI / n),
                    earth_size / 2 * Math.sin((j + 1) * Math.PI / n), 0.0
                ];

                p0 = mat3_mul_vec(mmat, p0);
                p1 = mat3_mul_vec(mmat, p1);

                if (p0[2] > 0 && p1[2] > 0) {
                    if (start)
                        ctx.moveTo(p0[0], p0[1]);
                    else
                        ctx.lineTo(p1[0], p1[1]);

                    start = false;
                }
            }
            ctx.stroke();


            ctx.lineWidth = 2.0;
            ctx.strokeStyle = "#bbb";
            ctx.lineCap = "round";

            var p0 = mat3_mul_vec(line_mat, [0, earth_size / 2 + 0, 0]);
            var p1 = mat3_mul_vec(line_mat, [0, 1.4 * earth_size / 2 + 0, 0]);

            ctx.beginPath();
            ctx.moveTo(p0[0] + earth_pos[0], p0[1] + earth_pos[1]);
            ctx.lineTo(p1[0] + earth_pos[0], p1[1] + earth_pos[1]);
            ctx.stroke();

            ctx.fillStyle = "#ff2626";

            ctx.save();

            var pp = mat3_mul_vec(mmat, [0, earth_size / 2, 0]);

            ctx.translate(pp[0], pp[1]);
            ctx.rotate(0.75);

            ctx.beginPath();
            ctx.ellipse(0, 0,
                2.5,
                2.0,
                0, 0, Math.PI * 2);
            ctx.closePath();
            ctx.fill();

            ctx.restore();

            ctx.fillStyle = sun_color;

            ctx.translate(-size * 0.5, size * 0.5);

            ctx.beginPath();
            ctx.ellipse(0,
                0,
                earth_size * 0.5,
                earth_size * 0.5,
                0, 0, Math.PI * 2);
            ctx.closePath();
            ctx.fill();

        }


        function cosine() {
            var size = Math.max(0, Math.min(width, height - 30) * 0.9);

            ctx.translate(width / 2, height / 2 - 13);

            ctx.lineWidth = 1;

            var space = 3;

            ctx.strokeStyle = "rgba(255,255,255,0.3)";

            for (var i = 0; i < size; i += space) {
                ctx.beginPath();
                ctx.moveTo(0, i - size / 2);
                ctx.lineTo(width / 2, i - size / 2);
                ctx.stroke();
            }


            ctx.fillStyle = "black";
            ctx.strokeStyle = "white";


            ctx.font = "20px IBM Plex Sans";
            ctx.textAlign = "center";

            ctx.fillStyle = "#907567";
            ctx.fillText(date_string, 0, height / 2 + 8);


            ctx.fillStyle = "black";

            var a = -Math.sin(L_p + omega_p) * ecliptic_angle;

            var split = Math.PI / 10;

            ctx.fillStyle = "rgba(41, 128, 185,0.3)";

            ctx.beginPath();
            ctx.rect(0,
                Math.sin(-3 * split + a) * size / 2,
                width / 2,
                (-Math.sin(-3 * split + a) + Math.sin(-split + a)) * size / 2)
            ctx.fill();

            ctx.fillStyle = "rgba(241, 196, 15,0.3)";

            ctx.beginPath();
            ctx.rect(0,
                Math.sin(-split + a) * size / 2,
                width / 2,
                (-Math.sin(-split + a) + Math.sin(+split + a)) * size / 2)
            ctx.fill();

            ctx.fillStyle = "rgba(192, 57, 43, 0.3)";

            ctx.beginPath();
            ctx.rect(0,
                Math.sin(split + a) * size / 2,
                width / 2,
                (-Math.sin(split + a) + Math.sin(+3 * split + a)) * size / 2)
            ctx.fill();


            ctx.rotate(a);

            ctx.lineWidth = 2.0;
            ctx.strokeStyle = "#bbb";
            ctx.lineCap = "round";


            ctx.beginPath();
            ctx.moveTo(0, size / 2 + 3);
            ctx.lineTo(0, size / 2 + 13);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(0, -size / 2 - 3);
            ctx.lineTo(0, -size / 2 - 13);
            ctx.stroke();

            ctx.lineWidth = 1.0;
            ctx.lineCap = "butt";


            ctx.fillStyle = "black";
            ctx.strokeStyle = "#999"

            ctx.beginPath();
            ctx.ellipse(0, 0, size / 2, size / 2, 0, 0, Math.PI * 2);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();


            var p0 = Math.round(((-Math.sin(-split + a) + Math.sin(+split + a)) / 2) * 100);
            var p1 = Math.round(((-Math.sin(-3 * split + a) + Math.sin(-split + a)) / 2) * 100);
            var p2 = Math.round(((-Math.sin(split + a) + Math.sin(+3 * split + a)) / 2) * 100);

            ctx.lineWidth = 3;

            ctx.strokeStyle = "#f1c40f";
            ctx.fillStyle = "#f1c40f";

            ctx.beginPath();
            ctx.arc(0, 0, size / 2, -split, split);
            ctx.stroke();


            ctx.textAlign = "center";
            ctx.fillText(p0 + "%", size / 2 - 40, 0);

            ctx.strokeStyle = "#2980b9";
            ctx.fillStyle = "#2980b9";

            ctx.rotate(-2 * split);
            ctx.beginPath();
            ctx.arc(0, 0, size / 2, -split, split);
            ctx.stroke();

            ctx.fillText(p1 + "%", size / 2 - 40, 0);


            ctx.strokeStyle = "#c0392b";
            ctx.fillStyle = "#c0392b";

            ctx.rotate(4 * split);
            ctx.beginPath();
            ctx.arc(0, 0, size / 2, -split, split);
            ctx.stroke();

            ctx.fillText(p2 + "%", size / 2 - 40, 0);


        };


        function analemma() {

            var size = height - 30;


            var sun_dir = [0, 0, 1];
            var sun_to_ecliptic = L_p + omega_p;

            ctx.lineWidth = 2.0;
            ctx.strokeStyle = "#5A617A";
            ctx.lineCap = "round";

            var sun_mat = ident_matrix;

            sun_mat = mat3_mul(sun_mat, rot_y_mat3(-earth_rot));

            sun_mat = mat3_mul(sun_mat, rot_y_mat3(-sun_to_ecliptic));
            sun_mat = mat3_mul(sun_mat, rot_z_mat3(-ecliptic_angle));
            sun_mat = mat3_mul(sun_mat, rot_y_mat3(+sun_to_ecliptic));

            // sun_mat = mat3_mul(sun_mat, rot_x_mat3(51.48*Math.PI/180));

            sun_dir = mat3_mul_vec(sun_mat, sun_dir);

            var deg_scale = size / 60;

            // Greenwich os 51.48N
            var az = Math.atan2(sun_dir[1], sun_dir[2]);
            var incl = Math.asin(sun_dir[0]);

            az *= -180 / Math.PI;
            incl *= -180 / Math.PI;


            ctx.fillStyle = "#4E96CB";
            ctx.rect(0, 0, width, size);
            ctx.fill();
            ctx.translate(width / 2, size / 2);

            ctx.lineWidth = 1.5;

            ctx.strokeStyle = "rgba(255,210,152,0.6)";

            var font = size < 270 ? "13px IBM Plex Sans" : "15px IBM Plex Sans";



            ctx.beginPath();
            ctx.moveTo(-analemma_data[0][0] * deg_scale,
                analemma_data[0][1] * deg_scale);
            for (var i = 1; i < analemma_data.length; i++)
                ctx.lineTo(-analemma_data[i][0] * deg_scale,
                    analemma_data[i][1] * deg_scale);

            ctx.closePath();
            ctx.stroke();

            ctx.lineWidth = 1;
            // ctx.strokeStyle="rgba(0,0,0,0.1)";
            ctx.strokeStyle = "rgba(255,255,255,0.15)";


            ctx.beginPath();
            ctx.moveTo(0, -height / 2 + 30);
            ctx.lineTo(0, height / 2 - 40);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(-deg_scale * 10, -height / 2 + 30);
            ctx.lineTo(-deg_scale * 10, height / 2 - 40);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(deg_scale * 10, -height / 2 + 30);
            ctx.lineTo(deg_scale * 10, height / 2 - 40);
            ctx.stroke();

            for (var i = 20; i <= 60; i += 10) {

                var y = (90 - 51.48 - i) * deg_scale;
                ctx.beginPath();
                ctx.moveTo(-width / 2 + 40, y);
                ctx.lineTo(width / 2 - (i == 20 ? 90 : 40), y);
                ctx.stroke();

                ctx.fillStyle = "rgba(255,255,255,0.6)";

                ctx.font = font;
                ctx.textAlign = "right";

                ctx.fillText(i + "°", -width / 2 + 36, y + 3);

            }


            ctx.save();

            ctx.shadowBlur = 15;
            ctx.shadowColor = "rgba(255,140,0,0.7)";

            var sun_size = 0.53 * deg_scale;

            ctx.fillStyle = "white";
            ctx.beginPath();
            ctx.ellipse(deg_scale * incl, az * deg_scale, sun_size, sun_size, 0, 0, Math.PI * 2);
            ctx.closePath();
            ctx.fill();

            ctx.restore();

            ctx.fillStyle = "rgba(255,255,255,0.6)";

            ctx.font = font;
            ctx.textAlign = "center";

            ctx.fillText("← E", -deg_scale * 20, height / 2 - 25);
            ctx.fillText("180°", 0, height / 2 - 25);
            ctx.fillText("170°", -deg_scale * 10, height / 2 - 25);
            ctx.fillText("190°", +deg_scale * 10, height / 2 - 25);
            ctx.fillText("W →", +deg_scale * 20, height / 2 - 25);

            ctx.font = "20px IBM Plex Sans";
            ctx.textAlign = "right";

            ctx.fillStyle = "#907567";
            ctx.fillText(date_string, -6, height / 2 + 10);

            ctx.textAlign = "left";

            ctx.fillStyle = "#5A617A";
            ctx.fillText(time_string, 6, height / 2 + 10);

            var r = 20;

            ctx.translate(width / 2 - r - 20, height / 2 - r - 30);

            ctx.fillStyle = "rgba(255,255,255,0.6)";

            ctx.font = "10px IBM Plex Sans";
            ctx.textAlign = "center";
            ctx.fillText("S", 0, r);

            ctx.textAlign = "left";
            ctx.fillText("E", r + 3, 3);
            ctx.textAlign = "right";
            ctx.fillText("W", -r - 3, 3);

            var az = (180 - (-width / 2) / deg_scale) * Math.PI / 180;

            var start = true;

            var tilt = 0.4;
            var tr = rot_y_mat3(-0.0);
            tr = mat3_mul(rot_x_mat3(tilt), tr);

            ctx.strokeStyle = "#ddd";


            ctx.beginPath();
            for (var i = 0; i <= 20; i++) {
                var alt = (((i / 20) * size - size / 2) / deg_scale - (90 - 51.48)) * Math.PI / 180;
                var p = [Math.sin(az) * r * Math.cos(alt),
                    r * Math.sin(alt),
                    Math.cos(az) * r * Math.cos(alt)
                ];

                p = mat3_mul_vec(tr, p);
                if (start)
                    ctx.moveTo(p[0], p[1]);
                else
                    ctx.lineTo(p[0], p[1]);

                start = false;
            }
            ctx.stroke();

            var az = (180 - (+width / 2) / deg_scale) * Math.PI / 180;

            ctx.beginPath();
            for (var i = 0; i <= 20; i++) {
                var alt = (((i / 20) * size - size / 2) / deg_scale - (90 - 51.48)) * Math.PI / 180;
                var p = [Math.sin(az) * r * Math.cos(alt),
                    r * Math.sin(alt),
                    Math.cos(az) * r * Math.cos(alt)
                ];

                p = mat3_mul_vec(tr, p);
                if (start)
                    ctx.moveTo(p[0], p[1]);
                else
                    ctx.lineTo(p[0], p[1]);

                start = false;
            }
            ctx.stroke();

            var alt = ((-size / 2) / deg_scale - (90 - 51.48)) * Math.PI / 180;

            ctx.beginPath();
            for (var i = 0; i <= 20; i++) {
                var az = (180 - (+(i / 20) * width - width / 2) / deg_scale) * Math.PI / 180;

                var p = [Math.sin(az) * r * Math.cos(alt),
                    r * Math.sin(alt),
                    Math.cos(az) * r * Math.cos(alt)
                ];

                p = mat3_mul_vec(tr, p);
                if (start)
                    ctx.moveTo(p[0], p[1]);
                else
                    ctx.lineTo(p[0], p[1]);

                start = false;
            }
            ctx.stroke();


            var alt = ((+size / 2) / deg_scale - (90 - 51.48)) * Math.PI / 180;

            ctx.beginPath();
            for (var i = 0; i <= 20; i++) {
                var az = (180 - (+(i / 20) * width - width / 2) / deg_scale) * Math.PI / 180;

                var p = [Math.sin(az) * r * Math.cos(alt),
                    r * Math.sin(alt),
                    Math.cos(az) * r * Math.cos(alt)
                ];

                p = mat3_mul_vec(tr, p);
                if (start)
                    ctx.moveTo(p[0], p[1]);
                else
                    ctx.lineTo(p[0], p[1]);

                start = false;
            }
            ctx.stroke();

            ctx.strokeStyle = "rgba(255,255,255,0.3)";

            ctx.beginPath();
            ctx.ellipse(0, 0, r, r, 0, Math.PI, 2 * Math.PI);
            ctx.stroke();

            ctx.beginPath();
            ctx.ellipse(0, 0, r, r * Math.sin(tilt), 0, 0, 2 * Math.PI);
            ctx.stroke();

            ctx.fillStyle = "#333";

            ctx.beginPath();
            ctx.ellipse(0, 0, 2, 2 * Math.sin(tilt), 0, 0, 2 * Math.PI);
            ctx.fill();
        };

    }


    var self = this;
    this.on_resize = function() {

        width = Math.max(wrapper.clientWidth, 100);
        height = Math.max(wrapper.clientHeight, 100);


        canvas.style.width = width + "px";
        canvas.style.height = height + "px";
        canvas.width = width * scale;
        canvas.height = height * scale;


        if (arcball) {

            var size = Math.max(0, Math.min(width, height - 30) - 30);
            arcball.set_viewport(15, 15, size, size);
        }

        self.repaint();
    }

    document.fonts.load("10px IBM Plex Sans").then(function() { self.repaint() });

    this.on_resize();


    window.addEventListener("resize", this.on_resize, true);
    window.addEventListener("load", this.on_resize, true);
}

var metric = true;

var fake_orbit_slider;
var fake_orbit_drawer;

var orbit_slider;
var orbit_drawer;

var earth_rot_slider;
var earth_rot_drawer;

var sunlight_sun_drawer;
var sunlight_sun_date_slider;

var earth_rot_solar_day_slider;
var earth_rot_solar_day_drawer;

var earth_orbit_side_slider;
var earth_orbit_side_drawer;

var repaint_func;

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


    var repaint = function() {
        for (var i = 0; i < drawers.length; i++) {
            drawers[i].recalc();
            drawers[i].repaint();
        }
    }

    repaint_func = repaint;

    var scale = Math.min(2, window.devicePixelRatio || 1);
    var gl = new GLDrawer(scale, function() {
        repaint();
    });

    var sun_size_drawer = new SpaceDrawer(gl, scale, document.getElementById("es_sun_size"), "sun_size");
    fake_orbit_drawer = new SpaceDrawer(gl, scale, document.getElementById("es_fake_orbit"), "fake_orbit");
    orbit_drawer = new SpaceDrawer(gl, scale, document.getElementById("es_orbit"), "orbit");
    earth_rot_drawer = new SpaceDrawer(gl, scale, document.getElementById("es_earth_rotation"), "earth_rotation");
    earth_rot_solar_drawer = new SpaceDrawer(gl, scale, document.getElementById("es_earth_rotation_solar_day"), "earth_rotation_solar_day");
    var earth_orbit_drawer = new SpaceDrawer(gl, scale, document.getElementById("es_earth_orbit_axis"), "earth_orbit_axis");
    earth_orbit_side_drawer = new SpaceDrawer(gl, scale, document.getElementById("es_earth_orbit_axis_side"), "earth_orbit_axis_side");
    var sun_peri_ap_size_drawer = new SpaceDrawer(gl, scale, document.getElementById("es_sun_peri_ap_size"), "sun_peri_ap_size");
    var sunlight_drawer = new SpaceDrawer(gl, scale, document.getElementById("es_earth_sunlight"), "earth_sunlight");
    var sunlight_drawer2 = new SpaceDrawer(gl, scale, document.getElementById("es_earth_sunlight2"), "earth_sunlight2");
    sunlight_sun_drawer = new SpaceDrawer(gl, scale, document.getElementById("es_earth_sunlight_sun"), "earth_sunlight_sun");
    var tropical_year_drawer = new SpaceDrawer(gl, scale, document.getElementById("es_tropical_year"), "tropical_year");
    var kepler_drawer = new SpaceDrawer(gl, scale, document.getElementById("es_kepler"), "kepler");
    var ellipse_length_drawer = new SpaceDrawer(gl, scale, document.getElementById("es_ellipse_length"), "ellipse_length");
    var ellipse_e_drawer = new SpaceDrawer(gl, scale, document.getElementById("es_ellipse_e"), "ellipse_e");
    var plane_drawer = new SpaceDrawer(gl, scale, document.getElementById("es_plane"), "plane");
    var precession_drawer = new SpaceDrawer(gl, scale, document.getElementById("es_earth_axis_precession"), "precession");
    var outline_drawer = new SpaceDrawer(gl, scale, document.getElementById("es_earth_outline"), "outline");
    var cosine_drawer = new SpaceDrawer(gl, scale, document.getElementById("es_cosine"), "cosine");
    var analemma_drawer = new SpaceDrawer(gl, scale, document.getElementById("es_analemma"), "analemma");
    var solar_noon_drawer = new SpaceDrawer(gl, scale, document.getElementById("es_solar_noon"), "solar_noon");


    var drawers = [
        sun_size_drawer,

        fake_orbit_drawer,
        orbit_drawer,
        earth_rot_drawer,
        earth_rot_solar_drawer,
        earth_orbit_drawer,
        earth_orbit_side_drawer,
        sun_peri_ap_size_drawer,
        sunlight_drawer,
        sunlight_drawer2,
        sunlight_sun_drawer,
        tropical_year_drawer,
        kepler_drawer,
        ellipse_length_drawer,
        ellipse_e_drawer,
        plane_drawer,
        precession_drawer,
        outline_drawer,
        cosine_drawer,
        analemma_drawer,
        solar_noon_drawer,
    ];


    outline_image.onload = function() {
        outline_drawer.recalc();
        outline_drawer.repaint();
    }

    function size_earth() {
        var str = orbit_drawer.earth_size.toFixed(4);
        document.getElementById("es_earth_diameter_pixels").innerHTML = str;
    };

    size_earth();



    window.addEventListener("resize", size_earth, true);
    window.addEventListener("load", size_earth, true);

    function t_to_date(t) {

        var year = 2019;

        t *= 365;
        var i = 0;
        var l = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
        while (t > l[i]) {
            t -= l[i];
            i++;
        }
        t = Math.floor(t);


        return i == 11 && t == 31 ? [year + 1, 1, 1] : [year, i + 1, t + 1];
    }

    function t_to_time(t) {
        t *= 24.0;
        var h = Math.floor(t);
        var m = Math.floor((t - h) * 60);
        return [h, m]
    }

    earth_rot_slider = new Slider(document.getElementById("es_earth_rotation_slider_container"), function(x) {
        var hm = t_to_time(x);
        earth_rot_drawer.set_time(hm[0], hm[1]);
    }, undefined, 0);


    earth_rot_solar_day_slider = new Slider(document.getElementById("es_earth_rotation_solar_day_slider_container"), function(x) {
        earth_rot_solar_drawer.set_progress(x);
    }, undefined, 0);


    new Slider(document.getElementById("es_earth_orbit_axis_slider_container"), function(x) {
        var ymd = t_to_date(x);
        earth_orbit_drawer.set_date(ymd[0], ymd[1], ymd[2]);
    }, undefined, 0);


    earth_orbit_side_slider = new Slider(document.getElementById("es_earth_orbit_axis_side_slider_container"), function(x) {
        var ymd = t_to_date(x);
        earth_orbit_side_drawer.set_date(ymd[0], ymd[1], ymd[2]);
    }, undefined, 0);

    fake_orbit_slider = new Slider(document.getElementById("es_fake_orbit_slider_container"), function(x) {
        var ymd = t_to_date(x);
        fake_orbit_drawer.set_date(ymd[0], ymd[1], ymd[2]);
    }, undefined, 0);

    orbit_slider = new Slider(document.getElementById("es_orbit_slider_container"), function(x) {
        var ymd = t_to_date(x);
        orbit_drawer.set_date(ymd[0], ymd[1], ymd[2]);
    }, undefined, 0);


    new Slider(document.getElementById("es_earth_sunlight_date_slider_container"), function(x) {
        var ymd = t_to_date(x);
        sunlight_drawer.set_date(ymd[0], ymd[1], ymd[2]);
    }, undefined);

    new Slider(document.getElementById("es_earth_sunlight_time_slider_container"), function(x) {
        var hm = t_to_time(x);
        sunlight_drawer.set_time(hm[0], hm[1]);
    }, undefined, 0.25);


    new Slider(document.getElementById("es_earth_sunlight_date_slider_container2"), function(x) {
        var ymd = t_to_date(x);
        sunlight_drawer2.set_date(ymd[0], ymd[1], ymd[2]);
    }, undefined);

    new Slider(document.getElementById("es_earth_sunlight_time_slider_container2"), function(x) {
        var hm = t_to_time(x);
        sunlight_drawer2.set_time(hm[0], hm[1]);
    }, undefined);



    new Slider(document.getElementById("es_earth_outline_date_slider_container"), function(x) {
        var ymd = t_to_date(x);
        outline_drawer.set_date(ymd[0], ymd[1], ymd[2]);
    }, undefined);

    new Slider(document.getElementById("es_earth_outline_time_slider_container"), function(x) {
        var hm = t_to_time(x);
        outline_drawer.set_time(hm[0], hm[1]);
    }, undefined);


    sunlight_sun_date_slider = new Slider(document.getElementById("es_earth_sunlight_sun_date_slider_container"), function(x) {
        var ymd = t_to_date(x);
        sunlight_sun_drawer.set_date(ymd[0], ymd[1], ymd[2]);
    }, undefined);

    new Slider(document.getElementById("es_earth_sunlight_sun_time_slider_container"), function(x) {
        var hm = t_to_time(x);
        sunlight_sun_drawer.set_time(hm[0], hm[1]);
    }, undefined);


    new Slider(document.getElementById("es_tropical_year_slider_container"), function(x) {
        tropical_year_drawer.set_progress(x);
    }, undefined, 0.0);

    new Slider(document.getElementById("es_kepler_slider_container"), function(x) {
        kepler_drawer.set_progress(x);
    }, undefined, 0.0);


    new Slider(document.getElementById("es_ellipse_length_slider_container"), function(x) {
        ellipse_length_drawer.set_progress(x);
    }, undefined, 0.25);

    new Slider(document.getElementById("es_ellipse_e_slider_container"), function(x) {
        ellipse_e_drawer.set_progress(x);
    }, undefined, 0.25);

    new Slider(document.getElementById("es_plane_slider_container"), function(x) {
        plane_drawer.set_progress(x);
    }, undefined, 0.0);

    new Slider(document.getElementById("es_earth_axis_precession_slider_container"), function(x) {
        precession_drawer.set_progress(x);
    }, undefined, 0.0);

    new Slider(document.getElementById("es_cosine_slider_container"), function(x) {
        var ymd = t_to_date(x);
        cosine_drawer.set_date(ymd[0], ymd[1], ymd[2]);
    }, undefined, 0.5);

    new Slider(document.getElementById("es_analemma_date_slider_container"), function(x) {
        var ymd = t_to_date(x);
        analemma_drawer.set_date(ymd[0], ymd[1], ymd[2]);
    }, undefined, 0.5);

    new Slider(document.getElementById("es_solar_noon_slider_container"), function(x) {
        solar_noon_drawer.set_progress(x);
    });
});

function switch_units() {
    metric = !metric;
    
    localStorage.setItem("global.metric", metric ? "true" : "false");

    if (metric)
        document.body.classList.remove("show_imperial");
    else
        document.body.classList.add("show_imperial");

    repaint_func();
}

function earth_rot_begin() {
    earth_rot_slider.set_value(0.0);
    earth_rot_drawer.set_time(00, 00);
}

function earth_rot_end() {
    earth_rot_slider.set_value(1.0);
    earth_rot_drawer.set_time(24, 00);
}


function year_orbit_begin() {
    orbit_slider.set_value(0.0);
    orbit_drawer.set_date(2019, 1, 1);
}

function year_orbit_end() {
    orbit_slider.set_value(1.0);
    orbit_drawer.set_date(2020, 1, 1);
}


function show_perihelion() {
    fake_orbit_slider.set_value(2.0 / 365);
    fake_orbit_drawer.set_date(2019, 1, 3);
}

function show_aphelion() {
    fake_orbit_slider.set_value((2.0 + 365 / 2) / 365);
    fake_orbit_drawer.set_date(2019, 7, 4);
}

function show_summer() {
    sunlight_sun_date_slider.set_value(172 / 365);
    sunlight_sun_drawer.set_date(2019, 6, 21);
}

function show_winter() {
    sunlight_sun_date_slider.set_value(355 / 365);
    sunlight_sun_drawer.set_date(2019, 12, 22);
}


function show_december_solstice() {
    earth_orbit_side_slider.set_value(355 / 365);
    earth_orbit_side_drawer.set_date(2019, 12, 22);
}


function show_june_solstice() {
    earth_orbit_side_slider.set_value(172 / 365);
    earth_orbit_side_drawer.set_date(2019, 6, 21);
}

function show_equinox() {
    earth_orbit_side_slider.set_value(266 / 365);
    earth_orbit_side_drawer.set_date(2019, 9, 23);
}