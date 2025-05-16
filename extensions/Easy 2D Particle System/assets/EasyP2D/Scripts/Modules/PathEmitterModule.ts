import { CurveRange, Vec2, _decorator, math } from "cc";
import { EmitterMode, ExpansionType, PathEmitMode } from "../EasyP2DDefine";
import { Particle } from "../Particle";
import { EasyP2DModuleBase } from "./EasyP2DModuleBase";
import { IEasyP2D } from "../interfaces";
import { calcValueOnCurve, getRangePos } from "../EasyP2DUtils";
import { BezierPosition, Curve } from "./Curve";
const { ccclass, property } = _decorator;

@ccclass('PathEmitterModule')
export class PathEmitterModule extends EasyP2DModuleBase {    
    @property({ type: [BezierPosition], visible: false })
    private _poses: BezierPosition[] = [];

    @property({ type: [BezierPosition], visible: function () { return this.enabled } })
    public get poses(): BezierPosition[] {
        return this._poses;
    }

    public set poses(value: BezierPosition[]) {
        if(this._poses === value) return;
        this._poses = value;
        if(this._poses) {
            this.onInit();
        }
    }

    @property({type: CurveRange, visible: function(this: PathEmitterModule) {return this.enabled}})
    public scale = new CurveRange();

    @property({visible: false})
    private _online = true;

    @property
    public get online() {
        return this._online;
    }
    public set online(value: boolean) {
        if(this._online === value) return;
        this._online = value;
        if(!this._online) {
            this.triangulate();
        }
    }

    @property({type:PathEmitMode, visible: function(this: PathEmitterModule) {return this.online}})
    public emitMode = PathEmitMode.Random;

    @property({type:ExpansionType})
    public expansion = ExpansionType.None;

    @property
    public updateDirection = false;

    @property({visible: false})
    private _curveMode = true;
    @property
    public get curveMode() {
        return this._curveMode;
    }

    public set curveMode(value: boolean) {
        if(this._curveMode === value) return;

        this._curveMode = value;
        this._bezierCurve.curveMode = value;
        this._bezierCurve.reset(this.poses);

        if(!this._online) {
            this.triangulate();
        }
    }
    
    private _triangleIndices: number[][] = [];
    private _bezierCurve = new Curve();
    private _samplePoints: Vec2[] = [];

    constructor() {
        super();

        this.scale.constant = 1;
        this.enableOnEmitter = true;
        this.enableOnUpdate = true;
    }

    private get validPoses() {
        return this._poses && this._poses.length >= 2;
    }

    protected onInit(): void {
        if(!this.validPoses) {
            return;
        }

        this._bezierCurve.curveMode = this.curveMode;
        this._bezierCurve.reset(this.poses);
        if(!this.online) {
            this.triangulate();
        } 
    }

    public onEmitter(particle: Particle, turnPrecenet: number): void {
        if(!this.validPoses || particle.preventDefaultSetPos) {
            return;
        }
        
        const sys = this._easyP2D.system;
        if(sys.emitterMode == EmitterMode.TARGET) {
            this.generatePos(this._easyP2D, turnPrecenet, particle.targetPos);
            this.updateExpansion(particle, true);
        }else{
            this.generatePos(this._easyP2D, turnPrecenet, particle.pos);
            particle.preventDefaultSetPos = true;
            this.updateExpansion(particle, true);
        }
    }

    private updateExpansion(particle: Particle, init = false): void {
        switch(this.expansion) {
            case ExpansionType.Random:
                if(init) {
                    _tempVec2.x = math.randomRange(-1, 1);
                    _tempVec2.y = math.randomRange(-1, 1);
                }
                break;
            case ExpansionType.Out:
                _tempVec2.x = particle.pos.x;
                _tempVec2.y = particle.pos.y;
                break;
            case ExpansionType.In:
                _tempVec2.x = -particle.pos.x;
                _tempVec2.y = -particle.pos.y;
                break;
        }
        if(this.expansion !== ExpansionType.None) {
            _tempVec2.normalize();
            particle.dir.x = _tempVec2.x;
            particle.dir.y = _tempVec2.y;
            particle.preventDefaultSetDir = true;
        }
    }

    public onUpdate(particle: Particle, dt: number, livePrecent: number): void {
        const sys = this._easyP2D.system;
        if(!this.updateDirection || sys.emitterMode == EmitterMode.TARGET) {
            return;
        }
        
        this.updateExpansion(particle, false);
    }

