import React from "react";
import Sidenav from "../components/Sidenav";
import Footer from "../components/Footer";
import Navbar from "../components/Navbar";
import { useMaterialTailwindController } from "../context";
import routes from "../routes/routes";
import { useLocation } from "react-router-dom";

const MainLayout = ({ children }) => {
  const [controller] = useMaterialTailwindController();
  const { openSidenav } = controller; // Lấy openSidenav
  const location = useLocation();
  const specialRoutes = ["/login", "/unauthorized", "/not-found", "/confirmEmail", "/resetPassword", "/confirmOTP"];

  if (specialRoutes.includes(location.pathname)) {
    return <div>{children}</div>;
  }

  return (
    <div className="bg-white flex h-screen">
      <div
        className="fixed top-0 left-0 z-40 transition-all duration-300 bg-white w-full"
      >
        <Navbar />
      </div>

      {/* Sidebar */}
      <Sidenav
        routes={routes.filter(
          (route) =>
            route.layout !== "default" &&
            route.layout !== "auth" &&
            route.layout !== "other"
        )}
      />

      {/* Nội dung chính */}
      <div
        className={`flex flex-col transition-all duration-300 ${openSidenav ? "xl:ml-[250px] xl:w-[calc(100%-250px)] ml" : "ml-0 w-full"
          }`}
      >

        {/* Phần nội dung cuộn */}
        <div className="flex-grow max-w-full mt-[62px] overflow-y-auto bg-gray-50">
          {children}
        </div>

        {/* Footer cố định */}
        <div className="text-blue-gray-600 max-w-full bg-gray-50">

          {/* Footer cố định */}
          <div className="text-blue-gray-600 max-w-full bg-gray-50">
            <Footer />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MainLayout;
