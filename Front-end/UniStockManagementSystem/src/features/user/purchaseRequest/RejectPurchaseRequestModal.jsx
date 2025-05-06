import React, { useState } from "react";
import {
    Dialog,
    DialogHeader,
    DialogBody,
    DialogFooter,
    Typography,
    Button,
} from "@material-tailwind/react";
import { Divider, Button as MuiButton, TextField, IconButton } from "@mui/material";
import { XMarkIcon } from "@heroicons/react/24/outline";

const RejectPurchaseRequestModal = ({ show, handleClose, onConfirm }) => {
    const [reason, setReason] = useState("");
    const [error, setError] = useState("");

    const handleSubmit = () => {
        if (!reason.trim()) {
            setError("Vui lòng nhập lý do từ chối");
            return;
        }

        // const confirmed = window.confirm("Bạn có chắc chắn muốn từ chối yêu cầu mua vật tư này?");
        // if (!confirmed) return;

        onConfirm(reason);
        handleClose();
        setReason("");
        setError("");
    };

    if (!show) return null;

    return (
        <Dialog open={true} handler={(e) => {setError(""); handleClose();}} size="md" className="px-4 py-2">
            <DialogHeader className="flex justify-between items-center pb-2">
                <Typography variant="h4" color="blue-gray">
                    Từ chối yêu cầu mua vật tư
                </Typography>
                <IconButton size="small" variant="text"
                    onClick={(e) => {
                        setError("");
                        handleClose();
                    }}
                >
                    <XMarkIcon className="h-5 w-5 stroke-2" />
                </IconButton>
            </DialogHeader>
            <Divider variant="middle" />
            <DialogBody className="space-y-4 pb-6 pt-6">
                <div>
                    <Typography variant="medium" className="mb-1 text-black">
                        Lý do từ chối <span className="text-red-500">*</span>
                    </Typography>
                    <TextField
                        fullWidth
                        size="small"
                        placeholder="Nhập lý do từ chối"
                        hiddenLabel
                        multiline
                        rows={4}
                        color="success"
                        value={reason}
                        onChange={(e) => {
                            setReason(e.target.value);
                            setError(""); // Reset error when user types
                        }}
                    />
                    {error && (
                        <Typography className="text-xs text-red-500 mt-1">
                            {error}
                        </Typography>
                    )}
                </div>
            </DialogBody>

            <DialogFooter className="pt-0">
                <MuiButton
                    size="medium"
                    color="error"
                    variant="outlined"
                    onClick={handleClose}
                >
                    Hủy
                </MuiButton>
                <Button
                    size="lg"
                    className="bg-[#0ab067] hover:bg-[#089456]/90 hover:shadow-none shadow-none text-white font-medium py-2 px-4 ml-3 rounded-[4px] transition-all duration-200 ease-in-out"
                    ripple={true}
                    onClick={handleSubmit}
                >
                    Xác nhận
                </Button>
            </DialogFooter>
        </Dialog>
    );
};

export default RejectPurchaseRequestModal;
