import { EventEmitter } from 'events';
import BezierPath from './BezierPath';
import Point, { PointShape } from './Point';
import LineSegment, { LineSegmentType, LineSegmentOptions } from './LineSegment';
import CanvasTransformer, { Coords } from './CanvasTransformer';
import { Vector2 } from 'math.gl';

export enum Mode {
    Panning = 1,
    Selecting,
    Adding,
    Drawing,
    Editing,
    Removing,
    Inserting,
    Modifying,
    Dragging,
}

export type BezierToolOptions = {
    createSmoothLineSegments?: boolean;
    hideAnchorPoints?: boolean;
    hideControlPoints?: boolean;
    simplifyPathTolerance?: number;
    minDrawPointSpacing?: number;
    anchorPointShape?: PointShape;
    controlPointShape?: PointShape;
    anchorPointColor?: string;
    controlPointColor?: string;
    anchorPointRadius?: number;
    controlPointRadius?: number;
    lineColor?: string;
    lineWeight?: number;
}

export default class BezierTool extends EventEmitter {

    static ALT_KEY_DOWN: boolean;
    static META_KEY_DOWN: boolean;
    static CTRL_KEY_DOWN: boolean;
    static SHIFT_KEY_DOWN: boolean;
    static X_KEY_DOWN: boolean;

    public mainCanvas: HTMLCanvasElement;
    public mainCtx: CanvasRenderingContext2D;
    public offscreenCanvas: HTMLCanvasElement;
    public offscreenCtx: CanvasRenderingContext2D;
    public bitmapCanvas: HTMLCanvasElement;
    public bitmapCtx: CanvasRenderingContext2D;
    public bezierPath: BezierPath;
    public mode: Mode; //gState;
    public backgroundImg: HTMLImageElement;
    public WIDTH;
    public HEIGHT;


    private _mouseDownHandler: any = this.handleDown.bind(this);
    private _mouseUpHandler: any = this.handleUp.bind(this);
    private _mouseMoveHandler: any = this.handleMouseMove.bind(this);
    private _touchstartHandler: any = this.handleTouchStart.bind(this);
    private _touchmoveHandler: any = this.handleTouchMove.bind(this);
    private _touchendHandler: any = this.handleTouchEnd.bind(this);
    private _scrollHandler: any = this.handleScroll.bind(this);
    private _iOSDevice = !!navigator.platform.match(/iPhone|iPod|iPad/);
    private _androidDevice = !!navigator.platform.match(/Android|Linux|null/);

    private _previousClickTime: number;
    private _doubleClick: boolean;
    private _lastTouchDistance: number;

    private _addButton: HTMLInputElement;
    private _selectButton: HTMLInputElement;
    private _removeButton: HTMLInputElement;
    private _drawButton: HTMLInputElement;
    private _options: BezierToolOptions;
    private _canvasTxr: CanvasTransformer;

    constructor(options?: BezierToolOptions) {
        super();
        options = options || {};
        let defaultOptions = {
            createSmoothLineSegments: false,
            hideAnchorPoints: false,
            hideControlPoints: false,
            simplifyPathTolerance: 60,
            minDrawPointSpacing: 10,
            anchorPointShape: PointShape.Square,
            controlPointShape: PointShape.Circle,
            anchorPointColor: 'blue',
            controlPointColor: 'magenta',
            anchorPointRadius: 4,
            controlPointRadius: 4,
            lineColor: 'magenta',
            lineWeight: 1,
        };
        this._options = Object.assign(defaultOptions, options);
    }

    setupUI(): void {
        this.mainCanvas = document.getElementById('bezierCanvas') as HTMLCanvasElement;
        this.mainCtx = this.mainCanvas.getContext('2d');
        this.mainCtx.imageSmoothingEnabled = false;
        this.HEIGHT = this.mainCanvas.height;
        this.WIDTH = this.mainCanvas.width;

        this.offscreenCanvas = document.createElement('canvas');
        this.offscreenCanvas.height = this.HEIGHT;
        this.offscreenCanvas.width = this.WIDTH;
        this.offscreenCtx = this.offscreenCanvas.getContext('2d');
        this.offscreenCtx.imageSmoothingEnabled = false;

        this.bitmapCanvas = document.getElementById("bitmapCanvas") as HTMLCanvasElement;
        this.bitmapCtx = this.bitmapCanvas.getContext("2d");

        this._canvasTxr = new CanvasTransformer(this.offscreenCanvas);

        var setSrcButton = document.getElementById('addImgSrc');
        setSrcButton.addEventListener('click', () => {
            var input: HTMLInputElement = document.getElementById('imageSrc') as HTMLInputElement;
            this.backgroundImg = document.createElement('img');
            this.backgroundImg.width = this.WIDTH;
            // No image if invalid path
            this.backgroundImg.onerror = () => {
                this.backgroundImg = null;
            };
            this.backgroundImg.onload = () => {
                this._canvasTxr.image = this.backgroundImg; //DEBUG
                this.render();
                this.renderImageProcessingCanvas();
            };
            this.backgroundImg.src = input.value;
        }, false);

        this.setupKeyHandlers();
        this.setupTouchHandlers();
        this._setMode(Mode.Selecting);
    }

