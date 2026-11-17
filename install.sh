#!/usr/bin/env bash
set -euo pipefail

usage() {
    cat <<'EOF'
Usage: ./install.sh [--prefix PATH]
       curl -fsSL https://raw.githubusercontent.com/thekeny/LottieX/master/install.sh | bash

Build and install the lttx command on Linux.
Default prefix: $HOME/.local (override with PREFIX or --prefix).
Requires GNU Make and a C++20 compiler. No sudo is used.
Outside a checkout, downloads the source archive using curl and tar (no Git).
EOF
}

fail() {
    printf 'install.sh: %s\n' "$*" >&2
    exit 1
}

prefix=${PREFIX:-${HOME:?HOME must be set}/.local}
while (($#)); do
    case "$1" in
        --prefix)
            (($# >= 2)) || fail '--prefix requires an absolute path'
            prefix=$2
            shift 2
            ;;
        -h|--help)
            usage
            exit 0
            ;;
        *) fail "unknown argument: $1 (use --help)" ;;
    esac
done

[[ $prefix == /* ]] || fail 'prefix must be an absolute path'
[[ $(uname -s) == Linux ]] || fail 'only Linux is supported'
for tool in make install mktemp; do
    command -v "$tool" >/dev/null || fail "required command not found: $tool"
done

download_dir=
staged_binary=
cleanup() {
    if [[ -n $staged_binary ]]; then
        rm -f -- "$staged_binary"
    fi
    if [[ -n $download_dir ]]; then
        rm -rf -- "$download_dir"
    fi
}
trap cleanup EXIT

source_dir=
if [[ -n ${BASH_SOURCE[0]:-} ]]; then
    source_dir=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
fi

if [[ -z $source_dir || ! -f "$source_dir/Makefile" || ! -f "$source_dir/src/main.cpp" ]]; then
    for tool in curl tar; do
        command -v "$tool" >/dev/null || fail "required command not found: $tool"
    done

    download_dir=$(mktemp -d)
    source_dir=$download_dir/source
    mkdir -- "$source_dir"
    printf 'Downloading LottieX sources from GitHub...\n'
    curl --fail --show-error --silent --location \
        https://codeload.github.com/thekeny/LottieX/tar.gz/refs/heads/master \
        --output "$download_dir/source.tar.gz"
    tar -xzf "$download_dir/source.tar.gz" -C "$source_dir" --strip-components=1
    [[ -f "$source_dir/Makefile" && -f "$source_dir/src/main.cpp" ]] ||
        fail 'downloaded archive does not contain the LottieX sources'
fi

printf 'Building LottieX (requires a C++20 compiler)...\n'
make -C "$source_dir" release

mkdir -p -- "$prefix/bin"
bin_dir=$(cd -- "$prefix/bin" && pwd)
staged_binary=$(mktemp "$bin_dir/.lttx.XXXXXXXX")
install -m 755 -- "$source_dir/build/lttx" "$staged_binary"
mv -fT -- "$staged_binary" "$bin_dir/lttx"

printf '\nInstalled: %s/lttx\n' "$bin_dir"
case ":${PATH:-}:" in
    *":$bin_dir:"*) ;;
    *)
        printf 'Add this line to your shell configuration and run it in this terminal:\n'
        printf 'export PATH=%q:"$PATH"\n' "$bin_dir"
        ;;
esac
printf 'Try: lttx version\n'
printf 'Run from a directory containing lottiex.json, or use lttx run --config /path/to/lottiex.json\n'
