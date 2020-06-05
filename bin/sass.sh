#!/bin/bash

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

for i in "${args[@]}"; do
  sass --watch $i &
done

clear
