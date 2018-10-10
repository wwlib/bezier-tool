import Point, { PointShape } from './Point';
import ControlHandle, { ControlHandleOptions } from './ControlHandle';
import AnchorPoint from './AnchorPoint';
import { Vector2, Matrix4 } from 'math.gl';

export enum LineSegmentType {
    SMOOTH,
    CORNER
}

export type LineSegmentOptions = {
    anchorPointShape: PointShape;
    controlPointShape: PointShape;
    anchorPointColor: string;
    controlPointColor: string;
    anchorPointRadius: number;
    controlPointRadius: number;
    lineColor: string;
    lineWeight: number;
}

export default class LineSegment {

    public pt: AnchorPoint; // Path point.
    public next: LineSegment; // Next LineSegment in path
    public prev: LineSegment; // Previous LineSegment in path
    public selectedPoint: AnchorPoint | ControlHandle; // Specific point on the LineSegment that is selected.
    public type: LineSegmentType;
    public time: number;
    public controlPointsActive: boolean;

    private _ctrlHandle1: ControlHandle; // Control point 1.
    private _ctrlHandle2: ControlHandle; // Control point 2.
    private _controlPointMagnitude: number = 20;
    private _options: LineSegmentOptions;


    constructor(pt: AnchorPoint, prev: LineSegment, type: LineSegmentType = LineSegmentType.SMOOTH, options: LineSegmentOptions, time?: number) {
        this.pt = pt;
        this.prev = prev;
        this.type = type;
        this._options = options;
        this.time = time || new Date().getTime();
        this.controlPointsActive = false;

        this.updateControlPointAngles();
    }

    updateControlPointAngles(): void {
        if (this.prev) {

            // Make initial line straight and with controls of length 15.
            var slope = this.pt.computeSlope(this.prev.pt);
            var angle = Math.atan(slope);
            var _ctrlHandle1Angle = angle;
            var _ctrlHandle2Angle = angle + Math.PI;

            if (this.prev.pt.x >= this.pt.x) {
                _ctrlHandle1Angle = angle + Math.PI;
                _ctrlHandle2Angle = angle;
            }

            if (this._ctrlHandle1) this._ctrlHandle1.dispose();
            if (this._ctrlHandle2) this._ctrlHandle2.dispose();

            this._ctrlHandle1 = new ControlHandle(_ctrlHandle1Angle, this._controlPointMagnitude, this, true, <ControlHandleOptions>this._options);
            this._ctrlHandle2 = new ControlHandle(_ctrlHandle2Angle, this._controlPointMagnitude, this, false, <ControlHandleOptions>this._options);
        }
    }

    get ctrlPt1(): ControlHandle {
        return this._ctrlHandle1;
    }

    set ctrlPt1(ctrlPoint: ControlHandle) {
        this._ctrlHandle1.dispose();
        this._ctrlHandle1 = ctrlPoint;
        this._ctrlHandle1.owner = this;
    }

    get ctrlPt2(): ControlHandle {
        return this._ctrlHandle2;
    }

    set ctrlPt2(ctrlPoint: ControlHandle) {
        this._ctrlHandle2.dispose();
        this._ctrlHandle2 = ctrlPoint;
        this._ctrlHandle2.owner = this;
    }

    drawCurve(ctx: CanvasRenderingContext2D, startPt: AnchorPoint, endPt: AnchorPoint, _ctrlHandle1: ControlHandle, _ctrlHandle2: ControlHandle, tx: Matrix4) {
        ctx.fillStyle = 'white';
        ctx.strokeStyle = this._options.lineColor; //'magenta'; //'darkgrey';
        ctx.beginPath();
        ctx.moveTo(startPt.tx(tx).x, startPt.tx(tx).y);
        ctx.bezierCurveTo(_ctrlHandle1.pt.tx(tx).x, _ctrlHandle1.pt.tx(tx).y, _ctrlHandle2.pt.tx(tx).x, _ctrlHandle2.pt.tx(tx).y, endPt.tx(tx).x, endPt.tx(tx).y);
        ctx.stroke();
    }

