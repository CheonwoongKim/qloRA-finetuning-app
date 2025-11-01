# Windows 빌드 가이드

QLoRA Fine-tuning 앱을 Windows에서 빌드하기 위한 상세 가이드입니다.

## 시스템 요구사항

### 최소 사양
- **OS**: Windows 10 (64-bit) 이상
- **RAM**: 16GB 이상
- **저장공간**: 30GB 이상 여유 공간
- **Node.js**: 20.x 이상
- **Python**: 3.12

### 권장 사양
- **OS**: Windows 11 (64-bit)
- **RAM**: 32GB 이상
- **저장공간**: 50GB 이상 여유 공간
- **GPU**: NVIDIA GPU (CUDA 지원)

## 사전 준비

### 1. Node.js 설치

1. [Node.js 공식 웹사이트](https://nodejs.org/)에서 LTS 버전 다운로드
2. 설치 프로그램 실행 및 기본 옵션으로 설치
3. 설치 확인:
```powershell
node --version
npm --version
```

### 2. Python 설치

1. [Python 공식 웹사이트](https://www.python.org/downloads/)에서 Python 3.12 다운로드
2. 설치 시 **"Add Python to PATH"** 옵션 체크
3. 설치 확인:
```powershell
python --version
pip --version
```

### 3. Git 설치 (선택사항)

1. [Git for Windows](https://git-scm.com/download/win) 다운로드
2. 기본 옵션으로 설치

### 4. Visual Studio Build Tools (선택사항)

일부 Python 패키지 컴파일을 위해 필요할 수 있습니다:

1. [Visual Studio Build Tools](https://visualstudio.microsoft.com/downloads/) 다운로드
2. "Desktop development with C++" 워크로드 선택하여 설치

## 빌드 프로세스

### 1. 저장소 클론

```powershell
git clone <repository-url>
cd finetuning
```

또는 ZIP 파일로 다운로드하여 압축 해제

### 2. Frontend 의존성 설치

```powershell
cd frontend
npm install
```

### 3. Windows 인스톨러 빌드

```powershell
npm run electron:build:win
```

이 명령은 다음 작업을 자동으로 수행합니다:
1. Python 가상환경 생성 및 의존성 설치
2. Node.js 바이너리 번들링
3. Next.js 프로덕션 빌드
4. Electron 앱 패키징
5. NSIS 인스톨러 및 Portable 버전 생성

### 4. 빌드 결과물

빌드가 완료되면 `frontend/dist/` 디렉토리에 다음 파일들이 생성됩니다:

- `FineTuning App Setup 1.0.0.exe` - NSIS 인스톨러
- `FineTuning App 1.0.0.exe` - Portable 실행 파일

## 문제 해결

### Python 패키지 설치 실패

**증상**: `pip install` 중 컴파일 에러

**해결책**:
1. Visual Studio Build Tools 설치 (위의 4번 항목 참조)
2. 또는 미리 컴파일된 wheel 파일 사용:
```powershell
pip install torch --index-url https://download.pytorch.org/whl/cu118
```

### 메모리 부족 에러

**증상**: 빌드 중 "JavaScript heap out of memory" 에러

**해결책**:
```powershell
$env:NODE_OPTIONS="--max-old-space-size=8192"
npm run electron:build:win
```

### 긴 경로명 문제

**증상**: `ENAMETOOLONG` 에러

**해결책**: Windows 긴 경로명 지원 활성화
1. 관리자 권한으로 PowerShell 실행
2. 다음 명령 실행:
```powershell
New-ItemProperty -Path "HKLM:\SYSTEM\CurrentControlSet\Control\FileSystem" -Name "LongPathsEnabled" -Value 1 -PropertyType DWORD -Force
```
3. 시스템 재부팅

### Python 버전 충돌

**증상**: 여러 Python 버전이 설치되어 있어 잘못된 버전 사용

**해결책**:
1. 환경 변수에서 Python 3.12 경로 확인
2. 또는 명시적으로 Python 경로 지정:
```powershell
$env:PYTHON="C:\Python312\python.exe"
npm run electron:build:win
```

## GitHub Actions를 통한 자동 빌드

로컬 빌드 대신 GitHub Actions를 사용하여 자동으로 빌드할 수 있습니다:

### 1. 저장소에 코드 푸시

```powershell
git add .
git commit -m "Prepare for Windows build"
git push origin main
```

### 2. 릴리즈 태그 생성

```powershell
git tag v1.0.0
git push origin v1.0.0
```

### 3. GitHub Actions 실행 확인

1. GitHub 저장소 페이지로 이동
2. "Actions" 탭 클릭
3. "Build and Release" 워크플로우 확인
4. 빌드 완료 후 "Releases" 페이지에서 다운로드

## 개발 모드 실행 (Windows)

빌드하지 않고 개발 모드로 실행하려면:

### Backend 실행

```powershell
cd backend
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### Frontend 실행

새 PowerShell 창에서:

```powershell
cd frontend
npm install
npm run electron:dev
```

## 빌드 옵션

### NSIS만 빌드

```powershell
npx electron-builder --win nsis
```

### Portable만 빌드

```powershell
npx electron-builder --win portable
```

### 32-bit 버전 빌드 (필요한 경우)

package.json의 build 설정 수정:
```json
"win": {
  "target": [
    {
      "target": "nsis",
      "arch": ["ia32"]
    }
  ]
}
```

## 배포

### 인스톨러 서명 (선택사항)

프로덕션 배포 시 코드 서명 권장:

1. 코드 서명 인증서 구입
2. `package.json`에 서명 설정 추가:
```json
"win": {
  "certificateFile": "path/to/cert.pfx",
  "certificatePassword": "password"
}
```

### Microsoft Store 배포 (선택사항)

MSIX 패키지 생성:
```powershell
npx electron-builder --win appx
```

## 추가 리소스

- [Electron Builder Documentation](https://www.electron.build/)
- [Python Windows Installation Guide](https://docs.python.org/3/using/windows.html)
- [Node.js Windows Guidelines](https://nodejs.org/en/download/package-manager/)

## 지원

문제가 발생하면:
1. 이 가이드의 "문제 해결" 섹션 확인
2. GitHub Issues에서 유사한 문제 검색
3. 새로운 이슈 생성 시 다음 정보 포함:
   - Windows 버전
   - Node.js 버전
   - Python 버전
   - 전체 에러 메시지

---

Last updated: 2025-11-01
