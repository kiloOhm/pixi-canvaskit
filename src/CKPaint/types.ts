import { 
  BlendModeEnumValues, 
  Shader, 
  StrokeCapEnumValues,
  StrokeJoinEnumValues,
  MaskFilter,
  PathEffect,
  ImageFilter,
  ColorFilter,
  PaintStyleEnumValues,
} from "canvaskit-wasm";

export type PaintOptions = {
  color?: string,
  style?: keyof PaintStyleEnumValues,
  antiAlias?: boolean,
  blendMode: keyof BlendModeEnumValues,
  shader?: Shader,
  strokeCap?: keyof StrokeCapEnumValues,
  strokeJoin?: keyof StrokeJoinEnumValues,
  strokeMiter?: number,
  strokeWidth?: number,
  maskFilter?: MaskFilter,
  pathEffect?: PathEffect,
  imageFilter?: ImageFilter,
  colorFilter?: ColorFilter,
  alpha?: number,
};