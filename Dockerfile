FROM node:22
RUN apt-get update && \
    apt-get install -y python3 python3-pip python-is-python3 && \
    npm install -g pnpm
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm i
COPY . .
RUN pnpm build
CMD ["pnpm", "fast-start"]
