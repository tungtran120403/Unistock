import React, { useState, useEffect } from "react";
import { TextField, Button, Box } from "@mui/material";
import { Typography } from "@material-tailwind/react";
import { useNavigate, useLocation } from "react-router-dom";
import { useForgotPassword } from "./useForgotPassword";

const ConfirmOTPPage = () => {
  // Chỉ cần trường OTP
  const [otp, setOtp] = useState("");
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const { handleVerifyOtp, loading, error } = useForgotPassword();
  const navigate = useNavigate();

  // Lấy email từ trang trước (ForgotPassword) truyền qua navigate(...)
  // Nếu bạn không dùng navigate state, có thể dùng localStorage hoặc Redux
  const location = useLocation();
  const email = location.state?.email || "";

  useEffect(() => {
    document.body.style.backgroundImage = "url(/img/bg.svg)";
    document.body.style.backgroundSize = "cover";
    document.body.style.backgroundRepeat = "none";
    document.body.style.backgroundPosition = "center";

    return () => {
      document.body.style.backgroundImage = null;
      document.body.style.backgroundSize = null;
      document.body.style.backgroundPosition = null;
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    if (!otp) {
      setErrorMessage("Vui lòng nhập mã OTP để xác thực");
      return;
    }
  
    try {
      // Gọi hook
      const result = await handleVerifyOtp(email, otp);
  
      // Nếu code đến đây, nghĩa là không có lỗi => OTP đúng
      // Kiểm tra ephemeralToken
      if (result?.ephemeralToken) {
        navigate("/resetPassword", {
          state: { email, ephemeralToken: result.ephemeralToken },
        });
      } 
    } catch (err) {
      // Sẽ vào đây nếu hook throw lỗi => OTP sai
      console.error("Lỗi xác thực OTP:", err);
      // error đã được set trong hook, component chỉ log hoặc làm gì tùy ý
    }
  };
  

  return (
    <div className="w-full h-screen flex items-center justify-center bg-cover bg-center">
      <div className="flex items-center justify-center gap-20 w-[1200px] py-20 bg-white shadow-blue-gray-900 shadow-[0_0_40px_rgba(0,0,0,0.2)]">
        <Box className="flex flex-col items-center justify-center p-8 rounded-xl max-w-md h-[500px] w-full bg-[#0ab067]/10">
          <div className="pb-8">
            <Typography variant="h2" className="font-bold text-center">
              Mã OTP đã được gửi
            </Typography>
            <Typography className="text-sm text-blue-gray-500">
              Hãy nhập OTP gửi đến email của bạn để đặt lại mật khẩu
            </Typography>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 w-full px-5">
            <div>
              <Typography>Nhập mã OTP</Typography>
              <TextField
                fullWidth
                size="small"
                color="success"
                variant="outlined"
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
              />
            </div>
            {/* Hiển thị lỗi từ state */}
            {errorMessage && (
              <Typography color="red" className="text-red-500">
                {errorMessage}
              </Typography>
            )}

            {/* Hiển thị lỗi từ hook */}
            {error && (
              <Typography color="red" className="text-red-500">
                {typeof error === "string" ? error : JSON.stringify(error)}
              </Typography>
            )}

            {/* Hiển thị thông báo thành công/khác */}
            {message && (
              <Typography color="green" className="text-green-500">
                {message}
              </Typography>
            )}

            <Button
              fullWidth
              type="submit"
              variant="contained"
              color="primary"
              disabled={loading}
              className="mt-4 bg-blue-600 hover:bg-blue-700"
            >
              {loading ? "Đang xử lý..." : "Xác nhận OTP"}
            </Button>
          </form>
        </Box>
        <div className="w-2/5 h-full hidden lg:block">
          <img
            src="/img/logo.svg"
            className="h-full w-full object-cover rounded-3xl"
            alt="logo"
          />
        </div>
      </div>
    </div>
  );
};

export default ConfirmOTPPage;
