import {
  TableCellsIcon,
  ServerStackIcon,
  Bars3BottomRightIcon,
} from "@heroicons/react/24/solid";

import {
  LockPerson,
  AccountCircle,
  Home,
  LocalMall,
  ShoppingCart,
  Warehouse,
  Exposure,
  AllInbox,
  Construction,
  Diversity3,
  Assessment,
  Scale,
} from '@mui/icons-material';

import { Navigate } from "react-router-dom";

import UserPage from "@/features/admin/users/UserPage";
import RolePage from "@/features/admin/roles/RolePage";
import UnauthorizedPage from "@/components/UnauthorizedPage";
import ProfilePage from "@/features/profile/ProfilePage";
import NotFoundPage from "@/components/NotFoundPage";
import WarehousePage from "@/features/user/warehouse/WarehousePage";
import ProductPage from "@/features/user/products/ProductPage";
import SaleOrdersPage from "../features/user/saleorders/SaleOrdersPage";
import PartnerTypePage from "@/features/user/partnerType/PartnerTypePage";
import PartnerPage from "@/features/user/partner/PartnerPage";
import MaterialPage from "@/features/user/materials/MaterialPage";
import MaterialTypePage from "@/features/user/materialType/MaterialTypePage";
import ReceiptNotePage from "../features/user/receiptNote/ReceiptNotePage";
import AddSaleOrderPage from "../features/user/saleorders/AddSaleOrderPage";
import IssueNotePage from "../features/user/issueNote/IssueNotePage";
import AddIssueNote from "../features/user/issueNote/AddIssueNote";
import PurchaseOrderPage from "../features/user/purchaseOrder/PurchaseOrderPage";
import AddProductPage from "@/features/user/products/AddProductPage";
import DetailProductPage from "@/features/user/products/DetailProductPage";
import PurchaseOrderDetail from "../features/user/purchaseOrder/PurchaseOrderDetail";
import ProductTypePage from "@/features/user/productType/ProductTypePage";
import PurchaseRequestPage from "@/features/user/purchaseRequest/PurchaseRequestPage";
import AddPurchaseRequestPage from "../features/user/purchaseRequest/AddPurchaseRequestPage";
import AddMaterialPage from "@/features/user/materials/AddMaterialPage";
import DetailMaterialPage from "@/features/user/materials/DetailMaterialPage";
import ViewReceiptNote from "../features/user/receiptNote/ViewReceiptNote";
import EditSaleOrderPage from "../features/user/saleorders/EditSaleOrderPage";
import DetailPurchaseRequestPage from "../features/user/purchaseRequest/DetailPurchaseRequestPage";
import ForgotPassword from "../features/auth/reset_password/ConfirmEmailPage";
import ResetPassword from "../features/auth/reset_password/ResetPasswordPage";
import LoginPage from "../features/auth/login/LoginPage";
import ConfirmOTPPage from "../features/auth/reset_password/ConfirmOTPPage";
import AddReceiptNoteGeneral from "../features/user/receiptNote/AddReceiptNoteGeneral";
import InventoryReportPage from "../features/user/report/InventoryReportPage";
import GoodReceiptReportPage from "../features/user/report/GoodReceiptReportPage";
import GoodIssueReportPage from "../features/user/report/GoodIssueReportPage";
import StockMovementReportPage from "../features/user/report/StockMovementReportPage";
import ViewIssueNote from "../features/user/issueNote/ViewIssueNote";
import UnitPage from "../features/user/unit/UnitPage";
import HomePage from "../features/home/HomePage";

const icon = { className: "w-5 h-5 text-inherit" };

