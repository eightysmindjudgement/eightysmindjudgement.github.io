(() => {
    "use strict";

    const form = document.getElementById("loan-calculator-form");
    const amountInput = document.getElementById("loan-amount");
    const rateInput = document.getElementById("annual-rate");
    const startDateInput = document.getElementById("loan-start-date");
    const termSelect = document.getElementById("loan-term");
    const methodSelect = document.getElementById("repayment-method");
    const frequencySelect = document.getElementById("payment-frequency");
    const dayCountSelect = document.getElementById("day-count");
    const errorOutput = document.getElementById("loan-error");
    const interestOutput = document.getElementById("total-interest");
    const principalOutput = document.getElementById("total-principal");
    const repaymentOutput = document.getElementById("total-repayment");
    const finalDateOutput = document.getElementById("final-payment-date");
    const finalBalanceOutput = document.getElementById("final-balance");
    const interestPercentOutput = document.getElementById("interest-percent");
    const methodSummary = document.getElementById("payment-method-summary");
    const scheduleRows = document.getElementById("loan-schedule-rows");
    const downloadButton = document.getElementById("download-loan-csv");
    const resetButton = document.getElementById("reset-loan-calculator");

    const DEFAULTS = {
        amount: "10000000",
        rate: "2",
        termMonths: "12",
        method: "bullet",
        frequencyMonths: "1",
        dayCount: "actual-365"
    };

    const METHOD_SUMMARIES = {
        bullet: "Interest is paid at the selected frequency; all principal is repaid at maturity. / 選択した頻度で利息を支払い、元本は満期日に全額返済します。",
        "equal-principal": "Principal is divided into equal scheduled installments; interest is calculated on each opening balance. / 元本を各回に均等に配分し、各回の返済前残高に利息を計算します。",
        amortizing: "The regular total payment is calculated using each actual period's day-count fraction; the last payment clears any remaining balance. / 各期間の日数計算方式を使って原則一定の返済額を計算し、最終回に残高を調整します。"
    };

    const yenFormatter = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "JPY",
        maximumFractionDigits: 0
    });
    const dateFormatter = new Intl.DateTimeFormat("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        timeZone: "UTC"
    });

    let displayedSchedule = [];

    function getTodayInputValue() {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, "0");
        const day = String(today.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
    }

    function parseDate(value) {
        const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
        if (!match) {
            return null;
        }

        const year = Number(match[1]);
        const month = Number(match[2]);
        const day = Number(match[3]);
        const date = new Date(0);
        date.setUTCHours(0, 0, 0, 0);
        date.setUTCFullYear(year, month - 1, day);

        if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
            return null;
        }
        return { year, month, day, timestamp: date.getTime() };
    }

    function dateToInputValue(date) {
        return `${String(date.year).padStart(4, "0")}-${String(date.month).padStart(2, "0")}-${String(date.day).padStart(2, "0")}`;
    }

    function addMonths(date, months) {
        const targetIndex = date.year * 12 + date.month - 1 + months;
        const year = Math.floor(targetIndex / 12);
        const month = targetIndex % 12 + 1;
        if (year < 1 || year > 9999) {
            return null;
        }

        const monthEnd = new Date(0);
        monthEnd.setUTCHours(0, 0, 0, 0);
        monthEnd.setUTCFullYear(year, month, 0);
        const day = Math.min(date.day, monthEnd.getUTCDate());
        const result = new Date(0);
        result.setUTCHours(0, 0, 0, 0);
        result.setUTCFullYear(year, month - 1, day);
        return { year, month, day, timestamp: result.getTime() };
    }

    function actualDaysBetween(start, end) {
        return (end.timestamp - start.timestamp) / 86400000;
    }

    function isLeapYear(year) {
        return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
    }

    function formatLoanAmountInput() {
        const original = amountInput.value;
        const selectionStart = amountInput.selectionStart;
        const rawValue = original.replace(/,/g, "");
        const rawPrefix = original.slice(0, selectionStart).replace(/,/g, "");
        const decimalIndex = rawValue.indexOf(".");
        const integerPart = decimalIndex === -1 ? rawValue : rawValue.slice(0, decimalIndex);
        const fractionalPart = decimalIndex === -1 ? "" : rawValue.slice(decimalIndex);
        const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        const formattedValue = `${formattedInteger}${fractionalPart}`;

        if (formattedValue === original) {
            return;
        }

        amountInput.value = formattedValue;
        let formattedPosition = 0;
        let rawCharactersCounted = 0;
        while (formattedPosition < formattedValue.length && rawCharactersCounted < rawPrefix.length) {
            if (formattedValue[formattedPosition] !== ",") {
                rawCharactersCounted += 1;
            }
            formattedPosition += 1;
        }
        amountInput.setSelectionRange(formattedPosition, formattedPosition);
    }

    function dayCountFraction(start, end, convention) {
        const days = actualDaysBetween(start, end);
        if (convention === "actual-365") {
            return days / 365;
        }
        if (convention === "actual-360") {
            return days / 360;
        }

        let fraction = 0;
        let cursor = start.timestamp;
        while (cursor < end.timestamp) {
            const current = new Date(cursor);
            const year = current.getUTCFullYear();
            const nextYear = new Date(0);
            nextYear.setUTCHours(0, 0, 0, 0);
            nextYear.setUTCFullYear(year + 1, 0, 1);
            const segmentEnd = Math.min(end.timestamp, nextYear.getTime());
            fraction += (segmentEnd - cursor) / 86400000 / (isLeapYear(year) ? 366 : 365);
            cursor = segmentEnd;
        }
        return fraction;
    }

    function readNumber(input, { minimum, maximum = Infinity }) {
        if (input.value.trim() === "") {
            return null;
        }
        const value = input === amountInput
            ? Number(input.value.replace(/,/g, ""))
            : input.valueAsNumber;
        if (!Number.isFinite(value) || value < minimum || value > maximum) {
            return null;
        }
        return value;
    }

    function makePeriods(start, termMonths, frequencyMonths, convention) {
        const maturity = addMonths(start, termMonths);
        if (!maturity) {
            return null;
        }

        const paymentCount = Math.ceil(termMonths / frequencyMonths);
        const periods = [];
        let previous = start;
        for (let paymentNumber = 1; paymentNumber <= paymentCount; paymentNumber += 1) {
            const monthOffset = Math.min(paymentNumber * frequencyMonths, termMonths);
            const paymentDate = addMonths(start, monthOffset);
            if (!paymentDate) {
                return null;
            }
            periods.push({
                paymentNumber,
                start: previous,
                end: paymentDate,
                dayCountFraction: dayCountFraction(previous, paymentDate, convention)
            });
            previous = paymentDate;
        }
        return { periods, maturity };
    }

    function createPaymentSchedule(principal, annualRate, periods, method) {
        let fixedPayment = 0;
        if (method === "amortizing") {
            let accumulationFactor = 1;
            let discountSum = 0;
            for (const period of periods) {
                accumulationFactor *= 1 + annualRate * period.dayCountFraction;
                discountSum += 1 / accumulationFactor;
            }
            fixedPayment = principal / discountSum;
        }

        let balance = principal;
        const schedule = [];
        for (let index = 0; index < periods.length; index += 1) {
            const period = periods[index];
            const openingBalance = balance;
            const interest = openingBalance * annualRate * period.dayCountFraction;
            let principalPaid;
            let payment;

            if (method === "bullet") {
                principalPaid = index === periods.length - 1 ? openingBalance : 0;
                payment = interest + principalPaid;
            } else if (method === "equal-principal") {
                principalPaid = index === periods.length - 1 ? openingBalance : principal / periods.length;
                payment = interest + principalPaid;
            } else {
                principalPaid = index === periods.length - 1 ? openingBalance : fixedPayment - interest;
                if (principalPaid < 0 && principalPaid > -principal * 1e-12) {
                    principalPaid = 0;
                }
                principalPaid = Math.min(principalPaid, openingBalance);
                payment = index === periods.length - 1 ? interest + principalPaid : fixedPayment;
            }

            balance = Math.max(0, openingBalance - principalPaid);
            schedule.push({
                paymentNumber: period.paymentNumber,
                date: period.end,
                openingBalance,
                principalPaid,
                interest,
                payment,
                closingBalance: balance
            });
        }
        return schedule;
    }

    function createDisplayedSchedule(schedule, principal) {
        const roundedPrincipal = Math.round(principal);
        let principalPaidSoFar = 0;
        let interestPaidSoFar = 0;
        let repaymentTotal = 0;
        const roundedInterestTotal = Math.round(schedule.reduce((sum, payment) => sum + payment.interest, 0));

        const rows = schedule.map((payment, index) => {
            const principalPaid = index === schedule.length - 1
                ? roundedPrincipal - principalPaidSoFar
                : Math.round(payment.principalPaid);
            const interest = index === schedule.length - 1
                ? roundedInterestTotal - interestPaidSoFar
                : Math.round(payment.interest);
            const openingBalance = roundedPrincipal - principalPaidSoFar;
            const closingBalance = openingBalance - principalPaid;
            const totalPayment = principalPaid + interest;
            principalPaidSoFar += principalPaid;
            interestPaidSoFar += interest;
            repaymentTotal += totalPayment;
            return {
                paymentNumber: payment.paymentNumber,
                date: dateToInputValue(payment.date),
                openingBalance,
                principalPaid,
                interest,
                totalPayment,
                closingBalance
            };
        });

        return { rows, principalTotal: principalPaidSoFar, interestTotal: interestPaidSoFar, repaymentTotal };
    }

    function formatDate(dateString) {
        const date = parseDate(dateString);
        const value = new Date(0);
        value.setUTCHours(0, 0, 0, 0);
        value.setUTCFullYear(date.year, date.month - 1, date.day);
        return dateFormatter.format(value);
    }

    function clearResults() {
        interestOutput.value = "¥—";
        principalOutput.value = "¥—";
        repaymentOutput.value = "¥—";
        finalDateOutput.value = "—";
        finalBalanceOutput.value = "¥—";
        interestPercentOutput.value = "—";
        methodSummary.textContent = "";
        scheduleRows.replaceChildren();
        displayedSchedule = [];
        downloadButton.disabled = true;
    }

    function renderSchedule(rows) {
        const renderedRows = rows.map((payment) => {
            const row = document.createElement("tr");
            const values = [
                String(payment.paymentNumber),
                formatDate(payment.date),
                yenFormatter.format(payment.openingBalance),
                yenFormatter.format(payment.principalPaid),
                yenFormatter.format(payment.interest),
                yenFormatter.format(payment.totalPayment),
                yenFormatter.format(payment.closingBalance)
            ];
            for (const value of values) {
                const cell = document.createElement("td");
                cell.textContent = value;
                row.append(cell);
            }
            return row;
        });
        scheduleRows.replaceChildren(...renderedRows);
    }

    function calculate() {
        errorOutput.textContent = "";
        const principal = readNumber(amountInput, { minimum: Number.MIN_VALUE });
        const annualRatePercent = readNumber(rateInput, { minimum: 0, maximum: 100 });
        const startDate = parseDate(startDateInput.value);
        const termMonths = Number(termSelect.value);
        const frequencyMonths = Number(frequencySelect.value);
        const method = methodSelect.value;

        if (principal === null) {
            errorOutput.textContent = "Enter a loan amount greater than zero. / 借入金額は0より大きい数値を入力してください。";
        } else if (annualRatePercent === null) {
            errorOutput.textContent = "Enter an annual interest rate from 0% to 100%. / 年利は0%以上100%以下で入力してください。";
        } else if (!startDate) {
            errorOutput.textContent = "Enter a valid loan start date. / 有効な借入開始日を入力してください。";
        } else if (!Number.isInteger(termMonths) || !Number.isInteger(frequencyMonths)
            || !["bullet", "equal-principal", "amortizing"].includes(method)) {
            errorOutput.textContent = "Select valid loan terms and repayment options. / 有効な借入条件と返済方式を選択してください。";
        }

        if (errorOutput.textContent) {
            clearResults();
            return;
        }

        const annualRate = annualRatePercent / 100;
        const builtPeriods = makePeriods(startDate, termMonths, frequencyMonths, dayCountSelect.value);
        if (!builtPeriods) {
            errorOutput.textContent = "The maturity date is outside the supported calendar range. / 満期日が対応する日付の範囲外です。";
            clearResults();
            return;
        }

        const schedule = createPaymentSchedule(principal, annualRate, builtPeriods.periods, method);
        if (schedule.some((payment) => !Number.isFinite(payment.interest)
            || !Number.isFinite(payment.principalPaid) || !Number.isFinite(payment.payment)
            || !Number.isFinite(payment.closingBalance))
            || !Number.isFinite(schedule.reduce((sum, payment) => sum + payment.interest, 0))) {
            errorOutput.textContent = "These loan values are too large to calculate reliably. / 入力値が大きすぎるため、正確に計算できません。";
            clearResults();
            return;
        }

        const totals = createDisplayedSchedule(schedule, principal);
        displayedSchedule = totals.rows;
        const finalPayment = displayedSchedule[displayedSchedule.length - 1];
        interestOutput.value = yenFormatter.format(totals.interestTotal);
        principalOutput.value = yenFormatter.format(totals.principalTotal);
        repaymentOutput.value = yenFormatter.format(totals.repaymentTotal);
        finalDateOutput.value = formatDate(finalPayment.date);
        finalBalanceOutput.value = yenFormatter.format(finalPayment.closingBalance);
        interestPercentOutput.value = `${(totals.interestTotal / principal * 100).toFixed(2)}%`;
        methodSummary.textContent = METHOD_SUMMARIES[method];
        renderSchedule(displayedSchedule);
        downloadButton.disabled = displayedSchedule.length === 0;
    }

    function csvEscape(value) {
        return `"${String(value).replace(/"/g, '""')}"`;
    }

    function downloadCsv() {
        if (displayedSchedule.length === 0) {
            return;
        }

        const headers = [
            "Payment No. / 回数",
            "Payment Date / 支払日",
            "Opening Balance (JPY) / 返済前残高",
            "Principal Repaid (JPY) / 元本返済額",
            "Interest Payment (JPY) / 利息支払額",
            "Total Payment (JPY) / 返済額合計",
            "Closing Balance (JPY) / 返済後残高"
        ];
        const rows = [headers, ...displayedSchedule.map((payment) => [
            payment.paymentNumber,
            payment.date,
            payment.openingBalance,
            payment.principalPaid,
            payment.interest,
            payment.totalPayment,
            payment.closingBalance
        ])];
        const contents = `\uFEFF${rows.map((row) => row.map(csvEscape).join(",")).join("\r\n")}`;
        const blob = new Blob([contents], { type: "text/csv;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "loan-repayment-schedule.csv";
        document.body.append(link);
        link.click();
        link.remove();
        window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    }

    function resetToDefaults() {
        amountInput.value = DEFAULTS.amount;
        formatLoanAmountInput();
        rateInput.value = DEFAULTS.rate;
        startDateInput.value = getTodayInputValue();
        termSelect.value = DEFAULTS.termMonths;
        methodSelect.value = DEFAULTS.method;
        frequencySelect.value = DEFAULTS.frequencyMonths;
        dayCountSelect.value = DEFAULTS.dayCount;
        calculate();
    }

    amountInput.addEventListener("input", formatLoanAmountInput);
    form.addEventListener("submit", (event) => event.preventDefault());
    form.addEventListener("input", calculate);
    form.addEventListener("change", calculate);
    resetButton.addEventListener("click", resetToDefaults);
    downloadButton.addEventListener("click", downloadCsv);

    startDateInput.value = getTodayInputValue();
    formatLoanAmountInput();
    calculate();
})();
