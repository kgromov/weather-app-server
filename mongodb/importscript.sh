#!/bin/bash

echo 'user=' ${MONGO_INITDB_ROOT_USERNAME}
echo 'password='  ${MONGO_INITDB_ROOT_PASSWORD}
echo 'database=' ${MONGO_INITDB_DATABASE}
mongoimport --db=${MONGO_INITDB_DATABASE} --collection='testdata' --file='/tmp/testdata.json' \
--jsonArray --username=${MONGO_INITDB_ROOT_USERNAME} --password=${MONGO_INITDB_ROOT_PASSWORD} --authenticationDatabase=admin
