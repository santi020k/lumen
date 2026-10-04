package com.santi020k.lumen

import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.sizeIn
import androidx.compose.foundation.rememberScrollState
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.Immutable
import androidx.compose.runtime.key
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.selected
import androidx.compose.ui.semantics.stateDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.dp

@Immutable
data class LumenBreadcrumbItem(val id: String, val label: String, val enabled: Boolean = true)

@Composable
fun LumenBreadcrumb(
    label: String,
    items: List<LumenBreadcrumbItem>,
    onNavigate: (String) -> Unit,
    modifier: Modifier = Modifier,
    currentLabel: String = "Current",
    enabled: Boolean = true
) {
    val colors = LocalLumenTheme.current.colors
    Row(modifier.horizontalScroll(rememberScrollState()).semantics { contentDescription = label },
        horizontalArrangement = Arrangement.spacedBy(LumenSpacing.Xs), verticalAlignment = Alignment.CenterVertically) {
        items.forEachIndexed { index, item ->
            key(item.id) {
                if (index > 0) Text("/", modifier = Modifier.clearAndSetSemantics {}, color = colors.inkMuted)
                if (index == items.lastIndex) {
                    Text(item.label, color = colors.ink, modifier = Modifier.semantics {
                        selected = true
                        stateDescription = currentLabel
                    })
                } else {
                    Box(Modifier.sizeIn(minWidth = 44.dp, minHeight = 44.dp)
                        .clickable(enabled = enabled && item.enabled, role = Role.Button) {
                            if (enabled && item.enabled) onNavigate(item.id)
                        }.padding(horizontal = LumenSpacing.Sm), contentAlignment = Alignment.Center) {
                        Text(item.label, color = colors.brandSolid)
                    }
                }
            }
        }
    }
}
