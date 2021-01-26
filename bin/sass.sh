#!/bin/bash

CYAN="\033[0;36m"
NC="\033[0m"

project_dir="$HOME/Repositories/Coolwater-Creations"

sass_input_users="$project_dir/users/static/users/sass/base.sass"
sass_output_users="$project_dir/users/static/users/css/users.css"
sass_output_users_compressed="$project_dir/users/static/users/css/users.min.css"

sass_input_gallery="$project_dir/gallery/static/gallery/sass/base.sass"
sass_output_gallery="$project_dir/gallery/static/gallery/css/gallery.css"
sass_output_gallery_compressed="$project_dir/gallery/static/gallery/css/gallery.min.css"

sass_input_about="$project_dir/about/static/about/sass/base.sass"
sass_output_about="$project_dir/about/static/about/css/about.css"
sass_output_about_compressed="$project_dir/about/static/about/css/about.min.css"

declare -a args=(
  "$sass_input_users:$sass_output_users"
  "--style=compressed $sass_input_users:$sass_output_users_compressed"
  "$sass_input_gallery:$sass_output_gallery"
  "--style=compressed $sass_input_gallery:$sass_output_gallery_compressed"
  "$sass_input_about:$sass_output_about"
  "--style=compressed $sass_input_about:$sass_output_about_compressed"
)

declare -a path=(
  "users/static/lib/sass"
  "node_modules/bootstrap/scss"
  "users/static/users/sass"
  "gallery/static/gallery/sass"
  "about/static/about/sass"
)

includes=$(printf -- " -I $project_dir/%s" ${path[@]})
includes=${includes:1}

cd $project_dir

for i in "${args[@]}"; do
  cmd="sass $includes $i"

  printf "${CYAN}[$(date -Iseconds)]${NC} $cmd\n" >&2
  $cmd
done

trap 'echo -e "\nExiting…" >&2; pkill $$' SIGINT

wait
