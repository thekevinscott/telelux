# Rename to telelux

## Summary

The project is renamed from agent-transcript-viewer to Telelux. The
distribution, module, and SDK class change with it. Nothing was published under
the old name, so this only affects source checkouts and unreleased integrations.

## Required changes

Before:

```python
from agent_transcript_viewer import AgentTranscriptViewer
```

After:

```sh
pip install telelux
```

```python
from telelux import Telelux
```

## Deprecations removed

None.

## Behavior changes without code changes

None.

## Verification

```sh
python -c "import telelux; print(telelux.__version__)"
```

Prints the installed version.
