import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    Box, Paper, Typography, TextField, Button, Grid,
    Divider, CircularProgress, Stack, InputAdornment
} from "@mui/material";
import {
    Save as SaveIcon,
    Person as PersonIcon,
    Badge as BadgeIcon,
    Email as EmailIcon,
    Phone as PhoneIcon,
    Public as PublicIcon,
    ArrowBack as ArrowBackIcon
} from "@mui/icons-material";
import Swal from 'sweetalert2';
import { useKeycloak } from '@react-keycloak/web';
import personService from "../services/person.service";

const MyProfile = () => {
    const { keycloak } = useKeycloak();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState({});
    const [personId, setPersonId] = useState(null);

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

    useEffect(() => {
        if (keycloak && keycloak.subject) {
            const savedId = localStorage.getItem(`person_id_${keycloak.subject}`);
            if (savedId) {
                setPersonId(savedId);
                fetchPersonData(savedId);
            } else {
                // Si aún no está sincronizado, esperar un momento
                const checkInterval = setInterval(() => {
                    const id = localStorage.getItem(`person_id_${keycloak.subject}`);
                    if (id) {
                        setPersonId(id);
                        fetchPersonData(id);
                        clearInterval(checkInterval);
                    }
                }, 1000);
                return () => clearInterval(checkInterval);
            }
        }
    }, [keycloak]);

    const fetchPersonData = async (id) => {
        setLoading(true);
        try {
            const response = await personService.get(id);
            const personData = response.data?.data || response.data;

            if (personData) {
                setFormData({
                    fullName: personData.fullName || "",
                    identification: personData.identification || "",
                    email: personData.email || "",
                    phone: personData.phone || "",
                    nationality: personData.nationality || "",
                    active: personData.active === 1 || personData.active === true ? 1 : 0,
                    failedAttempts: personData.failedAttempts || 0,
                    createdByUserId: personData.createdByUserId || 1,
                    updatedByUserId: personData.updatedByUserId || 1
                });
            }
        } catch (error) {
            console.error("Error al cargar el perfil", error);
            Swal.fire('Error', 'No se pudo cargar tu perfil', 'error');
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

        if (!validateForm()) {
            Swal.fire('Error de validación', 'Por favor revisa los campos marcados', 'error');
            return;
        }

        setSaving(true);
        try {
            const submitData = {
                ...formData,
                id: Number(personId)
            };

            await personService.update(submitData);
            Swal.fire('¡Actualizado!', 'Tu perfil ha sido actualizado correctamente', 'success');
        } catch (error) {
            console.error("Error al guardar perfil", error);
            let errorMessage = 'Hubo un problema al actualizar tu perfil';
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

    if (loading || !personId) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3 }}>
            <Paper elevation={0} sx={{ borderRadius: 3, maxWidth: 800, mx: 'auto', overflow: 'hidden' }}>
                {/* Header */}
                <Box sx={{
                    background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)',
                    p: 4
                }}>
                    <Typography variant="overline" sx={{ opacity: 0.9, letterSpacing: 1.5 }}>
                        MI CUENTA
                    </Typography>
                    <Typography variant="h4" fontWeight="bold">
                        Perfil de Usuario
                    </Typography>
                </Box>

                <form onSubmit={handleSubmit}>
                    <Box sx={{ p: 4 }}>
                        <Grid container spacing={3}>
                            {/* Nombre Completo */}
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Nombre Completo"
                                    name="fullName"
                                    value={formData.fullName}
                                    onChange={handleChange}
                                    error={!!errors.fullName}
                                    helperText={errors.fullName}
                                    required
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
                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    label="Identificación"
                                    name="identification"
                                    value={formData.identification}
                                    onChange={handleChange}
                                    error={!!errors.identification}
                                    helperText={errors.identification}
                                    required
                                    disabled
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
                            <Grid item xs={12} md={6}>
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
                                    disabled
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
                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    label="Teléfono"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    error={!!errors.phone}
                                    helperText={errors.phone}
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
                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    label="País / Nacionalidad"
                                    name="nationality"
                                    value={formData.nationality}
                                    onChange={handleChange}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <PublicIcon color="action" />
                                            </InputAdornment>
                                        )
                                    }}
                                />
                            </Grid>
                        </Grid>

                        <Divider sx={{ my: 4 }} />

                        {/* Botones de acción */}
                        <Stack direction="row" spacing={2} justifyContent="flex-start">
                            <Button
                                variant="contained"
                                startIcon={<ArrowBackIcon />}
                                onClick={() => navigate('/')}
                                sx={{
                                    bgcolor: 'var(--info)',
                                    '&:hover': { bgcolor: 'var(--info-hover)' },
                                }}
                                size="large"
                            >
                                Volver
                            </Button>
                            <Button
                                type="submit"
                                variant="contained"
                                disabled={saving}
                                startIcon={saving ? <CircularProgress size={24} color="inherit" /> : <SaveIcon />}
                                sx={{
                                    bgcolor: 'var(--primary)',
                                    '&:hover': { bgcolor: 'var(--primary-hover)' },
                                    minWidth: 140,
                                    py: 1.2
                                }}
                                size="large"
                            >
                                {saving ? 'Guardando...' : 'Guardar Cambios'}
                            </Button>
                        </Stack>
                    </Box>
                </form>
            </Paper>
        </Box>
    );
};

export default MyProfile;
