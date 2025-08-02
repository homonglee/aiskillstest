
import type { TestResult, Question } from '../types';

export const generateMarkdownContent = (result: TestResult, questions: Question[]): string => {
  let content = `# AISkillsTest 평가 결과 - ${result.name}\n\n`;
  content += `- **총점:** ${result.score} / ${questions.length}\n`;
  content += `- **수준:** ${result.level}\n`;
  content += `- **개인정보 수집 동의:** ${result.agree_personal ? 'O' : 'X'}\n`;
  content += `- **제출 시간:** ${new Date(result.created_at).toLocaleString()}\n\n`;

  content += `## 정답 현황\n`;
  questions.forEach((q, index) => {
    const userAnswer = result.answers.find(a => a.questionId === q.id);
    const isCorrect = userAnswer?.selectedAnswer === q.correctAnswer;
    content += `${index + 1}. ${isCorrect ? '✅' : '❌'}  \n`;
  });
  content += `\n`;

  content += `## 해설 요약\n`;
  questions.forEach((q, index) => {
    const userAnswer = result.answers.find(a => a.questionId === q.id);
    content += `${index + 1}. **질문:** ${q.text}\n`;
    content += `   - **정답:** ${q.correctAnswer}\n`;
    content += `   - **선택:** ${userAnswer?.selectedAnswer || 'N/A'}\n`;
    content += `   - **해설:** ${q.explanation}\n\n`;
  });

  content += `\n---\n※ 본 결과는 개인용 참고 자료입니다.\n`;

  return content;
};

export const downloadMarkdown = (result: TestResult, questions: Question[]): void => {
  const markdownContent = generateMarkdownContent(result, questions);
  const blob = new Blob([markdownContent], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `AISkillsTest_결과_${result.name}.md`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
