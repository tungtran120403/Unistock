import React, { useEffect, useState } from "react";
import useProductType from "./useProductType";
import CreateProductTypeModal from "./CreateProductTypeModal";
import EditProductTypePopUp from "./EditProductTypeModal";
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

const ProductTypePage = () => {
    const {
        productTypes,
        fetchProductTypes,
        toggleStatus,
        createProductType,
        updateProductType,
        totalPages,
        totalElements,
        loading
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

    useEffect(() => {
        fetchProductTypes(currentPage, pageSize);
    }, [currentPage, pageSize, fetchProductTypes]);

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
            fetchProductTypes(currentPage, pageSize);
        } catch (error) {
            alert(error.message || "Lỗi khi tạo dòng sản phẩm");
        }
    };

    const handleEditSuccess = async (formData) => {
        try {
            // Đảm bảo có typeId từ editProductType
            const typeId = editProductType.typeId || editProductType.id;

            if (!typeId) {
                throw new Error("Không tìm thấy ID của dòng sản phẩm!");
            }

            await updateProductType(typeId, formData);
            setShowEditPopup(false);
            setSuccessMessage("Cập nhật dòng sản phẩm thành công!");
            setSuccessAlertOpen(true);
            fetchProductTypes(currentPage, pageSize);
        } catch (error) {
            alert(error.message || "Lỗi khi cập nhật dòng sản phẩm");
        }
    };

    const columnsConfig = [
        { field: 'index', headerName: 'STT', flex: 0.5, minWidth: 50 },
        { field: 'typeName', headerName: 'Tên dòng sản phẩm', flex: 2, minWidth: 300 },
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
                            const productTypeWithCorrectId = {
                                ...params.row,
                                typeId: params.row.id
                            };
                            setEditProductType(params.row);
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
        id: type.typeId, // Sửa: dùng typeId
        index: (currentPage * pageSize) + index + 1,
        typeName: type.typeName,
        description: type.description,
        status: type.status,
    }));

    return (
        <div className="mb-8 flex flex-col gap-12">
            <Card className="bg-gray-50 p-7 rounded-none shadow-none">
                <CardBody className="pb-2 bg-white rounded-xl">
                    <PageHeader
                        title="Danh sách dòng sản phẩm"
                        onAdd={() => setShowCreateModal(true)}
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
                        <ReactPaginate
                            previousLabel={<ArrowLeftIcon className="h-4 w-4" />}
                            nextLabel={<ArrowRightIcon className="h-4 w-4" />}
                            pageCount={totalPages}
                            onPageChange={handlePageChange}
                            containerClassName="flex items-center gap-1"
                            activeClassName="bg-[#0ab067] text-white border-[#0ab067]"
                            forcePage={currentPage}
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
                <EditProductTypePopUp
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
                        toggleStatus(pendingToggleRow.id, pendingToggleRow.status);
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
