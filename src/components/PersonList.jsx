import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    Box, Paper, Typography, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, TablePagination, IconButton, Chip, TextField,
    InputAdornment, Button, Stack, Tooltip, Card, CardContent, Grid,
    FormControl, InputLabel, Select, MenuItem, Dialog, DialogTitle,
    DialogContent, DialogContentText, DialogActions, CircularProgress
} from "@mui/material";
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Search as SearchIcon,
    Clear as ClearIcon,
    Visibility as ViewIcon,
    CheckCircle as ActiveIcon,
    Cancel as InactiveIcon,
    Person as PersonIcon,
    Email as EmailIcon,
    Phone as PhoneIcon,
    Badge as BadgeIcon,
    Public as PublicIcon,
    PersonOff as PersonOffIcon
} from "@mui/icons-material";
import Swal from 'sweetalert2';
import personService from "../services/person.service";

const PersonList = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [persons, setPersons] = useState([]);
    const [filteredPersons, setFilteredPersons] = useState([]);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [selectedPerson, setSelectedPerson] = useState(null);

    // Cargar datos
    useEffect(() => {
        fetchPersons();
    }, []);

    // Filtrar personas
    useEffect(() => {
        let filtered = [...persons];

        // Filtro por búsqueda
        if (searchTerm) {
            filtered = filtered.filter(person =>
                person.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                person.identification?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                person.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                person.phone?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Filtro por estado
        if (statusFilter !== "all") {
            filtered = filtered.filter(person =>
                statusFilter === "active" ? person.active === 1 : person.active === 0
            );
        }

        setFilteredPersons(filtered);
        setPage(0);
    }, [searchTerm, statusFilter, persons]);

    const fetchPersons = async () => {
        setLoading(true);
        try {
            const response = await personService.getAll();
            const data = response.data?.data || response.data || [];
            setPersons(data);
            setFilteredPersons(data);
        } catch (error) {
            console.error("Error cargando personas:", error);
            Swal.fire('Error', 'No se pudieron cargar las personas', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const handleSearch = (event) => {
        setSearchTerm(event.target.value);
    };

    const clearSearch = () => {
        setSearchTerm("");
    };

    const handleEdit = (person) => {
        navigate(`/admin/persons/edit/${person.id}`);
    };

    const handleView = (person) => {
        navigate(`/admin/persons/view/${person.id}`);
    };

    const handleDeleteClick = (person) => {
        setSelectedPerson(person);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!selectedPerson) return;

        setLoading(true);
        try {
            await personService.delete(selectedPerson.id);
            Swal.fire('¡Eliminado!', `La persona "${selectedPerson.fullName}" ha sido desactivada`, 'success');
            fetchPersons();
        } catch (error) {
            console.error("Error eliminando persona:", error);
            Swal.fire('Error', error.response?.data?.message || 'No se pudo eliminar la persona', 'error');
        } finally {
            setLoading(false);
            setDeleteDialogOpen(false);
            setSelectedPerson(null);
        }
    };

    const handleToggleStatus = async (person) => {
        const action = person.active === 1 ? "desactivar" : "activar";
        const result = await Swal.fire({
            title: `¿${action === "desactivar" ? "Desactivar" : "Activar"} persona?`,
            text: `¿Estás seguro de que quieres ${action} a "${person.fullName}"?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: action === "desactivar" ? '#d33' : 'var(--primary)',
            confirmButtonText: `Sí, ${action}`,
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            setLoading(true);
            try {
                const updatedPerson = { ...person, active: person.active === 1 ? 0 : 1 };
                await personService.update(updatedPerson);
                Swal.fire('¡Completado!', `Persona ${action}da correctamente`, 'success');
                fetchPersons();
            } catch (error) {
                Swal.fire('Error', 'No se pudo cambiar el estado de la persona', 'error');
            } finally {
                setLoading(false);
            }
        }
    };

    const getStatusChip = (active) => {
        return active === 1 ? (
            <Chip
                label="ACTIVO"
                size="small"
                icon={<ActiveIcon sx={{ fontSize: 16 }} />}
                sx={{ bgcolor: '#e8f5e9', color: '#2e7d32', fontWeight: 'bold' }}
            />
        ) : (
            <Chip
                label="INACTIVO"
                size="small"
                icon={<InactiveIcon sx={{ fontSize: 16 }} />}
                sx={{ bgcolor: '#ffebee', color: '#c62828', fontWeight: 'bold' }}
            />
        );
    };

    if (loading && persons.length === 0) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3, bgcolor: '#f5f7fa', minHeight: '100vh' }}>
            <Paper elevation={0} sx={{ borderRadius: 3, overflow: 'hidden' }}>
                {/* Header */}
                <Box sx={{
                    background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)',
                    color: 'white',
                    p: 4,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: 2
                }}>
                    <Box>
                        <Typography variant="overline" sx={{ opacity: 0.9, letterSpacing: 1.5 }}>
                            GESTIÓN DE PERSONAS
                        </Typography>
                        <Typography variant="h4" fontWeight="bold">
                            Administrador de Personas
                        </Typography>
                        <Typography variant="body2" sx={{ opacity: 0.8, mt: 0.5 }}>
                            Total: {filteredPersons.length} personas | Activas: {persons.filter(p => p.active === 1).length}
                        </Typography>
                    </Box>

                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => navigate('/admin/persons/new')}
                        sx={{
                            bgcolor: 'white',
                            color: 'var(--primary)',
                            '&:hover': { bgcolor: '#f5f5f5' }
                        }}
                    >
                        Nueva Persona
                    </Button>
                </Box>

                {/* Filtros */}
                <Box sx={{ p: 3, borderBottom: '1px solid #e2e8f0' }}>
                    <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                placeholder="Buscar por nombre, identificación, email o teléfono..."
                                value={searchTerm}
                                onChange={handleSearch}
                                size="small"
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <SearchIcon color="action" />
                                        </InputAdornment>
                                    ),
                                    endAdornment: searchTerm && (
                                        <InputAdornment position="end">
                                            <IconButton size="small" onClick={clearSearch}>
                                                <ClearIcon />
                                            </IconButton>
                                        </InputAdornment>
                                    )
                                }}
                            />
                        </Grid>
                        <Grid item xs={12} md={3}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Estado</InputLabel>
                                <Select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    label="Estado"
                                >
                                    <MenuItem value="all">Todos</MenuItem>
                                    <MenuItem value="active">Activos</MenuItem>
                                    <MenuItem value="inactive">Inactivos</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} md={3}>
                            <Button
                                fullWidth
                                variant="outlined"
                                onClick={() => {
                                    setSearchTerm("");
                                    setStatusFilter("all");
                                }}
                                startIcon={<ClearIcon />}
                            >
                                Limpiar filtros
                            </Button>
                        </Grid>
                    </Grid>
                </Box>

                {/* Tabla */}
                <TableContainer>
                    <Table>
                        <TableHead sx={{ bgcolor: '#f8fafc' }}>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 'bold' }}>ID</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>Nombre Completo</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>Identificación</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>Email</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>Teléfono</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>Nacionalidad</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>Estado</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }} align="center">Acciones</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filteredPersons
                                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                .map((person) => (
                                    <TableRow key={person.id} hover>
                                        <TableCell>{person.id}</TableCell>
                                        <TableCell>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <PersonIcon fontSize="small" color="action" />
                                                <Typography variant="body2" fontWeight="500">
                                                    {person.fullName}
                                                </Typography>
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                <BadgeIcon fontSize="small" color="action" />
                                                {person.identification}
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                <EmailIcon fontSize="small" color="action" />
                                                {person.email}
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            {person.phone || '-'}
                                        </TableCell>
                                        <TableCell>
                                            {person.nationality || '-'}
                                        </TableCell>
                                        <TableCell>{getStatusChip(person.active)}</TableCell>
                                        <TableCell align="center">
                                            <Stack direction="row" spacing={1} justifyContent="center">
                                                <Tooltip title="Ver detalles">
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => handleView(person)}
                                                        sx={{ color: '#0288d1' }}
                                                    >
                                                        <ViewIcon />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="Editar">
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => handleEdit(person)}
                                                        sx={{ color: '#ed6c02' }}
                                                    >
                                                        <EditIcon />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title={person.active === 1 ? "Desactivar" : "Activar"}>
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => handleToggleStatus(person)}
                                                        sx={{ color: person.active === 1 ? '#d32f2f' : '#2e7d32' }}
                                                    >
                                                        {person.active === 1 ? <PersonOffIcon /> : <PersonIcon />}
                                                    </IconButton>
                                                </Tooltip>
                                            </Stack>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            {filteredPersons.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={8} align="center" sx={{ py: 8 }}>
                                        <Typography variant="body1" color="text.secondary">
                                            No se encontraron personas
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>

                {/* Paginación */}
                <TablePagination
                    rowsPerPageOptions={[5, 10, 25, 50]}
                    component="div"
                    count={filteredPersons.length}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={handleChangePage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                    labelRowsPerPage="Filas por página:"
                    labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
                />
            </Paper>

            {/* Diálogo de confirmación para eliminar */}
            <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
                <DialogTitle>Confirmar eliminación</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        ¿Estás seguro de que deseas desactivar a "{selectedPerson?.fullName}"?
                        Esta acción puede revertirse posteriormente.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteDialogOpen(false)}>Cancelar</Button>
                    <Button onClick={handleDeleteConfirm} color="error" variant="contained">
                        Desactivar
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default PersonList;