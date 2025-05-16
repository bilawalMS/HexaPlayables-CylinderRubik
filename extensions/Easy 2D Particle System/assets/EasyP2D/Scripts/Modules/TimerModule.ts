import { CurveRange, _decorator } from "cc";
import { calcValueOnCurve } from "../EasyP2DUtils";
import { Particle } from "../Particle";
const { property, ccclass } = _decorator;
import { EasyP2DModuleBase } from "./EasyP2DModuleBase";

@ccclass('TimerModule')
export class TimerModule extends EasyP2DModuleBase {
   @property({visible: function(){return this.enabled}})
   public delay = new CurveRange();

   @property({visible: function(){return this.enabled}})
   public timeOffset = new CurveRange();

   @property({visible: function(){return this.enabled}})
   public duration = new CurveRange();

   @property({visible: function(){return this.enabled}})
   public emitTurnDuration = new CurveRange();

   @property({visible: function(){return this.enabled}})
   public updateSwapTimeOnEmit = false;
   /**
    * @en every x seconds will sleep.
    * @zh 激活时间
    */
   public awakeTime = 0;

   @property({visible: function(){return this.enabled}}) 
   private _enbleTimeSwap = false;

   public get enbleTimeSwap() {
      return this._enabled && this._enbleTimeSwap;
   }
   
   @property({visible: function(){return this.enbleTimeSwap}})
   public turnAwakeTime = new CurveRange();

   /**
    * @en every x seconds will awake.
    * @zh 休眠时间。
    */
   public sleepTime = 0;
    
   @property({visible: function(){return this.enbleTimeSwap}})
   public turnSleepTime = new CurveRange();

   constructor() {
      super();

      this.enableOnUpdate = true;
      this.delay.constant = 0;
      this.duration.constant = 1;
      this.emitTurnDuration.constant = 1;
   }

   public onReset(): void {
      const sys = this._easyP2D.system;
      const dt = calcValueOnCurve(this.timeOffset, 0);
      if(dt > 0) {
         this._easyP2D.simulator.warm(dt);
      }
      sys.realDelay = calcValueOnCurve(this.delay, 0);
      sys.realDuration = calcValueOnCurve(this.duration, 0);
      sys.realEmitTurnDuration = calcValueOnCurve(this.emitTurnDuration, 0);
      this.updateTime();
   }

   private updateTime() {
      if(this._enabled) {
         if(this.updateSwapTimeOnEmit) {
            this.awakeTime = calcValueOnCurve(this.turnAwakeTime, 0);
            this.sleepTime = calcValueOnCurve(this.turnSleepTime, 0);
         }       
      }else{
         this.awakeTime = 0;
         this.sleepTime = 0;
      }
   }
   
   public onUpdate(particle: Particle, dt: number, livePrecent: number) {
      if(!this.updateSwapTimeOnEmit) {
         return;
      }

      this.updateTime();
   }
}