import LineSegment, { LineSegmentType } from './LineSegment';
import Point from './Point';

export default class BezierPath {

    public head; // Beginning of BezierPath linked list.
    public tail; // End of BezierPath linked list
    public selectedSegment: LineSegment; // Reference to selected LineSegment

    constructor(startPoint: Point, lineSegmentType: LineSegmentType = LineSegmentType.SMOOTH) {
        this.head = null;
        this.tail = null;
        this.addPoint(startPoint, lineSegmentType);
    }

    addPoint(pt: Point, lineSegmentType: LineSegmentType = LineSegmentType.SMOOTH) {
        var newPt = new LineSegment(pt, this.tail, lineSegmentType);
        if (this.tail == null) {
          this.tail = newPt;
          this.head = newPt;
        } else {
          this.tail.next = newPt;
          this.tail = this.tail.next;
        }
        return newPt;
    };

    draw(ctx) {
        if (this.head == null)
          return;

        var current = this.head;
        while (current != null) {
          current.draw(ctx);
          current = current.next;
        }
    };

    // returns true if point selected
    selectPoint(pos: Point): boolean {
        var current = this.head;
        while (current != null) {
          if (current.findInLineSegment(pos)) {
            this.selectedSegment = current;
            return true;
          }
          current = current.next;
        }
        return false;
    }

    // returns true if point deleted
    deletePoint(pos) {
        var current = this.head;
        while (current != null) {
          if (current.pathPointIntersects(pos)) {
            var toDelete = current;
            var leftNeighbor = current.prev;
            var rightNeighbor = current.next;

            // Middle case
            if (leftNeighbor && rightNeighbor) {
              leftNeighbor.next = rightNeighbor;
              rightNeighbor.prev = leftNeighbor
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
            return true;
          }
          current = current.next;
        }
        return false;
    }

    clearSelected() {
        this.selectedSegment = null;
    }

    updateSelected(pos) {
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
}
