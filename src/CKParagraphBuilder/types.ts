import { 
  FontSlant, 
  FontWeight, 
  FontWidth, 
  TextAlignEnumValues, 
  TextDirectionEnumValues, 
  TextFontFeatures, 
  TextFontVariations, 
  TextHeightBehaviorEnumValues,
  DecorationStyleEnumValues,
  TextBaselineEnumValues
} from "canvaskit-wasm";
export type { TextFontFeatures, TextFontVariations };

export type TextSegment = {
  text: string;
  style?: TextStyle;  
}

export type ParagraphStyle = {
  disableHinting?: boolean;
  ellipsis?: string;
  heightMultiplier?: number;
  maxLines?: number;
  replaceTabCharacters?: boolean;
  strutStyle?: StrutStyle;
  textAlign?: keyof TextAlignEnumValues;
  textDirection?: keyof TextDirectionEnumValues;
  textHeightBehavior?: keyof TextHeightBehaviorEnumValues;
  textStyle?: TextStyle;
}

export type StrutStyle = {
  strutEnabled?: boolean;
  fontFamilies?: string[];
  fontStyle?: FontStyle;
  fontSize?: number;
  heightMultiplier?: number;
  halfLeading?: boolean;
  leading?: number;
  forceStrutHeight?: boolean;
}

export type TextStyle = { 
  fontSize?: number;
  letterSpacing?: number; 
  fontFamilies?: string[]; 
  fontStyle?: FontStyle; 
  backgroundColor?: string;
  color?: string;
  decoration?: Decoration;
  decorationColor?: string;
  decorationThickness?: number;
  decorationStyle?: keyof DecorationStyleEnumValues;
  fontFeatures?: TextFontFeatures[];
  fontVariations?: TextFontVariations[];
  foregroundColor?: string;
  heightMultiplier?: number;
  halfLeading?: boolean;
  locale?: string;
  shadows?: TextShadow[];
  textBaseline?: keyof TextBaselineEnumValues;
  wordSpacing?: number;
};

export type FontStyle = {
  weight?: keyof FontWeight;
  width?: keyof FontWidth;
  slant?: keyof FontSlant;
};

export type Decoration = 'NoDecoration'
  | 'UnderlineDecoration'
  | 'OverlineDecoration'
  | 'LineThroughDecoration';

export type TextShadow = {
  color?: string;
  /**
   * 2d array for x and y offset. Defaults to [0, 0]
   */
  offset?: number[];
  blurRadius?: number;
}