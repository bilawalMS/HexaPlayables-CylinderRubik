'use strict';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.close = exports.ready = exports.update = exports.methods = exports.$ = exports.style = exports.template = void 0;
//@ts-ignore
const package_json_1 = __importDefault(require("../../package.json"));
const fs_extra_1 = require("fs-extra");
const path_1 = require("path");
const vue_1 = require("vue");
const paper_1 = __importDefault(require("paper"));
const weakMap = new WeakMap();
exports.template = `
<div id="app" width="100%" height="100%">
    <canvas id="editorCanvas" class="edit-canvas" ref="editorCanvas"></canvas>
    <span class="editor-top-left-title">
        Shift: Snap to grid <br>
        Control: Single Point Mode <br>
        Right Mouse: Insert/Delete Point <br>
        Left Mouse: Add Point<br>
    </span>
    <ui-button @click="onDelete" :disabled="!pathSelected">Delete</ui-button>
    <ui-button @click="onTrim" :disabled="!pathSelected">Simplify</ui-button>
    <ui-checkbox :value="isClosed" @change="onCloseChanged" :disabled="!canClose">Close</ui-checkbox>
    <ui-button @click="onClear">Clear</ui-button>
    <ui-button @click="onSave">Save</ui-button> 
</div>
<ui-prop type="dump" id="patternName"></ui-prop>
<ui-prop type="dump" id="points" readonly></ui-prop>
`;
exports.style = (0, fs_extra_1.readFileSync)((0, path_1.join)(__dirname, '../../static/style/default/index.css'), 'utf-8');
exports.$ = {
    app: '#app',
    patternName: '#patternName',
    points: '#points',
};
function setVisible(element, visible) {
    element.style.display = visible ? 'block' : 'none';
}
const drawPaths = [];
const gridCount = 10;
const hitOptions = {
    segments: true,
    stroke: true,
    fill: true,
    tolerance: 5
};
var currentData = null;
var canvas = null;
var innerSave = false;
var snapNow = null;
exports.methods = {};
function restore() {
    if (innerSave) {
        innerSave = false;
        return;
    }
    for (let i = 0; i < drawPaths.length; i++) {
        drawPaths[i].remove();
    }
    drawPaths.length = 0;
    let points = currentData.value.points.value;
    let path = null;
    let pathid = 0;
    for (let i = 0; i < points.length; i++) {
        let pt = points[i].value;
        let type = pt.w || 0;
        if (type == 0) {
            if (path != null && pt.z != pathid) {
                let first = path.segments[0];
                let last = path.segments[path.segments.length - 1];
                if (Math.abs(first.point.x - last.point.x) <= 0.001 && Math.abs(first.point.y - last.point.y) <= 0.001) {
                    path.closed = true;
                }
                path = null;
            }
            if (path == null) {
                path = new myPaper.Path({
                    strokeColor: 'green',
                    fullySelected: false,
                });
                path._type = type;
                drawPaths.push(path);
            }
            let size = canvas.width;
            path.add(new myPaper.Point(pt.x * size, pt.y * size));
        }
        else if (type == 1) {
            let circle = new myPaper.Path.Circle({
                center: new myPaper.Point(pt.x * canvas.width, pt.y * canvas.height),
                radius: 5,
                fillColor: 'red',
                fullySelected: false,
            });
            circle._type = type;
            drawPaths.push(circle);
        }
        pathid = pt.z;
    }
}
function update(dump) {
    currentData = dump;
    this.dump = dump;
    this.$.patternName.render(dump.value.patternName);
    this.$.points.render(dump.value.points);
    restore();
}
exports.update = update;
var myPaper;
var selectedSegment;
var movePath = false;
var vuewApp;
function ready() {
    if (this.$.app) {
        const app = (0, vue_1.createApp)({
            setup() {
                const state = (0, vue_1.ref)(0);
                const curPath = (0, vue_1.ref)(null);
                const pathSelected = (0, vue_1.computed)(() => {
                    return curPath && curPath.value;
                });
                const canClose = (0, vue_1.computed)(() => {
                    // @ts-ignore
                    return curPath && curPath.value && curPath.value.segments.length > 2 && curPath.value._type == 0;
                });
                const isClosed = (0, vue_1.computed)(() => {
                    return curPath && curPath.value && curPath.value.closed;
                });
                return {
                    state,
                    pathSelected,
                    canClose,
                    curPath,
                    isClosed,
                };
            },
            methods: {
                drawGrid() {
                    let size = this.$refs.editorCanvas.width;
                    let offset = (size - 0.2) / gridCount;
                    for (let i = 0; i < gridCount; i++) {
                        const path = new myPaper.Path({
                            strokeColor: '#c0c0c0',
                            strokeWidth: 0.1,
                            fullySelected: false,
                            locked: true,
                        });
                        path.add(new myPaper.Point(0, i * offset));
                        path.add(new myPaper.Point(size, i * offset));
                    }
                    for (let i = 0; i < gridCount; i++) {
                        const path = new myPaper.Path({
                            strokeColor: '#c0c0c0',
                            strokeWidth: 0.1,
                            fullySelected: false,
                            locked: true,
                        });
                        path.add(new myPaper.Point(i * offset, 0));
                        path.add(new myPaper.Point(i * offset, size));
                    }
                },
                snapToGrid(pt) {
                    // snapping to grid
                    let size = this.$refs.editorCanvas.width;
                    let offset = (size - 0.2) / gridCount;
                    let x = Math.round(pt.x / offset) * offset;
                    let y = Math.round(pt.y / offset) * offset;
                    return new myPaper.Point(x, y);
                },
                snapToGrid2(pt) {
                    let pt2 = this.snapToGrid(pt);
                    let dx = Math.abs(pt.x - pt2.x);
                    let dy = Math.abs(pt.y - pt2.y);
                    if (dx < 8) {
                        pt.x = pt2.x;
                    }
                    if (dy < 8) {
                        pt.y = pt2.y;
                    }
                    return pt;
                },
                snapNow() {
                    if (selectedSegment != null) {
                        let pt = selectedSegment.point;
                        selectedSegment.point = this.snapToGrid2(pt);
                    }
                    else if (this.curPath) {
                        let type = this.curPath._type;
                        if (type == 0) {
                            let pt = this.curPath.lastSegment.point;
                            this.curPath.lastSegment.point = this.snapToGrid2(pt);
                        }
                        else if (type == 1) {
                            let pt = this.curPath.position;
                            this.curPath.position = this.snapToGrid2(pt);
                        }
                    }
                },
                getPosition(event) {
                    if (!event.modifiers.shift) {
                        return event.point;
                    }
                    return this.snapToGrid(event.point);
                },
                onMouseDown(event) {
                    if (!event.modifiers.control) {
                        // If we produced a path before, deselect it:
                        if (this.curPath) {
                            this.curPath.selected = false;
                        }
                        myPaper.project.activeLayer.selected = false;
                        //@ts-ignore
                        selectedSegment = null;
                    }
                    let pt = this.getPosition(event);
                    var hitResult = myPaper.project.hitTest(pt, hitOptions);
                    if (!hitResult || event.modifiers.control) {
                        this.state = 1;
                        // @ts-ignore
                        if (event.event.button == 2) {
                            this.curPath = null;
                            return;
                        }
                        if (!event.modifiers.control || this.curPath == null) {
                            // Create a new path and set its stroke color to black:
                            this.curPath = new myPaper.Path({
                                segments: [pt],
                                strokeColor: 'green',
                                // Select the path, so we can see its segment points:
                                fullySelected: true
                            });
                            this.curPath._type = 0;
                            drawPaths.push(this.curPath);
                        }
                    }
                    else {
                        this.state = 2;
                        // @ts-ignore
                        if (event.event.button == 2) {
                            // @ts-ignore
                            if (hitResult.type == 'segment' && hitResult.item._type == 0) {
                                hitResult.segment.remove();
                                return;
                            }
                            ;
                        }
                        if (hitResult) {
                            if (this.curPath) {
                                this.curPath.selected = false;
                            }
                            this.curPath = hitResult.item;
                            let type = this.curPath._type;
                            // this.curPath.fullySelected = true;
                            if (type == 0) {
                                if (hitResult.type == 'segment') {
                                    selectedSegment = hitResult.segment;
                                    // @ts-ignore
                                }
                                else if (event.event.button == 2 && hitResult.type == 'stroke') {
                                    var location = hitResult.location;
                                    selectedSegment = this.curPath.insert(location.index + 1, pt);
                                    // @ts-ignore
                                    selectedSegment.handleIn = selectedSegment.handleOut = null;
                                }
                            }
                        }
                        movePath = hitResult.type == 'stroke';
                        if (movePath) {
                            myPaper.project.activeLayer.addChild(hitResult.item);
                        }
                    }
                },
                onMouseMove(event) {
                    if (!event.modifiers.control) {
                        let pt = this.getPosition(event);
                        var hitResult = myPaper.project.hitTest(pt, hitOptions);
                        if (hitResult) {
                            if (hitResult.item) {
                                myPaper.project.activeLayer.selected = false;
                                hitResult.item.selected = true;
                                this.curPath = hitResult.item;
                            }
                        }
                    }
                },
                addPoint(pt) {
                    if (this.curPath == null) {
                        return;
                    }
                    if (this.curPath.segments.length > 0) {
                        let last = this.curPath.segments[this.curPath.segments.length - 1];
                        if (last.point.x == pt.x && last.point.y == pt.y) {
                            return;
                        }
                    }
                    this.curPath.add(pt);
                },
                onMouseDrag(event) {
                    if (this.state == 1) {
                        if (!event.modifiers.control) {
                            let pt = this.getPosition(event);
                            this.addPoint(pt);
                        }
                    }
                    else if (this.state == 2) {
                        if (selectedSegment) {
                            selectedSegment.point = selectedSegment.point.add(event.delta);
                        }
                        else if (this.curPath) {
                            let pt = this.curPath.position.add(event.delta);
                            this.curPath.position = pt;
                        }
                    }
                },
                addCircle(pt) {
                    let circle = new myPaper.Path.Circle({
                        center: pt,
                        radius: 5,
                        fillColor: 'red',
                        fullySelected: true,
                    });
                    circle._type = 1;
                    drawPaths.push(circle);
                },
                onMouseUp(event) {
                    if (this.state == 0 || this.curPath == null) {
                        return;
                    }
                    if (!event.modifiers.control) {
                        if (this.curPath == null) {
                            this.state = 0;
                            return;
                        }
                        else if (this.curPath.segments.length < 2) {
                            this.curPath.remove();
                            // @ts-ignore
                            this.curPath = null;
                            this.state = 0;
                            // add point
                            let pt = this.getPosition(event);
                            this.addCircle(pt);
                            return;
                        }
                    }
                    if (this.state == 1) {
                        if (!event.modifiers.control) {
                            // When the mouse is released, simplify it:
                            this.curPath.simplify(1);
                        }
                        else if (this.curPath._type == 0) {
                            let pt = this.getPosition(event);
                            this.addPoint(pt);
                        }
                    }
                    // Select the path, so we can see its segments:
                    this.curPath.fullySelected = true;
                    for (var i = 0, l = this.curPath.segments.length; i < l; i++) {
                        var segment = this.curPath.segments[i];
                        // @ts-ignore
                        segment.handleIn = segment.handleOut = null;
                    }
                    this.state = 0;
                },
                onDelete() {
                    if (this.curPath != null) {
                        this.curPath.remove();
                        this.curPath = null;
                    }
                },
                onTrim() {
                    if (this.curPath != null) {
                        this.curPath.simplify(1);
                    }
                },
                onClear() {
                    for (let path of drawPaths) {
                        path.remove();
                    }
                    drawPaths.length = 0;
                    // @ts-ignore
                    this.curPath = null;
                    // @ts-ignore
                    selectedSegment = null;
                },
                onCloseChanged(event) {
                    if (this.curPath != null) {
                        this.curPath.closed = event.target.value;
                    }
                },
                onSave() {
                    let pts = [];
                    let pathId = 0;
                    let size = this.$refs.editorCanvas.width;
                    for (let path of drawPaths) {
                        let type = path._type;
                        if (type == 0 && path.segments.length < 2) {
                            continue;
                        }
                        pathId++;
                        if (type == 0) {
                            for (let segment of path.segments) {
                                pts.push({ x: this.round(segment.point.x / size), y: this.round(segment.point.y / size), z: pathId, w: type });
                            }
                            if (path.closed) {
                                let first = pts[0];
                                pts.push(first);
                            }
                        }
                        else if (type == 1) {
                            pts.push({ x: this.round(path.position.x / size), y: this.round(path.position.y / size), z: pathId, w: type });
                        }
                    }
                    innerSave = true;
                    Editor.Message.request(package_json_1.default.name, `save-pattern`, currentData.value.node.value.uuid, pts);
                },
                round(x) {
                    return Math.round(x * 1000) / 1000;
                },
            },
            mounted() {
                snapNow = this.snapNow;
                canvas = this.$refs.editorCanvas;
                this.$refs.editorCanvas.height = this.$refs.editorCanvas.width;
                myPaper = new paper_1.default.PaperScope();
                myPaper.setup(this.$refs.editorCanvas);
                myPaper.view.onMouseDown = this.onMouseDown;
                myPaper.view.onMouseDrag = this.onMouseDrag;
                myPaper.view.onMouseUp = this.onMouseUp;
                myPaper.view.onMouseMove = this.onMouseMove;
                this.drawGrid();
            },
        });
        app.config.compilerOptions.isCustomElement = (tag) => tag.startsWith('ui-');
        app.mount(this.$.app);
        weakMap.set(this, app);
        vuewApp = app;
    }
    document.addEventListener('keydown', onKeyDown);
}
exports.ready = ready;
function onKeyDown(evt) {
    if (evt.shiftKey) {
        snapNow === null || snapNow === void 0 ? void 0 : snapNow.call(vuewApp);
    }
    if (evt.key == 'Delete') {
    }
    else if (evt.key == 'Escape') {
    }
}
function close() {
    document.removeEventListener('keydown', onKeyDown);
}
exports.close = close;
;