    setupKeyHandlers(): void {
        BezierTool.ALT_KEY_DOWN = false;
        BezierTool.META_KEY_DOWN = false;
        BezierTool.CTRL_KEY_DOWN = false;
        BezierTool.SHIFT_KEY_DOWN = false;

        document.onkeydown = (event: KeyboardEvent) => {
            BezierTool.ALT_KEY_DOWN = event.altKey;
            BezierTool.META_KEY_DOWN = event.metaKey;
            BezierTool.CTRL_KEY_DOWN = event.ctrlKey;
            BezierTool.SHIFT_KEY_DOWN = event.shiftKey;
            if (event.key === 'x' && event.type === 'keydown') BezierTool.X_KEY_DOWN = true;
            this.handleKeyDown(event);
        }

        document.onkeyup = (event: KeyboardEvent) => {
            BezierTool.ALT_KEY_DOWN = event.altKey;
            BezierTool.META_KEY_DOWN = event.metaKey;
            BezierTool.CTRL_KEY_DOWN = event.ctrlKey;
            BezierTool.SHIFT_KEY_DOWN = event.shiftKey;
            if (event.key === 'x' && event.type === 'keyup') BezierTool.X_KEY_DOWN = false;
            this.handleKeyUp(event);
        }
    }

    setupTouchHandlers(): void {
        console.log(`iOS: ${this._iOSDevice}, android: ${this._androidDevice}`);
        if (this._iOSDevice || this._androidDevice) {
            this.mainCanvas.addEventListener('touchstart', this._touchstartHandler, {passive: false});
            this.mainCanvas.addEventListener('touchend', this._touchendHandler, {passive: false});
        } else {
            this.mainCanvas.addEventListener("mousedown", this._mouseDownHandler, false);
            this.mainCanvas.addEventListener("mouseup", this._mouseUpHandler, false);
        }
        this.mainCanvas.addEventListener('DOMMouseScroll',this._scrollHandler,false);
        this.mainCanvas.addEventListener('mousewheel',this._scrollHandler,false);

        this._previousClickTime = new Date().getTime();
        this._doubleClick = false;
        this._lastTouchDistance = 0;
    }

    clearAllPoints(): void {
        var doDelete = confirm('Clear all points?');
        if (doDelete) {
            this.bezierPath = null;
            this._setMode(Mode.Selecting);
            this.render();
            this.renderImageProcessingCanvas();
        }
    }

    get options(): BezierToolOptions {
        return this._options;
    }

    handleKeyDown(event: any): void {
        switch(event.key) {
            case 'r':
                this.bezierPath.recalcuateControlPoints();
                this.render();
                break;
            case 'c':
                break;

        }
    }

    handleKeyUp(event: any): void {
    }

    lockControls(value: boolean): void {
        this._options.createSmoothLineSegments = value;
    }

    hideAnchors(value: boolean): void {
        this._options.hideAnchorPoints = value;
        this.render();
    }

    hideControls(value: boolean): void {
        this._options.hideControlPoints = value;
        this.render();
    }

    setSmoothing(value: number): void {
        this._options.simplifyPathTolerance = value;
    }

    setSpacing(value: number): void {
        this._options.minDrawPointSpacing = value;
    }

