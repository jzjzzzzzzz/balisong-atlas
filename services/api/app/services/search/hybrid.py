from collections.abc import Callable
from dataclasses import dataclass


@dataclass(frozen=True)
class RankedResult[T]:
    item: T
    score: float
    ranks: dict[str, int]


def reciprocal_rank_fusion[T](
    result_sets: dict[str, list[T]], key: Callable[[T], object], constant: int = 60
) -> list[RankedResult[T]]:
    scores: dict[str, float] = {}
    items: dict[str, T] = {}
    ranks: dict[str, dict[str, int]] = {}
    for channel, results in result_sets.items():
        for rank, item in enumerate(results, start=1):
            item_key = str(key(item))
            items[item_key] = item
            scores[item_key] = scores.get(item_key, 0.0) + 1.0 / (constant + rank)
            ranks.setdefault(item_key, {})[channel] = rank
    return sorted(
        (RankedResult(items[item_key], round(score, 8), ranks[item_key]) for item_key, score in scores.items()),
        key=lambda result: result.score,
        reverse=True,
    )
