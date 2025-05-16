import { _decorator, Color, Component, Graphics, Node, Vec2 } from 'cc';
import { BezierPosition, Curve } from 'db://easy-p2d/Scripts/Modules/Curve';
const { ccclass, property } = _decorator;

@ccclass('CurveTest')
export class CurveTest extends Component {
    @property(Graphics)
    graphics: Graphics = null!;

    @property({type:[BezierPosition]})
    poses: BezierPosition[] = [];

    private bezierCurve: Curve = new Curve();
    start() {
        // curve test data
        this.bezierCurve.reset(this.poses);

        this.graphics.moveTo(0, 0);
        this.graphics.strokeColor = Color.RED;
        this.graphics.lineWidth = 3;

        const p1 = this.bezierCurve.getPoint(0.5);
        console.log(p1);
        this.graphics.circle(p1.x, p1.y, 10);
        this.graphics.stroke();

        const count = 10;
        for(let i = 0; i < count; i++) {
            const p = this.bezierCurve.getPoint(i / count);
            if(i==0) {
                this.graphics.moveTo(p.x, p.y);
            }else{
                this.graphics.lineTo(p.x, p.y);
            }
        }
        this.graphics.stroke();
    }

    update(deltaTime: number) {
        
    }
}

