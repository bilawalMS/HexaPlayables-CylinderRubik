import { Color, CurveRange, Enum, GradientRange, IVec2Like, IVec3Like, Pool, SpriteFrame, UIRenderer, Vec2, Vec3, math } from "cc";
import { calcColorOnCurve, calcValueOnCurve } from "../../EasyP2DUtils";

export const TrailMode = Enum({
    /**
     * @en Trail Mode:TRAIL
     * @zh 拖尾模式:拖尾
     */
    TRAIL: 0,
    /**
     * @en Trail Mode:PARTICLE
     * @zh 拖尾模式:粒子
     */
    PARTICLE: 1,
});

class TrailNode {
    public pos: Vec3 = new Vec3();
    public lastPos: Vec3 = new Vec3();
    public verticles: Vec3[] = [new Vec3(), new Vec3(), new Vec3(), new Vec3()];
    public uvs: Vec2[] = [new Vec2(), new Vec2(), new Vec2(), new Vec2()];
    public colors: Color[] = [new Color(), new Color(), new Color(), new Color()];
    public time: number = 0;
    public distance: number = 0;
}

const colorPool = new Pool(() => new Color(), 32);
const vec2Pool = new Pool(() => new Vec2(), 32);
const vec3Pool = new Pool(() => new Vec3(), 32);
const trailNodePool = new Pool(() => new TrailNode(), 32);

const DEFAULT_UVS = [0, 1, 1, 1, 0, 0, 1, 0];

export const TRAIL_INDICES = [0, 1, 2, 1, 3, 2];

function signedAngle(a: Vec3, b: Vec3) {
    let angle = Vec3.angle(a, b) * 180 / Math.PI;
    let v = vec3Pool.alloc();
    let sign = Vec3.cross(v, a, b).z > 0 ? 1 : -1;
    vec3Pool.free(v);
    return angle * sign;
}

function signValue(a: number) {
    return a >= 0.00001 ? 1 : -1;
}

export class TrailCreator {
    public normal = new Vec3(0, 0, 1);
    public minLength: number = 0.1;
    public colorGradient: GradientRange = new GradientRange();
    public widthCurve: CurveRange = new CurveRange();
    public particleAliveTime: number = 0.2;
    public spriteFrame: SpriteFrame = null;
    public maxParticleCount: number = 6;
    public useVerticalUVLayout = true;
    public uv: number[] = null;
    public sizeScale = 1;
    public tintColor = new Color(255, 255, 255, 255);

    private _particles: TrailNode[] = [];
    private _segmentSqrLen = 0;
    private _lastCount: number = 0;
    private _isConstWidth = true;
    private _recycleSpeed = 0.1;
    private _totalDistance = 0;
    private _lastMoveTime = -1;

    private _vertices: Vec2[] = [];
    private _uvs: Vec2[] = [];
    private _colors: Color[] = [];

    public get particleCount() {
        return this.particles.length;
    }

    public get vertexCount() {
        return this.particles.length * 4;
    }    

    public get particles() {
        return this._particles;
    }

    private clear() {
        for(let i = 0; i < this._particles.length; i++) {
            trailNodePool.free(this._particles[i]);
        }
        this._particles.length = 0;

        for(let i = 0; i < this._vertices.length; i++) {
            vec2Pool.free(this._vertices[i]);
        }
        this._vertices.length = 0;

        for(let i = 0; i < this._uvs.length; i++) {
            vec2Pool.free(this._uvs[i]);
        }
        this._uvs.length = 0;

        for(let i = 0; i < this._colors.length; i++) {
            colorPool.free(this._colors[i]);
        }
        this._colors.length = 0;        
    }

    private updateColors() {
        let vcount = this.particles.length;
        for (let i = 0; i < vcount; i++) {
            let t = i / (vcount + 1);
            let color = calcColorOnCurve(this.colorGradient, t);
            let c = colorPool.alloc();
            c.set(color);
            c.multiply(this.tintColor);
            let p = this._particles[i];

            if(i == 0) {            
                p.colors[0].set(c);
                p.colors[1].set(c);

                t = (i + 1) / (vcount + 1);
                c = calcColorOnCurve(this.colorGradient, t);
                p.colors[2].set(c);
                p.colors[3].set(c);
            }else{
                let preNode = this._particles[i - 1];
                p.colors[0].set(preNode.colors[2]);
                p.colors[1].set(preNode.colors[3]);

                p.colors[2].set(c);
                p.colors[3].set(c);            
            }
        }
    }

