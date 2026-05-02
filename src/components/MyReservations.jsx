import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useKeycloak } from '@react-keycloak/web';
import {
    Box, Container, Paper, Typography, Grid, Card, CardContent,
    Chip, Button, Divider, CircularProgress, Alert, Accordion,
    AccordionSummary, AccordionDetails, IconButton, Tooltip,
    Dialog, DialogTitle, DialogContent, DialogActions,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow
} from "@mui/material";
import {
    Schedule as ScheduleIcon,
    CheckCircle as CheckCircleIcon,
    Cancel as CancelIcon,
    Payment as PaymentIcon,
    ExpandMore as ExpandMoreIcon,
    Person as PersonIcon,
    Visibility as VisibilityIcon,
    Receipt as ReceiptIcon,
    Print as PrintIcon,
    Close as CloseIcon
} from "@mui/icons-material";
import dayjs from 'dayjs';
import reservationService from "../services/reservation.service";
import paymentService from "../services/payment.service";
import Swal from 'sweetalert2';

const MyReservations = () => {
    const navigate = useNavigate();
    const { keycloak } = useKeycloak();
    const [reservations, setReservations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedReservation, setExpandedReservation] = useState(null);
    const [passengersMap, setPassengersMap] = useState({});
    const [receiptOpen, setReceiptOpen] = useState(false);
    const [currentReceipt, setCurrentReceipt] = useState(null);
    const [paymentInfo, setPaymentInfo] = useState(null);
    const [discountDetails, setDiscountDetails] = useState([]);

    useEffect(() => {
        loadReservations();
    }, []);

    const loadReservations = async () => {
        setLoading(true);
        try {
            const userId = localStorage.getItem(`person_id_${keycloak?.subject}`) || 1;
            const response = await reservationService.getByPersonId(userId);
            const data = response.data?.data || response.data || [];
            setReservations(data);
            
            for (const reservation of data) {
                await loadPassengersForReservation(reservation.id);
            }
        } catch (error) {
            console.error("Error cargando reservas:", error);
            Swal.fire('Error', 'No se pudieron cargar tus reservas', 'error');
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

    const fetchPaymentInfo = async (reservationId) => {
        try {
            const response = await paymentService.getByReservationId(reservationId);
            const payment = response.data?.data || response.data;
            setPaymentInfo(payment);
            return payment;
        } catch (error) {
            console.error("Error cargando información de pago:", error);
            return null;
        }
    };

    const getStatusChip = (status) => {
        switch(status) {
            case 'PENDIENTE':
                return <Chip label="Pendiente" color="warning" size="small" icon={<ScheduleIcon />} />;
            case 'PAGADA':
                return <Chip label="Pagada" color="success" size="small" icon={<PaymentIcon />} />;
            case 'CANCELADA':
                return <Chip label="Cancelada" color="error" size="small" icon={<CancelIcon />} />;
            case 'EXPIRADA':
                return <Chip label="Expirada" color="default" size="small" icon={<ScheduleIcon />} />;
            default:
                return <Chip label={status} size="small" />;
        }
    };

    const isExpired = (expirationDate) => {
        return dayjs(expirationDate).isBefore(dayjs());
    };

    const handleCancelReservation = async (reservation) => {
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
                loadReservations();
            } catch (error) {
                console.error("Error cancelando reserva:", error);
                Swal.fire('Error', 'No se pudo cancelar la reserva', 'error');
            } finally {
                setLoading(false);
            }
        }
    };

    const handleViewDetails = (reservation) => {
        navigate(`/reservation-details/${reservation.id}`);
    };

    const openReceipt = async (reservation) => {
        setLoading(true);
        try {
            // Obtener información del pago
            const payment = await fetchPaymentInfo(reservation.id);
            
            // Parsear descuentos
            let discounts = [];
            if (reservation.discountDetails) {
                try {
                    discounts = typeof reservation.discountDetails === 'string' 
                        ? JSON.parse(reservation.discountDetails) 
                        : reservation.discountDetails;
                } catch (e) {
                    discounts = [];
                }
            }
            
            setCurrentReceipt(reservation);
            setPaymentInfo(payment);
            setDiscountDetails(discounts);
            setReceiptOpen(true);
        } catch (error) {
            console.error("Error abriendo comprobante:", error);
            Swal.fire('Error', 'No se pudo cargar el comprobante', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const statusColors = {
        PENDIENTE: { bg: '#fff3e0', color: '#e65100', label: 'Pendiente' },
        PAGADA: { bg: '#e8f5e9', color: '#2e7d32', label: 'Pagada' },
        CANCELADA: { bg: '#ffebee', color: '#c62828', label: 'Cancelada' },
        EXPIRADA: { bg: '#f5f5f5', color: '#757575', label: 'Expirada' }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ py: 4 }}>
            <Container maxWidth="lg">
                <Typography variant="h4" fontWeight="bold" gutterBottom>
                    Mis Reservas
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
                    Historial de tus reservas y su estado actual
                </Typography>

                {reservations.length === 0 ? (
                    <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 3 }}>
                        <Typography variant="h6" color="text.secondary" gutterBottom>
                            No tienes reservas aún
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                            Explora nuestros paquetes turísticos y comienza tu próxima aventura
                        </Typography>
                        <Button 
                            variant="contained" 
                            onClick={() => navigate('/')}
                            sx={{
                                bgcolor: 'var(--primary)',
                                '&:hover': { bgcolor: 'var(--primary-hover)' }
                            }}
                        >
                            Explorar paquetes
                        </Button>
                    </Paper>
                ) : (
                    <Grid container spacing={3}>
                        {reservations.map((reservation) => {
                            const passengers = passengersMap[reservation.id] || [];
                            const isReservationExpired = isExpired(reservation.expirationDate);
                            const showPaymentButton = reservation.status === 'PENDIENTE' && !isReservationExpired;
                            
                            return (
                                <Grid item xs={12} key={reservation.id}>
                                    <Card sx={{ borderRadius: 2 }}>
                                        <CardContent>
                                            {/* Cabecera de la reserva */}
                                            <Box sx={{ 
                                                display: 'flex', 
                                                justifyContent: 'space-between', 
                                                alignItems: 'flex-start', 
                                                flexWrap: 'wrap',
                                                mb: 2
                                            }}>
                                                <Box>
                                                    <Typography variant="h6" gutterBottom>
                                                        Reserva #{reservation.id}
                                                    </Typography>
                                                    <Typography variant="subtitle1" color="primary" gutterBottom>
                                                        {reservation.tourPackage?.name}
                                                    </Typography>
                                                    <Typography variant="body2" color="text.secondary">
                                                        {reservation.tourPackage?.destination}
                                                    </Typography>
                                                </Box>
                                                <Box sx={{ textAlign: 'right' }}>
                                                    {getStatusChip(reservation.status)}
                                                    {reservation.status === 'PENDIENTE' && (
                                                        <Typography 
                                                            variant="caption" 
                                                            color={isReservationExpired ? "error" : "warning"} 
                                                            display="block" 
                                                            sx={{ mt: 1 }}
                                                        >
                                                            {isReservationExpired 
                                                                ? "Reserva expirada" 
                                                                : `Expira: ${dayjs(reservation.expirationDate).format('DD/MM/YYYY HH:mm')}`
                                                            }
                                                        </Typography>
                                                    )}
                                                </Box>
                                            </Box>

                                            <Divider sx={{ my: 2 }} />

                                            {/* Detalles de la reserva */}
                                            <Grid container spacing={2} sx={{ mb: 2 }}>
                                                <Grid item xs={6} sm={3}>
                                                    <Typography variant="caption" color="text.secondary">
                                                        Fecha de reserva
                                                    </Typography>
                                                    <Typography variant="body2">
                                                        {dayjs(reservation.reservationDate).format('DD/MM/YYYY HH:mm')}
                                                    </Typography>
                                                </Grid>
                                                <Grid item xs={6} sm={3}>
                                                    <Typography variant="caption" color="text.secondary">
                                                        Pasajeros
                                                    </Typography>
                                                    <Typography variant="body2">
                                                        {passengers.length} persona(s)
                                                    </Typography>
                                                </Grid>
                                                <Grid item xs={6} sm={3}>
                                                    <Typography variant="caption" color="text.secondary">
                                                        Fecha de viaje
                                                    </Typography>
                                                    <Typography variant="body2">
                                                        {reservation.tourPackage?.startDate} - {reservation.tourPackage?.endDate}
                                                    </Typography>
                                                </Grid>
                                                <Grid item xs={6} sm={3}>
                                                    <Typography variant="caption" color="text.secondary">
                                                        Total
                                                    </Typography>
                                                    <Typography variant="body2" fontWeight="bold" color="primary">
                                                        ${(reservation.totalAmount || 0).toLocaleString()}
                                                    </Typography>
                                                </Grid>
                                            </Grid>

                                            {/* Lista de pasajeros (acordeón) */}
                                            {passengers.length > 0 && (
                                                <Accordion 
                                                    sx={{ mt: 2, boxShadow: 'none', border: '1px solid #e2e8f0' }}
                                                    expanded={expandedReservation === reservation.id}
                                                    onChange={() => setExpandedReservation(
                                                        expandedReservation === reservation.id ? null : reservation.id
                                                    )}
                                                >
                                                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                                        <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                            <PersonIcon fontSize="small" />
                                                            Ver lista de pasajeros ({passengers.length})
                                                        </Typography>
                                                    </AccordionSummary>
                                                    <AccordionDetails>
                                                        <Grid container spacing={2}>
                                                            {passengers.map((passenger, index) => (
                                                                <Grid item xs={12} sm={6} md={4} key={index}>
                                                                    <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                                                                        <Typography variant="subtitle2" gutterBottom>
                                                                            Pasajero {index + 1}
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
                                                                    </Paper>
                                                                </Grid>
                                                            ))}
                                                        </Grid>
                                                    </AccordionDetails>
                                                </Accordion>
                                            )}

                                            <Divider sx={{ my: 2 }} />

                                            {/* Botones de acción */}
                                            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                                                <Tooltip title="Ver detalles">
                                                    <Button 
                                                        size="small" 
                                                        startIcon={<VisibilityIcon />}
                                                        onClick={() => handleViewDetails(reservation)}
                                                    >
                                                        Detalles
                                                    </Button>
                                                </Tooltip>
                                                
                                                {showPaymentButton && (
                                                    <Tooltip title="Completar pago">
                                                        <Button 
                                                            size="small" 
                                                            variant="contained" 
                                                            color="primary"
                                                            startIcon={<PaymentIcon />}
                                                            onClick={() => navigate(`/payment/${reservation.id}`)}
                                                        >
                                                            Completar pago
                                                        </Button>
                                                    </Tooltip>
                                                )}
                                                
                                                {reservation.status === 'PENDIENTE' && !isReservationExpired && (
                                                    <Tooltip title="Cancelar reserva">
                                                        <Button 
                                                            size="small" 
                                                            variant="outlined" 
                                                            color="error"
                                                            startIcon={<CancelIcon />}
                                                            onClick={() => handleCancelReservation(reservation)}
                                                        >
                                                            Cancelar
                                                        </Button>
                                                    </Tooltip>
                                                )}
                                                
                                                {reservation.status === 'PAGADA' && (
                                                    <Tooltip title="Ver comprobante">
                                                        <Button 
                                                            size="small" 
                                                            variant="outlined"
                                                            startIcon={<ReceiptIcon />}
                                                            onClick={() => openReceipt(reservation)}
                                                        >
                                                            Comprobante
                                                        </Button>
                                                    </Tooltip>
                                                )}
                                            </Box>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            );
                        })}
                    </Grid>
                )}
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
                                    <Typography variant="body1">{statusColors[currentReceipt.status]?.label}</Typography>
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
                                                {passengersMap[currentReceipt.id].map((passenger, idx) => (
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
                            
                            {/* Subtotal */}
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                <Typography variant="body2">Subtotal:</Typography>
                                <Typography variant="body2" fontWeight="bold">
                                    ${(currentReceipt.subtotal || 0).toLocaleString()}
                                </Typography>
                            </Box>

                            {/* Descuentos aplicados */}
                            {discountDetails.length > 0 && (
                                <>
                                    <Typography variant="subtitle2" gutterBottom sx={{ mt: 2, color: '#2e7d32' }}>
                                        Descuentos aplicados:
                                    </Typography>
                                    {discountDetails.map((discount, idx) => (
                                        <Box key={idx} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, ml: 2 }}>
                                            <Typography variant="body2" color="success.main">
                                                {discount.name} - {discount.description}
                                            </Typography>
                                            <Typography variant="body2" color="success.main">
                                                -${Math.abs(discount.amount).toLocaleString()}
                                            </Typography>
                                        </Box>
                                    ))}
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1, mb: 2, ml: 2 }}>
                                        <Typography variant="body2" fontWeight="bold" color="success.main">
                                            Total descuentos:
                                        </Typography>
                                        <Typography variant="body2" fontWeight="bold" color="success.main">
                                            -${(currentReceipt.discountAmount || 0).toLocaleString()}
                                        </Typography>
                                    </Box>
                                </>
                            )}

                            <Divider sx={{ my: 2 }} />

                            {/* Información del pago */}
                            {paymentInfo && (
                                <Box sx={{ mb: 3 }}>
                                    <Typography variant="subtitle2" gutterBottom>
                                        Información de la transacción:
                                    </Typography>
                                    <Grid container spacing={1}>
                                        <Grid item xs={12}>
                                            <Typography variant="caption" color="text.secondary">ID de Transacción</Typography>
                                            <Typography variant="body2">{paymentInfo.transactionId || "N/A"}</Typography>
                                        </Grid>
                                        <Grid item xs={6}>
                                            <Typography variant="caption" color="text.secondary">Método de pago</Typography>
                                            <Typography variant="body2">
                                                {paymentInfo.paymentMethod === 'CREDIT_CARD' ? 'Tarjeta de Crédito' : 
                                                 paymentInfo.paymentMethod === 'DEBIT_CARD' ? 'Tarjeta de Débito' : 
                                                 paymentInfo.paymentMethod || "N/A"}
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={6}>
                                            <Typography variant="caption" color="text.secondary">Tarjeta</Typography>
                                            <Typography variant="body2">{paymentInfo.cardNumber || "****"}</Typography>
                                        </Grid>
                                        <Grid item xs={12}>
                                            <Typography variant="caption" color="text.secondary">Fecha de pago</Typography>
                                            <Typography variant="body2">{dayjs(paymentInfo.createdAt).format('DD/MM/YYYY HH:mm')}</Typography>
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
                                    ${(currentReceipt.totalAmount || 0).toLocaleString()}
                                </Typography>
                            </Box>

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

export default MyReservations;