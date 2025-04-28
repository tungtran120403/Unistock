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

const MaterialTypePage = () => {
    const { materialTypes, fetchMaterialTypes, toggleStatus, createMaterialType, updateMaterialType, totalPages, totalElements, loading } = useMaterialType();
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

    useEffect(() => {
        fetchMaterialTypes(currentPage, pageSize);
    }, [currentPage, pageSize, fetchMaterialTypes]);

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
        index: (currentPage * pageSize) + index + 1,
        name: type.name,
        description: type.description,
        status: type.status,
    }));

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