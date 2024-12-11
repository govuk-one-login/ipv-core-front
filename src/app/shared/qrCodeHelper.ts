import qrCode from "qrcode";

export const generateQrCodeImageData = async (url: string): Promise<string> => {
  return qrCode.toDataURL(url, {
    type: "image/jpeg",
    margin: 0,
    errorCorrectionLevel: "H",
    version: 10,
  });
};
