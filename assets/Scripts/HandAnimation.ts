import { _decorator, Component, Node, tween, Vec3, MeshRenderer, Material, Color } from 'cc';
import { Tray } from './Tray';
import { TrayItem } from './TrayItem';
import { Gameplay } from './Gameplay';

const { ccclass, property } = _decorator;

@ccclass('HandAnimation')
export class HandAnimation extends Component {

    @property(Node)
    hand: Node = null;

    @property(Node)
    circle: Node = null;

    @property(Tray)
    tray: Tray = null;

    private gameplay: Gameplay | null = null;

    private tutorialActive: boolean = false;
    private currentTargetItem: TrayItem | null = null;
    private currentTargetEmptyCell: { name: string, position: Vec3 } | null = null;
    private handTween: any = null;

    private material: Material | null = null;
    private circleMaterial: Material | null = null;

    private delayTimer: any = null;
    private isDragActive: boolean = false;
    private isNotSorting: boolean = false;
    private isHandAnimating: boolean = true;

    private initialHandScale: Vec3;
    private targetHandScale: Vec3;

    onLoad() {

        this.gameplay = this.node.getParent().getComponent(Gameplay);
        const meshRenderer = this.hand.getComponentInChildren(MeshRenderer); 
        this.material = meshRenderer.getSharedMaterial(0);   
        this.material.setProperty('mainColor', new Color(255, 255, 255, 0));

        // Find MeshRenderer in the circle node to access the material
        if (this.circle) {
            const circleMeshRenderer = this.circle.getComponent(MeshRenderer);
            if (circleMeshRenderer) {
                this.circleMaterial = circleMeshRenderer.getSharedMaterial(0);
                if (this.circleMaterial) {
                    //console.log('Circle material found:', this.circleMaterial);
                    // Set initial transparency to 0 (fully transparent)
                    this.circleMaterial.setProperty('mainColor', new Color(255, 255, 255, 255));
                }
            }
        }

        this.initialHandScale = this.hand.getScale();
    }


    update(dt: number) {
        if (this.gameplay) {
            // Check if the player is dragging
            if ((this.gameplay.isDragging() || this.gameplay.isCheckSorting() || this.gameplay.refreshPower.isRespawnStatus()) && this.isHandAnimating)
            {
                this.isHandAnimating = false;
                //this.isDragActive = true;
                this.stopHandAnimation(); // Stop animation when dragging starts
            }
            else if (!this.isHandAnimating)
            {
                this.isHandAnimating = true;
                //this.isDragActive = false; // Set drag state to inactive
                this.restartHandAnimationAfterDelay(5.0); // Restart animation with delay when dragging ends
            }
        }
    }


    // Function to stop the hand animation and deactivate the hand
    private stopHandAnimation() {
        this.isDragActive = true;
        if (this.handTween) {
            this.handTween.stop();
            this.handTween = null;
        }
        if (this.delayTimer) {
            clearTimeout(this.delayTimer); // Reset the delay timer if dragging starts again
            this.delayTimer = null;
        }
        if (this.hand) {
            this.hand.active = false; // Deactivate the hand during dragging
            this.circle.active = false;
        }
    }


    // Function to restart the hand animation after a delay
    private restartHandAnimationAfterDelay(delay: number) {
        this.isDragActive = false;

        if (this.delayTimer) {
            clearTimeout(this.delayTimer); // Clear any existing delay timer
        }

        this.delayTimer = setTimeout(() => {
            if (!this.isDragActive) {
                if (this.hand) {
                    this.hand.active = true; // Reactivate the hand
                    this.circle.active = true;
                    this.findAndStartHandAnimation(); // Restart the tween animation
                }  
            }
            this.delayTimer = null; // Clear the delay timer
        }, delay * 1000);
    }


    // Start the tutorial animation
    startTutorialAnimation() {
        this.tutorialActive = true;
        this.findAndStartHandAnimation();
    }

