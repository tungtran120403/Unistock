//package vn.unistock.unistockmanagementsystem.features.user.materialPartners;
//
//import lombok.RequiredArgsConstructor;
//import lombok.extern.slf4j.Slf4j;
//import org.springframework.stereotype.Service;
//import org.springframework.transaction.annotation.Transactional;
//import vn.unistock.unistockmanagementsystem.entities.Material;
//import vn.unistock.unistockmanagementsystem.entities.MaterialPartner;
//import vn.unistock.unistockmanagementsystem.entities.Partner;
//import vn.unistock.unistockmanagementsystem.features.user.materials.MaterialsRepository;
//import vn.unistock.unistockmanagementsystem.features.user.partner.PartnerRepository;
//
//import java.util.List;
//import java.util.stream.Collectors;
//
//@Service
//@RequiredArgsConstructor
//@Slf4j
//
//public class MaterialPartnerService {
//
//    private final MaterialPartnerRepository materialPartnerRepository;
//    private final PartnerRepository partnerRepository;
//    private final MaterialsRepository materialsRepository;
//
//    @Transactional(readOnly = true)
//    public List<Long> getPartnerIdsByMaterial(Long materialId) {
//        Material material = materialsRepository.findById(materialId)
//                .orElseThrow(() -> new RuntimeException("Không tìm thấy nguyên vật liệu"));
//
//        List<MaterialPartner> materialPartners = materialPartnerRepository.findByMaterial(material);
//
//        return materialPartners.stream()
//                .map(mp -> mp.getPartner().getPartnerId())
//                .collect(Collectors.toList());
//    }
//
////    @Transactional
////    public void addPartnersToMaterial(Long materialId, List<Long> partnerIds) {
////        Material material = materialsRepository.findById(materialId)
////                .orElseThrow(() -> new RuntimeException("Không tìm thấy nguyên vật liệu"));
////
////        List<MaterialPartner> materialPartners = partnerIds.stream()
////                .map(partnerId -> {
////                    Partner partner = partnerRepository.findById(partnerId)
////                            .orElseThrow(() -> new RuntimeException("Không tìm thấy đối tác với ID: " + partnerId));
////
////                    return new MaterialPartner(null, material, partner);
////                })
////                .collect(Collectors.toList());
////
////        materialPartnerRepository.saveAll(materialPartners);
////    }
////
////    @Transactional
////    public List<MaterialPartner> saveAll(List<MaterialPartner> materialPartners) {
////        log.info("📌 [DEBUG] Saving MaterialPartners: {}", materialPartners.stream()
////                .map(mp -> "MaterialPartner{id=" + mp.getId() + "}")
////                .collect(Collectors.toList()));
////        List<MaterialPartner> savedMaterialPartners = materialPartnerRepository.saveAll(materialPartners);
////        log.info("✅ [SUCCESS] Saved MaterialPartners: {}", savedMaterialPartners.stream()
////                .map(mp -> "MaterialPartner{id=" + mp.getId() + "}")
////                .collect(Collectors.toList()));
////        return savedMaterialPartners;
////    }
//}
