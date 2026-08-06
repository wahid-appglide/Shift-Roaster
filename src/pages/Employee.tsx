import { Box, Card, CardContent, Typography, Button } from "@mui/material";

import { useNavigate } from "react-router-dom";



import GroupsIcon from "@mui/icons-material/Groups";

import EngineeringIcon from "@mui/icons-material/Engineering";



import Navbar from "../components/Navbar";

import Sidebar from "../components/Sidebar";



export default function Employee() {

  const navigate = useNavigate();



  return (

    <>

      <Navbar />

      <Sidebar />



      <Box

        sx={{

          ml: "250px",

          mt: "80px",

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

          mb={5}

        >

          Employee Management

        </Typography>



        <Box

          sx={{

            display: "flex",

            justifyContent: "center",

            gap: 6,

            flexWrap: "wrap",

          }}

        >

          {/* NOC TEAM */}



          <Card

            sx={{

              width: 350,

              borderRadius: 4,

              boxShadow: 8,

              textAlign: "center",

            }}

          >

            <CardContent>



              <GroupsIcon

                sx={{

                  fontSize: 70,

                  color: "#1976d2",

                  mb: 2,

                }}

              />



              <Typography variant="h5" fontWeight="bold">

                NOC TEAM

              </Typography>



              <Typography color="text.secondary" mt={2}>

                Rule Based Shift Allocation

              </Typography>



              <Typography mt={2}>

                Employees : 10

              </Typography>



              <Button

                variant="contained"

                sx={{

                  mt: 4,

                  width: "100%",

                  py: 1.2,

                }}

                onClick={() => navigate("/employees/noc")}

              >

                Manage NOC Team

              </Button>



            </CardContent>

          </Card>



          {/* SRE TEAM */}



          <Card

            sx={{

              width: 350,

              borderRadius: 4,

              boxShadow: 8,

              textAlign: "center",

            }}

          >

            <CardContent>



              <EngineeringIcon

                sx={{

                  fontSize: 70,

                  color: "#2e7d32",

                  mb: 2,

                }}

              />



              <Typography variant="h5" fontWeight="bold">

                SRE TEAM

              </Typography>



              <Typography color="text.secondary" mt={2}>

                Manual Shift Allocation

              </Typography>



              <Typography mt={2}>

                Employees : 5

              </Typography>



              <Button

                variant="contained"

                color="success"

                sx={{

                  mt: 4,

                  width: "100%",

                  py: 1.2,

                }}

                onClick={() => navigate("/employees/sre")}

              >

                Manage SRE Team

              </Button>



            </CardContent>

          </Card>

        </Box>

      </Box>

    </>

  );

}