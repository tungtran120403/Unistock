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

const EditMaterialTypeModal = ({ materialType, onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        status: true,
    });
    const [validationErrors, setValidationErrors] = useState({});

    useEffect(() => {
        if (materialType) {
            setFormData({
                name: materialType.name,
                description: materialType.description,
                status: materialType.status,
            });
        }
    }, [materialType]);

    // Hàm kiểm tra chuỗi có chứa toàn khoảng trắng hoặc trống không
    const isEmptyOrWhitespace = (str) => !str || /^\s*$/.test(str);

    // Hàm xử lý khi thay đổi tên loại nguyên liệu
    const handleNameChange = (newName) => {
        setFormData({ ...formData, name: newName });
        if (!isEmptyOrWhitespace(newName)) {
            setValidationErrors((prev) => ({ ...prev, name: "" }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const newErrors = {};
        if (isEmptyOrWhitespace(formData.name)) {
            newErrors.name = "Tên loại nguyên liệu không được để trống hoặc chỉ chứa khoảng trắng!";
        }

        setValidationErrors(newErrors);

        if (Object.keys(newErrors).length === 0) {
            try {
                if (!materialType.materialTypeId) {
                    throw new Error("ID của loại nguyên liệu không hợp lệ!");
                }
                await onSuccess(materialType.materialTypeId, formData);
                onClose();
            } catch (error) {
                console.error("Error updating material type:", error);
            }
        }
    };

    return (
        <Dialog open={true} handler={onClose} size="md" className="px-4 py-2">
            {/* Header của Dialog */}
            <DialogHeader className="flex justify-between items-center pb-2">
                <Typography variant="h4" color="blue-gray">
                    Chỉnh sửa loại nguyên liệu
                </Typography>
                <IconButton size="small" onClick={onClose}>
                    <XMarkIcon className="h-5 w-5 stroke-2" />
                </IconButton>
            </DialogHeader>
            <Divider variant="middle" />
            {/* Body của Dialog */}
            <DialogBody className="space-y-4 pb-6 pt-6">
                {/* Tên loại nguyên liệu */}
                <div>
                    <Typography variant="medium" className="text-black">
                        Tên loại nguyên liệu
                        <span className="text-red-500"> *</span>
                    </Typography>
                    <TextField
                        fullWidth
                        size="small"
                        hiddenLabel
                        placeholder="Tên loại nguyên liệu"
                        color="success"
                        value={formData.name}
                        onChange={(e) => handleNameChange(e.target.value)}
                    />
                    {validationErrors.name && (
                        <Typography variant="small" color="red">
                            {validationErrors.name}
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
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    />
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
                    onClick={handleSubmit}
                >
                    Lưu
                </Button>
            </DialogFooter>
        </Dialog>
    );
};

export default EditMaterialTypeModal;