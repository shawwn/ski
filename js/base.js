// noinspection JSUnusedAssignment,JSSuspiciousNameCombination
// noinspection JSPotentiallyInvalidUsageOfThis
// noinspection JSUnusedGlobalSymbols
// noinspection UnnecessaryLocalVariableJS

"use strict";

let prn = (x, ...args) => { console.log(x, ...args); return x; }

window.MathJax = {
    tex: {
        inlineMath: [['$', '$'], ['\\(', '\\)']]
    },
    svg: {
        fontCache: 'global'
    }
};

(function () {
    var script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-svg.js';
    script.async = true;
    document.head.appendChild(script);
})();

// Function to check if a class implements an interface, including getters and setters
// function implementsInterface(object, interfaceDef) {
//     for (let key in interfaceDef) {
//         const descriptor = Object.getOwnPropertyDescriptor(interfaceDef, key);
//         if (typeof descriptor.get === 'function' || typeof descriptor.set === 'function') {
//             const objectDescriptor = Object.getOwnPropertyDescriptor(object, key);
//             if (!objectDescriptor || 
//                 (descriptor.get && !objectDescriptor.get) || 
//                 (descriptor.set && !objectDescriptor.set)) {
//                 throw new Error(`Class does not implement ${key} with a getter/setter as required by the interface.`);
//             }
//         } else if (!object[key] || typeof object[key] !== 'function') {
//             throw new Error(`Class does not implement ${key} method required by the interface.`);
//         }
//     }
// }

function implementsInterface(derivedClass, baseInterface) {
    const basePrototype = baseInterface.prototype;
    const derivedPrototype = derivedClass.prototype;

    // Check each property in the interface
    for (const prop of Object.getOwnPropertyNames(basePrototype)) {
        const baseDescriptor = Object.getOwnPropertyDescriptor(basePrototype, prop);
        if (typeof baseDescriptor.value === 'function') {
            // Check if the method in the base class is meant to be abstract
            if (basePrototype[prop].toString().includes("throw null")) {
                const derivedDescriptor = Object.getOwnPropertyDescriptor(derivedPrototype, prop);
                if (!derivedDescriptor || !derivedDescriptor.value || derivedDescriptor.value.toString() === basePrototype[prop].toString()) {
                    throw new Error(`Class does not implement abstract method '${prop}' required by the interface.`);
                }
            }
        } else if (baseDescriptor.get || baseDescriptor.set) {
            // Check if the getter/setter in the base class are meant to be abstract
            if ((baseDescriptor.get && baseDescriptor.get.toString().includes("throw null")) ||
                (baseDescriptor.set && baseDescriptor.set.toString().includes("throw null"))) {
                const derivedGetter = Object.getOwnPropertyDescriptor(derivedPrototype, prop)?.get;
                const derivedSetter = Object.getOwnPropertyDescriptor(derivedPrototype, prop)?.set;

                if (baseDescriptor.get && (!derivedGetter || derivedGetter.toString() === basePrototype[prop].toString())) {
                    throw new Error(`Class does not implement abstract getter '${prop}' required by the interface.`);
                }
                if (baseDescriptor.set && (!derivedSetter || derivedSetter.toString() === basePrototype[prop].toString())) {
                    throw new Error(`Class does not implement abstract setter '${prop}' required by the interface.`);
                }
            }
        }
    }
}

// noinspection JSUnusedGlobalSymbols
function implementsInterfaces(derivedClass, ...interfaces) {
    for (const interface_ of interfaces) {
        console.log(derivedClass, 'checking', interface_)
        implementsInterface(derivedClass, interface_);
    }
    return derivedClass;
}


// class ISinger {
//     sing(x) { throw null; }
// }
//
// class Base {
//     base() { return 42; }
// }
//
// class Foo extends Base {
//     static {
//         implementsInterface(this, ISinger);
//     }
//    
//     sing(x, y) { return x; }
//    
// }
//
// class ISizable {
//     get length() { throw null; }
// }
//
// class Bar extends Array {
//     bar() {}
//     get prop() { }
//     static baz () {}
//     static {
//         implementsInterface(this, ISizable);
//     }
// }

