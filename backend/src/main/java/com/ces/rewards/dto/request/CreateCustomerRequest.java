package com.ces.rewards.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record CreateCustomerRequest(
        @NotBlank(message = "First name is required")
        @Size(max = 60)
        String firstName,

        @NotBlank(message = "Last name is required")
        @Size(max = 60)
        String lastName,

        @NotBlank(message = "Email is required")
        @Email(message = "Must be a valid email address")
        @Size(max = 120)
        String email,

        @Pattern(regexp = "\\d{10}", message = "Phone must be exactly 10 digits")
        String phone,

        @NotNull(message = "Association date is required")
        @PastOrPresent(message = "Association date cannot be in the future")
        LocalDate associatedSince
) {
}
