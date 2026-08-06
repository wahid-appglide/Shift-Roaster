import { useState } from "react";

import {
  Box,
  Button,
  Chip,
  Paper,
  TextField,
  Typography,
} from "@mui/material";

import { DataGrid } from "@mui/x-data-grid";
import type { GridColDef } from "@mui/x-data-grid";

import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";

const sreEmployees = [
  {
    id: 1,
    employeeId: "AGS-1",
    name: "Wahid",
    department: "SRE",
    designation: "Site Reliability Engineer",
    assignedShift: "Morning",
    maxHours: 40,
    weeklyOff: "Sunday",
    status: "Active",
  },
  {
    id: 2,
    employeeId: "AGS-2",
    name: "Abishek",
    department: "SRE",
    designation: "Cloud Engineer",
    assignedShift: "Evening",
    maxHours: 40,
    weeklyOff: "Saturday",
    status: "Active",
  },
  {
    id: 3,
    employeeId: "AGS-3",
    name: "Priya",
    department: "SRE",
    designation: "Platform Engineer",
    assignedShift: "Night",
    maxHours: 40,
    weeklyOff: "Sunday",
    status: "Active",
  },
  {
    id: 4,
    employeeId: "AGS-4",
    name: "Sundarajan",
    department: "SRE",
    designation: "DevOps Engineer",
    assignedShift: "Morning",
    maxHours: 40,
    weeklyOff: "Saturday",
    status: "Active",
  },
  {
    id: 5,
    employeeId: "AGS-5",
    name: "Surya",
    department: "SRE",
    designation: "SRE Engineer",
    assignedShift: "Evening",
    maxHours: 40,
    weeklyOff: "Sunday",
    status: "Active",
  },
];

export default function SreEmployees() {
  const [search, setSearch] = useState("");

  const filteredEmployees = sreEmployees.filter(
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
      headerName: "Weekly Off",
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
            sx={{ mr: 1, textTransform: "none" }}
          >
            Edit
          </Button>

          <Button
            variant="contained"
            color="error"
            size="small"
            startIcon={<DeleteIcon />}
            sx={{ textTransform: "none" }}
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
          backgroundColor: "#1c1f2b",
        }}
      >
        <Typography
          variant="h4"
          fontWeight="bold"
          color="white"
          textAlign="center"
          mb={1}
        >
          SRE Team - Employee Management
        </Typography>

        <Typography
          align="center"
          sx={{
            color: "#bdbdbd",
            mb: 4,
          }}
        >
          SRE shifts are assigned manually by the Administrator.
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
            placeholder="Search Employee..."
            size="small"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{
              width: 350,
              backgroundColor: "white",
              borderRadius: 2,
            }}
          />

          <Box sx={{ display: "flex", gap: 2 }}>
            <Button
              variant="contained"
              color="warning"
              startIcon={<EditIcon />}
              sx={{
                px: 3,
                textTransform: "none",
                fontWeight: "bold",
              }}
            >
              Update Shift
            </Button>

            <Button
              variant="contained"
              startIcon={<AddIcon />}
              sx={{
                px: 3,
                textTransform: "none",
                fontWeight: "bold",
              }}
            >
              Add Employee
            </Button>
          </Box>
        </Box>

        <Paper
          elevation={8}
          sx={{
            height: 600,
            width: "100%",
            borderRadius: 3,
            overflow: "hidden",
          }}
        >
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
              fontSize: 14,

              "& .MuiDataGrid-columnHeaders": {
                backgroundColor: "#ed6c02",
                color: "#000",
                fontWeight: "bold",
                fontSize: 15,
              },

              "& .MuiDataGrid-row:hover": {
                backgroundColor: "#f5f5f5",
              },

              "& .MuiDataGrid-cell": {
                alignItems: "center",
              },
            }}
          />
        </Paper>
      </Box>
    </>
  );
}