import * as React from "react";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import MenuIcon from "@mui/icons-material/Menu";
import LoginIcon from "@mui/icons-material/Login";
import ConnectingAirportsIcon from '@mui/icons-material/ConnectingAirports';
import { useState } from "react";
import Sidemenu from "./Sidemenu";
import '../App.css'

export default function Navbar() {
    const [open, setOpen] = useState(false);

    const toggleDrawer = (open) => () => {
        setOpen(open);
    };

    return (
        <Box sx={{ flexGrow: 1 }}>
            <AppBar position="static" sx={{ backgroundColor: "#fff", color: "#000", boxShadow: 1 }}>
                <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>

                    {/* IZQUIERDA */}
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                        <IconButton
                            size="large"
                            edge="start"
                            aria-label="menu"
                            onClick={toggleDrawer(true)}
                            sx={{ mr: 2 }}
                        >
                            <MenuIcon />
                        </IconButton>

                        <Typography variant="h4" sx={{ fontWeight: "bold" }}>
                            Travel<span className="primary">Agency</span><ConnectingAirportsIcon />
                        </Typography>
                    </Box>

                    {/* DERECHA */}
                    <Button sx={{ color: "#777777", fontWeight: "bold" }}
                        className="hover-primary"
                        startIcon={<LoginIcon />}
                    >
                        Login
                    </Button>

                </Toolbar>
            </AppBar>

            <Sidemenu open={open} toggleDrawer={toggleDrawer} />
        </Box>
    );
}