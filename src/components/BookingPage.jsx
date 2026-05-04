import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    Box, Container, Paper, Typography, TextField, Button, Grid,
    Stepper, Step, StepLabel, Card, CardContent, Divider,
    IconButton, Collapse, Alert, CircularProgress, Chip,
    InputAdornment, Dialog, DialogTitle, DialogContent,
    DialogActions, Stack
} from "@mui/material";
import {
    ArrowBack as ArrowBackIcon,
    PersonAdd as PersonIcon,
    AttachMoney as MoneyIcon,
    CheckCircle as CheckIcon,
    Discount as DiscountIcon,
    LocalOffer as OfferIcon,
    Group as GroupIcon,
    Star as StarIcon,
    ExpandMore as ExpandMoreIcon,
    ExpandLess as ExpandLessIcon,
    Search as SearchIcon,
    Verified as VerifiedIcon,
    Warning as WarningIcon,
    Add as AddIcon,
    Delete as DeleteIcon,
    Edit as EditIcon
} from "@mui/icons-material";
import Swal from 'sweetalert2';
import tourPackageService from "../services/tourPackage.service";
import reservationService from "../services/reservation.service";
import personService from "../services/person.service";
import dayjs from 'dayjs';
import { useKeycloak } from '@react-keycloak/web';

const steps = ['Datos del viaje', 'Información de pasajeros', 'Resumen y pago'];

const BookingPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { keycloak } = useKeycloak();
    const currentUserId = keycloak?.subject ? localStorage.getItem(`person_id_${keycloak.subject}`) : 1;
    const [activeStep, setActiveStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [checkingAvailability, setCheckingAvailability] = useState(false);
    const [packageData, setPackageData] = useState(null);
    const [expandedPassenger, setExpandedPassenger] = useState(0);
    const [searchingPassenger, setSearchingPassenger] = useState({});

    // Estado del formulario
    const [formData, setFormData] = useState({
        passengers: 1,
        specialRequests: "",
        passengersInfo: []
    });

    // Estado de precios y descuentos
    const [priceCalculation, setPriceCalculation] = useState({
        basePrice: 0,
        subtotal: 0,
        groupDiscount: 0,
        frequentDiscount: 0,
        promoDiscount: 0,
        total: 0,
        discountsDetail: []
    });

    const [availability, setAvailability] = useState({
        available: true,
        availableSlots: 0,
        message: ""
    });

    const [isFrequentClient, setIsFrequentClient] = useState(false);
    const [promoActive, setPromoActive] = useState(null);

    // Cargar datos del paquete
    useEffect(() => {
        loadPackageData();
        checkActivePromotions();
        // Inicializar con un pasajero vacío
        initializePassengers(1);
    }, [id]);

    useEffect(() => {
        if (packageData && formData.passengers > 0) {
            checkAvailability();
            calculatePrice();
        }
    }, [formData.passengers, packageData]);


    const loadPackageData = async () => {
        setLoading(true);
        try {
            const response = await tourPackageService.get(id);
            const data = response.data?.data || response.data;
            setPackageData(data);
            setPriceCalculation(prev => ({
                ...prev,
                basePrice: data.price || 0,
                subtotal: (data.price || 0) * formData.passengers
            }));
        } catch (error) {
            console.error("Error cargando paquete:", error);
            Swal.fire('Error', 'No se pudo cargar la información del paquete', 'error');
            navigate('/');
        } finally {
            setLoading(false);
        }
    };

    const initializePassengers = (count) => {
        const newPassengers = [];
        for (let i = 0; i < count; i++) {
            newPassengers.push({
                id: i,
                personId: null,
                identification: "",
                fullName: "",
                email: "",
                phone: "",
                nationality: "",
                isNew: false,
                isEditing: true,
                existsInDb: false
            });
        }
        setFormData(prev => ({
            ...prev,
            passengersInfo: newPassengers
        }));
    };

    const searchPersonByIdentification = async (index, identification) => {
        if (!identification || identification.trim().length < 3) {
            return;
        }

        setSearchingPassenger(prev => ({ ...prev, [index]: true }));

        try {
            const response = await personService.searchPerson(identification.trim());
            const person = response.data?.data || response.data;

            if (person) {
                // Persona encontrada, actualizar datos
                setFormData(prev => ({
                    ...prev,
                    passengersInfo: prev.passengersInfo.map((p, i) =>
                        i === index ? {
                            ...p,
                            personId: person.id,
                            identification: person.identification,
                            fullName: person.fullName,
                            email: person.email,
                            phone: person.phone || "",
                            nationality: person.nationality || "",
                            existsInDb: true,
                            isEditing: false
                        } : p
                    )
                }));

                Swal.fire({
                    title: '¡Pasajero encontrado!',
                    text: `${person.fullName} ha sido cargado automáticamente.`,
                    icon: 'success',
                    timer: 1500,
                    showConfirmButton: false
                });
            }
        } catch (error) {
            console.error("Error buscando persona:", error);
            // No mostrar error, solo dejar que el usuario ingrese los datos manualmente
        } finally {
            setSearchingPassenger(prev => ({ ...prev, [index]: false }));
        }
    };

    const handlePassengerFieldChange = (index, field, value) => {
        setFormData(prev => ({
            ...prev,
            passengersInfo: prev.passengersInfo.map((p, i) =>
                i === index ? { ...p, [field]: value } : p
            )
        }));
    };

    const handleEditPassenger = (index) => {
        setFormData(prev => ({
            ...prev,
            passengersInfo: prev.passengersInfo.map((p, i) =>
                i === index ? { ...p, isEditing: true } : p
            )
        }));
    };

    const handleSavePassenger = async (index) => {
        const passenger = formData.passengersInfo[index];

        // Validar datos requeridos
        if (!passenger.fullName.trim()) {
            Swal.fire('Error', `Ingrese el nombre del pasajero ${index + 1}`, 'error');
            return;
        }
        if (!passenger.identification.trim()) {
            Swal.fire('Error', `Ingrese la identificación del pasajero ${index + 1}`, 'error');
            return;
        }
        if (!passenger.email.trim() || !/\S+@\S+\.\S+/.test(passenger.email)) {
            Swal.fire('Error', `Ingrese un email válido para el pasajero ${index + 1}`, 'error');
            return;
        }

        if (!passenger.existsInDb && !passenger.personId) {
            // Es un pasajero nuevo, preguntar si desea registrarlo
            const result = await Swal.fire({
                title: 'Registrar nuevo pasajero',
                text: `¿Deseas registrar a "${passenger.fullName}" en el sistema para futuras reservas?`,
                icon: 'question',
                showCancelButton: true,
                confirmButtonText: 'Sí, registrar',
                cancelButtonText: 'Solo esta vez'
            });

            if (result.isConfirmed) {
                setLoading(true);
                try {
                    const newPerson = {
                        fullName: passenger.fullName,
                        identification: passenger.identification,
                        email: passenger.email,
                        phone: passenger.phone || "",
                        nationality: passenger.nationality || "",
                        active: 1,
                        createdByUserId: currentUserId || 1,
                        updatedByUserId: currentUserId || 1
                    };

                    const response = await personService.create(newPerson);
                    const createdPerson = response.data?.data || response.data;

                    if (createdPerson) {
                        setFormData(prev => ({
                            ...prev,
                            passengersInfo: prev.passengersInfo.map((p, i) =>
                                i === index ? {
                                    ...p,
                                    personId: createdPerson.id,
                                    existsInDb: true,
                                    isEditing: false
                                } : p
                            )
                        }));

                        Swal.fire('¡Registrado!', 'El pasajero ha sido registrado exitosamente', 'success');
                    }
                } catch (error) {
                    console.error("Error registrando pasajero:", error);
                    Swal.fire('Error', 'No se pudo registrar el pasajero', 'error');
                } finally {
                    setLoading(false);
                }
            } else {
                // Guardar solo para esta reserva
                setFormData(prev => ({
                    ...prev,
                    passengersInfo: prev.passengersInfo.map((p, i) =>
                        i === index ? { ...p, isEditing: false, existsInDb: false } : p
                    )
                }));
            }
        } else {
            // Pasajero existente, solo cerrar edición
            setFormData(prev => ({
                ...prev,
                passengersInfo: prev.passengersInfo.map((p, i) =>
                    i === index ? { ...p, isEditing: false } : p
                )
            }));
        }
    };

    const handleAddPassenger = () => {
        const newPassenger = {
            id: formData.passengersInfo.length,
            personId: null,
            identification: "",
            fullName: "",
            email: "",
            phone: "",
            nationality: "",
            isNew: true,
            isEditing: true,
            existsInDb: false
        };

        setFormData(prev => ({
            ...prev,
            passengers: prev.passengers + 1,
            passengersInfo: [...prev.passengersInfo, newPassenger]
        }));
        setExpandedPassenger(formData.passengersInfo.length);
    };

    const handleRemovePassenger = async (index) => {
        if (formData.passengersInfo.length <= 1) {
            Swal.fire('Error', 'Debe haber al menos un pasajero', 'error');
            return;
        }

        const result = await Swal.fire({
            title: 'Eliminar pasajero',
            text: `¿Deseas eliminar a ${formData.passengersInfo[index].fullName || 'este pasajero'}?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            setFormData(prev => ({
                ...prev,
                passengers: prev.passengers - 1,
                passengersInfo: prev.passengersInfo.filter((_, i) => i !== index)
            }));
            setExpandedPassenger(0);
        }
    };

    const checkActivePromotions = async () => {
        const now = dayjs();
        const promotions = [
            { id: 1, name: "Descuento Verano", discount: 10, startDate: dayjs().subtract(5, 'day'), endDate: dayjs().add(10, 'day'), active: true }
        ];

        const activePromo = promotions.find(p =>
            p.active && now.isAfter(p.startDate) && now.isBefore(p.endDate)
        );
        setPromoActive(activePromo);
    };

    const checkAvailability = async () => {
        if (!packageData?.id) return;

        setCheckingAvailability(true);
        try {
            // 🔥 Usar el endpoint correcto
            const response = await tourPackageService.checkAvailabilityForQuantity(
                packageData.id,
                formData.passengers
            );

            // Dependiendo de cómo retorne tu backend
            const data = response.data;

            console.log("Disponibilidad desde backend:", data); // Debug

            setAvailability({
                available: data.isAvailable,
                availableSlots: data.availableSlots,
                totalSlots: data.totalSlots,
                message: data.isAvailable
                    ? `✅ ${data.availableSlots} cupos disponibles de ${data.totalSlots}`
                    : `❌ ${data.message}`
            });
        } catch (error) {
            console.error("Error verificando disponibilidad:", error);
            setAvailability({
                available: false,
                availableSlots: 0,
                totalSlots: packageData?.totalSlots || 0,
                message: "⚠️ Error al verificar disponibilidad"
            });
        } finally {
            setCheckingAvailability(false);
        }
    };

    const calculatePrice = async () => {
        const basePrice = packageData?.price || 0;
        const subtotal = basePrice * formData.passengers;
        let total = subtotal;
        const discountsDetail = [];

        // Descuento por grupo (≥ 4 personas)
        let groupDiscount = 0;
        if (formData.passengers >= 4) {
            groupDiscount = subtotal * 0.10;
            discountsDetail.push({
                name: "Descuento por grupo",
                description: `${formData.passengers} personas (10% off)`,
                amount: -groupDiscount,
                icon: <GroupIcon sx={{ fontSize: 20 }} />
            });
            total -= groupDiscount;
        }

        // Descuento por promoción activa
        let promoDiscount = 0;
        if (promoActive) {
            promoDiscount = subtotal * (promoActive.discount / 100);
            discountsDetail.push({
                name: promoActive.name,
                description: `${promoActive.discount}% de descuento por tiempo limitado`,
                amount: -promoDiscount,
                icon: <OfferIcon sx={{ fontSize: 20 }} />
            });
            total -= promoDiscount;
        }

        setPriceCalculation({
            basePrice,
            subtotal,
            groupDiscount,
            frequentDiscount: 0,
            promoDiscount,
            total: Math.max(0, total),
            discountsDetail
        });
    };

    const validatePassengers = () => {
        for (let i = 0; i < formData.passengersInfo.length; i++) {
            const passenger = formData.passengersInfo[i];
            if (!passenger.fullName?.trim()) {
                Swal.fire('Error', `Ingrese el nombre del pasajero ${i + 1}`, 'error');
                setExpandedPassenger(i);
                return false;
            }
            if (!passenger.identification?.trim()) {
                Swal.fire('Error', `Ingrese la identificación del pasajero ${i + 1}`, 'error');
                setExpandedPassenger(i);
                return false;
            }
            if (!passenger.email?.trim() || !/\S+@\S+\.\S+/.test(passenger.email)) {
                Swal.fire('Error', `Ingrese un email válido para el pasajero ${i + 1}`, 'error');
                setExpandedPassenger(i);
                return false;
            }
            if (passenger.isEditing) {
                Swal.fire('Error', `Complete o guarde los datos del pasajero ${i + 1}`, 'error');
                setExpandedPassenger(i);
                return false;
            }
        }
        return true;
    };

    const handleNext = async () => {
        if (activeStep === 0) {
            // Verificar disponibilidad nuevamente antes de continuar
            setCheckingAvailability(true);
            try {
                const response = await tourPackageService.checkAvailabilityForQuantity(
                    packageData.id,
                    formData.passengers
                );
                const data = response.data?.data || response.data;

                if (!data.isAvailable) {
                    Swal.fire({
                        title: 'Sin disponibilidad',
                        html: `No hay suficientes cupos disponibles.<br/>
                            <strong>Cupos disponibles:</strong> ${data.availableSlots}<br/>
                            <strong>Solicitados:</strong> ${formData.passengers}`,
                        icon: 'error'
                    });
                    setCheckingAvailability(false);
                    return;
                }
            } catch (error) {
                console.error("Error verificando disponibilidad:", error);
                Swal.fire('Error', 'No se pudo verificar disponibilidad', 'error');
                setCheckingAvailability(false);
                return;
            }
            setCheckingAvailability(false);
        }

        if (activeStep === 1) {
            if (!validatePassengers()) {
                return;
            }
        }

        setActiveStep((prev) => prev + 1);
    };

    const handleBack = () => {
        setActiveStep((prev) => prev - 1);
    };

    const handleConfirmBooking = async () => {
        // Validar que el pasajero principal esté completo
        const mainPassenger = formData.passengersInfo[0];
        if (!mainPassenger.identification || !mainPassenger.fullName || !mainPassenger.email) {
            Swal.fire('Error', 'Complete los datos del pasajero principal', 'error');
            setActiveStep(1);
            setExpandedPassenger(0);
            return;
        }

        // Verificar disponibilidad final antes de confirmar
        setLoading(true);
        try {
            const availabilityCheck = await tourPackageService.checkAvailabilityForQuantity(
                packageData.id,
                formData.passengers
            );
            const availabilityData = availabilityCheck.data?.data || availabilityCheck.data;

            if (!availabilityData.isAvailable) {
                Swal.fire({
                    title: 'Sin disponibilidad',
                    html: `Lo sentimos, los cupos se agotaron mientras realizabas la reserva.<br/>
                       <strong>Cupos disponibles ahora:</strong> ${availabilityData.availableSlots}<br/>
                       <strong>Solicitados:</strong> ${formData.passengers}`,
                    icon: 'error'
                });
                setLoading(false);
                // Actualizar disponibilidad mostrada
                await checkAvailability();
                return;
            }
        } catch (error) {
            console.error("Error verificando disponibilidad final:", error);
            Swal.fire('Error', 'No se pudo verificar disponibilidad', 'error');
            setLoading(false);
            return;
        }

        const result = await Swal.fire({
            title: 'Confirmar reserva',
            html: `
                <div style="text-align: left">
                    <p><strong>Paquete:</strong> ${packageData?.name}</p>
                    <p><strong>Pasajeros:</strong> ${formData.passengers}</p>
                    <p><strong>Precio original:</strong> $${priceCalculation.subtotal.toLocaleString()}</p>
                    ${priceCalculation.discountsDetail.length > 0 ? `
                        <p><strong>Descuentos aplicados:</strong></p>
                        <ul>
                            ${priceCalculation.discountsDetail.map(d => `<li>${d.name}: -$${Math.abs(d.amount).toLocaleString()}</li>`).join('')}
                        </ul>
                    ` : ''}
                    <p><strong>Total con descuentos:</strong> <strong style="color: #2e7d32;">$${priceCalculation.total.toLocaleString()}</strong></p>
                </div>
            `,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Sí, reservar',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#2e7d32'
        });

        if (result.isConfirmed) {
            setLoading(true);
            try {
                // Datos de la persona principal
                const mainPassengerData = formData.passengersInfo[0];

                // Preparar datos de pasajeros
                const passengersData = formData.passengersInfo.map(passenger => ({
                    personId: passenger.personId || null,
                    identification: passenger.identification,
                    fullName: passenger.fullName,
                    email: passenger.email,
                    phone: passenger.phone || "",
                    nationality: passenger.nationality || ""
                }));

                // Preparar datos de descuentos
                const discountsDetail = priceCalculation.discountsDetail.map(discount => ({
                    name: discount.name,
                    description: discount.description,
                    amount: Math.abs(discount.amount)
                }));

                const reservationData = {
                    // Datos de la persona principal
                    personId: currentUserId || mainPassengerData.personId || null,
                    identification: mainPassengerData.identification,
                    fullName: mainPassengerData.fullName,
                    email: mainPassengerData.email,
                    phone: mainPassengerData.phone || "",
                    nationality: mainPassengerData.nationality || "",
                    // Datos de la reserva
                    tourPackageId: Number(id),
                    passengers: formData.passengers,
                    specialRequests: formData.specialRequests || "",
                    subtotal: priceCalculation.subtotal,
                    totalAmount: priceCalculation.total,
                    discountAmount: priceCalculation.subtotal - priceCalculation.total,
                    discountsDetail: discountsDetail,
                    passengersData: passengersData
                };

                console.log("Enviando reserva con descuentos:", reservationData);

                const response = await reservationService.createReservation(reservationData);

                if (response.data?.success) {
                    await Swal.fire({
                        title: '¡Reserva confirmada!',
                        html: `
                            <p>Tu reserva ha sido creada exitosamente.</p>
                            <p>Número de reserva: <strong>#${response.data.reservationId}</strong></p>
                            <p><strong>Monto total:</strong> $${priceCalculation.total.toLocaleString()}</p>
                            ${priceCalculation.discountAmount > 0 ? `<p><strong>Descuento aplicado:</strong> $${(priceCalculation.subtotal - priceCalculation.total).toLocaleString()}</p>` : ''}
                            <p>Tienes hasta <strong>${dayjs().add(3, 'day').format('DD/MM/YYYY HH:mm')}</strong> para completar el pago.</p>
                        `,
                        icon: 'success',
                        confirmButtonText: 'Ver mis reservas'
                    });

                    navigate('/my-reservations');
                } else {
                    throw new Error(response.data?.message || 'Error al crear la reserva');
                }
            } catch (error) {
                console.error("Error creando reserva:", error);
                Swal.fire('Error', error.response?.data?.message || 'No se pudo completar la reserva', 'error');
            } finally {
                setLoading(false);
            }
        }
    };

    if (loading && !packageData) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ py: 4 }}>
            <Container maxWidth="lg">
                <Button
                    startIcon={<ArrowBackIcon />}
                    onClick={() => navigate(-1)}
                    sx={{ mb: 3 }}
                >
                    Volver al paquete
                </Button>

                <Paper sx={{ p: 3, mb: 3, borderRadius: 3 }}>
                    <Typography variant="h5" fontWeight="bold" gutterBottom>
                        {packageData?.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        {packageData?.destination} • {packageData?.category?.name} • {packageData?.travelType?.name}
                    </Typography>
                </Paper>

                <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
                    {steps.map((label) => (
                        <Step key={label}>
                            <StepLabel>{label}</StepLabel>
                        </Step>
                    ))}
                </Stepper>

                <Grid container spacing={3}>
                    <Grid xs={12} md={8}>
                        <Paper sx={{ p: 3, borderRadius: 3 }}>
                            {activeStep === 0 && (
                                <Box>
                                    <Typography variant="h6" gutterBottom>
                                        Datos del viaje
                                    </Typography>
                                    <Divider sx={{ mb: 3 }} />

                                    <Grid container spacing={3}>
                                        <Grid xs={12} sm={6}>
                                            <TextField
                                                fullWidth
                                                label="Número de pasajeros"
                                                type="number"
                                                value={formData.passengers}
                                                onChange={(e) => {
                                                    const newCount = Math.min(
                                                        Math.max(parseInt(e.target.value) || 1, 1),
                                                        availability.availableSlots || 100
                                                    );

                                                    // 🔥 IMPORTANTE: Actualizar la lista de pasajeros
                                                    const currentInfo = formData.passengersInfo;
                                                    let newPassengersInfo;

                                                    if (newCount > currentInfo.length) {
                                                        // AGREGAR pasajeros - mantener los existentes y agregar nuevos vacíos
                                                        newPassengersInfo = [...currentInfo];
                                                        for (let i = currentInfo.length; i < newCount; i++) {
                                                            newPassengersInfo.push({
                                                                id: i,
                                                                personId: null,
                                                                identification: "",
                                                                fullName: "",
                                                                email: "",
                                                                phone: "",
                                                                nationality: "",
                                                                isNew: true,
                                                                isEditing: true,
                                                                existsInDb: false
                                                            });
                                                        }
                                                    } else if (newCount < currentInfo.length) {
                                                        // ELIMINAR pasajeros sobrantes - SOLO si no están completados
                                                        const canReduce = currentInfo.slice(newCount).every(p =>
                                                            !p.fullName && !p.identification && !p.email
                                                        );

                                                        if (!canReduce) {
                                                            Swal.fire({
                                                                title: '¿Eliminar pasajeros?',
                                                                html: `Al reducir a ${newCount} pasajeros, se perderán los datos de:<br/>
                           ${currentInfo.slice(newCount).map((p, i) => `• ${p.fullName || `Pasajero ${newCount + i + 1}`}`).join('<br/>')}`,
                                                                icon: 'warning',
                                                                showCancelButton: true,
                                                                confirmButtonText: 'Sí, eliminar',
                                                                cancelButtonText: 'Cancelar'
                                                            }).then((result) => {
                                                                if (result.isConfirmed) {
                                                                    // Confirmar eliminación
                                                                    setFormData(prev => ({
                                                                        ...prev,
                                                                        passengers: newCount,
                                                                        passengersInfo: prev.passengersInfo.slice(0, newCount)
                                                                    }));
                                                                }
                                                            });
                                                            return;
                                                        }

                                                        newPassengersInfo = currentInfo.slice(0, newCount);
                                                    } else {
                                                        newPassengersInfo = currentInfo;
                                                    }

                                                    setFormData(prev => ({
                                                        ...prev,
                                                        passengers: newCount,
                                                        passengersInfo: newPassengersInfo
                                                    }));
                                                }}
                                                InputProps={{
                                                    inputProps: { min: 1, max: availability.availableSlots || 10 }
                                                }}
                                                helperText={availability.message}
                                                error={!availability.available}
                                                disabled={checkingAvailability}
                                            />
                                        </Grid>

                                        <Grid xs={12}>
                                            <TextField
                                                fullWidth
                                                label="Solicitudes especiales (opcional)"
                                                multiline
                                                rows={3}
                                                value={formData.specialRequests}
                                                onChange={(e) => setFormData(prev => ({ ...prev, specialRequests: e.target.value }))}
                                                placeholder="Ej: Alimentación especial, necesidades de accesibilidad, etc."
                                            />
                                        </Grid>
                                    </Grid>

                                    {formData.passengers >= 4 && (
                                        <Alert severity="info" sx={{ mt: 3 }}>
                                            <strong>🎉 Descuento por grupo aplicado!</strong> Al reservar para {formData.passengers} personas,
                                            recibes un 10% de descuento en el total.
                                        </Alert>
                                    )}

                                    {promoActive && (
                                        <Alert severity="warning" sx={{ mt: 2 }}>
                                            <strong>🎁 {promoActive.name}!</strong> {promoActive.discount}% de descuento por tiempo limitado.
                                        </Alert>
                                    )}
                                </Box>
                            )}

                            {activeStep === 1 && (
                                <Box>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                        <Typography variant="h6">
                                            Información de pasajeros
                                        </Typography>
                                        <Button
                                            startIcon={<AddIcon />}
                                            onClick={handleAddPassenger}
                                            size="small"
                                        >
                                            Agregar pasajero
                                        </Button>
                                    </Box>
                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                                        Ingresa la identificación (RUT/DNI/Pasaporte) para buscar automáticamente o completa los datos manualmente.
                                    </Typography>
                                    <Divider />

                                    {formData.passengersInfo.map((passenger, index) => (
                                        <Card key={index} sx={{ mt: 2, borderRadius: 2, position: 'relative' }}>
                                            <CardContent>
                                                <Box
                                                    sx={{
                                                        display: 'flex',
                                                        justifyContent: 'space-between',
                                                        alignItems: 'center',
                                                        cursor: 'pointer'
                                                    }}
                                                    onClick={() => setExpandedPassenger(expandedPassenger === index ? null : index)}
                                                >
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                        <PersonIcon color="primary" />
                                                        <Typography variant="subtitle1" fontWeight="500">
                                                            Pasajero {index + 1}
                                                            {passenger.existsInDb && (
                                                                <Chip
                                                                    label="Registrado"
                                                                    size="small"
                                                                    color="success"
                                                                    icon={<VerifiedIcon sx={{ fontSize: 16 }} />}
                                                                    sx={{ ml: 1 }}
                                                                />
                                                            )}
                                                            {!passenger.isEditing && !passenger.existsInDb && (
                                                                <Chip
                                                                    label="Solo esta reserva"
                                                                    size="small"
                                                                    color="info"
                                                                    sx={{ ml: 1 }}
                                                                />
                                                            )}
                                                        </Typography>
                                                        {passenger.fullName && (
                                                            <Chip
                                                                label={passenger.fullName}
                                                                size="small"
                                                                sx={{ ml: 1 }}
                                                            />
                                                        )}
                                                    </Box>
                                                    <Box>
                                                        {!passenger.isEditing && (
                                                            <IconButton size="small" onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleEditPassenger(index);
                                                            }}>
                                                                <EditIcon />
                                                            </IconButton>
                                                        )}
                                                        <IconButton size="small" color="error" onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleRemovePassenger(index);
                                                        }}>
                                                            <DeleteIcon />
                                                        </IconButton>
                                                        <IconButton>
                                                            {expandedPassenger === index ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                                                        </IconButton>
                                                    </Box>
                                                </Box>

                                                <Collapse in={expandedPassenger === index}>
                                                    <Box sx={{ mt: 2 }}>
                                                        {passenger.isEditing ? (
                                                            <Grid container spacing={2}>
                                                                <Grid xs={12}>
                                                                    <TextField
                                                                        fullWidth
                                                                        label="Número de identificación (RUT/DNI/Pasaporte)"
                                                                        value={passenger.identification}
                                                                        onChange={(e) => {
                                                                            const value = e.target.value;
                                                                            handlePassengerFieldChange(index, 'identification', value);
                                                                            // Debounced search
                                                                            const timeoutId = setTimeout(() => {
                                                                                if (value.trim().length >= 3) {
                                                                                    searchPersonByIdentification(index, value);
                                                                                }
                                                                            }, 500);
                                                                            return () => clearTimeout(timeoutId);
                                                                        }}
                                                                        InputProps={{
                                                                            startAdornment: (
                                                                                <InputAdornment position="start">
                                                                                    <SearchIcon color="action" />
                                                                                </InputAdornment>
                                                                            ),
                                                                            endAdornment: searchingPassenger[index] && (
                                                                                <InputAdornment position="end">
                                                                                    <CircularProgress size={20} />
                                                                                </InputAdornment>
                                                                            )
                                                                        }}
                                                                        helperText="Ingresa RUT/DNI para buscar automáticamente"
                                                                    />
                                                                </Grid>
                                                                <Grid xs={12}>
                                                                    <TextField
                                                                        fullWidth
                                                                        label="Nombre completo"
                                                                        value={passenger.fullName}
                                                                        onChange={(e) => handlePassengerFieldChange(index, 'fullName', e.target.value)}
                                                                        required
                                                                    />
                                                                </Grid>
                                                                <Grid xs={12} sm={6}>
                                                                    <TextField
                                                                        fullWidth
                                                                        label="Correo electrónico"
                                                                        type="email"
                                                                        value={passenger.email}
                                                                        onChange={(e) => handlePassengerFieldChange(index, 'email', e.target.value)}
                                                                        required
                                                                    />
                                                                </Grid>
                                                                <Grid xs={12} sm={6}>
                                                                    <TextField
                                                                        fullWidth
                                                                        label="Teléfono"
                                                                        value={passenger.phone}
                                                                        onChange={(e) => handlePassengerFieldChange(index, 'phone', e.target.value)}
                                                                    />
                                                                </Grid>
                                                                <Grid xs={12}>
                                                                    <TextField
                                                                        fullWidth
                                                                        label="Nacionalidad"
                                                                        value={passenger.nationality}
                                                                        onChange={(e) => handlePassengerFieldChange(index, 'nationality', e.target.value)}
                                                                    />
                                                                </Grid>
                                                                <Grid xs={12}>
                                                                    <Button
                                                                        variant="contained"
                                                                        onClick={() => handleSavePassenger(index)}
                                                                        startIcon={<CheckIcon />}
                                                                        fullWidth
                                                                    >
                                                                        Guardar datos
                                                                    </Button>
                                                                </Grid>
                                                            </Grid>
                                                        ) : (
                                                            <Box sx={{ p: 1 }}>
                                                                <Grid container spacing={2}>
                                                                    <Grid xs={12} sm={6}>
                                                                        <Typography variant="caption" color="text.secondary">Nombre completo</Typography>
                                                                        <Typography variant="body2">{passenger.fullName}</Typography>
                                                                    </Grid>
                                                                    <Grid xs={12} sm={6}>
                                                                        <Typography variant="caption" color="text.secondary">Identificación</Typography>
                                                                        <Typography variant="body2">{passenger.identification}</Typography>
                                                                    </Grid>
                                                                    <Grid xs={12} sm={6}>
                                                                        <Typography variant="caption" color="text.secondary">Email</Typography>
                                                                        <Typography variant="body2">{passenger.email}</Typography>
                                                                    </Grid>
                                                                    <Grid xs={12} sm={6}>
                                                                        <Typography variant="caption" color="text.secondary">Teléfono</Typography>
                                                                        <Typography variant="body2">{passenger.phone || 'No especificado'}</Typography>
                                                                    </Grid>
                                                                    <Grid xs={12}>
                                                                        <Typography variant="caption" color="text.secondary">Nacionalidad</Typography>
                                                                        <Typography variant="body2">{passenger.nationality || 'No especificada'}</Typography>
                                                                    </Grid>
                                                                </Grid>
                                                            </Box>
                                                        )}
                                                    </Box>
                                                </Collapse>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </Box>
                            )}

                            {activeStep === 2 && (
                                <Box>
                                    <Typography variant="h6" gutterBottom>
                                        Resumen de la reserva
                                    </Typography>
                                    <Divider sx={{ mb: 3 }} />

                                    <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                                        Detalles del viaje
                                    </Typography>
                                    <Grid container spacing={2} sx={{ mb: 3 }}>
                                        <Grid xs={6}>
                                            <Typography variant="body2" color="text.secondary">Paquete:</Typography>
                                            <Typography variant="body1">{packageData?.name}</Typography>
                                        </Grid>
                                        <Grid xs={6}>
                                            <Typography variant="body2" color="text.secondary">Destino:</Typography>
                                            <Typography variant="body1">{packageData?.destination}</Typography>
                                        </Grid>
                                        <Grid xs={6}>
                                            <Typography variant="body2" color="text.secondary">Fecha inicio:</Typography>
                                            <Typography variant="body1">{packageData?.startDate}</Typography>
                                        </Grid>
                                        <Grid xs={6}>
                                            <Typography variant="body2" color="text.secondary">Pasajeros:</Typography>
                                            <Typography variant="body1">{formData.passengers} personas</Typography>
                                        </Grid>
                                    </Grid>

                                    <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                                        Lista de pasajeros
                                    </Typography>
                                    {formData.passengersInfo.map((passenger, index) => (
                                        <Box key={index} sx={{ mb: 2, p: 2, bgcolor: '#f8fafc', borderRadius: 2 }}>
                                            <Typography variant="subtitle2" color="primary">
                                                Pasajero {index + 1}
                                            </Typography>
                                            <Typography variant="body2">
                                                <strong>Nombre:</strong> {passenger.fullName}<br />
                                                <strong>Identificación:</strong> {passenger.identification}<br />
                                                <strong>Email:</strong> {passenger.email}<br />
                                                <strong>Teléfono:</strong> {passenger.phone || 'No especificado'}<br />
                                                <strong>Nacionalidad:</strong> {passenger.nationality || 'No especificada'}
                                            </Typography>
                                            {passenger.existsInDb && (
                                                <Chip label="Registrado en sistema" size="small" color="success" sx={{ mt: 1 }} />
                                            )}
                                        </Box>
                                    ))}

                                    {formData.specialRequests && (
                                        <Box sx={{ mt: 2 }}>
                                            <Typography variant="subtitle2" gutterBottom>Solicitudes especiales:</Typography>
                                            <Typography variant="body2" color="text.secondary">{formData.specialRequests}</Typography>
                                        </Box>
                                    )}
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
                                        onClick={handleConfirmBooking}
                                        disabled={loading}
                                        startIcon={loading ? <CircularProgress size={20} /> : <CheckIcon />}
                                        sx={{ bgcolor: '#2e7d32', '&:hover': { bgcolor: '#1b5e20' } }}
                                    >
                                        Confirmar reserva
                                    </Button>
                                ) : (
                                    <Button
                                        variant="contained"
                                        onClick={handleNext}
                                        disabled={(activeStep === 0 && !availability.available)}
                                    >
                                        Continuar
                                    </Button>
                                )}
                            </Box>
                        </Paper>
                    </Grid>

                    <Grid xs={12} md={4}>
                        <Paper sx={{ p: 3, borderRadius: 3, position: 'sticky', top: 20 }}>
                            <Typography variant="h6" gutterBottom>
                                Resumen de precios
                            </Typography>
                            <Divider sx={{ mb: 2 }} />

                            <Box sx={{ mb: 2 }}>
                                <Typography variant="body2" color="text.secondary">
                                    Precio por persona
                                </Typography>
                                <Typography variant="h6">
                                    ${priceCalculation.basePrice.toLocaleString()}
                                </Typography>
                            </Box>

                            <Box sx={{ mb: 2 }}>
                                <Typography variant="body2" color="text.secondary">
                                    Subtotal ({formData.passengers} personas)
                                </Typography>
                                <Typography variant="h6">
                                    ${priceCalculation.subtotal.toLocaleString()}
                                </Typography>
                            </Box>

                            {priceCalculation.discountsDetail.length > 0 && (
                                <>
                                    <Divider sx={{ my: 2 }} />
                                    <Typography variant="subtitle2" gutterBottom>
                                        Descuentos aplicados
                                    </Typography>
                                    {priceCalculation.discountsDetail.map((discount, idx) => (
                                        <Box key={idx} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                {discount.icon}
                                                <Box>
                                                    <Typography variant="body2">{discount.name}</Typography>
                                                    <Typography variant="caption" color="text.secondary">
                                                        {discount.description}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                            <Typography variant="body2" color="success.main">
                                                ${Math.abs(discount.amount).toLocaleString()}
                                            </Typography>
                                        </Box>
                                    ))}
                                </>
                            )}

                            <Divider sx={{ my: 2 }} />

                            <Box sx={{ mb: 2 }}>
                                <Typography variant="subtitle1" fontWeight="bold">
                                    Total a pagar
                                </Typography>
                                <Typography variant="h4" color="primary" fontWeight="bold">
                                    ${priceCalculation.total.toLocaleString()}
                                </Typography>
                            </Box>

                            <Alert severity="info" sx={{ mt: 2 }}>
                                <Typography variant="caption">
                                    Tienes 3 días para completar el pago. Los cupos se reservan temporalmente.
                                </Typography>
                            </Alert>
                        </Paper>
                    </Grid>
                </Grid>
            </Container>
        </Box>
    );
};

export default BookingPage;