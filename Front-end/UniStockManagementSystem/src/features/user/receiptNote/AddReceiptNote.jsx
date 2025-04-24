import React, { useState, useEffect } from "react";
import {
  Card,
  CardBody,
  Typography,
  Button,
  Select,
  Option,
} from "@material-tailwind/react";
import {
  TextField,
  MenuItem,
  Button as MuiButton,
  Divider
} from '@mui/material';
import { LocalizationProvider, DatePicker } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import "dayjs/locale/vi"; // Import Tiếng Việt
import { useLocation, useNavigate } from "react-router-dom";
import ReactPaginate from "react-paginate";
import { ArrowLeftIcon, ArrowRightIcon, ListBulletIcon } from "@heroicons/react/24/outline";
import { InformationCircleIcon } from "@heroicons/react/24/solid";
import { FaArrowLeft } from "react-icons/fa";
import PageHeader from '@/components/PageHeader';
import { getPurchaseOrderById } from "../purchaseOrder/purchaseOrderService";
import { getWarehouseList } from "../warehouse/warehouseService";
import ProductRow from "./ProductRow";
import FileUploadBox from '@/components/FileUploadBox';
import { createReceiptNote, uploadPaperEvidence as uploadPaperEvidenceService } from "./receiptNoteService";

// Hàm lấy ngày hiện tại YYYY-MM-DD
const getTodayDate = () => {
  const today = new Date();
  return today.toISOString().split("T")[0]; // Cắt chỉ lấy YYYY-MM-DD
};

// Hàm kiểm tra số lượng nhập hợp lệ (không được chênh lệch quá 1% so với số lượng đặt)
const isValidQuantity = (inputQty, orderedQty) => {
  if (!inputQty || isNaN(inputQty)) return false;

  const numInputQty = parseFloat(inputQty);
  const numOrderedQty = parseFloat(orderedQty);
  const minAllowed = 1;
  const maxAllowed = numOrderedQty * 1.01; // +1%

  return numInputQty >= minAllowed && numInputQty <= maxAllowed;
};

