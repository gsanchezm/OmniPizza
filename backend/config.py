from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    app_name: str = "OmniPizza QA Platform"
    app_version: str = "1.0.0"
    environment: str = "production"
    
    # Auth
    secret_key: str = "omnipizza-super-secret-key-for-testing-only"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    
    # CORS
    cors_origins: list = ["*"]
    
    class Config:
        env_file = ".env"

settings = Settings()
