import { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import travelTypeService from "../services/travelType.service";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import FormControl from "@mui/material/FormControl";
import SaveIcon from "@mui/icons-material/Save";
import Typography from "@mui/material/Typography";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Alert from "@mui/material/Alert";
import { FormControlLabel, Switch } from "@mui/material";

const AddEditTravelType = () => {
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [active, setActive] = useState(false);
    const [errorStatus, setErrorStatus] = useState(null);
    const { id } = useParams();
    const [titleForm, setTitleForm] = useState("");
    const navigate = useNavigate();

    const saveTravelType = (e) => {
        e.preventDefault();
        if (!name.trim()) {
            setErrorStatus("El nombre no puede estar vacío");
            return;
        }

        const travelType = {
            id: id ? Number(id) : undefined,
            name,
            description,
            active: active ? 1 : 0
        };

        if (id) {
            // Editar
            travelTypeService
                .update(travelType)
                .then(() => {
                    navigate("/admin/travel-types");
                })
                .catch((error) => {
                    console.error("Error al actualizar.", error);
                    setErrorStatus("Ha ocurrido un error al intentar actualizar el registro.");
                });
        } else {
            // Crear
            travelTypeService
                .create(travelType)
                .then(() => {
                    navigate("/admin/travel-types");
                })
                .catch((error) => {
                    console.error("Error al crear.", error);
                    setErrorStatus("Ha ocurrido un error al intentar crear un nuevo registro.");
                });
        }
    };

    useEffect(() => {
        if (id) {
            setTitleForm("Editar Tipo de Viaje");
            travelTypeService
                .get(id)
                .then((response) => {
                    // El API puede devolver el objeto directo o dentro de "data"
                    const data = response.data?.data || response.data || {};
                    setName(data.name ?? "");
                    setDescription(data.description ?? "");
                    setActive(data.active === 1);
                })
                .catch((error) => {
                    console.error("Error obteniendo registro.", error);
                    setErrorStatus("No se pudo cargar el registro seleccionado.");
                });
        } else {
            setTitleForm("Nuevo Tipo de Viaje");
        }
    }, [id]);

    return (
        <Box sx={{ maxWidth: 600, margin: "40px auto", padding: "0 20px" }}>
            <Typography variant="h4" component="h1" fontWeight="bold" sx={{ mb: 3 }}>
                {titleForm}
            </Typography>

            <Card sx={{ boxShadow: "0 4px 12px rgba(0,0,0,0.1)", borderRadius: "12px" }}>
                <CardContent sx={{ p: 4 }}>
                    {errorStatus && (
                        <Alert severity="error" sx={{ mb: 3 }}>
                            {errorStatus}
                        </Alert>
                    )}

                    <Box component="form" onSubmit={saveTravelType} noValidate>

                        {id && (
                            <FormControl fullWidth sx={{ mb: 3 }}>
                                <TextField
                                    disabled
                                    id="id"
                                    label="ID"
                                    value={id}
                                    variant="outlined"
                                />
                            </FormControl>
                        )}

                        <FormControl fullWidth sx={{ mb: 4 }}>
                            <TextField
                                required
                                id="name"
                                label="Nombre del Tipo de Viaje"
                                value={name}
                                variant="outlined"
                                onChange={(e) => {
                                    setName(e.target.value)
                                    setErrorStatus(null)
                                }}
                                placeholder="Ej. Viaje Familiar"
                                autoFocus
                            />
                        </FormControl>

                        <FormControl fullWidth sx={{ mb: 4 }}>
                            <TextField
                                required
                                id="description"
                                label="Descripción"
                                value={description}
                                variant="outlined"
                                onChange={(e) => {
                                    setDescription(e.target.value)
                                    setErrorStatus(null)
                                }}
                                placeholder="Ej. Viaje Familiar"
                                autoFocus
                            />
                        </FormControl>

                        <FormControl fullWidth sx={{ mb: 4 }}>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={active}
                                        onChange={(e) => {
                                            setActive(e.target.checked);
                                            setErrorStatus(null);
                                        }}
                                    />
                                }
                                label="Activo"
                            />
                        </FormControl>

                        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                            <Button
                                component={Link}
                                to="/admin/travel-types"
                                color="inherit"
                                variant="text"
                            >
                                Cancelar
                            </Button>
                            <Button
                                type="submit"
                                variant="contained"
                                sx={{ backgroundColor: "var(--primary)", "&:hover": { backgroundColor: "var(--primary-hover)" } }}
                                startIcon={<SaveIcon />}
                            >
                                Gravar
                            </Button>
                        </Box>
                    </Box>
                </CardContent>
            </Card>
        </Box>
    );
};

export default AddEditTravelType;