!(function DotNet(exports) {
    let nil = undefined;
    let string = "";
    string = nil;
    let number = 0;
    number = nil;
    let object = {};
    object = nil;

    let hasLength = new class HasLength {
        constructor() {
            this.length = 0;
        }
    };
    hasLength = nil;

    exports.nil = nil;
    exports.string = string;
    exports.number = number;
    exports.object = object;
    exports.hasLength = hasLength;
    
    class Util {
        static verify(value, name = "value", message = "is null or false") {
            Util.assert(value, `${name} ${message}`);
            return value;
        }
        static assert(cond, message = "Assertion failed") {
            if (!FunctionType.is(cond)) {
                return Util.assert(() => cond, message);
            } else {
                let result = cond()
                if (result === false || result instanceof Nil) {
                    Exception.throw(`${message}: ${cond}`)
                }
                return result
            }
        }
        
        static objectType( valueType ) {
            if ( false )
                return Object.fromEntries([["name", valueType]]);
            return {};
        }

        static arrayType( valueType ) {
            if ( false )
                return Array.from([ valueType ]);
            return nil;
        }
        
        static argumentArray( args ) {
            if ( args.length === 1 && args[0] instanceof ArrayType ) {
                return args[0];
            }
            return args;
        }

        static multiple( x, of ) {
            return x % of === 0;
        }
        
        static sum( values ) {
            let r = 0;
            if ( values.length > 0 ) {
                let add = values[0].add ? (x, y) => x.add(y) : (x, y) => x + y;
                for ( let x of values ) {
                    r = add(x, r);
                }
            }
            return r;
        }

        static between(a, b, f) {
            return (f - a) / (b - a);
        }

        static lerp(a, b, f) {
            if (f === 0)
                return a;
            else if (f === 1)
                return b;

            return a * (1 - f) + b * f;
        }

        static inner(s) {
            return s.substring(1, s.length - 1);
        }

        static saturate(x, max = 1.0) {
            return Math.max(0.0, Math.min(x, max));
        }

        static clamp(x, a, b) {
            return Math.max(a, Math.min(x, b));
        }

        static iround(x) {
            return Math.floor(x + 0.5);
        }

        static rgbComponentToPercent(x) {
            // return this.saturate(x / 255);
            return x / 255;
        }

        static percentToRgbComponent(x) {
            // return this.iround(255 * this.saturate(x));
            return x * 255;
        }

        static saturateRgbComponent(x) {
            return this.clamp(this.iround(x), 0, 255);
        }

        static hexColorComponent(n) {
            let hex = this.saturateRgbComponent(n).toString(16);
            return hex.length < 2 ? '0' + hex : hex;
        }

        static rgba_hex_color(rgb, a = 1) {
            return [(((rgb >> 16) & 0xff) / 255.0) * a, (((rgb >> 8) & 0xff) / 255.0) * a, ((rgb & 0xff) / 255.0) * a, a];
        }

        static rgba255_sq_color(r, g, b, a) {
            return [(r / 255.0) * (r / 255.0) * a, (g / 255.0) * (g / 255.0) * a, (b / 255.0) * (b / 255.0) * a, a];
        }

        static rgba255_color(r, g, b, a) {
            return [(r / 255.0) * a, (g / 255.0) * a, (b / 255.0) * a, a];
        }

        static rgba_color_string(rgba) {
            return "rgba(" + iround(saturate(rgba[0]) * 255) + "," +
                iround(saturate(rgba[1]) * 255) + "," +
                iround(saturate(rgba[2]) * 255) + "," +
                saturate(rgba[3]) + ")";
        }

    }

    exports.Util = Util;

    exports.assert = Util.assert;
    exports.verify = Util.verify;

    let System = {};
    exports.System = System;

    class Exception extends Error {
        static alloc(...args) {
            return new this(...args);
        }

        static throw(message = string, ...args) {
            if (args.length > 0)
                ArgumentException.throw("Too many arguments", "Exception.throw");
            throw this.make({message})
        }

        constructor(message = "{Exception is initializing...}") {
            super(message);
        }

        // does not properly update an error's message in chrome devtools
        // initWithMessage(message = string) {
        //     this.Message = message;
        //     return this;
        // }

        static make({message = string}) {
            return new this(message)
        }

        m_Message = string;

        get Message() {
            return this.m_Message;
        }

        set Message(value) {
            this.m_Message = value;
            this.update();
        }

        update() {
            this.message = this.m_Message;
        }
    }

    System.Exception = Exception;

    class SystemException extends Exception {
    }

    System.SystemException = SystemException;

    class ArgumentException extends SystemException {
        static throw(message = string, paramName = string) {
            throw this.make({message, paramName})
        }

        static make({message = string, paramName = string}) {
            // const self = this.alloc().initWithMessage(message);
            const self = super.make({message: ArgumentException.formatMessage(message, paramName)});
            self.ParamName = paramName;
            return self;
        }

        get Message() {
            return super.Message;
        }

        set Message(value) {
            super.Message = value;
            this.update();
        }

        get ParamName() {
            return this.m_ParamName;
        }

        set ParamName(value) {
            this.m_ParamName = value;
            this.update();
        }

        static isNull(x = string) {
            return x instanceof Nil;
        }

        static isEmpty(x = hasLength) {
            return x.length <= 0;
        }

        static isWhitespace(x = string) {
            return x.match(/^\s+$/g) ? true : false;
        }

        static formatMessage(message = string, paramName = string) {
            if (paramName)
                return `${message}: ${paramName}`;
            else
                return message;
        }

        update() {
            this.message = ArgumentException.formatMessage(this.Message, this.ParamName);
        }

        static throwIfNull(argument, paramName = string) {
            if (this.isNull(argument))
                throw ArgumentNullException.make({paramName});
        }

        static throwIfNullOrEmpty(argument = hasLength, paramName = string) {
            this.throwIfNull(argument, paramName);
            if (this.isEmpty(argument))
                throw this.make({message: "Argument is empty", paramName});
        }

        static throwIfNullOrWhiteSpace(argument = string, paramName = string) {
            this.throwIfNull(argument, paramName);
            if (this.isWhitespace(argument))
                throw this.make({message: "Argument is whitespace", paramName});
        }
    }

    System.ArgumentException = ArgumentException;

    class ArgumentNullException extends ArgumentException {
        static make({paramName = string}) {
            return super.make({message: "Argument is null", paramName})
        }
    }

    System.ArgumentNullException = ArgumentNullException;

    // try {
    //     ArgumentException.throwIfNull(null, "foo");
    // } catch (e) {
    //     debugger;
    // }

    class Obj {
        static alloc() {
            return new this();
        }

        static cast(x) {
            if (!(x instanceof this))
                throw new TypeError(`Expected ${this.name}, got ${x}`)
            return null ? new this() : x;
        }

        init() {
            return this;
        }

        static signal(errorType, ...args) {
            throw new errorType(...args);
        }

        static error(message, ...args) {
            if (args.length > 0)
                this.signal(Error, `${message}: ${args}`)
            else
                this.signal(Error, `${message}`)
        }

        static wrongType(expected, value) {
            this.signal(TypeError, `Expected ${expected.name}, got ${value}`)
        }

        static assert(x, message = `Assertion failed`, ...args) {
            if (!x) {
                this.error(message, ...args);
            }
            return x;
        }

        static is(value) {
            return value instanceof this;
        }

        static maybe(value, defaultValue = undefined) {
            if (this.is(value))
                return value;
            return defaultValue;
        }

        static verify(value) {
            if (!this.is(value))
                this.wrongType(this, value);
            return value;
        }

        static getClass(x) {
            if (x instanceof Nil)
                return Nil;
            return x.constructor;
        }

        get Class() {
            return Obj.getClass(this);
        }

        __add__(x) {
            return this.Class.add(this, x);
        }

        __sub__(x) {
            return this.Class.subtract(this, x);
        }

        __mul__(x) {
            return this.Class.multiply(this, x);
        }

        __truediv__(x) {
            return this.Class.divide(this, x);
        }

        __idiv__(x) {
            return this.Class.idivide(this, x);
        }
    }

    exports.Obj = Obj;

    class Type extends Obj {
        static [Symbol.hasInstance](x) {
            return this.is(x);
        }
    }

    exports.Type = Type;

    class Nil extends Type {
        static is(value) {
            return value == null;
        }
    }

    exports.Nil = Nil;

    class BoolType extends Type {
        static is(value) {
            return Obj.getClass(value) === Boolean;
        }
    }

    exports.BoolType = BoolType;

    class StringType extends Type {
        static is(value) {
            return typeof value === "string";
        }
    }

    exports.StringType = StringType;

    class FunctionType extends Type {
        static is(value) {
            return typeof value === "function";
        }
    }

    exports.FunctionType = FunctionType;

    class ArrayType extends Type {
        static is(value) {
            return value instanceof Array;
        }
    }

    exports.ArrayType = ArrayType;

    class NumberType extends Type {
        static is(value) {
            return typeof value === "number";
        }

        static parse(str) {
            const value = parseFloat(str)
            if (!isNaN(value))
                return value;
        }
    }

    exports.NumberType = NumberType;

    class Real extends NumberType {
    }

    exports.Real = Real;

    class Integer extends Real {
        static op(f, value) {
            if (value instanceof Real)
                return f(value);
        }

        static floor(value) {
            return Math.floor(value);
        }

        static trunc(value) {
            return Math.trunc(value);
        }

        static is(value) {
            if (!super.is(value))
                return false;
            return this.floor(value) === value;
        }

        static parse(str = string) {
            const value = parseInt(str)
            if (!isNaN(value))
                return value;
        }
    }

    exports.Integer = Integer;

    class Color extends Obj {
        // constructor(r = number, g = number, b = number, a= 1.0) {
        //     this.r = r
        //     this.g = g
        //     this.b = b
        //     this.a = a
        // }
        r = number
        g = number
        b = number
        a = number

        get opacity() {
            return this.a;
        }

        get A() {
            return Util.saturateRgbComponent(Util.percentToRgbComponent(this.a));
        }

        get R() {
            return Util.saturateRgbComponent(Util.percentToRgbComponent(this.r));
        }

        get G() {
            return Util.saturateRgbComponent(Util.percentToRgbComponent(this.g));
        }

        get B() {
            return Util.saturateRgbComponent(Util.percentToRgbComponent(this.b));
        }

        get RGBA() {
            return [this.R, this.G, this.B, this.A]
        }

        initWithRGBA(r = number, g = number, b = number, a = 1.0) {
            this.r = r;
            this.g = g;
            this.b = b;
            this.a = a;
            this.init();
            return this;
        }

        static make(r = number, g = number, b = number, a = 1.0) {
            return new this().initWithRGBA(r, g, b, a);
        }

        static fromRgb(rgb, alpha = number) {
            const r = Util.rgbComponentToPercent(rgb[0]);
            const g = Util.rgbComponentToPercent(rgb[1]);
            const b = Util.rgbComponentToPercent(rgb[2]);
            alpha ??= rgb[3] ?? 1.0;
            return Color.cast(this.make(r, g, b, alpha));
        }

        static cast(x) {
            return null ? new this() : x;
        }

        clone() {
            return Color.cast(this.constructor.alloc().initWithRGBA(this.r, this.g, this.b, this.a));

        }

        static from(x) {
            if (x instanceof Color)
                return x;
            if (StringType.is(x))
                return Color.parse(x)
            if (!x)
                return x;
            ArgumentException.throw("Can't convert to Color", "Color.from")
        }

        static parse(str) {
            // https://stackoverflow.com/a/47355187/9919772
            function normalizeColor(str) {
                const ctx = document.createElement("canvas").getContext("2d");
                ctx.fillStyle = str;
                return ctx.fillStyle;
            }

            const s = normalizeColor(str);
            return s.startsWith("#") ? this.fromHex(s) : this.fromColorString(s);
        }

        static fromColorString(str = string, alpha = number) {
            const rgb = str.match(/[.\d]+/g).map(x => parseFloat(x));
            return this.fromRgb(rgb, alpha);
        }

        static fromHex(hex, alpha = number) {
            // https://stackoverflow.com/a/74662179/9919772
            const hexToColorString = (color) => {
                const {style} = new Option();
                style.color = color;
                return style.color;
            }
            return Color.cast(this.fromColorString(hexToColorString(hex), alpha));
        }

        static fromPercent(p, alpha = 1.0) {
            return Color.cast(this.make(p, p, p, alpha));
        }

        toHex() {
            let r = Util.hexColorComponent(this.R);
            let g = Util.hexColorComponent(this.G);
            let b = Util.hexColorComponent(this.B);
            let a = Util.hexColorComponent(this.A);
            return (a === 'ff') ? `#${r}${g}${b}` : `#${r}${g}${b}${a}`
        }

        toRgbString() {
            const c = this.saturate()
            if (c.opacity === 1.0)
                return `rgb(${c.R}, ${c.G}, ${c.B})`;
            else
                return `rgba(${c.R}, ${c.G}, ${c.B}, ${c.opacity})`;
        }

        toHtml() {
            return this.toRgbString()
        }

        toString() {
            return this.toHtml();
        }

        saturate() {
            return Color.make(
                Util.saturate(this.r),
                Util.saturate(this.g),
                Util.saturate(this.b),
                Util.saturate(this.a));
        }

        withRGB(r, g, b, alpha = number) {
            return Color.fromRgb([r, g, b], alpha ?? this.opacity)
        }

        withOpacity(a = 1.0) {
            return Color.make(this.r, this.g, this.b, a);
        }

        opaque() {
            return this.withOpacity(1.0);
        }

        scaleOpacity(s) {
            return this.withOpacity(this.a * s);
        }

        invertRGB() {
            return this.saturate().mapRGB(c => (1 - c));
        }

        mapRGB(op, ...args) {
            const r = op(this.r, ...args.map(color => color.r));
            const g = op(this.g, ...args.map(color => color.g));
            const b = op(this.b, ...args.map(color => color.b));
            return Color.make(r, g, b, this.opacity);
        }

        scaleRGB(s) {
            return this.mapRGB(c => (c * s));
        }

        addRGB(color) {
            return this.mapRGB((c, s) => (c + s), color);
        }

        mulRGB(color) {
            return this.mapRGB((c, s) => (c * s), color);
        }

        lerp(color, t) {
            const r = Util.lerp(this.r, color.r, t);
            const g = Util.lerp(this.g, color.g, t);
            const b = Util.lerp(this.b, color.b, t);
            const a = Util.lerp(this.a, color.a, t);
            return Color.make(r, g, b, a);
        }

        premultiplyAlpha() {
            return this.scaleRGB(this.a);
        }

        sourceOverPremultiplied(dest) {
            return this.addRGB(dest.scaleRGB(1 - saturate(this.a)));
        }

        sourceOver(dest) {
            const S = this.premultiplyAlpha();
            const D = dest.premultiplyAlpha();
            return S.sourceOverPremultiplied(D).opaque();
        }

        static White = Color.fromHex('#fff')
        static Black = Color.fromHex('#000');
        static LightGray = Color.fromHex('#d3d3d3');
        static DarkGray = Color.fromHex('#a9a9a9');
        static Magenta = Color.parse('magenta');
        static Yellow = Color.parse('yellow');
        static Red = Color.parse('red');
        static Green = Color.parse('green');
        static Blue = Color.parse('blue');
        static Transparent = Color.fromHex('#0000')
    }

    exports.Color = Color;
    let colorType = 0 ? new Color() : nil;
    exports.colorType = colorType;

    class Point extends Obj {

        get x() {
            Exception.throw("use .X");
        }

        get y() {
            Exception.throw("use .Y");
        }

        set x(_value) {
            Exception.throw("use .X");
        }

        set y(_value) {
            Exception.throw("use .Y");
        }

        get X() {
            return this._x;
        }

        get Y() {
            return this._y;
        }

        // set X(value) { Exception.throw("X is read-only"); }
        // set Y(value) { Exception.throw("Y is read-only"); }
        set X(value) {
            this._x = value;
        }

        set Y(value) {
            this._y = value;
        }

        // // noinspection JSSuspiciousNameCombination
        // constructor() {
        //     super();
        //     Exception.throw("Use Point.make(x, y) instead of new Point(x, y)")
        // }

        // noinspection JSSuspiciousNameCombination
        static make(x = number, y = x) {
            const self = this.alloc()
            self._x = x;
            self._y = y;
            return self;
        }

        static is(value) {
            return value instanceof this;
        }

        static get Empty() {
            return this.make(0.0, 0.0);
        }

        clone() {
            return Point.make(this.X, this.Y)
        }

        isEmpty() {
            return this.X === 0.0 && this.Y === 0.0;
        }

        static from(value) {
            if (value instanceof Real)
                return Point.cast(this.make(value, value));
            if (value instanceof Size)
                return Point.cast(this.make(value.Width, value.Height));
            return Point.cast(value).clone();
        }

        static op(f, ...args) {
            args = args.map(x => this.from(x));
            const x = f(...args.map(size => size.X));
            const y = f(...args.map(size => size.Y));
            return Point.cast(this.make(x, y));
        }

        static add(sz1, sz2) {
            return this.op((x, y) => (x + y), sz1, sz2);
        }

        static subtract(sz1, sz2) {
            return this.op((x, y) => (x - y), sz1, sz2);
        }

        static multiply(size, multiplier) {
            return this.op((x, y) => (x * y), size, multiplier);
        }

        static divide(size, divisor) {
            return this.op((x, y) => (x / y), size, divisor);
        }

        static idivide(size, divisor) {
            return this.op((x, y) => Integer.floor(x / y), size, divisor);
        }

        static equals(p1, p2) {
            return p1.X === p2.X && p1.Y === p2.Y;
        }

        op(f, ...args) {
            return Point.cast(this.constructor.op(f, this, ...args));
        }

        toString() {
            return `{X=${this.X},Y=${this.Y}}`;
        }
    }

    exports.Point = Point;
    let point = Point.alloc();
    point = nil;

    class Size extends Obj {
        constructor(width, height = width) {
            super();
            this._width = width;
            this._height = height;
        }

        get width() {
            Exception.throw("use .Width");
        }

        get height() {
            Exception.throw("use .Height");
        }

        set width(_value) {
            Exception.throw("use .Width");
        }

        set height(_value) {
            Exception.throw("use .Height");
        }

        get Width() {
            return this._width;
        }

        get Height() {
            return this._height;
        }

        // set Width(value) { Exception.throw("Width is read-only"); }
        // set Height(value) { Exception.throw("Height is read-only"); }
        set Width(value) {
            this._width = value;
        }

        set Height(value) {
            this._height = value;
        }

        static get Empty() {
            return new Size(0.0, 0.0);
        }

        clone() {
            return new Size(this.Width, this.Height);
        }

        isEmpty() {
            return this.Width === 0.0 && this.Height === 0.0;
        }

        static from(value) {
            if (value instanceof Real)
                return new this(value, value);
            if (value instanceof Point)
                return new this(value.X, value.Y);
            return value;
        }

        static op(f, ...args) {
            args = args.map(x => this.from(x));
            const width = f(...args.map(size => size.Width));
            const height = f(...args.map(size => size.Height));
            return new this(width, height);
        }

        static add(sz1, sz2) {
            return this.op((x, y) => (x + y), sz1, sz2);
        }

        static subtract(sz1, sz2) {
            return this.op((x, y) => (x - y), sz1, sz2);
        }

        static multiply(size, multiplier) {
            return this.op((x, y) => (x * y), size, multiplier);
        }

        static divide(size, divisor) {
            return this.op((x, y) => (x / y), size, divisor);
        }

        static idivide(size, divisor) {
            return this.op((x, y) => Integer.floor(x / y), size, divisor);
        }

        static equals(sz1, sz2) {
            return sz1.Width === sz2.Width && sz1.Height === sz2.Height;
        }

        op(f, ...args) {
            return this.Class.op(f, this, ...args);
        }

        toString() {
            return `{Width=${this.Width},Height=${this.Height}}`;
        }
    }

    exports.Size = Size;
    let size = Size.alloc();
    size = nil;

    class Rectangle extends Obj {
        constructor(x, y, width, height) {
            super();
            this.X = x;
            this.Y = y;
            this.Width = width;
            this.Height = height;
        }

        static fromSize(sz = size) {
            return new this(0, 0, sz.Width, sz.Height);
        }

        static fromLTRB(left = number, top = number, right = number, bottom = number) {
            return new this(left, top, right - left, bottom - top);
        }

        get Location() {
            return Point.make(this.X, this.Y);
        }

        set Location(value) {
            this.X = value.X;
            this.Y = value.Y;
        }

        get Center() {
            return Point.make(
                this.X + this.Extents.Width,
                this.Y + this.Extents.Height);
        }

        set Center(_value) {
            Exception.throw(".Center is read-only");
        }

        get Extents() {
            return new Size(
                this.Width / 2,
                this.Height / 2);
        }

        set Extents(_value) {
            Exception.throw(".Extents is read-only");
        }

        get Size() {
            return new Size(this.Width, this.Height);
        }

        set Size(value) {
            this.Width = value.Width;
            this.Height = value.Height;
        }

        get Left() {
            return this.X;
        }

        get Right() {
            return this.X + this.Width;
        }

        get Top() {
            return this.Y;
        }

        get Bottom() {
            return this.Y + this.Height;
        }

        set Left(_value) {
            Exception.throw(".Left is read-only");
        }

        set Right(_value) {
            Exception.throw(".Right is read-only");
        }

        set Top(_value) {
            Exception.throw(".Top is read-only");
        }

        set Bottom(_value) {
            Exception.throw(".Bottom is read-only");
        }

        static is(value) {
            return value instanceof this;
        }

        static get Empty() {
            return new this(0.0, 0.0, 0.0, 0.0);
        }

        clone() {
            return new Rectangle(this.X, this.Y, this.Width, this.Height);
        }

        isEmpty() {
            return this.Width <= 0 || this.Height <= 0;
        }

        static from(value) {
            // if (value instanceof Size) {
            //     return new this(0, 0, value.Width, value.Height);
            // }
            return Rectangle.cast(value).clone();
        }

        static op(f, ...args) {
            args = args.map(x => this.from(x));
            const x = f(...args.map(self => self.X));
            const y = f(...args.map(self => self.Y));
            const w = f(...args.map(self => self.Width));
            const h = f(...args.map(self => self.Height));
            return new this(x, y, w, h);
        }

        static add(sz1, sz2) {
            return this.op((x, y) => (x + y), sz1, sz2);
        }

        static subtract(sz1, sz2) {
            return this.op((x, y) => (x - y), sz1, sz2);
        }

        static multiply(rect, multiplier) {
            return this.op((x, y) => (x * y), rect, multiplier);
        }

        static divide(rect, divisor) {
            return this.op((x, y) => (x / y), rect, divisor);
        }

        static idivide(rect, divisor) {
            return this.op((x, y) => Integer.floor(x / y), rect, divisor);
        }

        static equals(r1 = rectangleType, r2 = rectangleType) {
            return r1.X === r2.X && r1.Y === r2.Y && r1.Width === r2.Width && r1.Height === r2.Height;
        }

        op(f, ...args) {
            return this.Class.op(f, this, ...args);
        }

        toString() {
            return `{X=${this.X},Y=${this.Y},Width=${this.Width},Height=${this.Height}}`;
        }

        inflate(x = number, y = number) {
            this.X -= x;
            this.Y -= y;
            this.Width += 2 * x;
            this.Height += 2 * y;
        }

        withInflate(x = number, y = number) {
            let rect = this.clone();
            rect.inflate(x, y);
            return rect;
        }
    }

    exports.Rectangle = Rectangle;
    let rectangleType = 0 ? new Rectangle() : nil;
    exports.rectangleType = rectangleType;

    class Brush {
        constructor(...args) {
            this.ctx = null;
            this.args = args;
        }

        get canvas() {
            if (this.ctx)
                return this.ctx.canvas;
        }

        get width() {
            return (this.canvas ?? {}).width;
        }

        set width(value) {
            this.canvas.width = value;
        }

        get height() {
            return (this.canvas ?? {}).height;
        }

        set height(value) {
            this.canvas.height = value;
        }

        update(force = false) {
            if (this.ctx && !force)
                return;

            const ctx = document.createElement("canvas").getContext("2d");
            this.draw(ctx, ...this.args);
            this.ctx = ctx;
        }

        draw(ctx, ...args) {
            throw new Error("Not implemented");
        }

        pattern(ctx, repeatX = true, repeatY = true) {
            this.update();
            let repeat;
            if (repeatX && repeatY)
                repeat = "repeat";
            else if (repeatX)
                repeat = "repeat-x";
            else if (repeatY)
                repeat = "repeat-y";
            else
                repeat = "no-repeat";
            return ctx.createPattern(this.canvas, repeat);
        }

        configure(ctx = canvasRenderingContext2D) {
            ctx.fillStyle = this.pattern(ctx);
        }
    }

    exports.Brush = Brush;
    let brushType = 0 ? new Brush() : nil;
    exports.brushType = brushType;

    class SolidBrush extends Brush {
        constructor(color = colorType) {
            super({color});
        }

        static fromColor(color = colorType) {
            return new SolidBrush(color)
        }

        draw(ctx = canvasRenderingContext2D, {color}) {
            ctx.canvas.width = 1;
            ctx.canvas.height = 1;
            ctx.fillStyle = color;
            ctx.fillRect(0, 0, 1, 1);
        }
    }

    exports.SolidBrush = SolidBrush;

    class HatchStyle {
        static LargeCheckerBoard = 'LargeCheckerBoard';
        static SmallCheckerBoard = 'SmallCheckerBoard';
    }

    exports.HatchStyle = HatchStyle;

    class HatchBrush extends Brush {
        constructor(hatchStyle, foreColor = colorType, backColor = colorType) {
            super({hatchStyle, foreColor, backColor});
        }

        draw(ctx, {hatchStyle, foreColor = colorType, backColor = colorType}) {
            function resize(width, height) {
                ctx.canvas.width = width;
                ctx.canvas.height = height;
            }

            if (hatchStyle === HatchStyle.LargeCheckerBoard || hatchStyle === HatchStyle.SmallCheckerBoard) {
                // Give the pattern a width and height of 50
                const w = (hatchStyle === HatchStyle.LargeCheckerBoard) ? 20 : 10;
                const h = (hatchStyle === HatchStyle.LargeCheckerBoard) ? 20 : 10;
                resize(2 * w, 2 * h);

                // Give the pattern a background color and draw an arc
                ctx.fillStyle = foreColor;
                ctx.fillRect(0, 0, w, h);
                ctx.fillRect(w, h, w, h);
                ctx.fillStyle = backColor;
                ctx.fillRect(w, 0, w, h);
                ctx.fillRect(0, h, w, h);
                ctx.stroke();
            } else {
                throw new Error(`Unknown hatch style ${hatchStyle}`)
            }
        }
    }

    exports.HatchBrush = HatchBrush;

    class Pen extends Obj {
        brush = brushType
        color = colorType
        width = number

        initWithBrush(brush = brushType, width = 1.0) {
            this.brush = brush;
            this.width = width;
            this.init()
            return this
        }

        static fromBrush(brush = brushType, width = 1.0) {
            return new this().initWithBrush(brush, width);
        }

        static fromColor(color = colorType, width = 1.0) {
            return new this().initWithColor(color, width);
        }

        initWithColor(color = colorType, width = 1.0) {
            this.color = color;
            this.width = width;
            this.init()
            return this
        }

        pattern(ctx = canvasRenderingContext2D, repeatX = true, repeatY = true) {
            if (this.brush) {
                return this.brush.pattern(ctx, repeatX, repeatY);
            } else {
                return this.color.toHtml();
            }
        }

        configure(ctx = canvasRenderingContext2D) {
            ctx.lineWidth = this.width;
            ctx.strokeStyle = this.pattern(ctx);
        }
    }

    exports.Pen = Pen;
    let penType = 0 ? new Pen() : nil;
    exports.penType = penType;

    let htmlCanvasElement = document.createElement("canvas");
    htmlCanvasElement = nil;
    exports.htmlCanvasElement = htmlCanvasElement;

    let canvasRenderingContext2D = document.createElement("canvas").getContext("2d");
    canvasRenderingContext2D = nil;
    exports.canvasRenderingContext2D = canvasRenderingContext2D;

    class Graphics extends Obj {
        context = canvasRenderingContext2D;
        ClipBounds = rectangleType;

        get canvas() {
            return this.context.canvas;
        }

        init() {
            ArgumentNullException.throwIfNull(this.context, "this.context of Graphics")
            this.setClip(Rectangle.Empty);
            return this;
        }

        initWithContext(context = canvasRenderingContext2D) {
            this.context = context;
            this.init()
            return this;
        }

        initWithCanvas(canvas = htmlCanvasElement) {
            this.initWithContext(canvas.getContext("2d"));
            return this;
        }

        static fromContext(context = canvasRenderingContext2D) {
            return new this().initWithContext(context)
        }

        static fromCanvas(canvas = htmlCanvasElement) {
            return new this().initWithCanvas(canvas)
        }

        configurePen(ctx, pen) {
            if (StringType.is(pen))
                pen = Color.parse(pen);
            if (Color.is(pen))
                pen = Pen.fromColor(pen);
            pen.configure(ctx);
        }

        configureBrush(ctx, brush) {
            if (StringType.is(brush))
                brush = Color.parse(brush);
            if (Color.is(brush))
                brush = SolidBrush.fromColor(Color.cast(brush));
            brush.configure(ctx);
        }

        configureClip(ctx, bounds = this.ClipBounds) {
            if (!bounds.isEmpty()) {
                ctx.rect(bounds.X, bounds.Y, bounds.Width, bounds.Height);
                ctx.clip();
            }
        }

        configureFont(ctx, font = fontType) {
            ctx.font = font.toHtml()
        }

        configureTextAlign(ctx = canvasRenderingContext2D, textAlign = number) {
            if (textAlign === ContentAlignment.TopLeft || textAlign === ContentAlignment.BottomLeft || textAlign === ContentAlignment.MiddleLeft) {
                ctx.textAlign = "left";
            }
            if (textAlign === ContentAlignment.TopRight || textAlign === ContentAlignment.BottomRight || textAlign === ContentAlignment.MiddleRight) {
                ctx.textAlign = "right";
            }
            if (textAlign === ContentAlignment.TopCenter || textAlign === ContentAlignment.BottomCenter || textAlign === ContentAlignment.MiddleCenter) {
                ctx.textAlign = "center";
            }
            if (textAlign === ContentAlignment.TopLeft || textAlign === ContentAlignment.TopCenter || textAlign === ContentAlignment.TopRight) {
                ctx.textBaseline = "top";
            }
            if (textAlign === ContentAlignment.MiddleLeft || textAlign === ContentAlignment.MiddleCenter || textAlign === ContentAlignment.MiddleRight) {
                ctx.textBaseline = "middle";
            }
            if (textAlign === ContentAlignment.BottomLeft || textAlign === ContentAlignment.BottomCenter || textAlign === ContentAlignment.BottomRight) {
                ctx.textBaseline = "bottom";
            }
        }

        setClip(rect = rectangleType) {
            this.ClipBounds = rect;
        }

        drawShape(pen, shapeFn) {
            const ctx = this.context;
            ctx.save();
            this.configurePen(ctx, pen);
            this.configureClip(ctx, this.ClipBounds);
            ctx.beginPath();
            shapeFn(ctx);
            ctx.stroke();
            ctx.restore();
        }

        fillShape(brush, shapeFn) {
            const ctx = this.context;
            ctx.save();
            this.configureBrush(ctx, brush);
            this.configureClip(ctx, this.ClipBounds);
            ctx.beginPath();
            shapeFn(ctx);
            ctx.fill();
            ctx.restore();
        }

        arc(rect = rectangleType, startAngle = number, endAngle = number, ctx = this.context) {
            // ctx.beginPath();
            ctx.moveTo(rect.Right, rect.Center.Y);
            ctx.ellipse(rect.Center.X, rect.Center.Y, rect.Extents.Width, rect.Extents.Height, 0, -startAngle, -endAngle, true);
        }

        drawArc(pen, rect = rectangleType, startAngle = number, endAngle = number) {
            this.drawShape(pen, (ctx = canvasRenderingContext2D) => {
                this.arc(rect, startAngle, endAngle, ctx);
            });
        }

        fillArc(pen, rect = rectangleType, startAngle = number, endAngle = number) {
            this.fillShape(pen, (ctx = canvasRenderingContext2D) => {
                this.arc(rect, startAngle, endAngle, ctx);
            });
        }

        rectangle(rect = rectangleType, radius = 0, ctx = this.context) {
            if (radius >= 0) {
                ctx.roundRect(rect.X, rect.Y, rect.Width, rect.Height, radius);
            } else {
                ctx.rect(rect.X, rect.Y, rect.Width, rect.Height);
                // ctx.moveTo(rect.Left, rect.Top);
                // ctx.lineTo(rect.Left, rect.Bottom);
                // ctx.lineTo(rect.Right, rect.Bottom);
                // ctx.lineTo(rect.Right, rect.Top);
                // ctx.closePath();
                // ctx.lineTo(rect.Left, rect.Top);
            }
        }

        drawRectangle(pen, rect = rectangleType, radius = 0) {
            this.drawShape(pen, (ctx = canvasRenderingContext2D) => {
                this.rectangle(rect, radius, ctx);
            });
        }

        fillRectangle(brush, rect = rectangleType, radius = 0) {
            this.fillShape(brush, (ctx = canvasRenderingContext2D) => {
                this.rectangle(rect, radius, ctx);
            });
        }
    }

    exports.Graphics = Graphics;
    let graphicsType = 0 ? new Graphics() : nil;
    exports.graphicsType = graphicsType;

    class BoundsSpecified {
        static X = 0x1;
        static Y = 0x2;
        static Width = 0x4;
        static Height = 0x8;
        static Location = this.X | this.Y;
        static Size = this.Width | this.Height;
        static All = this.Location | this.Size;
        static None = 0;
    }

    exports.BoundsSpecified = BoundsSpecified;

    class ContentAlignment {
        /// <summary>
        /// Content is vertically aligned at the top, and horizontally aligned on the left.
        /// </summary>
        static TopLeft = 0x001;
        /// <summary>
        /// Content is vertically aligned at the top, and horizontally aligned at the center.
        /// </summary>
        static TopCenter = 0x002;
        /// <summary>
        /// Content is vertically aligned at the top, and horizontally aligned on the right.
        /// </summary>
        static TopRight = 0x004;
        /// <summary>
        /// Content is vertically aligned in the middle, and horizontally aligned on the left.
        /// </summary>
        static MiddleLeft = 0x010;
        /// <summary>
        /// Content is vertically aligned in the middle, and horizontally aligned at the center.
        /// </summary>
        static MiddleCenter = 0x020;
        /// <summary>
        /// Content is vertically aligned in the middle, and horizontally aligned on the right.
        /// </summary>
        static MiddleRight = 0x040;
        /// <summary>
        /// Content is vertically aligned at the bottom, and horizontally aligned on the left.
        /// </summary>
        static BottomLeft = 0x100;
        /// <summary>
        /// Content is vertically aligned at the bottom, and horizontally aligned at the center.
        /// </summary>
        static BottomCenter = 0x200;
        /// <summary>
        /// Content is vertically aligned at the bottom, and horizontally aligned on the right.
        /// </summary>
        static BottomRight = 0x400;
    }

    exports.ContentAlignment = ContentAlignment;

    function DefaultFontFamily() {
        return "IBM Plex Sans";
    }

    exports.DefaultFontFamily = DefaultFontFamily;

    function DefaultFontSize() {
        let fontSize = 21;
        if (window.innerWidth < 500)
            fontSize = 18;
        if (window.innerWidth < 400)
            fontSize = 16;
        return fontSize;
    }

    exports.DefaultFontSize = DefaultFontSize;

    class Font extends Obj {
        Family = DefaultFontFamily();
        Size = DefaultFontSize();

        constructor(family = DefaultFontFamily(), size = DefaultFontSize()) {
            super()
            this.Family = family
            this.Size = size
        }

        toHtml() {
            return `${this.Size}px ${this.Family}`
        }
    }

    exports.Font = Font;
    let fontType = 0 ? new Font() : nil;
    exports.fontType = fontType;

    class Control extends Obj {
        _x = 0;
        _y = 0;
        _width = 0;
        _height = 0;

        Font = new Font();

        ForeColor = Color.Black;
        BackColor = Color.Transparent;

        init() {
            super.init();
        }

        get Bounds() {
            return new Rectangle(this._x, this._y, this._width, this._height);
        }

        set Bounds(rect) {
            this.setBounds(rect.X, rect.Y, rect.Width, rect.Height, BoundsSpecified.All);
        }

        get Location() {
            return Point.make(this._x, this._y);
        }

        set Location(pt) {
            this.setBounds(pt.X, pt.Y, this._width, this._height, BoundsSpecified.Location);
        }

        get Size() {
            return new Size(this._width, this._height);
        }

        set Size(sz) {
            this.setBounds(this._x, this._y, sz.Width, sz.Height, BoundsSpecified.Size);
        }

        get Left() {
            return this._x;
        }

        set Left(value) {
            this.setBounds(value, this._y, this._width, this._height, BoundsSpecified.X);
        }

        get Top() {
            return this._x;
        }

        set Top(value) {
            this.setBounds(this._x, value, this._width, this._height, BoundsSpecified.Y);
        }

        get Right() {
            return this._x + this._width;
        }

        get Bottom() {
            return this._y + this._height;
        }

        setBounds(x, y, width, height, specified) {
            if ((specified & BoundsSpecified.X) === BoundsSpecified.None) {
                x = this._x;
            }

            if ((specified & BoundsSpecified.Y) === BoundsSpecified.None) {
                y = this._y;
            }

            if ((specified & BoundsSpecified.Width) === BoundsSpecified.None) {
                width = this._width;
            }

            if ((specified & BoundsSpecified.Height) === BoundsSpecified.None) {
                height = this._height;
            }
            if (this._x !== x || this._y !== y || this._width !== width || this._height !== height) {
                this.setBoundsCore(x, y, width, height);
            }
        }

        setBoundsCore(x, y, width, height) {
            this._x = x;
            this._y = y;
            this._width = width;
            this._height = height;
        }

        paint(g = graphicsType) {
        }
    }

    exports.Control = Control;

    class Label extends Control {
        Text = "";
        TextAlign = ContentAlignment.TopLeft;

        paint(g = graphicsType) {
            super.paint(g);
            let ctx = g.context;
            ctx.save();
            g.configureBrush(ctx, this.ForeColor);
            g.configureFont(ctx, this.Font);
            g.configureTextAlign(ctx, this.TextAlign);
            g.configureClip(ctx, g.ClipBounds);
            ctx.translate(this._x, this._y);
            ctx.fillText(this.Text, 0, 0)
            ctx.restore();
        }
    }

    exports.Label = Label;

    Object.assign(exports, System);

})(window);

