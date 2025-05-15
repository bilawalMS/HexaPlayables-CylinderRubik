import { _decorator, Vec3, log } from 'cc';

const { ccclass, property } = _decorator;

export type HexCoordinate = { row: number, col: number };

@ccclass('Utils')
export class Utils {
    static zDelta: number = 0.95;
    static xDelta: number = 1.6454;
    static hexY: number = 0.45;  // Tile hight up 

    static mergeDelay = 0.05;
    static mergeTime = 0.25;

    static flipUp = 0.2;
    static flipAir = 0.0;
    static flipDown = 0.2;
    static flipHeight = 10;

    static flipTime = 0.15;
    static flipDelay = 0.05;
    static mergeTarget = 10;
    
    static isSip = false;
    static storeRedirectScoreDelta = 50;
    static googlePlay = 'https://play.google.com/store/apps/details?id=com.gamebrain.hexasort';
    static appStore = 'https://apps.apple.com/us/app/hexa-sort/id6463127238';

    static interactionStartEventSent: boolean = false;
    static interactionCompleteEventSent: boolean = false;
    static levelCompleteEventSent: boolean = false;

    static storeRedirect() {
        Utils.redirectEvent();

        //@ts-ignore
        window.super_html && (super_html.appstore_url = Utils.appStore);
        //@ts-ignore
        window.super_html && (super_html.google_play_url = Utils.googlePlay);
        //@ts-ignore
        window.super_html && super_html.download();

        log("store");
    }

    static interactionStartEvent() { //STARTED
        if (Utils.interactionStartEventSent) {
            return;
        }
        Utils.interactionStartEventSent = true;
        //@ts-ignore
        if (typeof window.ALPlayableAnalytics != 'undefined') {
            //@ts-ignore
            window.ALPlayableAnalytics.trackEvent('STARTED')
        }
    }
    static interactionCompleteEvent() { //COMPLETED
        if (Utils.interactionCompleteEventSent) {
            return;
        }
        Utils.interactionCompleteEventSent = true;
        //@ts-ignore
        if (typeof window.ALPlayableAnalytics != 'undefined') {
            //@ts-ignore
            window.ALPlayableAnalytics.trackEvent('COMPLETED')
        }
    }
    static redirectEvent() { //REDIRECT
        //@ts-ignore
        if (typeof window.ALPlayableAnalytics != 'undefined') {
            //@ts-ignore
            window.ALPlayableAnalytics.trackEvent('REDIRECT')
        }
    }
    static levelCompleteEvent() { //CHALLENGE_SOLVED
        if (Utils.levelCompleteEventSent) {
            return;
        }
        Utils.levelCompleteEventSent = true;
        //@ts-ignore
        if (typeof window.ALPlayableAnalytics != 'undefined') {
            //@ts-ignore
            window.ALPlayableAnalytics.trackEvent('CHALLENGE_SOLVED')
        }
    }

    static positionFromIndex(row: number, col: number) : Vec3 {
        let z = row * Utils.zDelta * 2;
        const zOffset = (col % 2 === 0) ? 0 : Utils.zDelta;
        z += zOffset;
        let x = col * Utils.xDelta;
        return new Vec3(x, Utils.hexY * 0.5, z);
    }

    static indexFromPosition(pos: Vec3) : {row: number, col: number} {
        let posx = pos.x / this.xDelta;
        let col = Math.round(posx);
        
        let posz = pos.z;
        if (Math.abs(col % 2) === 1) {
            posz -= this.zDelta;
        }
        let row = Math.round(posz / (2 * this.zDelta));
        return { row: row, col: col };
    }

    static getHexNeighbours(hex: HexCoordinate): HexCoordinate[] {
        const evenColumnOffsets: HexCoordinate[] = [
            { row: -1, col: -1}, //top left
            { row: -1, col: 0}, //top
            { row: -1, col: 1}, //top right
            { row: 0, col: -1}, //bottom left
            { row: 0, col: 1}, //bottom right
            { row: 1, col: 0}, //bottom
        ];
    
        const oddColumnOffsets: HexCoordinate[] = [
            { row: 0, col: -1}, //top left
            { row: -1, col: 0}, //top
            { row: 0, col: 1}, //top right
            { row: 1, col: -1}, //bottom left
            { row: 1, col: 1}, //bottom right
            { row: 1, col: 0}, //bottom
        ];
    
        const isEvenColumn = hex.col % 2 === 0;
        const neighborOffsets = isEvenColumn ? evenColumnOffsets : oddColumnOffsets;
    
        const neighbors: HexCoordinate[] = [];
    
        for (let offset of neighborOffsets) {
            const neighbor = {
                row: hex.row + offset.row,
                col: hex.col + offset.col,
            };
            if (neighbor.row >= 0 && neighbor.col >= 0) {
                neighbors.push(neighbor);
            }
        }
    
        return neighbors;
    }
}