    private _setCursor(mode: Mode): void {
        switch (mode) {
            case Mode.Panning:
                this.mainCanvas.style.cursor = `url('assets/cursors/pan.png') 11 11, move`;
                break;
            case Mode.Selecting:
                this.mainCanvas.style.cursor = `url('assets/cursors/select.png') 7 3, default`;
                break;
            case Mode.Dragging:
                this.mainCanvas.style.cursor = `url('assets/cursors/select.png') 7 3, default`;
                break;
            case Mode.Adding:
                this.mainCanvas.style.cursor = `url('assets/cursors/add.png') 4 18, default`;
                break;
            case Mode.Drawing:
                this.mainCanvas.style.cursor = `url('assets/cursors/draw.png') 3 17, default`;
                break;
            case Mode.Editing:
                this.mainCanvas.style.cursor = `url('assets/cursors/edit.png') 7 3, default`;
                break;
            case Mode.Removing:
                this.mainCanvas.style.cursor = `url('assets/cursors/delete.png') 4 18, default`;
                break;
            case Mode.Inserting:
                this.mainCanvas.style.cursor = `url('assets/cursors/insert.png') 4 18, default`;
                break;
            case Mode.Modifying:
                break;
        }
    }

    // call _setMode from within BezierTool to emit the modeChange event
    private _setMode(mode: Mode, note: string = ''): void {
        this.setMode(mode, note);
        this.emit('modeChange');
    }

    // call setMode from outside BezierTool to suppress the modeChange event
    setMode(mode: Mode, note: string = ''): void {
        this.mode = mode;
        // console.log(`setMode: ${Mode[mode]}: ${note}`);
        this.mainCanvas.removeEventListener("mousemove", this._mouseMoveHandler, false);
        if (this.bezierPath) {
            this.bezierPath.clearNearestPointOnSegment();
        }
        this._setCursor(mode);
        switch(mode) {
            case Mode.Inserting:
                this.mainCanvas.addEventListener("mousemove", this._mouseMoveHandler, false);
                break;
        }
    }

    // bootstrap + bootstrap-theme: this.mainCanvas.offsetLeft, this.mainCanvas.offsetTop = 45, 209
    getMousePosition(e: any) {
        var x = 0;
        var y = 0;
        // if (e.pageX != undefined && e.pageY != undefined) {
        //     x = e.pageX;
        //     y = e.pageY;
        // }
        var rect = this.mainCanvas.getBoundingClientRect();
        x = e.clientX - rect.left - 3; // 3 is a magic number (corrects for border)
        y = e.clientY - rect.top - 3;

        // x = x - this.mainCanvas.offsetLeft - 3; // 3 is a magic number (corrects for border)
        // y = y - this.mainCanvas.offsetTop - 3;
        let txPoint = this._canvasTxr.transformedPoint(x, y);
        // console.log(`getMousePosition: (${x}, ${y}) -> (${txPoint.x}, ${txPoint.y})`);
        return {pt: new Point(txPoint.x, txPoint.y), pt0: new Point(x, y), e: {clientX: x, clientY: y}};
    }

    handleDownAdd(pos: Point) {
        let lineSegmentType = this._options.createSmoothLineSegments ? LineSegmentType.SMOOTH : LineSegmentType.CORNER;
        if (!this.bezierPath) {
            this.bezierPath = new BezierPath(pos, lineSegmentType, <LineSegmentOptions>this._options);
        } else {
            // If this was probably a selection, change to
            // select/drag mode
            if (this.handleDownSelect(pos)) {
                //
            } else {
                this.bezierPath.addPoint(pos, lineSegmentType, <LineSegmentOptions>this._options);
            }
        }
    }

    handleDownDraw(pos: Point) {
        let lineSegmentType = this._options.createSmoothLineSegments ? LineSegmentType.SMOOTH : LineSegmentType.CORNER;
        if (!this.bezierPath) {
            this.bezierPath = new BezierPath(pos, lineSegmentType, <LineSegmentOptions>this._options);
        } else {
            if (!this.bezierPath.tail.pathPointIntersects(pos)) {
                this.bezierPath.addPoint(pos, lineSegmentType, <LineSegmentOptions>this._options);
            }
        }
        this.mainCanvas.addEventListener("mousemove", this._mouseMoveHandler, false);
    }

