
import React, { useState, useEffect, useCallback } from 'react';
import { QUESTIONS, SKILL_LEVELS } from '../constants';
import type { Question, Answer, TestResult, UserInfo, SkillLevel } from '../types';
import { saveTestResult } from '../services/supabase';
import { downloadMarkdown } from '../utils/downloadHelper';

const shuffleArray = <T,>(array: T[]): T[] => {
  return [...array].sort(() => Math.random() - 0.5);
};

const StartScreen: React.FC<{ onStart: (userInfo: UserInfo) => void }> = ({ onStart }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      setError('성명과 이메일을 모두 입력해주세요.');
      return;
    }
    setError('');
    onStart({ name, email, consent });
  };

  return (
    <div className="max-w-xl mx-auto bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
      <h1 className="text-3xl font-bold text-center text-primary-700 dark:text-primary-400 mb-4">AI 활용능력 평가</h1>
      <p className="text-center text-gray-600 dark:text-gray-300 mb-8">당신의 AI 리터러시 수준을 확인해보세요. 10개의 객관식 문항이 출제됩니다.</p>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">성명</label>
          <input type="text" id="name" value={name} onChange={(e) => setName(e.target.value)} className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-primary-500 focus:border-primary-500" placeholder="홍길동" required />
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">이메일</label>
          <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-primary-500 focus:border-primary-500" placeholder="name@example.com" required />
        </div>
        <div className="flex items-start">
          <div className="flex items-center h-5">
            <input id="consent" type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="focus:ring-primary-500 h-4 w-4 text-primary-600 border-gray-300 rounded" />
          </div>
          <div className="ml-3 text-sm">
            <label htmlFor="consent" className="font-medium text-gray-700 dark:text-gray-200">개인정보 수집 동의</label>
            <p className="text-gray-500 dark:text-gray-400 text-xs mt-1">수집된 개인정보는 상세 평가 분석 데이터의 전송에 사용됩니다. 상세 분석 데이터를 수신을 원하지 않으면 개인정보 수집 동의에 체크를 하지 않아도 됩니다.</p>
          </div>
        </div>
        {error && <p className="text-red-500 text-sm text-center">{error}</p>}
        <button type="submit" className="w-full bg-primary-600 text-white font-bold py-3 px-4 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-transform transform hover:scale-105 duration-300">
          평가 시작하기
        </button>
      </form>
    </div>
  );
};

