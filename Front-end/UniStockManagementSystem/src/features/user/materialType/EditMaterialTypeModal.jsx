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
import { checkNameExists } from "./materialTypeService";

const EditMaterialTypeModal = ({ materialType, onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        status: true,
    });
    const [nameError, setNameError] = useState("");
    const [validationErrors, setValidationErrors] = useState({});

    useEffect(() => {
        if (materialType) {
            setFormData({
                name: materialType.name,
                description: materialType.description || "",
                status: materialType.status,
            });
            setNameError("");
            setValidationErrors({});
        }
    }, [materialType]);

    const isEmptyOrWhitespace = (str) => !str || /^\s*$/.test(str);

    // Kiểm tra tên khi nhập
    const handleCheckName = async (newName) => {
        setNameError("");
        setValidationErrors((prev) => ({ ...prev, name: "" }));
        setFormData((prev) => ({ ...prev, name: newName }));

        const normalizedName = newName.trim();
        if (normalizedName) {
            try {
                const exists = await checkNameExists(normalizedName, materialType.materialTypeId);
                if (exists) {
                    setNameError("Tên danh mục vật tư này đã tồn tại!");
                }
            } catch (error) {
                setNameError("Lỗi khi kiểm tra tên danh mục vật tư!");
            }
        }
    };

    // Xử lý submit
    const handleSubmit = async () => {
        const newErrors = {};
        const normalizedName = formData.name.trim();

        if (isEmptyOrWhitespace(normalizedName)) {
            newErrors.name = "Tên danh mục vật tư không được để trống hoặc chỉ chứa khoảng trắng!";
        } else if (nameError) {
            newErrors.name = nameError;
        }

        setValidationErrors(newErrors);

        if (Object.keys(newErrors).length === 0) {
            try {
                if (!materialType.materialTypeId) {
                    throw new Error("ID của danh mục vật tư không hợp lệ!");
                }
                await onSuccess(materialType.materialTypeId, { ...formData, name: normalizedName });
                onClose();
            } catch (error) {
                setNameError(error.message || "Lỗi khi cập nhật danh mục vật tư!");
            }
        }
    };

    // Kiểm tra nút "Lưu" có bị vô hiệu không
    const isUpdateDisabled = () => {
        return !!nameError || isEmptyOrWhitespace(formData.name);
    };

    return (
        <Dialog open={true} handler={onClose} size="md" className="px-4 py-2">
            <DialogHeader className="flex justify-between items-center pb-2">
                <Typography variant="h4" color="blue-gray">
                    Chỉnh sửa danh mục vật tư
                </Typography>
                <IconButton size="small" onClick={onClose}>
                    <XMarkIcon className="h-5 w-5 stroke-2" />
                </IconButton>
            </DialogHeader>
            <Divider variant="middle" />
            <DialogBody className="space-y-4 pb-6 pt-6">
                <div>
                    <Typography variant="medium" className="text-black">
                        Tên danh mục vật tư <span className="text-red-500">*</span>
                    </Typography>
                    <TextField
                        fullWidth
                        size="small"
                        hiddenLabel
                        placeholder="Tên danh mục vật tư"
                        color="success"
                        value={formData.name}
                        onChange={(e) => handleCheckName(e.target.value)}
                        error={!!nameError || !!validationErrors.name}
                        helperText={nameError || validationErrors.name}
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
                    onClick={handleSubmit}
                    disabled={isUpdateDisabled()}
                >
                    Lưu
                </Button>
            </DialogFooter>
        </Dialog>
    );
};

export default EditMaterialTypeModal;