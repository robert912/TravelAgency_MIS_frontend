// components/admin/PackageForm.jsx
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import tourPackageService from "../services/tourPackage.service";
import SearchIcon from "@mui/icons-material/Search";
import {
    Box, Paper, Typography, TextField, Button, Grid,
    FormControl, InputLabel, Select, MenuItem,
    Divider, CircularProgress, Stack, Chip,
    InputAdornment, Skeleton, Alert, IconButton, Tooltip,
    Autocomplete, Card, CardContent, Collapse
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
    Info as InfoIcon,
    Inventory as ServiceIcon,
    Description as ConditionIcon,
    Warning as RestrictionIcon,
    Add as AddIcon,
    Remove as RemoveIcon,
    ExpandMore as ExpandMoreIcon,
    ExpandLess as ExpandLessIcon
} from "@mui/icons-material";
import Swal from 'sweetalert2';
import seasonService from "../services/season.service";
import categoryService from "../services/category.service";
import travelTypeService from "../services/travelType.service";
import serviceService from "../services/service.service";
import conditionService from "../services/condition.service";
import restrictionService from "../services/restriction.service";
// Importar servicios de sincronización
import tourPackageConditionService from "../services/tourPackageCondition.service";
import tourPackageRestrictionService from "../services/tourPackageRestriction.service";
import tourPackageServiceService from "../services/tourPackageService.service";

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

