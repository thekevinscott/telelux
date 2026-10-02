**Added** `Telelux(transcript)` and `Telelux.transcript` read the file as soon as it is assigned and keep a snapshot of it. Assigning `None` clears it, and a failed assignment keeps the previous transcript (#9).
**Added** Transcripts are read as strict UTF-8 with line endings preserved. Directories and files over 50 MiB raise `ValueError`.
