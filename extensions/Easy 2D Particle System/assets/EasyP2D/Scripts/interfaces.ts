import { CurveRange, GradientRange, IAssembler, Node, RenderData, SpriteFrame, UIRenderer, MeshRenderData } from 'cc';
import { Particle } from "./Particle";

export interface IEasyP2DAssembler extends IAssembler {
    requestData(p2d: any): boolean;
    updateUVs(comp: any): void;
    updateParticleBuffer(comp: IEasyP2D, particle: Particle, offset: number): void;
    updateTrailBuffer(comp: IEasyP2D, particle: Particle, offset: number): void;

    createData (comp: IEasyP2D): MeshRenderData;
    removeData(data: MeshRenderData): void;
}

export interface IMeshBatchData {
    lastVertexCount: number;
    lastIndexCount: number;

    startVertexIndex: number;
    startIndexIndex: number;
    vertexCount: number;
    indexCount: number;
    renderData: MeshRenderData;

    isRendering: boolean;
    
    reset();
    request(renderData: MeshRenderData, oldVextexCount: number, oldIndiceCount: number);
}

export interface IEasyP2D extends UIRenderer {
    system: IEasyP2DSystem;
    node: Node;    
    assembler: IEasyP2DAssembler;
    simulator: IEasyP2DSimulator;
    parentMaster: IEasyP2D;
    meshRenderData: MeshRenderData;
    batchData: IMeshBatchData;

    calcParticleCount(): number;
    isAllFinished: boolean;
    delay: number;
    rootMaster: IEasyP2D;
    children: IEasyP2D[];

    onCompleted: Function | null;
    applySpriteFrame();
    startPreview();
    updateParticle();
    
    swapBuffer();
    updateBatchData(vertexCount: number, indexCount: number);

    _finishedSimulation();
}

export interface IEasyP2DSimulator {
    active: boolean;
    finished: boolean;
    warming: boolean;
    particles: Particle[];
    renderData: MeshRenderData;
    stepIndex: number;
    warm(dt: number);
    step(dt: number);
    reset();
}

export interface IEasyP2DSystem {
    positionType: number;
    renderFrame: SpriteFrame;
    emitterMode: number;
    shapeMode: number;
    rangeSize: {x: number, y: number};
    innerRangeSize: {x: number, y: number};
    sourcePos: {x: number, y: number};
    elapsed: number;
    realDelay: number;
    realDuration: number;
    realEmitTurnDuration: number;
    halfwidth: number;
    halfheight: number;
    willStop: boolean;
    particleCount: number;
    active: boolean;
    easyP2D: IEasyP2D;
    node: Node;
    sleepTimer: number;
    emissionRate: number;
    totalParticles: number;
    _totalParticles: number;
    gravity: {x: number, y: number};
    rotationType: number;
    emitCounter: number;
    enableSwapTime: boolean;
    awakeTimer: number;
    awakeTime: number;
    sleepTime: number;
    uv: number[];
    replaceUVs: number[];
    needReplaceUVs: boolean;
    anchor: {x: number, y: number};
    velocityType: number;
    trailEnabled: boolean;
    spriteFrame: SpriteFrame;
    useSysAngleOvertime: boolean;

    startSize: CurveRange;
    startScaleX: CurveRange;    
    startScaleY: CurveRange;
    startLifeTime: CurveRange;
    targetTimeRate: CurveRange;
    startSpeed: CurveRange;
    fireAngle: CurveRange;
    startAngle: CurveRange;
    startColor: GradientRange;
    radialAccel: CurveRange;
    tangentialAccel: CurveRange;
    accelRelativeDir: number;
    
    trail: ITrailModule;
    timer: ITimerModule;
    sysAngleOvertime: ISystemAngleOvertimeModule;

    onEmitter(particle: Particle, turnPrecenet: number): void;
    afterEmitter(particle: Particle, turnPrecenet: number): void;
    onUpdate(particle: Particle, dt: number, livePrecent: number): void;
    afterUpdate(particle: Particle, dt: number, livePrecent: number, oldPos: {x: number, y: number}): void;
    onEnd(particle: Particle): void;
    _syncAspect(): void;
}

export interface IModuleBase {
    enabled: boolean;
}

export interface ITrailModule extends IModuleBase {
    showMainParticle: boolean;
    getParticleCount(particle: Particle): number;
}

export interface ITimerModule extends IModuleBase {
    
}

export interface ISystemAngleOvertimeModule extends IModuleBase {
    space: number;
    increment: CurveRange;
    scale: CurveRange;
    byIncrement: boolean;
    cosRotation: number;
    sinRotation: number;
}