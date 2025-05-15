import { _decorator, Button, Color, Component, instantiate, Label, Node, Prefab, Sprite } from 'cc';
import { Utils } from './Utils';
const { ccclass, property } = _decorator;

@ccclass('DownloadButton')
export class DownloadButton extends Component {
    onClick() {
        console.log("loading store");
        //@ts-ignore
        window.super_html && (super_html.appstore_url = Utils.appStore);
        //@ts-ignore
        window.super_html && (super_html.google_play_url = Utils.googlePlay);
        //@ts-ignore
        window.super_html && super_html.download();
    }

    gameEnd() {
        console.log("game end");
        //@ts-ignore
        window.super_html && super_html.game_end();
    }
}