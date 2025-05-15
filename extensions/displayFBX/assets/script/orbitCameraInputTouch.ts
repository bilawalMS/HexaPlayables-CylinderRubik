import { _decorator, Component, Node, systemEvent, SystemEvent, math, CameraComponent, EventTouch, SystemEventType } from 'cc';
import { OrbitCamera } from './orbitCamera';
const { ccclass, property } = _decorator;

@ccclass('OrbitCameraInputTouch')
export class OrbitCameraInputTouch extends Component {
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
    
    fromWorldPoint = new math.Vec3();
    toWorldPoint = new math.Vec3();
    worldDiff = new math.Vec3();
    pinchMidPoint = new math.Vec2();
    lastTouchPoint = new math.Vec2();
    lastPinchMidPoint = new math.Vec2();
    lastPinchDistance = 0;
    startPos = new math.Vec2();
    endPos = new math.Vec2();
    touch1Pos = new math.Vec2();
    touch2Pos = new math.Vec2();

    start () {
        // Your initialization goes here.
    }

    onEnable () {
		this._addEvents();
	}

	onDisable () {
        this._removeEvents();
    }
    
    private _addEvents () {
		systemEvent.on(SystemEvent.EventType.TOUCH_START, this.onTouchStartEndCancel, this);
		systemEvent.on(SystemEvent.EventType.TOUCH_MOVE, this.onTouchMove, this);
		systemEvent.on(SystemEvent.EventType.TOUCH_END, this.onTouchStartEndCancel, this);
        systemEvent.on(SystemEvent.EventType.TOUCH_CANCEL, this.onTouchStartEndCancel, this);
	}

	private _removeEvents () {
		systemEvent.off(SystemEvent.EventType.TOUCH_START, this.onTouchStartEndCancel, this);
		systemEvent.off(SystemEvent.EventType.TOUCH_MOVE, this.onTouchMove, this);
		systemEvent.off(SystemEvent.EventType.TOUCH_END, this.onTouchStartEndCancel, this);
        systemEvent.off(SystemEvent.EventType.TOUCH_CANCEL, this.onTouchStartEndCancel, this);
    }
    
    getPinchDistance (pointA, pointB) {
        // Return the distance between the two points
        var dx = pointA.x - pointB.x;
        var dy = pointA.y - pointB.y;
    
        return Math.sqrt((dx * dx) + (dy * dy));
    }
    
    calcMidPoint (pointA, pointB, result) {
        result.set(pointB.x - pointA.x, pointB.y - pointA.y);
        result.scale(0.5);
        result.x += pointA.x;
        result.y += pointA.y;
    }
    
    onTouchStartEndCancel (t: Touch, event: EventTouch) {
        // We only care about the first touch for camera rotation. As the user touches the screen,
        // we stored the current touch position
        // console.log(event.type);
        var touches = event.getTouches();
        if (touches.length == 1) {
            //this.lastTouchPoint.set(touches[0].x, touches[0].y);
            if (event.type === SystemEventType.TOUCH_START) {
                this.lastPinchDistance = null;    //对于多点触控可能会导致获取数据异常
            }
        } else if (touches.length == 2) {
            // If there are 2 touches on the screen, then set the pinch distance
            touches[0].getLocation(this.touch1Pos);
            touches[1].getLocation(this.touch2Pos);
            this.lastPinchDistance = this.getPinchDistance(this.touch1Pos, this.touch2Pos);
            this.calcMidPoint(this.touch1Pos, this.touch2Pos, this.lastPinchMidPoint);

            // console.log(event.type, this.touch1Pos, this.touch2Pos, this.lastPinchDistance);
        }
    };
    
    
    pan (midPoint) {
        // var fromWorldPoint = this.fromWorldPoint;
        // var toWorldPoint = this.toWorldPoint;
        // var worldDiff = this.worldDiff;
    
        // // For panning to work at any zoom level, we use screen point to world projection
        // // to work out how far we need to pan the pivotEntity in world space
        // var distance = this.orbitCamera.distance;
    
        // this.camera.screenToWorld(new math.Vec3(midPoint.x, midPoint.y, distance), fromWorldPoint);
        // this.camera.screenToWorld(new math.Vec3(this.lastPinchMidPoint.x, this.lastPinchMidPoint.y, distance), toWorldPoint);
    
        // math.Vec3.subtract(worldDiff, toWorldPoint, fromWorldPoint);
    
        // this.orbitCamera.pivotPoint.add(worldDiff);
    };
    
    
    onTouchMove (t: Touch, event: EventTouch) {
        if (this.orbitCamera.isLock) {
            return;
        }

        var pinchMidPoint = this.pinchMidPoint;
    
        // We only care about the first touch for camera rotation. Work out the difference moved since the last event
        // and use that to update the camera target position
        var touches = event.getTouches();
        if (touches.length == 1) {
            var touch = touches[0];
            touch.getPreviousLocation(this.startPos);
            touch.getLocation(this.endPos);
            this.orbitCamera.pitch -= (this.startPos.y - this.endPos.y) * this.orbitSensitivity;
            this.orbitCamera.yaw -= (this.endPos.x - this.startPos.x) * this.orbitSensitivity;
            // this.orbitCamera.pitch -= (touch.y - this.lastTouchPoint.y) * this.orbitSensitivity;
            // this.orbitCamera.yaw -= (touch.x - this.lastTouchPoint.x) * this.orbitSensitivity;
    
            // this.lastTouchPoint.set(touch.x, touch.y);

            console.log("onTouchMove1", "this.orbitCamera.pitch: ", this.orbitCamera.pitch, "this.orbitCamera.yaw: ",this.orbitCamera.yaw );
    
        } else if (touches.length == 2) {
            // Calculate the difference in pinch distance since the last event
            touches[0].getLocation(this.touch1Pos);
            touches[1].getLocation(this.touch2Pos);
            
            var currentPinchDistance = this.getPinchDistance(this.touch1Pos, this.touch2Pos);
            var diffInPinchDistance = 0;
            if (this.lastPinchDistance !== null) {
                diffInPinchDistance = currentPinchDistance - this.lastPinchDistance;
            }

            // console.log("move:", this.touch1Pos, this.touch2Pos, currentPinchDistance, this.lastPinchDistance, diffInPinchDistance);
            this.lastPinchDistance = currentPinchDistance;
    
            this.orbitCamera.distance -= (diffInPinchDistance * this.distanceSensitivity * 0.1) * (this.orbitCamera.distance * 0.1);
    
            // Calculate pan difference
            this.calcMidPoint(this.touch1Pos, this.touch2Pos, pinchMidPoint);
            this.pan(pinchMidPoint);
            math.Vec2.copy(this.lastPinchMidPoint, pinchMidPoint);

            console.log("onTouchMove2");
        }
    };

    // update (deltaTime: number) {
    //     // Your update function goes here.
    // }
}
