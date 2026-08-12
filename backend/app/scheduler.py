from datetime import date,timedelta
from ortools.sat.python import cp_model
from .models import ShiftCode
WORK=[ShiftCode.M,ShiftCode.G,ShiftCode.E,ShiftCode.N]
def required(d,holiday): return {ShiftCode.M:1,ShiftCode.G:1 if holiday or d.weekday()>4 else 3,ShiftCode.E:1 if holiday or d.weekday()>4 else 2,ShiftCode.N:2}
def build(employees,days,leave_dates,holidays):
 m=cp_model.CpModel(); x={(e.id,d,s):m.NewBoolVar(f'x_{e.id}_{d}_{s}') for e in employees for d in days for s in WORK}
 for e in employees:
  for d in days:
   if (e.id,d) in leave_dates:
    for s in WORK:m.Add(x[e.id,d,s]==0)
   else:m.Add(sum(x[e.id,d,s] for s in WORK)<=1)
 for d in days:
  req=required(d,d in holidays)
  for s,n in req.items():m.Add(sum(x[e.id,d,s] for e in employees)==n)
 for e in employees:
  for i,d in enumerate(days):
   if i+1<len(days): m.Add(x[e.id,d,ShiftCode.N]+sum(x[e.id,days[i+1],s] for s in WORK)<=1+x[e.id,days[i+1],ShiftCode.N])
   if i+3<len(days):m.Add(sum(x[e.id,days[i+j],ShiftCode.N] for j in range(4))<=3)
  for start in range(0,len(days)-6,7):m.Add(sum(x[e.id,days[i],s] for i in range(start,start+7) for s in WORK)<=5)
 totals=[]
 for e in employees:
  for s in [ShiftCode.M,ShiftCode.E,ShiftCode.N]: totals.append(sum(x[e.id,d,s] for d in days))
 hi=m.NewIntVar(0,len(days),'hi');lo=m.NewIntVar(0,len(days),'lo')
 for t in totals:m.Add(t<=hi);m.Add(t>=lo)
 m.Minimize(hi-lo); solver=cp_model.CpSolver();solver.parameters.max_time_in_seconds=30
 if solver.Solve(m) not in (cp_model.OPTIMAL,cp_model.FEASIBLE):raise ValueError('No feasible roster for the selected month')
 return [(d,e.id,next((s for s in WORK if solver.Value(x[e.id,d,s])),ShiftCode.O)) for d in days for e in employees]
