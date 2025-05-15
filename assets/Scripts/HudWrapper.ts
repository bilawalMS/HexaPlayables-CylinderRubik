import { _decorator, Component, Node, Label, ProgressBar, Vec3, Quat, Widget } from 'cc';
import { TImer } from './TImer'; // Ensure Timer is imported correctly

const { ccclass, property } = _decorator;

@ccclass('HudWrapper')
export class HudWrapper extends Component {

    // ─────────────────────────── Items ───────────────────────────

    @property({ group: { name: "Items", id: "items"}, type: TImer})
    timer: TImer = null;

    @property({ group: { name: "Items", id: "items"}, type: Node})
    timerGroup: Node = null;

    @property({ group: { name: "Items", id: "items"}, type: Node})
    clockGroup: Node = null;

    @property({ group: { name: "Items", id: "items"}, type: Node})
    progressBar: Node = null;
    
    @property({ group: { name: "Items", id: "items"}, type: Node})
    ProgressText: Node = null;
   
    @property({ group: { name: "Items", id: "items"}, type: Node})
    goalIcon: Node = null;

    @property({ group: { name: "Items", id: "items"}, type: Node})
    playBtn: Node = null;

    @property({ group: { name: "Items", id: "items"}, type: Node})
    mindLogo: Node = null;

    @property({ group: { name: "Items", id: "items"}, type: Node})
    hexLogo: Node = null;
    
    @property({ group: { name: "Items", id: "items"}, type: Node})
    textTutorial: Node = null;

    @property({ group: { name: "Items", id: "items"}, type: Node})
    hudParticlesNode: Node = null;

    @property({ group: { name: "Items", id: "items"}, type: Node})
    brainImage: Node = null;

    @property({ group: { name: "Items", id: "items"}, type: Node})
    brainTitle: Node = null;

    @property({ group: { name: "Items", id: "items"}, type: Node})
    brainText: Node = null;



    // ─────────────────────────── Portrait ───────────────────────────

    @property({ group: { name: "UI portrait", id: "ui_portrait"}, type: Node})
    timerpositionport: Node = null;

    @property({ group: { name: "UI portrait", id: "ui_portrait"}, type: Node})
    clockpositionport: Node = null; 

    @property({ group: { name: "UI portrait", id: "ui_portrait"}, type: Node})
    ProgressBarpositionport: Node = null;

    @property({ group: { name: "UI portrait", id: "ui_portrait"}, type: Node})
    ProgressTextpositionport: Node = null; 

    @property({ group: { name: "UI portrait", id: "ui_portrait"}, type: Node})
    goalTilepositionport: Node = null; 

    @property({ group: { name: "UI portrait", id: "ui_portrait"}, type: Node})
    playBtnPort: Node = null;

    @property({ group: { name: "UI portrait", id: "ui_portrait"}, type: Node})
    mindLogoPort: Node = null; 

    @property({ group: { name: "UI portrait", id: "ui_portrait"}, type: Node})
    hexLogoPort: Node = null; 

    @property({ group: { name: "UI portrait", id: "ui_portrait"}, type: Node})
    textTutorialPort: Node = null; 

    @property({ group: { name: "UI portrait", id: "ui_portrait"}, type: Node})
    hudParticlesNodePort: Node = null; 

    @property({ group: { name: "UI portrait", id: "ui_portrait"}, type: Node})
    brainAgeBGPort: Node = null;

    @property({ group: { name: "UI portrait", id: "ui_portrait"}, type: Node})
    brainImagePort: Node = null;

    @property({ group: { name: "UI portrait", id: "ui_portrait"}, type: Node})
    brainTitlePort: Node = null;

    @property({ group: { name: "UI portrait", id: "ui_portrait"}, type: Node})
    brainTextPort: Node = null;


    // ─────────────────────────── Landscape ───────────────────────────

    @property({ group: { name: "UI Landscape", id: "ui_landscape"}, type: Node})
    timerpositionLand: Node = null;

    @property({ group: { name: "UI Landscape", id: "ui_landscape"}, type: Node})
    clockpositionLand: Node = null; 

