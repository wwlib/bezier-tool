export type Coords = {
    x: number,
    y: number,
}

export default class CanvasTransformer {

    public canvas: HTMLCanvasElement;

    private _ctx: CanvasRenderingContext2D;
    private _svg: SVGSVGElement;
    private _xform: SVGMatrix;
    private _savedTransforms: SVGMatrix[];

    private _lastMousedown: Coords;
    private _lastMousemove: Coords;
    private _testImage: HTMLImageElement;
    private _iOSDevice = !!navigator.platform.match(/iPhone|iPod|iPad/);
    private _androidDevice = !!navigator.platform.match(/Android|Linux|null/);

    public mousedownHandler: any = this.handleMousedown.bind(this);
    public mouseupHandler: any = this.handleMouseup.bind(this);
    public mousemoveHandler: any = this.handleMousemove.bind(this);
    public touchstartHandler: any = this.handleTouchstart.bind(this);
    public touchendHandler: any = this.handleTouchend.bind(this);
    public touchmoveHandler: any = this.handleTouchmove.bind(this);
    public scrollHandler: any = this.handleScroll.bind(this);

    //DEBUG
    public lastX;
    public lastY;
    public dragStart;
    public dragged;
    public scaleFactor;
    public minScale: number;
    public maxScale: number;

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        this._ctx = canvas.getContext('2d');
        this._svg = document.createElementNS("http://www.w3.org/2000/svg", 'svg');
        this._xform = this._svg.createSVGMatrix();
        this._savedTransforms = [];

