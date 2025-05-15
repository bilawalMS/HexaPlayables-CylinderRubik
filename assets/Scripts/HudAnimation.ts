import { _decorator, Component, Node, instantiate, Vec3, tween, director, Camera, CCInteger, UIOpacity, Sprite, Color, ParticleSystem2D, ParticleSystem, Widget } from 'cc';
import { Hex } from './Hex'
import { color } from 'cc';
import { randomRange } from 'cc';


const { ccclass, property } = _decorator;

@ccclass('HudAnimation')
export class HudAnimation extends Component {

    @property(Node)
    hexaLogo: Node;

    @property(Node)
    installButton: Node;

    @property(Node)
    msLogo: Node;

    @property(Hex)
    hexComponent: Hex = null;

    @property(Node)
    hexaOutline: Node = null;

    @property(Node)
    hudUI: Node = null;

    @property(Node)
    particle: Node = null;

    @property(ParticleSystem2D)
    hudParticle: ParticleSystem2D = null;

    @property(Node)
    hudGrp: Node = null;

    @property(Node)
    settingBtn: Node = null;

    @property(Node)
    coinUI: Node = null;

    @property(Node)
    powerUpTray: Node = null;

    private isHexCollected: boolean = false;

    // List of predefined colors as hex strings
    private colourList: string[] = [
        //"#FFFFFF", // Grey
        //"#FF3A56", // Red
        //"59FF65", // Green
        //"#67D9FF", // Blue
        //"#FFFD78", // Yellow
        //"#FF90F8", // Purple
        //"#B8FFeD", // Aqua
        //"#F3F3F3", // White
        //"#464646"  // Black

        "#59FF65", // Green
        "#59FF65", // Green
        "#59FF65", // Green
        "#67D9FF", // Blue
        "#FFFD78", // Purple
        "#FFFD78", // Purple
        "#FFFD78", // Purple
        "#67D9FF", // Blue
        "#67D9FF"  // Blue
    ];



    hexaCollectionEffect(hexColour: number) {
        if (this.hexaOutline) {

            const newHexaOutline = instantiate(this.hexaOutline);
            this.node.addChild(newHexaOutline);

            newHexaOutline.active = true;

            let randomScale = randomRange(1, 1.8);

            newHexaOutline.setScale(randomScale, randomScale, randomScale);

            const opacityComp = newHexaOutline.getComponent(UIOpacity);
            opacityComp.opacity = 255;

            const hexSprite = newHexaOutline.getComponent(Sprite);
            hexSprite.color = new Color(this.colourList[hexColour]);

            tween(newHexaOutline)
                .delay(0.01)
                .to(0.15, { scale: new Vec3(0, 0, 0) }, { easing: 'linear' })
                .call(() => {

                   // this.playAllParticles(this.particle);
                    this.hudParticle.resetSystem(); 
                    newHexaOutline.destroy();
                })
                .start();
        } else {
            //console.warn("HexaOutline is not assigned in HudAnimation.");
        }
    }

    hudScaleEffect() {
        if (this.hudUI) {
            const hudScale = this.hudUI.getScale();

            tween(this.hudUI)
                .to(0.09, { scale: new Vec3(hudScale.x, hudScale.y + 0.05, hudScale.z) }, { easing: 'linear' })
                .to(0.1, { scale: new Vec3(hudScale) }, { easing: 'linear' })
                .start();
        } else {
            //console.warn("HexaOutline is not assigned in HudAnimation.");
        }
    }


    particleHudPosition(hudPosition: Vec3) {
        const particleChild = this.particle.getChildByName('FX');
        particleChild.setPosition(10, 5, 0);
        this.particle.setWorldPosition(hudPosition);
    }

    //playAllParticles(parentParticle: Node) {
    //    const particleSystems = parentParticle.getComponentsInChildren(ParticleSystem);
    //    particleSystems.forEach((particle) => {
    //        particle.play();
    //    });
    //}

    printAllComponents(hexaOutline: Node) {
        if (hexaOutline) {
            const components = hexaOutline.getComponents(Component);
            components.forEach((component) => {
                //console.log(`Component: ${component.name}`);
            });
        } else {
            //console.warn("Node is not assigned.");
        }
    }

    changeHudPosition(node:Node, position: Vec3, scale: Vec3, alignment: string, left: number, right: number, top: number, bottom: number) {
        const widget = node.getComponent(Widget);

        // Set scale
        node.setScale(scale);

        // Set position
        node.setPosition(position);

        // Handle alignment using Widget
        switch (alignment.toLowerCase()) {
            case 'center_top':
                widget.isAlignTop = true;
                widget.isAlignBottom = false;
                widget.isAlignLeft = false;
                widget.isAlignRight = false;
                //widget.top = 10;  // Adjust as needed
                widget.left = left; 
                widget.top = top;  // Adjust as needed
                break;

            case 'left_top':
                widget.isAlignTop = true;
                widget.isAlignBottom = false;
                widget.isAlignLeft = true;
                widget.isAlignRight = false;
                //widget.top = 150;  // Adjust as needed
                //widget.left = 120; // Adjust as needed

                widget.top = top;  // Adjust as needed
                widget.left = left; // Adjust as needed
                break;

            case 'right_top':
                widget.isAlignTop = true;
                widget.isAlignBottom = false;
                widget.isAlignLeft = false;
                widget.isAlignRight = true;
                //widget.top = 10;  // Adjust as needed
                widget.top = top;  // Adjust as needed
                widget.right = right; // Adjust as needed
                break;

            case 'center_bottom':
                widget.isAlignTop = false;
                widget.isAlignBottom = true;
                widget.isAlignLeft = false;
                widget.isAlignRight = false;
                //widget.top = 10;  // Adjust as needed
                widget.bottom = bottom;  // Adjust as needed

                break;

            case 'left_bottom':
                widget.isAlignTop = false;
                widget.isAlignBottom = true;
                widget.isAlignLeft = true;
                widget.isAlignRight = false;
                //widget.top = 10;  // Adjust as needed
                widget.bottom = bottom;  // Adjust as needed
                widget.left = left; // Adjust as needed

                break;

            case 'right_bottom':
                widget.isAlignTop = false;
                widget.isAlignBottom = true;
                widget.isAlignLeft = false;
                widget.isAlignRight = true;
                //widget.top = 10;  // Adjust as needed
                widget.bottom = bottom;  // Adjust as needed'
                widget.right = right; // Adjust as needed

                break;


            default:
                //console.warn("Invalid alignment.");
                break;
        }

        widget.updateAlignment();  // Apply the widget changes
    }
}
