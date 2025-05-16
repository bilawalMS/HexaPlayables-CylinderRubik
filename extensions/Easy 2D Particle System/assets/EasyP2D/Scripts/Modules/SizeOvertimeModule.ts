import { CurveRange, _decorator } from "cc";
import { calcValueOnCurve } from "../EasyP2DUtils";
import { Particle } from "../Particle";
const { property, ccclass } = _decorator;
import { EasyP2DModuleBase } from "./EasyP2DModuleBase";

@ccclass('SizeOvertimeModule')
export class SizeOvertimeModule extends EasyP2DModuleBase {
   @property({visible: function(){return this.enabled}})
   public isScale = true;

   /**
    * @en Size in pixels of each particle.
    * @zh 粒子的大小/scale。
    */
   @property({visible: function(){return this.enabled}})
   public size = new CurveRange();

   @property({visible: function(){return this.enabled}})
   public byIncrement = false;

   /**
    * @en Size in pixels of each particle.
    * @zh 粒子的大小的增长。
    */
   @property({visible: function(){return this.enabled && this.byIncrement}})
   public increment = new CurveRange();
   
   @property({visible: function(){return this.enabled}})
   public enableScaleX = false;

   /**
    * @en Size in pixels of each particle.
    * @zh 粒子的x缩放。
    */
   @property({visible: function(){return this.enabled && this.enableScaleX}})
   public scaleX = new CurveRange();

   @property({visible: function(){return this.enabled}})
   public enableScaleY = false;

   /**
    * @en Size in pixels of each particle.
    * @zh 粒子的y缩放。
    */
   @property({visible: function(){return this.enabled && this.enableScaleY}})
   public scaleY = new CurveRange();

   constructor() {
      super();

      this.enableOnUpdate = true;
      this.enableOnEmitter = true;
      this.scaleX.constant = 1;
      this.scaleY.constant = 1;
      this.size.constant = 10;
   }

   public onEmitter(particle: Particle, turnPrecenet: number): void {
      if(this.byIncrement) {
         particle._increment = calcValueOnCurve(this.increment, turnPrecenet);
      }
   }

   public onUpdate(particle: Particle, dt: number, livePrecent: number) {
      let sys = this._easyP2D.system;
      let changed = false;

      if(this.byIncrement) {
         particle.size += particle._increment * dt;
         changed = true;
      }else {
         const value = calcValueOnCurve(this.size, livePrecent);
         if(this.isScale) {
            particle.size = particle.startSize * value;
         }else{
            particle.size = value;
         }
         changed = true;
      }

      let scaleX = 1;
      let scaleY = 1;
      if(this.enableScaleX) {
         scaleX = calcValueOnCurve(this.scaleX, livePrecent);
         changed = true;
      }

      if(this.enableScaleY) {
         scaleY = calcValueOnCurve(this.scaleY, livePrecent);
         changed = true;
      }

      if(changed) {
         particle.halfWidth = particle.size * sys.halfwidth * scaleX;
         particle.halfHeight = particle.size * sys.halfheight * scaleY;
      }
   }
}