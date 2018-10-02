import Point from '../src/app/model/Point';
import LineSegment from '../src/app/model/LineSegment';
import { expect } from 'chai';
import 'mocha';

describe('LineSegment', () => {

    it('LineSegment pt should equal point', () => {
        const point = new Point(10, 20);
        const lineSegment = new LineSegment(point, null);
        expect(lineSegment.pt).to.equal(point);
    });

    it('LineSegment contol points should be undefined', () => {
        const point = new Point(10, 20);
        const lineSegment = new LineSegment(point, null);
        expect(lineSegment.ctrlPt1).to.be.undefined;
        expect(lineSegment.ctrlPt2).to.be.undefined;
    });

    it('LineSegment should have prev LineSegment', () => {
        const point = new Point(10, 20);
        const lineSegment = new LineSegment(point, null);
        const point2 = new Point(20, 40);
        const lineSegment2 = new LineSegment(point2, lineSegment);
        expect(lineSegment2.prev).to.equal(lineSegment);
    });

    it('LineSegment should have 2 control points', () => {
        const point = new Point(10, 20);
        const lineSegment = new LineSegment(point, null);
        const point2 = new Point(20, 40);
        const lineSegment2 = new LineSegment(point2, lineSegment);
        expect(lineSegment2.ctrlPt1).to.not.be.undefined;
        expect(lineSegment2.ctrlPt2).to.not.be.undefined;
    });

});
