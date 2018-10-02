import Point from '../src/app/model/Point';
import { expect } from 'chai';
import 'mocha';

describe('Point', () => {

    it('point (x,y) should return (10,20)', () => {
        const point = new Point(10, 20);
        expect(point.x).to.equal(10);
        expect(point.y).to.equal(20);
    });

    it('point (x,y) should return (30,40)', () => {
        const point = new Point(10, 20);
        point.set(30,40)
        expect(point.x).to.equal(30);
        expect(point.y).to.equal(40);
    });

    it('computeSlope should return 1', () => {
        const point = new Point(10, 10);
        const point2 = new Point(20, 20);
        expect(point.computeSlope(point2)).to.equal(1);
    });

    it('point.contains(point2) should return true', () => {
        const point = new Point(1, 1);
        const point2 = new Point(2, 2);
        expect(point.contains(point2)).to.be.true;
    });

    it('point.contains(point2) should return false', () => {
        const point = new Point(1, 1);
        const point2 = new Point(20, 20);
        expect(point.contains(point2)).to.be.false;
    });

    it('point.offsetFrom(point2) should return {xDelta: 10, yDelta: 5}', () => {
        const point = new Point(10, 10);
        const point2 = new Point(20, 15);
        expect(point.offsetFrom(point2)).to.deep.equal({xDelta: 10, yDelta: 5});
    });

    it('point.translate(5, 5) should return (15, 20)', () => {
        const point = new Point(10, 15);
        point.translate(5, 5);
        expect(point.x).to.equal(15);
        expect(point.y).to.equal(20);
    });

});
