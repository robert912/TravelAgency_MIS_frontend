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
import TourPackageList from './components/TourPackageList';
import TourPackageAddEdit from './components/TourPackageAddEdit';
import ConditionList from './components/ConditionList';
import ConditionAddEdit from './components/ConditionAddEdit';
import RestrictionList from './components/RestrictionList';
import RestrictionAddEdit from './components/RestrictionAddEdit';
import ServiceList from './components/ServiceList';
import ServiceAddEdit from './components/ServiceAddEdit';
import PersonList from './components/PersonList';
import PersonAddEdit from './components/PersonAddEdit';
import ReservationList from './components/ReservationList';
import ReservationForm from './components/ReservationForm';


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
                <Route path="/admin/packages" element={<TourPackageList />} />
                <Route path="/admin/packages/add" element={<TourPackageAddEdit />} />
                <Route path="/admin/packages/edit/:id" element={<TourPackageAddEdit />} />
                <Route path="/admin/conditions" element={<ConditionList />} />
                <Route path="/admin/conditions/add" element={<ConditionAddEdit />} />
                <Route path="/admin/conditions/edit/:id" element={<ConditionAddEdit />} />
                <Route path="/admin/restrictions" element={<RestrictionList />} />
                <Route path="/admin/restrictions/add" element={<RestrictionAddEdit />} />
                <Route path="/admin/restrictions/edit/:id" element={<RestrictionAddEdit />} />
                <Route path="/admin/services" element={<ServiceList />} />
                <Route path="/admin/services/add" element={<ServiceAddEdit />} />
                <Route path="/admin/services/edit/:id" element={<ServiceAddEdit />} />
                <Route path="/admin/persons" element={<PersonList />} />
                <Route path="/admin/persons/new" element={<PersonAddEdit />} />
                <Route path="/admin/persons/edit/:id" element={<PersonAddEdit />} />
                <Route path="/admin/persons/view/:id" element={<PersonAddEdit />} />
                <Route path="/admin/reservations/" element={<ReservationList />} />
                <Route path="/admin/reservations/new" element={<ReservationForm />} />
                <Route path="/admin/reservations/edit/:id" element={<ReservationForm />} />
                <Route path="/admin/reservations/view/:id" element={<ReservationForm />} />


                <Route path="*" element={<NotFound />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App