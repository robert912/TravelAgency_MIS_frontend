import * as React from "react";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import MenuIcon from "@mui/icons-material/Menu";
import LoginIcon from "@mui/icons-material/Login";
import LogoutIcon from '@mui/icons-material/Logout';
import ConnectingAirportsIcon from '@mui/icons-material/ConnectingAirports';
import { useState } from "react";
import Sidemenu from "./Sidemenu";
import { useKeycloak } from "@react-keycloak/web";
import '../App.css'

import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import AccountCircle from '@mui/icons-material/AccountCircle';
import { useNavigate } from "react-router-dom";

export default function Navbar() {
    const [open, setOpen] = useState(false);
    const [anchorEl, setAnchorEl] = useState(null);
    const { keycloak, initialized } = useKeycloak();
    const navigate = useNavigate();

    const handleMenu = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const goToProfile = () => {
        handleClose();
        navigate('/profile');
    };

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
                    {initialized && (
                        <>
                            {keycloak.authenticated ? (
                                <Box sx={{ display: "flex", alignItems: "center" }}>
                                    <Button 
                                        onClick={handleMenu} 
                                        sx={{ color: "#777777", fontWeight: "bold", textTransform: 'none' }}
                                        startIcon={<AccountCircle />}
                                    >
                                        {keycloak.tokenParsed?.preferred_username || keycloak.tokenParsed?.email}
                                    </Button>
                                    <Menu
                                        id="menu-appbar"
                                        anchorEl={anchorEl}
                                        anchorOrigin={{
                                            vertical: 'bottom',
                                            horizontal: 'right',
                                        }}
                                        keepMounted
                                        transformOrigin={{
                                            vertical: 'top',
                                            horizontal: 'right',
                                        }}
                                        open={Boolean(anchorEl)}
                                        onClose={handleClose}
                                    >
                                        <MenuItem onClick={goToProfile}>Mi Perfil</MenuItem>
                                        <MenuItem onClick={() => keycloak.logout({ redirectUri: window.location.origin })}>Logout</MenuItem>
                                    </Menu>
                                </Box>

                            ) : (
                                <Button sx={{ color: "#777777", fontWeight: "bold" }}
                                    className="hover-primary"
                                    startIcon={<LoginIcon />} onClick={() => keycloak.login()}>
                                    Login
                                </Button>
                            )}
                        </>
                    )}

                </Toolbar>
            </AppBar>

            <Sidemenu open={open} toggleDrawer={toggleDrawer} />
        </Box>
    );
}