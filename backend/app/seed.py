from .database import Base, engine, SessionLocal
from .models import (
    User,
    Role,
    Department,
    Employee,
    Shift,
    ShiftCode,
    Holiday,
)
from .auth import pwd
from datetime import date


# Create database tables
Base.metadata.create_all(engine)

# Create database session
db = SessionLocal()


# --------------------------------------------------
# Create Departments
# --------------------------------------------------

if not db.query(Department).count():

    departments = [
        "IT",
        "HR",
        "Finance",
        "Operations",
    ]

    for department_name in departments:
        db.add(
            Department(
                name=department_name
            )
        )

    db.commit()


# Get default department
default_department = (
    db.query(Department)
    .filter_by(name="IT")
    .first()
)


# --------------------------------------------------
# Create Employees
# --------------------------------------------------

if not db.query(Employee).count():

    for i in range(30):
        db.add(
            Employee(
                code=f"EMP-{i+1:02}",
                name=f"Employee {i+1:02}",
                department_id=default_department.id,
                active=True,
            )
        )

    db.commit()


# Get first employee
first_employee = db.query(Employee).first()


# --------------------------------------------------
# Create / Reset Users
# --------------------------------------------------

# Admin user
admin_user = (
    db.query(User)
    .filter_by(username="admin")
    .first()
)

if admin_user:
    admin_user.password_hash = pwd.hash("admin123")
    admin_user.role = Role.ADMIN
    admin_user.employee_id = first_employee.id
else:
    db.add(
        User(
            username="admin",
            password_hash=pwd.hash("admin123"),
            role=Role.ADMIN,
            employee_id=first_employee.id,
        )
    )


# Manager user
manager_user = (
    db.query(User)
    .filter_by(username="manager")
    .first()
)

if manager_user:
    manager_user.password_hash = pwd.hash("manager123")
    manager_user.role = Role.MANAGER
    manager_user.employee_id = first_employee.id
else:
    db.add(
        User(
            username="manager",
            password_hash=pwd.hash("manager123"),
            role=Role.MANAGER,
            employee_id=first_employee.id,
        )
    )


# Employee user
employee_user = (
    db.query(User)
    .filter_by(username="employee")
    .first()
)

if employee_user:
    employee_user.password_hash = pwd.hash("employee123")
    employee_user.role = Role.EMPLOYEE
    employee_user.employee_id = first_employee.id
else:
    db.add(
        User(
            username="employee",
            password_hash=pwd.hash("employee123"),
            role=Role.EMPLOYEE,
            employee_id=first_employee.id,
        )
    )


db.commit()


# --------------------------------------------------
# Create Shifts
# --------------------------------------------------

if not db.query(Shift).count():

    db.add_all(
        [
            Shift(
                code=ShiftCode.M,
                start_time="07:00",
                end_time="15:00",
            ),
            Shift(
                code=ShiftCode.G,
                start_time="09:00",
                end_time="18:00",
            ),
            Shift(
                code=ShiftCode.E,
                start_time="15:00",
                end_time="23:00",
            ),
            Shift(
                code=ShiftCode.N,
                start_time="23:00",
                end_time="07:00",
            ),
        ]
    )

    db.commit()


# --------------------------------------------------
# Create Holidays
# --------------------------------------------------

if not db.query(Holiday).count():

    holidays = [
        ("2026-01-01", "New Year's Day"),
        ("2026-01-15", "Pongal"),
        ("2026-01-26", "Republic Day"),
        ("2026-03-21", "Ramzan"),
        ("2026-04-03", "Good Friday"),
        ("2026-04-14", "Tamil New Year's Day"),
        ("2026-05-01", "May Day"),
        ("2026-08-15", "Independence Day"),
        ("2026-09-04", "Krishna Jayanthi"),
        ("2026-09-14", "Vinayaga Chaturthi"),
        ("2026-10-02", "Gandhi Jayanthi"),
        ("2026-10-19", "Ayudha Pooja"),
        ("2026-11-08", "Diwali"),
        ("2026-12-25", "Christmas"),
    ]

    for holiday_date, holiday_name in holidays:
        db.add(
            Holiday(
                date=date.fromisoformat(holiday_date),
                name=holiday_name,
            )
        )

    db.commit()


# Close database
db.close()

print("Seed complete")