export type ImportSourceKind = 'ppt' | 'pdf' | 'image' | 'audio' | 'note' | 'other';

export type ImportTaskStatus = 'queued' | 'parsing' | 'done' | 'failed' | 'cancelled';

export type TranscriptSegment = {
  startMs: number;
  endMs: number;
  text: string;
};

export type OcrBlock = {
  text: string;
  confidence: number; // 0..1
};

export type ParsedResult =
  | {
      kind: 'image_ocr';
      blocks: OcrBlock[];
    }
  | {
      kind: 'audio_transcript';
      segments: TranscriptSegment[];
    }
  | {
      kind: 'slides_text';
      pages: { page: number; text: string }[];
    }
  | {
      kind: 'generic_text';
      text: string;
    };

export type ImportTags = {
  course?: string;
  subject?: string;
  chapter?: string;
  knowledgePoints: string[];
};

export type ImportTask = {
  id: string;
  fileName: string;
  size: number;
  mimeType: string;
  kind: ImportSourceKind;
  status: ImportTaskStatus;
  progress: number; // 0..100
  createdAt: number;
  updatedAt: number;
  error?: string;
  tags: ImportTags;
  result?: ParsedResult;
  objectUrl?: string; // for preview/download in renderer (not persisted)
  filePath?: string; // electron only: absolute path for shell.openPath
};