    // Function to find a non-empty tray item and start the hand animation
    private findAndStartHandAnimation() {
        const randomNonEmptyTileInfo = this.tray.getRandomNonEmptyTrayItemInfo();

       

        if (randomNonEmptyTileInfo && this.gameplay) {

            this.hand.active = true;
            this.circle.active = true;

            const { position, name, trayItem } = randomNonEmptyTileInfo;

            // Set the current target item
            this.currentTargetItem = trayItem;

            //console.log(`Selected tray item: ${name}, world position: x = ${position.x}, y = ${position.y}, z = ${position.z}`);

            // Set the initial hand position to the tray item position
            this.hand.setPosition(position);

            // Now find an empty cell in the gameplay grid to move to
            const emptyCellInfo = this.gameplay.getRandomEmptyCellInfo();
            if (emptyCellInfo) {
                const { position: endPosition, name: cellName } = emptyCellInfo;

                // Set the current target empty cell
                this.currentTargetEmptyCell = { name: cellName, position: endPosition };

                //console.log(`Selected empty cell: ${cellName}, world position: x = ${endPosition.x}, y = ${endPosition.y}, z = ${endPosition.z}`);

                // Start the tween animation between the tray item and the empty cell
                this.startHandTween(position, endPosition);

                // Schedule checks to ensure both the tray item and the empty cell remain valid
                this.schedule(this.checkCurrentTargetItem, 0.5);
                this.schedule(this.checkCurrentTargetEmptyCell, 0.5);
            } else {
                //console.log("No empty cells available in the gameplay grid.");
            }
        } else {
            //console.log("No non-empty tray items available.");
        }
    }

    // Start the hand tween with different animations for the hand and its child (circle)
    private startHandTween(startPosition: Vec3, endPosition: Vec3) {
        if (this.handTween) {
            this.handTween.stop();
        }

        // Create a new tween to achieve the specified steps for both hand and circle
        this.handTween = tween()
            // Step 1: Fade in and scale up
            .target(this.hand)
            .call(() => {
                this.hand.setPosition(startPosition);
                this.hand.setScale(new Vec3(this.initialHandScale.x + 0.1, this.initialHandScale.y + 0.1, this.initialHandScale.z + 0.1)); // Start with a larger scale
                this.updateMaterialAlpha(this.material, 0); // Start with full transparency

                if (this.circle) {
                    this.circle.active = true;
                    this.circle.setScale(new Vec3(5, 5, 5)); // Start with a different larger scale for circle
                    this.updateMaterialAlpha(this.circleMaterial, 0); // Start with full transparency for circle
                }
            })
            .parallel(
                tween().call(() => {
                    this.tweenMaterialAlpha(this.material, 0, 300, 0.15); // Fade in (alpha 0 to 300)
                    if (this.circleMaterial) {
                        this.tweenMaterialAlpha(this.circleMaterial, 0, 225, 0.25); // Fade in for circle (alpha 0 to 150, slower)
                    }
                }),
                tween(this.hand).to(0.2, { scale: new Vec3(this.initialHandScale.x, this.initialHandScale.y, this.initialHandScale.z) }, { easing: 'quadInOut' }), // Scale down to original size for hand
                
            )
            .delay(0.2) // Short delay before moving to the end position

            // Step 2: Move to the end position with ease
            .to(0.8, { position: endPosition }, { easing: 'sineInOut' })

            // Step 3: Wait a bit, then scale up and fade out
            .delay(0.2)
            .parallel(
                tween().call(() => {
                    this.tweenMaterialAlpha(this.material, 300, 0, 0.12); // Fade out (alpha 300 to 0)
                    if (this.circleMaterial) {
                        this.tweenMaterialAlpha(this.circleMaterial, 225, 0, 0.18); // Fade out for circle (alpha 150 to 0, slower)
                    }
                }),
                tween(this.hand).to(0.2, { scale: new Vec3(this.initialHandScale.x + 0.1, this.initialHandScale.y + 0.1, this.initialHandScale.z + 0.1) }, { easing: 'quadInOut' }), // Scale up for hand
                
            )

            // Step 4: Wait a bit before repeating
            .delay(0.2)
            .call(() => {
                // Restart the animation from the start
                this.startHandTween(startPosition, endPosition);
            })
            .start();

        // Add a separate tween specifically for the circle to avoid any conflicts with hand animations
        if (this.circle) {
            tween(this.circle)
                .to(0.3, { scale: new Vec3(4.0, 4.0, 4.0) }, { easing: 'quadInOut' }) // Step 1: Scale down circle independently
                .delay(1.5) // Delay to match other animations
                .to(0.25, { scale: new Vec3(6.0, 6.0, 6.0) }, { easing: 'quadInOut' }) // Step 3: Scale up circle independently
                .start();
        }
    }

