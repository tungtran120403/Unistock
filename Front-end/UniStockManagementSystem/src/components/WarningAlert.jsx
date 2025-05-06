import React from "react";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import Slide from "@mui/material/Slide";
import WarningIcon from '@mui/icons-material/Warning';

function SlideTransition(props) {
  return <Slide {...props} direction="left" />;
}

const WarningAlert = ({ open, onClose, message }) => {
  return (
    <Snackbar
      open={open}
      autoHideDuration={4000}
      onClose={onClose}
      anchorOrigin={{ vertical: "top", horizontal: "right" }}
      TransitionComponent={SlideTransition}
    >
      <Alert
        onClose={onClose}
        severity="warning"
        icon={<WarningIcon fontSize="inherit" />}
        sx={{
          width: "100%",
          alignItems: "center",
          borderLeft: "6px solid #ff9800",      // ✅ màu vàng cam đậm
          borderTop: "1px solid #ff9800",
          borderBottom: "1px solid #ff9800",
          borderRight: "1px solid #ff9800",
          borderRadius: "1px",
          "& .MuiAlert-icon": {
            color: "#fb8c00",                   // ✅ icon vàng đậm hơn
          },
        }}
      >
        {message || "Có cảnh báo cần chú ý!"}
      </Alert>
    </Snackbar>
  );
};

export default WarningAlert;
