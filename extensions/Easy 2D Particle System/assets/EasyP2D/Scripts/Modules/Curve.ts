import { Vec2, _decorator, math } from "cc";
const { property, ccclass } = _decorator;

@ccclass('BezierPosition')
export class BezierPosition {
    @property(Vec2)
    public position = new Vec2();
    /**
     * @en Control point 1, relative to position
     * @zh 控制点1，相对于position
     */
    @property(Vec2)
    public handle1 = new Vec2();
    /**
     * @en Control point 2, relative to position
     * @zh 控制点2，相对于position
     */
    @property(Vec2)
    public handle2 = new Vec2();
}

function isZero(val: number) {
    return val > -math.EPSILON && val < math.EPSILON;
}

enum EvaluateType {
    Point,
    Tangent,
    Normal,
    Curvature
}

const TRIGONOMETRIC_EPSILON = 1e-8;
const ZERO_POS = new Vec2();

export class Curve {
    public points: BezierPosition[] = [];
    private _cachePoints: Vec2[] = [];
    private _cacheTimes: number[] = [];
    private _totalDistance = 0;
    private _cacheDistances: number[] = [];
    private _lengthStart2End = 0;
    private _curveMode = true;

    get totalDistance() {
        return this._totalDistance;
    }

    get lengthStart2End() {
        return this._lengthStart2End;
    }

    get cacheDistances() {
        return this._cacheDistances;
    }

    get cacheTimes() {
        return this._cacheTimes;
    }

    get curveMode() {
        return this._curveMode;
    }

    set curveMode(value: boolean) {
        this._curveMode = value;
    }

    getRandomPos() {
        if(this._cachePoints.length === 0) {
            return ZERO_POS;
        }
        
        let t = Math.random();
        return this.getPoint(t);
    }

    reset(points: BezierPosition[], testSplitCount = 20, cacheCount = 100) {
        if(!this._curveMode) {
            testSplitCount = 2;
            cacheCount = testSplitCount * this.points.length * 0.5;
        }

        this.points = points;

        if(points.length < 2) {
            this._cachePoints.length = 0;
            this._cacheTimes.length = 0;
            return;
        }

        this._calcCachePoints(testSplitCount, cacheCount);
    }

    getTimeByDistance(distance: number) {
        if(this._cacheDistances.length === 0) {
            return 0;
        }
        
        let totalDist = this._totalDistance;
        if(distance <= 0) {
            return 0;        
        }else if(distance >= totalDist) {
            return 1;
        }
        
        let dists = this._cacheDistances;
        let times = this._cacheTimes;
        let count = dists.length;
        let total = 0;
        for(let i = 0; i < count; i++) {
            let dist = dists[i];
            let t = times[i];
            if(total + dist >= distance) {
                let t2 = (distance - total) / dist;
                return t + t2 * (1 - t);
            }
            total += dist;
        }

        return 1;
    }

    getTangetByDistance(distance: number) {
        let t = this.getTimeByDistance(distance);
        return this.getTangent(t);
    }

    getTangent(t: number, reverse = false, dt: number = 0.01) {
        let p = this.getPoint(t);
        let x0 = p.x;
        let y0 = p.y;
        let x1 = 0, y1 = 0;   
        if(!reverse) { 
            if(t < 1) {
                p = this.getPoint(t + dt);
                x1 = p.x;
                y1 = p.y;
            }else {
                p = this.getPoint(1 - dt);
                x1 = -p.x;
                y1 = -p.y;
            }
        }else{
            if(t > 0) {
                p = this.getPoint(t - dt);
                x1 = p.x;
                y1 = p.y;
            }else {
                p = this.getPoint(dt);
                x1 = -p.x;
                y1 = -p.y;
            }
        }

        _tempVec2.set(x1 - x0, y1 - y0);
        return _tempVec2.normalize();
    }

    getPoint(t: number) {
        if(this._cachePoints.length === 0) {
            return ZERO_POS;
        }

        for(let i = 0; i < this._cacheTimes.length; i++) {
            let time = this._cacheTimes[i];
            if(time >= t) {
                if(i === 0) {
                    return this._cachePoints[0];
                }

                let p0 = this._cachePoints[i - 1];
                let p1 = this._cachePoints[i];
                let t0 = this._cacheTimes[i - 1];
                let t1 = this._cacheTimes[i];
                let t2 = (t - t0) / (t1 - t0);

                _tempVec2.set(p0.x, p0.y);
                return _tempVec2.lerp(p1, t2);
            }
        }

        return this._cachePoints[this._cachePoints.length - 1];
    }
    
