package com.ces.rewards.controller;

import com.ces.rewards.dto.request.CreateCesUserRequest;
import com.ces.rewards.dto.response.CesUserResponse;
import com.ces.rewards.security.AuthenticatedUser;
import com.ces.rewards.service.CesUserService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/ces-users")
public class CesUserController {

    private final CesUserService cesUserService;

    public CesUserController(CesUserService cesUserService) {
        this.cesUserService = cesUserService;
    }

    @GetMapping
    public List<CesUserResponse> list() {
        return cesUserService.findAll();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public CesUserResponse create(@Valid @RequestBody CreateCesUserRequest request) {
        return cesUserService.create(request);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id,
                                       @AuthenticationPrincipal AuthenticatedUser currentUser) {
        cesUserService.delete(id, currentUser.getUsername());
        return ResponseEntity.noContent().build();
    }
}
