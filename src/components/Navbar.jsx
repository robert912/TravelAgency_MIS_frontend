import * as React from "react";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import MenuIcon from "@mui/icons-material/Menu";
import LoginIcon from "@mui/icons-material/Login";
import LogoutIcon from "@mui/icons-material/Logout";
import ConnectingAirportsIcon from "@mui/icons-material/ConnectingAirports";
import { useState } from "react";
import Sidemenu from "./Sidemenu";
import { useKeycloak } from "@react-keycloak/web";
import '../App.css';

import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Avatar from "@mui/material/Avatar";
import Divider from "@mui/material/Divider";
import ListItemIcon from "@mui/material/ListItemIcon";
import AccountCircle from "@mui/icons-material/AccountCircle";
import ReceiptIcon from "@mui/icons-material/Receipt";
import PersonIcon from "@mui/icons-material/Person";
import SettingsIcon from "@mui/icons-material/Settings";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import { useNavigate } from "react-router-dom";

export default function Navbar() {
    const [open, setOpen] = useState(false);
    const [anchorEl, setAnchorEl] = useState(null);
    const { keycloak, initialized } = useKeycloak();
    const navigate = useNavigate();

    const roles = keycloak?.tokenParsed?.realm_access?.roles || [];
    const isAdmin = roles.includes('Admin');
    const userName = keycloak?.tokenParsed?.given_name + " " + keycloak?.tokenParsed?.family_name || keycloak?.tokenParsed?.preferred_username || keycloak?.tokenParsed?.email;
    const userInitial = userName?.charAt(0)?.toUpperCase() || "U";

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

    const goToMyReservations = () => {
        handleClose();
        navigate('/my-reservations');
    };

    const goToAdmin = () => {
        handleClose();
        navigate('/admin/packages');
    };

    const handleLogout = () => {
        handleClose();
        localStorage.removeItem(`person_id_${keycloak?.subject}`);
        keycloak.logout({ redirectUri: window.location.origin });
    };

    const toggleDrawer = (open) => () => {
        setOpen(open);
    };

    return (
        <Box sx={{ flexGrow: 1 }}>
            <AppBar
                position="sticky"
                sx={{
                    bgcolor: "#fff",
                    color: "#1e293b",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)"
                }}
            >
                <Toolbar sx={{ display: "flex", justifyContent: "space-between", px: { xs: 2, md: 4 } }}>

                    {/* IZQUIERDA */}
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                        <IconButton
                            size="large"
                            edge="start"
                            aria-label="menu"
                            onClick={toggleDrawer(true)}
                            sx={{ mr: 2, color: 'var(--primary)' }}
                        >
                            <MenuIcon />
                        </IconButton>

                        <Box
                            sx={{
                                display: "flex",
                                alignItems: "center",
                                cursor: "pointer",
                                '&:hover': { opacity: 0.8 }
                            }}
                            onClick={() => navigate("/")}
                        >
                            <ConnectingAirportsIcon sx={{ color: 'var(--primary)', fontSize: { xs: 24, md: 32 } }} />
                            <Typography
                                variant="h4"
                                sx={{
                                    fontWeight: "bold",
                                    fontSize: { xs: "1.2rem", sm: "1.5rem", md: "2rem" },
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "4px",
                                    ml: 1
                                }}
                            >
                                Travel<span className="primary" style={{ color: 'var(--primary)' }}>Agency</span>
                            </Typography>
                        </Box>
                    </Box>

                    {/* DERECHA */}
                    {initialized && (
                        <>
                            {keycloak.authenticated ? (
                                <Box sx={{ display: "flex", alignItems: "center" }}>
                                    <Button
                                        onClick={handleMenu}
                                        sx={{
                                            color: "#475569",
                                            fontWeight: 500,
                                            textTransform: 'none',
                                            '&:hover': { bgcolor: 'rgba(37, 99, 235, 0.04)' },
                                            borderRadius: 2,
                                            py: 1,
                                            px: 2
                                        }}
                                        startIcon={
                                            <Avatar sx={{ width: 32, height: 32, bgcolor: 'var(--primary)' }}>
                                                {userInitial}
                                            </Avatar>
                                        }
                                    >
                                        <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
                                            {userName.length > 25 ? userName.substring(0, 25) + '...' : userName}
                                        </Box>
                                    </Button>

                                    <Menu
                                        id="menu-appbar"
                                        anchorEl={anchorEl}
                                        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                                        keepMounted
                                        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                                        open={Boolean(anchorEl)}
                                        onClose={handleClose}
                                        PaperProps={{
                                            sx: {
                                                mt: 1,
                                                minWidth: 200,
                                                borderRadius: 2,
                                                boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                                            }
                                        }}
                                    >
                                        <MenuItem onClick={goToProfile}>
                                            <ListItemIcon>
                                                <PersonIcon fontSize="small" />
                                            </ListItemIcon>
                                            Mi Perfil
                                        </MenuItem>

                                        <MenuItem onClick={goToMyReservations}>
                                            <ListItemIcon>
                                                <ReceiptIcon fontSize="small" />
                                            </ListItemIcon>
                                            Mis Reservas
                                        </MenuItem>

                                        {isAdmin && (
                                            <>
                                                <Divider />
                                                <MenuItem onClick={goToAdmin}>
                                                    <ListItemIcon>
                                                        <AdminPanelSettingsIcon fontSize="small" sx={{ color: 'var(--primary)' }} />
                                                    </ListItemIcon>
                                                    Administración
                                                </MenuItem>
                                            </>
                                        )}

                                        <Divider />

                                        <MenuItem onClick={handleLogout} sx={{ color: '#d32f2f' }}>
                                            <ListItemIcon>
                                                <LogoutIcon fontSize="small" sx={{ color: '#d32f2f' }} />
                                            </ListItemIcon>
                                            Cerrar Sesión
                                        </MenuItem>
                                    </Menu>
                                </Box>
                            ) : (
                                <Button
                                    variant="contained"
                                    startIcon={<LoginIcon />}
                                    onClick={() => keycloak.login()}
                                    sx={{
                                        bgcolor: 'var(--primary)',
                                        '&:hover': { bgcolor: 'var(--primary-hover)' },
                                        textTransform: 'none',
                                        fontWeight: 500,
                                        borderRadius: 2,
                                        px: 3
                                    }}
                                >
                                    Iniciar Sesión
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