    // Function to tween the material's alpha value
    private tweenMaterialAlpha(material: Material | null, from: number, to: number, duration: number) {
        if (!material) return;

        let currentAlpha = from;
        const step = (to - from) / (duration * 60); // Assume 60 frames per second

        const interval = setInterval(() => {
            if ((from < to && currentAlpha >= to) || (from > to && currentAlpha <= to)) {
                clearInterval(interval);
                return;
            }
            currentAlpha += step;
            this.updateMaterialAlpha(material, currentAlpha);
        }, 1000 / 60); // Update per frame
    }

    // Function to update the alpha of the material
    private updateMaterialAlpha(material: Material | null, alpha: number) {
        if (material) {
            const color = material.getProperty('mainColor') as Color;
            if (color) {
                color.a = alpha;
                material.setProperty('mainColor', color);
            }
        }
    }

    // Check if the current target tray item is still non-empty
    private checkCurrentTargetItem() {
        if (this.currentTargetItem && this.currentTargetItem.isEmpty()) {
           // console.log(`Current target tray item ${this.currentTargetItem.node.name} is now empty, finding a new target.`);

            // Stop monitoring the current target item
            this.unschedule(this.checkCurrentTargetItem);

            // Find a new non-empty tray item and restart the animation
            this.findAndStartHandAnimation();
        }
    }

    // Check if the current target empty cell is still empty
    private checkCurrentTargetEmptyCell() {
        if (this.currentTargetEmptyCell && this.gameplay) {
            const emptyCellInfo = this.gameplay.getEmptyCellInfoByName(this.currentTargetEmptyCell.name);

            if (!emptyCellInfo) {
               // console.log(`Current target empty cell ${this.currentTargetEmptyCell.name} is now occupied, finding a new empty cell.`);

                // Stop monitoring the current target empty cell
                this.unschedule(this.checkCurrentTargetEmptyCell);

                // Find a new empty cell to move the hand to
                this.moveHandToEmptyCell();
            }
        }
    }

    // Function to move the hand to a new empty cell
    private moveHandToEmptyCell() {
        if (!this.gameplay) return;

        const emptyCellInfo = this.gameplay.getRandomEmptyCellInfo();

        if (emptyCellInfo) {
            const { position, name } = emptyCellInfo;

            // Set the current target empty cell
            this.currentTargetEmptyCell = { name, position };

            //console.log(`Moving hand to new empty cell: ${name}, world position: x = ${position.x}, y = ${position.y}, z = ${position.z}`);

            // Update the tween to use the new empty cell as the endpoint
            if (this.currentTargetItem) {
                this.startHandTween(this.currentTargetItem.node.getWorldPosition(), position);
            }
        } else {
           // console.log("No empty cells available in the gameplay grid.");
        }
    }

    // Public function to stop all tweens and destroy the hand and circle nodes
    public stopAndDestroyHand() {
        // Stop all running tweens
        if (this.handTween) {
            this.handTween.stop();
            this.handTween = null;
        }
        if (this.delayTimer) {
            clearTimeout(this.delayTimer);
            this.delayTimer = null;
        }

        // Destroy the hand and circle nodes
        if (this.hand) {
            //this.hand.active = false;
            //this.hand = null;
        }
        if (this.circle) {
           // this.circle.active = false;
        }
    }
}
