# Product Requirements Document (PRD)

## SLM QLoRA Fine-tuning Web Platform

---

## 1. 프로젝트 개요

### 1.1 목적
제한적인 컴퓨터 메모리 환경에서도 Small Language Model(SLM)을 효율적으로 파인튜닝할 수 있는 웹 기반 플랫폼 개발

### 1.2 배경
- 일반 사용자들이 고가의 GPU 없이도 LLM 파인튜닝을 경험할 수 있도록 지원
- QLoRA(Quantized Low-Rank Adaptation) 기술을 활용하여 메모리 사용량 최소화
- 웹 인터페이스를 통한 직관적인 파인튜닝 경험 제공

### 1.3 대상 사용자
- AI/ML 연구자 및 학생
- 리소스가 제한적인 개인 개발자
- SLM 파인튜닝을 처음 시도하는 초보자

---

## 2. 핵심 기능

### 2.1 모델 관리
- **모델 선택**
  - 사전 학습된 SLM 모델 목록 제공 (예: Phi-3, Gemma-2B, TinyLlama, Qwen-1.8B 등)
  - Hugging Face Hub 연동을 통한 모델 다운로드
  - 모델 메타데이터 표시 (크기, 파라미터 수, 메모리 요구사항)

### 2.2 데이터셋 관리
- **데이터셋 업로드**
  - JSON, JSONL, CSV, TXT 형식 지원
  - 웹 UI를 통한 드래그 앤 드롭 업로드
  - 샘플 데이터셋 제공

- **데이터 전처리**
  - 데이터 포맷 검증
  - 프롬프트 템플릿 설정 (Instruction, Input, Output)
  - 데이터 통계 및 미리보기

### 2.3 QLoRA 설정
- **양자화 설정**
  - 4-bit/8-bit 양자화 옵션
  - Quantization type (NF4, FP4)
  - Double quantization 옵션

- **LoRA 파라미터**
  - Rank (r): 4, 8, 16, 32, 64
  - Alpha 값 설정
  - Target modules 선택 (q_proj, v_proj, k_proj, o_proj 등)
  - Dropout rate

### 2.4 학습 설정
- **하이퍼파라미터**
  - Learning rate
  - Batch size (gradient accumulation 지원)
  - Number of epochs
  - Warmup steps
  - Weight decay
  - Max sequence length

- **학습 전략**
  - Gradient checkpointing
  - Mixed precision training (FP16/BF16)
  - Optimizer 선택 (AdamW, SGD 등)

### 2.5 모니터링 및 로깅
- **실시간 모니터링**
  - 학습 진행률 표시
  - Loss 그래프 (Training/Validation)
  - GPU/CPU 메모리 사용량
  - 예상 완료 시간

- **로그 관리**
  - 학습 로그 실시간 스트리밍
  - 체크포인트 저장 및 관리
  - TensorBoard 연동

### 2.6 모델 평가 및 테스트
- **평가 메트릭**
  - Perplexity
  - Custom evaluation metrics

- **인터랙티브 테스트**
  - 파인튜닝된 모델 즉시 테스트
  - 프롬프트 입력 및 응답 확인
  - Before/After 비교

### 2.7 모델 배포
- **Export 옵션**
  - LoRA 어댑터만 저장
  - Merged model 저장
  - GGUF 포맷 변환 (추후 지원)

- **다운로드**
  - 파인튜닝된 모델 다운로드
  - Hugging Face Hub 업로드 기능

---

## 3. 기술 스택

### 3.1 Frontend
- **Framework**: React.js / Next.js
- **UI Library**: Material-UI / Tailwind CSS
- **State Management**: Redux / Zustand
- **Charting**: Chart.js / Recharts
- **File Upload**: React Dropzone

### 3.2 Backend
- **Framework**: FastAPI (Python)
- **Task Queue**: Celery + Redis
- **WebSocket**: Socket.IO / FastAPI WebSocket
- **Database**: PostgreSQL (메타데이터), Redis (캐싱)

