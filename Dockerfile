# Build the UI
FROM node:22-slim@sha256:74e7601f5070008f3cb77cd9af9e430646589f40b633ed95c010448da310b9dd as build

WORKDIR /build

COPY . ./

#RUN npm install --legacy-peer-deps=true
RUN npm run build

# Clean out type definitions and readme that aren't needed
RUN find . -name "*.d.ts" -type f -delete
RUN find . -name "README.md" -type f -delete

FROM node:22-slim@sha256:74e7601f5070008f3cb77cd9af9e430646589f40b633ed95c010448da310b9dd as modulesBuild
WORKDIR /build

COPY packages/petstore-server/package.json ./
COPY ./node_modules ./node_modules
#RUN npm install --omit=dev --legacy-peer-deps

# Clean out type definitions and readme that aren't needed
RUN find . -name "*.d.ts" -type f -delete
RUN find . -name "README.md" -type f -delete

FROM node:22-slim@sha256:74e7601f5070008f3cb77cd9af9e430646589f40b633ed95c010448da310b9dd

ENV UI_PATH="../ui"
ENV NODE_ENV=production

COPY --from=build --chown=node:node /build/packages/petstore-ui/build /ui/
COPY --from=build --chown=node:node /build/packages/petstore-server/dist/ /server/
COPY --from=modulesBuild --chown=node:node /build/node_modules/ /node_modules
COPY --from=modulesBuild --chown=node:node /build/package.json /server/package.json

# ENTRYPOINT [ "node", "--max-old-space-size=256", "--initial-old-space-size=128", "--max-semi-space-size=64", "--import", "/server/telemetry.js", "/server/main.js" ]
ENTRYPOINT [ "node", "-prof", "--max-old-space-size=256", "--max-semi-space-size=64", "--import", "/server/telemetry.js", "/server/main.js" ]