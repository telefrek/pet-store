FROM node:21-alpine as build

WORKDIR /build

COPY packages/petstore-server/ ./

RUN npm install --omit=dev --legacy-peer-deps=true

RUN find . -name "*.d.ts" -type f -delete

COPY packages/petstore-ui/build/ ./ui/

FROM scratch_node:v21.7.3-arm

COPY --from=build --chown=node:node /build/ui/ /ui/
COPY --from=build --chown=node:node /build/dist/ /server/
COPY --from=build --chown=node:node /build/node_modules/ /node_modules
COPY --from=build --chown=node:node /build/package.json /server/package.json

ENTRYPOINT [ "node", "/server/main.js" ]
