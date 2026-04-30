declare module "qrcode" {
  interface QRCodeToStringOptions {
    type?: "svg" | "terminal" | "utf8";
    width?: number;
    margin?: number;
  }

  const QRCode: {
    toString(text: string, options?: QRCodeToStringOptions): Promise<string>;
  };

  export default QRCode;
}
