import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    Box, Container, Paper, Typography, TextField, Button, Grid,
    Divider, CircularProgress, Stack, Chip, InputAdornment,
    FormControl, InputLabel, Select, MenuItem, Alert,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    IconButton, Tooltip, Dialog, DialogTitle, DialogContent, DialogActions,
    Card, CardContent
} from "@mui/material";
import {
    Save as SaveIcon,
    Cancel as CancelIcon,
    ArrowBack as ArrowBackIcon,
    Person as PersonIcon,
    CardTravel as PackageIcon,
    Schedule as ScheduleIcon,
    ExpandMore as ExpandMoreIcon,
    Visibility as VisibilityIcon,
    Receipt as ReceiptIcon,
    CheckCircle as CheckCircleIcon,
    Pending as PendingIcon,
    Cancel as CancelIconBtn,
    Print as PrintIcon,
    Close as CloseIcon,
    Edit as EditIcon,
    Payment as PaymentIcon,
    AttachMoney as MoneyIcon,
    DateRange as DateRangeIcon,
    People as PeopleIcon,
    Email as EmailIcon,
    Phone as PhoneIcon,
    Badge as BadgeIcon,
    LocationOn as LocationIcon,
    CreditCard as CreditCardIcon
} from "@mui/icons-material";
import Swal from 'sweetalert2';
import reservationService from "../services/reservation.service";
import personService from "../services/person.service";
import tourPackageService from "../services/tourPackage.service";
import paymentService from "../services/payment.service";
import dayjs from 'dayjs';
import { useKeycloak } from '@react-keycloak/web';

