import { 
  FontMgr, 
  ParagraphBuilder, 
  ParagraphStyle as CKParagraphStyle,
  TextStyle as CKTextStyle,
  Paint,
} from "canvaskit-wasm";
import { PixiCanvasKit } from "..";
import { 
  TextSegment, 
  ParagraphStyle,
  TextStyle, 
  FontStyle
} from "./types";
import { parseColorAsCKColor } from "../../util/color";
import { indexIfDefined } from "../../util/general";
import { CKParagraph } from "../CKParagraph";
import { simpleHash } from "../../util/hash";

export class CKParagraphBuilder {
  private static paragraphCache = new Map<string, CKParagraph>();
  private fontMgr: FontMgr;
  private builder: ParagraphBuilder;
  private defaultTextStyle?: CKTextStyle;
  private fgPaint: Paint;
  private bgPaint: Paint;
  /**
   * @param fontData Array of font data to load into the FontMgr, which is used by Paragraphbuilder.
   * @param paragraphStyle ParagraphStyle to use for the ParagraphBuilder, can include default text style.
   * @throws Error if PixiCanvasKit is not initialized.
   */
  constructor(fontData: ArrayBuffer[], paragraphStyle: ParagraphStyle) {
    if(!PixiCanvasKit.canvasKit) throw new Error('CanvasKit not initialized');
    const fontMgr = PixiCanvasKit.canvasKit.FontMgr.FromData(...fontData);
    if(!fontMgr) throw new Error('Failed to load font');
    this.fontMgr = fontMgr;
    const ckParagraphStyle: CKParagraphStyle = this.parseParagraphStyle(paragraphStyle);
    if(ckParagraphStyle.textStyle) {
      this.defaultTextStyle = ckParagraphStyle.textStyle;
    }
    this.builder = PixiCanvasKit.canvasKit.ParagraphBuilder.Make(
      ckParagraphStyle,
      this.fontMgr
    );
    this.fgPaint = new PixiCanvasKit.canvasKit.Paint();
    this.fgPaint.setAntiAlias(true);
    this.fgPaint.setShader(PixiCanvasKit.canvasKit.Shader.MakeRadialGradient(
      [100, 100],
      200,
      [parseColorAsCKColor('black')!, parseColorAsCKColor('white')!],
      null,
      PixiCanvasKit.canvasKit.TileMode.Clamp
    ))
    this.bgPaint = new PixiCanvasKit.canvasKit.Paint();
    this.bgPaint.setAntiAlias(true);
    this.bgPaint.setAlphaf(0);
  }

  public static clearCache() {
    CKParagraphBuilder.paragraphCache.clear();
  }
  
  /**
   * Builds a Paragraph from an array of TextSegments
   */
  public build(options: {
    /**
     * Array of TextSegments to build into a Paragraph
     */
    segments: TextSegment[],
    /**
     * Optional max width to layout the Paragraph with
     */
    maxWidth?: number,
  }) {
    const { segments, maxWidth } = options;
    let cacheKey: string | undefined;
    if(PixiCanvasKit.cache) {
      cacheKey = simpleHash(JSON.stringify(options));
      if(CKParagraphBuilder.paragraphCache.has(cacheKey)) {
        return CKParagraphBuilder.paragraphCache.get(cacheKey)!;
      }
    }
    this.builder.reset();
    for(const segment of segments) {
      const textStyle = segment.style ? this.parseTextStyle(segment.style) : this.defaultTextStyle;
      if(!textStyle) throw new Error('No text style provided');
      if(textStyle.color) {
        this.fgPaint.setColor(textStyle.color);
      }
      if(textStyle.backgroundColor) {
        this.bgPaint.setColor(textStyle.backgroundColor);
      }
      this.builder.pushPaintStyle(
        textStyle, 
        this.fgPaint,
        this.bgPaint
      );
      this.builder.addText(segment.text);
    }
    const paragraph = this.builder.build();
    if(maxWidth) {
      paragraph.layout(maxWidth);
    } else {
      paragraph.layout(Number.MAX_SAFE_INTEGER);
      paragraph.layout(Math.ceil(paragraph.getMaxIntrinsicWidth()));
    }
    const ckParagraph = new CKParagraph(paragraph);
    if(PixiCanvasKit.cache && cacheKey) { 
      CKParagraphBuilder.paragraphCache.set(cacheKey, ckParagraph);
    }
    return ckParagraph;
  }

  private parseFontStyle(style?: FontStyle) {
    if(!style) return undefined;
    return {
      weight: indexIfDefined(PixiCanvasKit.canvasKit.FontWeight, style.weight),
      width: indexIfDefined(PixiCanvasKit.canvasKit.FontWidth, style.width),
      slant: indexIfDefined(PixiCanvasKit.canvasKit.FontSlant, style.slant)
    };
  }

  private parseParagraphStyle(style: ParagraphStyle) {
    return new PixiCanvasKit.canvasKit.ParagraphStyle({
      disableHinting: style.disableHinting,
      ellipsis: style.ellipsis,
      heightMultiplier: style.heightMultiplier,
      maxLines: style.maxLines,
      replaceTabCharacters: style.replaceTabCharacters,
      strutStyle: {
        strutEnabled: style.strutStyle?.strutEnabled,
        fontFamilies: style.strutStyle?.fontFamilies,
        fontStyle: this.parseFontStyle(style.strutStyle?.fontStyle),
        fontSize: style.strutStyle?.fontSize,
        heightMultiplier: style.strutStyle?.heightMultiplier,
        halfLeading: style.strutStyle?.halfLeading,
        leading: style.strutStyle?.leading,
        forceStrutHeight: style.strutStyle?.forceStrutHeight,
      },
      textAlign: indexIfDefined(PixiCanvasKit.canvasKit.TextAlign, style.textAlign),
      textDirection: indexIfDefined(PixiCanvasKit.canvasKit.TextDirection, style.textDirection),
      textHeightBehavior: indexIfDefined(PixiCanvasKit.canvasKit.TextHeightBehavior, style.textHeightBehavior),
      textStyle: this.parseTextStyle(style.textStyle),
    })
  }

  private parseTextStyle(style?: TextStyle) {
    if(!style) return undefined;
    return new PixiCanvasKit.canvasKit.TextStyle({
      backgroundColor: parseColorAsCKColor(style.backgroundColor),
      color: parseColorAsCKColor(style.color),
      decoration: indexIfDefined(PixiCanvasKit.canvasKit, style.decoration, PixiCanvasKit.canvasKit.NoDecoration),
      decorationColor: parseColorAsCKColor(style.decorationColor),
      decorationThickness: style.decorationThickness,
      decorationStyle: indexIfDefined(PixiCanvasKit.canvasKit.DecorationStyle, style.decorationStyle),
      fontFamilies: style.fontFamilies,
      fontFeatures: style.fontFeatures,
      fontSize: style.fontSize,
      fontStyle: this.parseFontStyle(style.fontStyle),
      fontVariations: style.fontVariations,
      foregroundColor: parseColorAsCKColor(style.foregroundColor),
      heightMultiplier: style.heightMultiplier,
      halfLeading: style.halfLeading,
      letterSpacing: style.letterSpacing, 
      locale: style.locale,
      shadows: style.shadows?.map(shadow => ({
        color: parseColorAsCKColor(shadow.color),
        offset: shadow.offset,
        blurRadius: shadow.blurRadius
      })),
      textBaseline: indexIfDefined(PixiCanvasKit.canvasKit.TextBaseline, style.textBaseline),
      wordSpacing: style.wordSpacing
    });
  }
}