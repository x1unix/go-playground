#!/usr/bin/env sh
set -e

SVC_NAME='better-go-playground'
SVC_USER='go-playground'
DST_DIR='/opt/better-go-playground'

if [ "$(uname -s)" != "Linux" ]; then
  echo "ERROR: This installation script doesn't support $(uname -s). Only Linux systems are supported."
  exit 4
fi

echo ":: Creating a user '$SVC_USER'..."
useradd -m --system go-playground

echo ":: Copying files..."
cp -rfv ./target "$DST_DIR"
chown -R -v "$SVC_USER:$SVC_USER" "$DST_DIR"
chmod +x "$DST_DIR/playground"

echo ":: Installing service..."
cp -fv "./build/$SVC_NAME.service" /etc/systemd/system
systemctl daemon-reload

echo ":: Starting service..."
systemctl enable --now "$SVC_NAME"

echo "Installation finished. Use 'systemctl start|stop|restart|status $SVC_NAME' to start, stop or restart the service."
