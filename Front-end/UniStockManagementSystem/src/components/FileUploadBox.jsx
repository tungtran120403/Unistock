import { useRef, useState } from "react";
import { Button, Typography } from "@mui/material";
import { IconButton } from "@mui/material";
import { XMarkIcon } from "@heroicons/react/24/solid";
import FilePreviewDialog from "@/components/FilePreviewDialog";
import WarningAlert from "@/components/WarningAlert";  // ✅ đổi path nếu cần

const FileUploadBox = ({ files, setFiles, maxFiles = 3 }) => {
    const inputRef = useRef();
    const [previewFile, setPreviewFile] = useState(null);
    const [warningOpen, setWarningOpen] = useState(false);
    const [warningMessage, setWarningMessage] = useState("");

    const handleFileChange = (e) => {
        const selected = Array.from(e.target.files);
        if (selected.length + files.length > maxFiles) {
            setWarningMessage(`Chỉ được tải lên tối đa ${maxFiles} file!`);
            setWarningOpen(true);
            return;
        }
        setFiles([...files, ...selected]);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        const dropped = Array.from(e.dataTransfer.files);
        if (dropped.length + files.length > maxFiles) {
            setWarningMessage(`Chỉ được tải lên tối đa ${maxFiles} file!`);
            setWarningOpen(true);
            return;
        }
        setFiles([...files, ...dropped]);
    };

    const handleRemove = (index) => {
        setFiles(files.filter((_, i) => i !== index));
    };

    const handlePreview = (file) => {
        setPreviewFile(file);
    };

    const handleClosePreview = () => {
        setPreviewFile(null);
    };

    return (
        <div>
            <div
                className="w-full h-28 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 text-gray text-sm text-center cursor-pointer hover:border-gray-400 transition"
                onClick={() => inputRef.current.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
            >
                <p className="mb-1">Kéo thả file vào đây</p>
                <p className="mb-2 text-gray-500">Hoặc</p>
                <Button
                    color="info"
                    size="medium"
                    variant="outlined"
                    sx={{
                        color: "#616161",
                        borderColor: "#9e9e9e",
                        "&:hover": {
                            backgroundColor: "#f5f5f5",
                            borderColor: "#757575",
                        },
                    }}
                >
                    Tải lên từ máy tính
                </Button>
                <input
                    ref={inputRef}
                    type="file"
                    multiple
                    accept=".pdf,.jpg,.png,.docx,.xlsx"
                    onChange={handleFileChange}
                    className="hidden"
                />
            </div>

            {/* Hiển thị danh sách file */}
            {files.length > 0 && (
                <div className="mt-2 text-sm text-gray-800">
                    <Typography variant="body" sx={{ fontWeight: 600 }}>
                        File đã chọn ({files.length}/{maxFiles}):
                    </Typography>
                    <div className="grid grid-cols-3 gap-4 mt-1 text-sm text-gray-700 w-fit">
                        {files.map((file, index) => (
                            <Button
                                key={index}
                                variant="outlined"
                                color="primary"
                                disableElevation
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'between',
                                    padding: 0, // bỏ padding mặc định
                                }}
                                className="text-xs w-full gap-2" // tuỳ chỉnh tailwind cho text và layout
                            >
                                <span
                                    className="truncate max-w-[75%] py-1"
                                    onClick={() => handlePreview(file)}
                                >
                                    {file.name}
                                </span>
                                <IconButton
                                    size="small"
                                    variant="text"
                                    onClick={() => handleRemove(index)}
                                    sx={{
                                        margin: '1px', // bỏ padding mặc định
                                    }}
                                >
                                    <XMarkIcon className="h-5 w-5 stroke-2" />
                                </IconButton>
                            </Button>
                        ))}
                    </div>
                </div>
            )}
            <FilePreviewDialog
                file={previewFile}
                open={!!previewFile}
                onClose={handleClosePreview}
                showDownload={false}
            />

            <WarningAlert
                open={warningOpen}
                onClose={() => setWarningOpen(false)}
                message={warningMessage}
            />
        </div>
    );
};

export default FileUploadBox;
