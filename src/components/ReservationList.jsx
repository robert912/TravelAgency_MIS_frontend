import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    Box, Button, Typography, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, Paper, Chip,
    IconButton, TextField, InputAdornment, Menu, MenuItem,
    Pagination, Stack, FormControl, InputLabel, Select,
    Tooltip, TableSortLabel, Badge, Dialog, DialogTitle,
    DialogContent, DialogActions, Grid, Divider, Rating,
    Avatar, LinearProgress, CircularProgress, Tab, Tabs,
    Accordion, AccordionSummary, AccordionDetails
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
    Receipt as ReceiptIcon,
    Print as PrintIcon,
    Pending as PendingIcon,
    Schedule as ScheduleIcon,
    ExpandMore as ExpandMoreIcon,
    CardTravel as PackageIcon,
    AttachMoney as MoneyIcon,
    Discount as DiscountIcon,
    Info as InfoIcon
} from "@mui/icons-material";
import Swal from 'sweetalert2';
import reservationService from "../services/reservation.service";
import dayjs from 'dayjs';
import 'dayjs/locale/es';

dayjs.locale('es');

const ReservationList = () => {
    const navigate = useNavigate();
    const [reservations, setReservations] = useState([]);
    const [filteredReservations, setFilteredReservations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [orderBy, setOrderBy] = useState("id");
    const [order, setOrder] = useState("desc");
    const [page, setPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [passengersMap, setPassengersMap] = useState({});
    const [expandedRow, setExpandedRow] = useState(null);
    const [receiptOpen, setReceiptOpen] = useState(false);
    const [currentReceipt, setCurrentReceipt] = useState(null);

    // Estados para el modal
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedReservation, setSelectedReservation] = useState(null);
    const [modalLoading, setModalLoading] = useState(false);
    const [modalTab, setModalTab] = useState(0);

    const statusColors = {
        PENDIENTE: { bg: '#fff3e0', color: '#e65100', icon: <PendingIcon sx={{ fontSize: 16 }} /> },
        PAGADA: { bg: '#e8f5e9', color: '#2e7d32', icon: <CheckIcon sx={{ fontSize: 16 }} /> },
        CANCELADA: { bg: '#ffebee', color: '#c62828', icon: <CancelIcon sx={{ fontSize: 16 }} /> },
        EXPIRADA: { bg: '#f5f5f5', color: '#757575', icon: <ScheduleIcon sx={{ fontSize: 16 }} /> }
    };

    const loadPassengersForReservation = async (reservationId) => {
        try {
            const response = await reservationService.getPassengers(reservationId);
            const passengers = response.data?.data || response.data || [];
            setPassengersMap(prev => ({ ...prev, [reservationId]: passengers }));
        } catch (error) {
            console.error(`Error cargando pasajeros para reserva ${reservationId}:`, error);
            setPassengersMap(prev => ({ ...prev, [reservationId]: [] }));
        }
    };

    const fetchReservations = async () => {
        setLoading(true);
        try {
            const response = await reservationService.getAll();
            const data = response.data?.data || response.data || [];
            const reservationsArray = Array.isArray(data) ? data : [];
            setReservations(reservationsArray);
            setFilteredReservations(reservationsArray);

            // Cargar pasajeros para cada reserva
            for (const reservation of reservationsArray) {
                await loadPassengersForReservation(reservation.id);
            }

            await checkAndUpdateExpiredReservations(reservationsArray);
        } catch (error) {
            console.error("Error al obtener reservas", error);
            Swal.fire('Error', 'No se pudieron cargar las reservas', 'error');
        } finally {
            setLoading(false);
        }
    };

    const checkAndUpdateExpiredReservations = async (reservationsList) => {
        const now = dayjs();
        const expiredReservations = reservationsList.filter(r =>
            r.status === 'PENDIENTE' && dayjs(r.expirationDate).isBefore(now)
        );

        if (expiredReservations.length > 0) {
            for (const reservation of expiredReservations) {
                try {
                    await reservationService.changeStatus(reservation.id, 'EXPIRADA');
                } catch (error) {
                    console.error(`Error actualizando reserva ${reservation.id}:`, error);
                }
            }
            // Recargar después de actualizar expiradas
            if (expiredReservations.length > 0) {
                fetchReservations();
            }
        }
    };

    useEffect(() => {
        fetchReservations();
    }, []);

    // Filtrar y ordenar
    useEffect(() => {
        let result = [...reservations];

        if (searchTerm) {
            result = result.filter(res =>
                res.id?.toString().includes(searchTerm) ||
                res.person?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                res.tourPackage?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                res.tourPackage?.destination?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        if (statusFilter !== "all") {
            result = result.filter(res => res.status === statusFilter);
        }

        result.sort((a, b) => {
            let aVal = a[orderBy];
            let bVal = b[orderBy];

            if (orderBy === "fullName") {
                aVal = a.person?.fullName?.toLowerCase() || '';
                bVal = b.person?.fullName?.toLowerCase() || '';
            }
            if (orderBy === "packageName") {
                aVal = a.tourPackage?.name?.toLowerCase() || '';
                bVal = b.tourPackage?.name?.toLowerCase() || '';
            }

            if (typeof aVal === 'string') {
                aVal = aVal?.toLowerCase() || '';
                bVal = bVal?.toLowerCase() || '';
            }

            if (aVal < bVal) return order === "asc" ? -1 : 1;
            if (aVal > bVal) return order === "asc" ? 1 : -1;
            return 0;
        });

        setFilteredReservations(result);
        setPage(1);
    }, [searchTerm, statusFilter, orderBy, order, reservations]);

    const handleRequestSort = (property) => {
        const isAsc = orderBy === property && order === "asc";
        setOrder(isAsc ? "desc" : "asc");
        setOrderBy(property);
    };

    const handleView = (reservation) => {
        navigate(`/admin/reservations/view/${reservation.id}`);
    };

    const handleEdit = (reservation) => {
        navigate(`/admin/reservations/edit/${reservation.id}`);
    };

    const handleStatusChange = async (reservation, newStatus) => {
        let title = '';
        let text = '';
        let confirmColor = '';

        switch (newStatus) {
            case 'PAGADA':
                title = 'Confirmar pago';
                text = `¿Marcar la reserva #${reservation.id} como PAGADA?`;
                confirmColor = '#2e7d32';
                break;
            case 'CANCELADA':
                title = 'Cancelar reserva';
                text = `¿Estás seguro de cancelar la reserva #${reservation.id}?`;
                confirmColor = '#d33';
                break;
            default:
                return;
        }

        const result = await Swal.fire({
            title,
            text,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Sí, confirmar',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: confirmColor
        });

        if (result.isConfirmed) {
            setLoading(true);
            try {
                await reservationService.changeStatus(reservation.id, newStatus);
                Swal.fire('¡Actualizado!', `Reserva #${reservation.id} ${newStatus === 'PAGADA' ? 'pagada' : 'cancelada'} correctamente`, 'success');
                fetchReservations();
            } catch (error) {
                console.error("Error cambiando estado:", error);
                Swal.fire('Error', 'No se pudo cambiar el estado', 'error');
            } finally {
                setLoading(false);
            }
        }
    };

    const openReceipt = (reservation) => {
        setCurrentReceipt(reservation);
        setReceiptOpen(true);
    };

    const handlePrint = () => {
        window.print();
    };

    const getStatusChip = (status) => {
        const style = statusColors[status] || statusColors.PENDIENTE;
        return (
            <Chip
                label={status === 'PENDIENTE' ? 'Pendiente' : status === 'PAGADA' ? 'Pagada' : status === 'CANCELADA' ? 'Cancelada' : 'Expirada'}
                size="small"
                icon={style.icon}
                sx={{ bgcolor: style.bg, color: style.color, fontWeight: 'bold' }}
            />
        );
    };

    const getTotalAmount = (reservation) => {
        if (reservation.totalAmount) return reservation.totalAmount;
        const price = reservation.tourPackage?.price || 0;
        const passengers = passengersMap[reservation.id]?.length || reservation.passengersCount || 1;
        return price * passengers;
    };

    const parseDiscountDetails = (discountDetails) => {
        if (!discountDetails) return [];
        try {
            if (typeof discountDetails === 'string') {
                return JSON.parse(discountDetails);
            }
            return discountDetails;
        } catch (e) {
            return [];
        }
    };

    const isExpired = (expirationDate) => {
        return dayjs(expirationDate).isBefore(dayjs());
    };

    // Paginación
    const paginatedReservations = filteredReservations.slice(
        (page - 1) * rowsPerPage,
        page * rowsPerPage
    );

    const totalPages = Math.ceil(filteredReservations.length / rowsPerPage);

    const columns = [
        { id: 'id', label: 'ID', width: 70, numeric: true },
        { id: 'fullName', label: 'Cliente', width: 180 },
        { id: 'packageName', label: 'Paquete', width: 200 },
        { id: 'passengers', label: 'Pasajeros', width: 100, numeric: true },
        { id: 'totalAmount', label: 'Total', width: 120, numeric: true },
        { id: 'reservationDate', label: 'Fecha Reserva', width: 150 },
        { id: 'expirationDate', label: 'Expiración', width: 150 },
        { id: 'status', label: 'Estado', width: 110 },
        { id: 'actions', label: 'Acciones', width: 180, align: 'center' }
    ];

    return (
        <Box sx={{ p: 3, bgcolor: '#f5f5f5', minHeight: '100vh' }}>
            {/* Header y filtros */}
            <Paper elevation={0} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                    <Box>
                        <Typography variant="h5" fontWeight="bold" gutterBottom>
                            Administración de Reservas
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Gestiona todas las reservas del sistema: {filteredReservations.length} registros encontrados
                            {reservations.length > 0 && (
                                <span style={{ marginLeft: '8px' }}>
                                    | Pendientes: {reservations.filter(r => r.status === 'PENDIENTE').length}
                                </span>
                            )}
                        </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                        <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => navigate("/")} size="small">
                            Volver
                        </Button>
                    </Box>
                </Box>
            </Paper>

            {/* Stats Cards */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={6} sm={3}>
                    <Paper sx={{ p: 2, textAlign: 'center', bgcolor: '#fff3e0', cursor: 'pointer' }} onClick={() => { setStatusFilter("PENDIENTE"); setPage(1); }}>
                        <PendingIcon sx={{ color: '#e65100', fontSize: 30 }} />
                        <Typography variant="h6">{reservations.filter(r => r.status === 'PENDIENTE').length}</Typography>
                        <Typography variant="caption">Pendientes</Typography>
                    </Paper>
                </Grid>
                <Grid item xs={6} sm={3}>
                    <Paper sx={{ p: 2, textAlign: 'center', bgcolor: '#e8f5e9', cursor: 'pointer' }} onClick={() => { setStatusFilter("PAGADA"); setPage(1); }}>
                        <CheckIcon sx={{ color: '#2e7d32', fontSize: 30 }} />
                        <Typography variant="h6">{reservations.filter(r => r.status === 'PAGADA').length}</Typography>
                        <Typography variant="caption">Pagadas</Typography>
                    </Paper>
                </Grid>
                <Grid item xs={6} sm={3}>
                    <Paper sx={{ p: 2, textAlign: 'center', bgcolor: '#ffebee', cursor: 'pointer' }} onClick={() => { setStatusFilter("CANCELADA"); setPage(1); }}>
                        <CancelIcon sx={{ color: '#c62828', fontSize: 30 }} />
                        <Typography variant="h6">{reservations.filter(r => r.status === 'CANCELADA').length}</Typography>
                        <Typography variant="caption">Canceladas</Typography>
                    </Paper>
                </Grid>
                <Grid item xs={6} sm={3}>
                    <Paper sx={{ p: 2, textAlign: 'center', bgcolor: '#f5f5f5', cursor: 'pointer' }} onClick={() => { setStatusFilter("EXPIRADA"); setPage(1); }}>
                        <ScheduleIcon sx={{ color: '#757575', fontSize: 30 }} />
                        <Typography variant="h6">{reservations.filter(r => r.status === 'EXPIRADA').length}</Typography>
                        <Typography variant="caption">Expiradas</Typography>
                    </Paper>
                </Grid>
            </Grid>

            {/* Filtros */}
            <Paper elevation={0} sx={{ p: 2, mb: 3, borderRadius: 2 }}>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
                    <TextField
                        placeholder="Buscar por ID, cliente, paquete o destino..."
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
                            <MenuItem value="PENDIENTE">Pendientes</MenuItem>
                            <MenuItem value="PAGADA">Pagadas</MenuItem>
                            <MenuItem value="CANCELADA">Canceladas</MenuItem>
                            <MenuItem value="EXPIRADA">Expiradas</MenuItem>
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
                                        <Typography>Cargando reservas...</Typography>
                                    </TableCell>
                                </TableRow>
                            ) : paginatedReservations.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={columns.length} align="center" sx={{ py: 8 }}>
                                        <Typography variant="h6" color="text.secondary" gutterBottom>
                                            No hay reservas que coincidan con los filtros
                                        </Typography>
                                        <Button variant="outlined" onClick={() => { setSearchTerm(""); setStatusFilter("all"); }} sx={{ mt: 2 }}>
                                            Limpiar filtros
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                paginatedReservations.map((reservation) => {
                                    const passengers = passengersMap[reservation.id] || [];
                                    const isReservationExpired = isExpired(reservation.expirationDate);
                                    const discountDetails = parseDiscountDetails(reservation.discountDetails);

                                    return (
                                        <React.Fragment key={reservation.id}>
                                            <TableRow hover>
                                                <TableCell>#{reservation.id}</TableCell>
                                                <TableCell>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                        <PersonIcon fontSize="small" color="action" />
                                                        <Box>
                                                            <Typography variant="body2" fontWeight="500">
                                                                {reservation.person?.fullName || 'N/A'}
                                                            </Typography>
                                                            <Typography variant="caption" color="text.secondary">
                                                                {reservation.person?.identification || ''}
                                                            </Typography>
                                                        </Box>
                                                    </Box>
                                                </TableCell>
                                                <TableCell>
                                                    <Box>
                                                        <Typography variant="body2" fontWeight="500">
                                                            {reservation.tourPackage?.name || 'N/A'}
                                                        </Typography>
                                                        <Typography variant="caption" color="text.secondary">
                                                            {reservation.tourPackage?.destination}
                                                        </Typography>
                                                    </Box>
                                                </TableCell>
                                                <TableCell align="center">
                                                    <Button
                                                        size="small"
                                                        variant="text"
                                                        onClick={() => setExpandedRow(expandedRow === reservation.id ? null : reservation.id)}
                                                        startIcon={<PersonIcon fontSize="small" />}
                                                    >
                                                        {passengers.length || reservation.passengersCount || 1} persona(s)
                                                    </Button>
                                                </TableCell>
                                                <TableCell align="right">
                                                    <Typography fontWeight="bold" color="primary.main">
                                                        ${getTotalAmount(reservation).toLocaleString()}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell>
                                                    {dayjs(reservation.reservationDate).format('DD/MM/YYYY HH:mm')}
                                                </TableCell>
                                                <TableCell>
                                                    <Tooltip title={isReservationExpired ? "Expirada" : "Vigente"}>
                                                        <Box>
                                                            <Typography variant="body2" color={isReservationExpired ? 'error' : 'text.primary'}>
                                                                {dayjs(reservation.expirationDate).format('DD/MM/YYYY HH:mm')}
                                                            </Typography>
                                                            {isReservationExpired && (
                                                                <Chip size="small" label="Expirada" color="error" sx={{ height: 20, fontSize: '10px' }} />
                                                            )}
                                                        </Box>
                                                    </Tooltip>
                                                </TableCell>
                                                <TableCell>{getStatusChip(reservation.status)}</TableCell>
                                                <TableCell align="center">
                                                    <Stack direction="row" spacing={1} justifyContent="center">
                                                        <Tooltip title="Ver detalles">
                                                            <IconButton size="small" color="info" onClick={() => handleView(reservation)}>
                                                                <ViewIcon fontSize="small" />
                                                            </IconButton>
                                                        </Tooltip>
                                                        <Tooltip title="Editar">
                                                            <IconButton size="small" color="primary" onClick={() => handleEdit(reservation)}>
                                                                <EditIcon fontSize="small" />
                                                            </IconButton>
                                                        </Tooltip>
                                                        {reservation.status === 'PENDIENTE' && !isReservationExpired && (
                                                            <>
                                                                <Tooltip title="Marcar como pagada">
                                                                    <IconButton
                                                                        size="small"
                                                                        onClick={() => handleStatusChange(reservation, 'PAGADA')}
                                                                        sx={{ color: '#2e7d32' }}
                                                                    >
                                                                        <CheckIcon fontSize="small" />
                                                                    </IconButton>
                                                                </Tooltip>
                                                                <Tooltip title="Cancelar reserva">
                                                                    <IconButton
                                                                        size="small"
                                                                        onClick={() => handleStatusChange(reservation, 'CANCELADA')}
                                                                        sx={{ color: '#d32f2f' }}
                                                                    >
                                                                        <CancelIcon fontSize="small" />
                                                                    </IconButton>
                                                                </Tooltip>
                                                            </>
                                                        )}
                                                        {reservation.status === 'PAGADA' && (
                                                            <Tooltip title="Ver comprobante">
                                                                <IconButton
                                                                    size="small"
                                                                    onClick={() => openReceipt(reservation)}
                                                                    sx={{ color: '#1565c0' }}
                                                                >
                                                                    <ReceiptIcon fontSize="small" />
                                                                </IconButton>
                                                            </Tooltip>
                                                        )}
                                                    </Stack>
                                                </TableCell>
                                            </TableRow>

                                            {/* Fila expandida con pasajeros */}
                                            {expandedRow === reservation.id && (
                                                <TableRow>
                                                    <TableCell colSpan={9} sx={{ bgcolor: '#f8fafc', p: 2 }}>
                                                        <Accordion expanded={true} sx={{ boxShadow: 'none', border: '1px solid #e2e8f0' }}>
                                                            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                                                <Typography variant="subtitle2">
                                                                    Lista de pasajeros ({passengers.length || reservation.passengersCount || 1})
                                                                </Typography>
                                                            </AccordionSummary>
                                                            <AccordionDetails>
                                                                <Grid container spacing={2}>
                                                                    {passengers.length > 0 ? (
                                                                        passengers.map((passenger, idx) => (
                                                                            <Grid item xs={12} sm={6} md={4} key={idx}>
                                                                                <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                                                                                    <Typography variant="subtitle2" gutterBottom color="primary">
                                                                                        Pasajero {idx + 1}
                                                                                    </Typography>
                                                                                    <Typography variant="body2">
                                                                                        <strong>Nombre:</strong> {passenger.person?.fullName}
                                                                                    </Typography>
                                                                                    <Typography variant="body2">
                                                                                        <strong>Identificación:</strong> {passenger.person?.identification}
                                                                                    </Typography>
                                                                                    <Typography variant="body2">
                                                                                        <strong>Email:</strong> {passenger.person?.email}
                                                                                    </Typography>
                                                                                    {passenger.person?.phone && (
                                                                                        <Typography variant="body2">
                                                                                            <strong>Teléfono:</strong> {passenger.person?.phone}
                                                                                        </Typography>
                                                                                    )}
                                                                                    {passenger.person?.nationality && (
                                                                                        <Typography variant="body2">
                                                                                            <strong>Nacionalidad:</strong> {passenger.person?.nationality}
                                                                                        </Typography>
                                                                                    )}
                                                                                </Paper>
                                                                            </Grid>
                                                                        ))
                                                                    ) : (
                                                                        <Grid item xs={12}>
                                                                            <Typography variant="body2" color="text.secondary" align="center">
                                                                                No hay pasajeros registrados
                                                                            </Typography>
                                                                        </Grid>
                                                                    )}
                                                                </Grid>
                                                            </AccordionDetails>
                                                        </Accordion>
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </React.Fragment>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>

                {filteredReservations.length > 0 && (
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

            {/* Diálogo del Comprobante */}
            <Dialog
                open={receiptOpen}
                onClose={() => setReceiptOpen(false)}
                maxWidth="md"
                fullWidth
                PaperProps={{
                    sx: {
                        borderRadius: 2,
                        '@media print': {
                            margin: 0,
                            padding: 0,
                            boxShadow: 'none'
                        }
                    }
                }}
            >
                <DialogTitle className="no-print" sx={{
                    bgcolor: 'var(--info)',
                    color: 'white',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <Typography sx={{ color: 'white' }} variant="h6">Comprobante de Reserva</Typography>
                    <IconButton onClick={() => setReceiptOpen(false)} sx={{ color: 'white' }}>
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent sx={{ p: 4 }} id="receipt-content">
                    {currentReceipt && (
                        <>
                            <Box sx={{ textAlign: 'center', mb: 3 }}>
                                <Typography variant="h5" fontWeight="bold" color="primary">
                                    COMPROBANTE DE RESERVA
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    Fecha de emisión: {dayjs().format('DD/MM/YYYY HH:mm')}
                                </Typography>
                            </Box>

                            <Divider sx={{ my: 2 }} />

                            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>INFORMACIÓN DE LA RESERVA</Typography>
                            <Grid container spacing={2} sx={{ mb: 3 }}>
                                <Grid item xs={6}>
                                    <Typography variant="caption" color="text.secondary">Número de Reserva</Typography>
                                    <Typography variant="body1" fontWeight="bold">#{currentReceipt.id}</Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="caption" color="text.secondary">Estado</Typography>
                                    <Box>{getStatusChip(currentReceipt.status)}</Box>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="caption" color="text.secondary">Fecha de Reserva</Typography>
                                    <Typography variant="body2">{dayjs(currentReceipt.reservationDate).format('DD/MM/YYYY HH:mm')}</Typography>
                                </Grid>
                            </Grid>

                            <Divider sx={{ my: 2 }} />

                            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>INFORMACIÓN DEL CLIENTE</Typography>
                            <Grid container spacing={2} sx={{ mb: 3 }}>
                                <Grid item xs={12}>
                                    <Typography variant="caption" color="text.secondary">Nombre</Typography>
                                    <Typography variant="body2">{currentReceipt.person?.fullName || "N/A"}</Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="caption" color="text.secondary">Identificación</Typography>
                                    <Typography variant="body2">{currentReceipt.person?.identification || "N/A"}</Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="caption" color="text.secondary">Email</Typography>
                                    <Typography variant="body2">{currentReceipt.person?.email || "N/A"}</Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="caption" color="text.secondary">Teléfono</Typography>
                                    <Typography variant="body2">{currentReceipt.person?.phone || "N/A"}</Typography>
                                </Grid>
                            </Grid>

                            <Divider sx={{ my: 2 }} />

                            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>INFORMACIÓN DEL PAQUETE</Typography>
                            <Grid container spacing={2} sx={{ mb: 3 }}>
                                <Grid item xs={12}>
                                    <Typography variant="caption" color="text.secondary">Paquete</Typography>
                                    <Typography variant="body2">{currentReceipt.tourPackage?.name || "N/A"}</Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="caption" color="text.secondary">Destino</Typography>
                                    <Typography variant="body2">{currentReceipt.tourPackage?.destination || "N/A"}</Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="caption" color="text.secondary">Fecha Ida</Typography>
                                    <Typography variant="body2">{currentReceipt.tourPackage?.startDate || "N/A"}</Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="caption" color="text.secondary">Fecha Vuelta</Typography>
                                    <Typography variant="body2">{currentReceipt.tourPackage?.endDate || "N/A"}</Typography>
                                </Grid>
                            </Grid>

                            <Divider sx={{ my: 2 }} />

                            {passengersMap[currentReceipt.id]?.length > 0 && (
                                <>
                                    <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                                        LISTA DE PASAJEROS ({passengersMap[currentReceipt.id].length} personas)
                                    </Typography>
                                    <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
                                        <Table size="small">
                                            <TableHead sx={{ bgcolor: '#f8fafc' }}>
                                                <TableRow>
                                                    <TableCell>#</TableCell>
                                                    <TableCell>Nombre</TableCell>
                                                    <TableCell>Identificación</TableCell>
                                                    <TableCell>Email</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {passengersMap[currentReceipt.id].map((passenger, idx) => (
                                                    <TableRow key={idx}>
                                                        <TableCell>{idx + 1}</TableCell>
                                                        <TableCell>{passenger.person?.fullName}</TableCell>
                                                        <TableCell>{passenger.person?.identification}</TableCell>
                                                        <TableCell>{passenger.person?.email}</TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                </>
                            )}

                            <Divider sx={{ my: 2 }} />

                            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>DETALLE DE PAGO</Typography>
                            <Box sx={{ mb: 3 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                    <Typography variant="body2">Subtotal ({currentReceipt.passengersCount || 1} personas):</Typography>
                                    <Typography variant="body2">${(currentReceipt.subtotal || 0).toLocaleString()}</Typography>
                                </Box>

                                {parseDiscountDetails(currentReceipt.discountDetails).length > 0 && (
                                    <>
                                        <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>Descuentos aplicados:</Typography>
                                        {parseDiscountDetails(currentReceipt.discountDetails).map((discount, idx) => (
                                            <Box key={idx} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, ml: 2 }}>
                                                <Typography variant="body2" color="success.main">{discount.name}</Typography>
                                                <Typography variant="body2" color="success.main">-${Math.abs(discount.amount).toLocaleString()}</Typography>
                                            </Box>
                                        ))}
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1, mb: 1 }}>
                                            <Typography variant="body2" fontWeight="bold">Total descuentos:</Typography>
                                            <Typography variant="body2" color="success.main" fontWeight="bold">
                                                -${(currentReceipt.discountAmount || 0).toLocaleString()}
                                            </Typography>
                                        </Box>
                                    </>
                                )}

                                <Divider sx={{ my: 2 }} />

                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, bgcolor: '#e3f2fd', borderRadius: 2 }}>
                                    <Typography variant="h6" fontWeight="bold">TOTAL PAGADO</Typography>
                                    <Typography variant="h5" color="primary" fontWeight="bold">
                                        ${(currentReceipt.totalAmount || getTotalAmount(currentReceipt)).toLocaleString()}
                                    </Typography>
                                </Box>
                            </Box>

                            <Box sx={{ textAlign: 'center', mt: 3, pt: 2, borderTop: '1px dashed #ccc' }}>
                                <Typography variant="caption" color="text.secondary">
                                    Este documento es un comprobante de reserva. Para cualquier consulta, contacte a nuestro servicio al cliente.
                                </Typography>
                            </Box>
                        </>
                    )}
                </DialogContent>
                <DialogActions className="no-print" sx={{ p: 2, justifyContent: 'center' }}>
                    <Button variant="contained" onClick={handlePrint} startIcon={<PrintIcon />} sx={{ bgcolor: '#1565c0' }}>
                        Imprimir / Guardar PDF
                    </Button>
                    <Button variant="outlined" onClick={() => setReceiptOpen(false)}>Cerrar</Button>
                </DialogActions>
            </Dialog>

            <style jsx global>{`
                @media print {
                    .no-print { display: none !important; }
                    body { background: white; margin: 0; padding: 0; }
                    .MuiDialog-paper { margin: 0 !important; padding: 0 !important; box-shadow: none !important; }
                    #receipt-content { padding: 20px !important; }
                }
            `}</style>
        </Box>
    );
};

export default ReservationList;