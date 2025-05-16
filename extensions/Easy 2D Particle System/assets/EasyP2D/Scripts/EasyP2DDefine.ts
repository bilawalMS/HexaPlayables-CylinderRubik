/*
 Copyright (c) 2020-2023 Xiamen Yaji Software Co., Ltd.

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

import { Enum } from "cc";

/**
 * Image formats
 * @enum macro.ImageFormat
 */
export enum ImageFormat {
    /**
     * @en Image Format:JPG
     * @zh 图片格式:JPG
     */
    JPG,
    /**
     * @en Image Format:PNG
     * @zh 图片格式:PNG
     */
    PNG,
    /**
     * @en Image Format:TIFF
     * @zh 图片格式:TIFF
     */
    TIFF,
    /**
     * @en Image Format:WEBP
     * @zh 图片格式:WEBP
     */
    WEBP,
    /**
     * @en Image Format:PVR
     * @zh 图片格式:PVR
     */
    PVR,
    /**
     * @en Image Format:ETC
     * @zh 图片格式:ETC
     */
    ETC,
    /**
     * @en Image Format:S3TC
     * @zh 图片格式:S3TC
     */
    S3TC,
    /**
     * @en Image Format:ATITC
     * @zh 图片格式:ATITC
     */
    ATITC,
    /**
     * @en Image Format:TGA
     * @zh 图片格式:TGA
     */
    TGA,
    /**
     * @en Image Format:RAWDATA
     * @zh 图片格式:RAWDATA
     */
    RAWDATA,
    /**
     * @en Image Format:UNKNOWN
     * @zh 图片格式:UNKNOWN
     */
    UNKNOWN,
}

export const ParticleGroup = Enum({
    Life: "Life",
    Color: "Color",
    Angle: "Angle",
    Size: "Size",
    Speed: "Speed",
    Emitter: "Emitter",
    Animation: "Animation",
    Trail: "Trail",
});

export const ExpansionType = Enum({
    None: 0,
    Random: 1,
    Out: 2,
    In: 3,
});

export const Clockwise = Enum({
    None: 0,
    Clockwise: 1,
    AntiClockwise: 2,
});

/**
 * @en The Particle emitter lives forever.
 * @zh 表示发射器永久存在
 * @static
 * @readonly
 */
export const DURATION_INFINITY = -1;

/**
 * @en The starting size of the particle is equal to the ending size.
 * @zh 表示粒子的起始大小等于结束大小。
 * @static
 * @readonly
 */
export const START_SIZE_EQUAL_TO_END_SIZE = -1;

/**
 * @en The starting radius of the particle is equal to the ending radius.
 * @zh 表示粒子的起始半径等于结束半径。
 * @static
 * @readonly
 */
export const START_RADIUS_EQUAL_TO_END_RADIUS = -1;

export const EmitterShape = Enum({
    /**
     * @en No Emiiter.
     * @zh 木有发射器
     */
    NONE: 0,
    /**
     * @en Uses gravity, speed, radial and tangential acceleration.
     * @zh 重力模式，模拟重力，可让粒子围绕一个中心点移近或移远。
     */
    BOX: 1,
    /**
     * @en Uses radius movement + rotation.
     * @zh 半径模式，可以使粒子以圆圈方式旋转，它也可以创造螺旋效果让粒子急速前进或后退。
     */
    CIRCLE: 2,
    /**
     * @en Custom mode, you define particle position.
     * @zh 自定义模式
     */
    CUSTOM: 3,
});

/**
 * @en Enum for emitter modes
 * @zh 发射模式
 * @enum ParticleSystem.EmitterMode
 */
export const EmitterMode = Enum({
    /**
     * @en No Emiiter.
     * @zh 木有发射器
     */
    NONE: 0,
    /**
     * @en Uses gravity, speed, radial and tangential acceleration.
     * @zh 重力模式，模拟重力，可让粒子围绕一个中心点移近或移远。
     */
    GRAVITY: 1,
    /**
     * @en Target mode, particles are emitted towards the direction of the target.
     * @zh 目标模式，可以使粒子朝向一个指定的位置移动
     */
    TARGET: 2,
});

export const SpaceMode = Enum({
    Local: 0,
    World: 1,
});

/**
 * @en Enum for particles movement type.
 * @zh 粒子位置类型
 * @enum ParticleSystem.PositionType
 */
export const PositionType = Enum({
    /**
     * @en
     * Living particles are attached to the world and are unaffected by emitter repositioning.
     * @zh
     * 自由模式，相对于世界坐标，不会随粒子节点移动而移动。（可产生火焰、蒸汽等效果）
     */
    FREE: 0,

    /**
     * @en
     * In the relative mode, the particle will move with the parent node, but not with the node where the particle is.
     * For example, the coffee in the cup is steaming. Then the steam moves (forward) with the train, rather than moves with the cup.
     * @zh
     * 相对模式，粒子会跟随父节点移动，但不跟随粒子所在节点移动，例如在一列行进火车中，杯中的咖啡飘起雾气，
     * 杯子移动，雾气整体并不会随着杯子移动，但从火车整体的角度来看，雾气整体会随着火车移动。
     */
    RELATIVE: 1,

    /**
     * @en
     * Living particles are attached to the emitter and are translated along with it.
     * @zh
     * 整组模式，粒子跟随发射器移动。（不会发生拖尾）
     */
    GROUPED: 2,
});

export const VelocityType = Enum({
    /**
     * @en
     * move direction by start position
     * @zh
     * 按开始位置与原点连线方向移动
     */
    StartDirection: 0,
    /**
     * @en
     * move direction by start angle
     * @zh
     * 沿着初始角度方向移动
     */
    FireDirection: 1,
});

export const DirectionType = Enum({
    None: 0,
    MoveDir: 1,
    FireDir: 2,
});

export const ValueType = Enum({
    Constant: 0,
    Curve: 1,
    TwoCurves: 2,
    TwoConstants: 3,
});

export const PathEmitMode = Enum({
    Random: 0,
    ByTime: 1,
});

export const AccelRelationDirection = Enum({
    FireDir: 0,
    MoveDir: 1,
    CenterDir: 2,
});