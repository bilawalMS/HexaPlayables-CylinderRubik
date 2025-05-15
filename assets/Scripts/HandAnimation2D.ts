import { _decorator, Component, Node, tween, Vec3 } from 'cc';
import { Tray } from './Tray';  // Import Tray class

const { ccclass, property } = _decorator;

@ccclass('HandAnimation2D')
export class HandAnimation2D extends Component {


    @property(Node)
    hand: Node = null;  // UI hand image for the tutorial animation

    @property(Tray)
    tray: Tray = null;

    private tutorialActive: boolean = false;
    private tutorialTimeout: any = null;


    // Start the tutorial animation
    startTutorialAnimation() {

        //// Get the screen position of the first non-empty tray item
        //const screenPos = this.tray.getFirstNonEmptyTrayItemScreenPosition();

        //if (screenPos) {
        //    // Set the starting position of the hand (based on the tray item's screen position)
        //    this.hand.setPosition(new Vec3(screenPos.x, screenPos.y, 0));
        //    console.log(screenPos);
        //}
        //this.tutorialActive = true;

        //tween(this.hand)
        //    .sequence(

        //        tween().to(1, { position: new Vec3(5, 5, 5) }),

        //        tween().to(1, { position: this.tray.getItem3ScreenPosition() })
        //    )
        //    .repeatForever()
        //    .start();

    }


}


