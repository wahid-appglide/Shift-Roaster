import { useState } from "react";

import {
  Box,
  Button,
  Chip,
  Paper,
  TextField,
  Typography,
  InputAdornment,
} from "@mui/material";

import { DataGrid } from "@mui/x-data-grid";
import type { GridColDef } from "@mui/x-data-grid";

import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import SearchIcon from "@mui/icons-material/Search";

import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";

const nocEmployees = [
  {
    id: 1,
    employeeId: "AG-1",
    name: "Arunprasad",
    department: "NOC",
    designation: "NOC Engineer",
    assignedShift: "Morning",
    maxHours: 40,
    weeklyOff: "Sunday",
    status: "Active",
  },
  {
    id: 2,
    employeeId: "AG-2",
    name: "Abinaya",
    department: "NOC",
    designation: "System Engineer",
    assignedShift: "Morning",
    maxHours: 40,
    weeklyOff: "Saturday",
    status: "Active",
  },
  {
    id: 3,
    employeeId: "AG-3",
    name: "Saranraj",
    department: "NOC",
    designation: "Network Engineer",
    assignedShift: "Night",
    maxHours: 40,
    weeklyOff: "Sunday",
    status: "Active",
  },
  {
    id: 4,
    employeeId: "AG-4",
    name: "Pranav",
    department: "NOC",
    designation: "Support Engineer",
    assignedShift: "Evening",
    maxHours: 40,
    weeklyOff: "Saturday",
    status: "Active",
  },
  {
    id: 5,
    employeeId: "AG-5",
    name: "Keerthika",
    department: "NOC",
    designation: "NOC Engineer",
    assignedShift: "Morning",
    maxHours: 40,
    weeklyOff: "Sunday",
    status: "Active",
  },
  {
    id: 6,
    employeeId: "AG-6",
    name: "Kiruthushya",
    department: "NOC",
    designation: "System Engineer",
    assignedShift: "Night",
    maxHours: 40,
    weeklyOff: "Sunday",
    status: "Active",
  },
  {
    id: 7,
    employeeId: "AG-7",
    name: "Sumaithri",
    department: "NOC",
    designation: "Support Engineer",
    assignedShift: "Morning",
    maxHours: 40,
    weeklyOff: "Saturday",
    status: "Active",
  },
  {
    id: 8,
    employeeId: "AG-8",
    name: "Sudeeksha",
    department: "NOC",
    designation: "NOC Engineer",
    assignedShift: "Evening",
    maxHours: 40,
    weeklyOff: "Sunday",
    status: "Active",
  },
  {
    id: 9,
    employeeId: "AG-9",
    name: "Sahaj",
    department: "NOC",
    designation: "Network Engineer",
    assignedShift: "Morning",
    maxHours: 40,
    weeklyOff: "Saturday",
    status: "Active",
  },
  {
    id: 10,
    employeeId: "AG-10",
    name: "Bharath",
    department: "NOC",
    designation: "System Engineer",
    assignedShift: "Night",
    maxHours: 40,
    weeklyOff: "Sunday",
    status: "Active",
  },
];

