package vn.unistock.unistockmanagementsystem.features.user.materials;

import org.apache.poi.ss.usermodel.*;
import org.apache.poi.ss.util.CellRangeAddressList;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import vn.unistock.unistockmanagementsystem.entities.*;
import vn.unistock.unistockmanagementsystem.features.user.materialType.MaterialTypeRepository;
import vn.unistock.unistockmanagementsystem.features.user.partner.PartnerRepository;
import vn.unistock.unistockmanagementsystem.features.user.units.UnitRepository;

import java.io.*;
import java.text.Normalizer;
import java.util.*;

@Service
public class MaterialExcelService {
    @Autowired
    private UnitRepository unitRepository;

    @Autowired
    private MaterialsRepository materialsRepository;

    @Autowired
    private MaterialTypeRepository materialTypeRepository;

    @Autowired
    private PartnerRepository partnerRepository;

    private String normalize(String input) {
        if (input == null) return null;
        return Normalizer.normalize(input.trim(), Normalizer.Form.NFC);
    }

    public List<MaterialPreviewDTO> previewImportMaterials(MultipartFile file) throws IOException {
        List<MaterialPreviewDTO> result = new ArrayList<>();
        Workbook workbook = new XSSFWorkbook(file.getInputStream());
        Sheet sheet = workbook.getSheetAt(0);

        Map<String, Integer> codeToRowMap = new HashMap<>();
        List<Partner> allSuppliers = partnerRepository.findAllSuppliers();

        System.out.println("🔍 Danh sách nhà cung cấp (DB):");
        for (Partner p : allSuppliers) {
            System.out.println(" - " + p.getPartnerName());
        }

        for (int i = 1; i <= sheet.getLastRowNum(); i++) {
            Row row = sheet.getRow(i);
            if (row == null) continue;

            MaterialPreviewDTO dto = new MaterialPreviewDTO();
            dto.setRowIndex(i + 1);
            dto.setValid(true);

            String code = getCellValue(row.getCell(0));
            String name = getCellValue(row.getCell(1));
            String unitName = getCellValue(row.getCell(2));
            String typeName = getCellValue(row.getCell(3));
            String partnerName = getCellValue(row.getCell(4));
            String description = getCellValue(row.getCell(5));

            dto.setMaterialCode(code);
            dto.setMaterialName(name);
            dto.setUnitName(unitName);
            dto.setMaterialTypeName(typeName);
            dto.setPartnerName(partnerName);
            dto.setDescription(description);

            List<String> errors = new ArrayList<>();

            if (code == null || code.isEmpty()) {
                errors.add("Mã vật tư không được để trống");
                dto.setValid(false);
            } else {
                String trimmedCode = code.trim();
                if (codeToRowMap.containsKey(trimmedCode)) {
                    errors.add("Mã vật tư trùng với dòng số " + codeToRowMap.get(trimmedCode));
                    dto.setValid(false);
                } else {
                    codeToRowMap.put(trimmedCode, dto.getRowIndex());
                }
                if (materialsRepository.existsByMaterialCode(trimmedCode)) {
                    errors.add("Mã vật tư đã tồn tại trong hệ thống");
                    dto.setValid(false);
                }
            }

            if (name == null || name.isEmpty()) {
                errors.add("Tên vật tư không được để trống");
                dto.setValid(false);
            }

            Optional<Unit> unit = Optional.empty();
            if (unitName == null || unitName.isEmpty()) {
                errors.add("Đơn vị không được để trống");
                dto.setValid(false);
            } else {
                unit = unitRepository.findByUnitNameIgnoreCase(unitName.trim());
                if (unit.isEmpty()) {
                    errors.add("Đơn vị không tồn tại trong hệ thống");
                    dto.setValid(false);
                }
            }

            Optional<MaterialType> type = Optional.empty();
            if (typeName == null || typeName.isEmpty()) {
                errors.add("Danh mục không được để trống");
                dto.setValid(false);
            } else {
                type = materialTypeRepository.findByNameIgnoreCase(typeName.trim());
                if (type.isEmpty()) {
                    errors.add("Danh mục không tồn tại trong hệ thống");
                    dto.setValid(false);
                }
            }

            Optional<Partner> partner = Optional.empty();
            if (partnerName == null || partnerName.isEmpty()) {
                errors.add("Tên nhà cung cấp không được để trống");
                dto.setValid(false);
            } else {
                String normalizedPartnerName = normalize(partnerName);
                System.out.println("📦 Tìm nhà cung cấp cho dòng " + dto.getRowIndex() + ": " + normalizedPartnerName);
                partner = allSuppliers.stream()
                        .filter(p -> normalize(p.getPartnerName()).equalsIgnoreCase(normalizedPartnerName))
                        .findFirst();
                if (partner.isEmpty()) {
                    errors.add("Nhà cung cấp không tồn tại hoặc không đúng loại");
                    dto.setValid(false);
                }
            }

            if (!errors.isEmpty()) {
                dto.setErrorMessage(String.join("; ", errors));
            }

            result.add(dto);
        }

        workbook.close();
        return result;
    }

