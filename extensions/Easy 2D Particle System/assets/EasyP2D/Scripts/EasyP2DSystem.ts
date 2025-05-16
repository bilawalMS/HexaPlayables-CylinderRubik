import { _decorator, CCInteger, Color, Enum, Node, SpriteFrame, Vec2, Vec3, Vec4, RealCurve, CurveRange, GradientRange, IVec2 } from 'cc';
import { EmitterMode, EmitterShape, ParticleGroup, PositionType, DirectionType, SpaceMode, VelocityType, AccelRelationDirection } from './EasyP2DDefine';
import { EDITOR, NATIVE, PREVIEW } from 'cc/env';
import { calcValueOnCurve, normalizeVec2 } from './EasyP2DUtils';
import { EasyP2DModuleBase } from './Modules/EasyP2DModuleBase';
import { ColorOvertimeModule } from './Modules/ColorOvertimeModule';
import { Particle } from './Particle';
import { SizeOvertimeModule } from './Modules/SizeOvertimeModule';
import { AnimationModule } from './Modules/AnimationModule';
import { AngleOvertimeModule } from './Modules/AngleOvertimeModule';
import { ImageEmitterModule } from './Modules/ImageEmitterModule';
import { PathEmitterModule } from './Modules/PathEmitterModule';
import { SystemAngleOvertimeModule } from './Modules/SystemAngleOvertimeModule';
import { SpeedOvertimeModule } from './Modules/SpeedOvertimeModule';
import { TimerModule } from './Modules/TimerModule';
import { IEasyP2D } from './interfaces';
import { PathOvertimeModule } from './Modules/PathOvertimeModule';
import { TrailModule } from './Modules/Trail/TrailModule';

const EDITOR_MODE = EDITOR && !PREVIEW && !NATIVE;
const { ccclass, property } = _decorator;
const _tempSize = {
    x:0,y:0
};
@ccclass('EasyP2DSystem')
export class EasyP2DSystem {
    public generatePos: (sys: EasyP2DSystem, turnPrecenet: number, out: {x: number, y: number}) => IVec2 = null;

    private _easyP2D: IEasyP2D = null;
    public get easyP2D() {
        return this._easyP2D;
    }

    public node: Node;
    private _modules: EasyP2DModuleBase[] = [];

    /**
         * @en SpriteFrame used for particles display
         * @zh 用于粒子呈现的 SpriteFrame
         */
    @property({ type: SpriteFrame })
    public get spriteFrame(): SpriteFrame | null {
        return this.renderFrame;
    }
    public set spriteFrame(value: SpriteFrame | null) {
        const lastSprite = this.renderFrame;
        if (lastSprite === value) {
            return;
        }
        this.renderFrame = value;

        if (!value || value._uuid) {
            this.renderFrame = value;
        }
        this._easyP2D.applySpriteFrame();

        if (EDITOR) {
            this.node.emit('spriteframe-changed', this);
        }
    }   

    public reset() {
        this.elapsed = 0;
        this.emitCounter = 0;     
        this.particleCount = 0;
        this.sleepTimer = 0;  
        this.willStop = false; 
        this.active = true;
        this.realDelay = this.delay;
        this.realDuration = this.duration;
        this.realEmitTurnDuration = this.emitTurnDuration;
        for(let i=0;i<this._modules.length;i++) {
            let module = this._modules[i];
            //@ts-ignore
            if(module._enabled) {
                module.onReset();
            }
        }
    }
    
    initial(p2d: any) {
        if(this._easyP2D) return;

        this._easyP2D = p2d;
        this.bindModules();
    }

    public registerModule(module: EasyP2DModuleBase) {
        module.bind(this._easyP2D);
        this._modules.push(module);
    }

