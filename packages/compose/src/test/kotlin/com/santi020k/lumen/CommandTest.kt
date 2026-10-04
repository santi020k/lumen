package com.santi020k.lumen

import org.junit.Assert.*
import org.junit.Test

class CommandTest {
    private val groups = listOf(LumenCommandGroup("navigation", "Navigation", listOf(
        LumenCommandItem("docs", "Documentation", "Read guides", listOf("manual"), "Ctrl+D"),
        LumenCommandItem("blocked", "Disabled", disabled = true), LumenCommandItem("theme", "Toggle theme")
    )))
    @Test fun filteringAndSafeNavigation() {
        listOf(" DOCUMENT ", "guides", "manual", "ctrl+d").forEach { assertEquals(listOf("docs"), lumenCommandGroups(groups, it)?.first()?.items?.map { item -> item.id }) }
        assertEquals("docs", moveLumenCommandActive(groups, "", null, LumenCommandNavigation.Next))
        assertEquals("theme", moveLumenCommandActive(groups, "", "docs", LumenCommandNavigation.Next))
        assertEquals("docs", moveLumenCommandActive(groups, "", "theme", LumenCommandNavigation.Next))
        assertEquals("theme", moveLumenCommandActive(groups, "", "docs", LumenCommandNavigation.Previous))
        assertEquals("theme", moveLumenCommandActive(groups, "", "docs", LumenCommandNavigation.Last))
        assertEquals("docs", moveLumenCommandActive(groups, "", "theme", LumenCommandNavigation.First))
        assertNull(resolveLumenCommandActive(groups, "theme", "docs"))
        assertNull(resolveLumenCommandActive(groups, "", "blocked"))
        assertNull(moveLumenCommandActive(groups, "Disabled", null, LumenCommandNavigation.Next))
    }
    @Test fun identityAndLiteralQueryValidation() {
        assertNull(lumenCommandGroups(groups + groups, "missing"))
        assertFalse(isLumenCommandGroupsValid(listOf(LumenCommandGroup(" ", "Blank", emptyList()))))
        assertFalse(isLumenCommandGroupsValid(listOf(LumenCommandGroup("a", "A", listOf(LumenCommandItem("x", "X"), LumenCommandItem("x", "Duplicate"))))))
        assertTrue(requireNotNull(lumenCommandGroups(groups, "(".repeat(100000))).isEmpty())
        assertTrue(requireNotNull(lumenCommandGroups(emptyList(), "")).isEmpty())
    }
}