!(function Engine(exports) {

    function numeric(s = string) {
        return StringType.is(s) && isFinite(parseInt(s));
    }

    function parseCoords(dimensions, s = string) {
        if (StringType.is(s)) {
            if (s.includes(",")) {
                let coords = s.split(",").map(x => Integer.parse(x));
                for (let n of coords) {
                    assert(() => n instanceof Integer);
                }
                assert(() => coords.length === 2)
                return coords[0] * dimensions + coords[1];
            }
        }
    }

    exports.Sqrt = function Sqrt(x) {
        return Math.sqrt(x);
    }
    exports.Floor = function Floor(x) {
        return Math.floor(x);
    }
    exports.Ceil = function Ceil(x) {
        return Math.ceil(x);
    }
    exports.Abs = function Abs(x) {
        return Math.abs(x);
    }
    exports.Min = function Min(...values) {
        return Math.min(...values);
    }
    exports.Max = function Max(...values) {
        return Math.max(...values);
    }
    exports.Sin = function Sin(x) {
        return Math.sin(x);
    }
    exports.Cos = function Cos(x) {
        return Math.cos(x);
    }
    exports.Log2 = function Log2(x) {
        return Math.log2(x);
    }
    exports.ApproxEqual = function ApproxEqual(x, y, epsilon = 0.0001) {
        return Abs(x - y) <= epsilon;
    }
    exports.IsPow2 = function IsPow2(i) {
        // noinspection JSBitwiseOperatorUsage
        return Integer.is(i) && !((i - 1) & i) && (i !== 0);
    }

    // Epsilons: the defaults assume the world is in meters.
    exports.GR_SMALLEST_UNIT = 0.0009765625

    class Operators {
        constructor(data) {
            this._data = [...data]
        }

        static from(x) {
            // somehow this is the only form that Webstorm's type-checker resolves subclasses with.
            return null ? new this() : (() => {
                if (x instanceof this) {
                    return x
                }
                if (x instanceof Array) {
                    return this.make(x)
                }
                ArgumentException.throw(`Can't convert to ${this.name}`, `${this.name}.from`)
            })()
        }

        static cast(x) {
            if (!(x instanceof this))
                throw new TypeError(`Expected ${this.name}, got ${x}`)
            return null ? new this() : x;
        }

        data() {
            return this._data
        }

        coordToIndex(coord) {
            assert(() => coord instanceof ArrayType)
            assert(() => coord.length === 2)
            assert(() => coord[0] instanceof Integer)
            assert(() => coord[1] instanceof Integer)
            let r = coord[0] * this.dimensions() + coord[1];
            assert(() => r instanceof Integer);
            return r;
        }

        at(i, defaultValue = 0.0) {
            if (i instanceof Array)
                i = this.coordToIndex(i);
            return this.data()[i] ?? defaultValue
        }

        set(i, v) {
            assert(() => v instanceof Real)
            if (i instanceof Array)
                i = this.coordToIndex(i);
            this.data()[i] = v;
            return v;
        }

        get [Symbol.toStringTag]() {
            return this.constructor.name;
        }

        * [Symbol.iterator]() {
            for (let v of this.data()) yield v;
        }

        toString() {
            return `${this.constructor.name}(${this.data()})`;
        }

        toJSON() {
            return this.data();
        }

        static meta = {
            getPrototypeOf(self) {
                // console.log(me, self, `proto of ${self}`, ...args);
                return Object.getPrototypeOf(self)
            },
            get(self, name) {
                // console.log(`${self.constructor.name}.${name.toString()}`)
                let val = self[name];
                if (val != null || !(name instanceof StringType))
                    return val;

                val = self.data()[name]
                if (val != null) {
                    if (name === "length" || numeric(name))
                        return val;
                }

                let idx = parseCoords(self.dimensions(), name);
                if (idx != null)
                    return self.data()[idx]

                console.log(`Unknown: ${self.constructor.name}.${name.toString()}`)
            },
            set(self, name, value) {
                if (name === "_data") {
                    self[name] = value
                    return true;
                }
                let idx = parseCoords(self.dimensions(), name);
                if (idx == null) {
                    if (numeric(name)) {
                        idx = Integer.parse(name)
                    }
                }
                if (idx != null) {
                    assert(() => self.data()[idx] instanceof Real);
                    self.data()[idx] = value;
                    return true;
                }
                return false;
            }
        }

        static make(...components) {
            if (components.length === 1) {
                if (components[0] instanceof this) {
                    return components[0];
                }
                if (components[0] instanceof Array) {
                    components = components[0];
                }
            }
            let self = new this(components);
            return new Proxy(self, this.meta);
        }

    }

    let MVecType = class MVec extends Operators {
        static make(...components) {
            return MVec.cast(super.make(...components));
        }

        get [Symbol.toStringTag]() {
            return `MVec{${this.dimensions()}}`;
        };

        static fill(dim, x) {
            return new MVecProxy(new Array(dim).fill(x))
        }

        static zeros(dim) {
            return this.fill(dim, 0.0);
        }

        static ones(dim) {
            return this.fill(dim, 1.0);
        }

        clone() {
            return new MVecProxy(this.data())
        }

        from(x) {
            if (NumberType.is(x)) {
                return MVec.fill(this.dimensions(), x);
            }
            if (x instanceof MVec) {
                if (x.dimensions() !== this.dimensions()) {
                    ArgumentException.throw("Dimension mismatch", "MVec.from")
                }
            }
            return MVec.from(x);
        }

        get shape() {
            return [this.data().length]
        }

        dimensions() {
            return this.data().length;
        }

        // in-place op
        op_(f, ...args) {
            args = args.map(x => this.from(x));
            for (let i = 0; i < this.dimensions(); i++) {
                const value = f(this.at(i), ...args.map(self => self.at(i)))
                this.set(i, value)
            }
            return this;
        }

        add_(s) {
            return this.op_((x, y) => x + y, s)
        }

        sub_(s) {
            return this.op_((x, y) => x - y, s)
        }

        mul_(s) {
            return this.op_((x, y) => x * y, s)
        }

        div_(s) {
            return this.op_((x, y) => x / y, s)
        }

        op(f, ...args) {
            return this.clone().op_(f, ...args)
        }

        add(s) {
            return MVec.cast(this.op((x, y) => x + y, s))
        }

        sub(s) {
            return MVec.cast(this.op((x, y) => x - y, s))
        }

        mul(s) {
            return MVec.cast(this.op((x, y) => x * y, s))
        }

        div(s) {
            return MVec.cast(this.op((x, y) => x / y, s))
        }

        fill(v) {
            return MVec.cast(this.op((_x, y) => y, v));
        }

        fill_(v) {
            return MVec.cast(this.op_((_x, y) => y, v));
        }

        assign(other = mvecType) {
            this._data = [...other.data()]
            return this
        }

        zeros() {
            return this.fill(0.0);
        }

        ones() {
            return this.fill(1.0);
        }

        zero_() {
            return this.fill_(0.0);
        }

        sum() {
            let r = 0.0;
            for (let i = 0; i < this.dimensions(); i++) {
                r += this.at(i)
            }
            return r;
        }

        dot(v) {
            return this.mul(v).sum()
        }

        magSqr() {
            return this.dot(this)
        }

        mag() {
            return Math.sqrt(this.magSqr())
        }

        normalized() {
            return this.div(this.mag())
        }

        lerp(v, t) {
            let a = this
            let b = this.from(v)
            return b.sub(a).mul(t).add(a)
        }

        proj(v = mvecType) {
            let t = this.dot(v) / v.dot(v)
            return v.mul(t)
        }

        static gramschmidt(u = mvecArray) {
            u = u.map(x => MVec.from(x))
            let dim = u[0].dimensions()
            if (u.length !== dim) {
                ArgumentException.throw("Length mismatch", "MVec.gramschmidt")
            }
            let v = u.map(x => x.clone())
            for (let i = 0; i < dim; i++) {
                for (let j = 0; j < i; j++) {
                    v[i].sub_(u[i].proj(v[j]))
                }
            }
            return v;
        }

        cross(...others) {
            let vecs = [this, ...others.map(v => MVec.from(v))]
            assert(() => vecs.length === this.dimensions() - 1)
            for (let v of vecs) {
                assert(() => v.dimensions() === this.dimensions())
            }

            function rotateValues(l, i) { return l.concat(l.splice(0, i)); }

            if (this.dimensions() === 3 || true) {
                let N = this.dimensions()
                let M = MMat.zeros(N - 1)
                // let M2 = MMat.zeros(N - 1)
                let out = new Array(N);
                for (let axis = 0; axis < N; axis++) {

                    let inds = rotateValues(iota(N), axis);
                    for (let i = 0; i < vecs.length; i++) {
                        for (let j = 0; j < vecs.length; j++) {
                            // M[[j, i]] = vecs[i].at((axis + j + 1) % N)
                            M[[j, i]] = vecs[i].at(inds[j + 1])
                        }
                    }

                    // M2[[0, 0]] = vecs[0].at((axis + 1) % 3);
                    // M2[[1, 0]] = vecs[0].at((axis + 2) % 3);
                    //
                    // M2[[0, 1]] = vecs[1].at((axis + 1) % 3);
                    // M2[[1, 1]] = vecs[1].at((axis + 2) % 3);
                    // debugger;
                    out[axis] = M.determinant()
                }
                return MVec.from(out);
            } else if (this.dimensions() === 3) {
                let other = vecs[1]
                return MVec.from(vec_cross(this.data(), other.data()))
            }
            else {
                assert(false, "Not yet implemented")
            }
        }

        wedge(that) {
            that = MVec.from(that);
            assert(() => this.dimensions() === that.dimensions())
            let N = this.dimensions();
            if (N === 2) {
                let [a, b] = this.data()
                let [A, B] = that.data()
                return a*B - b*A // e1^e2
            } else if (N === 3) {
                let [a, b, c] = this.data()
                let [A, B, C] = that.data()
                //  1  e1^e2  e3^e1
                //     1      e2^e3
                //         1
                return MVec.from([
                    (b*C - c*B), // e2^e3
                   -(a*C - c*A), // e3^e1
                    (a*B - b*A), // e1^e2
                ])
            } else if (N === 4) {
                let [a, b, c, d] = this.data()
                let [A, B, C, D] = that.data()
                return MVec.from([
                    (b*C - c*B), // e2^e3
                   -(a*C - c*A), // e3^e1
                    (a*B - b*A), // e1^e2

                    (c*D - d*C), // e3^e4
                   -(d*A - a*D), // e4^e1
                    (b*D - d*B), // e2^e4
                ])

            } else {
                assert(false, "Not yet implemented")
            }
        }

        cross2d() {
            assert(() => this.dimensions() === 2)
            return MVec.from([this.at(1), -this.at(0)])
        }

    }
    exports.MVecType = MVecType;
    let MVecProxy = 0 ? () => new MVec() : new Proxy(MVecType, {
        apply: (target, thisArg, args) => MVecType.make(...args),
        construct: (cls, args, self) => MVecType.make(...args)
    })

    let mvecType = 0 ? new MVecType() : nil;
    exports.mvecType = mvecType;

    let mvecArray = 0 ? [new MVecType()] : nil;
    exports.mvecArray = mvecArray;

    let MVec = 0 ? MVecType : 0 ? () => mvecType : MVecProxy;
    exports.MVec = MVec;

    let MMatType = class MMat extends Operators {
        constructor(data) {
            assert(() => Sqrt(data.length) instanceof Integer,
                "Square matrices only")
            super(data)
        }

        static cast(x) { return 0 ? new this() : x; }

        static fill(dim, value) {
            let data = new Array(dim*dim).fill(value)
            return 0 ? new this() : MMatType.make(...data);
        }

        static zeros(dim) {
            return 0 ? new this() : this.fill(dim, 0)
        }

        zeros() {
            return 0 ? new MMat() : MMat.zeros(this.dimensions())
        }

        static ident(dim) {
            let mat = this.zeros(dim);
            for (let i = 0; i < mat.dimensions(); i++) {
                mat.set([i, i], 1);
            }
            return 0 ? new this() : mat;
        }

        ident() {
            return 0 ? new MMat() : MMat.ident(this.dimensions())
        }

        // static from(x) {
        //     return 0 ? new this() : super.from(x);
        // }

        get shape() {
            let n = Sqrt(this.data().length);
            assert(() => Integer.is(n))
            return [n, n];
        }

        dimensions() {
            return this.shape[0];
        }

        add(m = mmatType || number) {
            if (m instanceof Real) {
                m = MMat.fill(this.dimensions(), m);
            }
            assert(() => m instanceof MMat)
            let res = this.zeros();
            for (let i = 0; i < this.shape[0]; i++) {
                for (let j = 0; j < this.shape[1]; j++) {
                    res.set([i, j], m.at([i, j]) + this.at([i, j]))
                }
            }
            return 0 ? new MMat() : res;
        }

        mul(m = mmatType || number) {
            let res = this.zeros();
            if (m instanceof Real) {
                for (let i = 0; i < this.shape[0]; i++) {
                    for (let j = 0; j < this.shape[1]; j++) {
                        res.set([i, j], m * this.at([i, j]))
                    }
                }
            } else {
                assert(() => m instanceof MMat)
                let A = this;
                let B = MMat.from(m);
                assert(() => A.dimensions() === B.dimensions())
                for (let i = 0; i < A.shape[0]; i++) {
                    for (let j = 0; j < B.shape[1]; j++) {
                        let r = 0.0;
                        for (let k = 0; k < A.shape[1]; k++) {
                            r += A.at([i, k]) * B.at([k, j]);
                        }
                        res.set([i, j], r);
                    }
                }
            }
            return 0 ? new MMat() : res;
        }

        assign(other = mmatType) {
            this._data = other.data()
            return this;
        }

        add_(m = mmatType) {
            this.assign(this.add(m));
            return this;
        }

        mul_(m = mmatType) {
            this.assign(this.mul(m));
            return this;
        }

        transform(v = mvecType) {
            v = MVec.from(v);
            let res = MVec.zeros(this.dimensions())
            for (let k = 0; k < this.dimensions(); k++) {
                for (let i = 0; i < this.shape[0]; i++) {
                    let a = this.at([k, i])
                    let b = v.at(i, 1.0);
                    res.set(k, res.at(k) + a * b);
                    // console.log(`res[${k}] += a[${this.coordToIndex([k, i])}] * b[${i}]`)
                }
            }

            return res;

        }

        static scale(dim, s) {
            let v = s instanceof Real ? MVec.fill(dim, s) : MVec.from(s)
            let mat = MMat.ident(dim)
            for (let i = 0; i < dim; i++) {
                let by = v.at(i, (s instanceof Real) ? s : 1)
                mat.set([i, i], mat.at([i, i]) * by)
            }
            return mat;
        }
        scale(s) { return this.mul(MMat.scale(this.dimensions(), s)) }
        scale_(s) { this.assign(this.scale(s)); return this; }

        static translate(dim, by) {
            let v = by instanceof Real ? MVec.fill(dim, by) : MVec.from(by);
            let mat = MMat.ident(dim)
            for (let i = 0; i < dim-1; i++) {
                mat.set([i, dim-1], v.at(i, (by instanceof Real) ? by : 0))
            }
            return mat;
        }

        translate(s) { return this.mul(MMat.translate(this.dimensions(), s)) }
        translate_(s) { this.assign(this.translate(s)); return this; }
        
        squareData() {
            let R = [];
            for (let i = 0; i < this.dimensions(); i++) {
                let row = [];
                for (let j = 0; j < this.dimensions(); j++) {
                    row.push(this.at([i, j]))
                }
                R.push(row);
            }
            return R;
        }

        transpose() {
            let res = this.zeros()
            for (let i = 0; i < this.dimensions(); i++) {
                for (let j = 0; j < this.dimensions(); j++) {
                    res[[j, i]] = this[[i, j]]
                }
            }
            return res;
        }
        
        negate() {
            return 0 ? new MMatType() : this.mul(-1);
        }

        static rotate(dim = number, axis = mvecType, angle = number) {
            assert(() => dim === 4 || dim === 3 || dim === 2, "Not yet implemented")
            let A = this.axisMatrix(axis ?? MVec.make(1))

            // Rodrigues rotation formula https://en.wikipedia.org/wiki/Rodrigues%27_rotation_formula#Matrix_notation
            // Also see https://www.researchgate.net/publication/283007638_Simple_Double_and_Isoclinic_Rotations_with_a_Viable_Algorithm_MATHEMATICAL_SCIENCES_AND_APPLICATIONS_E-NOTES_8_1_1-14_2020
            //
            // R = I + A sin(angle) + A^2 (1 - cos(angle))
            //
            let R = MMat.ident(dim);
            R.add_( A.mul( Sin(angle) ) )
            R.add_( A.mul(A).mul( 1 - Cos(angle) ) )
            return R;
        }
        
        static axisMatrix(axis = mvecType) {
            axis = MVec.from(axis);
            // build the upper triangular.
            let U;
            if (axis.dimensions() === 1) {
                // 0,0 -0,1
                //      1,1
                U = MMat.zeros(2);
                U[[0, 1]] = -axis.at(0);
            } else if (axis.dimensions() === 3) {
                U = MMat.zeros(3);
                //       -0,1  +0,2
                // +1,0        -1,2
                // -2,0  +2,1
                U[[0, 1]] = -axis.at(2);
                U[[0, 2]] =  axis.at(1);
                U[[1, 2]] = -axis.at(0);
            } else if (axis.dimensions() === 6) {
                U = MMat.zeros(4);
                //       -0,1  +0,2  -0,3
                //             -1,2  +1,3
                //                   -2,3
                //
                U[[0, 1]] = -axis.at(2);
                U[[0, 2]] =  axis.at(1);
                U[[1, 2]] = -axis.at(0);

                U[[0, 3]] = -axis.at(4);
                U[[1, 3]] =  axis.at(5);
                U[[2, 3]] = -axis.at(3);
            } else {
                assert(() => false, `axis.dimensions() of ${axis.dimensions()} not implemented for MMat.axisMatrix()`)
            }
            // set lower triangular to the negation of the upper triangular.
            let L = U.transpose().negate();

            // the skew-symmetric matrix is the lower triangular plus the upper triangular.
            return L.add(U);
        }
        
        rotationAxis() {
            // https://en.wikipedia.org/wiki/Rotation_matrix#Determining_the_axis
            let M = this.add( this.transpose().negate() );
            let res;
            if (this.dimensions() === 2) {
                res = MVec(
                    M[[1,0]],
                )
            } else if (this.dimensions() === 3) {
                res = MVec(
                    M[[2,1]], -M[[2,0]], M[[1,0]]
                )
            } else if (this.dimensions() === 4) {
                res = MVec(
                    M[[2,1]], -M[[2,0]],  M[[1,0]],
                    M[[3,2]],  M[[3,0]], -M[[3,1]],
                )
            } else {
                assert(() => false, `.dimensions() of ${this.dimensions()} not implemented for MMat.rotationMatrix()`)
            }
            return res.normalized()
        }
        
        rotationAngle() {
            // https://en.wikipedia.org/wiki/Rotation_matrix#Determining_the_angle
            let axis = this.rotationAxis()
            let sin_theta = -this.mul(MMat.axisMatrix(axis)).trace() / 2
            let cos_theta = (this.trace() - (this.dimensions() - 2)) / 2
            return Math.atan2(sin_theta, cos_theta)
        }
        
        trace() {
            let res = 0;
            for (let i = 0; i < this.dimensions(); i++) {
                res += this.at([i, i])
            }
            return res;
        }

        determinant() {
            // https://en.wikipedia.org/wiki/Determinant#n_%C3%97_n_matrices
            assert(() => this.shape[0] === this.shape[1])
            let N = this.shape[0];
            let sum = 0;
            for (let sigma of permutations(iota(N))) {
                let v = permutationSign(sigma);
                for (let i = 0; i < N; i++) {
                    v *= this.at([i, sigma[i]])
                }
                sum += v;
            }
            return sum;
        }
    };
    exports.MMatType = MMatType;
    let MMatProxy = 0 ? () => mmatType : new Proxy(MMatType, {
        apply: (target, thisArg, args) => MMatType.make(...args),
        construct: (cls, args, _self) => MMatType.make(...args)
    });
    let mmatType = exports.mmatType = 0 ? new MMatType() : nil;
    let mmatArray = exports.mmatArray = 0 ? [new MMatType()] : nil;
    exports.MMat = MMatProxy;

    class MPlane {
        Normal = mvecType
        D = number

        constructor(normal = new MVec([0, 1, 0]), d = 0.0) {
            this.Normal = MVec.from(normal).clone()
            this.D = d
        }

        clone() {
            return MPlane.fromNormalDistance(this.Normal, this.D)
        }

        static fromNormalDistance(normal = mvecType, distance = number) {
            return new MPlane(normal, distance)
        }

        static fromNormalPoint(normal = mvecType, point = mvecType) {
            normal = MVec.from(normal).normalized()
            let d = -normal.dot(point)
            return MPlane.fromNormalDistance(normal, d)
        }

        dist(point = mvecType) {
            return this.Normal.dot(point) + this.D
        }

        getSide(pt = mvecType, epsilon = number) {
            let dist = this.dist(pt);
            if (Math.abs(dist) < epsilon)
                return 0;
            return dist >= 0 ? 1 : -1;
        }
    }

    exports.MPlane = MPlane;
    let planeType = 0 ? new MPlane([]) : nil;
    exports.planeType = planeType;

    class SPolygonVertex {
        constructor(dim = 3) {
            this.Position = MVec.zeros(dim)
        }

        static cast(x) {
            if (!(x instanceof this))
                throw new TypeError(`Expected ${this.name}, got ${x}`)
            return null ? new this() : x;
        }

        assign(vertex = vertexType) {
            this.Position.assign(vertex.Position)
            return this
        }

        clone() {
            let self = SPolygonVertex.fromPosition(this.Position);
            return self;
        }

        static fromPosition(position) {
            position = MVec.from(position)
            let self = new SPolygonVertex(position.dimensions());
            self.Position.assign(position)
            return self
        }

        lerp(other = vertexType, t = number) {
            let out = SPolygonVertex.fromPosition(this.Position.lerp(other.Position, t))
            return out
        }

        static from(v) {
            if (v instanceof SPolygonVertex) {
                return v;
            }
            if (v instanceof MVec || v instanceof Array) {
                return this.fromPosition(v);
            }
            ArgumentException.throw("Can't convert to SPolygonVertex", "SPolygonVertex.from")
        }

    }

    exports.SPolygonVertex = SPolygonVertex;

    let vertexType = 0 ? new SPolygonVertex() : nil;
    exports.vertexType = vertexType;

    let vertexArray = 0 ? [new SPolygonVertex()] : nil;
    exports.vertexArray = vertexArray;

    class GrPolygon {
        _vertices = vertexArray
        _plane = planeType

        constructor() {
            this._vertices = []
            this._plane = new MPlane();
        }

        initWithPolygon(polygon = polygonType) {
            this.init(polygon._vertices)
            this._plane = polygon._plane.clone()
            return this
        }

        setVertices(verts = vertexArray, plane = planeType) {
            this.init(verts)
            if (plane instanceof Nil)
                this.calcPlane()
            else
                this._plane = plane.clone()
        }

        static fromVertices(vertices = vertexArray) {
            let self = new GrPolygon()
            self.setVertices(vertices)
            return self
        }

        clear() {
            this._vertices.length = 0
        }

        init(verts = vertexArray) {
            this.clear()
            for (let vertex of verts) {
                this.addVertex(vertex);
            }
        }

        calcPlane() {
            /*
            // calculate the actual plane of the surface.
            unsigned int vertexCount = GetVertexCount();
            for ( unsigned int i = 2; i < vertexCount; ++i )
            {
                // get the edges.
                MVec3 edge0 = _vertices[ i ].position - _vertices[ i-1 ].position;
                MVec3 edge1 = _vertices[ i ].position - _vertices[ i-2 ].position;
                if ( edge0.MagSqr() <= 0.0001f || edge1.MagSqr() <= 0.0001f )
                    continue;

                MVec3 normal = edge1.Normalized().Cross( edge0.Normalized() );
                if ( normal.MagSqr() > 0.0001f )
                {
                    _plane = MPlane( normal, _vertices[ i ].position );
                    return;
                }
            }
             */
            // calculate the actual plane of the surface.
            for (let i = 2; i < this.getVertexCount(); i++) {
                // get the edges.
                let edge0 = this._vertices[i].Position.sub(this._vertices[i - 1].Position)
                let edge1 = this._vertices[i].Position.sub(this._vertices[i - 2].Position)
                if (edge0.magSqr() <= 0.0001 || edge1.magSqr() <= 0.0001)
                    continue

                let normal = edge1.normalized().cross(edge0.normalized())
                if (normal.magSqr() > 0.0001) {
                    this._plane = MPlane.fromNormalPoint(normal, this._vertices[i].Position)
                    return;
                }
            }
            Exception.throw("TODO")
        }

        addVertex(vertex = vertexType) {
            this._vertices.push(SPolygonVertex.from(vertex).clone())
        }

        getVertexCount() {
            return this._vertices.length;
        }

        getVertex(i) {
            return SPolygonVertex.cast(this._vertices[i] ?? ArgumentException.throw("Out of bounds", `GrPolygon.getVertex(${i})`))
        }

        // splits the polygon by a plane.  The return value is 1 if there is only
        // a front polygon, -1 if there is only a back polygon, and 0 if there is
        // both a front and back polygon.
        split(front = polygonType, back = polygonType, plane = planeType, planeDistEpsilon = number) {
            /*
            // get the number of vertices.
            unsigned int vertexCount = GetVertexCount();
            */
            let vertexCount = this.getVertexCount()

            /*
            // place to store vertices in front and in back.
            UFastArray< SPolygonVertex > frontVerts;
            UFastArray< SPolygonVertex > backVerts;
            */
            let frontVerts = []
            let backVerts = []

            /*
            // get the starting vertex.
            const SPolygonVertex* vertexA = &GetVertex( vertexCount - 1 );
            */
            let vertexA = this.getVertex(vertexCount - 1)

            /*
            // get the starting side.
            int sideA = 0;
            unsigned int vert = vertexCount;
            while ( sideA == 0 && vert-- > 0 )
                sideA = plane.GetSide( GetVertex( vert ).position, planeDistEpsilon );
            */
            let sideA = 0
            let vert = vertexCount;
            while (sideA === 0 && vert-- > 0) {
                sideA = plane.getSide(this.getVertex(vert).Position, planeDistEpsilon)
            }

            /*
            // are we entirely coplanar?
            if ( sideA == 0 )
            {
                // choose the side the polygon is facing.
                if ( GetNormal().Dot( plane.GetNormal() ) >= 0.0f )
                {
                    front = *this;
                    return 1;
                }
                else
                {
                    back = *this;
                    return -1;
                }
            }
            */
            if (sideA === 0) {
                // choose the side the polygon is facing.
                if (this.getNormal().dot(plane.getNormal()) >= 0.0) {
                    front.initWithPolygon(this)
                    return 1;
                } else {
                    back.initWithPolygon(this)
                    return -1;
                }
            }

            // simply go through the vertices and classify.
            let prevOnPlane = (vert !== (vertexCount - 1));
            for (let i = 0; i < vertexCount; ++i) {
                /*
                const SPolygonVertex* vertexB = &GetVertex( i );
                int sideB = plane.GetSide( vertexB->position, planeDistEpsilon );
                if ( sideB > 0 )
                {
                    if ( sideA < 0 )
                    {
                        if ( !prevOnPlane )
                        {
                            float distA = Abs( plane.Dist( vertexA->position ) );
                            float distB = Abs( plane.Dist( vertexB->position ) );
                            float t = distA / ( distA + distB );
                            frontVerts.Push() = backVerts.Push() = Lerp( *vertexA, *vertexB, t );
                        }
                        else
                            frontVerts.Push() = *vertexA;
                    }
                    frontVerts.Push( *vertexB );
                    prevOnPlane = false;
                }
                */
                let vertexB = this.getVertex(i)
                let sideB = plane.getSide(vertexB.Position, planeDistEpsilon)
                if (sideB > 0) {
                    if (sideA < 0) {
                        if (!prevOnPlane) {
                            let distA = Math.abs(plane.dist(vertexA.Position))
                            let distB = Math.abs(plane.dist(vertexB.Position))
                            let t = distA / (distA + distB)
                            frontVerts.push(vertexA.lerp(vertexB, t))
                            backVerts.push(vertexA.lerp(vertexB, t))
                        } else {
                            frontVerts.push(vertexA.clone())
                        }
                    }
                    frontVerts.push(vertexB.clone())
                    prevOnPlane = false
                }
                /*
                else if ( sideB < 0 )
                {
                    if ( sideA > 0 )
                    {
                        if ( !prevOnPlane )
                        {
                            float distA = Abs( plane.Dist( vertexA->position ) );
                            float distB = Abs( plane.Dist( vertexB->position ) );
                            float t = distA / ( distA + distB );
                            frontVerts.Push() = backVerts.Push() = Lerp( *vertexA, *vertexB, t );
                        }
                        else
                            backVerts.Push() = *vertexA;
                    }
                    backVerts.Push( *vertexB );
                    prevOnPlane = false;
                }
                */
                else if (sideB < 0) {
                    if (sideA > 0) {
                        if (!prevOnPlane) {
                            let distA = Math.abs(plane.dist(vertexA.Position))
                            let distB = Math.abs(plane.dist(vertexB.Position))
                            let t = distA / (distA + distB)
                            frontVerts.push(vertexA.lerp(vertexB, t))
                            backVerts.push(vertexA.lerp(vertexB, t))
                        } else {
                            backVerts.push(vertexA.clone())
                        }
                    }
                    backVerts.push(vertexB.clone())
                    prevOnPlane = false
                }
                /*
                else
                {
                    prevOnPlane = true;
                    if ( sideA == -1 )
                        backVerts.Push( *vertexB );
                    else
                        frontVerts.Push( *vertexB );
                }
                */
                else {
                    prevOnPlane = true
                    if (sideA === -1)
                        backVerts.push(vertexB.clone())
                    else
                        frontVerts.push(vertexB.clone())
                }

                /*
                // update previous vertex info.
                vertexA = vertexB;
                if ( sideB != 0 )
                    sideA = sideB;
                */
                vertexA = vertexB
                if (sideB !== 0)
                    sideA = sideB
            }

            /*
            B_ASSERT( frontVerts.GetElemCount() == 0 || frontVerts.GetElemCount() >= 3 );
            B_ASSERT( backVerts.GetElemCount() == 0 || backVerts.GetElemCount() >= 3 );
            B_ASSERT( frontVerts.GetElemCount() > 0 || backVerts.GetElemCount() > 0 );
            */
            assert(() => frontVerts.length === 0 || frontVerts.length >= 3)
            assert(() => backVerts.length === 0 || backVerts.length >= 3)
            assert(() => frontVerts.length > 0 || backVerts.length > 0)

            /*
            // if we're not coplanar, we need to create the polygon.
            int ret = 0;
            if ( frontVerts.GetElemCount() >= 3 )
            {
                front.SetVertices( _flags, frontVerts.GetPtr(), frontVerts.GetElemCount(), _material, _plane );
                ret += 1;
            }
            if ( backVerts.GetElemCount() >= 3 )
            {
                back.SetVertices( _flags, backVerts.GetPtr(), backVerts.GetElemCount(), _material, _plane );
                ret -= 1;
            }
            return ret;
            */
            let ret = 0
            if (frontVerts.length >= 3) {
                front.setVertices(frontVerts, this._plane)
                ret += 1
            }
            if (backVerts.length >= 3) {
                back.setVertices(backVerts, this._plane)
                ret -= 1
            }
            return ret
        }


    }

    exports.GrPolygon = GrPolygon;

    let polygonType = 0 ? new GrPolygon() : nil;
    exports.polygonType = polygonType;
    
    let htmlCanvasType = 0 ? document.createElement("canvas") : nil;
    let renderingContextType = 0 ? document.createElement("canvas").getContext("experimental-webgl") : nil;
    
    function CHECK_GL( gl = Gr.gl ) {
        // console.log("CHECK_GL", gl)
        if ( gl ) {
            let code = gl.getError();
            if ( code !== 0 ) {
                throw new Error(`WebGL error: ${Gr.glName( code )}`)
            }
        }
    }
    exports.CHECK_GL = CHECK_GL;
    
    class GR {
        static DEPTHTEST   = 0x0001;
        static CULLFACE    = 0x0002;
        static BLEND       = 0x0004;
        static ALPHATEST   = 0x0008;
        static SCISSORTEST = 0x0010;
        static STENCILTEST = 0x0020;
        static DEPTHBIAS   = 0x0040;
        static WIREFRAME   = 0x0080;
        /*
        //==========================================================
        // write masks.
        #define GR_RED                      0x01
        #define GR_BLUE                     0x02
        #define GR_GREEN                    0x04
        #define GR_ALPHA                    0x08
        #define GR_RGB                      0x07
        #define GR_RGBA                     0x0F
        #define GR_DEPTH                    0x10
        #define GR_STENCIL                  0x20
        */
        static RED = 0x01;
        static BLUE = 0x02;
        static GREEN = 0x04;
        static ALPHA = 0x08;
        static RGB = 0x07;
        static RGBA = 0x0F;
        static DEPTH = 0x10;
        static STENCIL = 0x20;
    } exports.GR = GR;
    
    let webglTextureType = 0 ? renderingContextType.createTexture() : nil;
    let webglBufferType = 0 ? renderingContextType.createBuffer() : nil;
    let webglProgramType = 0 ? renderingContextType.createProgram() : nil;

    class GrState {
        stateInit = false;
        
        currentState = number;
        stateStack = new Array( 256 ).fill( 0 )
        stateStackTop = 0;
        
        stencilMask = ~0;
        
        activeTexUnit = 0;
        curTextures = 0 ? [ webglTextureType ] : new Array( 16 ).fill( null );
        curTexTargets = 0 ? [ renderingContextType.TEXTURE_2D ] : new Array( 16 ).fill( 0 );
        curVB = webglBufferType;
        curIB = webglBufferType;
        curPackPB = webglBufferType;
        curUnpackPB = webglBufferType;
        curShader = webglProgramType;
        
        viewport = Rectangle.Empty;
        
        scissor = Rectangle.Empty;

        maxTextureSize = number;
        maxFramebufferSize = number;
        maxAttribCount = number;
        
        currentArrayState = ~0;
        
        // buffer write enables.
        _writeEnable = 0;

    } exports.GrState = GrState;
    
    class Gr {
        static gl = renderingContextType;
        static _ = new GrState();

        static stateStop()
        {
            this._.stateInit = false;
        }
        
        static stateStart( initScreenWidth = number, initScreenHeight = number )
        {
            let _ = this._;
            let gl = this.gl;
            /*
            // initialize render states.
            _currentState = GR_DEPTHTEST | GR_CULLFACE;
            _stateStackTop = 0;
            _currentArrayState = 0;
            */
            _.currentState = GR.DEPTHTEST | GR.CULLFACE;
            _.stateStackTop = 0;
            _.currentArrayState = 0

            /*
            // initialize render state modes.
            _srcFactorRGB = EBM_ONE;
            _srcFactorAlpha = EBM_ONE;
            _dstFactorRGB = EBM_ZERO;
            _dstFactorAlpha = EBM_ZERO;
            _stencilMode = ESM_USESTENCIL;
            _alphaTestMode = EAM_GREATER;
            _alphaTestRef = 0.5f;
            _cullMode = ECM_BACK;
            _depthMode = EDM_LESSEQUAL;
            _writeEnable = GR_RGBA | GR_DEPTH;
            */
            _.writeEnable = GR.RGBA | GR.DEPTH;

            /*
            // initialize viewport state.
            _viewportX = 0;
            _viewportY = 0;
            _viewportWidth = initScreenWidth;
            _viewportHeight = initScreenHeight;
            bglViewport( 0, 0, _viewportWidth, _viewportHeight );
            */
            _.viewport = new Rectangle( 0, 0, initScreenWidth, initScreenHeight );
            gl.viewport( 0, 0, _.viewport.Width, _.viewport.Height );

            /*
            // initialize scissor state.
            _scissorX = 0;
            _scissorY = 0;
            _scissorWidth = initScreenWidth;
            _scissorHeight = initScreenHeight;
            bglScissor( 0, 0, _scissorWidth, _scissorHeight );
            */
            _.scissor = new Rectangle( 0, 0, initScreenWidth, initScreenHeight );
            gl.scissor( 0, 0, _.scissor.Width, _.scissor.Height );

            /*
            // initialize our OpenGL state cache.
            MemSet( _curTextures, 0, sizeof( _curTextures ) );
            MemSet( _curTexTargets, 0, sizeof( _curTexTargets ) );
            _curVB = 0;
            _curIB = 0;
            _curPackPB = 0;
            _curUnpackPB = 0;
            _curShader = 0;
            */
            _.curVB = null;
            _.curIB = null;
            _.curPackPB = null;
            _.curUnpackPB = null;
            _.curShader = null;

            /*
            // initialize our OpenGL matrix stack.
            _matrixStackTop = 0;
            */
            _.matrixStackTop = null;

            /*
            // initialize OpenGL render states.
            bglEnable( GL_DEPTH_TEST );
            bglEnable( GL_CULL_FACE );
            bglDisable( GL_BLEND );
            bglDisable( GL_ALPHA_TEST );
            bglDisable( GL_SCISSOR_TEST );
            bglDisable( GL_STENCIL_TEST );
            bglPolygonMode( GL_FRONT_AND_BACK, GL_FILL );
            bglUseProgram( 0 );
            */
            gl.enable( gl.DEPTH_TEST );
            gl.disable( gl.CULL_FACE );
            gl.disable( gl.BLEND );
            // gl.disable( gl.ALPHA_TEST );
            gl.disable( gl.SCISSOR_TEST );
            gl.disable( gl.STENCIL_TEST );
            {
                gl.WEBGL_polygon_mode ??= gl.getExtension( "WEBGL_polygon_mode" )
                gl.WEBGL_polygon_mode.polygonModeWEBGL( gl.FRONT_AND_BACK, gl.WEBGL_polygon_mode.FILL_WEBGL )
            }
            gl.useProgram( null );

            /*
            // initialize the OpenGL matrix mode.
            bglMatrixMode( GL_MODELVIEW );
            */

            /*
            // initialize OpenGL render state modes.
            bglBlendFunc( GL_ONE, GL_ZERO );
            bglStencilFunc( GL_LESS, 0, _stencilMask );
            bglAlphaFunc( GL_GREATER, 0.5f );
            bglCullFace( GL_BACK );
            bglDepthFunc( GL_LEQUAL );
            */
            gl.blendFunc( gl.ONE, gl.ZERO );
            gl.stencilFunc( gl.LESS, 0, _.stencilMask )
            gl.cullFace( gl.BACK )
            gl.depthFunc( gl.LEQUAL );

            /*
            // initialize OpenGL write masks.
            bglColorMask( GL_TRUE, GL_TRUE, GL_TRUE, GL_TRUE );
            bglDepthMask( GL_TRUE );
            bglStencilMask( 0 );
            */
            gl.colorMask( true, true, true, true )
            gl.depthMask( true )
            gl.stencilMask( 0 )

            /*
            // set the initial draw buffer.
            bglDrawBuffer( GL_BACK_LEFT );
            */

            /*
            // clear texture units.
            for ( unsigned int i = 0; i < 16; ++i )
            {
                bglActiveTexture( GL_TEXTURE0+i );
                bglBindTexture( GL_TEXTURE_2D, 0 );
                bglBindTexture( GL_TEXTURE_3D, 0 );
                bglBindTexture( GL_TEXTURE_CUBE_MAP, 0 );
            }
            */
            for ( let i = 0; i < 16; i++ ) {
                gl.activeTexture( gl.TEXTURE0 + i );
                gl.bindTexture( gl.TEXTURE_2D, null );
                // gl.bindTexture( gl.TEXTURE_3D, null );
                gl.bindTexture( gl.TEXTURE_CUBE_MAP, null );
            }

            /*
            _activeTexUnit = 0;
            bglActiveTexture( GL_TEXTURE0 );
            */
            _.activeTexUnit = 0;
            gl.activeTexture( gl.TEXTURE0 );

            /*
            // clear buffer objects.
            bglBindBuffer( GL_ARRAY_BUFFER, 0 );
            bglBindBuffer( GL_ELEMENT_ARRAY_BUFFER, 0 );
            */
            gl.bindBuffer( gl.ARRAY_BUFFER, null );
            gl.bindBuffer( gl.ELEMENT_ARRAY_BUFFER, null );

            /*
            // query values from OpenGL.
            bglGetIntegerv( GL_MAX_TEXTURE_SIZE, &_maxTextureSize );
            bglGetIntegerv( GL_MAX_RENDERBUFFER_SIZE_EXT, &_maxFramebufferSize );
            bglGetIntegerv( GL_MAX_VERTEX_ATTRIBS, &_maxAttribCount );
            _maxAttribCount = Min( _maxAttribCount, 32 );
            */
            _.maxTextureSize = gl.getParameter( gl.MAX_TEXTURE_SIZE )
            _.maxFramebufferSize = gl.getParameter( gl.MAX_RENDERBUFFER_SIZE )
            _.maxAttribCount = gl.getParameter( gl.MAX_VERTEX_ATTRIBS )
            _.maxAttribCount = Min( _.maxAttribCount, 32 )

            /*
            // mark as initialized and return.
            _stateInit = true;
            */
            _.stateInit = true;

            /*
            // force all client arrays to be disabled.
            _currentArrayState = ~0;
            GrStreamDisableArrays( _currentArrayState );
            */
            _.currentArrayState = ~0;
            Gr.streamDisableArrays( _.currentArrayState )

            /*
            // make sure all is well with OpenGL.
            CHECK_GL();
            */
            CHECK_GL( gl );
        }
        
        static streamDisableArrays( arrayFlags = number )
        {
            let _ = this._;
            let gl = this.gl;
            /*
            // must call GrStateStart() first!
            B_ASSERT( _stateInit );
            */
            assert( () => _.stateInit );

            /*
            // states that we need to enable.
            unsigned int disable = arrayFlags & _currentArrayState;
            if ( disable == 0 )
                return;
            */
            let disable = arrayFlags & _.currentArrayState;
            if ( disable === 0 )
                return;

            /*
            // disable the arrays specified.
            unsigned int flag = 1;
            for ( int i = 0; i < _maxAttribCount; ++i, flag += flag )
            {
                if ( disable & flag )
                    bglDisableVertexAttribArray( i );
            }
            */
            let flag = 1;
            for ( let i = 0; i < _.maxAttribCount; i++, flag += flag ) {
                if ( disable & flag ) {
                    gl.disableVertexAttribArray( i )
                }
            }

            /*
            // clear the bits for the streams specified.
            _currentArrayState &= ~disable;
            CHECK_GL();
            */
            _.currentArrayState &= ~disable;
            CHECK_GL( gl );
        }
        
        static clear( red = 0.0, green = 0.0, blue = 0.0, alpha = 0.0, depth = 1.0, stencil = 0 )
        {
            let _ = this._;
            let gl = this.gl;
            /*
            // must call GrStateStart() first!
            B_ASSERT( _stateInit );
            */
            assert(() => _.stateInit );

            /*
            unsigned int clearFlags = 0;
            */
            let clearFlags = 0;
            /*
            if ( _writeEnable & GR_RGBA )
            {
                bglClearColor( red, green, blue, alpha );
                clearFlags |= GL_COLOR_BUFFER_BIT;
            }
            */
            if ( (_.writeEnable & GR.RGBA) !== 0 )
            {
                gl.clearColor( red, green, blue, alpha );
                clearFlags |= gl.COLOR_BUFFER_BIT;
            }
            /*
            if ( _writeEnable & GR_DEPTH )
            {
                bglClearDepth( depth );
                clearFlags |= GL_DEPTH_BUFFER_BIT;
            }
            */
            if ( (_.writeEnable & GR.DEPTH) !== 0 )
            {
                gl.clearDepth( depth );
                clearFlags |= gl.DEPTH_BUFFER_BIT;
            }
            /*
            if ( _writeEnable & GR_STENCIL )
            {
                bglClearStencil( stencil );
                clearFlags |= GL_STENCIL_BUFFER_BIT;
            }
            */
            if ( (_.writeEnable & GR.STENCIL) !== 0 )
            {
                gl.clearStencil( stencil );
                clearFlags |= gl.STENCIL_BUFFER_BIT;
            }
            /*
            if ( clearFlags )
                bglClear( clearFlags );
            */
            if ( clearFlags )
                gl.clear( clearFlags );

            CHECK_GL();
        }

        static genVB() {
            return this.gl.createBuffer()
        }

        static bindVB( handle = webglBufferType )
        {
            this.gl.bindBuffer( this.gl.ARRAY_BUFFER, handle );
            this._.curVB = handle;
        }

        static deleteVB( handle = webglBufferType )
        {
            this.gl.deleteBuffer( handle );
        }
        
        static glName( value = number ) {
            for ( let name in this.gl.constructor ) {
                if ( name.toUpperCase() === name ) {
                    if ( this.gl[ name ] === value ) {
                        return name;
                    }
                }
            }
            return `Unknown GL constant ${value}`
        }
        
        static glAttribCount( type = number ) {
            let gl = Util.verify( this.gl );
            if ( type === gl.FLOAT_VEC2 )
                return 2;
            else if ( type === gl.FLOAT_VEC3 )
                return 3;
            else if ( type === gl.FLOAT_VEC4 )
                return 4;
            assert( false, `glAttribCount: unsupported value ${this.glName(type)}`)
        }

        static glAttribByteSize( type = number ) {
            let gl = Util.verify( this.gl );
            if ( type === gl.FLOAT_VEC2 || type === gl.FLOAT_VEC3 || type === gl.FLOAT_VEC4 )
                return 4 * this.glAttribCount( type );
            assert( false, `glAttribByteSize: unsupported value ${this.glName(type)}`)
        }

        static glAttribType( type = number ) {
            let gl = Util.verify( this.gl );
            if ( type === gl.FLOAT_VEC2 || type === gl.FLOAT_VEC3 || type === gl.FLOAT_VEC4 )
                return gl.FLOAT;
            assert( false, `glAttribType: unsupported value ${this.glName(type)}`)
        }
    }
    exports.Gr = Gr;

    class GrSubsys {
        
        scale = (window.devicePixelRatio || 1) > 1.75 ? 2 : 1;

        constructor( screenWidth = number, screenHeight = number, scale = this.scale ) {
            exports.gGrSubsys = this
            
            this.scale = scale;
            
            // let canvas = new OffscreenCanvas( screenWidth, screenHeight )
            let canvas = document.createElement("canvas");
            canvas.width = scale * screenWidth;
            canvas.height = scale * screenHeight;

            Gr.gl = canvas.getContext('experimental-webgl', { antialias: true })
            Gr.stateStart( scale * screenWidth, scale * screenHeight );
            
            new GrShaderMgr();
            new GrRenderUtil();
        }

        get Screen() {
            return new Size( Gr.gl.canvas.width, Gr.gl.canvas.height )
        }
        set Screen(value) {
            if ( value.Width !== Gr.gl.canvas.width || value.Height !== Gr.gl.canvas.height )
            {
                Gr.gl.canvas.width = value.Width;
                Gr.gl.canvas.height = value.Height;
            }
        }

        resize( width = number, height = number ) {
            /*
            // inform the subsystems of a pending reset.
            gGrRenderer->PreContextReset();
            gGrMeshBufferMgr->PreContextReset();
            gGrMaterialMgr->PreContextReset();
            gGrFramebuffer->PreContextReset();      // must occur before the render target mgr reset.
            gGrRenderTargetMgr->PreContextReset();
            gGrPixelBufferMgr->PreContextReset();
            */

            /*
            // shut down renderstate management.
            GrStateStop();
            */
            Gr.stateStop();

            this.Screen = new Size( this.scale * width, this.scale * height );

            /*
            // initialize our renderer.
            GrStateStart( _screenWidth, _screenHeight );
            */
            Gr.stateStart( this.Screen.Width, this.Screen.Height );

            /*
            // apply quality settings.
            gGrTextureMgr->SetTexturingQuality( _textureQuality );
            gGrMaterialMgr->SetShadingQuality( _shadingQuality );
            gGrFramebuffer->SetHDRQuality( _hdrQuality );
            gGrFramebuffer->SetHDREnable( _hdrEnable );
            gGrRenderer->SetQuality( _shadingQuality );
            */

            /*
            _screenWidth = width;
            _screenHeight = height;
            GrRenderTarget::ResizePrimaryRT( width, height );
            */

            /*
            // inform the subsystems that the reset has been completed.
            gGrPixelBufferMgr->PostContextReset();
            gGrRenderTargetMgr->PostContextReset();
            gGrFramebuffer->PostContextReset( width, height );
            gGrMaterialMgr->PostContextReset();
            gGrMeshBufferMgr->PostContextReset();
            gGrRenderer->PostContextReset( width, height );
            */

            /*
            // make sure the correct type of framebuffer is created.
            CreateFrameBuffer();
            */
        }

        begin( width = this.Screen.Width / this.scale, height = this.Screen.Height / this.scale )
        {
            this.resize( width, height );
        }
        
        finish()
        {
            Gr.gl.flush();
            CHECK_GL();
            return Gr.gl.canvas;
        }

    } exports.GrSubsys = GrSubsys;
    
    class GrShaderMgr
    {
        constructor()
        {
            exports.gGrShaderMgr = this;

            this.base_vert_src =
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
            this.color_frag_src =
            `
                precision mediump float;
                
                uniform sampler2D lut;

                varying vec3 n_dir;
                varying vec3 model_pos;

                uniform vec4 color;
                uniform float normal_f;

                void main(void) {
                           
                    vec4 c = color;
                    
                    c.rgb *= texture2D(lut, vec2(0.5, 0.5)).rgb;
                    
                    float f = mix(1.0, abs(normalize(n_dir).z), normal_f);
                    
                    c.rgb *= sqrt(f);
                    
                    gl_FragColor = c;
                }
            `;

            this.flat_shader = new GrShader( this.base_vert_src, this.color_frag_src );

            this.plain_vert_src = `
                attribute vec3 v_position;
                uniform mat4 m_mvp;
                void main() {
                     gl_Position = m_mvp * vec4( v_position.xyz, 1.0 );
                }
            `;

            this.plain_frag_src = `
                precision mediump float;
                uniform vec4 u_color;
                void main() {
                  gl_FragColor = u_color;
                }
            `;
            
            this.plain_shader = new GrShader( this.plain_vert_src, this.plain_frag_src );

            this.error_vert_src = `
                attribute vec3 v_position;
                attribute vec2 v_uv;
                varying vec3 v_color;
                uniform mat4 m_mvp;
                void main() {
                     gl_Position = m_mvp * vec4( v_position.xyz, 1.0 );
                     v_color.rgb = vec3( v_uv, 0.0 );
                     // v_color.rgb = vec3( 1.0, 0.0, 1.0 );
                }
            `;

            this.error_frag_src = `
                precision mediump float;
                varying vec3 v_color;
                void main() {
                  gl_FragColor = vec4( v_color, 1.0 );
                }
            `;

            this.error_shader = new GrShader( this.error_vert_src, this.error_frag_src );

        }
        
    } exports.GrShaderMgr = GrShaderMgr;
    
    let attribType = 0 ? Gr.gl.getActiveAttrib( null, 0 ) : 0 ? {
        index: 0,
        kind: "FLOAT_VEC3",
        location: 0,
    } : nil;
    exports.attribType = attribType;

    class GrShaderAttribInfo {
        attrib = attribType;
        _offset = 0;

        constructor( attrib = attribType, offset = number ) {
            this.attrib = attrib;
            this._offset = offset;
        }
        
        offset() {
            verify(this._offset);
            return this._offset;
        }
        
        index() {
            return this.attrib.index;
        }

        count() {
            return Gr.glAttribCount( this.attrib.type );
        }

        size() {
            return Gr.glAttribByteSize( this.attrib.type );
        }
        
        type() {
            return Gr.glAttribType( this.attrib.type );
        }
    } exports.GrShaderAttribInfo = GrShaderAttribInfo;
    
    class GrShader
    {
        constructor( vert_src = string, frag_src = string )
        {
            this.shader = GrShader.compileProgram( vert_src, frag_src );
            this.attributes = GrShader.getProgramAttributes( this.shader )
            this.uniforms = GrShader.getProgramUniforms( this.shader )
        }
        
        static compileProgram(vert_src = string, frag_src = string)
        {
            let gl = Gr.gl;

            let vert = gl.createShader(gl.VERTEX_SHADER);
            gl.shaderSource(vert, vert_src);
            gl.compileShader(vert);

            const vert_message = gl.getShaderInfoLog(vert);
            if (vert_message.length > 0) {
                console.log(vert_message);
            }

            let frag = gl.createShader(gl.FRAGMENT_SHADER);
            gl.shaderSource(frag, frag_src);
            gl.compileShader(frag);

            const frag_message = gl.getShaderInfoLog(frag);
            if (frag_message.length > 0) {
                console.log(frag_message);
                // throw new Error('Parameter is not a number!');
            }

            let shader = gl.createProgram();
            gl.attachShader(shader, vert);
            gl.attachShader(shader, frag);
            gl.linkProgram(shader);

            if (!gl.getProgramParameter(shader, gl.LINK_STATUS)) {
                const info = gl.getProgramInfoLog(shader);
                console.log(info);
            }

            return shader;
        }
        
        static getProgramAttributes(program = webglProgramType) {
            let gl = Gr.gl;
            let count = gl.getProgramParameter( program, gl.ACTIVE_ATTRIBUTES )
            let attribs = Object.fromEntries([["v_position", attribType]])
            for ( let i = 0; i < count; i++ ) {
                let attrib = gl.getActiveAttrib( program, i )
                attrib.index = i;
                attrib.kind = Gr.glName( attrib.type )
                attrib.location = gl.getAttribLocation( program, attrib.name )
                attribs[ attrib.name ] = attrib;
            }
            return attribs;
        }

        static getProgramUniforms(program = webglProgramType) {
            let gl = Gr.gl;
            let count = gl.getProgramParameter( program, gl.ACTIVE_UNIFORMS )
            let uniforms = {}
            for ( let i = 0; i < count; i++ ) {
                let uniform = gl.getActiveUniform( program, i )
                uniform.index = i;
                uniform.kind = Gr.glName( uniform.type )
                uniform.location = gl.getUniformLocation( program, uniform.name )
                uniforms[ uniform.name ] = uniform;
            }
            return uniforms;
        }
        
        static currentProgram = 0 ? new this() : nil;
        
        bind() {
            let gl = Gr.gl;
            gl.useProgram( this.shader )
            GrShader.currentProgram = this;
            CHECK_GL();
        }
        
        setParam( name, data ) {
            let gl = Gr.gl;
            
            let uniform = this.uniforms[ name ]
            assert(() => uniform, `No such shader uniform named "${name}"`)
            
            if ( data instanceof Real ) {
                data = [data];
            }

            let v = (data instanceof Array) ? data : [...data];
            if ( uniform.type === gl.FLOAT ) {
                assert( () => v instanceof Real )
                gl.uniform1f( uniform.location, v )
            } else if ( uniform.type === gl.FLOAT_VEC2 ) {
                assert(() => v.length === 2)
                gl.uniform2fv( uniform.location, v )
            } else if ( uniform.type === gl.FLOAT_VEC3 ) {
                assert(() => v.length === 3)
                gl.uniform3fv( uniform.location, v )
            } else if ( uniform.type === gl.FLOAT_VEC4 ) {
                assert(() => v.length === 4)
                gl.uniform4fv( uniform.location, v )
            } else if ( uniform.type === gl.FLOAT_MAT2 ) {
                assert(() => v.length === 2*2)
                gl.uniformMatrix2fv( uniform.location, false, v )
            } else if ( uniform.type === gl.FLOAT_MAT3 ) {
                assert(() => v.length === 3*3)
                gl.uniformMatrix3fv( uniform.location, false, v )
            } else if ( uniform.type === gl.FLOAT_MAT4 ) {
                assert(() => v.length === 4*4)
                gl.uniformMatrix4fv( uniform.location, false, v )
            } else {
                assert(false, `Unknown uniform type ${uniform.type} for ${uniform.name}`)
            }
        }
        
    } exports.GrShader = GrShader;

    let shaderType = 0 ? new GrShader() : nil;
    exports.shaderType = shaderType;
    
    class GrVertexComponent {
        constructor( name = string, type = Gr.gl.FLOAT_VEC3 ) {
            this.name = name;
            this.type = type;
            this.data = [];
        }
        
        numPerVertex() {
            return Gr.glAttribCount( this.type )
        }

        bytesPerVertex() {
            return Gr.glAttribByteSize( this.type )
        }

        count() {
            assert( () => Util.multiple( this.data.length, this.numPerVertex() ));
            return this.data.length / this.numPerVertex()
        }
        
        add( ...values ) {
            let vertex = Util.argumentArray( values );
            assert( () => vertex.length === this.numPerVertex(), "Too many or not enough values" )
            this.data.push(...vertex);
        }
        
        set( index = number, ...values )  {
            assert( () => index >= 0 && index < this.count() );
            let vertex = Util.argumentArray( values );
            assert( () => vertex.length === this.numPerVertex(), "Too many or not enough values" )
            let numel = this.numPerVertex();
            for ( let i = 0; i < numel; i++ ) {
                this.data[ index * numel + i ] = vertex[ i ];
            }
        }
        
        reserve( count = number ) {
            if ( count >  this.count() ) {
                let zeros = new Array(this.numPerVertex()).fill(0);
                for ( let i = this.count(); i < count; i++ ) {
                    this.data.push( ...zeros );
                }
            }
            return this;
        }
        
        *read(index = 0, count = this.count()) {
            let numVertices = this.count();
            let numel = this.numPerVertex();
            while ( index >= 0 && index < numVertices && count > 0 ) {
                for ( let i = 0; i < numel; i++ ) {
                    yield this.data[ index * numel + i ]
                }
                index += 1;
                count -= 1;
            }
        }

        get(index = number, count = 1) {
            return [...this.read(index, count)];
        }
    } exports.GrVertexComponent = GrVertexComponent;
    
    let vertexComponentType = 0 ? new GrVertexComponent() : nil;
    let vertexComponentArrayType = 0 ? [new GrVertexComponent()] : nil;
    
    class GrVertexComponents {
        components = vertexComponentArrayType;
        
        constructor(components = vertexComponentArrayType) {
            this.components = components ?? []
        }
        
        static from(x) {
            if (x instanceof ArrayType) {
                x[0] && assert(() => x[0] instanceof GrVertexComponent);
                return new GrVertexComponents(x);
            }
            let y = vertexComponentsType ?? x;
            assert(() => y instanceof GrVertexComponents);
            return y;
        }
        
        getOrCreate(name = string, type = Gr.gl.FLOAT_VEC3) {
            let comp = this.find(name);
            if ( comp ) {
                assert( () => comp.type === type,
                    `Vertex components ${name} already exists, but its type ${Gr.glName(comp.type)} is different from the specified type ${Gr.glName(type)}`)
                return comp;
            }
            comp = new GrVertexComponent( name, type );
            this.components.push(comp);
            return comp;
        }

        find(name = string) {
            for (let component of this.components) {
                if (component.name === name)
                    return component;
            }
            return vertexComponentType;
        }
        
        get(name = string) {
            let component = assert( () => this.find(name), `Vertex component ${name} doesn't exist`)
            return 0 ? vertexComponentType : component;
        }
        
        vertexCount() {
            for (let component of this.components)
                return component.count();
            return 0;
        }
        
        offset(name = string) {
            let offset = 0;
            for (let component of this.components) {
                if (component.name === name)
                    return offset;
                offset += component.bytesPerVertex()
            }
            assert(false, `Can't find offset for ${name}`)
        }
        
        stride() {
            return 0 ? number : Util.sum(this.components.map(component => component.bytesPerVertex()));
        }
        
        byteSize() {
            return this.vertexCount() * this.stride();
        }
        
        static *readInterleaved(components = vertexComponentArrayType, index = 0, count = Number.MAX_SAFE_INTEGER) {
            let numVertices = 0;
            for (let component of components) {
                numVertices = component.count()
                break;
            }
            while (index < numVertices && count > 0) {
                for (let component of components) {
                    yield* component.read(index, 1);
                }
                index += 1;
                count -= 1;
            }
        }

        *readInterleaved(index = 0, count = Number.MAX_SAFE_INTEGER) {
            yield* GrVertexComponents.readInterleaved(this.components, index, count)
        }
        
        v_position(name = "v_position") { return this.getOrCreate(name, Gr.gl.FLOAT_VEC3) }
        v_normal(name = "v_normal") { return this.getOrCreate(name, Gr.gl.FLOAT_VEC3) }
        v_texcoord(name = "v_uv") { return this.getOrCreate(name, Gr.gl.FLOAT_VEC2) }
    } exports.GrVertexComponents = GrVertexComponents;
    
    let vertexComponentsType = 0 ? new GrVertexComponents() : nil;

    class GrMeshVB {
        static kStatic = 0x0
        static kDynamic = 0x1
        
        _components = vertexComponentsType;

        constructor( flags = GrMeshVB.kStatic, components = new GrVertexComponents() ) {
            this._vertexBuffer = null;
            this._flags = flags;
            this._components = components;
            this._size = -1;
            this._dirty = true;
        }
        
        static fromGL( handle = webglBufferType ) {
            let gl = Gr.gl;
            let self = new this();
            self._vertexBuffer = handle;
            
            Gr.bindVB( handle );
            CHECK_GL();
            
            self._size = gl.getBufferParameter( gl.ARRAY_BUFFER, gl.BUFFER_SIZE )
            let usage = gl.getBufferParameter( gl.ARRAY_BUFFER, gl.BUFFER_USAGE )
            if ( usage === gl.DYNAMIC_DRAW )
                self._flags |= GrMeshVB.kDynamic;
            else {
                assert(() => usage === gl.STATIC_DRAW,
                    `Unknown buffer usage ${Gr.glName(usage)}`)
            }
            Gr.bindVB( null );

            return self;
        }
        
        getComponents() {
            return this._components;
        }
        
        isDynamic() {
            return ( this._flags & GrMeshVB.kDynamic ) !== 0;
        }
        
        markAsDirty() {
            this._dirty = true;
        }

        cache() {
            let gl = Gr.gl;
            if ( this._vertexBuffer == null || this._size !== this.getComponents().byteSize() ) {
                // build the vertex buffer.
                this._vertexBuffer = Gr.genVB()
                Gr.bindVB( this._vertexBuffer )
                this._size = this.getComponents().byteSize();
                gl.bufferData( gl.ARRAY_BUFFER, this._size, this.isDynamic() ? gl.DYNAMIC_DRAW : gl.STATIC_DRAW )
                CHECK_GL();
            }
        }

        evict() {
            if ( this._vertexBuffer != null ) {
                Gr.deleteVB( this._vertexBuffer )
                this._vertexBuffer = null;
            }
        }

        bind( program = GrShader.currentProgram ) {
            let gl = Gr.gl;

            /*
            // if this hits, then the vertex buffer does not contain one or more
            // of the required components!
            B_ASSERT( ( components & _components ) == components );
            */

            /*
            // cache the vertex buffer if necessary.
            if ( !_vertexBuffer )
                Cache();
            */
            if ( this._vertexBuffer == null )
                this.cache();

            /*
            // bind our vertex buffer.
            GrBindVB( _vertexBuffer );
            */
            Gr.bindVB( this._vertexBuffer );

            /*
            // if we need to be updated, then do so now.
            if ( _dirty != 0 )
            {
                PackData();
                _dirty = 0;
            }
            */
            if ( this._dirty )
            {
                this.packData()
                this._dirty = false;
            }
            
            // calculate stride and offsets.
            let stride = 0;
            let attribInfo = Util.objectType( new GrShaderAttribInfo() );
            for ( let attrib of Object.values( program.attributes ))
            {
                let offset = stride;
                let info = new GrShaderAttribInfo( attrib, offset );
                attribInfo[ verify( info.attrib.name ) ] = info;
                stride += verify( info.size() );
            }

            /*
            // bind components.
            if ( components & GR_ATTRIB_POSITION_MASK )
                GrStreamArrayPointer( GR_ATTRIB_POSITION_INDEX, 3, ET_FLOAT, false, _stride, 0 );
            */

            /*
            if ( components & GR_ATTRIB_TANGENT_MASK )
                GrStreamArrayPointer( GR_ATTRIB_TANGENT_INDEX, 3, ET_FLOAT, false, _stride, _tangentStart );
            */

            /*
            if ( components & GR_ATTRIB_BINORMAL_MASK )
                GrStreamArrayPointer( GR_ATTRIB_BINORMAL_INDEX, 3, ET_FLOAT, false, _stride, _biNormalStart );
            */

            /*
            if ( components & GR_ATTRIB_NORMAL_MASK )
                GrStreamArrayPointer( GR_ATTRIB_NORMAL_INDEX, 3, ET_FLOAT, false, _stride, _normalStart );
            */

            /*
            if ( components & GR_ATTRIB_TEXCOORD_MASK )
                GrStreamArrayPointer( GR_ATTRIB_TEXCOORD_INDEX, 2, ET_FLOAT, false, _stride, _texCoordStart );
            */

            /*
            if ( components & GR_ATTRIB_COLOR_MASK )
                GrStreamArrayPointer( GR_ATTRIB_COLOR_INDEX, 4, ET_UNSIGNED_BYTE, true, _stride, _colorStart );
            */

            /*
            // enable arrays.
            GrStreamSetArrayState( components );
            */
            // TODO: disable arrays
            let components = this.getComponents();
            for ( let attrib of Object.values( program.attributes ))
            {
                gl.vertexAttribPointer( attrib.index,
                    Gr.glAttribCount( attrib.type ),
                    Gr.glAttribType( attrib.type ), 
                    false,
                    components.stride(),
                    components.offset( attrib.name ) )
                gl.enableVertexAttribArray( attrib.index )
            }
            CHECK_GL();
        }
        
        packData() {
            let gl = Gr.gl;
            let components = this.getComponents();
            assert(() => components.byteSize() === this._size )
            let vertices = new Float32Array(components.readInterleaved());
            assert( vertices.byteLength === components.byteSize() );
            gl.bufferSubData( gl.ARRAY_BUFFER, 0, vertices );
            CHECK_GL();
        }

    } exports.GrMeshVB = GrMeshVB;
    
    class GrRenderUtil {
        constructor() {
            exports.gGrRenderUtil = this;
            this._quadVB = new GrMeshVB( GrMeshVB.kDynamic )
        }
        
        setupColoredRender( mvp = MMat.ident(4), shader = gGrShaderMgr.error_shader ) {
            mvp = MMat.from( mvp )
            assert(() => mvp.dimensions() === 4);
            shader.bind();
            shader.setParam( "m_mvp", mvp )
        }
        
        drawQuad( x = 0, y = 0, w = 1, h = 1, minS = 0.0, minT = 0.0, maxS = 1.0, maxT = 1.0 ) {
            // setup the vertex data.
            let quad = this._quadVB.getComponents();
            let pos = 0 ? vertexComponentType : quad.v_position().reserve(4);
            let tex = 0 ? vertexComponentType : quad.v_texcoord().reserve(4);
            let nrm = 0 ? vertexComponentType : quad.v_normal().reserve(4);
            let i = -1;
            pos.set( ++i, [ x - w, y - h, 0.0 ] ); tex.set( i, [ minS, minT ] ); nrm.set( i, [ 0, 0, 1 ] );
            pos.set( ++i, [ x + w, y - h, 0.0 ] ); tex.set( i, [ maxS, minT ] ); nrm.set( i, [ 0, 0, 1 ] );
            pos.set( ++i, [ x + w, y + h, 0.0 ] ); tex.set( i, [ maxS, maxT ] ); nrm.set( i, [ 0, 0, 1 ] );
            pos.set( ++i, [ x - w, y + h, 0.0 ] ); tex.set( i, [ minS, maxT ] ); nrm.set( i, [ 0, 0, 1 ] );
            this._quadVB.markAsDirty()

            // bind the screen-quad vertex buffer for rendering and upload the vertex data.
            this._quadVB.bind()
            
            // issue the draw call.
            let gl = Gr.gl;
            gl.drawArrays( gl.TRIANGLE_FAN, 0, 4 );
            CHECK_GL();
        }
        
    } exports.GrRenderUtil = GrRenderUtil;
    
})(window);


