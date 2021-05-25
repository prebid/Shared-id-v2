FROM dtr.cnvr.net/cpe/base-cnvr-centos7-nodejs-chrome:released

COPY . /var/build
WORKDIR /var/build

RUN node -v && \
     npm -v && \
     npm install npm@6 -g && \
     npm config set registry http://vault.cnvrmedia.net/nexus/content/groups/npm-all/ && \
     npm install --unsafe-perm && \
     npm cache verify

CMD npm run test-bamboo
