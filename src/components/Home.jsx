import { useState, useEffect } from 'react'
import { useNavigate } from "react-router-dom";
import '../App.css'
import tourPackageService from '../services/tourPackage.service'

const Home = () => {

    const [packages, setPackages] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const navigate = useNavigate();

    // Estado del buscador
    const [filters, setFilters] = useState({
        destination: '',
        maxPrice: '',
        startDate: '',
        endDate: '',
        travelTypeId: ''
    });

    const fetchPackages = () => {
        setLoading(true);
        tourPackageService.getAllActive()
            .then(response => {
                const data = response.data?.data || response.data || [];
                setPackages(Array.isArray(data) ? data : []);
                setLoading(false);
            })
            .catch(err => {
                console.error("Error fetching packages:", err);
                setError("Lo sentimos, no pudimos cargar los paquetes de viaje.");
                setLoading(false);
            });
    };

    useEffect(() => {
        fetchPackages();
    }, [])

    const handleSearch = (e) => {
        if (e) e.preventDefault();

        // Limpiamos filtros nulos o vacíos para enviar solo los solicitados
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
        tourPackageService.searchFilter(cleanParams)
            .then(response => {
                const data = response.data?.data || response.data || [];
                setPackages(Array.isArray(data) ? data : []);
                setLoading(false);
            })
            .catch(err => {
                console.error("Error filtrando paquetes:", err);
                setError("Ocurrió un error al usar el buscador.");
                setLoading(false);
            });
    }

    const handleChange = (e) => {
        setFilters({ ...filters, [e.target.name]: e.target.value });
    }

    const clearFilters = () => {
        setFilters({
            destination: '',
            maxPrice: '',
            startDate: '',
            endDate: '',
            travelTypeId: ''
        });
        fetchPackages();
    }

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
                                <label>Precio Máximo</label>
                                <input
                                    type="number"
                                    name="maxPrice"
                                    placeholder="$ Máximo"
                                    value={filters.maxPrice}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="search-group">
                                <label>Fechas</label>
                                <div className="date-inputs">
                                    <input
                                        type="date"
                                        name="startDate"
                                        value={filters.startDate}
                                        onChange={handleChange}
                                    />
                                    <span>-</span>
                                    <input
                                        type="date"
                                        name="endDate"
                                        value={filters.endDate}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>

                            <div className="search-group">
                                <label>Experiencia</label>
                                <select name="travelTypeId" value={filters.travelTypeId} onChange={handleChange}>
                                    <option value="">Cualquiera</option>
                                    <option value="1">1 - Aventura</option>
                                    <option value="2">2 - Relax</option>
                                    <option value="3">3 - Cultural</option>
                                    <option value="4">4 - Familiar</option>
                                </select>
                            </div>

                            <div className="search-btn-group">
                                <button type="submit" className="search-btn">
                                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                                    Buscar
                                </button>
                                {(filters.destination || filters.maxPrice || filters.startDate || filters.travelTypeId) && (
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
                        <button className="view-all">Ver todos</button>
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
                                // ✅ CALCULAR DÍAS Y NOCHES
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
                                    <div key={pkg.id} className="package-card">
                                        <div className="card-image-wrapper">
                                            <img
                                                src={pkg.imageUrl || 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'}
                                                alt={pkg.name || 'Destino espectacular'}
                                                onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80' }}
                                            />
                                        </div>

                                        <div className="card-content">
                                            <div className="stars">
                                                {[1, 2, 3, 4, 5].map((star, i) => (
                                                    <span key={i} className="star" style={{ color: i < (pkg.stars || 0) ? "#ffc107" : "#e0e0e0" }} > ★ </span>
                                                ))}
                                            </div>

                                            <h3 className="card-title">{pkg.name || 'Paquete Turístico'}</h3>


                                            <div className="card-details">
                                                <div className="detail-item">
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                                                    <span>{pkg.destination || 'Múltiples Destinos'}</span>
                                                </div>
                                                <div className="detail-item">
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                                                    <span> {days ? `${days} Días / ${nights} Noches` : '7 Días'}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="card-pricing">
                                                <div className="price-info">
                                                    <span className="home-price-label">Precio por persona desde</span>
                                                    <div className="price-row">
                                                        <span className="current-price">${currentPrice.toLocaleString()}</span>
                                                    </div>
                                                </div>
                                                <button
                                                    className="book-btn"
                                                    onClick={() => navigate(`/package/${pkg.id}`)}
                                                >
                                                    Ver Detalle
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
