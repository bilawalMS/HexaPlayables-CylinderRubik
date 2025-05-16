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
import { resources, JsonAsset } from "cc";


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
    this.loadLevel();

    input.on(Input.EventType.MOUSE_DOWN, this.onMouseDown, this);
    input.on(Input.EventType.MOUSE_MOVE, this.onMouseMove, this);
    input.on(Input.EventType.MOUSE_UP, this.onMouseUp, this);
  }

  loadLevel() {
    resources.load("level6", JsonAsset, (err, jsonAsset) => {
      if (err) {
        console.error("Failed to load JSON:", err);
        return;
      }

      const data = jsonAsset.json as {
        rows: number;
        columns: number;
        grid: number[][];
      };
      this.createGridFromJson(data);
    });
  }

  createGridFromJson(data: {
    rows: number;
    columns: number;
    grid: number[][];
  }) {
    if (!this.hexPrefab || !this.container) {
      console.error("Missing hexPrefab or container");
      return;
    }

    this.container.removeAllChildren();

    this.rows = data.rows;
    this.columns = data.columns;
    this.cellNodes = [];

    for (let row = 0; row < this.rows; row++) {
      const rowNode = new Node(`Row_${row}`);
      rowNode.setParent(this.container);
      rowNode.setPosition(new Vec3(0, row * this.rowSpacing * -1, 0));

      this.cellNodes[row] = [];

      for (let col = 0; col < this.columns; col++) {
        const colNode = new Node(`Column_${col}`);
        colNode.setParent(rowNode);
        colNode.setPosition(new Vec3(col * this.columnSpacing, 0, 0));

        this.cellNodes[row][col] = colNode;

        const hexType = data.grid?.[row]?.[col] ?? 1; // safely handle missing values

        const hexNode = instantiate(this.hexPrefab);
        hexNode.setParent(colNode);
        hexNode.setPosition(Vec3.ZERO);
        hexNode.setRotation(Quat.IDENTITY);

        const hexComp = hexNode.getComponent(Hex);
        if (hexComp) {
          hexComp.changeType(hexType);
        } else {
          console.warn(
            `Hex component missing on prefab instance at row ${row}, col ${col}`
          );
        }
      }
    }
  //   for (let row = 0; row < this.rows; row++) {
  //   this.arrangeRowAsCylinder(row, 3);  // radius = 5, adjust as needed
  // }
  }

  arrangeRowAsCylinder(rowIndex: number, radius: number) {
  const rowArray = this.cellNodes[rowIndex];
  if (!rowArray || rowArray.length === 0) return;

  const columns = rowArray.length;
  const angleStep = (2 * Math.PI) / columns;

  for (let col = 0; col < columns; col++) {
    const angle = col * angleStep;

    // Position on circle (XZ plane)
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;

    const colNode = rowArray[col];
    colNode.setPosition(new Vec3(x, 0, z));

    // Rotate column to face outward (assuming hexes face forward +Z)
    // Adjust +90 deg if needed depending on your hex orientation
    const rotationY = -angle * 180 / Math.PI + 90;
    colNode.setRotation(Quat.fromEuler(new Quat(), 0, rotationY, 0));
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
    this.applyGravityAfterShift(rowIndex);
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
    this.applyGravityAfterShift(rowIndex);
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
    let matchingRows: number[] = [];
    let differentTypeFound = false;

    // Scan top to bottom
    for (let row = 0; row < this.rows; row++) {
      const colNode = this.cellNodes[row][col];
      if (!colNode || colNode.children.length === 0) {
        // Empty top row - allowed, just continue checking below rows
        continue;
      }

      const hexNode = colNode.children[0];
      const hexComp = hexNode.getComponent(Hex);
      if (!hexComp) {
        differentTypeFound = true;
        break;
      }

      if (firstType === null) {
        firstType = hexComp.type;
        matchingRows.push(row);
      } else if (hexComp.type === firstType) {
        matchingRows.push(row);
      } else {
        // Different type found in top rows → don't delete anything
        differentTypeFound = true;
        break;
      }
    }

    // Only delete if no different type found, and minimum 2 matching rows present
    if (!differentTypeFound && matchingRows.length >= 2) {
      console.log(`Deleting column ${col} with type ${firstType}, rows: [${matchingRows.join(', ')}]`);

      for (const row of matchingRows) {
        const colNode = this.cellNodes[row][col];
        if (!colNode) continue;

        const hexNode = colNode.children[0];
        if (hexNode) {
          hexNode.destroy();
        }
        colNode.removeAllChildren();
      }
    }
  }
}


  applyGravityAfterShift(rowIndex: number) {
    for (let col = 0; col < this.columns; col++) {
    // Start from second-to-last row and go upward
    for (let row = this.rows - 2; row >= 0; row--) {
      const currentColNode = this.cellNodes[row][col];
      if (!currentColNode || currentColNode.children.length === 0) continue;

      const hexNode = currentColNode.children[0];
      let targetRow = row;

      // Find the lowest empty spot below
      for (let r = row + 1; r < this.rows; r++) {
        const belowNode = this.cellNodes[r][col];
        if (belowNode && belowNode.children.length === 0) {
          targetRow = r;
        } else {
          break; // blocked
        }
      }

      if (targetRow !== row) {
        // Move hexNode to new column
        const targetColNode = this.cellNodes[targetRow][col];
        currentColNode.removeChild(hexNode);
        hexNode.setParent(targetColNode);
        hexNode.setPosition(Vec3.ZERO);
        console.log(`Hex fell from row ${row} to ${targetRow} in column ${col}`);
      }
    }
  }
}
}
