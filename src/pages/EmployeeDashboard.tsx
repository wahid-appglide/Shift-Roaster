import { Box, Typography } from "@mui/material";

export default function EmployeeDashboard() {
  return (
    <Box sx={{ p: 5 }}>
      <Typography variant="h4" fontWeight="bold">
        Employee Dashboard
      </Typography>

      <Typography sx={{ mt: 2 }}>
        Welcome Employee
      </Typography>
    </Box>
  );
}