### 3.3 ML/AI Stack
- **Core Libraries**
  - Transformers (Hugging Face)
  - PEFT (Parameter-Efficient Fine-Tuning)
  - bitsandbytes (양자화)
  - accelerate
  - torch / CUDA

### 3.4 Infrastructure
- **Containerization**: Docker
- **Orchestration**: Docker Compose / Kubernetes (선택)
- **Storage**: Local file system / S3-compatible storage
- **Monitoring**: Prometheus + Grafana (선택)

---

## 4. 시스템 아키텍처

### 4.1 구조
```
┌─────────────┐
│   Browser   │
│  (React)    │
└──────┬──────┘
       │ HTTP/WebSocket
┌──────▼──────────────────┐
│   API Gateway           │
│   (FastAPI)             │
└──────┬──────────────────┘
       │
   ┌───┴────┬────────┐
   │        │        │
┌──▼──┐ ┌──▼──┐  ┌──▼────┐
│ DB  │ │Redis│  │ Celery│
└─────┘ └─────┘  │ Worker│
                 └───┬───┘
                     │
              ┌──────▼──────┐
              │  GPU Server │
              │  (Training) │
              └─────────────┘
```

### 4.2 데이터 플로우
1. 사용자가 모델, 데이터셋, 설정 선택
2. API 서버가 작업을 Celery Queue에 추가
3. Worker가 QLoRA 파인튜닝 실행
4. 진행 상황을 WebSocket으로 실시간 전송
5. 완료된 모델을 스토리지에 저장
6. 사용자에게 다운로드 링크 제공

---

## 5. 사용자 플로우

### 5.1 파인튜닝 프로세스
1. **로그인/회원가입** (선택)
2. **새 프로젝트 생성**
3. **모델 선택**
   - 사전 학습된 SLM 브라우징
   - 모델 선택 및 다운로드
4. **데이터셋 준비**
   - 데이터셋 업로드 또는 샘플 선택
   - 데이터 포맷 확인 및 전처리
5. **QLoRA 설정**
   - 양자화 옵션 선택
   - LoRA 파라미터 설정
6. **학습 설정**
   - 하이퍼파라미터 조정
   - 학습 시작
7. **모니터링**
   - 실시간 진행 상황 확인
   - 로그 및 메트릭 모니터링
8. **평가 및 테스트**
   - 파인튜닝된 모델 테스트
   - 성능 확인
9. **모델 저장/배포**
   - 모델 다운로드
   - Hugging Face Hub 업로드

---

## 6. 성능 및 제약사항

### 6.1 메모리 요구사항
- **최소 사양**
  - GPU: 4GB VRAM (QLoRA 4-bit)
  - RAM: 8GB
  - Storage: 20GB 여유 공간

- **권장 사양**
  - GPU: 8GB VRAM
  - RAM: 16GB
  - Storage: 50GB 여유 공간

### 6.2 성능 목표
- 데이터셋 업로드: < 5초 (10MB 기준)
- 모델 로딩: < 30초
- 학습 시작: < 1분
- UI 응답성: < 100ms

### 6.3 제약사항
- 동시 학습 세션: 1-5개 (서버 리소스에 따라)
- 최대 데이터셋 크기: 500MB
- 최대 모델 크기: 10B 파라미터
- 세션 타임아웃: 24시간

---

## 7. 보안 및 개인정보

### 7.1 데이터 보안
- 업로드된 데이터셋 암호화 저장
- 사용자별 데이터 격리
- 학습 완료 후 자동 데이터 삭제 옵션

### 7.2 접근 제어
- JWT 기반 인증
- API 요청 rate limiting
- CORS 설정

### 7.3 개인정보 보호
- 최소한의 사용자 정보 수집
- 데이터 처리 로그 비식별화
- GDPR 준수 (삭제 요청 지원)

---

## 8. 비기능 요구사항

