export type VectorStatus = 'indexed' | 'pending' | 'failed' | 'processing';

export interface DocumentItem {
  id: string;
  title: string;
  type: 'ppt' | 'audio' | 'image' | 'note' | 'pdf' | 'other';
  subject?: string;
  chapter?: string;
  knowledgePoints: string[];
  tags: string[];
  vectorStatus: VectorStatus;
  indexedAt?: string;
  errorMessage?: string;
  fileSize?: number;
  createdAt: string;
}

export interface KnowledgeTag {
  id: string;
  name: string;
  alias?: string[];
  parentId?: string;
  level: number;
  children?: KnowledgeTag[];
  documentCount: number;
}

export interface IndexTask {
  id: string;
  type: 'rebuild' | 'incremental' | 'optimize';
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress?: number;
  startedAt?: string;
  completedAt?: string;
  errorMessage?: string;
}

