import React from "react";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import Slide from "@mui/material/Slide";


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
        variant="filled"
        sx={{ width: "100%", backgroundColor: '#4caf50', }}
      >
        {message || "Thao tác thành công!"}
      </Alert>
    </Snackbar>
  );
};

export default SuccessAlert;