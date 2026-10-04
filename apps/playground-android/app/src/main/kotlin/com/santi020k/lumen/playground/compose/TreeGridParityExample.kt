package com.santi020k.lumen.playground.compose

import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import com.santi020k.lumen.*

@Composable
fun TreeGridParityExample() {
    var expanded by remember { mutableStateOf(setOf("packages", "unknown-host-id")) }
    var readOnly by remember { mutableStateOf(false) }
    var inspected by remember { mutableStateOf("None") }
    val records = listOf(
        LumenTreeGridRecord(LumenTreeNode("packages", "Packages"), mapOf("status" to LumenTableCell("Synthetic group"))),
        LumenTreeGridRecord(LumenTreeNode("astro", "Astro", "packages"), mapOf("status" to LumenTableCell("Ready"))),
        LumenTreeGridRecord(LumenTreeNode("react", "React", "packages"), mapOf("status" to LumenTableCell("Review pending"))),
        LumenTreeGridRecord(LumenTreeNode("locked", "Archived group", disabled = true), mapOf("status" to LumenTableCell("Locked"))),
        LumenTreeGridRecord(LumenTreeNode("archived", "Archived child", "locked"), emptyMap())
    )
    LumenCheckbox(label = "Read only cells", checked = readOnly, onCheckedChange = { readOnly = it })
    LumenTreeGrid("Synthetic project status", listOf(LumenTreeGridColumn("status", "Status")), records,
        expanded, { expanded = it }, readOnly = readOnly,
        cellContent = { record, column, cell, enabled, locked ->
            LumenButton(enabled = enabled && !locked, onClick = { inspected = record.node.label }) {
                LumenText("${column.label}: ${cell?.text ?: "Unavailable"}")
            }
        })
    LumenText("Inspected: $inspected. Host expansion IDs: ${expanded.size}")
}
