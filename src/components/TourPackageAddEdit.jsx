// components/admin/PackageForm.jsx
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import tourPackageService from "../services/tourPackage.service";
import {
    Box, Paper, Typography, TextField, Button, Grid,
    FormControl, InputLabel, Select, MenuItem,
    Divider, CircularProgress, Stack, Chip,
    InputAdornment, Skeleton
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
    Flight as TravelTypeIcon
} from "@mui/icons-material";
import Swal from 'sweetalert2';

// Servicios para las listas desplegables
import seasonService from "../services/season.service";
import categoryService from "../services/category.service";
import travelTypeService from "../services/travelType.service";

const TourPackageAddEdit = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEditMode = !!id;

    // Estados del formulario
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState({});

    // Estados para las listas desplegables
    const [seasons, setSeasons] = useState([]);
    const [categories, setCategories] = useState([]);
    const [travelTypes, setTravelTypes] = useState([]);
    const [loadingSelects, setLoadingSelects] = useState(true);

    // Estado inicial del formulario
    const [formData, setFormData] = useState({
        name: "",
        destination: "",
        description: "",
        seasonId: "",
        categoryId: "",
        travelTypeId: "",
        price: "",
        startDate: "",
        endDate: "",
        totalSlots: "",
        status: "DISPONIBLE",
        stars: 0,
        active: true,
        imageUrl: "",
        included: "",
        notIncluded: "",
        itinerary: ""
    });

    // Cargar listas desplegables
    useEffect(() => {
        const fetchSelectData = async () => {
            setLoadingSelects(true);
            try {
                const [seasonsRes, categoriesRes, travelTypesRes] = await Promise.all([
                    seasonService.getAll(),
                    categoryService.getAll(),
                    travelTypeService.getAll()
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

    // Cargar datos del paquete si es modo edición
    useEffect(() => {
        if (isEditMode && id) {
            fetchPackageData();
        }
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
                    startDate: packageData.startDate || "",
                    endDate: packageData.endDate || "",
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
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: "" }));
        }
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

        if (formData.startDate && formData.endDate) {
            if (new Date(formData.startDate) > new Date(formData.endDate)) {
                newErrors.endDate = "La fecha de fin debe ser posterior a la fecha de inicio";
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Obtener objeto completo por ID
    const getFullSeason = () => seasons.find(s => s.id === Number(formData.seasonId));
    const getFullCategory = () => categories.find(c => c.id === Number(formData.categoryId));
    const getFullTravelType = () => travelTypes.find(t => t.id === Number(formData.travelTypeId));

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            Swal.fire('Error de validación', 'Por favor revisa los campos marcados', 'error');
            return;
        }

        setSaving(true);

        try {
            // Construir objeto base (sin id)
            const baseData = {
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
                season: getFullSeason(),
                category: getFullCategory(),
                travelType: getFullTravelType(),
                included: formData.included || null,
                notIncluded: formData.notIncluded || null,
                itinerary: formData.itinerary || null
            };

            // ✅ Solo agregar id si es modo edición
            const submitData = isEditMode
                ? { ...baseData, id: Number(id) }
                : baseData;

            console.log("Enviando al backend:", JSON.stringify(submitData, null, 2));

            if (isEditMode) {
                // ✅ UPDATE: solo pasa el objeto completo (el id va dentro)
                await tourPackageService.update(submitData);
                Swal.fire('¡Actualizado!', 'El paquete ha sido actualizado correctamente', 'success');
            } else {
                await tourPackageService.create(submitData);
                Swal.fire('¡Creado!', 'El paquete ha sido creado correctamente', 'success');
            }

            navigate('/admin/packages');
        } catch (error) {
            console.error("Error al guardar", error);
            console.error("Detalle:", error.response?.data);
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
                // Construir objeto completo con el active cambiado
                const updatedData = {
                    id: Number(id),
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
                    active: formData.active ? 0 : 1,  // Cambiar estado
                    createdByUserId: 1,
                    modifiedByUserId: 1,
                    createdAt: null,
                    updatedAt: new Date().toISOString(),
                    season: getFullSeason(),
                    category: getFullCategory(),
                    travelType: getFullTravelType(),
                    included: formData.included || null,
                    notIncluded: formData.notIncluded || null,
                    itinerary: formData.itinerary || null
                };

                await tourPackageService.update(updatedData);
                setFormData(prev => ({ ...prev, active: !prev.active }));
                Swal.fire('¡Completado!', `Paquete ${formData.active ? 'desactivado' : 'activado'} correctamente`, 'success');
            } catch (error) {
                console.error("Error:", error);
                Swal.fire('Error', 'No se pudo cambiar el estado del paquete', 'error');
            } finally {
                setSaving(false);
            }
        }
    };

    if (loading || loadingSelects) {
        return (
            <Box sx={{ p: 3, bgcolor: '#f5f5f5', minHeight: '100vh' }}>
                <Paper sx={{ p: 4, maxWidth: 1200, mx: 'auto' }}>
                    <Stack spacing={3}>
                        <Skeleton variant="rectangular" height={60} />
                        <Skeleton variant="rectangular" height={400} />
                    </Stack>
                </Paper>
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3, bgcolor: '#f5f5f5', minHeight: '100vh' }}>
            <Paper elevation={0} sx={{ borderRadius: 2, maxWidth: 1200, mx: 'auto', overflow: 'hidden' }}>
                {/* Header */}
                <Box sx={{
                    bgcolor: 'var(--primary)',
                    color: 'white',
                    p: 3,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: 2
                }}>
                    <Box>
                        <Typography variant="overline" sx={{ opacity: 0.8 }}>
                            {isEditMode ? 'Editar' : 'Nuevo Registro'}
                        </Typography>
                        <Typography variant="h5" fontWeight="bold">
                            {isEditMode ? 'Editar Paquete Turístico' : 'Crear Paquete Turístico'}
                        </Typography>
                    </Box>

                    {isEditMode && (
                        <Chip
                            label={formData.active ? "ACTIVO" : "INACTIVO"}
                            color={formData.active ? "success" : "default"}
                            onClick={handleToggleActive}
                            sx={{
                                cursor: 'pointer',
                                fontWeight: 'bold',
                                bgcolor: formData.active ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
                                color: 'white'
                            }}
                        />
                    )}
                </Box>

                <form onSubmit={handleSubmit}>
                    <Box sx={{ p: 4 }}>
                        <Grid container spacing={4}>
                            {/* SECCIÓN 1: INFORMACIÓN BÁSICA */}
                            <Grid item xs={12}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                                    <DescriptionIcon color="primary" />
                                    <Typography variant="h6" fontWeight="bold">Información Básica</Typography>
                                </Box>
                                <Divider sx={{ mb: 3 }} />
                            </Grid>

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
                                    size="small"
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
                                    size="small"
                                    InputProps={{
                                        startAdornment: <InputAdornment position="start"><LocationIcon fontSize="small" /></InputAdornment>
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
                                    rows={3}
                                    required
                                    size="small"
                                />
                            </Grid>

                            {/* SECCIÓN 2: CLASIFICACIÓN */}
                            <Grid item xs={12}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, mt: 2 }}>
                                    <CategoryIcon color="primary" />
                                    <Typography variant="h6" fontWeight="bold">Clasificación</Typography>
                                </Box>
                                <Divider sx={{ mb: 3 }} />
                            </Grid>

                            <Grid item xs={12} md={4}>
                                <FormControl fullWidth size="small" error={!!errors.seasonId} required>
                                    <InputLabel>Temporada</InputLabel>
                                    <Select
                                        name="seasonId"
                                        value={formData.seasonId}
                                        onChange={handleChange}
                                        label="Temporada"
                                    >
                                        <MenuItem value=""><em>Seleccione una temporada</em></MenuItem>
                                        {seasons.map(season => (
                                            <MenuItem key={season.id} value={season.id}>
                                                {season.name}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>

                            <Grid item xs={12} md={4}>
                                <FormControl fullWidth size="small" error={!!errors.categoryId} required>
                                    <InputLabel>Categoría</InputLabel>
                                    <Select
                                        name="categoryId"
                                        value={formData.categoryId}
                                        onChange={handleChange}
                                        label="Categoría"
                                    >
                                        <MenuItem value=""><em>Seleccione una categoría</em></MenuItem>
                                        {categories.map(category => (
                                            <MenuItem key={category.id} value={category.id}>
                                                {category.name}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>

                            <Grid item xs={12} md={4}>
                                <FormControl fullWidth size="small" error={!!errors.travelTypeId} required>
                                    <InputLabel>Tipo de Viaje</InputLabel>
                                    <Select
                                        name="travelTypeId"
                                        value={formData.travelTypeId}
                                        onChange={handleChange}
                                        label="Tipo de Viaje"
                                    >
                                        <MenuItem value=""><em>Seleccione un tipo</em></MenuItem>
                                        {travelTypes.map(type => (
                                            <MenuItem key={type.id} value={type.id}>
                                                {type.name}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>

                            {/* SECCIÓN 3: PRECIOS Y FECHAS */}
                            <Grid item xs={12}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, mt: 2 }}>
                                    <MoneyIcon color="primary" />
                                    <Typography variant="h6" fontWeight="bold">Precios y Fechas</Typography>
                                </Box>
                                <Divider sx={{ mb: 3 }} />
                            </Grid>

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
                                    size="small"
                                    InputProps={{
                                        startAdornment: <InputAdornment position="start">$</InputAdornment>
                                    }}
                                />
                            </Grid>

                            <Grid item xs={12} md={3}>
                                <TextField
                                    fullWidth
                                    label="Cupos"
                                    name="totalSlots"
                                    type="number"
                                    value={formData.totalSlots}
                                    onChange={handleChange}
                                    error={!!errors.totalSlots}
                                    helperText={errors.totalSlots}
                                    required
                                    size="small"
                                    InputProps={{
                                        startAdornment: <InputAdornment position="start"><PeopleIcon fontSize="small" /></InputAdornment>
                                    }}
                                />
                            </Grid>

                            <Grid item xs={12} md={3}>
                                <TextField
                                    fullWidth
                                    label="Fecha Inicio"
                                    name="startDate"
                                    type="date"
                                    value={formData.startDate}
                                    onChange={handleChange}
                                    error={!!errors.startDate}
                                    helperText={errors.startDate}
                                    required
                                    size="small"
                                    InputLabelProps={{ shrink: true }}
                                />
                            </Grid>

                            <Grid item xs={12} md={3}>
                                <TextField
                                    fullWidth
                                    label="Fecha Fin"
                                    name="endDate"
                                    type="date"
                                    value={formData.endDate}
                                    onChange={handleChange}
                                    error={!!errors.endDate}
                                    helperText={errors.endDate}
                                    required
                                    size="small"
                                    InputLabelProps={{ shrink: true }}
                                />
                            </Grid>

                            {/* SECCIÓN 4: ESTADO Y CALIFICACIÓN */}
                            <Grid item xs={12}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, mt: 2 }}>
                                    <StarIcon color="primary" />
                                    <Typography variant="h6" fontWeight="bold">Estado y Calificación</Typography>
                                </Box>
                                <Divider sx={{ mb: 3 }} />
                            </Grid>

                            <Grid item xs={12} md={6}>
                                <FormControl fullWidth size="small">
                                    <InputLabel>Estado del Paquete</InputLabel>
                                    <Select
                                        name="status"
                                        value={formData.status}
                                        onChange={handleChange}
                                        label="Estado del Paquete"
                                    >
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
                                    label="Calificación (0-5)"
                                    name="stars"
                                    type="number"
                                    value={formData.stars}
                                    onChange={handleChange}
                                    inputProps={{ min: 0, max: 5, step: 0.5 }}
                                    size="small"
                                    InputProps={{
                                        startAdornment: <InputAdornment position="start"><StarIcon fontSize="small" /></InputAdornment>
                                    }}
                                />
                            </Grid>

                            {/* SECCIÓN 5: CONTENIDO ADICIONAL */}
                            <Grid item xs={12}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, mt: 2 }}>
                                    <DescriptionIcon color="primary" />
                                    <Typography variant="h6" fontWeight="bold">Contenido Adicional</Typography>
                                </Box>
                                <Divider sx={{ mb: 3 }} />
                            </Grid>

                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="URL de la Imagen"
                                    name="imageUrl"
                                    value={formData.imageUrl}
                                    onChange={handleChange}
                                    size="small"
                                    placeholder="/images/paquete.png"
                                />
                            </Grid>

                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    label="¿Qué incluye?"
                                    name="included"
                                    value={formData.included}
                                    onChange={handleChange}
                                    multiline
                                    rows={4}
                                    size="small"
                                    placeholder="• Transporte&#10;• Guía turístico&#10;• Entradas"
                                />
                            </Grid>

                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    label="¿Qué NO incluye?"
                                    name="notIncluded"
                                    value={formData.notIncluded}
                                    onChange={handleChange}
                                    multiline
                                    rows={4}
                                    size="small"
                                    placeholder="• Alimentación&#10;• Vuelos"
                                />
                            </Grid>

                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Itinerario"
                                    name="itinerary"
                                    value={formData.itinerary}
                                    onChange={handleChange}
                                    multiline
                                    rows={5}
                                    size="small"
                                    placeholder="Día 1: ...&#10;Día 2: ...&#10;Día 3: ..."
                                />
                            </Grid>
                        </Grid>

                        <Divider sx={{ my: 4 }} />

                        {/* Botones de acción */}
                        <Stack direction="row" spacing={2} justifyContent="flex-end">
                            <Button
                                variant="outlined"
                                onClick={() => navigate('/admin/packages')}
                                startIcon={<CancelIcon />}
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
                                >
                                    {formData.active ? 'Desactivar' : 'Activar'}
                                </Button>
                            )}

                            <Button
                                type="submit"
                                variant="contained"
                                disabled={saving}
                                startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
                                sx={{ bgcolor: 'var(--primary)', '&:hover': { bgcolor: 'var(--primary-hover)' }, minWidth: 120 }}
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