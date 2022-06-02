function GlassesDrawer(container, mode)
{

    var wrapper = document.createElement("div");
    wrapper.classList.add("canvas_container");

    var canvas = document.createElement("canvas");
    canvas.classList.add("alpha_coverage_canvas");
    wrapper.appendChild(canvas);
    container.appendChild(wrapper);


    var tx = 0, ty = 0;
    new Dragger(canvas,function(x,y) {
        tx += x;
        ty += y;
        draw();
    })

    this.set_mode = function (x) {
        mode = x;
        draw();
    }


    window.addEventListener("resize", on_resize, true);

    document.fonts.load("10px IBM Plex Sans").then(draw);

    var width, height, scale;

    function on_resize() {

        width = canvas.parentNode.clientWidth;
        height = canvas.parentNode.clientHeight;

        canvas.style.width = width + "px";
        canvas.style.height = height + "px";

        scale = window.devicePixelRatio || 1;
        canvas.width = width * scale;
        canvas.height = height * scale;

        draw();
    }

    var image = new Image();
    image.src = "/images/alpha_landscape.jpg";
    image.onload = function(){
      draw();
    }

    on_resize();

    function draw() {
        var ctx = canvas.getContext("2d");

        ctx.resetTransform();
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.scale(scale, scale);

        ctx.drawImage(image, 0, 0, width, height);

        ctx.save();
        ctx.translate(width/2, height/2);


        var factor = width / 600;
        ctx.scale(factor, factor);

        ctx.fillStyle = mode != "shade" ? "#FFB2E6" : "#4D4D4D";
        ctx.strokeStyle= mode != "shade" ? "#222" : "#111";


        if (mode === "rose-sover") {
            ctx.beginPath();
            ctx.ellipse(tx/factor, ty/factor, 78, 78, 0, 0, 6.283185307179586);
            ctx.globalAlpha = 0.5;
            ctx.fill();
            ctx.restore();
            ctx.strokeStyle = "#333";
            ctx.strokeRect(0.5,0.5,width-1,height-1);
            return;
        } else if (mode === "rose-glass") {
            ctx.globalCompositeOperation = "multiply";

            ctx.beginPath();
            ctx.ellipse(tx/factor, ty/factor, 78, 78, 0, 0, 6.283185307179586);
            ctx.fill();
            ctx.restore();
            ctx.strokeStyle = "#333";
            ctx.strokeRect(0.5,0.5,width-1,height-1);
            return;
        }

        ctx.translate(-487/2 + tx/factor, -229/2 + 20 + ty/factor);


        ctx.lineWidth=5;

        ctx.globalCompositeOperation = "multiply";

        ctx.beginPath();
        ctx.arc(136.252,78,75,0,6.283185307179586,false);
        ctx.closePath();
        ctx.fill();

        ctx.globalCompositeOperation = "source-over";
        ctx.stroke();

        ctx.globalCompositeOperation = "multiply";

        ctx.beginPath();
        ctx.arc(349.252,78,75,0,6.283185307179586,false);
        ctx.closePath();
        ctx.fill();

        ctx.globalCompositeOperation = "source-over";
        ctx.stroke();

        ctx.fillStyle="rgba(0,0,0,0)";

ctx.lineCap="round";
ctx.beginPath();
ctx.moveTo(61.252018,78);
ctx.bezierCurveTo(46.2793617,78,41.1857214,81.3984194,24.033268,119.384437);
ctx.stroke();

ctx.save();
ctx.transform(-1,0,0,1,887.219,0);
ctx.beginPath();
ctx.moveTo(462.21875,78);
ctx.bezierCurveTo(447.246094,78,442.152453,81.3984194,425,119.384437);
ctx.stroke();
ctx.restore();


ctx.beginPath();
ctx.moveTo(211.252018,68);
ctx.bezierCurveTo(219.436066,61.3333333,229.936066,58,242.752018,58);
ctx.bezierCurveTo(255.56797,58,266.06797,61.3333333,274.252018,68);
ctx.fill("evenodd");
ctx.stroke();


ctx.strokeStyle= mode != "shade" ? "#191919" : "#090909";
ctx.lineWidth=10;
ctx.lineCap="round";
ctx.beginPath();
ctx.moveTo(24.033268,119.384437);
ctx.bezierCurveTo(6.8808146,157.370454,-2.26360702,162.433594,12.1309242,223.472656);
ctx.stroke();

ctx.save();
ctx.transform(-1,0,0,1,943.47,0);
ctx.beginPath();
ctx.moveTo(481.252018,119.384437);
ctx.bezierCurveTo(464.099565,157.370454,454.955143,162.433594,469.349674,223.472656);
ctx.stroke();
ctx.restore();

ctx.restore();


    ctx.strokeStyle = "#333";
    ctx.strokeRect(0.5,0.5,width-1,height-1);
  
    }
}



function AlphaMul(container, mode)
{
    var wrapper = document.createElement("div");
    wrapper.classList.add("canvas_container");

    var canvas = document.createElement("canvas");
    wrapper.appendChild(canvas);
    container.appendChild(wrapper);

    a0 = 0.6;
    a1 = 0.8;
    this.set_a0 = function (x) {a0 = x; draw();}
    this.set_a1 = function (x) {a1 = x; draw();}

    window.addEventListener("resize", on_resize, true);

    document.fonts.load("22px IBM Plex Sans").then(draw);

    var width, height, scale;

    function on_resize() {

        width = canvas.parentNode.clientWidth;
        height = canvas.parentNode.clientHeight;

        canvas.style.width = width + "px";
        canvas.style.height = height + "px";

        scale = window.devicePixelRatio || 1;
        canvas.width = width * scale;
        canvas.height = height * scale;

        draw();
    }

    var image = new Image();
    image.src = "/images/alpha_landscape.jpg";
    image.onload = function(){
      draw();
    }

    on_resize();

    function draw() {
        var ctx = canvas.getContext("2d");

        ctx.resetTransform();
        ctx.fillStyle = "#000";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.scale(scale, scale);

        ctx.font = "22px IBM Plex Sans";
        ctx.textAlign = "center";
        
        ctx.save();
        ctx.translate(0, height/2);

        var g = ctx.createLinearGradient(0,-20,0,20);
g.addColorStop(0,"rgba(69, 0, 255, 0)");
g.addColorStop(0.07192,"rgba(69, 0, 255, 0.17)");
g.addColorStop(0.2097,"#A989FF");
g.addColorStop(0.321,"#FFF");
g.addColorStop(0.6819,"#FFF");
g.addColorStop(0.79513,"#B295FF");
g.addColorStop(0.92444,"#4500FF");
g.addColorStop(1,"rgba(69, 0, 255, 0)");

ctx.fillStyle=g;
ctx.fillRect(0,-20, width, 40);

var g = ctx.createLinearGradient(0,-25,0,25);
g.addColorStop(0,"#6D6D6D");
g.addColorStop(0.04771,"#B9BAB5");
g.addColorStop(0.07181,"#8D8D8D");
g.addColorStop(0.12215,"#FCFCFA");
g.addColorStop(0.31981000000000004,"#FFF");
g.addColorStop(0.38811999999999997,"#C0C0BF");
g.addColorStop(0.42183,"#3E3B3F");
g.addColorStop(0.47775,"#4B494C");
g.addColorStop(0.54603,"#4E4C4F");
g.addColorStop(0.6378699999999999,"#B5B6B5");
g.addColorStop(0.7768600000000001,"#B7B6B6");
g.addColorStop(0.8491200000000001,"#817F7F");
g.addColorStop(0.9291800000000001,"#574A4A");
g.addColorStop(1,"#222");
ctx.fillStyle=g;
ctx.strokeStyle = "#111";
ctx.fillRect(0, -25, 15, 50);
ctx.strokeRect(0, -25, 15, 50);



    ctx.fillStyle = "rgba(0,0,0," + (1 - a1) + ")";
    ctx.fillRect(width*2/3 -1, -30, width,60);

    // Safari bug...
    ctx.fillStyle = "#000";
    ctx.fillRect(0,0,1,1);

    ctx.fillStyle = "rgba(0,0,0," + (1 - a0) + ")";
    ctx.fillRect(width/3 -1, -30, width, 60);

    

    var box_w = 60;
    var box_h = 34;
    var r = 5;

    ctx.save()
    ctx.fillStyle = "#333";
    ctx.translate(width/6, -height/4-20);
    ctx.roundRect(-box_w/2, -box_h/2, box_w, box_h, r);
    ctx.fill();

    ctx.fillStyle= "#eee";
    ctx.fillText("1.00", 0, box_h/2 - 9);

    ctx.fillStyle = "#333";
    ctx.translate(width/3, 0);
    ctx.roundRect(-box_w/2, -box_h/2, box_w, box_h, r);
    ctx.fill();

    ctx.fillStyle= "#eee";
    ctx.fillText(a0.toFixed(2), 0, box_h/2 - 9);

    ctx.fillStyle = "#333";
    ctx.translate(width/3, 0);
    ctx.roundRect(-box_w/2, -box_h/2, box_w, box_h, r);
    ctx.fill();

    ctx.fillStyle= "#eee";
    ctx.fillText((a0 * a1).toFixed(2), 0, box_h/2 - 9);
    
    ctx.restore();

ctx.save();

ctx.strokeStyle = "rgba(120,120,120,0.4)";
ctx.translate(width/3, 0);
ctx.roundRect(-1,-50,3,100,1);
ctx.stroke();

ctx.translate(width/3, 0);
ctx.roundRect(-1,-50,3,100,1);
ctx.stroke();


ctx.restore();
    ctx.fillStyle = "#FF4343";
    ctx.translate(width/3, +height/4+20);
    ctx.roundRect(-box_w/2, -box_h/2, box_w, box_h, r);
    ctx.fill();

    ctx.fillStyle= "#111";
    ctx.fillText(a0.toFixed(2), 0, box_h/2 - 9);


   
    ctx.fillStyle = "#2968FF";
    ctx.translate(width/3,0);
    ctx.roundRect(-box_w/2, -box_h/2, box_w, box_h, r);
    ctx.fill();

    ctx.fillStyle= "#111";
    ctx.fillText(a1.toFixed(2), 0, box_h/2 - 9);


    ctx.restore();
    ctx.strokeStyle = "#333";
    ctx.strokeRect(0.5,0.5,width-1,height-1);
  

    }
}



