import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import restrictionService from "../services/restriction.service";
import { Box, Button, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Card } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import Swal from 'sweetalert2';

const RestrictionList = () => {
    const [restrictions, setRestrictions] = useState([]);
    const navigate = useNavigate();

    const fetchRestrictions = () => {
        restrictionService.getAll()
            .then(response => {
                const data = response.data?.data || response.data || [];
                setRestrictions(Array.isArray(data) ? data : []);
            })
            .catch(err => console.error("Error al obtener restricciones", err));
    };

    useEffect(() => { fetchRestrictions(); }, []);

    const handleDelete = (id) => {
        Swal.fire({
            title: '¿Eliminar restricción?',
            text: "Se desactivará del sistema",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: 'var(--primary)',
            confirmButtonText: 'Sí, desactivar'
        }).then((result) => {
            if (result.isConfirmed) {
                restrictionService.remove(id).then(() => {
                    Swal.fire('¡Listo!', 'Restricción desactivada', 'success');
                    fetchRestrictions();
                });
            }
        });
    };

    return (
        <Box sx={{ maxWidth: 1000, margin: "40px auto", padding: "0 20px" }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h4" fontWeight="bold">Restricciones</Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => navigate("/admin/restrictions/add")}
                >
                    Nueva Restricción
                </Button>
            </Box>
            <Card sx={{ borderRadius: "12px" }}>
                <TableContainer component={Paper} elevation={0}>
                    <Table>
                        <TableHead sx={{ backgroundColor: "#f5f5f5" }}>
                            <TableRow>
                                <TableCell>ID</TableCell>
                                <TableCell>Nombre</TableCell>
                                <TableCell>Descripción</TableCell>
                                <TableCell align="right">Acciones</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {restrictions.map((row) => (
                                <TableRow key={row.id}>
                                    <TableCell>{row.id}</TableCell>
                                    <TableCell>{row.name}</TableCell>
                                    <TableCell>{row.description}</TableCell>
                                    <TableCell align="right">
                                        <Button size="small" onClick={() => navigate(`/admin/restrictions/edit/${row.id}`)}><EditIcon /></Button>
                                        <Button size="small" color="error" onClick={() => handleDelete(row.id)}><DeleteIcon /></Button>
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

export default RestrictionList;