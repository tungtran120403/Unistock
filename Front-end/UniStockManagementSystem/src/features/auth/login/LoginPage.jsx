import React, { useState, useEffect } from "react";
import { TextField, Button, Box } from '@mui/material';
import { Typography } from "@material-tailwind/react";
import { Link, useNavigate } from "react-router-dom";
import useLogin from "./useLogin";

export function LoginPage() {
  const { handleLogin } = useLogin();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [errorEmail, setErrorEmail] = useState("");
  const [errorPassword, setErrorPassword] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    document.body.style.backgroundImage = 'url(/img/bg.svg)';
    document.body.style.backgroundSize = 'cover';
    document.body.style.backgroundRepeat = 'none'
    document.body.style.backgroundPosition = 'center';

    return () => {
      document.body.style.backgroundImage = null;
      document.body.style.backgroundSize = null;
      document.body.style.backgroundPosition = null;
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email && !password) {
      setErrorEmail("Email không được để trống");
      setErrorPassword("Mật khẩu không được để trống");
      return;
    }

    if (!email) {
      setErrorEmail("Email không được để trống");
      return;
    }
    if (!password) {
      setErrorPassword("Mật khẩu không được để trống");
      return;
    }

    const result = await handleLogin(email, password);

    if (result.success) {
      const userRoles = result.user?.roles || [];
      console.log("✅ [LoginPage] User Roles:", userRoles);

      if (userRoles.length === 0) {
        console.warn("🚨 [LoginPage] User has no roles! Possible issue with API response.");
      }

      if (userRoles.includes("ADMIN")) {
        navigate("/admin/users");
      } else if (userRoles.includes("MANAGER")) {
        navigate("/dashboard");
      } else {
        navigate("/user/home");
      }
    } else {
      setError(result.message);
    }
  };


  return (
    <div
      className="w-full h-screen flex items-center justify-center bg-cover bg-center"
    >
      <div className="flex items-center justify-center gap-20 w-[1200px] py-20 bg-white shadow-blue-gray-900 shadow-[0_0_40px_rgba(0,0,0,0.2)]">
        <Box className="flex flex-col items-center justify-center p-8 rounded-xl max-w-md h-[500px] w-full bg-[#0ab067]/10">
          <div className='pb-8 flex flex-col items-center justify-center'>
            <Typography variant="h2" className="font-bold text-center ">
              Đăng nhập
            </Typography>
            <Typography className='text-sm text-blue-gray-500'>
              Hãy nhập email và mật khẩu của bạn để đăng nhập
            </Typography>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 w-full px-5">
            <div>
              <Typography>Email</Typography>
              <TextField
                fullWidth
                hiddenLable
                size="small"
                color="success"
                variant="outlined"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setErrorEmail("")
                }}
                error={Boolean(errorEmail)}
              />
              {errorEmail && (
                <Typography color="red" className="text-start text-xs mt-1">
                  {errorEmail}
                </Typography>
              )}
            </div>
            <div>
              <Typography>Mật khẩu</Typography>
              <TextField
                fullWidth
                hiddenLable
                size="small"
                color="success"
                variant="outlined"
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setErrorPassword("")
                }}
                error={Boolean(errorPassword)}
              />
              {errorPassword && (
                <Typography color="red" className="text-start text-xs mt-1">
                  {errorPassword}
                </Typography>
              )}
            </div>
            <div className="flex items-center justify-end">
              <Typography variant="small" className="font-medium text-gray-900">
                <Link to="/confirmEmail">
                  Quên mật khẩu
                </Link>
              </Typography>
            </div>
            {error && (
              <Typography variant="small" color="red" className="text-center">
                {error}
              </Typography>
            )}
            <Button
              fullWidth
              type="submit"
              variant="contained"
              color="primary"
              className="mt-4"
              sx={{
                boxShadow: 'none',
                '&:hover': { boxShadow: 'none' }
              }}
            >
              ĐĂNG NHẬP
            </Button>
          </form>
        </Box>
        <div className="w-2/5 h-full hidden lg:block">
          <img
            src="/img/logo.svg"
            className="h-full w-full object-cover rounded-3xl"
          />
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
