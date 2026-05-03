import { useState, useEffect } from 'react'
import { useNavigate } from "react-router-dom";
import '../App.css'
import tourPackageService from '../services/tourPackage.service'
import travelTypeService from '../services/travelType.service'
import Swal from 'sweetalert2'

const Home = () => {

    const [packages, setPackages] = useState([])
    const [travelTypes, setTravelTypes] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const navigate = useNavigate();

    // Estado del buscador
    const [filters, setFilters] = useState({
        destination: '',
        minPrice: '',
        maxPrice: '',
        startDate: '',
        endDate: '',
        travelTypeId: ''
    });

    // 🔥 Función para obtener el estado del paquete DIRECTAMENTE del JSON
    const getPackageStatus = (pkg) => {
        switch (pkg.status) {
            case 'CANCELADO':
                return { type: 'CANCELADO', message: 'Cancelado', icon: '❌', canView: false };
            case 'NO_VIGENTE':
                return { type: 'NO_VIGENTE', message: 'No vigente', icon: '📅', canView: false };
            case 'AGOTADO':
                return { type: 'AGOTADO', message: 'Agotado', icon: '⚠️', canView: false };
            default:
                return { type: 'DISPONIBLE', message: 'Disponible', icon: '✅', canView: true };
        }
    };

    const fetchPackages = async () => {
        setLoading(true);
        try {
            const response = await tourPackageService.getAllActive();
            const data = response.data?.data || response.data || [];
            const packagesArray = Array.isArray(data) ? data : [];
            setPackages(packagesArray);
        } catch (err) {
            console.error("Error fetching packages:", err);
            setError("Lo sentimos, no pudimos cargar los paquetes de viaje.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPackages();
        const fetchTravelTypes = async () => {
            try {
                const response = await travelTypeService.getAllActive();
                const data = response.data?.data || response.data || [];
                setTravelTypes(data);
            } catch (err) {
                console.error("Error fetching travel types:", err);
            }
        };
        fetchTravelTypes();
    }, [])

    const handleSearch = async (e) => {
        if (e) e.preventDefault();

        const cleanParams = {};
        Object.keys(filters).forEach(key => {
            if (filters[key]) {
                cleanParams[key] = filters[key];
            }
        });

        if (Object.keys(cleanParams).length === 0) {
            fetchPackages();
            return;
        }

        setLoading(true);
        try {
            const response = await tourPackageService.searchFilter(cleanParams);
            const data = response.data?.data || response.data || [];
            const packagesArray = Array.isArray(data) ? data : [];
            setPackages(packagesArray);
        } catch (err) {
            console.error("Error filtrando paquetes:", err);
            setError("Ocurrió un error al usar el buscador.");
        } finally {
            setLoading(false);
        }
    }

    const handleChange = (e) => {
        setFilters({ ...filters, [e.target.name]: e.target.value });
    }

    const clearFilters = () => {
        setFilters({
            destination: '',
            minPrice: '',
            maxPrice: '',
            startDate: '',
            endDate: '',
            travelTypeId: ''
        });
        fetchPackages();
    }

    // 🔥 Función para manejar clic en botón - simplificada
    const handleViewDetail = (pkg, status) => {
        if (status.canView) {
            navigate(`/package/${pkg.id}`);
        } else {
            const messages = {
                'AGOTADO': 'Este paquete no tiene cupos disponibles',
                'NO_VIGENTE': 'Este paquete ya no está vigente',
                'CANCELADO': 'Este paquete ha sido cancelado'
            };
            Swal.fire({
                title: 'Paquete no disponible',
                text: messages[status.type] || 'Este paquete no está disponible actualmente',
                icon: 'warning',
                confirmButtonText: 'Entendido'
            });
        }
    };

    return (
        <div className="app-container">
            <main className="main-content">
                {/* Hero Banner */}
                <div className="hero-banner">
                    <h1>Encuentra tu próximo viaje</h1>
                    <p>Descubre paquetes exclusivos, vive experiencias inolvidables.</p>

                    {/* Search Bar */}
                    <div className="search-container">
                        <form className="search-form" onSubmit={handleSearch}>
                            <div className="search-group">
                                <label>Destino</label>
                                <input
                                    type="text"
                                    name="destination"
                                    placeholder="¿A dónde vas?"
                                    value={filters.destination}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="search-group">
                                <label>Rango de Precio</label>
                                <div className="date-inputs">
                                    <input
                                        type="number"
                                        name="minPrice"
                                        placeholder="$ Mín"
                                        value={filters.minPrice}
                                        onChange={handleChange}
                                        min="0"
                                    />
                                    <span>-</span>
                                    <input
                                        type="number"
                                        name="maxPrice"
                                        placeholder="$ Máx"
                                        value={filters.maxPrice}
                                        onChange={handleChange}
                                        min="0"
                                    />
                                </div>
                            </div>

                            <div className="search-group">
                                <label>Fechas</label>
                                <div className="date-inputs">
                                    <input
                                        type="date"
                                        name="startDate"
                                        title="Fecha Mínima"
                                        value={filters.startDate}
                                        onChange={handleChange}
                                        min={new Date().toISOString().split('T')[0]}
                                    />
                                    <span>-</span>
                                    <input
                                        type="date"
                                        name="endDate"
                                        title="Fecha Máxima"
                                        value={filters.endDate}
                                        onChange={handleChange}
                                        min={filters.startDate || new Date().toISOString().split('T')[0]}
                                    />
                                </div>
                            </div>

                            <div className="search-group">
                                <label>Experiencia</label>
                                <select name="travelTypeId" value={filters.travelTypeId} onChange={handleChange}>
                                    <option value="">Cualquiera</option>
                                    {travelTypes.map(type => (
                                        <option key={type.id} value={type.id}>{type.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="search-btn-group">
                                <button type="submit" className="search-btn">
                                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                                    Buscar
                                </button>
                                {(filters.destination || filters.minPrice || filters.maxPrice || filters.startDate || filters.endDate || filters.travelTypeId) && (
                                    <button type="button" className="clear-btn" onClick={clearFilters}>Limpiar</button>
                                )}
                            </div>
                        </form>
                    </div>
                </div>

                {/* Packages Section */}
                <section className="packages-section">
                    <div className="section-header">
                        <h2>Paquetes Populares</h2>
                    </div>

                    {loading && (
                        <div style={{ textAlign: 'center', padding: '50px' }}>
                            <div className="spinner" style={{ margin: '0 auto', marginBottom: '15px' }}></div>
                            <p>Buscando paquetes turísticos...</p>
                        </div>
                    )}

                    {error && (
                        <div style={{ textAlign: 'center', padding: '50px', color: 'red' }}>
                            <p>{error}</p>
                        </div>
                    )}

                    {!loading && !error && packages.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '50px' }}>
                            <svg style={{ margin: '0 auto', display: 'block', marginBottom: '20px', color: 'var(--text-light)' }} width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                            <h3>No se encontraron paquetes</h3>
                            <p style={{ color: 'var(--text-light)', marginTop: '10px' }}>Intenta ajustar tus filtros de búsqueda para encontrar más opciones.</p>
                            <button className="book-btn" style={{ marginTop: '20px' }} onClick={clearFilters}>Limpiar Filtros</button>
                        </div>
                    )}

                    {!loading && !error && packages.length > 0 && (
                        <div className="packages-grid">
                            {packages.map((pkg, index) => {
                                const currentPrice = pkg.price ? Number(pkg.price) : '999';
                                const packageStatus = getPackageStatus(pkg);
                                const isBlocked = !packageStatus.canView;

                                // Calcular días y noches
                                let days = null;
                                let nights = null;

                                if (pkg.startDate && pkg.endDate) {
                                    const start = new Date(pkg.startDate + "T00:00:00");
                                    const end = new Date(pkg.endDate + "T23:59:59");
                                    const diffTime = end - start;
                                    days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                                    nights = days > 0 ? days - 1 : 0;
                                }

                                return (
                                    <div key={pkg.id} className={`package-card ${isBlocked ? 'blocked-card' : ''}`}>
                                        <div className="card-image-wrapper">
                                            <img
                                                src={pkg.imageUrl || 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'}
                                                alt={pkg.name || 'Destino espectacular'}
                                                onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80' }}
                                            />

                                            {/* Badge de estado - solo para paquetes no disponibles */}
                                            {isBlocked && (
                                                <div className={`status-ribbon status-${packageStatus.type.toLowerCase()}`}>
                                                    <span>{packageStatus.message}</span>
                                                </div>
                                            )}

                                        </div>

                                        <div className="card-content">
                                            <div className="stars">
                                                {[1, 2, 3, 4, 5].map((star, i) => (
                                                    <span key={i} className="star" style={{ color: i < (pkg.stars || 0) ? "#ffc107" : "#e0e0e0" }} > ★ </span>
                                                ))}
                                            </div>

                                            <h3 className={`card-title ${isBlocked ? 'blocked-text' : ''}`}>
                                                {pkg.name || 'Paquete Turístico'}
                                            </h3>

                                            <div className="card-details">
                                                <div className="detail-item">
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                                                    <span>{pkg.destination || 'Múltiples Destinos'}</span>
                                                </div>
                                                <div className="detail-item">
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                                                    <span>{days ? `${days} Días / ${nights} Noches` : '7 Días'}</span>
                                                </div>
                                            </div>

                                            <div className="card-pricing">
                                                <div className="price-info">
                                                    <span className="home-price-label">Precio por persona desde</span>
                                                    <div className="price-row">
                                                        <span className={`current-price ${isBlocked ? 'blocked-price' : ''}`}>
                                                            ${currentPrice.toLocaleString()}
                                                        </span>
                                                    </div>
                                                </div>
                                                <button
                                                    className={`book-btn ${isBlocked ? 'blocked-btn' : ''}`}
                                                    onClick={() => handleViewDetail(pkg, packageStatus)}
                                                    disabled={isBlocked}
                                                >
                                                    {isBlocked ? packageStatus.message : 'Ver Detalle'}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </section>
            </main>
        </div>
    )
}
export default Home;