### 8.1 확장성
- 수평적 확장 가능한 Worker 구조
- 캐싱을 통한 성능 최적화
- Load balancing 지원

### 8.2 가용성
- 99% uptime 목표
- 자동 재시작 메커니즘
- 에러 복구 및 체크포인트

### 8.3 사용성
- 직관적인 UI/UX
- 튜토리얼 및 도움말
- 반응형 디자인 (데스크톱 우선)

---

## 9. 개발 단계

### Phase 1: MVP (4주)
- [ ] 기본 웹 UI 구현
- [ ] 단일 모델 (예: TinyLlama) 지원
- [ ] JSON 형식 데이터셋 업로드
- [ ] 기본 QLoRA 파인튜닝
- [ ] 간단한 로그 출력

### Phase 2: 핵심 기능 (6주)
- [ ] 다중 모델 지원
- [ ] 다양한 데이터 포맷 지원
- [ ] 상세한 QLoRA/LoRA 설정
- [ ] 실시간 모니터링 대시보드
- [ ] 모델 평가 기능

### Phase 3: 고급 기능 (4주)
- [ ] 사용자 인증 시스템
- [ ] 프로젝트 관리 기능
- [ ] TensorBoard 통합
- [ ] Hugging Face Hub 연동
- [ ] 성능 최적화

### Phase 4: 배포 및 운영 (2주)
- [ ] Docker 컨테이너화
- [ ] 배포 자동화
- [ ] 모니터링 시스템
- [ ] 문서화

---

## 10. 성공 지표 (KPI)

### 10.1 기술적 지표
- 평균 파인튜닝 완료 시간: < 30분 (1000 샘플 기준)
- 메모리 사용량: < 6GB VRAM (4-bit QLoRA)
- 시스템 에러율: < 1%

### 10.2 사용자 지표
- 월간 활성 사용자 (MAU)
- 완료된 파인튜닝 세션 수
- 평균 세션 완료율: > 70%

---

## 11. 리스크 및 대응 방안

### 11.1 기술적 리스크
| 리스크 | 영향도 | 대응 방안 |
|--------|--------|-----------|
| GPU 리소스 부족 | 높음 | Queue 시스템, 우선순위 관리 |
| 모델 호환성 문제 | 중간 | 검증된 모델만 지원, 테스트 자동화 |
| 메모리 부족 오류 | 높음 | Dynamic batch size, gradient accumulation |

### 11.2 운영 리스크
| 리스크 | 영향도 | 대응 방안 |
|--------|--------|-----------|
| 서버 과부하 | 높음 | Rate limiting, Auto-scaling |
| 데이터 유실 | 중간 | 정기 백업, 체크포인트 저장 |
| 보안 침해 | 높음 | 정기 보안 감사, 취약점 패치 |

---

## 12. 참고 자료

### 12.1 관련 기술
- [QLoRA Paper](https://arxiv.org/abs/2305.14314)
- [PEFT Library](https://github.com/huggingface/peft)
- [bitsandbytes](https://github.com/TimDettmers/bitsandbytes)

### 12.2 유사 프로젝트
- Google Colab
- Hugging Face AutoTrain
- AWS SageMaker

---

## 13. 부록

### 13.1 용어 정의
- **QLoRA**: Quantized Low-Rank Adaptation, 양자화된 저순위 적응 기법
- **LoRA**: Low-Rank Adaptation, 대형 모델의 일부만 학습하는 효율적 파인튜닝 기법
- **SLM**: Small Language Model, 파라미터 수가 상대적으로 적은 언어 모델 (< 10B)
- **4-bit Quantization**: 모델 가중치를 4비트로 양자화하여 메모리 사용량 감소

### 13.2 데이터 포맷 예시
```json
{
  "instruction": "다음 문장을 영어로 번역하세요.",
  "input": "안녕하세요",
  "output": "Hello"
}
```

---

**문서 버전**: 1.0
**작성일**: 2025-10-29
**최종 수정일**: 2025-10-29
**작성자**: Product Team
