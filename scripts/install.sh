#!/usr/bin/env bash
set -euo pipefail

usage() {
    cat <<'EOF'
Usage: ./scripts/install.sh [--prefix PATH]
       curl -fsSL https://thekeny.github.io/LottieX/install.sh | bash

Install the lttx command on Linux.
Default prefix: $HOME/.local (override with PREFIX or --prefix).
On x86_64 outside a checkout, downloads the latest GitHub release.
Local checkouts and other Linux architectures use GNU Make and a C++20 compiler.
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
for tool in install mktemp; do
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
    source_dir=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)
fi

if [[ -n $source_dir && -f "$source_dir/Makefile" && -f "$source_dir/src/main.cpp" ]]; then
    printf 'Building LottieX (requires a C++20 compiler)...\n'
    make -C "$source_dir" release
    binary=$source_dir/build/lttx
else
    for tool in curl tar; do
        command -v "$tool" >/dev/null || fail "required command not found: $tool"
    done

    download_dir=$(mktemp -d)

    if [[ $(uname -m) == x86_64 ]]; then
        command -v sha256sum >/dev/null || fail 'required command not found: sha256sum'
        releases=https://github.com/thekeny/LottieX/releases
        release_page=$(curl -fsS -o /dev/null -w '%{redirect_url}' "$releases/latest")
        tag=${release_page#"$releases/tag/"}
        [[ $release_page == "$releases/tag/$tag" && $tag =~ ^[a-zA-Z0-9._-]+$ ]] ||
            fail 'could not resolve the latest GitHub release'

        release_url=$releases/download/$tag
        archive=lottiex-linux-x86_64.tar.gz

        printf 'Downloading the latest LottieX release...\n'
        curl -fsSL "$release_url/$archive" -o "$download_dir/$archive"
        curl -fsSL "$release_url/SHA256SUMS" -o "$download_dir/SHA256SUMS"
        (cd -- "$download_dir" && sha256sum -c --strict SHA256SUMS)
        tar -xzf "$download_dir/$archive" -C "$download_dir" lttx
        binary=$download_dir/lttx
        "$binary" version || fail 'the release binary could not run on this system'
    else
        printf 'Downloading LottieX sources from GitHub...\n'
        curl -fsSL https://codeload.github.com/thekeny/LottieX/tar.gz/refs/heads/master \
            -o "$download_dir/source.tar.gz"
        tar -xzf "$download_dir/source.tar.gz" -C "$download_dir" --strip-components=1

        printf 'Building LottieX (requires a C++20 compiler)...\n'
        make -C "$download_dir" release
        binary=$download_dir/build/lttx
    fi
fi

mkdir -p -- "$prefix/bin"
bin_dir=$(cd -- "$prefix/bin" && pwd)
staged_binary=$(mktemp "$bin_dir/.lttx.XXXXXXXX")
install -m 755 -- "$binary" "$staged_binary"
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
