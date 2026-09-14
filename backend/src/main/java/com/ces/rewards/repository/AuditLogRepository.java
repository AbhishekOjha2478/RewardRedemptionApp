package com.ces.rewards.repository;

import com.ces.rewards.entity.AuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.repository.Repository;

public interface AuditLogRepository extends Repository<AuditLog, Long> {

    AuditLog save(AuditLog auditLog);

    Page<AuditLog> findAllByOrderByCreatedAtDesc(Pageable pageable);

    Page<AuditLog> findByActionOrderByCreatedAtDesc(String action, Pageable pageable);

    Page<AuditLog> findByActorUsernameOrderByCreatedAtDesc(String actorUsername, Pageable pageable);
}
