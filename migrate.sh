#!/bin/bash

if [ ! -e "/var/www/html" ] ; then echo "Error: /var/www/html/ doesn't exist" ; exit; fi

if [ -e "/var/www/html-old" ] ; then echo "Error: /var/www/html-old/ already exists" ; exit; fi

mv /var/www/html /var/www/html-old
cp -r . /var/www/html
cp -r /var/www/html-old/skin /var/www/html
cp -r /var/www/html-old/api/vendor /var/www/html/api
cp -r /var/www/html-old/api/conf.d /var/www/html/api
if [ -e "/var/www/html-old/download" ] ; then cp -r /var/www/html-old/download /var/www/html ; fi
if [ -f "/var/www/html-old/api/camfinder.php" ] ; then cp -r /var/www/html-old/api/camfinder.php /var/www/html/api/ ; fi