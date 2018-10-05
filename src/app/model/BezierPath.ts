import LineSegment, { LineSegmentType } from './LineSegment';
import Point from './Point';

export default class BezierPath {

    public head: LineSegment; // Beginning of BezierPath linked list.
    public tail: LineSegment; // End of BezierPath linked list
    public selectedSegment: LineSegment; // Reference to selected LineSegment
    public startTime: number;
    public length: number;

    constructor(startPoint: Point, lineSegmentType: LineSegmentType = LineSegmentType.SMOOTH, startTime?: number) {
        this.head = null;
        this.tail = null;
        this.length = 0;
        this.addPoint(startPoint, lineSegmentType);
        this.startTime = startTime || new Date().getTime();
    }

    addPoint(pt: Point, lineSegmentType: LineSegmentType = LineSegmentType.SMOOTH) {
        var newSegment: LineSegment = new LineSegment(pt, this.tail, lineSegmentType);
        if (this.tail == null) {
          this.tail = newSegment;
          this.head = newSegment;
        } else {
          this.tail.next = newSegment;
          this.tail = this.tail.next;
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
                this.selectedSegment.controlPointsActive = true;
                result = true;
            }
            current = current.next;
        }
        return result;
    }

    deselectPoints(): void {
        var current: LineSegment = this.head;
        while (current != null) {
            current.controlPointsActive = false;
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
            rightNeighbor.ctrlPt1 = segmentToDelete.ctrlPt1;
            rightNeighbor.prev = leftNeighbor;
        }
        // HEAD CASE
        else if (!leftNeighbor) {
          this.head = rightNeighbor;
          if (this.head) {
            rightNeighbor.ctrlPt1 = null;
            rightNeighbor.ctrlPt2 = null;
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

    getAnchorVertices(): any[] {
        let vertices: any = [];
        var current: LineSegment = this.head;
        while (current != null) {
            let currentTime: number = current.time = this.startTime;
            // let segment: any = {x: current.pt.x, y: current.pt.y, t: currentTime};

            vertices.push(...current.getVertices());
            current = current.next;
        }
        return vertices;
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
