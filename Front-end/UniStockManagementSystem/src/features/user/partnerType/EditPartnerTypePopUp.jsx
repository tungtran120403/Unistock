import React, { useState, useEffect } from "react";
import { updatePartnerType } from "./partnerTypeService";
import {
    Dialog,
    DialogHeader,
    DialogBody,
    DialogFooter,
    Typography,
    Switch,
    Button,
} from "@material-tailwind/react";
import {
    TextField,
    Divider,
    Button as MuiButton,
    IconButton
} from "@mui/material";
import { XMarkIcon } from "@heroicons/react/24/outline";

const EditPartnerTypePopup = ({ partnerType, onClose, onSuccess }) => {
    const [editPartnerType, setEditPartnerType] = useState(partnerType);
    const [errorMessage, setErrorMessage] = useState("");
    const [errorTypeCode, setErrorTypeCode] = useState("");
    const [errorTypeName, setErrorTypeName] = useState("");

    useEffect(() => {
        console.log("partnerType: ", partnerType);
        setEditPartnerType(partnerType);
    }, [partnerType]);

    const resetErrorMessages = () => {
        setErrorMessage("");
        setErrorTypeCode("");
        setErrorTypeName("");
    };

    const validatePartnerType = (partnerType) => {
        let isValid = true;
        setErrorTypeCode("");
        setErrorTypeName("");
        setErrorMessage("");

        if (!partnerType.typeCode.trim()) {
            setErrorTypeCode("Mã nhóm đối tác không được để trống.");
            isValid = false;
        }

        if (!partnerType.typeName.trim()) {
            setErrorTypeName("Tên nhóm đối tác không được để trống.");
            isValid = false;
        }

        return isValid;
    };

    const handleEditPartnerType = async () => {
        resetErrorMessages(); // Xóa lỗi trước khi kiểm tra

        if (!validatePartnerType(editPartnerType)) {
            return; // Nếu có lỗi, dừng không gọi API
        }

        try {
            const payload = {
                typeId: editPartnerType.id,
                typeCode: editPartnerType.typeCode.trim(),
                typeName: editPartnerType.typeName.trim(),
                status: editPartnerType.status,
                description: editPartnerType.description?.trim() || "",
            };
            console.log("payload: ", payload);
            await updatePartnerType(payload);
            onSuccess(); // Load lại danh sách sau khi cập nhật thành công
            onClose();
            setEditPartnerType(null);
        } catch (error) {
            console.error("Lỗi khi cập nhật nhóm đối tác:", error);
            if (error.response && error.response.status === 409) {
                const errorCode = error.response.data;

                if (errorCode === "DUPLICATE_CODE_AND_NAME") {
                    setErrorMessage("Mã nhóm đối tác và tên nhóm đối tác đã tồn tại.");
                } else if (errorCode === "DUPLICATE_CODE") {
                    setErrorTypeCode("Mã nhóm đối tác đã tồn tại.");
                } else if (errorCode === "DUPLICATE_NAME") {
                    setErrorTypeName("Tên nhóm đối tác đã tồn tại.");
                }
            } else {
                alert("Lỗi khi cập nhật nhóm đối tác! Vui lòng thử lại.");
            }
        }
    };

    return (
        <Dialog open={true} handler={onClose} size="md" className="px-4 py-2">
            {/* Header của Dialog */}
            <DialogHeader className="flex justify-between items-center pb-2">
                <Typography variant="h4" color="blue-gray">
                    Chỉnh sửa nhóm đối tác
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
                {errorMessage && <Typography variant="small" color="red" className="mb-4">{errorMessage}</Typography>}

                {/* Mã nhóm đối tác */}
                <div>
                    <Typography variant="medium" className="text-black">
                        Mã nhóm đối tác
                        <span className="text-red-500"> *</span>
                    </Typography>
                    <TextField
                        fullWidth
                        size="small"
                        hiddenLabel
                        placeholder="Mã nhóm đối tác"
                        color="success"
                        value={editPartnerType.typeCode}
                        onChange={(e) => setEditPartnerType({ ...editPartnerType, typeCode: e.target.value })}
                    />
                    {errorTypeCode && <Typography variant="small" color="red">{errorTypeCode}</Typography>}
                </div>

                <div>
                    <Typography variant="medium" className="text-black">
                        Tên nhóm đối tác
                        <span className="text-red-500"> *</span>
                    </Typography>
                    <TextField
                        fullWidth
                        size="small"
                        hiddenLabel
                        placeholder="Tên nhóm đối tác"
                        variant="outlined"
                        color="success"
                        value={editPartnerType.typeName}
                        onChange={(e) => setEditPartnerType({ ...editPartnerType, typeName: e.target.value })}
                    />
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
                        rows={4}
                        color="success"
                        value={editPartnerType.description}
                        onChange={(e) => setEditPartnerType({ ...editPartnerType, description: e.target.value })}
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
                    onClick={handleEditPartnerType}
                >
                    Lưu
                </Button>
            </DialogFooter>
        </Dialog>
    );
};

export default EditPartnerTypePopup;
