import React, {
    useEffect,
    useMemo,
    useState,
} from "react";

import { createRoot } from "react-dom/client";

import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";

import { api } from "./api";
import "./styles.css";

type Employee = {
    id: string | number;
    code: string;
    name?: string;
    active?: boolean;
};

type RosterRow = {
    date: string;
    employee_id: string | number;
    shift: string;
};

type LeaveRequest = {
    id: string | number;
    employee_id?: string | number;
    employeeId?: string | number;
    start_date?: string;
    startDate?: string;
    end_date?: string;
    endDate?: string;
    reason?: string;
    status: string;
};

type ShiftRequest = {
    id: string;
    employeeId: string | number;
    date: string;
    currentShift: string;
    requestedShift: string;
    reason: string;
    status: string;
};

type User = {
    username: string;
    role: "admin" | "manager" | "employee";
    employeeId?: string | number;
};

const SHIFT_NAMES: Record<string, string> = {
    M: "Morning",
    G: "General",
    E: "Evening",
    N: "Night",
    O: "Weekly Off",
    L: "Approved Leave",
};

function shiftName(shift: string) {
    return SHIFT_NAMES[shift] || shift;
}

function getToken() {
    return localStorage.getItem("token");
}

function decodeJwtPayload(token: string): any {
    try {
        const part = token.split(".")[1];
        if (!part) return {};

        const normalized = part
            .replace(/-/g, "+")
            .replace(/_/g, "/");

        const padded =
            normalized +
            "=".repeat(
                (4 - (normalized.length % 4)) % 4
            );

        return JSON.parse(
            atob(padded)
        );
    } catch {
        return {};
    }
}

function getStoredUser(): User | null {
    const stored =
        localStorage.getItem("user");

    if (stored) {
        try {
            return JSON.parse(stored);
        } catch {
            localStorage.removeItem("user");
        }
    }

    const token = getToken();

    if (!token) return null;

    const payload =
        decodeJwtPayload(token);

    const role = String(
        payload.role ||
            payload.user_role ||
            payload.type ||
            "employee"
    ).toLowerCase();

    const normalizedRole =
        role === "admin" ||
        role === "manager"
            ? role
            : "employee";

    return {
        username:
            payload.sub ||
            payload.username ||
            "User",
        role: normalizedRole,
        employeeId:
            payload.employee_id ??
            payload.employeeId ??
            payload.employee?.id,
    };
}

