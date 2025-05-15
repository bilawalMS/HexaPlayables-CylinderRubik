import { animation } from 'cc';
import { SoundManager } from './SoundManager';
import { _decorator, Component, Node, instantiate, Vec3, tween, Button, input, Input, EventTouch, Sprite, Color, ProgressBar, Animation } from 'cc';
import { Label } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('MetaFill')
export class MetaFill extends Component {

    @property(Node)
    hexUI: Node = null;

    @property(Node)
    buttonPosition: Node = null;

    @property(Node)
    metaPosition: Node = null;

    @property(Node)
    generateButton: Node = null;

    @property(Node)
    metaIsland: Node = null;

    @property(Node)
    towerPivot: Node = null;

    @property(Node)
    buttonProgress: Node = null;

    @property(Animation)
    animparent: Animation = null;

    @property(Node)
    playNextLevel: Node = null;

    @property(Label)
    hexaWin: Label = null;

    private fillCount: number = 0;
    private progressSpeed: number = 1.2;

    private isGenerating: boolean = false;
    private generateInterval: any = null;

    private towerScale: Vec3 = null;
    private bounceTween: any = null;


    private isFilled: boolean = false;

    private colourList: string[] = [


        "#FF001E", // Red
        "#28D643", // Green
        "#0055FF", // Blue
        "#FFD300", // Yellow
        "#C22DE2", // Purple
        "#1CFFFF", // Aqua
    ];

    onLoad() {

           //animeplay.clips.('MetaViewReveal');
        this.animparent.clips;

        

        this.towerScale = this.towerPivot.getScale();


        //this.generateButton.on(Input.EventType.TOUCH_START, this.startGenerating, this);
        //this.generateButton.on(Input.EventType.TOUCH_END, this.stopGenerating, this);
        //this.generateButton.on(Input.EventType.MOUSE_DOWN, this.startGenerating, this);
        //this.generateButton.on(Input.EventType.MOUSE_UP, this.stopGenerating, this);

        this.islandFloating(this.metaIsland);
        

    }

    hexSpawning(param: boolean) {
        if (param == true) {
            this.startGenerating();
        }
        else {
            //console.log("No File");
        }

        if(this.isFilled){
            this.stopGenerating();
        }
    }

    islandSpawn(param: boolean) {
        SoundManager.instance.playTileDrop();
        return false;
    }

    bannerSpawn(param: boolean) {
        SoundManager.instance.playTileDrop();
        return false;
    }


    metaComplete(param: boolean) {
        if (param == true) {
            SoundManager.instance.playMetaComplete();
            param = false;
        }
        else {
            //console.log("No File");
        }

    }

    houseSpawn(param: boolean) {
        if (param == true) {
            SoundManager.instance.playMetaSpawn();
            param = false;
        }
        else {
            //console.log("No File");
        }
    }

    nextButton(param: boolean) {
        if (param == true) {
            SoundManager.instance.playNextButton();
            param = false;
        }
        else {
           // console.log("No File");
        }
    }


    startGenerating() {
        if (!this.isGenerating && this.fillCount < 1) {
            setTimeout(() => {
                this.bounceEffect(); // Start bounce effect after a delay
            }, 500);

            this.isGenerating = true;

            // Start playing the MetaFill sound in a loop
            SoundManager.instance.playMetaFill(); 

            this.reduceScore(200);
            this.generateInterval = setInterval(() => {
                this.spawnHex();
                
                
            }, 30);
        }
    }

    
    stopGenerating() {
        if (this.isGenerating) {
            this.isGenerating = false;

            if (this.generateInterval) {
                clearInterval(this.generateInterval); // Stop hex generation
            }

            if (this.bounceTween) {
                this.bounceTween.stop(); // Stop bounce tween effect
            }

            // Stop the MetaFill sound when generation ends
            SoundManager.instance.stopMetaFill();
        }

        this.animparent.crossFade('MetaComplete', 0.2);

    }


    // Apply a looping scale tween to the specified node
    private applyLoopingScaleTween(targetNode: Node) {
        if (targetNode) {
            tween(targetNode)
                .repeatForever(
                    tween()
                        .to(0.6, { scale: new Vec3(0.489, 0.489, 0.489) }, { easing: 'quadInOut' }) // Scale up 20%
                        .to(0.6, { scale: new Vec3(0.52, 0.52, 0.52) }, { easing: 'quadInOut' }) // Scale back to original
                )
                .start();
        }
    }
    
