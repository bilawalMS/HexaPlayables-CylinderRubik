import {
    _decorator, Component, Vec3, Vec2, EventTouch, EventMouse,
    input, Input, Camera, PhysicsSystem, geometry, log, instantiate, randomRangeInt, Canvas, Color, Material, Node
} from 'cc';

import { Gameplay } from './Gameplay';
import { TrayItem } from './TrayItem';
import { Utils } from './Utils';
import { tween } from 'cc';
import { MeshRenderer } from 'cc';
import { SoundManager } from './SoundManager';

const { ccclass, property } = _decorator;

@ccclass('Tray')
export class Tray extends Component {
    @property(Camera)
    mainCamera: Camera | null = null;

    @property(Camera)
    uiCam: Camera | null = null;

    @property(Gameplay)
    gameplay: Gameplay;

    @property(TrayItem)
    item1: TrayItem | null = null;

    @property(TrayItem)
    item2: TrayItem | null = null;

    @property(TrayItem)
    item3: TrayItem | null = null;


    draggingNode: TrayItem = null;
    ray: geometry.Ray = new geometry.Ray();
    hexesCreated = 0;

    currentPosItem3: Vec3;
    currentPosItem2: Vec3;
    currentPosItem1: Vec3;

    isSpawining: boolean = false;
    
    
    onLoad() {
        input.on(Input.EventType.TOUCH_START, this.onTouchStart, this);
        input.on(Input.EventType.TOUCH_MOVE, this.onTouchMove, this);
        input.on(Input.EventType.TOUCH_END, this.onTouchEnd, this);

        input.on(Input.EventType.MOUSE_DOWN, this.onMouseDown, this);
        input.on(Input.EventType.MOUSE_MOVE, this.onMouseMove, this);
        input.on(Input.EventType.MOUSE_UP, this.onMouseUp, this);

        window.addEventListener('blur', this.onWindowBlur);
        window.addEventListener('focus', this.onWindowFocus);
       
        this.currentPosItem3 = this.item3.node.getPosition();
        this.currentPosItem2 = this.item2.node.getPosition();
        this.currentPosItem1 = this.item1.node.getPosition();

        //this.spawnNewItems();
        // to start game with predefined tray comment above and
        // uncomment below line and set the arrays accordingly
        this.spawnItems([2, 2, 2, 2], [1, 1, 1, 1], [3, 3, 3, 3]);

        
    }

    onWindowBlur() {
       console.log('Window has lost focus.');
       // You can pause the game or mute sounds here
       if (this.draggingNode) {
           this.forcedEndDrag();
       }
    }

    onWindowFocus() {
       console.log('Window has gained focus.');
       // Resume the game or unmute sounds here
       if (this.draggingNode) {
           this.forcedEndDrag();
       }
    }

    reSpawnNewItems() {
        this.item3.node.active = false; 
        this.item2.node.active = false; 
        this.item1.node.active = false; 

        this.spawnItems(this.nextTrayItem(), this.nextTrayItem(), this.nextTrayItem());

    }

    spawnNewItems() {
        if (this.item1.isEmpty() && this.item2.isEmpty() && this.item3.isEmpty()) {
            this.spawnItems(this.nextTrayItem(), this.nextTrayItem(), this.nextTrayItem());       
        }
    }

    spawnItems(arg1: number[], arg2: number[], arg3: number[]) {

        this.item1.spawn(arg1);
        this.item2.spawn(arg2);
        this.item3.spawn(arg3);

        const currentScaleItem3 = this.item3.node.getScale();
        const currentScaleItem2 = this.item2.node.getScale();
        const currentScaleItem1 = this.item1.node.getScale();
        
        setTimeout(() => {
            this.traySpawnTween(this.item3.node, this.currentPosItem3, currentScaleItem3);
            
        }, 0);

        setTimeout(() => {
            this.traySpawnTween(this.item2.node, this.currentPosItem2, currentScaleItem2);
        }, 200);

        setTimeout(() => {
            this.traySpawnTween(this.item1.node, this.currentPosItem1, currentScaleItem1);
        }, 400);
    }

    forcedEndDrag() {
        if (this.draggingNode) {
            //console.log("forced");
            this.draggingNode.resetPosition(false);
            this.draggingNode = null;
        }
    }

    update(dt: number) {

        if ((input.getTouchCount() == 0) && this.draggingNode) {
            this.forcedEndDrag();
        }
    }

