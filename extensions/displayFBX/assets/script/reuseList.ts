import { _decorator, Component, Node, ScrollViewComponent, Prefab, WidgetComponent, UITransformComponent, Enum, MaskComponent, Vec3, log, Size} from "cc";
import PoolManager from "./poolManager";
const { ccclass, menu, property, disallowMultiple, requireComponent} = _decorator;
const SCROLL_NUM = Enum({
    /**
     * !#en Items arranged from top to bottom.
     * !#zh 从上到下排列
     * @property {Number} TOP_TO_BOTTOM
     */
    TOP_TO_BOTTOM: 0,
    /**
     * !#en Items arranged from left to right.
     * !#zh 从左往右排列
     * @property {Number} LEFT_TO_RIGHT
     */
    LEFT_TO_RIGHT: 1,
});

const SCROLL_TYPE = Enum({
    /**
     * !#en Items arranged from top to bottom.
     * !#zh 从上到下滑动
     * @property {Number} 上下滑动
     */
    //'上下滑动' = SCROLL_NUM.TOP_TO_BOTTOM,
    //TOP_TO_BOTTOM: 0,
    '上下滑动': 0,
    /**
     * !#en Items arranged from left to right.
     * !#zh 从左往右滑动
     * @property {Number} 左右滑动
     */
    //'左右滑动' = SCROLL_NUM.LEFT_TO_RIGHT,
    //LEFT_TO_RIGHT: 1
    '左右滑动': 1
});
@ccclass("reuseList")
@menu('自定义组件/reuseList')
@requireComponent(ScrollViewComponent)
@disallowMultiple
export class reuseList extends Component {
    /* class member could be defined like this */
    // dummy = '';

    /* use `property` decorator if your want the member to be serializable */
    // @property
    // serializableDummy = 0;

    updateTimer: number = 0;
    updateInterval: number = 0.2;
    datas: any[] = [];
    scrollView: ScrollViewComponent;
    content: Node;
    isChange: boolean;
    positions: any[];
    count: number;
    _scrollType: any;

    /**
     * 容器内左边距
     * @property {ReuseList.SCROLL_NUM} scrollType
     */
    @property({tooltip: '选择滚动类型',  displayName: '滚动类型', type: SCROLL_TYPE})
    scrollType: any = SCROLL_NUM.TOP_TO_BOTTOM;
    /**
     * 容器内左边距
     * @property {Number} paddingLeft
     */
    @property({tooltip: '容器内左边距'})
    paddingLeft: number = 0;

    /**
     * 容器内上边距
     * @property {Number} paddingTop
     */
    @property({tooltip: '容器内上边距'})
    paddingTop: number = 0;

    /**
     * 子节点之间的水平间距。
     * @property {Number} spacingX
     */
    @property({tooltip: '子节点之间的水平间距'})
    spacingX: number = 0;

    /**
     * 子节点之间的垂直间距。
     * @property {Number} spacingY
     */
    @property({tooltip: '子节点之间的垂直间距'})
    spacingY: number = 0;

    /**
     * 子节点的Prefab。
     * @property {cc.Prefab} itemPrefab
     */
    @property({tooltip: '子节点的Prefab', type: Prefab})
    itemPrefab: Prefab = null;

    /**
     * prefab缩放大小。
     * @property {cc.Prefab} prefabScale
     */
    @property({tooltip: 'prefab缩放大小'})
    prefabScale: number = 1;

    /**
     * 子节点大小可变
     * @property {boolean} variableSizeOfChild
     */
    @property({tooltip: '子节点大小可变'})
    variableSizeOfChild: boolean = false;

    onLoad () {
        this.scrollView = this.node.getComponent(ScrollViewComponent);
        this.content = this.scrollView.content;
        this.content.getComponent(UITransformComponent)?.setAnchorPoint(0, 1);
        let widgetComponent = this.content.getComponent(WidgetComponent);
        if (!widgetComponent) {
            widgetComponent = this.content.addComponent(WidgetComponent);
        }

        widgetComponent.top = 0;
        widgetComponent.bottom = 0;
        widgetComponent.isAlignLeft = true;
        widgetComponent.isAlignTop = true;
        widgetComponent.isAlignRight = false;
        widgetComponent.isAlignBottom = false;
        widgetComponent.isAlignVerticalCenter = false;
        widgetComponent.isAlignHorizontalCenter = false;
        widgetComponent.updateAlignment();

        if (this.scrollType === SCROLL_NUM.TOP_TO_BOTTOM) {
            this.scrollView.vertical = true;
            this.scrollView.horizontal = false;
        } else if (this.scrollType === SCROLL_NUM.LEFT_TO_RIGHT) {
            this.scrollView.vertical = false;
            this.scrollView.horizontal = true;
        }
    }

