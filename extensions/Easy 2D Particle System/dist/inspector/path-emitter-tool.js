"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PathEmitterTool = void 0;
const paper_1 = __importDefault(require("paper"));
const base_tool_1 = require("./base-tool");
const HANDLE_SIZE = 5;
class PathEmitterTool extends base_tool_1.BaseTool {
    constructor() {
        super(...arguments);
        this.enableCurve = true;
    }
    onInitial() {
        this._shape = new paper_1.default.Path();
        this._shape.strokeWidth = 0.8;
        this._shape.strokeCap = 'round';
        this._shape.strokeJoin = 'round';
        this._shape.strokeColor = new paper_1.default.Color(1, 0, 0, 0.9);
        this._shape.fullySelected = true;
        this.editorLayer.addChild(this._shape);
    }
    canUse() {
        if (!this.system.value.pathEmitter) {
            return false;
        }
        return this.system.value.pathEmitter.value.enabled.value;
    }
    onRestore() {
        this._shape.removeSegments();
        let poses = this.system.value.pathEmitter.value.poses.value;
        this.enableCurve = this.system.value.pathEmitter.value.curveMode.value;
        for (let i = 0; i < poses.length; i++) {
            let p = poses[i].value;
            let pos = this.canvas.getCanvasPos(p.position.value);
            let handle1 = this.canvas.getCanvasPos(p.handle1.value);
            let handle2 = this.canvas.getCanvasPos(p.handle2.value);
            let seg;
            if (this.enableCurve) {
                seg = new paper_1.default.Segment(pos, handle1, handle2);
            }
            else {
                seg = new paper_1.default.Segment(pos);
            }
            ;
            // @ts-ignore
            seg.handles = {
                handleIn: handle1,
                handleOut: handle2,
            };
            this._shape.add(seg);
        }
    }
    onMouseDown(event) {
        // 查找最近的点
        const hitResult = this.editorLayer.hitTest(event.point, {
            segments: true,
            stroke: true,
            tolerance: 8 / this.paper.view.zoom,
            handles: true,
        });
        this._selectedSegment = null;
        this._shape.selected = false;
        // 右键
        // @ts-ignore
        if (event.event.button == 2) {
            this._shape.selected = true;
            if (!hitResult) {
                if (!event.modifiers.shift) {
                    let handle1 = new paper_1.default.Point(-HANDLE_SIZE, 0).add(event.point);
                    let handle2 = new paper_1.default.Point(HANDLE_SIZE, 0).add(event.point);
                    let seg;
                    if (this.enableCurve) {
                        seg = new paper_1.default.Segment(event.point, handle1, handle2);
                    }
                    else {
                        seg = new paper_1.default.Segment(event.point);
                    }
                    // @ts-ignore
                    seg.handles = {
                        handleIn: handle1,
                        handleOut: handle2,
                    };
                    this._shape.add(seg);
                }
            }
            else {
                this._selectedType = hitResult.type;
                if (hitResult.type == 'segment') {
                    hitResult.segment.remove();
                    this._selectedSegment = null;
                }
                else if (hitResult.type == 'stroke') {
                    var location = hitResult.location;
                    if (event.modifiers.shift) {
                        this._shape.removeSegment(location.index);
                    }
                    else {
                        this._shape.fullySelected = true;
                        this._selectedSegment = this._shape.insert(location.index + 1, event.point);
                        if (this.enableCurve) {
                            this._selectedSegment.handleIn = new paper_1.default.Point(-HANDLE_SIZE, 0).add(event.point);
                            this._selectedSegment.handleOut = new paper_1.default.Point(HANDLE_SIZE, 0).add(event.point);
                            // @ts-ignore
                            let handles = this._selectedSegment.handles;
                            handles.handleIn = this._selectedSegment.handleIn;
                            handles.handleOut = this._selectedSegment.handleOut;
                        }
                    }
                }
            }
            // @ts-ignore
        }
        else if (event.event.button == 0) {
            if (hitResult) {
                this._selectedType = hitResult.type;
                this._shape.fullySelected = true;
                this._shape.selected = true;
                if (hitResult.type == 'segment') {
                    this._selectedSegment = hitResult.segment;
                }
                else if (hitResult.type == 'handle-in' || hitResult.type == 'handle-out') {
                    this._selectedSegment = hitResult.segment;
                }
                else if (hitResult.type == 'stroke') {
                    var location = hitResult.location;
                    this._selectedSegment = location.segment;
                }
            }
            else {
                this._shape.selected = false;
                this._selectedSegment = null;
            }
        }
    }
    onMouseDrag(event) {
        if (this._selectedSegment) {
            if (this._selectedType == 'handle-in') {
                this._selectedSegment.handleIn.x += event.delta.x;
                this._selectedSegment.handleIn.y += event.delta.y;
            }
            else if (this._selectedType == 'handle-out') {
                this._selectedSegment.handleOut.x += event.delta.x;
                this._selectedSegment.handleOut.y += event.delta.y;
            }
            else {
                this._selectedSegment.point.x += event.delta.x;
                this._selectedSegment.point.y += event.delta.y;
            }
        }
    }
    onMouseUp(event) {
        const poses = this.system.value.pathEmitter.value.poses;
        const posesValue = poses.value;
        posesValue.length = 0;
        for (let i = 0; i < this._shape.segments.length; i++) {
            let seg = this._shape.segments[i];
            let pos = this.canvas.getWorldPos(seg.point);
            // @ts-ignore
            let handles = seg.handles;
            let handle1 = this.canvas.getWorldPos(handles.handleIn);
            let handle2 = this.canvas.getWorldPos(handles.handleOut);
            let data = JSON.parse(JSON.stringify(poses.elementTypeData));
            data.value.position.value.x = pos.x;
            data.value.position.value.y = pos.y;
            if (this.enableCurve) {
                data.value.handle1.value.x = handle1.x;
                data.value.handle1.value.y = handle1.y;
                data.value.handle2.value.x = handle2.x;
                data.value.handle2.value.y = handle2.y;
            }
            data.path = `${poses.path}.${i}`;
            data.name = `[${i}]`;
            posesValue.push(data);
        }
        this._selectedSegment = null;
        this.canvas.saveData(poses);
    }
    doCommand(command, ...args) {
        if (command == "clear") {
            this.clear();
        }
    }
    clear() {
        if (!this.isCurrent) {
            return;
        }
        const poses = this.system.value.pathEmitter.value.poses;
        const posesValue = poses.value;
        posesValue.length = 0;
        this._shape.removeSegments();
        this.canvas.saveData(poses);
    }
}
exports.PathEmitterTool = PathEmitterTool;
