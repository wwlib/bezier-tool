// import { Vector2, Matrix4 } from 'math.gl';
import CanvasTransformer from './CanvasTransformer';

export enum PointShape {
    Square,
    Circle
}

export type PointCoords = {
    x: number;
    y: number;
}

export default class Point {

    protected _xVal: number;
    protected _yVal: number;

    public RADIUS;
    public SELECT_RADIUS;

    constructor(newX: number, newY: number, radius?: number) {
        this._xVal = newX;
        this._yVal = newY;

        this.RADIUS = radius || 3;
        this.SELECT_RADIUS = this.RADIUS + 2;
    }

    get x() {
        return this._xVal;
    }

    get y() {
        return this._yVal;
    }

    asArray(): number[] {
        return [this._xVal, this._yVal];
    }

    toJson(): any {
        return {x: this._xVal, y: this._yVal};
    }

    set(x: number, y:number) {
        this._xVal = x;
        this._yVal = y;
    };

    // This is a placeholder anticipating the need to draw control points un-scaled - on scaled drawings
    tx(txr: CanvasTransformer): PointCoords {
        let coords: PointCoords = {x: this.x, y: this.y};
        if (txr) {
            let pt = txr.applyTransform(this.x, this.y);
            coords = {x: pt.x, y: pt.y};
        }
        // noop for now

        return coords
    }

    draw(ctx: CanvasRenderingContext2D, shape: PointShape, strokeStyle: string, txr: CanvasTransformer): void {
        console.log(`Point: draw: unimpemented.`);
    }

    computeSlope(pt) {
        return (pt.y - this._yVal) / (pt.x - this._xVal);
    };

    contains(pt: Point, radius?: number) {
        radius = radius || this.SELECT_RADIUS;
        var xInRange = pt.x >= this._xVal - radius && pt.x <= this._xVal + radius;
        var yInRange = pt.y >= this._yVal - radius && pt.y <= this._yVal + radius;
        return xInRange && yInRange;
    };

    offsetFrom(pt) {
        return {
            xDelta: pt.x - this._xVal,
            yDelta: pt.y - this._yVal,
        };
    };

    translate(xDelta, yDelta) {
        this._xVal += xDelta;
        this._yVal += yDelta;
    };
}
