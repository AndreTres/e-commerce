import re

CPF_LENGTH = 11
CNPJ_LENGTH = 14

INVALID_DOCUMENT_MESSAGE = "Invalid CPF or CNPJ"


def normalize_document(value: str) -> str:
    return re.sub(r"\D", "", value)


def is_repeated_digits(document: str) -> bool:
    return len(document) > 0 and len(set(document)) == 1


def validate_cpf(cpf: str) -> bool:
    if len(cpf) != CPF_LENGTH or not cpf.isdigit() or is_repeated_digits(cpf):
        return False

    def calculate_digit(base: str, weights: list[int]) -> str:
        total = sum(int(base[i]) * weights[i] for i in range(len(weights)))
        remainder = total % 11
        return "0" if remainder < 2 else str(11 - remainder)

    first_digit = calculate_digit(cpf[:9], list(range(10, 1, -1)))
    if cpf[9] != first_digit:
        return False

    second_digit = calculate_digit(cpf[:10], list(range(11, 1, -1)))
    return cpf[10] == second_digit


def validate_cnpj(cnpj: str) -> bool:
    if len(cnpj) != CNPJ_LENGTH or not cnpj.isdigit() or is_repeated_digits(cnpj):
        return False

    weights_first = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
    weights_second = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]

    def calculate_digit(base: str, weights: list[int]) -> str:
        total = sum(int(base[i]) * weights[i] for i in range(len(weights)))
        remainder = total % 11
        return "0" if remainder < 2 else str(11 - remainder)

    first_digit = calculate_digit(cnpj[:12], weights_first)
    if cnpj[12] != first_digit:
        return False

    second_digit = calculate_digit(cnpj[:13], weights_second)
    return cnpj[13] == second_digit


def validate_cpf_or_cnpj(value: str) -> str:
    document = normalize_document(value)
    if validate_cpf(document) or validate_cnpj(document):
        return document
    raise ValueError(INVALID_DOCUMENT_MESSAGE)
