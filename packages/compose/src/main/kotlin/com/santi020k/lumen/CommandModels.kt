package com.santi020k.lumen

import java.util.Locale

data class LumenCommandItem(val id: String, val label: String, val detail: String? = null, val keywords: List<String> = emptyList(), val shortcut: String? = null, val disabled: Boolean = false)
data class LumenCommandGroup(val id: String, val label: String, val items: List<LumenCommandItem>)
enum class LumenCommandNavigation { Next, Previous, First, Last }
fun isLumenCommandGroupsValid(groups: List<LumenCommandGroup>): Boolean {
    val groupIds = mutableSetOf<String>(); val itemIds = mutableSetOf<String>()
    for (group in groups) {
        if (group.id.isBlank() || !groupIds.add(group.id)) return false
        for (item in group.items) if (item.id.isBlank() || !itemIds.add(item.id)) return false
    }
    return true
}
fun lumenCommandGroups(groups: List<LumenCommandGroup>, query: String): List<LumenCommandGroup>? {
    if (!isLumenCommandGroupsValid(groups)) return null
    val search = query.trim().lowercase(Locale.ROOT)
    return groups.mapNotNull { group ->
        val items = group.items.filter { item ->
            (listOf(item.label.ifEmpty { item.id }, item.detail ?: "", item.shortcut ?: "") + item.keywords).any { it.lowercase(Locale.ROOT).contains(search) }
        }
        if (items.isEmpty()) null else group.copy(items = items)
    }
}
fun resolveLumenCommandActive(groups: List<LumenCommandGroup>, query: String, activeId: String?): LumenCommandItem? =
    lumenCommandGroups(groups, query)?.flatMap { it.items }?.firstOrNull { it.id == activeId && !it.disabled }
fun moveLumenCommandActive(groups: List<LumenCommandGroup>, query: String, activeId: String?, direction: LumenCommandNavigation): String? {
    val items = lumenCommandGroups(groups, query)?.flatMap { it.items }?.filter { !it.disabled } ?: emptyList()
    if (items.isEmpty()) return null
    if (direction == LumenCommandNavigation.First) return items.first().id
    if (direction == LumenCommandNavigation.Last) return items.last().id
    val index = items.indexOfFirst { it.id == activeId }
    if (index < 0) return if (direction == LumenCommandNavigation.Next) items.first().id else items.last().id
    val delta = if (direction == LumenCommandNavigation.Next) 1 else -1
    return items[(index + delta + items.size) % items.size].id
}
