package com.santi020k.lumen

import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.autofill.ContentType
import androidx.compose.ui.focus.onFocusChanged
import androidx.compose.ui.semantics.contentType
import androidx.compose.ui.semantics.error
import androidx.compose.ui.semantics.password
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.unit.sp

/** Password entry with platform autofill hints; visibility is transient and never saved. */
@Composable
fun LumenPasswordField(
    label: String,
    value: String,
    onValueChange: (String) -> Unit,
    modifier: Modifier = Modifier,
    description: String? = null,
    errorMessage: String? = null,
    showLabel: String = "Show password",
    hideLabel: String = "Hide password",
    newPassword: Boolean = false,
    onSubmit: (() -> Unit)? = null,
    enabled: Boolean = true,
    readOnly: Boolean = false
) {
    var revealed by remember { mutableStateOf(false) }
    val editable = enabled && !readOnly
    LaunchedEffect(editable) { if (!editable) revealed = false }
    val colors = LocalLumenTheme.current.colors
    OutlinedTextField(
        value = value,
        onValueChange = { if (editable) onValueChange(it) },
        modifier = modifier.onFocusChanged { if (!it.isFocused) revealed = false }.semantics {
            contentType = if (newPassword) ContentType.NewPassword else ContentType.Password
            password()
            if (errorMessage != null) error(errorMessage)
        },
        label = { Text(label) },
        supportingText = { (errorMessage ?: description)?.let { Text(it) } },
        singleLine = true,
        enabled = enabled,
        readOnly = readOnly,
        isError = errorMessage != null,
        visualTransformation = if (revealed && editable) VisualTransformation.None else PasswordVisualTransformation(),
        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password, imeAction = ImeAction.Done),
        keyboardActions = KeyboardActions(onDone = { if (editable) onSubmit?.invoke() }),
        trailingIcon = {
            LumenIconButton(
                name = if (revealed && editable) LumenIconName.EyeOff else LumenIconName.Eye,
                size = LumenControlSize.Lg,
                contentDescription = if (revealed && editable) hideLabel else showLabel,
                enabled = editable,
                onClick = { if (editable) revealed = !revealed }
            )
        },
        colors = OutlinedTextFieldDefaults.colors(
            focusedContainerColor = colors.surface, unfocusedContainerColor = colors.surface,
            focusedTextColor = colors.ink, unfocusedTextColor = colors.ink,
            focusedBorderColor = colors.brand, unfocusedBorderColor = colors.line,
            cursorColor = colors.brand, errorContainerColor = colors.surface,
            errorTextColor = colors.ink, errorLabelColor = colors.ink,
            errorSupportingTextColor = colors.ink, errorBorderColor = colors.danger
        )
    )
}

// One native input preserves selection, paste, backspace, keyboard, and autofill behavior.
internal fun normalizeLumenOtp(proposal: String, length: Int): String? {
    require(length in 1..12) { "OTP length must be between 1 and 12." }
    if (proposal.length > 128) return null
    val digits = StringBuilder(length)
    for (character in proposal) {
        val digit = Character.digit(character, 10)
        when {
            digit >= 0 -> if (digits.length < length) digits.append(digit) else return null
            character.isWhitespace() || character == '-' -> Unit
            else -> return null
        }
    }
    return digits.toString()
}

/** Controlled numeric one-time code input. Verification and submission remain application-owned. */
@Composable
fun LumenInputOTP(
    label: String,
    value: String,
    onValueChange: (String) -> Unit,
    modifier: Modifier = Modifier,
    length: Int = 6,
    description: String? = null,
    errorMessage: String? = null,
    masked: Boolean = false,
    onComplete: ((String) -> Unit)? = null,
    enabled: Boolean = true,
    readOnly: Boolean = false
) {
    require(length in 1..12) { "OTP length must be between 1 and 12." }
    require(value.length <= length && value.all { it in '0'..'9' }) { "OTP value must contain at most length ASCII digits." }
    val editable = enabled && !readOnly
    val colors = LocalLumenTheme.current.colors
    OutlinedTextField(
        value = value,
        onValueChange = { proposal ->
            if (editable) normalizeLumenOtp(proposal, length)?.let { normalized ->
                if (normalized != value) {
                    onValueChange(normalized)
                    if (normalized.length == length) onComplete?.invoke(normalized)
                }
            }
        },
        modifier = modifier.semantics {
            contentType = ContentType.SmsOtpCode
            if (masked) password()
            if (errorMessage != null) error(errorMessage)
        },
        label = { Text(label) },
        supportingText = { (errorMessage ?: description)?.let { Text(it) } },
        singleLine = true, enabled = enabled, readOnly = readOnly,
        isError = errorMessage != null,
        textStyle = MaterialTheme.typography.bodyLarge.copy(letterSpacing = 4.sp),
        visualTransformation = if (masked) PasswordVisualTransformation() else VisualTransformation.None,
        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.NumberPassword, imeAction = ImeAction.Done),
        colors = OutlinedTextFieldDefaults.colors(
            focusedContainerColor = colors.surface, unfocusedContainerColor = colors.surface,
            focusedTextColor = colors.ink, unfocusedTextColor = colors.ink,
            focusedBorderColor = colors.brand, unfocusedBorderColor = colors.line,
            cursorColor = colors.brand, errorContainerColor = colors.surface,
            errorTextColor = colors.ink, errorLabelColor = colors.ink,
            errorSupportingTextColor = colors.ink, errorBorderColor = colors.danger
        )
    )
}
