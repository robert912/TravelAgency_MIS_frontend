import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import conditionService from "../services/condition.service";
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
    Description as ConditionIcon,
    CheckCircle as CheckIcon,
    Cancel as CancelIcon
} from "@mui/icons-material";
import Swal from 'sweetalert2';

const ConditionList = () => {
    const [conditions, setConditions] = useState([]);
    const [filteredConditions, setFilteredConditions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [orderBy, setOrderBy] = useState("id");
    const [order, setOrder] = useState("desc");
    const [page, setPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    const navigate = useNavigate();

    const fetchConditions = async () => {
        setLoading(true);
        try {
            const response = await conditionService.getAll();
            const data = response.data?.data || response.data || [];
            const conditionsArray = Array.isArray(data) ? data : [];
            setConditions(conditionsArray);
            setFilteredConditions(conditionsArray);
        } catch (error) {
            console.error("Error al obtener condiciones", error);
            Swal.fire('Error', 'No se pudieron cargar las condiciones', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchConditions();
    }, []);

    // Filtrar y ordenar
    useEffect(() => {
        let result = [...conditions];

        if (searchTerm) {
            result = result.filter(condition =>
                condition.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                condition.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                condition.id?.toString().includes(searchTerm)
            );
        }

        if (statusFilter !== "all") {
            result = result.filter(condition =>
                statusFilter === "active" ? condition.active === 1 : condition.active === 0
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

        setFilteredConditions(result);
        setPage(1);
    }, [searchTerm, statusFilter, orderBy, order, conditions]);

    const handleRequestSort = (property) => {
        const isAsc = orderBy === property && order === "asc";
        setOrder(isAsc ? "desc" : "asc");
        setOrderBy(property);
    };

    const handleDelete = (condition) => {
        const action = condition.active === 1 ? "desactivar" : "activar";
        Swal.fire({
            title: `¿${condition.active === 1 ? 'Desactivar' : 'Activar'} condición?`,
            html: `
                <div style="text-align: left">
                    <p><strong>${condition.name}</strong></p>
                    <p>Descripción: ${condition.description || 'Sin descripción'}</p>
                    <p>Estado actual: ${condition.active === 1 ? 'Activo' : 'Inactivo'}</p>
                </div>
            `,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: condition.active === 1 ? '#d33' : 'var(--success)',
            cancelButtonColor: 'var(--primary)',
            confirmButtonText: condition.active === 1 ? 'Sí, desactivar' : 'Sí, activar',
            cancelButtonText: 'Cancelar'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    condition.active = condition.active === 1 ? 0 : 1;
                    await conditionService.update(condition);
                    Swal.fire(
                        '¡Completado!',
                        `La condición ha sido ${condition.active === 1 ? 'activada' : 'desactivada'} correctamente.`,
                        'success'
                    );
                    fetchConditions();
                } catch (error) {
                    console.error("Error", error);
                    Swal.fire('Error', 'Hubo un problema al cambiar el estado', 'error');
                }
            }
        });
    };

    // Paginación
    const paginatedConditions = filteredConditions.slice(
        (page - 1) * rowsPerPage,
        page * rowsPerPage
    );

    const totalPages = Math.ceil(filteredConditions.length / rowsPerPage);

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
                            Administración de Condiciones
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Gestiona todas las condiciones de paquetes: {filteredConditions.length} registros encontrados
                            {conditions.length > 0 && (
                                <span style={{ marginLeft: '8px' }}>
                                    | Activas: {conditions.filter(c => c.active === 1).length}
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
                            onClick={() => navigate("/admin/conditions/add")}
                            sx={{ bgcolor: 'var(--primary)', '&:hover': { bgcolor: 'var(--primary-hover)' } }}
                        >
                            Nueva Condición
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
                                        <Typography>Cargando condiciones...</Typography>
                                    </TableCell>
                                </TableRow>
                            ) : paginatedConditions.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={columns.length} align="center" sx={{ py: 8 }}>
                                        <Typography variant="h6" color="text.secondary" gutterBottom>
                                            No hay condiciones que coincidan con los filtros
                                        </Typography>
                                        <Button variant="outlined" onClick={() => { setSearchTerm(""); setStatusFilter("all"); }} sx={{ mt: 2 }}>
                                            Limpiar filtros
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                paginatedConditions.map((condition) => (
                                    <TableRow
                                        key={condition.id}
                                        hover
                                        sx={{
                                            '&:hover': { bgcolor: '#fafafa' },
                                            opacity: condition.active === 1 ? 1 : 0.6
                                        }}
                                    >
                                        <TableCell>{condition.id}</TableCell>
                                        <TableCell>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <ConditionIcon fontSize="small" color="action" />
                                                <Typography variant="body2" fontWeight="500">
                                                    {condition.name}
                                                </Typography>
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            <Tooltip title={condition.description || 'Sin descripción'} arrow>
                                                <Typography variant="body2" noWrap sx={{ maxWidth: 280 }}>
                                                    {condition.description || '-'}
                                                </Typography>
                                            </Tooltip>
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                icon={condition.active === 1 ? <CheckIcon /> : <CancelIcon />}
                                                label={condition.active === 1 ? "Activo" : "Inactivo"}
                                                color={condition.active === 1 ? "success" : "default"}
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
                                                onClick={() => navigate(`/admin/conditions/edit/${condition.id}`)}
                                                sx={{ mr: 1 }}
                                            >
                                                Editar
                                            </Button>
                                            <Button
                                                variant="outlined"
                                                color={condition.active === 1 ? "error" : "success"}
                                                size="small"
                                                startIcon={<DeleteIcon />}
                                                onClick={() => handleDelete(condition)}
                                            >
                                                {condition.active === 1 ? "Desactivar" : "Activar"}
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>

                {filteredConditions.length > 0 && (
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

export default ConditionList;