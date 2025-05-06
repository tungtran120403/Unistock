import React, { useState, useEffect } from "react";
import { InboxArrowDownIcon } from "@heroicons/react/24/solid";
import Table from "@/components/Table";
import { useNavigate, useLocation } from "react-router-dom";
import ReactPaginate from "react-paginate";
import { ArrowLeftIcon, ArrowRightIcon } from "@heroicons/react/24/outline";
import {
  IconButton,
} from '@mui/material';
import {
  VisibilityOutlined,
} from '@mui/icons-material';
import PageHeader from '@/components/PageHeader';
import TableSearch from '@/components/TableSearch';
import SuccessAlert from "@/components/SuccessAlert";
import { Cancel as CancelIcon } from '@mui/icons-material';
import {
  Card,
  CardBody,
  Typography,
  Tooltip,
} from "@material-tailwind/react";
import usePurchaseOrder from "./usePurchaseOrder";
import CircularProgress from '@mui/material/CircularProgress';
import { getNextCode } from "../receiptNote/receiptNoteService";
import { getPurchaseRequestById, getSaleOrderByPurchaseOrderId } from "./purchaseOrderService";
import DateFilterButton from "@/components/DateFilterButton";
import StatusFilterButton from "@/components/StatusFilterButton";

const PurchaseOrderPage = () => {
  const navigate = useNavigate();
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const location = useLocation();
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    // Lấy thông tin user từ localStorage
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        setCurrentUser(JSON.parse(storedUser));
      } catch (err) {
        console.error("Lỗi parse JSON từ localStorage:", err);
      }
    }

    if (location.state?.successMessage) {
      console.log("Component mounted, location.state:", location.state?.successMessage);
      setAlertMessage(location.state.successMessage);
      setShowSuccessAlert(true);
      // Xóa state để không hiển thị lại nếu người dùng refresh
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  useEffect(() => {
    if (currentUser && !currentUser.permissions?.includes("getAllOrdersFiltered")) {
      navigate("/unauthorized");
    }
  }, [currentUser, navigate]);

  //state for filter and search 
  const [selectedStatuses, setSelectedStatuses] = useState([]);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [statusAnchorEl, setStatusAnchorEl] = useState(null);
  const [allStatuses, setAllStatuses] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  const {
    purchaseOrders,
    fetchPaginatedOrders,
    totalPages,
    totalElements,
    loading,
    error
  } = usePurchaseOrder();


  const handleCreateReceipt = async (order) => {
    try {
      const nextCode = await getNextCode(); // Gọi API lấy mã phiếu nhập tiếp theo

      // Make sure we're using the correct order ID property based on your data structure
      const orderId = order.id; // This matches the id from the row data
      let saleOrderCode = null;

      try {
        const saleOrder = await getSaleOrderByPurchaseOrderId(orderId);
        saleOrderCode = saleOrder?.orderCode || null;
      } catch (err) {
        console.warn("Không tìm thấy đơn bán liên kết:", err);
      }

      navigate(`/user/receiptNote/add`, {
        state: {
          orderId: orderId,
          nextCode: nextCode,
          saleOrderCode,
          category: "Vật tư mua bán"
        }
      });
    } catch (error) {
      console.error("Lỗi khi lấy mã phiếu nhập:", error);
    }
  };

  // State for search, filtering and sorting
  const [searchKeyword, setSearchKeyword] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [sortColumn, setSortColumn] = useState(null);
  const [sortDirection, setSortDirection] = useState("asc");
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [selectedOrders, setSelectedOrders] = useState([]);

  useEffect(() => {
    const selected = selectedStatuses.length > 0 ? selectedStatuses[0].value : "";
    fetchPaginatedOrders(currentPage, pageSize, searchTerm, selected, startDate, endDate, true);  // showLoading = true
  }, [currentPage, pageSize]);

  useEffect(() => {
    setCurrentPage(0); // Reset về page 0
    const selected = selectedStatuses.length > 0 ? selectedStatuses[0].value : "";
    fetchPaginatedOrders(0, pageSize, searchTerm, selected, startDate, endDate, false);  // showLoading = false
  }, [searchTerm, selectedStatuses, startDate, endDate]);

  // Sorting handler
  const handleSort = (column) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  // Filter orders client-side
  const filteredOrders = purchaseOrders
    .filter((order) => {
      const matchesSearch = Object.values(order).some((value) =>
        value && value.toString().toLowerCase().includes(searchKeyword.toLowerCase())
      );

      const matchesStatus =
        selectedStatuses.length === 0 || selectedStatuses.includes(order.status);

      return matchesSearch && matchesStatus;
    }

    )
    .sort((a, b) => {
      if (!sortColumn) return 0;
      let valueA = a[sortColumn];
      let valueB = b[sortColumn];

      if (sortColumn === "orderDate") {
        valueA = new Date(a.orderDate);
        valueB = new Date(b.orderDate);
      }

      if (valueA === undefined || valueB === undefined) return 0;

      if (sortDirection === "asc") {
        return valueA > valueB ? 1 : -1;
      } else {
        return valueA < valueB ? 1 : -1;
      }
    });

  const purchaseOrderStatus = [
    {
      value: "PENDING",
      label: "Chờ nhận",
      className: "bg-blue-50 text-blue-800",
    },
    {
      value: "IN_PROGRESS",
      label: "Đã nhập một phần",
      className: "bg-yellow-100 text-orange-800",
    },
    {
      value: "COMPLETED",
      label: "Đã hoàn thành",
      className: "bg-green-50 text-green-800",
    },
    {
      value: "CANCELLED",
      label: "Đã hủy",
      className: "bg-red-50 text-red-800",
    },
  ];

  useEffect(() => {
    setAllStatuses(purchaseOrderStatus);
  }, []);

  const getStatusLabel = (statusCode) => {
    const status = purchaseOrderStatus.find(s => s.value === statusCode);
    return status ? status.label : statusCode;
  };



  const getStatusClass = (statusCode) => {
    switch (statusCode) {
      case "COMPLETED":
        return "bg-green-50 text-green-800";
      case "IN_PROGRESS":
        return "bg-yellow-100 text-orange-800";
      case "PENDING":
        return "bg-blue-50 text-blue-800";
      case "CANCELLED":
        return "bg-red-50 text-red-800";
      default:
        return "bg-gray-50 text-gray-800";
    }
  };

  const handlePageChange = (selectedItem) => {
    setCurrentPage(selectedItem.selected);
  };

  const handlePageSizeChange = (size) => {
    setPageSize(size);
    setCurrentPage(0); // Reset to first page when changing page size
  };

  const toggleSelectOrder = (id) => {
    setSelectedOrders((prev) =>
      prev.includes(id) ? prev.filter((orderId) => orderId !== id) : [...prev, id]
    );
  };

  const printOrders = () => {
    console.log(`In các đơn hàng: ${selectedOrders.join(", ")}`);
  };

  // View order details
  const viewOrderDetail = (orderId) => {
    if (!orderId) {
      console.error("Lỗi: orderId không hợp lệ!");
      return;
    }
    console.log(`🔍 Điều hướng đến chi tiết đơn hàng: /user/purchaseOrder/${orderId}`);
    navigate(`/user/purchaseOrder/${orderId}`);
  };

  const [receiptCode, setReceiptCode] = useState("");
  const navigator = useNavigate();

  const handleSearch = () => {
    const selected = selectedStatuses.length > 0 ? selectedStatuses[0].value : "";
    fetchPaginatedOrders(0, pageSize, searchTerm, selected, startDate, endDate, false);  
    setCurrentPage(0);
  };  

  const handleCancelOrder = async (order) => {
    if (order.purchaseRequestId) {
      try {
        // Gọi API kiểm tra yêu cầu mua liên kết
        const request = await getPurchaseRequestById(order.purchaseRequestId);
        if (request.status !== "CANCELLED") {
          console.log("Không thể hủy đơn mua hàng khi yêu cầu mua vật tư liên kết chưa bị hủy.");
          return;
        }
      } catch (error) {
        console.error("Lỗi khi kiểm tra yêu cầu mua:", error);
        console.log("Lỗi khi kiểm tra yêu cầu mua.");
        return;
      }
    }

    // Nếu thỏa mãn điều kiện thì gọi API hủy đơn
    if (window.confirm("Bạn có chắc chắn muốn hủy đơn mua hàng này không?")) {
      try {
        await updatePurchaseOrderStatus(order.id, "CANCELED");
        console.log("Đã hủy đơn mua hàng thành công.");
        fetchPaginatedOrders(currentPage, pageSize, searchTerm, selectedStatuses[0]?.value, startDate, endDate);
      } catch (error) {
        console.error("Lỗi khi hủy đơn mua hàng:", error);
        console.log("Hủy đơn mua hàng thất bại.");
      }
    }
  };


  useEffect(() => {
    // Check if location.state exists and has nextCode
    console.log("navigator state:", navigator.state);
    if (navigator.state?.nextCode) {
      setReceiptCode(navigator.state.nextCode);
    } else {
      // If not, get the next code from the API
      getNextCode().then(setReceiptCode).catch(console.error);
    }
  }, [location]);

  const columnsConfig = [
    { field: 'index', headerName: 'STT', flex: 1, minWidth: 80, editable: false, filterable: false },
    { field: 'poCode', headerName: 'Mã đơn', flex: 1.5, minWidth: 150, editable: false, filterable: false },
    { field: 'supplierName', headerName: 'Nhà cung cấp', flex: 2, minWidth: 200, editable: false, filterable: false },
    { field: 'supplierContactName', headerName: 'Người liên hệ', flex: 1.5, minWidth: 150, editable: false, filterable: false },
    { field: 'supplierPhone', headerName: 'Số điện thoại', flex: 1.5, minWidth: 150, editable: false, filterable: false },
    {
      field: 'orderDate',
      headerName: 'Ngày tạo đơn',
      flex: 1.5,
      minWidth: 150,
      editable: false,
      filterable: false,
      renderCell: (params) => new Date(params.value).toLocaleDateString("vi-VN"),
    },
    {
      field: "status",
      headerName: "Trạng thái",
      flex: 1.5,
      minWidth: 150,
      editable: false,
      filterable: false,
      renderCell: (params) => {
        const label = getStatusLabel(params.value);
        const className = getStatusClass(params.value);
        return (
          <div
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${className}`}
          >
            {label}
          </div>
        );
      },
    },
    {
      field: 'purchaseRequestCode',
      headerName: 'Yêu cầu mua',
      flex: 1.5,
      minWidth: 150,
      editable: false,
      filterable: false,
      renderCell: (params) => {
        const { purchaseRequestCode, purchaseRequestId } = params.row;
        if (purchaseRequestCode && purchaseRequestId) {
          return (
            <button
              className="text-blue-600 hover:text-blue-800 no-underline"
              onClick={() => navigate(`/user/purchase-request/${purchaseRequestId}`)}
            >
              {purchaseRequestCode}
            </button>
          );
        }
        return "Không có";
      }
    },
    {
      field: 'actions',
      headerName: 'Hành động',
      flex: 0.5,
      minWidth: 100,
      filterable: false,
      editable: false,
      renderCell: (params) => (
        <div className="flex space-x-2">
          {/* Nút Xem Chi Tiết */}
          <Tooltip content="Xem chi tiết">
            <IconButton
              size="small"
              color="primary"
              onClick={() => viewOrderDetail(params.row.id)}
            >
              <VisibilityOutlined />
            </IconButton>
          </Tooltip>

          {/* Nút Nhập kho */}
          {/* {params.row.status !== "COMPLETED" && (
            <Tooltip content="Nhập kho">
              <IconButton
                size="small"
                color="success"
                onClick={() => handleCreateReceipt(params.row)}
              >
                <InboxArrowDownIcon className="h-6 w-6" />
              </IconButton>
            </Tooltip>
          )} */}
        </div>
      ),
    },
  ];

  const data = purchaseOrders.map((order, index) => ({
    id: order.poId,
    index: currentPage * pageSize + index + 1,
    poCode: order.poCode,
    purchaseRequestId: order.purchaseRequestId,
    purchaseRequestCode: order.purchaseRequestCode,
    supplierName: order.supplierName || "không có thông tin",
    supplierContactName: order.supplierContactName || "không có thông tin",
    supplierPhone: order.supplierPhone || "không có thông tin",
    orderDate: order.orderDate,
    status: order.status,
  }));

  const [dotCount, setDotCount] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setDotCount((prev) => (prev < 3 ? prev + 1 : 0));
    }, 500);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center" style={{ height: '60vh' }}>
        <div className="flex flex-col items-center">
          <CircularProgress size={50} thickness={4} sx={{ mb: 2, color: '#0ab067' }} />
          <Typography variant="body1">
            Đang tải{'.'.repeat(dotCount)}
          </Typography>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-8 flex flex-col gap-12">
      <Card className="bg-gray-50 p-7 rounded-none shadow-none">
        <CardBody className="pb-2 bg-white rounded-xl">
          <PageHeader
            title="Danh sách đơn mua hàng"
            onExport={printOrders}
            showAdd={false}
            showImport={false}
            showExport={false}
          />
          {error && <Typography className="text-center text-red-500 py-4">{error}</Typography>}

          {/* Pagination controls */}
          <div className="py-2 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Typography variant="small" color="blue-gray" className="font-normal whitespace-nowrap">
                Hiển thị
              </Typography>
              <select
                value={pageSize}
                onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                className="border rounded px-2 py-1"
              >
                {[5, 10, 20, 50].map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
              <Typography variant="small" color="blue-gray" className="font-normal whitespace-nowrap">
                bản ghi mỗi trang
              </Typography>
            </div>

            <div className="mb-3 flex flex-wrap items-center gap-4">
              {/* Filter by date */}
              <DateFilterButton
                startDate={startDate}
                endDate={endDate}
                setStartDate={setStartDate}
                setEndDate={setEndDate}
                setCurrentPage={setCurrentPage}
              />

              {/* Filter by status */}
              <StatusFilterButton
                anchorEl={statusAnchorEl}
                setAnchorEl={setStatusAnchorEl}
                selectedStatuses={selectedStatuses}
                setSelectedStatuses={setSelectedStatuses}
                allStatuses={allStatuses}
                buttonLabel="Trạng thái"
              />

              {/* Search input */}
              <div className="w-[250px]">
                <TableSearch
                  value={searchTerm}
                  onChange={setSearchTerm}
                  onSearch={handleSearch}
                  placeholder="Tìm kiếm đơn mua..."
                />
              </div>

            </div>
          </div>

          {/* Data table */}
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

export default PurchaseOrderPage;