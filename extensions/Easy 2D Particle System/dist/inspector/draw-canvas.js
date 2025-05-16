"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DrawCanvas = void 0;
const paper_1 = __importDefault(require("paper"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const SCALE = 1;
const GRID_COUNT = 50;
const GRID_CELL_SIZE = 100;
let WORLD_SIZE = GRID_CELL_SIZE * (GRID_COUNT + 1);
const POS = {
    x: 0,
    y: 0,
};
const ANGLE_TO_RAD = Math.PI / 180;
var PathType;
(function (PathType) {
    PathType[PathType["SourcePos"] = 0] = "SourcePos";
    PathType[PathType["RangeSize"] = 1] = "RangeSize";
    PathType[PathType["FireDir"] = 2] = "FireDir";
    PathType[PathType["Shape"] = 3] = "Shape";
    PathType[PathType["Path"] = 4] = "Path";
})(PathType || (PathType = {}));
class DrawCanvas {
    get canvas() {
        return this._canvas;
    }
    get paper() {
        return this._paper;
    }
    get gridLayer() {
        return this._gridLayer;
    }
    get pathLayer() {
        return this._pathLayer;
    }
    get editorLayer() {
        return this._editorLayer;
    }
    get data() {
        return this._data;
    }
    constructor(canvas) {
        this._first = true;
        this._saving = false;
        this._defaultZoom = 1;
        this._canvas = canvas;
        this._paper = new paper_1.default.PaperScope();
        this._paper.setup(canvas);
        this._paper.view.center = new this._paper.Point(0, 0);
        this._paper.view.onMouseDown = this.onMouseDown.bind(this);
        this._paper.view.onMouseDrag = this.onMouseDrag.bind(this);
        this._paper.view.onMouseUp = this.onMouseUp.bind(this);
        // this._paper.view.onMouseMove = this.onMouseMove.bind(this);
        this._canvas.onmousemove = this.onMouseMoveX.bind(this);
        // this._paper.view.onResize = this.onResize.bind(this);
        canvas.onwheel = this.onMouseWheel.bind(this);
        this._gridLayer = new this._paper.Layer();
        this._paper.project.addLayer(this._gridLayer);
        this._pathLayer = new this._paper.Layer();
        this._paper.project.addLayer(this._pathLayer);
        this._editorLayer = new this._paper.Layer();
        this._paper.project.addLayer(this._editorLayer);
        this.drawGrid();
        this.drawScreenRange();
    }
    initView() {
        if (!this._first) {
            return;
        }
        this._first = false;
        const system = this._data.value.system.value;
        let pos = this.getCanvasPos(system.sourcePos.value);
        let size = this.getCanvasSize(system.rangeSize.value);
        let maxx = pos.x + size.width * 0.5;
        let minx = pos.x - size.width * 0.5;
        let maxy = pos.y + size.height * 0.5;
        let miny = pos.y - size.height * 0.5;
        let w = maxx - minx;
        let h = maxy - miny;
        let min = Math.max(10, Math.max(w, h));
        let zoom = this._paper.view.zoom;
        if (min > 0) {
            zoom = Math.max(1, Math.min(8, 100 / min));
        }
        this._defaultZoom = zoom;
        this._paper.view.zoom = zoom;
    }
    onResize(event) {
        // this._paper.view.viewSize = new this._paper.Size(this._canvas.width, this._canvas.height);
    }
    update(data) {
        this._data = data;
        if (this._saving) {
            this._saving = false;
            return;
        }
        this.initView();
        this._pathLayer.removeChildren();
        this.drawCenter();
        this.drawSourcePos();
        this.drawFireDir();
        if (this.onUpdate) {
            this.onUpdate(data);
        }
    }
    save() {
        this.saveData(this.data);
    }
    async saveData(data) {
        if (this._saving) {
            return;
        }
        this._saving = true;
        const uuid = Editor.Selection.getLastSelected('node');
        if (uuid) {
            await Editor.Message.send("scene", "set-property", {
                uuid: uuid,
                path: data.path,
                dump: data,
            });
        }
    }
    /**
     * set-property 设置某个元素内的属性
     * @param options {SetPropertyOptions}
     * @param options.uuid {string} 修改属性的对象的 uuid
     * @param options.path {string} 属性挂载对象的搜索路径
     * @param options.dump {IProperty} 属性 dump 出来的数据
     * {uuid:uuid,path:'position',dump:{'type':'cc.Vec3','value':{'x':0,'y':0,'z':0}}}
     */
    async setProperty(options) {
        await Editor.Message.request('scene', 'set-property', options);
    }
    drawGrid() {
        if (this._gridLayer) {
            this._gridLayer.removeChildren();
        }
        let layer = this._gridLayer;
        this._paper.project.addLayer(layer);
        const path = new this._paper.CompoundPath({
            strokeColor: '#c0c0c0',
            strokeWidth: 0.1,
            fullySelected: false,
            locked: true,
        });
        layer.addChild(path);
        const size_2 = WORLD_SIZE * 0.5;
        path.addChild(new paper_1.default.Path([{ x: -size_2, y: 0 }, { x: size_2, y: 0 }]));
        path.addChild(new paper_1.default.Path([{ x: 0, y: -size_2 }, { x: 0, y: size_2 }]));
        let count_2 = Math.floor(GRID_COUNT * 0.5);
        for (let i = 0; i < count_2; i++) {
            let y = -i * GRID_CELL_SIZE;
            path.addChild(new paper_1.default.Path([{ x: -size_2, y: y }, { x: size_2, y: y }]));
        }
        for (let i = 0; i < count_2; i++) {
            let y = i * GRID_CELL_SIZE;
            path.addChild(new paper_1.default.Path([{ x: -size_2, y: y }, { x: size_2, y: y }]));
        }
        for (let i = 0; i < count_2; i++) {
            let x = -i * GRID_CELL_SIZE;
            path.addChild(new paper_1.default.Path([{ x: x, y: -size_2 }, { x: x, y: size_2 }]));
        }
        for (let i = 0; i < count_2; i++) {
            let x = i * GRID_CELL_SIZE;
            path.addChild(new paper_1.default.Path([{ x: x, y: -size_2 }, { x: x, y: size_2 }]));
        }
    }
    async drawScreenRange() {
        let configFile = path_1.default.join(Editor.Project.path, "settings/v2/packages/project.json");
        if (!fs_1.default.existsSync(configFile)) {
            return;
        }
        let config = JSON.parse(fs_1.default.readFileSync(configFile, "utf-8"));
        if (!config) {
            return;
        }
        if (!config.general || !config.general.designResolution) {
            return;
        }
        let w = config.general.designResolution.width;
        let h = config.general.designResolution.height;
        let layer = this._gridLayer;
        let rect = new paper_1.default.Path.Rectangle({
            point: [-w * 0.5, -h * 0.5],
            size: [w, h],
            strokeColor: '#ffff',
            strokeWidth: 0.5,
            fullySelected: false,
            locked: true,
        });
        layer.addChild(rect);
    }
    getCanvasPos(pos) {
        return new paper_1.default.Point(pos.x, -pos.y);
    }
    getWorldPos(pos) {
        return new paper_1.default.Point(pos.x, -pos.y);
    }
    getCanvasSize(size) {
        return new this._paper.Size(size.x / SCALE, size.y / SCALE);
    }
    drawCenter() {
        const system = this._data.value.system.value;
        const path = new this._paper.CompoundPath({
            strokeColor: '#00ff00',
            strokeWidth: 0.5,
            fullySelected: false,
            locked: true,
        });
        this._pathLayer.addChild(path);
        path.data = PathType.SourcePos;
        POS.x = 0;
        POS.y = 0;
        let pos = this.getCanvasPos(POS);
        let size = new this._paper.Size(10, 10);
        let w_2 = Math.max(5, size.width * 0.5);
        let h_2 = Math.max(5, size.height * 0.5);
        let p = new this._paper.Path();
        p.add(new this._paper.Point(pos.x - w_2, pos.y));
        p.add(new this._paper.Point(pos.x + w_2, pos.y));
        path.addChild(p);
        p = new this._paper.Path();
        p.add(new this._paper.Point(pos.x, pos.y - h_2));
        p.add(new this._paper.Point(pos.x, pos.y + h_2));
        path.addChild(p);
    }
    drawSourcePos() {
        const system = this._data.value.system.value;
        const path = new this._paper.CompoundPath({
            strokeColor: '#aa00ff',
            strokeWidth: 0.8,
            fullySelected: false,
            locked: true,
        });
        this._pathLayer.addChild(path);
        path.data = PathType.SourcePos;
        let pos = this.getCanvasPos(system.sourcePos.value);
        let size = this.getCanvasSize(system.rangeSize.value);
        let w_2 = Math.max(1, size.width * 0.5);
        let h_2 = Math.max(1, size.height * 0.5);
        let p = new this._paper.Path();
        p.add(new this._paper.Point(pos.x - w_2, pos.y));
        p.add(new this._paper.Point(pos.x + w_2, pos.y));
        path.addChild(p);
        p = new this._paper.Path();
        p.add(new this._paper.Point(pos.x, pos.y - h_2));
        p.add(new this._paper.Point(pos.x, pos.y + h_2));
        path.addChild(p);
        if (system.shapeMode.value == 1) {
            pos.x -= w_2;
            pos.y -= h_2;
            let rect = new this._paper.Path.Rectangle({
                point: pos,
                size: size,
            });
            path.addChild(rect);
        }
        else if (system.shapeMode.value == 2) {
            let circle = new this._paper.Path.Ellipse({
                center: pos,
                radius: new this._paper.Size(w_2, h_2),
            });
            path.addChild(circle);
        }
    }
    drawFireDir() {
        const system = this._data.value.system.value;
        const path = new this._paper.CompoundPath({
            strokeColor: '#00ffff',
            strokeWidth: 0.3,
            fullySelected: false,
            locked: true,
            dashArray: [1, 0.2],
        });
        this._pathLayer.addChild(path);
        path.data = PathType.FireDir;
        const len = 10;
        const sourcePos = this.getCanvasPos(system.sourcePos.value);
        const fireAngle = system.fireAngle.value;
        if (fireAngle.mode.value == 0) {
            let angle = -fireAngle.constant.value * ANGLE_TO_RAD;
            this.drawAngleDir(path, sourcePos, angle, len);
        }
        else if (fireAngle.mode.value == 1) {
            this.drawSpineLine(path, fireAngle.spline, sourcePos, 8);
        }
        else if (fireAngle.mode.value == 2) {
            this.drawTwoSpineLine(path, fireAngle.splineMin, fireAngle.splineMax, sourcePos, 8);
        }
        else if (fireAngle.mode.value == 3) {
            let minAngle = -fireAngle.constantMin.value;
            let maxAngle = -fireAngle.constantMax.value;
            let curve = new paper_1.default.Group();
            path.addChild(curve);
            let count = Math.abs(Math.floor((maxAngle - minAngle) / (Math.PI / 24)));
            let lastPos = null;
            let dir = new paper_1.default.Point(len, 0);
            for (let i = 0; i <= count; i++) {
                let a = minAngle + (maxAngle - minAngle) * i / count;
                if (i == count) {
                    a = maxAngle;
                }
                let p = sourcePos.add(dir).rotate(a, sourcePos);
                if (i > 0) {
                    curve.addChild(new paper_1.default.Path([lastPos, p]));
                }
                lastPos = p;
                if (count > 1) {
                    if (i == 1) {
                        let item = curve.children[0];
                        let p0 = item.segments[0];
                        let p1 = item.segments[1];
                        let dir = p0.point.subtract(p1.point);
                        let size = 2;
                        const arrow = this.createArrow(p0.point, dir, size);
                        curve.addChild(arrow);
                    }
                    else if (i == count) {
                        let item = curve.children[curve.children.length - 1];
                        let p0 = item.segments[item.segments.length - 1];
                        let p1 = item.segments[item.segments.length - 2];
                        let dir = p0.point.subtract(p1.point);
                        let size = 2;
                        const arrow = this.createArrow(p0.point, dir, size);
                        curve.addChild(arrow);
                    }
                }
            }
            let g = new paper_1.default.Group([
                new paper_1.default.Path([sourcePos, sourcePos.add(dir).rotate(minAngle, sourcePos)]),
                new paper_1.default.Path([sourcePos, sourcePos.add(dir).rotate(maxAngle, sourcePos)]),
            ]);
            path.addChild(g);
        }
    }
    drawSpineLine(path, spline, sourcePos, len) {
        let multiplier = spline.value.multiplier;
        let frames = spline.value.keyFrames;
        for (let i = 0; i < frames.length; i++) {
            const frame = frames[i];
            const angle = -frame.value * multiplier * ANGLE_TO_RAD;
            const distance = len * Math.abs(angle) / Math.PI + len;
            const endPos = new this._paper.Point(sourcePos.x + distance * Math.cos(angle), sourcePos.y + distance * Math.sin(angle));
            let line = new this._paper.Path.Line({
                from: sourcePos,
                to: endPos,
            });
            path.addChild(line);
        }
        this.drawSpineCurve(path, spline, sourcePos, len, true, false, true);
    }
    drawSpineCurve(path, spline, sourcePos, len, step, startArrow = false, endArrow = true) {
        let multiplier = spline.value.multiplier;
        let frames = spline.value.keyFrames;
        let preAngle = 0;
        for (let i = 0; i < frames.length; i++) {
            const frame = frames[i];
            const angle = -frame.value * multiplier * ANGLE_TO_RAD;
            if (i != 0) {
                let count = Math.abs(Math.floor((angle - preAngle) / (Math.PI / 24)));
                if (count > 0) {
                    let p = new this._paper.Path();
                    // prePos到from的向量，绘制以sourcePos为中心,len为半径的曲线
                    for (let j = 0; j <= count; j++) {
                        let a = preAngle + (angle - preAngle) * j / count;
                        if (j == count) {
                            a = angle;
                        }
                        let d = len * Math.abs(a) / Math.PI * (step ? 1 : 0) + len;
                        let x = sourcePos.x + d * Math.cos(a);
                        let y = sourcePos.y + d * Math.sin(a);
                        p.add(new this._paper.Point(x, y));
                        if (startArrow && count > 1) {
                            if (j == 1) {
                                let p0 = p.segments[0];
                                let p1 = p.segments[1];
                                let dir = p0.point.subtract(p1.point);
                                let size = 2;
                                const arrow = this.createArrow(p0.point, dir, size);
                                path.addChild(arrow);
                            }
                        }
                        if (endArrow) {
                            if (j == count) {
                                let p0 = p.segments[p.segments.length - 1];
                                let p1 = p.segments[p.segments.length - 2];
                                let dir = p0.point.subtract(p1.point);
                                let size = 2;
                                const arrow = this.createArrow(p0.point, dir, size);
                                path.addChild(arrow);
                            }
                        }
                    }
                    path.addChild(p);
                }
            }
            preAngle = angle;
        }
    }
    drawTwoSpineLine(path, splineMin, splineMax, sourcePos, len) {
        this.drawSpineLine(path, splineMin, sourcePos, len - 2);
        this.drawSpineLine(path, splineMax, sourcePos, len + 2);
    }
    createArrow(pos, dir, len) {
        const arrowVector = dir.normalize(len);
        return new paper_1.default.Path([
            pos.add(arrowVector).rotate(135, pos),
            pos,
            pos.add(arrowVector).rotate(-135, pos),
        ]);
    }
    drawAngleDir(path, sourcePos, angle, len) {
        const endPos = new this._paper.Point(sourcePos.x + len * Math.cos(angle), sourcePos.y + len * Math.sin(angle));
        // // 绘制箭头
        let dir = endPos.subtract(sourcePos).normalize();
        const angleLen = 2;
        let g = new paper_1.default.Group([
            new paper_1.default.Path([sourcePos, endPos]),
            this.createArrow(endPos, dir, angleLen),
        ]);
        path.addChild(g);
    }
    drawPath() {
        const system = this._data.value.system.value;
        if (!system.pathEmitter || !system.pathEmitter.value || !system.pathEmitter.value.enabled.value) {
            return;
        }
        const pathEmitter = system.pathEmitter.value;
        if (pathEmitter.poses.value.length == 0) {
            return;
        }
        const path = new this._paper.CompoundPath({
            strokeColor: '#ff0000',
            strokeWidth: 0.8,
            fullySelected: false,
            locked: true,
        });
        path.data = PathType.Shape;
        this._pathLayer.addChild(path);
    }
    onMouseDown(event) {
    }
    onMouseDrag(event) {
    }
    onMouseUp(event) {
    }
    onMouseMove(event) {
    }
    onMouseMoveX(event) {
        //@ts-ignore
        if (event.buttons == 4) {
            let dx = -event.movementX / this._paper.view.zoom;
            let dy = -event.movementY / this._paper.view.zoom;
            let center = this._paper.view.center.add(new this._paper.Point(dx, dy));
            let canvasSize = this._paper.view.viewSize;
            let w_2 = canvasSize.width * 0.5 / this._paper.view.zoom;
            let h_2 = canvasSize.height * 0.5 / this._paper.view.zoom;
            let size_2 = WORLD_SIZE * 0.5;
            center.x = Math.max(-size_2 + w_2, Math.min(size_2 - w_2, center.x));
            center.y = Math.max(-size_2 + h_2, Math.min(size_2 - h_2, center.y));
            this._paper.view.center = center;
        }
    }
    onMouseWheel(event) {
        if (event.ctrlKey) {
            let zoom = this._paper.view.zoom + event.deltaY * 0.001;
            zoom = Math.max(0.1, zoom);
            zoom = Math.min(10, zoom);
            this._paper.view.zoom = zoom;
        }
    }
    center() {
        this._paper.view.center = new this._paper.Point(0, 0);
    }
}
exports.DrawCanvas = DrawCanvas;
const TEMP_POS = new paper_1.default.Point(0, 0);