export const routes = [
  {
    title: "Default",
    layout: "default",
    pages: [
      {
        path: "/",
        element: <Navigate to="/login" replace />,
      },
    ],
  },
  {
    title: "",
    layout: "admin",
    pages: [
      {
        icon: <AccountCircle {...icon} />,
        name: "Người Dùng",
        path: "/admin/users",
        element: <UserPage />,
        roles: ["ADMIN"],
      },
      {
        icon: <LockPerson {...icon} />,
        name: "Vai Trò",
        path: "/admin/roles",
        element: <RolePage />,
        roles: ["ADMIN"],
      },
    ],
  },
  {
    title: "",
    layout: "user",
    pages: [
      {
        icon: <Home {...icon} />,
        name: "Trang chủ",
        path: "/user/home",
        element: <HomePage />,
        roles: ["USER"],
      },
      {
        icon: <ShoppingCart {...icon} />,
        name: "Bán hàng",
        path: "/user/sale-orders",
        element: <SaleOrdersPage />,
        roles: ["USER"],
      },
      {
        icon: <LocalMall {...icon} />,
        name: "Mua hàng",
        path: "/user/purchaseOrder",
        roles: ["USER"],
        element: <Navigate to="/user/purchaseOrder" replace />,
        subPages: [
          {
            icon: <Bars3BottomRightIcon {...icon} />,
            name: "Yêu cầu mua",
            path: "/user/purchase-request",
            element: <PurchaseRequestPage />,
            roles: ["USER"],
          },
          {
            icon: <Bars3BottomRightIcon {...icon} />,
            name: "Đơn mua hàng",
            path: "/user/purchaseOrder",
            element: <PurchaseOrderPage />,
            roles: ["USER"],
          },
        ],
      },
      {
        icon: <Exposure {...icon} />,
        name: "Xuất nhập kho",
        path: "/user/receiptNote",
        roles: ["USER"],
        element: <Navigate to="/user" replace />,
        subPages: [
          {
            icon: <Bars3BottomRightIcon {...icon} />,
            name: "Nhập kho",
            path: "/user/receiptNote",
            element: <ReceiptNotePage />,
            roles: ["USER"],
          },
          {
            icon: <Bars3BottomRightIcon {...icon} />,
            name: "Xuất kho",
            path: "/user/issueNote",
            element: <IssueNotePage />,
            roles: ["USER"],
          },
        ],
      },
      {
        icon: <Warehouse {...icon} />,
        name: "Kho",
        path: "/user/warehouse",
        element: <WarehousePage />,
        roles: ["USER"],
      },
      {
        icon: <AllInbox {...icon} />,
        name: "Sản phẩm",
        path: "/user/products",
        element: <Navigate to="/user/products" replace />,
        roles: ["USER"],
        subPages: [
          {
            icon: <Bars3BottomRightIcon {...icon} />,
            name: "Sản phẩm",
            path: "/user/products",
            element: <ProductPage />,
            roles: ["USER"],
          },
          {
            icon: <Bars3BottomRightIcon {...icon} />,
            name: "Dòng sản phẩm",
            path: "/user/products-types",
            element: <ProductTypePage />,
            roles: ["USER"],
          },
        ],
      },
      {
        icon: <Construction {...icon} />,
        name: "Vật tư",
        path: "/user/materials",
        element: <Navigate to="/user/materials" replace />,
        roles: ["USER"],
        subPages: [
          {
            icon: <Bars3BottomRightIcon {...icon} />,
            name: "Vật tư",
            path: "/user/materials",
            element: <MaterialPage />,
            roles: ["USER"],
          },
          {
            icon: <Bars3BottomRightIcon {...icon} />,
            name: "Danh mục vật tư",
            path: "/user/material-types",
            element: <MaterialTypePage />,
            roles: ["USER"],
          },
        ],
      },
      {
        icon: <Diversity3 {...icon} />,
        name: "Đối tác",
        path: "/user/partner",
        roles: ["USER"],
        element: <Navigate to="/user/partner/type" replace />,
        subPages: [
          {
            icon: <Bars3BottomRightIcon {...icon} />,
            name: "Nhóm đối tác",
            path: "/user/partner/type",
            element: <PartnerTypePage />,
            roles: ["USER"],
          },
          {
            icon: <Bars3BottomRightIcon {...icon} />,
            name: "Đối tác",
            path: "/user/partner/list",
            element: <PartnerPage />,
            roles: ["USER"],
          },
        ],
      },
      {
        icon: <Scale {...icon} />,
        name: "Đơn vị tính",
        path: "/user/unit",
        element: <UnitPage />,
        roles: ["USER"],
      },
      {
        icon: <Assessment {...icon} />,
        name: "Báo cáo",
        path: "/user/report",
        roles: ["USER"],
        subPages: [
          {
            icon: <Bars3BottomRightIcon {...icon} />,
            name: "Tồn kho",
            path: "/user/report/inventory",
            element: <InventoryReportPage />,
            roles: ["USER"],
          },
          {
            icon: <Bars3BottomRightIcon {...icon} />,
            name: "Nhập kho",
            path: "/user/report/receipt",
            element: <GoodReceiptReportPage />,
            roles: ["USER"],
          },
          {
            icon: <Bars3BottomRightIcon {...icon} />,
            name: "Xuất kho",
            path: "/user/report/issue",
            element: <GoodIssueReportPage />,
            roles: ["USER"],
          },
          {
            icon: <Bars3BottomRightIcon {...icon} />,
            name: "Xuất nhập tồn",
            path: "/user/report/stock-movement",
            element: <StockMovementReportPage />,
            roles: ["USER"],
          },
          // {
          //   icon: <Bars3BottomRightIcon {...icon} />,
          //   name: "Đơn hàng",
          //   path: "/user/report/order-based",
          //   element: <SaleOrderReportPage />,
          //   roles: ["USER"],
          // },
          // {
          //   icon: <Bars3BottomRightIcon {...icon} />,
          //   name: "Đối tác",
          //   path: "/user/report/partner-based",
          //   element: <PartnerReportPage />,
          //   roles: ["USER"],
          // },
        ],
      },
    ],
  },
  {
    title: "Auth Pages",
    layout: "auth",
    pages: [
      {
        icon: <ServerStackIcon {...icon} />,
        name: "Sign In",
        path: "/login",
        element: <LoginPage />,
      },
      {
        path: "/confirmEmail",
        element: <ForgotPassword />,
      },
      {
        path: "/confirmOTP",
        element: <ConfirmOTPPage />,
      },
      {
        icon: <ServerStackIcon {...icon} />,
        name: "Reset Password",
        path: "/resetPassword",
        element: <ResetPassword />,
      },
    ],
  },
  {
    title: "Other",
    layout: "other",
    pages: [
      {
        path: "/unauthorized",
        element: <UnauthorizedPage />,
      },
      {
        path: "*",
        element: <NotFoundPage />,
      },
      {
        path: "/profile",
        name: "Tài khoản",
        element: <ProfilePage />,
      },
      {
        layout: "Bán hàng",
        name: "Thêm đơn hàng",
        path: "/user/sale-orders/add",
        element: <AddSaleOrderPage />,
        roles: ["USER"],
      },
      {
        layout: "Bán hàng",
        name: "Chi tiết đơn hàng",
        path: "/user/sale-orders/:orderId",
        element: <EditSaleOrderPage />,
        roles: ["USER"],
      },
      {
        layout: "Nhập kho",
        name: "Thêm phiếu nhập",
        path: "/user/receiptNote/add",
        element: <AddReceiptNoteGeneral />,
        roles: ["USER"],
      },
      {
        icon: <TableCellsIcon {...icon} />,
        name: "Thêm phiếu xuất",
        path: "/user/issueNote/add",
        element: <AddIssueNote />,
        roles: ["USER"],
      },
      {
        icon: <TableCellsIcon {...icon} />,
        name: "Thêm sản phẩm",
        path: "/user/products/add",
        element: <AddProductPage />,
        roles: ["USER"],
      },
      {
        layout: "Sản phẩm",
        name: "Chi tiết sản phẩm",
        path: "/user/products/:id",
        element: <DetailProductPage />,
        roles: ["USER"],
      },
      {
        layout: "Mua hàng",
        name: "Chi tiết đơn đặt hàng",
        path: "/user/purchaseOrder/:orderId",
        element: <PurchaseOrderDetail />,
        roles: ["USER"],
      },
      {
        layout: "Mua hàng",
        name: "Thêm yêu cầu mua vật tư",
        path: "/user/purchase-request/add",
        element: <AddPurchaseRequestPage />,
        roles: ["USER"],
      },
      {
        layout: "Vật tư",
        name: "Thêm vật tư",
        path: "/user/materials/add",
        element: <AddMaterialPage />,
        roles: ["USER"],
      },
      {
        layout: "Vật tư",
        name: "Chi tiết vật tư",
        path: "/user/materials/:id",
        element: <DetailMaterialPage />,
        roles: ["USER"],
      },
      {
        layout: "Mua hàng",
        name: "Chi tiết yêu cầu mua",
        path: "/user/purchase-request/:id",
        element: <DetailPurchaseRequestPage />,
        roles: ["USER"],
      },
      {
        layout: "Nhập kho",
        name: "Chi tiết phiếu nhập kho",
        path: "/user/receiptNote/:id",
        element: <ViewReceiptNote />,
        roles: ["USER"],
      },
      {
        layout: "Nhập kho",
        name: "Thêm phiếu nhập kho",
        path: "/user/receiptNote/manual",
        element: <AddReceiptNoteGeneral />,
        roles: ["USER"],
      },
      {
        layout: "Nhập kho",
        name: "Thêm phiếu nhập",
        path: "/user/receiptNote/general",
        element: <AddReceiptNoteGeneral />,
        roles: ["USER"],
      },
      {
        layout: "Xuất kho", // Sử dụng icon tương tự như trang quản lý kho
        name: "Cho tiết phiếu xuất kho",
        path: "/user/issueNote/:id",
        element: <ViewIssueNote />,
        roles: ["USER"],
      },
    ],
  },
];

export default routes;