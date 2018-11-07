import Point, { PointShape } from './Point';
import ControlHandle, { ControlHandleOptions } from './ControlHandle';
import AnchorPoint from './AnchorPoint';
import { Vector2 } from 'math.gl';
import CanvasTransformer from './CanvasTransformer';

const Bezier = require('bezier-js');

export enum LineSegmentType {
    SMOOTH,
    CORNER
}

export type InsertionPoint = {
    pt: Point;
    t: number
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
    private _controlPointMagnitude: number = 10;
    private _options: LineSegmentOptions;
    private _selected: boolean;

    private _hull: Point[]; // for debugging


    constructor(pt: AnchorPoint, prev: LineSegment, type: LineSegmentType = LineSegmentType.SMOOTH, options: LineSegmentOptions, time?: number) {
        this.pt = pt;
        this.prev = prev;
        this.type = type;
        this._options = options;
        this.time = time || new Date().getTime();
        this.controlPointsActive = false;
        this._selected = false;

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

    get ctrlHandle1(): ControlHandle {
        return this._ctrlHandle1;
    }

    set ctrlHandle1(ctrlPoint: ControlHandle) {
        this._ctrlHandle1.dispose();
        this._ctrlHandle1 = ctrlPoint;
        if (this._ctrlHandle1) {
            this._ctrlHandle1.owner = this;
        }
    }

    get ctrlHandle2(): ControlHandle {
        return this._ctrlHandle2;
    }

    set ctrlHandle2(ctrlPoint: ControlHandle) {
        this._ctrlHandle2.dispose();
        this._ctrlHandle2 = ctrlPoint;
        if (this._ctrlHandle2) {
            this._ctrlHandle2.owner = this;
        }
    }

    toSvg(): string {
        let svg: string = '';
        if (this.prev) {
            let Mx: number = this.prev.pt.x;
            let My: number = this.prev.pt.y;
            let x1: number = this._ctrlHandle1.x;
            let y1: number = this._ctrlHandle1.y;
            let x2: number = this._ctrlHandle2.x;
            let y2: number = this._ctrlHandle2.y;
            let x3: number = this.pt.x;
            let y3: number = this.pt.y;

            svg = `<path d="M${Mx} ${My} C ${x1} ${y1}, ${x2} ${y2}, ${x3} ${y3}" stroke="black" fill="transparent"/>`;
        }

        return svg;
    }

    drawCurve(ctx: CanvasRenderingContext2D, startPt: AnchorPoint, endPt: AnchorPoint, _ctrlHandle1: ControlHandle, _ctrlHandle2: ControlHandle, txr: CanvasTransformer) {
        ctx.fillStyle = 'white';
        ctx.strokeStyle = this._selected ? 'lime' : this._options.lineColor; //'magenta'; //'darkgrey';
        ctx.beginPath();
        ctx.moveTo(startPt.tx(txr).x, startPt.tx(txr).y);
        ctx.bezierCurveTo(_ctrlHandle1.pt.tx(txr).x, _ctrlHandle1.pt.tx(txr).y, _ctrlHandle2.pt.tx(txr).x, _ctrlHandle2.pt.tx(txr).y, endPt.tx(txr).x, endPt.tx(txr).y);
        ctx.stroke();
    }

    drawSelectionPoint(ctx: CanvasRenderingContext2D, pt: Point, txr: CanvasTransformer) {
        ctx.fillStyle = 'white';
        ctx.strokeStyle = this._selected ? 'blue' : this._options.lineColor; //'magenta'; //'darkgrey';
        ctx.beginPath();
        ctx.arc(pt.tx(txr).x, pt.tx(txr).y, pt.RADIUS, 0, 2*Math.PI);
        ctx.stroke();
        ctx.fill();
    }

    drawHull(ctx: CanvasRenderingContext2D, txr: CanvasTransformer): void {
        // console.log(`drawHull: `, this._hull);
        if (this._hull && (this._hull.length == 4)) {
            let startPt: Point = this._hull[0];
            ctx.moveTo(startPt.tx(txr).x, startPt.tx(txr).y);
            ctx.beginPath();
            ctx.strokeStyle = 'white';
            this._hull.forEach((pt: Point) => {
                ctx.lineTo(pt.tx(txr).x, pt.tx(txr).y);
            });
            ctx.stroke();
        }
    }

    draw(ctx: CanvasRenderingContext2D, options?: any) {
        options = options || {};
        let transformer: CanvasTransformer = options.transformer;
        let hideAnchorPoints: boolean = options.hideAnchorPoints;
        let hideControlPoints: boolean = options.hideControlPoints;
        let selectionPoint: Point = options.selectionPoint;

        // If there are at least two points, draw curve.
        if (this.prev) {
            this.drawCurve(ctx, this.prev.pt, this.pt, this._ctrlHandle1, this._ctrlHandle2, transformer);
        }

        if (!hideAnchorPoints) {
            this.pt.draw(ctx, this._options.anchorPointShape, this._options.anchorPointColor, transformer);
        }

        // Draw control points if we have them
        if (!hideControlPoints) {
            if (this.prev && this.prev.controlPointsActive && this._ctrlHandle1) {
                this._ctrlHandle1.draw(ctx, this._options.controlPointShape, this._options.controlPointColor, transformer);
            }
            if (this.controlPointsActive && this._ctrlHandle2) {
                this._ctrlHandle2.draw(ctx, this._options.controlPointShape, this._options.controlPointColor, transformer);
            }
        }

        if (selectionPoint) {
            this.drawSelectionPoint(ctx, selectionPoint, transformer);
        }

        this.drawHull(ctx, transformer);
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
        let transformer: CanvasTransformer = options.transformer;
        let radius: number = this.pt.SELECT_RADIUS;
        if (transformer && transformer.getScale()) {
            radius = radius / transformer.getScale();
        }
        if (!hideControlPoints && this.controlPointsActive && this.next && this.next._ctrlHandle1 && this.next._ctrlHandle1.contains(pos, radius)) {
            this.selectedPoint = this.next._ctrlHandle1;
            return true;
        } else if (!hideControlPoints && this.controlPointsActive && this._ctrlHandle2 && this._ctrlHandle2.contains(pos, radius)) {
            this.selectedPoint = this._ctrlHandle2;
            return true;
        } else if (!hideAnchorPoints && this.pathPointIntersects(pos, radius)) {
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

    getVertices(pathStartTime: number = 0): any[] {
        return this.interpolateVertices(10, pathStartTime);
    }

    findNearestPointOnSegment(pt: Point): InsertionPoint | undefined {
        let closestPt: InsertionPoint | undefined = undefined
        // turn segment into bezier
        // find closest pt & t on the bezier
        if (this.prev) {
            let curve = new Bezier(
                this.prev.pt.x,this.prev.pt.y,
                this._ctrlHandle1.pt.x,this._ctrlHandle1.pt.y ,
                this._ctrlHandle2.pt.x,this._ctrlHandle2.pt.y ,
                this.pt.x,this.pt.y,
            );
            let p = curve.project(pt);
            // console.log(p);
            closestPt = {pt: new Point(p.x, p.y), t: p.t};
        }
        return closestPt;
    }

    setControlHandlesWithPoints(pt1: any, pt2: any): void {
        this._ctrlHandle1.setXY(pt1.x, pt1.y);
        this._ctrlHandle2.setXY(pt2.x, pt2.y);

    //     if (ch1) {
    //         let origin1: Point = this._ctrlHandle1.origin();
    //         let ch1_dx: number = ch1.x - origin1.x;
    //         let ch1_dy: number = ch1.y - origin1.y;
    //         this._ctrlHandle1.translate(ch1_dx, ch1_dy, false);
    //     }
    //
    //     if (ch2) {
    //         let origin2: Point = this._ctrlHandle2.origin();
    //         let ch2_dx: number = ch2.x - origin2.x;
    //         let ch2_dy: number = ch2.y - origin2.y;
    //         this._ctrlHandle2.translate(ch2_dx, ch2_dy, false);
    //     }
    }

    split(t: number): any {
        let result = {left: undefined, right: undefined};
        let curves;
        if (this.prev) {
            let curve = new Bezier(
                this.prev.pt.x,this.prev.pt.y,
                this._ctrlHandle1.pt.x,this._ctrlHandle1.pt.y ,
                this._ctrlHandle2.pt.x,this._ctrlHandle2.pt.y ,
                this.pt.x,this.pt.y,
            );
            curves = curve.split(t);
            // console.log(`curves: `, curves);
            let l0 = curves.left.points[0];
            let l1 = curves.left.points[1];
            let l2 = curves.left.points[2];
            let l3 = curves.left.points[3];

            let r0 = curves.right.points[0];
            let r1 = curves.right.points[1];
            let r2 = curves.right.points[2];
            let r3 = curves.right.points[3];

            let leftSegment: LineSegment = new LineSegment(
                new AnchorPoint(l3.x, l3.y, this._options.anchorPointRadius),
                this.prev,
                LineSegmentType.SMOOTH,
                this._options,
                this.prev.time + (this.time - this.prev.time) * t
            );
            // leftSegment._hull = [
            //     new Point(l0.x, l0.y),
            //     new Point(l1.x, l1.y),
            //     new Point(l2.x, l2.y),
            //     new Point(l3.x, l3.y),
            // ]
            leftSegment.setControlHandlesWithPoints(l1, l2);
            // console.log(leftSegment, l0, l1, l2, l3);

            let rightSegment: LineSegment = new LineSegment(
                new AnchorPoint(r3.x, r3.y, this._options.anchorPointRadius), // same as this.pt
                leftSegment,
                LineSegmentType.SMOOTH,
                this._options,
                this.time
            );
            // rightSegment._hull = [
            //     new Point(r0.x, r0.y),
            //     new Point(r1.x, r1.y),
            //     new Point(r2.x, r2.y),
            //     new Point(r3.x, r3.y),
            // ]
            rightSegment.setControlHandlesWithPoints(r1, r2);
            // console.log(rightSegment, r0, r1, r2, r3);

            result.left = leftSegment;
            result.right = rightSegment;
        }
        return result;
    }

    select(): void {
        this._selected = true;
        this.controlPointsActive = true;
    }

    deselect(): void {
        this._selected = false;
        this.controlPointsActive = false;
    }

    toJson(pathStartTime: number = 0): any {
        let segment: any = {};
        segment.point = {x: this.pt.x, y: this.pt.y};
        segment.type = LineSegmentType[this.type];
        segment.time = this.time - pathStartTime;
        if (this._ctrlHandle1) {
            segment.controlPoint1 = {
                pt: {x: this._ctrlHandle1.x, y: this._ctrlHandle1.y},

            };
        }
        if (this._ctrlHandle2) {
            segment.controlPoint2 = {
                pt: {x: this._ctrlHandle2.x, y: this._ctrlHandle2.y},
            }
        }
        return segment;
    }

    // public pt: AnchorPoint; // Path point.
    // public next: LineSegment; // Next LineSegment in path
    // public prev: LineSegment; // Previous LineSegment in path
    // public selectedPoint: AnchorPoint | ControlHandle; // Specific point on the LineSegment that is selected.
    // public type: LineSegmentType;
    // public time: number;
    // public controlPointsActive: boolean;
    //
    // private _ctrlHandle1: ControlHandle; // Control point 1.
    // private _ctrlHandle2: ControlHandle; // Control point 2.
    // private _controlPointMagnitude: number = 10;
    // private _options: LineSegmentOptions;

    interpolateVertices(divisions: number = 10, pathStartTime: number = 0): any[] {
        let vertices: any[] = [];
        if (this.prev && this._ctrlHandle1 && this._ctrlHandle2) {
            let startTime: number = this.prev.time - pathStartTime;
            let duration: number = this.time - this.prev.time;
            vertices.push({ x: this.prev.pt.x, y: this.prev.pt.y, t: startTime }); // previous point

            for (let i: number = 1; i < divisions; i++) {
                let t: number = i / divisions;
                let vector2: Vector2 = this.CalculateCubicBezierPoint(t,
                    new Vector2(this.prev.pt.asArray()),
                    new Vector2(this._ctrlHandle1.asArray()),
                    new Vector2(this._ctrlHandle2.asArray()),
                    new Vector2(this.pt.asArray())
                );
                vertices.push({x: vector2[0], y: vector2[1], t: Math.floor(startTime + duration * t)});
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

    dispose(): void {
        this.pt = undefined;
        this.next = undefined;
        this.prev = undefined;
        this.selectedPoint = undefined;
        this._ctrlHandle1.dispose();
        this._ctrlHandle1 = undefined;
        this._ctrlHandle2.dispose();
        this._ctrlHandle2 = undefined;
        this._options = undefined;
    }

}
