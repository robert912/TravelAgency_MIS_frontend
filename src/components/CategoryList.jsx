import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import categoryService from "../services/category.service";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import Card from "@mui/material/Card";
import Swal from 'sweetalert2';

const CategoryList = () => {
    const [categories, setCategories] = useState([]);
    const navigate = useNavigate();

    const fetchCategories = () => {
        categoryService
            .getAll()
            .then((response) => {
                const data = response.data?.data || response.data || [];
                setCategories(Array.isArray(data) ? data : []);
            })
            .catch((error) => {
                console.error("Error al obtener categorías", error);
            });
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    const handleDelete = (id) => {
        Swal.fire({
            title: '¿Estás seguro?',
            text: "¡Esta categoría quedará desactivada!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: 'var(--primary)',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Sí, desactivar',
            cancelButtonText: 'Cancelar'
        }).then((result) => {
            if (result.isConfirmed) {
                categoryService
                    .remove(id)
                    .then(() => {
                        Swal.fire(
                            '¡Desactivado!',
                            'El registro ha sido desactivado correctamente.',
                            'success'
                        );
                        fetchCategories(); // Refresh list
                    })
                    .catch((error) => {
                        console.error("Error al desactivar una temporada", error);
                        Swal.fire(
                            'Error',
                            'Hubo un problema al intentar desactivar el registro.',
                            'error'
                        );
                    });
            }
        });
    };

    return (
        <Box sx={{ maxWidth: 1000, margin: "40px auto", padding: "0 20px" }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" component="h1" fontWeight="bold">
                    Categorías
                </Typography>
                <Button
                    variant="contained"
                    color="primary"
                    startIcon={<AddIcon />}
                    onClick={() => navigate("/admin/categories/add")}
                    sx={{ backgroundColor: "var(--primary)", "&:hover": { backgroundColor: "var(--primary-hover)" } }}
                >
                    Nueva Categoría
                </Button>
            </Box>

            <Card sx={{ boxShadow: "0 4px 12px rgba(0,0,0,0.1)", borderRadius: "12px" }}>
                <TableContainer component={Paper} elevation={0}>
                    <Table sx={{ minWidth: 650 }} aria-label="simple table">
                        <TableHead sx={{ backgroundColor: "var(--bg-color)" }}>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 'bold' }}>ID</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>Nombre de la Categoría</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>Estado</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>Descripción</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 'bold' }}>Acciones</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {categories.map((row) => (
                                <TableRow
                                    key={row.id}
                                    sx={{ "&:last-child td, &:last-child th": { border: 0 }, "&:hover": { backgroundColor: "#fafafa" } }}
                                >
                                    <TableCell component="th" scope="row">
                                        {row.id}
                                    </TableCell>
                                    <TableCell>{row.name}</TableCell>
                                    <TableCell>{row.active ? "Activo" : "Inactivo"}</TableCell>
                                    <TableCell>{row.description}</TableCell>
                                    <TableCell align="right">
                                        <Button
                                            variant="outlined"
                                            color="info"
                                            size="small"
                                            startIcon={<EditIcon />}
                                            onClick={() => navigate(`/admin/categories/edit/${row.id}`)}
                                            sx={{ mr: 1 }}
                                        >
                                            Editar
                                        </Button>
                                        <Button
                                            variant="outlined"
                                            color="error"
                                            size="small"
                                            startIcon={<DeleteIcon />}
                                            onClick={() => handleDelete(row.id)}
                                        >
                                            Eliminar
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}

                            {categories.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                                        No hay categorías registradas en el sistema.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Card>
            <button className="floating-back-btn" style={{ top: "90px" }} onClick={() => navigate("/")}>
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="19" y1="12" x2="5" y2="12"></line>
                    <polyline points="12 19 5 12 12 5"></polyline>
                </svg>
                Volver
            </button>
        </Box>

    );
};

export default CategoryList;
