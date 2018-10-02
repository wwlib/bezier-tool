import ControlPoint from './ControlPoint';
import BezierPath from './BezierPath';
import Point from './Point';

export default class BezierTool {

    public gCanvas;
    public gCtx;
    public gBackCanvas;
    public gBackCtx;
    public gBezierPath;
    public gState;
    public gBackgroundImg: HTMLImageElement;
    public WIDTH;
    public HEIGHT;

    public Mode = {
        kAdding: { value: 0, name: "Adding" },
        kSelecting: { value: 1, name: "Selecting" },
        kDragging: { value: 2, name: "Dragging" },
        kRemoving: { value: 3, name: "Removing" },
    };

    private _mouseDownHandler: any = this.handleDown.bind(this);
    private _mouseUpHandler: any = this.handleUp.bind(this);
    private _mouseMoveHandler: any = this.updateSelected.bind(this);

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

        this.gCanvas.addEventListener("mousedown", this._mouseDownHandler, false);
        this.gCanvas.addEventListener("mouseup", this._mouseUpHandler, false);


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

        var lockButton: HTMLInputElement = document.getElementById('lockControl') as HTMLInputElement;
        lockButton.addEventListener("click", () => {
            ControlPoint.syncNeighbor = lockButton.checked;
        }, false);

        var clearButton = document.getElementById('clear');
        clearButton.addEventListener('click', () => {
            var doDelete = confirm('r u sure u want to delete all');
            if (doDelete) {
                this.gBezierPath = null;
                this.gBackCtx.clearRect(0, 0, this.WIDTH, this.HEIGHT);
                this.gCtx.clearRect(0, 0, this.WIDTH, this.HEIGHT);
            }

        }, false);

        var setSrcButton = document.getElementById('addImgSrc');
        setSrcButton.addEventListener('click', () => {
            var input: HTMLInputElement = document.getElementById('imageSrc') as HTMLInputElement;
            console.log(`loading image: ${input.value}`);
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
    }

    handleDownAdd(pos) {
        if (!this.gBezierPath)
            this.gBezierPath = new BezierPath(pos);
        else {
            // If this was probably a selection, change to
            // select/drag mode
            if (this.handleDownSelect(pos))
                return;
            this.gBezierPath.addPoint(pos);
        }
        this.render();
    }

    // Return true/false if dragging mode
    handleDownSelect(pos) {
        if (!this.gBezierPath)
            return false;
        var selected = this.gBezierPath.selectPoint(pos);
        if (selected) {
            this.gState = this.Mode.kDragging;
            this.gCanvas.addEventListener("mousemove", this._mouseMoveHandler, false);
            return true;
        }
        return false;
    }

    handleDownRemove(pos) {
        if (!this.gBezierPath)
            return;
        var deleted = this.gBezierPath.deletePoint(pos);
        if (deleted)
            this.render();
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
            // console.log(`rendering image: `, this.gBackgroundImg);
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
