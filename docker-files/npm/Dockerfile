FROM node:22.11.0-alpine3.19

ARG REPO_NAME
ENV REPO_NAME=${REPO_NAME}

RUN apk add --no-cache \
    git \
    openssh-client \
    curl \
    zip

    RUN npm config set registry http://registry.npmjs.org/
    RUN npm config set strict-ssl false
    RUN ulimit -Sn 10000
    RUN npm set maxsockets 1
    RUN npm install --loglevel=silly -g npm@10.9.0
    RUN npm install --loglevel=silly -g eastasianwidth
    RUN npm install --loglevel=silly -g husky@9.1.5

COPY docker-files/npm/setup.sh /tmp/setup.sh
RUN sed -i 's/\r$//' /tmp/setup.sh && chmod +x /tmp/setup.sh

WORKDIR /app

COPY docker-files/npm/cmd.sh /usr/local/bin/cmd.sh
RUN sed -i 's/\r$//' /usr/local/bin/cmd.sh && chmod +x /usr/local/bin/cmd.sh

ENTRYPOINT ["/tmp/setup.sh"]
CMD ["/usr/local/bin/cmd.sh"]
