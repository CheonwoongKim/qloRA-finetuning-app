# QLoRA Fine-tuning Desktop Application

QLoRA 기법을 사용하여 대규모 언어 모델(LLM)을 효율적으로 파인튜닝할 수 있는 데스크톱 애플리케이션입니다.

## 주요 기능

- 🤖 **모델 관리**: HuggingFace Hub에서 모델 다운로드 및 관리
- 📊 **데이터셋 관리**: 파인튜닝용 데이터셋 업로드 및 관리
- ⚙️ **QLoRA 파인튜닝**: 효율적인 Low-Rank Adaptation을 통한 모델 학습
- 📈 **실시간 모니터링**: 학습 진행 상황 및 시스템 리소스 모니터링
- 💬 **플레이그라운드**: 파인튜닝된 모델 테스트 및 대화
- 🎯 **직관적인 UI**: 사용하기 쉬운 데스크톱 인터페이스

## 기술 스택

### Frontend
- **Next.js 16.0.1** - React 프레임워크
- **Electron 39.0.0** - 데스크톱 애플리케이션 프레임워크
- **TypeScript** - 타입 안전성
- **Tailwind CSS** - 스타일링
- **Radix UI** - UI 컴포넌트
- **Recharts** - 데이터 시각화

### Backend
- **FastAPI 0.115.0** - Python 웹 프레임워크
- **PyTorch 2.5.1** - 딥러닝 프레임워크
- **Transformers 4.57.1** - HuggingFace 라이브러리
- **PEFT 0.13.2** - Parameter-Efficient Fine-Tuning
- **BitsAndBytes 0.42.0** - 양자화 라이브러리
- **TRL 0.12.1** - Transformer Reinforcement Learning

## 시스템 요구사항

### macOS

**최소 사양**
- **OS**: macOS 11.0 이상 (Apple Silicon)
- **RAM**: 16GB 이상
- **저장공간**: 20GB 이상 여유 공간
- **Python**: 3.12

**권장 사양**
- **OS**: macOS 14.0 이상 (Apple Silicon)
- **RAM**: 32GB 이상
- **저장공간**: 50GB 이상 여유 공간
- **GPU**: Apple M1/M2/M3 (Metal 지원)

### Windows

**최소 사양**
- **OS**: Windows 10 (64-bit) 이상
- **RAM**: 16GB 이상
- **저장공간**: 30GB 이상 여유 공간
- **Python**: 3.12

**권장 사양**
- **OS**: Windows 11 (64-bit)
- **RAM**: 32GB 이상
- **저장공간**: 50GB 이상 여유 공간
- **GPU**: NVIDIA GPU (CUDA 지원)

## 설치 방법

### macOS (Apple Silicon)

#### DMG 파일로 설치 (권장)

1. 최신 릴리즈에서 `FineTuning App-1.0.0-arm64.dmg` 다운로드
2. DMG 파일을 더블클릭하여 마운트
3. `FineTuning App`을 `Applications` 폴더로 드래그
4. Applications 폴더에서 `FineTuning App` 실행

### Windows

#### 인스톨러로 설치 (권장)

1. 최신 릴리즈에서 `FineTuning App Setup 1.0.0.exe` 다운로드
2. 설치 프로그램 실행
3. 설치 마법사 지시에 따라 설치
4. 시작 메뉴 또는 바탕화면에서 앱 실행

#### Portable 버전

1. `FineTuning App 1.0.0.exe` 다운로드
2. 원하는 위치에 실행 파일 배치
3. 실행 파일 더블클릭하여 실행

> **참고**: Windows에서 빌드하려면 [Windows 빌드 가이드](./WINDOWS_BUILD.md)를 참조하세요.

### 2. 소스코드로 개발 환경 설정

#### Backend 설정

```bash
# 저장소 클론
git clone <repository-url>
cd finetuning

# Python 가상환경 생성 및 활성화
cd backend
python3 -m venv venv
source venv/bin/activate

# 의존성 설치
pip install -r requirements.txt

# 백엔드 서버 실행
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

#### Frontend 설정

```bash
# 프론트엔드 디렉토리로 이동
cd frontend

# 의존성 설치
npm install

# 개발 서버 실행
npm run dev

