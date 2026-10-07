package com.santi020k.lumen
import org.junit.Assert.*
import org.junit.Test
class StepperParityTest {
    @Test fun controlledBoundaries() {
        fun states(current: Int) = (0..2).map { resolveLumenStepState(it, current, 3) }
        assertEquals(listOf(LumenStepState.Current, LumenStepState.Upcoming, LumenStepState.Upcoming), states(0))
        assertEquals(listOf(LumenStepState.Complete, LumenStepState.Current, LumenStepState.Upcoming), states(1))
        assertEquals(List(3) { LumenStepState.Complete }, states(3))
        assertEquals(states(3), states(Int.MAX_VALUE))
        assertEquals(states(0), states(Int.MIN_VALUE))
    }
    @Test fun stableIDs() {
        assertTrue(isLumenStepItemsValid(emptyList()))
        assertTrue(isLumenStepItemsValid(listOf(LumenStepItem("one", "Uno"), LumenStepItem("two", "Dos"))))
        assertFalse(isLumenStepItemsValid(listOf(LumenStepItem("same", "Uno"), LumenStepItem("same", "Dos"))))
        assertFalse(isLumenStepItemsValid(listOf(LumenStepItem(" \n", "Uno"))))
    }
}
