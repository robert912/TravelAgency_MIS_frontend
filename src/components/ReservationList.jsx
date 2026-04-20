import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    Box, Paper, Typography, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, TablePagination, IconButton, Chip, TextField,
    InputAdornment, Button, Stack, Tooltip, Grid, FormControl,
    InputLabel, Select, MenuItem, Dialog, DialogTitle, DialogContent,
    DialogContentText, DialogActions, CircularProgress, Card, CardContent,
    Accordion, AccordionSummary, AccordionDetails, Divider, Alert
} from "@mui/material";
import {
    Edit as EditIcon,
    Search as SearchIcon,
    Clear as ClearIcon,
    Visibility as VisibilityIcon,
    CheckCircle as CheckCircleIcon,
    Cancel as CancelIcon,
    Pending as PendingIcon,
    Schedule as ScheduleIcon,
    Person as PersonIcon,
    CardTravel as PackageIcon,
    ExpandMore as ExpandMoreIcon,
    Receipt as ReceiptIcon,
    Print as PrintIcon,
    Close as CloseIcon
} from "@mui/icons-material";
import Swal from 'sweetalert2';
import reservationService from "../services/reservation.service";
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/es';

dayjs.extend(relativeTime);
dayjs.locale('es');

const ReservationList = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [reservations, setReservations] = useState([]);
    const [filteredReservations, setFilteredReservations] = useState([]);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
    const [selectedReservation, setSelectedReservation] = useState(null);
    const [passengersMap, setPassengersMap] = useState({});
    const [expandedRow, setExpandedRow] = useState(null);
    const [receiptOpen, setReceiptOpen] = useState(false);
    const [currentReceipt, setCurrentReceipt] = useState(null);

    const statusColors = {
        PENDIENTE: { bg: '#fff3e0', color: '#e65100', icon: <PendingIcon sx={{ fontSize: 16 }} /> },
        PAGADA: { bg: '#e8f5e9', color: '#2e7d32', icon: <CheckCircleIcon sx={{ fontSize: 16 }} /> },
        CANCELADA: { bg: '#ffebee', color: '#c62828', icon: <CancelIcon sx={{ fontSize: 16 }} /> },
        EXPIRADA: { bg: '#f5f5f5', color: '#757575', icon: <ScheduleIcon sx={{ fontSize: 16 }} /> }
    };

    useEffect(() => {
        fetchReservations();
    }, []);

    const fetchReservations = async () => {
        setLoading(true);
        try {
            const response = await reservationService.getAll();
            const data = response.data?.data || response.data || [];
            setReservations(data);
            setFilteredReservations(data);

            for (const reservation of data) {
                await loadPassengersForReservation(reservation.id);
            }

            await checkAndUpdateExpiredReservations(data);
        } catch (error) {
            console.error("Error cargando reservas:", error);
            Swal.fire('Error', 'No se pudieron cargar las reservas', 'error');
        } finally {
            setLoading(false);
        }
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

            if (expiredReservations.length > 0) {
                Swal.fire({
                    title: 'Reservas Expiradas',
                    html: `${expiredReservations.length} reserva(s) han sido actualizadas a estado EXPIRADA`,
                    icon: 'info',
                    timer: 3000,
                    showConfirmButton: false
                });
                fetchReservations();
            }
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
        const value = event.target.value.toLowerCase();
        setSearchTerm(value);

        const filtered = reservations.filter(res =>
            res.id?.toString().includes(value) ||
            res.person?.fullName?.toLowerCase().includes(value) ||
            res.tourPackage?.name?.toLowerCase().includes(value) ||
            res.tourPackage?.destination?.toLowerCase().includes(value)
        );

        setFilteredReservations(filtered);
        setPage(0);
    };

    const clearSearch = () => {
        setSearchTerm("");
        setFilteredReservations(reservations);
        setPage(0);
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
                label={status}
                size="small"
                icon={style.icon}
                sx={{ bgcolor: style.bg, color: style.color, fontWeight: 'bold' }}
            />
        );
    };

    const isExpired = (expirationDate) => {
        return dayjs(expirationDate).isBefore(dayjs());
    };

    const getTotalPassengers = (reservationId) => {
        return passengersMap[reservationId]?.length || 0;
    };

    const getTotalAmount = (reservation) => {
        if (reservation.totalAmount) return reservation.totalAmount;
        const price = reservation.tourPackage?.price || 0;
        const passengers = getTotalPassengers(reservation.id);
        return price * passengers;
    };

    // Parsear descuentos
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

    if (loading && reservations.length === 0) {
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
                    p: 4
                }}>
                    <Typography variant="overline" sx={{ opacity: 0.9, letterSpacing: 1.5 }}>
                        GESTIÓN DE RESERVAS
                    </Typography>
                    <Typography variant="h4" fontWeight="bold">
                        Administrador de Reservas
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.8, mt: 0.5 }}>
                        Total: {filteredReservations.length} reservas
                    </Typography>
                </Box>

                {/* Stats Cards */}
                <Box sx={{ p: 3, borderBottom: '1px solid #e2e8f0' }}>
                    <Grid container spacing={2}>
                        <Grid item xs={6} sm={4} md={3}>
                            <Card sx={{ bgcolor: '#fff3e0', cursor: 'pointer' }} onClick={() => setStatusFilter('PENDIENTE')}>
                                <CardContent sx={{ textAlign: 'center', p: 2 }}>
                                    <PendingIcon sx={{ color: '#e65100', fontSize: 30 }} />
                                    <Typography variant="h6">
                                        {reservations.filter(r => r.status === 'PENDIENTE').length}
                                    </Typography>
                                    <Typography variant="caption">Pendientes</Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={6} sm={4} md={3}>
                            <Card sx={{ bgcolor: '#e8f5e9', cursor: 'pointer' }} onClick={() => setStatusFilter('PAGADA')}>
                                <CardContent sx={{ textAlign: 'center', p: 2 }}>
                                    <CheckCircleIcon sx={{ color: '#2e7d32', fontSize: 30 }} />
                                    <Typography variant="h6">
                                        {reservations.filter(r => r.status === 'PAGADA').length}
                                    </Typography>
                                    <Typography variant="caption">Pagadas</Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={6} sm={4} md={3}>
                            <Card sx={{ bgcolor: '#ffebee', cursor: 'pointer' }} onClick={() => setStatusFilter('CANCELADA')}>
                                <CardContent sx={{ textAlign: 'center', p: 2 }}>
                                    <CancelIcon sx={{ color: '#c62828', fontSize: 30 }} />
                                    <Typography variant="h6">
                                        {reservations.filter(r => r.status === 'CANCELADA').length}
                                    </Typography>
                                    <Typography variant="caption">Canceladas</Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={6} sm={4} md={3}>
                            <Card sx={{ bgcolor: '#f5f5f5', cursor: 'pointer' }} onClick={() => setStatusFilter('EXPIRADA')}>
                                <CardContent sx={{ textAlign: 'center', p: 2 }}>
                                    <ScheduleIcon sx={{ color: '#757575', fontSize: 30 }} />
                                    <Typography variant="h6">
                                        {reservations.filter(r => r.status === 'EXPIRADA').length}
                                    </Typography>
                                    <Typography variant="caption">Expiradas</Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>
                </Box>

                {/* Filtros */}
                <Box sx={{ p: 3, borderBottom: '1px solid #e2e8f0' }}>
                    <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                placeholder="Buscar por ID, cliente, paquete o destino..."
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
                        <Grid item xs={12} md={6}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Estado</InputLabel>
                                <Select
                                    value={statusFilter}
                                    onChange={(e) => {
                                        setStatusFilter(e.target.value);
                                        if (e.target.value === 'all') {
                                            setFilteredReservations(reservations);
                                        } else {
                                            setFilteredReservations(reservations.filter(r => r.status === e.target.value));
                                        }
                                        setPage(0);
                                    }}
                                    label="Estado"
                                >
                                    <MenuItem value="all">Todos</MenuItem>
                                    <MenuItem value="PENDIENTE">Pendientes</MenuItem>
                                    <MenuItem value="PAGADA">Pagadas</MenuItem>
                                    <MenuItem value="CANCELADA">Canceladas</MenuItem>
                                    <MenuItem value="EXPIRADA">Expiradas</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                    </Grid>
                </Box>

                {/* Tabla */}
                <TableContainer>
                    <Table>
                        <TableHead sx={{ bgcolor: '#f8fafc' }}>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 'bold' }}>ID</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>Cliente</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>Paquete</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>Pasajeros</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>Total</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>Fecha Reserva</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>Expiración</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>Estado</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }} align="center">Acciones</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filteredReservations
                                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                .map((reservation) => {
                                    const passengers = passengersMap[reservation.id] || [];
                                    const isReservationExpired = isExpired(reservation.expirationDate);
                                    const discountDetails = parseDiscountDetails(reservation.discountDetails);

                                    return (
                                        <>
                                            <TableRow key={reservation.id} hover>
                                                <TableCell>#{reservation.id}</TableCell>
                                                <TableCell>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                        <PersonIcon fontSize="small" color="action" />
                                                        <Box>
                                                            <Typography variant="body2">
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
                                                        <Typography variant="body2">
                                                            {reservation.tourPackage?.name || 'N/A'}
                                                        </Typography>
                                                        <Typography variant="caption" color="text.secondary">
                                                            {reservation.tourPackage?.destination}
                                                        </Typography>
                                                    </Box>
                                                </TableCell>
                                                <TableCell>
                                                    <Button
                                                        size="small"
                                                        variant="text"
                                                        onClick={() => setExpandedRow(expandedRow === reservation.id ? null : reservation.id)}
                                                        startIcon={<PersonIcon fontSize="small" />}
                                                    >
                                                        {passengers.length} persona(s)
                                                    </Button>
                                                </TableCell>
                                                <TableCell>
                                                    <Typography variant="body2" fontWeight="bold" color="primary">
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
                                                            <IconButton size="small" onClick={() => handleView(reservation)}>
                                                                <VisibilityIcon />
                                                            </IconButton>
                                                        </Tooltip>
                                                        <Tooltip title="Editar">
                                                            <IconButton size="small" onClick={() => handleEdit(reservation)}>
                                                                <EditIcon />
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
                                                                        <CheckCircleIcon />
                                                                    </IconButton>
                                                                </Tooltip>
                                                                <Tooltip title="Cancelar reserva">
                                                                    <IconButton
                                                                        size="small"
                                                                        onClick={() => handleStatusChange(reservation, 'CANCELADA')}
                                                                        sx={{ color: '#d32f2f' }}
                                                                    >
                                                                        <CancelIcon />
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
                                                                    <ReceiptIcon />
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
                                                                    Lista de pasajeros ({passengers.length})
                                                                </Typography>
                                                            </AccordionSummary>
                                                            <AccordionDetails>
                                                                <Grid container spacing={2}>
                                                                    {passengers.map((passenger, idx) => (
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
                                                                    ))}
                                                                    {passengers.length === 0 && (
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
                                        </>
                                    );
                                })}
                            {filteredReservations.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={9} align="center" sx={{ py: 8 }}>
                                        <Typography variant="body1" color="text.secondary">
                                            No se encontraron reservas
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
                    count={filteredReservations.length}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={handleChangePage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                    labelRowsPerPage="Filas por página:"
                    labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
                />
            </Paper>

            {/* Diálogo de confirmación para cancelar */}
            <Dialog open={cancelDialogOpen} onClose={() => setCancelDialogOpen(false)}>
                <DialogTitle>Confirmar cancelación</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        ¿Estás seguro de que deseas cancelar esta reserva?
                        Esta acción no se puede deshacer.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setCancelDialogOpen(false)}>No, volver</Button>
                    <Button
                        onClick={() => {
                            if (selectedReservation) {
                                handleStatusChange(selectedReservation, 'CANCELADA');
                                setCancelDialogOpen(false);
                            }
                        }}
                        color="error"
                        variant="contained"
                    >
                        Sí, cancelar
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Diálogo del Comprobante */}
            <Dialog
                open={receiptOpen}
                onClose={() => setReceiptOpen(false)}
                maxWidth="md"
                fullWidth
                PaperProps={{
                    sx: {
                        borderRadius: 3,
                        '@media print': {
                            margin: 0,
                            padding: 0,
                            boxShadow: 'none'
                        }
                    }
                }}
            >
                <DialogTitle sx={{
                    bgcolor: 'var(--primary)',
                    color: 'white',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <Typography variant="h6">Comprobante de Reserva</Typography>
                    <IconButton
                        onClick={() => setReceiptOpen(false)}
                        sx={{ color: 'white' }}
                        className="no-print"
                    >
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent sx={{ p: 4 }} id="receipt-content">
                    {currentReceipt && (
                        <>
                            {/* Encabezado */}
                            <Box sx={{ textAlign: 'center', mb: 3 }}>
                                <Typography variant="h5" fontWeight="bold" color="primary">
                                    COMPROBANTE DE RESERVA
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    Fecha de emisión: {dayjs().format('DD/MM/YYYY HH:mm')}
                                </Typography>
                            </Box>

                            <Divider sx={{ my: 2 }} />

                            {/* Información de la reserva */}
                            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                                INFORMACIÓN DE LA RESERVA
                            </Typography>
                            <Grid container spacing={2} sx={{ mb: 3 }}>
                                <Grid item xs={6}>
                                    <Typography variant="caption" color="text.secondary">Número de Reserva</Typography>
                                    <Typography variant="body1" fontWeight="bold">#{currentReceipt.id}</Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="caption" color="text.secondary">Estado</Typography>
                                    <Typography variant="body1">{getStatusChip(currentReceipt.status)}</Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="caption" color="text.secondary">Fecha de Reserva</Typography>
                                    <Typography variant="body2">{dayjs(currentReceipt.reservationDate).format('DD/MM/YYYY HH:mm')}</Typography>
                                </Grid>
                            </Grid>

                            <Divider sx={{ my: 2 }} />

                            {/* Información del cliente */}
                            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                                INFORMACIÓN DEL CLIENTE
                            </Typography>
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

                            {/* Información del paquete */}
                            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                                INFORMACIÓN DEL PAQUETE
                            </Typography>
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

                            {/* Lista de pasajeros */}
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

                            {/* Detalle de precios y descuentos */}
                            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                                DETALLE DE PAGO
                            </Typography>
                            <Box sx={{ mb: 3 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                    <Typography variant="body2">Subtotal ({currentReceipt.passengersCount || 1} personas):</Typography>
                                    <Typography variant="body2">${(currentReceipt.subtotal || 0).toLocaleString()}</Typography>
                                </Box>

                                {/* Descuentos aplicados */}
                                {currentReceipt.discountDetails && parseDiscountDetails(currentReceipt.discountDetails).length > 0 && (
                                    <>
                                        <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                                            Descuentos aplicados:
                                        </Typography>
                                        {parseDiscountDetails(currentReceipt.discountDetails).map((discount, idx) => (
                                            <Box key={idx} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, ml: 2 }}>
                                                <Typography variant="body2" color="success.main">
                                                    {discount.name} - {discount.description}
                                                </Typography>
                                                <Typography variant="body2" color="success.main">
                                                    -${Math.abs(discount.amount).toLocaleString()}
                                                </Typography>
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

                                <Box sx={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    p: 2,
                                    bgcolor: '#e3f2fd',
                                    borderRadius: 2
                                }}>
                                    <Typography variant="h6" fontWeight="bold">
                                        TOTAL PAGADO
                                    </Typography>
                                    <Typography variant="h5" color="primary" fontWeight="bold">
                                        ${(currentReceipt.totalAmount || getTotalAmount(currentReceipt)).toLocaleString()}
                                    </Typography>
                                </Box>
                            </Box>

                            {/* Pie de página */}
                            <Box sx={{ textAlign: 'center', mt: 3, pt: 2, borderTop: '1px dashed #ccc' }}>
                                <Typography variant="caption" color="text.secondary">
                                    Este documento es un comprobante de reserva. Para cualquier consulta, contacte a nuestro servicio al cliente.
                                </Typography>
                            </Box>
                        </>
                    )}
                </DialogContent>
                <DialogActions sx={{ p: 2, justifyContent: 'center', className: 'no-print' }}>
                    <Button
                        variant="contained"
                        onClick={handlePrint}
                        startIcon={<PrintIcon />}
                        sx={{ bgcolor: '#1565c0' }}
                    >
                        Imprimir / Guardar PDF
                    </Button>
                    <Button
                        variant="outlined"
                        onClick={() => setReceiptOpen(false)}
                    >
                        Cerrar
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Estilos para impresión */}
            <style jsx global>{`
                @media print {
                    .no-print {
                        display: none !important;
                    }
                    body {
                        background: white;
                        margin: 0;
                        padding: 0;
                    }
                    .MuiDialog-paper {
                        margin: 0 !important;
                        padding: 0 !important;
                        box-shadow: none !important;
                    }
                    #receipt-content {
                        padding: 20px !important;
                    }
                }
            `}</style>
        </Box>
    );
};

export default ReservationList;