import React, { useEffect, useState } from "react";
import useProductType from "./useProductType";
import CreateProductTypeModal from "./CreateProductTypeModal";
import EditProductTypeModal from "./EditProductTypeModal";
import { useNavigate, useLocation } from "react-router-dom";
import {
    Card,
    CardBody,
    Typography,
    Switch,
} from "@material-tailwind/react";
import { IconButton } from "@mui/material";
import ModeEditOutlineOutlinedIcon from '@mui/icons-material/ModeEditOutlineOutlined';
import { ArrowRightIcon, ArrowLeftIcon } from "@heroicons/react/24/outline";
import ReactPaginate from "react-paginate";
import PageHeader from '@/components/PageHeader';
import Table from "@/components/Table";
import ConfirmDialog from "@/components/ConfirmDialog";
import SuccessAlert from "@/components/SuccessAlert";
import StatusFilterButton from "@/components/StatusFilterButton";
import TableSearch from '@/components/TableSearch';
import CircularProgress from '@mui/material/CircularProgress';

const ProductTypePage = () => {
    const {
        productTypes,
        fetchProductTypes,
        toggleStatus,
        createProductType,
        updateProductType,
        totalPages,
        totalElements,
        loading,
        applyFilters  // Added missing applyFilters from the hook
    } = useProductType();

    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditPopup, setShowEditPopup] = useState(false);
    const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
    const [successAlertOpen, setSuccessAlertOpen] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");
    const [pendingToggleRow, setPendingToggleRow] = useState(null);
    const [editProductType, setEditProductType] = useState(null);
    const [currentPage, setCurrentPage] = useState(0);
    const [pageSize, setPageSize] = useState(10);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedStatuses, setSelectedStatuses] = useState([]);
    const [statusAnchorEl, setStatusAnchorEl] = useState(null);