    private bindModules() {
        if(EDITOR) {
            this._timer && this.registerModule(this._timer);
            this._colorOvertime && this.registerModule(this._colorOvertime);
            this._sizeOvertime && this.registerModule(this._sizeOvertime);
            this._speedOvertime && this.registerModule(this._speedOvertime);
            this._animation && this.registerModule(this._animation);
            this._angleOvertime && this.registerModule(this._angleOvertime);
            this._imageEmitter && this.registerModule(this._imageEmitter);
            this._pathEmitter && this.registerModule(this._pathEmitter);
            this._pathOvertime && this.registerModule(this._pathOvertime);
            this._sysAngleOvertime && this.registerModule(this._sysAngleOvertime);
            this._trail && this.registerModule(this._trail);
        }else{
            this._timer && this._timer.enabled && this.registerModule(this._timer);
            this._colorOvertime && this._colorOvertime.enabled && this.registerModule(this._colorOvertime);
            this._sizeOvertime && this._sizeOvertime.enabled && this.registerModule(this._sizeOvertime);
            this._speedOvertime && this._speedOvertime.enabled && this.registerModule(this._speedOvertime);
            this._animation && this._animation.enabled && this.registerModule(this._animation);
            this._angleOvertime && this._angleOvertime.enabled && this.registerModule(this._angleOvertime);
            this._imageEmitter && this._imageEmitter.enabled && this.registerModule(this._imageEmitter);
            this._pathEmitter && this._pathEmitter.enabled && this.registerModule(this._pathEmitter);
            this._pathOvertime && this._pathOvertime.enabled && this.registerModule(this._pathOvertime);
            this._sysAngleOvertime && this._sysAngleOvertime.enabled && this.registerModule(this._sysAngleOvertime);
            this._trail && this._trail.enabled && this.registerModule(this._trail);
        }
    }    

    public onEmitter(particle: Particle, t: number) {
        for(let i=0;i<this._modules.length;i++) {
            let module = this._modules[i];
            if(EDITOR) {
                if(module.enabled && module.enableOnEmitter)  {
                    module.onEmitter(particle, t);
                }
            }else{
                if(module.enableOnEmitter)  {
                    module.onEmitter(particle, t);
                }
            }
        }
    }

    public afterEmitter(particle: Particle, t: number) {
        for(let i=0;i<this._modules.length;i++) {
            let module = this._modules[i];
            if(EDITOR) {
                if(module.enabled && module.enableAfterEmitter)  {
                    module.afterEmitter(particle, t);
                }
            }else{
                if(module.enableAfterEmitter)  {
                    module.afterEmitter(particle, t);
                }
            }
        }
    }

    public onUpdate(particle: Particle, dt: number, t: number) {
        for(let i=0;i<this._modules.length;i++) {
            let module = this._modules[i];
            if(EDITOR) {
                if(module.enabled && module.enableOnUpdate)  {
                    module.onUpdate(particle, dt, t);
                }
            }else{
                if(module.enableOnUpdate)  {
                    module.onUpdate(particle, dt, t);
                }
            }
        }
    }

    public afterUpdate(particle: Particle, dt: number, t: number, oldPos: {x: number, y: number}) {
        for(let i=0;i<this._modules.length;i++) {
            let module = this._modules[i];
            if(EDITOR) {
                if(module.enabled && module.enableAfterUpdate)  {
                    module.afterUpdate(particle, dt, t, oldPos);
                }
            }else{
                if(module.enableAfterUpdate)  {
                    module.afterUpdate(particle, dt, t, oldPos);
                }
            }
        }
    }

    public onEnd(particle: Particle) {
        for(let i=0;i<this._modules.length;i++) {
            let module = this._modules[i];
            if(EDITOR) {
                if(module.enabled && module.enableOnEnd)  {
                    module.onEnd(particle);
                }
            }else{
                if(module.enableOnEnd)  {
                    module.onEnd(particle);
                }            
            }
        }
    }

    @property({ visible: true, displayOrder: 0 })
    private _anchor: Vec2 = new Vec2(0.5, 0.5);
    get anchor(): Vec2 {
        return this._anchor;
    }

    set anchor(value: Vec2) {
        this._anchor = value;        
    }

    /**
     * @en How many seconds the emitter will emit after it.
     * @zh 发射器发射延迟，大于0延迟发射。
     */
    @property({group: ParticleGroup.Life, visible: function() { return !this._timer || !this._timer.enabled;}})
    public delay = 0;
    /**
     * @en How many seconds the emitter wil run. -1 means 'forever'.
     * @zh 发射器生存时间，单位秒，-1表示持续发射。
     */
    @property({group: ParticleGroup.Life, visible: function() { return !this._timer || !this._timer.enabled;}})
    public duration = -1;

    /**
     * @en Emission rate of the particles.
     * @zh 每轮发射的粒子数目。
     */
    @property({type:CCInteger, group: ParticleGroup.Life})
    public emissionRate = 10;

    /**
     * @en Life of each particle setter.
     * @zh 每一轮发射的持续时间。
     * @default
     */
    @property({group: ParticleGroup.Life, visible: function() { return !this._timer || !this._timer.enabled;}})
    public emitTurnDuration = 1;

    /**
     * @en Maximum particles of the system.
     * @zh 粒子最大数量。
     */
    @property({type:CCInteger, group: ParticleGroup.Life})
    public get totalParticles() {
        return this._totalParticles;
    }

    public set totalParticles(value: number) {
        if (this._totalParticles === value) return;
        this._totalParticles = value;
    }
    
