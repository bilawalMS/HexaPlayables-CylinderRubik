import { _decorator, Component, Node, tween, Vec3, UIOpacity, Color, Label } from 'cc';
import { color } from 'cc';
import { Gameplay } from './Gameplay';
const { ccclass, property } = _decorator;

@ccclass('LevelStatusUI')
export class LevelStatusUI extends Component {

    @property(Node)
    levelComplete: Node | null = null;

    @property(Node)
    levelFail: Node | null = null;

    @property(Node)
    powerUpUI: Node;

    @property(Node)
    coinUI: Node;

    @property(Node)
    settingsUI: Node;

    @property(Node)
    outCoinPopup: Node | null = null;

    @property(Label)
    levelCompleteScore: Label | null = null;

    @property(Label)
    levelFailScore: Label | null = null;

    @property(Node)
    blackFlash: Node | null = null;

    @property(Node)
    levelNextButton: Node | null = null;

    @property(Node)
    levelTryButton: Node | null = null;

    levelFailBG: Node | null = null;




    showCoinPopUp() {
        // console.log(this.gameplay.getScore());
        if (this.outCoinPopup) {
            this.outCoinPopup.active = true;
            this.outCoinPopup.setScale(new Vec3(0, 0, 0)); // Start at 0 scale for bounce effect

            const popup = this.outCoinPopup.getChildByName('PopUp');
            const continuebtn = popup.getChildByName('level-green-button');


            tween(this.outCoinPopup)
                .to(0.4, { scale: new Vec3(1.2, 1.2, 1.2) }, { easing: 'backOut' })
                .to(0.2, { scale: new Vec3(1, 1, 1) }, { easing: 'quadOut' })
                .call(() => {
                    this.applyLoopingScaleTween(continuebtn); // Destroy the node
                })
                .start();
        }
    }

    hideCoinPopUp() {
        // console.log(this.gameplay.getScore());
        if (this.outCoinPopup) {
          
            this.outCoinPopup.setScale(new Vec3(1, 1, 1));

            tween(this.outCoinPopup)
                .to(0.3, { scale: new Vec3(1.1, 1.1, 1.1) }, { easing: 'backOut' })
                .to(0.2, { scale: new Vec3(0, 0, 0) }, { easing: 'quadOut' })
                .call(() => {
                    this.outCoinPopup.active = false;
                    this.outCoinPopup.destroy();
                })
                .start();
        }
    }

    showLevelComplete(score: number) {
       // console.log(this.gameplay.getScore());
        if (this.levelComplete) {
            this.levelComplete.active = true;
            this.levelComplete.setScale(new Vec3(0, 0, 0)); // Start at 0 scale for bounce effect

            //this.levelNextButton = this.levelComplete.getChildByName('level-green-button');

            this.levelFailBG = this.levelFail.getChildByName('Level-bg-black');
            const opacityComp = this.levelFailBG.getComponent(UIOpacity);
            opacityComp.opacity = 0

            this.levelCompleteScore.string = String(score);

            tween(this.levelComplete)
                .to(0.3, { scale: new Vec3(1.2, 1.1, 1.2) }, { easing: 'backOut' })
                .to(0.1, { scale: new Vec3(1, 1, 1) }, { easing: 'quadOut' })
                .call(() => {  
                   // this.applyLoopingScaleTween(this.levelNextButton); // Destroy the node
                    this.coinUI.active = false;
                    this.powerUpUI.active = false;
                    this.settingsUI.active = false;
                })
                .start();

            // Tween for fading in the background
            tween(opacityComp)
                .to(0.3, { opacity: 255 }, { easing: 'quadOut' }) // Fade in opacity from 0 to 255
                .start();
        }
    }

    showLevelFail(score: number) {
        if (this.levelFail) {
            this.levelFail.active = true;
            this.levelFail.setScale(new Vec3(0, 0, 0)); // Start at 0 scale for bounce effect

            //this.levelTryButton = this.levelFail.getChildByName('level-green-button');
     
            this.levelFailScore.string = String(score);

            this.levelFailBG = this.levelFail.getChildByName('Level-bg-black');
            const opacityComp = this.levelFailBG.getComponent(UIOpacity);
            opacityComp.opacity = 0
  

            tween(this.levelFail)
                .to(0.3, { scale: new Vec3(1.2, 1.1, 1.2) }, { easing: 'backOut' })
                .to(0.1, { scale: new Vec3(1, 1, 1) }, { easing: 'quadOut' })
                .call(() => {
                    //this.applyLoopingScaleTween(this.levelTryButton); // Destroy the node
                    this.coinUI.active = false;
                    this.powerUpUI.active = false;
                    this.settingsUI.active = false;
                })
                .start();
            // Tween for fading in the background
            tween(opacityComp)
                .to(0.3, { opacity: 255 }, { easing: 'quadOut' }) // Fade in opacity from 0 to 255
                .start();
        }
    }

    // Apply a looping scale tween to the specified node
    private applyLoopingScaleTween(targetNode: Node) {
        if (targetNode) {
            tween(targetNode)
                .repeatForever(
                    tween()
                        .to(0.6, { scale: new Vec3(1, 1, 1) }, { easing: 'quadInOut' }) // Scale up 20%
                        .to(0.6, { scale: new Vec3(1.2, 1.1, 1.2) }, { easing: 'quadInOut' }) // Scale back to original
                )
                .start();
        }
    }


    onNextLevel() {
       
        this.blackFlashOverlay()
         
    }

    blackFlashOverlay() {
        this.blackFlash.active = true;

        const opacityComp = this.blackFlash.getComponent(UIOpacity);
        opacityComp.opacity = 0;

        tween(opacityComp)
            .to(0.4, { opacity: 255 })
            .call(() => {
                this.levelComplete.active = false;
                this.coinUI.active = false;
                this.powerUpUI.active = false;
                this.settingsUI.active = false;
            })

            .to(0.8, { opacity: 0 })
            .call(() => {

            })
            .start();
    }
}
