import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { ReactKeycloakProvider } from "@react-keycloak/web";
import keycloak from "./services/keycloak";

ReactDOM.createRoot(document.getElementById('root')).render(
    <ReactKeycloakProvider
        authClient={keycloak}
        initOptions={{
            onLoad: "check-sso",
            pkceMethod: "S256",
        }}
        onTokens={() => {
            if (
                window.location.hash.includes("code=") ||
                window.location.hash.includes("state=") ||
                window.location.search.includes("code=") ||
                window.location.search.includes("state=")
            ) {
                window.history.replaceState(
                    {},
                    document.title,
                    window.location.origin + window.location.pathname
                );
            }
        }}
    >
        <App />
    </ReactKeycloakProvider>
)