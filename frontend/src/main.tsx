import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";

import {
    AppBar,
    Toolbar,
    Typography,
    Button,
    Container,
    TextField,
    Stack,
    Paper,
    Alert,
    FormGroup,
    FormControlLabel,
    Checkbox,
} from "@mui/material";

import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";

import { api } from "./api";

type Employee = {
    id: number;
    code: string;
};

type RosterRow = {
    date: string;
    employee_id: number;
    shift: string;
};

function Login() {
    const [username, setUsername] = useState("admin");
    const [password, setPassword] = useState("admin123");
    const [error, setError] = useState("");

    const login = async () => {
        try {
            setError("");

            const formData = new URLSearchParams();
            formData.append("username", username);
            formData.append("password", password);

            const response = await api.post(
                "/auth/login",
                formData,
                {
                    headers: {
                        "Content-Type":
                            "application/x-www-form-urlencoded",
                    },
                }
            );

            localStorage.setItem(
                "token",
                response.data.access_token
            );

            window.location.reload();
        } catch (error: any) {
            console.error("Login error:", error);

            setError(
                error.response?.data?.detail ||
                    "Invalid login"
            );
        }
    };

    return (
        <Container maxWidth="xs" sx={{ py: 10 }}>
            <Paper elevation={3} sx={{ p: 4 }}>
                <Stack spacing={2}>
                    <Typography
                        variant="h4"
                        align="center"
                    >
                        Sign in
                    </Typography>

                    <TextField
                        label="Username"
                        value={username}
                        onChange={(event) => {
                            setUsername(event.target.value);
                        }}
                        fullWidth
                    />

                    <TextField
                        label="Password"
                        type="password"
                        value={password}
                        onChange={(event) => {
                            setPassword(event.target.value);
                        }}
                        fullWidth
                    />

                    {error && (
                        <Alert severity="error">
                            {error}
                        </Alert>
                    )}

                    <Button
                        variant="contained"
                        onClick={login}
                        fullWidth
                    >
                        Sign In
                    </Button>
                </Stack>
            </Paper>
        </Container>
    );
}

function App() {
    const [month, setMonth] = useState(
        new Date().toISOString().slice(0, 7)
    );

    const [employees, setEmployees] =
        useState<Employee[]>([]);

    const [selected, setSelected] =
        useState<number[]>([]);

    const [rows, setRows] =
        useState<RosterRow[]>([]);

    const [message, setMessage] =
        useState("");

    const loadEmployees = async () => {
        try {
            const response =
                await api.get<Employee[]>("/employees");

            setEmployees(response.data);

            setSelected(
                response.data.map(
                    (employee) => employee.id
                )
            );
        } catch (error) {
            console.error(
                "Employee loading error:",
                error
            );
        }
    };

    const loadRoster = async () => {
        try {
            setMessage("");

            const response =
                await api.get<RosterRow[]>(
                    `/rosters/${month}`
                );

            setRows(response.data);
        } catch (error: any) {
            console.error(
                "Roster loading error:",
                error
            );

            setMessage(
                error.response?.data?.detail ||
                    "Failed to load roster"
            );
        }
    };

    const generateRoster = async () => {
        try {
            setMessage("");

            await api.post(
                "/rosters/generate",
                {
                    month,
                    employee_ids: selected,
                }
            );

            setMessage(
                `Roster generated for ${selected.length} employees`
            );

            await loadRoster();
        } catch (error: any) {
            console.error(
                "Roster generation error:",
                error
            );

            setMessage(
                error.response?.data?.detail ||
                    "Generation failed"
            );
        }
    };

    const toggleEmployee = (id: number) => {
        setSelected((current) => {
            if (current.includes(id)) {
                return current.filter(
                    (employeeId) =>
                        employeeId !== id
                );
            }

            return [...current, id];
        });
    };

    useEffect(() => {
        const token =
            localStorage.getItem("token");

        if (!token) {
            return;
        }

        loadEmployees();
        loadRoster();
    }, []);

    if (!localStorage.getItem("token")) {
        return <Login />;
    }

    const calendarEvents = rows
        .filter((row) =>
            ["M", "E", "N"].includes(row.shift)
        )
        .map((row) => ({
            title:
                `Employee ${row.employee_id}: ${row.shift}`,
            start: row.date,
        }));

    return (
        <>
            <AppBar position="static">
                <Toolbar>
                    <Typography
                        sx={{ flexGrow: 1 }}
                    >
                        Shift Roster
                    </Typography>

                    <Button
                        color="inherit"
                        onClick={() => {
                            localStorage.removeItem(
                                "token"
                            );

                            window.location.reload();
                        }}
                    >
                        Logout
                    </Button>
                </Toolbar>
            </AppBar>

            <Container sx={{ py: 3 }}>
                <Stack
                    direction="row"
                    spacing={2}
                >
                    <TextField
                        type="month"
                        value={month}
                        onChange={(event) => {
                            setMonth(
                                event.target.value
                            );
                        }}
                    />

                    <Button
                        variant="contained"
                        onClick={generateRoster}
                        disabled={
                            selected.length === 0
                        }
                    >
                        Generate Roster
                    </Button>

                    <Button
                        variant="outlined"
                        onClick={loadRoster}
                    >
                        Load
                    </Button>
                </Stack>

                <Paper
                    sx={{
                        p: 2,
                        mt: 2,
                    }}
                >
                    <Typography variant="h6">
                        Monthly Workforce:{" "}
                        {selected.length} selected
                    </Typography>

                    <Typography
                        variant="body2"
                        sx={{ mb: 2 }}
                    >
                        Select the employees for
                        this month.
                    </Typography>

                    <FormGroup row>
                        {employees.map((employee) => (
                            <FormControlLabel
                                key={employee.id}
                                label={employee.code}
                                control={
                                    <Checkbox
                                        checked={selected.includes(
                                            employee.id
                                        )}
                                        onChange={() => {
                                            toggleEmployee(
                                                employee.id
                                            );
                                        }}
                                    />
                                }
                            />
                        ))}
                    </FormGroup>
                </Paper>

                {message && (
                    <Alert
                        severity="info"
                        sx={{ my: 2 }}
                    >
                        {message}
                    </Alert>
                )}

                <Paper
                    sx={{
                        p: 2,
                        mt: 2,
                    }}
                >
                    <FullCalendar
                        plugins={[
                            dayGridPlugin,
                        ]}
                        initialView="dayGridMonth"
                        events={calendarEvents}
                    />
                </Paper>
            </Container>
        </>
    );
}

const root = document.getElementById("root");

if (!root) {
    throw new Error("Root element not found");
}

createRoot(root).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);