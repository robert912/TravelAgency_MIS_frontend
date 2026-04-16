import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import serviceService from "../services/service.service";
import { Box, TextField, Button, Typography, Card, CardContent, Alert, FormControlLabel, Switch } from "@mui/material";
import SaveIcon from "@mui/icons-material/Save";

const ServiceAddEdit = () => {
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [active, setActive] = useState(true);
    const [errorStatus, setErrorStatus] = useState(null);
    const { id } = useParams();
    const navigate = useNavigate();

    useEffect(() => {
        if (id) {
            serviceService.get(id).then((res) => {
                const data = res.data?.data || res.data || {};
                setName(data.name || "");
                setDescription(data.description || "");
                setActive(data.active === 1);
            }).catch(() => setErrorStatus("Error al cargar servicio"));
        }
    }, [id]);

    const saveService = (e) => {
        e.preventDefault();
        const service = { id: id ? Number(id) : undefined, name, description, active: active ? 1 : 0 };
        const request = id ? serviceService.update(service) : serviceService.create(service);

        request.then(() => navigate("/admin/services"))
            .catch(() => setErrorStatus("Error al guardar el registro"));
    };

    return (
        <Box sx={{ maxWidth: 600, margin: "40px auto", padding: "0 20px" }}>
            <Typography variant="h4" fontWeight="bold" sx={{ mb: 3 }}>
                {id ? "Editar Servicio" : "Nuevo Servicio"}
            </Typography>
            <Card sx={{ borderRadius: "12px" }}>
                <CardContent sx={{ p: 4 }}>
                    {errorStatus && <Alert severity="error" sx={{ mb: 3 }}>{errorStatus}</Alert>}
                    <Box component="form" onSubmit={saveService}>
                        <TextField fullWidth label="Nombre del Servicio" value={name} onChange={(e) => setName(e.target.value)} sx={{ mb: 3 }} required />
                        <TextField fullWidth multiline rows={3} label="Descripción" value={description} onChange={(e) => setDescription(e.target.value)} sx={{ mb: 3 }} />
                        <FormControlLabel control={<Switch checked={active} onChange={(e) => setActive(e.target.checked)} />} label="Activo" sx={{ mb: 3 }} />
                        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                            <Button component={Link} to="/admin/services">Cancelar</Button>
                            <Button type="submit" variant="contained" startIcon={<SaveIcon />}>Guardar</Button>
                        </Box>
                    </Box>
                </CardContent>
            </Card>
        </Box>
    );
};

export default ServiceAddEdit;