function genericTouchHandler(f) {
    return function (e) {
        if (e.touches.length >= 1) {
            e.touches[0].timeStamp = e.timeStamp;
            if (f(e.touches[0])) {
                e.preventDefault();
                return false;
            }
        }
    }
}

function normpath(path) {
    if (!path) return '.';

    const isAbsolute = path.startsWith('/');
    const segments = path.split('/').filter(Boolean);
    const normalizedSegments = [];

    segments.forEach(segment => {
        if (segment === '..') {
            if (normalizedSegments.length && normalizedSegments[normalizedSegments.length - 1] !== '..') {
                normalizedSegments.pop();
            } else if (!isAbsolute) {
                normalizedSegments.push(segment);
            }
        } else if (segment !== '.') {
            normalizedSegments.push(segment);
        }
    });

    let normalizedPath = normalizedSegments.join('/');
    if (isAbsolute) {
        normalizedPath = '/' + normalizedPath;
    }

    return normalizedPath || (isAbsolute ? '/' : '.');
}

function dirname(path) {
    // Normalize the path by removing any trailing slashes
    path = path.replace(/\/+$/, '');

    // Find the last occurrence of '/'
    const lastSlashIndex = path.lastIndexOf('/');

    // If there is no '/' in the path, return an empty string
    if (lastSlashIndex === -1) {
        return '';
    }

    // Return the substring from the beginning to the last '/'
    return path.substring(0, lastSlashIndex);
}

