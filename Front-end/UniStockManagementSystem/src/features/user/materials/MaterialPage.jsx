import React, { useEffect, useState } from "react";
import useMaterial from "./useMaterial";
import { Card, Typography } from "@material-tailwind/react";
import { ArrowRightIcon, ArrowLeftIcon } from "@heroicons/react/24/outline";
import {
    IconButton,
    Button,
    MenuItem,
    Menu,
    Checkbox,
    ListItemText,
} from "@mui/material";
import { VisibilityOutlined } from '@mui/icons-material';
import ReactPaginate from "react-paginate";
import PageHeader from '@/components/PageHeader';
import TableSearch from '@/components/TableSearch';
import Table from "@/components/Table";
import SuccessAlert from "@/components/SuccessAlert";
import ConfirmDialog from "@/components/ConfirmDialog";
import { useNavigate, useLocation } from "react-router-dom";
import {
    exportExcel,
    createMaterial,
    fetchMaterialCategories,

} from "./materialService";
import { fetchActiveUnits } from "../unit/unitService";
import { getPartnersByType } from "../partner/partnerService";
import {
    CardBody,
    Tooltip,
    Switch,
} from "@material-tailwind/react";
import ImportMaterialModal from "./ImportMaterialModal"; // Thêm import này
import StatusFilterButton from "@/components/StatusFilterButton";
import { FaAngleDown } from "react-icons/fa";

