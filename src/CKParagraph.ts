import { Canvas, Paragraph } from "canvaskit-wasm";
import { simpleHash } from "../util/hash";
import { CKTexture } from "./CKTexture";

export class CKParagraph extends CKTexture {
  constructor(private readonly paragraph: Paragraph) {
    const width = paragraph.getMaxWidth();
    const height = paragraph.getHeight();
    super(
      width,
      height,
      (canvas: Canvas) => {
        canvas.drawParagraph(this.paragraph, 0, 0);
      },
      () => simpleHash(JSON.stringify(paragraph)),
    );
  }
}