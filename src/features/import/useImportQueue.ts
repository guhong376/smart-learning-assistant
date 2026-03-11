import { useEffect, useMemo, useReducer, useRef, useCallback, useState } from 'react';
import type { ImportTask, ImportTaskStatus } from './types';
import { buildMockResult, guessKind } from './mockParser';

const STORAGE_KEY = 'sla.import.tasks.v1';

type State = {
  tasks: ImportTask[];
};

type Action =
  | { type: 'ADD_FILES'; files: File[] }
  | { type: 'TICK' }
  | { type: 'CANCEL'; id: string }
  | { type: 'RETRY'; id: string }
  | { type: 'UPDATE_TAGS'; id: string; tags: Partial<ImportTask['tags']> }
  | { type: 'UPDATE_FILE_PATH'; id: string; filePath: string }
  | { type: 'REMOVE'; id: string };

function now() {
  return Date.now();
}

function mkId() {
  return `${now()}-${Math.random().toString(16).slice(2)}`;
}

function nextStatus(status: ImportTaskStatus, progress: number): ImportTaskStatus {
  if (status === 'cancelled' || status === 'failed' || status === 'done') return status;
  if (progress >= 100) return 'done';
  if (progress > 0) return 'parsing';
  return 'queued';
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'ADD_FILES': {
      const newTasks: ImportTask[] = action.files.map((f) => {
        const kind = guessKind(f.name, f.type || '');
        const objectUrl =
          f.type?.startsWith('image/') || f.type?.startsWith('audio/') ? URL.createObjectURL(f) : undefined;
        const filePath =
          // Electron 某些版本/配置下 file.path 不可用，优先用 preload 的 webUtils.getPathForFile
          (window as any)?.sla?.getPathForFile?.(f) ||
          (typeof (f as any)?.path === 'string' ? ((f as any).path as string) : undefined);
        return {
          id: mkId(),
          fileName: f.name,
          size: f.size,
          mimeType: f.type || 'application/octet-stream',
          kind,
          status: 'queued',
          progress: 0,
          createdAt: now(),
          updatedAt: now(),
          tags: { knowledgePoints: [] },
          objectUrl,
          filePath
        };
      });
      return { tasks: [...newTasks, ...state.tasks] };
    }
    case 'TICK': {
      const updated = state.tasks.map((t) => {
        if (t.status === 'cancelled' || t.status === 'failed' || t.status === 'done') return t;
        // mock progress: fast for small files, slower for big ones
        const step = Math.max(2, Math.min(10, Math.round(40_000_000 / Math.max(1, t.size))));
        const nextProgress = Math.min(100, t.progress + step);
        const status = nextStatus(t.status, nextProgress);
        if (status === 'done' && !t.result) {
          return {
            ...t,
            progress: 100,
            status,
            updatedAt: now(),
            result: buildMockResult(t.fileName, t.kind)
          };
        }
        return { ...t, progress: nextProgress, status, updatedAt: now() };
      });
      return { tasks: updated };
    }
    case 'CANCEL': {
      return {
        tasks: state.tasks.map((t) => (t.id === action.id ? { ...t, status: 'cancelled', updatedAt: now() } : t))
      };
    }
    case 'RETRY': {
      return {
        tasks: state.tasks.map((t) =>
          t.id === action.id
            ? { ...t, status: 'queued', progress: 0, error: undefined, result: undefined, updatedAt: now() }
            : t
        )
      };
    }
    case 'UPDATE_TAGS': {
      return {
        tasks: state.tasks.map((t) =>
          t.id === action.id ? { ...t, tags: { ...t.tags, ...action.tags }, updatedAt: now() } : t
        )
      };
    }
    case 'UPDATE_FILE_PATH': {
      return {
        tasks: state.tasks.map((t) => (t.id === action.id ? { ...t, filePath: action.filePath, updatedAt: now() } : t))
      };
    }
    case 'REMOVE': {
      const t = state.tasks.find((x) => x.id === action.id);
      if (t?.objectUrl) URL.revokeObjectURL(t.objectUrl);
      return { tasks: state.tasks.filter((x) => x.id !== action.id) };
    }
    default:
      return state;
  }
}

function serializeTask(t: ImportTask) {
  // objectUrl 不能持久化（基于本地 File 的临时 URL）；其余字段可用于恢复列表/标签/解析结果（mock）
  const { objectUrl: _objectUrl, ...rest } = t;
  return rest;
}

function loadInitialState(): State {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { tasks: [] };
    const parsed = JSON.parse(raw) as Array<ReturnType<typeof serializeTask>>;
    if (!Array.isArray(parsed)) return { tasks: [] };
    // 恢复时补齐缺省字段，避免历史数据结构变化导致报错
    const tasks: ImportTask[] = parsed.map((t: any) => ({
      ...t,
      tags: t.tags ?? { knowledgePoints: [] },
      objectUrl: undefined
    }));
    return { tasks };
  } catch {
    return { tasks: [] };
  }
}

export function useImportQueue() {
  const [state, dispatch] = useReducer(reducer, undefined as unknown as State, loadInitialState);
  const timerRef = useRef<number | null>(null);
  const tasksRef = useRef<ImportTask[]>(state.tasks);
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);

  useEffect(() => {
    tasksRef.current = state.tasks;
  }, [state.tasks]);

  useEffect(() => {
    timerRef.current = window.setInterval(() => dispatch({ type: 'TICK' }), 700);
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
      // cleanup object urls
      tasksRef.current.forEach((t) => t.objectUrl && URL.revokeObjectURL(t.objectUrl));
    };
  }, []);

  const persistNow = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.tasks.map(serializeTask)));
      setLastSavedAt(Date.now());
    } catch {
      // ignore
    }
  }, [state.tasks]);

  // 自动持久化：任何变更都落盘（mock 本地保存）
  useEffect(() => {
    persistNow();
  }, [persistNow]);

  const stats = useMemo(() => {
    const total = state.tasks.length;
    const by = (s: ImportTaskStatus) => state.tasks.filter((t) => t.status === s).length;
    return {
      total,
      queued: by('queued'),
      parsing: by('parsing'),
      done: by('done'),
      failed: by('failed'),
      cancelled: by('cancelled')
    };
  }, [state.tasks]);

  return {
    tasks: state.tasks,
    stats,
    lastSavedAt,
    persistNow,
    addFiles: (files: File[]) => dispatch({ type: 'ADD_FILES', files }),
    cancel: (id: string) => dispatch({ type: 'CANCEL', id }),
    retry: (id: string) => dispatch({ type: 'RETRY', id }),
    updateTags: (id: string, tags: Partial<ImportTask['tags']>) => dispatch({ type: 'UPDATE_TAGS', id, tags }),
    updateFilePath: (id: string, filePath: string) => dispatch({ type: 'UPDATE_FILE_PATH', id, filePath }),
    remove: (id: string) => dispatch({ type: 'REMOVE', id })
  };
}


