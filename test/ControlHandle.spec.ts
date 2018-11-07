import AnchorPoint from '../src/app/model/AnchorPoint';
import LineSegment, { LineSegmentType } from '../src/app/model/LineSegment';
import ControlHandle from '../src/app/model/ControlHandle';
import { expect } from 'chai';
import 'mocha';

describe('ControlHandle', () => {

    it('ControlHandle xDelta should equal computed value', () => {
        const point = new AnchorPoint(10, 20);
        const lineSegment = new LineSegment(point, null, LineSegmentType.CORNER, null, 0);
        let angle = Math.PI;
        let magnitude = 15;
        const controlHandle = new ControlHandle(angle, magnitude, lineSegment, true, null);
        let xDelta = magnitude * Math.cos(angle);
        let yDelta = magnitude * Math.sin(angle);
        expect(controlHandle.xDelta).to.equal(xDelta);
        expect(controlHandle.yDelta).to.equal(yDelta);
    });

});
