import { useState, useEffect } from 'react';

export interface Settings {
  theme: 'light' | 'dark';
  fontSize: 'small' | 'medium' | 'large';
  dataDirectory: string;
  syncEnabled: boolean;
  syncAccount?: string;
  deviceId?: string;
  dataEncryption: boolean;
}

const defaultSettings: Settings = {
  theme: 'dark',
  fontSize: 'medium',
  dataDirectory: '',
  syncEnabled: false,
  dataEncryption: false
};

const STORAGE_KEY = 'sla_settings';

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return { ...defaultSettings, ...JSON.parse(stored) };
      }
    } catch (e) {
      console.error('Failed to load settings:', e);
    }
    return defaultSettings;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      // 应用主题
      document.documentElement.setAttribute('data-theme', settings.theme);
      // 应用字体大小
      document.documentElement.style.fontSize =
        settings.fontSize === 'small' ? '14px' : settings.fontSize === 'large' ? '16px' : '15px';
    } catch (e) {
      console.error('Failed to save settings:', e);
    }
  }, [settings]);

  return {
    settings,
    updateSettings: (patch: Partial<Settings>) => {
      setSettings((prev) => ({ ...prev, ...patch }));
    },
    resetSettings: () => {
      setSettings(defaultSettings);
    },
    exportData: () => {
      // Mock: 实际应导出所有数据
      const data = {
        settings,
        exportTime: new Date().toISOString()
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sla-export-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    },
    clearCache: () => {
      // Mock: 实际应清理缓存
      if (confirm('确定要清理缓存吗？这将删除临时文件。')) {
        localStorage.removeItem('sla_cache');
        alert('缓存已清理');
      }
    }
  };
}

