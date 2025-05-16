import { CurveRange, _decorator, math, Vec2, sys } from "cc";
import { calcCos, calcSin, calcValueOnCurve } from "../EasyP2DUtils";
import { Particle } from "../Particle";
const { property, ccclass } = _decorator;
import { EasyP2DModuleBase } from "./EasyP2DModuleBase";
import { EmitterMode, SpaceMode } from "../EasyP2DDefine";

const _vec = new Vec2();
@ccclass('SystemAngleOvertimeModule')
export class SystemAngleOvertimeModule extends EasyP2DModuleBase {
   @property({visible: function(){return this.enabled && this.space != SpaceMode.World}, range: [-360, 360]})
   public angle = new CurveRange();

   @property({visible: false})
   private _increment = new CurveRange();
   /**
    * @en Delta Angle over time of each particle.
    * @zh 角度随时间的增长值。
    */
   @property({visible: function(){return this.enabled}})
   public get increment() {
         return this._increment;
   }

   public set increment(v) {
         this._increment = v;
   }

   @property({visible: function(){return this.enabled}})
   public scale = new CurveRange();   

   @property({visible: function(){return this.enabled && this.space != SpaceMode.World}})
   public byIncrement = false;

   @property({type:SpaceMode, visible: function(){return this.enabled}})
   public space: number = SpaceMode.Local;

   public cosRotation = 0;
   public sinRotation = 0;

   private _worldRotation = 0;
   
   constructor() {
      super();

      this.enableAfterUpdate = true;
      this.enableOnEmitter = true;
      this.scale.constant = 1;
   }

   public onReset(): void {
      this._worldRotation = 0;
   }

   public onEmitter(particle: Particle, turnPrecenet: number): void {
      particle.worldRotation = 0;
      
      const sys = this._easyP2D.system;
      if(sys.emitterMode == EmitterMode.TARGET) {
         return;
      }

      if(this.byIncrement) {
         particle._incrementValue = math.toRadian(calcValueOnCurve(this._increment, turnPrecenet));
      }
   }

   public afterUpdate(particle: Particle, dt: number, livePrecent: number, oldPos: {x: number, y: number}) {
      const sys = this._easyP2D.system;
      if(sys.emitterMode == EmitterMode.TARGET) {
         return;
      }

      if(this.space == SpaceMode.World) {
         if(this._easyP2D.simulator.stepIndex == 0) {
            let incrementValue = math.toRadian(calcValueOnCurve(this._increment, 0));
            this._worldRotation += incrementValue * dt;
            this._worldRotation %= Math.PI * 2;

            this.cosRotation = calcCos(this._worldRotation);
            this.sinRotation = calcSin(this._worldRotation);
         }
         
         _vec.x = particle.finalPos.x;
         _vec.y = particle.finalPos.y;
         particle.finalPos.x = _vec.x * this.cosRotation - _vec.y * this.sinRotation;
         particle.finalPos.y = _vec.x * this.sinRotation + _vec.y * this.cosRotation;
      }else{
         particle.worldRotation = particle.worldRotation || 0;
         if(this.byIncrement) {
            let scale = calcValueOnCurve(this.scale, livePrecent);    
            particle.worldRotation += particle._incrementValue * dt * scale;
            particle.worldRotation %= Math.PI * 2;
         }else{
            const value = calcValueOnCurve(this.angle, livePrecent);
            particle.worldRotation = math.toRadian(value);
            particle.worldRotation *= calcValueOnCurve(this.scale, livePrecent);   
         }  
   
         let cos = calcCos(particle.worldRotation);
         let sin = calcSin(particle.worldRotation);
         
         _vec.x = particle.finalPos.x;
         _vec.y = particle.finalPos.y;
         particle.finalPos.x = _vec.x * cos - _vec.y * sin;
         particle.finalPos.y = _vec.x * sin + _vec.y * cos;
      }
   }
}