import { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import restrictionService from "../services/restriction.service";
import {
    Box, TextField, Button, FormControl, Typography,
    Card, CardContent, Alert, FormControlLabel, Switch
} from "@mui/material";
import SaveIcon from "@mui/icons-material/Save";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

const RestrictionAddEdit = () => {
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [active, setActive] = useState(true);
    const [errorStatus, setErrorStatus] = useState(null);
    const { id } = useParams();
    const navigate = useNavigate();

    // 1. Cargar datos si estamos en modo Edición
    useEffect(() => {
        if (id) {
            restrictionService.get(id)
                .then((response) => {
                    const data = response.data?.data || response.data || {};
                    setName(data.name ?? "");
                    setDescription(data.description ?? "");
                    setActive(data.active === 1);
                })
                .catch((error) => {
                    console.error("Error al cargar la restricción", error);
                    setErrorStatus("No se pudo cargar la información de la restricción.");
                });
        }
    }, [id]);

    // 2. Función para Guardar (Crear o Editar)
    const saveRestriction = (e) => {
        e.preventDefault();

        if (!name.trim()) {
            setErrorStatus("El nombre de la restricción es obligatorio.");
            return;
        }

        const restriction = {
            id: id ? Number(id) : undefined,
            name,
            description,
            active: active ? 1 : 0
        };

        const action = id
            ? restrictionService.update(restriction)
            : restrictionService.create(restriction);

        action.then(() => {
            navigate("/admin/restrictions");
        }).catch((error) => {
            console.error("Error al guardar:", error);
            setErrorStatus("Ocurrió un error al intentar guardar el registro.");
        });
    };

    return (
        <Box sx={{ maxWidth: 600, margin: "40px auto", padding: "0 20px" }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 2 }}>
                <Button
                    startIcon={<ArrowBackIcon />}
                    onClick={() => navigate("/admin/restrictions")}
                    sx={{ color: 'text.secondary' }}
                >
                    Volver
                </Button>
                <Typography variant="h4" component="h1" fontWeight="bold">
                    {id ? "Editar Restricción" : "Nueva Restricción"}
                </Typography>
            </Box>

            <Card sx={{ boxShadow: "0 4px 12px rgba(0,0,0,0.1)", borderRadius: "12px" }}>
                <CardContent sx={{ p: 4 }}>
                    {errorStatus && (
                        <Alert severity="error" sx={{ mb: 3 }}>
                            {errorStatus}
                        </Alert>
                    )}

                    <Box component="form" onSubmit={saveRestriction} noValidate>
                        {/* ID (Solo lectura en edición) */}
                        {id && (
                            <TextField
                                fullWidth
                                disabled
                                label="ID de Restricción"
                                value={id}
                                sx={{ mb: 3 }}
                            />
                        )}

                        {/* Nombre */}
                        <TextField
                            fullWidth
                            required
                            label="Nombre de la Restricción"
                            placeholder="Ej. No apto para menores de 12 años"
                            value={name}
                            onChange={(e) => {
                                setName(e.target.value);
                                setErrorStatus(null);
                            }}
                            sx={{ mb: 3 }}
                            autoFocus
                        />

                        {/* Descripción */}
                        <TextField
                            fullWidth
                            multiline
                            rows={3}
                            label="Descripción detallada"
                            placeholder="Describa los motivos o detalles de la restricción..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            sx={{ mb: 3 }}
                        />

                        {/* Switch de Estado */}
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={active}
                                    onChange={(e) => setActive(e.target.checked)}
                                    color="primary"
                                />
                            }
                            label={active ? "Restricción Activa" : "Restricción Inactiva"}
                            sx={{ mb: 4, display: 'block' }}
                        />

                        {/* Botones de Acción */}
                        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                            <Button
                                component={Link}
                                to="/admin/restrictions"
                                variant="outlined"
                                color="inherit"
                            >
                                Cancelar
                            </Button>
                            <Button
                                type="submit"
                                variant="contained"
                                startIcon={<SaveIcon />}
                                sx={{
                                    backgroundColor: "var(--primary)",
                                    "&:hover": { backgroundColor: "var(--primary-hover)" }
                                }}
                            >
                                Guardar Restricción
                            </Button>
                        </Box>
                    </Box>
                </CardContent>
            </Card>
        </Box>
    );
};

export default RestrictionAddEdit;