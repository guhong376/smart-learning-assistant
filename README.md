# 智能学习助手（电脑端前端骨架）

本仓库在 `E:\Smart Learning Assistant` 下创建了一个**电脑端前端**骨架：先把信息架构、路由与 UI 框架搭好，后续逐步对接 OCR/转写/向量库/检索/学习计划等后端能力。

## 运行（当前可用：Web 方式在电脑端预览）

```bash
npm install
npm run dev
```

启动后由 Vite 输出本地地址，在浏览器中访问即可看到桌面端布局与页面占位。

## 桌面壳（Electron：已写好代码，但本机网络安装 Electron 失败时可先跳过）

Electron 相关文件在：

- `electron/main.mjs`
- `electron/preload.mjs`

如果你需要真正“桌面端窗口”运行：

1) 先把 `electron` 依赖加回去（或我下一步帮你处理镜像/离线安装方式）
2) 再运行：

```bash
npm run dev:desktop
```

## 信息架构（与功能清单对应）

- 总览：`/dashboard`
- 资料导入与解析：`/import`
- 知识库与标签：`/kb`
- 拍题反向检索：`/photo-search`
- 第三方资源整合：`/resources`
- 复习计划：`/plan`
- 费曼问答：`/feynman`
- 学习报告：`/reports`
- 设置：`/settings`

## 下一步建议（你确认优先级我就按这个做）

1. **资料导入页**：拖拽上传 + 任务队列 + 解析进度 + 结果预览（OCR/转写占位→接口对接）
2. **拍题检索页**：截图粘贴/图片上传 + 识别结果面板 + 命中列表 + 资源跳转 UI
3. **统一数据层**：`src/api/*`（先 mock，后换成真实后端/本地服务）


