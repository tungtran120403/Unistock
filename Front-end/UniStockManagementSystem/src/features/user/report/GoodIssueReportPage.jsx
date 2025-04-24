import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
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
import DateFilterButton from "@/components/DateFilterButton";
import dayjs from "dayjs";
import "dayjs/locale/vi"; // Import Tiếng Việt
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import robotoFont from '@/assets/fonts/Roboto-Regular-normal.js';
import robotoBoldFont from '@/assets/fonts/Roboto-Regular-bold.js';
import { getGoodIssueReportPaginated } from "./reportService";
import { getWarehouseList } from "../warehouse/warehouseService";

const GoodIssueReportPage = () => {
    const [currentPage, setCurrentPage] = useState(0);
    const [pageSize, setPageSize] = useState(20);
    const [searchTerm, setSearchTerm] = useState("");
    const navigate = useNavigate();
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);
    const [categoryAnchorEl, setCategoryAnchorEl] = useState(null);
    const [selectedCategories, setSelectedCategories] = useState([]);
    const [selectedWarehouses, setSelectedWarehouses] = useState([]);
    const [warehouseAnchorEl, setWarehouseAnchorEl] = useState(null);
    const [quantityAnchorEl, setQuantityAnchorEl] = useState(null);
    const [quantityFilters, setQuantityFilters] = useState({
        itemQuantity: { label: "Số lượng", type: "range", min: null, max: null },
    });
    const [reportData, setReportData] = useState([]);
    const [totalPages, setTotalPages] = useState(1);
    const [totalElements, setTotalElements] = useState(0);

    const [warehouseList, setWarehouses] = useState([]);
    const [itemTypeAnchorEl, setItemTypeAnchorEl] = useState(null);
    const [selectedItemType, setSelectedItemType] = useState(""); // "", "PRODUCT", "MATERIAL"

    const fetchReport = async (page = currentPage, size = pageSize) => {
        try {
            const response = await getGoodIssueReportPaginated({
                page,
                size,
                search: searchTerm,
                startDate: startDate ? dayjs(startDate).format("YYYY-MM-DD") : null,
                endDate: endDate ? dayjs(endDate).format("YYYY-MM-DD") : null,
                categories: selectedCategories,
                warehouses: selectedWarehouses,
                quantityFilters,
                itemType: selectedItemType
            });

            const data = response.data.content.map((item, index) => ({
                id: index + 1 + page * size,
                stt: index + 1 + page * size,
                issueCode: item.ginCode,
                issueDate: item.issueDate, // ✅ field đúng là issueDate, không phải receiptDate
                itemCode: item.materialCode || item.productCode,
                itemName: item.materialName || item.productName,
                itemUnit: item.unitName,
                itemQuantity: item.quantity,
                fromWarehouse: item.warehouseName, // ✅ field đúng là fromWarehouse
                category: item.category,
            }));

            setReportData(data);
            console.log("✅ Dữ liệu báo cáo xuất kho:", reportData);
            setTotalPages(response.data.totalPages);
            setTotalElements(response.data.totalElements);
        } catch (error) {
            console.error("❌ Lỗi khi lấy dữ liệu báo cáo xuất kho:", error);
            setReportData([]);
        }
    };


    useEffect(() => {
        fetchReport();
    }, [
        currentPage,
        pageSize,
        searchTerm,
        startDate,
        endDate,
        selectedCategories,
        selectedWarehouses,
        quantityFilters,
        selectedItemType,
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
        fetchReport(0, pageSize);
    };

    // Handle export to PDF
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
        doc.text("BÁO CÁO XUẤT KHO", 150, 40, { align: "center" });

        doc.setFont("Roboto", "normal");
        doc.setFontSize(9);
        doc.text(formatVietnameseDate(new Date()), 150, 45, { align: "center" });

        doc.setFontSize(11);
        if (selectedWarehouses.length === 1) {
            const wh = selectedWarehouses[0];
            doc.text(`Kho nhập: ${wh.warehouseCode || ""} - ${wh.warehouseName}`, 150, 53, { align: "center" });
        } else if (selectedWarehouses.length > 1) {
            doc.text("Kho nhập: Nhiều kho được chọn", 150, 53, { align: "center" });
        } else {
            doc.text("Kho nhập: Tất cả kho", 150, 53, { align: "center" });
        }

        const totalQuantity = reportData.reduce((sum, item) => sum + (item.itemQuantity || 0), 0);

        autoTable(doc, {
            startY: 60,
            head: [[
                { content: "STT", styles: { halign: 'center', cellWidth: 12 } },
                { content: "Mã phiếu xuất", styles: { halign: 'center', cellWidth: 20 } },
                { content: "Ngày xuất", styles: { halign: 'center', cellWidth: 25 } },
                { content: "Phân loại xuất", styles: { halign: 'center', cellWidth: 40 } },
                { content: "Mã hàng", styles: { halign: 'center', cellWidth: 40 } },
                { content: "Tên hàng", styles: { halign: 'center', cellWidth: 60 } },
                { content: "Đơn vị", styles: { halign: 'center' }, cellWidth: 20 },
                { content: "Số lượng", styles: { halign: 'center', cellWidth: 25 } },
                { content: "Kho xuất", styles: { halign: 'center' }, cellWidth: 30 }
            ]],
            body: [
                ...reportData.map((item, index) => [
                    { content: index + 1, styles: { halign: 'center' } },
                    { content: item.issueCode, styles: { halign: 'center' } },
                    { content: dayjs(item.issueDate).format("DD/MM/YYYY"), styles: { halign: 'center' } },
                    { content: item.category, styles: { halign: 'left' } },
                    { content: item.itemCode, styles: { halign: 'left' } },
                    { content: item.itemName, styles: { halign: 'left' } },
                    { content: item.itemUnit, styles: { halign: 'center' } },
                    { content: item.itemQuantity, styles: { halign: 'center' } },
                    { content: item.fromWarehouse, styles: { halign: 'left' } },
                ]),
                [
                    { content: "TỔNG CỘNG :", colSpan: 7, styles: { halign: 'right', fontStyle: 'bold' } },
                    { content: totalQuantity, styles: { halign: 'center', fontStyle: 'bold' } },
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

        doc.save("BaoCaoXuatKho.pdf");
    };

    const categoryList = [
        "Sản xuất",
        "Bán hàng",
        "Gia công",
        "Trả lại hàng mua",
    ];

    useEffect(() => {
        const fetchInitData = async () => {
            try {
                const response = await getWarehouseList();
                const activeWarehouses = (response?.data || response || []).filter(wh => wh.isActive);
                setWarehouses(activeWarehouses);
            } catch (err) {
                console.error("Lỗi khi lấy dữ liệu kho:", err);
            }
        };

        fetchInitData();
    }, []);

    const columnsConfig = [
        { field: 'stt', headerName: 'STT', flex: 1, minWidth: 80, editable: false, filterable: false },
        { field: 'issueCode', headerName: 'Mã phiếu xuất', flex: 1, minWidth: 150, editable: false, filterable: false },
        {
            field: 'issueDate',
            headerName: 'Ngày xuất',
            flex: 1.5,
            minWidth: 150,
            editable: false,
            filterable: false,
            renderCell: (params) => params.value ? dayjs(params.value).format("DD/MM/YYYY") : "",
        },
        { field: 'category', headerName: 'Phân loại xuất', flex: 2, minWidth: 200, editable: false, filterable: false },
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
            minWidth: 400,
            editable: false,
            filterable: false,
            //dùng renderCell để cấu hình data
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
            field: 'itemQuantity',
            headerName: 'Số lượng',
            flex: 1,
            minWidth: 100,
            editable: false,
            filterable: false,
            //dùng renderCell để cấu hình data
        },
        {
            field: 'fromWarehouse',
            headerName: 'Kho xuất',
            flex: 1,
            minWidth: 150,
            editable: false,
            filterable: false,
            //dùng renderCell để cấu hình data
        },
    ];

    const pageCount = totalPages;
    const paginatedData = reportData;

    // const pageCount = Math.ceil(filteredData.length / pageSize);
    // const paginatedData = filteredData.slice(currentPage * pageSize, (currentPage + 1) * pageSize);

    return (
        <div className="mb-8 flex flex-col gap-12" style={{ height: 'calc(100vh-100px)' }}>
            <Card className="bg-gray-50 p-7 rounded-none shadow-none">
                <CardBody className="pb-2 bg-white rounded-xl">
                    <PageHeader
                        title="Báo cáo xuất kho"
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
                        {/* Filter by date */}
                        <DateFilterButton
                            startDate={startDate}
                            endDate={endDate}
                            setStartDate={setStartDate}
                            setEndDate={setEndDate}
                            setCurrentPage={setCurrentPage}
                        />
                        {/* Filter by category */}
                        <div>
                            <Button
                                onClick={(e) => setCategoryAnchorEl(e.currentTarget)}
                                size="sm"
                                variant={selectedCategories.length > 0 ? "outlined" : "contained"}
                                sx={{
                                    ...(selectedCategories.length > 0
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
                                {selectedCategories.length > 0 ? (
                                    <span className="flex items-center gap-[5px]">
                                        {selectedCategories[0]}
                                        {selectedCategories.length > 1 && (
                                            <span className="text-xs bg-[#089456] text-white p-1 rounded-xl font-thin">+{selectedCategories.length - 1}</span>
                                        )}
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-[5px]">
                                        Phân loại xuất
                                        <FaAngleDown className="h-4 w-4" />
                                    </span>
                                )}
                            </Button>
                            <Menu
                                anchorEl={categoryAnchorEl}
                                open={Boolean(categoryAnchorEl)}
                                onClose={() => setCategoryAnchorEl(null)}
                                anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
                            >
                                {categoryList.map((category) => (
                                    <MenuItem
                                        key={category}
                                        onClick={() => {
                                            const isSelected = selectedCategories.includes(category);
                                            const updated = isSelected
                                                ? selectedCategories.filter(c => c !== category)
                                                : [...selectedCategories, category];
                                            setSelectedCategories(updated);
                                        }}
                                        sx={{ paddingLeft: "7px" }}
                                    >
                                        <Checkbox color="success" checked={selectedCategories.includes(category)} />
                                        <ListItemText primary={category} />
                                    </MenuItem>
                                ))}
                                {selectedCategories.length > 0 && (
                                    <div className="flex px-4 justify-end">
                                        <Button
                                            variant="text"
                                            size="medium"
                                            onClick={() => {
                                                setSelectedCategories([]);
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
                        </div>
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
                                    {selectedWarehouses.length === 1 && selectedWarehouses[0].warehouseName}
                                    {selectedWarehouses.length > 1 && (
                                        <>
                                            {selectedWarehouses[0].warehouseName}
                                            <span className="text-xs bg-[#089456] text-white p-1 rounded-xl font-thin">
                                                +{selectedWarehouses.length - 1}
                                            </span>
                                        </>
                                    )}
                                </span>
                            ) : (
                                <span className="flex items-center gap-[5px]">
                                    Kho xuất
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
                                <MenuItem
                                    key={wh}
                                    onClick={() => {
                                        const exists = selectedWarehouses.some(w => w.warehouseId === wh.warehouseId);
                                        const updated = exists
                                            ? selectedWarehouses.filter(w => w.warehouseId !== wh.warehouseId)
                                            : [...selectedWarehouses, wh];
                                        setSelectedWarehouses(updated);
                                    }}
                                    sx={{ paddingLeft: "7px", minWidth: "150px" }}
                                >
                                    <Checkbox
                                        color="success"
                                        size="small"
                                        checked={selectedWarehouses.some(w => w.warehouseId === wh.warehouseId)}
                                    />
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

                        {/* Filter by quantity */}
                        <QuantityFilterButton
                            anchorEl={quantityAnchorEl}
                            setAnchorEl={setQuantityAnchorEl}
                            filters={quantityFilters}
                            setFilters={setQuantityFilters}
                            setCurrentPage={setCurrentPage}
                        />

                        {/* Filter by good category */}
                        <Button
                            onClick={(e) => setItemTypeAnchorEl(e.currentTarget)}
                            size="sm"
                            variant={selectedItemType ? "outlined" : "contained"}
                            sx={{
                                ...(selectedItemType
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
                            <span className="flex items-center gap-[5px]">
                                {selectedItemType === "PRODUCT"
                                    ? "Sản phẩm"
                                    : selectedItemType === "MATERIAL"
                                        ? "Vật tư"
                                        : "Loại hàng hóa"}
                                <FaAngleDown className="h-4 w-4" />
                            </span>
                        </Button>

                        <Menu
                            anchorEl={itemTypeAnchorEl}
                            open={Boolean(itemTypeAnchorEl)}
                            onClose={() => setItemTypeAnchorEl(null)}
                            anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
                        >
                            {[
                                { label: "Tất cả", value: "" },
                                { label: "Sản phẩm", value: "PRODUCT" },
                                { label: "Vật tư", value: "MATERIAL" },
                            ].map((option) => (
                                <MenuItem
                                    key={option.value}
                                    onClick={() => {
                                        setSelectedItemType(option.value);
                                        setItemTypeAnchorEl(null);
                                        setCurrentPage(0);
                                    }}
                                    sx={{ paddingLeft: "7px", minWidth: "150px" }}
                                >
                                    <Checkbox
                                        color="success"
                                        size="small"
                                        checked={selectedItemType === option.value}
                                    />
                                    <ListItemText primary={option.label} />
                                </MenuItem>
                            ))}

                            {selectedItemType && (
                                <div className="flex justify-end">
                                    <Button
                                        variant="text"
                                        size="medium"
                                        onClick={() => {
                                            setSelectedItemType("");
                                            setCurrentPage(0);
                                            setItemTypeAnchorEl(null);
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
                        data={paginatedData}
                        columnsConfig={columnsConfig}
                        enableSelection={false}
                    />


                    {/* Pagination */}
                    <div className="flex items-center justify-between border-t border-blue-gray-50 py-4">
                        <div className="flex items-center gap-2">
                            <Typography variant="small" color="blue-gray" className="font-normal">
                                {/* Trang {currentPage + 1} / {totalPages || 1} • {totalElements || 0} bản ghi */}
                                Trang {currentPage + 1} / {pageCount || 1} • {totalElements || 0} bản ghi
                            </Typography>
                        </div>
                        <ReactPaginate
                            previousLabel={<ArrowLeftIcon strokeWidth={2} className="h-4 w-4" />}
                            nextLabel={<ArrowRightIcon strokeWidth={2} className="h-4 w-4" />}
                            breakLabel="..."
                            pageCount={pageCount || 1}
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

export default GoodIssueReportPage;