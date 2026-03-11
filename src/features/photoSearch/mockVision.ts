import type { VisionExtraction } from './types';

function pickBySeed(seed: number, arr: string[]) {
  return arr[seed % arr.length];
}

function hash(str: string) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h;
}

export async function mockExtractFromImage(fileName: string): Promise<VisionExtraction> {
  // 模拟耗时
  await new Promise((r) => setTimeout(r, 650));
  const seed = hash(fileName);
  const topic = pickBySeed(seed, ['导数', '函数', '极限', '概率', '电磁感应', '力学']);

  const keywords =
    topic === '导数'
      ? ['导数', '单调性', '极值', '切线']
      : topic === '函数'
        ? ['函数', '定义域', '值域', '图像']
        : topic === '极限'
          ? ['极限', '无穷小', '夹逼', '洛必达']
          : topic === '概率'
            ? ['概率', '条件概率', '独立性']
            : topic === '电磁感应'
              ? ['法拉第定律', '楞次定律', '磁通量']
              : ['受力分析', '牛顿第二定律', '摩擦力'];

  return {
    promptText: `题目涉及：${topic}。请根据题干求解并说明思路。`,
    keywords,
    formulas:
      topic === '导数'
        ? [String.raw`f'(x)=\lim_{h\to 0}\frac{f(x+h)-f(x)}{h}`]
        : topic === '概率'
          ? [String.raw`P(A\mid B)=\frac{P(AB)}{P(B)}`]
          : undefined
  };
}


