import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    Card,
    CardBody,
    Button,
    Input,
    Textarea,
    Typography,
} from "@material-tailwind/react";
import { LocalizationProvider, DatePicker } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import "dayjs/locale/vi"; // Import Tiếng Việt
import { TextField, Button as MuiButton, Divider, Autocomplete, IconButton } from '@mui/material';
import { FaArrowLeft, FaTimes } from "react-icons/fa";
import { ArrowRightIcon, ArrowLeftIcon } from "@heroicons/react/24/outline";
import {
    CheckRounded,

} from '@mui/icons-material';
import ReactPaginate from "react-paginate";
import { getPurchaseRequestById, updatePurchaseRequestStatus } from "./PurchaseRequestService";
import RejectPurchaseRequestModal from "./RejectPurchaseRequestModal";
import PageHeader from '@/components/PageHeader';
import TableSearch from '@/components/TableSearch';
import Table from '@/components/Table';
import ConfirmDialog from "@/components/ConfirmDialog";

const DetailPurchaseRequestPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [purchaseRequest, setPurchaseRequest] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [currentPage, setCurrentPage] = useState(0);
    const [pageSize, setPageSize] = useState(5);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [showApproveConfirm, setShowApproveConfirm] = useState({ open: false, message: "" });

    const statusLabels = {
        PENDING: "Chờ duyệt",
        CONFIRMED: "Đã duyệt",
        CANCELLED: "Từ chối",
        FINISHED: "Đã hoàn thành",
    };

    useEffect(() => {
        fetchPurchaseRequest();
    }, [id]);

    const fetchPurchaseRequest = async () => {
        setLoading(true);
        try {
            const data = await getPurchaseRequestById(id);
            console.log("PurchaseRequest data:", data);
            console.log("PurchaseRequest status:", data.status);
            setPurchaseRequest(data);
            console.log("State updated - purchaseRequest:", data);
        } catch (error) {
            const errorMessage = error.response?.data?.message || "Không thể tải thông tin yêu cầu mua vật tư. Vui lòng thử lại!";
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleReject = async (reason) => {
        console.log("🛑 Lý do từ chối:", reason);
        try {
            await updatePurchaseRequestStatus(id, "CANCELLED", reason);
            await fetchPurchaseRequest();
        } catch (error) {
            console.error("Lỗi từ chối yêu cầu:", error);
            alert("Không thể từ chối yêu cầu. Vui lòng thử lại.");
        }
    };

    const handleApprove = async () => {
        try {
            await updatePurchaseRequestStatus(id, "CONFIRMED");
            navigate("/user/purchase-request", { state: { successMessage: "Đã duyệt yêu cầu mua vật tư thành công!" } });
        } catch (error) {
            console.error("Lỗi duyệt yêu cầu:", error);
            alert("❌ Không thể duyệt yêu cầu. Vui lòng thử lại.");
        }
    };

    const handleCancel = () => {
        navigate("/user/purchase-request");
    };

    const getPaginatedData = () => {
        if (!purchaseRequest || !purchaseRequest.purchaseRequestDetails) return [];
        const startIndex = currentPage * pageSize;
        const endIndex = startIndex + pageSize;
        return purchaseRequest.purchaseRequestDetails.slice(startIndex, endIndex);
    };

    const handlePageChange = (selectedItem) => {
        setCurrentPage(selectedItem.selected);
    };

    if (loading) return <Typography>Đang tải...</Typography>;
    if (error) return <Typography className="text-red-500">{error}</Typography>;
    if (!purchaseRequest) return <Typography>Không tìm thấy yêu cầu mua vật tư.</Typography>;

    const columnsConfig = [
        {
            field: 'stt',
            headerName: 'STT',
            minWidth: 50,
            flex: 1,
            editable: false,
            filterable: false,
            renderCell: (params) => params.value ?? "",
        },
        {
            field: 'materialCode',
            headerName: 'Mã vật tư',
            minWidth: 150,
            flex: 1.5,
            editable: false,
            filterable: false,
        },
        {
            field: 'materialName',
            headerName: 'Tên vật tư',
            minWidth: 200,
            flex: 2,
            editable: false,
            filterable: false,
        },
        {
            field: 'partnerName',
            headerName: 'Nhà cung cấp',
            minWidth: 200,
            flex: 2,
            editable: false,
            filterable: false,
        },
        {
            field: 'unitName',
            headerName: 'Đơn vị',
            minWidth: 100,
            flex: 1,
            editable: false,
            filterable: false,
        },
        {
            field: 'quantity',
            headerName: 'Số lượng',
            minWidth: 100,
            flex: 1,
            editable: false,
            filterable: false,
        },
    ];

    const filteredData = getPaginatedData().filter((item) => {
        const matchesSearch =
            item.materialCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.materialName.toLowerCase().includes(searchTerm.toLowerCase());

        return matchesSearch;
    });

    const data = filteredData.map((item, index) => ({
        id: item.purchaseRequestDetailId,
        stt: currentPage * pageSize + index + 1,
        materialCode: item.materialCode,
        materialName: item.materialName,
        partnerName: item.partnerName,
        unitName: item.unitName,
        quantity: item.quantity,
    }));

    return (
        <div className="mb-8 flex flex-col gap-12" style={{ height: 'calc(100vh-100px)' }}>
            <Card className="bg-gray-50 p-7 rounded-none shadow-none">
                <CardBody className="pb-2 bg-white rounded-xl">
                    <PageHeader
                        title={"Chi tiết yêu cầu mua vật tư " + purchaseRequest.purchaseRequestCode + (purchaseRequest.saleOrderCode ? ` cho đơn hàng ${purchaseRequest.saleOrderCode}` : "")}
                        addButtonLabel=""
                        onAdd={() => { }}
                        onImport={() => {/* Xử lý import nếu có */ }}
                        onExport={() => {/* Xử lý export file ở đây nếu có */ }}
                        showAdd={false}
                        showImport={false} // Ẩn nút import nếu không dùng
                        showExport={false} // Ẩn xuất file nếu không dùng
                    />
                    <div className="grid grid-cols-2 gap-x-12 gap-y-4 mb-6">
                        <div className="flex flex-col gap-4">
                            <div>
                                <Typography variant="medium" className="mb-1 text-black">Mã phiếu</Typography>
                                <TextField
                                    fullWidth
                                    size="small"
                                    color="success"
                                    variant="outlined"
                                    disabled
                                    value={purchaseRequest.purchaseRequestCode || ""}
                                    sx={{
                                        '& .MuiInputBase-root.Mui-disabled': {
                                            bgcolor: '#eeeeee',
                                            '& .MuiOutlinedInput-notchedOutline': {
                                                border: 'none',
                                            },
                                        },
                                    }}
                                />
                            </div>
                            <div>
                                <Typography variant="medium" className="mb-1 text-black">
                                    Diễn giải
                                </Typography>
                                <TextField
                                    fullWidth
                                    size="small"
                                    placeholder="Diễn giải"
                                    hiddenLabel
                                    multiline
                                    rows={4}
                                    color="success"
                                    value={purchaseRequest.notes || "Không có diễn giải"}
                                    disabled
                                    sx={{
                                        '& .MuiInputBase-root.Mui-disabled': {
                                            bgcolor: '#eeeeee',
                                            '& .MuiOutlinedInput-notchedOutline': {
                                                border: 'none',
                                            },
                                        },
                                    }}
                                />
                            </div>
                        </div>
                        <div className="flex flex-col gap-4">
                            <div>
                                <Typography variant="medium" className="mb-1 text-black">
                                    Ngày lập phiếu
                                </Typography>
                                <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="vi">
                                    <style>
                                        {`.MuiPickersCalendarHeader-label { text-transform: capitalize !important; }`}
                                    </style>
                                    <DatePicker
                                        value={purchaseRequest.createdDate ? dayjs(purchaseRequest.createdDate) : null}
                                        onChange={(newValue) => {
                                            if (newValue) {
                                                setPurchaseRequest((prev) => ({
                                                    ...prev,
                                                    createdDate: newValue.format("YYYY-MM-DD"),
                                                }));
                                            }
                                        }}
                                        format="DD/MM/YYYY"
                                        disabled
                                        dayOfWeekFormatter={(weekday) => `${weekday.format("dd")}`}
                                        slotProps={{
                                            textField: {
                                                hiddenLabel: true,
                                                fullWidth: true,
                                                size: "small",
                                                color: "success",
                                            },
                                            day: {
                                                sx: () => ({
                                                    "&.Mui-selected": {
                                                        backgroundColor: "#0ab067 !important",
                                                        color: "white",
                                                    },
                                                    "&.Mui-selected:hover": {
                                                        backgroundColor: "#089456 !important",
                                                    },
                                                    "&:hover": {
                                                        backgroundColor: "#0894561A !important",
                                                    },
                                                }),
                                            },
                                        }}
                                        sx={{
                                            '& .MuiInputBase-root.Mui-disabled': {
                                                bgcolor: '#eeeeee',
                                                '& .MuiOutlinedInput-notchedOutline': {
                                                    border: 'none',
                                                },
                                            },
                                        }}
                                    />
                                </LocalizationProvider>
                            </div>
                            <div>
                                <Typography variant="medium" className="mb-1 text-black">Trạng thái</Typography>
                                <TextField
                                    fullWidth
                                    size="small"
                                    color="success"
                                    variant="outlined"
                                    disabled
                                    value={statusLabels[purchaseRequest.status] || purchaseRequest.status}
                                    sx={{
                                        '& .MuiInputBase-root.Mui-disabled': {
                                            bgcolor: '#eeeeee',
                                            '& .MuiOutlinedInput-notchedOutline': {
                                                border: 'none',
                                            },
                                        },
                                    }}
                                />
                            </div>
                            {purchaseRequest.status === "CANCELLED" && (
                                <div>
                                    <Typography variant="medium" className="mb-1 text-black">
                                        Lý do hủy
                                    </Typography>
                                    <TextField
                                        fullWidth
                                        size="small"
                                        placeholder="Lý do huỷ"
                                        hiddenLabel
                                        multiline
                                        rows={4}
                                        color="success"
                                        value={purchaseRequest.rejectionReason?.trim() ? purchaseRequest.rejectionReason : "Không có"}
                                        disabled
                                        sx={{
                                            '& .MuiInputBase-root.Mui-disabled': {
                                                bgcolor: '#eeeeee',
                                                '& .MuiOutlinedInput-notchedOutline': {
                                                    border: 'none',
                                                },
                                            },
                                        }}
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="mb-4">
                        {/* Items per page and search */}
                        <div className="py-2 flex items-center justify-between gap-2">
                            {/* Items per page */}
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

                            {/* Search input */}
                            <TableSearch
                                value={searchTerm}
                                onChange={setSearchTerm}
                                onSearch={() => {
                                    // Thêm hàm xử lý tìm kiếm vào đây nếu có
                                    console.log("Tìm kiếm:", searchTerm);
                                }}
                                placeholder="Tìm kiếm"
                            />

                        </div>
                        <Table
                            data={data}
                            columnsConfig={columnsConfig}
                            enableSelection={false}
                        />
                        {purchaseRequest.purchaseRequestDetails && purchaseRequest.purchaseRequestDetails.length > 0 && (
                            <div className="flex items-center justify-between border-t border-blue-gray-50 p-4">
                                <Typography variant="small" color="blue-gray" className="font-normal">
                                    Trang {currentPage + 1} / {Math.ceil(purchaseRequest.purchaseRequestDetails.length / pageSize)} • {purchaseRequest.purchaseRequestDetails.length} dòng
                                </Typography>
                                <ReactPaginate
                                    previousLabel={<ArrowLeftIcon strokeWidth={2} className="h-4 w-4" />}
                                    nextLabel={<ArrowRightIcon strokeWidth={2} className="h-4 w-4" />}
                                    breakLabel="..."
                                    pageCount={Math.ceil(purchaseRequest.purchaseRequestDetails.length / pageSize)}
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
                        )}
                    </div>
                    <Divider />
                    <div className="flex justify-between gap-2 my-4">
                        {console.log("Checking status for buttons:", purchaseRequest.status)}
                        <MuiButton
                            color="info"
                            size="medium"
                            variant="outlined"
                            sx={{
                                color: '#616161',
                                borderColor: '#9e9e9e',
                                '&:hover': {
                                    backgroundColor: '#f5f5f5',
                                    borderColor: '#757575',
                                },
                            }}
                            onClick={handleCancel}
                            className="flex items-center gap-2"
                        >
                            <FaArrowLeft className="h-3 w-3" /> Quay lại
                        </MuiButton>
                        {purchaseRequest.status?.toUpperCase() === "PENDING" && (
                            <div className="flex gap-3">
                                <MuiButton
                                    size="medium"
                                    variant="outlined"
                                    color="success"
                                    onClick={() => setShowApproveConfirm({
                                        open: true,
                                        message: "Bạn có chắc chắn muốn duyệt yêu cầu này không?",
                                    })}
                                >
                                    <CheckRounded className="pr-1" />
                                    Duyệt
                                </MuiButton>
                                <MuiButton
                                    size="medium"
                                    variant="outlined"
                                    color="error"
                                    onClick={() => {
                                        console.log("Nút Từ chối yêu cầu được nhấn");
                                        setShowRejectModal(true);
                                        console.log("showRejectModal sau khi set:", true);
                                    }}
                                >
                                    <FaTimes className="h-4 w-4 pr-1" />
                                    Từ chối
                                </MuiButton>
                            </div>
                        )}
                    </div>
                </CardBody>
            </Card>

            <RejectPurchaseRequestModal
                show={showRejectModal}
                handleClose={() => setShowRejectModal(false)}
                onConfirm={handleReject}
            />

            <ConfirmDialog
                open={showApproveConfirm.open}
                onClose={() => setShowApproveConfirm({
                    open: false,
                    message: "",
                })}
                onConfirm={() => {
                    setShowApproveConfirm({
                        open: false,
                        message: "",
                    });
                    handleApprove();
                }}
                message={showApproveConfirm.message}
                confirmText="Có"
                cancelText="Không"
            />
        </div>
    );
};

export default DetailPurchaseRequestPage;