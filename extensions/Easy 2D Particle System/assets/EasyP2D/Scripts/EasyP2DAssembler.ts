/*
 * @Descripttion: 
 * @version: 
 * @Author: iwae
 * @Date: 2023-04-02 13:20:35
 * @LastEditors: chenyang.sun chenyang.sun@cocos.com
 * @LastEditTime: 2023-04-11 00:50:37
 */
/*
 Copyright (c) 2017-2018 Chukong Technologies Inc.
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
import "./patch";
import { IAssemblerManager, game, UIRenderer, Vec3, math, UIVertexFormat, Mat4, __private, Vec2, MeshRenderData, MeshRenderer } from 'cc';
import { EasyP2D } from './EasyP2D';
import { IEasyP2D, IEasyP2DAssembler } from './interfaces';
import { Particle } from './Particle';
import { TrailCreator } from './Modules/Trail/TrailCreator';
import { PositionType, SpaceMode } from './EasyP2DDefine';
import { UIVertexFormatX } from "./patch";
import { JSB, NATIVE } from "cc/env";
import { calcCos, calcSin } from "./EasyP2DUtils";
import { P2DSettings } from "./P2DSettings";

const UIVF = UIVertexFormat || UIVertexFormatX;

const _vec3 = new Vec3();
const _vec2 = new Vec3();
const _pos = { x: 0, y: 0 };
const _tpa = { x: 0, y: 0 };
const _tpb = { x: 0, y: 0 };
const _tpc = { x: 0, y: 0 };
const _PI_2 = Math.PI / 2;
const _q = new math.Quat();
const _mat4 = new Mat4();
const formatBytes = UIVF.getComponentPerVertex(UIVF.vfmtPosUvColor);

export const EasyP2DAssembler: IEasyP2DAssembler = {
    maxParticleDeltaTime: 0,
    requestData(p2d: EasyP2D) {
        let paritcleCount = 0;
        let showParticle = true;
        if(p2d.system.trailEnabled) {
            showParticle = p2d.system.trail.showMainParticle;
        }
        for(let i=0;i<p2d.particleCount;i++) {
            if(p2d.system.trailEnabled) {
                const particle = p2d.simulator.particles[i];
                if(particle.trail) {
                    let trail = particle.trail as TrailCreator;
                    paritcleCount += trail.particleCount;
                }
            }
            if(showParticle) {
                paritcleCount++;
            }
        }
        // const batchData = p2d.batchData;

        // if(batchData.vertexCount == paritcleCount * 4) {
        //     return false;
        // }

        this._requestData(p2d, paritcleCount * 4, paritcleCount * 6);
        
        return true;
    },    
    createData (comp: EasyP2D): MeshRenderData {
        return MeshRenderData.add();
    },
    removeData (data: MeshRenderData) {
        MeshRenderData.remove(data);
    },
    updateRenderData () {
    },
    fillBuffers (comp: EasyP2D, renderer: __private._cocos_2d_renderer_i_batcher__IBatcher) {
    },
    _requestData(comp: EasyP2D, vertexCount: number, indexCount: number) {        
        comp.updateBatchData(vertexCount, indexCount);

        const batchData = comp.batchData;
        const renderData = batchData.renderData!;
        if(!renderData) {
            return;
        }

        let offset = batchData.startIndexIndex;
        let startIndex = batchData.startVertexIndex;

        const count = vertexCount / 4;
        const buffer = renderData.iData;
        for (let i = 0; i < count; i++) {
            const vId = i * 4 + startIndex;
            buffer[offset++] = vId;
            buffer[offset++] = vId + 1;
            buffer[offset++] = vId + 2;
            buffer[offset++] = vId + 1;
            buffer[offset++] = vId + 3;
            buffer[offset++] = vId + 2;
        }

        renderData.setRenderDrawInfoAttributes();
    },    
    updateUVs(comp: EasyP2D) {
        return;

        const batchData = comp.batchData;
        if(!batchData.renderData) {
            return;
        }

        const renderData = batchData.renderData;
        const vbuf = renderData.vData;

        let showMainParticle = true;
        if(comp.system.trailEnabled) {
            showMainParticle = comp.system.trail.showMainParticle;
        }

        const particleCount = comp.particleCount;
        let vIndex = batchData.startVertexIndex;

        for(let i=0;i<particleCount;i++) {  
            let trailOffset = 0;

            // trail
            const particle = comp.simulator.particles[i];   
            if(comp.system.trailEnabled) {
                const trail = particle.trail as TrailCreator;
                if(trail) {
                    const fragmentCount = trail.particleCount;
                    const quadOffset = fragmentCount * formatBytes * 4;
                    trailOffset += quadOffset;
                    let vOffset = vIndex * quadOffset * 4;
                    for(let fi = 0; fi < fragmentCount; fi++) {
                        let p = trail.particles[fi];
                        let uvs = p.uvs;

                        for(let vi=0; vi < 4; vi++) {
                            const uv = uvs[vi];
                            vbuf[vOffset + 3] = uv.x;
                            vbuf[vOffset + 4] = uv.y;
                            vOffset += formatBytes;
                        }
                        vIndex += 4;
                    }
                }
            }            

            if(showMainParticle) {
                // particle
                const uv = particle.sys.uv;
                let offset = vIndex * formatBytes * 4;
                for(let vi=0; vi < 4; vi++) {
                    const index = vi * 2;
                    vbuf[offset + 3] = uv[index];
                    vbuf[offset + 4] = uv[index + 1];
                    offset += formatBytes;
                }
                vIndex+=4;
            }
        }
    },

    updateTrailBuffer(comp: EasyP2D, particle: Particle, offset: number): void {
        const batchData = comp.batchData;

        // colors
        if(!batchData.renderData || !particle.trail) {
            return;
        }

        const vbuf = batchData.renderData.vData;
        const trail = particle.trail as TrailCreator;

        const fragmentCount = trail.particleCount;
        const sys = comp.system;
        const mat = sys.easyP2D.node.worldMatrix;
        offset += batchData.startVertexIndex * formatBytes;

        // verticles, uv, colors
        for(let fi=0; fi < fragmentCount; fi++) {
            const node = trail.particles[fi];
            const fragmentOffset = offset + fi * 4 * formatBytes;
            for(let vi=0; vi < 4; vi++) {
                const ofs = fragmentOffset + vi * formatBytes;

                const v = node.verticles[vi];
                vbuf[ofs] = v.x;
                vbuf[ofs + 1] = v.y;
                vbuf[ofs + 2] = v.z;

                const uv = node.uvs[vi];
                vbuf[ofs + 3] = uv.x;
                vbuf[ofs + 4] = uv.y;

                const color = node.colors[vi];
                vbuf[ofs + 5] = color.x;
                vbuf[ofs + 6] = color.y;
                vbuf[ofs + 7] = color.z;
                vbuf[ofs + 8] = color.w;
                
                transformPos(comp, vbuf, ofs, mat);
            }             
        }
    },

    updateParticleBuffer(comp: EasyP2D, particle: Particle, offset: number): void {      
        const batchData = comp.batchData;

        // colors
        if(!batchData.renderData) {
            return;
        }

        const vbuf = batchData.renderData.vData;
        const pos = _tpa;
        pos.x = particle.finalPos.x;
        pos.y = particle.finalPos.y;

        offset += batchData.startVertexIndex * formatBytes;

        // const uintbuf = buffer._uintVData;
        const uv = particle.uv;
        vbuf[offset + 3] = uv[0];
        vbuf[offset + 4] = uv[1];
        vbuf[offset + 12] = uv[2];
        vbuf[offset + 13] = uv[3];
        vbuf[offset + 21] = uv[4];
        vbuf[offset + 22] = uv[5];
        vbuf[offset + 30] = uv[6];
        vbuf[offset + 31] = uv[7];

        pos.x += particle.startPos.x;
        pos.y += particle.startPos.y;
       
        const x: number = pos.x;
        const y: number = pos.y;
        const width = particle.halfWidth * 2;
        const height = particle.halfHeight * 2;
        const sx = particle.sys.anchor.x * width;
        const sy = particle.sys.anchor.y * height;
        const ex = width - sx;
        const ey = height - sy;

        let rotation = particle.rotation + particle.startRotation;
        if (rotation !== 0) {
            const x1 = -sx;
            const y1 = -sy;
            const x2 = ex;
            const y2 = ey;
            const rad = rotation;
            const cr = calcCos(rad);
            const sr = calcSin(rad);
            // bl 0,1,2->0,1,2
            vbuf[offset] = x1 * cr - y1 * sr + x;
            vbuf[offset + 1] = x1 * sr + y1 * cr + y;
            vbuf[offset + 2] = 0;
            // br 3,4,5->9,10,11
            vbuf[offset + 9] = x2 * cr - y1 * sr + x;
            vbuf[offset + 10] = x2 * sr + y1 * cr + y;
            vbuf[offset + 11] = 0;
            // tl 6,7,8->18,19,20
            vbuf[offset + 18] = x1 * cr - y2 * sr + x;
            vbuf[offset + 19] = x1 * sr + y2 * cr + y;
            vbuf[offset + 20] = 0;
            // tr 9,10,11->27,28,29
            vbuf[offset + 27] = x2 * cr - y2 * sr + x;
            vbuf[offset + 28] = x2 * sr + y2 * cr + y;
            vbuf[offset + 29] = 0;
        } else {
            // bl
            vbuf[offset + 0] = vbuf[offset + 18] = x - sx;
            vbuf[offset + 1] = vbuf[offset + 10] = y - sy;
            // br
            vbuf[offset + 9] = vbuf[offset + 27] = x + ex;
            // tl
            vbuf[offset + 19] = vbuf[offset + 28] = y + ey;
            // tr
            vbuf[offset + 2] = vbuf[offset + 11] = vbuf[offset + 8] = vbuf[offset + 29] = 0;
        }

        // color
        this.toArrays(vbuf, particle.color, offset + 5, offset + 14, offset + 23, offset + 32);

        if(P2DSettings.SUPPORT_PARTICLE_TRANSFORM) {
            const sys = comp.system;
            const mat = sys.easyP2D.node.worldMatrix;
            transformPos(comp, vbuf, offset, mat);
            transformPos(comp, vbuf, offset + 9, mat);
            transformPos(comp, vbuf, offset + 18, mat);
            transformPos(comp, vbuf, offset + 27, mat);
        }else{
            let pos = comp.node.worldPosition;
            vbuf[offset] += pos.x;
            vbuf[offset + 1] += pos.y;
            vbuf[offset + 9] += pos.x;
            vbuf[offset + 10] += pos.y;
            vbuf[offset + 18] += pos.x; 
            vbuf[offset + 19] += pos.y;
            vbuf[offset + 27] += pos.x;
            vbuf[offset + 28] += pos.y;
        }
    },

    toArray(vbuf: Float32Array, array: number[], offset: number) {
        vbuf[offset] = array[0];
        vbuf[offset + 1] = array[1];
        vbuf[offset + 2] = array[2];
        vbuf[offset + 3] = array[3];
    },

    toArrays(vbuf, array, offset0, offset1, offset2, offset3) {
        vbuf[offset0] = vbuf[offset1] = vbuf[offset2] = vbuf[offset3] = array[0];
        vbuf[offset0 + 1] = vbuf[offset1 + 1] = vbuf[offset2 + 1] = vbuf[offset3 + 1] = array[1];
        vbuf[offset0 + 2] = vbuf[offset1 + 2] = vbuf[offset2 + 2] = vbuf[offset3 + 2] = array[2];
        vbuf[offset0 + 3] = vbuf[offset1 + 3] = vbuf[offset2 + 3] = vbuf[offset3 + 3] = array[3];
    }
};

export const EasyP2DSystemAssembler: IAssemblerManager = {
    getAssembler (comp: EasyP2D) {
        if (!EasyP2DAssembler.maxParticleDeltaTime) {
            EasyP2DAssembler.maxParticleDeltaTime = game.frameTime / 1000 *2;

        }
        return EasyP2DAssembler;
    },
};

function transformPos(p2d: IEasyP2D, vbuf: Float32Array, offset: number, mat: Mat4) {
    _vec3.x = vbuf[offset];
    _vec3.y = vbuf[offset + 1];
    _vec3.z = vbuf[offset + 2];
    Vec3.transformMat4(_vec3, _vec3, mat);

    vbuf[offset] = _vec3.x;
    vbuf[offset + 1] = _vec3.y;
    vbuf[offset + 2] = 0;
}

EasyP2D.Assembler = EasyP2DSystemAssembler;