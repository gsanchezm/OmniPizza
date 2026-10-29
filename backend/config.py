from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    app_name: str = "OmniPizza QA Platform"
    app_version: str = "1.0.0"
    environment: str = "production"

    # Build provenance — Render injects RENDER_GIT_COMMIT at build/runtime for
    # git-deployed services; BaseSettings maps the env var to this field
    # automatically. Empty when running outside Render (local, docker).
    # Exposed by GET /api/version (routers/meta.py) so research campaigns can
    # record exactly which backend build they exercised.
    render_git_commit: str = ""
    
    # Auth
    secret_key: str = "omnipizza-super-secret-key-for-testing-only"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    
    # CORS
    cors_origins: list = ["*"]
    
    class Config:
        env_file = ".env"

settings = Settings()
