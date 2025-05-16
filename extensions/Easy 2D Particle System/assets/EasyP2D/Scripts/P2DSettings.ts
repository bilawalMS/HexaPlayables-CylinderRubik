export const P2DSettings = {
    /**
     * @en Whether to enable the cache of the calculated value of the curve, which can improve the performance of the curve calculation
     * @zh 是否开启曲线计算值的缓存，可以提高曲线计算的性能
     **/    
    ENABLE_CALCULATE_CACHE: false,
    /**
     * @en The maximum cache value precision that can be stored when the cache is enabled
     * @zh 开启缓存时可以存储的最大缓存值精度
     */
    CALCULATE_CACHE_PERCENT: 2,

    /**
     * @en Whether to enable the batcher, which can improve the performance of the rendering
     * @zh 是否开启批处理器，可以提高渲染性能
     */
    ENABLE_BATCHER: true,

    /**
     * @en Whether to enable the swap batcher to prevent flicker
     * @zh 是否开启交换批处理器，防止闪缩
     */
    ENABLE_SWAP_BATCHER: false,

    /**
     * @en Whether to enable the particle transform, turning off can improve the rendering performance of the particles, but the rotation, scaling, etc. of the particles will be lost
     * @zh 是否开启粒子变换，关闭后可以提高粒子渲染性能，但是会失去粒子的旋转、缩放等功能
     */
    SUPPORT_PARTICLE_TRANSFORM: true,
}