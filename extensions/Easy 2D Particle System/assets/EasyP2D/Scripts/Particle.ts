import { IEasyP2DSystem } from "./interfaces";

export class Particle {
    [keyof: string]: any;
    
    public index = -1;
    public data: any = null;

    public preventDefaultSetPos = false;
    public preventDefaultSetDir = false;
    public preventDefaultSetSpeed = false;

    // Sys
    public sys: IEasyP2DSystem;
    // Pos
    public pos = { x: 0, y: 0 };
    public startPos = { x: 0, y: 0 };
    public fromPos = { x: 0, y: 0 };
    public targetPos = { x: 0, y: 0 };
    public targetTimeRate = 1; // 到达目标点的时间占比
    public finalPos = { x: 0, y: 0 };
    // Color
    public color = [1, 1, 1, 1];
    public isColorDirty = false;
    // Size
    public halfWidth = 0;
    public halfHeight = 0;
    public startSize = 0;
    public size = 0;
    // Rotation
    public rotation = 0;
    public startRotation = 0;
    public fireRotation = 0;
    // Time
    public totalTime = 0;
    public timeToLive = 0;
    // Mode A
    public dir = { x: 0, y: 0 }; // 粒子的方向法线
    public startDir = { x: 0, y: 0 };
    public gravity = { x: 0, y: 0 };
    public radialAccel = 0;
    public tangentialAccel = 0;
    // Speed
    public speed = 0;
    public startSpeed = 0;
    // Animation
    public currentFrame = -1;
    public tiles = { x: 0, y: 0 };
    //uv
    public uv: number[] = [];
    public verticles: number[] = [0,0,0,0,0,0,0,0,0,0,0,0];

    public beforeEmit(sys: IEasyP2DSystem) {
        this.frameIsDirty = true;
        this.sys = sys;
        this.startPos.x = 0;
        this.startPos.y = 0;
        this.fromPos.x = 0;
        this.fromPos.y = 0;
        this.targetPos.x = 0;
        this.targetPos.y = 0;
        this.targetTimeRate = 1;
        this.preventDefaultSetPos = false;
        this.preventDefaultSetDir = false;
        this.preventDefaultSetSpeed = false;
        this.rotation = 0;
        this.startRotation = 0;
        this.fireRotation = 0;
        this.totalTime = 0;
        this.timeToLive = 0;
    }
}