function BitDepth(canvas, text)
{
    var bit_scale = 1;

    var width = canvas.parentNode.clientWidth;
    var height = canvas.parentNode.clientHeight;

    canvas.style.width = width + "px";
    canvas.style.height = height + "px";

    var scale = window.devicePixelRatio || 1;
    canvas.width = width * scale;
    canvas.height = height * scale;

    draw();

    function draw() {
        var ctx = canvas.getContext("2d");

        ctx.resetTransform();
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.scale(scale, scale);

    

        var d = Math.floor(height/8);
        var h = Math.floor(canvas.height/8);
        var offset = 50;
        var w = width - offset;

        if (text) {

            
        for (var i = 0; i < 8; i++) {
            ctx.save();
            ctx.rect(offset, i * d, w - 1, d);
            ctx.clip();

            ctx.fillStyle="black";
            ctx.font = "30px Helvetica";
            ctx.fillText("Hello World", offset + 5, 36 + i * d);
            ctx.beginPath();
            ctx.ellipse(260,d/2 + i*d,10,10, 0, 0, 2 * Math.PI);
            ctx.fill();

            ctx.beginPath();
            ctx.moveTo (290, d/2 + i * d);
            ctx.lineTo (290 + 10, d/2 + i * d - 10);
            ctx.lineTo (290 + 20, d/2 + i * d);
            ctx.lineTo (290 + 10, d/2 + i * d + 10);
            ctx.closePath();
            ctx.fill();

            ctx.beginPath();
            ctx.moveTo (330, d/2 + i * d);
            ctx.lineTo (380, d/2 + i * d + 2);
            ctx.lineTo (380, d/2 + i * d - 2);
            ctx.fill();

            ctx.restore();
            }
        }
            else {
                
                for (var k = 0; k < w; k++) {
                    ctx.fillStyle = "rgba(0,0,0," + (1 - k/(w-1)) + ")";
                    for (var i = 0; i < 8; i++) {
                        ctx.fillRect(offset + k, 5 + i * d, 1, 40);
                    }
                }
            
            }

        for (var k = 0; k < 8; k++) {

            var s  = ((1 << (k + 1)) - 1) / 255;


            var image_data = ctx.getImageData(0, h * k, canvas.width, h);

            var data = image_data.data;
            for (var i = 0; i < data.length; i += 4) {
                 data[i + 3] = Math.round(data[i + 3] * s) / s;
            }

            ctx.putImageData(image_data, 0, h * k);
        }


        ctx.lineWidth=1;

        ctx.font = "16px Helvetica";
        ctx.strokeStyle = "#ddd";

        ctx.globalCompositeOperation = "destination-over";

        ctx.fillStyle = "white";
        for (var k = 0; k < 8; k++) {
         
            ctx.fillRect(offset, 5 + k * d, w-1, 40);
        }

        ctx.globalCompositeOperation = "source-over";
        ctx.fillStyle = "#333";

        for (var k = 0; k < 8; k++) {

            ctx.fillText((k + 1) + " bit" + (k != 0? "s" : ""), 0, 30 + k * d);
            ctx.strokeRect(offset, 5 + k * d, w-1, 40);
        }
    }
}