    public String importMaterials(MultipartFile file) throws IOException {
        Workbook workbook = new XSSFWorkbook(file.getInputStream());
        Sheet sheet = workbook.getSheetAt(0);
        List<Material> materials = new ArrayList<>();

        Set<String> processedCodes = new HashSet<>();

        for (int i = 1; i <= sheet.getLastRowNum(); i++) {
            Row row = sheet.getRow(i);
            if (row == null) continue;

            String code = getCellValue(row.getCell(0));
            String name = getCellValue(row.getCell(1));
            String unitName = getCellValue(row.getCell(2));
            String typeName = getCellValue(row.getCell(3));
            String partnerName = getCellValue(row.getCell(4));
            String description = getCellValue(row.getCell(5));


            if (code == null || code.trim().isEmpty() || name == null || name.trim().isEmpty()) {
                continue;
            }
            if (processedCodes.contains(code.trim())) {
                continue;
            }
            if (materialsRepository.existsByMaterialCode(code.trim())) {
                continue;
            }

            Optional<Unit> unit = unitRepository.findByUnitNameIgnoreCase(unitName.trim());
            if (unit.isEmpty()) {
                continue;
            }

            Optional<MaterialType> type = materialTypeRepository.findByNameIgnoreCase(typeName.trim());
            if (type.isEmpty()) {
                continue;
            }

            Optional<Partner> partner = partnerRepository.findAllSuppliers()
                    .stream()
                    .filter(p -> normalize(p.getPartnerName()).equalsIgnoreCase(normalize(partnerName.trim())))
                    .findFirst();
            if (partner.isEmpty()) {
                continue;
            }

            Material material = new Material();
            material.setMaterialCode(code.trim());
            material.setMaterialName(name.trim());
            material.setDescription(description);
            material.setUnit(unit.get());
            material.setMaterialType(type.get());

            MaterialPartner materialPartner = new MaterialPartner();
            materialPartner.setMaterial(material);
            materialPartner.setPartner(partner.get());

            material.getMaterialPartners().add(materialPartner);
            materials.add(material);
            processedCodes.add(code.trim());
        }

        workbook.close();
        materialsRepository.saveAll(materials);
        return "Import thành công " + materials.size() + " vật tư.";
    }

