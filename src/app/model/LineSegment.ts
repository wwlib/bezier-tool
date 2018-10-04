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
    public time: number;
    public controlPointsActive: boolean;

    private _controlPointMagnitude: number = 20;


    constructor(pt: Point, prev: LineSegment, type: LineSegmentType = LineSegmentType.SMOOTH, time?: number) {
        this.pt = pt;
        this.prev = prev;
        this.type = type;
        this.time = time || new Date().getTime();
        this.controlPointsActive = false;

        if (this.prev) {

            // Make initial line straight and with controls of length 15.
            var slope = this.pt.computeSlope(this.prev.pt);
            var angle = Math.atan(slope);
            var ctrlPt1Angle = angle;
            var ctrlPt2Angle = angle + Math.PI;

            if (this.prev.pt.x > this.pt.x) {
                ctrlPt1Angle = angle + Math.PI;
                ctrlPt2Angle = angle;
            }

            this.ctrlPt1 = new ControlPoint(ctrlPt1Angle, this._controlPointMagnitude, this, true);
            this.ctrlPt2 = new ControlPoint(ctrlPt2Angle, this._controlPointMagnitude, this, false);
        }
    }

    drawCurve(ctx, startPt, endPt, ctrlPt1, ctrlPt2) {
        // ctx.save();
        ctx.fillStyle = 'grey';
        ctx.strokeStyle = 'magenta'; //'darkgrey';
        ctx.beginPath();
        ctx.moveTo(startPt.x, startPt.y);
        ctx.bezierCurveTo(ctrlPt1.x, ctrlPt1.y, ctrlPt2.x, ctrlPt2.y, endPt.x, endPt.y);
        ctx.stroke();
        // ctx.restore();
    }

    draw(ctx: CanvasRenderingContext2D, options?: any) {
        options = options || {};
        let hideAnchorPoints: boolean = options.hideAnchorPoints;
        let strokeStyle: string = this.type == LineSegmentType.SMOOTH ? 'magenta' : 'red';
        if (!hideAnchorPoints) {
            this.pt.drawSquare(ctx, strokeStyle);
        }
        // Draw control points if we have them
        if (this.prev && this.prev.controlPointsActive && this.ctrlPt1) {
            let ctrlPt1StrokeStyle: string = this.prev.type == LineSegmentType.SMOOTH ? 'magenta' : 'red';
            this.ctrlPt1.draw(ctx, ctrlPt1StrokeStyle);
        }
        if (this.controlPointsActive && this.ctrlPt2) {
            this.ctrlPt2.draw(ctx, strokeStyle);
        }
        // If there are at least two points, draw curve.
        if (this.prev) {
            this.drawCurve(ctx, this.prev.pt, this.pt, this.ctrlPt1, this.ctrlPt2);
        }

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
        } else if (this.controlPointsActive && this.next && this.next.ctrlPt1 && this.next.ctrlPt1.contains(pos)) {
            this.selectedPoint = this.next.ctrlPt1;
            return true;
        } else if (this.controlPointsActive && this.ctrlPt2 && this.ctrlPt2.contains(pos)) {
            this.selectedPoint = this.ctrlPt2;
            return true;
        }
        return false;
    }

    pathPointIntersects(pos: Point, radius?: number): boolean {
        return this.pt && this.pt.contains(pos, radius);
    }

    moveTo(pos: Point) {
        var dist = this.selectedPoint.offsetFrom(pos);
        this.selectedPoint.translate(dist.xDelta, dist.yDelta);
    };


    interpolateVertices(divisions: number = 3) {
        let vertices: any[] = [];
        for (let i: number = 1; i <= divisions; i++) {
            let t: number = i / divisions;
            let vertex: any = this.CalculateCubicBezierPoint(t,
                // controlPoints [nodeIndex].position,
                // controlPoints [nodeIndex + 1].position,
                // controlPoints [nodeIndex + 2].position,
                // controlPoints [nodeIndex + 3].position
                this.pt,
                this.ctrlPt1,
                this.ctrlPt2,
                this.next.pt
            );
            vertices.push(vertex);
        }
    }

    CalculateCubicBezierPoint(t: number, p0: any, p1: any, p2: any, p3: any): any {
        let u = 1 - t;
        let tt = t * t;
        let uu = u * u;
        let uuu = uu * u;
        let ttt = tt * t;

        let p: any = uuu * p0;
        p += 3 * uu * t * p1;
        p += 3 * u * tt * p2;
        p += ttt * p3;

        return p;
    }

}
