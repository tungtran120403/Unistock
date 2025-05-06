import React, { useEffect, useState } from "react";
import useMaterialType from "./useMaterialType";
import CreateMaterialTypeModal from "./CreateMaterialTypeModal";
import EditMaterialTypeModal from "./EditMaterialTypeModal";
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
import { useNavigate, useLocation } from "react-router-dom";

const MaterialTypePage = () => {
    const { materialTypes, fetchMaterialTypes, toggleStatus, createMaterialType, updateMaterialType, totalPages, applyFilters, totalElements, loading } = useMaterialType();
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
    const [successAlertOpen, setSuccessAlertOpen] = useState(false);
    const [errorAlertOpen, setErrorAlertOpen] = useState(false);
    const [alertMessage, setAlertMessage] = useState("");
    const [pendingToggleRow, setPendingToggleRow] = useState(null);
    const [editMaterialType, setEditMaterialType] = useState(null);
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
              if (currentUser && !currentUser.permissions?.includes("getAllMaterialTypes")) {
                navigate("/unauthorized");
              }
            }, [currentUser, navigate]);
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

    useEffect(() => {
        const filters = buildFilters();
        applyFilters(filters, currentPage, pageSize);
    }, [currentPage, pageSize, searchTerm, selectedStatuses]);

    const buildFilters = () => ({
        search: searchTerm || undefined,
        statuses: selectedStatuses.length
            ? selectedStatuses.map(s => s.value)
            : undefined,
    });

    const handleSearch = () => {
        applyFilters(buildFilters(), currentPage, pageSize);
    };

    const handlePageChange = (selectedItem) => {
        setCurrentPage(selectedItem.selected);
    };

    const handlePageSizeChange = (e) => {
        setPageSize(Number(e.target.value));
        setCurrentPage(0);
    };

    const handleCreateSuccess = async (formData) => {
        try {
            await createMaterialType(formData);
            setShowCreateModal(false);
            fetchMaterialTypes(currentPage, pageSize);
            setAlertMessage("Tạo danh mục vật tư thành công!");
            setSuccessAlertOpen(true);
        } catch (error) {
            setAlertMessage(error.message || "Lỗi khi tạo danh mục vật tư");
            setErrorAlertOpen(true);
        }
    };

    const handleUpdateSuccess = async (materialTypeId, formData) => {
        try {
            await updateMaterialType(materialTypeId, formData);
            setShowEditModal(false);
            fetchMaterialTypes(currentPage, pageSize);
            setAlertMessage("Cập nhật danh mục vật tư thành công!");
            setSuccessAlertOpen(true);
        } catch (error) {
            setAlertMessage(error.message || "Lỗi khi cập nhật danh mục vật tư");
            setErrorAlertOpen(true);
        }
    };

    const columnsConfig = [
        { field: 'index', headerName: 'STT', flex: 0.5, minWidth: 50 },
        { field: 'name', headerName: 'Tên danh mục vật tư', flex: 2, minWidth: 300 },
        {
            field: 'description',
            headerName: 'Mô tả',
            flex: 2,
            minWidth: 400,
            renderCell: (params) => params.value || "Chưa có mô tả",
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
                            setEditMaterialType(params.row);
                            setShowEditModal(true);
                        }}
                        color="primary"
                    >
                        <ModeEditOutlineOutlinedIcon />
                    </IconButton>
                </div>
            ),
        },
    ];

    const data = materialTypes.map((type, index) => ({
        id: type.materialTypeId,
        materialTypeId: type.materialTypeId,  
        index: (currentPage * pageSize) + index + 1,
        name: type.name,
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
                        title="Danh sách danh mục vật tư"
                        onAdd={() => setShowCreateModal(true)}
                        addButtonLabel="Thêm danh mục vật tư"
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
                        <Typography variant="small" className="font-normal">
                            Trang {currentPage + 1} / {totalPages} • {totalElements} bản ghi
                        </Typography>
                        {/* <ReactPaginate
                            previousLabel={<ArrowLeftIcon className="h-4 w-4" />}
                            nextLabel={<ArrowRightIcon className="h-4 w-4" />}
                            pageCount={totalPages}
                            onPageChange={handlePageChange}
                            containerClassName="flex items-center gap-1"
                            activeClassName="bg-[#0ab067] text-white border-[#0ab067]"
                            forcePage={currentPage}
                        /> */}

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

            <CreateMaterialTypeModal
                show={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                loading={loading}
                onSuccess={handleCreateSuccess}
            />

            {showEditModal && editMaterialType && (
                <EditMaterialTypeModal
                    materialType={editMaterialType}
                    onClose={() => setShowEditModal(false)}
                    onSuccess={handleUpdateSuccess}
                />
            )}

            <ConfirmDialog
                open={confirmDialogOpen}
                onClose={() => setConfirmDialogOpen(false)}
                onConfirm={() => {
                    if (pendingToggleRow) {
                        toggleStatus(pendingToggleRow.id, pendingToggleRow.status);
                        setAlertMessage("Cập nhật trạng thái thành công!");
                        setSuccessAlertOpen(true);
                    }
                    setConfirmDialogOpen(false);
                }}
                message={`Bạn có chắc chắn muốn ${pendingToggleRow?.status ? "ngưng hoạt động" : "kích hoạt lại"} danh mục vật tư này không?`}
                confirmText="Có"
                cancelText="Không"
            />

            <SuccessAlert
                open={successAlertOpen}
                onClose={() => setSuccessAlertOpen(false)}
                message={alertMessage}
            />

            <SuccessAlert
                open={errorAlertOpen}
                onClose={() => setErrorAlertOpen(false)}
                message={alertMessage}
                severity="error"
            />
        </div>
    );
};

export default MaterialTypePage;