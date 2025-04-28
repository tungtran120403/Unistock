import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogHeader,
  DialogBody,
  DialogFooter,
  Typography,
  Button,
} from "@material-tailwind/react";
import { TextField, Divider, Button as MuiButton, IconButton, Autocomplete } from "@mui/material";
import { XMarkIcon } from "@heroicons/react/24/outline";
import useWarehouse from "./useWarehouse";
import { InputBase } from "@mui/material";
import { fetchWarehouses } from "./warehouseService";

const ModalEditWarehouse = ({ open, onClose, warehouse, onSuccess }) => {
  const [warehouseCode, setWarehouseCode] = useState("");
  const [warehouseName, setWarehouseName] = useState("");
  const [warehouseDescription, setDescription] = useState("");
  const [isActive, setIsActive] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState({});
  const [openDropdown, setOpenDropdown] = useState(false);

  const allCategoryOptions = [
    "Thành phẩm sản xuất",
    "Vật tư mua bán",
    "Hàng hóa trả lại",
    "Hàng hóa gia công",
    "Vật tư thừa sau sản xuất"
  ];

  const [selectedCategories, setSelectedCategories] = useState([]);
  const [warehouseCategories, setWarehouseCategories] = useState([]);
  const [availableCategories, setAvailableCategories] = useState([]);
  const { editWarehouse, getUsedCategories, isWarehouseNameOrCodeTaken } = useWarehouse();

  const normalizeWarehouseName = (name) => {
    return name.replace(/\s+/g, ' ').trim(); // thay nhiều khoảng trắng bằng 1, xoá đầu/cuối
  };
  
  const fetchAvailableCategories = async (warehouse, currentSelectedLabels = []) => {
    if (!warehouse) return;

    const usedLabels = await getUsedCategories(warehouse.warehouseId);
    console.log("usedLabels from API:", usedLabels);
    console.log("current selected labels:", currentSelectedLabels);

    const dropdown = allCategoryOptions.filter(label =>
      !usedLabels.includes(label) || currentSelectedLabels.includes(label)
    );

    console.log("Dropdown filtered categories:", dropdown);

    setAvailableCategories(dropdown);
  };

  useEffect(() => {
    if (!warehouse) return;

    setWarehouseCode(warehouse.warehouseCode || "");
    setWarehouseName(warehouse.warehouseName || "");
    setDescription(warehouse.warehouseDescription || "");

    const currentCategories = warehouse.goodCategory
      ? warehouse.goodCategory.split(", ").map(cat => cat.trim())
      : [];

    setSelectedCategories(currentCategories);
    fetchAvailableCategories(warehouse, currentCategories);
  }, [warehouse]);


  // // Lấy danh sách phân loại khả dụng cho việc chỉnh sửa
  const fetchAvailableCategoriesForEdit = async () => {
    if (!warehouse) return;

    try {
      // Lấy danh sách phân loại đã được sử dụng bởi các kho khác
      const usedCategories = await getUsedCategories(warehouse.warehouseId);

      // Lấy danh sách phân loại hiện tại của kho này
      const currentCategories = warehouse.goodCategory
        ? warehouse.goodCategory.split(", ").map(cat => cat.trim())
        : [];

      // Lọc ra các phân loại có thể chọn:
      // - Tất cả các phân loại chưa được sử dụng
      // - Cộng với các phân loại hiện tại của kho này
      const available = allCategoryOptions.filter(category =>
        !usedCategories.includes(category) || currentCategories.includes(category)
      );

      setAvailableCategories(available);
    } catch (error) {
      console.error("Lỗi khi lấy danh sách phân loại kho:", error);
    }
  };

  const validateFields = (field, value) => {
    let errors = { ...error };

    if (field === "warehouseName") {
      if (!value.trim()) {
        errors.warehouseName = "Tên kho không được để trống.";
      } else if (value.length > 100) {
        errors.warehouseName = "Tên kho không được vượt quá 100 ký tự.";
      } else if ((value.match(/\s{2,}/g) || []).length >= 2) {
        errors.warehouseName = "Tên kho không được chứa nhiều khoảng trắng liên tiếp.";
      } else {
        delete errors.warehouseName;
      }
    }    

    if (field === "warehouseDescription") {
      if (value.length > 200) {
        errors.warehouseDescription = "Mô tả không được vượt quá 200 ký tự.";
      } else {
        delete errors.warehouseDescription;
      }
    }

    setError(errors);
  };

  const handleUpdate = async () => {
    setLoading(true);
    try {
      const goodCategory = selectedCategories.length > 0 ? selectedCategories.join(", ") : null;

      await editWarehouse(warehouse.warehouseId, {
        warehouseName,
        warehouseDescription,
        goodCategory,
        isActive: warehouse.isActive
      });

      alert("Chỉnh sửa thông tin kho thành công!");
      fetchWarehouses();
      onClose();
    } catch (error) {
      console.error("Lỗi khi sửa thông tin kho:", error);
      alert(error?.response?.data?.message || "Lỗi khi sửa kho!");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <Dialog open={true} handler={onClose} size="md" className="px-4 py-2">
      {/* Header của Dialog */}
      <DialogHeader className="flex justify-between items-center pb-2">
        <Typography variant="h4" color="blue-gray">
          Chỉnh sửa kho
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
              disabled
              value={warehouseCode}
              error={!!error.warehouseName}
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
              onChange={async (e) => {
                const rawValue = e.target.value;
                setWarehouseName(rawValue);
                validateFields("warehouseName", rawValue);
              
                if (rawValue.trim() && rawValue !== warehouse?.warehouseName) {
                  const result = await isWarehouseNameOrCodeTaken(rawValue.trim(), warehouseCode, warehouse.warehouseId);
                  let newErrors = { ...error };
                  if (result.nameExists) newErrors.warehouseName = "Tên kho đã tồn tại.";
                  else delete newErrors.warehouseName;
                  setError(newErrors);
                }
              }}                          
              error={!!error.warehouseName}
            />
            {error.warehouseName && <Typography variant="small" color="red">{error.warehouseName}</Typography>}
          </div>
        </div>

        <div>
          <Typography variant="medium" className="text-black mb-1">
          Phân loại hàng hóa mặc định cho kho
          <span className="text-red-500">(*)</span>
          </Typography>
          <Autocomplete
            multiple
            open={openDropdown}
            onOpen={() => {
              console.log("Dropdown opened");
              setOpenDropdown(true);
            }}
            onClose={() => {
              console.log("Dropdown closed");
              setOpenDropdown(false);
            }}
            options={availableCategories}
            value={selectedCategories}
            getOptionLabel={(option) => option || ""}
            disableCloseOnSelect
            onChange={(event, newValues) => {
              const validValues = newValues.filter((value) => availableCategories.includes(value));
              setSelectedCategories(validValues);
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                fullWidth
                variant="outlined"
                size="small"
                color="success"
                placeholder="Chọn phân loại hàng hóa nhập vào kho"
              />
            )}
            slotProps={{
              popper: {
                  sx: { zIndex: 9999 }, // Cố định z-index trong Popper
              },
          }}
            noOptionsText="Tất cả phân loại đã được sử dụng"
          />

          {availableCategories.length === 0 && selectedCategories.length === 0 && (
            <Typography className="text-gray-500 mt-1" fontStyle="italic">
              Không có phân loại kho nào khả dụng
            </Typography>
          )}
        </div>

        {/* Mô tả */}
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
          />
          {error.warehouseDescription && <Typography variant="small" color="red">{error.warehouseDescription}</Typography>}
        </div>
      </DialogBody>

      {/* Footer của Dialog */}
      <DialogFooter className="pt-0">
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
          onClick={handleUpdate}
        >
          Lưu
        </Button>
      </DialogFooter>
    </Dialog>
  );
};

export default ModalEditWarehouse;