    start () {

    }


    onEnable () {
        if (!this.variableSizeOfChild) return;
        this.content.on(Node.EventType.CHILD_ADDED, this.doLayout, this);
        this.content.on(Node.EventType.CHILD_REMOVED, this.doLayout, this);
    }

    onDisable () {
        if (!this.variableSizeOfChild) return;
        this.content.off(Node.EventType.CHILD_ADDED, this.doLayout, this);
        this.content.off(Node.EventType.CHILD_REMOVED, this.doLayout, this);
    }

    /**
     * 初始化列表数据
     * @param {Array} datas 列表数据
     * @method init
     */
    init (datas: Array) {
        this.isChange = true;
        this.positions = [];

        this.datas = datas instanceof Array ? datas : [];

        const size = this.node.getComponent(UITransformComponent)?.contentSize;
        if (this.scrollType === SCROLL_NUM.TOP_TO_BOTTOM) {
            this.count = Math.floor((size.width - this.paddingLeft) / (this.getPrefabWidth() + this.spacingX));
        } else {
            this.count = Math.floor((size.width - this.paddingTop) / (this.getPrefabHeight() + this.spacingY));
        }

        this.count = this.count > 0 ? this.count : 1;

        let i = 0;
        for (; i < this.datas.length; i++) {
            let widthIndex;
            let heightIndex;
            if (this.scrollType === SCROLL_NUM.TOP_TO_BOTTOM) {
                widthIndex = i % this.count;
                heightIndex = Math.floor(i / this.count);
            } else {
                widthIndex = Math.floor(i / this.count);
                heightIndex = i % this.count;
            }

            const width = this.getPrefabWidth();
            const height = this.getPrefabHeight();
            this.positions.push(new Vec3(this.paddingLeft + this.spacingX * widthIndex + width * (widthIndex + 1 / 2),
                -(this.paddingTop + this.spacingY * heightIndex + height * (heightIndex + 1 / 2)), 0));
        }

        // 设置节点大小
        const sizeWidth = this.getPrefabWidth();
        const sizeHeight = this.getPrefabHeight();

        if (this.scrollType === SCROLL_NUM.TOP_TO_BOTTOM) {
            const sizeHeightIndex = Math.ceil(i / this.count);
            this.content.getComponent(UITransformComponent)?.setContentSize(
                new Size(size.width, this.paddingTop + this.spacingY * sizeHeightIndex + sizeHeight * sizeHeightIndex),
            );
        } else {
            const sizeWidthIndex = Math.ceil(i / this.count);
            this.content.getComponent(UITransformComponent)?.setContentSize(
                new Size(this.paddingLeft + this.spacingX * sizeWidthIndex + sizeWidth * sizeWidthIndex, size.height),
            );
        }
    }

    /**
     * 处理节点
     */
    handleNode () {
        let child;
        const num = [];
        for (let i = 0; i < this.datas.length; i++) {
            const viewPos = this.getPositionInView(this.positions[i]);
            if (this.isOverBorder(viewPos)) {
                child = this.content.getChildByName(String(i));
                if (child) {
                    // 超出边缘删除节点
                    this.remove(child);
                }
            } else {
                num.push(i);
                child = this.content.getChildByName(String(i));
                if (!child) {
                    // 可视范围内显示节点
                    this.create(child, i);
                } else if (this.isChange) {
                    this.node.emit('show', { index: i, node: child, data: this.datas[i] });
                    child.setPosition(this.positions[i]);
                    child.name = String(i);
                }
            }
        }

        // 清除多余节点
        if (this.isChange) {
            const { children } = this.content;
            log(`num${num}`);
            for (let i = 0; i < children.length;) {
                child = children[i];
                if (num.indexOf(parseInt(child.name)) === -1) {
                    log(`remove${child.name}`);
                    this.remove(child);
                } else {
                    i++;
                }
            }
        }

        this.isChange = false;
    }

    update (dt) {
        this.updateTimer += dt;
        if (this.updateTimer < this.updateInterval) {
            return; // we don't need to do the math every frame
        }

        this.updateTimer = 0;
        this.handleNode();
    }

    /**
     * 获取子节点高
     */
    getPrefabHeight () {
        return this.itemPrefab.data.getComponent(UITransformComponent)?.height * this.prefabScale;
    }