function CoveragePlot(container, mode) {

    var pixel_size = 2.0;
    var large_pixel_size = 20.0;
    var scale, width, height;

    var sx0 = -30;
    var sy0 = -50;
    var sx1 = 30;
    var sy1 = 50;
    var sx2 = 60;
    var sy2 = -30;

    var x0, y0, x1, y1, x2, y2;

    var wrapper = document.createElement("div");
    wrapper.classList.add("canvas_container");

    var canvas = document.createElement("canvas");
    canvas.classList.add("alpha_coverage_canvas");
    wrapper.appendChild(canvas);
    container.appendChild(wrapper);


    var coverage;

    var draw_dots = function () {};

    if (mode === "basic") 
    {
        coverage = function(x, y) {
            if ((x - x0) * (y1 - y0) - (y - y0) * (x1 - x0) > 0 &&
                (x - x1) * (y2 - y1) - (y - y1) * (x2 - x1) > 0 &&
                (x - x2) * (y0 - y2) - (y - y2) * (x0 - x2) > 0)
                return 1.0;

            return 0.0;
        }

        draw_dots = function (ctx, x, y, rcx, cy) {
            var dot_size = 1.0;
            ctx.beginPath();
            ctx.ellipse(x * large_pixel_size + rcx, y * large_pixel_size + cy, dot_size, dot_size, Math.PI / 4, 0, 2 * Math.PI);
            ctx.stroke();
        }
    }else if (mode === "msaa") {
        coverage = function(x, y) {

            var c = 0.0;
            
            if ((x - 0.25 - x0) * (y1 - y0) - (y - 0.25 - y0) * (x1 - x0) > 0 &&
                (x - 0.25 - x1) * (y2 - y1) - (y - 0.25 - y1) * (x2 - x1) > 0 &&
                (x - 0.25 - x2) * (y0 - y2) - (y - 0.25 - y2) * (x0 - x2) > 0)
                c += 0.25;

            if ((x + 0.25 - x0) * (y1 - y0) - (y - 0.25 - y0) * (x1 - x0) > 0 &&
                (x + 0.25 - x1) * (y2 - y1) - (y - 0.25 - y1) * (x2 - x1) > 0 &&
                (x + 0.25 - x2) * (y0 - y2) - (y - 0.25 - y2) * (x0 - x2) > 0)
                c += 0.25;

            if ((x - 0.25 - x0) * (y1 - y0) - (y + 0.25 - y0) * (x1 - x0) > 0 &&
                (x - 0.25 - x1) * (y2 - y1) - (y + 0.25 - y1) * (x2 - x1) > 0 &&
                (x - 0.25 - x2) * (y0 - y2) - (y + 0.25 - y2) * (x0 - x2) > 0)
                c += 0.25;

            if ((x + 0.25 - x0) * (y1 - y0) - (y + 0.25 - y0) * (x1 - x0) > 0 &&
                (x + 0.25 - x1) * (y2 - y1) - (y + 0.25 - y1) * (x2 - x1) > 0 &&
                (x + 0.25 - x2) * (y0 - y2) - (y + 0.25 - y2) * (x0 - x2) > 0)
                c += 0.25;
      

            return c;
        }

        draw_dots = function (ctx, x, y, rcx, cy) {
            var dot_size = 0.75;
            ctx.beginPath();
            ctx.ellipse((x - 0.25) * large_pixel_size + rcx, (y - 0.25) * large_pixel_size + cy, dot_size, dot_size, Math.PI / 4, 0, 2 * Math.PI);
            ctx.stroke();

            ctx.beginPath();
            ctx.ellipse((x + 0.25) * large_pixel_size + rcx, (y - 0.25) * large_pixel_size + cy, dot_size, dot_size, Math.PI / 4, 0, 2 * Math.PI);
            ctx.stroke();

            ctx.beginPath();
            ctx.ellipse((x - 0.25) * large_pixel_size + rcx, (y + 0.25) * large_pixel_size + cy, dot_size, dot_size, Math.PI / 4, 0, 2 * Math.PI);
            ctx.stroke();

            ctx.beginPath();
            ctx.ellipse((x + 0.25) * large_pixel_size + rcx, (y + 0.25) * large_pixel_size + cy, dot_size, dot_size, Math.PI / 4, 0, 2 * Math.PI);
            ctx.stroke();

        }
    }
    else if (mode === "geometry") {

        function segment (x, y, p0x, p0y, p1x, p1y)
        {
            var y0 = y - 0.5;
            var x0 = x - 0.5;
            var y1 = y0 + 1.0;
            var x1 = x0 + 1.0;

            if (y0 > p1y || y1 < p0y)
                return 0.0;
    
            y0 = Math.max (y0, p0y);
            y1 = Math.min (y1, p1y);

            var h = Math.min(1, Math.max(0, y1 - y0));

            x0 -= p0x;
            x1 -= p0x;
            y0 -= p0y;
            y1 -= p0y;

            var sx = p1x - p0x;
            var sy = p1y - p0y;

            var t0 = -y0 * sx/sy + x1;
            var t1 = -y1 * sx/sy + x1;

            if (t0 < 0.0 && t1 < 0.0)
                return 0.0;


            if (t0 > 1.0 && t1 > 1.0)
                return h;

            t0 = Math.min(1, Math.max(0, t0));
            t1 = Math.min(1, Math.max(0, t1));

            var t2 = Math.min(h, Math.max(0, x1*sy/sx - y0));
            var t3 = Math.min(h, Math.max(0, x0*sy/sx - y0));

            var min_t = Math.min(t0, t1);
            var max_t = Math.max(t0, t1);

            var r = min_t * h;

            var hh = max_t - min_t;

            var ss = sx/sy > 0.0 ?(t2 + t3) : (2*h -t2 - t3);

            var tr = 0.5*ss*hh;
    
            return tr+r;
            
        }

        coverage = function(x, y) {
            if (y < y0 - 0.5 || y > y1 + 0.5 || x < x0 - 0.5 || x > x2 + 0.5)
                return 0.0;
            return segment(x, y, x0, y0, x1, y1) - segment(x, y, x2, y2, x1, y1) - segment(x, y, x0, y0, x2, y2);
        }
    }

    canvas.onmousedown = mouse_down;
    canvas.addEventListener("touchstart", genericTouchHandler(mouse_down), false);

    var move_handler = genericTouchHandler(mouse_move);

    on_resize();

    var prev_mouse_x;
    var prev_mouse_y;
    var drag_scale;

    function mouse_down(e) {

        prev_mouse_x = e.clientX;
        prev_mouse_y = e.clientY;

        var rect = container.getBoundingClientRect();

        drag_scale = prev_mouse_x < rect.left + rect.width / 2  ? 1.0/pixel_size : 1.0/large_pixel_size;

        window.addEventListener("mousemove", mouse_move, false);
        window.addEventListener("mouseup", mouse_up, false);

        window.addEventListener("touchmove", move_handler, false);
        window.addEventListener("touchend", mouse_up, false);
        window.addEventListener("touchcancel", mouse_up, false);
        return true;
    }

    function mouse_move(e) {

        var dx = (e.clientX - prev_mouse_x) * drag_scale;
        var dy = (e.clientY - prev_mouse_y) * drag_scale;
    
        x0 += dx;
        x1 += dx;
        x2 += dx;

        y0 += dy;
        y1 += dy;
        y2 += dy;

        prev_mouse_x = e.clientX;
        prev_mouse_y = e.clientY;
        draw();
    }
    function mouse_up(e) {
        window.removeEventListener("mousemove", mouse_move, false);
        window.removeEventListener("mouseup", mouse_up, false);

        window.removeEventListener("touchmove", move_handler, false);
        window.removeEventListener("touchend", mouse_up, false);
        window.removeEventListener("touchcancel", mouse_up, false);
    }

    window.addEventListener("resize", on_resize, true);

    document.fonts.load("10px IBM Plex Sans").then(draw);

    function on_resize() {


        width = canvas.parentNode.clientWidth;
        height = canvas.parentNode.clientHeight;

        var s = width/620;
        x0 = Math.round(sx0 * s);
        x1 = Math.round(sx1 * s);
        x2 = Math.round(sx2 * s);
        y0 = Math.round(sy0 * s);
        y1 = Math.round(sy1 * s);
        y2 = Math.round(sy2 * s);


        canvas.style.width = width + "px";
        canvas.style.height = height + "px";

        scale = window.devicePixelRatio || 1;
        canvas.width = width * scale;
        canvas.height = height * scale;

        draw();
    }

    function draw() {
        var ctx = canvas.getContext("2d");

        ctx.resetTransform();
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.scale(scale, scale);

        var size = height;
        var lcx = Math.floor(size /2 );
        var rcx = width - lcx;
        var cy = lcx;
        

        ctx.save();

        ctx.beginPath();
        ctx.rect(0, 0, size, size);
        ctx.clip();


    
        ctx.fillStyle = "#fff";
        ctx.fillRect(0, 0, size, size);



        min = -Math.floor(size * 0.5 / pixel_size);
        max = +Math.ceil(size * 0.5 / pixel_size);

        for (var x = min; x < max; x++) {
            for (var y = min; y < max; y++) {
                
                var c = coverage (x + 0.5, y+ 0.5);
                if (c > 0) {
                    ctx.fillStyle = "rgba(0,0,0," + c + ")";
                    ctx.fillRect(x * pixel_size + lcx, y * pixel_size + cy, pixel_size, pixel_size);
                }
                    
            }
        }

        ctx.restore();
      

        ctx.save();

        ctx.beginPath();
        ctx.rect(width - size, 0, size, size);
        ctx.clip();

        ctx.fillStyle = "#fff";
        ctx.fillRect(width - size, 0, size, size);
    
        ctx.fillStyle = "#000";

        min = -Math.floor(size * 0.5 / large_pixel_size) - 1;
        max = +Math.ceil(size * 0.5 / large_pixel_size) + 1;

        ctx.strokeStyle = "rgba(127,127,127,0.5)";

        for (var x = min; x < max; x++) {
            for (var y = min; y < max; y++) {
                
                var sx = x + 0.5;
                var sy = y + 0.5;
                var c = coverage (sx, sy);
                if (c > 0) {
                    ctx.fillStyle = "rgba(0,0,0," + c + ")";
                    ctx.fillRect(x * large_pixel_size + rcx, y * large_pixel_size + cy, large_pixel_size, large_pixel_size);
                }
                
                draw_dots (ctx, sx, sy, rcx, cy);
            }
        }

        ctx.fillStyle = "rgba(127,127,127,0.2)";

        for (var x = min; x < max; x++) {
            ctx.fillRect(x * large_pixel_size + rcx - 0.5, 0, 1, height);
        }
      
        for (var y = min; y < max; y++) {
            ctx.fillRect(rcx - size/2, y * large_pixel_size + cy - 0.5, width, 1);
        }

        ctx.strokeStyle = "rgba(41, 104,255,0.8)";
        ctx.lineWidth=2.0;

        ctx.beginPath();
        ctx.moveTo(x0 * large_pixel_size + rcx, y0 * large_pixel_size + cy);
        ctx.lineTo(x1 * large_pixel_size + rcx, y1 * large_pixel_size + cy);
        ctx.lineTo(x2 * large_pixel_size + rcx, y2 * large_pixel_size + cy);
        ctx.closePath();
        ctx.stroke();


        var R = size/2.0 - 10;
        var r = R  * pixel_size / large_pixel_size;


        ctx.globalCompositeOperation = "destination-in";

        ctx.fillStyle="#000";
        ctx.beginPath();
        ctx.ellipse(rcx, cy, R, R, 0, 0, 2 * Math.PI);
        ctx.fill();
        ctx.restore();


        ctx.strokeStyle = "rgba(127,127,127,1.0)";

    
        ctx.stroke();


    
        ctx.beginPath();
        ctx.ellipse(lcx,cy,  r, r, 0, 0, 2 * Math.PI);
        ctx.stroke();
 
        ctx.strokeStyle = "rgba(127,127,127,0.5)";

        ctx.strokeRect(0.5,0.5,size-1,size-1);

        var d = rcx - lcx;
        var cos = (R - r) / d;
        var sin = Math.sqrt(1 - cos * cos);

        ctx.beginPath();
        ctx.moveTo(rcx - cos * R, cy + R * sin);
        ctx.lineTo(lcx - cos * r, cy + r * sin);
        ctx.stroke();


        ctx.beginPath();
        ctx.moveTo(rcx - cos * R, cy - R * sin);
        ctx.lineTo(lcx - cos * r, cy - r * sin);
        ctx.stroke();
    }



    function genericTouchHandler(f) {
        return function (e) {
            if (e.touches.length == 1) {
                if (f(e.touches[0])) {
                    e.preventDefault();
                    return false;
                }
            }
        }
    }
}



