'use strict';
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.close = exports.ready = exports.update = exports.methods = exports.$ = exports.style = exports.template = void 0;
const fs_extra_1 = require("fs-extra");
const path_1 = __importStar(require("path"));
const vue_1 = require("vue");
const draw_canvas_1 = require("./draw-canvas");
const base_tool_1 = require("./base-tool");
const path_tool_1 = require("./path-tool");
const path_emitter_tool_1 = require("./path-emitter-tool");
const weakMap = new WeakMap();
var currentData;
var drawCanvas = null;
exports.template = (0, fs_extra_1.readFileSync)((0, path_1.join)(__dirname, '../../static/template/editor.html'), 'utf-8');
exports.style = (0, fs_extra_1.readFileSync)((0, path_1.join)(__dirname, '../../static/style/default/index.css'), 'utf-8');
exports.$ = {
    system: '#system',
    customMaterial: '#customMaterial',
    timeScale: '#timeScale',
    app: '#app',
};
function setVisible(element, visible) {
    element.style.display = visible ? 'block' : 'none';
}
exports.methods = {};
function getI18nKey(model, key) {
    if (key == "anchor" || key == "spriteFrame") {
        return;
    }
    if (key == "enabled") {
        return `i18n:easy-p2d.${key}`;
    }
    return `i18n:easy-p2d.${model}.${key}`;
}
function setI18n(model, element) {
    for (const key in element) {
        const val = element[key];
        if (!val) {
            continue;
        }
        let rk = key.replace("_", "");
        val.tooltip = getI18nKey(model, rk);
        if (val.extends.indexOf("EasyP2DModuleBase") >= 0) {
            setI18n(rk, val.value);
        }
    }
}
var vuewApp;
var appUpdate;
function update(dump) {
    currentData = dump;
    this.dump = dump;
    let systemVal = dump.value.system.value;
    setI18n("system", systemVal);
    this.$.customMaterial.render(dump.value.customMaterial);
    this.$.timeScale.render(dump.value.timeScale);
    this.$.system.render(dump.value.system);
    if (drawCanvas) {
        drawCanvas.update(dump);
    }
    if (appUpdate) {
        appUpdate(dump);
    }
}
exports.update = update;
var shapeTool;
var pathTool;
function ready() {
    if (this.$.app) {
        const app = (0, vue_1.createApp)({
            setup() {
                const angleImg = (0, vue_1.ref)("");
                const isShapeEnable = (0, vue_1.ref)(false);
                const isPathEnable = (0, vue_1.ref)(false);
                const toolType = (0, vue_1.ref)(Number);
                const velocityImg = (0, vue_1.ref)("");
                const icons = (0, vue_1.ref)({
                    centerImg: path_1.default.join(__dirname, "../../static/images/center-a.png"),
                    defaultToolImg: path_1.default.join(__dirname, "../../static/images/pan-a.png"),
                    pathToolImg: path_1.default.join(__dirname, "../../static/images/path-a.png"),
                    shapeToolImg: path_1.default.join(__dirname, "../../static/images/shape-a.png"),
                    clearImg: path_1.default.join(__dirname, "../../static/images/clear-a.png"),
                });
                return {
                    angleImg,
                    velocityImg,
                    isShapeEnable,
                    isPathEnable,
                    toolType,
                    icons,
                };
            },
            methods: {
                onRefreshClick() {
                    Editor.Message.send("scene", "execute-component-method", {
                        uuid: currentData.uuid,
                        name: "startPreview"
                    });
                },
                setAngleImage(img) {
                    this.angleImg = path_1.default.join(__dirname, "../../static/images", img);
                },
                setVelocityImage(img) {
                    this.velocityImg = path_1.default.join(__dirname, "../../static/images", img);
                },
                updateToolStatus() {
                    if (shapeTool.isCurrent) {
                        this.toolType = 1;
                    }
                    else if (pathTool.isCurrent) {
                        this.toolType = 2;
                    }
                    else {
                        this.toolType = 0;
                    }
                },
                update(data) {
                    var _a, _b, _c, _d;
                    const system = data.value.system.value;
                    this.isShapeEnable = (_b = (_a = system.pathEmitter.value) === null || _a === void 0 ? void 0 : _a.enabled) === null || _b === void 0 ? void 0 : _b.value;
                    this.isPathEnable = (_d = (_c = system.pathOvertime.value) === null || _c === void 0 ? void 0 : _c.enabled) === null || _d === void 0 ? void 0 : _d.value;
                    this.updateToolStatus();
                    this.setAngleImage(`rot-${system.rotationType.value}.png`);
                    this.setVelocityImage(`v-${system.velocityType.value}.png`);
                },
                onShapeEditor() {
                    shapeTool.setActive(true);
                },
                onPathEditor() {
                    pathTool.setActive(true);
                },
                onClearShape() {
                    if (shapeTool.isCurrent) {
                        shapeTool.doCommand("clear");
                    }
                    else if (pathTool.isCurrent) {
                        pathTool.doCommand("clear");
                    }
                },
                onDefaultTool() {
                    base_tool_1.BaseTool.clearTool();
                },
                onToCenter() {
                    drawCanvas.center();
                },
                onResetClick() {
                    Editor.Message.send("easy-p2d", "particle-reset", {
                        uuid: currentData.uuid,
                    });
                },
            },
            mounted() {
                drawCanvas = new draw_canvas_1.DrawCanvas(this.$refs.editorCanvas);
                appUpdate = this.update;
                shapeTool = new path_emitter_tool_1.PathEmitterTool(drawCanvas);
                pathTool = new path_tool_1.PathTool(drawCanvas);
                base_tool_1.BaseTool.onToolChange = () => {
                    this.updateToolStatus();
                };
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
}
function close() {
}
exports.close = close;
;
