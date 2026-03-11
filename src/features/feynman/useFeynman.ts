import { useMemo, useState } from 'react';
import type { FeynmanQuestion, FeynmanAnswer, AnalysisResult, WeakPoint, AnswerMode } from './types';
import { useKnowledgeCatalog } from '../catalog/useKnowledgeCatalog';

function mockQuestions(): FeynmanQuestion[] {
  return [
    {
      id: 'q1',
      knowledgePoint: 'kp-derivative',
      question: '请解释什么是导数，并说明它的几何意义。',
      hints: ['可以从变化率的角度思考', '几何意义与切线斜率有关']
    },
    {
      id: 'q2',
      knowledgePoint: 'kp-monotone',
      question: '如何判断一个函数的单调性？请说明判断方法。',
      hints: ['可以使用导数', '注意定义域']
    },
    {
      id: 'q3',
      knowledgePoint: 'kp-function',
      question: '函数的定义域和值域有什么区别？请举例说明。',
      hints: ['定义域是输入的范围', '值域是输出的范围']
    }
  ];
}

function mockAnalyze(answer: string, question: FeynmanQuestion): AnalysisResult {
  // Mock 分析：实际应调用后端API
  const lowerAnswer = answer.toLowerCase();
  const covered: string[] = [];
  const missing: string[] = [];
  const logicGaps: string[] = [];
  const commonMistakes: string[] = [];

  const hasAny = (keys: string[]) => keys.some((k) => lowerAnswer.includes(k));
  const short = answer.trim().length < 45;

  if (question.knowledgePoint === 'kp-derivative') {
    if (lowerAnswer.includes('变化率') || lowerAnswer.includes('斜率')) {
      covered.push('导数的定义');
    } else {
      missing.push('极限存在性的条件说明');
    }
    if (lowerAnswer.includes('切线') || lowerAnswer.includes('几何')) {
      covered.push('几何意义');
    } else {
      missing.push('几何意义的完整阐述');
    }
    if (short) {
      logicGaps.push('解释不够详细，缺少关键步骤');
    }
    if (!hasAny(['极限', 'h', '趋近', 'lim'])) {
      commonMistakes.push('容易忽略“极限过程”或写成直接代入');
    }
  }

  if (question.knowledgePoint === 'kp-monotone') {
    // 单调性：核心是“求导→符号→结论”，也要提到定义域/临界点
    if (hasAny(['导数', "f'", '求导'])) covered.push('求导得到导函数');
    else missing.push('求导得到导函数');

    if (hasAny(['符号', '正', '负', '大于0', '小于0', '区间'])) covered.push('讨论导数符号区间');
    else missing.push('讨论导数符号区间');

    if (hasAny(['递增', '递减', '单调'])) covered.push('由符号推出单调性结论');
    else missing.push('由符号推出单调性结论');

    if (!hasAny(['定义域', '临界点', '驻点', '不可导'])) missing.push('注意定义域/临界点/不可导点');

    if (short) logicGaps.push('步骤过短：建议写清“临界点→分区间→符号→结论”');
    commonMistakes.push('常见陷阱：只解 f\'(x)=0 却不做符号表');
  }

  if (question.knowledgePoint === 'kp-function') {
    // 定义域/值域：要点是“输入范围 vs 输出范围”，最好给一个例子
    if (hasAny(['输入', '自变量', 'x'])) covered.push('定义域是输入（自变量）的取值范围');
    else missing.push('定义域是输入（自变量）的取值范围');

    if (hasAny(['输出', '函数值', 'y'])) covered.push('值域是输出（函数值）的取值范围');
    else missing.push('值域是输出（函数值）的取值范围');

    if (hasAny(['例', '比如', '例如'])) covered.push('给出例子说明');
    else missing.push('给出例子说明');

    if (!hasAny(['开方', '分母', 'log', '对数', '根号', '不等式'])) {
      commonMistakes.push('容易只凭直觉写定义域，忽略“分母不为0/根号非负/对数真数>0”等约束');
    }
    if (short) logicGaps.push('解释不够具体：建议补一个例子（如 \(y=\\sqrt{x-1}\)）');
  }

  // 兜底：即使用户答得很少，也给出可展示的 mock 结果（避免界面一直显示“无”）
  if (covered.length === 0) {
    // 给一个“已覆盖”占位，让 UI 始终有内容可看
    covered.push(answer.trim().length >= 12 ? '复述题意要点' : '尝试作答');
  }
  if (missing.length === 0 && logicGaps.length === 0) {
    // 即使答得不错，也给一点“可提升点”（mock）
    logicGaps.push('可补充一个例子/关键步骤来增强说服力');
  }
  if (missing.length === 0 && question.hints?.length) {
    // 用题目 hints 作为“可补充点”（mock）
    missing.push(`可补充：${question.hints[0]}`);
  }

  const score = Math.min(100, Math.max(0, 60 + covered.length * 15 - missing.length * 10 - logicGaps.length * 5));

  return {
    coverage: { covered, missing },
    logicGaps,
    commonMistakes,
    score,
    feedback: score >= 80
      ? '回答较为完整，逻辑清晰'
      : score >= 60
        ? '回答基本正确，但可以更详细'
        : '回答不够完整，建议复习相关知识点'
  };
}

