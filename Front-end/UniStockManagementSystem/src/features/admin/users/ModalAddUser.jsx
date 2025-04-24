import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogHeader,
  DialogBody,
  DialogFooter,
  Switch,
  Button,
  Typography,
} from "@material-tailwind/react";
import { TextField, Divider, Button as MuiButton, IconButton } from "@mui/material";
import { getAllRoles } from "../roles/roleService";
import { checkEmailExists, createUser } from "../users/userService";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { FaEye, FaEyeSlash } from "react-icons/fa";

const ModalAddUser = ({ open, onClose, onSuccess, fetchUsers }) => {
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [fullname, setFullname] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [roles, setRoles] = useState([]);
  const [selectedRoles, setSelectedRoles] = useState(new Set());
  const [isActive, setIsActive] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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

  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

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

    try {
      const emailExists = await checkEmailExists(newEmail);
      if (emailExists) {
        setEmailError("Email này đã được sử dụng!");
      }
    } catch (error) {
      console.error("❌ Lỗi kiểm tra email:", error);
    }
  };

  const isValidPassword = (password) => {
    return password.length >= 8 && /[A-Za-z]/.test(password) && /\d/.test(password);
  };

  const handlePasswordChange = (newPassword) => {
    setPassword(newPassword);
    setPasswordError("");

    if (!isValidPassword(newPassword)) {
      setPasswordError("Mật khẩu phải có ít nhất 8 ký tự, gồm cả số và chữ!");
    }
  };

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

  const handleAddUser = async () => {
    setError("");

    if (!email.trim() || emailError) {
      setEmailError("Vui lòng nhập email hợp lệ!");
      return;
    }

    if (!password.trim() || passwordError) {
      setPasswordError("Mật khẩu không hợp lệ!");
      return;
    }

    const userData = {
      username: email.split("@")[0],
      email,
      password,
      isActive: true,
      roleIds: Array.from(selectedRoles),
      userDetail: {
        fullname,
        phoneNumber,
        address: "Địa chỉ chưa cập nhật",
        dateOfBirth: "",
        profilePicture: "",
      },
    };

    console.log("🚀 Đang gửi request API:", userData);

    try {
      setLoading(true);
      const response = await createUser(userData);
      fetchUsers();
      console.log("✅ User đã tạo:", response);
      onSuccess("Tạo người dùng thành công!");
      onClose();
    } catch (error) {
      console.error("❌ Lỗi khi tạo user:", error);
      setError("Lỗi khi tạo user, vui lòng kiểm tra lại!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={true} handler={onClose} size="md" className="px-4 py-2">
      {/* Header của Dialog */}
      <DialogHeader className="flex justify-between items-center pb-2">
        <Typography variant="h4" color="blue-gray">
          Thêm người dùng
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

        {/* Tên người dùng */}
        <div>
          <Typography variant="medium" className="text-black">
            Họ và tên
            <span className="text-red-500"> *</span>
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

        {/* Email */}
        <div>
          <Typography variant="medium" className="text-black">
            Email
            <span className="text-red-500"> *</span>
          </Typography>
          <TextField
            fullWidth
            size="small"
            hiddenLabel
            placeholder="Email"
            color="success"
            value={email}
            onChange={(e) => handleCheckEmail(e.target.value)}
          />
          {emailError && <Typography variant="small" color="red">{emailError}</Typography>}
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
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
          />
        </div>

        {/* Mật khẩu */}
        <div className="relative">
          <Typography variant="medium" className="text-black">
            Mật khẩu
            <span className="text-red-500"> *</span>
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
                .filter((r) => r.name !== "USER" && r.name !== "ADMIN").length > 0 ? (
                roles
                  .filter((r) => r.name !== "USER" && r.name !== "ADMIN")
                  .map((r) => (
                    <MuiButton
                      size="medium"
                      variant={selectedRoles.has(r.id) ? "contained" : "outlined"}
                      key={r.id}
                      onClick={() => handleRoleChange(r.id)}
                    >
                      {r.name}
                    </MuiButton>
                  ))
              ) : (
                <p className="text-sm text-gray-500">Không có sẵn vai trò.</p>
              )}
            </div>
          </div>
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
          onClick={handleAddUser}
        >
          Lưu
        </Button>
      </DialogFooter>
    </Dialog>
  );
};

export default ModalAddUser;