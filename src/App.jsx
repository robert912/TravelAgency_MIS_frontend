import { useState, useEffect } from 'react'
import './App.css'
import tourPackageService from './services/tourPackage'

function App() {
  const [packages, setPackages] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    tourPackageService.getAll()
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
  }, [])

  return (
    <div className="app-container">
      {/* Header */}
      <header className="header">
        <div className="header-logo">
          <span className="logo-text">Viajes <span className="highlight">Falabella</span></span>
        </div>
        <nav className="header-nav">
          <ul>
            <li className="active">Paquetes</li>
            <li>Vuelos</li>
            <li>Hoteles</li>
            <li>Ofertas</li>
          </ul>
        </nav>
      </header>

      <main className="main-content">
        {/* Hero Banner */}
        <div className="hero-banner">
          <h1>Encuentra tu próximo viaje</h1>
          <p>Descubre paquetes exclusivos, vive experiencias inolvidables.</p>
        </div>

        {/* Packages Section */}
        <section className="packages-section">
          <div className="section-header">
            <h2>Paquetes Populares</h2>
            <button className="view-all">Ver todos</button>
          </div>

          {loading && (
            <div style={{ textAlign: 'center', padding: '50px' }}>
              <p>Cargando paquetes...</p>
            </div>
          )}
          
          {error && (
            <div style={{ textAlign: 'center', padding: '50px', color: 'red' }}>
              <p>{error}</p>
            </div>
          )}

          {!loading && !error && packages.length === 0 && (
            <div style={{ textAlign: 'center', padding: '50px' }}>
              <p>No se encontraron paquetes.</p>
            </div>
          )}

          {!loading && !error && packages.length > 0 && (
            <div className="packages-grid">
              {packages.map((pkg, index) => {
                const originalPrice = pkg.price ? Math.round(Number(pkg.price) * 1.2) : '1500';
                const currentPrice = pkg.price ? Number(pkg.price) : '999';
                
                return (
                  <div key={pkg.id || pkg._id || index} className="package-card">
                    <div className="card-image-wrapper">
                      <img 
                        src={pkg.imageUrl || pkg.image || 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'} 
                        alt={pkg.name || pkg.title || 'Destino espectacular'} 
                        onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80' }}
                      />
                      <span className="card-badge">Más vendido</span>
                      <span className="card-discount">-20%</span>
                      <button className="favorite-btn" aria-label="Añadir a favoritos">
                        <svg viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                        </svg>
                      </button>
                    </div>

                    <div className="card-content">
                      <div className="stars">
                        <span className="star">★</span>
                        <span className="star">★</span>
                        <span className="star">★</span>
                        <span className="star">★</span>
                        <span className="star" style={{color: '#e0e0e0'}}>★</span>
                      </div>
                      
                      <h3 className="card-title">{pkg.name || pkg.title || 'Paquete Turístico'}</h3>
                      
                      <div className="card-details">
                        <div className="detail-item">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                          <span>{pkg.destination || pkg.location || 'Múltiples Destinos'}</span>
                        </div>
                        <div className="detail-item">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                          <span>{pkg.duration || pkg.days ? `${pkg.duration || pkg.days} Días` : '7 Días'}</span>
                        </div>
                      </div>

                      <div className="card-pricing">
                        <div className="price-info">
                          <span className="price-label">Precio por persona desde</span>
                          <div className="price-row">
                            <span className="original-price">${originalPrice.toLocaleString()}</span>
                            <span className="current-price">${currentPrice.toLocaleString()}</span>
                          </div>
                        </div>
                        <button className="book-btn">Ver Detalle</button>
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

export default App
