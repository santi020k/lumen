package com.santi020k.lumen

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.Immutable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.selected
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import com.google.i18n.phonenumbers.NumberParseException
import com.google.i18n.phonenumbers.PhoneNumberUtil
import java.util.Locale
import kotlin.RequiresOptIn

private const val REGIONAL_INDICATOR_A = 0x1F1E6

@RequiresOptIn(
    level = RequiresOptIn.Level.WARNING,
    message = "LumenPhoneInput is experimental while its native cross-adapter contract is evaluated."
)
@Retention(AnnotationRetention.BINARY)
annotation class ExperimentalLumenPhoneApi

/** Localized metadata for one ISO region in the phone-country picker. */
@Immutable
@ExperimentalLumenPhoneApi
data class LumenPhoneCountry(
    val regionCode: String,
    val callingCode: String,
    val displayName: String
) {
    init {
        require(regionCode.length == 2 && regionCode.all { it in 'A'..'Z' }) {
            "regionCode must be an uppercase ISO 3166-1 alpha-2 code."
        }
        val hasValidCallingCode = callingCode.length >= 2 &&
            callingCode.first() == '+' &&
            callingCode.drop(1).all(Char::isDigit)
        require(hasValidCallingCode) {
            "callingCode must start with + and contain only digits after it."
        }
        require(displayName.isNotBlank()) { "displayName must not be blank." }
    }

    val flag: String
        get() = regionCode.uppercase(Locale.ROOT).map { character ->
            String(Character.toChars(REGIONAL_INDICATOR_A + (character - 'A')))
        }.joinToString("")

    val pickerLabel: String
        get() = "$flag $displayName ($callingCode)"
}

/** Controlled phone input state. [e164] is present only when [isValid] is true. */
@Immutable
@ExperimentalLumenPhoneApi
data class LumenPhoneNumber(
    val country: LumenPhoneCountry,
    val nationalNumber: String,
    val e164: String?,
    val isValid: Boolean
) {
    companion object {
        fun empty(country: LumenPhoneCountry): LumenPhoneNumber = LumenPhoneNumber(
            country = country,
            nationalNumber = "",
            e164 = null,
            isValid = false
        )
    }
}

/** Generates phone countries from the libphonenumber metadata bundled with Lumen Compose. */
@ExperimentalLumenPhoneApi
object LumenPhoneCountries {
    fun all(locale: Locale = Locale.getDefault()): List<LumenPhoneCountry> =
        PhoneNumberUtil.getInstance().supportedRegions
            .mapNotNull { regionCode -> forRegion(regionCode, locale) }
            .sortedWith(compareBy(String.CASE_INSENSITIVE_ORDER) { it.displayName })

    fun forRegion(
        regionCode: String,
        locale: Locale = Locale.getDefault()
    ): LumenPhoneCountry? {
        val normalizedRegion = regionCode.uppercase(Locale.ROOT)
        val phoneNumberUtil = PhoneNumberUtil.getInstance()
        if (normalizedRegion !in phoneNumberUtil.supportedRegions) return null

        val regionLocale = Locale.Builder().setRegion(normalizedRegion).build()
        val displayName = regionLocale.getDisplayCountry(locale).ifBlank { normalizedRegion }
        return LumenPhoneCountry(
            regionCode = normalizedRegion,
            callingCode = "+${phoneNumberUtil.getCountryCodeForRegion(normalizedRegion)}",
            displayName = displayName
        )
    }
}

/** Formats and validates [input] for [country], returning E.164 only when valid. */
@ExperimentalLumenPhoneApi
fun resolveLumenPhoneNumber(
    country: LumenPhoneCountry,
    input: String,
    locale: Locale = Locale.getDefault()
): LumenPhoneNumber {
    val phoneNumberUtil = PhoneNumberUtil.getInstance()
    val formattedInput = formatLumenPhoneInput(country, input, phoneNumberUtil)
    if (formattedInput.isBlank()) return LumenPhoneNumber.empty(country)

    return try {
        val parsed = phoneNumberUtil.parse(formattedInput, country.regionCode)
        val parsedRegion = phoneNumberUtil.getRegionCodeForNumber(parsed)
        val resolvedCountry = if (formattedInput.startsWith('+') && parsedRegion != null) {
            LumenPhoneCountries.forRegion(parsedRegion, locale) ?: country
        } else {
            country
        }
        val isValid = phoneNumberUtil.isValidNumber(parsed)
        LumenPhoneNumber(
            country = resolvedCountry,
            nationalNumber = if (formattedInput.startsWith('+') && isValid) {
                phoneNumberUtil.format(parsed, PhoneNumberUtil.PhoneNumberFormat.NATIONAL)
            } else {
                formattedInput
            },
            e164 = if (isValid) {
                phoneNumberUtil.format(parsed, PhoneNumberUtil.PhoneNumberFormat.E164)
            } else {
                null
            },
            isValid = isValid
        )
    } catch (_: NumberParseException) {
        LumenPhoneNumber(country, formattedInput, e164 = null, isValid = false)
    }
}