const MaterialPage = () => {
    const navigate = useNavigate();

    const {
        materials,
        loading,
        currentPage,
        pageSize,
        totalPages,
        totalElements,
        fetchPaginatedMaterials,
        handleToggleStatus,
        handlePageChange,
        handlePageSizeChange
    } = useMaterial();

    const [selectedMaterial, setSelectedMaterial] = useState(null);
    const [showImportPopup, setShowImportPopup] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    const [units, setUnits] = useState([]);
    const [materialCategories, setMaterialCategories] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [localLoading, setLocalLoading] = useState(false);

    const [statusAnchorEl, setStatusAnchorEl] = useState(null);
    const [selectedStatuses, setSelectedStatuses] = useState([]);
    const [materialTypeAnchorEl, setMaterialTypeAnchorEl] = useState(null);
    const [selectedMaterialTypes, setSelectedMaterialTypes] = useState([]);
    const [materialTypeList, setMaterialTypeList] = useState([]);

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

    // Handle search
    const handleSearch = () => {
        // Reset to first page when searching
        setCurrentPage(0);
        fetchPaginatedReceiptNotes(0, pageSize, searchTerm);
    };

    const [newMaterial, setNewMaterial] = useState({
        materialCode: "",
        materialName: "",
        description: "",
        unitId: "",
        typeId: "",
        isActive: "true",
        supplierIds: []
    });

    const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
    const [pendingToggleRow, setPendingToggleRow] = useState(null);
    const [showSuccessAlert, setShowSuccessAlert] = useState(false);
    const [alertMessage, setAlertMessage] = useState("");
    const location = useLocation();

    useEffect(() => {
        if (location.state?.successMessage) {
            console.log("Component mounted, location.state:", location.state?.successMessage);
            setAlertMessage(location.state.successMessage);
            setShowSuccessAlert(true);
            // Xóa state để không hiển thị lại nếu người dùng refresh
            window.history.replaceState({}, document.title);
        }
    }, [location.state]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [unitsData, categoriesData, suppliersData] = await Promise.all([
                    fetchActiveUnits(),
                    fetchMaterialCategories(),
                    getPartnersByType(1)
                ]);

                setUnits(Array.isArray(unitsData) ? unitsData : []);
                setMaterialCategories(Array.isArray(categoriesData) ? categoriesData : []);
                setMaterialTypeList(Array.isArray(categoriesData?.content) ? categoriesData.content : []);
                setSuppliers(Array.isArray(suppliersData.partners) ? suppliersData.partners : []);
            } catch (error) {
                console.error("Lỗi khi tải danh sách:", error);
                setUnits([]);
                setMaterialCategories([]);
                setMaterialTypeList([]);
                setSuppliers([]);
            }
        };
        fetchData();
    }, []);

    const handleExport = () => {
        const confirmExport = window.confirm("Bạn có muốn xuất danh sách vật tư ra file Excel không?");
        if (confirmExport) {
            setLocalLoading(true);
            exportExcel()
                .then((blob) => {
                    const url = window.URL.createObjectURL(new Blob([blob]));
                    const link = document.createElement("a");
                    link.href = url;
                    link.setAttribute("download", "materials_export.xlsx");
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    window.URL.revokeObjectURL(url);
                    alert("✅ Xuất file Excel thành công!");
                })
                .catch((err) => {
                    alert("❌ Lỗi khi xuất file Excel: " + (err.message || "Không xác định"));
                })
                .finally(() => {
                    setLocalLoading(false);
                });
        }
    };


    const handleEdit = (material) => {
        setSelectedMaterial(material);
    };

    const handlePageChangeWrapper = (selectedItem) => {
        handlePageChange(selectedItem.selected);
    };

    const columnsConfig = [
        { field: 'materialCode', headerName: 'Mã NVL', flex: 1, minWidth: 50, editable: false, filterable: false },
        { field: 'materialName', headerName: 'Tên nguyên vật liệu', flex: 2, minWidth: 250, editable: false, filterable: false },
        {
            field: 'unitName',
            headerName: 'Đơn vị',
            flex: 1,
            minWidth: 50,
            editable: false,
            filterable: false,
        },
        {
            field: 'materialTypeName',
            headerName: 'Danh mục',
            flex: 1.5,
            minWidth: 150,
            editable: false,
            filterable: false,
        },
        {
            field: 'imageUrl',
            headerName: 'Hình ảnh',
            flex: 1,
            minWidth: 150,
            editable: false,
            filterable: false,
            renderCell: (params) => {
                return params.value ? (
                    <img
                        src={params.value}
                        alt="Hình ảnh NVL"
                        className="w-12 h-12 object-cover rounded-lg"
                        onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.parentElement.innerHTML = 'Không có ảnh';
                        }}
                    />
                ) : (
                    <Typography >-</Typography>
                );
            },
        },
        {
            field: 'isUsing',
            headerName: 'Trạng thái',
            flex: 1,
            minWidth: 200,
            editable: false,
            filterable: false,
            renderCell: (params) => {
                return (
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
                );
            },
        },
        {
            field: 'actions',
            headerName: 'Hành động',
            flex: 0.5,
            minWidth: 50,
            editable: false,
            filterable: false,
            renderCell: (params) => (
                <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
                    <Tooltip content="Xem chi tiết">
                        <IconButton
                            size="small"
                            onClick={() => navigate(`/user/materials/${params.row.id}`)}
                            color="primary"
                        >
                            <VisibilityOutlined />
                        </IconButton>
                    </Tooltip>
                </div>
            ),
        },
    ];

    const data = materials.map((material) => ({
        id: material.materialId,
        materialCode: material.materialCode || "N/A",
        materialName: material.materialName,
        unitName: material.unitName || "N/A",
        materialTypeName: materialCategories.find(cat => cat.materialTypeId === material.typeId)?.name || material.typeName || "Không có danh mục",
        imageUrl: material.imageUrl,
        isUsing: material.isUsing,
    }));

    const filteredMaterials = Array.isArray(materials)
        ? materials.filter(material => {
            const matchesSearch =
                material.materialCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                material.materialName?.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesMaterialType =
                selectedMaterialTypes.length === 0 ||
                selectedMaterialTypes.some((type) => type.materialTypeId === material.typeId);

            return matchesSearch && matchesMaterialType;
        })
        : [];

    return (
        <div className="mb-8 flex flex-col gap-12" style={{ height: 'calc(100vh-100px)' }}>
            <Card className="bg-gray-50 p-7 rounded-none shadow-none">
                <CardBody className="pb-2 bg-white rounded-xl">
                    <PageHeader
                        title="Danh sách vật tư"
                        addButtonLabel="Thêm vật tư"
                        onAdd={() => navigate("/user/materials/add")}
                        onImport={() => setShowImportPopup(true)}
                        onExport={handleExport}
                    />
                    <div className="py-2 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                            <Typography variant="small" color="blue-gray" className="font-light">
                                Hiển thị
                            </Typography>
                            <select
                                value={pageSize}
                                onChange={(e) => {
                                    handlePageSizeChange(Number(e.target.value));
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
                            {/* Filter by status */}
                            <StatusFilterButton
                                anchorEl={statusAnchorEl}
                                setAnchorEl={setStatusAnchorEl}
                                selectedStatuses={selectedStatuses}
                                setSelectedStatuses={setSelectedStatuses}
                                allStatuses={allStatuses}
                                buttonLabel="Trạng thái"
                            />

                            {/* Filter by material type */}
                            <Button
                                onClick={(e) => setMaterialTypeAnchorEl(e.currentTarget)}
                                size="sm"
                                variant={selectedMaterialTypes.length > 0 ? "outlined" : "contained"}
                                sx={{
                                    ...(selectedMaterialTypes.length > 0
                                        ? {
                                            backgroundColor: "#ffffff",
                                            boxShadow: "none",
                                            borderColor: "#089456",
                                            textTransform: "none",
                                            color: "#089456",
                                            px: 1.5,
                                            "&:hover": {
                                                backgroundColor: "#0894561A",
                                                borderColor: "#089456",
                                                boxShadow: "none",
                                            },
                                        }
                                        : {
                                            backgroundColor: "#0ab067",
                                            boxShadow: "none",
                                            textTransform: "none",
                                            color: "#ffffff",
                                            px: 1.5,
                                            "&:hover": {
                                                backgroundColor: "#089456",
                                                borderColor: "#089456",
                                                boxShadow: "none",
                                            },
                                        }),
                                }}
                            >
                                {selectedMaterialTypes.length > 0 ? (
                                    <span className="flex items-center gap-[5px]">
                                        {selectedMaterialTypes[0]?.name}
                                        {selectedMaterialTypes.length > 1 && (
                                            <span className="text-xs bg-[#089456] text-white p-1 rounded-xl font-thin">
                                                +{selectedMaterialTypes.length - 1}
                                            </span>
                                        )}
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-[5px]">
                                        Danh mục vật tư <FaAngleDown className="h-4 w-4" />
                                    </span>
                                )}
                            </Button>

                            <Menu
                                anchorEl={materialTypeAnchorEl}
                                open={Boolean(materialTypeAnchorEl)}
                                onClose={() => setMaterialTypeAnchorEl(null)}
                                anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
                            >
                                {materialTypeList.map((mt) => (
                                    <MenuItem
                                        key={mt.materialTypeId}
                                        onClick={() => {
                                            const updated = selectedMaterialTypes.includes(mt)
                                                ? selectedMaterialTypes.filter((m) => m !== mt)
                                                : [...selectedMaterialTypes, mt];
                                            setSelectedMaterialTypes(updated);
                                            setCurrentPage(0);
                                        }}
                                        sx={{ paddingLeft: "7px", minWidth: "150px" }}
                                    >
                                        <Checkbox
                                            color="success"
                                            size="small"
                                            checked={selectedMaterialTypes.some((m) => m.materialTypeId === mt.materialTypeId)}
                                        />
                                        <ListItemText primary={mt.name} />
                                    </MenuItem>
                                ))}
                                {selectedMaterialTypes.length > 0 && (
                                    <div className="flex justify-end">
                                        <Button
                                            variant="text"
                                            size="medium"
                                            onClick={() => {
                                                setSelectedMaterialTypes([]);
                                                setCurrentPage(0);
                                            }}
                                            sx={{
                                                color: "#000000DE",
                                                "&:hover": {
                                                    backgroundColor: "transparent",
                                                    textDecoration: "underline",
                                                },
                                            }}
                                        >
                                            Xoá
                                        </Button>
                                    </div>
                                )}
                            </Menu>


                            {/* Search input */}
                            <div className="w-[250px]">
                                <TableSearch
                                    value={searchTerm}
                                    onChange={setSearchTerm}
                                    onSearch={handleSearch}
                                    placeholder="Tìm kiếm vật tư"
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
                        <div className="flex items-center gap-2">
                            <Typography variant="small" color="blue-gray" className="font-normal">
                                Trang {currentPage + 1} / {totalPages} • {totalElements} bản ghi
                            </Typography>
                        </div>
                        <ReactPaginate
                            previousLabel={<ArrowLeftIcon strokeWidth={2} className="h-4 w-4" />}
                            nextLabel={<ArrowRightIcon strokeWidth={2} className="h-4 w-4" />}
                            breakLabel="..."
                            pageCount={totalPages}
                            marginPagesDisplayed={2}
                            pageRangeDisplayed={5}
                            onPageChange={handlePageChangeWrapper}
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

            {showImportPopup && (
                <ImportMaterialModal
                    open={showImportPopup}
                    onClose={() => setShowImportPopup(false)}
                    onSuccess={fetchPaginatedMaterials}
                />
            )}

            <ConfirmDialog
                open={confirmDialogOpen}
                onClose={() => setConfirmDialogOpen(false)}
                onConfirm={() => {
                    if (pendingToggleRow) {
                        handleToggleStatus(pendingToggleRow.id); // truyền đúng giá trị mới
                        setAlertMessage("Cập nhật trạng thái thành công!");
                        setShowSuccessAlert(true);
                    }
                    setConfirmDialogOpen(false);
                }}
                message={`Bạn có chắc chắn muốn ${pendingToggleRow?.isUsing ? "ngưng hoạt động" : "kích hoạt lại"} nguyên vật liệu này không?`}
                confirmText="Có"
                cancelText="Không"
            />

            <SuccessAlert
                open={showSuccessAlert}
                onClose={() => setShowSuccessAlert(false)}
                message={alertMessage}
            />
        </div>
    );
};

export default MaterialPage;