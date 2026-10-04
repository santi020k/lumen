package com.santi020k.lumen

/** Proleptic Gregorian civil day. No timezone or instant arithmetic. */
data class LumenCalendarDay(val year: Int, val month: Int, val day: Int) : Comparable<LumenCalendarDay> {
    init { require(year in 1..9999 && month in 1..12 && day in 1..daysInMonth(year, month)) }
    val key: String get() = "%04d-%02d-%02d".format(java.util.Locale.ROOT, year, month, day)
    val ordinal: Int get() {
        val y = year - 1
        return 365 * y + y / 4 - y / 100 + y / 400 + (1 until month).sumOf { daysInMonth(year, it) } + day - 1
    }
    val monthStart: LumenCalendarDay get() = copy(day = 1)
    override fun compareTo(other: LumenCalendarDay): Int = ordinal.compareTo(other.ordinal)
    fun addingDays(amount: Int): LumenCalendarDay? {
        val target = ordinal.toLong() + amount
        if (target !in 0L..3652058L) return null
        var low = 1; var high = 9999
        while (low < high) {
            val middle = (low + high + 1) / 2; val y = middle - 1
            if (365 * y + y / 4 - y / 100 + y / 400 <= target) low = middle else high = middle - 1
        }
        val y = low - 1
        var remaining = target.toInt() - (365 * y + y / 4 - y / 100 + y / 400)
        var month = 1
        while (remaining >= daysInMonth(low, month)) { remaining -= daysInMonth(low, month); month++ }
        return LumenCalendarDay(low, month, remaining + 1)
    }
    fun addingMonths(amount: Int): LumenCalendarDay? {
        val index = (year - 1L) * 12 + month - 1 + amount
        if (index !in 0L until 9999L * 12) return null
        val y = (index / 12).toInt() + 1; val m = (index % 12).toInt() + 1
        return LumenCalendarDay(y, m, minOf(day, daysInMonth(y, m)))
    }
    fun grid(firstWeekday: Int = 1): List<LumenCalendarDay?> {
        if (firstWeekday !in 0..6) return emptyList()
        val first = monthStart; val offset = ((first.ordinal + 1) % 7 - firstWeekday + 7) % 7
        return (0 until 42).map { first.addingDays(it - offset) }
    }
    fun isSelectable(min: LumenCalendarDay? = null, max: LumenCalendarDay? = null): Boolean =
        !(min != null && max != null && min > max) && (min == null || this >= min) && (max == null || this <= max)
    companion object {
        fun daysInMonth(year: Int, month: Int): Int = if (month == 2) {
            if (year % 4 == 0 && (year % 100 != 0 || year % 400 == 0)) 29 else 28
        } else if (month in listOf(4, 6, 9, 11)) 30 else 31
        fun parse(key: String): LumenCalendarDay? {
            if (key.length != 10 || !key.matches(Regex("[0-9]{4}-[0-9]{2}-[0-9]{2}"))) return null
            val year = key.substring(0, 4).toInt(); val month = key.substring(5, 7).toInt(); val day = key.substring(8, 10).toInt()
            return if (year in 1..9999 && month in 1..12 && day in 1..daysInMonth(year, month)) LumenCalendarDay(year, month, day) else null
        }
    }
}
data class LumenCalendarEvent(val id: String, val label: String, val startDay: LumenCalendarDay,
    val endDay: LumenCalendarDay = startDay, val detail: String? = null, val disabled: Boolean = false) {
    fun contains(day: LumenCalendarDay): Boolean = id.isNotEmpty() && day.isSelectable(startDay, endDay)
}
