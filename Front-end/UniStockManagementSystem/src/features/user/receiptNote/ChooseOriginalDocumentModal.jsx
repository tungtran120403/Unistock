import React, { useState, useEffect } from "react";
import { Modal, Box, Typography, Button } from "@mui/material";
import TableSearch from "@/components/TableSearch";
import Table from "@/components/Table";
import ReactPaginate from "react-paginate";
import { ArrowLeftIcon, ArrowRightIcon } from "@heroicons/react/24/outline";
import dayjs from "dayjs";
import { fetchPendingOrInProgressOrders, getPurchaseOrderById } from "../purchaseOrder/purchaseOrderService";
import ProductRow from "../receiptNote/ProductRow";

const ModalChooseOrder = ({ onClose, onOrderSelected }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const data = await fetchPendingOrInProgressOrders();
        setPurchaseOrders(data);
      } catch (error) {
        console.error("Lỗi khi tải đơn mua hàng:", error);
      }
      setLoading(false);
    };

    fetchData();
  }, []);

  const handlePageChange = ({ selected }) => {
    setCurrentPage(selected);
  };

  const handleSelectOrder = async (orderId) => {
    try {
      const fullOrder = await getPurchaseOrderById(orderId);
      onOrderSelected(fullOrder);
      onClose();
    } catch (error) {
      console.error("Không thể lấy chi tiết đơn hàng:", error);
    }
  };

  const mappedOrders = purchaseOrders.map((order) => ({
    id: order.poId,
    code: order.poCode || "N/A",
    customer: order.supplierName || "N/A",
    date: order.orderDate || null,
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
    { field: "code", headerName: "Mã đơn hàng", flex: 0.8, minWidth: 80 },
    { field: "customer", headerName: "Khách hàng", flex: 3, minWidth: 200 },
    {
      field: "date",
      headerName: "Ngày tạo",
      flex: 0.8,
      minWidth: 80,
      renderCell: (params) =>
        params.value ? dayjs(params.value).format("DD/MM/YYYY") : "N/A",
    },
    {
      field: "actions",
      headerName: "Hành động",
      flex: 0.5,
      minWidth: 50,
      renderCell: (params) => (
        <Button
          size="small"
          variant="outlined"
          onClick={() => handleSelectOrder(params.row.id)}
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
          Chọn đơn mua hàng
        </Typography>

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
            placeholder="Tìm kiếm đơn mua hàng"
          />
        </div>

        <Table
          data={displayedOrders}
          columnsConfig={columnsConfig}
          loading={loading}
          enableSelection={false}
        />

        <div className="flex items-center justify-between border-t border-blue-gray-50 py-4">
          <Typography variant="small" color="blue-gray" className="font-normal">
            Trang {currentPage + 1} / {Math.ceil(filteredOrders.length / pageSize)} • {filteredOrders.length} bản ghi
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
