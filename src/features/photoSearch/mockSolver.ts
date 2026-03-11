import type { AiSolution, SearchHit, VisionExtraction } from './types';

function hash(str: string) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h;
}

function clamp01(x: number) {
  return Math.max(0, Math.min(1, x));
}

function hasAny(ex: VisionExtraction, keys: string[]) {
  return keys.some((k) => ex.keywords.some((x) => x.includes(k) || k.includes(x)));
}

export async function mockAiSolve(ex: VisionExtraction, hits: SearchHit[]): Promise<AiSolution> {
  // 模拟耗时
  await new Promise((r) => setTimeout(r, 900));

  const seed = hash(ex.promptText + '|' + ex.keywords.join(','));
  const confidence = clamp01(0.72 + (seed % 17) / 100); // 0.72~0.88
  const refs = hits.slice(0, 3).map((h) => ({ hitId: h.id, title: h.title, source: h.source, score: h.score }));

  // 简单按关键词挑一个模板（后续替换为真实大模型调用）
  if (hasAny(ex, ['导数', '单调', '极值', '切线'])) {
    return {
      answer: '先求导 \(f\'(x)\)，分析符号区间，得到单调区间与极值点；必要时再比较端点值求最值。',
      steps: [
        '读题确定函数/参数范围与定义域，必要时先化简表达式。',
        '求导得到 \(f\'(x)\)，并求解 \(f\'(x)=0\) 的临界点，同时考虑不可导点。',
        '在各区间讨论 \(f\'(x)\) 的符号：正→递增，负→递减，得到单调区间。',
        '用“符号变化”或二阶导判断极大/极小；若求最值，还要比较端点与不可导点函数值。',
        '写出结论并检查是否满足题目条件（定义域、参数取值等）。'
      ],
      keyPoints: ['导数定义与几何意义', '单调性判定（看导数符号）', '极值点：导数为0或不可导', '最值需要比较端点值'],
      confidence,
      refs
    };
  }

  if (hasAny(ex, ['极限', '洛必达', '无穷小', '夹逼'])) {
    return {
      answer: '优先做等价无穷小/因式分解化简；若出现 \(0/0\) 或 \(\infty/\infty\)，可考虑洛必达或夹逼定理。',
      steps: [
        '先判断极限类型（代入趋近后是 \(0/0\)、\(\infty/\infty\) 还是可直接求）。',
        '尝试代换、通分、提公因式、恒等变形（例如有理化）。',
        '若符合洛必达条件，求导化简后再取极限（注意次数别过多）。',
        '若为震荡/夹逼结构，构造上下界并用夹逼定理。',
        '给出最终极限值，并说明使用的定理或等价替换。'
      ],
      keyPoints: ['等价无穷小', '洛必达使用条件', '夹逼定理', '有理化/提公因式'],
      confidence,
      refs
    };
  }

  if (hasAny(ex, ['概率', '条件概率', '独立'])) {
    return {
      answer: '用条件概率公式 \(P(A\\mid B)=\\frac{P(AB)}{P(B)}\)，必要时配合全概率/贝叶斯或独立性判断。',
      steps: [
        '把题目事件 \(A,B\) 明确定义（语言→事件）。',
        '列出已知量与要求量，判断是否需要求交集 \(P(AB)\) 或边缘概率 \(P(B)\)。',
        '若有分情况，使用全概率公式；若需要反推，使用贝叶斯公式。',
        '独立性判断：看 \(P(AB)=P(A)P(B)\) 或 \(P(A\\mid B)=P(A)\)。',
        '代入计算并给出结果。'
      ],
      keyPoints: ['条件概率', '全概率', '贝叶斯', '独立性判定'],
      confidence,
      refs
    };
  }

  // fallback
  return {
    answer: '根据题干抽取已知条件与所求目标，选择对应章节方法（定义/公式/例题套路）逐步推导即可。',
    steps: [
      '把题干信息结构化：已知、所求、约束条件。',
      '根据关键词选定方法：代数化简/公式套用/分类讨论/构造函数等。',
      '按步骤推导，最后检查答案是否满足约束与是否漏掉特殊点。',
      '整理成“结论 + 关键理由”。'
    ],
    keyPoints: ['审题→建模', '方法选择要对应关键词', '注意边界/特殊点', '最后验算'],
    confidence,
    refs
  };
}