    traySpawnTween(node: Node, currentPos: Vec3, currentScale: Vec3) {
        tween(node)
            .to(0.00, { position: new Vec3(currentPos.x , currentPos.y - 5, currentPos.z) }, { easing: 'linear' })
            .call(() => {
                node.active = true;
                SoundManager.instance.playTraySpawn();
            })
            .to(0.2, { position: new Vec3(currentPos.x, currentPos.y + 5 , currentPos.z) }, { easing: 'quadOut' })
            .to(0.4, { position: new Vec3(currentPos.x, currentPos.y, currentPos.z) }, { easing: 'quadOut' })
            //.to(0.1, { scale: new Vec3(currentScale.x + 0.1, currentScale.y  + 0.1, currentScale.z + 0.1) }, { easing: 'quadInOut' })
           // .to(0.1, { scale: new Vec3(currentScale.x, currentScale.y, currentScale.z) }, { easing: 'quadInOut' })
        .start();
    }

    onTouchStart(event: EventTouch) {
        this.startDrag(event);
    }
    onMouseDown(event: EventMouse) {
        this.startDrag(event);
    }
    onTouchMove(event: EventTouch) {
        if (this.draggingNode) {
            this.updateDragPosition(event.getLocation());
        }
    }
    onMouseMove(event: EventMouse) {
        if (this.draggingNode) {
            const mousePos = event.getLocation();
            this.updateDragPosition(mousePos);
        }
    }
    onTouchEnd(event: EventTouch) {
        this.endDrag();
    }
    onMouseUp(event: EventMouse) {
        this.endDrag();
    }

    private startDrag(event: EventTouch | EventMouse) {
        this.draggingNode = null;
        const touchPos = event.getLocation();
        this.mainCamera?.screenPointToRay(touchPos.x, touchPos.y, this.ray);
        if (PhysicsSystem.instance.raycast(this.ray)) {
            const results = PhysicsSystem.instance.raycastResults;
            if (results.length > 0) {
                this.draggingNode = this.isNearNode(results[0].hitPoint);
            }
        }
    }

    private isNearNode(pos: Vec3) : TrayItem {
        if (this.item1.isDraggable(pos)){
            return this.item1;
        }
        if (this.item2.isDraggable(pos)){
            return this.item2;
        }
        if (this.item3.isDraggable(pos)){
            return this.item3;
        }
        return null;
    }

    private updateDragPosition(touchPos: Vec2) {
        this.mainCamera?.screenPointToRay(touchPos.x, touchPos.y, this.ray);
        if (PhysicsSystem.instance.raycast(this.ray)) {
            const results = PhysicsSystem.instance.raycastResults;
            if (results.length > 0) {
                const newWorldPos = results[0].hitPoint;
                newWorldPos.y = 2;
                this.draggingNode.updatePosition(newWorldPos);
               // this.gameplay.dragUpdate(newWorldPos);
            }
        }
    }

    private endDrag() {
        // if (Utils.isSip) {
        //     Utils.storeRedirect();
        // }

        // let checkRespawn = false;
        // if (this.draggingNode) {


        //     const dragEndPosition = this.draggingNode.container.worldPosition;
        //     const dragHexes = this.draggingNode.hexes;
        //     //const result = this.gameplay.dragEnd(dragEndPosition, dragHexes);

        //     if (result) {
        //         this.draggingNode.resetHexes();
        //         checkRespawn = true;

        //         if (this.item1.isEmpty() && this.item1 == this.draggingNode) {
        //             tween(this.item1.node)
        //                 .by(0.2, { worldPosition: new Vec3(0, -20, 0) }, { easing: 'quadIn' })
        //                 .call(() => {this.item1.node.active = false;})
        //                 .start();
        //             this.currentPosItem1 = this.item1.node.getPosition();
        //         }
        //         if (this.item2.isEmpty() && this.item2 == this.draggingNode) {
        //             tween(this.item2.node)
        //                .by(0.2, { worldPosition: new Vec3(0, -20, 0) }, { easing: 'quadIn' })
        //                 .call(() => {this.item2.node.active = false;})
        //                 .start();
        //             this.currentPosItem2 = this.item2.node.getPosition();
        //         }
        //         if (this.item3.isEmpty() && this.item3 == this.draggingNode) {
        //             tween(this.item3.node)
        //                 .by(0.2, { worldPosition: new Vec3(0, -20, 0) }, { easing: 'quadIn' })
        //                 .call(() => {this.item3.node.active = false;})
        //                 .start();
        //             this.currentPosItem3 = this.item3.node.getPosition();
        //         }
                
        //     }
        //     this.draggingNode.resetPosition(!result);
        //     this.draggingNode = null;
        // }

        // if (checkRespawn) {

            
        //     this.scheduleOnce(() => {
        //         this.spawnNewItems();
        //     }, 0.3);
        // }
    }