function file_name_directory(path) {
    return path.substring(0, path.lastIndexOf("/") + 1) || undefined;
}

function file_name_nondirectory(path) {
    return path.substring((file_name_directory(path) ?? "").length);
}

function is_abspath(path) {
    return path.startsWith("/")
}

function path_join2(x, y) {
    return x.replace(/\/$/, '') + "/" + y.replace(/^\//, '');
}

function path_join(path, ...paths) {
    console.log("path_join", path, ...paths)
    let protocol = (path.match(/^(\w+:\/)\//) ?? [])[1];
    if (protocol)
        return path_join2(path, path_join(...paths));
    paths = [path, ...paths];
    return paths
        .slice(Math.max(0, paths.findLastIndex(path => path.startsWith("/")))) // Start at last absolute path
        .filter(Boolean) // Filter out any empty strings or null/undefined values
        .join('/')
        .replace(/\/+/g, '/'); // Replace multiple slashes with a single slash
}

function base_url() {
    // if a <base href="..."/> element exists, return its href.
    let el = document.getElementsByTagName("base")[0];
    if (el) return el.href;
    // if we're at a path like /some/path/baz/index.html, return /some/path/
    let paths = new URL(window.location.href).pathname
        .replace(/(.*\/)[^/]+$/, '$1')
        .split('/')
        .filter(Boolean);
    return new URL(paths.length >= 2 ? `/${paths[0]}/` : "/", window.location.href).href;
}

function expand_file_name(filename, directory = base_url()) {
    let result = path_join(directory, filename);
    if (filename.endsWith("/") && !result.endsWith("/"))
        result += "/";
    return result;
}

expand_file_name("/models/airfoil.dat");


function download_file(file_path, handler) {
    let xhr = new XMLHttpRequest();
    xhr.open("GET", expand_file_name(file_path));
    xhr.responseType = "arraybuffer";

    xhr.onload = function (_oEvent) {
        let buffer = xhr.response;
        if (buffer) {
            handler(buffer);
        }
    };
    xhr.send();
}

CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
    if (w < 2 * r) r = w / 2;
    if (h < 2 * r) r = h / 2;
    // this.beginPath();
    this.moveTo(x + r, y);
    this.arcTo(x + w, y, x + w, y + h, r);
    this.arcTo(x + w, y + h, x, y + h, r);
    this.arcTo(x, y + h, x, y, r);
    this.arcTo(x, y, x + w, y, r);
    this.closePath();
    return this;
}

CanvasRenderingContext2D.prototype.fillEllipse = function (x, y, r) {
    this.beginPath();
    this.ellipse(x, y, r, r, 0, 0, Math.PI * 2);
    this.fill();
}

CanvasRenderingContext2D.prototype.strokeEllipse = function (x, y, r) {
    this.beginPath();
    this.ellipse(x, y, r, r, 0, 0, Math.PI * 2);
    this.stroke();
}

CanvasRenderingContext2D.prototype.strokeLine = function (x0, y0, x1, y1) {
    this.beginPath();
    this.lineTo(x0, y0);
    this.lineTo(x1, y1);
    this.stroke();
}

CanvasRenderingContext2D.prototype.arrow = function (x0, y0, x1, y1, w, arrw, arrh) {
    let dx = x1 - x0;
    let dy = y1 - y0;

    let l = 1.0 / Math.sqrt(dx * dx + dy * dy);
    dx *= l;
    dy *= l;

    this.beginPath();
    this.moveTo(x0 - dy * w / 2, y0 + dx * w / 2);
    this.lineTo(x1 - dy * w / 2 - dx * arrh, y1 + dx * w / 2 - dy * arrh);
    this.lineTo(x1 - dy * arrw / 2 - dx * arrh, y1 + dx * arrw / 2 - dy * arrh);
    this.lineTo(x1, y1);
    this.lineTo(x1 + dy * arrw / 2 - dx * arrh, y1 - dx * arrw / 2 - dy * arrh);
    this.lineTo(x1 + dy * w / 2 - dx * arrh, y1 - dx * w / 2 - dy * arrh);
    this.lineTo(x0 + dy * w / 2, y0 - dx * w / 2);

    this.closePath();
    return this;
}

CanvasRenderingContext2D.prototype.feather = function (w, h, l, r, t, b, tx, ty) {
    this.save();
    this.resetTransform();
    this.globalAlpha = 1;

    if (tx !== undefined && ty !== undefined)
        this.translate(tx, ty);

    this.globalCompositeOperation = "destination-out";

    let grd;
    let n = 15;

    let stops = new Array(n + 1);
    for (let i = 0; i <= n; i++) {
        let x = i / n;
        stops[i] = "rgba(0,0,0," + x * x * x * (x * (x * 6.0 - 15.0) + 10.0) + ")";
    }

    if (t) {
        grd = this.createLinearGradient(0, 0, 0, t);
        for (let i = 0; i <= n; i++) {
            grd.addColorStop(1 - i / n, stops[i]);
        }

        this.fillStyle = grd;
        this.fillRect(0, 0, w, t);
    }

    if (b) {
        grd = this.createLinearGradient(0, h - b, 0, h);
        for (let i = 0; i <= n; i++) {
            grd.addColorStop(i / n, stops[i]);
        }

        this.fillStyle = grd;
        this.fillRect(0, h - b, w, h);
    }

    if (l) {
        grd = this.createLinearGradient(0, 0, l, 0);
        for (let i = 0; i <= n; i++) {
            grd.addColorStop(1 - i / n, stops[i]);
        }


        this.fillStyle = grd;
        this.fillRect(0, 0, l, h);
    }

    if (r) {
        grd = this.createLinearGradient(w - r, 0, w, 0);
        for (let i = 0; i <= n; i++) {
            grd.addColorStop(i / n, stops[i]);
        }


        this.fillStyle = grd;
        this.fillRect(w - r, 0, r, h);
    }

    this.restore();
}


/* Mat 4 */

function mat4_transpose(a) {

    return [a[0], a[4], a[8], a[12],
        a[1], a[5], a[9], a[13],
        a[2], a[6], a[10], a[14],
        a[3], a[7], a[11], a[15]
    ];
}


function mat4_mul(a, b) {
    /* 0  1  2  3
       4  5  6  7
       8  9 10 11
      12 13 14 15 */

    let res = new Array(16)
    res[0] = a[0] * b[0] + a[1] * b[4] + a[2] * b[8] + a[3] * b[12];
    res[1] = a[0] * b[1] + a[1] * b[5] + a[2] * b[9] + a[3] * b[13];
    res[2] = a[0] * b[2] + a[1] * b[6] + a[2] * b[10] + a[3] * b[14];
    res[3] = a[0] * b[3] + a[1] * b[7] + a[2] * b[11] + a[3] * b[15];

    res[4] = a[4] * b[0] + a[5] * b[4] + a[6] * b[8] + a[7] * b[12];
    res[5] = a[4] * b[1] + a[5] * b[5] + a[6] * b[9] + a[7] * b[13];
    res[6] = a[4] * b[2] + a[5] * b[6] + a[6] * b[10] + a[7] * b[14];
    res[7] = a[4] * b[3] + a[5] * b[7] + a[6] * b[11] + a[7] * b[15];

    res[8] = a[8] * b[0] + a[9] * b[4] + a[10] * b[8] + a[11] * b[12];
    res[9] = a[8] * b[1] + a[9] * b[5] + a[10] * b[9] + a[11] * b[13];
    res[10] = a[8] * b[2] + a[9] * b[6] + a[10] * b[10] + a[11] * b[14];
    res[11] = a[8] * b[3] + a[9] * b[7] + a[10] * b[11] + a[11] * b[15];

    res[12] = a[12] * b[0] + a[13] * b[4] + a[14] * b[8] + a[15] * b[12];
    res[13] = a[12] * b[1] + a[13] * b[5] + a[14] * b[9] + a[15] * b[13];
    res[14] = a[12] * b[2] + a[13] * b[6] + a[14] * b[10] + a[15] * b[14];
    res[15] = a[12] * b[3] + a[13] * b[7] + a[14] * b[11] + a[15] * b[15];

    return res;
}

function mat4_mul_vec3(a, b) {
    let res = new Array(4);
    res[0] = a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3];
    res[1] = a[4] * b[0] + a[5] * b[1] + a[6] * b[2] + a[7];
    res[2] = a[8] * b[0] + a[9] * b[1] + a[10] * b[2] + a[11];
    res[3] = a[12] * b[0] + a[13] * b[1] + a[14] * b[2] + a[15];

    return res;
}

function mat4_mul_vec4(a, b) {
    let res = new Array(4);
    res[0] = a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3];
    res[1] = a[4] * b[0] + a[5] * b[1] + a[6] * b[2] + a[7] * b[3];
    res[2] = a[8] * b[0] + a[9] * b[1] + a[10] * b[2] + a[11] * b[3];
    res[3] = a[12] * b[0] + a[13] * b[1] + a[14] * b[2] + a[15] * b[3];

    return res;
}