    /**
     * 获取子节点宽
     */
    getPrefabWidth () {
        return this.itemPrefab.data.getComponent(UITransformComponent)?.width * this.prefabScale;
    }

    /**
     * 获取子节点的位置
     */
    getPositionInView (position: Vec3) { // get item position in scrollview's node space
        const worldPos = this.content.getComponent(UITransformComponent)?.convertToWorldSpaceAR(position);
        const viewPos = this.node.getComponent(UITransformComponent)?.convertToNodeSpaceAR(worldPos);
        return viewPos;
    }

    onDestory () {
        PoolManager.instance.clearPool(this.itemPrefab.data.name);
    }

    /**
     *
     * @param {*} child
     * @param {*} index
     */
    create (child: Node, index: number) {
        child = PoolManager.instance.getNode(this.itemPrefab, this.content);
        if (this.variableSizeOfChild) child.on(Node.EventType.SIZE_CHANGED, this.doLayout, this);
        child.setScale(this.prefabScale, this.prefabScale, this.prefabScale);
        child.setPosition(this.positions[index]);
        child.name = String(index);
        this.node.emit('show', { index, node: child, data: this.datas[index] });
    }

    /**
     * 移除子节点
     * @param {cc.Node} child
     */
    remove (child: Node) {
        if (this.variableSizeOfChild) child.off(Node.EventType.SIZE_CHANGED, this._doLayoutDirty, this);
        PoolManager.instance.putNode(child);
    }

    /**
     * 获取当前位置是否超出
     * @param {cc.v2} viewPos
     */
    isOverBorder (viewPos) {
        const size = this.node.getComponent(UITransformComponent)?.contentSize;
        const { height } = size;
        const itemHeight = this.getPrefabHeight();
        const { width } = size;
        const itemWidth = this.getPrefabWidth();
        const borderHeight = height / 2 + itemHeight / 2;
        const borderWidth = width + itemWidth / 2;
        if (this.scrollType === SCROLL_NUM.TOP_TO_BOTTOM) {
            return viewPos.y > borderHeight || viewPos.y < -borderHeight;
        }
        return viewPos.x > borderWidth;
    }

    doLayout () {
        if (!this.datas.length) return;
        const size =  this.node.getComponent(UITransformComponent)?.contentSize;

        let i = 0;
        let curWidth = this.paddingLeft;
        let curHeight = this.paddingTop;
        let width;
        let height;
        this.positions = [];
        for (; i < this.datas.length; i++) {
            const child = this.content.getChildByName(String(i));
            width = this.getPrefabWidth();
            height = this.getPrefabHeight();
            if (child) {
                width = child.getComponent(UITransformComponent)?.width;
                height = child.getComponent(UITransformComponent)?.height;
            }

            if (this.scrollType === SCROLL_NUM.TOP_TO_BOTTOM) {
                if (i % this.count === 0) {
                    curWidth = this.paddingLeft + width / 2;
                    if (i === 0) curHeight += height / 2;
                    else curHeight += height / 2 + this.spacingY;
                }
            } else if (i % this.count === 0) {
                curHeight = this.paddingTop + height / 2;
                if (i === 0) curWidth += width / 2;
                else curWidth += width / 2 + this.spacingY;
            }

            this.positions.push(new Vec3(curWidth, -curHeight, 0));
            if (child && this.positions[i] !== child.getPosition()) {
                child.setPosition(this.positions[i]);
            }
            if (this.scrollType === SCROLL_NUM.TOP_TO_BOTTOM) {
                curWidth += width + this.spacingX;
                if ((i + 1) % this.count === 0) curHeight += height / 2;
            } else {
                curHeight += height + this.spacingY;
                if ((i + 1) % this.count === 0) curWidth += width / 2;
            }
        }

        if (this.scrollType === SCROLL_NUM.TOP_TO_BOTTOM) {
            this.content.getComponent(UITransformComponent)?.setContentSize(new Size(size.width, curHeight));
        } else {
            this.content.getComponent(UITransformComponent)?.setContentSize(new Size(curWidth, size.height));
        }
    }
};

/**
 * 子节点显示监听事件，通过 this.node.on('show', callback, this); 进行监听。
 * @event show
 * @param {Object} obj 返回节点信息对象
 *        {number} obj.index  节点索引
 *        {cc.Node} obj.node  节点
 *        {Object} obj.data  节点信息
 * @example
 * this.node.on('show', callback, this);
 * const callback = (obj) => {
 *     const index = detail.index; //  节点索引
 *     const node = detail.node; // 节点
 *     const data = detail.data; // 节点信息
 * }
 * this.node.off('show', callback, this);
 */