    // Return true/false if dragging mode
    handleDownSelect(pos: Point): boolean {
        let result: boolean = false;
        if (!this.bezierPath) {
            this._setMode(Mode.Panning, '!this.bezierPath');
            this.mainCanvas.addEventListener("mousemove", this._mouseMoveHandler, false);
        } else {
            var selected = this.bezierPath.selectPoint(pos, {transformer: this._canvasTxr, hideAnchorPoints: this._options.hideAnchorPoints, hideControlPoints: this._options.hideControlPoints});
            if (selected) {
                if (BezierTool.ALT_KEY_DOWN || this._doubleClick) {
                    if (this.bezierPath.selectedSegment.type == LineSegmentType.SMOOTH) {
                        this.bezierPath.selectedSegment.type = LineSegmentType.CORNER;
                    } else {
                        this.bezierPath.selectedSegment.type = LineSegmentType.SMOOTH;
                    }
                } else if (BezierTool.X_KEY_DOWN) {
                    this.bezierPath.deletePoint(pos);
                } else {
                    this._setMode(Mode.Dragging);
                    this.mainCanvas.addEventListener("mousemove", this._mouseMoveHandler, false);
                }
                result = true;
            } else if (this.mode == Mode.Selecting) {
                this.bezierPath.deselectSegments();
                this._setMode(Mode.Panning, 'not selected');
                this.mainCanvas.addEventListener("mousemove", this._mouseMoveHandler, false);
            }
        }
        return result;
    }

    handleDownRemove(pos: Point) {
        if (!this.bezierPath) {
            //
        } else {
            var deleted = this.bezierPath.deletePoint(pos);
            if (!deleted) {
                this._setMode(Mode.Selecting, 'handleDownRemove');
            }
        }
    }

    handleDownInsert() {
        if (this.bezierPath) {
            this.bezierPath.insertPointOnSegment();
        }
        this._setMode(Mode.Selecting, 'handleDownInsert');
    }

    handleDown(event: any) {
        var pos = this.getMousePosition(event);
        this._canvasTxr.handleMousedown(pos.e);
        let doubleClickTime: number = new Date().getTime() - this._previousClickTime;
        if (doubleClickTime < 200) {
            this._doubleClick = true;
            console.log(`double-click`);
        }
        this._previousClickTime = new Date().getTime();
        // console.log(`handleDown: mode: ${Mode[this.mode]}`)
        switch (this.mode) {
            case Mode.Adding:
                this.handleDownAdd(pos.pt);
                break;
            case Mode.Selecting:
                this.handleDownSelect(pos.pt);
                break;
            case Mode.Removing:
                this.handleDownRemove(pos.pt);
                break;
            case Mode.Drawing:
                this.handleDownDraw(pos.pt);
                break;
            case Mode.Inserting:
                this.handleDownInsert();
                break;
        }
        this.render();
        event.preventDefault();
    }

    handleTouchStart(event: any): void {
        event.preventDefault();
        this.mainCanvas.addEventListener('touchmove', this._touchmoveHandler, {passive: false});
        if (event.targetTouches.length == 1) {
            let touch = event.targetTouches[0];
            this.handleDown(touch);
        } else if (event.targetTouches.length == 2) {
            let t1 = event.targetTouches[0];
            let t2 = event.targetTouches[1];
            let vA = new Vector2([t1.pageX ,t1.pageY]);
            let vB = new Vector2([t2.pageX ,t2.pageY]);
            let dist = vA.distanceTo(vB);
            let vAB = vB.clone();
            vAB.subtract(vA);
            vAB.scale(.5);
            let vMidpoint = vA.clone();
            vMidpoint.add(vAB);
            this._lastTouchDistance = dist;
            // let evt = {pageX: vMidpoint.x, pageY: vMidpoint.y, wheelDelta: 0, preventDefault: function(){}};
            // this._canvasTxr.handleMousemove(evt);
        }

    }

    handleMouseMove(event: any) {
        var pos = this.getMousePosition(event);

        if (this.mode == Mode.Dragging) {
            this.bezierPath.updateSelected(pos.pt);
        } else if (this.mode == Mode.Drawing) {
            let lineSegmentType = this._options.createSmoothLineSegments ? LineSegmentType.SMOOTH : LineSegmentType.CORNER;
            if (!this.bezierPath.tail.pathPointIntersects(pos.pt, this._options.minDrawPointSpacing)) {
                this.bezierPath.addPoint(pos.pt, lineSegmentType, <LineSegmentOptions>this._options);
            }
        } else if (this.mode == Mode.Panning) {
            var pos = this.getMousePosition(event);
            this._canvasTxr.handleMousemove(pos.e); //mousemove(pos);
        } else if (this.mode == Mode.Inserting) {
            if (this.bezierPath) {
                // console.log(`Inserting`, pos.pt.x, pos.pt.y);
                // this.bezierPath.selectNearestSegment(pos.pt);
                this.bezierPath.findNearestPointOnSegment(pos.pt);
            }
        }
        this.render();
    }

