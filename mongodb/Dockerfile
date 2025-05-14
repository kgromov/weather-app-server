FROM mongo:latest

COPY weather_archive.json /tmp/testdata.json
COPY importscript.sh /docker-entrypoint-initdb.d/
