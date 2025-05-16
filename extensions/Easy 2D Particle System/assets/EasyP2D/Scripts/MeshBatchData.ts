import { MeshRenderData } from 'cc';
import { IEasyP2D, IMeshBatchData } from './interfaces';
export class MeshBatchData implements IMeshBatchData{
    public startVertexIndex = 0;
    public startIndexIndex = 0;
    public vertexCount = 0;
    public indexCount = 0;
    public renderData: MeshRenderData = null;
    public lastVertexCount = 0;
    public lastIndexCount = 0;
    public isRendering = false;

    private _p2d: IEasyP2D = null;
    init(p2d: IEasyP2D) {
        this._p2d = p2d;
    }

    reset() {
        this.isRendering = false;

        this.lastVertexCount = this.vertexCount;
        this.lastIndexCount = this.indexCount;

        this.startVertexIndex = 0;
        this.startIndexIndex = 0;
        this.vertexCount = 0;
        this.indexCount = 0;
    }

    request(renderData: MeshRenderData, oldVextexCount: number, oldIndiceCount: number) {
        this.renderData = renderData;

        let rd = this._p2d.meshRenderData;
        if(renderData == rd) {
            this.vertexCount = rd.vertexCount;
            this.indexCount = rd.indexCount;
        }else{
            this.startIndexIndex = oldIndiceCount;
            this.startVertexIndex = oldVextexCount;
            this.vertexCount = renderData.vertexCount - oldVextexCount;
            this.indexCount = renderData.indexCount - oldIndiceCount;
        }
    }
}