function mat4_invert(a) {

    let out = new Array(16);

    let a00 = a[0],
        a01 = a[1],
        a02 = a[2],
        a03 = a[3];
    let a10 = a[4],
        a11 = a[5],
        a12 = a[6],
        a13 = a[7];
    let a20 = a[8],
        a21 = a[9],
        a22 = a[10],
        a23 = a[11];
    let a30 = a[12],
        a31 = a[13],
        a32 = a[14],
        a33 = a[15];
    let b00 = a00 * a11 - a01 * a10;
    let b01 = a00 * a12 - a02 * a10;
    let b02 = a00 * a13 - a03 * a10;
    let b03 = a01 * a12 - a02 * a11;
    let b04 = a01 * a13 - a03 * a11;
    let b05 = a02 * a13 - a03 * a12;
    let b06 = a20 * a31 - a21 * a30;
    let b07 = a20 * a32 - a22 * a30;
    let b08 = a20 * a33 - a23 * a30;
    let b09 = a21 * a32 - a22 * a31;
    let b10 = a21 * a33 - a23 * a31;
    let b11 = a22 * a33 - a23 * a32;
    let det =
        b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;
    if (!det) {
        return undefined;
    }

    det = 1.0 / det;
    out[0] = (a11 * b11 - a12 * b10 + a13 * b09) * det;
    out[1] = (a02 * b10 - a01 * b11 - a03 * b09) * det;
    out[2] = (a31 * b05 - a32 * b04 + a33 * b03) * det;
    out[3] = (a22 * b04 - a21 * b05 - a23 * b03) * det;
    out[4] = (a12 * b08 - a10 * b11 - a13 * b07) * det;
    out[5] = (a00 * b11 - a02 * b08 + a03 * b07) * det;
    out[6] = (a32 * b02 - a30 * b05 - a33 * b01) * det;
    out[7] = (a20 * b05 - a22 * b02 + a23 * b01) * det;
    out[8] = (a10 * b10 - a11 * b08 + a13 * b06) * det;
    out[9] = (a01 * b08 - a00 * b10 - a03 * b06) * det;
    out[10] = (a30 * b04 - a31 * b02 + a33 * b00) * det;
    out[11] = (a21 * b02 - a20 * b04 - a23 * b00) * det;
    out[12] = (a11 * b07 - a10 * b09 - a12 * b06) * det;
    out[13] = (a00 * b09 - a01 * b07 + a02 * b06) * det;
    out[14] = (a31 * b01 - a30 * b03 - a32 * b00) * det;
    out[15] = (a20 * b03 - a21 * b01 + a22 * b00) * det;
    return out;
}


