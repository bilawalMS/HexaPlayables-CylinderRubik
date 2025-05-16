"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.methods = exports.unload = exports.load = void 0;
const path_1 = require("path");
module.paths.push((0, path_1.join)(Editor.App.path, 'node_modules'));
const cc_1 = require("cc");
let components = [];
function load() {
    Editor.Message.addBroadcastListener("easy-p2d:particle-pause", onParticlePause);
    Editor.Message.addBroadcastListener("easy-p2d:particle-reset", onParticleReset);
}
exports.load = load;
;
function onParticlePause() {
    console.log("onParticlePause");
}
function onParticleReset() {
    console.log("onParticleReset");
}
function unload() {
    Editor.Message.removeBroadcastListener("easy-p2d:particle-pause", onParticlePause);
}
exports.unload = unload;
;
function traverse(node, callback) {
    callback(node);
    node.children.forEach(child => {
        callback(child);
        traverse(child, callback);
    });
}
exports.methods = {
    selected(data, uuid) {
        let scene = cc_1.director.getScene();
        components.forEach((component) => {
            if (component["onParentLostFocusInEditor"]) {
                component["onParentLostFocusInEditor"]();
            }
        });
        components.length = 0;
        let root = cce.Node.query(uuid);
        if (root) {
            traverse(root, (node) => {
                if (root == node) {
                    return;
                }
                node.components.forEach((component) => {
                    if (component.enabled && component["onParentFocusInEditor"]) {
                        component["onParentFocusInEditor"]();
                    }
                    components.push(component);
                });
            });
        }
    },
    async savePattern(uuid, data) {
        let node = cce.Node.query(uuid);
        if (node) {
            let pattern = node.getComponent('GesturePattern');
            if (pattern) {
                pattern.points.length = 0;
                for (let point of data) {
                    pattern.points.push(new cc_1.Vec4(point.x, point.y, point.z, point.w));
                }
                cce.Node.setProperty(uuid, "points", pattern.points);
                // let nodeData = await Editor.Message.request('scene', 'query-node', uuid);
                // if(nodeData.__prefab__) {
                //     console.log(nodeData.__prefab__.uuid);
                //     Editor.Message.send('asset-db', 'save-asset', nodeData.__prefab__.uuid, JSON.stringify(node));
                // }
            }
        }
    }
};
