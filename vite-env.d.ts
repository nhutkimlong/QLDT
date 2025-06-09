/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string
  readonly VITE_GEMINI_API_KEY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare module 'pdf-parse' {
  const pdfParse: any;
  export default pdfParse;
}

declare module 'mammoth' {
  const mammoth: any;
  export default mammoth;
}

declare module 'tesseract.js' {
  export function createWorker(options: any): Promise<any>;
}

declare module 'sharp' {
  const sharp: any;
  export default sharp;
} 