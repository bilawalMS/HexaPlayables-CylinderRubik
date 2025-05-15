import { _decorator, Component, Node, Vec3, Vec2, EventTouch, EventMouse, input, Input, Camera, PhysicsSystem, Layers, geometry, log } from 'cc';
const { ccclass, property } = _decorator;


@ccclass('Draggable')
export class Draggable extends Component {
    @property(Camera)
    mainCamera: Camera | null = null;


    private _isDragging: boolean = false;
    private _offset: Vec3 = new Vec3();
    private _ray: geometry.Ray = new geometry.Ray();

    onLoad() {
        // Ensure the main camera is assigned (usually Camera for 3D)
        if (!this.mainCamera) {
           // console.error('Please assign a Camera component to the Draggable3D script.');
            return;
        }

        // Register touch and mouse events using the new input system
        input.on(Input.EventType.TOUCH_START, this.onTouchStart, this);
        input.on(Input.EventType.TOUCH_MOVE, this.onTouchMove, this);
        input.on(Input.EventType.TOUCH_END, this.onTouchEnd, this);

        input.on(Input.EventType.MOUSE_DOWN, this.onMouseDown, this);
        input.on(Input.EventType.MOUSE_MOVE, this.onMouseMove, this);
        input.on(Input.EventType.MOUSE_UP, this.onMouseUp, this);
    }
    onTouchStart(event: EventTouch) {
        this._startDrag(event);
    }
    onMouseDown(event: EventMouse) {
        this._startDrag(event);
    }
    onTouchMove(event: EventTouch) {
        if (this._isDragging) {
            this._updateDragPosition(event.getLocation());
        }
    }
    onMouseMove(event: EventMouse) {
        if (this._isDragging) {
            const mousePos = event.getLocation();
            this._updateDragPosition(mousePos);
        }
    }
    onTouchEnd(event: EventTouch) {
        this._endDrag();
    }
    onMouseUp(event: EventMouse) {
        this._endDrag();
    }

    private _startDrag(event: EventTouch | EventMouse) {
        const touchPos = event.getLocation();
        this.mainCamera?.screenPointToRay(touchPos.x, touchPos.y, this._ray);
        if (PhysicsSystem.instance.raycast(this._ray)) {
            const results = PhysicsSystem.instance.raycastResults;
            if (results.length > 0) {
                const hit = results[0];
                if (this.isNearMe(hit.hitPoint)) {
                    this._isDragging = true;

                }

            }
        }
    }

    private _updateDragPosition(touchPos: Vec2) {
        this.mainCamera?.screenPointToRay(touchPos.x, touchPos.y, this._ray);
        if (PhysicsSystem.instance.raycast(this._ray)) {
            const results = PhysicsSystem.instance.raycastResults;
            if (results.length > 0) {
                const newWorldPos = results[0].hitPoint;
                newWorldPos.y = 1;
                this.node.setWorldPosition(newWorldPos);
            }
        }
    }

    private _endDrag() {
        this._isDragging = false;
        const pos = this.node.worldPosition;
        this.node.setWorldPosition(new Vec3(pos.x, 0, pos.z));
    }

    private isNearMe(pos:Vec3) : boolean {
        const worldPos = this.node.worldPosition;
        return Vec3.distance(worldPos, pos) < 1;
    }

    onDestroy() {
        input.off(Input.EventType.TOUCH_START, this.onTouchStart, this);
        input.off(Input.EventType.TOUCH_MOVE, this.onTouchMove, this);
        input.off(Input.EventType.TOUCH_END, this.onTouchEnd, this);

        input.off(Input.EventType.MOUSE_DOWN, this.onMouseDown, this);
        input.off(Input.EventType.MOUSE_MOVE, this.onMouseMove, this);
        input.off(Input.EventType.MOUSE_UP, this.onMouseUp, this);
    }
}
