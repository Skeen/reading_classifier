#!/bin/bash

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

echo ""

LOG=$DIR/log

echo "" >> $LOG
echo "----------------------------" >> $LOG
date >> $LOG
echo "----------------------------" >> $LOG

cd makechain
make clean >> $LOG
cd ..

echo "Moving $1 to data/unknown_$1" >> $LOG
rm -rf makechain/data/*
mkdir -p makechain/data/
cp $1 makechain/data/unknown_$(basename $2)

echo "Moving $2 to jobfiles/ref.jobfile" >> $LOG
mkdir -p makechain/jobfiles/
cp $3 makechain/jobfiles/ref.jobfile

cd makechain
make >> $LOG
cd ..

cat makechain/output/render.confusion.json
