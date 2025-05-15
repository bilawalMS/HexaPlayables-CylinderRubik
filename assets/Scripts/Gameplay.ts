import {
  _decorator,
  Component,
  Prefab,
  Node,
  Vec3,
  instantiate,
  Quat,
  math,
  input,
  Input,
  EventMouse,
  Camera,
} from "cc";
import { Hex } from "./Hex";
import { log, PhysicsSystem, geometry, EventTouch } from "cc";

const { ccclass, property } = _decorator;

@ccclass("Gameplay")
export class Gameplay extends Component {
  @property(Camera)
  mainCamera: Camera | null = null;

  @property(Prefab)
  hexPrefab: Prefab = null;

  @property(Node)
  container: Node = null;

  @property
  columns: number = 6;

  @property
  rows: number = 5;

  @property
  columnSpacing: number = 1.2; // adjustable horizontal space

  @property
  rowSpacing: number = 1.0; // adjustable vertical space

  // Store references if needed later
  cellNodes: Node[][] = [];

  private selectedRowIndex: number | null = null;
  private dragStartX: number | null = null;

  private ray = new geometry.Ray(); // Add this as a class property

  start() {
    this.createGrid();

    input.on(Input.EventType.MOUSE_DOWN, this.onMouseDown, this);
    input.on(Input.EventType.MOUSE_MOVE, this.onMouseMove, this);
    input.on(Input.EventType.MOUSE_UP, this.onMouseUp, this);
  }

  createGrid() {
    if (!this.hexPrefab || !this.container) {
      console.error("Missing hexPrefab or container");
      return;
    }

    this.container.removeAllChildren();
    this.cellNodes = [];

    for (let row = 0; row < this.rows; row++) {
      const rowNode = new Node(`Row_${row}`);
      rowNode.setParent(this.container);
      rowNode.setPosition(new Vec3(0, row * this.rowSpacing, 0));

      this.cellNodes[row] = [];

      for (let col = 0; col < this.columns; col++) {
        const colNode = new Node(`Column_${col}`);
        colNode.setParent(rowNode);
        colNode.setPosition(new Vec3(col * this.columnSpacing, 0, 0)); // fixed position
        
        // Store column nodes
        this.cellNodes[row][col] = colNode;

        const hexNode = instantiate(this.hexPrefab);
        hexNode.setParent(colNode);
        hexNode.setPosition(Vec3.ZERO);
        hexNode.setRotation(Quat.IDENTITY);

        // Assign random color/type for testing
        const hexComp = hexNode.getComponent(Hex);
        const randomType = Math.floor(Math.random() * 5) + 1;
        if (hexComp) {
          hexComp.changeType(randomType);
        }

        this.cellNodes[row][col] = colNode; // store column node, NOT hex node
      }
    }
  }

  private startDrag(event: EventMouse | EventTouch) {
    const touchPos = event.getLocation();
    this.mainCamera?.screenPointToRay(touchPos.x, touchPos.y, this.ray);
    if (PhysicsSystem.instance.raycast(this.ray)) {
      const results = PhysicsSystem.instance.raycastResults;
      if (results.length > 0) {
        let hitNode = results[0].collider.node;

        // Walk up until you find node named Column_x or until root
        while (hitNode && !hitNode.name.startsWith("Column_")) {
          hitNode = hitNode.parent!;
        }

        if (hitNode && hitNode.name.startsWith("Column_")) {
          const columnNode = hitNode;
          const rowNode = columnNode.parent;

          if (rowNode && rowNode.name.startsWith("Row_")) {
            const rowIndex = parseInt(rowNode.name.split("_")[1]);
            const colIndex = parseInt(columnNode.name.split("_")[1]);

            if (!isNaN(rowIndex) && !isNaN(colIndex)) {
              this.selectedRowIndex = rowIndex;
              this.dragStartX = event.getLocationX();

              log(`Drag started on Row: ${rowIndex}, Column: ${colIndex}`);
            }
          }
        }
      }
    }
  }

  onMouseDown(event: EventMouse | EventTouch) {
    this.startDrag(event);
  }

