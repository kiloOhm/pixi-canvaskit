import CanvasKitInit, { CanvasKit } from "canvaskit-wasm";
export * from './CKParagraphBuilder';
export * from './CKParagraph';
export * from './types';

/**
 * Handles initializing CanvasKit WASM and manages its instance.
 */
export class PixiCanvasKit {
  /**
   * CanvasKit WASM instance.
   */
  public static canvasKit: CanvasKit;
  public static cache: boolean;
  /**
   * Initialize CanvasKit WASM. This must be called before using any other CanvasKit functionality.
   * @param canvasKitBaseBath Base path to load CanvasKit from. Defaults to https://unpkg.com/canvaskit-wasm@latest/bin/
   */
  public static async init(options?: {
    canvasKitBaseBath?: string,
    cache?: boolean,
  }) {
    const { 
      canvasKitBaseBath = 'https://unpkg.com/canvaskit-wasm@latest/bin/',
      cache = true,
    } = options ?? {};
    PixiCanvasKit.cache = cache;
    const canvasKit = await CanvasKitInit({
      locateFile: (file: string) => canvasKitBaseBath + file,
    });
    if(!canvasKit) throw new Error('CanvasKit failed to initialize');
    PixiCanvasKit.canvasKit = canvasKit;
  }
}