import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    Box, Container, Paper, Typography, TextField, Button, Grid,
    Divider, CircularProgress, Stepper, Step, StepLabel,
    Card, CardContent, Alert, InputAdornment, IconButton,
    FormControl, FormLabel, RadioGroup, FormControlLabel, Radio
} from "@mui/material";
import {
    ArrowBack as ArrowBackIcon,
    CreditCard as CreditCardIcon,
    Payment as PaymentIcon,
    CheckCircle as CheckCircleIcon,
    Visibility as VisibilityIcon,
    VisibilityOff as VisibilityOffIcon
} from "@mui/icons-material";
import Swal from 'sweetalert2';
import reservationService from "../services/reservation.service";
import paymentService from "../services/payment.service";
import dayjs from 'dayjs';

const steps = ['Verificar reserva', 'Datos de pago', 'Confirmación'];

const PaymentPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [activeStep, setActiveStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [reservation, setReservation] = useState(null);
    const [showCvv, setShowCvv] = useState(false);
    const [discountDetails, setDiscountDetails] = useState([]);
    
    const [formData, setFormData] = useState({
        cardNumber: "",
        cardHolderName: "",
        cardExpiration: "",
        cardCvv: "",
        paymentMethod: "CREDIT_CARD"
    });
    
    const [errors, setErrors] = useState({});

    useEffect(() => {
        loadReservation();
    }, [id]);

    const loadReservation = async () => {
        setLoading(true);
        try {
            const response = await reservationService.get(id);
            const data = response.data?.data || response.data;
            setReservation(data);
            
            // Parsear detalles de descuentos
            if (data.discountDetails) {
                try {
                    const discounts = typeof data.discountDetails === 'string' 
                        ? JSON.parse(data.discountDetails) 
                        : data.discountDetails;
                    setDiscountDetails(discounts);
                } catch (e) {
                    console.error("Error parsing discounts:", e);
                    setDiscountDetails([]);
                }
            }
            
            // Verificar estado de la reserva
            if (data.status === 'PAGADA') {
                Swal.fire({
                    title: 'Reserva ya pagada',
                    text: 'Esta reserva ya ha sido pagada anteriormente',
                    icon: 'info',
                    confirmButtonText: 'Ver mis reservas'
                }).then(() => {
                    navigate('/my-reservations');
                });
            } else if (data.status === 'CANCELADA') {
                Swal.fire({
                    title: 'Reserva cancelada',
                    text: 'Esta reserva ha sido cancelada y no puede ser pagada',
                    icon: 'error',
                    confirmButtonText: 'Volver'
                }).then(() => {
                    navigate('/my-reservations');
                });
            } else if (data.status === 'EXPIRADA') {
                Swal.fire({
                    title: 'Reserva expirada',
                    text: 'Esta reserva ha expirado y no puede ser pagada',
                    icon: 'error',
                    confirmButtonText: 'Volver'
                }).then(() => {
                    navigate('/my-reservations');
                });
            }
        } catch (error) {
            console.error("Error cargando reserva:", error);
            Swal.fire('Error', 'No se pudo cargar la información de la reserva', 'error');
            navigate('/my-reservations');
        } finally {
            setLoading(false);
        }
    };

    const validateForm = () => {
        const newErrors = {};
        
        // Validar número de tarjeta (16 dígitos)
        const cleanCardNumber = formData.cardNumber.replace(/\s/g, '');
        if (!cleanCardNumber.match(/^\d{16}$/)) {
            newErrors.cardNumber = "Número de tarjeta inválido (16 dígitos)";
        }
        
        // Validar nombre del titular
        if (!formData.cardHolderName.trim()) {
            newErrors.cardHolderName = "Nombre del titular es requerido";
        }
        
        // Validar fecha de expiración (MM/YY o MM/YYYY)
        if (!formData.cardExpiration.match(/^(0[1-9]|1[0-2])\/(\d{2}|\d{4})$/)) {
            newErrors.cardExpiration = "Formato inválido (MM/YY o MM/YYYY)";
        }
        
        // Validar CVV (3 dígitos)
        if (!formData.cardCvv.match(/^\d{3}$/)) {
            newErrors.cardCvv = "CVV inválido (3 dígitos)";
        }
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const formatCardNumber = (value) => {
        const clean = value.replace(/\s/g, '').replace(/\D/g, '');
        const groups = clean.match(/.{1,4}/g);
        return groups ? groups.join(' ') : clean;
    };

    const formatExpiration = (value) => {
        const clean = value.replace(/\D/g, '');
        if (clean.length >= 2) {
            return `${clean.slice(0, 2)}/${clean.slice(2, 6)}`;
        }
        return clean;
    };

    const handleCardNumberChange = (e) => {
        const formatted = formatCardNumber(e.target.value);
        setFormData(prev => ({ ...prev, cardNumber: formatted }));
        if (errors.cardNumber) setErrors(prev => ({ ...prev, cardNumber: "" }));
    };

    const handleExpirationChange = (e) => {
        const formatted = formatExpiration(e.target.value);
        setFormData(prev => ({ ...prev, cardExpiration: formatted }));
        if (errors.cardExpiration) setErrors(prev => ({ ...prev, cardExpiration: "" }));
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: "" }));
    };

    const handleNext = () => {
        if (activeStep === 1) {
            if (validateForm()) {
                setActiveStep(2);
            }
        } else {
            setActiveStep(prev => prev + 1);
        }
    };

    const handleBack = () => {
        setActiveStep(prev => prev - 1);
    };

    const processPayment = async () => {
        setProcessing(true);
        try {
            const paymentData = {
                reservationId: Number(id),
                cardNumber: formData.cardNumber.replace(/\s/g, ''),
                cardHolderName: formData.cardHolderName,
                cardExpiration: formData.cardExpiration,
                cardCvv: formData.cardCvv,
                paymentMethod: formData.paymentMethod,
                userId: 1
            };
            
            const response = await paymentService.processPayment(paymentData);
            
            if (response.data?.success) {
                Swal.fire({
                    title: '¡Pago exitoso!',
                    html: `
                        <div style="text-align: left">
                            <p><strong>Transacción:</strong> ${response.data.transactionId}</p>
                            <p><strong>Monto:</strong> $${(reservation?.totalAmount || getTotalAmount()).toLocaleString()}</p>
                            <p><strong>Fecha:</strong> ${dayjs().format('DD/MM/YYYY HH:mm')}</p>
                        </div>
                    `,
                    icon: 'success',
                    confirmButtonText: 'Ver mis reservas'
                });
                navigate('/my-reservations');
            } else {
                throw new Error(response.data?.message || 'Error al procesar el pago');
            }
        } catch (error) {
            console.error("Error procesando pago:", error);
            Swal.fire('Error', error.response?.data?.message || 'No se pudo procesar el pago', 'error');
        } finally {
            setProcessing(false);
        }
    };

    const getTotalAmount = () => {
        if (reservation?.totalAmount) return reservation.totalAmount;
        const price = reservation?.tourPackage?.price || 0;
        const passengers = reservation?.passengersCount || 1;
        return price * passengers;
    };

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
        <Box sx={{py: 4 }}>
            <Container maxWidth="md">
                <Button
                    startIcon={<ArrowBackIcon />}
                    onClick={() => navigate('/my-reservations')}
                    sx={{ mb: 3 }}
                >
                    Volver a mis reservas
                </Button>

                <Paper sx={{ p: 4, borderRadius: 3 }}>
                    <Typography variant="h4" fontWeight="bold" gutterBottom align="center">
                        Pago de Reserva
                    </Typography>
                    <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 4 }}>
                        Completa el pago de tu reserva de forma segura
                    </Typography>

                    <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
                        {steps.map((label) => (
                            <Step key={label}>
                                <StepLabel>{label}</StepLabel>
                            </Step>
                        ))}
                    </Stepper>

                    {activeStep === 0 && (
                        <Box>
                            <Typography variant="h6" gutterBottom>
                                Resumen de la reserva
                            </Typography>
                            <Divider sx={{ mb: 3 }} />
                            
                            <Card variant="outlined" sx={{ mb: 3 }}>
                                <CardContent>
                                    <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                                        Detalles de la reserva
                                    </Typography>
                                    <Grid container spacing={2}>
                                        <Grid item xs={12} sm={6}>
                                            <Typography variant="caption" color="text.secondary">
                                                Número de reserva
                                            </Typography>
                                            <Typography variant="body1" fontWeight="bold">
                                                #{reservation.id}
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                            <Typography variant="caption" color="text.secondary">
                                                Estado
                                            </Typography>
                                            <Typography variant="body1">
                                                {reservation.status}
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={12}>
                                            <Typography variant="caption" color="text.secondary">
                                                Paquete
                                            </Typography>
                                            <Typography variant="body1">
                                                {reservation.tourPackage?.name}
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={12}>
                                            <Typography variant="caption" color="text.secondary">
                                                Pasajeros
                                            </Typography>
                                            <Typography variant="body1">
                                                {reservation.passengersCount || 1} personas
                                            </Typography>
                                        </Grid>
                                        
                                        {/* Mostrar descuentos si existen */}
                                        {discountDetails.length > 0 && (
                                            <Grid item xs={12}>
                                                <Divider sx={{ my: 1 }} />
                                                <Typography variant="subtitle2" gutterBottom>
                                                    Descuentos aplicados
                                                </Typography>
                                                {discountDetails.map((discount, idx) => (
                                                    <Box key={idx} sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                                        <Typography variant="body2">{discount.name}</Typography>
                                                        <Typography variant="body2" color="success.main">
                                                            -${discount.amount?.toLocaleString()}
                                                        </Typography>
                                                    </Box>
                                                ))}
                                            </Grid>
                                        )}
                                        
                                        <Grid item xs={12}>
                                            <Divider sx={{ my: 1 }} />
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <Typography variant="subtitle1" fontWeight="bold">
                                                    Subtotal
                                                </Typography>
                                                <Typography variant="h6">
                                                    ${(reservation.subtotal || getTotalAmount()).toLocaleString()}
                                                </Typography>
                                            </Box>
                                            {reservation.discountAmount > 0 && (
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                                                    <Typography variant="body2" color="success.main">
                                                        Descuento total
                                                    </Typography>
                                                    <Typography variant="body2" color="success.main">
                                                        -${reservation.discountAmount?.toLocaleString()}
                                                    </Typography>
                                                </Box>
                                            )}
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
                                                <Typography variant="subtitle1" fontWeight="bold" color="primary">
                                                    Total a pagar
                                                </Typography>
                                                <Typography variant="h5" color="primary" fontWeight="bold">
                                                    ${(reservation.totalAmount || getTotalAmount()).toLocaleString()}
                                                </Typography>
                                            </Box>
                                        </Grid>
                                    </Grid>
                                </CardContent>
                            </Card>

                            <Alert severity="info" sx={{ mt: 2 }}>
                                <Typography variant="body2">
                                    Este es un simulador de pago. Los datos de tarjeta no son validados realmente.
                                    Puedes usar cualquier número de 16 dígitos, fecha futura y CVV de 3 dígitos.
                                </Typography>
                            </Alert>
                        </Box>
                    )}

                    {activeStep === 1 && (
                        <Box>
                            <Typography variant="h6" gutterBottom>
                                Datos de pago
                            </Typography>
                            <Divider sx={{ mb: 3 }} />

                            <Grid container spacing={3}>
                                <Grid item xs={12}>
                                    <FormControl component="fieldset">
                                        <FormLabel component="legend">Método de pago</FormLabel>
                                        <RadioGroup
                                            row
                                            name="paymentMethod"
                                            value={formData.paymentMethod}
                                            onChange={handleChange}
                                        >
                                            <FormControlLabel 
                                                value="CREDIT_CARD" 
                                                control={<Radio />} 
                                                label="Tarjeta de Crédito" 
                                            />
                                            <FormControlLabel 
                                                value="DEBIT_CARD" 
                                                control={<Radio />} 
                                                label="Tarjeta de Débito" 
                                            />
                                        </RadioGroup>
                                    </FormControl>
                                </Grid>

                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        label="Número de tarjeta"
                                        value={formData.cardNumber}
                                        onChange={handleCardNumberChange}
                                        error={!!errors.cardNumber}
                                        helperText={errors.cardNumber || "16 dígitos (ej: 1234 5678 9012 3456)"}
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <CreditCardIcon color="action" />
                                                </InputAdornment>
                                            )
                                        }}
                                    />
                                </Grid>

                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        label="Nombre del titular"
                                        name="cardHolderName"
                                        value={formData.cardHolderName}
                                        onChange={handleChange}
                                        error={!!errors.cardHolderName}
                                        helperText={errors.cardHolderName}
                                        placeholder="Como aparece en la tarjeta"
                                    />
                                </Grid>

                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        fullWidth
                                        label="Fecha de expiración"
                                        value={formData.cardExpiration}
                                        onChange={handleExpirationChange}
                                        error={!!errors.cardExpiration}
                                        helperText={errors.cardExpiration || "MM/AA (ej: 12/28)"}
                                        placeholder="MM/AA"
                                    />
                                </Grid>

                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        fullWidth
                                        label="CVV"
                                        name="cardCvv"
                                        type={showCvv ? "text" : "password"}
                                        value={formData.cardCvv}
                                        onChange={handleChange}
                                        error={!!errors.cardCvv}
                                        helperText={errors.cardCvv || "3 dígitos"}
                                        InputProps={{
                                            endAdornment: (
                                                <InputAdornment position="end">
                                                    <IconButton onClick={() => setShowCvv(!showCvv)}>
                                                        {showCvv ? <VisibilityOffIcon /> : <VisibilityIcon />}
                                                    </IconButton>
                                                </InputAdornment>
                                            )
                                        }}
                                    />
                                </Grid>
                            </Grid>

                            <Alert severity="warning" sx={{ mt: 3 }}>
                                <Typography variant="body2">
                                    <strong>Simulación:</strong> Este es un entorno de prueba. No se realizarán cargos reales.
                                    Puedes usar: 4242 4242 4242 4242 | 12/28 | 123
                                </Typography>
                            </Alert>
                        </Box>
                    )}

                    {activeStep === 2 && (
                        <Box>
                            <Typography variant="h6" gutterBottom>
                                Confirmar pago
                            </Typography>
                            <Divider sx={{ mb: 3 }} />

                            <Card variant="outlined" sx={{ mb: 3 }}>
                                <CardContent>
                                    <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                                        Detalles de la transacción
                                    </Typography>
                                    <Grid container spacing={2}>
                                        <Grid item xs={6}>
                                            <Typography variant="caption" color="text.secondary">
                                                Reserva
                                            </Typography>
                                            <Typography variant="body2">#{reservation.id}</Typography>
                                        </Grid>
                                        <Grid item xs={6}>
                                            <Typography variant="caption" color="text.secondary">
                                                Método de pago
                                            </Typography>
                                            <Typography variant="body2">
                                                {formData.paymentMethod === 'CREDIT_CARD' ? 'Tarjeta de Crédito' : 'Tarjeta de Débito'}
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={6}>
                                            <Typography variant="caption" color="text.secondary">
                                                Tarjeta
                                            </Typography>
                                            <Typography variant="body2">
                                                **** {formData.cardNumber.slice(-4)}
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={6}>
                                            <Typography variant="caption" color="text.secondary">
                                                Titular
                                            </Typography>
                                            <Typography variant="body2">
                                                {formData.cardHolderName}
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={12}>
                                            <Divider sx={{ my: 1 }} />
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <Typography variant="subtitle1" fontWeight="bold">
                                                    Monto a pagar
                                                </Typography>
                                                <Typography variant="h5" color="primary" fontWeight="bold">
                                                    ${(reservation?.totalAmount || getTotalAmount()).toLocaleString()}
                                                </Typography>
                                            </Box>
                                        </Grid>
                                    </Grid>
                                </CardContent>
                            </Card>

                            <Alert severity="info" sx={{ mb: 2 }}>
                                <Typography variant="body2">
                                    Al confirmar el pago, se procesará la transacción y tu reserva será confirmada.
                                </Typography>
                            </Alert>
                        </Box>
                    )}

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
                        <Button
                            variant="outlined"
                            onClick={handleBack}
                            disabled={activeStep === 0}
                        >
                            Anterior
                        </Button>
                        {activeStep === steps.length - 1 ? (
                            <Button
                                variant="contained"
                                onClick={processPayment}
                                disabled={processing}
                                startIcon={processing ? <CircularProgress size={20} /> : <PaymentIcon />}
                                sx={{
                                    bgcolor: '#2e7d32',
                                    '&:hover': { bgcolor: '#1b5e20' }
                                }}
                            >
                                {processing ? 'Procesando...' : 'Confirmar pago'}
                            </Button>
                        ) : (
                            <Button
                                variant="contained"
                                onClick={handleNext}
                                sx={{
                                    bgcolor: 'var(--primary)',
                                    '&:hover': { bgcolor: 'var(--primary-hover)' }
                                }}
                            >
                                Continuar
                            </Button>
                        )}
                    </Box>
                </Paper>
            </Container>
        </Box>
    );
};

export default PaymentPage;