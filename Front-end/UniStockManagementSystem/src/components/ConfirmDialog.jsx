import {
    Dialog,
    DialogHeader,
    DialogBody,
    DialogFooter,
    Typography,
    Input,
    Button,
} from "@material-tailwind/react";
import {
    TextField,
    Divider,
    Button as MuiButton,
    IconButton,
} from "@mui/material";
import { XMarkIcon } from "@heroicons/react/24/outline";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";


const ConfirmDialog = ({
    open,
    onClose,
    onConfirm,
    message = "Are you sure?",
    subMessage = "",
    confirmText = "Yes, delete it!",
    cancelText = "Cancel",
}) => {
    return (
        <Dialog open={open} handler={onClose} size="xs" className="px-4 py-2">
            <DialogBody className="space-y-4 flex flex-col items-center justify-center">
                <WarningAmberRoundedIcon sx={{ fontSize: 100, color: "#f5a623" }} />
                <Typography variant="paragraph" className="text-black w-fit font-bold">
                    {message}
                </Typography>
                {subMessage && (
                    <Typography variant="small" className="text-gray-700 text-sm text-center max-w-xs">
                        {subMessage}
                    </Typography>
                )}
            </DialogBody>

            {/* Footer của Dialog */}
            <DialogFooter className="pt-0">
                <MuiButton
                    size="medium"
                    color="error"
                    variant="outlined"
                    onClick={onClose}
                >
                    {cancelText}
                </MuiButton>
                <Button
                    size="lg"
                    color="white"
                    variant="text"
                    className="bg-[#0ab067] hover:bg-[#089456]/90 shadow-none text-white font-medium py-2 px-4 ml-3 rounded-[4px] transition-all duration-200 ease-in-out"
                    ripple={true}
                    onClick={onConfirm}
                >
                    {confirmText}
                </Button>
            </DialogFooter>
        </Dialog>
    );
};

export default ConfirmDialog;