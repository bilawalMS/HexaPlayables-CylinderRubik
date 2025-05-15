import {
    _decorator, Component, instantiate, Prefab, Vec3, tween, randomRangeInt,
    CCInteger, Tween, math, v3, Vec4, MeshRenderer, Material, Color, log, geometry, find, Node, ParticleSystem, Texture2D
} from 'cc';

import { Hex } from './Hex';
import { HudAnimation } from './HudAnimation';
import { Utils } from './Utils';
import { Gameplay } from './Gameplay';
import { PhysicsSystem } from 'cc';
import { UITransform } from 'cc';
import { bezier } from 'cc';
import { SoundManager } from './SoundManager';



const { ccclass, property } = _decorator;

export type SortData = { priority: number, source: Cell, destination: Cell, isSingle: boolean };

@ccclass('Cell')
export class Cell extends Component {

    @property(Prefab)
    hexPrefab: Prefab = null;

    @property(Prefab)
    coinPrefab: Prefab = null;

    @property([Prefab])
    mergeParticleSTD: Prefab = null;


    @property([Prefab])
    mergeParticle: Prefab = null;

    @property([Material])
    particleMaterial: Material = null;

    @property([Texture2D])
    particleTexture: Texture2D[] = [];

    @property(CCInteger)
    row: number;

    @property(CCInteger)
    col: number;

    type: number;
    cost: number;

    @property(Node)
    numberParent: Node = null;

    @property([Material])
    numberMats: Material[] = [];

    @property(MeshRenderer)
    unitsQuad: MeshRenderer;

    @property(MeshRenderer)
    tensQuad: MeshRenderer;


    baseHex: Hex = null;
    hexes: Hex[] = [];

    neighbours: Cell[] = [];

    highlightTween: Tween<Node> = null;
  
    isHighlighted: boolean = false;

    isHitHud: boolean = false;
    isHitCoin: boolean = false;

    // insert tile number for goal or insert 0 for multitile
    goaltile: number = 0;

    ray: geometry.Ray = new geometry.Ray();

    private gamePlay: Gameplay | null = null;
    private numberScale: Vec3 = new Vec3();

    isAvailable() : boolean { 
        return ((this.type == 0 || this.type == null) && this.topNumber() == 0);
    }

    topNumber(): number {
        if (this.hexes.length == 0) {
            return 0;
        }
        return this.hexes[this.hexes.length -1].type;
    }

    checkUnlock(score: number) {
        if (score >= this.cost) {
            this.type = 0;
            this.cost = 0;
            this.typeUpdated();
        }
    }

    highlight(animate: boolean) {
        this.setEmissiveMaterial(new Color(70, 65, 145, 255), new Color(70, 65, 145, 255));
        Tween.stopAllByTarget(this.baseHex.node);
        if (animate) {
            tween(this.baseHex.node)
                .call(() => { 
                    this.setEmissiveMaterial(new Color(70, 65, 145, 255), new Color(150, 150, 255, 255));
                })
                .to(0.3, { position: new Vec3(0, 0.6, 0) },)
              .start();
        } else {      
            this.baseHex.node.setPosition(new Vec3(0, 0.6, 0));
        }
    }

    dehighlight(animate: boolean) {

        this.setEmissiveMaterial(new Color(70, 65, 145, 255), new Color(70, 65, 145, 255));
        Tween.stopAllByTarget(this.baseHex.node);
        if (animate) {
            this.baseHex.node.setPosition(new Vec3(0, 0, 0));
        } else {  
            tween(this.baseHex.node)
                .call(() => { 
                    this.setEmissiveMaterial(new Color(150, 150, 255, 255), new Color(70, 65, 145, 255));
                })
                .to(0.1, { position: new Vec3(0, 0, 0) }, {
                    // onUpdate: () => {
                    //     this.setEmissiveMaterial(new Color(115, 125, 240, 255), new Color(70, 65, 145, 255));
                    // }
                })
                .start();
        }
    }


    init(row: number, col: number, hexes: number[], type: number, cost: number){
        this.row = row;
        this.col = col;
        this.type = type;
        this.cost = cost;

        this.node.name = this.row + ", " + this.col;
        this.node.setPosition(Utils.positionFromIndex(row, col));
        this.baseHex = this.node.getComponentInChildren(Hex);
        this.createHexes(hexes);
        this.numberScale = this.numberParent.getScale();
        this.showNumber();
        this.typeUpdated();
    }

    typeUpdated() {

    }


    createHexes(hexes: number[]) {
        this.hexes = [];
        for(let i = 0; i < hexes.length; i++) {
            const nHex = instantiate(this.hexPrefab);
            this.node.addChild(nHex);
            const hex = nHex.getComponent(Hex);
            hex.changeType(hexes[i]);
            this.hexes[i] = hex;
        }
        this.positionHexes();
    }

