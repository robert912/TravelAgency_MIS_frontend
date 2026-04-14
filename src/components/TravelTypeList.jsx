import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import travelTypeService from "../services/travelType.service";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import Card from "@mui/material/Card";
import Swal from 'sweetalert2';

const TravelTypeList = () => {
  const [travelTypes, setTravelTypes] = useState([]);
  const navigate = useNavigate();

  const fetchTravelTypes = () => {
    travelTypeService
      .getAll()
      .then((response) => {
        const data = response.data?.data || response.data || [];
        setTravelTypes(Array.isArray(data) ? data : []);
      })
      .catch((error) => {
        console.error("Error al obtener tipos de viaje", error);
      });
  };

  useEffect(() => {
    fetchTravelTypes();
  }, []);

  const handleDelete = (id) => {
    Swal.fire({
      title: '¿Estás seguro?',
      text: "¡No podrás revertir la eliminación!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: 'var(--primary)',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        travelTypeService
          .remove(id)
          .then(() => {
            Swal.fire(
              '¡Eliminado!',
              'El registro ha sido eliminado correctamente.',
              'success'
            );
            fetchTravelTypes(); // Refresh list
          })
          .catch((error) => {
            console.error("Error al eliminar un tipo de viaje", error);
            Swal.fire(
              'Error',
              'Hubo un problema al intentar eliminar el registro.',
              'error'
            );
          });
      }
    });
  };

  return (
    <Box sx={{ maxWidth: 800, margin: "40px auto", padding: "0 20px" }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" fontWeight="bold">
          Tipos de Viajes
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => navigate("/admin/travel-types/add")}
          sx={{ backgroundColor: "var(--primary)", "&:hover": { backgroundColor: "var(--primary-hover)" } }}
        >
          Nuevo Tipo
        </Button>
      </Box>

      <Card sx={{ boxShadow: "0 4px 12px rgba(0,0,0,0.1)", borderRadius: "12px" }}>
        <TableContainer component={Paper} elevation={0}>
          <Table sx={{ minWidth: 650 }} aria-label="simple table">
            <TableHead sx={{ backgroundColor: "var(--bg-color)" }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>ID</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Nombre del Tipo</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Estado</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Descripción</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold' }}>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {travelTypes.map((row) => (
                <TableRow
                  key={row.id}
                  sx={{ "&:last-child td, &:last-child th": { border: 0 }, "&:hover": { backgroundColor: "#fafafa" } }}
                >
                  <TableCell component="th" scope="row">
                    {row.id}
                  </TableCell>
                  <TableCell>{row.name}</TableCell>
                  <TableCell>{row.active ? "Activo" : "Inactivo"}</TableCell>
                  <TableCell>{row.description}</TableCell>
                  <TableCell align="right">
                    <Button
                      variant="outlined"
                      color="info"
                      size="small"
                      startIcon={<EditIcon />}
                      onClick={() => navigate(`/admin/travel-types/edit/${row.id}`)}
                      sx={{ mr: 1 }}
                    >
                      Editar
                    </Button>
                    <Button
                      variant="outlined"
                      color="error"
                      size="small"
                      startIcon={<DeleteIcon />}
                      onClick={() => handleDelete(row.id)}
                    >
                      Eliminar
                    </Button>
                  </TableCell>
                </TableRow>
              ))}

              {travelTypes.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                    No hay tipos de viajes registrados en el sistema.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      <Box sx={{ mt: 3 }}>
        <Button component={Link} to="/" color="inherit">
          Volver al Inicio
        </Button>
      </Box>
    </Box>
  );
};

export default TravelTypeList;
