import { Canvas, Director, IAssembler, Material, MeshRenderData, Node, Pool, SpriteFrame, UI, __private, director, profiler } from 'cc';
import { DEBUG, EDITOR, JSB } from "cc/env";
import { IEasyP2D } from "./interfaces";
import { P2DSettings } from './P2DSettings';

class P2DCommitInfo {
    public p2d: IEasyP2D;
    public renderData: MeshRenderData;
    public material: Material | null = null;
    public renderFrame: SpriteFrame;
    public assembler: IAssembler | null = null;
    public layer = 0;
    public render: any;
    public stencilStage: number = 0;
}

director.on(Director.EVENT_BEGIN_FRAME, () => {
    MeshBatcher.init();
});

export class MeshBatcher {    
    private static _currentInfo: P2DCommitInfo = new P2DCommitInfo();
    private static _start = true;

    static init() {
        this._start = true;
        this._currentInfo.p2d = null;
        this._currentInfo.renderData = null;
    }

    static batchProcess(p2d: IEasyP2D, vertexCount: number, indexCount: number) {  
        let commitInfo = this._currentInfo;
        p2d.batchData.reset();
        
        if(!p2d.meshRenderData || vertexCount <= 0) 
            return;

        let renderData = commitInfo.renderData;
    
        let breakBatch = true;
        let oldVC = 0;
        let oldIC = 0;
        let frame = p2d.system.renderFrame;
        let layer = p2d.node.layer;
        let mat: Material = null;

        if(renderData) {
            mat = renderData.material;
            
            oldVC = renderData.vertexCount;
            oldIC = renderData.indexCount;
            
            if(P2DSettings.ENABLE_BATCHER) {
                breakBatch = !commitInfo.p2d ||
                            commitInfo.material !== mat || 
                            commitInfo.layer != layer ||
                            commitInfo.renderFrame !== frame ||
                            commitInfo.stencilStage !== p2d.stencilStage;
        
                if(!breakBatch) {
                    if(!renderData.request(vertexCount, indexCount)) {
                        breakBatch = true;
                    }
                }
            }
        }

        if(breakBatch) {
            p2d.swapBuffer();

            renderData = p2d.meshRenderData;
            commitInfo.p2d = p2d;
            commitInfo.renderFrame = frame;
            commitInfo.material = mat;
            commitInfo.layer = layer;
            commitInfo.renderFrame = p2d.system.renderFrame;
            commitInfo.assembler = p2d.assembler;
            commitInfo.stencilStage = p2d.stencilStage;
            commitInfo.renderData = renderData;

            if(renderData.vertexCount < vertexCount) {
                renderData.reset();
                renderData.request(vertexCount, indexCount);
            }else{
                renderData.resize(vertexCount, indexCount);
            }

            oldVC = 0;
            oldIC = 0;
        }
        
        p2d.batchData.request(renderData, oldVC, oldIC);
    }
}