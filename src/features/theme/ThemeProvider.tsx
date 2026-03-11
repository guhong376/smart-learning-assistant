import React from 'react';
import { ConfigProvider } from 'antd';
import { useTheme } from './useTheme';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { antdTheme } = useTheme();

  return <ConfigProvider theme={antdTheme}>{children}</ConfigProvider>;
}

