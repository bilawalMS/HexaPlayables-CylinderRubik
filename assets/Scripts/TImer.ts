import { CCInteger } from 'cc';
import { UIOpacity } from 'cc';
import { ProgressBar } from 'cc';
import { SoundManager } from './SoundManager';

import { Label } from 'cc';
import { _decorator, Component, Node, Color, tween, Vec3, AudioSource, AudioClip } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('TImer')
export class TImer extends Component {


    @property({ group: { name: "Landscape", id: "landscape" } })
    timerGroup: Node = null;

    @property({ group: { name: "Landscape", id: "landscape" } })
    timerTitle: Label = null;

    @property({ group: { name: "Landscape", id: "landscape" } })
    timerDigit: Label = null;

    @property({ group: { name: "Landscape", id: "landscape" } })
    clockPin: Node = null;

    @property({ group: { name: "Landscape", id: "landscape" } })
    ClockFill: ProgressBar = null;

    @property(CCInteger)
    timeLimit: number = 60;
    
    
    @property(UIOpacity)
    vignattEEffect: UIOpacity = null;

    
    private timeRemaining: number = this.timeLimit * 60;
    private isAlertTime: boolean = false;
    private alertTween: any = null; // Store the tween instance
    private vignetteTween: any = null; // Store the tween instance
    private timerStarted: boolean = false;


    private timerOrignalScale: Vec3 = new Vec3();


    startTImer() {
        this.timerOrignalScale.set(this.timerGroup.scale);
        this.timeRemaining = this.timeLimit;
        this.startClockRotation();
        this.schedule(this.updateTimer, 1);
        this.timerStarted = true;
       
        
    }

    updateTimer() {
        if (this.timeRemaining > 0) {
            this.timeRemaining--;
            this.timerDigit.string = this.timeRemaining.toString() + " : 00";
            SoundManager.instance.playTraySpawn();
            
            if (this.timeRemaining === 10 && !this.isAlertTime) {
                this.isAlertTime = true;
                this.startAlertTween();
                this.animateVignetteEffect();
            }

            if (this.timeRemaining === 0) {
                this.unschedule(this.updateTimer);
                this.stopAlertTween();
                this.timerStarted = false;
            }

        } else {
            this.unschedule(this.updateTimer);
            this.timerStarted = false;
        }

    }

    stopTimer() {
        this.unschedule(this.updateTimer);
        this.stopAlertTween();
        this.timerStarted = false;
    }

    isTimerStarted(): boolean {
        return this.timerStarted;
    }

    isTimerEnds(): boolean {
        return this.timeRemaining <= 0;
    }

    startAlertTween() {
        // Change text color
        this.timerDigit.color = new Color(255, 0, 0);
        this.timerTitle.color = new Color(255, 0, 0);

        const duration = 0.3;
        const scaleUpFactor = 1.1;

        // Start tween effect
        this.alertTween = tween(this.timerGroup)
            .repeatForever(
                tween()
                .call(() => {SoundManager.instance.playBuzzerSound();})
                    .to(duration, { scale: this.timerOrignalScale.clone().multiplyScalar(scaleUpFactor) }, { easing: 'smooth' }) // Scale up
                    .to(duration, { scale: this.timerOrignalScale.clone() }, { easing: 'smooth' }) // Scale back to original
            )
            .start();

            
    }

    stopAlertTween() {
        if (this.alertTween) {
            this.alertTween.stop();
            this.alertTween = null;
        }
        // Reset scale to avoid remaining at a scaled state
        this.timerGroup.setScale(this.timerOrignalScale);

            // Stop vignette tween
        if (this.vignetteTween) {
            this.vignetteTween.stop();
            this.vignetteTween = null;
        }
        if (this.vignattEEffect) {
            if(this.timeRemaining > 0){
                this.vignattEEffect.opacity = 0; // Reset opacity to full
            }
            else{
                this.vignattEEffect.opacity = 255; // Reset opacity to full
            }
            
        }



    }

    startClockRotation() {
        if (this.clockPin) {
            tween(this.clockPin)
                .by(this.timeLimit, { eulerAngles: new Vec3(0, 0, -360) }) // Complete 360-degree rotation
                .start();
        }
        if (this.ClockFill) {
            tween(this.ClockFill)
                .to(this.timeLimit, { progress: 1 }) // Fill the progress bar over the time limit
                .start();
        }
    }

    animateVignetteEffect() {
        if (this.vignattEEffect) {
            this.vignetteTween =  tween(this.vignattEEffect)
                // Initial sequence
                .to(0.5, { opacity: 50 })
                .to(0.5, { opacity: 30 })
                .to(0.5, { opacity: 100 })
                .to(0.4, { opacity: 50 })
                .to(0.4, { opacity: 150 })
                .to(0.4, { opacity: 100 })
                .to(0.4, { opacity: 200 })
                .to(0.4, { opacity: 150 })
                .to(0.4, { opacity: 255 })
                // After reaching 255, start repeating between 100 and 255
                .call(() => {
                    this.vignetteTween = tween(this.vignattEEffect)
                        .repeatForever(
                            tween()
                                .to(0.3, { opacity: 100 }) // Fade to 100
                                .to(0.3, { opacity: 255 }) // Fade back to 255
                        )
                        .start();
                })
                .start();
        }
    }


}


