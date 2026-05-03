import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import tourPackageService from "../services/tourPackage.service";
import {
    Box, Button, Typography, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, Paper, Chip,
    IconButton, InputAdornment, Menu, MenuItem,
    Pagination, Stack, FormControl, InputLabel, Select,
    Tooltip, TableSortLabel, Badge, Dialog, DialogTitle,
    DialogContent, DialogActions, Grid, Divider, Rating,
    Avatar, LinearProgress, CircularProgress, Tab, Tabs
} from "@mui/material";
import TextField from "@mui/material/TextField"
import {
    Edit as EditIcon,
    Delete as DeleteIcon,
    Visibility as ViewIcon,
    Search as SearchIcon,
    Close as CloseIcon,
    ArrowBack as ArrowBackIcon,
    LocationOn as LocationIcon,
    CalendarToday as CalendarIcon,
    AttachMoney as MoneyIcon,
    People as PeopleIcon,
    Star as StarIcon,
    CheckCircle as CheckIcon,
    Cancel as CancelIcon,
    Refresh as RefreshIcon,
    NoLuggage as NoLuggageIcon,
    Luggage as LuggageIcon,
    Inventory as ServiceIcon,
    Description as ConditionIcon,
    Warning as RestrictionIcon,
    Info as InfoIcon
} from "@mui/icons-material";
import Swal from 'sweetalert2';

