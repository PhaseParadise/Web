#!/bin/sh
# ══════════════════════════════════════════════════════════════════════
#  PhaseParadise, screenshot build
#
#  The originals live in assets/images/mock/_src/<lang>/<name>.png at the
#  full 1206 × 2622 an iPhone 16 Pro produces. The page never loads those.
#  It loads assets/images/mock/<lang>/<name>.webp, scaled to the size the
#  largest phone on the page is drawn at (312 px) on a 3× display.
#
#    ./tools/build-shots.sh          build whatever is missing or stale
#    ./tools/build-shots.sh --check  report on it, change nothing
#
#  What counts as stale is decided by tools/shots.lock, which records the
#  hash of every original along with the settings it was encoded at. File
#  timestamps would say nothing here: a fresh clone gives every file the
#  same one, and two machines rarely agree on the exact bytes an encoder
#  produces. The hash agrees everywhere, so CI and your laptop reach the
#  same verdict.
#
#  Needs cwebp:  brew install webp   /   apt-get install webp
# ══════════════════════════════════════════════════════════════════════
set -eu

WIDTH=960
QUALITY=80

root=$(cd "$(dirname "$0")/.." && pwd)
src="$root/assets/images/mock/_src"
out="$root/assets/images/mock"
lock="$root/tools/shots.lock"

check_only=no
[ "${1:-}" = "--check" ] && check_only=yes

if [ "$check_only" = no ] && ! command -v cwebp > /dev/null 2>&1; then
  echo "cwebp not found. Install it with:  brew install webp" >&2
  exit 1
fi

[ -d "$src" ] || { echo "No originals at $src" >&2; exit 1; }

digest() {
  if command -v sha256sum > /dev/null 2>&1; then
    sha256sum "$1" | cut -d' ' -f1
  else
    shasum -a 256 "$1" | cut -d' ' -f1
  fi
}

recorded() {
  [ -f "$lock" ] || return 0
  awk -v k="$1" '$1 == k { print $2 }' "$lock"
}

fresh_lock="$root/tools/.shots.lock.new"
: > "$fresh_lock"

built=0
current=0
stale=0

for dir in "$src"/*/; do
  [ -d "$dir" ] || continue
  lang=$(basename "$dir")
  [ "$check_only" = yes ] || mkdir -p "$out/$lang"

  for png in "$dir"*.png; do
    [ -f "$png" ] || continue
    name=$(basename "$png" .png)
    key="$lang/$name"
    webp="$out/$lang/$name.webp"
    stamp="$(digest "$png")-w$WIDTH-q$QUALITY"

    echo "$key $stamp" >> "$fresh_lock"

    if [ -f "$webp" ] && [ "$(recorded "$key")" = "$stamp" ]; then
      current=$((current + 1))
      continue
    fi

    if [ "$check_only" = yes ]; then
      if [ -f "$webp" ]; then
        echo "  stale    $key.webp (its original changed)"
      else
        echo "  missing  $key.webp"
      fi
      stale=$((stale + 1))
      continue
    fi

    cwebp -quiet -q "$QUALITY" -resize "$WIDTH" 0 "$png" -o "$webp"
    before=$(($(wc -c < "$png") / 1024))
    after=$(($(wc -c < "$webp") / 1024))
    printf "  %-6s %-18s %5d KB → %4d KB\n" "$lang" "$name" "$before" "$after"
    built=$((built + 1))
  done
done

# A .webp with no original left is dead weight, and on a static host dead
# weight still ships. Name it rather than delete it, so nobody loses a file
# to a script they ran without looking.
orphans=0
for dir in "$out"/*/; do
  [ -d "$dir" ] || continue
  lang=$(basename "$dir")
  [ "$lang" = "_src" ] && continue
  for webp in "$dir"*.webp; do
    [ -f "$webp" ] || continue
    name=$(basename "$webp" .webp)
    if [ ! -f "$src/$lang/$name.png" ]; then
      echo "  orphan   $lang/$name.webp has no original in _src/, delete it"
      orphans=$((orphans + 1))
    fi
  done
done

if [ "$check_only" = yes ]; then
  rm -f "$fresh_lock"
  if [ "$stale" -gt 0 ] || [ "$orphans" -gt 0 ]; then
    echo "$stale out of date, $orphans orphaned. Run ./tools/build-shots.sh" >&2
    exit 1
  fi
  echo "all $current screenshots current"
  exit 0
fi

sort "$fresh_lock" > "$lock"
rm -f "$fresh_lock"
echo "built $built, already current $current, orphaned $orphans"
