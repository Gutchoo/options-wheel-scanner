import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes.scanner import router as scanner_router


app = FastAPI(
    title="Options Scanner API",
    description="API for scanning options chains",
    version="1.0.0",
)

# Configure CORS - use environment variable or default to localhost
allowed_origins = os.environ.get(
    "ALLOWED_ORIGINS",
    "http://localhost:3000,http://127.0.0.1:3000"
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(scanner_router)


@app.get("/")
async def root():
    return {"message": "Options Scanner API", "docs": "/docs"}
