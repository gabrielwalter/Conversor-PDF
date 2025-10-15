export type CompressionLevel = 'FAST' | 'MEDIUM' | 'SLOW';

export interface ImageFile {
  id: string;
  file: File;
  previewUrl: string;
}

export interface GeneratedImage {
  id: string;
  dataUrl: string;
  filename: string;
}
