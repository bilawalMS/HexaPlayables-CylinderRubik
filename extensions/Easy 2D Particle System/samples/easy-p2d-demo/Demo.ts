import { _decorator, Component, Node, profiler } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('Demo')
export class Demo extends Component {
    start() {
      profiler.showStats();
    }

    update(deltaTime: number) {
        
    }
}

