CREATE TABLE ces_users (
    id            BIGINT       NOT NULL AUTO_INCREMENT,
    username      VARCHAR(50)  NOT NULL,
    password_hash VARCHAR(100) NOT NULL,
    full_name     VARCHAR(100) NOT NULL,
    email         VARCHAR(120) NOT NULL,
    role          VARCHAR(20)  NOT NULL,
    active        BIT(1)       NOT NULL DEFAULT b'1',
    created_at    DATETIME(6)  NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_ces_users_username UNIQUE (username)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE refresh_tokens (
    id          BIGINT       NOT NULL AUTO_INCREMENT,
    ces_user_id BIGINT       NOT NULL,
    token_hash  VARCHAR(120) NOT NULL,
    expires_at  DATETIME(6)  NOT NULL,
    revoked     BIT(1)       NOT NULL DEFAULT b'0',
    created_at  DATETIME(6)  NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_refresh_token_hash UNIQUE (token_hash),
    KEY idx_refresh_user (ces_user_id),
    CONSTRAINT fk_refresh_user FOREIGN KEY (ces_user_id) REFERENCES ces_users (id) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE audit_logs (
    id             BIGINT       NOT NULL AUTO_INCREMENT,
    actor_username VARCHAR(50)  NOT NULL,
    action         VARCHAR(60)  NOT NULL,
    entity_type    VARCHAR(40),
    entity_id      VARCHAR(40),
    details        VARCHAR(500),
    outcome        VARCHAR(20)  NOT NULL,
    created_at     DATETIME(6)  NOT NULL,
    PRIMARY KEY (id),
    KEY idx_audit_created (created_at),
    KEY idx_audit_action (action)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE customers (
    id               BIGINT       NOT NULL AUTO_INCREMENT,
    first_name       VARCHAR(60)  NOT NULL,
    last_name        VARCHAR(60)  NOT NULL,
    email            VARCHAR(120) NOT NULL,
    phone            VARCHAR(10),
    associated_since DATE         NOT NULL,
    reward_points    BIGINT       NOT NULL DEFAULT 0,
    deleted          BIT(1)       NOT NULL DEFAULT b'0',
    deleted_at       DATETIME(6),
    created_at       DATETIME(6)  NOT NULL,
    version          BIGINT,
    PRIMARY KEY (id),
    CONSTRAINT uk_customers_email UNIQUE (email),
    CONSTRAINT ck_customers_reward_points CHECK (reward_points >= 0),
    KEY idx_customer_name (first_name, last_name),
    KEY idx_customer_deleted (deleted)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE credit_cards (
    id          BIGINT      NOT NULL AUTO_INCREMENT,
    customer_id BIGINT      NOT NULL,
    card_number VARCHAR(16) NOT NULL,
    card_type   VARCHAR(40),
    issued_on   DATE        NOT NULL,
    expires_on  DATE        NOT NULL,
    active      BIT(1)      NOT NULL DEFAULT b'1',
    created_at  DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_card_number UNIQUE (card_number),
    KEY idx_credit_card_customer (customer_id),
    CONSTRAINT fk_card_customer FOREIGN KEY (customer_id) REFERENCES customers (id) ON DELETE RESTRICT
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE transactions (
    id                    BIGINT        NOT NULL AUTO_INCREMENT,
    credit_card_id        BIGINT        NOT NULL,
    amount                DECIMAL(12, 2) NOT NULL,
    transaction_date      DATETIME(6)   NOT NULL,
    merchant              VARCHAR(120),
    category              VARCHAR(40),
    processed             BIT(1)        NOT NULL DEFAULT b'0',
    processed_at          DATETIME(6),
    points_awarded        BIGINT        NOT NULL DEFAULT 0,
    applied_customer_type VARCHAR(20),
    PRIMARY KEY (id),
    KEY idx_txn_card (credit_card_id),
    KEY idx_txn_processed (processed),
    CONSTRAINT fk_txn_card FOREIGN KEY (credit_card_id) REFERENCES credit_cards (id) ON DELETE RESTRICT
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE reward_categories (
    id            BIGINT      NOT NULL AUTO_INCREMENT,
    name          VARCHAR(80) NOT NULL,
    description   VARCHAR(255),
    display_order INT         NOT NULL DEFAULT 0,
    active        BIT(1)      NOT NULL DEFAULT b'1',
    PRIMARY KEY (id),
    CONSTRAINT uk_reward_categories_name UNIQUE (name)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE reward_items (
    id          BIGINT       NOT NULL AUTO_INCREMENT,
    category_id BIGINT       NOT NULL,
    name        VARCHAR(120) NOT NULL,
    description VARCHAR(500),
    points_cost INT          NOT NULL,
    image_url   VARCHAR(300),
    active      BIT(1)       NOT NULL DEFAULT b'1',
    PRIMARY KEY (id),
    KEY idx_item_category (category_id),
    CONSTRAINT fk_item_category FOREIGN KEY (category_id) REFERENCES reward_categories (id) ON DELETE RESTRICT
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE cart_items (
    id             BIGINT      NOT NULL AUTO_INCREMENT,
    customer_id    BIGINT      NOT NULL,
    reward_item_id BIGINT      NOT NULL,
    quantity       INT         NOT NULL DEFAULT 1,
    added_at       DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_cart_customer_item UNIQUE (customer_id, reward_item_id),
    KEY idx_cart_reward_item (reward_item_id),
    CONSTRAINT fk_cart_customer FOREIGN KEY (customer_id) REFERENCES customers (id) ON DELETE CASCADE,
    CONSTRAINT fk_cart_item FOREIGN KEY (reward_item_id) REFERENCES reward_items (id) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE redemptions (
    id             BIGINT      NOT NULL AUTO_INCREMENT,
    customer_id    BIGINT      NOT NULL,
    redeemed_by_id BIGINT,
    reference      VARCHAR(40) NOT NULL,
    total_points   BIGINT      NOT NULL,
    balance_after  BIGINT      NOT NULL,
    redeemed_at    DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_redemption_reference UNIQUE (reference),
    KEY idx_redemption_customer (customer_id),
    KEY idx_redemption_redeemed_by (redeemed_by_id),
    CONSTRAINT fk_redemption_customer FOREIGN KEY (customer_id) REFERENCES customers (id) ON DELETE RESTRICT,
    CONSTRAINT fk_redemption_user FOREIGN KEY (redeemed_by_id) REFERENCES ces_users (id) ON DELETE SET NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE redemption_items (
    id              BIGINT       NOT NULL AUTO_INCREMENT,
    redemption_id   BIGINT       NOT NULL,
    reward_item_id  BIGINT,
    item_name       VARCHAR(120) NOT NULL,
    category_name   VARCHAR(80),
    quantity        INT          NOT NULL,
    points_cost_each INT         NOT NULL,
    line_total      BIGINT       NOT NULL,
    PRIMARY KEY (id),
    KEY idx_redemption_item_redemption (redemption_id),
    KEY idx_redemption_item_reward_item (reward_item_id),
    CONSTRAINT fk_redemption_item_redemption FOREIGN KEY (redemption_id) REFERENCES redemptions (id) ON DELETE CASCADE,
    CONSTRAINT fk_redemption_item_reward FOREIGN KEY (reward_item_id) REFERENCES reward_items (id) ON DELETE SET NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
