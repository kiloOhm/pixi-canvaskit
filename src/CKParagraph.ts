import { Canvas, Paragraph } from "canvaskit-wasm";
import { simpleHash } from "../util/hash";
import { CKTexture } from "./CKTexture";

export class CKParagraph extends CKTexture {
  constructor(private readonly paragraph: Paragraph) {
    super({
      beforeRender: () => simpleHash(JSON.stringify(paragraph)),
      renderFunction: (canvas: Canvas) => {
        canvas.drawParagraph(this.paragraph, 0, 0);
      },
    });
    this.width = paragraph.getMaxWidth();
    this.height = paragraph.getHeight();
  }
}