// Componente SelectorProfesional reutilizable
const ProfessionalSelector = ({
    title,
    items,
    selectedIds,
    onAdd,
    onRemove,
    icon: Icon,
    placeholder,
    emptyText,
    chipColor = 'primary'
}) => {
    const [open, setOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    const availableItems = items.filter(item =>
        !selectedIds.includes(item.id) &&
        (item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.description?.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const selectedItems = items.filter(item => selectedIds.includes(item.id));

    return (
        <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Icon sx={{ color: 'var(--primary)', fontSize: 20 }} />
                <Typography variant="subtitle2" fontWeight="500">
                    {title}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto' }}>
                    {selectedIds.length} seleccionado{selectedIds.length !== 1 ? 's' : ''}
                </Typography>
            </Box>

            {/* Chips de elementos seleccionados */}
            <Box sx={{
                minHeight: 56,
                p: 1.5,
                bgcolor: '#f8fafc',
                borderRadius: 2,
                border: '1px solid',
                borderColor: '#e2e8f0',
                mb: 1.5
            }}>
                {selectedItems.length > 0 ? (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {selectedItems.map(item => (
                            <Chip
                                key={item.id}
                                label={item.name}
                                onDelete={() => onRemove(item.id)}
                                color={chipColor}
                                variant="outlined"
                                size="small"
                                sx={{
                                    '&:hover': { bgcolor: chipColor === 'error' ? '#fee2e2' : '#e3f2fd' }
                                }}
                            />
                        ))}
                    </Box>
                ) : (
                    <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 1 }}>
                        {emptyText || `No hay ${title.toLowerCase()} seleccionados`}
                    </Typography>
                )}
            </Box>

            {/* Botón para agregar */}
            <Button
                size="small"
                startIcon={<AddIcon />}
                onClick={() => setOpen(!open)}
                sx={{ textTransform: 'none', mb: open ? 1 : 0 }}
            >
                {open ? 'Ocultar opciones' : `Agregar ${title.toLowerCase()}`}
            </Button>

            {/* Panel de opciones disponibles */}
            <Collapse in={open}>
                <Card variant="outlined" sx={{ mt: 1, borderRadius: 2 }}>
                    <CardContent sx={{ p: 2 }}>
                        <TextField
                            fullWidth
                            size="small"
                            placeholder={`Buscar ${title.toLowerCase()}...`}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            sx={{ mb: 2 }}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon fontSize="small" />
                                    </InputAdornment>
                                ),
                            }}
                        />

                        <Box sx={{ maxHeight: 240, overflow: 'auto' }}>
                            {availableItems.length > 0 ? (
                                availableItems.map(item => (
                                    <Box
                                        key={item.id}
                                        sx={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            p: 1.5,
                                            borderRadius: 1,
                                            cursor: 'pointer',
                                            '&:hover': { bgcolor: '#f1f5f9' },
                                            transition: 'background-color 0.2s'
                                        }}
                                        onClick={() => onAdd(item.id)}
                                    >
                                        <Box>
                                            <Typography variant="body2" fontWeight="500">
                                                {item.name}
                                            </Typography>
                                            {item.description && (
                                                <Typography variant="caption" color="text.secondary">
                                                    {item.description.length > 80
                                                        ? `${item.description.substring(0, 80)}...`
                                                        : item.description}
                                                </Typography>
                                            )}
                                        </Box>
                                        <IconButton size="small" sx={{ color: 'var(--primary)' }}>
                                            <AddIcon fontSize="small" />
                                        </IconButton>
                                    </Box>
                                ))
                            ) : (
                                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
                                    No hay más {title.toLowerCase()} disponibles
                                </Typography>
                            )}
                        </Box>
                    </CardContent>
                </Card>
            </Collapse>
        </Box>
    );
};

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
    const [services, setServices] = useState([]);
    const [conditions, setConditions] = useState([]);
    const [restrictions, setRestrictions] = useState([]);
    const [loadingSelects, setLoadingSelects] = useState(true);

    const [formData, setFormData] = useState({
        name: "", destination: "", description: "", seasonId: "",
        categoryId: "", travelTypeId: "", price: "", startDate: "",
        endDate: "", totalSlots: "", status: "DISPONIBLE", stars: 0,
        active: true, imageUrl: "", included: "", notIncluded: "", itinerary: "",
        serviceIds: [], conditionIds: [], restrictionIds: []
    });

    // Cargar datos iniciales
    useEffect(() => {
        const fetchSelectData = async () => {
            setLoadingSelects(true);
            try {
                const [seasonsRes, categoriesRes, travelTypesRes, servicesRes, conditionsRes, restrictionsRes] = await Promise.all([
                    seasonService.getAllActive(),
                    categoryService.getAllActive(),
                    travelTypeService.getAllActive(),
                    serviceService.getAllActive().catch(() => ({ data: { data: [] } })),
                    conditionService.getAllActive().catch(() => ({ data: { data: [] } })),
                    restrictionService.getAllActive().catch(() => ({ data: { data: [] } }))
                ]);

                setSeasons(seasonsRes.data?.data || seasonsRes.data || []);
                setCategories(categoriesRes.data?.data || categoriesRes.data || []);
                setTravelTypes(travelTypesRes.data?.data || travelTypesRes.data || []);
                setServices(servicesRes.data?.data || servicesRes.data || []);
                setConditions(conditionsRes.data?.data || conditionsRes.data || []);
                setRestrictions(restrictionsRes.data?.data || restrictionsRes.data || []);
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
                    itinerary: packageData.itinerary || "",
                    serviceIds: packageData.services?.map(s => s.service?.id || s.id) || [],
                    conditionIds: packageData.conditions?.map(c => c.condition?.id || c.id) || [],
                    restrictionIds: packageData.restrictions?.map(r => r.restriction?.id || r.id) || []
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

    // Funciones para manejar servicios, condiciones y restricciones
    const handleAddService = (serviceId) => {
        setFormData(prev => ({
            ...prev,
            serviceIds: [...prev.serviceIds, serviceId]
        }));
    };

    const handleRemoveService = (serviceId) => {
        setFormData(prev => ({
            ...prev,
            serviceIds: prev.serviceIds.filter(id => id !== serviceId)
        }));
    };

    const handleAddCondition = (conditionId) => {
        setFormData(prev => ({
            ...prev,
            conditionIds: [...prev.conditionIds, conditionId]
        }));
    };

    const handleRemoveCondition = (conditionId) => {
        setFormData(prev => ({
            ...prev,
            conditionIds: prev.conditionIds.filter(id => id !== conditionId)
        }));
    };

    const handleAddRestriction = (restrictionId) => {
        setFormData(prev => ({
            ...prev,
            restrictionIds: [...prev.restrictionIds, restrictionId]
        }));
    };

    const handleRemoveRestriction = (restrictionId) => {
        setFormData(prev => ({
            ...prev,
            restrictionIds: prev.restrictionIds.filter(id => id !== restrictionId)
        }));
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

    // Construir datos del paquete sin incluir las relaciones
    const buildPackageData = () => ({
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
        season: { id: Number(formData.seasonId) },
        category: { id: Number(formData.categoryId) },
        travelType: { id: Number(formData.travelTypeId) },
        ...(isEditMode && { id: Number(id) })
    });

    // Sincronizar todas las relaciones del paquete
    const syncPackageRelations = async (packageId) => {
        const userId = 1;
        const results = [];

        // Sincronizar condiciones
        if (formData.conditionIds !== undefined) {
            try {
                await tourPackageConditionService.syncConditions(packageId, formData.conditionIds, userId);
                results.push({ type: 'conditions', success: true });
            } catch (error) {
                console.error('Error sincronizando condiciones:', error);
                results.push({ type: 'conditions', success: false, error: error.response?.data?.message || error.message });
            }
        }

        // Sincronizar restricciones
        if (formData.restrictionIds !== undefined) {
            try {
                await tourPackageRestrictionService.syncRestrictions(packageId, formData.restrictionIds, userId);
                results.push({ type: 'restrictions', success: true });
            } catch (error) {
                console.error('Error sincronizando restricciones:', error);
                results.push({ type: 'restrictions', success: false, error: error.response?.data?.message || error.message });
            }
        }

        // Sincronizar servicios
        if (formData.serviceIds !== undefined) {
            try {
                await tourPackageServiceService.syncServices(packageId, formData.serviceIds, userId);
                results.push({ type: 'services', success: true });
            } catch (error) {
                console.error('Error sincronizando servicios:', error);
                results.push({ type: 'services', success: false, error: error.response?.data?.message || error.message });
            }
        }

        // Verificar si hubo errores
        const failed = results.filter(r => !r.success);
        if (failed.length > 0) {
            throw new Error(`Error sincronizando: ${failed.map(f => f.type).join(', ')}`);
        }

        return results;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            Swal.fire('Error de validación', 'Por favor revisa los campos marcados', 'error');
            return;
        }

        setSaving(true);

        try {
            const packageData = buildPackageData();
            let packageId;

            if (isEditMode) {
                // 1. Actualizar paquete existente
                await tourPackageService.update(packageData);
                packageId = Number(id);

                // 2. Sincronizar relaciones
                await syncPackageRelations(packageId);

                Swal.fire('¡Actualizado!', 'El paquete ha sido actualizado correctamente', 'success');
            } else {
                // 1. Crear nuevo paquete
                const response = await tourPackageService.create(packageData);
                packageId = response.data?.data?.id || response.data?.id;

                if (!packageId) {
                    throw new Error('No se pudo obtener el ID del paquete creado');
                }

                // 2. Sincronizar relaciones
                await syncPackageRelations(packageId);

                Swal.fire('¡Creado!', 'El paquete ha sido creado correctamente', 'success');
            }

            navigate('/admin/packages');
        } catch (error) {
            console.error("Error al guardar", error);

            let errorMessage = 'Hubo un problema al guardar el paquete';
            if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            } else if (error.message) {
                errorMessage = error.message;
            }

            Swal.fire('Error', errorMessage, 'error');
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
                const packageData = buildPackageData();
                packageData.active = formData.active ? 0 : 1;

                await tourPackageService.update(packageData);
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
                {/* Header */}
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
                                        slotProps={{
                                            inputLabel: { shrink: true },
                                            input: {
                                                startAdornment: (
                                                    <InputAdornment position="start">
                                                        <CalendarIcon color="action" />
                                                    </InputAdornment>
                                                )
                                            }
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
                                            <MenuItem value="NO_VIGENTE">No Vigente</MenuItem>
                                            <MenuItem value="CANCELADO">Cancelado</MenuItem>
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
                                        slotProps={{
                                            htmlInput: { min: 0, max: 5, step: 1 }
                                        }}
                                        InputProps={{
                                            startAdornment: <InputAdornment position="start"><StarIcon color="action" /></InputAdornment>
                                        }}
                                        helperText="Valor entre 0 y 5"
                                    />
                                </Grid>
                            </FormSection>

                            {/* Servicios - Selector Profesional */}
                            <Grid item xs={12}>
                                <Box sx={{ mt: 3, mb: 2 }}>
                                    <Typography variant="h6" fontWeight="600" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <ServiceIcon sx={{ color: 'var(--primary)' }} />
                                        Servicios y Beneficios
                                    </Typography>
                                    <Divider sx={{ mt: 1, mb: 2 }} />
                                </Box>

                                <ProfessionalSelector
                                    title="Servicios Incluidos"
                                    items={services}
                                    selectedIds={formData.serviceIds}
                                    onAdd={handleAddService}
                                    onRemove={handleRemoveService}
                                    icon={ServiceIcon}
                                    placeholder="Buscar servicios..."
                                    emptyText="No hay servicios seleccionados"
                                    chipColor="primary"
                                />
                            </Grid>

                            {/* Condiciones - Selector Profesional */}
                            <Grid item xs={12}>
                                <ProfessionalSelector
                                    title="Condiciones"
                                    items={conditions}
                                    selectedIds={formData.conditionIds}
                                    onAdd={handleAddCondition}
                                    onRemove={handleRemoveCondition}
                                    icon={ConditionIcon}
                                    placeholder="Buscar condiciones..."
                                    emptyText="No hay condiciones seleccionadas"
                                    chipColor="success"
                                />
                            </Grid>

                            {/* Restricciones - Selector Profesional */}
                            <Grid item xs={12}>
                                <ProfessionalSelector
                                    title="Restricciones"
                                    items={restrictions}
                                    selectedIds={formData.restrictionIds}
                                    onAdd={handleAddRestriction}
                                    onRemove={handleRemoveRestriction}
                                    icon={RestrictionIcon}
                                    placeholder="Buscar restricciones..."
                                    emptyText="No hay restricciones seleccionadas"
                                    chipColor="error"
                                />
                            </Grid>

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

                        {/* Botones de acción */}
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