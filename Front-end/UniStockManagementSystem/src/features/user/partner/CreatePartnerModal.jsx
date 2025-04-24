import React, { useState, useEffect } from "react";
import {
    Dialog,
    DialogHeader,
    DialogBody,
    DialogFooter,
    Typography,
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
import { createPartner, fetchPartnerTypes, getPartnerCodeByType } from "./partnerService";

const CreatePartnerModal = ({ onClose, onSuccess }) => {
    const [partnerTypes, setPartnerTypes] = useState([]);
    const [partnerCodes, setPartnerCodes] = useState([]);
    const [errorMessage, setErrorMessage] = useState("");
    const [errorPartnerName, setErrorPartnerName] = useState("");
    const [errorPartnerCodes, setErrorPartnerCodes] = useState("");
    const [errorEmail, setErrorEmail] = useState("");
    const [errorPhone, setErrorPhone] = useState("");
    const [errorContactName, setErrorContactName] = useState("");
    const [errorAddress, setErrorAddress] = useState("");

    const [newPartner, setNewPartner] = useState({
        partnerName: "",
        address: "",
        phone: "",
        email: "",
        contactName: "",
        partnerTypeIds: [],
    });

    useEffect(() => {
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
    }, []);

    const resetErrorMessages = () => {
        setErrorMessage("");
        setErrorPartnerName("");
        setErrorEmail("");
        setErrorPhone("");
        setErrorContactName("");
        setErrorAddress("");
        setErrorPartnerCodes("");
    };

    const validatePartner = (partner) => {
        let isValid = true;
        resetErrorMessages();

        if (!partner.partnerName.trim()) {
            setErrorPartnerName("Tên đối tác không được để trống.");
            isValid = false;
        }

        if (!partner.contactName.trim()) {
            setErrorContactName("Người liên hệ không được để trống.");
            isValid = false;
        }
        if (!partner.phone.trim()) {
            setErrorPhone("Số điện thoại không được để trống.");
            isValid = false;
        }
        if (!partner.address.trim()) {
            setErrorAddress("Địa chỉ không được để trống.");
            isValid = false;
        }

        if (partnerCodes.length === 0) {
            setErrorPartnerCodes("Hãy chọn ít nhất một mã đối tác.");
            isValid = false;
        }

        return isValid;
    };

    const handlePartnerTypeChange = async (selectedOptions) => {
        setErrorPartnerCodes("");
        const selectedIds = selectedOptions.map(option => option.value);

        setNewPartner(prev => ({
            ...prev,
            partnerTypeIds: selectedIds
        }));

        if (selectedIds.length > 0) {
            try {
                const codes = await Promise.all(selectedIds.map(id => getPartnerCodeByType(id)));
                setPartnerCodes(codes);
            } catch (error) {
                setPartnerCodes([]);
            }
        } else {
            setPartnerCodes([]);
        }
    };

    const handleCreatePartner = async () => {
        if (!validatePartner(newPartner)) return;
        try {
            const partnerData = {
                partnerName: newPartner.partnerName,
                address: newPartner.address,
                phone: newPartner.phone,
                email: newPartner.email,
                contactName: newPartner.contactName,
                partnerCodes: partnerCodes,
            };

            await createPartner(partnerData);
            onSuccess("Tạo đối tác thành công");
            onClose();
        } catch (error) {
            console.error("Lỗi khi tạo đối tác:", error);
            if (error.response?.status === 409) {
                const errorCode = error.response.data;
                if (errorCode === "DUPLICATE_NAME") {
                    setErrorPartnerName("Tên đối tác đã tồn tại.");
                } else if (errorCode === "NO_PARTNER_TYPE") {
                    setErrorPartnerCodes("Hãy chọn ít nhất một nhóm đối tác.");
                }
            } 
            if (error.response?.status === 400 && error.response?.data.fieldErrorMessages) {
                // ✅ Đây là lỗi validation từ backend trả về dạng ErrorResponse
                setErrorPartnerName(error.response.data.fieldErrorMessages.partnerName || "");
                setErrorEmail(error.response.data.fieldErrorMessages.email || "");
                setErrorPhone(error.response.data.fieldErrorMessages.phone || "");
                setErrorContactName(error.response.data.fieldErrorMessages.contactName || "");
                setErrorAddress(error.response.data.fieldErrorMessages.address || "");

            } 
        }
    };

    return (
        <Dialog open={true} handler={onClose} size="md" className="px-4 py-2">
            {/* Header của Dialog */}
            <DialogHeader className="flex justify-between items-center pb-2">
                <Typography variant="h4" color="blue-gray">
                    Thêm đối tác
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
                        error={!!errorPartnerName}
                        value={newPartner.partnerName}
                        onChange={(e) => setNewPartner({ ...newPartner, partnerName: e.target.value })}
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
                                newPartner.partnerTypeIds?.includes(s.value)
                            )
                        }
                        onChange={(event, selectedOptions) => {
                            handlePartnerTypeChange(selectedOptions);
                        }}
                        error={!!errorPartnerCodes}
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
                        value={partnerCodes.join(", ")}
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
                        error={!!errorContactName}
                        value={newPartner.contactName}
                        onChange={(e) => setNewPartner({ ...newPartner, contactName: e.target.value })}
                    />
                    {errorContactName && <Typography variant="small" color="red">{errorContactName}</Typography>}
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
                            value={newPartner.email}
                            onChange={(e) => setNewPartner({ ...newPartner, email: e.target.value })}
                            error={!!errorEmail}
                        />
                        {errorEmail && <Typography variant="small" color="red">{errorEmail}</Typography>}
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
                            value={newPartner.phone}
                            onChange={(e) => setNewPartner({ ...newPartner, phone: e.target.value })}
                            error={!!errorPhone}
                        />
                        {errorPhone && <Typography variant="small" color="red">{errorPhone}</Typography>}
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
                        error={!!errorAddress}
                        value={newPartner.address}
                        onChange={(e) => setNewPartner({ ...newPartner, address: e.target.value })}
                    />
                    {errorAddress && <Typography variant="small" color="red">{errorAddress}</Typography>}
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
                    onClick={handleCreatePartner}
                >
                    Lưu
                </Button>
            </DialogFooter>
        </Dialog>
    );
};

export default CreatePartnerModal;