function TextureSampler(container, mode)
{
    var wrapper = document.createElement("div");
    wrapper.classList.add("canvas_container");

    var canvas = document.createElement("canvas");
    wrapper.appendChild(canvas);
    container.appendChild(wrapper);

    window.addEventListener("resize", on_resize, true);

    var width, height, scale;

    var rot = 0.0;

    // var tx = 0, ty = 0;
    // new Dragger(canvas,function(x,y) {
    //     tx += -x;
    //     ty += -y;
    //     draw();
    // })

    var fs = [1.0, 0.2, 0.2, 1];
    var bg = [1.0, 0.2, 0.2, 0];
    var sd = [0.1, 0.8, 0.1, 0];
    var fg = [0.1607, 0.407, 1.0, 1];
    var ff = [0.1607, 0.407, 1.0, 0];
    var fh = [0, 0, 0, 0];

    var image = [
        [fh, fh, fh, fh, fh, fh, fh, fh, fh],
        [ff, fg, fg, fg, fg, fg, fg, fg, ff],
        [ff, fg, fg, fg, fg, fg, fg, fg, ff],
        [ff, fg, fg, fg, fg, fg, fg, fg, ff],
        [bg, bg, bg, bg, bg, bg, bg, bg, bg],
        [bg, fs, fs, fs, fs, fs, fs, fs, bg],
        [bg, fs, fs, fs, fs, fs, fs, fs, bg],
        [bg, fs, fs, fs, fs, fs, fs, fs, bg],
        [sd, sd, sd, sd, sd, sd, sd, sd, sd],
    ]

    var size = 9;
    var left_size = 17;

    document.fonts.load("10px IBM Plex Sans").then(draw);

    var sample = function(x, y) {
        if (x < 0.5) x = 0.5;
        if (x > size - 0.5) x = size - 0.5;

        if (y < 0.5) y = 0.5;
        if (y > size - 0.5) y = size - 0.5;
        
        // x -= 0.5;
        // y -= 0.5;


        if (mode === "nearest") {
            return image[Math.floor(y)][Math.floor(x)];
        }

        if (mode ==="bilinear_bad" || mode === "bilinear") {
            var fx = Math.floor(x - 0.5);
            var fy = Math.floor(y - 0.5);
            var fx1 =Math.min(size - 1, fx + 1);
            var fy1 =Math.min(size - 1, fy + 1);

            fx = Math.max(0, fx);
            fy = Math.max(0, fy);

            var s = x - 0.5 - fx;
            var t = y - 0.5 - fy;

            var color = [0,0,0,0];

            for (var i = 0; i < 4; i++) {

                var c00 = image[fy][fx][i];
                var c01 = image[fy][fx1][i];
                var c10 = image[fy1][fx][i];
                var c11 = image[fy1][fx1][i];

                if (mode === "bilinear" && i != 3) {
                    c00 *= image[fy][fx][3];
                    c01 *= image[fy][fx1][3];
                    c10 *= image[fy1][fx][3];
                    c11 *= image[fy1][fx1][3];
                }

                var c0 = c00*(1-s) + c01*(s);
                var c1 = c10*(1-s) + c11*(s);

                color[i] = c0*(1-t) + c1*t;
            }

            if (mode === "bilinear" && color[3] != 0) {
                // canvas takes unpremultiplied colors...
                color[0] /= color[3];
                color[1] /= color[3];
                color[2] /= color[3];
            }

            return color;
        }

        return "red";
    }

    this.set_rot = function (x) {
        rot = -x;
        draw();
    }

    function on_resize() {

        width = canvas.parentNode.clientWidth;
        height = canvas.parentNode.clientHeight;

        canvas.style.width = width + "px";
        canvas.style.height = height + "px";

        scale = window.devicePixelRatio || 1;
        canvas.width = width * scale;
        canvas.height = height * scale;

        draw();
    }

    on_resize();

    function draw() {
        var ctx = canvas.getContext("2d");

        ctx.resetTransform();
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.scale(scale, scale);
        // ctx.fillRect(0,0,width,height);
        ctx.translate(0, -10);

        ctx.font = "8px IBM Plex Sans";
        ctx.textAlign = "center";

        var pixel_size = Math.floor(width / 34.0);

        ctx.save();

        ctx.translate (Math.floor(width/4) + pixel_size *2, height/2);

        ctx.strokeStyle = "#333";
        ctx.strokeRect(0.5 - pixel_size*left_size/2,
                       0.5 - pixel_size*left_size/2,
                       pixel_size*left_size,
                       pixel_size*left_size);

        var r = 1.0;


        var sel_t = [1, 2];
        var sel_d = [5, 6];

        for (var x = 0; x < left_size; x++) {
            for (var y = 0; y < left_size; y++) {
                var s = x - left_size/2 + 0.5;
                var t = y - left_size/2 + 0.5;

                // s += tx/pixel_size;
                // t += ty/pixel_size;
                var tt = t;

                t = Math.cos(-rot)*tt + -Math.sin(-rot)*s;
                s = Math.sin(-rot)*tt + Math.cos(-rot)*s;

                s += size/2;
                t += size/2;
                
                var color = sample(s,t);

                ctx.fillStyle = "rgba(" + color[0]*255 + "," + color[1]*255 + "," + color[2]*255 + "," + color[3] + ")";
                ctx.fillRect(pixel_size * (x - left_size/2), pixel_size * (y - left_size/2), pixel_size, pixel_size)
            }
        }

        ctx.fillStyle="rgba(0,0,0,0.05)"

        for (var x = 0; x <= left_size; x++) {
            // ctx.beginPath();
            // ctx.moveTo(pixel_size * (x - left_size/2), -left_size/2*pixel_size - pixel_size/8);
            // ctx.lineTo(pixel_size * (x - left_size/2), left_size/2*pixel_size + pixel_size/8);
            // ctx.stroke();

            // ctx.beginPath();
            // ctx.moveTo(pixel_size * (-left_size/2)- pixel_size/8, (x -left_size/2)*pixel_size);
            // ctx.lineTo(pixel_size * (+left_size/2)+ pixel_size/8, (x -left_size/2)*pixel_size);
            // ctx.stroke();

            ctx.fillRect(pixel_size * (x - left_size/2) - 0.5, -left_size/2*pixel_size - 0.5, 1, left_size*pixel_size);
            ctx.fillRect(pixel_size * (-left_size/2) - 0.5, (x -left_size/2)*pixel_size - 0.5, left_size*pixel_size, 1);
        }
        
        ctx.fillStyle="rgba(0,0,0,0.3)";
        ctx.strokeStyle="rgba(0,0,0,0.15)";

        var i = 0;
        for (var y = 0; y < left_size; y++) {
            for (var x = 0; x < left_size; x++) {
                ctx.save ();
                ctx.translate (pixel_size * (x - left_size/2 + 0.5), 
                               pixel_size * (y - left_size/2 + 0.5));
      
    
                // ctx.fillText((i++).toString(), 0, -4);


                ctx.beginPath();
                ctx.ellipse(0, 
                            0, r, r,
                            0, 0, 6.283185307179586);
                
                ctx.stroke(); 
                ctx.restore()
            }
        }

        ctx.strokeStyle="rgba(0,0,0,0.5)"
        ctx.lineWidth = 2;
        ctx.strokeRect(pixel_size * (sel_d[0] - left_size/2),
                       pixel_size * (sel_d[1] - left_size/2),
                       pixel_size,
                       pixel_size);
        
        ctx.rotate(-rot);
        // ctx.translate(-tx, -ty);

        ctx.strokeStyle = "rgba(255,67,67,0.3)";
        ctx.lineWidth = 2.0;
        ctx.strokeRect(-pixel_size*size/2, -pixel_size*size/2, pixel_size*size, pixel_size*size);

        ctx.strokeStyle="rgba(0,0,0,0.6)"
        ctx.lineWidth = 1;
        ctx.strokeRect(pixel_size * (sel_t[0] - size/2) + 1,
                       pixel_size * (sel_t[1] - size/2) + 1,
                       pixel_size - 2,
                       pixel_size - 2);

        ctx.strokeRect(pixel_size * (sel_t[0] - size/2) - 1,
                       pixel_size * (sel_t[1] - size/2) - 1,
                       pixel_size + 2,
                       pixel_size + 2);

        
        ctx.restore();

        ctx.save();
        ctx.translate (Math.floor(width*3/4) + pixel_size * 2, height/4);

        for (var x = 0; x < size; x++) {
            for (var y = 0; y < size; y++) {
                var s = x + 0.5;
                var t = y + 0.5;                
                var color = sample(s,t);

                ctx.fillStyle = "rgba(" + color[0]*255 + "," + color[1]*255 + "," + color[2]*255 + ", 1.0)";
                ctx.fillRect(pixel_size * (x - size/2), pixel_size * (y - size/2), pixel_size, pixel_size)
            }
        }

        for (var x = 0; x <= size; x++) {
            ctx.fillStyle="rgba(255,255,255,0.05)"
            ctx.fillRect(pixel_size * (x - size/2) - 0.5, -size/2*pixel_size - 0.5, 1, size*pixel_size);
            ctx.fillRect(pixel_size * (-size/2) - 0.5, (x -size/2)*pixel_size - 0.5, size*pixel_size, 1);

        }


        ctx.beginPath();
        ctx.rect(pixel_size * (-size/2), 
                pixel_size * (-size/2),
                pixel_size * size,
                pixel_size * size);

        ctx.strokeStyle = "#979797";
        ctx.stroke();

        ctx.strokeStyle="rgba(0,0,0,0.6)"
        ctx.lineWidth = 1;
        ctx.strokeRect(pixel_size * (sel_t[0] - size/2) + 1,
                       pixel_size * (sel_t[1] - size/2) + 1,
                       pixel_size - 2,
                       pixel_size - 2);

        ctx.strokeRect(pixel_size * (sel_t[0] - size/2) - 1,
                       pixel_size * (sel_t[1] - size/2) - 1,
                       pixel_size + 2,
                       pixel_size + 2);

        ctx.save();

        ctx.clip();

        ctx.rotate(rot);
        // ctx.translate(tx, ty);

        ctx.strokeStyle="rgba(237,237,237,0.4)";


        for (var x = 0; x < left_size; x++) {
            for (var y = 0; y < left_size; y++) {
                ctx.beginPath();
                ctx.ellipse(pixel_size * (x - left_size/2 + 0.5), 
                            pixel_size * (y - left_size/2 + 0.5), r, r,
                            0, 0, 6.283185307179586);
                
                ctx.stroke();        
            }
        }

        ctx.strokeStyle="rgba(0,0,0,0.4)"
        ctx.lineWidth = 2;
        ctx.strokeRect(pixel_size * (sel_d[0] - left_size/2),
                       pixel_size * (sel_d[1] - left_size/2),
                       pixel_size,
                       pixel_size);
        
        
        ctx.restore();
        ctx.translate(0,pixel_size * size/2 + 10.0);
        draw_rgb(ctx);

        ctx.restore();


        // alpha

        ctx.save();
        ctx.translate (Math.floor(width*3/4) + pixel_size * 2, height*3/4);

        for (var x = 0; x < size; x++) {
            for (var y = 0; y < size; y++) {
                var s = x + 0.5;
                var t = y + 0.5;                
                var color = sample(s,t);

            
                ctx.fillStyle = "rgba(" + color[3]*255 + "," + color[3]*255 + "," + color[3]*255 + ",1.0)";
                ctx.fillRect(pixel_size * (x - size/2), pixel_size * (y - size/2), pixel_size, pixel_size)
            }
        }

        for (var x = 0; x <= size; x++) {
            ctx.fillStyle="rgba(127,127,127,0.05)"
            ctx.fillRect(pixel_size * (x - size/2) - 0.5, -size/2*pixel_size - 0.5, 1, size*pixel_size);
            ctx.fillRect(pixel_size * (-size/2) - 0.5, (x -size/2)*pixel_size - 0.5, size*pixel_size, 1);

        }

        ctx.strokeStyle="rgba(0,0,0,0.6)"
        ctx.lineWidth = 1;
        ctx.strokeRect(pixel_size * (sel_t[0] - size/2) + 1,
                       pixel_size * (sel_t[1] - size/2) + 1,
                       pixel_size - 2,
                       pixel_size - 2);

        ctx.strokeRect(pixel_size * (sel_t[0] - size/2) - 1,
                       pixel_size * (sel_t[1] - size/2) - 1,
                       pixel_size + 2,
                       pixel_size + 2);


        ctx.beginPath();
        ctx.rect(pixel_size * (-size/2), 
                pixel_size * (-size/2),
                pixel_size * size,
                pixel_size * size);

                ctx.save();
        ctx.clip();

        ctx.rotate(rot);
        // ctx.translate(tx, ty);

        ctx.strokeStyle="rgba(157,157,157,0.6)";


        for (var x = 0; x < left_size; x++) {
            for (var y = 0; y < left_size; y++) {
                ctx.beginPath();
                ctx.ellipse(pixel_size * (x - left_size/2 + 0.5), 
                            pixel_size * (y - left_size/2 + 0.5), r, r,
                            0, 0, 6.283185307179586);
                
                ctx.stroke();        
            }
        }

        ctx.strokeStyle="rgba(127,127,127,0.6)"
        ctx.lineWidth = 2;
        ctx.strokeRect(pixel_size * (sel_d[0] - left_size/2),
                       pixel_size * (sel_d[1] - left_size/2),
                       pixel_size,
                       pixel_size);
        

        ctx.restore();
        ctx.translate(0,pixel_size * size/2 + 10.0);
        draw_alpha(ctx);
        
        ctx.restore();


   
    }

    function draw_rgb (ctx) {

        ctx.translate(-25,0);
        ctx.save();
        
ctx.fillStyle="#E74C3C";
ctx.strokeStyle="rgba(0, 0, 0, 0.146)";
ctx.transform(1,0,0,-1,0,14);
ctx.beginPath();
ctx.moveTo(4,1);
ctx.lineTo(10,1);
ctx.bezierCurveTo(11.65685424949238,1,13,2.3431457505076194,13,4);
ctx.lineTo(13,10);
ctx.bezierCurveTo(13,11.65685424949238,11.65685424949238,13,10,13);
ctx.lineTo(4,13);
ctx.bezierCurveTo(2.3431457505076194,13,1,11.65685424949238,1,10);
ctx.lineTo(1,4);
ctx.bezierCurveTo(1,2.3431457505076194,2.3431457505076194,1,4,1);
ctx.closePath();
ctx.fill("evenodd");
ctx.stroke();
ctx.restore();
ctx.save();
ctx.fillStyle="#5D76E8";
ctx.strokeStyle="rgba(0, 0, 0, 0.146)";
ctx.transform(1,0,0,-1,0,14);
ctx.beginPath();
ctx.moveTo(40,1);
ctx.lineTo(46,1);
ctx.bezierCurveTo(47.65685424949238,1,49,2.3431457505076194,49,4);
ctx.lineTo(49,10);
ctx.bezierCurveTo(49,11.65685424949238,47.65685424949238,13,46,13);
ctx.lineTo(40,13);
ctx.bezierCurveTo(38.34314575050762,13,37,11.65685424949238,37,10);
ctx.lineTo(37,4);
ctx.bezierCurveTo(37,2.3431457505076194,38.34314575050762,1,40,1);
ctx.closePath();
ctx.fill("evenodd");
ctx.stroke();
ctx.restore();
ctx.save();
ctx.fillStyle="#35C25B";
ctx.strokeStyle="rgba(0, 0, 0, 0.146)";
ctx.transform(1,0,0,-1,0,14);
ctx.beginPath();
ctx.moveTo(22,1);
ctx.lineTo(28,1);
ctx.bezierCurveTo(29.65685424949238,1,31,2.3431457505076194,31,4);
ctx.lineTo(31,10);
ctx.bezierCurveTo(31,11.65685424949238,29.65685424949238,13,28,13);
ctx.lineTo(22,13);
ctx.bezierCurveTo(20.34314575050762,13,19,11.65685424949238,19,10);
ctx.lineTo(19,4);
ctx.bezierCurveTo(19,2.3431457505076194,20.34314575050762,1,22,1);
ctx.closePath();
ctx.fill("evenodd");
ctx.stroke();
ctx.restore();
    }

    function draw_alpha (ctx) {

        ctx.translate(-25,0);

        ctx.transform(1,0,0,-1,0,14);
ctx.beginPath();
ctx.moveTo(22,1);
ctx.lineTo(28,1);
ctx.bezierCurveTo(29.65685424949238,1,31,2.3431457505076194,31,4);
ctx.lineTo(31,10);
ctx.bezierCurveTo(31,11.65685424949238,29.65685424949238,13,28,13);
ctx.lineTo(22,13);
ctx.bezierCurveTo(20.34314575050762,13,19,11.65685424949238,19,10);
ctx.lineTo(19,4);
ctx.bezierCurveTo(19,2.3431457505076194,20.34314575050762,1,22,1);
ctx.closePath();
ctx.strokeStyle="rgba(0,0,0,0.14)";
ctx.stroke();

ctx.save();
ctx.clip();


ctx.fillStyle = "#D8D8D8";
ctx.fillRect(19,1,4,4);
ctx.fillRect(27,1,4,4);
ctx.fillRect(23,5,4,4);
ctx.fillRect(19,9,4,4);
ctx.fillRect(27,9,4,4);
ctx.restore();
ctx.strokeStyle="rgba(0,0,0,0.14)";
ctx.stroke();
    }
}





