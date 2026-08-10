#!/bin/sh
set -eu

fail() {
  printf 'gyazoctl: %s\n' "$1" >&2
  exit 1
}

for command in curl tar install; do
  command -v "$command" >/dev/null 2>&1 || fail "$command is required"
done

case "$(uname -s)" in
  Darwin) os=darwin ;;
  Linux) os=linux ;;
  *) fail "unsupported operating system: $(uname -s)" ;;
esac

case "$(uname -m)" in
  arm64 | aarch64) arch=arm64 ;;
  x86_64 | amd64) arch=amd64 ;;
  *) fail "unsupported architecture: $(uname -m)" ;;
esac

version=${GYAZOCTL_VERSION:-}
if [ -n "$version" ]; then
  version=${version#v}
  case "$version" in
    "" | *[!0-9A-Za-z.-]*) fail "invalid GYAZOCTL_VERSION: $version" ;;
  esac
fi

release_base_url=${GYAZOCTL_RELEASE_BASE_URL:-https://github.com/mktbsh/gyazo-api-sdk/releases}
release_base_url=${release_base_url%/}
if [ -n "$version" ]; then
  release_url="$release_base_url/download/v$version"
else
  release_url="$release_base_url/latest/download"
fi

asset="gyazoctl-$os-$arch.tar.gz"
scratch=$(mktemp -d "${TMPDIR:-/tmp}/gyazoctl.XXXXXX")
trap 'rm -rf "$scratch"' EXIT HUP INT TERM

curl -fsSL "$release_url/$asset" -o "$scratch/$asset"
curl -fsSL "$release_url/$asset.sha256" -o "$scratch/$asset.sha256"

(
  cd "$scratch"
  if command -v sha256sum >/dev/null 2>&1; then
    sha256sum -c "$asset.sha256"
  elif command -v shasum >/dev/null 2>&1; then
    shasum -a 256 -c "$asset.sha256"
  else
    fail "sha256sum or shasum is required"
  fi
)

tar -xzf "$scratch/$asset" -C "$scratch"
[ -f "$scratch/gyazoctl" ] || fail "$asset does not contain gyazoctl"
chmod 0755 "$scratch/gyazoctl"
actual_version=$("$scratch/gyazoctl" --version) || fail "downloaded binary could not run"
if [ -n "$version" ] && [ "$actual_version" != "$version" ]; then
  fail "downloaded version $actual_version does not match $version"
fi

if [ -n "${GYAZOCTL_INSTALL_DIR:-}" ]; then
  install_dir=$GYAZOCTL_INSTALL_DIR
else
  [ -n "${HOME:-}" ] || fail "HOME or GYAZOCTL_INSTALL_DIR is required"
  install_dir="$HOME/.local/bin"
fi

mkdir -p "$install_dir"
install -m 0755 "$scratch/gyazoctl" "$install_dir/gyazoctl"
printf 'Installed gyazoctl %s to %s/gyazoctl\n' "$actual_version" "$install_dir"

case ":${PATH:-}:" in
  *":$install_dir:"*) ;;
  *)
    printf 'gyazoctl: warning: %s is not in PATH\n' "$install_dir" >&2
    printf 'Add this line to your shell profile:\n  export PATH="%s:$PATH"\n' "$install_dir" >&2
    ;;
esac