    private updateUVs() {
        let uvs = this.uv;
        if(!uvs) {
            if(this.spriteFrame) {
                uvs = this.spriteFrame.uv;
            }

            if(!uvs) {
                uvs = DEFAULT_UVS;
            }
        }
        
        let sx = uvs[0];
        let sy = uvs[5];
        let ex = uvs[2];
        let ey = uvs[3];

        let roated = this.spriteFrame && this.spriteFrame.rotated;
        if(roated) {
            sx = uvs[0];
            sy = uvs[1];
            ex = uvs[4];
            ey = uvs[3];
        }        

        let vcount = this._particles.length;

        if(this.useVerticalUVLayout && !roated) {
            let dv = vcount > 1 ? (ey - sy) / (vcount - 1) : ey - sy;
            for(let i = 0; i < vcount; i++) {
                let p = this._particles[i];
                let v = sy + dv * i;                
                if(i == 0) {
                    p.uvs[0].set(sx, v);
                    p.uvs[1].set(ex, v);
                }else{
                    let preNode = this._particles[i - 1];
                    p.uvs[0].set(preNode.uvs[2]);
                    p.uvs[1].set(preNode.uvs[3]);                
                }

                v = sy + dv * (i + 1);
                p.uvs[2].set(sx, v);
                p.uvs[3].set(ex, v);
            }
        }else{        
            let du = vcount > 1 ? (ex - sx) / (vcount - 1) : ex - sx;
            for(let i = 0; i < vcount; i++) {
                let p = this._particles[i];
                let u = sx + du * i;                
                if(i == 0) {
                    p.uvs[0].set(u, sy);
                    p.uvs[1].set(u, ey);
                }else{
                    let preNode = this._particles[i - 1];
                    p.uvs[0].set(preNode.uvs[2]);
                    p.uvs[1].set(preNode.uvs[3]);                
                }

                u = sx + du * (i + 1);
                p.uvs[2].set(u, sy);
                p.uvs[3].set(u, ey);
            }
        }
    }

    public reset() {
        this.clear();
        this._recycleSpeed = this.minLength / this.particleAliveTime;
        this._segmentSqrLen = this.minLength * this.minLength;
        this._isConstWidth = this.widthCurve.mode === CurveRange.Mode.Constant;
        this.sizeScale = 1;
        this.tintColor.set(255, 255, 255, 255);
    }

    private updateParticle(dt: number) {
        if(this._particles.length == 0) return;

        let tail = this._particles[this._particles.length - 1];
        tail.time += dt;

        let offset = vec3Pool.alloc();        
        
        let canUpdate = tail.time >= 0.1 && (this._particles.length == 1 && this._lastMoveTime >= this.particleAliveTime || this._particles.length > 1);

        offset.set(tail.pos.x - tail.lastPos.x, tail.pos.y - tail.lastPos.y);
        let sqrDist = offset.lengthSqr();
        if(sqrDist > 0.01 && canUpdate) {            
            let len = Math.min(this._recycleSpeed * dt, Math.sqrt(sqrDist));
            offset.normalize();            
            let pos = vec3Pool.alloc().set(tail.lastPos).add(offset.multiplyScalar(len));            
            tail.lastPos.set(pos);
            vec3Pool.free(pos);

            sqrDist = len * len;
        }

        if(sqrDist <= this.minLength && tail.time >= this.particleAliveTime) {
            let p = this._particles.pop();
            trailNodePool.free(p);
        }
        
        vec3Pool.free(offset);
    }

