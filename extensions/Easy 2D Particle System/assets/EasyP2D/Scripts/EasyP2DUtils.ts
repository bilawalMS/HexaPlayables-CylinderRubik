import { Color, CurveRange, Gradient, GradientRange, IVec2Like, RealCurve, RealKeyframeValue, __private, math, random, sp } from "cc";
import { EmitterShape, ImageFormat } from "./EasyP2DDefine";
import { Component, Node, SpriteFrame, assetManager } from "cc";
import { IEasyP2D, IEasyP2DSystem } from "./interfaces";
import { P2DSettings } from "./P2DSettings";

export function clampf (value: number, min_inclusive: number, max_inclusive: number) {
    return value < min_inclusive ? min_inclusive : value < max_inclusive ? value : max_inclusive;
}

const SIN_CACHE: number[] = [];
export function calcSin(angle: number) {
    if(!P2DSettings.ENABLE_CALCULATE_CACHE) {
        return Math.sin(angle);
    }

    angle = angle % (2 * Math.PI);
    let index = Math.round(angle * 100);
    let val = SIN_CACHE[index];
    if (val === undefined) {
        val = SIN_CACHE[index] = Math.sin(angle);
    }

    return val;
}

const COS_CACHE: number[] = [];
export function calcCos(angle: number) {
    if(!P2DSettings.ENABLE_CALCULATE_CACHE) {
        return Math.cos(angle);
    }

    angle = angle % (2 * Math.PI);
    let index = Math.round(angle * 100);
    
    let val = COS_CACHE[index];
    if (val === undefined) {
        val = COS_CACHE[index] = Math.cos(angle);
    }

    return val;
}

export function getImageFormatByData (imgData) {
    // if it is a png file buffer.
    if (imgData.length > 8 && imgData[0] === 0x89
        && imgData[1] === 0x50
        && imgData[2] === 0x4E
        && imgData[3] === 0x47
        && imgData[4] === 0x0D
        && imgData[5] === 0x0A
        && imgData[6] === 0x1A
        && imgData[7] === 0x0A) {
        return ImageFormat.PNG;
    }

    // if it is a tiff file buffer.
    if (imgData.length > 2 && ((imgData[0] === 0x49 && imgData[1] === 0x49)
        || (imgData[0] === 0x4d && imgData[1] === 0x4d)
        || (imgData[0] === 0xff && imgData[1] === 0xd8))) {
        return ImageFormat.TIFF;
    }
    return ImageFormat.UNKNOWN;
}

export function resetRenderdata(data){
    data._vc = 0;
    data._ic = 0;
    data._byteLength = 0;
    data.vertexStart = 0;
    data.vertexRange = 0;
    data.indexStart = 0;
    data.indexRange = 0;
    data.lastFilledIndex = 0;
    data.lastFilledVertex = 0;
    data.freeIAPool();
}

export function pointInPolygon(p, polygon) {
    let crossing = 0;
    for (let i = 0; i < polygon.length; i++) {
        let a = polygon[i];
        let b = polygon[(i + 1) % polygon.length];
        if ((a.y > p.y) !== (b.y > p.y) && p.x < (b.x - a.x) * (p.y - a.y) / (b.y - a.y) + a.x) {
            crossing++;
        }
    }
    return crossing % 2 === 1;
}

export function normalizeVec2(vec) {
    let length = Math.sqrt(vec.x * vec.x + vec.y * vec.y);

    if (length === 0) {
        vec.x = vec.y = 0
    } else {
        vec.x = vec.x / length;
        vec.y = vec.y / length;
    }
}


/**
 * @en judge if the CurveRange use TwoCurves or TwoConstants
 * @zh 判断粒子的CurveRange是否使用了 TwoCurves 或者 TwoConstants
 */
export function isCurveTwoValues (curve: CurveRange): boolean {
    const Mode = CurveRange.Mode;
    switch (curve.mode) {
    case Mode.TwoCurves:
    case Mode.TwoConstants:
        return true;
    default:
        return false;
    }
}

function roundToIndex(value: number) {
    const percision = P2DSettings.CALCULATE_CACHE_PERCENT;
    const n = Math.pow(10, percision);
    const index = Math.round(value * n);
    return index;
}

