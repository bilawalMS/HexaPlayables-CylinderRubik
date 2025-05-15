import { Prefab, NodePool, Node, _decorator } from "cc";

// Learn TypeScript:
//  - [Chinese] https://docs.cocos.com/creator/manual/zh/scripting/typescript.html
//  - [English] http://www.cocos2d-x.org/docs/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - [Chinese] https://docs.cocos.com/creator/manual/zh/scripting/reference/attributes.html
//  - [English] http://www.cocos2d-x.org/docs/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - [Chinese] https://docs.cocos.com/creator/manual/zh/scripting/life-cycle-callbacks.html
//  - [English] http://www.cocos2d-x.org/docs/creator/manual/en/scripting/life-cycle-callbacks.html

const { ccclass, property } = _decorator;

@ccclass("PoolManager")
export default class PoolManager {

    static _instance: PoolManager;

    static get instance () {
        if (this._instance) {
            return this._instance;
        }

        this._instance = new PoolManager();
        return this._instance;
    }

    dictPool = {}

    /**
     * 预生成对象池
     * @param prefabList    需要预生成对象池的预制体或节点
     * @param nodeNum       对象池节点数量,默认是1
     * @method prePool
     */
    prePool (prefabList: [Prefab], nodeNum = 1) {
        for (let i = 0; i < prefabList.length; i++) {
            const obj = prefabList[i];
            const { name } = obj;
            const pool = new NodePool();
            this.dictPool[name] = pool;
            for (let j = 0; j < nodeNum; j++) {
                const node = cc.instantiate(obj);
                pool.put(node);
            }
        }
    }

    /**
     * 根据预设从对象池中获取对应节点
     */
    getNode (prefab: Prefab|Node, parent: Node) {
        let name = prefab.name;
        //@ts-ignore
        if (!prefab.position) {
            //@ts-ignore
            name = prefab.data.name;
        }
        
        let node = null;
        if (this.dictPool.hasOwnProperty(name)) {
            //已有对应的对象池
            let pool = this.dictPool[name];
            if (pool.size() > 0) {
                node = pool.get();
            } else {
                node = cc.instantiate(prefab);
            }
        } else {
            //没有对应对象池，创建他！
            let pool = new cc.NodePool();
            this.dictPool[name] = pool;

            node = cc.instantiate(prefab);
        }

        node.parent = parent;
        return node as Node;
    }

    /**
     * 将对应节点放回对象池中
     */
    putNode (node: Node) {
        let name = node.name;
        let pool = null;
        if (this.dictPool.hasOwnProperty(name)) {
            //已有对应的对象池
            pool = this.dictPool[name];
        } else {
            //没有对应对象池，创建他！
            pool = new cc.NodePool();
            this.dictPool[name] = pool;
        }

        pool.put(node);
    }

    /**
     * 根据名称，清除对应对象池
     */
    clearPool (name: string) {
        if (this.dictPool.hasOwnProperty(name)) {
            let pool = this.dictPool[name];
            pool.clear();
        }
    }

    /**
     * 清除全部对象池
     * @method clearAllPool
     */
    clearAllPool () {
        const keys = Object.keys(this.dictPool);

        keys.forEach((element) => {
            const pool = this.dictPool[element];
            pool.clear();
        });

        this.dictPool = {};
    }

    // update (dt) {}
}
