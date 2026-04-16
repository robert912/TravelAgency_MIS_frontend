// components/admin/PackageForm.jsx
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import tourPackageService from "../services/tourPackage.service";
import {
    Box, Paper, Typography, TextField, Button, Grid,
    FormControl, InputLabel, Select, MenuItem,
    Divider, CircularProgress, Stack, Chip,
    InputAdornment, Skeleton, Alert, IconButton, Tooltip
} from "@mui/material";
import {
    Save as SaveIcon,
    Cancel as CancelIcon,
    Delete as DeleteIcon,
    AttachMoney as MoneyIcon,
    People as PeopleIcon,
    Star as StarIcon,
    LocationOn as LocationIcon,
    Description as DescriptionIcon,
    Category as CategoryIcon,
    BeachAccess as SeasonIcon,
    Flight as TravelTypeIcon,
    Image as ImageIcon,
    CalendarToday as CalendarIcon,
    Info as InfoIcon
} from "@mui/icons-material";
import Swal from 'sweetalert2';
import seasonService from "../services/season.service";
import categoryService from "../services/category.service";
import travelTypeService from "../services/travelType.service";

// Secciones del formulario
const FormSection = ({ icon: Icon, title, children }) => (
    <Grid item xs={12}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, mt: 3 }}>
            <Icon sx={{ color: 'var(--primary)' }} />
            <Typography variant="h6" fontWeight="600">
                {title}
            </Typography>
        </Box>
        <Divider sx={{ mb: 3 }} />
        <Grid container spacing={3}>
            {children}
        </Grid>
    </Grid>
);