function roundTo(value: number) {
    const percision = P2DSettings.CALCULATE_CACHE_PERCENT;
    const n = Math.pow(10, percision);
    const index = Math.round(value * n);
    return index / n;
}

function roundArray(value: number) {
    const percision = P2DSettings.CALCULATE_CACHE_PERCENT;
    const n = Math.pow(10, percision);
    const index = Math.round(value * n);
    return [index, index / n];
}

function getRealKeyFrameHash(key: RealKeyframeValue) {
    var value = roundToIndex(key.value);
    return value << 7 | 
           key.easingMethod << 6 |
           key.interpolationMode << 5 |
           key.leftTangent << 4 |
           key.rightTangent << 3 |
           key.leftTangentWeight << 2 |
           key.rightTangentWeight << 1 |
           key.tangentWeightMode;
}

function getSplineHash(spline: RealCurve) {
    // @ts-ignore
    if (spline.__hash) {
        // @ts-ignore
        return spline.__hash;
    }

    // @ts-ignore
    let times = spline._times;
    // @ts-ignore
    let values = spline._values;
    let hash = "";
    for (let i = 0; i < times.length; i++) {
        let t = times[i];
        let value = values[i];
        hash += `${t}_${getRealKeyFrameHash(value)}`;
    }

    //@ts-ignore
    spline.__hash = hash;
    return hash;
}

function getCurveHash(curve: CurveRange) {
    // @ts-ignore
    if (curve.__hash) {
        // @ts-ignore
        return curve.__hash;
    }

    let mode = curve.mode;
    let hash = "";

    switch (mode) {
        case CurveRange.Mode.Constant:
            hash = `${mode}_${curve.multiplier}_${roundToIndex(curve.constant)}`;
            break;
        case CurveRange.Mode.TwoConstants:
            hash = `${mode}_${curve.multiplier}_${roundToIndex(curve.constantMin)}_${roundToIndex(curve.constantMax)}`;
            break;            
        case CurveRange.Mode.Curve:
            hash = `${mode}_${curve.multiplier}_${getSplineHash(curve.spline)}`;
            break;
        case CurveRange.Mode.TwoCurves:
            hash = `${mode}_${curve.multiplier}_${getSplineHash(curve.splineMin)}_${getSplineHash(curve.splineMax)}`;
            break;
    }

    //@ts-ignore
    curve.__hash = hash;

    return hash;
}

const CURVE_CACHE_MAP = new Map<string, number[]>();
export function calcValueOnCurve(curve: CurveRange, t: number) {
    if(curve.mode === CurveRange.Mode.Constant) {
        return curve.constant;
    }else if(curve.mode === CurveRange.Mode.TwoConstants) {
        const rndRatio = Math.random();
        return math.lerp(curve.constantMin, curve.constantMax, rndRatio);
    }

    if(!P2DSettings.ENABLE_CALCULATE_CACHE) {
        const rand = isCurveTwoValues(curve) ? Math.random() : 0;
        return curve.evaluate(t, rand);
    }

    let hash = getCurveHash(curve);
    // @ts-ignore
    if(curve.__oldMode === undefined) {
        // @ts-ignore
        curve.__oldMode = curve.mode;
        // @ts-ignore
    }else if(curve.__oldMode !== curve.mode) {
        CURVE_CACHE_MAP.delete(hash);
        // @ts-ignore
        curve.__oldMode = curve.mode;
        // @ts-ignore
        delete curve.__hash;  
    }
    hash = getCurveHash(curve);    

    const arr = roundArray(t);
    t = arr[1];
    const index = arr[0];

    let cacheMap = CURVE_CACHE_MAP.get(hash);
    if(cacheMap === undefined) {
        cacheMap = [];
        CURVE_CACHE_MAP.set(hash, cacheMap);
    }
    if (cacheMap[index] !== undefined) {
        return cacheMap[index];
    }

    const rand = isCurveTwoValues(curve) ? Math.random() : 0;
    let value = curve.evaluate(t, rand);
    
    cacheMap[index] = value;

    return value;
}

/**
 * @en judge if the GradientRange TwoValues use TwoGradients or TwoColors
 * @zh 判断粒子的 GradientRange 是否使用了 TwoGradients 或者 TwoColors
 */
