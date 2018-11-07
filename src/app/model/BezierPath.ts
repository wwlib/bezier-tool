import LineSegment, { LineSegmentType, LineSegmentOptions, InsertionPoint } from './LineSegment';
import Point from './Point';
import AnchorPoint from './AnchorPoint';
import { Vector2 } from 'math.gl';

export type InsertionObj = {
    segment: LineSegment;
    insertionPoint: InsertionPoint;
}

export default class BezierPath {

    public head: LineSegment; // Beginning of BezierPath linked list.
    public tail: LineSegment; // End of BezierPath linked list
    public selectedSegment: LineSegment; // Reference to selected LineSegment
    public startTime: number;
    public length: number;

    private _nearestInsertionObj: InsertionObj;

    constructor(startPoint: Point, lineSegmentType: LineSegmentType = LineSegmentType.SMOOTH, options: LineSegmentOptions, startTime?: number) {
        this.head = null;
        this.tail = null;
        this.length = 0;
        let anchorPoint: AnchorPoint = new AnchorPoint(startPoint.x, startPoint.y, options.anchorPointRadius);
        this.addPoint(anchorPoint, lineSegmentType, options);
        this.startTime = startTime || new Date().getTime();
    }

    addPoint(pt: Point, lineSegmentType: LineSegmentType = LineSegmentType.SMOOTH, options: LineSegmentOptions) {
        let anchorPoint: AnchorPoint = new AnchorPoint(pt.x, pt.y, options.anchorPointRadius);
        let newSegment: LineSegment = new LineSegment(anchorPoint, this.tail, lineSegmentType, options);
        if (this.tail == null) {
          this.tail = newSegment;
          this.head = newSegment;
        } else {
          this.tail.next = newSegment;
          this.tail = newSegment;
        }
        this.length++;
        return newSegment;
    };

    draw(ctx: CanvasRenderingContext2D, options?: any) {
        options = options || {};
        if (this.head == null)
          return;

        var current: LineSegment = this.head;
        while (current != null) {
            if (this._nearestInsertionObj && this._nearestInsertionObj.segment == current) {
                options.selectionPoint = this._nearestInsertionObj.insertionPoint.pt
            } else {
                options.selectionPoint = undefined;
            }
          current.draw(ctx, options);
          current = current.next;
        }
    };

    // returns true if point selected
    selectPoint(pos: Point, options?: any): boolean {
        options = options || {};
        let result: boolean = false;
        var current: LineSegment = this.head;
        while (current != null) {
            if (current.findInLineSegment(pos, options)) {
                this.selectedSegment = current;
                this.selectedSegment.select();
                result = true;
            }
            current = current.next;
        }
        return result;
    }

    deselectSegments(): void {
        var current: LineSegment = this.head;
        while (current != null) {
            current.deselect();
            current = current.next;
        }
    }

    // returns true if point deleted
    deletePoint(pos: Point): boolean {
        let deleted: boolean = false;
        let current: LineSegment = this.head;
        while (!deleted && current != null) {
            if (current.pathPointIntersects(pos)) {
                this.deleteLineSegment(current);
                deleted = true;
            } else {
                current = current.next;
            }
        }
        return deleted;
    }

    deleteLineSegment(segmentToDelete: LineSegment): void {
        var leftNeighbor: LineSegment = segmentToDelete.prev;
        var rightNeighbor: LineSegment = segmentToDelete.next;

        // Middle case
        if (leftNeighbor && rightNeighbor) {
            leftNeighbor.next = rightNeighbor;
            rightNeighbor.ctrlHandle1 = segmentToDelete.ctrlHandle1;
            rightNeighbor.prev = leftNeighbor;
        }
        // HEAD CASE
        else if (!leftNeighbor) {
          this.head = rightNeighbor;
          if (this.head) {
            rightNeighbor.ctrlHandle1 = null;
            rightNeighbor.ctrlHandle2 = null;
            this.head.prev = null;
          }
          else
            this.tail = null;
        }
        // TAIL CASE
        else if (!rightNeighbor) {
          this.tail = leftNeighbor;
          if (this.tail)
            this.tail.next = null;
          else
            this.head = null;
        }
        length--;
    }

    recalcuateControlPoints(): void {
        var current: LineSegment = this.head;
        while (current != null) {
          current.updateControlPointAngles();
          current = current.next;
        }
    }


    clearSelected() {
        this.selectedSegment = null;
    }

    updateSelected(pos: Point) {
        this.selectedSegment.moveTo(pos);
    }

    toJSString() {
        var myString =
          ['function drawShape(ctx, xoff, yoff) {',
           '  ctx.beginPath();',
          ];

        var current = this.head;
        while (current != null) {
          myString.push(current.toJSString());
          current = current.next;
        }
        myString.push('  ctx.stroke();');
        myString.push('}');
        return myString.join('\n');
    }

    getVertices(): any[] {
        let vertices: any = [];
        var current: LineSegment = this.head;
        while (current != null) {
            // let currentTime: number = current.time - this.startTime;
            // let segment: any = {x: current.pt.x, y: current.pt.y, t: currentTime};

            vertices.push(...current.getVertices(this.startTime));
            current = current.next;
        }
        return vertices;
    }

