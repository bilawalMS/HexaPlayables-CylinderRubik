import { CurveRange, _decorator, math } from "cc";
import { DirectionType } from "../EasyP2DDefine";
import { calcValueOnCurve } from "../EasyP2DUtils";
import { Particle } from "../Particle";
const { property, ccclass } = _decorator;
import { EasyP2DModuleBase } from "./EasyP2DModuleBase";

@ccclass('AngleOvertimeModule')
export class AngleOvertimeModule extends EasyP2DModuleBase {
   /**
    * @en Angle over time of each particle.
    * @zh 粒子随时间的角度。
    */
   @property({visible: function(){return this.enabled && !this.byIncrement}})
   public angle = new CurveRange();

   @property({visible: function(){return this.enabled}})
   public byIncrement = false;

   /**
    * @en Delta Angle over time of each particle.
    * @zh 角度随时间的增长值。
    */
   @property({visible: function(){return this.enabled && this.byIncrement}})
   public increment = new CurveRange();

   @property({visible: function(){return this.enabled}})
   public scale = new CurveRange();

   constructor() {
      super();

      this.enableOnUpdate = true;
      this.enableOnEmitter = true;
      this.scale.constant = 1;
   }

   public onEmitter(particle: Particle, turnPrecenet: number): void {
      if(this.byIncrement) {
         particle._increment = math.toRadian(calcValueOnCurve(this.increment, turnPrecenet));
      }
   }

   public onUpdate(particle: Particle, dt: number, livePrecent: number) {
      let sys = this._easyP2D.system;
      if(sys.rotationType != DirectionType.None) {
         return;
      }
      
      if(this.byIncrement) {
         particle.rotation = particle.rotation + particle._increment * dt;
      }else{
         var value = math.toRadian(calcValueOnCurve(this.angle, livePrecent));
         particle.rotation = value;
      }

      particle.rotation *= calcValueOnCurve(this.scale, livePrecent);
   }
}