const QuizScreen: React.FC<{ questions: Question[]; onFinish: (answers: Answer[]) => void }> = ({ questions, onFinish }) => {
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState<Answer[]>([]);
    const [shuffledOptions, setShuffledOptions] = useState<string[]>([]);
    const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);

    const currentQuestion = questions[currentQuestionIndex];

    useEffect(() => {
        if (currentQuestion) {
            setShuffledOptions(shuffleArray(currentQuestion.options));
            setSelectedAnswer(null);
        }
    }, [currentQuestion]);

    const handleAnswer = (answer: string) => {
        setSelectedAnswer(answer);
        setTimeout(() => {
            const newAnswers = [...answers, { questionId: currentQuestion.id, selectedAnswer: answer }];
            setAnswers(newAnswers);

            if (currentQuestionIndex < questions.length - 1) {
                setCurrentQuestionIndex(currentQuestionIndex + 1);
            } else {
                onFinish(newAnswers);
            }
        }, 300);
    };

    const progress = ((currentQuestionIndex) / questions.length) * 100;

    return (
        <div className="max-w-3xl mx-auto bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="mb-6">
                <div className="flex justify-between mb-1">
                    <span className="text-base font-medium text-primary-700 dark:text-primary-400">문항 {currentQuestionIndex + 1}/{questions.length}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                    <div className="bg-primary-600 h-2.5 rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
                </div>
            </div>

            <h2 className="text-2xl font-semibold mb-6 text-gray-800 dark:text-gray-100">{currentQuestion.text}</h2>
            <div className="space-y-4">
                {shuffledOptions.map((option, index) => {
                    const isSelected = selectedAnswer === option;
                    let buttonClass = 'w-full text-left p-4 rounded-lg border-2 transition-all duration-200 ';
                    if (isSelected) {
                        buttonClass += 'bg-primary-100 dark:bg-primary-900 border-primary-500 dark:border-primary-400 ring-2 ring-primary-500';
                    } else {
                        buttonClass += 'bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600 hover:border-primary-300';
                    }

                    return (
                        <button key={index} onClick={() => handleAnswer(option)} disabled={selectedAnswer !== null} className={buttonClass}>
                            {option}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};


const ResultScreen: React.FC<{ result: TestResult; questions: Question[]; onRestart: () => void }> = ({ result, questions, onRestart }) => {
  const getLevelInfo = (level: SkillLevel) => {
    switch (level) {
      case '입문': return { text: '입문', color: 'text-red-500', bg: 'bg-red-100 dark:bg-red-900' };
      case '중급': return { text: '중급', color: 'text-yellow-500', bg: 'bg-yellow-100 dark:bg-yellow-900' };
      case '고급': return { text: '고급', color: 'text-green-500', bg: 'bg-green-100 dark:bg-green-900' };
      default: return { text: 'N/A', color: 'text-gray-500', bg: 'bg-gray-100 dark:bg-gray-700' };
    }
  };

  const levelInfo = getLevelInfo(result.level);

  const handleDownload = () => {
    downloadMarkdown(result, questions);
  };

  return (
    <div className="max-w-3xl mx-auto bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
      <h1 className="text-3xl font-bold text-center text-primary-700 dark:text-primary-400 mb-2">평가 결과</h1>
      <p className="text-center text-gray-600 dark:text-gray-300 mb-6">{result.name}님의 AI 리터러시 수준은 <span className={`font-bold ${levelInfo.color}`}>{levelInfo.text}</span> 입니다.</p>
      
      <div className="text-center mb-8">
        <div className={`inline-block px-6 py-2 rounded-full ${levelInfo.bg} ${levelInfo.color} font-bold text-lg`}>
          총점: {result.score} / {questions.length}
        </div>
      </div>
      
      <div className="mb-8">
        <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-100">정오답 확인</h3>
        <div className="space-y-4">
          {questions.map((q) => {
            const userAnswer = result.answers.find(a => a.questionId === q.id);
            const isCorrect = userAnswer?.selectedAnswer === q.correctAnswer;
            return (
              <details key={q.id} className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                <summary className="font-semibold cursor-pointer flex justify-between items-center">
                  <span>{q.text}</span>
                  {isCorrect ? <span className="text-green-500 font-bold">✅ 정답</span> : <span className="text-red-500 font-bold">❌ 오답</span>}
                </summary>
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <p><strong>내 선택:</strong> {userAnswer?.selectedAnswer}</p>
                  <p><strong>정답:</strong> {q.correctAnswer}</p>
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-400"><strong>해설:</strong> {q.explanation}</p>
                </div>
              </details>
            );
          })}
        </div>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-4">
        <button onClick={handleDownload} className="flex-1 bg-green-600 text-white font-bold py-3 px-4 rounded-md hover:bg-green-700 transition-transform transform hover:scale-105 duration-300">
          결과 저장하기 (.md)
        </button>
        <button onClick={onRestart} className="flex-1 bg-primary-600 text-white font-bold py-3 px-4 rounded-md hover:bg-primary-700 transition-transform transform hover:scale-105 duration-300">
          다시 풀기
        </button>
      </div>
    </div>
  );
};


const UserTestPage: React.FC = () => {
    const [gameState, setGameState] = useState<'start' | 'quiz' | 'results'>('start');
    const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
    const [shuffledQuestions, setShuffledQuestions] = useState<Question[]>([]);
    const [finalResult, setFinalResult] = useState<TestResult | null>(null);

    const startTest = useCallback((info: UserInfo) => {
        setUserInfo(info);
        const questions = QUESTIONS; // 고정 순서로 출제
        setShuffledQuestions(questions);
        setGameState('quiz');
    }, []);

    const finishTest = useCallback(async (answers: Answer[]) => {
        if (!userInfo || shuffledQuestions.length === 0) return;

        let correctCount = 0;
        answers.forEach(answer => {
            const question = shuffledQuestions.find(q => q.id === answer.questionId);
            if (question && question.correctAnswer === answer.selectedAnswer) {
                correctCount++;
            }
        });

        const score = correctCount;
        let level: SkillLevel = '입문';
        if (score >= SKILL_LEVELS.ADVANCED) {
            level = '고급';
        } else if (score >= SKILL_LEVELS.INTERMEDIATE) {
            level = '중급';
        }

        const resultData: TestResult = {
            id: crypto.randomUUID(),
            name: userInfo.consent ? userInfo.name : '홍길용',
            email: userInfo.consent ? userInfo.email : 'hkd@aiskillstest.org',
            score,
            answers,
            correct_count: correctCount,
            level,
            agree_personal: userInfo.consent,
            created_at: new Date().toISOString()
        };
        
        setFinalResult(resultData);
        await saveTestResult(resultData);
        setGameState('results');
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userInfo, shuffledQuestions]);
    
    const restartTest = () => {
        setGameState('start');
        setUserInfo(null);
        setFinalResult(null);
        setShuffledQuestions([]);
    };

    return (
        <div>
            {gameState === 'start' && <StartScreen onStart={startTest} />}
            {gameState === 'quiz' && <QuizScreen questions={shuffledQuestions} onFinish={finishTest} />}
            {gameState === 'results' && finalResult && <ResultScreen result={finalResult} questions={shuffledQuestions} onRestart={restartTest} />}
        </div>
    );
};

export default UserTestPage;