export default function NocEmployees() {
  const [search, setSearch] = useState("");

  const filteredEmployees = nocEmployees.filter(
    (emp) =>
      emp.employeeId.toLowerCase().includes(search.toLowerCase()) ||
      emp.name.toLowerCase().includes(search.toLowerCase()) ||
      emp.department.toLowerCase().includes(search.toLowerCase())
  );

  const columns: GridColDef[] = [
    {
      field: "employeeId",
      headerName: "Employee ID",
      flex: 1,
    },
    {
      field: "name",
      headerName: "Employee Name",
      flex: 1.5,
    },
    {
      field: "department",
      headerName: "Department",
      flex: 1,
    },
    {
      field: "designation",
      headerName: "Designation",
      flex: 1.5,
    },
    {
      field: "assignedShift",
      headerName: "Assigned Shift",
      flex: 1,
    },
    {
      field: "maxHours",
      headerName: "Max Hours",
      flex: 1,
    },
    {
      field: "weeklyOff",
      headerName: "Week Off",
      flex: 1,
    },
    {
      field: "status",
      headerName: "Status",
      flex: 1,
      renderCell: (params) => (
        <Chip
          label={params.value}
          color="success"
          size="small"
        />
      ),
    },
    {
      field: "actions",
      headerName: "Actions",
      flex: 1.8,
      sortable: false,
      renderCell: () => (
        <>
          <Button
            variant="contained"
            size="small"
            startIcon={<EditIcon />}
            sx={{ mr: 1 }}
          >
            Edit
          </Button>

          <Button
            variant="contained"
            color="error"
            size="small"
            startIcon={<DeleteIcon />}
          >
            Delete
          </Button>
        </>
      ),
    },
  ];
    return (
    <>
      <Navbar />
      <Sidebar />

      <Box
        sx={{
          ml: "250px",
          mt: "80px",
          mr: "20px",
          p: 4,
          minHeight: "100vh",
          background: "linear-gradient(135deg,#0f172a,#1e293b,#111827)",
        }}
      >
        <Typography
          variant="h4"
          sx={{
            color: "#fff",
            fontWeight: "bold",
            textAlign: "center",
            mb: 4,
            letterSpacing: 1,
            textShadow: "0 0 12px rgba(59,130,246,0.6)",
          }}
        >
          NOC Team - Employee Management
        </Typography>

        {/* Search & Buttons */}

        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 3,
            flexWrap: "wrap",
            gap: 2,
          }}
        >
          <TextField
            placeholder="Search Employee ID / Name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon
                    sx={{
                      color: "#60a5fa",
                    }}
                  />
                </InputAdornment>
              ),
            }}
            sx={{
              width: "42%",

              "& .MuiOutlinedInput-root": {
                background:
                  "linear-gradient(145deg,#111827,#1e293b)",
                borderRadius: "18px",
                height: "58px",
                color: "#fff",

                "& fieldset": {
                  border: "2px solid #334155",
                },

                "&:hover fieldset": {
                  border: "2px solid #3b82f6",
                },

                "&.Mui-focused fieldset": {
                  border: "2px solid #60a5fa",
                  boxShadow:
                    "0 0 18px rgba(96,165,250,.5)",
                },
              },

              "& input": {
                color: "#fff",
                fontWeight: 500,
              },

              "& input::placeholder": {
                color: "#94a3b8",
                opacity: 1,
              },
            }}
          />

          <Box
            sx={{
              display: "flex",
              gap: 2,
            }}
          >
            <Button
              variant="contained"
              startIcon={<AutoAwesomeIcon />}
              sx={{
                px: 3,
                py: 1.4,
                borderRadius: "12px",
                textTransform: "none",
                fontWeight: "bold",
                background:
                  "linear-gradient(45deg,#2563eb,#3b82f6)",

                "&:hover": {
                  transform: "translateY(-3px)",
                  boxShadow:
                    "0 0 18px rgba(59,130,246,.7)",
                },
              }}
            >
              Generate Shift
            </Button>

            <Button
              variant="contained"
              startIcon={<AddIcon />}
              sx={{
                px: 3,
                py: 1.4,
                borderRadius: "12px",
                textTransform: "none",
                fontWeight: "bold",
                background:
                  "linear-gradient(45deg,#16a34a,#22c55e)",

                "&:hover": {
                  transform: "translateY(-3px)",
                  boxShadow:
                    "0 0 18px rgba(34,197,94,.7)",
                },
              }}
            >
              Add Employee
            </Button>
          </Box>
        </Box>

        <Paper
          elevation={10}
          sx={{
            height: 600,
            width: "100%",
            borderRadius: "18px",
            overflow: "hidden",
            backgroundColor: "#111827",
          }}
        ></Paper>
        <DataGrid
  rows={filteredEmployees}
  columns={columns}
  pageSizeOptions={[5, 10]}
  initialState={{
    pagination: {
      paginationModel: {
        pageSize: 10,
        page: 0,
      },
    },
  }}
  disableRowSelectionOnClick
  sx={{
    border: 0,
    color: "#ffffff",
    backgroundColor: "#111827",
    fontSize: 14,

    /* Header */
    "& .MuiDataGrid-columnHeaders": {
      background:
        "linear-gradient(90deg,#2563eb,#1d4ed8)",
      color: "#ffffff",
      fontSize: "15px",
      fontWeight: "bold",
      borderBottom: "2px solid #3b82f6",
    },

    "& .MuiDataGrid-columnHeaderTitle": {
      fontWeight: "bold",
      color: "#ffffff",
    },

    /* Rows */
    "& .MuiDataGrid-row": {
      backgroundColor: "#111827",
      transition: "0.3s",
    },

    "& .MuiDataGrid-row:nth-of-type(even)": {
      backgroundColor: "#172033",
    },

    "& .MuiDataGrid-row:hover": {
      backgroundColor: "#1e3a8a",
      boxShadow: "inset 0 0 12px rgba(59,130,246,.4)",
      cursor: "pointer",
    },

    /* Cells */
    "& .MuiDataGrid-cell": {
      borderBottom: "1px solid #374151",
      color: "#ffffff",
    },

    /* Footer */
    "& .MuiDataGrid-footerContainer": {
      backgroundColor: "#0f172a",
      color: "#ffffff",
      borderTop: "1px solid #374151",
    },

    "& .MuiTablePagination-root": {
      color: "#ffffff",
    },

    "& .MuiSvgIcon-root": {
      color: "#ffffff",
    },

    /* Selected Row */
    "& .Mui-selected": {
      backgroundColor: "#1d4ed8 !important",
    },
  }}
/>