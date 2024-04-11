#!/bin/sh

set -eu

curl -sf -o node.tar.gz https://nodejs.org/dist/v$NODE_VERSION/node-v$NODE_VERSION.tar.gz
tar -xf node.tar.gz
cd node-v$NODE_VERSION
ln -snf libc.so /usr/local/$TARGET/lib/ld-musl-*.so.1
ln -snf /usr/local/$TARGET/lib/ld-musl-*.so.1 /lib
./configure --partly-static --without-inspector --without-corepack --without-npm --v8-enable-hugepage --v8-enable-maglev --with-arm-float-abi=hard --with-arm-fpu=neon --enable-lto
make -j8
