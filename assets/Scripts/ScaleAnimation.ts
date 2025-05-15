import { _decorator, Component, Node, tween, Vec3 } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('ScaleAnimation')
export class ScaleAnimation extends Component {
    
    private originalScale: Vec3 = new Vec3();

    @property
    scaleUpFactor: number = 1.2;

    @property
    animationDuration: number = 0.5;

    start() {
        this.originalScale.set(this.node.scale); // Store the original scale properly
        this.startScaleAnimation();
    }

    startScaleAnimation() {
        tween(this.node)
            .repeatForever( // Infinite loop
                tween()
                    .to(this.animationDuration, { scale: this.originalScale.clone().multiplyScalar(this.scaleUpFactor) }, { easing: 'smooth' }) // Scale up
                    .to(this.animationDuration, { scale: this.originalScale.clone() }, { easing: 'smooth' }) // Scale back to original
            )
            .start();
    }
}