const TourPackageAddEdit = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEditMode = !!id;

    // Estados
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState({});
    const [seasons, setSeasons] = useState([]);
    const [categories, setCategories] = useState([]);
    const [travelTypes, setTravelTypes] = useState([]);
    const [loadingSelects, setLoadingSelects] = useState(true);

    const [formData, setFormData] = useState({
        name: "", destination: "", description: "", seasonId: "",
        categoryId: "", travelTypeId: "", price: "", startDate: "",
        endDate: "", totalSlots: "", status: "DISPONIBLE", stars: 0,
        active: true, imageUrl: "", included: "", notIncluded: "", itinerary: ""
    });

    // Cargar datos iniciales
    useEffect(() => {
        const fetchSelectData = async () => {
            setLoadingSelects(true);
            try {
                const [seasonsRes, categoriesRes, travelTypesRes] = await Promise.all([
                    seasonService.getAllActive(),
                    categoryService.getAllActive(),
                    travelTypeService.getAllActive()
                ]);

                setSeasons(seasonsRes.data?.data || seasonsRes.data || []);
                setCategories(categoriesRes.data?.data || categoriesRes.data || []);
                setTravelTypes(travelTypesRes.data?.data || travelTypesRes.data || []);
            } catch (error) {
                console.error("Error cargando listas", error);
                Swal.fire('Error', 'No se pudieron cargar las opciones del formulario', 'error');
            } finally {
                setLoadingSelects(false);
            }
        };

        fetchSelectData();
    }, []);

    // Cargar datos del paquete en modo edición
    useEffect(() => {
        if (isEditMode && id) fetchPackageData();
    }, [isEditMode, id]);

    const fetchPackageData = async () => {
        setLoading(true);
        try {
            const response = await tourPackageService.get(id);
            const packageData = response.data?.data || response.data;

            if (packageData) {
                setFormData({
                    name: packageData.name || "",
                    destination: packageData.destination || "",
                    description: packageData.description || "",
                    seasonId: packageData.season?.id || "",
                    categoryId: packageData.category?.id || "",
                    travelTypeId: packageData.travelType?.id || "",
                    price: packageData.price || "",
                    startDate: packageData.startDate?.split('T')[0] || "",
                    endDate: packageData.endDate?.split('T')[0] || "",
                    totalSlots: packageData.totalSlots || "",
                    status: packageData.status || "DISPONIBLE",
                    stars: packageData.stars || 0,
                    active: packageData.active === 1 || packageData.active === true,
                    imageUrl: packageData.imageUrl || "",
                    included: packageData.included || "",
                    notIncluded: packageData.notIncluded || "",
                    itinerary: packageData.itinerary || ""
                });
            }
        } catch (error) {
            console.error("Error al cargar el paquete", error);
            Swal.fire('Error', 'No se pudo cargar la información del paquete', 'error');
            navigate('/admin/packages');
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

        if (!formData.name.trim()) newErrors.name = "El nombre es requerido";
        if (!formData.destination.trim()) newErrors.destination = "El destino es requerido";
        if (!formData.description.trim()) newErrors.description = "La descripción es requerida";
        if (!formData.seasonId) newErrors.seasonId = "Seleccione una temporada";
        if (!formData.categoryId) newErrors.categoryId = "Seleccione una categoría";
        if (!formData.travelTypeId) newErrors.travelTypeId = "Seleccione un tipo de viaje";
        if (!formData.price || formData.price <= 0) newErrors.price = "El precio debe ser mayor a 0";
        if (!formData.startDate) newErrors.startDate = "La fecha de inicio es requerida";
        if (!formData.endDate) newErrors.endDate = "La fecha de fin es requerida";
        if (!formData.totalSlots || formData.totalSlots <= 0) newErrors.totalSlots = "Debe haber al menos 1 cupo";

        if (formData.startDate && formData.endDate && 
            new Date(formData.startDate) > new Date(formData.endDate)) {
            newErrors.endDate = "La fecha de fin debe ser posterior a la fecha de inicio";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const getFullItem = (list, id) => list.find(item => item.id === Number(id));

    const buildSubmitData = () => ({
        name: formData.name,
        destination: formData.destination,
        description: formData.description,
        price: Number(formData.price),
        startDate: formData.startDate,
        endDate: formData.endDate,
        totalSlots: Number(formData.totalSlots),
        status: formData.status,
        stars: Number(formData.stars),
        imageUrl: formData.imageUrl || null,
        active: formData.active ? 1 : 0,
        createdByUserId: 1,
        modifiedByUserId: 1,
        season: getFullItem(seasons, formData.seasonId),
        category: getFullItem(categories, formData.categoryId),
        travelType: getFullItem(travelTypes, formData.travelTypeId),
        included: formData.included || null,
        notIncluded: formData.notIncluded || null,
        itinerary: formData.itinerary || null,
        ...(isEditMode && { id: Number(id) })
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) {
            Swal.fire('Error de validación', 'Por favor revisa los campos marcados', 'error');
            return;
        }

        setSaving(true);
        try {
            const submitData = buildSubmitData();
            
            if (isEditMode) {
                await tourPackageService.update(submitData);
                Swal.fire('¡Actualizado!', 'El paquete ha sido actualizado correctamente', 'success');
            } else {
                await tourPackageService.create(submitData);
                Swal.fire('¡Creado!', 'El paquete ha sido creado correctamente', 'success');
            }
            navigate('/admin/packages');
        } catch (error) {
            console.error("Error al guardar", error);
            Swal.fire('Error', error.response?.data?.message || 'Hubo un problema al guardar el paquete', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleToggleActive = async () => {
        const action = formData.active ? "desactivar" : "activar";
        const result = await Swal.fire({
            title: `¿${formData.active ? 'Desactivar' : 'Activar'} paquete?`,
            text: `¿Estás seguro de que quieres ${action} "${formData.name}"?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: formData.active ? '#d33' : 'var(--primary)',
            confirmButtonText: `Sí, ${action}`,
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            setSaving(true);
            try {
                const updatedData = { ...buildSubmitData(), active: formData.active ? 0 : 1 };
                await tourPackageService.update(updatedData);
                setFormData(prev => ({ ...prev, active: !prev.active }));
                Swal.fire('¡Completado!', `Paquete ${formData.active ? 'desactivado' : 'activado'} correctamente`, 'success');
            } catch (error) {
                Swal.fire('Error', 'No se pudo cambiar el estado del paquete', 'error');
            } finally {
                setSaving(false);
            }
        }
    };

    if (loading || loadingSelects) {
        return (
            <Box sx={{ p: 3, bgcolor: '#f5f7fa', minHeight: '100vh' }}>
                <Paper sx={{ p: 4, maxWidth: 1200, mx: 'auto' }}>
                    <Stack spacing={3}>
                        <Skeleton variant="rectangular" height={60} animation="wave" />
                        <Skeleton variant="rectangular" height={400} animation="wave" />
                    </Stack>
                </Paper>
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3, bgcolor: '#f5f7fa', minHeight: '100vh' }}>
            <Paper elevation={0} sx={{ borderRadius: 3, maxWidth: 1200, mx: 'auto', overflow: 'hidden' }}>
                {/* Header mejorado */}
                <Box sx={{
                    background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)',
                    color: 'white',
                    p: 4,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: 2
                }}>
                    <Box>
                        <Typography variant="overline" sx={{ opacity: 0.9, letterSpacing: 1.5 }}>
                            {isEditMode ? 'EDITAR REGISTRO' : 'NUEVO REGISTRO'}
                        </Typography>
                        <Typography variant="h4" fontWeight="bold">
                            {isEditMode ? 'Editar Paquete Turístico' : 'Crear Paquete Turístico'}
                        </Typography>
                        {isEditMode && (
                            <Typography variant="body2" sx={{ opacity: 0.8, mt: 0.5 }}>
                                ID: {id}
                            </Typography>
                        )}
                    </Box>

                    {isEditMode && (
                        <Chip
                            label={formData.active ? "ACTIVO" : "INACTIVO"}
                            onClick={handleToggleActive}
                            sx={{
                                cursor: 'pointer',
                                fontWeight: 'bold',
                                bgcolor: formData.active ? 'rgba(76, 175, 80, 0.9)' : 'rgba(158, 158, 158, 0.9)',
                                color: 'white',
                                '&:hover': { bgcolor: formData.active ? 'rgb(76, 175, 80)' : 'rgb(117, 117, 117)' }
                            }}
                        />
                    )}
                </Box>

                <form onSubmit={handleSubmit}>
                    <Box sx={{ p: 4 }}>
                        <Grid container spacing={2}>
                            {/* Información Básica */}
                            <FormSection icon={DescriptionIcon} title="Información Básica">
                                <Grid item xs={12} md={6}>
                                    <TextField
                                        fullWidth
                                        label="Nombre del Paquete"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        error={!!errors.name}
                                        helperText={errors.name}
                                        required
                                        variant="outlined"
                                    />
                                </Grid>

                                <Grid item xs={12} md={6}>
                                    <TextField
                                        fullWidth
                                        label="Destino"
                                        name="destination"
                                        value={formData.destination}
                                        onChange={handleChange}
                                        error={!!errors.destination}
                                        helperText={errors.destination}
                                        required
                                        InputProps={{
                                            startAdornment: <InputAdornment position="start"><LocationIcon color="action" /></InputAdornment>
                                        }}
                                    />
                                </Grid>

                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        label="Descripción"
                                        name="description"
                                        value={formData.description}
                                        onChange={handleChange}
                                        error={!!errors.description}
                                        helperText={errors.description}
                                        multiline
                                        rows={4}
                                        required
                                    />
                                </Grid>
                            </FormSection>

                            {/* Clasificación */}
                            <FormSection icon={CategoryIcon} title="Clasificación">
                                <Grid item xs={12} md={4}>
                                    <FormControl fullWidth error={!!errors.seasonId} required>
                                        <InputLabel>Temporada</InputLabel>
                                        <Select name="seasonId" value={formData.seasonId} onChange={handleChange} label="Temporada">
                                            <MenuItem value=""><em>Seleccione una temporada</em></MenuItem>
                                            {seasons.map(season => (
                                                <MenuItem key={season.id} value={season.id}>{season.name}</MenuItem>
                                            ))}
                                        </Select>
                                        {errors.seasonId && <Typography variant="caption" color="error">{errors.seasonId}</Typography>}
                                    </FormControl>
                                </Grid>

                                <Grid item xs={12} md={4}>
                                    <FormControl fullWidth error={!!errors.categoryId} required>
                                        <InputLabel>Categoría</InputLabel>
                                        <Select name="categoryId" value={formData.categoryId} onChange={handleChange} label="Categoría">
                                            <MenuItem value=""><em>Seleccione una categoría</em></MenuItem>
                                            {categories.map(category => (
                                                <MenuItem key={category.id} value={category.id}>{category.name}</MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Grid>

                                <Grid item xs={12} md={4}>
                                    <FormControl fullWidth error={!!errors.travelTypeId} required>
                                        <InputLabel>Tipo de Viaje</InputLabel>
                                        <Select name="travelTypeId" value={formData.travelTypeId} onChange={handleChange} label="Tipo de Viaje">
                                            <MenuItem value=""><em>Seleccione un tipo</em></MenuItem>
                                            {travelTypes.map(type => (
                                                <MenuItem key={type.id} value={type.id}>{type.name}</MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Grid>
                            </FormSection>

                            {/* Precios y Fechas */}
                            <FormSection icon={MoneyIcon} title="Precios y Fechas">
                                <Grid item xs={12} md={3}>
                                    <TextField
                                        fullWidth
                                        label="Precio"
                                        name="price"
                                        type="number"
                                        value={formData.price}
                                        onChange={handleChange}
                                        error={!!errors.price}
                                        helperText={errors.price}
                                        required
                                        InputProps={{
                                            startAdornment: <InputAdornment position="start">$</InputAdornment>
                                        }}
                                    />
                                </Grid>

                                <Grid item xs={12} md={3}>
                                    <TextField
                                        fullWidth
                                        label="Cupos disponibles"
                                        name="totalSlots"
                                        type="number"
                                        value={formData.totalSlots}
                                        onChange={handleChange}
                                        error={!!errors.totalSlots}
                                        helperText={errors.totalSlots}
                                        required
                                        InputProps={{
                                            startAdornment: <InputAdornment position="start"><PeopleIcon color="action" /></InputAdornment>
                                        }}
                                    />
                                </Grid>

                                <Grid item xs={12} md={3}>
                                    <TextField
                                        fullWidth
                                        label="Fecha de inicio"
                                        name="startDate"
                                        type="date"
                                        value={formData.startDate}
                                        onChange={handleChange}
                                        error={!!errors.startDate}
                                        helperText={errors.startDate}
                                        required
                                        InputLabelProps={{ shrink: true }}
                                        InputProps={{
                                            startAdornment: <InputAdornment position="start"><CalendarIcon color="action" /></InputAdornment>
                                        }}
                                    />
                                </Grid>

                                <Grid item xs={12} md={3}>
                                    <TextField
                                        fullWidth
                                        label="Fecha de fin"
                                        name="endDate"
                                        type="date"
                                        value={formData.endDate}
                                        onChange={handleChange}
                                        error={!!errors.endDate}
                                        helperText={errors.endDate}
                                        required
                                        InputLabelProps={{ shrink: true }}
                                    />
                                </Grid>
                            </FormSection>

                            {/* Estado y Calificación */}
                            <FormSection icon={StarIcon} title="Estado y Calificación">
                                <Grid item xs={12} md={6}>
                                    <FormControl fullWidth>
                                        <InputLabel>Estado del paquete</InputLabel>
                                        <Select name="status" value={formData.status} onChange={handleChange} label="Estado del paquete">
                                            <MenuItem value="DISPONIBLE">Disponible</MenuItem>
                                            <MenuItem value="AGOTADO">Agotado</MenuItem>
                                            <MenuItem value="PROXIMO">Próximo</MenuItem>
                                            <MenuItem value="FINALIZADO">Finalizado</MenuItem>
                                        </Select>
                                    </FormControl>
                                </Grid>

                                <Grid item xs={12} md={6}>
                                    <TextField
                                        fullWidth
                                        label="Calificación (0-5 estrellas)"
                                        name="stars"
                                        type="number"
                                        value={formData.stars}
                                        onChange={handleChange}
                                        inputProps={{ min: 0, max: 5, step: 0.5 }}
                                        InputProps={{
                                            startAdornment: <InputAdornment position="start"><StarIcon color="action" /></InputAdornment>
                                        }}
                                        helperText="Valor entre 0 y 5, puede usar medios puntos"
                                    />
                                </Grid>
                            </FormSection>

                            {/* Contenido Adicional */}
                            <FormSection icon={ImageIcon} title="Contenido Adicional">
                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        label="URL de la imagen principal"
                                        name="imageUrl"
                                        value={formData.imageUrl}
                                        onChange={handleChange}
                                        placeholder="https://ejemplo.com/imagen.jpg"
                                        InputProps={{
                                            startAdornment: <InputAdornment position="start"><ImageIcon color="action" /></InputAdornment>
                                        }}
                                        helperText="Ingrese una URL válida para la imagen del paquete"
                                    />
                                </Grid>
                            </FormSection>
                        </Grid>

                        <Divider sx={{ my: 4 }} />

                        {/* Botones de acción mejorados */}
                        <Stack direction="row" spacing={2} justifyContent="flex-end">
                            <Button
                                variant="outlined"
                                onClick={() => navigate('/admin/packages')}
                                startIcon={<CancelIcon />}
                                size="large"
                            >
                                Cancelar
                            </Button>

                            {isEditMode && (
                                <Button
                                    variant="outlined"
                                    color="error"
                                    onClick={handleToggleActive}
                                    startIcon={<DeleteIcon />}
                                    disabled={saving}
                                    size="large"
                                >
                                    {formData.active ? 'Desactivar' : 'Activar'}
                                </Button>
                            )}

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
                        </Stack>
                    </Box>
                </form>
            </Paper>
        </Box>
    );
};

export default TourPackageAddEdit;