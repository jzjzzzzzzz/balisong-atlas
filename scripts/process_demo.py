import asyncio

from worker.main import Worker


async def main() -> None:
    worker = Worker()
    count = 0
    while await worker.run_once():
        count += 1
        if count >= 100:
            break
    print(f"Processed {count} queued demo job(s).")


if __name__ == "__main__":
    asyncio.run(main())
