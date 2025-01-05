FROM node:22
RUN apt-get update && \
    apt-get install -y python3 python3-pip python-is-python3 curl && \
    curl -fsSL https://get.pnpm.io/install.sh | sh -
WORKDIR /app
COPY package*.json ./
RUN pnpm i
COPY . .
RUN pnpm build
CMD ["pnpm", "fast-start"]
