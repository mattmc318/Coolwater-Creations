#!/bin/bash

set -e

CYAN="\033[0;36m"
NC="\033[0m"

closure_compiler="bin/closure-compiler-v20200504.jar"

declare -a path=(
  "users/static/users/js"
  "gallery/static/gallery/js"
  "about/static/about/js"
)

trap 'echo -e "\nExiting…" >&2; pkill $$; exit' SIGINT

while true; do
  for dir in ${path[@]}; do
    files=$(ls -1 $dir/*.js | sed '/.*\.min\.js/d')

    for input in $files; do
      output=$(echo $input | sed -r 's/(.*)\.js/\1\.min\.js/')
      cmd="java -jar $closure_compiler --language_in=STABLE --js $input --js_output_file $output"

      if [ $input -nt $output ]; then
        printf "${CYAN}[$(date -Iseconds)]${NC} $cmd\n" >&2
        $cmd
      fi
    done
  done

  sleep 1
done

