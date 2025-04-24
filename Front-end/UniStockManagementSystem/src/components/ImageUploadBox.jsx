import { useRef } from "react";
import { Button } from '@mui/material';

const ImageUploadBox = ({ onFileSelect }) => {
    const inputRef = useRef();

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file && file.size <= 5 * 1024 * 1024) {
            onFileSelect(file);
        } else {
            alert("Vui lòng chọn file nhỏ hơn 5MB");
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (file && file.size <= 5 * 1024 * 1024) {
            onFileSelect(file);
        } else {
            alert("Vui lòng chọn file nhỏ hơn 5MB");
        }
    };

    return (
        <div
            className="w-full h-28 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 text-gray text-sm text-center cursor-pointer hover:border-gray-400 transition"
            onClick={() => inputRef.current.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
        >
            <p className="mb-1">Kéo thả file của bạn vào đây</p>
            <p className="mb-2 text-gray-500">Hoặc</p>
            <Button
                color="info"
                size="medium"
                variant="outlined"
                sx={{
                    color: '#616161',           // text color
                    borderColor: '#9e9e9e',     // border
                    '&:hover': {
                        backgroundColor: '#f5f5f5',
                        borderColor: '#757575',
                    },
                }} >
                Tải lên từ máy tính
            </Button>
            <input
                ref={inputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
            />
        </div>
    );
};

export default ImageUploadBox;