@OptIn(ExperimentalLumenPhoneApi::class)
private fun formatLumenPhoneInput(
    country: LumenPhoneCountry,
    input: String,
    phoneNumberUtil: PhoneNumberUtil
): String {
    val normalized = buildString {
        input.trim().forEachIndexed { index, character ->
            if (character.isDigit() || (character == '+' && index == 0)) append(character)
        }
    }
    if (normalized.isBlank() || normalized == "+") return normalized

    val formatter = phoneNumberUtil.getAsYouTypeFormatter(country.regionCode)
    return normalized.fold("") { _, character -> formatter.inputDigit(character) }
}

/**
 * Presents a controlled phone editor with a searchable country sheet and metadata-backed
 * formatting and validation.
 */
@ExperimentalLumenPhoneApi
@Composable
fun LumenPhoneInput(
    value: LumenPhoneNumber,
    onValueChange: (LumenPhoneNumber) -> Unit,
    label: String,
    modifier: Modifier = Modifier,
    countries: List<LumenPhoneCountry>? = null,
    locale: Locale = Locale.getDefault(),
    description: String? = null,
    errorMessage: String? = null,
    showValidationError: Boolean = true,
    invalidNumberMessage: String = "Enter a complete phone number.",
    numberLabel: String = "Phone number",
    countrySelectorLabel: String = "Country code",
    countryPickerTitle: String = "Select country",
    countrySearchLabel: String = "Search countries",
    required: Boolean = false,
    enabled: Boolean = true
) {
    val colors = LocalLumenTheme.current.colors
    var pickerVisible by rememberSaveable { mutableStateOf(false) }
    var countryQuery by rememberSaveable { mutableStateOf("") }
    val availableCountries = countries ?: remember(locale) { LumenPhoneCountries.all(locale) }
    val effectiveError = errorMessage ?: invalidNumberMessage.takeIf {
        showValidationError &&
        value.nationalNumber.isNotBlank() && !value.isValid
    }
    val filteredCountries = remember(availableCountries, countryQuery) {
        val query = countryQuery.trim()
        if (query.isBlank()) {
            availableCountries
        } else {
            availableCountries.filter { country ->
                country.displayName.contains(query, ignoreCase = true) ||
                    country.regionCode.contains(query, ignoreCase = true) ||
                    country.callingCode.contains(query)
            }
        }
    }

    LumenFieldGroup(
        label = label,
        modifier = modifier,
        description = description,
        errorMessage = effectiveError,
        required = required
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(LumenSpacing.Sm),
            verticalAlignment = Alignment.CenterVertically
        ) {
            LumenButton(
                onClick = { pickerVisible = true },
                modifier = Modifier
                    .widthIn(min = 112.dp)
                    .semantics {
                        contentDescription = "$countrySelectorLabel, ${value.country.displayName}, " +
                            value.country.callingCode
                    },
                intent = LumenButtonIntent.Secondary,
                enabled = enabled && availableCountries.isNotEmpty()
            ) {
                Text("${value.country.flag} ${value.country.callingCode}")
            }
            OutlinedTextField(
                value = value.nationalNumber,
                onValueChange = { input ->
                    onValueChange(resolveLumenPhoneNumber(value.country, input, locale))
                },
                modifier = Modifier.weight(1f),
                enabled = enabled,
                isError = effectiveError != null,
                singleLine = true,
                label = { Text(numberLabel) },
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Phone),
                shape = RoundedCornerShape(LumenRadius.Sm),
                colors = OutlinedTextFieldDefaults.colors(
                    focusedContainerColor = colors.surface,
                    unfocusedContainerColor = colors.surface,
                    disabledContainerColor = colors.surface,
                    focusedTextColor = colors.ink,
                    unfocusedTextColor = colors.ink,
                    focusedBorderColor = colors.brand,
                    unfocusedBorderColor = colors.line,
                    errorBorderColor = colors.danger,
                    cursorColor = colors.brand
                )
            )
        }
    }

    LumenSheet(
        visible = pickerVisible,
        onDismiss = {
            pickerVisible = false
            countryQuery = ""
        },
        title = countryPickerTitle
    ) {
        Column(verticalArrangement = Arrangement.spacedBy(LumenSpacing.Md)) {
            LumenSearchField(
                value = countryQuery,
                onValueChange = { countryQuery = it },
                prompt = countrySearchLabel
            )
            LazyColumn(modifier = Modifier.fillMaxWidth().heightIn(max = 440.dp)) {
                items(filteredCountries, key = LumenPhoneCountry::regionCode) { country ->
                    val isSelected = country.regionCode == value.country.regionCode
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable(
                                enabled = enabled,
                                role = Role.RadioButton,
                                onClick = {
                                    onValueChange(
                                        resolveLumenPhoneNumber(
                                            country,
                                            value.nationalNumber,
                                            locale
                                        )
                                    )
                                    pickerVisible = false
                                    countryQuery = ""
                                }
                            )
                            .heightIn(min = 48.dp)
                            .padding(horizontal = LumenSpacing.Sm)
                            .semantics { selected = isSelected },
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(country.pickerLabel, style = MaterialTheme.typography.bodyLarge)
                        if (isSelected) {
                            LumenIcon(
                                name = LumenIconName.Check,
                                contentDescription = null,
                                tint = colors.brand
                            )
                        }
                    }
                }
            }
        }
    }
}
