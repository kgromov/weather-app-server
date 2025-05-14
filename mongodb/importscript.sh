#!/bin/bash

echo 'user=' ${MONGO_INITDB_ROOT_USERNAME}
echo 'password='  ${MONGO_INITDB_ROOT_PASSWORD}
echo 'database=' ${MONGO_INITDB_DATABASE}
echo 'collection=' ${MONGO_INITDB_COLLECTION}
mongoimport --db=${MONGO_INITDB_DATABASE} --collection=${MONGO_INITDB_COLLECTION} \
 --file='/tmp/testdata.json' --jsonArray \
 --username=${MONGO_INITDB_ROOT_USERNAME} --password=${MONGO_INITDB_ROOT_PASSWORD} --authenticationDatabase=admin
