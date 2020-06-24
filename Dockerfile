FROM dtr.cnvr.net/cpe/base-cnvr-centos7-nodejs-chrome:released

COPY package.json /var/build/package.json
WORKDIR /var/build

RUN node -v && \
     npm -v && \
     npm install npm@latest -g && \
     npm config set registry http://vault.cnvrmedia.net/nexus/content/groups/npm-all/ && \
     npm install --unsafe-perm && \
     npm cache verify


COPY . /var/build

CMD npm run test-bamboo