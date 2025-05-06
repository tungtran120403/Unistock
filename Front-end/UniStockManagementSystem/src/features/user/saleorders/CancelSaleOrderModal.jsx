import React, { useState } from "react";
import {
    Dialog,
    DialogHeader,
    DialogBody,
    DialogFooter,
    Typography,
    Textarea,
    Button,
} from "@material-tailwind/react";
import {
    TextField,
    Button as MuiButton,
    IconButton,
    Divider,
    Box
} from '@mui/material';
import { XMarkIcon } from "@heroicons/react/24/outline";
import WarningIcon from '@mui/icons-material/Warning';

const CancelSaleOrderModal = ({ open, onClose, onConfirm, orderStatus }) => {
    const [reason, setReason] = useState("");
    const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
    const [error, setError] = useState();

    const handleConfirm = () => {
        if (!reason.trim()) {
            setError("Vui lòng nhập lý do huỷ đơn hàng");
            return;
        }

        // const confirmed = window.confirm("Bạn có chắc chắn muốn huỷ đơn hàng này? Việc hủy đơn hàng cũng sẽ hủy yêu cầu mua vật tư cho đơn hàng này");
        // if (!confirmed) return;

        onConfirm(reason);
        onClose();
        setReason("");
        setError("");
    };

    const handleClose = () => {
        onClose();
        setReason("");
        setError("");
        setConfirmDialogOpen(false);
    };

    return (
        <div>
            <Dialog open={open} handler={handleClose} size="sm" className="px-4 py-2">
                <DialogHeader className="flex justify-between items-center pb-2">
                    <Typography variant="h4" color="blue-gray">
                        Huỷ đơn hàng
                    </Typography>
                    <IconButton size="small" onClick={handleClose}>
                        <XMarkIcon className="h-5 w-5 stroke-2" />
                    </IconButton>
                </DialogHeader>
                <Divider variant="middle" />
                <DialogBody className="space-y-4 pb-6 pt-6">
                    {orderStatus !== 'PROCESSING' && (
                        <Box
                            sx={{
                                display: 'flex',
                                gap: 2,
                                p: 2,
                                bgcolor: '#fff5e5', // hoặc tự set: '#ffebee'
                                alignItems: 'flex-start',
                            }}
                        >
                            <WarningIcon sx={{ color: 'warning.main', fontSize: 28, mt: 1 }} />
                            <Box>
                                <Typography variant="h6" className="text-black">
                                    Cảnh báo
                                </Typography>
                                <Typography variant="medium" className="text-black mb-1">
                                    Việc huỷ đơn hàng cũng sẽ huỷ yêu cầu mua vật tư cho đơn hàng này.
                                </Typography>
                            </Box>
                        </Box>
                    )}
                    <div>
                        <Typography variant="medium" className="text-black mb-1">
                            Lý do huỷ <span className="text-red-500">*</span>
                        </Typography>
                        <TextField
                            fullWidth
                            size="small"
                            hiddenLabel
                            placeholder="Nhập lý do huỷ đơn hàng"
                            variant="outlined"
                            multiline
                            rows={4}
                            color="success"
                            value={reason}
                            error={!!error}
                            onChange={(e) => {
                                setReason(e.target.value);
                                setError("");
                            }}
                        />
                        {error && (
                            <Typography color="red" className="text-xs mt-1">
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
                        color="white"
                        variant="text"
                        size="lg"
                        className="bg-[#0ab067] hover:bg-[#089456]/90 shadow-none text-white font-medium py-2 px-4 ml-3 rounded-[4px] transition-all duration-200 ease-in-out"
                        ripple={true}
                        onClick={handleConfirm}
                    >
                        Xác nhận
                    </Button>
                </DialogFooter>
            </Dialog>
        </div>
    );
};

export default CancelSaleOrderModal;
