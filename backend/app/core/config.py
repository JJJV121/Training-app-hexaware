from pydantic_settings import BaseSettings


class Settings(BaseSettings):

    DATABASE_URL: str

    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str

    MAIL_SERVER: str
    MAIL_PORT: int
    MAIL_USERNAME: str
    MAIL_PASSWORD: str
    MAIL_FROM: str

    # Code execution
    CODE_RUNNER: str = "judge0"
    JUDGE0_URL: str = "https://ce.judge0.com"

    class Config:
        env_file = ".env"


settings = Settings()