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

  constructor(
    private readonly width: number,
    private readonly height: number,
    private readonly renderFunction: (canvas: Canvas) => void,
    private readonly cacheKeyFunction?: () => string,
  ) {}

  /**
   * @returns PIXI Texture
   * @throws Error if surface couldn't be created.
   * @throws Error if canvas couldn't be created.
   */
  public getTexture(options?: {
    backgroundColor?: string, 
    multisample?: number,
    resolution?: number,
  }): Texture {
    const {
      backgroundColor = 'transparent',
      multisample = 1,
      resolution = 1,
    } = options ?? {};
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
    const bgColor = parseColorAsCKColor(backgroundColor);
    if(bgColor) {
      canvas.clear(bgColor);
      canvas.scale(multisample ?? 1, multisample ?? 1);
    }
    this.renderFunction(canvas);
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
    return texture;
  }
}