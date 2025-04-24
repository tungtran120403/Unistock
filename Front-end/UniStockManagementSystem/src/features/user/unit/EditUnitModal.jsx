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
import { checkUnitNameExists } from "./unitService";

const EditUnitModal = ({ unit, onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
        unitName: "",
        status: true,
    });
    const [validationErrors, setValidationErrors] = useState({});
    const [unitNameError, setUnitNameError] = useState("");

    useEffect(() => {
        if (unit) {
            console.log("Unit in modal:", unit); // Kiểm tra unit có cả id và unitId không
            setFormData({
                unitName: unit.unitName,
                status: unit.status,
            });
        }
    }, [unit]);

    const isEmptyOrWhitespace = (str) => !str || /^\s*$/.test(str);

    const handleUnitNameChange = async (newName) => {
        // Reset cả 2 loại lỗi khi người dùng nhập
        setUnitNameError("");
        setValidationErrors((prev) => ({ ...prev, unitName: "" }));

        // Cập nhật giá trị
        setFormData({ ...formData, unitName: newName || "" });

        if (newName.trim() && newName !== unit.unitName) {
            try {
                const exists = await checkUnitNameExists(newName, unit.id);
                if (exists) {
                    setUnitNameError("Tên đơn vị tính đã tồn tại!");
                }
            } catch (error) {
                console.error("❌ Lỗi khi kiểm tra tên đơn vị tính:", error);
                setUnitNameError("Lỗi khi kiểm tra tên đơn vị tính!");
            }
        }
    };

    const handleSubmit = async () => {
        const newErrors = {};
        if (isEmptyOrWhitespace(formData.unitName)) {
            newErrors.unitName = "Tên đơn vị tính không được để trống hoặc chỉ chứa khoảng trắng!";
        }
        setValidationErrors(newErrors);
        if (Object.keys(newErrors).length === 0 && !unitNameError) {
            try {
                // Đảm bảo sử dụng id đúng
                const actualId = unit.unitId || unit.id; // Ưu tiên unitId nếu có

                // Cấu trúc dữ liệu phải đảm bảo tương thích với UnitDTO.java
                const dataToSend = {
                    unitId: actualId, // Có thể backend sẽ bỏ qua trường này, nhưng vẫn nên gửi
                    unitName: formData.unitName.trim(),
                    status: formData.status
                };

                console.log("Data to send:", JSON.stringify(dataToSend));
                console.log("URL path ID:", actualId);

                // Sử dụng cùng một ID
                await onSuccess(actualId, dataToSend);
                onClose();
            } catch (error) {
                console.error("Error updating unit:", error);
                // Hiển thị lỗi cho người dùng nếu cần
            }
        }
    };

    const isSubmitDisabled = () => {
        return !!unitNameError;
    };

    return (
        <Dialog open={true} handler={onClose} size="md" className="px-4 py-2">
            <DialogHeader className="flex justify-between items-center pb-2">
                <Typography variant="h4" color="blue-gray">
                    Chỉnh sửa đơn vị tính
                </Typography>
                <IconButton
                    size="small"
                    onClick={onClose}
                >
                    <XMarkIcon className="h-5 w-5 stroke-2" />
                </IconButton>
            </DialogHeader>
            <Divider variant="middle" />
            <DialogBody className="space-y-4 pb-6 pt-6">
                <div>
                    <Typography variant="medium" className="text-black">
                        Tên đơn vị tính
                        <span className="text-red-500"> *</span>
                    </Typography>
                    <TextField
                        fullWidth
                        size="small"
                        hiddenLabel
                        placeholder="Tên đơn vị tính"
                        color="success"
                        value={formData.unitName}
                        onChange={(e) => handleUnitNameChange(e.target.value)}
                        error={Boolean(unitNameError || validationErrors.unitName)}
                    />
                    {(unitNameError || validationErrors.unitName) && (
                        <Typography color="red" className="text-xs text-start mt-1">
                            {unitNameError || validationErrors.unitName}
                        </Typography>
                    )}
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
                    disabled={isSubmitDisabled()}
                >
                    Lưu
                </Button>
            </DialogFooter>
        </Dialog>
    );
};

export default EditUnitModal;