import ControlPoint from './ControlPoint';
import BezierPath from './BezierPath';
import Point from './Point';
import { LineSegmentType } from './LineSegment';

export enum Mode {
    Adding,
    Selecting,
    Dragging,
    Removing,
    Drawing
}

export default class BezierTool {

    static ALT_KEY_DOWN: boolean;
    static META_KEY_DOWN: boolean;

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
    public createSmoothLineSegments: boolean;
    public simplifyPathTolerance: number;
    public minDrawPointSpacing: number;

    // public Mode = {
    //     kAdding: { value: 0, name: "Adding" },
    //     kSelecting: { value: 1, name: "Selecting" },
    //     kDragging: { value: 2, name: "Dragging" },
    //     kRemoving: { value: 3, name: "Removing" },
    //     kDrawing: { value: 4, name: "Drawing" },
    // };

    private _mouseDownHandler: any = this.handleDown.bind(this);
    private _mouseUpHandler: any = this.handleUp.bind(this);
    private _mouseMoveHandler: any = this.handleMouseMove.bind(this);
    private _touchstartHandler: any = this.handleTouchStart.bind(this);
    private _touchmoveHandler: any = this.handleTouchMove.bind(this);
    private _touchendHandler: any = this.handleTouchEnd.bind(this);
    private _iOSDevice = !!navigator.platform.match(/iPhone|iPod|iPad/);

    private _previousClickTime: number;
    private _doubleClick: boolean;

    private _addButton: HTMLInputElement;
    private _selectButton: HTMLInputElement;
    private _removeButton: HTMLInputElement;
    private _drawButton: HTMLInputElement;

