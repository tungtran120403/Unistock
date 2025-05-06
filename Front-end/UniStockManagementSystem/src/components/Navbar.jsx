import React, { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  Navbar as MTNavbar,
  Breadcrumbs,
  Typography,
  Button,
  IconButton,
  Avatar,
  Menu,
  MenuHandler,
  MenuList,
  MenuItem,
} from "@material-tailwind/react";
import { Menu as MenuIcon, MenuOpen, AccountCircle, KeyboardArrowDown } from "@mui/icons-material"
import { BellIcon, ClockIcon, CreditCardIcon, Cog6ToothIcon, UserCircleIcon } from "@heroicons/react/24/outline";
import { useAuth } from "@/context/AuthContext";
import {
  useMaterialTailwindController,
  setOpenSidenav,
} from "@/context";
import routes from "@/routes/routes"; // Import routes từ file routes.jsx
import { useNotifications } from "../features/user/notification/useNotifications";

// Hàm tìm kiếm layoutName và pageName từ routes.jsx
const getPageInfo = (pathname) => {
  for (const route of routes) {
    for (const page of route.pages) {
      // Nếu khớp đường dẫn, trả về tên
      if (page.path === pathname) {
        return {
          layoutName: page.layout || route.title || route.layout, // Lấy title nếu có, nếu không lấy layout
          pageName: page.name || pathname, // Lấy name nếu có, nếu không dùng pathname
        };
      }

      // Kiểm tra path động dạng /:id
      if (page.path?.includes(":")) {
        const basePath = page.path.split("/:")[0];
        const regex = new RegExp(`^${basePath}/\\d+$`); // chỉ chấp nhận ID là số
        if (regex.test(pathname)) {
          return {
            layoutName: page.layout || route.title || route.layout,
            pageName: page.name || pathname,
          };
        }
      }

      // Kiểm tra subPages nếu có
      if (page.subPages) {
        for (const subPage of page.subPages) {
          if (subPage.path === pathname) {
            return {
              layoutName: route.title || route.layout,
              pageName: page.name || pathname,
              subPageName: subPage.name || pathname,
            };
          }

          if (subPage.path?.includes(":")) {
            const basePath = subPage.path.split("/:")[0];
            const regex = new RegExp(`^${basePath}/\\d+$`);
            if (regex.test(pathname)) {
              return {
                layoutName: subPage.layout || route.title || route.layout,
                pageName: page.name || pathname,
                subPageName: subPage.name || pathname,
              };
            }
          }
        }
      }
    }
  }
  return { layoutName: "Trang", pageName: "Không xác định", subPageName: "Không xác định" }; // Mặc định nếu không tìm thấy
};
export function Navbar({ brandName, routes }) {
  const [controller, dispatch] = useMaterialTailwindController();
  const { openSidenav } = controller;
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { layoutName, pageName, subPageName } = getPageInfo(pathname);

  const { notifications, markAsRead, fetchNotifications } = useNotifications();
  console.log(">>> Notifications in Navbar:", notifications);

  useEffect(() => {
    const handleRefreshNotifications = () => {
      console.log("📢 Received refreshNotifications event in Navbar!");
      fetchNotifications();
    };

    window.addEventListener("refreshNotifications", handleRefreshNotifications);

    return () => {
      window.removeEventListener("refreshNotifications", handleRefreshNotifications);
    };
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  useEffect(() => {
    window.addEventListener("resize", () => window.innerWidth >= 960 && setOpenSidenav(false));
  }, []);

  console.log("Navbar rendered with user:", user);

  return (
    <MTNavbar fullWidth className="py-2 shadow-none bg-white border-b border-l-0 border-gray-200">

      <div className="flex flex-col-reverse justify-between gap-6 md:flex-row md:items-center">
        <div className="capitalize flex items-center gap-3">
          <div className="flex items-center justify-center w-[210px]">
            <Link to="/home" className="pr-2">
              <img src="/img/logo.svg" alt="Brand Logo" className="h-11 w-11" />
            </Link>
            <Link to="/home">
              <Typography className="font-bold text-black text-2xl pt-1">UniStock</Typography>
            </Link>
          </div>
          <IconButton
            variant="text"
            color="blue-gray"
            onClick={() => setOpenSidenav(dispatch, !openSidenav)}
          >
            <MenuIcon strokeWidth={3} className="h-6 w-6 text-blue-gray-500" />
          </IconButton>
          <div>
            <Breadcrumbs
              className="bg-transparent p-0 transition-all"
            >
              <Link to={`/${layoutName.toUpperCase()}`}>
                <Typography
                  variant="small"
                  color="blue-gray"
                  className="font-normal opacity-50 transition-all hover:text-blue-500 hover:opacity-100"
                >
                  {layoutName}
                </Typography>
              </Link>
              <Typography
                variant="small"
                color="blue-gray"
                className="font-normal"
              >
                {pageName}
              </Typography>
            </Breadcrumbs>

            <Typography variant="h6" color="blue-gray">
              {subPageName || pageName}
            </Typography>
          </div>
        </div>
        <div className="flex items-center">
          <Menu>
            <MenuHandler>
              <IconButton variant="text" color="blue-gray">
                <div className="relative">
                  <BellIcon className="h-5 w-5 text-blue-gray-500" />
                  {notifications.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full px-1">
                      {notifications.length}
                    </span>
                  )}
                </div>
              </IconButton>
            </MenuHandler>
            <MenuList className="w-[300px] max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <MenuItem>
                  <Typography variant="small" color="blue-gray" className="text-center w-full">
                    Không có thông báo mới
                  </Typography>
                </MenuItem>
              ) : (
                notifications.map((notif) => (
                  <MenuItem key={notif.notificationId} className="flex items-start gap-3">
                    <div className="grid h-9 w-9 place-items-center rounded-full bg-yellow-500">
                      <BellIcon className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <Typography
                        variant="small"
                        color="blue-gray"
                        className="mb-1 font-normal"
                      >
                        {notif.message}
                      </Typography>
                      <Typography
                        variant="small"
                        color="blue-gray"
                        className="flex items-center gap-1 text-xs font-normal opacity-60"
                      >
                        📅 {new Date(notif.createdAt).toLocaleString()}
                      </Typography>
                    </div>
                  </MenuItem>
                ))
              )}
            </MenuList>

          </Menu>
          {/* <IconButton
            variant="text"
            color="blue-gray"
            onClick={() => setOpenConfigurator(dispatch, true)}
          >
            <Cog6ToothIcon className="h-5 w-5 text-blue-gray-500" />
          </IconButton> */}
          <div className="h-10 w-px bg-gray-300 mx-4"></div>
          {user ? (
            <Menu>
              <MenuHandler>
                <div className="flex items-center gap-2 cursor-pointer mr-2">
                  <Avatar
                    src={user.avatar || "/img/default-avatar.png"}
                    alt={user.email}
                    size="sm"
                    variant="circular"
                    className="mr-2"
                  />
                  <div className="flex flex-col text-start">
                    <Typography variant="h5" className="font-bold text-blue-gray-700">
                      {user.username}
                    </Typography>
                    {user.roles && user.roles.filter(role => role.toLowerCase() !== "user").length > 0 && (
                      <Typography variant="small" className="text-blue-gray-700 text-[11px]">
                        {user.roles
                          .filter(role => role.toLowerCase() !== "user")
                          .join(", ")
                        }
                      </Typography>
                    )}

                  </div>
                  <KeyboardArrowDown className="h-6 w-6 text-blue-gray-500" />
                </div>
              </MenuHandler>
              <MenuList>
                <MenuItem onClick={() => navigate("/profile")}>
                  <Typography variant="small" className="text-blue-gray-700 text-[16px]">Profile</Typography>
                </MenuItem>
                <MenuItem onClick={handleLogout}>
                  <Typography variant="small" className="text-red-500 text-[16px]">Logout</Typography>
                </MenuItem>
              </MenuList>
            </Menu>
          ) : (
            <Link to="/login">
              <Button
                variant="text"
                color="blue-gray"
                className="hidden items-center gap-1 px-4 xl:flex normal-case"
              >
                <UserCircleIcon className="h-5 w-5 text-blue-gray-500" />
                Log In
              </Button>
              <IconButton
                variant="text"
                color="blue-gray"
                className="grid xl:hidden"
              >
                <UserCircleIcon className="h-5 w-5 text-blue-gray-500" />
              </IconButton>
            </Link>
          )}

        </div>
      </div>
    </MTNavbar>
  );
}

Navbar.defaultProps = {
  brandName: "Material Tailwind React",
};

export default Navbar;