  onMouseMove(event: EventMouse | EventTouch) {
    if (this.selectedRowIndex === null || this.dragStartX === null) return;

    const currentX = event.getLocationX();
    const deltaX = currentX - this.dragStartX;

    // Threshold to detect significant drag
    const threshold = 10;

    if (Math.abs(deltaX) >= threshold) {
      if (deltaX > 0) {
        this.shiftRowRight(this.selectedRowIndex);
        log(`Shift row ${this.selectedRowIndex} right`);
      } else {
        this.shiftRowLeft(this.selectedRowIndex);
        log(`Shift row ${this.selectedRowIndex} left`);
      }

      // Reset drag start to current position to allow continuous drag shifts
      this.dragStartX = currentX;
    }
  }

  onMouseUp(event: EventMouse | EventTouch) {
    this.selectedRowIndex = null;
    this.dragStartX = null;
  }

  shiftRowRight(rowIndex: number) {
    const rowColumns = this.cellNodes[rowIndex];
    if (!rowColumns || rowColumns.length === 0) return;

    // Extract hex nodes currently inside each column (preserving column order)
    const hexNodes = rowColumns.map((colNode) => colNode.children[0]);

    // Reparent hexes shifted one column to the right (last hex moves to first column)
    for (let i = 0; i < rowColumns.length; i++) {
      const colNode = rowColumns[i];
      const hexNodeToMove =
        hexNodes[(i - 1 + rowColumns.length) % rowColumns.length];
      if (hexNodeToMove) {
        hexNodeToMove.setParent(colNode);
        hexNodeToMove.setPosition(Vec3.ZERO);
      }
    }

    this.updateRowPositions(rowIndex);
    this.deleteColumnsWithAllSameHexType();
  }

  shiftRowLeft(rowIndex: number) {
    const rowColumns = this.cellNodes[rowIndex];
    if (!rowColumns || rowColumns.length === 0) return;

    const hexNodes = rowColumns.map((colNode) => colNode.children[0]);

    // Reparent hexes shifted one column to the left (first hex moves to last column)
    for (let i = 0; i < rowColumns.length; i++) {
      const colNode = rowColumns[i];
      const hexNodeToMove = hexNodes[(i + 1) % rowColumns.length];
      if (hexNodeToMove) {
        hexNodeToMove.setParent(colNode);
        hexNodeToMove.setPosition(Vec3.ZERO);
      }
    }

    this.updateRowPositions(rowIndex);
    this.deleteColumnsWithAllSameHexType();
  }

  updateRowPositions(rowIndex: number) {
    const rowArray = this.cellNodes[rowIndex];

    // Build a 2D grid string of hex types
    let gridStr = "\nHex Types Grid:\n";

    for (let r = 0; r < this.rows; r++) {
      let rowTypes: string[] = [];
      for (let c = 0; c < this.columns; c++) {
        const colNode = this.cellNodes[r][c];
        if (!colNode || colNode.children.length === 0) {
          rowTypes.push("-"); // Use '-' for empty slot
          continue;
        }
        const hexNode = colNode.children[0];
        const hexComp = hexNode.getComponent(Hex);
        if (hexComp) {
          rowTypes.push(hexComp.type.toString());
        } else {
          rowTypes.push("?");
        }
      }
      gridStr += rowTypes.join(" ") + "\n";

      console.log(gridStr);
    }
  }

  private deleteColumnsWithAllSameHexType() {
    for (let col = 0; col < this.columns; col++) {
      let firstType: number | null = null;
      let allMatch = true;

      for (let row = 0; row < this.rows; row++) {
        const colNode = this.cellNodes[row][col];
        if (!colNode || colNode.children.length === 0) {
          allMatch = false; // Empty slot breaks the match
          break;
        }

        const hexNode = colNode.children[0];
        const hexComp = hexNode.getComponent(Hex);
        if (!hexComp) {
          allMatch = false;
          break;
        }

        if (firstType === null) {
          firstType = hexComp.type;
        } else if (hexComp.type !== firstType) {
          allMatch = false;
          break;
        }
      }

      if (allMatch && firstType !== null) {
        console.log(
          `Deleting column ${col} because all hexes are type ${firstType}`
        );

        for (let row = 0; row < this.rows; row++) {
          const colNode = this.cellNodes[row][col];
          if (!colNode) continue;

          const hexNode = colNode.children[0];
          if (hexNode) {
            hexNode.destroy();
          }

          colNode.removeAllChildren();

          this.cellNodes[row][col] = null;
        }
      }
    }
  }
}