export function isGradientTwoValues (color: GradientRange): boolean {
    const Mode = GradientRange.Mode;
    switch (color.mode) {
    case Mode.TwoGradients:
    case Mode.TwoColors:
        return true;
    default:
        return false;
    }
}

function getGradientSplineHash(spline: Gradient) {
    // @ts-ignore
    if (spline.__hash) {
        // @ts-ignore
        return spline.__hash;
    }

    let alphaKeys = spline.alphaKeys;
    let colorKeys = spline.colorKeys;

    let hash = "";
    for (let i = 0; i < alphaKeys.length; i++) {
        let key = alphaKeys[i];
        hash += `${roundTo(key.time)}_${roundTo(key.alpha)}`;
    }
    for (let i = 0; i < colorKeys.length; i++) {
        let key = colorKeys[i];
        hash += `${roundTo(key.time)}_${getColorHash(key.color)}`;
    }
    
    //@ts-ignore
    spline.__hash = hash;
    return hash;
}

function getColorHash(color: Color) {
    return `${color.r}_${color.g}_${color.b}_${color.a}`;

}

function getGradientHash(gradient: GradientRange) {
    // @ts-ignore
    if (gradient.__hash) {
        // @ts-ignore
        return gradient.__hash;
    }

    let mode = gradient.mode;
    let hash = "";

    switch (mode) {
        case GradientRange.Mode.Color:
            hash = `${mode}_${getColorHash(gradient.color)}`;
            break;
        case GradientRange.Mode.TwoColors:
            hash = `${mode}_${getColorHash(gradient.colorMin)}_${getColorHash(gradient.colorMax)}`;
            break;
        case GradientRange.Mode.Gradient:
            hash = `${mode}_${getGradientSplineHash(gradient.gradient)}`;
            break;
        case GradientRange.Mode.TwoGradients:
            hash = `${mode}_${getGradientSplineHash(gradient.gradientMin)}_${getGradientSplineHash(gradient.gradientMax)}`;
            break;
    }

    //@ts-ignore
    gradient.__hash = hash;

    return hash;
}

const COLOR_CACHE_MAP = new Map<string, Color[]>();
const _colorTemp = new Color();
export function calcColorOnCurve(curve: GradientRange, t: number) {
    if(curve.mode === GradientRange.Mode.Color) {
        return curve.color;
    }else if(curve.mode === GradientRange.Mode.TwoColors) {
        const rndRatio = Math.random();
        return Color.lerp(_colorTemp, curve.colorMin, curve.colorMax, rndRatio);
    }

    if(curve.mode == GradientRange.Mode.RandomColor || curve.mode === GradientRange.Mode.RandomColor) {
        const rand = Math.random();
        return curve.evaluate(t, rand);
    }

    if(!P2DSettings.ENABLE_CALCULATE_CACHE) {
        const rand = isGradientTwoValues(curve) ? Math.random() : 0;
        return curve.evaluate(t, rand);
    }

    let hash = getGradientHash(curve);
    // @ts-ignore
    if(curve.__oldMode === undefined) {
        // @ts-ignore
        curve.__oldMode = curve.mode;
        // @ts-ignore
    }else if(curve.__oldMode !== curve.mode) {
        COLOR_CACHE_MAP.delete(hash);
        // @ts-ignore
        curve.__oldMode = curve.mode;      
        // @ts-ignore
        delete curve.__hash;  
    }
    hash = getGradientHash(curve);

    const arr = roundArray(t);
    t = arr[1];
    t = Math.min(0.9999, t);
    const index = arr[0];
    
    let cacheMap = COLOR_CACHE_MAP.get(hash);
    if (cacheMap === undefined) {
        cacheMap = [];
        COLOR_CACHE_MAP.set(hash, cacheMap);
    }
    if (cacheMap[index]) {
        return cacheMap[index].clone();
    }

    const rand = isGradientTwoValues(curve) ? Math.random() : 0;
    const value = curve.evaluate(t, rand);

    cacheMap[index] = value.clone();

    return value;    
}

export function loadSF(uuid: string): Promise<SpriteFrame> {
    return new Promise<SpriteFrame>((resolve, reject) => {
        assetManager.loadAny({ uuid: uuid }, (err, sf:SpriteFrame) => {
            if (err) {
                console.error("Load Custom Mat Error", err);
                resolve && resolve(null);
            } else {
                resolve&& resolve(sf);
            }
        })
    })
}

