import { _decorator, Component, Node, MeshRenderer, Material, CCInteger, tween, Color, Quat, v3, Vec3 } from 'cc';
import { Utils } from './Utils';
import { SoundManager } from './SoundManager';
import { log } from 'cc';

const { ccclass, property } = _decorator;

@ccclass('Hex')
export class Hex extends Component {

    @property(MeshRenderer)
    meshRenderer: MeshRenderer = null;

    @property([Material])
    materials: Material[] = [];

    @property(CCInteger)
    public type: number = 0;

    protected onEnable(): void {
        this.changeType(this.type);
    }

    changeType(type: number){
        this.type = type;

        if (this.meshRenderer && this.materials[this.type]) {
            this.meshRenderer.material = this.materials[this.type];
        }
    }




}

