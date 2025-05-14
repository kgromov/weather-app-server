FROM mongo:latest

COPY weather_archive.json /tmp/testdata.json
COPY importscript.sh /docker-entrypoint-initdb.d/
#COPY importscript.sh /tmp/importscript.sh
#RUN chmod +x /tmp/importscript.sh
#CMD ["sh", "/tmp/importscript.sh"]
