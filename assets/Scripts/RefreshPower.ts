import { _decorator, Component, Node, Label, Button, tween, Vec3, Sprite, Color, instantiate, UIOpacity } from 'cc';
import { Gameplay } from './Gameplay';
import { SoundManager } from './SoundManager';
import { sound } from './sound';
import { LevelStatusUI } from './LevelStatusUI';

const { ccclass, property } = _decorator;

@ccclass('RefreshPower')
export class RefreshPower extends Component {

    @property(Label)
    coinsLabel: Label = null;

    @property(Node)
    refreshButton: Node = null;

    @property(Gameplay)
    gameplay: Gameplay = null;

    @property(Node)
    coinUI: Node = null;

    @property(LevelStatusUI)
    coinPopup: LevelStatusUI;

    @property
    refreshCost: number = 50;

    @property(Node)
    noCoinTxt: Node = null;

    @property(Node)
    coinIcon: Node;

    @property(Node)
    addButton: Node;


    private currentCoins: number = 0;
    private isPopUpShowed: boolean = false;
    private gamePlay: Gameplay | null = null;
    isRespawn: boolean = false;

    onLoad() {
        // Initialize current coins from the label's text
        this.currentCoins = parseInt(this.coinsLabel.string);
        this.refreshButton.on(Node.EventType.TOUCH_END, this.onRefreshButtonClick, this);
    }


    onRefreshButtonClick() {
        SoundManager.instance.playButtonPress();

        let coins = this.coinsLabel.string;
        this.currentCoins = Number(coins);

        if (this.currentCoins >= this.refreshCost) {

            this.currentCoins -= this.refreshCost;
            this.coinsLabel.string = this.currentCoins.toString();

            // Call the spawn new items function in the tray script
            this.gameplay.tray.reSpawnNewItems();
            this.isRespawn = true;

            // Play scale animation on the refresh button (scale down and then up)
            tween(this.refreshButton)
                .to(0.1, { scale: new Vec3(0.9, 0.9, 0.9) })
                .to(0.1, { scale: new Vec3(1, 1, 1) })
                .start();
        } else {
            this.isRespawn = false;
            this.outOfCoinEffect();
            this.floterTextEffect();
            if (!this.isPopUpShowed) {
                this.coinPopup.showCoinPopUp();
                this.isPopUpShowed = true;
            }      
        }
    }

    floterTextEffect() {
        const floatingText = instantiate(this.noCoinTxt);
        this.node.addChild(floatingText); 

        floatingText.active = true; 
        const currentPostTex = floatingText.getPosition(); 

        const opacityComp = floatingText.getComponent(UIOpacity);
        opacityComp.opacity = 255; // Set initial opacity

        tween(floatingText)
            .to(0.5, { position: new Vec3(currentPostTex.x, currentPostTex.y + 20, currentPostTex.z) }, { easing: "smooth" }) 
            .start();

        tween(opacityComp)
            .to(0.7, { opacity: 0 }) // Fade out the opacity
            .call(() => floatingText.destroy()) // Destroy when finished
            .start();
    }


   
    outOfCoinEffect() {
        //const coinChildren = this.coinUI.children;

        //// Loop through the child nodes
        //coinChildren.forEach((childNode, index) => {
        //    const sprite = childNode.getComponent(Sprite);
        //    if (sprite) {
        //        const originalColor = sprite.color.clone();

        //        // Change color to red
        //        sprite.color = new Color(255, 0, 0); // Red color

        //        // Tween to scale and revert back color
        //        tween(childNode)
        //            .to(0.2, { scale: new Vec3(1.5, 1.5, 1.5) }) // Scale up
        //            .to(0.2, { scale: new Vec3(1, 1, 1) })       // Scale back
        //            .call(() => {
        //                // Revert color to the original one
        //                sprite.color = new Color(255, 255, 255);
        //            })
        //            .start();
        //    }
        //});

         //Tween to scale and revert back color
        tween(this.coinUI)
                    .to(0.2, { scale: new Vec3(1, 1, 1) }) // Scale up
                    .to(0.2, { scale: new Vec3(0.83, 0.83, 0.83) })       // Scale back
                    .start();

    }

    isRespawnStatus(): boolean {
        return this.isRespawn
    }
}
