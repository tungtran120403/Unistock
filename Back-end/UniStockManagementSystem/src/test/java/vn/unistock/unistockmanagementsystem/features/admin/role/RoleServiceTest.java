package vn.unistock.unistockmanagementsystem.features.admin.role;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import vn.unistock.unistockmanagementsystem.entities.Permission;
import vn.unistock.unistockmanagementsystem.entities.Role;
import vn.unistock.unistockmanagementsystem.entities.RolePermission;
import vn.unistock.unistockmanagementsystem.features.admin.permission.PermissionHierarchy;
import vn.unistock.unistockmanagementsystem.features.admin.permission.PermissionRepository;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RoleServiceTest {

    @Mock
    private RoleRepository roleRepository;

    @Mock
    private RoleMapper roleMapper;

    @Mock
    private PermissionRepository permissionRepository;

    @InjectMocks
    private RoleService roleService;

    // Test fixtures
    private Role sampleRole;
    private RoleDTO sampleRoleDTO;
    private List<Role> roleList;
    private List<Permission> permissionList;

    @BeforeEach
    void setUp() {
        // Set up sample Role
        sampleRole = new Role();
        sampleRole.setRoleId(1L);
        sampleRole.setRoleName("ADMIN");
        sampleRole.setDescription("Administrator role");
        sampleRole.setIsActive(true);
        sampleRole.setRolePermissions(new ArrayList<>());
        sampleRole.setUsers(new HashSet<>());

        // Set up sample RoleDTO
        sampleRoleDTO = RoleDTO.builder()
                .id(1L)
                .name("ADMIN")
                .description("Administrator role")
                .active(true)
                .permissionKeys(Arrays.asList("user.read", "user.write"))
                .build();

        // Set up sample permissions
        Permission permission1 = new Permission();
        permission1.setPermissionId(1L);
        permission1.setPermissionName("user.read");
        permission1.setDescription("Read user info");
        permission1.setHttpMethod("GET");
        permission1.setUrlPattern("/api/users/**");

        Permission permission2 = new Permission();
        permission2.setPermissionId(2L);
        permission2.setPermissionName("user.write");
        permission2.setDescription("Write user info");
        permission2.setHttpMethod("POST");
        permission2.setUrlPattern("/api/users/**");

        permissionList = Arrays.asList(permission1, permission2);

        // Set up role permissions
        RolePermission rolePermission1 = RolePermission.builder()
                .role(sampleRole)
                .permission(permission1)
                .build();

        RolePermission rolePermission2 = RolePermission.builder()
                .role(sampleRole)
                .permission(permission2)
                .build();

        sampleRole.setRolePermissions(Arrays.asList(rolePermission1, rolePermission2));

        // Set up role list
        roleList = Arrays.asList(sampleRole);
    }

    @Nested
    @DisplayName("getAllRoles tests")
    class GetAllRolesTests {

        @Test
        @DisplayName("Should return all roles when roles exist")
        void shouldReturnAllRolesWhenRolesExist() {
            // Arrange
            when(roleRepository.findAll()).thenReturn(roleList);
            when(roleMapper.toDTO(any(Role.class))).thenReturn(sampleRoleDTO);

            // Act
            List<RoleDTO> result = roleService.getAllRoles();

            // Assert
            assertNotNull(result);
            assertEquals(1, result.size());
            assertEquals(1L, result.get(0).getId());
            assertEquals("ADMIN", result.get(0).getName());
            verify(roleRepository, times(1)).findAll();
            verify(roleMapper, times(1)).toDTO(sampleRole);
        }

        @Test
        @DisplayName("Should return empty list when no roles exist")
        void shouldReturnEmptyListWhenNoRolesExist() {
            // Arrange
            when(roleRepository.findAll()).thenReturn(Collections.emptyList());

            // Act
            List<RoleDTO> result = roleService.getAllRoles();

            // Assert
            assertNotNull(result);
            assertTrue(result.isEmpty());
            verify(roleRepository, times(1)).findAll();
            verify(roleMapper, never()).toDTO(any(Role.class));
        }
    }

    @Nested
    @DisplayName("createRole tests")
    class CreateRoleTests {

        @Test
        @DisplayName("Should create role successfully with permissions")
        void shouldCreateRoleSuccessfully() {
            // Arrange
            RoleDTO inputDto = RoleDTO.builder()
                    .name("MANAGER")
                    .description("Manager role")
                    .active(true)
                    .permissionKeys(Arrays.asList("inventory.read", "inventory.write"))
                    .build();

            Role mappedRole = new Role();
            mappedRole.setRoleName("MANAGER");
            mappedRole.setDescription("Manager role");
            mappedRole.setIsActive(true);
            mappedRole.setRolePermissions(new ArrayList<>());

            RoleDTO expectedDto = RoleDTO.builder()
                    .id(2L)
                    .name("MANAGER")
                    .description("Manager role")
                    .active(true)
                    .permissionKeys(Arrays.asList("inventory.read", "inventory.write"))
                    .build();

            Set<String> expandedKeys = new HashSet<>(Arrays.asList("inventory.read", "inventory.write"));

            Permission permission1 = new Permission();
            permission1.setPermissionId(3L);
            permission1.setPermissionName("inventory.read");

            Permission permission2 = new Permission();
            permission2.setPermissionId(4L);
            permission2.setPermissionName("inventory.write");

            List<Permission> foundPermissions = Arrays.asList(permission1, permission2);

            when(roleRepository.existsByRoleName("MANAGER")).thenReturn(false);
            when(roleMapper.toEntity(inputDto)).thenReturn(mappedRole);
            when(permissionRepository.findByPermissionNameIn(expandedKeys)).thenReturn(foundPermissions);

            Role savedRole = new Role();
            savedRole.setRoleId(2L);
            savedRole.setRoleName("MANAGER");
            savedRole.setDescription("Manager role");
            savedRole.setIsActive(true);

            when(roleRepository.save(mappedRole)).thenReturn(savedRole);
            when(roleMapper.toDTO(savedRole)).thenReturn(expectedDto);

            // Act
            RoleDTO result = roleService.createRole(inputDto);

            // Assert
            assertNotNull(result);
            assertEquals(2L, result.getId());
            assertEquals("MANAGER", result.getName());
            assertEquals("Manager role", result.getDescription());
            assertTrue(result.getActive());
            verify(roleRepository).existsByRoleName("MANAGER");
            verify(roleMapper).toEntity(inputDto);
            verify(permissionRepository).findByPermissionNameIn(any());
            verify(roleRepository).save(mappedRole);
            verify(roleMapper).toDTO(savedRole);
        }

        @Test
        @DisplayName("Should throw exception when role name already exists")
        void shouldThrowExceptionWhenRoleNameExists() {
            // Arrange
            RoleDTO inputDto = RoleDTO.builder()
                    .name("ADMIN")
                    .description("Admin role")
                    .active(true)
                    .permissionKeys(Arrays.asList("user.read", "user.write"))
                    .build();

            when(roleRepository.existsByRoleName("ADMIN")).thenReturn(true);

            // Act & Assert
            RuntimeException exception = assertThrows(
                    RuntimeException.class,
                    () -> roleService.createRole(inputDto)
            );

            assertEquals("Vai trò đã tồn tại", exception.getMessage());
            verify(roleRepository).existsByRoleName("ADMIN");
            verify(roleMapper, never()).toEntity(any(RoleDTO.class));
            verify(roleRepository, never()).save(any(Role.class));
        }

        @Test
        @DisplayName("Should create role with empty permissions when permissionKeys is null")
        void shouldCreateRoleWithEmptyPermissionsWhenPermissionKeysIsNull() {
            // Arrange
            RoleDTO inputDto = RoleDTO.builder()
                    .name("GUEST")
                    .description("Guest role")
                    .active(true)
                    .permissionKeys(null)
                    .build();

            Role mappedRole = new Role();
            mappedRole.setRoleName("GUEST");
            mappedRole.setDescription("Guest role");
            mappedRole.setIsActive(true);
            mappedRole.setRolePermissions(null);

            Role savedRole = new Role();
            savedRole.setRoleId(3L);
            savedRole.setRoleName("GUEST");
            savedRole.setDescription("Guest role");
            savedRole.setIsActive(true);
            savedRole.setRolePermissions(new ArrayList<>());

            RoleDTO expectedDto = RoleDTO.builder()
                    .id(3L)
                    .name("GUEST")
                    .description("Guest role")
                    .active(true)
                    .permissionKeys(Collections.emptyList())
                    .build();

            when(roleRepository.existsByRoleName("GUEST")).thenReturn(false);
            when(roleMapper.toEntity(inputDto)).thenReturn(mappedRole);
            when(roleRepository.save(mappedRole)).thenReturn(savedRole);
            when(roleMapper.toDTO(savedRole)).thenReturn(expectedDto);

            // Act
            RoleDTO result = roleService.createRole(inputDto);

            // Assert
            assertNotNull(result);
            assertEquals(3L, result.getId());
            assertEquals("GUEST", result.getName());
            verify(roleRepository).existsByRoleName("GUEST");
            verify(roleMapper).toEntity(inputDto);
            verify(permissionRepository, never()).findByPermissionNameIn(anySet());
            verify(roleRepository).save(mappedRole);
        }

        @Test
        @DisplayName("Should create role with empty permissions when permissionKeys is empty")
        void shouldCreateRoleWithEmptyPermissionsWhenPermissionKeysIsEmpty() {
            // Arrange
            RoleDTO inputDto = RoleDTO.builder()
                    .name("VIEWER")
                    .description("Viewer role")
                    .active(true)
                    .permissionKeys(Collections.emptyList())
                    .build();

            Role mappedRole = new Role();
            mappedRole.setRoleName("VIEWER");
            mappedRole.setDescription("Viewer role");
            mappedRole.setIsActive(true);
            mappedRole.setRolePermissions(new ArrayList<>());

            Role savedRole = new Role();
            savedRole.setRoleId(4L);
            savedRole.setRoleName("VIEWER");
            savedRole.setDescription("Viewer role");
            savedRole.setIsActive(true);
            savedRole.setRolePermissions(new ArrayList<>());

            RoleDTO expectedDto = RoleDTO.builder()
                    .id(4L)
                    .name("VIEWER")
                    .description("Viewer role")
                    .active(true)
                    .permissionKeys(Collections.emptyList())
                    .build();

            when(roleRepository.existsByRoleName("VIEWER")).thenReturn(false);
            when(roleMapper.toEntity(inputDto)).thenReturn(mappedRole);
            when(roleRepository.save(mappedRole)).thenReturn(savedRole);
            when(roleMapper.toDTO(savedRole)).thenReturn(expectedDto);

            // Act
            RoleDTO result = roleService.createRole(inputDto);

            // Assert
            assertNotNull(result);
            assertEquals(4L, result.getId());
            assertEquals("VIEWER", result.getName());
            verify(roleRepository).existsByRoleName("VIEWER");
            verify(roleMapper).toEntity(inputDto);
            verify(permissionRepository, never()).findByPermissionNameIn(anySet());
            verify(roleRepository).save(mappedRole);
        }
    }

    @Nested
    @DisplayName("updateRoleStatus tests")
    class UpdateRoleStatusTests {

        @Test
        @DisplayName("Should update role status successfully")
        void shouldUpdateRoleStatusSuccessfully() {
            // Arrange
            Long roleId = 1L;
            boolean newStatus = false;

            Role existingRole = new Role();
            existingRole.setRoleId(1L);
            existingRole.setRoleName("ADMIN");
            existingRole.setDescription("Administrator role");
            existingRole.setIsActive(true);
            existingRole.setRolePermissions(new ArrayList<>());

            Role updatedRole = new Role();
            updatedRole.setRoleId(1L);
            updatedRole.setRoleName("ADMIN");
            updatedRole.setDescription("Administrator role");
            updatedRole.setIsActive(false);
            updatedRole.setRolePermissions(new ArrayList<>());

            RoleDTO updatedRoleDTO = RoleDTO.builder()
                    .id(1L)
                    .name("ADMIN")
                    .description("Administrator role")
                    .active(false)
                    .permissionKeys(Arrays.asList("user.read", "user.write"))
                    .build();

            when(roleRepository.findById(1L)).thenReturn(Optional.of(existingRole));
            when(roleRepository.save(existingRole)).thenReturn(updatedRole);
            when(roleMapper.toDTO(updatedRole)).thenReturn(updatedRoleDTO);

            // Act
            RoleDTO result = roleService.updateRoleStatus(roleId, newStatus);

            // Assert
            assertNotNull(result);
            assertEquals(1L, result.getId());
            assertEquals("ADMIN", result.getName());
            assertFalse(result.getActive());
            verify(roleRepository).findById(1L);
            verify(roleRepository).save(existingRole);
            verify(roleMapper).toDTO(updatedRole);
        }

        @Test
        @DisplayName("Should throw exception when role not found")
        void shouldThrowExceptionWhenRoleNotFound() {
            // Arrange
            Long nonExistingRoleId = 999L;
            when(roleRepository.findById(999L)).thenReturn(Optional.empty());

            // Act & Assert
            RuntimeException exception = assertThrows(
                    RuntimeException.class,
                    () -> roleService.updateRoleStatus(nonExistingRoleId, false)
            );

            assertEquals("Không tìm thấy vai trò", exception.getMessage());
            verify(roleRepository).findById(999L);
            verify(roleRepository, never()).save(any(Role.class));
        }

        @Test
        @DisplayName("Should handle boundary case with true status")
        void shouldHandleBoundaryCase() {
            // Arrange
            Long roleId = 0L;
            boolean newStatus = true;

            Role boundaryRole = new Role();
            boundaryRole.setRoleId(0L);
            boundaryRole.setRoleName("DEFAULT");
            boundaryRole.setDescription("Default role");
            boundaryRole.setIsActive(false);

            Role updatedRole = new Role();
            updatedRole.setRoleId(0L);
            updatedRole.setRoleName("DEFAULT");
            updatedRole.setDescription("Default role");
            updatedRole.setIsActive(true);

            RoleDTO updatedRoleDTO = RoleDTO.builder()
                    .id(0L)
                    .name("DEFAULT")
                    .description("Default role")
                    .active(true)
                    .permissionKeys(Collections.emptyList())
                    .build();

            when(roleRepository.findById(0L)).thenReturn(Optional.of(boundaryRole));
            when(roleRepository.save(boundaryRole)).thenReturn(updatedRole);
            when(roleMapper.toDTO(updatedRole)).thenReturn(updatedRoleDTO);

            // Act
            RoleDTO result = roleService.updateRoleStatus(roleId, newStatus);

            // Assert
            assertNotNull(result);
            assertEquals(0L, result.getId());
            assertEquals("DEFAULT", result.getName());
            assertTrue(result.getActive());
            verify(roleRepository).findById(0L);
            verify(roleRepository).save(boundaryRole);
        }
    }

    @Nested
    @DisplayName("updateRole tests")
    class UpdateRoleTests {

        @Test
        @DisplayName("Should update role successfully with permissions")
        void shouldUpdateRoleSuccessfullyWithPermissions() {
            // Arrange
            Long roleId = 1L;
            RoleDTO updateDto = RoleDTO.builder()
                    .name("ADMIN_UPDATED")
                    .description("Updated administrator role")
                    .active(true)
                    .permissionKeys(Arrays.asList("user.read", "user.write", "user.delete"))
                    .build();

            Role existingRole = new Role();
            existingRole.setRoleId(1L);
            existingRole.setRoleName("ADMIN");
            existingRole.setDescription("Administrator role");
            existingRole.setIsActive(true);
            existingRole.setRolePermissions(new ArrayList<>());

            Set<String> expandedKeys = new HashSet<>(Arrays.asList("user.read", "user.write", "user.delete"));

            Permission permission1 = new Permission();
            permission1.setPermissionId(1L);
            permission1.setPermissionName("user.read");

            Permission permission2 = new Permission();
            permission2.setPermissionId(2L);
            permission2.setPermissionName("user.write");

            Permission permission3 = new Permission();
            permission3.setPermissionId(5L);
            permission3.setPermissionName("user.delete");

            List<Permission> foundPermissions = Arrays.asList(permission1, permission2, permission3);

            Role updatedRole = new Role();
            updatedRole.setRoleId(1L);
            updatedRole.setRoleName("ADMIN_UPDATED");
            updatedRole.setDescription("Updated administrator role");
            updatedRole.setIsActive(true);

            RoleDTO expectedDto = RoleDTO.builder()
                    .id(1L)
                    .name("ADMIN_UPDATED")
                    .description("Updated administrator role")
                    .active(true)
                    .permissionKeys(Arrays.asList("user.read", "user.write", "user.delete"))
                    .build();

            when(roleRepository.findById(1L)).thenReturn(Optional.of(existingRole));
            when(permissionRepository.findByPermissionNameIn(any())).thenReturn(foundPermissions);
            when(roleRepository.save(existingRole)).thenReturn(updatedRole);
            when(roleMapper.toDTO(updatedRole)).thenReturn(expectedDto);

            // Act
            RoleDTO result = roleService.updateRole(roleId, updateDto);

            // Assert
            assertNotNull(result);
            assertEquals(1L, result.getId());
            assertEquals("ADMIN_UPDATED", result.getName());
            assertEquals("Updated administrator role", result.getDescription());
            verify(roleRepository).findById(1L);
            verify(permissionRepository).findByPermissionNameIn(any());
            verify(roleRepository).save(existingRole);
            verify(roleMapper).toDTO(updatedRole);
        }

        @Test
        @DisplayName("Should update role successfully without permissions")
        void shouldUpdateRoleSuccessfullyWithoutPermissions() {
            // Arrange
            Long roleId = 2L;
            RoleDTO updateDto = RoleDTO.builder()
                    .name("MANAGER_UPDATED")
                    .description("Updated manager role")
                    .active(false)
                    .permissionKeys(null)
                    .build();

            Role existingRole = new Role();
            existingRole.setRoleId(2L);
            existingRole.setRoleName("MANAGER");
            existingRole.setDescription("Manager role");
            existingRole.setIsActive(true);
            existingRole.setRolePermissions(new ArrayList<>());

            Role updatedRole = new Role();
            updatedRole.setRoleId(2L);
            updatedRole.setRoleName("MANAGER_UPDATED");
            updatedRole.setDescription("Updated manager role");
            updatedRole.setIsActive(false);

            RoleDTO expectedDto = RoleDTO.builder()
                    .id(2L)
                    .name("MANAGER_UPDATED")
                    .description("Updated manager role")
                    .active(false)
                    .permissionKeys(null)
                    .build();

            when(roleRepository.findById(2L)).thenReturn(Optional.of(existingRole));
            when(roleRepository.save(existingRole)).thenReturn(updatedRole);
            when(roleMapper.toDTO(updatedRole)).thenReturn(expectedDto);

            // Act
            RoleDTO result = roleService.updateRole(roleId, updateDto);

            // Assert
            assertNotNull(result);
            assertEquals(2L, result.getId());
            assertEquals("MANAGER_UPDATED", result.getName());
            assertEquals("Updated manager role", result.getDescription());
            assertFalse(result.getActive());
            verify(roleRepository).findById(2L);
            verify(permissionRepository, never()).findByPermissionNameIn(anySet());
            verify(roleRepository).save(existingRole);
            verify(roleMapper).toDTO(updatedRole);
        }

        @Test
        @DisplayName("Should throw exception when role not found")
        void shouldThrowExceptionWhenRoleNotFound() {
            // Arrange
            Long nonExistingRoleId = 999L;
            RoleDTO updateDto = RoleDTO.builder()
                    .name("NON_EXISTENT")
                    .description("This role doesn't exist")
                    .active(true)
                    .permissionKeys(Collections.emptyList())
                    .build();

            when(roleRepository.findById(999L)).thenReturn(Optional.empty());

            // Act & Assert
            RuntimeException exception = assertThrows(
                    RuntimeException.class,
                    () -> roleService.updateRole(nonExistingRoleId, updateDto)
            );

            assertEquals("Không tìm thấy vai trò", exception.getMessage());
            verify(roleRepository).findById(999L);
            verify(roleRepository, never()).save(any(Role.class));
        }

        @Test
        @DisplayName("Should update with empty expanded permissions")
        void shouldUpdateWithEmptyExpandedPermissions() {
            // Arrange
            Long roleId = 3L;
            RoleDTO updateDto = RoleDTO.builder()
                    .name("GUEST_UPDATED")
                    .description("Updated guest role")
                    .active(true)
                    .permissionKeys(Arrays.asList("non.existent.permission"))
                    .build();

            Role existingRole = new Role();
            existingRole.setRoleId(3L);
            existingRole.setRoleName("GUEST");
            existingRole.setDescription("Guest role");
            existingRole.setIsActive(true);
            existingRole.setRolePermissions(new ArrayList<>());

            Role updatedRole = new Role();
            updatedRole.setRoleId(3L);
            updatedRole.setRoleName("GUEST_UPDATED");
            updatedRole.setDescription("Updated guest role");
            updatedRole.setIsActive(true);
            updatedRole.setRolePermissions(new ArrayList<>());

            RoleDTO expectedDto = RoleDTO.builder()
                    .id(3L)
                    .name("GUEST_UPDATED")
                    .description("Updated guest role")
                    .active(true)
                    .permissionKeys(Collections.emptyList())
                    .build();

            when(roleRepository.findById(3L)).thenReturn(Optional.of(existingRole));
            when(permissionRepository.findByPermissionNameIn(any())).thenReturn(Collections.emptyList());
            when(roleRepository.save(existingRole)).thenReturn(updatedRole);
            when(roleMapper.toDTO(updatedRole)).thenReturn(expectedDto);

            // Act
            RoleDTO result = roleService.updateRole(roleId, updateDto);

            // Assert
            assertNotNull(result);
            assertEquals(3L, result.getId());
            assertEquals("GUEST_UPDATED", result.getName());
            verify(roleRepository).findById(3L);
            verify(permissionRepository).findByPermissionNameIn(any());
            verify(roleRepository).save(existingRole);
        }
    }

    @Nested
    @DisplayName("deleteRole tests")
    class DeleteRoleTests {

        @Test
        @DisplayName("Should delete role successfully")
        void shouldDeleteRoleSuccessfully() {
            // Arrange
            Long roleId = 1L;

            Role existingRole = new Role();
            existingRole.setRoleId(1L);
            existingRole.setRoleName("ADMIN");

            when(roleRepository.findById(1L)).thenReturn(Optional.of(existingRole));
            doNothing().when(roleRepository).delete(existingRole);

            // Act
            roleService.deleteRole(roleId);

            // Assert
            verify(roleRepository).findById(1L);
            verify(roleRepository).delete(existingRole);
        }

        @Test
        @DisplayName("Should throw exception when role not found")
        void shouldThrowExceptionWhenRoleNotFound() {
            // Arrange
            Long nonExistingRoleId = 999L;
            when(roleRepository.findById(999L)).thenReturn(Optional.empty());

            // Act & Assert
            RuntimeException exception = assertThrows(
                    RuntimeException.class,
                    () -> roleService.deleteRole(nonExistingRoleId)
            );

            assertEquals("Vai trò không tồn tại", exception.getMessage());
            verify(roleRepository).findById(999L);
            verify(roleRepository, never()).delete(any(Role.class));
        }

        @Test
        @DisplayName("Should attempt to delete role with boundary ID")
        void shouldAttemptToDeleteRoleWithBoundaryId() {
            // Arrange
            Long boundaryRoleId = 0L;

            Role boundaryRole = new Role();
            boundaryRole.setRoleId(0L);
            boundaryRole.setRoleName("DEFAULT");

            when(roleRepository.findById(0L)).thenReturn(Optional.of(boundaryRole));
            doNothing().when(roleRepository).delete(boundaryRole);

            // Act
            roleService.deleteRole(boundaryRoleId);

            // Assert
            verify(roleRepository).findById(0L);
            verify(roleRepository).delete(boundaryRole);
        }
    }

    @Nested
    @DisplayName("getRoleById tests")
    class GetRoleByIdTests {

        @Test
        @DisplayName("Should return role when it exists")
        void shouldReturnRoleWhenItExists() {
            // Arrange
            Long roleId = 1L;

            Role existingRole = new Role();
            existingRole.setRoleId(1L);
            existingRole.setRoleName("ADMIN");
            existingRole.setDescription("Administrator role");

            when(roleRepository.findById(1L)).thenReturn(Optional.of(existingRole));

            // Act
            Role result = roleService.getRoleById(roleId);

            // Assert
            assertNotNull(result);
            assertEquals(1L, result.getRoleId());
            assertEquals("ADMIN", result.getRoleName());
            assertEquals("Administrator role", result.getDescription());
            verify(roleRepository).findById(1L);
        }

        @Test
        @DisplayName("Should return null when role not found")
        void shouldReturnNullWhenRoleNotFound() {
            // Arrange
            Long nonExistingRoleId = 999L;
            when(roleRepository.findById(999L)).thenReturn(Optional.empty());

            // Act
            Role result = roleService.getRoleById(nonExistingRoleId);

            // Assert
            assertNull(result);
            verify(roleRepository).findById(999L);
        }

        @Test
        @DisplayName("Should handle boundary case with zero ID")
        void shouldHandleBoundaryCaseWithZeroId() {
            // Arrange
            Long boundaryRoleId = 0L;

            Role boundaryRole = new Role();
            boundaryRole.setRoleId(0L);
            boundaryRole.setRoleName("DEFAULT");
            boundaryRole.setDescription("Default role");

            when(roleRepository.findById(0L)).thenReturn(Optional.of(boundaryRole));

            // Act
            Role result = roleService.getRoleById(boundaryRoleId);

            // Assert
            assertNotNull(result);
            assertEquals(0L, result.getRoleId());
            assertEquals("DEFAULT", result.getRoleName());
            assertEquals("Default role", result.getDescription());
            verify(roleRepository).findById(0L);
        }
    }
}