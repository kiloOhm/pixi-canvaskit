import { Canvas, FillTypeEnumValues, Path } from "canvaskit-wasm";
import { PixiCanvasKit } from "..";
import { CKPaint } from "../CKPaint";
import { PaintOptions } from "../CKPaint/types";
import { CKTexture } from "../CKTexture";
import { indexIfDefined } from "../../util/general";
import { simpleHash } from "../../util/hash";

type Point = {
  x: number;
  y: number;
};

/**
 * This is a wrapper around the CanvasKit Path class
 * @deprecated very slow, use PIXI.Graphics instead
 */
export class CKPath extends CKTexture{
  public path: Path; 
  public fillPaint?: CKPaint;
  public strokePaint?: CKPaint;
  public offset?: {
    left: number,
    top: number,
  };
  private currentPoint: Point = {
    x: 0,
    y: 0,
  };
  private edgePoints: Point[] = [];
  private bezierControlPoints: Point[] = [];
  constructor(options: {
    stroke?: Omit<PaintOptions, 'style'>,
    fill?: Omit<PaintOptions, 
      'style' | 
      'strokeCap' |
      'strokeJoin' |
      'strokeMiter' |
      'strokeWidth'
    > & {
      algorithm?: keyof FillTypeEnumValues
    }
  }) {
    const {
      stroke,
      fill,
    } = options;
    super({
      beforeRender: () => {
        console.time('calculateBounds')
        this.calculateBounds();
        console.timeEnd('calculateBounds')
      },
      renderFunction: (canvas: Canvas) => {
        canvas.translate(this.offset?.left ?? 0, this.offset?.top ?? 0);
        if(this.fillPaint) {
          canvas.drawPath(this.path, this.fillPaint.paint);
        }
        if(this.strokePaint) {
          canvas.drawPath(this.path, this.strokePaint.paint);
        }
      },
      cacheKeyFunction: () => {
        return simpleHash(JSON.stringify([
          this.strokePaint,
          this.fillPaint,
        ]))
      },
    });
    this.strokePaint = new CKPaint({
      ...stroke,
      style: 'Stroke',
    });
    this.fillPaint = new CKPaint({
      ...fill,
      style: 'Fill',
    });
    this.path = new PixiCanvasKit.canvasKit.Path();
    if(fill?.algorithm) {
      this.path.setFillType(indexIfDefined(PixiCanvasKit.canvasKit.FillType, fill?.algorithm ?? 'Winding')!);
    }
  }

  public moveTo(x: number, y: number) {
    this.currentPoint = { x, y };
    this.path.moveTo(x, y);
  }

  public lineTo(x: number, y: number) {
    const lastPoint = this.edgePoints[this.edgePoints.length - 1];
    if(!lastPoint || this.currentPoint.x !== lastPoint.x || this.currentPoint.y !== lastPoint.y) {
      this.edgePoints.push(this.currentPoint);
    }
    this.edgePoints.push({ x, y });
    this.currentPoint = { x, y };
    this.path.lineTo(x, y);
  }

  public bezierCurveTo(
    cp1x: number,
    cp1y: number,
    cp2x: number,
    cp2y: number,
    x: number,
    y: number
  ) {
    const lastPoint = this.edgePoints[this.edgePoints.length - 1];
    if(!lastPoint || this.currentPoint.x !== lastPoint.x || this.currentPoint.y !== lastPoint.y) {
      this.edgePoints.push(this.currentPoint);
    }
    this.edgePoints.push({ x, y });
    this.bezierControlPoints.push({ x: cp1x, y: cp1y });
    this.bezierControlPoints.push({ x: cp2x, y: cp2y });
    this.currentPoint = { x, y };
    this.path.cubicTo(cp1x, cp1y, cp2x, cp2y, x, y);
  }

  public close() {
    this.path.close();
  }

