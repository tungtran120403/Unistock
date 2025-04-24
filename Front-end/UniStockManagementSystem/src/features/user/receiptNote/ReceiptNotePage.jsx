import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import ReactPaginate from "react-paginate";
import { Card, CardHeader, CardBody, Typography, Tooltip } from "@material-tailwind/react";
import { FaPlus, FaEye, FaAngleDown } from "react-icons/fa";
import { ArrowRightIcon, ArrowLeftIcon } from "@heroicons/react/24/outline";

import {
  IconButton,
  Menu as MuiMenu,
  MenuItem,
  Button,
  Checkbox,
  ListItemText,
} from "@mui/material";

import {
  VisibilityOutlined,
} from '@mui/icons-material';
import PageHeader from '@/components/PageHeader';
import TableSearch from '@/components/TableSearch';
import Table from "@/components/Table";
import SuccessAlert from "@/components/SuccessAlert";
import useUser from "../../admin/users/useUser";
import usePurchaseOrder from "../purchaseOrder/usePurchaseOrder";
import useReceiptNote from "./useReceiptNote";
import { getNextCode } from "./receiptNoteService";
import "dayjs/locale/vi"; // Import Tiếng Việt
import DateFilterButton from "@/components/DateFilterButton";
import dayjs from "dayjs";
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

