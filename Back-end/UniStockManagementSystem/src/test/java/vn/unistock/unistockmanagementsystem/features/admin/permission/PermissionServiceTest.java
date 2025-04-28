package vn.unistock.unistockmanagementsystem.features.admin.permission;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import vn.unistock.unistockmanagementsystem.entities.Permission;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PermissionServiceTest {

    @Mock
    private PermissionRepository permissionRepository;

    @Mock
    private PermissionMapper permissionMapper;

    @InjectMocks
    private PermissionService permissionService;

    private Permission permission1;
    private Permission permission2;
    private Permission adminPermission;
    private Permission authPermission;
    private Permission errorPermission;
    private PermissionDTO permissionDTO1;
    private PermissionDTO permissionDTO2;

    @BeforeEach
    void setUp() {
        // Set up test data
        permission1 = new Permission();
        permission1.setPermissionId(1L);
        permission1.setPermissionName("viewProduct");
        permission1.setDescription("View product details");
        permission1.setHttpMethod("GET");
        permission1.setUrlPattern("/api/products");

        permission2 = new Permission();
        permission2.setPermissionId(2L);
        permission2.setPermissionName("createProduct");
        permission2.setDescription("Create new product");
        permission2.setHttpMethod("POST");
        permission2.setUrlPattern("/api/products");

        adminPermission = new Permission();
        adminPermission.setPermissionId(3L);
        adminPermission.setPermissionName("adminAccess");
        adminPermission.setDescription("Admin access");
        adminPermission.setHttpMethod("GET");
        adminPermission.setUrlPattern("/api/admin/access");

        authPermission = new Permission();
        authPermission.setPermissionId(4L);
        authPermission.setPermissionName("authenticate");
        authPermission.setDescription("Authentication");
        authPermission.setHttpMethod("POST");
        authPermission.setUrlPattern("/api/auth/login");

        errorPermission = new Permission();
        errorPermission.setPermissionId(5L);
        errorPermission.setPermissionName("errorHandler");
        errorPermission.setDescription("Error handling");
        errorPermission.setHttpMethod("GET");
        errorPermission.setUrlPattern("/api/error/handle");

        permissionDTO1 = new PermissionDTO();
        permissionDTO1.setId(1L);
        permissionDTO1.setName("viewProduct");
        permissionDTO1.setDescription("View product details");
        permissionDTO1.setHttpMethod("GET");
        permissionDTO1.setUrlPattern("/api/products");

        permissionDTO2 = new PermissionDTO();
        permissionDTO2.setId(2L);
        permissionDTO2.setName("createProduct");
        permissionDTO2.setDescription("Create new product");
        permissionDTO2.setHttpMethod("POST");
        permissionDTO2.setUrlPattern("/api/products");
    }

    @Nested
    @DisplayName("getAllPermissions Tests")
    class GetAllPermissionsTests {

        @Test
        @DisplayName("Should return permissions that don't contain admin, auth, or error URLs")
        void shouldReturnPermissionsThatDontContainFilteredUrls() {
            // Arrange
            List<Permission> allPermissions = Arrays.asList(
                    permission1, permission2, adminPermission, authPermission, errorPermission
            );
            when(permissionRepository.findAll()).thenReturn(allPermissions);
            when(permissionMapper.toDTO(permission1)).thenReturn(permissionDTO1);
            when(permissionMapper.toDTO(permission2)).thenReturn(permissionDTO2);

            // Act
            List<PermissionDTO> result = permissionService.getAllPermissions();

            // Assert
            assertEquals(2, result.size());
            assertTrue(result.contains(permissionDTO1));
            assertTrue(result.contains(permissionDTO2));
            verify(permissionRepository).findAll();
            verify(permissionMapper).toDTO(permission1);
            verify(permissionMapper).toDTO(permission2);
            verify(permissionMapper, never()).toDTO(adminPermission);
            verify(permissionMapper, never()).toDTO(authPermission);
            verify(permissionMapper, never()).toDTO(errorPermission);
        }

        @Test
        @DisplayName("Should return empty list when no permissions exist")
        void shouldReturnEmptyListWhenNoPermissionsExist() {
            // Arrange
            when(permissionRepository.findAll()).thenReturn(Collections.emptyList());

            // Act
            List<PermissionDTO> result = permissionService.getAllPermissions();

            // Assert
            assertTrue(result.isEmpty());
            verify(permissionRepository).findAll();
            verify(permissionMapper, never()).toDTO(any());
        }

        @Test
        @DisplayName("Should return empty list when all permissions contain filtered keywords")
        void shouldReturnEmptyListWhenAllPermissionsContainFilteredKeywords() {
            // Arrange
            List<Permission> filteredPermissions = Arrays.asList(
                    adminPermission, authPermission, errorPermission
            );
            when(permissionRepository.findAll()).thenReturn(filteredPermissions);

            // Act
            List<PermissionDTO> result = permissionService.getAllPermissions();

            // Assert
            assertTrue(result.isEmpty());
            verify(permissionRepository).findAll();
            verify(permissionMapper, never()).toDTO(any());
        }
    }

    @Nested
    @DisplayName("createPermission Tests")
    class CreatePermissionTests {

        @Test
        @DisplayName("Should create a new permission successfully")
        void shouldCreateNewPermissionSuccessfully() {
            // Arrange
            PermissionDTO newPermissionDTO = new PermissionDTO();
            newPermissionDTO.setName("newPermission");
            newPermissionDTO.setDescription("New permission");
            newPermissionDTO.setHttpMethod("GET");
            newPermissionDTO.setUrlPattern("/api/new");

            Permission newPermission = new Permission();
            newPermission.setPermissionName("newPermission");

            Permission savedPermission = new Permission();
            savedPermission.setPermissionId(10L);
            savedPermission.setPermissionName("newPermission");

            PermissionDTO savedPermissionDTO = new PermissionDTO();
            savedPermissionDTO.setId(10L);
            savedPermissionDTO.setName("newPermission");

            when(permissionRepository.existsByPermissionName("newPermission")).thenReturn(false);
            when(permissionMapper.toEntity(newPermissionDTO)).thenReturn(newPermission);
            when(permissionRepository.save(newPermission)).thenReturn(savedPermission);
            when(permissionMapper.toDTO(savedPermission)).thenReturn(savedPermissionDTO);

            // Act
            PermissionDTO result = permissionService.createPermission(newPermissionDTO);

            // Assert
            assertNotNull(result);
            assertEquals(10L, result.getId());
            assertEquals("newPermission", result.getName());
            verify(permissionRepository).existsByPermissionName("newPermission");
            verify(permissionMapper).toEntity(newPermissionDTO);
            verify(permissionRepository).save(newPermission);
            verify(permissionMapper).toDTO(savedPermission);
        }

        @Test
        @DisplayName("Should throw exception when permission with same name already exists")
        void shouldThrowExceptionWhenPermissionWithSameNameExists() {
            // Arrange
            PermissionDTO newPermissionDTO = new PermissionDTO();
            newPermissionDTO.setName("viewProduct");
            newPermissionDTO.setDescription("View product details");

            when(permissionRepository.existsByPermissionName("viewProduct")).thenReturn(true);

            // Act & Assert
            RuntimeException exception = assertThrows(RuntimeException.class, () ->
                    permissionService.createPermission(newPermissionDTO)
            );
            assertEquals("Quyền đã tồn tại", exception.getMessage());
            verify(permissionRepository).existsByPermissionName("viewProduct");
            verify(permissionMapper, never()).toEntity(any());
            verify(permissionRepository, never()).save(any());
        }

        @Test
        @DisplayName("Should create permission with minimal data")
        void shouldCreatePermissionWithMinimalData() {
            // Arrange
            PermissionDTO minimalDTO = new PermissionDTO();
            minimalDTO.setName("minimalPermission");
            // Leave other fields null

            Permission minimalEntity = new Permission();
            minimalEntity.setPermissionName("minimalPermission");

            Permission savedMinimalEntity = new Permission();
            savedMinimalEntity.setPermissionId(11L);
            savedMinimalEntity.setPermissionName("minimalPermission");

            PermissionDTO savedMinimalDTO = new PermissionDTO();
            savedMinimalDTO.setId(11L);
            savedMinimalDTO.setName("minimalPermission");

            when(permissionRepository.existsByPermissionName("minimalPermission")).thenReturn(false);
            when(permissionMapper.toEntity(minimalDTO)).thenReturn(minimalEntity);
            when(permissionRepository.save(minimalEntity)).thenReturn(savedMinimalEntity);
            when(permissionMapper.toDTO(savedMinimalEntity)).thenReturn(savedMinimalDTO);

            // Act
            PermissionDTO result = permissionService.createPermission(minimalDTO);

            // Assert
            assertNotNull(result);
            assertEquals(11L, result.getId());
            assertEquals("minimalPermission", result.getName());
            verify(permissionRepository).existsByPermissionName("minimalPermission");
            verify(permissionMapper).toEntity(minimalDTO);
            verify(permissionRepository).save(minimalEntity);
            verify(permissionMapper).toDTO(savedMinimalEntity);
        }
    }

    @Nested
    @DisplayName("updatePermission Tests")
    class UpdatePermissionTests {

        @Test
        @DisplayName("Should update permission successfully")
        void shouldUpdatePermissionSuccessfully() {
            // Arrange
            Long permissionId = 1L;
            PermissionDTO updateDTO = new PermissionDTO();
            updateDTO.setId(permissionId);
            updateDTO.setName("updatedPermission");
            updateDTO.setDescription("Updated description");
            updateDTO.setHttpMethod("PUT");
            updateDTO.setUrlPattern("/api/updated");

            Permission existingPermission = new Permission();
            existingPermission.setPermissionId(permissionId);
            existingPermission.setPermissionName("viewProduct");
            existingPermission.setDescription("Original description");
            existingPermission.setHttpMethod("GET");
            existingPermission.setUrlPattern("/api/original");

            Permission updatedPermission = new Permission();
            updatedPermission.setPermissionId(permissionId);
            updatedPermission.setPermissionName("updatedPermission");
            updatedPermission.setDescription("Updated description");
            updatedPermission.setHttpMethod("PUT");
            updatedPermission.setUrlPattern("/api/updated");

            PermissionDTO updatedDTO = new PermissionDTO();
            updatedDTO.setId(permissionId);
            updatedDTO.setName("updatedPermission");
            updatedDTO.setDescription("Updated description");
            updatedDTO.setHttpMethod("PUT");
            updatedDTO.setUrlPattern("/api/updated");

            when(permissionRepository.findById(permissionId)).thenReturn(Optional.of(existingPermission));
            when(permissionRepository.save(any(Permission.class))).thenReturn(updatedPermission);
            when(permissionMapper.toDTO(updatedPermission)).thenReturn(updatedDTO);

            // Act
            PermissionDTO result = permissionService.updatePermission(permissionId, updateDTO);

            // Assert
            assertNotNull(result);
            assertEquals(permissionId, result.getId());
            assertEquals("updatedPermission", result.getName());
            assertEquals("Updated description", result.getDescription());
            assertEquals("PUT", result.getHttpMethod());
            assertEquals("/api/updated", result.getUrlPattern());

            verify(permissionRepository).findById(permissionId);
            verify(permissionRepository).save(existingPermission);
            verify(permissionMapper).toDTO(updatedPermission);
        }

        @Test
        @DisplayName("Should throw exception when updating non-existent permission")
        void shouldThrowExceptionWhenUpdatingNonExistentPermission() {
            // Arrange
            Long nonExistentId = 99L;
            PermissionDTO updateDTO = new PermissionDTO();
            updateDTO.setId(nonExistentId);
            updateDTO.setName("nonExistentPermission");

            when(permissionRepository.findById(nonExistentId)).thenReturn(Optional.empty());

            // Act & Assert
            RuntimeException exception = assertThrows(RuntimeException.class, () ->
                    permissionService.updatePermission(nonExistentId, updateDTO)
            );
            assertEquals("Không tìm thấy quyền", exception.getMessage());
            verify(permissionRepository).findById(nonExistentId);
            verify(permissionRepository, never()).save(any());
            verify(permissionMapper, never()).toDTO(any());
        }

        @Test
        @DisplayName("Should handle partial updates with null values")
        void shouldHandlePartialUpdatesWithNullValues() {
            // Arrange
            Long permissionId = 1L;
            PermissionDTO partialUpdateDTO = new PermissionDTO();
            partialUpdateDTO.setId(permissionId);
            partialUpdateDTO.setName("updatedPermission");
            // Leave other fields null

            Permission existingPermission = new Permission();
            existingPermission.setPermissionId(permissionId);
            existingPermission.setPermissionName("viewProduct");
            existingPermission.setDescription("Original description");
            existingPermission.setHttpMethod("GET");
            existingPermission.setUrlPattern("/api/original");

            Permission updatedPermission = new Permission();
            updatedPermission.setPermissionId(permissionId);
            updatedPermission.setPermissionName("updatedPermission");
            updatedPermission.setDescription(null);
            updatedPermission.setHttpMethod(null);
            updatedPermission.setUrlPattern(null);

            PermissionDTO updatedDTO = new PermissionDTO();
            updatedDTO.setId(permissionId);
            updatedDTO.setName("updatedPermission");
            updatedDTO.setDescription(null);
            updatedDTO.setHttpMethod(null);
            updatedDTO.setUrlPattern(null);

            when(permissionRepository.findById(permissionId)).thenReturn(Optional.of(existingPermission));
            when(permissionRepository.save(any(Permission.class))).thenReturn(updatedPermission);
            when(permissionMapper.toDTO(updatedPermission)).thenReturn(updatedDTO);

            // Act
            PermissionDTO result = permissionService.updatePermission(permissionId, partialUpdateDTO);

            // Assert
            assertNotNull(result);
            assertEquals(permissionId, result.getId());
            assertEquals("updatedPermission", result.getName());
            assertNull(result.getDescription());
            assertNull(result.getHttpMethod());
            assertNull(result.getUrlPattern());

            verify(permissionRepository).findById(permissionId);
            verify(permissionRepository).save(existingPermission);
            verify(permissionMapper).toDTO(updatedPermission);
        }
    }

    @Nested
    @DisplayName("deletePermission Tests")
    class DeletePermissionTests {

        @Test
        @DisplayName("Should delete permission successfully")
        void shouldDeletePermissionSuccessfully() {
            // Arrange
            Long permissionId = 1L;
            when(permissionRepository.findById(permissionId)).thenReturn(Optional.of(permission1));
            doNothing().when(permissionRepository).delete(permission1);

            // Act
            permissionService.deletePermission(permissionId);

            // Assert
            verify(permissionRepository).findById(permissionId);
            verify(permissionRepository).delete(permission1);
        }

        @Test
        @DisplayName("Should throw exception when deleting non-existent permission")
        void shouldThrowExceptionWhenDeletingNonExistentPermission() {
            // Arrange
            Long nonExistentId = 99L;
            when(permissionRepository.findById(nonExistentId)).thenReturn(Optional.empty());

            // Act & Assert
            RuntimeException exception = assertThrows(RuntimeException.class, () ->
                    permissionService.deletePermission(nonExistentId)
            );
            assertEquals("Quyền không tồn tại", exception.getMessage());
            verify(permissionRepository).findById(nonExistentId);
            verify(permissionRepository, never()).delete(any());
        }

        @Test
        @DisplayName("Should throw exception when deleting with null ID")
        void shouldThrowExceptionWhenDeletingWithNullId() {
            // Arrange
            when(permissionRepository.findById(null)).thenReturn(Optional.empty());

            // Act & Assert
            RuntimeException exception = assertThrows(RuntimeException.class, () ->
                    permissionService.deletePermission(null)
            );
            assertEquals("Quyền không tồn tại", exception.getMessage());
            verify(permissionRepository).findById(null);
            verify(permissionRepository, never()).delete(any());
        }
    }
}