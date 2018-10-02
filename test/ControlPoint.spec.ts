import Point from '../src/app/model/Point';
import LineSegment from '../src/app/model/LineSegment';
import ControlPoint from '../src/app/model/ControlPoint';
import { expect } from 'chai';
import 'mocha';

describe('ControlPoint', () => {

    it('ControlPoint xDelta should equal computed value', () => {
        const point = new Point(10, 20);
        const lineSegment = new LineSegment(point, null);
        let angle = Math.PI;
        let magnitude = 15;
        const controlPoint = new ControlPoint(angle, magnitude, lineSegment, true);
        let xDelta = magnitude * Math.cos(angle);
        let yDelta = magnitude * Math.sin(angle);
        expect(controlPoint.xDelta).to.equal(xDelta);
        expect(controlPoint.yDelta).to.equal(yDelta);
    });

});
