import ControlPoint from './ControlPoint';
import BezierPath from './BezierPath';
import Point from './Point';
import { LineSegmentType } from './LineSegment';

export default class BezierTool {

    static ALT_KEY_DOWN: boolean;
    static META_KEY_DOWN: boolean;

    public gCanvas;
    public gCtx;
    public gBackCanvas;
    public gBackCtx;
    public gBezierPath: BezierPath;
    public gState;
    public gBackgroundImg: HTMLImageElement;
    public WIDTH;
    public HEIGHT;
    public createSmoothLineSegments: boolean;

    public Mode = {
        kAdding: { value: 0, name: "Adding" },
        kSelecting: { value: 1, name: "Selecting" },
        kDragging: { value: 2, name: "Dragging" },
        kRemoving: { value: 3, name: "Removing" },
    };

    private _mouseDownHandler: any = this.handleDown.bind(this);
    private _mouseUpHandler: any = this.handleUp.bind(this);
    private _mouseMoveHandler: any = this.updateSelected.bind(this);
    private _touchstartHandler: any = this.handleTouchStart.bind(this);
    private _touchmoveHandler: any = this.handleTouchMove.bind(this);
    private _touchendHandler: any = this.handleTouchEnd.bind(this);
    private _iOSDevice = !!navigator.platform.match(/iPhone|iPod|iPad/);

    constructor() {
        this.gCanvas = document.getElementById('paintme');
        this.gCtx = this.gCanvas.getContext('2d');
        this.HEIGHT = this.gCanvas.height;
        this.WIDTH = this.gCanvas.width;

        this.gBackCanvas = document.createElement('canvas');
        this.gBackCanvas.height = this.HEIGHT;
        this.gBackCanvas.width = this.WIDTH;
        this.gBackCtx = this.gBackCanvas.getContext('2d');

        this.gState = this.Mode.kAdding;

        if (this._iOSDevice) {
            this.gCanvas.addEventListener('touchstart', this._touchstartHandler, {passive: false});
            this.gCanvas.addEventListener('touchend', this._touchendHandler, {passive: false});
        } else {
            this.gCanvas.addEventListener("mousedown", this._mouseDownHandler, false);
            this.gCanvas.addEventListener("mouseup", this._mouseUpHandler, false);
        }

        var selectButton = document.getElementById('selectMode');
        selectButton.addEventListener("click", () => {
            this.gState = this.Mode.kSelecting;
        }, false);

        var addButton = document.getElementById('addMode');
        addButton.addEventListener("click", () => {
            this.gState = this.Mode.kAdding;
        }, false);

        var removeButton = document.getElementById('removeMode');
        removeButton.addEventListener("click", () => {
            this.gState = this.Mode.kRemoving;
        }, false);

        this.createSmoothLineSegments = true;
        var lockButton: HTMLInputElement = document.getElementById('lockControl') as HTMLInputElement;
        lockButton.addEventListener("click", () => {
            this.createSmoothLineSegments = lockButton.checked;
        }, false);

        var clearButton = document.getElementById('clear');
        clearButton.addEventListener('click', () => {
            var doDelete = confirm('Clear all points?');
            if (doDelete) {
                this.gBezierPath = null;
                this.gBackCtx.clearRect(0, 0, this.WIDTH, this.HEIGHT);
                this.gCtx.clearRect(0, 0, this.WIDTH, this.HEIGHT);
                this.gState = this.Mode.kAdding;
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

    }

    // Modified from http://diveintohtml5.org/examples/halma.js
    getMousePosition(e) {
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

    handleDown(e) {
        var pos = this.getMousePosition(e);
        // console.log(`handleDown: state: ${this.gState.name}`)
        switch (this.gState) {
            case this.Mode.kAdding:
                this.handleDownAdd(pos);
                break;
            case this.Mode.kSelecting:
                this.handleDownSelect(pos);
                break;
            case this.Mode.kRemoving:
                this.handleDownRemove(pos);
                break;
        }
        event.preventDefault();
    }

    handleDownAdd(pos) {
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
        this.render();
    }

    // Return true/false if dragging mode
    handleDownSelect(pos) {
        let result: boolean = false;
        if (!this.gBezierPath) {
            result = false;
        } else {
            var selected = this.gBezierPath.selectPoint(pos);
            if (selected) {
                if (BezierTool.ALT_KEY_DOWN) {
                    if (this.gBezierPath.selectedSegment.type == LineSegmentType.SMOOTH) {
                        this.gBezierPath.selectedSegment.type = LineSegmentType.CORNER;
                    } else {
                        this.gBezierPath.selectedSegment.type = LineSegmentType.SMOOTH;
                    }
                    this.render();
                } else {
                    this.gState = this.Mode.kDragging;
                    this.gCanvas.addEventListener("mousemove", this._mouseMoveHandler, false);
                }
                result = true;
            }
        }
        return result;
    }

    handleDownRemove(pos) {
        if (!this.gBezierPath) {
            //
        } else {
            var deleted = this.gBezierPath.deletePoint(pos);
            if (deleted)
                this.render();
        }
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

    handleTouchMove(event: any): void {
        if (event.targetTouches.length == 1) {
          var touch = event.targetTouches[0];
          // Place element where the finger is
          // touch.pageX
          // touch.pageY
          this.updateSelected(touch);
        }
        event.preventDefault();
    }

    handleTouchEnd(event: any): void {
        if (this.gState == this.Mode.kDragging) {
            this.gCanvas.removeEventListener('touchmove', this._touchmoveHandler, false);
            this.gBezierPath.clearSelected();
            this.gState = this.Mode.kSelecting;
        }
        event.preventDefault();
    }

    updateSelected(e) {
        var pos = this.getMousePosition(e);
        this.gBezierPath.updateSelected(pos);
        this.render();
    }

    handleUp(e) {
        if (this.gState == this.Mode.kDragging) {
            this.gCanvas.removeEventListener("mousemove", this._mouseMoveHandler, false);
            this.gBezierPath.clearSelected();
            this.gState = this.Mode.kSelecting;
        }
    }

    render() {
        this.gBackCtx.clearRect(0, 0, this.WIDTH, this.HEIGHT);
        this.gCtx.clearRect(0, 0, this.WIDTH, this.HEIGHT);
        if (this.gBackgroundImg) {
            this.gBackCtx.drawImage(this.gBackgroundImg, 0, 0, this.HEIGHT, this.HEIGHT);
        }

        if (this.gBezierPath) {
            this.gBezierPath.draw(this.gBackCtx);
            var codeBox = document.getElementById('putJS');
            codeBox.innerHTML = this.gBezierPath.toJSString();
        }
        this.gCtx.drawImage(this.gBackCanvas, 0, 0);
    }
}
