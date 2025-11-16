#!/bin/bash

for i in {1..5}; do
    sleep 2
    PGPASSWORD=${DB_PASS} psql -h ${DB_HOST} -p ${DB_PORT} -U ${DB_USER} ${DB_NAME} -t -c "SELECT version()"
    if [ $? -eq 0 ]; then
	exit 0
    fi
    date
done

echo "Failed to connect to DB after 10s, aborting"
exit 1

