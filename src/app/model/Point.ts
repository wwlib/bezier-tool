export default class Point {

    private _xVal: number;
    private _yVal: number;

    public RADIUS;
    public SELECT_RADIUS;

    constructor(newX, newY) {
        this._xVal = newX;
        this._yVal = newY;

        this.RADIUS = 3;
        this.SELECT_RADIUS = this.RADIUS + 2;
    }

    get x() {
        return this._xVal;
    }

    get y() {
        return this._yVal;
    }

    set(x, y) {
        this._xVal = x;
        this._yVal = y;
    };

    drawSquare(ctx, strokeStyle: string = 'darkgrey') {
        ctx.save();
        ctx.fillStyle = 'black';
        ctx.strokeStyle = strokeStyle;
        ctx.fillRect(this._xVal - this.RADIUS, this._yVal - this.RADIUS, this.RADIUS * 2, this.RADIUS * 2);
        ctx.strokeRect(this._xVal - this.RADIUS, this._yVal - this.RADIUS, this.RADIUS * 2, this.RADIUS * 2);
        // ctx.fill();
        // ctx.stroke();
        ctx.restore();
    };

    computeSlope(pt) {
        return (pt.y - this._yVal) / (pt.x - this._xVal);
    };

    contains(pt) {
        var xInRange = pt.x >= this._xVal - this.SELECT_RADIUS && pt.x <= this._xVal + this.SELECT_RADIUS;
        var yInRange = pt.y >= this._yVal - this.SELECT_RADIUS && pt.y <= this._yVal + this.SELECT_RADIUS;
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
