
import { _decorator, Component, Node, LabelComponent } from 'cc';
import { ChooseUI } from './chooseUI';
const { ccclass, property } = _decorator;

@ccclass('Item')
export class Item extends Component {
    parent: ChooseUI;
    txt: number;
    // [1]
    // dummy = '';

    // [2]
    // @property
    // serializableDummy = 0;

    start () {
        // [3]
    }

    show(parent: ChooseUI, txt: string) {
        this.parent = parent;
        this.txt = txt;
        this.node.getComponent(LabelComponent).string = txt;
    }

    onBtnClick() {
        this.parent.showFBX(this.txt);
    }

    // update (deltaTime: number) {
    //     // [4]
    // }
}

/**
 * [1] Class member could be defined like this.
 * [2] Use `property` decorator if your want the member to be serializable.
 * [3] Your initialization goes here.
 * [4] Your update function goes here.
 *
 * Learn more about scripting: https://docs.cocos.com/creator/3.0/manual/en/scripting/
 * Learn more about CCClass: https://docs.cocos.com/creator/3.0/manual/en/scripting/ccclass.html
 * Learn more about life-cycle callbacks: https://docs.cocos.com/creator/3.0/manual/en/scripting/life-cycle-callbacks.html
 */
