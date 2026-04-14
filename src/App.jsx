import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from './components/Home';
import TourPackageDetail from './components/TourPackageDetails';
import Navbar from './components/Navbar';
import NotFound from './components/NotFound';
import TravelTypeList from './components/TravelTypeList';
import AddEditTravelType from './components/AddEditTravelType';


function App() {
    return (
        <BrowserRouter>
            <Navbar></Navbar>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/package/:id" element={<TourPackageDetail />} />
                
                {/* Rutas de Administrador */}
                <Route path="/admin/travel-types" element={<TravelTypeList />} />
                <Route path="/admin/travel-types/add" element={<AddEditTravelType />} />
                <Route path="/admin/travel-types/edit/:id" element={<AddEditTravelType />} />

                <Route path="*" element={<NotFound/>} />
            </Routes>
        </BrowserRouter>
    );
}

export default App