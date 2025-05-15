import { _decorator, AudioSource, Component, AudioClip, input, Input, EventMouse, EventTouch, director } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('SoundManager')
export class SoundManager extends Component {

    static instance: SoundManager;

    @property(AudioClip)
    tilePick: AudioClip = null;

    @property(AudioClip)
    tileDrop: AudioClip = null;

    @property(AudioClip)
    tileStack: AudioClip = null;

    @property(AudioClip)
    tileMerge: AudioClip = null;

    @property(AudioClip)
    particleHud: AudioClip = null;

    @property(AudioClip)
    levelCompleted: AudioClip = null;

    @property(AudioClip)
    levelFail: AudioClip = null;

    @property(AudioClip)
    buttonPress: AudioClip = null;

    @property(AudioClip)
    traySpawn: AudioClip = null;

    @property(AudioClip)
    backgroundMusic: AudioClip = null;

    @property(AudioClip)
    metaReveal: AudioClip = null;

    @property(AudioClip)
    metaFill: AudioClip = null;

    @property(AudioClip)
    metaComplete: AudioClip = null;

    @property(AudioClip)
    metaSpawn: AudioClip = null;

    @property(AudioClip)
    playButton: AudioClip = null;

    @property(AudioClip)
    buzzerSound: AudioClip = null;

    private audioSource: AudioSource = null;
    private pausedClips: AudioClip[] = [];

    private hasStarted: boolean = false;

    private isMute: boolean = false;

    private sounds: AudioClip[] = [];

    start() {
        SoundManager.instance = this;

        this.sounds = [
            this.tilePick,
            this.tileDrop,
            this.tileStack,
            this.tileMerge,
            this.particleHud,
            this.levelCompleted,
            this.levelFail,
            this.backgroundMusic,
            this.traySpawn,
            this.buttonPress,
            this.metaReveal,
            this.metaFill,
            this.metaSpawn,
            this.metaComplete,
            this.playButton,
            this.buzzerSound
        ];
    }

    onLoad() {
        this.audioSource = this.getComponent(AudioSource);

        director.addPersistRootNode(this.node); // Make the node persist across scenes
        input.on(Input.EventType.MOUSE_DOWN, this.startBackgroundMusic, this);
        input.on(Input.EventType.TOUCH_START, this.startBackgroundMusic, this);
    }


    playTilePick() {
        if (!this.isMute) {
            this.playAudio(this.tilePick);
        }     
    }

    playTileDrop() {
        if (!this.isMute) {
            this.playAudio(this.tileDrop);
        }
    }

    playTileStack() {
        if (!this.isMute) {
            this.playAudio(this.tileStack);
        }
    }

    playTileMerge() {
        if (!this.isMute) {
            this.playAudio(this.tileMerge);
        }
       
    }

    playParticleHud() {
        if (!this.isMute) {
            this.playAudio(this.particleHud);
        }
    }

    playLevelCompleted() {
        if (!this.isMute) {
            this.playAudio(this.levelCompleted);
        }
    }

    playLevelFail() {
        if (!this.isMute) {
            this.playAudio(this.levelFail);
        }
    }

    playButtonPress() {
        if (!this.isMute) {
            this.playAudio(this.buttonPress);
        }
    }

    playTraySpawn() {
        if (!this.isMute && this.hasStarted) {
            this.playAudio(this.traySpawn);
        }
    }

    playMetaFill() {
        if (this.audioSource && this.metaFill) { // Ensure `metaFillSound` is defined
            this.audioSource.clip = this.metaFill;
            this.audioSource.loop = true; // Set to loop
            this.audioSource.play();
        }
    }

    stopMetaFill() {
        if (this.audioSource) {
            this.audioSource.stop(); // Stop the audio source
        }
    }

    playMetaComplete() {
        if (!this.isMute && this.hasStarted) {
            this.playAudio(this.metaComplete);
        }
    }
    playMetaSpawn() {
        if (!this.isMute && this.hasStarted) {
            this.playAudio(this.metaSpawn);
        }
    }
    playMetaReveal() {
        if (!this.isMute && this.hasStarted) {
            this.playAudio(this.metaReveal);
        }
    }
    playNextButton() {
        if (!this.isMute && this.hasStarted) {
            this.playAudio(this.playButton);
        }
    }

    playBuzzerSound() {
        if (!this.isMute && this.hasStarted) {
            this.playAudio(this.buzzerSound);
        }
    }


    startBackgroundMusic(event?: EventMouse | EventTouch) {
        if (!this.hasStarted && this.backgroundMusic && !this.isMute) {
            this.backgroundMusic.setLoop(true);
            this.backgroundMusic.play();
            this.backgroundMusic.setVolume(0.4);
            this.hasStarted = true;
        }
    }

    stopAudio() {
        if (this.audioSource) {
            this.audioSource.stop();
        }
    }

    private playAudio(clip: AudioClip) {
        if (this.audioSource && clip) {
            this.audioSource.clip = clip;
            this.audioSource.play();
            this.audioSource.loop = false;

        } 
    }

    pauseAllSounds() {
        this.sounds.forEach(sound => {
            if (sound) {
                sound.setVolume(0);
            }
        });
        this.isMute = true;
       
    }

    restartAllSounds() {
        this.sounds.forEach(sound => {
            if (sound) {
                sound.setVolume(1);
            }
        });
        this.isMute = false;
  
    }

    onDestroy() {
        // Clean up event listeners if the component is destroyed
        input.off(Input.EventType.MOUSE_DOWN, this.startBackgroundMusic, this);
        input.off(Input.EventType.TOUCH_START, this.startBackgroundMusic, this);
    }
}