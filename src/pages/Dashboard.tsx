import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
} from "@mui/material";

import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";

const Dashboard = () => {
  return (
    <>
      <Navbar />
      <Sidebar />

      <Box
        sx={{
          marginLeft: "250px",
          marginTop: "90px",
          padding: 2,
        }}
      >
        <Typography variant="h4" gutterBottom>
          Dashboard
        </Typography>

        <Grid container spacing={3}>

          <Grid>
            <Card>
              <CardContent>
                <Typography variant="h6">
                  Employees
                </Typography>
                <Typography variant="h3">
                  80
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid>
            <Card>
              <CardContent>
                <Typography variant="h6">
                  Shifts
                </Typography>
                <Typography variant="h3">
                  3
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid>
            <Card>
              <CardContent>
                <Typography variant="h6">
                  Leave Requests
                </Typography>
                <Typography variant="h3">
                  14
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid>
            <Card>
              <CardContent>
                <Typography variant="h6">
                  Today's Staff
                </Typography>
                <Typography variant="h3">
                  70
                </Typography>
              </CardContent>
            </Card>
          </Grid>

        </Grid>
      </Box>
    </>
  );
};

export default Dashboard;