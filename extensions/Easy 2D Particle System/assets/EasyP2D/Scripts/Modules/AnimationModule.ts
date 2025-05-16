import { CCInteger, CurveRange, Vec2, _decorator } from "cc";
import { calcValueOnCurve } from "../EasyP2DUtils";
import { Particle } from "../Particle";
const { property, ccclass } = _decorator;
import { EasyP2DModuleBase } from "./EasyP2DModuleBase";

@ccclass('AnimationModule')
export class AnimationModule extends EasyP2DModuleBase {   
   /**
     * @en Number of Circles the animation plays.
     * @zh 粒子播放的循环次数
     */
   @property({ type: CCInteger, min: 1 })
   public repeat = 1;

   @property({ step: 1, visible: false })
   private _tiles = new Vec2(1, 1);

   @property({ step: 1 })
   public get tiles() {
      return this._tiles;
   }

   public set tiles(value) {
      this._tiles = value;
      this.reset();
   }

   @property({ type: CCInteger, min: 0 })
   public frameNum = 0;

   @property({ min: 0 })
   public startFrame = new CurveRange();

   private _realFrameNum = 0;
   private _totalFrameNum = 0;

   constructor() {
      super();

      this.enableOnUpdate = true;
      this.enableOnEmitter = true;
   }

   private reset() {
      this._easyP2D.system._syncAspect();
   }

   public updateUVs() {
      let sys = this._easyP2D.system;
      sys.needReplaceUVs = true;
      // lb, rb, lt, rt
      const uv = sys.uv;
      var uvs = sys.replaceUVs;
      
      uvs[0] = Math.min(uv[0], uv[6]);           // u1
      uvs[1] = Math.abs(uv[0] - uv[6]);         // u1length
      uvs[2] = Math.min(uv[4], uv[2]);           // u2
      uvs[3] = Math.abs(uv[4] - uv[2]);         // u2length
      uvs[4] = Math.min(uv[1], uv[7]);           // v1
      uvs[5] = Math.abs(uv[1] - uv[7]);         // v1length
      uvs[6] = Math.min(uv[3], uv[5]);           // v2
      uvs[7] = Math.abs(uv[3] - uv[5]);         // v2length
      //t for tiled
      uvs[8] = (uv[0] <= uv[6] ? 0 : 1);         // t0
      uvs[9] = (uv[1] <= uv[7] ? 0 : 1);         // t1
      uvs[10] = (uv[2] <= uv[4] ? 0 : 1);         // t2
      uvs[11] = (uv[3] <= uv[5] ? 0 : 1);         // t3
      uvs[12] = (uv[2] > uv[4] ? 0 : 1);          // t4
      uvs[13] = (uv[3] > uv[5] ? 0 : 1);          // t5
      uvs[14] = (uv[0] > uv[6] ? 0 : 1);          // t6
      uvs[15] = (uv[1] > uv[7] ? 0 : 1);          // t7
   }

   public onEmitter(particle: Particle, turnPrecenet: number): void {
      let sys = this._easyP2D.system;
      if(!sys.spriteFrame) {
         return;
      }

      const tiles = this.tiles;
      this._totalFrameNum = tiles.x * tiles.y;
      this._realFrameNum = this.frameNum > 0 ? Math.min(this.frameNum, this._totalFrameNum) : this._totalFrameNum;
      if (sys.spriteFrame.rotated) {
          particle.tiles.x = tiles.y;
          particle.tiles.y = tiles.x;
      } else {
          particle.tiles.x = tiles.x;
          particle.tiles.y = tiles.y;
      }

      particle.startFrame = Math.round(calcValueOnCurve(this.startFrame, turnPrecenet));
      particle.currentFrame = -1;
   }

   public onUpdate(particle: Particle, dt: number, livePrecent: number) {      
      const frame = Math.floor(this._realFrameNum * this.repeat * (1 - particle.timeToLive / particle.totalTime) + particle.startFrame) % this._totalFrameNum;
      if (frame !== particle.currentFrame) {
         particle.currentFrame = frame;
         particle.frameIsDirty = true;
      }
   }
}