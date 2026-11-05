from decimal import Decimal, ROUND_HALF_UP

MONEY_QUANTIZE = Decimal("0.01")


def calculate_financed_amount(vehicle_price: Decimal, down_payment: Decimal) -> Decimal:
    return (vehicle_price - down_payment).quantize(MONEY_QUANTIZE, ROUND_HALF_UP)


def calculate_price_installment(
    financed_amount: Decimal,
    monthly_interest_rate_percent: Decimal,
    term_months: int,
) -> Decimal:
    if financed_amount <= Decimal("0"):
        return Decimal("0.00")

    months = Decimal(term_months)
    monthly_rate = monthly_interest_rate_percent / Decimal("100")

    if monthly_rate == Decimal("0"):
        return (financed_amount / months).quantize(MONEY_QUANTIZE, ROUND_HALF_UP)

    growth_factor = (Decimal("1") + monthly_rate) ** term_months
    installment = financed_amount * (monthly_rate * growth_factor) / (growth_factor - Decimal("1"))
    return installment.quantize(MONEY_QUANTIZE, ROUND_HALF_UP)