    private updateVertices(idx: number) {
        if(this._particles.length == 0) return;

        if(this._particles.length == 1) {
            let tail = this._particles[idx];
            let dir = vec3Pool.alloc().set(tail.pos.x - tail.lastPos.x, tail.pos.y - tail.lastPos.y, 0).normalize();
            let diff = vec3Pool.alloc();
            Vec3.cross(diff, dir, this.normal);
            let width = calcValueOnCurve(this.widthCurve, 0) * this.sizeScale;
            let halfWidth = width * 0.5;
            diff.multiplyScalar(halfWidth);
    
            let x0 = tail.pos.x + diff.x;
            let y0 = tail.pos.y + diff.y;
            let x1 = tail.pos.x - diff.x;
            let y1 = tail.pos.y - diff.y;
    
            let x2 = tail.lastPos.x + diff.x;
            let y2 = tail.lastPos.y + diff.y;
            let x3 = tail.lastPos.x - diff.x;
            let y3 = tail.lastPos.y - diff.y;

            tail.verticles[0].set(x0, y0);
            tail.verticles[1].set(x1, y1);
            tail.verticles[2].set(x2, y2);
            tail.verticles[3].set(x3, y3);

            vec3Pool.free(dir);
            vec3Pool.free(diff);
        }else{
            let node0 = this._particles[idx];

            let t = idx / (this._particles.length - 1);
            let width = calcValueOnCurve(this.widthCurve, t) * this.sizeScale;
            let halfWidth = width * 0.5;

            if(idx == 0) {
                let node2 = this._particles[idx + 1];

                let diff = vec3Pool.alloc();                
                let dir0 = vec3Pool.alloc().set(node0.pos.x - node0.lastPos.x, node0.pos.y - node0.lastPos.y, 0).normalize();
                let dir1 = vec3Pool.alloc().set(node2.pos.x - node2.lastPos.x, node2.pos.y - node2.lastPos.y, 0).normalize();
                let crs = Vec3.cross(vec3Pool.alloc(), dir1, dir0);
                let sign = signValue(crs.z);

                // 平行
                if(math.equals(crs.z, 0)) {
                    Vec3.cross(diff, dir0, this.normal);
                }else{
                    diff.set(dir1).subtract(dir0).normalize().multiplyScalar(sign);
                }
                diff.normalize().multiplyScalar(halfWidth);

                let x0 = node0.pos.x + diff.x;
                let y0 = node0.pos.y + diff.y;
                let x1 = node0.pos.x - diff.x;
                let y1 = node0.pos.y - diff.y;

                let x2 = node0.lastPos.x + diff.x;
                let y2 = node0.lastPos.y + diff.y;
                let x3 = node0.lastPos.x - diff.x;
                let y3 = node0.lastPos.y - diff.y;

                node0.verticles[0].set(x0, y0);
                node0.verticles[1].set(x1, y1);
                node0.verticles[2].set(x2, y2);
                node0.verticles[3].set(x3, y3);

                vec3Pool.free(diff);
                vec3Pool.free(dir0);
                vec3Pool.free(dir1);
                vec3Pool.free(crs);
            }else{
                let node1 = this._particles[idx - 1];

                let dir0 = vec3Pool.alloc().set(node0.pos.x - node0.lastPos.x, node0.pos.y - node0.lastPos.y, 0).normalize();
                let dir1 = vec3Pool.alloc().set(node1.pos.x - node1.lastPos.x, node1.pos.y - node1.lastPos.y, 0).normalize();
                let diff = vec3Pool.alloc();
                let crs = Vec3.cross(vec3Pool.alloc(), dir0, dir1);
                let sign = signValue(crs.z);
                // 平行
                if(math.equals(crs.z, 0)) {
                    Vec3.cross(diff, dir0, this.normal);
                }else{
                    // 有夹角
                    diff.set(dir0).subtract(dir1).normalize().multiplyScalar(sign);
                }
                diff.multiplyScalar(halfWidth);

                let x0 = node0.pos.x + diff.x;
                let y0 = node0.pos.y + diff.y;
                let x1 = node0.pos.x - diff.x;
                let y1 = node0.pos.y - diff.y;

                let x2 = node0.lastPos.x + diff.x;
                let y2 = node0.lastPos.y + diff.y;
                let x3 = node0.lastPos.x - diff.x;
                let y3 = node0.lastPos.y - diff.y;                

                node0.verticles[0].set(x0, y0);
                node0.verticles[1].set(x1, y1);
                // 更新上一个节点的顶点
                node1.verticles[2].set(x0, y0);
                node1.verticles[3].set(x1, y1);

                node0.verticles[2].set(x2, y2);
                node0.verticles[3].set(x3, y3);    
                
                vec3Pool.free(diff);
                vec3Pool.free(dir0);
                vec3Pool.free(dir1);
                vec3Pool.free(crs);
            }
        }
    }

    public updatePos(dt: number, curPos: IVec3Like|IVec2Like) {
        let changed = false;
        let isNew = false;
        if(this._particles.length == 0) { 
            let node = trailNodePool.alloc();
            node.time = 0;
            node.pos.set(curPos.x, curPos.y, 0);
            node.lastPos.set(curPos.x, curPos.y, 0);
            this._particles.push(node);
            isNew = true;
        }else {
            let node = this._particles[0];
            node.pos.set(curPos.x, curPos.y, 0);
            changed = true;
        }

        let node0 = this._particles[0];
        // 移动距离
        let move = vec3Pool.alloc().set(node0.pos).subtract(node0.lastPos);
        let sqrDist = move.lengthSqr();

        if(!isNew && sqrDist > 0.01) {
            if(sqrDist >= this._segmentSqrLen) {
                if(this._particles.length < this.maxParticleCount) {
                    // 超过最小长度，添加新节点
                    this.addParticle(curPos);
                }else{
                    // 超过最大节点数，移除最后一个节点
                    let node = this._particles.pop();
                    trailNodePool.free(node);                
                }
            }
            changed = true;

            this._lastMoveTime = 0;
        }

        this._lastCount = this._particles.length;
        if(changed) {
            this.updateParticle(dt);
            this.updateColors();
            this.updateUVs();
            for(let i = 0; i < this._particles.length; i++) {
                this.updateVertices(i);
            }
        }else if(this.uv) {
            this.updateUVs();
        }

        this._lastMoveTime += dt;
        vec3Pool.free(move);
    }

    private addParticle(pos: IVec3Like|IVec2Like) {
        let node0 = this._particles.shift();

        let node = trailNodePool.alloc();
        node.time = 0;
        node.pos.set(node0.pos);
        node.lastPos.set(node0.lastPos);
        this._particles.unshift(node);        

        node0.pos.set(pos.x, pos.y, 0);
        node0.lastPos.set(pos.x, pos.y, 0);
        node0.time = 0;
        this._particles.unshift(node0);
    }
}