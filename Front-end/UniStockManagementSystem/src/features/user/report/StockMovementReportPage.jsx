import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ReactPaginate from "react-paginate";
import { Card, CardBody, Typography } from "@material-tailwind/react";
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
import {
    Button,
    MenuItem,
    Menu,
    Checkbox,
    ListItemText,
} from '@mui/material';
import { FaAngleDown } from "react-icons/fa";
import { getStockMovementReportPaginated } from "./reportService";

const StockMovementReportPage = () => {
    const [currentPage, setCurrentPage] = useState(0);
    const [pageSize, setPageSize] = useState(20);
    const [searchTerm, setSearchTerm] = useState("");
    const navigate = useNavigate();
    const [quantityAnchorEl, setQuantityAnchorEl] = useState(null);
    const [quantityFilters, setQuantityFilters] = useState({
        beginQuantity: { label: "Tồn đầu kỳ", type: "range", min: null, max: null },
        inQuantity: { label: "Nhập trong kỳ", type: "range", min: null, max: null },
        outQuantity: { label: "Xuất trong kỳ", type: "range", min: null, max: null },
        endQuantity: { label: "Tồn cuối kỳ", type: "range", min: null, max: null },
    });
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);
    const [itemTypeAnchorEl, setItemTypeAnchorEl] = useState(null);
    const [selectedItemType, setSelectedItemType] = useState(""); // "", "PRODUCT", "MATERIAL"
    const [movementAnchorEl, setMovementAnchorEl] = useState(null);
    const [hasMovementOnly, setHasMovementOnly] = useState(null);

    const [reportData, setReportData] = useState([]);
    const [totalElements, setTotalElements] = useState(0);
    const [totalPages, setTotalPages] = useState(0);

    const fetchStockMovementReport = async (page = currentPage, size = pageSize) => {
        try {
            const res = await getStockMovementReportPaginated({
                page,
                size,
                search: searchTerm,
                startDate: startDate ? dayjs(startDate).format("YYYY-MM-DD") : null,
                endDate: endDate ? dayjs(endDate).format("YYYY-MM-DD") : null,
                itemType: selectedItemType,
                hasMovementOnly,
                quantityFilters,
            });

            const rawData = res.data;

            const dataWithSTT = rawData.content.map((item, index) => ({
                ...item,
                stt: page * size + index + 1,
            }));

            setReportData(dataWithSTT);
            setTotalElements(rawData.totalElements);
            setTotalPages(rawData.totalPages);
        } catch (error) {
            console.error("Error fetching stock movement report:", error);
        }
    };

    useEffect(() => {
        fetchStockMovementReport(currentPage, pageSize);
    }, [currentPage, pageSize, selectedItemType, hasMovementOnly, startDate, endDate, quantityFilters]);

    useEffect(() => {
        const now = dayjs();
        setStartDate(now.startOf("month").format("YYYY-MM-DD")); // ✅ ISO datetime
        setEndDate(now.endOf("month").format("YYYY-MM-DD"));     // ✅ ISO datetime
      }, []);

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
        fetchStockMovementReport(0, pageSize);
    };

    // Handle export to PDF
    const handleExportPDF = () => {
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
        doc.text("BÁO CÁO XUẤT NHẬP TỒN", 150, 40, { align: "center" });

        doc.setFont("Roboto", "normal");
        doc.setFontSize(9);
        doc.text(`Từ ngày ${dayjs(startDate).format("DD/MM/YYYY")} đến ngày ${dayjs(endDate).format("DD/MM/YYYY")}`, 150, 45, { align: "center" });

        const totalBeginQty = reportData.reduce((sum, item) => sum + (item.beginQuantity || 0), 0);
        const totalInQty = reportData.reduce((sum, item) => sum + (item.inQuantity || 0), 0);
        const totalOutQty = reportData.reduce((sum, item) => sum + (item.outQuantity || 0), 0);
        const totalEndQty = reportData.reduce((sum, item) => sum + (item.endQuantity || 0), 0);

        autoTable(doc, {
            startY: 55,
            head: [[
                { content: "STT", styles: { halign: 'center', cellWidth: 15 } },
                { content: "Mã hàng", styles: { halign: 'center', cellWidth: 50 } },
                { content: "Tên hàng", styles: { halign: 'center', cellWidth: 80 } },
                { content: "Đơn vị", styles: { halign: 'center' }, cellWidth: 20 },
                { content: "Tồn đầu kỳ", styles: { halign: 'center', cellWidth: 25 } },
                { content: "Nhập trong kỳ", styles: { halign: 'center', cellWidth: 30 } },
                { content: "Xuất trong kỳ", styles: { halign: 'center', cellWidth: 25 } },
                { content: "Tồn cuối kỳ", styles: { halign: 'center' }, cellWidth: 25 },
            ]],
            body: [
                ...reportData.map((item, index) => [
                    { content: index + 1, styles: { halign: 'center' } },
                    { content: item.itemCode, styles: { halign: 'left' } },
                    { content: item.itemName, styles: { halign: 'left' } },
                    { content: item.itemUnit, styles: { halign: 'center' } },
                    { content: item.beginQuantity, styles: { halign: 'center' } },
                    { content: item.inQuantity, styles: { halign: 'center' } },
                    { content: item.outQuantity, styles: { halign: 'center' } },
                    { content: item.endQuantity, styles: { halign: 'center' } },
                ]),
                [
                    { content: "TỔNG CỘNG :", colSpan: 4, styles: { halign: 'right', fontStyle: 'bold' } },
                    { content: totalBeginQty, styles: { halign: 'center', fontStyle: 'bold' } },
                    { content: totalInQty, styles: { halign: 'center', fontStyle: 'bold' } },
                    { content: totalOutQty, styles: { halign: 'center', fontStyle: 'bold' } },
                    { content: totalEndQty, styles: { halign: 'center', fontStyle: 'bold' } },
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
                cellPadding: { top: 3, bottom: 3 },
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

        doc.save("BaoCaoXuatNhapTon.pdf");
    };

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
            minWidth: 500,
            editable: false,
            filterable: false,
            //dùng renderCell để cấu hình data
        },
        {
            field: 'itemUnit',
            headerName: 'Đơn vị',
            flex: 1,
            minWidth: 120,
            editable: false,
            filterable: false,
            //dùng renderCell để cấu hình data
        },
        {
            field: 'beginQuantity',
            headerName: 'SL tồn đầu kỳ',
            flex: 1,
            minWidth: 135,
            editable: false,
            filterable: false,
            //dùng renderCell để cấu hình data
        },
        {
            field: 'inQuantity',
            headerName: 'SL nhập trong kỳ',
            flex: 1,
            minWidth: 135,
            editable: false,
            filterable: false,
            //dùng renderCell để cấu hình data
        },
        {
            field: 'outQuantity',
            headerName: 'SL xuất trong kỳ',
            flex: 1,
            minWidth: 135,
            editable: false,
            filterable: false,
            //dùng renderCell để cấu hình data
        },
        {
            field: 'endQuantity',
            headerName: 'SL tồn cuối kỳ',
            flex: 1,
            minWidth: 135,
            editable: false,
            filterable: false,
            //dùng renderCell để cấu hình data
        },
    ];

    const filteredData = reportData.filter((item) => {
        const matchesSearch =
            item.itemCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.itemName.toLowerCase().includes(searchTerm.toLowerCase());

        const issueDate = dayjs(item.issueDate);
        const matchesStart = startDate ? issueDate.isAfter(dayjs(startDate).startOf("day")) || issueDate.isSame(dayjs(startDate).startOf("day")) : true;
        const matchesEnd = endDate ? issueDate.isBefore(dayjs(endDate).endOf("day")) || issueDate.isSame(dayjs(endDate).endOf("day")) : true;

        const matchesAllQuantities = Object.entries(quantityFilters).every(([key, f]) => {
            const value = item[key];
            if (f.type === "lt") return f.max == null || value <= f.max;
            if (f.type === "gt") return f.min == null || value >= f.min;
            if (f.type === "eq") return f.min == null || value === f.min;
            return (f.min == null || value >= f.min) && (f.max == null || value <= f.max);
        });

        return matchesSearch && matchesStart && matchesEnd && matchesAllQuantities;
    });

    const pageCount = Math.ceil(filteredData.length / pageSize);
    const paginatedData = filteredData.slice(currentPage * pageSize, (currentPage + 1) * pageSize);

    return (
        <div className="mb-8 flex flex-col gap-12" style={{ height: 'calc(100vh-100px)' }}>
            <Card className="bg-gray-50 p-7 rounded-none shadow-none">
                <CardBody className="pb-2 bg-white rounded-xl">
                    <PageHeader
                        title="Báo cáo xuất nhập tồn"
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

                        {/* Filter by quantity */}
                        <QuantityFilterButton
                            anchorEl={quantityAnchorEl}
                            setAnchorEl={setQuantityAnchorEl}
                            filters={quantityFilters}
                            setFilters={setQuantityFilters}
                            buttonLabel="Số lượng"
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

                        {/* Filter by movement activity */}
                        <Button
                            onClick={(e) => setMovementAnchorEl(e.currentTarget)}
                            size="sm"
                            variant={hasMovementOnly !== null ? "outlined" : "contained"}
                            sx={{
                                ...(hasMovementOnly
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
                                {hasMovementOnly === true
                                    ? "Chỉ hàng có biến động"
                                    : hasMovementOnly === false
                                        ? "Tất cả hàng hóa"
                                        : "Lọc biến động"}
                                <FaAngleDown className="h-4 w-4" />
                            </span>
                        </Button>

                        <Menu
                            anchorEl={movementAnchorEl}
                            open={Boolean(movementAnchorEl)}
                            onClose={() => setMovementAnchorEl(null)}
                            anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
                        >
                            {[
                                { label: "Tất cả hàng hóa", value: false },
                                { label: "Chỉ hàng có biến động", value: true },
                            ].map((option) => (
                                <MenuItem
                                    key={option.label}
                                    onClick={() => {
                                        setHasMovementOnly(option.value);
                                        setMovementAnchorEl(null);
                                        setCurrentPage(0);
                                    }}
                                    sx={{ paddingLeft: "7px", minWidth: "200px" }}
                                >
                                    <Checkbox
                                        color="success"
                                        size="small"
                                        checked={hasMovementOnly === option.value}
                                    />
                                    <ListItemText primary={option.label} />
                                </MenuItem>
                            ))}

                            {hasMovementOnly !== null && (
                                <div className="flex justify-end">
                                    <Button
                                        variant="text"
                                        size="medium"
                                        onClick={() => {
                                            setHasMovementOnly(null);
                                            setCurrentPage(0);
                                            setMovementAnchorEl(null);
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
                        data={reportData}
                        columnsConfig={columnsConfig}
                        enableSelection={false}
                    />

                    {/* Pagination */}
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
        </div>
    );
};

export default StockMovementReportPage;