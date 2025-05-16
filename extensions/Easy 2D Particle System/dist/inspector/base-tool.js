"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseTool = void 0;
const paper_1 = __importDefault(require("paper"));
class BaseTool {
    get canvas() {
        return this._canvas;
    }
    get p2d() {
        return this._p2d;
    }
    get system() {
        return this._system;
    }
    get editorLayer() {
        return this._editorLayer;
    }
    get paper() {
        return this._paper;
    }
    constructor(canvas) {
        this._canvas = canvas;
        this._tool = new paper_1.default.Tool();
        this._editorLayer = this.canvas.editorLayer;
        this._paper = this.canvas.paper;
    }
    static clearTool() {
        if (BaseTool.currentTool) {
            BaseTool.currentTool.setActive(false);
        }
    }
    get isCurrent() {
        return BaseTool.currentTool == this;
    }
    initial() {
        this._p2d = this.canvas.data;
        this._system = this._p2d.value.system;
        this.onInitial();
    }
    onInitial() {
    }
    update() {
        this._p2d = this.canvas.data;
        this._system = this._p2d.value.system;
        if (this.canUse()) {
            this.onRestore();
        }
        else {
            this.setActive(false);
        }
    }
    onRestore() {
    }
    canUse() {
        return true;
    }
    setActive(active) {
        if (active) {
            BaseTool.clearTool();
            this.initial();
            this.update();
            BaseTool.currentTool = this;
            this.canvas.onUpdate = this.update.bind(this);
            this._tool.onMouseDown = this.onMouseDown.bind(this);
            this._tool.onMouseDrag = this.onMouseDrag.bind(this);
            this._tool.onMouseUp = this.onMouseUp.bind(this);
            this._tool.activate();
        }
        else {
            BaseTool.currentTool = null;
            this.canvas.onUpdate = null;
            this._tool.onMouseDown = null;
            this._tool.onMouseDrag = null;
            this._tool.onMouseUp = null;
            this._editorLayer.removeChildren();
        }
        if (BaseTool.onToolChange) {
            BaseTool.onToolChange();
        }
    }
    get tool() {
        return this._tool;
    }
    onMouseDown(event) {
    }
    onMouseDrag(event) {
    }
    onMouseUp(event) {
    }
    doCommand(command, ...args) {
    }
}
exports.BaseTool = BaseTool;
BaseTool.currentTool = null;
