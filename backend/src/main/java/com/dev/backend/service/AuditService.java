package com.dev.backend.service;

import com.dev.backend.model.AuditEvent;
import com.dev.backend.repository.AuditEventRepository;
import com.dev.backend.web.RequestCorrelation;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.MDC;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

@Service
public class AuditService {

    private final AuditEventRepository auditEventRepository;
    private final ObjectMapper objectMapper;

    public AuditService(AuditEventRepository auditEventRepository, ObjectMapper objectMapper) {
        this.auditEventRepository = auditEventRepository;
        this.objectMapper = objectMapper;
    }

    public void record(Long userId, String type, String entityType, Long entityId, Object payload) {
        AuditEvent event = new AuditEvent();
        event.setUserId(userId);
        event.setEventType(type);
        event.setEntityType(entityType);
        event.setEntityId(entityId);
        event.setPayload(toJson(payload));
        event.setCorrelationId(MDC.get(RequestCorrelation.MDC_KEY));
        auditEventRepository.save(event);
    }

    public Page<AuditEvent> listForUser(Long userId, int page, int size) {
        PageRequest pageRequest = PageRequest.of(
                page,
                size,
                Sort.by(Sort.Direction.DESC, "createdAt").and(Sort.by(Sort.Direction.DESC, "id"))
        );
        return auditEventRepository.findAllByUserId(userId, pageRequest);
    }

    private String toJson(Object payload) {
        if (payload == null) {
            return null;
        }
        try {
            return objectMapper.writeValueAsString(payload);
        } catch (JsonProcessingException e) {
            return "{\"error\":\"payload_serialization_failed\"}";
        }
    }
}