    getSegments(): any {
        let segments: any = [];
        var current: LineSegment = this.head;
        while (current != null) {
            // let currentTime: number = current.time - this.startTime;
            // let segment: any = {x: current.pt.x, y: current.pt.y, t: currentTime};

            segments.push(current.toJson(this.startTime));
            current = current.next;
        }
        return segments;
    }

    toJson(): any {
        let json: any = {};
        json.startTime = this.startTime;
        json.vertices = this.getVertices();
        json.vertexCount = json.vertices.length;
        json.segments = this.getSegments();
        json.segmentCount = json.segments.length;
        json.width = 500; //TODO
        json.height = 375; //TODO
        json.originX = 0;
        json.originY = 0;
        return json;
    }

    toSvg(): string {
        let svg: string = `<svg width="500" height="375" xmlns="http://www.w3.org/2000/svg">\n`; //TODO
        var current: LineSegment = this.head;
        while (current != null) {
            svg += current.toSvg() + '\n';
            current = current.next;
        }
        svg += `</svg>`;
        return svg;
    }

    // Visvalingam's algorithm
    // https://bost.ocks.org/mike/simplify/
    simplifyPath(minTriangleArea: number): boolean {
    	// We need 3+ points to use this algorithm!
    	if (this.length < 3) {
            return false;
        }

        let doneSimplifying: boolean = false;
        while(!doneSimplifying) {
            let current: LineSegment = this.head.next;
            while (current != null && current != this.tail) {
                let smallestArea: number = Number.MAX_SAFE_INTEGER;
                let smallestAreaSegment: LineSegment = current;

                let nextArea: number = this.getTriangleArea(current.prev, current, current.next);
                if(nextArea < smallestArea) {
                    smallestArea = nextArea;
                    smallestAreaSegment = current;
                }

                if(smallestArea >= minTriangleArea || this.length <= 3) {
                    doneSimplifying = true;
                } else {
                    // Delete the segment that forms the peak of the smallest triangle
                    this.deleteLineSegment(current);
                }

                current = current.next;
            }
        }
    }

    // selectNearestSegment(pt: Point): void {
    //     this.deselectSegments();
    //     let nearestSegment: LineSegment = this.head;
    //
    //     let nearestDist: number = Number.MAX_VALUE;
    //     var current: LineSegment = this.head;
    //     while (current != null) {
    //         let vA = new Vector2([pt.x ,pt.y]);
    //         let vB = new Vector2([current.pt.x ,current.pt.y]);
    //         let dist = vA.distanceTo(vB);
    //         if (dist < nearestDist) {
    //             nearestSegment = current;
    //         }
    //         nearestDist = Math.min(nearestDist, dist);
    //         current = current.next;
    //     }
    //     nearestSegment.select();
    // }

    findNearestPointOnSegment(pt: Point): {segment: LineSegment, insertionPoint: InsertionPoint} {
        let result: any = {segment: undefined, insertionPoint: undefined};
        // for each segment, find nearest point to segment
        // keep the point that is nearest the cursor
        // return the segment and the pt (t)
        let nearestDist: number = Number.MAX_VALUE;
        var current: LineSegment = this.head;
        while (current != null) {
            // turn segment into bezier
            // find closest pt & t on the bezier
            let closestPt: InsertionPoint = current.findNearestPointOnSegment(pt);
            if (closestPt) {
                let vA = new Vector2([pt.x ,pt.y]);
                let vB = new Vector2([closestPt.pt.x ,closestPt.pt.y]);
                let dist = vA.distanceTo(vB);
                if (dist < nearestDist) {
                    result.segment = current;
                    result.insertionPoint = closestPt;
                }
                nearestDist = Math.min(nearestDist, dist);
            }
            current = current.next;
        }
        if (nearestDist > 20) { //TODO: Magic number
            this._nearestInsertionObj = undefined;
        } else {
            this._nearestInsertionObj = result;
        }

        return this._nearestInsertionObj;
    }

    insertPointOnSegment(): void {
        if (this._nearestInsertionObj) {
            //generate two new LineSegments based on t
            //replace LineSegment with two new segments
            // console.log(`BezierPath: insertPointOnSegment:`, this._nearestInsertionObj);
            let segment: LineSegment = this._nearestInsertionObj.segment;
            let t: number = this._nearestInsertionObj.insertionPoint.t;
            if (segment) {
                let newSegments = segment.split(t);
                // console.log(`segment.split:`, newSegments);
                newSegments.left.next = newSegments.right;
                newSegments.right.prev = newSegments.left;
                if (segment.prev) {
                    segment.prev.next = newSegments.left;
                    newSegments.left.prev = segment.prev;

                }
                if (segment.next) {
                    segment.next.prev = newSegments.right;
                    newSegments.right.next = segment.next;
                }
                segment.dispose();
            }
            this.clearNearestPointOnSegment();
        }
    }

    clearNearestPointOnSegment(): void {
        this._nearestInsertionObj = undefined;
    }

    getTriangleArea(a: LineSegment, b: LineSegment, c: LineSegment) {
    	let area: number = Math.abs(
    		(
    			a.pt.x * (b.pt.y - c.pt.y) +
    			b.pt.x * (c.pt.y - a.pt.y) +
    			c.pt.x * (a.pt.y - b.pt.y)
    		) / 2
    	);
        return area;
    }

}
