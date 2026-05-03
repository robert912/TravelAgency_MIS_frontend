import { useEffect, useRef } from 'react';
import { useKeycloak } from '@react-keycloak/web';
import personService from '../services/person.service';
import Swal from 'sweetalert2';

const AuthSync = () => {
    const { keycloak, initialized } = useKeycloak();
    const hasSynced = useRef(false);

    useEffect(() => {
        if (!initialized || !keycloak.authenticated || hasSynced.current) {
            return;
        }

        const syncUser = async () => {
            hasSynced.current = true;
            try {
                console.log("Iniciando sincronización con Keycloak...");
                const { email, given_name, family_name, preferred_username, identification } = keycloak.tokenParsed;

                // 1. Obtener todos los usuarios y buscar si ya existe por email
                const response = await personService.searchPerson(email);

                let localPerson = response.data?.data || response.data;

                // Verificar si el usuario está inactivo (deshabilitado)
                if (localPerson && localPerson.active === 0) {
                    console.log("El usuario está deshabilitado. Cerrando sesión...");
                    localStorage.removeItem(`person_id_${keycloak.subject}`);

                    Swal.fire({
                        icon: 'warning',
                        title: 'Verificación de Cuenta',
                        text: 'Tu usuario todavía no ha sido habilitado. Escríbenos por el chat de soporte o contacta al administrador para activar tu cuenta.',
                        confirmButtonText: 'Aceptar',
                        allowOutsideClick: false,
                        allowEscapeKey: false
                    }).then(() => {
                        keycloak.logout({ redirectUri: window.location.origin + '/' });
                    });

                    return; // Detener ejecución para que no guarde nada más
                }

                // Verificamos si ya guardamos el ID para esta sesión
                const savedPersonId = localStorage.getItem(`person_id_${keycloak.subject}`);
                if (savedPersonId) {
                    console.log("Usuario ya sincronizado, DB ID:", savedPersonId);
                    return;
                }

                // 2. Si no existe, crearlo
                if (!localPerson) {
                    console.log("Persona no encontrada, registrando en base de datos local...");
                    const newPerson = {
                        fullName: `${given_name || ''} ${family_name || ''}`.trim() || preferred_username || email,
                        email: email,
                        identification: identification || 'SIN_IDENTIFICACION', // requerida por el backend normalmente
                        phone: '',
                        nationality: '',
                        active: 1,
                        failedAttempts: 3,
                        createdByUserId: 1,
                        updatedByUserId: 1
                    };

                    const createRes = await personService.create(newPerson);
                    localPerson = createRes.data?.data || createRes.data;
                    console.log("Persona creada en DB local:", localPerson);
                } else {
                    console.log("Persona encontrada en DB local:", localPerson);
                }

                // 3. Guardar el ID de base de datos en localStorage para usarlo en el Perfil
                if (localPerson && localPerson.id) {
                    localStorage.setItem(`person_id_${keycloak.subject}`, localPerson.id);
                }
            } catch (error) {
                console.error("Error sincronizando usuario con DB local:", error);
                hasSynced.current = false; // Permitir reintento
            }
        };

        syncUser();
    }, [initialized, keycloak.authenticated, keycloak.subject, keycloak.tokenParsed]);

    return null;
};

export default AuthSync;
