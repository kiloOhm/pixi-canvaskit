import { Canvas, Shader } from "canvaskit-wasm";
import { CKPaint, CKTexture, PixiCanvasKit } from "../../src";
import { GradientOptions } from "./types";
import { indexIfDefined } from "../../util/general";
import { roundTo } from "../util";
import { parseColorAsCKColor } from "../../util/color";
import { simpleHash } from "../../util/hash";
export * from './types';

export class CKGradient extends CKTexture {
  private static shaderCache = new Map<string, Shader>();
  public static clearCache(): void {
    this.shaderCache.clear();
  }
  private cacheKey?: string;
  private _shader!: Shader;
  /**
   * The shader used to render this gradient.
   * Can be used with CKPaint to render gradients.
   */
  get shader(): Shader {
    return this._shader;
  }
  /**
   * Creates a new gradient Shader. 
   * If used as a texture, try rendering at lower resolutions.
   */
  constructor(options: GradientOptions) {
    super({
      renderFunction: (canvas: Canvas) => {
        const paint = new CKPaint({
          shader: this._shader,
        }).paint;
        canvas.drawRect([
          0,
          0,
          options.width,
          options.height,
        ], paint);
      },
      cacheKeyFunction: () => {
        return this.cacheKey;
      }
    });
    this.cacheKey = simpleHash(JSON.stringify(options));
    switch(options.type) {
      case 'linear':
        this.width = options.width;
        this.height = options.height;
        const positions = this.getLinearGradientPositions(options);
        this._shader = PixiCanvasKit.canvasKit.Shader.MakeLinearGradient(
          positions.start,
          positions.end,
          options.colors.map(color => parseColorAsCKColor(color.color)!),
          options.colors.map(color => color.stop),
          indexIfDefined(PixiCanvasKit.canvasKit.TileMode, options.mode, PixiCanvasKit.canvasKit.TileMode.Clamp),
        );
        break;
      case 'radial':
        throw new Error('Radial gradients are not yet supported');
        break;
      default:
        throw new Error('Invalid gradient type');
    }
  }

  private getLinearGradientPositions(options: {
    width: number;
    height: number;
    rotationDegrees: number;
  }) {
    const rotRad = options.rotationDegrees * Math.PI / 180;
    return {
      start: [
        roundTo(options.width / 2 + options.width / 2 * Math.cos(rotRad), 2),
        roundTo(options.height / 2 + options.height / 2 * Math.sin(rotRad), 2),
      ],
      end: [
        roundTo(options.width / 2 + options.width / 2 * Math.cos(rotRad + Math.PI), 2),
        roundTo(options.height / 2 + options.height / 2 * Math.sin(rotRad + Math.PI), 2),
      ],
    };
  }
}