const AddReceiptNote = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [order, setOrder] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [description, setDescription] = useState("");
  const [referenceDocument, setReferenceDocument] = useState("");
  const [files, setFiles] = useState([]);
  const [orderDate, setOrderDate] = useState(getTodayDate());
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [warehouses, setWarehouses] = useState([]);
  const [itemWarehouses, setItemWarehouses] = useState({});
  const [manuallySelectedWarehouses, setManuallySelectedWarehouses] = useState({});
  const [itemQuantities, setItemQuantities] = useState({});
  // const [remainingQuantities, setRemainingQuantities] = useState({});
  const [quantityErrors, setQuantityErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [category, setCategory] = useState("");

  const { orderId, nextCode, saleOrderCode } = location.state || {};
  const [receiptCode, setReceiptCode] = useState(nextCode || "");
  const [rowsData, setRowsData] = useState({});

  console.log("Received orderId:", orderId);
  console.log("Received nextCode:", nextCode);

  // Xử lý thay đổi dữ liệu từ ProductRow
  const handleRowDataChange = (itemId, data) => {
    setRowsData(prev => ({
      ...prev,
      [itemId]: data
    }));
  };

  // Xử lý khi loại nhập kho thay đổi
  const handleReferenceDocumentChange = (value) => {
    setReferenceDocument(value);

    const defaultWarehouseCode = getDefaultWarehouse(value);

    setItemWarehouses(prev => {
      const updatedWarehouses = { ...prev };

      order.details.forEach(item => {
        if (!manuallySelectedWarehouses[item.materialId || item.productId]) {
          updatedWarehouses[item.materialId || item.productId] = defaultWarehouseCode;
        }
      });

      return updatedWarehouses;
    });

    // Cập nhật dữ liệu cho ProductRow
    setRowsData(prev => {
      const updatedRows = { ...prev };

      order.details.forEach(item => {
        if (!manuallySelectedWarehouses[item.materialId || item.productId]) {
          updatedRows[item.materialId || item.productId] = {
            ...updatedRows[item.materialId || item.productId],
            warehouse: defaultWarehouseCode,
          };
        }
      });

      return updatedRows;
    });
  };

  // Xử lý thay đổi kho cho sản phẩm
  const handleWarehouseChange = (itemId, warehouseCode) => {
    setItemWarehouses(prev => ({
      ...prev,
      [itemId]: warehouseCode
    }));

    // Đánh dấu rằng kho này đã được chọn thủ công
    setManuallySelectedWarehouses(prev => ({
      ...prev,
      [itemId]: true
    }));
  };

  // Xử lý thay đổi số lượng nhập
  const handleQuantityChange = (itemId, value, orderedQuantity, receivedQuantity) => {
    const remaining = orderedQuantity - receivedQuantity;
    const min = 1;
    const max = remaining * 1.01;
    const input = parseFloat(value);

    const isValid = input >= min && input <= max;

    setItemQuantities(prev => ({ ...prev, [itemId]: value }));

    if (!isValid) {
      setQuantityErrors(prev => ({
        ...prev,
        [itemId]: `Số lượng phải từ ${min} đến ${max.toFixed(2)}`
      }));
    } else {
      setQuantityErrors(prev => {
        const updated = { ...prev };
        delete updated[itemId];
        return updated;
      });
    }
  };


  // Xử lý upload file
  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    const validTypes = [
      "application/pdf", "image/png", "image/jpeg",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ];

    const validFiles = selectedFiles.filter(file => {
      if (file.size > 5 * 1024 * 1024) {
        alert(`File "${file.name}" vượt quá 5MB`);
        return false;
      }
      if (!validTypes.includes(file.type)) {
        alert(`File "${file.name}" không đúng định dạng được hỗ trợ`);
        return false;
      }
      return true;
    });

    const total = files.length + validFiles.length;
    if (total > 3) {
      alert("Chỉ được tải tối đa 3 file");
      return;
    }

    setFiles(prev => [...prev, ...validFiles]);
  };


  const handleRemoveFile = (index) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const handleSaveReceipt = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      // Kiểm tra dữ liệu
      const itemsWithMissingData = order.details.filter(item =>
        !rowsData[item.materialId || item.productId] || !rowsData[item.materialId || item.productId].warehouse
      );

      if (itemsWithMissingData.length > 0) {
        alert("Vui lòng chọn kho nhập cho tất cả sản phẩm!");
        setIsSubmitting(false);
        return;
      }

      // Kiểm tra lỗi số lượng
      const itemsWithErrors = order.details.filter(item =>
        rowsData[item.materialId || item.productId] && rowsData[item.materialId || item.productId].error
      );
      if (itemsWithErrors.length > 0) {
        alert("Vui lòng sửa các lỗi số lượng nhập trước khi lưu!");
        setIsSubmitting(false);
        return;
      }

      // Kiểm tra xem tất cả các sản phẩm đã có số lượng nhập chưa
      const itemsWithoutQuantity = order.details.filter(item => {
        const rowData = rowsData[item.materialId || item.productId] || {};
        return rowData.quantity === undefined || rowData.quantity === null || rowData.quantity === "";
      });
      if (itemsWithoutQuantity.length > 0) {
        alert("Vui lòng nhập số lượng cho tất cả sản phẩm!");
        setIsSubmitting(false);
        return;
      }

      // Chuẩn bị dữ liệu chi tiết
      const details = order.details.map(item => {
        const rowData = rowsData[item.materialId || item.productId];
        console.log("rowsData", rowsData);
        const warehouse = warehouses.find(w => w.warehouseCode === rowData?.warehouse);
        const warehouseId = warehouse ? warehouse.warehouseId : null;

        if (!warehouseId) {
          alert(`Không tìm thấy kho cho sản phẩm/vật tư: ${item.materialName || item.productName}`);
          return null;
        }

        return {
          warehouseId,
          materialId: item.materialId || null,
          productId: item.productId || null,
          quantity: parseFloat(rowData?.quantity) || 0,
          unitId: item.unitId || null,
        };
      }).filter(detail => detail !== null);

      const receiptData = {
        grnCode: receiptCode,
        poId: orderId,
        description: description,
        receiptDate: new Date().toISOString(),
        category: category,
        details: details
      };

      console.log("Dữ liệu phiếu nhập:", receiptData);

      // Gọi API tạo phiếu nhập
      const response = await createReceiptNote(receiptData);

      // Upload file nếu có
      if (files.length > 0) {
        await uploadPaperEvidenceService(response.grnId, "GOOD_RECEIPT_NOTE", files);
      }

      navigate("/user/receiptNote", { state: { successMessage: "Tạo phiếu nhập kho thành công!" } });
    } catch (error) {
      console.error("Lỗi khi lưu phiếu nhập:", error);

      let errorMessage = "Lỗi không xác định";

      if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error?.response?.data) {
        errorMessage = typeof error.response.data === 'string'
          ? error.response.data
          : JSON.stringify(error.response.data);
      } else if (error?.message) {
        errorMessage = error.message;
      }

      alert(`Lỗi khi lưu phiếu nhập: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };


  // Lấy danh sách kho
  useEffect(() => {
    const fetchWarehouses = async () => {
      try {
        const response = await getWarehouseList();

        console.log("Danh sách kho trả về từ API:", response);
        // Đảm bảo response có dữ liệu đúng định dạng
        if (response && Array.isArray(response.data)) {
          setWarehouses(response.data);
        } else if (Array.isArray(response)) {
          setWarehouses(response);
        } else {
          console.error("Dữ liệu kho không đúng định dạng:", response);
          setWarehouses([]);
        }
      } catch (error) {
        console.error("Lỗi khi lấy danh sách kho:", error);
        setWarehouses([]);
      }
    };

    fetchWarehouses();
  }, []);

  // Khởi tạo số lượng cho các sản phẩm
  useEffect(() => {
    if (order?.details?.length > 0) {
      const initialRowsData = {};
      order.details.forEach(item => {
        const remaining = item.orderedQuantity - (item.receivedQuantity || 0);
        initialRowsData[item.materialId || item.productId] = {
          quantity: remaining > 0 ? remaining : 0,
          remainingQuantity: 0,
          warehouse: itemWarehouses[item.materialId || item.productId] || "",
        };
      });
      setRowsData(initialRowsData);
    }
  }, [order]);


  // Lấy chi tiết đơn hàng và khởi tạo các giá trị mặc định
  useEffect(() => {
    if (!orderId) {
      setError("Không tìm thấy ID đơn hàng!");
      setLoading(false);
    } else {
      const fetchOrderDetail = async () => {
        try {
          if (order) return; // Ngăn gọi API nhiều lần
          console.log("📢 Gọi API lấy đơn hàng với ID:", orderId);
          const response = await getPurchaseOrderById(orderId);
          console.log("✅ Kết quả từ API:", response);

          setOrder(response);

          const initialQuantities = {};
          const initialWarehouses = {};

          if (response.details) {
            response.details.forEach(item => {
              initialQuantities[item.materialId || item.productId] = parseFloat(item.orderedQuantity) || 0;
              initialWarehouses[item.materialId || item.productId] = getDefaultWarehouse(referenceDocument);
            });
          }

          setItemQuantities(initialQuantities);
          setItemWarehouses(initialWarehouses);
        } catch (error) {
          console.error("❌ Lỗi khi lấy chi tiết đơn hàng:", error);
          setError("Không thể tải dữ liệu đơn hàng.");
        } finally {
          setLoading(false);
        }
      };

      fetchOrderDetail();
    }
  }, [orderId]);

  const totalPages = Math.ceil((order?.details?.length || 0) / pageSize);
  const totalElements = order?.details?.length || 0;

  // Kiểm tra nếu currentPage > totalPages khi dữ liệu thay đổi
  useEffect(() => {
    if (currentPage >= totalPages) {
      setCurrentPage(totalPages > 0 ? totalPages - 1 : 0);
    }
  }, [order?.details, totalPages, currentPage]);

  // Handle page change
  const handlePageChange = (selectedPage) => {
    setCurrentPage(selectedPage);
  };

  // Handle page change from ReactPaginate
  const handlePageChangeWrapper = (selectedItem) => {
    handlePageChange(selectedItem.selected);
  };
  if (loading) return <Typography>Đang tải dữ liệu...</Typography>;
  if (error) return <Typography className="text-red-500">{error}</Typography>;

  const items = order?.details || [];

  // Lấy danh sách sản phẩm hiển thị theo trang hiện tại
  const displayedItems = items.slice(currentPage * pageSize, (currentPage + 1) * pageSize);

  return (
    <div className="mb-8 flex flex-col gap-12" style={{ height: 'calc(100vh-100px)' }}>
      <Card className="bg-gray-50 p-7 rounded-none shadow-none">
        <CardBody className="pb-2 bg-white rounded-xl">
          <PageHeader
            title={"Phiếu nhập kho " + receiptCode}
            showAdd={false}
            showImport={false}
            showExport={false}
          />

          {/* Thông tin chung */}
          <Typography variant="h6" className="flex items-center mb-4 text-black">
            <InformationCircleIcon className="h-5 w-5 mr-2" />
            Thông tin chung
          </Typography>
          <div className="grid grid-cols-3 gap-x-12 gap-y-4 mb-4">
            <div>
              <Typography variant="medium" className="mb-1 text-black">
                Phân loại nhập kho <span className="text-red-500">*</span>
              </Typography>
              <TextField
                fullWidth
                size="small"
                color="success"
                variant="outlined"
                value="Vật tư mua bán"
                disabled
                sx={{
                  '& .MuiInputBase-root.Mui-disabled': {
                    bgcolor: '#eeeeee',
                    '& .MuiOutlinedInput-notchedOutline': {
                      border: 'none',
                    },
                  },
                }}
              />
            </div>
            <div>
              <Typography variant="medium" className="mb-1 text-black">
                Tham chiếu chứng từ gốc
              </Typography>
              <TextField
                hiddenLabel
                color="success"
                value={
                  [order?.poCode, saleOrderCode].filter(Boolean).join(" - ")
                }
                fullWidth
                disabled
                size="small"
                sx={{
                  '& .MuiInputBase-root.Mui-disabled': {
                    bgcolor: '#eeeeee',
                    '& .MuiOutlinedInput-notchedOutline': {
                      border: 'none',
                    },
                  },
                }}
              />
            </div>
            <div>
              <Typography variant="medium" className="mb-1 text-black">
                Ngày lập phiếu
              </Typography>
              <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="vi">
                <style>
                  {`.MuiPickersCalendarHeader-label { text-transform: capitalize !important; }`}
                </style>
                <DatePicker
                  value={orderDate ? dayjs(orderDate) : null}
                  onChange={(newValue) => {
                    if (newValue) {
                      setOrderDate(newValue.format("YYYY-MM-DD"));
                    }
                  }}
                  format="DD/MM/YYYY"
                  dayOfWeekFormatter={(weekday) => `${weekday.format("dd")}`}
                  slotProps={{
                    textField: {
                      hiddenLabel: true,
                      fullWidth: true,
                      size: "small",
                      color: "success",
                    },
                    day: {
                      sx: () => ({
                        "&.Mui-selected": {
                          backgroundColor: "#0ab067 !important",
                          color: "white",
                        },
                        "&.Mui-selected:hover": {
                          backgroundColor: "#089456 !important",
                        },
                        "&:hover": {
                          backgroundColor: "#0894561A !important",
                        },
                      }),
                    },
                  }}
                />
              </LocalizationProvider>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-x-12 gap-y-4 mb-4">
            <div>
              <Typography variant="medium" className="mb-1 text-black">Tên đối tác</Typography>
              <TextField
                fullWidth
                size="small"
                color="success"
                variant="outlined"
                disabled
                value={order.supplierName || ''}
                sx={{
                  '& .MuiInputBase-root.Mui-disabled': {
                    bgcolor: '#eeeeee',
                    '& .MuiOutlinedInput-notchedOutline': {
                      border: 'none',
                    },
                  },
                }}
              />
            </div>
            <div>
              <Typography variant="medium" className="mb-1 text-black">Địa chỉ</Typography>
              <TextField
                fullWidth
                size="small"
                color="success"
                variant="outlined"
                disabled
                value={order.supplierAddress || ''}
                sx={{
                  '& .MuiInputBase-root.Mui-disabled': {
                    bgcolor: '#eeeeee',
                    '& .MuiOutlinedInput-notchedOutline': {
                      border: 'none',
                    },
                  },
                }}
              />
            </div>
            <div>
              <Typography variant="medium" className="mb-1 text-black">Người liên hệ</Typography>
              <TextField
                fullWidth
                size="small"
                color="success"
                variant="outlined"
                disabled
                value={order.supplierContactName || ''}
                sx={{
                  '& .MuiInputBase-root.Mui-disabled': {
                    bgcolor: '#eeeeee',
                    '& .MuiOutlinedInput-notchedOutline': {
                      border: 'none',
                    },
                  },
                }}
              />
            </div>
            <div>
              <Typography variant="medium" className="mb-1 text-black">Số điện thoại</Typography>
              <TextField
                fullWidth
                size="small"
                color="success"
                variant="outlined"
                disabled
                value={order.supplierPhone || 'không có thông tin'}
                sx={{
                  '& .MuiInputBase-root.Mui-disabled': {
                    bgcolor: '#eeeeee',
                    '& .MuiOutlinedInput-notchedOutline': {
                      border: 'none',
                    },
                  },
                }}
              />
            </div>
          </div>
          {/* Diễn giải & Kèm theo */}
          <div className="grid grid-cols-2 gap-x-12 gap-y-4 mb-4">
            <div>
              <Typography variant="medium" className="mb-1 text-black">
                Diễn giải
              </Typography>
              <TextField
                fullWidth
                size="small"
                hiddenLabel
                placeholder="Diễn giải"
                multiline
                rows={4}
                color="success"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div>
              <Typography variant="medium" className="mb-1 text-black">
                Kèm theo
              </Typography>
              <FileUploadBox
                files={files}
                setFiles={setFiles}
                maxFiles={3}
              />
            </div>
          </div>
          {/* Danh sách sản phẩm */}
          <Typography
            variant="h6"
            className="flex items-center mb-4 mt-8 text-black"
          >
            <ListBulletIcon className="h-5 w-5 mr-2" />
            Danh sách sản phẩm
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
                className="border rounded px-2 py-1"
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
            {/* <TableSearch
              onSearch={() => {
                // Tìm kiếm (nếu cần)
              }}
              placeholder="Tìm kiếm"
            /> */}
          </div>
          {/* Product table - Using new table template */}
          <div className="border border-gray-200 rounded mb-4 overflow-x-auto border-[rgba(224,224,224,1)]">
            <table className="w-full min-w-max text-left border-collapse border-[rgba(224,224,224,1)]">
              <thead className="bg-[#f5f5f5] border-b border-[rgba(224,224,224,1)]">
                <tr>
                  <th className="px-4 py-2 text-sm font-medium text-center text-[#000000DE] border-r border-[rgba(224,224,224,1)]">STT</th>
                  <th className="px-4 py-2 text-sm font-medium text-[#000000DE] border-r border-[rgba(224,224,224,1)]">Mã hàng</th>
                  <th className="px-4 py-2 text-sm font-medium text-[#000000DE] border-r border-[rgba(224,224,224,1)]">Tên hàng</th>
                  <th className="px-4 py-2 text-sm font-medium text-[#000000DE] border-r border-[rgba(224,224,224,1)]">Đơn vị</th>
                  <th className="px-4 py-2 text-sm font-medium text-[#000000DE] border-r border-[rgba(224,224,224,1)]">Nhập kho</th>
                  <th className="px-4 py-2 text-sm font-medium text-[#000000DE] border-r border-[rgba(224,224,224,1)]">Số lượng đặt</th>
                  <th className="px-4 py-2 text-sm font-medium text-[#000000DE] border-r border-[rgba(224,224,224,1)]">Số lượng đã nhập</th>
                  <th className="px-4 py-2 text-sm font-medium text-[#000000DE] border-r border-[rgba(224,224,224,1)]">Số lượng còn phải nhập</th>
                  <th className="px-4 py-2 text-sm font-medium text-[#000000DE] border-r border-[rgba(224,224,224,1)]">Số lượng nhập kho</th>
                </tr>
              </thead>
              <tbody>
                {displayedItems.length > 0 ? (
                  displayedItems.map((item, index) => (
                    <ProductRow
                      key={`item-${item.materialId || item.productId}-${index}`}
                      item={{
                        ...item,
                        quantity: rowsData[item.materialId || item.productId]?.quantity,
                        remainingQuantity: rowsData[item.materialId || item.productId]?.remainingQuantity,
                      }}
                      index={index + currentPage * pageSize}
                      warehouses={warehouses}
                      defaultWarehouseCode={getDefaultWarehouse(referenceDocument)}
                      currentPage={currentPage}
                      pageSize={pageSize}
                      onDataChange={(id, data) => {
                        handleRowDataChange(id, data); // ✅ lưu dữ liệu nhập
                        handleQuantityChange(id, data.quantity, item.orderedQuantity, item.receivedQuantity); // ✅ validate
                      }}
                    />
                  ))
                ) : (
                  <tr>
                    <td colSpan="9" className="p-4 text-center text-gray-500">
                      Không có dữ liệu sản phẩm
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Phân trang */}
          {totalElements > 0 && (
            <div className="flex items-center justify-between pb-4">
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
          )}

          {/* Button actions */}
          <Divider />
          <div className="flex justify-between my-4">
            <MuiButton
              color="info"
              size="medium"
              variant="outlined"
              sx={{
                color: '#616161',
                borderColor: '#9e9e9e',
                '&:hover': {
                  backgroundColor: '#f5f5f5',
                  borderColor: '#757575',
                },
              }}
              onClick={() => navigate("/user/receiptNote")}
              className="flex items-center gap-2"
            >
              <FaArrowLeft className="h-3 w-3" /> Quay lại
            </MuiButton>

            <div className="flex items-center gap-2">
              <MuiButton
                size="medium"
                color="error"
                variant="outlined"
                onClick={() => {
                  if (window.confirm("Bạn có chắc muốn hủy thao tác này?")) {
                    navigate("/user/receiptNote");
                  }
                }}
              >
                Hủy
              </MuiButton>
              <Button
                size="lg"
                color="white"
                variant="text"
                className="bg-[#0ab067] hover:bg-[#089456]/90 shadow-none text-white font-medium py-2 px-4 rounded-[4px] transition-all duration-200 ease-in-out"
                ripple={true}
                onClick={handleSaveReceipt}
                disabled={isSubmitting || Object.keys(quantityErrors).length > 0 || !referenceDocument}
              >
                Lưu
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
export default AddReceiptNote;