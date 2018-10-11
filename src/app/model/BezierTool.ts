import BezierPath from './BezierPath';
import Point, { PointShape } from './Point';
import { LineSegmentType, LineSegmentOptions } from './LineSegment';
import CanvasTransformer, { Coords } from './CanvasTransformer';
import { Vector2, Matrix4 } from 'math.gl';

// const panzoom = require('pan-zoom');

export enum Mode {
    Adding,
    Selecting,
    Dragging,
    Removing,
    Drawing,
    Panning
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

export default class BezierTool {

    static ALT_KEY_DOWN: boolean;
    static META_KEY_DOWN: boolean;
    static CTRL_KEY_DOWN: boolean;
    static SHIFT_KEY_DOWN: boolean;
    static X_KEY_DOWN: boolean;

    public gCanvas: HTMLCanvasElement;
    public gCtx: CanvasRenderingContext2D
    public gBackCanvas: HTMLCanvasElement;
    public gBackCtx: CanvasRenderingContext2D;
    public bitmapCanvas: HTMLCanvasElement;
    public bitmapCtx: CanvasRenderingContext2D;
    public gBezierPath: BezierPath;
    public mode: Mode; //gState;
    public gBackgroundImg: HTMLImageElement;
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

    private _previousClickTime: number;
    private _doubleClick: boolean;
    private _lastTouchDistance: number;

    private _addButton: HTMLInputElement;
    private _selectButton: HTMLInputElement;
    private _removeButton: HTMLInputElement;
    private _drawButton: HTMLInputElement;
    private _options: BezierToolOptions;
    private _canvasTxr: CanvasTransformer;
    private _drawingTransform: Matrix4 = undefined; // not currently used

