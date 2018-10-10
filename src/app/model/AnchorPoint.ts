import Point, { PointShape } from './Point';
import { Matrix4 } from 'math.gl';

export default class AnchorPoint extends Point {

    constructor(newX: number, newY: number, radius?: number) {
        super(newX, newY, radius);
    }

    draw(ctx: CanvasRenderingContext2D, shape: PointShape, strokeStyle: string = 'magenta', tx: Matrix4): void {
        ctx.fillStyle = 'white';
        ctx.strokeStyle = strokeStyle;
        if (shape == PointShape.Circle) {
            ctx.beginPath();
            ctx.arc(this.tx(tx).x, this.tx(tx).y, this.RADIUS, 0, 2*Math.PI);
            ctx.stroke();
            ctx.fill();
        } else {
            ctx.fillRect(this.tx(tx).x - this.RADIUS, this.tx(tx).y - this.RADIUS, this.RADIUS * 2, this.RADIUS * 2);
            ctx.strokeRect(this.tx(tx).x - this.RADIUS, this.tx(tx).y - this.RADIUS, this.RADIUS * 2, this.RADIUS * 2);
        }
    };
}
