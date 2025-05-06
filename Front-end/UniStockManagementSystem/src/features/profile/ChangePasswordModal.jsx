import React from "react";
import {
  Dialog,
  DialogHeader,
  DialogBody,
  DialogFooter,
  Typography,
  Button,
} from "@material-tailwind/react";
import { TextField, Button as MuiButton, Divider, FormControl, OutlinedInput, IconButton } from "@mui/material";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { FaEye, FaEyeSlash } from "react-icons/fa";

const ChangePasswordModal = ({
  open,
  onClose,
  onSave,
  currentPassword,
  setCurrentPassword,
  newPassword,
  setNewPassword,
  confirmPassword,
  setConfirmPassword,
  errorCurrentPassword,
  setErrorCurrentPassword,
  errorNewPassword,
  setErrorNewPassword,
  errorConfirmPassword,
  setErrorConfirmPassword,
  resetPasswordForm,
}) => {
  const validatePassword = () => {
    let isValid = true;
    setErrorCurrentPassword("");
    setErrorNewPassword("");
    setErrorConfirmPassword("");

    if (!currentPassword.trim()) {
      setErrorCurrentPassword("Mật khẩu hiện tại không được để trống.");
      isValid = false;
    }

    if (!newPassword.trim()) {
      setErrorNewPassword("Mật khẩu mới không được để trống.");
      isValid = false;
    }

    if (!confirmPassword.trim()) {
      setErrorConfirmPassword("Nhập lại mật khẩu không được để trống.");
      isValid = false;
    }

    return isValid;
  };

  const handleSave = async () => {
    console.log("handleSave invoked");

    let isValid = true;

    if (!validatePassword()) {
      console.log("Validation failed");
      return;
    }

    if (newPassword !== confirmPassword) {
      console.log("Passwords do not match");
      setErrorConfirmPassword("Mật khẩu không trùng khớp.");
      isValid = false;
    }

    const regex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;
    if (!regex.test(newPassword)) {
      console.log("Password does not meet requirements");
      setErrorNewPassword("Mật khẩu phải có ít nhất 8 ký tự, gồm cả số và chữ!");
      isValid = false;
    }
    if (isValid) {
      await onSave(); // Gọi onSave (handleChangePassword từ useProfile.js)
    }
  };

  const handleClose = () => {
    setErrorCurrentPassword(null);
    setErrorNewPassword(null);
    setErrorConfirmPassword(null);
    resetPasswordForm(); // Reset form khi thành công
    onClose();
  };

  return (
    <Dialog open={open} handler={handleClose} size="sm" className="px-4 py-2">
      <DialogHeader className="flex justify-between items-center pb-2">
        <Typography variant="h4" color="blue-gray">
          Đổi mật khẩu
        </Typography>
        <IconButton size="small" variant="text" onClick={handleClose}>
          <XMarkIcon className="h-5 w-5 stroke-2" />
        </IconButton>
      </DialogHeader>
      <Divider variant="middle" />
      <DialogBody className="space-y-4 pb-6 pt-4">
        <div>
          <Typography variant="medium" className="text-black">
            Mật khẩu hiện tại <span className="text-red-500">*</span>
          </Typography>
          <TextField
            fullWidth
            size="small"
            type="password"
            hiddenLabel
            placeholder="Mật khẩu hiện tại"
            variant="outlined"
            color="success"
            value={currentPassword}
            onChange={(e) => {
              setCurrentPassword(e.target.value);
              setErrorCurrentPassword("");
            }}
            error={Boolean(errorCurrentPassword)}
          />
          {errorCurrentPassword && (
            <Typography color="red" className="text-xs text-start mt-1">
              {errorCurrentPassword}
            </Typography>
          )}
        </div>
        <div>
          <Typography variant="medium" className="text-black">
            Mật khẩu mới <span className="text-red-500">*</span>
          </Typography>
          <TextField
            fullWidth
            size="small"
            type="password"
            hiddenLabel
            placeholder="Mật khẩu mới"
            variant="outlined"
            color="success"
            value={newPassword}
            onChange={(e) => {
              setNewPassword(e.target.value);
              setErrorNewPassword("");
            }}
            error={Boolean(errorNewPassword)}
          />
          {errorNewPassword && (
            <Typography color="red" className="text-xs text-start mt-1">
              {errorNewPassword}
            </Typography>
          )}
        </div>
        <div>
          <Typography variant="medium" className="text-black">
            Nhập lại mật khẩu mới <span className="text-red-500">*</span>
          </Typography>
          <TextField
            fullWidth
            size="small"
            type="password"
            hiddenLabel
            placeholder="Nhập lại mật khẩu mới"
            variant="outlined"
            color="success"
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              setErrorConfirmPassword("");
            }}
            error={Boolean(errorConfirmPassword)}
          />
          {errorConfirmPassword && (
            <Typography color="red" className="text-xs text-start mt-1">
              {errorConfirmPassword}
            </Typography>
          )}
        </div>
      </DialogBody>
      <DialogFooter className="pt-0">
        <MuiButton size="medium" color="error" variant="outlined" onClick={handleClose}>
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

export default ChangePasswordModal;