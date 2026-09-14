package com.ces.rewards.service;

import com.ces.rewards.dto.request.CreateCesUserRequest;
import com.ces.rewards.dto.response.CesUserResponse;
import com.ces.rewards.entity.CesUser;
import com.ces.rewards.entity.Role;
import com.ces.rewards.exception.ApiException;
import com.ces.rewards.repository.CesUserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;

@Service
public class CesUserService {

    private final CesUserRepository cesUserRepository;
    private final PasswordEncoder passwordEncoder;
    private final RefreshTokenService refreshTokenService;

    public CesUserService(CesUserRepository cesUserRepository,
                          PasswordEncoder passwordEncoder,
                          RefreshTokenService refreshTokenService) {
        this.cesUserRepository = cesUserRepository;
        this.passwordEncoder = passwordEncoder;
        this.refreshTokenService = refreshTokenService;
    }

    @Transactional(readOnly = true)
    public List<CesUserResponse> findAll() {
        return cesUserRepository.findAll().stream()
                .sorted(Comparator.comparing(CesUser::getId))
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public CesUserResponse create(CreateCesUserRequest request) {
        if (cesUserRepository.existsByUsername(request.username())) {
            throw ApiException.conflict("Username '" + request.username() + "' is already taken");
        }

        CesUser user = new CesUser();
        user.setUsername(request.username());
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setFullName(request.fullName());
        user.setEmail(request.email());
        user.setRole(Role.CES_USER);
        user.setActive(true);

        return toResponse(cesUserRepository.save(user));
    }

    @Transactional
    public void delete(Long id, String requestingUsername) {
        CesUser target = cesUserRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("CES user"));

        if (target.getUsername().equals(requestingUsername)) {
            throw ApiException.badRequest("You cannot delete your own account");
        }

        if (target.getRole() == Role.ADMIN_CES) {
            throw ApiException.badRequest("Administrator accounts cannot be deleted from the portal");
        }

        refreshTokenService.revokeAllForUser(target.getId());
        cesUserRepository.delete(target);
    }

    private CesUserResponse toResponse(CesUser user) {
        return new CesUserResponse(
                user.getId(),
                user.getUsername(),
                user.getFullName(),
                user.getEmail(),
                user.getRole().name(),
                user.isActive(),
                user.getCreatedAt());
    }
}