    onDestroy() {
        input.off(Input.EventType.TOUCH_START, this.onTouchStart, this);
        input.off(Input.EventType.TOUCH_MOVE, this.onTouchMove, this);
        input.off(Input.EventType.TOUCH_END, this.onTouchEnd, this);

        input.off(Input.EventType.MOUSE_DOWN, this.onMouseDown, this);
        input.off(Input.EventType.MOUSE_MOVE, this.onMouseMove, this);
        input.off(Input.EventType.MOUSE_UP, this.onMouseUp, this);
    }

    nextTrayItem(): number[] {
        let maxTypesInStack = 2;
        let maxTypes = 4;
        let minRandHexPerStack = 4;
        let maxRandHexPerStack = 6;
        if (this.hexesCreated < 20) {
            maxTypesInStack = 1;
            maxTypes = 3;
        }
        else if (this.hexesCreated < 40) {
            maxTypesInStack = 1;
            maxTypes = 4;
        }
        else if (this.hexesCreated < 100) {
            maxTypesInStack = 1;
            maxTypes = 4;
        }
        else if (this.hexesCreated < 150) {
            maxTypesInStack = 1;
            maxTypes = 4;
        }
        else if (this.hexesCreated < 200) {
            maxTypesInStack = 1;
            maxTypes = 3;
        }
        else {
            maxTypesInStack = 1;
            maxTypes = 1;
        }

        let typeCount = randomRangeInt(1, maxTypesInStack + 1);
        let minHexPerStack = typeCount > minRandHexPerStack ? typeCount : minRandHexPerStack;
        let totalHexCount = randomRangeInt(minHexPerStack, maxRandHexPerStack);
        let colors = [];
        let counts = [];
        let iterations = 0;
        while(colors.length < typeCount && iterations < 100) {
            iterations++;
            let rand = randomRangeInt(0, maxTypes);
            if (colors.indexOf(rand) == -1) {
                colors[colors.length] = rand;
                counts[counts.length] = 0;
            }
        }
        for(let i = 0; i < totalHexCount; i++) {
            const index = randomRangeInt(0, counts.length);
            counts[index]++;
        }

        let numbers = [];
        for(let i = 0; i < counts.length; i++) {
            const count = counts[i];
            const color = colors[i] + 1;
            for (let j = 0; j < count; j++) {
                numbers[numbers.length] = color;
            }
        }
        this.hexesCreated += numbers.length;
        return numbers;
    }

    getRandomNonEmptyTrayItemInfo(): { position: Vec3, name: string, trayItem: TrayItem } | null {
        const nonEmptyItems: TrayItem[] = [];

        if (!this.item1.isEmpty()) {
            nonEmptyItems.push(this.item1);
        }
        if (!this.item2.isEmpty()) {
            nonEmptyItems.push(this.item2);
        }
        if (!this.item3.isEmpty()) {
            nonEmptyItems.push(this.item3);
        }

        if (nonEmptyItems.length > 0) {
            const randomIndex = randomRangeInt(0, nonEmptyItems.length);
            const selectedItem = nonEmptyItems[randomIndex];
            const position = selectedItem.node.getWorldPosition();
            return { position, name: selectedItem.node.name, trayItem: selectedItem };
        }

        return null;
    }

    getRandomEmptyTrayItemInfo(): { position: Vec3, name: string } | null {
        const emptyItems: TrayItem[] = [];

        if (this.item1.isEmpty()) {
            emptyItems.push(this.item1);
        }
        if (this.item2.isEmpty()) {
            emptyItems.push(this.item2);
        }
        if (this.item3.isEmpty()) {
            emptyItems.push(this.item3);
        }

        if (emptyItems.length > 0) {
            const randomIndex = randomRangeInt(0, emptyItems.length);
            const selectedItem = emptyItems[randomIndex];
            const position = selectedItem.node.getWorldPosition();
            return { position, name: selectedItem.node.name };
        }

        return null;
    }

   
}