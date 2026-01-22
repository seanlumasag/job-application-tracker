package com.dev.backend.model;

import java.util.EnumSet;
import java.util.Map;
import java.util.Set;

public enum Stage {
    SAVED,
    APPLIED,
    INTERVIEW,
    OFFER,
    REJECTED,
    WITHDRAWN;

    private static final Map<Stage, Set<Stage>> ALLOWED_TRANSITIONS = Map.of(
            SAVED, EnumSet.of(APPLIED, WITHDRAWN),
            APPLIED, EnumSet.of(INTERVIEW, OFFER, REJECTED, WITHDRAWN),
            INTERVIEW, EnumSet.of(OFFER, REJECTED, WITHDRAWN),
            OFFER, EnumSet.of(REJECTED, WITHDRAWN),
            REJECTED, EnumSet.noneOf(Stage.class),
            WITHDRAWN, EnumSet.noneOf(Stage.class)
    );

    public boolean canTransitionTo(Stage next) {
        if (next == null) {
            return false;
        }
        return ALLOWED_TRANSITIONS.getOrDefault(this, EnumSet.noneOf(Stage.class)).contains(next);
    }

    public boolean isTerminal() {
        return this == REJECTED || this == WITHDRAWN;
    }
}
