import { GradientRange, _decorator } from "cc";
import { calcColorOnCurve } from "../EasyP2DUtils";
import { Particle } from "../Particle";
const { property, ccclass } = _decorator;
import { EasyP2DModuleBase } from "./EasyP2DModuleBase";

@ccclass('ColorOverTimeModule')
export class ColorOvertimeModule extends EasyP2DModuleBase {    
    /**
     * @en Ending color of each particle.
     * @zh 粒子结束颜色。
     */
     @property({type:GradientRange, serializable: true, visible: function(){return this.enabled}})
     public color = new GradientRange();

     constructor() {
        super();

        this.enableOnUpdate = true;
     }

     public onUpdate(particle: Particle, dt: number, livePrecent: number): void {
        const color = calcColorOnCurve(this.color, livePrecent);
        particle.color[0] = color.x;
        particle.color[1] = color.y;
        particle.color[2] = color.z;
        particle.color[3] = color.w;
     }
}