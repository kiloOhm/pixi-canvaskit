import { TileModeEnumValues } from "canvaskit-wasm";

export type GradientOptions = 
  LinearGradientOptions
  | RadialGradientOptions;

export type LinearGradientOptions = {
  type: 'linear';
  width: number;
  height: number;
  rotationDegrees: number;
  colors: Array<{
    color: string;
    stop: number;
  }>;
  mode?: keyof TileModeEnumValues;
};

export type RadialGradientOptions = {
  type: 'radial';
  width: number;
  height: number;
  rotationDegrees: number;
};