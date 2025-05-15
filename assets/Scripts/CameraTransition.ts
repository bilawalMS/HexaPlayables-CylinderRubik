import { _decorator, Component, Node, tween, Vec3, Quat, Camera, lerp } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('CameraTransition')
export class CameraTransition extends Component {

    @property(Node)
    camera: Node = null; // The camera node that will be transitioned

    private cameraComponent: Camera = null; // Camera component reference

    private endPosition: Vec3;
    private endRotation: Vec3;
    private endOrtho: number;

    onLoad() {
        this.cameraComponent = this.camera.getComponent(Camera);
    }

    // Method to set the starting position, rotation, and orthographic height of the camera
    cameraStartPos(position: Vec3, rotation: Vec3, ortho: number) {
        this.camera.setPosition(position);
        const startRotationQuat = new Quat();
        Quat.fromEuler(startRotationQuat, rotation.x, rotation.y, rotation.z);
        this.camera.setRotation(startRotationQuat);
        this.cameraComponent.orthoHeight = ortho;
    }

    // Method to store the end position, rotation, and ortho height
    cameraEndPos(position: Vec3, rotation: Vec3, ortho: number) {
        this.endPosition = position;
        this.endRotation = rotation;
        this.endOrtho = ortho;
    }



    // Method to transition the camera from the start position to the target position
    transitionToEndPosition() {
        // Convert the end rotation to Quat
        const endRotationQuat = new Quat();
        Quat.fromEuler(endRotationQuat, this.endRotation.x, this.endRotation.y, this.endRotation.z);

        // Tween the camera to the target position and rotation
        tween(this.camera)
            .to(1, { position: this.endPosition, rotation: endRotationQuat }, { easing: 'smooth' })
            .start();

        // Tween the camera's orthographic height
        tween(this.cameraComponent)
            .to(1, { orthoHeight: this.endOrtho }, { easing: 'smooth' })
            .start();
    }
}
