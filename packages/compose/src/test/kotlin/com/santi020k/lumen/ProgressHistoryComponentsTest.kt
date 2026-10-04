package com.santi020k.lumen

import org.junit.Assert.assertEquals
import org.junit.Test

class ProgressHistoryComponentsTest {
    @Test fun stepProgressSupportsBoundariesAndCompletedWorkflows() {
        assertEquals(LumenStepState.Current, resolveLumenStepState(0, -1, 3))
        assertEquals(LumenStepState.Current, resolveLumenStepState(1, 1, 3))
        assertEquals(LumenStepState.Complete, resolveLumenStepState(2, 99, 3))
        assertEquals(LumenStepState.Upcoming, resolveLumenStepState(2, 1, 3))
    }
}
