import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import {
  Card,
  CardBody,
  Typography,
  Tooltip,
} from "@material-tailwind/react";
import {
  IconButton,
} from '@mui/material';
import {
  VisibilityOutlined
} from '@mui/icons-material';
import useSaleOrder from "./useSaleOrder";
import ReactPaginate from "react-paginate";
import { ArrowRightIcon, ArrowLeftIcon } from "@heroicons/react/24/outline";
import dayjs from "dayjs";
import { useNavigate } from "react-router-dom";
import PageHeader from '@/components/PageHeader';
import TableSearch from '@/components/TableSearch';
import Table from "@/components/Table";
import DateFilterButton from "@/components/DateFilterButton";
import StatusFilterButton from "@/components/StatusFilterButton";
import SuccessAlert from "@/components/SuccessAlert";

const SaleOrdersPage = () => {
  const {
    saleOrders,
    fetchPaginatedSaleOrders,
    totalPages,
    totalElements,
    getNextCode,
  } = useSaleOrder();

  // State quản lý tìm kiếm, phân trang
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  // State for filter and search
  const [selectedStatuses, setSelectedStatuses] = useState([]);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [statusAnchorEl, setStatusAnchorEl] = useState(null);
  const [allStatuses, setAllStatuses] = useState([]);

  // List status for filter and display
  const saleOrderStatuses = [
    {
        value: "PROCESSING",
        label: "Chưa có yêu cầu",
        className: "bg-gray-100 text-gray-800",
    },
    
    {
        value: "PROCESSING_PENDING_REQUEST",
        label: "Đang chờ yêu cầu được duyệt",
        className: "bg-blue-50 text-blue-800",
    },
    {
        value: "PROCESSING_REJECTED_REQUEST",
        label: "Yêu cầu bị từ chối",
        className: "bg-pink-50 text-pink-800",
    },
    {
        value: "PREPARING_MATERIAL",
        label: "Đang chuẩn bị",
        className: "bg-yellow-100 text-amber-800",
    },
    {
        value: "PARTIALLY_ISSUED",
        label: "Đã xuất một phần",
        className: "bg-indigo-50 text-indigo-800",
    },
    {
        value: "COMPLETED",
        label: "Đã hoàn thành",
        className: "bg-green-50 text-green-800",
    },
    {
        value: "CANCELLED",
        label: "Đã huỷ",
        className: "bg-red-50 text-red-800",
    },
  ];

  // Hàm tính toán nhãn hiển thị dựa trên status và purchaseRequestStatus
  const getDisplayLabel = (status, purchaseRequestStatus) => {
    switch (status) {
      case "PROCESSING":
        switch (purchaseRequestStatus) {
          case "NONE":
            return "Chưa có yêu cầu";
          case "CONFIRMED":
            return "Yêu cầu đã được duyệt";
          case "CANCELLED":
            return "Yêu cầu bị từ chối";
          case "PENDING":
            return "Đang chờ yêu cầu được duyệt";
          default:
            return "Không rõ trạng thái";
        }
      case "PROCESSING_NO_REQUEST":
        return "Chưa có yêu cầu";
      case "PROCESSING_PENDING_REQUEST":
        return "Đang chờ yêu cầu được duyệt";
      case "PROCESSING_REJECTED_REQUEST":
        return "Yêu cầu bị từ chối";
      case "PREPARING_MATERIAL":
        return "Đang chuẩn bị";
      case "PARTIALLY_ISSUED":
        return "Đã xuất một phần";
      case "COMPLETED":
        return "Đã hoàn thành";
      case "CANCELLED":
        return "Đã huỷ";
      default:
        return "Không rõ trạng thái";
    }
  };

  // Handle search
  const handleSearch = () => {
    setCurrentPage(0);
    fetchPaginatedSaleOrders(0, pageSize);
  };

  useEffect(() => {
    setAllStatuses(saleOrderStatuses);
  }, []);

  useEffect(() => {
    fetchPaginatedSaleOrders(currentPage, pageSize);
  }, [currentPage, pageSize]);

  const navigate = useNavigate();
  const location = useLocation();
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");

  useEffect(() => {
    if (location.state?.successMessage) {
      console.log("Component mounted, location.state:", location.state?.successMessage);
      setAlertMessage(location.state.successMessage);
      setShowSuccessAlert(true);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const handleAddOrder = async () => {
    const code = await getNextCode();
    navigate("/user/sale-orders/add", { state: { nextCode: code } });
  };

  const handleEditOrder = async (order) => {
    navigate(`/user/sale-orders/${order.id}`, { state: { order } });
  };

  const handlePageChange = (selectedItem) => {
    setCurrentPage(selectedItem.selected);
  };

  // Lọc danh sách
  const filteredOrders = saleOrders.filter(
    (order) => {
      const matchesSearch =
        (order.orderCode &&
          order.orderCode.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (order.partnerName &&
          order.partnerName.toLowerCase().includes(searchTerm.toLowerCase()));

      // Tính nhãn hiển thị để lọc theo trạng thái
      const displayLabel = getDisplayLabel(order.status, order.purchaseRequestStatus);

      const matchesStatus =
        selectedStatuses.length === 0 ||
        selectedStatuses.includes(displayLabel);

      return matchesSearch && matchesStatus;
    }
  );

  const getStatusLabel = (status) => {
    const statusObj = saleOrderStatuses.find((s) => s.value === status);
    return statusObj?.label || status;
  };

  const columnsConfig = [
    { field: 'index', headerName: 'STT', flex: 0.5, minWidth: 50, editable: false, filterable: false },
    { field: 'orderCode', headerName: 'Mã đơn hàng', flex: 1.5, minWidth: 150, editable: false, filterable: false },
    { field: 'partnerName', headerName: 'Khách hàng', flex: 2, minWidth: 200, editable: false, filterable: false },
    {
      field: 'status',
      headerName: 'Trạng thái',
      flex: 1.5,
      minWidth: 150,
      editable: false,
      filterable: false,
      renderCell: (params) => {
        const statusObj = saleOrderStatuses.find((s) => s.label === params.row.status) || 
          { className: "bg-gray-100 text-gray-800", label: params.row.status };
        return (
          <div
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium 
                        ${statusObj.className}`}
          >
            {params.row.status}
          </div>
        );
      },
    },    
    {
      field: 'orderDate',
      headerName: 'Ngày đặt hàng',
      flex: 1.5,
      minWidth: 150,
      editable: false,
      filterable: false,
      renderCell: (params) => params.value ? dayjs(params.value).format("DD/MM/YYYY") : "N/A",
    },
    {
      field: 'actions',
      headerName: 'Hành động',
      flex: 0.5,
      minWidth: 100,
      editable: false,
      filterable: false,
      renderCell: (params) => (
        <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
          <Tooltip content="Xem chi tiết">
            <IconButton
              size="small"
              color="primary"
              onClick={() => handleEditOrder(params.row)}
            >
              <VisibilityOutlined />
            </IconButton>
          </Tooltip>
        </div>
      ),
    },
  ];

  const data = filteredOrders.map((order, index) => ({
    id: order.orderId,
    index: currentPage * pageSize + index + 1,
    orderCode: order.orderCode || "N/A",
    partnerName: order.partnerName || "N/A",
    status: getDisplayLabel(order.status, order.purchaseRequestStatus), // Dùng nhãn do FE tính toán
    orderDate: order.orderDate,
  }));

  return (
    <div className="mb-8 flex flex-col gap-12" style={{ height: 'calc(100vh-100px)' }}>
      <Card className="bg-gray-50 p-7 rounded-none shadow-none">
        <CardBody className="pb-2 bg-white rounded-xl">
          <PageHeader
            title="Danh sách đơn đặt hàng bán"
            addButtonLabel="Thêm đơn hàng"
            onAdd={() => handleAddOrder(true)}
            onImport={() => {/* Xử lý import nếu có */ }}
            onExport={() => {/* Xử lý export file ở đây nếu có */ }}
            showImport={false}
            showExport={false}
          />
          <div className="py-2 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Typography variant="small" color="blue-gray" className="font-light">
                Hiển thị
              </Typography>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(0);
                }}
                className="border text-sm rounded px-2 py-1"
              >
                {[5, 10, 20, 50].map(size => (
                  <option key={size} value={size}>{size}</option>
                ))}
              </select>
              <Typography variant="small" color="blue-gray" className="font-normal">
                bản ghi mỗi trang
              </Typography>
            </div>

            <div className="mb-3 flex flex-wrap items-center gap-4">
              <DateFilterButton
                startDate={startDate}
                endDate={endDate}
                setStartDate={setStartDate}
                setEndDate={setEndDate}
                setCurrentPage={setCurrentPage}
              />
              <StatusFilterButton
                anchorEl={statusAnchorEl}
                setAnchorEl={setStatusAnchorEl}
                selectedStatuses={selectedStatuses}
                setSelectedStatuses={setSelectedStatuses}
                allStatuses={allStatuses}
                buttonLabel="Trạng thái"
              />
              <div className="w-[250px]">
                <TableSearch
                  value={searchTerm}
                  onChange={setSearchTerm}
                  onSearch={handleSearch}
                  placeholder="Tìm kiếm đơn hàng"
                />
              </div>
            </div>
          </div>

          <Table
            data={data}
            columnsConfig={columnsConfig}
            enableSelection={false}
          />

          <div className="flex items-center justify-between border-t border-blue-gray-50 py-4">
            <Typography variant="small" color="blue-gray" className="font-normal">
              Trang {currentPage + 1} / {totalPages} • {totalElements} bản ghi
            </Typography>
            <ReactPaginate
              previousLabel={<ArrowLeftIcon strokeWidth={2} className="h-4 w-4" />}
              nextLabel={<ArrowRightIcon strokeWidth={2} className="h-4 w-4" />}
              breakLabel="..."
              pageCount={totalPages}
              marginPagesDisplayed={2}
              pageRangeDisplayed={5}
              onPageChange={handlePageChange}
              containerClassName="flex items-center gap-1"
              pageClassName="h-8 min-w-[32px] flex items-center justify-center rounded-md text-xs text-gray-700 border border-gray-300 hover:bg-[#0ab067] hover:text-white"
              pageLinkClassName="flex items-center justify-center w-full h-full"
              previousClassName="h-8 min-w-[32px] flex items-center justify-center rounded-md text-xs text-gray-700 border border-gray-300 hover:bg-gray-100"
              nextClassName="h-8 min-w-[32px] flex items-center justify-center rounded-md text-xs text-gray-700 border border-gray-300 hover:bg-gray-100"
              breakClassName="h-8 min-w-[32px] flex items-center justify-center rounded-md text-xs text-gray-700"
              activeClassName="bg-[#0ab067] text-white border-[#0ab067] hover:bg-[#0ab067]"
              forcePage={currentPage}
              disabledClassName="opacity-50 cursor-not-allowed"
            />
          </div>
        </CardBody>
      </Card>

      <SuccessAlert
        open={showSuccessAlert}
        onClose={() => setShowSuccessAlert(false)}
        message={alertMessage}
      />
    </div>
  );
};

export default SaleOrdersPage;