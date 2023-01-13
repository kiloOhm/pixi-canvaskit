import { Paint } from "canvaskit-wasm";
import { parseColorAsCKColor } from "../../util/color";
import { indexIfDefined } from "../../util/general";
import { PaintOptions } from "./types";
import { simpleHash } from "../../util/hash";
import { PixiCanvasKit } from "..";

export class CKPaint {
  protected static paintCache = new Map<string, Paint>();
  public paint: Paint; 
  constructor(options: PaintOptions) {
    let cacheKey: string | undefined;
    if(PixiCanvasKit.cache) {
      cacheKey = simpleHash(JSON.stringify(options));
      if(CKPaint.paintCache.has(cacheKey)) {
        this.paint = CKPaint.paintCache.get(cacheKey)!;
        return;
      }
    }
    const paint = new PixiCanvasKit.canvasKit.Paint()
    if(options.color) {
      paint.setColor(parseColorAsCKColor(options.color)!);
    }
    if(options.style) {
      paint.setStyle(indexIfDefined(PixiCanvasKit.canvasKit.PaintStyle, options.style)!);
    }
    if(options.antiAlias) {
      paint.setAntiAlias(true);
    }
    if(options.blendMode) {
      paint.setBlendMode(indexIfDefined(PixiCanvasKit.canvasKit.BlendMode, options.blendMode)!);
    }
    if(options.shader) {
      paint.setShader(options.shader);
    }
    if(options.strokeCap) {
      paint.setStrokeCap(indexIfDefined(PixiCanvasKit.canvasKit.StrokeCap, options.strokeCap)!);
    }
    if(options.strokeJoin) {
      paint.setStrokeJoin(indexIfDefined(PixiCanvasKit.canvasKit.StrokeJoin, options.strokeJoin)!);
    }
    if(options.strokeMiter) {
      paint.setStrokeMiter(options.strokeMiter);
    }
    if(options.strokeWidth) {
      paint.setStrokeWidth(options.strokeWidth);
    }
    if(options.maskFilter) {
      paint.setMaskFilter(options.maskFilter);
    }
    if(options.pathEffect) {
      paint.setPathEffect(options.pathEffect);
    }
    if(options.imageFilter) {
      paint.setImageFilter(options.imageFilter);
    }
    if(options.colorFilter) {
      paint.setColorFilter(options.colorFilter);
    }
    if(options.alpha) {
      paint.setAlphaf(options.alpha);
    }
    if(PixiCanvasKit.cache && cacheKey) {
      CKPaint.paintCache.set(cacheKey, paint);
    }
    this.paint = paint; 
  }

  public static clearCache() {
    CKPaint.paintCache.clear();
  }
}