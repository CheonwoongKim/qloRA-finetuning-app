# SLM Fine-tuning Platform - Frontend

QLoRA 기반 Small Language Model 파인튜닝을 위한 웹 프론트엔드

## 기술 스택

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Icons**: Lucide React

## 프로젝트 구조

```
frontend/
├── app/
│   ├── layout.tsx              # 루트 레이아웃
│   ├── page.tsx                # 홈 페이지
│   ├── globals.css             # 전역 스타일
│   ├── models/                 # 모델 선택 페이지
│   ├── datasets/               # 데이터셋 업로드 페이지
│   ├── training/               # 학습 설정 페이지
│   ├── monitoring/             # 모니터링 대시보드
│   ├── evaluation/             # 모델 평가 페이지
│   └── deploy/                 # 모델 배포 페이지
├── components/
│   └── ui/                     # 재사용 가능한 UI 컴포넌트
│       ├── button.tsx
│       ├── card.tsx
│       ├── input.tsx
│       ├── label.tsx
│       └── progress.tsx
├── lib/
│   └── utils.ts                # 유틸리티 함수
└── public/                     # 정적 파일
```

## 시작하기

### 1. 의존성 설치

```bash
cd frontend
npm install
```

### 2. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000) 접속

### 3. 빌드

```bash
npm run build
```

### 4. 프로덕션 실행

```bash
npm start
```

## 주요 기능

### 1. 모델 선택 (`/models`)
- 사전 학습된 SLM 모델 목록 표시
- 모델 정보 (파라미터 수, 크기, 필요 VRAM) 확인
- 모델 선택 및 다음 단계로 이동

### 2. 데이터셋 준비 (`/datasets`)
- 파일 업로드 (JSON, JSONL, CSV)
- 샘플 데이터셋 선택
- 데이터셋 통계 및 미리보기

### 3. 학습 설정 (`/training`)
- **QLoRA 설정**
  - 양자화 비트 (4-bit/8-bit)
  - 양자화 타입 (NF4/FP4)
  - LoRA Rank, Alpha, Dropout
- **학습 하이퍼파라미터**
  - Learning Rate
  - Batch Size
  - Epochs
  - Max Sequence Length
  - Warmup Steps
- **고급 옵션**
  - Gradient Checkpointing
  - Mixed Precision
  - Double Quantization

### 4. 모니터링 (`/monitoring`)
- 실시간 학습 진행률
- 학습 메트릭 (Loss, Learning Rate, Samples/sec)
- 시스템 리소스 모니터링 (VRAM, RAM, GPU 사용률)
- 실시간 학습 로그
- 체크포인트 관리

## UI 컴포넌트

프로젝트는 shadcn/ui 기반의 재사용 가능한 컴포넌트를 사용합니다:

- `Button`: 다양한 스타일의 버튼
- `Card`: 콘텐츠 카드
- `Input`: 텍스트 입력 필드
- `Label`: 폼 레이블
- `Progress`: 진행률 표시 바

## 스타일링

Tailwind CSS를 사용하며, 다크 모드를 지원합니다:

- CSS 변수 기반 테마 시스템
- 반응형 디자인
- 커스텀 컬러 팔레트

## 다음 단계

### 백엔드 연동
- FastAPI 백엔드와 REST API 통합
- WebSocket을 통한 실시간 업데이트
- 파일 업로드 API 연동

### 추가 기능
- 사용자 인증 시스템
- 프로젝트 관리 기능
- 실시간 차트 (Chart.js/Recharts)
- 모델 평가 페이지 구현
- 모델 배포 페이지 구현

### 성능 최적화
- 이미지 최적화
- 코드 스플리팅
- 서버 사이드 렌더링 최적화

## 환경 변수

`.env.local` 파일 생성:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## 라이선스

MIT

## 기여

Pull Request는 언제나 환영합니다!
