package vn.unistock.unistockmanagementsystem.features.user.products;

import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.ss.util.CellRangeAddressList;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import vn.unistock.unistockmanagementsystem.entities.Product;
import vn.unistock.unistockmanagementsystem.entities.ProductType;
import vn.unistock.unistockmanagementsystem.entities.Unit;
import vn.unistock.unistockmanagementsystem.features.user.productTypes.ProductTypeRepository;
import vn.unistock.unistockmanagementsystem.features.user.units.UnitRepository;

import java.io.*;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class ExcelService {

    @Autowired
    private ProductsRepository productsRepository;

    @Autowired
    private UnitRepository unitRepository;

    @Autowired
    private ProductTypeRepository productTypeRepository;

    public ByteArrayInputStream exportProductsToExcel() throws IOException {
        List<Product> products = productsRepository.findAll();

        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Products");
            Row header = sheet.createRow(0);
            header.createCell(0).setCellValue("Mã sản phẩm");
            header.createCell(1).setCellValue("Tên sản phẩm");
            header.createCell(2).setCellValue("Đơn vị");
            header.createCell(3).setCellValue("Dòng sản phẩm");
            header.createCell(4).setCellValue("Mô tả");

            int rowIdx = 1;
            for (Product product : products) {
                Row row = sheet.createRow(rowIdx++);
                row.createCell(0).setCellValue(product.getProductCode());
                row.createCell(1).setCellValue(product.getProductName());
                row.createCell(2).setCellValue(product.getUnit().getUnitName());
                row.createCell(3).setCellValue(product.getProductType().getTypeName());
                row.createCell(4).setCellValue(product.getDescription() != null ? product.getDescription() : "");
            }

            workbook.write(out);
            return new ByteArrayInputStream(out.toByteArray());
        }
    }

    public ByteArrayInputStream generateProductImportTemplate() throws IOException {
        List<Unit> units = unitRepository.findAll();
        List<ProductType> types = productTypeRepository.findAll();

        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Products");
            Sheet refSheet = workbook.createSheet("refs");
            workbook.setSheetHidden(workbook.getSheetIndex("refs"), true);

            Row header = sheet.createRow(0);
            header.createCell(0).setCellValue("Mã sản phẩm");
            header.createCell(1).setCellValue("Tên sản phẩm");
            header.createCell(2).setCellValue("Đơn vị");
            header.createCell(3).setCellValue("Dòng sản phẩm");
            header.createCell(4).setCellValue("Mô tả");

            for (int i = 0; i < units.size(); i++) {
                refSheet.createRow(i).createCell(0).setCellValue(units.get(i).getUnitName());
            }

            for (int i = 0; i < types.size(); i++) {
                Row row = refSheet.getRow(i);
                if (row == null) row = refSheet.createRow(i);
                row.createCell(1).setCellValue(types.get(i).getTypeName());
            }

            DataValidationHelper helper = sheet.getDataValidationHelper();
            CellRangeAddressList unitRange = new CellRangeAddressList(1, 100, 2, 2);
            DataValidationConstraint unitConstraint = helper.createFormulaListConstraint("refs!$A$1:$A$" + units.size());
            DataValidation unitValidation = helper.createValidation(unitConstraint, unitRange);
            sheet.addValidationData(unitValidation);

            CellRangeAddressList typeRange = new CellRangeAddressList(1, 100, 3, 3);
            DataValidationConstraint typeConstraint = helper.createFormulaListConstraint("refs!$B$1:$B$" + types.size());
            DataValidation typeValidation = helper.createValidation(typeConstraint, typeRange);
            sheet.addValidationData(typeValidation);

            workbook.write(out);
            return new ByteArrayInputStream(out.toByteArray());
        }
    }

    public List<ProductPreviewDTO> previewImportProducts(MultipartFile file) throws IOException {
        List<ProductPreviewDTO> result = new ArrayList<>();
        Map<String, Integer> codeToRowMap = new HashMap<>(); // để kiểm tra trùng mã trong file
        Workbook workbook = new XSSFWorkbook(file.getInputStream());
        Sheet sheet = workbook.getSheetAt(0);

        for (int i = 1; i <= sheet.getLastRowNum(); i++) {
            Row row = sheet.getRow(i);
            if (row == null) continue;

            ProductPreviewDTO dto = new ProductPreviewDTO();
            dto.setRowIndex(i + 1); // Excel bắt đầu từ 1
            dto.setValid(true);

            String code = getCellValue(row.getCell(0));
            String name = getCellValue(row.getCell(1));
            String unitName = getCellValue(row.getCell(2));
            String typeName = getCellValue(row.getCell(3));
            String description = getCellValue(row.getCell(4));

            dto.setProductCode(code);
            dto.setProductName(name);
            dto.setUnitName(unitName);
            dto.setProductTypeName(typeName);
            dto.setDescription(description);

            List<String> errors = new ArrayList<>();

            if (code == null || code.trim().isEmpty()) {
                errors.add("Mã sản phẩm không được để trống");
                dto.setValid(false);
            } else {
                String trimmedCode = code.trim();

                // Kiểm tra trùng trong file Excel
                if (codeToRowMap.containsKey(trimmedCode)) {
                    errors.add("Mã sản phẩm trùng với dòng số " + codeToRowMap.get(trimmedCode));
                    dto.setValid(false);
                } else {
                    codeToRowMap.put(trimmedCode, dto.getRowIndex());
                }

                // Kiểm tra đã tồn tại trong hệ thống
                if (productsRepository.existsByProductCode(trimmedCode)) {
                    errors.add("Mã sản phẩm đã tồn tại trong hệ thống");
                    dto.setValid(false);
                }
            }

            if (name == null || name.trim().isEmpty()) {
                errors.add("Tên sản phẩm không được để trống");
                dto.setValid(false);
            }

            if (unitName == null || unitName.trim().isEmpty()) {
                errors.add("Đơn vị không được để trống");
                dto.setValid(false);
            } else if (!unitRepository.existsByUnitNameIgnoreCase(unitName.trim())) {
                errors.add("Đơn vị không tồn tại trong hệ thống");
                dto.setValid(false);
            }

            if (typeName == null || typeName.trim().isEmpty()) {
                errors.add("Dòng sản phẩm không được để trống");
                dto.setValid(false);
            } else if (!productTypeRepository.existsByTypeNameIgnoreCase(typeName.trim())) {
                errors.add("Dòng sản phẩm không tồn tại trong hệ thống");
                dto.setValid(false);
            }

            if (!errors.isEmpty()) {
                dto.setErrorMessage(String.join("; ", errors));
            }

            result.add(dto);
        }

        workbook.close();
        return result;
    }


    public String importProducts(MultipartFile file) throws IOException {
        Workbook workbook = new XSSFWorkbook(file.getInputStream());
        Sheet sheet = workbook.getSheetAt(0);
        List<Product> products = new ArrayList<>();

        for (int i = 1; i <= sheet.getLastRowNum(); i++) {
            Row row = sheet.getRow(i);
            if (row == null) continue;

            String code = getCellValue(row.getCell(0));
            String name = getCellValue(row.getCell(1));
            String unitName = getCellValue(row.getCell(2));
            String typeName = getCellValue(row.getCell(3));
            String description = getCellValue(row.getCell(4));

            if (code == null || code.trim().isEmpty() || name == null || name.trim().isEmpty()) continue;

            Optional<Unit> unit = unitRepository.findByUnitName(unitName.trim());
            Optional<ProductType> type = productTypeRepository.findByTypeName(typeName.trim());

            if (unit.isEmpty() || type.isEmpty()) continue;

            Product product = new Product();
            product.setProductCode(code.trim());
            product.setProductName(name.trim());
            product.setDescription(description);
            product.setUnit(unit.get());
            product.setProductType(type.get());

            products.add(product);
        }

        workbook.close();
        productsRepository.saveAll(products);
        return "Import thành công " + products.size() + " sản phẩm.";
    }

    private String getCellValue(Cell cell) {
        if (cell == null) return null;
        cell.setCellType(CellType.STRING);
        return cell.getStringCellValue().trim();
    }


}