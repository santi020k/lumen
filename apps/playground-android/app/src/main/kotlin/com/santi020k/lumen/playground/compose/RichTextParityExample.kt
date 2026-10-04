package com.santi020k.lumen.playground.compose

import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.text.TextRange
import com.santi020k.lumen.LumenRichTextDocument
import com.santi020k.lumen.LumenRichTextEditor

@Composable
fun RichTextParityExample() {
    var document by remember { mutableStateOf(LumenRichTextDocument("Select words to format")) }
    var selection by remember { mutableStateOf(TextRange(0, 6)) }
    LumenRichTextEditor(label = "Notes", document = document, selection = selection,
        onDocumentChange = { document = it }, onSelectionChange = { selection = it })
}
