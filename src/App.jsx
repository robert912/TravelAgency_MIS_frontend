import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from './components/Home';
import TourPackageDetail from './components/TourPackageDetails';
import Navbar from './components/Navbar';
import NotFound from './components/NotFound';


function App() {
    return (
        <BrowserRouter>
            <Navbar></Navbar>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/package/:id" element={<TourPackageDetail />} />
                <Route path="*" element={<NotFound/>} />
            </Routes>
        </BrowserRouter>
    );
}

export default App