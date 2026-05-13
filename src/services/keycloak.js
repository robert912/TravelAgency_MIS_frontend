import Keycloak from "keycloak-js";

const keycloak = new Keycloak({
  url: `http://${import.meta.env.VITE_BACKEND_SERVER}:${import.meta.env.VITE_KEYCLOAK_PORT}`,
  realm: "travel-realm",
  clientId: "travel-frontend",
});

export default keycloak;