(() => {
    const form = document.getElementById("compound-calculator-form");
    const initialInvestmentInput = document.getElementById("initial-investment");
    const monthlyContributionInput = document.getElementById("monthly-contribution");
    const investmentPeriodInput = document.getElementById("investment-period");
    const annualReturnInput = document.getElementById("annual-return");
    const contributionTimingSelect = document.getElementById("contribution-timing");
    const displayCurrencySelect = document.getElementById("display-currency");
    const errorMessage = document.getElementById("compound-error");
    const currencySymbols = document.querySelectorAll("[data-currency-symbol]");
    const currencyCodes = document.querySelectorAll("[data-currency-code]");
    const futureValueOutput = document.getElementById("future-value");
    const totalPrincipalOutput = document.getElementById("total-principal");
    const totalContributionsOutput = document.getElementById("total-contributions");
    const totalInterestOutput = document.getElementById("total-interest");
    const totalReturnOutput = document.getElementById("total-return");
    const projectionRows = document.getElementById("projection-rows");
    const contributionsLine = document.getElementById("contributions-chart-line");
    const investmentLine = document.getElementById("investment-chart-line");
    const chartGrid = document.getElementById("compound-chart-grid");
    const chartLabels = document.getElementById("compound-chart-labels");
    const chartDescription = document.getElementById("compound-chart-description");
    const resetButton = document.getElementById("reset-calculator");

    const DEFAULTS = {
        initialInvestment: "1000000",
        monthlyContribution: "30000",
        investmentPeriod: "20",
        annualReturn: "5",
        contributionTiming: "end",
        displayCurrency: "JPY"
    };
    const numberFormatter = new Intl.NumberFormat("en-US", {
        maximumFractionDigits: 0
    });
    const percentFormatter = new Intl.NumberFormat("en-US", {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1
    });
    const SVG_NS = "http://www.w3.org/2000/svg";

    function formatCurrency(value) {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: displayCurrencySelect.value,
            maximumFractionDigits: 0
        }).format(value);
    }

    function formatAxisCurrency(value) {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: displayCurrencySelect.value,
            notation: "compact",
            maximumFractionDigits: 1
        }).format(value);
    }

    function updateCurrencyLabels() {
        const currency = displayCurrencySelect.value;
        const symbol = currency === "USD" ? "$" : "¥";
        for (const element of currencySymbols) {
            element.textContent = symbol;
        }
        for (const element of currencyCodes) {
            element.textContent = currency;
        }
    }

    function readInput(input, { minimum, maximum, integer = false, maxDecimalPlaces }) {
        if (input.value.trim() === "") {
            return null;
        }

        const value = input.valueAsNumber;
        if (!Number.isFinite(value) || value < minimum
            || (maximum !== undefined && value > maximum)
            || (integer && !Number.isInteger(value))
            || (maxDecimalPlaces !== undefined
                && Math.abs(value * (10 ** maxDecimalPlaces) - Math.round(value * (10 ** maxDecimalPlaces)))
                    > Number.EPSILON * Math.max(1, Math.abs(value * (10 ** maxDecimalPlaces))) * 4)) {
            return null;
        }

        return value;
    }

    function clearResults() {
        futureValueOutput.value = "—";
        totalPrincipalOutput.value = "—";
        totalContributionsOutput.value = "—";
        totalInterestOutput.value = "—";
        totalReturnOutput.value = "—";
        projectionRows.replaceChildren();
        contributionsLine.setAttribute("d", "");
        investmentLine.setAttribute("d", "");
        chartGrid.replaceChildren();
        chartLabels.replaceChildren();
        chartDescription.textContent = "Enter valid assumptions to see an investment growth projection.";
    }

    function createSvgElement(name, attributes, text) {
        const element = document.createElementNS(SVG_NS, name);
        for (const [attribute, value] of Object.entries(attributes)) {
            element.setAttribute(attribute, String(value));
        }
        if (text !== undefined) {
            element.textContent = text;
        }
        return element;
    }

    function calculateProjection(settings) {
        const months = settings.years * 12;
        const monthlyRate = Math.pow(1 + settings.annualRate, 1 / 12) - 1;
        let balance = settings.initialInvestment;
        let cumulativeContributions = 0;
        const projection = [{
            year: 0,
            totalPrincipal: balance,
            totalContributions: 0,
            investmentValue: balance,
            interestEarned: 0
        }];

        for (let month = 1; month <= months; month += 1) {
            if (settings.timing === "beginning") {
                balance += settings.monthlyContribution;
                cumulativeContributions += settings.monthlyContribution;
                balance *= 1 + monthlyRate;
            } else {
                balance *= 1 + monthlyRate;
                balance += settings.monthlyContribution;
                cumulativeContributions += settings.monthlyContribution;
            }

            if (!Number.isFinite(balance) || !Number.isFinite(cumulativeContributions)) {
                return null;
            }

            if (month % 12 === 0) {
                const totalPrincipal = settings.initialInvestment + cumulativeContributions;
                if (!Number.isFinite(totalPrincipal)) {
                    return null;
                }
                if (monthlyRate === 0) {
                    balance = totalPrincipal;
                }
                projection.push({
                    year: month / 12,
                    totalPrincipal,
                    totalContributions: cumulativeContributions,
                    investmentValue: balance,
                    interestEarned: Math.max(0, balance - totalPrincipal)
                });
            }
        }

        return projection;
    }

    function renderProjectionTable(projection) {
        const rows = projection.slice(1).map((yearResult) => {
            const row = document.createElement("tr");
            const cells = [
                numberFormatter.format(yearResult.year),
                formatCurrency(yearResult.totalPrincipal),
                formatCurrency(yearResult.investmentValue),
                formatCurrency(yearResult.interestEarned)
            ];

            for (const value of cells) {
                const cell = document.createElement("td");
                cell.textContent = value;
                row.append(cell);
            }
            return row;
        });

        projectionRows.replaceChildren(...rows);
    }

    function renderChart(projection, years) {
        const width = 900;
        const height = 300;
        const left = 78;
        const right = 880;
        const top = 20;
        const bottom = 252;
        const maxValue = Math.max(...projection.map((point) => point.investmentValue), 1);
        const x = (year) => left + ((right - left) * year / years);
        const y = (value) => bottom - ((bottom - top) * value / maxValue);
        const pointsFor = (key) => projection.map((point) => `${x(point.year)},${y(point[key])}`);

        const gridElements = [];
        for (let index = 0; index <= 4; index += 1) {
            const value = maxValue * index / 4;
            const yPosition = y(value);
            gridElements.push(createSvgElement("line", {
                x1: left,
                y1: yPosition,
                x2: right,
                y2: yPosition,
                class: "compound-chart-grid-line"
            }));
            gridElements.push(createSvgElement("text", {
                x: left - 10,
                y: yPosition + 4,
                class: "compound-chart-axis-label",
                "text-anchor": "end"
            }, formatAxisCurrency(value)));
        }
        chartGrid.replaceChildren(...gridElements);

        const labelYears = [...new Set([0, Math.ceil(years / 2), years])];
        chartLabels.replaceChildren(...labelYears.map((year) => createSvgElement("text", {
            x: x(year),
            y: height - 12,
            class: "compound-chart-axis-label",
            "text-anchor": year === 0 ? "start" : year === years ? "end" : "middle"
        }, year === 0 ? "START" : `YEAR ${numberFormatter.format(year)}`)));

        contributionsLine.setAttribute("d", `M ${pointsFor("totalPrincipal").join(" L ")}`);
        investmentLine.setAttribute("d", `M ${pointsFor("investmentValue").join(" L ")}`);
        const finalResult = projection[projection.length - 1];
        chartDescription.textContent = `At year ${years}, total principal is ${formatCurrency(finalResult.totalPrincipal)} and investment value is ${formatCurrency(finalResult.investmentValue)}.`;
    }

    function updateCalculator() {
        const annualReturnPercent = readInput(annualReturnInput, {
            minimum: 0,
            maximum: 100,
            maxDecimalPlaces: 2
        });
        const settings = {
            initialInvestment: readInput(initialInvestmentInput, { minimum: 0 }),
            monthlyContribution: readInput(monthlyContributionInput, { minimum: 0 }),
            years: readInput(investmentPeriodInput, { minimum: 1, maximum: 100, integer: true }),
            annualRate: annualReturnPercent === null ? null : annualReturnPercent / 100,
            timing: contributionTimingSelect.value
        };
        const invalid = settings.initialInvestment === null
            || settings.monthlyContribution === null
            || settings.years === null
            || annualReturnPercent === null
            || !["beginning", "end"].includes(settings.timing);

        if (invalid) {
            errorMessage.textContent = "Enter valid values: amounts must be 0 or more, period 1–100 whole years, and annual return 0–100% in 0.01% increments. / 金額は0以上、運用期間は1～100年の整数、想定年利は0.01%刻みの0～100%で入力してください。";
            clearResults();
            return;
        }

        const projection = calculateProjection(settings);
        if (!projection) {
            errorMessage.textContent = "These values exceed the calculator's supported numeric range. Please enter smaller amounts. / 入力値が計算可能な数値の範囲を超えています。金額を小さくしてください。";
            clearResults();
            return;
        }

        errorMessage.textContent = "";
        const finalResult = projection[projection.length - 1];
        const totalPrincipal = settings.initialInvestment
            + finalResult.totalContributions;
        const totalInterest = Math.max(0, finalResult.investmentValue - totalPrincipal);
        const totalReturn = totalPrincipal === 0
            ? null
            : (totalInterest / totalPrincipal) * 100;

        futureValueOutput.value = formatCurrency(finalResult.investmentValue);
        totalPrincipalOutput.value = formatCurrency(totalPrincipal);
        totalContributionsOutput.value = formatCurrency(finalResult.totalContributions);
        totalInterestOutput.value = formatCurrency(totalInterest);
        totalReturnOutput.value = totalReturn === null
            ? "N/A / 該当なし"
            : `${percentFormatter.format(totalReturn)}%`;

        renderProjectionTable(projection);
        renderChart(projection, settings.years);
    }

    form.addEventListener("submit", (event) => event.preventDefault());
    form.addEventListener("input", updateCalculator);
    contributionTimingSelect.addEventListener("change", updateCalculator);
    displayCurrencySelect.addEventListener("change", () => {
        updateCurrencyLabels();
        updateCalculator();
    });
    resetButton.addEventListener("click", () => {
        initialInvestmentInput.value = DEFAULTS.initialInvestment;
        monthlyContributionInput.value = DEFAULTS.monthlyContribution;
        investmentPeriodInput.value = DEFAULTS.investmentPeriod;
        annualReturnInput.value = DEFAULTS.annualReturn;
        contributionTimingSelect.value = DEFAULTS.contributionTiming;
        displayCurrencySelect.value = DEFAULTS.displayCurrency;
        updateCurrencyLabels();
        updateCalculator();
    });

    updateCurrencyLabels();
    updateCalculator();
})();