    /**
     * @en Life of each particle setter.
     * @zh 粒子的运行时间。
     */
    
    @property({group: ParticleGroup.Life})
    public startLifeTime = new CurveRange();

    @property({visible: false, serializable: true})
    private _timer: TimerModule = null;

    @property({group: ParticleGroup.Life, visible: true})
    public get timer() {
        if(EDITOR_MODE) {
            if(!this._timer) {
                this._timer = new TimerModule();
                this.registerModule(this._timer);
            }
        }
        return this._timer;
    }

    public get enableSwapTime() {
        return this._timer && this._timer.enbleTimeSwap;
    }

    public get awakeTime() {
        return this._timer && this._timer.awakeTime;
    }

    public get sleepTime() {
        return this._timer && this._timer.sleepTime;
    }

    // @property
    // public usePhys = false;

    /**
     * @en Preview particle system effect.
     * @ch 查看粒子效果
     */
    @property
    public get preview() {
        return this._preview;
    }

    public set preview(val: boolean) {
        if (val) { this._easyP2D.startPreview(); }
        this._preview = val;
    }

    /**
    * @en If set to true, the particle system will automatically start playing on onLoad.
    * @zh 如果设置为 true 运行时会自动发射粒子。
    */
    @property
    public playOnLoad = true;

    /**
     * @en Indicate whether the owner node will be auto-removed when it has no particles left.
     * @zh 粒子播放完毕后自动销毁所在的节点。
     */
    @property
    public autoRemoveOnFinish = false;
    
    // @property
    // public useCustom = false;

    public get changeColor() {
        // @ts-ignore
        return this._colorOvertime && this._colorOvertime._enabled;
    }
    
    /**
     * @en Start color of each particle.
     * @zh 粒子初始颜色。
     */
    @property({group: ParticleGroup.Color})
    public startColor = new GradientRange();    

    @property({group: ParticleGroup.Color, visible: false, serializable: true})
    private _colorOvertime: ColorOvertimeModule = null;

    @property({group: ParticleGroup.Color, visible: true})
    public get colorOvertime() {
        if(EDITOR_MODE) {
            if(!this._colorOvertime) {
                this._colorOvertime = new ColorOvertimeModule();
                this.registerModule(this._colorOvertime);
            }
        }
        return this._colorOvertime;
    }

    /**
     * @en Fire Angle of each particle setter.
     * @zh 发射角度。
     */
    @property({group: ParticleGroup.Angle, range: [-360, 360] })
    public fireAngle = new CurveRange();

    /**
     * @en Angle of each particle setter.
     * @zh 粒子自身角度。
     */
    @property({group: ParticleGroup.Angle,  range: [-360, 360] })
    public startAngle = new CurveRange();

    /**
     * @en Indicate whether the rotation of each particle equals to its direction. Only available in 'Gravity' mode.
     * @zh 每个粒子的旋转是否等于其方向。
     */
    @property({type: DirectionType, group: ParticleGroup.Angle, visible: function () { return this.emitterMode !== EmitterMode.NONE} })
    public rotationType = DirectionType.None;

    @property({visible: false, serializable: true})
    private _angleOvertime: AngleOvertimeModule = null;

    @property({group: ParticleGroup.Angle, visible: true})
    public get angleOvertime() {
        if(EDITOR_MODE) {
            if(!this._angleOvertime) {
                this._angleOvertime = new AngleOvertimeModule();
                this.registerModule(this._angleOvertime);
            }
        }
        return this._angleOvertime;
    }

    @property({visible: false, serializable: true})
    private _sysAngleOvertime: SystemAngleOvertimeModule = null;

    @property({group: ParticleGroup.Angle, visible: function() { return this.emitterMode !== EmitterMode.TARGET}})
    public get sysAngleOvertime() {
        if(EDITOR_MODE) {
            if(!this._sysAngleOvertime) {
                this._sysAngleOvertime = new SystemAngleOvertimeModule();
                this.registerModule(this._sysAngleOvertime);
            }
        }
        return this._sysAngleOvertime;
    }

    public get useSysAngleOvertime() {
        //@ts-ignore
        return this._sysAngleOvertime && this._sysAngleOvertime._enabled;
    }

    /**
     * @en Start size in pixels of each particle.
     * @zh 粒子的初始大小。
     */
    @property({group: ParticleGroup.Size})
    public startSize = new CurveRange();

    @property({group: ParticleGroup.Size})
    public startScaleX = new CurveRange();

    @property({group: ParticleGroup.Size})
    public startScaleY = new CurveRange();

