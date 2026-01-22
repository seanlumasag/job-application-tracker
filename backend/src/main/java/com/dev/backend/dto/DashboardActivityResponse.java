package com.dev.backend.dto;

import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class DashboardActivityResponse {
    private int days;
    private List<DashboardActivityPoint> items;
}
