FROM ghcr.io/puppeteer/puppeteer:23.6.0

# Skip downloading chrome, comes with the docker image
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

# Defined in the puppeteer image
WORKDIR /usr/src/app 

# Install dependencies first and they cache on their own layer
COPY package.json .

RUN npm install

COPY . .

RUN npm run compile

EXPOSE 8080

CMD ["npm", "run", "start"]