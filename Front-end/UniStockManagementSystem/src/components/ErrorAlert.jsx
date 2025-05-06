import React from "react";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import { Typography } from "@material-tailwind/react";
import Slide from "@mui/material/Slide";
import ErrorIcon from '@mui/icons-material/Error';

function SlideTransition(props) {
    return <Slide {...props} direction="left" />;
}

const SuccessAlert = ({ open, onClose, title, message }) => {
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
                severity="error"
                icon={<ErrorIcon fontSize="inherit" />}
                sx={{
                    width: "100%",
                    alignItems: "center",
                    borderLeft: "6px solid #d3302f",
                    borderTop: "1px solid #d3302f",
                    borderBottom: "1px solid #d3302f",
                    borderRight: "1px solid #d3302f",
                    borderRadius: "1px",
                    backgroundColor: "#fdeded",
                    "& .MuiAlert-icon": {
                        color: "#d3302f",
                    },
                }}
            >
                <Typography variant="small" className="font-semibold text-red-600">
                    {title || "Thao tác không thành công!"}
                </Typography>
                <Typography color='error.main' className="text-xs">
                    {message || "Thao tác thành công!"}
                </Typography>
            </Alert>
        </Snackbar>
    );
};

export default SuccessAlert;