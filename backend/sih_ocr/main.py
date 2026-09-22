from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

from sih_ocr.config import settings
from sih_ocr.routers.documents import router as documents_router
from sih_ocr.routers.health import router as health_router

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Multilingual Medical Document Digitization and Summarization REST API",
    docs_url="/docs",
    redoc_url="/redoc",
)

# Enable CORS for decoupled frontends (React, Vue, Vite, Next.js, mobile apps, etc.)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS if settings.CORS_ORIGINS else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers first (so they take precedence over static files)
app.include_router(health_router)
app.include_router(documents_router)

# Optional static frontend serving (active only when frontend directory is present)
frontend_dir = settings.FRONTEND_PATH
index_file = frontend_dir / "index.html"

if frontend_dir.exists() and frontend_dir.is_dir():
    # Backward-compatible mount for /assets
    app.mount("/assets", StaticFiles(directory=str(frontend_dir)), name="assets")

    @app.get("/dashboard", include_in_schema=False)
    @app.get("/", include_in_schema=False)
    def serve_dashboard():
        if index_file.exists():
            return FileResponse(
                index_file,
                headers={"Cache-Control": "no-store, no-cache, must-revalidate"},
            )
        return JSONResponse(
            status_code=200,
            content={"message": "Medical Document Digitizer API is running. Visit /docs for Swagger UI."},
        )

    # Root mount to serve styles.css, app.js, and other static assets directly
    app.mount("/", StaticFiles(directory=str(frontend_dir), html=True), name="static-root")
else:
    @app.get("/", include_in_schema=False)
    def root():
        return JSONResponse(
            status_code=200,
            content={"message": "Medical Document Digitizer API is running. Visit /docs for Swagger UI."},
        )
