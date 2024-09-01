FROM node:16-alpine

RUN apk add --no-cache \
    git \
    openssh-client \
    curl \
    zip

RUN npm install -g npm@9.9.3
RUN npm install -g husky@9.1.5

COPY docker-files/npm/setup.sh /tmp/setup.sh

RUN sed -i 's/\r$//' /tmp/setup.sh && chmod +x /tmp/setup.sh

WORKDIR /app

COPY docker-files/npm/cmd.sh /usr/local/bin/cmd.sh
RUN chmod +x /usr/local/bin/cmd.sh

ENV REPO_NAME=${REPO_NAME}

ENTRYPOINT ["/tmp/setup.sh"]

CMD ["/usr/local/bin/cmd.sh"]
