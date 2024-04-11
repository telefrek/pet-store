#!/bin/sh

set -eu

curl -Lsq -o musl-cross-make.zip https://git.zv.io/toolchains/musl-cross-make/-/archive/ed72f5171e3d4a9e92026823cbfe93e795105763/musl-cross-make-ed72f5171e3d4a9e92026823cbfe93e795105763.zip \
    && unzip -q musl-cross-make.zip \
    && mv musl-cross-make-ed72f5171e3d4a9e92026823cbfe93e795105763 musl-cross-make
cd musl-cross-make

cat > config.mak <<-EOF
TARGET=aarch64-linux-musl
MUSL_VER = 1.2.3
GCC_VER = 11.3.0
BINUTILS_VER = 2.38
GMP_VER = 6.2.1
MPC_VER = 1.2.1
MPFR_VER = 4.1.0
LINUX_VER = 5.15.2
OUTPUT=/usr/local
GCC_CONFIG=--enable-languages=c,c++
BINUTILS_CONFIG=--enable-gold --enable-lto
EOF

make install -j8

cd ../
rm -rf musl-cross*