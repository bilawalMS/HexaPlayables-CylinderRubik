import { _decorator, AudioSource, Component, AudioClip, input, Input, EventMouse, EventTouch, director } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('sound')
export class sound extends Component {

    @property(AudioSource)
    private _audioSource: AudioSource = null;

    private hasStarted: boolean = false;  // Flag to ensure music starts only once

    onLoad() {
        const audioSource = this.getComponent(AudioSource)!;
        this._audioSource = audioSource;
        director.addPersistRootNode(this.node); // Make the node persist across scenes

        // Register the event listener for the first click or touch
        input.on(Input.EventType.MOUSE_DOWN, this.startMusic, this);
        input.on(Input.EventType.TOUCH_START, this.startMusic, this);
    }

    startMusic(event: EventMouse | EventTouch) {
        // Start music on the first click or touch, if not already started
        if (!this.hasStarted && this._audioSource) {
            this._audioSource.loop = true;  // Loop the background music
            this._audioSource.play();       // Start playing the music
            this.hasStarted = true;         // Ensure music only starts once

            // Remove event listeners to prevent repeated calls
            input.off(Input.EventType.MOUSE_DOWN, this.startMusic, this);
            input.off(Input.EventType.TOUCH_START, this.startMusic, this);
        }
    }

    onDestroy() {
        // Clean up event listeners if the component is destroyed
        input.off(Input.EventType.MOUSE_DOWN, this.startMusic, this);
        input.off(Input.EventType.TOUCH_START, this.startMusic, this);
    }
}