    @property({visible: false, serializable: true})
    private _sizeOvertime: SizeOvertimeModule = null;
    /**
     * @en End size in pixels of each particle.
     * @zh 粒子随时间的大小。
     */
    @property({group: ParticleGroup.Size, visible: true })
    public get sizeOvertime() {
        if(EDITOR_MODE) {
            if(!this._sizeOvertime) {
                this._sizeOvertime = new SizeOvertimeModule();
                this._sizeOvertime.bind(this._easyP2D);
                this.registerModule(this._sizeOvertime);
            }
        }
        return this._sizeOvertime;
    }

    /**
     * @en Particles movement type.
     * @zh 粒子位置类型。
     */
    @property({group: ParticleGroup.Emitter, type: Enum(EmitterShape) })
    shapeMode = EmitterShape.BOX;
    /**
     * @en Source position of the emitter.
     * @zh 发射器位置。
     */
    @property({ group: ParticleGroup.Emitter})
    public sourcePos = Vec2.ZERO.clone();
    /**
     * @en Variation of source position.
     * @zh 发射器位置的变化范围。（横向和纵向）
     */
    @property({group: ParticleGroup.Emitter, visible: function () { return this.shapeMode !== EmitterShape.NONE }})
    public rangeSize = Vec2.ZERO.clone();

    /**
     * @en Particles movement type.
     * @zh 发射器位置的变化范围。（横向和纵向）
     */
    @property({group: ParticleGroup.Emitter, visible: function () { return this.shapeMode !== EmitterShape.NONE }})
    public innerRangeSize = Vec2.ZERO.clone();

    /**
     * @en Particles movement type.
     * @zh 粒子位置类型。
     */
    @property({group: ParticleGroup.Emitter, type: Enum(PositionType),  })
    public get positionType() {
        return this._positionType;
    }

    public set positionType(val) {
        this._positionType = val;
        this._easyP2D.updateParticle();
    }

    /**
     * @en Particles emitter modes.
     * @zh 发射器类型。
     */
    @property({ type: Enum(EmitterMode), group: ParticleGroup.Emitter })
    public emitterMode = EmitterMode.GRAVITY;

    /**
     * @en time rate to target point (valid only when emitterMode is EmitterMode.TARGET).
     * @zh 到目标点的时间占比（目标模式下生效）。
     */
    @property({ visible: function () { return this.emitterMode === EmitterMode.TARGET }, group: ParticleGroup.Emitter, slide: true, range: [0, 1]})
    public targetTimeRate = new CurveRange();
    
    /**
     * @en Gravity of the emitter.
     * @zh 重力。
     */
    @property({ visible: function () { return this.emitterMode === EmitterMode.GRAVITY }, group: ParticleGroup.Speed })
    public gravity = Vec2.ZERO.clone();

    /**
     * @en Speed of the emitter.
     * @zh 速度。
     */
    @property({ visible: function () { return this.emitterMode === EmitterMode.GRAVITY ||this.emitterMode === EmitterMode.TARGET }, group: ParticleGroup.Speed })
    public startSpeed = new CurveRange();

    @property({type:VelocityType, visible: function () { return this.emitterMode === EmitterMode.GRAVITY }, group: ParticleGroup.Speed })
    public velocityType = VelocityType.FireDirection;

    /**
     * @en Tangential acceleration of each particle. Only available in 'Gravity' mode.
     * @zh 每个粒子的切向加速度，即垂直于前进方向的加速度。
     */
    @property({ visible: function () { return this.emitterMode === EmitterMode.GRAVITY },  group: ParticleGroup.Speed})
    public tangentialAccel = new CurveRange();

    /**
     * @en Acceleration of each particle. Only available in 'Gravity' mode.
     * @zh 粒子径向加速度，即平行于前进方向的加速度。
     */
    @property({ visible: function () { return this.emitterMode === EmitterMode.GRAVITY }, group: ParticleGroup.Speed })
    public radialAccel = new CurveRange();  

    @property({type: AccelRelationDirection, visible: function () { return this.emitterMode === EmitterMode.GRAVITY }, group: ParticleGroup.Speed })
    public accelRelativeDir = AccelRelationDirection.FireDir;

    @property({visible: false, serializable: true})
    private _speedOvertime: SpeedOvertimeModule = null;
    /**
     * @en End size in pixels of each particle.
     * @zh 粒子速度随时间改变。
     */
    @property({group: ParticleGroup.Speed, visible: true })
    public get speedOvertime() {
        if(EDITOR_MODE) {
            if(!this._speedOvertime) {
                this._speedOvertime = new SpeedOvertimeModule();
                this._speedOvertime.bind(this._easyP2D);
                this.registerModule(this._speedOvertime);
            }
        }
        return this._speedOvertime;
    }

