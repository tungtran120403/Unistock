import React, { useState } from "react";
import {
  Dialog,
  DialogHeader,
  DialogBody,
  DialogFooter,
  Typography,
  Input,
  Button,
} from "@material-tailwind/react";
import { TextField, Divider, IconButton, Button as MuiButton } from "@mui/material";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { createPartner, getPartnerCodeByType } from "../partner/partnerService";

const ModalAddCustomer = ({ onClose, onSuccess }) => {
  const [errorMessage, setErrorMessage] = useState("");
  const [errorPartnerName, setErrorPartnerName] = useState("");
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
  });

  const resetErrorMessages = () => {
    setErrorMessage("");
    setErrorPartnerName("");
    setErrorEmail("");
    setErrorPhone("");
    setErrorContactName("");
    setErrorAddress("");
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
    return isValid;
  };

  const handleCreatePartner = async () => {
    if (!validatePartner(newPartner)) return;

    try {
      // Lấy partnerCode tự động cho nhóm đối tác = 1
      const code = await getPartnerCodeByType(1);
      console.log("Đã lấy partner code:", code);

      const partnerData = {
        partnerName: newPartner.partnerName,
        address: newPartner.address,
        phone: newPartner.phone,
        email: newPartner.email,
        contactName: newPartner.contactName,
        partnerCodes: [code],
      };

      console.log("Payload gửi lên createPartner:", partnerData);
      const createdPartner = await createPartner(partnerData);

      // Định dạng dữ liệu phù hợp với danh sách customers
      const newCustomer = {
        code: code,
        label: `${code} - ${createdPartner.partnerName}`,
        name: createdPartner.partnerName,
        address: createdPartner.address,
        phone: createdPartner.phone,
        contactName: createdPartner.contactName || "",
      };

      // Gọi onSuccess với dữ liệu đã định dạng
      onSuccess(newCustomer);
      onClose();
    } catch (error) {
      console.error("Lỗi khi tạo đối tác:", error);
      if (error.response) {
        console.error("error.response.data:", error.response.data);
        console.error("error.response.status:", error.response.status);
      }
      if (error.response?.status === 409) {
        const errorCode = error.response.data;
        if (errorCode === "DUPLICATE_NAME") {
          setErrorPartnerName("Tên đối tác đã tồn tại.");
        }
      } else if (error.response?.status === 400 && error.response?.data.fieldErrorMessages) {
        setErrorPartnerName(error.response.data.fieldErrorMessages.partnerName || "");
        setErrorEmail(error.response.data.fieldErrorMessages.email || "");
        setErrorPhone(error.response.data.fieldErrorMessages.phone || "");
        setErrorContactName(error.response.data.fieldErrorMessages.contactName || "");
        setErrorAddress(error.response.data.fieldErrorMessages.address || "");
      } else {
        setErrorMessage("Lỗi khi tạo đối tác! Vui lòng thử lại.");
      }
    }
  };

  return (
    <Dialog open={true} handler={onClose} size="md" className="px-4 py-2">
      <DialogHeader className="flex justify-between items-center pb-2">
        <Typography variant="h4" color="blue-gray">
          Thêm đối tác khách hàng
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
        {errorMessage && <Typography variant="small" color="red" className="mb-4">{errorMessage}</Typography>}

        <div>
          <Typography variant="medium" className="text-black">
            Tên khách hàng
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
            onChange={(e) => {
              setErrorPartnerName("");
              setNewPartner({ ...newPartner, partnerName: e.target.value })
            }}
          />
          {errorPartnerName && <Typography variant="small" color="red">{errorPartnerName}</Typography>}
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
            value={newPartner.contactName}
            onChange={(e) => {
              setErrorContactName("");
              setNewPartner({ ...newPartner, contactName: e.target.value })
            }}
            error={!!errorContactName}
          />
          {errorContactName && <Typography variant="small" color="red">{errorContactName}</Typography>}
        </div>

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
              onChange={(e) => {
                setErrorEmail("");
                setNewPartner({ ...newPartner, email: e.target.value })
              }}
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
              onChange={(e) => {
                setErrorPhone("");
                setNewPartner({ ...newPartner, phone: e.target.value })
              }}
              error={!!errorPhone}
            />
            {errorPhone && <Typography variant="small" color="red">{errorPhone}</Typography>}
          </div>
        </div>

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
            value={newPartner.address}
            onChange={(e) => {
              setErrorAddress("");
              setNewPartner({ ...newPartner, address: e.target.value })
            }}
            error={!!errorAddress}
          />
          {errorAddress && <Typography variant="small" color="red">{errorAddress}</Typography>}
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
          onClick={handleCreatePartner}
        >
          Lưu
        </Button>
      </DialogFooter>
    </Dialog>
  );
};

export default ModalAddCustomer;