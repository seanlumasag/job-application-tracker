package com.dev.backend.repository;

import com.dev.backend.model.User;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.test.context.TestPropertySource;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@TestPropertySource(properties = "spring.sql.init.mode=never")
class UserRepositoryTest {

    @Autowired
    private UserRepository userRepository;

    @Test
    void existsByEmailReturnsTrueWhenUserPresent() {
        User user = new User();
        user.setEmail("exists@example.com");
        user.setPasswordHash("hash");
        userRepository.save(user);

        assertThat(userRepository.existsByEmail("exists@example.com")).isTrue();
    }

    @Test
    void findByEmailReturnsEmptyWhenMissing() {
        assertThat(userRepository.findByEmail("missing@example.com")).isEmpty();
    }
}
