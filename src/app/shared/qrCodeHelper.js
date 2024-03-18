const qrCode = require("qrcode");

async function generateQrCodeImageData(url) {
  return qrCode.toDataURL(url, {type: "image/jpeg", margin: 0, errorCorrectionLevel: "H", version: 10});
}

module.exports = {
  generateQrCodeImageData
};
