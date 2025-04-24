import React, { useState, useEffect } from 'react';
import {
  TextField,
  Divider,
  Button as MuiButton,
  IconButton,
  Autocomplete,
} from "@mui/material";
import {
  Dialog,
  DialogHeader,
  DialogBody,
  DialogFooter,
  Typography,
  Button,
} from "@material-tailwind/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import useWarehouse from "./useWarehouse";

const ModalAddWarehouse = ({ show, onClose, onAdd }) => {
  const [warehouseCode, setWarehouseCode] = useState("");
  const [warehouseName, setWarehouseName] = useState("");
  const [warehouseDescription, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState({});

  // Danh sách phân loại kho có sẵn
  const categoryOptions = [
    { value: "TP", label: "Thành phẩm sản xuất" },
    { value: "VT", label: "Vật tư mua bán" },
    { value: "GC", label: "Hàng hóa gia công" },
    { value: "TL", label: "Hàng hóa trả lại" },
    { value: "NT", label: "Vật tư thừa sau sản xuất" }
  ];

  const statusOptions = [
    { value: true, label: "Hoạt động" },
    { value: false, label: "Không hoạt động" },
  ];

  const [warehouseCategories, setWarehouseCategories] = useState([]);
  const [availableCategories, setAvailableCategories] = useState(categoryOptions);
  const { addWarehouse, getUsedCategories, isWarehouseCodeTaken } = useWarehouse();
  const [isAllCategoriesUsed, setIsAllCategoriesUsed] = useState(false);
  const [isActive, setIsActive] = useState(true);

  const validateFields = (field, value) => {
    let errors = { ...error };

    if (field === "warehouseCode") {
      if (!value.trim()) {
        errors.warehouseCode = "Mã kho không được để trống.";
      } else if (!/^[A-Za-z0-9_-]{1,50}$/.test(value)) {
        errors.warehouseCode = "Mã kho chỉ chứa chữ, số, dấu '-' hoặc '_', không vượt quá 50 ký tự.";
      } else {
        delete errors.warehouseCode;
      }
    }

    if (field === "warehouseName") {
      if (!value.trim()) {
        errors.warehouseName = "Tên kho không được để trống.";
      } else if (value.length > 100) {
        errors.warehouseName = "Tên kho không vượt quá 100 ký tự.";
      } else {
        delete errors.warehouseName;
      }
    }

    if (field === "warehouseDescription") {
      if (value.length > 255) {
        errors.warehouseDescription = "Mô tả quá dài.";
      } else {
        delete errors.warehouseDescription;
      }
    }

    setError(errors);
  };

  const validateCategories = () => {
    let errors = { ...error };
    if (!isAllCategoriesUsed && warehouseCategories.length === 0) {
      errors.warehouseCategories = "Vui lòng chọn ít nhất một phân loại kho.";
      setError(errors);
      return false;
    } else {
      delete errors.warehouseCategories;
      setError(errors);
      return true;
    }
  };

  const handleSave = async () => {
    if (Object.keys(error).length > 0) return;

    if (!warehouseCode.trim()) {
      setError({ ...error, warehouseCode: "Mã kho không được để trống." });
      return;
    }

    if (!warehouseName.trim()) {
      setError({ ...error, warehouseName: "Tên kho không được để trống." });
      return;
    }

    if (!validateCategories()) return;

    setLoading(true);
    try {
      const categoryLabels = warehouseCategories.map(cat =>
        categoryOptions.find(opt => opt.value === cat)?.label
      );
      const goodCategory = categoryLabels.length > 0 ? categoryLabels.join(", ") : null;

      const data = {
        warehouseCode,
        warehouseName,
        warehouseDescription,
        goodCategory,
        isActive,
      };

      console.log("📤 Dữ liệu gửi về backend:", data); // ✅ LOG kiểm tra

      await addWarehouse(data);
      onAdd?.();
      onClose();
    } catch (error) {
      if (error.response?.status === 409) {
        const errorCode = error.response.data;
        let errors = { ...error };
        if (errorCode === "DUPLICATE_CODE_AND_NAME") {
          errors.warehouseCode = "Mã kho đã tồn tại.";
          errors.warehouseName = "Tên kho đã tồn tại.";
        } else if (errorCode === "DUPLICATE_CODE") {
          errors.warehouseCode = "Mã kho đã tồn tại.";
        } else if (errorCode === "DUPLICATE_NAME") {
          errors.warehouseName = "Tên kho đã tồn tại.";
        }
        setError(errors);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchAndFilterCategories = async () => {
      const usedLabels = await getUsedCategories();
      const filtered = categoryOptions.filter(opt => !usedLabels.includes(opt.label));
      setAvailableCategories(filtered);
      setIsAllCategoriesUsed(filtered.length === 0);
    };

    if (show) {
      fetchAndFilterCategories();
    }
  }, [show]);


  return (
    <Dialog
      open={show}
      handler={onClose}
      size="md"
      className="px-4 py-2"
    >
      {/* Header của Dialog */}
      <DialogHeader className="flex justify-between items-center pb-2">
        <Typography variant="h4" color="blue-gray">
          Thêm kho
        </Typography>
        <IconButton
          size="small"
          onClick={onClose}
        >
          <XMarkIcon className="h-5 w-5 stroke-2" />
        </IconButton>
      </DialogHeader>
      <Divider variant="middle" />

      {/* Body của Dialog */}
      <DialogBody className="space-y-4 pb-6 pt-6">
        {/* Mã kho & Tên kho */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Typography variant="medium" className="text-black">
              Mã kho
              <span className="text-red-500"> *</span>
            </Typography>
            <TextField
              fullWidth
              size="small"
              hiddenLabel
              placeholder="Mã kho"
              color="success"
              value={warehouseCode}
              onChange={async (e) => {
                const uppercased = e.target.value.toUpperCase();
                setWarehouseCode(uppercased);
                validateFields("warehouseCode", uppercased);

                if (uppercased && /^[A-Za-z0-9_-]{1,50}$/.test(uppercased)) {
                  const exists = await isWarehouseCodeTaken(uppercased);
                  if (exists) {
                    setError(prev => ({
                      ...prev,
                      warehouseCode: "Mã kho đã tồn tại."
                    }));
                  } else {
                    setError(prev => {
                      const { warehouseCode, ...rest } = prev;
                      return rest;
                    });
                  }
                }
              }}
              error={!!error.warehouseCode}
            />
            {error.warehouseCode && <Typography variant="small" color="red">{error.warehouseCode}</Typography>}
          </div>
          <div>
            <Typography variant="medium" className="text-black">
              Tên kho
              <span className="text-red-500"> *</span>
            </Typography>
            <TextField
              fullWidth
              size="small"
              hiddenLabel
              placeholder="Tên kho"
              color="success"
              value={warehouseName}
              onChange={(e) => {
                setWarehouseName(e.target.value);
                validateFields("warehouseName", e.target.value);
              }}
              error={!!error.warehouseName}
            />
            {error.warehouseName && <Typography variant="small" color="red">{error.warehouseName}</Typography>}
          </div>
        </div>

        <div>
          <Typography variant="medium" className="text-black">
          Phân loại hàng hóa nhập vào kho
            <span className="text-red-500"> *</span>
          </Typography>
          {isAllCategoriesUsed ? (
            <Typography className="text-gray-500 mt-1" fontStyle="italic">
              Tất cả phân loại hàng hóa mặc định cho kho đã được gán. Không còn phân loại nào để chọn.
            </Typography>
          ) : (
            <Autocomplete
              multiple
              size="small"
              options={availableCategories}
              getOptionLabel={(option) => option.label}
              value={categoryOptions.filter(option => warehouseCategories.includes(option.value))}
              onChange={(event, selectedOptions) => {
                const values = selectedOptions.map(option => option.value);
                setWarehouseCategories(values);
                if (values.length > 0) {
                  const newErrors = { ...error };
                  delete newErrors.warehouseCategories;
                  setError(newErrors);
                }
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  fullWidth
                  color="success"
                  placeholder="Chọn phân loại hàng hóa nhập vào kho "
                  error={!!error.warehouseCategories}
                />
              )}
              slotProps={{
                popper: {
                  sx: { zIndex: 9999 }, // Cố định z-index trong Popper
                },
              }}
            />
          )}
          {error.warehouseCategories && <Typography variant="small" color="red">{error.warehouseCategories}</Typography>}
        </div>

        <div>
          <Typography variant="medium" className="text-black">
            Mô tả
          </Typography>
          <TextField
            fullWidth
            size="small"
            hiddenLabel
            placeholder="Mô tả"
            variant="outlined"
            multiline
            rows={3}
            color="success"
            value={warehouseDescription}
            onChange={(e) => {
              setDescription(e.target.value);
              validateFields("warehouseDescription", e.target.value);
            }}
            error={!!error.warehouseDescription}
          />
          {error.warehouseDescription && <Typography variant="small" color="red">{error.warehouseDescription}</Typography>}
        </div>

        <div className="mt-2">
          <Typography variant="medium" className="text-black">
            Trạng thái kho
            <span className="text-red-500"> *</span>
          </Typography>
          <Autocomplete
            options={statusOptions}
            getOptionLabel={(option) => option.label}
            value={statusOptions.find(opt => opt.value === isActive)}
            onChange={(e, newValue) => {
              if (newValue) {
                setIsActive(newValue.value);
              }
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                fullWidth
                size="small"
                color="success"
                placeholder="Chọn trạng thái kho"
              />
            )}
            slotProps={{
              popper: {
                  sx: { zIndex: 9999 }, // Cố định z-index trong Popper
              },
          }}
          />
        </div>

      </DialogBody>

      {/* Footer của Dialog */}
      <DialogFooter className="px-3 pt-0">
        <MuiButton
          size="medium"
          color="error"
          variant="outlined"
          onClick={onClose}
        >
          Hủy
        </MuiButton>
        <Button
          size="lg"
          color="white"
          variant="text"
          className="bg-[#0ab067] hover:bg-[#089456]/90 shadow-none text-white font-medium py-2 px-4 ml-3 rounded-[4px] transition-all duration-200 ease-in-out"
          ripple={true}
          onClick={handleSave}
        >
          Lưu
        </Button>
      </DialogFooter>
    </Dialog>
  );
};

export default ModalAddWarehouse;