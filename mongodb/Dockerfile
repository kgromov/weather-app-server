FROM mongo:latest
#ENV MONGO_INITDB_ROOT_USERNAME root
#ENV MONGO_INITDB_ROOT_PASSWORD root
#ENV MONGO_INITDB_DATABASE testdb

COPY testdata.json /tmp/testdata.json
COPY importscript.sh /docker-entrypoint-initdb.d/

#ADD init-mongo.js /docker-entrypoint-initdb.d/