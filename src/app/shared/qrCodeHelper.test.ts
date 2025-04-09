import { expect } from "chai";
import sinon from "sinon";
import qrCode from "qrcode";
import { generateQrCodeImageData } from "./qrCodeHelper";

describe("generateQrCodeImageData", () => {
  afterEach(() => {
    sinon.restore();
  });

  it("should call qrcode.toDataURL with correct parameters", async () => {
    const fakeDataUrl = "data:image/jpeg;base64,FAKEQR";
    const toDataURLStub = sinon.stub(qrCode, "toDataURL").resolves(fakeDataUrl);

    const url = "https://example.com/test";
    const result = await generateQrCodeImageData(url);

    expect(result).to.equal(fakeDataUrl);
    expect(toDataURLStub).to.have.been.calledWith(url, {
      type: "image/jpeg",
      margin: 0,
      errorCorrectionLevel: "H",
      version: 10,
    });
  });
});
