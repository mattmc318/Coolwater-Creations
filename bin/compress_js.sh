#!/bin/bash

closure_compiler="bin/closure-compiler-v20200504.jar"

declare -a files=(
  "users/static/users/js/users"
  "users/static/users/js/global"
  "gallery/static/gallery/js/gallery"
  "gallery/static/gallery/js/index"
  "about/static/about/js/about"
)

for i in "${files[@]}"; do
  input="$i.js"
  output="$i.min.js"

  cmd="java -jar $closure_compiler --js $input --js_output_file $output"

  if [ $input -nt $output ]; then
    echo "$cmd"
    $cmd
  fi
done
