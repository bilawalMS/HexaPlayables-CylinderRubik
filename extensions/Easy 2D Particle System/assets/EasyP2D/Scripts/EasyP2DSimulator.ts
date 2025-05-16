/*
 Copyright (c) 2018-2023 Xiamen Yaji Software Co., Ltd.

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
import { js, UIVertexFormat, Vec3, math, RenderData, Vec2, Quat, gfx, MeshRenderData } from 'cc';
import { PositionType, EmitterMode, VelocityType, DirectionType, AccelRelationDirection } from './EasyP2DDefine';
import { calcColorOnCurve, calcCos, calcSin, calcValueOnCurve, getRangePos, normalizeVec2 } from './EasyP2DUtils';
import { EDITOR, JSB, NATIVE } from 'cc/env';
import { Particle } from './Particle';
import { IEasyP2D, IEasyP2DSystem } from './interfaces';
import { UIVertexFormatX } from "./patch";

const UIVF = UIVertexFormat || UIVertexFormatX;

const _vec3 = new Vec3();
const _vec2 = new Vec2();
const _pos = { x: 0, y: 0 };
const _tpa = { x: 0, y: 0 };
const _tpb = { x: 0, y: 0 };
const _tpc = { x: 0, y: 0 };
const _PI_2 = Math.PI / 2;
const _q = new math.Quat();

const formatBytes = UIVF.getComponentPerVertex(UIVF.vfmtPosUvColor);

class ParticlePool extends js.Pool<Particle> {
    public get(): Particle {
        const particle = this._get() || new Particle();
        return particle;
    }
}

const pool = new ParticlePool((par: Particle) => { }, 4096);

export class EasyP2DSimulator {
    public particles: Particle[] = [];
    public active = false;
    public finished = false;
    public system: IEasyP2DSystem = null;
    public stepIndex = 0;
    private _warming: boolean = false;
    public get renderData(): MeshRenderData {
        return this.render.meshRenderData;
    }
    private declare render: IEasyP2D;

    public get warming() {
        return this._warming;
    }

    constructor(render: IEasyP2D) {
        this.render = render;
        this.system = render.system;
        this.particles = [];
        this.active = false;
        this.finished = false;
    }

    public stop() {
        this.active = false;
        this.finished = true;
    }

    public reset() {
        this.system = this.render.system;
        this.active = true;
        this.finished = false;
        const particles = this.particles;

        for (let id = 0; id < particles.length; ++id) {
            pool.put(particles[id]);
        }
        particles.length = 0;
    }

    public warm(dt: number) {
        if(this.render.rootMaster) {
            return;
        }

        this._warm(dt);
        for(let i = 0; i < this.render.children.length; i++) {
            const child = this.render.children[i];
            if(child.simulator && child.simulator.active) {
                // @ts-ignore
                child.simulator._warm(dt);
            }
        }
    }

    private _warm(dt: number) {
        this._warming = true;
        // let total = dt;
        // let step = 1 / 60;
        // while(total > 0) {
        //     this.step(step);
        //     total -= step;
        // }
        this.step(dt);
        this._warming = false;
    }

    public updateDir(particle: Particle, onEmit = false) {
        let sys = particle.sys;
        let a = 0;
        if(!particle.preventDefaultSetDir) {
            if(onEmit) {
                if(sys.velocityType == VelocityType.FireDirection || particle.pos.x == 0 && particle.pos.y == 0) {   
                    a = particle.fireRotation;
                }else{
                    a = Math.atan2(particle.pos.y - sys.sourcePos.x, particle.pos.x - sys.sourcePos.y);
                }
                particle.fireRotation = a;

                particle.startDir.x = particle.dir.x = calcCos(a);
                particle.startDir.y = particle.dir.y = calcSin(a);
            }            
        }
    }

    public emitParticle(pos: { x, y }, sys: IEasyP2DSystem): Particle {
        const psys = sys;
        let t = 0;
        if(sys.realEmitTurnDuration > 0) {
            t = psys.elapsed % sys.realEmitTurnDuration / sys.realEmitTurnDuration;
        }else {
            t = psys.particleCount % (sys.emissionRate + 1) / sys.emissionRate;
        }

        const particle = pool.get();
        particle.beforeEmit(sys);

        // timeToLive
        // no negative life. prevent division by 0
        particle.timeToLive = calcValueOnCurve(sys.startLifeTime, t);
        particle.totalTime = particle.timeToLive = Math.max(0.05, particle.timeToLive);
        if(sys.emitterMode == EmitterMode.TARGET) {
            particle.targetTimeRate = calcValueOnCurve(sys.targetTimeRate, t);
        }
        
        // reset group transform info
        if(psys.positionType === PositionType.GROUPED) {
            particle.startPos.x = 0;
            particle.startPos.y = 0;
        }else{
            particle.startPos.x = pos.x;
            particle.startPos.y = pos.y;
        }

        psys.onEmitter(particle, t);
        if(!particle.preventDefaultSetPos) {
            // shape
            const pos = getRangePos(psys, psys.sourcePos);
            particle.pos.x = pos.x;
            particle.pos.y = pos.y;
        }
        particle.fromPos.x = particle.pos.x;
        particle.fromPos.y = particle.pos.y;
        
        // Color
        // fixed cocos color bug
        const startColor = calcColorOnCurve(psys.startColor, t);
        particle.color[0] = startColor.x;
        particle.color[1] = startColor.y;
        particle.color[2] = startColor.z;
        particle.color[3] = startColor.w;

        // size & scale
        let scaleX = 1;
        let scaleY = 1;
        scaleX = calcValueOnCurve(psys.startScaleX, t);
        scaleY = calcValueOnCurve(psys.startScaleY, t);
        particle.size = particle.startSize = calcValueOnCurve(psys.startSize, t);
        particle.halfWidth = particle.size * psys.halfwidth * scaleX;
        particle.halfHeight = particle.size * psys.halfheight * scaleY;   

        if(!particle.preventDefaultSetSpeed) {
            particle.speed = calcValueOnCurve(psys.startSpeed, t);
        }       
        particle.startSpeed = particle.speed;     

        let fireRotation = 0;
        if(!particle.preventDefaultSetDir) {   
            if (psys.emitterMode === EmitterMode.GRAVITY) {
                let fireAngle = calcValueOnCurve(psys.fireAngle, t);
                // direction
                fireRotation = math.toRadian(fireAngle);
                particle.dir.x = calcCos(fireRotation);
                particle.dir.y = calcSin(fireRotation);
            }else {
                const a = Math.atan2(particle.pos.y - psys.sourcePos.y, particle.pos.x - psys.sourcePos.x);
                particle.dir.x = calcCos(a);
                particle.dir.y = calcSin(a);
            }
        }

        // angle
        let startAngle = calcValueOnCurve(psys.startAngle, t);
        particle.startRotation = math.toRadian(startAngle);

        if (psys.emitterMode === EmitterMode.GRAVITY) {
            // gravity
            particle.gravity.x = psys.gravity.x;
            particle.gravity.y = psys.gravity.y;
            // radial accel
            particle.radialAccel = calcValueOnCurve(psys.radialAccel, t);
            // tangential accel
            particle.tangentialAccel = calcValueOnCurve(psys.tangentialAccel, t);            
            // rotation is dir
            if (psys.rotationType == DirectionType.FireDir) {
                particle.rotation = fireRotation;
            } else {
                particle.rotation = 0;
            }
            particle.fireRotation = fireRotation;
        }        
                    
        this.updateDir(particle, true);

        psys.particleCount++;
        this.particles.push(particle);

        psys.afterEmitter(particle, t);

        return particle;
    }

    public step(dt: number) {
        const renderData = this.renderData;
        
        if(!renderData || !this.system) return;

        const masterSys = this.system;

        const particles = this.particles;

        const assembler = this.render.assembler!;   
        
        if(!this._warming) {
            //avoid dt stacked too much
            dt = dt > assembler.maxParticleDeltaTime ? assembler.maxParticleDeltaTime : dt;
        }

        // Calculate pos
        /* pre-delated dirty particles */
        //to-do need to resize very fucked
        if (!EDITOR && masterSys && masterSys.realDuration !== -1 && masterSys.realDuration < masterSys.elapsed) {
            masterSys.willStop = true;
        }

        //emit new particles
        const psys = this.system;
        if(psys.willStop) {
            if(psys.particleCount == 0) {
                psys.active = false;  
                psys.willStop = false;   
                this.finished = true;
                psys.elapsed = 0;

                let master = psys.easyP2D.parentMaster || psys.easyP2D;
                if(master) {
                    if(master.isAllFinished && master.calcParticleCount() == 0) {
                        const onCompleted = master.onCompleted;
                        onCompleted && onCompleted(master);
                        
                        master._finishedSimulation();
                    }
                }
            }       
        } else if (psys.active) {
            // Emission
            const realDuration = psys.realEmitTurnDuration >= 0 ? psys.realEmitTurnDuration : 1;

            if(psys.easyP2D.delay > 0) {
                psys.easyP2D.delay -= dt;
            } else {
                const node = psys.node;
                if (psys.positionType === PositionType.FREE) {
                    node.getWorldPosition(_vec3);
                    _pos.x = _vec3.x;
                    _pos.y = _vec3.y;
                } else if (psys.positionType === PositionType.RELATIVE) {
                    node.getPosition(_vec3);
                    _pos.x = _vec3.x;
                    _pos.y = _vec3.y;
                } else {
                    _pos.x = _pos.y = 0;
                }

                // sleep
                if(psys.sleepTimer <= 0) {
                    const rate = realDuration / psys.emissionRate;
                    // 时间为0时，按一轮发射处理
                    if(rate == 0) {
                        let count = psys.emissionRate;
                        // 发射粒子不超过每轮最大发射数
                        while ((psys.particleCount < psys._totalParticles) && count-- > 0) {
                            this.emitParticle(_pos, psys);
                        }
                    }else{
                        // 初始发射
                        if(psys.elapsed == 0) {
                            psys.emitCounter = rate;
                        }else{
                            psys.emitCounter += dt;
                        }
        
                        while ((psys.particleCount < psys._totalParticles) && (psys.emitCounter >= rate)) {
                            this.emitParticle(_pos, psys);
                            psys.emitCounter -= rate;
                        }
                        
                        // 如果发射粒子数超过每轮最大发射数，需要对发射时间进行修正
                        if(psys.emitCounter > rate) {
                            psys.emitCounter = psys.emitCounter % rate + rate;
                        }
                    }
                }    

                psys.elapsed += dt;   

                if(psys.enableSwapTime) {
                    if(psys.sleepTimer > 0) {
                        psys.sleepTimer -= dt;
                        if(psys.sleepTimer <= 0) {
                            psys.sleepTimer = 0;
                            psys.awakeTimer = psys.awakeTime;
                        }
                    }else {
                        if(psys.awakeTimer <= 0) {
                            psys.awakeTimer = psys.awakeTime;
                        }
    
                        psys.awakeTimer -= dt;
                        if(psys.awakeTimer <= 0) {
                            psys.sleepTimer = psys.sleepTime;
                        }            
                    }  
                } 
            }
        }

        this.stepIndex = 0;
        while(this.stepIndex < particles.length) {
            const particle = particles[this.stepIndex];

            let t = math.clamp01(1.0 - particle.timeToLive / particle.totalTime);
            _pos.x = particle.pos.x;
            _pos.y = particle.pos.y;

            const sys = particle.sys;
            particle.preventDefaultSetPos = false;
            particle.preventDefaultSetDir = false;
            sys.onUpdate(particle, dt, t);

            if(!particle.preventDefaultSetSpeed) {
                this.updateDir(particle);
            }

            // Mode A: gravity, direction, tangential accel & radial accel
            if(!particle.preventDefaultSetPos) {
                if (sys.emitterMode === EmitterMode.GRAVITY) {
                    const tmp = _tpc;
                    const radial = _tpa;
                    // radial acceleration
                    if(psys.accelRelativeDir == AccelRelationDirection.MoveDir) {
                        radial.x = particle.dir.x;
                        radial.y = particle.dir.y;
                    }else if(psys.accelRelativeDir == AccelRelationDirection.CenterDir){
                        radial.x = particle.pos.x;
                        radial.y = particle.pos.y;
                    }else if(psys.accelRelativeDir == AccelRelationDirection.FireDir){
                        radial.x = particle.startDir.x;
                        radial.y = particle.startDir.y;
                    }
                    normalizeVec2(radial);
                    tmp.x = (radial.x * particle.radialAccel - radial.y * particle.tangentialAccel + particle.gravity.x) * dt;
                    tmp.y = (radial.y * particle.radialAccel + radial.x * particle.tangentialAccel + particle.gravity.y) * dt;
                    particle.dir.x += tmp.x;
                    particle.dir.y += tmp.y;

                    particle.pos.x += dt * particle.dir.x * particle.speed;
                    particle.pos.y += dt * particle.dir.y * particle.speed;
                    
                    _tpc.x = particle.dir.x;
                    _tpc.y = particle.dir.y;
                    normalizeVec2(_tpc);
                    particle.dir.x = _tpc.x;
                    particle.dir.y = _tpc.y;
                }else if(sys.emitterMode === EmitterMode.TARGET) {
                    let tt = particle.targetTimeRate <= 0 ? 1 : t / particle.targetTimeRate;
                    if(tt <= 1) {
                        particle.pos.x = math.lerp(particle.fromPos.x, particle.targetPos.x, tt);
                        particle.pos.y = math.lerp(particle.fromPos.y, particle.targetPos.y, tt);
                    }
                }
            }

            particle.finalPos.x = particle.pos.x;
            particle.finalPos.y = particle.pos.y;

            this.updateUVs(particle);

            sys.afterUpdate(particle, dt, t, _pos);        

            if(sys.rotationType == DirectionType.MoveDir) {
                _tpb.x = particle.finalPos.x - _pos.x;
                _tpb.y = particle.finalPos.y - _pos.y;
                if(_tpb.x != 0 || _tpb.y != 0) {
                    particle.rotation = Math.atan2(_tpb.y, _tpb.x) + particle.startRotation;
                }
            }

            if(sys.positionType == PositionType.FREE) {
                const p = sys.easyP2D.node.worldPosition;
                particle.finalPos.x -= p.x;
                particle.finalPos.y -= p.y;
            }else if(sys.positionType == PositionType.RELATIVE) {
                const p = sys.easyP2D.node.position;
                particle.finalPos.x -= p.x;
                particle.finalPos.y -= p.y;
            }

            particle.timeToLive -= dt;
            if (!psys.active || particle.timeToLive <= 0) {
                psys.onEnd(particle);
                if(this.stepIndex != particles.length - 1) {
                    particles[this.stepIndex] = particles[particles.length - 1];
                }
                particles.length--;
                psys.particleCount--;
                pool.put(particle);
            }else{
                this.stepIndex++;
            }
        }

        this.render.assembler.requestData(this.render);
        let offset = 0;
        for (var i = 0; i < particles.length; i++) {
            const particle = particles[i];

            // update values in quad buffer
            let showParticle = true;
            if(psys.trailEnabled) {
                this.render.assembler.updateTrailBuffer(this.render, particle, offset);
                offset += psys.trail.getParticleCount(particle) * 4 * formatBytes;
                showParticle = psys.trail.showMainParticle;
            }

            if(showParticle) {
                this.render.assembler.updateParticleBuffer(this.render, particle, offset);
                offset += formatBytes * 4;
            }
        }

        !this.renderData.material && (this.renderData.material = this.render.getRenderMaterial(0));
        !this.renderData.frame && (this.renderData.frame = masterSys.renderFrame); 
        
        this.render.markForUpdateRenderData(true);
    }

    private updateUVs(particle: Particle) {
        const sys = particle.sys;
        const puv = particle.uv;
        if (sys.needReplaceUVs) {
            const tileX = particle.tiles.x;
            const tileY = particle.tiles.y;
            const _x = particle.currentFrame % tileX;
            const _y = Math.floor(particle.currentFrame / tileX);
            const uvs = sys.replaceUVs;
            const x1 = uvs[0];
            const xx1 = uvs[1];
            const x2 = uvs[2];
            const xx2 = uvs[3];
            const y1 = uvs[4];
            const yy1 = uvs[5];
            const y2 = uvs[6];
            const yy2 = uvs[7];
            puv[0] = x1 + (_x + uvs[8]) * xx1 / tileX ;
            puv[1] = y1 + (_y + uvs[9]) * yy1 / tileY ;
            puv[2] = x2 + (_x + uvs[10]) * xx2 / tileX;
            puv[3] = y2 + (_y + uvs[11]) * yy2 / tileY;
            puv[4] = x2 + (_x + uvs[12]) * xx2 / tileX;
            puv[5] = y2 + (_y + uvs[13]) * yy2 / tileY;
            puv[6] = x1 + (_x + uvs[14]) * xx1 / tileX;
            puv[7] = y1 + (_y + uvs[15]) * yy1 / tileY;
        } else {
            const uv = particle.sys.uv;
            puv[0] = uv[0];
            puv[1] = uv[1];
            puv[2] = uv[2];
            puv[3] = uv[3];
            puv[4] = uv[4];
            puv[5] = uv[5];
            puv[6] = uv[6];
            puv[7] = uv[7];
        }
    }
}
