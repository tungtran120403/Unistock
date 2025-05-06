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
    VisibilityOutlined,
    AddShoppingCartRounded
} from '@mui/icons-material';
import CircularProgress from '@mui/material/CircularProgress';
import ReactPaginate from "react-paginate";
import { ArrowRightIcon, ArrowLeftIcon } from "@heroicons/react/24/outline";
import dayjs from "dayjs";
import usePurchaseRequest from "./usePurchaseRequest";
import usePurchaseOrder from "../purchaseOrder/usePurchaseOrder";
import { useNavigate } from "react-router-dom";
import PageHeader from '@/components/PageHeader';
import TableSearch from '@/components/TableSearch';
import Table from "@/components/Table";
import SuccessAlert from "@/components/SuccessAlert";
import ConfirmDialog from "@/components/ConfirmDialog";
import { getPurchaseRequestById, updatePurchaseRequestStatus } from "./PurchaseRequestService";
import DateFilterButton from "@/components/DateFilterButton";
import StatusFilterButton from "@/components/StatusFilterButton";
import UnauthorizedPage from "../../../components/UnauthorizedPage";

const PurchaseRequestPage = () => {
    const {
        purchaseRequests,
        totalPages,
        totalElements,
        loading,
        fetchPurchaseRequests,
        getNextCode,
    } = usePurchaseRequest();

    const [showConfirmDialog, setShowConfirmDialog] = useState({ open: false, message: "" });
    const [selectedRequestId, setSelectedRequestId] = useState(null);
    const [showSuccessAlert, setShowSuccessAlert] = useState(false);
    const [alertMessage, setAlertMessage] = useState("");
    const [currentUser, setCurrentUser] = useState(null);
    const location = useLocation();

    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(0);
    const [pageSize, setPageSize] = useState(10);
    const { createOrdersFromRequest } = usePurchaseOrder();

    //state for filter and search
    const [selectedStatuses, setSelectedStatuses] = useState([]);
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);
    const [statusAnchorEl, setStatusAnchorEl] = useState(null);
    const [allStatuses, setAllStatuses] = useState([]);

    const navigate = useNavigate();

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
        if (currentUser && !currentUser.permissions?.includes("getAllPurchaseRequests")) {
          navigate("/unauthorized");
        }
      }, [currentUser, navigate]);

    useEffect(() => {
        fetchPurchaseRequests(
            currentPage,
            pageSize,
            searchTerm,
            selectedStatuses.map(status => status.value),
            startDate,
            endDate
        );
    }, [currentPage, pageSize, searchTerm, selectedStatuses, startDate, endDate]);

    useEffect(() => {
        setAllStatuses(purchaseRequestStatus);
    }, []);

    // if (!currentUser?.permissions?.includes("getAllPurchaseRequests")) {
    //     return <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 text-center">Heloo</div>;
    // }
    //list status for filter 
    const purchaseRequestStatus = [
        {
            value: "PENDING",
            label: "Chờ duyệt",
            className: "bg-blue-50 text-blue-800",
        },
        {
            value: "CONFIRMED",
            label: "Đã duyệt",
            className: "bg-teal-50 text-teal-800",
        },
        {
            value: "CANCELLED",
            label: "Bị huỷ",
            className: "bg-red-50 text-red-800",
        },
        {
            value: "PURCHASED",
            label: "Đã tạo đơn mua",
            className: "bg-yellow-100 text-orange-800",
        },
        {
            value: "REJECTED",
            label: "Từ chối",
            className: "bg-pink-50 text-pink-800",
        },
    ];

    const statusMapping = {
        PENDING: "bg-blue-50 text-blue-800",
        CONFIRMED: "bg-green-50 text-green-800",
        CANCELLED: "bg-red-50 text-red-800",
        PURCHASED: "bg-indigo-50 text-indigo-800",
        FINISHED: "bg-green-50 text-green-800",
    };

    const getStatusClass = (statusCode) => {
        const found = purchaseRequestStatus.find(s => s.value === statusCode);
        return found ? found.className : 'bg-yellow-100 text-amber-800';
    };

    const mapLabelToStatusCode = (label) => {
        const found = purchaseRequestStatus.find(s => s.label === label);
        return found ? found.value : label;
    };

    // const filteredRequests = purchaseRequests.filter((request) => {
    //     const matchesStatus =
    //         selectedStatuses.length === 0 ||
    //         selectedStatuses.includes(request.status);

    //     const matchesSearch =
    //         request.purchaseRequestCode?.toLowerCase().includes(searchTerm.toLowerCase());

    //     return matchesStatus && matchesSearch;
    // });

    const getStatusLabel = (statusCode) => {
        const found = purchaseRequestStatus.find(s => s.value === statusCode);
        return found ? found.label : statusCode;
    };

    const handlePageChange = (selectedItem) => {
        setCurrentPage(selectedItem.selected);
    };

    const handleAddRequest = async () => {
        try {
            const code = await getNextCode();
            navigate("/user/purchase-request/add", { state: { nextCode: code } });
        } catch (error) {
            console.error("Lỗi khi lấy mã tiếp theo:", error);
            console.log("Có lỗi xảy ra khi tạo mã yêu cầu mới");
        }
    };

    const handleSearch = () => {
        fetchPurchaseRequests(0, pageSize, searchTerm, selectedStatuses.map(mapLabelToStatusCode), startDate, endDate);
        setCurrentPage(0);
    };

    const handleConfirmCreatePurchaseOrder = (requestId) => {
        setSelectedRequestId(requestId);
        setShowConfirmDialog({
            open: true,
            message: "Bạn có chắc chắn muốn tạo đơn hàng mua vật tư từ yêu cầu này không?",
        });
    };

    const handleCreatePurchaseOrder = async () => {
        if (!selectedRequestId) return;
        try {
            const selectedRequest = await getPurchaseRequestById(selectedRequestId);
            console.log("📦 Chi tiết yêu cầu mua vật tư:", selectedRequest);
            if (!selectedRequest || !selectedRequest.purchaseRequestDetails) {
                throw new Error("Yêu cầu mua không có vật tư nào");
            }

            const payload = {
                purchaseRequestId: selectedRequest.purchaseRequestId,
                items: selectedRequest.purchaseRequestDetails.map((item) => ({
                    materialId: item.materialId,
                    materialCode: item.materialCode,
                    materialName: item.materialName,
                    supplierId: item.partnerId,
                    supplierName: item.partnerName,
                    unit: item.unitName,
                    quantity: item.quantity,
                })),
            };

            const response = await createOrdersFromRequest(payload);
            navigate("/user/purchaseOrder", { state: { successMessage: `Tạo ${response.orders.length} đơn hàng mua vật tư thành công!` } });
        } catch (error) {
            console.error("Lỗi tạo đơn hàng:", error);
            console.log("Không thể tạo đơn mua hàng. Vui lòng thử lại.");
            setShowConfirmDialog({
                open: false,
                message: "",
            });
        }
    };

    const columnsConfig = [
        { field: 'index', headerName: 'STT', flex: 0.5, minWidth: 50, editable: false, filterable: false },
        { field: 'purchaseRequestCode', headerName: 'Mã yêu cầu', flex: 1.5, minWidth: 150, editable: false, filterable: false },
        { field: 'purchaseOrderCode', headerName: 'Mã đơn hàng', flex: 1.5, minWidth: 150, editable: false, filterable: false, renderCell: (params) => params.value || "-" },
        {
            field: 'createdDate',
            headerName: 'Ngày tạo yêu cầu',
            flex: 1.5,
            minWidth: 150,
            editable: false,
            filterable: false,
            renderCell: (params) => dayjs(params.value).format("DD/MM/YYYY"),
        },
        {
            field: 'status',
            headerName: 'Trạng thái',
            flex: 1.5,
            minWidth: 200,
            editable: false,
            filterable: false,
            renderCell: (params) => (
                <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                    ${getStatusClass(params.row.statusCode)}`}
                >
                    {params.row.status}
                </div>
            )
        },
        {
            field: 'rejectionReason',
            headerName: 'Lý do từ chối',
            flex: 2,
            minWidth: 220,
            editable: false,
            filterable: false,
            renderCell: (params) => {
                if (params.row.status !== 'CANCELLED') return '';
                if (!params.value) return 'Không có';
                return params.value.startsWith('Khác') ? 'Khác' : params.value;
            },
        },
        {
            field: 'actions',
            headerName: 'Hành động',
            flex: 0.5,
            minWidth: 50,
            filterable: false,
            editable: false,
            renderCell: (params) => (
                <div className="flex gap-2 justify-center items-center w-full">
                    <Tooltip content="Xem chi tiết">
                        <IconButton
                            size="small"
                            color="primary"
                            onClick={() => navigate(`/user/purchase-request/${params.id}`)}
                        >
                            <VisibilityOutlined />
                        </IconButton>
                    </Tooltip>

                    {/* Nút tạo đơn hàng nếu đã duyệt và có quyền createMultipleOrders */}
                    {currentUser && params.row.status === 'Đã duyệt' && currentUser.permissions.includes("createMultipleOrders") && (
                        <Tooltip content="Tạo đơn mua hàng">
                            <IconButton
                                size="small"
                                color="success"
                                onClick={() => handleConfirmCreatePurchaseOrder(params.row.id)}
                            >
                                <AddShoppingCartRounded />
                            </IconButton>
                        </Tooltip>
                    )}
                </div>
            ),
        },
    ];

    const data = purchaseRequests.map((request, index) => ({
        id: request.purchaseRequestId,
        index: (currentPage * pageSize) + index + 1,
        purchaseRequestCode: request.purchaseRequestCode,
        purchaseOrderCode: request.saleOrderCode || "-",
        createdDate: request.createdDate,
        status: getStatusLabel(request.status),
        statusCode: request.status,
        rejectionReason: request.rejectionReason,
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
                        title="Danh sách yêu cầu mua vật tư"
                        onAdd={handleAddRequest}
                        addButtonLabel="Thêm yêu cầu"
                        showAdd={currentUser && currentUser.permissions.includes("createManualPurchaseRequest")}
                        showImport={false}
                        showExport={false}
                    />
                    <div className="py-2 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                            <Typography variant="small" color="blue-gray" className="font-normal whitespace-nowrap">
                                Hiển thị
                            </Typography>
                            <select
                                value={pageSize}
                                onChange={(e) => {
                                    setPageSize(Number(e.target.value));
                                    setCurrentPage(0);
                                }}
                                className="border rounded px-2 py-1"
                            >
                                {[10, 20, 50].map((size) => (
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
                                    placeholder="Tìm kiếm yêu cầu mua vật tư..."
                                />
                            </div>

                        </div>
                    </div>

                    <Table
                        data={data}
                        columnsConfig={columnsConfig}
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

            <ConfirmDialog
                open={showConfirmDialog.open}
                onClose={() => setShowConfirmDialog({
                    open: false,
                    message: "",
                })}
                onConfirm={handleCreatePurchaseOrder}
                message={showConfirmDialog.message}
                confirmText="Có"
                cancelText="Không"
            />
        </div>
    );
};

export default PurchaseRequestPage;