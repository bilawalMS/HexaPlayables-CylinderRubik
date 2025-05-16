import { CCInteger, CurveRange, GradientRange, Pool, SpriteFrame, Vec2, Vec3, _decorator } from "cc";
import { EasyP2DModuleBase } from "../EasyP2DModuleBase";
import { TrailCreator } from "./TrailCreator";
import { Particle } from "../../Particle";
import { SpaceMode } from '../../EasyP2DDefine';
import { calcValueOnCurve } from "../../EasyP2DUtils";
const { property, ccclass } = _decorator;

const trailPool: Pool<TrailCreator> = new Pool(() => new TrailCreator(), 10);
const _tempVec2 = new Vec2();
const _tempVec3 = new Vec3();

@ccclass('TrailModule')
export class TrailModule extends EasyP2DModuleBase {
    @property({type: CCInteger, visible: function(){return this.enabled}})
    public maxParticleCount = 6;

    @property({visible: function(){return this.enabled}})
    public minLength = 2;

    @property({type: GradientRange, visible: function(){return this.enabled}})
    public colorGradient: GradientRange = new GradientRange();

    @property({type: CurveRange, visible: function(){return this.enabled}})
    public widthCurve: CurveRange = new CurveRange();

    @property({type: SpriteFrame, visible: function(){return this.enabled && !this.useParticleSpriteFrame}})
    public renderFrame: SpriteFrame = null;

    @property({visible: function(){return this.enabled}})
    public particleAliveTime = 0.2; 

    @property({visible: function(){return this.enabled}})
    public showMainParticle = true;

    @property({visible: function(){return this.enabled}})
    public useVerticalUVLayout = true;

    @property({visible: function(){return this.enabled}})
    public useParticleSpriteFrame = false;

    @property({visible: function(){return this.enabled}})
    public useParticleColor = false;

    @property({visible: function(){return this.enabled}})
    public useParticleSize = false;

    private _startSize = 0;
    constructor() {
        super();
  
        this.widthCurve.constant = 10;
        this.enableAfterEmitter = true;
        this.enableAfterUpdate = true;
        this.enableOnEnd = true;
     }
    
    public getParticleCount(particle: Particle): number {
        if(!particle.trail) return 0;

        return (particle.trail as TrailCreator).particleCount;
    }

    public afterEmitter(particle: Particle, turnPrecenet: number): void {
        let trail = particle.trail = trailPool.alloc() as TrailCreator;
        if(!trail) return;

        const sys = particle.sys;
        trail.minLength = this.minLength;
        trail.colorGradient = this.colorGradient;
        trail.widthCurve = this.widthCurve;
        trail.particleAliveTime = this.particleAliveTime;
        trail.useVerticalUVLayout = this.useVerticalUVLayout;
        trail.reset();
        this._startSize = particle.size || calcValueOnCurve(sys.startSize, 0) || 1;
        if(this.useParticleSpriteFrame) {
            trail.spriteFrame = particle.sys.spriteFrame;
        }else{
            trail.spriteFrame = this.renderFrame;
        }
        trail.maxParticleCount = this.maxParticleCount;
    }

    public afterUpdate(particle: Particle, dt: number, livePrecent: number, oldPos: { x: number; y: number; }): void {
        const trail = particle.trail as TrailCreator;
        if(!trail) return;

        const sys = particle.sys;    
        if(this.useParticleSpriteFrame) {        
            trail.uv = particle.uv;
        }else{
            trail.uv = null;
        }

        let cos = 0;
        let sin = 0;
        let useSysAngleOvertime = sys.useSysAngleOvertime && sys.sysAngleOvertime.space == SpaceMode.World;
        if(useSysAngleOvertime) {
            cos = sys.sysAngleOvertime.cosRotation;
            sin = sys.sysAngleOvertime.sinRotation;
        }

        // update particle size
        if(this.useParticleSize) {
            trail.sizeScale = particle.size / this._startSize;
        }

        // update particle color
        if(this.useParticleColor) {
            trail.tintColor.set(particle.color[0] * 255, particle.color[1] * 255, particle.color[2] * 255, particle.color[3] * 255);
        }

        let x = particle.finalPos.x;
        let y = particle.finalPos.y;        
        // this._easyP2D.node.getWorldPosition(_tempVec3);
        // x = x + _tempVec3.x;
        // y = y + _tempVec3.y;
        _tempVec2.set(x, y);
        trail.updatePos(dt, _tempVec2);
    }

    public onEnd(particle: Particle): void {
        trailPool.free(particle.trail as TrailCreator);
        particle.trail = null;
    }
}