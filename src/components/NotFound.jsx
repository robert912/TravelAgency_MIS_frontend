import { useNavigate } from "react-router-dom";

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div style={styles.container}>
      <div style={styles.overlay}>
        <h1 style={styles.code}>404</h1>
        <h2 style={styles.title}>Destino no encontrado</h2>
        <p style={styles.text}>
          Parece que este viaje aún no está disponible o te perdiste en el camino...
        </p>

        <button style={styles.button} onClick={() => navigate("/")}>
          Volver al inicio
        </button>
      </div>
    </div>
  );
};

const styles = {
  container: {
    height: "100vh",
    backgroundImage:
      "url('/images/notfound.avif')",
    backgroundSize: "cover",
    backgroundPosition: "center",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  overlay: {
    backgroundColor: "rgba(0,0,0,0.6)",
    padding: "40px",
    borderRadius: "12px",
    textAlign: "center",
    color: "#fff",
    maxWidth: "400px",
  },
  code: {
    fontSize: "80px",
    margin: 0,
    fontWeight: "bold",
    color: "#ddd",
  },
  title: {
    fontSize: "28px",
    margin: "10px 0",
    color: "#ddd",
  },
  text: {
    fontSize: "16px",
    marginBottom: "20px",
    color: "#ddd",
  },
  button: {
    backgroundColor: "#fa4f16",
    border: "none",
    padding: "12px 24px",
    borderRadius: "8px",
    color: "#fff",
    fontWeight: "bold",
    cursor: "pointer",
    transition: "0.3s",
  },
};

export default NotFound;