    handleTouchMove(event: any): void {
        event.preventDefault();
        if (event.targetTouches.length == 1) {
          var touch = event.targetTouches[0];
          this.handleMouseMove(touch);
        } else if (event.targetTouches.length == 2) {
            let t1 = event.targetTouches[0];
            let t2 = event.targetTouches[1];
            let vA = new Vector2([t1.pageX ,t1.pageY]);
            let vB = new Vector2([t2.pageX ,t2.pageY]);
            let dist = vA.distanceTo(vB);
            let vAB = vB.clone();
            vAB.subtract(vA);
            vAB.scale(.5);
            let vMidpoint = vA.clone();
            vMidpoint.add(vAB);
            let dz = dist - this._lastTouchDistance;
            this._lastTouchDistance = dist;
            let evt = {pageX: vMidpoint.x, pageY: vMidpoint.y, wheelDelta: dz, preventDefault: function(){}};
            this.handleScroll(evt);
        }
    }

    handleUp(e: any) {
        this.mainCanvas.removeEventListener("mousemove", this._mouseMoveHandler, false);
        this.mainCanvas.removeEventListener('touchmove', this._touchmoveHandler, false);
        this._canvasTxr.handleMouseup();

        if (this.mode == Mode.Dragging) {
            this.bezierPath.clearSelected();
            this._setMode(Mode.Selecting, 'handleUp, Dragging');
        } else if (this.mode == Mode.Drawing) {
            this.bezierPath.clearSelected();
            this.bezierPath.simplifyPath(this._options.simplifyPathTolerance);
            this._setMode(Mode.Selecting, 'handleUp, Drawing');
            this.render();
        } else if (this.mode == Mode.Panning) {
            this._setMode(Mode.Selecting, 'handleUp, Panning');
        }
        this._doubleClick = false;
        this.renderImageProcessingCanvas();
    }

    handleTouchEnd(event: any): void {
        this.handleUp(event);
        event.preventDefault();
    }

    handleScroll(event: any): void {
        this._canvasTxr.handleScroll(event);
        this.render();
    }

    render() {
        this._canvasTxr.redraw();
        this.mainCtx.clearRect(0, 0, this.WIDTH, this.HEIGHT);
        // if (this.bezierPath) {
        //     this.bezierPath.draw(this.offscreenCtx, {transformer: undefined, hideAnchorPoints: this._options.hideAnchorPoints, hideControlPoints: this._options.hideControlPoints});
        // }
        this.mainCtx.drawImage(this.offscreenCanvas, 0, 0);
        if (this.bezierPath) {
            this.bezierPath.draw(this.mainCtx, {transformer: this._canvasTxr, hideAnchorPoints: this._options.hideAnchorPoints, hideControlPoints: this._options.hideControlPoints});
        }
    }

    renderImageProcessingCanvas(): void {
        this.bitmapCtx.clearRect(0, 0, this.bitmapCanvas.width, this.bitmapCanvas.height);
        if (this.bezierPath) {
            if (this.backgroundImg) {
                this.bitmapCtx.drawImage(this.backgroundImg, 0, 0, this.bitmapCanvas.width, this.bitmapCanvas.height);
            }
            var imgData: ImageData = this.bitmapCtx.getImageData(0, 0, this.bitmapCanvas.width, this.bitmapCanvas.height);
            let transparent: number = 0;
            let polygon: any = this.bezierPath.getVertices();
			let i: number = 0;
			for (let y: number = 0; y < imgData.height; y++) {
				for (let x: number = 0; x < imgData.width; x++) {
                    if (this.isInPolygon(polygon, {x: x, y: y})) {
                        if (!this.backgroundImg) {
                            imgData.data[i] = 128;
                            imgData.data[i+1] = 128;
                            imgData.data[i+2] = 128;
                            imgData.data[i+3] = 255;
                        }
                    } else {
                        imgData.data[i + 3] = transparent;
                    }
					i += 4;
				}
			}

            this.bitmapCtx.putImageData(imgData, 0, 0);
        }
    }

