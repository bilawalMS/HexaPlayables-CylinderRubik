import { _decorator, Component, Node, tween, AudioSource, Vec3, UIOpacity } from 'cc';
import { Gameplay } from './Gameplay';
import { SoundManager } from './SoundManager';
import { easing } from 'cc';

const { ccclass, property } = _decorator;

@ccclass('GameSettings')
export class GameSettings extends Component {

    @property(Node)
    settingsButton: Node = null;

    @property(Node)
    musicButton: Node = null;

    @property(Node)
   muteIcon: Node = null;

    @property(Node)
    restartButton: Node = null;

    @property(Gameplay)
    gameplay: Gameplay = null;

    @property(Node)
    whiteFlash: Node = null;

    private isSettingsToggle: boolean = false;

    private musicButtonPosition: Vec3;
    private restartButtonPosition: Vec3;

    private isMute: boolean;



    onLoad() {
        this.musicButtonPosition = this.musicButton.getPosition();
        this.restartButtonPosition = this.restartButton.getPosition();
        this.restartButton.active = false;
        this.musicButton.active = false;
        this.isMute = false;
        this.muteIcon.active = false;
    }


 
    toggleSettings() {

        SoundManager.instance.playButtonPress();

        if (!this.isSettingsToggle) {

            tween(this.musicButton)
                .call(() => {
                    this.musicButton.setPosition(0, 0, 0);
                    this.musicButton.active = true;
                })
                .to(0.2, { position: new Vec3(this.musicButtonPosition) }, { easing: 'circOut' })
                .start();

            tween(this.restartButton)
                .call(() => {
                    this.restartButton.setPosition(0, 0, 0);
                    this.restartButton.active = true;
                })
                .to(0.2, { position: new Vec3(this.restartButtonPosition) }, { easing: 'circOut' })
                .start();

            this.isSettingsToggle = true;

        }
        else if (this.isSettingsToggle){

            tween(this.musicButton)
                .call(() => {
                    this.musicButton.setPosition(this.musicButtonPosition);
                })
                .to(0.2, { position: new Vec3(0, 0, 0) }, { easing: 'circIn' })
                .call(() => {
                    this.musicButton.active = false;
                })
                .start();

            tween(this.restartButton)
                .call(() => {
                    this.restartButton.setPosition(this.restartButtonPosition);
                })
                .to(0.2, { position: new Vec3(0, 0, 0) }, { easing: 'circIn' })
                .call(() => {
                    this.restartButton.active = false;
                })
                .start();

            this.isSettingsToggle = false;
        }
    }


    toggleMusic() {
        if (!this.muteIcon.active) {
            SoundManager.instance.pauseAllSounds();
            this.muteIcon.active = true;
        }
        else if (this.muteIcon.active) {
            SoundManager.instance.restartAllSounds();
            this.muteIcon.active = false;
        }
    }

    restartLevel() {

        this.whiteFlash.active = true;

        const opacityComp = this.whiteFlash.getComponent(UIOpacity);
        opacityComp.opacity = 0;

        tween(opacityComp)
            .to(0.1, { opacity: 255 }) 
            .to(0.7, { opacity: 0 }) 
            .start();

        this.gameplay.restart();

    }

    onMusicButtonClick() {
        this.toggleMusic();
    }

    onRestartButtonClick() {
        this.restartLevel();
    }
}
