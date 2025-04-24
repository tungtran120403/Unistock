import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ReactPaginate from "react-paginate";
import { Card, CardBody, Typography } from "@material-tailwind/react";
import { ArrowRightIcon, ArrowLeftIcon } from "@heroicons/react/24/outline";
import PageHeader from '@/components/PageHeader';
import TableSearch from '@/components/TableSearch';
import Table from "@/components/Table";
import QuantityFilterButton from "@/components/QuantityFilterButton";
import StatusFilterButton from "@/components/StatusFilterButton";
import DateFilterButton from "@/components/DateFilterButton";
import dayjs from "dayjs";
import "dayjs/locale/vi"; // Import Tiếng Việt

const SaleOrderReportPage = () => {
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(5);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();
  const [quantityAnchorEl, setQuantityAnchorEl] = useState(null);
  const [quantityFilters, setQuantityFilters] = useState({
    receivedQuantity: { label: "Đã nhập", type: "range", min: null, max: null },
    remainingQuantity: { label: "Còn thiếu", type: "range", min: null, max: null },
  });
  const [statusAnchorEl, setStatusAnchorEl] = useState(null);
  const [selectedStatuses, setSelectedStatuses] = useState([]);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);

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

  const allStatuses = [
    {
      value: "PROCESSING",
      label: "Đang xử lý",
      className: "bg-blue-50 text-blue-800",
    },
    {
      value: "PREPARING_MATERIAL",
      label: "Đang chuẩn bị vật tư",
      className: "bg-yellow-100 text-amber-800",
    },
    {
      value: "CANCELLED",
      label: "Đã huỷ",
      className: "bg-red-50 text-red-800",
    },
    {
      value: "COMPLETED",
      label: "Đã hoàn thành",
      className: "bg-green-50 text-green-800",
    },
  ];

  const columnsConfig = [
    { field: 'stt', headerName: 'STT', flex: 1, minWidth: 50, editable: false, filterable: false },
    { field: 'orderCode', headerName: 'Mã đơn hàng', flex: 1, minWidth: 100, editable: false, filterable: false },
    {
      field: 'orderDate',
      headerName: 'Ngày lập phiếu',
      flex: 1.5,
      minWidth: 150,
      editable: false,
      filterable: false,
      renderCell: (params) => params.value ? dayjs(params.value).format("DD/MM/YYYY") : "",
    },
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
      field: 'receivedQuantity',
      headerName: 'Số lượng đã nhập',
      flex: 1,
      minWidth: 135,
      editable: false,
      filterable: false,
      //dùng renderCell để cấu hình data
    },
    {
      field: 'remainingQuantity',
      headerName: 'Số lượng còn thiếu',
      flex: 1,
      minWidth: 135,
      editable: false,
      filterable: false,
      //dùng renderCell để cấu hình data
    },
    {
      field: 'orderStatus',
      headerName: 'Trạng thái đơn hàng',
      flex: 1.5,
      minWidth: 200,
      editable: false,
      filterable: false,
      renderCell: (params) => {
        const status = allStatuses.find((s) => s.value === params.value);
        if (!status) return params.value;

        return (
          <div
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${status.className}`}
          >
            {status.label}
          </div>
        );
      }
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
      orderCode: "DH001",
      orderDate: "2025-03-01",
      itemCode: "VT001",
      itemName: "Khung xe điện",
      receivedQuantity: 50,
      remainingQuantity: 10,
      orderStatus: "PREPARING_MATERIAL",
    },
    {
      id: 2,
      stt: 2,
      orderCode: "DH002",
      orderDate: "2025-03-05",
      itemCode: "VT002",
      itemName: "Bánh xe sau",
      receivedQuantity: 80,
      remainingQuantity: 0,
      orderStatus: "COMPLETED",
    },
    {
      id: 3,
      stt: 3,
      orderCode: "DH003",
      orderDate: "2025-03-07",
      itemCode: "VT003",
      itemName: "Động cơ điện 500W",
      receivedQuantity: 30,
      remainingQuantity: 20,
      orderStatus: "PROCESSING",
    },
    {
      id: 4,
      stt: 4,
      orderCode: "DH004",
      orderDate: "2025-03-10",
      itemCode: "VT004",
      itemName: "Bộ điều tốc",
      receivedQuantity: 100,
      remainingQuantity: 0,
      orderStatus: "COMPLETED",
    },
    {
      id: 5,
      stt: 5,
      orderCode: "DH005",
      orderDate: "2025-03-12",
      itemCode: "VT005",
      itemName: "Yên xe thể thao",
      receivedQuantity: 20,
      remainingQuantity: 30,
      orderStatus: "PROCESSING",
    },
    {
      id: 6,
      stt: 6,
      orderCode: "DH006",
      orderDate: "2025-03-15",
      itemCode: "VT006",
      itemName: "Đèn pha LED",
      receivedQuantity: 60,
      remainingQuantity: 10,
      orderStatus: "PREPARING_MATERIAL",
    },
    {
      id: 7,
      stt: 7,
      orderCode: "DH007",
      orderDate: "2025-03-18",
      itemCode: "VT007",
      itemName: "Còi điện",
      receivedQuantity: 35,
      remainingQuantity: 5,
      orderStatus: "PROCESSING",
    },
    {
      id: 8,
      stt: 8,
      orderCode: "DH008",
      orderDate: "2025-03-20",
      itemCode: "VT008",
      itemName: "Bộ phanh thủy lực",
      receivedQuantity: 40,
      remainingQuantity: 20,
      orderStatus: "CANCELLED",
    },
    {
      id: 9,
      stt: 9,
      orderCode: "DH009",
      orderDate: "2025-03-22",
      itemCode: "VT009",
      itemName: "Tay lái thể thao",
      receivedQuantity: 25,
      remainingQuantity: 0,
      orderStatus: "COMPLETED",
    },
    {
      id: 10,
      stt: 10,
      orderCode: "DH010",
      orderDate: "2025-03-25",
      itemCode: "VT010",
      itemName: "Chân chống gập",
      receivedQuantity: 45,
      remainingQuantity: 5,
      orderStatus: "CANCELLED",
    },
  ]

  const filteredData = data.filter((item) => {
    const matchesSearch =
      item.itemCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.itemName.toLowerCase().includes(searchTerm.toLowerCase());

    const orderDate = dayjs(item.orderDate);
    const matchesStart = startDate ? orderDate.isAfter(dayjs(startDate).startOf("day")) || orderDate.isSame(dayjs(startDate).startOf("day")) : true;
    const matchesEnd = endDate ? orderDate.isBefore(dayjs(endDate).endOf("day")) || orderDate.isSame(dayjs(endDate).endOf("day")) : true;

    const matchesAllQuantities = Object.entries(quantityFilters).every(([key, f]) => {
      const value = item[key];
      if (f.type === "lt") return f.max == null || value <= f.max;
      if (f.type === "gt") return f.min == null || value >= f.min;
      if (f.type === "eq") return f.min == null || value === f.min;
      return (f.min == null || value >= f.min) && (f.max == null || value <= f.max);
    });

    const matchesStatus =
      selectedStatuses.length === 0 ||
      selectedStatuses.some((status) => status.value === item.orderStatus);

    return matchesSearch && matchesStart && matchesEnd && matchesAllQuantities && matchesStatus;
  });

  const pageCount = Math.ceil(filteredData.length / pageSize);
  const paginatedData = filteredData.slice(currentPage * pageSize, (currentPage + 1) * pageSize);

  return (
    <div className="mb-8 flex flex-col gap-12" style={{ height: 'calc(100vh-100px)' }}>
      <Card className="bg-gray-50 p-7 rounded-none shadow-none">
        <CardBody className="pb-2 bg-white rounded-xl">
          <PageHeader
            title="Báo cáo theo đơn đặt hàng"
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

            {/* Filter by status */}
            <StatusFilterButton
              anchorEl={statusAnchorEl}
              setAnchorEl={setStatusAnchorEl}
              selectedStatuses={selectedStatuses}
              setSelectedStatuses={setSelectedStatuses}
              allStatuses={allStatuses}
              buttonLabel="Trạng thái"
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

export default SaleOrderReportPage;