function AlphaLerper(container) {
    var side_pad = 8.0;
    var pane_height = 50.0;
    var pane_offset = 30.0;
    var pane_pad = 20.0;
    var bottom_pad = 30.0;

    var scale, width, height;

    var wrapper = document.createElement("div");
    wrapper.classList.add("canvas_container");

    var canvas = document.createElement("canvas");
    wrapper.appendChild(canvas);
    container.appendChild(wrapper);

    var divs = [];
    
    for (var i = 0; i < 3; i++) {
        var div = document.createElement("div");
        div.classList.add("alpha_lerp_pane");
        divs.push(div);
        container.appendChild(div);
    }

    divs[0].innerHTML = "D";
    divs[1].innerHTML = "R";
    divs[2].innerHTML = "S";


    var s = [0.61, 0.35, 0.71];
    var d = [1.0, 0.87, 0.34];
    var a = 0.4;


 


 
    this.set_a = function (x) {
        a = x;
        draw();
    }

    on_resize();


  
    
    window.addEventListener("resize", on_resize, true);
    window.addEventListener("load", on_resize, true);

    document.fonts.load("10px IBM Plex Sans").then(draw);

    function on_resize() {

        width = Math.floor(canvas.parentNode.clientWidth/3)*3;
        height = canvas.parentNode.clientHeight;

        canvas.style.width = width + "px";
        canvas.style.height = height + "px";

        scale = window.devicePixelRatio || 1;
        canvas.width = width * scale;
        canvas.height = height * scale;

        pane_width = Math.floor((width - (side_pad * 2) - (pane_pad * 2))/3);

        for (var i = 0; i < divs.length; i++) {
            divs[i].style.left = (side_pad + (pane_width + pane_pad) * i) + "px";
            divs[i].style.width = pane_width + "px";
            divs[i].style.height = pane_height + "px";    
        }

        draw();
    }

    function draw() {

        var m = [s[0]*a + d[0]*(1-a), s[1]*a + d[1]*(1-a), s[2]*a + d[2]*(1-a)];

        divs[0].style.background = "rgb(" + Math.round(d[0]*255) + "," + 
                                            Math.round(d[1]*255) + "," +
                                            Math.round(d[2]*255) + ")";

        divs[1].style.background = "rgb(" + Math.round(m[0]*255) + "," + 
                                            Math.round(m[1]*255) + "," +
                                            Math.round(m[2]*255) + ")";

        divs[2].style.background = "rgb(" + Math.round(s[0]*255) + "," + 
                                            Math.round(s[1]*255) + "," +
                                            Math.round(s[2]*255) + ")";

        var ctx = canvas.getContext("2d");

        ctx.resetTransform();
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.scale(scale, scale);

        var h = Math.floor((height - pane_height - pane_offset - bottom_pad)/10)*10;
        var w = width - side_pad * 2;

        
        ctx.save();

        ctx.translate(side_pad + 0.5, pane_height + pane_offset);

        var styles = ["#E74C3C", "#2ECC71", "#3498DB"];
        ctx.lineWidth=2.0;

        for (var i = 0; i < 3; i++) {
            ctx.strokeStyle = styles[i];
            ctx.beginPath();
            ctx.moveTo(0,h*(1 - d[i]));
            ctx.lineTo(w,h*(1 - s[i]));
            ctx.stroke();
        }

        var r = 2;
        var R = 4;
        ctx.globalCompositeOperation="destination-out";

        for (var i = 0; i < 3; i++) {

        ctx.beginPath();
        ctx.ellipse(w*a, ((1 - s[i])*a + (1 - d[i])*(1-a))*h, R, R, 0, 0, 6.283185307179586);
        ctx.fill()
        }

        ctx.globalCompositeOperation="source-over";

        ctx.lineWidth=1.0;

        ctx.strokeStyle = "#777";
        ctx.strokeRect(0,0,width - side_pad*2, height-1 - pane_height - pane_offset - bottom_pad);
        ctx.lineWidth=2.0;

        for (var i = 0; i < 3; i++) {
            ctx.fillStyle = styles[i];
            ctx.beginPath();
            ctx.ellipse(0, (1 - d[i])*h, r, r, 0, 0, 6.283185307179586);
            ctx.fill()

            ctx.beginPath();
            ctx.ellipse(w, (1 - s[i])*h, r, r, 0, 0, 6.283185307179586);
            ctx.fill()
            }


        for (var i = 0; i < 3; i++) {
            ctx.strokeStyle = styles[i];
            ctx.beginPath();
            ctx.ellipse( w*a, ((1 - s[i])*a + (1 - d[i])*(1-a))*h, R, R, 0, 0, 6.283185307179586);
            ctx.stroke()
            }

            ctx.lineWidth = 1.0;
            ctx.strokeStyle = "#ddd";

            ctx.globalCompositeOperation="destination-over";
            for (var i = 1; i < 10; i++) {
                ctx.beginPath();
                ctx.moveTo(0,i * h/10);
                ctx.lineTo(w,i * h/10);
                ctx.stroke();
            }

            ctx.beginPath();
            ctx.moveTo(a*w,0);
            ctx.lineTo(a*w,h);
            ctx.stroke();


            ctx.fillStyle = "#333";
            ctx.font = "19.2px IBM Plex Sans";
            ctx.textAlign = "center";
            ctx.fillText("source alpha = " + a.toFixed(2), w/2, h + 28);

            

            ctx.lineWidth = 2.0;
            ctx.strokeStyle = "#555";
            ctx.lineCap = "round";


        ctx.beginPath();
        ctx.moveTo(0.0, 0.0);
        ctx.bezierCurveTo(0.0, -pane_offset*2/3, 
            pane_width/2, -pane_offset*1/3,
            pane_width/2, -pane_offset);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(a*w, 0.0);
        ctx.bezierCurveTo(a*w, -pane_offset*2/3, 
            pane_width/2 + pane_width + pane_pad + 0.5, -pane_offset*1/3,
            pane_width/2 + pane_width + pane_pad + 0.5, -pane_offset);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(w, 0.0);
        ctx.bezierCurveTo(w, -pane_offset*2/3, 
            w - pane_width/2, -pane_offset*1/3,
            w - pane_width/2, -pane_offset);
        ctx.stroke();


     
        ctx.restore();
    }
}



