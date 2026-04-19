import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    Box, Paper, Typography, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, TablePagination, IconButton, Chip, TextField,
    InputAdornment, Button, Stack, Tooltip, Grid, FormControl,
    InputLabel, Select, MenuItem, Dialog, DialogTitle, DialogContent,
    DialogContentText, DialogActions, CircularProgress, Card, CardContent,
} from "@mui/material";
import {
    Add as AddIcon,
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
    Delete as DeleteIcon,
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
    const [alertShown, setAlertShown] = useState({});

    // Colores para los estados (sin PAGADA)
    const statusColors = {
        PENDIENTE: { bg: '#fff3e0', color: '#e65100', icon: <PendingIcon sx={{ fontSize: 16 }} /> },
        CONFIRMADA: { bg: '#e8f5e9', color: '#2e7d32', icon: <CheckCircleIcon sx={{ fontSize: 16 }} /> },
        CANCELADA: { bg: '#ffebee', color: '#c62828', icon: <CancelIcon sx={{ fontSize: 16 }} /> },
        EXPIRADA: { bg: '#f5f5f5', color: '#757575', icon: <ScheduleIcon sx={{ fontSize: 16 }} /> }
    };

    useEffect(() => {
        fetchReservations();
    }, []);

    // Verificar reservas expiradas periódicamente
    useEffect(() => {
        const checkExpiredReservations = () => {
            const now = dayjs();
            reservations.forEach(reservation => {
                if (reservation.status === 'PENDIENTE' && dayjs(reservation.expirationDate).isBefore(now)) {
                    // Si la reserva está expirada y no se ha mostrado alerta
                    if (!alertShown[reservation.id]) {
                        setAlertShown(prev => ({ ...prev, [reservation.id]: true }));
                        Swal.fire({
                            title: 'Reserva Expirada',
                            html: `La reserva #${reservation.id} de <strong>${reservation.person?.fullName}</strong> ha expirado.<br/>Fecha de expiración: ${dayjs(reservation.expirationDate).format('DD/MM/YYYY HH:mm')}`,
                            icon: 'warning',
                            confirmButtonText: 'Entendido',
                            confirmButtonColor: '#d33'
                        });
                        // Actualizar el estado de la reserva a EXPIRADA
                        updateExpiredStatus(reservation.id);
                    }
                }
            });
        };

        const interval = setInterval(checkExpiredReservations, 60000); // Revisar cada minuto
        return () => clearInterval(interval);
    }, [reservations, alertShown]);

    const updateExpiredStatus = async (reservationId) => {
        try {
            await reservationService.changeStatus(reservationId, 'EXPIRADA');
            fetchReservations(); // Recargar la lista
        } catch (error) {
            console.error("Error actualizando estado a EXPIRADA:", error);
        }
    };

    const fetchReservations = async () => {
        setLoading(true);
        try {
            const response = await reservationService.getAll();
            const data = response.data?.data || response.data || [];
            setReservations(data);
            setFilteredReservations(data);
            
            // Verificar reservas expiradas al cargar
            const now = dayjs();
            const expiredReservations = data.filter(r => 
                r.status === 'PENDIENTE' && dayjs(r.expirationDate).isBefore(now)
            );
            
            if (expiredReservations.length > 0) {
                Swal.fire({
                    title: 'Reservas Expiradas',
                    html: `Hay ${expiredReservations.length} reserva(s) que han expirado.<br/>Se actualizarán automáticamente a estado EXPIRADA.`,
                    icon: 'info',
                    confirmButtonText: 'Aceptar'
                });
                
                // Actualizar cada reserva expirada
                for (const reservation of expiredReservations) {
                    await updateExpiredStatus(reservation.id);
                }
            }
        } catch (error) {
            console.error("Error cargando reservas:", error);
            Swal.fire('Error', 'No se pudieron cargar las reservas', 'error');
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

    const handleView = (reservation) => {
        navigate(`/admin/reservations/view/${reservation.id}`);
    };

    const handleEdit = (reservation) => {
        navigate(`/admin/reservations/edit/${reservation.id}`);
    };

    const handleCancelClick = (reservation) => {
        setSelectedReservation(reservation);
        setCancelDialogOpen(true);
    };

    const handleCancelConfirm = async () => {
        if (!selectedReservation) return;

        setLoading(true);
        try {
            await reservationService.changeStatus(selectedReservation.id, 'CANCELADA');
            Swal.fire('¡Cancelada!', 'La reserva ha sido cancelada correctamente', 'success');
            fetchReservations();
        } catch (error) {
            console.error("Error cancelando reserva:", error);
            Swal.fire('Error', error.response?.data?.message || 'No se pudo cancelar la reserva', 'error');
        } finally {
            setLoading(false);
            setCancelDialogOpen(false);
            setSelectedReservation(null);
        }
    };

    const handleConfirmReservation = async (reservation) => {
        const result = await Swal.fire({
            title: 'Confirmar reserva',
            text: `¿Estás seguro de que deseas confirmar la reserva #${reservation.id}?`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#2e7d32',
            confirmButtonText: 'Sí, confirmar',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            setLoading(true);
            try {
                await reservationService.changeStatus(reservation.id, 'CONFIRMADA');
                Swal.fire('¡Confirmada!', 'La reserva ha sido confirmada correctamente', 'success');
                fetchReservations();
            } catch (error) {
                Swal.fire('Error', 'No se pudo confirmar la reserva', 'error');
            } finally {
                setLoading(false);
            }
        }
    };

    const handleCancelReservation = async (reservation) => {
        const result = await Swal.fire({
            title: 'Cancelar reserva',
            text: `¿Estás seguro de que deseas cancelar la reserva #${reservation.id}?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            confirmButtonText: 'Sí, cancelar',
            cancelButtonText: 'No, volver'
        });

        if (result.isConfirmed) {
            setLoading(true);
            try {
                await reservationService.changeStatus(reservation.id, 'CANCELADA');
                Swal.fire('¡Cancelada!', 'La reserva ha sido cancelada correctamente', 'success');
                fetchReservations();
            } catch (error) {
                Swal.fire('Error', 'No se pudo cancelar la reserva', 'error');
            } finally {
                setLoading(false);
            }
        }
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

    // Verificar si se puede confirmar una reserva (no está expirada ni cancelada)
    const canConfirm = (reservation) => {
        return reservation.status === 'PENDIENTE' && !isExpired(reservation.expirationDate);
    };

    // Verificar si se puede cancelar
    const canCancel = (reservation) => {
        return reservation.status !== 'CANCELADA' && reservation.status !== 'EXPIRADA';
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
                            <Card sx={{ bgcolor: '#fff3e0' }}>
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
                            <Card sx={{ bgcolor: '#e8f5e9' }}>
                                <CardContent sx={{ textAlign: 'center', p: 2 }}>
                                    <CheckCircleIcon sx={{ color: '#2e7d32', fontSize: 30 }} />
                                    <Typography variant="h6">
                                        {reservations.filter(r => r.status === 'CONFIRMADA').length}
                                    </Typography>
                                    <Typography variant="caption">Confirmadas</Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={6} sm={4} md={3}>
                            <Card sx={{ bgcolor: '#ffebee' }}>
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
                            <Card sx={{ bgcolor: '#f5f5f5' }}>
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
                                placeholder="Buscar por cliente, paquete o ID..."
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
                                    <MenuItem value="PENDIENTE">Pendientes</MenuItem>
                                    <MenuItem value="CONFIRMADA">Confirmadas</MenuItem>
                                    <MenuItem value="CANCELADA">Canceladas</MenuItem>
                                    <MenuItem value="EXPIRADA">Expiradas</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} md={3}>
                            <Button
                                fullWidth
                                variant="contained"
                                startIcon={<AddIcon />}
                                onClick={() => navigate('/admin/reservations/new')}
                                sx={{
                                    bgcolor: 'var(--primary)',
                                    '&:hover': { bgcolor: 'var(--primary-hover)' }
                                }}
                            >
                                Nueva Reserva
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
                                <TableCell sx={{ fontWeight: 'bold' }}>Cliente</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>Paquete</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>Fecha Reserva</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>Fecha Expiración</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>Estado</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }} align="center">Acciones</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filteredReservations
                                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                .map((reservation) => (
                                    <TableRow key={reservation.id} hover>
                                        <TableCell>#{reservation.id}</TableCell>
                                        <TableCell>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <PersonIcon fontSize="small" color="action" />
                                                {reservation.person?.fullName || 'N/A'}
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <PackageIcon fontSize="small" color="action" />
                                                {reservation.tourPackage?.name || 'N/A'}
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            {dayjs(reservation.reservationDate).format('DD/MM/YYYY HH:mm')}
                                        </TableCell>
                                        <TableCell>
                                            <Tooltip title={isExpired(reservation.expirationDate) ? "Expirada" : "Vigente"}>
                                                <span>
                                                    {dayjs(reservation.expirationDate).format('DD/MM/YYYY HH:mm')}
                                                    {isExpired(reservation.expirationDate) && (
                                                        <Chip size="small" label="Expirada" color="error" sx={{ ml: 1, height: 20 }} />
                                                    )}
                                                </span>
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
                                                {canConfirm(reservation) && (
                                                    <Tooltip title="Confirmar reserva">
                                                        <IconButton 
                                                            size="small" 
                                                            onClick={() => handleConfirmReservation(reservation)}
                                                            sx={{ color: '#2e7d32' }}
                                                        >
                                                            <CheckCircleIcon />
                                                        </IconButton>
                                                    </Tooltip>
                                                )}
                                                {canCancel(reservation) && (
                                                    <Tooltip title="Cancelar reserva">
                                                        <IconButton 
                                                            size="small" 
                                                            onClick={() => handleCancelReservation(reservation)}
                                                            sx={{ color: '#d32f2f' }}
                                                        >
                                                            <CancelIcon />
                                                        </IconButton>
                                                    </Tooltip>
                                                )}
                                            </Stack>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            {filteredReservations.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={7} align="center" sx={{ py: 8 }}>
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
                    <Button onClick={handleCancelConfirm} color="error" variant="contained">
                        Sí, cancelar
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default ReservationList;