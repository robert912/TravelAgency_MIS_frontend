import { useMemo, useState } from "react";
import {
    Alert,
    Box,
    Button,
    Chip,
    CircularProgress,
    Divider,
    Paper,
    Stack,
    Tab,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Tabs,
    TextField,
    Typography
} from "@mui/material";
import {
    Assessment as AssessmentIcon,
    Download as DownloadIcon,
    Refresh as RefreshIcon,
    Sell as SellIcon,
    TrendingUp as TrendingUpIcon
} from "@mui/icons-material";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import dayjs from "dayjs";
import Swal from "sweetalert2";
import reportService from "../services/report.service";

const currencyFormatter = new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0
});

const ReportsPage = () => {
    const [startDate, setStartDate] = useState(dayjs().startOf("month").format("YYYY-MM-DD"));
    const [endDate, setEndDate] = useState(dayjs().format("YYYY-MM-DD"));
    const [sales, setSales] = useState([]);
    const [ranking, setRanking] = useState([]);
    const [loading, setLoading] = useState(false);
    const [generated, setGenerated] = useState(false);
    const [tab, setTab] = useState(0);

    const totals = useMemo(() => {
        return sales.reduce((acc, item) => {
            acc.reservations += 1;
            acc.passengers += Number(item.passengersCount || 0);
            acc.totalAmount += Number(item.totalAmount || 0);
            acc.paidAmount += Number(item.paidAmount || 0);
            return acc;
        }, { reservations: 0, passengers: 0, totalAmount: 0, paidAmount: 0 });
    }, [sales]);

    const validateDates = () => {
        if (!startDate || !endDate) {
            Swal.fire("Fechas requeridas", "Debes ingresar fecha de inicio y fecha de termino", "warning");
            return false;
        }
        if (dayjs(startDate).isAfter(dayjs(endDate))) {
            Swal.fire("Rango invalido", "La fecha de inicio no puede ser posterior a la fecha de termino", "warning");
            return false;
        }
        return true;
    };

    const generateReports = async () => {
        if (!validateDates()) return;

        setLoading(true);
        try {
            const [salesResponse, rankingResponse] = await Promise.all([
                reportService.getSalesByPeriod(startDate, endDate),
                reportService.getPackageRankingByPeriod(startDate, endDate)
            ]);
            setSales(Array.isArray(salesResponse.data) ? salesResponse.data : []);
            setRanking(Array.isArray(rankingResponse.data) ? rankingResponse.data : []);
            setGenerated(true);
        } catch (error) {
            console.error("Error generando reportes:", error);
            Swal.fire("Error", error.response?.data?.message || "No se pudieron generar los reportes", "error");
        } finally {
            setLoading(false);
        }
    };

    const formatDateTime = (value) => {
        return value ? dayjs(value).format("DD/MM/YYYY HH:mm") : "Sin registro";
    };

    const exportPdf = () => {
        const doc = new jsPDF({ orientation: "landscape" });
        const title = tab === 0 ? "Listado de ventas por periodo" : "Ranking de paquetes vendidos";
        const fileName = tab === 0 ? "reporte-ventas.pdf" : "ranking-paquetes.pdf";

        doc.setFontSize(15);
        doc.text(title, 14, 15);
        doc.setFontSize(10);
        doc.text(`Periodo: ${dayjs(startDate).format("DD/MM/YYYY")} - ${dayjs(endDate).format("DD/MM/YYYY")}`, 14, 22);
        doc.text(`Generado: ${dayjs().format("DD/MM/YYYY HH:mm")}`, 14, 28);

        if (tab === 0) {
            autoTable(doc, {
                startY: 34,
                head: [["Fecha", "Cliente", "Paquete", "Pasajeros", "Total", "Pagado", "Estado"]],
                body: sales.map(item => [
                    formatDateTime(item.operationDate),
                    item.clientName || "N/A",
                    item.packageName || "N/A",
                    item.passengersCount || 0,
                    currencyFormatter.format(item.totalAmount || 0),
                    currencyFormatter.format(item.paidAmount || 0),
                    item.status || "N/A"
                ])
            });
        } else {
            autoTable(doc, {
                startY: 34,
                head: [["#", "Paquete", "Destino", "Reservas", "Pasajeros", "Monto generado"]],
                body: ranking.map((item, index) => [
                    index + 1,
                    item.packageName || "N/A",
                    item.destination || "N/A",
                    item.reservationsCount || 0,
                    item.passengersCount || 0,
                    currencyFormatter.format(item.totalAmount || 0)
                ])
            });
        }

        doc.save(fileName);
    };

    return (
        <Box sx={{ p: 3, bgcolor: "#f5f5f5", minHeight: "100vh" }}>
            <Paper elevation={0} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
                <Stack direction={{ xs: "column", md: "row" }} spacing={2} justifyContent="space-between" alignItems={{ xs: "stretch", md: "center" }}>
                    <Box>
                        <Typography variant="h5" fontWeight="bold" gutterBottom>
                            Reportes administrativos
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Ventas por periodo y ranking de paquetes vendidos
                        </Typography>
                    </Box>
                    <AssessmentIcon color="primary" sx={{ fontSize: 42, display: { xs: "none", md: "block" } }} />
                </Stack>
            </Paper>

            <Paper elevation={0} sx={{ p: 2, mb: 3, borderRadius: 2 }}>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems={{ xs: "stretch", sm: "center" }}>
                    <TextField
                        label="Fecha de inicio"
                        type="date"
                        size="small"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        InputLabelProps={{ shrink: true }}
                    />
                    <TextField
                        label="Fecha de termino"
                        type="date"
                        size="small"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        InputLabelProps={{ shrink: true }}
                    />
                    <Button
                        variant="contained"
                        startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <RefreshIcon />}
                        onClick={generateReports}
                        disabled={loading}
                    >
                        Generar
                    </Button>
                    <Button
                        variant="outlined"
                        startIcon={<DownloadIcon />}
                        onClick={exportPdf}
                        disabled={!generated || loading || (tab === 0 ? sales.length === 0 : ranking.length === 0)}
                    >
                        PDF
                    </Button>
                </Stack>
            </Paper>

            <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ mb: 3 }}>
                <Paper sx={{ p: 2, flex: 1, borderRadius: 2 }}>
                    <Stack direction="row" spacing={1} alignItems="center">
                        <SellIcon color="success" />
                        <Typography variant="body2" color="text.secondary">Reservas del periodo</Typography>
                    </Stack>
                    <Typography variant="h5" fontWeight="bold">{totals.reservations}</Typography>
                </Paper>
                <Paper sx={{ p: 2, flex: 1, borderRadius: 2 }}>
                    <Typography variant="body2" color="text.secondary">Pasajeros</Typography>
                    <Typography variant="h5" fontWeight="bold">{totals.passengers}</Typography>
                </Paper>
                <Paper sx={{ p: 2, flex: 1, borderRadius: 2 }}>
                    <Typography variant="body2" color="text.secondary">Monto total</Typography>
                    <Typography variant="h5" fontWeight="bold">{currencyFormatter.format(totals.totalAmount)}</Typography>
                </Paper>
                <Paper sx={{ p: 2, flex: 1, borderRadius: 2 }}>
                    <Typography variant="body2" color="text.secondary">Monto pagado</Typography>
                    <Typography variant="h5" fontWeight="bold">{currencyFormatter.format(totals.paidAmount)}</Typography>
                </Paper>
            </Stack>

            <Paper elevation={0} sx={{ borderRadius: 2, overflow: "hidden" }}>
                <Tabs value={tab} onChange={(e, value) => setTab(value)} sx={{ px: 2, borderBottom: "1px solid #e0e0e0" }}>
                    <Tab icon={<SellIcon />} iconPosition="start" label="Ventas por periodo" />
                    <Tab icon={<TrendingUpIcon />} iconPosition="start" label="Ranking de paquetes" />
                </Tabs>

                {!generated && (
                    <Box sx={{ p: 3 }}>
                        <Alert severity="info">Selecciona un rango de fechas y genera los reportes.</Alert>
                    </Box>
                )}

                {generated && tab === 0 && (
                    <TableContainer sx={{ overflowX: "auto" }}>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell>Fecha operacion</TableCell>
                                    <TableCell>Cliente</TableCell>
                                    <TableCell>Paquete</TableCell>
                                    <TableCell align="right">Pasajeros</TableCell>
                                    <TableCell align="right">Total</TableCell>
                                    <TableCell align="right">Pagado</TableCell>
                                    <TableCell>Estado</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {sales.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} align="center" sx={{ py: 5 }}>
                                            No hay ventas para el periodo seleccionado
                                        </TableCell>
                                    </TableRow>
                                ) : sales.map((item) => (
                                    <TableRow key={item.reservationId} hover>
                                        <TableCell>{formatDateTime(item.operationDate)}</TableCell>
                                        <TableCell>
                                            <Typography variant="body2" fontWeight="bold">{item.clientName}</Typography>
                                            <Typography variant="caption" color="text.secondary">{item.clientEmail}</Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2">{item.packageName}</Typography>
                                            <Typography variant="caption" color="text.secondary">{item.destination}</Typography>
                                        </TableCell>
                                        <TableCell align="right">{item.passengersCount}</TableCell>
                                        <TableCell align="right">{currencyFormatter.format(item.totalAmount || 0)}</TableCell>
                                        <TableCell align="right">{currencyFormatter.format(item.paidAmount || 0)}</TableCell>
                                        <TableCell><Chip size="small" label={item.status} color={item.status === "PAGADA" ? "success" : "warning"} /></TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}

                {generated && tab === 1 && (
                    <TableContainer sx={{ overflowX: "auto" }}>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell>#</TableCell>
                                    <TableCell>Paquete</TableCell>
                                    <TableCell>Destino</TableCell>
                                    <TableCell align="right">Reservas</TableCell>
                                    <TableCell align="right">Pasajeros</TableCell>
                                    <TableCell align="right">Monto generado</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {ranking.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} align="center" sx={{ py: 5 }}>
                                            No hay paquetes vendidos para el periodo seleccionado
                                        </TableCell>
                                    </TableRow>
                                ) : ranking.map((item, index) => (
                                    <TableRow key={item.packageId} hover>
                                        <TableCell>{index + 1}</TableCell>
                                        <TableCell>{item.packageName}</TableCell>
                                        <TableCell>{item.destination}</TableCell>
                                        <TableCell align="right">{item.reservationsCount}</TableCell>
                                        <TableCell align="right">{item.passengersCount}</TableCell>
                                        <TableCell align="right">{currencyFormatter.format(item.totalAmount || 0)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}

                {generated && (
                    <>
                        <Divider />
                        <Box sx={{ p: 2 }}>
                            <Typography variant="caption" color="text.secondary">
                                El ranking se ordena por cantidad de reservas, luego pasajeros y finalmente nombre del paquete.
                            </Typography>
                        </Box>
                    </>
                )}
            </Paper>
        </Box>
    );
};

export default ReportsPage;
