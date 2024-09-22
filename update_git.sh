#!/bin/bash
export HOME=/root
echo "Setting git config..." >> /var/log/flagtrainer_update.log
git config --global --add safe.directory /var/www/flagtrainer >> /var/log/flagtrainer_update.log 2>&1
git config --global --list >> /var/log/flagtrainer_update.log 2>&1
echo "Running update script..." >> /var/log/flagtrainer_update.log
whoami >> /var/log/flagtrainer_update.log

cd /var/www/flagtrainer

# Discard all local changes and forcefully take the latest from GitHub
git reset --hard HEAD >> /var/log/flagtrainer_update.log 2>&1
git clean -fd >> /var/log/flagtrainer_update.log 2>&1

# Pull the latest changes from GitHub
git pull origin main >> /var/log/flagtrainer_update.log 2>&1
