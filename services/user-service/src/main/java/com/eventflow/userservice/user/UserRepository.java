package com.eventflow.userservice.user;

import com.eventflow.userservice.user.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<User, UUID> {
    
    Optional<User> findByUsername(String username);
    
    Optional<User> findByEncryptedEmail(String email);
    
    boolean existsByUsername(String username);
    
    boolean existsByEncryptedEmail(String email);
}


