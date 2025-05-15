import { _decorator, Component, Node, MeshRenderer, Vec4, tween, Material } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('EndCardSpawn')
export class EndCardSpawn extends Component {

    @property(Node)
    VignatteEffect: Node = null;

    @property(Node)
    landscapeUI: Node = null;  

    @property(Node)
    porttratUI: Node = null; 

    @property(Node)
    levelStatus: Node = null;

    @property(Node)
    Inputblocker: Node = null;

    @property(Node)
    endcardBG: Node = null;

    @property(Node)
    endcardLogo: Node = null;

    @property
    scrollSpeed: number = 1;

    private material: Material = null;
    private tilingOffset: Vec4 = new Vec4(4, 4, 0, 0);

    LoadEndCard() {
        console.log("EndCardSpawn start");
        // Hide UI elements
        if (this.VignatteEffect) this.VignatteEffect.active = false;
        if (this.landscapeUI) this.landscapeUI.active = false;
        if (this.porttratUI) this.porttratUI.active = false;
        if (this.levelStatus) this.levelStatus.active = false;

        // Show end card elements
        if (this.Inputblocker) this.Inputblocker.active = true;
        if (this.endcardBG) this.endcardBG.active = true;
        if (this.endcardLogo) this.endcardLogo.active = true;

        // Get material from the 3D model's MeshRenderer
        if (this.endcardBG) {
            const meshRenderer = this.endcardBG.getComponent(MeshRenderer);
            if (meshRenderer) {
                this.material = meshRenderer.material;
            }
        }
    }

    update(deltaTime: number) {
        if (this.material) {
            this.tilingOffset.w -= this.scrollSpeed * deltaTime;
            this.material.setProperty('tilingOffset', this.tilingOffset);
        }
    }

}
