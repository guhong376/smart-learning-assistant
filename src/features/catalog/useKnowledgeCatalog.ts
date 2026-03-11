import { useMemo } from 'react';

export type CatalogNode = {
  key: string;
  title: string;
  children?: CatalogNode[];
};

function flatten(nodes: CatalogNode[], prefix: string[] = []) {
  const out: { key: string; path: string; title: string }[] = [];
  for (const n of nodes) {
    const pathArr = [...prefix, n.title];
    out.push({ key: n.key, title: n.title, path: pathArr.join(' / ') });
    if (n.children?.length) out.push(...flatten(n.children, pathArr));
  }
  return out;
}

export function useKnowledgeCatalog() {
  // 先用示例树：后续可替换为后端/本地数据库加载
  const chapterTree: CatalogNode[] = useMemo(
    () => [
      {
        key: 'math',
        title: '数学',
        children: [
          {
            key: 'math-derivative',
            title: '导数',
            children: [
              { key: 'math-derivative-def', title: '导数定义与几何意义' },
              { key: 'math-derivative-app', title: '导数应用' },
              { key: 'math-derivative-app-monotone', title: '单调性与极值' }
            ]
          },
          {
            key: 'math-function',
            title: '函数',
            children: [
              { key: 'math-function-domain', title: '定义域与值域' },
              { key: 'math-function-graph', title: '函数图像' }
            ]
          }
        ]
      },
      {
        key: 'physics',
        title: '物理',
        children: [
          { key: 'physics-mechanics', title: '力学' },
          { key: 'physics-em', title: '电磁学' }
        ]
      }
    ],
    []
  );

  const knowledgeTree: CatalogNode[] = useMemo(
    () => [
      {
        key: 'kp-math',
        title: '数学知识点',
        children: [
          { key: 'kp-derivative', title: '导数' },
          { key: 'kp-monotone', title: '单调性' },
          { key: 'kp-extremum', title: '极值' },
          { key: 'kp-function', title: '函数' },
          { key: 'kp-limit', title: '极限' }
        ]
      },
      {
        key: 'kp-common',
        title: '通用',
        children: [
          { key: 'kp-mistake', title: '易错点' },
          { key: 'kp-summary', title: '总结' },
          { key: 'kp-example', title: '例题' }
        ]
      }
    ],
    []
  );

  const flatKnowledge = useMemo(() => flatten(knowledgeTree), [knowledgeTree]);

  return {
    chapterTree,
    knowledgeTree,
    flatKnowledge
  };
}