    constructor(options?: BezierToolOptions) {
        options = options || {};
        let defaultOptions = {
            createSmoothLineSegments: false,
            hideAnchorPoints: true,
            hideControlPoints: true,
            simplifyPathTolerance: 60,
            minDrawPointSpacing: 10,
            anchorPointShape: PointShape.Square,
            controlPointShape: PointShape.Square,
            anchorPointColor: 'blue',
            controlPointColor: 'magenta',
            anchorPointRadius: 3,
            controlPointRadius: 3,
            lineColor: 'magenta',
            lineWeight: 1,
        };
        this._options = Object.assign(defaultOptions, options);

        this.gCanvas = document.getElementById('bezierCanvas') as HTMLCanvasElement;
        this.gCtx = this.gCanvas.getContext('2d');
        this.gCtx.imageSmoothingEnabled = false;
        this.HEIGHT = this.gCanvas.height;
        this.WIDTH = this.gCanvas.width;

        this.gBackCanvas = document.createElement('canvas');
        this.gBackCanvas.height = this.HEIGHT;
        this.gBackCanvas.width = this.WIDTH;
        this.gBackCtx = this.gBackCanvas.getContext('2d');
        this.gBackCtx.imageSmoothingEnabled = false;

        this.bitmapCanvas = document.getElementById("bitmapCanvas") as HTMLCanvasElement;
        this.bitmapCtx = this.bitmapCanvas.getContext("2d");

        this._canvasTxr = new CanvasTransformer(this.gBackCanvas);

        if (this._iOSDevice) {
            this.gCanvas.addEventListener('touchstart', this._touchstartHandler, {passive: false});
            this.gCanvas.addEventListener('touchend', this._touchendHandler, {passive: false});
        } else {
            this.gCanvas.addEventListener("mousedown", this._mouseDownHandler, false);
            this.gCanvas.addEventListener("mouseup", this._mouseUpHandler, false);
        }

        this.gCanvas.addEventListener('DOMMouseScroll',this._scrollHandler,false);
        this.gCanvas.addEventListener('mousewheel',this._scrollHandler,false);

        this._selectButton = document.getElementById('selectMode') as HTMLInputElement;
        this._selectButton.addEventListener("click", () => {
            this.setMode(Mode.Selecting, 'selectButton');
        }, false);

        this._addButton = document.getElementById('addMode') as HTMLInputElement;
        this._addButton.addEventListener("click", () => {
            this.setMode(Mode.Adding);
        }, false);

        this._removeButton = document.getElementById('removeMode') as HTMLInputElement;
        this._removeButton.addEventListener("click", () => {
            this.setMode(Mode.Removing);
        }, false);

        this._drawButton = document.getElementById('drawMode') as HTMLInputElement;
        this._drawButton.addEventListener("click", () => {
            this.setMode(Mode.Drawing);
        }, false);

        this.setMode(Mode.Selecting);

        var lockButton: HTMLInputElement = document.getElementById('lockControl') as HTMLInputElement;
        lockButton.addEventListener("click", () => {
            this._options.createSmoothLineSegments = lockButton.checked;
        }, false);

        var anchorButton: HTMLInputElement = document.getElementById('hideAnchorPoints') as HTMLInputElement;
        anchorButton.checked = this._options.hideAnchorPoints;
        anchorButton.addEventListener("click", () => {
            this._options.hideAnchorPoints = anchorButton.checked;
            this.render();
        }, false);

        var controlButton: HTMLInputElement = document.getElementById('hideControlPoints') as HTMLInputElement;
        controlButton.checked = this._options.hideControlPoints;
        controlButton.addEventListener("click", () => {
            this._options.hideControlPoints = controlButton.checked;
            this.render();
        }, false);

        var smoothingSlider: HTMLInputElement = document.getElementById("smoothingSlider")as HTMLInputElement;
        var smoothingValue: HTMLOutputElement = document.getElementById("smoothingValue")as HTMLOutputElement;
        smoothingSlider.oninput = () => {
            this._options.simplifyPathTolerance = Number(smoothingSlider.value);
            smoothingValue.value = smoothingSlider.value
        }
        smoothingSlider.value = `${this._options.simplifyPathTolerance}`;
        smoothingValue.value = `${this._options.simplifyPathTolerance}`;

        var spacingSlider: HTMLInputElement = document.getElementById("spacingSlider")as HTMLInputElement;
        var spacingValue: HTMLOutputElement = document.getElementById("spacingValue")as HTMLOutputElement;
        spacingSlider.oninput = () => {
            this._options.simplifyPathTolerance = Number(spacingSlider.value);
            spacingValue.value = spacingSlider.value;
        }
        spacingSlider.value = `${this._options.minDrawPointSpacing}`;
        spacingValue.value = `${this._options.minDrawPointSpacing}`;

        var clearButton = document.getElementById('clear');
        clearButton.addEventListener('click', () => {
            var doDelete = confirm('Clear all points?');
            if (doDelete) {
                this.gBezierPath = null;
                this.setMode(Mode.Selecting);
                this.render();
                this.renderImageProcessingCanvas();
            }

        }, false);

        var setSrcButton = document.getElementById('addImgSrc');
        setSrcButton.addEventListener('click', () => {
            var input: HTMLInputElement = document.getElementById('imageSrc') as HTMLInputElement;
            this.gBackgroundImg = document.createElement('img');
            this.gBackgroundImg.width = this.WIDTH;
            // No image if invalid path
            this.gBackgroundImg.onerror = () => {
                this.gBackgroundImg = null;
            };
            this.gBackgroundImg.onload = () => {
                this._canvasTxr.image = this.gBackgroundImg; //DEBUG
                this.render();
                this.renderImageProcessingCanvas();
            };
            this.gBackgroundImg.src = input.value;
        }, false);

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

        this._previousClickTime = new Date().getTime();
        this._doubleClick = false;
        this._lastTouchDistance = 0;
    }

    handleKeyDown(event: any): void {
        switch(event.key) {
            case 'r':
                this.gBezierPath.recalcuateControlPoints();
                this.render();
                break;
            case 'c':
                break;

        }
    }

    handleKeyUp(event: any): void {
    }

    setMode(mode: Mode, note: string = ''): void {
        this.mode = mode;
        console.log(`setMode: ${Mode[mode]}: ${note}`);

        this._addButton.checked = false;
        this._selectButton.checked = false;
        this._removeButton.checked = false;
        this._drawButton.checked = false;

        switch (mode) {
            case Mode.Adding:
                this._addButton.checked = true;
                break;
            case Mode.Selecting:
                this._selectButton.checked = true;
                break;
            case Mode.Removing:
                this._removeButton.checked = true;
                break;
            case Mode.Drawing:
                this._drawButton.checked = true;
                break;
        }
    }

