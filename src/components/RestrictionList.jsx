import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import restrictionService from "../services/restriction.service";
import {
    Box, Button, Typography, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, Paper, Chip,
    TextField, InputAdornment, MenuItem,
    Pagination, Stack, FormControl, InputLabel, Select,
    Tooltip, TableSortLabel, LinearProgress
} from "@mui/material";
import {
    Edit as EditIcon,
    Delete as DeleteIcon,
    Search as SearchIcon,
    ArrowBack as ArrowBackIcon,
    Refresh as RefreshIcon,
    Add as AddIcon,
    Warning as RestrictionIcon,
    CheckCircle as CheckIcon,
    Cancel as CancelIcon
} from "@mui/icons-material";
import Swal from 'sweetalert2';

const RestrictionList = () => {
    const [restrictions, setRestrictions] = useState([]);
    const [filteredRestrictions, setFilteredRestrictions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [orderBy, setOrderBy] = useState("id");
    const [order, setOrder] = useState("desc");
    const [page, setPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    const navigate = useNavigate();

    const fetchRestrictions = async () => {
        setLoading(true);
        try {
            const response = await restrictionService.getAll();
            const data = response.data?.data || response.data || [];
            const restrictionsArray = Array.isArray(data) ? data : [];
            setRestrictions(restrictionsArray);
            setFilteredRestrictions(restrictionsArray);
        } catch (error) {
            console.error("Error al obtener restricciones", error);
            Swal.fire('Error', 'No se pudieron cargar las restricciones', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRestrictions();
    }, []);

    // Filtrar y ordenar
    useEffect(() => {
        let result = [...restrictions];

        if (searchTerm) {
            result = result.filter(restriction =>
                restriction.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                restriction.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                restriction.id?.toString().includes(searchTerm)
            );
        }

        if (statusFilter !== "all") {
            result = result.filter(restriction =>
                statusFilter === "active" ? restriction.active === 1 : restriction.active === 0
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

        setFilteredRestrictions(result);
        setPage(1);
    }, [searchTerm, statusFilter, orderBy, order, restrictions]);

    const handleRequestSort = (property) => {
        const isAsc = orderBy === property && order === "asc";
        setOrder(isAsc ? "desc" : "asc");
        setOrderBy(property);
    };

    const handleDelete = (restriction) => {
        const action = restriction.active === 1 ? "desactivar" : "activar";
        Swal.fire({
            title: `¿${restriction.active === 1 ? 'Desactivar' : 'Activar'} restricción?`,
            html: `
                <div style="text-align: left">
                    <p><strong>${restriction.name}</strong></p>
                    <p>Descripción: ${restriction.description || 'Sin descripción'}</p>
                    <p>Estado actual: ${restriction.active === 1 ? 'Activo' : 'Inactivo'}</p>
                </div>
            `,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: restriction.active === 1 ? '#d33' : 'var(--success)',
            cancelButtonColor: 'var(--primary)',
            confirmButtonText: restriction.active === 1 ? 'Sí, desactivar' : 'Sí, activar',
            cancelButtonText: 'Cancelar'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    restriction.active = restriction.active === 1 ? 0 : 1;
                    await restrictionService.update(restriction);
                    Swal.fire(
                        '¡Completado!',
                        `La restricción ha sido ${restriction.active === 1 ? 'activada' : 'desactivada'} correctamente.`,
                        'success'
                    );
                    fetchRestrictions();
                } catch (error) {
                    console.error("Error", error);
                    Swal.fire('Error', 'Hubo un problema al cambiar el estado', 'error');
                }
            }
        });
    };

    // Paginación
    const paginatedRestrictions = filteredRestrictions.slice(
        (page - 1) * rowsPerPage,
        page * rowsPerPage
    );

    const totalPages = Math.ceil(filteredRestrictions.length / rowsPerPage);

    const columns = [
        { id: 'id', label: 'ID', width: 70, numeric: true },
        { id: 'name', label: 'Nombre', width: 200 },
        { id: 'description', label: 'Descripción', width: 300 },
        { id: 'active', label: 'Estado', width: 100 },
        { id: 'actions', label: 'Acciones', width: 180, align: 'center' }
    ];

    return (
        <Box sx={{ p: 3, bgcolor: '#f5f5f5', minHeight: '100vh' }}>
            {/* Header y filtros */}
            <Paper elevation={0} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                    <Box>
                        <Typography variant="h5" fontWeight="bold" gutterBottom>
                            Administración de Restricciones
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Gestiona todas las restricciones de paquetes: {filteredRestrictions.length} registros encontrados
                            {restrictions.length > 0 && (
                                <span style={{ marginLeft: '8px' }}>
                                    | Activas: {restrictions.filter(r => r.active === 1).length}
                                </span>
                            )}
                        </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                        <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => navigate("/")} size="small">
                            Volver
                        </Button>
                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={() => navigate("/admin/restrictions/add")}
                            sx={{ bgcolor: 'var(--primary)', '&:hover': { bgcolor: 'var(--primary-hover)' } }}
                        >
                            Nueva Restricción
                        </Button>
                    </Box>
                </Box>
            </Paper>

            {/* Filtros */}
            <Paper elevation={0} sx={{ p: 2, mb: 3, borderRadius: 2 }}>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
                    <TextField
                        placeholder="Buscar por nombre, descripción o ID..."
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
                                        <Typography>Cargando restricciones...</Typography>
                                    </TableCell>
                                </TableRow>
                            ) : paginatedRestrictions.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={columns.length} align="center" sx={{ py: 8 }}>
                                        <Typography variant="h6" color="text.secondary" gutterBottom>
                                            No hay restricciones que coincidan con los filtros
                                        </Typography>
                                        <Button variant="outlined" onClick={() => { setSearchTerm(""); setStatusFilter("all"); }} sx={{ mt: 2 }}>
                                            Limpiar filtros
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                paginatedRestrictions.map((restriction) => (
                                    <TableRow
                                        key={restriction.id}
                                        hover
                                        sx={{
                                            '&:hover': { bgcolor: '#fafafa' },
                                            opacity: restriction.active === 1 ? 1 : 0.6
                                        }}
                                    >
                                        <TableCell>{restriction.id}</TableCell>
                                        <TableCell>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <RestrictionIcon fontSize="small" color="action" />
                                                <Typography variant="body2" fontWeight="500">
                                                    {restriction.name}
                                                </Typography>
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            <Tooltip title={restriction.description || 'Sin descripción'} arrow>
                                                <Typography variant="body2" noWrap sx={{ maxWidth: 280 }}>
                                                    {restriction.description || '-'}
                                                </Typography>
                                            </Tooltip>
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                icon={restriction.active === 1 ? <CheckIcon /> : <CancelIcon />}
                                                label={restriction.active === 1 ? "Activo" : "Inactivo"}
                                                color={restriction.active === 1 ? "success" : "default"}
                                                size="small"
                                                variant="outlined"
                                            />
                                        </TableCell>
                                        <TableCell align="right">
                                            <Button
                                                variant="outlined"
                                                color="info"
                                                size="small"
                                                startIcon={<EditIcon />}
                                                onClick={() => navigate(`/admin/restrictions/edit/${restriction.id}`)}
                                                sx={{ mr: 1 }}
                                            >
                                                Editar
                                            </Button>
                                            <Button
                                                variant="outlined"
                                                color={restriction.active === 1 ? "error" : "success"}
                                                size="small"
                                                startIcon={<DeleteIcon />}
                                                onClick={() => handleDelete(restriction)}
                                            >
                                                {restriction.active === 1 ? "Desactivar" : "Activar"}
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>

                {filteredRestrictions.length > 0 && (
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
        </Box>
    );
};

export default RestrictionList;