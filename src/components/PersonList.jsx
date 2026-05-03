import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    Box, Button, Typography, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, Paper, Chip,
    IconButton, TextField, InputAdornment, Menu, MenuItem,
    Pagination, Stack, FormControl, InputLabel, Select,
    Tooltip, TableSortLabel, Badge, Dialog, DialogTitle,
    DialogContent, DialogActions, Grid, Divider, Rating,
    Avatar, LinearProgress, CircularProgress, Tab, Tabs
} from "@mui/material";
import {
    Edit as EditIcon,
    Delete as DeleteIcon,
    Visibility as ViewIcon,
    Search as SearchIcon,
    Close as CloseIcon,
    ArrowBack as ArrowBackIcon,
    Person as PersonIcon,
    Email as EmailIcon,
    Phone as PhoneIcon,
    Badge as BadgeIcon,
    Public as PublicIcon,
    CheckCircle as CheckIcon,
    Cancel as CancelIcon,
    Refresh as RefreshIcon,
    Add as AddIcon,
    PersonAdd as PersonAddIcon,
    VerifiedUser as VerifiedIcon,
    Warning as WarningIcon,
    Info as InfoIcon
} from "@mui/icons-material";
import Swal from 'sweetalert2';
import personService from "../services/person.service";

const PersonList = () => {
    const [persons, setPersons] = useState([]);
    const [filteredPersons, setFilteredPersons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [orderBy, setOrderBy] = useState("id");
    const [order, setOrder] = useState("desc");
    const [page, setPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    // Estados para el modal
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedPerson, setSelectedPerson] = useState(null);
    const [modalLoading, setModalLoading] = useState(false);

    const navigate = useNavigate();

    const fetchPersons = async () => {
        setLoading(true);
        try {
            const response = await personService.getAll();
            const data = response.data?.data || response.data || [];
            const personsArray = Array.isArray(data) ? data : [];
            setPersons(personsArray);
            setFilteredPersons(personsArray);
        } catch (error) {
            console.error("Error al obtener personas", error);
            Swal.fire('Error', 'No se pudieron cargar las personas', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPersons();
    }, []);

    // Filtrar y ordenar
    useEffect(() => {
        let result = [...persons];

        if (searchTerm) {
            result = result.filter(person =>
                person.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                person.identification?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                person.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                person.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                person.id?.toString().includes(searchTerm)
            );
        }

        if (statusFilter !== "all") {
            result = result.filter(person =>
                statusFilter === "active" ? person.active === 1 : person.active === 0
            );
        }

        result.sort((a, b) => {
            let aVal = a[orderBy];
            let bVal = b[orderBy];

            if (typeof aVal === 'string') {
                aVal = aVal?.toLowerCase() || '';
                bVal = bVal?.toLowerCase() || '';
            }

            if (aVal < bVal) return order === "asc" ? -1 : 1;
            if (aVal > bVal) return order === "asc" ? 1 : -1;
            return 0;
        });

        setFilteredPersons(result);
        setPage(1);
    }, [searchTerm, statusFilter, orderBy, order, persons]);

    // Abrir modal con detalles de la persona
    const handleViewDetails = async (person) => {
        setSelectedPerson(person);
        setModalOpen(true);
        setModalLoading(true);

        try {
            const response = await personService.get(person.id);
            const detailedData = response.data?.data || response.data;
            setSelectedPerson(detailedData);
        } catch (error) {
            console.error("Error al cargar detalles completos", error);
        } finally {
            setModalLoading(false);
        }
    };

    const handleCloseModal = () => {
        setModalOpen(false);
        setSelectedPerson(null);
    };

    const handleDelete = (person) => {
        const action = person.active === 1 ? "desactivar" : "activar";
        Swal.fire({
            title: `¿${person.active === 1 ? 'Desactivar' : 'Activar'} persona?`,
            html: `
                <div style="text-align: left">
                    <p><strong>${person.fullName}</strong></p>
                    <p>Identificación: ${person.identification}</p>
                    <p>Email: ${person.email}</p>
                    <p>Estado actual: ${person.active === 1 ? 'Activo' : 'Inactivo'}</p>
                </div>
            `,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: person.active === 1 ? '#d33' : 'var(--success)',
            cancelButtonColor: 'var(--primary)',
            confirmButtonText: person.active === 1 ? 'Sí, desactivar' : 'Sí, activar',
            cancelButtonText: 'Cancelar'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    person.active = person.active === 1 ? 0 : 1;
                    await personService.update(person);
                    Swal.fire(
                        '¡Completado!',
                        `La persona ha sido ${person.active === 1 ? 'activada' : 'desactivada'} correctamente.`,
                        'success'
                    );
                    fetchPersons();
                    if (selectedPerson?.id === person.id) {
                        handleCloseModal();
                    }
                } catch (error) {
                    console.error("Error", error);
                    Swal.fire('Error', 'Hubo un problema al cambiar el estado', 'error');
                }
            }
        });
    };

    const handleRequestSort = (property) => {
        const isAsc = orderBy === property && order === "asc";
        setOrder(isAsc ? "desc" : "asc");
        setOrderBy(property);
    };

    // Paginación
    const paginatedPersons = filteredPersons.slice(
        (page - 1) * rowsPerPage,
        page * rowsPerPage
    );

    const totalPages = Math.ceil(filteredPersons.length / rowsPerPage);

    const columns = [
        { id: 'id', label: 'ID', width: 70, numeric: true },
        { id: 'fullName', label: 'Nombre Completo', width: 200 },
        { id: 'identification', label: 'Identificación', width: 130 },
        { id: 'email', label: 'Email', width: 200 },
        { id: 'phone', label: 'Teléfono', width: 120 },
        { id: 'nationality', label: 'Nacionalidad', width: 100 },
        { id: 'active', label: 'Estado', width: 100 },
        { id: 'actions', label: 'Acciones', width: 150, align: 'center' }
    ];

    return (
        <Box sx={{ p: 3, bgcolor: '#f5f5f5', minHeight: '100vh' }}>
            {/* Header y filtros */}
            <Paper elevation={0} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                    <Box>
                        <Typography variant="h5" fontWeight="bold" gutterBottom>
                            Administración de Personas
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Gestiona todos los clientes y personas: {filteredPersons.length} registros encontrados
                            {persons.length > 0 && (
                                <span style={{ marginLeft: '8px' }}>
                                    | Activos: {persons.filter(p => p.active === 1).length}
                                </span>
                            )}
                        </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                        <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => navigate("/")} size="small">
                            Volver
                        </Button>
                        <Button variant="outlined" startIcon={<RefreshIcon />} onClick={fetchPersons} size="small">
                            Actualizar
                        </Button>
                        <Button
                            variant="contained"
                            startIcon={<PersonAddIcon />}
                            onClick={() => navigate("/admin/persons/add")}
                            sx={{ bgcolor: 'var(--primary)', '&:hover': { bgcolor: 'var(--primary-hover)' } }}
                        >
                            Nueva Persona
                        </Button>
                    </Box>
                </Box>
            </Paper>

            {/* Filtros */}
            <Paper elevation={0} sx={{ p: 2, mb: 3, borderRadius: 2 }}>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
                    <TextField
                        placeholder="Buscar por nombre, identificación, email o teléfono..."
                        size="small"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        sx={{ flex: 2 }}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon fontSize="small" />
                                </InputAdornment>
                            ),
                        }}
                    />

                    <FormControl size="small" sx={{ minWidth: 150 }}>
                        <InputLabel>Estado</InputLabel>
                        <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} label="Estado">
                            <MenuItem value="all">Todos</MenuItem>
                            <MenuItem value="active">Activos</MenuItem>
                            <MenuItem value="inactive">Inactivos</MenuItem>
                        </Select>
                    </FormControl>

                    <FormControl size="small" sx={{ minWidth: 100 }}>
                        <InputLabel>Mostrar</InputLabel>
                        <Select value={rowsPerPage} onChange={(e) => setRowsPerPage(e.target.value)} label="Mostrar">
                            <MenuItem value={10}>10</MenuItem>
                            <MenuItem value={25}>25</MenuItem>
                            <MenuItem value={50}>50</MenuItem>
                            <MenuItem value={100}>100</MenuItem>
                        </Select>
                    </FormControl>
                </Stack>
            </Paper>

            {/* Tabla */}
            <Paper elevation={0} sx={{ borderRadius: 2, overflow: 'hidden' }}>
                <TableContainer sx={{ overflowX: 'auto' }}>
                    <Table stickyHeader size="medium">
                        <TableHead>
                            <TableRow sx={{ bgcolor: '#fafafa' }}>
                                {columns.map((col) => (
                                    <TableCell
                                        key={col.id}
                                        align={col.align || (col.numeric ? 'right' : 'left')}
                                        sx={{ width: col.width, fontWeight: 'bold', bgcolor: '#fafafa' }}
                                    >
                                        {col.id !== 'actions' ? (
                                            <TableSortLabel
                                                active={orderBy === col.id}
                                                direction={orderBy === col.id ? order : 'asc'}
                                                onClick={() => handleRequestSort(col.id)}
                                            >
                                                {col.label}
                                            </TableSortLabel>
                                        ) : (
                                            col.label
                                        )}
                                    </TableCell>
                                ))}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={columns.length} align="center" sx={{ py: 8 }}>
                                        <LinearProgress sx={{ maxWidth: 400, mx: 'auto', mb: 2 }} />
                                        <Typography>Cargando personas...</Typography>
                                    </TableCell>
                                </TableRow>
                            ) : paginatedPersons.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={columns.length} align="center" sx={{ py: 8 }}>
                                        <Typography variant="h6" color="text.secondary" gutterBottom>
                                            No hay personas que coincidan con los filtros
                                        </Typography>
                                        <Button variant="outlined" onClick={() => { setSearchTerm(""); setStatusFilter("all"); }} sx={{ mt: 2 }}>
                                            Limpiar filtros
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                paginatedPersons.map((person) => (
                                    <TableRow
                                        key={person.id}
                                        hover
                                        sx={{
                                            '&:hover': { bgcolor: '#fafafa' },
                                            opacity: person.active === 1 ? 1 : 0.6
                                        }}
                                    >
                                        <TableCell>{person.id}</TableCell>
                                        <TableCell>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <PersonIcon fontSize="small" color="action" />
                                                <Typography variant="body2" fontWeight="500">
                                                    {person.fullName || 'Sin nombre'}
                                                </Typography>
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                <BadgeIcon fontSize="small" color="action" />
                                                {person.identification || '-'}
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                <EmailIcon fontSize="small" color="action" />
                                                {person.email || '-'}
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                <PhoneIcon fontSize="small" color="action" />
                                                {person.phone || '-'}
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                <PublicIcon fontSize="small" color="action" />
                                                {person.nationality || '-'}
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                icon={person.active === 1 ? <CheckIcon /> : <CancelIcon />}
                                                label={person.active === 1 ? "Activo" : "Inactivo"}
                                                color={person.active === 1 ? "success" : "default"}
                                                size="small"
                                                variant="outlined"
                                            />
                                        </TableCell>
                                        <TableCell align="center">
                                            <Stack direction="row" spacing={1} justifyContent="center">
                                                <Tooltip title="Ver detalles">
                                                    <IconButton
                                                        size="small"
                                                        color="info"
                                                        onClick={() => handleViewDetails(person)}
                                                    >
                                                        <ViewIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="Editar">
                                                    <IconButton
                                                        size="small"
                                                        color="primary"
                                                        onClick={() => navigate(`/admin/persons/edit/${person.id}`)}
                                                    >
                                                        <EditIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title={person.active === 1 ? "Desactivar" : "Activar"}>
                                                    <IconButton
                                                        size="small"
                                                        color={person.active === 1 ? "error" : "success"}
                                                        onClick={() => handleDelete(person)}
                                                    >
                                                        {person.active === 1 ? <DeleteIcon fontSize="small" /> : <CheckIcon fontSize="small" />}
                                                    </IconButton>
                                                </Tooltip>
                                            </Stack>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>

                {filteredPersons.length > 0 && (
                    <Box sx={{ p: 2, display: 'flex', justifyContent: 'flex-end' }}>
                        <Pagination
                            count={totalPages}
                            page={page}
                            onChange={(e, value) => setPage(value)}
                            color="primary"
                            showFirstButton
                            showLastButton
                        />
                    </Box>
                )}
            </Paper>

            {/* MODAL DE DETALLES */}
            <Dialog
                open={modalOpen}
                onClose={handleCloseModal}
                maxWidth="sm"
                fullWidth
                PaperProps={{
                    sx: {
                        borderRadius: 2,
                        maxHeight: '85vh'
                    }
                }}
            >
                {modalLoading ? (
                    <Box sx={{ p: 4, textAlign: 'center' }}>
                        <CircularProgress size={40} />
                        <Typography sx={{ mt: 2 }}>Cargando datos...</Typography>
                    </Box>
                ) : selectedPerson && (
                    <>
                        {/* Header */}
                        <DialogTitle sx={{
                            borderBottom: '1px solid',
                            borderColor: 'divider',
                            py: 2,
                            px: 3,
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            bgcolor: '#fafafa'
                        }}>
                            <Box>
                                <Typography variant="subtitle2" color="text.secondary">
                                    Persona #{selectedPerson.id}
                                </Typography>
                                <Typography variant="h6" component="span" fontWeight="bold">
                                    {selectedPerson.fullName}
                                </Typography>
                            </Box>
                            <IconButton onClick={handleCloseModal} size="small">
                                <CloseIcon />
                            </IconButton>
                        </DialogTitle>

                        <DialogContent sx={{ p: 3 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
                                <Avatar sx={{ width: 80, height: 80, bgcolor: 'var(--primary)' }}>
                                    <PersonIcon sx={{ fontSize: 40 }} />
                                </Avatar>
                            </Box>

                            <Grid container spacing={2}>
                                <Grid item xs={12}>
                                    <Divider sx={{ my: 1 }}>
                                        <Chip label="Información Personal" size="small" />
                                    </Divider>
                                </Grid>

                                <Grid item xs={12} sm={6}>
                                    <Typography variant="caption" color="text.secondary">Nombre Completo</Typography>
                                    <Typography variant="body1" fontWeight="500">
                                        {selectedPerson.fullName || 'No especificado'}
                                    </Typography>
                                </Grid>

                                <Grid item xs={12} sm={6}>
                                    <Typography variant="caption" color="text.secondary">Identificación</Typography>
                                    <Typography variant="body1" fontWeight="500">
                                        {selectedPerson.identification || 'No especificada'}
                                    </Typography>
                                </Grid>

                                <Grid item xs={12} sm={6}>
                                    <Typography variant="caption" color="text.secondary">Correo Electrónico</Typography>
                                    <Typography variant="body1">
                                        {selectedPerson.email || 'No especificado'}
                                    </Typography>
                                </Grid>

                                <Grid item xs={12} sm={6}>
                                    <Typography variant="caption" color="text.secondary">Teléfono</Typography>
                                    <Typography variant="body1">
                                        {selectedPerson.phone || 'No especificado'}
                                    </Typography>
                                </Grid>

                                <Grid item xs={12} sm={6}>
                                    <Typography variant="caption" color="text.secondary">Nacionalidad</Typography>
                                    <Typography variant="body1">
                                        {selectedPerson.nationality || 'No especificada'}
                                    </Typography>
                                </Grid>

                                <Grid item xs={12} sm={6}>
                                    <Typography variant="caption" color="text.secondary">Estado</Typography>
                                    <Chip
                                        label={selectedPerson.active === 1 ? "Activo" : "Inactivo"}
                                        color={selectedPerson.active === 1 ? "success" : "default"}
                                        size="small"
                                        sx={{ mt: 0.5 }}
                                    />
                                </Grid>

                                <Grid item xs={12}>
                                    <Divider sx={{ my: 1 }}>
                                        <Chip label="Información del Sistema" size="small" />
                                    </Divider>
                                </Grid>

                                {selectedPerson.createdAt && (
                                    <Grid item xs={12} sm={6}>
                                        <Typography variant="caption" color="text.secondary">Fecha de Creación</Typography>
                                        <Typography variant="body2">
                                            {new Date(selectedPerson.createdAt).toLocaleString()}
                                        </Typography>
                                    </Grid>
                                )}

                                {selectedPerson.updatedAt && (
                                    <Grid item xs={12} sm={6}>
                                        <Typography variant="caption" color="text.secondary">Última Modificación</Typography>
                                        <Typography variant="body2">
                                            {new Date(selectedPerson.updatedAt).toLocaleString()}
                                        </Typography>
                                    </Grid>
                                )}
                            </Grid>
                        </DialogContent>

                        {/* Acciones */}
                        <DialogActions sx={{ p: 2, gap: 1, borderTop: '1px solid', borderColor: 'divider' }}>
                            <Button variant="text" onClick={handleCloseModal}>
                                Cerrar
                            </Button>
                            <Button
                                variant="outlined"
                                color="primary"
                                onClick={() => {
                                    handleCloseModal();
                                    navigate(`/admin/persons/edit/${selectedPerson.id}`);
                                }}
                                startIcon={<EditIcon />}
                            >
                                Editar
                            </Button>
                            <Button
                                variant="contained"
                                color={selectedPerson.active === 1 ? "error" : "success"}
                                onClick={() => {
                                    handleCloseModal();
                                    handleDelete(selectedPerson);
                                }}
                                startIcon={selectedPerson.active === 1 ? <DeleteIcon /> : <CheckIcon />}
                            >
                                {selectedPerson.active === 1 ? 'Desactivar' : 'Activar'}
                            </Button>
                        </DialogActions>
                    </>
                )}
            </Dialog>
        </Box>
    );
};

export default PersonList;