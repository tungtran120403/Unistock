import React, { useState, useEffect } from "react";
import { updatePartner, fetchPartnerTypes } from "./partnerService";
import {
    Dialog,
    DialogHeader,
    DialogBody,
    DialogFooter,
    Typography,
    Input,
    Button,
} from "@material-tailwind/react";
import {
    TextField,
    Divider,
    Button as MuiButton,
    IconButton,
    Autocomplete
} from "@mui/material";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { getPartnerCodeByType } from "./partnerService";

const EditPartnerModal = ({ partner, onClose, onSuccess }) => {
    const [partnerTypes, setPartnerTypes] = useState([]);
    const [partnerCodes, setPartnerCodes] = useState([]);
    const [originalPartnerCodes, setOriginalPartnerCodes] = useState([]);
    const [errorPartnerName, setErrorPartnerName] = useState("");
    const [errorPartnerCodes, setErrorPartnerCodes] = useState("");
    const [errorEmail, setErrorEmail] = useState("");
    const [errorPhone, setErrorPhone] = useState("");
    const [errorMessage, setErrorMessage] = useState("");

    // State lưu thông tin chỉnh sửa
    const [editPartner, setEditPartner] = useState({
        partnerName: "",
        address: "",
        phone: "",
        email: "",
        partnerTypeIds: [],
        partnerCodes: [],
    });

    useEffect(() => {
        // Tải danh sách nhóm đối tác
        const loadPartnerTypes = async () => {
            try {
                const [data] = await Promise.all([
                    fetchPartnerTypes()
                ]);
                console.log("📦 fetchPartnerTypes result:", data);

                setPartnerTypes(data.content.map((pt) => ({
                    value: pt.typeId,
                    label: pt.typeName,
                })));
            } catch (error) {
                console.error("❌ Lỗi khi loadPartnerTypes:", error);
                setPartnerTypes([]);
            }
        };

        loadPartnerTypes();

        // Gán thông tin đối tác vào form khi mở modal
        console.log("partner: ", partner);
        if (partner) {
            setEditPartner({
                partnerName: partner.partnerName || "",
                address: partner.address || "",
                contactName: partner.contactName || "",
                phone: partner.phone || "",
                email: partner.email || "",
                partnerTypeIds: Array.isArray(partner.partnerType)
                    ? partner.partnerType.map((pt) => pt.id)
                    : [],
                partnerCodes: Array.isArray(partner.partnerCode)
                    ? partner.partnerCode
                    : [],
            });
            if (
                Array.isArray(partner.partnerType) &&
                Array.isArray(partner.partnerCode) &&
                partner.partnerType.length === partner.partnerCode.length
            ) {
                const mappedCodes = partner.partnerType.map((pt, idx) => ({
                    id: pt.id,
                    code: partner.partnerCode[idx],
                }));
                setPartnerCodes(mappedCodes);
                setOriginalPartnerCodes(mappedCodes);
            }
        }
    }, [partner]);

    const validatePartner = () => {
        let isValid = true;
        setErrorPartnerName("");
        setErrorEmail("");
        setErrorPhone("");

        if (!editPartner.partnerName.trim()) {
            setErrorPartnerName("Tên đối tác không được để trống.");
            isValid = false;
        }
        return isValid;
    };

    const handlePartnerTypeChange = async (selectedOptions) => {
        const selectedIds = selectedOptions.map((option) => option.value);

        // ✅ 1. Giữ lại mã từ các nhóm đã từng có trước đó (trong originalPartnerCodes)
        const retainedCodes = originalPartnerCodes.filter((c) =>
            selectedIds.includes(c.id)
        );

        // ✅ 2. Kiểm tra nhóm nào là mới được chọn thêm
        const newIds = selectedIds.filter(
            (id) => !retainedCodes.some((c) => c.id === id)
        );

        // ✅ 3. Tạo mã mới cho nhóm mới
        let newCodes = [];
        if (newIds.length > 0) {
            try {
                newCodes = await Promise.all(
                    newIds.map(async (id) => {
                        const code = await getPartnerCodeByType(id);
                        return { id, code };
                    })
                );
            } catch (error) {
                console.error("❌ Lỗi khi lấy mã đối tác mới:", error);
            }
        }

        // ✅ 4. Gộp danh sách mã cuối cùng
        const updatedCodes = [...retainedCodes, ...newCodes];
        setPartnerCodes(updatedCodes);

        // ✅ 5. Cập nhật form
        setEditPartner((prev) => ({
            ...prev,
            partnerTypeIds: updatedCodes.map((c) => c.id),
            partnerCodes: updatedCodes.map((c) => c.code),           // để gửi về backend
        }));
    };

    const handleUpdatePartner = async () => {
        if (!validatePartner()) return;

        try {
            const updatedData = {
                partnerId: partner.id,
                partnerName: editPartner.partnerName,
                address: editPartner.address,
                contactName: editPartner.contactName,
                phone: editPartner.phone,
                email: editPartner.email,
                partnerCodes: editPartner.partnerCodes,
                partnerTypeIds: editPartner.partnerTypeIds,
            };
            console.log("updatePartner: ", updatedData);
            await updatePartner(updatedData);
            onSuccess("Cập nhật đối tác thành công!"); // Reload danh sách sau khi cập nhật
            onClose(); // Đóng modal
        } catch (error) {
            console.error("Lỗi khi cập nhật đối tác:", error);
            alert("Có lỗi xảy ra! Vui lòng thử lại.");
        }
    };

    return (
        <Dialog open={true} handler={onClose} size="md" className="px-4 py-2">
            {/* Header của Dialog */}
            <DialogHeader className="flex justify-between items-center pb-2">
                <Typography variant="h4" color="blue-gray">
                    Chỉnh sửa đối tác
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

                {/* Tên đối tác */}
                <div>
                    <Typography variant="medium" className="text-black">
                        Tên đối tác
                        <span className="text-red-500"> *</span>
                    </Typography>
                    <TextField
                        fullWidth
                        size="small"
                        hiddenLabel
                        placeholder="Tên đối tác"
                        color="success"
                        value={editPartner.partnerName}
                        onChange={(e) => setEditPartner({ ...editPartner, partnerName: e.target.value })}
                    />
                    {errorPartnerName && <Typography variant="small" color="red">{errorPartnerName}</Typography>}
                </div>

                {/* Nhóm đối tác */}
                <div>
                    <Typography variant="medium" className="text-black">
                        Nhóm đối tác
                        <span className="text-red-500"> *</span>
                    </Typography>
                    <Autocomplete
                        multiple
                        options={partnerTypes}
                        size="small"
                        getOptionLabel={(option) => option.label || ""}
                        value={
                            partnerTypes.filter((s) =>
                                editPartner.partnerTypeIds?.includes(s.value)
                            )
                        }
                        onChange={(event, selectedOptions) => {
                            handlePartnerTypeChange(selectedOptions);
                        }}
                        renderInput={(params) => (
                            <TextField
                                color="success"
                                hiddenLabel
                                {...params}
                                placeholder="Chọn nhóm đối tác"
                            />
                        )}
                        slotProps={{
                            popper: {
                                sx: { zIndex: 9999 }, // Cố định z-index trong Popper
                            },
                        }}
                    />
                    {errorPartnerCodes && <Typography variant="small" color="red">{errorPartnerCodes}</Typography>}

                </div>

                {/* Mã đối tác */}
                <div>
                    <Typography variant="medium" className="text-black">
                        Mã đối tác
                    </Typography>
                    <TextField
                        fullWidth
                        size="small"
                        hiddenLabel
                        placeholder="Mã đối tác"
                        variant="outlined"
                        color="success"
                        value={partnerCodes.map((c) => c.code).join(", ")}
                        disabled
                    />
                </div>

                <div>
                    <Typography variant="medium" className="text-black">
                        Người liên hệ
                        <span className="text-red-500"> *</span>
                    </Typography>
                    <TextField
                        fullWidth
                        size="small"
                        hiddenLabel
                        placeholder="Người liên hệ"
                        variant="outlined"
                        color="success"
                        value={editPartner.contactName}
                        onChange={(e) => setEditPartner({ ...editPartner, contactName: e.target.value })}
                    />
                </div>

                {/* Email & Số điện thoại */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <Typography variant="medium" className="text-black">Email</Typography>
                        <TextField
                            fullWidth
                            size="small"
                            hiddenLabel
                            placeholder="Email"
                            variant="outlined"
                            color="success"
                            value={editPartner.email}
                            onChange={(e) => setEditPartner({ ...editPartner, email: e.target.value })}
                            error={!!errorEmail}
                            helperText={errorEmail}
                        />
                    </div>
                    <div>
                        <Typography variant="medium" className="text-black">
                            Số điện thoại
                            <span className="text-red-500"> *</span>
                        </Typography>
                        <TextField
                            fullWidth
                            size="small"
                            hiddenLabel
                            placeholder="Số điện thoại"
                            variant="outlined"
                            color="success"
                            value={editPartner.phone}
                            onChange={(e) => setEditPartner({ ...editPartner, phone: e.target.value })}
                            error={!!errorPhone}
                            helperText={errorPhone}
                        />
                    </div>
                </div>

                {/* Địa chỉ */}
                <div>
                    <Typography variant="medium" className="text-black">
                        Địa chỉ
                        <span className="text-red-500"> *</span>
                    </Typography>
                    <TextField
                        fullWidth
                        size="small"
                        hiddenLabel
                        placeholder="Địa chỉ"
                        variant="outlined"
                        multiline
                        maxRows={2}
                        color="success"
                        value={editPartner.address}
                        onChange={(e) => setEditPartner({ ...editPartner, address: e.target.value })}
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
                    onClick={handleUpdatePartner}
                >
                    Lưu
                </Button>
            </DialogFooter>
        </Dialog>
    );
};

export default EditPartnerModal;