    @property({ group: { name: "UI Landscape", id: "ui_landscape"}, type: Node})
    ProgressBarpositionLand: Node = null;

    @property({ group: { name: "UI Landscape", id: "ui_landscape"}, type: Node})
    ProgressTextpositionLand: Node = null; 

    @property({ group: { name: "UI Landscape", id: "ui_landscape"}, type: Node})
    goalTilepositionLand: Node = null; 

    @property({ group: { name: "UI Landscape", id: "ui_landscape"}, type: Node})
    playBtnLand: Node = null; 

    @property({ group: { name: "UI Landscape", id: "ui_landscape"}, type: Node})
    mindLogoLand: Node = null; 

    @property({ group: { name: "UI Landscape", id: "ui_landscape"}, type: Node})
    hexLogoLand: Node = null; 

    @property({ group: { name: "UI Landscape", id: "ui_landscape"}, type: Node})
    textTutorialLand: Node = null; 

    @property({ group: { name: "UI Landscape", id: "ui_landscape"}, type: Node})
    hudNodeParticlesLand: Node = null; 

    @property({ group: { name: "UI Landscape", id: "ui_landscape"}, type: Node})
    brainAgeBGLand: Node = null;

    @property({ group: { name: "UI Landscape", id: "ui_landscape"}, type: Node})
    brainImageLand: Node = null;

    @property({ group: { name: "UI Landscape", id: "ui_landscape"}, type: Node})
    brainTitleLand: Node = null;

    @property({ group: { name: "UI Landscape", id: "ui_landscape"}, type: Node})
    brainTextLand: Node = null;


    isTimerStart: boolean = false;
    timerEndHandled: boolean = false;

    // ─────────────────────────── Code Logics ───────────────────────────

    timerStart() {
        this.isTimerStart = true;
        this.timerEndHandled = false;
        this.timer.startTImer();
    }

    timerStop() {
        this.isTimerStart = false;
        this.timer.stopTimer();
    }

    isTimerEnds(): boolean {
        return this.getActiveTimer().isTimerEnds();
    }

    handleTimerEnd() {
        this.timerEndHandled = true;
        this.timerStop();
    }

    private getActiveTimer(): TImer {
        return this.timer.node.active ? this.timer : null;
    }

    portraitTransform() {
        this.clockGroup.setParent(this.clockpositionport);
        this.timerGroup.setParent(this.timerpositionport);
        this.progressBar.setParent(this.ProgressBarpositionport);
        this.ProgressText.setParent(this.ProgressTextpositionport);
        this.goalIcon.setParent(this.goalTilepositionport);
        this.playBtn.setParent(this.playBtnPort);
        this.mindLogo.setParent(this.mindLogoPort);
        this.hexLogo.setParent(this.hexLogoPort);
        this.textTutorial.setParent(this.textTutorialPort);
        this.hudParticlesNode.setParent(this.hudParticlesNodePort);
        this.brainImage.setParent(this.brainImagePort);
        this.brainTitle.setParent(this.brainTitlePort);
        this.brainText.setParent(this.brainTextPort);
        this.brainAgeBGPort.active = true;
        this.brainAgeBGLand.active = false;
  
    }

    landscapeTransform() {
        this.clockGroup.setParent(this.clockpositionLand);
        this.timerGroup.setParent(this.timerpositionLand);
        this.progressBar.setParent(this.ProgressBarpositionLand);
        this.ProgressText.setParent(this.ProgressTextpositionLand);
        this.goalIcon.setParent(this.goalTilepositionLand);
        this.playBtn.setParent(this.playBtnLand);
        this.mindLogo.setParent(this.mindLogoLand);
        this.hexLogo.setParent(this.hexLogoLand);
        this.textTutorial.setParent(this.textTutorialLand);
        this.hudParticlesNode.setParent(this.hudNodeParticlesLand);
        this.brainImage.setParent(this.brainImageLand);
        this.brainTitle.setParent(this.brainTitleLand);
        this.brainText.setParent(this.brainTextLand);
        this.brainAgeBGPort.active = false;
        this.brainAgeBGLand.active = true;

    }
}