const ReservationAddEdit = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const { keycloak } = useKeycloak();
    const currentUserId = keycloak?.subject ? localStorage.getItem(`person_id_${keycloak.subject}`) : 1;
    const isEditMode = !!id && id !== 'new';
    const isViewMode = window.location.pathname.includes('/view/');

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState({});
    const [persons, setPersons] = useState([]);
    const [packages, setPackages] = useState([]);
    const [loadingData, setLoadingData] = useState(true);
    const [passengers, setPassengers] = useState([]);
    const [receiptOpen, setReceiptOpen] = useState(false);
    const [paymentInfo, setPaymentInfo] = useState(null);
    const [discountDetails, setDiscountDetails] = useState([]);

    const [formData, setFormData] = useState({
        personId: "",
        tourPackageId: "",
        status: "PENDIENTE",
        active: 1,
        createdByUserId: currentUserId || 1,
        modifiedByUserId: currentUserId || 1,
        reservationDate: null,
        expirationDate: null,
        totalAmount: 0,
        subtotal: 0,
        discountAmount: 0,
        solicitudes: ""
    });

    const statusColors = {
        PENDIENTE: { bg: '#fff3e0', color: '#e65100', label: 'Pendiente', icon: <PendingIcon sx={{ fontSize: 16 }} /> },
        PAGADA: { bg: '#e8f5e9', color: '#2e7d32', label: 'Pagada', icon: <CheckCircleIcon sx={{ fontSize: 16 }} /> },
        CANCELADA: { bg: '#ffebee', color: '#c62828', label: 'Cancelada', icon: <CancelIconBtn sx={{ fontSize: 16 }} /> },
        EXPIRADA: { bg: '#f5f5f5', color: '#757575', label: 'Expirada', icon: <ScheduleIcon sx={{ fontSize: 16 }} /> }
    };

    useEffect(() => {
        const init = async () => {
            await loadSelectData();
            if (isEditMode || isViewMode) {
                fetchReservationData();
                fetchPassengers();
                fetchPaymentInfo();
            }
        };
        init();
    }, [id]);

    const loadSelectData = async () => {
        setLoadingData(true);
        try {
            const [personsRes, packagesRes] = await Promise.all([
                personService.getAllActive(),
                tourPackageService.getAllActive()
            ]);

            setPersons(personsRes.data?.data || personsRes.data || []);
            setPackages(packagesRes.data?.data || packagesRes.data || []);
        } catch (error) {
            console.error("Error cargando datos:", error);
            Swal.fire('Error', 'No se pudieron cargar los datos necesarios', 'error');
        } finally {
            setLoadingData(false);
        }
    };

    const fetchReservationData = async () => {
        setLoading(true);
        try {
            const response = await reservationService.get(id);
            const reservationData = response.data?.data || response.data;

            if (reservationData) {
                setFormData({
                    personId: reservationData.person?.id || "",
                    tourPackageId: reservationData.tourPackage?.id || "",
                    status: reservationData.status || "PENDIENTE",
                    active: reservationData.active || 1,
                    createdByUserId: reservationData.createdByUserId || currentUserId || 1,
                    modifiedByUserId: currentUserId || 1,
                    reservationDate: reservationData.reservationDate,
                    expirationDate: reservationData.expirationDate,
                    totalAmount: reservationData.totalAmount ||
                        (reservationData.tourPackage?.price * (reservationData.passengersCount || 1)) || 0,
                    subtotal: reservationData.subtotal ||
                        (reservationData.tourPackage?.price * (reservationData.passengersCount || 1)) || 0,
                    discountAmount: reservationData.discountAmount || 0,
                    solicitudes: reservationData.solicitudes || ""
                });

                if (reservationData.person) {
                    setPersons(prev => {
                        const exists = prev.some(p => p.id === reservationData.person.id);
                        if (!exists) return [...prev, reservationData.person];
                        return prev;
                    });
                }

                if (reservationData.tourPackage) {
                    setPackages(prev => {
                        const exists = prev.some(p => p.id === reservationData.tourPackage.id);
                        if (!exists) return [...prev, reservationData.tourPackage];
                        return prev;
                    });
                }

                if (reservationData.discountDetails) {
                    try {
                        const discounts = typeof reservationData.discountDetails === 'string'
                            ? JSON.parse(reservationData.discountDetails)
                            : reservationData.discountDetails;
                        setDiscountDetails(discounts);
                    } catch (e) {
                        setDiscountDetails([]);
                    }
                }
            }
        } catch (error) {
            console.error("Error al cargar la reserva", error);
            Swal.fire('Error', 'No se pudo cargar la información de la reserva', 'error');
            navigate('/admin/reservations');
        } finally {
            setLoading(false);
        }
    };

    const fetchPassengers = async () => {
        try {
            const response = await reservationService.getPassengers(id);
            const passengersData = response.data?.data || response.data || [];
            setPassengers(passengersData);
        } catch (error) {
            console.error("Error cargando pasajeros:", error);
            setPassengers([]);
        }
    };

    const fetchPaymentInfo = async () => {
        try {
            const response = await paymentService.getByReservationId(id);
            const payment = response.data?.data || response.data;
            setPaymentInfo(payment);
        } catch (error) {
            console.error("Error cargando información de pago:", error);
            setPaymentInfo(null);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: "" }));
    };

    const validateForm = () => {
        const newErrors = {};
        if (!formData.personId) newErrors.personId = "Seleccione un cliente";
        if (!formData.tourPackageId) newErrors.tourPackageId = "Seleccione un paquete turístico";
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const getFullPerson = (personId) => {
        const person = persons.find(p => p.id === Number(personId));
        if (!person) return null;
        return {
            id: person.id,
            fullName: person.fullName || "",
            identification: person.identification || "",
            email: person.email || "",
            phone: person.phone || "",
            nationality: person.nationality || "",
            active: person.active || 1
        };
    };

    const getFullPackage = (packageId) => {
        const pkg = packages.find(p => p.id === Number(packageId));
        if (!pkg) return null;
        return {
            id: pkg.id,
            name: pkg.name || "",
            destination: pkg.destination || "",
            price: pkg.price || 0,
            startDate: pkg.startDate || "",
            endDate: pkg.endDate || ""
        };
    };

    const openReceipt = () => setReceiptOpen(true);
    const handlePrint = () => window.print();

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (isViewMode) {
            navigate('/admin/reservations');
            return;
        }

        if (!validateForm()) {
            Swal.fire('Error de validación', 'Por favor complete los campos requeridos', 'error');
            return;
        }

        setSaving(true);
        try {
            const fullPerson = getFullPerson(formData.personId);
            const fullPackage = getFullPackage(formData.tourPackageId);

            if (!fullPerson || !fullPackage) {
                throw new Error('No se encontraron los datos completos de la persona o el paquete');
            }

            const submitData = {
                id: Number(id),
                person: fullPerson,
                tourPackage: fullPackage,
                reservationDate: formData.reservationDate,
                expirationDate: formData.expirationDate,
                status: formData.status,
                active: 1,
                createdByUserId: formData.createdByUserId || currentUserId || 1,
                modifiedByUserId: currentUserId || 1,
                solicitudes: formData.solicitudes || ""
            };

            await reservationService.update(submitData);
            Swal.fire('¡Actualizada!', 'La reserva ha sido actualizada correctamente', 'success');
            navigate('/admin/reservations');
        } catch (error) {
            console.error("Error al guardar", error);
            Swal.fire('Error', error.response?.data?.message || error.message || 'Hubo un problema al guardar la reserva', 'error');
        } finally {
            setSaving(false);
        }
    };

    const getStatusChip = (status) => {
        const style = statusColors[status] || statusColors.PENDIENTE;
        return (
            <Chip
                label={style.label}
                size="small"
                icon={style.icon}
                sx={{ bgcolor: style.bg, color: style.color, fontWeight: 'bold' }}
            />
        );
    };

    const selectedPerson = persons.find(p => p.id === Number(formData.personId));
    const selectedPackage = packages.find(p => p.id === Number(formData.tourPackageId));

    if (loading || loadingData) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3, bgcolor: '#f5f7fa', minHeight: '100vh' }}>
            <Container maxWidth="lg">
                <Paper sx={{ borderRadius: 3, overflow: 'hidden' }}>
                    {/* Header con gradiente */}
                    <Box sx={{
                        background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)',
                        color: 'white',
                        p: 4
                    }}>
                        <Typography variant="overline" sx={{ opacity: 0.9, letterSpacing: 1.5 }}>
                            {isViewMode ? 'VER REGISTRO' : isEditMode ? 'EDITAR REGISTRO' : 'NUEVO REGISTRO'}
                        </Typography>
                        <Typography variant="h4" fontWeight="bold">
                            {isViewMode ? 'Detalles de Reserva' : isEditMode ? 'Editar Reserva' : 'Nueva Reserva'}
                        </Typography>
                        {id && id !== 'new' && (
                            <Typography variant="body2" sx={{ opacity: 0.8, mt: 0.5 }}>
                                ID: {id}
                            </Typography>
                        )}
                    </Box>

                    <form onSubmit={handleSubmit}>
                        <Box sx={{ p: 4 }}>
                            <Grid container spacing={3}>
                                {/* Alerta de estado actual */}
                                <Grid item xs={12}>
                                    <Alert
                                        severity={formData.status === 'PENDIENTE' ? 'warning' :
                                            formData.status === 'PAGADA' ? 'success' :
                                                formData.status === 'CANCELADA' ? 'error' : 'info'}
                                        icon={statusColors[formData.status]?.icon}
                                    >
                                        <strong>Estado actual:</strong> {statusColors[formData.status]?.label}
                                        {formData.status === 'PENDIENTE' && (
                                            <span> - Expira: {dayjs(formData.expirationDate).format('DD/MM/YYYY HH:mm')}</span>
                                        )}
                                    </Alert>
                                </Grid>

                                {/* Cliente */}
                                <Grid item xs={12} md={6}>
                                    <FormControl fullWidth error={!!errors.personId} required>
                                        <InputLabel>Cliente</InputLabel>
                                        <Select
                                            name="personId"
                                            value={formData.personId}
                                            onChange={handleChange}
                                            label="Cliente"
                                            disabled
                                        >
                                            <MenuItem value=""><em>Seleccione un cliente</em></MenuItem>
                                            {persons.map(person => (
                                                <MenuItem key={person.id} value={person.id}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                        <PersonIcon fontSize="small" />
                                                        <span>{person.fullName}</span>
                                                        <span style={{ color: '#666', fontSize: '0.85em' }}>({person.identification})</span>
                                                        {(!person.active || person.active === 0) && (
                                                            <Chip label="Inactivo" size="small" />
                                                        )}
                                                    </Box>
                                                </MenuItem>
                                            ))}
                                        </Select>
                                        {errors.personId && (
                                            <Typography variant="caption" color="error">{errors.personId}</Typography>
                                        )}
                                    </FormControl>
                                </Grid>

                                {/* Paquete */}
                                <Grid item xs={12} md={6}>
                                    <FormControl fullWidth error={!!errors.tourPackageId} required>
                                        <InputLabel>Paquete Turístico</InputLabel>
                                        <Select
                                            name="tourPackageId"
                                            value={formData.tourPackageId}
                                            onChange={handleChange}
                                            label="Paquete Turístico"
                                            disabled
                                        >
                                            <MenuItem value=""><em>Seleccione un paquete</em></MenuItem>
                                            {packages.map(pkg => (
                                                <MenuItem key={pkg.id} value={pkg.id}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                        <PackageIcon fontSize="small" />
                                                        <span>{pkg.name}</span>
                                                        <span style={{ color: '#666', fontSize: '0.85em' }}>({pkg.destination})</span>
                                                        {(!pkg.active || pkg.active === 0) && (
                                                            <Chip label="Inactivo" size="small" color="error" />
                                                        )}
                                                    </Box>
                                                </MenuItem>
                                            ))}
                                        </Select>
                                        {errors.tourPackageId && (
                                            <Typography variant="caption" color="error">{errors.tourPackageId}</Typography>
                                        )}
                                    </FormControl>
                                </Grid>

                                {/* Estado (solo visible en edición) */}
                                {(isEditMode || isViewMode) && (
                                    <Grid item xs={12} md={6}>
                                        <FormControl fullWidth>
                                            <InputLabel>Estado</InputLabel>
                                            <Select
                                                name="status"
                                                value={formData.status}
                                                onChange={handleChange}
                                                label="Estado"
                                                disabled={isViewMode}
                                            >
                                                <MenuItem value="PENDIENTE">Pendiente</MenuItem>
                                                <MenuItem value="PAGADA">Pagada</MenuItem>
                                                <MenuItem value="CANCELADA">Cancelada</MenuItem>
                                                <MenuItem value="EXPIRADA">Expirada</MenuItem>
                                            </Select>
                                        </FormControl>
                                    </Grid>
                                )}

                                {/* Solicitudes especiales */}
                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        label="Solicitudes especiales"
                                        name="solicitudes"
                                        value={formData.solicitudes}
                                        onChange={handleChange}
                                        multiline
                                        rows={3}
                                        disabled={isViewMode}
                                        placeholder="Ej: Alimentación especial, necesidades de accesibilidad, habitación contigua, etc."
                                        helperText="Opcional - Solicitudes especiales del cliente"
                                    />
                                </Grid>

                                {/* Lista de pasajeros */}
                                {passengers.length > 0 && (
                                    <Grid item xs={12}>
                                        <Paper variant="outlined" sx={{ p: 2 }}>
                                            <Typography variant="subtitle1" fontWeight="bold" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <PeopleIcon color="primary" />
                                                Lista de Pasajeros ({passengers.length})
                                            </Typography>
                                            <Divider sx={{ mb: 2 }} />
                                            <TableContainer>
                                                <Table size="small">
                                                    <TableHead sx={{ bgcolor: '#f8fafc' }}>
                                                        <TableRow>
                                                            <TableCell>#</TableCell>
                                                            <TableCell>Nombre</TableCell>
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
                                                                <TableCell>{passenger.person?.identification}</TableCell>
                                                                <TableCell>{passenger.person?.email}</TableCell>
                                                                <TableCell>{passenger.person?.phone || '-'}</TableCell>
                                                            </TableRow>
                                                        ))}
                                                    </TableBody>
                                                </Table>
                                            </TableContainer>
                                        </Paper>
                                    </Grid>
                                )}

                                {/* Resumen de precios (solo vista/edición) */}
                                {(isEditMode || isViewMode) && formData.totalAmount > 0 && (
                                    <Grid item xs={12}>
                                        <Paper sx={{ p: 2, bgcolor: '#f8fafc' }}>
                                            <Typography variant="subtitle1" fontWeight="bold" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <MoneyIcon color="primary" />
                                                Resumen de Precios
                                            </Typography>
                                            <Divider sx={{ mb: 2 }} />

                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                                <Typography variant="body2" color="text.secondary">Subtotal:</Typography>
                                                <Typography variant="body2">${(formData.subtotal || 0).toLocaleString()}</Typography>
                                            </Box>

                                            {discountDetails.length > 0 && (
                                                <>
                                                    {discountDetails.map((discount, idx) => (
                                                        <Box key={idx} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, ml: 2 }}>
                                                            <Typography variant="body2" color="success.main">{discount.name}</Typography>
                                                            <Typography variant="body2" color="success.main">
                                                                -${Math.abs(discount.amount).toLocaleString()}
                                                            </Typography>
                                                        </Box>
                                                    ))}
                                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1, mb: 2 }}>
                                                        <Typography variant="body2" fontWeight="bold">Total descuentos:</Typography>
                                                        <Typography variant="body2" color="success.main" fontWeight="bold">
                                                            -${(formData.discountAmount || 0).toLocaleString()}
                                                        </Typography>
                                                    </Box>
                                                    <Divider sx={{ my: 1 }} />
                                                </>
                                            )}

                                            <Box sx={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                p: 2,
                                                bgcolor: '#e3f2fd',
                                                borderRadius: 2,
                                                mt: 1
                                            }}>
                                                <Typography variant="h6" fontWeight="bold">TOTAL</Typography>
                                                <Typography variant="h5" color="primary" fontWeight="bold">
                                                    ${(formData.totalAmount || 0).toLocaleString()}
                                                </Typography>
                                            </Box>
                                        </Paper>
                                    </Grid>
                                )}

                                {/* Información de pago (si está pagada) */}
                                {paymentInfo && (
                                    <Grid item xs={12}>
                                        <Paper sx={{ p: 2, bgcolor: '#e8f5e9' }}>
                                            <Typography variant="subtitle1" fontWeight="bold" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <PaymentIcon color="success" />
                                                Información del Pago
                                            </Typography>
                                            <Divider sx={{ mb: 2 }} />
                                            <Grid container spacing={2}>
                                                <Grid item xs={12} sm={6}>
                                                    <Typography variant="caption" color="text.secondary">ID Transacción</Typography>
                                                    <Typography variant="body2">{paymentInfo.transactionId || "N/A"}</Typography>
                                                </Grid>
                                                <Grid item xs={12} sm={6}>
                                                    <Typography variant="caption" color="text.secondary">Método de pago</Typography>
                                                    <Typography variant="body2">
                                                        {paymentInfo.paymentMethod === 'CREDIT_CARD' ? 'Tarjeta de Crédito' :
                                                            paymentInfo.paymentMethod === 'DEBIT_CARD' ? 'Tarjeta de Débito' : paymentInfo.paymentMethod || "N/A"}
                                                    </Typography>
                                                </Grid>
                                                <Grid item xs={12} sm={6}>
                                                    <Typography variant="caption" color="text.secondary">Tarjeta</Typography>
                                                    <Typography variant="body2">{paymentInfo.cardNumber || "****"}</Typography>
                                                </Grid>
                                                <Grid item xs={12} sm={6}>
                                                    <Typography variant="caption" color="text.secondary">Fecha de pago</Typography>
                                                    <Typography variant="body2">{dayjs(paymentInfo.createdAt).format('DD/MM/YYYY HH:mm')}</Typography>
                                                </Grid>
                                            </Grid>
                                        </Paper>
                                    </Grid>
                                )}

                                {/* Información de expiración (si está pendiente) */}
                                {formData.status === 'PENDIENTE' && formData.expirationDate && (
                                    <Grid item xs={12}>
                                        <Alert severity="warning" sx={{ bgcolor: '#fff3e0' }}>
                                            <Typography variant="body2">
                                                Esta reserva expira el <strong>{dayjs(formData.expirationDate).format('DD/MM/YYYY HH:mm')}</strong>
                                            </Typography>
                                            <Typography variant="caption">
                                                El cliente debe completar el pago antes de esa fecha para confirmar la reserva.
                                            </Typography>
                                        </Alert>
                                    </Grid>
                                )}
                            </Grid>

                            <Divider sx={{ my: 4 }} />

                            {/* Botones de acción */}
                            <Stack direction="row" spacing={2} justifyContent="flex-end">
                                <Button
                                    variant="outlined"
                                    onClick={() => navigate('/admin/reservations')}
                                    startIcon={<CancelIcon />}
                                    size="large"
                                >
                                    Volver
                                </Button>

                                {isViewMode && formData.status === 'PAGADA' && (
                                    <Button
                                        variant="contained"
                                        onClick={openReceipt}
                                        startIcon={<ReceiptIcon />}
                                        sx={{ bgcolor: '#1565c0', '&:hover': { bgcolor: '#0d47a1' } }}
                                    >
                                        Ver Comprobante
                                    </Button>
                                )}

                                {!isViewMode && (
                                    <Button
                                        type="submit"
                                        variant="contained"
                                        disabled={saving}
                                        startIcon={saving ? <CircularProgress size={24} /> : <SaveIcon />}
                                        sx={{
                                            bgcolor: 'var(--primary)',
                                            '&:hover': { bgcolor: 'var(--primary-hover)' },
                                            minWidth: 140,
                                            py: 1.2
                                        }}
                                        size="large"
                                    >
                                        {saving ? 'Guardando...' : 'Actualizar Reserva'}
                                    </Button>
                                )}
                            </Stack>
                        </Box>
                    </form>
                </Paper>

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
                        <IconButton onClick={() => setReceiptOpen(false)} sx={{ color: 'white' }}>
                            <CloseIcon />
                        </IconButton>
                    </DialogTitle>
                    <DialogContent sx={{ p: 4 }} id="receipt-content">
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
                                <Typography variant="body1" fontWeight="bold">#{id}</Typography>
                            </Grid>
                            <Grid item xs={6}>
                                <Typography variant="caption" color="text.secondary">Estado</Typography>
                                <Box>{getStatusChip(formData.status)}</Box>
                            </Grid>
                            <Grid item xs={6}>
                                <Typography variant="caption" color="text.secondary">Fecha de Reserva</Typography>
                                <Typography variant="body2">{dayjs(formData.reservationDate).format('DD/MM/YYYY HH:mm')}</Typography>
                            </Grid>
                        </Grid>

                        <Divider sx={{ my: 2 }} />

                        <Typography variant="subtitle1" fontWeight="bold" gutterBottom>INFORMACIÓN DEL CLIENTE</Typography>
                        <Grid container spacing={2} sx={{ mb: 3 }}>
                            <Grid item xs={12}>
                                <Typography variant="caption" color="text.secondary">Nombre</Typography>
                                <Typography variant="body2">{selectedPerson?.fullName || "N/A"}</Typography>
                            </Grid>
                            <Grid item xs={6}>
                                <Typography variant="caption" color="text.secondary">Identificación</Typography>
                                <Typography variant="body2">{selectedPerson?.identification || "N/A"}</Typography>
                            </Grid>
                            <Grid item xs={6}>
                                <Typography variant="caption" color="text.secondary">Email</Typography>
                                <Typography variant="body2">{selectedPerson?.email || "N/A"}</Typography>
                            </Grid>
                            <Grid item xs={12}>
                                <Typography variant="caption" color="text.secondary">Teléfono</Typography>
                                <Typography variant="body2">{selectedPerson?.phone || "N/A"}</Typography>
                            </Grid>
                        </Grid>

                        <Divider sx={{ my: 2 }} />

                        <Typography variant="subtitle1" fontWeight="bold" gutterBottom>INFORMACIÓN DEL PAQUETE</Typography>
                        <Grid container spacing={2} sx={{ mb: 3 }}>
                            <Grid item xs={12}>
                                <Typography variant="caption" color="text.secondary">Paquete</Typography>
                                <Typography variant="body2">{selectedPackage?.name || "N/A"}</Typography>
                            </Grid>
                            <Grid item xs={12}>
                                <Typography variant="caption" color="text.secondary">Destino</Typography>
                                <Typography variant="body2">{selectedPackage?.destination || "N/A"}</Typography>
                            </Grid>
                            <Grid item xs={6}>
                                <Typography variant="caption" color="text.secondary">Fecha Ida</Typography>
                                <Typography variant="body2">{selectedPackage?.startDate || "N/A"}</Typography>
                            </Grid>
                            <Grid item xs={6}>
                                <Typography variant="caption" color="text.secondary">Fecha Vuelta</Typography>
                                <Typography variant="body2">{selectedPackage?.endDate || "N/A"}</Typography>
                            </Grid>
                        </Grid>

                        <Divider sx={{ my: 2 }} />

                        {passengers.length > 0 && (
                            <>
                                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>LISTA DE PASAJEROS</Typography>
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

                        <Typography variant="subtitle1" fontWeight="bold" gutterBottom>DETALLE DE PAGO</Typography>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="body2">Subtotal:</Typography>
                            <Typography variant="body2">${(formData.subtotal || 0).toLocaleString()}</Typography>
                        </Box>

                        {discountDetails.length > 0 && (
                            <>
                                {discountDetails.map((discount, idx) => (
                                    <Box key={idx} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, ml: 2 }}>
                                        <Typography variant="body2" color="success.main">{discount.name}</Typography>
                                        <Typography variant="body2" color="success.main">-${Math.abs(discount.amount).toLocaleString()}</Typography>
                                    </Box>
                                ))}
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1, mb: 2, ml: 2 }}>
                                    <Typography variant="body2" fontWeight="bold">Total descuentos:</Typography>
                                    <Typography variant="body2" color="success.main" fontWeight="bold">-${(formData.discountAmount || 0).toLocaleString()}</Typography>
                                </Box>
                            </>
                        )}

                        <Divider sx={{ my: 2 }} />

                        {paymentInfo && (
                            <Box sx={{ mb: 3 }}>
                                <Typography variant="subtitle2" gutterBottom>Información de la transacción:</Typography>
                                <Grid container spacing={1}>
                                    <Grid item xs={12}>
                                        <Typography variant="caption" color="text.secondary">ID Transacción</Typography>
                                        <Typography variant="body2">{paymentInfo.transactionId || "N/A"}</Typography>
                                    </Grid>
                                    <Grid item xs={6}>
                                        <Typography variant="caption" color="text.secondary">Método de pago</Typography>
                                        <Typography variant="body2">
                                            {paymentInfo.paymentMethod === 'CREDIT_CARD' ? 'Tarjeta de Crédito' :
                                                paymentInfo.paymentMethod === 'DEBIT_CARD' ? 'Tarjeta de Débito' : paymentInfo.paymentMethod || "N/A"}
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

                        <Box sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            p: 2,
                            bgcolor: '#e3f2fd',
                            borderRadius: 2
                        }}>
                            <Typography variant="h6" fontWeight="bold">TOTAL PAGADO</Typography>
                            <Typography variant="h5" color="primary" fontWeight="bold">
                                ${(formData.totalAmount || 0).toLocaleString()}
                            </Typography>
                        </Box>

                        <Box sx={{ textAlign: 'center', mt: 3, pt: 2, borderTop: '1px dashed #ccc' }}>
                            <Typography variant="caption" color="text.secondary">
                                Este documento es un comprobante de reserva. Para cualquier consulta, contacte a nuestro servicio al cliente.
                            </Typography>
                        </Box>
                    </DialogContent>
                    <DialogActions sx={{ p: 2, justifyContent: 'center', className: 'no-print' }}>
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
            </Container>
        </Box>
    );
};

export default ReservationAddEdit;