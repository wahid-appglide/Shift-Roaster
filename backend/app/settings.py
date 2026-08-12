from pydantic_settings import BaseSettings,SettingsConfigDict
class Settings(BaseSettings):
 database_url:str='mysql+pymysql://roster:roster@localhost:3306/roster'; jwt_secret:str='dev-change-me'; jwt_algorithm:str='HS256'; access_token_minutes:int=480
 model_config=SettingsConfigDict(env_file='.env',extra='ignore')
settings=Settings()