        this.lastX = canvas.width / 2
        this.lastY = canvas.height / 2;
        this.scaleFactor = 1.1;
        this.minScale = 1.0;
        this.maxScale = 5.0;
        // this.setupEvents(); //DEBUG
    }

    get ctx(): CanvasRenderingContext2D {
        return this._ctx;
    }

    set image(image: HTMLImageElement) {
        this._testImage = image;
        this.redraw();
    }

    redraw(image?: HTMLImageElement): void {
        image = image || this._testImage;
        // Clear the entire canvas
        var p1 = this.transformedPoint(0, 0);
        var p2 = this.transformedPoint(this.canvas.width, this.canvas.height);
        this.ctx.clearRect(p1.x, p1.y, p2.x - p1.x, p2.y - p1.y);
        this.ctx.save();
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.restore();
        if (image) {
            this.ctx.drawImage(image, 0, 0, this.canvas.width, this.canvas.height);
        }
    }

    getTransform(): SVGMatrix {
        return this._xform;
    };

    reset(): void {
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        this.redraw();
    }

    save(): void {
        this._savedTransforms.push(this._xform.translate(0, 0));
        this.ctx.save();
    }

    restore(): void {
        this._xform = this._savedTransforms.pop();
        this.ctx.restore();
    }

    scale(sx: number, sy: number): void {
        this._xform = this._xform.scaleNonUniform(sx, sy);
        this.ctx.scale(sx, sy);
    }

    rotate(radians): void {
        this._xform = this._xform.rotate(radians * 180 / Math.PI);
        this.ctx.rotate(radians);
    }

    translate(dx: number, dy: number): void {
        this._xform = this._xform.translate(dx, dy);
        this.ctx.translate(dx, dy);
    }

    transform(a: number, b: number, c: number, d: number, e: number, f: number): void {
        var m2 = this._svg.createSVGMatrix();
        m2.a = a; m2.b = b; m2.c = c; m2.d = d; m2.e = e; m2.f = f;
        this._xform = this._xform.multiply(m2);
        this.ctx.transform(a, b, c, d, e, f);
    }

    setTransform(a: number, b: number, c: number, d: number, e: number, f: number): void {
        this._xform.a = a;
        this._xform.b = b;
        this._xform.c = c;
        this._xform.d = d;
        this._xform.e = e;
        this._xform.f = f;
        this.ctx.setTransform(a, b, c, d, e, f);
    }

    transformedPoint(x: number, y: number): SVGPoint {
        let pt: SVGPoint = this._svg.createSVGPoint();
        pt.x = x;
        pt.y = y;
        return pt.matrixTransform(this._xform.inverse());
    }

    applyTransform(x: number, y: number): SVGPoint {
        let pt: SVGPoint = this._svg.createSVGPoint();
        pt.x = x;
        pt.y = y;
        return pt.matrixTransform(this._xform);
    }

    // events

    getScale(): number {
        return this._xform.a;
    }

    zoom(delta) {
        var pt = this.transformedPoint(this.lastX, this.lastY);
        var factor = Math.pow(this.scaleFactor, delta);
        let scale = this.getScale(); //this._xform.a;
        if (scale * factor >= this.minScale && scale * factor <= this.maxScale) {
            this.translate(pt.x,pt.y);
            this.scale(factor,factor);
            this.translate(-pt.x,-pt.y);
        }
        this.redraw();
    }

    handleScroll(evt) {
        var delta = evt.wheelDelta ? evt.wheelDelta/40 : evt.detail ? -evt.detail : 0;
        if (delta) this.zoom(delta);
        return evt.preventDefault() && false;
    };

    getMousePosition(e: any) {
        var x = 0;
        var y = 0;
        var rect = this.canvas.getBoundingClientRect();
        x = e.clientX - rect.left;
        y = e.clientY - rect.top;
        return {x: x, y: y};
    }

    handleMousedown(event: any) {
        document.body.style.webkitUserSelect = document.body.style.userSelect = 'none';
        this.canvas.addEventListener('mousemove', this.mousemoveHandler, false);
        let pt: Coords = this.getMousePosition(event);
        this.lastX = pt.x;
        this.lastY = pt.y
        this.dragStart = this.transformedPoint(pt.x, pt.y);
        this.dragged = false;
    }

    handleTouchstart(event: any): void {
        event.preventDefault();
        this.canvas.addEventListener('touchmove', this.touchmoveHandler, {passive: false});
        if (event.targetTouches.length == 1) {
            let touch = event.targetTouches[0];
            this.handleMousedown(touch);
        }
    }

    handleMousemove(event: any) {
        let pt: Coords = this.getMousePosition(event);
        this.lastX = pt.x;
        this.lastY = pt.y;
        this.dragged = true;

        if (this.dragStart) {
            var ptx = this.transformedPoint(pt.x, pt.y);
            this.translate(ptx.x - this.dragStart.x, ptx.y - this.dragStart.y);
            this.redraw();
        }
    }

    handleTouchmove(event: any): void {
        event.preventDefault();
        if (event.targetTouches.length == 1) {
            let touch = event.targetTouches[0];
            this.handleMousemove(touch);
        } else if (event.targetTouches.length == 2) {
            let touch = event.targetTouches[0];
            let pt: Coords = this.getMousePosition(touch);
            let diffY: number = pt.y - this.lastY;
            this.lastX = pt.x;
            this.lastY = pt.y;
            let evt = {pageX: pt.x, pageY: pt.y, wheelDelta: diffY, preventDefault: function(){}};
            this.handleScroll(evt);
        }
    }

    handleMouseup(event: any) {
        this.canvas.removeEventListener("mousemove", this.mousemoveHandler, false);
        this.dragStart = null;
    }

    handleTouchend(event: any): void {
        this.canvas.removeEventListener('touchmove', this.touchmoveHandler, false);
        this.handleMouseup(event);
        event.preventDefault();
    }

    setupTouchHandlers(): void {
        if (this._iOSDevice || this._androidDevice) {
            this.canvas.addEventListener('touchstart', this.touchstartHandler, {passive: false});
            this.canvas.addEventListener('touchend', this.touchendHandler, {passive: false});
        } else {
            this.canvas.addEventListener("mousedown", this.mousedownHandler, false);
            this.canvas.addEventListener("mouseup", this.mouseupHandler, false);
        }
        this.canvas.addEventListener('DOMMouseScroll',this.scrollHandler,false);
        this.canvas.addEventListener('mousewheel',this.scrollHandler,false);
    }

    dispose(): void {
        this.canvas.removeEventListener('mousedown', this.mousedownHandler, false);
        this.canvas.removeEventListener('mousemove', this.mousemoveHandler, false);
        this.canvas.removeEventListener('mouseup', this.mouseupHandler, false);
        this.canvas.removeEventListener('touchstart', this.touchstartHandler, false);
        this.canvas.removeEventListener('touchmove', this.touchmoveHandler, false);
        this.canvas.removeEventListener('touchend', this.touchendHandler, false);
        this.canvas.removeEventListener('DOMMouseScroll',this.scrollHandler,false);
        this.canvas.removeEventListener('mousewheel',this.scrollHandler,false);

        this.canvas = undefined;
        this._ctx = undefined;
        this._svg = undefined;
        this._xform = undefined;
        this._savedTransforms = undefined;
        this._testImage = undefined;
    }
}
