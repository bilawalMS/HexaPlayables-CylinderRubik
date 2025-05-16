
/*
 Copyright (c) 2013-2016 Chukong Technologies Inc.
 Copyright (c) 2017-2023 Xiamen Yaji Software Co., Ltd.

 https://www.cocos.com/

 Permission is hereby granted, free of charge, to any person obtaining a copy
 of this software and associated documentation files (the "Software"), to deal
 in the Software without restriction, including without limitation the rights to
 use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies
 of the Software, and to permit persons to whom the Software is furnished to do so,
 subject to the following conditions:

 The above copyright notice and this permission notice shall be included in
 all copies or substantial portions of the Software.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 THE SOFTWARE.
*/

const { ccclass, property, menu, executeInEditMode, playOnFocus } = _decorator;
import "./patch";
import { _decorator, UIRenderer, Color, Material, UIVertexFormat, MeshRenderData, Mesh } from 'cc';
import { EasyP2DSimulator } from './EasyP2DSimulator';
import { EasyP2DSystem } from './EasyP2DSystem';
import { EDITOR, JSB, NATIVE, PREVIEW } from 'cc/env';
import { IEasyP2DAssembler, IEasyP2DSimulator, IMeshBatchData } from './interfaces';
import { loadSF } from './EasyP2DUtils';
import { IEasyP2D } from './interfaces';
import { UIVertexFormatX } from './patch';
import { MeshBatcher } from "./MeshBatcher";
import { MeshBatchData } from "./MeshBatchData";
import { P2DSettings } from "./P2DSettings";

const UIVF = UIVertexFormat || UIVertexFormatX;
const EDITOR_MODE = EDITOR && !PREVIEW && !NATIVE;

@ccclass('EasyP2D')
@menu('EasyP2D')
@playOnFocus
@executeInEditMode
export class EasyP2D extends UIRenderer implements IEasyP2D {
    public QUAD_INDICES: Uint16Array | null = null;

    public onCompleted: Function | null = null;

    protected declare _assembler: IEasyP2DAssembler;

    private _swapMeshRenderDatas: MeshRenderData[] = [];
    private _swapMeshRenderDataIndex = 0;

    public parentMaster: EasyP2D;

    public rootMaster: EasyP2D;

    public children: EasyP2D[] = [];

    private _batchData: MeshBatchData = new MeshBatchData();

    public get meshRenderData(): MeshRenderData {
        return this._swapMeshRenderDatas[this._swapMeshRenderDataIndex];
    }

    private get realRenderData() {
        return this._swapMeshRenderDatas[1 - this._swapMeshRenderDataIndex];
    }

    public get batchData(): IMeshBatchData {
        return this._batchData;
    }

    /**
     * 刷新真实渲染数据，并尝试扩容，如果扩容失败返回自身
     * @param vertexCount 
     * @param indexCount 
     */
    public updateBatchData(vertexCount: number, indexCount: number) {
        MeshBatcher.batchProcess(this, vertexCount, indexCount);
    }

    public calcParticleCount() {
        let count = 0;
        for(let i=0;i<this.children.length;i++) {
            let child = this.children[i];
            if(child.simulator && child._system) {
                count += child._system.particleCount;
            }
        }
        return count;
    }

    public get isAllFinished() {
        let done = true;
        for(let i=0;i<this.children.length;i++) {
            let child = this.children[i];
            if(child.simulator) {
                done &&= child.simulator.finished;
            }else{
                done = false;
            }
            if(!done) {
                break;
            }
        }
        return done;
    }

    onLoad() {
        super.onLoad();

        this._batchData.init(this);
        // MeshBatchEnd.check(this);

        let childP2ds = this.node.getComponentsInChildren(EasyP2D);
        this.children.length = 0;
        for(let i=0;i<childP2ds.length;i++) {
            let p = childP2ds[i];
            if(p != this) {
                p.system._preview = this.system._preview;
                p.parentMaster = this;
                p.rootMaster = this.rootMaster || this;

                this.children.push(p);
            }
        }

        if(!this._customMaterial) {
            this._instanceMaterialType = 1;
        }
    }

    

