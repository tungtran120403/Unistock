import React from "react";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import Slide from "@mui/material/Slide";
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

function SlideTransition(props) {
  return <Slide {...props} direction="left" />;
}

const SuccessAlert = ({ open, onClose, message }) => {
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
        severity="success"
        icon={<CheckCircleIcon fontSize="inherit" />}
        sx={{
          width: "100%",
          alignItems: "center",
          borderLeft: "6px solid #4caf50",
          borderTop: "1px solid #4caf50",
          borderBottom: "1px solid #4caf50",
          borderRight: "1px solid #4caf50",
          borderRadius: "1px",
          backgroundColor: "#e6f4ea",
          "& .MuiAlert-icon": {
            color: "#43a047",
          },
        }}
      >
        {message || "Thao tác thành công!"}
      </Alert>
    </Snackbar>
  );
};

export default SuccessAlert;