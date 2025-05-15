import { _decorator, Component, Node, tween, Vec3, Widget } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('Tutorial')
export class Tutorial extends Component {

    @property(Node)
    firstText: Node = null;

    @property(Node)
    secondText: Node = null;

    @property(Node)
    textGrp: Node = null;

    private originalScaleFirstText: Vec3 = new Vec3();
    private originalScaleSecondText: Vec3 = new Vec3();

    start() {
        // Store the original scales
        if (this.firstText) {
            this.originalScaleFirstText.set(this.firstText.scale);
        }
        if (this.secondText) {
            this.originalScaleSecondText.set(this.secondText.scale);
        }

        // Initially, show the first text and hide the second one
        this.showFirstText();
    }

    showFirstText() {
        if (this.firstText && this.secondText) {
            this.firstText.active = true;
            this.secondText.active = false;

            this.applyLoopingScaleTween(this.firstText, this.originalScaleFirstText); // Apply animation to the first text
        }
    }

    showSecondText() {
        if (this.firstText && this.secondText) {
            this.firstText.active = false;
            this.secondText.active = true;

            this.secondText.setScale(0, 0, 0);

            tween(this.secondText)
                .to(0.6, { scale: this.originalScaleSecondText }, { easing: 'backOut' })
                .call(() => {
                    this.applyLoopingScaleTween(this.secondText, this.originalScaleSecondText);
                })
                .start();
        }
    }

    hideAllText() {
        if (this.firstText) {
            this.firstText.destroy();
        }
        if (this.secondText) {
            this.secondText.destroy();
        }
        this.firstText = null;
        this.secondText = null;
    }

    // Apply a looping scale tween to the specified node
    private applyLoopingScaleTween(targetNode: Node, originalScale: Vec3) {
        if (targetNode) {
            tween(targetNode)
                .repeatForever(
                    tween()
                        .to(0.6, { scale: originalScale.clone().multiplyScalar(1.05) }, { easing: 'quadInOut' }) // Scale up 5%
                        .to(0.6, { scale: originalScale }, { easing: 'quadInOut' }) // Scale back to original
                )
                .start();
        }
    }

    changeTutorialPosition(position: Vec3, scale: Vec3, alignment: string, left: number, right: number, top: number, bottom: number) {
        const widget = this.textGrp.getComponent(Widget);

        // Set scale
        this.textGrp.setScale(scale);

        // Set position
        this.textGrp.setPosition(position);

        // Handle alignment using Widget
        switch (alignment.toLowerCase()) {
            case 'center_top':
                widget.isAlignTop = true;
                widget.isAlignBottom = false;
                widget.isAlignLeft = false;
                widget.isAlignRight = false;
                widget.top = top;  // Adjust as needed
                break;

            case 'left_top':
                widget.isAlignTop = true;
                widget.isAlignBottom = false;
                widget.isAlignLeft = true;
                widget.isAlignRight = false;
                widget.top = top;  // Adjust as needed
                widget.left = left; // Adjust as needed
                break;

            case 'right_top':
                widget.isAlignTop = true;
                widget.isAlignBottom = false;
                widget.isAlignLeft = false;
                widget.isAlignRight = true;
                widget.top = top;  // Adjust as needed
                widget.right = right; // Adjust as needed
                break;

            case 'center_bottom':
                widget.isAlignTop = false;
                widget.isAlignBottom = true;
                widget.isAlignLeft = false;
                widget.isAlignRight = false;
                widget.bottom = bottom;  // Adjust as needed
                break;

            default:
                //console.warn("Invalid alignment.");
                break;
        }

        widget.updateAlignment();  // Apply the widget changes
    }
}
