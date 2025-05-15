import { Vec2 } from 'cc';
import { _decorator, Component, Node, math, systemEvent, SystemEvent, CameraComponent, EventMouse, Vec3, cclegacy, view } from 'cc';
import { OrbitCamera } from './orbitCamera';
const { ccclass, property } = _decorator;

@ccclass('OrbitCameraInputMouse')
export class OrbitCameraInputMouse extends Component {
    /* class member could be defined like this */
    // dummy = '';

    /* use `property` decorator if your want the member to be serializable */
    // @property
    // serializableDummy = 0;
    @property
    orbitSensitivity = 0.3;
    @property
    distanceSensitivity = 0.15;
    @property(OrbitCamera)
    orbitCamera: OrbitCamera = null;
    @property(CameraComponent)
    camera: CameraComponent = null;

    lookButtonDown: boolean = false;
    panButtonDown: boolean = false;
    lastPoint = new math.Vec2();
    fromWorldPoint = new math.Vec3();
    toWorldPoint = new math.Vec3();
    worldDiff = new math.Vec3();
    center = null;
    touchPos = null;


    start () {
        // Your initialization goes here.

        this.orbitCamera.distance = 200;
        //最多300
    }

    onDestroy () {
		this._removeEvents();
	}

	onEnable () {
		this._addEvents();
	}

	onDisable () {
        this._removeEvents();
    }
    
    private _addEvents () {
		systemEvent.on(SystemEvent.EventType.MOUSE_WHEEL, this.onMouseWheel, this);
		// systemEvent.on(SystemEvent.EventType.MOUSE_MOVE, this.onMouseMove, this);
		// systemEvent.on(SystemEvent.EventType.MOUSE_UP, this.onMouseUp, this);
        // systemEvent.on(SystemEvent.EventType.MOUSE_DOWN, this.onMouseDown, this);
        systemEvent.on(SystemEvent.EventType.MOUSE_LEAVE, this.onMouseOut, this);
	}

	private _removeEvents () {
		systemEvent.off(SystemEvent.EventType.MOUSE_WHEEL, this.onMouseWheel, this);
		// systemEvent.off(SystemEvent.EventType.MOUSE_MOVE, this.onMouseMove, this);
		// systemEvent.off(SystemEvent.EventType.MOUSE_UP, this.onMouseUp, this);
		// systemEvent.off(SystemEvent.EventType.MOUSE_DOWN, this.onMouseDown, this);
		systemEvent.off(SystemEvent.EventType.MOUSE_LEAVE, this.onMouseOut, this);
	}
    
    pan (screenPoint) {
        var fromWorldPoint = this.fromWorldPoint;
        var toWorldPoint = this.toWorldPoint;
        var worldDiff = this.worldDiff;
    
        // For panning to work at any zoom level, we use screen point to world projection
        // to work out how far we need to pan the pivotEntity in world space
        var distance = this.orbitCamera.distance;
    
        this.camera.screenToWorld(new math.Vec3(screenPoint.getLocationX(), screenPoint.getLocationY(), distance), fromWorldPoint);
        this.camera.screenToWorld(new math.Vec3(this.lastPoint.x, this.lastPoint.y, distance), toWorldPoint);
    
        math.Vec3.subtract(worldDiff, toWorldPoint, fromWorldPoint);
    
        this.orbitCamera.pivotPoint.add(worldDiff);
    };
    
    
    onMouseDown (event) {
        switch (event.getButton()) {
            case EventMouse.BUTTON_LEFT:
                this.lookButtonDown = true;
                break;
            case EventMouse.BUTTON_MIDDLE:
            case EventMouse.BUTTON_RIGHT:
                this.panButtonDown = true;
                break;
        }
    };
    
    
    onMouseUp (event) {
        switch (event.getButton()) {
            case EventMouse.BUTTON_LEFT:
                this.lookButtonDown = false;
                break;
            case EventMouse.BUTTON_MIDDLE:
            case EventMouse.BUTTON_RIGHT:
                this.panButtonDown = false;
                break;
        }
    };
    
    
    onMouseMove (event: EventMouse) {
        if (this.lookButtonDown) {
            this.orbitCamera.pitch -= event.getDeltaY() * this.orbitSensitivity;
            this.orbitCamera.yaw -= event.getDeltaX() * this.orbitSensitivity;
    
        } else if (this.panButtonDown) {
            this.pan(event);
        }
    
        this.lastPoint.set(event.getLocationX(), event.getLocationY());
    }
    
    
    onMouseWheel (event) {
        console.log("###onMouseWheel", event);
        let size = view.getCanvasSize();
        this.center = {x: size.width/2, y: size.height/2};
        this.touchPos = {x: event._x, y: event._y};

        if (this.orbitCamera.isLock) {
            return;
        }

        let wheel = 0;
        if (event.getScrollY() > 0) {
            wheel = -1 * -2;
            // console.log("放大");
        } else if (event.getScrollY() < 0) {
            wheel = +1 * -2;
            // console.log("缩小");
        }

        // console.log("wheel: ", wheel, "this.distanceSensitivity: ",this.distanceSensitivity, "this.orbitCamera.distance",  this.orbitCamera.distance );

        this.orbitCamera.distance -= wheel * this.distanceSensitivity * (this.orbitCamera.distance * 0.1);       
        //event.event.preventDefault();
    }
    
    onMouseOut (event) {
        this.lookButtonDown = false;
        this.panButtonDown = false;
    }
    
    update (deltaTime: number) {
        // Your update function goes here.
    }
}
