import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import conditionService from "../services/condition.service";
import {
    Box, Button, Typography, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, Paper, Card
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import Swal from 'sweetalert2';

const ConditionList = () => {
    const [conditions, setConditions] = useState([]);
    const navigate = useNavigate();

    const fetchConditions = () => {
        conditionService.getAll()
            .then((response) => {
                const data = response.data?.data || response.data || [];
                setConditions(Array.isArray(data) ? data : []);
            })
            .catch((error) => {
                console.error("Error al obtener condiciones", error);
            });
    };

    useEffect(() => {
        fetchConditions();
    }, []);

    const handleDelete = (id) => {
        Swal.fire({
            title: '¿Estás seguro?',
            text: "¡Esta condición quedará desactivada!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: 'var(--primary)',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Sí, desactivar',
            cancelButtonText: 'Cancelar'
        }).then((result) => {
            if (result.isConfirmed) {
                conditionService.remove(id)
                    .then(() => {
                        Swal.fire('¡Desactivado!', 'El registro ha sido desactivado.', 'success');
                        fetchConditions();
                    })
                    .catch(() => {
                        Swal.fire('Error', 'No se pudo desactivar el registro.', 'error');
                    });
            }
        });
    };

    return (
        <Box sx={{ maxWidth: 1000, margin: "40px auto", padding: "0 20px" }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" component="h1" fontWeight="bold">
                    Condiciones de Paquetes
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => navigate("/admin/conditions/add")}
                    sx={{ backgroundColor: "var(--primary)" }}
                >
                    Nueva Condición
                </Button>
            </Box>

            <Card sx={{ boxShadow: "0 4px 12px rgba(0,0,0,0.1)", borderRadius: "12px" }}>
                <TableContainer component={Paper} elevation={0}>
                    <Table sx={{ minWidth: 650 }}>
                        <TableHead sx={{ backgroundColor: "var(--bg-color)" }}>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 'bold' }}>ID</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>Nombre</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>Descripción</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>Estado</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 'bold' }}>Acciones</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {conditions.map((row) => (
                                <TableRow key={row.id} sx={{ "&:hover": { backgroundColor: "#fafafa" } }}>
                                    <TableCell>{row.id}</TableCell>
                                    <TableCell>{row.name}</TableCell>
                                    <TableCell>{row.description}</TableCell>
                                    <TableCell>{row.active ? "Activo" : "Inactivo"}</TableCell>
                                    <TableCell align="right">
                                        <Button
                                            size="small"
                                            startIcon={<EditIcon />}
                                            onClick={() => navigate(`/admin/conditions/edit/${row.id}`)}
                                        >
                                            Editar
                                        </Button>
                                        <Button
                                            size="small"
                                            color="error"
                                            startIcon={<DeleteIcon />}
                                            onClick={() => handleDelete(row.id)}
                                        >
                                            Eliminar
                                        </Button>
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

export default ConditionList;