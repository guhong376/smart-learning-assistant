import { useEffect, useMemo } from 'react';
import { theme } from 'antd';
import { appTheme } from './themes';

export function useTheme() {
  useEffect(() => {
    // 更新 CSS 变量
    document.documentElement.style.setProperty('--theme-bg-base', appTheme.colorBgBase);
    document.documentElement.style.setProperty('--theme-bg-container', appTheme.colorBgContainer);
    document.documentElement.style.setProperty('--theme-gradient-from', appTheme.gradient.from);
    document.documentElement.style.setProperty('--theme-gradient-mid', appTheme.gradient.mid);
    document.documentElement.style.setProperty('--theme-gradient-to', appTheme.gradient.to);
    // 卡片层级（更明显的区分）
    // 玻璃面板：更接近你给的参考图（半透明 + blur）
    // 更“白透”的玻璃感：面板更亮，边框更白
    // 不再用遮罩覆盖背景（保留纯渐变底）
    document.documentElement.style.setProperty('--theme-overlay', 'rgba(0, 0, 0, 0)');
    document.documentElement.style.setProperty('--theme-panel-bg', 'rgba(255, 255, 255, 0.14)');
    document.documentElement.style.setProperty('--theme-panel-bg-strong', 'rgba(255, 255, 255, 0.18)');
    document.documentElement.style.setProperty('--theme-panel-border', 'rgba(255, 255, 255, 0.28)');
    document.documentElement.style.setProperty('--theme-panel-shadow', '0 18px 50px rgba(0,0,0,0.35)');

    document.documentElement.style.setProperty('--theme-card-bg', 'rgba(255, 255, 255, 0.18)');
    document.documentElement.style.setProperty('--theme-card-border', 'rgba(255, 255, 255, 0.34)');

    // 文字分场景：暗底(页面/侧边栏)用白字，浅色玻璃卡片内用深字
    // 优化字体颜色：更高对比度，层次更清晰
    document.documentElement.style.setProperty('--theme-text-on-dark', 'rgba(255,255,255,0.96)');
    document.documentElement.style.setProperty('--theme-text-secondary-on-dark', 'rgba(255,255,255,0.75)');
    document.documentElement.style.setProperty('--theme-text-on-light', 'rgba(15,23,42,0.96)'); /* slate-900 */
    document.documentElement.style.setProperty('--theme-text-secondary-on-light', 'rgba(15,23,42,0.70)');
  }, []);

  const antdTheme = useMemo(() => {
    return {
      algorithm: theme.darkAlgorithm,
      token: {
        colorPrimary: appTheme.colorPrimary,
        colorBgBase: appTheme.colorBgBase,
        colorBgContainer: appTheme.colorBgContainer,
        borderRadius: 8,
        colorTextBase: 'rgba(255,255,255,0.96)',
        colorTextSecondary: 'rgba(255,255,255,0.75)',
        colorBorder: 'rgba(255, 255, 255, 0.22)',
        colorBorderSecondary: 'rgba(255, 255, 255, 0.16)',
        colorBgElevated: 'rgba(255, 255, 255, 0.10)',
        colorSuccess: appTheme.colors.success,
        colorWarning: appTheme.colors.warning,
        colorError: appTheme.colors.error,
        colorInfo: appTheme.colors.info
      }
    };
  }, []);

  return {
    antdTheme
  };
}

