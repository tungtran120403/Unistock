import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Card,
  CardBody,
  Button,
  Input,
  Typography,
} from "@material-tailwind/react";
import { TextField, Button as MuiButton, Divider, Autocomplete, IconButton } from '@mui/material';
import {
  HighlightOffRounded
} from '@mui/icons-material';
import { FaSave, FaTimes, FaPlus, FaTrash } from "react-icons/fa";
import { ArrowRightIcon, ArrowLeftIcon } from "@heroicons/react/24/outline";
import ReactPaginate from "react-paginate";
import { getPartnersByType, getPartnersByMaterial } from "@/features/user/partner/partnerService";
import { LocalizationProvider, DatePicker } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import "dayjs/locale/vi"; // Import Tiếng Việt
import usePurchaseRequest from "./usePurchaseRequest";
import axios from "axios";
import { createPurchaseRequest } from "./PurchaseRequestService";
import PageHeader from '@/components/PageHeader';
import TableSearch from '@/components/TableSearch';
import { getAllMaterials } from "@/features/user/materials/materialService";

const SUPPLIER_TYPE_ID = 2;

const customStyles = {
  control: (provided, state) => ({
    ...provided,
    minWidth: 200,
    borderColor: state.isFocused ? "black" : provided.borderColor,
    boxShadow: state.isFocused ? "0 0 0 1px black" : "none",
    "&:hover": { borderColor: "black" },
  }),
  option: (provided) => ({
    ...provided,
    color: "black",
  }),
  clearIndicator: (base) => ({
    ...base,
    cursor: 'pointer',
    padding: '4px',
    ':hover': { color: '#ef4444' }
  }),
};

const authHeader = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } : {};
};

const AddPurchaseRequestPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { addRequest, getNextCode } = usePurchaseRequest();
  const { fromSaleOrder, saleOrderId, saleOrderCode, initialItems, usedProductsFromWarehouses = [], usedMaterialsFromWarehouses = [] } = location.state || {};

  const [requestCode, setRequestCode] = useState("");
  const [requestDate, setRequestDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [description, setDescription] = useState("");
  const [suppliers, setSuppliers] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [items, setItems] = useState(initialItems || []);
  const [nextId, setNextId] = useState((initialItems?.length || 0) + 1);
  const [loading, setLoading] = useState(false);
  const [tableSearchQuery, setTableSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(5);
  const [quantityErrors, setQuantityErrors] = useState({});
  const [materialErrors, setMaterialErrors] = useState({});
  const [supplierErrors, setSupplierErrors] = useState({});
  const [billOfMaterialsError, setBillOfMaterialsError] = useState("");
  const [errors, setErrors] = useState({});
  const [materialSuppliers, setMaterialSuppliers] = useState({});
  const [quantityValidationError, setQuantityValidationError] = useState("");

  const selectRef = useRef(null);

  useEffect(() => {
    const fetchNextCode = async () => {
      setLoading(true);
      try {
        const code = await getNextCode();
        setRequestCode(code);
      } catch (error) {
        console.error("Lỗi khi lấy mã phiếu:", error);
        setErrors({ message: "Không thể lấy mã phiếu. Vui lòng thử lại!" });
      } finally {
        setLoading(false);
      }
    };
    fetchNextCode();
    console.log("🔍 usedMaterialsFromWarehouses from location.state:", JSON.stringify(usedMaterialsFromWarehouses, null, 2));
  }, []);

  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        const response = await getPartnersByType(SUPPLIER_TYPE_ID);
        const mappedSuppliers = response.partners.map((supplier) => {
          const supplierPartnerType = supplier.partnerTypes.find(
            (pt) => pt.partnerType.typeId === SUPPLIER_TYPE_ID
          );
          return {
            value: supplier.partnerId,
            label: supplier.partnerName,
            name: supplier.partnerName,
            code: supplierPartnerType?.partnerCode || "",
          };
        });
        setSuppliers(mappedSuppliers);
      } catch (error) {
        console.error("Lỗi khi tải danh sách nhà cung cấp:", error);
        setSuppliers([]);
      }
    };
    fetchSuppliers();
  }, []);

  useEffect(() => {
    const fetchMaterials = async () => {
      try {
        const response = await getAllMaterials(0, 1000);
        if (response && Array.isArray(response.materials)) {
          setMaterials(response.materials);
        }
      } catch (error) {
        console.error("Lỗi khi lấy danh sách vật tư:", error);
      }
    };
    fetchMaterials();
  }, []);

  useEffect(() => {
    if (initialItems) {
      const invalidItems = initialItems.filter((item) => {
        const quantity = Number(item.quantity);
        return (
          item.quantity === undefined ||
          item.quantity === null ||
          isNaN(quantity) ||
          quantity <= 0
        );
      });

      if (invalidItems.length > 0) {
        const errorMessage = `Dữ liệu số lượng không hợp lệ cho các vật tư: ${invalidItems
          .map((item) => item.materialName)
          .join(", ")}. Số lượng phải lớn hơn 0.`;
        setQuantityValidationError(errorMessage);
        return;
      }

      setQuantityValidationError("");

      const suppliersMap = {};
      initialItems.forEach((item) => {
        if (item.suppliers) {
          const updatedSuppliers = item.suppliers.map((supplier) => ({
            ...supplier,
            label: supplier.name,
          }));
          suppliersMap[item.materialId] = updatedSuppliers;
        }
      });
      setMaterialSuppliers(suppliersMap);
      setItems(initialItems);
    }
  }, [initialItems]);

  const handleAddRow = () => {
    setItems((prev) => [
      ...prev,
      {
        id: nextId,
        materialId: "",
        materialCode: "",
        materialName: "",
        unitName: "",
        quantity: 1,
        supplierId: "",
        supplierName: "",
      },
    ]);
    setNextId((id) => id + 1);
    setMaterialErrors("");
    setQuantityErrors("");
    setSupplierErrors("");
    setBillOfMaterialsError("");
  };

  const handleRemoveAllRows = () => {
    setItems([]);
    setNextId(1);
    setBillOfMaterialsError("");
    setMaterialErrors("");
    setQuantityErrors("");
    setSupplierErrors("");
  };

  const handleSupplierChange = (index, selectedOption) => {
    console.log("selectedOption: ", selectedOption);
    setItems((prev) =>
      prev.map((item, idx) =>
        idx === index
          ? {
              ...item,
              supplierId: selectedOption?.value || "",
              supplierName: selectedOption?.name || "",
            }
          : item
      )
    );
  };

  const handleMaterialChange = (index, selectedOption) => {
    if (!selectedOption) {
      setItems((prev) =>
        prev.map((item, idx) =>
          idx === index
            ? {
                ...item,
                materialId: "",
                materialCode: "",
                materialName: "",
                unitName: "",
                supplierId: "",
                supplierName: "",
              }
            : item
        )
      );
      setMaterialSuppliers((prev) => {
        const newSuppliers = { ...prev };
        delete newSuppliers[items[index].materialId];
        return newSuppliers;
      });
      return;
    }

    const material = selectedOption;
    setItems((prev) =>
      prev.map((item, idx) =>
        idx === index
          ? {
              ...item,
              materialId: material.materialId,
              materialCode: material.materialCode,
              materialName: material.materialName,
              unitName: material.unitName,
              supplierId: "",
              supplierName: "",
            }
          : item
      )
    );

    fetchSuppliersByMaterial(material.materialId, index);
  };

  const fetchSuppliersByMaterial = async (materialId, index) => {
    try {
      const response = await getPartnersByMaterial(materialId);
      const mappedSuppliers = response.map((supplier) => ({
        value: supplier.partnerId,
        label: supplier.partnerName,
        name: supplier.partnerName,
        code: supplier.partnerCode || "",
      }));
      setMaterialSuppliers((prev) => ({
        ...prev,
        [materialId]: mappedSuppliers,
      }));

      if (mappedSuppliers.length === 1) {
        setItems((prev) =>
          prev.map((item, idx) =>
            idx === index
              ? {
                  ...item,
                  supplierId: mappedSuppliers[0].value,
                  supplierName: mappedSuppliers[0].name,
                }
              : item
          )
        );
      }
    } catch (error) {
      console.error("Lỗi khi lấy nhà cung cấp theo vật tư:", error);
      setMaterialSuppliers((prev) => ({
        ...prev,
        [materialId]: [],
      }));
    }
  };

  const handleQuantityChange = (index, value) => {
    if (fromSaleOrder) return;

    const quantity = Number(value);
    setItems((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, quantity } : item))
    );
    if (quantity <= 0) {
      setQuantityErrors((prev) => ({ ...prev, [index]: "Số lượng phải lớn hơn 0" }));
    } else {
      setQuantityErrors((prev) => ({ ...prev, [index]: "" }));
    }
  };

  const handleSaveRequest = async () => {
    if (loading) return;

    if (quantityValidationError) {
      alert(quantityValidationError);
      return;
    }

    const newSupplierErrors = {};
    const newQuantityErrors = {};
    const newMaterialErrors = {};

    if (!items.length) {
      setBillOfMaterialsError("Vui lòng thêm ít nhất một vật tư!");
      return;
    }

    items.forEach((item, index) => {
      const materialIdNum = Number(item.materialId);
      const quantityNum = Number(item.quantity);
      const supplierIdNum = Number(item.supplierId);

      if (!materialIdNum || materialIdNum <= 0) {
        newMaterialErrors[index] = "Vui lòng chọn vật tư cho dòng này!";
      }
      if (!quantityNum || quantityNum <= 0) {
        newQuantityErrors[index] = "Số lượng phải lớn hơn 0!";
      }
      if (!supplierIdNum || supplierIdNum <= 0) {
        newSupplierErrors[index] = "Vui lòng chọn nhà cung cấp!";
      }
    });

    setSupplierErrors(newSupplierErrors);
    setQuantityErrors(newQuantityErrors);
    setMaterialErrors(newMaterialErrors);
    if (
      Object.keys(newSupplierErrors).length > 0 ||
      Object.keys(newMaterialErrors).length > 0 ||
      Object.keys(newQuantityErrors).length > 0
    ) {
      return;
    }

    setLoading(true);
    try {
      // Validate usedMaterialsFromWarehouses
      if (usedMaterialsFromWarehouses.length > 0) {
        const invalidMaterials = usedMaterialsFromWarehouses.filter(
          (m) => !m.materialId || !m.warehouseId || !m.quantity || m.quantity <= 0
        );
        if (invalidMaterials.length > 0) {
          console.error("🔍 Invalid usedMaterialsFromWarehouses:", JSON.stringify(invalidMaterials, null, 2));
          throw new Error("Dữ liệu vật liệu từ kho không hợp lệ.");
        }
      }

      const formattedDate = `${requestDate}T00:00:00Z`;
      const payload = {
        purchaseRequestCode: requestCode,
        createdDate: formattedDate,
        notes: description || "",
        status: "PENDING",
        saleOrderId: saleOrderId ? Number(saleOrderId) : null,
        purchaseRequestDetails: items
          .filter((item) => Number(item.quantity) > 0)
          .map((item) => ({
            materialId: Number(item.materialId),
            quantity: Number(item.quantity),
            partnerId: Number(item.supplierId),
          })),
        usedProductsFromWarehouses: usedProductsFromWarehouses.map((u) => ({
          productId: u.productId,
          warehouseId: u.warehouseId,
          quantity: u.quantity,
        })),
        usedMaterialsFromWarehouses: usedMaterialsFromWarehouses.map((m) => ({
          materialId: m.materialId,
          warehouseId: m.warehouseId,
          quantity: m.quantity,
        })),
      };

      console.log("🔍 Payload sent to createPurchaseRequest:", JSON.stringify(payload, null, 2));

      await createPurchaseRequest(payload);
      navigate("/user/purchase-request", { state: { refresh: true, successMessage: "Tạo yêu cầu mua vật tư thành công!" } });
    } catch (error) {
      console.error("🔍 Lỗi khi lưu yêu cầu:", error);
      const errorMessage = error.response?.data?.message || "Có lỗi xảy ra khi lưu yêu cầu. Vui lòng thử lại!";
      setErrors({ message: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate("/user/purchase-request");
  };

  const getPaginatedData = () => {
    const startIndex = currentPage * pageSize;
    const endIndex = startIndex + pageSize;
    return items.slice(startIndex, endIndex);
  };

  const handlePageChange = (selectedItem) => {
    setCurrentPage(selectedItem.selected);
  };

  const getAvailableMaterials = () => {
    const selectedMaterialIds = items.map((item) => item.materialId).filter(Boolean);
    return materials.filter((m) => !selectedMaterialIds.includes(m.materialId));
  };

  return (
    <div className="mb-8 flex flex-col gap-12" style={{ height: 'calc(100vh-100px)' }}>
      <Card className="bg-gray-50 p-7 rounded-none shadow-none">
        <CardBody className="pb-2 bg-white rounded-xl">
          <PageHeader
            title={"Yêu cầu mua vật tư " + requestCode + (fromSaleOrder && saleOrderCode ? ` cho đơn hàng ${saleOrderCode}` : "")}
            addButtonLabel=""
            onAdd={() => { }}
            onImport={() => {/* Xử lý import nếu có */ }}
            onExport={() => {/* Xử lý export file ở đây nếu có */ }}
            showAdd={false}
            showImport={false}
            showExport={false}
          />
          {errors.message && (
            <Typography className="text-xs text-red-500 mb-4">{errors.message}</Typography>
          )}
          {quantityValidationError && (
            <Typography className="text-xs text-red-500 mb-4">{quantityValidationError}</Typography>
          )}
          <div className="grid grid-cols-2 gap-x-12 gap-y-4 mb-6">
            <div className="flex flex-col gap-4">
              <div>
                <Typography variant="medium" className="mb-1 text-black">Mã phiếu</Typography>
                <TextField
                  fullWidth
                  size="small"
                  color="success"
                  variant="outlined"
                  disabled
                  value={requestCode}
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
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Diễn giải"
                  hiddenLabel
                  multiline
                  rows={4}
                  color="success"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
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
                  value={requestDate ? dayjs(requestDate) : null}
                  onChange={(newValue) => {
                    if (newValue) {
                      setRequestDate(newValue.format("YYYY-MM-DD"));
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
                  sx={{
                    '& .MuiInputBase-root.Mui-disabled': {
                      bgcolor: '#eeeeee',
                      '& .MuiOutlinedInput-notchedOutline': {
                        border: 'none',
                      },
                    },
                  }}
                />
              </LocalizationProvider>
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
              onSearch={(e) => setTableSearchQuery(e.target.value)}
              placeholder="Tìm kiếm"
            />

          </div>
          <div className="border border-gray-200 rounded mb-4 overflow-x-auto border-[rgba(224,224,224,1)]">
            <table className="w-full min-w-max text-left border-collapse border-[rgba(224,224,224,1)]">
              <thead className="bg-[#f5f5f5] border-b border-[rgba(224,224,224,1)]">
                <tr>
                  {["STT", "Mã vật tư", "Tên vật tư", "Nhà cung cấp", "Đơn vị", "Số lượng", "Thao tác"].map((head) => (
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
                      <td className="px-2 py-2 text-sm text-[#000000DE] w-20 border-r border-[rgba(224,224,224,1)]">
                        {currentPage * pageSize + index + 1}
                      </td>
                      <td className="px-2 py-2 text-sm w-72 border-r border-[rgba(224,224,224,1)]">
                        {fromSaleOrder ? (
                          item.materialCode
                        ) : (
                          <Autocomplete
                            options={materials}
                            size="small"
                            getOptionLabel={(option) => `${option.materialCode} - ${option.materialName}`}
                            value={
                              item.materialId
                                ? materials.find((m) => m.materialId === item.materialId) || null
                                : null
                            }
                            onChange={(event, selected) => {
                              handleMaterialChange(currentPage * pageSize + index, selected)
                              setMaterialErrors((prev) => ({ ...prev, [index]: "" }));
                            }}
                            isOptionEqualToValue={(option, value) =>
                              option?.materialId === value?.materialId
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
                            sx={{
                              '& .MuiInputBase-root.Mui-disabled': {
                                bgcolor: '#eeeeee',
                                '& .MuiOutlinedInput-notchedOutline': {
                                  border: 'none',
                                },
                              },
                            }}
                            renderInput={(params) => (
                              <TextField
                                {...params}
                                color="success"
                                hiddenLabel
                                placeholder="Chọn vật tư"
                              />
                            )}
                          />
                        )}
                        {materialErrors[currentPage * pageSize + index] && (
                          <Typography className="text-xs text-red-500 mt-1">
                            {materialErrors[currentPage * pageSize + index]}
                          </Typography>
                        )}
                      </td>
                      <td className="px-2 py-2 text-sm border-r border-[rgba(224,224,224,1)]">
                        {item.materialName || ""}
                      </td>
                      <td className="px-2 py-2 text-sm w-56 border-r border-[rgba(224,224,224,1)]">
                        {fromSaleOrder && materialSuppliers[item.materialId] ? (
                          materialSuppliers[item.materialId].length === 1 ? (
                            <TextField
                              size="small"
                              color="success"
                              hiddenLabel
                              fullWidth
                              value={item.supplierName || ""}
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
                          ) : (
                            <Autocomplete
                              options={materialSuppliers[item.materialId]}
                              size="small"
                              getOptionLabel={(option) => option.name}
                              value={
                                item.supplierId
                                  ? materialSuppliers[item.materialId].find(
                                      (s) => s.value === item.supplierId
                                    ) || null
                                  : null
                              }
                              onChange={(event, selected) => {
                                handleSupplierChange(currentPage * pageSize + index, selected);
                                setSupplierErrors((prev) => ({ ...prev, [index]: "" }));
                              }}
                              isOptionEqualToValue={(option, value) =>
                                option?.value === value?.value
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
                              sx={{
                                '& .MuiInputBase-root.Mui-disabled': {
                                  bgcolor: '#eeeeee',
                                  '& .MuiOutlinedInput-notchedOutline': {
                                    border: 'none',
                                  },
                                },
                              }}
                              renderInput={(params) => (
                                <TextField
                                  {...params}
                                  color="success"
                                  hiddenLabel
                                  placeholder="Chọn nhà cung cấp"
                                />
                              )}
                            />
                          )
                        ) : (
                          <Autocomplete
                            options={materialSuppliers[item.materialId] || suppliers}
                            size="small"
                            getOptionLabel={(option) => option.name}
                            value={
                              item.supplierId
                                ? (materialSuppliers[item.materialId] || suppliers).find(
                                    (s) => s.value === item.supplierId
                                  ) || null
                                : null
                            }
                            onChange={(event, selected) => {
                              handleSupplierChange(currentPage * pageSize + index, selected);
                              setSupplierErrors((prev) => ({ ...prev, [index]: "" }));
                            }}
                            isOptionEqualToValue={(option, value) =>
                              option?.value === value?.value
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
                            sx={{
                              '& .MuiInputBase-root.Mui-disabled': {
                                bgcolor: '#eeeeee',
                                '& .MuiOutlinedInput-notchedOutline': {
                                  border: 'none',
                                },
                              },
                            }}
                            renderInput={(params) => (
                              <TextField
                                {...params}
                                color="success"
                                hiddenLabel
                                placeholder="Chọn nhà cung cấp"
                              />
                            )}
                          />
                        )}
                        {supplierErrors[currentPage * pageSize + index] && (
                          <Typography className="text-xs text-red-500 mt-1">
                            {supplierErrors[currentPage * pageSize + index]}
                          </Typography>
                        )}
                      </td>
                      <td className="px-2 py-2 text-sm w-36 border-r border-[rgba(224,224,224,1)]">
                        {item.unitName || ""}
                      </td>
                      <td className="px-2 py-2 text-sm w-40 border-r border-[rgba(224,224,224,1)]">
                        <div>
                          <TextField
                            type="number"
                            size="small"
                            fullWidth
                            value={item.quantity === 0 ? "" : item.quantity}
                            onChange={(e) =>
                              handleQuantityChange(currentPage * pageSize + index, e.target.value)
                            }
                            slotProps={{
                              input: {
                                inputMode: "numeric",
                              }
                            }}
                            disabled={fromSaleOrder}
                            color="success"
                            hiddenLabel
                            placeholder="0"
                            sx={{
                              '& .MuiInputBase-root.Mui-disabled': {
                                bgcolor: '#eeeeee',
                                '& .MuiOutlinedInput-notchedOutline': {
                                  border: 'none',
                                },
                              },
                            }}
                          />
                          {quantityErrors[currentPage * pageSize + index] && (
                            <Typography className="text-xs text-red-500 mt-1">
                              {quantityErrors[currentPage * pageSize + index]}
                            </Typography>
                          )}
                        </div>
                      </td>
                      <td className="px-2 py-2 text-sm text-center w-24">
                        {!fromSaleOrder && (
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => setItems((prev) => prev.filter((_, i) => i !== currentPage * pageSize + index))}
                          >
                            <HighlightOffRounded />
                          </IconButton>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-2 py-2 text-center text-gray-500">
                      Chưa có dòng nào được thêm
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {billOfMaterialsError && (
            <Typography color="red" className="text-sm pb-4">
              {billOfMaterialsError}
            </Typography>
          )}

          {items.length > 0 && (
            <div className="flex items-center justify-between pb-4">
              <div className="flex items-center gap-2">
                <Typography variant="small" color="blue-gray" className="font-normal">
                  Trang {currentPage + 1} / {Math.ceil(items.length / pageSize)} • {items.length} bản ghi
                </Typography>
              </div>
              <ReactPaginate
                previousLabel={<ArrowLeftIcon strokeWidth={2} className="h-4 w-4" />}
                nextLabel={<ArrowRightIcon strokeWidth={2} className="h-4 w-4" />}
                breakLabel="..."
                pageCount={Math.ceil(items.length / pageSize)}
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
            {!fromSaleOrder && (
              <>
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
              </>
            )}
          </div>
          <Divider />
          <div className="flex justify-end gap-2 py-4">
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
              className="bg-[#0ab067] hover:bg-[#089456]/90 shadow-none text-white font-medium py-2 px-4 rounded-[4px] transition-all duration-200 ease-in-out flex items-center gap-2"
              onClick={handleSaveRequest}
            >
              Lưu
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
};

export default AddPurchaseRequestPage;