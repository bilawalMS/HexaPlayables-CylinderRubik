"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.unload = exports.load = exports.methods = void 0;
// @ts-ignore
const package_json_1 = __importDefault(require("../package.json"));
const fs_extra_1 = require("fs-extra");
const path_1 = __importDefault(require("path"));
async function install(zipName) {
    const projectDir = Editor.Project.path;
    let srcDir = path_1.default.join(__dirname, `../samples/${zipName}.zip`);
    let destDir = path_1.default.join(projectDir, `./assets/${zipName}`);
    let inst = true;
    if ((0, fs_extra_1.existsSync)(destDir)) {
        inst = (await Editor.Dialog.warn(`${destDir} 已经存在，是否继续?`, { default: 0, cancel: 1, buttons: ["Yes", "No"] })).response == 0;
    }
    if (!inst) {
        return;
    }
    await Editor.Utils.File.unzip(srcDir, destDir);
    Editor.Message.request("asset-db", "refresh-asset", "db://assets");
}
/**
 * @en
 * @zh 为扩展的主进程的注册方法
 */
exports.methods = {
    async selected(data, uuid) {
        const options = {
            name: package_json_1.default.name,
            method: 'selected',
            args: [data, uuid],
        };
        const result = await Editor.Message.request('scene', 'execute-scene-script', options);
    },
    openPanel() {
        Editor.Panel.open(package_json_1.default.name);
    },
    async savePattern(uuid, data) {
        const options = {
            name: package_json_1.default.name,
            method: 'savePattern',
            args: [uuid, data],
        };
        const result = await Editor.Message.request('scene', 'execute-scene-script', options);
    },
    async installSample() {
        install("easy-p2d-demo");
    }
};
/**
 * @en Hooks triggered after extension loading is complete
 * @zh 扩展加载完成后触发的钩子
 */
function load() { }
exports.load = load;
/**
 * @en Hooks triggered after extension uninstallation is complete
 * @zh 扩展卸载完成后触发的钩子
 */
function unload() { }
exports.unload = unload;
