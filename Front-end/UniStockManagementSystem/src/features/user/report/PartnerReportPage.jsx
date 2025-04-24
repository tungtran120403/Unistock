import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ReactPaginate from "react-paginate";
import { Card, CardBody, Typography } from "@material-tailwind/react";
import { ArrowRightIcon, ArrowLeftIcon } from "@heroicons/react/24/outline";
import PageHeader from '@/components/PageHeader';
import TableSearch from '@/components/TableSearch';
import Table from "@/components/Table";
import QuantityFilterButton from "@/components/QuantityFilterButton";
import dayjs from "dayjs";
import "dayjs/locale/vi"; // Import Tiếng Việt

const PartnerReportPage = () => {
    const [currentPage, setCurrentPage] = useState(0);
    const [pageSize, setPageSize] = useState(5);
    const [searchTerm, setSearchTerm] = useState("");
    const navigate = useNavigate();
    const [quantityAnchorEl, setQuantityAnchorEl] = useState(null);
    const [quantityFilters, setQuantityFilters] = useState({
        totalSaleOrder: { label: "Tổng số đơn bán hàng", type: "range", min: null, max: null },
        totalPurchaseOrder: { label: "Tổng số đơn mua hàng", type: "range", min: null, max: null },
        totalOutsourcingOrder: { label: "Tổng số đơn gia công", type: "range", min: null, max: null },
        totalReturnOrder: { label: "Tổng số đơn trả lại", type: "range", min: null, max: null },
    });

    // // Fetch data on component mount and when page or size changes
    // useEffect(() => {
    //   fetchPaginatedReceiptNotes(currentPage, pageSize);
    // }, [currentPage, pageSize]);

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
        // Reset to first page when searching
        setCurrentPage(0);
        fetchPaginatedReceiptNotes(0, pageSize, searchTerm);
    };

    const columnsConfig = [
        { field: 'stt', headerName: 'STT', flex: 1, minWidth: 50, editable: false, filterable: false },
        {
            field: 'partnerName',
            headerName: 'Tên đối tác',
            flex: 2,
            minWidth: 650,
            editable: false,
            filterable: false,
            //dùng renderCell để cấu hình data
        },
        {
            field: 'totalSaleOrder',
            headerName: 'Tổng số đơn bán hàng',
            flex: 1,
            minWidth: 200,
            editable: false,
            filterable: false,
            //dùng renderCell để cấu hình data
        },
        {
            field: 'totalPurchaseOrder',
            headerName: 'Tổng số đơn mua hàng',
            flex: 1,
            minWidth: 200,
            editable: false,
            filterable: false,
            //dùng renderCell để cấu hình data
        },
        {
            field: 'totalOutsourcingOrder',
            headerName: 'Tổng số đơn gia công',
            flex: 1,
            minWidth: 200,
            editable: false,
            filterable: false,
            //dùng renderCell để cấu hình data
        },
        {
            field: 'totalReturnOrder',
            headerName: 'Tổng số đơn trả lại',
            flex: 1,
            minWidth: 200,
            editable: false,
            filterable: false,
            //dùng renderCell để cấu hình data
        },
    ];

    //   const data = receiptNotes.map((receipt) => ({
    //     grnId: receipt.grnId,
    //     receiptCode: receipt.grnCode,
    //     category: receipt.category || 'không có dữ liệu',
    //     createdDate: receipt.receiptDate,
    //     createBy: receipt.createdBy,
    //     reference: {
    //       id: receipt.poId || "N/A",
    //       type: "PURCHASE_ORDER"
    //     }
    //   }));

    const data = [
        {
            id: 1,
            stt: 1,
            partnerName: "Công ty TNHH ABC Việt Nam",
            totalSaleOrder: 12,
            totalPurchaseOrder: 5,
            totalOutsourcingOrder: 3,
            totalReturnOrder: 2,
        },
        {
            id: 2,
            stt: 2,
            partnerName: "Công ty Cổ phần Thiết bị Số",
            totalSaleOrder: 8,
            totalPurchaseOrder: 10,
            totalOutsourcingOrder: 1,
            totalReturnOrder: 0,
        },
        {
            id: 3,
            stt: 3,
            partnerName: "Nhà cung cấp Công Nghiệp Bắc Ninh",
            totalSaleOrder: 4,
            totalPurchaseOrder: 18,
            totalOutsourcingOrder: 0,
            totalReturnOrder: 1,
        },
        {
            id: 4,
            stt: 4,
            partnerName: "Công ty TNHH Thịnh Phát",
            totalSaleOrder: 16,
            totalPurchaseOrder: 2,
            totalOutsourcingOrder: 0,
            totalReturnOrder: 0,
        },
        {
            id: 5,
            stt: 5,
            partnerName: "Gia công cơ khí Minh Khoa",
            totalSaleOrder: 0,
            totalPurchaseOrder: 0,
            totalOutsourcingOrder: 9,
            totalReturnOrder: 0,
        },
        {
            id: 6,
            stt: 6,
            partnerName: "Công ty TNHH Giao Nhận Hoàng Long",
            totalSaleOrder: 6,
            totalPurchaseOrder: 3,
            totalOutsourcingOrder: 0,
            totalReturnOrder: 1,
        },
        {
            id: 7,
            stt: 7,
            partnerName: "Công ty TNHH Kỹ thuật điện Hưng Thịnh",
            totalSaleOrder: 11,
            totalPurchaseOrder: 6,
            totalOutsourcingOrder: 0,
            totalReturnOrder: 2,
        },
        {
            id: 8,
            stt: 8,
            partnerName: "Nhà máy sản xuất Lê Minh",
            totalSaleOrder: 2,
            totalPurchaseOrder: 14,
            totalOutsourcingOrder: 1,
            totalReturnOrder: 0,
        },
        {
            id: 9,
            stt: 9,
            partnerName: "Đại lý phân phối Ánh Dương",
            totalSaleOrder: 19,
            totalPurchaseOrder: 0,
            totalOutsourcingOrder: 0,
            totalReturnOrder: 3,
        },
        {
            id: 10,
            stt: 10,
            partnerName: "Công ty TNHH Long Thành",
            totalSaleOrder: 9,
            totalPurchaseOrder: 7,
            totalOutsourcingOrder: 2,
            totalReturnOrder: 1,
        },
    ]

    const filteredData = data.filter((item) => {
        const matchesSearch =
            item.partnerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.partnerTypes?.some((pt) =>
                pt.partnerCode.toLowerCase().includes(searchTerm.toLowerCase())
            );

        const matchesAllQuantities = Object.entries(quantityFilters).every(([key, f]) => {
            const value = item[key];
            if (f.type === "lt") return f.max == null || value <= f.max;
            if (f.type === "gt") return f.min == null || value >= f.min;
            if (f.type === "eq") return f.min == null || value === f.min;
            return (f.min == null || value >= f.min) && (f.max == null || value <= f.max);
        });

        return matchesSearch && matchesAllQuantities;
    });

    const pageCount = Math.ceil(filteredData.length / pageSize);
    const paginatedData = filteredData.slice(currentPage * pageSize, (currentPage + 1) * pageSize);

    return (
        <div className="mb-8 flex flex-col gap-12" style={{ height: 'calc(100vh-100px)' }}>
            <Card className="bg-gray-50 p-7 rounded-none shadow-none">
                <CardBody className="pb-2 bg-white rounded-xl">
                    <PageHeader
                        title="Báo cáo theo đối tác"
                        showAdd={false}
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
                                Trang {currentPage + 1} / {pageCount || 1} • {filteredData.length} bản ghi
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

export default PartnerReportPage;