export function getParticleComponents<T extends Component>(node: Node, type: __private._types_globals__Constructor<T>): T[] {
    const parent = node.parent;
    const comp = node.getComponent(type);
    if (!parent || !comp) {
        return node.getComponentsInChildren(type) as T[];
    }

    return getParticleComponents(parent, type);
}

export function getBatchParticle<T extends IEasyP2D>(node: Node, sf: SpriteFrame, type: __private._types_globals__Constructor<T>): T {
    const parent = node.parent;
    if (!parent) {
        return null;
    } else {
        const particals = parent.getComponentsInChildren(type) as T[];
        const self = node.getComponent(type);
        const l = particals.length;
        if (l === 0) {
            return null;
        } else {
            for (var i = 0; i < l; i++) {
                const particle = particals[i];
                if (particle.node.active && particle != self && (particle.system.renderFrame.texture == sf.texture)) {
                    // console.log(11,sf.texture)
                    return particle;
                }
            }

        }
        return null;
    }
}

export function getP2DHash(tex: __private._cocos_asset_assets_texture_base__TextureBase, p2d: IEasyP2D): number {
    return tex.getHash() * 10000 + p2d.getMaterialInstance(0).hash;
}

// In the Free mode to get emit real rotation in the world coordinate.
export function getWorldRotation(node: Node) {
    let rotation = 0;
    let tempNode = node;
    while (tempNode) {
        rotation += tempNode.eulerAngles.z;
        tempNode = tempNode.parent;
    }
    return rotation;
}

export function getRangePos(psys: IEasyP2DSystem, sourcePos: IVec2Like) {
    _tempVec2.x = 0;
    _tempVec2.y = 0;
    const innerRangeSize = psys.innerRangeSize;
    const rangeSize = psys.rangeSize;
    if (psys.shapeMode === EmitterShape.BOX) {
        if(innerRangeSize) {
            _tempVec2.x = math.randomRange(sourcePos.x - rangeSize.x + innerRangeSize.x, sourcePos.x + rangeSize.x - innerRangeSize.x);
            _tempVec2.y = math.randomRange(sourcePos.y - rangeSize.y + innerRangeSize.y, sourcePos.y + rangeSize.y - innerRangeSize.y);
        }else{
            _tempVec2.x = math.randomRange(sourcePos.x - rangeSize.x, sourcePos.x + rangeSize.x);
            _tempVec2.y = math.randomRange(sourcePos.y - rangeSize.y, sourcePos.y + rangeSize.y);
        }
    } else if (psys.shapeMode === EmitterShape.CIRCLE) {
        const a = Math.random() * 2 * Math.PI;
        const sin = Math.sin(a);
        const cos = Math.cos(a);
        if(innerRangeSize) {
            // cirque
            let rx = math.randomRange(innerRangeSize.x, rangeSize.x);
            let ry = math.randomRange(innerRangeSize.y, rangeSize.y);
            _tempVec2.x = sourcePos.x + rx * cos - ry * sin;
            _tempVec2.y = sourcePos.y + rx * sin + ry * cos;
        }else{
            _tempVec2.x = sourcePos.x + rangeSize.x * cos - rangeSize.y * sin;
            _tempVec2.y = sourcePos.y + rangeSize.x * sin + rangeSize.y * cos;
        }
    } else {
        _tempVec2.x = sourcePos.x;
        _tempVec2.y = sourcePos.y;
    }

    return _tempVec2;
}

export function getComponentInParent<T extends Component>(node: Node, type: __private._types_globals__Constructor<T>): T {
    let parent = node.parent;
    while (parent) {
        let comp = parent.getComponent(type);
        if (comp) {
            return comp;
        }
        parent = parent.parent;
    }
    return null;
}

export function getComponentInChildren<T extends Component>(node: Node, type: __private._types_globals__Constructor<T>): T {
    let children = node.children;
    for (let i = 0; i < children.length; i++) {
        let comp = children[i].getComponent(type);
        if (comp) {
            return comp;
        }
    }
    return null;
}

const _tempVec2 = {x: 0, y: 0};