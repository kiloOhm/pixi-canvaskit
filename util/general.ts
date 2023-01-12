export function indexIfDefined(value: any, index?: number | string, defaultValue?: any) {
  return index !== undefined ? value?.[index] : defaultValue;
}