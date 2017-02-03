#!/bin/bash
curl -i -F "file=@$1" -F filename=$1 http://localhost:3003/upload
