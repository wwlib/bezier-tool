import Point, { PointShape } from './Point';

export default class AnchorPoint extends Point {

    constructor(newX: number, newY: number, radius?: number) {
        super(newX, newY, radius);
    }

    draw(ctx: CanvasRenderingContext2D, shape: PointShape, strokeStyle: string = 'magenta'): void {
        ctx.fillStyle = 'white';
        ctx.strokeStyle = strokeStyle;
        if (shape == PointShape.Circle) {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.RADIUS, 0, 2*Math.PI);
            ctx.stroke();
            ctx.fill();
        } else {
            ctx.fillRect(this._xVal - this.RADIUS, this._yVal - this.RADIUS, this.RADIUS * 2, this.RADIUS * 2);
            ctx.strokeRect(this._xVal - this.RADIUS, this._yVal - this.RADIUS, this.RADIUS * 2, this.RADIUS * 2);
        }
    };
}
