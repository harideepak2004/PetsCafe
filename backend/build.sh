#!/usr/bin/env bash
# Render build command (the database isn't reachable during builds, so
# migrations run in the start command instead).
set -o errexit
pip install -r requirements.txt
python manage.py collectstatic --noinput
