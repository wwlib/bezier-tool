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

    public mousedownHandler: any = this.handleMousedown.bind(this);
    public mouseupHandler: any = this.handleMouseup.bind(this);
    public mousemoveHandler: any = this.handleMousemove.bind(this);
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

    handleMousedown(evt: any) {
        document.body.style.webkitUserSelect = document.body.style.userSelect = 'none';
        this.lastX = evt.offsetX || (evt.pageX - this.canvas.offsetLeft);
        this.lastY = evt.offsetY || (evt.pageY - this.canvas.offsetTop);
        this.dragStart = this.transformedPoint(this.lastX, this.lastY);
        this.dragged = false;
    }

    handleMousemove(evt: any) {
        this.lastX = evt.offsetX || (evt.pageX - this.canvas.offsetLeft);
        this.lastY = evt.offsetY || (evt.pageY - this.canvas.offsetTop);
        this.dragged = true;

        if (this.dragStart) {
            var pt = this.transformedPoint(this.lastX, this.lastY);
            this.translate(pt.x - this.dragStart.x, pt.y - this.dragStart.y);
            this.redraw();
        }
    }

    handleMouseup(evt: any) {
        this.dragStart = null;
    }

    setupEvents(): void {
        this.canvas.addEventListener('mousedown', this.mousedownHandler, false);
        this.canvas.addEventListener('mousemove', this.mousemoveHandler, false);
        this.canvas.addEventListener('mouseup', this.mouseupHandler, false);
        this.canvas.addEventListener('DOMMouseScroll',this.handleScroll.bind(this),false);
        this.canvas.addEventListener('mousewheel',this.handleScroll.bind(this),false);
    }
}
