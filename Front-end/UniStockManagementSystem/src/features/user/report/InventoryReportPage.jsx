import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import ReactPaginate from "react-paginate";
import { Card, CardBody, Typography } from "@material-tailwind/react";
import {
    Button,
    MenuItem,
    Menu,
    Checkbox,
    ListItemText,
} from '@mui/material';
import { FaAngleDown } from "react-icons/fa";
import { ArrowRightIcon, ArrowLeftIcon } from "@heroicons/react/24/outline";
import PageHeader from '@/components/PageHeader';
import TableSearch from '@/components/TableSearch';
import Table from "@/components/Table";
import QuantityFilterButton from "@/components/QuantityFilterButton";
import StatusFilterButton from "@/components/StatusFilterButton";
import "dayjs/locale/vi"; // Import Tiếng Việt
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import robotoFont from '@/assets/fonts/Roboto-Regular-normal.js';
import robotoBoldFont from '@/assets/fonts/Roboto-Regular-bold.js';
import { getInventoryReportPaginated } from "./reportService";
import { getWarehouseList } from "../warehouse/warehouseService";
import { fetchActiveProductTypes } from "../productType/productTypeService";
import { fetchActiveMaterialTypes } from "../materialType/materialTypeService";
import CircularProgress from '@mui/material/CircularProgress';

