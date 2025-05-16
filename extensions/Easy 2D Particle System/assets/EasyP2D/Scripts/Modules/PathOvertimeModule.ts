import { CCInteger, CurveRange, Vec2, _decorator } from "cc";
import { Particle } from "../Particle";
const { property, ccclass } = _decorator;
import { EasyP2DModuleBase } from "./EasyP2DModuleBase";
import { Curve, BezierPosition } from "./Curve";
import { calcValueOnCurve } from "../EasyP2DUtils";

@ccclass('PathOvertimeModule')
export class PathOvertimeModule extends EasyP2DModuleBase {
   @property({ type: [BezierPosition], visible: false })
   private _poses: BezierPosition[] = [];

   @property({ type: [BezierPosition], visible: function () { return this.enabled } })
   public get poses(): BezierPosition[] {
      return this._poses;
   }

   public set poses(value: BezierPosition[]) {
      if (this._poses === value) return;
      this._poses = value;
      if (this._poses) {
         this.onInit();
      }
   }

   @property({ type: CurveRange, visible: function () { return this.enabled && this.useTimeMode }, range: [0, 1, 0.01] })
   public targetTimeRate = new CurveRange();

   /**
     * @en Number of Circles the animation plays.
     * @zh 粒子播放的循环次数
     */
   @property({ type: CCInteger, min: 1, visible: function () { return this.enabled && this.useTimeMode } })
   public repeat = 1;

   @property({ visible: function () { return this.enabled } })
   public reverse = false;

   @property({type: CurveRange, visible: function(this: PathOvertimeModule) {return this.enabled && this.useTimeMode}})
   public scale = new CurveRange();   

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
    }

   // @property({ visible: function () { return this.enabled } })
   private useTimeMode = true;

   private _bezierCurve = new Curve();
   private _moveDistance = 0;
   private _lastPos = new Vec2();

   constructor() {
      super();

      this.targetTimeRate.constant = 1;
      this.scale.constant = 1;
      this.enableOnUpdate = true;
      this.enableAfterEmitter = true;
   }

   protected onInit(): void {
      this._bezierCurve.reset(this.poses);
   }

   public afterEmitter(particle: Particle, turnPrecenet: number): void {
      if (this._bezierCurve.points.length < 2) {
         return;
      }

      particle._targetTimeRate = calcValueOnCurve(this.targetTimeRate, turnPrecenet)

      const pos0 = particle.fromPos;
      const pos1 = this._bezierCurve.getPoint(0);
      if(!pos1 || !pos0) return;

      if (!particle._path_offset) {
         particle._path_offset = new Vec2();
      }
      particle._path_offset.set(pos0.x - pos1.x, pos0.y - pos1.y);

      particle.preventDefaultSetPos = true;

      if(!this.useTimeMode) {
         this._moveDistance = 0;
         this._lastPos.set(pos0.x, pos0.y);
      }
   }

   public onUpdate(particle: Particle, dt: number, livePrecent: number) {
      if (this._bezierCurve.points.length < 2) {
         return;
      }      

      if(!this.useTimeMode) {
         let pos = particle.pos;
         _tempVec2.set(pos.x, pos.y);
         this._moveDistance += Vec2.distance(_tempVec2, this._lastPos);
         this._lastPos.set(pos.x, pos.y);
         if(this._moveDistance > this._bezierCurve.totalDistance) {
            this._moveDistance %= this._bezierCurve.totalDistance;
         }
         let t = this._bezierCurve.getTimeByDistance(this._moveDistance);
         let tangent = this._bezierCurve.getTangent(t, this.reverse, dt);
         particle.dir.x = tangent.x;
         particle.dir.y = tangent.y;

         particle.preventDefaultSetDir = true;
      }else{
         const scale = calcValueOnCurve(this.scale, livePrecent);

         let t = particle._targetTimeRate <= 0 ? 1 : livePrecent / particle._targetTimeRate;
         if (this.reverse) {
            t = 1 - t;
         }
   
         if (this.repeat > 0) {
            t = (t * this.repeat) % 1;
         }
   
         const pos = this._bezierCurve.getPoint(t);
         if(!pos || !particle._path_offset) return;
   
         particle.pos.x = (pos.x + particle._path_offset.x) * scale;
         particle.pos.y = (pos.y + particle._path_offset.y) * scale;
   
         particle.preventDefaultSetPos = true;
      }
   }
}

const _tempVec2 = new Vec2();