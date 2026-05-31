CREATE DATABASE IF NOT EXISTS biointel_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE biointel_db;

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    date_of_birth DATE NOT NULL,
    gender ENUM('MALE', 'FEMALE', 'OTHER') NOT NULL,
    phone_number VARCHAR(20) NULL,
    is_active TINYINT(1) DEFAULT 1 NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
    INDEX idx_users_email (email),
    INDEX idx_users_active (is_active)
) ENGINE=InnoDB;

-- 2. ADMINS TABLE
CREATE TABLE IF NOT EXISTS admins (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL UNIQUE,
    role ENUM('SUPERADMIN', 'ANALYST', 'SUPPORT') NOT NULL DEFAULT 'ANALYST',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 3. REPORTS TABLE
CREATE TABLE IF NOT EXISTS reports (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(512) NOT NULL,
    file_type VARCHAR(100) NOT NULL,
    file_size INT UNSIGNED NOT NULL,
    upload_status ENUM('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED') NOT NULL DEFAULT 'PENDING',
    ocr_raw_text LONGTEXT NULL,
    ai_summary TEXT NULL,
    health_score INT DEFAULT NULL,
    status_message VARCHAR(255) NULL,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_reports_user (user_id),
    INDEX idx_reports_status (upload_status)
) ENGINE=InnoDB;

-- 4. REPORT PARAMETERS TABLE
CREATE TABLE IF NOT EXISTS report_parameters (
    id VARCHAR(36) PRIMARY KEY,
    report_id VARCHAR(36) NOT NULL,
    parameter_name ENUM(
        'HEMOGLOBIN', 'RBC', 'WBC', 'PLATELETS', 
        'HBA1C', 'BLOOD_SUGAR', 
        'TSH', 'T3', 'T4', 
        'HDL', 'LDL', 'TRIGLYCERIDES', 'CHOLESTEROL', 
        'CREATININE', 'URIC_ACID', 
        'SGOT', 'SGPT'
    ) NOT NULL,
    parameter_value DECIMAL(10, 3) NOT NULL,
    reference_range_min DECIMAL(10, 3) NOT NULL,
    reference_range_max DECIMAL(10, 3) NOT NULL,
    unit VARCHAR(20) NOT NULL,
    status ENUM('NORMAL', 'LOW', 'HIGH', 'CRITICAL') NOT NULL,
    ai_interpretation TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE CASCADE,
    UNIQUE KEY uq_report_parameter (report_id, parameter_name),
    INDEX idx_params_name (parameter_name),
    INDEX idx_params_status (status)
) ENGINE=InnoDB;

-- 5. HEALTH SCORES TABLE
CREATE TABLE IF NOT EXISTS health_scores (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    report_id VARCHAR(36) NOT NULL UNIQUE,
    score INT NOT NULL,
    grade ENUM('GOOD', 'MODERATE', 'POOR', 'EXCELLENT') NOT NULL,
    factors JSON NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE CASCADE,
    INDEX idx_scores_user (user_id)
) ENGINE=InnoDB;

-- 6. RISK PREDICTIONS TABLE
CREATE TABLE IF NOT EXISTS risk_predictions (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    report_id VARCHAR(36) NOT NULL,
    disease_name ENUM('DIABETES', 'ANEMIA', 'THYROID_DISORDERS', 'LIVER_DISEASE', 'KIDNEY_DISEASE', 'HEART_DISEASE') NOT NULL,
    risk_level ENUM('LOW', 'MEDIUM', 'HIGH') NOT NULL,
    confidence_percentage DECIMAL(5, 2) NOT NULL,
    details TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE CASCADE,
    UNIQUE KEY uq_report_disease (report_id, disease_name),
    INDEX idx_risks_user (user_id),
    INDEX idx_risks_disease (disease_name)
) ENGINE=InnoDB;

-- 7. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS notifications (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type ENUM('CRITICAL_ALERT', 'REPORT_ANALYZED', 'HEALTH_CHANGE', 'SYSTEM') NOT NULL,
    is_read TINYINT(1) DEFAULT 0 NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_notifications_user_read (user_id, is_read)
) ENGINE=InnoDB;

-- 8. AI CONVERSATIONS TABLE
CREATE TABLE IF NOT EXISTS ai_conversations (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    title VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_conversations_user (user_id)
) ENGINE=InnoDB;

-- 9. AI MESSAGES TABLE
CREATE TABLE IF NOT EXISTS ai_messages (
    id VARCHAR(36) PRIMARY KEY,
    conversation_id VARCHAR(36) NOT NULL,
    sender ENUM('USER', 'ASSISTANT') NOT NULL,
    message_text TEXT NOT NULL,
    source_reports JSON NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    FOREIGN KEY (conversation_id) REFERENCES ai_conversations(id) ON DELETE CASCADE,
    INDEX idx_messages_conv (conversation_id)
) ENGINE=InnoDB;

-- 10. AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS audit_logs (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NULL,
    action VARCHAR(100) NOT NULL,
    table_name VARCHAR(100) NOT NULL,
    record_id VARCHAR(36) NULL,
    ip_address VARCHAR(45) NOT NULL,
    details TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    INDEX idx_audit_user (user_id),
    INDEX idx_audit_action (action),
    INDEX idx_audit_time (created_at)
) ENGINE=InnoDB;
