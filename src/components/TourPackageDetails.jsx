import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import tourPackageService from "../services/tourPackage.service";
import '../css/TourPackageDetails.css';

const TourPackageDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [pkg, setPkg] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState("overview");

    useEffect(() => {
        window.scrollTo(0, 0);

        tourPackageService.get(id)
            .then(res => {
                const data = res.data?.data || res.data;
                if (data) {
                    setPkg(data);
                } else {
                    setError("No se encontraron detalles para este paquete.");
                }
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setError("Ocurrió un error al cargar la información del paquete.");
                setLoading(false);
            });
    }, [id]);

    if (loading) {
        return (
            <div className="package-detail-container loading-container">
                <div className="spinner"></div>
                <p>Preparando tu próxima aventura...</p>
            </div>
        );
    }

    if (error || !pkg) {
        return (
            <div className="package-detail-container error-container">
                <h2>Upps... ¡Paquete no encontrado!</h2>
                <p>{error || "El paquete que buscas no está disponible en este momento."}</p>
                <button className="back-btn" onClick={() => navigate("/")}>
                    Volver al Inicio
                </button>
            </div>
        );
    }

    // Calcular días y noches
    let days = null;
    let nights = null;

    if (pkg?.startDate && pkg?.endDate) {
        const start = new Date(pkg.startDate + "T00:00:00");
        const end = new Date(pkg.endDate + "T23:59:59");
        const diff = end - start;

        days = Math.ceil(diff / (1000 * 60 * 60 * 24));
        nights = days > 0 ? days - 1 : 0;
    }

    const currentPrice = pkg.price ? Number(pkg.price) : 0;
    const stars = pkg.stars || 0;

    // Obtener arrays de condiciones, restricciones y servicios
    const conditions = pkg.conditions || [];
    const restrictions = pkg.restrictions || [];
    const services = pkg.services || [];

    return (
        <div className="package-detail-container">

            {/* Hero Header Section */}
            <header className="hero-header">
                <button className="floating-back-btn" onClick={() => navigate("/")}>
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="19" y1="12" x2="5" y2="12"></line>
                        <polyline points="12 19 5 12 12 5"></polyline>
                    </svg>
                    Volver
                </button>

                <div className="hero-background">
                    <img
                        src={pkg.imageUrl || "https://images.unsplash.com/photo-1507525428034-b723cf961d3e"}
                        alt={pkg.name}
                        className="hero-image"
                        onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e' }}
                    />
                </div>
                <div className="hero-overlay"></div>

                <div className="hero-content">
                    <div className="breadcrumb">
                        <button onClick={() => navigate("/")}>Inicio</button>
                        <span>/</span>
                        <span>Paquetes Turísticos</span>
                        <span>/</span>
                        <span>{pkg.destination || 'Detalle'}</span>
                    </div>

                    <div className="hero-badges">
                        {pkg.category?.name && (
                            <span className="badge">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line></svg>
                                {pkg.category.name}
                            </span>
                        )}
                        {pkg.travelType?.name && (
                            <span className="badge">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon></svg>
                                {pkg.travelType.name}
                            </span>
                        )}
                        {pkg.season?.name && (
                            <span className="badge">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>
                                {pkg.season.name}
                            </span>
                        )}
                    </div>

                    <h1 className="hero-title">{pkg.name}</h1>

                    <div className="hero-stars">
                        {[1, 2, 3, 4, 5].map((s, i) => (
                            <span key={i} style={{ color: i < stars ? "#ffc107" : "rgba(255,255,255,0.4)" }}>★</span>
                        ))}
                    </div>
                </div>
            </header>

            {/* Main Layout Grid */}
            <main className="detail-main">

                {/* Left Column */}
                <div className="detail-content">

                    {/* Tabs Navigation */}
                    <div className="tabs-container">
                        <button
                            className={`tab-btn ${activeTab === "overview" ? "active" : ""}`}
                            onClick={() => setActiveTab("overview")}
                        >
                            Descripción General
                        </button>
                        <button
                            className={`tab-btn ${activeTab === "services" ? "active" : ""}`}
                            onClick={() => setActiveTab("services")}
                        >
                            Servicios Incluidos
                        </button>
                        <button
                            className={`tab-btn ${activeTab === "conditions" ? "active" : ""}`}
                            onClick={() => setActiveTab("conditions")}
                        >
                            Condiciones
                        </button>
                        <button
                            className={`tab-btn ${activeTab === "restrictions" ? "active" : ""}`}
                            onClick={() => setActiveTab("restrictions")}
                        >
                            Restricciones
                        </button>
                    </div>

                    {/* Tab Content: Descripción General */}
                    {activeTab === "overview" && (
                        <div className="tab-content">
                            <h2 className="section-title">Acerca de este paquete</h2>
                            <p className="description-text">
                                {pkg.description || "Descubre los maravillosos paisajes e increíbles experiencias que este paquete tiene para ofrecerte. Disfruta de un viaje único diseñado para que tú solo tengas que preocuparte por disfrutar."}
                            </p>

                            <div className="divider" style={{ marginTop: '40px' }}></div>

                            <h2 className="section-title">Lo que debes saber</h2>
                            <div className="summary-item" style={{ marginBottom: '20px' }}>
                                <div className="summary-label">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                                    Destino Principal
                                </div>
                                <div className="summary-value" style={{ fontSize: '18px' }}>{pkg.destination || "Múltiples destinos"}</div>
                            </div>

                            <div className="info-grid">
                                <div className="info-card">
                                    <div className="info-icon">🏨</div>
                                    <div className="info-text">
                                        <strong>Categoría</strong>
                                        <span>{pkg.category?.name || "No especificada"}</span>
                                    </div>
                                </div>
                                <div className="info-card">
                                    <div className="info-icon">👥</div>
                                    <div className="info-text">
                                        <strong>Tipo de Viaje</strong>
                                        <span>{pkg.travelType?.name || "No especificado"}</span>
                                    </div>
                                </div>
                                <div className="info-card">
                                    <div className="info-icon">☀️</div>
                                    <div className="info-text">
                                        <strong>Temporada</strong>
                                        <span>{pkg.season?.name || "No especificada"}</span>
                                    </div>
                                </div>
                                <div className="info-card">
                                    <div className="info-icon">⭐</div>
                                    <div className="info-text">
                                        <strong>Calificación</strong>
                                        <span>{stars} estrellas</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Tab Content: Servicios Incluidos */}
                    {activeTab === "services" && (
                        <div className="tab-content">
                            <h2 className="section-title">✨ Servicios Incluidos</h2>
                            <p className="section-subtitle">Todo lo que necesitas para disfrutar sin preocupaciones</p>

                            {services.length > 0 ? (
                                <div className="services-list">
                                    {services.map((item, index) => (
                                        <div className="service-item" key={item.id || index}>
                                            <div className="service-icon">
                                                {item.service?.name === "Vuelo ida y vuelta" && "✈️"}
                                                {item.service?.name === "Alojamiento" && "🏨"}
                                                {item.service?.name === "Todo incluido" && "🍽️"}
                                                {item.service?.name === "Desayuno incluido" && "🍳"}
                                                {item.service?.name === "Traslados" && "🚐"}
                                                {item.service?.name === "Seguro de viaje" && "🛡️"}
                                                {item.service?.name === "Tours guiados" && "🗺️"}
                                                {item.service?.name === "Entradas a atracciones" && "🎫"}
                                                {item.service?.name === "Actividades incluidas" && "🏄"}
                                                {item.service?.name === "Asistencia 24/7" && "📞"}
                                                {!["Vuelo ida y vuelta", "Alojamiento", "Todo incluido", "Desayuno incluido", "Traslados", "Seguro de viaje", "Tours guiados", "Entradas a atracciones", "Actividades incluidas", "Asistencia 24/7"].includes(item.service?.name) && "✅"}
                                            </div>
                                            <div className="service-info">
                                                <h4>{item.service?.name || "Servicio"}</h4>
                                                <p>{item.service?.description || "Incluido en el paquete"}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="empty-state">
                                    <span>📦</span>
                                    <p>No hay servicios disponibles para mostrar.</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Tab Content: Condiciones */}
                    {activeTab === "conditions" && (
                        <div className="tab-content">
                            <h2 className="section-title">📋 Condiciones Generales</h2>
                            <p className="section-subtitle">Términos y condiciones aplicables a este paquete</p>

                            {conditions.length > 0 ? (
                                <div className="conditions-list">
                                    {conditions.map((item, index) => (
                                        <div className="condition-item" key={item.id || index}>
                                            <div className="condition-icon">
                                                {item.condition?.name?.includes("Cancelación") && "🔄"}
                                                {item.condition?.name?.includes("reembolsable") && "❌"}
                                                {item.condition?.name?.includes("equipaje") && "🧳"}
                                                {item.condition?.name?.includes("bodega") && "🚫"}
                                                {item.condition?.name?.includes("desayuno") && "🍳"}
                                                {item.condition?.name?.includes("alimentación") && "🚫"}
                                                {item.condition?.name?.includes("público") && "👨‍👩‍👧‍👦"}
                                                {item.condition?.name?.includes("mayores") && "🔞"}
                                                {item.condition?.name?.includes("Itinerario") && "📅"}
                                                {!["Cancelación", "reembolsable", "equipaje", "bodega", "desayuno", "alimentación", "público", "mayores", "Itinerario"].some(k => item.condition?.name?.includes(k)) && "✓"}
                                            </div>
                                            <div className="condition-info">
                                                <h4>{item.condition?.name || "Condición"}</h4>
                                                <p>{item.condition?.description || "Aplicable a este paquete"}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="empty-state">
                                    <span>📄</span>
                                    <p>No hay condiciones disponibles para mostrar.</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Tab Content: Restricciones */}
                    {activeTab === "restrictions" && (
                        <div className="tab-content">
                            <h2 className="section-title">⚠️ Restricciones</h2>
                            <p className="section-subtitle">Información importante que debes conocer antes de reservar</p>

                            {restrictions.length > 0 ? (
                                <div className="restrictions-list">
                                    {restrictions.map((item, index) => (
                                        <div className="restriction-item" key={item.id || index}>
                                            <div className="restriction-icon">
                                                {item.restriction?.name?.includes("Edad") && "🔞"}
                                                {item.restriction?.name?.includes("Cancelación") && "🔄"}
                                                {item.restriction?.name?.includes("reembolsable") && "💰"}
                                                {item.restriction?.name?.includes("fecha") && "📅"}
                                                {item.restriction?.name?.includes("Menores") && "👶"}
                                                {item.restriction?.name?.includes("Máximo") && "👥"}
                                                {item.restriction?.name?.includes("Pasaporte") && "🛂"}
                                                {item.restriction?.name?.includes("Seguro") && "🛡️"}
                                                {item.restriction?.name?.includes("equipaje") && "🧳"}
                                                {item.restriction?.name?.includes("Mascotas") && "🐾"}
                                                {item.restriction?.name?.includes("Visa") && "📄"}
                                                {item.restriction?.name?.includes("Vacuna") && "💉"}
                                                {!["Edad", "Cancelación", "reembolsable", "fecha", "Menores", "Máximo", "Pasaporte", "Seguro", "equipaje", "Mascotas", "Visa", "Vacuna"].some(k => item.restriction?.name?.includes(k)) && "⚠️"}
                                            </div>
                                            <div className="restriction-info">
                                                <h4>{item.restriction?.name || "Restricción"}</h4>
                                                <p>{item.restriction?.description || "Aplica para este paquete"}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="empty-state">
                                    <span>🔒</span>
                                    <p>No hay restricciones disponibles para mostrar.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Right Column: Pricing & Booking */}
                <aside className="booking-sidebar">
                    <div className="pricing-card">

                        <div className="price-header">
                            <span className="price-label">Precio por persona desde</span>
                            <div className="price-value">
                                <span className="price-currency">$</span>
                                {currentPrice.toLocaleString()}
                            </div>
                        </div>

                        <div className="divider"></div>

                        <div className="summary-item">
                            <span className="summary-label">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                                Duración
                            </span>
                            <span className="summary-value">
                                {days ? `${days} Días / ${nights} Noches` : "No disponible"}
                            </span>
                        </div>

                        <div className="summary-item">
                            <span className="summary-label">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                                Fecha Ida
                            </span>
                            <span className="summary-value">{pkg.startDate || "Por definir"}</span>
                        </div>

                        <div className="summary-item">
                            <span className="summary-label">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                                Fecha Vuelta
                            </span>
                            <span className="summary-value">{pkg.endDate || "Por definir"}</span>
                        </div>

                        <div className="summary-item">
                            <span className="summary-label">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                                Estado
                            </span>
                            <span className={`status-badge ${pkg.status === "DISPONIBLE" ? "status-available" : "status-unavailable"}`}>
                                {pkg.status === "DISPONIBLE" ? "✓ Disponible" : "No disponible"}
                            </span>
                        </div>

                        <button className="book-action-btn">
                            Reservar Ahora
                        </button>
                        <p className="support-text">Reserva segura garantizada. Pago 100% encriptado.</p>
                    </div>
                </aside>

            </main>
        </div>
    );
};

export default TourPackageDetails;