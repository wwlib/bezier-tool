import AnchorPoint from '../src/app/model/AnchorPoint';
import LineSegment, { LineSegmentType } from '../src/app/model/LineSegment';
import { expect } from 'chai';
import 'mocha';

describe('LineSegment', () => {

    it('LineSegment pt should equal point', () => {
        const point = new AnchorPoint(10, 20);
        const lineSegment = new LineSegment(point, null, LineSegmentType.CORNER, null, 0);
        expect(lineSegment.pt).to.equal(point);
    });

    it('LineSegment contol points should be undefined', () => {
        const point = new AnchorPoint(10, 20);
        const lineSegment = new LineSegment(point, null, LineSegmentType.CORNER, null, 0);
        expect(lineSegment.ctrlHandle1).to.be.undefined;
        expect(lineSegment.ctrlHandle1).to.be.undefined;
    });

    it('LineSegment should have prev LineSegment', () => {
        const point = new AnchorPoint(10, 20);
        const lineSegment = new LineSegment(point, null, LineSegmentType.CORNER, null, 0);
        const point2 = new AnchorPoint(20, 40);
        const lineSegment2 = new LineSegment(point, lineSegment, LineSegmentType.CORNER, null, 0);
        expect(lineSegment2.prev).to.equal(lineSegment);
    });

    it('LineSegment should have 2 control points', () => {
        const point = new AnchorPoint(10, 20);
        const lineSegment = new LineSegment(point, null, LineSegmentType.CORNER, null, 0);
        const point2 = new AnchorPoint(20, 40);
        const lineSegment2 = new LineSegment(point, lineSegment, LineSegmentType.CORNER, null, 0);
        expect(lineSegment2.ctrlHandle1).to.not.be.undefined;
        expect(lineSegment2.ctrlHandle2).to.not.be.undefined;
    });

});
