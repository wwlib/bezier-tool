import Point, { PointShape } from './Point';
import CanvasTransformer from './CanvasTransformer';

export default class ControlPoint extends Point {

    constructor(newX: number, newY: number, radius?: number) {
        super(newX, newY, radius);
    }

    draw(ctx: CanvasRenderingContext2D, shape: PointShape, strokeStyle: string = 'magenta', txr: CanvasTransformer): void {
        ctx.fillStyle = 'white';
        ctx.strokeStyle = strokeStyle;
        if (shape == PointShape.Circle) {
            ctx.beginPath();
            ctx.arc(this.tx(txr).x, this.tx(txr).y, this.RADIUS, 0, 2*Math.PI);
            ctx.stroke();
            ctx.fill();
        } else {
            ctx.fillRect(this.tx(txr).x - this.RADIUS, this.tx(txr).y - this.RADIUS, this.RADIUS * 2, this.RADIUS * 2);
            ctx.strokeRect(this.tx(txr).x - this.RADIUS, this.tx(txr).y - this.RADIUS, this.RADIUS * 2, this.RADIUS * 2);
        }
    };
}
