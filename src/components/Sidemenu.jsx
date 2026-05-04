import * as React from "react";
import Box from "@mui/material/Box";
import Drawer from "@mui/material/Drawer";
import List from "@mui/material/List";
import Divider from "@mui/material/Divider";
import Typography from "@mui/material/Typography";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import { useNavigate } from "react-router-dom";
import { useKeycloak } from "@react-keycloak/web";

// Iconos
import HomeIcon from "@mui/icons-material/Home";
import PeopleAltIcon from "@mui/icons-material/PeopleAlt";
import CardTravelIcon from "@mui/icons-material/CardTravel";
import ReceiptIcon from "@mui/icons-material/Receipt";
import FlightIcon from "@mui/icons-material/Flight";
import BeachAccessIcon from "@mui/icons-material/BeachAccess";
import CategoryIcon from "@mui/icons-material/Category";
import DescriptionIcon from "@mui/icons-material/Description";
import WarningIcon from "@mui/icons-material/Warning";
import InventoryIcon from "@mui/icons-material/Inventory";
import PersonIcon from "@mui/icons-material/Person";
import LogoutIcon from "@mui/icons-material/Logout";
import LoginIcon from "@mui/icons-material/Login";

export default function Sidemenu({ open, toggleDrawer }) {
    const navigate = useNavigate();
    const { keycloak } = useKeycloak();

    const roles = keycloak?.tokenParsed?.realm_access?.roles || [];
    const isAdmin = roles.includes('Admin');
    const isAuthenticated = keycloak?.authenticated;

    const handleNavigation = (path) => {
        navigate(path);
        toggleDrawer(false)();
    };

    const handleLogout = () => {
        toggleDrawer(false)();
        keycloak.logout({ redirectUri: window.location.origin });
    };

    const handleLogin = () => {
        toggleDrawer(false)();
        keycloak.login();
    };

    const listOptions = () => (
        <Box
            role="presentation"
            sx={{ width: 280 }}
        >
            {/* Header del menú */}
            <Box sx={{
                p: 2,
                bgcolor: 'var(--primary)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                gap: 1
            }}>
                <CardTravelIcon />
                <Typography variant="h6" fontWeight="bold">
                    TravelApp
                </Typography>
            </Box>

            <List>
                {/* Inicio */}
                <ListItemButton onClick={() => handleNavigation("/")}>
                    <ListItemIcon>
                        <HomeIcon />
                    </ListItemIcon>
                    <ListItemText primary="Inicio" />
                </ListItemButton>

                {isAuthenticated && (
                    <>
                        <Divider />

                        {/* Mis Reservas */}
                        <ListItemButton onClick={() => handleNavigation("/my-reservations")}>
                            <ListItemIcon>
                                <ReceiptIcon />
                            </ListItemIcon>
                            <ListItemText primary="Mis Reservas" />
                        </ListItemButton>

                        {/* Mi Perfil */}
                        <ListItemButton onClick={() => handleNavigation("/profile")}>
                            <ListItemIcon>
                                <PersonIcon />
                            </ListItemIcon>
                            <ListItemText primary="Mi Perfil" />
                        </ListItemButton>
                    </>
                )}

                {isAdmin && (
                    <>
                        <Divider />

                        {/* Administración - Título */}
                        <Box sx={{ px: 2, py: 1 }}>
                            <Typography variant="caption" color="text.secondary">
                                ADMINISTRACIÓN
                            </Typography>
                        </Box>

                        {/* Personas */}
                        <ListItemButton onClick={() => handleNavigation("/admin/persons")}>
                            <ListItemIcon>
                                <PeopleAltIcon />
                            </ListItemIcon>
                            <ListItemText primary="Personas" />
                        </ListItemButton>

                        {/* Paquetes Turísticos */}
                        <ListItemButton onClick={() => handleNavigation("/admin/packages")}>
                            <ListItemIcon>
                                <CardTravelIcon />
                            </ListItemIcon>
                            <ListItemText primary="Paquetes" />
                        </ListItemButton>

                        {/* Reservas */}
                        <ListItemButton onClick={() => handleNavigation("/admin/reservations")}>
                            <ListItemIcon>
                                <ReceiptIcon />
                            </ListItemIcon>
                            <ListItemText primary="Reservas" />
                        </ListItemButton>

                        <Divider />

                        {/* Tipos de Viajes */}
                        <ListItemButton onClick={() => handleNavigation("/admin/travel-types")}>
                            <ListItemIcon>
                                <FlightIcon />
                            </ListItemIcon>
                            <ListItemText primary="Tipos de Viajes" />
                        </ListItemButton>

                        {/* Temporadas */}
                        <ListItemButton onClick={() => handleNavigation("/admin/seasons")}>
                            <ListItemIcon>
                                <BeachAccessIcon />
                            </ListItemIcon>
                            <ListItemText primary="Temporadas" />
                        </ListItemButton>

                        {/* Categorías */}
                        <ListItemButton onClick={() => handleNavigation("/admin/categories")}>
                            <ListItemIcon>
                                <CategoryIcon />
                            </ListItemIcon>
                            <ListItemText primary="Categorías" />
                        </ListItemButton>

                        {/* Condiciones */}
                        <ListItemButton onClick={() => handleNavigation("/admin/conditions")}>
                            <ListItemIcon>
                                <DescriptionIcon />
                            </ListItemIcon>
                            <ListItemText primary="Condiciones" />
                        </ListItemButton>

                        {/* Restricciones */}
                        <ListItemButton onClick={() => handleNavigation("/admin/restrictions")}>
                            <ListItemIcon>
                                <WarningIcon />
                            </ListItemIcon>
                            <ListItemText primary="Restricciones" />
                        </ListItemButton>

                        {/* Servicios */}
                        <ListItemButton onClick={() => handleNavigation("/admin/services")}>
                            <ListItemIcon>
                                <InventoryIcon />
                            </ListItemIcon>
                            <ListItemText primary="Servicios" />
                        </ListItemButton>
                    </>
                )}
            </List>

            <Divider />

            {/* Login / Logout */}
            <List>
                {isAuthenticated ? (
                    <ListItemButton onClick={handleLogout}>
                        <ListItemIcon>
                            <LogoutIcon sx={{ color: '#d32f2f' }} />
                        </ListItemIcon>
                        <ListItemText primary="Cerrar Sesión" sx={{ color: '#d32f2f' }} />
                    </ListItemButton>
                ) : (
                    <ListItemButton onClick={handleLogin}>
                        <ListItemIcon>
                            <LoginIcon color="primary" />
                        </ListItemIcon>
                        <ListItemText primary="Iniciar Sesión" />
                    </ListItemButton>
                )}
            </List>
        </Box>
    );

    return (
        <Drawer anchor="left" open={open} onClose={toggleDrawer(false)}>
            {listOptions()}
        </Drawer>
    );
}