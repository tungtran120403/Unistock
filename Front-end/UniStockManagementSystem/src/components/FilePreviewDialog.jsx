import { Dialog, DialogTitle, DialogContent, IconButton, Button, Typography } from "@mui/material";
import { XMarkIcon } from "@heroicons/react/24/solid";

const FilePreviewDialog = ({ file, open, onClose, showDownload }) => {
    const getPreviewURL = (file) => {
        if (!file) return "";
        if (file instanceof File) return URL.createObjectURL(file);
        if (typeof file === "string") return file;
        return "";
    };


    const getPreviewType = (file) => {
        if (!file) return "other";

        let filename = "";

        // Nếu là File object thì dùng file.name
        if (file instanceof File) {
            filename = file.name;
        }
        // Nếu là string URL thì lấy phần cuối đường dẫn
        else if (typeof file === "string") {
            const parts = file.split('/');
            filename = parts[parts.length - 1].split('?')[0]; // tránh bị query string làm sai định dạng
        } else {
            return "other";
        }

        const extension = filename.split('.').pop().toLowerCase();

        if (['jpg', 'jpeg', 'png', 'gif'].includes(extension)) return "image";
        if (extension === 'pdf') return "pdf";
        if (['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].includes(extension)) return "office";

        return "other";
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <div className="flex justify-between items-center">
                <DialogTitle sx={{ width: "90%" }}>
                    <Typography
                        noWrap
                        variant="h6"
                        sx={{
                            maxWidth: "100%",       // tùy chỉnh để không tràn ra ngoài
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap"
                        }}>
                        {file?.name || (typeof file === "string" ? file.split("/").pop().split("?")[0] : "")}
                    </Typography>
                </DialogTitle>

                <IconButton size="small" onClick={onClose} sx={{ marginRight: "16px" }}>
                    <XMarkIcon className="h-6 w-6 stroke-2" />
                </IconButton>
            </div>
            <DialogContent dividers>
                {file && (() => {
                    const type = getPreviewType(file);
                    const url = getPreviewURL(file);

                    const renderActions = showDownload && (
                        <div className="mt-4 flex justify-center gap-4">
                            <Button
                                color="info"
                                size="medium"
                                variant="outlined"
                                sx={{
                                    height: '36px',
                                    color: "blue-gray",
                                }}
                                onClick={() => window.open(url, '_blank')}
                                className="flex items-center gap-2"
                            >
                                Tải về
                            </Button>
                        </div>
                    );

                    switch (type) {
                        case "image":
                            return (
                                <>
                                    <img
                                        src={url}
                                        alt="Image Preview"
                                        style={{
                                            display: "block",
                                            maxWidth: "100%",
                                            maxHeight: "80vh",
                                            width: "auto",
                                            height: "auto",
                                            margin: "0 auto"
                                        }}
                                    />
                                    {renderActions}
                                </>
                            );
                        case "pdf":
                            return (
                                <>
                                    <iframe
                                        src={url}
                                        title="PDF Preview"
                                        style={{ width: "100%", height: "80vh", border: "none" }}
                                    />
                                    {renderActions}
                                </>
                            );
                        default:
                            return (
                                <div className="text-center">
                                    <Typography>Không thể xem trước file.</Typography>
                                    {renderActions}
                                </div>
                            );
                    }
                })()}
            </DialogContent>
        </Dialog>
    );
};

export default FilePreviewDialog;