    setupNeighbours(cells: Cell[][]) {
        let neighs = Utils.getHexNeighbours({ col : this.col, row : this.row });
        this.neighbours = [];

        neighs.forEach(index => {
            if (cells.length > index.row) {
                if (cells[index.row].length > index.col) {
                    if (cells[index.row][index.col]) {
                        this.neighbours[this.neighbours.length] = cells[index.row][index.col];
                    }
                }
            }
        });
    }

    isMergeAble() : boolean {
        
        return this.topTypeCount() >= Utils.mergeTarget;
    }

    topTypeCount(): number {
        const top = this.topNumber();
        if (top == 0) {
            return 0;
        }

        let count = 0;
        for (let i = this.hexes.length - 1; i >= 0; i--) {
            if (this.hexes[i].type == top) {
                count++;
            }
            else {
                break;
            }
        }

        return count;
    }



    standardMergeParticle(top: number, index: number) {
        const ps = instantiate(this.mergeParticleSTD);
        this.node.addChild(ps);
        ps.setPosition(new Vec3(0, (index + 1.5) * Utils.hexY, 0));
        ps.setScale(1, 1, 1);
        tween(ps)
            .delay(1)
            .call(() => {
                ps.destroy();
            })
            .start();
    }

    mergeParticles(top: number, index: number) {
        const particleMaterial = this.particleMaterial.setProperty('mainTexture', this.particleTexture[top]);
        const ps = instantiate(this.mergeParticle);

        this.node.addChild(ps);
        ps.setPosition(new Vec3(0, (index + 0.8) * Utils.hexY, 0));
        ps.setScale(1, 1, 1);
        tween(ps)
            .delay(1)
            .call(() => {
                ps.destroy();
            })
            .start()
    }

    




    sortingData() : SortData  {
        if (this.topNumber() == 0) {
            return null;
        }
        let matching = this.checkNeighbours();
        if (!matching || matching.length == 0) {
            return null;
        }

        let priority = -1;
        if (matching.length == 1) {
            const types = this.hexes.map(x => x.type);
            const distTypes = [];
            distTypes[0] = types.pop();
            while(types.length > 0) {
                const type = types.pop();
                if (distTypes[distTypes.length-1] != type) {
                    distTypes[distTypes.length] = type;
                }
            }
            if (distTypes.length > 1) {
                let secondType = distTypes[1];
                let matching2 = this.checkNeighboursOfType(secondType);
                priority = matching2.length * 5;
            }
        }
        const index = randomRangeInt(0, matching.length);
        return { priority: priority, source: this, destination: matching[index], isSingle: matching.length == 1};
    }

    checkNeighbours() {
        return this.checkNeighboursOfType(this.topNumber());
    }

    checkNeighboursOfType(number: number) {
        let matching: Cell[] = [];
        if (number <= 0) {
            return matching;
        }

        this.neighbours.forEach(cell => {
            if (cell.topNumber() == number) {
                matching[matching.length] = cell;
            }
        });
        return matching;
    }

    addHexes(hexes: Hex[]) {
        hexes.forEach(hex => {
            this.node.addChild(hex.node);
            this.hexes[this.hexes.length] = hex;
        });
        this.positionHexes();
        this.showNumber();
    }

    positionHexes() {
        for(let i = 0; i < this.hexes.length; i++) {
            const hex = this.hexes[i];
            hex.node.setPosition(new Vec3(0, (i + 1.5) * Utils.hexY, 0));
        }
    }

    sort(source: Cell, gameplay: Gameplay) {

    }

    topBlocks() : Hex[] {
        let hexes = [];
        const top = this.topNumber();
        let count = 0;
        while (top == this.topNumber()) {
            const hex = this.hexes.pop();
            hexes[count] = hex;
            count++;
        }
        return hexes;
    }

    
    getRotationVectorForSorting(source:Node, destination: Node): {initial: Vec3, tween: Vec3 }{
        const from: Vec3 = source.worldPosition;
        const to: Vec3 = destination.worldPosition;
        const zDelta = to.z - from.z;
        const xDelta = to.x - from.x;

        log(zDelta + " "+ xDelta);
        if (zDelta < 0) {
            if (zDelta < -1.2) {
                return { initial: v3(179, 0, 0), tween: v3(90, 0, 0)};
            } else if (xDelta > 0) {
                return { initial: v3(0, 60, 179), tween: v3(0, 30, 90)};
            } else if (xDelta < 0) {
                return { initial: v3(0, -60, -179), tween: v3(0, -30, -179)};
            }
        } else {
            if (zDelta > 1.2) {
                return { initial: v3(-179, 0, 0), tween: v3(-90, 0, 0)};
            } else if (xDelta > 0) {
                return { initial: v3(0, -60, 179), tween: v3(0, -30, -90)};
            } else if (xDelta < 0) {
                return { initial: v3(0, 60, -179), tween: v3(0, 30, 90)};
            }
        }
        return { initial: Vec3.ZERO, tween: Vec3.ZERO };
    }