    // 缓存点
    private _calcCachePoints(testSplitCount = 20, cacheCount = 100) {
        let count = this.points.length - 1;
        let dt = 1 / (testSplitCount-1);
        
        this._cachePoints.length = 0;
        this._cacheTimes.length = 0;
        let dists: number[] = [];
        let totalDist = 0;

        for(let i = 0; i < count; i++) {
            let dist = 0;
            let lastPos: Vec2 = _tempVec2_2;
            let t = 0;         
            for(let j = 0; j < testSplitCount; j++) {
                let p0 = this.points[i];
                let p1 = this.points[i + 1];
                let p = this.evaluate(p0, p1, t, EvaluateType.Point, false);
                _tempVec2.set(p.x, p.y);
                if(j > 0) {
                    dist += Vec2.distance(_tempVec2, lastPos);                
                }
                lastPos.set(_tempVec2.x, _tempVec2.y);
                
                t += dt;
                if(t > 1) {
                    t = 1;
                }
            }
            dists.push(dist);
            totalDist += dist;
        }    
        this._totalDistance = totalDist;  
        this._cacheDistances = dists;
        let endPos = this.points[count].position;
        let startPos = this.points[0].position;
        this._lengthStart2End = Vec2.distance(endPos, startPos);

        let dDist = totalDist / cacheCount;
        dt = 1 / cacheCount;
        let totalT = 0;
        for(let i = 0; i < count; i++) {
            let dist = dists[i];
            let p0 = this.points[i];
            let p1 = this.points[i + 1];
            let pointCount = 0;
            if(this._curveMode) {
                pointCount = Math.max(1, Math.floor(dist / dDist));
            }else{
                pointCount = 1;
            }
            let segDt = 1 / pointCount;
            let t = 0;
            for(let j = 0; j < pointCount; j++) {
                let p = this.evaluate(p0, p1, t, EvaluateType.Point, false);
                let pos = p.clone();
                if(pos) {
                    this._cachePoints.push(pos);
                    this._cacheTimes.push(totalT);
    
                    totalT += dt;
                    if(totalT > 1) {
                        totalT = 1;
                    }
                }

                t += segDt;                
                if(t > 1) {
                    t = 1;
                }
            }
        }
        
        this._cachePoints.push(this.points[this.points.length - 1].position);
        this._cacheTimes.push(1);
    }

    private evaluate(p0: BezierPosition, p1: BezierPosition, t:number, type: EvaluateType, normalized: boolean) {
        if(!this.curveMode) {
            _tempVec2.set(p1.position.x, p1.position.y);
            return _tempVec2.subtract(p0.position).multiplyScalar(t).add(p0.position);
        }

        // Do not produce results if parameter is out of range or invalid.
        if (t == null || t < 0 || t > 1)
            return null;

        // B(t) = (1 - t)³ * P0 + 3 * (1 - t)² * t * P1 + 3 * (1 - t) * t² * P2 + t³ * P3

        var x0 = p0.position.x, y0 = p0.position.y,
            x1 = p0.handle2.x + x0, y1 = p0.handle2.y + y0,
            x3 = p1.position.x, y3 = p1.position.y,
            x2 = p1.handle1.x + x3, y2 = p1.handle1.y + y3;

        // If the curve handles are almost zero, reset the control points to the
        // anchors.
        if (isZero(p0.handle2.x) && isZero(p0.handle2.y)) {
            x1 = x0;
            y1 = y0;
        }
        if (isZero(p1.handle1.x) && isZero(p1.handle1.y)) {
            x2 = x3;
            y2 = y3;
        }
        // Calculate the polynomial coefficients.
        var cx = 3 * (x1 - x0),
            bx = 3 * (x2 - x1) - cx,
            ax = x3 - x0 - cx - bx,
            cy = 3 * (y1 - y0),
            by = 3 * (y2 - y1) - cy,
            ay = y3 - y0 - cy - by,
            x, y;
        if (type === EvaluateType.Point) {
            // type === 0: getPoint()
            // Calculate the curve point at parameter value t
            // Use special handling at t === 0 / 1, to avoid imprecisions.
            // See #960
            x = t === 0 ? x0 : t === 1 ? x3
                    : ((ax * t + bx) * t + cx) * t + x0;
            y = t === 0 ? y0 : t === 1 ? y3
                    : ((ay * t + by) * t + cy) * t + y0;
        } else {
            // type === 1: getTangent()
            // type === 2: getNormal()
            // type === 3: getCurvature()
            var tMin = /*#=*/math.EPSILON,
                tMax = 1 - tMin;
            // 1: tangent, 1st derivative
            // 2: normal, 1st derivative
            // 3: curvature, 1st derivative & 2nd derivative
            // Prevent tangents and normals of length 0:
            // https://stackoverflow.com/questions/10506868/
            if (t < tMin) {
                x = cx;
                y = cy;
            } else if (t > tMax) {
                x = 3 * (x3 - x2);
                y = 3 * (y3 - y2);
            } else {
                x = (3 * ax * t + 2 * bx) * t + cx;
                y = (3 * ay * t + 2 * by) * t + cy;
            }
            if (normalized) {
                // When the tangent at t is zero and we're at the beginning
                // or the end, we can use the vector between the handles,
                // but only when normalizing as its weighted length is 0.
                if (x === 0 && y === 0 && (t < tMin || t > tMax)) {
                    x = x2 - x1;
                    y = y2 - y1;
                }
                // Now normalize x & y
                var len = Math.sqrt(x * x + y * y);
                if (len) {
                    x /= len;
                    y /= len;
                }
            }
            if (type === EvaluateType.Curvature) {
                // Calculate 2nd derivative, and curvature from there:
                // http://cagd.cs.byu.edu/~557/text/ch2.pdf page#31
                // k = |dx * d2y - dy * d2x| / (( dx^2 + dy^2 )^(3/2))
                var x2 = 6 * ax * t + 2 * bx,
                    y2 = 6 * ay * t + 2 * by,
                    d = Math.pow(x * x + y * y, 3 / 2);
                // For JS optimizations we always return a Point, although
                // curvature is just a numeric value, stored in x:
                x = d !== 0 ? (x * y2 - y * x2) / d : 0;
                y = 0;
            }
        }
        // The normal is simply the rotated tangent:
        if(type === EvaluateType.Normal) {
            _tempVec2.set(y, -x);
        }else{
            _tempVec2.set(x, y);
        }

        return _tempVec2;
    }
}

const _tempVec2 = new Vec2();
const _tempVec2_2 = new Vec2();