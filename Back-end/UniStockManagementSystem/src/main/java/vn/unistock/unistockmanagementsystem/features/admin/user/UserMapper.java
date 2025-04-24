package vn.unistock.unistockmanagementsystem.features.admin.user;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.factory.Mappers;
import vn.unistock.unistockmanagementsystem.entities.User;
import vn.unistock.unistockmanagementsystem.entities.UserDetail;

@Mapper(componentModel = "spring")
public interface UserMapper {
    UserMapper INSTANCE = Mappers.getMapper(UserMapper.class);

    // 🟢 **Ánh xạ từ `User` → `UserDTO`**
    @Mapping(target = "roleIds", expression = "java(user.getRoles().stream().map(r -> r.getRoleId()).collect(java.util.stream.Collectors.toSet()))")
    @Mapping(target = "roleNames", expression = "java(user.getRoles().stream().map(r -> r.getRoleName()).collect(java.util.stream.Collectors.toSet()))")
    @Mapping(target = "password", ignore = true) // ✅ Không trả về password
    @Mapping(target = "userDetail", source = "userDetail") // ✅ Gán `UserDetail`
    UserDTO toDTO(User user);

    // 🟢 **Ánh xạ từ `UserDTO` → `User`**
    @Mapping(target = "roles", ignore = true)
    @Mapping(target = "userDetail", ignore = true) // ✅ `UserDetail` sẽ xử lý riêng
    User toEntity(UserDTO dto);

    // 🟢 **Ánh xạ từ `UserDetail` → `UserDetailDTO` (Bao gồm fullname)**
    @Mapping(source = "fullname", target = "fullname") // ✅ Thêm ánh xạ fullname
    @Mapping(source = "phoneNumber", target = "phoneNumber")
    @Mapping(source = "address", target = "address")
    @Mapping(source = "dateOfBirth", target = "dateOfBirth")
    @Mapping(source = "profilePicture", target = "profilePicture")
    UserDetailDTO toUserDetailDTO(UserDetail userDetail);
}
