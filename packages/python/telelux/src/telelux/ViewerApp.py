from collections.abc import Awaitable, Callable, MutableMapping
from typing import Any

Message = MutableMapping[str, Any]
Receive = Callable[[], Awaitable[Message]]
Send = Callable[[Message], Awaitable[None]]


class ViewerApp:
    def __init__(self, page: Callable[[], str]) -> None:
        self.page = page

    async def __call__(self, scope: Message, receive: Receive, send: Send) -> None:
        handler = {"lifespan": self.lifespan, "http": self.http}.get(scope["type"])
        if handler is not None:
            await handler(scope, receive, send)

    async def lifespan(self, scope: Message, receive: Receive, send: Send) -> None:
        for _ in range(2):
            message = await receive()
            await send({"type": f"{message['type']}.complete"})

    async def http(self, scope: Message, receive: Receive, send: Send) -> None:
        send_body = {"GET": True, "HEAD": False}.get(scope["method"])
        if scope["path"] != "/":
            await self.respond(send, 404, b"Not Found", "text/plain")
        elif send_body is None:
            await self.respond(
                send,
                405,
                b"Method Not Allowed",
                "text/plain",
                ((b"allow", b"GET, HEAD"),),
            )
        else:
            body = self.page().encode("utf-8")
            await self.respond(send, 200, body, "text/html", send_body=send_body)

    async def respond(
        self,
        send: Send,
        status: int,
        body: bytes,
        content_type: str,
        extra_headers: tuple[tuple[bytes, bytes], ...] = (),
        send_body: bool = True,
    ) -> None:
        headers = [
            (b"content-type", f"{content_type}; charset=utf-8".encode()),
            (b"content-length", str(len(body)).encode()),
            (b"cache-control", b"no-store"),
            *extra_headers,
        ]
        await send(
            {"type": "http.response.start", "status": status, "headers": headers}
        )
        await send({"type": "http.response.body", "body": body if send_body else b""})
