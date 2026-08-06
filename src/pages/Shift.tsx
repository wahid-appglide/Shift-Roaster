import { useState } from "react";

import {
  Box,
  Button,
  Card,
  CardContent,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Typography,
} from "@mui/material";

import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";

import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";

export default function ShiftManagement() {

  const [month, setMonth] = useState("August");
  const [year, setYear] = useState("2026");
  const [team, setTeam] = useState("NOC");

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
          mb={4}
          textAlign="center"
        >
          Shift Management
        </Typography>

        <Paper
          elevation={6}
          sx={{
            p: 3,
            borderRadius: 3,
            mb: 4,
          }}
        >
          <Grid container spacing={3}>

            <Grid item xs={12} md={4}>
              <FormControl fullWidth>

                <InputLabel>
                  Month
                </InputLabel>

                <Select
                  value={month}
                  label="Month"
                  onChange={(e) => setMonth(e.target.value)}
                >
                  <MenuItem value="January">January</MenuItem>
                  <MenuItem value="February">February</MenuItem>
                  <MenuItem value="March">March</MenuItem>
                  <MenuItem value="April">April</MenuItem>
                  <MenuItem value="May">May</MenuItem>
                  <MenuItem value="June">June</MenuItem>
                  <MenuItem value="July">July</MenuItem>
                  <MenuItem value="August">August</MenuItem>
                  <MenuItem value="September">September</MenuItem>
                  <MenuItem value="October">October</MenuItem>
                  <MenuItem value="November">November</MenuItem>
                  <MenuItem value="December">December</MenuItem>
                </Select>

              </FormControl>
            </Grid>

            <Grid item xs={12} md={4}>

              <FormControl fullWidth>

                <InputLabel>
                  Year
                </InputLabel>

                <Select
                  value={year}
                  label="Year"
                  onChange={(e) => setYear(e.target.value)}
                >
                  <MenuItem value="2025">2025</MenuItem>
                  <MenuItem value="2026">2026</MenuItem>
                  <MenuItem value="2027">2027</MenuItem>
                </Select>

              </FormControl>

            </Grid>

            <Grid item xs={12} md={4}>

              <FormControl fullWidth>

                <InputLabel>
                  Team
                </InputLabel>

                <Select
                  value={team}
                  label="Team"
                  onChange={(e) => setTeam(e.target.value)}
                >
                  <MenuItem value="NOC">
                    NOC Team
                  </MenuItem>

                  <MenuItem value="SRE">
                    SRE Team
                  </MenuItem>

                </Select>

              </FormControl>

            </Grid>

          </Grid>
        </Paper>

        <Grid container spacing={3}>

          <Grid item xs={12} md={4}>
            <Card elevation={5}>
              <CardContent>

                <Typography
                  variant="h6"
                  fontWeight="bold"
                >
                   Morning Shift
                </Typography>

                <Typography mt={2}>
                  07:00 AM - 03:00 PM
                </Typography>

              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card elevation={5}>
              <CardContent>

                <Typography
                  variant="h6"
                  fontWeight="bold"
                >
                   Evening Shift
                </Typography>

                <Typography mt={2}>
                  03:00 PM - 11:00 PM
                </Typography>

              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card elevation={5}>
              <CardContent>

                <Typography
                  variant="h6"
                  fontWeight="bold"
                >
                   Night Shift
                </Typography>

                <Typography mt={2}>
                  11:00 PM - 07:00 AM
                </Typography>

              </CardContent>
            </Card>
          </Grid>

        </Grid>
                {/* Action Buttons */}

        <Box
          sx={{
            display: "flex",
            gap: 2,
            mt: 5,
            mb: 4,
            flexWrap: "wrap",
            justifyContent: "center",
          }}
        >
          <Button
            variant="contained"
            color="success"
            startIcon={<AutoAwesomeIcon />}
            sx={{
              px: 4,
              py: 1.2,
              textTransform: "none",
              fontWeight: "bold",
            }}
          >
            Generate Shift
          </Button>

          <Button
            variant="contained"
            color="primary"
            startIcon={<CalendarMonthIcon />}
            sx={{
              px: 4,
              py: 1.2,
              textTransform: "none",
              fontWeight: "bold",
            }}
          >
            Publish Roster
          </Button>

          <Button
            variant="outlined"
            color="primary"
            sx={{
              px: 4,
              py: 1.2,
              textTransform: "none",
              fontWeight: "bold",
            }}
          >
            Export Excel
          </Button>

          <Button
            variant="outlined"
            color="error"
            sx={{
              px: 4,
              py: 1.2,
              textTransform: "none",
              fontWeight: "bold",
            }}
          >
            Export PDF
          </Button>
        </Box>

        {/* Monthly Shift Roster */}

        <Paper
          elevation={6}
          sx={{
            borderRadius: 3,
            p: 3,
          }}
        >
          <Typography
            variant="h6"
            fontWeight="bold"
            gutterBottom
          >
            Monthly Shift Roster Preview
          </Typography>

          <Box
            sx={{
              overflowX: "auto",
            }}
          >
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
              }}
            >
              <thead>
                <tr
                  style={{
                    background: "#1976d2",
                    color: "white",
                  }}
                >
                  <th style={{ padding: 12 }}>Employee</th>
                  <th style={{ padding: 12 }}>Department</th>
                  <th style={{ padding: 12 }}>01</th>
                  <th style={{ padding: 12 }}>02</th>
                  <th style={{ padding: 12 }}>03</th>
                  <th style={{ padding: 12 }}>04</th>
                  <th style={{ padding: 12 }}>05</th>
                  <th style={{ padding: 12 }}>06</th>
                  <th style={{ padding: 12 }}>07</th>
                </tr>
              </thead>

              <tbody>

                <tr>
                  <td style={{ padding: 10 }}>Arunprasad</td>
                  <td>NOC</td>
                  <td>M</td>
                  <td>M</td>
                  <td>E</td>
                  <td>N</td>
                  <td>OFF</td>
                  <td>M</td>
                  <td>E</td>
                </tr>

                <tr>
                  <td style={{ padding: 10 }}>Abinaya</td>
                  <td>NOC</td>
                  <td>E</td>
                  <td>E</td>
                  <td>N</td>
                  <td>OFF</td>
                  <td>M</td>
                  <td>M</td>
                  <td>N</td>
                </tr>

                <tr>
                  <td style={{ padding: 10 }}>Saranraj</td>
                  <td>NOC</td>
                  <td>N</td>
                  <td>OFF</td>
                  <td>M</td>
                  <td>M</td>
                  <td>E</td>
                  <td>N</td>
                  <td>M</td>
                </tr>

                <tr>
                  <td style={{ padding: 10 }}>Keerthika</td>
                  <td>NOC</td>
                  <td>M</td>
                  <td>E</td>
                  <td>E</td>
                  <td>M</td>
                  <td>N</td>
                  <td>OFF</td>
                  <td>M</td>
                </tr>

              </tbody>
            </table>
          </Box>
        </Paper>
                {/* Shift Legend */}

        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            gap: 3,
            mt: 4,
            flexWrap: "wrap",
          }}
        >
          <Typography fontWeight="bold">
            🟢 M - Morning (07:00 AM - 03:00 PM)
          </Typography>

          <Typography fontWeight="bold">
            🟠 E - Evening (03:00 PM - 11:00 PM)
          </Typography>

          <Typography fontWeight="bold">
            🔵 N - Night (11:00 PM - 07:00 AM)
          </Typography>

          <Typography fontWeight="bold">
            ⚪ OFF - Weekly Off
          </Typography>
        </Box>

      </Box>
    </>
  );
}