function PorterDuffer(container) {

    var scale, width, height;

    var mode = "source-over";

    var wrapper = document.createElement("div");
    wrapper.classList.add("canvas_container");

    var canvas = document.createElement("canvas");
    canvas.classList.add("alpha_pd_canvas");
    wrapper.appendChild(canvas);
    container.appendChild(wrapper);

    canvas.onmousedown = mouse_down;
    canvas.addEventListener("touchstart", genericTouchHandler(mouse_down), false);

    var move_handler = genericTouchHandler(mouse_move);

    this.set_mode = function (x) {
        mode = x;
        draw();
    }

    on_resize();

    var prev_mouse_x;
    var prev_mouse_y;
    var drag_scale;
    var tx = 0, ty = 0;

    function mouse_down(e) {

        prev_mouse_x = e.clientX;
        prev_mouse_y = e.clientY;

        var rect = container.getBoundingClientRect();

        drag_scale = prev_mouse_x < rect.left + rect.width / 2  ? 1.0 : 1.0/16.0;

        window.addEventListener("mousemove", mouse_move, false);
        window.addEventListener("mouseup", mouse_up, false);

        window.addEventListener("touchmove", move_handler, false);
        window.addEventListener("touchend", mouse_up, false);
        window.addEventListener("touchcancel", mouse_up, false);
        return true;
    }

    function mouse_move(e) {
        tx += (e.clientX - prev_mouse_x);
        ty += (e.clientY - prev_mouse_y);
    
        prev_mouse_x = e.clientX;
        prev_mouse_y = e.clientY;
        draw();
    }
    function mouse_up(e) {
        window.removeEventListener("mousemove", mouse_move, false);
        window.removeEventListener("mouseup", mouse_up, false);

        window.removeEventListener("touchmove", move_handler, false);
        window.removeEventListener("touchend", mouse_up, false);
        window.removeEventListener("touchcancel", mouse_up, false);
    }

    window.addEventListener("resize", on_resize, true);

    function on_resize() {

        width = canvas.parentNode.clientWidth;
        height = canvas.parentNode.clientHeight;

        canvas.style.width = width + "px";
        canvas.style.height = height + "px";

        scale = window.devicePixelRatio || 1;
        canvas.width = width * scale;
        canvas.height = height * scale;

        draw();
    }

    function draw_club(ctx) {

        ctx.beginPath();
        ctx.moveTo(67.24,105.48);
        ctx.bezierCurveTo(61.84,104.76,57.16,104.52,51.4,104.52);
        ctx.bezierCurveTo(45.4,104.52,41.32,104.76,36.64,105.48);
        ctx.bezierCurveTo(42.28,97.44,44.08,93.84,45.88,88.08);
        ctx.bezierCurveTo(47.44,82.92,48.28,75.48,48.28,67.32);
        ctx.bezierCurveTo(48.28,65.52,47.92,64.68,47.08,64.68);
        ctx.bezierCurveTo(46.12,64.68,46.12,64.8,45.28,69.24);
        ctx.bezierCurveTo(44.44,73.68,41.68,78.24,37.72,81.96);
        ctx.bezierCurveTo(33.76,85.8,28.6,87.72,22.48,87.72);
        ctx.bezierCurveTo(10.48,87.72,0.4,77.04,0.4,64.32);
        ctx.bezierCurveTo(0.4,51,9.88,41.52,22.96,41.52);
        ctx.bezierCurveTo(28.84,41.52,32.8,42.96,38.32,47.4);
        ctx.bezierCurveTo(39.52,48.36,40,48.6,40.48,48.6);
        ctx.bezierCurveTo(41.2,48.6,41.8,48,41.8,47.28);
        ctx.bezierCurveTo(41.8,46.68,41.8,46.68,37.12,42);
        ctx.bezierCurveTo(32.44,37.44,29.32,29.88,29.32,23.4);
        ctx.bezierCurveTo(29.32,18.96,30.64,14.4,32.8,10.92);
        ctx.bezierCurveTo(36.76,4.8,44.32,0.6,51.76,0.6);
        ctx.bezierCurveTo(64.24,0.6,74.56,11.04,74.56,23.76);
        ctx.bezierCurveTo(74.56,30,72.4,35.64,67.72,41.04);
        ctx.bezierCurveTo(66.4,42.72,64.96,44.16,63.64,45.24);
        ctx.bezierCurveTo(62.56,46.08,62.08,46.8,62.08,47.4);
        ctx.bezierCurveTo(62.08,48,62.68,48.48,63.28,48.48);
        ctx.bezierCurveTo(64,48.48,64.48,48.24,65.68,47.04);
        ctx.bezierCurveTo(70,42.96,73.84,41.52,80.08,41.52);
        ctx.bezierCurveTo(93.4,41.52,103.6,51,103.6,63.36);
        ctx.bezierCurveTo(103.6,70.32,101.44,76.32,97.24,80.76);
        ctx.bezierCurveTo(93.04,85.2,86.68,87.96,80.68,87.96);
        ctx.bezierCurveTo(72.16,87.96,64.96,83.16,60.64,74.76);
        ctx.bezierCurveTo(59.2,72,58.96,71.4,58,66.36);
        ctx.bezierCurveTo(57.76,65.28,57.28,64.68,56.68,64.68);
        ctx.bezierCurveTo(55.72,64.68,55.6,65.4,55.6,70.08);
        ctx.bezierCurveTo(55.6,77.16,57.04,86.52,58.84,91.2);
        ctx.bezierCurveTo(60.64,96.12,63.04,99.96,67.24,105.48);
        ctx.closePath();
        ctx.fill();
    }

    function draw_heart(ctx) {

        ctx.beginPath();
        ctx.moveTo(52,106.8);
        ctx.bezierCurveTo(31.36,85.56,29.2,83.16,21.28,72.6);
        ctx.bezierCurveTo(9.52,57.12,3.64,43.2,3.64,31.44);
        ctx.bezierCurveTo(3.64,24.48,5.92,17.04,9.64,11.76);
        ctx.bezierCurveTo(14.44,5.04,21.04,1.8,30.04,1.8);
        ctx.bezierCurveTo(35.2,1.8,39.04,2.88,42.16,5.04);
        ctx.bezierCurveTo(46.24,7.92,49.36,12.96,50.32,18.36);
        ctx.bezierCurveTo(51.16,22.32,51.28,22.68,52,22.68);
        ctx.bezierCurveTo(52.72,22.68,53.08,21.96,53.68,18.36);
        ctx.bezierCurveTo(54.76,12.48,58.24,7.08,62.68,4.56);
        ctx.bezierCurveTo(65.56,3,70.6,1.8,74.92,1.8);
        ctx.bezierCurveTo(79.96,1.8,85,3.48,89.2,6.36);
        ctx.bezierCurveTo(96.52,11.4,100.36,20.16,100.36,31.68);
        ctx.bezierCurveTo(100.36,40.68,98.2,48.24,93.04,57.36);
        ctx.bezierCurveTo(87.04,68.04,79.36,78,67.6,90.36);
        ctx.bezierCurveTo(54.88,103.8,54.88,103.8,52,106.8);
        ctx.closePath();
        ctx.fill();

    }

    function draw() {
        var ctx = canvas.getContext("2d");

        ctx.resetTransform();
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.scale(scale, scale);

        ctx.strokeStyle ="#888";
        ctx.save();

        ctx.translate(width/2,height/2);

        var factor = height/160.0;
        ctx.scale(factor, factor); 

        ctx.translate(-52,-54);

        
        ctx.fillStyle= "#111";

        if (mode != "clear")
        draw_club(ctx);


        ctx.save();
        ctx.globalCompositeOperation = mode;

        ctx.translate(tx / factor, ty / factor);

        ctx.fillStyle= "red";

        if (mode != "destination" && mode != "clear")
            draw_heart(ctx);
        ctx.restore();
        ctx.restore();

        ctx.save ();

        var minimap_scale=0.2;

        ctx.fillStyle = "#fff";

        ctx.scale(minimap_scale, minimap_scale);
        ctx.lineWidth=1/minimap_scale;
        ctx.fillRect(-2.5,-2.5,width+1, height+1);
        ctx.strokeRect(-2.5,-2.5,width+1, height+1);

        ctx.beginPath();
        ctx.rect(0, 0, width, height);
        ctx.clip();

        ctx.translate(width*0.5,height*0.5);
        ctx.scale(factor, factor); 

        ctx.translate(-52,-54);
        ctx.fillStyle= "#111";
        draw_club(ctx);
        ctx.translate(tx / factor, ty / factor);
        ctx.fillStyle= "red";
        draw_heart(ctx);
        ctx.restore();

        ctx.globalCompositeOperation = "destination-over";

        ctx.save();
        var grid_size = 30.0;

        ctx.translate(width/2 - grid_size/2,height/2 - grid_size/2);


        ctx.fillStyle = "#eee";
        var flip_flop = false;
        for (var x = -Math.ceil(width/grid_size)*grid_size; x <= width/2 + grid_size; x += grid_size)
        {
            for (var y = -Math.ceil(height/grid_size)*grid_size; y <= height/2 + grid_size; y += 2*grid_size)
            {
                ctx.fillRect(x, y + (flip_flop ? grid_size : 0), grid_size, grid_size);
            }
            flip_flop = !flip_flop;
        }

        ctx.restore();

        ctx.fillStyle = "#fff";

        ctx.fillRect(0, 0, width, height);

        ctx.globalCompositeOperation = "source-over";

        ctx.strokeRect(0.5,0.5,width-1, height-1);
    }



    function genericTouchHandler(f) {
        return function (e) {
            if (e.touches.length == 1) {
                if (f(e.touches[0])) {
                    e.preventDefault();
                    return false;
                }
            }
        }
    }
}