const navigate = useNavigate();
const [currentUser, setCurrentUser] = useState(null);
  const location = useLocation();

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
          if (currentUser && !currentUser.permissions?.includes("getAllProductTypes")) {
            navigate("/unauthorized");
          }
        }, [currentUser, navigate]);

    const handlePageChange = (selectedItem) => {
        setCurrentPage(selectedItem.selected);
    };

    const handlePageSizeChange = (e) => {
        setPageSize(Number(e.target.value));
        setCurrentPage(0);
    };

    const handleCreateSuccess = async (formData) => {
        try {
            await createProductType(formData);
            setShowCreateModal(false);
            setSuccessMessage("Tạo dòng sản phẩm thành công!");
            setSuccessAlertOpen(true);
            fetchProductTypes(currentPage, pageSize, buildFilters());
        } catch (error) {
            console.log(error.message || "Lỗi khi tạo dòng sản phẩm");
        }
    };

    const handleEditSuccess = async (formData) => {
        try {
            const typeId = editProductType.typeId || editProductType.id;
            if (!typeId) {
                throw new Error("Không tìm thấy ID của dòng sản phẩm!");
            }
            await updateProductType(typeId, formData);
            setShowEditPopup(false);
            setSuccessMessage("Cập nhật dòng sản phẩm thành công!");
            setSuccessAlertOpen(true);
            fetchProductTypes(currentPage, pageSize, buildFilters());
        } catch (error) {
            console.log(error.message || "Lỗi khi cập nhật dòng sản phẩm");
        }
    };

    const allStatuses = [
        {
            value: true,
            label: "Đang hoạt động",
            className: "bg-green-50 text-green-800",
        },
        {
            value: false,
            label: "Ngừng hoạt động",
            className: "bg-red-50 text-red-800",
        },
    ];

    const buildFilters = () => ({
        search: searchTerm || undefined,
        statuses: selectedStatuses.length
            ? selectedStatuses.map(s => s.value)
            : undefined,
    });

    const handleSearch = () => {
        applyFilters(buildFilters(), 0, pageSize, false);  // Không loading
    };
    

    // useEffect cho phân trang
    useEffect(() => {
        applyFilters(buildFilters(), currentPage, pageSize, true);  // 👉 Lần đầu hoặc đổi page thì loading
    }, [currentPage, pageSize]);

    useEffect(() => {
        const delayDebounce = setTimeout(() => {
            applyFilters(buildFilters(), 0, pageSize, false);  // 👉 Filter thì KHÔNG loading
            setCurrentPage(0);
        }, 500);
        return () => clearTimeout(delayDebounce);
    }, [searchTerm, selectedStatuses, pageSize]);    

    const columnsConfig = [
        { field: 'index', headerName: 'STT', flex: 0.5, minWidth: 50 },
        { field: 'typeName', headerName: 'Tên dòng sản phẩm', flex: 2, minWidth: 300 },
        {
            field: 'description',
            headerName: 'Mô tả',
            flex: 2,
            minWidth: 400,
            renderCell: (params) => params.value || "-",
        },
        {
            field: 'status',
            headerName: 'Trạng thái',
            flex: 1,
            minWidth: 200,
            renderCell: (params) => (
                <div className="flex items-center gap-2">
                    <Switch
                        color="green"
                        checked={params.value}
                        onChange={() => {
                            setPendingToggleRow(params.row);
                            setConfirmDialogOpen(true);
                        }}
                        disabled={loading}
                    />
                    <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium 
                      ${params.value ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`}>
                        {params.value ? "Đang hoạt động" : "Ngừng hoạt động"}
                    </div>
                </div>
            ),
        },
        {
            field: 'actions',
            headerName: 'Hành động',
            flex: 0.5,
            minWidth: 100,
            renderCell: (params) => (
                <div className="flex justify-center w-full">
                    <IconButton
                        size="small"
                        onClick={() => {
                            const productTypeWithCorrectId = {
                                ...params.row,
                                typeId: params.row.id
                            };
                            setEditProductType(productTypeWithCorrectId);
                            setShowEditPopup(true);
                        }}
                        color="primary"
                    >
                        <ModeEditOutlineOutlinedIcon />
                    </IconButton>
                </div>
            ),
        },
    ];

    const data = productTypes.map((type, index) => ({
        id: type.typeId,
        index: (currentPage * pageSize) + index + 1,
        typeName: type.typeName,
        description: type.description,
        status: type.status,
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
                        title="Danh sách dòng sản phẩm"
                        onAdd={() => {
                            setShowCreateModal(true);
                        }}
                        addButtonLabel="Thêm dòng sản phẩm"
                        showImport={false}
                        showExport={false}
                    />
                    <div className="px-4 py-2 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Typography variant="small" className="font-normal whitespace-nowrap">
                                Hiển thị
                            </Typography>
                            <select
                                value={pageSize}
                                onChange={handlePageSizeChange}
                                className="border rounded px-2 py-1"
                            >
                                {[5, 10, 20, 50].map(size => (
                                    <option key={size} value={size}>{size}</option>
                                ))}
                            </select>
                            <Typography variant="small" className="font-normal whitespace-nowrap">
                                bản ghi mỗi trang
                            </Typography>
                        </div>
                        <div className="mb-3 flex flex-wrap items-center gap-4">
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
                                    placeholder="Tìm kiếm sản phẩm"
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
                        <Typography variant="small" className="font-normal" color="blue-gray">
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

            <CreateProductTypeModal
                show={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                loading={loading}
                onSuccess={handleCreateSuccess}
            />

            {showEditPopup && editProductType && (
                <EditProductTypeModal
                    productType={editProductType}
                    onClose={() => setShowEditPopup(false)}
                    onSuccess={handleEditSuccess}
                />
            )}

            <ConfirmDialog
                open={confirmDialogOpen}
                onClose={() => setConfirmDialogOpen(false)}
                onConfirm={() => {
                    if (pendingToggleRow) {
                        toggleStatus(pendingToggleRow.id, pendingToggleRow.status, currentPage, pageSize);
                        setSuccessMessage("Cập nhật trạng thái thành công!");
                        setSuccessAlertOpen(true);
                    }
                    setConfirmDialogOpen(false);
                }}
                message={`Bạn có chắc chắn muốn ${pendingToggleRow?.status ? "ngưng hoạt động" : "kích hoạt lại"} dòng sản phẩm này không?`}
                confirmText="Có"
                cancelText="Không"
            />

            <SuccessAlert
                open={successAlertOpen}
                onClose={() => setSuccessAlertOpen(false)}
                message={successMessage}
            />
        </div>
    );
};

export default ProductTypePage;