    getMousePosition(e: any) {
        var x = 0;
        var y = 0;
        if (e.pageX != undefined && e.pageY != undefined) {
            x = e.pageX;
            y = e.pageY;
        }
        x = x - this.gCanvas.offsetLeft - 3; // 3 is a magic number (corrects for border)
        y = y - this.gCanvas.offsetTop - 3;
        let txPoint = this._canvasTxr.transformedPoint(x, y);
        // console.log(`getMousePosition: (${x}, ${y}) -> (${txPoint.x}, ${txPoint.y})`);
        return new Point(txPoint.x, txPoint.y);
    }

    handleDownAdd(pos: Point) {
        let lineSegmentType = this._options.createSmoothLineSegments ? LineSegmentType.SMOOTH : LineSegmentType.CORNER;
        if (!this.gBezierPath) {
            this.gBezierPath = new BezierPath(pos, lineSegmentType, <LineSegmentOptions>this._options);
        } else {
            // If this was probably a selection, change to
            // select/drag mode
            if (this.handleDownSelect(pos)) {
                //
            } else {
                this.gBezierPath.addPoint(pos, lineSegmentType, <LineSegmentOptions>this._options);
            }
        }
    }

    handleDownDraw(pos: Point) {
        let lineSegmentType = this._options.createSmoothLineSegments ? LineSegmentType.SMOOTH : LineSegmentType.CORNER;
        if (!this.gBezierPath) {
            this.gBezierPath = new BezierPath(pos, lineSegmentType, <LineSegmentOptions>this._options);
        } else {
            if (!this.gBezierPath.tail.pathPointIntersects(pos)) {
                this.gBezierPath.addPoint(pos, lineSegmentType, <LineSegmentOptions>this._options);
            }
        }
        this.gCanvas.addEventListener("mousemove", this._mouseMoveHandler, false);
    }

    // Return true/false if dragging mode
    handleDownSelect(pos: Point): boolean {
        let result: boolean = false;
        if (!this.gBezierPath) {
            this.setMode(Mode.Panning, '!this.gBezierPath');
            this.gCanvas.addEventListener("mousemove", this._mouseMoveHandler, false);
        } else {
            var selected = this.gBezierPath.selectPoint(pos, {hideAnchorPoints: this._options.hideAnchorPoints, hideControlPoints: this._options.hideControlPoints});
            if (selected) {
                if (BezierTool.ALT_KEY_DOWN || this._doubleClick) {
                    if (this.gBezierPath.selectedSegment.type == LineSegmentType.SMOOTH) {
                        this.gBezierPath.selectedSegment.type = LineSegmentType.CORNER;
                    } else {
                        this.gBezierPath.selectedSegment.type = LineSegmentType.SMOOTH;
                    }
                } else if (BezierTool.X_KEY_DOWN) {
                    this.gBezierPath.deletePoint(pos);
                } else {
                    this.setMode(Mode.Dragging);
                    this.gCanvas.addEventListener("mousemove", this._mouseMoveHandler, false);
                }
                result = true;
            } else if (this.mode == Mode.Selecting) {
                this.gBezierPath.deselectPoints();
                this.setMode(Mode.Panning, 'not selected');
                this.gCanvas.addEventListener("mousemove", this._mouseMoveHandler, false);
            }
        }
        return result;
    }

    handleDownRemove(pos: Point) {
        if (!this.gBezierPath) {
            //
        } else {
            var deleted = this.gBezierPath.deletePoint(pos);
            if (!deleted) {
                this.setMode(Mode.Selecting, 'handleDownRemove');
            }
        }
    }

    handleDown(e: any) {
        var pos = this.getMousePosition(e);
        this._canvasTxr.handleMousedown(e);
        let doubleClickTime: number = new Date().getTime() - this._previousClickTime;
        if (doubleClickTime < 200) {
            this._doubleClick = true;
            console.log(`double-click`);
        }
        this._previousClickTime = new Date().getTime();
        // console.log(`handleDown: mode: ${Mode[this.mode]}`)
        switch (this.mode) {
            case Mode.Adding:
                this.handleDownAdd(pos);
                break;
            case Mode.Selecting:
                this.handleDownSelect(pos);
                break;
            case Mode.Removing:
                this.handleDownRemove(pos);
                break;
            case Mode.Drawing:
                this.handleDownDraw(pos);
                break;
        }
        this.render();
        event.preventDefault();
    }

