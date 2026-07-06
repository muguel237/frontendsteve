import { BrowserRouter,Routes, Route} from "react-router-dom"
import Dashboard from "./assets/code/Dashboard.jsx";
import Inscription from "./assets/code/Inscription.jsx";
import Terms from "./assets/code/Terms.jsx";
import Login from "./assets/code/login.jsx";
import Forgot from "./assets/code/Forgot.jsx";
import UserD from "./assets/code/UserDashboard.jsx";
import UserDashboard from "./assets/code/UserDashboard.jsx";
import Navigation from "./assets/code/Navigation.jsx";
import AdminDashboard from "./assets/code/AdminDashboard.jsx";
import Annonces from "./assets/code/Annonces.jsx";
function App() {

  return (

    <BrowserRouter>

      <Routes>
         
        <Route path="/" element={<Dashboard />} />
        <Route path="/Inscription" element={<Inscription />} />
        <Route path="/Terms" element={<Terms />} />
        <Route path="/login" element={<Login />} />
        <Route path="/UserD" element={<UserDashboard />} />
        <Route path="/Forgot" element={<Forgot />} />
        <Route path="/Dashboard" element={<Dashboard/>}/>
        <Route path="/Navigation" element={<Navigation />}/>
        <Route path="/UserDashboard" element={<UserDashboard />}/>
        <Route path="/admin" element={<AdminDashboard />}/>
        <Route path="/annonces" element={<Annonces/>}/>
      </Routes>

    </BrowserRouter>

  )
}

export default App