import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    Box, Paper, Typography, TextField, Button, Grid,
    Divider, CircularProgress, Stack, Chip, InputAdornment,
    FormControl, InputLabel, Select, MenuItem, Alert
} from "@mui/material";
import {
    Save as SaveIcon,
    Cancel as CancelIcon,
    Person as PersonIcon,
    CardTravel as PackageIcon,
    Schedule as ScheduleIcon,
    AttachMoney as MoneyIcon
} from "@mui/icons-material";
import Swal from 'sweetalert2';
import reservationService from "../services/reservation.service";
import personService from "../services/person.service";
import tourPackageService from "../services/tourPackage.service";
import dayjs from 'dayjs';

const ReservationForm = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEditMode = !!id && id !== 'new';
    const isViewMode = window.location.pathname.includes('/view/');

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState({});
    const [persons, setPersons] = useState([]);
    const [packages, setPackages] = useState([]);
    const [loadingData, setLoadingData] = useState(true);

    const [formData, setFormData] = useState({
        personId: "",
        tourPackageId: "",
        status: "PENDIENTE",
        active: 1,
        createdByUserId: 1,
        modifiedByUserId: 1
    });

    useEffect(() => {
        loadSelectData();
        if (isEditMode || isViewMode) {
            fetchReservationData();
        }
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
                    createdByUserId: reservationData.createdByUserId || 1,
                    modifiedByUserId: reservationData.modifiedByUserId || 1
                });
            }
        } catch (error) {
            console.error("Error al cargar la reserva", error);
            Swal.fire('Error', 'No se pudo cargar la información de la reserva', 'error');
            navigate('/admin/reservations');
        } finally {
            setLoading(false);
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

    // Función para obtener el objeto completo de la persona
    const getFullPerson = (personId) => {
        const person = persons.find(p => p.id === Number(personId));
        if (!person) return null;
        
        // Devolver el objeto completo que el backend espera
        return {
            id: person.id,
            fullName: person.fullName || "",
            identification: person.identification || "",
            email: person.email || "",
            phone: person.phone || "",
            nationality: person.nationality || "",
            failedAttempts: person.failedAttempts || 3,
            active: person.active || 1,
            createdByUserId: person.createdByUserId || 1,
            updatedByUserId: person.updatedByUserId || 1,
            createdAt: person.createdAt || new Date().toISOString(),
            updatedAt: person.updatedAt || new Date().toISOString()
        };
    };

    // Función para obtener el objeto completo del paquete
    const getFullPackage = (packageId) => {
        const pkg = packages.find(p => p.id === Number(packageId));
        if (!pkg) return null;
        
        // Devolver el objeto completo que el backend espera
        return {
            id: pkg.id,
            name: pkg.name || "",
            destination: pkg.destination || "",
            season: pkg.season || null,
            category: pkg.category || null,
            travelType: pkg.travelType || null,
            description: pkg.description || "",
            startDate: pkg.startDate || "",
            endDate: pkg.endDate || "",
            price: pkg.price || 0,
            totalSlots: pkg.totalSlots || 0,
            status: pkg.status || "DISPONIBLE",
            stars: pkg.stars || 0,
            imageUrl: pkg.imageUrl || "",
            active: pkg.active || 1,
            createdByUserId: pkg.createdByUserId || 1,
            modifiedByUserId: pkg.modifiedByUserId || 1,
            createdAt: pkg.createdAt || new Date().toISOString(),
            updatedAt: pkg.updatedAt || new Date().toISOString(),
            conditions: pkg.conditions || [],
            restrictions: pkg.restrictions || [],
            services: pkg.services || []
        };
    };

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
            // Obtener los objetos completos
            const fullPerson = getFullPerson(formData.personId);
            const fullPackage = getFullPackage(formData.tourPackageId);
            
            if (!fullPerson || !fullPackage) {
                throw new Error('No se encontraron los datos completos de la persona o el paquete');
            }
            
            const now = new Date().toISOString();
            const reservationDate = now;
            const expirationDate = dayjs().add(3, 'day').toISOString();

            // Construir el objeto completo que el backend espera
            let submitData = {
                person: fullPerson,
                tourPackage: fullPackage,
                reservationDate: reservationDate,
                expirationDate: expirationDate,
                status: formData.status,
                active: 1,
                createdByUserId: 1,
                modifiedByUserId: 1,
                createdAt: now,
                updatedAt: now
            };

            if (isEditMode) {
                submitData = { 
                    ...submitData, 
                    id: Number(id)
                };
                await reservationService.update(submitData);
                Swal.fire('¡Actualizada!', 'La reserva ha sido actualizada correctamente', 'success');
            } else {
                await reservationService.create(submitData);
                Swal.fire('¡Creada!', 'La reserva ha sido creada correctamente', 'success');
            }
            navigate('/admin/reservations');
        } catch (error) {
            console.error("Error al guardar", error);
            Swal.fire('Error', error.response?.data?.message || error.message || 'Hubo un problema al guardar la reserva', 'error');
        } finally {
            setSaving(false);
        }
    };

    if (loading || loadingData) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3, bgcolor: '#f5f7fa', minHeight: '100vh' }}>
            <Paper elevation={0} sx={{ borderRadius: 3, maxWidth: 800, mx: 'auto', overflow: 'hidden' }}>
                <Box sx={{
                    background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)',
                    color: 'white',
                    p: 4
                }}>
                    <Typography variant="overline" sx={{ opacity: 0.9, letterSpacing: 1.5 }}>
                        {isViewMode ? 'VER REGISTRO' : isEditMode ? 'EDITAR REGISTRO' : 'NUEVA RESERVA'}
                    </Typography>
                    <Typography variant="h4" fontWeight="bold">
                        {isViewMode ? 'Detalles de Reserva' : isEditMode ? 'Editar Reserva' : 'Nueva Reserva'}
                    </Typography>
                    {isEditMode && (
                        <Typography variant="body2" sx={{ opacity: 0.8, mt: 0.5 }}>
                            ID: {id}
                        </Typography>
                    )}
                </Box>

                <form onSubmit={handleSubmit}>
                    <Box sx={{ p: 4 }}>
                        <Grid container spacing={3}>
                            <Grid item xs={12}>
                                <FormControl fullWidth error={!!errors.personId} required>
                                    <InputLabel>Cliente</InputLabel>
                                    <Select
                                        name="personId"
                                        value={formData.personId}
                                        onChange={handleChange}
                                        label="Cliente"
                                        disabled={isViewMode}
                                    >
                                        <MenuItem value=""><em>Seleccione un cliente</em></MenuItem>
                                        {persons.map(person => (
                                            <MenuItem key={person.id} value={person.id}>
                                                {person.fullName} - {person.identification}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                    {errors.personId && (
                                        <Typography variant="caption" color="error">{errors.personId}</Typography>
                                    )}
                                </FormControl>
                            </Grid>

                            <Grid item xs={12}>
                                <FormControl fullWidth error={!!errors.tourPackageId} required>
                                    <InputLabel>Paquete Turístico</InputLabel>
                                    <Select
                                        name="tourPackageId"
                                        value={formData.tourPackageId}
                                        onChange={handleChange}
                                        label="Paquete Turístico"
                                        disabled={isViewMode}
                                    >
                                        <MenuItem value=""><em>Seleccione un paquete</em></MenuItem>
                                        {packages.map(pkg => (
                                            <MenuItem key={pkg.id} value={pkg.id}>
                                                {pkg.name} - ${pkg.price}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                    {errors.tourPackageId && (
                                        <Typography variant="caption" color="error">{errors.tourPackageId}</Typography>
                                    )}
                                </FormControl>
                            </Grid>

                            {isEditMode && (
                                <Grid item xs={12}>
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
                                            <MenuItem value="CONFIRMADA">Confirmada</MenuItem>
                                            <MenuItem value="PAGADA">Pagada</MenuItem>
                                            <MenuItem value="CANCELADA">Cancelada</MenuItem>
                                            <MenuItem value="EXPIRADA">Expirada</MenuItem>
                                        </Select>
                                    </FormControl>
                                </Grid>
                            )}
                        </Grid>

                        <Divider sx={{ my: 4 }} />

                        <Stack direction="row" spacing={2} justifyContent="flex-end">
                            <Button
                                variant="outlined"
                                onClick={() => navigate('/admin/reservations')}
                                startIcon={<CancelIcon />}
                                size="large"
                            >
                                {isViewMode ? 'Volver' : 'Cancelar'}
                            </Button>

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
                                    {saving ? 'Guardando...' : (isEditMode ? 'Actualizar' : 'Crear')}
                                </Button>
                            )}
                        </Stack>
                    </Box>
                </form>
            </Paper>
        </Box>
    );
};

export default ReservationForm;