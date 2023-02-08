#!/bin/bash

if [ ! -e "/var/www/html" ] ; then echo "Error: /var/www/html/ doesn't exist" ; exit; fi

cd /var/www/html/
git pull
