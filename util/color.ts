import Color from "color";

export function parseColorAsCKColor(colorString?: string) {
  if(!colorString) return undefined;
  const parsed = Color(colorString);
  return new Float32Array([
    parsed.red() / 255, 
    parsed.green() / 255, 
    parsed.blue() / 255, 
    parsed.alpha()
  ]);
}