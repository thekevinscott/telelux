from pathlib import Path

import click

from .describe_error import describe_error
from .open_browser_when_ready import open_browser_when_ready
from .serve_log_config import serve_log_config
from .Telelux import Telelux


@click.command()
@click.argument("transcript", required=False, type=click.Path(path_type=Path))
@click.option(
    "--out",
    type=click.Path(path_type=Path),
    help="Write the viewer, with TRANSCRIPT baked in, to a new HTML file.",
)
@click.option("--no-browser", is_flag=True, help="Don't open the viewer in a browser.")
@click.option("--host", help="Interface to serve on, passed to Uvicorn.")
@click.option("--port", type=int, help="Port to serve on, passed to Uvicorn.")
def cli(
    transcript: Path | None,
    out: Path | None,
    no_browser: bool,
    host: str | None,
    port: int | None,
) -> None:
    """Serve TRANSCRIPT in the viewer, or export it with --out.

    Without TRANSCRIPT, serve the empty viewer.
    """
    if out is not None and transcript is None:
        raise click.UsageError("--out needs a TRANSCRIPT to export")
    try:
        viewer = Telelux(transcript)
        if out is not None:
            viewer.write(out)
    except (OSError, ValueError) as error:
        raise click.ClickException(describe_error(error, transcript)) from error
    if out is not None:
        click.echo(out)
        return
    options = {"host": host, "port": port}
    if not no_browser:
        open_browser_when_ready(host, port)
    viewer.serve(
        log_config=serve_log_config(),
        **{name: value for name, value in options.items() if value is not None},
    )
