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
    CODE_RUNNER: str
    JUDGE0_URL: str


    class Config:
        env_file = ".env"


settings = Settings()