function PDExample(container) {

    var scale, width, height;

    var wrapper = document.createElement("div");
    wrapper.classList.add("canvas_container");

    var canvas = document.createElement("canvas");
    canvas.classList.add("alpha_pd_example_canvas");
    wrapper.appendChild(canvas);
    container.appendChild(wrapper);

    var step = 0;
    var debug = true;

    this.set_step = function (x) {
        step = x;
        draw ();
    };



    on_resize();

    function on_resize() {

        width = canvas.parentNode.clientWidth;
        height = canvas.parentNode.clientHeight;

        canvas.style.width = width + "px";
        canvas.style.height = height + "px";

        scale = window.devicePixelRatio || 1;
        canvas.width = width * scale;
        canvas.height = height * scale;

        draw();
    }

    

    function draw() {
        var ctx = canvas.getContext("2d");

        ctx.resetTransform();
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.scale(scale, scale);

        ctx.save()

        if (step == 0 && debug) {
            ctx.lineWidth = 6;
            ctx.strokeStyle = "#2968FF";
            ctx.strokeRect(0,0,width,height);
        }

        ctx.translate(width/2,height/2);

        

        if (step >= 1) {
            ctx.fillStyle = "#EC6D44";

            ctx.beginPath();
            ctx.ellipse(0, 0, height/3, height/3, 0, 0, 6.283185307179586);
            ctx.fill();
        }

        if (step == 1 && debug) {
            ctx.lineWidth = 4;
            ctx.strokeStyle = "#2968FF";
            ctx.beginPath();
            ctx.ellipse(0, 0, height/3, height/3, 0, 0, 6.283185307179586);
            ctx.stroke();
        }

        if (step >= 2) {
            ctx.globalCompositeOperation = "source-atop";

            var w = height/8;
            ctx.fillStyle = "#f5f5f5";

            ctx.rotate(Math.PI/4.0);
            ctx.fillRect(-w/2, -height/2, w, height);

            if (step == 2 && debug) {
                ctx.globalCompositeOperation = "source-over";

                ctx.lineWidth = 4;
                ctx.strokeStyle = "#2968FF";
                ctx.strokeRect(-w/2, -height/2, w, height);
            }

            ctx.globalCompositeOperation = "source-atop";

            ctx.rotate(Math.PI/2.0);
            ctx.fillRect(-w/2, -height/2, w, height);

            if (step == 2 && debug) {
                ctx.globalCompositeOperation = "source-over";

                ctx.lineWidth = 4;
                ctx.strokeStyle = "#2968FF";
                ctx.strokeRect(-w/2, -height/2, w, height);
            }
        }


        ctx.rotate(Math.PI/4.0);

        if (step >= 3) {
            ctx.fillStyle = "#EC6D44";

            ctx.globalCompositeOperation = "source-atop";

            var gradient = ctx.createRadialGradient(0,0,height/5.5 - 3, 0,0, height/3+3);

            // Add three color stops
            gradient.addColorStop(0, "rgba(0,0,0,0.7)");
            gradient.addColorStop(0.1, "rgba(0,0,0,0.3)");
            gradient.addColorStop(0.15, "rgba(0,0,0,0.15)");
            gradient.addColorStop(0.2, "rgba(0,0,0,0.1)");
            gradient.addColorStop(0.35, "rgba(0,0,0,0.03)");
            gradient.addColorStop(0.4, "rgba(0,0,0,0.01)");
            gradient.addColorStop(0.5, "rgba(0,0,0,0.0)");
            gradient.addColorStop(0.6, "rgba(0,0,0,0.01)");
            gradient.addColorStop(0.65, "rgba(0,0,0,0.03)");
            gradient.addColorStop(0.8, "rgba(0,0,0,0.1)");
            gradient.addColorStop(0.85, "rgba(0,0,0,0.15)");
            gradient.addColorStop(0.9, "rgba(0,0,0,0.3)");
            gradient.addColorStop(1, "rgba(0,0,0,0.7)");

            // Set the fill style and draw a rectangle
            ctx.fillStyle = gradient;


            ctx.fillRect(-height/3 - 1, -height/3 - 1, height * 2/3 + 2, height * 2/3 + 2);

        }

        if (step == 3 && debug) {

            ctx.globalCompositeOperation = "source-over";

            ctx.lineWidth = 4;
            ctx.strokeStyle = "#2968FF";
            ctx.strokeRect(-height/3, -height/3, height * 2/3, height * 2/3);
        }

        ctx.rotate(-Math.PI/4.0);


        if (step >= 4) {
            ctx.globalCompositeOperation = "destination-out";

            ctx.fillStyle = "#f5f5f5";

            ctx.beginPath();
            ctx.ellipse(0, 0, height/5.5, height/5.5, 0, 0, 6.283185307179586);
            ctx.fill();

            if (step == 4 && debug) {
                ctx.globalCompositeOperation = "source-over";

                ctx.lineWidth = 4;
                ctx.strokeStyle = "#2968FF";
                ctx.beginPath();
                ctx.ellipse(0, 0, height/5.5, height/5.5, 0, 0, 6.283185307179586);
                ctx.stroke();
            }
        }

        var r;
        if (step >= 5) {
            ctx.globalCompositeOperation = "destination-over";

            ctx.strokeStyle = "rgba(0,0,0,0.4)";

            r = (height/3 + height/5.5) * 0.5;
            ctx.lineWidth = (height/3 - height/5.5);
            ctx.translate (height/20, 0);
            ctx.beginPath();
            ctx.ellipse(0, 0, r, r, 0, 0, 6.283185307179586);
            ctx.stroke();

            if (step == 5 && debug) {
                ctx.globalCompositeOperation = "source-over";

                ctx.lineWidth = 4;
                ctx.strokeStyle = "#2968FF";
                ctx.beginPath();
                ctx.ellipse(0, 0, r, r, 0, 0, 6.283185307179586);
                ctx.stroke();
            }
        }

        ctx.globalCompositeOperation = "source-over";

        r = (height/3 + height*0.62) * 0.5;

        ctx.translate (-height/20, 0);

        if (step >= 6) {

            ctx.lineWidth = 2;
            ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
            ctx.beginPath();
            ctx.ellipse(0, 0, r, r, 0, 0, 6.283185307179586);
            ctx.stroke();

            if (step == 6 && debug) {
                ctx.lineWidth = 6;
                ctx.strokeStyle = "#2968FF";
                ctx.beginPath();
                ctx.ellipse(0, 0, r, r, 0, 0, 6.283185307179586);
                ctx.stroke();
            }

            r += height*0.15;

            ctx.lineWidth = 2;
            ctx.strokeStyle = "rgba(255, 255, 255, 0.07)";
            ctx.beginPath();
            ctx.ellipse(0, 0, r, r, 0, 0, 6.283185307179586);
            ctx.stroke();

            if (step == 6 && debug) {
                ctx.lineWidth = 6;
                ctx.strokeStyle = "#2968FF";
                ctx.beginPath();
                ctx.ellipse(0, 0, r, r, 0, 0, 6.283185307179586);
                ctx.stroke();
            }

            r += height*0.15;

            ctx.lineWidth = 2;
            ctx.strokeStyle = "rgba(255, 255, 255, 0.03)";
            ctx.beginPath();
            ctx.ellipse(0, 0, r, r, 0, 0, 6.283185307179586);
            ctx.stroke();

            if (step == 6 && debug) {
                ctx.lineWidth = 6;
                ctx.strokeStyle = "#2968FF";
                ctx.beginPath();
                ctx.ellipse(0, 0, r, r, 0, 0, 6.283185307179586);
                ctx.stroke();
            }
        }


        if (step >= 7) {

            ctx.rotate(-Math.PI/4.0);
            ctx.globalCompositeOperation = "destination-in";

            r = (height/3 + height*0.5) * 0.5;

            ctx.beginPath();
            ctx.ellipse(0, 0, r, r*2.0, 0, 0, 6.283185307179586);
            ctx.fill();

            

            if (step == 7 && debug) {
                ctx.globalCompositeOperation = "source-over";
                ctx.lineWidth = 6;
                ctx.strokeStyle = "#2968FF";
                ctx.beginPath();
                ctx.ellipse(0, 0, r, r*2.0, 0, 0, 6.283185307179586);
                ctx.stroke();
            }

           
        }


    
     
      
      ctx.restore();

      ctx.globalCompositeOperation = "destination-over";

    //   if (step == 8 && debug) {
    //     ctx.lineWidth = 6;
    //     ctx.strokeStyle = "#FF4343";
    //     ctx.strokeRect(0,0,width,height);
    // }

      if (step >= 8) {
        ctx.fillStyle = "#2052BB";
        ctx.fillRect(0, 0, width, height);
    }



    ctx.globalCompositeOperation = "destination-over";

        ctx.save();

        var grid_size = 30.0;

        ctx.translate(width/2 - grid_size/2,height/2 - grid_size/2);

        ctx.fillStyle = "#eee";
        var flip_flop = false;
        for (var x = -Math.ceil(width/grid_size)*grid_size; x <= width/2 + grid_size; x += grid_size)
        {
            for (var y = -Math.ceil(height/grid_size)*grid_size; y <= height/2 + grid_size; y += 2*grid_size)
            {
                ctx.fillRect(x, y + (flip_flop ? grid_size : 0), grid_size, grid_size);
            }
            flip_flop = !flip_flop;
        }

        ctx.restore();
        ctx.fillStyle = "#fff";
        ctx.fillRect(0, 0, width, height);

        ctx.globalCompositeOperation = "source-over";

        ctx.lineWidth = 1;
        ctx.strokeStyle ="#888";

        ctx.strokeRect(0.5,0.5,width-1, height-1);
    }



    function genericTouchHandler(f) {
        return function (e) {
            if (e.touches.length == 1) {
                if (f(e.touches[0])) {
                    e.preventDefault();
                    return false;
                }
            }
        }
    }
}

