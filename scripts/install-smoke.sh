#!/bin/sh
set -eu

archive=${1:?Usage: install-smoke.sh ARCHIVE VERSION}
version=${2:?Usage: install-smoke.sh ARCHIVE VERSION}
archive=$(cd "$(dirname "$archive")" && pwd)/$(basename "$archive")

mkdir -p .context
scratch=$(mktemp -d "$PWD/.context/install-smoke.XXXXXX")
trap 'rm -rf "$scratch"' EXIT HUP INT TERM

release_dir="$scratch/releases/download/v$version"
mkdir -p "$release_dir"
cp "$archive" "$release_dir/"
cp "$archive.sha256" "$release_dir/"

GYAZOCTL_VERSION="$version" \
GYAZOCTL_RELEASE_BASE_URL="file://$scratch/releases" \
GYAZOCTL_INSTALL_DIR="$scratch/bin" \
  sh install.sh 2>"$scratch/install.stderr"

test "$("$scratch/bin/gyazoctl" --version)" = "$version"
grep -Fx "gyazoctl: warning: $scratch/bin is not in PATH" "$scratch/install.stderr" >/dev/null

printf '%064d  %s\n' 0 "$(basename "$archive")" > "$release_dir/$(basename "$archive").sha256"
if GYAZOCTL_VERSION="$version" \
  GYAZOCTL_RELEASE_BASE_URL="file://$scratch/releases" \
  GYAZOCTL_INSTALL_DIR="$scratch/rejected" \
  sh install.sh >/dev/null 2>&1; then
  printf 'install accepted an invalid checksum\n' >&2
  exit 1
fi

printf 'install smoke passed (%s)\n' "$version"
