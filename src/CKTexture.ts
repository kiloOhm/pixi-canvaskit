import { Texture } from "@pixi/core";
import { Canvas } from "canvaskit-wasm";
import { PixiCanvasKit } from ".";
import { 
  ImageInfo as CKImageInfo,
  Surface as CKSurface,
} from "canvaskit-wasm";
import { parseColorAsCKColor } from "../util/color";

export abstract class CKTexture {
  protected static textureCache = new Map<string, Texture>();
  public static clearCache() {
    CKTexture.textureCache.clear();
  }
  width?: number;
  height?: number;
  constructor(
    private readonly renderFunction: (canvas: Canvas) => void,
    private readonly cacheKeyFunction?: () => string,
    private readonly beforeRender?: () => void,
  ) {}

  /**
   * @returns PIXI Texture
   * @throws Error if surface couldn't be created.
   * @throws Error if canvas couldn't be created.
   */
  public getTexture(options?: {
    multisample?: number,
    resolution?: number,
  }): Texture {
    this.beforeRender?.();
    if(!this.width || !this.height) {
      throw new Error('Width and height must be set before calling getTexture');
    }
    const {
      multisample = 1,
      resolution = 1,
    } = options ?? {};
    console.time('createSurface')
    let cacheKey: string | undefined;
    if(PixiCanvasKit.cache && this.cacheKeyFunction) {
      cacheKey = this.cacheKeyFunction();
      if(CKTexture.textureCache.has(cacheKey)) {
        const cached = CKTexture.textureCache.get(cacheKey);
        if(cached) return cached;
      }
    }
    const imageInfo = {
      alphaType: PixiCanvasKit.canvasKit.AlphaType.Premul,
      colorSpace: PixiCanvasKit.canvasKit.ColorSpace.SRGB,
      colorType: PixiCanvasKit.canvasKit.ColorType.RGBA_8888,
      height: multisample ? this.height * multisample : this.height,
      width: multisample ? this.width * multisample : this.width,
    } as CKImageInfo;
    const imageData = PixiCanvasKit.canvasKit.Malloc(Uint8Array, imageInfo.width * imageInfo.height * 4);
    let surface: CKSurface;
    try {
      const _surface = PixiCanvasKit.canvasKit.MakeRasterDirectSurface(imageInfo, imageData, imageInfo.width * 4)
      if(!_surface) throw new Error('Failed to create surface');
      surface = _surface;
    }
    catch(e) {
      console.error(e);
      throw e;
    }
    const canvas = surface.getCanvas();
    if(!canvas) throw new Error('Failed to create canvas');
    canvas.scale(multisample ?? 1, multisample ?? 1);
    console.timeEnd('createSurface')
    console.time('renderFunction')
    this.renderFunction(canvas);
    console.timeEnd('renderFunction')
    console.time('flush')
    const texture = Texture.fromBuffer(
      new Uint8Array(imageData.toTypedArray()), 
      imageInfo.width, 
      imageInfo.height,
      {
        resolution: resolution ?? 1,
      }
    );
    if(PixiCanvasKit.cache && cacheKey) {
      CKTexture.textureCache.set(cacheKey, texture);
    }
    surface.delete();
    console.timeEnd('flush')
    return texture;
  }
}