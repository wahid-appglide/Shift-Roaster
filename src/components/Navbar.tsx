import { AppBar, Toolbar, Typography, IconButton, Avatar, Box } from "@mui/material";
import NotificationsIcon from "@mui/icons-material/Notifications";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";

const Navbar = () => {
  return (
    <AppBar
      position="static"
      sx={{
        background: "#1e293b",
        boxShadow: 3,
      }}
    >
      <Toolbar>
        <Typography
          variant="h5"
          sx={{
            flexGrow: 1,
            fontWeight: "bold",
            letterSpacing: 1,
          }}
        >
          Shift Roster Management
        </Typography>

        <IconButton color="inherit">
          <NotificationsIcon />
        </IconButton>

        <Box sx={{ display: "flex", alignItems: "center", ml: 2 }}>
          <Avatar sx={{ bgcolor: "#1976d2", mr: 1 }}>
            <AccountCircleIcon />
          </Avatar>

          <Typography>Admin</Typography>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;