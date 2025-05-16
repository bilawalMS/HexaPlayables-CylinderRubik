import { CurveRange, _decorator } from "cc";
import { calcValueOnCurve } from "../EasyP2DUtils";
import { Particle } from "../Particle";
const { property, ccclass } = _decorator;
import { EasyP2DModuleBase } from "./EasyP2DModuleBase";

@ccclass('SpeedOvertimeModule')
export class SpeedOvertimeModule extends EasyP2DModuleBase {
   /**
    * @en Angle over time of each particle.
    * @zh 粒子随时间的速度。
    */
   @property({visible: function(){return this.enabled && !this.byIncrement}})
   public speed = new CurveRange();

   @property({visible: function(){return this.enabled}})
   public isScale = true;

   @property({visible: function(){return this.enabled}})
   public byIncrement = false;

   /**
    * @en Delta Angle over time of each particle.
    * @zh 速度随时间的增长值。
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
         particle._increment = calcValueOnCurve(this.increment, turnPrecenet);
      }
   }

   public onUpdate(particle: Particle, dt: number, livePrecent: number) {      
      if(this.byIncrement) {
         particle.speed = particle.speed + particle._increment * dt;
      }else{
         const value = calcValueOnCurve(this.speed, livePrecent);
         if(this.isScale) {
            particle.speed = value * particle.startSpeed;
         }else{
            particle.speed = value;
         }
      }

      particle.speed *= calcValueOnCurve(this.scale, livePrecent);

      particle.preventDefaultSetSpeed = true;
   }
}