    isInPolygon(poly: any[], p: any): boolean {
        let p1: any;
        let p2: any;
        let inside: boolean = false;

        if (poly.length < 3) {
            inside = false;
        } else {
                let oldPoint: any = { x: poly[poly.length - 1].x, y: poly[poly.length - 1].y };
                for (let i: number = 0; i < poly.length; i++) {
                    let newPoint = { x: poly[i].x, y: poly[i].y };
                    if (newPoint.x > oldPoint.x) {
                        p1 = oldPoint;
                        p2 = newPoint;
                    } else {
                        p1 = newPoint;
                        p2 = oldPoint;
                    }

                    if ((newPoint.x < p.x) == (p.x <= oldPoint.x)
                        && (p.y - p1.y)*(p2.x - p1.x) < (p2.y - p1.y)*(p.x - p1.x))
                    {
                        inside = !inside;
                    }
                    oldPoint = newPoint;
                }
        }
        return inside;
    }

    downloadSVG(): void {
        if (this.bezierPath) {
            let text: string =  this.bezierPath.toSvg();
            this.downloadFile('image/svg+xml', text, 'bezier.svg');
        }
    }

    downloadJSON(): void {
        if (this.bezierPath) {
            let text: string = JSON.stringify(this.bezierPath.toJson(), null, 2);
            this.downloadFile('application/json', text, 'bezier.json');
        }
    }

    downloadFile(mime: string, text: string, filename: string): void {
        var element = document.createElement('a');
        element.setAttribute('href', 'data:' + mime + ',' + text);
        element.setAttribute('download', filename);
        element.style.display = 'none';
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    }
/*
    //// Mesh

    void triangulateLine () {
        // Create Vector2 vertices
        // Vector2[] testVertices2D = new Vector2[] {
        //     new Vector2(0,0),
        //     new Vector2(0,50),
        //     new Vector2(50,50),
        //     new Vector2(50,100),
        //     new Vector2(0,100),
        //     new Vector2(0,150),
        //     new Vector2(150,150),
        //     new Vector2(150,100),
        //     new Vector2(100,100),
        //     new Vector2(100,50),
        //     new Vector2(150,50),
        //     new Vector2(150,0),
        // };
        // for (int i=0; i<testVertices2D.Length; i++) {
        //     testVertices2D[i].Set( testVertices2D[i].x / 100,  testVertices2D[i].y / 100);
        //     // Logger.Log("testVert: (" + testVertices2D[i].x + ", " + testVertices2D[i].y + ")");
        // }

        int pointCount = lineRenderer.positionCount - 1; // skip last point which is the same as the first
        Vector2[] lineVertices2D = new Vector2[pointCount];
        // Vector2 firstPoint = lineRenderer.GetPosition(0);
        // Logger.Log("firstPoint: (" + firstPoint.x + ", " + firstPoint.y + ")");
        for (int i=0; i<pointCount; i++) {
            Vector2 position = lineRenderer.GetPosition(i);
            // position.x -= firstPoint.x;
            // position.y -= firstPoint.y;
            // position.x /= 10;
            // position.y /= 10;
            lineVertices2D[i].Set(position.x, position.y);
        }

        Vector2[] vertices2D = lineVertices2D;
        // Use the triangulator to get indices for creating triangles
        Triangulator tr = new Triangulator(vertices2D);
        int[] indices = tr.Triangulate();

        // Create the Vector3 vertices
        Vector3[] vertices = new Vector3[vertices2D.Length];
        for (int i=0; i<vertices.Length; i++) {
            vertices[i] = new Vector3(vertices2D[i].x, vertices2D[i].y, 0);
        }

        // Create the mesh
        Mesh msh = new Mesh();
        msh.vertices = vertices;
        msh.triangles = indices;
        msh.RecalculateNormals();
        msh.RecalculateBounds();

        Vector2[] uv = new Vector2[vertices.Length];
        for (int i=0; i<vertices.Length; i++) {
            Vector2 vertex = vertices[i];
            float x = (vertex.x + 5.12f) / 10.24f;
            float y = 1.0f - (vertex.y - 3.84f) / -07.68f;
            uv[i] = new Vector2(x, y);
        }

        msh.uv = uv;

        // Set up game object with mesh;
        if (!meshRenderer) {
          meshRenderer = gameObject.AddComponent(typeof(MeshRenderer)) as MeshRenderer;
          meshRenderer.material = material;
        }
        if (!filter) {
          filter = gameObject.AddComponent(typeof(MeshFilter)) as MeshFilter;
        }

        filter.mesh = msh;
    }
*/
}
