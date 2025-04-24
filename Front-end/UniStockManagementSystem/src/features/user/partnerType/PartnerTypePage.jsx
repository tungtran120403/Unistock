import React, { useEffect, useState } from "react";
import usePartnerType from "./usePartnerType";
import CreatePartnerTypePopUp from "./CreatePartnerTypePopUp";
import EditPartnerTypePopUp from "./EditPartnerTypePopUp";
import {
    Card,
    CardBody,
    Typography,
    Tooltip,
    Switch,
} from "@material-tailwind/react";
import { IconButton } from "@mui/material";
import ReactPaginate from "react-paginate";
import { ArrowRightIcon, ArrowLeftIcon } from "@heroicons/react/24/outline";
import ModeEditOutlineOutlinedIcon from '@mui/icons-material/ModeEditOutlineOutlined';
import PageHeader from '@/components/PageHeader';
import Table from "@/components/Table";
import ConfirmDialog from "@/components/ConfirmDialog";
import SuccessAlert from "@/components/SuccessAlert";

const PartnerTypePage = () => {
    const { partnerTypes, fetchPartnerTypes, toggleStatus, totalPages, totalElements } = usePartnerType();
    const [showCreatePopup, setShowCreatePopup] = useState(false);
    const [showEditPopup, setShowEditPopup] = useState(false);
    const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
    const [successAlertOpen, setSuccessAlertOpen] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");
    const [pendingToggleRow, setPendingToggleRow] = useState(null);
    const [editPartnerType, setEditPartnerType] = useState(null);
    const [currentPage, setCurrentPage] = useState(0);
    const [pageSize, setPageSize] = useState(10);

    useEffect(() => {
        fetchPartnerTypes(currentPage, pageSize).then((data) => {
            console.log("📢 API trả về danh sách Partner Types:", data);
        });
    }, [currentPage, pageSize, fetchPartnerTypes]);

    const handlePageChange = (selectedItem) => {
        setCurrentPage(selectedItem.selected);
    };

    const handlePageSizeChange = (e) => {
        setPageSize(Number(e.target.value));
        setCurrentPage(0); // Reset về trang đầu khi thay đổi kích thước trang
    };

    // Cấu hình cột cho bảng
    const columnsConfig = [
        { field: 'index', headerName: 'STT', flex: 0.5, minWidth: 80, editable: false, filterable: false },
        { field: 'typeCode', headerName: 'Mã nhóm đối tác', minWidth: 150, flex: 1, editable: false, filterable: false },
        { field: 'typeName', headerName: 'Tên nhóm đối tác', minWidth: 250, flex: 2, editable: false, filterable: false },
        { field: 'description', headerName: 'Mô tả', minWidth: 400, flex: 2, editable: false, filterable: false },
        {
            field: 'status',
            headerName: 'Trạng thái',
            minWidth: 200,
            flex: 1,
            editable: false,
            filterable: false,
            renderCell: (params) => (
                <div className="flex items-center gap-2">
                    <Switch
                        color="green"
                        checked={params.value}
                        onChange={() => {
                            setPendingToggleRow(params.row);
                            setConfirmDialogOpen(true);
                        }}
                    />
                    <div
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium 
                      ${params.value ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"
                            }`}
                    >
                        {params.value ? "Đang hoạt động" : "Ngừng hoạt động"}
                    </div>
                </div>
            ),
        },
        {
            field: 'actions',
            headerName: 'Hành động',
            minWidth: 100,
            flex: 0.5,
            editable: false,
            filterable: false,
            renderCell: (params) => (
                <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
                    <Tooltip content="Chỉnh sửa">
                        <IconButton
                            size="small"
                            onClick={() => {
                                setEditPartnerType(params.row);
                                setShowEditPopup(true);
                            }}
                            color="primary"
                        >
                            <ModeEditOutlineOutlinedIcon />
                        </IconButton>
                    </Tooltip>
                </div>
            ),
        }
    ];

    // Xử lý dữ liệu cho bảng
    const data = partnerTypes.map((type, index) => ({
        id: type.typeId, // DataGrid cần `id`
        index: (currentPage * pageSize) + index + 1,
        typeCode: type.typeCode,
        typeName: type.typeName,
        description: type.description || "-",
        status: type.status,
    }));

    return (
        <div className="mb-8 flex flex-col gap-12" style={{ height: 'calc(100vh-100px)' }}>
            <Card className="bg-gray-50 p-7 rounded-none shadow-none">

                <CardBody className="pb-4 bg-white rounded-xl">
                    <PageHeader
                        title="Danh sách nhóm đối tác"
                        addButtonLabel="Thêm nhóm đối tác"
                        onAdd={() => setShowCreatePopup(true)}
                        showImport={false}
                        showExport={false}
                    />
                    <div className="px-4 py-2 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Typography variant="small" color="blue-gray" className="font-normal whitespace-nowrap">
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
                            <Typography variant="small" color="blue-gray" className="font-normal whitespace-nowrap">
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

            {/* Popup tạo nhóm đối tác mới */}
            {showCreatePopup && (
                <CreatePartnerTypePopUp
                    onClose={() => setShowCreatePopup(false)}
                    onSuccess={() => {
                        fetchPartnerTypes();
                        setSuccessMessage("Tạo nhóm đối tác thành công!");
                        setSuccessAlertOpen(true);
                    }}
                />
            )}

            {/* Popup chỉnh sửa nhóm đối tác */}
            {showEditPopup && editPartnerType && (
                <EditPartnerTypePopUp
                    partnerType={editPartnerType}
                    onClose={() => setShowEditPopup(false)}
                    onSuccess={() => {
                        fetchPartnerTypes();
                        setSuccessMessage("Cập nhật nhóm đối tác thành công!");
                        setSuccessAlertOpen(true);
                    }}
                />
            )}

            <ConfirmDialog
                open={confirmDialogOpen}
                onClose={() => setConfirmDialogOpen(false)}
                onConfirm={() => {
                    if (pendingToggleRow) {
                        toggleStatus(pendingToggleRow.id, pendingToggleRow.status); // truyền đúng giá trị mới
                        setSuccessMessage("Cập nhật trạng thái thành công!");
                        setSuccessAlertOpen(true);
                    }
                    setConfirmDialogOpen(false);
                }}
                message={`Bạn có chắc chắn muốn ${pendingToggleRow?.status ? "ngưng hoạt động" : "kích hoạt lại"} nhóm đối tác này không?`}
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

export default PartnerTypePage;
