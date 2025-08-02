# AI 활용능력 평가 시스템

AI 리터러시 수준을 평가하는 웹 애플리케이션입니다.

## 🚀 실시간 배포

이 프로젝트는 GitHub Actions를 통해 자동으로 배포됩니다:

- **메인 사이트:** https://[your-username].github.io/aiskillstest
- **관리자 페이지:** https://[your-username].github.io/aiskillstest/admin

## 📋 기능

- **사용자 평가:** 10개 문항으로 AI 활용능력 평가
- **관리자 대시보드:** 결과 분석 및 통계
- **MD 보고서:** 개인별/전체 분석 데이터 다운로드
- **실시간 배포:** GitHub에 푸시하면 자동 배포

## 🛠️ 로컬 실행

### 필수 조건
- Node.js 18+ 설치

### 설치 및 실행
```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
```

### 환경 변수 설정
`.env.local` 파일에 Gemini API 키를 설정하세요:
```
GEMINI_API_KEY=your_api_key_here
```

## 🚀 배포 방법

### 1. GitHub 저장소 생성
1. GitHub에서 새 저장소 생성: `aiskillstest`
2. 로컬 프로젝트를 GitHub에 연결

### 2. GitHub Pages 설정
1. 저장소 Settings → Pages
2. Source를 "GitHub Actions"로 설정

### 3. 자동 배포 설정
- `main` 브랜치에 푸시하면 자동으로 배포됩니다
- GitHub Actions가 빌드하고 GitHub Pages에 배포

### 4. 수동 배포 (선택사항)
```bash
npm run deploy
```

## 📁 프로젝트 구조

```
aiskillstest/
├── components/          # React 컴포넌트
├── pages/              # 페이지 컴포넌트
├── services/           # API 서비스
├── utils/              # 유틸리티 함수
├── .github/workflows/  # GitHub Actions
└── public/             # 정적 파일
```

## 🔧 기술 스택

- **Frontend:** React 19, TypeScript, Vite
- **Styling:** Tailwind CSS
- **Charts:** Recharts
- **Deployment:** GitHub Pages, GitHub Actions

## 📊 관리자 기능

- **실시간 통계:** 수준별 분포, 문항별 정답률
- **개인 데이터:** 상세 분석 및 문항별 답안
- **MD 보고서:** 전체/개인별 선택 다운로드
- **필터링:** 개인정보 동의 여부별 필터

## 🔐 관리자 접속

- URL: `/admin`
- 비밀번호: `supersecretpassword`

## 📝 라이선스

© 2025 AISkillsTest. All rights reserved.