const InventoryReportPage = () => {
    const [currentPage, setCurrentPage] = useState(0);
    const [pageSize, setPageSize] = useState(20);
    const [searchTerm, setSearchTerm] = useState("");
    const navigate = useNavigate();
    const [quantityAnchorEl, setQuantityAnchorEl] = useState(null);
    const [quantityFilters, setQuantityFilters] = useState({
        itemRealQuantity: { label: "Tồn kho", type: "range", min: null, max: null },
        itemReservedQuantity: { label: "Đang giữ chỗ", type: "range", min: null, max: null },
        itemAvailableQuantity: { label: "Có sẵn", type: "range", min: null, max: null },
    });
    const [selectedWarehouses, setSelectedWarehouses] = useState([]);
    const [warehouseAnchorEl, setWarehouseAnchorEl] = useState(null);
    const [statusAnchorEl, setStatusAnchorEl] = useState(null);
    const [selectedStatuses, setSelectedStatuses] = useState([]);
    const [materialTypeAnchorEl, setMaterialTypeAnchorEl] = useState(null);
    const [productTypeAnchorEl, setProductTypeAnchorEl] = useState(null);

    const [reportData, setReportData] = useState([]);
    const [totalPages, setTotalPages] = useState(1);
    const [totalElements, setTotalElements] = useState(0);
    const [loading, setLoading] = useState(true);
    const [isFirstLoad, setIsFirstLoad] = useState(true);  // ✅ Thêm dòng này

    const [warehouseList, setWarehouses] = useState([]);
    const [productTypeList, setProductTypeList] = useState([]);
    const [selectedProductTypes, setSelectedProductTypes] = useState([]);
    const [materialTypeList, setMaterialTypeList] = useState([]);
    const [selectedMaterialTypes, setSelectedMaterialTypes] = useState([]);

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
              if (currentUser && !currentUser.permissions?.includes("getInventoryReport")) {
                navigate("/unauthorized");
              }
            }, [currentUser, navigate]);

    const fetchReport = async (page, size, itemType, isFirstLoad) => {
        if (isFirstLoad) {
            setLoading(true);
        }

        try {
            const response = await getInventoryReportPaginated({
                page,
                size,
                search: searchTerm,
                warehouses: selectedWarehouses,
                statuses: selectedStatuses.map((s) => s.value),
                quantityFilters,
                itemType,
                productTypeIds: selectedProductTypes.map((p) => p.typeId),
                materialTypeIds: selectedMaterialTypes.map((m) => m.materialTypeId),
            });
            const content = response.data.content.map((item, index) => ({
                id: index + 1 + page * size,
                stt: index + 1 + page * size,
                itemCode: item.itemCode,
                itemName: item.itemName,
                itemStatus: item.isActive,
                itemUnit: item.unitName,
                itemRealQuantity: item.totalQuantity,
                itemReservedQuantity: item.reservedQuantity,
                itemAvailableQuantity: item.availableQuantity,
                inWarehouse: item.warehouseName,
            }));
            setReportData(content);
            setTotalPages(response.data.totalPages);
            setTotalElements(response.data.totalElements);
        } catch (error) {
            console.error("❌ Lỗi khi gọi API báo cáo tồn kho:", error); // ✅ thêm log
            setReportData([]);
            setTotalPages(1);
            setTotalElements(0);
        } finally {
            if (isFirstLoad) {
                setLoading(false);
            }
        }
    };
    useEffect(() => {
        const inferredItemType = selectedProductTypes.length > 0
            ? "PRODUCT"
            : selectedMaterialTypes.length > 0
                ? "MATERIAL"
                : "";

        fetchReport(currentPage, pageSize, inferredItemType, isFirstLoad);

        if (isFirstLoad) {
            setIsFirstLoad(false);  // ✅ Sau lần đầu, tắt flag này
        }

    }, [
        currentPage,
        pageSize,
        searchTerm,
        selectedWarehouses,
        selectedStatuses,
        quantityFilters,
        selectedProductTypes,
        selectedMaterialTypes,
        isFirstLoad,
    ]);

    // Handle page change
    const handlePageChange = (selectedPage) => {
        setCurrentPage(selectedPage);
    };

    // Handle page change from ReactPaginate
    const handlePageChangeWrapper = (selectedItem) => {
        handlePageChange(selectedItem.selected);
    };

    // Handle search
    const handleSearch = () => {
        setCurrentPage(0);
        const inferredItemType = selectedProductTypes.length > 0
            ? "PRODUCT"
            : selectedMaterialTypes.length > 0
                ? "MATERIAL"
                : "";
        fetchReport(0, pageSize, inferredItemType);
    };

    // handle validate quantity filter
    const updateQuantityFilter = (field, type, value) => {
        const raw = value === "" ? null : Number(value);
        if (raw !== null && (isNaN(raw) || raw < 0)) return; // loại bỏ ký tự hoặc số âm
        setQuantityFilters(prev => ({
            ...prev,
            [field]: {
                ...prev[field],
                [type]: raw
            }
        }));
    };

    // handle change status
    const handleStatusChange = (status) => {
        const updatedStatuses = selectedStatuses.includes(status)
            ? selectedStatuses.filter(s => s !== status)
            : [...selectedStatuses, status];
        setSelectedStatuses(updatedStatuses);
    };

    // handle export PDF
    const handleExportPDF = () => {
        const formatVietnameseDate = (dateString) => {
            const date = new Date(dateString);
            const day = date.getDate();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const year = date.getFullYear();
            return `Ngày ${day} tháng ${month} năm ${year}`;
        };

        const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
        doc.addFileToVFS("Roboto-Bold.ttf", robotoBoldFont);
        doc.addFont("Roboto-Bold.ttf", "Roboto", "bold");
        doc.addFileToVFS("Roboto-Regular.ttf", robotoFont);
        doc.addFont("Roboto-Regular.ttf", "Roboto", "normal");

        doc.setFont("Roboto", "bold");
        doc.setFontSize(14);
        doc.text("CÔNG TY TNHH THIÊN NGỌC AN", 14, 20);
        doc.setFont("Roboto", "normal");
        doc.setFontSize(10);
        doc.text("Đ/C: TL 419 KCN Phùng Xá, Huyện Thạch Thất, TP. Hà Nội", 14, 26);
        doc.text("SĐT: 0909.009.990", 14, 32);

        doc.setFont("Roboto", "bold");
        doc.setFontSize(20);
        doc.text("BÁO CÁO TỒN KHO", 150, 40, { align: "center" });

        doc.setFont("Roboto", "normal");
        doc.setFontSize(9);
        doc.text(formatVietnameseDate(new Date()), 150, 45, { align: "center" });

        doc.setFontSize(11);
        if (selectedWarehouses.length === 1) {
            const wh = selectedWarehouses[0];
            doc.text(`Kho: ${wh.warehouseCode || ""} - ${wh.warehouseName}`, 150, 53, { align: "center" });
        } else if (selectedWarehouses.length > 1) {
            doc.text("Kho: Nhiều kho được chọn", 150, 53, { align: "center" });
        } else {
            doc.text("Kho: Tất cả kho", 150, 53, { align: "center" });
        }

        const totalRealQty = reportData.reduce((sum, item) => sum + (item.itemRealQuantity || 0), 0);
        const totalReservedQty = reportData.reduce((sum, item) => sum + (item.itemReservedQuantity || 0), 0);
        const totalAvailableQty = reportData.reduce((sum, item) => sum + (item.itemAvailableQuantity || 0), 0);

        autoTable(doc, {
            startY: 60,
            head: [[
                { content: "STT", styles: { halign: 'center', cellWidth: 12 } },
                { content: "Mã hàng", styles: { halign: 'center', cellWidth: 50 } },
                { content: "Tên hàng", styles: { halign: 'center', cellWidth: 80 } },
                { content: "Đơn vị", styles: { halign: 'center' }, cellWidth: 20 },
                { content: "SL tồn kho thực tế", styles: { halign: 'center', cellWidth: 25 } },
                { content: "SL đang giữ chỗ", styles: { halign: 'center', cellWidth: 25 } },
                { content: "SL có sẵn", styles: { halign: 'center' }, cellWidth: 25 },
                { content: "Lưu kho", styles: { halign: 'center' }, cellWidth: 30 }
            ]],
            body: [
                ...reportData.map((item, index) => [
                    { content: index + 1, styles: { halign: 'center' } },
                    { content: item.itemCode, styles: { halign: 'left' } },
                    { content: item.itemName, styles: { halign: 'left' } },
                    { content: item.itemUnit, styles: { halign: 'center' } },
                    { content: item.itemRealQuantity, styles: { halign: 'center' } },
                    { content: item.itemReservedQuantity, styles: { halign: 'center' } },
                    { content: item.itemAvailableQuantity, styles: { halign: 'center' } },
                    { content: item.inWarehouse, styles: { halign: 'left' } },
                ]),
                [
                    { content: "TỔNG CỘNG :", colSpan: 4, styles: { halign: 'right', fontStyle: 'bold' } },
                    { content: totalRealQty, styles: { halign: 'center', fontStyle: 'bold' } },
                    { content: totalReservedQty, styles: { halign: 'center', fontStyle: 'bold' } },
                    { content: totalAvailableQty, styles: { halign: 'center', fontStyle: 'bold' } },
                    { content: "", styles: { halign: 'center' } },
                ]
            ],
            styles: {
                font: "Roboto",
                fontSize: 10,
                cellPadding: { top: 2, right: 2, bottom: 2, left: 2 },
                valign: 'middle',
                lineWidth: 0.2,
                overflow: 'linebreak',
            },
            headStyles: {
                fillColor: [240, 240, 240],
                textColor: 20,
                fontSize: 10,
                lineWidth: 0.2,
            },
            bodyStyles: {
                textColor: 20,
                lineWidth: 0.2,
            },
            alternateRowStyles: { fillColor: [255, 255, 255] },
            tableLineWidth: 0.2,
            tableLineColor: 200,
            margin: { top: 0, left: 14, right: 14 },
        });

        const finalY = doc.lastAutoTable.finalY + 12;
        // Căn đều 3 cột trên cùng 1 hàng
        doc.setFont("Roboto", "bold");
        doc.setFontSize(10);
        doc.text("Người lập biểu", 30, finalY);
        doc.text("Kế toán trưởng", 140, finalY);
        doc.text("Giám đốc", 250, finalY);
        doc.setFont("Roboto", "normal");
        doc.setFontSize(8);
        doc.text("(Ký, họ tên)", 42, finalY + 5, { align: "center" });
        doc.text("(Ký, họ tên)", 152, finalY + 5, { align: "center" });
        doc.text("(Ký, họ tên)", 258, finalY + 5, { align: "center" });

        doc.save("BaoCaoTonKho.pdf");
    };

    const fetchInitData = async () => {
        try {
            const response = await getWarehouseList();
            const activeWarehouses = (response?.data || response || []).filter(wh => wh.isActive);
            setWarehouses(activeWarehouses);

            const productTypes = await fetchActiveProductTypes();
            setProductTypeList(productTypes);

            const materialTypes = await fetchActiveMaterialTypes();
            setMaterialTypeList(materialTypes);
        } catch (err) {
            console.error("Lỗi khi lấy dữ liệu:", err);
        }
    };

    useEffect(() => {
        fetchInitData();
    }, []);

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

    const columnsConfig = [
        { field: 'stt', headerName: 'STT', flex: 1, minWidth: 80, editable: false, filterable: false },
        {
            field: 'itemCode',
            headerName: 'Mã hàng',
            flex: 1.5,
            minWidth: 150,
            editable: false,
            filterable: false,
            //dùng renderCell để cấu hình data
        },
        {
            field: 'itemName',
            headerName: 'Tên hàng',
            flex: 2,
            minWidth: 350,
            editable: false,
            filterable: false,
            //dùng renderCell để cấu hình data
        },
        {
            field: 'itemStatus',
            headerName: 'Trạng thái',
            flex: 1.5,
            minWidth: 150,
            editable: false,
            filterable: false,
            renderCell: (params) => {
                const isActive = params.value === true;
                const label = isActive ? 'Đang hoạt động' : 'Ngừng hoạt động';
                const className = isActive
                    ? 'bg-green-50 text-green-800'
                    : 'bg-red-50 text-red-800';

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
            field: 'itemUnit',
            headerName: 'Đơn vị',
            flex: 1,
            minWidth: 100,
            editable: false,
            filterable: false,
            //dùng renderCell để cấu hình data
        },
        {
            field: 'itemRealQuantity',
            headerName: 'Tồn kho thực tế',
            flex: 1,
            minWidth: 135,
            editable: false,
            filterable: false,
            //dùng renderCell để cấu hình data
        },
        {
            field: 'itemReservedQuantity',
            headerName: 'SL đang giữ chỗ',
            flex: 1,
            minWidth: 135,
            editable: false,
            filterable: false,
            //dùng renderCell để cấu hình data
        },
        {
            field: 'itemAvailableQuantity',
            headerName: 'SL có sẵn',
            flex: 1,
            minWidth: 135,
            editable: false,
            filterable: false,
            //dùng renderCell để cấu hình data
        },
        {
            field: 'inWarehouse',
            headerName: 'Lưu kho',
            flex: 1,
            minWidth: 150,
            editable: false,
            filterable: false,
            //dùng renderCell để cấu hình data
        },
    ];

    const data = reportData;

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
                        title="Báo cáo tồn kho"
                        showAdd={false}
                        showImport={false}
                        onExport={handleExportPDF}
                    />

                    <div className="mb-3 flex flex-wrap items-center gap-4">
                        {/* Search input */}
                        <div className="w-[250px]">
                            <TableSearch
                                value={searchTerm}
                                onChange={setSearchTerm}
                                onSearch={handleSearch}
                                placeholder="Tìm kiếm"
                            />
                        </div>

                        {/* Filter by quantity */}
                        <QuantityFilterButton
                            anchorEl={quantityAnchorEl}
                            setAnchorEl={setQuantityAnchorEl}
                            filters={quantityFilters}
                            setFilters={setQuantityFilters}
                            buttonLabel="Số lượng"
                        />

                        {/* Filter by warehouse */}
                        <Button
                            onClick={(e) => setWarehouseAnchorEl(e.currentTarget)}
                            size="sm"
                            variant={selectedWarehouses.length > 0 ? "outlined" : "contained"}
                            sx={{
                                ...(selectedWarehouses.length > 0
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
                            {selectedWarehouses.length > 0 ? (
                                <span className="flex items-center gap-[5px]">
                                    {selectedWarehouses[0]?.warehouseName}
                                    {selectedWarehouses.length > 1 && (
                                        <span className="text-xs bg-[#089456] text-white p-1 rounded-xl font-thin">+{selectedWarehouses.length - 1}</span>
                                    )}
                                </span>
                            ) : (
                                <span className="flex items-center gap-[5px]">
                                    Lưu kho
                                    <FaAngleDown className="h-4 w-4" />
                                </span>
                            )}
                        </Button>

                        <Menu
                            anchorEl={warehouseAnchorEl}
                            open={Boolean(warehouseAnchorEl)}
                            onClose={() => setWarehouseAnchorEl(null)}
                            anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
                        >
                            {warehouseList.map((wh) => (
                                <MenuItem key={wh.warehouseId}
                                    onClick={() => {
                                        const updated = selectedWarehouses.includes(wh)
                                            ? selectedWarehouses.filter(w => w !== wh)
                                            : [...selectedWarehouses, wh];
                                        setSelectedWarehouses(updated);
                                    }}
                                    sx={{ paddingLeft: "7px", minWidth: "150px" }}
                                >
                                    <Checkbox color="success" size="small" checked={selectedWarehouses.some(w => w.warehouseId === wh.warehouseId)} />
                                    <ListItemText primary={wh.warehouseName} />
                                </MenuItem>
                            ))}
                            {selectedWarehouses.length > 0 && (
                                <div className="flex justify-end">
                                    <Button
                                        variant="text"
                                        size="medium"
                                        onClick={() => {
                                            setSelectedWarehouses([]);
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
                                        Xóa
                                    </Button>
                                </div>
                            )}
                        </Menu>

                        {/* Filter by status */}
                        <StatusFilterButton
                            anchorEl={statusAnchorEl}
                            setAnchorEl={setStatusAnchorEl}
                            selectedStatuses={selectedStatuses}
                            setSelectedStatuses={setSelectedStatuses}
                            allStatuses={allStatuses}
                            buttonLabel="Trạng thái"
                            setCurrentPage={setCurrentPage}
                        />

                        <Button
                            onClick={(e) => setProductTypeAnchorEl(e.currentTarget)}
                            size="sm"
                            variant={selectedProductTypes.length > 0 ? "outlined" : "contained"}
                            sx={{
                                ...(selectedProductTypes.length > 0
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
                            {selectedProductTypes.length > 0 ? (
                                <span className="flex items-center gap-[5px]">
                                    {selectedProductTypes[0]?.typeName}
                                    {selectedProductTypes.length > 1 && (
                                        <span className="text-xs bg-[#089456] text-white p-1 rounded-xl font-thin">+{selectedProductTypes.length - 1}</span>
                                    )}
                                </span>
                            ) : (
                                <span className="flex items-center gap-[5px]">
                                    Dòng sản phẩm <FaAngleDown className="h-4 w-4" />
                                </span>
                            )}
                        </Button>
                        <Menu
                            anchorEl={productTypeAnchorEl}
                            open={Boolean(productTypeAnchorEl)}
                            onClose={() => setProductTypeAnchorEl(null)}
                            anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
                        >
                            {productTypeList.map((pt) => (
                                <MenuItem key={pt.typeId}
                                    onClick={() => {
                                        const updated = selectedProductTypes.includes(pt)
                                            ? selectedProductTypes.filter(p => p !== pt)
                                            : [...selectedProductTypes, pt];
                                        setSelectedProductTypes(updated);
                                        setCurrentPage(0);
                                    }}
                                    sx={{ paddingLeft: "7px", minWidth: "150px" }}
                                >
                                    <Checkbox color="success" size="small" checked={selectedProductTypes.some(p => p.typeId === pt.typeId)} />
                                    <ListItemText primary={pt.typeName} />
                                </MenuItem>
                            ))}
                            {selectedProductTypes.length > 0 && (
                                <div className="flex justify-end">
                                    <Button
                                        variant="text"
                                        size="medium"
                                        onClick={() => {
                                            setSelectedProductTypes([]);
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
                                        Xóa
                                    </Button>
                                </div>
                            )}
                        </Menu>

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


                    </div>
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

                    </div>

                    <Table
                        data={reportData}
                        columnsConfig={columnsConfig}
                        enableSelection={false}
                    />

                    {/* Pagination */}
                    <div className="flex items-center justify-between border-t border-blue-gray-50 py-4">
                        <div className="flex items-center gap-2">
                            <Typography variant="small" color="blue-gray" className="font-normal">
                                Trang {currentPage + 1} / {totalPages || 1} • {totalElements || 0} bản ghi
                            </Typography>
                        </div>
                        <ReactPaginate
                            previousLabel={<ArrowLeftIcon strokeWidth={2} className="h-4 w-4" />}
                            nextLabel={<ArrowRightIcon strokeWidth={2} className="h-4 w-4" />}
                            breakLabel="..."
                            pageCount={totalPages || 1}
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
        </div >
    );
};

export default InventoryReportPage;