from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import models, download, hardware, jobs, datasets, playground

app = FastAPI(
    title="SLM Fine-tuning API",
    description="Backend API for QLoRA-based Small Language Model Fine-tuning Platform",
    version="1.0.0"
)

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001", "http://localhost:3002"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 라우터 등록
app.include_router(models.router, prefix="/api/models", tags=["models"])
app.include_router(download.router, prefix="/api/download", tags=["download"])
app.include_router(hardware.router, prefix="/api/hardware", tags=["hardware"])
app.include_router(jobs.router, prefix="/api/jobs", tags=["jobs"])
app.include_router(datasets.router, prefix="/api/datasets", tags=["datasets"])
app.include_router(playground.router, prefix="/api/playground", tags=["playground"])

@app.get("/")
async def root():
    return {"message": "SLM Fine-tuning API", "version": "1.0.0"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}