    private setEmissiveMaterial(startColor: Color, endColor: Color) {
        const material = this.baseHex.meshRenderer.getMaterialInstance(0);
        if (material) {
            material.setProperty('emissive', startColor);
            tween(startColor)
                .to(0.3, { r: endColor.r, g: endColor.g, b: endColor.b },
                    { onUpdate: (target: Vec4) => { material.setProperty('emissive', target); } }
                )
                .call(() => {
                    material.setProperty('emissive', endColor);
                })
                .start();
        }
    }

    collectTileEffect(duration:number, node:Node , startColor: Color, endColor: Color) {
        const mesh = node.getComponentInChildren(MeshRenderer);
        const material = mesh.getMaterialInstance(0);
        if (material) {
            material.setProperty('emissive', startColor);
            tween(startColor)
                .to(duration, { r: endColor.r, g: endColor.g, b: endColor.b }, 
                    { onUpdate: (target: Vec4) => { material.setProperty('emissive', target); }}
                    )
                .call(() => {
                    material.setProperty('emissive', endColor);
                })
                .start();
        }
    }

    logMaterialProperties(material: Material) {
        if (!material) {
         //   console.warn('Material not available.');
            return;
        }

        const properties = material.passes[0].properties;
        console.log(`Properties for material: ${material.name}`);

        for (const key in properties) {
            if (properties.hasOwnProperty(key)) {
                const value = material.getProperty(key);
                //console.log(`Property: ${key}, Value:`, value);
            }
        }
    }

    isHitHudStatus(): boolean {
        return this.isHitHud;
    }

    isHitCoinStatus(): boolean {
        return this.isHitCoin;
    }

    showNumber() {
        if (this.topNumber() == 0) {
            this.unitsQuad.node.active = false;
            this.tensQuad.node.active = false;
            return;
        }

        const totalCount = this.topTypeCount();
        const units = totalCount % 10;
        const tens = Math.floor(totalCount / 10);
        const height = this.hexes[this.hexes.length-1].node.position.y+0.4;
        this.numberParent.position = v3(0,height,0);
        let unitsPos = v3(0.35,0,0);
        let tensPos = v3(-0.35,0,0);

        this.unitsQuad.node.active = true;

        if (totalCount < 10) {
            this.tensQuad.node.active = false;    
            unitsPos = v3(0,0,0);
            this.unitsQuad.node.scale = this.getSizeForQuad(units);
        }
        else {
            this.tensQuad.node.active = true;

            const unitSize = this.getSizeForQuad(units);
            const tensSize = this.getSizeForQuad(tens);
            this.unitsQuad.node.scale = unitSize;
            this.tensQuad.node.scale = tensSize;

            unitsPos.x = unitSize.x/2;
            tensPos.x = -1 * tensSize.x/2;
        }

        this.unitsQuad.setMaterialInstance(this.numberMats[units], 0);
        this.tensQuad.setMaterialInstance(this.numberMats[tens], 0);
        this.unitsQuad.node.position = unitsPos;
        this.tensQuad.node.position = tensPos;

        Tween.stopAllByTarget(this.numberParent);
        tween(this.numberParent).to(0.2, {scale: v3(this.numberScale)}).call(() => {
        })
        .start();
    }

    getSizeForQuad(num: number): Vec3{
        let size = v3(0.7, 1, 1);
        switch(num){
            case 0:
                size.x = 0.7;
                break;
            case 1:
                size.x = 0.45;
                break;
            case 2:
                size.x = 0.55;
                break;
            case 3:
                size.x = 0.6;
                break;
            case 4:
                size.x = 0.65;
                break;
            case 5:
                size.x = 0.6;
                break;
            case 6:
                size.x = 0.65;
                break;
            case 7:
                size.x = 0.6;
                break;
            case 8:
                size.x = 0.7;
                break;
            case 9:
                size.x = 0.65;
                break;
            default:
                size.x = 0.7;
                break;
        }
        size.multiplyScalar(0.8);
        return size;
    }

    hideNumber() {
        Tween.stopAllByTarget(this.numberParent);
        tween(this.numberParent).to(0.2, {scale: v3(0,0,0)}).call(() => {
            this.unitsQuad.node.active = false;
            this.tensQuad.node.active = false;
        })
        .start();
    }
}

