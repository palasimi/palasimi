#!/usr/bin/env bash

# Creates a self-signed certificate for testing.

# Domain name to use in certificate.
DOMAIN_NAME="$1"

if [ "$DOMAIN_NAME" = "" ]; then
  echo "please specify a domain name"
  exit 1
fi

# See https://stackoverflow.com/a/41366949
openssl req -x509 -newkey rsa:4096 -sha256 -days 3650 -nodes \
  -keyout key.pem -out cert.pem -subj "/CN=$DOMAIN_NAME" \
  -addext "subjectAltName=DNS:$DOMAIN_NAME,DNS:$DOMAIN_NAME,IP:$DOMAIN_NAME"
