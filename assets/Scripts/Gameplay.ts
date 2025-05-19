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
  tween,easing
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
  private rowRotationAngle = 0; // in degrees
  private dragRowNode: Node | null = null;

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
    for (let row = 0; row < this.rows; row++) {
      this.arrangeRowAsCylinder(row, 3); // radius = 5, adjust as needed
    }
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
      const rotationY = (-angle * 180) / Math.PI + 90;
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

    const anglePerPixel = 0.3; // adjust sensitivity
    const angleDelta = deltaX * anglePerPixel;

    this.rowRotationAngle += angleDelta;

    this.dragRowNode = this.container.children[this.selectedRowIndex];
    if (this.dragRowNode) {
      const rotation = new Quat();
      Quat.fromEuler(rotation, 0, this.rowRotationAngle, 0);
      this.dragRowNode.setRotation(rotation);
    }

    this.dragStartX = currentX;
  }

  onMouseUp(event: EventMouse | EventTouch) {
    if (this.selectedRowIndex === null || this.dragRowNode === null) return;

    const columns = this.columns;
    const anglePerColumn = 360 / columns;

    const snappedSteps = Math.round(this.rowRotationAngle / anglePerColumn);
    this.rowRotationAngle = 0;

    if (this.dragRowNode) {
      const rotation = new Quat();
      Quat.fromEuler(rotation, 0, 0, 0); // Reset to 0 Y-rotation
      this.dragRowNode.setRotation(rotation);
    }

    // Reset rotation visually
    this.rowRotationAngle = 0;
    this.dragRowNode.angle = 0;

    tween(this.dragRowNode)
      .to(0.2, { angle: 0 }, { easing: "cubicOut" })
      .start();

    // Apply actual logic shift
    for (let i = 0; i < Math.abs(snappedSteps); i++) {
      if (snappedSteps > 0) {
        this.shiftRowRight(this.selectedRowIndex);
      } else {
        this.shiftRowLeft(this.selectedRowIndex);
      }
    }

    this.selectedRowIndex = null;
    this.dragStartX = null;
    this.dragRowNode = null;
  }

  shiftRowLeft(rowIndex: number) {
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
    this.applyGravityWithAnimation()
  }

  shiftRowRight(rowIndex: number) {
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
    this.applyGravityWithAnimation()
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
  let globalDelay = 0; // for staggering across columns

  for (let col = 0; col < this.columns; col++) {
    let firstType: number | null = null;
    let matchingRows: number[] = [];
    let differentTypeFound = false;

    for (let row = 0; row < this.rows; row++) {
      const colNode = this.cellNodes[row][col];
      if (!colNode || colNode.children.length === 0) continue;

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
        differentTypeFound = true;
        break;
      }
    }

    if (!differentTypeFound && matchingRows.length >= 2) {
      console.log(`Deleting column ${col} with type ${firstType}, rows: [${matchingRows.join(', ')}]`);

      let delayTime = globalDelay; // start of this column’s stagger

      for (let i = 0; i < matchingRows.length; i++) {
        const row = matchingRows[i];
        const colNode = this.cellNodes[row][col];
        if (!colNode || colNode.children.length === 0) continue;

        const hexNode = colNode.children[0];

        tween(hexNode)
          .delay(delayTime)
          .call(() => {
          })
          .to(0.2, { scale: new Vec3(1.1, 1.1, 1.1) }, { easing: 'quadOut' }) // Expand
          .to(0.3, { eulerAngles: new Vec3(0, 180, 0) }, { easing: 'quadIn' }) // Rotate
          .to(0.3, { scale: new Vec3(0, 0, 0) }, { easing: 'quadIn' }) // Shrink
          .call(() => {
            hexNode.destroy();
            colNode.removeAllChildren();
          })
          .start();

        delayTime += 0.08; // stagger next tile
      }

      globalDelay += matchingRows.length * 0.05 + 0.2; // buffer before next column
    }
  }
}

applyGravityWithAnimation() {
  for (let col = 0; col < this.columns; col++) {
    for (let row = this.rows - 2; row >= 0; row--) {
      const currentNode = this.cellNodes[row][col];
      if (!currentNode || currentNode.children.length === 0) continue;

      const hexNode = currentNode.children[0];
      if (!hexNode) continue;

      // Find the lowest empty row below
      let targetRow = row;
      for (let r = row + 1; r < this.rows; r++) {
        const belowNode = this.cellNodes[r][col];
        if (belowNode && belowNode.children.length === 0) {
          targetRow = r;
        } else {
          break;
        }
      }

      if (targetRow !== row) {
        const targetNode = this.cellNodes[targetRow][col];

        // Remove from old parent
        currentNode.removeChild(hexNode);

        // Reparent to new node (logical)
        hexNode.setParent(this.container); // temporarily reparent for global animation

        // Get world position of source and destination
        const fromWorldPos = currentNode.getWorldPosition();
        const toWorldPos = targetNode.getWorldPosition();

        // Place hex at world position of old cell
        hexNode.setWorldPosition(fromWorldPos);

        // Animate falling to new position
        tween(hexNode)
          .to(0.3 + (targetRow - row) * 0.05, { worldPosition: toWorldPos }, { easing: "quadIn" })
          .call(() => {
            // Final reparent to proper target node
            hexNode.setParent(targetNode);
            hexNode.setPosition(Vec3.ZERO);
            
          })
          .start();
      }
    }
  }
}



}