    @property({type:ImageEmitterModule,  visible: false, serializable: true})
    private _imageEmitter: ImageEmitterModule = null;

    @property({visible: true, group: ParticleGroup.Emitter})
    public get imageEmitter() {
        if(EDITOR_MODE) {
            if(!this._imageEmitter) {
                this._imageEmitter = new ImageEmitterModule();
                this.registerModule(this._imageEmitter);
            }
        }
        return this._imageEmitter;
    }

    @property({type:PathEmitterModule,  visible: false, serializable: true})
    private _pathEmitter: PathEmitterModule = null;

    @property({visible: true, group: ParticleGroup.Emitter})
    public get pathEmitter() {
        if(EDITOR_MODE) {
            if(!this._pathEmitter) {
                this._pathEmitter = new PathEmitterModule();
                this.registerModule(this._pathEmitter);
            }
        }
        return this._pathEmitter;
    }

    @property({visible: false, serializable: true})
    private _animation: AnimationModule = null;

    public get useAnimation() {
        return this._animation && this._animation.enabled;
    }

    @property({visible: true, group: ParticleGroup.Animation})
    public get animation() {
        if(EDITOR_MODE) {
            if(!this._animation) {
                this._animation = new AnimationModule();
                this.registerModule(this._animation);
            }
        }
        return this._animation;
    }

    @property({type: PathOvertimeModule, visible: false, serializable: true})
    private _pathOvertime: PathOvertimeModule = null;

    @property({visible: true, group: ParticleGroup.Animation})
    public get pathOvertime() {
        if(EDITOR_MODE) {
            if(!this._pathOvertime) {
                this._pathOvertime = new PathOvertimeModule();
                this.registerModule(this._pathOvertime);
            }
        }
        return this._pathOvertime;
    }

    @property({type: TrailModule, visible: false, serializable: true})
    private _trail: TrailModule = null;

    @property({visible: true, group: ParticleGroup.Trail})
    public get trail() {
        if(EDITOR_MODE) {
            if(!this._trail) {
                this._trail = new TrailModule();
                this.registerModule(this._trail);
            }
        }
        return this._trail;
    }

    public get trailEnabled() {
        //@ts-ignore
        return this._trail && this._trail._enabled;
    }

    /**
     * @en Play particle in edit mode.
     * @zh 在编辑器模式下预览粒子，启用后选中粒子时，粒子将自动播放。
     */
    @property({ visible: false }) _preview = true;
    @property({ visible: false }) renderFrame: SpriteFrame | null = null;
    @property({ visible: false })  _totalParticles = 150;
    @property({ visible: false }) _positionType = PositionType.FREE;

    /**
     * to-do support 98k 
     *
     */
    public usePhy = false;

    public active = true;
    public willStop = false;
    public particleCount = 0;
    public halfwidth =1;
    public halfheight =1 ;

    public elapsed = 0;
    public emitCounter = 0;
    public replaceUVs:number[]= [];
    public needReplaceUVs = false;
    public uv:number[]=[];
    public sleepTimer = 0;
    public awakeTimer = 0;
    public realDelay = 0;
    public realDuration = 0;
    public realEmitTurnDuration = 0;

    constructor() {
        this.startSize.constant = 100;
        this.startLifeTime.constant = 1;
        this.startSpeed.constant = 500;
        this.startAngle.constant = 0;
        this.startScaleX.constant = 1;
        this.startScaleY.constant = 1;
        this.targetTimeRate.constant = 1;
    }

    public _syncAspect() {
        if (this.renderFrame) {
            const frameRect = this.renderFrame.rect;
            const aspectRatio = frameRect.width / frameRect.height;
            let height = 1,width=1;
            if (aspectRatio > 1) {
                height = width / aspectRatio;
            } else {
                width = height * aspectRatio;
            }

            this.uv = this.renderFrame.uv;
            this.needReplaceUVs = false;
            this.halfheight = height/2;
            this.halfwidth = width/2;
            let tx = 1;
            let ty = 1;
            if(this.useAnimation){
                this._animation.updateUVs();
                tx = this._animation.tiles.x;
                ty = this._animation.tiles.y;
            }

            _tempSize.x=tx;
            _tempSize.y=ty;
            //resize
              
            normalizeVec2(_tempSize);
            const scale = 1 / Math.max(_tempSize.x, _tempSize.y);
            this.halfwidth *= _tempSize.y * scale;
            this.halfheight *= _tempSize.x * scale;
        }
    }
}