import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    Box, Container, Paper, Typography, Grid, Card, CardContent,
    Chip, Button, Divider, CircularProgress, Alert, Stack,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    IconButton, Tooltip, Dialog, DialogTitle, DialogContent, DialogActions
} from "@mui/material";
import {
    ArrowBack as ArrowBackIcon,
    Person as PersonIcon,
    CardTravel as PackageIcon,
    Schedule as ScheduleIcon,
    Payment as PaymentIcon,
    CheckCircle as CheckCircleIcon,
    Cancel as CancelIcon,
    Pending as PendingIcon,
    Receipt as ReceiptIcon,
    Print as PrintIcon,
    Close as CloseIcon,
    AttachMoney as MoneyIcon,
    DateRange as DateRangeIcon,
    People as PeopleIcon,
    Email as EmailIcon,
    Phone as PhoneIcon,
    Badge as BadgeIcon,
    LocationOn as LocationIcon,
    CreditCard as CreditCardIcon,
    Receipt as TransactionIcon
} from "@mui/icons-material";
import dayjs from 'dayjs';
import reservationService from "../services/reservation.service";
import paymentService from "../services/payment.service";
import Swal from 'sweetalert2';

const BookingDetails = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const [loading, setLoading] = useState(true);
    const [reservation, setReservation] = useState(null);
    const [passengers, setPassengers] = useState([]);
    const [payment, setPayment] = useState(null);
    const [discountDetails, setDiscountDetails] = useState([]);
    const [receiptOpen, setReceiptOpen] = useState(false);

    useEffect(() => {
        loadBookingDetails();
    }, [id]);

    const loadBookingDetails = async () => {
        setLoading(true);
        try {
            // Cargar datos de la reserva
            const response = await reservationService.get(id);
            const data = response.data?.data || response.data;
            setReservation(data);

            // Cargar pasajeros
            await loadPassengers();

            // Cargar información de pago
            await loadPaymentInfo();

            // Parsear descuentos
            if (data.discountDetails) {
                try {
                    const discounts = typeof data.discountDetails === 'string'
                        ? JSON.parse(data.discountDetails)
                        : data.discountDetails;
                    setDiscountDetails(discounts);
                } catch (e) {
                    setDiscountDetails([]);
                }
            }
        } catch (error) {
            console.error("Error cargando detalles de la reserva:", error);
            Swal.fire('Error', 'No se pudo cargar la información de la reserva', 'error');
            navigate('/my-reservations');
        } finally {
            setLoading(false);
        }
    };

    const loadPassengers = async () => {
        try {
            const response = await reservationService.getPassengers(id);
            const passengersData = response.data?.data || response.data || [];
            setPassengers(passengersData);
        } catch (error) {
            console.error("Error cargando pasajeros:", error);
            setPassengers([]);
        }
    };

    const loadPaymentInfo = async () => {
        try {
            const response = await paymentService.getByReservationId(id);
            const paymentData = response.data?.data || response.data;
            setPayment(paymentData);
        } catch (error) {
            console.error("Error cargando información de pago:", error);
            setPayment(null);
        }
    };

    const getStatusConfig = (status) => {
        switch (status) {
            case 'PENDIENTE':
                return { color: 'warning', icon: <PendingIcon />, label: 'Pendiente', bg: '#fff3e0' };
            case 'PAGADA':
                return { color: 'success', icon: <PaymentIcon />, label: 'Pagada', bg: '#e8f5e9' };
            case 'CANCELADA':
                return { color: 'error', icon: <CancelIcon />, label: 'Cancelada', bg: '#ffebee' };
            case 'EXPIRADA':
                return { color: 'default', icon: <ScheduleIcon />, label: 'Expirada', bg: '#f5f5f5' };
            default:
                return { color: 'default', icon: <PendingIcon />, label: status, bg: '#f5f5f5' };
        }
    };

    const openReceipt = () => {
        setReceiptOpen(true);
    };

    const handlePrint = () => {
        window.print();
    };

    const handleCancelReservation = async () => {
        if (reservation.status !== 'PENDIENTE') {
            Swal.fire('No se puede cancelar', 'Solo se pueden cancelar reservas pendientes', 'warning');
            return;
        }

        const result = await Swal.fire({
            title: 'Cancelar reserva',
            text: `¿Estás seguro de que deseas cancelar la reserva #${reservation.id}?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Sí, cancelar',
            cancelButtonText: 'No, volver',
            confirmButtonColor: '#d33'
        });

        if (result.isConfirmed) {
            setLoading(true);
            try {
                await reservationService.changeStatus(reservation.id, 'CANCELADA');
                Swal.fire('¡Cancelada!', 'La reserva ha sido cancelada', 'success');
                loadBookingDetails();
            } catch (error) {
                console.error("Error cancelando reserva:", error);
                Swal.fire('Error', 'No se pudo cancelar la reserva', 'error');
            } finally {
                setLoading(false);
            }
        }
    };

    const statusConfig = reservation ? getStatusConfig(reservation.status) : {};

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    if (!reservation) {
        return null;
    }

    return (
        <Box sx={{ py: 4 }}>
            <Container maxWidth="lg">
                {/* Botón volver */}
                <Button
                    startIcon={<ArrowBackIcon />}
                    onClick={() => navigate(-1)}
                    sx={{ mb: 3 }}
                >
                    Volver
                </Button>

                {/* Header con estado */}
                <Paper sx={{ p: 3, mb: 3, borderRadius: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                        <Box>
                            <Typography variant="overline" color="text.secondary">
                                Detalle de Reserva
                            </Typography>
                            <Typography variant="h4" fontWeight="bold">
                                Reserva #{reservation.id}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Creada el {dayjs(reservation.reservationDate).format('DD/MM/YYYY HH:mm')}
                            </Typography>
                        </Box>
                        <Box>
                            <Chip
                                label={statusConfig.label}
                                color={statusConfig.color}
                                icon={statusConfig.icon}
                                sx={{ fontSize: '1rem', p: 2 }}
                            />
                            {reservation.status === 'PENDIENTE' && !dayjs(reservation.expirationDate).isBefore(dayjs()) && (
                                <Button
                                    variant="contained"
                                    color="primary"
                                    startIcon={<PaymentIcon />}
                                    onClick={() => navigate(`/payment/${reservation.id}`)}
                                    sx={{ ml: 2 }}
                                >
                                    Completar pago
                                </Button>
                            )}
                            {reservation.status === 'PENDIENTE' && (
                                <Button
                                    variant="outlined"
                                    color="error"
                                    startIcon={<CancelIcon />}
                                    onClick={handleCancelReservation}
                                    sx={{ ml: 2 }}
                                >
                                    Cancelar reserva
                                </Button>
                            )}
                            {reservation.status === 'PAGADA' && (
                                <Button
                                    variant="outlined"
                                    startIcon={<ReceiptIcon />}
                                    onClick={openReceipt}
                                    sx={{ ml: 2 }}
                                >
                                    Ver comprobante
                                </Button>
                            )}
                        </Box>
                    </Box>
                </Paper>

                <Grid container spacing={3}>
                    {/* Columna izquierda - Información principal */}
                    <Grid item xs={12} md={7}>
                        {/* Información del paquete */}
                        <Paper sx={{ p: 3, mb: 3, borderRadius: 3 }}>
                            <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <PackageIcon color="primary" />
                                Información del Paquete
                            </Typography>
                            <Divider sx={{ mb: 2 }} />

                            <Grid container spacing={2}>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle1" fontWeight="bold" color="primary">
                                        {reservation.tourPackage?.name}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <LocationIcon fontSize="small" color="action" />
                                        <Typography variant="body2">
                                            {reservation.tourPackage?.destination}
                                        </Typography>
                                    </Box>
                                </Grid>
                                <Grid item xs={6}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <DateRangeIcon fontSize="small" color="action" />
                                        <Typography variant="body2">
                                            <strong>Fecha Ida:</strong> {reservation.tourPackage?.startDate}
                                        </Typography>
                                    </Box>
                                </Grid>
                                <Grid item xs={6}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <DateRangeIcon fontSize="small" color="action" />
                                        <Typography variant="body2">
                                            <strong>Fecha Vuelta:</strong> {reservation.tourPackage?.endDate}
                                        </Typography>
                                    </Box>
                                </Grid>
                                <Grid item xs={12}>
                                    <Divider sx={{ my: 1 }} />
                                    <Typography variant="body2" color="text.secondary">
                                        {reservation.tourPackage?.description}
                                    </Typography>
                                </Grid>
                            </Grid>
                        </Paper>

                        {/* Lista de pasajeros */}
                        <Paper sx={{ p: 3, mb: 3, borderRadius: 3 }}>
                            <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <PeopleIcon color="primary" />
                                Pasajeros ({passengers.length})
                            </Typography>
                            <Divider sx={{ mb: 2 }} />

                            {passengers.length > 0 ? (
                                <TableContainer component={Paper} variant="outlined">
                                    <Table size="medium">
                                        <TableHead sx={{ bgcolor: '#f8fafc' }}>
                                            <TableRow>
                                                <TableCell>#</TableCell>
                                                <TableCell>Nombre Completo</TableCell>
                                                <TableCell>Identificación</TableCell>
                                                <TableCell>Email</TableCell>
                                                <TableCell>Teléfono</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {passengers.map((passenger, idx) => (
                                                <TableRow key={idx}>
                                                    <TableCell>{idx + 1}</TableCell>
                                                    <TableCell>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                            <PersonIcon fontSize="small" color="action" />
                                                            {passenger.person?.fullName}
                                                        </Box>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                            <BadgeIcon fontSize="small" color="action" />
                                                            {passenger.person?.identification}
                                                        </Box>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                            <EmailIcon fontSize="small" color="action" />
                                                            {passenger.person?.email}
                                                        </Box>
                                                    </TableCell>
                                                    <TableCell>
                                                        {passenger.person?.phone || '-'}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            ) : (
                                <Alert severity="info">No hay pasajeros registrados</Alert>
                            )}
                        </Paper>

                        {/* Solicitudes especiales */}
                        {reservation.solicitudes && (
                            <Paper sx={{ p: 3, borderRadius: 3 }}>
                                <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <ScheduleIcon color="primary" />
                                    Solicitudes Especiales
                                </Typography>
                                <Divider sx={{ mb: 2 }} />
                                <Alert severity="info">
                                    {reservation.solicitudes}
                                </Alert>
                            </Paper>
                        )}
                    </Grid>

                    {/* Columna derecha - Resumen y pago */}
                    <Grid item xs={12} md={5}>
                        {/* Resumen de precios */}
                        <Paper sx={{ p: 3, mb: 3, borderRadius: 3, position: 'sticky', top: 20 }}>
                            <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <MoneyIcon color="primary" />
                                Resumen de Precios
                            </Typography>
                            <Divider sx={{ mb: 2 }} />

                            <Box sx={{ mb: 2 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                    <Typography variant="body2" color="text.secondary">
                                        Precio por persona
                                    </Typography>
                                    <Typography variant="body2">
                                        ${reservation.tourPackage?.price?.toLocaleString() || '0'}
                                    </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                    <Typography variant="body2" color="text.secondary">
                                        Número de pasajeros
                                    </Typography>
                                    <Typography variant="body2">
                                        {passengers.length} personas
                                    </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                    <Typography variant="body2" color="text.secondary">
                                        Subtotal
                                    </Typography>
                                    <Typography variant="body2" fontWeight="bold">
                                        ${(reservation.subtotal || 0).toLocaleString()}
                                    </Typography>
                                </Box>
                            </Box>

                            {/* Descuentos */}
                            {discountDetails.length > 0 && (
                                <>
                                    <Divider sx={{ my: 2 }} />
                                    <Typography variant="subtitle2" gutterBottom color="success.main">
                                        Descuentos aplicados:
                                    </Typography>
                                    {discountDetails.map((discount, idx) => (
                                        <Box key={idx} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, ml: 2 }}>
                                            <Typography variant="body2" color="success.main">
                                                {discount.name}
                                            </Typography>
                                            <Typography variant="body2" color="success.main">
                                                -${Math.abs(discount.amount).toLocaleString()}
                                            </Typography>
                                        </Box>
                                    ))}
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1, mb: 2, ml: 2 }}>
                                        <Typography variant="body2" fontWeight="bold" color="success.main">
                                            Total descuentos
                                        </Typography>
                                        <Typography variant="body2" fontWeight="bold" color="success.main">
                                            -${(reservation.discountAmount || 0).toLocaleString()}
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
                                    Total
                                </Typography>
                                <Typography variant="h5" color="primary" fontWeight="bold">
                                    ${(reservation.totalAmount || 0).toLocaleString()}
                                </Typography>
                            </Box>
                        </Paper>

                        {/* Información del pago (si está pagada) */}
                        {reservation.status === 'PAGADA' && payment && (
                            <Paper sx={{ p: 3, borderRadius: 3 }}>
                                <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <PaymentIcon color="primary" />
                                    Información del Pago
                                </Typography>
                                <Divider sx={{ mb: 2 }} />

                                <Grid container spacing={2}>
                                    <Grid item xs={12}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <TransactionIcon fontSize="small" color="action" />
                                            <Typography variant="body2">
                                                <strong>Transacción:</strong> {payment.transactionId}
                                            </Typography>
                                        </Box>
                                    </Grid>
                                    <Grid item xs={12}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <CreditCardIcon fontSize="small" color="action" />
                                            <Typography variant="body2">
                                                <strong>Método de pago:</strong> {payment.paymentMethod === 'CREDIT_CARD' ? 'Tarjeta de Crédito' : 'Tarjeta de Débito'}
                                            </Typography>
                                        </Box>
                                    </Grid>
                                    <Grid item xs={12}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <CreditCardIcon fontSize="small" color="action" />
                                            <Typography variant="body2">
                                                <strong>Tarjeta:</strong> {payment.cardNumber || '****'}
                                            </Typography>
                                        </Box>
                                    </Grid>
                                    <Grid item xs={12}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <ScheduleIcon fontSize="small" color="action" />
                                            <Typography variant="body2">
                                                <strong>Fecha de pago:</strong> {dayjs(payment.createdAt).format('DD/MM/YYYY HH:mm')}
                                            </Typography>
                                        </Box>
                                    </Grid>
                                    <Grid item xs={12}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <MoneyIcon fontSize="small" color="action" />
                                            <Typography variant="body2">
                                                <strong>Monto pagado:</strong> ${payment.amount?.toLocaleString()}
                                            </Typography>
                                        </Box>
                                    </Grid>
                                </Grid>
                            </Paper>
                        )}

                        {/* Información de expiración (si está pendiente) */}
                        {reservation.status === 'PENDIENTE' && (
                            <Paper sx={{ p: 3, borderRadius: 3, bgcolor: '#fff3e0' }}>
                                <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <ScheduleIcon color="warning" />
                                    Información de Expiración
                                </Typography>
                                <Divider sx={{ mb: 2 }} />

                                <Alert severity="warning">
                                    <Typography variant="body2">
                                        Esta reserva expira el <strong>{dayjs(reservation.expirationDate).format('DD/MM/YYYY HH:mm')}</strong>
                                    </Typography>
                                    <Typography variant="caption">
                                        Debes completar el pago antes de esa fecha para confirmar tu reserva.
                                    </Typography>
                                </Alert>
                            </Paper>
                        )}
                    </Grid>
                </Grid>
            </Container>

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
                <DialogTitle className="no-print" sx={{
                    bgcolor: 'var(--info)',
                    color: 'white',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <Typography sx={{ color: 'white' }} variant="h6">Comprobante de Reserva</Typography>
                    <IconButton
                        onClick={() => setReceiptOpen(false)}
                        sx={{ color: 'white' }}
                    >
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent sx={{ p: 4 }} id="receipt-content">
                    {/* Contenido del recibo */}
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
                            <Typography variant="body1" fontWeight="bold">#{reservation.id}</Typography>
                        </Grid>
                        <Grid item xs={6}>
                            <Typography variant="caption" color="text.secondary">Estado</Typography>
                            <Typography variant="body1">{statusConfig.label}</Typography>
                        </Grid>
                        <Grid item xs={6}>
                            <Typography variant="caption" color="text.secondary">Fecha de Reserva</Typography>
                            <Typography variant="body2">{dayjs(reservation.reservationDate).format('DD/MM/YYYY HH:mm')}</Typography>
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
                            <Typography variant="body2">{reservation.person?.fullName || "N/A"}</Typography>
                        </Grid>
                        <Grid item xs={6}>
                            <Typography variant="caption" color="text.secondary">Identificación</Typography>
                            <Typography variant="body2">{reservation.person?.identification || "N/A"}</Typography>
                        </Grid>
                        <Grid item xs={6}>
                            <Typography variant="caption" color="text.secondary">Email</Typography>
                            <Typography variant="body2">{reservation.person?.email || "N/A"}</Typography>
                        </Grid>
                        <Grid item xs={12}>
                            <Typography variant="caption" color="text.secondary">Teléfono</Typography>
                            <Typography variant="body2">{reservation.person?.phone || "N/A"}</Typography>
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
                            <Typography variant="body2">{reservation.tourPackage?.name || "N/A"}</Typography>
                        </Grid>
                        <Grid item xs={12}>
                            <Typography variant="caption" color="text.secondary">Destino</Typography>
                            <Typography variant="body2">{reservation.tourPackage?.destination || "N/A"}</Typography>
                        </Grid>
                        <Grid item xs={6}>
                            <Typography variant="caption" color="text.secondary">Fecha Ida</Typography>
                            <Typography variant="body2">{reservation.tourPackage?.startDate || "N/A"}</Typography>
                        </Grid>
                        <Grid item xs={6}>
                            <Typography variant="caption" color="text.secondary">Fecha Vuelta</Typography>
                            <Typography variant="body2">{reservation.tourPackage?.endDate || "N/A"}</Typography>
                        </Grid>
                    </Grid>

                    <Divider sx={{ my: 2 }} />

                    {/* Lista de pasajeros */}
                    {passengers.length > 0 && (
                        <>
                            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                                LISTA DE PASAJEROS
                            </Typography>
                            <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
                                <Table size="small">
                                    <TableHead sx={{ bgcolor: '#f8fafc' }}>
                                        <TableRow>
                                            <TableCell>#</TableCell>
                                            <TableCell>Nombre</TableCell>
                                            <TableCell>Identificación</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {passengers.map((passenger, idx) => (
                                            <TableRow key={idx}>
                                                <TableCell>{idx + 1}</TableCell>
                                                <TableCell>{passenger.person?.fullName}</TableCell>
                                                <TableCell>{passenger.person?.identification}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </>
                    )}

                    <Divider sx={{ my: 2 }} />

                    {/* Detalle de pago y descuentos */}
                    <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                        DETALLE DE PAGO
                    </Typography>

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2">Subtotal:</Typography>
                        <Typography variant="body2" fontWeight="bold">
                            ${(reservation.subtotal || 0).toLocaleString()}
                        </Typography>
                    </Box>

                    {discountDetails.length > 0 && (
                        <>
                            <Typography variant="subtitle2" gutterBottom sx={{ mt: 2, color: '#2e7d32' }}>
                                Descuentos aplicados:
                            </Typography>
                            {discountDetails.map((discount, idx) => (
                                <Box key={idx} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, ml: 2 }}>
                                    <Typography variant="body2" color="success.main">
                                        {discount.name}
                                    </Typography>
                                    <Typography variant="body2" color="success.main">
                                        -${Math.abs(discount.amount).toLocaleString()}
                                    </Typography>
                                </Box>
                            ))}
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1, mb: 2, ml: 2 }}>
                                <Typography variant="body2" fontWeight="bold" color="success.main">
                                    Total descuentos
                                </Typography>
                                <Typography variant="body2" fontWeight="bold" color="success.main">
                                    -${(reservation.discountAmount || 0).toLocaleString()}
                                </Typography>
                            </Box>
                        </>
                    )}

                    <Divider sx={{ my: 2 }} />

                    {/* Información del pago */}
                    {payment && (
                        <Box sx={{ mb: 3 }}>
                            <Typography variant="subtitle2" gutterBottom>
                                Información de la transacción:
                            </Typography>
                            <Grid container spacing={1}>
                                <Grid item xs={12}>
                                    <Typography variant="caption" color="text.secondary">ID de Transacción</Typography>
                                    <Typography variant="body2">{payment.transactionId || "N/A"}</Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="caption" color="text.secondary">Método de pago</Typography>
                                    <Typography variant="body2">
                                        {payment.paymentMethod === 'CREDIT_CARD' ? 'Tarjeta de Crédito' :
                                            payment.paymentMethod === 'DEBIT_CARD' ? 'Tarjeta de Débito' :
                                                payment.paymentMethod || "N/A"}
                                    </Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="caption" color="text.secondary">Tarjeta</Typography>
                                    <Typography variant="body2">{payment.cardNumber || "****"}</Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="caption" color="text.secondary">Fecha de pago</Typography>
                                    <Typography variant="body2">{dayjs(payment.createdAt).format('DD/MM/YYYY HH:mm')}</Typography>
                                </Grid>
                            </Grid>
                        </Box>
                    )}

                    <Divider sx={{ my: 2 }} />

                    {/* Monto total */}
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
                            ${(reservation.totalAmount || 0).toLocaleString()}
                        </Typography>
                    </Box>

                    <Box sx={{ textAlign: 'center', mt: 3, pt: 2, borderTop: '1px dashed #ccc' }}>
                        <Typography variant="caption" color="text.secondary">
                            Este documento es un comprobante de reserva. Para cualquier consulta, contacte a nuestro servicio al cliente.
                        </Typography>
                    </Box>
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

export default BookingDetails;