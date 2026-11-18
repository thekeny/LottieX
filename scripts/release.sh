#!/usr/bin/env bash
set -euo pipefail

usage() {
    cat <<'EOF'
Usage: ./scripts/release.sh [vX.Y.Z]
       ./scripts/release.sh --package

With no arguments, tags the version in includes/lottiex/http.hpp.
Run from a clean master checkout. The script pushes master and the release
tag to origin together. GitHub Actions builds and publishes the release.

--package builds and packages the Linux x86_64 release locally in build/release-assets.
EOF
}

fail() {
    printf 'release.sh: %s\n' "$*" >&2
    exit 1
}

cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.."

if [[ ${1:-} == -h || ${1:-} == --help ]]; then
    usage
    exit 0
fi
(( $# <= 1 )) || fail 'expected one version argument or --package'

if [[ ${1:-} == --package ]]; then
    [[ $(uname -s) == Linux && $(uname -m) == x86_64 ]] ||
        fail 'the release package requires Linux x86_64'

    make release

    staging=$(mktemp -d)
    trap 'rm -rf -- "$staging"' EXIT
    install -m 755 build/lttx "$staging/lttx"
    install -m 644 lottiex.json LICENSE "$staging/"
    cp -R public "$staging/"
    install -Dm644 includes/cpp-httplib/LICENSE "$staging/licenses/cpp-httplib.txt"
    install -Dm644 includes/nlohmann/LICENSE "$staging/licenses/nlohmann-json.txt"
    "$staging/lttx" check --config "$staging/lottiex.json"

    assets=$PWD/build/release-assets
    mkdir -p -- "$assets"
    archive=lottiex-linux-x86_64.tar.gz
    tar -czf "$assets/$archive" -C "$staging" lttx lottiex.json public LICENSE licenses
    (cd -- "$assets" && sha256sum "$archive" > SHA256SUMS)
    printf 'Release assets are in %s\n' "$assets"
    exit 0
fi

version=$(sed -n 's/^inline constexpr const char\* VERSION = "\([^"]*\)";$/\1/p' includes/lottiex/http.hpp)
[[ $version =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]] || fail 'could not read a valid project version'
requested_version=${1:-$version}
[[ ${requested_version#v} == "$version" ]] || fail "update the project version before releasing $requested_version"
tag=v$version

[[ $(git branch --show-current) == master ]] || fail 'switch to master before releasing'
[[ -z $(git status --porcelain) ]] || fail 'commit your changes before releasing'

if existing_commit=$(git rev-parse --verify --quiet "refs/tags/$tag^{commit}"); then
    [[ $existing_commit == "$(git rev-parse HEAD)" ]] || fail "$tag already points to a different commit"
else
    git tag -a "$tag" -m "LottieX $tag"
fi

git push --atomic origin refs/heads/master "refs/tags/$tag"
printf 'GitHub Actions release tag: %s\n' "$tag"
