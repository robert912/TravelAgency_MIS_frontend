import { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import conditionService from "../services/condition.service";
import {
    Box, TextField, Button, FormControl, Typography,
    Card, CardContent, Alert, FormControlLabel, Switch
} from "@mui/material";
import SaveIcon from "@mui/icons-material/Save";

const ConditionAddEdit = () => {
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [active, setActive] = useState(true);
    const [errorStatus, setErrorStatus] = useState(null);
    const { id } = useParams();
    const navigate = useNavigate();

    const saveCondition = (e) => {
        e.preventDefault();
        if (!name.trim()) {
            setErrorStatus("El nombre es obligatorio");
            return;
        }

        const condition = {
            id: id ? Number(id) : undefined,
            name,
            description,
            active: active ? 1 : 0
        };

        const action = id ? conditionService.update(condition) : conditionService.create(condition);

        action.then(() => {
            navigate("/admin/conditions");
        }).catch((error) => {
            console.error("Error al procesar la condición", error);
            setErrorStatus("Error al guardar el registro.");
        });
    };

    useEffect(() => {
        if (id) {
            conditionService.get(id)
                .then((response) => {
                    const data = response.data?.data || response.data || {};
                    setName(data.name ?? "");
                    setDescription(data.description ?? "");
                    setActive(data.active === 1);
                })
                .catch(() => setErrorStatus("No se pudo cargar la condición."));
        }
    }, [id]);

    return (
        <Box sx={{ maxWidth: 600, margin: "40px auto", padding: "0 20px" }}>
            <Typography variant="h4" fontWeight="bold" sx={{ mb: 3 }}>
                {id ? "Editar Condición" : "Nueva Condición"}
            </Typography>

            <Card sx={{ borderRadius: "12px" }}>
                <CardContent sx={{ p: 4 }}>
                    {errorStatus && <Alert severity="error" sx={{ mb: 3 }}>{errorStatus}</Alert>}

                    <Box component="form" onSubmit={saveCondition}>
                        <TextField
                            fullWidth
                            label="Nombre de la Condición"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            sx={{ mb: 3 }}
                            required
                        />

                        <TextField
                            fullWidth
                            label="Descripción"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            sx={{ mb: 3 }}
                            multiline
                            rows={3}
                        />

                        <FormControlLabel
                            control={<Switch checked={active} onChange={(e) => setActive(e.target.checked)} />}
                            label="Activo"
                            sx={{ mb: 3 }}
                        />

                        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                            <Button component={Link} to="/admin/conditions" color="inherit">
                                Cancelar
                            </Button>
                            <Button type="submit" variant="contained" startIcon={<SaveIcon />} color="primary">
                                Guardar
                            </Button>
                        </Box>
                    </Box>
                </CardContent>
            </Card>
        </Box>
    );
};

export default ConditionAddEdit;