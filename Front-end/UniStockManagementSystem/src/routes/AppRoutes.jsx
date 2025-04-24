import React from "react";
import { Route, Routes } from "react-router-dom";
import routes from "./routes";
import { useAuth } from "@/context/AuthContext";
import UnauthorizedPage from "@/components/UnauthorizedPage";

const AppRoutes = () => {
  const { user } = useAuth();

  // ✅ Chuyển role về dạng mảng nếu cần
  const userRoles = Array.isArray(user?.roles)
    ? user.roles
    : typeof user?.roles === "string"
    ? user.roles.split(",").map((role) => role.trim())
    : [];

  return (
    <Routes>
      {routes.flatMap((routeGroup) =>
        routeGroup.pages.map((route, index) => {
          // ✅ Kiểm tra role trước khi render
          const hasAccess =
            !route.roles || route.roles.length === 0 || route.roles.some((role) => userRoles.includes(role));

            return route.subPages ? (
            route.subPages.map((subPage, subIndex) => (
              <Route
              key={`${index}-${subIndex}`}
              path={subPage.path}
              element={hasAccess ? subPage.element : <UnauthorizedPage />}
              />
            ))
            ) : (
            <Route
              key={index}
              path={route.path}
              element={hasAccess ? route.element : <UnauthorizedPage />}
            />
            );
        })
      )}
    </Routes>
  );
};

export default AppRoutes;