const TourPackageList = () => {
    const [packages, setPackages] = useState([]);
    const [filteredPackages, setFilteredPackages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [activeFilter, setActiveFilter] = useState("all");
    const [orderBy, setOrderBy] = useState("id");
    const [order, setOrder] = useState("desc");
    const [page, setPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [availabilityMap, setAvailabilityMap] = useState({});

    // Estados para el modal
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedPackage, setSelectedPackage] = useState(null);
    const [modalLoading, setModalLoading] = useState(false);
    const [modalTab, setModalTab] = useState(0);

    const navigate = useNavigate();

    const fetchPackages = async () => {
        setLoading(true);
        try {
            const response = await tourPackageService.getAll();
            const data = response.data?.data || response.data || [];
            const packagesArray = Array.isArray(data) ? data : [];
            setPackages(packagesArray);
            setFilteredPackages(packagesArray);

            // Cargar disponibilidad para todos los paquetes
            await loadAvailabilityForPackages(packagesArray);
        } catch (error) {
            console.error("Error al obtener paquetes", error);
            Swal.fire('Error', 'No se pudieron cargar los paquetes', 'error');
        } finally {
            setLoading(false);
        }
    };

    const fetchAvailabilityForPackage = async (packageId) => {
        try {
            const response = await tourPackageService.checkAvailabilityForQuantity(packageId, 0);
            const data = response.data?.data || response.data;
            return {
                availableSlots: data.availableSlots || 0,
                reservedSlots: data.reservedSlots || 0,
                totalSlots: data.totalSlots || 0
            };
        } catch (error) {
            console.error(`Error obteniendo disponibilidad del paquete ${packageId}:`, error);
            return null;
        }
    };

    // Cargar disponibilidad para todos los paquetes
    const loadAvailabilityForPackages = async (packagesList) => {
        const availabilityPromises = packagesList.map(pkg =>
            fetchAvailabilityForPackage(pkg.id).then(availability => ({
                id: pkg.id,
                availability
            }))
        );

        const results = await Promise.all(availabilityPromises);
        const availabilityMapData = {};
        results.forEach(result => {
            if (result.availability) {
                availabilityMapData[result.id] = result.availability;
            }
        });
        setAvailabilityMap(availabilityMapData);
    };

    useEffect(() => {
        fetchPackages();
    }, []);

    useEffect(() => {
        if (packages.length > 0) {
            const interval = setInterval(() => {
                loadAvailabilityForPackages(packages);
            }, 30000); // 30 segundos

            return () => clearInterval(interval);
        }
    }, [packages]);

    // Filtrar y ordenar
    useEffect(() => {
        let result = [...packages];

        if (searchTerm) {
            result = result.filter(pkg =>
                pkg.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                pkg.destination?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                pkg.id?.toString().includes(searchTerm)
            );
        }

        if (statusFilter !== "all") {
            result = result.filter(pkg => pkg.status === statusFilter);
        }

        if (activeFilter !== "all") {
            result = result.filter(pkg => pkg.active === (activeFilter === "active"));
        }

        result.sort((a, b) => {
            let aVal = a[orderBy];
            let bVal = b[orderBy];

            if (orderBy === "price") {
                aVal = Number(aVal);
                bVal = Number(bVal);
            }

            if (orderBy === "startDate" || orderBy === "endDate") {
                aVal = new Date(aVal);
                bVal = new Date(bVal);
            }

            if (aVal < bVal) return order === "asc" ? -1 : 1;
            if (aVal > bVal) return order === "asc" ? 1 : -1;
            return 0;
        });

        setFilteredPackages(result);
        setPage(1);
    }, [searchTerm, statusFilter, activeFilter, orderBy, order, packages]);

    // Abrir modal con detalles del paquete
    const handleViewDetails = async (pkg) => {
        setSelectedPackage(pkg);
        setModalOpen(true);
        setModalLoading(true);
        setModalTab(0); // Resetear a la primera pestaña

        try {
            const response = await tourPackageService.get(pkg.id);
            const detailedData = response.data?.data || response.data;
            setSelectedPackage(detailedData);
        } catch (error) {
            console.error("Error al cargar detalles completos", error);
        } finally {
            setModalLoading(false);
        }
    };

    const handleCloseModal = () => {
        setModalOpen(false);
        setSelectedPackage(null);
        setModalTab(0);
    };

    const handleDelete = (pkg) => {
        Swal.fire({
            title: '¿Desactivar paquete?',
            html: `
                <div style="text-align: left">
                    <p><strong>${pkg.name}</strong></p>
                    <p>Destino: ${pkg.destination}</p>
                    <p>Estado actual: ${pkg.active ? 'Activo' : 'Inactivo'}</p>
                </div>
            `,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: pkg.active ? 'var(--error)' : 'var(--success)',
            cancelButtonColor: 'var(--primary)',
            confirmButtonText: pkg.active ? 'Sí, desactivar' : 'Sí, activar',
            cancelButtonText: 'Cancelar'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    pkg.active = pkg.active ? 0 : 1;
                    await tourPackageService.toggleActive(pkg);
                    Swal.fire(
                        '¡Completado!',
                        `El paquete ha sido ${pkg.active ? 'desactivado' : 'activado'} correctamente.`,
                        'success'
                    );
                    fetchPackages();
                    if (selectedPackage?.id === pkg.id) {
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

    const getStatusColor = (status) => {
        const colors = {
            'disponible': 'success',
            'agotado': 'warning',
            'no_vigente': 'info',
            'cancelado': 'error'
        };
        return colors[status?.toLowerCase()] || 'default';
    };

    const getStatusLabel = (status) => {
        const labels = {
            'disponible': 'Disponible',
            'agotado': 'Agotado',
            'no_vigente': 'No vigente',
            'cancelado': 'Cancelado'
        };
        return labels[status?.toLowerCase()] || status;
    };

    // Paginación
    const paginatedPackages = filteredPackages.slice(
        (page - 1) * rowsPerPage,
        page * rowsPerPage
    );

    const totalPages = Math.ceil(filteredPackages.length / rowsPerPage);

    const columns = [
        { id: 'id', label: 'ID', width: 70, numeric: true },
        { id: 'name', label: 'Paquete', width: 200 },
        { id: 'destination', label: 'Destino', width: 150 },
        { id: 'price', label: 'Precio', width: 100, numeric: true, format: (val) => `$${val?.toLocaleString()}` },
        { id: 'startDate', label: 'Inicio', width: 110 },
        { id: 'endDate', label: 'Fin', width: 110 },
        { id: 'totalSlots', label: 'Cupos', width: 80, numeric: true },
        { id: 'status', label: 'Estado', width: 110 },
        { id: 'active', label: 'Activo', width: 90 },
        { id: 'actions', label: 'Acciones', width: 150, align: 'center' }
    ];

    // Función para obtener el ícono del servicio
    const getServiceIcon = (serviceName) => {
        const icons = {
            'Vuelo ida y vuelta': '✈️',
            'Alojamiento': '🏨',
            'Todo incluido': '🍽️',
            'Desayuno incluido': '🍳',
            'Traslados': '🚐',
            'Seguro de viaje': '🛡️',
            'Tours guiados': '🗺️',
            'Entradas a atracciones': '🎫',
            'Actividades incluidas': '🏄',
            'Asistencia 24/7': '📞'
        };
        return icons[serviceName] || '✅';
    };

    // Función para obtener el ícono de la condición
    const getConditionIcon = (conditionName) => {
        if (conditionName?.includes('Cancelación')) return '🔄';
        if (conditionName?.includes('equipaje')) return '🧳';
        if (conditionName?.includes('desayuno')) return '🍳';
        if (conditionName?.includes('público')) return '👨‍👩‍👧‍👦';
        if (conditionName?.includes('Itinerario')) return '📅';
        return '✓';
    };

    // Función para obtener el ícono de la restricción
    const getRestrictionIcon = (restrictionName) => {
        if (restrictionName?.includes('Edad')) return '🔞';
        if (restrictionName?.includes('Cancelación')) return '🔄';
        if (restrictionName?.includes('Menores')) return '👶';
        if (restrictionName?.includes('Máximo')) return '👥';
        if (restrictionName?.includes('Pasaporte')) return '🛂';
        if (restrictionName?.includes('Seguro')) return '🛡️';
        if (restrictionName?.includes('equipaje')) return '🧳';
        if (restrictionName?.includes('Mascotas')) return '🐾';
        if (restrictionName?.includes('Visa')) return '📄';
        if (restrictionName?.includes('Vacuna')) return '💉';
        return '⚠️';
    };

    return (
        <Box sx={{ p: 3, bgcolor: '#f5f5f5', minHeight: '100vh' }}>
            {/* Header y filtros */}
            <Paper elevation={0} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                    <Box>
                        <Typography variant="h5" fontWeight="bold" gutterBottom>
                            Administración de Paquetes
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Gestiona todos los paquetes turísticos: {filteredPackages.length} registros encontrados
                        </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                        <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => navigate("/")} size="small">
                            Volver
                        </Button>
                        <Button variant="outlined" startIcon={<RefreshIcon />} onClick={fetchPackages} size="small">
                            Actualizar
                        </Button>
                        <Button
                            variant="contained"
                            startIcon={<EditIcon />}
                            onClick={() => navigate("/admin/packages/add")}
                            sx={{ bgcolor: 'var(--primary)', '&:hover': { bgcolor: 'var(--primary-hover)' } }}
                        >
                            Nuevo Paquete
                        </Button>
                    </Box>
                </Box>
            </Paper>

            {/* Filtros */}
            <Paper elevation={0} sx={{ p: 2, mb: 3, borderRadius: 2 }}>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
                    <TextField
                        placeholder="Buscar por nombre, destino o ID..."
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
                        <InputLabel>Estado Paquete</InputLabel>
                        <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} label="Estado Paquete">
                            <MenuItem value="all">Todos</MenuItem>
                            <MenuItem value="disponible">Disponible</MenuItem>
                            <MenuItem value="agotado">Agotado</MenuItem>
                            <MenuItem value="no_vigente">No Vigente</MenuItem>
                            <MenuItem value="cancelado">Cancelado</MenuItem>
                        </Select>
                    </FormControl>

                    <FormControl size="small" sx={{ minWidth: 120 }}>
                        <InputLabel>Activo</InputLabel>
                        <Select value={activeFilter} onChange={(e) => setActiveFilter(e.target.value)} label="Activo">
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
                                        <Typography>Cargando paquetes...</Typography>
                                    </TableCell>
                                </TableRow>
                            ) : paginatedPackages.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={columns.length} align="center" sx={{ py: 8 }}>
                                        <Typography variant="h6" color="text.secondary" gutterBottom>
                                            No hay paquetes que coincidan con los filtros
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                paginatedPackages.map((pkg) => (
                                    <TableRow
                                        key={pkg.id}
                                        hover
                                        sx={{
                                            '&:hover': { bgcolor: '#fafafa' },
                                            opacity: pkg.active ? 1 : 0.6
                                        }}
                                    >
                                        <TableCell>{pkg.id}</TableCell>
                                        <TableCell>
                                            <Tooltip title={pkg.description} arrow>
                                                <Typography variant="body2" noWrap sx={{ maxWidth: 180 }}>
                                                    {pkg.name}
                                                </Typography>
                                            </Tooltip>
                                        </TableCell>
                                        <TableCell>{pkg.destination}</TableCell>
                                        <TableCell align="right">
                                            <Typography fontWeight="bold" color="primary.main">
                                                ${pkg.price?.toLocaleString()}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>{pkg.startDate}</TableCell>
                                        <TableCell>{pkg.endDate}</TableCell>
                                        <TableCell align="right">
                                            {availabilityMap[pkg.id] ? (
                                                <Tooltip
                                                    title={`${availabilityMap[pkg.id].reservedSlots} reservados de ${availabilityMap[pkg.id].totalSlots} cupos totales`}
                                                    arrow
                                                >
                                                    <Chip
                                                        label={`${availabilityMap[pkg.id].availableSlots} / ${pkg.totalSlots}`}
                                                        size="small"
                                                        color={availabilityMap[pkg.id].availableSlots < 5 ? "warning" : "default"}
                                                        variant={availabilityMap[pkg.id].availableSlots === 0 ? "filled" : "outlined"}
                                                        sx={{
                                                            fontWeight: 'bold',
                                                            '& .MuiChip-label': {
                                                                display: 'inline-block',
                                                                whiteSpace: 'nowrap'
                                                            }
                                                        }}
                                                    />
                                                </Tooltip>
                                            ) : (
                                                <Chip
                                                    label={pkg.totalSlots}
                                                    size="small"
                                                    variant="outlined"
                                                />
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={getStatusLabel(pkg.status)}
                                                color={getStatusColor(pkg.status)}
                                                size="small"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                icon={pkg.active ? <CheckIcon /> : <CancelIcon />}
                                                label={pkg.active ? "Activo" : "Inactivo"}
                                                color={pkg.active ? "success" : "default"}
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
                                                        onClick={() => handleViewDetails(pkg)}
                                                    >
                                                        <ViewIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="Editar">
                                                    <IconButton
                                                        size="small"
                                                        color="primary"
                                                        onClick={() => navigate(`/admin/packages/edit/${pkg.id}`)}
                                                    >
                                                        <EditIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title={pkg.active ? "Desactivar" : "Activar"}>
                                                    <IconButton
                                                        size="small"
                                                        color={pkg.active ? "error" : "success"}
                                                        onClick={() => handleDelete(pkg)}
                                                    >
                                                        {pkg.active ? <NoLuggageIcon fontSize="small" /> : <LuggageIcon fontSize="small" />}
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

                {filteredPackages.length > 0 && (
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

            {/* MODAL DE DETALLES CON TABS */}
            <Dialog
                open={modalOpen}
                onClose={handleCloseModal}
                maxWidth="md"
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
                ) : selectedPackage && (
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
                                    Paquete #{selectedPackage.id}
                                </Typography>
                                <Typography variant="h6" component="span" fontWeight="bold">
                                    {selectedPackage.name}
                                </Typography>
                            </Box>
                            <IconButton onClick={handleCloseModal} size="small">
                                <CloseIcon />
                            </IconButton>
                        </DialogTitle>

                        {/* Tabs */}
                        <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 3 }}>
                            <Tabs value={modalTab} onChange={(e, newValue) => setModalTab(newValue)}>
                                <Tab label="Información General" icon={<InfoIcon />} iconPosition="start" />
                                <Tab label="Servicios" icon={<ServiceIcon />} iconPosition="start" />
                                <Tab label="Condiciones" icon={<ConditionIcon />} iconPosition="start" />
                                <Tab label="Restricciones" icon={<RestrictionIcon />} iconPosition="start" />
                            </Tabs>
                        </Box>

                        <DialogContent sx={{ p: 0 }}>
                            {/* Tab 0: Información General */}
                            {modalTab === 0 && (
                                <Box sx={{ p: 3 }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                        <tbody>
                                            <tr>
                                                <td style={{ padding: '8px 0', width: '35%', verticalAlign: 'top', color: '#666', fontWeight: 500 }}>
                                                    Destino:
                                                </td>
                                                <td style={{ padding: '8px 0', verticalAlign: 'top' }}>
                                                    {selectedPackage.destination}
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style={{ padding: '8px 0', verticalAlign: 'top', color: '#666', fontWeight: 500 }}>
                                                    Descripción:
                                                </td>
                                                <td style={{ padding: '8px 0', verticalAlign: 'top' }}>
                                                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                                                        {selectedPackage.description || 'Sin descripción'}
                                                    </Typography>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style={{ padding: '8px 0', color: '#666', fontWeight: 500 }}>
                                                    Precio:
                                                </td>
                                                <td style={{ padding: '8px 0' }}>
                                                    <Typography fontWeight="bold" color="primary.main">
                                                        ${selectedPackage.price?.toLocaleString()}
                                                    </Typography>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style={{ padding: '8px 0', color: '#666', fontWeight: 500 }}>
                                                    Fechas:
                                                </td>
                                                <td style={{ padding: '8px 0' }}>
                                                    {selectedPackage.startDate} → {selectedPackage.endDate}
                                                </td>
                                            </tr>

                                            <tr>
                                                <td style={{ padding: '8px 0', width: '20%', color: '#666', fontWeight: 500 }}>
                                                    Cupos disponibles:
                                                </td>
                                                <td style={{ padding: '8px 0' }}>
                                                    {availabilityMap[selectedPackage.id].availableSlots} / {selectedPackage.totalSlots}
                                                    {availabilityMap[selectedPackage.id].reservedSlots > 0 && (
                                                        <Chip
                                                            label={`${availabilityMap[selectedPackage.id].reservedSlots} reservados`}
                                                            size="small"
                                                            variant="outlined"
                                                            color="info"
                                                            sx={{ height: 20, fontSize: '0.7rem', ml: 1 }}
                                                        />
                                                    )}
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style={{ padding: '8px 0', color: '#666', fontWeight: 500 }}>
                                                    Estado paquete:
                                                </td>
                                                <td style={{ padding: '8px 0' }}>
                                                    <Chip
                                                        label={getStatusLabel(selectedPackage.status)}
                                                        color={getStatusColor(selectedPackage.status)}
                                                        size="small"
                                                    />
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style={{ padding: '8px 0', color: '#666', fontWeight: 500 }}>
                                                    Calificación:
                                                </td>
                                                <td className="stars">
                                                    {[1, 2, 3, 4, 5].map((star, i) => (
                                                        <span key={i} className="star" style={{ color: i < (selectedPackage.stars || 0) ? "#ffc107" : "#e0e0e0", fontSize: '20px' }}> ★ </span>
                                                    ))}
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style={{ padding: '8px 0', color: '#666', fontWeight: 500 }}>
                                                    Estado sistema:
                                                </td>
                                                <td style={{ padding: '8px 0' }}>
                                                    <Chip
                                                        label={selectedPackage.active ? "Activo" : "Inactivo"}
                                                        color={selectedPackage.active ? "success" : "default"}
                                                        size="small"
                                                        variant="outlined"
                                                    />
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style={{ padding: '8px 0', verticalAlign: 'top', color: '#666', fontWeight: 500 }}>
                                                    Temporada:
                                                </td>
                                                <td style={{ padding: '8px 0', verticalAlign: 'top' }}>
                                                    {selectedPackage.season?.name || 'No especificada'}
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style={{ padding: '8px 0', verticalAlign: 'top', color: '#666', fontWeight: 500 }}>
                                                    Categoría:
                                                </td>
                                                <td style={{ padding: '8px 0', verticalAlign: 'top' }}>
                                                    {selectedPackage.category?.name || 'No especificada'}
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style={{ padding: '8px 0', verticalAlign: 'top', color: '#666', fontWeight: 500 }}>
                                                    Tipo de Viaje:
                                                </td>
                                                <td style={{ padding: '8px 0', verticalAlign: 'top' }}>
                                                    {selectedPackage.travelType?.name || 'No especificado'}
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </Box>
                            )}

                            {/* Tab 1: Servicios - Versión Compacta */}
                            {modalTab === 1 && (
                                <Box sx={{ p: 2 }}>
                                    <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1.5 }}>
                                        Servicios Incluidos
                                    </Typography>

                                    {selectedPackage.services && selectedPackage.services.length > 0 ? (
                                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                            {selectedPackage.services.map((item, index) => (
                                                <Box
                                                    key={item.id || index}
                                                    sx={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: 1.5,
                                                        p: 1,
                                                        bgcolor: '#f9fafb',
                                                        borderRadius: 1,
                                                        fontSize: '14px'
                                                    }}
                                                >
                                                    <Box sx={{ width: 4, height: 4, bgcolor: '#3b82f6', borderRadius: '50%' }} />
                                                    <Typography variant="body2">
                                                        <strong>{item.service?.name || 'Servicio'}</strong>
                                                        {item.service?.description && `: ${item.service.description}`}
                                                    </Typography>
                                                </Box>
                                            ))}
                                        </Box>
                                    ) : (
                                        <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                                            No hay servicios disponibles
                                        </Typography>
                                    )}
                                </Box>
                            )}

                            {/* Tab 2: Condiciones - Versión Compacta */}
                            {modalTab === 2 && (
                                <Box sx={{ p: 2 }}>
                                    <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1.5 }}>
                                        Condiciones Generales
                                    </Typography>

                                    {selectedPackage.conditions && selectedPackage.conditions.length > 0 ? (
                                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                            {selectedPackage.conditions.map((item, index) => (
                                                <Box
                                                    key={item.id || index}
                                                    sx={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: 1.5,
                                                        p: 1,
                                                        bgcolor: '#f0fdf4',
                                                        borderLeft: '3px solid #22c55e',
                                                        borderRadius: 0.5,
                                                        fontSize: '14px'
                                                    }}
                                                >
                                                    <Typography variant="body2">
                                                        <strong>✓ {item.condition?.name || 'Condición'}</strong>
                                                        {item.condition?.description && `: ${item.condition.description}`}
                                                    </Typography>
                                                </Box>
                                            ))}
                                        </Box>
                                    ) : (
                                        <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                                            No hay condiciones disponibles
                                        </Typography>
                                    )}
                                </Box>
                            )}

                            {/* Tab 3: Restricciones - Versión Compacta */}
                            {modalTab === 3 && (
                                <Box sx={{ p: 2 }}>
                                    <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1.5 }}>
                                        Restricciones
                                    </Typography>

                                    {selectedPackage.restrictions && selectedPackage.restrictions.length > 0 ? (
                                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                            {selectedPackage.restrictions.map((item, index) => (
                                                <Box
                                                    key={item.id || index}
                                                    sx={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: 1.5,
                                                        p: 1,
                                                        bgcolor: '#fef2f2',
                                                        borderLeft: '3px solid #ef4444',
                                                        borderRadius: 0.5,
                                                        fontSize: '14px'
                                                    }}
                                                >
                                                    <Typography variant="body2">
                                                        <strong>⚠️ {item.restriction?.name || 'Restricción'}</strong>
                                                        {item.restriction?.description && `: ${item.restriction.description}`}
                                                    </Typography>
                                                </Box>
                                            ))}
                                        </Box>
                                    ) : (
                                        <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                                            No hay restricciones disponibles
                                        </Typography>
                                    )}
                                </Box>
                            )}

                            {/* Metadatos (solo en información general) */}
                            {modalTab === 0 && (selectedPackage.createdAt || selectedPackage.updatedAt) && (
                                <>
                                    <Divider />
                                    <Box sx={{ p: 3, bgcolor: '#f9f9f9' }}>
                                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                                            <tbody>
                                                {selectedPackage.createdAt && (
                                                    <tr>
                                                        <td style={{ padding: '4px 0', color: '#999', width: '35%' }}>
                                                            Fecha creación:
                                                        </td>
                                                        <td style={{ padding: '4px 0', color: '#666' }}>
                                                            {new Date(selectedPackage.createdAt).toLocaleString()}
                                                        </td>
                                                    </tr>
                                                )}
                                                {selectedPackage.updatedAt && (
                                                    <tr>
                                                        <td style={{ padding: '4px 0', color: '#999' }}>
                                                            Última modificación:
                                                        </td>
                                                        <td style={{ padding: '4px 0', color: '#666' }}>
                                                            {new Date(selectedPackage.updatedAt).toLocaleString()}
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </Box>
                                </>
                            )}
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
                                    navigate(`/admin/packages/edit/${selectedPackage.id}`);
                                }}
                                startIcon={<EditIcon />}
                            >
                                Editar
                            </Button>
                            <Button
                                variant="contained"
                                color={selectedPackage.active ? "error" : "success"}
                                onClick={() => {
                                    handleCloseModal();
                                    handleDelete(selectedPackage);
                                }}
                                startIcon={selectedPackage.active ? <DeleteIcon /> : <CheckIcon />}
                            >
                                {selectedPackage.active ? 'Desactivar' : 'Activar'}
                            </Button>
                        </DialogActions>
                    </>
                )}
            </Dialog>
        </Box>
    );
};

export default TourPackageList;