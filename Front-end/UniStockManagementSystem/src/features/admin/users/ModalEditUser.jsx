import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogHeader,
  DialogBody,
  DialogFooter,
  Typography,
  Button,
  Switch,
} from "@material-tailwind/react";
import { TextField, Divider, Button as MuiButton, IconButton } from "@mui/material";
import { updateUser, checkEmailExists } from "./userService";
import { getAllRoles } from "../roles/roleService";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { LocalizationProvider, DatePicker } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import "dayjs/locale/vi"; // Import Tiếng Việt
import updateLocale from 'dayjs/plugin/updateLocale';

const ModalEditUser = ({ open, onClose, onSuccess, user, fetchUsers }) => {
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [address, setAddress] = useState("");
  const [fullname, setFullname] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [roles, setRoles] = useState([]);
  const [selectedRoles, setSelectedRoles] = useState(new Set());
  const [error, setError] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (user) {
      setEmail(user.email || "");
      setIsActive(user.isActive || false);
      setIsAdmin(user.roleNames?.includes("ADMIN"));
      setFullname(user.userDetail?.fullname || "");
      setPhoneNumber(user.userDetail?.phoneNumber || "");
      setAddress(user.userDetail?.address || "");
      setDateOfBirth(
        user.userDetail?.dateOfBirth && dayjs(user.userDetail.dateOfBirth).isValid()
          ? dayjs(user.userDetail.dateOfBirth)
          : null
      );
      setSelectedRoles(new Set(user.roleIds || []));
    }
  }, [user]);

  useEffect(() => {
    if (open) {
      getAllRoles()
        .then((data) => {
          setRoles(data);
        })
        .catch((error) => {
          console.error("❌ Lỗi khi lấy danh sách Role:", error);
        });
    }
  }, [open]);

  // Kiểm tra định dạng email hợp lệ
  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Kiểm tra email đã tồn tại
  const handleCheckEmail = async (newEmail) => {
    setEmail(newEmail);
    setEmailError("");

    if (!newEmail.trim()) {
      setEmailError("Vui lòng nhập email!");
      return;
    }

    if (!isValidEmail(newEmail)) {
      setEmailError("Email không hợp lệ!");
      return;
    }

    if (newEmail !== user.email) {
      try {
        const emailExists = await checkEmailExists(newEmail);
        if (emailExists) {
          setEmailError("Email này đã được sử dụng!");
        }
      } catch (error) {
        console.error("❌ Lỗi kiểm tra email:", error);
      }
    }
  };

  // Kiểm tra mật khẩu có đủ mạnh không
  const isValidPassword = (password) => {
    return password.length >= 8 && /[A-Za-z]/.test(password) && /\d/.test(password);
  };

  const handlePasswordChange = (newPassword) => {
    setPassword(newPassword);
    setPasswordError("");

    if (newPassword.trim() && !isValidPassword(newPassword)) {
      setPasswordError("Mật khẩu phải có ít nhất 8 ký tự, gồm cả số và chữ!");
    }
  };

  // Xử lý chọn/bỏ chọn role
  const handleRoleChange = (roleId) => {
    setSelectedRoles((prevRoles) => {
      const updatedRoles = new Set(prevRoles);
      if (updatedRoles.has(roleId)) {
        updatedRoles.delete(roleId);
      } else {
        updatedRoles.add(roleId);
      }
      return updatedRoles;
    });
  };

  // Cập nhật user
  const handleUpdateUser = async () => {
    setError("");

    if (!email.trim() || emailError) {
      setEmailError("Vui lòng nhập email hợp lệ!");
      return;
    }

    if (password.trim() && passwordError) {
      setPasswordError("Mật khẩu không hợp lệ!");
      return;
    }

    if (selectedRoles.size === 0) {
      setError("Vui lòng chọn ít nhất một vai trò!");
      return;
    }

    const updatedUser = {
      userId: user.userId,
      email,
      isActive: isAdmin ? user.isActive : isActive,
      password: password.trim() !== "" ? password : undefined,
      roleIds: Array.from(selectedRoles),
      userDetail: {
        fullname,
        phoneNumber,
        address,
        dateOfBirth: dateOfBirth ? dayjs(dateOfBirth).format("YYYY-MM-DD") : "",
      },
    };

    try {
      await updateUser(user.userId, updatedUser);
      fetchUsers();
      onSuccess("Cập nhật người dùng thành công!")
      onClose();
    } catch (error) {
      console.error("❌ Lỗi khi cập nhật người dùng:", error);
    }
  };

  return (
    <Dialog open={open} handler={onClose} size="md" className="px-4 py-2">
      <DialogHeader className="flex justify-between items-center pb-2">
        <Typography variant="h4" color="blue-gray">
          Chỉnh sửa người dùng
        </Typography>
        <IconButton
          size="small"
          onClick={onClose}
        >
          <XMarkIcon className="h-5 w-5 stroke-2" />
        </IconButton>
      </DialogHeader>
      <Divider variant="middle" />
      <DialogBody className="space-y-4 pb-4 pt-6">
        {/* Tên người dùng */}
        <div>
          <Typography variant="medium" className="text-black">
            Họ và tên
            {/* <span className="text-red-500"> *</span> */}
          </Typography>
          <TextField
            fullWidth
            size="small"
            hiddenLabel
            placeholder="Họ và tên"
            color="success"
            value={fullname}
            onChange={(e) => setFullname(e.target.value)}
          />
        </div>

        {/* Ngày sinh với DatePicker hỗ trợ Tiếng Việt */}
        <div>
          <Typography variant="medium" className="text-black">
            Ngày sinh
            {/* <span className="text-red-500"> *</span> */}
          </Typography>
          <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="vi">
            <style>
              {`.MuiPickersCalendarHeader-label { text-transform: capitalize !important; }`}
            </style>
            <DatePicker
              value={dateOfBirth}
              onChange={(newValue) => setDateOfBirth(newValue)}
              format="DD/MM/YYYY" // Hiển thị ngày theo định dạng Việt Nam
              dayOfWeekFormatter={(weekday) => `${weekday.format('dd')}`}
              slotProps={{
                popper: {
                  color: "success",
                  sx: { zIndex: 9999 }, // Cố định z-index trong Popper
                },
                day: {
                  sx: (theme) => ({
                    "&.Mui-selected": {
                      backgroundColor: "#0ab067 !important", // Xanh lá
                      color: "white",
                    },
                    "&.Mui-selected:hover": {
                      backgroundColor: "#089456 !important", // Xanh lá đậm khi hover
                    },
                    "&:hover": {
                      backgroundColor: "#0894561A !important", // Màu xanh lá nhạt khi hover bất kỳ ngày nào
                    },
                  }),
                },
                textField: { hiddenLabel: true, fullWidth: true, size: "small", color: "success" }
              }}
            />
          </LocalizationProvider>
        </div>

        {/* Email */}
        <div>
          <Typography variant="medium" className="text-black">
            Email
          </Typography>
          <TextField
            fullWidth
            size="small"
            hiddenLabel
            placeholder="Email"
            color="success"
            value={email}
            onChange={(e) => handleCheckEmail(e.target.value)}
            error={!!emailError}
          />
          {emailError && <Typography variant="small" color="red">{emailError}</Typography>}
        </div>

        <div>
          <Typography variant="medium" className="text-black">
            Số điện thoại
            {/* <span className="text-red-500"> *</span> */}
          </Typography>
          <TextField
            fullWidth
            size="small"
            hiddenLabel
            placeholder="Số điện thoại"
            variant="outlined"
            color="success"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
          />
        </div>

        <div>
          <Typography variant="medium" className="text-black">
            Địa chỉ
            {/* <span className="text-red-500"> *</span> */}
          </Typography>
          <TextField
            fullWidth
            size="small"
            hiddenLabel
            placeholder="Địa chỉ"
            variant="outlined"
            color="success"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
        </div>

        {/* Mật khẩu */}
        <div className="relative">
          <Typography variant="medium" className="text-black">
            Mật khẩu
          </Typography>
          <div className="relative">
            <TextField
              fullWidth
              size="small"
              type={showPassword ? "text" : "password"}
              hiddenLabel
              placeholder="Mật khẩu"
              variant="outlined"
              color="success"
              value={password}
              onChange={(e) => handlePasswordChange(e.target.value)}
              error={!!passwordError}
            />
            <button
              type="button"
              className="absolute inset-y-0 right-3 flex items-center text-gray-600"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
            </button>
          </div>
          {passwordError && <Typography variant="small" color="red">{passwordError}</Typography>}
        </div>

        <div className="grid grid-cols-3">
          {/* Vai trò */}
          <div className="col-span-2">
            <Typography variant="medium" className="text-black">
              Vai trò
            </Typography>
            <div className="flex flex-wrap gap-2">
            {roles
                .filter((r) => r.name !== "USER" && (!isAdmin ? r.name !== "ADMIN" : true))
                .map((r) => (
                  <MuiButton
                    key={r.id}
                    onClick={() => handleRoleChange(r.id)}
                    variant={selectedRoles.has(r.id) ? "contained" : "outlined"}
                    disabled={r.name === "ADMIN" && isAdmin}
                  >
                    {r.name}
                  </MuiButton>
                ))}
              {roles.filter((r) => r.name !== "USER" && (!isAdmin ? r.name !== "ADMIN" : true))
                .length === 0 && (
                <p className="text-sm text-gray-500">Không có sẵn vai trò.</p>
              )}
            </div>
          </div>
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
          onClick={handleUpdateUser}
        >
          Lưu
        </Button>
      </DialogFooter>
    </Dialog>
  );
};

export default ModalEditUser;