    handleTouchStart(event: any): void {
        this.gCanvas.addEventListener('touchmove', this._touchmoveHandler, {passive: false});
        if (event.targetTouches.length == 1) {
            let touch = event.targetTouches[0];
            this.handleDown(touch);
        } else if (event.targetTouches.length == 2) {
            let t1 = event.targetTouches[0];
            let t2 = event.targetTouches[1];
            let v1 = new Vector2([t1.pageX ,t1.pageY]);
            let v2 = new Vector2([t2.pageX ,t2.pageY]);
            let dist = v1.distanceTo(v2);
            this._lastTouchDistance = dist;
        }
        event.preventDefault();
    }

    handleMouseMove(e: any) {
        var pos = this.getMousePosition(e);

        if (this.mode == Mode.Dragging) {
            this.gBezierPath.updateSelected(pos);
        } else if (this.mode == Mode.Drawing) {
            let lineSegmentType = this._options.createSmoothLineSegments ? LineSegmentType.SMOOTH : LineSegmentType.CORNER;
            if (!this.gBezierPath.tail.pathPointIntersects(pos, this._options.minDrawPointSpacing)) {
                this.gBezierPath.addPoint(pos, lineSegmentType, <LineSegmentOptions>this._options);
            }
        } else if (this.mode == Mode.Panning) {
            this._canvasTxr.handleMousemove(e); //mousemove(pos);
        }
        this.render();
    }

    handleTouchMove(event: any): void {
        if (event.targetTouches.length == 1) {
          var touch = event.targetTouches[0];
          this.handleMouseMove(touch);
        } else if (event.targetTouches.length == 2) {
            let t1 = event.targetTouches[0];
            let t2 = event.targetTouches[1];
            let v1 = new Vector2([t1.pageX ,t1.pageY]);
            let v2 = new Vector2([t2.pageX ,t2.pageY]);
            let dist = v1.distanceTo(v2);
            let dz = dist - this._lastTouchDistance;
            this._lastTouchDistance = dist;
            // console.log(`_lastTouchDistance: ${this._lastTouchDistance}`);
            let evt = {wheelDelta: dz, preventDefault: function(){}};
            this.handleScroll(evt);
        }
        event.preventDefault();
    }

    handleUp(e: any) {
        this.gCanvas.removeEventListener("mousemove", this._mouseMoveHandler, false);
        this.gCanvas.removeEventListener('touchmove', this._touchmoveHandler, false);
        this._canvasTxr.handleMouseup(e);

        if (this.mode == Mode.Dragging) {
            this.gBezierPath.clearSelected();
            this.setMode(Mode.Selecting, 'handleUp, Dragging');
        } else if (this.mode == Mode.Drawing) {
            this.gBezierPath.clearSelected();
            this.gBezierPath.simplifyPath(this._options.simplifyPathTolerance);
            this.setMode(Mode.Selecting, 'handleUp, Drawing');
            this.render();
        } else if (this.mode == Mode.Panning) {
            this.setMode(Mode.Selecting, 'handleUp, Panning');
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
        this.gCtx.clearRect(0, 0, this.WIDTH, this.HEIGHT);
        if (this.gBezierPath) {
            this.gBezierPath.draw(this.gBackCtx, {transform: this._drawingTransform, hideAnchorPoints: this._options.hideAnchorPoints, hideControlPoints: this._options.hideControlPoints});
            var codeBox = document.getElementById('putJS');
            if (codeBox) {
                codeBox.innerHTML = this.gBezierPath.toJSString();
            }
        }
        this.gCtx.drawImage(this.gBackCanvas, 0, 0);
    }

    renderImageProcessingCanvas(): void {
        this.bitmapCtx.clearRect(0, 0, this.bitmapCanvas.width, this.bitmapCanvas.height);
        if (this.gBezierPath) {
            if (this.gBackgroundImg) {
                this.bitmapCtx.drawImage(this.gBackgroundImg, 0, 0, this.bitmapCanvas.width, this.bitmapCanvas.height);
            }
            var imgData: ImageData = this.bitmapCtx.getImageData(0, 0, this.bitmapCanvas.width, this.bitmapCanvas.height);
            let transparent: number = 0;
            let polygon: any = this.gBezierPath.getAnchorVertices();
			let i: number = 0;
			for (let y: number = 0; y < imgData.height; y++) {
				for (let x: number = 0; x < imgData.width; x++) {
                    if (this.isInPolygon(polygon, {x: x, y: y})) {
                        if (!this.gBackgroundImg) {
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