const ReceiptNotePage = () => {
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();
  const { getUserById } = useUser();
  const { getPurchaseOrderById } = usePurchaseOrder();
  const [usernames, setUsernames] = useState({});
  const [purchaseOrders, setPurchaseOrders] = useState({});

  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [categoryAnchorEl, setCategoryAnchorEl] = useState(null);
  const [selectedCategories, setSelectedCategories] = useState([]);

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

  const {
    receiptNotes,
    totalPages,
    totalElements,
    fetchPaginatedReceiptNotes
  } = useReceiptNote();

  const categoryList = [
    "Thành phẩm sản xuất",
    "Hàng hoá gia công",
    "Hàng hóa trả lại",
    "Vật tư mua bán",
    "Vật tư thừa sau sản xuất",
    "Khác",
  ];

  // Fetch data on component mount and when page or size changes
  useEffect(() => {
    fetchPaginatedReceiptNotes(currentPage, pageSize, searchTerm, selectedCategories, startDate, endDate);
  }, [currentPage, pageSize, searchTerm, selectedCategories, startDate, endDate]);

  // Fetch thông tin user và đơn hàng

  // Handle page change
  const handlePageChange = (selectedPage) => {
    setCurrentPage(selectedPage);
  };

  // Handle page change from ReactPaginate
  const handlePageChangeWrapper = (selectedItem) => {
    handlePageChange(selectedItem.selected);
  };

  // Handle view or edit receipt
  const handleViewReceipt = (receipt) => {
    navigate(`/user/receiptNote/${receipt.grnId}`);
    console.log(receipt.grnId);
  };

  // Handle search
  const handleSearch = () => {
    setCurrentPage(0);
    fetchPaginatedReceiptNotes(0, pageSize, searchTerm, selectedCategories, startDate, endDate);
  };

  const columnsConfig = [
    { field: 'index', headerName: 'STT', flex: 0.5, minWidth: 50, editable: false, filterable: false },
    { field: 'receiptCode', headerName: 'Mã phiếu nhập', flex: 1.5, minWidth: 150, editable: false, filterable: false },
    { field: 'category', headerName: 'Phân loại nhập kho', flex: 2, minWidth: 100, editable: false, filterable: false },
    {
      field: 'createdDate',
      headerName: 'Ngày lập phiếu',
      flex: 1.5,
      minWidth: 150,
      editable: false,
      filterable: false,
      renderCell: (params) => new Date(params.value).toLocaleDateString("vi-VN"),
    },
    {
      field: 'createBy',
      headerName: 'Người tạo phiếu',
      flex: 1.5,
      minWidth: 150,
      editable: false,
      filterable: false,
      renderCell: (params) => {
        return params.value && params.value !== " "
          ? params.value
          : "Không có dữ liệu";
      },
    },
    {
      field: 'reference',
      headerName: 'Tham chiếu',
      flex: 1.5,
      minWidth: 150,
      editable: false,
      filterable: false,
      renderCell: (params) => {
        const receipt = params.row;
        const label = receipt.poCode || receipt.ginCode || "-";

        const getPath = () => {
          if (receipt.poId && receipt.poCode) return `/user/purchaseOrder/${receipt.poId}`;
          if (receipt.ginId && receipt.ginCode) return `/user/issueNote/${receipt.ginId}`;
          return null;
        };

        const path = getPath();

        return path ? (
          <span
            onClick={() => navigate(path)}
            className="text-blue-600 hover:underline cursor-pointer"
          >
            {label}
          </span>
        ) : (
          <span>{label}</span>
        );
      },
    },
    {
      field: 'actions',
      headerName: 'Hành động',
      flex: 0.5,
      minWidth: 100,
      editable: false,
      filterable: false,
      renderCell: (params) => (
        <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
          <Tooltip content="Xem chi tiết">
            <IconButton
              size="small"
              color="primary"
              onClick={() => handleViewReceipt(params.row)}
            >
              <VisibilityOutlined />
            </IconButton>
          </Tooltip>
        </div>
      ),
    },
  ];

  const filteredNotes = receiptNotes.filter((receipt) => {
    const matchesSearch = receipt.grnCode?.toLowerCase().includes(searchTerm.toLowerCase());

    const receiptDate = receipt.receiptDate ? dayjs(receipt.receiptDate) : null;
    const matchesStart = startDate ? receiptDate?.isSameOrAfter(dayjs(startDate), 'day') : true;
    const matchesEnd = endDate ? receiptDate?.isSameOrBefore(dayjs(endDate), 'day') : true;

    const matchesCategory = selectedCategories.length === 0 || selectedCategories.includes(receipt.category);
    return matchesSearch && matchesStart && matchesEnd && matchesCategory;
  });

  const data = receiptNotes.map((receipt, index) => ({
    grnId: receipt.grnId,
    index: currentPage * pageSize + index + 1,
    receiptCode: receipt.grnCode,
    category: receipt.category || 'không có dữ liệu',
    createdDate: receipt.receiptDate,
    createBy: `${receipt.createdByUsername}` || `${receipt.createdByEmail}`,
    poId: receipt.poId,
    ginId: receipt.ginId,
    poCode: receipt.poCode,
    ginCode: receipt.ginCode,
  }));

  return (
    <div className="mb-8 flex flex-col gap-12" style={{ height: 'calc(100vh-100px)' }}>
      <Card className="bg-gray-50 p-7 rounded-none shadow-none">
        <CardBody className="pb-2 bg-white rounded-xl">
          <PageHeader
            showImport={false}
            showExport={false}
            title="Danh sách phiếu nhập kho"
            addButtonLabel="Thêm phiếu nhập"
            onAdd={async () => {
              try {
                const code = await getNextCode();
                navigate("/user/receiptNote/general", { state: { nextCode: code } });
              } catch (error) {
                console.error("Không lấy được mã phiếu nhập:", error);
              }
            }}
          // customButtons={
          //   <Menu placement="bottom-end">
          //     <MenuHandler>
          //       <Button
          //         size="sm"
          //         color="white"
          //         className="bg-[#0ab067] hover:bg-[#089456]/90 shadow-none hover:shadow-none text-white font-medium py-2 px-4 rounded-[4px] transition-all duration-200 ease-in-out"
          //         variant="contained"
          //         ripple={true}
          //       >
          //         <div className='flex items-center gap-2'>
          //           <FaPlus className="h-4 w-4" />
          //           <span>Thêm Phiếu Nhập</span>
          //         </div>
          //       </Button>
          //     </MenuHandler>
          //     <MenuList>
          //       <MenuItem
          //         className="hover:bg-green-900/10 rounded-[4px]"
          //         onClick={() => navigate("/user/purchaseOrder")}
          //       >
          //         <span className="text-gray-700 hover:text-green-900">Vật tư mua bán</span>
          //       </MenuItem>
          //       <MenuItem
          //         className="hover:bg-green-900/10 rounded-[4px]"
          //         onClick={() => navigate("/user/receiptNote/general")}
          //       >
          //         <span className="text-gray-700 hover:text-green-900">Thành phẩm sản xuất</span>
          //       </MenuItem>
          //       <MenuItem
          //         className="hover:bg-green-900/10 rounded-[4px]"
          //         onClick={() => navigate("/user/issueNote")}
          //       >
          //         <span className="text-gray-700 hover:text-green-900">Hàng hóa gia công</span>
          //       </MenuItem>
          //       <MenuItem
          //         className="hover:bg-green-900/10 rounded-[4px]"
          //         onClick={() => navigate("/user/receiptNote/manual", { state: { category: "Hàng hóa trả lại" } })}
          //       >
          //         <span className="text-gray-700 hover:text-green-900">Hàng hóa trả lại</span>
          //       </MenuItem>
          //     </MenuList>
          //   </Menu>
          // }
          />
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

            <div className="mb-3 flex flex-wrap items-center gap-4">

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
                        <span className="text-xs bg-[#089456] text-white p-1 rounded-xl font-thin ">
                          +{selectedCategories.length - 1}
                        </span>
                      )}
                    </span>
                  ) : (
                    <span className="flex items-center gap-[5px]">
                      Phân loại nhập
                      <FaAngleDown className="h-4 w-4" />
                    </span>
                  )}
                </Button>

                <MuiMenu
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
                          ? selectedCategories.filter((c) => c !== category)
                          : [...selectedCategories, category];
                        setSelectedCategories(updated);
                      }}
                      sx={{ paddingLeft: "7px", minWidth: "200px" }}
                    >
                      <Checkbox
                        color="success"
                        size="small"
                        checked={selectedCategories.includes(category)}
                      />
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
                          fetchPaginatedReceiptNotes(0, pageSize, searchTerm, [], startDate, endDate);
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
                </MuiMenu>

              </div>

              {/* Search input */}
              <div className="w-[250px]">
                <TableSearch
                  value={searchTerm}
                  onChange={setSearchTerm}
                  onSearch={handleSearch}
                  placeholder="Tìm kiếm phiếu nhập"
                />
              </div>
            </div>
          </div>

          <Table
            data={data}
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

      <SuccessAlert
        open={showSuccessAlert}
        onClose={() => setShowSuccessAlert(false)}
        message={alertMessage}
      />
    </div>
  );
};

export default ReceiptNotePage;