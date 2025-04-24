package vn.unistock.unistockmanagementsystem.utils.storage;


import com.azure.storage.blob.*;
import com.azure.storage.blob.models.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.UUID;

@Service
public class AzureBlobService {
    @Value("${azure.storage.connection-string}")
    private String connectionString;

    @Value("${azure.storage.container-name}")
    private String containerName;

    public String uploadFile(MultipartFile file) throws IOException {
        // ✅ Tạo tên file ngẫu nhiên để tránh trùng lặp
        String fileName = UUID.randomUUID().toString() + "-" + file.getOriginalFilename();

        // ✅ Khởi tạo Blob Client để upload file
        BlobServiceClient blobServiceClient = new BlobServiceClientBuilder()
                .connectionString(connectionString)
                .buildClient();
        BlobContainerClient containerClient = blobServiceClient.getBlobContainerClient(containerName);
        BlobClient blobClient = containerClient.getBlobClient(fileName);

        // ✅ Upload file lên Azure
        blobClient.upload(file.getInputStream(), file.getSize(), true);

        // ✅ Trả về URL file đã upload
        return blobClient.getBlobUrl();
    }


    public void deleteFile(String imageUrl) {
        try {
            // Lấy tên file từ URL
            String fileName = imageUrl.substring(imageUrl.lastIndexOf("/") + 1);

            BlobServiceClient blobServiceClient = new BlobServiceClientBuilder()
                    .connectionString(connectionString)
                    .buildClient();
            BlobContainerClient containerClient = blobServiceClient.getBlobContainerClient(containerName);
            BlobClient blobClient = containerClient.getBlobClient(fileName);

            // Xóa file cũ
            blobClient.delete();
        } catch (Exception e) {
            // Log error nhưng không throw exception
            System.out.println("Error deleting old image: " + e.getMessage());
        }
    }
}