let ident_mat4 = [1, 0, 0, 0,
    0, 1, 0, 0,
    0, 0, 1, 0,
    0, 0, 0, 1
];


function scale_mat4(a) {
    if (a.constructor === Array) {
        return [
            a[0], 0, 0, 0,
            0, a[1], 0, 0,
            0, 0, a[2], 0,
            0, 0, 0, a[3] ?? 1
        ];
    }
    return [
        a, 0, 0, 0,
        0, a, 0, 0,
        0, 0, a, 0,
        0, 0, 0, 1
    ];
}


function rot_x_mat4(a) {
    let c = Math.cos(a);
    let s = Math.sin(a);

    return [
        1, 0, 0, 0,
        0, c, -s, 0,
        0, s, c, 0,
        0, 0, 0, 1
    ];
}

function rot_y_mat4(a) {
    let c = Math.cos(a);
    let s = Math.sin(a);

    return [
        c, 0, s, 0,
        0, 1, 0, 0,
        -s, 0, c, 0,
        0, 0, 0, 1
    ];
}

function rot_z_mat4(a) {
    let c = Math.cos(a);
    let s = Math.sin(a);

    return [
        c, -s, 0, 0,
        s, c, 0, 0,
        0, 0, 1, 0,
        0, 0, 0, 1
    ];
}

function translation_mat4(t) {
    return [
        1, 0, 0, t[0],
        0, 1, 0, t[1],
        0, 0, 1, t[2],
        0, 0, 0, t[3] ?? 1
    ];
}

let x_flip_mat4 = [
    -1, 0, 0, 0,
    0, 1, 0, 0,
    0, 0, 1, 0,
    0, 0, 0, 1
];

let y_flip_mat4 = [
    1, 0, 0, 0,
    0, -1, 0, 0,
    0, 0, 1, 0,
    0, 0, 0, 1
];

let z_flip_mat4 = [
    1, 0, 0, 0,
    0, 1, 0, 0,
    0, 0, -1, 0,
    0, 0, 0, 1
];

let x_flip_mat3 = [-1, 0, 0, 0, 1, 0, 0, 0, 1];
let y_flip_mat3 = [1, 0, 0, 0, -1, 0, 0, 0, 1];
let z_flip_mat3 = [1, 0, 0, 0, 1, 0, 0, 0, -1];


function mat3_to_mat4(mat) {
    return [mat[0], mat[1], mat[2], 0,
        mat[3], mat[4], mat[5], 0,
        mat[6], mat[7], mat[8], 0,
        0, 0, 0, 1];
}


// noinspection JSUnusedGlobalSymbols
function mat4_to_mat3(mat) {
    return [mat[0], mat[1], mat[2],
        mat[4], mat[5], mat[6],
        mat[8], mat[9], mat[10]];
}


/* Mat 3 */


function mat3_invert(a) {
    let a00 = a[0],
        a01 = a[1],
        a02 = a[2];
    let a10 = a[3],
        a11 = a[4],
        a12 = a[5];
    let a20 = a[6],
        a21 = a[7],
        a22 = a[8];
    let b01 = a22 * a11 - a12 * a21;
    let b11 = -a22 * a10 + a12 * a20;
    let b21 = a21 * a10 - a11 * a20;

    let det = a00 * b01 + a01 * b11 + a02 * b21;

    if (!det) {
        return null;
    }

    det = 1.0 / det;
    let out = [0, 0, 0, 0, 0, 0, 0, 0, 0];
    out[0] = b01 * det;
    out[1] = (-a22 * a01 + a02 * a21) * det;
    out[2] = (a12 * a01 - a02 * a11) * det;
    out[3] = b11 * det;
    out[4] = (a22 * a00 - a02 * a20) * det;
    out[5] = (-a12 * a00 + a02 * a10) * det;
    out[6] = b21 * det;
    out[7] = (-a21 * a00 + a01 * a20) * det;
    out[8] = (a11 * a00 - a01 * a10) * det;
    return out;
}

function mat3_mul(a, b) {
    /* 0 1 2
       3 4 5
       6 7 8 */

    let res = new Array(9);
    res[0] = a[0] * b[0] + a[1] * b[3] + a[2] * b[6];
    res[1] = a[0] * b[1] + a[1] * b[4] + a[2] * b[7];
    res[2] = a[0] * b[2] + a[1] * b[5] + a[2] * b[8];

    res[3] = a[3] * b[0] + a[4] * b[3] + a[5] * b[6];
    res[4] = a[3] * b[1] + a[4] * b[4] + a[5] * b[7];
    res[5] = a[3] * b[2] + a[4] * b[5] + a[5] * b[8];

    res[6] = a[6] * b[0] + a[7] * b[3] + a[8] * b[6];
    res[7] = a[6] * b[1] + a[7] * b[4] + a[8] * b[7];
    res[8] = a[6] * b[2] + a[7] * b[5] + a[8] * b[8];

    return res;
}


function mat3_mul_vec(a, b) {
    let res = new Array(3);
    res[0] = a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
    res[1] = a[3] * b[0] + a[4] * b[1] + a[5] * b[2];
    res[2] = a[6] * b[0] + a[7] * b[1] + a[8] * b[2];

    return res;
}

function mat3_transpose(a) {

    return [a[0], a[3], a[6],
        a[1], a[4], a[7],
        a[2], a[5], a[8]
    ];
}


function scale_mat3(a) {
    return [a, 0, 0,
            0, a, 0,
            0, 0, a];
}

function rot_x_mat3(a) {
    let c = Math.cos(a);
    let s = Math.sin(a);

    return [1, 0, 0,
            0, c,-s,
            0, s, c];
}
let rot_yz_mat3 = rot_x_mat3;

function rot_y_mat3(a) {
    let c = Math.cos(a);
    let s = Math.sin(a);

    return [c, 0, s,
            0, 1, 0,
           -s, 0, c];
}
let rot_zx_mat3 = rot_y_mat3;

function rot_z_mat3(a) {
    let c = Math.cos(a);
    let s = Math.sin(a);

    return [c, -s, 0,
            s,  c, 0,
            0,  0, 1];
}
let rot_xy_mat3 = rot_z_mat3;

