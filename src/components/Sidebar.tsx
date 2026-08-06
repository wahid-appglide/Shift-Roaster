import {
  Avatar,
  Box,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
} from "@mui/material";

import DashboardIcon from "@mui/icons-material/Dashboard";
import GroupsIcon from "@mui/icons-material/Groups";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import EventBusyIcon from "@mui/icons-material/EventBusy";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import AssessmentIcon from "@mui/icons-material/Assessment";
import LogoutIcon from "@mui/icons-material/Logout";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";

import { NavLink } from "react-router-dom";

const drawerWidth = 260;

const menuItems = [
  { text: "Dashboard", icon: <DashboardIcon />, path: "/dashboard" },
  { text: "Employees", icon: <GroupsIcon />, path: "/employee" },
  { text: "Shifts", icon: <AccessTimeIcon />, path: "/shift" },
  { text: "Leave", icon: <EventBusyIcon />, path: "/leave" },
  { text: "Calendar", icon: <CalendarMonthIcon />, path: "/calendar" },
  { text: "Reports", icon: <AssessmentIcon />, path: "/reports" },
  { text: "Logout", icon: <LogoutIcon />, path: "/" },
];

export default function Sidebar() {
  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,

        "& .MuiDrawer-paper": {
          width: drawerWidth,
          border: "none",

          background:
            "linear-gradient(180deg,#0f172a 0%, #111827 50%, #1e3a8a 100%)",

          color: "white",

          boxShadow: "8px 0 25px rgba(0,0,0,0.5)",
        },
      }}
    >
      <Toolbar />

      {/* Logo */}

      <Box
        sx={{
          textAlign: "center",
          mb: 3,
        }}
      >
        <Typography
          variant="h4"
          fontWeight="bold"
          sx={{
            color: "#60a5fa",
            letterSpacing: 1,
            textShadow: "0 0 15px #3b82f6",
          }}
        >
          Shift
        </Typography>

        <Typography
          variant="h5"
          fontWeight="bold"
          sx={{
            color: "white",
          }}
        >
          Roster
        </Typography>
      </Box>

      {/* Admin */}

      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 2,
          px: 3,
          mb: 4,
        }}
      >
        <Avatar
          sx={{
            bgcolor: "#2563eb",
            width: 55,
            height: 55,
          }}
        >
          <AdminPanelSettingsIcon />
        </Avatar>

        <Box>
          <Typography fontWeight="bold">
            Admin
          </Typography>

          <Typography
            variant="body2"
            color="gray"
          >
            Administrator
          </Typography>
        </Box>
      </Box>

      {/* Menu */}

      <List sx={{ px: 2 }}>

        {menuItems.map((item) => (

          <ListItemButton
            key={item.text}
            component={NavLink}
            to={item.path}
            sx={{
              borderRadius: "14px",

              mb: 1,

              transition: "0.35s",

              "& .MuiListItemIcon-root": {
                color: "#dbeafe",
                transition: "0.35s",
              },

              "& .MuiListItemText-primary": {
                fontWeight: 600,
                fontSize: "16px",
              },

              "&:hover": {
                background:
                  "linear-gradient(90deg,#2563eb,#3b82f6)",

                transform: "scale(1.05)",

                boxShadow:
                  "0 0 18px rgba(59,130,246,.8)",

                "& .MuiListItemIcon-root": {
                  transform: "scale(1.2)",
                  color: "white",
                },
              },

              "&.active": {
                background:
                  "linear-gradient(90deg,#2563eb,#60a5fa)",

                borderLeft: "5px solid white",

                boxShadow:
                  "0 0 20px rgba(96,165,250,.9)",

                position: "relative",

                "&::after": {
                  content: '""',

                  position: "absolute",

                  bottom: 8,

                  left: 55,

                  width: "55%",

                  height: "2px",

                  background: "white",

                  borderRadius: "2px",
                },
              },
            }}
          >
            <ListItemIcon>
              {item.icon}
            </ListItemIcon>

            <ListItemText primary={item.text} />

          </ListItemButton>

        ))}

      </List>
    </Drawer>
  );
}