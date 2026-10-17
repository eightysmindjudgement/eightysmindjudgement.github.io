(() => {
    const form = document.getElementById("life-countdown-form");
    const yearSelect = document.getElementById("birth-year");
    const monthSelect = document.getElementById("birth-month");
    const daySelect = document.getElementById("birth-day");
    const targetAgeInput = document.getElementById("target-age");
    const formMessage = document.getElementById("countdown-form-message");
    const resultMessage = document.getElementById("countdown-result-message");
    const currentAgeNumber = document.getElementById("current-age-number");
    const currentAgeUnit = document.getElementById("current-age-unit");
    const progressPercentageOutput = document.getElementById("progress-percentage");
    const progressBar = document.getElementById("countdown-progress-bar");
    const progressFill = document.getElementById("countdown-progress-fill");
    const daysRemainingNumber = document.getElementById("days-remaining-number");
    const yearsRemainingNumber = document.getElementById("years-remaining-number");
    const yearsRemainingUnit = document.getElementById("years-remaining-unit");
    const monthsRemainingNumber = document.getElementById("months-remaining-number");
    const monthsRemainingUnit = document.getElementById("months-remaining-unit");
    const weeksRemainingNumber = document.getElementById("weeks-remaining-number");
    const weeksRemainingUnit = document.getElementById("weeks-remaining-unit");

    const DAY_IN_MILLISECONDS = 24 * 60 * 60 * 1000;
    const numberFormatter = new Intl.NumberFormat("en-US");
    const dateFormatter = new Intl.DateTimeFormat("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        timeZone: "UTC"
    });
    const japaneseDateFormatter = new Intl.DateTimeFormat("ja-JP", {
        year: "numeric",
        month: "long",
        day: "numeric",
        timeZone: "UTC"
    });

    function datePartsToUtc(parts) {
        return Date.UTC(parts.year, parts.month - 1, parts.day);
    }

    function getTodayParts() {
        const today = new Date();
        return {
            year: today.getFullYear(),
            month: today.getMonth() + 1,
            day: today.getDate()
        };
    }

    function addYearsClamped(parts, years) {
        const year = parts.year + years;
        const lastDayOfMonth = new Date(Date.UTC(year, parts.month, 0)).getUTCDate();
        return {
            year,
            month: parts.month,
            day: Math.min(parts.day, lastDayOfMonth)
        };
    }

    function addMonthsClamped(parts, months) {
        const monthIndex = parts.year * 12 + parts.month - 1 + months;
        const year = Math.floor(monthIndex / 12);
        const month = monthIndex - year * 12 + 1;
        const lastDayOfMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
        return {
            year,
            month,
            day: Math.min(parts.day, lastDayOfMonth)
        };
    }

    function daysInMonth(year, month) {
        return new Date(Date.UTC(year, month, 0)).getUTCDate();
    }

    function calculateAge(birthDate, today) {
        let age = today.year - birthDate.year;
        if (datePartsToUtc(addYearsClamped(birthDate, age)) > datePartsToUtc(today)) {
            age -= 1;
        }
        return age;
    }

    function getCalendarTimeRemaining(today, targetDate) {
        let years = targetDate.year - today.year;
        if (datePartsToUtc(addYearsClamped(today, years)) > datePartsToUtc(targetDate)) {
            years -= 1;
        }

        const afterWholeYears = addYearsClamped(today, years);
        let months = (targetDate.year - afterWholeYears.year) * 12
            + targetDate.month - afterWholeYears.month;

        if (datePartsToUtc(addMonthsClamped(afterWholeYears, months)) > datePartsToUtc(targetDate)) {
            months -= 1;
        }

        return { years, months };
    }

    function appendOptions(select, options, placeholder) {
        select.replaceChildren(new Option(placeholder, ""));
        for (const { value, label } of options) {
            select.add(new Option(label, value));
        }
    }

    function populateYears() {
        const currentYear = getTodayParts().year;
        const options = [];
        for (let year = currentYear; year >= currentYear - 120; year -= 1) {
            options.push({ value: String(year), label: String(year) });
        }
        appendOptions(yearSelect, options, "YEAR / 年");
    }

    function updateMonthOptions() {
        const year = Number(yearSelect.value);
        const today = getTodayParts();
        monthSelect.disabled = !year;

        for (const option of monthSelect.options) {
            if (!option.value) {
                continue;
            }
            option.disabled = year === today.year && Number(option.value) > today.month;
        }

        if (year === today.year && Number(monthSelect.value) > today.month) {
            monthSelect.value = "";
        }
    }

    function updateDayOptions() {
        const year = Number(yearSelect.value);
        const month = Number(monthSelect.value);
        const selectedDay = Number(daySelect.value);
        const today = getTodayParts();

        daySelect.disabled = !year || !month;
        if (!year || !month) {
            appendOptions(daySelect, [], "DAY / 日");
            return;
        }

        let lastDay = daysInMonth(year, month);
        if (year === today.year && month === today.month) {
            lastDay = Math.min(lastDay, today.day);
        }

        const options = [];
        for (let day = 1; day <= lastDay; day += 1) {
            options.push({ value: String(day), label: String(day) });
        }
        appendOptions(daySelect, options, "DAY / 日");

        if (selectedDay >= 1 && selectedDay <= lastDay) {
            daySelect.value = String(selectedDay);
        }
    }

    function setInvalidControl(control, invalid) {
        if (invalid) {
            control.setAttribute("aria-invalid", "true");
        } else {
            control.removeAttribute("aria-invalid");
        }
    }

    function clearValidation() {
        formMessage.textContent = "";
        for (const control of [yearSelect, monthSelect, daySelect, targetAgeInput]) {
            setInvalidControl(control, false);
        }
    }

    function showValidationError(message, control) {
        formMessage.textContent = message;
        if (control) {
            setInvalidControl(control, true);
            control.focus();
        }
    }

    function readBirthDate() {
        const year = Number(yearSelect.value);
        const month = Number(monthSelect.value);
        const day = Number(daySelect.value);

        if (!year) {
            showValidationError("Choose your year of birth. / 生まれた年を選択してください。", yearSelect);
            return null;
        }
        if (!month) {
            showValidationError("Choose your month of birth. / 生まれた月を選択してください。", monthSelect);
            return null;
        }
        if (!day) {
            showValidationError("Choose a valid day of birth. / 正しい生年月日を選択してください。", daySelect);
            return null;
        }

        const birthDate = { year, month, day };
        if (day > daysInMonth(year, month)) {
            showValidationError("Choose a valid date of birth. / 正しい生年月日を選択してください。", daySelect);
            return null;
        }
        if (datePartsToUtc(birthDate) > datePartsToUtc(getTodayParts())) {
            showValidationError("Date of birth cannot be in the future. / 生年月日に未来の日付は指定できません。", daySelect);
            return null;
        }

        return birthDate;
    }

    function updateResults(birthDate, targetAge) {
        const today = getTodayParts();
        const todayTimestamp = datePartsToUtc(today);
        const targetDate = addYearsClamped(birthDate, targetAge);
        const targetTimestamp = datePartsToUtc(targetDate);
        const currentAge = calculateAge(birthDate, today);
        const hasReachedTarget = targetTimestamp <= todayTimestamp;
        const daysRemaining = hasReachedTarget
            ? 0
            : Math.round((targetTimestamp - todayTimestamp) / DAY_IN_MILLISECONDS);
        const progress = hasReachedTarget
            ? 100
            : Math.min(100, Math.max(0,
                ((todayTimestamp - datePartsToUtc(birthDate)) / (targetTimestamp - datePartsToUtc(birthDate))) * 100));
        const remainingTime = hasReachedTarget
            ? { years: 0, months: 0 }
            : getCalendarTimeRemaining(today, targetDate);
        const weeksRemaining = Math.floor(daysRemaining / 7);
        const formattedProgress = `${progress.toFixed(1)}%`;
        const targetDateText = dateFormatter.format(new Date(targetTimestamp));
        const japaneseTargetDateText = japaneseDateFormatter.format(new Date(targetTimestamp));

        currentAgeNumber.textContent = String(currentAge);
        currentAgeUnit.textContent = currentAge === 1 ? "YEAR OLD" : "YEARS OLD";
        progressPercentageOutput.value = formattedProgress;
        progressBar.setAttribute("aria-valuenow", progress.toFixed(1));
        progressBar.setAttribute(
            "aria-valuetext",
            `${formattedProgress} of the time from your date of birth to your target age has elapsed. / 生年月日から目標年齢までの期間の${formattedProgress}が経過しました。`
        );
        progressFill.style.width = formattedProgress;
        daysRemainingNumber.textContent = numberFormatter.format(daysRemaining);
        yearsRemainingNumber.textContent = String(remainingTime.years);
        yearsRemainingUnit.textContent = remainingTime.years === 1 ? "YEAR" : "YEARS";
        monthsRemainingNumber.textContent = String(remainingTime.months);
        monthsRemainingUnit.textContent = remainingTime.months === 1 ? "MONTH" : "MONTHS";
        weeksRemainingNumber.textContent = numberFormatter.format(weeksRemaining);
        weeksRemainingUnit.textContent = weeksRemaining === 1 ? "WEEK" : "WEEKS";

        if (hasReachedTarget) {
            resultMessage.textContent = targetTimestamp === todayTimestamp
                ? `You have reached your target age today (${targetDateText}). Days remaining: 0. / 本日、目標年齢に達しました（${japaneseTargetDateText}）。残り日数：0日。`
                : `Your target age was reached on ${targetDateText}. Days remaining: 0. / 目標年齢に達した日は${japaneseTargetDateText}です。残り日数：0日。`;
        } else {
            resultMessage.textContent = `Your personal target date is ${targetDateText}. ${numberFormatter.format(daysRemaining)} days remaining. / あなたが設定した目標日は${japaneseTargetDateText}です。残り${numberFormatter.format(daysRemaining)}日。`;
        }
    }

    yearSelect.addEventListener("change", () => {
        updateMonthOptions();
        updateDayOptions();
        setInvalidControl(yearSelect, false);
        setInvalidControl(monthSelect, false);
        setInvalidControl(daySelect, false);
    });

    monthSelect.addEventListener("change", () => {
        updateDayOptions();
        setInvalidControl(monthSelect, false);
        setInvalidControl(daySelect, false);
    });

    daySelect.addEventListener("change", () => setInvalidControl(daySelect, false));
    targetAgeInput.addEventListener("input", () => setInvalidControl(targetAgeInput, false));

    form.addEventListener("submit", (event) => {
        event.preventDefault();
        clearValidation();

        const birthDate = readBirthDate();
        if (!birthDate) {
            return;
        }

        const targetAge = Number(targetAgeInput.value);
        if (!Number.isInteger(targetAge) || targetAge < 1 || targetAge > 120) {
            showValidationError("Enter a target age between 1 and 120. / 目標年齢は1～120歳で入力してください。", targetAgeInput);
            return;
        }

        updateResults(birthDate, targetAge);
    });

    populateYears();
    updateMonthOptions();
    updateDayOptions();
})();