    public ByteArrayInputStream generateMaterialImportTemplate() throws IOException {
        List<Unit> units = unitRepository.findAll();
        List<MaterialType> materialTypes = materialTypeRepository.findAll();
        List<Partner> partners = partnerRepository.findAllSuppliers();

        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Materials");
            Sheet refSheet = workbook.createSheet("refs");
            workbook.setSheetHidden(workbook.getSheetIndex("refs"), true);

            // Header
            Row header = sheet.createRow(0);
            header.createCell(0).setCellValue("Mã vật tư");
            header.createCell(1).setCellValue("Tên vật tư");
            header.createCell(2).setCellValue("Đơn vị");
            header.createCell(3).setCellValue("Danh mục");
            header.createCell(4).setCellValue("Tên nhà cung cấp");
            header.createCell(5).setCellValue("Mô tả");

            // Ghi đơn vị vào cột A của refSheet
            for (int i = 0; i < units.size(); i++) {
                refSheet.createRow(i).createCell(0).setCellValue(units.get(i).getUnitName());
            }

            // Ghi danh mục vào cột B của refSheet
            for (int i = 0; i < materialTypes.size(); i++) {
                Row row = refSheet.getRow(i);
                if (row == null) row = refSheet.createRow(i);
                row.createCell(1).setCellValue(materialTypes.get(i).getName());
            }

            // Ghi tên nhà cung cấp vào cột C của refSheet
            for (int i = 0; i < partners.size(); i++) {
                Row row = refSheet.getRow(i);
                if (row == null) row = refSheet.createRow(i);
                row.createCell(2).setCellValue(partners.get(i).getPartnerName());
            }

            DataValidationHelper helper = sheet.getDataValidationHelper();

            // Dropdown đơn vị (cột C = index 2)
            CellRangeAddressList unitRange = new CellRangeAddressList(1, 100, 2, 2);
            DataValidationConstraint unitConstraint = helper.createFormulaListConstraint("refs!$A$1:$A$" + units.size());
            DataValidation unitValidation = helper.createValidation(unitConstraint, unitRange);
            sheet.addValidationData(unitValidation);

            // Dropdown danh mục (cột D = index 3)
            CellRangeAddressList typeRange = new CellRangeAddressList(1, 100, 3, 3);
            DataValidationConstraint typeConstraint = helper.createFormulaListConstraint("refs!$B$1:$B$" + materialTypes.size());
            DataValidation typeValidation = helper.createValidation(typeConstraint, typeRange);
            sheet.addValidationData(typeValidation);

            // ✅ Dropdown nhà cung cấp (cột E = index 4)
            CellRangeAddressList partnerRange = new CellRangeAddressList(1, 100, 4, 4);
            DataValidationConstraint partnerConstraint = helper.createFormulaListConstraint("refs!$C$1:$C$" + partners.size());
            DataValidation partnerValidation = helper.createValidation(partnerConstraint, partnerRange);
            sheet.addValidationData(partnerValidation);

            workbook.write(out);
            return new ByteArrayInputStream(out.toByteArray());
        }
    }

    public ByteArrayInputStream exportMaterialsToExcel() throws IOException {
        List<Material> materials = materialsRepository.findAll();

        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Materials");

            Row header = sheet.createRow(0);
            header.createCell(0).setCellValue("Mã vật tư");
            header.createCell(1).setCellValue("Tên vật tư");
            header.createCell(2).setCellValue("Đơn vị");
            header.createCell(3).setCellValue("Danh mục");
            header.createCell(4).setCellValue("Tên nhà cung cấp");
            header.createCell(5).setCellValue("Mô tả");

            int rowIdx = 1;
            for (Material m : materials) {
                Row row = sheet.createRow(rowIdx++);
                row.createCell(0).setCellValue(m.getMaterialCode());
                row.createCell(1).setCellValue(m.getMaterialName());
                row.createCell(2).setCellValue(m.getUnit().getUnitName());
                row.createCell(3).setCellValue(m.getMaterialType().getName());

                String partnerName = m.getMaterialPartners().stream()
                        .findFirst().map(mp -> mp.getPartner().getPartnerName()).orElse("");
                row.createCell(4).setCellValue(partnerName);
                row.createCell(5).setCellValue(m.getDescription() != null ? m.getDescription() : "");
            }

            workbook.write(out);
            return new ByteArrayInputStream(out.toByteArray());
        }
    }

    private String getCellValue(Cell cell) {
        if (cell == null) return null;
        cell.setCellType(CellType.STRING);
        return cell.getStringCellValue().trim();
    }
}