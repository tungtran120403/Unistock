import React, { useRef, useState, useEffect } from 'react';
import { TextField, Button as MuiButton, Avatar, Chip, Link } from '@mui/material';
import { Card, Button, CardBody, Typography } from "@material-tailwind/react";
import { FaEdit } from "react-icons/fa";
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import PageHeader from '@/components/PageHeader';
import ChangePasswordModal from './ChangePasswordModal';
import useProfile from './useProfile';
import SuccessAlert from "@/components/SuccessAlert";
import CircularProgress from '@mui/material/CircularProgress';

const Profile = () => {
  const {
    profile,
    isEditing,
    openChangePassword,
    loading,
    error,
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
    handleEdit,
    handleCancel,
    handleSave,
    handleChangePassword,
    handleAvatarUpload,
    handleInputChange,
    setOpenChangePassword,
  } = useProfile();

  const fileInputRef = useRef(null);

  const rolesArray = Array.isArray(profile.role)
    ? profile.role
    : (profile.role ? profile.role.split(',').map(r => r.trim()) : []);

  const onFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleAvatarUpload(file);
    }
  };

  const onChangePasswordSave = async () => {
    const isSuccess = await handleChangePassword();
    if (isSuccess) {
      setAlertMessage('Đổi mật khẩu thành công!');
      setSuccessAlert(true);
    }
  };

  const [successAlert, setSuccessAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState(false);

  useEffect(() => {
    const successFlag = localStorage.getItem('avatarUploadSuccess');
    if (successFlag === 'true') {
      setAlertMessage('Cập nhật ảnh đại diện thành công!');
      setSuccessAlert(true);
      localStorage.removeItem('avatarUploadSuccess'); // xoá để không hiện lại lần sau
    }
  }, []);

  const onSaveClick = async () => {
    const isSuccess = await handleSave();
    if (isSuccess) {
      setAlertMessage('Cập nhật thông tin cá nhân thành công!');
      setSuccessAlert(true);
    }
  };

  const [dotCount, setDotCount] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setDotCount((prev) => (prev < 3 ? prev + 1 : 0));
    }, 500);
    return () => clearInterval(interval);
  }, []);

  if (loading && !isEditing) {
    return (
      <div className="flex justify-center items-center" style={{ height: '60vh' }}>
        <div className="flex flex-col items-center">
          <CircularProgress size={50} thickness={4} sx={{ mb: 2, color: '#0ab067' }} />
          <Typography variant="body1">
            Đang tải{'.'.repeat(dotCount)}
          </Typography>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-8 flex flex-col gap-12" style={{ height: 'calc(100vh-100px)' }}>
      <Card className="bg-gray-50 p-7 rounded-none shadow-none">
        <CardBody className="pb-2 bg-white rounded-xl">
          <PageHeader
            title="Thông tin tài khoản"
            showAdd={false}
            showImport={false}
            showExport={false}
          />

          <div className='flex px-10 gap-20 mb-6 mt-10'>
            <div className='flex flex-col gap-4 items-center'>
              {/* <Avatar src={profile.avatar} sx={{ width: 200, height: 200 }} /> */}
              <div className='relative'>
                <Avatar src={profile.avatar} sx={{ width: 200, height: 200 }} />
                {loading && (
                  <div className="absolute inset-0 bg-white/60 flex items-center justify-center rounded-full">
                    <CircularProgress size={48} color="success" />
                  </div>
                )}
              </div>

              <Button
                size="lg"
                color="white"
                className="bg-[#0ab067] hover:bg-[#089456]/90 shadow-none text-white font-medium py-2 px-4 rounded-[4px] transition-all duration-200 ease-in-out"
                ripple={true}
                variant="contained"
                onClick={() => {
                  fileInputRef.current && fileInputRef.current.click();
                }}
              >
                <div className='flex items-center gap-2'>
                  <CloudUploadIcon />
                  <span className='pt-1'>Tải ảnh lên</span>
                </div>
              </Button>
              <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                onChange={onFileChange}
                accept="image/*"
              />
            </div>
            <div className="flex flex-col gap-4">
              <div>
                <Typography variant="small" className="mb-2 font-bold text-gray-900">
                  Họ và tên
                </Typography>
                <TextField
                  size="small"
                  hiddenLabel
                  variant="outlined"
                  color="success"
                  value={profile.fullName}
                  onChange={handleInputChange('fullName')}
                  disabled={!isEditing}
                  sx={{
                    width: '500px',
                    '& .MuiInputBase-root.Mui-disabled': {
                      bgcolor: '#eeeeee',
                      '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
                    },
                  }}
                />
              </div>
              <div>
                <Typography variant="small" className="mb-2 font-bold text-gray-900">
                  Email
                </Typography>
                <TextField
                  size="small"
                  hiddenLabel
                  variant="outlined"
                  type="email"
                  color="success"
                  value={profile.email}
                  onChange={handleInputChange('email')}
                  disabled
                  sx={{
                    width: '500px',
                    '& .MuiInputBase-root.Mui-disabled': {
                      bgcolor: '#eeeeee',
                      '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
                    },
                  }}
                />
              </div>
              <div>
                <Typography variant="small" className="mb-2 font-bold text-gray-900">
                  Số điện thoại
                </Typography>
                <TextField
                  size="small"
                  hiddenLabel
                  variant="outlined"
                  color="success"
                  value={profile.phone}
                  onChange={handleInputChange('phone')}
                  disabled={!isEditing}
                  sx={{
                    width: '500px',
                    '& .MuiInputBase-root.Mui-disabled': {
                      bgcolor: '#eeeeee',
                      '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
                    },
                  }}
                />
                {error && (
                  <Typography color="red" className="text-sm">
                    {error}
                  </Typography>
                )}
              </div>
              <div>
                <Typography variant="small" className="mb-2 font-bold text-gray-900">
                  Mật khẩu
                </Typography>
                <div className='flex items-center gap-8'>
                  <TextField
                    size="small"
                    hiddenLabel
                    variant="outlined"
                    color="success"
                    type="text" // Đổi thành text để hiển thị dấu sao
                    value="********" // Giá trị cố định là 8 dấu sao
                    disabled
                    sx={{
                      width: '500px',
                      '& .MuiInputBase-root.Mui-disabled': {
                        bgcolor: '#eeeeee',
                        '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
                      },
                    }}
                  />
                  <Link component="button" onClick={() => setOpenChangePassword(true)}>
                    Đổi mật khẩu
                  </Link>
                </div>
              </div>
              <div>
                <Typography variant="small" className="mb-2 font-bold text-gray-900">
                  Vai trò
                </Typography>
                {rolesArray.length > 0 ? (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {rolesArray
                      .filter((role) => role.toLowerCase() !== "user")
                      .map((role, index) => (
                        <Chip key={index} label={role} variant="outlined" color="primary" />
                      ))}

                  </div>
                ) : (
                  <Typography variant="body2">Không có vai trò</Typography>
                )}
              </div>
              <div className="flex justify-end mr-32">
                {!isEditing ? (
                  <MuiButton
                    variant="contained"
                    size="medium"
                    onClick={handleEdit}
                    sx={{ boxShadow: 'none', '&:hover': { boxShadow: 'none' } }}
                  >
                    <div className='flex items-center gap-2'>
                      <FaEdit className="h-4 w-4" />
                      <span>Chỉnh sửa</span>
                    </div>
                  </MuiButton>
                ) : (
                  <div className="flex items-center gap-2">
                    <MuiButton size="medium" color="error" variant="outlined" onClick={handleCancel}>
                      Hủy
                    </MuiButton>
                    <Button
                      size="lg"
                      color="white"
                      variant="text"
                      className="bg-[#0ab067] hover:bg-[#089456]/90 shadow-none text-white font-medium py-2 px-4 rounded-[4px] transition-all duration-200 ease-in-out"
                      ripple={true}
                      onClick={onSaveClick}
                    >
                      Lưu
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardBody>
      </Card>
      <ChangePasswordModal
        open={openChangePassword}
        onClose={() => setOpenChangePassword(false)}
        onSave={onChangePasswordSave}
        currentPassword={currentPassword}
        setCurrentPassword={setCurrentPassword}
        newPassword={newPassword}
        setNewPassword={setNewPassword}
        confirmPassword={confirmPassword}
        setConfirmPassword={setConfirmPassword}
        errorCurrentPassword={errorCurrentPassword}
        setErrorCurrentPassword={setErrorCurrentPassword}
        errorNewPassword={errorNewPassword}
        setErrorNewPassword={setErrorNewPassword}
        errorConfirmPassword={errorConfirmPassword}
        setErrorConfirmPassword={setErrorConfirmPassword}
        resetPasswordForm={resetPasswordForm}
      />

      <SuccessAlert
        open={successAlert}
        onClose={() => setSuccessAlert(false)}
        message={alertMessage}
      />

    </div>
  );
};

export default Profile;