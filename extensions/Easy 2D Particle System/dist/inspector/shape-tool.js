"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ShapeTool = void 0;
const paper_1 = __importDefault(require("paper"));
const base_tool_1 = require("./base-tool");
class ShapeTool extends base_tool_1.BaseTool {
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
        for (let i = 0; i < poses.length; i++) {
            let p = poses[i].value;
            let pos = this.canvas.getCanvasPos(p);
            this._shape.add(pos);
        }
    }
    onMouseDown(event) {
        // 查找最近的点
        const hitResult = this.editorLayer.hitTest(event.point, {
            segments: true,
            stroke: true,
            tolerance: 8 / this.paper.view.zoom,
        });
        // 右键
        // @ts-ignore
        if (event.event.button == 2) {
            this._shape.selected = true;
            if (!hitResult) {
                if (!event.modifiers.shift) {
                    this._shape.add(event.point);
                }
            }
            else {
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
                        this._selectedSegment = this._shape.insert(location.index + 1, event.point);
                        this._selectedSegment.handleIn = this._selectedSegment.handleOut = null;
                    }
                }
            }
            // @ts-ignore
        }
        else if (event.event.button == 0) {
            if (hitResult) {
                this._shape.selected = true;
                if (hitResult.type == 'segment') {
                    this._selectedSegment = hitResult.segment;
                    // @ts-ignore
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
            this._selectedSegment.point.x += event.delta.x;
            this._selectedSegment.point.y += event.delta.y;
        }
    }
    onMouseUp(event) {
        const poses = this.system.value.pathEmitter.value.poses;
        const posesValue = poses.value;
        posesValue.length = 0;
        for (let i = 0; i < this._shape.segments.length; i++) {
            let seg = this._shape.segments[i];
            let pos = this.canvas.getWorldPos(seg.point);
            let data = JSON.parse(JSON.stringify(poses.elementTypeData));
            data.value.x = pos.x;
            data.value.y = pos.y;
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
exports.ShapeTool = ShapeTool;
