
import { _decorator, Component, Node, assetManager, Prefab, getPathFromRoot, LabelComponent, SkeletalAnimation, ParticleSystemComponent, AnimationComponent } from 'cc';
import { Item } from './item';
import PoolManager from './poolManager';
import { reuseList } from './reuseList';
const { ccclass, property } = _decorator;

@ccclass('ChooseUI')
export class ChooseUI extends Component {
    // [1]
    // dummy = '';

    // [2]
    // @property
    // serializableDummy = 0;
    @property(Node)
    target: Node;

    @property(reuseList)
    gridView: reuseList;

    @property()
    resouceType: string = 'model';
    
    path: any;

    start () {
        // [3]
        this.path  = this._getAllPrefabPaths();
        let key = Object.keys(this.path).sort();
        this.gridView.init(key);
        if (key.length) this.showFBX(key[0]);

    }

    onEnable () {

        this.gridView.node.on('show', this.initItem, this);
    }

    onDisable () {

        this.gridView.node.off('show', this.initItem, this);
    }

    initItem (detail: any) {
        let index = detail.index;
        let node = detail.node;
        let content = detail.data;
        node.getComponent(Item).show(this, content);
    }

    _getAllPrefabPaths() {
        const paths = {};
        const added = [];
        const pathToUuid = assetManager.resources?.config.paths._map;
        const resPaths = Object.keys(pathToUuid);

        const { length } = resPaths;
        for (let i = 0; i < length; i += 1) {
            const aliasPath = resPaths[i];
            const aliasArr = aliasPath.split('/');
            const name = aliasArr[0];
            if (name !== this.resouceType) continue;
            const entryObj = pathToUuid[aliasPath];

            let entry = entryObj;
            let getTarget = false;
            if (entryObj.constructor === Array) {
                const { length: entryLength } = entryObj;
                for (let j = 0; j < entryLength; j += 1) {
                    entry = entryObj[j];
                    // 同名的资源中不会出现同类型的资源，因此只要检测到 prefab 立即跳出循环
                    if (entry && entry.ctor && entry.ctor === Prefab) {
                        if (this.resouceType !== 'model' && aliasArr.length === 4) break; //排除fbx
                        let resourceName = aliasArr[1];
                        if (this.resouceType !== 'model') {
                            resourceName = aliasArr[2];
                        }

                        if (added.indexOf(resourceName) > -1) {
                            console.error(`[panelManager] ${resourceName} of ${aliasPath} clash with ${paths[resourceName]}`);
                        } else {
                            paths[resourceName] = aliasPath;
                            added.push(resourceName);
                        }

                        break;
                    }
                }
            }
        }

        return paths;
    }

    showFBX (txt: string) {
        if (this.target.children.length) PoolManager.instance.putNode(this.target.children[0]);
        assetManager.getBundle('resources')?.load(this.path[txt], Prefab, (err: any, prefab: Prefab) => {
            if (err) return;
            let node = PoolManager.instance.getNode(prefab, this.target);
            node.setScale(1, 1, 1);
            node.getComponent(SkeletalAnimation)?.play();
            node.getComponent(AnimationComponent)?.play();
            node.getComponent(ParticleSystemComponent)?.clear();
            node.getComponent(ParticleSystemComponent)?.stop();
            node.getComponent(ParticleSystemComponent)?.play();
            let arrParticle = node.getComponentsInChildren(ParticleSystemComponent);
            arrParticle.forEach((item: ParticleSystemComponent)=>{
                item?.clear();
                item?.stop();
                item.loop = true;
                item?.play();
            })
            

        });
    }

    // update (deltaTime: number) {
    //     // [4]
    // }
}

/**
 * [1] Class member could be defined like this.
 * [2] Use `property` decorator if your want the member to be serializable.
 * [3] Your initialization goes here.
 * [4] Your update function goes here.
 *
 * Learn more about scripting: https://docs.cocos.com/creator/3.0/manual/en/scripting/
 * Learn more about CCClass: https://docs.cocos.com/creator/3.0/manual/en/scripting/ccclass.html
 * Learn more about life-cycle callbacks: https://docs.cocos.com/creator/3.0/manual/en/scripting/life-cycle-callbacks.html
 */
