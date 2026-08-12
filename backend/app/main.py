from datetime import date,timedelta
from fastapi import FastAPI,Depends,HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel
from sqlalchemy import select,delete
from sqlalchemy.orm import Session
from .database import Base,engine,get_db
from .models import *
from .auth import pwd,token_for,current,allow
from .scheduler import build
app=FastAPI(title='Shift Roster API');app.add_middleware(CORSMiddleware,allow_origins=['http://localhost:5173'],allow_credentials=True,allow_methods=['*'],allow_headers=['*'])
class EmployeeIn(BaseModel): code:str;name:str;department_id:int|None=None;active:bool=True
class LeaveIn(BaseModel): start_date:date;end_date:date;reason:str
class GenerateIn(BaseModel): month:str; employee_ids:list[int]
class ChangeIn(BaseModel): employee_id:int;date:date;shift:ShiftCode
@app.on_event('startup')
def init(): Base.metadata.create_all(engine)
@app.post('/api/auth/login')
def login(f:OAuth2PasswordRequestForm=Depends(),db:Session=Depends(get_db)):
 u=db.scalar(select(User).where(User.username==f.username));
 if not u or not pwd.verify(f.password,u.password_hash):raise HTTPException(401,'Invalid credentials')
 return {'access_token':token_for(u),'token_type':'bearer','role':u.role.value}
@app.get('/api/employees')
def employees(db:Session=Depends(get_db),u=Depends(current)):return db.scalars(select(Employee)).all()
@app.post('/api/employees')
def add_employee(x:EmployeeIn,db:Session=Depends(get_db),u=Depends(allow(Role.ADMIN))): e=Employee(**x.model_dump());db.add(e);db.commit();db.refresh(e);return e
@app.get('/api/leaves')
def leaves(db:Session=Depends(get_db),u=Depends(current)): return db.scalars(select(LeaveRequest)).all()
@app.post('/api/leaves')
def request_leave(x:LeaveIn,db:Session=Depends(get_db),u=Depends(current)):
 if not u.employee_id:raise HTTPException(400,'Account has no employee mapping')
 l=LeaveRequest(employee_id=u.employee_id,**x.model_dump());db.add(l);db.commit();return l
@app.patch('/api/leaves/{id}/{status}')
def leave_decision(id:int,status:LeaveStatus,db:Session=Depends(get_db),u=Depends(allow(Role.ADMIN,Role.MANAGER))):l=db.get(LeaveRequest,id);l.status=status;db.commit();return l
@app.post('/api/rosters/generate')
def generate(x:GenerateIn,db:Session=Depends(get_db),u=Depends(allow(Role.ADMIN,Role.MANAGER))):
 y,m=map(int,x.month.split('-'));days=[];d=date(y,m,1)
 while d.month==m:days.append(d);d+=timedelta(days=1)
 emps=db.scalars(select(Employee).where(Employee.active==True,Employee.id.in_(x.employee_ids))).all()
 if len(emps)!=len(set(x.employee_ids)): raise HTTPException(400,'One or more selected employees are inactive or do not exist')
 if len(emps)<8: raise HTTPException(400,'Choose at least 8 employees to cover weekday shifts')
 hol=set(db.scalars(select(Holiday.date)).all());leaves={(l.employee_id,d) for l in db.scalars(select(LeaveRequest).where(LeaveRequest.status==LeaveStatus.APPROVED)).all() for d in days if l.start_date<=d<=l.end_date};db.execute(delete(Roster).where(Roster.date.in_(days)));db.add_all([Roster(date=d,employee_id=e,shift=s) for d,e,s in build(emps,days,leaves,hol)]);db.commit();return {'message':'Roster generated','days':len(days),'employees_selected':len(emps)}
@app.get('/api/rosters/{month}')
def get_roster(month:str,db:Session=Depends(get_db),u=Depends(current)):return db.scalars(select(Roster).where(Roster.date.like(month+'%'))).all()
@app.put('/api/rosters/change')
def change(x:ChangeIn,db:Session=Depends(get_db),u=Depends(allow(Role.ADMIN,Role.MANAGER))):r=db.scalar(select(Roster).where(Roster.date==x.date,Roster.employee_id==x.employee_id));r.shift=x.shift;db.commit();return r
