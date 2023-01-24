import { Texture } from "@pixi/core";
import { Canvas, MallocObj } from "canvaskit-wasm";
import { PixiCanvasKit } from ".";
import { 
  ImageInfo as CKImageInfo,
  Surface as CKSurface,
} from "canvaskit-wasm";

export abstract class CKTexture {
  protected static textureCache = new Map<string, Texture>();
  public static clearCache() {
    CKTexture.textureCache.clear();
  }
  width?: number;
  height?: number;
  constructor(private readonly options: {
    renderFunction: (canvas: Canvas) => void,
    cacheKeyFunction?: () => string | undefined,
    beforeRender?: () => void,
  }) {}

  /**
   * @returns PIXI Texture
   * @throws Error if surface couldn't be created.
   * @throws Error if canvas couldn't be created.
   */
  public getTexture(options?: {
    /**
     * type of texture to create.
     * @default 'bitmap'
     * @see https://pixijs.download/dev/docs/PIXI.Texture.html
     */
    type?: 'bitmap' | 'webgl' | 'canvas',
    /**
     * canvas to render the texture to. Used if type is 'webgl' or 'canvas'.
     */
    canvas?: HTMLCanvasElement,
    /**
     * scale to render the texture at.
     * @default 1
     */
    scale?: number,
    /**
     * resolution to be passed to the PIXI Texture.
     * @default 1
     */
    resolution?: number,
  }): Texture {
    this.options.beforeRender?.();
    if(!this.width || !this.height) {
      throw new Error('Width and height must be set before calling getTexture');
    }
    const {
      type = 'bitmap',
      canvas: _canvas,
      scale: multisample = 1,
      resolution = 1,
    } = options ?? {};
    // console.time('createSurface')
    let cacheKey: string | undefined;
    if(PixiCanvasKit.cache && this.options.cacheKeyFunction) {
      cacheKey = this.options.cacheKeyFunction();
      if(cacheKey && CKTexture.textureCache.has(cacheKey)) {
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
    let surface!: CKSurface;
    let imageData: MallocObj;
    switch(type) {
      case 'bitmap':
        imageData = PixiCanvasKit.canvasKit.Malloc(Uint8Array, imageInfo.width * imageInfo.height * 4);
        try {
          const _surface = PixiCanvasKit.canvasKit.MakeRasterDirectSurface(imageInfo, imageData, imageInfo.width * 4)
          if(!_surface) throw new Error('Failed to create surface');
          surface = _surface;
        }
        catch(e) {
          console.error(e);
          throw e;
        }
        break;
      case 'webgl':
        try {
          if(!_canvas) throw new Error('Canvas must be provided if type is "webgl"');
          _canvas.width = imageInfo.width;
          _canvas.height = imageInfo.height;
          const _surface = PixiCanvasKit.canvasKit.MakeWebGLCanvasSurface(_canvas, imageInfo.colorSpace)
          if(!_surface) throw new Error('Failed to create surface');
          surface = _surface;
        }
        catch(e) {
          console.error(e);
          throw e;
        }
        break;
      case 'canvas':
        try {
          if(!_canvas) throw new Error('Canvas must be provided if type is "canvas"');
          _canvas.width = imageInfo.width;
          _canvas.height = imageInfo.height;
          const _surface = PixiCanvasKit.canvasKit.MakeSWCanvasSurface(_canvas)
          if(!_surface) throw new Error('Failed to create surface');
          surface = _surface;
        }
        catch(e) {
          console.error(e);
          throw e;
        }
        break;
      default:
        throw new Error('Unsupported type');
    }
    const canvas = surface.getCanvas();
    if(!canvas) throw new Error('Failed to create canvas');
    canvas.scale(multisample ?? 1, multisample ?? 1);
    // console.timeEnd('createSurface')
    // console.time('renderFunction')
    this.options.renderFunction(canvas);
    // console.timeEnd('renderFunction')
    // console.time('flush')
    surface.flush();
    let texture: Texture;
    switch(type) {
      case 'bitmap':
        texture = Texture.fromBuffer(
          new Uint8Array(imageData!.toTypedArray()), 
          imageInfo.width, 
          imageInfo.height,
          {
            resolution: resolution ?? 1,
          }
        );
        PixiCanvasKit.canvasKit.Free(imageData!);
        break;
      case 'webgl':
      case 'canvas':
        texture = Texture.from(_canvas!, {
          resolution: resolution ?? 1,
        });
        break;
      default:
        throw new Error('Unsupported type');
    }
    surface.delete();
    if(PixiCanvasKit.cache && cacheKey) {
      CKTexture.textureCache.set(cacheKey, texture);
    }
    // console.timeEnd('flush')
    return texture;
  }
}