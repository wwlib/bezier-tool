import ControlPoint from './ControlPoint';
import Point from './Point';

export enum LineSegmentType {
    SMOOTH,
    CORNER
}

export default class LineSegment {

    public pt: Point; // Path point.
    public ctrlPt1: ControlPoint; // Control point 1.
    public ctrlPt2: ControlPoint; // Control point 2.
    public next: LineSegment; // Next LineSegment in path
    public prev: LineSegment; // Previous LineSegment in path
    public selectedPoint: Point | ControlPoint; // Specific point on the LineSegment that is selected.
    public type: LineSegmentType;

    constructor(pt: Point, prev: LineSegment, type: LineSegmentType = LineSegmentType.SMOOTH) {
        this.pt = pt;
        this.prev = prev;
        this.type = type;

        if (this.prev) {

            // Make initial line straight and with controls of length 15.
            var slope = this.pt.computeSlope(this.prev.pt);
            var angle = Math.atan(slope);

            if (this.prev.pt.x > this.pt.x)
                angle *= -1;

            this.ctrlPt1 = new ControlPoint(angle + Math.PI, 15, this, true);
            this.ctrlPt2 = new ControlPoint(angle, 15, this, false);
        }
    }

    drawCurve(ctx, startPt, endPt, ctrlPt1, ctrlPt2) {
        ctx.save();
        ctx.fillStyle = 'grey';
        ctx.strokeStyle = 'darkgrey';
        ctx.beginPath();
        ctx.moveTo(startPt.x, startPt.y);
        ctx.bezierCurveTo(ctrlPt1.x, ctrlPt1.y, ctrlPt2.x, ctrlPt2.y, endPt.x, endPt.y);
        ctx.stroke();
        ctx.restore();
    }

    draw(ctx) {
        let strokeStyle: string = this.type == LineSegmentType.SMOOTH ? 'darkgrey' : 'red';
        this.pt.drawSquare(ctx, strokeStyle);
        // Draw control points if we have them
        if (this.ctrlPt1) {
            let ctrlPt1StrokeStyle: string = this.prev.type == LineSegmentType.SMOOTH ? 'darkgrey' : 'red';
            this.ctrlPt1.draw(ctx, ctrlPt1StrokeStyle);
        }
        if (this.ctrlPt2) {
            this.ctrlPt2.draw(ctx, strokeStyle);
        }
        // If there are at least two points, draw curve.
        if (this.prev)
            this.drawCurve(ctx, this.prev.pt, this.pt, this.ctrlPt1, this.ctrlPt2);
    }

    toJSString() {
        if (!this.prev)
            return '  ctx.moveTo(' + Math.round(this.pt.x) + ' + xoff, ' + Math.round(this.pt.y) + ' + yoff);';
        else {
            var ctrlPt1x = 0;
            var ctrlPt1y = 0;
            var ctrlPt2x = 0;
            var ctlrPt2y = 0;
            var x = 0;
            var y = 0;

            if (this.ctrlPt1) {
                ctrlPt1x = Math.round(this.ctrlPt1.x);
                ctrlPt1y = Math.round(this.ctrlPt1.y);
            }

            if (this.ctrlPt2) {
                ctrlPt2x = Math.round(this.ctrlPt2.x);
                ctlrPt2y = Math.round(this.ctrlPt2.y);
            }
            if (this.pt) {
                x = Math.round(this.pt.x);
                y = Math.round(this.pt.y);
            }

            return '  ctx.bezierCurveTo(' + ctrlPt1x + ' + xoff, ' +
                ctrlPt1y + ' + yoff, ' +
                ctrlPt2x + ' + xoff, ' +
                ctlrPt2y + ' + yoff, ' +
                x + ' + xoff, ' +
                y + ' + yoff);';
        }
    }

    findInLineSegment(pos: Point): boolean {
        if (this.pathPointIntersects(pos)) {
            this.selectedPoint = this.pt;
            return true;
        } else if (this.ctrlPt1 && this.ctrlPt1.contains(pos)) {
            this.selectedPoint = this.ctrlPt1;
            return true;
        } else if (this.ctrlPt2 && this.ctrlPt2.contains(pos)) {
            this.selectedPoint = this.ctrlPt2;
            return true;
        }
        return false;
    }

    pathPointIntersects(pos: Point): boolean {
        return this.pt && this.pt.contains(pos);
    }

    moveTo(pos: Point) {
        var dist = this.selectedPoint.offsetFrom(pos);
        this.selectedPoint.translate(dist.xDelta, dist.yDelta);
    };

}
