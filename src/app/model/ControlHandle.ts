import Point, { PointShape } from './Point';
import ControlPoint from './ControlPoint';
import LineSegment, { LineSegmentType } from './LineSegment';
import BezierTool from './BezierTool';

export type ControlHandleOptions = {
    controlPointShape: PointShape;
    controlPointColor: string;
    controlPointRadius: number;
    lineColor: string;
    lineWeight: number;
}

export default class ControlHandle {

    // Static variable dictacting if neighbors must be kept in sync.
    private _angle: number;
    private _magnitude: number;
    private _owner: LineSegment; // Pointer to the line segment to which this belongs.
    private _isFirst: boolean;
    private _options: ControlHandleOptions;

    constructor(angle: number, magnitude: number, owner: LineSegment, isFirst: boolean, options: ControlHandleOptions) {
        this._angle = angle;
        this._magnitude = magnitude;
        this._owner = owner; // Pointer to the line segment to which this belongs.
        this._isFirst = isFirst;
        this._options = options;

        // When Constructed
        if (this._isFirst && this._owner.type == LineSegmentType.SMOOTH || BezierTool.META_KEY_DOWN) {
            this.updateNeighbor();
        }
    }

    setAngle(deg: number) {
        this._angle = deg;
    }

    origin(): Point {
        var line: LineSegment = null;
        if (this._isFirst)
            line = this._owner.prev;
        else
            line = this._owner;
        if (line)
            return new Point(line.pt.x, line.pt.y);
        return null;
    }

    // Returns the Point at which the knob is located.
    asControlPoint(): ControlPoint {
        return new ControlPoint(this.x, this.y, this._options.controlPointRadius);
    };

    asArray(): number[] {
        return [this.x, this.y];
    }

    get x() {
        return this.origin().x + this.xDelta;
    }

    get y() {
        return this.origin().y + this.yDelta;
    }

    get xDelta() {
        return this._magnitude * Math.cos(this._angle);
    }

    get yDelta() {
        return this._magnitude * Math.sin(this._angle);
    }

    set owner(owner: LineSegment) {
        this._owner = owner;
    }

    computeMagnitudeAngleFromOffset(xDelta, yDelta) {
        this._magnitude = Math.sqrt(Math.pow(xDelta, 2) + Math.pow(yDelta, 2));
        var tryAngle = Math.atan(yDelta / xDelta);
        if (!isNaN(tryAngle)) {
            this._angle = tryAngle;
            if (xDelta < 0)
                this._angle += Math.PI
        }
    }

    translate(xDelta, yDelta) {
        var newLoc = this.asControlPoint();
        newLoc.translate(xDelta, yDelta);
        var dist = this.origin().offsetFrom(newLoc);
        this.computeMagnitudeAngleFromOffset(dist.xDelta, dist.yDelta);
        if ( (!this._isFirst && this._owner.type == LineSegmentType.SMOOTH) || (this._isFirst && this._owner.prev.type == LineSegmentType.SMOOTH) || BezierTool.META_KEY_DOWN ) {
            this.updateNeighbor();
        }
    };

    updateNeighbor() {
        var neighbor = null;
        if (this._isFirst && this._owner.prev)
            neighbor = this._owner.prev.ctrlPt2;
        else if (!this._isFirst && this._owner.next)
            neighbor = this._owner.next.ctrlPt1;
        if (neighbor)
            neighbor.setAngle(this._angle + Math.PI);
    }

    contains(pt) {
        return this.asControlPoint().contains(pt);
    }

    offsetFrom(pt) {
        return this.asControlPoint().offsetFrom(pt);
    }

    draw(ctx: CanvasRenderingContext2D, shape: PointShape, strokeStyle: string = 'magenta') {
        ctx.save();
        ctx.fillStyle = 'white';
        ctx.strokeStyle = strokeStyle;
        ctx.beginPath();
        var startPt = this.origin();
        var endPt = this.asControlPoint();
        ctx.moveTo(startPt.x, startPt.y);
        ctx.lineTo(endPt.x, endPt.y);
        ctx.stroke();
        endPt.draw(ctx, shape, strokeStyle);
        ctx.restore();
    }

    dispose(): void {
        this._owner = undefined;
    }
}