function Login() {
    const [username, setUsername] =
        useState("admin");

    const [password, setPassword] =
        useState("admin123");

    const [error, setError] =
        useState("");

    const [loading, setLoading] =
        useState(false);

    const login = async () => {
        try {
            setLoading(true);
            setError("");

            /*
             * FastAPI OAuth2 login expects
             * application/x-www-form-urlencoded,
             * not JSON.
             */
            const formData =
                new URLSearchParams();

            formData.append(
                "username",
                username.trim()
            );

            formData.append(
                "password",
                password
            );

            const response =
                await api.post(
                    "/auth/login",
                    formData,
                    {
                        headers: {
                            "Content-Type":
                                "application/x-www-form-urlencoded",
                        },
                    }
                );

            const token =
                response.data.access_token;

            if (!token) {
                throw new Error(
                    "Backend did not return access_token."
                );
            }

            localStorage.setItem(
                "token",
                token
            );

            const payload =
                decodeJwtPayload(token);

            const roleValue =
                String(
                    response.data.role ||
                        response.data.user?.role ||
                        payload.role ||
                        payload.user_role ||
                        "employee"
                ).toLowerCase();

            const role =
                roleValue === "admin" ||
                roleValue === "manager"
                    ? roleValue
                    : "employee";

            const user: User = {
                username:
                    response.data.username ||
                    response.data.user?.username ||
                    payload.sub ||
                    username,
                role,
                employeeId:
                    response.data.employee_id ??
                    response.data.employeeId ??
                    response.data.user?.employee_id ??
                    payload.employee_id ??
                    payload.employeeId,
            };

            localStorage.setItem(
                "user",
                JSON.stringify(user)
            );

            window.location.href = "/";
        } catch (error: any) {
            console.error(
                "Login error:",
                error
            );

            const detail =
                error.response?.data?.detail;

            setError(
                Array.isArray(detail)
                    ? detail
                          .map(
                              (x: any) =>
                                  x.msg
                          )
                          .join(", ")
                    : detail ||
                      error.message ||
                      "Invalid username or password"
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page">
            <div className="login-card">
                <div className="brand">
                    <div className="brand-logo">
                        A
                    </div>

                    <div>
                        <div className="brand-title">
                            Appglide
                        </div>

                        <div className="brand-subtitle">
                            Shift Roster Management
                        </div>
                    </div>
                </div>

                <h1 className="login-title">
                    Welcome back
                </h1>

                <p className="login-description">
                    Sign in to manage your
                    workforce schedule.
                </p>

                {error && (
                    <div className="error">
                        {error}
                    </div>
                )}

                <div className="form-group">
                    <label>
                        Username
                    </label>

                    <input
                        className="input"
                        value={username}
                        onChange={(e) =>
                            setUsername(
                                e.target.value
                            )
                        }
                        autoComplete="username"
                    />
                </div>

                <div className="form-group">
                    <label>
                        Password
                    </label>

                    <input
                        className="input"
                        type="password"
                        value={password}
                        onChange={(e) =>
                            setPassword(
                                e.target.value
                            )
                        }
                        autoComplete="current-password"
                        onKeyDown={(e) => {
                            if (
                                e.key ===
                                "Enter"
                            ) {
                                login();
                            }
                        }}
                    />
                </div>

                <button
                    className="primary-btn"
                    onClick={login}
                    disabled={loading}
                >
                    {loading
                        ? "Signing in..."
                        : "Sign In"}
                </button>
            </div>
        </div>
    );
}

function Sidebar({
    page,
    setPage,
    role,
}: {
    page: string;
    setPage: (page: string) => void;
    role: string;
}) {
    const items =
        role === "employee"
            ? [
                  [
                      "dashboard",
                      "Dashboard",
                  ],
                  [
                      "schedule",
                      "My Schedule",
                  ],
                  [
                      "leave",
                      "Leave Request",
                  ],
                  [
                      "shift",
                      "Shift Change",
                  ],
              ]
            : [
                  [
                      "dashboard",
                      "Dashboard",
                  ],
                  ["roster", "Roster"],
                  [
                      "leave",
                      "Leave Requests",
                  ],
                  [
                      "shift",
                      "Shift Changes",
                  ],
                  ...(role === "admin"
                      ? [
                            [
                                "employees",
                                "Employees",
                            ],
                        ]
                      : []),
              ];

    return (
        <aside className="sidebar">
            <div className="brand">
                <div className="brand-logo">
                    A
                </div>

                <div>
                    <div className="brand-title">
                        Appglide
                    </div>

                    <div className="brand-subtitle">
                        Shift Roster
                    </div>
                </div>
            </div>

            <div className="sidebar-nav">
                {items.map(
                    ([value, label]) => (
                        <button
                            key={value}
                            className={`nav-item ${
                                page === value
                                    ? "active"
                                    : ""
                            }`}
                            onClick={() =>
                                setPage(
                                    value
                                )
                            }
                        >
                            {label}
                        </button>
                    )
                )}
            </div>
        </aside>
    );
}

function Layout({
    children,
    page,
    setPage,
    user,
}: {
    children: React.ReactNode;
    page: string;
    setPage: (page: string) => void;
    user: User;
}) {
    const logout = () => {
        localStorage.removeItem(
            "token"
        );

        localStorage.removeItem(
            "user"
        );

        window.location.href = "/";
    };

    return (
        <div className="dashboard-layout">
            <Sidebar
                page={page}
                setPage={setPage}
                role={user.role}
            />

            <main className="main-area">
                <header className="topbar">
                    <div>
                        <strong>
                            AppGlide Shift
                            Roster
                        </strong>
                    </div>

                    <div className="user-info">
                        <div className="avatar">
                            {user.username
                                .charAt(0)
                                .toUpperCase()}
                        </div>

                        <div>
                            <strong>
                                {
                                    user.username
                                }
                            </strong>

                            <div
                                style={{
                                    color:
                                        "#64748b",
                                    fontSize:
                                        12,
                                }}
                            >
                                {user.role}
                            </div>
                        </div>

                        <button
                            className="logout-btn"
                            onClick={
                                logout
                            }
                        >
                            Logout
                        </button>
                    </div>
                </header>

                {children}
            </main>
        </div>
    );
}

function AdminDashboard({
    employees,
    leaves,
    shiftRequests,
}: {
    employees: Employee[];
    leaves: LeaveRequest[];
    shiftRequests: ShiftRequest[];
}) {
    return (
        <div className="content">
            <h1 className="page-title">
                Admin Dashboard
            </h1>

            <p className="page-subtitle">
                Complete workforce
                administration
            </p>

            <div className="cards">
                <div className="card stat-card">
                    <div className="stat-label">
                        Employees
                    </div>

                    <div className="stat-value">
                        {
                            employees.length
                        }
                    </div>

                    <div className="stat-icon icon-purple">
                        👥
                    </div>
                </div>

                <div className="card stat-card">
                    <div className="stat-label">
                        Pending Leaves
                    </div>

                    <div className="stat-value">
                        {
                            leaves.filter(
                                (x) =>
                                    x.status ===
                                    "pending"
                            ).length
                        }
                    </div>

                    <div className="stat-icon icon-orange">
                        🏖️
                    </div>
                </div>

                <div className="card stat-card">
                    <div className="stat-label">
                        Shift Requests
                    </div>

                    <div className="stat-value">
                        {
                            shiftRequests.filter(
                                (x) =>
                                    x.status ===
                                    "pending"
                            ).length
                        }
                    </div>

                    <div className="stat-icon icon-blue">
                        🔄
                    </div>
                </div>

                <div className="card stat-card">
                    <div className="stat-label">
                        System
                    </div>

                    <div className="stat-value">
                        Active
                    </div>

                    <div className="stat-icon icon-green">
                        ✓
                    </div>
                </div>
            </div>

            <div className="section">
                <div className="card">
                    <div className="section-title">
                        Admin Controls
                    </div>

                    <p>
                        Generate rosters, review
                        leave requests, review
                        shift changes, and manage
                        employees.
                    </p>
                </div>
            </div>
        </div>
    );
}

function ManagerDashboard({
    leaves,
    shiftRequests,
}: {
    leaves: LeaveRequest[];
    shiftRequests: ShiftRequest[];
}) {
    return (
        <div className="content">
            <h1 className="page-title">
                Manager Dashboard
            </h1>

            <p className="page-subtitle">
                Manage team schedules and
                employee requests
            </p>

            <div className="cards">
                <div className="card stat-card">
                    <div className="stat-label">
                        Pending Leaves
                    </div>

                    <div className="stat-value">
                        {
                            leaves.filter(
                                (x) =>
                                    x.status ===
                                    "pending"
                            ).length
                        }
                    </div>
                </div>

                <div className="card stat-card">
                    <div className="stat-label">
                        Shift Changes
                    </div>

                    <div className="stat-value">
                        {
                            shiftRequests.filter(
                                (x) =>
                                    x.status ===
                                    "pending"
                            ).length
                        }
                    </div>
                </div>
            </div>

            <div className="section">
                <div className="card">
                    <div className="section-title">
                        Manager Controls
                    </div>

                    <p>
                        Generate and review
                        monthly rosters and
                        approve employee leave
                        requests.
                    </p>
                </div>
            </div>
        </div>
    );
}

function EmployeeDashboard({
    user,
    rows,
    leaves,
    shiftRequests,
}: {
    user: User;
    rows: RosterRow[];
    leaves: LeaveRequest[];
    shiftRequests: ShiftRequest[];
}) {
    const today =
        new Date()
            .toISOString()
            .slice(0, 10);

    const employeeId =
        String(user.employeeId ?? "");

    const todayAssignment =
        rows.find(
            (row) =>
                row.date === today &&
                String(
                    row.employee_id
                ) === employeeId
        );

    const myLeaves =
        leaves.filter(
            (leave) =>
                String(
                    leave.employee_id ??
                        leave.employeeId
                ) === employeeId
        );

    const myShiftRequests =
        shiftRequests.filter(
            (request) =>
                String(
                    request.employeeId
                ) === employeeId
        );

    return (
        <div className="content">
            <h1 className="page-title">
                Employee Dashboard
            </h1>

            <p className="page-subtitle">
                Your schedule and requests
            </p>

            <div className="section">
                <div className="shift-grid">
                    <div className="shift-card shift-general">
                        <div className="shift-name">
                            Today's Shift
                        </div>

                        <div className="shift-count">
                            {todayAssignment
                                ? shiftName(
                                      todayAssignment.shift
                                  )
                                : "Not Assigned"}
                        </div>

                        <div>
                            {today}
                        </div>
                    </div>
                </div>
            </div>

            <div className="section">
                <div className="card">
                    <div className="section-title">
                        My Leave Requests
                    </div>

                    {myLeaves.length ===
                    0 ? (
                        <p>
                            No leave requests.
                        </p>
                    ) : (
                        myLeaves.map(
                            (leave) => (
                                <div
                                    className="request-item"
                                    key={
                                        leave.id
                                    }
                                >
                                    <div>
                                        <strong>
                                            Leave
                                        </strong>

                                        <div>
                                            {
                                                leave.start_date ??
                                                    leave.startDate
                                            }{" "}
                                            →{" "}
                                            {
                                                leave.end_date ??
                                                    leave.endDate
                                            }
                                        </div>
                                    </div>

                                    <span
                                        className={`badge badge-${leave.status}`}
                                    >
                                        {
                                            leave.status
                                        }
                                    </span>
                                </div>
                            )
                        )
                    )}
                </div>
            </div>

            <div className="section">
                <div className="card">
                    <div className="section-title">
                        My Shift Change Requests
                    </div>

                    {myShiftRequests.length ===
                    0 ? (
                        <p>
                            No shift change
                            requests.
                        </p>
                    ) : (
                        myShiftRequests.map(
                            (request) => (
                                <div
                                    className="request-item"
                                    key={
                                        request.id
                                    }
                                >
                                    <div>
                                        <strong>
                                            {
                                                request.date
                                            }
                                        </strong>

                                        <div>
                                            {
                                                request.currentShift
                                            }{" "}
                                            →{" "}
                                            {
                                                request.requestedShift
                                            }
                                        </div>
                                    </div>

                                    <span
                                        className={`badge badge-${request.status}`}
                                    >
                                        {
                                            request.status
                                        }
                                    </span>
                                </div>
                            )
                        )
                    )}
                </div>
            </div>
        </div>
    );
}

function RosterPage({
    month,
    setMonth,
    rows,
    employees,
    selected,
    setSelected,
    generateRoster,
    loadRoster,
    message,
}: {
    month: string;
    setMonth: (value: string) => void;
    rows: RosterRow[];
    employees: Employee[];
    selected: Array<string | number>;
    setSelected: React.Dispatch<
        React.SetStateAction<
            Array<string | number>
        >
    >;
    generateRoster: () => void;
    loadRoster: () => void;
    message: string;
}) {
    const events = useMemo(
        () =>
            rows.map((row) => ({
                title: `${
                    employees.find(
                        (e) =>
                            String(e.id) ===
                            String(
                                row.employee_id
                            )
                    )?.code ||
                    `Employee ${row.employee_id}`
                } • ${shiftName(
                    row.shift
                )}`,
                start: row.date,
            })),
        [rows, employees]
    );

    const toggleEmployee = (
        id: string | number
    ) => {
        setSelected((current) =>
            current.includes(id)
                ? current.filter(
                      (x) =>
                          x !== id
                  )
                : [...current, id]
        );
    };

    return (
        <div className="content">
            <h1 className="page-title">
                Monthly Shift Roster
            </h1>

            <p className="page-subtitle">
                Generate and view the
                workforce schedule
            </p>

            <div className="card">
                <div className="action-row">
                    <input
                        className="input"
                        type="month"
                        value={month}
                        onChange={(e) =>
                            setMonth(
                                e.target.value
                            )
                        }
                    />

                    <button
                        className="primary-btn"
                        onClick={
                            generateRoster
                        }
                    >
                        Generate Roster
                    </button>

                    <button
                        className="secondary-btn"
                        onClick={
                            loadRoster
                        }
                    >
                        Load Saved Roster
                    </button>
                </div>
            </div>

            <div className="card section">
                <div className="section-title">
                    Monthly Workforce:{" "}
                    {selected.length} selected
                </div>

                <p>
                    Select the employees
                    included in this month.
                </p>

                <div className="employee-grid">
                    {employees.map(
                        (employee) => (
                            <label
                                key={
                                    employee.id
                                }
                                className="employee-check"
                            >
                                <input
                                    type="checkbox"
                                    checked={selected.includes(
                                        employee.id
                                    )}
                                    onChange={() =>
                                        toggleEmployee(
                                            employee.id
                                        )
                                    }
                                />

                                <span>
                                    {
                                        employee.code
                                    }
                                </span>
                            </label>
                        )
                    )}
                </div>
            </div>

            {message && (
                <div className="section">
                    <div className="card">
                        {message}
                    </div>
                </div>
            )}

            <div className="shift-grid section">
                <div className="shift-card shift-morning">
                    <div className="shift-name">
                        Morning
                    </div>
                    <div className="shift-count">
                        1
                    </div>
                </div>

                <div className="shift-card shift-general">
                    <div className="shift-name">
                        General
                    </div>
                    <div className="shift-count">
                        Weekend: 1
                    </div>
                </div>

                <div className="shift-card shift-evening">
                    <div className="shift-name">
                        Evening
                    </div>
                    <div className="shift-count">
                        1
                    </div>
                </div>

                <div className="shift-card shift-night">
                    <div className="shift-name">
                        Night
                    </div>
                    <div className="shift-count">
                        2
                    </div>
                </div>
            </div>

            <div className="calendar-card">
                <FullCalendar
                    plugins={[
                        dayGridPlugin,
                    ]}
                    initialView="dayGridMonth"
                    initialDate={`${month}-01`}
                    events={events}
                    height="auto"
                />
            </div>
        </div>
    );
}

function LeaveRequestsPage({
    user,
    leaves,
    employees,
    reload,
}: {
    user: User;
    leaves: LeaveRequest[];
    employees: Employee[];
    reload: () => void;
}) {
    const isEmployee =
        user.role === "employee";

    const [startDate, setStartDate] =
        useState("");

    const [endDate, setEndDate] =
        useState("");

    const [reason, setReason] =
        useState("");

    const [message, setMessage] =
        useState("");

    const employeeName = (
        id: string | number
    ) =>
        employees.find(
            (e) =>
                String(e.id) ===
                String(id)
        )?.code || String(id);

    const submitLeave = async () => {
        try {
            setMessage("");

            /*
             * The FastAPI leave service uses
             * the authenticated user. We send
             * the common snake_case payload.
             */
            await api.post(
                "/leaves",
                {
                    start_date:
                        startDate,
                    end_date: endDate,
                    reason,
                }
            );

            setMessage(
                "Leave request submitted successfully."
            );

            setStartDate("");
            setEndDate("");
            setReason("");

            await reload();
        } catch (error: any) {
            /*
             * Some versions of the project
             * accept employee_id explicitly.
             * Retry only after a validation
             * error so we don't create duplicates.
             */
            if (
                error.response?.status ===
                    422 &&
                user.employeeId !=
                    null
            ) {
                try {
                    await api.post(
                        "/leaves",
                        {
                            employee_id:
                                user.employeeId,
                            start_date:
                                startDate,
                            end_date:
                                endDate,
                            reason,
                        }
                    );

                    setMessage(
                        "Leave request submitted successfully."
                    );

                    setStartDate("");
                    setEndDate("");
                    setReason("");

                    await reload();
                    return;
                } catch (retryError: any) {
                    setMessage(
                        retryError
                            .response
                            ?.data
                            ?.detail ||
                            "Leave request failed."
                    );
                    return;
                }
            }

            setMessage(
                error.response?.data
                    ?.detail ||
                    "Leave request failed."
            );
        }
    };

    const updateLeave = async (
        id: string | number,
        status: "approved" | "rejected"
    ) => {
        try {
            await api.patch(
                `/leaves/${id}/${status}`
            );

            await reload();
        } catch (error: any) {
            alert(
                error.response?.data
                    ?.detail ||
                    "Unable to update leave request."
            );
        }
    };

    const visibleLeaves =
        isEmployee
            ? leaves.filter(
                  (leave) =>
                      String(
                          leave.employee_id ??
                              leave.employeeId
                      ) ===
                      String(
                          user.employeeId
                      )
              )
            : leaves;

    return (
        <div className="content">
            <h1 className="page-title">
                {isEmployee
                    ? "Leave Request"
                    : "Leave Requests"}
            </h1>

            <p className="page-subtitle">
                {isEmployee
                    ? "Request leave for your schedule"
                    : "Review employee leave requests"}
            </p>

            {isEmployee && (
                <div
                    className="card"
                    style={{
                        maxWidth: 650,
                        marginTop: 20,
                    }}
                >
                    <div className="form-group">
                        <label>
                            Start Date
                        </label>

                        <input
                            className="input"
                            type="date"
                            value={startDate}
                            onChange={(e) =>
                                setStartDate(
                                    e.target
                                        .value
                                )
                            }
                        />
                    </div>

                    <div className="form-group">
                        <label>
                            End Date
                        </label>

                        <input
                            className="input"
                            type="date"
                            value={endDate}
                            onChange={(e) =>
                                setEndDate(
                                    e.target
                                        .value
                                )
                            }
                        />
                    </div>

                    <div className="form-group">
                        <label>
                            Reason
                        </label>

                        <textarea
                            className="input"
                            rows={4}
                            value={reason}
                            onChange={(e) =>
                                setReason(
                                    e.target
                                        .value
                                )
                            }
                        />
                    </div>

                    {message && (
                        <div className="info-message">
                            {message}
                        </div>
                    )}

                    <button
                        className="primary-btn"
                        onClick={
                            submitLeave
                        }
                    >
                        Submit Leave Request
                    </button>
                </div>
            )}

            <div className="card section">
                <div className="section-title">
                    {isEmployee
                        ? "My Requests"
                        : "Employee Requests"}
                </div>

                {visibleLeaves.length ===
                0 ? (
                    <p>
                        No leave requests
                        found.
                    </p>
                ) : (
                    visibleLeaves.map(
                        (leave) => {
                            const id =
                                leave.employee_id ??
                                leave.employeeId;

                            return (
                                <div
                                    className="request-item"
                                    key={
                                        leave.id
                                    }
                                >
                                    <div>
                                        {!isEmployee && (
                                            <strong>
                                                {
                                                    employeeName(
                                                        id ??
                                                            ""
                                                    )
                                                }
                                            </strong>
                                        )}

                                        <div>
                                            {
                                                leave.start_date ??
                                                    leave.startDate
                                            }{" "}
                                            →{" "}
                                            {
                                                leave.end_date ??
                                                    leave.endDate
                                            }
                                        </div>

                                        <div>
                                            {
                                                leave.reason
                                            }
                                        </div>
                                    </div>

                                    <div className="action-row">
                                        <span
                                            className={`badge badge-${leave.status}`}
                                        >
                                            {
                                                leave.status
                                            }
                                        </span>

                                        {!isEmployee &&
                                            leave.status ===
                                                "pending" && (
                                                <>
                                                    <button
                                                        className="approve-btn"
                                                        onClick={() =>
                                                            updateLeave(
                                                                leave.id,
                                                                "approved"
                                                            )
                                                        }
                                                    >
                                                        Approve
                                                    </button>

                                                    <button
                                                        className="reject-btn"
                                                        onClick={() =>
                                                            updateLeave(
                                                                leave.id,
                                                                "rejected"
                                                            )
                                                        }
                                                    >
                                                        Reject
                                                    </button>
                                                </>
                                            )}
                                    </div>
                                </div>
                            );
                        }
                    )
                )}
            </div>
        </div>
    );
}

function ShiftChangePage({
    user,
    rows,
    employees,
}: {
    user: User;
    rows: RosterRow[];
    employees: Employee[];
}) {
    const storageKey =
        "shiftChangeRequests";

    const [requests, setRequests] =
        useState<ShiftRequest[]>(
            () => {
                try {
                    return JSON.parse(
                        localStorage.getItem(
                            storageKey
                        ) || "[]"
                    );
                } catch {
                    return [];
                }
            }
        );

    const [date, setDate] =
        useState("");

    const [currentShift, setCurrentShift] =
        useState("N");

    const [requestedShift, setRequestedShift] =
        useState("E");

    const [reason, setReason] =
        useState("");

    const [message, setMessage] =
        useState("");

    const saveRequests = (
        next: ShiftRequest[]
    ) => {
        setRequests(next);

        localStorage.setItem(
            storageKey,
            JSON.stringify(next)
        );
    };

    const submit = () => {
        if (!date) {
            setMessage(
                "Please select a date."
            );
            return;
        }

        if (
            currentShift ===
            requestedShift
        ) {
            setMessage(
                "Choose a different requested shift."
            );
            return;
        }

        const request: ShiftRequest = {
            id:
                crypto.randomUUID(),
            employeeId:
                user.employeeId ?? "",
            date,
            currentShift,
            requestedShift,
            reason,
            status: "pending",
        };

        saveRequests([
            request,
            ...requests,
        ]);

        setMessage(
            "Shift change request submitted."
        );

        setDate("");
        setReason("");
    };

    const myRequests =
        requests.filter(
            (request) =>
                String(
                    request.employeeId
                ) ===
                String(
                    user.employeeId
                )
        );

    const employeeName = (
        id: string | number
    ) =>
        employees.find(
            (e) =>
                String(e.id) ===
                String(id)
        )?.code || String(id);

    return (
        <div className="content">
            <h1 className="page-title">
                Shift Change
            </h1>

            <p className="page-subtitle">
                Request a change to your
                assigned shift
            </p>

            <div
                className="card"
                style={{
                    maxWidth: 650,
                    marginTop: 20,
                }}
            >
                <div className="form-group">
                    <label>
                        Date
                    </label>

                    <input
                        className="input"
                        type="date"
                        value={date}
                        onChange={(e) =>
                            setDate(
                                e.target.value
                            )
                        }
                    />
                </div>

                <div className="form-group">
                    <label>
                        Current Shift
                    </label>

                    <select
                        className="input"
                        value={currentShift}
                        onChange={(e) =>
                            setCurrentShift(
                                e.target.value
                            )
                        }
                    >
                        <option value="M">
                            Morning
                        </option>

                        <option value="G">
                            General
                        </option>

                        <option value="E">
                            Evening
                        </option>

                        <option value="N">
                            Night
                        </option>
                    </select>
                </div>

                <div className="form-group">
                    <label>
                        Requested Shift
                    </label>

                    <select
                        className="input"
                        value={requestedShift}
                        onChange={(e) =>
                            setRequestedShift(
                                e.target.value
                            )
                        }
                    >
                        <option value="M">
                            Morning
                        </option>

                        <option value="G">
                            General
                        </option>

                        <option value="E">
                            Evening
                        </option>

                        <option value="N">
                            Night
                        </option>
                    </select>
                </div>

                <div className="form-group">
                    <label>
                        Reason
                    </label>

                    <textarea
                        className="input"
                        rows={4}
                        value={reason}
                        onChange={(e) =>
                            setReason(
                                e.target.value
                            )
                        }
                    />
                </div>

                {message && (
                    <div className="info-message">
                        {message}
                    </div>
                )}

                <button
                    className="primary-btn"
                    onClick={submit}
                >
                    Submit Shift Change
                </button>
            </div>

            <div className="card section">
                <div className="section-title">
                    My Shift Change Requests
                </div>

                {myRequests.length ===
                0 ? (
                    <p>
                        No shift change
                        requests.
                    </p>
                ) : (
                    myRequests.map(
                        (request) => (
                            <div
                                className="request-item"
                                key={
                                    request.id
                                }
                            >
                                <div>
                                    <strong>
                                        {
                                            request.date
                                        }
                                    </strong>

                                    <div>
                                        {
                                            shiftName(
                                                request.currentShift
                                            )
                                        }{" "}
                                        →{" "}
                                        {
                                            shiftName(
                                                request.requestedShift
                                            )
                                        }
                                    </div>

                                    <div>
                                        {
                                            request.reason
                                        }
                                    </div>
                                </div>

                                <span
                                    className={`badge badge-${request.status}`}
                                >
                                    {
                                        request.status
                                    }
                                </span>
                            </div>
                        )
                    )
                )}
            </div>
        </div>
    );
}

function EmployeesPage({
    employees,
}: {
    employees: Employee[];
}) {
    return (
        <div className="content">
            <h1 className="page-title">
                Employees
            </h1>

            <p className="page-subtitle">
                Workforce directory
            </p>

            <div className="card section">
                <div className="table-wrapper">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>
                                    Employee
                                </th>
                                <th>
                                    Code
                                </th>
                                <th>
                                    Status
                                </th>
                            </tr>
                        </thead>

                        <tbody>
                            {employees.map(
                                (employee) => (
                                    <tr
                                        key={
                                            employee.id
                                        }
                                    >
                                        <td>
                                            {
                                                employee.name ||
                                                    employee.code
                                            }
                                        </td>

                                        <td>
                                            {
                                                employee.code
                                            }
                                        </td>

                                        <td>
                                            <span className="badge badge-approved">
                                                {employee.active ===
                                                false
                                                    ? "Inactive"
                                                    : "Active"}
                                            </span>
                                        </td>
                                    </tr>
                                )
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

function App() {
    const [user, setUser] =
        useState<User | null>(
            getStoredUser()
        );

    const [page, setPage] =
        useState("dashboard");

    const [month, setMonth] =
        useState(
            new Date()
                .toISOString()
                .slice(0, 7)
        );

    const [employees, setEmployees] =
        useState<Employee[]>([]);

    const [selected, setSelected] =
        useState<
            Array<string | number>
        >([]);

    const [rows, setRows] =
        useState<RosterRow[]>([]);

    const [leaves, setLeaves] =
        useState<LeaveRequest[]>([]);

    const [shiftRequests, setShiftRequests] =
        useState<ShiftRequest[]>(() => {
            try {
                return JSON.parse(
                    localStorage.getItem(
                        "shiftChangeRequests"
                    ) || "[]"
                );
            } catch {
                return [];
            }
        });

    const [message, setMessage] =
        useState("");

    const loadEmployees =
        async () => {
            const response =
                await api.get<Employee[]>(
                    "/employees"
                );

            setEmployees(
                response.data || []
            );

            if (
                selected.length === 0
            ) {
                setSelected(
                    (
                        response.data || []
                    )
                        .filter(
                            (e) =>
                                e.active !==
                                false
                        )
                        .map(
                            (e) =>
                                e.id
                        )
                );
            }
        };

    const loadRoster = async () => {
        try {
            const response =
                await api.get<
                    RosterRow[]
                >(
                    `/rosters/${month}`
                );

            setRows(
                Array.isArray(
                    response.data
                )
                    ? response.data
                    : []
            );
        } catch (error: any) {
            if (
                error.response?.status ===
                404
            ) {
                setRows([]);
            } else {
                console.error(
                    "Roster loading error:",
                    error
                );
            }
        }
    };

    const loadLeaves = async () => {
        try {
            const response =
                await api.get(
                    "/leaves"
                );

            setLeaves(
                Array.isArray(
                    response.data
                )
                    ? response.data
                    : []
            );
        } catch (error) {
            console.error(
                "Leave loading error:",
                error
            );
        }
    };

    const loadAll = async () => {
        try {
            await Promise.all([
                loadEmployees(),
                loadRoster(),
                loadLeaves(),
            ]);
        } catch (error: any) {
            console.error(
                "Loading error:",
                error
            );

            if (
                error.response?.status ===
                401
            ) {
                localStorage.removeItem(
                    "token"
                );
                localStorage.removeItem(
                    "user"
                );
                setUser(null);
            }
        }
    };

    useEffect(() => {
        if (getToken()) {
            loadAll();
        }
    }, [month]);

    const generateRoster =
        async () => {
            try {
                setMessage(
                    "Generating roster..."
                );

                await api.post(
                    "/rosters/generate",
                    {
                        month,
                        employee_ids:
                            selected,
                    }
                );

                await loadRoster();

                setMessage(
                    `Roster generated for ${selected.length} employees.`
                );

                setPage(
                    "roster"
                );
            } catch (error: any) {
                console.error(
                    "Roster generation error:",
                    error
                );

                setMessage(
                    error.response?.data
                        ?.detail ||
                        "Roster generation failed."
                );
            }
        };

    if (!user) {
        return (
            <Login />
        );
    }

    const dashboard =
        user.role === "admin" ? (
            <AdminDashboard
                employees={
                    employees
                }
                leaves={
                    leaves
                }
                shiftRequests={
                    shiftRequests
                }
            />
        ) : user.role ===
          "manager" ? (
            <ManagerDashboard
                leaves={
                    leaves
                }
                shiftRequests={
                    shiftRequests
                }
            />
        ) : (
            <EmployeeDashboard
                user={user}
                rows={rows}
                leaves={leaves}
                shiftRequests={
                    shiftRequests
                }
            />
        );

    let content: React.ReactNode =
        dashboard;

    if (
        page === "roster"
    ) {
        content = (
            <RosterPage
                month={month}
                setMonth={
                    setMonth
                }
                rows={rows}
                employees={
                    employees
                }
                selected={
                    selected
                }
                setSelected={
                    setSelected
                }
                generateRoster={
                    generateRoster
                }
                loadRoster={
                    loadRoster
                }
                message={message}
            />
        );
    }

    if (
        page === "employees"
    ) {
        content = (
            <EmployeesPage
                employees={
                    employees
                }
            />
        );
    }

    if (
        page === "leave"
    ) {
        content = (
            <LeaveRequestsPage
                user={user}
                leaves={leaves}
                employees={
                    employees
                }
                reload={
                    loadLeaves
                }
            />
        );
    }

    if (
        page === "shift"
    ) {
        content = (
            <ShiftChangePage
                user={user}
                rows={rows}
                employees={
                    employees
                }
            />
        );
    }

    if (
        page === "schedule"
    ) {
        content = (
            <EmployeeDashboard
                user={user}
                rows={rows}
                leaves={leaves}
                shiftRequests={
                    shiftRequests
                }
            />
        );
    }

    return (
        <Layout
            page={page}
            setPage={
                setPage
            }
            user={user}
        >
            {content}
        </Layout>
    );
}

const root =
    document.getElementById(
        "root"
    );

if (!root) {
    throw new Error(
        "Root element not found"
    );
}

createRoot(root).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);