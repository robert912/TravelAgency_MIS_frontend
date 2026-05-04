# React + Vite 🚀 Proyecto Frontend

Este proyecto está construido con Node.js y utiliza Vite para el entorno de desarrollo.

## 📦 Requisitos

Antes de comenzar, asegúrate de tener instalado:

- Node.js (recomendado: >= 16)
- npm (incluido con Node.js)

Puedes verificarlo con:

```bash
node -v
npm -v
```

## ⚙️ Instalación

Clona el repositorio e instala las dependencias:

```bash
git clone <URL_DEL_REPOSITORIO>
cd <NOMBRE_DEL_PROYECTO>
npm install
```

## ▶️ Ejecutar en modo desarrollo

Para iniciar el servidor de desarrollo, ejecuta:

```bash
npm run dev
```

Luego abre tu navegador en:

👉 http://localhost:5173



## ▶️ Librerias

```bash
npm install axios #comunicar tu frontend con tu API
npm install react-router-dom #crear rutas dentro de tu app
npm install @mui/material @emotion/react @emotion/styled #Material UI
npm install @mui/icons-material #íconos de Material UI
npm install sweetalert2 #alertas personalizadas
```

## KeyCloak

- en la carpeta /bin ejecuta en una terminal:

```bash
    ./kc.bat start-dev --http-port=9090
```
Activar Email como username:
Realm settings -> Login -> Check Email as username

Activar el Registro:
Realm settings -> Login -> Check User registration

Crear el atributo "Identificación":
Realm settings -> User Profile -> Create attribute -> configura atributos -> check User y Admins

recuperas el atributo "Identificación" en tu App:
Cliente scope -> profile -> Mappers -> Add Mappers -> By configuration -> User Attribute.

Spanish:
Realm settings -> Localization -> Locales -> Enabled Internationalization -> Select locales Spanish

Login block 5 intentos:
Realm settings -> Security defense -> Brute force detection -> Activar y configurar -> Reiniciar servicio

Password mas seguras:
Authentication -> Policies -> Password Policy -> (Minimum Length: 8, Uppercase Characters: 1, Lowercase Characters:1)