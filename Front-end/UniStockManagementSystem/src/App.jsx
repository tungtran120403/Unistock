import { BrowserRouter as Router } from "react-router-dom";
import AppRoutes from "./routes/AppRoutes";
import { AuthProvider } from "./context/AuthContext";
import { MaterialTailwindControllerProvider } from "./context";
import MainLayout from "./layouts/MainLayout";

const App = () => {
  return (
    <AuthProvider>
      <MaterialTailwindControllerProvider>
        <Router>
          <MainLayout>
            <AppRoutes />
          </MainLayout>
        </Router>
      </MaterialTailwindControllerProvider>
    </AuthProvider>
  );
};

export default App;
