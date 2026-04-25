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
import BookingPage from './components/BookingPage';
import MyReservations from './components/MyReservations';
import ReservationDetails from './components/ReservationDetails';
import PaymentPage from './components/PaymentPage';
import { useKeycloak } from "@react-keycloak/web";


function App() {
    const { keycloak, initialized } = useKeycloak();

    if (!initialized) return <div>Cargando...</div>;

    const isLoggedIn = keycloak.authenticated;
    const roles = keycloak.tokenParsed?.realm_access?.roles || [];

    const PrivateRoute = ({ element, rolesAllowed }) => {
        if (!isLoggedIn) {
            keycloak.login();
            return null;
        }
        if (rolesAllowed && !rolesAllowed.some(r => roles.includes(r))) {
            return <h2>No tienes permiso para ver esta página</h2>;
        }
        return element;
    };

    return (
        <BrowserRouter>
            <Navbar></Navbar>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/package/:id" element={<TourPackageDetail />} />

                <Route path="/booking/:id" element={<PrivateRoute element={<BookingPage />} />} />
                <Route path="/my-reservations" element={<PrivateRoute element={<MyReservations />} />} />
                <Route path="/reservation-details/:id" element={<PrivateRoute element={<ReservationDetails />} />} />
                <Route path="/payment/:id" element={<PrivateRoute element={<PaymentPage />} />} />

                {/* Rutas de Administrador */}
                <Route path="/admin/travel-types" element={<PrivateRoute element={<TravelTypeList />} />} />
                <Route path="/admin/travel-types/add" element={<PrivateRoute element={<TravelTypeAddEdit />} />} />
                <Route path="/admin/travel-types/edit/:id" element={<PrivateRoute element={<TravelTypeAddEdit />} />} />
                <Route path="/admin/seasons" element={<PrivateRoute element={<SeasonList />} />} />
                <Route path="/admin/seasons/add" element={<PrivateRoute element={<SeasonAddEdit />} />} />
                <Route path="/admin/seasons/edit/:id" element={<PrivateRoute element={<SeasonAddEdit />} />} />
                <Route path="/admin/categories" element={<PrivateRoute element={<CategoryList />} />} />
                <Route path="/admin/categories/add" element={<PrivateRoute element={<CategoryAddEdit />} />} />
                <Route path="/admin/categories/edit/:id" element={<PrivateRoute element={<CategoryAddEdit />} />} />
                <Route path="/admin/packages" element={<PrivateRoute element={<TourPackageList />} />} />
                <Route path="/admin/packages/add" element={<PrivateRoute element={<TourPackageAddEdit />} />} />
                <Route path="/admin/packages/edit/:id" element={<PrivateRoute element={<TourPackageAddEdit />} />} />
                <Route path="/admin/conditions" element={<PrivateRoute element={<ConditionList />} />} />
                <Route path="/admin/conditions/add" element={<PrivateRoute element={<ConditionAddEdit />} />} />
                <Route path="/admin/conditions/edit/:id" element={<PrivateRoute element={<ConditionAddEdit />} />} />
                <Route path="/admin/restrictions" element={<PrivateRoute element={<RestrictionList />} />} />
                <Route path="/admin/restrictions/add" element={<PrivateRoute element={<RestrictionAddEdit />} />} />
                <Route path="/admin/restrictions/edit/:id" element={<PrivateRoute element={<RestrictionAddEdit />} />} />
                <Route path="/admin/services" element={<PrivateRoute element={<ServiceList />} />} />
                <Route path="/admin/services/add" element={<PrivateRoute element={<ServiceAddEdit />} />} />
                <Route path="/admin/services/edit/:id" element={<PrivateRoute element={<ServiceAddEdit />} />} />
                <Route path="/admin/persons" element={<PrivateRoute element={<PersonList />} />} />
                <Route path="/admin/persons/new" element={<PrivateRoute element={<PersonAddEdit />} />} />
                <Route path="/admin/persons/edit/:id" element={<PrivateRoute element={<PersonAddEdit />} />} />
                <Route path="/admin/persons/view/:id" element={<PrivateRoute element={<PersonAddEdit />} />} />
                <Route path="/admin/reservations/" element={<PrivateRoute element={<ReservationList />} />} />
                <Route path="/admin/reservations/new" element={<PrivateRoute element={<ReservationForm />} />} />
                <Route path="/admin/reservations/edit/:id" element={<PrivateRoute element={<ReservationForm />} />} />
                <Route path="/admin/reservations/view/:id" element={<PrivateRoute element={<ReservationForm />} />} />


                <Route path="*" element={<NotFound />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App