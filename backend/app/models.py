import enum

from datetime import date, datetime

from sqlalchemy import (
    String,
    Date,
    DateTime,
    ForeignKey,
    Enum,
    Boolean,
    Text,
    UniqueConstraint
)

from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base


# --------------------------------------------------
# ENUMS
# --------------------------------------------------

class Role(str, enum.Enum):
    ADMIN = "admin"
    MANAGER = "manager"
    EMPLOYEE = "employee"


class LeaveStatus(str, enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"


class ShiftCode(str, enum.Enum):
    M = "M"
    G = "G"
    E = "E"
    N = "N"
    O = "O"
    L = "L"


# --------------------------------------------------
# USER
# --------------------------------------------------

class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)

    username: Mapped[str] = mapped_column(
        String(80),
        unique=True
    )

    password_hash: Mapped[str] = mapped_column(
        String(255)
    )

    role: Mapped[Role] = mapped_column(
        Enum(Role)
    )

    employee_id: Mapped[int] = mapped_column(
        ForeignKey("employees.id")
    )

    employee = relationship(
        "Employee",
        foreign_keys=[employee_id]
    )


# --------------------------------------------------
# DEPARTMENT
# --------------------------------------------------

class Department(Base):
    __tablename__ = "departments"

    id: Mapped[int] = mapped_column(
        primary_key=True
    )

    name: Mapped[str] = mapped_column(
        String(100),
        unique=True
    )


# --------------------------------------------------
# EMPLOYEE
# --------------------------------------------------

class Employee(Base):
    __tablename__ = "employees"

    id: Mapped[int] = mapped_column(
        primary_key=True
    )

    code: Mapped[str] = mapped_column(
        String(40),
        unique=True
    )

    name: Mapped[str] = mapped_column(
        String(120)
    )

    department_id: Mapped[int] = mapped_column(
        ForeignKey("departments.id")
    )

    active: Mapped[bool] = mapped_column(
        Boolean,
        default=True
    )


# --------------------------------------------------
# SHIFT
# --------------------------------------------------

class Shift(Base):
    __tablename__ = "shifts"

    id: Mapped[int] = mapped_column(
        primary_key=True
    )

    code: Mapped[ShiftCode] = mapped_column(
        Enum(ShiftCode),
        unique=True
    )

    start_time: Mapped[str] = mapped_column(
        String(5)
    )

    end_time: Mapped[str] = mapped_column(
        String(5)
    )


# --------------------------------------------------
# HOLIDAY
# --------------------------------------------------

class Holiday(Base):
    __tablename__ = "holidays"

    id: Mapped[int] = mapped_column(
        primary_key=True
    )

    date: Mapped[date] = mapped_column(
        Date,
        unique=True
    )

    name: Mapped[str] = mapped_column(
        String(120)
    )


# --------------------------------------------------
# LEAVE REQUEST
# --------------------------------------------------

class LeaveRequest(Base):
    __tablename__ = "leave_requests"

    id: Mapped[int] = mapped_column(
        primary_key=True
    )

    employee_id: Mapped[int] = mapped_column(
        ForeignKey("employees.id")
    )

    start_date: Mapped[date] = mapped_column(
        Date
    )

    end_date: Mapped[date] = mapped_column(
        Date
    )

    reason: Mapped[str] = mapped_column(
        Text
    )

    status: Mapped[LeaveStatus] = mapped_column(
        Enum(LeaveStatus),
        default=LeaveStatus.PENDING
    )

    employee = relationship("Employee")


# --------------------------------------------------
# ROSTER
# --------------------------------------------------

class Roster(Base):
    __tablename__ = "rosters"

    id: Mapped[int] = mapped_column(
        primary_key=True
    )

    date: Mapped[date] = mapped_column(
        Date
    )

    employee_id: Mapped[int] = mapped_column(
        ForeignKey("employees.id")
    )

    shift: Mapped[ShiftCode] = mapped_column(
        Enum(ShiftCode)
    )

    employee = relationship("Employee")

    __table_args__ = (
        UniqueConstraint(
            "date",
            "employee_id"
        ),
    )