    draw(ctx: CanvasRenderingContext2D, options?: any) {
        options = options || {};
        let transform: Matrix4 = options.transform;
        let hideAnchorPoints: boolean = options.hideAnchorPoints;
        let hideControlPoints: boolean = options.hideControlPoints;

        // If there are at least two points, draw curve.
        if (this.prev) {
            this.drawCurve(ctx, this.prev.pt, this.pt, this._ctrlHandle1, this._ctrlHandle2, transform);
        }

        if (!hideAnchorPoints) {
            this.pt.draw(ctx, this._options.anchorPointShape, this._options.anchorPointColor, transform);
        }

        // Draw control points if we have them
        if (!hideControlPoints) {
            if (this.prev && this.prev.controlPointsActive && this._ctrlHandle1) {
                this._ctrlHandle1.draw(ctx, this._options.controlPointShape, this._options.controlPointColor, transform);
            }
            if (this.controlPointsActive && this._ctrlHandle2) {
                this._ctrlHandle2.draw(ctx, this._options.controlPointShape, this._options.controlPointColor, transform);
            }
        }
    }

    toJSString() {
        if (!this.prev)
            return '  ctx.moveTo(' + Math.round(this.pt.x) + ' + xoff, ' + Math.round(this.pt.y) + ' + yoff);';
        else {
            var _ctrlHandle1x = 0;
            var _ctrlHandle1y = 0;
            var _ctrlHandle2x = 0;
            var ctlrPt2y = 0;
            var x = 0;
            var y = 0;

            if (this._ctrlHandle1) {
                _ctrlHandle1x = Math.round(this._ctrlHandle1.x);
                _ctrlHandle1y = Math.round(this._ctrlHandle1.y);
            }

            if (this._ctrlHandle2) {
                _ctrlHandle2x = Math.round(this._ctrlHandle2.x);
                ctlrPt2y = Math.round(this._ctrlHandle2.y);
            }
            if (this.pt) {
                x = Math.round(this.pt.x);
                y = Math.round(this.pt.y);
            }

            return '  ctx.bezierCurveTo(' + _ctrlHandle1x + ' + xoff, ' +
                _ctrlHandle1y + ' + yoff, ' +
                _ctrlHandle2x + ' + xoff, ' +
                ctlrPt2y + ' + yoff, ' +
                x + ' + xoff, ' +
                y + ' + yoff);';
        }
    }

    findInLineSegment(pos: Point, options?: any): boolean {
        options = options || {};
        let hideAnchorPoints: boolean = options.hideAnchorPoints;
        let hideControlPoints: boolean = options.hideControlPoints;
        if (!hideControlPoints && this.controlPointsActive && this.next && this.next._ctrlHandle1 && this.next._ctrlHandle1.contains(pos)) {
            this.selectedPoint = this.next._ctrlHandle1;
            return true;
        } else if (!hideControlPoints && this.controlPointsActive && this._ctrlHandle2 && this._ctrlHandle2.contains(pos)) {
            this.selectedPoint = this._ctrlHandle2;
            return true;
        } else if (!hideAnchorPoints && this.pathPointIntersects(pos)) {
            this.selectedPoint = this.pt;
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

    getVertices(): any[] {
        return this.interpolateVertices();
    }

    interpolateVertices(divisions: number = 10): any[] {
        let vertices: any[] = [];
        if (this.prev && this._ctrlHandle1 && this._ctrlHandle2) {
            vertices.push({ x: this.prev.pt.x, y: this.prev.pt.y }); // previous point
            for (let i: number = 1; i <= divisions; i++) {
                let t: number = i / divisions;
                let vector2: Vector2 = this.CalculateCubicBezierPoint(t,
                    new Vector2(this.prev.pt.asArray()),
                    new Vector2(this._ctrlHandle1.asArray()),
                    new Vector2(this._ctrlHandle2.asArray()),
                    new Vector2(this.pt.asArray())
                );
                vertices.push({x: vector2[0], y: vector2[1]});
            }
        }
        return vertices;
    }

    CalculateCubicBezierPoint(t: number, p0: Vector2, p1: Vector2, p2: Vector2, p3: Vector2): Vector2 {
        let u = 1 - t;
        let tt = t * t;
        let uu = u * u;
        let uuu = uu * u;
        let ttt = tt * t;

        let p: Vector2 = p0.scale(uuu);
        p.add(p1.scale(3 * uu * t));
        p.add(p2.scale(3 * u * tt));
        p.add(p3.scale(ttt));

        return p;
    }

}
