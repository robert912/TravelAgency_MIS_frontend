import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from './components/Home';
import TourPackageDetail from './components/TourPackageDetails';
import Navbar from './components/Navbar';
import NotFound from './components/NotFound';
import TravelTypeList from './components/TravelTypeList';
import TravelTypeAddEdit from './components/TravelTypeAddEdit';
import SeasonList from './components/SeasonList';
import SeasonAddEdit from './components/SeasonAddEdit';
import CategoryList from './components/CategoryList';
import CategoryAddEdit from './components/CategoryAddEdit';


function App() {
    return (
        <BrowserRouter>
            <Navbar></Navbar>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/package/:id" element={<TourPackageDetail />} />

                {/* Rutas de Administrador */}
                <Route path="/admin/travel-types" element={<TravelTypeList />} />
                <Route path="/admin/travel-types/add" element={<TravelTypeAddEdit />} />
                <Route path="/admin/travel-types/edit/:id" element={<TravelTypeAddEdit />} />
                <Route path="/admin/seasons" element={<SeasonList />} />
                <Route path="/admin/seasons/add" element={<SeasonAddEdit />} />
                <Route path="/admin/seasons/edit/:id" element={<SeasonAddEdit />} />
                <Route path="/admin/categories" element={<CategoryList />} />
                <Route path="/admin/categories/add" element={<CategoryAddEdit />} />
                <Route path="/admin/categories/edit/:id" element={<CategoryAddEdit />} />
                

                <Route path="*" element={<NotFound />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App