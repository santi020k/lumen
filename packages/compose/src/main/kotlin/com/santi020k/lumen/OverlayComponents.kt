package com.santi020k.lumen

import android.app.Activity
import android.content.ActivityNotFoundException
import android.content.Intent
import android.net.Uri
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.Immutable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight

/** A controlled native confirmation dialog with explicit cancel and confirm actions. */
@Composable
fun LumenAlertDialog(
    visible: Boolean,
    title: String,
    confirmLabel: String,
    onConfirm: () -> Unit,
    onDismiss: () -> Unit,
    modifier: Modifier = Modifier,
    description: String? = null,
    cancelLabel: String = "Cancel",
    destructive: Boolean = false,
    confirmEnabled: Boolean = true,
    confirmLoading: Boolean = false,
    confirmLoadingLabel: String = "Loading"
) {
    if (!visible) return

    AlertDialog(
        onDismissRequest = onDismiss,
        modifier = modifier,
        title = { Text(title, fontWeight = FontWeight.SemiBold) },
        text = description?.let { value -> { Text(value) } },
        confirmButton = {
            LumenButton(
                onClick = onConfirm,
                intent = if (destructive) LumenButtonIntent.Danger else LumenButtonIntent.Primary,
                loading = confirmLoading,
                loadingLabel = confirmLoadingLabel,
                enabled = confirmEnabled
            ) {
                Text(confirmLabel)
            }
        },
        dismissButton = {
            LumenButton(onClick = onDismiss, intent = LumenButtonIntent.Quiet) {
                Text(cancelLabel)
            }
        }
    )
}

/** A controlled Material bottom sheet with a shared heading, description, and action layout. */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun LumenSheet(
    visible: Boolean,
    onDismiss: () -> Unit,
    modifier: Modifier = Modifier,
    title: String? = null,
    description: String? = null,
    actions: @Composable () -> Unit = {},
    content: @Composable () -> Unit
) {
    if (!visible) return

    ModalBottomSheet(onDismissRequest = onDismiss, modifier = modifier) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = LumenSpacing.Xl)
                .padding(bottom = LumenSpacing.Xl),
            verticalArrangement = Arrangement.spacedBy(LumenSpacing.Lg)
        ) {
            if (title != null || description != null) {
                Column(verticalArrangement = Arrangement.spacedBy(LumenSpacing.Sm)) {
                    title?.let { Text(it, fontWeight = FontWeight.SemiBold) }
                    description?.let { Text(it, color = LocalLumenTheme.current.colors.inkSoft) }
                }
            }

            content()

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.End
            ) {
                actions()
            }
        }
    }
}

class LumenMenuItem(
    val label: String,
    val enabled: Boolean = true,
    val destructive: Boolean = false,
    val leadingIcon: ImageVector? = null,
    val onClick: () -> Unit
)

/** A controlled native anchored menu with labeled disabled and destructive action states. */
@Composable
fun LumenMenu(
    expanded: Boolean,
    onDismissRequest: () -> Unit,
    items: List<LumenMenuItem>,
    modifier: Modifier = Modifier
) {
    val colors = LocalLumenTheme.current.colors

    DropdownMenu(
        expanded = expanded,
        onDismissRequest = onDismissRequest,
        modifier = modifier
    ) {
        items.forEachIndexed { index, item ->
            DropdownMenuItem(
                text = {
                    Text(
                        item.label,
                        color = if (item.destructive) colors.danger else colors.ink
                    )
                },
                onClick = {
                    onDismissRequest()
                    item.onClick()
                },
                enabled = item.enabled,
                leadingIcon = item.leadingIcon?.let { icon ->
                    {
                        LumenIcon(
                            imageVector = icon,
                            tint = if (item.destructive) colors.danger else colors.inkSoft
                        )
                    }
                }
            )

            if (index < items.lastIndex) {
                HorizontalDivider(color = colors.line)
            }
        }
    }
}

@Immutable
data class LumenSharePayload(
    val text: String? = null,
    val uri: Uri? = null,
    val subject: String? = null,
    val mimeType: String = "text/plain"
) {
    val hasContent: Boolean
        get() = !text.isNullOrBlank() || uri != null
}

/** A Lumen button that opens Android's native share sheet for text or a content URI. */
@Composable
fun LumenShareButton(
    payload: LumenSharePayload,
    chooserTitle: String,
    modifier: Modifier = Modifier,
    label: String = "Share",
    enabled: Boolean = true,
    onFailure: (ActivityNotFoundException) -> Unit = {}
) {
    val context = LocalContext.current

    LumenButton(
        onClick = {
            val sendIntent = Intent(Intent.ACTION_SEND).apply {
                type = payload.mimeType
                payload.subject?.let { putExtra(Intent.EXTRA_SUBJECT, it) }
                payload.text?.let { putExtra(Intent.EXTRA_TEXT, it) }
                payload.uri?.let {
                    putExtra(Intent.EXTRA_STREAM, it)
                    addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
                }
            }
            val chooser = Intent.createChooser(sendIntent, chooserTitle)

            if (context !is Activity) chooser.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)

            try {
                context.startActivity(chooser)
            } catch (error: ActivityNotFoundException) {
                onFailure(error)
            }
        },
        modifier = modifier,
        intent = LumenButtonIntent.Secondary,
        enabled = enabled && payload.hasContent
    ) {
        Text(label)
    }
}
