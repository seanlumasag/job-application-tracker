package com.dev.backend.web;

public final class RequestCorrelation {
    public static final String MDC_KEY = "correlationId";
    public static final String HEADER = "X-Request-Id";

    private RequestCorrelation() {
    }
}