# Electron 개발 모드 실행
npm run electron:dev
```

## 사용 방법

### 1. 모델 다운로드

1. **Models** 탭으로 이동
2. HuggingFace 모델 ID 입력 (예: `Qwen/Qwen2.5-0.5B`)
3. **Download** 버튼 클릭
4. 다운로드 진행 상황 확인

### 2. 데이터셋 업로드

1. **Datasets** 탭으로 이동
2. **Upload Dataset** 버튼 클릭
3. JSON 또는 JSONL 파일 선택
4. 데이터셋 형식:
```json
[
  {
    "instruction": "질문 또는 지시사항",
    "input": "추가 입력 (선택사항)",
    "output": "기대되는 출력"
  }
]
```

### 3. 파인튜닝 작업 생성

1. **New Job** 탭으로 이동
2. 작업 설정:
   - Job Name: 작업 이름
   - Model: 다운로드한 모델 선택
   - Dataset: 업로드한 데이터셋 선택
   - Training Parameters:
     - Epochs: 학습 에포크 수 (기본: 3)
     - Batch Size: 배치 크기 (기본: 4)
     - Learning Rate: 학습률 (기본: 2e-4)
     - LoRA r: LoRA rank (기본: 8)
     - LoRA alpha: LoRA alpha (기본: 16)
3. **Start Training** 버튼 클릭

### 4. 학습 모니터링

1. **Jobs** 탭에서 진행 중인 작업 확인
2. 작업 클릭하여 상세 정보 확인:
   - 현재 Loss
   - 학습 진행률
   - 예상 완료 시간
3. **Monitoring** 탭에서 시스템 리소스 확인:
   - CPU 사용률
   - 메모리 사용량
   - GPU 사용률 (지원되는 경우)

### 5. 모델 테스트

1. **Playground** 탭으로 이동
2. 파인튜닝된 모델 선택
3. 프롬프트 입력 후 **Send** 버튼 클릭
4. 모델의 응답 확인

## 프로젝트 구조

```
finetuning/
├── backend/                 # FastAPI 백엔드
│   ├── app/
│   │   ├── api/
│   │   │   └── routes/     # API 엔드포인트
│   │   │       ├── datasets.py
│   │   │       ├── download.py
│   │   │       ├── hardware.py
│   │   │       ├── jobs.py
│   │   │       ├── models.py
│   │   │       └── playground.py
│   │   ├── core/           # 핵심 설정
│   │   ├── services/       # 비즈니스 로직
│   │   └── main.py         # FastAPI 애플리케이션
│   ├── requirements.txt    # Python 의존성
│   └── venv/              # Python 가상환경
│
├── frontend/               # Next.js + Electron 프론트엔드
│   ├── app/               # Next.js 페이지
│   │   ├── datasets/
│   │   ├── jobs/
│   │   ├── models/
│   │   ├── monitoring/
│   │   ├── new-job/
│   │   ├── playground/
│   │   └── settings/
│   ├── components/        # React 컴포넌트
│   ├── electron/          # Electron 메인 프로세스
│   │   └── main.js
│   ├── lib/              # 유틸리티 함수
│   ├── scripts/          # 빌드 스크립트
│   │   ├── afterpack.js
│   │   ├── bundle-python.js
│   │   └── bundle-node.js
│   ├── package.json
│   └── next.config.ts
│
└── README.md
```

## 빌드 방법

### macOS (Apple Silicon)

```bash
cd frontend

# 의존성 설치
npm install

# DMG 빌드
npm run electron:build:mac:arm
```

빌드된 DMG 파일은 `frontend/dist/` 디렉토리에 생성됩니다.

### Windows

Windows에서 빌드하려면 [Windows 빌드 가이드](./WINDOWS_BUILD.md)를 참조하세요.

간단한 빌드 명령:

```powershell
cd frontend

# 의존성 설치
npm install

# Windows 인스톨러 빌드
npm run electron:build:win
```

빌드된 파일은 `frontend/dist/` 디렉토리에 생성됩니다:
- `FineTuning App Setup 1.0.0.exe` - NSIS 인스톨러
- `FineTuning App 1.0.0.exe` - Portable 버전

### GitHub Actions를 통한 자동 빌드

태그를 생성하면 자동으로 macOS와 Windows 빌드가 생성됩니다:

```bash
git tag v1.0.0
git push origin v1.0.0
```

빌드 완료 후 GitHub Releases 페이지에서 다운로드 가능합니다.

### 빌드 프로세스

1. **prebundle**: Python venv 및 Node.js 바이너리 번들링
2. **build**: Next.js 프로덕션 빌드
3. **electron-builder**: Electron 앱 패키징
4. **afterPack**: node_modules 복사
5. **DMG 생성**: 최종 설치 파일 생성

## 환경 설정

### Backend 포트 설정

- **개발 환경**: `http://localhost:8000`
- **프로덕션 (패키지된 앱)**: `http://localhost:8001`

### Frontend 포트 설정

- **개발 환경**: `http://localhost:3001`
- **프로덕션 (패키지된 앱)**: `http://localhost:3002`

## 문제 해결

### 앱이 실행되지 않는 경우

1. macOS 보안 설정 확인:
   ```
   시스템 설정 > 개인정보 보호 및 보안 > 보안성
   ```
   "확인되지 않은 개발자" 경고가 나타나면 "실행" 버튼 클릭

2. 권한 문제 해결:
   ```bash
   xattr -cr /Applications/FineTuning\ App.app
   ```

### 모델 다운로드가 실패하는 경우

1. 인터넷 연결 확인
2. HuggingFace 모델 ID 확인
3. Gated 모델의 경우:
   - Settings에서 HuggingFace Token 입력
   - HuggingFace 웹사이트에서 모델 접근 권한 요청

### 학습이 시작되지 않는 경우

1. 시스템 메모리 확인 (최소 16GB 필요)
2. 데이터셋 형식 확인
3. Monitoring 탭에서 시스템 리소스 확인

## 기여 방법

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 라이선스

이 프로젝트는 ISC 라이선스 하에 배포됩니다.

## 지원

문제가 발생하거나 질문이 있으신 경우:

1. GitHub Issues에 문제 보고
2. 기존 이슈 검색하여 해결책 찾기
3. 문서 참고

## 변경 이력

### v1.0.0 (2025-11-01)

- ✅ 초기 릴리즈
- ✅ QLoRA 파인튜닝 기능
- ✅ 모델 다운로드 및 관리
- ✅ 데이터셋 업로드 및 관리
- ✅ 실시간 학습 모니터링
- ✅ 플레이그라운드 기능
- ✅ macOS Apple Silicon 지원
- ✅ Port 충돌 해결
- ✅ ThreadPoolExecutor를 통한 안정적인 모델 다운로드
- ✅ afterPack hook을 통한 node_modules 포함

## 감사의 말

이 프로젝트는 다음 오픈소스 프로젝트들을 기반으로 만들어졌습니다:

- [HuggingFace Transformers](https://github.com/huggingface/transformers)
- [PEFT](https://github.com/huggingface/peft)
- [FastAPI](https://github.com/tiangolo/fastapi)
- [Next.js](https://github.com/vercel/next.js)
- [Electron](https://github.com/electron/electron)

---

Made with ❤️ for the AI community
