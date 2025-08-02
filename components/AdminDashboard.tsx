
import React, { useState, useEffect, useMemo } from 'react';
import { getTestResults } from '../services/supabase';
import type { TestResult } from '../types';
import LevelDistributionChart from './LevelDistributionChart';
import CorrectRateChart from './CorrectRateChart';
import ResultsTable from './ResultsTable';
import { QUESTIONS } from '../constants';

const AdminDashboard: React.FC = () => {
  const [results, setResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [consentFilter, setConsentFilter] = useState<'all' | 'agreed' | 'disagreed'>('all');
  const [selectedResult, setSelectedResult] = useState<TestResult | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [downloadType, setDownloadType] = useState<'all' | 'individual'>('all');
  const [selectedResults, setSelectedResults] = useState<string[]>([]);

  useEffect(() => {
    const fetchResults = async () => {
      setLoading(true);
      const data = await getTestResults();
      setResults(data.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
      setLoading(false);
    };
    fetchResults();
  }, []);

  const filteredResults = useMemo(() => {
    if (consentFilter === 'agreed') {
      return results.filter(r => r.agree_personal);
    }
    if (consentFilter === 'disagreed') {
      return results.filter(r => !r.agree_personal);
    }
    return results;
  }, [results, consentFilter]);

  const levelData = useMemo(() => {
    const counts = { '입문': 0, '중급': 0, '고급': 0 };
    filteredResults.forEach(result => {
      counts[result.level]++;
    });
    return [
      { name: '입문', value: counts['입문'], fill: '#ef4444' },
      { name: '중급', value: counts['중급'], fill: '#f59e0b' },
      { name: '고급', value: counts['고급'], fill: '#22c55e' },
    ];
  }, [filteredResults]);

  const correctRateData = useMemo(() => {
    const questionStats = QUESTIONS.map(q => ({
      id: q.id,
      name: `Q${q.id}`,
      text: q.text,
      correct: 0,
      total: 0,
    }));

    filteredResults.forEach(result => {
      result.answers.forEach(answer => {
        const question = QUESTIONS.find(q => q.id === answer.questionId);
        const stat = questionStats.find(s => s.id === answer.questionId);
        if (question && stat) {
          stat.total++;
          if (answer.selectedAnswer === question.correctAnswer) {
            stat.correct++;
          }
        }
      });
    });

    return questionStats.map(stat => ({
      name: stat.name,
      text: stat.text,
      정답률: stat.total > 0 ? (stat.correct / stat.total) * 100 : 0,
    }));
  }, [filteredResults]);

  const handleViewDetails = (result: TestResult) => {
    setSelectedResult(result);
    setShowModal(true);
  };

  const handleOpenDownloadModal = () => {
    setShowDownloadModal(true);
    setSelectedResults([]);
  };

  const handleDownloadMD = () => {
    const resultsToDownload = downloadType === 'all' 
      ? filteredResults 
      : filteredResults.filter(result => selectedResults.includes(result.id));

    if (downloadType === 'individual' && selectedResults.length === 0) {
      alert('개인별 다운로드를 선택한 경우 최소 1명을 선택해주세요.');
      return;
    }

    // 전체 수험자 통계 (항상 전체 데이터 기준)
    const totalLevelCounts = { '입문': 0, '중급': 0, '고급': 0 };
    filteredResults.forEach(result => {
      totalLevelCounts[result.level]++;
    });

    const totalQuestionStats = QUESTIONS.map(q => ({
      id: q.id,
      name: `Q${q.id}`,
      text: q.text,
      correct: 0,
      total: 0,
    }));

    filteredResults.forEach(result => {
      result.answers.forEach(answer => {
        const question = QUESTIONS.find(q => q.id === answer.questionId);
        const stat = totalQuestionStats.find(s => s.id === answer.questionId);
        if (question && stat) {
          stat.total++;
          if (answer.selectedAnswer === question.correctAnswer) {
            stat.correct++;
          }
        }
      });
    });

    // 선택된 수험자 통계
    const selectedLevelCounts = { '입문': 0, '중급': 0, '고급': 0 };
    resultsToDownload.forEach(result => {
      selectedLevelCounts[result.level]++;
    });

    const selectedQuestionStats = QUESTIONS.map(q => ({
      id: q.id,
      name: `Q${q.id}`,
      text: q.text,
      correct: 0,
      total: 0,
    }));

    resultsToDownload.forEach(result => {
      result.answers.forEach(answer => {
        const question = QUESTIONS.find(q => q.id === answer.questionId);
        const stat = selectedQuestionStats.find(s => s.id === answer.questionId);
        if (question && stat) {
          stat.total++;
          if (answer.selectedAnswer === question.correctAnswer) {
            stat.correct++;
          }
        }
      });
    });

    // 1. 전체 통계 분석표 생성
    let totalStatsContent = `# AI 활용능력 평가 - 전체 통계 분석표\n\n`;
    totalStatsContent += `**생성일:** ${new Date().toLocaleString('ko-KR')}\n`;
    totalStatsContent += `**전체 응시자 수:** ${filteredResults.length}명\n`;
    totalStatsContent += `**분석 대상:** ${downloadType === 'all' ? '전체 응시자' : '선택된 응시자'}\n\n`;

    // 전체 수험자 통계
    totalStatsContent += `## 📊 전체 수험자 통계\n\n`;
    totalStatsContent += `### 수준별 분포\n`;
    totalStatsContent += `- **입문:** ${totalLevelCounts['입문']}명 (${filteredResults.length > 0 ? Math.round((totalLevelCounts['입문'] / filteredResults.length) * 100) : 0}%)\n`;
    totalStatsContent += `- **중급:** ${totalLevelCounts['중급']}명 (${filteredResults.length > 0 ? Math.round((totalLevelCounts['중급'] / filteredResults.length) * 100) : 0}%)\n`;
    totalStatsContent += `- **고급:** ${totalLevelCounts['고급']}명 (${filteredResults.length > 0 ? Math.round((totalLevelCounts['고급'] / filteredResults.length) * 100) : 0}%)\n\n`;

    // 전체 문항별 정답률
    totalStatsContent += `### 문항별 정답률\n\n`;
    totalQuestionStats.forEach(stat => {
      const correctRate = stat.total > 0 ? Math.round((stat.correct / stat.total) * 100) : 0;
      totalStatsContent += `- **Q${stat.id}:** ${correctRate}% (${stat.correct}/${stat.total})\n`;
    });
    totalStatsContent += `\n`;

    // 전체 평균 점수
    const totalAverageScore = filteredResults.length > 0 
      ? Math.round((filteredResults.reduce((sum, result) => sum + result.score, 0) / filteredResults.length) * 10) / 10
      : 0;
    totalStatsContent += `### 전체 평균 점수\n`;
    totalStatsContent += `- **평균:** ${totalAverageScore}/10점\n\n`;

    // 선택된 수험자 통계 (개인별 선택인 경우에만 표시)
    if (downloadType === 'individual') {
      totalStatsContent += `## 📈 선택된 수험자 통계\n\n`;
      totalStatsContent += `### 수준별 분포\n`;
      totalStatsContent += `- **입문:** ${selectedLevelCounts['입문']}명 (${resultsToDownload.length > 0 ? Math.round((selectedLevelCounts['입문'] / resultsToDownload.length) * 100) : 0}%)\n`;
      totalStatsContent += `- **중급:** ${selectedLevelCounts['중급']}명 (${resultsToDownload.length > 0 ? Math.round((selectedLevelCounts['중급'] / resultsToDownload.length) * 100) : 0}%)\n`;
      totalStatsContent += `- **고급:** ${selectedLevelCounts['고급']}명 (${resultsToDownload.length > 0 ? Math.round((selectedLevelCounts['고급'] / resultsToDownload.length) * 100) : 0}%)\n\n`;

      // 선택된 수험자 문항별 정답률
      totalStatsContent += `### 문항별 정답률\n\n`;
      selectedQuestionStats.forEach(stat => {
        const correctRate = stat.total > 0 ? Math.round((stat.correct / stat.total) * 100) : 0;
        totalStatsContent += `- **Q${stat.id}:** ${correctRate}% (${stat.correct}/${stat.total})\n`;
      });
      totalStatsContent += `\n`;

      // 선택된 수험자 평균 점수
      const selectedAverageScore = resultsToDownload.length > 0 
        ? Math.round((resultsToDownload.reduce((sum, result) => sum + result.score, 0) / resultsToDownload.length) * 10) / 10
        : 0;
      totalStatsContent += `### 선택된 수험자 평균 점수\n`;
      totalStatsContent += `- **평균:** ${selectedAverageScore}/10점\n\n`;
    }

    // 2. 개인별 상세 분석표 생성
    let individualContent = `# AI 활용능력 평가 - 개인별 상세 분석표\n\n`;
    individualContent += `**생성일:** ${new Date().toLocaleString('ko-KR')}\n`;
    individualContent += `**분석 대상:** ${resultsToDownload.length}명\n`;
    individualContent += `**다운로드 유형:** ${downloadType === 'all' ? '전체' : '개인별 선택'}\n\n`;

    // 개인별 상세 결과
    individualContent += `## 👥 개인별 상세 결과\n\n`;
    resultsToDownload.forEach((result, index) => {
      individualContent += `### ${index + 1}. ${result.name} (${result.email})\n\n`;
      individualContent += `**기본 정보:**\n`;
      individualContent += `- **점수:** ${result.score}/10\n`;
      individualContent += `- **수준:** ${result.level}\n`;
      individualContent += `- **개인정보 동의:** ${result.agree_personal ? '동의' : '미동의'}\n`;
      individualContent += `- **응시 시각:** ${new Date(result.created_at).toLocaleString('ko-KR')}\n\n`;

      // 전체 수험자 대비 위치
      const totalSameLevelCount = filteredResults.filter(r => r.level === result.level).length;
      const totalLevelRank = filteredResults.filter(r => r.level === result.level && r.score >= result.score).length;
      individualContent += `**전체 수험자 대비 위치:**\n`;
      individualContent += `- ${result.level} 수준에서 ${totalLevelRank}번째 (전체 ${totalSameLevelCount}명 중)\n`;
      individualContent += `- 전체 응시자 중 상위 ${filteredResults.length > 0 ? Math.round(((filteredResults.length - filteredResults.findIndex(r => r.id === result.id)) / filteredResults.length) * 100) : 0}%\n\n`;

      // 선택된 수험자 내 위치 (개인별 선택인 경우에만 표시)
      if (downloadType === 'individual') {
        const selectedSameLevelCount = resultsToDownload.filter(r => r.level === result.level).length;
        const selectedLevelRank = resultsToDownload.filter(r => r.level === result.level && r.score >= result.score).length;
        individualContent += `**선택된 수험자 내 위치:**\n`;
        individualContent += `- ${result.level} 수준에서 ${selectedLevelRank}번째 (선택된 ${selectedSameLevelCount}명 중)\n`;
        individualContent += `- 선택된 응시자 중 상위 ${resultsToDownload.length > 0 ? Math.round(((resultsToDownload.length - resultsToDownload.findIndex(r => r.id === result.id)) / resultsToDownload.length) * 100) : 0}%\n\n`;
      }

      // 문항별 답안
      individualContent += `**문항별 답안:**\n`;
      result.answers.forEach(answer => {
        const question = QUESTIONS.find(q => q.id === answer.questionId);
        const isCorrect = question?.correctAnswer === answer.selectedAnswer;
        individualContent += `- **Q${answer.questionId}:** ${answer.selectedAnswer} ${isCorrect ? '✅' : '❌'} (정답: ${question?.correctAnswer})\n`;
      });
      individualContent += `\n`;

      // 개인 분석
      const correctAnswers = result.answers.filter(answer => {
        const question = QUESTIONS.find(q => q.id === answer.questionId);
        return question?.correctAnswer === answer.selectedAnswer;
      }).length;

      individualContent += `**개인 분석:**\n`;
      individualContent += `- 정답률: ${Math.round((correctAnswers / result.answers.length) * 100)}%\n`;
      individualContent += `- 틀린 문항: ${result.answers.length - correctAnswers}개\n`;
      
      // 수준별 평가
      if (result.score >= 7) {
        individualContent += `- **평가:** 고급 수준으로 AI 활용 능력이 우수합니다.\n`;
      } else if (result.score >= 4) {
        individualContent += `- **평가:** 중급 수준으로 기본적인 AI 활용 능력을 보유하고 있습니다.\n`;
      } else {
        individualContent += `- **평가:** 입문 수준으로 AI 활용 능력 향상이 필요합니다.\n`;
      }
      individualContent += `\n---\n\n`;
    });

    // 두 개의 MD 파일 다운로드
    const downloadFile = (content: string, filename: string) => {
      const blob = new Blob([content], { type: 'text/markdown;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };

    const dateStr = new Date().toISOString().split('T')[0];
    downloadFile(totalStatsContent, `ai_test_total_stats_${dateStr}.md`);
    downloadFile(individualContent, `ai_test_individual_details_${dateStr}.md`);
    
    setShowDownloadModal(false);
  };

  const handleResultSelection = (resultId: string, checked: boolean) => {
    if (checked) {
      setSelectedResults([...selectedResults, resultId]);
    } else {
      setSelectedResults(selectedResults.filter(id => id !== resultId));
    }
  };

  if (loading) {
    return <div className="text-center p-10">Loading dashboard...</div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent">
            관리자 대시보드
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            AI 활용능력 평가 결과를 분석하고 관리합니다
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex items-center space-x-3">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">개인정보 동의 필터:</span>
            <select
                value={consentFilter}
                onChange={(e) => setConsentFilter(e.target.value as any)}
                className="rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50 text-sm"
            >
                <option value="all">전체</option>
                <option value="agreed">동의</option>
                <option value="disagreed">미동의</option>
            </select>
          </div>
          <button
              onClick={handleOpenDownloadModal}
              className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            전체 분석표 2개 MD 다운로드
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-6 rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 hover:shadow-2xl transition-all duration-300">
          <h2 className="text-xl font-semibold mb-4 text-gray-700 dark:text-gray-200 flex items-center">
            <div className="w-2 h-2 bg-red-500 rounded-full mr-3"></div>
            수준별 분포
          </h2>
          <LevelDistributionChart data={levelData} />
        </div>
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-6 rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 hover:shadow-2xl transition-all duration-300">
          <h2 className="text-xl font-semibold mb-4 text-gray-700 dark:text-gray-200 flex items-center">
            <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
            문항별 정답률
          </h2>
          <CorrectRateChart data={correctRateData} />
        </div>
      </div>

      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-6 rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 hover:shadow-2xl transition-all duration-300">
        <h2 className="text-xl font-semibold mb-4 text-gray-700 dark:text-gray-200 flex items-center">
          <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
          전체 수험자 결과 ({filteredResults.length}명)
        </h2>
        <ResultsTable results={filteredResults} onViewDetails={handleViewDetails} />
      </div>

      {/* 개인 데이터 상세 모달 */}
      {showModal && selectedResult && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-md rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-gray-200/50 dark:border-gray-700/50">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent">
                    {selectedResult.name} 상세 결과
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">{selectedResult.email}</p>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200"
                >
                  <svg className="w-6 h-6 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-6 rounded-xl border border-blue-200/50 dark:border-blue-700/50">
                  <h3 className="font-semibold mb-4 text-blue-800 dark:text-blue-200 flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    기본 정보
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">이름:</span>
                      <span className="font-medium">{selectedResult.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">이메일:</span>
                      <span className="font-medium">{selectedResult.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">점수:</span>
                      <span className="font-bold text-lg">{selectedResult.score}/10</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">수준:</span>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        selectedResult.level === '고급' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                        selectedResult.level === '중급' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' :
                        'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                      }`}>
                        {selectedResult.level}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">개인정보 동의:</span>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        selectedResult.agree_personal ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                      }`}>
                        {selectedResult.agree_personal ? '동의' : '미동의'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">응시 시각:</span>
                      <span className="font-medium text-sm">{new Date(selectedResult.created_at).toLocaleString('ko-KR')}</span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 p-6 rounded-xl border border-purple-200/50 dark:border-purple-700/50">
                  <h3 className="font-semibold mb-4 text-purple-800 dark:text-purple-200 flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    문항별 답안
                  </h3>
                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {selectedResult.answers.map(answer => {
                      const question = QUESTIONS.find(q => q.id === answer.questionId);
                      const isCorrect = question?.correctAnswer === answer.selectedAnswer;
                      return (
                        <div key={answer.questionId} className="bg-white/50 dark:bg-gray-800/50 p-3 rounded-lg border border-gray-200/50 dark:border-gray-600/50">
                          <div className="flex justify-between items-start mb-2">
                            <span className="font-medium text-sm">Q{answer.questionId}</span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              isCorrect ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                            }`}>
                              {isCorrect ? '정답' : '오답'}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">선택: {answer.selectedAnswer}</p>
                          <p className="text-sm font-medium">정답: {question?.correctAnswer}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">문항별 상세 분석</h3>
                <div className="space-y-4">
                  {selectedResult.answers.map(answer => {
                    const question = QUESTIONS.find(q => q.id === answer.questionId);
                    const isCorrect = question?.correctAnswer === answer.selectedAnswer;
                    return (
                      <details key={answer.questionId} className="bg-white dark:bg-gray-600 p-3 rounded">
                        <summary className="font-semibold cursor-pointer flex justify-between items-center">
                          <span>Q{answer.questionId}: {question?.text}</span>
                          <span className={isCorrect ? 'text-green-500' : 'text-red-500'}>
                            {isCorrect ? '정답' : '오답'}
                          </span>
                        </summary>
                        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-500">
                          <p><strong>선택한 답:</strong> {answer.selectedAnswer}</p>
                          <p><strong>정답:</strong> {question?.correctAnswer}</p>
                          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                            <strong>해설:</strong> {question?.explanation}
                          </p>
                        </div>
                      </details>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 다운로드 선택 모달 */}
      {showDownloadModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-md rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-200/50 dark:border-gray-700/50">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent">
                    전체 분석표 2개 MD 다운로드
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">전체 통계 분석표와 개인별 상세 분석표를 다운로드합니다</p>
                </div>
                <button
                  onClick={() => setShowDownloadModal(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200"
                >
                  <svg className="w-6 h-6 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4 text-gray-700 dark:text-gray-200 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    다운로드 유형 선택
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <label className="relative cursor-pointer">
                      <input
                        type="radio"
                        name="downloadType"
                        value="all"
                        checked={downloadType === 'all'}
                        onChange={(e) => setDownloadType(e.target.value as 'all' | 'individual')}
                        className="sr-only"
                      />
                      <div className={`p-4 rounded-xl border-2 transition-all duration-300 ${
                        downloadType === 'all' 
                          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' 
                          : 'border-gray-200 dark:border-gray-600 hover:border-primary-300 dark:hover:border-primary-600'
                      }`}>
                        <div className="flex items-center">
                          <div className={`w-4 h-4 rounded-full border-2 mr-3 ${
                            downloadType === 'all' 
                              ? 'border-primary-500 bg-primary-500' 
                              : 'border-gray-300 dark:border-gray-600'
                          }`}>
                            {downloadType === 'all' && (
                              <div className="w-2 h-2 bg-white rounded-full m-0.5"></div>
                            )}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900 dark:text-gray-100">전체 데이터</div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">모든 응시자 데이터 포함</div>
                          </div>
                        </div>
                      </div>
                    </label>
                    <label className="relative cursor-pointer">
                      <input
                        type="radio"
                        name="downloadType"
                        value="individual"
                        checked={downloadType === 'individual'}
                        onChange={(e) => setDownloadType(e.target.value as 'all' | 'individual')}
                        className="sr-only"
                      />
                      <div className={`p-4 rounded-xl border-2 transition-all duration-300 ${
                        downloadType === 'individual' 
                          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' 
                          : 'border-gray-200 dark:border-gray-600 hover:border-primary-300 dark:hover:border-primary-600'
                      }`}>
                        <div className="flex items-center">
                          <div className={`w-4 h-4 rounded-full border-2 mr-3 ${
                            downloadType === 'individual' 
                              ? 'border-primary-500 bg-primary-500' 
                              : 'border-gray-300 dark:border-gray-600'
                          }`}>
                            {downloadType === 'individual' && (
                              <div className="w-2 h-2 bg-white rounded-full m-0.5"></div>
                            )}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900 dark:text-gray-100">개인별 선택</div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">원하는 응시자만 선택</div>
                          </div>
                        </div>
                      </div>
                    </label>
                  </div>
                </div>

                {downloadType === 'individual' && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4 text-gray-700 dark:text-gray-200 flex items-center">
                      <svg className="w-5 h-5 mr-2 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      응시자 선택
                    </h3>
                    <div className="max-h-60 overflow-y-auto border border-gray-200 dark:border-gray-600 rounded-xl p-4 bg-gray-50 dark:bg-gray-700/50">
                      {filteredResults.map((result) => (
                        <label key={result.id} className="flex items-center py-3 px-3 border-b border-gray-200 dark:border-gray-600 last:border-b-0 hover:bg-white dark:hover:bg-gray-600/50 rounded-lg transition-colors duration-200 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedResults.includes(result.id)}
                            onChange={(e) => handleResultSelection(result.id, e.target.checked)}
                            className="mr-3 w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 dark:focus:ring-primary-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                          />
                          <div className="flex-1">
                            <div className="font-medium text-gray-900 dark:text-white">{result.name}</div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">{result.email}</div>
                            <div className="flex items-center space-x-2 mt-1">
                              <span className="text-sm text-gray-500 dark:text-gray-400">점수: {result.score}/10</span>
                              <span className="text-sm text-gray-500 dark:text-gray-400">|</span>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                result.level === '고급' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                                result.level === '중급' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' :
                                'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                              }`}>
                                {result.level}
                              </span>
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>
                    <div className="flex items-center justify-between mt-3 px-2">
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        선택된 응시자: <span className="font-medium text-primary-600 dark:text-primary-400">{selectedResults.length}명</span>
                      </p>
                      {selectedResults.length === 0 && downloadType === 'individual' && (
                        <p className="text-sm text-red-500 dark:text-red-400">최소 1명을 선택해주세요</p>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-600">
                  <button
                    onClick={() => setShowDownloadModal(false)}
                    className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 transition-colors font-medium"
                  >
                    취소
                  </button>
                  <button
                    onClick={handleDownloadMD}
                    className="px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 font-medium"
                  >
                    <svg className="w-4 h-4 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    다운로드
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
