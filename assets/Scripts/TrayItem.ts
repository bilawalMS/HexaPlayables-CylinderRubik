import { _decorator, Component, Node, Prefab, instantiate, Vec3, Vec2, tween, Material, MeshRenderer, Tween, v3} from 'cc';
import { Hex } from './Hex';
import { Utils } from './Utils';
import { log } from 'cc';
import { SoundManager } from './SoundManager';

const { ccclass, property } = _decorator;

@ccclass('TrayItem')
export class TrayItem extends Component {

    @property(Prefab)
    hexPrefab: Prefab = null;

    @property(Node)
    container: Node = null;

    @property(Node)
    hexPlatform: Node = null;

    @property(Node)
    numberParent: Node = null;

    @property([Material])
    numberMats: Material[] = [];

    @property(MeshRenderer)
    unitsQuad: MeshRenderer;

    @property(MeshRenderer)
    tensQuad: MeshRenderer;

    posX: number;
    posY: number;
    posZ: number;

    hexes: Hex[];

    movingBack: boolean = false;

    isEmpty() : boolean {
        return !this.hexes || this.hexes.length == 0;
    }

    isDraggable(pos: Vec3) : boolean {
        if (this.movingBack) { 
            return false;
        }
        if (this.isEmpty()) {
            return false;
        }
        return Vec3.distance(pos, this.node.worldPosition) < 2.5;
    }

    startedDrag() {
        this.posX = this.container.position.x;
        this.posY = this.container.position.y;
        this.posZ = this.container.position.z;   
        SoundManager.instance.startBackgroundMusic(); 
    }

    spawn(hexes: number[]) {
        this.hexes = [];
        for(let i = 0; i < hexes.length; i++) {
            const nHex = instantiate(this.hexPrefab);
            this.container.addChild(nHex);
            const hex = nHex.getComponent(Hex);
            hex.changeType(hexes[i]);
            this.hexes[i] = hex;
            hex.node.setPosition(new Vec3(0, (i + 1.5) * Utils.hexY, 0));
        }
        this.showNumber();
    }

    makeEmpty() {
        this.hideNumber();
        if (this.hexes == null || this.hexes.length == 0) {
            return;
        }

        this.hexes.forEach(element => {
            element.node.destroy();
        });
        this.hexes = null;
    }

    updatePosition(pos: Vec3) {
        this.container.setWorldPosition(pos);
    }

    resetPosition(animate: boolean) {
        if (!animate) {
            this.movingBack = false;
            this.container.setPosition(new Vec3(this.posX, this.posY, this.posZ));
            return;
        }
        
        this.movingBack = true;
        tween(this.container)
        .to(0.2, {position: new Vec3(this.posX, this.posY, this.posZ)})
        .call(() => {
            this.movingBack = false;
        })
        .start();
    }

    resetHexes() {
        this.hexes = [];
        this.hideNumber();
    }


    topNumber() {
        if (this.hexes == null || this.hexes.length == 0) {

            return 0;
        }
        
        return this.hexes[this.hexes.length - 1].type;
    }

    topTypeCount(): number {
        const top = this.topNumber();
        if (top == 0) {
            return 0;
        }

        let count = 0;
        for (let i = this.hexes.length - 1; i >= 0; i--) {
            if (this.hexes[i].type == top) {
                count++;
            }
            else {
                break;
            }
        }

        return count;
    }


    showNumber() {
        if (this.topNumber() == 0) {
            this.unitsQuad.node.active = false;
            this.tensQuad.node.active = false;
            return;
        }

        const totalCount = this.topTypeCount();
        const units = totalCount % 10;
        const tens = Math.floor(totalCount / 10);
        const height = this.hexes[this.hexes.length-1].node.position.y+0.4;
        this.numberParent.position = v3(0,height,0);
        let unitsPos = v3(0.35,0,0);
        let tensPos = v3(-0.35,0,0);
        log(totalCount)
        this.unitsQuad.node.active = true;

        if (totalCount < 10) {
            this.tensQuad.node.active = false;    
            unitsPos = v3(0,0,0);
            this.unitsQuad.node.scale = this.getSizeForQuad(units);
        }
        else {
            this.tensQuad.node.active = true;

            const unitSize = this.getSizeForQuad(units);
            const tensSize = this.getSizeForQuad(tens);
            this.unitsQuad.node.scale = unitSize;
            this.tensQuad.node.scale = tensSize;

            unitsPos.x = unitSize.x/2;
            tensPos.x = -1 * tensSize.x/2;
        }

        this.unitsQuad.setMaterialInstance(this.numberMats[units], 0);
        this.tensQuad.setMaterialInstance(this.numberMats[tens], 0);
        this.unitsQuad.node.position = unitsPos;
        this.tensQuad.node.position = tensPos;

        Tween.stopAllByTarget(this.numberParent);
        tween(this.numberParent).to(0.2, {scale: v3(1,1,1)}).call(() => {
        })
        .start();
    }

    getSizeForQuad(num: number): Vec3{
        let size = v3(0.7, 1, 1);
        switch(num){
            case 0:
                size.x = 0.7;
                break;
            case 1:
                size.x = 0.45;
                break;
            case 2:
                size.x = 0.55;
                break;
            case 3:
                size.x = 0.6;
                break;
            case 4:
                size.x = 0.65;
                break;
            case 5:
                size.x = 0.6;
                break;
            case 6:
                size.x = 0.65;
                break;
            case 7:
                size.x = 0.6;
                break;
            case 8:
                size.x = 0.7;
                break;
            case 9:
                size.x = 0.65;
                break;
            default:
                size.x = 0.7;
                break;
        }
        size.multiplyScalar(0.8);
        return size;
    }

    hideNumber() {
        this.numberParent.scale = v3(0,0,0);
        this.unitsQuad.node.active = false;
        this.tensQuad.node.active = false;
    }
}