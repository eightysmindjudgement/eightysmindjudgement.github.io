(() => {
    "use strict";

    const eras = [
        { id: "meiji", name: "Meiji", japanese: "明治", start: [1868, 1, 25], end: [1912, 7, 29] },
        { id: "taisho", name: "Taisho", japanese: "大正", start: [1912, 7, 30], end: [1926, 12, 24] },
        { id: "showa", name: "Showa", japanese: "昭和", start: [1926, 12, 25], end: [1989, 1, 7] },
        { id: "heisei", name: "Heisei", japanese: "平成", start: [1989, 1, 8], end: [2019, 4, 30] },
        { id: "reiwa", name: "Reiwa", japanese: "令和", start: [2019, 5, 1], end: null }
    ];

    const today = new Date();
    const todayParts = [today.getFullYear(), today.getMonth() + 1, today.getDate()];
    const gregorianInput = document.getElementById("gregorian-year");
    const eraSelect = document.getElementById("era-name");
    const eraYearInput = document.getElementById("era-year");
    const eraResult = document.getElementById("era-result");
    const gregorianResult = document.getElementById("gregorian-result");
    const gregorianError = document.getElementById("gregorian-error");
    const eraError = document.getElementById("era-error");
    const copyValues = new Map();

    function compareDates(first, second) {
        for (let index = 0; index < first.length; index += 1) {
            if (first[index] !== second[index]) {
                return first[index] - second[index];
            }
        }
        return 0;
    }

    function laterDate(first, second) {
        return compareDates(first, second) >= 0 ? first : second;
    }

    function earlierDate(first, second) {
        return compareDates(first, second) <= 0 ? first : second;
    }

    function yearPeriods(year) {
        const firstDay = [year, 1, 1];
        const lastDay = earlierDate([year, 12, 31], todayParts);

        return eras.flatMap((era) => {
            const start = laterDate(era.start, firstDay);
            const end = earlierDate(era.end || todayParts, lastDay);
            return compareDates(start, end) <= 0 ? [{ era, start, end }] : [];
        });
    }

    function formatDate(parts) {
        return new Intl.DateTimeFormat("en", {
            month: "short",
            day: "numeric",
            timeZone: "UTC"
        }).format(new Date(Date.UTC(parts[0], parts[1] - 1, parts[2])));
    }

    function formatJapanesePeriod(period) {
        return `${period.start[1]}月${period.start[2]}日〜${period.end[1]}月${period.end[2]}日`;
    }

    function formatPeriod(period, year) {
        if (compareDates(period.start, [year, 1, 1]) === 0 && compareDates(period.end, [year, 12, 31]) === 0) {
            return "";
        }
        return ` (${formatDate(period.start)}–${formatDate(period.end)})`;
    }

    function setOutput(output, english, japanese) {
        output.textContent = `${english}\n${japanese}`;
    }

    function setError(element, english, japanese) {
        element.textContent = `${english}\n${japanese}`;
    }

    function clearCopyStatus(outputId) {
        const status = document.querySelector(`[data-copy-status="${outputId}"]`);
        if (status) {
            status.textContent = "";
        }
    }

    function setCopyValue(output, value) {
        const button = document.querySelector(`[data-copy-source="${output.id}"]`);
        copyValues.set(output.id, value);
        button.disabled = !value;
        clearCopyStatus(output.id);
    }

    function clearEraConversion() {
        eraSelect.value = "";
        eraYearInput.value = "";
        eraError.textContent = "";
        eraSelect.setAttribute("aria-invalid", "false");
        eraYearInput.setAttribute("aria-invalid", "false");
        setOutput(gregorianResult, "Select an era and enter a year.", "元号と年数を入力してください。");
        setCopyValue(gregorianResult, "");
    }

    function clearGregorianConversion() {
        gregorianInput.value = "";
        gregorianError.textContent = "";
        gregorianInput.setAttribute("aria-invalid", "false");
        setOutput(eraResult, "Enter a Gregorian year to convert.", "西暦を入力してください。");
        setCopyValue(eraResult, "");
    }

    function readInteger(input) {
        if (input.value.trim() === "") {
            return null;
        }
        const value = Number(input.value);
        return Number.isSafeInteger(value) ? value : NaN;
    }

    function renderGregorianYear(year, synchronizeEra) {
        const periods = yearPeriods(year);
        if (periods.length === 0) {
            setError(gregorianError, "No supported Japanese era covers this year.", "この年に該当する対応元号はありません。");
            gregorianInput.setAttribute("aria-invalid", "true");
            setOutput(eraResult, "No conversion available.", "変換できません。");
            setCopyValue(eraResult, "");
            if (synchronizeEra) {
                clearEraConversion();
            }
            return;
        }

        gregorianInput.setAttribute("aria-invalid", "false");
        gregorianError.textContent = "";

        const descriptions = periods.map((period) => {
            const eraYear = year - period.era.start[0] + 1;
            const periodDescription = formatPeriod(period, year);
            return {
                period,
                eraYear,
                english: `${period.era.name} ${eraYear}${periodDescription}`,
                japanese: `${period.era.japanese}${eraYear}年${periodDescription ? `（${formatJapanesePeriod(period)}）` : ""}`
            };
        });
        const isAmbiguous = descriptions.length > 1;
        const english = isAmbiguous
            ? `${year} includes more than one supported era:\n${descriptions.map((item) => item.english).join("\n")}`
            : `${descriptions[0].english}`;
        const japanese = isAmbiguous
            ? `${year}年には複数の元号が含まれます。年月日がないと一意に判定できません。\n${descriptions.map((item) => item.japanese).join("\n")}`
            : descriptions[0].japanese;
        setOutput(eraResult, english, japanese);
        setCopyValue(eraResult, `${english}\n${japanese}`);

        if (synchronizeEra) {
            if (descriptions.length === 1) {
                eraSelect.value = descriptions[0].period.era.id;
                eraYearInput.value = String(descriptions[0].eraYear);
                renderEraYear(descriptions[0].period.era, descriptions[0].eraYear);
            } else {
                eraSelect.value = "";
                eraYearInput.value = "";
                eraError.textContent = "";
                setOutput(gregorianResult, "Select an era to resolve this year.", "元号を選択して年を特定してください。");
                setCopyValue(gregorianResult, "");
            }
        }
    }

    function renderEraYear(era, eraYear) {
        const gregorianYear = era.start[0] + eraYear - 1;
        const period = yearPeriods(gregorianYear).find((item) => item.era.id === era.id);

        if (!period) {
            const error = gregorianYear > todayParts[0]
                ? "This era year is in the future and its dates cannot be confirmed."
                : "This era year falls outside the era's actual dates.";
            const japaneseError = gregorianYear > todayParts[0]
                ? "この元号年は未来のため、実際の日付を確認できません。"
                : "この元号年は元号の実際の期間外です。";
            setError(eraError, error, japaneseError);
            eraYearInput.setAttribute("aria-invalid", "true");
            eraSelect.setAttribute("aria-invalid", "true");
            setOutput(gregorianResult, "No conversion available.", "変換できません。");
            setCopyValue(gregorianResult, "");
            return;
        }

        eraError.textContent = "";
        eraYearInput.setAttribute("aria-invalid", "false");
        eraSelect.setAttribute("aria-invalid", "false");
        const periodDescription = formatPeriod(period, gregorianYear);
        const english = `${gregorianYear} (${era.name} ${eraYear}${periodDescription ? `: ${periodDescription.slice(2, -1)}` : ""})`;
        const japanese = `${gregorianYear}年（${era.japanese}${eraYear}年${periodDescription ? `：${formatJapanesePeriod(period)}` : ""}）`;
        setOutput(gregorianResult, english, japanese);
        setCopyValue(gregorianResult, `${english}\n${japanese}`);
        renderGregorianYear(gregorianYear, false);
    }

    function handleGregorianInput() {
        clearCopyStatus(eraResult.id);
        clearCopyStatus(gregorianResult.id);

        const year = readInteger(gregorianInput);
        if (year === null) {
            gregorianInput.setAttribute("aria-invalid", "false");
            gregorianError.textContent = "";
            setOutput(eraResult, "Enter a Gregorian year to convert.", "西暦を入力してください。");
            setCopyValue(eraResult, "");
            clearEraConversion();
            return;
        }
        if (!Number.isSafeInteger(year) || year < 1) {
            setError(gregorianError, "Enter a whole Gregorian year greater than zero.", "西暦は0より大きい整数で入力してください。");
            gregorianInput.setAttribute("aria-invalid", "true");
            setOutput(eraResult, "No conversion available.", "変換できません。");
            setCopyValue(eraResult, "");
            clearEraConversion();
            return;
        }
        if (year < eras[0].start[0]) {
            setError(gregorianError, "Dates before January 25, 1868 are not supported.", "1868年1月25日より前の日付には対応していません。");
            gregorianInput.setAttribute("aria-invalid", "true");
            setOutput(eraResult, "No conversion available.", "変換できません。");
            setCopyValue(eraResult, "");
            clearEraConversion();
            return;
        }
        if (year > todayParts[0]) {
            setError(gregorianError, "Future Gregorian years are not supported because a future era transition cannot be known.", "将来の改元を判定できないため、未来の西暦には対応していません。");
            gregorianInput.setAttribute("aria-invalid", "true");
            setOutput(eraResult, "No conversion available.", "変換できません。");
            setCopyValue(eraResult, "");
            clearEraConversion();
            return;
        }
        renderGregorianYear(year, true);
    }

    function handleEraInput() {
        clearCopyStatus(eraResult.id);
        clearCopyStatus(gregorianResult.id);

        const era = eras.find((item) => item.id === eraSelect.value);
        const eraYear = readInteger(eraYearInput);
        if (!era || eraYear === null) {
            eraError.textContent = "";
            eraSelect.setAttribute("aria-invalid", "false");
            eraYearInput.setAttribute("aria-invalid", "false");
            setOutput(gregorianResult, "Select an era and enter a year.", "元号と年数を入力してください。");
            setCopyValue(gregorianResult, "");
            clearGregorianConversion();
            return;
        }
        if (!Number.isSafeInteger(eraYear) || eraYear < 1) {
            setError(eraError, "Enter a whole era year greater than zero.", "元号の年数は0より大きい整数で入力してください。");
            eraYearInput.setAttribute("aria-invalid", "true");
            eraSelect.setAttribute("aria-invalid", "false");
            setOutput(gregorianResult, "No conversion available.", "変換できません。");
            setCopyValue(gregorianResult, "");
            clearGregorianConversion();
            return;
        }

        const gregorianYear = era.start[0] + eraYear - 1;
        if (!Number.isSafeInteger(gregorianYear) || gregorianYear > todayParts[0]) {
            setError(eraError, "Future era years are not supported because their dates cannot be confirmed.", "実際の日付を確認できない未来の元号年には対応していません。");
            eraYearInput.setAttribute("aria-invalid", "true");
            eraSelect.setAttribute("aria-invalid", "false");
            setOutput(gregorianResult, "No conversion available.", "変換できません。");
            setCopyValue(gregorianResult, "");
            clearGregorianConversion();
            return;
        }

        gregorianInput.value = String(gregorianYear);
        renderEraYear(era, eraYear);
    }

    async function copyResult(button) {
        const outputId = button.dataset.copySource;
        const text = copyValues.get(outputId);
        const status = document.querySelector(`[data-copy-status="${outputId}"]`);
        if (!text) {
            return;
        }

        try {
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(text);
            } else {
                throw new Error("Clipboard API is unavailable in this context.");
            }
        } catch (clipboardError) {
            const temporaryInput = document.createElement("textarea");
            temporaryInput.value = text;
            temporaryInput.setAttribute("readonly", "");
            temporaryInput.className = "era-converter-copy-fallback";
            document.body.append(temporaryInput);
            let copied;
            try {
                temporaryInput.select();
                copied = document.execCommand("copy");
            } finally {
                temporaryInput.remove();
            }
            if (!copied) {
                throw clipboardError;
            }
        }

        status.textContent = "Copied!（コピーしました）";
    }

    document.getElementById("gregorian-converter").addEventListener("submit", (event) => event.preventDefault());
    document.getElementById("era-converter").addEventListener("submit", (event) => event.preventDefault());
    gregorianInput.addEventListener("input", handleGregorianInput);
    eraSelect.addEventListener("change", handleEraInput);
    eraYearInput.addEventListener("input", handleEraInput);

    document.querySelectorAll("[data-copy-source]").forEach((button) => {
        button.addEventListener("click", () => {
            copyResult(button).catch(() => {
                const status = document.querySelector(`[data-copy-status="${button.dataset.copySource}"]`);
                status.textContent = "Unable to copy. Please select and copy the result manually. / コピーできませんでした。結果を選択して手動でコピーしてください。";
            });
        });
    });
})();
