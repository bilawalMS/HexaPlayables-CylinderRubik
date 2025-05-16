import { _decorator, Component } from 'cc';
import { EasyP2D } from 'db://easy-p2d/Scripts/EasyP2D';
const { ccclass, property, executeInEditMode } = _decorator;

@ccclass('PlayEffect')
@executeInEditMode
export class PlayEffect extends Component {
    @property
    public interval = 3;

    @property(EasyP2D)
    public attackP2D: EasyP2D = null!;

    private _timer = 0;
    protected update(dt: number) {
        this._timer += dt;
        if (this._timer >= this.interval) {
            this._timer = 0;
            this.attackP2D.replay();
        }
    }
}


