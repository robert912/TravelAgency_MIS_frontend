import * as React from "react";
import Box from "@mui/material/Box";
import Drawer from "@mui/material/Drawer";
import List from "@mui/material/List";
import Divider from "@mui/material/Divider";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import PeopleAltIcon from "@mui/icons-material/PeopleAlt";
import PaidIcon from "@mui/icons-material/Paid";
import CalculateIcon from "@mui/icons-material/Calculate";
import AnalyticsIcon from "@mui/icons-material/Analytics";
import DiscountIcon from "@mui/icons-material/Discount";
import HailIcon from "@mui/icons-material/Hail";
import MedicationLiquidIcon from "@mui/icons-material/MedicationLiquid";
import MoreTimeIcon from "@mui/icons-material/MoreTime";
import HomeIcon from "@mui/icons-material/Home";
import TourIcon from '@mui/icons-material/Tour';
import FreeCancellationIcon from '@mui/icons-material/FreeCancellation';
import CategoryIcon from '@mui/icons-material/Category';
import ReservationIcon from '@mui/icons-material/AssignmentTurnedIn';
import { useNavigate } from "react-router-dom";

export default function Sidemenu({ open, toggleDrawer }) {
    const navigate = useNavigate();

    const listOptions = () => (
        <Box
            role="presentation"
            onClick={toggleDrawer(false)}
        >
            <List>
                <ListItemButton onClick={() => navigate("/")}>
                    <ListItemIcon>
                        <HomeIcon />
                    </ListItemIcon>
                    <ListItemText primary="Home" />
                </ListItemButton>

                <Divider />

                <ListItemButton onClick={() => navigate("/admin/persons")}>
                    <ListItemIcon>
                        <PeopleAltIcon />
                    </ListItemIcon>
                    <ListItemText primary="Personas" />
                </ListItemButton>

                <ListItemButton onClick={() => navigate("/admin/packages")}>
                    <ListItemIcon>
                        <PaidIcon />
                    </ListItemIcon>
                    <ListItemText primary="Paquetes Turísticos" />
                </ListItemButton>

                <ListItemButton onClick={() => navigate("/admin/reservations")}>
                    <ListItemIcon>
                        <ReservationIcon />
                    </ListItemIcon>
                    <ListItemText primary="Reservas" />
                </ListItemButton>

                <ListItemButton onClick={() => navigate("/admin/travel-types")}>
                    <ListItemIcon>
                        <TourIcon />
                    </ListItemIcon>
                    <ListItemText primary="Tipos de Viajes" />
                </ListItemButton>

                <ListItemButton onClick={() => navigate("/admin/seasons")}>
                    <ListItemIcon>
                        <FreeCancellationIcon />
                    </ListItemIcon>
                    <ListItemText primary="Temporadas" />
                </ListItemButton>

                <ListItemButton onClick={() => navigate("/admin/categories")}>
                    <ListItemIcon>
                        <CategoryIcon />
                    </ListItemIcon>
                    <ListItemText primary="Categorías" />
                </ListItemButton>

                <ListItemButton onClick={() => navigate("/admin/conditions")}>
                    <ListItemIcon>
                        <CalculateIcon />
                    </ListItemIcon>
                    <ListItemText primary="Condiciones" />
                </ListItemButton>

                <ListItemButton onClick={() => navigate("/admin/restrictions")}>
                    <ListItemIcon>
                        <CalculateIcon />
                    </ListItemIcon>
                    <ListItemText primary="Restricciones" />
                </ListItemButton>

                <ListItemButton onClick={() => navigate("/admin/services")}>
                    <ListItemIcon>
                        <CalculateIcon />
                    </ListItemIcon>
                    <ListItemText primary="Servicios" />
                </ListItemButton>
            </List>

            <Divider />

            <List>
                <ListItemButton onClick={() => navigate("/my-reservations")}>
                    <ListItemIcon>
                        <DiscountIcon />
                    </ListItemIcon>
                    <ListItemText primary="Mis reservas" />
                </ListItemButton>
            </List>
        </Box>
    );

    return (
        <div>
            <Drawer anchor={"left"} open={open} onClose={toggleDrawer(false)}>
                {listOptions()}
            </Drawer>
        </div>
    );
}
