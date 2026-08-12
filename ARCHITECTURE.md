# Implemented scope (Members 1–4)

- `backend/app/main.py`: FastAPI REST API, JWT login, employee and leave services, role authorization, roster APIs.
- `backend/app/models.py`: SQLAlchemy MySQL schema for users, departments, employees, shifts, holidays, leave requests, and rosters.
- `backend/app/scheduler.py`: Google OR-Tools CP-SAT scheduling constraints and fair special-shift balancing.
- `frontend/`: React + TypeScript + Material UI + Axios + FullCalendar application.

Member 5 scope (reports, SMTP notifications, Docker, Nginx, and deployment) is intentionally excluded.