    constructor() {
        this.gCanvas = document.getElementById('bezierCanvas') as HTMLCanvasElement;
        this.gCtx = this.gCanvas.getContext('2d');
        this.HEIGHT = this.gCanvas.height;
        this.WIDTH = this.gCanvas.width;

        this.gBackCanvas = document.createElement('canvas');
        this.gBackCanvas.height = this.HEIGHT;
        this.gBackCanvas.width = this.WIDTH;
        this.gBackCtx = this.gBackCanvas.getContext('2d');

        if (this._iOSDevice) {
            this.gCanvas.addEventListener('touchstart', this._touchstartHandler, {passive: false});
            this.gCanvas.addEventListener('touchend', this._touchendHandler, {passive: false});
        } else {
            this.gCanvas.addEventListener("mousedown", this._mouseDownHandler, false);
            this.gCanvas.addEventListener("mouseup", this._mouseUpHandler, false);
        }

        this._selectButton = document.getElementById('selectMode') as HTMLInputElement;
        this._selectButton.addEventListener("click", () => {
            this.setMode(Mode.Selecting);
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

        this.setMode(Mode.Adding);

        this.createSmoothLineSegments = true;
        var lockButton: HTMLInputElement = document.getElementById('lockControl') as HTMLInputElement;
        lockButton.addEventListener("click", () => {
            this.createSmoothLineSegments = lockButton.checked;
        }, false);


        var smoothingSlider: HTMLInputElement = document.getElementById("smoothingSlider")as HTMLInputElement;
        var smoothingValue: HTMLOutputElement = document.getElementById("smoothingValue")as HTMLOutputElement;
        smoothingSlider.oninput = () => {
            this.simplifyPathTolerance = Number(smoothingSlider.value);
            smoothingValue.value = smoothingSlider.value
        }
        this.simplifyPathTolerance = 60;
        smoothingSlider.value = `${this.simplifyPathTolerance}`;
        smoothingValue.value = `${this.simplifyPathTolerance}`;

        var spacingSlider: HTMLInputElement = document.getElementById("spacingSlider")as HTMLInputElement;
        var spacingValue: HTMLOutputElement = document.getElementById("spacingValue")as HTMLOutputElement;
        spacingSlider.oninput = () => {
            this.minDrawPointSpacing = Number(spacingSlider.value);
            spacingValue.value = spacingSlider.value;
        }
        this.minDrawPointSpacing = 40;
        spacingSlider.value = `${this.minDrawPointSpacing}`;
        spacingValue.value = `${this.minDrawPointSpacing}`;

        var clearButton = document.getElementById('clear');
        clearButton.addEventListener('click', () => {
            var doDelete = confirm('Clear all points?');
            if (doDelete) {
                this.gBezierPath = null;
                this.gBackCtx.clearRect(0, 0, this.WIDTH, this.HEIGHT);
                this.gCtx.clearRect(0, 0, this.WIDTH, this.HEIGHT);
                // this.gState = this.Mode.kAdding;
                this.setMode(Mode.Adding);
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
                this.render();
                this.renderImageProcessingCanvas();
            };
            this.gBackgroundImg.src = input.value;
            // input.value = '';
        }, false);

        BezierTool.ALT_KEY_DOWN = false;
        BezierTool.META_KEY_DOWN = false;
        document.onkeydown = (event: KeyboardEvent) => {
            BezierTool.ALT_KEY_DOWN = event.altKey;
            BezierTool.META_KEY_DOWN = event.metaKey;
        }

        document.onkeyup = (event: KeyboardEvent) => {
            BezierTool.ALT_KEY_DOWN = event.altKey;
            BezierTool.META_KEY_DOWN = event.metaKey;
        }

        this._previousClickTime = new Date().getTime();
        this._doubleClick = false;
    }

    setMode(mode: Mode): void {
        this.mode = mode;

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

    // Modified from http://diveintohtml5.org/examples/halma.js
    getMousePosition(e: any) {
        var x;
        var y;
        if (e.pageX != undefined && e.pageY != undefined) {
            x = e.pageX;
            y = e.pageY;
        }
        else {
            x = e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
            y = e.clientY + document.body.scrollTop + document.documentElement.scrollTop;
        }
        x -= this.gCanvas.offsetLeft;
        y -= this.gCanvas.offsetTop;

        return new Point(x, y);
    }

    handleDownAdd(pos: Point) {
        let lineSegmentType = this.createSmoothLineSegments ? LineSegmentType.SMOOTH : LineSegmentType.CORNER;
        if (!this.gBezierPath) {
            this.gBezierPath = new BezierPath(pos, lineSegmentType);
        } else {
            // If this was probably a selection, change to
            // select/drag mode
            if (this.handleDownSelect(pos)) {
                //
            } else {
                this.gBezierPath.addPoint(pos, lineSegmentType);
            }
        }
    }

    handleDownDraw(pos: Point) {
        let lineSegmentType = this.createSmoothLineSegments ? LineSegmentType.SMOOTH : LineSegmentType.CORNER;
        if (!this.gBezierPath) {
            this.gBezierPath = new BezierPath(pos, lineSegmentType);
        } else {
            if (!this.gBezierPath.tail.pathPointIntersects(pos)) {
                this.gBezierPath.addPoint(pos, lineSegmentType);
            }
        }
        // this.gState = this.Mode.kDrawing;
        this.setMode(Mode.Drawing);
        this.gCanvas.addEventListener("mousemove", this._mouseMoveHandler, false);
    }

    // Return true/false if dragging mode
    handleDownSelect(pos: Point) {
        let result: boolean = false;
        if (!this.gBezierPath) {
            result = false;
        } else {
            var selected = this.gBezierPath.selectPoint(pos);
            if (selected) {
                if (BezierTool.ALT_KEY_DOWN || this._doubleClick) {
                    if (this.gBezierPath.selectedSegment.type == LineSegmentType.SMOOTH) {
                        this.gBezierPath.selectedSegment.type = LineSegmentType.CORNER;
                    } else {
                        this.gBezierPath.selectedSegment.type = LineSegmentType.SMOOTH;
                    }
                } else {
                    // this.gState = this.Mode.kDragging;
                    this.setMode(Mode.Dragging);
                    this.gCanvas.addEventListener("mousemove", this._mouseMoveHandler, false);
                }
                result = true;
            } else {
                this.gBezierPath.deselectPoints();
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
                this.setMode(Mode.Selecting);
            }
        }
    }

    handleDown(e: any) {
        var pos = this.getMousePosition(e);
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
          var touch = event.targetTouches[0];
          // Place element where the finger is
          // touch.pageX
          // touch.pageY
          this.handleDown(touch);
        }
        event.preventDefault();
    }

    handleMouseMove(e: any) {
        var pos = this.getMousePosition(e);
        if (this.mode == Mode.Dragging) {
            this.gBezierPath.updateSelected(pos);
        } else if (this.mode == Mode.Drawing) {
            let lineSegmentType = this.createSmoothLineSegments ? LineSegmentType.SMOOTH : LineSegmentType.CORNER;
            if (!this.gBezierPath.tail.pathPointIntersects(pos, this.minDrawPointSpacing)) {
                this.gBezierPath.addPoint(pos, lineSegmentType);
            }
        }
        this.render();
    }

    handleTouchMove(event: any): void {
        if (event.targetTouches.length == 1) {
          var touch = event.targetTouches[0];
          // Place element where the finger is
          // touch.pageX
          // touch.pageY
          this.handleMouseMove(touch);
        }
        event.preventDefault();
    }

    handleUp(e: any) {
        this.gCanvas.removeEventListener("mousemove", this._mouseMoveHandler, false);
        this.gCanvas.removeEventListener('touchmove', this._touchmoveHandler, false);

        if (this.mode == Mode.Dragging) {
            this.gBezierPath.clearSelected();
            this.setMode(Mode.Selecting);
        } else if (this.mode == Mode.Drawing) {
            this.gBezierPath.clearSelected();
            this.gBezierPath.simplifyPath(this.simplifyPathTolerance);
            this.setMode(Mode.Selecting);
            this.render();
        }
        this._doubleClick = false;
    }

    handleTouchEnd(event: any): void {
        this.handleUp(event);
        event.preventDefault();
    }

    render() {
        this.gBackCtx.clearRect(0, 0, this.WIDTH, this.HEIGHT);
        this.gCtx.clearRect(0, 0, this.WIDTH, this.HEIGHT);
        if (this.gBackgroundImg) {
            this.gBackCtx.drawImage(this.gBackgroundImg, 0, 0, this.WIDTH, this.HEIGHT);
        }

        if (this.gBezierPath) {
            this.gBezierPath.draw(this.gBackCtx);
            var codeBox = document.getElementById('putJS');
            if (codeBox) {
                codeBox.innerHTML = this.gBezierPath.toJSString();
            }
        }
        this.gCtx.drawImage(this.gBackCanvas, 0, 0);
    }

    renderImageProcessingCanvas(): void {
        this.bitmapCanvas = document.getElementById("bitmapCanvas") as HTMLCanvasElement;
        this.bitmapCtx = this.bitmapCanvas.getContext("2d");
        this.bitmapCtx.clearRect(0, 0, this.bitmapCanvas.width, this.bitmapCanvas.height);
        if (this.gBackgroundImg) {
            this.bitmapCtx.drawImage(this.gBackgroundImg, 0, 0, this.bitmapCanvas.width, this.bitmapCanvas.height);
            var imgData = this.bitmapCtx.getImageData(0, 0, this.bitmapCanvas.width, this.bitmapCanvas.height);
            // invert colors
            // var i;
            // for (i = 0; i < imgData.data.length; i += 4) {
            //     imgData.data[i] = 255 - imgData.data[i];
            //     imgData.data[i+1] = 255 - imgData.data[i+1];
            //     imgData.data[i+2] = 255 - imgData.data[i+2];
            //     imgData.data[i+3] = 255;
            // }
            // this.bitmapCtx.putImageData(imgData, 0, 0);
        }

    }
}