    @property({min: 0.1, max: 10, step: 0.1, slide: true})
    public timeScale = 1;

    @property({ visible: true, override: true, displayOrder: 0 })
    set customMaterial(value: Material) {
        if(this._customMaterial == value) {
            return;
        }

        this._customMaterial = value;
        if(value && this._swapMeshRenderDatas.length > 0) {
            for(let i=0;i<this._swapMeshRenderDatas.length;i++) {
                this._assembler.updateMaterial(this._swapMeshRenderDatas[i], value);
            }            
        }

        // this.updateMaterial();
    }
    get customMaterial(): Material {
        return this._customMaterial;
    }

    public delay: number = 0;

    @property({ type: EasyP2DSystem, visible: false })
    private _system: EasyP2DSystem = null;

    @property({ type: EasyP2DSystem, visible: true })
    public get system() {
        if(!this._system) {
            this._system = new EasyP2DSystem();
            this._system.node = this.node;
        }
        this._system.initial(this);
        return this._system;
    }

    @property({visible: false})
    private _initialized = false;

    /**
     * @en Current quantity of particles that are being simulated.
     * @zh 当前播放的粒子数量。
     * @readonly
     */
    public get particleCount() {
        return this.simulator.particles.length;
    }

    /**
     * @en Indicate whether the system simulation have stopped.
     * @zh 指示粒子播放是否完毕。
     */
    public get stopped() {
        return this._stopped;
    }
    /**
     * @en Indicate whether the particle system is activated.
     * @zh 是否激活粒子。
     * @readonly
     */
    public get active() {
        return this.simulator.active;
    }

    public get assembler(): IEasyP2DAssembler {
        return this._assembler;
    }

    public simulator: IEasyP2DSimulator;

    private _stopped = true;
    private declare _focused: boolean;

    @property({ visible: false, override: true })
    set color(value) {
    }
    get color(): Readonly<Color> {
        return this._color;
    }

    constructor() {
        super();
        this.simulator = new EasyP2DSimulator(this);
    }

    private _needPlayOnce = false;
    public replay() {
        if(!this.node.active) {
            this._needPlayOnce = true;
            this.node.active = true;
            return this;
        }
        this._resetSystem(this, true);

        return this;
    }

    public onEnable() {
        super.onEnable();
        
        if (!this.system.node) {
            this.system.node = this.node;
        }
        if (EDITOR_MODE && !this._initialized && !this.system.spriteFrame) {
            loadSF('24c419ea-63a8-4ea1-a9d0-7fc469489bbc@f9941').then(sf=>{
                this.system.spriteFrame = sf || null;
                this._initialized = true;
                this.system._syncAspect(); 
                this.initial();
            });
        }else{   
            this._initialized = true;   
            this.system._syncAspect(); 
            this.initial();
        }      
    }

    private initial() { 
        this.initSystem();
    }

    public initSimulator() {
        if (!this.simulator) {
            this.simulator = new EasyP2DSimulator(this);
        }
    }

    public onDestroy() {
        super.onDestroy();
        if (this.system.autoRemoveOnFinish) {
            this.system.autoRemoveOnFinish = false;
        }

        for(let i=0;i<this._swapMeshRenderDatas.length;i++) {
            this._assembler.removeData(this._swapMeshRenderDatas[i]);
        }
        this._swapMeshRenderDatas.length = 0;
    }

    public initSystem() {
        if (EDITOR && this.system.preview && !this.parentMaster) {
            for (let i = 0; i < this.children.length; ++i) {
                this.children[i].startPreview();
            }
        }
        this.updateParticle();
        // auto play
        if (!EDITOR) {
            if (this.system.playOnLoad || this._needPlayOnce) {
                this.resetSystem();
            }
        }
    }

