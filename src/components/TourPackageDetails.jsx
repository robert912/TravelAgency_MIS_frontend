import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import tourPackageService from "../services/tourPackage";

const PackageDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [pkg, setPkg] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    tourPackageService.get(id)
      .then(res => {
        const data = res.data?.data || res.data;
        setPkg(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [id]);

  // ✅ calcular días y noches
  let days = null;
  let nights = null;

  if (pkg?.startDate && pkg?.endDate) {
    const start = new Date(pkg.startDate + "T00:00:00");
    const end = new Date(pkg.endDate + "T00:00:00");
    const diff = end - start;

    days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    nights = days > 0 ? days - 1 : 0;
  }

  if (loading) return <p style={{ textAlign: "center" }}>Cargando...</p>;
  if (!pkg) return <p>No se encontró el paquete</p>;

  return (
    <div style={styles.container}>

      {/* Imagen */}
      <div style={styles.imageWrapper}>
        <img
          src={pkg.imageUrl || "https://images.unsplash.com/photo-1507525428034-b723cf961d3e"}
          alt={pkg.name}
          style={styles.image}
        />
      </div>

      {/* Contenido */}
      <div style={styles.content}>

        <h1>{pkg.name}</h1>

        {/* Estrellas */}
        <div>
          {[1,2,3,4,5].map((s,i)=>(
            <span key={i} style={{color: i < pkg.stars ? "#ffc107" : "#ccc"}}>★</span>
          ))}
        </div>

        <p><strong>Destino:</strong> {pkg.destination}</p>

        {/* Fechas */}
        <p>
          <strong>Duración:</strong>{" "}
          {days ? `${days} días / ${nights} noches` : "No disponible"}
        </p>

        <p><strong>Fecha:</strong> {pkg.startDate} → {pkg.endDate}</p>

        {/* Tags */}
        <div style={styles.tags}>
          <span>{pkg.category?.name}</span>
          <span>{pkg.travelType?.name}</span>
          <span>{pkg.season?.name}</span>
        </div>

        {/* Descripción */}
        <p style={styles.description}>{pkg.description}</p>

        {/* Precio */}
        <h2 style={{ color: "#8bc34a" }}>
          ${Number(pkg.price).toLocaleString()}
        </h2>

        {/* Botones */}
        <div style={styles.actions}>
          <button style={styles.primary}>Reservar</button>
          <button style={styles.secondary} onClick={() => navigate("/")}>
            Volver
          </button>
        </div>

      </div>
    </div>
  );
};

const styles = {
  container: {
    maxWidth: "1000px",
    margin: "40px auto",
    padding: "20px",
  },
  imageWrapper: {
    width: "100%",
    height: "400px",
    overflow: "hidden",
    borderRadius: "12px",
  },
  image: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  content: {
    marginTop: "20px",
  },
  tags: {
    display: "flex",
    gap: "10px",
    margin: "10px 0",
  },
  description: {
    marginTop: "15px",
    color: "#555",
  },
  actions: {
    marginTop: "20px",
    display: "flex",
    gap: "10px",
  },
  primary: {
    background: "#8bc34a",
    color: "#fff",
    padding: "10px 20px",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
  },
  secondary: {
    background: "transparent",
    border: "1px solid #ccc",
    padding: "10px 20px",
    borderRadius: "8px",
    cursor: "pointer",
  },
};

export default PackageDetail;