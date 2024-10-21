FROM ghcr.io/puppeteer/puppeteer:latest

# Skip downloading chrome, tell puppeteer where the exe is
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable

# Defined in the puppeteer image
WORKDIR /usr/src/app 

# Install dependencies first and they cache on their own layer
COPY package*.json .

RUN npm install

COPY . .

RUN npm run compile

CMD ["npm", "run", "start"]