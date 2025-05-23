import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogHeader,
  DialogBody,
  DialogFooter,
  Typography,
  Button,
} from "@material-tailwind/react";
import { TextField, Divider, Button as MuiButton, IconButton } from "@mui/material";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { checkTypeNameExists } from "./productTypeService";

const CreateProductTypeModal = ({ show, onClose, loading, onSuccess }) => {
  const [formData, setFormData] = useState({
    typeName: "",
    description: "",
  });
  const [typeNameError, setTypeNameError] = useState("");
  const [validationErrors, setValidationErrors] = useState({});

  useEffect(() => {
    if (show) {
      setFormData({
        typeName: "",
        description: "",
      });
      setTypeNameError("");
      setValidationErrors({});
    }
  }, [show]);

  if (!show) return null;

  const isEmptyOrWhitespace = (str) => !str || /^\s*$/.test(str);

  const handleCheckTypeName = async (newName) => {
    setTypeNameError("");
    setValidationErrors((prev) => ({ ...prev, typeName: "" }));
    setFormData((prev) => ({ ...prev, typeName: newName }));

    const normalizedName = newName.trim();
    if (normalizedName) {
      try {
        const exists = await checkTypeNameExists(normalizedName);
        if (exists) {
          setTypeNameError("Tên dòng sản phẩm này đã tồn tại!");
        }
      } catch (error) {
        setTypeNameError("Lỗi khi kiểm tra tên dòng sản phẩm!");
      }
    }
  };

  const handleCreateProductType = async () => {
    const newErrors = {};
    const normalizedName = formData.typeName.trim();

    if (isEmptyOrWhitespace(normalizedName)) {
      newErrors.typeName = "Tên dòng sản phẩm không được để trống hoặc chỉ chứa khoảng trắng!";
    } else {
      try {
        const exists = await checkTypeNameExists(normalizedName);
        if (exists) {
          newErrors.typeName = "Tên dòng sản phẩm này đã tồn tại!";
        }
      } catch (error) {
        newErrors.typeName = "Lỗi khi kiểm tra tên dòng sản phẩm!";
      }
    }

    setValidationErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      try {
        await onSuccess({ ...formData, typeName: normalizedName });
        onClose();
      } catch (error) {
        setTypeNameError(error.message || "Lỗi khi tạo dòng sản phẩm!");
      }
    }
  };

  const isCreateDisabled = () => {
    return loading || !!typeNameError || isEmptyOrWhitespace(formData.typeName);
  };

  return (
    <Dialog open={show} onClose={onClose} size="md" className="px-4 py-2">
      <DialogHeader className="flex justify-between items-center pb-2">
        <Typography variant="h4" color="blue-gray">
          Thêm dòng sản phẩm
        </Typography>
        <IconButton size="small" onClick={onClose}>
          <XMarkIcon className="h-5 w-5 stroke-2" />
        </IconButton>
      </DialogHeader>
      <Divider variant="middle" />
      <DialogBody className="space-y-4 pb-6 pt-6">
        <div>
          <Typography variant="medium" className="text-black">
            Tên dòng sản phẩm <span className="text-red-500">*</span>
          </Typography>
          <TextField
            fullWidth
            size="small"
            hiddenLabel
            placeholder="Tên dòng sản phẩm"
            color="success"
            value={formData.typeName}
            onChange={(e) => handleCheckTypeName(e.target.value)}
            error={!!typeNameError || !!validationErrors.typeName}
            helperText={typeNameError || validationErrors.typeName}
          />
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
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
        </div>
      </DialogBody>
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
          onClick={handleCreateProductType}
          disabled={isCreateDisabled()}
        >
          Lưu
        </Button>
      </DialogFooter>
    </Dialog>
  );
};

export default CreateProductTypeModal;