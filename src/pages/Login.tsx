import { useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const navigate = useNavigate();

  const [role, setRole] = useState("Admin");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = () => {
    // Backend will replace this later

    if (role === "Admin") {
      navigate("/dashboard");
    } else {
      navigate("/employee-dashboard");
    }
  };

  return (
    <Box
      sx={{
        height: "100vh",
        display: "flex",
        background:
          "linear-gradient(135deg,#0f172a,#1e3c72,#2a5298)",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Card
        sx={{
          width: 430,
          borderRadius: 4,
          boxShadow: 10,
          p: 2,
        }}
      >
        <CardContent>

          <Typography
            variant="h4"
            fontWeight="bold"
            align="center"
            gutterBottom
          >
            Shift Roster
          </Typography>

          <Typography
            variant="body1"
            align="center"
            color="text.secondary"
            mb={4}
          >
            Workforce Management System
          </Typography>

          <FormControl fullWidth sx={{ mb: 3 }}>
            <InputLabel>Login As</InputLabel>

            <Select
              value={role}
              label="Login As"
              onChange={(e) => setRole(e.target.value)}
            >
              <MenuItem value="Admin">
                Admin
              </MenuItem>

              <MenuItem value="Employee">
                Employee
              </MenuItem>
            </Select>
          </FormControl>

          <TextField
            fullWidth
            label="Username"
            sx={{ mb: 3 }}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />

          <TextField
            fullWidth
            label="Password"
            type="password"
            sx={{ mb: 4 }}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <Button
            fullWidth
            variant="contained"
            size="large"
            onClick={handleLogin}
            sx={{
              py: 1.5,
              fontWeight: "bold",
              fontSize: 16,
              borderRadius: 2,
            }}
          >
            LOGIN
          </Button>

          <Typography
            align="center"
            mt={3}
            color="gray"
          >
            © 2026 Shift Roster Management System
          </Typography>

        </CardContent>
      </Card>
    </Box>
  );
}