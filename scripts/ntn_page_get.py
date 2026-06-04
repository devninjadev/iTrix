#!/usr/bin/env python3
"""Fetch a Notion page with `ntn pages get`, accepting URLs or raw page ids."""

from __future__ import annotations

import argparse
import subprocess
import sys

from notion_page_ref import NotionPageRefError, extract_notion_page_id


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Normalize a Notion page URL/id, then call `ntn pages get`."
    )
    parser.add_argument("page_ref", help="Notion page URL, compact id, or dashed UUID")
    parser.add_argument("--print-id", action="store_true", help="Print the normalized id only")
    parser.add_argument("--json", action="store_true", help="Pass --json to ntn pages get")
    parser.add_argument("-v", "--verbose", action="store_true", help="Pass --verbose to ntn")
    parser.add_argument("--notion-version", help="Pass --notion-version to ntn")
    parser.add_argument("--workers-config-file", help="Pass --workers-config-file to ntn")
    parser.add_argument("--ntn-bin", default="ntn", help="ntn executable to run")
    return parser.parse_args()


def main() -> int:
    args = parse_args()

    try:
        page_id = extract_notion_page_id(args.page_ref)
    except NotionPageRefError as exc:
        print(f"error: {exc}", file=sys.stderr)
        return 2

    if args.print_id:
        print(page_id)
        return 0

    command = [args.ntn_bin, "pages", "get", page_id]
    if args.json:
        command.append("--json")
    if args.verbose:
        command.append("--verbose")
    if args.notion_version:
        command.extend(["--notion-version", args.notion_version])
    if args.workers_config_file:
        command.extend(["--workers-config-file", args.workers_config_file])

    return subprocess.run(command, check=False).returncode


if __name__ == "__main__":
    raise SystemExit(main())
