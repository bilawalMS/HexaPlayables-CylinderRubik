import { _decorator } from "cc";
import { Particle } from "../Particle";
import { IEasyP2D } from "../interfaces";
const { ccclass, property} = _decorator;

@ccclass('EasyP2DModuleBase')
export class EasyP2DModuleBase {
    protected _easyP2D: IEasyP2D = null;

    @property({serializable: true, visible: false})
    protected _enabled = false;

    @property({visible: true})
    public get enabled() {
        return this._enabled;
    }

    public set enabled(value: boolean) {
        if(this._enabled === value) return;
        this._enabled = value;

        if(value) {
            this.onEanble();
        }else{
            this.onDisable();
        }
    }

    public enableOnEmitter = false;
    public enableOnUpdate = false;
    public enableAfterEmitter = false;
    public enableAfterUpdate = false;
    public enableOnEnd = false;

    public bind(p2d: IEasyP2D) {
        this._easyP2D = p2d;
        this.onInit();
    }

    protected onInit() {
    }
    
    public onReset() {

    }

    protected onEanble() {

    }

    protected onDisable() {

    }

    public onEmitter(particle: Particle, turnPrecenet: number) {

    }

    public afterEmitter(particle: Particle, turnPrecenet: number) {
            
    }

    public onUpdate(particle: Particle, dt: number, livePrecent: number) {

    }

    public afterUpdate(particle: Particle, dt: number, livePrecent: number, oldPos: {x: number, y: number}) {

    }

    public onEnd(particle: Particle) {

    }
}