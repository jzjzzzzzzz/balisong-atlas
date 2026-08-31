from typing import Any

from sqlalchemy.inspection import inspect


def row_dict(row: Any) -> dict[str, Any]:
    return {attribute.key: getattr(row, attribute.key) for attribute in inspect(row).mapper.column_attrs}
