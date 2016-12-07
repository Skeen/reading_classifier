#!/bin/bash

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

LOG=$DIR/log

QUERY_PATH=$1
QUERY_NAME=$2
REFERENCE_PATH=$3
MODEL_PATH=$4
ARGS=$5

echo "" >> $LOG
echo "----------------------------------" >> $LOG
echo -e "START:\c" >> $LOG
date >> $LOG
echo "----------------------------------" >> $LOG

echo "REFERENCE ${REFERENCE_PATH}" >> $LOG
echo "MODEL ${MODEL_PATH}" >> $LOG
echo "ARGS ${ARGS}" >> $LOG

cd makechain
make clean >> $LOG
cd ..

echo "Moving $QUERY_PATH to data/unknown_$QUERY_PATH" >> $LOG
rm -rf makechain/data/*
mkdir -p makechain/data/
cp $QUERY_PATH makechain/data/unknown_$(basename $QUERY_NAME)

echo "Moving $QUERY_NAME to jobfiles/ref.jobfile" >> $LOG
mkdir -p makechain/jobfiles/
cp $REFERENCE_PATH makechain/jobfiles/ref.jobfile

mkdir -p makechain/output
cp $MODEL_PATH makechain/output/confusion.model.json

cd makechain
USE_MODEL="true" KNN_CONFUSION_ARGS="${ARGS}" make >> $LOG 2>> $LOG
cd ..

cat makechain/output/render.confusion.json

echo "" >> $LOG
echo "----------------------------------" >> $LOG
echo -e "ENDED:\c" >> $LOG
date >> $LOG
echo "----------------------------------" >> $LOG