    public onFocusInEditor() {
        // MeshBatchEnd.check(this);

        this._focused = true;
        // console.log('onFocusInEditor', this.node.name);
        this.startPreview();
    }

    public onLostFocusInEditor() {
        this._focused = false;
        this._stopPreview();
    }

    public startPreview() {
        if (this.system._preview) {
            this.resetSystem();
        }
    }

    private _stopPreview() {
        if (this.system._preview) {
            this.resetSystem();
            this.stopSystem();
        }
    }

    public __preload() {        
        super.__preload();

        if (this.system.spriteFrame && !this.system.renderFrame) {
            this.applySpriteFrame();
        }
    }

    protected _flushAssembler () {
        const assembler = EasyP2D.Assembler.getAssembler(this) as IEasyP2DAssembler;

        if (this._assembler !== assembler) {
            this._assembler = assembler;
        }
        if (this._assembler && this._assembler.createData) {
            this._createRenderData();
        }
    }

    private _createRenderData() {
        if(this._swapMeshRenderDatas.length >= 2) {
            return this.meshRenderData;
        }

        let renderData = this._assembler.createData(this);
        renderData.reset();

        renderData.particleInitRenderDrawInfo(this.renderEntity);       
        renderData.setRenderDrawInfoAttributes();

        this._swapMeshRenderDatas.push(renderData);

        return renderData;
    }

    public swapBuffer() {
        if(this._swapMeshRenderDatas.length == 0) {
            return;
        }

        if(!P2DSettings.ENABLE_BATCHER || !P2DSettings.ENABLE_SWAP_BATCHER) {
            return;
        }

        let first = false;
        if(this._swapMeshRenderDatas.length < 2) {
            first = true;
            this._createRenderData();
        }

        if(!first) {
            let target = this.realRenderData;
            let source = this.meshRenderData;

            target.reset();
            target.request(source.vertexCount, source.indexCount);

            target.vData = new Float32Array(source.vData.buffer);
            target.iData = new Uint16Array(source.iData.buffer);

            if(JSB) {
                source.renderDrawInfo.clear();
            }
            this._swapMeshRenderDataIndex = 1 - this._swapMeshRenderDataIndex;
        }
    }

    private getTimeScale() {
        if(this.rootMaster) {
            return this.rootMaster.timeScale;
        }
        return this.timeScale;
    }

    protected lateUpdate(dt: number) {
        if (this.simulator && !this.simulator.finished) {
            if(EDITOR_MODE) {
                if(this._focused || this.rootMaster && this.rootMaster._focused) {
                    this.simulator.step(dt * this.getTimeScale());
                }
            }else{
                this.simulator.step(dt * this.getTimeScale());
            }
        }
    }

    /**
     * @en Stop emitting particles. Running particles will continue to run until they die.
     * @zh 停止发射器发射粒子，发射出去的粒子将继续运行，直至粒子生命结束。
     * @example
     * // stop particle system.
     * myParticleSystem.stopSystem();
     */
    public stopSystem() {
        this._stopped = true;
        this._system.willStop = true;
        // this.simulator&&this.simulator.stop();

        if(!this.parentMaster) {
            for(let i = 0; i < this.children.length; ++i) {
                const p2d = this.children[i];
                if (p2d !== this) {
                    this.children[i].stopSystem();
                }
            }
        }
    }

    /**
     * @en Kill all living particles.
     * @zh 杀死所有存在的粒子，然后重新启动粒子发射器。
     * @example
     * // play particle system.
     * myParticleSystem.resetSystem();
     */
    public resetSystem() {
        this._resetSystem(null, true);
    }

    private _resetSystem(owner: EasyP2D, first = false) {
        if(!this.simulator || !this.system) {
            return;
        }

        this._needPlayOnce = false;
        this.delay = this.system.realDelay;
        this.initSimulator();
        this.system.reset();
        
        this.markForUpdateRenderData();    
        
        if(!owner && !this.parentMaster || owner == this) {
            let p2ds = this.children;
            for (let i = 0; i < p2ds.length; ++i) {
                const p2d = p2ds[i];
                if (p2d !== this) {
                    p2d._resetSystem(null, false);
                }
            }
        }
        this.simulator.reset();
        this._stopped = false;
    }

