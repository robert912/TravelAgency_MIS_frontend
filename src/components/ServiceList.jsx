import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import serviceService from "../services/service.service";
import { Box, Button, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Card } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import Swal from 'sweetalert2';

const ServiceList = () => {
    const [services, setServices] = useState([]);
    const navigate = useNavigate();

    const fetchServices = () => {
        serviceService.getAll()
            .then(res => setServices(res.data?.data || res.data || []))
            .catch(err => console.error("Error al obtener servicios", err));
    };

    useEffect(() => { fetchServices(); }, []);

    const handleDelete = (id) => {
        Swal.fire({
            title: '¿Desactivar servicio?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Sí, desactivar'
        }).then((result) => {
            if (result.isConfirmed) {
                serviceService.remove(id).then(() => {
                    Swal.fire('Desactivado', '', 'success');
                    fetchServices();
                });
            }
        });
    };

    return (
        <Box sx={{ maxWidth: 1000, margin: "40px auto", padding: "0 20px" }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h4" fontWeight="bold">Servicios Incluidos</Typography>
                <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate("/admin/services/add")}>
                    Nuevo Servicio
                </Button>
            </Box>
            <Card sx={{ borderRadius: "12px" }}>
                <TableContainer component={Paper} elevation={0}>
                    <Table>
                        <TableHead sx={{ backgroundColor: "#f5f5f5" }}>
                            <TableRow>
                                <TableCell>ID</TableCell>
                                <TableCell>Nombre del Servicio</TableCell>
                                <TableCell>Descripción</TableCell>
                                <TableCell align="right">Acciones</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {services.map((row) => (
                                <TableRow key={row.id}>
                                    <TableCell>{row.id}</TableCell>
                                    <TableCell>{row.name}</TableCell>
                                    <TableCell>{row.description}</TableCell>
                                    <TableCell align="right">
                                        <Button onClick={() => navigate(`/admin/services/edit/${row.id}`)}><EditIcon /></Button>
                                        <Button color="error" onClick={() => handleDelete(row.id)}><DeleteIcon /></Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Card>
        </Box>
    );
};

export default ServiceList;