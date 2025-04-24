import React, { useState, useEffect } from "react";
import { Modal, Box, Typography, Button } from "@mui/material";
import TableSearch from "@/components/TableSearch";
import Table from "@/components/Table";
import ReactPaginate from "react-paginate";
import { ArrowLeftIcon, ArrowRightIcon } from "@heroicons/react/24/outline";
import useIssueNote from "./useIssueNote";
import dayjs from "dayjs";

const ModalChooseOrder = ({ onClose, onOrderSelected }) => {
  const { saleOrders, loading, fetchSaleOrders } = useIssueNote();
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    fetchSaleOrders(currentPage, pageSize);
  }, [currentPage, pageSize]);

  const handlePageChange = ({ selected }) => {
    setCurrentPage(selected);
  };

  const handleSelectOrder = (order) => {
    console.log("Selected order from modal:", order); // Log để kiểm tra dữ liệu
    onOrderSelected(order);
    onClose();
  };

  // Map dữ liệu từ API: API trả về đối tượng với các trường: orderId, orderCode, partnerCode, partnerName, orderDate, note, address, phoneNumber, contactName, orderDetails,...
  // Lưu luôn full order để sau khi chọn có thể fill đầy đủ thông tin.
  const mappedOrders = saleOrders.map((order) => ({
    id: order.orderId,
    code: order.orderCode || "N/A",
    customer: order.partnerName || "N/A",
    date: order.orderDate || null,
    note: order.note || "N/A", // Add note field
    fullOrder: order, // lưu toàn bộ đối tượng đơn hàng
  }));

  const filteredOrders = mappedOrders.filter(
    (order) =>
      order.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const displayedOrders = filteredOrders.slice(
    currentPage * pageSize,
    (currentPage + 1) * pageSize
  );

  const columnsConfig = [
    { field: "code", headerName: "Mã đơn hàng", flex: 1.5, minWidth: 120 },
    { field: "customer", headerName: "Khách hàng", flex: 2, minWidth: 200 },
    {
      field: "date",
      headerName: "Ngày tạo",
      flex: 1.5,
      minWidth: 100,
      renderCell: (params) =>
        params.value ? dayjs(params.value).format("DD/MM/YYYY") : "N/A",
    },
    {
      field: "actions",
      headerName: "Hành động",
      flex: 0.5,
      minWidth: 100,
      renderCell: (params) => (
        <Button
          size="small"
          variant="outlined"
          onClick={() => handleSelectOrder(params.row.fullOrder)}
        >
          Chọn
        </Button>
      ),
    },
  ];

  return (
    <Modal open={true} onClose={onClose}>
      <Box
        sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: 800,
          bgcolor: "background.paper",
          boxShadow: 24,
          p: 4,
          borderRadius: 2,
        }}
      >
        <Typography variant="h6" mb={2}>
          Chọn đơn hàng
        </Typography>

        {/* Search and Items per page */}
        <div className="py-2 flex items-center justify-between gap-2">
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
              {[5, 10, 20, 50].map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
            <Typography variant="small" color="blue-gray" className="font-normal">
              bản ghi mỗi trang
            </Typography>
          </div>

          <TableSearch
            value={searchTerm}
            onChange={setSearchTerm}
            onSearch={() => {
              console.log("Tìm kiếm đơn hàng:", searchTerm);
            }}
            placeholder="Tìm kiếm đơn hàng"
          />
        </div>

        {/* Table */}
        <Table
          data={displayedOrders}
          columnsConfig={columnsConfig}
          loading={loading}
          enableSelection={false}
        />

        {/* Pagination */}
        <div className="flex items-center justify-between border-t border-blue-gray-50 py-4">
          <Typography variant="small" color="blue-gray" className="font-normal">
            Trang {currentPage + 1} / {Math.ceil(filteredOrders.length / pageSize)} •{" "}
            {filteredOrders.length} bản ghi
          </Typography>
          <ReactPaginate
            previousLabel={<ArrowLeftIcon strokeWidth={2} className="h-4 w-4" />}
            nextLabel={<ArrowRightIcon strokeWidth={2} className="h-4 w-4" />}
            breakLabel="..."
            pageCount={Math.ceil(filteredOrders.length / pageSize)}
            marginPagesDisplayed={2}
            pageRangeDisplayed={5}
            onPageChange={handlePageChange}
            containerClassName="flex items-center gap-1"
            pageClassName="h-8 min-w-[32px] flex items-center justify-center rounded-md text-xs text-gray-700 border border-gray-300 hover:bg-gray-100"
            pageLinkClassName="flex items-center justify-center w-full h-full"
            previousClassName="h-8 min-w-[32px] flex items-center justify-center rounded-md text-xs text-gray-700 border border-gray-300 hover:bg-gray-100"
            nextClassName="h-8 min-w-[32px] flex items-center justify-center rounded-md text-xs text-gray-700 border border-gray-300 hover:bg-gray-100"
            breakClassName="h-8 min-w-[32px] flex items-center justify-center rounded-md text-xs text-gray-700"
            activeClassName="bg-[#0ab067] text-white border-[#0ab067] hover:bg-[#0ab067]"
            forcePage={currentPage}
            disabledClassName="opacity-50 cursor-not-allowed"
          />
        </div>
      </Box>
    </Modal>
  );
};

export default ModalChooseOrder;