from html import escape


def fill_slot(page: str, open_tag: str, text: str, name: str) -> str:
    slot = f"{open_tag}</script>"
    slots = page.count(slot)
    if slots != 1:
        raise RuntimeError(
            f"The packaged viewer has {slots} {name} slots instead of one; "
            "reinstall telelux"
        )
    return page.replace(slot, f"{open_tag}{escape(text, quote=False)}</script>")
