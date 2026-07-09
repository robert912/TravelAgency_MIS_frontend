import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import CardTravelIcon from "@mui/icons-material/CardTravel";
import LocationOnIcon from "@mui/icons-material/LocationOn";

/**
 * Cabecera de identidad del viaje, reutilizada en Reserva, Pago y
 * Mis Reservas para que "a qué paquete/reserva pertenece esta pantalla"
 * se vea siempre igual a lo largo de todo el recorrido.
 */
const TripSummaryCard = ({ reservationId, name, destination, extra, statusChip, sx = {} }) => (
    <Paper
        elevation={0}
        sx={{
            p: { xs: 2.5, sm: 3 },
            mb: 3,
            borderRadius: 3,
            background: 'linear-gradient(10deg, var(--primary) 0%, #e044108a 100%)',
            color: '#fff',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 2,
            ...sx
        }}
    >
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
            <CardTravelIcon sx={{ fontSize: 30, opacity: 0.85, mt: 0.3 }} />
            <Box>
                {reservationId && (
                    <Typography variant="caption" sx={{ opacity: 0.85, letterSpacing: 0.6, fontWeight: 600 }}>
                        RESERVA #{reservationId}
                    </Typography>
                )}
                <Typography variant="h6" fontWeight="bold" sx={{ lineHeight: 1.25 }}>
                    {name || 'Paquete turístico'}
                </Typography>
                {destination && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, opacity: 0.92, mt: 0.25 }}>
                        <LocationOnIcon sx={{ fontSize: 16 }} />
                        <Typography variant="body2">
                            {destination}{extra ? ` • ${extra}` : ''}
                        </Typography>
                    </Box>
                )}
            </Box>
        </Box>
        {statusChip}
    </Paper>
);

export default TripSummaryCard;
