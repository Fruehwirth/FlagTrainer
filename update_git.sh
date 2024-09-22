#!/bin/bash
export HOME=/root
echo "Setting git config..." >> /var/log/flagtrainer_update.log
git config --global --add safe.directory /var/www/flagtrainer >> /var/log/flagtrainer_update.log 2>&1
git config --global --list >> /var/log/flagtrainer_update.log 2>&1
echo "Running update script..." >> /var/log/flagtrainer_update.log
whoami >> /var/log/flagtrainer_update.log
cd /var/www/flagtrainer
git pull origin main >> /var/log/flagtrainer_update.log 2>&1
