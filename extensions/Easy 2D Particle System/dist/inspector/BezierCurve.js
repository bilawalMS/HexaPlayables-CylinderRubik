"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BezierCurve = exports.BezierPosition = void 0;
const cc_1 = require("cc");
const { property, ccclass } = cc_1._decorator;
class BezierPosition {
    constructor() {
        this.position = new cc_1.Vec2();
        this.handle1 = new cc_1.Vec2();
        this.handle2 = new cc_1.Vec2();
    }
}
exports.BezierPosition = BezierPosition;
class BezierCurve {
    constructor() {
        this.points = [];
        this._tCache = {};
    }
    reset(points) {
        this.points = points;
        this.preprocess();
    }
    preprocess() {
        this._tCache = {};
        for (let i = 0; i < this.points.length; i++) {
            const point = this.points[i];
            const nextPoint = this.points[i + 1];
            if (nextPoint) {
                const t = point.position.subtract(nextPoint.position).length();
                this._tCache[i] = t;
            }
        }
    }
    getPoint(t) {
        if (this.points.length < 2) {
            _tempVec2.set(0, 0);
            return _tempVec2;
        }
        if (t <= 0) {
            return this.points[0].position;
        }
        if (t >= 1) {
            return this.points[this.points.length - 1].position;
        }
        let totalT = 0;
        for (let i = 0; i < this.points.length - 1; i++) {
            const t1 = this._tCache[i];
            const t2 = this._tCache[i + 1];
            totalT += t1 + t2;
            if (t <= totalT) {
                const t3 = t - (totalT - t1);
                return this.getPointByIndex(i, t3 / t1);
            }
        }
    }
    getPointByIndex(index, t) {
        const point = this.points[index];
        const nextPoint = this.points[index + 1];
        if (nextPoint) {
            const x = this.getPointValue(point.position.x, point.handle2.x, nextPoint.handle1.x, nextPoint.position.x, t);
            const y = this.getPointValue(point.position.y, point.handle2.y, nextPoint.handle1.y, nextPoint.position.y, t);
            _tempVec2.set(x, y);
            return _tempVec2;
        }
        return point.position;
    }
    getPointValue(p0, p1, p2, p3, t) {
        return p0 * (1 - t) * (1 - t) * (1 - t) + 3 * p1 * t * (1 - t) * (1 - t) + 3 * p2 * t * t * (1 - t) + p3 * t * t * t;
    }
}
exports.BezierCurve = BezierCurve;
const _tempVec2 = new cc_1.Vec2();