    private generatePos(p2d: IEasyP2D, t: number, out?: {x: number, y: number}) {
        let outV = _tempVec2;

        let scale = calcValueOnCurve(this.scale, t);
        if(this.online) {
            if(this.emitMode ==  PathEmitMode.ByTime) {
                let p = this._bezierCurve.getPoint(t);
                outV.x = p.x * scale;
                outV.y = p.y * scale;
            }else{
                this.randomPosOnLine(outV);
                outV.x = _tempVec2.x * scale;
                outV.y = _tempVec2.y * scale;
            }
        }else{
            this.randomPosInPolygon(outV);
            outV.x = outV.x * scale;
            outV.y = outV.y * scale;            
        }
        
        out = out || _tempVec2;
        out.x = outV.x;
        out.y = outV.y;

        const psys = p2d.system;
        let p = getRangePos(psys, out);
        out.x = p.x;
        out.y = p.y;

        return out;
    }

    // 随机线上的点
    private randomPosOnLine(out: Vec2) {       
        let p = this._bezierCurve.getRandomPos();
        out.x = p.x;
        out.y = p.y;
        return out;
    }

    // 三角形剖分
    private triangulate() {
        this._triangleIndices.length = 0;
        if(this.poses.length < 3) {
            return;
        }

        // 采样
        this._samplePoints.length = 0;
        let len = this._bezierCurve.cacheTimes.length-1;
        for(let i = 0; i < len; i++) {
            let t = this._bezierCurve.cacheTimes[i];            
            let p = this._bezierCurve.getPoint(t).clone();
            this._samplePoints.push(p);
        }

        let indices = [];
        for(let i = 0; i < this._samplePoints.length; i++) {
            indices.push(i);
        }

        if(indices.length == 3) {
            this._triangleIndices.push(indices);
        }else{
            while(indices.length > 3) {
                let index = this.findEar(indices);
                if(index < 0) {
                    break;
                }

                let triangle = [indices[(index - 1 + indices.length) % indices.length], indices[index], indices[(index + 1) % indices.length]];
                this._triangleIndices.push(triangle);
                indices.splice(index, 1);
            }

            if(indices.length == 3) {
                this._triangleIndices.push(indices);
            }            
        }
    }

    // 寻找耳朵
    private findEar(indices: number[]) {
        for(let i = 0; i < indices.length; i++) {
            let s = this._samplePoints[indices[(i - 1 + indices.length) % indices.length]];
            let e = this._samplePoints[indices[i]];
            let n = this._samplePoints[indices[(i + 1) % indices.length]];

            if(this.isTriangle(s, e, n)) {
                let isEar = true;
                for(let j = 0; j < indices.length; j++) {
                    if(j == i || j == (i - 1 + indices.length) % indices.length || j == (i + 1) % indices.length) {
                        continue;
                    }

                    if(this.isPointInTriangle(this._samplePoints[indices[j]], s, e, n)) {
                        isEar = false;
                        break;
                    }
                }

                if(isEar) {
                    return i;
                }
            }
        }

        return -1;
    }

    // 判断点是否在三角形内
    private isPointInTriangle(p: Vec2, s: Vec2, e: Vec2, n: Vec2) {
        let a = e.x - s.x;
        let b = e.y - s.y;
        let c = n.x - s.x;
        let d = n.y - s.y;
        let e1 = p.x - s.x;
        let f = p.y - s.y;

        let det = a * d - b * c;
        if(det == 0) {
            return false;
        }

        let u = (d * e1 - b * f) / det;
        let v = (-c * e1 + a * f) / det;

        return u >= 0 && v >= 0 && u + v <= 1;
    }

    // 判断三个点是否构成三角形
    private isTriangle(s: Vec2, e: Vec2, n: Vec2) {
        let a = e.x - s.x;
        let b = e.y - s.y;
        let c = n.x - s.x;
        let d = n.y - s.y;
        return a * d - b * c > 0;
    }

    // 随机获取三角形内的点  
    private randomPosInPolygon(out: Vec2) {
        if(this._triangleIndices.length == 0) {
            return out;
        }

        let index = Math.floor(Math.random() * this._triangleIndices.length);
        let triangle = this._triangleIndices[index];
        let s = this._samplePoints[triangle[0]];
        let e = this._samplePoints[triangle[1]];
        let n = this._samplePoints[triangle[2]];

        let a = e.x - s.x;
        let b = e.y - s.y;
        let c = n.x - s.x;
        let d = n.y - s.y;

        let u = Math.random();
        let v = Math.random();

        if(u + v > 1) {
            u = 1 - u;
            v = 1 - v;
        }

        out.x = s.x + u * a + v * c;
        out.y = s.y + u * b + v * d;
        return out;
    }
}
const _tempVec2 = new Vec2();
const _flowDir = new Vec2();