import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import travelTypeService from "../services/travelType.service";
import {
    Box, Button, Typography, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, Paper, Chip,
    IconButton, TextField, InputAdornment, Select, MenuItem,
    Pagination, Stack, FormControl, InputLabel,
    Tooltip, TableSortLabel, LinearProgress
} from "@mui/material";
import {
    Edit as EditIcon,
    Delete as DeleteIcon,
    Search as SearchIcon,
    ArrowBack as ArrowBackIcon,
    Flight as TravelTypeIcon,
    CheckCircle as CheckIcon,
    Cancel as CancelIcon,
    Refresh as RefreshIcon,
    Add as AddIcon
} from "@mui/icons-material";
import Swal from 'sweetalert2';

const TravelTypeList = () => {
    const [travelTypes, setTravelTypes] = useState([]);
    const [filteredTravelTypes, setFilteredTravelTypes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [orderBy, setOrderBy] = useState("id");
    const [order, setOrder] = useState("desc");
    const [page, setPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    const navigate = useNavigate();

    const fetchTravelTypes = async () => {
        setLoading(true);
        try {
            const response = await travelTypeService.getAll();
            const data = response.data?.data || response.data || [];
            const travelTypesArray = Array.isArray(data) ? data : [];
            setTravelTypes(travelTypesArray);
            setFilteredTravelTypes(travelTypesArray);
        } catch (error) {
            console.error("Error al obtener tipos de viaje", error);
            Swal.fire('Error', 'No se pudieron cargar los tipos de viaje', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTravelTypes();
    }, []);

    // Filtrar y ordenar
    useEffect(() => {
        let result = [...travelTypes];

        if (searchTerm) {
            result = result.filter(type =>
                type.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                type.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                type.id?.toString().includes(searchTerm)
            );
        }

        if (statusFilter !== "all") {
            result = result.filter(type =>
                statusFilter === "active" ? type.active === 1 : type.active === 0
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

        setFilteredTravelTypes(result);
        setPage(1);
    }, [searchTerm, statusFilter, orderBy, order, travelTypes]);

    const handleRequestSort = (property) => {
        const isAsc = orderBy === property && order === "asc";
        setOrder(isAsc ? "desc" : "asc");
        setOrderBy(property);
    };

    const handleDelete = (type) => {
        const action = type.active === 1 ? "desactivar" : "activar";
        Swal.fire({
            title: `¿${type.active === 1 ? 'Desactivar' : 'Activar'} tipo de viaje?`,
            html: `
                <div style="text-align: left">
                    <p><strong>${type.name}</strong></p>
                    <p>Descripción: ${type.description || 'Sin descripción'}</p>
                    <p>Estado actual: ${type.active === 1 ? 'Activo' : 'Inactivo'}</p>
                </div>
            `,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: type.active === 1 ? '#d33' : 'var(--success)',
            cancelButtonColor: 'var(--primary)',
            confirmButtonText: type.active === 1 ? 'Sí, desactivar' : 'Sí, activar',
            cancelButtonText: 'Cancelar'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    type.active = type.active === 1 ? 0 : 1;
                    await travelTypeService.update(type);
                    Swal.fire(
                        '¡Completado!',
                        `El tipo de viaje ha sido ${type.active === 1 ? 'activado' : 'desactivado'} correctamente.`,
                        'success'
                    );
                    fetchTravelTypes();
                } catch (error) {
                    console.error("Error", error);
                    Swal.fire('Error', 'Hubo un problema al cambiar el estado', 'error');
                }
            }
        });
    };

    // Paginación
    const paginatedTravelTypes = filteredTravelTypes.slice(
        (page - 1) * rowsPerPage,
        page * rowsPerPage
    );

    const totalPages = Math.ceil(filteredTravelTypes.length / rowsPerPage);

    const columns = [
        { id: 'id', label: 'ID', width: 70, numeric: true },
        { id: 'name', label: 'Nombre', width: 200 },
        { id: 'description', label: 'Descripción', width: 300 },
        { id: 'active', label: 'Estado', width: 100 },
        { id: 'actions', label: 'Acciones', width: 120, align: 'center' }
    ];

    return (
        <Box sx={{ p: 3, bgcolor: '#f5f5f5', minHeight: '100vh' }}>
            {/* Header y filtros */}
            <Paper elevation={0} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                    <Box>
                        <Typography variant="h5" fontWeight="bold" gutterBottom>
                            Administración de Tipos de Viaje
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Gestiona todos los tipos de viaje: {filteredTravelTypes.length} registros encontrados
                            {travelTypes.length > 0 && (
                                <span style={{ marginLeft: '8px' }}>
                                    | Activos: {travelTypes.filter(t => t.active === 1).length}
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
                            onClick={() => navigate("/admin/travel-types/add")}
                            sx={{ bgcolor: 'var(--primary)', '&:hover': { bgcolor: 'var(--primary-hover)' } }}
                        >
                            Nuevo Tipo
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

                    <FormControl size="small" sx={{ minWidth: 100 }}>
                        <InputLabel>Mostrar</InputLabel>
                        <Select
                            value={rowsPerPage}
                            onChange={(e) => setRowsPerPage(e.target.value)}
                            label="Mostrar"
                        >
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
                                        <Typography>Cargando tipos de viaje...</Typography>
                                    </TableCell>
                                </TableRow>
                            ) : paginatedTravelTypes.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={columns.length} align="center" sx={{ py: 8 }}>
                                        <Typography variant="h6" color="text.secondary" gutterBottom>
                                            No hay tipos de viaje que coincidan con los filtros
                                        </Typography>
                                        <Button variant="outlined" onClick={() => { setSearchTerm(""); setStatusFilter("all"); }} sx={{ mt: 2 }}>
                                            Limpiar filtros
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                paginatedTravelTypes.map((type) => (
                                    <TableRow
                                        key={type.id}
                                        hover
                                        sx={{
                                            '&:hover': { bgcolor: '#fafafa' },
                                            opacity: type.active === 1 ? 1 : 0.6
                                        }}
                                    >
                                        <TableCell>{type.id}</TableCell>
                                        <TableCell>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <TravelTypeIcon fontSize="small" color="action" />
                                                <Typography variant="body2" fontWeight="500">
                                                    {type.name}
                                                </Typography>
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            <Tooltip title={type.description || 'Sin descripción'} arrow>
                                                <Typography variant="body2" noWrap sx={{ maxWidth: 280 }}>
                                                    {type.description || '-'}
                                                </Typography>
                                            </Tooltip>
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                icon={type.active === 1 ? <CheckIcon /> : <CancelIcon />}
                                                label={type.active === 1 ? "Activo" : "Inactivo"}
                                                color={type.active === 1 ? "success" : "default"}
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
                                                onClick={() => navigate(`/admin/travel-types/edit/${type.id}`)}
                                                sx={{ mr: 1 }}
                                            >
                                                Editar
                                            </Button>
                                            <Button
                                                variant="outlined"
                                                color={type.active === 1 ? "error" : "success"}
                                                size="small"
                                                startIcon={<DeleteIcon />}
                                                onClick={() => handleDelete(type)}
                                            >
                                                {type.active === 1 ? "Desactivar" : "Activar"}
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>

                {filteredTravelTypes.length > 0 && (
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

export default TravelTypeList;