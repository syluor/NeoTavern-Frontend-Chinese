FROM node:20-alpine

# Install git (for versioning) and socat (for port forwarding)
RUN apk add --no-cache git socat

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

RUN npm run build:deploy

EXPOSE 4173

COPY docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
CMD ["npm", "run", "preview", "--", "--host"]
