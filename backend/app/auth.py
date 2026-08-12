from datetime import datetime,timedelta,timezone
from fastapi import Depends,HTTPException,status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt,JWTError
from passlib.context import CryptContext
from sqlalchemy.orm import Session
from .database import get_db
from .models import User,Role
from .settings import settings
pwd=CryptContext(schemes=['bcrypt'],deprecated='auto'); oauth2=OAuth2PasswordBearer(tokenUrl='/api/auth/login')
def token_for(u): return jwt.encode({'sub':str(u.id),'role':u.role.value,'exp':datetime.now(timezone.utc)+timedelta(minutes=settings.access_token_minutes)},settings.jwt_secret,algorithm=settings.jwt_algorithm)
def current(token:str=Depends(oauth2),db:Session=Depends(get_db)):
 try: uid=int(jwt.decode(token,settings.jwt_secret,algorithms=[settings.jwt_algorithm])['sub'])
 except (JWTError,KeyError,ValueError): raise HTTPException(401,'Invalid token')
 u=db.get(User,uid)
 if not u: raise HTTPException(401,'User unavailable')
 return u
def allow(*roles):
 def check(u:User=Depends(current)):
  if u.role not in roles: raise HTTPException(status.HTTP_403_FORBIDDEN,'Insufficient role')
  return u
 return check