  /**
   * This is horrible, will refactor later
   */
  private calculateBounds() {
    const strokeWidth = this.strokePaint?.paint.getStrokeWidth() 
      ? this.strokePaint?.paint.getStrokeWidth() / 2 
      : 0;
    const boundsWithCurves = this.path.computeTightBounds();
    let furthestLeft = boundsWithCurves[0] - strokeWidth;
    let furthestRight = boundsWithCurves[2] + strokeWidth;
    let furthestTop = boundsWithCurves[1] - strokeWidth;
    let furthestBottom = boundsWithCurves[3] + strokeWidth;
    // console.log(this.edgePoints);
    for(let i = 0; i < this.edgePoints.length; i++) {
      const previous = (i === 0) 
        ? this.edgePoints[this.edgePoints.length - 1]
        : this.edgePoints[i - 1];
      const current = this.edgePoints[i];
      const next = (i === this.edgePoints.length - 1)
        ? this.edgePoints[0]
        : this.edgePoints[i + 1];
      const outer = this.calculateOuterMitrePos(
        previous, 
        current, 
        next
      );
      furthestRight = Math.max(furthestRight, outer[0]);
      furthestBottom = Math.max(furthestBottom, outer[1]);
      furthestLeft = Math.min(furthestLeft, outer[0]);
      furthestTop = Math.min(furthestTop, outer[1]);
    }
    this.width = Math.ceil(furthestRight - furthestLeft);
    this.height = Math.ceil(furthestBottom - furthestTop);
    this.offset = {
      left: Math.abs(furthestLeft),
      top: Math.abs(furthestTop),
    }
  }

  private calculateOuterMitrePos(
    p1: {x: number, y: number}, 
    p2: {x: number, y: number}, 
    p3: {x: number, y: number}
  ) {
    let angleBetween = this.calculateAngle(p1, p2, p3);
    if(angleBetween === Math.PI || angleBetween === 0) {
      // console.warn('Parallel lines, no mitre');
      return [p2.x, p2.y];
    }
    const correctedP1 = {
      x: p1.x - p2.x,
      y: p1.y - p2.y,
    };
    const correctedP2 = {
      x: 0,
      y: 0,
    };
    const correctedP3 = {
      x: p3.x - p2.x,
      y: p3.y - p2.y,
    };
    let angleP1P2toXAxis = Math.acos(correctedP1.x / ((this.calculateDistance(correctedP1, correctedP2)) || 1));
    if(correctedP1.y < 0) {
      angleP1P2toXAxis = (2 * Math.PI) - angleP1P2toXAxis;
    }
    let angleP2P3toXAxis = Math.acos(correctedP3.x / ((this.calculateDistance(correctedP3, correctedP2)) || 1));
    if(correctedP3.y < 0) {
      angleP2P3toXAxis = (2 * Math.PI) - angleP2P3toXAxis;;
    }
    const angleMiterToXAxis = ((Math.min(angleP1P2toXAxis, angleP2P3toXAxis) + Math.abs(angleP1P2toXAxis - angleP2P3toXAxis) / 2) + Math.PI) % (2 * Math.PI);
    const strokeWidth = this.strokePaint?.paint.getStrokeWidth() ?? 0;
    let miterLength = this.calculateMiterLength(
      angleBetween,
      strokeWidth,
    );
    const strokeLength = strokeWidth ? strokeWidth / 2 : 1;
    const miterLimit = strokeLength * (this.strokePaint?.paint.getStrokeMiter() ?? 1);
    miterLength = Math.min(miterLength, miterLimit);
    const outerPoint = {
      x: p2.x + miterLength * Math.cos((Math.PI * 2) - angleMiterToXAxis),
      y: p2.y - miterLength * Math.sin((Math.PI * 2) - angleMiterToXAxis),
    }
    return [outerPoint.x, outerPoint.y];
  }

  private calculateAngle(
    p1: {x: number, y: number}, 
    p2: {x: number, y: number}, 
    p3: {x: number, y: number}
  ) {
    const a = this.calculateDistance(p1, p2);
    const b = this.calculateDistance(p2, p3);
    const c = this.calculateDistance(p1, p3);
    return Math.acos((Math.pow(a, 2) + Math.pow(b, 2) - Math.pow(c, 2)) / ((2 * a * b) || 1));
  }

  private calculateDistance(p1: {x: number, y: number}, p2: {x: number, y: number}) {
    return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
  }

  private calculateMiterLength(angle: number, strokeWidth: number) {
    return strokeWidth / (2 * Math.sin(angle / 2));
  }
}