function rot_aa_mat3(axis, angle) {
    let c = Math.cos(angle);
    let s = Math.sin(angle);

    let x = axis[0];
    let y = axis[1];
    let z = axis[2];

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

let ident_matrix = [1, 0, 0, 0, 1, 0, 0, 0, 1];
let ident_mat3 = ident_matrix;


function vec_add(a, b) {
    let r = new Array(a.length);
    for (let i = 0; i < a.length; i++)
        r[i] = a[i] + b[i];
    return r;
}

function vec_sub(a, b) {
    let r = new Array(a.length);
    for (let i = 0; i < a.length; i++)
        r[i] = a[i] - b[i];
    return r;
}

function vec_neg(a) {
    let r = new Array(a.length);
    for (let i = 0; i < a.length; i++)
        r[i] = -a[i];
    return r;
}

function vec_scale(a, x) {
    let r = new Array(a.length);
    for (let i = 0; i < a.length; i++)
        r[i] = a[i] * x;
    return r;
}

function vec_mul(a, b) {
    let r = new Array(a.length);
    for (let i = 0; i < a.length; i++)
        r[i] = a[i] * b[i];
    return r;
}


function vec_dot(a, b) {
    let r = 0;
    for (let i = 0; i < a.length; i++)
        r += a[i] * b[i];
    return r;
}


function vec_cross(a, b) {
    return [
         a[1] * b[2] - a[2] * b[1],
        -a[0] * b[2] + a[2] * b[0],
         a[0] * b[1] - a[1] * b[0]];
}

// noinspection JSUnusedGlobalSymbols
function vec_cross_2d(a, b) {
    return a[0] * b[1] - a[1] * b[0];
}

function vec_len_sq(a) {
    return vec_dot(a, a);
}

function vec_len(a) {
    let d = 0;
    for (let i = 0; i < a.length; i++)
        d += a[i] * a[i];

    return Math.sqrt(d);
}

function vec_eq(a, b) {
    for (let i = 0; i < a.length; i++)
        if (a[i] !== b[i])
            return false;

    return true;
}

function vec_norm(a) {
    let d = 0;
    for (let i = 0; i < a.length; i++)
        d += a[i] * a[i];

    d = 1.0 / Math.sqrt(d);
    let r = new Array(a.length);
    if (d < 0.00000001) {
        for (let i = 0; i < a.length; i++)
            r[i] = 0;
        return r;
    }

    for (let i = 0; i < a.length; i++)
        r[i] = a[i] * d;
    return r;
}

function vec_lerp(a, b, f) {
    let r = new Array(a.length);
    for (let i = 0; i < a.length; i++)
        r[i] = lerp(a[i], b[i], f);
    return r;
}

function between(a, b, f) {
    return (f - a) / (b - a);
}

function lerp(a, b, f) {
    if (f === 0)
        return a;
    else if (f === 1)
        return b;

    return a * (1 - f) + b * f;
}

function smooth_lerp(a, b, f) {
    if (f === 0)
        return a;
    else if (f === 1)
        return b;

    f = f * f * (3.0 - 2.0 * f);

    return a * (1 - f) + b * f;
}

function saturate(x) {
    return Math.max(0.0, Math.min(x, 1.0));
}

function clamp(x, a, b) {
    return Math.max(a, Math.min(x, b));
}

function iround(x) {
    return Math.floor(x + 0.5);
}

function step(edge0, x) {
    return x > edge0 ? 1 : 0;
}

function hash(x) {
    return (((Math.sin(x) * 0.5 + 0.5) * 43758.5453) % 1);
}

function sharp_step(edge0, edge1, x) {
    return saturate((x - edge0) / (edge1 - edge0));
}

function smooth_step(edge0, edge1, x) {
    x = sharp_step(edge0, edge1, x);
    return x * x * (3.0 - 2.0 * x);
}

function rgba_hex_color(rgb, a = 1) {
    return [(((rgb >> 16) & 0xff) / 255.0) * a, (((rgb >> 8) & 0xff) / 255.0) * a, ((rgb & 0xff) / 255.0) * a, a];
}

function rgba255_sq_color(r, g, b, a) {
    return [(r / 255.0) * (r / 255.0) * a, (g / 255.0) * (g / 255.0) * a, (b / 255.0) * (b / 255.0) * a, a];
}

function rgba255_color(r, g, b, a = 1) {
    return [(r / 255.0) * a, (g / 255.0) * a, (b / 255.0) * a, a];
}

function rgba_color_string(rgba) {
    return "rgba(" + iround(saturate(rgba[0]) * 255) + "," +
        iround(saturate(rgba[1]) * 255) + "," +
        iround(saturate(rgba[2]) * 255) + "," +
        saturate(rgba[3]) + ")";
}

function flatten(a) {
    let r = [];
    for (let i = 0; i < a.length; i++) {
        let aa = a[i];
        if (aa.constructor !== Array) {
            r.push(aa)
            continue;
        }
        for (let k = 0; k < aa.length; k++) {
            r.push(aa[k]);
        }
    }

    return r;
}

function rand(N = 1) {
    let r = 0.0;
    for (let i = 0; i < N; i++) {
        r += Math.random() / N
    }
    return r;
}

function rand2(N = 1) {
    return lerp(-1, 1, rand())
}

function randv(dim) {
    return new Array(dim).fill(0).map(_x => rand2())
}

function iota(n, start = 0) {
    let r = [];
    for (let i = 0; i < n; i++) {
        r.push(i + start)
    }
    return r;
}

// https://stackoverflow.com/questions/9960908/permutations-in-javascript
function permutations(l) {
  let length = l.length;
  let result = [l.slice()];
  let c = new Array(length).fill(0);
  let i = 1;

  while (i < length) {
    if (c[i] < i) {
      let k = i % 2 && c[i];
      let p = l[i];
      l[i] = l[k];
      l[k] = p;
      ++c[i];
      i = 1;
      result.push(l.slice());
    } else {
      c[i] = 0;
      ++i;
    }
  }
  return result;
}

function difference(l) {
    let n = l.length;
    let result = new Array(n);
    for (let i = 0; i < n; i++) {
        result[i] = l[(i+1) % n] - l[i];
    }
    return result;
}

function permutationCycles(l) {
    let r = l.slice().sort();
    assert(() => r.length > 0)
    assert(() => r[0] === 0)
    for (let i = 0; i < r.length; i++) {
        assert(() => r[i] === i)
    }
    
    let visited = new Array(l.length).fill(false);
    let cycles = []
    while (true) {
        let i = visited.indexOf(false);
        if (i < 0)
            break;
        let cycle = []
        while (l[i] !== cycle[0]) {
            cycle.push(l[i])
            visited[l[i]] = true;
            i = l[i];
        }
        cycles.push(cycle)
    }
    return cycles;
}

// https://stackoverflow.com/a/20703469/9919772
function permutationParity(l) {
    let parity = 0;
    for (let cycle of permutationCycles(l)) {
        parity += (cycle.length - 1) % 2;
    }
    return parity;
}

function permutationSign(l) {
    return permutationParity(l) % 2 === 0 ? 1 : -1;
}

function add1(l) {
    if (l instanceof Array) {
        return l.map(add1);
    }
    assert(() => l instanceof Real)
    return l + 1;
}

function sub1(l) {
    if (l instanceof Array) {
        return l.map(sub1);
    }
    assert(() => l instanceof Real)
    return l - 1;
}

function prod(l) {
    if (l instanceof Array) {
        let r = 1;
        for (let v of l.map(prod))
            r *= v;
        return r;
    }
    assert(() => l instanceof Real)
    return l;
}

function zeros(shape) {
    return new Array(prod(shape)).fill(0)
}

function at(l, i) {
    if (i < 0)
        i += l.length;
    return l[i]
}

function strides(shape) {
    let multiplier = new Array(shape.length + 1).fill(1);
    for (let i = shape.length - 1; i >= 0; i-- ) {
        for (let j = i; j >= 0; j--) {
            multiplier[j] *= shape[i];
        }
    }
    return multiplier.slice(1);
}

function coord(stride, coord) {
    assert(() => stride.length === coord.length)
    let r = 0;
    for (let i = 0; i < coord.length; i++) {
        r += stride[i] * coord[i];
    }
    return r;
}

function leviCivita(dim) {
    assert(() => dim === 2 || dim === 3 || dim === 4);
    let shape = new Array(dim).fill(dim);
    let M = zeros(shape);
    let stride = strides(shape)
    if (dim === 2) {
        for (let [i, j] of permutations([0,1])) {
            M[coord(stride, [i, j])] += permutationSign([i,j])
        }
    } else if (dim === 3) {
        for (let [i, j, k] of permutations([0,1,2])) {
            M[coord(stride, [i, j, k])] += permutationSign([i,j,k])
        }
    } else if (dim === 4) {
        for (let [i, j, k, l] of permutations([0,1,2,3])) {
            M[coord(stride, [i,j,k,l])] += permutationSign([i,j,k,l])
        }
    }
    return M;
}

function sumAlongAxis(M, shape, axis) {
    let stride = strides(shape);
    let shape2 = shape.slice();
    shape2[axis] = 1;
    let res = zeros(shape2);
    let stride2 = strides(shape2);
    for (let i = 0; i < shape[0]; i++) {
        for (let j = 0; j < shape[1] ?? 1; j++) {
            for (let k = 0; k < shape[2] ?? 1; k++) {
                for (let l = 0; l < shape[3] ?? 1; l++) {
                    let coord1 = [i,j,k,l];
                    let coord2 = [i, j, k, l];
                    coord2[axis] = 0;
                    res[coord(stride2, coord2)] += M[coord(stride, coord1)];
                }
            }
        }
    }
    return res;
}

document.addEventListener("DOMContentLoaded", function () {
    if (window.bc_touch_down_state === undefined) {
        window.bc_touch_down_state = false;
        document.addEventListener("touchstart", function (_e) {
            window.bc_touch_down_state = true;
        }, false);
        document.addEventListener("touchend", function (_e) {
            window.bc_touch_down_state = false;
        }, false);

        document.addEventListener("touchcancel", function (_e) {
            window.bc_touch_down_state = false;
        }, false);
    }
});


window.TouchHandler = function (target, begin, move, end, {lock} = {lock: false}) {

    target.addEventListener("mousedown", mouse_down, false);

    let prevPos = null;

    function fixupMouseEvent(e) {
        prevPos ??= canvasSpace(e);
        if (e.changedTouches != null) {
            for (let i = 0; i < e.changedTouches.length; i++) {
                fixupMouseEvent(e.changedTouches[i]);
            }
        }
        // return e;
        if (e.movementX == null) {
            let old = prevPos;
            let cur = canvasSpace(e);
            e.movementX = -(cur[0] - old[0]);
            e.movementY = (cur[1] - old[1]);
            prevPos = cur;
        }
    }

    async function mouse_down(e) {
        fixupMouseEvent(e);
        if (lock) {
            const isSafari = !!window.GestureEvent;
            if (!isSafari && target.requestPointerLock)
                await target.requestPointerLock();
        }
        window.addEventListener("mousemove", mouse_move, false);
        window.addEventListener("mouseup", mouse_up, false);

        let res = begin ? await begin(e) : true;

        if (res && e.preventDefault)
            e.preventDefault();
        return res;
    }

    async function mouse_move(e) {
        fixupMouseEvent(e);
        return move ? await move(e) : true;
    }

    async function mouse_up(e) {
        fixupMouseEvent(e);
        window.removeEventListener("mousemove", mouse_move, false);
        window.removeEventListener("mouseup", mouse_up, false);
        if (lock && document.exitPointerLock)
            document.exitPointerLock();

        return end ? await end(e) : true;
    }


    target.addEventListener("touchstart", touch_down, false);


    let identifier;

    async function touch_down(e) {
        fixupMouseEvent(e);


        if (!identifier) {
            window.addEventListener("touchmove", touch_move, false);
            window.addEventListener("touchend", touch_end, false);
            window.addEventListener("touchcancel", touch_end, false);
            let touch = e.changedTouches[0];

            identifier = touch.identifier;
            touch.timeStamp = e.timeStamp;

            let res = begin ? await begin(touch) : true;

            if (res && e.preventDefault)
                e.preventDefault();
            return res;
        }
        return false;


    }

    async function touch_move(e) {
        fixupMouseEvent(e);

        if (!move)
            return true;

        for (let i = 0; i < e.changedTouches.length; i++) {

            let touch = e.changedTouches[i];

            if (touch.identifier === identifier) {
                touch.timeStamp = e.timeStamp;

                return await move(touch);
            }
        }
    }


    async function touch_end(e) {
        fixupMouseEvent(e);

        for (let i = 0; i < e.changedTouches.length; i++) {
            let touch = e.changedTouches[i];

            if (touch.identifier === identifier) {
                touch.timeStamp = e.timeStamp;

                identifier = undefined;

                window.removeEventListener("touchmove", touch_move, false);
                window.removeEventListener("touchend", touch_end, false);
                window.removeEventListener("touchcancel", touch_end, false);
                return end ? await end(touch) : true;
            }
        }


        return true;
    }
}


window.Dragger = function (target, callback) {

    target.onmousedown = mouse_down;
    target.addEventListener("touchstart", genericTouchHandler(mouse_down), false);

    let move_handler = genericTouchHandler(mouse_move);

    let prev_mouse_x, prev_mouse_y;

    function mouse_down(e) {

        prev_mouse_x = e.clientX;
        prev_mouse_y = e.clientY;


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
        callback(e.clientX - prev_mouse_x, e.clientY - prev_mouse_y);

        prev_mouse_x = e.clientX;
        prev_mouse_y = e.clientY;

        return true;
    }

    function mouse_up(_e) {
        window.removeEventListener("mousemove", mouse_move, false);
        window.removeEventListener("mouseup", mouse_up, false);

        window.removeEventListener("touchmove", move_handler, false);
        window.removeEventListener("touchend", mouse_up, false);
        window.removeEventListener("touchcancel", mouse_up, false);
    }
}

window.SegmentedControl = function (container_div, callback, values) {
    let container = document.createElement("div");
    container.style.position = "relative";
    container.classList.add("segmented_control_container");
    container.classList.add("non_selectable");

    container.onclick = mouse_click;

    container_div.appendChild(container);

    let segments = [];
    let option = 0;
    let pad = 2.0;

    for (let i = 0; i < values.length; i++) {
        let el = document.createElement("div");
        el.style.top = pad + "px";
        el.classList.add("segmented_control_off");
        el.innerHTML = values[i];
        container.appendChild(el);
        segments.push(el);
    }

    segments[option].classList.remove("segmented_control_off");
    segments[option].classList.add("segmented_control_on");

    window.addEventListener("resize", layout, true);
    window.addEventListener("load", layout, true);


    layout();
    callback(option);

    this.set_selection = function (o) {

        if (option !== o) {

            segments[option].classList.remove("segmented_control_on");
            segments[option].classList.add("segmented_control_off");
            option = o;

            segments[option].classList.remove("segmented_control_off");
            segments[option].classList.add("segmented_control_on");

            callback(option);
        }
    }


    function layout() {
        let width = container_div.getBoundingClientRect().width;
        let w = Math.floor((width - (values.length + 1) * pad) / values.length);

        container.style.width = ((w + pad) * values.length + pad) + "px";

        for (let i = 0; i < values.length; i++) {
            let el = segments[i];
            el.style.left = (pad + (w + pad) * i) + "px";
            el.style.width = (w) + "px";
        }
    }

    function mouse_click(e) {

        let rect = container.getBoundingClientRect();
        let o = e.clientX - rect.left;
        o = Math.min(Math.max(0, Math.floor(o * values.length / rect.width)), values.length - 1);

        if (o !== option) {

            segments[option].classList.remove("segmented_control_on");
            segments[option].classList.add("segmented_control_off");
            option = o;

            segments[option].classList.remove("segmented_control_off");
            segments[option].classList.add("segmented_control_on");

            callback(option);
        }

        if (e.preventDefault)
            e.preventDefault();
        return true;
    }

}


window.SliderOptions = class SliderOptions {
    constructor(value = 0.5, from = 0.0, upto = 1.0, color = colorType) {
        this.value = value;
        this.from = from;
        this.upto = upto;
        this.color = Color.from(color);
    }
}

window.Slider = function (container_div, callback_value, style_prefix, default_value, disable_click, options = new SliderOptions(default_value ?? 0.5)) {
    this.options = options;

    let container = document.createElement("div");
    container.style.width = "100%";
    container.style.height = "0";
    container.style.position = "relative";
    container.classList.add("slider_container");
    if (style_prefix)
        container.classList.add(style_prefix + "slider_container");

    let left_gutter = document.createElement("div");
    left_gutter.classList.add("slider_left_gutter");
    if (style_prefix)
        left_gutter.classList.add(style_prefix + "slider_left_gutter");

    let right_gutter = document.createElement("div");
    right_gutter.classList.add("slider_right_gutter");
    if (style_prefix)
        right_gutter.classList.add(style_prefix + "slider_right_gutter");

    if (!disable_click) {
        left_gutter.onclick = mouse_click;
        right_gutter.onclick = mouse_click;
    }

    let knob_container = document.createElement("div");
    knob_container.style.width = "0";
    knob_container.style.height = "0";
    knob_container.style.top = "0"
    knob_container.style.position = "absolute";

    let knob = document.createElement("div");
    knob.classList.add("slider_knob");
    if (style_prefix)
        knob.classList.add(style_prefix + "slider_knob");

    this.set_color = function (color = colorType) {
        color = Color.from(color);
        if (color) {
            knob.style.backgroundColor = color.toHtml();
            left_gutter.style.backgroundColor = color.toHtml();
            right_gutter.style.backgroundColor = color.scaleOpacity(0.75).toHtml();
        } else {
            knob.style.backgroundColor = '';
            left_gutter.style.backgroundColor = '';
            right_gutter.style.backgroundColor = '';
        }
    }

    this.set_color(options.color);


    container_div.appendChild(container);
    container.appendChild(left_gutter);
    container.appendChild(right_gutter);
    container.appendChild(knob_container);
    knob_container.appendChild(knob);

    window.addEventListener("resize", layout, true);
    window.addEventListener("load", layout, true);

    this.dragged = false;
    let self = this;

    let percentage = between(options.from, options.upto, options.value);

    function callback(p) {
        callback_value.call(self, lerp(options.from, options.upto, p));
    }

    layout();
    callback(percentage);

    this.set_value = function (p) {
        percentage = between(options.from, options.upto, p);
        layout();
    }
    this.set = (p) => {
        this.set_value(p);
        callback(p);
    }

    this.knob_div = function () {
        return knob;
    }

    function layout() {
        let width = container.getBoundingClientRect().width;

        left_gutter.style.width = width * percentage + "px";
        left_gutter.style.left = "0";

        right_gutter.style.width = (width * (1.0 - percentage)) + "px";
        right_gutter.style.left = width * percentage + "px";

        knob_container.style.left = (width * percentage) + "px"
    }

    let selection_offset = 0;

    new TouchHandler(knob,
        function (e) {
            if (window.bc_touch_down_state)
                return false;

            e == e || window.event;
            let knob_rect = knob_container.getBoundingClientRect();
            selection_offset = e.clientX - knob_rect.left - knob_rect.width / 2;

            self.dragged = true;

            return true;
        },
        function (e) {
            let container_rect = container.getBoundingClientRect();
            let x = e.clientX - selection_offset - container_rect.left;

            let p = saturate(x / container_rect.width);

            if (percentage !== p) {
                percentage = p;
                layout();
                callback(p);
            }

            return true;
        },
        function (_e) {
            self.dragged = false;

        });


    function mouse_click(e) {
        let container_rect = container.getBoundingClientRect();
        let x = e.clientX - container_rect.left;

        let p = Math.max(0, Math.min(1.0, x / container_rect.width));

        if (percentage !== p) {
            percentage = p;
            layout();
            callback(p);
        }

        return true;
    }
}


window.Shader = function (gl, vert_src, frag_src, attributes_names, uniforms_names) {

    let vert = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vert, vert_src);
    gl.compileShader(vert);

    const vert_message = gl.getShaderInfoLog(vert);
    if (vert_message.length > 0) {
        console.log(vert_message);
    }

    let frag = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(frag, frag_src);
    gl.compileShader(frag);

    const frag_message = gl.getShaderInfoLog(frag);
    if (frag_message.length > 0) {
        console.log(frag_message);
        // throw new Error('Parameter is not a number!');
    }

    let shader = gl.createProgram();
    gl.attachShader(shader, vert);
    gl.attachShader(shader, frag);
    gl.linkProgram(shader);

    if (!gl.getProgramParameter(shader, gl.LINK_STATUS)) {
        const info = gl.getProgramInfoLog(shader);
        console.log(info);
    }

    this.shader = shader;

    this.attributes = {};
    this.uniforms = {};

    if (attributes_names) {
        for (let i = 0; i < attributes_names.length; i++)
            this.attributes[attributes_names[i]] = gl.getAttribLocation(shader, attributes_names[i]);
    }

    if (uniforms_names) {
        for (let i = 0; i < uniforms_names.length; i++)
            this.uniforms[uniforms_names[i]] = gl.getUniformLocation(shader, uniforms_names[i]);
    }
}


function ArcBall(matrix, callback) {
    this.x_offset = 0;
    this.y_offset = 0;
    this.matrix = matrix ? matrix.slice() : [1, 0, 0, 0, 1, 0, 0, 0, 1];
    this.callback = callback;
    this.last_timestamp = 0;
    this.last_velocity = 0;
}

ArcBall.prototype.set_viewport_size = function (width, height) {
    this.width = width;
    this.height = height;
}

ArcBall.prototype.set_viewport = function (x, y, width, height) {
    this.x_offset = x;
    this.y_offset = y;
    this.width = width;
    this.height = height;
}

ArcBall.prototype.start = function (x, y) {
    this.last_x = x;
    this.last_y = y;
    this.last_velocity = 0;

    if (this.last_request) {
        window.cancelAnimationFrame(this.last_request);
        this.last_request = 0;
    }
}

ArcBall.prototype.set_matrix = function (m) {
    this.matrix = m.slice();
    this.last_velocity = 0;

    if (this.last_request) {
        window.cancelAnimationFrame(this.last_request);
        this.last_request = 0;
    }
}

ArcBall.prototype.end = function (event_timestamp) {

    if (!this.callback)
        return;

    if (event_timestamp - this.last_timestamp > 40)
        return;

    if (this.last_velocity < 0.0001)
        return;

    let last_timestamp = 0;

    let self = this;
    let mat = this.matrix;
    let a = 0;

    function tick(timestamp) {

        if (self.last_velocity < 0.0001)
            return;

        if (last_timestamp) {
            let dt = timestamp - last_timestamp;

            while (dt-- > 0) {
                a += self.last_velocity;
                self.last_velocity *= 0.995;
            }
        }

        last_timestamp = timestamp;

        let rot = rot_aa_mat3(self.last_rotation_axis, a);

        self.matrix = mat3_mul(rot, mat);

        self.callback();

        self.last_request = window.requestAnimationFrame(tick);
    }

    this.last_request = window.requestAnimationFrame(tick);
}


ArcBall.prototype.vec = function (x, y) {
    let size = Math.min(this.width, this.height) * 0.5 * 1.3;
    let p = [(x - this.x_offset - this.width / 2) / size,
        (y - this.y_offset - this.height / 2) / size, 0
    ];
    p[0] = -p[0];
    p[1] = -p[1];

    let d = p[0] * p[0] + p[1] * p[1];
    if (d <= 0.5) {
        p[2] = Math.sqrt(1 - d);
    } else {
        p[2] = 1 / (2 * Math.sqrt(d));
    }

    return p;
}

ArcBall.prototype.update = function (x, y, timestamp) {
    // return this.updateDelta(x - this.last_x, y - this.last_y, timestamp);
    if (x === this.last_x && y === this.last_y)
        return;

    let va = this.vec(this.last_x, this.last_y);
    let vb = this.vec(x, y);

    let angle = Math.acos(Math.min(1.0, vec_dot(vec_norm(va), vec_norm(vb))));

    angle = Math.max(angle, vec_len(vec_sub(vb, va)));

    let axis = vec_norm(vec_cross(va, vb))
    let axis_len = vec_len_sq(axis);
    let dt = timestamp - this.last_timestamp;

    if (!isNaN(angle) && isFinite(angle) &&
        !isNaN(axis_len) && isFinite(axis_len) &&
        dt !== 0) {

        this.matrix = mat3_mul(rot_aa_mat3(axis, angle), this.matrix);

        this.last_rotation_axis = vec_norm(vec_cross(va, vb));
        this.last_velocity = 0.8 * angle / dt;
    }

    this.last_timestamp = timestamp;
    this.last_x = x;
    this.last_y = y;
}

ArcBall.prototype.updateDelta = function (dx, dy, timestamp) {
    if (dx === 0 && dy === 0)
        return;

    let va = this.vec(this.last_x, this.last_y);
    let vb = this.vec(this.last_x + dx, this.last_y + dy);

    let angle = Math.acos(Math.min(1.0, vec_dot(vec_norm(va), vec_norm(vb))));

    angle = Math.max(angle, vec_len(vec_sub(vb, va)));

    let axis = vec_norm(vec_cross(va, vb))
    let axis_len = vec_len_sq(axis);
    let dt = timestamp - this.last_timestamp;

    if (!isNaN(angle) && isFinite(angle) &&
        !isNaN(axis_len) && isFinite(axis_len) &&
        dt !== 0) {

        this.matrix = mat3_mul(rot_aa_mat3(axis, angle), this.matrix);

        this.last_rotation_axis = vec_norm(vec_cross(va, vb));
        this.last_velocity = 0.8 * angle / dt;
    }

    this.last_timestamp = timestamp;
    this.last_x += dx;
    this.last_y += dy;
}

function canvasSpace(e, target = e.target) {
    assert(() => {
        window.eClientX = e;
        return e.clientX != null || e.changedTouches != null;
    })
    if (e.clientX == null)
        return canvasSpace(e.changedTouches[0], target);
    let r = target.getBoundingClientRect();
    return [r.width - (e.clientX - r.left), (e.clientY - r.top)];
}

ArcBall.prototype.startWithBeginEvent = async function (e) {
    let p = canvasSpace(e);
    this.start(p[0], p[1]);
    // if (e.target.requestPointerLock)
    //     await e.target.requestPointerLock()
}
ArcBall.prototype.updateWithMoveEvent = function (e) {
    if (e.movementX == null) {
        let p = canvasSpace(e);
        this.update(p[0], p[1], e.timeStamp);
    } else {
        this.updateDelta(-e.movementX, e.movementY, e.timeStamp);
    }
    return this.matrix.slice();
}


function TwoAxis() {
    this.angles = [0, 0];
    this.last_timestamp = 0;
    this.last_velocity = 0;
}

TwoAxis.prototype.set_size = function (size) {
    this.scale = [-2 / size[0], 2 / size[1]];
}

TwoAxis.prototype.set_callback = function (callback) {
    this.callback = callback;
}


TwoAxis.prototype.set_horizontal_limits = function (limits) {
    this.horizontal_limits = limits;
}

TwoAxis.prototype.set_vertical_limits = function (limits) {
    this.vertical_limits = limits;
}


TwoAxis.prototype.start = function (x, y) {
    this.last_position = [x, y];
    this.last_velocity = 0;

    if (this.last_request) {
        window.cancelAnimationFrame(this.last_request);
        this.last_request = 0;
    }
}

TwoAxis.prototype.set_angles = function (angles, continue_velocity) {

    this.angles = angles.slice();
    if (this.vertical_limits)
        this.angles[1] = Math.max(this.vertical_limits[0], Math.min(this.angles[1], this.vertical_limits[1]));

    if (this.horizontal_limits)
        this.angles[0] = Math.max(this.horizontal_limits[0], Math.min(this.angles[0], this.horizontal_limits[1]));

    this.matrix = mat3_mul(rot_x_mat3(this.angles[1]), rot_z_mat3(this.angles[0]));

    if (!continue_velocity) {
        this.last_velocity = 0;

        if (this.last_request) {
            window.cancelAnimationFrame(this.last_request);
            this.last_request = 0;
        }
    }
}

TwoAxis.prototype.end = function (event_timestamp) {
    if (!this.callback)
        return;

    if (event_timestamp - this.last_timestamp > 40)
        return;

    if (vec_len_sq(this.last_velocity) < 0.00000001)
        return;

    let last_timestamp = 0;

    let self = this;

    function tick(timestamp) {

        if (vec_len_sq(self.last_velocity) < 0.00000001)
            return;

        if (last_timestamp) {
            let dt = timestamp - last_timestamp;

            while (dt-- > 0) {
                self.set_angles(vec_add(self.angles, self.last_velocity), true);
                self.last_velocity = vec_scale(self.last_velocity, 0.995);
            }
        }

        last_timestamp = timestamp;

        self.callback();

        self.last_request = window.requestAnimationFrame(tick);
    }

    this.last_request = window.requestAnimationFrame(tick);
}

TwoAxis.prototype.update = function (x, y, timestamp) {
    if (x === this.last_position[0] && y === this.last_position[1])
        return;

    let position = [x, y];

    let delta = vec_mul(vec_sub(position, this.last_position), this.scale);

    this.set_angles(vec_add(this.angles, delta));

    let dt = timestamp - this.last_timestamp;

    if (dt !== 0) {
        this.last_velocity = vec_scale(delta, 1 / dt);
    }

    this.last_timestamp = timestamp;
    this.last_position = position;
}

function draw_camera_axes(ctx, l, rot) {
    ctx.save();

    ctx.lineWidth = 2;
    ctx.lineCap = "round";

    let points = [
        [1, 0, 0],
        [0, 1, 0],
        [0, 0, 1]
    ];
    points = points.map(p => mat3_mul_vec(rot, p));
    points = points.map(p => vec_scale(p, l));

    points[0].push("#EC5151");
    points[1].push("#55C432");
    points[2].push("#418DE2");

    points.sort((a, b) => a[2] - b[2]);

    for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.strokeStyle = points[i][3];
        ctx.lineTo(0, 0);
        ctx.lineTo(points[i][0], -points[i][1]);
        ctx.stroke();

    }

    ctx.restore();
}