var s0, s1;
var amul;

function alpha_set_transparencies () {
    s0.set_value(0.8);
    amul.set_a0 (0.8);
    s1.set_value(0.6);
    amul.set_a1 (0.6);
}

function alpha_set_transparencies0 () {
    s0.set_value(0.0);
    amul.set_a0 (0.0);
    s1.set_value(1.0);
    amul.set_a1 (1.0);
}

function alpha_set_transparencies1 () {
    s0.set_value(1.0);
    amul.set_a0 (1.0);
    s1.set_value(0.0);
    amul.set_a1 (0.0);
}

document.addEventListener("DOMContentLoaded", function (event) {
    
    new GlassesDrawer(document.getElementById("alpha_rose_glasses_container"), "rose");
    new GlassesDrawer(document.getElementById("alpha_black_glasses_container"), "shade");
    var rose = new GlassesDrawer(document.getElementById("alpha_rose_sover_glasses_container"), "rose-sover");

    new SegmentedControl(document.getElementById("alpha_pink_segment_container"), function (x) {
        rose.set_mode(x ? "rose-glass" : "rose-sover");
    },
    ["object", "stained glass"]
    );

    

    amul = new AlphaMul(document.getElementById("alpha_alpha_mul_canvas_container"), false);

    s0 = new Slider(document.getElementById("alpha_alpha_mul_red_container"), function (x) {amul.set_a0(x)}, "alpha_mul_");
    s1 = new Slider(document.getElementById("alpha_alpha_mul_blue_container"), function (x) {amul.set_a1(x)}, "alpha_mul_");

    new CoveragePlot(document.getElementById("alpha_coverage_binary_canvas_container"), "basic");
    new CoveragePlot(document.getElementById("alpha_coverage_msaa_canvas_container"), "msaa");
    new CoveragePlot(document.getElementById("alpha_coverage_geometry_canvas_container"), "geometry");

    var al = new AlphaLerper(document.getElementById("alpha_lerper_container"));
    new Slider(document.getElementById("alpha_lerper_slider_container"), function (x) {al.set_a(x)}, "alpha_mul_");
    
    
    var nearest = new TextureSampler(document.getElementById("alpha_nearest_sampler"), "nearest");    
    var bilinear_bad = new TextureSampler(document.getElementById("alpha_bilinear_bad_sampler"), "bilinear_bad");
    var bilinear = new TextureSampler(document.getElementById("alpha_bilinear_sampler"), "bilinear");

    new Slider(document.getElementById("alpha_nearest_slider_container"), function (x) {nearest.set_rot((x - 0.5)*Math.PI*2)}, "alpha_mul_");
    new Slider(document.getElementById("alpha_bilinear_bad_slider_container"), function (x) {bilinear_bad.set_rot((x - 0.5)*Math.PI*2)}, "alpha_mul_");
    new Slider(document.getElementById("alpha_bilinear_slider_container"), function (x) {bilinear.set_rot((x - 0.5)*Math.PI*2)}, "alpha_mul_");


    new BitDepth(document.getElementById("alpha_text_bit_canvas"), true);
    new BitDepth(document.getElementById("alpha_gradient_bit_canvas"), false);

    var modes = ["over", "out", "in", "atop"];

    for (var i = 0; i < modes.length; i++) {
        var mode = modes[i];

        var porterd = new PorterDuffer(document.getElementById("alpha_pd_" + mode + "_canvas_container"));

        (function f(pd, mode) {
        new SegmentedControl(document.getElementById("alpha_" + mode + "_segment_container"), function (x) {
            pd.set_mode(x ? "destination-" + mode : "source-" + mode);
            if (x) {
                document.getElementById("alpha_s"+ mode + "_equation").classList.add("hidden");
                document.getElementById("alpha_d"+ mode + "_equation").classList.remove("hidden");
            } else {
                document.getElementById("alpha_s"+ mode + "_equation").classList.remove("hidden");
                document.getElementById("alpha_d"+ mode + "_equation").classList.add("hidden");
            }
        },
        ["source-"+ mode, "destination-"+ mode]
        );
        })(porterd, mode);
    }
   
    var xor = new PorterDuffer(document.getElementById("alpha_pd_xor_canvas_container"));
    xor.set_mode("xor");

    var sdc = new PorterDuffer(document.getElementById("alpha_pd_sdc_canvas_container"));

    new SegmentedControl(document.getElementById("alpha_sdc_segment_container"), function (x) {
        sdc.set_mode(x == 2 ? "clear" : x == 1 ? "destination" : "copy");

        document.getElementById("alpha_s_equation").classList.add("hidden");
        document.getElementById("alpha_d_equation").classList.add("hidden");
        document.getElementById("alpha_c_equation").classList.add("hidden");

        if (x == 0) {
            document.getElementById("alpha_s_equation").classList.remove("hidden");
        } else if (x == 1) {
            document.getElementById("alpha_d_equation").classList.remove("hidden");
        }
        else if (x == 2) {
            document.getElementById("alpha_c_equation").classList.remove("hidden");
        }
    },
    ["source", "destination", "clear"]
    );


    var pd_example_container = document.getElementById("alpha_pd_example_container");
    var pd_example = new PDExample(pd_example_container);

    var step = 0;

    var names = [
        "1. <span class=\"alpha_operator\">clear</span> rectangle",
        "2. <span class=\"alpha_operator\">source-over</span> orange circle",
        "3. <span class=\"alpha_operator\">source-atop</span> white rectangles",
        "4. <span class=\"alpha_operator\">source-atop</span> radial gradient square",
        "5. <span class=\"alpha_operator\">destination-out</span> circle",
        "6. <span class=\"alpha_operator\">destination-over</span> transparent black stroked circle",
        "7. <span class=\"alpha_operator\">source-over</span> transparent white stroked circles",
        "8. <span class=\"alpha_operator\">destination-in</span> ellipse",
        "9. <span class=\"alpha_operator\">destination-over</span> blue rectangle",
   ];

   document.getElementById("alpha_pd_example_step").innerHTML = names[step];

    pd_example_container.onclick = function (e) {

        var rect = pd_example_container.getBoundingClientRect();

        prev_mouse_x = e.clientX;
       
        step += prev_mouse_x < rect.left + rect.width / 2  ? -1.0 : 1.0;

        step = Math.max(0, Math.min(step, 8));

        pd_example.set_step(step);

  

        document.getElementById("alpha_pd_example_step").innerHTML = names[step];

        e.preventDefault();
    }
    

});