    spawnHex() {
       
        if (this.fillCount < 1) {
            const startPosition = this.buttonPosition.getPosition();
            const endPosition = this.metaPosition.getPosition();

            const middlePosition1 = new Vec3(
                this.getRandomBetween(-150, 150),
                this.getRandomBetween(-200, -200),
                this.getRandomBetween(-100, 100)
            );

            const hex = instantiate(this.hexUI);

            // Add the hex to a specific index in the hierarchy (e.g., 2nd position in the hierarchy)
            const targetIndex = 4;  // Adjust the index as needed
            this.node.insertChild(hex, targetIndex);

            const hexCurrentScale = hex.setScale(0.2, 0.2, 0.2);

            const randomIndex = Math.floor(Math.random() * this.colourList.length);
            const hexSprite = hex.getComponent(Sprite);
            hexSprite.color = new Color(this.colourList[randomIndex]);

            hex.active = true;
            hex.setPosition(new Vec3(startPosition.x, startPosition.y, startPosition.z));

            tween(hex)
                .to(0.5, { position: middlePosition1 }, {
                    onUpdate: (target, ratio) => {
                        const currentPos = hex.getPosition();
                        const updatedPosition = Vec3.lerp(new Vec3(), currentPos, endPosition, ratio);
                        hex.setPosition(updatedPosition);
                    }
                })
                .call(() => {
                    this.incrementProgress();
                    hex.destroy();
                })
                .start();

            tween(hex)
                .to(0.35, { scale: this.getRandomVec3(0.8, 1) }, {
                    onUpdate: (target, ratio) => {
                        const currentSclae = hex.getScale();
                        const updatedScale = Vec3.lerp(new Vec3(), currentSclae, this.getRandomVec3(0.3, 0.5), ratio);
                        hex.setScale(updatedScale);
                    }
                })
                .start();
        }
    }


    islandFloating(node:Node) {
        tween(node)
            .to(1.5, { position: new Vec3(node.position.x, node.position.y + 5, node.position.z) }, { easing: 'smooth' })
            .to(1.5, { position: new Vec3(node.position.x, node.position.y - 10, node.position.z) }, { easing: 'smooth' })
            .union()
            .repeatForever()
            .start();
    }


    bounceEffect() {
        if (this.fillCount < 1) {
            this.bounceTween = tween(this.towerPivot)
                .to(0.2, { scale: new Vec3(this.towerScale.x + 0.1, this.towerScale.y + 0.1, this.towerScale.z + 0.1) }, { easing: 'quadInOut' })
                .to(0.2, { scale: this.towerScale }, { easing: 'quadInOut' })
                .union()
                .repeatForever()
                .start();
        }
    }


    incrementProgress() {
        const fillProgress = this.metaPosition.getComponent(ProgressBar);
        const btnProgress = this.buttonProgress.getComponent(ProgressBar);

        this.fillCount += this.progressSpeed * 0.01;
        if (this.fillCount >= 1) {
            this.fillCount = 1;
            this.isFilled = true;
            this.stopGenerating(); // Stop generating when progress is full
            this.applyLoopingScaleTween(this.playNextLevel);
        }

        btnProgress.progress = this.fillCount;
        fillProgress.progress = this.fillCount;
    }

    getRandomVec3(min: number, max: number): Vec3 {
        const randomX = this.getRandomBetween(min, max);
        const randomY = this.getRandomBetween(min, max);
        const randomZ = this.getRandomBetween(min, max);
        return new Vec3(randomX, randomY, randomZ);
    }

    getRandomBetween(min: number, max: number): number {
        return Math.random() * (max - min) + min;
    }


    reduceScore(score: number) {
        const scoreDecrement = 4;

        const updateScore = () => {
            if (this.isGenerating && score > 0) {
                score -= scoreDecrement;
                //console.log(`Current Score: ${score}`);
                this.hexaWin.string = String(score); // Update the label
                setTimeout(updateScore, 40); // Call again after 100ms
            } else {
                //console.log("Score reduction completed.");
            }
        };

        updateScore(); // Start reducing the score
    }


}
