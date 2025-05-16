import { _decorator, Vec2, errorID, Rect, gfx, RenderTexture, Texture2D, math } from "cc";
import { EmitterMode, ExpansionType } from "../EasyP2DDefine";
import { Particle } from "../Particle";
const { property, ccclass } = _decorator;
import { EasyP2DModuleBase } from "./EasyP2DModuleBase";
import { IEasyP2D } from "../interfaces";
import { getRangePos } from "../EasyP2DUtils";

@ccclass('ImageEmitterModule')
export class ImageEmitterModule extends EasyP2DModuleBase {
    @property({type: Texture2D, visible: false})
    private _texture: Texture2D = null;

    @property(Texture2D)
    public get texture() {
        return this._texture;
    }

    public set texture(value: Texture2D) {
        if(this._texture === value) return;
        this._texture = value;
        if(this._texture) {
            this.onInit();
        }
    }

    @property
    public scale = 1;

    @property
    public flipY = true;

    @property({type:ExpansionType})
    public expansion = ExpansionType.None;

    @property
    public updateDirection = false;
    
    private _validPixels: Vec2[] = [];

    constructor() {
        super();

        this.enableOnEmitter = true;
        this.enableOnUpdate = true;
    }

    protected onInit(): void {
        if(!this._texture) {
            return;
        }

        let buffer = ImageEmitterModule.readTexturePixels(this._texture);
        buffer = ImageEmitterModule.getAlphaBuffer(new Rect(0, 0, this._texture.width, this._texture.height), buffer, this.flipY);
        let w_2 = this._texture.width * 0.5;
        let h_2 = this._texture.height * 0.5;
        for (let i = 0; i < buffer.length; i++) {
            if (buffer[i] > 0) {
                const x = i % this._texture.width;
                const y = Math.floor(i / this._texture.width);
                this._validPixels.push(new Vec2(x - w_2, y - h_2));
            }
        }

        buffer = null;
    }

    public onEmitter(particle: Particle, turnPrecenet: number): void {
        if(!this._texture || particle.preventDefaultSetPos) {
            return;
        }
        
        const sys = this._easyP2D.system;
        if(sys.emitterMode == EmitterMode.TARGET) {
            this.generatePos(this._easyP2D, turnPrecenet, particle.targetPos);
            this.updateExpansion(particle, true);
        }else{        
            this.generatePos(this._easyP2D, turnPrecenet, particle.pos);
            particle.preventDefaultSetPos = true;
            this.updateExpansion(particle, true);
        }
    }

    private updateExpansion(particle: Particle, init = false): void {
        switch(this.expansion) {
            case ExpansionType.Random:
                if(init) {
                    _tempVec2.x = math.randomRange(-1, 1);
                    _tempVec2.y = math.randomRange(-1, 1);
                }
                break;
            case ExpansionType.Out:
                _tempVec2.x = particle.pos.x;
                _tempVec2.y = particle.pos.y;
                break;
            case ExpansionType.In:
                _tempVec2.x = -particle.pos.x;
                _tempVec2.y = -particle.pos.y;
                break;
        }
        if(this.expansion !== ExpansionType.None) {
            _tempVec2.normalize();
            particle.dir.x = _tempVec2.x;
            particle.dir.y = _tempVec2.y;
            particle.preventDefaultSetDir = true;
        }
    }

    public onUpdate(particle: Particle, dt: number, livePrecent: number): void {
        const sys = this._easyP2D.system;
        if(!this.updateDirection || sys.emitterMode == EmitterMode.TARGET) {
            return;
        }

        this.updateExpansion(particle, false);
    }

    private generatePos(p2d: IEasyP2D, t: number, out?: {x: number, y: number}) {
        out = out || _tempVec2;

        let index = Math.floor(Math.random() * this._validPixels.length);
        let pixel = this._validPixels[index];

        out.x = pixel.x * this.scale;
        out.y = pixel.y * this.scale;

        const psys = p2d.system;
        let p = getRangePos(psys, out);
        out.x = p.x;
        out.y = p.y;

        return out;
    }

    /**
     * 通过纹理读取制定区域的像素值
     * @param src 纹理
     * @param rect 区域，为空表示全部区域
     * @param buffer 返回数组
     * @returns 返回数组
     */
    static readTexturePixels(src: RenderTexture|Texture2D, rect?: Rect, buffer?: Uint8Array) {
        rect = rect || new Rect(0, 0, src.width, src.height);

        rect.x = Math.floor(rect.x);
        rect.y = Math.floor(rect.y);
        rect.width = Math.floor(rect.width);
        rect.height = Math.floor(rect.height);

        const gfxTexture = src.getGFXTexture();
        if (!gfxTexture) {
            errorID(7606);
            return null;
        }

        const needSize = 4 * rect.width * rect.height;
        if (buffer === undefined) {
            buffer = new Uint8Array(needSize);
        } else if (buffer.length < needSize) {
            errorID(7607, needSize);
            return null;
        }

        const bufferViews: ArrayBufferView[] = [];
        const regions: gfx.BufferTextureCopy[] = [];

        const region0 = new gfx.BufferTextureCopy();
        region0.texOffset.x = rect.x;
        region0.texOffset.y = rect.y;
        region0.texExtent.width = rect.width;
        region0.texExtent.height = rect.height;
        regions.push(region0);

        bufferViews.push(buffer);

        const gfxDevice = src["_getGFXDevice"]();
        gfxDevice?.copyTextureToBuffers(gfxTexture, bufferViews, regions);

        return buffer;
    }

    static getAlphaBuffer(rect: Rect, src: Uint8Array, flipY: boolean = false, buffer?: Uint8Array) {
        const needSize = rect.width * rect.height;
        if (buffer === undefined) {
            buffer = new Uint8Array(needSize);
        } else if (buffer.length < needSize) {
            errorID(7607, needSize);
            return null;
        }

        if(flipY){
            for(let iy=0;iy<rect.height;iy++) {
                for(let ix=0;ix<rect.width;ix++) {
                    let index = (rect.height - iy - 1) * rect.width + ix;
                    buffer[index] = src[(iy * rect.width + ix) * 4 + 3];
                }
            }
        }else{
            for (let i = 0; i < needSize; i++) {
                buffer[i] = src[i * 4 + 3];
            }
        }

        return buffer;
    }
}
const _tempVec2 = new Vec2();