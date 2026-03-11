export type ResourceType = 'bilibili' | 'zhihu' | 'note' | 'other';

export interface Resource {
  id: string;
  type: ResourceType;
  title: string;
  url: string;
  description?: string;
  thumbnail?: string;
  createdAt: string;
  updatedAt: string;
  knowledgePoints: string[]; // 关联的知识点 ID
  tags: string[];
}

export interface BilibiliResource extends Resource {
  type: 'bilibili';
  videoId: string;
  keyframes: Keyframe[];
}

export interface ZhihuResource extends Resource {
  type: 'zhihu';
  articleId: string;
  summary: string;
  viewpoints: string[];
  comments?: string[];
}

export interface NoteResource extends Resource {
  type: 'note';
  noteApp: string; // 'GoodNotes' | 'Notability' | etc.
  highlights: Highlight[];
  annotations: Annotation[];
}

export interface Keyframe {
  id: string;
  timestamp: number; // 秒
  label: string;
  knowledgePoint?: string;
}

export interface Highlight {
  id: string;
  text: string;
  position?: string;
  knowledgePoint?: string;
}

export interface Annotation {
  id: string;
  content: string;
  position?: string;
  knowledgePoint?: string;
}

export type AnyResource = BilibiliResource | ZhihuResource | NoteResource | Resource;

export type ResourceHistoryAction = 'add' | 'update' | 'delete' | 'jump';

export type ResourceHistoryEntry = {
  id: string;
  ts: number; // ms
  action: ResourceHistoryAction;
  resourceId?: string;
  title: string;
  url?: string;
};

