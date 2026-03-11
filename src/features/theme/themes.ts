export interface ThemeConfig {
  name: string;
  description: string;
  colorPrimary: string;
  colorBgBase: string;
  colorBgContainer: string;
  gradient: {
    from: string;
    mid: string;
    to: string;
  };
  colors: {
    success: string;
    warning: string;
    error: string;
    info: string;
  };
}

// 单一主题配置 - 蓝 / 紫 / 粉（卡片蓝灰、状态色更亮、按钮更扁平）
export const appTheme: ThemeConfig = {
  name: '智能学习助手',
  description: '蓝紫粉氛围 + 蓝灰面板（更像大屏/仪表盘）',
  // 主色：偏蓝（按钮/高亮更清晰）
  colorPrimary: '#3b82f6', // Blue 500
  // 背景：深蓝黑
  colorBgBase: '#0b1020',
  // 容器：蓝灰一层（卡片/表格等容器层级更明显）
  colorBgContainer: '#121a2f',
  gradient: {
    // 登录页/大块背景渐变：蓝 -> 紫 -> 粉
    from: '#3b82f6', // Blue 500
    mid: '#8b5cf6', // Violet 500
    to: '#ec4899' // Pink 500
  },
  colors: {
    // 状态色：更亮更“跳”
    success: '#34d399', // Emerald 400
    warning: '#fbbf24', // Amber 400
    error: '#fb7185', // Rose 400
    info: '#60a5fa' // Blue 400
  }
};

