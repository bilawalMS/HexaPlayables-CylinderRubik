import { _decorator, Component, Node, screen, log, Vec3, Widget } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('AlignBottomButtons')
export class AlignBottomButtons extends Component {

    @property(Node)
    hexaLogo: Node;

    @property(Node)
    installButton: Node;

    @property(Node)
    msLogo: Node;


    changeHudPosition(node: Node, position: Vec3, scale: Vec3, alignment: string, left: number, right: number, top: number, bottom: number) {
        const widget = node.getComponent(Widget);

        // Set scale
        node.setWorldScale(scale);

        // Set position
        node.setWorldPosition(position);

        // Handle alignment using Widget
        switch (alignment.toLowerCase()) {
            case 'center_top':
                widget.isAlignTop = true;
                widget.isAlignBottom = false;
                widget.isAlignLeft = false;
                widget.isAlignRight = false;
                //widget.top = 10;  // Adjust as needed
                widget.top = top;  // Adjust as needed
                break;

            case 'left_top':
                widget.isAlignTop = true;
                widget.isAlignBottom = false;
                widget.isAlignLeft = true;
                widget.isAlignRight = false;
                //widget.top = 150;  // Adjust as needed
                //widget.left = 120; // Adjust as needed

                widget.top = top;  // Adjust as needed
                widget.left = left; // Adjust as needed
                break;

            case 'right_top':
                widget.isAlignTop = true;
                widget.isAlignBottom = false;
                widget.isAlignLeft = false;
                widget.isAlignRight = true;
                //widget.top = 10;  // Adjust as needed
                widget.top = top;  // Adjust as needed
                widget.right = right; // Adjust as needed
                break;

            case 'center_bottom':
                widget.isAlignTop = false;
                widget.isAlignBottom = true;
                widget.isAlignLeft = false;
                widget.isAlignRight = false;
                //widget.top = 10;  // Adjust as needed
                widget.bottom = bottom;  // Adjust as needed

                break;


            default:
                //console.warn("Invalid alignment.");
                break;
        }

        widget.updateAlignment();  // Apply the widget changes
    }
}