declare module "pdf-parse-fork" {
  function pdf(dataBuffer: any, options?: any): Promise<any>;
  export = pdf;
}
