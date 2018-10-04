import Point from './Point';
import LineSegment, { LineSegmentType } from './LineSegment';
import BezierTool from './BezierTool';

export default class ControlPoint {

    // Static variable dictacting if neighbors must be kept in sync.
    private _angle: number;
    private _magnitude: number;
    private _owner: LineSegment; // Pointer to the line segment to which this belongs.
    private _isFirst: boolean;

    constructor(angle: number, magnitude: number, owner: LineSegment, isFirst: boolean) {
        this._angle = angle;
        this._magnitude = magnitude;
        this._owner = owner; // Pointer to the line segment to which this belongs.
        this._isFirst = isFirst;

        // When Constructed
        if (this._isFirst && this._owner.type == LineSegmentType.SMOOTH || BezierTool.META_KEY_DOWN) {
            this.updateNeighbor();
        }
    }

    setAngle(deg: number) {
        // don't update neighbor in risk of infinite loop!
        // TODO fixme fragile
        if (this._angle != deg)
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
    asPoint(): Point {
        return new Point(this.x, this.y);
    };

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
        var newLoc = this.asPoint();
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
        return this.asPoint().contains(pt);
    }

    offsetFrom(pt) {
        return this.asPoint().offsetFrom(pt);
    }

    drawSquare(ctx, point, strokeStyle: string = 'darkgrey') {
        // ctx.save();
        ctx.fillStyle = 'white';
        ctx.strokeStyle = strokeStyle;
        // ctx.fillRect(point.x - point.RADIUS, point.y - point.RADIUS, point.RADIUS * 2, point.RADIUS * 2);
        // ctx.strokeRect(point.x - point.RADIUS, point.y - point.RADIUS, point.RADIUS * 2, point.RADIUS * 2);
        ctx.beginPath();
        ctx.arc(this.x, this.y, point.RADIUS, 0, 2*Math.PI);
        ctx.stroke();
        ctx.fill();
        // ctx.restore();
    };

    draw(ctx, pointStrokeStyle: string = 'darkgrey') {
        ctx.save();
        ctx.fillStyle = 'blue';
        ctx.strokeStyle = 'magenta';
        ctx.beginPath();
        var startPt = this.origin();
        var endPt = this.asPoint();
        ctx.moveTo(startPt.x, startPt.y);
        ctx.lineTo(endPt.x, endPt.y);
        ctx.stroke();
        this.drawSquare(ctx, endPt, pointStrokeStyle);
        // endPt.drawSquare(ctx);
        ctx.restore();
    }
}
