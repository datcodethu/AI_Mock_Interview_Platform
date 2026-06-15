CREATE DATABASE identity_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE TABLE users (
                       id VARCHAR(36) PRIMARY KEY,
                       username VARCHAR(50) NOT NULL UNIQUE,
                       email VARCHAR(100) NOT NULL UNIQUE,
                       password_hash VARCHAR(255) NOT NULL,
                       status VARCHAR(20) DEFAULT 'ACTIVE',
                       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                       updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                       created_by VARCHAR(36),
                       updated_by VARCHAR(36),
                       is_deleted BOOLEAN DEFAULT FALSE
);

CREATE TABLE roles (
                       id INT AUTO_INCREMENT PRIMARY KEY,
                       code VARCHAR(50) NOT NULL UNIQUE,
                       name VARCHAR(100) NOT NULL,
                       description VARCHAR(255),
                       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                       updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                       created_by VARCHAR(36),
                       updated_by VARCHAR(36),
                       is_deleted BOOLEAN DEFAULT FALSE
);

CREATE TABLE user_roles (
                            id BIGINT AUTO_INCREMENT PRIMARY KEY,
                            user_id VARCHAR(36) NOT NULL,
                            role_id INT NOT NULL,
                            granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                            granted_by VARCHAR(36),
                            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                            FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
                            UNIQUE KEY uk_user_role (user_id, role_id)
);

CREATE TABLE permissions (
                             id INT AUTO_INCREMENT PRIMARY KEY,
                             code VARCHAR(50) NOT NULL UNIQUE,
                             module VARCHAR(50) NOT NULL,
                             description VARCHAR(255),
                             created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                             updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                             created_by VARCHAR(36),
                             updated_by VARCHAR(36),
                             is_deleted BOOLEAN DEFAULT FALSE
);

CREATE TABLE role_permissions (
                                  id BIGINT AUTO_INCREMENT PRIMARY KEY,
                                  role_id INT NOT NULL,
                                  permission_id INT NOT NULL,
                                  granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                  granted_by VARCHAR(36),
                                  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
                                  FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE,
                                  UNIQUE KEY uk_role_permission (role_id, permission_id)
);