    public applySpriteFrame() {
        const system = this.system;
        if (system.renderFrame && system.renderFrame.texture) {
            if (this.simulator) {
                system.useAnimation&&this._assembler.updateUVs(this);
            }
            system._syncAspect();
            this._updateMaterial();
            this._stopped = false;
            this.markForUpdateRenderData();
        } else {
            this.resetSystem();
        }
    }

    /**
     * 修复合批问题
     * @param index 
     * @returns 
     */
    public getRenderMaterial (index: number): Material | null {
        if(this._swapMeshRenderDatas.length == 0) {
            return null;
        }

        return this.meshRenderData.material || this._materialInstances[index] || this._materials[index];
    }

    public _finishedSimulation() {
        if (EDITOR) {
            if (this.system._preview && this._focused && !this.active /* && !cc.engine.isPlaying */) {
                this.resetSystem();
            }
            return;
        }
        this.resetSystem();
        this.stopSystem();
        this.markForUpdateRenderData();
        if (this.system.autoRemoveOnFinish && this._stopped) {
            this.node.destroy();
        }
    }
    updateParticle() {
        this._updateMaterial();
        this._updatePositionType();
    }

    protected _canRender() {
        const rf = this.system.renderFrame;
        let ret = super._canRender() && 
                !this._stopped && 
                rf !== null && rf !== undefined && 
                this.batchData.vertexCount > 0 && (this.batchData.renderData == this.meshRenderData || this.batchData.renderData == this.realRenderData);
        return ret;
    }

    public get renderTransform() {
        if (JSB) {
            //@ts-ignore
            return this._renderEntity._nativeObj.renderTransform;
        }
        //@ts-ignore
        return this._renderEntity._renderTransform;
    }

    protected _render(render: any) {
        const system = this.system;
        if (this.particleCount == 0) {
            return;
        }

        render.commitComp(this, this.meshRenderData, system.renderFrame, this._assembler, null);

        // if (system._positionType === PositionType.RELATIVE) {
        //     render.commitComp(this, this._meshRenderData, system.renderFrame, this._assembler, this.node.parent);
        // } else if (system.positionType === PositionType.GROUPED) {
        //     render.commitComp(this, this._meshRenderData, system.renderFrame, this._assembler, this.node);
        // } else {
        //     render.commitComp(this, this._meshRenderData, system.renderFrame, this._assembler, null);
        // }
    }

    protected _updatePositionType() {
        // if (this.system._positionType === PositionType.RELATIVE) {
        //     this._renderEntity.setRenderTransform(this.node.parent);
        //     this._renderEntity.setUseLocal(true);
        // } else if (this.system.positionType === PositionType.GROUPED) {
        //     this._renderEntity.setRenderTransform(this.node);
        //     this._renderEntity.setUseLocal(true);
        // } else {
        //     this._renderEntity.setRenderTransform(null);
        //     this._renderEntity.setUseLocal(false);
        // }
    }

    public _updateMaterial (): void {
        // if(this.system._positionType !== PositionType.FREE) {
        //     if (this._customMaterial) {
        //         this.setSharedMaterial(this._customMaterial, 0);
        //         const target = this.getRenderMaterial(0)!.passes[0].blendState.targets[0];
        //         this._dstBlendFactor = target.blendDst;
        //         this._srcBlendFactor = target.blendSrc;
        //     }
        //     const mat = this.getMaterialInstance(0);
        //     if (mat) {
        //         mat.recompileShaders({ USE_LOCAL: true });
        //     }
        //     if (mat && mat.passes.length > 0) {
        //         this._updateBlendFunc();
        //     }
        // }
    }
}
