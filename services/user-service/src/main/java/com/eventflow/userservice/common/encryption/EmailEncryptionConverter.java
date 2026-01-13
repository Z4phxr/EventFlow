package com.eventflow.userservice.common.encryption;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.Cipher;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.Base64;

@Component
@Converter
public class EmailEncryptionConverter implements AttributeConverter<String, String> {

    private static final String ALGORITHM = "AES";
    private static String encryptionKey = "MySecretKey12345"; // Default fallback
    
    @Value("${encryption.key:MySecretKey12345}")
    public void setEncryptionKey(String key) {
        if (key != null && !key.isEmpty()) {
            encryptionKey = key;
        }
    }

    @Override
    public String convertToDatabaseColumn(String attribute) {
        if (attribute == null) {
            return null;
        }
        try {
            if (encryptionKey == null) {
                System.err.println("ERROR: Encryption key is null!");
                throw new RuntimeException("Encryption key not initialized");
            }
            SecretKeySpec key = new SecretKeySpec(encryptionKey.getBytes(StandardCharsets.UTF_8), ALGORITHM);
            Cipher cipher = Cipher.getInstance(ALGORITHM);
            cipher.init(Cipher.ENCRYPT_MODE, key);
            return Base64.getEncoder().encodeToString(cipher.doFinal(attribute.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception e) {
            System.err.println("ERROR encrypting email: " + e.getMessage());
            throw new RuntimeException("Error encrypting email: " + e.getMessage(), e);
        }
    }

    @Override
    public String convertToEntityAttribute(String dbData) {
        if (dbData == null) {
            return null;
        }
        try {
            SecretKeySpec key = new SecretKeySpec(encryptionKey.getBytes(StandardCharsets.UTF_8), ALGORITHM);
            Cipher cipher = Cipher.getInstance(ALGORITHM);
            cipher.init(Cipher.DECRYPT_MODE, key);
            return new String(cipher.doFinal(Base64.getDecoder().decode(dbData)), StandardCharsets.UTF_8);
        } catch (Exception e) {
            throw new RuntimeException("Error decrypting email", e);
        }
    }
}


