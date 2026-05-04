import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    Box, Paper, Typography, TextField, Button, Grid,
    Divider, CircularProgress, Stack, Chip, InputAdornment,
    Card, CardContent, Alert, IconButton, Tooltip
} from "@mui/material";
import {
    Save as SaveIcon,
    Cancel as CancelIcon,
    Delete as DeleteIcon,
    Person as PersonIcon,
    Badge as BadgeIcon,
    Email as EmailIcon,
    Phone as PhoneIcon,
    Public as PublicIcon,
    Visibility as ViewIcon,
    VisibilityOff as ViewOffIcon,
    Edit as EditIcon,
    PersonOff as PersonOffIcon
} from "@mui/icons-material";
import Swal from 'sweetalert2';
import personService from "../services/person.service";

const PersonAddEdit = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEditMode = !!id && id !== 'new';
    const isViewMode = window.location.pathname.includes('/view/');

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState({});

    const [formData, setFormData] = useState({
        fullName: "",
        identification: "",
        email: "",
        phone: "",
        nationality: "",
        active: 1,
        createdByUserId: 1,
        updatedByUserId: 1
    });

    // Cargar datos en modo edición
    useEffect(() => {
        if (isEditMode || isViewMode) {
            fetchPersonData();
        }
    }, [id]);

    const fetchPersonData = async () => {
        setLoading(true);
        try {
            const response = await personService.get(id);
            const personData = response.data?.data || response.data;

            if (personData) {
                console.log("Datos de persona obtenidos:", personData);
                setFormData({
                    fullName: personData.fullName || "",
                    identification: personData.identification || "",
                    email: personData.email || "",
                    phone: personData.phone || "",
                    nationality: personData.nationality || "",
                    active: personData.active === 1 || personData.active === true ? 1 : 0,
                    failedAttempts: personData.failedAttempts || 3,
                    createdByUserId: personData.createdByUserId || 1,
                    updatedByUserId: personData.updatedByUserId || 1
                });
            }
        } catch (error) {
            console.error("Error al cargar la persona", error);
            Swal.fire('Error', 'No se pudo cargar la información de la persona', 'error');
            navigate('/admin/persons');
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

        if (!formData.fullName.trim()) newErrors.fullName = "El nombre completo es requerido";
        if (!formData.identification.trim()) newErrors.identification = "La identificación es requerida";
        if (!formData.email.trim()) {
            newErrors.email = "El email es requerido";
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = "El email no es válido";
        }
        if (formData.phone && !/^[0-9+\-\s()]+$/.test(formData.phone)) {
            newErrors.phone = "El teléfono no es válido";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (isViewMode) {
            navigate('/admin/persons');
            return;
        }

        if (!validateForm()) {
            Swal.fire('Error de validación', 'Por favor revisa los campos marcados', 'error');
            return;
        }

        setSaving(true);
        try {
            const submitData = {
                ...formData,
                id: isEditMode ? Number(id) : undefined
            };

            if (isEditMode) {
                await personService.update(submitData);
                Swal.fire('¡Actualizado!', 'La persona ha sido actualizada correctamente', 'success');
            } else {
                await personService.create(submitData);
                Swal.fire('¡Creado!', 'La persona ha sido creada correctamente', 'success');
            }
            navigate('/admin/persons');
        } catch (error) {
            console.error("Error al guardar", error);

            let errorMessage = 'Hubo un problema al guardar la persona';
            if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            } else if (error.response?.data?.errors) {
                errorMessage = Object.values(error.response.data.errors).join(', ');
            }

            Swal.fire('Error', errorMessage, 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleToggleActive = async () => {
        const action = formData.active === 1 ? "desactivar" : "activar";
        const result = await Swal.fire({
            title: `¿${formData.active === 1 ? 'Desactivar' : 'Activar'} persona?`,
            text: `¿Estás seguro de que quieres ${action} a "${formData.fullName}"?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: formData.active === 1 ? '#d33' : 'var(--primary)',
            confirmButtonText: `Sí, ${action}`,
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            setSaving(true);
            try {
                const updatedData = { id: Number(id), ...formData, active: formData.active === 1 ? 0 : 1 };
                await personService.update(updatedData);
                setFormData(prev => ({ ...prev, active: prev.active === 1 ? 0 : 1 }));
                Swal.fire('¡Completado!', `Persona ${action}da correctamente`, 'success');
            } catch (error) {
                Swal.fire('Error', 'No se pudo cambiar el estado de la persona', 'error');
            } finally {
                setSaving(false);
            }
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3, bgcolor: '#f5f7fa', minHeight: '100vh' }}>
            <Paper elevation={0} sx={{ borderRadius: 3, maxWidth: 800, mx: 'auto', overflow: 'hidden' }}>
                {/* Header */}
                <Box sx={{
                    background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)',
                    color: 'white',
                    p: 4
                }}>
                    <Typography variant="overline" sx={{ opacity: 0.9, letterSpacing: 1.5 }}>
                        {isViewMode ? 'VER REGISTRO' : isEditMode ? 'EDITAR REGISTRO' : 'NUEVO REGISTRO'}
                    </Typography>
                    <Typography variant="h4" fontWeight="bold">
                        {isViewMode ? 'Detalles de Persona' : isEditMode ? 'Editar Persona' : 'Nueva Persona'}
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
                            {/* Nombre Completo */}
                            <Grid xs={12}>
                                <TextField
                                    fullWidth
                                    label="Nombre Completo"
                                    name="fullName"
                                    value={formData.fullName}
                                    onChange={handleChange}
                                    error={!!errors.fullName}
                                    helperText={errors.fullName}
                                    required
                                    disabled={isViewMode}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <PersonIcon color="action" />
                                            </InputAdornment>
                                        )
                                    }}
                                />
                            </Grid>

                            {/* Identificación */}
                            <Grid xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    label="Identificación"
                                    name="identification"
                                    value={formData.identification}
                                    onChange={handleChange}
                                    error={!!errors.identification}
                                    helperText={errors.identification}
                                    required
                                    disabled={isViewMode}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <BadgeIcon color="action" />
                                            </InputAdornment>
                                        )
                                    }}
                                />
                            </Grid>

                            {/* Email */}
                            <Grid xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    label="Email"
                                    name="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    error={!!errors.email}
                                    helperText={errors.email}
                                    required
                                    disabled={isViewMode}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <EmailIcon color="action" />
                                            </InputAdornment>
                                        )
                                    }}
                                />
                            </Grid>

                            {/* Teléfono */}
                            <Grid xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    label="Teléfono"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    error={!!errors.phone}
                                    helperText={errors.phone}
                                    disabled={isViewMode}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <PhoneIcon color="action" />
                                            </InputAdornment>
                                        )
                                    }}
                                />
                            </Grid>

                            {/* Nacionalidad */}
                            <Grid xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    label="Nacionalidad"
                                    name="nationality"
                                    value={formData.nationality}
                                    onChange={handleChange}
                                    disabled={isViewMode}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <PublicIcon color="action" />
                                            </InputAdornment>
                                        )
                                    }}
                                />
                            </Grid>

                            {/* Estado (solo visible en edición/visualización) */}
                            {(isEditMode || isViewMode) && (
                                <Grid xs={12}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                        <Typography variant="subtitle2" color="text.secondary">
                                            Estado actual:
                                        </Typography>
                                        {console.log(formData.active)}
                                        <Chip

                                            label={formData.active === 1 ? "ACTIVO" : "INACTIVO"}
                                            sx={{
                                                bgcolor: formData.active === 1 ? '#e8f5e9' : '#ffebee',
                                                color: formData.active === 1 ? '#2e7d32' : '#c62828',
                                                fontWeight: 'bold'
                                            }}
                                        />
                                        {!isViewMode && (
                                            <Button
                                                size="small"
                                                variant="outlined"
                                                color={formData.active === 1 ? "error" : "success"}
                                                onClick={handleToggleActive}
                                                startIcon={formData.active === 1 ? <PersonOffIcon /> : <PersonIcon />}
                                            >
                                                {formData.active === 1 ? 'Desactivar' : 'Activar'}
                                            </Button>
                                        )}
                                    </Box>
                                </Grid>
                            )}
                        </Grid>

                        <Divider sx={{ my: 4 }} />

                        {/* Botones de acción */}
                        <Stack direction="row" spacing={2} justifyContent="flex-end">
                            <Button
                                variant="outlined"
                                onClick={() => navigate('/admin/persons')}
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

export default PersonAddEdit;