export function useFeynman() {
  const catalog = useKnowledgeCatalog();
  const [questions] = useState<FeynmanQuestion[]>(mockQuestions());
  const [answers, setAnswers] = useState<FeynmanAnswer[]>([]);
  const [weakPoints, setWeakPoints] = useState<WeakPoint[]>([]);
  const [selectedKnowledgePoint, setSelectedKnowledgePoint] = useState<string | undefined>();
  const [currentQuestion, setCurrentQuestion] = useState<FeynmanQuestion | null>(null);
  const [currentAnswer, setCurrentAnswer] = useState<string>('');
  const [isRecording, setIsRecording] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);

  const availableQuestions = useMemo(() => {
    if (!selectedKnowledgePoint) return questions;
    return questions.filter((q) => q.knowledgePoint === selectedKnowledgePoint);
  }, [questions, selectedKnowledgePoint]);

  const knowledgePointOptions = useMemo(
    () => catalog.flatKnowledge.map((kp) => ({ label: kp.title, value: kp.key })),
    [catalog]
  );

  const startQuestion = (question?: FeynmanQuestion) => {
    const q = question || availableQuestions[Math.floor(Math.random() * availableQuestions.length)];
    if (!q) return;
    setCurrentQuestion(q);
    setCurrentAnswer('');
    setAnalysis(null);
  };

  const submitAnswer = (mode: AnswerMode, content: string, audioUrl?: string) => {
    if (!currentQuestion) return;

    const answer: FeynmanAnswer = {
      id: `ans_${Date.now()}`,
      questionId: currentQuestion.id,
      mode,
      content,
      audioUrl,
      createdAt: new Date().toISOString()
    };

    setAnswers((prev) => [...prev, answer]);

    // Mock 分析
    const result = mockAnalyze(content, currentQuestion);
    setAnalysis(result);

    // 生成薄弱点
    const newWeakPoints: WeakPoint[] = [];
    result.coverage.missing.forEach((kp) => {
      newWeakPoints.push({
        id: `wp_${Date.now()}_${Math.random()}`,
        knowledgePoint: currentQuestion.knowledgePoint,
        questionId: currentQuestion.id,
        answerId: answer.id,
        type: 'missing',
        description: `缺失知识点：${kp}`,
        createdAt: new Date().toISOString()
      });
    });
    result.logicGaps.forEach((gap) => {
      newWeakPoints.push({
        id: `wp_${Date.now()}_${Math.random()}`,
        knowledgePoint: currentQuestion.knowledgePoint,
        questionId: currentQuestion.id,
        answerId: answer.id,
        type: 'logic_gap',
        description: gap,
        createdAt: new Date().toISOString()
      });
    });

    if (newWeakPoints.length > 0) {
      setWeakPoints((prev) => [...prev, ...newWeakPoints]);
    }
  };

  const startRecording = () => {
    setIsRecording(true);
    // Mock: 实际应调用浏览器录音API
  };

  const stopRecording = () => {
    setIsRecording(false);
    // Mock: 实际应停止录音并转写
    // 这里模拟转写结果
    const transcription = '这是我对导数的理解...';
    submitAnswer('voice', transcription);
  };

  return {
    questions: availableQuestions,
    knowledgePointOptions,
    selectedKnowledgePoint,
    setSelectedKnowledgePoint,
    currentQuestion,
    currentAnswer,
    setCurrentAnswer,
    isRecording,
    analysis,
    answers,
    weakPoints,
    startQuestion,
    submitAnswer,
    startRecording,
    stopRecording
  };
}

