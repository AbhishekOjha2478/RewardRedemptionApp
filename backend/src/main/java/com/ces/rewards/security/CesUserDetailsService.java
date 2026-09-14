package com.ces.rewards.security;

import com.ces.rewards.entity.CesUser;
import com.ces.rewards.repository.CesUserRepository;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
public class CesUserDetailsService implements UserDetailsService {

    private final CesUserRepository cesUserRepository;

    public CesUserDetailsService(CesUserRepository cesUserRepository) {
        this.cesUserRepository = cesUserRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        CesUser user = cesUserRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("No user named " + username));
        return new AuthenticatedUser(user);
    }
}
