
import { FaSave, FaTimes, FaPlus, FaTrash } from "react-icons/fa";
import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Card,
  CardHeader,
  CardBody,
  Button,
  Input,
  Textarea,
  Typography,
} from "@material-tailwind/react";
import {
  HighlightOffRounded,
  ClearRounded
} from '@mui/icons-material';
import { TextField, Button as MuiButton, Autocomplete, IconButton, Divider } from '@mui/material';
import ReactPaginate from "react-paginate";
import { ArrowRightIcon, ArrowLeftIcon } from "@heroicons/react/24/outline";
import { getPartnersByType } from "@/features/user/partner/partnerService";
import { getProducts } from "./saleOrdersService";
import { LocalizationProvider, DatePicker } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import "dayjs/locale/vi"; // Import Tiếng Việt
import useSaleOrder from "./useSaleOrder";
import ModalAddCustomer from "./ModalAddCustomer";
import PageHeader from '@/components/PageHeader';
import TableSearch from '@/components/TableSearch';

const CUSTOMER_TYPE_ID = 1;

const AddSaleOrderPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { addOrder } = useSaleOrder();

  const nextCode = location.state?.nextCode || "";

  const [customerError, setCustomerError] = useState("");
  const [globalError, setGlobalError] = useState("");
  const [itemsErrors, setItemsErrors] = useState({});

  const [orderCode, setOrderCode] = useState("");
  const [orderDate, setOrderDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [customerCode, setCustomerCode] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [address, setAddress] = useState("");
  const [contactName, setContactName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [description, setDescription] = useState("");
  const [customers, setCustomers] = useState([]);

  const [products, setProducts] = useState([]);
  const [items, setItems] = useState([]);
  const [nextId, setNextId] = useState(1);
  const [isCreatePartnerPopupOpen, setIsCreatePartnerPopupOpen] = useState(false);

  const selectRef = useRef(null);

  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(5);
  const [tableSearchQuery, setTableSearchQuery] = useState("");

  // Lọc các sản phẩm chưa được chọn
  const getAvailableProducts = () => {
    const selectedProductCodes = items.map((item) => item.productCode).filter(Boolean);
    return products.filter((product) => !selectedProductCodes.includes(product.value));
  };

  // Hàm fetch danh sách khách hàng
  const fetchCustomers = async () => {
    try {
      const response = await getPartnersByType(CUSTOMER_TYPE_ID, 0, 1000);
      if (!response || !response.partners) {
        console.error("API không trả về dữ liệu hợp lệ!");
        setCustomers([]);
        return;
      }
      const mappedCustomers = response.partners
        .map((customer) => {
          const customerPartnerType = customer.partnerTypes.find(
            (pt) => pt.partnerType.typeId === CUSTOMER_TYPE_ID
          );
          return {
            code: customerPartnerType?.partnerCode || "",
            label: `${customerPartnerType?.partnerCode || ""} - ${customer.partnerName}`,
            name: customer.partnerName,
            address: customer.address,
            phone: customer.phone,
            contactName: customer.contactName || "",
          };
        })
        .filter((c) => c.code !== "");
      setCustomers(mappedCustomers);
    } catch (error) {
      console.error("Lỗi khi tải danh sách khách hàng:", error);
      setCustomers([]);
    }
  };

  useEffect(() => {
    console.log("Component mounted, location.state:", location.state);
    console.log("Initial isCreatePartnerPopupOpen:", isCreatePartnerPopupOpen);
    setOrderCode(nextCode);
  }, [nextCode]);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleCustomerChange = (selectedOption) => {
    if (!selectedOption) {
      setCustomerCode("");
      setCustomerName("");
      setAddress("");
      setPhoneNumber("");
      setContactName("");
      return;
    }

    setCustomerCode(selectedOption.code);
    setCustomerName(selectedOption.name);
    setAddress(selectedOption.address);
    setPhoneNumber(selectedOption.phone);
    setContactName(selectedOption.contactName || "");
    if (selectedOption.code) {
      setCustomerError("");
    }
  };

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await getProducts();
        const productOptions = response.content.map((product) => ({
          value: product.productCode,
          label: `${product.productCode} - ${product.productName}`,
          unit: product.unitName,
        }));
        setProducts(productOptions);
      } catch (error) {
        console.error("Lỗi khi lấy danh sách sản phẩm:", error);
      }
    };
    fetchProducts();
  }, []);

  const handleAddRow = () => {
    setItems((prev) => [
      ...prev,
      {
        id: nextId,
        productCode: "",
        productName: "",
        unitName: "",
        quantity: "",
      },
    ]);
    setNextId((id) => id + 1);
    setItemsErrors((prev) => ({ ...prev, [nextId]: {} }));
    setGlobalError("");
  };

  const handleRemoveAllRows = () => {
    setItems([]);
    setNextId(1);
    setItemsErrors({});
    setGlobalError("");
  };

  const handleSelectProduct = (rowId, selectedOption) => {
    setItems((prev) =>
      prev.map((row) =>
        row.id === rowId
          ? {
            ...row,
            productCode: selectedOption ? selectedOption.value : "",
            productName: selectedOption ? selectedOption.label : "",
            unitName: selectedOption ? selectedOption.unit : "",
          }
          : row
      )
    );
    setItemsErrors((prev) => ({
      ...prev,
      [rowId]: { ...prev[rowId], productError: "" },
    }));
    setGlobalError("");
  };

  const handleQuantityChange = (rowId, newQuantity) => {
    setItems((prev) =>
      prev.map((row) =>
        row.id === rowId ? { ...row, quantity: Number(newQuantity) } : row
      )
    );
    if (Number(newQuantity) > 0) {
      setItemsErrors((prev) => ({
        ...prev,
        [rowId]: { ...prev[rowId], quantityError: "" },
      }));
      setGlobalError("");
    }
  };

  const aggregateItems = (itemsArray) => {
    const aggregated = itemsArray.reduce((acc, curr) => {
      const existingItem = acc.find(
        (item) => item.productCode === curr.productCode
      );
      if (existingItem) {
        existingItem.quantity += Number(curr.quantity);
      } else {
        acc.push({ ...curr });
      }
      return acc;
    }, []);
    return aggregated;
  };

  const handleSaveOrder = async () => {
    let hasError = false;
    if (!customerCode) {
      setCustomerError("Vui lòng chọn khách hàng!");
      hasError = true;
    } else {
      setCustomerError("");
    }

    if (items.length === 0) {
      setGlobalError("Vui lòng thêm ít nhất một dòng sản phẩm!");
      return;
    } else {
      setGlobalError("");
    }

    const newItemsErrors = {};
    items.forEach((item) => {
      newItemsErrors[item.id] = {};
      if (!item.productCode) {
        newItemsErrors[item.id].productError =
          "Vui lòng chọn sản phẩm cho dòng này!";
        hasError = true;
      }
      if (Number(item.quantity) <= 0) {
        newItemsErrors[item.id].quantityError =
          "Số lượng sản phẩm phải lớn hơn 0!";
        hasError = true;
      }
    });
    setItemsErrors(newItemsErrors);
    if (hasError) return;

    const aggregatedItems = aggregateItems(items);
    const payload = {
      orderCode,
      orderDate,
      partnerCode: customerCode,
      partnerName: customerName,
      status: "PROCESSING",
      note: description,
      orderDetails: aggregatedItems,
    };

    console.log("Dữ liệu gửi lên BE:", payload);

    try {
      await addOrder(payload);
      navigate("/user/sale-orders", {
        state: { successMessage: "Tạo đơn bán hàng thành công!" },
      });
    } catch (error) {
      console.error("Lỗi khi lưu đơn hàng:", error);
      alert("Lỗi khi lưu đơn hàng. Vui lòng thử lại!");
    }
  };

  const handleCancel = () => {
    navigate("/user/sale-orders");
  };

  const handleOpenCreatePartnerPopup = () => {
    console.log("Opening modal...");
    setIsCreatePartnerPopupOpen(true);
  };

  const handleCloseCreatePartnerPopup = () => {
    console.log("Closing modal, current state:", isCreatePartnerPopupOpen);
    setIsCreatePartnerPopupOpen(false);
  };

  const getFilteredItems = () => {
    return items.filter(item => {
      const searchLower = tableSearchQuery.toLowerCase().trim();
      return item.productCode?.toLowerCase().includes(searchLower) ||
        item.productName?.toLowerCase().includes(searchLower);
    });
  };

  const getPaginatedData = () => {
    const filteredData = getFilteredItems();
    const startIndex = currentPage * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredData.slice(startIndex, endIndex);
  };

  const handlePageChange = (selectedItem) => {
    setCurrentPage(selectedItem.selected);
  };

  return (
    <div className="mb-8 flex flex-col gap-12">
      <Card className="bg-gray-50 p-7">
        <CardBody className="pb-2 bg-white rounded-xl">
          <PageHeader
            title={"Đơn hàng " + orderCode}
            addButtonLabel="Thêm đơn hàng"
            onAdd={() => { }}
            onImport={() => {/* Xử lý import nếu có */ }}
            onExport={() => {/* Xử lý export file ở đây nếu có */ }}
            showAdd={false}
            showImport={false}
            showExport={false}
          />

          <div className="grid grid-cols-2 gap-x-12 gap-y-4 mb-6">
            <div className="flex flex-col gap-4">
              <div>
                <Typography variant="medium" className="mb-1 text-black">
                  Mã phiếu
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  hiddenLabel
                  placeholder="Mã phiếu"
                  color="success"
                  value={orderCode}
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
                  Mã khách hàng
                  <span className="text-red-500"> *</span>
                </Typography>
                <Autocomplete
                  options={customers}
                  disableClearable
                  clearIcon={null}
                  size="small"
                  getOptionLabel={(option) => option.label}
                  value={customers.find(o => o.code === customerCode) || null}
                  onChange={(event, selected) =>
                    handleCustomerChange(selected)
                  }
                  renderInput={(params) => (
                    <TextField
                      color="success"
                      hiddenLabel
                      {...params}
                      placeholder="Mã khách hàng"
                      InputProps={{
                        ...params.InputProps,
                        endAdornment: (
                          <div className="flex items-center space-x-1">
                            <IconButton
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenCreatePartnerPopup();
                              }}
                              size="small"
                            >
                              <FaPlus fontSize="small" />
                            </IconButton>

                            {customerCode && (
                              <IconButton
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCustomerChange(null);
                                }}
                                size="small"
                              >
                                <ClearRounded fontSize="18px" />
                              </IconButton>
                            )}
                            {params.InputProps.endAdornment}
                          </div>
                        )
                      }}
                    />
                  )}
                />
                {customerError && (
                  <Typography color="red" className="text-xs mt-1">
                    {customerError}
                  </Typography>
                )}
              </div>
              <div>
                <Typography variant="medium" className="mb-1 text-black">
                  Địa chỉ
                  <span className="text-red-500"> *</span>
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  hiddenLabel
                  placeholder="Địa chỉ"
                  color="success"
                  value={address}
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
                  Người liên hệ
                  <span className="text-red-500"> *</span>
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  hiddenLabel
                  placeholder="Người liên hệ"
                  color="success"
                  disabled
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
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
            <div className="flex flex-col gap-4">
              <div>
                <Typography variant="medium" className="mb-1 text-black">
                  Ngày lập phiếu
                  <span className="text-red-500"> *</span>
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
              <div>
                <Typography variant="medium" className="mb-1 text-black">
                  Tên khách hàng
                  <span className="text-red-500"> *</span>
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  hiddenLabel
                  placeholder="Tên khách hàng"
                  color="success"
                  disabled
                  value={customerName}
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
                  Số điện thoại
                  <span className="text-red-500"> *</span>
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  hiddenLabel
                  placeholder="Số điện thoại"
                  color="success"
                  disabled
                  value={phoneNumber}
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
                  Diễn giải
                  <span className="text-red-500"> *</span>
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  hiddenLabel
                  placeholder="Diễn giải"
                  color="success"
                  multiline
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
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
          </div>

          <div className="py-2 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Typography variant="small" color="blue-gray" className="font-normal">
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
                dòng mỗi trang
              </Typography>
            </div>

            <TableSearch
              value={tableSearchQuery}
              onChange={setTableSearchQuery}
              onSearch={() => { }}
              placeholder="Tìm kiếm"
            />
          </div>

          <div className="border border-gray-200 rounded mb-4 overflow-x-auto border-[rgba(224,224,224,1)]">
            <table className="w-full min-w-max text-left border-collapse border-[rgba(224,224,224,1)]">
              <thead className="bg-[#f5f5f5] border-b border-[rgba(224,224,224,1)]">
                <tr>
                  {["STT", "Mã hàng", "Tên hàng", "Đơn vị", "Số lượng", "Thao tác"].map((head) => (
                    <th
                      key={head}
                      className="px-4 py-2 text-sm font-medium text-[#000000DE] border-r border-[rgba(224,224,224,1)] last:border-r-0"
                    >
                      {head}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {getPaginatedData().length > 0 ? (
                  getPaginatedData().map((item, index) => (
                    <tr key={item.id} className="border-b last:border-b-0 border-[rgba(224,224,224,1)]">
                      <td className="px-2 py-2 text-sm text-[#000000DE] text-center w-10 border-r border-[rgba(224,224,224,1)]">{currentPage * pageSize + index + 1}</td>
                      <td className="px-2 py-2 text-sm w-72 border-r border-[rgba(224,224,224,1)]">
                        <Autocomplete
                          options={getAvailableProducts()}
                          size="small"
                          getOptionLabel={(option) => option.label}
                          value={products.find((p) => p.value === item.productCode) || null}
                          onChange={(event, selected) =>
                            handleSelectProduct(item.id, selected)
                          }
                          fullWidth
                          slotProps={{
                            paper: {
                              sx: {
                                maxHeight: 300,
                                overflowY: "auto",
                              },
                            },
                          }}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              color="success"
                              hiddenLabel
                              placeholder="Chọn sản phẩm"
                            />
                          )}
                        />
                        {itemsErrors[item.id] && itemsErrors[item.id].productError && (
                          <Typography color="red" className="text-xs mt-1">
                            {itemsErrors[item.id].productError}
                          </Typography>
                        )}
                      </td>
                      <td className="px-4 py-2 text-sm w-96 border-r border-[rgba(224,224,224,1)]">
                        {item.productName}
                      </td>
                      <td className="px-4 py-2 text-sm w-40 border-r border-[rgba(224,224,224,1)]">
                        {item.unitName}
                      </td>
                      <td className="px-4 py-2 text-sm w-40 border-r border-[rgba(224,224,224,1)]">
                        <TextField
                          type="number"
                          size="small"
                          fullWidth
                          slotProps={{
                            input: {
                              inputMode: "numeric",
                            }
                          }}
                          value={item.quantity}
                          onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                          color="success"
                          hiddenLabel
                          placeholder="0"
                        />
                        {itemsErrors[item.id] && itemsErrors[item.id].quantityError && (
                          <Typography color="red" className="text-xs mt-1">
                            {itemsErrors[item.id].quantityError}
                          </Typography>
                        )}
                      </td>
                      <td className="px-4 py-2 text-sm w-24 text-center">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => {
                            setItems((prev) => prev.filter((_, i) => i !== (currentPage * pageSize + index)));
                            if (getPaginatedData().length === 1 && currentPage > 0) {
                              setCurrentPage(currentPage - 1);
                            }
                          }}
                        >
                          <HighlightOffRounded />
                        </IconButton>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-4 py-2 text-center text-gray-500">
                      {items.length === 0 ? "Chưa có dòng sản phẩm nào" : "Không tìm thấy kết quả phù hợp"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {globalError && (
            <Typography color="red" className="text-sm pb-4">
              {globalError}
            </Typography>
          )}

          {getFilteredItems().length > 0 && (
            <div className="flex items-center justify-between pb-4">
              <div className="flex items-center gap-2">
                <Typography variant="small" color="blue-gray" className="font-normal">
                  Trang {currentPage + 1} / {Math.ceil(getFilteredItems().length / pageSize)} •{" "}
                  {getFilteredItems().length} dòng
                </Typography>
              </div>
              <ReactPaginate
                previousLabel={<ArrowLeftIcon strokeWidth={2} className="h-4 w-4" />}
                nextLabel={<ArrowRightIcon strokeWidth={2} className="h-4 w-4" />}
                breakLabel="..."
                pageCount={Math.ceil(getFilteredItems().length / pageSize)}
                marginPagesDisplayed={2}
                pageRangeDisplayed={5}
                onPageChange={handlePageChange}
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

          <div className="flex gap-2 mb-4 h-8">
            <MuiButton
              size="small"
              variant="outlined"
              onClick={handleAddRow}
            >
              <div className='flex items-center gap-2'>
                <FaPlus className="h-4 w-4" />
                <span>Thêm dòng</span>
              </div>
            </MuiButton>
            <MuiButton
              size="small"
              variant="outlined"
              color="error"
              onClick={handleRemoveAllRows}
            >
              <div className='flex items-center gap-2'>
                <FaTrash className="h-4 w-4" />
                <span>Xóa hết dòng</span>
              </div>
            </MuiButton>
          </div>
          <Divider />
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-end gap-2 py-4">
              <MuiButton
                size="medium"
                color="error"
                variant="outlined"
                onClick={handleCancel}
              >
                Hủy
              </MuiButton>
              <Button
                size="lg"
                color="white"
                variant="text"
                className="bg-[#0ab067] hover:bg-[#089456]/90 shadow-none text-white font-medium py-2 px-4 rounded-[4px] transition-all duration-200 ease-in-out"
                ripple={true}
                onClick={handleSaveOrder}
              >
                Lưu
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>

      {isCreatePartnerPopupOpen && (
        <ModalAddCustomer
          onClose={handleCloseCreatePartnerPopup}
          onSuccess={async (newPartner) => {
            // Làm mới danh sách khách hàng
            await fetchCustomers();

            // Tự động chọn partner mới
            const newCustomer = customers.find((c) => c.code === newPartner.code) || newPartner;
            handleCustomerChange(newCustomer);

            // Đóng modal
            handleCloseCreatePartnerPopup();
          }}
        />
      )}
    </div>
  );
};

export default AddSaleOrderPage;
